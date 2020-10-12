<template>
  <v-dialog v-model="dialog" :max-width="options.width" :style="{ zIndex: options.zIndex }" persistent>
    <v-card>
      <v-card-title class="headline">{{title}}</v-card-title>

        <v-form ref="deviceForm" v-model="valid" :lazy-validation="lazy" @submit.prevent="">

          <v-card-text>
            <v-select
              v-model="selected_video_device"
              :items="video_devices"
              item-text="label"
              item-value="id"
              label="video device"
              persistent-hint
              return-object
              single-line
            ></v-select>

            <v-select
              v-model="selected_audio_device"
              :items="audio_devices"
              item-text="label"
              item-value="id"
              label="audio device"
              persistent-hint
              return-object
              single-line
            ></v-select>

            <v-select v-if="options.bitrates" label="Cap Bitrate" dense v-model="selected_bitrate" :items="options.bitrates"></v-select>

          </v-card-text>
        </v-form>



      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn v-if="options.cancelable" color="grey darken-1" text @click.native="cancel">Cancel</v-btn>

        <v-btn id="login" type="submit" color="primary darken-1" text @click.native="login"
        :disabled="!valid"
         >Enter</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import {VCard, VDialog, VBtn, VSpacer, VForm, VSelect} from 'vuetify/lib'

export default {
  name: 'device-dialog',

  components: {
    VCard, VDialog, VBtn, VSpacer, VForm, VSelect,

  },

  data: () => ({
    dialog: false,
    resolve: null,
    reject: null,
    audio_devices: [],
    video_devices: [],
    title: null,
    valid: true,
    lazy: false,
    selected_audio_device: {},
    selected_video_device: {},
    selected_bitrate: null,
    options: {
      color: 'primary',
      width: 300,
      zIndex: 2000,
      cancelable: true,
    },
  }),

  methods: {
    open(devices=[], options) {
      var self = this;
      this.dialog = true
      this.title = "device selection"

      console.log(devices);

      devices.forEach(function(device) {
        var label = device.label;
        if(label === null || label === undefined || label === "")
          label = device.deviceId;
        var option = { id: device.deviceId, label: label }


        if(device.kind === 'audioinput') {
          self.audio_devices.push(option);
        } else if(device.kind === 'videoinput') {
          self.video_devices.push(option);
        }
      });

      this.selected_video_device = self.video_devices[0];
      this.selected_audio_device = self.audio_devices[0];

      this.options = Object.assign(this.options, options)
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },

    validateForm() {
      this.$refs.deviceForm.validate()
    },

    login() {
      if (this.$refs.deviceForm.validate()) {
        this.resolve(
          {
            video_device: this.selected_video_device.id,
            audio_device: this.selected_audio_device.id,
            bitrate: this.selected_bitrate,
          })
        this.dialog = false
      }
    },
    cancel() {
      this.resolve(false)
      this.dialog = false;
    },

  }
}
</script>

<style>
.mx-2 {margin-top:0px}
</style>
