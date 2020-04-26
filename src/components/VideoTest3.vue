<template>
  <div id="test">

    <div class="">
      <video ref="videosrc"></video>
      <canvas ref="canvas"></canvas>
      <canvas ref="face"></canvas>
    </div>


    <a href="https://github.com/riversun/facedetector">FaceDetector</a>

    <div class="stats"> {{ fps }} FPS </div>
  </div>
</template>

<script>
import FaceDetector from 'facedetector';

export default {
  name: 'About',

  data() {
    return {
      facedetector: null,
      fps: 0,
      framecount: 0,
      elapsed_time: null,
      detectedFaces: null
    }
  },

  created () {

  },

  mounted () {
    let self = this
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
      this.faceDetector = new FaceDetector(
        {
            video: this.video,
            flipLeftRight: false,
            flipUpsideDown: false
        }
      );
      this.faceDetector.setOnFaceAddedCallback(function (addedFaces, detectedFaces) {
      for (var i = 0; i < addedFaces.length; i++) {
          console.log("[facedetector] New face detected id=" + addedFaces[i].faceId + " index=" + addedFaces[i].faceIndex);
          console.log(detectedFaces);
        }
      });

      this.faceDetector.setOnFaceLostCallback(function (lostFaces, detectedFaces) {
          for (var i = 0; i < lostFaces.length; i++) {
              console.log("[facedetector] Face removed id=" + lostFaces[i].faceId + " index=" + lostFaces[i].faceIndex);
              console.log(detectedFaces);
          }
      });

      this.faceDetector.setOnFaceUpdatedCallback(function (detectedFaces) {
        self.renderFaces(detectedFaces)
        /*  for (var i = 0; i < detectedFaces.length; i++) {
              var face = detectedFaces[i];
              console.log(face.faceId+" x="+face.x+" y="+face.y+" w="+ face.width+" h="+face.height );
          }
        */
      });
      this.faceDetector.startDetecting();
      //this.renderface()
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

    renderFaces(faces) {

      var bounds = []

      if (this.framecount % 5 == 0)
        this.elapsed_time = (new Date()).getTime();

      this.framecount += 1;

      this.ctx.drawImage( this.video,
            0, 0, this.video.videoWidth, this.video.videoHeight,
            0, 0, this.canvas.width, this.canvas.height);

      if (faces.length > 0) {
        faces.forEach(face => {

          bounds = [
              face.x * this.video.width,
              face.y * this.video.height,
              face.width * this.video.width,
              face.height * this.video.height
          ]

          let width = Math.max(bounds[2],bounds[3]) * 1.2
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

        });



      }

      this.ctxf.drawImage(this.video,
        bounds[0], bounds[1], bounds[2], bounds[3],
          0, 0, this.face_canvas.width, this.face_canvas.height);

      if (this.framecount % 5 == 0)
        this.fps = (5 * (1000 /  ((new Date()).getTime() - this.elapsed_time))).toFixed(2)

    },

    renderFrame() {

      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
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
