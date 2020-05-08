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
        is_muted="true"
        :myJanus="janus"
        open="true"
        :facetime="facetime"
        @leftRoom="recreateVRoom"
      />

      <Audioroom
        v-if="login_name"
        :roombyName="roombyName"
        :nick="login_name"
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
          @hasNick="login_name = $event;"
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
    },
    embed:  {
      type: Boolean,
      default: false
    },
    room:  {
      type: Number,
      default: 777
    },
  },

  mounted() {
    if (typeof this.$route.query.login !=  undefined) {
      this.login_name = this.$route.query.login;
    }
    this.loadConfig()
  },

  data() {
    return {
      chat_open: true,
      janusReady: false,
      login_name: null,
      showVroom:true,
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

<style scoped>

.embed-container { position: relative; padding:0; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;}
.embed-container iframe, .embed-container object, .embed-container embed, .embed-container div
  { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

</style>
