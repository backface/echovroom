<template>
  <div ref="textroom" class="textroom">

    <div class="header">
      <div class="columns is-mobile is-narrow headers is-gapless" @dblclick="is_active=!is_active">
        <div class="column has-text-left is-10">
          <message-square-icon size="1x" class="icons linked"></message-square-icon>
            Chat
           <span v-if="room_info.description && showRoomInfo"> - {{ room_info.description }} </span>
           <span class="participant_counter" v-if="count > 0"> <user-icon size="1x" class="icons"></user-icon> {{ count }}   </span>
           &nbsp;
           <div v-if="new_messages > 0" class="new_message_counter"> {{ new_messages }}</div>
        </div>

        <div class="column  has-text-right">
          <a v-if="is_active" @click="is_active=false" title="hide room">
            <minus-icon size="1x" class="icons linked"></minus-icon>
          </a>
          <a v-if="!is_active" @click="openChat" title="enter room">
            <plus-icon size="1x" class="icons linked"></plus-icon>
          </a>
        </div>
      </div>
    </div>

    <div class="" v-show="is_active && is_open">

      <div class="chatroom">
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
                    <v-list-item v-if="emitCallEvents" @click="$emit('call', user.display)">
                      <v-list-item-title>Videocall</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="kick(user.username)">
                      <v-list-item-title>Kick</v-list-item-title>
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
                <span>@ {{ room_name}}</span>
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

      <div class="talk">
        <div class="columns is-mobile">
          <div class="column is-one-quarter-desktop is-narrow-mobile has-text-right me">
            talk:
          </div>
          <div class="column">
            <v-text-field class="msg_editor" v-on:keyup.enter.exact="sendMsg" v-model="msg" placeholder="type here" />
          </div>
          <div class="column is-narrow has-text-right emojicol">
            <a @click="sendMsg" title="send">
              <send-icon size="1x" class="icons linked"></send-icon>
            </a>
            <emoji-picker @emoji="insert_emoji" :search="search_emoji" style="display:inline">

              <a slot="emoji-invoker" slot-scope="{ events: { click: clickEvent } }" @click.stop="clickEvent" class="emoji-invoker"
                title="pick an emoji">
                <smile-icon size="1x" class="icons linked"></smile-icon>
              </a>
              <div slot="emoji-picker" slot-scope="{ emojis, insert }">
                <div class="emoji-picker">
                  <div class="emoji-picker__search">
                    <input type="text" v-model="search_emoji">
                  </div>
                  <div >
                    <div v-for="(emojiGroup, category) in emojis" :key="category">
                      <h5>{{ category }}</h5>
                      <div class="emojis">
                        <span
                          v-for="(emoji, emojiName) in emojiGroup"
                          :key="emojiName"
                          @click="insert(emoji)"
                          :title="emojiName"
                        >{{ emoji }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </emoji-picker>
          </div>
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
import { SmileIcon, SendIcon,  UserIcon } from 'vue-feather-icons'
import { LoaderIcon } from 'vue-feather-icons'
import { VMenu, VList } from 'vuetify/lib'
import { replaceEmoticons } from "../libs/emoticon"
import EmojiPicker from 'vue-emoji-picker'
import { event_bus } from '@/main'

export default {
  name: 'Textroom',

  mixins: [janusMixin],

  components: {
    vueCustomScrollbar,
    LoginDialog, Toast, AlertDialog, PromptDialog, SendIcon,
    MessageSquareIcon,  MinusIcon, PlusIcon, LoaderIcon, SmileIcon, UserIcon,
    VMenu, VList, EmojiPicker
  },

  props: {
    header: {
      type: Boolean,
      default: true
    },
    internal_dialogs: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: true
    },
    autologin: {
      type: Boolean,
      default: false
    },
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
      search_emoji: '',
      is_active: this.active,
      new_messages: 0
    }
  },

  watch: {
    is_active: function (val) {
      if (val) {
        var self = this;
        window.setTimeout( function() {
          self.$refs.chatbar.$el.scrollTop = self.$refs.chatbar.$el.scrollHeight;
        }, 200);
        this.new_messages = 0;
      }
    },
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

  destroyed () {
    this.janus.destroy();
  },

  methods: {

    insert_emoji(emoji) {
      this.msg += emoji;
    },

    attachPlugin() {
      let self = this;

      this.janus.attach({
        plugin: "janus.plugin.textroom",
        opaqueId: this.opaqueId,

        success: function(pluginHandle) {
          self.pluginHandle = pluginHandle;
          console.log(self.opaqueId, ":", "Plugin attached! (" + self.pluginHandle.getPlugin() + ", id=" + self.pluginHandle.getId() + ")");
          var body = { "request": "setup" };
          console.log(self.opaqueId, ":", "Sending message (" + JSON.stringify(body) + ")");
          self.pluginHandle.send({"message": body});
          self.getRoomsInfo();
        },

        error: function(error) {
          console.error(self.opaqueId, "  -- Error attaching plugin...", error);
        },

        webrtcState: function(on) {
          console.log(self.opaqueId, ":", "Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
          if (self.autologin) self.login()
        },

        onmessage: function(msg, jsep) {
          console.log(self.opaqueId, ":", "Got a message", msg);
          if(jsep !== undefined && jsep !== null) {
            // Answer
            self.pluginHandle.createAnswer({
              jsep: jsep,
              media: { audio: false, video: false, data: true },	// We only use datachannels
              success: function(jsep) {
                console.log(self.opaqueId, ":", "Got SDP!");
                //console.log(self.opaqueId, ":", jsep);
                var body = { "request": "ack" };
                self.pluginHandle.send({"message": body, "jsep": jsep});
              },
              error: function(error) {
                console.error(self.opaqueId, ":", "WebRTC error:", error);
              }
            });
          }
        },

        ondataopen: function() {
          console.log(self.opaqueId, ":", "The DataChannel is available!");
          //self.initRoom()
        },

        ondata: function(data) {
          console.log(self.opaqueId, ":", "We got data from the DataChannel! ")

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
            msg = replaceEmoticons(msg);
            msg = msg.replace(new RegExp('<', 'g'), '&lt');
            msg = msg.replace(new RegExp('>', 'g'), '&gt');
            msg = msg.replace(new RegExp('\\n.{1}', 'g'), '<br>');
            var from = json["from"];
            var dateString = self.getDateString(json["date"]);
            var whisper = json["whisper"];

            if(whisper === true) {
              // Private message
              let sender = self.participants[from]
              self.alert.open("<p>from: " + sender.display + "</p>" + msg, {
                  title: 'Private Message',
              })
            } else {
              // Public message
              self.messages.push( {
                from: self.participants[from].display,
                color: self.participants[from].color,
                msg: Autolinker.link(strip_tags(msg)),
                date: dateString,
              })
              if (!self.is_active)
                self.new_messages++;

              event_bus.$emit('message', {
                from: self.participants[from].display,
                color: self.participants[from].color,
                msg: Autolinker.link(strip_tags(msg)),
              });

              window.setTimeout( function() {
                self.$refs.chatbar.$el.scrollTop = self.$refs.chatbar.$el.scrollHeight;
              }, 200);
            }

          } else if(what === "join") {

            self.addUserToList(username, display);

          } else if(what === "leave") {

            self.toast.open(self.participants[username].display + " left " + self.room_info.description)
            self.removeUserFromList(username);

          } else if(what === "kicked") {

            if(username === self.username) {
              self.alert.open('You got; kicked out!');
              self.is_open = false
            } else {
              self.toast.open(self.participants[username].display + " got kicked out")
            }
            self.removeUserFromList(username);

          } else if(what === "destroyed") {

            if(json["room"] !== self.room)
              return;
            self.alert.open('The room ' + self.room + ' has been destroyed!')
            console.log(self.opaqueId, ":", "The room has been destroyed!");

          } else if(what === "list") {

            if(json["room"] !== self.room)
              return;
          }  else if(what === "list") {

            self.alert.open('Error: ' + json["error"])
            console.log(self.opaqueId, ":", "Error: " + json["error"])
          }

        },
        oncleanup: function() {
          console.log(self.opaqueId, ":", " ::: Got a cleanup notification :::");
        }
      });
    },

    registerUser() {
      let self = this;
      console.log(self.opaqueId, ":", "register user");
      self.username = Janus.randomString(12);
      var transaction = Janus.randomString(12);
      var register = {
        textroom: "join",
        transaction: transaction,
        room: self.room,
        username: self.username,
        display: self.display,
      };

      if (self.password)
        register.pin = self.password

      self.transactions[transaction] = function(response) {
        if(response["textroom"] === "error") {
          if(response["error_code"] === 417) {
            console.log(self.opaqueId, ":",  self.room + "does not exist." );
          } else if(response["error_code"] === 413) {
            console.log(self.opaqueId, ":", self.room + "needs a pin" );
            self.alert.open('The room ' + self.room_info.description + ' needs a pin!')
          } else if(response["error_code"] === 419) {
            console.log(self.opaqueId, ":", self.room + " needs a pin" );
            self.alert.open('Wrong Pin!')
            self.askForUsername();
          } else {
            console.log(self.opaqueId, ":", response["error"]);
          }
          return;
        }
        // We're in
        console.log(self.opaqueId, "a", self.is_open, self.is_active);
        console.log(self.opaqueId, ":", "we are in");
        self.loading = false;
        self.webRTCUp = true;

        self.$emit('hasNick', self.display)
        if (self.password)
          self.$emit('hasPassword', self.password)

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
          console.log(self.opaqueId, ":", ":ERR" + reason);
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
              console.log(self.opaqueId, ":", "Whisper sent")
            }
          });
        }
      })
    },

    sendMsg() {
      let self = this;
      self.msg = self.msg.trim();
      if(self.msg.length < 1) {
        self.msg = ""
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
        success: function() { self.msg = "" }
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
      this.is_active = true;
      if (this.webRTCUp) {
        this.is_open = true
      } else {
        this.login()
      }
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
.textroom { max-height:300px !important}

.textroom .new_message_counter {
  display: inline-block;
  text-align: center;
  background: red;
  color: white;
  border-radius: 50%;
  font-size: 0.8em;
  width:1.5em;
  height:1.4em;
  line-height: 1.5em;
  margin-left: 1.5em;
}

.textroom .chatroom { flex: 1 1 auto;display:flex; max-height:70%; }
.textroom .participants {
  font-size: 90%;
  overflow-y: auto;
  flex: 0 0 25%;
  margin-right: 10px;
  word-wrap: break-word;
}
.textroom .participants ul  {padding-left: 24px}
.textroom .participant span { cursor: pointer}

.textroom .chat {
  overflow-y: auto;
  flex: 1 1 auto;
}
.textroom .chat {  padding-left: 0.7rem }
.textroom .chat .item { padding:0px 20px 0px 0px; margin-bottom:0px}
.textroom .chat .user { font-style:italic; font-size: 90%; opacity: 0.8}
.textroom .chat .item .username { padding: 0 0.2rem 0 1rem; }
.textroom .chat .item .msg { padding:0.2rem 0 0.5rem 0.4rem; word-break: break-word}

.textroom .me { line-height:2.5em; margin-right: 10px;}
.textroom .msg_editor {
    text-align:left;
    padding-top:0px;
    line-height:2.5em;
    margin-right:0rem;
}
.textroom .emojicol {
  line-height:2.5em;
  padding-left:0px
}

.textroom .talk { flex:  0 0 auto; padding:0.7rem 0; margin-top: 1rem; border-top: 1px solid var(--color-fg); }
.textroom .loadingComponent {position: absolute;top:40px;width:100%;height:100%;background:rgba(255, 255, 255, 0.7)}
.textroom .loadingComponent div {position: absolute; top:50%; left: 50%; transform:translate(-50%,-50%)}
.textroom .loading { }

.textroom .emoji-picker {
  text-align: center;
  position: absolute;
  z-index: 1;
  line-height:1em;
  border: 1px solid var(--color-fg);
  width: 15rem;
  height: 20rem;
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 1rem;
  box-sizing: border-box;
  border-radius: 0.5rem;
  background: var(--color-bg);
  box-shadow: 1px 1px 8px #c7dbe6;
  transform: translate(-12rem,-23rem);
  margin-bottom:24px;
}
.textroom .emoji-picker__search {
  display: flex;
}
.textroom .emoji-picker__search > input {
  flex: 1;
  border-radius: 0rem;
  border-bottom: 1px solid var(--color-fg) !important;
  padding: 0.2rem 1rem;
  margin-bottom:1.5rem;
}
.textroom .emoji-picker h5 {
  margin-bottom: 0;
  color: var(--color-fg);
  text-transform: uppercase;
  font-size: 0.8rem;
  cursor: default;
}
.textroom .emoji-picker .emojis {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;

}
.textroom .emoji-picker .emojis:after {
  content: "";
  flex: auto;
}
.textroom .emoji-picker .emojis span {
  padding: 0.2rem;
  cursor: pointer;
  border-radius: 0px;
}
.textroom .emoji-picker .emojis span:hover {
  background: #ececec;
  cursor: pointer;
}

@media (max-width:421px) {
  .textroom .participants {display: none}
}

</style>
