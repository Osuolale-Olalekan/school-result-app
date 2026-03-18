// models/Timetable.ts

import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Period Interface ─────────────────────────────────────────────────────────

export interface ITimetablePeriod {
  day:          "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
  periodNumber: number;   // 1, 2, 3, ...
  startTime:    string;   // "08:00"
  endTime:      string;   // "08:45"
  subjectId:    mongoose.Types.ObjectId;
  teacherId:    mongoose.Types.ObjectId;
  room?:        string;
}

// ─── Document Interface ───────────────────────────────────────────────────────

export interface ITimetableDocument extends Document {
  classId:   mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  termId:    mongoose.Types.ObjectId;
  periods:   ITimetablePeriod[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const PeriodSchema = new Schema<ITimetablePeriod>(
  {
    day: {
      type:     String,
      enum:     ["monday", "tuesday", "wednesday", "thursday", "friday"],
      required: true,
    },
    periodNumber: { type: Number, required: true, min: 1 },
    startTime:    { type: String, required: true },   // "HH:MM"
    endTime:      { type: String, required: true },   // "HH:MM"
    subjectId:    { type: Schema.Types.ObjectId, ref: "Subject",  required: true },
    teacherId:    { type: Schema.Types.ObjectId, ref: "User",     required: true },
    room:         { type: String, trim: true },
  },
  { _id: true }
);

const TimetableSchema = new Schema<ITimetableDocument>(
  {
    classId:   { type: Schema.Types.ObjectId, ref: "Class",   required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    termId:    { type: Schema.Types.ObjectId, ref: "Term",    required: true, index: true },
    periods:   [PeriodSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User",    required: true },
  },
  { timestamps: true }
);

// One timetable per class per term
TimetableSchema.index({ classId: 1, sessionId: 1, termId: 1 }, { unique: true });

// ─── Model ────────────────────────────────────────────────────────────────────

const TimetableModel: Model<ITimetableDocument> =
  mongoose.models.Timetable ||
  mongoose.model<ITimetableDocument>("Timetable", TimetableSchema);

export default TimetableModel;