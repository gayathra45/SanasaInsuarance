import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../Signup/user.model.js";
import Claim from "../policy_holder/claim.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function getNearestBranchForUser(city = "", province = "") {
  const cleanCity = city.trim().toLowerCase();
  if (cleanCity.includes("galle") || cleanCity.includes("hambantota")) {
    return "Galle";
  }
  if (cleanCity.includes("matara")) {
    return "Matara";
  }
  if (cleanCity.includes("colombo") || cleanCity.includes("gampaha") || cleanCity.includes("kalutara")) {
    return "Colombo";
  }
  if (cleanCity.includes("anuradhapura") || cleanCity.includes("polonnaruwa")) {
    return "Anuradhapura";
  }
  if (cleanCity.includes("embilipitiya") || cleanCity.includes("ratnapura")) {
    return "Embilipitiya";
  }
  return "Galle";
}

function getNearestBranchForClaim(location = "") {
  const cleanLocation = location.trim().toLowerCase();
  if (cleanLocation.includes("galle") || cleanLocation.includes("hambantota")) {
    return "Galle";
  }
  if (cleanLocation.includes("matara")) {
    return "Matara";
  }
  if (cleanLocation.includes("colombo") || cleanLocation.includes("gampaha") || cleanLocation.includes("kalutara")) {
    return "Colombo";
  }
  if (cleanLocation.includes("anuradhapura") || cleanLocation.includes("polonnaruwa")) {
    return "Anuradhapura";
  }
  if (cleanLocation.includes("embilipitiya") || cleanLocation.includes("ratnapura")) {
    return "Embilipitiya";
  }
  return "Galle";
}

const recalculateBranches = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in backend/.env");
    }

    console.log("Connecting to MongoDB for branch recalculation...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // 1. Recalculate and update Users
    const users = await User.find({});
    console.log(`Processing ${users.length} users...`);
    for (const u of users) {
      const calculatedBranch = getNearestBranchForUser(u.city, u.province);
      u.branch = calculatedBranch;
      await u.save();
      console.log(`User ${u.firstName} ${u.lastName} (City: ${u.city}) -> Branch: ${u.branch}`);
    }

    // 2. Recalculate and update Claims
    const claims = await Claim.find({});
    console.log(`\nProcessing ${claims.length} claims...`);
    for (const c of claims) {
      const calculatedBranch = getNearestBranchForClaim(c.location);
      c.branch = calculatedBranch;
      await c.save();
      console.log(`Claim ${c.claimNumber} (Location: ${c.location}) -> Branch: ${c.branch}`);
    }

    console.log("\n✅ Recalculation and database update complete!");

  } catch (error) {
    console.error("❌ Failed to recalculate branches:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

recalculateBranches();
