// models/FeeStructure.ts

import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Fee line item ────────────────────────────────────────────────────────────

export type FeeType =
  | "school_fees"
  | "sports_levy"
  | "pta"
  | "development"
  | "exam_fees"
  | "other";

export interface IFeeLineItem {
  _id?:        mongoose.Types.ObjectId;
  feeType:     FeeType;
  label:       string;      // e.g. "First Term School Fees"
  amount:      number;      // in Naira
  isCompulsory: boolean;
}

// ─── Document ─────────────────────────────────────────────────────────────────

export interface IFeeStructureDocument extends Document {
  classId:   mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  termId:    mongoose.Types.ObjectId;
  items:     IFeeLineItem[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const FeeLineItemSchema = new Schema<IFeeLineItem>(
  {
    feeType: {
      type:     String,
      enum:     ["school_fees", "sports_levy", "pta", "development", "exam_fees", "other"],
      required: true,
    },
    label:        { type: String, required: true, trim: true },
    amount:       { type: Number, required: true, min: 0 },
    isCompulsory: { type: Boolean, default: true },
  },
  { _id: true }
);

const FeeStructureSchema = new Schema<IFeeStructureDocument>(
  {
    classId:   { type: Schema.Types.ObjectId, ref: "Class",   required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    termId:    { type: Schema.Types.ObjectId, ref: "Term",    required: true, index: true },
    items:     [FeeLineItemSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User",    required: true },
  },
  { timestamps: true }
);

// One fee structure per class per term
FeeStructureSchema.index({ classId: 1, sessionId: 1, termId: 1 }, { unique: true });

// ─── Model ────────────────────────────────────────────────────────────────────

const FeeStructureModel: Model<IFeeStructureDocument> =
  mongoose.models.FeeStructure ||
  mongoose.model<IFeeStructureDocument>("FeeStructure", FeeStructureSchema);

export default FeeStructureModel;