<template>
  <div class="main">

    <transition name="fade">
        <Textroom
          v-if="janusReady"
          v-show="chat_open"
          :open="chat_open"
          :autologin="chat_open && login_name!=''"
          :active="true"
          :roombyName="roombyName"
          :host="server"
          :nick="login_name"
          :emitCallEvents="true"
          :login_password="password"
          @hasNick="login_name = $event;"
          @hasPassword="password = $event;"
          @hasRoomInfo="foyer_info = $event"
          @hasJanus="janus = $event"
          :allowMinimize="false"
        />
      </transition>
    <toast ref="toast"></toast>
    <login-dialog ref="login"></login-dialog>
  </div>
</template>

<script>
import Textroom from '@/components/Textroom.vue'
import LoginDialog from '@/components/dialogs/LoginDialog'
import Toast from '@/components/dialogs/Toast'
import { event_bus } from '@/main'
//import { PortalTarget } from 'portal-vue'
//import { janusMixin } from "@/mixins/janusMixin";

export default {
  name: 'App',

  //mixins: [janusMixin],

  components: {
    Textroom,
    LoginDialog, Toast,
    //PortalTarget,
  },

  props: {
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

    this.loadRoomConfig()
  },

  data() {
    return {
      chat_open: true,
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

          if (json.title) this.title = json.title;
          if (json.no_title == "true") this.title = "";


          /*
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
          */

          if (json.theme) {
            event_bus.$emit('loadTheme', json.theme);
          }

          if (json.stage) {
            this.hasStreaming = false;
            this.stage = json.stage;
          } else {
            this.hasStreaming = this.withStreaming;
          }

          //this.login_name = "adsf"

          if ('random_login' in json) {
            console.log(json.random_login);
            this.login_name  = Math.random().toString(36).substr(2, 9);
          }

          if ('autologin' in json && !this.login_name)
          {
            this.chat_open = true // json.autologin;
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
      this.janusReady = true;
    },

    attachPlugin() {
      console.log("janus is ready");
      this.janusReady = true
    },

    attach() {
      //let self = this;
      if (this.login_name) {
        this.chat_open = true;
      }
      this.janusReady = true;
      //setTimeout( () => {self.delayed_login = true})
    },
  }
}
</script>

<style scoped>
  .main { padding: 0px 10px; bottom:20px; position: absolute; width: 100%; height: calc(100% - 24px)}
  .topcontrols { display: none }

</style>
