import dotenv from "dotenv";
import connectDB from "./db/connect.js";


dotenv.config();

connectDB()
  .then(() => {
    console.log("Backend connected to database succussfully");
  })
  .catch((error) => {
    console.log("\nError occured :\n", error);
    process.exit(1);
  });


