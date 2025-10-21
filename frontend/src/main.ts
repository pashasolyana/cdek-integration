import './assets/main.css'
import { vMaska } from 'maska/vue'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'
import router from './router'
import { createYmaps } from 'vue-yandex-maps'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.directive('maska', vMaska)

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
})

app.use(vuetify)

app.use(createYmaps({
  apikey: '6e024797-2e50-41d4-ba36-56a10c025f1a',
  lang: 'ru_RU',
  version: '3.0',
}));

app.mount('#app')
