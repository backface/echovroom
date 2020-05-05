<template>
  <v-app id="app">
    {{ $route.embed }}
    <nav class="navbar" role="navigation" aria-label="main navigation" v-if="!embed">

      <div class="navbar-brand">
        <router-link :to="{ path: '/' }" v-slot="{ href }">
          <a class="navbar-item" :href="href">
              <arrow-up-left-icon size="1.5x" class="custom-class"></arrow-up-left-icon>
          </a>
        </router-link>
        <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false"
          :class="{'is-active':menuOpen}"
          @click="menuOpen = !menuOpen">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div class="navbar-menu" :class="{'is-active':menuOpen}">
        <router-link to="/echoraeume" v-slot="{ href, route, isActive }">
          <div class="navbar-item" :active="isActive" :class="{'is-active':isActive}">
            <a :href="href" >{{ route.name }}</a>
          </div>
        </router-link>
        <router-link to="/demoroom" v-slot="{ href, route, isActive }">
          <div class="navbar-item" :active="isActive"  :class="{'is-active':isActive}">
            <a :href="href" >{{ route.name }}</a>
          </div>
        </router-link>
      </div>

    </nav>

    <div :class="embed ? '' : 'max-width'">
      <transition-page>
        <router-view :key="$route.path"></router-view>
      </transition-page>
    </div>
  </v-app>
</template>

<script>
import TransitionPage from './components/TransitionPage.vue';
import { ArrowUpLeftIcon } from 'vue-feather-icons'
import 'typeface-asap-condensed'

export default {
  name: 'App',

  components: {
    TransitionPage,
    ArrowUpLeftIcon
  },

  data() {
    return {
      menuOpen: false,
      embed: false,
    }
  },

  mounted () {
    console.log('App mounted')
    if (this.$route.name == "embed")
      this.embed = true;
  },

  destroyed () {
  },

  methods: {
  }

}
</script>

<style lang="css">

#app {
  font-family: "Asap Condensed", Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #666;
}


*:focus {
    outline: none;
}

/* navbar */
/* -------------------------- */

.navbar .navbar-item a,
.navbar .navbar-brand a {
  color: #666; text-decoration: none; text-transform: uppercase
}
.navbar .navbar-item a:hover,
.navbar .navbar-brand a:hover {
  color: #000;
}
.navbar .navbar-item.is-active a { font-weight:500; text-decoration: none; color:#333}
.navbar { margin-bottom:60px}


/* main set */
.embed-container { position: relative; padding:0; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;}
.embed-container iframe, .embed-container object, .embed-container embed, .embed-container div
  { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

.stage { width: 640px; margin: 0 auto; max-width: 100%; margin-bottom:20px}


/* compoonent pparts */

.max-width { width: 640px; margin: 0 auto; max-width: 100%; }
.textroom { height: 300px}

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
