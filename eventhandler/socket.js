const socket = io => {
  io.on("connection", socket => {
    //console.log('New Connection');

    socket.on("join", function(data) {
      //console.log(data, "joined");
      this.broadcast.emit("joined", data);
    });

    socket.on("message", function(data) {
      //console.log("got message:", data);
      io.emit("message", data);
    });

    socket.on("disconnect", function(data) {
      //console.log(data, "left");
      this.broadcast.emit("left", data);
      });
    });
}

module.exports = socket;
