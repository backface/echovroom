import devtools from '@vue/devtools'
import Vue from 'vue'
import App from './App.vue'
import router from './router'

if (process.env.NODE_ENV === 'development' && process.env.VUE_APP_REMOTE_VUEDEV_HOST ) {
    devtools.connect(process.env.VUE_APP_REMOTE_VUEDEV_HOST, null )
}

import Vuetify from 'vuetify/lib'
const vuetify = new Vuetify({
  theme: {
    themes: {
      light: {
        primary: '#568203',
        secondary: '#666666',
        accent: '#8c9eff',
        error: '#b71c1c',
      },
      dark: {
        primary: '#8A8808',
        secondary: '#666666',
        accent: '#8c9eff',
        error: '#b71c1c',
        background: '#333'
      }
    },
    dark: false
    // use with: this.$vuetify.theme.dark
  },
})
Vue.use(Vuetify)
Vue.config.productionTip = false

export const event_bus = new Vue();

new Vue({
  router,
  vuetify,
  render: h => h(App)
}).$mount('#app')
