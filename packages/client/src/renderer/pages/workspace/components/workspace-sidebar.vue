<script setup lang="ts">
import type { WorkspaceSidebarTreeItem } from '../types'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { Inbox, Search } from 'lucide-vue-next'
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
  SidebarMenuSkeleton,
} from '@oh-my-github/ui'
import WorkspaceSidebarTree from './workspace-sidebar-tree.vue'
import WorkspaceUserPanel from './workspace-user-panel.vue'

const props = defineProps<{
  activeUrl: string
  isFullscreen: boolean
  organizations: GitHubOrganization[]
  organizationsError: boolean
  organizationsLoading: boolean
  viewer: AuthViewer | null
}>()

const emit = defineEmits<{
  select: [url: string]
}>()

const { t } = useI18n()
const expandedIds = reactive(new Set<string>())
const visibleCounts = reactive(new Map<string, number>())
const hasOrganizations = computed(() => props.organizations.length > 0)
const showOrganizationsLoading = computed(() => props.organizationsLoading && !hasOrganizations.value)
const showOrganizationsError = computed(() => props.organizationsError && !hasOrganizations.value)
const showOrganizationsEmpty = computed(() =>
  !props.organizationsLoading && !props.organizationsError && !hasOrganizations.value,
)

const organizationItems = computed<WorkspaceSidebarTreeItem[]>(() => {
  return props.organizations.map((organization) => {
    const url = organizationUrl(organization.login)

    return {
      id: `org:${organization.login}`,
      label: organization.login,
      url,
      avatarUrl: organization.avatarUrl,
      avatarFallback: organizationFallback(organization.login),
      isActive: props.activeUrl === url,
      canExpand: true,
      forceExpanded: props.activeUrl.startsWith(`/${organization.login}/`),
      childrenLoader: {
        type: 'organization-repositories',
        owner: organization.login,
      },
    }
  })
})

function organizationUrl(login: string): string {
  return `/${login}?type=org`
}

function organizationFallback(login: string): string {
  return login.slice(0, 1).toUpperCase()
}

function toggleExpanded(id: string): void {
  if (expandedIds.has(id)) {
    expandedIds.delete(id)
    return
  }

  expandedIds.add(id)
}

function setVisibleCount(listId: string, visibleCount: number): void {
  visibleCounts.set(listId, visibleCount)
}
</script>

<template>
  <Sidebar
    data-workspace-sidebar
    collapsible="offcanvas"
    width="24rem"
    class="border-r border-border"
  >
    <SidebarHeader
      :class="isFullscreen
        ? 'gap-0 px-2 pb-1 pt-0'
        : 'gap-2 px-2 pb-2 pt-0'"
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
        <SidebarMenuItem>
          <SidebarMenuButton
            size="sm"
            :is-active="activeUrl === '/inbox'"
            :tooltip="t('workspace.sidebar.items.inbox')"
            type="button"
            @click="emit('select', '/inbox')"
          >
            <Inbox />
            <span>{{ t('workspace.sidebar.items.inbox') }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup class="px-2 py-1">
        <SidebarGroupLabel class="h-6 px-2 text-caption">
          {{ t('workspace.sidebar.groups.organizations') }}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu v-if="showOrganizationsLoading">
            <SidebarMenuItem
              v-for="index in 3"
              :key="index"
            >
              <SidebarMenuSkeleton show-icon />
            </SidebarMenuItem>
          </SidebarMenu>

          <p
            v-else-if="showOrganizationsError"
            class="px-2 py-1.5 text-caption text-muted-foreground"
          >
            {{ t('workspace.sidebar.organizations.error') }}
          </p>

          <p
            v-else-if="showOrganizationsEmpty"
            class="px-2 py-1.5 text-caption text-muted-foreground"
          >
            {{ t('workspace.sidebar.organizations.empty') }}
          </p>

          <WorkspaceSidebarTree
            v-else
            :active-url="activeUrl"
            :expanded-ids="expandedIds"
            :items="organizationItems"
            list-id="organizations"
            :visible-counts="visibleCounts"
            @select="emit('select', $event)"
            @show-more="setVisibleCount"
            @toggle="toggleExpanded"
          />
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter
      v-if="viewer"
      class="border-t border-border"
    >
      <WorkspaceUserPanel :viewer="viewer" />
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
