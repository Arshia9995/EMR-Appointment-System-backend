import mongoose, { Document } from "mongoose";

export interface IPatient extends Document {
  name: string;
  mobile: string;
  age?: number;
}

const patientSchema = new mongoose.Schema<IPatient>(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    age: { type: Number },
  },
  { timestamps: true }
);

patientSchema.index({ name: "text", mobile: "text" });

export default mongoose.model<IPatient>("Patient", patientSchema);

