import { describe, expect, it, vi } from 'vitest'
import type { GitHubOctokit } from '../transport'
import { DeploymentsApi } from './deployments'

describe('DeploymentsApi environments', () => {
  it('lists repository environments with pagination params and maps protection rules', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({
      data: {
        total_count: 2,
        environments: [
          {
            id: 1,
            name: 'production',
            html_url: 'https://github.com/octo-org/hello-world/deployments/activity_log?environment=production',
            created_at: '2026-06-01T00:00:00Z',
            updated_at: '2026-06-02T00:00:00Z',
            protection_rules: [
              { id: 10, type: 'wait_timer', wait_timer: 30 },
              { id: 11, type: 'required_reviewers', reviewers: [{ type: 'User' }, { type: 'Team' }] },
              { id: 12, type: 'branch_policy' },
            ],
          },
          {
            id: 2,
            name: 'staging',
            html_url: null,
            created_at: null,
            updated_at: null,
            protection_rules: [],
          },
        ],
      },
    })

    const page = await api.listRepositoryEnvironments({
      owner: 'octo-org',
      repo: 'hello-world',
      page: 1,
      perPage: 2,
    })

    expect(request).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}/environments',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        page: 1,
        per_page: 2,
      },
    )
    expect(page.totalCount).toBe(2)
    expect(page.hasNextPage).toBe(false)
    expect(page.items[0].protectionRules).toEqual([
      { id: 10, type: 'wait_timer', waitTimer: 30, reviewerCount: null },
      { id: 11, type: 'required_reviewers', waitTimer: null, reviewerCount: 2 },
      { id: 12, type: 'branch_policy', waitTimer: null, reviewerCount: null },
    ])
    expect(page.items[1].protectionRules).toEqual([])
  })

  it('infers hasNextPage from page * perPage against totalCount', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({
      data: {
        total_count: 5,
        environments: [],
      },
    })

    const page = await api.listRepositoryEnvironments({
      owner: 'octo-org',
      repo: 'hello-world',
      page: 1,
      perPage: 2,
    })

    expect(page.hasNextPage).toBe(true)
  })

  it('deletes an environment by name', async () => {
    const { api, request } = createApi()

    await api.deleteEnvironment({
      owner: 'octo-org',
      repo: 'hello-world',
      environmentName: 'production',
    })

    expect(request).toHaveBeenCalledWith(
      'DELETE /repos/{owner}/{repo}/environments/{environment_name}',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        environment_name: 'production',
      },
    )
  })
})

describe('DeploymentsApi deployments', () => {
  it('lists repository deployments and only forwards filters that have values', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: [] })

    await api.listRepositoryDeployments({
      owner: 'octo-org',
      repo: 'hello-world',
      environment: 'production',
      page: 1,
      perPage: 20,
    })

    expect(request).toHaveBeenNthCalledWith(
      1,
      'GET /repos/{owner}/{repo}/deployments',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        page: 1,
        per_page: 20,
        environment: 'production',
      },
    )
  })

  it('omits ref, sha, and task filters when absent', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: [] })

    await api.listRepositoryDeployments({
      owner: 'octo-org',
      repo: 'hello-world',
      page: 1,
      perPage: 20,
    })

    expect(request).toHaveBeenNthCalledWith(
      1,
      'GET /repos/{owner}/{repo}/deployments',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        page: 1,
        per_page: 20,
      },
    )
  })

  it('reports hasNextPage true when the page is exactly full (no total_count in payload)', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({
      data: [
        createDeploymentResponse(1),
        createDeploymentResponse(2),
      ],
    })
    request.mockResolvedValue({ data: [] })

    const page = await api.listRepositoryDeployments({
      owner: 'octo-org',
      repo: 'hello-world',
      page: 1,
      perPage: 2,
    })

    expect(page.totalCount).toBeNull()
    expect(page.hasNextPage).toBe(true)
  })

  it('reports hasNextPage false for a short page', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({
      data: [createDeploymentResponse(1)],
    })
    request.mockResolvedValue({ data: [] })

    const page = await api.listRepositoryDeployments({
      owner: 'octo-org',
      repo: 'hello-world',
      page: 1,
      perPage: 20,
    })

    expect(page.hasNextPage).toBe(false)
  })

  it('fetches the latest status per deployment in parallel with per_page 1', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({
      data: [createDeploymentResponse(1), createDeploymentResponse(2)],
    })
    request.mockResolvedValue({
      data: [
        {
          id: 900,
          state: 'success',
          description: 'Deployed',
          environment_url: 'https://example.dev',
          log_url: 'https://example.dev/logs',
          creator: { login: 'octocat', avatar_url: 'https://example.dev/avatar.png' },
          created_at: '2026-06-03T00:00:00Z',
        },
      ],
    })

    const page = await api.listRepositoryDeployments({
      owner: 'octo-org',
      repo: 'hello-world',
      page: 1,
      perPage: 20,
    })

    expect(request).toHaveBeenNthCalledWith(
      2,
      'GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        deployment_id: 1,
        per_page: 1,
      },
    )
    expect(request).toHaveBeenNthCalledWith(
      3,
      'GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        deployment_id: 2,
        per_page: 1,
      },
    )
    expect(page.items[0].latestStatus).toEqual({
      id: 900,
      state: 'success',
      description: 'Deployed',
      environmentUrl: 'https://example.dev',
      logUrl: 'https://example.dev/logs',
      creator: { login: 'octocat', avatarUrl: 'https://example.dev/avatar.png' },
      createdAt: '2026-06-03T00:00:00Z',
    })
  })

  it('maps an empty statuses array to a null latestStatus', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: [createDeploymentResponse(1)] })
    request.mockResolvedValue({ data: [] })

    const page = await api.listRepositoryDeployments({
      owner: 'octo-org',
      repo: 'hello-world',
      page: 1,
      perPage: 20,
    })

    expect(page.items[0].latestStatus).toBeNull()
  })

  it('sets latestStatus to null and does not throw when a single status request rejects', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({
      data: [createDeploymentResponse(1), createDeploymentResponse(2)],
    })
    request
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        data: [{
          id: 901,
          state: 'success',
          description: '',
          environment_url: null,
          log_url: null,
          creator: null,
          created_at: '2026-06-03T00:00:00Z',
        }],
      })

    await expect(api.listRepositoryDeployments({
      owner: 'octo-org',
      repo: 'hello-world',
      page: 1,
      perPage: 20,
    })).resolves.toMatchObject({
      items: [
        { id: 1, latestStatus: null },
        { id: 2, latestStatus: { id: 901 } },
      ],
    })
  })
})

describe('DeploymentsApi statuses', () => {
  it('lists deployment statuses newest-first with per_page 100', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: [] })

    await api.listDeploymentStatuses({
      owner: 'octo-org',
      repo: 'hello-world',
      deploymentId: 42,
    })

    expect(request).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        deployment_id: 42,
        per_page: 100,
      },
    )
  })
})

describe('DeploymentsApi mutations', () => {
  it('marks a deployment inactive', async () => {
    const { api, request } = createApi()

    await api.markDeploymentInactive({
      owner: 'octo-org',
      repo: 'hello-world',
      deploymentId: 42,
    })

    expect(request).toHaveBeenCalledWith(
      'POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        deployment_id: 42,
        state: 'inactive',
      },
    )
  })

  it('deletes a deployment directly when deactivateFirst is not set', async () => {
    const { api, request } = createApi()

    await api.deleteDeployment({
      owner: 'octo-org',
      repo: 'hello-world',
      deploymentId: 42,
    })

    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(
      'DELETE /repos/{owner}/{repo}/deployments/{deployment_id}',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        deployment_id: 42,
      },
    )
  })

  it('deletes a deployment directly when deactivateFirst is false', async () => {
    const { api, request } = createApi()

    await api.deleteDeployment({
      owner: 'octo-org',
      repo: 'hello-world',
      deploymentId: 42,
      deactivateFirst: false,
    })

    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(
      'DELETE /repos/{owner}/{repo}/deployments/{deployment_id}',
      expect.objectContaining({ deployment_id: 42 }),
    )
  })

  it('marks the deployment inactive before deleting when deactivateFirst is true', async () => {
    const { api, request } = createApi()

    await api.deleteDeployment({
      owner: 'octo-org',
      repo: 'hello-world',
      deploymentId: 42,
      deactivateFirst: true,
    })

    expect(request).toHaveBeenCalledTimes(2)
    expect(request).toHaveBeenNthCalledWith(
      1,
      'POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        deployment_id: 42,
        state: 'inactive',
      },
    )
    expect(request).toHaveBeenNthCalledWith(
      2,
      'DELETE /repos/{owner}/{repo}/deployments/{deployment_id}',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        deployment_id: 42,
      },
    )
  })
})

function createApi() {
  const request = vi.fn().mockResolvedValue({ data: {} })
  const api = new DeploymentsApi({ request } as unknown as GitHubOctokit)

  return { api, request }
}

function createDeploymentResponse(id: number) {
  return {
    id,
    sha: `sha-${id}`,
    ref: 'main',
    task: 'deploy',
    environment: 'production',
    description: null,
    transient_environment: false,
    production_environment: true,
    creator: { login: 'octocat', avatar_url: null },
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:05:00Z',
  }
}
