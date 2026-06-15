import express from "express";
import User from "../../Signup/user.model.js";
import Claim from "../claim.model.js";

const router = express.Router();

// 1. Fetch user's registered vehicles list
router.get("/vehicles", async (req, res) => {
  try {
    const { nic } = req.query;
    if (!nic) {
      return res.status(400).json({ error: "NIC query parameter is required." });
    }

    const cleanNic = nic.trim();
    const user = await User.findOne({ nic: cleanNic }, { vehicles: 1 });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ vehicles: user.vehicles || [] });
  } catch (err) {
    console.error("Fetch vehicles API error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// 2. Submit a new accident claim (auto-generates sequential ID)
router.post("/new-claim", async (req, res) => {
  try {
    const {
      userNic,
      vehiclePlate,
      incidentDate,
      incidentTime,
      damageType,
      description,
      location,
      accidentPhotos,
      drivingLicense
    } = req.body;

    if (!userNic || !vehiclePlate || !incidentDate || !incidentTime || !damageType || !description || !location) {
      return res.status(400).json({ error: "All required claim details must be provided." });
    }

    // Generate next sequential claim ID (CLM-0000-0001)
    const lastClaim = await Claim.findOne({}, { claimNumber: 1 }).sort({ createdAt: -1 });
    let nextClaimNum = "CLM-0000-0001";
    
    if (lastClaim && lastClaim.claimNumber) {
      const match = lastClaim.claimNumber.match(/CLM-0000-(\d+)/i);
      if (match) {
        const currentNum = parseInt(match[1], 10);
        const nextNum = currentNum + 1;
        nextClaimNum = `CLM-0000-${String(nextNum).padStart(4, '0')}`;
      }
    }

    // Save claim payload to MongoDB
    const newClaim = new Claim({
      claimNumber: nextClaimNum,
      userNic: userNic.trim(),
      vehiclePlate,
      incidentDate,
      incidentTime,
      damageType,
      description,
      location,
      accidentPhotos: {
        front: accidentPhotos?.front || [],
        rear: accidentPhotos?.rear || [],
        side: accidentPhotos?.side || []
      },
      drivingLicense: {
        front: drivingLicense?.front || [],
        rear: drivingLicense?.rear || []
      }
    });

    await newClaim.save();

    res.status(201).json({
      message: "Claim submitted successfully",
      claimNumber: nextClaimNum
    });
  } catch (err) {
    console.error("Submit claim API error:", err);
    res.status(500).json({ error: "An internal server error occurred saving the claim." });
  }
});

export default router;
