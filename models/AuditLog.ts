import mongoose, { Schema, Document, Model } from "mongoose";
import { AuditAction, UserRole } from "@/types/enums";

export interface IChangeRecord {
  before: string | number | boolean | null;
  after: string | number | boolean | null;
}

export interface IAuditLogDocument extends Document {
  actor: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  entity: string;
  entityId: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, IChangeRecord>;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, enum: Object.values(UserRole), required: true },
    action: { type: String, enum: Object.values(AuditAction), required: true },
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    description: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    changes: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });

const AuditLogModel: Model<IAuditLogDocument> =
  mongoose.models.AuditLog ??
  mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);

export default AuditLogModel;
