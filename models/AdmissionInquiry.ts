import mongoose, { Schema, Document, Model } from "mongoose";

export enum AdmissionInquiryStatus {
  PENDING = "pending",
  CONTACTED = "contacted",
  ENROLLED = "enrolled",
  DECLINED = "declined",
}

export interface IAdmissionInquiryDocument extends Document {
  parentName: string;
  phone: string;
  email?: string;
  childName: string;
  classApplying: string;
  message?: string;
  status: AdmissionInquiryStatus;
  whatsappNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionInquirySchema = new Schema<IAdmissionInquiryDocument>(
  {
    parentName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    childName: { type: String, required: true, trim: true },
    classApplying: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(AdmissionInquiryStatus),
      default: AdmissionInquiryStatus.PENDING,
    },
    whatsappNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AdmissionInquirySchema.index({ status: 1, createdAt: -1 });

const AdmissionInquiryModel: Model<IAdmissionInquiryDocument> =
  mongoose.models.AdmissionInquiry ??
  mongoose.model<IAdmissionInquiryDocument>("AdmissionInquiry", AdmissionInquirySchema);

export default AdmissionInquiryModel;
