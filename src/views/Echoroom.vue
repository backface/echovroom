<template>
  <div class="echo">
    <div class="stage">
      <div class='embed-container'>
        <Stage />
      </div>
    </div>
    <Echorooms />
  </div>
</template>

<script>
import Stage from '@/components/Stage.vue'
import Echorooms from '@/components/Echorooms.vue'

export default {
  name: 'About',

  components: {
    Stage, Echorooms
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

<style lang="css">

.embed-container { position: relative; padding:0; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;}
.embed-container iframe, .embed-container object, .embed-container embed, .embed-container div
  { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

.stage { width: 640px; margin: 0 auto; max-width: 100%; }
.echorooms { width: 640px; height:300px; margin: 20px auto;  max-width: 95%; }
</style>
