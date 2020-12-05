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
.home { text-align:center; z-index:20;  }
.home input {
  border:0px; border-bottom: 1px solid var(--color-fg); background:none; font-size:1.5rem; text-align:center;
  padding: 5px;
}
.home input::placeholder { opacity: 0.2}

.shortcuts { max-width: 90%; padding: 50px 0px; margin:auto;}
.shortcuts a { margin:10px; color: var(--color-a);  background: var(--color-bg); padding:1px 5px}
.shortcuts a:hover { filter:invert(1) }
.shortcuts .title { opacity:0.2}

.logo { z-index:0;width:480px; height:480px; position: fixed; bottom:-180px; left: 80%; transform: translate(-50%,0); overflow:hidden}


@media (max-width:461px) {
  .logo { z-index:20;width:256px; height:256px; position: fixed; bottom:-80px; left: 50%; transform: translate(-50%,0); overflow:hidden}
}
</style>
