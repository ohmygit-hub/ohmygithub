<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExternalLink } from 'lucide-vue-next'
import { Spinner } from '@oh-my-github/ui'
import SettingsSection from '@/pages/settings/components/appearance-settings/settings-section.vue'
import {
  setAutomatedSecurityFixes,
  setPrivateVulnerabilityReporting,
  setVulnerabilityAlerts,
  updateSecurityAnalysis,
  useRepositorySettingsInvalidation,
  useSecurityOverviewQuery,
} from '@/composables/github/use-repository-settings'
import { useToast } from '@/composables/use-toast'
import SettingsToggleRow from '../general/settings-toggle-row.vue'

const props = defineProps<{
  owner: string
  repo: string
}>()

const { t } = useI18n()
const toast = useToast()
const { invalidateSecurity } = useRepositorySettingsInvalidation()

const hasIdentity = computed(() => Boolean(props.owner && props.repo))
const query = useSecurityOverviewQuery(() => props.owner, () => props.repo, hasIdentity)
const overview = computed(() => query.data.value ?? null)
const isLoading = computed(() => query.isLoading.value)

const pending = ref(new Set<string>())

async function run(key: string, action: () => Promise<void>): Promise<void> {
  if (pending.value.has(key)) return
  pending.value = new Set([...pending.value, key])

  try {
    await action()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('repository.settings.security.error'))
  } finally {
    const next = new Set(pending.value)
    next.delete(key)
    pending.value = next
    invalidateSecurity('overview', props.owner, props.repo)
  }
}

function toggleAnalysis(
  field: 'advancedSecurity' | 'secretScanning' | 'secretScanningPushProtection',
  value: boolean,
): void {
  void run(field, () => updateSecurityAnalysis(props.owner, props.repo, {
    [field]: value ? 'enabled' : 'disabled',
  }))
}

function toggleVulnerabilityAlerts(value: boolean): void {
  void run('vulnerabilityAlerts', () => setVulnerabilityAlerts(props.owner, props.repo, value))
}

function toggleAutomatedFixes(value: boolean): void {
  void run('automatedFixes', () => setAutomatedSecurityFixes(props.owner, props.repo, value))
}

function togglePrivateReporting(value: boolean): void {
  void run('privateReporting', () => setPrivateVulnerabilityReporting(props.owner, props.repo, value))
}

function openExternal(): void {
  const url = `https://github.com/${encodeURIComponent(props.owner)}/${encodeURIComponent(props.repo)}/settings/security_analysis`
  void window.ohMyGithub?.links?.openExternalUrl(url)
}
</script>

<template>
  <div
    v-if="isLoading || !overview"
    class="flex min-h-[8rem] items-center justify-center"
  >
    <Spinner class="size-4 text-muted-foreground" />
  </div>

  <div
    v-else
    class="grid gap-3"
  >
    <SettingsSection :title="t('repository.settings.security.tabs.advancedSecurity')">
    <SettingsToggleRow
      v-if="overview.advancedSecurity !== 'unavailable'"
      :description="t('repository.settings.security.advancedSecurityHint')"
      :disabled="pending.has('advancedSecurity')"
      :model-value="overview.advancedSecurity === 'enabled'"
      :title="t('repository.settings.security.advancedSecurity')"
      @update:model-value="toggleAnalysis('advancedSecurity', $event)"
    />
    <SettingsToggleRow
      v-if="overview.secretScanning !== 'unavailable'"
      :description="t('repository.settings.security.secretScanningHint')"
      :disabled="pending.has('secretScanning')"
      :model-value="overview.secretScanning === 'enabled'"
      :title="t('repository.settings.security.secretScanning')"
      @update:model-value="toggleAnalysis('secretScanning', $event)"
    />
    <SettingsToggleRow
      v-if="overview.secretScanningPushProtection !== 'unavailable'"
      :description="t('repository.settings.security.pushProtectionHint')"
      :disabled="pending.has('secretScanningPushProtection')"
      :model-value="overview.secretScanningPushProtection === 'enabled'"
      :title="t('repository.settings.security.pushProtection')"
      @update:model-value="toggleAnalysis('secretScanningPushProtection', $event)"
    />
    <SettingsToggleRow
      v-if="overview.vulnerabilityAlerts !== null"
      :description="t('repository.settings.security.dependabotAlertsHint')"
      :disabled="pending.has('vulnerabilityAlerts')"
      :model-value="overview.vulnerabilityAlerts"
      :title="t('repository.settings.security.dependabotAlerts')"
      @update:model-value="toggleVulnerabilityAlerts"
    />
    <SettingsToggleRow
      v-if="overview.automatedSecurityFixes !== null"
      :description="t('repository.settings.security.securityUpdatesHint')"
      :disabled="pending.has('automatedFixes')"
      :model-value="overview.automatedSecurityFixes"
      :title="t('repository.settings.security.securityUpdates')"
      @update:model-value="toggleAutomatedFixes"
    />
    <SettingsToggleRow
      v-if="overview.privateVulnerabilityReporting !== null"
      :description="t('repository.settings.security.privateReportingHint')"
      :disabled="pending.has('privateReporting')"
      :model-value="overview.privateVulnerabilityReporting"
      :title="t('repository.settings.security.privateReporting')"
      @update:model-value="togglePrivateReporting"
    />
    </SettingsSection>

    <button
      class="inline-flex items-center gap-1 justify-self-start px-2 text-caption text-muted-foreground underline-offset-4 outline-hidden hover:underline"
      type="button"
      @click="openExternal"
    >
      {{ t('repository.settings.security.moreOnGitHub') }}
      <ExternalLink
        class="size-3"
        :stroke-width="1.75"
      />
    </button>
  </div>
</template>
