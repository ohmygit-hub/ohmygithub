import { Octokit, RequestError } from 'octokit'
import { ProxyAgent, fetch as undiciFetch } from 'undici'
import type { GitHubApiOptions } from './types'

export type GitHubOctokit = Octokit

export { RequestError }

export function createOctokit(options: GitHubApiOptions): GitHubOctokit {
  return new Octokit({
    auth: options.token,
    baseUrl: options.baseUrl,
    request: options.proxyUrl
      ? {
          fetch: createProxyFetch(options.proxyUrl)
        }
      : undefined,
    userAgent: options.userAgent ?? 'oh-my-github'
  })
}

export function createProxyFetch(proxyUrl: string): typeof fetch {
  const dispatcher = new ProxyAgent(proxyUrl)

  return ((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
    undiciFetch(input as Parameters<typeof undiciFetch>[0], {
      ...(init as Parameters<typeof undiciFetch>[1]),
      dispatcher
    } as Parameters<typeof undiciFetch>[1]) as unknown as ReturnType<typeof fetch>) as typeof fetch
}
