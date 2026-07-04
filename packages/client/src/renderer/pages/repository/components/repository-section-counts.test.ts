import { describe, expect, it } from 'vitest'
import {
  createRepositorySectionCountLabel,
  resolveRepositorySidebarCounts,
} from './repository-section-counts'

describe('createRepositorySectionCountLabel', () => {
  it('formats commits, pull requests, and issues counts for the repository sidebar', () => {
    const counts = {
      commits: 1200,
      openIssues: 7,
      openPullRequests: 3,
    }

    expect(createRepositorySectionCountLabel('commits', counts)).toBe('(1,200)')
    expect(createRepositorySectionCountLabel('pullRequests', counts)).toBe('(3)')
    expect(createRepositorySectionCountLabel('issues', counts)).toBe('(7)')
  })

  it('does not show unavailable counts or counts for unrelated sections', () => {
    const counts = {
      commits: null,
      openIssues: 7,
      openPullRequests: null,
    }

    expect(createRepositorySectionCountLabel('commits', counts)).toBeNull()
    expect(createRepositorySectionCountLabel('pullRequests', counts)).toBeNull()
    expect(createRepositorySectionCountLabel('issues', counts)).toBe('(7)')
    expect(createRepositorySectionCountLabel('overview', counts)).toBeNull()
    expect(createRepositorySectionCountLabel('files', counts)).toBeNull()
    expect(createRepositorySectionCountLabel('actions', counts)).toBeNull()
    expect(createRepositorySectionCountLabel('settingsGeneral', counts)).toBeNull()
  })

  it('uses independently loaded navigation counts before overview counts', () => {
    const navigationCounts = {
      commits: 20,
      openIssues: 2,
      openPullRequests: 1,
    }
    const overviewCounts = {
      commits: 1200,
      openIssues: 7,
      openPullRequests: 3,
    }

    expect(resolveRepositorySidebarCounts(navigationCounts, overviewCounts)).toBe(navigationCounts)
    expect(resolveRepositorySidebarCounts(null, overviewCounts)).toBe(overviewCounts)
  })
})
