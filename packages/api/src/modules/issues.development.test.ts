import { describe, expect, it } from 'vitest'
import { mapIssueDevelopment } from './issues'

describe('mapIssueDevelopment', () => {
  it('maps closing PR references and branch count', () => {
    const result = mapIssueDevelopment({
      linkedBranches: { nodes: [{ id: 'b1', ref: { name: 'feat/x' } }] },
      closedByPullRequestsReferences: {
        nodes: [{ id: 'pr1', number: 12, title: 'Fix', state: 'OPEN', url: 'https://x/pull/12' }]
      }
    })
    expect(result).toEqual({
      branches: 1,
      commits: null,
      pullRequests: [{ id: 'pr1', number: 12, title: 'Fix', state: 'OPEN', url: 'https://x/pull/12' }]
    })
  })

  it('returns null when there is no development data', () => {
    expect(mapIssueDevelopment({})).toBeNull()
    expect(
      mapIssueDevelopment({ linkedBranches: { nodes: [] }, closedByPullRequestsReferences: { nodes: [] } })
    ).toBeNull()
  })
})
