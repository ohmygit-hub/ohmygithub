import { describe, expect, it, vi } from 'vitest'
import { RequestError, type GitHubOctokit } from '../transport'
import { RepositoriesApi } from './repositories'

describe('RepositoriesApi overview', () => {
  it('loads navigation counts without loading repository overview documents', async () => {
    const { api, graphql, request } = createApi()

    const counts = await api.getNavigationCounts({
      owner: 'octo-org',
      repo: 'hello-world',
    })

    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('defaultBranchRef'), {
      owner: 'octo-org',
      repo: 'hello-world',
    })
    expect(request).not.toHaveBeenCalled()
    expect(counts).toEqual({
      commits: 42,
      openIssues: 5,
      openPullRequests: 4,
    })
  })

  it('includes the default branch commit count in repository counts', async () => {
    const { api, graphql } = createApi()

    const overview = await api.getOverview({
      owner: 'octo-org',
      repo: 'hello-world',
    })

    expect(graphql).toHaveBeenCalledWith(expect.stringContaining('defaultBranchRef'), {
      owner: 'octo-org',
      repo: 'hello-world',
    })
    expect(overview.counts.commits).toBe(42)
    expect(overview.counts.openIssues).toBe(5)
    expect(overview.counts.openPullRequests).toBe(4)
  })
})

function createApi() {
  const request = vi.fn(async (route: string) => {
    if (route === 'GET /repos/{owner}/{repo}') {
      return {
        data: {
          id: 1,
          name: 'hello-world',
          full_name: 'octo-org/hello-world',
          owner: { login: 'octo-org' },
          description: 'A test repository',
          homepage: '',
          html_url: 'https://github.com/octo-org/hello-world',
          visibility: 'public',
          fork: false,
          archived: false,
          is_template: false,
          default_branch: 'main',
          language: 'TypeScript',
          license: null,
          stargazers_count: 10,
          subscribers_count: 2,
          forks_count: 3,
          open_issues_count: 99,
          pushed_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
          topics: [],
        },
      }
    }

    if (route === 'GET /repos/{owner}/{repo}/languages') return { data: { TypeScript: 100 } }
    if (route === 'GET /repos/{owner}/{repo}/topics') return { data: { names: [] } }
    if (route === 'GET /repos/{owner}/{repo}/community/profile') return { data: { files: {} } }
    if (route === 'GET /repos/{owner}/{repo}/properties/values') return { data: [] }

    throw new RequestError('not found', 404, {
      request: {
        method: 'GET',
        url: route,
        headers: {},
      },
      response: {
        data: {},
        headers: {},
        status: 404,
        url: route,
      },
    })
  })
  const graphql = vi.fn(async (query: string) => {
    if (query.includes('RepositoryOverviewCounts')) {
      return {
        repository: {
          defaultBranchRef: {
            target: {
              history: {
                totalCount: 42,
              },
            },
          },
          issues: { totalCount: 5 },
          pullRequests: { totalCount: 4 },
          releases: { totalCount: 1 },
          branchRefs: { totalCount: 2 },
          tagRefs: { totalCount: 3 },
        },
      }
    }

    return {
      repository: {
        packages: { totalCount: 0 },
      },
    }
  })
  const api = new RepositoriesApi({ graphql, request } as unknown as GitHubOctokit)

  return { api, graphql, request }
}
