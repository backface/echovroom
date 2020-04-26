<template>
  <div id="test">

    <div class="">
      <video ref="videosrc"></video>
      <canvas ref="canvas"></canvas>
      <canvas ref="face"></canvas>
    </div>


    <a href="https://github.com/auduno/clmtrackr">clmtrackr</a>

    <div class="stats"> {{ fps }} FPS </div>
  </div>
</template>

<script>
import clm from 'clmtrackr/build/clmtrackr';

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

  },

  mounted () {
    this.ctrack = new clm.tracker({
      faceDetection: {
        useWebWorkers: false,
      },
    });
    this.ctrack.init();
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
      this.ctrack.stop();
      this.ctrack.reset();
      this.ctrack.start(this.video);
      this.renderface();
    })

  },

  destroyed () {
  },

  methods: {

    async setup() {
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

    renderface() {

      var bounds = []

      if (this.framecount % 5 == 0)
        this.elapsed_time = (new Date()).getTime();

      this.framecount += 1;

      this.ctx.drawImage( this.video,
          0, 0, this.video.videoWidth, this.video.videoHeight,
          0, 0, this.canvas.width, this.canvas.height);

      var keypoints = this.ctrack.getCurrentPosition();

      if (keypoints.length > 1) {
        bounds[0] = keypoints[0][0]
        bounds[1] = keypoints[0][1]
        bounds[2] = keypoints[0][0]
        bounds[3] = keypoints[0][1]

        for (let i = 1; i < keypoints.length; i++) {
          bounds[0] = Math.min(bounds[0], keypoints[i][0])
          bounds[1] = Math.min(bounds[1], keypoints[i][1])
          bounds[2] = Math.max(bounds[2], keypoints[i][0])
          bounds[3] = Math.max(bounds[3], keypoints[i][1])
        }

        bounds[2] = bounds[2] - bounds[0]
        bounds[3] = bounds[3] - bounds[1]

        let width = Math.max(bounds[2],bounds[3]) * 1.3
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

        this.ctxf.drawImage(this.video,
          bounds[0], bounds[1], bounds[2], bounds[3],
          0, 0, this.face_canvas.width, this.face_canvas.height);
      }

      for (let i = 0; i < keypoints.length; i++) {
        const x = keypoints[i][0];
        const y = keypoints[i][1];

        this.ctx.beginPath();
        this.ctx.fillStyle = "black";
        this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
        this.ctx.fill();
      }

      //console.log(positions);
      // positions = [[x_0, y_0], [x_1,y_1], ... ]
      //this.ctrack.draw(this.canvas);

      //let cp = this.ctrack.getCurrentParameters();
      //console.log(cp);

      if (this.framecount % 5 == 0)
        this.fps = (5 * (1000 /  ((new Date()).getTime() - this.elapsed_time))).toFixed(2)

      requestAnimationFrame(this.renderface);
    },



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
