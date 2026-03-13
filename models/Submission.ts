// ─── models/Submission.ts ─────────────────────────────────────────────────────

import mongoose, { Schema, Document, Model  } from "mongoose";

export interface ISubmissionDocument extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId:    mongoose.Types.ObjectId;
  textAnswer?:  string;
  attachments:  string[];          // Cloudinary URLs
  submittedAt:  Date;
  isSubmitted:  boolean;
  isLate:       boolean;
  score?:       number;
  feedback?:    string;
  gradedBy?:    mongoose.Types.ObjectId;
  gradedAt?:    Date;
  createdAt:    Date;
  updatedAt:    Date;
}

const SubmissionSchema = new Schema<ISubmissionDocument>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    studentId:    { type: Schema.Types.ObjectId, ref: "User",       required: true, index: true },
    textAnswer:   { type: String, trim: true, maxlength: 5000 },
    attachments:  [{ type: String }],
    submittedAt:  { type: Date },
    isSubmitted:  { type: Boolean, default: false },
    isLate:       { type: Boolean, default: false },
    score:        { type: Number, min: 0 },
    feedback:     { type: String, trim: true, maxlength: 1000 },
    gradedBy:     { type: Schema.Types.ObjectId, ref: "User" },
    gradedAt:     { type: Date },
  },
  { timestamps: true }
);

// One submission per student per assignment
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

const SubmissionModel: Model<ISubmissionDocument> =
  mongoose.models.Submission ||
  mongoose.model<ISubmissionDocument>("Submission", SubmissionSchema);

export default SubmissionModel;