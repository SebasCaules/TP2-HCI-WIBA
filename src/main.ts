import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light'
  }
})

// Create app instance
const app = createApp(App)

// Use plugins
app.use(createPinia())
app.use(router)
app.use(vuetify)

// Initialize security store
import { useSecurityStore } from '@/stores/securityStore'
const securityStore = useSecurityStore()
securityStore.initialize()

// Mount app
app.mount('#app')
