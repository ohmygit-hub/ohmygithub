import type { Component } from 'vue'

export type WorkspaceMessageParams = Record<string, string | number>

export type WorkspaceTabType =
  | 'inbox'
  | 'reviews'
  | 'activity'
  | 'draft'
  | 'account'
  | 'org'
  | 'repo'

export interface WorkspaceNavItem {
  id: string
  labelKey: string
  icon: Component
  url: string
}

export interface WorkspaceNavGroup {
  id: string
  labelKey: string
  items: WorkspaceNavItem[]
}

export interface WorkspacePanelStat {
  id: string
  labelKey: string
  value?: string
  valueKey?: string
}

export interface WorkspacePanelBlock {
  id: string
  titleKey: string
  descriptionKey: string
  metaKey: string
}

export interface WorkspaceTab {
  url: string
  type: WorkspaceTabType
  title: string
  owner?: string
  repo?: string
  draftId?: string
}

export interface WorkspaceTabView {
  tab: WorkspaceTab
  icon: Component
  titleKey?: string
  titleParams?: WorkspaceMessageParams
  title: string
  eyebrowKey: string
  headingKey: string
  headingParams?: WorkspaceMessageParams
  descriptionKey: string
  descriptionParams?: WorkspaceMessageParams
  stats: WorkspacePanelStat[]
  blocks: WorkspacePanelBlock[]
}
