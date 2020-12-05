<template>
  <div class="home">


    <div>
      <input ref="room_input"
        class="in"
        type="text"
        v-model="room_name"
        v-on:keyup.enter.exact="enterRoom"
        placeholder="Enter or create a Room"
      />
    </div>

    <div class="shortcuts">
      <p>or join:</p>

      <router-link v-for="f in shortcuts" :key="f.hash || f " :to="'/'+f" v-slot="{ href }">
          <a :href="href"  @click="menuOpen=false">
            {{ f.title || f }}
          </a>
      </router-link>

    </div>

    <br/>
    <br/>
    <br/>
    <br/>

    <img class="logo" src="../assets/vroom.jpg">

  </div>

</template>

<script>

export default {
  name: 'Home',

  data() {
    return {
      room_name: "",
      shortcuts: [
        "echoraeume", "echo",
         "grundltv", "stwst48x6"
         //{ title: "Porgy & Bess", hash:"porgy"}, "infolab",
      ]
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

</style>
