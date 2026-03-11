import mongoose, { Document } from "mongoose";

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  role?: string;
  action: string;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId | string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const auditLogSchema = new mongoose.Schema<IAuditLog>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId },
    role: { type: String },
    action: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: mongoose.Schema.Types.Mixed },
    metadata: { type: Object },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ role: 1, action: 1 });

export default mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

