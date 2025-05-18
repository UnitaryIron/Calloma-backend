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

// Store room information
const rooms = {}; // Format: { roomId: { users: [userId1, userId2], password: string } }
const users = {}; // Format: { userId: { socketId: string, roomId: string } }

// Middleware
app.use(express.json());

// Create a new room
app.post('/create-room', (req, res) => {
  const roomId = generateRoomId();
  const { password } = req.body;
  
  rooms[roomId] = {
    users: [],
    password: password || null
  };
  
  res.json({ roomId });
});

// Join room endpoint
app.post('/join-room', (req, res) => {
  const { roomId, password } = req.body;
  
  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  if (rooms[roomId].password && rooms[roomId].password !== password) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  
  res.json({ success: true });
});

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // Join room handler
  socket.on("join-room", (roomId, userId, callback) => {
    try {
      // Validate input
      if (!roomId || !userId) {
        throw new Error('Room ID and User ID are required');
      }

      // Check if room exists
      if (!rooms[roomId]) {
        throw new Error('Room does not exist');
      }

      // Check if user already exists in any room
      if (users[userId]) {
        throw new Error('User ID already in use');
      }

      // Add user to room
      socket.join(roomId);
      rooms[roomId].users.push(userId);
      users[userId] = {
        socketId: socket.id,
        roomId: roomId
      };
      socket.userId = userId;
      socket.roomId = roomId;

      // Notify others in the room
      socket.to(roomId).emit("user-connected", userId);

      // Send list of existing users to the new user
      const otherUsers = rooms[roomId].users.filter(id => id !== userId);
      callback({
        success: true,
        users: otherUsers
      });

      console.log(`User ${userId} joined room ${roomId}`);
    } catch (error) {
      console.error('Join room error:', error.message);
      callback({
        success: false,
        error: error.message
      });
    }
  });

  // Relay WebRTC signaling
  socket.on("signal", (targetUserId, signal) => {
    const targetUser = users[targetUserId];
    if (targetUser) {
      io.to(targetUser.socketId).emit("signal", socket.userId, signal);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const userId = socket.userId;
    const roomId = socket.roomId;
    
    if (userId && roomId) {
      // Remove user from room
      if (rooms[roomId]) {
        rooms[roomId].users = rooms[roomId].users.filter(id => id !== userId);
      }
      
      // Remove user from global list
      delete users[userId];
      
      // Notify room
      socket.to(roomId).emit("user-disconnected", userId);
      
      console.log(`User ${userId} disconnected from room ${roomId}`);
    }
  });
});

// Helper function to generate room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Start server
http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
