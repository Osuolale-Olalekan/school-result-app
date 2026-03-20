import mongoose, { Schema, Document, Model } from "mongoose";
import { UserRole, UserStatus } from "@/types/enums";

export interface IUserDocument extends Document {
  surname: string;
  firstName: string;
  otherName: string;
  // email: string;
  email?: string;
  password: string;
  phone?: string;
  // role: UserRole;
  roles: UserRole[]; 
  activeRole: UserRole;
  status: UserStatus;
  profilePhoto?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  children?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    surname: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    otherName: { type: String, required: true, trim: true },
    // email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // email: { type: String, required: false, unique: true, sparse: true, lowercase: true, trim: true },
    email: { type: String, required: false, lowercase: true, trim: true },

    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    // role: { type: String, enum: Object.values(UserRole), required: true },
    roles: { type: [String], enum: Object.values(UserRole), default: [] },
    activeRole: { type: String, enum: Object.values(UserRole), required: true },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    profilePhoto: { type: String },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLogin: { type: Date },
    // ✅ Move children here so ALL models (Parent, Teacher) can use it
      children: [{ type: Schema.Types.ObjectId, ref: "student" }],
  },
  { timestamps: true, discriminatorKey: "role" }
);

// UserSchema.index({ email: 1 });
// UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ roles: 1, status: 1 });
UserSchema.index({ email: 1 }, { unique: true, sparse: true });


const UserModel: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>("User", UserSchema);

export default UserModel;
