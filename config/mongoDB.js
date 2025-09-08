import mongoose from "mongoose";
import 'dotenv/config';

const mongoUrl = process.env.DB_URL;

mongoose.connect(mongoUrl); // options not needed in latest versions

const db = mongoose.connection;

db.on("connected", () => console.log("MongoDB connected successfully"));
db.on("error", (err) => console.error("MongoDB connection error:", err));
db.on("disconnected", () => console.log("MongoDB disconnected"));

export default mongoose;
