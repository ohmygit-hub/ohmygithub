import { join, resolve } from 'node:path'
import { app, BrowserWindow, ipcMain, nativeImage, nativeTheme, shell, type NativeImage } from 'electron'
import { is } from '@electron-toolkit/utils'
import { registerAccountsIpc } from './accounts'
import { registerActionsIpc } from './actions'
import { initializeAuth, registerAuthIpc } from './auth'
import { registerBookmarksIpc } from './bookmarks'
import { initializeConfig, registerConfigIpc } from './config'
import { configureDevRemoteDebugging } from './debug'
import { registerDeploymentsIpc } from './deployments'
import { registerInboxIpc } from './inbox'
import { registerIssuesIpc } from './issues'
import { registerLinksIpc } from './links'
import { registerPackagesIpc } from './packages'
import { registerPullsIpc } from './pulls'
import { registerReleasesIpc } from './releases'
import { registerRepositoriesIpc } from './repositories'
import { registerSearchIpc } from './search'

configureDevRemoteDebugging()

// Keep the native window background in sync with the active theme so no light
// strip bleeds through behind the renderer (e.g. the hiddenInset titlebar inset
// area) when the app is in dark mode.
const LIGHT_BACKGROUND = '#f7f7f5'
const DARK_BACKGROUND = '#0a0a0a'
const DEV_MAC_APP_ICON = resolve(__dirname, '../../../../assets/liquid-glass-icon.png')
const DEV_DEFAULT_APP_ICON = resolve(__dirname, '../../../../assets/shadow-icon.png')

function resolveBackgroundColor(): string {
  return nativeTheme.shouldUseDarkColors ? DARK_BACKGROUND : LIGHT_BACKGROUND
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
  configureDevelopmentAppIcon()
  registerAccountsIpc()
  registerActionsIpc()
  registerAuthIpc()
  registerBookmarksIpc()
  registerConfigIpc()
  registerDeploymentsIpc()
  registerInboxIpc()
  registerIssuesIpc()
  registerLinksIpc()
  registerPackagesIpc()
  registerPullsIpc()
  registerReleasesIpc()
  registerRepositoriesIpc()
  registerSearchIpc()
  registerWindowIpc()
  initializeAuth()
  initializeConfig()
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
