<template>
<div class="stage">
  <div class="player">
      <video ref="stream" playsinline autoplay muted v-show="is_streaming"></video>

      <div class="muted">
        <a v-if="muted && is_streaming" @click="muteMe(false)"  title="unmute me">
          <volume-x-icon size="10x" class="icons linked" ></volume-x-icon>
        </a>
      </div>

      <div class="overlay meta" v-show="is_streaming">
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
//import {VSelect} from 'vuetify/lib'

export default {
  name: 'Streaming',

  mixins: [janusMixin],

  components: {
    LoginDialog, Toast, AlertDialog,
    Volume2Icon, VolumeXIcon, Maximize2Icon,
  //  VSelect
  },

  props: {

  },

  data() {
    return {
      opaqueId: this.$options._componentTag  + "-" + Janus.randomString(12),
      pluginHandle: null,
      pluginName: "streaming",
      is_streaming: false,
      muted: false,
      substream: 0,
      temporal: 0,
      simulcastStarted: false,
      qualities:  [
        { text: "Low", value: 0},
        { text: "Medium", value: 1} ,
        { text: "High", value: 2},
      ],
      rtspServer: "rtsp://" + window.location.hostname + ":8554",
      tried_creating_mountpoint: 0,
    }
  },

  mounted () {
    var self = this;
    console.log(self.opaqueId, ":", this.$options._componentTag + " mounted");
    this.muted = this.is_muted === "true"
    if (this.myJanus == null) {
      fetch('vroom/streaming_config.json')
        .then(r => r.json())
        .then(json => {
          if (json.server) {
            console.log(self.opaqueId, ":", "streaming server set from json");
            this.server = json.server;
          }
          if (json.iceServers)  {
            console.log(self.opaqueId, ":", "streaming stun/turn set from json");
            this.iceServers = json.iceServers;
          }
          if (json.rtspServer) this.rtspServer = json.rtspServer;
          this.initJanus();
        }).catch( () => {
          console.log(self.opaqueId, ":", "no valid streaming_config.json found");
          this.initJanus();
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

      console.log(self.opaqueId, ":",  'attach plugin: ' + self.pluginName)

      self.janus.attach({
        plugin: "janus.plugin." + self.pluginName,
        opaqueId: self.opaqueId,

        success: function(pluginHandle) {
          self.pluginHandle = pluginHandle;
          console.log(self.opaqueId, ":", "Plugin attached! (" + self.pluginHandle.getPlugin() + ", id=" + self.pluginHandle.getId() + ")");
          let body = { 'request': 'watch', id: '' + self.room }
          console.log(self.opaqueId, ":",  "sending watch request for", self.room)
          pluginHandle.send({ 'message': body })
        },

        error: function(error) {
          console.log(self.opaqueId, ":", "Error attaching plugin...", error);
        },


        webrtcState: function(on) {
          console.log(self.opaqueId, ":", "Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
          self.webRTCUp = true;
        },

        onmessage: function(msg, jsep) {
          console.log(self.opaqueId, ":",   "Got Message: ", msg);

          var result = msg["result"];
					if(result !== null && result !== undefined) {
            if(result["status"] !== undefined && result["status"] !== null) {
              console.log(self.opaqueId, ":",  "status:  " + result["status"]);
						} else if(msg["streaming"] === "event") {
              var substream = msg["substream"];
              var temporal = msg["temporal"];
              if((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
                if(!self.simulcastStarted) {
                  self.simulcastStarted = true;
                  self.substream = substream
                  self.temporal = temporal
                  console.log(self.opaqueId, ":",  "started simulcast", substream, temporal)
                } else {
                  self.substream = substream
                  self.temporal = temporal
                  console.log(self.opaqueId, ":",   "update simulcast", substream, temporal)
                }
              }
            }
          } else if(msg["error"] !== undefined && msg["error"] !== null) {

            //self.alert.open(msg["error"]);
            if ( msg.error_code == 455) {
              console.log(self.opaqueId, ":",   "mountpoint not found");

              if (self.tried_creating_mountpoint < 1) {
                console.log(self.opaqueId, ":", "create mountpoint");
                var request = {
                  "request": "create",
                  "type" : "rtsp",
                  "id" : self.room + "",
                  "name" : self.room_name,
                  "audio" : true,
                  "video" : true,
                  "url": self.rtspServer + "/" + self.room_name,
                  "videopt": 96,
                  "videortpmap": "H264/90000",
                  "videofmtp": "profile-level-id=42e01f;packetization-mode=1",
                  "audioport": 10006,
                  "audiopt": 111,
                  "audiortpmap": "opus/48000/2",
                }
                console.log(request);
                if (self.password) {
                  request.pin = self.password
                }

                self.tried_creating_mountpoint++;
                self.pluginHandle.send({
                  "message": request,
                  success: function(response) {
                    console.log(response);
                    console.log(self.opaqueId, ":",  "sending watch request for", self.room)
                    self.pluginHandle.send({ 'message': { 'request': 'watch', id: '' + self.room } })
                  },
                  error: function(reason) {
                    console.log("ERR" + reason);
                  }
                });
              }
            }

            else
              console.log(self.opaqueId, ":", msg["error"]);
          }

          if(jsep !== undefined && jsep !== null) {
            console.log(self.opaqueId, ":", "Handling SDP as well...");
            Janus.debug(jsep);
            if (jsep.type === 'offer') {
              console.log(self.opaqueId, ":", "jsep type was an offer, lets make an answer")
              self.pluginHandle.createAnswer(
                {
                  jsep,
                  media: { audioSend: false, videoSend: false },
                  success: function (jsep) {
                    console.log(self.opaqueId, ":", "sending a message to request the stream starts")
                    const body = { 'request': 'start' }
                    self.pluginHandle.send({ 'message': body, 'jsep': jsep })
                  },
                  error: function (error) {
                    console.log(self.opaqueId, ":", 'WebRTC error:', error)
                  }
                }
              )
            }
          }
        },

        onremotestream: function(stream) {
          console.log(self.opaqueId, ":",  "we have a remote stream");
          Janus.attachMediaStream(self.$refs.stream, stream);
          if(stream.getAudioTracks().length < 1) {
            console.log(self.opaqueId, ":",  "stream has no audio track");
          } else {
            self.muted = true;
          }
          self.is_streaming = true;
				},

        oncleanup: function() {
          console.log(self.opaqueId, ":", " ::: Got a cleanup notification :::");
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
    },

    selectSubstream(num) {
      this.pluginHandle.send({message: { request: "configure", substream: num }});
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
      background:rgba(0,0,0, 0.7); color:white;padding:0.1rem 0.5rem;
  }

  .options {
      opacity: 0.7;  position: absolute;
      left: 100%; bottom:38px;  transform:translate(-10%,0);
      background:rgba(0,0,0, 0.2); color:white;padding:0.15rem 0.5rem;
  }

  .muted {
      opacity: 0.5;  position: absolute; width:auto; height:auto;
      top:50%; left:50%; transform:translate(-50%,-50%);
  }
  .muted .linked { color:white}


  .player:hover .meta {display:block}



</style>
