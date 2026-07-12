<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Input, SegmentedControl, Switch, type SegmentedItem } from '@oh-my-github/ui'
import { useNetworkStore, type ProxyMode } from '@/stores/network'
import SettingsRow from '../appearance-settings/settings-row.vue'
import SettingsSection from '../appearance-settings/settings-section.vue'

const { t } = useI18n()
const networkStore = useNetworkStore()
const { proxyMode, proxyUrl, useSystemCa } = storeToRefs(networkStore)

onMounted(() => {
  void networkStore.initialize()
})

const proxyModeItems = computed<SegmentedItem<ProxyMode>[]>(() => [
  { value: 'none', label: t('settings.network.modes.none') },
  { value: 'system', label: t('settings.network.modes.system') },
  { value: 'custom', label: t('settings.network.modes.custom') },
])

// Buffer the URL so a keystroke doesn't write config to disk; commit on blur/enter.
const proxyUrlDraft = ref(proxyUrl.value)
watch(proxyUrl, (value) => {
  proxyUrlDraft.value = value
})

function commitProxyUrl(): void {
  if (proxyUrlDraft.value === proxyUrl.value) return
  networkStore.setProxyUrl(proxyUrlDraft.value)
}
</script>

<template>
  <div class="space-y-8">
    <SettingsSection>
      <SettingsRow :label="t('settings.network.proxy')">
        <SegmentedControl
          :aria-label="t('settings.network.proxy')"
          :items="proxyModeItems"
          :model-value="proxyMode"
          @update:model-value="networkStore.setProxyMode"
        />
      </SettingsRow>

      <SettingsRow
        v-if="proxyMode === 'custom'"
        :label="t('settings.network.customUrl')"
        :description="t('settings.network.customUrlDescription')"
      >
        <Input
          v-model="proxyUrlDraft"
          :aria-label="t('settings.network.customUrl')"
          class="w-56"
          :placeholder="t('settings.network.customUrlPlaceholder')"
          size="sm"
          spellcheck="false"
          @blur="commitProxyUrl"
          @change="commitProxyUrl"
          @keydown.enter="commitProxyUrl"
        />
      </SettingsRow>

      <SettingsRow
        :label="t('settings.network.useSystemCa')"
        :description="t('settings.network.useSystemCaDescription')"
      >
        <Switch
          :aria-label="t('settings.network.useSystemCa')"
          :model-value="useSystemCa"
          @update:model-value="networkStore.setUseSystemCa"
        />
      </SettingsRow>
    </SettingsSection>
  </div>
</template>
