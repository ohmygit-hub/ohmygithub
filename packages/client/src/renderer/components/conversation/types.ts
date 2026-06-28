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

export interface ConversationTimelineEvent {
  id: string | number
  icon?: Component
  iconClass?: string
  text: string
  actor?: ConversationActor | null
  createdAt?: string | null
}

export interface ConversationTimelineItem {
  id: string | number
}
