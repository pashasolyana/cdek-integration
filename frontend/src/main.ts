import './assets/main.css'
import 'vue-yandex-maps/css'
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
  apikey: '5db945dc-0d89-4cff-a081-f989357174cc',
  lang: 'ru_RU',
}));

app.mount('#app')
