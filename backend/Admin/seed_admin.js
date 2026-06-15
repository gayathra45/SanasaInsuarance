import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import crypto from "crypto";
import Admin from "./admin.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not defined in backend/.env");
    }

    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");

    const adminEmail = "admin@gmail.com";
    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`ℹ️ Admin user with email ${adminEmail} already exists. Skipping seed.`);
    } else {
      console.log(`🌱 Seeding default admin user: ${adminEmail}`);
      const hashedPassword = hashPassword("admin123");
      
      const newAdmin = new Admin({
        name: "Gayathra Samuditha",
        mobile: "0702725683",
        email: adminEmail,
        nic: "200015901825",
        password: hashedPassword
      });

      await newAdmin.save();
      console.log("✅ Default Admin user successfully seeded! (Password: admin123)");
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

seedAdmin();
