<template>
  <v-dialog v-model="dialog" :max-width="options.width" :style="{ zIndex: options.zIndex }" persistent>
    <v-card>
      <v-card-title class="headline">{{title}}</v-card-title>
      <v-card-text>
        <v-form ref="signUpForm" v-model="valid" :lazy-validation="lazy" @submit.prevent="">
          <v-text-field
            id="username"
            placeholder="Petra Pan"
            v-model="username"
            :rules="nameRules.concat(userExistsRule)"
            @keyup.enter.exact="login"
            required
            ref="username"
            v-if="options.with_name"
          >
          </v-text-field>
          <v-text-field
            id="password"
            label="Password"
            type="password"
            v-model="password"
            ref="password"
            @keyup.enter.exact="login"
            v-if="options.with_password"
            >
          </v-text-field>

        </v-form>


      </v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn id="login" type="submit" color="primary darken-1" text @click.native="login"
        :disabled="!valid"
         >Enter</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import {VCard, VDialog, VBtn, VSpacer, VForm} from 'vuetify/lib'

export default {
  name: 'login-dialog',

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
    username: "",
    password: null,
    nameRules: [
      value => !!value || 'You must provide a user name',
      value => value.length > 0 || 'Name should be at least 1 letter long',
    ],
    options: {
      color: 'primary',
      width: 290,
      zIndex: 2000,
      participants: [],
      with_password: false,
      with_name: true
    }
  }),

  methods: {
    open(title="", options) {
      this.dialog = true
      this.title = title
      this.options = Object.assign(this.options, options)

      if (this.options.with_name)
        setTimeout(() => this.$refs.username.focus())
      else if(this.options.with_password)
        setTimeout(() => this.$refs.password.focus())

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
        this.resolve( { nick:this.username, pin:this.password})
        this.dialog = false
      }
    },

    userExistsRule(value) {
      return (!this.options.participants.find(d => d.display === value)) || 'Name in use'
    }
  }
}
</script>
