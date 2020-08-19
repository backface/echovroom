<template>
  <div class="about">
    <h1 class="title">Who needs Zoom? We Vroom!</h1>

    <p>Communication is at the core of society and digital communication is a central part of our everyday life.
      It is especially critical in times of crisis and limited mobility.</p>
    <p>Unfortunately, current digital communication platforms are:</p>
    <p>1. dominated by a few big players, proprietary infrastructures, and business models based on data extraction and surveillance.</p>
    <p>2. massively limited by a mono-culture of representation. Much like Powerpoint has limited the range of expressions by
      forcing its users into the format of a business presentation, no matter what their actual context is,
      so do the current video-communication platform force everyone into the setting of a business meeting.
      On that level, there is relatively little difference between proprietary and open source software.
      Matthew Fuller's verdict on OpenOffice <i>"It's free software but not free  thinking"</i> applies here too.</p>
    <p>It speaks volumes that we even lack a proper verb for digital audio-visual communication and the names of the most popular companies
      of a given time are used to describe what was essentially developed for business-oriented video conferences.
      "Zoom fatigue" is real and caused not only by too much screen time but by too much monoculture: always the same grid of video
      images and audio settings that filter and cut off everything that is not recognized as a 'speaker'.
      This is useful in the context of structured meetings and conferences, but for many other kinds of social gatherings --
      cultural events, meet-ups switching between various one-to-one or small group conversations, artists or musicians performing together remotely for a remote audience including feedback and interaction -- this is hugely limiting.
      There is a lot of ground uncovered.
    </p>
    <p>To explore some of this ground, I created this first prototype. Contemporary base technologies such as a browser and <a href="https://en.wikipedia.org/wiki/WebRTC">WebRTC</a>
      would allow us to create more diverse technologies of video communication</p>
    <p>The tools we use shape us. Nowhere is this less apparent than in artistic creation and thinking</p>


    <p>
        Brought to you by
      <a href="https://m.ash.to">m.ash.to</a>, <a href="https://www.fooviz.xyz">FOOVIZ.XYZ</a> in collaboration with <a href="https://echoraeume.klingt.org/" style="color:black;text-decoration:underline">echoraeume</a><br>
    </p>

    <p>
      Questions? Offers? <br>
       <a :href="'mailto:' + email">{{email}}</a>
    </p>

    <br>
    <br>
    <br>
    <br>

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
.about { text-align: left}
</style>
