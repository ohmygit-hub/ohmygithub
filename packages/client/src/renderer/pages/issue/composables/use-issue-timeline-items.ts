import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type {
  IssueActorSummary,
  IssueDetail,
  IssueReactionSummary,
  IssueTimelineEvent,
  IssueTimelineItem,
  IssueTimelineReference,
} from '../components/types'
import type { ConversationActor, ConversationReaction, ConversationTimelineEvent } from '../../../components'
import { computed, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CheckCircle2,
  CircleDot,
  Link2,
  MessageSquare,
  Pencil,
  RotateCcw,
  Tag,
  UserMinus,
  UserPlus,
} from 'lucide-vue-next'

export function useIssueTimelineItems(
  issue: MaybeRefOrGetter<IssueDetail | null | undefined>,
): ComputedRef<IssueTimelineItem[]> {
  const { t } = useI18n()

  return computed(() => {
    const currentIssue = toValue(issue)
    if (!currentIssue) return []

    const comments = (currentIssue.comments ?? []).map<IssueTimelineItem>((comment) => ({
      id: `comment-${comment.id}`,
      kind: 'comment',
      commentId: String(comment.id),
      actor: toConversationActor(comment.author) ?? { login: t('issue.values.unknown') },
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      badges: [],
      reactions: toConversationReactions(comment.reactions),
    }))

    const events = (currentIssue.timelineEvents ?? []).map<IssueTimelineItem>((event) => ({
      id: `event-${event.id}`,
      kind: 'event',
      event: toConversationEvent(event, t),
    }))

    return [...comments, ...events].sort((left, right) =>
      getTimelineTime(left) - getTimelineTime(right)
    )
  })
}

type Translate = ReturnType<typeof useI18n>['t']

function toConversationActor(actor: IssueActorSummary | null | undefined): ConversationActor | null {
  if (!actor?.login) return null

  return {
    login: actor.login,
    avatarUrl: actor.avatarUrl ?? undefined,
  }
}

function toConversationReactions(
  reactions: IssueReactionSummary[] | null | undefined,
): ConversationReaction[] {
  return (reactions ?? []).map((reaction) => ({
    content: reaction.content,
    count: reaction.count,
    viewerHasReacted: reaction.viewerHasReacted,
  }))
}

function toConversationEvent(event: IssueTimelineEvent, t: Translate): ConversationTimelineEvent {
  const eventConfig = timelineEventConfig(event)

  return {
    id: String(event.id),
    actor: toConversationActor(event.actor),
    createdAt: event.createdAt,
    icon: eventConfig.icon,
    iconClass: eventConfig.iconClass,
    text: timelineEventText(event, t),
  }
}

function timelineEventConfig(event: IssueTimelineEvent): Pick<ConversationTimelineEvent, 'icon' | 'iconClass'> {
  switch (event.type) {
    case 'assigned':
      return { icon: UserPlus, iconClass: 'text-success' }
    case 'unassigned':
      return { icon: UserMinus, iconClass: 'text-muted-foreground' }
    case 'labeled':
    case 'unlabeled':
      return { icon: Tag, iconClass: 'text-info' }
    case 'closed':
      return { icon: CheckCircle2, iconClass: 'text-success' }
    case 'reopened':
      return { icon: RotateCcw, iconClass: 'text-success' }
    case 'renamed':
      return { icon: Pencil, iconClass: 'text-muted-foreground' }
    case 'cross-referenced':
      return { icon: Link2, iconClass: 'text-info' }
    case 'mentioned':
      return { icon: MessageSquare, iconClass: 'text-muted-foreground' }
    default:
      return { icon: CircleDot, iconClass: 'text-muted-foreground' }
  }
}

function timelineEventText(event: IssueTimelineEvent, t: Translate): string {
  const fallback = event.text?.trim() || event.body?.trim() || t('issue.timeline.generic')

  switch (event.type) {
    case 'assigned':
      return t('issue.timeline.assigned', { target: event.assignee?.login ?? t('issue.values.unknown') })
    case 'unassigned':
      return t('issue.timeline.unassigned', { target: event.assignee?.login ?? t('issue.values.unknown') })
    case 'labeled':
      return t('issue.timeline.labeled', { label: labelName(event.label, t) })
    case 'unlabeled':
      return t('issue.timeline.unlabeled', { label: labelName(event.label, t) })
    case 'closed':
      return t('issue.timeline.closed')
    case 'reopened':
      return t('issue.timeline.reopened')
    case 'renamed':
      return t('issue.timeline.renamed', {
        from: event.from ?? t('issue.values.unknown'),
        to: event.to ?? t('issue.values.unknown'),
      })
    case 'cross-referenced':
      return t('issue.timeline.crossReferenced', { source: referenceText(event.source, t) })
    case 'mentioned':
      return t('issue.timeline.mentioned')
    default:
      return fallback
  }
}

function labelName(label: IssueTimelineEvent['label'], t: Translate): string {
  if (!label) return t('issue.values.unknown')
  if (typeof label === 'string') return label

  return label.name
}

function referenceText(source: IssueTimelineReference | string | null | undefined, t: Translate): string {
  if (!source) return t('issue.values.unknown')
  if (typeof source === 'string') return source

  const number = source.number ? `#${source.number}` : ''
  const repository = source.repository ? `${source.repository} ` : ''

  return `${repository}${number || source.title || t('issue.values.unknown')}`.trim()
}

function getTimelineTime(item: IssueTimelineItem): number {
  const value = item.kind === 'comment'
    ? item.createdAt
    : item.event.createdAt

  const timestamp = new Date(value ?? '').getTime()

  return Number.isNaN(timestamp) ? 0 : timestamp
}
