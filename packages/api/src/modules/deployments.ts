import type { GitHubOctokit } from '../transport'
import type {
  DeleteDeploymentOptions,
  DeleteEnvironmentOptions,
  DeploymentTargetOptions,
  GitHubActor,
  GitHubDeployment,
  GitHubDeploymentPage,
  GitHubDeploymentState,
  GitHubDeploymentStatus,
  GitHubEnvironment,
  GitHubEnvironmentPage,
  GitHubEnvironmentProtectionRule,
  ListDeploymentStatusesOptions,
  ListRepositoryDeploymentsOptions,
  ListRepositoryEnvironmentsOptions,
  RepositoryOptions,
} from '../types'

interface ActorResponse {
  login?: string | null
  avatar_url?: string | null
}

interface DeploymentStatusResponse {
  id?: number
  state?: string | null
  description?: string | null
  environment_url?: string | null
  log_url?: string | null
  target_url?: string | null
  creator?: ActorResponse | null
  created_at?: string | null
}

interface DeploymentResponse {
  id?: number
  sha?: string | null
  ref?: string | null
  task?: string | null
  environment?: string | null
  description?: string | null
  transient_environment?: boolean | null
  production_environment?: boolean | null
  creator?: ActorResponse | null
  created_at?: string | null
  updated_at?: string | null
}

interface EnvironmentProtectionRuleResponse {
  id?: number
  type?: string | null
  wait_timer?: number | null
  reviewers?: unknown[] | null
}

interface EnvironmentResponse {
  id?: number
  name?: string | null
  html_url?: string | null
  created_at?: string | null
  updated_at?: string | null
  protection_rules?: EnvironmentProtectionRuleResponse[] | null
}

interface EnvironmentListResponse {
  total_count?: number
  environments?: EnvironmentResponse[]
}

const DEFAULT_PER_PAGE = 20
const MAX_PER_PAGE = 100

export class DeploymentsApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  async listRepositoryEnvironments(options: ListRepositoryEnvironmentsOptions): Promise<GitHubEnvironmentPage> {
    const page = normalizePositiveInteger(options.page, 1)
    const perPage = normalizePerPage(options.perPage)
    const response = await this.octokit.request('GET /repos/{owner}/{repo}/environments', {
      owner: options.owner,
      repo: options.repo,
      page,
      per_page: perPage,
    })
    const payload = response.data as EnvironmentListResponse
    const totalCount = payload.total_count ?? 0

    return {
      items: (payload.environments ?? []).map((environment) => mapEnvironment(environment)),
      totalCount,
      page,
      perPage,
      hasNextPage: page * perPage < totalCount,
    }
  }

  async listRepositoryDeployments(options: ListRepositoryDeploymentsOptions): Promise<GitHubDeploymentPage> {
    const page = normalizePositiveInteger(options.page, 1)
    const perPage = normalizePerPage(options.perPage)
    const environment = normalizeOptionalString(options.environment)
    const ref = normalizeOptionalString(options.ref)
    const sha = normalizeOptionalString(options.sha)
    const task = normalizeOptionalString(options.task)
    const response = await this.octokit.request('GET /repos/{owner}/{repo}/deployments', {
      owner: options.owner,
      repo: options.repo,
      page,
      per_page: perPage,
      ...(environment ? { environment } : {}),
      ...(ref ? { ref } : {}),
      ...(sha ? { sha } : {}),
      ...(task ? { task } : {}),
    })
    const deployments = (response.data ?? []) as DeploymentResponse[]

    const items = await Promise.all(
      deployments.map(async (deployment) => {
        const latestStatus = await this.fetchLatestDeploymentStatus(options, deployment)

        return mapDeployment(deployment, latestStatus)
      }),
    )

    return {
      items,
      totalCount: null,
      page,
      perPage,
      hasNextPage: deployments.length === perPage,
    }
  }

  async listDeploymentStatuses(options: ListDeploymentStatusesOptions): Promise<GitHubDeploymentStatus[]> {
    const response = await this.octokit.request(
      'GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
      {
        owner: options.owner,
        repo: options.repo,
        deployment_id: options.deploymentId,
        per_page: MAX_PER_PAGE,
      },
    )
    const statuses = (response.data ?? []) as DeploymentStatusResponse[]

    return statuses.map((status) => mapDeploymentStatus(status))
  }

  async markDeploymentInactive(options: DeploymentTargetOptions): Promise<void> {
    await this.octokit.request('POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses', {
      owner: options.owner,
      repo: options.repo,
      deployment_id: options.deploymentId,
      state: 'inactive',
    })
  }

  async deleteDeployment(options: DeleteDeploymentOptions): Promise<void> {
    if (options.deactivateFirst) {
      await this.markDeploymentInactive(options)
    }

    await this.octokit.request('DELETE /repos/{owner}/{repo}/deployments/{deployment_id}', {
      owner: options.owner,
      repo: options.repo,
      deployment_id: options.deploymentId,
    })
  }

  async deleteEnvironment(options: DeleteEnvironmentOptions): Promise<void> {
    await this.octokit.request('DELETE /repos/{owner}/{repo}/environments/{environment_name}', {
      owner: options.owner,
      repo: options.repo,
      environment_name: options.environmentName,
    })
  }

  private async fetchLatestDeploymentStatus(
    context: RepositoryOptions,
    deployment: DeploymentResponse,
  ): Promise<GitHubDeploymentStatus | null> {
    if (!deployment.id) return null

    try {
      const response = await this.octokit.request(
        'GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
        {
          owner: context.owner,
          repo: context.repo,
          deployment_id: deployment.id,
          per_page: 1,
        },
      )
      const statuses = (response.data ?? []) as DeploymentStatusResponse[]

      return statuses[0] ? mapDeploymentStatus(statuses[0]) : null
    } catch {
      return null
    }
  }
}

function mapEnvironment(environment: EnvironmentResponse): GitHubEnvironment {
  return {
    id: environment.id ?? 0,
    name: environment.name ?? '',
    htmlUrl: environment.html_url ?? null,
    createdAt: environment.created_at ?? null,
    updatedAt: environment.updated_at ?? null,
    protectionRules: (environment.protection_rules ?? []).map((rule) => mapProtectionRule(rule)),
  }
}

function mapProtectionRule(rule: EnvironmentProtectionRuleResponse): GitHubEnvironmentProtectionRule {
  const type = rule.type ?? ''

  return {
    id: rule.id ?? 0,
    type,
    waitTimer: type === 'wait_timer' ? rule.wait_timer ?? null : null,
    reviewerCount: type === 'required_reviewers' ? rule.reviewers?.length ?? 0 : null,
  }
}

function mapDeployment(
  deployment: DeploymentResponse,
  latestStatus: GitHubDeploymentStatus | null,
): GitHubDeployment {
  return {
    id: deployment.id ?? 0,
    sha: deployment.sha ?? '',
    ref: deployment.ref ?? '',
    task: deployment.task ?? '',
    environment: deployment.environment ?? '',
    description: deployment.description ?? null,
    transientEnvironment: deployment.transient_environment ?? false,
    productionEnvironment: deployment.production_environment ?? false,
    creator: mapActor(deployment.creator),
    latestStatus,
    createdAt: deployment.created_at ?? '',
    updatedAt: deployment.updated_at ?? '',
  }
}

function mapDeploymentStatus(status: DeploymentStatusResponse): GitHubDeploymentStatus {
  return {
    id: status.id ?? 0,
    state: normalizeDeploymentState(status.state),
    description: status.description ?? '',
    environmentUrl: status.environment_url ?? null,
    logUrl: status.log_url ?? status.target_url ?? null,
    creator: mapActor(status.creator),
    createdAt: status.created_at ?? '',
  }
}

function mapActor(actor: ActorResponse | null | undefined): GitHubActor | null {
  if (!actor?.login) {
    return null
  }

  return {
    login: actor.login,
    avatarUrl: actor.avatar_url ?? undefined,
  }
}

function normalizeDeploymentState(value: string | null | undefined): GitHubDeploymentState {
  return (value?.trim() as GitHubDeploymentState) || 'pending'
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalized = value?.trim()

  return normalized || null
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback

  return Math.max(1, Math.round(value))
}

function normalizePerPage(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_PER_PAGE

  return Math.min(MAX_PER_PAGE, Math.max(1, Math.round(value)))
}
