<template>
<div class="videoroom">

    <div class="columns is-mobile is-narrow headers is-gapless">
      <div class="column has-text-left is-10">
        <video-off-icon size="1x" class="icons" v-if="video_off" @click="showMe(false)"></video-off-icon>
        <video-icon size="1x" class="icons" v-if="!video_off" @click="showMe(true)"></video-icon>
        VROOM {{ room_info.description }} ({{ count + (webRTCUp ? 1 : 0) }})
        <mic-off-icon size="1x" class="icons linked" v-if="muted" @click="muteMe(false)"></mic-off-icon>
        <mic-icon size="1x" class="icons linked" v-if="!muted" @click="muteMe(true)"></mic-icon>


      </div>
      <div class="column has-text-left">
        <maximize-2-icon size="1x" class="icons linked" v-show="is_open" @click="toggleFullscreen" v-if="!fullscreen"></maximize-2-icon>
        <minimize-2-icon size="1x" class="icons linked" v-show="is_open" @click="toggleFullscreen" v-if="fullscreen"></minimize-2-icon>
      </div>
      <div class="column has-text-right">
        <minus-icon size="1x" class="icons linked" v-if="webRTCUp && is_open" @click="leaveRoom()"></minus-icon>
        <loader-icon size="1x" class="icons loading" v-if="!webRTCUp && is_open"></loader-icon>
        <plus-icon size="1x" class="icons linked" v-if="!is_open" @click="login()"></plus-icon>
      </div>
    </div>

    <fullscreen ref="fullscreen" :fullscreen.sync="fullscreen"
      @change="fullscreenChange"  background="white" v-if="is_open">

      <div class="screen has-text-center" ref="screen" >

        <div class="tile is-ancestor me" >
          <div class="tile" v-show="is_streaming"
            @mousedown="drag('start', my_pos, $event)"
            @mousemove="drag('drag', my_pos, $event)"
            @mouseup="drag('stop',my_pos, $event)"
            :style="{ position: 'fixed', top: my_pos.y + 'px', left: my_pos.x + 'px' }">


            <video ref="videolocal" class="videolocal" id="videolocal" autoplay playsinline muted="muted"/>
            <div class="overlay name">ME</div>
            <div class="overlay meta">
              <mic-off-icon size="1x" class="icons linked" v-if="muted" @click="muteMe(false)"></mic-off-icon>
              <mic-icon size="1x" class="icons linked" v-if="!muted" @click="muteMe(true)"></mic-icon>
              <settings-icon size="1x" class="icons linked" @click="showBitrateOptions=!showBitrateOptions"></settings-icon>
            </div>
            <div class="overlay options" v-show="showBitrateOptions">
              <v-select dark label="Cap Bitrate" dense v-model="bitrate" :items="bitrates" @change="updateBitrateCap"></v-select>
            </div>

          </div>

          <transition-group name="fade">
          <div v-for="feed in feeds" :key="feed.id" class="tile feed has-text-center"
            v-bind:style="{ position: 'fixed', top: feed.y + 'px', left: feed.x + 'px' }"
            @mousedown="drag('start', feed, $event)"
            @mousemove="drag('drag', feed, $event)"
            @mouseup="drag('stop',feed, $event)"
          >
              <video
                :id="'v'+feed.id" :ref="'feed-' + feed.id"
               :title="feed.display"
               autoplay playsinline
               :class="{ talking: participants[feed.publisher].talking }"
              />

              <div class="overlay name">
                {{ participants[feed.publisher].display }}
                <message-circle-icon size="1x" class="icons" v-if="participants[feed.publisher].talking"></message-circle-icon>
              </div>

              <div class="overlay meta">
                <loader-icon size="1x" class="icons loading centered" v-if="feed.loading == true"></loader-icon>
                <span class="bitrate">
                  {{ feed.bitrate }}
                </span>
                <settings-icon size="1x" class="icons linked"  @click="feed.showOptions=!feed.showOptions"></settings-icon>
              </div>

              <div class="overlay options" v-show="feed.showOptions">
                  <v-select dark label="Quality" dense v-model="feed.substream" :items="qualities" @change="changeFeedQuality(feed)"></v-select>
              </div>


          </div>
        </transition-group>

        </div>


      </div>
    </fullscreen>

    <toast ref="toast"></toast>
    <login-dialog ref="login"></login-dialog>
    <alert-dialog ref="alert"></alert-dialog>

    <video ref="videosrc" v-if="facetime" style="display:none"></video>
    <canvas ref="canvas" v-if="facetime" v-show="is_tracking" class="facetrackdebug"></canvas>
    <canvas ref="face" v-if="facetime" style="display:none" ></canvas>
    <div class="trackingstats" v-if="facetime" v-show="is_tracking" > {{ fps }} FPS </div>

  </div>
</template>

<script>
import Vue from 'vue';
import { janusMixin } from "@/mixins/janusMixin";
import { faceMixin } from "@/mixins/faceMixin";
import fullscreen from 'vue-fullscreen'
import Janus from '../janus'
import { MinusIcon, PlusIcon } from 'vue-feather-icons'
import { MicIcon, MicOffIcon, LoaderIcon } from 'vue-feather-icons'
import { VideoIcon, VideoOffIcon } from 'vue-feather-icons'
import { Maximize2Icon, Minimize2Icon } from 'vue-feather-icons'
import { MessageCircleIcon } from 'vue-feather-icons'
import { SettingsIcon } from 'vue-feather-icons'
import LoginDialog from '@/components/dialogs/LoginDialog'
import AlertDialog from '@/components/dialogs/AlertDialog'
import Toast from '@/components/dialogs/Toast'

Vue.use(fullscreen)

export default {
  name: 'Videoroom',

  mixins: [janusMixin, faceMixin],

  components: {
    MicIcon, MicOffIcon, LoaderIcon,
    VideoIcon, VideoOffIcon, MessageCircleIcon,
    MinusIcon, PlusIcon, SettingsIcon,
    Maximize2Icon, Minimize2Icon,
    LoginDialog, Toast, AlertDialog,
  },

  props: {
    facetime:  {
      type: Boolean,
      default: false
    },
  },

  data() {
    return {
      webRTCUp: null,
      pluginHandle: null,
      pluginName: "videoroom",
      opaqueId: this.$options._componentTag  + "-" + Janus.randomString(12),
      intervals: {},
      my_stream: null,
      is_streaming: false,
      video_off: false,
      muted: false,
      feeds: {},
      bitrateTimer: null,
      doSimulcast: true,
      fullscreen: false,
      tile_width: 256,
      tile_height: 256,
      dragging: null,
      my_pos: { x:0, y:0 },
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
        publishers: 100
      }
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

    toggleFullscreen () {
      this.$refs['fullscreen'].toggle()
    },

    drag( cmd, who) {
      if (cmd === "start")
        this.dragging = {
          who: who,
          last_x: event.clientX,
          last_y: event.clientY
        }
      else if (cmd === "stop")
        this.dragging = null
      else if (this.dragging != null) {
        let diff_x = this.dragging.last_x - event.clientX
        let diff_y = this.dragging.last_y - event.clientY
        this.dragging.who.x -= diff_x;
        this.dragging.who.y -= diff_y;
        this.dragging.last_x = event.clientX
        this.dragging.last_y = event.clientY
      }
    },

    fullscreenChange (fullscreen) {
      this.fullscreen = fullscreen
    },

    getWindowWidth() {
      return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    },

    getWindowHeight() {
      return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    },

    getNewPosition() {
      let self = this
      let overlapX = true, overlapY = true, i = 0
      let newPos = { x:0, y:0 }
      let positions = {}

      if (self.my_pos.x != 0 || self.my_pos.y != 0)
        positions = Object.assign({}, self.feeds,{ me: self.my_pos})

      while (overlapX && overlapY && i < 100) {
        newPos = {
          x: overlapX ? Math.random() * (self.getWindowWidth () - self.tile_width) : newPos.x,
          y: overlapY ? Math.random() * (self.getWindowHeight () - self.tile_height) : newPos.y
        }

        overlapX = false;
        overlapY = false;

        for (let p in positions) {
          if ( newPos.x > p.x && newPos.x < p.x + this.tile_width) {
            overlapX = true;
            break;
          }
          if ( newPos.y > p.y && newPos.y < p.y + this.tile_width) {
            overlapX = true;
            break;
          }
        }
        i += 1
      }
      if (i >= 99) console.log("could not find a spot");
      return newPos
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
          self.initRoom()
        },

        error: function(error) {
          console.error(self.opaqueId, "  -- Error attaching plugin...", error);
        },

        consentDialog: function(on) {
          Janus.debug(self.opaqueId, "Consent dialog should be " + (on ? "on" : "off") + " now");
        },

        mediaState: function(medium, on) {
          Janus.log(self.opaqueId, "Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
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
              Janus.log("Successfully joined room " + msg["room"] + " with ID " + msg["id"]);
              self.publishOwnFeed(true);

              // Any new feed to attach to?
              if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
                console.log(self.opaqueId, "Got a list of available publishers/feeds:", msg["publishers"]);
                msg["publishers"].forEach( function(user) {
                  let pos = self.getNewPosition()
                  user.x = pos.x;
                  user.y = pos.y;
                  self.$set(self.participants, user.id, user);
                  self.newRemoteFeed(user.id, user.display, user.audio_codec, user.video_codec);
                })
                self.count = Object.keys(self.participants).length
                self.$emit('participantNumberChanged', self.count)
              }

						} else if(event === "destroyed") {
							Janus.warn(self.opaqueId, "The room has been destroyed!");
							self.alert.open(self.opaqueId, "The room has been destroyed");

						} else if(event === "event") {
              // Any new feed to attach to?
							if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
                  console.log(self.opaqueId, "Got a list of publishers:", msg["publishers"]);
                  msg["publishers"].forEach( function(user) {
                    let pos = self.getNewPosition()
                    user.x = pos.x;
                    user.y = pos.y;
                    self.$set(self.participants, user.id, user);
                    self.newRemoteFeed(user.id, user.display, user.audio_codec, user.video_codec);
                  })
                  console.log(self.opaqueId, self.participants);
                  self.count = Object.keys(self.participants).length
                  self.$emit('participantNumberChanged', self.count)

              } else if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
                Janus.log("Publisher left: " + msg["leaving"]);

                if (msg["leaving"] == "ok") {
                  console.log("I left the room");
                  // That's us
                  //for (let f in self.feeds) {
                  //  f.detach()
                  // }

                  for (let i in self.intervals) {
                    clearInterval(i)
                  }
                  self.feeds = {}
                  self.participants = {}
                  self.is_streaming = false;
                  self.webRTCUp = false;
                  self.is_open = false;
                  self.pluginHandle.hangup();
                  self.$forceUpdate()
                  self.$emit('leftRoom')
                  return;

                } else if(self.feeds) {
                  if(self.feeds[msg["leaving"]]) {
                    clearInterval(self.intervals[msg["leaving"]])
                    self.feeds[msg["leaving"]].detach();
                    delete self.feeds[msg["leaving"]]
                  }
                }
                delete self.participants[ msg['leaving'] ]
                self.count = Object.keys(self.participants).length
                self.$forceUpdate()

              } else if(msg["unpublished"] !== undefined && msg["unpublished"] !== null) {
                // One of the publishers has unpublished?
                var unpublished = msg["unpublished"];
                Janus.log("Publisher unpublished: " + unpublished);
                if(unpublished === 'ok') {
                  // That's us
                  self.$refs.videolocal.detach();
                  self.is_streaming = false;
                  return;
                }
                else if(self.feeds) {
                  if(self.feeds[unpublished]) {
                    clearInterval(self.intervals[unpublished])
                    self.feeds[unpublished].detach();
                    delete self.feeds[unpublished]
                    self.$forceUpdate();
                  }
                }

              } else if(msg["error"] !== undefined && msg["error"] !== null) {
                if(msg["error_code"] === 426) {
                  self.alert.open("Room " + self.room + " does not exits");
                  self.is_open = false;
                } else {
                  self.alert.open(msg["error"]);
                  self.webRTCUp = true
                }
              }
            }
          }

          if(jsep !== undefined && jsep !== null) {
            Janus.debug(self.opaqueId, "Handling SDP as well...");
            Janus.debug(jsep);
            self.pluginHandle.handleRemoteJsep({jsep: jsep});
            // Check if any of the media we wanted to publish has
            // been rejected (e.g., wrong or unsupported codec)
            var audio = msg["audio_codec"];
            if(self.mystream && self.mystream.getAudioTracks() && self.mystream.getAudioTracks().length > 0 && !audio) {
              // Audio has been rejected
              self.alert.open("Our audio stream has been rejected, viewers won't hear us");
            }
            var video = msg["video_codec"];
            if(self.mystream && self.mystream.getVideoTracks() && self.mystream.getVideoTracks().length > 0 && !video) {
              // Video has been rejected
              self.alert.open("Our video stream has been rejected, viewers won't see us");
            }
          }
        },

        onlocalstream: function(stream) {
          console.log(self.opaqueId, "we have a local stream");
          Janus.debug(self.opaqueId, " ::: Got a local stream :::");
          Janus.debug(self.opaqueId, stream);

          Janus.attachMediaStream(self.$refs.videolocal, stream);
          self.my_pos = self.getNewPosition()
          self.is_streaming = true;
          self.muteMe(self.muted)
          // We're not going to attach the local audio stream!
				},

        onremotestream: function() {
          // The publisher stream is sendonly, we don't expect anything here
				},

        oncleanup: function() {
          Janus.log(self.opaqueId, " ::: Got a cleanup notification :::");

        }
      });
    },

    publishOwnFeed(useAudio) {
      let self = this

      Janus.listDevices((devices) => {
        devices.forEach( (d) => console.log(d));
      })

      if (this.facetime) {
        this.setupFaceTime().then( () => {
          self.pluginHandle.createOffer( {
            stream: this.face_canvas.captureStream(),
            simulcast: self.doSimulcast,

            success: function(jsep) {
              Janus.debug(self.opaqueId, "Got publisher SDP!");
              Janus.debug(jsep);
              var publish = { "request": "configure", "audio": useAudio, "video": true };
              self.pluginHandle.send({"message": publish, "jsep": jsep});
            },

            error: function(error) {
              Janus.error(self.opaqueId, "x WebRTC error:", error);
              if (useAudio) {
                self.publishOwnFeed(true);
              } else {
                self.alert.open("WebRTC error... " + JSON.stringify(error));
              }
            }
          });

        })

      } else {
        self.pluginHandle.createOffer( {
          // media: { video: capture, captureDesktopAudio: true, audioRecv: true, videoRecv: false},	// Screen sharing Publishers are sendonly
          //media: { audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: true, data: false }, // standard
          media: {  audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: true },

          simulcast: self.doSimulcast,
          //simulcast2: self.doSimulcast2,

          success: function(jsep) {
            Janus.debug(self.opaqueId, "Got publisher SDP!");
            Janus.debug(jsep);
            var publish = { "request": "configure", "audio": useAudio, "video": true };
            self.pluginHandle.send({"message": publish, "jsep": jsep});
          },
          error: function(error) {
            Janus.error(self.opaqueId, "x WebRTC error:", error);
            if (useAudio) {
              self.publishOwnFeed(true);
            } else {
              self.alert.open("WebRTC error... " + JSON.stringify(error));
            }
          }
        });
      }




    },

    unpublishOwnFeed() {
      var unpublish = { "request": "unpublish" };
      this.pluginHandle.send({"message": unpublish});
    },

    newRemoteFeed(id, display, audio, video) {
      // A new feed has been published, create a new plugin handle and attach to it as a subscriber
      let self = this
      let remoteFeed = null;
      console.log(id);

      self.janus.attach({
        plugin: "janus.plugin." + self.pluginName,
        opaqueId: self.opaqueId,

        success: function(pluginHandle) {
          remoteFeed = pluginHandle;
          remoteFeed.simulcastStarted = false;
          Janus.log(self.opaqueId, "Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
          Janus.log(self.opaqueId, "  -- This is a subscriber");
          Janus.log(self.opaqueId, remoteFeed.getId(), id);
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
          Janus.debug(self.opaqueId, " ::: Got a message (subscriber) :::");
          Janus.debug(self.opaqueId, msg);
          var event = msg["videoroom"];
          Janus.debug(self.opaqueId, "REMOTE Event: " + event);

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
                newfeed.x = self.participants[msg["id"]].x
                newfeed.y = self.participants[msg["id"]].y
                self.$set(self.feeds, msg.id, newfeed)
              }
              Janus.log(self.opaqueId,
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
            Janus.debug(self.opaqueId, "Handling SDP as well...");
            Janus.debug(jsep);
            // Answer and attach
            remoteFeed.createAnswer( {
              jsep: jsep,
              // Add data:true here if you want to subscribe to datachannels as well
              // (obviously only works if the publisher offered them in the first place)

              media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
              success: function(jsep) {
                Janus.debug(self.opaqueId,"Got SDP!");
                Janus.debug(jsep);
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

        webrtcState: function(on) {
          Janus.log(self.opaqueId, "Janus says this WebRTC PeerConnection (feed #" + remoteFeed.id + ") is " + (on ? "up" : "down") + " now");
        },

        onlocalstream: function() {
          // The subscriber stream is recvonly, we don't expect anything here
        },

        onremotestream: function(stream) {
          Janus.log(self.opaqueId, "Remote feed #" + remoteFeed.id)
          console.log("feed", self.feeds[remoteFeed.publisher]);

          Janus.attachMediaStream(document.getElementById('v'+ remoteFeed.id), stream)
          self.feeds[remoteFeed.publisher].loading = false;
          self.$forceUpdate();

          var videoTracks = stream.getVideoTracks();
          if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
            self.feeds[remoteFeed.publisher].has_remote_video = false;
          } else {
            self.feeds[remoteFeed.publisher].has_remote_video = true;
          }

          if(Janus.webRTCAdapter.browserDetails.browser === "chrome"
            || Janus.webRTCAdapter.browserDetails.browser === "firefox" ||
            Janus.webRTCAdapter.browserDetails.browser === "safari") {

              if (!self.intervals[remoteFeed.publisher])
                self.intervals[remoteFeed.publisher] = setInterval(() => {
                    self.feeds[remoteFeed.publisher].bitrate = self.feeds[remoteFeed.publisher].getBitrate();
                    self.$set(self.feeds[remoteFeed.publisher],'bitrate', self.feeds[remoteFeed.publisher].getBitrate() )
                    self.$set(self.feeds[remoteFeed.publisher],'muted', self.feeds[remoteFeed.publisher].isAudioMuted() )
                }, 1000);
              // // TODO: Check if the resolution changed too
          }
        },

        oncleanup: function() {
          Janus.log(" ::: Got a cleanup notification (remote feed " + id + " / "  +  remoteFeed.id +") :::");
          console.log(self.intervals[id]);
          clearInterval(self.intervals[id])
        }
      });
    },

    muteMe(muted) {
      if (muted) {
          this.pluginHandle.muteAudio();
      } else {
        this.pluginHandle.unmuteAudio();
      }
      this.muted = this.pluginHandle.isAudioMuted();
    },

    updateBitrateCap() {
      console.log(this.bitrate);
      this.pluginHandle.send( {
        "message":
          { "request": "configure", "bitrate": this.bitrate }
      });
      this.showBitrateOptions = false
    },

    changeFeedQuality(feed) {
      console.log(feed.substream);
      feed.send({
        "message": {
          request: "configure",
          substream: feed.substream,
          success: (r) => { console.log(r)}
        }
      })
    }
  }
}

</script>

<style lang="css" scoped>
.videoroom .screen  {
  /* height:100%; */
  /*position: absolute;
  top:-120%;
  height:120%;
  width:200%;
  left:-50%;*/
  height: 0px;
  /*min-height:200px;*/
  background:white;
  color: #aaa;
  opacity: 1;
  text-align: center;
  padding-bottom:1rem;
  margin-bottom:1rem;
  height: 0px; margin:0;padding:0;
}
.videoroom .icons { foat:left; vertical-align: middle}
.videoroom .fixed { position: fixed; top:5px; right:5px; border: 1px solid black; width: 15%}
.videoroom .tile { padding:5px; position: relative; z-index:101}
.videoroom .centered { position: absolute; top:50%; left:50%; transform:translate(-50%,-50%)}
.videoroom .tile {

}
.videoroom .screen .is-ancestor { margin: 0 auto}
.videoroom .overlay .icons {   opacity: 0.7 }
.videoroom .overlay .linked{  background:none }
.videoroom .overlay .linked:hover { opacity: 1; color:white }
.videoroom .name {
  position: absolute; top:5px; left: 50%; transform:translate(-50%,0);
  background:rgba(0,0,0, 0.1); color:white;padding:0.1rem 0.5rem;
  opacity: 0.7
}
.videoroom .meta {
    position: absolute; opacity: 0.7;
    left: 50%; bottom:5px;transform:translate(-50%,0);
    /*bottom:5px; left: 5px;*/
    /*background:white; color:#333;padding:0.3em;*/
    background:rgba(0,0,0, 0.1); color:white;padding:0.1rem 0.5rem;
}
.videoroom .options {
    opacity: 0.7;  position: absolute;
    left: 50%; bottom:45px;  height:45px;transform:translate(-50%,0);
    /*bottom:5px; left: 5px;*/
    /*background:white; color:#333;padding:0.3em;*/
     background:rgba(0,0,0, 0.1); color:white;padding:0.5rem 0.5rem;
}


.videoroom .fullscreen { background:white}
.videoroom .talking { border: 2px solid red}

video {
  object-fit: cover;
  border-radius: 50%;
  width:256px;
  height:256px;
  background:black;
}

.facetrackdebug {
  position: fixed; top:5px; right:5px;
  width:240px;
  border: 1px solid black;
  z-index:200;
}

.trackingstats {
    position: fixed; top:5px; right:5px;
    width:100px; background:rgba(0,0,0,0.5); color: white; padding: 2px 10px;
    text-align:center;
    z-index:201;
  }

@media (max-width:461px) {
  .videoroom .tile {
    /*width:128px;
    height:128px;*/
  }
}

/* Enter and leave animations can use different */
/* durations and timing functions.              */
.pop-enter-active {
  transition: all 2.3s ease;
}
.pop-leave-active {
  transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.pop-enter, .pop-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(10px);
  width: 0;
  height:0
}

</style>
