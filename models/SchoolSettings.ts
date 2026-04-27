import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISchoolSettingsDocument extends Document {
  principalSignature?: string;
  schoolStamp?: string;
  updatedAt: Date;
  createdAt: Date;
}

const SchoolSettingsSchema = new Schema<ISchoolSettingsDocument>(
  {
    principalSignature: { type: String },
    schoolStamp: { type: String },
  },
  { timestamps: true }
);

const SchoolSettingsModel: Model<ISchoolSettingsDocument> =
  mongoose.models.SchoolSettings ??
  mongoose.model<ISchoolSettingsDocument>("SchoolSettings", SchoolSettingsSchema);

export default SchoolSettingsModel;