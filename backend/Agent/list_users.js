import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model("User", userSchema, "users");

await mongoose.connect(process.env.MONGO_URI);
const users = await User.find({}, { nic: 1, firstName: 1, lastName: 1, _id: 0 }).limit(20);
console.log("=== Registered Policy Holders ===");
users.forEach(u => console.log(`NIC: ${u.nic}  Name: ${u.firstName} ${u.lastName}`));
await mongoose.disconnect();
