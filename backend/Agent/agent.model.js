import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  agentId: { type: String, required: true, unique: true }, // Auto-generated e.g., AGT-0001
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nic: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  dob: { type: String, required: true },
  branch: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;
