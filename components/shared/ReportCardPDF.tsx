"use client";

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import type { IReportCard, ISubjectScore } from "@/types";
import { TermName } from "@/types/enums";
import { formatDate, getOrdinal } from "@/lib/utils";

export interface ReportCardPDFProps {
  report: IReportCard & {
    sessionName: string;
    termName: TermName;
    className: string;
    principalSignature?: string | null;
    schoolStamp?: string | null;
    totalStudentsInDept?: number; // <-- ADDED: may not exist on older reports
    overallPosition?: number; // <-- ADDED: may not exist on older reports
  };
}

const SCHOOL_LOGO_URL =
  "https://res.cloudinary.com/disxrmlco/image/upload/v1771881211/android-chrome-512x512_mc7kty.png";

const NAVY      = "#1e3a5f";
const DARK_NAVY = "#0a1628";
const GOLD      = "#f59e0b";
const LIGHT_BG  = "#f8fafc";
const BORDER    = "#e2e8f0";
const STRIPE    = "#fafbfc";
const TH_BG     = "#f0f4f8";
const MUTED     = "#6b7280";
const RED       = "#dc2626";

const TWO_PAGE_THRESHOLD = 24;

// ─── helpers ─────────────────────────────────────────────────────
function gradeBg(g: string) {
  if (g === "A") return "#d1fae5";
  if (g === "B") return "#dbeafe";
  if (g === "F") return "#fee2e2";
  return "#fef3c7";
}
function gradeColor(g: string) {
  if (g === "A") return "#065f46";
  if (g === "B") return "#1e40af";
  if (g === "F") return "#991b1b";
  return "#92400e";
}

// Returns the correct denominator for position display.
// For SS students with a department, uses totalStudentsInDept.
// For Primary/JSS (department === "none" or missing), falls back to totalStudentsInClass.
// function resolvePositionDenominator(report: ReportCardPDFProps["report"]): number {
//   const dept = report.studentSnapshot?.department;
//   const hasDept = dept && dept !== "none";
//   const deptCount = report.totalStudentsInDept;

//   if (hasDept && deptCount && deptCount > 0 && deptCount !== report.totalStudentsInClass) {
//     return deptCount;
//   }
//   return report.totalStudentsInClass;
// }

// Returns the label shown below the position (e.g. "in dept" vs "in class")
// function resolvePositionLabel(report: ReportCardPDFProps["report"]): string {
//   const dept = report.studentSnapshot?.department;
//   const hasDept = dept && dept !== "none";
//   const deptCount = report.totalStudentsInDept;

//   if (hasDept && deptCount && deptCount > 0 && deptCount !== report.totalStudentsInClass) {
//     return "in dept";
//   }
//   return "students";
// }

async function toBase64(url: string): Promise<string> {
  try {
    const res  = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror   = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

// ─── styles ──────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    width: 595.28,
    minHeight: 841.89,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111111",
    flexDirection: "column",
  },

  // ── header
  header: {
    backgroundColor: NAVY,
    padding: "10 20 0 20",
    flexDirection: "column",
    position: "relative",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLogo:            { width: 60, height: 60, borderRadius: 6 },
  headerLogoPlaceholder: { width: 60, height: 60, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.1)" },
  headerCenter:          { flex: 1, alignItems: "center", paddingHorizontal: 12 },
  headerSchoolName: {
    fontSize: 13, fontFamily: "Helvetica-Bold", color: "#ffffff",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2, textAlign: "center",
  },
  headerMotto: {
    fontSize: 7, color: "rgba(255,255,255,0.55)", letterSpacing: 1.5, marginBottom: 3, textAlign: "center",
  },
  headerContact: { fontSize: 7.5, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 1.6 },
  headerQrBox:   { backgroundColor: "#ffffff", padding: 4, borderRadius: 5, alignItems: "center" },
  headerQrImg:   { width: 56, height: 56 },
  headerQrLabel: { fontSize: 6, color: "#555555", marginTop: 2, textAlign: "center" },
  headerQrPlaceholder: {
    width: 64, height: 64, borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center",
  },
  headerContinueBadge: {
    width: 64, height: 64, borderRadius: 5,
    backgroundColor: "rgba(245,158,11,0.12)", border: "1 solid rgba(245,158,11,0.3)",
    justifyContent: "center", alignItems: "center",
  },
  titleBar: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    marginTop: 7, marginBottom: 6, paddingVertical: 4, paddingHorizontal: 14,
    backgroundColor: "rgba(245,158,11,0.15)", borderRadius: 5,
    border: "1 solid rgba(245,158,11,0.3)", alignSelf: "center",
  },
  titleBarText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: GOLD, letterSpacing: 0.4 },
  titleBarSep:  { fontSize: 8, color: "rgba(255,255,255,0.4)", marginHorizontal: 6 },
  titleBarSub:  { fontSize: 8, color: "rgba(255,255,255,0.65)" },

  // ── student strip
  studentStrip: {
    flexDirection: "row", padding: "8 20",
    borderBottom: `2 solid ${BORDER}`, alignItems: "stretch", gap: 10,
  },
  studentPhoto: { width: 62, height: 62, borderRadius: 7, border: `2 solid ${NAVY}`, objectFit: "cover" },
  studentAvatar: {
    width: 62, height: 62, borderRadius: 7, border: `2 solid ${NAVY}`,
    backgroundColor: "#e8eff7", justifyContent: "center", alignItems: "center",
  },
  studentAvatarText: { fontSize: 18, fontFamily: "Helvetica-Bold", color: NAVY },
  studentInfoGrid:   { flex: 1, flexDirection: "row", flexWrap: "wrap" },
  studentInfoCell:   { width: "50%", paddingVertical: 1, paddingRight: 8 },
  studentInfoLabel:  { fontSize: 7, color: MUTED, textTransform: "uppercase", letterSpacing: 0.4, lineHeight: 1.3 },
  studentInfoValue:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111111", lineHeight: 1.3 },
  perfBox: {
    backgroundColor: NAVY, borderRadius: 7, padding: "8 12",
    alignItems: "center", justifyContent: "center", minWidth: 88,
  },
  perfScore:   { fontSize: 24, fontFamily: "Helvetica-Bold", color: GOLD, lineHeight: 1, marginBottom: 1 },
  perfLabel:   { fontSize: 7, color: "rgba(255,255,255,0.5)", lineHeight: 1.3 },
  perfGrade:   { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff", lineHeight: 1.2, marginBottom: 1 },
  perfDivider: { width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 4 },
  perfPosition: { fontSize: 9, color: GOLD, fontFamily: "Helvetica-Bold" },
  perfPosSub:   { fontSize: 7, color: "rgba(255,255,255,0.5)" },

  // ── table — column widths must sum to 100%
  tableSection:   { paddingHorizontal: 20 },
  tableTitle: {
    fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY,
    paddingTop: 6, paddingBottom: 4, borderBottom: `2 solid ${NAVY}`, letterSpacing: 0.4,
  },
  tableHeaderRow: { flexDirection: "row", backgroundColor: TH_BG },
  tableRow:       { flexDirection: "row" },
  tableFooterRow: { flexDirection: "row", backgroundColor: NAVY },

  colSubject: { width: "30%" },
  colTest:    { width: "10%" },
  colExam:    { width: "10%" },
  colPrac:    { width: "10%" },
  colTotal:   { width: "14%" },
  colGrade:   { width: "10%" },
  colRemark:  { width: "16%" },

  // base styles — alignment set per-cell via inline overrides
  thCell: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#374151",
    paddingVertical: 4, paddingHorizontal: 3, borderBottom: `1 solid ${BORDER}`,
  },
  thSub:  { fontSize: 6.5, color: MUTED, fontFamily: "Helvetica" },
  tdCell: {
    fontSize: 9, color: "#111111",
    paddingVertical: 3, paddingHorizontal: 3, borderBottom: `1 solid #f0f4f8`,
  },
  gradeBadge: { borderRadius: 3, paddingVertical: 1, paddingHorizontal: 4 },
  tfCell: {
    fontSize: 9, fontFamily: "Helvetica-Bold",
    color: "#ffffff", paddingVertical: 5, paddingHorizontal: 3,
  },

  // ── grade scale
  gradeScaleRow: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 3,
    padding: "4 8", backgroundColor: LIGHT_BG, borderRadius: 5,
    border: `1 solid ${BORDER}`, marginHorizontal: 20, marginVertical: 4,
  },
  gradeScaleLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: MUTED, marginRight: 3 },
  gradeScaleBadge: { borderRadius: 3, paddingVertical: 1, paddingHorizontal: 5 },

  // ── attendance + comments
  attCommRow: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 8, gap: 10 },
  attBox: {
    flex: 1, backgroundColor: LIGHT_BG, borderRadius: 7,
    border: `1 solid ${BORDER}`, overflow: "hidden",
  },
  attInner:      { padding: "7 11" },
  attTitle: {
    fontSize: 8.5, fontFamily: "Helvetica-Bold", color: NAVY,
    textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4,
  },
  attRow:        { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, borderBottom: `1 solid #e8edf2` },
  attRowLabel:   { fontSize: 8.5, color: MUTED },
  attRowValue:   { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#111" },
  attFooter:     { flexDirection: "row", justifyContent: "space-between", backgroundColor: NAVY, padding: "4 11" },
  attFooterLabel: { fontSize: 8.5, color: "rgba(255,255,255,0.75)" },
  attFooterValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: GOLD },
  commentsCol:   { flex: 1, flexDirection: "column", gap: 6 },
  commentBox: {
    flex: 1, backgroundColor: LIGHT_BG, borderRadius: 7,
    border: `1 solid ${BORDER}`, padding: "7 11",
  },
  commentTitle: {
    fontSize: 8.5, fontFamily: "Helvetica-Bold", color: NAVY,
    textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3,
  },
  commentText: { fontSize: 9, color: "#374151", fontStyle: "italic", lineHeight: 1.5 },

  // ── promotion banner
  promotionWrap: { paddingHorizontal: 20, paddingBottom: 7 },
  promotionBox:  { flexDirection: "row", alignItems: "center", borderRadius: 7, padding: "7 12", gap: 7 },
  promotionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", lineHeight: 1.3 },
  promotionSub:   { fontSize: 8.5, lineHeight: 1.3, marginTop: 1 },

  // ── resumption date
  resumptionWrap: { paddingHorizontal: 20, paddingBottom: 7 },
  resumptionBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fffbeb", border: `1 solid #fde68a`, borderRadius: 5, padding: "5 11", gap: 6,
  },
  resumptionLabel: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#78350f", textTransform: "uppercase" },
  resumptionValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#92400e", marginLeft: 6 },

  // ── page 2 banner
  page2Banner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: TH_BG, borderBottom: `1 solid ${BORDER}`, padding: "5 20",
  },
  page2BannerName:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: NAVY },
  page2BannerMuted: { fontSize: 8.5, color: MUTED },
  page2BannerRight: { fontSize: 8.5, color: MUTED, fontStyle: "italic" },

  // ── footer
  footer: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: DARK_NAVY, padding: "7 20",
  },
  footerDate:     { fontSize: 7.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 },
  footerID:       { fontSize: 7.5, color: "rgba(255,255,255,0.3)", marginTop: 1, lineHeight: 1.4 },
  footerRight:    { alignItems: "flex-end" },
  footerSigImg:   { height: 40, objectFit: "contain", marginBottom: 2 },
  footerSigLine:  { width: 80, height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 3 },
  footerSigLabel: { fontSize: 7.5, color: "rgba(255,255,255,0.4)" },
});

// ─── PageHeader ───────────────────────────────────────────────────
function PageHeader({ showQR, qrDataUrl, logoBase64, report }: {
  showQR: boolean;
  qrDataUrl: string | null;
  logoBase64: string;
  report: ReportCardPDFProps["report"];
}) {
  return (
    <View style={S.header}>
      <View style={S.headerTop}>
        {logoBase64
          ? <Image src={logoBase64} style={S.headerLogo} />
          : <View style={S.headerLogoPlaceholder} />}

        <View style={S.headerCenter}>
          <Text style={S.headerSchoolName}>God's Way Model Groups of Schools</Text>
          <Text style={S.headerMotto}>SOWING THE SEED OF MERIT AND EXCELLENCE</Text>
          <Text style={S.headerContact}>
            No 12 Siyanbola Street, Osogbo, Osun State{"\n"}
            08069825847, 08067110930  |  godswaygroupofschools@gmail.com
          </Text>
        </View>

        {showQR ? (
          qrDataUrl ? (
            <View style={S.headerQrBox}>
              <Image src={qrDataUrl} style={S.headerQrImg} />
              <Text style={S.headerQrLabel}>Verify Report</Text>
            </View>
          ) : (
            <View style={S.headerQrPlaceholder}>
              <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>QR Code</Text>
            </View>
          )
        ) : (
          <View style={S.headerContinueBadge}>
            <Text style={{ fontSize: 8, color: GOLD, fontFamily: "Helvetica-Bold", textAlign: "center" }}>
              PAGE 2{"\n"}CONT.
            </Text>
          </View>
        )}
      </View>

      <View style={S.titleBar}>
        <Text style={S.titleBarText}>STUDENT REPORT CARD</Text>
        <Text style={S.titleBarSep}>·</Text>
        <Text style={S.titleBarSub}>
          {report.termName.toUpperCase()} TERM · {report.sessionName} SESSION
        </Text>
      </View>
    </View>
  );
}

// ─── StudentInfoStrip ─────────────────────────────────────────────
function StudentInfoStrip({ report, profilePhotoBase64, avgScore }: {
  report: ReportCardPDFProps["report"];
  profilePhotoBase64: string;
  avgScore: string;
}) {
  const fields = [
    { label: "Student Name",     value: `${report.studentSnapshot.surname} ${report.studentSnapshot.firstName} ${report.studentSnapshot.otherName}` },
    { label: "Admission No.",    value: report.studentSnapshot.admissionNumber },
    { label: "Class",            value: report.className },
    { label: "Academic Session", value: report.sessionName },
    { label: "Term",             value: `${report.termName.toUpperCase()} TERM` },
    { label: "Date of Birth",    value: formatDate(report.studentSnapshot.dateOfBirth) },
    { label: "Gender",           value: report.studentSnapshot.gender.charAt(0).toUpperCase() + report.studentSnapshot.gender.slice(1) },
    { label: "Department",       value: report.studentSnapshot.department !== "none" ? report.studentSnapshot.department.toUpperCase() : "N/A" },
  ];

  const initials =
    report.studentSnapshot.surname.charAt(0) +
    report.studentSnapshot.firstName.charAt(0) +
    report.studentSnapshot.otherName.charAt(0);

  // ── Resolve position denominator and label ──────────────────────
  // SS students: show position out of department count (e.g. 2/16)
  // Primary/JSS: show position out of class count (e.g. 3/25) — same as before
  // const positionDenominator = resolvePositionDenominator(report);
  // const positionLabel       = resolvePositionLabel(report);
  const hasDeptRanking =
  (report.totalStudentsInDept ?? 0) > 0 &&
  report.totalStudentsInDept !== report.totalStudentsInClass;

const deptLabel = report.studentSnapshot.department !== "none"
  ? report.studentSnapshot.department.toUpperCase()
  : "DEPT";
  // ────────────────────────────────────────────────────────────────

  return (
    <View style={S.studentStrip}>
      {profilePhotoBase64
        ? <Image src={profilePhotoBase64} style={S.studentPhoto} />
        : <View style={S.studentAvatar}><Text style={S.studentAvatarText}>{initials}</Text></View>}

      <View style={S.studentInfoGrid}>
        {fields.map(({ label, value }) => (
          <View key={label} style={S.studentInfoCell}>
            <Text style={S.studentInfoLabel}>{label}</Text>
            <Text style={S.studentInfoValue}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={S.perfBox}>
  <Text style={S.perfScore}>{avgScore}%</Text>
  <Text style={S.perfLabel}>Overall Score</Text>
  <Text style={S.perfGrade}>{report.grade}</Text>
  <Text style={S.perfLabel}>Grade</Text>
  <View style={S.perfDivider} />

  {hasDeptRanking ? (
    // ── Two rows: dept position + overall position ──────────────
    <>
      {/* Dept position */}
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "center" }}>
        <Text style={S.perfPosition}>{getOrdinal(report.position)}</Text>
        <Text style={S.perfPosSub}> / {report.totalStudentsInDept}</Text>
      </View>
      <Text style={[S.perfPosSub, { marginTop: 1 }]}>{deptLabel} DEPT.</Text>

      {/* Thin separator */}
      <View style={{ width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 3 }} />

      {/* Overall position */}
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "center" }}>
        <Text style={[S.perfPosition, { fontSize: 8, color: "rgba(255,255,255,0.75)" }]}>
          {getOrdinal((report as unknown as { overallPosition?: number }).overallPosition ?? report.position)}
        </Text>
        <Text style={[S.perfPosSub, { color: "rgba(255,255,255,0.4)" }]}>
          {" "}/ {report.totalStudentsInClass}
        </Text>
      </View>
      <Text style={[S.perfPosSub, { marginTop: 1, color: "rgba(255,255,255,0.3)" }]}>OVERALL STUDENTS</Text>
    </>
  ) : (
    // ── Single row: overall only (Primary / JSS) ───────────────
    <>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "center" }}>
        <Text style={S.perfPosition}>{getOrdinal(report.position)}</Text>
        <Text style={S.perfPosSub}> / {report.totalStudentsInClass}</Text>
      </View>
      <Text style={[S.perfPosSub, { marginTop: 1 }]}>students</Text>
    </>
  )}
</View>
    </View>
  );
}

// ─── SubjectsTable ────────────────────────────────────────────────
function SubjectsTable({ report }: { report: ReportCardPDFProps["report"] }) {
  return (
    <View style={S.tableSection}>
      <Text style={S.tableTitle}>ACADEMIC PERFORMANCE</Text>

      {/* Header row */}
      <View style={S.tableHeaderRow}>
        {/* SUBJECT — left aligned */}
        <View style={[S.colSubject, S.thCell, { alignItems: "flex-start", paddingLeft: 6 }]}>
          <Text style={{ textAlign: "left" }}>SUBJECT</Text>
        </View>
        {/* TEST */}
        <View style={[S.colTest, S.thCell, { alignItems: "center" }]}>
          <Text style={{ textAlign: "center" }}>TEST</Text>
          <Text style={[S.thSub, { textAlign: "center" }]}>(20/30)</Text>
        </View>
        {/* EXAM */}
        <View style={[S.colExam, S.thCell, { alignItems: "center" }]}>
          <Text style={{ textAlign: "center" }}>EXAM</Text>
          <Text style={[S.thSub, { textAlign: "center" }]}>(60/70)</Text>
        </View>
        {/* PRAC */}
        <View style={[S.colPrac, S.thCell, { alignItems: "center" }]}>
          <Text style={{ textAlign: "center" }}>PRAC.</Text>
          <Text style={[S.thSub, { textAlign: "center" }]}>(20)</Text>
        </View>
        {/* TOTAL */}
        <View style={[S.colTotal, S.thCell, { alignItems: "center" }]}>
          <Text style={{ textAlign: "center" }}>TOTAL</Text>
        </View>
        {/* GRADE */}
        <View style={[S.colGrade, S.thCell, { alignItems: "center" }]}>
          <Text style={{ textAlign: "center" }}>GRADE</Text>
        </View>
        {/* REMARK */}
        <View style={[S.colRemark, S.thCell, { alignItems: "center" }]}>
          <Text style={{ textAlign: "center" }}>REMARK</Text>
        </View>
      </View>

      {/* Body rows */}
      {report.subjects.map((subject: ISubjectScore, i: number) => (
        <View
          key={subject.subject}
          style={[S.tableRow, { backgroundColor: i % 2 === 0 ? "#ffffff" : STRIPE }]}
        >
          {/* Subject — left */}
          <View style={[S.colSubject, S.tdCell, { alignItems: "flex-start", paddingLeft: 6 }]}>
            <Text>{subject.subjectName}</Text>
          </View>
          {/* Test — center */}
          <View style={[S.colTest, S.tdCell, { alignItems: "center" }]}>
            <Text style={{ textAlign: "center" }}>{subject.testScore}</Text>
          </View>
          {/* Exam — center */}
          <View style={[S.colExam, S.tdCell, { alignItems: "center" }]}>
            <Text style={{ textAlign: "center" }}>{subject.examScore}</Text>
          </View>
          {/* Practical — center */}
          <View style={[S.colPrac, S.tdCell, { alignItems: "center" }]}>
            <Text style={{ textAlign: "center", color: subject.hasPractical ? "#111" : "#cccccc" }}>
              {subject.hasPractical ? subject.practicalScore : "—"}
            </Text>
          </View>
          {/* Total — center, bold */}
          <View style={[S.colTotal, S.tdCell, { alignItems: "center" }]}>
            <Text style={{
              textAlign: "center", fontFamily: "Helvetica-Bold",
              color: subject.totalScore < subject.maxTotalScore * 0.5 ? RED : NAVY,
            }}>
              {subject.totalScore}/{subject.maxTotalScore}
            </Text>
          </View>
          {/* Grade badge — center */}
          <View style={[S.colGrade, S.tdCell, { alignItems: "center" }]}>
            <View style={[S.gradeBadge, { backgroundColor: gradeBg(subject.grade) }]}>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: gradeColor(subject.grade) }}>
                {subject.grade}
              </Text>
            </View>
          </View>
          {/* Remark — center */}
          <View style={[S.colRemark, S.tdCell, { alignItems: "center" }]}>
            <Text style={{ textAlign: "center", color: MUTED, fontSize: 8.5 }}>{subject.remark}</Text>
          </View>
        </View>
      ))}

      {/* Footer row — one cell per column (no colSpan in react-pdf) */}
      <View style={S.tableFooterRow}>
        {/* col: SUBJECT — "TOTAL" label */}
        <View style={[S.colSubject, S.tfCell, { alignItems: "flex-start", paddingLeft: 6 }]}>
          <Text>TOTAL</Text>
        </View>
        {/* col: TEST — empty */}
        <View style={[S.colTest, S.tfCell]} />
        {/* col: EXAM — empty */}
        <View style={[S.colExam, S.tfCell]} />
        {/* col: PRAC — empty */}
        <View style={[S.colPrac, S.tfCell]} />
        {/* col: TOTAL — score */}
        <View style={[S.colTotal, S.tfCell, { alignItems: "center" }]}>
          <Text style={{ textAlign: "center", color: GOLD, fontSize: 10, fontFamily: "Helvetica-Bold" }}>
            {report.totalObtained}/{report.totalObtainable}
          </Text>
        </View>
        {/* col: GRADE — grade letter */}
        <View style={[S.colGrade, S.tfCell, { alignItems: "center" }]}>
          <Text style={{ textAlign: "center", color: GOLD, fontSize: 10, fontFamily: "Helvetica-Bold" }}>
            {report.grade}
          </Text>
        </View>
        {/* col: REMARK — percentage */}
        <View style={[S.colRemark, S.tfCell, { alignItems: "center" }]}>
          <Text style={{ textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 9 }}>
            {report.percentage.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── GradeScale ───────────────────────────────────────────────────
function GradeScale() {
  const grades = [
    { grade: "A", range: "70–100%", bg: "#d1fae5", text: "#065f46" },
    { grade: "B", range: "60–69%",  bg: "#dbeafe", text: "#1e40af" },
    { grade: "C", range: "50–59%",  bg: "#fef3c7", text: "#92400e" },
    { grade: "D", range: "49–45%",  bg: "#f3f4f6", text: "#374151" },
    { grade: "E", range: "44–40%",  bg: "#fde68a", text: "#78350f" },
    { grade: "F", range: "0–39%",   bg: "#fee2e2", text: "#991b1b" },
  ];
  return (
    <View style={S.gradeScaleRow}>
      <Text style={S.gradeScaleLabel}>Grade Scale:</Text>
      {grades.map((g) => (
        <View key={g.grade} style={[S.gradeScaleBadge, { backgroundColor: g.bg }]}>
          <Text style={{ color: g.text, fontSize: 7.5, fontFamily: "Helvetica-Bold" }}>
            {g.grade}: {g.range}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── AttendanceAndComments ────────────────────────────────────────
function AttendanceAndComments({ report }: { report: ReportCardPDFProps["report"] }) {
  return (
    <View style={S.attCommRow}>
      <View style={S.attBox}>
        <View style={S.attInner}>
          <Text style={S.attTitle}>Attendance Record</Text>
          {[
            { label: "School Days Open", value: report.attendance.schoolDaysOpen },
            { label: "Days Present",     value: report.attendance.daysPresent },
            { label: "Days Absent",      value: report.attendance.daysAbsent },
          ].map(({ label, value }) => (
            <View key={label} style={S.attRow}>
              <Text style={S.attRowLabel}>{label}:</Text>
              <Text style={S.attRowValue}>{value}</Text>
            </View>
          ))}
        </View>
        <View style={S.attFooter}>
          <Text style={S.attFooterLabel}>Attendance Rate:</Text>
          <Text style={S.attFooterValue}>{report.attendance.attendancePercentage.toFixed(0)}%</Text>
        </View>
      </View>

      <View style={S.commentsCol}>
        <View style={S.commentBox}>
          <Text style={S.commentTitle}>Class Teacher's Comment</Text>
          <Text style={S.commentText}>{report.teacherComment ?? "No comment provided."}</Text>
        </View>
        <View style={S.commentBox}>
          <Text style={S.commentTitle}>Proprietress's Comment</Text>
          <Text style={S.commentText}>{report.principalComment ?? "Keep up the good work!"}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── PromotionBanner ──────────────────────────────────────────────
function PromotionBanner({ report }: { report: ReportCardPDFProps["report"] }) {
  if (report.termName !== TermName.THIRD || !report.promotedToClass) return null;

  const map: Record<string, { bg: string; border: string; label: string; title: string; subtitle: string; tc: string; sc: string; labelBg: string }> = {
    "Pending Department Assignment": {
      bg: "#fef3c7", border: "#fde68a",
      label: "PENDING", labelBg: "#f59e0b",
      title: "DEPARTMENT ASSIGNMENT PENDING",
      subtitle: "Your child has passed! Admin will assign your SSS 1 class and department shortly.",
      tc: "#92400e", sc: "#78350f",
    },
    "Graduated": {
      bg: "#a7f3d0", border: "#6ee7b7",
      label: "GRADUATED", labelBg: "#059669",
      title: "CONGRATULATIONS — GRADUATED!",
      subtitle: "Your child has successfully completed SSS 3. Well done!",
      tc: "#065f46", sc: "#065f46",
    },
    "Performance Under Review": {
      bg: "#fecaca", border: "#fca5a5",
      label: "REVIEW", labelBg: "#dc2626",
      title: "PERFORMANCE UNDER REVIEW",
      subtitle: "Please contact the school for further information.",
      tc: "#991b1b", sc: "#7f1d1d",
    },
  };

  const cfg = map[report.promotedToClass] ?? (report.isPromoted ? {
    bg: "#a7f3d0", border: "#6ee7b7",
    label: "PROMOTED", labelBg: "#059669",
    title: `PROMOTED TO: ${report.promotedToClass}`,
    subtitle: "Congratulations! Continue to excel in the next academic year.",
    tc: "#065f46", sc: "#065f46",
  } : null);

  if (!cfg) return null;

  return (
    <View style={S.promotionWrap}>
      <View style={[S.promotionBox, { backgroundColor: cfg.bg, border: `1 solid ${cfg.border}` }]}>
        <View style={{ backgroundColor: cfg.labelBg, borderRadius: 4, paddingVertical: 3, paddingHorizontal: 6 }}>
          <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>
            {cfg.label}
          </Text>
        </View>
        <View>
          <Text style={[S.promotionTitle, { color: cfg.tc }]}>{cfg.title}</Text>
          <Text style={[S.promotionSub, { color: cfg.sc }]}>{cfg.subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── ResumptionDate ───────────────────────────────────────────────
function ResumptionDate({ report }: { report: ReportCardPDFProps["report"] }) {
  if (!report.nextTermResumptionDate) return null;
  return (
    <View style={S.resumptionWrap}>
      <View style={S.resumptionBox}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#f59e0b" }} />
        <Text style={S.resumptionLabel}>Next Term Resumption:</Text>
        <Text style={S.resumptionValue}>{formatDate(report.nextTermResumptionDate)}</Text>
      </View>
    </View>
  );
}

// ─── PageFooter ───────────────────────────────────────────────────
function PageFooter({ report, signatureBase64, stampBase64 }: {
  report: ReportCardPDFProps["report"];
  signatureBase64: string;
  stampBase64: string;
}) {
  const today = new Date().toLocaleDateString("en-NG", {
    day: "2-digit", month: "long", year: "numeric",
  });
  return (
    <View style={S.footer}>
      <View>
        <Text style={S.footerDate}>Report generated on {today}</Text>
        <Text style={S.footerID}>
          Report ID: {String(report._id)} · Scan QR code to verify authenticity
        </Text>
      </View>
      <View style={S.footerRight}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 3, alignItems: "center" }}>
          {signatureBase64 ? <Image src={signatureBase64} style={S.footerSigImg} /> : null}
          {stampBase64     ? <Image src={stampBase64}     style={S.footerSigImg} /> : null}
          {!signatureBase64 && !stampBase64 && <View style={S.footerSigLine} />}
        </View>
      </View>
    </View>
  );
}

// ─── ReportCardDocument ───────────────────────────────────────────
function ReportCardDocument({ report, assets }: {
  report: ReportCardPDFProps["report"];
  assets: {
    qrDataUrl: string | null;
    logoBase64: string;
    profilePhotoBase64: string;
    signatureBase64: string;
    stampBase64: string;
  };
}) {
  const isTwoPage = report.subjects.length > TWO_PAGE_THRESHOLD;
  const avgScore  = report.percentage.toFixed(1);

  return (
    <Document
      title={`Report Card — ${report.studentSnapshot.surname} ${report.studentSnapshot.firstName}`}
      author="God's Way Model Groups of Schools"
    >
      {/* ══ PAGE 1 ══ */}
      <Page size="A4" style={S.page}>
        <PageHeader showQR qrDataUrl={assets.qrDataUrl} logoBase64={assets.logoBase64} report={report} />
        <StudentInfoStrip report={report} profilePhotoBase64={assets.profilePhotoBase64} avgScore={avgScore} />
        <SubjectsTable report={report} />

        {!isTwoPage && (
          <>
            <GradeScale />
            <AttendanceAndComments report={report} />
            <PromotionBanner report={report} />
            <ResumptionDate report={report} />
          </>
        )}

        {isTwoPage && (
          <View style={{ padding: "8 20", backgroundColor: "#f0f4f8", margin: "8 20", borderRadius: 6, border: "1 dashed #cbd5e1" }}>
            <Text style={{ fontSize: 8.5, color: "#475569", fontStyle: "italic" }}>
              Attendance record, teacher comments, and other details are continued on Page 2.
            </Text>
          </View>
        )}

        <PageFooter report={report} signatureBase64={assets.signatureBase64} stampBase64={assets.stampBase64} />
      </Page>

      {/* ══ PAGE 2 ══ */}
      {isTwoPage && (
        <Page size="A4" style={S.page}>
          <PageHeader showQR={false} qrDataUrl={null} logoBase64={assets.logoBase64} report={report} />

          <View style={S.page2Banner}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[S.page2BannerMuted, { textTransform: "uppercase", letterSpacing: 0.4, marginRight: 4 }]}>
                Student:
              </Text>
              <Text style={S.page2BannerName}>
                {report.studentSnapshot.surname} {report.studentSnapshot.firstName} {report.studentSnapshot.otherName}
              </Text>
              <Text style={[S.page2BannerMuted, { marginLeft: 8 }]}>
                · {report.studentSnapshot.admissionNumber}
              </Text>
            </View>
            <Text style={S.page2BannerRight}>
              {report.className} · {report.termName.toUpperCase()} TERM
            </Text>
          </View>

          <GradeScale />
          <AttendanceAndComments report={report} />
          <PromotionBanner report={report} />
          <ResumptionDate report={report} />
          <PageFooter report={report} signatureBase64={assets.signatureBase64} stampBase64={assets.stampBase64} />
        </Page>
      )}
    </Document>
  );
}

// ─── Public download function ─────────────────────────────────────
export async function downloadReportCardPDF(
  report: ReportCardPDFProps["report"],
): Promise<void> {
  const qrDataUrl = await QRCode.toDataURL(
    `${window.location.origin}/verify-report/${report._id}`,
    { width: 100, margin: 1 },
  ).catch(() => null);

  const [logoBase64, profilePhotoBase64, signatureBase64, stampBase64] =
    await Promise.all([
      toBase64(SCHOOL_LOGO_URL),
      report.studentSnapshot.profilePhoto ? toBase64(report.studentSnapshot.profilePhoto) : Promise.resolve(""),
      report.principalSignature           ? toBase64(report.principalSignature)           : Promise.resolve(""),
      report.schoolStamp                  ? toBase64(report.schoolStamp)                  : Promise.resolve(""),
    ]);

  const blob = await pdf(
    <ReportCardDocument
      report={report}
      assets={{ qrDataUrl, logoBase64, profilePhotoBase64, signatureBase64, stampBase64 }}
    />,
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = `ReportCard_${report.studentSnapshot.admissionNumber}_${report.termName}_${report.sessionName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Drop-in button ───────────────────────────────────────────────
export function ReportCardPDFDownloadButton({ report }: ReportCardPDFProps) {
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    setLoading(true);
    try { await downloadReportCardPDF(report); }
    finally { setLoading(false); }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a5f] text-white text-sm font-medium hover:bg-[#152847] transition-colors disabled:opacity-50"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {loading ? "Generating PDF..." : "Download PDF"}
    </button>
  );
}