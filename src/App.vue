<template>
  <v-app id="app">
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

      <div class="navbar-menu" :class="{'is-active':menuOpen}" >
        <div class="navbar-item" v-if="!no_about">
          <a @click="show_about=true" title="about">about</a>
        </div>

        <template v-if="nav">
          <div class="navbar-item" v-for="item in nav" :key="item.name">
            <a v-if="item.link" :href="item.link" :title="item.name" target="_blank">{{ item.name }}</a>
            <a v-else @click="item.show=true" :title="item.name" :class="{ active: item.show }">{{ item.name }}</a>
            &nbsp;
          </div>
        </template>


        <div class="navbar-item" v-if="tipjar_src">
          <a :href="tipjar_src" title="tip jar">tip jar</a>
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

    <footer v-if="!present">
      <div class="has-text-centered">
        powered by ./<a href="https://echovroom.live">echoVroom</a> &nbsp;
        <a href="https://github.com/backface/echovroom"><github-icon size="0.9x" class="icons linked"></github-icon></a>
      </div>
    </footer>

    <portal-target name="portalscreen"></portal-target>
    <portal-target name="topcontrols" class="topcontrols" v-if="!present && !textonly"></portal-target>

    <template>
      <v-dialog v-model="show_about" width="854px" >
        <v-card class="about">
          <About />
        </v-card>
      </v-dialog>
    </template>

    <template v-for="item in nav">
      <v-dialog v-model="item.show" :key="item.name" width="854px" v-if="item.content" >
        <v-card class="about">
          <div class="about" v-html="item.content"></div>
        </v-card>
      </v-dialog>
    </template>

    <div class="logo" v-if="!present"></div>

  </v-app>
</template>

<script>
import TransitionPage from './components/TransitionPage.vue';
import About from './views/About.vue';
import { ArrowUpLeftIcon, Share2Icon, ClipboardIcon, GithubIcon } from 'vue-feather-icons'
import { PortalTarget } from 'portal-vue'
import { event_bus } from '@/main'
import 'typeface-asap-condensed'
import '@/styles/buefy.css'

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
      present: false,
      textonly: false,
      url: "",
      no_about: false,
      show_about: false,
      shortcuts: [],
      nav: [],
      tipjar_src: null,
    }
  },


  beforeMount() {
    if (process.env.VUE_APP_THEME  && process.env.VUE_APP_THEME != 'default') {
      this.loadTheme(process.env.VUE_APP_THEME);
    }
    event_bus.$on('loadTheme', (data) => {
      this.loadTheme(data);
    })
  },

  mounted () {
    if (this.$route.name == "embed" || this.$route.name == "text")
      this.embed = true;
    if (this.$route.name == "text")
      this.textonly = true;
    if (this.$route.name == "present")
      this.present = true;
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
    loadTheme(theme) {
      let link = document.getElementById("themestyle")
      if (link != null) {
        link.href =  "/vroom/themes/" + theme + ".css"
      }  else {
        link = document.createElement('link');
        //style.id ="themestyle";
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href =  "/vroom/themes/" + theme + ".css"
        document.head.append(link)
      }
      if (theme == 'dark') {
        this.$vuetify.theme.dark = true;
      } else if (theme == 'echoraeume') {
        this.$vuetify.theme.themes.dark.primary = "#ac3f3f";
        this.$vuetify.theme.dark = true;

      } else if (theme == 'porgy') {
        this.$vuetify.theme.themes.dark.primary = "#FFCC00";
        this.$vuetify.theme.dark = true;

      } else {
        //this.$vuetify.theme.dark = false;
      }
    }
  }
}
</script>

<style lang="css">
@import './styles/echovroom.css';
</style>
