<template>
  <div class="stage">
    <iframe v-if="src" :src="src" style="border:none;" allowfullscreen="true"
      scrolling="no" width="800" height="350" frameborder="0" align="middle">
    </iframe>

    <img v-else src="../assets/testbild.jpg">
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

  methods: {

  },

}
</script>

<style scoped>
iframe { height: 100%}
</style>
