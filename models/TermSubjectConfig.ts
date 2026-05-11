import mongoose, { Schema, Document, Model } from "mongoose";
import { TermName } from "@/types/enums";

// Stores which subjects are excluded from grading for a specific
// class + term + session. One document per class per term per session.
// excludedSubjects is an array of subject ObjectIds that are inactive.

export interface ITermSubjectConfigDocument extends Document {
  class: mongoose.Types.ObjectId;
  session: mongoose.Types.ObjectId;
  term: TermName;
  excludedSubjects: mongoose.Types.ObjectId[]; // subjects NOT offered this term
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TermSubjectConfigSchema = new Schema<ITermSubjectConfigDocument>(
  {
    class:            { type: Schema.Types.ObjectId, ref: "Class",   required: true },
    session:          { type: Schema.Types.ObjectId, ref: "Session", required: true },
    term:             { type: String, enum: Object.values(TermName), required: true },
    excludedSubjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    updatedBy:        { type: Schema.Types.ObjectId, ref: "User",    required: true },
  },
  { timestamps: true }
);

// One config per class per term per session
TermSubjectConfigSchema.index(
  { class: 1, session: 1, term: 1 },
  { unique: true }
);

const TermSubjectConfigModel: Model<ITermSubjectConfigDocument> =
  mongoose.models.TermSubjectConfig ??
  mongoose.model<ITermSubjectConfigDocument>(
    "TermSubjectConfig",
    TermSubjectConfigSchema
  );

export default TermSubjectConfigModel;