import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClassAssignmentDocument extends Document {
  teacher: mongoose.Types.ObjectId;
  class: mongoose.Types.ObjectId;
  session: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassAssignmentSchema = new Schema<IClassAssignmentDocument>(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ClassAssignmentSchema.index({ teacher: 1, session: 1 });
ClassAssignmentSchema.index({ class: 1, session: 1 });
ClassAssignmentSchema.index({ teacher: 1, class: 1, session: 1 }, { unique: true });

const ClassAssignmentModel: Model<IClassAssignmentDocument> =
  mongoose.models.ClassAssignment ??
  mongoose.model<IClassAssignmentDocument>("ClassAssignment", ClassAssignmentSchema);

export default ClassAssignmentModel;
