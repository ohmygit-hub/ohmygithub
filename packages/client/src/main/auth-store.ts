import type { GitHubAuthViewer } from '@oh-my-github/api'

export type AuthMethod = 'oauth_device' | 'personal_token'

export interface StoredAccount {
  method: AuthMethod
  accessToken: string
  tokenType: string
  scopes: string[]
  viewer: GitHubAuthViewer
  createdAt: string
  updatedAt: string
}

export interface StoredAuthFile {
  schemaVersion: 2
  activeAccountId: number | null
  accounts: StoredAccount[]
}

export interface AccountSummary {
  id: number
  login: string
  name: string | null
  avatarUrl: string
  method: AuthMethod
}

export function createEmptyAuthFile(): StoredAuthFile {
  return { schemaVersion: 2, activeAccountId: null, accounts: [] }
}

export function normalizeStoredAuthFile(raw: unknown): StoredAuthFile | null {
  if (typeof raw !== 'object' || raw === null) return null

  const record = raw as Record<string, unknown>

  if (record.schemaVersion === 2) {
    const accounts = Array.isArray(record.accounts)
      ? record.accounts
          .map((entry) => normalizeStoredAccount(entry))
          .filter((account): account is StoredAccount => account !== null)
      : []
    const activeAccountId = typeof record.activeAccountId === 'number' ? record.activeAccountId : null

    return {
      schemaVersion: 2,
      activeAccountId: accounts.some((account) => account.viewer.id === activeAccountId)
        ? activeAccountId
        : null,
      accounts
    }
  }

  // v1(schemaVersion: 1 或缺失):账号字段直接在顶层,迁移为单账号的 v2 文件。
  const account = normalizeStoredAccount(record)

  if (!account) return null

  return { schemaVersion: 2, activeAccountId: account.viewer.id, accounts: [account] }
}

export function upsertAccount(
  file: StoredAuthFile,
  input: {
    method: AuthMethod
    accessToken: string
    tokenType: string
    scopes: string[]
    viewer: GitHubAuthViewer
  },
  now: string
): StoredAuthFile {
  const existing = file.accounts.find((account) => account.viewer.id === input.viewer.id)
  const account: StoredAccount = {
    method: input.method,
    accessToken: input.accessToken,
    tokenType: input.tokenType,
    scopes: input.scopes,
    viewer: input.viewer,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  }

  return {
    schemaVersion: 2,
    activeAccountId: input.viewer.id,
    accounts: existing
      ? file.accounts.map((entry) => (entry.viewer.id === input.viewer.id ? account : entry))
      : [...file.accounts, account]
  }
}

export function removeAccount(file: StoredAuthFile, accountId: number): StoredAuthFile {
  return {
    schemaVersion: 2,
    activeAccountId: file.activeAccountId === accountId ? null : file.activeAccountId,
    accounts: file.accounts.filter((account) => account.viewer.id !== accountId)
  }
}

export function setActiveAccount(file: StoredAuthFile, accountId: number): StoredAuthFile {
  if (!file.accounts.some((account) => account.viewer.id === accountId)) {
    throw new Error('GitHub account was not found')
  }

  return { ...file, activeAccountId: accountId }
}

export function getActiveAccount(file: StoredAuthFile | null): StoredAccount | null {
  if (!file || file.activeAccountId === null) return null

  return file.accounts.find((account) => account.viewer.id === file.activeAccountId) ?? null
}

export function toAccountSummaries(file: StoredAuthFile | null): AccountSummary[] {
  if (!file) return []

  return file.accounts.map((account) => ({
    id: account.viewer.id,
    login: account.viewer.login,
    name: account.viewer.name,
    avatarUrl: account.viewer.avatarUrl,
    method: account.method
  }))
}

function normalizeStoredAccount(raw: unknown): StoredAccount | null {
  if (typeof raw !== 'object' || raw === null) return null

  const record = raw as Record<string, unknown>
  const viewer = (typeof record.viewer === 'object' && record.viewer !== null ? record.viewer : {}) as Record<
    string,
    unknown
  >
  const accessToken = typeof record.accessToken === 'string' ? record.accessToken : ''
  const login = typeof viewer.login === 'string' ? viewer.login : ''
  const id = Number(viewer.id)

  if (!accessToken || !login || !Number.isFinite(id)) return null

  const now = new Date().toISOString()

  return {
    method: record.method === 'personal_token' ? 'personal_token' : 'oauth_device',
    accessToken,
    tokenType: typeof record.tokenType === 'string' ? record.tokenType : 'bearer',
    scopes: Array.isArray(record.scopes)
      ? record.scopes.filter((scope): scope is string => typeof scope === 'string')
      : [],
    viewer: {
      id,
      login,
      name: typeof viewer.name === 'string' ? viewer.name : null,
      avatarUrl: typeof viewer.avatarUrl === 'string' ? viewer.avatarUrl : ''
    },
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : now,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : now
  }
}
