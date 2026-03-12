import { Department } from "@/types/enums";
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubjectDocument extends Document {
  name: string;
  code: string;
  hasPractical: boolean;
  assignedClasses: mongoose.Types.ObjectId[];
  // department: "science" | "art" | "commercial" | "general";
  department: Department | "general";
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubjectDocument>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    hasPractical: { type: Boolean, default: false },
   department: {
      type: String,
      enum: [...Object.values(Department).filter(d => d !== Department.NONE), "general"],
      default: "general",
    },
    assignedClasses: [{ type: Schema.Types.ObjectId, ref: "Class" }],
  },
  { timestamps: true }
);

// SubjectSchema.index({ code: 1 });
SubjectSchema.index({ assignedClasses: 1 });
SubjectSchema.index({ department: 1 });

const SubjectModel: Model<ISubjectDocument> =
  mongoose.models.Subject ?? mongoose.model<ISubjectDocument>("Subject", SubjectSchema);

export default SubjectModel;
