import { describe, expect, it } from 'vitest'
import { matchesReasonFilter, projectNotifications, resolveNotificationTarget } from './inbox-helpers'

function notification(overrides: Partial<GitHubNotification> = {}): GitHubNotification {
  return {
    id: '1',
    unread: true,
    reason: 'mention',
    updatedAt: '2026-06-30T10:00:00Z',
    subjectType: 'PullRequest',
    subjectTitle: 'Title',
    repositoryFullName: 'acme/widgets',
    repositoryHtmlUrl: 'https://github.com/acme/widgets',
    number: 7,
    htmlUrl: 'https://github.com/acme/widgets/pull/7',
    ...overrides,
  }
}

describe('resolveNotificationTarget', () => {
  it('routes pull requests to an internal workspace url', () => {
    expect(resolveNotificationTarget(notification())).toEqual({
      kind: 'internal',
      url: '/acme/widgets/pull/7',
    })
  })

  it('routes issues to an internal workspace url', () => {
    expect(resolveNotificationTarget(notification({ subjectType: 'Issue', number: 9 }))).toEqual({
      kind: 'internal',
      url: '/acme/widgets/issues/9',
    })
  })

  it('routes other subject types to the external html url', () => {
    const target = resolveNotificationTarget(
      notification({ subjectType: 'Commit', number: undefined, htmlUrl: 'https://github.com/acme/widgets/commit/abc' }),
    )
    expect(target).toEqual({ kind: 'external', url: 'https://github.com/acme/widgets/commit/abc' })
  })

  it('falls back to external when a pull request has no number', () => {
    const target = resolveNotificationTarget(notification({ number: undefined }))
    expect(target.kind).toBe('external')
  })
})

describe('projectNotifications', () => {
  it('hides removed notifications and marks read ones', () => {
    const list = [notification({ id: '1' }), notification({ id: '2' }), notification({ id: '3' })]
    const result = projectNotifications(list, {
      readIds: new Set(['2']),
      removedIds: new Set(['3']),
    })

    expect(result.map((n) => n.id)).toEqual(['1', '2'])
    expect(result.find((n) => n.id === '2')?.unread).toBe(false)
    expect(result.find((n) => n.id === '1')?.unread).toBe(true)
  })
})

describe('matchesReasonFilter', () => {
  it('matches every reason when no filter is set', () => {
    expect(matchesReasonFilter('ci_activity', null)).toBe(true)
  })

  it('matches assigned, review-requested and mentioned reasons', () => {
    expect(matchesReasonFilter('assign', 'assigned')).toBe(true)
    expect(matchesReasonFilter('review_requested', 'review-requested')).toBe(true)
    expect(matchesReasonFilter('team_mention', 'mentioned')).toBe(true)
    expect(matchesReasonFilter('mention', 'mentioned')).toBe(true)
  })

  it('rejects reasons that do not belong to the filter', () => {
    expect(matchesReasonFilter('ci_activity', 'assigned')).toBe(false)
  })
})
