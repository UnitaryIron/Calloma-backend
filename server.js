const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });

  // Relay WebRTC signals
  socket.on("signal", (toId, signal) => {
    io.to(toId).emit("signal", socket.id, signal);
  });

  // Chat messages
  socket.on("chat-message", (roomId, msg) => {
    socket.to(roomId).emit("chat-message", msg);
  });
});

http.listen(3002, () => console.log("Server running on http://localhost:3002"));