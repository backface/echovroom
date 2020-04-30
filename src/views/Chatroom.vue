<template>
  <div class="main">
    <div class="stage">
      <div class='embed-container'>
        <Stage />
      </div>
    </div>


    <div class="echorooms">
      <Videoroom
        :roombyName="roombyName"
        v-if="nick  && showVroom"
        :nick="nick"
        is_muted="true"
        :myJanus="janus"
        open="true"
        :facetime="facetime"
        @leftRoom="recreateVRoom"
      />

      <Audioroom
        v-if="nick"
        :roombyName="roombyName"
        :nick="nick"
        :myJanus="janus"
      />

      <transition name="fade">
        <Textroom
          v-if="janusReady"
          v-show="chat_open"
          open="true"
          :myJanus="janus"
          :roombyName="roombyName"
          :nick="login_name"
          @participantNumberChanged="foyer_count = $event"
          @hasNick="nick = $event;"
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
import Stage from '@/components/Stage.vue'
import Textroom from '@/components/Textroom.vue'
import Audioroom from '@/components/Audioroom.vue'
import Videoroom from '@/components/Videoroom.vue'
import LoginDialog from '@/components/dialogs/LoginDialog'
import Toast from '@/components/dialogs/Toast'
import { janusMixin } from "@/mixins/janusMixin";

export default {
  name: 'App',

  mixins: [janusMixin],

  components: {
    Stage,
    Textroom, Audioroom, Videoroom,
    LoginDialog, Toast
  },

  props: {
    facetime:  {
      type: Boolean,
      default: false
    }
  },

  mounted() {
    if (typeof this.$route.query.login !=  undefined) {
      this.login_name = this.$route.query.login;
    }
    this.loadConfig()
  },

  data() {
    return {
      foyer_count: 0,
      chat_open: true,
      janusReady: false,
      login_name: null,
      showVroom:true
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
      setTimeout( () => {self.showVroom = true}, 500)
    }
  }

}
</script>

<style>

.embed-container { position: relative; padding:0; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;}
.embed-container iframe, .embed-container object, .embed-container embed, .embed-container div
  { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

.stage { width: 640px; margin: 0 auto; max-width: 100%; }
.echorooms { width: 640px; height:300px; margin: 20px auto;  max-width: 95%; }
</style>
