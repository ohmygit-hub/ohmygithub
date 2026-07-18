import type { GitHubOctokit } from '../transport'
import type {
  AddOrUpdateTeamRepositoryOptions,
  CreateTeamOptions,
  GitHubCreatedTeam,
  GitHubOrganizationTeams,
  GitHubTeam,
  GitHubTeamDetail,
  GitHubTeamMember,
  GitHubTeamMemberRole,
  GitHubTeamPrivacy,
  GitHubTeamRepository,
  OrganizationTeamOptions,
  SetTeamMembershipOptions,
  TeamMemberOptions,
  TeamRepositoryOptions,
  UpdateTeamOptions,
} from '../types'

interface GraphTeamNode {
  databaseId?: number | null
  slug?: string | null
  name?: string | null
  description?: string | null
  privacy?: string | null
  avatarUrl?: string | null
  parentTeam?: {
    slug?: string | null
    name?: string | null
  } | null
  members?: { totalCount?: number } | null
  repositories?: { totalCount?: number } | null
  childTeams?: { totalCount?: number } | null
}

interface GraphPageInfo {
  hasNextPage?: boolean
  endCursor?: string | null
}

interface GraphOrganizationTeamsResponse {
  organization: {
    viewerCanAdminister?: boolean
    teams?: {
      totalCount?: number
      pageInfo?: GraphPageInfo | null
      nodes?: Array<GraphTeamNode | null>
    } | null
  } | null
}

interface GraphTeamMemberEdge {
  role?: string | null
  node?: {
    databaseId?: number | null
    login?: string | null
    name?: string | null
    avatarUrl?: string | null
  } | null
}

interface GraphTeamRepositoryEdge {
  permission?: string | null
  node?: {
    name?: string | null
    nameWithOwner?: string | null
    isPrivate?: boolean | null
    description?: string | null
    owner?: { login?: string | null } | null
  } | null
}

interface GraphTeamDetailResponse {
  organization: {
    team?: (GraphTeamNode & {
      viewerCanAdminister?: boolean
      members?: {
        totalCount?: number
        pageInfo?: GraphPageInfo | null
        edges?: Array<GraphTeamMemberEdge | null>
      } | null
      repositories?: {
        totalCount?: number
        pageInfo?: GraphPageInfo | null
        edges?: Array<GraphTeamRepositoryEdge | null>
      } | null
      childTeams?: {
        totalCount?: number
        nodes?: Array<GraphTeamNode | null>
      } | null
    }) | null
  } | null
}

interface GraphTeamMembersPageResponse {
  organization: {
    team?: {
      members?: {
        pageInfo?: GraphPageInfo | null
        edges?: Array<GraphTeamMemberEdge | null>
      } | null
    } | null
  } | null
}

interface GraphTeamRepositoriesPageResponse {
  organization: {
    team?: {
      repositories?: {
        pageInfo?: GraphPageInfo | null
        edges?: Array<GraphTeamRepositoryEdge | null>
      } | null
    } | null
  } | null
}

interface CreatedTeamResponse {
  id?: number
  slug?: string | null
  name?: string | null
}

const teamSummaryFields = `
  databaseId
  slug
  name
  description
  privacy
  avatarUrl
  parentTeam {
    slug
    name
  }
  members(membership: IMMEDIATE) {
    totalCount
  }
  repositories {
    totalCount
  }
  childTeams {
    totalCount
  }
`

const organizationTeamsQuery = `
  query OrganizationTeams($login: String!, $first: Int!, $after: String) {
    organization(login: $login) {
      viewerCanAdminister
      teams(first: $first, after: $after, orderBy: { field: NAME, direction: ASC }) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ${teamSummaryFields}
        }
      }
    }
  }
`

const teamDetailQuery = `
  query OrganizationTeamDetail($login: String!, $slug: String!, $first: Int!) {
    organization(login: $login) {
      team(slug: $slug) {
        databaseId
        slug
        name
        description
        privacy
        avatarUrl
        viewerCanAdminister
        parentTeam {
          slug
          name
        }
        members(first: $first, membership: IMMEDIATE, orderBy: { field: LOGIN, direction: ASC }) {
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            role
            node {
              databaseId
              login
              name
              avatarUrl
            }
          }
        }
        repositories(first: $first, orderBy: { field: NAME, direction: ASC }) {
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            permission
            node {
              name
              nameWithOwner
              isPrivate
              description
              owner {
                login
              }
            }
          }
        }
        childTeams(first: 100, orderBy: { field: NAME, direction: ASC }) {
          totalCount
          nodes {
            ${teamSummaryFields}
          }
        }
      }
    }
  }
`

const teamMembersPageQuery = `
  query OrganizationTeamMembersPage($login: String!, $slug: String!, $first: Int!, $after: String) {
    organization(login: $login) {
      team(slug: $slug) {
        members(first: $first, after: $after, membership: IMMEDIATE, orderBy: { field: LOGIN, direction: ASC }) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            role
            node {
              databaseId
              login
              name
              avatarUrl
            }
          }
        }
      }
    }
  }
`

const teamRepositoriesPageQuery = `
  query OrganizationTeamRepositoriesPage($login: String!, $slug: String!, $first: Int!, $after: String) {
    organization(login: $login) {
      team(slug: $slug) {
        repositories(first: $first, after: $after, orderBy: { field: NAME, direction: ASC }) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            permission
            node {
              name
              nameWithOwner
              isPrivate
              description
              owner {
                login
              }
            }
          }
        }
      }
    }
  }
`

const TEAMS_FETCH_PAGE_SIZE = 100
const TEAMS_MAX_TOTAL = 500
const TEAM_LIST_FETCH_PAGE_SIZE = 100
const TEAM_MEMBERS_MAX_TOTAL = 500
const TEAM_REPOSITORIES_MAX_TOTAL = 500

export class OrganizationTeamsApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  // Fetches the full team list (capped) in one go so the renderer can build
  // the hierarchy, filter, and search client-side; parent links only come per
  // node on the GraphQL connection.
  async getTeams(org: string): Promise<GitHubOrganizationTeams> {
    const teams: GitHubTeam[] = []
    let viewerCanAdminister = false
    let totalCount = 0
    let after: string | null = null
    let hasNextPage = true

    while (hasNextPage && teams.length < TEAMS_MAX_TOTAL) {
      const response: GraphOrganizationTeamsResponse = await this.octokit.graphql<GraphOrganizationTeamsResponse>(
        organizationTeamsQuery,
        {
          login: org,
          first: TEAMS_FETCH_PAGE_SIZE,
          after,
        },
      )
      const organization = response.organization
      const connection = organization?.teams

      viewerCanAdminister = Boolean(organization?.viewerCanAdminister)
      totalCount = connection?.totalCount ?? 0

      for (const node of connection?.nodes ?? []) {
        const team = mapTeamNode(node, org)
        if (team) teams.push(team)
      }

      hasNextPage = Boolean(connection?.pageInfo?.hasNextPage)
      after = connection?.pageInfo?.endCursor ?? null
      if (!after) break
    }

    return {
      teams: teams.slice(0, TEAMS_MAX_TOTAL),
      totalCount,
      truncated: hasNextPage || teams.length > TEAMS_MAX_TOTAL,
      viewerCanAdminister,
    }
  }

  async getTeamDetail(options: OrganizationTeamOptions): Promise<GitHubTeamDetail> {
    const response: GraphTeamDetailResponse = await this.octokit.graphql<GraphTeamDetailResponse>(teamDetailQuery, {
      login: options.org,
      slug: options.teamSlug,
      first: TEAM_LIST_FETCH_PAGE_SIZE,
    })
    const teamNode = response.organization?.team

    if (!teamNode) {
      throw new Error(`GitHub team "${options.org}/${options.teamSlug}" was not found`)
    }

    const team = mapTeamNode(teamNode, options.org)

    if (!team) {
      throw new Error(`GitHub team "${options.org}/${options.teamSlug}" was not found`)
    }

    const members: GitHubTeamMember[] = []
    for (const edge of teamNode.members?.edges ?? []) {
      const member = mapTeamMemberEdge(edge)
      if (member) members.push(member)
    }

    const repositories: GitHubTeamRepository[] = []
    for (const edge of teamNode.repositories?.edges ?? []) {
      const repository = mapTeamRepositoryEdge(edge)
      if (repository) repositories.push(repository)
    }

    const membersTruncated = await this.fetchRemainingMembers(options, teamNode.members?.pageInfo, members)
    const repositoriesTruncated = await this.fetchRemainingRepositories(
      options,
      teamNode.repositories?.pageInfo,
      repositories,
    )

    const childTeams: GitHubTeam[] = []
    for (const node of teamNode.childTeams?.nodes ?? []) {
      const childTeam = mapTeamNode(node, options.org)
      if (childTeam) childTeams.push(childTeam)
    }

    return {
      team,
      viewerCanAdminister: Boolean(teamNode.viewerCanAdminister),
      members,
      membersTruncated,
      repositories,
      repositoriesTruncated,
      childTeams,
    }
  }

  async createTeam(options: CreateTeamOptions): Promise<GitHubCreatedTeam> {
    const response = await this.octokit.request('POST /orgs/{org}/teams', {
      org: options.org,
      name: options.name,
      ...(options.description !== undefined ? { description: options.description } : {}),
      ...(options.privacy ? { privacy: mapPrivacyToRest(options.privacy) } : {}),
      ...(options.parentTeamId !== undefined ? { parent_team_id: options.parentTeamId } : {}),
    })

    return mapCreatedTeam(response.data as CreatedTeamResponse)
  }

  // Renaming changes the slug; callers should renavigate with the returned slug.
  async updateTeam(options: UpdateTeamOptions): Promise<GitHubCreatedTeam> {
    const response = await this.octokit.request('PATCH /orgs/{org}/teams/{team_slug}', {
      org: options.org,
      team_slug: options.teamSlug,
      ...(options.name !== undefined ? { name: options.name } : {}),
      ...(options.description !== undefined ? { description: options.description } : {}),
      ...(options.privacy ? { privacy: mapPrivacyToRest(options.privacy) } : {}),
    })

    return mapCreatedTeam(response.data as CreatedTeamResponse)
  }

  async deleteTeam(options: OrganizationTeamOptions): Promise<void> {
    await this.octokit.request('DELETE /orgs/{org}/teams/{team_slug}', {
      org: options.org,
      team_slug: options.teamSlug,
    })
  }

  // PUT memberships also covers changing an existing member's role.
  async setTeamMembership(options: SetTeamMembershipOptions): Promise<void> {
    await this.octokit.request('PUT /orgs/{org}/teams/{team_slug}/memberships/{username}', {
      org: options.org,
      team_slug: options.teamSlug,
      username: options.login,
      role: options.role,
    })
  }

  async removeTeamMember(options: TeamMemberOptions): Promise<void> {
    await this.octokit.request('DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}', {
      org: options.org,
      team_slug: options.teamSlug,
      username: options.login,
    })
  }

  // PUT repos also covers changing the permission of an existing grant.
  async addOrUpdateTeamRepository(options: AddOrUpdateTeamRepositoryOptions): Promise<void> {
    await this.octokit.request('PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}', {
      org: options.org,
      team_slug: options.teamSlug,
      owner: options.owner,
      repo: options.repo,
      permission: options.permission,
    })
  }

  async removeTeamRepository(options: TeamRepositoryOptions): Promise<void> {
    await this.octokit.request('DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}', {
      org: options.org,
      team_slug: options.teamSlug,
      owner: options.owner,
      repo: options.repo,
    })
  }

  private async fetchRemainingMembers(
    options: OrganizationTeamOptions,
    pageInfo: GraphPageInfo | null | undefined,
    members: GitHubTeamMember[],
  ): Promise<boolean> {
    let hasNextPage = Boolean(pageInfo?.hasNextPage)
    let after = pageInfo?.endCursor ?? null

    while (hasNextPage && after && members.length < TEAM_MEMBERS_MAX_TOTAL) {
      const response: GraphTeamMembersPageResponse = await this.octokit.graphql<GraphTeamMembersPageResponse>(
        teamMembersPageQuery,
        {
          login: options.org,
          slug: options.teamSlug,
          first: TEAM_LIST_FETCH_PAGE_SIZE,
          after,
        },
      )
      const connection = response.organization?.team?.members

      for (const edge of connection?.edges ?? []) {
        const member = mapTeamMemberEdge(edge)
        if (member) members.push(member)
      }

      hasNextPage = Boolean(connection?.pageInfo?.hasNextPage)
      after = connection?.pageInfo?.endCursor ?? null
    }

    return hasNextPage || members.length > TEAM_MEMBERS_MAX_TOTAL
  }

  private async fetchRemainingRepositories(
    options: OrganizationTeamOptions,
    pageInfo: GraphPageInfo | null | undefined,
    repositories: GitHubTeamRepository[],
  ): Promise<boolean> {
    let hasNextPage = Boolean(pageInfo?.hasNextPage)
    let after = pageInfo?.endCursor ?? null

    while (hasNextPage && after && repositories.length < TEAM_REPOSITORIES_MAX_TOTAL) {
      const response: GraphTeamRepositoriesPageResponse = await this.octokit.graphql<GraphTeamRepositoriesPageResponse>(
        teamRepositoriesPageQuery,
        {
          login: options.org,
          slug: options.teamSlug,
          first: TEAM_LIST_FETCH_PAGE_SIZE,
          after,
        },
      )
      const connection = response.organization?.team?.repositories

      for (const edge of connection?.edges ?? []) {
        const repository = mapTeamRepositoryEdge(edge)
        if (repository) repositories.push(repository)
      }

      hasNextPage = Boolean(connection?.pageInfo?.hasNextPage)
      after = connection?.pageInfo?.endCursor ?? null
    }

    return hasNextPage || repositories.length > TEAM_REPOSITORIES_MAX_TOTAL
  }
}

function mapTeamNode(node: GraphTeamNode | null | undefined, org: string): GitHubTeam | null {
  const slug = node?.slug?.trim()
  if (!slug) return null

  return {
    id: node?.databaseId ?? 0,
    slug,
    name: node?.name?.trim() || slug,
    description: node?.description ?? null,
    privacy: mapPrivacyFromGraph(node?.privacy),
    org,
    avatarUrl: node?.avatarUrl ?? null,
    parentSlug: node?.parentTeam?.slug ?? null,
    parentName: node?.parentTeam?.name ?? null,
    membersCount: node?.members?.totalCount ?? 0,
    reposCount: node?.repositories?.totalCount ?? 0,
    childTeamsCount: node?.childTeams?.totalCount ?? 0,
  }
}

function mapTeamMemberEdge(edge: GraphTeamMemberEdge | null | undefined): GitHubTeamMember | null {
  const login = edge?.node?.login?.trim()
  if (!login) return null

  return {
    id: edge?.node?.databaseId ?? 0,
    login,
    name: edge?.node?.name ?? null,
    avatarUrl: edge?.node?.avatarUrl ?? `https://github.com/${encodeURIComponent(login)}.png?size=96`,
    role: mapTeamMemberRole(edge?.role),
  }
}

function mapTeamRepositoryEdge(edge: GraphTeamRepositoryEdge | null | undefined): GitHubTeamRepository | null {
  const name = edge?.node?.name?.trim()
  const owner = edge?.node?.owner?.login?.trim()
  if (!name || !owner) return null

  return {
    owner,
    name,
    nameWithOwner: edge?.node?.nameWithOwner ?? `${owner}/${name}`,
    description: edge?.node?.description ?? null,
    isPrivate: Boolean(edge?.node?.isPrivate),
    permission: mapRepositoryPermissionFromGraph(edge?.permission),
  }
}

function mapCreatedTeam(data: CreatedTeamResponse): GitHubCreatedTeam {
  return {
    id: data.id ?? 0,
    slug: data.slug ?? '',
    name: data.name ?? '',
  }
}

function mapTeamMemberRole(role: string | null | undefined): GitHubTeamMemberRole {
  return role === 'MAINTAINER' ? 'maintainer' : 'member'
}

function mapPrivacyFromGraph(privacy: string | null | undefined): GitHubTeamPrivacy {
  return privacy === 'SECRET' ? 'secret' : 'visible'
}

// REST calls a visible team "closed"; keep the app-facing vocabulary aligned
// with GraphQL (visible/secret) and translate at the transport edge.
function mapPrivacyToRest(privacy: GitHubTeamPrivacy): 'closed' | 'secret' {
  return privacy === 'secret' ? 'secret' : 'closed'
}

// GraphQL reports repository permission as READ/WRITE; the rest of the app
// (and the REST write path) speaks pull/push.
function mapRepositoryPermissionFromGraph(permission: string | null | undefined): string {
  switch (permission) {
    case 'READ':
      return 'pull'
    case 'TRIAGE':
      return 'triage'
    case 'WRITE':
      return 'push'
    case 'MAINTAIN':
      return 'maintain'
    case 'ADMIN':
      return 'admin'
    default:
      return (permission ?? 'pull').toLowerCase()
  }
}
