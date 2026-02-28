import mongoose from "mongoose";
import ENV from "./env.js";

const connectDB = async () => {
    try {
        await mongoose.connect(ENV.MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

export default connectDB;