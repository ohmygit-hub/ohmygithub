import { session } from 'electron'
import { getLocalConfig } from './config'

const githubProxyProbeUrl = 'https://api.github.com'

export async function resolveGitHubProxyUrl(): Promise<string | undefined> {
  return (
    normalizeProxyUrl(getLocalConfig().network.proxyUrl) ??
    normalizeProxyUrl(getEnvironmentProxyUrl()) ??
    normalizeProxyUrl(await getSystemProxyUrl()) ??
    undefined
  )
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
