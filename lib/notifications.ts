import { connectDB } from "@/lib/db";
import NotificationModel from "@/models/Notification";
import { NotificationType, UserRole } from "@/types/enums";

interface CreateNotificationParams {
  recipientId: string;
  recipientRole: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, string | number | boolean>;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  await connectDB();
  await NotificationModel.create({
    recipient: params.recipientId,
    recipientRole: params.recipientRole,
    type: params.type,
    title: params.title,
    message: params.message,
    metadata: params.metadata,
    link: params.link,
  });
}

export async function createBulkNotifications(notifications: CreateNotificationParams[]): Promise<void> {
  await connectDB();
  await NotificationModel.insertMany(
    notifications.map((n) => ({
      recipient: n.recipientId,
      recipientRole: n.recipientRole,
      type: n.type,
      title: n.title,
      message: n.message,
      metadata: n.metadata,
      link: n.link,
    }))
  );
}
