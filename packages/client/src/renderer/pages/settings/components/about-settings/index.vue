<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Download, MessageSquare, RefreshCw, RotateCcw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { Button, Spinner } from '@oh-my-github/ui'
import GitHubIcon from '@/components/icons/github-icon.vue'
import TelegramIcon from '@/components/icons/telegram-icon.vue'
import { getShortcutPlatform } from '@/keyboard/shortcut-accelerator'
import liquidLogo from '../../../../../../../../assets/liquid-glass-icon.png'
import shadowLogo from '../../../../../../../../assets/shadow-icon.png'
import { resolveUpdateButtonState } from './update-button-state'

const AUTHOR_PROFILE_URL = 'https://github.com/sheepbox8646'
const TELEGRAM_URL = 'https://t.me/ohmygithub'
// In-app workspace pages for the project repo. Navigating away from /settings
// also dismisses the settings dialog, so no explicit close is needed.
const REPO_WORKSPACE_URL = '/ohmygit-hub/ohmygithub'
const FEEDBACK_WORKSPACE_URL = '/ohmygit-hub/ohmygithub?tab=issues'

const { t } = useI18n()
const router = useRouter()

// macOS ships the liquid-glass mark; every other platform uses the shadow mark.
// Resolved synchronously so the correct logo paints on first render.
const logo = getShortcutPlatform().isMac ? liquidLogo : shadowLogo
const year = new Date().getFullYear()

const version = ref('')
const updateState = ref<UpdateState>({
  status: 'idle',
  currentVersion: '',
  latestVersion: null,
  progress: null,
  error: null,
})
let stopUpdateStatusListener: (() => void) | undefined

const updateButtonState = computed(() => resolveUpdateButtonState(updateState.value))
const updateButtonLabel = computed(() =>
  t(updateButtonState.value.labelKey, updateButtonState.value.labelParams ?? {}),
)
const updateButtonIcon = computed(() => {
  switch (updateButtonState.value.icon) {
    case 'download':
      return Download
    case 'restart':
      return RotateCcw
    case 'refresh':
      return RefreshCw
  }
})

onMounted(async () => {
  stopUpdateStatusListener = window.ohMyGithub.updates.onStatusChange((state) => {
    updateState.value = state
  })

  const [info, state] = await Promise.all([
    window.ohMyGithub.updates.getInfo(),
    window.ohMyGithub.updates.getState(),
  ])
  version.value = info.version
  updateState.value = state
})

onUnmounted(() => {
  stopUpdateStatusListener?.()
})

async function handleUpdateButtonClick(): Promise<void> {
  switch (updateButtonState.value.action) {
    case 'check':
      updateState.value = await window.ohMyGithub.updates.checkForUpdate()
      break
    case 'download':
      updateState.value = await window.ohMyGithub.updates.downloadUpdate()
      break
    case 'install':
      updateState.value = await window.ohMyGithub.updates.installUpdate()
      break
    case 'none':
      break
  }
}

async function safeHandleUpdateButtonClick(): Promise<void> {
  try {
    await handleUpdateButtonClick()
  } catch (error) {
    console.error('Failed to update app', error)
  }
}

function openAuthorProfile(): void {
  void window.ohMyGithub.links.openGitHubUrl(AUTHOR_PROFILE_URL)
}

function openGitHub(): void {
  void router.push(REPO_WORKSPACE_URL)
}

function openTelegram(): void {
  void window.ohMyGithub.links.openExternalUrl(TELEGRAM_URL)
}

function openFeedback(): void {
  void router.push(FEEDBACK_WORKSPACE_URL)
}
</script>

<template>
  <div class="flex min-h-full flex-col">
    <div class="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <img
        :src="logo"
        alt=""
        class="size-24 select-none"
        draggable="false"
      >

      <div class="flex flex-col items-center gap-1.5">
        <h2 class="select-none text-heading font-semibold text-foreground">
          Oh My GitHub
        </h2>
        <p class="select-none text-caption text-muted-foreground">
          {{ t('settings.about.currentVersion', { version }) }}
          <template v-if="updateState.latestVersion && updateState.status !== 'up-to-date'">
            · {{ t('settings.about.latestVersion', { version: updateState.latestVersion }) }}
          </template>
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <Button
          :variant="updateButtonState.variant"
          :disabled="updateButtonState.disabled"
          :loading="updateButtonState.loading"
          loading-mode="manual"
          @click="safeHandleUpdateButtonClick"
        >
          <Spinner
            v-if="updateButtonState.loading"
            class="size-4"
          />
          <component
            :is="updateButtonIcon"
            v-else
            class="size-4"
          />
          {{ updateButtonLabel }}
        </Button>

        <Button
          variant="outline"
          @click="openFeedback"
        >
          <MessageSquare class="size-4" />
          {{ t('settings.about.feedback') }}
        </Button>

        <Button
          variant="outline"
          @click="openGitHub"
        >
          <GitHubIcon class="size-4" />
          {{ t('settings.about.github') }}
        </Button>

        <Button
          as="a"
          href="#"
          variant="outline"
          @click.prevent="openTelegram"
        >
          <TelegramIcon class="size-4" />
          {{ t('settings.about.telegram') }}
        </Button>
      </div>
    </div>

    <footer class="flex select-none flex-col items-center gap-1 pt-6 text-caption text-muted-foreground">
      <p>{{ t('settings.about.copyright', { year }) }}</p>
      <i18n-t
        keypath="settings.about.madeBy"
        tag="p"
      >
        <template #author>
          <a
            class="cursor-pointer text-foreground underline-offset-4 hover:underline"
            @click="openAuthorProfile"
          >Acbox</a>
        </template>
      </i18n-t>
    </footer>
  </div>
</template>
