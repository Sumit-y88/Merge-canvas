import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
    try {
        // 1. Determine connection string
        const dbUri = process.env.MONGODB_URI;

        if (!dbUri) {
            throw new Error("MongoDB connection string is missing in .env file.");
        }

        // 2. Return early if already connected (prevents duplicate connections)
        if (mongoose.connection.readyState >= 1) {
            return;
        }

        // 3. Connect and log host details
        const conn = await mongoose.connect(dbUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`MongoDB Connection Error: ${err.message}`);
        throw err;
    }
};

export default connectDB;
