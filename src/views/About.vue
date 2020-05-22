<template>
  <div class="about">
    <h1 class="title">Who needs Zoom? We Vroom!</h1>
    <p>Vroom is in progress. <br />Things might break. <br /> Don't complain.</p>
    <p>
      Anything else:<br />
      <a :href="'mailto:' + email">{{email}}</a>
    </p>

  </div>
</template>

<script>

export default {
  name: 'About',

  data() {
    return {
      email: "one@sbbivm.klm".replace(/[a-zA-Z]/g,
          function(c){return String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);})
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
.about a { text-decoration: underline; color:black !important}
.about h1.title { margin-bottom: 3rem}
</style>
