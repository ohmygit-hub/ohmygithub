/// <reference types="vite/client" />

type LocalConfig = {
  schemaVersion: 1
  github: {
    activeAccountLogin: string | null
  }
  ui: {
    locale: 'en' | 'zh'
    theme: 'auto' | 'light' | 'dark'
  }
}

type AuthViewer = {
  id: number
  login: string
  name: string | null
  avatarUrl: string
}

type AuthState = {
  isAuthenticated: boolean
  path: string
  hasGitHubClientId: boolean
  auth: {
    schemaVersion: 1
    method: 'oauth_device' | 'personal_token'
    tokenType: string
    scopes: string[]
    viewer: AuthViewer
    createdAt: string
    updatedAt: string
  } | null
}

type WindowControlsState = {
  isFullScreen: boolean
}

interface Window {
  ohMyGithub: {
    app: {
      name: string
      version: string
    }
    auth: {
      get: () => Promise<AuthState>
      startDeviceFlow: (onStarted?: (details: {
        auth: AuthState
        sessionId: string
        userCode: string
        verificationUri: string
        verificationUriComplete?: string
      }) => void) => Promise<{
        auth: AuthState
        sessionId: string
        userCode: string
        verificationUri: string
        verificationUriComplete?: string
      }>
      savePersonalToken: (token: string) => Promise<AuthState>
      logout: () => Promise<AuthState>
    }
    config: {
      get: () => Promise<{
        path: string
        config: LocalConfig
      }>
      update: (patch: Partial<{
        github: Partial<LocalConfig['github']>
        ui: Partial<LocalConfig['ui']>
      }>) => Promise<{
        path: string
        config: LocalConfig
      }>
    }
    windowControls: {
      getState: () => Promise<WindowControlsState>
      onFullscreenChange: (listener: (state: WindowControlsState) => void) => () => void
    }
  }
}
