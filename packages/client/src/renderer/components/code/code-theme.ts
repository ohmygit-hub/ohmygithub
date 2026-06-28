import { computed } from "vue";
import { useSettingsStore } from "../../stores/settings";

export interface CodeThemePair {
  light: string;
  dark: string;
}

export function useCodeTheme() {
  const settings = useSettingsStore();

  const themes = computed<CodeThemePair>(() => ({
    light: settings.codeThemeLight,
    dark: settings.codeThemeDark,
  }));

  const activeTheme = computed(() => settings.activeCodeTheme);

  return {
    activeTheme,
    isDark: settings.isDark,
    themes,
  };
}
