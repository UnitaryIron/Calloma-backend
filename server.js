// Add this near the top of your server.js
const meetingPasswords = {}; // Store passwords in memory (for production, use a database)

// Modify your 'join-room' event handler
io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId, password, callback) => {
    if (meetingPasswords[roomId] && meetingPasswords[roomId] !== password) {
      callback({ success: false, error: 'Incorrect password' });
      return;
    }
    
    socket.join(roomId);
    callback({ success: true });
    socket.to(roomId).emit('user-connected', userId);
  });

  // ... rest of your existing socket code
});

// Add endpoint to create protected rooms
app.post('/create-room', (req, res) => {
  const roomId = generateRoomId(); // Your existing room ID generation
  const password = req.body.password;
  
  if (password) {
    meetingPasswords[roomId] = password;
  }
  
  res.json({ roomId });
});
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

app.post('/verify-recaptcha', async (req, res) => {
  const { token } = req.body;
  const secret = "6LdjuzwrAAAAAKEzOIT9wWNMFTMYypBk_S5pSGmn";
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
    { method: "POST" }
  );
  const data = await response.json();
  res.send({ success: data.success });
});
