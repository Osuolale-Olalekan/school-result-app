import { connectDB } from "@/lib/db";
import AuditLogModel from "@/models/AuditLog";
import { AuditAction, UserRole } from "@/types/enums";
import type { IChangeRecord } from "@/models/AuditLog";

interface CreateAuditLogParams {
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  entity: string;
  entityId: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, IChangeRecord>;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await connectDB();
    await AuditLogModel.create({
      actor: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      description: params.description,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      changes: params.changes,
    });
  } catch (error) {
    
  }
}
