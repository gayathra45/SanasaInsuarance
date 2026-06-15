import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../Signup/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const dump = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    const users = await User.find({});
    console.log("--- USERS ---");
    users.forEach(u => {
      console.log(`Name: ${u.firstName} ${u.lastName}, NIC: ${u.nic}, Email: ${u.email}, Mobile: ${u.mobile}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

dump();
