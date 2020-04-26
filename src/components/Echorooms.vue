<template>
  <div class="echorooms">
    
    <Videoroom
      :roombyId="room"
      v-if="nick && showVroom"
      :nick="nick"
      is_muted="true"
      open="false"
      @leftRoom="recreateVRoom"
    />

    <Audioroom
      v-if="nick"
      :roombyId="room"
      :nick="nick"
    />

    <transition name="fade">
    <Textroom
      v-if="janusReady"
      :nick="login_name"
      :roombyId="room"
      @participantNumberChanged="foyer_count = $event"
      @hasNick="nick = $event;"
      @hasRoomInfo="foye_info = $event"
      @hasJanus="janus = $event"
      :myJanus="janus"
      open="false"
    />
  </transition>

  <toast ref="toast"></toast>
  <login-dialog ref="login"></login-dialog>
  <alert-dialog ref="alert"></alert-dialog>

  </div>

</template>

<script>

import { janusMixin } from "@/mixins/janusMixin";
import Textroom from './Textroom.vue'
import Audioroom from './Audioroom.vue'
import Videoroom from './Videoroom.vue'
import LoginDialog from '@/components/dialogs/LoginDialog'
import AlertDialog from '@/components/dialogs/AlertDialog'
import Toast from '@/components/dialogs/Toast'

export default {
  name: 'Echorooms',

  mixins: [janusMixin],

  components: {
    Textroom, Audioroom, Videoroom,
    LoginDialog, AlertDialog, Toast
  },

  props: {
    LoginDialog:  {
      type: String,
      default: ""
    },
  },

  mounted() {
    this.loadConfig()
    if (typeof this.$route.query.login !=  undefined) {
      this.login_name = this.$route.query.login;
    }
  },

  data() {
    return {
      foyer_count: 0,
      chat_open: false,
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
      setTimeout( () => {self.showVroom = true}, 500)
    }
  }

}
</script>

<style lang="css">

.echorooms {
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
.linked { cursor:pointer}
.loading {
-webkit-animation:spin 4s linear infinite;
    -moz-animation:spin 4s linear infinite;
    animation:spin 4s linear infinite;
}
@-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
@-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
@keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }

.fade-enter {
  opacity: 0
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease-out;
}

.fade-leave-to {
  opacity: 0
}

@media (max-width:461px) {
  .textroom {
    max-height:180px;
  }
}

</style>
