import mongoose, { Schema, Document, Model } from "mongoose";
import { TermName } from "@/types/enums";

// One document = one class's attendance for one day (both sessions)
// students array holds the status of every student for that day

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface IStudentAttendance {
  student: mongoose.Types.ObjectId;
  morning: AttendanceStatus;
  afternoon: AttendanceStatus;
}

export interface IAttendanceRecordDocument extends Document {
  class: mongoose.Types.ObjectId;
  session: mongoose.Types.ObjectId;
  term: TermName;
  date: Date; // stored as midnight UTC of the school day
  markedBy: mongoose.Types.ObjectId; // teacher who submitted
  students: IStudentAttendance[];
  createdAt: Date;
  updatedAt: Date;
}

const StudentAttendanceSchema = new Schema<IStudentAttendance>(
  {
    student: { type: Schema.Types.ObjectId, ref: "student", required: true },
    morning: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present",
    },
    afternoon: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present",
    },
  },
  { _id: false }
);

const AttendanceRecordSchema = new Schema<IAttendanceRecordDocument>(
  {
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    term: {
      type: String,
      enum: Object.values(TermName),
      required: true,
    },
    date: { type: Date, required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    students: { type: [StudentAttendanceSchema], default: [] },
  },
  { timestamps: true }
);

// One record per class per day per term — enforced at DB level
AttendanceRecordSchema.index(
  { class: 1, date: 1, term: 1, session: 1 },
  { unique: true }
);
AttendanceRecordSchema.index({ class: 1, session: 1, term: 1 });
AttendanceRecordSchema.index({ date: 1 });

const AttendanceRecordModel: Model<IAttendanceRecordDocument> =
  mongoose.models.AttendanceRecord ??
  mongoose.model<IAttendanceRecordDocument>(
    "AttendanceRecord",
    AttendanceRecordSchema
  );

export default AttendanceRecordModel;