import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  // Server se client ko welcome message
  socket.emit("message", {Message:"Welcome To chat"});

  // Jab client message bhejega
  socket.on("send_message", (data) => {
    console.log("Message from client: ", data["message"]);

    // Sab clients ko broadcast karega
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

server.listen(3002, () => {
  console.log("Server is running on port 3002");
});
