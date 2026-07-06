import { describe, expect, it } from 'vitest'
import {
  createEmptyAuthFile,
  getActiveAccount,
  normalizeStoredAuthFile,
  removeAccount,
  setActiveAccount,
  toAccountSummaries,
  upsertAccount,
  type StoredAuthFile,
} from './auth-store'

const NOW = '2026-07-06T00:00:00.000Z'
const LATER = '2026-07-06T12:00:00.000Z'

function makeViewer(id: number, login: string) {
  return { id, login, name: `Name ${login}`, avatarUrl: `https://avatars.example/${login}` }
}

function makeInput(id: number, login: string) {
  return {
    method: 'oauth_device' as const,
    accessToken: `token-${login}`,
    tokenType: 'bearer',
    scopes: ['repo'],
    viewer: makeViewer(id, login),
  }
}

function makeFile(): StoredAuthFile {
  let file = createEmptyAuthFile()
  file = upsertAccount(file, makeInput(1, 'alice'), NOW)
  file = upsertAccount(file, makeInput(2, 'bob'), NOW)
  return file
}

describe('normalizeStoredAuthFile', () => {
  it('migrates a v1 single-account file to v2', () => {
    const v1 = {
      schemaVersion: 1,
      method: 'personal_token',
      accessToken: 'token-alice',
      tokenType: 'bearer',
      scopes: [],
      viewer: makeViewer(1, 'alice'),
      createdAt: NOW,
      updatedAt: NOW,
    }

    const file = normalizeStoredAuthFile(v1)

    expect(file).toEqual({
      schemaVersion: 2,
      activeAccountId: 1,
      accounts: [
        {
          method: 'personal_token',
          accessToken: 'token-alice',
          tokenType: 'bearer',
          scopes: [],
          viewer: makeViewer(1, 'alice'),
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
    })
  })

  it('parses a v2 file and drops invalid account entries', () => {
    const file = normalizeStoredAuthFile({
      schemaVersion: 2,
      activeAccountId: 2,
      accounts: [
        { method: 'oauth_device', accessToken: '', viewer: makeViewer(1, 'alice') },
        {
          method: 'oauth_device',
          accessToken: 'token-bob',
          tokenType: 'bearer',
          scopes: ['repo'],
          viewer: makeViewer(2, 'bob'),
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
    })

    expect(file?.accounts.map((account) => account.viewer.login)).toEqual(['bob'])
    expect(file?.activeAccountId).toBe(2)
  })

  it('nulls activeAccountId when it matches no account', () => {
    const file = normalizeStoredAuthFile({
      schemaVersion: 2,
      activeAccountId: 99,
      accounts: [
        {
          method: 'oauth_device',
          accessToken: 'token-alice',
          tokenType: 'bearer',
          scopes: [],
          viewer: makeViewer(1, 'alice'),
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
    })

    expect(file?.activeAccountId).toBeNull()
  })

  it('returns null for corrupt input', () => {
    expect(normalizeStoredAuthFile(null)).toBeNull()
    expect(normalizeStoredAuthFile('nope')).toBeNull()
    expect(normalizeStoredAuthFile({ schemaVersion: 1 })).toBeNull()
    expect(normalizeStoredAuthFile({ schemaVersion: 1, accessToken: 'x' })).toBeNull()
  })
})

describe('upsertAccount', () => {
  it('appends a new account and makes it active', () => {
    const file = upsertAccount(createEmptyAuthFile(), makeInput(1, 'alice'), NOW)

    expect(file.activeAccountId).toBe(1)
    expect(file.accounts).toHaveLength(1)
    expect(file.accounts[0]).toMatchObject({ createdAt: NOW, updatedAt: NOW })
  })

  it('updates an existing account in place, preserving createdAt', () => {
    const first = upsertAccount(createEmptyAuthFile(), makeInput(1, 'alice'), NOW)
    const second = upsertAccount(
      first,
      { ...makeInput(1, 'alice'), accessToken: 'token-rotated', method: 'personal_token' },
      LATER
    )

    expect(second.accounts).toHaveLength(1)
    expect(second.accounts[0]).toMatchObject({
      accessToken: 'token-rotated',
      method: 'personal_token',
      createdAt: NOW,
      updatedAt: LATER,
    })
    expect(second.activeAccountId).toBe(1)
  })
})

describe('removeAccount', () => {
  it('removes the active account and nulls the active pointer', () => {
    const file = removeAccount({ ...makeFile(), activeAccountId: 1 }, 1)

    expect(file.accounts.map((account) => account.viewer.id)).toEqual([2])
    expect(file.activeAccountId).toBeNull()
  })

  it('keeps the active pointer when removing another account', () => {
    const file = removeAccount({ ...makeFile(), activeAccountId: 2 }, 1)

    expect(file.accounts.map((account) => account.viewer.id)).toEqual([2])
    expect(file.activeAccountId).toBe(2)
  })
})

describe('setActiveAccount', () => {
  it('switches the active pointer to a stored account', () => {
    const file = setActiveAccount({ ...makeFile(), activeAccountId: 2 }, 1)

    expect(file.activeAccountId).toBe(1)
  })

  it('throws for an unknown account id', () => {
    expect(() => setActiveAccount(makeFile(), 99)).toThrowError()
  })
})

describe('getActiveAccount / toAccountSummaries', () => {
  it('resolves the active account and returns null otherwise', () => {
    expect(getActiveAccount(null)).toBeNull()
    expect(getActiveAccount({ ...makeFile(), activeAccountId: null })).toBeNull()
    expect(getActiveAccount({ ...makeFile(), activeAccountId: 2 })?.viewer.login).toBe('bob')
  })

  it('summarizes accounts without leaking tokens', () => {
    const summaries = toAccountSummaries(makeFile())

    expect(summaries).toEqual([
      { id: 1, login: 'alice', name: 'Name alice', avatarUrl: 'https://avatars.example/alice', method: 'oauth_device' },
      { id: 2, login: 'bob', name: 'Name bob', avatarUrl: 'https://avatars.example/bob', method: 'oauth_device' },
    ])
    expect(toAccountSummaries(null)).toEqual([])
  })
})
