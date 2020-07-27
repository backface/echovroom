<template>
  <div class="echo">
    <div class="stage">
      <div class='embed-container'>
        <Streaming />
      </div>
    </div>
    <div class="echorooms">
      <Videoroom
        roombyName="demoroom"
        v-if="login_name  && showVroom"
        :nick="login_name"
        :is_muted="true"
        :open="video_chat_open"
        :facetime="facetime"
        @leftRoom="recreateVRoom"
        :vr="vr"
      />

      <Audioroom
        v-if="login_name"
        roombyName="demoroom"
        :nick="login_name"
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
          :open="true"
          :myJanus="janus"
          roombyName="demoroom"
          :nick="login_name"
          @participantNumberChanged="foyer_count = $event"
          @hasNick="login_name = $event;"
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
import Streaming from '@/components/Streaming.vue'
import Textroom from '@/components/Textroom.vue'
import Audioroom from '@/components/Audioroom.vue'
import Videoroom from '@/components/Videoroom.vue'
import Videocall from '@/components/Videocall.vue'
import LoginDialog from '@/components/dialogs/LoginDialog'
import Toast from '@/components/dialogs/Toast'
import { janusMixin } from "@/mixins/janusMixin";

export default {
  name: 'Demoroom',

  mixins: [janusMixin],

  components: {
    Streaming,
    Textroom, Audioroom, Videoroom,
    Videocall,
    LoginDialog, Toast
  },

  props: {
    facetime:  {
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
    if (typeof this.$route.query.vr !=  undefined) {
      this.vr = this.$route.query.vr === 'true';
    }
    this.loadConfig()
  },

  data() {
    return {
      foyer_count: 0,
      chat_open: true,
      video_chat_open: true,
      janusReady: false,
      login_name: null,
      showVroom:true,
      vr:false,
      callee:"",
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
      setTimeout( () => {self.showVroom = true}, 500)
    },
    handleCall(callee) {
      console.log(callee);
      this.callee = callee + "@" + this.roombyName;
      setTimeout( () => {this.callee = ""}, 700)
    },
  }

}
</script>

<style lang="css" scoped>

</style>
