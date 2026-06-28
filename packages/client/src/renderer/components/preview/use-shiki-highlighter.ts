import { ref } from 'vue'
import type { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki'
import { useSettingsStore } from '../../stores/settings'
import { normalizeCodeLanguage, resolveCodeLanguage } from '../code-language'

type Highlighter = HighlighterGeneric<BundledLanguage, BundledTheme>

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

async function ensureTheme(highlighter: Highlighter, theme: string): Promise<void> {
  if (loadedThemes.has(theme)) return

  try {
    await highlighter.loadTheme(theme as BundledTheme)
    loadedThemes.add(theme)
  } catch {
    loadedThemes.add(theme)
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function useShikiHighlighter() {
  const settings = useSettingsStore()
  const html = ref('')
  const loading = ref(false)

  async function highlight(code: string, options: { language?: string; filename?: string } = {}) {
    loading.value = true

    try {
      const highlighter = await getHighlighter()
      const language = await ensureLanguage(highlighter, resolveCodeLanguage(options))
      const themes = {
        light: settings.codeThemeLight as BundledTheme,
        dark: settings.codeThemeDark as BundledTheme
      }

      await Promise.all([
        ensureTheme(highlighter, themes.light),
        ensureTheme(highlighter, themes.dark)
      ])

      html.value = highlighter.codeToHtml(code, {
        lang: language as BundledLanguage,
        themes
      })
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
