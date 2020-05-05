<template>
  <div class="echo">
    <div class="stage"  v-if="$route.name != 'embed'">
      <div class='embed-container'>
        <iframe src="https://kontakta.modular-t.org:8443/html/loadbalancer.html" style="border:none;" allowfullscreen="true" scrolling="no" width="640" height=" 360" frameborder="0" align="middle"></iframe>
      </div>
    </div>
    <Echorooms :roombyId="room" />
  </div>
</template>

<script>
import Echorooms from '@/components/Echorooms.vue'

export default {
  name: 'Echoroom',

  props: {
    room:  {
      type: Number,
      default: 777
    },
  },

  components: {
     Echorooms,
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

</style>
