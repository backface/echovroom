<template>
  <div id="test">

    <video v-for="item in items" :key="item.id" v-bind:style="{position: 'fixed', top: item.y + 'px', left: item.x + 'px', width: 2*radius + 'px', height: 2*radius + 'px'}"
    v-hammer:pan="(event) => drag('drag', item, event)"
    v-hammer:panstart="(event) => drag('start', item, event)"
    v-hammer:panend="(event) => drag('stop', item, event)"
    >
  </video>


<div style="z-index:3002; color:red; top:50%; left:50%; position:absolute; transform:translate(-50%,-50%)">
#{{items_array.length}} using: {{ force_used_area_perc }}%  max: {{force_max_area_perc}}% <br/>
</div>

  </div>

</template>

<script>
import Vue from 'vue';
import { forceSimulation }  from 'd3-force';
import { forceManyBody }  from 'd3-force';
//import { forceCenter }  from 'd3-force';
import { forceCollide }  from 'd3-force';
import { forceRadial }  from 'd3-force';
import { VueHammer } from 'vue2-hammer'

Vue.use(VueHammer)

export default {
  name: 'About',

  //import * as d3 from "d3";

  data() {
    return {
      simulation: null,
      radius: 128,
      items: {},
      items_array: [],
      counter: 1,
      force_max_area_perc: 75,
      force_used_area_perc: 0,
    }
  },

  created () {

  },

  mounted () {
    this.video  = this.$refs.videosrc
    let self = this;
    console.log('mounted')
    this.simulation = forceSimulation(this.items)
      .force('charge', forceManyBody().strength(20))
      //.force('center', forceCenter(this.getWindowWidth() / 2, this.getWindowHeight() / 2))
      .force('collision', forceCollide().radius(this.radius+ 5))
      .force('r', forceRadial().strength(0)
        .radius( (Math.min(this.getWindowWidth(), this.getWindowHeight()) / 2))
        .x(this.getWindowWidth()/ 2 - this.radius)
        .y(this.getWindowHeight()/ 2 - this.radius)
      )
      .on('tick', self.ticked);
      let timer = function() {
        let a = self.counter++
        let new_item = {
          x: self.getWindowWidth() / 2 - self.radius,
          y: self.getWindowHeight() / 2 - self.radius,
          //x: 0,
          //y: 0,
          id: a
        }
        self.$set(self.items, a, new_item )
        self.items_array.push(self.items[a])

        self.force_used_area_perc = Math.round(
          (self.radius * self.radius * Math.PI * self.items_array.length) / // kugel area
          (self.getWindowWidth() * self.getWindowHeight()) // window already
             *  100 // percentage
        )

        while (self.force_used_area_perc > self.force_max_area_perc) {
          self.radius--;
          self.force_used_area_perc = Math.round(
              (self.radius * self.radius * Math.PI * self.items_array.length) / // kugel area
              (self.getWindowWidth() * self.getWindowHeight()) // window already
               *  100 // percentage
          , 2)
        }

        self.simulation = self.simulation
          .force('collision', forceCollide().radius(self.radius+ 5))
          .force('r', forceRadial()
            .radius( (Math.min(self.getWindowWidth(), self.getWindowHeight()) / 2))
            .x(self.getWindowWidth()/ 2 - self.radius)
            .y(self.getWindowHeight()/ 2 - self.radius)
          )
          .on('tick', self.ticked);

        self.simulation.nodes(self.items_array)
        self.simulation.alpha(1).restart();
        setTimeout( timer , 2000)
      }
      setTimeout( timer , 2000)
  },

  destroyed () {
  },

  methods: {
    ticked() {
      this.items_array.forEach( (i) => {
        this.items[i.id].x = Math.max(0, i.x);
        this.items[i.id].x = Math.min(this.getWindowWidth() - this.radius * 6/4, i.x );
        this.items[i.id].y = Math.max(- this.radius / 2, i.y);
        this.items[i.id].y = Math.min(this.getWindowHeight() - this.radius * 6/4, i.y);
      })
    },

    getWindowWidth() {
      return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    },

    getWindowHeight() {
      return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    },

    drag( cmd, who, event) {
      let x = event.center.x
      let y = event.center.y
      // event.clientX / Y

      if (cmd === "start")

        this.dragging = {
          who: who,
          last_x: x,
          last_y: y
        }
      else if (cmd === "stop") {
        this.dragging = null
        this.simulation.alpha(1).restart();
      }
      else if (this.dragging != null) {
        let diff_x = this.dragging.last_x - x
        let diff_y = this.dragging.last_y - y
        this.dragging.who.x -= diff_x;
        this.dragging.who.y -= diff_y;
        this.dragging.last_x = x
        this.dragging.last_y = y
      }
    },

  }
}
</script>

<style scoped>
.stats {position: absolute; left:50%; bottom:0px; transform: translate(-50%,0); width:100px; background:black; color: white; padding: 2px 10px; text-align:center }
video, canvas { height: 256px;width: 256px; background:black;  object-fit: cover;
  border-radius: 50%;z-index:3001}
video { width: 256px}
canvas {
  object-fit: cover;
  border-radius: 50%;
}
</style>
