import {
  createGitHubApi,
  type GitHubPackageType,
  type ListPackageVersionsOptions,
  type ListRepositoryPackagesOptions,
  type PackageTargetOptions,
  type PackageVersionTargetOptions,
} from '@oh-my-github/api'
import { ipcMain } from 'electron'
import { getAuthenticatedAccessToken } from './auth'
import { resolveGitHubTransport } from './proxy'

const PACKAGE_TYPES: readonly GitHubPackageType[] = ['npm', 'maven', 'rubygems', 'docker', 'nuget', 'container']

export function registerPackagesIpc(): void {
  ipcMain.handle('packages:list-packages', (_event, options: ListRepositoryPackagesOptions) =>
    listRepositoryPackages(options)
  )
  ipcMain.handle('packages:list-versions', (_event, options: ListPackageVersionsOptions) =>
    listPackageVersions(options)
  )
  ipcMain.handle('packages:delete-package', (_event, options: PackageTargetOptions) =>
    deletePackage(options)
  )
  ipcMain.handle('packages:delete-version', (_event, options: PackageVersionTargetOptions) =>
    deletePackageVersion(options)
  )
  ipcMain.handle('packages:restore-package', (_event, options: PackageTargetOptions) =>
    restorePackage(options)
  )
  ipcMain.handle('packages:restore-version', (_event, options: PackageVersionTargetOptions) =>
    restorePackageVersion(options)
  )
}

async function listRepositoryPackages(options: ListRepositoryPackagesOptions) {
  const repository = normalizeRepository(options.owner, options.repo)
  const api = await createAuthenticatedGitHubApi()

  return api.packages.listRepositoryPackages({
    ...repository,
    page: normalizePositiveInteger(options.page, 1),
    perPage: normalizePositiveInteger(options.perPage, 20),
  })
}

async function listPackageVersions(options: ListPackageVersionsOptions) {
  const api = await createAuthenticatedGitHubApi()

  return api.packages.listPackageVersions({
    owner: normalizeOwner(options.owner),
    packageType: normalizePackageType(options.packageType),
    packageName: normalizePackageName(options.packageName),
    page: normalizePositiveInteger(options.page, 1),
    perPage: normalizePositiveInteger(options.perPage, 30),
  })
}

async function deletePackage(options: PackageTargetOptions) {
  const api = await createAuthenticatedGitHubApi()

  await api.packages.deletePackage({
    owner: normalizeOwner(options.owner),
    packageType: normalizePackageType(options.packageType),
    packageName: normalizePackageName(options.packageName),
  })
}

async function deletePackageVersion(options: PackageVersionTargetOptions) {
  const api = await createAuthenticatedGitHubApi()

  await api.packages.deletePackageVersion({
    owner: normalizeOwner(options.owner),
    packageType: normalizePackageType(options.packageType),
    packageName: normalizePackageName(options.packageName),
    versionId: normalizeVersionId(options.versionId),
  })
}

async function restorePackage(options: PackageTargetOptions) {
  const api = await createAuthenticatedGitHubApi()

  await api.packages.restorePackage({
    owner: normalizeOwner(options.owner),
    packageType: normalizePackageType(options.packageType),
    packageName: normalizePackageName(options.packageName),
  })
}

async function restorePackageVersion(options: PackageVersionTargetOptions) {
  const api = await createAuthenticatedGitHubApi()

  await api.packages.restorePackageVersion({
    owner: normalizeOwner(options.owner),
    packageType: normalizePackageType(options.packageType),
    packageName: normalizePackageName(options.packageName),
    versionId: normalizeVersionId(options.versionId),
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

function normalizeOwner(value: string): string {
  const normalized = typeof value === 'string' ? value.trim() : ''

  if (!normalized) {
    throw new Error('Package owner is required')
  }

  return normalized
}

function normalizePackageName(value: string): string {
  const normalized = typeof value === 'string' ? value.trim() : ''

  if (!normalized) {
    throw new Error('Package name is required')
  }

  return normalized
}

function normalizePackageType(value: GitHubPackageType): GitHubPackageType {
  if (!PACKAGE_TYPES.includes(value)) {
    throw new Error('Invalid package type')
  }

  return value
}

function normalizeVersionId(value: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error('Package version id must be a positive integer')
  }

  return value
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
