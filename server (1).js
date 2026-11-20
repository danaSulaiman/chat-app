
import http from "node:http";
import fs from "node:fs";
import { WebSocketServer, WebSocket } from "ws";

const PORT = 3001;

// Create HTTP server
const server = http.createServer((req, res) => {
  fs.readFile("./public/index.html", (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end("Internal Server Error");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/html"
    });

    res.end(data);
  });
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Broadcast messages to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Handle connections
wss.on("connection", (socket, req) => {
  const username = new URL(
    req.url,
    "http://localhost"
  ).searchParams.get("username");

  // User joined
  broadcast({
    type: "system",
    text: `${username} joined`
  });

  // Receive chat messages
  socket.on("message", (data) => {
    try {
      const { username, text } = JSON.parse(data.toString());

      broadcast({
        type: "chat",
        username,
        text
      });
    } catch (error) {
      console.error("Invalid message:", error);
    }
  });

  // User left
  socket.on("close", () => {
    broadcast({
      type: "system",
      text: `${username} left`
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log(
    "Chat server running at http://localhost:3001"
  );
});
