<template>
  <div ref="textroom" class="textroom">

    <div class="header">
      <div class="columns is-mobile is-narrow headers is-gapless">
        <div class="column has-text-left is-10">
          <message-square-icon size="1x" class="icons linked"></message-square-icon>
            text
           <span v-if="room_info.description && showRoomInfo">- {{ room_info.description }} </span>
           <span v-if="count > 0"> ({{ count }})</span>
        </div>
        <div class="column  has-text-right">
          <minus-icon size="1x" class="icons linked" v-if="is_open" @click="is_open=false" title="Hide room"></minus-icon>
          <plus-icon size="1x" class="icons linked" v-if="!is_open" @click="openChat" title="Enter room"></plus-icon>
        </div>
      </div>
    </div>

    <div class="chatroom" v-show="is_open">

      <vue-custom-scrollbar class="participants">
        <div class="has-text-left" ref="participants">
          <ul>
            <li v-for="(user, index) in participants" :key="index" class="participant">
              <v-menu v-if="user.username != username">
                <template v-slot:activator="{ on }">
                  <span v-on="on" :style="{ color: user.color }">{{ user.display }}</span>
                </template>
                <v-list>
                  <v-list-item @click="sendWhisper(user.username)">
                    <v-list-item-title>Send Whisper</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
             <!--  <span v-if="user.username == username" style="color: #aaa" >(
                <span style="font-size:0.8rem">Me:</span> {{ display }})</span>-->
            </li>
          </ul>
        </div>
      </vue-custom-scrollbar>

      <vue-custom-scrollbar class="chat" id="chatbar" ref="chatbar">
        <div class="has-text-left" id="chat">
          <div  class="item" v-if="welcome_msg">
            <div class="user">
              <span>@ {{ room_info.description}}</span>
            </div>
            <div class="msg" >
              <span v-html="welcome_msg.msg"></span>
            </div>
          </div>

          <div v-for="msg in messages" :key="msg.id" class="item">
            <div class="user" :style="{ color: msg.color }">
              <span v-if="msg.from != username" >{{ msg.from }}</span>
              <span v-else>(me: {{ display }})</span>:
            </div>
            <div class="msg" >
              <span v-html="msg.msg"></span>
            </div>
          </div>

        </div>
      </vue-custom-scrollbar>
    </div>

    <div class="talk" v-if="is_open">
      <div class="columns is-mobile">
        <div class="column is-one-quarter has-text-right me">
          talk:
        </div>
        <div class="column">
          <div class="msg_editor" contenteditable="true" v-on:keyup.enter.exact="sendMsg"></div>
        </div>
      </div>
    </div>

    <toast ref="toast"></toast>
    <login-dialog ref="login"></login-dialog>
    <alert-dialog ref="alert"></alert-dialog>
    <prompt-dialog ref="prompt"></prompt-dialog>

    <div class="loadingComponent" v-if="loading && is_open">
      <div><loader-icon size="3x" class="icons loading"></loader-icon></div>
    </div>

  </div>


</template>

<script>
import { janusMixin } from "@/mixins/janusMixin";
import Janus from '../janus'
import randomColor from 'randomcolor'
import Autolinker from 'autolinker';
import vueCustomScrollbar from 'vue-custom-scrollbar'
import { strip_tags } from 'locutus/php/strings'
import LoginDialog from '@/components/dialogs/LoginDialog'
import AlertDialog from '@/components/dialogs/AlertDialog'
import PromptDialog from '@/components/dialogs/PromptDialog'
import Toast from '@/components/dialogs/Toast'
import { MessageSquareIcon,MinusIcon, PlusIcon } from 'vue-feather-icons'
import { LoaderIcon } from 'vue-feather-icons'
import { VMenu, VList } from 'vuetify/lib'

export default {
  name: 'Textroom',

  mixins: [janusMixin],

  components: {
    vueCustomScrollbar,
    LoginDialog, Toast, AlertDialog, PromptDialog,
    MessageSquareIcon,  MinusIcon, PlusIcon, LoaderIcon,
    VMenu, VList
  },

  props: {
    header: {
      type: Boolean,
      default: true
    },
    internal_dialogs: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      pluginName: "textroom",
      opaqueId: this.$options._componentTag  + Janus.randomString(12),
      log: ["starting up"],
      messages: [],
      users: [],
      msg: "",
      welcome_msg: null,
    }
  },

  computed: {

  },

  created() {
    if (this.internal_dialogs)
      this.dialog_container = '.textroom'

  },

  mounted () {
    console.log(this.$options._componentTag + " mounted");
    if (this.myJanus == null) {
      this.loadConfig()
    } else {
      this.janus = this.myJanus
      this.attachPlugin()
    }
  },

  updated () {
  },

  destroyed () {
    this.janus.destroy();
  },

  methods: {

    attachPlugin() {
      let self = this;
      this.janus.attach({

        plugin: "janus.plugin.textroom",
        opaqueId: this.opaqueId,

        success: function(pluginHandle) {
          self.pluginHandle = pluginHandle;
          Janus.log("Plugin attached! (" + self.pluginHandle.getPlugin() + ", id=" + self.pluginHandle.getId() + ")");
          var body = { "request": "setup" };
          console.log("Sending message (" + JSON.stringify(body) + ")");
          self.pluginHandle.send({"message": body});
        },

        error: function(error) {
          console.error("  -- Error attaching plugin...", error);
        },

        webrtcState: function(on) {
          Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
        },

        onmessage: function(msg, jsep) {
          Janus.debug(" ::: Got a message :::");
          Janus.debug(msg);

          if(jsep !== undefined && jsep !== null) {
            // Answer
            self.pluginHandle.createAnswer({
              jsep: jsep,
              media: { audio: false, video: false, data: true },	// We only use datachannels
              success: function(jsep) {
                Janus.log("Got SDP!");
                Janus.debug(jsep);
                var body = { "request": "ack" };
                self.pluginHandle.send({"message": body, "jsep": jsep});
              },
              error: function(error) {
                Janus.error("WebRTC error:", error);
              }
            });
          }
        },

        ondataopen: function() {
          Janus.log("The DataChannel is available!");
          self.initRoom()
        },

        ondata: function(data) {
          Janus.debug("We got data from the DataChannel! " + data);

          var json = JSON.parse(data);
          var transaction = json["transaction"];

          if(self.transactions[transaction]) {
            // Someone was waiting for this
            self.transactions[transaction](json);
            self.$delete(self.transactions, transaction);
            return;
          }

          var what = json["textroom"];
          var username = json["username"];
          var display = json["display"];

          if(what === "message") {
            // Incoming message: public or private?
            var msg = json["text"];
            msg = msg.replace(new RegExp('<', 'g'), '&lt');
            msg = msg.replace(new RegExp('>', 'g'), '&gt');
            msg = msg.replace(new RegExp('\\n.{1}', 'g'), '<br>');
            var from = json["from"];
            var dateString = self.getDateString(json["date"]);
            var whisper = json["whisper"];

            if(whisper === true) {
              // Private message
              let sender = self.participants[from]
              self.alert.open(msg, {
                  title: 'Private Message from\n, ' + sender.display,
              })
            } else {
              // Public message
              self.messages.push( {
                id: transaction,
                from: self.participants[from].display,
                color: self.participants[from].color,
                msg: Autolinker.link(strip_tags(msg)),
                date: dateString,
              })
              window.setTimeout( function() {
                console.log(self.$refs.chatbar.$el);
                self.$refs.chatbar.$el.scrollTop = self.$refs.chatbar.$el.scrollHeight;
                //document.getElementById("chatbar").scrollTop = document.getElementById("chatbar").scrollHeight;
              }, 200);
            }

          } else if(what === "join") {

            self.addUserToList(username, display);

          } else if(what === "leave") {

            self.toast.open(self.participants[username].display + " left " + self.room_info.description)
            self.removeUserFromList(username);

          } else if(what === "kicked") {

            if(username === self.username) {
              self.alert.open('You got kicked out!' + self.room);
            } else {
              self.toast.open(self.participants[username].display + " got kicked out from " + self.room_info.description)
            }
            self.removeUserFromList(username);

          } else if(what === "destroyed") {

            if(json["room"] !== self.room)
              return;
            self.alert.open('The room ' + self.room + ' has been destroyed!')
            Janus.warn("The room has been destroyed!");

          } else if(what === "list") {

            if(json["room"] !== self.room)
              return;
          }

        },
        oncleanup: function() {
          Janus.log(" ::: Got a cleanup notification :::");
        }
      });
    },

    registerUser() {
      console.log("register user");
      let self = this;
      self.username = Janus.randomString(12);
      var transaction = Janus.randomString(12);
      var register = {
        textroom: "join",
        transaction: transaction,
        room: self.room,
        username: self.username,
        display: self.display
      };

      self.transactions[transaction] = function(response) {
        if(response["textroom"] === "error") {
          if(response["error_code"] === 417) {
            console.log( self.room + "does not exist." );
          } else {
            console.log(response["error"]);
          }
          return;
        }
        // We're in
        console.log("we are in");
        self.loading = false;
        self.webRTCUp = true;
        self.$emit('hasNick', self.display)
        self.welcome_msg = {
          from: '@' + self.room_info.description,
          msg: "Welcome!"
        };

        if(response.participants && response.participants.length > 0) {
          response.participants.forEach( function(user) {
            //let newuser = user;
            //newuser.color = randomColor({luminosity: 'dark'})
            //self.$set(self.participants, user.username, newuser)
            self.addUserToList(user.username, user.display);
          })
          //self.count = Object.keys(self.participants).length
          //self.$emit('participantNumberChanged', self.count)
        }

      };
      self.pluginHandle.data({
        text: JSON.stringify(register),
        error: function(reason) {
          console.log(reason);
        }
      });

    },

/*
    getParticipantList() {
      console.log("ask for participants");
      let self = this;
      var transaction = Janus.randomString(12);
      var request = {
        textroom: "listparticipants",
        transaction: transaction,
        room: self.room,
      };
      self.transactions[transaction] = function(response) {
        if(response["textroom"] === "error") {
          if(response["error_code"] === 417) {
            console.log(self.room + " does not exist");
          } else {
            console.log(response["error"]);
          }
          return;
        }
        self.initial_participants = response.participants;
        self.count = response.participants.length
        self.$emit('participantNumberChanged', self.count)
        self.loadingComponent.close()

        if (!self.nick) {
          self.askForUsername(false,".textroom");
        } else if (self.initial_participants.find(d => d.display == self.nick)) {
          self.askForUsername(true,".textroom");
        } else {
          self.display = self.nick
          self.registerUser()
        }
      };

      self.pluginHandle.data({
        text: JSON.stringify(request),
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
        textroom: "list",
        transaction: transaction,
      };
      self.transactions[transaction] = function(response) {
        if(response["textroom"] === "error") {
          console.log(response["error"]);
          return;
        }
        self.rooms = response.list;
        self.room_info = response.list.find(d => d.room == self.room)
      };
      self.pluginHandle.data({
        text: JSON.stringify(request),
        error: function(reason) {
          console.log(reason);
        }
      });
    },
*/
    sendWhisper(username) {
      let self = this;
      var display = self.participants[username].display;
      if(!display)
        return;

      self.$refs.prompt.open("Send a whisper to " + display,
        { placeholder: " A private message", confirm: "send", type:"text" }
      )
      .then( (result) =>{
        if(result && result !== "") {
          var message = {
            textroom: "message",
            transaction: Janus.randomString(12),
            room: self.room,
            to: username,
            text: result
          };
          self.pluginHandle.data({
            text: JSON.stringify(message),
            error: function(reason) { self.alert.open(reason) },
            success: function() {
              self.toast.open("Whisper send!")
            }
          });
        }
      })
    },

    sendMsg(e) {
      let self = this;
      self.msg = e.target.innerText.trim();
      if(self.msg.length < 1) {
        e.target.innerText = "";
        return;
      }
      if(self.msg.length < 1) {
        e.target.innerText =
          e.target.innerText.replace(new RegExp('\\n', 'g'), '');
        return;
      }

      var message = {
        textroom: "message",
        transaction: Janus.randomString(12),
        room: self.room,
        text: self.msg,
      };
      // Note: messages are always acknowledged by default. This means that you'll
      // always receive a confirmation back that the message has been received by the
      // server and forwarded to the recipients. If you do not want this to happen,
      // just add an ack:false property to the message above, and server won't send
      // you a response (meaning you just have to hope it succeeded).

      self.pluginHandle.data({
        text: JSON.stringify(message),
        error: function(reason) { self.alert.open(reason); },
        success: function() { e.target.innerText = "" }
      });
    },

    addUserToList(username, display) {
      let self = this;
      let newuser = {
        username: username,
        display: display,
        color: randomColor({luminosity: 'dark'})
      }
      self.$set(self.participants, username, newuser)

      if (username != self.username)
        self.toast.open(self.participants[username].display + " joined " + self.room_info.description)
      self.count = Object.keys(self.participants).length
      self.$emit('participantNumberChanged', self.count)

    },

    removeUserFromList(username) {
      let self = this;
      self.$delete(self.participants, username);
      self.count = Object.keys(self.participants).length
      this.$emit('participantNumberChanged', self.count)
      //self.$forceUpdate();
    },

    getDateString(jsonDate) {
      var when = new Date();
      if(jsonDate) {
        when = new Date(Date.parse(jsonDate));
      }
      var dateString =
        ("0" + when.getUTCHours()).slice(-2) + ":" +
        ("0" + when.getUTCMinutes()).slice(-2) + ":" +
        ("0" + when.getUTCSeconds()).slice(-2);
      return dateString;
    },

    openChat() {
      if (this.webRTCUp)
        this.is_open = true
      else
        this.login()
    }
  }

}
</script>

<style lang="css" scoped>

.textroom {
  position: relative;
  max-height:100%;
  width:100%;
  display: flex;
  flex-direction: column;
}

.chatroom { flex: 1 1 auto;display:flex; max-height:70%; }
.participants {
  font-size: 0.9rem;
  overflow-y: auto;
  flex: 0 0 25%;
  margin-right: 20px;
  word-wrap: break-word;
}
.participants ul  {padding-left: 24px}
.participant span { cursor: pointer}

.chat {
  overflow-y: auto;
  flex: 1 1 auto;
}
.chat {  padding-left: 0.7rem }
.chat .item { padding:0px 0px; margin-bottom:0px}
.chat .user { font-style:italic; font-size: 0.9rem; opacity: 0.8}
.chat .item .username { padding: 0 0.2rem 0 1rem; }
.chat .item .msg { padding:0.2rem 0 0.5rem 0.4rem;  }

.me {line-height:2.5em;font-size: 0.9rem}
.msg_editor {
    text-align:left;
    min-height:2.5em;
    border-bottom: 1px solid black;
    margin-right:1rem;
    padding:4px 5px 4px 15px}

.talk { flex:  0 0 auto; padding:0.7rem 0; margin-top: 1rem; border-top: 1px solid black; }

.loadingComponent {position: absolute;top:40px;width:100%;height:100%;background:rgba(200, 200, 200, 0.5)}
.loadingComponent div {position: absolute; top:50%; left: 50%; transform:translate(-50%,-50%)}
.loading { }

@media (max-width:421px) {
  .participants {display: none}
}

</style>
