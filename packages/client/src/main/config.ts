import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { ipcMain } from 'electron'

export interface KeyboardShortcutOverride {
  accelerator: string | null
  disabled: boolean
}

export interface LocalConfig {
  schemaVersion: 2
  github: {
    activeAccountLogin: string | null
  }
  network: {
    /**
     * How GitHub connections choose a proxy:
     * - `none`   — direct, ignoring env vars and the OS proxy
     * - `system` — the OS/env proxy (default; matches the app's original behaviour)
     * - `custom` — the explicit `proxyUrl` below
     */
    proxyMode: 'none' | 'system' | 'custom'
    proxyUrl: string | null
    /**
     * Opt-in: trust the OS system CA store (in addition to Node's bundled
     * roots) for GitHub connections. Off by default — follows Node's default
     * behaviour. Enable only to work with a locally-installed root CA, e.g. a
     * reverse-proxy tool that MITMs github.com; at the user's own risk.
     */
    useSystemCa: boolean
  }
  ui: {
    locale: 'en' | 'zh'
    theme: 'auto' | 'light' | 'dark'
    colorScheme: 'default' | 'ocean' | 'forest' | 'rose' | 'amber'
    uiFontSizePx: number
    codeFontSizePx: number
    uiFontFamily: string
    codeFontFamily: string
    mermaidTheme: 'auto' | 'default' | 'dark' | 'forest' | 'neutral'
    keyboardShortcuts: Record<string, KeyboardShortcutOverride>
  }
}

export interface LocalConfigInfo {
  path: string
  config: LocalConfig
}

export type LocalConfigPatch = Partial<{
  github: Partial<LocalConfig['github']>
  network: Partial<LocalConfig['network']>
  ui: Partial<LocalConfig['ui']>
}>

const configPath = join(homedir(), '.oh-my-github', 'config.json')
const DEFAULT_UI_FONT_SIZE_PX = 16
const DEFAULT_CODE_FONT_SIZE_PX = 13
const MAX_FONT_FAMILY_LENGTH = 256
const MAX_KEYBOARD_SHORTCUT_ID_LENGTH = 128
const MAX_KEYBOARD_SHORTCUT_ACCELERATOR_LENGTH = 80

export function initializeConfig(): LocalConfigInfo {
  const config = readConfig()
  writeConfig(config)

  return {
    path: configPath,
    config
  }
}

export function registerConfigIpc(onChange?: (config: LocalConfig) => void): void {
  ipcMain.handle('config:get', () => initializeConfig())
  ipcMain.handle('config:update', (_event, patch: LocalConfigPatch) => {
    const config = mergeConfig(readConfig(), patch)
    writeConfig(config)
    onChange?.(config)

    return {
      path: configPath,
      config
    }
  })
}

export function getLocalConfig(): LocalConfig {
  return readConfig()
}

function readConfig(): LocalConfig {
  try {
    const raw = readFileSync(configPath, 'utf8')
    return normalizeConfig(JSON.parse(raw) as Partial<LocalConfig>)
  } catch (error) {
    if (isMissingFileError(error)) {
      return defaultConfig()
    }

    throw error
  }
}

function writeConfig(config: LocalConfig): void {
  mkdirSync(dirname(configPath), { recursive: true })
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
}

function mergeConfig(config: LocalConfig, patch: LocalConfigPatch): LocalConfig {
  return normalizeConfig({
    ...config,
    github: {
      ...config.github,
      ...patch.github
    },
    network: {
      ...config.network,
      ...patch.network
    },
    ui: {
      ...config.ui,
      ...patch.ui
    }
  })
}

function normalizeConfig(config: Partial<LocalConfig>): LocalConfig {
  return {
    schemaVersion: 2,
    github: {
      activeAccountLogin: config.github?.activeAccountLogin ?? null
    },
    network: {
      proxyMode: normalizeProxyMode(config.network?.proxyMode, config.network?.proxyUrl),
      proxyUrl: normalizeProxyUrl(config.network?.proxyUrl),
      useSystemCa: config.network?.useSystemCa === true
    },
    ui: {
      locale: normalizeLocale(config.ui?.locale),
      theme: normalizeTheme(config.ui?.theme),
      colorScheme: normalizeColorScheme(config.ui?.colorScheme),
      uiFontSizePx: normalizePx(config.ui?.uiFontSizePx, DEFAULT_UI_FONT_SIZE_PX, 12, 20),
      codeFontSizePx: normalizePx(config.ui?.codeFontSizePx, DEFAULT_CODE_FONT_SIZE_PX, 11, 20),
      uiFontFamily: normalizeFontFamily(config.ui?.uiFontFamily),
      codeFontFamily: normalizeFontFamily(config.ui?.codeFontFamily),
      mermaidTheme: normalizeMermaidTheme(config.ui?.mermaidTheme),
      keyboardShortcuts: normalizeKeyboardShortcuts(config.ui?.keyboardShortcuts)
    }
  }
}

function defaultConfig(): LocalConfig {
  return {
    schemaVersion: 2,
    github: {
      activeAccountLogin: null
    },
    network: {
      proxyMode: 'system',
      proxyUrl: null,
      useSystemCa: false
    },
    ui: {
      locale: 'en',
      theme: 'auto',
      colorScheme: 'default',
      uiFontSizePx: DEFAULT_UI_FONT_SIZE_PX,
      codeFontSizePx: DEFAULT_CODE_FONT_SIZE_PX,
      uiFontFamily: '',
      codeFontFamily: '',
      mermaidTheme: 'auto',
      keyboardShortcuts: {}
    }
  }
}

function normalizeProxyMode(
  value: unknown,
  proxyUrl: unknown
): LocalConfig['network']['proxyMode'] {
  if (value === 'none' || value === 'system' || value === 'custom') {
    return value
  }

  // Migrate configs written before proxyMode existed: an explicit proxyUrl meant
  // "custom", otherwise the old null-cascade behaviour maps onto "system".
  return typeof proxyUrl === 'string' && proxyUrl.trim() ? 'custom' : 'system'
}

function normalizeProxyUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const proxyUrl = value.trim()

  return proxyUrl ? proxyUrl : null
}

function normalizeLocale(value: unknown): LocalConfig['ui']['locale'] {
  return value === 'zh' ? 'zh' : 'en'
}

function normalizeTheme(value: unknown): LocalConfig['ui']['theme'] {
  if (value === 'light' || value === 'dark') {
    return value
  }

  return 'auto'
}

function normalizeColorScheme(value: unknown): LocalConfig['ui']['colorScheme'] {
  if (value === 'ocean' || value === 'forest' || value === 'rose' || value === 'amber') {
    return value
  }

  return 'default'
}

function normalizeMermaidTheme(value: unknown): LocalConfig['ui']['mermaidTheme'] {
  if (value === 'default' || value === 'dark' || value === 'forest' || value === 'neutral') {
    return value
  }

  return 'auto'
}

function normalizePx(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return Math.min(max, Math.max(min, Math.round(parsed)))
}

function normalizeFontFamily(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  const normalized = value
    .replace(/[\r\n\f]+/g, ' ')
    .trim()
    .slice(0, MAX_FONT_FAMILY_LENGTH)

  const lastCode = normalized.charCodeAt(normalized.length - 1)

  if (lastCode >= 0xd800 && lastCode <= 0xdbff) {
    return normalized.slice(0, -1)
  }

  return normalized
}

function normalizeKeyboardShortcuts(value: unknown): Record<string, KeyboardShortcutOverride> {
  if (!isRecord(value)) {
    return {}
  }

  const result: Record<string, KeyboardShortcutOverride> = {}

  for (const [commandId, rawOverride] of Object.entries(value)) {
    if (!isValidKeyboardShortcutId(commandId) || !isRecord(rawOverride)) {
      continue
    }

    const disabled = rawOverride.disabled === true
    const accelerator = normalizeKeyboardShortcutAccelerator(rawOverride.accelerator)

    if (!disabled && accelerator === null) {
      continue
    }

    result[commandId] = {
      accelerator,
      disabled
    }
  }

  return result
}

function normalizeKeyboardShortcutAccelerator(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const accelerator = value
    .replace(/[\r\n\f]+/g, ' ')
    .trim()
    .slice(0, MAX_KEYBOARD_SHORTCUT_ACCELERATOR_LENGTH)

  return accelerator ? accelerator : null
}

function isValidKeyboardShortcutId(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MAX_KEYBOARD_SHORTCUT_ID_LENGTH &&
    /^[a-z][a-zA-Z0-9.-]*$/.test(value)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ENOENT'
  )
}
