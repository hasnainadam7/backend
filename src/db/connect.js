import mongoose from "mongoose";
import {app} from "../app.js";


const connectDB = async () => {
  try {
    await mongoose.connect(
      `${process.env.DB_URI}/${process.env.DB_NAME}`
    );

    app.on("error", (err) => {
      console.log(err);
      process.exit(1);
    });
 
    app.listen(process.env.DB_PORT
         ,() => {
        console.log(`\nServer is running on port ${process.env.DB_PORT}`);
      }
    
    );

  } catch (error) {
    console.log("Error occured due to ", error);
    process.exit(1);
  }
};

export default connectDB;
