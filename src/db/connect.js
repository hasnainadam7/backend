import mongoose from "mongoose";
// import { app } from "../app.js";

import { app, ioClient, httpServer } from "../app.js";
import { initializeSocketIO } from "../socket/socket.js";

// Initialize socket
initializeSocketIO(ioClient);

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.DB_URI}/${process.env.DB_NAME}`, {
      // serverSelectionTimeoutMS: 5000, // 5 sec timeout
    });

    app.on("error", (err) => {
      console.log(err);
      process.exit(1);
    });

    // app.listen(process.env.DB_PORT, () => {
    //   console.log(`Server is running on port ${process.env.DB_PORT}`);
    // });
    //output Server is running on port 3000
    httpServer.listen(process.env.DB_PORT, () => {
      console.log(`Server is running on port ${process.env.DB_PORT}`);
    });
    //output null
  } catch (error) {
    console.log("Error occured due to ", error);
    connectDB();
  }
};

export default connectDB;
