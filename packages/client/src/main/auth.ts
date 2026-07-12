import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { AuthApi, defaultGitHubOAuthScopes, type GitHubAuthViewer } from '@oh-my-github/api'
import { clipboard, ipcMain, shell } from 'electron'
import {
  createEmptyAuthFile,
  getActiveAccount,
  normalizeStoredAuthFile,
  removeAccount,
  setActiveAccount,
  toAccountSummaries,
  upsertAccount,
  type AccountSummary,
  type AuthMethod,
  type StoredAccount,
  type StoredAuthFile
} from './auth-store'
import { resolveGitHubTransport } from './proxy'

export type { AccountSummary, AuthMethod, StoredAccount } from './auth-store'

export interface AuthState {
  isAuthenticated: boolean
  path: string
  auth: Omit<StoredAccount, 'accessToken'> | null
  accounts: AccountSummary[]
  hasGitHubClientId: boolean
}

export interface DeviceFlowResult {
  auth: AuthState
  sessionId: string
  userCode: string
  verificationUri: string
  verificationUriComplete?: string
}

const authPath = join(homedir(), '.oh-my-github', 'auth.json')
const pendingDeviceFlows = new Map<
  string,
  {
    clientId: string
    deviceCode: string
    expiresIn: number
    interval: number
    userCode: string
    verificationUri: string
    verificationUriComplete?: string
  }
>()

const authChangeListeners = new Set<() => void>()

export function onAuthChanged(listener: () => void): () => void {
  authChangeListeners.add(listener)
  return () => {
    authChangeListeners.delete(listener)
  }
}

export function isAuthenticated(): boolean {
  return getActiveAccount(readAuthFile()) !== null
}

function emitAuthChanged(): void {
  for (const listener of authChangeListeners) {
    listener()
  }
}

export function initializeAuth(): AuthState {
  return getAuthState()
}

export function getAuthenticatedAccessToken(): string {
  const account = getActiveAccount(readAuthFile())

  if (!account?.accessToken) {
    throw new Error('GitHub authentication is required')
  }

  return account.accessToken
}

export function getAuthenticatedViewerLogin(): string {
  const account = getActiveAccount(readAuthFile())

  if (!account?.viewer.login) {
    throw new Error('GitHub authentication is required')
  }

  return account.viewer.login
}

export function getAuthenticatedAuthMetadata(): Pick<StoredAccount, 'method' | 'scopes'> | null {
  const account = getActiveAccount(readAuthFile())

  if (!account) return null

  return {
    method: account.method,
    scopes: [...account.scopes]
  }
}

export function registerAuthIpc(): void {
  ipcMain.handle('auth:get', () => getAuthState())
  ipcMain.handle('auth:start-device-flow', () => startDeviceFlow())
  ipcMain.handle('auth:complete-device-flow', (_event, sessionId: string) =>
    completeDeviceFlow(sessionId)
  )
  ipcMain.handle('auth:copy-code-and-open-device-flow', (_event, sessionId: string) =>
    copyCodeAndOpenDeviceFlow(sessionId)
  )
  ipcMain.handle('auth:save-personal-token', (_event, token: string) => savePersonalToken(token))
  ipcMain.handle('auth:switch-account', (_event, accountId: number) => switchToAccount(accountId))
  ipcMain.handle('auth:logout', () => logoutActiveAccount())
}

function switchToAccount(accountId: number): AuthState {
  const file = readAuthFile()

  if (!file) {
    throw new Error('GitHub account was not found')
  }

  writeAuthFile(setActiveAccount(file, accountId))
  emitAuthChanged()
  return getAuthState()
}

function logoutActiveAccount(): AuthState {
  const file = readAuthFile()

  if (file && file.activeAccountId !== null) {
    writeAuthFile(removeAccount(file, file.activeAccountId))
    emitAuthChanged()
  }

  return getAuthState()
}

async function startDeviceFlow(): Promise<DeviceFlowResult> {
  const clientId = getGitHubClientId()

  if (!clientId) {
    throw new Error('OAUTH_CLIENT_ID is not configured')
  }

  const authApi = await createAuthApi()
  const authorization = await authApi.startDeviceAuthorization({
    clientId,
    scopes: [...defaultGitHubOAuthScopes]
  })

  const sessionId = randomUUID()
  pendingDeviceFlows.set(sessionId, {
    clientId,
    deviceCode: authorization.deviceCode,
    expiresIn: authorization.expiresIn,
    interval: authorization.interval,
    userCode: authorization.userCode,
    verificationUri: authorization.verificationUri,
    verificationUriComplete: authorization.verificationUriComplete
  })

  return {
    auth: getAuthState(),
    sessionId,
    userCode: authorization.userCode,
    verificationUri: authorization.verificationUri,
    verificationUriComplete: authorization.verificationUriComplete
  }
}

async function copyCodeAndOpenDeviceFlow(sessionId: string): Promise<void> {
  const flow = pendingDeviceFlows.get(sessionId)

  if (!flow) {
    throw new Error('GitHub device flow session was not found')
  }

  clipboard.writeText(flow.userCode)
  await shell.openExternal(flow.verificationUri)
}

async function completeDeviceFlow(sessionId: string): Promise<DeviceFlowResult> {
  const flow = pendingDeviceFlows.get(sessionId)

  if (!flow) {
    throw new Error('GitHub device flow session was not found')
  }

  try {
    const authApi = await createAuthApi()
    const token = await pollForToken({
      clientId: flow.clientId,
      deviceCode: flow.deviceCode,
      expiresIn: flow.expiresIn,
      interval: flow.interval,
      authApi
    })
    const viewer = await authApi.getViewer(token.accessToken)

    persistAccount({
      method: 'oauth_device',
      accessToken: token.accessToken,
      tokenType: token.tokenType,
      scopes: token.scopes.length > 0 ? token.scopes : [...defaultGitHubOAuthScopes],
      viewer
    })

    return {
      auth: getAuthState(),
      sessionId,
      userCode: flow.userCode,
      verificationUri: flow.verificationUri,
      verificationUriComplete: flow.verificationUriComplete
    }
  } finally {
    pendingDeviceFlows.delete(sessionId)
  }
}

async function savePersonalToken(token: string): Promise<AuthState> {
  const normalizedToken = token.trim()

  if (!normalizedToken) {
    throw new Error('GitHub token is required')
  }

  const authApi = await createAuthApi()
  const viewer = await authApi.getViewer(normalizedToken)

  persistAccount({
    method: 'personal_token',
    accessToken: normalizedToken,
    tokenType: 'bearer',
    scopes: [],
    viewer
  })

  return getAuthState()
}

function persistAccount(input: {
  method: AuthMethod
  accessToken: string
  tokenType: string
  scopes: string[]
  viewer: GitHubAuthViewer
}): void {
  const file = readAuthFile() ?? createEmptyAuthFile()
  writeAuthFile(upsertAccount(file, input, new Date().toISOString()))
  emitAuthChanged()
}

function getAuthState(): AuthState {
  const file = readAuthFile()
  const active = getActiveAccount(file)

  return {
    isAuthenticated: Boolean(active),
    path: authPath,
    auth: active ? sanitizeAccount(active) : null,
    accounts: toAccountSummaries(file),
    hasGitHubClientId: Boolean(getGitHubClientId())
  }
}

function readAuthFile(): StoredAuthFile | null {
  let raw: string

  try {
    raw = readFileSync(authPath, 'utf8')
  } catch (error) {
    if (isMissingFileError(error)) {
      return null
    }

    throw error
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    // 手工损坏的文件视为未登录;不主动删除,等下次登录写入时覆盖。
    return null
  }

  const file = normalizeStoredAuthFile(parsed)

  // v1 → v2 迁移后立刻写回,让磁盘与内存保持一致。
  if (file && (parsed as { schemaVersion?: unknown }).schemaVersion !== 2) {
    writeAuthFile(file)
  }

  return file
}

function writeAuthFile(file: StoredAuthFile): void {
  mkdirSync(dirname(authPath), { recursive: true })
  writeFileSync(authPath, `${JSON.stringify(file, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600
  })
  trySetPrivatePermissions()
}

function sanitizeAccount(account: StoredAccount): Omit<StoredAccount, 'accessToken'> {
  const { accessToken: _accessToken, ...safeAccount } = account
  return safeAccount
}

async function pollForToken(options: {
  clientId: string
  deviceCode: string
  expiresIn: number
  interval: number
  authApi: AuthApi
}): Promise<{ accessToken: string; tokenType: string; scopes: string[] }> {
  const expiresAt = Date.now() + options.expiresIn * 1000
  let interval = Math.max(options.interval, 1)

  while (Date.now() < expiresAt) {
    await delay(interval * 1000)

    const result = await options.authApi.pollDeviceAccessToken({
      clientId: options.clientId,
      deviceCode: options.deviceCode
    })

    if (result.status === 'success') {
      return {
        accessToken: result.accessToken,
        tokenType: result.tokenType,
        scopes: result.scopes
      }
    }

    if (result.status === 'failure') {
      throw new Error(result.description ?? result.reason)
    }

    if (result.reason === 'slow_down') {
      interval += result.interval ?? 5
    }
  }

  throw new Error('GitHub device authorization expired')
}

async function createAuthApi(): Promise<AuthApi> {
  return new AuthApi({ ...(await resolveGitHubTransport()) })
}

function getGitHubClientId(): string {
  return process.env.OAUTH_CLIENT_ID?.trim() ?? ''
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function trySetPrivatePermissions(): void {
  try {
    chmodSync(authPath, 0o600)
  } catch {
    // Best effort only; Windows and some filesystems may not support POSIX modes.
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ENOENT'
  )
}
