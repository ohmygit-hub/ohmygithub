import { describe, expect, it } from 'vitest'
import { normalizePins } from './pins'

function repository(nameWithOwner: string): Record<string, unknown> {
  const [owner, name] = nameWithOwner.split('/')

  return {
    id: 1,
    name,
    nameWithOwner,
    owner,
    url: `https://github.com/${nameWithOwner}`
  }
}

describe('normalizePins', () => {
  it('keeps valid organization logins in order', () => {
    expect(normalizePins({ version: 1, organizations: ['vuejs', 'electron'] })).toEqual({
      version: 1,
      organizations: ['vuejs', 'electron'],
      repositoryPins: {}
    })
  })

  it('returns defaults for non-record payloads', () => {
    expect(normalizePins(null)).toEqual({ version: 1, organizations: [], repositoryPins: {} })
    expect(normalizePins('vuejs')).toEqual({ version: 1, organizations: [], repositoryPins: {} })
    expect(normalizePins([['vuejs']])).toEqual({ version: 1, organizations: [], repositoryPins: {} })
  })

  it('returns defaults when organizations is not an array', () => {
    expect(normalizePins({ version: 1, organizations: 'vuejs' })).toEqual({
      version: 1,
      organizations: [],
      repositoryPins: {}
    })
    expect(normalizePins({ version: 1 })).toEqual({ version: 1, organizations: [], repositoryPins: {} })
  })

  it('drops non-string and blank entries', () => {
    expect(normalizePins({ version: 1, organizations: ['vuejs', 42, null, '  ', 'electron'] })).toEqual({
      version: 1,
      organizations: ['vuejs', 'electron'],
      repositoryPins: {}
    })
  })

  it('dedupes logins keeping the first occurrence', () => {
    expect(normalizePins({ version: 1, organizations: ['vuejs', 'electron', 'vuejs'] })).toEqual({
      version: 1,
      organizations: ['vuejs', 'electron'],
      repositoryPins: {}
    })
  })

  it('keeps valid repository pins under lowercased logins', () => {
    const pins = normalizePins({
      version: 1,
      organizations: [],
      repositoryPins: { Acbox: [repository('acbox/oh-my-github')] }
    })

    expect(pins.repositoryPins).toEqual({ acbox: [repository('acbox/oh-my-github')] })
  })

  it('drops malformed repository entries and empty logins', () => {
    const pins = normalizePins({
      version: 1,
      organizations: [],
      repositoryPins: {
        acbox: [repository('acbox/oh-my-github'), { nameWithOwner: '  ' }, 'oh-my-github', null],
        '  ': [repository('acbox/oh-my-github')],
        empty: []
      }
    })

    expect(pins.repositoryPins).toEqual({ acbox: [repository('acbox/oh-my-github')] })
  })

  it('dedupes repository pins by nameWithOwner and caps them at six', () => {
    const repositories = [
      repository('acbox/one'),
      repository('acbox/one'),
      ...['two', 'three', 'four', 'five', 'six', 'seven'].map((name) => repository(`acbox/${name}`))
    ]
    const pins = normalizePins({ version: 1, organizations: [], repositoryPins: { acbox: repositories } })

    expect(pins.repositoryPins.acbox).toHaveLength(6)
    expect(pins.repositoryPins.acbox.map((entry) => entry.name)).toEqual([
      'one',
      'two',
      'three',
      'four',
      'five',
      'six'
    ])
  })
})
