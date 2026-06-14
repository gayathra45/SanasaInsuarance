import "dotenv/config";
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import mongoose from "mongoose";
import path from "path";
import cors from "cors";
import signupRouter from "./Signup/signup.js";

const app = express();
const __dirname = path.resolve();

app.use(cors());
app.use(express.json());
app.use("/api/signup", signupRouter);



/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT;

const startServer = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server error:", error.message);
    process.exit(1);
  }
};

startServer();
