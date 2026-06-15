import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../Signup/user.model.js";
import Claim from "../policy_holder/claim.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const updateBranchFields = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not defined in backend/.env");
    }

    console.log("Connecting to MongoDB to update branch fields...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");

    // Update all users missing the branch field
    const userResult = await User.updateMany(
      { $or: [{ branch: { $exists: false } }, { branch: "" }] },
      { branch: "Galle" }
    );
    console.log(`✅ Successfully updated ${userResult.modifiedCount} users to branch: "Galle"`);

    // Update all claims missing the branch field
    const claimResult = await Claim.updateMany(
      { $or: [{ branch: { $exists: false } }, { branch: "" }] },
      { branch: "Galle" }
    );
    console.log(`✅ Successfully updated ${claimResult.modifiedCount} claims to branch: "Galle"`);

  } catch (error) {
    console.error("❌ Failed to update branch fields:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

updateBranchFields();
