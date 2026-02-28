import mongoose, { Schema, Document, Model } from "mongoose";
import "@/models/Subject"
import { ClassLevel, Department } from "@/types/enums";

export interface IClassDocument extends Document {
  name: ClassLevel;
  section: "primary" | "jss" | "sss";
  department: Department;
  capacity?: number;
  classTeacher?: mongoose.Types.ObjectId;
  subjects: mongoose.Types.ObjectId[];
  order: number; // For sorting/promotion ordering
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClassDocument>(
  {
    name: { type: String, enum: Object.values(ClassLevel), required: true },
    section: { type: String, enum: ["primary", "jss", "sss"], required: true },
    department: { type: String, enum: Object.values(Department), default: Department.NONE },
    capacity: { type: Number },
    classTeacher: { type: Schema.Types.ObjectId, ref: "User" },
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    order: { type: Number, required: true }, // 1=P2, 2=P3, 3=P4, 4=P5, 5=J1, 6=J2, 7=J3, 8=S1, 9=S2
  },
  { timestamps: true }
);

ClassSchema.index({ name: 1, department: 1 }, { unique: true });
ClassSchema.index({ section: 1 });
ClassSchema.index({ order: 1 });

const ClassModel: Model<IClassDocument> =
  mongoose.models.Class ?? mongoose.model<IClassDocument>("Class", ClassSchema);

export default ClassModel;
