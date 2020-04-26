<template>
  <v-app>
=    <!--<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vuetify@2.2.11/dist/vuetify.min.css">-->
    <Echorooms />
</v-app>
</template>

<script>
import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import Echorooms from "./Echorooms"

const vuetify = new Vuetify({
  theme: {
    themes: {
      light: {
        primary: '#3f51b5',
        secondary: '#b0bec5',
        accent: '#8c9eff',
        error: '#b71c1c',
      },
    },
  },
})
Vue.use(Vuetify)

export default {
  name: 'EchoraumChat',

  vuetify,
  components: {
    Echorooms
  },

  props: {},

  created() {
    // hack to make it work as web component
    document.body.setAttribute("data-app", true);
  },

  mounted() {

  },

  data() {
    return {
    }
  },

  methods: {
  }

}
</script>

<style lang="scss">
@import "~bulma";
@import '../node_modules/vuetify/dist/vuetify.min.css'
@import url('https://fonts.googleapis.com/css?family=Asap+Condensed');

</style>
