import Vue from 'vue'
import App from './App.vue'
import 'buefy/dist/buefy.css'
import router from './router'

import Vuetify from 'vuetify/lib'

const vuetify = new Vuetify({
  theme: {
    themes: {
      light: {
        primary: '#8A8808',
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
    dark: false,
    // use with: this.$vuetify.theme.dark
  },
})

Vue.use(Vuetify)
Vue.config.productionTip = false

new Vue({
  router,
  vuetify,
  render: h => h(App)
}).$mount('#app')
