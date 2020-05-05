<template>
  <div class="echorooms">

    <Videoroom
      :roombyId="room"
      v-if="nick && showVroom"
      :nick="nick"
      is_muted="true"
      open="true"
      @leftRoom="recreateVRoom"
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
        open="false"
        :allowFacetime="false"
        :allowStageSends="false"
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

</style>
