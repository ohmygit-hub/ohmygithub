import { describe, expect, it, vi } from 'vitest'
import type { GitHubOctokit } from '../transport'
import { OrganizationTeamsApi } from './organization-teams'

function createApi() {
  const request = vi.fn()
  const graphql = vi.fn()
  const paginate = vi.fn()
  const api = new OrganizationTeamsApi({ request, graphql, paginate } as unknown as GitHubOctokit)
  return { api, request, graphql, paginate }
}

function createTeamNode(overrides: Record<string, unknown> = {}) {
  return {
    databaseId: 1,
    slug: 'core',
    name: 'Core',
    description: 'Core maintainers',
    privacy: 'VISIBLE',
    avatarUrl: 'https://example.com/core.png',
    parentTeam: null,
    members: { totalCount: 3 },
    repositories: { totalCount: 2 },
    childTeams: { totalCount: 1 },
    ...overrides,
  }
}

describe('OrganizationTeamsApi getTeams', () => {
  it('maps team nodes with hierarchy references', async () => {
    const { api, graphql } = createApi()
    graphql.mockResolvedValueOnce({
      organization: {
        viewerCanAdminister: true,
        teams: {
          totalCount: 2,
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: [
            createTeamNode(),
            createTeamNode({
              databaseId: 2,
              slug: 'core-web',
              name: 'Core Web',
              privacy: 'SECRET',
              parentTeam: { slug: 'core', name: 'Core' },
              childTeams: { totalCount: 0 },
            }),
          ],
        },
      },
    })

    const result = await api.getTeams('octo-org')

    expect(result.viewerCanAdminister).toBe(true)
    expect(result.totalCount).toBe(2)
    expect(result.truncated).toBe(false)
    expect(result.teams).toEqual([
      {
        id: 1,
        slug: 'core',
        name: 'Core',
        description: 'Core maintainers',
        privacy: 'visible',
        org: 'octo-org',
        avatarUrl: 'https://example.com/core.png',
        parentSlug: null,
        parentName: null,
        membersCount: 3,
        reposCount: 2,
        childTeamsCount: 1,
      },
      {
        id: 2,
        slug: 'core-web',
        name: 'Core Web',
        description: 'Core maintainers',
        privacy: 'secret',
        org: 'octo-org',
        avatarUrl: 'https://example.com/core.png',
        parentSlug: 'core',
        parentName: 'Core',
        membersCount: 3,
        reposCount: 2,
        childTeamsCount: 0,
      },
    ])
  })

  it('follows GraphQL pagination cursors until exhausted', async () => {
    const { api, graphql } = createApi()
    graphql
      .mockResolvedValueOnce({
        organization: {
          viewerCanAdminister: false,
          teams: {
            totalCount: 2,
            pageInfo: { hasNextPage: true, endCursor: 'CURSOR' },
            nodes: [createTeamNode()],
          },
        },
      })
      .mockResolvedValueOnce({
        organization: {
          viewerCanAdminister: false,
          teams: {
            totalCount: 2,
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [createTeamNode({ databaseId: 2, slug: 'second' })],
          },
        },
      })

    const result = await api.getTeams('octo-org')

    expect(graphql).toHaveBeenCalledTimes(2)
    expect(graphql.mock.calls[1][1]).toMatchObject({ after: 'CURSOR' })
    expect(result.teams).toHaveLength(2)
  })
})

describe('OrganizationTeamsApi getTeamDetail', () => {
  it('maps members, repositories, and child teams in one round trip', async () => {
    const { api, graphql } = createApi()
    graphql.mockResolvedValueOnce({
      organization: {
        team: {
          ...createTeamNode(),
          viewerCanAdminister: true,
          members: {
            totalCount: 1,
            pageInfo: { hasNextPage: false, endCursor: null },
            edges: [
              {
                role: 'MAINTAINER',
                node: { databaseId: 7, login: 'octocat', name: 'The Octocat', avatarUrl: 'https://example.com/octocat.png' },
              },
            ],
          },
          repositories: {
            totalCount: 1,
            pageInfo: { hasNextPage: false, endCursor: null },
            edges: [
              {
                permission: 'WRITE',
                node: {
                  name: 'widgets',
                  nameWithOwner: 'octo-org/widgets',
                  isPrivate: true,
                  description: 'Widget factory',
                  owner: { login: 'octo-org' },
                },
              },
            ],
          },
          childTeams: {
            totalCount: 1,
            nodes: [createTeamNode({ databaseId: 3, slug: 'core-web', parentTeam: { slug: 'core', name: 'Core' } })],
          },
        },
      },
    })

    const detail = await api.getTeamDetail({ org: 'octo-org', teamSlug: 'core' })

    expect(graphql).toHaveBeenCalledTimes(1)
    expect(detail.viewerCanAdminister).toBe(true)
    expect(detail.team.slug).toBe('core')
    expect(detail.team.membersCount).toBe(1)
    expect(detail.members).toEqual([
      {
        id: 7,
        login: 'octocat',
        name: 'The Octocat',
        avatarUrl: 'https://example.com/octocat.png',
        role: 'maintainer',
      },
    ])
    expect(detail.membersTruncated).toBe(false)
    expect(detail.repositories).toEqual([
      {
        owner: 'octo-org',
        name: 'widgets',
        nameWithOwner: 'octo-org/widgets',
        description: 'Widget factory',
        isPrivate: true,
        permission: 'push',
      },
    ])
    expect(detail.repositoriesTruncated).toBe(false)
    expect(detail.childTeams).toHaveLength(1)
    expect(detail.childTeams[0].parentSlug).toBe('core')
  })

  it('follows member pagination cursors from the detail page info', async () => {
    const { api, graphql } = createApi()
    graphql
      .mockResolvedValueOnce({
        organization: {
          team: {
            ...createTeamNode(),
            viewerCanAdminister: false,
            members: {
              totalCount: 2,
              pageInfo: { hasNextPage: true, endCursor: 'CURSOR' },
              edges: [
                { role: 'MEMBER', node: { databaseId: 1, login: 'first', name: null, avatarUrl: '' } },
              ],
            },
            repositories: { totalCount: 0, pageInfo: { hasNextPage: false, endCursor: null }, edges: [] },
            childTeams: { totalCount: 0, nodes: [] },
          },
        },
      })
      .mockResolvedValueOnce({
        organization: {
          team: {
            members: {
              pageInfo: { hasNextPage: false, endCursor: null },
              edges: [
                { role: 'MEMBER', node: { databaseId: 2, login: 'second', name: null, avatarUrl: '' } },
              ],
            },
          },
        },
      })

    const detail = await api.getTeamDetail({ org: 'octo-org', teamSlug: 'core' })

    expect(graphql).toHaveBeenCalledTimes(2)
    expect(graphql.mock.calls[1][1]).toMatchObject({ after: 'CURSOR', slug: 'core' })
    expect(detail.members).toHaveLength(2)
    expect(detail.membersTruncated).toBe(false)
  })

  it('throws when the team does not exist', async () => {
    const { api, graphql } = createApi()
    graphql.mockResolvedValueOnce({ organization: { team: null } })

    await expect(api.getTeamDetail({ org: 'octo-org', teamSlug: 'ghost' })).rejects.toThrow(
      'GitHub team "octo-org/ghost" was not found',
    )
  })
})

describe('OrganizationTeamsApi mutations', () => {
  it('creates a team translating privacy and parent to REST vocabulary', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: { id: 9, slug: 'new-team', name: 'New Team' } })

    const created = await api.createTeam({
      org: 'octo-org',
      name: 'New Team',
      description: 'Fresh',
      privacy: 'visible',
      parentTeamId: 1,
    })

    expect(request).toHaveBeenCalledWith('POST /orgs/{org}/teams', {
      org: 'octo-org',
      name: 'New Team',
      description: 'Fresh',
      privacy: 'closed',
      parent_team_id: 1,
    })
    expect(created).toEqual({ id: 9, slug: 'new-team', name: 'New Team' })
  })

  it('updates a team and returns the new slug after a rename', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: { id: 9, slug: 'renamed', name: 'Renamed' } })

    const updated = await api.updateTeam({ org: 'octo-org', teamSlug: 'old', name: 'Renamed', privacy: 'secret' })

    expect(request).toHaveBeenCalledWith('PATCH /orgs/{org}/teams/{team_slug}', {
      org: 'octo-org',
      team_slug: 'old',
      name: 'Renamed',
      privacy: 'secret',
    })
    expect(updated.slug).toBe('renamed')
  })

  it('deletes a team', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: {} })

    await api.deleteTeam({ org: 'octo-org', teamSlug: 'core' })

    expect(request).toHaveBeenCalledWith('DELETE /orgs/{org}/teams/{team_slug}', {
      org: 'octo-org',
      team_slug: 'core',
    })
  })

  it('sets a membership with a maintainer role', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: {} })

    await api.setTeamMembership({ org: 'octo-org', teamSlug: 'core', login: 'octocat', role: 'maintainer' })

    expect(request).toHaveBeenCalledWith('PUT /orgs/{org}/teams/{team_slug}/memberships/{username}', {
      org: 'octo-org',
      team_slug: 'core',
      username: 'octocat',
      role: 'maintainer',
    })
  })

  it('removes a team member', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: {} })

    await api.removeTeamMember({ org: 'octo-org', teamSlug: 'core', login: 'octocat' })

    expect(request).toHaveBeenCalledWith('DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}', {
      org: 'octo-org',
      team_slug: 'core',
      username: 'octocat',
    })
  })

  it('grants and revokes repository access', async () => {
    const { api, request } = createApi()
    request.mockResolvedValue({ data: {} })

    await api.addOrUpdateTeamRepository({
      org: 'octo-org',
      teamSlug: 'core',
      owner: 'octo-org',
      repo: 'widgets',
      permission: 'maintain',
    })
    await api.removeTeamRepository({ org: 'octo-org', teamSlug: 'core', owner: 'octo-org', repo: 'widgets' })

    expect(request).toHaveBeenNthCalledWith(1, 'PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}', {
      org: 'octo-org',
      team_slug: 'core',
      owner: 'octo-org',
      repo: 'widgets',
      permission: 'maintain',
    })
    expect(request).toHaveBeenNthCalledWith(2, 'DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}', {
      org: 'octo-org',
      team_slug: 'core',
      owner: 'octo-org',
      repo: 'widgets',
    })
  })
})
