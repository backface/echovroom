<template>
  <div class="echo">
    <div class="stage">
      <div class='embed-container'>
        <Streaming />
      </div>
    </div>
    <Echorooms :roombyId="room" />
  </div>
</template>

<script>
import Echorooms from '@/components/Echorooms.vue'
import Streaming from '@/components/Streaming.vue'

export default {
  name: 'Demoroom',

  props: {
    room:  {
      type: Number,
      default: 777
    },
  },

  components: {
    Echorooms, Streaming
  },

  data() {
    return {
    }
  },

  destroyed () {
  },

  methods: {
  }

}
</script>

<style lang="css" scoped>

.embed-container { position: relative; padding:0; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;}
.embed-container iframe, .embed-container object, .embed-container embed, .embed-container div
  { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

.stage { width: 640px; margin: 0 auto; max-width: 100%; }
.echorooms { width: 640px; height:300px; margin: 20px auto;  max-width: 95%; }
</style>
