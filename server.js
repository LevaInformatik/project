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
    socket.on("startSurvey", (surveyData, callback) => {
      // Обработка surveyData на сервере
      console.log("Survey data received on the server:");
      callback('sent');

      // Добавляем флажок
      console.log("Отправил surveyData клиенту");
      
      // Отправляем surveyData всем остальным участникам беседы
      socket.broadcast.json.send("receiveSurvey", surveyData);
    });
  });
});

server.listen(process.env.PORT || 3030);
