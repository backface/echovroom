<template>
  <v-snackbar v-model="dialog" :timeout="options.timeout">
   {{ message }}
  </v-snackbar>
</template>

<script>
import {VSnackbar} from 'vuetify/lib'

export default {
  name: "toast",

  components: {
    VSnackbar
  },

  data: () => ({
    dialog:false,
    message: "",
    resolve: null,
    reject: null,
    options: {
      timeout: 2000,
    }
  }),
  methods: {
    open(message, options) {
      this.message = message
      this.dialog = true
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
