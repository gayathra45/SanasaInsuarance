import express from "express";
import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import { uploadToCloudinary } from "../utils/upload.js";

const router = express.Router();

function getNearestBranch(location = "") {
  const cleanLocation = location.trim().toLowerCase();

  if (cleanLocation.includes("galle") || cleanLocation.includes("hambantota")) {
    return "Galle";
  }
  if (cleanLocation.includes("matara")) {
    return "Matara";
  }
  if (cleanLocation.includes("colombo") || cleanLocation.includes("gampaha") || cleanLocation.includes("kalutara")) {
    return "Colombo";
  }
  if (cleanLocation.includes("anuradhapura") || cleanLocation.includes("polonnaruwa")) {
    return "Anuradhapura";
  }
  if (cleanLocation.includes("embilipitiya") || cleanLocation.includes("ratnapura")) {
    return "Embilipitiya";
  }
  return "Galle";
}

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

    // Upload photos and license images to Cloudinary in parallel
    const uploadArray = async (arr, folder) => {
      if (!arr || !Array.isArray(arr)) return [];
      return Promise.all(arr.map(item => uploadToCloudinary(item, folder)));
    };

    const [accidentFront, accidentRear, accidentSide, licenseFront, licenseRear] = await Promise.all([
      uploadArray(accidentPhotos?.front, "claims/accident_photos"),
      uploadArray(accidentPhotos?.rear, "claims/accident_photos"),
      uploadArray(accidentPhotos?.side, "claims/accident_photos"),
      uploadArray(drivingLicense?.front, "claims/driving_license"),
      uploadArray(drivingLicense?.rear, "claims/driving_license")
    ]);

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
      branch: getNearestBranch(location),
      accidentPhotos: {
        front: accidentFront,
        rear: accidentRear,
        side: accidentSide
      },
      drivingLicense: {
        front: licenseFront,
        rear: licenseRear
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
