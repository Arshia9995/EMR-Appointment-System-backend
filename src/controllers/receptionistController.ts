import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";

// Create receptionist
export const createReceptionist = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const receptionist = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "receptionist",
    });

    const { password: _, ...receptionistWithoutPassword } = receptionist.toObject();

    res.status(201).json({ success: true, data: receptionistWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all receptionists
export const getReceptionists = async (_req: Request, res: Response) => {
  try {
    const receptionists = await User.find({ role: "receptionist" }).select("-password");
    res.status(200).json({ success: true, data: receptionists });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single receptionist by id
export const getReceptionistById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const receptionist = await User.findOne({ _id: id, role: "receptionist" }).select("-password");

    if (!receptionist) {
      return res.status(404).json({ message: "Receptionist not found" });
    }

    res.status(200).json({ success: true, data: receptionist });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update receptionist
export const updateReceptionist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    const receptionist = await User.findOne({ _id: id, role: "receptionist" });
    if (!receptionist) {
      return res.status(404).json({ message: "Receptionist not found" });
    }

    if (name !== undefined) receptionist.name = name;
    if (email !== undefined) receptionist.email = email;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      receptionist.password = hashedPassword;
    }

    await receptionist.save();

    const updated = await User.findById(receptionist._id).select("-password");

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Block / unblock receptionist
export const blockReceptionist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const receptionist = await User.findOne({ _id: id, role: "receptionist" });

    if (!receptionist) {
      return res.status(404).json({ message: "Receptionist not found" });
    }

    receptionist.isBlocked = !receptionist.isBlocked;
    await receptionist.save();

    const updated = await User.findById(receptionist._id).select("-password");

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

