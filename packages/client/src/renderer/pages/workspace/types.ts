import type { Component } from 'vue'

export type WorkspaceMessageParams = Record<string, string | number>

export interface WorkspaceNavItem {
  id: string
  labelKey: string
  icon: Component
}

export interface WorkspaceNavGroup {
  id: string
  labelKey: string
  items: WorkspaceNavItem[]
}

export interface WorkspacePanelStat {
  id: string
  labelKey: string
  valueKey: string
}

export interface WorkspacePanelBlock {
  id: string
  titleKey: string
  descriptionKey: string
  metaKey: string
}

export interface WorkspaceTab {
  id: string
  titleKey: string
  titleParams?: WorkspaceMessageParams
  icon: Component
  eyebrowKey: string
  headingKey: string
  descriptionKey: string
  stats: WorkspacePanelStat[]
  blocks: WorkspacePanelBlock[]
}
