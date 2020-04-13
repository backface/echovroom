<template>
  <div class="stage">
    <img :src="`${publicPath}/img/testbild.jpg`">
  </div>
</template>

<script>
export default {
  name: 'Stage',
  props: {

  },

  data() {
    return {
      publicPath: process.env.BASE_URL
    }
  },

  methods: {

  },

}
</script>

<style scoped>
iframe { height: 100%}
</style>
