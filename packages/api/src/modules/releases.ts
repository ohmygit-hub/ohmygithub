import type { GitHubOctokit } from '../transport'
import type {
  CreateReleaseOptions,
  DeleteReleaseOptions,
  GitHubActor,
  GitHubRelease,
  GitHubReleaseAsset,
  GitHubReleasePage,
  ListRepositoryReleasesOptions,
  UpdateReleaseOptions,
} from '../types'

interface ActorResponse {
  login?: string | null
  avatar_url?: string | null
}

interface ReleaseAssetResponse {
  id?: number
  name?: string | null
  size?: number | null
  download_count?: number | null
  content_type?: string | null
  browser_download_url?: string | null
  updated_at?: string | null
}

interface ReleaseResponse {
  id?: number
  tag_name?: string | null
  target_commitish?: string | null
  name?: string | null
  body?: string | null
  draft?: boolean | null
  prerelease?: boolean | null
  created_at?: string | null
  published_at?: string | null
  html_url?: string | null
  author?: ActorResponse | null
  assets?: ReleaseAssetResponse[] | null
  tarball_url?: string | null
  zipball_url?: string | null
}

const DEFAULT_RELEASES_PER_PAGE = 20
const MAX_PER_PAGE = 100

export class ReleasesApi {
  constructor(private readonly octokit: GitHubOctokit) {}

  async listRepositoryReleases(options: ListRepositoryReleasesOptions): Promise<GitHubReleasePage> {
    const page = normalizePositiveInteger(options.page, 1)
    const perPage = normalizePerPage(options.perPage)
    const response = await this.octokit.request('GET /repos/{owner}/{repo}/releases', {
      owner: options.owner,
      repo: options.repo,
      page,
      per_page: perPage,
    })
    const releases = (response.data ?? []) as ReleaseResponse[]

    return {
      items: releases.map((release) => mapRelease(release)),
      page,
      perPage,
      hasPreviousPage: page > 1,
      hasNextPage: releases.length === perPage,
    }
  }

  async createRelease(options: CreateReleaseOptions): Promise<GitHubRelease> {
    const tagName = options.tagName.trim()
    if (!tagName) {
      throw new Error('Release tag name is required')
    }

    const response = await this.octokit.request('POST /repos/{owner}/{repo}/releases', {
      owner: options.owner,
      repo: options.repo,
      tag_name: tagName,
      ...(options.targetCommitish ? { target_commitish: options.targetCommitish } : {}),
      ...(options.name != null ? { name: options.name } : {}),
      ...(options.body != null ? { body: options.body } : {}),
      ...(options.draft !== undefined ? { draft: options.draft } : {}),
      ...(options.prerelease !== undefined ? { prerelease: options.prerelease } : {}),
    })

    return mapRelease(response.data as ReleaseResponse)
  }

  async updateRelease(options: UpdateReleaseOptions): Promise<GitHubRelease> {
    const tagName = options.tagName?.trim()
    const response = await this.octokit.request('PATCH /repos/{owner}/{repo}/releases/{release_id}', {
      owner: options.owner,
      repo: options.repo,
      release_id: options.releaseId,
      ...(tagName ? { tag_name: tagName } : {}),
      ...(options.targetCommitish ? { target_commitish: options.targetCommitish } : {}),
      ...(options.name != null ? { name: options.name } : {}),
      ...(options.body != null ? { body: options.body } : {}),
      ...(options.draft !== undefined ? { draft: options.draft } : {}),
      ...(options.prerelease !== undefined ? { prerelease: options.prerelease } : {}),
    })

    return mapRelease(response.data as ReleaseResponse)
  }

  async deleteRelease(options: DeleteReleaseOptions): Promise<void> {
    await this.octokit.request('DELETE /repos/{owner}/{repo}/releases/{release_id}', {
      owner: options.owner,
      repo: options.repo,
      release_id: options.releaseId,
    })
  }
}

function mapRelease(release: ReleaseResponse): GitHubRelease {
  return {
    id: release.id ?? 0,
    tagName: release.tag_name ?? '',
    targetCommitish: release.target_commitish ?? '',
    name: release.name ?? null,
    body: release.body ?? null,
    draft: release.draft ?? false,
    prerelease: release.prerelease ?? false,
    createdAt: release.created_at ?? null,
    publishedAt: release.published_at ?? null,
    htmlUrl: release.html_url ?? '',
    author: mapActor(release.author),
    assets: (release.assets ?? []).map((asset) => mapAsset(asset)),
    tarballUrl: release.tarball_url ?? null,
    zipballUrl: release.zipball_url ?? null,
  }
}

function mapAsset(asset: ReleaseAssetResponse): GitHubReleaseAsset {
  return {
    id: asset.id ?? 0,
    name: asset.name ?? '',
    size: asset.size ?? 0,
    downloadCount: asset.download_count ?? 0,
    contentType: asset.content_type ?? null,
    browserDownloadUrl: asset.browser_download_url ?? '',
    updatedAt: asset.updated_at ?? null,
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

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value) || !value || value < 1) {
    return fallback
  }

  return Math.floor(value)
}

function normalizePerPage(value: number | undefined): number {
  const normalized = normalizePositiveInteger(value, DEFAULT_RELEASES_PER_PAGE)
  return Math.min(normalized, MAX_PER_PAGE)
}
