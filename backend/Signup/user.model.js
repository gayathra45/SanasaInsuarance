import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  nic: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  dob: { type: String, required: true },
  address: { type: String, required: true },
  province: { type: String, required: true },
  city: { type: String, required: true },
  password: { type: String, required: true },
  vehicles: [
    {
      numberPlate: { type: String, required: true },
      vehicleType: { type: String, required: true },
      year: { type: String, required: true },
      company: { type: String, required: true },
      model: { type: String, required: true },
      engineNumber: { type: String, required: true },
      chassisNumber: { type: String, required: true },
      policyNumber: { type: String, required: true }
    }
  ],
  documents: {
    nicFront: { type: String },
    nicBack: { type: String },
    vehicleReg: { type: String },
    revenueLicense: { type: String }
  },
  referenceNumber: { type: String, required: true, unique: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
export default User;
