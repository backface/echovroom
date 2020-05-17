<template>
  <v-dialog v-model="dialog" :max-width="options.width" :style="{ zIndex: options.zIndex }" persistent
      @keyup.enter.escape="cancel">
    <v-card>
      <v-card-title class="headline">Setup RTP Forwarding</v-card-title>
      <v-card-text>
        <v-form ref="rtpform" v-model="valid" :lazy-validation="lazy" @submit.prevent="">
          <v-text-field
            placeholder="foo.example.com"
            label="host"
            v-model="host"
            :rules="serverRules"
            @keyup.enter.exact="configure"
            required
          >
          </v-text-field>
          <v-text-field
            placeholder="5551"
            label="video port"
            v-model="video_port"
            :rules="portRules"
            @keyup.enter.exact="configure"
            required
            >
          </v-text-field>
          <v-text-field
            placeholder="5552"
            label="audio port"
            :rules="portRules"
            v-model="audio_port"
            @keyup.enter.exact="configure"
            required
            >
          </v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click.native="cancel">Cancel</v-btn>
        <v-btn type="submit" color="primary darken-1" text @click.native="configure"
        :disabled="!valid"
         >Enter</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import {VCard, VDialog, VBtn, VSpacer, VForm} from 'vuetify/lib'

export default {
  name: 'rtp-dialog',

  components: {
    VCard, VDialog, VBtn, VSpacer, VForm
  },

  data: () => ({
    dialog: false,
    resolve: null,
    reject: null,
    title: null,
    valid: true,
    lazy: false,
    host: "",
    video_port: "",
    audio_port: "",
    serverRules: [
      value => !!value || 'You must provide a server name',
      //value => value.length > 0 || 'Name should be at least 1 letter long',
    ],
    portRules: [
      value => !!value || 'You must provide a port',
      value => parseInt(value) > 0 || 'port should be valid number',
    ],
    options: {
      color: 'primary',
      width: 290,
      zIndex: 2000,
    }
  }),

  methods: {
    open(options) {
      this.dialog = true
      this.options = Object.assign(this.options, options)
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },

    validateForm() {
      this.$refs.rtpform.validate()
    },

    cancel() {
      this.dialog = false
      this.reject({ error: "canceled" })
    },

    configure() {
      if (this.$refs.rtpform.validate()) {
        this.resolve( {
            host:this.host,
            audio_port: parseInt(this.audio_port),
            video_port: parseInt(this.video_port)
        })
        this.dialog = false
      }
    },

  }
}
</script>
