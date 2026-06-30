import { describe, expect, it } from 'vitest'
import { mapIssueRelationships } from './issues'

describe('mapIssueRelationships', () => {
  it('maps parent, sub-issues, and tracked issues', () => {
    const result = mapIssueRelationships({
      parent: { id: 'p1', number: 1, title: 'Epic', state: 'OPEN', url: 'https://x/issues/1' },
      subIssues: { nodes: [{ id: 's1', number: 2, title: 'Sub', state: 'CLOSED', url: 'https://x/issues/2' }] },
      trackedIssues: { nodes: [{ id: 't1', number: 3, title: 'Tracked', state: 'OPEN', url: 'https://x/issues/3' }] }
    })
    expect(result).toEqual({
      parent: { id: 'p1', number: 1, title: 'Epic', state: 'OPEN', url: 'https://x/issues/1' },
      subIssues: [{ id: 's1', number: 2, title: 'Sub', state: 'CLOSED', url: 'https://x/issues/2' }],
      tracked: [{ id: 't1', number: 3, title: 'Tracked', state: 'OPEN', url: 'https://x/issues/3' }]
    })
  })

  it('returns empty structure when there are no relationships', () => {
    expect(mapIssueRelationships({})).toEqual({ parent: null, subIssues: [], tracked: [] })
  })
})
