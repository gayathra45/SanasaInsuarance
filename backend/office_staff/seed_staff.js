import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import crypto from "crypto";
import OfficeStaff from "./office_staff.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const seedStaff = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not defined in backend/.env");
    }

    console.log("Connecting to MongoDB for office staff seeding...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");

    // Clear existing office staff entries
    await OfficeStaff.deleteMany({});
    console.log("🧹 Cleared old office staff entries.");

    const branchesData = [
      {
        name: "Galle Branch Office Staff",
        email: "galle@gmail.com",
        mobile: "0768088176",
        branch: "Galle",
        province: "Southern",
        location: "Old Foods Market , Galle",
        staffCount: 10,
        password: hashPassword("galle123")
      },
      {
        name: "Matara Branch Office Staff",
        email: "matara@gmail.com",
        mobile: "0768088177",
        branch: "Matara",
        province: "Southern",
        location: "Old Foods Market , Matara",
        staffCount: 8,
        password: hashPassword("matara123")
      },
      {
        name: "Colombo Branch Office Staff",
        email: "colombo@gmail.com",
        mobile: "0768088178",
        branch: "Colombo",
        province: "Western",
        location: "Old Foods Market , Colombo 7",
        staffCount: 15,
        password: hashPassword("colombo123")
      }
    ];

    console.log("🌱 Seeding Galle, Matara, and Colombo Branch logins...");
    await OfficeStaff.insertMany(branchesData);
    console.log("✅ Successfully seeded Matara and Colombo branch logins alongside Galle!");

  } catch (error) {
    console.error("❌ Office staff seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

seedStaff();
