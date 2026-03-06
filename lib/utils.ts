import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function generateAdmissionNumber(year: number, sequence: number): string {
  const yearStr = year.toString().slice(-2);
  const seq = sequence.toString().padStart(4, "0");
  return `GWS/${yearStr}/${seq}`;
}

export function generateEmployeeId(sequence: number): string {
  const seq = sequence.toString().padStart(4, "0");
  return `GWT/${seq}`;
}

export function calculateGrade(percentage: number): { grade: string; remark: string } {
  if (percentage >= 70) return { grade: "A", remark: "Excellent" };
  if (percentage >= 60) return { grade: "B", remark: "Very Good" };
  if (percentage >= 50) return { grade: "C", remark: "Good" };
  if (percentage >= 45) return { grade: "D", remark: "Pass" };
  if (percentage >= 40) return { grade: "E", remark: "Fair" };
  return { grade: "F", remark: "Fail" };
}

export function calculateSubjectGrade(score: number, maxScore: number): { grade: string; remark: string } {
  const pct = (score / maxScore) * 100;
  return calculateGrade(pct);
}

export function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// export function getInitials(surname: string, firstName: string, otherName: string): string {
//   return `${surname.charAt(0)}${firstName.charAt(0)}${otherName.charAt(0)}`.toUpperCase();
// }
export function getInitials(surname?: string, firstName?: string, otherName?: string): string {
  return [surname, firstName, otherName]
    .filter(Boolean)
    .map(name => name!.charAt(0))
    .join('')
    .toUpperCase();
}

export function isPassMark(percentage: number): boolean {
  return percentage >= 50;
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "..." : str;
}


// ── Sanitization ──────────────────────────────────────────────────────────────

export function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function sanitizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

export function sanitizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[^\d+\-\s()]/g, "");
}

export function sanitizeOptional(value: unknown): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}