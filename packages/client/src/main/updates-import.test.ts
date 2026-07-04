import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('electron-updater import shape', () => {
  it('uses a default CommonJS import so the Electron ESM main process can load it', () => {
    const source = readFileSync(resolve(__dirname, 'updates.ts'), 'utf8')

    expect(source).not.toMatch(/import\s*\{[^}]*autoUpdater[^}]*\}\s*from\s*['"]electron-updater['"]/)
    expect(source).toMatch(/import\s+electronUpdater\s+from\s*['"]electron-updater['"]/)
  })

  it('forces the updater active in development builds so the public feed can be checked', () => {
    const source = readFileSync(resolve(__dirname, 'updates.ts'), 'utf8')

    expect(source).toContain('autoUpdater.forceDevUpdateConfig = !app.isPackaged')
  })
})
