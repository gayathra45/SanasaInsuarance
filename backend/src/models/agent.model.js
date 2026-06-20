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
  phone: { type: String, default: "" },
  city: { type: String, default: "" },
  province: { type: String, default: "" },
  bankName: { type: String, default: "" },
  bankBranch: { type: String, default: "" },
  accountNumber: { type: String, default: "" },
  accountType: { type: String, default: "" },
  accountHolderName: { type: String, default: "" },
  nicFront: { type: String, default: "" },
  nicBack: { type: String, default: "" },
  birthCertificate: { type: String, default: "" },
  policeReport: { type: String, default: "" },
  resetOtp: { type: String },
  resetOtpExpires: { type: Date },
  resetOtpRequestedAt: { type: Date },
  resetSessionToken: { type: String },
  resetSessionExpires: { type: Date },
  status: { type: String, default: "inactive" },
  activationToken: { type: String },
  activationExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;
