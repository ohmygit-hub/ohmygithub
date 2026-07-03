import { describe, expect, it, vi } from 'vitest'
import type { GitHubOctokit } from '../transport'
import { ReleasesApi } from './releases'

function createApi() {
  const request = vi.fn().mockResolvedValue({ data: {} })
  const api = new ReleasesApi({ request } as unknown as GitHubOctokit)
  return { api, request }
}

function createReleaseResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    tag_name: 'v1.0.0',
    target_commitish: 'main',
    name: 'Version 1.0.0',
    body: 'First stable release',
    draft: false,
    prerelease: false,
    created_at: '2026-01-01T00:00:00Z',
    published_at: '2026-01-02T00:00:00Z',
    html_url: 'https://github.com/octo-org/hello-world/releases/tag/v1.0.0',
    author: { login: 'octocat', avatar_url: 'https://example.com/octocat.png' },
    assets: [
      {
        id: 11,
        name: 'app.dmg',
        size: 2048,
        download_count: 5,
        content_type: 'application/octet-stream',
        browser_download_url: 'https://example.com/app.dmg',
        updated_at: '2026-01-02T01:00:00Z',
      },
    ],
    tarball_url: 'https://example.com/tarball',
    zipball_url: 'https://example.com/zipball',
    ...overrides,
  }
}

describe('ReleasesApi list', () => {
  it('lists repository releases with pagination params', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: [] })

    await api.listRepositoryReleases({
      owner: 'octo-org',
      repo: 'hello-world',
      page: 3,
      perPage: 30,
    })

    expect(request).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}/releases',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        page: 3,
        per_page: 30,
      },
    )
  })

  it('reports a next page when the page is full', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({
      data: [createReleaseResponse({ id: 1 }), createReleaseResponse({ id: 2 })],
    })

    const result = await api.listRepositoryReleases({
      owner: 'octo-org',
      repo: 'hello-world',
      page: 2,
      perPage: 2,
    })

    expect(result.hasNextPage).toBe(true)
    expect(result.hasPreviousPage).toBe(true)
  })

  it('reports no next page when the page is short', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: [createReleaseResponse()] })

    const result = await api.listRepositoryReleases({
      owner: 'octo-org',
      repo: 'hello-world',
      page: 1,
      perPage: 20,
    })

    expect(result.hasNextPage).toBe(false)
    expect(result.hasPreviousPage).toBe(false)
  })

  it('maps snake_case release fields to app types', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: [createReleaseResponse()] })

    const result = await api.listRepositoryReleases({ owner: 'octo-org', repo: 'hello-world' })
    const release = result.items[0]

    expect(release).toEqual({
      id: 1,
      tagName: 'v1.0.0',
      targetCommitish: 'main',
      name: 'Version 1.0.0',
      body: 'First stable release',
      draft: false,
      prerelease: false,
      createdAt: '2026-01-01T00:00:00Z',
      publishedAt: '2026-01-02T00:00:00Z',
      htmlUrl: 'https://github.com/octo-org/hello-world/releases/tag/v1.0.0',
      author: { login: 'octocat', avatarUrl: 'https://example.com/octocat.png' },
      assets: [
        {
          id: 11,
          name: 'app.dmg',
          size: 2048,
          downloadCount: 5,
          contentType: 'application/octet-stream',
          browserDownloadUrl: 'https://example.com/app.dmg',
          updatedAt: '2026-01-02T01:00:00Z',
        },
      ],
      tarballUrl: 'https://example.com/tarball',
      zipballUrl: 'https://example.com/zipball',
    })
  })

  it('defaults missing release fields defensively', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: [{}] })

    const result = await api.listRepositoryReleases({ owner: 'octo-org', repo: 'hello-world' })

    expect(result.items[0]).toEqual({
      id: 0,
      tagName: '',
      targetCommitish: '',
      name: null,
      body: null,
      draft: false,
      prerelease: false,
      createdAt: null,
      publishedAt: null,
      htmlUrl: '',
      author: null,
      assets: [],
      tarballUrl: null,
      zipballUrl: null,
    })
  })
})

describe('ReleasesApi create', () => {
  it('creates a release with all provided fields', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: createReleaseResponse() })

    await api.createRelease({
      owner: 'octo-org',
      repo: 'hello-world',
      tagName: 'v1.0.0',
      targetCommitish: 'main',
      name: 'Version 1.0.0',
      body: 'First stable release',
      draft: true,
      prerelease: false,
    })

    expect(request).toHaveBeenCalledWith(
      'POST /repos/{owner}/{repo}/releases',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        tag_name: 'v1.0.0',
        target_commitish: 'main',
        name: 'Version 1.0.0',
        body: 'First stable release',
        draft: true,
        prerelease: false,
      },
    )
  })

  it('omits optional fields that are not provided', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: createReleaseResponse() })

    await api.createRelease({
      owner: 'octo-org',
      repo: 'hello-world',
      tagName: 'v2.0.0',
    })

    expect(request).toHaveBeenCalledWith(
      'POST /repos/{owner}/{repo}/releases',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        tag_name: 'v2.0.0',
      },
    )
  })

  it('rejects an empty tag name', async () => {
    const { api, request } = createApi()

    await expect(api.createRelease({
      owner: 'octo-org',
      repo: 'hello-world',
      tagName: '   ',
    })).rejects.toThrow('Release tag name is required')
    expect(request).not.toHaveBeenCalled()
  })
})

describe('ReleasesApi update', () => {
  it('sends only the provided fields', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: createReleaseResponse() })

    await api.updateRelease({
      owner: 'octo-org',
      repo: 'hello-world',
      releaseId: 9,
      draft: false,
    })

    expect(request).toHaveBeenCalledWith(
      'PATCH /repos/{owner}/{repo}/releases/{release_id}',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        release_id: 9,
        draft: false,
      },
    )
  })

  it('updates release content fields', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: createReleaseResponse() })

    await api.updateRelease({
      owner: 'octo-org',
      repo: 'hello-world',
      releaseId: 9,
      tagName: 'v1.0.1',
      name: 'Version 1.0.1',
      body: 'Patched',
      prerelease: true,
    })

    expect(request).toHaveBeenCalledWith(
      'PATCH /repos/{owner}/{repo}/releases/{release_id}',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        release_id: 9,
        tag_name: 'v1.0.1',
        name: 'Version 1.0.1',
        body: 'Patched',
        prerelease: true,
      },
    )
  })
})

describe('ReleasesApi delete', () => {
  it('deletes a release', async () => {
    const { api, request } = createApi()

    await api.deleteRelease({
      owner: 'octo-org',
      repo: 'hello-world',
      releaseId: 9,
    })

    expect(request).toHaveBeenCalledWith(
      'DELETE /repos/{owner}/{repo}/releases/{release_id}',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        release_id: 9,
      },
    )
  })
})
