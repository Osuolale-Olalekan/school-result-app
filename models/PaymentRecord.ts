import mongoose, { Schema, Document, Model } from "mongoose";
import { PaymentStatus } from "@/types/enums";

export interface IPaymentRecordDocument extends Document {
  student: mongoose.Types.ObjectId;
  session: mongoose.Types.ObjectId;
  term: mongoose.Types.ObjectId;
  status: PaymentStatus;
  amount?: number;
  markedBy: mongoose.Types.ObjectId;
  markedAt?: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRecordSchema = new Schema<IPaymentRecordDocument>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    term: { type: Schema.Types.ObjectId, ref: "Term", required: true },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.UNPAID },
    amount: { type: Number },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    markedAt: { type: Date },
    note: { type: String },
  },
  { timestamps: true }
);

PaymentRecordSchema.index({ student: 1, session: 1, term: 1 }, { unique: true });
PaymentRecordSchema.index({ status: 1 });

const PaymentRecordModel: Model<IPaymentRecordDocument> =
  mongoose.models.PaymentRecord ??
  mongoose.model<IPaymentRecordDocument>("PaymentRecord", PaymentRecordSchema);

export default PaymentRecordModel;
