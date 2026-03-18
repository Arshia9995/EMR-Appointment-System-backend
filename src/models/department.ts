import mongoose, { Document, Schema } from "mongoose";

export interface IDepartment extends Document {
  name: string;
}

const departmentSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
});

export default mongoose.model<IDepartment>("Department", departmentSchema);