<template>
  <div class="main">
    <div class="stage" v-if="$route.name != 'embed'">
      <div class='embed-container'>
        <Stage />
      </div>
    </div>

    <div class="echorooms">

      <Videoroom
        :roombyName="roombyName"
        v-if="login_name  && showVroom"
        :nick="login_name"
        :is_muted="false"
        :login_password="password"
        :open="video_chat_open"
        :facetime="facetime"
        @leavingRoom="recreateVRoom"
        @muteChanged="muteChanged"
        :doMute="video_muted"
        :vr="vr"
      />

      <Videocall
        :roombyName="roombyName"
        v-if="login_name"
        :nick="login_name + '@' + roombyName"
        :is_muted="true"
        :callee="callee"
        @hangup="restoreVideoMuted"
        @takingCall="muteVideo"
      />

      <transition name="fade">
        <Textroom
          v-if="janusReady"
          v-show="chat_open"
          :open="true"
          :myJanus="janus"
          :roombyName="roombyName"
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
  </div>
</template>

<script>
import Stage from '@/components/Stage.vue'
import Textroom from '@/components/Textroom.vue'
import Videoroom from '@/components/Videoroom.vue'
import Videocall from '@/components/Videocall.vue'
import LoginDialog from '@/components/dialogs/LoginDialog'
import Toast from '@/components/dialogs/Toast'
import { janusMixin } from "@/mixins/janusMixin";

export default {
  name: 'Testing',

  mixins: [janusMixin],

  components: {
    Stage,
    Textroom,
    Videoroom,
    Videocall,
    LoginDialog, Toast
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
    }
  },

  mounted() {
    if (typeof this.$route.query.login !=  undefined) {
      this.login_name = this.$route.query.login;
    }
    if (typeof this.$route.query.password !=  undefined) {
      this.password = this.$route.query.password;
    }
    if (typeof this.$route.query.vr !=  undefined) {
      this.vr = this.$route.query.vr === 'true';
    }
    if (this.enterVR) this.vr = this.enterVR;
    this.loadConfig()
  },

  data() {
    return {
      chat_open: true,
      video_chat_open: true,
      janusReady: false,
      login_name: null,
      password: null,
      showVroom:true,
      vr:false,
      callee: "",
      video_muted:false,
      is_video_muted:false,
      video_was_muted:false,
    }
  },

  methods: {
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
    muteChanged(status) {
      console.log("mute changed", status);
      this.is_video_muted = status
    },
    muteVideo() {
      console.log("tell video to shut up");
      //this.video_muted = true;
      this.recreateVRoom()
    },
    restoreVideoMuted() {
      console.log("hung up");
      if (this.video_was_muted)  {
        console.log("video was muted");

      } else {

        console.log("video was not muted, turn it on again");
        this.video_muted = false;
      }
    }

  }

}
</script>

<style scoped>

</style>
