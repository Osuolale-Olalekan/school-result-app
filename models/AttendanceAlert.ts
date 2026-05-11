import mongoose, { Schema, Document, Model } from "mongoose";
import { TermName } from "@/types/enums";

// Tracks the last time a parent was notified about their child's attendance
// for a given threshold, term and session. Used to enforce the weekly cooldown.

export type AlertThreshold = 75 | 50;

export interface IAttendanceAlertDocument extends Document {
  student: mongoose.Types.ObjectId;
  session: mongoose.Types.ObjectId;
  term: TermName;
  threshold: AlertThreshold;   // 75 or 50
  lastNotifiedAt: Date;        // when the notification was last sent
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceAlertSchema = new Schema<IAttendanceAlertDocument>(
  {
    student:        { type: Schema.Types.ObjectId, ref: "student",  required: true },
    session:        { type: Schema.Types.ObjectId, ref: "Session",  required: true },
    term:           { type: String, enum: Object.values(TermName),  required: true },
    threshold:      { type: Number, enum: [75, 50],                 required: true },
    lastNotifiedAt: { type: Date,                                   required: true },
  },
  { timestamps: true }
);

// One alert record per student per term per threshold
AttendanceAlertSchema.index(
  { student: 1, session: 1, term: 1, threshold: 1 },
  { unique: true }
);

const AttendanceAlertModel: Model<IAttendanceAlertDocument> =
  mongoose.models.AttendanceAlert ??
  mongoose.model<IAttendanceAlertDocument>("AttendanceAlert", AttendanceAlertSchema);

export default AttendanceAlertModel;