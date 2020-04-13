<template>
  <div class="echorooms">

    <Videoroom
      :room="777"
      v-if="nick"
      :nick="nick"
      is_muted="true"
    />

    <Audioroom
      v-if="nick"
      :room="777"
      :nick="nick"
    />

    <div class="columns  is-mobile headers is-gapless">
      <!--<div class="column is-1 has-text-left">
        <menu-icon size="1x" class="icons"></menu-icon>
      </div>-->
      <div class="column has-text-left">
        <message-square-icon size="1x" class="icons"></message-square-icon> Foyer ({{ foyer_count}})
      </div>
      <div class="column has-text-right">
        <minus-icon size="1x" class="icons" v-if="chat_open" @click="chat_open=false"></minus-icon>
        <plus-icon size="1x" class="icons" v-if="!chat_open" @click="chat_open=true"></plus-icon>
      </div>
    </div>

    <Textroom
      :room="777"
      @participantNumberChanged="foyer_count = $event"
      @hasNick="nick = $event;"
      @hasRoomInfo="foye_info = $event"
      @hasJanus="janus = $event;"
      :header="false"
      v-show="chat_open"
    />


  </div>
</template>

<script>
import Vue from 'vue';
import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
import Textroom from './Textroom.vue'
import Audioroom from './Audioroom.vue'
import Videoroom from './Videoroom.vue'
import { MessageSquareIcon,MinusIcon, PlusIcon } from 'vue-feather-icons'

Vue.use(Buefy);

export default {
  name: 'Echorooms',

  components: {
    Textroom, Audioroom, Videoroom,
    MessageSquareIcon,  MinusIcon, PlusIcon
  },

  props: {
    username: String
  },

  data() {
    return {
      foyer_count: 0,
      chat_open: false,
      nick: 0,
      janus: null,
    }
  },

  methods: {

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
    height:100%;
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

</style>
