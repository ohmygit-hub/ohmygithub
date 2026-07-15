<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Lock, Plus, Trash2 } from 'lucide-vue-next'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@oh-my-github/ui'
import LocalSearchSelect from '@/components/github/local-search-select.vue'
import type { LocalSearchSelectItem } from '@/components/github/local-search-select-types'
import { useOrganizationRepositoriesQuery } from '@/composables/github/use-organizations'
import { addOrUpdateTeamRepository, removeTeamRepository } from '@/composables/github/use-organization-teams'
import { useToast } from '@/composables/use-toast'

const TEAM_PERMISSIONS = ['pull', 'triage', 'push', 'maintain', 'admin'] as const

const props = defineProps<{
  canAdminister: boolean
  org: string
  repositories: GitHubTeamRepository[]
  repositoriesTruncated: boolean
  teamSlug: string
}>()

const emit = defineEmits<{
  refresh: []
  selectRepository: [owner: string, repo: string]
}>()

const { t } = useI18n()
const toast = useToast()

const pendingKeys = ref(new Set<string>())
const removingRepository = ref<GitHubTeamRepository | null>(null)
const isRemoving = ref(false)
const isAddOpen = ref(false)
const addSearch = ref('')
const addRepoName = ref<string | null>(null)
const addPermission = ref<string>('pull')
const isAdding = ref(false)

const orgRepositoriesQuery = useOrganizationRepositoriesQuery(() => props.org, () => props.canAdminister)
const grantedNames = computed(() => new Set(props.repositories.map((repository) => repository.name.toLowerCase())))
const candidateItems = computed<LocalSearchSelectItem[]>(() =>
  (orgRepositoriesQuery.data.value ?? [])
    .filter((repository) => !grantedNames.value.has(repository.name.toLowerCase()))
    .map((repository) => ({
      id: repository.name,
      label: repository.name,
      sublabel: repository.description ?? undefined,
    }))
)
const selectedCandidate = computed(() =>
  addRepoName.value
    ? candidateItems.value.find((item) => item.id === addRepoName.value) ?? null
    : null
)
const canSubmitAdd = computed(() => Boolean(resolveAddRepoName()) && !isAdding.value)

watch(isAddOpen, (open) => {
  if (!open) return

  addSearch.value = ''
  addRepoName.value = null
  addPermission.value = 'pull'
})

watch(addSearch, (value) => {
  if (selectedCandidate.value && value !== selectedCandidate.value.label) {
    addRepoName.value = null
  }
})

function selectCandidate(item: LocalSearchSelectItem): void {
  addRepoName.value = item.id
}

function resolveAddRepoName(): string {
  return addRepoName.value ?? addSearch.value.trim()
}

function isPending(key: string): boolean {
  return pendingKeys.value.has(key)
}

async function run(key: string, action: () => Promise<void>): Promise<void> {
  if (pendingKeys.value.has(key)) return
  pendingKeys.value = new Set([...pendingKeys.value, key])

  try {
    await action()
    emit('refresh')
  } catch (error) {
    toast.error(t('teams.toasts.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    const next = new Set(pendingKeys.value)
    next.delete(key)
    pendingKeys.value = next
  }
}

async function submitAdd(): Promise<void> {
  const repo = resolveAddRepoName()
  if (!repo || isAdding.value) return

  isAdding.value = true

  try {
    await addOrUpdateTeamRepository({
      org: props.org,
      teamSlug: props.teamSlug,
      owner: props.org,
      repo,
      permission: addPermission.value,
    })
    toast.success(t('teams.repositories.toasts.added', { repo }))
    isAddOpen.value = false
    emit('refresh')
  } catch (error) {
    toast.error(t('teams.toasts.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    isAdding.value = false
  }
}

function changePermission(repository: GitHubTeamRepository, value: unknown): void {
  if (typeof value !== 'string' || value === repository.permission) return

  void run(`permission:${repository.nameWithOwner}`, () =>
    addOrUpdateTeamRepository({
      org: props.org,
      teamSlug: props.teamSlug,
      owner: repository.owner,
      repo: repository.name,
      permission: value,
    }))
}

async function confirmRemove(): Promise<void> {
  const repository = removingRepository.value
  if (!repository || isRemoving.value) return

  isRemoving.value = true

  try {
    await removeTeamRepository({
      org: props.org,
      teamSlug: props.teamSlug,
      owner: repository.owner,
      repo: repository.name,
    })
    toast.success(t('teams.repositories.toasts.removed', { repo: repository.name }))
    removingRepository.value = null
    emit('refresh')
  } catch (error) {
    toast.error(t('teams.toasts.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    isRemoving.value = false
  }
}

function permissionLabel(permission: string): string {
  return TEAM_PERMISSIONS.includes(permission as typeof TEAM_PERMISSIONS[number])
    ? t(`repository.settings.access.roles.${permission}`)
    : permission
}

function resolveErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined

  const message = error.message
    .replace(/^Error invoking remote method '[^']+':\s*/, '')
    .replace(/^Error:\s*/, '')
    .trim()

  return message || undefined
}
</script>

<template>
  <section class="grid gap-3">
    <div class="flex min-w-0 flex-wrap items-center justify-between gap-2">
      <p class="select-none text-label font-medium text-foreground">
        {{ t('teams.repositories.title', { count: repositories.length }) }}
      </p>

      <Button
        v-if="canAdminister"
        size="sm"
        type="button"
        @click="isAddOpen = true"
      >
        <Plus class="size-3.5" />
        {{ t('teams.repositories.actions.add') }}
      </Button>
    </div>

    <Empty
      v-if="repositories.length === 0"
      class="min-h-[18rem] border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyTitle>
          {{ t('teams.repositories.empty.title') }}
        </EmptyTitle>
        <EmptyDescription>
          {{ t('teams.repositories.empty.description') }}
        </EmptyDescription>
        <Button
          v-if="canAdminister"
          class="justify-self-center"
          size="sm"
          type="button"
          variant="outline"
          @click="isAddOpen = true"
        >
          <Plus class="size-3.5" />
          {{ t('teams.repositories.actions.add') }}
        </Button>
      </EmptyHeader>
    </Empty>

    <template v-else>
      <p
        v-if="repositoriesTruncated"
        class="text-body text-muted-foreground"
      >
        {{ t('teams.repositories.truncated') }}
      </p>

      <ul class="grid gap-2">
        <li
          v-for="repository in repositories"
          :key="repository.nameWithOwner"
        >
          <div class="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3">
            <div class="grid min-w-0 flex-1 gap-0.5">
              <div class="flex min-w-0 items-center gap-2">
                <button
                  class="truncate text-label font-medium text-foreground underline-offset-4 hover:underline"
                  type="button"
                  @click="emit('selectRepository', repository.owner, repository.name)"
                >
                  {{ repository.nameWithOwner }}
                </button>
                <Badge
                  v-if="repository.isPrivate"
                  variant="outline"
                >
                  <Lock class="size-3" />
                  {{ t('teams.repositories.private') }}
                </Badge>
              </div>
              <p
                v-if="repository.description"
                class="truncate text-body text-muted-foreground"
              >
                {{ repository.description }}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-1.5">
              <template v-if="canAdminister">
                <Select
                  :disabled="isPending(`permission:${repository.nameWithOwner}`)"
                  :model-value="repository.permission"
                  @update:model-value="changePermission(repository, $event)"
                >
                  <SelectTrigger
                    :aria-label="t('teams.repositories.permissionSelectLabel', { repo: repository.name })"
                    class="min-w-28"
                    size="sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem
                      v-if="!TEAM_PERMISSIONS.includes(repository.permission as typeof TEAM_PERMISSIONS[number])"
                      :value="repository.permission"
                    >
                      {{ repository.permission }}
                    </SelectItem>
                    <SelectItem
                      v-for="permission in TEAM_PERMISSIONS"
                      :key="permission"
                      :value="permission"
                    >
                      {{ t(`repository.settings.access.roles.${permission}`) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  :aria-label="t('teams.repositories.actions.remove', { repo: repository.name })"
                  :disabled="isRemoving"
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                  @click="removingRepository = repository"
                >
                  <Trash2 class="size-3.5 text-destructive" />
                </Button>
              </template>
              <Badge
                v-else
                variant="secondary"
              >
                {{ permissionLabel(repository.permission) }}
              </Badge>
            </div>
          </div>
        </li>
      </ul>
    </template>

    <Dialog
      :open="removingRepository !== null"
      @update:open="(open) => { if (!open && !isRemoving) removingRepository = null }"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ t('teams.repositories.remove.title', { repo: removingRepository?.name ?? '' }) }}
          </DialogTitle>
          <DialogDescription>
            {{ t('teams.repositories.remove.description', {
              repo: removingRepository?.nameWithOwner ?? '',
              team: teamSlug,
            }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            :disabled="isRemoving"
            size="sm"
            type="button"
            variant="outline"
            @click="removingRepository = null"
          >
            {{ t('teams.repositories.remove.cancel') }}
          </Button>
          <Button
            :disabled="isRemoving"
            size="sm"
            type="button"
            variant="destructive"
            @click="confirmRemove"
          >
            <Spinner
              v-if="isRemoving"
              class="size-3.5"
            />
            {{ t('teams.repositories.remove.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog
      :open="isAddOpen"
      @update:open="(open) => { if (!isAdding) isAddOpen = open }"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('teams.repositories.add.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('teams.repositories.add.description', { team: teamSlug }) }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <Label for="team-add-repository">{{ t('teams.repositories.add.repoLabel') }}</Label>
            <LocalSearchSelect
              v-model="addSearch"
              :empty-label="t('teams.repositories.add.empty')"
              input-id="team-add-repository"
              :items="candidateItems"
              :placeholder="t('teams.repositories.add.placeholder')"
              @select="selectCandidate"
            />
          </div>
          <div class="grid gap-1.5">
            <Label for="team-add-repository-permission">{{ t('teams.repositories.add.permissionLabel') }}</Label>
            <Select v-model="addPermission">
              <SelectTrigger
                id="team-add-repository-permission"
                class="w-full"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="permission in TEAM_PERMISSIONS"
                  :key="permission"
                  :value="permission"
                >
                  {{ t(`repository.settings.access.roles.${permission}`) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            :disabled="isAdding"
            size="sm"
            type="button"
            variant="outline"
            @click="isAddOpen = false"
          >
            {{ t('teams.repositories.add.cancel') }}
          </Button>
          <Button
            :disabled="!canSubmitAdd"
            size="sm"
            type="button"
            @click="submitAdd"
          >
            <Spinner
              v-if="isAdding"
              class="size-3.5"
            />
            {{ t('teams.repositories.add.submit') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
