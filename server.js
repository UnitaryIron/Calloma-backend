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
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

const users = {}; // Stores userId -> socket.id mapping

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle join event
  socket.on("join", (userId) => {
    if (!userId) {
      console.log("Join attempt with no userId");
      return;
    }

    // Check if the userId is already taken
    if (users[userId]) {
      console.log(`User ID '${userId}' is already taken`);
      socket.emit("user-id-taken");
      return;
    }

    // Register user
    users[userId] = socket.id;
    socket.userId = userId; // Store userId in socket session

    console.log(`User joined: ${userId} with socket ${socket.id}`);

    // Notify the new user of all current users
    socket.emit("user-list", Object.keys(users));

    // Notify everyone else that a new user has joined
    socket.broadcast.emit("new-user-joined", userId);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    const userId = socket.userId;
    if (userId && users[userId]) {
      delete users[userId];
      console.log(`User disconnected: ${userId}`);
      socket.broadcast.emit("user-left", userId);
    } else {
      console.log(`Socket disconnected without userId: ${socket.id}`);
    }
  });
});

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


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
