import { Octokit, RequestError } from 'octokit'
import { Agent, type Dispatcher, ProxyAgent, fetch as undiciFetch } from 'undici'
import type { GitHubApiOptions } from './types'

export type GitHubOctokit = Octokit

export { RequestError }

export interface GitHubTransportOptions {
  proxyUrl?: string
  ca?: string | string[]
}

export function createOctokit(options: GitHubApiOptions): GitHubOctokit {
  const fetch = createGitHubFetch(options)

  return new Octokit({
    auth: options.token,
    baseUrl: options.baseUrl,
    request: fetch ? { fetch } : undefined,
    userAgent: options.userAgent ?? 'oh-my-github'
  })
}

/**
 * A custom fetch bound to a proxy and/or a caller-supplied CA, or `undefined`
 * when neither is configured so Octokit / callers fall back to the global
 * fetch and Node's default TLS store.
 */
export function createGitHubFetch(options: GitHubTransportOptions): typeof fetch | undefined {
  const dispatcher = createGitHubDispatcher(options)

  return dispatcher ? createDispatcherFetch(dispatcher) : undefined
}

function createGitHubDispatcher(options: GitHubTransportOptions): Dispatcher | undefined {
  const connect = options.ca ? { ca: options.ca } : undefined

  if (options.proxyUrl) {
    // Object form lets the origin-side TLS honour the extra CA through the tunnel.
    return new ProxyAgent(connect ? { uri: options.proxyUrl, connect } : options.proxyUrl)
  }

  return connect ? new Agent({ connect }) : undefined
}

function createDispatcherFetch(dispatcher: Dispatcher): typeof fetch {
  return ((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
    undiciFetch(input as Parameters<typeof undiciFetch>[0], {
      ...(init as Parameters<typeof undiciFetch>[1]),
      dispatcher
    } as Parameters<typeof undiciFetch>[1]) as unknown as ReturnType<typeof fetch>) as typeof fetch
}
