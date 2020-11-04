<template>
  <div class="main">
    <div class="room_details">
      <span v-if="title" class="title">{{ title }}</span>
      <span v-if="subtitle" class="room_subtitle">{{ subtitle }}</span>
      <span v-if="info_link">&raquo; </span><a target="_blank" :href="info_link" v-if="info_link">read more ...</a>
      <span v-if="schedule_link">&raquo; </span><a target="_blank" :href="schedule_link" v-if="schedule_link">schedule</a>
    </div>

    <div class="stage" v-if="$route.name != 'embed'">
      <div class='embed-container'>
        <Streaming
          :roombyName="roombyName"
          v-if="hasStreaming && !enterVR"
        />
        <Stage
          v-else
          :roombyName="roombyName"
          :src="stage"
        />
      </div>
    </div>

    <v-btn @click="preLogin" v-if="!chat_open" class="enter">Join the Conversation</v-btn>

    <div class="echovrooms">

      <Videoroom
        :roombyName="roombyName"
        v-if="login_name  && showVroom && janusReady"
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
        :publish="publish"
      />

      <Videocall
        :roombyName="roombyName"
        v-if="login_name && janusReady"
        :nick="login_name + '@' + roombyName"
        :is_muted="true"
        :host="server"
        :callee="callee"
        @takingCall="recreateVRoom"
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
//import { PortalTarget } from 'portal-vue'
//import { janusMixin } from "@/mixins/janusMixin";

export default {
  name: 'App',

  //mixins: [janusMixin],

  components: {
    Stage,
    Textroom, Videoroom, Videocall,Streaming,
    LoginDialog, PreLoginDialog, Toast,
    //PortalTarget,
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
    withStreaming:  {
      type: Boolean,
      default: true,
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

    if (typeof this.$route.query.publish !=  undefined) {
      this.publish = this.$route.query.publish != "false";
    }

    // vr stuff - is it still needed
    if (typeof this.$route.query.vr !=  undefined) {
      this.vr = this.$route.query.vr === 'true';
    }
    if (this.enterVR)
      this.vr = this.enterVR;

    this.loadRoomConfig()


  },

  data() {
    return {
      chat_open: false,
      video_chat_open: true,
      video_chat_muted: false,
      janusReady: false,
      login_name: null,
      password: null,
      showVroom:true,
      vr:false,
      callee: "",
      beta:false,
      advanced:false,
      title:this.roombyName,
      subtitle:"",
      info_link:"",
      schedule_link:"",
      publish:true,
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
          if (json.info_link) this.info_link = json.info_link;
          if (json.schedule_link) this.schedule_link = json.schedule_link;
          if (json.title) this.title = json.title;
          if (json.subtitle) this.subtitle = json.subtitle;
          if (json.stage) {
            this.hasStreaming = false;
            this.stage = json.stage;
          } else {
            this.hasStreaming = this.withStreaming;
          }
          if ('autologin' in json && !this.login_name)
          {
            //this.chat_open = json.autologin;
            //this.video_chat_open = json.autologin;
            this.preLogin()
          }
          this.attach()
        }).catch( () => {
          console.log("no valid room config found");
          this.hasStreaming = this.withStreaming;
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
      let self = this;
      if (this.login_name) {
        this.chat_open = true;
        this.video_chat_open = true;
      }
      this.janusReady = true;
      setTimeout( () => {self.delayed_login = true})
    },

    recreateVRoom() {
      // this is a hack but we completely remove the component to fore recreating a new janus sesssion
      let self = this
      this.showVroom = false;
      this.video_chat_open = false;
      setTimeout( () => {self.showVroom = true}, 700)
    },

    handleCall(callee) {
      this.callee = callee + "@" + this.roombyName;
      setTimeout( () => {this.callee = ""}, 700)
    },

    preLogin() {
      let self =this;
      if (this.publish) {
        self.$refs.prelogin.open("Join the chat system!", {
        } ).then((r) => {
          if (r) {
            self.video_chat_open = r.login_videochat;
            self.video_chat_muted = r.login_muted;
            self.chat_open= true;
            self.janusReady = true;
          }
        })
      } else {
        this.chat_open = true;
        this.video_chat_open = true;
        self.janusReady = true;
      }
    }
  }
}
</script>

<style>

.main {}
.main { margin-bottom:100px }
.title { padding-bottom:0; margin-bottom:0.2rem; background:#333;color:#fff; padding:1px 10px 3px 10px}
.room_details {margin-bottom:0.9rem; font-size:0.8em}
.room_details a { color:#999}
.room_details a:hover { color:black}
.room_details a:not(:last-child) { margin-right:12px}
.room_subtitle { margin-right:12px}
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
