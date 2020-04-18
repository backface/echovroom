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
      <div class="column has-text-right">
        <minus-icon size="1x" class="icons linked" v-if="webRTCUp && is_open" @click="leaveRoom()"></minus-icon>
        <loader-icon size="1x" class="icons loading" v-if="!webRTCUp && is_open"></loader-icon>
        <plus-icon size="1x" class="icons linked" v-if="!is_open" @click="login()"></plus-icon>
      </div>
    </div>

    <fullscreen ref="fullscreen" :fullscreen.sync="fullscreen"
      @change="fullscreenChange"  background="white" v-if="is_open">

      <maximize-2-icon size="1.5x" class="icons linked" @click="toggle" v-if="!fullscreen"></maximize-2-icon>
      <minimize-2-icon size="1.5x" class="icons linked" @click="toggle" v-if="fullscreen"></minimize-2-icon>

      <div class="screen has-text-center" ref="screen" >

        <br />

        <div class="tile is-ancestor me" >
          <div class="tile" v-show="is_streaming"
            @mousedown="drag('start', my_pos, $event)"
            @mousemove="drag('drag', my_pos, $event)"
            @mouseup="drag('stop',my_pos, $event)"
            :style="{ position: 'fixed', top: my_pos.y + 'px', left: my_pos.x + 'px' }">

            <video ref="videolocal" class="videolocal" id="videolocal" autoplay playsinline muted="muted"/>

            <div class="overlay name">
              me
            </div>

            <div class="overlay meta">
              <mic-off-icon size="1x" class="icons linked" v-if="muted" @click="muteMe(false)"></mic-off-icon>
              <mic-icon size="1x" class="icons linked" v-if="!muted" @click="muteMe(true)"></mic-icon>
            </div>
          </div>

          <div v-for="feed in feeds" :key="feed.id" class="tile feed has-text-center"
            v-bind:style="{ position: 'fixed', top: feed.y + 'px', left: feed.x + 'px' }"
            @mousedown="drag('start', feed, $event)"
            @mousemove="drag('drag', feed, $event)"
            @mouseup="drag('stop',feed, $event)"
          >

              <video
                :id="'v'+feed.id" :ref="'feed-' + feed.id"
               :title="feed"
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
              </div>

          </div>
        </div>


      </div>
    </fullscreen>

  </div>
</template>

<script>
import Vue from 'vue';
import { janusMixin } from "@/mixins/janusMixin";
import fullscreen from 'vue-fullscreen'
import { Dialog, Loading } from 'buefy'
import Janus from '../janus'
import { MinusIcon, PlusIcon } from 'vue-feather-icons'
import { MicIcon, MicOffIcon, LoaderIcon } from 'vue-feather-icons'
import { VideoIcon, VideoOffIcon } from 'vue-feather-icons'
import { Maximize2Icon, Minimize2Icon } from 'vue-feather-icons'
import { MessageCircleIcon } from 'vue-feather-icons'

Vue.use(Dialog)
Vue.use(Loading)
Vue.use(fullscreen)

export default {
  name: 'Videoroom',

  mixins: [janusMixin],

  components: {
    MicIcon, MicOffIcon, LoaderIcon,
    VideoIcon, VideoOffIcon, MessageCircleIcon,
    MinusIcon, PlusIcon,
    Maximize2Icon, Minimize2Icon
  },

  props: {

  },

  data() {
    return {
      webRTCUp: null,
      pluginHandle: null,
      pluginName: "videoroom",
      opaqueId: this.$options._componentTag  + "-" + Janus.randomString(12),
      intervals: {},
      initial_participants: [],
      my_stream: null,
      is_streaming: false,
      video_off: false,
      muted: false,
      feeds: {},
      bitrateTimer: null,
      doSimulcast: false,
      fullscreen: false,
      tile_width: 256,
      tile_height: 256,
      dragging: null,
      my_pos: { x:0, y:0 },
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
      console.log(this.myJanus);
      this.janus = this.myJanus
      this.attachPlugin()
    }
  },

  destroyed () {
    this.janus.destroy();
  },

  methods: {

    toggle () {
      this.$refs['fullscreen'].toggle() // recommended

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
              self.$buefy.toast.open("Slow link! Bitrate is: " + (msg["current-bitrate"]/1000) + " kb")
            }

            else if(event === "talking") {
              self.$set(self.participants[msg.id], 'talking', true)
            }

            else if(event === "stopped-talking") {
              self.$set(self.participants[msg.id], 'talking', false)
            }

            else if(event === "joined") {
              // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
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
                //self.$forceUpdate();
              }

						} else if(event === "destroyed") {
							Janus.warn(self.opaqueId, "The room has been destroyed!");
							self.$buefy.dialog.alert(self.opaqueId, "The room has been destroyed");

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
                  //}
                  for (let f in self.feeds) {
                    f.detach()
                  }
                  for (let i in self.intervals) {
                    clearInterval(i)
                  }
                  self.feeds = {}
                  self.participants = {}
                  self.is_streaming = false;
                  self.webRTCUp = false;
                  self.is_open = false;
                  self.$forceUpdate()
                  return;
                } else if(self.feeds) {
                  if(self.feeds[msg["leaving"]]) {
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
                    self.feeds[unpublished].detach();
                    delete self.feeds[unpublished]
                    self.$forceUpdate();
                  }
                }

              } else if(msg["error"] !== undefined && msg["error"] !== null) {
                if(msg["error_code"] === 426) {
                  // This is a "no such room" error: give a more meaningful description
                  self.$buefy.dialog.alert(self.room + " does not exits");
                  self.is_open = false;
                } else {
                  self.$buefy.dialog.alert(msg["error"]);
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
              self.$buefy.dialog.alert("Our audio stream has been rejected, viewers won't hear us");
            }
            var video = msg["video_codec"];
            if(self.mystream && self.mystream.getVideoTracks() && self.mystream.getVideoTracks().length > 0 && !video) {
              // Video has been rejected
              self.$buefy.dialog.alert("Our video stream has been rejected, viewers won't see us");
              // Hide the webcam video
              /*$('#myvideo').hide();
              $('#videolocal').append(
          			'<div class="no-video-container">' +
          				'<i class="fa fa-video-camera fa-5 no-video-icon" style="height: 100%;"></i>' +
          				'<span class="no-video-text" style="font-size: 16px;">Video rejected, no webcam</span>' +
          			'</div>');
              */
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
          // We're not going to attach the local audio stream
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
      // Publish our stream
      let self = this
      self.pluginHandle.createOffer( {
        media: { audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: true },
        // Add data:true here if you want to publish datachannels as well
        // Publishers are sendonly
        // If you want to test simulcasting (Chrome and Firefox only), then
        // pass a ?simulcast=true when opening this demo page: it will turn
        // the following 'simulcast' property to pass to janus.js to true
        simulcast: self.doSimulcast,
        simulcast2: self.doSimulcast2,

        success: function(jsep) {
          Janus.debug(self.opaqueId, "Got publisher SDP!");
          Janus.debug(jsep);
          var publish = { "request": "configure", "audio": useAudio, "video": true };
          // You can force a specific codec to use when publishing by using the
          // audiocodec and videocodec properties, for instance:
          // 		publish["audiocodec"] = "opus"
          // to force Opus as the audio codec to use, or:
          // 		publish["videocodec"] = "vp9"
          // to force VP9 as the videocodec to use. In both case, though, forcing
          // a codec will only work if: (1) the codec is actually in the SDP (and
          // so the browser supports it), and (2) the codec is in the list of
          // allowed codecs in a room. With respect to the point (2) above,
          // refer to the text in janus.plugin.videoroom.jcfg for more details
          self.pluginHandle.send({"message": publish, "jsep": jsep});
        },
        error: function(error) {
          Janus.error(self.opaqueId, "x WebRTC error:", error);
          if (useAudio) {
            self.publishOwnFeed(true);
          } else {
            self.$buefy.dialog.alert("WebRTC error... " + JSON.stringify(error));
          }
        }
      });
    },

    unpublishOwnFeed() {
      // Unpublish our stream
      //$('#unpublish').attr('disabled', true).unbind('click');
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
              self.$buefy.toast.open("Publisher is using " + video + ", but Safari doesn't support it: disabling video");
              subscribe["offer_video"] = false;
          }
          remoteFeed.videoCodec = video;
          remoteFeed.send({"message": subscribe});
        },

        error: function(error) {
          Janus.error(self.opaqueId,"  -- Error attaching plugin...", error);
          self.$buefy.dialog.alert(self.opaqueId, "Error attaching plugin... " + error);
        },

        onmessage: function(msg, jsep) {
          Janus.debug(self.opaqueId, " ::: Got a message (subscriber) :::");
          Janus.debug(self.opaqueId, msg);
          var event = msg["videoroom"];
          Janus.debug(self.opaqueId, "REMOTE Event: " + event);

          if(msg["error"] !== undefined && msg["error"] !== null) {
            console.log(self.opaqueId, "GOT AN ERROR", msg);
            self.$buefy.dialog.alert(msg["error"]);

          } else if(event != undefined && event != null) {

            if(event === "attached") {
              // Subscriber created and attached

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

              Janus.log(self.opaqueId, "Successfully attached to feed " + remoteFeed.id + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);

            } else if(event === "event") {
              // Check if we got an event on a simulcast-related event from this publisher
              var substream = msg["substream"];
              var temporal = msg["temporal"];
              if((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
                if(!remoteFeed.simulcastStarted) {
                  remoteFeed.simulcastStarted = true;
                  // Add some new buttons
                  //addSimulcastButtons(remoteFeed.rfindex, remoteFeed.videoCodec === "vp8" || remoteFeed.videoCodec === "h264");
                }
                // We just received notice that there's been a switch, update the buttons
                //updateSimulcastButtons(remoteFeed.rfindex, substream, temporal);
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
                self.$buefy.dialog.alert("WebRTC error... " + JSON.stringify(error));
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
          console.log(self.feeds[remoteFeed.publisher]);

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

              // Check if the resolution changed too
              //var width = $("#remotevideo"+remoteFeed.rfindex).get(0).videoWidth;
              //var height = $("#remotevideo"+remoteFeed.rfindex).get(0).videoHeight;

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


  }
}

</script>

<style lang="css">
.videoroom .screen  {
  /* height:100%; */
  /*position: absolute;
  top:-120%;
  height:120%;
  width:200%;
  left:-50%;*/
  height: 40px;
  /*min-height:200px;*/
  background:white;
  color: #aaa;
  opacity: 1;
  text-align: center;
  padding-bottom:1rem;
  margin-bottom:1rem;
}
.videoroom .icons { foat:left; vertical-align: middle}
.videoroom .fixed { position: fixed; top:5px; right:5px; border: 1px solid black; width: 15%}
.videoroom .tile { padding:5px; position: relative; z-index:1001}
.videoroom .centered { position: absolute; top:50%; left:50%; transform:translate(-50%,-50%)}
.videoroom .tile {
  width:256px;
  height:256px;
  border-radius: 50%;
  display:flex !important;
}
.videoroom .screen .is-ancestor { margin: 0 auto}
.videoroom .overlay {

}
.videoroom .name {
  position: absolute; top:5px; left: 50%; transform:translate(-50%,0);
  background:rgba(0,0,0, 0.1); color:white;padding:0.1rem 0.5rem;
}
.videoroom .meta {
    position: absolute;
    left: 50%; bottom:5px; transform:translate(-50%,0);
    /*bottom:5px; left: 5px;*/
    /*background:white; color:#333;padding:0.3em;*/
    background:rgba(0,0,0, 0.1); color:white;padding:0.1rem 0.5rem;
}
.videoroom .fullscreen { background:white}
.videoroom .talking { border: 2px solid red}

video {
  object-fit: cover;
  border-radius: 50%;
}

@media (max-width:461px) {
  .videoroom .tile {
    width:128px;
    height:128px;
  }
}

</style>
