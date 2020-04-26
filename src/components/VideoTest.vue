<template>
  <div id="test">

    <div class="">
      <video ref="videosrc"></video>
      <canvas ref="canvas"></canvas>
      <canvas ref="face"></canvas>
    </div>

    <a href="https://github.com/tensorflow/tfjs-models/tree/master/facemesh">tensorflow-models facemesh</a>

    <div class="stats"> {{ fps }} FPS </div>
  </div>
</template>

<script>
import * as facemesh from '@tensorflow-models/facemesh';
import * as tf from '@tensorflow/tfjs-core';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import {version} from '@tensorflow/tfjs-backend-wasm/dist/version';

export default {
  name: 'About',

  data() {
    return {
      state:  {
        backend: 'wasm',
        maxFaces: 2,
      },
      fps: 0,
      framecount: 0,
      elapsed_time: null
    }
  },

  created () {
    tfjsWasm.setWasmPath(
    `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${
        version}/dist/tfjs-backend-wasm.wasm`);
  },

  mounted () {
    this.video  = this.$refs.videosrc
    console.log('mounted')
    this.setup().then( () => {
      this.video.play();
      this.canvas = this.$refs.canvas
      this.canvas.width  = this.video.videoWidth * window.devicePixelRatio;
      this.canvas.height = this.video.videoHeight * window.devicePixelRatio;
      this.video.width = this.video.videoWidth;
      this.video.height = this.video.videoHeight
      this.face_canvas = this.$refs.face
      this.face_canvas.width = 256;
      this.face_canvas.height = 256;
      this.ctx    = this.canvas.getContext('2d');
      this.ctxf  = this.face_canvas.getContext('2d');
      this.renderface()
    })

  },

  destroyed () {
  },

  methods: {

    async setup() {
      await tf.setBackend(this.state.backend);
      this.model = await facemesh.load({maxFaces: this.state.maxFaces});
      await this.setupCamera();
    },

    async setupCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({
        'audio': false,
        'video': {
          facingMode: 'user',
          // Only setting the video to a specified size in order to accommodate a
          // point cloud, so on mobile devices accept the default size.
          //width: this.isMobile ? undefined : 640,
          //height: this.isMobile ? undefined : 480
        },
      });
      this.video.srcObject = stream;

      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          resolve(this.video);
        };
      });
    },

    async renderface() {

      var bounds = []

      if (this.framecount % 5 == 0)
        this.elapsed_time = (new Date()).getTime();

      this.framecount += 1;

      let draw_ctx = true

      const faces = await this.model.estimateFaces(this.video);

      if (draw_ctx)
        this.ctx.drawImage( this.video,
            0, 0, this.video.videoWidth, this.video.videoHeight,
            0, 0, this.canvas.width, this.canvas.height);

      if (faces.length > 0) {
        faces.forEach(face => {
          //console.log(face);

          bounds = [
              face.boundingBox.topLeft[0][0],
              face.boundingBox.topLeft[0][1],
              face.boundingBox.bottomRight[0][0] - face.boundingBox.topLeft[0][0],
              face.boundingBox.bottomRight[0][1] - face.boundingBox.topLeft[0][1]
          ]

          let width = Math.max(bounds[2],bounds[3])
          let center = [ bounds[0] + bounds[2]/2, bounds[1] + bounds[3]/2 ]
          bounds = [
            center[0] - width / 2,
            center[1] - width / 2,
            width,
            width
          ]


          if (draw_ctx) {
            this.ctx.beginPath();
            this.ctx.lineWidth = "3";
            this.ctx.strokeStyle = "red";
            this.ctx.rect(bounds[0], bounds[1], bounds[2], bounds[3])
            this.ctx.stroke();
          }

          const keypoints = face.scaledMesh;

          for (let i = 0; i < keypoints.length; i++) {
            const x = keypoints[i][0];
            const y = keypoints[i][1];

            this.ctx.beginPath();
            this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
            this.ctx.fill();
          }

        });

        if (draw_ctx) {
          this.ctxf.drawImage(this.video,
            bounds[0], bounds[1], bounds[2], bounds[3],
            0, 0, this.face_canvas.width, this.face_canvas.height);
        }
      }

      if (this.framecount % 5 == 0)
        this.fps = (5 * (1000 /  ((new Date()).getTime() - this.elapsed_time))).toFixed(2)

      requestAnimationFrame(this.renderface);
    },

    renderAFrame() {
      var canvas = this.$refs.canvas;
      var ctx    = canvas.getContext('2d');
      var video  = this.$refs.videosrc
      console.log("render frame");

      //var elapsed_time = (new Date()).getTime();
      canvas.width  = video.clientWidth * window.devicePixelRatio;
      canvas.height = video.clientHeight * window.devicePixelRatio;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      //console.log("Process time : " + ((new Date()).getTime() - elapsed_time).toString() + "ms";);
      requestAnimationFrame(this.renderAFrame);
    },

    isMobile() {
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      return isAndroid || isiOS;
    }

  }
}
</script>

<style scoped>
.stats {position: absolute; left:50%; bottom:0px; transform: translate(-50%,0); width:100px; background:black; color: white; padding: 2px 10px; text-align:center }
video, canvas { height: 320px;width: 320px }
video { width: 320px}
canvas, video {
  object-fit: cover;
  border-radius: 50%;
}
</style>
