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
      type: String,
      default: "false"
    },
    open: {
      type: String,
      default: "false"
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
    }
  },

  mounted() {
    this.toast = this.$refs.toast;
    this.alert = this.$refs.alert;
    if (this.roombyId > 0)
      this.room = this.roombyId
    if (this.roombyName.length > 2) {
      this.room = this.hashCode(this.roombyName)
      this.room_name = this.roombyName
    }
    this.is_open = this.open === "true"

    if(this.host) {
      console.log("has host");
      this.server = this.host
    }

  },

  methods: {

    loadConfig() {
      fetch('config.json')
        .then(r => r.json())
        .then(json => {
          console.log("load config", json);
          if (!this.server) this.server = json.server;
          if (!this.iceServers) this.iceServers = json.iceServers;
          if (this.room === 0) {
            if (typeof json.room === "string") {
              this.room = this.hashCode(json.room)
              this.room_name = json.room
            } else {
              this.room = json.room
            }
          }
          this.initJanus()
      })
    },

    initJanus () {
      this.loading = true

      console.log('calling Janus init')

      Janus.init({
        debug: 'all',
        callback: () => {
          this.janus = new Janus(
            {
              server: this.server,
              iceServers: this.iceServers,
              success: () => {
                console.log("janus initialized");
              //  Janus.listDevices( (d) => {
              //    console.log("available devices: ");
              //    d.forEach( d => console.log(d))
              //  })
                this.$emit("hasJanus", this.janus)
                this.attachPlugin()
              },
              error: (cause) => {
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

      let self=this;
      //if(/[^a-zA-Z0-9]/.test(username)) {
        console.log(self.initial_participants)
      self.$refs.login.open("Your name?", { participants: self.initial_participants} ).then((nick) => {
        self.display = nick;
        ////if (self.initial_participants.find(d => d.display == nick)) {
          //self.askForUsername();
        //} else {
          self.registerUser()
        //}
      })
      /*
      self.$buefy.dialog.prompt({
          container: self.dialog_container,
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
              self.askForUsername(true, container);
            } else {
              self.registerUser()
            }
          }
      }) */
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
      if (self.pluginName === "textroom") {
        request.textroom = request.request;
      }
      console.log(self.display, self.room, request, self.pluginHandle);
      self.pluginHandle.send({"message": request});
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
      self.pluginHandle.send({
        "message": request,
        success: function(response) {
          console.log("left room successull");
          console.log(response);
        }
      });
      self.is_open=false
      this.$forceUpdate()
    },

    login() {
      let self = this;
      if (!self.is_open)
        self.is_open = true;

      console.log(self.opaqueId, "ask for participants");
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
          console.log(response);
          self.initial_participants = response.participants;
          self.count = response.participants.length
          self.$emit('participantNumberChanged', self.count)


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
              console.log(self.opaqueId, "room info for", self.room, self.room_info);
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
        self.getParticipantList();
        if (self.is_open)
          self.login()
      });
    },

    createRoom() {
      return new Promise((resolve, reject) => {
        let self = this;
        console.log(self.opaqueId, "create room ", self.room);
        var transaction = Janus.randomString(12);
        var request = self.room_options
        request.transaction = transaction
        request.request = "create"
        request.room = self.room
        request.description = self.room_name
        console.log(request);

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

    hashCode(string) {
      var hash = 0, i = 0, len = string.length;
      while ( i < len ) {
          hash  = ((hash << 5) - hash + string.charCodeAt(i++)) << 0;
      }
      return (hash + 2147483647) + 1
    },

  }
};
