<template>
  <div class="echorooms">

    <Videoroom
      :roombyId="room"
      v-if="nick && showVroom"
      :nick="nick"
      is_muted="true"
      open="false"
      :allowFacetime="true"
      :allowStageSends="false"
      :allowSettings="false"
      :showRoomInfo="false"
      videoResolution="stdres-16:9"
      @leftRoom="recreateVRoom"
    />

    <transition name="fade">

      <Textroom
        v-if="janusReady && chat_open"
        :roombyId="room"
        @participantNumberChanged="foyer_count = $event"
        @hasNick="nick = $event;"
        @hasRoomInfo="foye_info = $event"
        @hasJanus="janus = $event"
        :myJanus="janus"
        :showRoomInfo="false"
        :open="chat_open ? 'true' : 'false'"
      />
    </transition>

    <span @click="chat_open = true" v-if="!chat_open" class="linked">ENTER CHAT</span>

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

  mounted() {
    this.loadConfig()
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

<style lang="css" scoped>
.textroomwrapper { height:300px}
</style>
