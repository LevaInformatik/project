const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
}

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

function RenderRoom(res, roomId, role = "participant") {
  res.render("room", { roomId: roomId, role: role });
}

app.get("/", (req, res) => {
  RenderRoom(res, uuidv4(), "admin")
});

app.get("/:room", (req, res) => {
  RenderRoom(res, req.params.room)
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    setTimeout(()=>{
      socket.to(roomId).broadcast.emit("user-connected", userId);
    }, 1000)
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
    socket.on('createSurvey', (questionData) => {
      io.to(roomId).emit('receiveSurvey', questionData);
    });
  });
});

server.listen(process.env.PORT || 3030);
