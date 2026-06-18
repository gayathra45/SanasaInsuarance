import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nic: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetOtp: { type: String },
  resetOtpExpires: { type: Date },
  resetOtpRequestedAt: { type: Date },
  resetSessionToken: { type: String },
  resetSessionExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
