import mongoose from "mongoose";

const officeStaffSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Galle Branch"
  email: { type: String, required: true, unique: true }, // e.g., "galle@gmail.com"
  mobile: { type: String, required: true }, // Phone number, e.g., "0768088176"
  branch: { type: String, required: true }, // Branch Name, e.g., "Galle"
  province: { type: String, required: true }, // Province, e.g., "Southern"
  location: { type: String, required: true }, // Location, e.g., "Old Foods Market , Galle"
  staffCount: { type: Number, required: true }, // Staff Count, e.g., 10
  password: { type: String, required: true },
  resetOtp: { type: String },
  resetOtpExpires: { type: Date },
  resetOtpRequestedAt: { type: Date },
  resetSessionToken: { type: String },
  resetSessionExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const OfficeStaff = mongoose.model("OfficeStaff", officeStaffSchema);
export default OfficeStaff;
