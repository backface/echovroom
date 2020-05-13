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
        :is_muted="true"
        :myJanus="janus"
        :login_password="password"
        :open="video_chat_open"
        :facetime="facetime"
        @leftRoom="recreateVRoom"
        :vr="vr"
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
import LoginDialog from '@/components/dialogs/LoginDialog'
import Toast from '@/components/dialogs/Toast'
import { janusMixin } from "@/mixins/janusMixin";

export default {
  name: 'App',

  mixins: [janusMixin],

  components: {
    Stage,
    Textroom, Videoroom,
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
      this.video_chat_open = "false";
      setTimeout( () => {self.showVroom = true}, 500)
    }
  }

}
</script>

<style scoped>

.embed-container { position: relative; padding:0; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;}
.embed-container iframe, .embed-container object, .embed-container embed, .embed-container div
  { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

</style>
