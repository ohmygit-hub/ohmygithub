import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ProxyMode = 'none' | 'system' | 'custom'

function normalizeProxyMode(value: unknown): ProxyMode {
  return value === 'none' || value === 'custom' ? value : 'system'
}

/**
 * Local network config (proxy + trusted CA) mirrored from `~/.oh-my-github/config.json`.
 * Silent auto-save: each setter writes through the config IPC and only rolls back
 * (re-reads the persisted config) on failure — matching the settings store model.
 */
export const useNetworkStore = defineStore('network', () => {
  const initialized = ref(false)
  const isSaving = ref(false)
  const proxyMode = ref<ProxyMode>('system')
  const proxyUrl = ref('')
  const useSystemCa = ref(false)

  function assign(network: LocalConfig['network'] | undefined): void {
    proxyMode.value = normalizeProxyMode(network?.proxyMode)
    proxyUrl.value = network?.proxyUrl ?? ''
    useSystemCa.value = network?.useSystemCa === true
  }

  async function initialize(): Promise<void> {
    if (initialized.value) return

    try {
      const info = await window.ohMyGithub?.config?.get?.()
      assign(info?.config.network)
    } finally {
      initialized.value = true
    }
  }

  async function persist(): Promise<void> {
    isSaving.value = true
    try {
      const info = await window.ohMyGithub?.config?.update?.({
        network: {
          proxyMode: proxyMode.value,
          proxyUrl: proxyUrl.value.trim() ? proxyUrl.value.trim() : null,
          useSystemCa: useSystemCa.value,
        },
      })
      assign(info?.config.network)
    } catch {
      // Re-sync to the persisted config so the UI never shows an unsaved edit.
      initialized.value = false
      await initialize()
    } finally {
      isSaving.value = false
    }
  }

  function setProxyMode(value: ProxyMode): void {
    proxyMode.value = normalizeProxyMode(value)
    void persist()
  }

  function setProxyUrl(value: string): void {
    proxyUrl.value = value
    void persist()
  }

  function setUseSystemCa(value: boolean): void {
    useSystemCa.value = value
    void persist()
  }

  return {
    initialized,
    isSaving,
    proxyMode,
    proxyUrl,
    useSystemCa,
    initialize,
    setProxyMode,
    setProxyUrl,
    setUseSystemCa,
  }
})
