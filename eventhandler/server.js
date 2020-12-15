const app = require("./app");
const http = require("http");

server= http.createServer(app)

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  }
});
require('./socket')(io);

server.listen(process.env.PORT || 3000);

