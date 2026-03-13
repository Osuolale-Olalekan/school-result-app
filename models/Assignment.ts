// ─── models/Assignment.ts ─────────────────────────────────────────────────────

import mongoose, { Schema, Document, Model } from "mongoose";

export type AssignmentStatus = "draft" | "published";

export interface IAssignmentDocument extends Document {
  title:        string;
  description?: string;
  classId:      mongoose.Types.ObjectId;
  subjectId?:   mongoose.Types.ObjectId;
  createdBy:    mongoose.Types.ObjectId;
  dueDate:      Date;
  maxScore:     number;
  attachments:  string[];          // Cloudinary URLs
  status:       AssignmentStatus;
  createdAt:    Date;
  updatedAt:    Date;
}

const AssignmentSchema = new Schema<IAssignmentDocument>(
  {
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    classId:     { type: Schema.Types.ObjectId, ref: "Class",   required: true, index: true },
    subjectId:   { type: Schema.Types.ObjectId, ref: "Subject", index: true },
    createdBy:   { type: Schema.Types.ObjectId, ref: "User",    required: true, index: true },
    dueDate:     { type: Date, required: true },
    maxScore:    { type: Number, required: true, default: 100, min: 1 },
    attachments: [{ type: String }],
    status:      { type: String, enum: ["draft", "published"], default: "draft", index: true },
  },
  { timestamps: true }
);

AssignmentSchema.index({ classId: 1, status: 1 });
AssignmentSchema.index({ createdBy: 1, status: 1 });

const AssignmentModel: Model<IAssignmentDocument> =
  mongoose.models.Assignment ||
  mongoose.model<IAssignmentDocument>("Assignment", AssignmentSchema);

export default AssignmentModel;


