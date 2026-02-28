import mongoose, { Schema, Document, Model } from "mongoose";
import { NotificationType, UserRole } from "@/types/enums";

export interface INotificationDocument extends Document {
  recipient: mongoose.Types.ObjectId;
  recipientRole: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, string | number | boolean>;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientRole: { type: String, enum: Object.values(UserRole), required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
    link: { type: String },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

const NotificationModel: Model<INotificationDocument> =
  mongoose.models.Notification ??
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);

export default NotificationModel;
