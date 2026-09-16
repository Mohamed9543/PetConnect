require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const registerChatSocket = require("./sockets/chatSocket");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET is missing or too short (needs 32+ characters). Refusing to start.");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || "*" },
});

app.set("io", io);
registerChatSocket(io);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`PetConnect API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  });
