<template>
<div class="stage">
  <img src="../assets/testbild.jpg" v-show="!is_streaming">

  <div class="player">
      <video ref="stream" playsinline autoplay v-show="is_streaming" poster="/img/testbild.jpg"></video>

      <div class="overlay meta">
        <a v-if="muted" @click="muteMe(false)"  title="unmute me">
          <volume-x-icon size="1x" class="icons linked" ></volume-x-icon>
        </a>
        <a v-if="!muted" @click="muteMe(true)" title="mute me">
          <volume2-icon size="1x" class="icons linked"></volume2-icon>
        </a>
        <a @click="makeVideoFullscreen()" title="fullscreen">
          <maximize-2-icon size="1x" class="icons linked" ></maximize-2-icon>
        </a>
      <!--  <a v-if="allowSettings" @click="showBitrateOptions=!showBitrateOptions"  title="show settings">
          <settings-icon size="1x" class="icons linked"></settings-icon>
        </a>
        <a @click="makeVideoFullscreen" title="fullscreen">
          <maximize-2-icon size="1x" class="icons linked" ></maximize-2-icon>
        </a>
      </div>
      <div class="overlay options" v-show="showBitrateOptions">
        <v-select dark label="Cap Bitrate" dense v-model="bitrate" :items="bitrates" @change="updateBitrateCap"></v-select>
      </div>-->
    </div>
  </div>

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
import { Volume2Icon, VolumeXIcon, Maximize2Icon } from 'vue-feather-icons'


export default {
  name: 'Streaming',

  mixins: [janusMixin],

  components: {
    LoginDialog, Toast, AlertDialog,
    Volume2Icon, VolumeXIcon, Maximize2Icon
  },

  props: {

  },

  data() {
    return {
      opaqueId: this.$options._componentTag  + "-" + Janus.randomString(12),
      pluginHandle: null,
      pluginName: "streaming",
      is_streaming: false,
      muted: false
    }
  },

  mounted () {
    console.log(this.$options._componentTag + " mounted");
    this.muted = this.is_muted === "true"
    if (this.myJanus == null) {
      fetch('vroom/streamin_config.json')
        .then(r => r.json())
        .then(json => {
          if (!this.server) this.server = json.server;
          if (!this.iceServers) this.iceServers = json.iceServers;
          if (this.room === 0) {
            if (typeof json.room === "string") {
              this.room = this.hashCode(json.room)
              this.room_name = json.room
            } else {
              this.room = json.room
            }
          }
          this.initJanus()
      })

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
          let body = { 'request': 'watch', id: '' + self.room }
          console.log(self.opaqueId, "sending watch request for", self.room)
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

    muteMe(muted) {
      this.muted = muted;
      this.$refs.stream.muted= this.muted;
    },

    makeVideoFullscreen() {
      if (this.$refs.stream.requestFullscreen) {
        this.$refs.stream.requestFullscreen();
      } else if (this.$refs.stream.mozRequestFullScreen) { /* Firefox */
        this.$refs.stream.mozRequestFullScreen();
      } else if (this.$refs.stream.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        this.$refs.stream.webkitRequestFullscreen();
      } else if (this.$refs.stream.msRequestFullscreen) { /* IE/Edge */
        this.$refs.stream.msRequestFullscreen();
      }
    }

  },


}

</script>

<style lang="css" scoped>
 video {
    width:100%; height:100%;
   /* border-radius: 5px; border: 1px solid black;
    border-radius:5px;     box-shadow: 10px 6px 12px rgba(0,0,0,0.35);
    */
    background:none;
  }

  .player { position: relative; }
  .overlay .icons {   opacity: 0.7 }
  .overlay .linked{  background:none }
  .overlay .linked:hover { opacity: 1; color:white }

  .meta {
      display: none;
      position: relative; opacity: 0.9;
      left: 50%; top:-36px;transform:translate(-50%,0);
      width:auto;
      /*bottom:5px; left: 5px;*/
      /*background:white; color:#333;padding:0.3em;*/
      background:rgba(0,0,0, 0.7); color:white;padding:0.1rem 0.5rem;
  }

  .player:hover .meta {display:block}



</style>
