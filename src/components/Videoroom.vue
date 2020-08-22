<template>
<div class="videoroom" ref="videoroom">

    <div class="columns is-mobile is-narrow headers is-gapless">
      <div class="column has-text-left is-10">

        <template v-if="allowUnpublish">
          <a  v-if="!is_streaming" @click="publishOwnFeed(true)" title="publish video">
            <video-off-icon size="1x" class="icons linked"></video-off-icon>
          </a>
          <a v-if="is_streaming" @click="unpublishOwnFeed" title="unpublish video">
            <video-icon size="1x" class="icons linked"></video-icon>
          </a>
        </template>
        <template v-else>
          <video-off-icon v-if="!is_streaming" size="1x" class="icons"></video-off-icon>
          <video-icon  v-if="is_streaming" size="1x" class="icons"></video-icon>
        </template>

        <span v-if="vr">VR/</span>&nbsp; Vroom
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

        <a v-if="betaOptions && allowFacetime && !facetime && is_streaming" title="facetime is off" @click="toggleFacetime">
          <eye-off-icon size="1x" class="icons linked"></eye-off-icon>
        </a>
        <a v-if="betaOptions && allowFacetime && facetime && is_streaming" title="facetime is on" @click="toggleFacetime">
          <eye-icon size="1x" class="icons linked"></eye-icon>
        </a>

        <a v-if="allowScreenshare && is_streaming" v-show="is_open" @click="toggleScreenShare" title="share screen">
          <monitor-icon size="1x" class="icons linked {}" :style="{ color: screenshare ? 'var(--color-alert)' : '' }"></monitor-icon>
        </a>

        <a v-if="advancedOptions && allowStageSends && is_streaming && !vr" v-show="is_open" @click="sendMeToStage(username !=onstage)" title="Send me to stage">
          <airplay-icon size="1x" class="icons linked"
            :style="{ color: username == onstage && onstage != null ? 'var(--color-alert)' : '' }"
          ></airplay-icon>
        </a>

        <a v-if="advancedOptions && allowRTPforward && is_streaming" title="configure RTP Forward" @click="toggleRTPForward">
          <arrow-right-icon size="1x" class="icons linked"
              :style="{ color: isRTPforwarding ? 'var(--color-alert)' : '' }"
            ></arrow-right-icon>
        </a>

        <a v-if="advancedOptions && is_streaming && !is_recording" title="start recording" @click="startRecording">
          <circle-icon size="1x" class="icons linked"
              :style="{ color: isRTPforwarding ? 'var(--color-alert)' : '' }"
            ></circle-icon>
        </a>
        <a v-if="advancedOptions && is_streaming && is_recording" title="stop recording" @click="stopRecording">
          <stop-circle-icon size="1x" class="icons linked"
              :style="{ color: 'var(--color-alert)' }"
            ></stop-circle-icon>
        </a>


        <a v-if="!vr" @click="toggleForce" title="toggle force-directed layout">
          <compass-icon size="1x" class="icons linked"  :style="{ color: use_force ? 'var(--color-alert)' : '' }"></compass-icon>
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

    <div class="screen has-text-center" ref="screen">
      <div class="vrscreen"
        ref="screen" v-if="vr"
        :style="'width:' + getWindowWidth() + 'px; height:' + top + 'px'">

        <a-scene embedded background="color: #ffffff" loading-screen="dotsColor: black; backgroundColor: #ffffff"
          >
          <a-assets>
            <img id="grid" src="/img/grid.png" />
            <video ref="videolocal" id="videolocal" autoplay loop crossorigin="anonymous" muted></video>
            <video v-for="feed in feeds" :key="feed.id" :id="'v'+feed.id" :ref="'v' + feed.id" autoplay playsinline></video>
          </a-assets>
          <a-plane rotation="-90 0 0" width="100" height="100" material="src:#grid;repeat:200 200"
          ></a-plane>

          <a-plane
            material="src: #videolocal"
            :position="my_pos.cx + ' 1.4 ' + my_pos.cy"
            :rotation="'0 ' + my_pos.rotation + ' 0'"
            :width="my_pos.cw" :height="my_pos.ch"
            shadow
          ></a-plane>

          <template v-for="feed in feeds">
            <a-plane v-if="!feed.loading" :key="'p'+feed.id"
              :material="'src: #v'+feed.id"
              :position="feed.cx + ' 1.4 ' + feed.cy"
              :rotation="'0 ' + feed.rotation + ' 0'"
              :width="feed.cw" :height="feed.ch"
              shadow>
            </a-plane>
          </template>

        </a-scene>
      </div>
    </div>

    <fullscreen ref="fullscreen" :fullscreen.sync="fullscreen"
      @change="fullscreenChange"  background="white" v-if="is_open">

      <div class="screen has-text-center" ref="screen" v-if="!vr">

          <template v-if="isMobile">
            <div v-show="is_streaming" class="video me" :class="username == onstage ? 'stage' : 'video'"
              v-bind:style="username != onstage ?  { position: 'fixed', top: my_pos.y + 'px', left: my_pos.x + 'px', width: tile_width + 'px !important' , height: tile_width + 'px !important' } : {}"
              v-hammer:pan="(event) => drag('drag', my_pos, event)"
              v-hammer:panstart="(event) => drag('start', my_pos, event)"
              v-hammer:panend="(event) => drag('stop', my_pos, event)"
            >
              <video  ref="videolocal" class="videolocal" id="videolocal" autoplay playsinline muted="muted"
                :class="screenshare && is_streaming? '' : 'flip'" />

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
          </template>

          <template v-else>
            <div v-show="is_streaming" class="video me" :class="username == onstage ? 'stage' : 'video'"
              v-bind:style="username != onstage ?  { position: 'fixed', top: my_pos.y + 'px', left: my_pos.x + 'px', width: tile_width + 'px !important' , height: tile_width + 'px !important' } : {}"
              @mousedown="drag('start', my_pos, $event)"
              @mousemove="drag('drag', my_pos, $event)"
              @mouseup="drag('stop',my_pos, $event)"
              @mouseout="drag('stop',my_pos, $event)"
            >
              <video ref="videolocal" class="videolocal" id="videolocal" autoplay playsinline muted="muted"
              :class="screenshare && is_streaming? '' : 'flip'" />/>

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
          </template>


          <transition-group name="fade">

            <template v-if="isMobile">
              <div v-for="feed in feeds" :key="feed.id" :class="feed.publisher == onstage ? 'stage' : 'video' "
                  :style="feed.publisher != onstage ? { position: 'fixed', top: feed.y + 'px', left: feed.x + 'px', width: tile_width + 'px !important', height: tile_width + 'px !important' } : {}"
                  v-hammer:pan="(event) => drag('drag', feed, event)"
                  v-hammer:panstart="(event) => drag('start', feed, event)"
                  v-hammer:panend="(event) => drag('stop', feed, event)"
                  class="publisher"
                >
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
                  <a @click="makeVideoFullscreen" title="fullscreen">
                    <maximize-2-icon size="1x" class="icons linked"></maximize-2-icon>
                  </a>
                  <a @click="sendToStage(feed.publisher)" title="send to stage">
                    <airplay-icon v-if="allowStageSends" size="1x" class="icons linked"></airplay-icon>
                  </a>
                </div>

                <div class="overlay options" v-show="feed.showOptions">
                    <v-select dark label="Quality" dense v-model="feed.substream" :items="qualities" @change="changeFeedQuality(feed)"></v-select>
                </div>

              </div>

            </template>

            <template v-else>
              <div v-for="feed in feeds" :key="feed.id" :class="feed.publisher == onstage ? 'stage' : 'video' "
                  :style="feed.publisher != onstage ? { position: 'fixed', top: feed.y + 'px', left: feed.x + 'px', width: tile_width + 'px !important', height: tile_width + 'px !important' } : {}"
                  @mousedown="drag('start', feed, $event)"
                  @mousemove="drag('drag', feed, $event)"
                  @mouseup="drag('stop',feed, $event)"
                  @mouseout="drag('stop',feed, $event)"
                >
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
                    <a @click="makeVideoFullscreen" title="fullscreen">
                      <maximize-2-icon size="1x" class="icons linked"></maximize-2-icon>
                    </a>
                    <a @click="sendToStage(feed.publisher)" title="send to stage">
                      <airplay-icon v-if="allowStageSends" size="1x" class="icons linked"></airplay-icon>
                    </a>
                  </div>

                  <div class="overlay options" v-show="feed.showOptions">
                      <v-select dark label="Quality" dense v-model="feed.substream" :items="qualities" @change="changeFeedQuality(feed)"></v-select>
                  </div>

                </div>
            </template>

          </transition-group>
      </div>

    </fullscreen>

    <toast ref="toast"></toast>
    <login-dialog ref="login"></login-dialog>
    <alert-dialog ref="alert"></alert-dialog>
    <rtp-dialog ref="rtp_dialog"></rtp-dialog>

    <video ref="videosrc" style="display:none"></video>
    <canvas ref="canvas" v-show="facetime && is_tracking" class="facetrackdebug"></canvas>
    <canvas ref="face" style="display:none" ></canvas>
    <div class="trackingstats" v-if="facetime" v-show="facetime && is_tracking" > {{ fps }} FPS </div>

  </div>
</template>

<script>
import Vue from 'vue';
import { janusMixin } from "@/mixins/janusMixin";
import { faceMixin } from "@/mixins/faceMixin";
import fullscreen from 'vue-fullscreen'
import Janus from '../janus'
import screenfull from 'screenfull'
import { MinusIcon, PlusIcon } from 'vue-feather-icons'
import { MicIcon, MicOffIcon, LoaderIcon } from 'vue-feather-icons'
import { VideoIcon, VideoOffIcon } from 'vue-feather-icons'
import { Maximize2Icon } from 'vue-feather-icons'
import { MessageCircleIcon } from 'vue-feather-icons'
import { SettingsIcon } from 'vue-feather-icons'
import { MonitorIcon, AirplayIcon } from 'vue-feather-icons'
import { CompassIcon, CircleIcon, StopCircleIcon } from 'vue-feather-icons'
import { EyeOffIcon, EyeIcon } from 'vue-feather-icons'
import { Volume2Icon, VolumeXIcon, ArrowRightIcon } from 'vue-feather-icons'
import LoginDialog from '@/components/dialogs/LoginDialog'
import AlertDialog from '@/components/dialogs/AlertDialog'
import RtpDialog from '@/components/dialogs/RtpDialog'
import Toast from '@/components/dialogs/Toast'
import { VueHammer } from 'vue2-hammer'
import { forceSimulation }  from 'd3-force';
import { forceManyBody }  from 'd3-force';
//import { forceCenter }  from 'd3-force';
import { forceCollide }  from 'd3-force';
import { forceRadial }  from 'd3-force';
import "aframe"

Vue.use(fullscreen)
Vue.use(VueHammer)

export default {
  name: 'Videoroom',

  mixins: [janusMixin, faceMixin],

  components: {
    MicIcon, MicOffIcon, LoaderIcon,
    VideoIcon, VideoOffIcon, MessageCircleIcon,
    MinusIcon, PlusIcon, SettingsIcon, ArrowRightIcon,
    Maximize2Icon, CompassIcon, //Minimize2Icon,
    MonitorIcon, AirplayIcon, EyeOffIcon, EyeIcon,
    LoginDialog, Toast, AlertDialog, RtpDialog,
    Volume2Icon, VolumeXIcon, CircleIcon, StopCircleIcon
  },

  props: {
    allowFacetime:  {
      type: Boolean,
      default: true
    },
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
    vr: {
      type: Boolean,
      default: false
    },
    doMute: {
      type: Boolean,
      default: false
    },
    betaOptions: {
      type: Boolean,
      default: false
    },
    advancedOptions: {
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
      tile_width: 256,
      tile_height: 256,
      dragging: null,
      my_pos: { x:0, y:0, cx:0, cy:0, cw:0, ch:0 },
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
      onstage: null,
      force: null,
      use_force: true,
      force_positions: [],
      vr_positions: [],
      force_max_area_perc: 45,
      force_used_area_perc: 0,
      top: 0,
      rtp_dialog:null,
      isRTPforwarding:false,
      rtp_forward: null,
      is_recording: false
    }
  },

  mounted () {
    console.log(this.$options._componentTag + " mounted");
    console.log("client sceen is ", this.getWindowWidth(), "x", this.getWindowHeight());
    this.rtp_dialog = this.$refs.rtp_dialog;
    if (this.myJanus == null) {
      this.loadConfig()
    } else {
      console.log("got a janus session");
      this.janus = this.myJanus
      this.attachPlugin()
    }
    this.top = this.$refs['videoroom'].getBoundingClientRect().top - 70;
    this.force = forceSimulation()
      .force('charge', forceManyBody().strength(10))
      .force('collision', forceCollide().radius(this.tile_width/2+ 5))
      .force('r', forceRadial()
        .radius( (Math.min(this.getWindowWidth(), this.getWindowHeight()) / 2))
        .x(this.getWindowWidth()/ 2 - this.tile_width/2)
        .y(this.getWindowHeight()/ 2 - this.tile_width/2)
      )
      .on('tick', this.force_tick);
  },

  destroyed () {
    if (this.janus)
      this.janus.destroy();
  },

  watch: {
    login_password: function(value) {
      this.password = value
    },
    doMute: function(value) {
      console.log("got mute me request");
      this.muteMe(value)
    }
  },

  computed: {

  },

  methods: {

    restartForces() {
      console.log("reseting forces");
      let self = this;

      self.force_used_area_perc =
          (self.tile_width/2 * self.tile_width/2 * Math.PI * self.force_positions.length) / // kugel area
          (self.getWindowWidth() * self.getWindowHeight()) // window already
           *  100 // percentage

      while (self.force_used_area_perc > self.force_max_area_perc) {
        self.tile_width--;
        self.force_used_area_perc =
            (self.tile_width/2 * self.tile_width/2 * Math.PI * self.force_positions.length) / // kugel area
            (self.getWindowWidth() * self.getWindowHeight()) // window already
             *  100 // percentage
      }

      self.force = self.force.nodes(self.force_positions)
        .force('collision', forceCollide().radius(self.tile_width/2+ 5))
        .force('r', forceRadial()
          .radius( (Math.min(self.getWindowWidth(), self.getWindowHeight()) / 2))
          .x(self.getWindowWidth()/ 2 - self.tile_width/2)
          .y(self.getWindowHeight()/ 2 - self.tile_width/2)
        )
      self.force.alpha(1).restart()
    },

    updateVRpositions() {
      let self =this;
      let len = Object.keys(self.feeds).length + 1;
      let r = 4;
      let start = -90
      let i = 0
      let spread = 180;
      let pos = { x: 0, y: 1 }
      let total_length = r * Math.PI

      if (len > 7) {
        spread = 360
        pos = { x: 0, y: 0 }
        total_length = 2 * r * Math.PI
      }

      let d = (i * spread/len) + (spread/len)/2 - start;
      let width = Math.min(total_length/2, total_length / len);

      self.$set(self.my_pos,"cx",  pos.x + r * Math.sin( d * Math.PI / 180))
      self.$set(self.my_pos,"cy",  pos.y + r * Math.cos( d * Math.PI / 180))
      self.$set(self.my_pos,"cw",  width)
      self.$set(self.my_pos,"ch",  width / self.my_pos.ratio)
      self.$set(self.my_pos,"rotation", 180 + d)

      if (self.feeds)
        for (let k of Object.keys(self.feeds)) {
          i++
          d = (i * spread/len) + (spread/len)/2 - start;
          let cx = pos.x + r * Math.sin( d * Math.PI / 180)
          let cy = pos.y + r * Math.cos( d * Math.PI / 180)
          self.$set(self.feeds[k], "cx", cx)
          self.$set(self.feeds[k], "cy", cy)
          self.$set(self.feeds[k], "cw", width)
          self.$set(self.feeds[k], "ch", width / self.feeds[k].ratio)
          self.$set(self.feeds[k], "rotation", 180 + d)
        }
        //self.$forceUpdate()
    },

    toggleFullscreen () {
      this.$refs['fullscreen'].toggle()
    },

    force_tick() {
      let self = this;
      self.force_positions.forEach( (i) => {
        if (i.id == 0) {
          self.my_pos.x = Math.max(0, i.x);
          self.my_pos.x = Math.min(self.getWindowWidth() - self.tile_width, self.my_pos.x );
          self.my_pos.y = Math.max(0, i.y);
          self.my_pos.y = Math.min(self.getWindowHeight() - self.tile_width, self.my_pos.y);
        } else {
          if (self.feeds[i.id]) {
            self.feeds[i.id].x = Math.max(0, i.x);
            self.feeds[i.id].x = Math.min(self.getWindowWidth() - self.tile_width, self.feeds[i.id].x );
            self.feeds[i.id].y = Math.max(0, i.y);
            self.feeds[i.id].y = Math.min(self.getWindowHeight() - self.tile_width, self.feeds[i.id].y);
          }
        }

      })
    },


    drag( cmd, who, event) {
      let x = 0
      let y = 0

      // ignore mouse events coming from hammer
      // must be better was to do this
      //if (event.pointerType == "mouse") {
      //  return;
    //  }
      if (event.pointerType) {
        x = event.center.x
        y = event.center.y
      } else {
        x = event.clientX
        y = event.clientY
      }

      if (cmd === "start")
        this.dragging = {
          who: who,
          last_x: x,
          last_y: y

        }
        else if (cmd === "stop") {
          this.dragging = null
          if (this.use_force) {
            this.force.alpha(1).restart()
          }
        }
      else if (this.dragging != null) {

        let diff_x = this.dragging.last_x - x
        let diff_y = this.dragging.last_y - y
        this.dragging.who.x -= diff_x;
        this.dragging.who.y -= diff_y;
        this.dragging.last_x = x
        this.dragging.last_y = y
        //if (this.use_force) {
        // also change positison for force layout
        let id = who.publisher ? who.publisher : 0
        let item = this.force_positions.find( d  => d.id == id)
        if (item) {
          item.x = this.dragging.who.x
          item.y = this.dragging.who.y
        }
        //}
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
          //Janus.debug(" ::: Got a message :::");
          //Janus.debug(msg);
          var event = msg[self.pluginName];
					Janus.debug("Event: " + event);

          //console.log(self.opaqueId, msg, event);

          if(event != undefined && event != null) {

            if(event === "slow_link") {
              //ignre
              //self.toast.open("Slow link! Bitrate is: " + (msg["current-bitrate"]/1000) + " kb")
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

              self.$emit("joined");
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

                  self.feeds = {}
                  self.participants = {}
                  self.is_streaming = false;
                  self.webRTCUp = false;
                  self.is_open = false;
                  self.pluginHandle.hangup();
                  self.$forceUpdate()
                  self.$emit('leftRoom')
                  self.force_positions = []
                  self.restartForces()

                  if (self.vr) {
                    self.updateVRpositions()
                  }

                  return;

                } else if(self.feeds) {
                  if(self.feeds[msg["leaving"]]) {
                    self.feeds[msg["leaving"]].detach();
                    self.$delete(self.feeds,msg["leaving"])
                  }
                }
                if (self.use_force) {
                  self.force_positions = self.force_positions.filter( d => d.id !== msg['leaving'] );
                  self.restartForces()
                }

                if (self.vr) {
                  self.updateVRpositions()
                }

                self.$delete(self.participants,msg['leaving'])
                self.count = Object.keys(self.participants).length
                //self.$forceUpdate()

              } else if(msg["unpublished"] !== undefined && msg["unpublished"] !== null) {
                // One of the publishers has unpublished?
                var unpublished = msg["unpublished"];
                Janus.log("Publisher unpublished: " + unpublished);
                if(unpublished === 'ok') {
                  // That's us
                  //self.$refs.videolocal.detach();
                  self.is_streaming = false;
                  return;
                }
                else if(self.feeds) {
                  if(self.feeds[unpublished]) {
                    self.feeds[unpublished].detach();
                    self.$delete(self.feeds, unpublished)
                    if (self.use_force)
                      self.$forceUpdate();
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

          if (self.use_force) {
            self.resetForces()
          }
          if (self.vr)
            setTimeout(function() {
              self.my_pos.ratio = self.$refs.videolocal.videoWidth / self.$refs.videolocal.videoHeight
              self.updateVRpositions()
            }, 1000)

          self.is_streaming = true;
          self.muteMe(self.muted)
          if (self.muted)
            self.toast.open("Be aware you are muted! (Click on the microphon icon to unmute yourself!)",
              {timeout: 5000 }
            );
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

    publishOwnFeed(useAudio=true) {
      let self = this

      //Janus.listDevices((devices) => {
      //    devices.forEach( (d) => console.log(d));
      // })

      if (this.facetime) {
        this.setupFaceTime().then( () => {
          let capture = this.face_canvas.captureStream()
          navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(function (audioStream) {
              capture.addTrack(audioStream.getAudioTracks()[0]);
              self.pluginHandle.createOffer( {
                stream: capture,
                simulcast: self.doSimulcast,

                success: function(jsep) {
                  Janus.debug(self.opaqueId, "Got publisher SDP!");
                  Janus.debug(jsep);
                  var publish = { "request": "configure", "audio": useAudio, "video": true, data: true  };
                  self.pluginHandle.send({"message": publish, "jsep": jsep});
                },

                error: function(error) {
                  Janus.error(self.opaqueId, "WebRTC error:", error);
                  self.alert.open("ERROR setting up facetime: " + error.message);
                }
              });
            })

        })
      } else  {
        self.pluginHandle.createOffer( {
          media: {
              audioRecv: false,
              videoRecv: false,
              audioSend: useAudio,
              videoSend: true,
              video: self.videoResolution,
              data: true
          },
          simulcast: self.doSimulcast,

          success: function(jsep) {
            Janus.debug(self.opaqueId, "Got publisher SDP!");
            Janus.debug(jsep);
            var publish = { "request": "configure", "audio": useAudio, "video": true, data:true };
            self.pluginHandle.send({"message": publish, "jsep": jsep});
          },
          error: function(error) {
            Janus.error(self.opaqueId, "WebRTC error:", error);
            self.alert.open("ERROR creating offer: " +  error.message).then(
              function() {
                self.is_open = false
                self.$emit("leftRoom")
                self.$emit("Failed")
              }
            );

            /*if (useAudio) {
              self.publishOwnFateed(true);
            } else {
              Janus.error(self.opaqueId, "WebRTC error:", error);
              self.alert.open("WebRTC error... " + JSON.stringify(error));
            }*/
          }
        });
      }
    },

    unpublishOwnFeed() {
      var unpublish = { "request": "unpublish" };
      this.pluginHandle.send({"message": unpublish});
      this.is_streaming = false;
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
          //Janus.debug(self.opaqueId, " ::: Got a message (subscriber) :::");
          //Janus.debug(self.opaqueId, msg);
          var event = msg["videoroom"];
          //Janus.debug(self.opaqueId, "REMOTE Event: " + event);

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
                newfeed.ration = 1
                self.$set(self.feeds, msg.id, newfeed)

                if (self.use_force) {
                  self.force_positions.push({
                    x: newfeed.x,
                    y: newfeed.y,
                    id: newfeed.publisher,
                  })
                  self.restartForces()
                }
                if (self.vr) {
                  self.updateVRpositions()
                }
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

              media: { audioSend: false, videoSend: false, data: true },	// We want recvonly audio/video
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

        ondataopen: function() {
          Janus.log(self.opaqueId, "The DataChannel is available!");

          // send a sendmetostage message if new data channel comes available and I am on stage
          if (self.onstage == self.username)
            self.sendMeToStage(true)
        },

        ondata: function(message) {
          Janus.debug(self.opaqueId, "We got data from the DataChannel! " + message);
          console.log(message);
          message = JSON.parse(message);
          console.log(message["request"]);
          console.log(message.publisher);
          if (message.request == "onstage")
            self.onstage = message.publisher
          if (message.request == "offstage")
            if (self.onstage == message.publisher)
              self.onstage = null

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

          //setTimeout( function() {
          //console.log(document.getElementById('v'+ remoteFeed.id);
          //Janus.attachMediaStream(document.getElementById('v'+ remoteFeed.id), stream)
          Janus.attachMediaStream(self.$refs['v'+remoteFeed.id][0], stream)
          self.$refs['v'+remoteFeed.id][0].muted = self.all_muted;
          self.feeds[remoteFeed.publisher].loading = false;
          if (self.use_force)
            self.$forceUpdate();

          var videoTracks = stream.getVideoTracks();
          if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
            self.feeds[remoteFeed.publisher].has_remote_video = false;
          } else {
            self.feeds[remoteFeed.publisher].has_remote_video = true;
          }

          if (self.vr)
            setTimeout(function() {
              self.$set(self.feeds[remoteFeed.publisher], "ratio" ,
                self.$refs['v'+remoteFeed.id][0].videoWidth / self.$refs['v'+remoteFeed.id][0].videoHeight
              )
              self.updateVRpositions()
            }, 1000)

          if(Janus.webRTCAdapter.browserDetails.browser === "chrome"
            || Janus.webRTCAdapter.browserDetails.browser === "firefox" ||
            Janus.webRTCAdapter.browserDetails.browser === "safari") {

            if (self.showBitrates)
              setTimeout(function updateBitrate() {
                  if (self.feeds[remoteFeed.publisher]) {
                    self.feeds[remoteFeed.publisher].bitrate = self.feeds[remoteFeed.publisher].getBitrate();
                    self.$set(self.feeds[remoteFeed.publisher],'bitrate', self.feeds[remoteFeed.publisher].getBitrate() )
                    self.$set(self.feeds[remoteFeed.publisher],'muted', self.feeds[remoteFeed.publisher].isAudioMuted() )
                    setTimeout(updateBitrate, 1000);
                }
              }, 1000);
              // // TODO: Check if the resolution changed too
          }
          //  }, 1000);
        },

        oncleanup: function() {
          Janus.log(" ::: Got a cleanup notification (remote feed " + id + " / "  +  remoteFeed.id +") :::");
        }
      });
    },

    muteMe(muted) {
      console.log("set muteme:", muted);
      if (muted) {
          this.pluginHandle.muteAudio();
      } else {
        this.pluginHandle.unmuteAudio();
      }
      this.muted = this.pluginHandle.isAudioMuted();
      this.$emit("muteChanged", this.muted)
    },

    muteAll(muted) {
      console.log("mute all ", muted);
      for (let feed in this.feeds) {
        console.log(feed);
        console.log(  this.$refs['v'+this.feeds[feed].id]);
        this.$refs['v'+this.feeds[feed].id][0].muted = muted;
      }
      this.all_muted = muted;
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
          substream: feed.substream
        },
        success: (r) => { console.log(r)}
      })
    },

    toggleRTPForward() {
      let self=this
      if (!self.isRTPforwarding) {
        self.rtp_dialog.open().then(function(r) {
          console.log(r);
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
              console.log(r);
              if (r.error_code) {
                self.alert.open("ERROR:" + r.error);
              } else {
                console.log(r.rtp_stream);
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
            console.log(r);
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
              console.log(r);
            self.isRTPforwarding = false
            self.rtp_forward = null
          }
        })

      }
    },

    toggleScreenShare() {
      let self = this;
      self.screenshare = !self.screenshare;
      var body = { "audio": true, "video": true };
      self.is_streaming = false;

      Janus.debug("Trying a createOffer too (audio/video sendrecv)");
      // media: { video: capture, captureDesktopAudio: useAudio, audioRecv: true, videoRecv: false, data: true },
      self.pluginHandle.createOffer({
        media: {
          video: self.screenshare ? "screen" : true,
          replaceVideo: true,
          //audio: self.screenshare ? captureDesktopAudio: true,
          //replaceAudio: true
          data: true	// Let's negotiate data channels as well
        },
        simulcast: self.doSimulcast,
        success: function(jsep) {
          Janus.debug("Got SDP!");
          Janus.debug(jsep);"screen"
          self.pluginHandle.send({"message": body, "jsep": jsep});
          this.resetForces()
        },
        error: function(error) {
          Janus.error("WebRTC error:", error);
          self.alert.open("ERROR" + error);
          self.toggleScreenShare()
        }
      });
    },

    toggleFacetime() {
      let self = this;

      // unpublish and republsh
      // not the nicest way to do it.
      // should be possible re-negotiate?

      this.unpublishOwnFeed()
      setTimeout(function() {
          self.facetime = !self.facetime;
          self.publishOwnFeed(true)
        }, 2000);
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

    sendMeToStage(goUp=true) {
      let self = this;
      console.log("send me on stage");
      if (goUp)
        this.pluginHandle.data({
          text: JSON.stringify({
            request: "onstage",
            publisher: this.username,
          }),
          error: function(reason) { this.alert.open(reason); },
          success: function() {
            self.onstage = self.username
          }
        });
      else
        this.pluginHandle.data({
          text: JSON.stringify({
            request: "offstage",
            publisher: this.username,
          }),
          error: function(reason) { this.alert.open(reason); },
          success: function(r) {
            console.log(r);
            if (self.onstage == self.username)
              self.onstage = null
          }
        });
    },


    sendToStage(id) {
      let self = this;
      console.log("send on stage", id);

      // just hack it in so it can be used locally but it needs datachannel
      if (self.onstage === id) {
        self.onstage = null
      } else {
        self.onstage = id
      }

      this.pluginHandle.data({
        text: JSON.stringify({
          request: "onstage",
          publisher: id,
        }),
        error: function(reason) { this.alert.open(reason); },
        success: function() {
          self.onstage = id
        }
      });
    },

    sendMessage(message) {
      this.pluginHandle.data({
        text: message,
        error: function(reason) { this.alert.open(reason); },
        success: function() {
            console.log("sent on data channel");
        }
      });
    },

    toggleForce() {
      this.use_force = !this.use_force;
      if (!this.use_force) {
        this.force.stop()
      } else {
        this.resetForces();
      }
    },

    resetForces() {
      this.force.stop()
      this.force_positions = []
      this.force_positions.push( {
        x: this.my_pos.x,
        y: this.my_pos.y,
        id: 0
      })
      for (let k of  Object.keys(this.feeds)) {
        if (this.feeds[k])
          this.force_positions.push( {
            x: this.feeds[k].x,
            y: this.feeds[k].y,
            id: this.feeds[k].publisher
          })
      }
      this.restartForces()
    },

    makeVideoFullscreen(e) {
      let v = e.target.parentElement.parentElement.parentElement.querySelector('video')
      screenfull.request(v)
    }
  }
}

</script>

<style lang="css" scoped>

.warn_is_on {
  color: var(--color-alert);
}
.videoroom .headers { z-index:100}
.videoroom .screen  {
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
.videoroom .icons { foat:left; vertical-align: middle}
.videoroom .fixed { position: fixed; top:5px; right:5px; border: 1px solid black; width: 15%}
.videoroom .tile { padding:5px; position: relative; z-index:101}
.videoroom .centered { position: absolute; top:50%; left:50%; transform:translate(-50%,-50%)}
.videoroom .tile {

}
.videoroom .screen { margin: 0 auto; padding:0}
.videoroom .overlay {display:none}
.videoroom .overlay .icons {   opacity: 0.7 }
.videoroom .overlay .linked{  background:none }
.videoroom .overlay .linked:hover { opacity: 1; color:white }
.videoroom .name {
  position: absolute; top:2px; left: 50%; transform:translate(-50%,0);
  background:rgba(0,0,0, 0.2); color:white;padding:0.01rem 0.5rem;
  opacity: 0.7
}
.videoroom .meta {
    position: absolute; opacity: 0.7;
    left: 50%; bottom:2px;transform:translate(-50%,0);
    /*bottom:5px; left: 5px;*/
    /*background:white; color:#333;padding:0.3em;*/
    background:rgba(0,0,0, 0.2); color:white;padding:0.1rem 0.5rem;
}
.videoroom .options {
    opacity: 0.7;  position: absolute;
    left: 50%; bottom:28px;  height:45px; transform:translate(-50%,0);
    /*bottom:5px; left: 5px;*/
    /*background:white; color:#333;padding:0.3em;*/
     background:rgba(0,0,0, 0.2); color:white;padding:0.15rem 0.5rem;
}

.videoroom .video {
  z-index:151;
  position: absolute;
}
.videoroom .videolocal {

}

.flip {
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);
}

.videoroom .stage {
  position: relative;
  top:-70px; left: 50%;
  width:100%;
  transform:translate(-50%,-100%);
}
.videoroom .stage .meta { bottom:10px}
.videoroom .fullscreen { background:white}
.videoroom .talking { border: 2px solid red}
.videoroom .bitrate { font-size: 80%}

.videoroom .video video {
  object-fit: cover;
  border-radius: 50%;
  width:100%;
  height:100%;
  background:black;
  border:0;
  box-shadow: 10px 6px 12px rgba(0,0,0,0.55);
}

.videoroom .stage video {
  object-fit: cover;
  max-height:360px;
  width:100%;
  height:100%;
  border-radius: 0%;
}

.video:hover .overlay { display:block }

.videoroom .vrscreen {
  position: relative;
  top:-70px; left: 50%;
  transform:translate(-50%,-100%);
  background:white;
}

.facetrackdebug {
  position: fixed; bottom:30px; left:5px;
  width:240px;
  border: 1px solid black;
  z-index:200;
}

.trackingstats {
    position: fixed; bottom:5px; left:5px;
    width:100px; background:rgba(0,0,0,0.5); color: white; padding: 2px 10px;
    text-align:center;
    z-index:201;
}

.a-loader-title {
  background: #ddcccc;
  color:black;
}

@media (max-width:461px) {
  .videoroom .overlay { display:none}
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
