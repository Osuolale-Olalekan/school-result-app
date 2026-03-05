import mongoose, { Schema, Document, Model } from "mongoose";
import { Department, PaymentStatus, ReportStatus, TermName } from "@/types/enums";

export interface ISubjectScoreDocument {
  subject: mongoose.Types.ObjectId;
  subjectName: string;
  subjectCode: string;
  testScore: number;
  examScore: number;
  practicalScore: number;
  totalScore: number;
  grade: string;
  remark: string;
  hasPractical: boolean;
  maxTestScore: number;
  maxExamScore: number;
  maxPracticalScore: number;
  maxTotalScore: number;
}

export interface IAttendanceDocument {
  schoolDaysOpen: number;
  daysPresent: number;
  daysAbsent: number;
  attendancePercentage: number;
}

export interface IReportCardDocument extends Document {
  student: mongoose.Types.ObjectId;
  studentSnapshot: {
    surname: string;
    firstName: string;
    otherName: string;
    admissionNumber: string;
    profilePhoto?: string;
    gender: "male" | "female";
    dateOfBirth: Date;
    department: Department;
  };
  class: mongoose.Types.ObjectId;
  className: string;
  session: mongoose.Types.ObjectId;
  sessionName: string;
  term: mongoose.Types.ObjectId;
  termName: TermName;
  subjects: ISubjectScoreDocument[];
  attendance: IAttendanceDocument;
  totalObtainable: number;
  totalObtained: number;
  percentage: number;
  position: number;
  totalStudentsInClass: number;
  grade: string;
  teacherComment?: string;
  principalComment?: string;
  status: ReportStatus;
  declineReason?: string;
  submittedBy: mongoose.Types.ObjectId;
  submittedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  nextTermResumptionDate?: Date;
  isPromoted?: boolean;
  promotedToClass?: string;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  markedPaidBy?: mongoose.Types.ObjectId;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
  principalSignature?:string;
}

const SubjectScoreSchema = new Schema<ISubjectScoreDocument>(
  {
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    subjectName: { type: String, required: true },
    subjectCode: { type: String, required: true },
    testScore: { type: Number, required: true, min: 0 },
    examScore: { type: Number, required: true, min: 0, },
    practicalScore: { type: Number, default: 0, min: 0 },
    totalScore: { type: Number, required: true },
    grade: { type: String, required: true },
    remark: { type: String, required: true },
    hasPractical: { type: Boolean, default: false },
    maxTestScore: { type: Number, default: 30 },
    maxExamScore: { type: Number, default: 70 },
    maxPracticalScore: { type: Number, default: 0 },
    maxTotalScore: { type: Number, default: 100 },
  },
  { _id: false }
);

const AttendanceSchema = new Schema<IAttendanceDocument>(
  {
    schoolDaysOpen: { type: Number, default: 0 },
    daysPresent: { type: Number, default: 0 },
    daysAbsent: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 },
  },
  { _id: false }
);

const ReportCardSchema = new Schema<IReportCardDocument>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentSnapshot: {
      surname: { type: String, required: true },
      firstName: { type: String, required: true },
      otherName: { type: String, required: true },
      admissionNumber: { type: String, required: true },
      profilePhoto: { type: String },
      gender: { type: String, enum: ["male", "female"], required: true },
      dateOfBirth: { type: Date, required: true },
      department: { type: String, enum: Object.values(Department), default: Department.NONE },
    },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    className: { type: String, required: true },
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    sessionName: { type: String, required: true },
    term: { type: Schema.Types.ObjectId, ref: "Term", required: true },
    termName: { type: String, enum: Object.values(TermName), required: true },
    subjects: [SubjectScoreSchema],
    attendance: AttendanceSchema,
    totalObtainable: { type: Number, required: true },
    totalObtained: { type: Number, required: true },
    percentage: { type: Number, required: true },
    position: { type: Number, default: 0 },
    totalStudentsInClass: { type: Number, default: 0 },
    grade: { type: String, required: true },
    teacherComment: { type: String },
    principalComment: { type: String },
    principalSignature: { type: String },
    status: { type: String, enum: Object.values(ReportStatus), default: ReportStatus.DRAFT },
    declineReason: { type: String },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    nextTermResumptionDate: { type: Date },
    isPromoted: { type: Boolean },
    promotedToClass: { type: String },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.UNPAID },
    paidAt: { type: Date },
    markedPaidBy: { type: Schema.Types.ObjectId, ref: "User" },
    qrCode: { type: String },
  },
  { timestamps: true }
);

ReportCardSchema.index({ student: 1, session: 1, term: 1 }, { unique: true });
ReportCardSchema.index({ class: 1, session: 1, term: 1 });
ReportCardSchema.index({ status: 1 });
ReportCardSchema.index({ submittedBy: 1, status: 1 });
ReportCardSchema.index({ paymentStatus: 1 });

const ReportCardModel: Model<IReportCardDocument> =
  mongoose.models.ReportCard ??
  mongoose.model<IReportCardDocument>("ReportCard", ReportCardSchema);

export default ReportCardModel;
