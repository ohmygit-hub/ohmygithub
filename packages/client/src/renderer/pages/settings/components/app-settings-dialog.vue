<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { ExternalLink } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@oh-my-github/ui'
import {
  SETTINGS_NAV_GROUPS,
  type SettingsNavItem,
  type SettingsTabId,
} from '@/pages/settings/settings-tabs'
import AboutSettings from './about-settings/index.vue'
import AppearanceSettings from './appearance-settings/index.vue'
import BlockedUsersSettings from './github/blocked-users-settings.vue'
import CodespacesSettings from './github/codespaces-settings.vue'
import EmailsSettings from './github/emails-settings.vue'
import InteractionLimitsSettings from './github/interaction-limits-settings.vue'
import KeysSettings from './github/keys-settings.vue'
import OrganizationsSettings from './github/organizations-settings.vue'
import ProfileSettings from './github/profile-settings.vue'
import SavedRepliesSettings from './github/saved-replies-settings.vue'
import KeyboardSettingsPage from './keyboard/keyboard-settings-page.vue'
import NetworkSettings from './network/network-settings.vue'

const props = defineProps<{
  activeTab: SettingsTabId
}>()

const emit = defineEmits<{
  close: []
  selectTab: [tab: SettingsTabId]
}>()

const { t } = useI18n()
const tabComponents: Record<SettingsTabId, Component> = {
  'appearance': AppearanceSettings,
  'keyboard': KeyboardSettingsPage,
  'network': NetworkSettings,
  'about': AboutSettings,
  'github-profile': ProfileSettings,
  'github-emails': EmailsSettings,
  'github-keys': KeysSettings,
  'github-organizations': OrganizationsSettings,
  'github-blocked-users': BlockedUsersSettings,
  'github-interaction-limits': InteractionLimitsSettings,
  'github-codespaces': CodespacesSettings,
  'github-saved-replies': SavedRepliesSettings,
}
const activeTabTitle = computed(() => t(`settings.tabs.${props.activeTab}`))

function handleOpenChange(isOpen: boolean): void {
  if (!isOpen) {
    emit('close')
  }
}

function handleItemClick(item: SettingsNavItem): void {
  if (item.kind === 'link') {
    void window.ohMyGithub?.links?.openExternalUrl(item.url)
    return
  }

  emit('selectTab', item.id)
}
</script>

<template>
  <Dialog
    :open="true"
    @update:open="handleOpenChange"
  >
    <DialogContent
      class="grid-cols-[13rem_minmax(0,1fr)] !h-[calc(100vh-2rem)] !max-h-[680px] !w-[calc(100vw-2rem)] !gap-0 !overflow-hidden !p-0 sm:!max-w-[880px]"
    >
      <DialogTitle class="sr-only">
        {{ t('settings.title') }}
      </DialogTitle>
      <DialogDescription class="sr-only">
        {{ t('settings.description') }}
      </DialogDescription>

      <aside class="flex min-h-0 flex-col border-r border-border bg-muted/30 p-4">
        <nav
          :aria-label="t('settings.navigation')"
          class="min-h-0 flex-1 space-y-4 overflow-auto"
        >
          <div
            v-for="group in SETTINGS_NAV_GROUPS"
            :key="group.id"
            class="space-y-1"
          >
            <p
              v-if="group.labelKey"
              class="select-none px-2 pb-1 text-caption font-medium text-muted-foreground"
            >
              {{ t(group.labelKey) }}
            </p>
            <button
              v-for="item in group.items"
              :key="item.id"
              class="flex h-9 w-full select-none items-center gap-2 rounded-md px-2 text-left text-control outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
              :class="item.kind === 'tab' && activeTab === item.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'"
              type="button"
              @click="handleItemClick(item)"
            >
              <component
                :is="item.icon"
                class="size-4 shrink-0"
              />
              <span class="min-w-0 flex-1 truncate">
                {{ t(item.labelKey) }}
              </span>
              <ExternalLink
                v-if="item.kind === 'link'"
                class="size-3.5 shrink-0 opacity-60"
              />
            </button>
          </div>
        </nav>
      </aside>

      <section class="min-h-0 overflow-auto p-6 pr-12">
        <header
          v-if="activeTab !== 'about'"
          class="mb-6"
        >
          <h2 class="select-none truncate text-heading font-semibold text-foreground">
            {{ activeTabTitle }}
          </h2>
        </header>

        <component :is="tabComponents[activeTab]" />
      </section>
    </DialogContent>
  </Dialog>
</template>
