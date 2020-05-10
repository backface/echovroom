<template>
  <v-app>
    <Echorooms :is_component="true" videoResolution="videoResolution"/>
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

  props: {
    videoResolution:  {
      type: String,
      default: "low-res"
    },
  },

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
@import '~vuetify/dist/vuetify.css';
@import '~bulma/css/bulma.min.css';
@import '~perfect-scrollbar/css/perfect-scrollbar.css';

.ps-container {
  position: relative;
}

:root {
	font-size: 100%;
	--color-bg: #ff5d5d;
	--color-fg: #fff;
  --color-alert: #00dd00;
  --invert-colors: 0%;
}

.echorooms {
  text-align: center;
  font-size: calc(var(--font-size) * 0.8);
}

.textroom { height: 450px }

*:focus {
    outline: none;
}

.enter {
  color: var(--color-fg) !important;
  border-color: var(--color-fg) !important;
  font-size: 100%;
  font-family: var(--font-body);
}

.enter:hover {
   color: var(--color-bg) !important;
   background-color: var(--color-fg) !important;
}

/* compoonent pparts */

.max-width { width: 640px; margin: 0 auto; max-width: 100%; }

.header { flex: 0 0 auto}
.headers { background: none; border-bottom: 1px solid var(--color-fg); padding:5px 5px; margin-bottom: 0.7rem !important}
.loadingComponent {background:var(--color-bg) !important; opacity: 0.7}
.icons { vertical-align: middle; margin:0px 3px}
.linked { cursor:pointer; color: var(--color-fg)}
.linked:hover { opacity:0.8 }
.overlay .linked  {color: white;}
svg.linked:hover {
  transform: scale(1.2);
}

.participants ul { padding-left: 8px; }

.participants {
  -webkit-filter: invert(var(--invert-colors));
  filter: invert(var(--invert-colors));
}

.me { width:auto !important; margin-right:0px !important; }

.v-text-field:not(.v-input--has-state):hover > .v-input__control > .v-input__slot:before,
.theme--light.v-text-field:not(.v-input--has-state):hover > .v-input__control > .v-input__slot::before,
.theme--light.v-text-field > .v-input__control > .v-input__slot::before,
.theme--light.v-input, .theme--light.v-input input, .theme--light.v-input textarea,
.v-input, .v-input input, .v-input textarea,
.v-input input::placeholder, .v-input textarea::placeholder,
.theme--light.v-input input::placeholder, .theme--light.v-input textarea::placeholder,
.v-text-field > .v-input__control > .v-input__slot:after,
.v-text-field > .v-input__control > .v-input__slot::before {
  border-color: var(--color-fg);
  color: var(--color-fg);
  font-size:100%;
  font-family: var(--font-body);
}
.v-input input::placeholder, .v-input textarea::placeholder,
.theme--light.v-input input::placeholder, .theme--light.v-input textarea::placeholder {
  opacity: 0.7;
}



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

.fade-enter-active,
.fade-leave-active {
  transition-duration: 0.3s;
  transition-property: opacity;
  transition-timing-function: ease;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}


</style>
