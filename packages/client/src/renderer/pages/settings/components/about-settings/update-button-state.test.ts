import { describe, expect, it } from 'vitest'
import { resolveUpdateButtonState, type RendererUpdateState } from './update-button-state'

describe('resolveUpdateButtonState', () => {
  it('maps idle and retryable states to the check action', () => {
    const states: Array<RendererUpdateState['status']> = [
      'idle',
      'up-to-date',
      'error',
      'unavailable',
    ]

    for (const status of states) {
      expect(resolveUpdateButtonState({ status, progress: null })).toMatchObject({
        action: 'check',
        disabled: false,
        loading: false,
        icon: 'refresh',
      })
    }
  })

  it('maps update lifecycle states to download, waiting, and install actions', () => {
    expect(resolveUpdateButtonState({ status: 'checking', progress: null })).toMatchObject({
      action: 'none',
      disabled: true,
      loading: true,
      labelKey: 'settings.about.updateChecking',
    })

    expect(resolveUpdateButtonState({ status: 'available', progress: null })).toMatchObject({
      action: 'download',
      disabled: false,
      loading: false,
      icon: 'download',
      labelKey: 'settings.about.downloadUpdate',
      variant: 'default',
    })

    expect(resolveUpdateButtonState({ status: 'downloading', progress: 48 })).toMatchObject({
      action: 'none',
      disabled: true,
      loading: true,
      labelKey: 'settings.about.updateDownloading',
      labelParams: { progress: 48 },
    })

    expect(resolveUpdateButtonState({ status: 'downloaded', progress: 100 })).toMatchObject({
      action: 'install',
      disabled: false,
      loading: false,
      icon: 'restart',
      labelKey: 'settings.about.restartToUpdate',
      variant: 'default',
    })
  })
})
