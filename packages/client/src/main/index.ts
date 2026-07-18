import { join, resolve } from 'node:path'
import { app, autoUpdater, BrowserWindow, ipcMain, Menu, nativeImage, nativeTheme, shell, type NativeImage } from 'electron'
import { is } from '@electron-toolkit/utils'
import { registerAccountsIpc } from './accounts'
import { registerActionsIpc } from './actions'
import { registerActivityIpc } from './activity'
import { initializeAuth, isAuthenticated, onAuthChanged, registerAuthIpc } from './auth'
import { readBookmarks, registerBookmarksIpc } from './bookmarks'
import { getLocalConfig, initializeConfig, registerConfigIpc, type LocalConfig } from './config'
import { configureDevRemoteDebugging } from './debug'
import { registerDeploymentsIpc } from './deployments'
import { listRecentNotifications, registerInboxIpc } from './inbox'
import { registerIssuesIpc } from './issues'
import { registerLinksIpc } from './links'
import { registerOrganizationPeopleIpc } from './organization-people'
import { registerOrganizationTeamsIpc } from './organization-teams'
import { registerPackagesIpc } from './packages'
import { registerPinsIpc } from './pins'
import { registerPullsIpc } from './pulls'
import { registerReleasesIpc } from './releases'
import { registerRepositoriesIpc } from './repositories'
import { registerRepositorySettingsIpc } from './repository-settings'
import { registerSearchIpc } from './search'
import { registerUserSettingsIpc } from './user-settings'
import { registerUpdatesIpc } from './updates'
import { createAppTray, type AppTrayHandle } from './tray'

configureDevRemoteDebugging()

// Keep the native window background in sync with the active theme so no light
// strip bleeds through behind the renderer (e.g. the hiddenInset titlebar inset
// area) when the app is in dark mode. `shouldUseDarkColors` follows the OS by
// default, so the app theme is pushed into `nativeTheme.themeSource` first (see
// applyThemeSource) — otherwise app=dark + OS=light paints a light window frame.
const LIGHT_BACKGROUND = '#f7f7f5'
const DARK_BACKGROUND = '#0a0a0a'
const APP_NAME = 'Oh My GitHub'
const DEV_MAC_APP_ICON = resolve(__dirname, '../../../../assets/liquid-glass-icon.png')
const DEV_DEFAULT_APP_ICON = resolve(__dirname, '../../../../assets/shadow-icon.png')

// macOS builds the application menu (About/Hide/Quit) from `app.name`. Without an
// explicit name it falls back to the nearest package.json `name`
// (`@oh-my-github/client`) in development, which then leaks into those menu items.
// Pin it to the product name so dev matches the packaged build (electron-builder
// sets the same value via `productName`).
app.setName(APP_NAME)

let mainWindow: BrowserWindow | null = null
let appTray: AppTrayHandle | null = null
let isQuitting = false

function resolveBackgroundColor(): string {
  return nativeTheme.shouldUseDarkColors ? DARK_BACKGROUND : LIGHT_BACKGROUND
}

// Drive the OS-level appearance from the in-app theme preference so the native
// chrome (window background, traffic lights) matches the renderer. 'auto' defers
// to the OS via 'system'.
function applyThemeSource(theme: LocalConfig['ui']['theme']): void {
  nativeTheme.themeSource = theme === 'auto' ? 'system' : theme
}

function configureDevelopmentAppIcon(): void {
  if (!is.dev || process.platform !== 'darwin') return
  const icon = loadDevelopmentAppIcon()
  if (!icon) return
  app.dock?.setIcon(icon)
}

function loadDevelopmentAppIcon(): NativeImage | undefined {
  if (!is.dev) return undefined

  const iconPath = process.platform === 'darwin' ? DEV_MAC_APP_ICON : DEV_DEFAULT_APP_ICON
  const icon = nativeImage.createFromPath(iconPath)
  return icon.isEmpty() ? undefined : icon
}

// On Windows/Linux the Electron application menu renders as an in-window menu bar
// (File/Edit/View/Window). The app drives every command from its own UI and
// renderer keyboard shortcuts, so that native menu is redundant chrome — remove
// it. macOS keeps its menu bar: it lives in the system bar and provides the
// standard app/edit accelerators expected on that platform.
function configureApplicationMenu(): void {
  if (process.platform === 'darwin') return
  Menu.setApplicationMenu(null)
}

function createWindow(): void {
  const icon = loadDevelopmentAppIcon()

  mainWindow = new BrowserWindow({
    width: 1560,
    height: 940,
    minWidth: 1040,
    minHeight: 680,
    title: APP_NAME,
    icon,
    backgroundColor: resolveBackgroundColor(),
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true
    }
  })

  const window = mainWindow

  function sendFullscreenState(): void {
    if (window.isDestroyed()) return
    window.webContents.send('window:fullscreen-change', {
      isFullScreen: window.isFullScreen()
    })
  }

  window.on('enter-full-screen', sendFullscreenState)
  window.on('leave-full-screen', sendFullscreenState)

  function syncBackgroundColor(): void {
    if (window.isDestroyed()) return
    window.setBackgroundColor(resolveBackgroundColor())
  }

  nativeTheme.on('updated', syncBackgroundColor)
  window.on('closed', () => {
    nativeTheme.off('updated', syncBackgroundColor)
    mainWindow = null
  })

  window.once('ready-to-show', () => {
    window.show()
  })

  window.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      window.hide()
    }
  })

  window.on('focus', () => appTray?.refreshInbox())

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerWindowIpc(): void {
  ipcMain.handle('window:get-state', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)

    return {
      isFullScreen: window?.isFullScreen() ?? false
    }
  })
}

function showWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
    return
  }
  createWindow()
}

function sendToRenderer(channel: string, payload?: unknown): void {
  showWindow()
  const target = mainWindow
  if (!target || target.isDestroyed()) return
  if (target.webContents.isLoading()) {
    target.webContents.once('did-finish-load', () => target.webContents.send(channel, payload))
  } else {
    target.webContents.send(channel, payload)
  }
}

// Single-instance guard. The app keeps running in the tray, so relaunching the
// binary (double-clicking the desktop icon) would otherwise spawn a second process
// with its own window AND its own tray icon. Hold a lock: a duplicate launch quits
// immediately and the primary instance surfaces its existing window instead.
const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  // A primary instance already owns the app (possibly hidden in the tray). Quit this
  // duplicate before it registers any window / tray / IPC, and let the primary surface
  // its window via 'second-instance' — the shape of Electron's single-instance example.
  app.quit()
} else {
  app.on('second-instance', () => {
    showWindow()
  })

  void app.whenReady().then(() => {
    app.setAppUserModelId('dev.oh-my-github.client')
    configureApplicationMenu()
    configureDevelopmentAppIcon()
    registerAccountsIpc()
    registerActionsIpc()
    registerActivityIpc()
    registerAuthIpc()
    registerBookmarksIpc()
    registerConfigIpc((config) => {
      applyThemeSource(config.ui.theme)
      appTray?.refresh()
    })
    registerDeploymentsIpc()
    registerInboxIpc()
    registerIssuesIpc()
    registerLinksIpc()
    registerOrganizationPeopleIpc()
    registerOrganizationTeamsIpc()
    registerPackagesIpc()
    registerPinsIpc()
    registerPullsIpc()
    registerReleasesIpc()
    registerRepositoriesIpc()
    registerRepositorySettingsIpc()
    registerSearchIpc()
    registerUserSettingsIpc()
    registerUpdatesIpc()
    registerWindowIpc()
    initializeAuth()
    applyThemeSource(initializeConfig().config.ui.theme)
    createWindow()
    appTray = createAppTray({
      showWindow,
      sendToRenderer,
      getLanguage: () => getLocalConfig().ui.locale,
      isAuthenticated,
      listBookmarks: () => readBookmarks(),
      listNotifications: (limit) => listRecentNotifications(limit),
      onAuthChanged,
      quit: () => {
        isQuitting = true
        app.quit()
      }
    })

    app.on('activate', () => {
      showWindow()
    })
  })

  app.on('before-quit', () => {
    isQuitting = true
  })

  // macOS installs updates through Electron's native autoUpdater, which closes all
  // windows WITHOUT emitting 'before-quit' (it emits 'before-quit-for-update' on
  // itself instead) and only installs/relaunches once 'window-all-closed' fires.
  // Without this, the close-to-tray guard hides the window, the updater waits
  // forever, and "Restart to update" leaves the old app running hidden in the tray.
  autoUpdater.on('before-quit-for-update', () => {
    isQuitting = true
  })

  app.on('window-all-closed', () => {
    // The app keeps running in the tray on all platforms. Quit happens only via the
    // tray's Quit item (which sets isQuitting) or a genuine OS/updater quit.
  })
}
