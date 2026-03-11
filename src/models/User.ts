import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "super_admin" | "doctor" | "receptionist";
  isBlocked: boolean;
}

const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["super_admin", "doctor", "receptionist"],
    default: "super_admin"
  },

  isBlocked: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model<IUser>("User", userSchema);