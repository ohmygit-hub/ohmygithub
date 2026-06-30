import { describe, expect, it, vi } from 'vitest'
import type { GitHubOctokit } from '../transport'
import { IssuesApi } from './issues'

describe('IssuesApi mutations', () => {
  it('updates issue title, body, and completed state reason', async () => {
    const { api, update } = createApi()

    await api.updateIssue({
      owner: 'octo-org',
      repo: 'hello-world',
      number: 12,
      title: 'Updated title',
      body: 'Updated body',
      state: 'closed',
      stateReason: 'completed',
    })

    expect(update).toHaveBeenCalledWith({
      owner: 'octo-org',
      repo: 'hello-world',
      issue_number: 12,
      title: 'Updated title',
      body: 'Updated body',
      state: 'closed',
      state_reason: 'completed',
    })
  })

  it('updates issue comments by numeric id', async () => {
    const { api, updateComment } = createApi()

    await api.updateIssueComment({
      owner: 'octo-org',
      repo: 'hello-world',
      commentId: 'issue-comment:123456',
      body: 'Edited comment',
    })

    expect(updateComment).toHaveBeenCalledWith({
      owner: 'octo-org',
      repo: 'hello-world',
      comment_id: 123456,
      body: 'Edited comment',
    })
  })
})

function createApi() {
  const update = vi.fn().mockResolvedValue({ data: {} })
  const updateComment = vi.fn().mockResolvedValue({ data: {} })
  const api = new IssuesApi({
    rest: {
      issues: {
        update,
        updateComment,
      },
    },
  } as unknown as GitHubOctokit)

  return { api, update, updateComment }
}
