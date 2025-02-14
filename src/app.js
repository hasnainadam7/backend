
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
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "16kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "2.5mb" }));
app.use(cookieParser());
app.use(express.static("public"));

const ioClient = new SocketServer(httpServer, {
  pingTimeout: 60000,
  connectionStateRecovery: {},
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("ioClient", ioClient);

app.get("/", (req, res) => {
  return res.status(200).json({ success: true, greeting: "Hello / from API" });
});
app.set("ioClient", ioClient);

const apiVersion = process.env.API_VERSION;


app.use(`${apiVersion}/user`, userRouter);

app.use(`${apiVersion}/chat`, chatRouter);


export { app };
