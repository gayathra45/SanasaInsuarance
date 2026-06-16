import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import crypto from "crypto";
import Agent from "./agent.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const seedAgent = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not defined in backend/.env");
    }

    console.log("Connecting to MongoDB for agent seeding...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");

    // Clear existing agents to start fresh
    await Agent.deleteMany({});
    console.log("Cleared old agent entries.");

    // Generate AGT-XXXX format Agent ID
    const nextAgentId = "AGT-0001";

    const agentData = {
      agentId: nextAgentId,
      name: "Oshitha Imarshana",
      email: "oshitha@gmail.com",
      password: hashPassword("oshitha123"),
      nic: "200015901825",
      address: "Meepawala, Poddala",
      dob: "2000-01-02",
      branch: "Galle"
    };

    console.log("🌱 Seeding Oshitha Imarshana Agent details...");
    const newAgent = new Agent(agentData);
    await newAgent.save();

    console.log("✅ Successfully seeded Oshitha Imarshana!");
    console.log(`Agent ID: ${nextAgentId}`);
    console.log(`Email: oshitha@gmail.com`);

  } catch (error) {
    console.error("❌ Agent seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

seedAgent();
