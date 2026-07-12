import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './app.vue'
import { i18n } from './i18n'
import { router } from './router'
import 'markstream-vue/index.css'
import 'katex/dist/katex.min.css'
import 'animate.css'
// Bundled UI font (MiSans VF) is declared as an @font-face in styles/app.css.
// Maple Mono (code) — Latin only, weights 400/700 + 400 italic.
import '@fontsource/maple-mono/400.css'
import '@fontsource/maple-mono/400-italic.css'
import '@fontsource/maple-mono/700.css'
import './styles/app.css'

// Expose the host platform on <html data-platform> so styles can be
// platform-specific (e.g. the macOS hiddenInset titlebar reserves a
// traffic-light inset that Windows/Linux — which use a native title bar — must
// not). Detection mirrors the keyboard layer's use of `navigator.platform`.
function resolvePlatform(): 'mac' | 'windows' | 'linux' {
  const platform = navigator.platform || ''
  const userAgent = navigator.userAgent || ''
  if (/Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS X/i.test(userAgent)) return 'mac'
  if (/Win/i.test(platform) || /Windows/i.test(userAgent)) return 'windows'
  return 'linux'
}

document.documentElement.dataset.platform = resolvePlatform()

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(PiniaColada)
app.use(router)
app.use(i18n)
app.mount('#app')
