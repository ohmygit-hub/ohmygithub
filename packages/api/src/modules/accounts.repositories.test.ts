import { describe, expect, it, vi } from 'vitest'
import type { GitHubOctokit } from '../transport'
import { AccountsApi } from './accounts'

function repoNode(id: number, owner: string, name: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name,
    full_name: `${owner}/${name}`,
    owner: { login: owner },
    description: `${name} desc`,
    private: id % 2 === 0,
    updated_at: '2026-07-01T00:00:00Z',
    html_url: `https://github.com/${owner}/${name}`,
    ...overrides,
  }
}

function createPaginatingApi(pages: unknown[][]) {
  const listForAuthenticatedUser = vi.fn()
  const iterator = vi.fn(() => ({
    async *[Symbol.asyncIterator]() {
      for (const data of pages) yield { data }
    },
  }))
  const api = new AccountsApi({
    rest: { repos: { listForAuthenticatedUser } },
    paginate: { iterator },
  } as unknown as GitHubOctokit)

  return { api, iterator, listForAuthenticatedUser }
}

describe('AccountsApi.listAllViewerRepositories', () => {
  it('aggregates every page with the viewer affiliation and maps to GitHubRepository', async () => {
    const { api, iterator, listForAuthenticatedUser } = createPaginatingApi([
      [repoNode(1, 'acbox', 'a'), repoNode(2, 'acbox', 'b')],
      [repoNode(3, 'vuejs', 'core')],
    ])

    const repositories = await api.listAllViewerRepositories()

    expect(iterator).toHaveBeenCalledWith(listForAuthenticatedUser, {
      visibility: 'all',
      affiliation: 'owner,collaborator,organization_member',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
    })
    expect(repositories).toHaveLength(3)
    expect(repositories[0]).toEqual({
      id: 1,
      name: 'a',
      nameWithOwner: 'acbox/a',
      owner: 'acbox',
      description: 'a desc',
      isPrivate: false,
      updatedAt: '2026-07-01T00:00:00Z',
      url: 'https://github.com/acbox/a',
    })
    expect(repositories[1].isPrivate).toBe(true)
    expect(repositories[2].nameWithOwner).toBe('vuejs/core')
  })

  it('caps aggregation at 10 pages to bound large-org membership', async () => {
    const pages = Array.from({ length: 12 }, (_, index) => [repoNode(index + 1, 'acbox', `r${index}`)])
    const { api } = createPaginatingApi(pages)

    const repositories = await api.listAllViewerRepositories()

    expect(repositories).toHaveLength(10)
    expect(repositories.at(-1)?.nameWithOwner).toBe('acbox/r9')
  })
})
