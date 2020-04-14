import Janus from '../janus'

export const janusMixin = {

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
    }
  },

  methods: {

    loadConfig() {
      fetch('config.json')
        .then(r => r.json())
        .then(json => {
          console.log("load config", json);
          this.server = json.server;
          this.iceServers = json.iceServers
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
                this.$emit("hasJanus", this.janus)
                this.attachPlugin()
              },
              error: (cause) => {
                console.log(cause)
              },
              destroyed: () => {
                console.log('janus init destroyed')
              }
            })
        }
      })
    },

    attachPlugin() {
      // should be implemented by component!

    },

    askForUsername(exists=false, container=null) {
      let self =this;
      console.log(exists);
      //if(/[^a-zA-Z0-9]/.test(username)) {
      self.$buefy.dialog.prompt({
          container: container,
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
      })
    },

  }
};
