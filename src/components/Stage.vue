<template>
  <div class="stage">
    <img src="../assets/testbild.jpg">
  </div>
</template>

<script>
export default {
  name: 'Stage',
  props: {

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
