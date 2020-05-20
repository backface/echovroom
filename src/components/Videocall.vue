<template>

  <div ref="videocall" class="videocall" :class="{ isOn: webRTCUp }">

    <div class="columns  is-mobile headers is-gapless">
      <div class="column has-text-left is-10">
        <video-icon size="1x" class="icons linked"></video-icon>
        videocall
      </div>
      <div class="column has-text-right">
        <loader-icon size="1x" class="icons loading" v-if="!is_registered"  title="Loading"></loader-icon>
      </div>
      <a v-if="is_open" @click="hangup()" title="Leave room">
        <minus-icon size="1x" class="icons linked" ></minus-icon>
      </a>
    </div>

    <div v-show="is_streaming" class="videocalllocal" >
      <video ref="videolocal" id="videolocal" autoplay loop crossorigin="anonymous" muted></video>
      <div class="overlay name">ME</div>
      <div class="overlay meta">
        <a v-if="muted" @click="muteMe(false)"  title="unmute me">
          <mic-off-icon size="1x" class="icons linked" ></mic-off-icon>
        </a>
        <a v-if="!muted" @click="muteMe(true)" title="mute me">
          <mic-icon size="1x" class="icons linked"></mic-icon>
        </a>
        <a v-if="allowSettings" @click="showBitrateOptions=!showBitrateOptions"  title="show settings">
          <settings-icon size="1x" class="icons linked"></settings-icon>
        </a>
        <a @click="makeVideoFullscreen" title="fullscreen">
          <maximize-2-icon size="1x" class="icons linked" ></maximize-2-icon>
        </a>
      </div>
      <div class="overlay options" v-show="showBitrateOptions">
        <v-select dark label="Cap Bitrate" dense v-model="bitrate" :items="bitrates" @change="updateBitrateCap"></v-select>
      </div>
    </div>

    <div v-show="has_stream || is_loading" class="videocallremote" :style="'width:'+width+'px; height:'+width+'px'">
      <video ref="videoremote" id="videoremote" autoplay loop crossorigin="anonymous"></video>
      <div class="overlay name">{{ peer }}</div>
      <div class="overlay loading" v-if="is_loading">
        <loader-icon size="3x" class="icons loading" title="Loading"></loader-icon>
      </div>

      <div class="overlay meta">
        <span class="bitrate" v-if="peer_bitrate">
          {{ peer_bitrate }}<br />
        </span>
        <a @click="makeVideoFullscreen" title="fullscreen">
          <maximize-2-icon size="1x" class="icons linked"></maximize-2-icon>
        </a>
        <a @click="showSimulcastOptions=!showSimulcastOptions" title="show settings">
          <settings-icon v-if="allowSettings" size="1x" class="icons linked"></settings-icon>
        </a>
        <a @click="hangup" title="hang up">
          <phone-off-icon size="1x" class="icons linked"></phone-off-icon>
        </a>
      </div>
      <div class="overlay options" v-show="showSimulcastOptions">
          <v-select dark label="Quality" dense v-model="substream" :items="qualities" @change="changeFeedQuality()"></v-select>
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
import { MicIcon, MicOffIcon, VideoIcon, SettingsIcon } from 'vue-feather-icons'
import { LoaderIcon, MinusIcon, Maximize2Icon, PhoneOffIcon } from 'vue-feather-icons'
import LoginDialog from '@/components/dialogs/LoginDialog'
import AlertDialog from '@/components/dialogs/AlertDialog'
import Toast from '@/components/dialogs/Toast'
import screenfull from 'screenfull'

export default {
  name: 'Videocall',

  mixins: [janusMixin],

  components: {
    LoginDialog, Toast, AlertDialog,
    MicIcon, MicOffIcon, MinusIcon, LoaderIcon, VideoIcon,
    Maximize2Icon, SettingsIcon, PhoneOffIcon
  },

  props: {
    callee: {
      type: String,
      default: ""
    },
    is_muted: {
      type: Boolean,
      default: false
    },
  },

  data() {
    return {
      opaqueId: this.$options._componentTag  + "-" + Janus.randomString(12),
      pluginHandle: null,
      pluginName: "videocall",
      is_streaming: false,
      has_stream: false,
      is_registered: false,
      muted:false,
      initial_participants: null,
      participants: null,
      doSimulcast: true,
      width:400,
      peer: null,
      bitrates:  [
        { text: "No Limit", value: 0},
        { text: "256 Kb", value: 256000} ,
        { text: "512 Kb", value: 512000},
        { text: "1 Mb", value: 1000000},
        { text: "2 Mb", value: 2000000},
      ],
      qualities:  [
        { text: "Low", value: 0},
        { text: "Medium", value: 1} ,
        { text: "High", value: 2},
      ],
      bitrate: 0,
      peer_bitrate: 0,
      substream:0,
      showBitrateOptions: false,
      showSimulcastOptions: false,
      showBitrates: true,
      is_loading:false,
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
    this.width = this.getSize()
  },

  destroyed () {
    this.janus.destroy();
  },

  watch: {
    callee: function(value) {
      console.log("got call request to:", value);
      if (value)
        this.call(value)
    }
  },

  methods: {
    getWindowWidth() {
      return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    },

    getWindowHeight() {
      return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    },

    getSize() {
      return Math.min(this.getWindowWidth(), this.getWindowHeight())/2
    },

    attachPlugin() {
      let self = this;

      console.log(self.opaqueId, 'attach plugin: ' + self.pluginName)

      self.janus.attach({

        plugin: "janus.plugin." + self.pluginName,
        opaqueId: self.opaqueId,

        success: function(pluginHandle) {
          self.pluginHandle = pluginHandle;
          Janus.log(self.opaqueId, "Plugin attached! (" + self.pluginHandle.getPlugin() + ", id=" + self.pluginHandle.getId() + ")");
          //console.log("sending watch request")
          //pluginHandle.send({ 'message': body })

          self.pluginHandle.send({
            "message": {
               "request": "list",
            }
          });

        },

        error: function(error) {
          console.error(self.opaqueId, "  -- Error attaching plugin...", error);
        },

        consentDialog: function(on) {
          Janus.debug(self.opaqueId, "Consent dialog should be " + (on ? "on" : "off") + " now");
        },


        webrtcState: function(on) {
          Janus.log(self.opaqueId, "Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
          self.webRTCUp = true;
        },

        onmessage: function(msg, jsep) {
          //console.log(msg);
          var result = msg["result"];

          if(result !== null && result !== undefined) {
            if(result["list"] !== undefined && result["list"] !== null) {
              console.log("Got a list of registered peers:");
              console.log(result["list"]);

              if (!self.initial_participants) {
                self.initial_participants = result["list"];
                self.participants = result["list"];
                self.login()
              }
              self.participants = result["list"];

            } else if(result["event"] !== undefined && result["event"] !== null) {
              var event = result["event"];

              if(event === 'registered') {
                console.log("successully registered as ", result["username"]);
                self.is_registered = true;

              } else if(event === 'calling') {
                self.toast.open("Waiting for the peer to answer...");
                // TODO Any ringtone?

              } else if(event === 'incomingcall') {
                self.peer =  result["username"]
                self.alert.open("Incoming call from " + result["username"] + "!", {cancelable: true}).then( function(d){
                  if (!d)
                    self.hangup()
                  else {
                    console.log("creating answer");
                    self.is_loading = true;
                    self.pluginHandle.createAnswer({
                      jsep: jsep,
                      media: { data: true },
                      simulcast: self.doSimulcast,
                      success: function(jsep) {
                        Janus.debug("Got SDP!");
                        Janus.debug(jsep);
                        var body = { "request": "accept" };
                        self.pluginHandle.send({"message": body, "jsep": jsep});
                      },
                      error: function(error) {
                        console.log("WebRTC error:", error);
                        self.alert.open("WebRTC error... " + JSON.stringify(error));
                      }
                    });
                  }
                })
                // Notify user

              } else if(event === 'accepted') {
                console.log("Peer accepted ...");
                var peer = result["username"];
								if(peer === null || peer === undefined) {
                  self.toast.open("Call started!");
                  console.log("Call started");
								} else {
									console.log(peer + " accepted the call!");
                  self.toast.open(peer + " accepted the call!");
									self.peer = peer;
								}
                if(jsep) {
                  self.is_loading = true;
									self.pluginHandle.handleRemoteJsep({jsep: jsep});
                } else {
                  console.log("no jsep");
                }

              } else if(event === 'update') {

                // An 'update' event may be used to provide renegotiation attempts
                if(jsep) {
                  if(jsep.type === "answer") {
                    self.pluginHandle.handleRemoteJsep({jsep: jsep});
                  } else {
                    self.pluginHandle.createAnswer({
                      jsep: jsep,
                      media: { data: true },	// Let's negotiate data channels as well
                      success: function(jsep) {
                        Janus.debug("Got SDP!");
                        Janus.debug(jsep);
                        var body = { "request": "set" };
                        self.pluginHandle.send({"message": body, "jsep": jsep});
                      },
                      error: function(error) {
                        console.log("WebRTC error:", error);
                        self.alert.open("WebRTC error... " + JSON.stringify(error));
                      }
                    });
                  }
                }

              } else if(event === 'hangup') {
                if (result["username"] == self.display) {
                  console.log("hanging up..")
                  self.toast.open("hanging up..");
                } else {
                  console.log("Call hung up by " + result["username"] + " (" + result["reason"] + ")!");
                  self.toast.open("Call hung up by " + result["username"]);
                  self.pluginHandle.hangup()
                }

                self.is_streaming = false
                self.has_stream =false
                self.$emit("hangup")

              } else if(event === "simulcast") {
                console.log("switched to substream",result["substream"] );
                self.substream = result["substream"];

              }
            }
          } else {
            var error = msg["error"];
            console.log(error);
            self.alert.open(error)
          }

        },

        onlocalstream: function(stream) {
          console.log(self.opaqueId, "we have a local stream");
          Janus.attachMediaStream(self.$refs.videolocal, stream);
          self.is_streaming = true;
				},

        onremotestream: function(stream) {
          console.log(self.opaqueId, "we have a remote stream");
          self.$emit("takingCall")
          Janus.attachMediaStream(self.$refs.videoremote, stream);
          self.has_stream = true;
          self.is_loading = false;
          if (self.showBitrates)
            setTimeout(function updateBitrate() {
                if (self.peer) {
                  self.peer_bitrate = self.pluginHandle.getBitrate();
                  setTimeout(updateBitrate, 1000);
              }
            }, 1000);
				},

        ondataopen: function() {
          Janus.log("The DataChannel is available!");
        },

        ondata: function(data) {
          Janus.debug("We got data from the DataChannel! " + data);
        },

        oncleanup: function() {
          Janus.log(self.opaqueId, " ::: Got a cleanup notification :::");
        },

        destroyed: function() {
          // do nothing for now
				}

      });

    },

    call(callee) {
      let self = this
      console.log("creating offer");
      self.pluginHandle.createOffer({
        media: { data: true },
        simulcast: self.doSimulcast,
        success: function(jsep) {
          Janus.debug("Got SDP!");
          Janus.debug(jsep);
          var body = { "request": "call", "username": callee };
          console.log("calling ", callee);
          self.pluginHandle.send({"message": body, "jsep": jsep});
        },
        error: function(error) {
          console.log();("WebRTC error...", error);
          self.alert.open("WebRTC error... " + error);
        }
      });
    },


    login() {
      let self = this;
      if (!self.is_open)
        self.is_open = true;

      console.log(self.opaqueId, "login");

      if (!self.nick) {
        console.log(self.opaqueId, "no name provided");
        self.askForUsername();
      } else if ( (self.nick) in self.initial_participants) {
        console.log(self.opaqueId, "username already taken");
        self.askForUsername(true);
      } else {
        self.display = self.nick
        self.registerUser()
      }

    },

    registerUser() {
      let self = this;
      var register = {
        "request": "register",
        "username": this.display
      };
      self.pluginHandle.send({
         "message": register,
       });
    },

    hangup() {
      // Hangup a call
      var hangup = { "request": "hangup" };
      this.pluginHandle.send({"message": hangup});
      this.pluginHandle.hangup()
      this.is_streaming = false
      this.has_stream =false
    },

    sendData(data) {
      let self = this;
      //if(data === "") {
      //  bootbox.alert('Insert a message to send on the DataChannel to your peer');
      //return;
      // }
      this.pluginHandle.data({
        text: data,
        error: function(reason) { self.alert.open(reason); },
        success: function() {},
      });
    },

    muteMe(muted) {
      this.muted = muted;
      this.pluginHandle.send({
        "message": {
          "request": "set",
          "audio": !this.muted,
        }
      });
    },

    toggleVideo() {
      this.videoenabled != this.videoenabled
      this.pluginHandle.send({
        "message": {
          "request": "set",
          "video": this.videoenabled
        }
      });
    },

    updateBitrateCap() {
      console.log(this.bitrate);
      this.pluginHandle.send( {
        "message":
          { "request": "set", "bitrate": this.bitrate }
      });
      this.showBitrateOptions = false
    },

    changeFeedQuality(substream) {
      console.log(substream);
      this.pluginHandle.send({
        "message": {
          request: "set",
          substream: substream
        },
        success: (r) => { console.log(r)}
      })
    },

    makeVideoFullscreen(e) {
      let v = e.target.parentElement.parentElement.parentElement.querySelector('video')
      screenfull.request(v)
    },
  }
}

</script>

<style lang="css" scoped>
 video {
   object-fit: cover;
   width:100%;
   height:100%;
  border-radius: 50%;
   box-shadow: 10px 6px 12px rgba(0,0,0,0.35);
   background: black;
   color:white;
  }
.videocalllocal { position: absolute; bottom:10px; left:10px; width:256px; height:256px;z-index:100}
.videocallremote { position: absolute; top:50%; left:50%;transform: translate(-50%,-50%);z-index:100; }

.overlay .icons {   opacity: 0.7 }
.overlay .linked{  background:none }
.overlay .linked:hover { opacity: 1; color:white }
.name {
  position: absolute; top:2px; left: 50%; transform:translate(-50%,0);
  background:rgba(0,0,0, 0.2); color:white;padding:0.01rem 0.5rem;
  opacity: 0.7
}
.loading {
    position: absolute;
    left: 50%; top:50%;transform:translate(-50%,-50%);
    /*bottom:5px; left: 5px;*/
    /*background:white; color:#333;padding:0.3em;*/
    background:rgba(0,0,0, 0.2); color:white;padding:0.1rem 0.5rem;
}
.meta {
    position: absolute; opacity: 0.7;
    left: 50%; bottom:2px;transform:translate(-50%,0);
    /*bottom:5px; left: 5px;*/
    /*background:white; color:#333;padding:0.3em;*/
    background:rgba(0,0,0, 0.2); color:white;padding:0.1rem 0.5rem;
}
.options {
    opacity: 0.7;  position: absolute;
    left: 50%; bottom:28px;  height:45px; transform:translate(-50%,0);
    /*bottom:5px; left: 5px;*/
    /*background:white; color:#333;padding:0.3em;*/
     background:rgba(0,0,0, 0.2); color:white;padding:0.15rem 0.5rem;
}

</style>
