import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import crypto from "crypto";
import User from "../Signup/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const updatePasswords = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    const hashed = hashPassword("user123");
    
    const res = await User.updateMany({}, { password: hashed });
    console.log(`✅ Successfully updated passwords for ${res.modifiedCount} users to 'user123'`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

updatePasswords();
