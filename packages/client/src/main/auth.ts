import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { AuthApi, defaultGitHubOAuthScopes, type GitHubAuthViewer } from '@oh-my-github/api'
import { clipboard, ipcMain, shell } from 'electron'
import { resolveGitHubProxyUrl } from './proxy'

export type AuthMethod = 'oauth_device' | 'personal_token'

export interface StoredAuth {
  schemaVersion: 1
  method: AuthMethod
  accessToken: string
  tokenType: string
  scopes: string[]
  viewer: GitHubAuthViewer
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  isAuthenticated: boolean
  path: string
  auth: Omit<StoredAuth, 'accessToken'> | null
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

export function initializeAuth(): AuthState {
  return getAuthState()
}

export function getAuthenticatedAccessToken(): string {
  const auth = readStoredAuth()

  if (!auth?.accessToken) {
    throw new Error('GitHub authentication is required')
  }

  return auth.accessToken
}

export function getAuthenticatedAuthMetadata(): Pick<StoredAuth, 'method' | 'scopes'> | null {
  const auth = readStoredAuth()

  if (!auth) return null

  return {
    method: auth.method,
    scopes: [...auth.scopes]
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
  ipcMain.handle('auth:logout', () => {
    rmSync(authPath, { force: true })
    return getAuthState()
  })
}

async function startDeviceFlow(): Promise<DeviceFlowResult> {
  const clientId = getGitHubClientId()

  if (!clientId) {
    throw new Error('GITHUB_CLIENT_ID is not configured')
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

    writeStoredAuth({
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

  writeStoredAuth({
    method: 'personal_token',
    accessToken: normalizedToken,
    tokenType: 'bearer',
    scopes: [],
    viewer
  })

  return getAuthState()
}

function getAuthState(): AuthState {
  const auth = readStoredAuth()

  return {
    isAuthenticated: Boolean(auth),
    path: authPath,
    auth: auth ? sanitizeAuth(auth) : null,
    hasGitHubClientId: Boolean(getGitHubClientId())
  }
}

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = readFileSync(authPath, 'utf8')
    return normalizeStoredAuth(JSON.parse(raw) as Partial<StoredAuth>)
  } catch (error) {
    if (isMissingFileError(error)) {
      return null
    }

    throw error
  }
}

function writeStoredAuth(input: {
  method: AuthMethod
  accessToken: string
  tokenType: string
  scopes: string[]
  viewer: GitHubAuthViewer
}): void {
  const now = new Date().toISOString()
  const previous = readStoredAuth()
  const auth: StoredAuth = {
    schemaVersion: 1,
    method: input.method,
    accessToken: input.accessToken,
    tokenType: input.tokenType,
    scopes: input.scopes,
    viewer: input.viewer,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now
  }

  mkdirSync(dirname(authPath), { recursive: true })
  writeFileSync(authPath, `${JSON.stringify(auth, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600
  })
  trySetPrivatePermissions()
}

function sanitizeAuth(auth: StoredAuth): Omit<StoredAuth, 'accessToken'> {
  const { accessToken: _accessToken, ...safeAuth } = auth
  return safeAuth
}

function normalizeStoredAuth(auth: Partial<StoredAuth>): StoredAuth {
  if (!auth.accessToken || !auth.viewer?.login) {
    throw new Error('Invalid auth.json')
  }

  return {
    schemaVersion: 1,
    method: auth.method === 'personal_token' ? 'personal_token' : 'oauth_device',
    accessToken: auth.accessToken,
    tokenType: auth.tokenType ?? 'bearer',
    scopes: Array.isArray(auth.scopes) ? auth.scopes : [],
    viewer: {
      id: Number(auth.viewer.id),
      login: auth.viewer.login,
      name: auth.viewer.name ?? null,
      avatarUrl: auth.viewer.avatarUrl ?? ''
    },
    createdAt: auth.createdAt ?? new Date().toISOString(),
    updatedAt: auth.updatedAt ?? new Date().toISOString()
  }
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
  return new AuthApi({ proxyUrl: await resolveGitHubProxyUrl() })
}

function getGitHubClientId(): string {
  return process.env.GITHUB_CLIENT_ID?.trim() ?? ''
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
