<template>
  <div id="app">
    <div class="stage">
      <div class='embed-container'>
        <Stage />
      </div>
    </div>

    <Echorooms />

  </div>
</template>

<script>
import Stage from './components/Stage.vue'
import Echorooms from './components/Echorooms.vue'
//import log from 'assets/logo.png'

export default {
  name: 'App',

  components: {
    Stage, Echorooms
  },

  data() {
    return {
    }
  },

  mounted () {
    console.log('mounted')
  },

  destroyed () {
  },

  methods: {
  }

}
</script>

<style>
#app {
  font-family: Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.embed-container { position: relative; padding:0; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;}
.embed-container iframe, .embed-container object, .embed-container embed, .embed-container div
  { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

.stage { width: 640px; margin: 0 auto; max-width: 100%; }
.echorooms { width: 640px; height:300px; margin: 20px auto;  max-width: 95%; }
</style>
