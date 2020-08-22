<template>
  <v-dialog v-model="dialog" :max-width="options.width" :style="{ zIndex: options.zIndex }" persistent>
    <v-card>
      <v-card-title class="headline">{{title}}</v-card-title>
      <v-card-text>
        <v-form ref="signUpForm" v-model="valid" :lazy-validation="lazy" @submit.prevent="">

          <v-card-actions>
            <v-checkbox v-model="login_videochat" class="" label="videochat"></v-checkbox>
            <v-spacer></v-spacer>
            <v-checkbox v-model="login_muted" class="mx-2" :disabled="!login_videochat" label="mute on start"></v-checkbox>
          </v-card-actions>
        </v-form>


      </v-card-text>
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
import {VCard, VDialog, VBtn, VSpacer, VForm, VCheckbox} from 'vuetify/lib'

export default {
  name: 'pre-login-dialog',

  components: {
    VCard, VDialog, VBtn, VSpacer, VForm, VCheckbox,

  },

  data: () => ({
    dialog: false,
    resolve: null,
    reject: null,
    title: null,
    valid: true,
    lazy: false,
    login_muted: true,
    login_videochat: true,
    options: {
      color: 'primary',
      width: 300,
      zIndex: 2000,
      cancelable: true
    }
  }),

  methods: {
    open(title="", options) {
      this.dialog = true
      this.title = title
      this.options = Object.assign(this.options, options)
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },

    validateForm() {
      this.$refs.signUpForm.validate()
    },

    login() {
      if (this.$refs.signUpForm.validate()) {
        this.resolve(
          {
            login_videochat: this.login_videochat,
            login_muted: this.login_muted,
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
