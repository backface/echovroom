<template>
  <div class="stage">
    <iframe v-if="src" :src="src + '?autoplay=true&mute=1'"
      style="border:none;"
      allowfullscreen="true"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      scrolling="no" width="800" height="350" frameborder="0" align="middle">
    </iframe>
  </div>
</template>

<script>
export default {
  name: 'Stage',
  props: {
    src: {
      type: String,
      default: ""
    },
  },

  data() {
    return {
      publicPath: process.env.publicPath
    }
  },
  methods: { },
}
</script>

<style scoped>
iframe { height: 100%}
</style>
