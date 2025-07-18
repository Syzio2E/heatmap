const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const PORT = 3001;
const NUM_OBJECTS = 100;
const MAP_WIDTH = 1900;
const MAP_HEIGHT = 1050;

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Real-time Object Server is Running");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initial object state
let objects = Array.from({ length: NUM_OBJECTS }, (_, id) => ({
  id,
  x: Math.random() * (MAP_WIDTH - 20.0),
  y: Math.random() * (MAP_HEIGHT - 20.0),
}));

// Broadcast updated positions at 15Hz
setInterval(() => {
  objects = objects.map(obj => {
    const dx = (Math.random() - 0.5) * 100; // increase to 100 for wider scatter
    const dy = (Math.random() - 0.5) * 100;

    return {
      ...obj,
      x: Math.max(0, Math.min(MAP_WIDTH, obj.x + dx)),
      y: Math.max(0, Math.min(MAP_HEIGHT, obj.y + dy))
    };
  });

  io.emit("positionUpdate", objects);
}, 1000 / 15); // 15Hz


io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  socket.emit("positionUpdate", objects);

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
});
