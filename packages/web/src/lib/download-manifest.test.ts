import { describe, expect, it } from 'vitest'
import {
  getPlatformManifestName,
  resolveManifestArtifactUrl,
  type PlatformId
} from './download-manifest'

describe('download manifest resolution', () => {
  it.each<[PlatformId, string]>([
    ['mac-arm64', 'latest-mac.yml'],
    ['mac-x64', 'latest-mac.yml'],
    ['win-x64', 'latest.yml'],
    ['linux-x64', 'latest-linux.yml'],
    ['linux-arm64', 'latest-linux.yml']
  ])('uses the updater manifest for %s', (platformId, manifestName) => {
    expect(getPlatformManifestName(platformId)).toBe(manifestName)
  })

  it('prefers the matching installer from latest-mac.yml over the fallback URL', () => {
    const manifest = [
      'version: 0.0.7',
      'files:',
      '  - url: Oh My GitHub-0.0.7-arm64-mac.zip',
      '    sha512: zip',
      '  - url: Oh My GitHub-0.0.7-arm64.dmg',
      '    sha512: dmg',
      'path: Oh My GitHub-0.0.7-arm64-mac.zip'
    ].join('\n')

    expect(resolveManifestArtifactUrl('mac-arm64', manifest, 'https://resource.example.com')).toBe(
      'https://resource.example.com/Oh%20My%20GitHub-0.0.7-arm64.dmg'
    )
  })

  it('falls back when the manifest has no matching installer for the platform', () => {
    const manifest = [
      'version: 0.0.7',
      'files:',
      '  - url: Oh My GitHub-0.0.7-arm64.AppImage'
    ].join('\n')

    expect(resolveManifestArtifactUrl('linux-x64', manifest, 'https://resource.example.com')).toBeNull()
  })
})
