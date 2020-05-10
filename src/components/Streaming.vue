<template>
<div class="stage">
  <img src="../assets/testbild.jpg" v-show="!is_streaming">
  <video ref="stream" playsinline autoplay controls v-show="is_streaming"></video>

  <toast ref="toast"></toast>
  <login-dialog ref="login"></login-dialog>
  <alert-dialog ref="alert"></alert-dialog>

  </div>
</template>

<script>
import { janusMixin } from "@/mixins/janusMixin";
import Janus from '../janus'
import LoginDialog from '@/components/dialogs/LoginDialog'
import AlertDialog from '@/components/dialogs/AlertDialog'
import Toast from '@/components/dialogs/Toast'


export default {
  name: 'Streaming',

  mixins: [janusMixin],

  components: {
    LoginDialog, Toast, AlertDialog,
  },

  props: {

  },

  data() {
    return {
      opaqueId: this.$options._componentTag  + "-" + Janus.randomString(12),
      pluginHandle: null,
      pluginName: "streaming",
      room: 10,
      is_streaming: false,

    }
  },

  mounted () {
    console.log(this.$options._componentTag + " mounted");
    this.muted = this.is_muted === "true"
    if (this.myJanus == null) {
      this.loadConfig()
    } else {
      this.janus = this.myJanus
      this.attachPlugin()
    }
  },

  destroyed () {
    this.janus.destroy();
  },

  methods: {


    attachPlugin() {
      let self = this;

      console.log(self.opaqueId, 'attach plugin: ' + self.pluginName)

      self.janus.attach({

        plugin: "janus.plugin." + self.pluginName,
        opaqueId: self.opaqueId,

        success: function(pluginHandle) {
          self.pluginHandle = pluginHandle;
          Janus.log(self.opaqueId, "Plugin attached! (" + self.pluginHandle.getPlugin() + ", id=" + self.pluginHandle.getId() + ")");
          let body = { 'request': 'watch', id: self.room }
          console.log("sending watch request")
          pluginHandle.send({ 'message': body })
        },

        error: function(error) {
          console.error(self.opaqueId, "  -- Error attaching plugin...", error);
        },


        webrtcState: function(on) {
          Janus.log(self.opaqueId, "Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
          self.webRTCUp = true;
        },

        onmessage: function(msg, jsep) {
          Janus.debug(" ::: Got a message :::");
          Janus.debug(msg);
          var event = msg[self.pluginName];
					Janus.debug("Event: " + event);

          console.log(self.opaqueId, msg, event);

          if(jsep !== undefined && jsep !== null) {
            Janus.debug(self.opaqueId, "Handling SDP as well...");
            Janus.debug(jsep);
            if (jsep.type === 'offer') {
              console.log("jsep type was an offer, lets make an answer")
              self.pluginHandle.createAnswer(
                {
                  jsep,
                  media: { audioSend: false, videoSend: false },
                  success: function (jsep) {
                    console.log("sending a message to request the stream starts")
                    const body = { 'request': 'start' }

                    self.pluginHandle.send({ 'message': body, 'jsep': jsep })
                  },
                  error: function (error) {
                    Janus.error('WebRTC error:', error)
                  }
                }
              )
            }
          }
        },

        onremotestream: function(stream) {
          console.log(self.opaqueId, "we have a remote stream");

          Janus.attachMediaStream(self.$refs.stream, stream);
          self.is_streaming = true;
				},

        oncleanup: function() {
          Janus.log(self.opaqueId, " ::: Got a cleanup notification :::");

        }
      });
    },
  }
}

</script>

<style lang="css" scoped>
 video {
    width:100%; height:100%; border-radius: 5px; border: 1px solid black;
    border-radius:5px;     box-shadow: 10px 6px 12px rgba(0,0,0,0.35);
  }

</style>
