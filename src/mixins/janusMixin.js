import Janus from '../janus'

export const janusMixin = {
  data () {
    return {
      server: null,
      iceServer: null,
      janus:null
    }
  },

  methods: {

    loadConfig() {
      fetch('config.json')
        .then(r => r.json())
        .then(json => {
          console.log(json);
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

  }
};
