<template>
  <div class="home">

    <input ref="room_input"
      class="in"
      type="text"
      v-model="room_name"
      v-on:keyup.enter.exact="enterRoom"
      placeholder="Enter or create a Room"
    />

    <img class="logo" src="../assets/vroom.jpg">
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
.home {  }
.home input {
  border:0px; border-bottom: 1px solid black; background:none; font-size:1.5rem; text-align:center;
  padding: 5px;
}
.home input::placeholder { opacity: 0.2}
.logo { z-index:2000;width:480px; height:480px; position: fixed; bottom:-180px; left: 80%; transform: translate(-50%,0); overflow:hidden}


@media (max-width:461px) {
  .logo { z-index:20;width:256px; height:256px; position: fixed; bottom:-80px; left: 50%; transform: translate(-50%,0); overflow:hidden}

}
</style>
