import {
  UserRole,
  UserStatus,
  StudentStatus,
  TermName,
  SessionStatus,
  TermStatus,
  ClassLevel,
  Department,
  ReportStatus,
  NotificationType,
  PaymentStatus,
  AuditAction,
} from "./enums";

// ─── Base ────────────────────────────────────────────────────────────────────

export interface BaseDocument {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface IUser extends BaseDocument {
  surname: string;
  firstName: string;
  otherName: string;
  email: string;
  phone?: string;
  // role: UserRole;
  roles: UserRole[];
  activeRole: UserRole;
  status: UserStatus;
  profilePhoto?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
  lastLogin?: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface IAdmin extends IUser {
  roles: UserRole[];
  activeRole: UserRole.ADMIN;
}

// ─── Teacher ──────────────────────────────────────────────────────────────────

export interface ITeacher extends IUser {
  roles: UserRole[];
  activeRole: UserRole.TEACHER;
  employeeId: string;
  qualification?: string;
  assignedClasses: string[]; // ClassAssignment _ids
}

// ─── Student ──────────────────────────────────────────────────────────────────

export interface IStudent extends IUser {
  roles: UserRole[];
  activeRole: UserRole.STUDENT;
  admissionNumber: string;
  admissionDate: string;
  dateOfBirth: string;
  gender: "male" | "female";
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  currentClass: string; // IClass _id
  department: Department;
  studentStatus: StudentStatus;
  parents: string[]; // IParent _ids
}

// ─── Parent ───────────────────────────────────────────────────────────────────

export interface IParent extends IUser {
  roles: UserRole[];
  activeRole: UserRole.PARENT;
  children: string[]; // IStudent _ids
  occupation?: string;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface ITerm extends BaseDocument {
  name: TermName;
  status: TermStatus;
  startDate: string;
  endDate: string;
  resumptionDate?: string;
  sessionId: string;
  schoolDaysOpen?: number;
}

export interface ISession extends BaseDocument {
  name: string; // e.g. "2024/2025"
  status: SessionStatus;
  terms: ITerm[];
  startYear: number;
  endYear: number;
}

// ─── Class ────────────────────────────────────────────────────────────────────

export interface IClass extends BaseDocument {
  name: ClassLevel;
  section: "primary" | "jss" | "sss";
  department: Department;
  capacity?: number;
  classTeacher?: string; // ITeacher _id
  subjects: string[]; // ISubject _ids
}

// ─── Subject ──────────────────────────────────────────────────────────────────

export interface ISubject extends BaseDocument {
  name: string;
  code: string;
  hasPractical: boolean;
  assignedClasses: string[]; // IClass _ids
}

// ─── Class Assignment (Teacher → Classes) ─────────────────────────────────────

export interface IClassAssignment extends BaseDocument {
  teacher: string; // ITeacher _id
  class: string; // IClass _id
  session: string; // ISession _id
  isActive: boolean;
}

// ─── Score / Result ───────────────────────────────────────────────────────────

export interface ISubjectScore {
  subject: string; // ISubject _id
  subjectName: string;
  subjectCode: string;
  testScore: number;
  examScore: number;
  practicalScore?: number;
  totalScore: number;
  grade: string;
  remark: string;
  hasPractical: boolean;
  maxTestScore: number;
  maxExamScore: number;
  maxPracticalScore: number;
  maxTotalScore: number;
}

export interface IAttendance {
  schoolDaysOpen: number;
  daysPresent: number;
  daysAbsent: number;
  attendancePercentage: number;
}

export interface IReportCard extends BaseDocument {
  student: string; // IStudent _id
  studentSnapshot: {
    surname: string;
    firstName: string;
    otherName: string;
    admissionNumber: string;
    profilePhoto?: string;
    gender: "male" | "female";
    dateOfBirth: string;
    department: Department;
  };
  class: string; // IClass _id
  className: string;
  session: string; // ISession _id
  sessionName: string;
  term: string; // ITerm _id
  termName: TermName;
  subjects: ISubjectScore[];
  attendance: IAttendance;
  totalObtainable: number;
  totalObtained: number;
  percentage: number;
  position: number;
  totalStudentsInClass: number;
  grade: string;
  teacherComment?: string;
  principalComment?: string;
  principalSignature?: string;
  status: ReportStatus;
  declineReason?: string;
  submittedBy: string; // ITeacher _id
  submittedAt?: string;
  approvedBy?: string; // IAdmin _id
  approvedAt?: string;
  nextTermResumptionDate?: string;
  isPromoted?: boolean;
  promotedToClass?: string;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  qrCode?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface INotification extends BaseDocument {
  recipient: string; // IUser _id
  recipientRole: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, string | number | boolean>;
  link?: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface IAuditLog extends BaseDocument {
  actor: string; // IUser _id
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  entity: string;
  entityId: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, { before: string | number | boolean | null; after: string | number | boolean | null }>;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface IPaymentRecord extends BaseDocument {
  student: string; // IStudent _id
  session: string; // ISession _id
  term: string; // ITerm _id
  status: PaymentStatus;
  amount?: number;
  markedBy: string; // IAdmin _id
  markedAt?: string;
  note?: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Dashboard Analytics ──────────────────────────────────────────────────────

export interface AdminAnalytics {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  activeStudents: number;
  totalClasses: number;
  pendingReports: number;
  approvedReports: number;
  recentAuditLogs: IAuditLog[];
  studentsByClass: Array<{ className: string; count: number }>;
  studentsByStatus: Array<{ status: string; count: number }>;
  reportsByStatus: Array<{ status: string; count: number }>;
  paymentStats: { paid: number; unpaid: number; partial: number };
}

export interface TeacherAnalytics {
  assignedClasses: number;
  totalStudents: number;
  pendingReports: number;
  submittedReports: number;
  approvedReports: number;
  declinedReports: number;
}
