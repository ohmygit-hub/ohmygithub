import {
  getPlatformManifestName,
  resolveManifestArtifactUrl,
  type PlatformId
} from './download-manifest'
import { GITHUB_URL } from './site'

// The exact installer filename is never guessed client-side: the web deploy can
// go live while the publish workflow is still uploading artifacts, so a
// version-baked URL may 404. Instead, a click fetches the electron-builder
// update manifest (latest*.yml, uploaded to R2 last) and downloads whatever
// installer it lists. The GitHub releases page is the only static fallback.

export const APP_VERSION: string = __APP_VERSION__

// `||` (not `??`): the deploy workflow passes an empty string when the env var
// is unset, and an empty base would make the download links resolve relative to
// the landing page host instead of the R2 bucket.
export const BASE_URL: string =
  import.meta.env.VITE_R2_PUBLIC_BASE_URL || 'https://resource.oh-my-github.app'

// Static href / last-resort target: always exists, even mid-release.
export const LATEST_RELEASE_URL = `${GITHUB_URL}/releases/latest`

export type { PlatformId } from './download-manifest'

export type OS = 'mac' | 'windows' | 'linux'

export interface Platform {
  id: PlatformId
  os: OS
  /** i18n key under `download.platforms.*`. */
  labelKey: string
}

function platform(id: PlatformId, os: OS): Platform {
  return { id, os, labelKey: `download.platforms.${id}` }
}

// Order matters: the first entry per OS is the default the smart button picks.
export const PLATFORMS: Platform[] = [
  platform('mac-arm64', 'mac'),
  platform('mac-x64', 'mac'),
  platform('win-x64', 'windows'),
  platform('linux-x64', 'linux'),
  platform('linux-arm64', 'linux')
]

interface UAData {
  platform?: string
}

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'mac'
  const uaData = (navigator as Navigator & { userAgentData?: UAData }).userAgentData
  const platformHint = (uaData?.platform ?? '').toLowerCase()
  const ua = navigator.userAgent.toLowerCase()
  const haystack = `${platformHint} ${ua}`
  if (haystack.includes('win')) return 'windows'
  if (haystack.includes('linux') || haystack.includes('android')) return 'linux'
  return 'mac'
}

/**
 * Best guess for the visitor's platform, used for the primary download button.
 * Arch can't be reliably read in the browser, so we default macOS to Apple
 * Silicon and Linux to x64 — every platform stays reachable via the full list.
 */
export function detectPlatform(): Platform {
  const os = detectOS()
  return PLATFORMS.find((p) => p.os === os) ?? PLATFORMS[0]
}

export async function resolveLatestDownloadUrl(platform: Platform): Promise<string> {
  if (typeof fetch !== 'function') return LATEST_RELEASE_URL

  try {
    const manifestUrl = `${BASE_URL}/${getPlatformManifestName(platform.id)}`
    const response = await fetch(manifestUrl, { cache: 'no-store' })
    if (!response.ok) return LATEST_RELEASE_URL

    const manifest = await response.text()
    return resolveManifestArtifactUrl(platform.id, manifest, BASE_URL) ?? LATEST_RELEASE_URL
  } catch {
    return LATEST_RELEASE_URL
  }
}
