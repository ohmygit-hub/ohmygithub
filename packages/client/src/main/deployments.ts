import {
  createGitHubApi,
  type DeleteDeploymentOptions,
  type DeleteEnvironmentOptions,
  type DeploymentTargetOptions,
  type ListDeploymentStatusesOptions,
  type ListRepositoryDeploymentsOptions,
  type ListRepositoryEnvironmentsOptions,
} from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken } from './auth'
import { resolveGitHubTransport } from './proxy'

export function registerDeploymentsIpc(): void {
  ipcMain.handle('deployments:list-environments', (_event, options: ListRepositoryEnvironmentsOptions) =>
    listRepositoryEnvironments(options)
  )
  ipcMain.handle('deployments:list-deployments', (_event, options: ListRepositoryDeploymentsOptions) =>
    listRepositoryDeployments(options)
  )
  ipcMain.handle('deployments:list-statuses', (_event, options: ListDeploymentStatusesOptions) =>
    listDeploymentStatuses(options)
  )
  ipcMain.handle('deployments:mark-inactive', (_event, options: DeploymentTargetOptions) =>
    markDeploymentInactive(options)
  )
  ipcMain.handle('deployments:delete-deployment', (_event, options: DeleteDeploymentOptions) =>
    deleteDeployment(options)
  )
  ipcMain.handle('deployments:delete-environment', (_event, options: DeleteEnvironmentOptions) =>
    deleteEnvironment(options)
  )
}

async function listRepositoryEnvironments(options: ListRepositoryEnvironmentsOptions) {
  const repository = normalizeRepository(options.owner, options.repo)
  const api = await createAuthenticatedGitHubApi()

  return api.deployments.listRepositoryEnvironments({
    ...repository,
    page: normalizePositiveInteger(options.page, 1),
    perPage: normalizePositiveInteger(options.perPage, 20),
  })
}

async function listRepositoryDeployments(options: ListRepositoryDeploymentsOptions) {
  const repository = normalizeRepository(options.owner, options.repo)
  const api = await createAuthenticatedGitHubApi()

  return api.deployments.listRepositoryDeployments({
    ...repository,
    environment: normalizeOptionalString(options.environment),
    ref: normalizeOptionalString(options.ref),
    sha: normalizeOptionalString(options.sha),
    task: normalizeOptionalString(options.task),
    page: normalizePositiveInteger(options.page, 1),
    perPage: normalizePositiveInteger(options.perPage, 20),
  })
}

async function listDeploymentStatuses(options: ListDeploymentStatusesOptions) {
  const repository = normalizeRepository(options.owner, options.repo)
  const api = await createAuthenticatedGitHubApi()

  return api.deployments.listDeploymentStatuses({
    ...repository,
    deploymentId: normalizeDeploymentId(options.deploymentId),
  })
}

async function markDeploymentInactive(options: DeploymentTargetOptions) {
  const repository = normalizeRepository(options.owner, options.repo)
  const api = await createAuthenticatedGitHubApi()

  await api.deployments.markDeploymentInactive({
    ...repository,
    deploymentId: normalizeDeploymentId(options.deploymentId),
  })
}

async function deleteDeployment(options: DeleteDeploymentOptions) {
  const repository = normalizeRepository(options.owner, options.repo)
  const api = await createAuthenticatedGitHubApi()

  await api.deployments.deleteDeployment({
    ...repository,
    deploymentId: normalizeDeploymentId(options.deploymentId),
    deactivateFirst: Boolean(options.deactivateFirst),
  })
}

async function deleteEnvironment(options: DeleteEnvironmentOptions) {
  const repository = normalizeRepository(options.owner, options.repo)
  const api = await createAuthenticatedGitHubApi()

  await api.deployments.deleteEnvironment({
    ...repository,
    environmentName: normalizeEnvironmentName(options.environmentName),
  })
}

function normalizeRepository(owner: string, repo: string) {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()

  if (!normalizedOwner || !normalizedRepo) {
    throw new Error('Repository owner and name are required')
  }

  return {
    owner: normalizedOwner,
    repo: normalizedRepo,
  }
}

function normalizeDeploymentId(value: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error('Deployment id must be a positive integer')
  }

  return value
}

function normalizeEnvironmentName(value: string): string {
  const normalized = typeof value === 'string' ? value.trim() : ''

  if (!normalized) {
    throw new Error('Environment name is required')
  }

  return normalized
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalized = value?.trim()

  return normalized || null
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback

  return Math.max(1, Math.round(value))
}

async function createAuthenticatedGitHubApi() {
  return createGitHubApi({
    token: getAuthenticatedAccessToken(),
    ...(await resolveGitHubTransport())
  })
}
