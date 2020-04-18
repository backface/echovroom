<template>
  <div id="app">
    <b-navbar>
        <template slot="brand">
            <b-navbar-item tag="router-link" :to="{ path: '/' }">
              <arrow-up-left-icon size="1.5x" class="custom-class"></arrow-up-left-icon>
            </b-navbar-item>
        </template>

        <template slot="start">
        <!--
          <router-link to="/about" v-slot="{ href, route, isActive }">
            <b-navbar-item :href="href"  :active="isActive">
              About {{ route.query.user }}
            </b-navbar-item>
          </router-link>
        -->
          <router-link to="/echoraeume" v-slot="{ href, route, isActive }">
            <b-navbar-item :href="href"  :active="isActive">
              {{ route.name }}
            </b-navbar-item>
          </router-link>

          <router-link to="/demoroom" v-slot="{ href, route, isActive }">
            <b-navbar-item :href="href"  :active="isActive">
              {{ route.name }}
            </b-navbar-item>
          </router-link>

        </template>

    </b-navbar>



    <transition-page>
      <router-view :key="$route.path"></router-view>
    </transition-page>

  </div>
</template>

<script>
import TransitionPage from './components/TransitionPage.vue';
import { ArrowUpLeftIcon } from 'vue-feather-icons'

export default {
  name: 'App',

  components: {
    TransitionPage,
    ArrowUpLeftIcon
  },

  data() {
    return {
    }
  },

  mounted () {
    console.log('App mounted')
  },

  destroyed () {
  },

  methods: {
  }

}
</script>

<style >

#app {
  font-family: "Asap Condensed", Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.navbar-menu .navbar-item { text-decoration: none; text-transform: uppercase}
.navbar-menu .navbar-item.is-active { font-weight:bold; text-decoration: none}
.navbar {}

.embed-container { position: relative; padding:0; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;}
.embed-container iframe, .embed-container object, .embed-container embed, .embed-container div
  { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

.stage { width: 640px; margin: 0 auto; max-width: 100%; }
.echorooms { width: 640px; height:300px; margin: 20px auto;  max-width: 95%; }

/* Enter and leave animations can use different */
/* durations and timing functions.              */
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


</style>
