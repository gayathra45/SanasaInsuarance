import express from "express";
import User from "../models/user.model.js";

const router = express.Router();

// 1. Add a new vehicle to user's registered list
router.post("/add-vehicle", async (req, res) => {
  try {
    const { nic, numberPlate, vehicleType, year, company, model, engineNumber, chassisNumber, policyNumber } = req.body;
    
    if (!nic || !numberPlate || !vehicleType || !year || !company || !model || !engineNumber || !chassisNumber || !policyNumber) {
      return res.status(400).json({ error: "All vehicle details must be provided." });
    }

    const cleanNic = nic.trim();
    const user = await User.findOne({ nic: cleanNic });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check validation rules matching signup
    const cleanPlate = numberPlate.replace(/[\s-]/g, "");
    if (cleanPlate.length < 5 || cleanPlate.length > 10 || !/^[A-Za-z0-9]+$/.test(cleanPlate)) {
      return res.status(400).json({ error: "Number Plate must be an alphanumeric mix between 5 and 10 characters." });
    }
    if (!/^\d{4}$/.test(year.trim())) {
      return res.status(400).json({ error: "Invalid year. Must be a 4-digit number." });
    }
    const cleanPolicy = policyNumber.replace(/[\s-]/g, "");
    if (!/^SAN[A-Za-z0-9]{5,9}$/i.test(cleanPolicy)) {
      return res.status(400).json({ error: "Insurance Policy Number must start with 'SAN' and be between 8 and 12 alphanumeric characters." });
    }

    // Check if plate is already registered for this user
    const exists = user.vehicles.some(
      v => v.numberPlate.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === numberPlate.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ error: "This vehicle number plate is already registered under your account." });
    }

    const newVehicle = {
      numberPlate: numberPlate.trim(),
      vehicleType: vehicleType.trim(),
      year: year.trim(),
      company: company.trim(),
      model: model.trim(),
      engineNumber: engineNumber.trim(),
      chassisNumber: chassisNumber.trim(),
      policyNumber: policyNumber.trim()
    };

    user.vehicles.push(newVehicle);
    await user.save();

    res.status(201).json({
      message: "Vehicle added successfully",
      vehicle: newVehicle,
      vehicles: user.vehicles
    });
  } catch (err) {
    console.error("Add vehicle backend error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

export default router;
