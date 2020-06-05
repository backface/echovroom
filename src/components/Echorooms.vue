<template>
  <div class="echorooms">

    <Videoroom
      :roombyId="room"
      v-if="nick && showVroom"
      :nick="nick"
      :is_muted="true"
      :open="video_chat_open"
      :allowFacetime="false"
      :allowScreenshare="false"
      :allowStageSends="false"
      :allowSettings="false"
      :allowUnpublish="false"
      :allowRTPforward="false"
      :showRoomInfo="false"
      :showBitrates="false"
      videoResolution="videoResolution"
      @leftRoom="recreateVRoom"
      @opened="video_chat_open = false; show_video_login = false"
    />

    <template v-if="is_component">
      <button @click="enterVideoroom" v-if="show_video_login && nick  && showVroom && !video_chat_open" class="button is-white is-inverted is-outlined enter">JOIN VIDEO CHAT</button>
    </template>
    <template v-else>
      <v-btn @click="enterVideoroom" v-if="show_video_login && nick && showVroom && !video_chat_open" class="enter">JOIN VIDEO CHAT</v-btn>
    </template>

    <Videocall
      roombyName="echoræume"
      v-if="nick"
      :nick="nick + '@echoræume'"
      :is_muted="true"
      :callee="callee"
      @takingCall="recreateVRoom"
    />

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
        :emitCallEvents="true"
        @call="handleCall"
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
import Videocall from '@/components/Videocall.vue'
import LoginDialog from '@/components/dialogs/LoginDialog'
import AlertDialog from '@/components/dialogs/AlertDialog'
import Toast from '@/components/dialogs/Toast'

export default {
  name: 'Echorooms',

  mixins: [janusMixin],

  components: {
    Textroom, Videoroom, Videocall,
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
      callee:"",
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
      if (!this.video_chat_open)
        this.show_video_login = true
    },
    enterVideoroom() {
      this.video_chat_open = true;
      this.show_video_login = false;
      setTimeout( () => {self.video_chat_open = false; }, 1000)
    },
    handleCall(callee) {
      this.callee = callee + "@echoræume";
      setTimeout( () => {this.callee = ""}, 700)
    }
  }

}
</script>

<style lang="css" scoped>
.enter { margin: 10px 0px 20px 0px; opacity: 0.8}
</style>
