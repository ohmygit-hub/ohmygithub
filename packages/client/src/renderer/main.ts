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
import './styles/app.css'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(PiniaColada)
app.use(router)
app.use(i18n)
app.mount('#app')
