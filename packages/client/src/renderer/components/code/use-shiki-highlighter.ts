import { ref } from 'vue'
import type {
  BundledLanguage,
  BundledTheme,
  HighlighterGeneric,
  ShikiTransformer,
  ThemedToken,
  ThemeRegistrationRaw
} from 'shiki'
import { useSettingsStore } from '@/stores/settings'
import { normalizeCodeLanguage, resolveCodeLanguage } from './code-language'
import { getSchemeCodeThemes } from './scheme-code-themes'
import type { DiffLine } from './parse-diff'

type Highlighter = HighlighterGeneric<BundledLanguage, BundledTheme>
export type ShikiThemePair = {
  light: ThemeRegistrationRaw
  dark: ThemeRegistrationRaw
}

export type ShikiHighlightOptions = {
  language?: string
  filename?: string
  theme?: ThemeRegistrationRaw
  themes?: ShikiThemePair
  diffLines?: DiffLine[]
}

let highlighterPromise: Promise<Highlighter> | null = null
const loadedLanguages = new Set<string>(['plaintext'])
const loadedThemes = new Set<string>()

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then((shiki) =>
      shiki.createHighlighter({
        langs: [],
        themes: []
      })
    )
  }

  return highlighterPromise
}

async function ensureLanguage(highlighter: Highlighter, language: string): Promise<string> {
  const normalized = normalizeCodeLanguage(language)

  if (loadedLanguages.has(normalized)) {
    return normalized
  }

  try {
    await highlighter.loadLanguage(normalized as BundledLanguage)
    loadedLanguages.add(normalized)
    return normalized
  } catch {
    loadedLanguages.add(normalized)
    return 'plaintext'
  }
}

async function ensureTheme(highlighter: Highlighter, theme: ThemeRegistrationRaw): Promise<void> {
  const name = theme.name ?? ''
  if (loadedThemes.has(name)) return

  try {
    await highlighter.loadTheme(theme)
    loadedThemes.add(name)
  } catch {
    loadedThemes.add(name)
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function createDiffTransformer(lines: DiffLine[]): ShikiTransformer {
  let maxLine = 0
  for (const line of lines) {
    if (line.oldLine && line.oldLine > maxLine) maxLine = line.oldLine
    if (line.newLine && line.newLine > maxLine) maxLine = line.newLine
  }
  const width = Math.max(2, String(maxLine).length)
  const pad = (value: number | null): string =>
    value === null ? ' '.repeat(width) : String(value).padStart(width)

  return {
    name: 'oh-my-github-diff',
    line(node, line) {
      const info = lines[line - 1]
      if (!info) return

      const className =
        info.type === 'add'
          ? 'diff-add'
          : info.type === 'del'
            ? 'diff-remove'
            : info.type === 'hunk'
              ? 'diff-hunk'
              : ''

      if (className) {
        const existing = node.properties.class
        if (Array.isArray(existing)) {
          existing.push(className)
        } else if (typeof existing === 'string' && existing.length > 0) {
          node.properties.class = `${existing} ${className}`
        } else {
          node.properties.class = className
        }
      }

      const marker = info.type === 'add' ? '+' : info.type === 'del' ? '-' : ' '
      node.properties.dataLinenums = `${pad(info.oldLine)} ${pad(info.newLine)} ${marker}`
    },
  }
}

export function useShikiHighlighter() {
  const settings = useSettingsStore()
  const html = ref('')
  const loading = ref(false)

  async function highlight(code: string, options: ShikiHighlightOptions = {}) {
    loading.value = true

    try {
      const highlighter = await getHighlighter()
      const language = await ensureLanguage(highlighter, resolveCodeLanguage(options))
      const themes = options.themes ?? getSchemeCodeThemes(settings.colorScheme)
      const transformers = options.diffLines
        ? [createDiffTransformer(options.diffLines)]
        : undefined

      if (options.theme) {
        await ensureTheme(highlighter, options.theme)
        html.value = highlighter.codeToHtml(code, {
          lang: language as BundledLanguage,
          theme: options.theme,
          transformers
        })
      } else {
        await Promise.all([
          ensureTheme(highlighter, themes.light),
          ensureTheme(highlighter, themes.dark)
        ])

        html.value = highlighter.codeToHtml(code, {
          lang: language as BundledLanguage,
          themes,
          transformers
        })
      }
    } catch {
      html.value = `<pre><code>${escapeHtml(code)}</code></pre>`
    } finally {
      loading.value = false
    }
  }

  return {
    highlight,
    html,
    loading
  }
}

export function useShikiTokenizer() {
  const settings = useSettingsStore()

  async function tokenize(
    code: string,
    options: ShikiHighlightOptions = {}
  ): Promise<ThemedToken[][] | null> {
    try {
      const highlighter = await getHighlighter()
      const language = await ensureLanguage(highlighter, resolveCodeLanguage(options))
      const themes = options.themes ?? getSchemeCodeThemes(settings.colorScheme)

      await Promise.all([
        ensureTheme(highlighter, themes.light),
        ensureTheme(highlighter, themes.dark)
      ])

      // Dual-theme tokens carry htmlStyle with the light color plus a
      // --shiki-dark variable, so rows rendered inside a `.shiki` container
      // pick up dark mode from the existing stylesheet rule.
      return highlighter.codeToTokens(code, {
        lang: language as BundledLanguage,
        themes,
        defaultColor: 'light',
        cssVariablePrefix: '--shiki-'
      }).tokens
    } catch {
      return null
    }
  }

  return { tokenize }
}
