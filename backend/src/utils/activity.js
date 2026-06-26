import AgentActivity from "../models/agent_activity.model.js";

export async function logAgentActivity(agentEmail, action, device, details = "") {
  try {
    if (!agentEmail) return;
    await AgentActivity.create({
      agentEmail: agentEmail.trim().toLowerCase(),
      action,
      device,
      details
    });
    console.log(`[ACTIVITY LOGGED] ${agentEmail} - ${action} via ${device}`);
  } catch (err) {
    console.error("Failed to log agent activity:", err);
  }
}
