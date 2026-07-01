import { createReferenceWorkspaceUrl } from '../../components/github/github-reference'

export type NotificationTarget =
  | { kind: 'internal', url: string }
  | { kind: 'external', url: string }

export function resolveNotificationTarget(notification: GitHubNotification): NotificationTarget {
  const [owner, repo] = notification.repositoryFullName.split('/')

  if (owner && repo && typeof notification.number === 'number') {
    if (notification.subjectType === 'PullRequest') {
      return { kind: 'internal', url: createReferenceWorkspaceUrl(owner, repo, 'pull-request', notification.number) }
    }

    if (notification.subjectType === 'Issue') {
      return { kind: 'internal', url: createReferenceWorkspaceUrl(owner, repo, 'issue', notification.number) }
    }
  }

  return { kind: 'external', url: notification.htmlUrl }
}

export interface NotificationOverlay {
  readIds: Set<string>
  removedIds: Set<string>
}

export function projectNotifications(
  notifications: GitHubNotification[],
  overlay: NotificationOverlay,
): GitHubNotification[] {
  return notifications
    .filter((notification) => !overlay.removedIds.has(notification.id))
    .map((notification) =>
      overlay.readIds.has(notification.id) ? { ...notification, unread: false } : notification,
    )
}

export type ReasonFilterKey = 'assigned' | 'participating' | 'review-requested' | 'mentioned'

export const REASON_FILTER_KEYS: ReasonFilterKey[] = [
  'assigned',
  'participating',
  'review-requested',
  'mentioned',
]

const REASON_FILTER_MATCHERS: Record<ReasonFilterKey, (reason: string) => boolean> = {
  'assigned': (reason) => reason === 'assign',
  'review-requested': (reason) => reason === 'review_requested',
  'mentioned': (reason) => reason === 'mention' || reason === 'team_mention',
  'participating': (reason) => ['comment', 'author', 'manual', 'state_change', 'mention'].includes(reason),
}

export function matchesReasonFilter(reason: string, filter: ReasonFilterKey | null): boolean {
  if (!filter) {
    return true
  }

  return REASON_FILTER_MATCHERS[filter](reason)
}
