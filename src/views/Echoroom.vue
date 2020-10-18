<template>
  <div class="echo">
    <div class="stage"  v-if="$route.name != 'embed'">
      <div class='embed-container'>
        <iframe src="https://kontakta.modular-t.org:8443/html/loadbalancer.html" style="border:none;" allowfullscreen="true" scrolling="no" width="640" height=" 360" frameborder="0" align="middle"></iframe>
      </div>
    </div>
    <Echorooms :roombyName="roombyName" />
    <p style="font-size:90%">
      Componized version as seen on <a href="https://echoraeume.klingt.org/" style="color:black;text-decoration:underline">echoraeume</a><br>
    </p>
  </div>
</template>

<script>
import Echorooms from '@/components/Echorooms.vue'

export default {
  name: 'Echoroom',

  props: {
    roombyName: {
      type: String,
      default: "echoraueme"
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
.stage { width: 800px; margin: 0 auto; max-width: 100%; margin-bottom: 10px}

</style>
