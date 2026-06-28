import type { Component } from 'vue'

export type RepositorySectionId =
  | 'overview'
  | 'files'
  | 'pullRequests'
  | 'issues'
  | 'actions'
  | 'settings'

export interface RepositorySection {
  id: RepositorySectionId
  icon: Component
}

export interface RepositoryOverviewInfoItem {
  id: string
  icon: Component
  label: string
  value: string
  href?: string
}
