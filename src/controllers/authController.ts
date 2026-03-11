import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken";
import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ check in User collection
    let user: any = await User.findOne({ email });
    let role = "";

    if (user) {
      role = user.role;
    } else {
      // 2️⃣ check in Doctor collection
      const doctor = await Doctor.findOne({ email });

      if (!doctor) {
        return res.status(400).json({
          message: "Invalid email or password",
        });
      }

      user = doctor;
      role = "doctor";
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account is blocked",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(user._id.toString(), role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // ACCESS TOKEN COOKIE
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    // REFRESH TOKEN COOKIE
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
      },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};



export const refreshAccessToken = (req: Request, res: Response) => {

  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({
      message: "No refresh token"
    });
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { userId: string };

    const accessToken = generateAccessToken(decoded.userId, "patient");

    res.json({ accessToken });

  } catch {

    return res.status(403).json({
      message: "Invalid refresh token"
    });

  }

};

export const logoutUser = (req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};