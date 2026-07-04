import { app, BrowserWindow, ipcMain } from 'electron'
import electronUpdater from 'electron-updater'
import type { ProgressInfo, UpdateInfo } from 'electron-updater'
import {
  createInitialUpdateState,
  reduceUpdateState,
  type UpdateState,
  type UpdateStateEvent,
} from './updates-state'

export interface AppInfo {
  version: string
  platform: NodeJS.Platform
}

// Injected at build time from the `R2_PUBLIC_BASE_URL` env via electron.vite
// config `define`. The public production feed is also the fallback so installed
// builds can update even if the build-time env was omitted.
const DEFAULT_UPDATE_FEED_BASE_URL = 'https://resource.oh-my-github.app'
// The build-time `define` injects an empty string when `R2_PUBLIC_BASE_URL` is
// unset, so `??` would not fall back. Trim first, then treat a blank value as
// missing so the default feed always applies.
const configuredFeedBaseUrl = (process.env.R2_PUBLIC_BASE_URL ?? '').trim()
const UPDATE_FEED_BASE_URL = configuredFeedBaseUrl || DEFAULT_UPDATE_FEED_BASE_URL
const { autoUpdater } = electronUpdater

let updateState = createInitialUpdateState(app.getVersion())
let updaterConfigured = false
let updaterListenersRegistered = false
let startupCheckScheduled = false

export function registerUpdatesIpc(): void {
  configureAutoUpdater()

  ipcMain.handle('app:get-info', (): AppInfo => ({
    version: app.getVersion(),
    platform: process.platform,
  }))
  ipcMain.handle('updates:get-state', () => getUpdateState())
  ipcMain.handle('updates:check', () => checkForUpdate())
  ipcMain.handle('updates:download', () => downloadUpdate())
  ipcMain.handle('updates:install', () => installUpdate())

  scheduleStartupUpdateCheck()
}

function getUpdateState(): UpdateState {
  return updateState
}

async function checkForUpdate(): Promise<UpdateState> {
  if (!UPDATE_FEED_BASE_URL) {
    return setUpdateState({
      type: 'unavailable',
      error: 'No update feed URL is configured.',
    })
  }

  configureAutoUpdater()

  if (!autoUpdater.isUpdaterActive()) {
    return setUpdateState({
      type: 'unavailable',
      error: 'Updater is not available for this build.',
    })
  }

  setUpdateState({ type: 'checking' })

  try {
    const result = await autoUpdater.checkForUpdates()
    if (!result) {
      return setUpdateState({
        type: 'unavailable',
        error: 'Updater is not available for this build.',
      })
    }

    // electron-updater emits the stateful events above; these fallbacks keep the
    // IPC result useful if a provider returns without emitting for any reason.
    if (updateState.status === 'checking') {
      setUpdateState(
        result.isUpdateAvailable
          ? { type: 'available', latestVersion: result.updateInfo.version }
          : { type: 'not-available', latestVersion: result.updateInfo.version },
      )
    }
  } catch (error) {
    setUpdateState({ type: 'error', error })
  }

  return updateState
}

async function downloadUpdate(): Promise<UpdateState> {
  configureAutoUpdater()

  if (!autoUpdater.isUpdaterActive()) {
    return setUpdateState({
      type: 'unavailable',
      error: 'Updater is not available for this build.',
    })
  }

  if (updateState.status === 'downloaded') {
    return updateState
  }

  if (updateState.status !== 'available') {
    return updateState
  }

  try {
    await autoUpdater.downloadUpdate()
  } catch (error) {
    setUpdateState({ type: 'error', error })
  }

  return updateState
}

function installUpdate(): UpdateState {
  if (updateState.status === 'downloaded') {
    autoUpdater.quitAndInstall(false, true)
  }
  return updateState
}

function configureAutoUpdater(): void {
  if (!updaterConfigured) {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.forceDevUpdateConfig = !app.isPackaged
    try {
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: ensureTrailingSlash(UPDATE_FEED_BASE_URL),
      })
      updaterConfigured = true
    } catch (error) {
      // A malformed feed URL must not crash the main process at startup; the
      // updater simply stays inactive and update checks report unavailable.
      const message = error instanceof Error ? error.message : String(error)
      setUpdateState({ type: 'unavailable', error: `Failed to configure updater: ${message}` })
      return
    }
  }

  if (updaterListenersRegistered) return

  autoUpdater.on('checking-for-update', () => {
    setUpdateState({ type: 'checking' })
  })
  autoUpdater.on('update-available', (info) => {
    setUpdateState({ type: 'available', latestVersion: updateVersion(info) })
  })
  autoUpdater.on('update-not-available', (info) => {
    setUpdateState({ type: 'not-available', latestVersion: updateVersion(info) })
  })
  autoUpdater.on('download-progress', (progress) => {
    setUpdateState({ type: 'download-progress', percent: progressPercent(progress) })
  })
  autoUpdater.on('update-downloaded', (event) => {
    setUpdateState({ type: 'downloaded', latestVersion: updateVersion(event) })
  })
  autoUpdater.on('error', (error) => {
    setUpdateState({ type: 'error', error })
  })

  updaterListenersRegistered = true
}

function scheduleStartupUpdateCheck(): void {
  if (startupCheckScheduled) return
  startupCheckScheduled = true

  setTimeout(() => {
    void checkForUpdate()
  }, 3_000)
}

function setUpdateState(event: UpdateStateEvent): UpdateState {
  updateState = reduceUpdateState(updateState, event)
  broadcastUpdateState()
  return updateState
}

function broadcastUpdateState(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed()) continue
    window.webContents.send('updates:state-change', updateState)
  }
}

function updateVersion(info: UpdateInfo): string {
  return info.version
}

function progressPercent(progress: ProgressInfo): number {
  return progress.percent
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}
