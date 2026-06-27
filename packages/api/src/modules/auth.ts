import type { GitHubOctokit } from '../transport'
import { createOctokit, createProxyFetch } from '../transport'
import type {
  GitHubAuthViewer,
  GitHubDeviceAuthorization,
  GitHubDeviceTokenFailureState,
  GitHubDeviceTokenResult,
  PollDeviceAccessTokenOptions,
  StartDeviceAuthorizationOptions
} from '../types'

const deviceCodeEndpoint = 'https://github.com/login/device/code'
const accessTokenEndpoint = 'https://github.com/login/oauth/access_token'

interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete?: string
  expires_in: number
  interval?: number
}

interface AccessTokenResponse {
  access_token?: string
  token_type?: string
  scope?: string
  error?: string
  error_description?: string
}

export const defaultGitHubOAuthScopes = ['repo', 'notifications', 'read:user'] as const

interface AuthApiOptions {
  octokit?: GitHubOctokit
  proxyUrl?: string
}

export class AuthApi {
  constructor(private readonly options: AuthApiOptions = {}) {}

  async startDeviceAuthorization(
    options: StartDeviceAuthorizationOptions
  ): Promise<GitHubDeviceAuthorization> {
    const response = await postGitHubOAuth<DeviceCodeResponse>(
      deviceCodeEndpoint,
      {
        client_id: options.clientId,
        scope: options.scopes.join(' ')
      },
      this.options.proxyUrl
    )

    return {
      deviceCode: response.device_code,
      userCode: response.user_code,
      verificationUri: response.verification_uri,
      verificationUriComplete: response.verification_uri_complete,
      expiresIn: response.expires_in,
      interval: response.interval ?? 5
    }
  }

  async pollDeviceAccessToken(
    options: PollDeviceAccessTokenOptions
  ): Promise<GitHubDeviceTokenResult> {
    const response = await postGitHubOAuth<AccessTokenResponse>(
      accessTokenEndpoint,
      {
        client_id: options.clientId,
        device_code: options.deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      },
      this.options.proxyUrl
    )

    if (response.access_token) {
      return {
        status: 'success',
        accessToken: response.access_token,
        tokenType: response.token_type ?? 'bearer',
        scopes: parseScope(response.scope)
      }
    }

    if (response.error === 'authorization_pending' || response.error === 'slow_down') {
      return {
        status: 'pending',
        reason: response.error,
        interval: response.error === 'slow_down' ? 5 : undefined
      }
    }

    return {
      status: 'failure',
      reason: normalizeTokenFailure(response.error),
      description: response.error_description
    }
  }

  async getViewer(token?: string): Promise<GitHubAuthViewer> {
    const octokit = token
      ? createOctokit({ token, proxyUrl: this.options.proxyUrl })
      : this.options.octokit

    if (!octokit) {
      throw new Error('A GitHub token is required to load the viewer')
    }

    const { data } = await octokit.rest.users.getAuthenticated()

    return {
      id: data.id,
      login: data.login,
      name: data.name,
      avatarUrl: data.avatar_url
    }
  }
}

async function postGitHubOAuth<T>(
  url: string,
  body: Record<string, string>,
  proxyUrl: string | undefined
): Promise<T> {
  const fetchWithProxy = proxyUrl ? createProxyFetch(proxyUrl) : fetch
  const response = await fetchWithProxy(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(body)
  })

  const payload = (await response.json()) as T

  if (!response.ok) {
    throw new Error(`GitHub OAuth request failed with status ${response.status}`)
  }

  return payload
}

function parseScope(value: string | undefined): string[] {
  return value
    ?.split(',')
    .map((scope) => scope.trim())
    .filter(Boolean) ?? []
}

function normalizeTokenFailure(value: string | undefined): GitHubDeviceTokenFailureState {
  if (
    value === 'access_denied' ||
    value === 'expired_token' ||
    value === 'incorrect_client_credentials' ||
    value === 'incorrect_device_code'
  ) {
    return value
  }

  return 'unknown_error'
}
