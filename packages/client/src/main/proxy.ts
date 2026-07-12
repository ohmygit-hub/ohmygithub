import tls from 'node:tls'
import { session } from 'electron'
import { getLocalConfig } from './config'

const githubProxyProbeUrl = 'https://api.github.com'

export interface GitHubTransport {
  proxyUrl?: string
  ca?: string[]
}

/**
 * The transport config (proxy + trusted CA) for a GitHub API instance, read
 * from local config. Bundled here so every `createGitHubApi` call site resolves
 * both concerns the same way.
 */
export async function resolveGitHubTransport(): Promise<GitHubTransport> {
  return {
    proxyUrl: await resolveGitHubProxyUrl(),
    ca: resolveGitHubCa()
  }
}

export async function resolveGitHubProxyUrl(): Promise<string | undefined> {
  const network = getLocalConfig().network

  switch (network.proxyMode) {
    case 'none':
      return undefined
    case 'custom':
      return normalizeProxyUrl(network.proxyUrl)
    case 'system':
    default:
      return (
        normalizeProxyUrl(getEnvironmentProxyUrl()) ??
        normalizeProxyUrl(await getSystemProxyUrl()) ??
        undefined
      )
  }
}

/**
 * When the user has opted into `network.useSystemCa`, the OS trust store merged
 * with Node's default roots — so both real GitHub certs and a locally-installed
 * root CA (a reverse-proxy MITM) verify. Off by default: returns `undefined`,
 * leaving Node's default TLS behaviour untouched.
 */
export function resolveGitHubCa(): string[] | undefined {
  if (!getLocalConfig().network.useSystemCa) {
    return undefined
  }

  // Added in Node 22.15; guard so an older runtime degrades to default TLS.
  const getCACertificates = (
    tls as unknown as { getCACertificates?: (type: 'default' | 'system') => string[] }
  ).getCACertificates

  if (typeof getCACertificates !== 'function') {
    return undefined
  }

  try {
    const merged = [...getCACertificates('default'), ...getCACertificates('system')]

    return merged.length > 0 ? merged : undefined
  } catch {
    return undefined
  }
}

function getEnvironmentProxyUrl(): string | undefined {
  return (
    process.env.HTTPS_PROXY ??
    process.env.https_proxy ??
    process.env.HTTP_PROXY ??
    process.env.http_proxy ??
    process.env.ALL_PROXY ??
    process.env.all_proxy
  )
}

async function getSystemProxyUrl(): Promise<string | undefined> {
  const proxyRules = await session.defaultSession.resolveProxy(githubProxyProbeUrl)
  const proxyRule = proxyRules
    .split(';')
    .map((rule) => rule.trim())
    .find((rule) => rule && rule !== 'DIRECT')

  if (!proxyRule) {
    return undefined
  }

  const [scheme, host] = proxyRule.split(/\s+/, 2)

  if (!host) {
    return undefined
  }

  if (scheme === 'PROXY' || scheme === 'HTTPS') {
    return `http://${host}`
  }

  return undefined
}

function normalizeProxyUrl(value: string | null | undefined): string | undefined {
  const proxyUrl = value?.trim()

  if (!proxyUrl) {
    return undefined
  }

  if (/^https?:\/\//i.test(proxyUrl)) {
    return proxyUrl
  }

  return `http://${proxyUrl}`
}
