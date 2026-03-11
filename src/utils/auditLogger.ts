import AuditLog from "../models/AuditLog";

interface LogParams {
  userId?: string;
  role?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export const logAudit = async (params: LogParams) => {
  try {
    await AuditLog.create({
      userId: params.userId,
      role: params.role,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    });
  } catch {
    // never block main flow on audit failure
  }
};

