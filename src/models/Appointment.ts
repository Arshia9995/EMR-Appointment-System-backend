import mongoose, { Document } from "mongoose";

export interface IAppointment extends Document {
  doctor: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: "Booked" | "Arrived" | "Done";
  patient?: mongoose.Types.ObjectId;
  patientType: "new" | "existing";
  patientName?: string;
  mobile?: string;
  age?: number;
  existingPatientIdentifier?: string;
  purpose?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdByRole: string;
}

const appointmentSchema = new mongoose.Schema<IAppointment>(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Booked", "Arrived", "Done"],
      default: "Booked",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    patientType: {
      type: String,
      enum: ["new", "existing"],
      required: true,
    },
    patientName: { type: String },
    mobile: { type: String },
    age: { type: Number },
    existingPatientIdentifier: { type: String },
    purpose: { type: String },
    notes: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByRole: { type: String, required: true },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, startTime: 1 }, { unique: true });

export default mongoose.model<IAppointment>("Appointment", appointmentSchema);

