<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Trash2, UserPlus } from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
import { useOrganizationPeopleQuery } from '@/composables/github/use-organization-people'
import { removeTeamMember, setTeamMembership } from '@/composables/github/use-organization-teams'
import { useToast } from '@/composables/use-toast'

const props = defineProps<{
  canAdminister: boolean
  members: GitHubTeamMember[]
  membersTruncated: boolean
  org: string
  teamSlug: string
  viewerLogin: string | null
}>()

const emit = defineEmits<{
  refresh: []
  selectAccount: [login: string]
}>()

const { t } = useI18n()
const toast = useToast()

const busyLogin = ref<string | null>(null)
const removingMember = ref<GitHubTeamMember | null>(null)
const isRemoving = ref(false)
const isAddOpen = ref(false)
const addSearch = ref('')
const addLogin = ref<string | null>(null)
const addRole = ref<GitHubTeamMemberRole>('member')
const isAdding = ref(false)

// The picker suggests organization members; the shared people query keeps
// this warm across the org page and every team tab.
const peopleQuery = useOrganizationPeopleQuery(() => props.org, () => props.canAdminister)
const memberLogins = computed(() => new Set(props.members.map((member) => member.login.toLowerCase())))
const candidateItems = computed<LocalSearchSelectItem[]>(() =>
  (peopleQuery.data.value?.members ?? [])
    .filter((member) => !memberLogins.value.has(member.login.toLowerCase()))
    .map((member) => ({
      id: member.login,
      label: member.login,
      sublabel: member.name ?? undefined,
      avatarUrl: member.avatarUrl,
    }))
)
const selectedCandidate = computed(() =>
  addLogin.value
    ? candidateItems.value.find((item) => item.id === addLogin.value) ?? null
    : null
)
const canSubmitAdd = computed(() => Boolean(resolveAddLogin()) && !isAdding.value)

watch(isAddOpen, (open) => {
  if (!open) return

  addSearch.value = ''
  addLogin.value = null
  addRole.value = 'member'
})

watch(addSearch, (value) => {
  if (selectedCandidate.value && value !== selectedCandidate.value.label) {
    addLogin.value = null
  }
})

function selectCandidate(item: LocalSearchSelectItem): void {
  addLogin.value = item.id
}

// Falls back to the typed login so members hidden by the people-list cap can
// still be added directly.
function resolveAddLogin(): string {
  return addLogin.value ?? addSearch.value.trim()
}

function isViewerRow(member: GitHubTeamMember): boolean {
  return Boolean(props.viewerLogin && member.login.toLowerCase() === props.viewerLogin.toLowerCase())
}

function fallbackInitials(login: string): string {
  return login.slice(0, 2).toUpperCase()
}

async function submitAdd(): Promise<void> {
  const login = resolveAddLogin()
  if (!login || isAdding.value) return

  isAdding.value = true

  try {
    await setTeamMembership({ org: props.org, teamSlug: props.teamSlug, login, role: addRole.value })
    toast.success(t('teams.members.toasts.added', { login }))
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

async function changeRole(member: GitHubTeamMember, role: string): Promise<void> {
  const nextRole = role === 'maintainer' ? 'maintainer' : 'member'
  if (nextRole === member.role || busyLogin.value) return

  busyLogin.value = member.login

  try {
    await setTeamMembership({
      org: props.org,
      teamSlug: props.teamSlug,
      login: member.login,
      role: nextRole,
    })
    toast.success(t('teams.members.toasts.roleUpdated', { login: member.login }))
    emit('refresh')
  } catch (error) {
    toast.error(t('teams.toasts.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    busyLogin.value = null
  }
}

async function confirmRemove(): Promise<void> {
  const member = removingMember.value
  if (!member || isRemoving.value) return

  isRemoving.value = true

  try {
    await removeTeamMember({ org: props.org, teamSlug: props.teamSlug, login: member.login })
    toast.success(t('teams.members.toasts.removed', { login: member.login }))
    removingMember.value = null
    emit('refresh')
  } catch (error) {
    toast.error(t('teams.toasts.errorTitle'), {
      description: resolveErrorMessage(error),
    })
  } finally {
    isRemoving.value = false
  }
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
        {{ t('teams.members.title', { count: members.length }) }}
      </p>

      <Button
        v-if="canAdminister"
        size="sm"
        type="button"
        @click="isAddOpen = true"
      >
        <UserPlus class="size-3.5" />
        {{ t('teams.members.actions.add') }}
      </Button>
    </div>

    <Empty
      v-if="members.length === 0"
      class="min-h-[18rem] border border-border bg-card"
    >
      <EmptyHeader>
        <EmptyTitle>
          {{ t('teams.members.empty.title') }}
        </EmptyTitle>
        <EmptyDescription>
          {{ t('teams.members.empty.description') }}
        </EmptyDescription>
        <Button
          v-if="canAdminister"
          class="justify-self-center"
          size="sm"
          type="button"
          variant="outline"
          @click="isAddOpen = true"
        >
          <UserPlus class="size-3.5" />
          {{ t('teams.members.actions.add') }}
        </Button>
      </EmptyHeader>
    </Empty>

    <template v-else>
      <p
        v-if="membersTruncated"
        class="text-body text-muted-foreground"
      >
        {{ t('teams.members.truncated') }}
      </p>

      <ul class="grid gap-2">
        <li
          v-for="member in members"
          :key="member.login"
        >
          <div class="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3">
            <Avatar
              class="size-10 shrink-0 cursor-pointer"
              @click="emit('selectAccount', member.login)"
            >
              <AvatarImage
                :alt="member.login"
                :src="member.avatarUrl"
              />
              <AvatarFallback class="text-label">
                {{ fallbackInitials(member.login) }}
              </AvatarFallback>
            </Avatar>

            <div class="grid min-w-0 flex-1 gap-0.5">
              <div class="flex min-w-0 items-center gap-2">
                <button
                  class="truncate text-label font-medium text-foreground underline-offset-4 hover:underline"
                  type="button"
                  @click="emit('selectAccount', member.login)"
                >
                  {{ member.name || member.login }}
                </button>
                <span class="truncate text-body text-muted-foreground">
                  {{ member.login }}
                </span>
              </div>
              <div class="flex min-w-0 items-center gap-1.5">
                <Badge :variant="member.role === 'maintainer' ? 'info' : 'secondary'">
                  {{ t(member.role === 'maintainer' ? 'teams.role.maintainer' : 'teams.role.member') }}
                </Badge>
                <Badge
                  v-if="isViewerRow(member)"
                  variant="outline"
                >
                  {{ t('teams.members.you') }}
                </Badge>
              </div>
            </div>

            <div
              v-if="canAdminister"
              class="flex shrink-0 items-center gap-1.5"
            >
              <Select
                :disabled="busyLogin !== null"
                :model-value="member.role"
                @update:model-value="changeRole(member, String($event))"
              >
                <SelectTrigger
                  :aria-label="t('teams.members.roleSelectLabel', { login: member.login })"
                  class="w-32"
                  size="sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    {{ t('teams.role.member') }}
                  </SelectItem>
                  <SelectItem value="maintainer">
                    {{ t('teams.role.maintainer') }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                :aria-label="t('teams.members.actions.remove', { login: member.login })"
                :disabled="busyLogin !== null"
                size="icon-sm"
                type="button"
                variant="ghost"
                @click="removingMember = member"
              >
                <Trash2 class="size-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        </li>
      </ul>
    </template>

    <Dialog
      :open="removingMember !== null"
      @update:open="(open) => { if (!open && !isRemoving) removingMember = null }"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('teams.members.remove.title', { login: removingMember?.login ?? '' }) }}</DialogTitle>
          <DialogDescription>
            {{ t('teams.members.remove.description', { login: removingMember?.login ?? '', team: teamSlug }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            :disabled="isRemoving"
            size="sm"
            type="button"
            variant="outline"
            @click="removingMember = null"
          >
            {{ t('teams.members.remove.cancel') }}
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
            {{ t('teams.members.remove.confirm') }}
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
          <DialogTitle>{{ t('teams.members.add.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('teams.members.add.description', { team: teamSlug }) }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <Label for="team-add-member">{{ t('teams.members.add.memberLabel') }}</Label>
            <LocalSearchSelect
              v-model="addSearch"
              :empty-label="t('teams.members.add.empty')"
              input-id="team-add-member"
              :items="candidateItems"
              :placeholder="t('teams.members.add.placeholder')"
              @select="selectCandidate"
            />
          </div>
          <div class="grid gap-1.5">
            <Label for="team-add-member-role">{{ t('teams.members.add.roleLabel') }}</Label>
            <Select v-model="addRole">
              <SelectTrigger
                id="team-add-member-role"
                class="w-full"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  {{ t('teams.role.member') }}
                </SelectItem>
                <SelectItem value="maintainer">
                  {{ t('teams.role.maintainer') }}
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
            {{ t('teams.members.add.cancel') }}
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
            {{ t('teams.members.add.submit') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
