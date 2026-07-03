import { deflateRawSync } from 'node:zlib'
import { describe, expect, it, vi } from 'vitest'
import type { GitHubOctokit } from '../transport'
import { ActionsApi } from './actions'

describe('ActionsApi workflow runs', () => {
  it('filters repository workflow runs by commit sha', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({
      data: {
        total_count: 0,
        workflow_runs: [],
      },
    })

    await api.listRepositoryWorkflowRuns({
      owner: 'octo-org',
      repo: 'hello-world',
      headSha: 'abc1234',
      page: 2,
      perPage: 30,
    })

    expect(request).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}/actions/runs',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        head_sha: 'abc1234',
        page: 2,
        per_page: 30,
      },
    )
  })
})

describe('ActionsApi rerun operations', () => {
  it('re-runs a workflow run with debug logging when requested', async () => {
    const { api, request } = createApi()

    await api.rerunWorkflowRun({
      owner: 'octo-org',
      repo: 'hello-world',
      runId: 42,
      enableDebugLogging: true,
    })

    expect(request).toHaveBeenCalledWith(
      'POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        run_id: 42,
        enable_debug_logging: true,
      },
    )
  })

  it('re-runs failed jobs for a workflow run', async () => {
    const { api, request } = createApi()

    await api.rerunFailedWorkflowRunJobs({
      owner: 'octo-org',
      repo: 'hello-world',
      runId: 77,
    })

    expect(request).toHaveBeenCalledWith(
      'POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        run_id: 77,
      },
    )
  })

  it('re-runs a single workflow job with debugger options when requested', async () => {
    const { api, request } = createApi()

    await api.rerunWorkflowJob({
      owner: 'octo-org',
      repo: 'hello-world',
      jobId: 123,
      enableDebugLogging: true,
      enableDebugger: true,
    })

    expect(request).toHaveBeenCalledWith(
      'POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        job_id: 123,
        enable_debug_logging: true,
        enable_debugger: true,
      },
    )
  })
})

describe('ActionsApi workflow job logs', () => {
  it('fetches per-step logs from the run attempt archive for completed jobs', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({
      data: createDeflatedZip({
        '1_Build and test.txt': 'combined job log\n',
        'Build and test/system.txt': 'runner diagnostics\n',
        'Build and test/1_Set up job.txt': '2026-06-30T11:30:00.000Z setup line\n',
        'Build and test/3_Checkout.txt': '2026-06-30T11:30:01.000Z checkout line\n',
      }),
    })

    const log = await api.getWorkflowJobLog({
      owner: 'octo-org',
      repo: 'hello-world',
      jobId: 456,
      job: {
        runId: 789,
        runAttempt: 2,
        name: 'Build and test',
        status: 'completed',
      },
    })

    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        run_id: 789,
        attempt_number: 2,
      },
    )
    expect(log.isAvailable).toBe(true)
    expect(log.steps).toEqual([
      {
        number: 1,
        title: 'Set up job',
        content: '2026-06-30T11:30:00.000Z setup line',
      },
      {
        number: 3,
        title: 'Checkout',
        content: '2026-06-30T11:30:01.000Z checkout line',
      },
    ])
    expect(log.content).toContain('setup line')
    expect(log.content).toContain('checkout line')
  })

  it('falls back to the plain job log when the archive is unavailable for a completed job', async () => {
    const { api, request } = createApi()
    request
      .mockRejectedValueOnce({ status: 404, response: { url: 'https://api.github.com/', headers: {} } })
      .mockResolvedValueOnce({ data: '2026-06-30T11:30:00.000Z plain line\n' })

    const log = await api.getWorkflowJobLog({
      owner: 'octo-org',
      repo: 'hello-world',
      jobId: 456,
      job: {
        runId: 789,
        runAttempt: 1,
        name: 'Build and test',
        status: 'completed',
      },
    })

    expect(request).toHaveBeenNthCalledWith(
      2,
      'GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        job_id: 456,
      },
    )
    expect(log.content).toBe('2026-06-30T11:30:00.000Z plain line\n')
    expect(log.steps).toBeUndefined()
  })

  it('uses the plain job log endpoint directly for in-progress jobs', async () => {
    const { api, request } = createApi()
    request.mockResolvedValueOnce({ data: '2026-06-30T11:30:00.000Z live line\n' })

    const log = await api.getWorkflowJobLog({
      owner: 'octo-org',
      repo: 'hello-world',
      jobId: 456,
      job: {
        runId: 789,
        runAttempt: 1,
        name: 'Build and test',
        status: 'in_progress',
      },
    })

    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        job_id: 456,
      },
    )
    expect(log.content).toBe('2026-06-30T11:30:00.000Z live line\n')
  })

  it('returns per-step logs from the fallback archive when the job log blob is not ready', async () => {
    const { api, request } = createApi()
    request
      .mockRejectedValueOnce({
        status: 404,
        response: {
          url: 'https://productionresultssa13.blob.core.windows.net/actions-results/run/logs/job/job-logs.txt',
          headers: {
            'x-ms-error-code': 'BlobNotFound',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 456,
          run_id: 789,
          run_attempt: 2,
          name: 'Build and test',
          status: 'in_progress',
        },
      })
      .mockResolvedValueOnce({
        data: createDeflatedZip({
          'Build and test/1_Set up job.txt': '2026-06-30T11:30:00.000Z setup line\n',
        }),
      })

    const log = await api.getWorkflowJobLog({
      owner: 'octo-org',
      repo: 'hello-world',
      jobId: 456,
    })

    expect(log.isAvailable).toBe(true)
    expect(log.steps).toEqual([
      {
        number: 1,
        title: 'Set up job',
        content: '2026-06-30T11:30:00.000Z setup line',
      },
    ])
  })

  it('falls back to workflow run attempt logs when the job log blob is not ready', async () => {
    const { api, request } = createApi()
    request
      .mockRejectedValueOnce({
        status: 404,
        response: {
          url: 'https://productionresultssa13.blob.core.windows.net/actions-results/run/logs/job/job-logs.txt',
          headers: {
            'x-ms-error-code': 'BlobNotFound',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 456,
          run_id: 789,
          run_attempt: 2,
          name: 'Build and test',
          status: 'in_progress',
        },
      })
      .mockResolvedValueOnce({
        data: createDeflatedZip({
          '0_Build and test.txt': '2026-06-30T11:30:00.000Z live line\n',
        }),
      })

    await expect(api.getWorkflowJobLog({
      owner: 'octo-org',
      repo: 'hello-world',
      jobId: 456,
    })).resolves.toMatchObject({
      jobId: 456,
      content: '2026-06-30T11:30:00.000Z live line\n',
      isAvailable: true,
    })

    expect(request).toHaveBeenNthCalledWith(
      2,
      'GET /repos/{owner}/{repo}/actions/jobs/{job_id}',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        job_id: 456,
      },
    )
    expect(request).toHaveBeenNthCalledWith(
      3,
      'GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs',
      {
        owner: 'octo-org',
        repo: 'hello-world',
        run_id: 789,
        attempt_number: 2,
      },
    )
  })

  it('returns an unavailable empty log when GitHub redirects to a missing log blob', async () => {
    const { api, request } = createApi()
    request.mockRejectedValueOnce({
      status: 404,
      response: {
        url: 'https://productionresultssa13.blob.core.windows.net/actions-results/run/logs/job/job-logs.txt',
        headers: {
          'x-ms-error-code': 'BlobNotFound',
        },
        data: new TextEncoder().encode('<Error><Code>BlobNotFound</Code></Error>').buffer,
      },
    })

    await expect(api.getWorkflowJobLog({
      owner: 'octo-org',
      repo: 'hello-world',
      jobId: 84275343860,
    })).resolves.toMatchObject({
      jobId: 84275343860,
      content: '',
      isAvailable: false,
    })
  })

  it('still throws non-transient workflow job log errors', async () => {
    const { api, request } = createApi()
    const error = {
      status: 403,
      response: {
        url: 'https://api.github.com/repos/octo-org/hello-world/actions/jobs/123/logs',
        headers: {},
      },
    }
    request.mockRejectedValueOnce(error)

    await expect(api.getWorkflowJobLog({
      owner: 'octo-org',
      repo: 'hello-world',
      jobId: 123,
    })).rejects.toBe(error)
  })
})

function createApi() {
  const request = vi.fn().mockResolvedValue({ data: {} })
  const api = new ActionsApi({ request } as unknown as GitHubOctokit)

  return { api, request }
}

function createDeflatedZip(files: Record<string, string>): ArrayBuffer {
  const chunks: Uint8Array[] = []
  const encoder = new TextEncoder()

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name)
    const contentBytes = encoder.encode(content)
    const compressedBytes = deflateRawSync(contentBytes)
    const header = new ArrayBuffer(30)
    const view = new DataView(header)

    view.setUint32(0, 0x04034b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(8, 8, true)
    view.setUint32(18, compressedBytes.byteLength, true)
    view.setUint32(22, contentBytes.byteLength, true)
    view.setUint16(26, nameBytes.byteLength, true)
    chunks.push(new Uint8Array(header), nameBytes, compressedBytes)
  }

  const totalLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0)
  const output = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
  }

  return output.buffer
}
