import Janus from '../janus'

export const janusMixin = {

  props: {
    nick:  {
      type: String,
      default: ""
    },
    myJanus: {
      type: Object,
      default: null
    },
    is_muted: {
      type: Boolean,
      default: false
    },
    open: {
      type: Boolean,
      default: false
    },
    roombyId: {
      type: Number,
      default: 0
    },
    roombyName: {
      type: String,
      default: ""
    },
    host: {
      type: String,
      default: ""
    },
    ice_servers: {
      type: Array,
      default: null
    },
    showRoomInfo: {
      type: Boolean,
      default: false
    },
    allowSettings: {
      type: Boolean,
      default: true
    },
    login_password: {
      type: String,
      default: null
    },
    emitCallEvents: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      server: null,
      iceServer: null,
      janus: null,
      transactions: {},
      username: null,
      display: null,
      rooms: [],
      room_info: {},
      count: 0,
      participants: {},
      initial_participants: [],
      room: 0,
      room_name: "",
      is_open: false,
      room_options: {},
      dialog_container: null,
      loading: true,
      toast:null,
      alert:null,
      webRTCUp:null,
      password:this.login_password,
      needs_pin: false,
    }
  },

  mounted() {
    console.log("screen size is ", window.screen.width, window.screen.height);
    console.log("device ratio is ",  window.devicePixelRatio);
    console.log("screen size with ratio is", window.screen.width * window.devicePixelRatio, window.screen.height * window.devicePixelRatio);
    this.toast = this.$refs.toast;
    this.alert = this.$refs.alert;
    if (this.roombyId > 0)
      this.room = this.roombyId
    else if (this.roombyName.length > 0) {
      this.room = this.hashCode(this.roombyName)
      this.room_name = this.roombyName
    }
    this.is_open = this.open

    if(this.host) {
      console.log("has host");
      this.server = this.host

    if(!this.server)
      this.server = [
        //"wss://" +  window.location.hostname + "/ws/janus",
        // window.location.protocol + "//" +  window.location.hostname + "/janus",
         "wss://" +  window.location.hostname + ":8989/janus",
          window.location.protocol + "//" +  window.location.hostname + ":8089/janus",
       ];
    }

    if(!this.iceServers) {
      this.iceServers =[
        {"urls": "stun:" + window.location.hostname },
        {"urls": "turn:" + window.location.hostname, "username": "turn", "credential": "hinterseer"}
      ];
    }

  },

  watch: {
    // whenever question changes, this function will run
    open: function (value) {
      console.log(value);
      if (value === true) {
        console.log("got an open request");
        this.login();
      }
    },
    login: function (value) {
      if (value === true)
        console.log("got a login request");
        this.login();
    }
  },

  methods: {

    isMobile() {
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      return isAndroid || isiOS;
    },

    loadConfig() {
      console.log(this.isMobile ? "is mobile" : "is desktop");
      console.log("loading chat config");
      fetch('vroom/config.json')
        .then(r => {
            return r.json()
        })
        .then(json => {
          // load servers from config file
          if (json.server) {
            console.log("janus server set from json");
            this.server = json.server;
          }
          if (json.iceServers)  {
            console.log("stun/turn set from json");
            this.iceServers = json.iceServers;
          }
          if (this.room === 0) {
            if (typeof json.room === "string") {
              this.room = this.hashCode(json.room)
              this.room_name = json.room
            } else {
              this.room = json.room
            }
          }
          this.initJanus()
        }).catch( () => {
          console.log("no valid config.json found");
          this.initJanus()
        })
    },

    initJanus () {
      let self = this;
      this.loading = true

      console.log(this.opaqueId, 'calling Janus init')

      Janus.init({

        debug: 'all',
        callback: () => {
          this.janus = new Janus(
            {
              server: self.server,
              iceServers: self.iceServers,
              success: () => {
                console.log("janus initialized");
              //  Janus.listDevices( (d) => {
              //    console.log("available devices: ");
              //    d.forEach( d => console.log(d))
              //  })
                this.$emit("hasJanus", self.janus)
                this.attachPlugin()
              },
              error: (cause) => {
                console.log(self.server);
                console.log(cause)
              },
              destroyed: () => {
                console.log('janus destroyed')
              }
            })
        }
      })
    },

    attachPlugin() {
      // should be implemented by component!

    },

    askForUsername() {
      console.log(this.opaqueId, "Ask for username");
      let self=this;
      //if(/[^a-zA-Z0-9]/.test(username)) {
      self.$refs.login.open("Your name?", {
        participants: self.initial_participants,
        with_password: self.needs_pin
      } ).then((r) => {
        self.display = r.nick;
        if (r.pin)
          self.password = r.pin;
        self.registerUser()
      })

    },

    registerUser() {
      let self = this;
      console.log(self.opaqueId, "register user");
      var transaction = Janus.randomString(12);
      var request = {
        //id: Janus.randomString(12),
        request: "join",
        room: self.room,
        ptype: "publisher",
        display: self.display,
        transaction: transaction
      };
      if (self.password)
        request.pin =  self.password

      if (self.pluginName === "textroom") {
        request.textroom = request.request;
      }
      self.pluginHandle.send({"message": request});
      self.$emit("opened");
    },

    leaveRoom() {
      let self = this;
      console.log(self.opaqueId, "leave room");
      var transaction = Janus.randomString(12);
      var request = {
        request: "leave",
        transaction: transaction,
        room: self.room,
      };
      if (self.pluginName === "textroom") {
        request.textroom = request.request;
      }

      if (self.pluginHandle) {
        self.pluginHandle.send({
          "message": request,
          success: function() {
            console.log("left room successull");
          }
        });
      }
      self.$emit('leavingRoom')
      self.is_open=false
      setTimeout(self.updateParticipantsInfo, 10000)
      this.$forceUpdate()
    },

    login() {
      let self = this;
      if (!self.is_open)
        self.is_open = true;

      console.log(self.opaqueId, "login");
      console.log(self.opaqueId, "ask for existing participants");
      var transaction = Janus.randomString(12);
      var request = {
        transaction: transaction,
        request: "listparticipants",
        room: self.room,
      };
      request[self.pluginName] = "listparticipants";

      self.pluginHandle.send({
        "message": request,
        success: function(response) {
          self.initial_participants = response.participants;
          self.count = response.participants.length
          self.$emit('participantNumberChanged', self.count)

          if (!self.nick) {
            console.log(self.opaqueId, "no name provided");
            self.askForUsername();
          } else if (self.initial_participants.find(d => d.display == self.nick)) {
            console.log(self.opaqueId, "username already taken");
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
      let self = this;
      console.log(self.opaqueId, "ask for participants", self.room);
      var transaction = Janus.randomString(12);
      var request = {
        transaction: transaction,
        request: "listparticipants",
        room: self.room,
      };
      self.pluginHandle.send({
        "message": request,
        success: function(response) {
          //console.log(response.participants);
          self.initial_participants = response.participants;
          self.count = self.initial_participants.length
        },
        error: function(reason) {
          console.log(reason);
        }
      });
    },

    getRoomsInfo() {
      return new Promise((resolve, reject) => {
        let self = this;
        console.log(self.opaqueId, "ask for rooms info", self.room );

        var transaction = Janus.randomString(12);
        var request = {
          request: "list",
          transaction: transaction,
        };
        if (self.pluginName === "textroom") {
          request.textroom = request.request;
        }
        self.pluginHandle.send({
          "message": request,
          success: function(response) {
            console.log(self.opaqueId, response);
            self.rooms = response.list;
            if (response.list.find(d => d.room == self.room)) {
              self.room_name = response.list.find(d => d.room == self.room).description
              self.room_info = response.list.find(d => d.room == self.room)
              self.needs_pin = response.list.find(d => d.room == self.room).pin_required;
              resolve(true);
            } else {
              self.createRoom().then( () => {
                resolve(true)
              })
            }
          },
          error: function(reason) {
            console.log(reason);
            reject(reason);
          }
        })
       })
    },

    initRoom() {
      let self = this
      self.getRoomsInfo().then(()=> {
        console.log(self.opaqueId, "init room");
        self.getParticipantList();
        setTimeout(self.updateParticipantsInfo, 10000)
        if (self.is_open)
          self.login()
      });
    },

    updateParticipantsInfo() {
      let self = this;
      self.getParticipantList()
      if (!self.is_open)
        setTimeout(self.updateParticipantsInfo, 10000)
    },

    createRoom() {
      return new Promise((resolve, reject) => {
        let self = this;
        console.log(self.opaqueId, "create room ", self.room, self.room_name);
        var transaction = Janus.randomString(12);
        var request = self.room_options
        request.transaction = transaction
        request.request = "create"
        request.room = self.room
        request.description = self.room_name

        if (self.password) {
          request.pin = self.password
        }

        self.pluginHandle.send({
          "message": request,
          success: function(response) {
            console.log(response);
            resolve(true);
          },
          error: function(reason) {
            console.log(reason);
            reject(reason);
          }
        });
      })
    },

    kick(id) {
      let self = this;
      let request = {
        "request": "kick",
        "room": this.room,
        "id": id
      }
      if (this.pluginName === "textroom") {
        request.username = id
      }
      self.pluginHandle.send({
        "message": request,
        success: function(response) {
          console.log(response);
        },
        error: function(reason) {
          console.log(reason);
        }
      });
      this.$emit('kick', id)
    },

    hashCode(string) {
      if(string == "echoraeume")
        return 777;
      if(string == "demoroom")
        return 1234

        var hash = 0, i = 0, len = string.length;
        while ( i < len ) {
            hash  = ((hash << 5) - hash + string.charCodeAt(i++)) << 0;
        }
        return (hash + 2147483647) + 1

    },

    getHash(input){
      var hash = 0, len = input.length;
      for (var i = 0; i < len; i++) {
        hash  = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0; // to 32bit integer
      }
      return hash;
    }


  }
};
