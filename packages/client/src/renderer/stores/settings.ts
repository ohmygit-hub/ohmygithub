import { computed, watch } from 'vue'
import { useColorMode, useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { i18n, type SupportedLocale } from '../i18n'

export type ThemePreference = 'auto' | 'light' | 'dark'
export type CodeThemePreference = string

export const DEFAULT_CODE_THEME_LIGHT = 'github-light'
export const DEFAULT_CODE_THEME_DARK = 'github-dark'

export const useSettingsStore = defineStore('settings', () => {
  const theme = useStorage<ThemePreference>('oh-my-github:theme', 'auto')
  const locale = useStorage<SupportedLocale>('oh-my-github:locale', 'en')
  const codeThemeLight = useStorage<CodeThemePreference>(
    'oh-my-github:code-theme-light',
    DEFAULT_CODE_THEME_LIGHT
  )
  const codeThemeDark = useStorage<CodeThemePreference>(
    'oh-my-github:code-theme-dark',
    DEFAULT_CODE_THEME_DARK
  )

  const colorMode = useColorMode({
    initialValue: theme.value,
    modes: {
      light: 'light',
      dark: 'dark',
      auto: ''
    }
  })

  const isDark = computed(() => colorMode.value === 'dark')
  const activeCodeTheme = computed(() => (isDark.value ? codeThemeDark.value : codeThemeLight.value))
  const codeThemes = computed(() => ({
    light: codeThemeLight.value,
    dark: codeThemeDark.value
  }))

  function setTheme(value: ThemePreference): void {
    theme.value = value
    colorMode.value = value
  }

  function setCodeThemes(value: { light?: CodeThemePreference; dark?: CodeThemePreference }): void {
    if (value.light) {
      codeThemeLight.value = value.light
    }

    if (value.dark) {
      codeThemeDark.value = value.dark
    }
  }

  function setLocale(value: SupportedLocale): void {
    locale.value = value
    i18n.global.locale.value = value
  }

  watch(
    locale,
    (value) => {
      i18n.global.locale.value = value
    },
    { immediate: true }
  )

  return {
    activeCodeTheme,
    codeThemeDark,
    codeThemeLight,
    codeThemes,
    colorMode,
    isDark,
    locale,
    setCodeThemes,
    setLocale,
    setTheme,
    theme
  }
})
