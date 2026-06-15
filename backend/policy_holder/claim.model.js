import mongoose from "mongoose";

const claimSchema = new mongoose.Schema({
  claimNumber: { type: String, required: true, unique: true },
  userNic: { type: String, required: true },
  vehiclePlate: { type: String, required: true },
  incidentDate: { type: String, required: true },
  incidentTime: { type: String, required: true },
  damageType: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  accidentPhotos: {
    front: { type: [String], default: [] },
    rear: { type: [String], default: [] },
    side: { type: [String], default: [] }
  },
  drivingLicense: {
    front: { type: [String], default: [] },
    rear: { type: [String], default: [] }
  },
  status: { type: String, default: "In Progress" },
  createdAt: { type: Date, default: Date.now }
});

const Claim = mongoose.model("Claim", claimSchema);
export default Claim;
