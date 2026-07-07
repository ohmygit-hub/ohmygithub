export type PlatformId =
  | 'mac-arm64'
  | 'mac-x64'
  | 'win-x64'
  | 'linux-x64'
  | 'linux-arm64'

const PLATFORM_INSTALLER_MATCHERS: Record<PlatformId, (filename: string) => boolean> = {
  'mac-arm64': (filename) => filename.endsWith('-arm64.dmg'),
  'mac-x64': (filename) => filename.endsWith('-x64.dmg'),
  'win-x64': (filename) => filename.endsWith('-x64-setup.exe'),
  'linux-x64': (filename) => filename.endsWith('-x86_64.appimage') || filename.endsWith('-x64.appimage'),
  'linux-arm64': (filename) => filename.endsWith('-arm64.appimage')
}

export function getPlatformManifestName(platformId: PlatformId): string {
  if (platformId.startsWith('mac-')) return 'latest-mac.yml'
  if (platformId.startsWith('linux-')) return 'latest-linux.yml'
  return 'latest.yml'
}

export function resolveManifestArtifactUrl(
  platformId: PlatformId,
  manifest: string,
  baseUrl: string
): string | null {
  const matcher = PLATFORM_INSTALLER_MATCHERS[platformId]
  const artifact = extractManifestArtifacts(manifest).find((candidate) =>
    matcher(getFilename(candidate).toLowerCase())
  )

  return artifact ? buildArtifactUrl(baseUrl, artifact) : null
}

function extractManifestArtifacts(manifest: string): string[] {
  const artifacts: string[] = []

  for (const line of manifest.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:-\s*)?(?:url|path):\s*(.+?)\s*$/)
    const value = match?.[1] ? normalizeYamlScalar(match[1]) : null
    if (value) artifacts.push(value)
  }

  return artifacts
}

function normalizeYamlScalar(value: string): string {
  const trimmed = value.trim()
  const quote = trimmed[0]
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function getFilename(value: string): string {
  const path = value.split(/[?#]/, 1)[0] ?? value
  const segment = path.split('/').filter(Boolean).pop() ?? path

  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function buildArtifactUrl(baseUrl: string, artifact: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return new URL(artifact, base).href
}
