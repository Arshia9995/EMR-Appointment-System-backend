import mongoose, { Document } from "mongoose";

export interface IDoctor extends Document {
  name: string;
  email: string;
  password: string;
  department: string;
  specialization: string;
  workingHours: { start: Date; end: Date };
  breakTimes: { start: Date | null; end: Date | null }[];
  slotDuration: number;
  isBlocked: boolean;
}

const doctorSchema = new mongoose.Schema<IDoctor>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, required: true },
  specialization: { type: String, required: true },
  workingHours: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  breakTimes: [
    {
      start: { type: Date },
      end: { type: Date }
    }
  ],
  slotDuration: { type: Number, required: true },
  isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IDoctor>("Doctor", doctorSchema);