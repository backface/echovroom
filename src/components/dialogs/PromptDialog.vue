<template>
  <v-dialog v-model="dialog" :max-width="options.width"
    :style="{ zIndex: options.zIndex }" persistent
    @keyup.enter.escape="cancel"
  >
    <v-card>
      <v-card-title class="headline">{{ options.title }}</v-card-title>
      <v-card-text>
        {{ text }}
        <v-form ref="messageForm" v-model="valid" :lazy-validation="lazy">
          <v-text-field
            :placeholder="options.placeholder"
            v-model="message"
            :rules="messageRules"
            @keyup.enter.exact="send"
            required
            ref="message"
            :type="options.type"
          >
          </v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn v-if="options.cancelable" color="grey darken-1" text @click.native="cancel">Cancel</v-btn>
        <v-btn type="submit" color="primary darken-1" text @click.native="send"
        :disabled="!valid"
         >{{ options.confirm  }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import {VCard, VDialog, VBtn, VSpacer, VForm} from 'vuetify/lib'


export default {
  name: 'prompt-dialog',

  components: {
    VCard, VDialog, VBtn, VSpacer, VForm
  },

  data: () => ({
    dialog: false,
    resolve: null,
    reject: null,
    valid: true,
    lazy: false,
    text: null,
    message: "",
    messageRules: [
      value => !!value || "Message can't be empty",
    ],

    options: {
      color: 'primary',
      width: 290,
      zIndex: 200,
      type: "text",
      cancelable: true,
      confirm: "OK"
    }
  }),

  methods: {
    open(text, options) {
      this.dialog = true
      this.text = text

      setTimeout(() => {
        this.$refs.messageForm.reset();
        this.$refs.message.focus()
      })
      this.options = Object.assign(this.options, options)
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    validateForm() {
      this.$refs.messageForm.validate()
    },

    cancel() {
      this.dialog = false
      this.reject({ error: "canceled" })
    },

    send() {
      if (this.$refs.messageForm.validate()) {
        this.resolve(this.message)
        this.dialog = false
      }
    },
  }
}
</script>
