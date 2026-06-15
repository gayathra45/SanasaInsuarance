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
  status: { type: String, default: "Pending" },
  branch: { type: String, default: "Galle" },
  assignedAgent: { type: String, default: "" },
  amount: { type: Number, default: null },
  currentStep: { type: Number, default: 1 },
  documentsRequested: { type: Boolean, default: false },
  requestedDocuments: { type: [String], default: [] },
  messages: [
    {
      sender: { type: String, default: "Office Staff" },
      message: { type: String, required: true },
      sentAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const Claim = mongoose.model("Claim", claimSchema);
export default Claim;
