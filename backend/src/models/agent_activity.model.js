import mongoose from "mongoose";

const agentActivitySchema = new mongoose.Schema({
  agentEmail: { type: String, required: true, index: true },
  action: { type: String, required: true }, // "Login", "Switch Status", "Document Uploaded", "Claim Accepted", "Inspection Report Submitted" etc.
  device: { type: String, required: true }, // "Web" or "Mobile App"
  details: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

const AgentActivity = mongoose.model("AgentActivity", agentActivitySchema);
export default AgentActivity;
