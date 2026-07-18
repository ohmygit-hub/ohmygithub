<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Lock, Plus } from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@oh-my-github/ui'
import TeamCreateDialog from '@/components/github/team-create-dialog.vue'
import { useOrganizationTeamsQuery } from '@/composables/github/use-organization-teams'

const props = defineProps<{
  canAdminister: boolean
  childTeams: GitHubTeam[]
  org: string
  teamSlug: string
}>()

const emit = defineEmits<{
  selectTeam: [teamSlug: string]
}>()

const { t } = useI18n()

const isCreateOpen = ref(false)

// The full org team list backs the create dialog's parent picker; it shares
// the cached organization-teams query with the org profile section.
const teamsQuery = useOrganizationTeamsQuery(() => props.org, () => props.canAdminister)
const allTeams = computed(() => teamsQuery.data.value?.teams ?? [])

function fallbackInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

function onTeamCreated(created: GitHubCreatedTeam): void {
  if (created.slug) {
    emit('selectTeam', created.slug)
  }
}
</script>

<template>
  <section class="grid gap-3">
    <div class="flex min-w-0 flex-wrap items-center justify-between gap-2">
      <p class="select-none text-label font-medium text-foreground">
        {{ t('teams.childTeams.title', { count: childTeams.length }) }}
      </p>

      <Button
        v-if="canAdminister"
        size="sm"
        type="button"
        @click="isCreateOpen = true"
      >
        <Plus class="size-3.5" />
        {{ t('teams.childTeams.actions.create') }}
      </Button>
    </div>

    <Empty
      v-if="childTeams.length === 0"
      class="min-h-[18rem] border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyTitle>
          {{ t('teams.childTeams.empty.title') }}
        </EmptyTitle>
        <EmptyDescription>
          {{ t('teams.childTeams.empty.description') }}
        </EmptyDescription>
        <Button
          v-if="canAdminister"
          class="justify-self-center"
          size="sm"
          type="button"
          variant="outline"
          @click="isCreateOpen = true"
        >
          <Plus class="size-3.5" />
          {{ t('teams.childTeams.actions.create') }}
        </Button>
      </EmptyHeader>
    </Empty>

    <ul
      v-else
      class="grid gap-2"
    >
      <li
        v-for="childTeam in childTeams"
        :key="childTeam.slug"
      >
        <div
          class="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3 outline-hidden transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/30"
          role="button"
          tabindex="0"
          @click="emit('selectTeam', childTeam.slug)"
          @keydown.enter.prevent="emit('selectTeam', childTeam.slug)"
          @keydown.space.prevent="emit('selectTeam', childTeam.slug)"
        >
          <Avatar class="size-10 shrink-0">
            <AvatarImage
              :alt="childTeam.name"
              :src="childTeam.avatarUrl ?? ''"
            />
            <AvatarFallback class="text-label">
              {{ fallbackInitials(childTeam.name) }}
            </AvatarFallback>
          </Avatar>

          <div class="grid min-w-0 flex-1 gap-0.5">
            <div class="flex min-w-0 items-center gap-2">
              <span class="truncate text-label font-medium text-foreground">
                {{ childTeam.name }}
              </span>
              <span class="truncate text-body text-muted-foreground">
                {{ childTeam.slug }}
              </span>
              <Badge
                v-if="childTeam.privacy === 'secret'"
                variant="outline"
              >
                <Lock class="size-3" />
                {{ t('teams.privacy.secret') }}
              </Badge>
            </div>
            <p
              v-if="childTeam.description"
              class="truncate text-body text-muted-foreground"
            >
              {{ childTeam.description }}
            </p>
          </div>

          <span class="shrink-0 select-none text-body text-muted-foreground">
            {{ t('account.teams.meta', {
              members: childTeam.membersCount,
              repos: childTeam.reposCount,
            }) }}
          </span>
        </div>
      </li>
    </ul>

    <TeamCreateDialog
      v-model:open="isCreateOpen"
      :default-parent-slug="teamSlug"
      :org="org"
      :teams="allTeams"
      @created="onTeamCreated"
    />
  </section>
</template>
