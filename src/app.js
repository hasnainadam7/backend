// app.js
// import { createServer } from "http"; // Import createServer from http
// import { Server } from "socket.io";
import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import userRouter from "./routes/user_routes.js";

import chatRouter from "./routes/chat_routes.js";
const app = express();

// Create HTTP server
// const httpServer = createServer(app);

// Initialize Socket.IO server
// const io = new Server(httpServer, {
//   cors: {
//     origin: process.env.CORS_ORIGIN,
//     credentials: true,
//   },
// });

// // Socket.IO connection handling
// io.on("connection", (socket) => {
//   console.log("A user connected");

//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//   });

//   // Example: Handle custom events
//   socket.on("chat message", (msg) => {
//     console.log("Message received: ", msg);
//     io.emit("chat message", msg); // Broadcast the message to all clients
//   });
// });

// Middleware setup
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "16kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "2.5mb" }));
app.use(cookieParser());
app.use(express.static("public"));

const apiVersion = process.env.API_VERSION;
console.log(apiVersion)
// Routes
app.use(`${apiVersion}/user`, userRouter);


app.use(`${apiVersion}/chats`, chatRouter);


// Export both app and httpServer
export { app };