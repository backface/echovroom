<template>
  <div id="test">

    <div class="">
      <video ref="videosrc"></video>
      <canvas ref="canvas"></canvas>
      <canvas ref="face"></canvas>
    </div>
    <div class="">
      <div v-for="(key,value) in expression" :key="key">
        {{ key| perc }} {{ value }}
      </div>
    </div>

    <a href="https://github.com/justadudewhohacks/face-api.js">face-api.js / tinyFace</a>

    <div class="stats"> {{ fps }} FPS </div>
  </div>
</template>

<script>
import * as faceapi from 'face-api.js';

//const minConfidenceFace = 0.5;
//const faceapiOptions = new faceapi.SsdMobilenetv1Options({ minConfidenceFace });
//const inputSize = 512
//const scoreThreshold = 0.5
//const faceapiOptions =faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })

export default {
  name: 'About',

  filters: {
    perc (value) {
      return (value * 100).toFixed(2) + "% "
    }
  },

  data() {
    return {
      state:  {
        backend: 'wasm',
        maxFaces: 2,
      },
      fps: 0,
      framecount: 0,
      elapsed_time: null,
      expression: null
    }
  },

  created () {

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
      console.log(faceapi.nets)

      //const faceapiOptions = new faceapi.SsdMobilenetv1Options({ minConfidenceFace });
      //let detectionNet = faceapi.nets.ssdMobilenetv1;
      //await faceapi.nets.faceRecognitionNet.loadFromUri('/models')

      await this.setupCamera();
      console.log("loading models");
      //await faceapi.nets.ssdMobilenetv1.load('/models')
      await faceapi.nets.tinyFaceDetector.load('/models')
      await faceapi.loadFaceLandmarkModel('/models')
      await faceapi.loadFaceExpressionModel('/models')
      console.log("models loaded");

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
      var faces;
      var withFeatures = true;

      if (this.framecount % 5 == 0)
        this.elapsed_time = (new Date()).getTime();

      this.framecount += 1;

      if (withFeatures)
        faces = await faceapi.detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 } ))
        .withFaceLandmarks()
        .withFaceExpressions()
      else {
        faces = await faceapi.detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5  }))
        //faces = await faceapi.detectSingleFace(this.video)

      }
      //const faces = await faceapi.detectAllFaces(this.video, new faceapi.SsdMobilenetv1Options())
      // const faces = await faceapi.detectSingleFace(this.video)
      //const faces = await faceapi.detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions())
        // compute face landmarks to align faces for better accuracy
      //.withFaceLandmarks()
      //.withFaceExpressions()

      //console.log(faces);
      this.ctx.drawImage( this.video,
        0, 0, this.video.videoWidth, this.video.videoHeight,
        0, 0, this.canvas.width, this.canvas.height);

      if (faces.length > 0) {
        faces.forEach(face => {

          if (withFeatures)
            bounds = [
                face.detection.box._x,
                face.detection.box._y,
                face.detection.box._width,
                face.detection.box._height
            ]
          else {
            bounds = [
                face.box._x,
                face.box._y,
                face.box._width,
                face.box._height
            ]
          }

          let width = Math.max(bounds[2],bounds[3])
          let center = [ bounds[0] + bounds[2]/2, bounds[1] + bounds[3]/2 ]
          bounds = [
            center[0] - width / 2,
            center[1] - width / 2,
            width,
            width
          ]

          this.ctx.beginPath();
          this.ctx.lineWidth = "3";
          this.ctx.strokeStyle = "red";
          this.ctx.rect(bounds[0], bounds[1], bounds[2], bounds[3])
          this.ctx.stroke();

          if (withFeatures) {
            const keypoints = face.landmarks._positions;

            for (let i = 0; i < keypoints.length; i++) {
              const x = keypoints[i]._x;
              const y = keypoints[i]._y;

              this.ctx.beginPath();
              this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
              this.ctx.fill();
            }
            this.expression = face.expressions
          }

        });

        this.ctxf.drawImage(this.video,
          bounds[0], bounds[1], bounds[2], bounds[3],
          0, 0, this.face_canvas.width, this.face_canvas.height);

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
canvas {
  object-fit: cover;
  border-radius: 50%;
}
</style>
