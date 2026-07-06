<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Textarea,
} from '@oh-my-github/ui'
import SettingsSection from '@/pages/settings/components/appearance-settings/settings-section.vue'
import SettingsRow from '@/pages/settings/components/appearance-settings/settings-row.vue'
import SettingsBlock from '@/pages/settings/components/appearance-settings/settings-block.vue'
import {
  updateActionsAccessLevel,
  updateActionsPermissions,
  updateActionsRetention,
  updateSelectedActions,
  updateWorkflowPermissions,
  useActionsSettingsQuery,
  useRepositorySettingsInvalidation,
} from '@/composables/github/use-repository-settings'
import { useToast } from '@/composables/use-toast'
import SettingsToggleRow from '../general/settings-toggle-row.vue'

const props = defineProps<{
  owner: string
  repo: string
}>()

const { t } = useI18n()
const toast = useToast()
const { invalidateAutomation } = useRepositorySettingsInvalidation()

const hasIdentity = computed(() => Boolean(props.owner && props.repo))
const query = useActionsSettingsQuery(() => props.owner, () => props.repo, hasIdentity)
const settings = computed(() => query.data.value ?? null)
const isLoading = computed(() => query.isLoading.value)

const pending = ref(new Set<string>())
const patternsText = ref('')
const retentionText = ref('')

watch(settings, (value) => {
  patternsText.value = value?.selectedActions?.patternsAllowed.join('\n') ?? ''
  retentionText.value = value?.retentionDays === null || value?.retentionDays === undefined
    ? ''
    : String(value.retentionDays)
}, { immediate: true })

function isPending(key: string): boolean {
  return pendingKeysHas(key)
}

function pendingKeysHas(key: string): boolean {
  return pending.value.has(key)
}

async function run(key: string, action: () => Promise<void>): Promise<void> {
  if (pending.value.has(key)) return
  pending.value = new Set([...pending.value, key])

  try {
    await action()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('repository.settings.automation.error'))
  } finally {
    const next = new Set(pending.value)
    next.delete(key)
    pending.value = next
    invalidateAutomation('actions', props.owner, props.repo)
  }
}

function toggleEnabled(value: boolean): void {
  void run('enabled', () => updateActionsPermissions(props.owner, props.repo, value))
}

function changeAllowedActions(value: unknown): void {
  if (typeof value !== 'string' || !settings.value) return
  void run('allowedActions', () => updateActionsPermissions(
    props.owner,
    props.repo,
    settings.value?.enabled ?? true,
    value as 'all' | 'local_only' | 'selected',
  ))
}

function saveSelectedActions(): void {
  const selected = settings.value?.selectedActions
  void run('selectedActions', () => updateSelectedActions(
    props.owner,
    props.repo,
    selected?.githubOwnedAllowed ?? true,
    selected?.verifiedAllowed ?? false,
    patternsText.value.split('\n').map((pattern) => pattern.trim()).filter(Boolean),
  ))
}

function toggleSelectedFlag(flag: 'githubOwnedAllowed' | 'verifiedAllowed', value: boolean): void {
  const selected = settings.value?.selectedActions
  void run(flag, () => updateSelectedActions(
    props.owner,
    props.repo,
    flag === 'githubOwnedAllowed' ? value : selected?.githubOwnedAllowed ?? true,
    flag === 'verifiedAllowed' ? value : selected?.verifiedAllowed ?? false,
    selected?.patternsAllowed ?? [],
  ))
}

function changeWorkflowPermissions(value: unknown): void {
  if ((value !== 'read' && value !== 'write') || !settings.value) return
  void run('workflow', () => updateWorkflowPermissions(
    props.owner,
    props.repo,
    value,
    settings.value?.canApprovePullRequestReviews ?? false,
  ))
}

function toggleCanApprove(value: boolean): void {
  void run('canApprove', () => updateWorkflowPermissions(
    props.owner,
    props.repo,
    settings.value?.defaultWorkflowPermissions ?? 'read',
    value,
  ))
}

function changeAccessLevel(value: unknown): void {
  if (value !== 'none' && value !== 'user' && value !== 'organization') return
  void run('accessLevel', () => updateActionsAccessLevel(props.owner, props.repo, value))
}

function saveRetention(): void {
  const days = Number(retentionText.value)
  if (!Number.isInteger(days) || days < 1 || days > 400) {
    toast.error(t('repository.settings.automation.actions.retentionInvalid'))
    return
  }
  void run('retention', () => updateActionsRetention(props.owner, props.repo, days))
}
</script>

<template>
  <div
    v-if="isLoading || !settings"
    class="flex min-h-[8rem] items-center justify-center"
  >
    <Spinner class="size-4 text-muted-foreground" />
  </div>

  <div
    v-else
    class="space-y-8"
  >
    <SettingsSection :title="t('repository.settings.automation.actions.allowedActions')">
      <SettingsToggleRow
        :description="t('repository.settings.automation.actions.enabledHint')"
        :disabled="isPending('enabled')"
        :model-value="settings.enabled"
        :title="t('repository.settings.automation.actions.enabled')"
        @update:model-value="toggleEnabled"
      />

      <template v-if="settings.enabled">
        <SettingsRow :label="t('repository.settings.automation.actions.allowedActions')">
          <Select
            :disabled="isPending('allowedActions')"
            :model-value="settings.allowedActions ?? 'all'"
            @update:model-value="changeAllowedActions"
          >
            <SelectTrigger
              class="min-w-56"
              size="sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">{{ t('repository.settings.automation.actions.allowed.all') }}</SelectItem>
              <SelectItem value="local_only">{{ t('repository.settings.automation.actions.allowed.local_only') }}</SelectItem>
              <SelectItem value="selected">{{ t('repository.settings.automation.actions.allowed.selected') }}</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <template v-if="settings.allowedActions === 'selected'">
          <SettingsToggleRow
            :disabled="isPending('githubOwnedAllowed')"
            :model-value="settings.selectedActions?.githubOwnedAllowed ?? false"
            :title="t('repository.settings.automation.actions.githubOwned')"
            @update:model-value="toggleSelectedFlag('githubOwnedAllowed', $event)"
          />
          <SettingsToggleRow
            :disabled="isPending('verifiedAllowed')"
            :model-value="settings.selectedActions?.verifiedAllowed ?? false"
            :title="t('repository.settings.automation.actions.verified')"
            @update:model-value="toggleSelectedFlag('verifiedAllowed', $event)"
          />
          <SettingsBlock :label="t('repository.settings.automation.actions.patterns')">
            <Textarea
              v-model="patternsText"
              :placeholder="t('repository.settings.automation.actions.patternsPlaceholder')"
              rows="3"
              spellcheck="false"
            />
            <div class="mt-2 flex justify-end">
              <Button
                :disabled="isPending('selectedActions')"
                size="sm"
                type="button"
                @click="saveSelectedActions"
              >
                {{ t('repository.settings.automation.save') }}
              </Button>
            </div>
          </SettingsBlock>
        </template>
      </template>
    </SettingsSection>

    <SettingsSection
      v-if="settings.enabled"
      :title="t('repository.settings.automation.actions.workflowPermissions')"
    >
      <SettingsRow
        v-if="settings.defaultWorkflowPermissions !== null"
        :description="t('repository.settings.automation.actions.workflowPermissionsHint')"
        :label="t('repository.settings.automation.actions.workflowPermissions')"
      >
        <Select
          :disabled="isPending('workflow')"
          :model-value="settings.defaultWorkflowPermissions"
          @update:model-value="changeWorkflowPermissions"
        >
          <SelectTrigger
            class="min-w-48"
            size="sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="read">{{ t('repository.settings.automation.actions.permissionRead') }}</SelectItem>
            <SelectItem value="write">{{ t('repository.settings.automation.actions.permissionWrite') }}</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      <SettingsToggleRow
        v-if="settings.canApprovePullRequestReviews !== null"
        :description="t('repository.settings.automation.actions.canApproveHint')"
        :disabled="isPending('canApprove')"
        :model-value="settings.canApprovePullRequestReviews"
        :title="t('repository.settings.automation.actions.canApprove')"
        @update:model-value="toggleCanApprove"
      />

      <SettingsRow
        v-if="settings.accessLevel !== null"
        :label="t('repository.settings.automation.actions.accessLevel')"
      >
        <Select
          :disabled="isPending('accessLevel')"
          :model-value="settings.accessLevel"
          @update:model-value="changeAccessLevel"
        >
          <SelectTrigger
            class="min-w-48"
            size="sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="none">{{ t('repository.settings.automation.actions.access.none') }}</SelectItem>
            <SelectItem value="user">{{ t('repository.settings.automation.actions.access.user') }}</SelectItem>
            <SelectItem value="organization">{{ t('repository.settings.automation.actions.access.organization') }}</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      <SettingsRow
        v-if="settings.retentionDays !== null"
        :description="t('repository.settings.automation.actions.retentionHint')"
        :label="t('repository.settings.automation.actions.retention')"
      >
        <div class="flex items-center gap-2">
          <Input
            v-model="retentionText"
            class="w-20 text-right"
            inputmode="numeric"
          />
          <Button
            v-if="retentionText !== String(settings.retentionDays)"
            :disabled="isPending('retention')"
            size="sm"
            type="button"
            @click="saveRetention"
          >
            {{ t('repository.settings.automation.save') }}
          </Button>
        </div>
      </SettingsRow>
    </SettingsSection>
  </div>
</template>
