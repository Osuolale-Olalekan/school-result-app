export enum UserRole {
  ADMIN = "admin",
  TEACHER = "teacher",
  STUDENT = "student",
  PARENT = "parent",
}

export const hasRole = (roles: UserRole[], role: UserRole) => {
  return roles.includes(role);
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export enum StudentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  GRADUATED = "graduated",
}

export enum TermName {
  FIRST = "first",
  SECOND = "second",
  THIRD = "third",
}

export enum SessionStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  COMPLETED = "completed",
}

export enum TermStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  COMPLETED = "completed",
}

export enum ClassLevel {
  PRIMARY_2 = "Primary 2",
  PRIMARY_3 = "Primary 3",
  PRIMARY_4 = "Primary 4",
  PRIMARY_5 = "Primary 5",
  JSS_1 = "JSS 1",
  JSS_2 = "JSS 2",
  JSS_3 = "JSS 3",
  SSS_1 = "SSS 1",
  SSS_2 = "SSS 2",
}

export enum Department {
  NONE = "none",
  SCIENCE = "science",
  ART = "art",
  COMMERCIAL = "commercial",
}

export enum ReportStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  APPROVED = "approved",
  DECLINED = "declined",
}

export enum NotificationType {
  REPORT_SUBMITTED = "report_submitted",
  REPORT_APPROVED = "report_approved",
  REPORT_DECLINED = "report_declined",
  REPORT_AVAILABLE = "report_available",
  ACCOUNT_CREATED = "account_created",
  RESULT_AVAILABLE = "result_available",
  ANNOUNCEMENT = "announcement",  // ← new
  GENERAL = "general",
}

export enum PaymentStatus {
  PAID = "paid",
  UNPAID = "unpaid",
  PARTIAL = "partial",
}

export enum AuditAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LOGIN = "login",
  LOGOUT = "logout",
  APPROVE = "approve",
  DECLINE = "decline",
  PROMOTE = "promote",
  ACTIVATE = "activate",
  DEACTIVATE = "deactivate",
  SUSPEND = "suspend",
  PAYMENT_UPDATE = "payment_update",
  PASSWORD_RESET = "password_reset",
}

// ─── Announcement ─────────────────────────────────────────────────────────────

export enum AnnouncementAudience {
  ALL = "all",           // every user in the school
  ROLE = "role",         // filter by one or more roles
  CLASS = "class",       // filter by one or more classes
}

export enum AnnouncementPriority {
  NORMAL = "normal",
  URGENT = "urgent",
}

export enum AnnouncementStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}
// export enum UserRole {
//   ADMIN = "admin",
//   TEACHER = "teacher",
//   STUDENT = "student",
//   PARENT = "parent",
// }

// export const hasRole = (roles: UserRole[], role: UserRole) => {
//   return roles.includes(role);
// }

// export enum UserStatus {
//   ACTIVE = "active",
//   INACTIVE = "inactive",
//   SUSPENDED = "suspended",
// }

// export enum StudentStatus {
//   ACTIVE = "active",
//   INACTIVE = "inactive",
//   SUSPENDED = "suspended",
//   GRADUATED = "graduated",
// }

// export enum TermName {
//   FIRST = "first",
//   SECOND = "second",
//   THIRD = "third",
// }

// export enum SessionStatus {
//   UPCOMING = "upcoming",
//   ACTIVE = "active",
//   COMPLETED = "completed",
// }

// export enum TermStatus {
//   UPCOMING = "upcoming",
//   ACTIVE = "active",
//   COMPLETED = "completed",
// }

// export enum ClassLevel {
//   // PRIMARY_1 = "Primary 1",
//   PRIMARY_2 = "Primary 2",
//   PRIMARY_3 = "Primary 3",
//   PRIMARY_4 = "Primary 4",
//   PRIMARY_5 = "Primary 5",
//   JSS_1 = "JSS 1",
//   JSS_2 = "JSS 2",
//   JSS_3 = "JSS 3",
//   SSS_1 = "SSS 1",
//   SSS_2 = "SSS 2",
//   // SSS_3 = "SSS 3",
// }

// export enum Department {
//   NONE = "none",
//   SCIENCE = "science",
//   ART = "art",
//   COMMERCIAL = "commercial",
// }

// export enum ReportStatus {
//   DRAFT = "draft",
//   SUBMITTED = "submitted",
//   APPROVED = "approved",
//   DECLINED = "declined",
// }

// export enum NotificationType {
//   REPORT_SUBMITTED = "report_submitted",
//   REPORT_APPROVED = "report_approved",
//   REPORT_DECLINED = "report_declined",
//   REPORT_AVAILABLE = "report_available",
//   ACCOUNT_CREATED = "account_created",
//   RESULT_AVAILABLE = "result_available",
//   GENERAL = "general",
// }

// export enum PaymentStatus {
//   PAID = "paid",
//   UNPAID = "unpaid",
//   PARTIAL = "partial",
// }

// export enum AuditAction {
//   CREATE = "create",
//   UPDATE = "update",
//   DELETE = "delete",
//   LOGIN = "login",
//   LOGOUT = "logout",
//   APPROVE = "approve",
//   DECLINE = "decline",
//   PROMOTE = "promote",
//   ACTIVATE = "activate",
//   DEACTIVATE = "deactivate",
//   SUSPEND = "suspend",
//   PAYMENT_UPDATE = "payment_update",
//   PASSWORD_RESET = "password_reset",
// }
