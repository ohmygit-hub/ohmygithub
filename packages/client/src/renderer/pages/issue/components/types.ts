import type {
  ConversationActor,
  ConversationBadge,
  ConversationReaction,
  ConversationTimelineEvent,
  ConversationTimelineItem as SharedConversationTimelineItem,
} from '../../../components'

export interface IssueActorSummary {
  login: string
  avatarUrl?: string
  url?: string | null
}

export interface IssueLabelSummary {
  id?: string | number
  name: string
  color?: string | null
  description?: string | null
}

export interface IssueMilestoneSummary {
  title: string
  dueOn?: string | null
  state?: string | null
  url?: string | null
}

export interface IssueLinkedWorkSummary {
  id: string | number
  title: string
  number?: number
  state?: string | null
  type?: string | null
  url?: string | null
}

export interface IssueDevelopmentSummary {
  branches?: number | null
  commits?: number | null
  pullRequests?: IssueLinkedWorkSummary[]
}

export interface IssueReactionSummary {
  content: string
  count: number
  viewerHasReacted?: boolean
}

export interface IssueTimelineComment {
  id: string | number
  author: IssueActorSummary
  body: string
  createdAt: string
  updatedAt?: string | null
  authorAssociation?: string | null
  reactions?: IssueReactionSummary[]
  url?: string | null
}

export interface IssueTimelineReference {
  type?: string | null
  repository?: string | null
  number?: number | null
  title?: string | null
  url?: string | null
}

export interface IssueTimelineEvent {
  id: string | number
  type: string
  actor?: IssueActorSummary | null
  createdAt: string
  text?: string | null
  label?: IssueLabelSummary | string | null
  milestone?: IssueMilestoneSummary | string | null
  source?: IssueTimelineReference | string | null
  assignee?: IssueActorSummary | null
  from?: string | null
  to?: string | null
  body?: string | null
  url?: string | null
}

export type IssueTimelineItem =
  | SharedConversationTimelineItem & {
      id: string
      kind: 'comment'
      commentId: string
      actor: ConversationActor
      body: string
      createdAt?: string | null
      updatedAt?: string | null
      badges: ConversationBadge[]
      reactions: ConversationReaction[]
    }
  | SharedConversationTimelineItem & {
      id: string
      kind: 'event'
      event: ConversationTimelineEvent
    }

export interface IssueDetail {
  id: string | number
  owner: string
  repo: string
  repository: string
  number: number
  title: string
  state: GitHubIssueState | string
  author: IssueActorSummary
  body?: string | null
  createdAt?: string | null
  updatedAt: string
  closedAt?: string | null
  labels: Array<IssueLabelSummary | string>
  assignees?: IssueActorSummary[]
  milestone?: IssueMilestoneSummary | null
  participants?: IssueActorSummary[]
  comments?: IssueTimelineComment[]
  timelineEvents?: IssueTimelineEvent[]
  reactions?: IssueReactionSummary[]
  development?: IssueDevelopmentSummary | null
  linkedWork?: IssueLinkedWorkSummary[]
  url: string
  hasUpdates?: boolean
}
