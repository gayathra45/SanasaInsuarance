import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Claim from "../policy_holder/claim.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const seedClaims = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not defined in backend/.env");
    }

    console.log("Connecting to MongoDB for claims seeding...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");

    // Delete all previously seeded/test claims from the database
    const result = await Claim.deleteMany({ assignedAgent: "oshitha@gmail.com" });
    console.log(`✅ Deleted ${result.deletedCount} seeded claims from MongoDB.`);

  } catch (error) {
    console.error("❌ Claims seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

seedClaims();
