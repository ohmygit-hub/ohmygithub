import type { BadgeVariants } from '@oh-my-github/ui'
import type { Component } from 'vue'

export interface ConversationActor {
  login: string
  avatarUrl?: string | null
}

export interface ConversationReaction {
  content: string
  count: number
  viewerHasReacted?: boolean
}

export interface ConversationBadge {
  id: string | number
  label: string
  variant?: BadgeVariants['variant']
}

export interface ConversationReference {
  owner: string
  repo: string
  number: number
  kindHint?: GitHubRepositoryReferenceKind
  title?: string | null
  state?: GitHubRepositoryReferenceState | null
  kind?: GitHubRepositoryReferenceKind | null
  url?: string | null
}

export interface ConversationComment {
  id?: string | number
  actor?: ConversationActor | null
  author?: ConversationActor | null
  body?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  badges?: ConversationBadge[]
  reactions?: ConversationReaction[]
}

export interface ConversationCommentActionPayload {
  comment?: ConversationComment
  commentId?: string
}

export interface ConversationCommentSavePayload extends ConversationCommentActionPayload {
  body: string
}

export interface ConversationCommentActionLabels {
  actions?: string
  cancel?: string
  delete?: string
  edit?: string
  emptyPreview?: string
  input?: string
  placeholder?: string
  preview?: string
  save?: string
  write?: string
}

export interface ConversationTimelineEvent {
  id: string | number
  icon?: Component
  iconClass?: string
  text: string
  actor?: ConversationActor | null
  createdAt?: string | null
  url?: string | null
  reference?: ConversationReference | null
}

export interface ConversationTimelineItem {
  id: string | number
}
