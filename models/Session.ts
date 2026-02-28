import mongoose, { Schema, Document, Model } from "mongoose";
import { SessionStatus, TermName, TermStatus } from "@/types/enums";

export interface ITermDocument extends Document {
  name: TermName;
  status: TermStatus;
  startDate: Date;
  endDate: Date;
  resumptionDate?: Date;
  schoolDaysOpen: number;
  session: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionDocument extends Document {
  name: string;
  status: SessionStatus;
  terms: mongoose.Types.ObjectId[];
  startYear: number;
  endYear: number;
  createdAt: Date;
  updatedAt: Date;
}

const TermSchema = new Schema<ITermDocument>(
  {
    name: { type: String, enum: Object.values(TermName), required: true },
    status: { type: String, enum: Object.values(TermStatus), default: TermStatus.UPCOMING },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    resumptionDate: { type: Date },
    schoolDaysOpen: { type: Number, default: 0 },
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  },
  { timestamps: true }
);

const SessionSchema = new Schema<ISessionDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: Object.values(SessionStatus), default: SessionStatus.UPCOMING },
    terms: [{ type: Schema.Types.ObjectId, ref: "Term" }],
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
  },
  { timestamps: true }
);

SessionSchema.index({ status: 1 });
SessionSchema.index({ startYear: 1, endYear: 1 });

export const TermModel: Model<ITermDocument> =
  mongoose.models.Term ?? mongoose.model<ITermDocument>("Term", TermSchema);

export const SessionModel: Model<ISessionDocument> =
  mongoose.models.Session ?? mongoose.model<ISessionDocument>("Session", SessionSchema);
