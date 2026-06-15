import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Claim from "../policy_holder/claim.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const updateAllToPending = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not defined in backend/.env");
    }

    console.log("Connecting to MongoDB to reset all claims to Pending...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");

    const result = await Claim.updateMany({}, { status: "Pending" });
    console.log(`✅ Successfully updated ${result.modifiedCount} claims to status: "Pending"`);

  } catch (error) {
    console.error("❌ Failed to update claims:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

updateAllToPending();
