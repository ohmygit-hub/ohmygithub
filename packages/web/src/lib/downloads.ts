// Download links for the desktop app. Filenames follow the electron-builder
// artifactName templates in packages/client/electron-builder.yml:
//   dmg / AppImage : ${productName}-${version}-${arch}.${ext}
//   nsis (win)     : ${productName}-${version}-${arch}-setup.${ext}
// productName is "Oh My GitHub" (spaces are URL-encoded). The version is baked
// in at build time from the monorepo root package.json (see vite.config.ts).

const PRODUCT_NAME = 'Oh My GitHub'

export const APP_VERSION: string = __APP_VERSION__

// `||` (not `??`): the deploy workflow passes an empty string when the env var
// is unset, and an empty base would make the download links resolve relative to
// the landing page host instead of the R2 bucket.
export const BASE_URL: string =
  import.meta.env.VITE_R2_PUBLIC_BASE_URL || 'https://resource.oh-my-github.app'

export type PlatformId =
  | 'mac-arm64'
  | 'mac-x64'
  | 'win-x64'
  | 'linux-x64'
  | 'linux-arm64'

export type OS = 'mac' | 'windows' | 'linux'

export interface Platform {
  id: PlatformId
  os: OS
  /** i18n key under `download.platforms.*`. */
  labelKey: string
  filename: string
  url: string
}

function buildUrl(filename: string): string {
  return `${BASE_URL}/${encodeURIComponent(filename)}`
}

function platform(id: PlatformId, os: OS, filename: string): Platform {
  return { id, os, labelKey: `download.platforms.${id}`, filename, url: buildUrl(filename) }
}

const v = APP_VERSION

// Order matters: the first entry per OS is the default the smart button picks.
export const PLATFORMS: Platform[] = [
  platform('mac-arm64', 'mac', `${PRODUCT_NAME}-${v}-arm64.dmg`),
  platform('mac-x64', 'mac', `${PRODUCT_NAME}-${v}-x64.dmg`),
  platform('win-x64', 'windows', `${PRODUCT_NAME}-${v}-x64-setup.exe`),
  // NOTE: electron-builder emits `x86_64` (not `x64`) for the Linux AppImage.
  platform('linux-x64', 'linux', `${PRODUCT_NAME}-${v}-x86_64.AppImage`),
  platform('linux-arm64', 'linux', `${PRODUCT_NAME}-${v}-arm64.AppImage`)
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
