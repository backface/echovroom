<template>
  <v-dialog v-model="dialog" :max-width="options.width" :style="{ zIndex: options.zIndex }" @keydown.esc="cancel">
    <v-card>
      <v-card-title class="" >{{title}}</v-card-title>
      <v-card-text v-show="!!message" class="pa-4" v-html="message"></v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn v-if="options.cancelable" color="grey darken-1" text @click.native="cancel">Cancel</v-btn>
        <v-btn color="green darken-1" text @click.native="agree">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import {VCard, VDialog, VBtn, VSpacer} from 'vuetify/lib'

export default {
  name: "alert-dialog",

  components: {
    VCard, VDialog, VBtn, VSpacer
  },

  data: () => ({
    dialog: false,
    resolve: null,
    reject: null,
    message: null,
    title: null,
    options: {
      color: 'primary',
      width: 290,
      zIndex: 2000,
      cancelable: false
    }
  }),
  methods: {
    open(message, options) {
      this.dialog = true
      this.message = message
      if (options) {
        this.title  =  options.title.replace(new RegExp('\\n.{1}', 'g'), '<br>');
      }
      this.options = Object.assign(this.options, options)
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    agree() {
      this.resolve(true)
      this.dialog = false
    },
    cancel() {
      this.resolve(false)
      this.dialog = false
    }
  }
}
</script>
