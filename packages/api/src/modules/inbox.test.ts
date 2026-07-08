import { describe, expect, it, vi } from 'vitest'
import type { GitHubOctokit } from '../transport'
import { InboxApi, notificationHtmlUrl, parseSubjectNumber } from './inbox'

function createApi(notifications: unknown[]) {
  const listNotificationsForAuthenticatedUser = vi.fn().mockResolvedValue({ data: notifications })
  const paginate = vi.fn().mockResolvedValue(notifications)
  const api = new InboxApi({
    paginate,
    rest: {
      activity: { listNotificationsForAuthenticatedUser },
    },
  } as unknown as GitHubOctokit)

  return { api, paginate, listNotificationsForAuthenticatedUser }
}

const pullRequestNotification = {
  id: '42',
  unread: true,
  reason: 'review_requested',
  updated_at: '2026-06-30T10:00:00Z',
  subject: {
    title: 'Add inbox page',
    type: 'PullRequest',
    url: 'https://api.github.com/repos/acme/widgets/pulls/7',
    latest_comment_url: null,
  },
  repository: { full_name: 'acme/widgets', html_url: 'https://github.com/acme/widgets' },
}

describe('notificationHtmlUrl', () => {
  it('maps pull request subject urls to github.com pull links', () => {
    expect(
      notificationHtmlUrl('https://api.github.com/repos/acme/widgets/pulls/7', 'https://github.com/acme/widgets'),
    ).toBe('https://github.com/acme/widgets/pull/7')
  })

  it('keeps issue subject urls as issues', () => {
    expect(
      notificationHtmlUrl('https://api.github.com/repos/acme/widgets/issues/9', 'https://github.com/acme/widgets'),
    ).toBe('https://github.com/acme/widgets/issues/9')
  })

  it('maps commit subject urls to github.com commit links', () => {
    expect(
      notificationHtmlUrl('https://api.github.com/repos/acme/widgets/commits/abc123', 'https://github.com/acme/widgets'),
    ).toBe('https://github.com/acme/widgets/commit/abc123')
  })

  it('falls back to the repository html url for unknown or missing subject urls', () => {
    expect(notificationHtmlUrl(null, 'https://github.com/acme/widgets')).toBe('https://github.com/acme/widgets')
    expect(
      notificationHtmlUrl('https://api.github.com/repos/acme/widgets/releases/5', 'https://github.com/acme/widgets'),
    ).toBe('https://github.com/acme/widgets')
  })
})

describe('parseSubjectNumber', () => {
  it('extracts the number from pull and issue urls', () => {
    expect(parseSubjectNumber('https://api.github.com/repos/acme/widgets/pulls/7')).toBe(7)
    expect(parseSubjectNumber('https://api.github.com/repos/acme/widgets/issues/9')).toBe(9)
  })

  it('returns undefined for non-numbered urls', () => {
    expect(parseSubjectNumber(undefined)).toBeUndefined()
    expect(parseSubjectNumber('https://api.github.com/repos/acme/widgets/commits/abc123')).toBeUndefined()
  })
})

describe('InboxApi.listInboxNotifications', () => {
  it('maps notification threads into GitHubNotification objects', async () => {
    const { api } = createApi([pullRequestNotification])
    const [notification] = await api.listInboxNotifications()

    expect(notification).toEqual({
      id: '42',
      unread: true,
      reason: 'review_requested',
      updatedAt: '2026-06-30T10:00:00Z',
      subjectType: 'PullRequest',
      subjectTitle: 'Add inbox page',
      repositoryFullName: 'acme/widgets',
      repositoryHtmlUrl: 'https://github.com/acme/widgets',
      number: 7,
      htmlUrl: 'https://github.com/acme/widgets/pull/7',
    })
  })

  it('passes all and participating options through to the request', async () => {
    const { api, listNotificationsForAuthenticatedUser } = createApi([])
    await api.listInboxNotifications({ all: true, participating: true, limit: 10 })

    expect(listNotificationsForAuthenticatedUser).toHaveBeenCalledWith({
      all: true,
      participating: true,
      per_page: 10,
    })
  })
})

describe('InboxApi triage', () => {
  function createTriageApi() {
    const markThreadAsRead = vi.fn().mockResolvedValue({ data: {} })
    const markNotificationsAsRead = vi.fn().mockResolvedValue({ data: {} })
    const markThreadAsDone = vi.fn().mockResolvedValue({ data: {} })
    const setThreadSubscription = vi.fn().mockResolvedValue({ data: {} })
    const api = new InboxApi({
      rest: {
        activity: {
          markThreadAsRead,
          markNotificationsAsRead,
          markThreadAsDone,
          setThreadSubscription,
        },
      },
    } as unknown as GitHubOctokit)

    return { api, markThreadAsRead, markNotificationsAsRead, markThreadAsDone, setThreadSubscription }
  }

  it('marks a single thread as read with a numeric thread id', async () => {
    const { api, markThreadAsRead } = createTriageApi()
    await api.markThreadAsRead('42')
    expect(markThreadAsRead).toHaveBeenCalledWith({ thread_id: 42 })
  })

  it('marks all notifications as read', async () => {
    const { api, markNotificationsAsRead } = createTriageApi()
    await api.markAllAsRead()
    expect(markNotificationsAsRead).toHaveBeenCalledWith({})
  })

  it('marks a thread as done', async () => {
    const { api, markThreadAsDone } = createTriageApi()
    await api.markThreadAsDone('42')
    expect(markThreadAsDone).toHaveBeenCalledWith({ thread_id: 42 })
  })

  it('unsubscribes by ignoring the thread subscription', async () => {
    const { api, setThreadSubscription } = createTriageApi()
    await api.unsubscribe('42')
    expect(setThreadSubscription).toHaveBeenCalledWith({ thread_id: 42, ignored: true })
  })
})
