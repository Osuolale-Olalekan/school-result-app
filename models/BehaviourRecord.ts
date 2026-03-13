import mongoose, { Schema, Document, Model } from "mongoose";
import {
  BehaviourType,
  BehaviourCategory,
  BehaviourSeverity,
} from "@/types/enums";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IBehaviourRecordDocument extends Document {
  studentId:       mongoose.Types.ObjectId;
  loggedBy:        mongoose.Types.ObjectId;
  date:            Date;
  type:            BehaviourType;
  category:        BehaviourCategory;
  description:     string;
  severity?:       BehaviourSeverity;   // only for negative
  actionTaken?:    string;
  parentNotified:  boolean;
  createdAt:       Date;
  updatedAt:       Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const BehaviourRecordSchema = new Schema<IBehaviourRecordDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    loggedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    type: {
      type: String,
      enum: Object.values(BehaviourType),
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(BehaviourCategory),
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    severity: {
      type: String,
      enum: Object.values(BehaviourSeverity),
      // only present on negative records
    },
    actionTaken: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    parentNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound indexes for common queries
BehaviourRecordSchema.index({ studentId: 1, date: -1 });
BehaviourRecordSchema.index({ studentId: 1, type: 1 });
BehaviourRecordSchema.index({ loggedBy: 1, date: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const BehaviourRecordModel: Model<IBehaviourRecordDocument> =
  mongoose.models.BehaviourRecord ||
  mongoose.model<IBehaviourRecordDocument>(
    "BehaviourRecord",
    BehaviourRecordSchema
  );

export default BehaviourRecordModel;