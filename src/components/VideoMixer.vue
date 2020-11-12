<template>
<div class="videoroom" ref="videoroom">

  <portal to="topcontrols" class="topcontrols">

    <div class="columns is-mobile is-narrow headers is-gapless">
      <div class="column has-text-left is-10">
        <template v-if="allowUnpublish">
          <a  v-if="!is_streaming" @click="publishMix" title="publish video">
            <video-off-icon size="1x" class="icons linked"></video-off-icon>
          </a>
          <a v-if="is_streaming" @click="unpublishMix" title="unpublish video">
            <video-icon size="1x" class="icons linked"></video-icon>
          </a>
        </template>
        <template v-else>
          <video-off-icon v-if="!is_streaming" size="1x" class="icons"></video-off-icon>
          <video-icon  v-if="is_streaming" size="1x" class="icons"></video-icon>
        </template>

        &nbsp; Mixer
        <span v-if="room_info.description && showRoomInfo"> - {{ room_info.description }}</span>
        <span v-if="count > 0"> ({{ count }}) </span>

        <a title="unmute me"  v-if="muted" @click="muteMe(false)" >
          <mic-off-icon size="1x" class="icons linked warn_is_on"></mic-off-icon>
        </a>
        <a v-if="!muted" @click="muteMe(true)" title="mute me">
          <mic-icon size="1x" class="icons  linked" ></mic-icon>
        </a>
        <a v-if="!all_muted" @click="muteAll(true)" title="mute all">
          <volume-2-icon size="1x" class="icons linked" ></volume-2-icon>
        </a>
        <a v-if="all_muted" @click="muteAll(false)" title="unmute all">
          <volume-x-icon size="1x" class="icons linked warn_is_on"></volume-x-icon>
        </a>
        <a v-if="allowRTPforward && is_streaming" title="configure RTP Forward" @click="toggleRTPForward">
          <arrow-right-icon size="1x" class="icons linked"
              :style="{ color: isRTPforwarding ? 'var(--color-alert)' : '' }"
            ></arrow-right-icon>
        </a>
        <a v-if="is_streaming && !is_recording" title="start recording" @click="startRecording">
          <circle-icon size="1x" class="icons linked"
              :style="{ color: isRTPforwarding ? 'var(--color-alert)' : '' }"
            ></circle-icon>
        </a>
        <a v-if="is_streaming && is_recording" title="stop recording" @click="stopRecording">
          <stop-circle-icon size="1x" class="icons linked"
              :style="{ color: 'var(--color-alert)' }"
            ></stop-circle-icon>
        </a>

      </div>

      <div class="column has-text-right">
          <loader-icon size="1x" class="icons loading" v-if="!webRTCUp && is_open"  title="Loading"></loader-icon>
        <a v-if="is_open" @click="leaveRoom()" title="Leave room">
          <minus-icon size="1x" class="icons linked" ></minus-icon>
        </a>
        <a v-if="!is_open" @click="login()" title="Enter room">
          <plus-icon size="1x" class="icons linked"></plus-icon>
        </a>
      </div>

    </div>

  </portal>

    <portal to="portalscreen">

        <div>
          <video class="stage" ref="mixed_video" controls="1" style="border: 1px solid black;" ></video>
        </div>
        <div class="screen has-text-center" ref="screen">

              <div v-show="is_streaming" class="video me video"
                v-bind:style="{ position: 'fixed', top: '0px', right: '0px',  width: '256px !important' , height:  '256px !important' }"
              >
                <video ref="videolocal" class="videolocal" id="videolocal" autoplay playsinline muted="muted" />

                <div class="overlay name">ME</div>
                <div class="muted">
                  <a v-if="muted && is_streaming" @click="muteMe(false)"  title="unmute me">
                    <mic-off-icon size="5x" class="icons linked" ></mic-off-icon>
                  </a>
                </div>
                <div class="overlay meta">
                  <a v-if="muted" @click="muteMe(false)"  title="unmute me">
                    <mic-off-icon size="1x" class="icons linked" ></mic-off-icon>
                  </a>
                  <a v-if="!muted" @click="muteMe(true)" title="mute me">
                    <mic-icon size="1x" class="icons linked"></mic-icon>
                  </a>
                </div>
              </div>


        </div>

            <div class="incoming">

                <div v-for="feed in feeds" :key="feed.id" class="video">
                    <video :id="'v'+feed.id" :ref="'v' + feed.id" autoplay playsinline
                     :class="{ talking: participants[feed.publisher].talking }"
                    />
                    <div class="overlay name">
                      {{ participants[feed.publisher].display }}
                      <message-circle-icon size="1x" class="icons" v-if="participants[feed.publisher].talking"></message-circle-icon>
                    </div>
                    <div class="overlay meta">
                      <loader-icon size="1x" class="icons loading centered" v-if="feed.loading == true"></loader-icon>
                      <span class="bitrate" v-if="showBitrates && feed.bitrate">
                        {{ feed.bitrate }}<br />
                      </span>
                      <a @click="feed.showOptions=!feed.showOptions" title="show settings">
                        <settings-icon v-if="allowSettings" size="1x" class="icons linked"></settings-icon>
                      </a>
                    </div>
                    <div class="overlay options" v-show="feed.showOptions">
                        <v-select dark label="Quality" dense v-model="feed.substream" :items="qualities" @change="changeFeedQuality(feed)"></v-select>
                    </div>
                  </div>

            </div>


    </portal>

    <toast ref="toast"></toast>
    <login-dialog ref="login"></login-dialog>
    <alert-dialog ref="alert"></alert-dialog>
    <rtp-dialog ref="rtp_dialog"></rtp-dialog>

    <video ref="videosrc" style="display:none"></video>
    <canvas width="854px" height="480px" ref="mixer"></canvas>
    <div ref="video_container" style="display:none"></div>

  </div>
</template>

<script>
import Vue from 'vue';
import { janusMixin } from "@/mixins/janusMixin";
import fullscreen from 'vue-fullscreen'
import Janus from '../janus'
import { MinusIcon, PlusIcon } from 'vue-feather-icons'
import { MicIcon, MicOffIcon, LoaderIcon } from 'vue-feather-icons'
import { VideoIcon, VideoOffIcon } from 'vue-feather-icons'
import { MessageCircleIcon } from 'vue-feather-icons'
import { SettingsIcon } from 'vue-feather-icons'
import { CircleIcon, StopCircleIcon } from 'vue-feather-icons'
import { Volume2Icon, VolumeXIcon, ArrowRightIcon } from 'vue-feather-icons'
import LoginDialog from '@/components/dialogs/LoginDialog'
import AlertDialog from '@/components/dialogs/AlertDialog'
import RtpDialog from '@/components/dialogs/RtpDialog'
import Toast from '@/components/dialogs/Toast'
import { VueHammer } from 'vue2-hammer'
import { Portal  } from 'portal-vue'
const browserMCU = require('@/libs/browser_mcu_core')

Vue.use(fullscreen)
Vue.use(VueHammer)

export default {
  name: 'VideoMixer',

  mixins: [janusMixin],

  components: {
    MicIcon, MicOffIcon, LoaderIcon,
    VideoIcon, VideoOffIcon, MessageCircleIcon,
    MinusIcon, PlusIcon, SettingsIcon, ArrowRightIcon,
    LoginDialog, Toast, AlertDialog, RtpDialog,
    Volume2Icon, VolumeXIcon, CircleIcon, StopCircleIcon,
    Portal,
  },

  props: {
    allowScreenshare:  {
      type: Boolean,
      default: true
    },
    allowStageSends:  {
      type: Boolean,
      default: true
    },
    allowUnpublish:  {
      type: Boolean,
      default: true
    },
    allowSettings:  {
      type: Boolean,
      default: true
    },
    allowRTPforward:  {
      type: Boolean,
      default: true
    },
    showBitrates:  {
      type: Boolean,
      default: true
    },
    videoResolution:  {
      type: String,
      default: "stdres-16:9"
    },
    showRoomInfo: {
      type: Boolean,
      default: false
    },
    publish: {
      type: Boolean,
      default: true
    },
  },

  data() {
    return {
      webRTCUp: null,
      pluginHandle: null,
      pluginName: "videoroom",
      opaqueId: this.$options._componentTag  + "-" + Janus.randomString(12),
      my_stream: null,
      is_streaming: false,
      screenshare: false,
      video_off: false,
      muted: this.is_muted,
      all_muted: false,
      feeds: {},
      bitrateTimer: null,
      doSimulcast: true,
      fullscreen: false,
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
      showBitrateOptions: false,
      room_options: {
        audiolevel_event: true,
        publishers: 50,
        bitrate: 512000,
      },
      rtp_dialog:null,
      isRTPforwarding:false,
      rtp_forward: null,
      is_recording: false,
      mcu: null,
      localStreams: [],
      upstreamHandle: null,
      janus2: null
    }
  },

  mounted () {
    console.log(this.$options._componentTag + " mounted");
    this.rtp_dialog = this.$refs.rtp_dialog;
    if (this.myJanus == null) {
      this.loadConfig()
    } else {
      console.log("got a janus session");
      this.janus = this.myJanus
      this.attachPlugin()
    }
    this.mcu =  new browserMCU()
    this.mcu.init(this.$refs.mixer, this.$refs.video_container, browserMCU.AUDIO_MODE_ALL);
    this.mcu.setFrameRate(25);
  },

  destroyed () {
    if (this.janus)
      this.janus.destroy();
  },

  watch: {
    login_password: function(value) {
      this.password = value
    },
  },

  computed: {

  },

  methods: {

    addVideoToMixer(stream) {
      this.startMix();
      this.localStreams.push(stream);
      this.mcu.addRemoteVideo(stream);
      this.mcu.addRemoteAudio(stream);
    },

    startMix() {
      if (! this.mcu.isMixStarted()) {
        this.mcu.startMix();
        this.$refs.mixed_video.srcObject = this.mcu.getMixStream();
        this.$refs.mixed_video.play();
        this.$refs.mixed_video.volume = 0;
      }
    },

    stopMix() {
      if (this.mcu.isMixStarted()) {
        this.$refs.mixed_video.pause();
        this.$refs.mixed_video.srcObject = null;
        this.mcu.stopMix();
      //isMixStarted = false;
      }
    },

    stopAll() {
      this.stopMix();

      for (let key in this.localStreams) {
        let stream = this.localStreams[key];
        this.mcu.removeRemoteVideo(stream);
        this.mcu.removeRemoteAudio(stream);
        this.stopStream(stream);
        delete this.localStreams[key];
        stream = null;
      }

      this.localStreams = [];
    },

    stopStream(stream) {
      let tracks = stream.getTracks();
      if (! tracks) {
        console.warn('NO tracks');
        return;
      }

      for (let track of tracks) {
        track.stop();
      }
    },

    attachPlugin() {
      let self = this;

      console.log(self.opaqueId, 'attach plugin: ' + self.pluginName)

      self.janus.attach({

        plugin: "janus.plugin." + self.pluginName,
        opaqueId: self.opaqueId,

        success: function(pluginHandle) {
          self.pluginHandle = pluginHandle;
          console.log(self.opaqueId, ":",  "Plugin attached! (" + self.pluginHandle.getPlugin() + ", id=" + self.pluginHandle.getId() + ")");
          self.initRoom()
        },

        error: function(error) {
          console.error(self.opaqueId, "  -- Error attaching plugin...", error);
        },

        consentDialog: function(on) {
          console.log(self.opaqueId, ":",  "Consent dialog should be " + (on ? "on" : "off") + " now");
        },

        mediaState: function(medium, on) {
          console.log(self.opaqueId, ":",  "Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
        },

        webrtcState: function(on) {
          console.log(self.opaqueId, ":",  "Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
          self.webRTCUp = true;
        },

        onmessage: function(msg, jsep) {
          //Janus.debug(" ::: Got a message :::");
          //Janus.debug(msg);
          var event = msg[self.pluginName];
					console.log(self.opaqueId, ":", "Event: " + event);

          if(event != undefined && event != null) {

            if(event === "slow_link") {
              self.toast.open("Slow link! Bitrate is: " + (msg["current-bitrate"]/1000) + " kb")
            }

            else if(event === "talking") {
              self.$set(self.participants[msg.id], 'talking', true)
            }

            else if(event === "stopped-talking") {
              self.$set(self.participants[msg.id], 'talking', false)
            }

            else if(event === "joined") {
              self.username = msg["id"];
              self.private_id = msg["private_id"];

              console.log(self.opaqueId, ":", "Successfully joined room " + msg["room"] + " with ID " + msg["id"]);
              self.$emit("joined");
            //  self.createUpstream();

                self.attachUpstream();
              /*if (self.publish) {
                self.publishMix();
              } else {
                self.upstreamRTCUp = true;
              }
              */
              // Any new feed to attach to?
              if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
                console.log(self.opaqueId, "Got a list of available publishers/feeds:", msg["publishers"]);
                msg["publishers"].forEach( function(user) {
                  self.$set(self.participants, user.id, user);
                  self.newRemoteFeed(user.id, user.display, user.audio_codec, user.video_codec);
                })
                self.count = Object.keys(self.participants).length
                self.$emit('participantNumberChanged', self.count)
              }

						} else if(event === "destroyed") {
							console.log(self.opaqueId, ":", self.opaqueId, "The room has been destroyed!");
							self.alert.open(self.opaqueId, "The room has been destroyed");

						} else if(event === "event") {
              // Any new feed to attach to?
							if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
                  console.log(self.opaqueId, "Got a list of publishers:", msg["publishers"]);
                  msg["publishers"].forEach( function(user) {
                    self.$set(self.participants, user.id, user);
                    self.newRemoteFeed(user.id, user.display, user.audio_codec, user.video_codec);
                  })
                  console.log(self.opaqueId, self.participants);
                  self.count = Object.keys(self.participants).length
                  self.$emit('participantNumberChanged', self.count)

              } else if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
                console.log(self.opaqueId, ":", "Publisher left: " + msg["leaving"]);

                if (msg["leaving"] == "ok") {
                  console.log("I left the room");
                  self.feeds = {}
                  self.participants = {}
                  self.is_streaming = false;
                  self.webRTCUp = false;
                  self.is_open = false;
                  self.pluginHandle.hangup();
                  setTimeout(self.updateParticipantsInfo, 10000)
                  return;

                } else if(self.feeds) {
                  if(self.feeds[msg["leaving"]]) {
                    self.feeds[msg["leaving"]].detach();
                    self.$delete(self.feeds,msg["leaving"])
                  }
                }
                self.$delete(self.participants,msg['leaving'])
                self.count = Object.keys(self.participants).length
                //self.$forceUpdate()

              } else if(msg["unpublished"] !== undefined && msg["unpublished"] !== null) {
                // One of the publishers has unpublished?
                var unpublished = msg["unpublished"];
                console.log(self.opaqueId, ":", "Publisher unpublished: " + unpublished);
                if(unpublished === 'ok') {
                  self.is_streaming = false;
                  return;
                }
                else if(self.feeds) {
                  if(self.feeds[unpublished]) {
                    self.feeds[unpublished].detach();
                  }
                }
              } else if(msg["error"] !== undefined && msg["error"] !== null) {
                if(msg["error_code"] === 426) {
                  self.alert.open("Room " + self.room + " does not exits");
                  self.is_open = false;
                } else if(msg["error_code"] === 429) {
                  console.log("missing pin");
                  self.is_open = false;
                } else if(msg["error_code"] === 433) {
                  console.log("wrong pin");
                  self.is_open = false;
                } else {
                  self.alert.open(msg["error"]);
                  self.webRTCUp = true
                }
              }
            }
          }

          if(jsep !== undefined && jsep !== null) {
            console.log(self.opaqueId, ":",  "Handling SDP as well...");
            self.pluginHandle.handleRemoteJsep({jsep: jsep});
            var audio = msg["audio_codec"];
            if(self.mystream && self.mystream.getAudioTracks() && self.mystream.getAudioTracks().length > 0 && !audio) {
              self.alert.open("Our audio stream has been rejected, viewers won't hear us");
            }
            var video = msg["video_codec"];
            if(self.mystream && self.mystream.getVideoTracks() && self.mystream.getVideoTracks().length > 0 && !video) {
              self.alert.open("Our video stream has been rejected, viewers won't see us");
            }
          }
        },

        onlocalstream: function(stream) {
          Janus.attachMediaStream(self.$refs.videolocal, stream);
          self.is_streaming = true;
				},

        onremotestream: function() {
          // The publisher stream is sendonly, we don't expect anything here
				},

        oncleanup: function() {
          console.log(self.opaqueId, ":",  " ::: Got a cleanup notification :::");
        }
      });
    },


    createUpstream() {
      let self = this;
      Janus.init({
        debug: 'all',
        callback: () => {
          self.janus2 = new Janus(
            {
              server: self.server,
              iceServers: self.iceServers,
              success: () => {
                console.log("upstream: ", "janus initialized");
              //  Janus.listDevices( (d) => {
              //    console.log(self.opaqueId, ":", "available devices: ");
              //    d.forEach( d => console.log(self.opaqueId, ":", d))
              //  })
                self.attachUpstream()
              },
              error: (cause) => {
                console.log("upstream: ", "janus got an error");
                console.log("upstream: ", cause)
              },
              destroyed: () => {
                console.log("upstream: ", 'janus destroyed')
              }
            })
        }
      })
    },


    attachUpstream() {
      let self = this;

      console.log("upstream: ",'attach plugin: ' + self.pluginName)

      self.janus.attach({

        plugin: "janus.plugin.videoroom",
        opaqueId: "mixer-" + Janus.randomString(12),

        success: function(pluginHandle) {
          self.upstreamHandle = pluginHandle;
          self.joinUpstreamRoom();
        },

        error: function(error) {
          console.error("upstream:","Error attaching plugin...", error);
        },

        consentDialog: function(on) {
          console.error("upstream:","Consent dialog should be " + (on ? "on" : "off") + " now");
        },

        mediaState: function(medium, on) {
          console.error("upstream:", "Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
        },

        webrtcState: function(on, reason) {
          console.log("upstream:","Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
          console.error("upstream:", reason);
          self.upstreamRTCUp = true;
        },

        onmessage: function(msg) {
          console.log("upstream", msg);
          var event = msg[self.pluginName];

          if(event != undefined && event != null) {

            if(event === "slow_link") {
              self.toast.open("Upstream has sow link! Bitrate is: " + (msg["current-bitrate"]/1000) + " kb")
            }

            else if(event === "joined") {
              self.username = msg["id"];
              self.private_id = msg["private_id"];
              console.log("upstream:", "Successfully joined room " + msg["room"] + " with ID " + msg["id"]);

              if (self.publish) {
                self.publishMix();
              } else {
                self.upstreamRTCUp = true;
              }

            } else if(event === "destroyed") {
              console.log("upstream:",self.opaqueId, "The room has been destroyed!");

            } else if(event === "event") {
              // Any new feed to attach to?
              if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
                if (msg["leaving"] == "ok") {
                  console.log("I left the room");
                  self.upstreamRTCUp = false;
                  self.upstreamHandle.hangup();
                  return;
                }
              } else if(msg["error"] !== undefined && msg["error"] !== null) {
                if(msg["error_code"] === 426) {
                  console.log(msg["error"]);
                  self.createUpstreamRoom()
                } else if(msg["error_code"] === 429) {
                  console.log("missing pin");
                } else if(msg["error_code"] === 433) {
                  console.log("wrong pin");
                } else {
                  self.alert.open(msg["error"]);
                  self.upstreamRTCUp = true
                }
              }
            }
          }
        },

        onlocalstream: function(stream) {
          Janus.attachMediaStream(self.$refs.videolocal, stream);
          self.is_streaming = true;
        },

        onremotestream: function() {
          // The publisher stream is sendonly, we don't expect anything here
        },

        oncleanup: function() {
          console.log(self.opaqueId, ":",  " ::: Got a cleanup notification :::");
        }
      });
    },

    publishMix() {
      let self = this
      if (self.mcu.getMixStream()) {
        self.publishOwnFeed(self.pluginHandle)
      } else {
        self.$refs.mixed_video.onplay = function() {
          self.publishOwnFeed(self.pluginHandle)
        };
      }
    },

    unpublishMix() {
      var unpublish = { "request": "unpublish" };
      this.pluginHandle.send({"message": unpublish});
      this.is_streaming = false;
    },

    publishOwnFeed(pluginHandle) {
      console.log("upstream : ", "publish");
      let self = this

      var capture = self.mcu.getMixStream().clone();
      pluginHandle.createOffer( {
        stream: capture,
        simulcast: false,
        success: function(jsep) {
          console.log(self.opaqueId, " upstream:", self.opaqueId, "Got publisher SDP!");
          var publish = { "request": "configure", "audio": true, "video": true, data: true  };
          pluginHandle.send({"message": publish, "jsep": jsep});
        },
        error: function(error) {
          console.error(self.opaqueId, "WebRTC error:", error);
        }
      });

    },

    joinUpstreamRoom() {
      let self = this
      console.log("upstream:", "join room");
      self.upstreamHandle.send({
        "message": {
           request: "join",
           room: self.hashCode("mixed"),
           ptype: "publisher",
           display: self.roombyName + "_mix",
           transaction: Janus.randomString(12)
         }
      });
    },

    createUpstreamRoom() {
      let self = this
      console.log("upstream:", "join room");
      self.upstreamHandle.send({
        "message": {
           request: "create",
           room: self.hashCode("mixed"),
           display: self.roombyName + "_mix",
           transaction: Janus.randomString(12)
        },
        success: function() {
          self.joinUpstreamRoom()
        },
        error: function(reason) {
          console.log("upstream:", "ERR" + reason);
        }
      });
    },

    newRemoteFeed(id, display, audio, video) {
      // A new feed has been published, create a new plugin handle and attach to it as a subscriber
      let self = this
      let remoteFeed = null;
      console.log(self.opaqueId, ":", id);

      self.janus.attach({
        plugin: "janus.plugin." + self.pluginName,
        opaqueId: self.opaqueId,

        success: function(pluginHandle) {
          remoteFeed = pluginHandle;
          remoteFeed.simulcastStarted = false;
          console.log(self.opaqueId, ":",  "Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
          console.log(self.opaqueId, ":",  "  -- This is a subscriber");
          console.log(self.opaqueId, ":",  remoteFeed.getId(), id);
          // We wait for the plugin to send us an offer
          var subscribe = {
            "request": "join",
            "room": self.room,
            "ptype": "subscriber",
            "feed": id,
            "private_id": self.private_id
          };
          // In case you don't want to receive audio, video or data, even if the
          // publisher is sending them, set the 'offer_audio', 'offer_video' or
          // 'offer_data' properties to false (they're true by default), e.g.:
          // 		subscribe["offer_video"] = false;
          // For example, if the publisher is VP8 and this is Safari, let's avoid video

          if(Janus.webRTCAdapter.browserDetails.browser === "safari"
            && (video === "vp9"|| (video === "vp8" && !Janus.safariVp8))) {
              if(video)	video = video.toUpperCase()
              self.toast.open("Publisher is using " + video + ", but Safari doesn't support it: disabling video");
              subscribe["offer_video"] = false;
          }
          remoteFeed.videoCodec = video;
          remoteFeed.send({"message": subscribe});
        },

        error: function(error) {
          Janus.error(self.opaqueId,"  -- Error attaching plugin...", error);
          self.alert.open(self.opaqueId, "Error attaching plugin... " + error);
        },

        onmessage: function(msg, jsep) {
          var event = msg["videoroom"];

          if(msg["error"] !== undefined && msg["error"] !== null) {
            console.log(self.opaqueId, "GOT AN ERROR", msg);
            self.alert.open(msg["error"]);

          } else if(event != undefined && event != null) {

            if(event === "attached") {
              if(self.feeds[msg["id"]] === undefined || self.feeds[msg["id"]] === null) {
                let newfeed = remoteFeed
                newfeed.publisher = msg["id"]
                newfeed.loading = true
                newfeed.bitrate = 0
                newfeed.muted = false
                newfeed.ration = 1
                self.$set(self.feeds, msg.id, newfeed)

              }
              console.log(self.opaqueId, ":",
                "Successfully attached to feed " + remoteFeed.id + " ("
                + remoteFeed.rfdisplay + ") in room " + msg["room"]);

            } else if(event === "event") {
              // Check if we got an event on a simulcast-related event from this publisher
              var substream = msg["substream"];
              var temporal = msg["temporal"];
              if((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
                if(!remoteFeed.simulcastStarted) {
                  remoteFeed.simulcastStarted = true;
                  remoteFeed.substream = substream
                  remoteFeed.temporal = temporal
                  console.log("started simulcast", substream, temporal)
                }
                remoteFeed.substream = substream
                remoteFeed.temporal = temporal
                console.log("update simulcast", substream, temporal)
              }
            } else {
              // What has just happened?
            }
          }

          if(jsep !== undefined && jsep !== null) {
            console.log(self.opaqueId, ":",  "Handling SDP as well...");
            // Answer and attach
            remoteFeed.createAnswer( {
              jsep: jsep,
              // Add data:true here if you want to subscribe to datachannels as well
              // (obviously only works if the publisher offered them in the first place)

              media: { audioSend: false, videoSend: false, data: true },	// We want recvonly audio/video
              success: function(jsep) {
                console.log(self.opaqueId, ":", "Got SDP!");
                var body = { "request": "start", "room": self.room };
                remoteFeed.send({"message": body, "jsep": jsep});
              },
              error: function(error) {
                Janus.error(self.opaqueId, "WebRTC error:", error);
                self.alert.open("WebRTC error... " + JSON.stringify(error));
              }
            });
          }
        },

        ondataopen: function() {
          console.log(self.opaqueId, ":",  "The DataChannel is available!");

          // send a sendmetostage message if new data channel comes available and I am on stage
          if (self.onstage == self.username)
            self.sendMeToStage(true)
        },

        ondata: function(message) {
          console.log(self.opaqueId, ":", self.opaqueId, "We got data from the DataChannel! " + message);
          console.log(self.opaqueId, ":", message);
          message = JSON.parse(message);
          console.log(self.opaqueId, ":", message["request"]);
          console.log(self.opaqueId, ":", message.publisher);
          if (message.request == "onstage")
            self.onstage = message.publisher
          if (message.request == "offstage")
            if (self.onstage == message.publisher)
              self.onstage = null

        },

        webrtcState: function(on) {
          console.log(self.opaqueId, ":",  "Janus says this WebRTC PeerConnection (feed #" + remoteFeed.id + ") is " + (on ? "up" : "down") + " now");
        },

        onlocalstream: function() {
          // The subscriber stream is recvonly, we don't expect anything here
        },

        onremotestream: function(stream) {
          console.log(self.opaqueId, ":",  "Remote feed #" + remoteFeed.id)
          //stream.id = 'v' + remoteFeed.id;
          if (self.feeds[remoteFeed.publisher].loading)
            self.addVideoToMixer(stream.clone())
          self.$refs['v'+remoteFeed.id][0].muted = self.all_muted;
          self.feeds[remoteFeed.publisher].loading = false;

          var videoTracks = stream.getVideoTracks();
          if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
            self.feeds[remoteFeed.publisher].has_remote_video = false;
          } else {
            self.feeds[remoteFeed.publisher].has_remote_video = true;
          }
        },

        oncleanup: function() {
          console.log(self.opaqueId, ":", " ::: Got a cleanup notification (remote feed " + id + " / "  +  remoteFeed.id +") :::");
          if(self.feeds[remoteFeed.publisher]) {
            self.$delete(self.feeds,remoteFeed.publisher)
          }

          if (self.vr) {
            self.updateVRpositions()
          }

          self.$forceUpdate()
        }
      });
    },


    updateBitrateCap() {
      console.log(this.opaqueId, ":", "cap birate at", this.bitrate);
      this.pluginHandle.send( {
        "message":
          { "request": "configure", "bitrate": this.bitrate }
      });
      this.showBitrateOptions = false
    },

    changeFeedQuality(feed) {
      console.log(this.opaqueId, ":", "switch to substream", feed.substream);
      feed.send({
        "message": {
          request: "configure",
          substream: feed.substream
        },
        success: () => {}
      })
    },

    toggleRTPForward() {
      let self=this
      if (!self.isRTPforwarding) {
        self.rtp_dialog.open().then(function(r) {
          self.pluginHandle.send({
            "message": {
              request: "rtp_forward",
              room: self.room,
              publisher_id: self.username,
              host:r.host,
              audio_port:r.audio_port,
              video_port:r.video_port
            },
            success: function(r) {
              if (r.error_code) {
                self.alert.open("ERROR:" + r.error);
              } else {
                console.log(self.opaqueId, ":", "set up rtpstream", r.rtp_stream);
                self.isRTPforwarding = true
                self.rtp_forward = r.rtp_stream;
              }
            },
          })
        })
      } else {
        self.pluginHandle.send({
          "message": {
            request: "stop_rtp_forward",
            room: self.room,
            publisher_id: self.username,
            stream_id: self.rtp_forward.audio_stream_id,
          },
          success: function(r) {
            console.log(self.opaqueId, ":", "stopped rtp forward for audio stream", r);
          }
        })
        self.pluginHandle.send({
          "message": {
            request: "stop_rtp_forward",
            room: self.room,
            publisher_id: self.username,
            stream_id: self.rtp_forward.video_stream_id,
          },
          success: function(r) {
            console.log(self.opaqueId, ":", "stopped rtp forward for video stream", r);
            self.isRTPforwarding = false
            self.rtp_forward = null
          }
        })

      }
    },

    muteMe(muted) {
      console.log(this.opaqueId, ":", "set muteme:", muted);
      if (muted) {
          this.pluginHandle.muteAudio();
      } else {
        this.pluginHandle.unmuteAudio();
      }
      this.muted = this.pluginHandle.isAudioMuted();
      this.$emit("muteChanged", this.muted)
    },

    startRecording() {
      this.pluginHandle.send( {
        "message":
          { "request": "configure", "record": true}
      });
      this.is_recording = true
    },

    stopRecording() {
      this.pluginHandle.send( {
        "message":
          { "request": "configure", "record": false }
      });
      this.is_recording = false
    },
  }
}

</script>

<style lang="css" scoped>

.warn_is_on {
  color: var(--color-alert);
}
.headers { z-index:100}
.screen  {
  /* height:100%; */
  /*position: absolute;
  top:-120%;
  height:120%;
  width:200%;
  left:-50%;*/
  height: 0px;
  /*min-height:200px;*/
  opacity: 1;
  text-align: center;
  padding-bottom:1rem;
  margin-bottom:1rem;
  height: 0px; margin:0;padding:0;

}
.icons { foat:left; vertical-align: middle}
.fixed { position: fixed; top:5px; right:5px; border: 1px solid black; width: 15%}
.tile { padding:5px; position: relative; z-index:101}
.centered { position: absolute; top:50%; left:50%; transform:translate(-50%,-50%)}
.tile {

}
.screen { margin: 0 auto; padding:0}
.overlay {display:none}
.overlay .icons {   opacity: 0.7 }
.overlay .linked{  background:none }
.overlay .linked:hover { opacity: 1; color:white }
.name {
  position: absolute; top:2px; left: 50%; transform:translate(-50%,0);
  background:rgba(0,0,0, 0.2); color:white;padding:0.01rem 0.5rem;
  opacity: 0.7
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

.muted {
      opacity: 0.3;  position: absolute; width:auto; height:auto;
      top:50%; left:50%; transform:translate(-50%,-50%);
      color:white;
}
.muted .linked { color:white}

.video {
  z-index:151;
  position: absolute;
}
.videolocal {}

.flip {
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);
}

.stage {
  position: absolute;
  top:50%; left: 50%;
  transform:translate(-50%,-50%);
}
.stage .meta { bottom:10px}
.fullscreen { background:white}
.talking { border: 2px solid red}
.bitrate { font-size: 80%}

.video video {
  object-fit: cover;
  border-radius: 50%;
  width:100%;
  height:100%;
  background:black;
  border:0;
  box-shadow: 10px 6px 12px rgba(0,0,0,0.55);
}
.stage:hover .overlay { display:block }

.stage video {
  object-fit: contain;
  width:100%;

  border-radius: 0%;
}

.video:hover .overlay { display:block }


canvas {
  position: fixed; bottom:5px; left:5px;
  width:240px;
  border: 1px solid black;
  z-index:200;
  display: none;
}






</style>
