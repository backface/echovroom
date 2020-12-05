<template>
  <v-app id="app">
    {{ $route.embed }}
    <nav class="navbar is-transparent" role="navigation" aria-label="main navigation" v-if="!embed">

      <div class="navbar-brand">
        <router-link :to="{ path: '/' }" v-slot="{ href }">
          <a class="navbar-item" :href="href" title="home">
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
        <div class="navbar-item">
          <a @click="show_about=true" title="about">about</a>
        </div>
        <div class="navbar-item" v-if="calendar_src">
          <a @click="show_calendar=true" title="about">calendar</a>
        </div>
        <!--
        <router-link to="/about" v-slot="{ href, route, isActive }">
          <div class="navbar-item" :active="isActive"  :class="{'is-active':isActive}">
            <a :href="href" @click="menuOpen=false" title="about">?</a>
          </div>
        </router-link>
        -->
        <div class="navbar-end">
          <div class="navbar-item">
            <div class="dropdown is-hoverable is-right">
              <a title="Share" class="dropdown-trigger" aria-haspopup="true" aria-controls="dropdown-menu-url">
                  <share-2-icon size="1.5x" class="icons"></share-2-icon>
              </a>
              <div class="dropdown-menu" id="dropdown-menu-url" role="menu">
                <div class="dropdown-content">
                  <div class="dropdown-item"  style="white-space: nowrap;">
                    <span contenteditable ref="url" style="display:inline;line-height:1.5rem"> {{ url }}</span>
                    <a title="Copy to Clipboard" @click="copyURL" style="margin:0">
                      <clipboard-icon size="1.5x" class="icons"></clipboard-icon>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </nav>

    <div :class="embed ? '' : 'max-width'">
      <transition-page>
        <router-view :key="$route.path"></router-view>
      </transition-page>
    </div>

    <footer>
      <div class="has-text-centered">
        powered by ./<a href="/">echoVroom</a> &nbsp;
        <a href="https://github.com/backface/echovroom"><github-icon size="0.9x" class="icons linked"></github-icon></a>
      </div>
    </footer>

    <portal-target name="portalscreen"></portal-target>
    <portal-target name="topcontrols" class="topcontrols"></portal-target>

    <template>
      <v-dialog v-model="show_about" width="854px" >
        <v-card class="about">
          <template v-if="!about_src">
            <About />
          </template>
          <div v-else class="about" v-html="about_src"></div>
        </v-card>
      </v-dialog>
    </template>

    <template>
      <v-dialog v-model="show_calendar" width="854px" >
        <v-card class="about">
          <iframe :src="calendar_src"
            style="border:none;"
            allowfullscreen="true"
            scrolling="no" width="100%" height="400px" frameborder="0" align="middle">
          </iframe>
        </v-card>
      </v-dialog>
    </template>

    <div class="logo"></div>

  </v-app>
</template>

<script>
import TransitionPage from './components/TransitionPage.vue';
import About from './views/About.vue';
import { ArrowUpLeftIcon, Share2Icon, ClipboardIcon, GithubIcon } from 'vue-feather-icons'
import { PortalTarget } from 'portal-vue'
import 'typeface-asap-condensed'
import '@/styles/echovroom.css';

export default {
  name: 'App',

  components: {
    TransitionPage,
    ArrowUpLeftIcon, Share2Icon, ClipboardIcon, GithubIcon,
    PortalTarget, About,
  },

  data() {
    return {
      menuOpen: false,
      embed: false,
      url: "",
      calendar_src: null,
      about_src: null,
      show_about: false,
      show_calendar: false,
      default_favorites: ['echoraeume','demoroom'],
      shortcuts: [],
    }
  },

  mounted () {
    console.log('App mounted')
    if (this.$route.name == "embed")
      this.embed = true;
    this.url = document.location.href;
    this.loadSiteConfig();
  },

  destroyed () {
  },

  methods: {
    copyURL() {
      window.getSelection().selectAllChildren(this.$refs.url)
      document.execCommand('copy');
    },
    loadSiteConfig() {
      console.log("loading site config");
      fetch('vroom/site.json')
        .then(r => r.json())
        .then(json => {
          this.shortcuts = json.favorites;
        }).catch( () => {
          this.shortcuts = this.default_favorites;
          console.log("no valid site config found");
        })
    },
  }
}
</script>

<style lang="css">
</style>
