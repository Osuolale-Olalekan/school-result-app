import mongoose, { Schema, Document, Model } from "mongoose";
import {
  AnnouncementAudience,
  AnnouncementPriority,
  AnnouncementStatus,
  UserRole,
} from "@/types/enums";

export interface IAnnouncementDocument extends Document {
  title: string;
  body: string;                              // rich text / HTML
  audience: AnnouncementAudience;
  targetRoles: UserRole[];                   // populated when audience === "role"
  targetClassIds: mongoose.Types.ObjectId[]; // populated when audience === "class"
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  createdBy: mongoose.Types.ObjectId;        // admin _id
  publishedAt?: Date;
  expiresAt?: Date;                          // auto-hide after this date
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncementDocument>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    audience: {
      type: String,
      enum: Object.values(AnnouncementAudience),
      required: true,
      default: AnnouncementAudience.ALL,
    },
    targetRoles: {
      type: [String],
      enum: Object.values(UserRole),
      default: [],
    },
    targetClassIds: [{ type: Schema.Types.ObjectId, ref: "Class" }],
    priority: {
      type: String,
      enum: Object.values(AnnouncementPriority),
      default: AnnouncementPriority.NORMAL,
    },
    status: {
      type: String,
      enum: Object.values(AnnouncementStatus),
      default: AnnouncementStatus.DRAFT,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Efficient queries: list active announcements for a given audience/role/class
AnnouncementSchema.index({ status: 1, audience: 1 });
AnnouncementSchema.index({ status: 1, targetRoles: 1 });
AnnouncementSchema.index({ status: 1, targetClassIds: 1 });
AnnouncementSchema.index({ expiresAt: 1 }); // for TTL-style filtering

const AnnouncementModel: Model<IAnnouncementDocument> =
  mongoose.models.Announcements ??
  mongoose.model<IAnnouncementDocument>("Announcements", AnnouncementSchema);

export default AnnouncementModel;