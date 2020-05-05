<template>
  <div class="home">
    <input ref="room_input"
      class="in"
      type="text"
      v-model="room_name"
      v-on:keyup.enter.exact="enterRoom"
      placeholder="Enter a Room"
    />
  </div>
</template>

<script>

export default {
  name: 'About',

  data() {
    return {
      room_name: ""
    }
  },

  mounted () {
    console.log('mounted')
    this.$refs.room_input.focus();
  },

  destroyed () {
  },

  methods: {
    enterRoom() {
      this.$router.push({ name: 'chat', params: { roombyName: this.room_name } })
    }
  }

}
</script>

<style scoped>
.home {  margin-top:15%; }
.home input {
  border:0px; border-bottom: 1px solid black; background:none; font-size:1.5rem; text-align:center;
  padding: 5px
}
.home input::placeholder { opacity: 0.2}

</style>
