import mongoose, { Schema, Document, Model } from "mongoose";
import UserModel from "./User";

export interface ITeacherDocument extends Document {
  employeeId: string;
  qualification?: string;
  specialization?: string;
  dateOfEmployment?: Date;
  // children?: mongoose.Types.ObjectId[]; // For parent access to students
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacherDocument>(
  {
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    qualification: { type: String },
    specialization: { type: String },
    dateOfEmployment: { type: Date },
    // children: [{ type: Schema.Types.ObjectId, ref: "student" }], // For teacher access to students
  },
  { timestamps: true }
);

// TeacherSchema.index({ employeeId: 1 });

// const TeacherModel: Model<ITeacherDocument> =
//   mongoose.models.Teacher ??
//   UserModel.discriminator<ITeacherDocument>("teacher", TeacherSchema);

// export default TeacherModel;

let TeacherModel: Model<ITeacherDocument>;

try {
  TeacherModel = mongoose.model<ITeacherDocument>("teacher");
} catch {
  TeacherModel = UserModel.discriminator<ITeacherDocument>("teacher", TeacherSchema);
}

export default TeacherModel;