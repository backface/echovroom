<template>
  <div class="main">
    <div class="room_details">
      <span v-if="title" class="title">{{ title }}</span>
      <span v-if="subtitle" class="room_subtitle">{{ subtitle }}</span>
    </div>

    <div class="stage" v-if="!embed">
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

    <div class="echovrooms" v-show="!present">

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
        v-if="login_name && janusReady && !present"
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
import { event_bus } from '@/main'
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
    present:  {
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
      let self = this
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

          if (json.title) this.title = json.title;
          if (json.no_title == "true") this.title = "";
          if (json.subtitle) this.subtitle = json.subtitle;

          if (json.calendar) {
            // this is a hack
            //self.$parent.$parent.$parent.calendar_src =  json.calendar;
            fetch(json.calendar).then(
              r => r.text()
            ).then((text) => {
              self.$parent.$parent.$parent.calendar_src = "<h1 class=\"title\">calendar</h1>" + text;
            })
          } else {
            self.$parent.$parent.$parent.calendar_src = null;
          }

          if (json.about) {
            // this is a hack
            self.$parent.$parent.$parent.about_src = json.about;
          } else {
            self.$parent.$parent.$parent.about_src = null;
          }

          if (json.tipjar) {
            // this is a hack
            self.$parent.$parent.$parent.tipjar_src = json.tipjar;
          } else {
            self.$parent.$parent.$parent.tipjar_src = null;
          }

          if (json.theme) {
            event_bus.$emit('loadTheme', json.theme);
          }

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

<style></style>
