<script setup lang="ts">
import type { ToastVariant } from '@oh-my-github/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Toaster } from '@oh-my-github/ui'
import { useGlobalKeyboardShortcuts } from './keyboard/global-shortcuts'
import { useKeyboardShortcutListener } from './keyboard/shortcut-runtime'
import { useFocusRingModality } from './composables/use-focus-ring-modality'
import { useAuthStore } from './stores/auth'
import { useSettingsStore } from './stores/settings'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const { t } = useI18n()
const toastHeadings = computed<Partial<Record<ToastVariant, string>>>(() => ({
  error: t('toast.headings.error'),
  info: t('toast.headings.info'),
  message: t('toast.headings.message'),
  success: t('toast.headings.success'),
  warning: t('toast.headings.warning'),
}))

void authStore.refresh()
void settingsStore.initialize()
useFocusRingModality()
useKeyboardShortcutListener()
useGlobalKeyboardShortcuts()
</script>

<template>
  <RouterView v-if="!authStore.isSwitching" />
  <Toaster
    :headings="toastHeadings"
    :label="t('toast.label')"
  />
</template>
