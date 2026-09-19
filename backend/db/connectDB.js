import mongoose from "mongoose";

export const connectDB = async ()=>{
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("Error connection to MongoDB: ", error.messge);
    process.exit(1); // 1 is for failure, 0 status code is success    
  }
}