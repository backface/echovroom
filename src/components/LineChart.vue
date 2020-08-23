<template>
  <div class="chart">
    <svg :width="width + 'px'" :height="height">
      <path
        :d="path"
        class="line"
        fill="none"
        stroke-width="1"
        stroke="black"
      />
      <g></g>
    </svg><br />

  </div>
</template>

<script>
import * as d3 from 'd3'

export default {

  name: 'LineChart',
  props: {
    length: Number,
    date: Date,
    data: Array,
    width: { default: 240, type: Number },
    height: { default: 160, type: Number },
    ticks: { default: false, type: Boolean },
  },

  data: function() {
    return {
      margin_x: 2,
      margin_y: 5,
      path:""
    }
  },

  computed: {


    display_data () {
      //return this.data.filter(d => d.date <= this.date)
      return this.data
    },


  },

  methods: {
    renderPath() {
      let self = this;
      return  d3.line()
        .x(function(d,i) { return self.scale_x(i); })
        .y(function(d) {  return self.scale_y(d); })(self.data)
    },

    axis_x(d) {
      let self = this;
      if (self.ticks) {
        return d3.axisTop(self.scale_x)
          .tickValues(d3.range(0, self.data.length, 7))
          .tickFormat("")(d);
      } else
        return false
    },

    scale_x (d) {
      let self = this;
      return  d3.scaleTime()
        .range([self.margin_x, self.width - self.margin_x])
        .domain([0, self.data.length])(d);
    },

    scale_y (d) {
      let self = this;
      return  d3.scaleLinear()
        .range([self.height - self.margin_y * 2, self.margin_y])
        .domain(d3.extent(self.data))(d)
    },


  },

  mounted () {

  },

  watch:  {
    length: function() {
      this.path = this.renderPath();
    }
  },

}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#map {
  padding:0;margin:0;
  height: 100%;
  width: 100%;
}
svg { margin-top:10px}
svg .axis path { display: none !important;}

</style>
