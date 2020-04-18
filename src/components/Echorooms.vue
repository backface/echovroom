<template>
  <div class="echorooms">

    <Videoroom
      :roombyId="room"
      v-if="nick"
      :nick="nick"
      is_muted="true"
      :myJanus="janus"
      open="false"
    />

    <Audioroom
      v-if="nick"
      :roombyId="room"
      :nick="nick"
      :myJanus="janus"
    />

    <div class="columns  is-mobile headers is-gapless">
      <!--<div class="column is-1 has-text-left">
        <menu-icon size="1x" class="icons"></menu-icon>
      </div>-->
      <div class="column has-text-left">
        <message-square-icon size="1x" class="icons"></message-square-icon> Foyer ({{ foyer_count}})
      </div>
      <div class="column has-text-right">
        <minus-icon size="1x" class="icons linked" v-if="chat_open" @click="chat_open=false"></minus-icon>
        <plus-icon size="1x" class="icons linked" v-if="!chat_open" @click="chat_open=true"></plus-icon>
      </div>
    </div>

    <transition name="fade">
    <Textroom
      v-if="janusReady"
      :nick="login_name"
      :roombyId="room"
      @participantNumberChanged="foyer_count = $event"
      @hasNick="nick = $event;"
      @hasRoomInfo="foye_info = $event"
      @hasJanus="janus = $event"
      :myJanus="janus"
      :header="false"
      :internal_dialogs="true"
      open="true"
      v-show="chat_open"
    />
  </transition>

  </div>
</template>

<script>
import Vue from 'vue';
import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
import { janusMixin } from "@/mixins/janusMixin";
import Textroom from './Textroom.vue'
import Audioroom from './Audioroom.vue'
import Videoroom from './Videoroom.vue'
import { MessageSquareIcon,MinusIcon, PlusIcon } from 'vue-feather-icons'

Vue.use(Buefy);

export default {
  name: 'Echorooms',

  mixins: [janusMixin],

  components: {
    Textroom, Audioroom, Videoroom,
    MessageSquareIcon,  MinusIcon, PlusIcon
  },

  props: {},

  mounted() {
    this.loadConfig()
    if (typeof this.$route.query.username !=  undefined) {
      this.login_name = this.$route.query.username;
    }
  },

  data() {
    return {
      foyer_count: 0,
      chat_open: true,
      janusReady: false,
      loing_name: null
    }
  },

  methods: {
    attachPlugin() {
      console.log("janus is ready");
      this.janusReady = true
    }
  }

}
</script>

<style lang="scss">
@import "~bulma/sass/utilities/_all";
@import url('https://fonts.googleapis.com/css?family=Asap+Condensed');


// Set your colors
$primary: #666666;
$primary-invert: findColorInvert($primary);
$twitter: #4099FF;
$twitter-invert: findColorInvert($twitter);

// Setup $colors to use as bulma classes (e.g. 'is-twitter')
$colors: (
    "white": ($white, $black),
    "black": ($black, $white),
    "light": ($light, $light-invert),
    "dark": ($dark, $dark-invert),
    "primary": ($primary, $primary-invert),
    "info": ($info, $info-invert),
    "success": ($success, $success-invert),
    "warning": ($warning, $warning-invert),
    "danger": ($danger, $danger-invert),
    "twitter": ($twitter, $twitter-invert)
);

// Links
$link: $primary;
$link-invert: $primary-invert;
$link-focus-border: $primary;
$loading-background: rgba(200, 200, 200, 0.9);

// Import Bulma and Buefy styles
@import "~bulma";
@import "~buefy/src/scss/buefy";

.echorooms {
    position: relative;
    font-family: "Asap Condensed", Arial, Helvetica, sans-serif;
}

a { text-decoration: underline; color:black}
.item .column { padding:0.1rem }
.headers {
  background: none;
  border-bottom: 1px solid black;
  padding:5px 5px;
  margin-bottom: 0.7rem !important;
  opacity: 0.8;
}
.icons { vertical-align: middle; margin:0px 3px}
.linked { cursor:pointer}
.loading {
-webkit-animation:spin 4s linear infinite;
    -moz-animation:spin 4s linear infinite;
    animation:spin 4s linear infinite;
}
@-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
@-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
@keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }

.fade-enter {
  opacity: 0
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease-out;
}

.fade-leave-to {
  opacity: 0
}
</style>
