<template>
  <div class="main">


    <div class="echovrooms">

      <VideoMixer
        :roombyName="roombyName"
        v-if="login_name  && showVroom && janusReady"
        :nick="login_name"
        :is_muted="video_chat_muted"
        :login_password="password"
        :open="video_chat_open"
        :host="server"
        @leavingRoom="recreateVRoom"
        :publish="publish"
      />

      <transition name="fade">
        <Textroom
          v-if="janusReady"
          v-show="chat_open"
          :open="chat_open"
          :autologin="chat_open && login_name!=''"
          :active="false"
          :roombyName="roombyName"
          :host="server"
          :nick="login_name"
          :emitCallEvents="true"
          :login_password="password"
          @hasNick="login_name = $event;"
          @hasPassword="password = $event;"
          @hasRoomInfo="foyer_info = $event"
          @hasJanus="janus = $event"
        />
      </transition>

    </div>

    <toast ref="toast"></toast>
    <login-dialog ref="login"></login-dialog>
  </div>
</template>

<script>
import Textroom from '@/components/Textroom.vue'
import VideoMixer from '@/components/VideoMixer.vue'
import LoginDialog from '@/components/dialogs/LoginDialog'
import Toast from '@/components/dialogs/Toast'
//import { PortalTarget } from 'portal-vue'
//import { janusMixin } from "@/mixins/janusMixin";

export default {
  name: 'Mixer',

  components: {
    Textroom, VideoMixer,
    LoginDialog, Toast,
  },

  props: {
    embed:  {
      type: Boolean,
      default: false
    },
    roombyName: {
      type: String,
      default: ""
    },
  },

  mounted() {

    console.log("screen size is ", window.screen.width, window.screen.height);
    console.log("device ratio is ",  window.devicePixelRatio);
    console.log("screen size with ratio is", window.screen.width * window.devicePixelRatio, window.screen.height * window.devicePixelRatio);


    if (this.$route.query.login !=  undefined) {
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

    if (typeof this.$route.query.publish !=  undefined) {
      this.publish = this.$route.query.publish != "false";
    }

    this.loadRoomConfig()

  },

  data() {
    return {
      chat_open: false,
      video_chat_open: true,
      video_chat_muted: true,
      janusReady: false,
      login_name: "mx",
      password: null,
      showVroom:true,
      title:this.roombyName,
      publish:false,
      stage:"",
      server: [
        //"wss://" +  window.location.hostname + "/ws/janus",
        // window.location.protocol + "//" +  window.location.hostname + "/janus",
         "wss://" +  window.location.hostname + ":8989/janus",
          window.location.protocol + "//" +  window.location.hostname + ":8089/janus",
       ],
      iceServer: [
        {"urls": "stun:" + window.location.hostname },
        {"urls": "turn:" + window.location.hostname, "username": "turn", "credential": "hinterseer"}
      ],
      hasStreaming: false,
      delayed_login: false // crude HACK!!
    }
  },

  methods: {

    loadRoomConfig() {
      if (window.location.protocol === "http:") {
        console.log("protocol ist http - assume local dev",);
        this.server = [
            window.location.protocol + "//" +  window.location.hostname + ":8088/janus",
         ]
      }
      fetch('vroom/' + this.roombyName + '.json')
        .then(r => r.json())
        .then(json => {
          console.log("loading vroom configs: vroom/" + this.roombyName + ".json");
          if (json.server) this.server = json.server;
          if (json.iceServers) this.iceServers = json.iceServers;
          this.attach()
        }).catch( () => {
          console.log("no valid room config found");
          this.attach()
        })
    },

    loginFromParam() {
      this.chat_open = true;
      this.video_chat_open = true;
      this.janusReady = true;
    },

    attachPlugin() {
      console.log("janus is ready");
      this.janusReady = true
    },

    attach() {

      this.chat_open = true;
      this.video_chat_open = true;
      this.janusReady = true;
      //setTimeout( () => {self.delayed_login = true})
    },

    recreateVRoom() {
      // this is a hack but we completely remove the component to fore recreating a new janus sesssion
      let self = this
      this.showVroom = false;
      this.video_chat_open = false;
      setTimeout( () => {self.showVroom = true}, 700)
    },

  }
}
</script>

<style scoped>

.main {}
.main { margin-bottom:100px }
.stage { width: 1024px; margin: 0 auto; max-width: 100%; margin-bottom:30px}

/* compoonent pparts */

.max-width { width: 1024px; margin: auto auto; max-width: 100%;}

.echovrooms {
	position: fixed;
	width: 1280px; max-width: 100%;
	bottom: 10px;
	background: var(--color-bg-trans);
  color: var(--color-fg);
	left: 50%;
	transform: translate(-50%,0);
	border: 1px solid #999;
	box-shadow: 10px 6px 12px rgba(0,0,0,0.25);
	border-radius: 3px;
  padding: 5px 10px;
  z-index:200;
}

.textroom  { max-height:600px}
.textroom .chatroom { height:180px}

.topcontrols {
  position: fixed;
  top:-2px; left:50%;
  transform:translate(-50%,0);
  border: 1px solid #999;
  background: var(--color-bg-trans);
  box-shadow: 10px 6px 12px rgba(0,0,0,0.25);
  border-radius: 3px;
  z-index:200;
  width:400px; max-width:75%;
}

.topcontrols .headers {border:0; padding-bottom: 0}

@media (max-width:1440px) {
  .max-width { width:800px }
  .echovrooms { width:1024px }
}

@media (max-width:1280px) {
  .max-width { width:800px }
  .echovrooms { width:1024px }
}

@media (max-width:1024px) {
  .max-width { width:640px }
  .echovrooms { width:800px;}
}

@media (max-width:461px) {
  .max-width { width:640px }
  .topcontrols { width:250px;}
}


</style>
