import dotenv from "dotenv";
dotenv.config({ override: true });
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import mongoose from "mongoose";
import path from "path";
import cors from "cors";
import signupRouter from "./Signup/signup.js";
import myClaimsRouter from "./policy_holder/my_claims/my_claims.routes.js";
import newClaimRouter from "./policy_holder/new_claim/new_claim.routes.js";
import adminRouter from "./Admin/admin.routes.js";
import officeStaffRouter from "./office_staff/office_staff.routes.js";
import agentRouter from "./Agent/agent.routes.js";

const app = express();
const __dirname = path.resolve();

app.use(cors());
// Increase payload size limit to support base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/api/signup", signupRouter);
app.use("/api/policy-holder", myClaimsRouter);
app.use("/api/policy-holder", newClaimRouter);
app.use("/api/admin", adminRouter);
app.use("/api/office-staff", officeStaffRouter);
app.use("/api/agent", agentRouter);



/*  SERVER START */

const PORT = process.env.PORT;

const startServer = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server error:", error.message);
    process.exit(1);
  }
};

startServer();
