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

        <div class="navbar-start">
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
          &copy; 2020 ./<a href="https://www.foovixz.xyz">FOOVIZ.XYZ</a> ./<a href="https://m.ash.to">m.ash.to</a> -
      </div>
    </footer>


  </v-app>
</template>

<script>
import TransitionPage from './components/TransitionPage.vue';
import { ArrowUpLeftIcon, Share2Icon, ClipboardIcon } from 'vue-feather-icons'
import 'typeface-asap-condensed'

export default {
  name: 'App',

  components: {
    TransitionPage,
    ArrowUpLeftIcon, Share2Icon, ClipboardIcon
  },

  data() {
    return {
      menuOpen: false,
      embed: false,
      url: "",
    }
  },

  mounted () {
    console.log('App mounted')
    if (this.$route.name == "embed")
      this.embed = true;
    this.url = document.location.href;
  },

  destroyed () {
  },

  methods: {
    copyURL() {
      window.getSelection().selectAllChildren(this.$refs.url)
      document.execCommand('copy');
    }
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

:root {
	font-size: 100%;
	--color-bg: #fff;
	--color-fg: #666;
  --color-alert: red;
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

.stage { width: 640px; margin: 0 auto; max-width: 100%; margin-bottom:30px}


/* compoonent pparts */

.max-width { width: 640px; margin: 0 auto; max-width: 100%; }
.textroom { height: 300px}

.header { flex: 0 0 auto}
.headers { background: none; border-bottom: 1px solid var(--color-fg); padding:5px 5px; margin-bottom: 0.7rem !important}

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
  z-index: 30;
  padding:0px;
  font-size: .75em; line-height: 1.2em; background:#f9f9f9;padding:5px
}
footer a {color:#333 !important; text-decoration:underline}

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

.textroom { max-height:300px !important}

@media (max-width:461px) {
  .navbar { margin-bottom:10px}
  .echorooms { padding: 0 15px 0 10px;}
  .stage { padding: 0 5px 0 5px;}
}

</style>
