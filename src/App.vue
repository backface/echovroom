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
          <a @click="show_about=true" title="about">?</a>
        </div>
  <!--
        <router-link to="/about" v-slot="{ href, route, isActive }">
          <div class="navbar-item" :active="isActive"  :class="{'is-active':isActive}">
            <a :href="href" @click="menuOpen=false" title="about">?</a>
          </div>
        </router-link>

        <div class="navbar-start shortcuts">
          <router-link v-for="f in shortcuts" :key="f" :to="'/'+f" v-slot="{ href, route, isActive }">
            <div class="navbar-item" :active="isActive"  :class="{'is-active':isActive}">
              <a :href="href"  @click="menuOpen=false">#/
                <span v-if="f === 'lager'">archive</span>
                <span v-else>{{ f }}</span>
              </a>
            </div>
          </router-link>

        </div>

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
                    <a title="Copy to Clipboard" @click="copyURL">
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
          &copy; 2020 ./<a href="/">echoVroom</a> by ./<a href="https://m.ash.to">m.ash.to</a> /
          <a href="https://github.com/backface/echovroom"><github-icon size="0.9x" class="icons linked"></github-icon></a>
      </div>
    </footer>

    <portal-target name="portalscreen"></portal-target>
    <portal-target name="topcontrols" class="topcontrols"></portal-target>

  <template>
    <v-dialog v-model="show_about" width="854px" >
      <v-card class="about">
        <About />
      </v-card>
    </v-dialog>
  </template>

  </v-app>
</template>

<script>
import TransitionPage from './components/TransitionPage.vue';
import About from './views/About.vue';
import { ArrowUpLeftIcon, Share2Icon, ClipboardIcon, GithubIcon } from 'vue-feather-icons'
import 'typeface-asap-condensed'
import { PortalTarget } from 'portal-vue'

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

:root {
	--color-bg: white;
  --color-bg-trans: rgba(255,255,255, 0.7);
	--color-fg: #666;
  --color-alert: red;
  --color-bg-footer: #f9f9f9;
  --color-bg-nav: #ffffff;
  --color-a: #555;
  --color-a-hover:#000;
}


/*
.dark
  :root {
    --color-bg: #111;
    --color-bg-trans: rgba(0,0,0, 0.7);
    --color-fg: #eee;
    --color-alert: red;
    --color-bg-footer: #ddd;
    --color-bg-nav: #000;
    --color-a: #ddd;
    --color-a-hover:#fff;
  }
  img {filter:invert(0.93)}
  .navbar .navbar-brand a:hover {
    color:var(--color-bg);
    background:var(--color-fg);
  }
}
*/

#app {
  font-family: "Asap Condensed", Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--color-fg);
  background: var(--color-bg);
}

*:focus {
    outline: none;
}

/* navbar */
/* -------------------------- */

.navbar .navbar-item a,
.navbar .navbar-brand a {
  color:var(--color-a); text-decoration: none; text-transform: uppercase;
  background:var(--color-bg);
}
.navbar .navbar-brand a:hover,
.navbar .navbar-item a:hover {
  color:var(--color-a-hover);
  background:var(--color-bg);
}

a {color:var(--color-a)};
a:hover {color:var(--color-a-hover)};


.navbar .navbar-item.is-active a { font-weight:500; text-decoration: none; color:#333}
.navbar { margin-bottom:0px; background:var(--color-bg);}
.navbar-menu {
  background:var(--color-bg);
}

/* main set */
.embed-container { position: relative; padding:0; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;}
.embed-container iframe, .embed-container object, .embed-container embed, .embed-container div
  { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }


.header { flex: 0 0 auto; font-size: 0.9em}
.headers { background: none; border-bottom: 1px solid var(--color-fg); padding:5px 5px; margin-bottom: 0.5rem !important}

.participant_counter {  margin-left: 1em;}
.participant_counter .icons { vertical-align:text-top; margin:0px}


.icons { vertical-align: middle; margin:0px 3px}
.linked { cursor:pointer; }
.linked {color: var(--color-fg);}
.overlay .linked  {color: white;}
.linked:hover { opacity:0.8 }
svg.linked:hover {
  transform: scale(1.2);
}
.loading {
  -webkit-animation:spin 4s linear infinite;
  -moz-animation:spin 4s linear infinite;
  animation:spin 4s linear infinite;
}

footer {
 bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  z-index: 201;
  padding:0px;
  font-size: .75em; line-height: 1.2em; background:
  var(--color-bg-footer);
  ;padding:5px
}
footer a {color:var(--color-a) !important; text-decoration:underline}

.about {
  max-width: 100%;
  opacity: 0.9 !important;
}


@media (max-width:1440px) {
  .max-width {  }
}

@media (max-width:461px) {
  .navbar { margin-bottom:10px}
  .stageroom { padding: 0 15px 0 10px;}
}
/* .shortcuts { display: none !important } */
.textroom { max-height:300px !important}

@-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
@-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
@keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }


.loadingComponent {background:var(--color-bg) !important; opacity: 0.7}
.linked { cursor:pointer; color: var(--color-fg)}

v-text-field:not(.v-input--has-state):hover > .v-input__control > .v-input__slot:before,
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
}
.v-input input::placeholder, .v-input textarea::placeholder,
.theme--light.v-input input::placeholder, .theme--light.v-input textarea::placeholder {
  opacity: 0.7;
}

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
