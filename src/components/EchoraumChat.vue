<template>
  <v-app>
    <Echorooms />
</v-app>
</template>

<script>
import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import Echorooms from "./Echorooms"
//import 'typeface-asap-condensed'
//import 'buefy/dist/buefy.css'
//import 'vuetify/dist/vuetify.css'

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

<!--<style src='bulma/css/bulma.min.css'></style>-->

<style lang="css">
/*$body-font-family: 'Asap Condensed';
$title-font: 'Asap Condensed';
@import '~vuetify/src/styles/settings/_variables.scss';
@import '~vuetify/src/styles/styles.sass';
*/
@import '~bulma/css/bulma.min.css';

.echorooms {
  font-family: "Asap Condensed", Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #000;
}
.v-dialog__content {
    font-family: "Asap Condensed", Arial, Helvetica, sans-serif !important;
}
.textroom { max-height: 300px !important }

*:focus {
    outline: none;
}

/* compoonent pparts */

.max-width { width: 640px; margin: 0 auto; max-width: 100%; }

.header { flex: 0 0 auto}
.headers { background: none; border-bottom: 1px solid black; padding:5px 5px; margin-bottom: 0.7rem !important}

.icons { vertical-align: middle; margin:0px 3px}
.linked { cursor:pointer}
.linked:hover { background: #eee; color: black}

.loading {
  -webkit-animation:spin 4s linear infinite;
  -moz-animation:spin 4s linear infinite;
  animation:spin 4s linear infinite;
}

@-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
@-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
@keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }

/* TRANSITIONS */
/*-------------------*/

.slide-fade-enter-active {
  transition: all 2.3s ease;
}
.slide-fade-leave-active {
  transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}


.fade-enter-active,
.fade-leave-active {
  transition-duration: 0.3s;
  transition-property: opacity;
  transition-timing-function: ease;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}



@media (max-width:461px) {
  .navbar { margin-bottom:0px}
}
</style>
