<template>
  <v-dialog v-model="dialog" :max-width="options.width" :style="{ zIndex: options.zIndex }" @keydown.esc="cancel">
    <v-card class="text-center">
      <v-card-title>{{title}}</v-card-title>
      <v-card-text v-show="!!message" class="pa-4" v-html="message"></v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn v-if="options.cancelable" color="grey darken-1" text @click.native="cancel">{{cancelText}}</v-btn>
        <v-btn color="green darken-1" text @click.native="agree">{{confirmText}}</v-btn>
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
    cancelText: "cancel",
    confirmText: "OK",
    options: {
      color: 'primary',
      width: 290,
      zIndex: 2000,
      cancelable: false,

    }
  }),
  methods: {
    open(message, options) {
      this.dialog = true
      this.message = message
      if (options) {
        if (options.title)
          this.title  =  options.title.replace(new RegExp('\\n.{1}', 'g'), '<br>');
        if (options.cancelText)
          this.cancelText = options.cancelText
        if (options.confirmText)
          this.confirmText = options.confirmText
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
