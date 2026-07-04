export type UpdateButtonAction = 'check' | 'download' | 'install' | 'none'
export type UpdateButtonIcon = 'refresh' | 'download' | 'restart'

export interface RendererUpdateState {
  status:
    | 'idle'
    | 'checking'
    | 'up-to-date'
    | 'available'
    | 'downloading'
    | 'downloaded'
    | 'error'
    | 'unavailable'
  progress: number | null
}

export interface UpdateButtonState {
  action: UpdateButtonAction
  disabled: boolean
  icon: UpdateButtonIcon
  labelKey: string
  labelParams?: Record<string, number>
  loading: boolean
  variant: 'default' | 'outline'
}

export function resolveUpdateButtonState(state: RendererUpdateState): UpdateButtonState {
  switch (state.status) {
    case 'checking':
      return {
        action: 'none',
        disabled: true,
        icon: 'refresh',
        labelKey: 'settings.about.updateChecking',
        loading: true,
        variant: 'outline',
      }
    case 'available':
      return {
        action: 'download',
        disabled: false,
        icon: 'download',
        labelKey: 'settings.about.downloadUpdate',
        loading: false,
        variant: 'default',
      }
    case 'downloading':
      return {
        action: 'none',
        disabled: true,
        icon: 'download',
        labelKey: 'settings.about.updateDownloading',
        labelParams: { progress: state.progress ?? 0 },
        loading: true,
        variant: 'default',
      }
    case 'downloaded':
      return {
        action: 'install',
        disabled: false,
        icon: 'restart',
        labelKey: 'settings.about.restartToUpdate',
        loading: false,
        variant: 'default',
      }
    case 'up-to-date':
      return {
        action: 'check',
        disabled: false,
        icon: 'refresh',
        labelKey: 'settings.about.upToDate',
        loading: false,
        variant: 'outline',
      }
    case 'error':
    case 'unavailable':
      return {
        action: 'check',
        disabled: false,
        icon: 'refresh',
        labelKey: 'settings.about.retryUpdate',
        loading: false,
        variant: 'outline',
      }
    case 'idle':
      return {
        action: 'check',
        disabled: false,
        icon: 'refresh',
        labelKey: 'settings.about.checkForUpdate',
        loading: false,
        variant: 'outline',
      }
  }
}
