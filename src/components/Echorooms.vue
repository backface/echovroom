<template>
  <div class="echorooms">

    <Videoroom
      :roombyId="room"
      v-if="nick && showVroom"
      :nick="nick"
      :is_muted="true"
      :open="video_chat_open"
      :allowFacetime="true"
      :allowStageSends="false"
      :allowSettings="false"
      :showRoomInfo="false"
      videoResolution="videoResolution"
      @leftRoom="recreateVRoom"
      @opened="video_chat_open = false; show_video_login = false"
    />

    <template v-if="is_component">
      <button @click="enterVideoroom" v-if="show_video_login && nick" class="button is-white is-inverted is-outlined enter">JOIN VIDEO CHAT</button>
    </template>
    <template v-else>
      <v-btn @click="enterVideoroom" v-if="show_video_login && nick" class="enter">JOIN VIDEO CHAT</v-btn>
    </template>

    <transition name="fade">

      <Textroom
        v-if="janusReady"
        :roombyId="room"
        @participantNumberChanged="foyer_count = $event"
        @hasNick="nick = $event;"
        @hasRoomInfo="foye_info = $event"
        @hasJanus="janus = $event"
        :myJanus="janus"
        :showRoomInfo="false"
        :open="chat_open"
      />
    </transition>

    <template v-if="is_component">
      <button @click="chat_open = true" v-if="!chat_open" class="button is-danger is-white is-outlined enter">ENTER CHAT</button>
    </template>
    <template v-else>
      <v-btn @click="chat_open = true" v-if="!chat_open" class="enter">ENTER CHAT</v-btn>
    </template>

  <toast ref="toast"></toast>
  <login-dialog ref="login"></login-dialog>
  <alert-dialog ref="alert"></alert-dialog>

  </div>

</template>

<script>

import { janusMixin } from "@/mixins/janusMixin";
import Textroom from './Textroom.vue'
import Videoroom from './Videoroom.vue'
import LoginDialog from '@/components/dialogs/LoginDialog'
import AlertDialog from '@/components/dialogs/AlertDialog'
import Toast from '@/components/dialogs/Toast'

export default {
  name: 'Echorooms',

  mixins: [janusMixin],

  components: {
    Textroom, Videoroom,
    LoginDialog, AlertDialog, Toast
  },

  props: {
    is_component:  {
      type: Boolean,
      default: false
    },
    videoResolution:  {
      type: String,
      default: "low-res"
    },

  },

  mounted() {
    this.loadConfig()
  },

  data() {
    return {
      foyer_count: 0,
      chat_open: false,
      video_chat_open: false,
      show_video_login: true,
      janusReady: false,
      showVroom: true,
    }
  },

  methods: {
    attachPlugin() {
      console.log("janus is ready");
      this.janusReady = true
    },
    recreateVRoom() {
      let self = this
      this.showVroom = false;
      setTimeout( () => {self.showVroom = true; }, 500)
      setTimeout( () => {self.video_chat_open = false; }, 1000)
      if (!this.video_chat_open)
        this.show_video_login = false
    },
    enterVideoroom() {
      this.video_chat_open = true;
      this.show_video_login = false;
      this.recreateVRoom();

    }
  }

}
</script>

<style lang="css" scoped>
.textroomwrapper { height:300px}
.enter { margin: 10px 0px 20px 0px; opacity: 0.8}
</style>
