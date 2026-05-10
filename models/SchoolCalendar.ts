import mongoose, { Schema, Document, Model } from "mongoose";
import { TermName } from "@/types/enums";

export type CalendarEventType =
  | "public_holiday"
  | "mid_term_break"
  | "school_event"  // e.g. sports day, exam week (school still open but no normal classes)
  | "worker's_day"
  | "other";

export interface ISchoolCalendarDocument extends Document {
  session: mongoose.Types.ObjectId;
  term: TermName;
  title: string;              // e.g. "Eid-el-Fitr", "Mid-Term Break"
  type: CalendarEventType;
  startDate: Date;            // first day of the event (midnight UTC)
  endDate: Date;              // last day (midnight UTC) — same as startDate for single-day
  blocksAttendance: boolean;  // always true for holidays/breaks, false for school_event
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolCalendarSchema = new Schema<ISchoolCalendarDocument>(
  {
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    term: { type: String, enum: Object.values(TermName), required: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["public_holiday", "mid_term_break", "school_event", "worker's_day", "other"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    blocksAttendance: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

SchoolCalendarSchema.index({ session: 1, term: 1 });
SchoolCalendarSchema.index({ startDate: 1, endDate: 1 });

const SchoolCalendarModel: Model<ISchoolCalendarDocument> =
  mongoose.models.SchoolCalendar ??
  mongoose.model<ISchoolCalendarDocument>("SchoolCalendar", SchoolCalendarSchema);

export default SchoolCalendarModel;