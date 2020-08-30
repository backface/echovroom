<template>
  <div class="main">
    <div class="stage" v-if="$route.name != 'embed'">
      <div class='embed-container'>
        <Streaming
          :roombyName="roombyName"
          v-if="hasStreaming && !enterVR"
        />
        <Stage
          v-else
          :roombyName="roombyName"
        />
      </div>
    </div>

    <div class="echorooms">

      <v-btn @click="preLogin" v-if="!chat_open" class="enter">Join the Conversation</v-btn>

      <Videoroom
        :roombyName="roombyName"
        v-if="login_name  && showVroom"
        :nick="login_name"
        :is_muted="video_chat_muted"
        :login_password="password"
        :open="video_chat_open"
        :host="server"
        :facetime="facetime"
        :betaOptions="beta"
        :advancedOptions="advanced"
        @leavingRoom="recreateVRoom"
        :emitCallEvents="true"
        @call="handleCall"
        :vr="vr"
      />

      <Videocall
        :roombyName="roombyName"
        v-if="login_name"
        :nick="login_name + '@' + roombyName"
        :is_muted="true"
        :callee="callee"
        @takingCall="recreateVRoom"
      />

      <transition name="fade">
        <Textroom
          v-if="janusReady"
          v-show="chat_open"
          :open="chat_open"
          :myJanus="janus"
          :roombyName="roombyName"
          :host="server"
          :nick="login_name"
          :login_password="password"
          @hasNick="login_name = $event;"
          @hasPassword="password = $event;"
          @hasRoomInfo="foyer_info = $event"
          @hasJanus="janus = $event"
          :emitCallEvents="true"
          @call="handleCall"
        />
      </transition>

    </div>

    <toast ref="toast"></toast>
    <login-dialog ref="login"></login-dialog>
    <pre-login-dialog ref="prelogin"></pre-login-dialog>
  </div>
</template>

<script>
import Stage from '@/components/Stage.vue'
import Textroom from '@/components/Textroom.vue'
import Videoroom from '@/components/Videoroom.vue'
import Videocall from '@/components/Videocall.vue'
import Streaming from '@/components/Streaming.vue'
import LoginDialog from '@/components/dialogs/LoginDialog'
import PreLoginDialog from '@/components/dialogs/PreLoginDialog'

import Toast from '@/components/dialogs/Toast'
import { janusMixin } from "@/mixins/janusMixin";

export default {
  name: 'App',

  mixins: [janusMixin],

  components: {
    Stage,
    Textroom, Videoroom, Videocall,
    Streaming,
    LoginDialog, PreLoginDialog, Toast
  },

  props: {
    facetime:  {
      type: Boolean,
      default: false
    },
    enterVR:  {
      type: Boolean,
      default: false
    },
    embed:  {
      type: Boolean,
      default: false
    },
    hasStreaming:  {
      type: Boolean,
      default: true,
    }
  },

  mounted() {
    if (typeof this.$route.query.login !=  undefined) {
      this.login_name = this.$route.query.login;
    }
    if (typeof this.$route.query.password !=  undefined) {
      this.password = this.$route.query.password;
    }
    if (typeof this.$route.query.beta !=  undefined) {
      this.beta = this.$route.query.beta === 'true';
    }
    if (typeof this.$route.query.adv !=  undefined) {
      this.advanced = this.$route.query.adv === 'true';
    }
    if (typeof this.$route.query.vr !=  undefined) {
      this.vr = this.$route.query.vr === 'true';
    }
    if (this.enterVR)
      this.vr = this.enterVR;

    this.loadRoomConfig()
    this.loadConfig()

  },

  data() {
    return {
      chat_open: true,
      video_chat_open: true,
      video_chat_muted: true,
      janusReady: false,
      login_name: null,
      password: null,
      showVroom:true,
      vr:false,
      callee: "",
      beta:false,
      advanced:false,
    }
  },

  methods: {

    loadRoomConfig() {
      console.log("loading room config");
      fetch('vroom/' + this.roombyName + '.json')
        .then(r => r.json())
        .then(json => {
          console.log("loading vroom configs: vroom/" + this.roombyName + ".json");
          this.chat_open = json.autologin;
          this.video_chat_open = json.autologin;
          if (json.server) this.server = json.server;
          if (json.iceServers) this.iceServers = json.iceServers;
        }).catch( () => {
          console.log("no valid room config found");
        })
    },

    attachPlugin() {
      console.log("janus is ready");
      this.janusReady = true
    },

    recreateVRoom() {
      // this is a hack but we completely remove the component to fore recreating a new janus sesssion
      let self = this
      this.showVroom = false;
      this.video_chat_open = false;
      setTimeout( () => {self.showVroom = true}, 700)
    },

    handleCall(callee) {
      console.log(callee);
      this.callee = callee + "@" + this.roombyName;
      setTimeout( () => {this.callee = ""}, 700)
    },

    preLogin() {
      let self =this;
      self.$refs.prelogin.open("Join the chat system!", {
      } ).then((r) => {
        if (r) {
          self.video_chat_open = r.login_videochat;
          self.video_chat_muted = r.login_muted;
          self.chat_open= true;
        }
      })

    }
  }

}
</script>

<style scoped>
.main {}
.main { margin-bottom:100px }
</style>
