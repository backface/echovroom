<template>
  <div ref="audioroom" class="audioroom" :class="{ isOn: webRTCUp }">

    <div class="columns headers is-gapless">
      <div class="column has-text-left">
        <mic-off-icon size="1x" class="icons linked" v-if="muted" @click="muteMe(false)"></mic-off-icon>
        <mic-icon size="1x" class="icons linked" v-if="!muted" @click="muteMe(true)"></mic-icon>
        {{ room_info.description }} ({{ count + (webRTCUp ? 1 : 0) }})
        <loader-icon size="1x" class="icons" v-if="has_stream"></loader-icon>
      </div>
      <div class="column  has-text-right">
        <minus-icon size="1x" class="icons linked" v-if="webRTCUp" @click="leaveRoom()"></minus-icon>
        <plus-icon size="1x" class="icons linked" v-if="!webRTCUp" @click="login()"></plus-icon>
      </div>
    </div>

    <vue-custom-scrollbar  v-show="webRTCUp">
      <div class="participants has-text-left" ref="participants" >

        <span v-if="!participants">(empty)</span>
          <span v-for="(user, index) in participants" :key="index" class="participant" :class="{ talking: user.talking }">
            {{ user.display }}
            <mic-off-icon size="1x" class="icons" v-if="user.muted === true"></mic-off-icon>
            <loader-icon size="1x" class="icons" v-if="user.setup != true"></loader-icon>
          </span>

      </div>
    </vue-custom-scrollbar>
    <audio ref="roomaudio" class="rounded centered" id="roomaudio" width="100%" height="100%" autoplay/>
  </div>
</template>

<script>
import Vue from 'vue';

import { Dialog, Loading } from 'buefy'
import Janus from '../janus'
import { MicIcon, MicOffIcon } from 'vue-feather-icons'
import { LoaderIcon, MinusIcon, PlusIcon } from 'vue-feather-icons'

import vueCustomScrollbar from 'vue-custom-scrollbar'

Vue.use(Dialog)
Vue.use(Loading)

export default {
  name: 'Audioroom',

  components: {
    vueCustomScrollbar,
    MicIcon, MicOffIcon, LoaderIcon,
    MinusIcon, PlusIcon
  },

  props: {
    nick:  {
        type: String,
        default: ""
    },
    room: {
      type: Number,
      default: 1234
    },
    myJanus: {
      type: Object,
      default: null
    },
    is_muted: {
      type: String,
      default: "false"
    }
  },

  data() {
    return {
      server: window.location.protocol === 'https:' ? "https://janus.modular-t.org:8089/janus" : "http://janus.modular-t.org:8088/janus",
      ws_server: 'wss://janus.modular-t.org:8989',
      janus: null,
      webRTCUp: null,
      pluginHandle: null,
      pluginName: "audiobridge",
      opaqueId: this.$options._componentTag  + "-" + Janus.randomString(12),
      transactions: {},
      username: null,
      display: null,
      rooms: [],
      room_info: '',
      count: 0,
      participants: {},
      is_open: false,
      initial_participants: [],
      has_stream: false,
      is_streaming: false,
      muted: false
    }
  },

  computed: {

  },

  mounted () {
    console.log(this.$options._componentTag + " mounted");
    this.loadingComponent = this.$buefy.loading.open({
        container: this.$refs.participants,
    })
    this.muted = this.is_muted === "true"
    console.log(this.janus);
    if (this.janus == null) {
      this.initJanus()
    } else {
      this.AttachPlugin()
    }
  },

  destroyed () {
    this.janus.destroy();
  },

  methods: {

    initJanus () {
      let servers = [this.ws_server, this.server,]
      console.log(this.opaqueId, 'calling Janus init')
      Janus.init({
        debug: 'all',
        callback: () => {
          this.janus = new Janus(
            {
              server: servers,
              iceServers: [
                {urls: "stun:stun.l.google.com:19302"},
                {urls: "turn:88.198.175.99:3478", username: "turn", credential: "hinterseer"},
              ],
              success: () => {
                console.log(this.opaqueId, "janus initialized");
                this.$emit("hasJanus",this.janus);
                this.attachPlugin()
              },
              error: (cause) => {
                console.log(cause)
              },
              destroyed: () => {
                console.log(this.opaqueId, 'janus init destroyed')
              }
            })
        }
      })
    },

    attachPlugin() {
      let self = this;

      console.log(this.opaqueId, 'attach plugin: ' + self.pluginName)

      this.janus.attach({

        plugin: "janus.plugin." + self.pluginName,
        opaqueId: self.opaqueId,

        success: function(pluginHandle) {
          self.pluginHandle = pluginHandle;
          Janus.log("Plugin attached! (" + self.pluginHandle.getPlugin() + ", id=" + self.pluginHandle.getId() + ")");
          self.getRoomsInfo()
          self.getParticipantList()
          if (self.is_open)
            self.login()
        },

        error: function(error) {
          console.error(self.opaqueId, "  -- Error attaching plugin...", error);
        },

        webrtcState: function(on) {
          Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
        },

        onmessage: function(msg, jsep) {
          Janus.debug(" ::: Got a message :::");
          Janus.debug(msg);
          var event = msg["audiobridge"];
					Janus.debug("Event: " + event);

          console.log(self.opaqueId, msg, event);

          if(jsep !== undefined && jsep !== null) {
						Janus.debug("Handling SDP as well...");
						Janus.debug(jsep);
						self.pluginHandle.handleRemoteJsep({jsep: jsep});
					}

          if(event != undefined && event != null) {

            if(event === "joined") {
              if(msg["id"]) {
                Janus.log("Successfully joined room " + msg["room"] + " with ID " + msg["id"]);
                if(!self.webRTCUp) {
                  self.webRTCUp = true;
                  // Publish our stream
                  self.pluginHandle.createOffer({
                    media: { video: false},	// This is an audio only room
                    success: function(jsep) {
                      Janus.debug("Got SDP!");
                      Janus.debug(jsep);
                      var publish = { "request": "configure", "muted": self.muted };
                      self.pluginHandle.send({"message": publish, "jsep": jsep});
                    },
                    error: function(error) {
                      Janus.error("WebRTC error:", error);
                      self.leaveRoom();
                      self.$buefy.dialog.alert(JSON.stringify(error))
                    }
                  });
                }
              }
              // Any room participant?
              if(msg["participants"] !== undefined && msg["participants"] !== null) {
                console.log(self.opaqueId, "Got a list of participants:", msg["participants"]);
                msg["participants"].forEach( function(user) {
                  self.participants[user.id] = user;
                })
                self.count = Object.keys(self.participants).length
                self.$emit('participantNumberChanged', self.count)
                self.$forceUpdate();
              }

            } else if (event === "roomchanged") {
							Janus.log("Moved to room " + msg["room"] + ", new ID: " + msg["id"]);
							// Any room participant?
              self.participants = {}
							if(msg["participants"] !== undefined && msg["participants"] !== null) {
                console.log(self.opaqueId, "Got a list of participants:", msg["participants"]);
                msg["participants"].forEach( function(user) {
                  self.participants[user.id] = user;
                })
                self.count = Object.keys(self.participants).length
                self.$emit('participantNumberChanged', self.count)
                self.$forceUpdate();
							}

						} else if(event === "destroyed") {
							Janus.warn(self.opaqueId, "The room has been destroyed!");
							self.$buefy.dialog.alert(self.opaqueId, "The room has been destroyed");

            } else if(event === "left") {
              self.participants = {}
              self.webRTCUp = false;

						} else if(event === "event") {
              console.log(msg);
							if(msg["participants"] !== undefined && msg["participants"] !== null) {
                  console.log(self.opaqueId, "Got a list of participants:", msg["participants"]);
                  msg["participants"].forEach( function(user) {
                    self.participants[user.id] = user;
                  })
                  console.log(self.participants);
                  self.count = Object.keys(self.participants).length
                  self.$emit('participantNumberChanged', self.count)
                  self.$forceUpdate();
								}
							} else if(msg["error"] !== undefined && msg["error"] !== null) {
								if(msg["error_code"] === 485) {
									self.$buefy.dialog.alert(self.room + " does not exist");
								} else {
									self.$buefy.dialog.alert(msg["error"]);
								}
								return;
							}
							// Any new feed to attach to?
							if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
								// One of the participants has gone away?
                delete self.participants[ msg['leaving'] ]
                self.count = Object.keys(self.participants).length
                self.$forceUpdate();
								Janus.log("Participant left: " + msg["leaving"]
                  + " (we have " +   self.count + " elements with ID #rp" +msg["leaving"] + ")");
							}
						}
        },

        onlocalstream: function(stream) {
          console.log("we have a local stream");
          Janus.debug(" ::: Got a local stream :::");
          Janus.debug(stream);
          self.is_streaming = true;
          // We're not going to attach the local audio stream
				},

				onremotestream: function(stream) {
          console.log("we have a remote stream");
					Janus.attachMediaStream(self.$refs.roomaudio, stream);
          self.has_remote = true;
				},

        oncleanup: function() {
          Janus.log(" ::: Got a cleanup notification :::");
        }
      });
    },

    muteMe(muted) {
      this.muted = muted
      this.pluginHandle.send({message: { "request": "configure", "muted": muted }});
    },

    registerUser() {
      console.log("register user");
      let self = this;
      self.username = Janus.randomString(12);
      var transaction = Janus.randomString(12);
      var register = {
        "request": "join",
        transaction: transaction,
        room: self.room,
        username: self.username,
        display: self.display
      };
      self.pluginHandle.send({"message": register});
    },

    leaveRoom() {
      console.log("leave room");
      let self = this;
      var transaction = Janus.randomString(12);
      var message = {
        "request": "leave",
        transaction: transaction,
        room: self.room,
      };
      self.pluginHandle.send({"message": message});
    },

    login() {
      console.log("ask for participants");
      let self = this;
      var transaction = Janus.randomString(12);
      var request = {
        request: "listparticipants",
        transaction: transaction,
        room: self.room,
      };
      request[self.pluginName] = "listparticipants";

      self.pluginHandle.send({
        "message": request,

        success: function(response) {
          self.initial_participants = response.participants;
          self.count = response.participants.length
          self.$emit('participantNumberChanged', self.count)
          self.loadingComponent.close()

          if (!self.nick) {
            self.askForUsername();
          } else if (self.initial_participants.find(d => d.display == self.nick)) {
            self.askForUsername(true);
          } else {
            self.display = self.nick
            self.registerUser()
          }
        },
        error: function(reason) {
          console.log(reason);
        }
      });
    },



    getParticipantList() {
      console.log("ask for participants");
      let self = this;
      var transaction = Janus.randomString(12);
      var request = {
        request: "listparticipants",
        transaction: transaction,
        room: self.room,
      };
      request[self.pluginName] = "listparticipants";

      self.pluginHandle.send({
        "message": request,

        success: function(response) {
          self.initial_participants = response.participants;
          self.count = self.initial_participants.length
        },
        error: function(reason) {
          console.log(reason);
        }
      });
    },



    getRoomsInfo() {
      console.log("ask for rooms info");
      let self = this;
      var transaction = Janus.randomString(12);
      var request = {
        request:"list",
        transaction: transaction,
      };
      self.pluginHandle.send({
        "message": request,
        success: function(response) {
          self.rooms = response.list;
          self.room_info = response.list.find(d => d.room == self.room)
        },
        error: function(reason) {
          console.log(reason);
        }
      });
    },

    askForUsername(exists=false) {
      let self =this;
      console.log(exists);
      //if(/[^a-zA-Z0-9]/.test(username)) {
      self.$buefy.dialog.prompt({
          //container: self.$refs.audioroom,
          message: (exists) ? "User exists. Choose another one" : "What's your name?",
          canCancel: false,
          inputAttrs: {
              placeholder: 'e.g. Peter Pan',
              minlength: 2
          },
          trapFocus: true,
          onConfirm: function(nick) {
            self.display = nick;
            if (self.initial_participants.find(d => d.display == nick)) {
              self.loadingComponent.close()
              self.askForUsername(true);
            } else {
              self.registerUser()
            }
          }
      })
    },
  }
}

</script>

<style lang="css">
.audioroom {  }
.audioroom .isOn { background:black; color: #aaa}
.audioroom .isOn .headers { border-bottom: 1px solid white; }
.audioroom .participants  {padding:1rem; min-height:120px; background:black; color: #aaa; margin-bottom:1rem; }
.audioroom .participant { padding-right:2rem}
.audioroom .icons {vertical-align:middle}
.audioroom .talking { font-weight: bold; color:red; font-size: 1.2em}
</style>
