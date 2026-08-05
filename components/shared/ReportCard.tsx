"use client";

import { useRef, useState, useEffect } from "react";
import { Download, Printer } from "lucide-react";
import { downloadReportCardPDF } from "./ReportCardPDF";
import QRCode from "qrcode";
import type { IReportCard, ISubjectScore } from "@/types";
import { TermName } from "@/types/enums";
import { formatDate, getOrdinal } from "@/lib/utils";

interface ReportCardProps {
  report: IReportCard & {
    sessionName: string;
    termName: TermName;
    className: string;
    principalSignature?: string | null;
    schoolStamp?: string | null;
  };
  showActions?: boolean;
}

const SCHOOL_LOGO_URL =
  "https://res.cloudinary.com/dvgfumpoj/image/upload/v1784632470/ChatGPT_Image_Jul_21_2026_09_12_05_AM_1_qyhf63.png";

const A4_W = 794;
const A4_H = 1123;
const TWO_PAGE_THRESHOLD = 35;

const HEADER_H = 140;
const STUDENT_STRIP_H = 100;
const TABLE_TITLE_H = 28;
const TABLE_HEADER_H = 36;
const TABLE_FOOTER_H = 30;
const GRADE_SCALE_H = 38;
const ATTENDANCE_COMMENTS_H = 136;
const FOOTER_H = 48;


// const FIXED_TOTAL =
//   HEADER_H + STUDENT_STRIP_H + TABLE_TITLE_H + TABLE_HEADER_H +
//   TABLE_FOOTER_H + GRADE_SCALE_H + FOOTER_H;

const FIXED_TOTAL =
  HEADER_H + STUDENT_STRIP_H + TABLE_TITLE_H + TABLE_HEADER_H +
  TABLE_FOOTER_H + GRADE_SCALE_H + ATTENDANCE_COMMENTS_H + FOOTER_H;

function fixFlexAlignment(el: HTMLElement) {
  const style = el.style;
  if (style.display === "flex" || style.display === "inline-flex") {
    if (style.alignItems === "center") style.alignItems = "flex-start";
    if (
      style.justifyContent === "center" &&
      (style.flexDirection || "row") === "column"
    ) {
      style.justifyContent = "flex-start";
    }
  }
  Array.from(el.children).forEach((child) =>
    fixFlexAlignment(child as HTMLElement),
  );
}

function patchClone(_doc: Document, clonedEl: HTMLElement) {
  fixFlexAlignment(clonedEl);
  const perfBox = clonedEl.querySelector<HTMLElement>("[data-perf-box]");
  if (perfBox) {
    perfBox.style.justifyContent = "flex-start";
    perfBox.style.alignItems = "center";
    perfBox.style.paddingTop = "10px";
    perfBox.style.overflow = "visible";
  }
  const avatar = clonedEl.querySelector<HTMLElement>("[data-avatar]");
  if (avatar) {
    avatar.style.display = "table-cell";
    avatar.style.verticalAlign = "middle";
    avatar.style.textAlign = "center";
  }
  const attFooter = clonedEl.querySelector<HTMLElement>("[data-att-footer]");
  if (attFooter) {
    attFooter.style.alignItems = "flex-start";
    attFooter.style.paddingTop = "4px";
    attFooter.style.paddingBottom = "4px";
  }
}

export default function ReportCardComponent({
  report,
  showActions = true,
}: ReportCardProps) {
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [stampBase64, setStampBase64] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  const isTwoPage = report.subjects.length > TWO_PAGE_THRESHOLD;
  const isThirdTerm = report.termName === TermName.THIRD;
  const avgScore = report.percentage.toFixed(1);

  const hasDeptRanking =
    report.totalStudentsInDept > 0 &&
    report.totalStudentsInDept !== report.totalStudentsInClass;

  const deptLabel = report.studentSnapshot.department !== "none"
    ? report.studentSnapshot.department.toUpperCase()
    : "DEPT";
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    function updateScale() {
      if (!wrapperRef.current) return;
      const available = wrapperRef.current.clientWidth;
      setScale(Math.min(1, available / A4_W));
    }
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  
  async function generateQR() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return QRCode.toDataURL(
    `${baseUrl}/verify-report/${report._id}`,
    { width: 100, margin: 1 },
  );
}

  async function convertImageToBase64(url: string): Promise<string> {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  }

  async function prepareAssets() {
    const [qr, logo] = await Promise.all([
      generateQR(),
      convertImageToBase64(SCHOOL_LOGO_URL),
    ]);
    setQrDataUrl(qr);
    setLogoBase64(logo);
    if (report.studentSnapshot.profilePhoto) {
      const b64 = await convertImageToBase64(report.studentSnapshot.profilePhoto);
      setProfilePhotoBase64(b64);
    }
    if (report.principalSignature) {
      const b64 = await convertImageToBase64(report.principalSignature);
      setSignatureBase64(b64);
    }
    if (report.schoolStamp) {
      const b64 = await convertImageToBase64(report.schoolStamp);
      setStampBase64(b64);
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  async function handlePrint() {
    setIsPrinting(true);
    await prepareAssets();
    window.print();
    setIsPrinting(false);
  }

  async function handleDownload() {
    setIsPrinting(true);
    try {
      await downloadReportCardPDF(report);
    } finally {
      setIsPrinting(false);
    }
  }

  const conditionalH =
    (isThirdTerm ? 44 : 0) + (report.nextTermResumptionDate ? 38 : 0);

  const availableForRows = A4_H - FIXED_TOTAL - conditionalH;

 const singlePageRowHeight = Math.min(26, Math.max(14, Math.floor(availableForRows / report.subjects.length)));

  const twoPageAvailableForRows =
    A4_H - HEADER_H - STUDENT_STRIP_H - TABLE_TITLE_H - TABLE_HEADER_H - TABLE_FOOTER_H - FOOTER_H - 40;
  const twoPageRowHeight = Math.min(
    32,
    Math.max(22, Math.floor(twoPageAvailableForRows / Math.max(report.subjects.length, 1))),
  );

  const rowHeight = isTwoPage ? twoPageRowHeight : singlePageRowHeight;

  // ── Sub-components ────────────────────────────────────────────────────────

  function PageHeader({ showQR = true }: { showQR?: boolean }) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)",
          color: "white",
          padding: "11px 24px",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div style={{ position: "absolute", top: -40, right: -40, width: 130, height: 130, borderRadius: "50%", background: "rgba(245,158,11,0.08)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          <div style={{ flexShrink: 0, width: 80, height: 80 }}>
            <img
              src={logoBase64 || SCHOOL_LOGO_URL}
              alt="School Logo"
              crossOrigin="anonymous"
              style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 8, display: "block" }}
            />
          </div>

          <div style={{ flex: 1, textAlign: "center", padding: "0 14px" }}>
            <h1 style={{ fontSize: 16, fontWeight: "900", margin: "0 0 2px", letterSpacing: "0.5px", textTransform: "uppercase", color: "white", lineHeight: 1.2 }}>
              GOD&apos;S WAY MODEL SCHOOLS
            </h1>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", margin: "0 0 4px", letterSpacing: "2px" }}>
              SOWING THE SEED OF MERIT AND EXCELLENCE
            </p>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>📍 NO 12 SIYANBOLA STREET, OSOGBO, OSUN STATE</p>
              <p style={{ margin: 0 }}>📞 08069825847, 08067110930 &nbsp;|&nbsp; ✉️ godswaygroupofschools@gmail.com</p>
            </div>
          </div>

          <div style={{ flexShrink: 0, textAlign: "center" }}>
            {showQR ? (
              qrDataUrl ? (
                <div style={{ background: "white", padding: 5, borderRadius: 7 }}>
                  <img src={qrDataUrl} alt="QR Code" style={{ width: 70, height: 70, display: "block" }} />
                  <p style={{ fontSize: 8, color: "#555", margin: "2px 0 0", textAlign: "center" }}>Verify Report</p>
                </div>
              ) : (
                <div style={{ width: 80, height: 80, background: "rgba(255,255,255,0.05)", borderRadius: 7, border: "1px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 4 }}>QR on Download</span>
                </div>
              )
            ) : (
              <div style={{ width: 80, height: 80, background: "rgba(245,158,11,0.12)", borderRadius: 7, border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, color: "#f59e0b", textAlign: "center", padding: 5, fontWeight: "bold", lineHeight: 1.4 }}>PAGE 2{"\n"}CONT.</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "5px 18px", background: "rgba(245,158,11,0.15)", borderRadius: 7, border: "1px solid rgba(245,158,11,0.3)", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#f59e0b", fontSize: 11, fontWeight: "bold", letterSpacing: "0.5px", lineHeight: 1 }}>STUDENT REPORT CARD</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, lineHeight: 1 }}>·</span>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, lineHeight: 1 }}>
              {report.termName.toUpperCase()} TERM &nbsp;·&nbsp; {report.sessionName} SESSION
            </span>
          </div>
        </div>
      </div>
    );
  }

  function StudentInfoStrip() {
    return (
      <div style={{ padding: "8px 24px", borderBottom: "2px solid #f0f4f8", display: "flex", gap: 12, alignItems: "stretch", flexShrink: 0 }}>
        {/* Photo */}
        <div style={{ flexShrink: 0 }}>
          {report.studentSnapshot.profilePhoto ? (
            <img
              src={profilePhotoBase64 || report.studentSnapshot.profilePhoto}
              alt="Student"
              style={{ width: 74, height: 74, objectFit: "cover", borderRadius: 8, border: "3px solid #1e3a5f", display: "block" }}
            />
          ) : (
            <div
              data-avatar
              style={{ width: 74, height: 74, borderRadius: 8, background: "#e8eff7", border: "3px solid #1e3a5f", display: "table-cell", verticalAlign: "middle", textAlign: "center", fontSize: 22, color: "#1e3a5f", fontWeight: "bold", boxSizing: "border-box" }}
            >
              {report.studentSnapshot.surname.charAt(0)}
              {report.studentSnapshot.firstName.charAt(0)}
              {report.studentSnapshot.otherName.charAt(0)}
            </div>
          )}
        </div>

        {/* Info grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0px 14px", alignContent: "start" }}>
          {[
            { label: "Student Name", value: `${report.studentSnapshot.surname} ${report.studentSnapshot.firstName} ${report.studentSnapshot.otherName}` },
            { label: "Admission No.", value: report.studentSnapshot.admissionNumber },
            { label: "Class", value: report.className },
            { label: "Academic Session", value: report.sessionName },
            { label: "Term", value: `${report.termName.toUpperCase()} TERM` },
            { label: "Date of Birth", value: formatDate(report.studentSnapshot.dateOfBirth) },
            { label: "Gender", value: report.studentSnapshot.gender.charAt(0).toUpperCase() + report.studentSnapshot.gender.slice(1) },
            { label: "Department", value: report.studentSnapshot.department !== "none" ? report.studentSnapshot.department.toUpperCase() : "N/A" },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: "1px 0" }}>
              <span style={{ fontSize: 8.5, color: "#6b7280", display: "block", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.3 }}>{label}</span>
              <span style={{ fontSize: 11.5, fontWeight: "600", color: "#111", lineHeight: 1.3, display: "block" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* ── Performance box ───────────────────────────────────────────────────
            Shows score, grade, and positions.
            - For SS students (hasDeptRanking = true):
                Row 1: dept position  e.g. "2nd / 16  SCIENCE"
                Row 2: overall position e.g. "5th / 31  OVERALL"
            - For Primary / JSS (hasDeptRanking = false):
                Single row: overall position e.g. "3rd / 25  students"
        ─────────────────────────────────────────────────────────────────────── */}
        <div
          data-perf-box
          style={{
            flexShrink: 0,
            background: "#1e3a5f",
            borderRadius: 8,
            padding: "10px 14px",
            color: "white",
            textAlign: "center",
            minWidth: 110,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#f59e0b", lineHeight: 1, marginBottom: 2 }}>{avgScore}%</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginBottom: 2, lineHeight: 1.3 }}>Overall Score</div>
          <div style={{ fontSize: 18, fontWeight: "bold", marginBottom: 2, lineHeight: 1.2 }}>{report.grade}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", lineHeight: 1.3 }}>Grade</div>

          <div style={{ marginTop: 6, paddingTop: 5, borderTop: "1px solid rgba(255,255,255,0.15)", width: "100%" }}>

            {hasDeptRanking ? (
              // ── Two rows: dept position + overall position ──────────────────
              <>
                {/* Dept position row */}
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 }}>
                    <span style={{ color: "#f59e0b", fontWeight: "bold", fontSize: 13 }}>
                      {getOrdinal(report.position)}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9 }}>
                      {" "}/ {report.totalStudentsInDept}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 7.5,
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    lineHeight: 1.3,
                  }}>
                    {deptLabel} DEPT.
                  </div>
                </div>

                {/* Thin separator */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 4 }} />

                {/* Overall position row */}
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 }}>
                    <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: "bold", fontSize: 11 }}>
                      {getOrdinal(report.overallPosition ?? report.position)}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>
                      {" "}/ {report.totalStudentsInClass}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 7.5,
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    lineHeight: 1.3,
                  }}>
                    OVERALL STUDENTS
                  </div>
                </div>
              </>
              
            ) : (
              // ── Single row: overall position only (Primary / JSS) ───────────
              <div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 }}>
                  <span style={{ color: "#f59e0b", fontWeight: "bold", fontSize: 13 }}>
                    {getOrdinal(report.position)}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9 }}>
                    {" "}/ {report.totalStudentsInClass}
                  </span>
                </div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", lineHeight: 1.3 }}>
                  students
                </div>
              </div>
            )}

             {/* ── NEW: cumulative row — sits BELOW the ternary above, shown regardless of hasDeptRanking ── */}
  {isThirdTerm && report.cumulativeOverallPosition ? (
    <>
      <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 }}>
          <span style={{ color: "#f59e0b", fontWeight: "bold", fontSize: 12 }}>
            {getOrdinal(report.cumulativeOverallPosition)}
          </span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 8.5 }}>
            {" "}/ {report.totalStudentsInClass}
          </span>
        </div>
        <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.3 }}>
          SESSION CUMULATIVE ({report.cumulativePercentage?.toFixed(1)}%)
        </div>
        {report.cumulativeTermsCount && report.cumulativeTermsCount < 3 && (
          <div style={{ fontSize: 6.5, color: "rgba(245,158,11,0.7)", fontStyle: "italic", marginTop: 1 }}>
            based on {report.cumulativeTermsCount} of 3 terms
          </div>
        )}
      </div>
    </>
  ) : null}
          </div>
        </div>
      </div>
    );
  }

  function SubjectsTable() {
    return (
      // <div style={{ padding: "0 24px", flexShrink: 0 }}>
      <div style={{ padding: "0 24px", flexShrink: 0, position: "relative" }}>
      {/* Watermark */}
      {(logoBase64 || SCHOOL_LOGO_URL) && (
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 280, height: 280,
          backgroundImage: `url(${logoBase64 || SCHOOL_LOGO_URL})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          opacity: 0.08,
          pointerEvents: "none",
          zIndex: 0,
        }} />
      )}
      <div style={{ position: "relative", zIndex: 1 }}></div>
        <h3 style={{ fontSize: 11, fontWeight: "bold", color: "#1e3a5f", padding: "7px 0 5px", borderBottom: "2px solid #1e3a5f", margin: 0, letterSpacing: "0.5px" }}>
          ACADEMIC PERFORMANCE
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "30%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "16%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: "#f0f4f8" }}>
              {[
                { label: "SUBJECT", sub: "" },
                { label: "TEST", sub: "(20/30)" },
                { label: "EXAM", sub: "(60/70)" },
                { label: "PRAC.", sub: "(20)" },
                { label: "TOTAL", sub: "" },
                { label: "GRADE", sub: "" },
                { label: "REMARK", sub: "" },
              ].map(({ label, sub }, i) => (
                <th
                  key={i}
                  style={{ padding: "5px 4px", textAlign: i === 0 ? "left" : "center", fontSize: 9, color: "#374151", fontWeight: "700", borderBottom: "1px solid #e2e8f0", paddingLeft: i === 0 ? 7 : 4, lineHeight: 1.2, verticalAlign: "middle" }}
                >
                  {label}
                  {sub && <div style={{ fontSize: 8, color: "#6b7280", fontWeight: "500" }}>{sub}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.subjects.map((subject: ISubjectScore, i) => (
              <tr key={subject.subject} style={{ background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                <td style={{ padding: `${Math.max(1, (rowHeight - 14) / 2)}px 7px`, borderBottom: "1px solid #f0f4f8", fontWeight: "500", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", verticalAlign: "middle", lineHeight: 1.2, fontSize: 10.5 }}>
                  {subject.subjectName}
                  {subject.subjectPosition === 1 && (
    <span style={{ display: "block", fontSize: 8, color: "#f59e0b", fontWeight: "bold" }}>★ Best in Class</span>
  )}
                </td>
                <td style={{ padding: "2px 4px", borderBottom: "1px solid #f0f4f8", textAlign: "center", verticalAlign: "middle", lineHeight: 1.2, fontSize: 10.5 }}>{subject.testScore}</td>
                <td style={{ padding: "2px 4px", borderBottom: "1px solid #f0f4f8", textAlign: "center", verticalAlign: "middle", lineHeight: 1.2, fontSize: 10.5 }}>{subject.examScore}</td>
                <td style={{ padding: "2px 4px", borderBottom: "1px solid #f0f4f8", textAlign: "center", verticalAlign: "middle", lineHeight: 1.2, fontSize: 10.5, color: subject.hasPractical ? "#111" : "#ccc" }}>
                  {subject.hasPractical ? subject.practicalScore : "—"}
                </td>
                <td style={{ padding: "2px 4px", borderBottom: "1px solid #f0f4f8", textAlign: "center", verticalAlign: "middle", lineHeight: 1.2, fontWeight: "bold", fontSize: 10.5, color: subject.totalScore < subject.maxTotalScore * 0.5 ? "#dc2626" : "#1e3a5f" }}>
                  {subject.totalScore}/{subject.maxTotalScore}
                </td>
                <td style={{ padding: "2px 4px", borderBottom: "1px solid #f0f4f8", textAlign: "center", verticalAlign: "middle" }}>
                  <span style={{
                    display: "inline-block", padding: "1px 5px", borderRadius: 3, fontSize: 9.5, fontWeight: "bold", lineHeight: 1.4,
                    background: subject.grade === "A" ? "#d1fae5" : subject.grade === "F" ? "#fee2e2" : subject.grade === "B" ? "#dbeafe" : "#fef3c7",
                    color: subject.grade === "A" ? "#065f46" : subject.grade === "F" ? "#991b1b" : subject.grade === "B" ? "#1e40af" : "#92400e",
                  }}>
                    {subject.grade}
                  </span>
                </td>
                <td style={{ padding: "2px 4px", borderBottom: "1px solid #f0f4f8", textAlign: "center", verticalAlign: "middle", fontSize: 9.5, lineHeight: 1.2, color: "#6b7280" }}>
                  {subject.remark}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1e3a5f", color: "white" }}>
              <td colSpan={4} style={{ padding: "5px 7px", fontWeight: "bold", fontSize: 11, verticalAlign: "middle", lineHeight: 1.2 }}>TOTAL</td>
              <td style={{ padding: "5px 4px", textAlign: "center", verticalAlign: "middle", fontWeight: "bold", fontSize: 12, lineHeight: 1.2, color: "#f59e0b" }}>
                {report.totalObtained}/{report.totalObtainable}
              </td>
              <td style={{ padding: "5px 4px", textAlign: "center", verticalAlign: "middle", fontWeight: "bold", lineHeight: 1.2, color: "#f59e0b" }}>{report.grade}</td>
              <td style={{ padding: "5px 4px", textAlign: "center", verticalAlign: "middle", fontSize: 11, lineHeight: 1.2, color: "rgba(255,255,255,0.85)" }}>{avgScore}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  function GradeScale() {
    return (
      <div style={{ padding: "5px 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center", padding: "4px 8px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 8.5, color: "#6b7280", marginRight: 3, fontWeight: "600", whiteSpace: "nowrap", lineHeight: 1.4 }}>Grade Scale:</span>
          {[
            { grade: "A", range: "70–100%", bg: "#d1fae5", text: "#065f46" },
            { grade: "B", range: "60–69%", bg: "#dbeafe", text: "#1e40af" },
            { grade: "C", range: "50–59%", bg: "#fef3c7", text: "#92400e" },
            { grade: "D", range: "49–45%", bg: "#f3f4f6", text: "#374151" },
            { grade: "E", range: "44–40%", bg: "#fde68a", text: "#78350f" },
            { grade: "F", range: "0–39%", bg: "#fee2e2", text: "#991b1b" },
          ].map((g) => (
            <span key={g.grade} style={{ padding: "1px 7px", borderRadius: 3, fontSize: 8.5, fontWeight: "600", background: g.bg, color: g.text, whiteSpace: "nowrap", lineHeight: 1.4 }}>
              {g.grade}: {g.range}
            </span>
          ))}
        </div>
      </div>
    );
  }

  function AttendanceAndComments() {
    return (
    
      <div style={{
  padding: "0 24px 8px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  flexShrink: 0,
}}>
        <div style={{ background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "7px 12px", flex: 1, overflow: "hidden" }}>
            <h4 style={{ fontSize: 10, fontWeight: "bold", color: "#1e3a5f", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.2 }}>
              Attendance Record
            </h4>
            {[
              { label: "School Days Open", value: report.attendance.schoolDaysOpen },
              { label: "Days Present", value: report.attendance.daysPresent },
              { label: "Days Absent", value: report.attendance.daysAbsent },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid #e8edf2" }}>
                <span style={{ fontSize: 9.5, color: "#6b7280", lineHeight: 1.4 }}>{label}:</span>
                <span style={{ fontSize: 10, fontWeight: "600", color: "#111", lineHeight: 1.4 }}>{value}</span>
              </div>
            ))}
          </div>
          <div
            data-att-footer
            style={{ padding: "4px 12px", background: "#1e3a5f", display: "flex", justifyContent: "space-between", flexShrink: 0 }}
          >
            <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.75)", lineHeight: "20px" }}>Attendance Rate:</span>
            <span style={{ fontSize: 11, fontWeight: "bold", color: "#f59e0b", lineHeight: "20px" }}>
              {report.attendance.attendancePercentage.toFixed(0)}%
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
          {/* <div style={{ background: "#f8fafc", borderRadius: 8, padding: "7px 11px", border: "1px solid #e2e8f0", flex: 1, overflow: "hidden" }}> */}
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: "7px 11px",
  border: "1px solid #e2e8f0" }}>
            <h4 style={{ fontSize: 9.5, fontWeight: "bold", color: "#1e3a5f", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.2 }}>
              Class Teacher&apos;s Comment
            </h4>
            <p style={{ fontSize: 10.5, color: "#374151", margin: 0, lineHeight: 1.5, fontStyle: "italic", overflow: "hidden" }}>
              {report.teacherComment ?? "No comment provided."}
            </p>
          </div>
          {/* <div style={{ background: "#f8fafc", borderRadius: 8, padding: "7px 11px", border: "1px solid #e2e8f0", flex: 1, overflow: "hidden" }}> */}
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: "7px 11px",
  border: "1px solid #e2e8f0" }}>
            <h4 style={{ fontSize: 9.5, fontWeight: "bold", color: "#1e3a5f", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.2 }}>
              Proprietress&apos;s Comment
            </h4>
            <p style={{ fontSize: 10.5, color: "#374151", margin: 0, lineHeight: 1.5, fontStyle: "italic", wordBreak: "break-word" }}>
              {report.principalComment ?? "Keep up the good work!"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  function PromotionBanner() {
    if (!isThirdTerm || !report.promotedToClass) return null;

    const banners: Record<string, { bg: string; border: string; icon: string; title: string; subtitle: string; titleColor: string; subColor: string }> = {
      "Pending Department Assignment": {
        bg: "linear-gradient(135deg, #fffbeb, #fef3c7)", border: "#fde68a", icon: "⏳",
        title: "DEPARTMENT ASSIGNMENT PENDING",
        subtitle: "Your child has passed! Admin will assign your SSS 1 class and department shortly.",
        titleColor: "#92400e", subColor: "#78350f",
      },
      "Graduated": {
        bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)", border: "#6ee7b7", icon: "🎓",
        title: "CONGRATULATIONS — GRADUATED!",
        subtitle: "Your child has successfully completed SSS 3. Well done!",
        titleColor: "#065f46", subColor: "#065f46",
      },
      "Performance Under Review": {
        bg: "linear-gradient(135deg, #fee2e2, #fecaca)", border: "#fca5a5", icon: "📋",
        title: "PERFORMANCE UNDER REVIEW",
        subtitle: "Please contact the school for further information.",
        titleColor: "#991b1b", subColor: "#7f1d1d",
      },
    };

    const config = banners[report.promotedToClass] ?? (report.isPromoted ? {
      bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)", border: "#6ee7b7", icon: "🎉",
      title: `PROMOTED TO: ${report.promotedToClass}`,
      subtitle: "Congratulations! Continue to excel in the next academic year.",
      titleColor: "#065f46", subColor: "#065f46",
    } : null);

    if (!config) return null;

    return (
      <div style={{ padding: "0 24px 7px", flexShrink: 0 }}>
        <div style={{ padding: "2px 13px", borderRadius: 8, background: config.bg, border: `1px solid ${config.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>{config.icon}</span>
          <div>
            <p style={{ fontSize: 11.5, fontWeight: "bold", color: config.titleColor, margin: 0, lineHeight: 1.3 }}>{config.title}</p>
            <p style={{ fontSize: 9.5, color: config.subColor, margin: "1px 0 0", lineHeight: 1.3 }}>{config.subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  function ResumptionDate() {
    if (!report.nextTermResumptionDate) return null;
    return (
      <div style={{ padding: "0 24px 7px", flexShrink: 0 }}>
        <div style={{ padding: "7px 13px", borderRadius: 6, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 13, lineHeight: 1 }}>📅</span>
          <div>
            <span style={{ fontSize: 9.5, color: "#78350f", fontWeight: "600", textTransform: "uppercase", lineHeight: 1.4 }}>Next Term Resumption:</span>
            <span style={{ fontSize: 11.5, color: "#92400e", fontWeight: "bold", marginLeft: 7, lineHeight: 1.4 }}>
              {formatDate(report.nextTermResumptionDate)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  function PageFooter() {
    return (
      <div style={{ padding: "2px 24px", background: "#0a1628", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 8.5, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.4 }}>
            Report generated on{" "}
            {new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", marginBottom: 3 }}>
            {report.principalSignature && (
              <img src={signatureBase64 || report.principalSignature} alt="Principal Signature"
                style={{ height: 36, objectFit: "contain", display: "block", filter: "brightness(0) invert(1)" }} />
            )}
            {/* {report.schoolStamp && (
              <img src={stampBase64 || report.schoolStamp} alt="School Stamp"
                style={{ height: 50, objectFit: "contain", display: "block", filter: "brightness(0) invert(1)" }} />
            )} */}
            {report.schoolStamp && (
  <img src={stampBase64 || report.schoolStamp} alt="School Stamp"
    style={{
      height: 72,
      objectFit: "contain",
      display: "block",
      filter: "brightness(0) invert(1)",
      transform: "rotate(-12deg)",
      transformOrigin: "center center",
      marginBottom: 4,
    }} />
)}
            {!report.principalSignature && !report.schoolStamp && (
              <div style={{ width: 100, height: 1, background: "rgba(255,255,255,0.2)" }} />
            )}
          </div>
        </div>
      </div>
    );
  }

  function A4Page({ children, refProp }: { children: React.ReactNode; refProp: React.RefObject<HTMLDivElement | null> }) {
    return (
      <div
        ref={refProp}
        style={{
          width: A4_W,
          height: A4_H,
          backgroundColor: "white",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#111",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div>
      {showActions && (
        <div className="flex gap-3 mb-4 no-print">
          <button onClick={handleDownload} disabled={isPrinting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a5f] text-white text-sm font-medium hover:bg-[#152847] transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" />
            {isPrinting ? "Preparing..." : "Download PDF"}
          </button>
          <button onClick={handlePrint} disabled={isPrinting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
            <Printer className="w-4 h-4" />
            Print
          </button>
          {isTwoPage && (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              📄 2-page report ({report.subjects.length} subjects)
            </span>
          )}
        </div>
      )}

      <div
        ref={wrapperRef}
        className="w-full overflow-hidden no-print-scale"
        style={{ height: isTwoPage ? (A4_H * 2 + 16) * scale : A4_H * scale }}
      >
        <div style={{ transformOrigin: "top left", transform: `scale(${scale})`, width: A4_W }}>

          <A4Page refProp={page1Ref}>
            <PageHeader showQR />
            <StudentInfoStrip />
            <SubjectsTable />

            {!isTwoPage && (
  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
    <GradeScale />
    <AttendanceAndComments />
    <PromotionBanner />
    <ResumptionDate />
    <div style={{ flex: 1 }} /> {/* pushes footer to bottom */}
    {/* <PageFooter /> */}
  </div>
)}

            {!isTwoPage && <PageFooter />}
          </A4Page>

          {isTwoPage && (
            <>
              <div style={{ height: 16, background: "#e2e8f0" }} />
              <A4Page refProp={page2Ref}>
                <PageHeader showQR={false} />
                <div style={{ padding: "6px 24px", background: "#f0f4f8", borderBottom: "1px solid #e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: 8.5, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Student: </span>
                    <span style={{ fontSize: 11, fontWeight: "700", color: "#1e3a5f" }}>
                      {report.studentSnapshot.surname} {report.studentSnapshot.firstName} {report.studentSnapshot.otherName}
                    </span>
                    <span style={{ fontSize: 9.5, color: "#6b7280", marginLeft: 9 }}>· {report.studentSnapshot.admissionNumber}</span>
                  </div>
                  <span style={{ fontSize: 9.5, color: "#6b7280", fontStyle: "italic" }}>
                    {report.className} · {report.termName.toUpperCase()} TERM
                  </span>
                </div>
                <GradeScale />
                <AttendanceAndComments />
                <PromotionBanner />
                <ResumptionDate />
                <PageFooter />
              </A4Page>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
