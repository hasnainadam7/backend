import { createServer } from "http";
import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import userRouter from "./routes/user_routes.js";
import { Server as SocketServer } from "socket.io";
import chatRouter from "./routes/chat_routes.js";

const app = express();
const httpServer = createServer(app);

app.use(
  cors({
    // origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://10.0.2.2:3000"],
    origin:"*",
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "16kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "2.5mb" }));
app.use(cookieParser());
app.use(express.static("public"));

app.get("/test", (req, res) => {
  res.send("API is working!");
});

const ioClient = new SocketServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("ioClient", ioClient);

app.get("/", (req, res) => {
  return res.status(200).json({ success: true, greeting: "Hello / from API" });
});

const apiVersion = process.env.API_VERSION;
console.log(apiVersion)
app.use(`${apiVersion}/user`, userRouter);
app.use(`${apiVersion}/chats`, chatRouter);

export { app, ioClient, httpServer };