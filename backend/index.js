import dotenv from "dotenv";
dotenv.config({ override: true });
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import mongoose from "mongoose";
import path from "path";
import cors from "cors";
import signupRouter from "./src/routes/signup.routes.js";
import myClaimsRouter from "./src/routes/my_claims.routes.js";
import newClaimRouter from "./src/routes/new_claim.routes.js";
import myVehiclesRouter from "./src/routes/my_vehicles.routes.js";
import adminRouter from "./src/routes/admin.routes.js";
import officeStaffRouter from "./src/routes/office_staff.routes.js";
import agentRouter from "./src/routes/agent.routes.js";

const app = express();
const __dirname = path.resolve();

app.use(cors());

// Global no-cache middleware for API routes to prevent browser/runtime caching of GET responses
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Serve local uploads from Downloads directory
app.use("/uploads", express.static("C:\\Users\\oshit\\Downloads\\ui"));

// Increase payload size limit to support base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/api/signup", signupRouter);
app.use("/api/policy-holder", myClaimsRouter);
app.use("/api/policy-holder", newClaimRouter);
app.use("/api/policy-holder", myVehiclesRouter);
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
// Trigger server restart check
