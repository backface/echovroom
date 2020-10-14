<template>
  <v-dialog v-model="dialog" :max-width="options.width" :style="{ zIndex: options.zIndex }" persistent>
    <v-card>
      <v-card-title class="headline">{{title}}</v-card-title>

        <v-form ref="deviceForm" v-model="valid" :lazy-validation="lazy" @submit.prevent="">

          <v-card-text>
            <v-select dense
              v-model="selected_video_device"
              :items="video_devices"
              item-text="label"
              item-value="id"
              label="Video device"
              return-object
            ></v-select>

            <v-select dense
              v-model="selected_audio_device"
              :items="audio_devices"
              item-text="label"
              item-value="id"
              label="Audio device"
              return-object
            ></v-select>

            <v-select dense
              v-model="selected_resolution"
              :items="resolutions"
              item-text="id"
              item-value="id"
              label="Resolution"
              return-object
            ></v-select>

            <v-select dense
              v-if="options.bitrates"
              label="Cap Bitrate"
              v-model="selected_bitrate"
              :items="options.bitrates"
            ></v-select>

          </v-card-text>
        </v-form>



      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn v-if="options.cancelable" color="grey darken-1" text @click.native="cancel">Cancel</v-btn>

        <v-btn id="login" type="submit" color="primary darken-1" text @click.native="confirm"
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
    selected_bitrate: 0,
    selected_resolution: {},
    resolutions: [
      { id:"lowres", width: 320, heigth:240 },
      { id:"lowres-16:9", width: 320, heigth:180 },
      { id:"stdres", width: 640, heigth:480 },
      { id:"stdres-16:9", width: 640, heigth:360 },
      { id:"hires", width: 1280, heigth:720 }
    ],
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
      this.title = "Settings"

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

        if  (options.current_audio_device === device.deviceId)
          self.selected_audio_device = option;

        if  (options.current_video_device ===  device.deviceId)
          self.selected_video_device = option;

      });

      console.log(self.selected_video_device);
      if (!self.selected_video_device.id)
        self.selected_video_device = self.video_devices[0];
      if (!self.selected_audio_device.id)
        self.selected_audio_device = self.audio_devices[0];

      this.selected_bitrate = options.bitrate;
      this.selected_resolution = options.resolution;

      this.options = Object.assign(this.options, options)
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },

    validateForm() {
      this.$refs.deviceForm.validate()
    },

    confirm() {
      if (this.$refs.deviceForm.validate()) {
        this.resolve(
          {
            video_device: this.selected_video_device.id,
            audio_device: this.selected_audio_device.id,
            bitrate: this.selected_bitrate,
            resolution: this.selected_resolution,
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
