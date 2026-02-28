import mongoose, { Schema, Document, Model } from "mongoose";
import { Department, StudentStatus } from "@/types/enums";
import UserModel from "./User";

export interface IStudentDocument extends Document {
  admissionNumber: string;
  admissionDate: Date;
  dateOfBirth: Date;
  gender: "male" | "female";
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  currentClass: mongoose.Types.ObjectId;
  department: Department;
  studentStatus: StudentStatus;
  parents: mongoose.Types.ObjectId[];
  stateOfOrigin?: string;
  localGovernment?: string;
  religion?: string;
  bloodGroup?: string;
  genotpe?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudentDocument>(
  {
    admissionNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    admissionDate: { type: Date, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    address: { type: String },
    guardianName: { type: String },
    guardianPhone: { type: String },
    currentClass: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    department: { type: String, enum: Object.values(Department), default: Department.NONE },
    studentStatus: { type: String, enum: Object.values(StudentStatus), default: StudentStatus.ACTIVE },
    parents: [{ type: Schema.Types.ObjectId, ref: "parent" }],
    stateOfOrigin: { type: String },
    localGovernment: { type: String },
    religion: { type: String },
    bloodGroup: { type: String },
    genotpe: { type: String },
  },
  { timestamps: true }
);

// StudentSchema.index({ admissionNumber: 1 });
StudentSchema.index({ currentClass: 1, studentStatus: 1 });
StudentSchema.index({ parents: 1 });

// const StudentModel: Model<IStudentDocument> =
//   mongoose.models.Student ??
//   UserModel.discriminator<IStudentDocument>("student", StudentSchema);

// export default StudentModel;

let StudentModel: Model<IStudentDocument>;

try {
  StudentModel = mongoose.model<IStudentDocument>("student");
} catch {
  StudentModel = UserModel.discriminator<IStudentDocument>("student", StudentSchema);
}

export default StudentModel;