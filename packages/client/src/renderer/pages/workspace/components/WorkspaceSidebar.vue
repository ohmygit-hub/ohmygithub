<script setup lang="ts">
import type { WorkspaceNavGroup } from '../types'
import { useI18n } from 'vue-i18n'
import { Search, Settings2 } from 'lucide-vue-next'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@oh-my-github/ui'

defineProps<{
  groups: WorkspaceNavGroup[]
  activeItemId: string
  isFullscreen: boolean
}>()

const emit = defineEmits<{
  select: [url: string]
}>()

const { t } = useI18n()
</script>

<template>
  <Sidebar
    data-workspace-sidebar
    collapsible="offcanvas"
    width="12rem"
    class="border-r border-border"
  >
    <SidebarHeader
      :class="isFullscreen
        ? 'gap-0 border-b border-border px-2 pb-1 pt-0'
        : 'gap-2 border-b border-border px-2 pb-2 pt-0'"
    >
      <div
        aria-hidden="true"
        class="workspace-titlebar-spacer"
        :data-fullscreen="isFullscreen ? 'true' : undefined"
      />
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="sm"
            :tooltip="t('workspace.sidebar.search')"
            type="button"
          >
            <Search />
            <span>{{ t('workspace.sidebar.search') }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup
        v-for="group in groups"
        :key="group.id"
        class="px-2 py-1"
      >
        <SidebarGroupLabel class="h-6 px-2 text-caption">
          {{ t(group.labelKey) }}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem
              v-for="item in group.items"
              :key="item.id"
            >
              <SidebarMenuButton
                size="sm"
                :is-active="activeItemId === item.id"
                :tooltip="t(item.labelKey)"
                type="button"
                @click="emit('select', item.url)"
              >
                <component :is="item.icon" />
                <span>{{ t(item.labelKey) }}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="border-t border-border p-1.5">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="sm"
            :tooltip="t('workspace.sidebar.settings')"
            type="button"
          >
            <Settings2 />
            <span>{{ t('workspace.sidebar.settings') }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>

<style scoped>
.workspace-titlebar-spacer {
  height: 2.25rem;
  -webkit-app-region: drag;
}

.workspace-titlebar-spacer[data-fullscreen="true"] {
  height: 0.25rem;
}

:deep([data-workspace-sidebar] [data-sidebar="menu-button"][data-active="true"]::before) {
  display: none !important;
}

:deep([data-workspace-sidebar] [data-sidebar="menu-button"]:focus-visible) {
  box-shadow: none !important;
}
</style>
