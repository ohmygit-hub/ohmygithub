import { join, resolve } from 'node:path'
import { app, BrowserWindow, ipcMain, Menu, nativeImage, nativeTheme, shell, type NativeImage } from 'electron'
import { is } from '@electron-toolkit/utils'
import { registerAccountsIpc } from './accounts'
import { registerActionsIpc } from './actions'
import { initializeAuth, registerAuthIpc } from './auth'
import { registerBookmarksIpc } from './bookmarks'
import { initializeConfig, registerConfigIpc, type LocalConfig } from './config'
import { configureDevRemoteDebugging } from './debug'
import { registerDeploymentsIpc } from './deployments'
import { registerInboxIpc } from './inbox'
import { registerIssuesIpc } from './issues'
import { registerLinksIpc } from './links'
import { registerOrganizationPeopleIpc } from './organization-people'
import { registerPackagesIpc } from './packages'
import { registerPullsIpc } from './pulls'
import { registerReleasesIpc } from './releases'
import { registerRepositoriesIpc } from './repositories'
import { registerSearchIpc } from './search'
import { registerUserSettingsIpc } from './user-settings'
import { registerUpdatesIpc } from './updates'

configureDevRemoteDebugging()

// Keep the native window background in sync with the active theme so no light
// strip bleeds through behind the renderer (e.g. the hiddenInset titlebar inset
// area) when the app is in dark mode. `shouldUseDarkColors` follows the OS by
// default, so the app theme is pushed into `nativeTheme.themeSource` first (see
// applyThemeSource) — otherwise app=dark + OS=light paints a light window frame.
const LIGHT_BACKGROUND = '#f7f7f5'
const DARK_BACKGROUND = '#0a0a0a'
const DEV_MAC_APP_ICON = resolve(__dirname, '../../../../assets/liquid-glass-icon.png')
const DEV_DEFAULT_APP_ICON = resolve(__dirname, '../../../../assets/shadow-icon.png')

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

  const mainWindow = new BrowserWindow({
    width: 1560,
    height: 940,
    minWidth: 1040,
    minHeight: 680,
    title: 'Oh My GitHub',
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

  function sendFullscreenState(): void {
    if (mainWindow.isDestroyed()) return
    mainWindow.webContents.send('window:fullscreen-change', {
      isFullScreen: mainWindow.isFullScreen()
    })
  }

  mainWindow.on('enter-full-screen', sendFullscreenState)
  mainWindow.on('leave-full-screen', sendFullscreenState)

  function syncBackgroundColor(): void {
    if (mainWindow.isDestroyed()) return
    mainWindow.setBackgroundColor(resolveBackgroundColor())
  }

  nativeTheme.on('updated', syncBackgroundColor)
  mainWindow.on('closed', () => nativeTheme.off('updated', syncBackgroundColor))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
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

void app.whenReady().then(() => {
  app.setAppUserModelId('dev.oh-my-github.client')
  configureApplicationMenu()
  configureDevelopmentAppIcon()
  registerAccountsIpc()
  registerActionsIpc()
  registerAuthIpc()
  registerBookmarksIpc()
  registerConfigIpc((config) => applyThemeSource(config.ui.theme))
  registerDeploymentsIpc()
  registerInboxIpc()
  registerIssuesIpc()
  registerLinksIpc()
  registerOrganizationPeopleIpc()
  registerPackagesIpc()
  registerPullsIpc()
  registerReleasesIpc()
  registerRepositoriesIpc()
  registerSearchIpc()
  registerUserSettingsIpc()
  registerUpdatesIpc()
  registerWindowIpc()
  initializeAuth()
  applyThemeSource(initializeConfig().config.ui.theme)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
