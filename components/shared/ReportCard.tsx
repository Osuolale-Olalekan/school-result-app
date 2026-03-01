// "use client";

// import { useRef, useState } from "react";
// import { Download, Printer } from "lucide-react";
// import QRCode from "qrcode";
// import type { IReportCard, ISubjectScore } from "@/types";
// import { TermName } from "@/types/enums";
// import { formatDate, getOrdinal } from "@/lib/utils";

// interface ReportCardProps {
//   report: IReportCard & {
//     sessionName: string;
//     termName: TermName;
//     className: string;
//   };
//   showActions?: boolean;
// }

// const SCHOOL_LOGO = "https://res.cloudinary.com/dvgfumpoj/image/upload/v1771669318/school_logos_bm6n2y.png";

// export default function ReportCardComponent({
//   report,
//   showActions = true,
// }: ReportCardProps) {
//   const cardRef = useRef<HTMLDivElement>(null);
//   const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
//   const [isPrinting, setIsPrinting] = useState(false);
//   const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(null);
//   const [logoBase64, setLogoBase64] = useState<string | null>(null);

//   async function generateQR() {
//     const verifyUrl = `${window.location.origin}/verify-report/${report._id}`;
//     const dataUrl = await QRCode.toDataURL(verifyUrl, { width: 80, margin: 1 });
//     return dataUrl;
//   }

//   async function convertImageToBase64(url: string): Promise<string> {
//     try {
//       const response = await fetch(url);
//       const blob = await response.blob();
//       return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onloadend = () => resolve(reader.result as string);
//         reader.onerror = reject;
//         reader.readAsDataURL(blob);
//       });
//     } catch {
//       return "";
//     }
//   }

//   async function handlePrint() {
//     setIsPrinting(true);
//     const qr = await generateQR();
//     setQrDataUrl(qr);
//     if (!logoBase64) {
//       const lb = await convertImageToBase64(SCHOOL_LOGO);
//       setLogoBase64(lb);
//     }
//     await new Promise((r) => setTimeout(r, 300));
//     window.print();
//     setIsPrinting(false);
//   }

//   async function handleDownload() {
//     setIsPrinting(true);
//     const qr = await generateQR();
//     setQrDataUrl(qr);

//     if (report.studentSnapshot.profilePhoto) {
//       const base64 = await convertImageToBase64(report.studentSnapshot.profilePhoto);
//       setProfilePhotoBase64(base64);
//     }
//     const lb = await convertImageToBase64(SCHOOL_LOGO);
//     setLogoBase64(lb);

//     await new Promise((r) => setTimeout(r, 500));

//     const { jsPDF } = await import("jspdf");
//     const { default: html2canvas } = await import("html2canvas");

//     if (!cardRef.current) return;

//     const canvas = await html2canvas(cardRef.current, {
//       scale: 2,
//       useCORS: true,
//       logging: false,
//       width: cardRef.current.scrollWidth,
//       height: cardRef.current.scrollHeight,
//       windowWidth: cardRef.current.scrollWidth,
//     });

//     const imgData = canvas.toDataURL("image/png");

//     // A4 dimensions in mm
//     const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
//     const pageWidth = 210;
//     const pageHeight = 297;

//     const imgRatio = canvas.width / canvas.height;
//     const pageRatio = pageWidth / pageHeight;

//     let finalWidth = pageWidth;
//     let finalHeight = pageWidth / imgRatio;

//     // If content is taller than A4, scale to fit height
//     if (finalHeight > pageHeight) {
//       finalHeight = pageHeight;
//       finalWidth = pageHeight * imgRatio;
//     }

//     const xOffset = (pageWidth - finalWidth) / 2;
//     const yOffset = 0;

//     pdf.addImage(imgData, "PNG", xOffset, yOffset, finalWidth, finalHeight);
//     pdf.save(
//       `ReportCard_${report.studentSnapshot.admissionNumber}_${report.termName}_${report.sessionName}.pdf`
//     );
//     setIsPrinting(false);
//   }

//   const isThirdTerm = report.termName === TermName.THIRD;
//   const avgScore = report.percentage.toFixed(1);

//   return (
//     <div>
//       {showActions && (
//         <div className="flex gap-3 mb-4 no-print">
//           <button
//             onClick={handleDownload}
//             disabled={isPrinting}
//             className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a5f] text-white text-sm font-medium hover:bg-[#152847] transition-colors disabled:opacity-50"
//           >
//             <Download className="w-4 h-4" />
//             {isPrinting ? "Preparing..." : "Download PDF"}
//           </button>
//           <button
//             onClick={handlePrint}
//             disabled={isPrinting}
//             className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
//           >
//             <Printer className="w-4 h-4" />
//             Print
//           </button>
//         </div>
//       )}

//       {/* Report Card — fixed A4 width */}
//       <div
//         ref={cardRef}
//         style={{
//           width: 794,
//           backgroundColor: "white",
//           fontFamily: "Georgia, 'Times New Roman', serif",
//           color: "#111",
//           margin: "0 auto",
//         }}
//       >
//         {/* ── HEADER ── */}
//         <div
//           style={{
//             background: "linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)",
//             color: "white",
//             padding: "20px 28px",
//             position: "relative",
//             overflow: "hidden",
//           }}
//         >
//           {/* Decorative circles */}
//           <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(245,158,11,0.07)", pointerEvents: "none" }} />
//           <div style={{ position: "absolute", bottom: -30, left: 60, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

//           <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative", zIndex: 1 }}>

//             {/* LEFT — School Logo */}
//             <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
//               <img
//                 src={logoBase64 || SCHOOL_LOGO}
//                 alt="School Logo"
//                 style={{ width: 90, height: 90, objectFit: "contain", borderRadius: 8 }}
//               />
//             </div>

//             {/* CENTER — School name & contact */}
//             <div style={{ flex: 1, textAlign: "center" }}>
//               <h1 style={{
//                 fontSize: 20,
//                 fontWeight: "900",
//                 margin: "0 0 3px",
//                 letterSpacing: "0.5px",
//                 textTransform: "uppercase",
//                 lineHeight: 1.2,
//                 color: "#ffffff",
//               }}>
//                 God&apos;s Way Model Groups of Schools
//               </h1>
//               <p style={{ fontSize: 11, color: "rgba(245,158,11,0.9)", margin: "0 0 6px", fontStyle: "italic", letterSpacing: "1px" }}>
//                 Excellence • Integrity • Faith
//               </p>
//               <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
//                 <div>📍 1 School Road, Nigeria</div>
//                 <div>📞 +234 800 000 0000 &nbsp;|&nbsp; ✉️ info@godswayschools.edu.ng</div>
//               </div>
//             </div>

//             {/* RIGHT — QR Code */}
//             <div style={{ flexShrink: 0, textAlign: "center" }}>
//               {qrDataUrl ? (
//                 <div style={{ background: "white", padding: 7, borderRadius: 8, display: "inline-block" }}>
//                   <img src={qrDataUrl} alt="QR Code" style={{ width: 72, height: 72, display: "block" }} />
//                   <p style={{ fontSize: 8.5, color: "#555", margin: "3px 0 0", textAlign: "center" }}>Verify Report</p>
//                 </div>
//               ) : (
//                 <div style={{ width: 88, height: 88, background: "rgba(255,255,255,0.05)", borderRadius: 8, border: "1px dashed rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                   <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 4 }}>QR on Download</span>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Report Title Bar — full width, properly contained */}
//           <div style={{
//             marginTop: 14,
//             padding: "7px 20px",
//             background: "rgba(245,158,11,0.18)",
//             borderRadius: 6,
//             border: "1px solid rgba(245,158,11,0.35)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             gap: 14,
//           }}>
//             <span style={{ color: "#f59e0b", fontSize: 13, fontWeight: "bold", letterSpacing: "1px" }}>
//               STUDENT REPORT CARD
//             </span>
//             <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>•</span>
//             <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, letterSpacing: "0.5px" }}>
//               {report.termName.toUpperCase()} TERM &nbsp;·&nbsp; {report.sessionName} SESSION
//             </span>
//           </div>
//         </div>

//         {/* ── STUDENT INFO ── */}
//         <div style={{ padding: "16px 28px", borderBottom: "2px solid #f0f4f8", display: "flex", gap: 18, alignItems: "flex-start" }}>
//           {/* Photo */}
//           <div style={{ flexShrink: 0 }}>
//             {report.studentSnapshot.profilePhoto ? (
//               <img
//                 src={profilePhotoBase64 || report.studentSnapshot.profilePhoto}
//                 alt="Student"
//                 style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 10, border: "3px solid #1e3a5f", display: "block" }}
//               />
//             ) : (
//               <div style={{ width: 88, height: 88, borderRadius: 10, background: "#e8eff7", border: "3px solid #1e3a5f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#1e3a5f", fontWeight: "bold" }}>
//                 {report.studentSnapshot.firstName.charAt(0)}{report.studentSnapshot.lastName.charAt(0)}
//               </div>
//             )}
//           </div>

//           {/* Details grid */}
//           <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 14px" }}>
//             {[
//               { label: "Student Name", value: `${report.studentSnapshot.firstName} ${report.studentSnapshot.lastName}` },
//               { label: "Admission No.", value: report.studentSnapshot.admissionNumber },
//               { label: "Class", value: report.className },
//               { label: "Academic Session", value: report.sessionName },
//               { label: "Term", value: `${report.termName.toUpperCase()} TERM` },
//               { label: "Date of Birth", value: formatDate(report.studentSnapshot.dateOfBirth) },
//               { label: "Gender", value: report.studentSnapshot.gender.charAt(0).toUpperCase() + report.studentSnapshot.gender.slice(1) },
//               { label: "Department", value: report.studentSnapshot.department !== "none" ? report.studentSnapshot.department.toUpperCase() : "N/A" },
//             ].map(({ label, value }) => (
//               <div key={label} style={{ padding: "3px 0" }}>
//                 <span style={{ fontSize: 9.5, color: "#6b7280", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
//                 <span style={{ fontSize: 12.5, fontWeight: "600", color: "#111" }}>{value}</span>
//               </div>
//             ))}
//           </div>

//           {/* Performance Box */}
//           <div style={{ flexShrink: 0, background: "#1e3a5f", borderRadius: 10, padding: "14px 18px", color: "white", textAlign: "center", minWidth: 115 }}>
//             <div style={{ fontSize: 34, fontWeight: "bold", color: "#f59e0b", lineHeight: 1 }}>{avgScore}%</div>
//             <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: "3px 0" }}>Overall Score</div>
//             <div style={{ fontSize: 20, fontWeight: "bold", margin: "3px 0" }}>{report.grade}</div>
//             <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Grade</div>
//             <div style={{ marginTop: 8, paddingTop: 7, borderTop: "1px solid rgba(255,255,255,0.15)", fontSize: 11 }}>
//               <span style={{ color: "#f59e0b", fontWeight: "bold" }}>{getOrdinal(report.position)}</span>
//               <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9.5 }}> / {report.totalStudentsInClass} students</span>
//             </div>
//           </div>
//         </div>

//         {/* ── SCORES TABLE ── */}
//         <div style={{ padding: "0 28px 16px" }}>
//           <h3 style={{ fontSize: 12, fontWeight: "bold", color: "#1e3a5f", padding: "12px 0 7px", borderBottom: "2px solid #1e3a5f", margin: 0, letterSpacing: "0.5px" }}>
//             ACADEMIC PERFORMANCE
//           </h3>
//           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
//             <thead>
//               <tr style={{ background: "#f0f4f8" }}>
//                 {["SUBJECT", "TEST\n(40)", "EXAM\n(60)", "PRAC.\n(20)", "TOTAL", "GRADE", "REMARK"].map((h, i) => (
//                   <th key={h} style={{ padding: "7px 6px", textAlign: i === 0 ? "left" : "center", fontSize: 10, color: "#374151", fontWeight: "700", borderBottom: "1px solid #e2e8f0", whiteSpace: "pre-line" }}>{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {report.subjects.map((subject: ISubjectScore, i) => (
//                 <tr key={subject.subject} style={{ background: i % 2 === 0 ? "white" : "#fafbfc" }}>
//                   <td style={{ padding: "6px 8px", borderBottom: "1px solid #f0f4f8", fontWeight: "500" }}>{subject.subjectName}</td>
//                   <td style={{ padding: "6px", borderBottom: "1px solid #f0f4f8", textAlign: "center" }}>{subject.testScore}</td>
//                   <td style={{ padding: "6px", borderBottom: "1px solid #f0f4f8", textAlign: "center" }}>{subject.examScore}</td>
//                   <td style={{ padding: "6px", borderBottom: "1px solid #f0f4f8", textAlign: "center", color: subject.hasPractical ? "#111" : "#ccc" }}>
//                     {subject.hasPractical ? subject.practicalScore : "—"}
//                   </td>
//                   <td style={{ padding: "6px", borderBottom: "1px solid #f0f4f8", textAlign: "center", fontWeight: "bold", color: subject.totalScore < subject.maxTotalScore * 0.5 ? "#dc2626" : "#1e3a5f" }}>
//                     {subject.totalScore}/{subject.maxTotalScore}
//                   </td>
//                   <td style={{ padding: "6px", borderBottom: "1px solid #f0f4f8", textAlign: "center" }}>
//                     <span style={{ display: "inline-block", padding: "1px 7px", borderRadius: 3, fontSize: 10.5, fontWeight: "bold", background: subject.grade === "A" ? "#d1fae5" : subject.grade === "F" ? "#fee2e2" : "#fef3c7", color: subject.grade === "A" ? "#065f46" : subject.grade === "F" ? "#991b1b" : "#92400e" }}>
//                       {subject.grade}
//                     </span>
//                   </td>
//                   <td style={{ padding: "6px", borderBottom: "1px solid #f0f4f8", textAlign: "center", fontSize: 10.5, color: "#6b7280" }}>{subject.remark}</td>
//                 </tr>
//               ))}
//             </tbody>
//             <tfoot>
//               <tr style={{ background: "#1e3a5f", color: "white" }}>
//                 <td colSpan={4} style={{ padding: "7px 8px", fontWeight: "bold", fontSize: 11.5 }}>TOTAL</td>
//                 <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: "bold", fontSize: 12.5, color: "#f59e0b" }}>
//                   {report.totalObtained}/{report.totalObtainable}
//                 </td>
//                 <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: "bold", color: "#f59e0b" }}>{report.grade}</td>
//                 <td style={{ padding: "7px 6px", textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.85)" }}>{avgScore}%</td>
//               </tr>
//             </tfoot>
//           </table>
//         </div>

//         {/* ── GRADING SCALE ── */}
//         <div style={{ padding: "0 28px 14px" }}>
//           <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
//             <span style={{ fontSize: 10, color: "#6b7280", marginRight: 4, fontWeight: "600" }}>Grade Scale:</span>
//             {[
//               { grade: "A", range: "75-100%", bg: "#d1fae5", text: "#065f46" },
//               { grade: "B", range: "65-74%", bg: "#dbeafe", text: "#1e40af" },
//               { grade: "C", range: "55-64%", bg: "#fef3c7", text: "#92400e" },
//               { grade: "D", range: "45-54%", bg: "#f3f4f6", text: "#374151" },
//               { grade: "E", range: "40-44%", bg: "#fde68a", text: "#78350f" },
//               { grade: "F", range: "0-39%", bg: "#fee2e2", text: "#991b1b" },
//             ].map((g) => (
//               <span key={g.grade} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: "600", background: g.bg, color: g.text, display: "inline-block" }}>
//                 {g.grade}: {g.range}
//               </span>
//             ))}
//           </div>
//         </div>

//         {/* ── ATTENDANCE + COMMENTS ── */}
//         <div style={{ padding: "0 28px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//           {/* Attendance */}
//           <div style={{ background: "#f8fafc", borderRadius: 9, padding: "13px 15px", border: "1px solid #e2e8f0" }}>
//             <h4 style={{ fontSize: 11, fontWeight: "bold", color: "#1e3a5f", margin: "0 0 9px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
//               Attendance Record
//             </h4>
//             {[
//               { label: "School Days Open", value: report.attendance.schoolDaysOpen },
//               { label: "Days Present", value: report.attendance.daysPresent },
//               { label: "Days Absent", value: report.attendance.daysAbsent },
//             ].map(({ label, value }) => (
//               <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #e8edf2" }}>
//                 <span style={{ fontSize: 10.5, color: "#6b7280" }}>{label}:</span>
//                 <span style={{ fontSize: 11, fontWeight: "600", color: "#111" }}>{value}</span>
//               </div>
//             ))}
//             {/* Attendance Rate — full background */}
//             <div style={{ marginTop: 8, padding: "5px 10px", background: "#1e3a5f", borderRadius: 5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//               <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)" }}>Attendance Rate:</span>
//               <span style={{ fontSize: 11.5, fontWeight: "bold", color: "#f59e0b" }}>{report.attendance.attendancePercentage.toFixed(0)}%</span>
//             </div>
//           </div>

//           {/* Comments */}
//           <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
//             <div style={{ background: "#f8fafc", borderRadius: 9, padding: "11px 13px", border: "1px solid #e2e8f0", flex: 1 }}>
//               <h4 style={{ fontSize: 10.5, fontWeight: "bold", color: "#1e3a5f", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
//                 Class Teacher&apos;s Comment
//               </h4>
//               <p style={{ fontSize: 11.5, color: "#374151", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
//                 {report.teacherComment ?? "No comment provided."}
//               </p>
//             </div>
//             <div style={{ background: "#f8fafc", borderRadius: 9, padding: "11px 13px", border: "1px solid #e2e8f0", flex: 1 }}>
//               <h4 style={{ fontSize: 10.5, fontWeight: "bold", color: "#1e3a5f", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
//                 Principal&apos;s Comment
//               </h4>
//               <p style={{ fontSize: 11.5, color: "#374151", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
//                 {report.principalComment ?? "Keep up the good work!"}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* ── PROMOTION STATUS ── */}
//         {isThirdTerm && (
//           <div style={{ padding: "0 28px 14px" }}>
//             <div style={{ padding: "11px 15px", borderRadius: 9, background: report.isPromoted ? "linear-gradient(135deg, #d1fae5, #a7f3d0)" : "linear-gradient(135deg, #fee2e2, #fecaca)", border: `1px solid ${report.isPromoted ? "#6ee7b7" : "#fca5a5"}`, display: "flex", alignItems: "center", gap: 10 }}>
//               <span style={{ fontSize: 18 }}>{report.isPromoted ? "🎉" : "📋"}</span>
//               <div>
//                 <p style={{ fontSize: 12.5, fontWeight: "bold", color: report.isPromoted ? "#065f46" : "#991b1b", margin: 0 }}>
//                   {report.isPromoted ? `PROMOTED TO: ${report.promotedToClass ?? "Next Class"}` : "NOT PROMOTED — Performance Review Required"}
//                 </p>
//                 {report.isPromoted && (
//                   <p style={{ fontSize: 10.5, color: "#065f46", margin: "2px 0 0", opacity: 0.7 }}>
//                     Congratulations! Continue to excel in the next academic year.
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── NEXT TERM RESUMPTION ── */}
//         {report.nextTermResumptionDate && (
//           <div style={{ padding: "0 28px 16px" }}>
//             <div style={{ padding: "9px 15px", borderRadius: 7, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 8 }}>
//               <span style={{ fontSize: 15 }}>📅</span>
//               <div>
//                 <span style={{ fontSize: 10.5, color: "#78350f", fontWeight: "600", textTransform: "uppercase" }}>Next Term Resumption:</span>
//                 <span style={{ fontSize: 12.5, color: "#92400e", fontWeight: "bold", marginLeft: 8 }}>
//                   {formatDate(report.nextTermResumptionDate)}
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── FOOTER ── */}
//         <div style={{ padding: "13px 28px", background: "#0a1628", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           <div>
//             <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", margin: 0 }}>
//               Report generated on {new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" })}
//             </p>
//             <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>
//               Report ID: {report._id} · Scan QR code to verify authenticity
//             </p>
//           </div>
//           <div style={{ textAlign: "right" }}>
//             <div style={{ width: 110, height: 1, background: "rgba(255,255,255,0.2)", marginBottom: 4 }} />
//             <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", margin: 0 }}>Principal&apos;s Signature</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // "use client";

// // import { useRef, useState } from "react";
// // import { Download, Printer } from "lucide-react";
// // import QRCode from "qrcode";
// // import type { IReportCard, ISubjectScore } from "@/types";
// // import { TermName } from "@/types/enums";
// // import { formatDate, getOrdinal } from "@/lib/utils";
// // import Image from "next/image";

// // interface ReportCardProps {
// //   report: IReportCard & {
// //     sessionName: string;
// //     termName: TermName;
// //     className: string;
// //   };
// //   showActions?: boolean;
// // }

// // export default function ReportCardComponent({
// //   report,
// //   showActions = true,
// // }: ReportCardProps) {
// //   const cardRef = useRef<HTMLDivElement>(null);
// //   const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
// //   const [isPrinting, setIsPrinting] = useState(false);
// //   const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(
// //     null,
// //   );

// //   async function generateQR() {
// //     const verifyUrl = `${window.location.origin}/verify-report/${report._id}`;
// //     const dataUrl = await QRCode.toDataURL(verifyUrl, { width: 80, margin: 1 });
// //     return dataUrl;
// //   }

// //   async function handlePrint() {
// //     setIsPrinting(true);
// //     const qr = await generateQR();
// //     setQrDataUrl(qr);
// //     await new Promise((r) => setTimeout(r, 300));
// //     window.print();
// //     setIsPrinting(false);
// //   }

// //   async function convertImageToBase64(url: string): Promise<string> {
// //     try {
// //       const response = await fetch(url);
// //       const blob = await response.blob();
// //       return new Promise((resolve, reject) => {
// //         const reader = new FileReader();
// //         reader.onloadend = () => resolve(reader.result as string);
// //         reader.onerror = reject;
// //         reader.readAsDataURL(blob);
// //       });
// //     } catch {
// //       return ""; // return empty if fails
// //     }
// //   }

// //   async function handleDownload() {
// //     setIsPrinting(true);
// //     const qr = await generateQR();

// //     // Convert profile photo to base64 for html2canvas
// //     if (report.studentSnapshot.profilePhoto) {
// //       const base64 = await convertImageToBase64(
// //         report.studentSnapshot.profilePhoto,
// //       );
// //       setProfilePhotoBase64(base64); // new state
// //     }

// //     setQrDataUrl(qr);
// //     await new Promise((r) => setTimeout(r, 300));

// //     const { jsPDF } = await import("jspdf");
// //     const { default: html2canvas } = await import("html2canvas");

// //     if (!cardRef.current) return;

// //     const canvas = await html2canvas(cardRef.current, {
// //       scale: 2,
// //       useCORS: true,
// //       logging: false,
// //     });

// //     const imgData = canvas.toDataURL("image/png");
// //     const pdf = new jsPDF({
// //       orientation: "portrait",
// //       unit: "mm",
// //       format: "a4",
// //     });
// //     const pdfWidth = pdf.internal.pageSize.getWidth();
// //     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

// //     pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
// //     pdf.save(
// //       `ReportCard_${report.studentSnapshot.admissionNumber}_${report.termName}_${report.sessionName}.pdf`,
// //     );
// //     setIsPrinting(false);
// //   }

// //   const isThirdTerm = report.termName === TermName.THIRD;
// //   const avgScore = report.percentage.toFixed(1);

// //   return (
// //     <div>
// //       {showActions && (
// //         <div className="flex gap-3 mb-4 no-print">
// //           <button
// //             onClick={handleDownload}
// //             disabled={isPrinting}
// //             className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a5f] text-white text-sm font-medium hover:bg-[#152847] transition-colors disabled:opacity-50"
// //           >
// //             <Download className="w-4 h-4" />
// //             Download PDF
// //           </button>
// //           <button
// //             onClick={handlePrint}
// //             disabled={isPrinting}
// //             className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
// //           >
// //             <Printer className="w-4 h-4" />
// //             Print
// //           </button>
// //         </div>
// //       )}

// //       {/* Report Card */}
// //       <div
// //         ref={cardRef}
// //         className="bg-white max-w-[800px] mx-auto"
// //         style={{ fontFamily: "Georgia, serif", color: "#111" }}
// //       >
// //         {/* Header */}
// //         <div
// //           style={{
// //             background: "linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)",
// //             color: "white",
// //             padding: "24px 32px",
// //             position: "relative",
// //             overflow: "hidden",
// //           }}
// //         >
// //           {/* Decorative circle */}
// //           <div
// //             style={{
// //               position: "absolute",
// //               top: -40,
// //               right: -40,
// //               width: 150,
// //               height: 150,
// //               borderRadius: "50%",
// //               background: "rgba(245,158,11,0.08)",
// //             }}
// //           />
// //           <div
// //             style={{
// //               position: "absolute",
// //               bottom: -20,
// //               left: -20,
// //               width: 100,
// //               height: 100,
// //               borderRadius: "50%",
// //               background: "rgba(255,255,255,0.03)",
// //             }}
// //           />

// //           <div
// //             style={{
// //               display: "flex",
// //               justifyContent: "space-between",
// //               alignItems: "flex-start",
// //               position: "relative",
// //               zIndex: 1,
// //             }}
// //           >
// //             {/* School Info */}
// //             <div style={{ flex: 1 }}>
// //               <div
// //                 style={{
// //                   display: "flex",
// //                   alignItems: "center",
// //                   gap: 12,
// //                   marginBottom: 8,
// //                 }}
// //               >
// //                 <div
// //                   style={{
// //                     width: 48,
// //                     height: 48,
// //                     borderRadius: 12,
// //                     background: "linear-gradient(135deg, #f59e0b, #d97706)",
// //                     display: "flex",
// //                     alignItems: "center",
// //                     justifyContent: "center",
// //                     fontSize: 24,
// //                   }}
// //                 >
// //                   🎓
// //                 </div>
// //                 <div>
// //                   <h1
// //                     style={{
// //                       fontSize: 18,
// //                       fontWeight: "bold",
// //                       margin: 0,
// //                       letterSpacing: "-0.5px",
// //                     }}
// //                   >
// //                     God&apos;s Way Model Groups of Schools
// //                   </h1>
// //                   <p
// //                     style={{
// //                       fontSize: 11,
// //                       color: "rgba(255,255,255,0.5)",
// //                       margin: "2px 0 0",
// //                     }}
// //                   >
// //                     Excellence • Integrity • Faith
// //                   </p>
// //                 </div>
// //               </div>
// //               <div
// //                 style={{
// //                   fontSize: 11,
// //                   color: "rgba(255,255,255,0.5)",
// //                   lineHeight: 1.6,
// //                 }}
// //               >
// //                 <p style={{ margin: "2px 0" }}>📍 1 School Road, Nigeria</p>
// //                 <p style={{ margin: "2px 0" }}>📞 +234 800 000 0000</p>
// //                 <p style={{ margin: "2px 0" }}>✉️ info@godswayschools.edu.ng</p>
// //               </div>
// //             </div>

// //             {/* QR Code */}
// //             <div style={{ textAlign: "center" }}>
// //               {qrDataUrl ? (
// //                 <div
// //                   style={{ background: "white", padding: 8, borderRadius: 8 }}
// //                 >
// //                   <img
// //                     src={qrDataUrl}
// //                     alt="QR Code"
// //                     style={{ width: 70, height: 70, display: "block" }}
// //                   />
// //                   <p
// //                     style={{
// //                       fontSize: 9,
// //                       color: "#555",
// //                       margin: "4px 0 0",
// //                       textAlign: "center",
// //                     }}
// //                   >
// //                     Verify Report
// //                   </p>
// //                 </div>
// //               ) : (
// //                 <div
// //                   style={{
// //                     width: 86,
// //                     height: 86,
// //                     background: "rgba(255,255,255,0.05)",
// //                     borderRadius: 8,
// //                     border: "1px dashed rgba(255,255,255,0.2)",
// //                     display: "flex",
// //                     alignItems: "center",
// //                     justifyContent: "center",
// //                   }}
// //                 >
// //                   <span
// //                     style={{
// //                       fontSize: 10,
// //                       color: "rgba(255,255,255,0.3)",
// //                       textAlign: "center",
// //                       padding: 4,
// //                     }}
// //                   >
// //                     QR on Download
// //                   </span>
// //                 </div>
// //               )}
// //             </div>
// //           </div>

// //           {/* Report Title Bar */}
// //           <div
// //             style={{
// //               marginTop: 16,
// //               padding: "8px 16px",
// //               background: "rgba(245,158,11,0.15)",
// //               borderRadius: 8,
// //               border: "1px solid rgba(245,158,11,0.3)",
// //               display: "inline-flex",
// //               alignItems: "center",
// //               gap: 12,
// //             }}
// //           >
// //             <span
// //               style={{ color: "#f59e0b", fontSize: 13, fontWeight: "bold" }}
// //             >
// //               STUDENT REPORT CARD
// //             </span>
// //             <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
// //               {report.termName.toUpperCase()} TERM · {report.sessionName}{" "}
// //               SESSION
// //             </span>
// //           </div>
// //         </div>

// //         {/* Student Info Section */}
// //         <div
// //           style={{
// //             padding: "20px 32px",
// //             borderBottom: "2px solid #f0f4f8",
// //             display: "flex",
// //             gap: 20,
// //           }}
// //         >
// //           {/* Photo */}
// //           <div style={{ flexShrink: 0 }}>
// //             {report.studentSnapshot.profilePhoto ? (
// //               <img
// //                 src={profilePhotoBase64 || report.studentSnapshot.profilePhoto}
// //                 alt="Student"
// //                 style={{
// //                   width: 90,
// //                   height: 90,
// //                   objectFit: "cover",
// //                   borderRadius: 12,
// //                   border: "3px solid #1e3a5f",
// //                 }}
// //               />
// //             ) : (
// //               <div
// //                 style={{
// //                   width: 90,
// //                   height: 90,
// //                   borderRadius: 12,
// //                   background: "#e8eff7",
// //                   border: "3px solid #1e3a5f",
// //                   display: "flex",
// //                   alignItems: "center",
// //                   justifyContent: "center",
// //                   fontSize: 28,
// //                   color: "#1e3a5f",
// //                   fontWeight: "bold",
// //                 }}
// //               >
// //                 {report.studentSnapshot.firstName.charAt(0)}
// //                 {report.studentSnapshot.lastName.charAt(0)}
// //               </div>
// //             )}
// //           </div>

// //           {/* Student details */}
// //           <div
// //             style={{
// //               flex: 1,
// //               display: "grid",
// //               gridTemplateColumns: "1fr 1fr",
// //               gap: "4px 16px",
// //             }}
// //           >
// //             {[
// //               {
// //                 label: "Student Name",
// //                 value: `${report.studentSnapshot.firstName} ${report.studentSnapshot.lastName}`,
// //               },
// //               {
// //                 label: "Admission No.",
// //                 value: report.studentSnapshot.admissionNumber,
// //               },
// //               { label: "Class", value: report.className },
// //               { label: "Academic Session", value: report.sessionName },
// //               { label: "Term", value: `${report.termName.toUpperCase()} TERM` },
// //               {
// //                 label: "Date of Birth",
// //                 value: formatDate(report.studentSnapshot.dateOfBirth),
// //               },
// //               {
// //                 label: "Gender",
// //                 value:
// //                   report.studentSnapshot.gender.charAt(0).toUpperCase() +
// //                   report.studentSnapshot.gender.slice(1),
// //               },
// //               {
// //                 label: "Department",
// //                 value:
// //                   report.studentSnapshot.department !== "none"
// //                     ? report.studentSnapshot.department.toUpperCase()
// //                     : "N/A",
// //               },
// //             ].map(({ label, value }) => (
// //               <div key={label} style={{ padding: "4px 0" }}>
// //                 <span
// //                   style={{
// //                     fontSize: 10,
// //                     color: "#6b7280",
// //                     display: "block",
// //                     textTransform: "uppercase",
// //                     letterSpacing: "0.5px",
// //                   }}
// //                 >
// //                   {label}
// //                 </span>
// //                 <span
// //                   style={{ fontSize: 13, fontWeight: "600", color: "#111" }}
// //                 >
// //                   {value}
// //                 </span>
// //               </div>
// //             ))}
// //           </div>

// //           {/* Performance summary box */}
// //           <div
// //             style={{
// //               flexShrink: 0,
// //               background: "#1e3a5f",
// //               borderRadius: 12,
// //               padding: "16px 20px",
// //               color: "white",
// //               textAlign: "center",
// //               minWidth: 120,
// //             }}
// //           >
// //             <div
// //               style={{
// //                 fontSize: 36,
// //                 fontWeight: "bold",
// //                 color: "#f59e0b",
// //                 lineHeight: 1,
// //               }}
// //             >
// //               {avgScore}%
// //             </div>
// //             <div
// //               style={{
// //                 fontSize: 11,
// //                 color: "rgba(255,255,255,0.5)",
// //                 margin: "4px 0",
// //               }}
// //             >
// //               Overall Score
// //             </div>
// //             <div style={{ fontSize: 22, fontWeight: "bold", margin: "4px 0" }}>
// //               {report.grade}
// //             </div>
// //             <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
// //               Grade
// //             </div>
// //             <div
// //               style={{
// //                 marginTop: 8,
// //                 paddingTop: 8,
// //                 borderTop: "1px solid rgba(255,255,255,0.15)",
// //                 fontSize: 12,
// //               }}
// //             >
// //               <span style={{ color: "#f59e0b", fontWeight: "bold" }}>
// //                 {getOrdinal(report.position)}
// //               </span>
// //               <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>
// //                 {" "}
// //                 / {report.totalStudentsInClass} students
// //               </span>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Scores Table */}
// //         <div style={{ padding: "0 32px 20px" }}>
// //           <h3
// //             style={{
// //               fontSize: 13,
// //               fontWeight: "bold",
// //               color: "#1e3a5f",
// //               padding: "16px 0 8px",
// //               borderBottom: "2px solid #1e3a5f",
// //               marginBottom: 0,
// //             }}
// //           >
// //             ACADEMIC PERFORMANCE
// //           </h3>
// //           <table
// //             style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
// //           >
// //             <thead>
// //               <tr style={{ background: "#f0f4f8" }}>
// //                 <th
// //                   style={{
// //                     padding: "8px 10px",
// //                     textAlign: "left",
// //                     fontSize: 11,
// //                     color: "#374151",
// //                     fontWeight: "600",
// //                     borderBottom: "1px solid #e2e8f0",
// //                   }}
// //                 >
// //                   SUBJECT
// //                 </th>
// //                 <th
// //                   style={{
// //                     padding: "8px 6px",
// //                     textAlign: "center",
// //                     fontSize: 10,
// //                     color: "#374151",
// //                     fontWeight: "600",
// //                     borderBottom: "1px solid #e2e8f0",
// //                   }}
// //                 >
// //                   TEST
// //                   <br />
// //                   (40)
// //                 </th>
// //                 <th
// //                   style={{
// //                     padding: "8px 6px",
// //                     textAlign: "center",
// //                     fontSize: 10,
// //                     color: "#374151",
// //                     fontWeight: "600",
// //                     borderBottom: "1px solid #e2e8f0",
// //                   }}
// //                 >
// //                   EXAM
// //                   <br />
// //                   (60)
// //                 </th>
// //                 <th
// //                   style={{
// //                     padding: "8px 6px",
// //                     textAlign: "center",
// //                     fontSize: 10,
// //                     color: "#374151",
// //                     fontWeight: "600",
// //                     borderBottom: "1px solid #e2e8f0",
// //                   }}
// //                 >
// //                   PRAC.
// //                   <br />
// //                   (20)
// //                 </th>
// //                 <th
// //                   style={{
// //                     padding: "8px 6px",
// //                     textAlign: "center",
// //                     fontSize: 10,
// //                     color: "#374151",
// //                     fontWeight: "600",
// //                     borderBottom: "1px solid #e2e8f0",
// //                   }}
// //                 >
// //                   TOTAL
// //                 </th>
// //                 <th
// //                   style={{
// //                     padding: "8px 6px",
// //                     textAlign: "center",
// //                     fontSize: 10,
// //                     color: "#374151",
// //                     fontWeight: "600",
// //                     borderBottom: "1px solid #e2e8f0",
// //                   }}
// //                 >
// //                   GRADE
// //                 </th>
// //                 <th
// //                   style={{
// //                     padding: "8px 6px",
// //                     textAlign: "center",
// //                     fontSize: 10,
// //                     color: "#374151",
// //                     fontWeight: "600",
// //                     borderBottom: "1px solid #e2e8f0",
// //                   }}
// //                 >
// //                   REMARK
// //                 </th>
// //               </tr>
// //             </thead>
// //             <tbody>
// //               {report.subjects.map((subject: ISubjectScore, i) => (
// //                 <tr
// //                   key={subject.subject}
// //                   style={{ background: i % 2 === 0 ? "white" : "#fafbfc" }}
// //                 >
// //                   <td
// //                     style={{
// //                       padding: "7px 10px",
// //                       borderBottom: "1px solid #f0f4f8",
// //                       fontWeight: "500",
// //                     }}
// //                   >
// //                     {subject.subjectName}
// //                   </td>
// //                   <td
// //                     style={{
// //                       padding: "7px 6px",
// //                       borderBottom: "1px solid #f0f4f8",
// //                       textAlign: "center",
// //                     }}
// //                   >
// //                     {subject.testScore}
// //                   </td>
// //                   <td
// //                     style={{
// //                       padding: "7px 6px",
// //                       borderBottom: "1px solid #f0f4f8",
// //                       textAlign: "center",
// //                     }}
// //                   >
// //                     {subject.examScore}
// //                   </td>
// //                   <td
// //                     style={{
// //                       padding: "7px 6px",
// //                       borderBottom: "1px solid #f0f4f8",
// //                       textAlign: "center",
// //                       color: subject.hasPractical ? "#111" : "#ccc",
// //                     }}
// //                   >
// //                     {subject.hasPractical ? subject.practicalScore : "-"}
// //                   </td>
// //                   <td
// //                     style={{
// //                       padding: "7px 6px",
// //                       borderBottom: "1px solid #f0f4f8",
// //                       textAlign: "center",
// //                       fontWeight: "bold",
// //                       color:
// //                         subject.totalScore < subject.maxTotalScore * 0.5
// //                           ? "#dc2626"
// //                           : "#1e3a5f",
// //                     }}
// //                   >
// //                     {subject.totalScore}/{subject.maxTotalScore}
// //                   </td>
// //                   <td
// //                     style={{
// //                       padding: "7px 6px",
// //                       borderBottom: "1px solid #f0f4f8",
// //                       textAlign: "center",
// //                     }}
// //                   >
// //                     <span
// //                       style={{
// //                         display: "inline-block",
// //                         padding: "2px 8px",
// //                         borderRadius: 4,
// //                         fontSize: 11,
// //                         fontWeight: "bold",
// //                         background:
// //                           subject.grade === "A"
// //                             ? "#d1fae5"
// //                             : subject.grade === "F"
// //                               ? "#fee2e2"
// //                               : "#fef3c7",
// //                         color:
// //                           subject.grade === "A"
// //                             ? "#065f46"
// //                             : subject.grade === "F"
// //                               ? "#991b1b"
// //                               : "#92400e",
// //                       }}
// //                     >
// //                       {subject.grade}
// //                     </span>
// //                   </td>
// //                   <td
// //                     style={{
// //                       padding: "7px 6px",
// //                       borderBottom: "1px solid #f0f4f8",
// //                       textAlign: "center",
// //                       fontSize: 11,
// //                       color: "#6b7280",
// //                     }}
// //                   >
// //                     {subject.remark}
// //                   </td>
// //                 </tr>
// //               ))}
// //             </tbody>
// //             <tfoot>
// //               <tr style={{ background: "#1e3a5f", color: "white" }}>
// //                 <td
// //                   colSpan={4}
// //                   style={{
// //                     padding: "8px 10px",
// //                     fontWeight: "bold",
// //                     fontSize: 12,
// //                   }}
// //                 >
// //                   TOTAL
// //                 </td>
// //                 <td
// //                   style={{
// //                     padding: "8px 6px",
// //                     textAlign: "center",
// //                     fontWeight: "bold",
// //                     fontSize: 13,
// //                     color: "#f59e0b",
// //                   }}
// //                 >
// //                   {report.totalObtained}/{report.totalObtainable}
// //                 </td>
// //                 <td
// //                   style={{
// //                     padding: "8px 6px",
// //                     textAlign: "center",
// //                     fontWeight: "bold",
// //                     color: "#f59e0b",
// //                   }}
// //                 >
// //                   {report.grade}
// //                 </td>
// //                 <td
// //                   style={{
// //                     padding: "8px 6px",
// //                     textAlign: "center",
// //                     fontSize: 12,
// //                   }}
// //                 >
// //                   {avgScore}%
// //                 </td>
// //               </tr>
// //             </tfoot>
// //           </table>
// //         </div>

// //         {/* Grading Scale */}
// //         <div style={{ padding: "0 32px 16px" }}>
// //           <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
// //             <span style={{ fontSize: 10, color: "#6b7280", marginRight: 4 }}>
// //               Grade Scale:
// //             </span>
// //             {[
// //               {
// //                 grade: "A",
// //                 range: "75-100%",
// //                 color: "#d1fae5",
// //                 text: "#065f46",
// //               },
// //               {
// //                 grade: "B",
// //                 range: "65-74%",
// //                 color: "#dbeafe",
// //                 text: "#1e40af",
// //               },
// //               {
// //                 grade: "C",
// //                 range: "55-64%",
// //                 color: "#fef3c7",
// //                 text: "#92400e",
// //               },
// //               {
// //                 grade: "D",
// //                 range: "45-54%",
// //                 color: "#f3f4f6",
// //                 text: "#374151",
// //               },
// //               {
// //                 grade: "E",
// //                 range: "40-44%",
// //                 color: "#fde68a",
// //                 text: "#78350f",
// //               },
// //               { grade: "F", range: "0-39%", color: "#fee2e2", text: "#991b1b" },
// //             ].map((g) => (
// //               <span
// //                 key={g.grade}
// //                 style={{
// //                   padding: "2px 8px",
// //                   borderRadius: 4,
// //                   fontSize: 10,
// //                   fontWeight: "600",
// //                   background: g.color,
// //                   color: g.text,
// //                 }}
// //               >
// //                 {g.grade}: {g.range}
// //               </span>
// //             ))}
// //           </div>
// //         </div>

// //         {/* Attendance + Comments */}
// //         <div
// //           style={{
// //             padding: "0 32px 20px",
// //             display: "grid",
// //             gridTemplateColumns: "1fr 1fr",
// //             gap: 16,
// //           }}
// //         >
// //           {/* Attendance */}
// //           <div
// //             style={{
// //               background: "#f8fafc",
// //               borderRadius: 10,
// //               padding: "14px 16px",
// //               border: "1px solid #e2e8f0",
// //             }}
// //           >
// //             <h4
// //               style={{
// //                 fontSize: 12,
// //                 fontWeight: "bold",
// //                 color: "#1e3a5f",
// //                 margin: "0 0 10px",
// //                 textTransform: "uppercase",
// //                 letterSpacing: "0.5px",
// //               }}
// //             >
// //               Attendance Record
// //             </h4>
// //             {[
// //               {
// //                 label: "School Days Open",
// //                 value: report.attendance.schoolDaysOpen,
// //               },
// //               { label: "Days Present", value: report.attendance.daysPresent },
// //               { label: "Days Absent", value: report.attendance.daysAbsent },
// //             ].map(({ label, value }) => (
// //               <div
// //                 key={label}
// //                 style={{
// //                   display: "flex",
// //                   justifyContent: "space-between",
// //                   padding: "3px 0",
// //                   borderBottom: "1px solid #e8edf2",
// //                 }}
// //               >
// //                 <span style={{ fontSize: 11, color: "#6b7280" }}>{label}:</span>
// //                 <span
// //                   style={{ fontSize: 12, fontWeight: "600", color: "#111" }}
// //                 >
// //                   {value}
// //                 </span>
// //               </div>
// //             ))}
// //             <div
// //               style={{
// //                 marginTop: 8,
// //                 padding: "4px 8px",
// //                 background: "#1e3a5f",
// //                 borderRadius: 6,
// //                 display: "flex",
// //                 justifyContent: "space-between",
// //               }}
// //             >
// //               <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
// //                 Attendance Rate:
// //               </span>
// //               <span
// //                 style={{ fontSize: 12, fontWeight: "bold", color: "#f59e0b" }}
// //               >
// //                 {report.attendance.attendancePercentage.toFixed(0)}%
// //               </span>
// //             </div>
// //           </div>

// //           {/* Comments */}
// //           <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
// //             <div
// //               style={{
// //                 background: "#f8fafc",
// //                 borderRadius: 10,
// //                 padding: "12px 14px",
// //                 border: "1px solid #e2e8f0",
// //                 flex: 1,
// //               }}
// //             >
// //               <h4
// //                 style={{
// //                   fontSize: 11,
// //                   fontWeight: "bold",
// //                   color: "#1e3a5f",
// //                   margin: "0 0 6px",
// //                   textTransform: "uppercase",
// //                 }}
// //               >
// //                 Class Teacher&apos;s Comment
// //               </h4>
// //               <p
// //                 style={{
// //                   fontSize: 12,
// //                   color: "#374151",
// //                   margin: 0,
// //                   lineHeight: 1.5,
// //                   fontStyle: "italic",
// //                 }}
// //               >
// //                 {report.teacherComment ?? "No comment provided."}
// //               </p>
// //             </div>
// //             <div
// //               style={{
// //                 background: "#f8fafc",
// //                 borderRadius: 10,
// //                 padding: "12px 14px",
// //                 border: "1px solid #e2e8f0",
// //                 flex: 1,
// //               }}
// //             >
// //               <h4
// //                 style={{
// //                   fontSize: 11,
// //                   fontWeight: "bold",
// //                   color: "#1e3a5f",
// //                   margin: "0 0 6px",
// //                   textTransform: "uppercase",
// //                 }}
// //               >
// //                 Principal&apos;s Comment
// //               </h4>
// //               <p
// //                 style={{
// //                   fontSize: 12,
// //                   color: "#374151",
// //                   margin: 0,
// //                   lineHeight: 1.5,
// //                   fontStyle: "italic",
// //                 }}
// //               >
// //                 {report.principalComment ?? "Keep up the good work!"}
// //               </p>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Promotion Status (Third Term Only) */}
// //         {isThirdTerm && (
// //           <div style={{ padding: "0 32px 16px" }}>
// //             <div
// //               style={{
// //                 padding: "12px 16px",
// //                 borderRadius: 10,
// //                 background: report.isPromoted
// //                   ? "linear-gradient(135deg, #d1fae5, #a7f3d0)"
// //                   : "linear-gradient(135deg, #fee2e2, #fecaca)",
// //                 border: `1px solid ${report.isPromoted ? "#6ee7b7" : "#fca5a5"}`,
// //                 display: "flex",
// //                 alignItems: "center",
// //                 gap: 10,
// //               }}
// //             >
// //               <span style={{ fontSize: 20 }}>
// //                 {report.isPromoted ? "🎉" : "📋"}
// //               </span>
// //               <div>
// //                 <p
// //                   style={{
// //                     fontSize: 13,
// //                     fontWeight: "bold",
// //                     color: report.isPromoted ? "#065f46" : "#991b1b",
// //                     margin: 0,
// //                   }}
// //                 >
// //                   {report.isPromoted
// //                     ? `PROMOTED TO: ${report.promotedToClass ?? "Next Class"}`
// //                     : "NOT PROMOTED — Performance Review Required"}
// //                 </p>
// //                 {report.isPromoted && (
// //                   <p
// //                     style={{
// //                       fontSize: 11,
// //                       color: "#065f46",
// //                       margin: "2px 0 0",
// //                       opacity: 0.7,
// //                     }}
// //                   >
// //                     Congratulations! Continue to excel in the next academic
// //                     year.
// //                   </p>
// //                 )}
// //               </div>
// //             </div>
// //           </div>
// //         )}

// //         {/* Next Term Resumption */}
// //         {report.nextTermResumptionDate && (
// //           <div style={{ padding: "0 32px 20px" }}>
// //             <div
// //               style={{
// //                 padding: "10px 16px",
// //                 borderRadius: 8,
// //                 background: "#fffbeb",
// //                 border: "1px solid #fde68a",
// //                 display: "flex",
// //                 alignItems: "center",
// //                 gap: 8,
// //               }}
// //             >
// //               <span style={{ fontSize: 16 }}>📅</span>
// //               <div>
// //                 <span
// //                   style={{
// //                     fontSize: 11,
// //                     color: "#78350f",
// //                     fontWeight: "600",
// //                     textTransform: "uppercase",
// //                   }}
// //                 >
// //                   Next Term Resumption:
// //                 </span>
// //                 <span
// //                   style={{
// //                     fontSize: 13,
// //                     color: "#92400e",
// //                     fontWeight: "bold",
// //                     marginLeft: 8,
// //                   }}
// //                 >
// //                   {formatDate(report.nextTermResumptionDate)}
// //                 </span>
// //               </div>
// //             </div>
// //           </div>
// //         )}

// //         {/* Footer */}
// //         <div
// //           style={{
// //             padding: "16px 32px",
// //             background: "#0a1628",
// //             color: "white",
// //             display: "flex",
// //             justifyContent: "space-between",
// //             alignItems: "center",
// //           }}
// //         >
// //           <div>
// //             <p
// //               style={{
// //                 fontSize: 10,
// //                 color: "rgba(255,255,255,0.4)",
// //                 margin: 0,
// //               }}
// //             >
// //               Report generated on{" "}
// //               {new Date().toLocaleDateString("en-NG", {
// //                 day: "2-digit",
// //                 month: "long",
// //                 year: "numeric",
// //               })}
// //             </p>
// //             <p
// //               style={{
// //                 fontSize: 10,
// //                 color: "rgba(255,255,255,0.3)",
// //                 margin: "2px 0 0",
// //               }}
// //             >
// //               Report ID: {report._id} · Scan QR code to verify authenticity
// //             </p>
// //           </div>
// //           <div style={{ textAlign: "right" }}>
// //             <div
// //               style={{
// //                 width: 120,
// //                 height: 1,
// //                 background: "rgba(255,255,255,0.2)",
// //                 marginBottom: 4,
// //               }}
// //             />
// //             <p
// //               style={{
// //                 fontSize: 10,
// //                 color: "rgba(255,255,255,0.4)",
// //                 margin: 0,
// //               }}
// //             >
// //               Principal&apos;s Signature
// //             </p>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import { useRef, useState } from "react";
// import { Download, Printer } from "lucide-react";
// import QRCode from "qrcode";
// import type { IReportCard, ISubjectScore } from "@/types";
// import { TermName } from "@/types/enums";
// import { formatDate, getOrdinal } from "@/lib/utils";

// interface ReportCardProps {
//   report: IReportCard & {
//     sessionName: string;
//     termName: TermName;
//     className: string;
//   };
//   showActions?: boolean;
// }

// const SCHOOL_LOGO_URL =
//   "https://res.cloudinary.com/disxrmlco/image/upload/v1771881211/android-chrome-512x512_mc7kty.png";

// export default function ReportCardComponent({
//   report,
//   showActions = true,
// }: ReportCardProps) {
//   const cardRef = useRef<HTMLDivElement>(null);
//   const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
//   const [isPrinting, setIsPrinting] = useState(false);
//   const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(null);
//   const [logoBase64, setLogoBase64] = useState<string | null>(null);

//   async function generateQR() {
//     const verifyUrl = `${window.location.origin}/verify-report/${report._id}`;
//     const dataUrl = await QRCode.toDataURL(verifyUrl, { width: 100, margin: 1 });
//     return dataUrl;
//   }

//   async function convertImageToBase64(url: string): Promise<string> {
//     try {
//       const response = await fetch(url);
//       const blob = await response.blob();
//       return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onloadend = () => resolve(reader.result as string);
//         reader.onerror = reject;
//         reader.readAsDataURL(blob);
//       });
//     } catch {
//       return "";
//     }
//   }

//   async function handlePrint() {
//     setIsPrinting(true);
//     const qr = await generateQR();
//     setQrDataUrl(qr);
//     const logo = await convertImageToBase64(SCHOOL_LOGO_URL);
//     setLogoBase64(logo);
//     await new Promise((r) => setTimeout(r, 300));
//     window.print();
//     setIsPrinting(false);
//   }

//   async function handleDownload() {
//     setIsPrinting(true);
//     const qr = await generateQR();
//     setQrDataUrl(qr);

//     // Convert images to base64 for html2canvas
//     const logo = await convertImageToBase64(SCHOOL_LOGO_URL);
//     setLogoBase64(logo);

//     if (report.studentSnapshot.profilePhoto) {
//       const base64 = await convertImageToBase64(report.studentSnapshot.profilePhoto);
//       setProfilePhotoBase64(base64);
//     }

//     await new Promise((r) => setTimeout(r, 400));

//     const { jsPDF } = await import("jspdf");
//     const { default: html2canvas } = await import("html2canvas");

//     if (!cardRef.current) return;

//     // A4 dimensions in px at 96dpi: 794 x 1123
//     const A4_WIDTH_MM = 210;
//     const A4_HEIGHT_MM = 297;

//     // Use getBoundingClientRect to capture only the card, no surrounding whitespace
//     const rect = cardRef.current.getBoundingClientRect();

//     const canvas = await html2canvas(cardRef.current, {
//       scale: 4,
//       useCORS: true,
//       allowTaint: false,
//       logging: false,
//       width: rect.width,
//       height: rect.height,
//       windowWidth: rect.width,
//       x: 0,
//       y: 0,
//     });

//     // PNG for lossless sharpness — no JPEG compression artifacts on text/lines
//     const imgData = canvas.toDataURL("image/png");

//     const pdf = new jsPDF({
//       orientation: "portrait",
//       unit: "mm",
//       format: "a4",
//       compress: true,
//     });

//     const pdfWidth = A4_WIDTH_MM;
//     const pdfHeight = A4_HEIGHT_MM;

//     const imgAspect = canvas.width / canvas.height;

//     let imgW = pdfWidth;
//     let imgH = pdfWidth / imgAspect;

//     if (imgH > pdfHeight) {
//       imgH = pdfHeight;
//       imgW = pdfHeight * imgAspect;
//     }

//     // Place at top-left corner — no vertical offset that creates blank space
//     pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
//     pdf.save(
//       `ReportCard_${report.studentSnapshot.admissionNumber}_${report.termName}_${report.sessionName}.pdf`
//     );
//     setIsPrinting(false);
//   }

//   const isThirdTerm = report.termName === TermName.THIRD;
//   const avgScore = report.percentage.toFixed(1);

//   return (
//     <div>
//       {showActions && (
//         <div className="flex gap-3 mb-4 no-print">
//           <button
//             onClick={handleDownload}
//             disabled={isPrinting}
//             className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a5f] text-white text-sm font-medium hover:bg-[#152847] transition-colors disabled:opacity-50"
//           >
//             <Download className="w-4 h-4" />
//             Download PDF
//           </button>
//           <button
//             onClick={handlePrint}
//             disabled={isPrinting}
//             className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
//           >
//             <Printer className="w-4 h-4" />
//             Print
//           </button>
//         </div>
//       )}

//       {/* Report Card — fixed A4 width */}
//       <div
//         ref={cardRef}
//         className="bg-white"
//         style={{
//           fontFamily: "Georgia, serif",
//           color: "#111",
//           width: "794px", // A4 at 96dpi
//           margin: "0 auto",
//           boxSizing: "border-box",
//         }}
//       >
//         {/* ── HEADER ── */}
//         <div
//           style={{
//             background: "linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)",
//             color: "white",
//             padding: "20px 28px",
//             position: "relative",
//             overflow: "hidden",
//           }}
//         >
//           {/* Decorative circles */}
//           <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(245,158,11,0.08)" }} />
//           <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

//           <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>

//             {/* LEFT — School Logo */}
//             <div style={{ flexShrink: 0, width: 110, height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
//               <img
//                 src={logoBase64 || SCHOOL_LOGO_URL}
//                 alt="School Logo"
//                 crossOrigin="anonymous"
//                 style={{ width: 110, height: 110, objectFit: "contain", borderRadius: 12 }}
//               />
//             </div>

//             {/* CENTER — School Info */}
//             <div style={{ flex: 1, textAlign: "center", padding: "0 20px" }}>
//               <h1
//                 style={{
//                   fontSize: 20,
//                   fontWeight: "900",
//                   margin: "0 0 4px",
//                   letterSpacing: "0.5px",
//                   textTransform: "uppercase",
//                   color: "white",
//                   lineHeight: 1.2,
//                 }}
//               >
//                 GOD&apos;S WAY MODEL GROUPS OF SCHOOLS
//               </h1>
//               <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 8px", letterSpacing: "2px" }}>
//                 SOWING THE SEED OF MERIT AND EXCELLENCE
//               </p>
//               <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
//                 <p style={{ margin: 0 }}>📍 NO 5C SIYANBOLA STREET, OSOGBO, OSUN STATE</p>
//                 <p style={{ margin: 0 }}>📞 08069825847, 08067110930</p>
//                 <p style={{ margin: 0 }}>✉️ godswaygroupofschools@gmail.com</p>
//               </div>
//             </div>

//             {/* RIGHT — QR Code */}
//             <div style={{ flexShrink: 0, textAlign: "center" }}>
//               {qrDataUrl ? (
//                 <div style={{ background: "white", padding: 8, borderRadius: 8 }}>
//                   <img src={qrDataUrl} alt="QR Code" style={{ width: 90, height: 90, display: "block" }} />
//                   <p style={{ fontSize: 9, color: "#555", margin: "4px 0 0", textAlign: "center" }}>Verify Report</p>
//                 </div>
//               ) : (
//                 <div
//                   style={{
//                     width: 106,
//                     height: 106,
//                     background: "rgba(255,255,255,0.05)",
//                     borderRadius: 8,
//                     border: "1px dashed rgba(255,255,255,0.2)",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}
//                 >
//                   <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 4 }}>
//                     QR on Download
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Report Title Bar — centered */}
//           <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
//             <div
//               style={{
//                 padding: "8px 20px",
//                 background: "rgba(245,158,11,0.15)",
//                 borderRadius: 8,
//                 border: "1px solid rgba(245,158,11,0.3)",
//                 display: "inline-flex",
//                 alignItems: "center",
//                 gap: 12,
//               }}
//             >
//               <span style={{ color: "#f59e0b", fontSize: 13, fontWeight: "bold" }}>
//                 STUDENT REPORT CARD
//               </span>
//               <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
//                 {report.termName.toUpperCase()} TERM · {report.sessionName} SESSION
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* ── STUDENT INFO ── */}
//         <div
//           style={{
//             padding: "16px 28px",
//             borderBottom: "2px solid #f0f4f8",
//             display: "flex",
//             gap: 16,
//             alignItems: "stretch",
//           }}
//         >
//           {/* Photo */}
//           <div style={{ flexShrink: 0 }}>
//             {report.studentSnapshot.profilePhoto ? (
//               <img
//                 src={profilePhotoBase64 || report.studentSnapshot.profilePhoto}
//                 alt="Student"
//                 style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 12, border: "3px solid #1e3a5f" }}
//               />
//             ) : (
//               <div
//                 style={{
//                   width: 90,
//                   height: 90,
//                   borderRadius: 12,
//                   background: "#e8eff7",
//                   border: "3px solid #1e3a5f",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontSize: 28,
//                   color: "#1e3a5f",
//                   fontWeight: "bold",
//                 }}
//               >
//                 {report.studentSnapshot.firstName.charAt(0)}
//                 {report.studentSnapshot.lastName.charAt(0)}
//               </div>
//             )}
//           </div>

//           {/* Student details grid */}
//           <div
//             style={{
//               flex: 1,
//               display: "grid",
//               gridTemplateColumns: "1fr 1fr",
//               gap: "2px 16px",
//               alignContent: "start",
//             }}
//           >
//             {[
//               { label: "Student Name", value: `${report.studentSnapshot.firstName} ${report.studentSnapshot.lastName}` },
//               { label: "Admission No.", value: report.studentSnapshot.admissionNumber },
//               { label: "Class", value: report.className },
//               { label: "Academic Session", value: report.sessionName },
//               { label: "Term", value: `${report.termName.toUpperCase()} TERM` },
//               { label: "Date of Birth", value: formatDate(report.studentSnapshot.dateOfBirth) },
//               { label: "Gender", value: report.studentSnapshot.gender.charAt(0).toUpperCase() + report.studentSnapshot.gender.slice(1) },
//               { label: "Department", value: report.studentSnapshot.department !== "none" ? report.studentSnapshot.department.toUpperCase() : "N/A" },
//             ].map(({ label, value }) => (
//               <div key={label} style={{ padding: "3px 0" }}>
//                 <span style={{ fontSize: 10, color: "#6b7280", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
//                   {label}
//                 </span>
//                 <span style={{ fontSize: 13, fontWeight: "600", color: "#111" }}>{value}</span>
//               </div>
//             ))}
//           </div>

//           {/* Performance box */}
//           <div
//             style={{
//               flexShrink: 0,
//               background: "#1e3a5f",
//               borderRadius: 12,
//               padding: "14px 18px",
//               color: "white",
//               textAlign: "center",
//               minWidth: 120,
//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
//             }}
//           >
//             <div style={{ fontSize: 34, fontWeight: "bold", color: "#f59e0b", lineHeight: 1 }}>{avgScore}%</div>
//             <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "4px 0" }}>Overall Score</div>
//             <div style={{ fontSize: 22, fontWeight: "bold", margin: "4px 0" }}>{report.grade}</div>
//             <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Grade</div>
//             <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.15)", fontSize: 12 }}>
//               <span style={{ color: "#f59e0b", fontWeight: "bold" }}>{getOrdinal(report.position)}</span>
//               <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}> / {report.totalStudentsInClass} students</span>
//             </div>
//           </div>
//         </div>

//         {/* ── SCORES TABLE ── */}
//         <div style={{ padding: "0 28px 16px" }}>
//           <h3 style={{ fontSize: 13, fontWeight: "bold", color: "#1e3a5f", padding: "12px 0 8px", borderBottom: "2px solid #1e3a5f", marginBottom: 0 }}>
//             ACADEMIC PERFORMANCE
//           </h3>
//           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
//             <thead>
//               <tr style={{ background: "#f0f4f8" }}>
//                 {["SUBJECT", "TEST\n(40)", "EXAM\n(60)", "PRAC.\n(20)", "TOTAL", "GRADE", "REMARK"].map((h, i) => (
//                   <th
//                     key={i}
//                     style={{
//                       padding: "8px 6px",
//                       textAlign: i === 0 ? "left" : "center",
//                       fontSize: 10,
//                       color: "#374151",
//                       fontWeight: "600",
//                       borderBottom: "1px solid #e2e8f0",
//                       paddingLeft: i === 0 ? 10 : 6,
//                       whiteSpace: "pre-line",
//                     }}
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {report.subjects.map((subject: ISubjectScore, i) => (
//                 <tr key={subject.subject} style={{ background: i % 2 === 0 ? "white" : "#fafbfc" }}>
//                   <td style={{ padding: "6px 10px", borderBottom: "1px solid #f0f4f8", fontWeight: "500" }}>
//                     {subject.subjectName}
//                   </td>
//                   <td style={{ padding: "6px", borderBottom: "1px solid #f0f4f8", textAlign: "center" }}>{subject.testScore}</td>
//                   <td style={{ padding: "6px", borderBottom: "1px solid #f0f4f8", textAlign: "center" }}>{subject.examScore}</td>
//                   <td style={{ padding: "6px", borderBottom: "1px solid #f0f4f8", textAlign: "center", color: subject.hasPractical ? "#111" : "#ccc" }}>
//                     {subject.hasPractical ? subject.practicalScore : "-"}
//                   </td>
//                   <td
//                     style={{
//                       padding: "6px",
//                       borderBottom: "1px solid #f0f4f8",
//                       textAlign: "center",
//                       fontWeight: "bold",
//                       color: subject.totalScore < subject.maxTotalScore * 0.5 ? "#dc2626" : "#1e3a5f",
//                     }}
//                   >
//                     {subject.totalScore}/{subject.maxTotalScore}
//                   </td>
//                   <td style={{ padding: "6px", borderBottom: "1px solid #f0f4f8", textAlign: "center" }}>
//                     <span
//                       style={{
//                         display: "inline-block",
//                         padding: "2px 8px",
//                         borderRadius: 4,
//                         fontSize: 11,
//                         fontWeight: "bold",
//                         background: subject.grade === "A" ? "#d1fae5" : subject.grade === "F" ? "#fee2e2" : "#fef3c7",
//                         color: subject.grade === "A" ? "#065f46" : subject.grade === "F" ? "#991b1b" : "#92400e",
//                       }}
//                     >
//                       {subject.grade}
//                     </span>
//                   </td>
//                   <td style={{ padding: "6px", borderBottom: "1px solid #f0f4f8", textAlign: "center", fontSize: 11, color: "#6b7280" }}>
//                     {subject.remark}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//             <tfoot>
//               <tr>
//                 {/* TOTAL row with full background */}
//                 <td
//                   colSpan={4}
//                   style={{
//                     padding: "9px 10px",
//                     fontWeight: "bold",
//                     fontSize: 12,
//                     background: "#1e3a5f",
//                     color: "white",
//                   }}
//                 >
//                   TOTAL
//                 </td>
//                 <td
//                   style={{
//                     padding: "9px 6px",
//                     textAlign: "center",
//                     fontWeight: "bold",
//                     fontSize: 13,
//                     color: "#f59e0b",
//                     background: "#1e3a5f",
//                   }}
//                 >
//                   {report.totalObtained}/{report.totalObtainable}
//                 </td>
//                 <td
//                   style={{
//                     padding: "9px 6px",
//                     textAlign: "center",
//                     fontWeight: "bold",
//                     color: "#f59e0b",
//                     background: "#1e3a5f",
//                   }}
//                 >
//                   {report.grade}
//                 </td>
//                 <td
//                   style={{
//                     padding: "9px 6px",
//                     textAlign: "center",
//                     fontSize: 12,
//                     color: "white",
//                     background: "#1e3a5f",
//                   }}
//                 >
//                   {avgScore}%
//                 </td>
//               </tr>
//             </tfoot>
//           </table>
//         </div>

//         {/* ── GRADE SCALE ── */}
//         <div style={{ padding: "0 28px 14px" }}>
//           <div
//             style={{
//               display: "flex",
//               gap: 4,
//               flexWrap: "wrap",
//               alignItems: "center",
//               padding: "8px 12px",
//               background: "#f8fafc",
//               borderRadius: 8,
//               border: "1px solid #e2e8f0",
//             }}
//           >
//             <span style={{ fontSize: 10, color: "#6b7280", marginRight: 4, whiteSpace: "nowrap" }}>Grade Scale:</span>
//             {[
//               { grade: "A", range: "75–100%", color: "#d1fae5", text: "#065f46" },
//               { grade: "B", range: "65–74%", color: "#dbeafe", text: "#1e40af" },
//               { grade: "C", range: "55–64%", color: "#fef3c7", text: "#92400e" },
//               { grade: "D", range: "45–54%", color: "#f3f4f6", text: "#374151" },
//               { grade: "E", range: "40–44%", color: "#fde68a", text: "#78350f" },
//               { grade: "F", range: "0–39%", color: "#fee2e2", text: "#991b1b" },
//             ].map((g) => (
//               <span
//                 key={g.grade}
//                 style={{
//                   padding: "3px 10px",
//                   borderRadius: 4,
//                   fontSize: 10,
//                   fontWeight: "600",
//                   background: g.color,
//                   color: g.text,
//                   whiteSpace: "nowrap",
//                 }}
//               >
//                 {g.grade}: {g.range}
//               </span>
//             ))}
//           </div>
//         </div>

//         {/* ── ATTENDANCE + COMMENTS ── */}
//         <div
//           style={{
//             padding: "0 28px 16px",
//             display: "grid",
//             gridTemplateColumns: "1fr 1fr",
//             gap: 16,
//           }}
//         >
//           {/* Attendance */}
//           <div
//             style={{
//               background: "#f8fafc",
//               borderRadius: 10,
//               padding: "14px 16px",
//               border: "1px solid #e2e8f0",
//               overflow: "hidden",
//             }}
//           >
//             <h4 style={{ fontSize: 12, fontWeight: "bold", color: "#1e3a5f", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
//               Attendance Record
//             </h4>
//             {[
//               { label: "School Days Open", value: report.attendance.schoolDaysOpen },
//               { label: "Days Present", value: report.attendance.daysPresent },
//               { label: "Days Absent", value: report.attendance.daysAbsent },
//             ].map(({ label, value }) => (
//               <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #e8edf2" }}>
//                 <span style={{ fontSize: 11, color: "#6b7280" }}>{label}:</span>
//                 <span style={{ fontSize: 12, fontWeight: "600", color: "#111" }}>{value}</span>
//               </div>
//             ))}
//             {/* Attendance Rate — full-width background fix */}
//             <div
//               style={{
//                 marginTop: 8,
//                 marginLeft: -16,
//                 marginRight: -16,
//                 marginBottom: -14,
//                 padding: "6px 16px",
//                 background: "#1e3a5f",
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Attendance Rate:</span>
//               <span style={{ fontSize: 12, fontWeight: "bold", color: "#f59e0b" }}>
//                 {report.attendance.attendancePercentage.toFixed(0)}%
//               </span>
//             </div>
//           </div>

//           {/* Comments */}
//           <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//             <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0", flex: 1 }}>
//               <h4 style={{ fontSize: 11, fontWeight: "bold", color: "#1e3a5f", margin: "0 0 6px", textTransform: "uppercase" }}>
//                 Class Teacher&apos;s Comment
//               </h4>
//               <p style={{ fontSize: 12, color: "#374151", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
//                 {report.teacherComment ?? "No comment provided."}
//               </p>
//             </div>
//             <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0", flex: 1 }}>
//               <h4 style={{ fontSize: 11, fontWeight: "bold", color: "#1e3a5f", margin: "0 0 6px", textTransform: "uppercase" }}>
//                 Principal&apos;s Comment
//               </h4>
//               <p style={{ fontSize: 12, color: "#374151", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
//                 {report.principalComment ?? "Keep up the good work!"}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* ── PROMOTION STATUS (Third Term only) ── */}
//         {isThirdTerm && (
//           <div style={{ padding: "0 28px 14px" }}>
//             <div
//               style={{
//                 padding: "12px 16px",
//                 borderRadius: 10,
//                 background: report.isPromoted ? "linear-gradient(135deg, #d1fae5, #a7f3d0)" : "linear-gradient(135deg, #fee2e2, #fecaca)",
//                 border: `1px solid ${report.isPromoted ? "#6ee7b7" : "#fca5a5"}`,
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 10,
//               }}
//             >
//               <span style={{ fontSize: 20 }}>{report.isPromoted ? "🎉" : "📋"}</span>
//               <div>
//                 <p style={{ fontSize: 13, fontWeight: "bold", color: report.isPromoted ? "#065f46" : "#991b1b", margin: 0 }}>
//                   {report.isPromoted ? `PROMOTED TO: ${report.promotedToClass ?? "Next Class"}` : "NOT PROMOTED — Performance Review Required"}
//                 </p>
//                 {report.isPromoted && (
//                   <p style={{ fontSize: 11, color: "#065f46", margin: "2px 0 0", opacity: 0.7 }}>
//                     Congratulations! Continue to excel in the next academic year.
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── NEXT TERM DATE ── */}
//         {report.nextTermResumptionDate && (
//           <div style={{ padding: "0 28px 16px" }}>
//             <div
//               style={{
//                 padding: "10px 16px",
//                 borderRadius: 8,
//                 background: "#fffbeb",
//                 border: "1px solid #fde68a",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 8,
//               }}
//             >
//               <span style={{ fontSize: 16 }}>📅</span>
//               <div>
//                 <span style={{ fontSize: 11, color: "#78350f", fontWeight: "600", textTransform: "uppercase" }}>
//                   Next Term Resumption:
//                 </span>
//                 <span style={{ fontSize: 13, color: "#92400e", fontWeight: "bold", marginLeft: 8 }}>
//                   {formatDate(report.nextTermResumptionDate)}
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── FOOTER ── */}
//         <div
//           style={{
//             padding: "14px 28px",
//             background: "#0a1628",
//             color: "white",
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//           }}
//         >
//           <div>
//             <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>
//               Report generated on{" "}
//               {new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" })}
//             </p>
//             <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>
//               Report ID: {report._id} · Scan QR code to verify authenticity
//             </p>
//           </div>
//           <div style={{ textAlign: "right" }}>
//             <div style={{ width: 120, height: 1, background: "rgba(255,255,255,0.2)", marginBottom: 4 }} />
//             <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>Principal&apos;s Signature</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import QRCode from "qrcode";
import type { IReportCard, ISubjectScore } from "@/types";
import { TermName } from "@/types/enums";
import { formatDate, getOrdinal } from "@/lib/utils";

interface ReportCardProps {
  report: IReportCard & {
    sessionName: string;
    termName: TermName;
    className: string;
  };
  showActions?: boolean;
}

const SCHOOL_LOGO_URL =
  "https://res.cloudinary.com/disxrmlco/image/upload/v1771881211/android-chrome-512x512_mc7kty.png";

// A4 at 96dpi
const A4_W = 794;
const A4_H = 1123;

export default function ReportCardComponent({
  report,
  showActions = true,
}: ReportCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(
    null,
  );
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  async function generateQR() {
    const verifyUrl = `${window.location.origin}/verify-report/${report._id}`;
    return QRCode.toDataURL(verifyUrl, { width: 100, margin: 1 });
  }

  async function convertImageToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
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

  async function handlePrint() {
    setIsPrinting(true);
    const [qr, logo] = await Promise.all([
      generateQR(),
      convertImageToBase64(SCHOOL_LOGO_URL),
    ]);
    setQrDataUrl(qr);
    setLogoBase64(logo);
    await new Promise((r) => setTimeout(r, 300));
    window.print();
    setIsPrinting(false);
  }

  async function handleDownload() {
    setIsPrinting(true);

    const [qr, logo] = await Promise.all([
      generateQR(),
      convertImageToBase64(SCHOOL_LOGO_URL),
    ]);
    setQrDataUrl(qr);
    setLogoBase64(logo);

    if (report.studentSnapshot.profilePhoto) {
      const base64 = await convertImageToBase64(
        report.studentSnapshot.profilePhoto,
      );
      setProfilePhotoBase64(base64);
    }

    // Wait for state + repaint
    await new Promise((r) => setTimeout(r, 500));

    const { jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    if (!cardRef.current) return;

    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      logging: false,
      // Always capture exactly A4 dimensions — card is fixed to A4_W x A4_H
      width: A4_W,
      height: A4_H,
      windowWidth: A4_W,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Always fill the full A4 page — 210mm x 297mm
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    pdf.save(
      `ReportCard_${report.studentSnapshot.admissionNumber}_${report.termName}_${report.sessionName}.pdf`,
    );
    setIsPrinting(false);
  }

  const isThirdTerm = report.termName === TermName.THIRD;
  const avgScore = report.percentage.toFixed(1);

  const FIXED_HEIGHT = 170 + 122 + 42 + 36 + 42 + 140 + 46 + 40;
  const conditionalHeight =
    (isThirdTerm ? 52 : 0) + (report.nextTermResumptionDate ? 46 : 0);
  const availableForRows = A4_H - FIXED_HEIGHT - conditionalHeight;
  const subjectCount = report.subjects.length;
  // Min row height 24px, max 52px — clamp so it always looks good
  const rowHeight = Math.min(
    52,
    Math.max(24, Math.floor(availableForRows / Math.max(subjectCount, 1))),
  );

  return (
    <div>
      {showActions && (
        <div className="flex gap-3 mb-4 no-print">
          <button
            onClick={handleDownload}
            disabled={isPrinting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e3a5f] text-white text-sm font-medium hover:bg-[#152847] transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isPrinting ? "Preparing..." : "Download PDF"}
          </button>
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      )}

      {/* ── Report Card — fixed A4 size always ── */}
      <div
        ref={cardRef}
        style={{
          width: A4_W,
          height: A4_H,
          backgroundColor: "white",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#111",
          margin: "0 auto",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)",
            color: "white",
            padding: "16px 28px",
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: "rgba(245,158,11,0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -20,
              left: -20,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.03)",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Logo */}
            <div
              style={{
                flexShrink: 0,
                width: 100,
                height: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={logoBase64 || SCHOOL_LOGO_URL}
                alt="School Logo"
                crossOrigin="anonymous"
                style={{
                  width: 100,
                  height: 100,
                  objectFit: "contain",
                  borderRadius: 10,
                }}
              />
            </div>

            {/* School Info */}
            <div style={{ flex: 1, textAlign: "center", padding: "0 18px" }}>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  margin: "0 0 3px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: "white",
                  lineHeight: 1.2,
                }}
              >
                GOD&apos;S WAY MODEL GROUPS OF SCHOOLS
              </h1>
              <p
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.5)",
                  margin: "0 0 6px",
                  letterSpacing: "2px",
                }}
              >
                SOWING THE SEED OF MERIT AND EXCELLENCE
              </p>
              <div
                style={{
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.75,
                }}
              >
                <p style={{ margin: 0 }}>
                  📍 NO 12 SIYANBOLA STREET, OSOGBO, OSUN STATE
                </p>
                <p style={{ margin: 0 }}>
                  📞 08069825847, 08067110930 &nbsp;|&nbsp; ✉️
                  godswaygroupofschools@gmail.com
                </p>
              </div>
            </div>

            {/* QR */}
            <div style={{ flexShrink: 0, textAlign: "center" }}>
              {qrDataUrl ? (
                <div
                  style={{ background: "white", padding: 7, borderRadius: 8 }}
                >
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    style={{ width: 86, height: 86, display: "block" }}
                  />
                  <p
                    style={{
                      fontSize: 9,
                      color: "#555",
                      margin: "3px 0 0",
                      textAlign: "center",
                    }}
                  >
                    Verify Report
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 8,
                    border: "1px dashed rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      color: "rgba(255,255,255,0.3)",
                      textAlign: "center",
                      padding: 4,
                    }}
                  >
                    QR on Download
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Title Bar */}
          <div
            style={{ marginTop: 12, display: "flex", justifyContent: "center" }}
          >
            <div
              style={{
                padding: "7px 20px",
                background: "rgba(245,158,11,0.15)",
                borderRadius: 8,
                border: "1px solid rgba(245,158,11,0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  color: "#f59e0b",
                  fontSize: 12,
                  fontWeight: "bold",
                  letterSpacing: "0.5px",
                }}
              >
                STUDENT REPORT CARD
              </span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                ·
              </span>
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
                {report.termName.toUpperCase()} TERM &nbsp;·&nbsp;{" "}
                {report.sessionName} SESSION
              </span>
            </div>
          </div>
        </div>

        {/* ── STUDENT INFO ── */}
        <div
          style={{
            padding: "12px 28px",
            borderBottom: "2px solid #f0f4f8",
            display: "flex",
            gap: 14,
            alignItems: "stretch",
            flexShrink: 0,
          }}
        >
          {/* Photo */}
          <div style={{ flexShrink: 0 }}>
            {report.studentSnapshot.profilePhoto ? (
              <img
                src={profilePhotoBase64 || report.studentSnapshot.profilePhoto}
                alt="Student"
                style={{
                  width: 86,
                  height: 86,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "3px solid #1e3a5f",
                }}
              />
            ) : (
              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: 10,
                  background: "#e8eff7",
                  border: "3px solid #1e3a5f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  color: "#1e3a5f",
                  fontWeight: "bold",
                }}
              >
                {report.studentSnapshot.firstName.charAt(0)}
                {report.studentSnapshot.lastName.charAt(0)}
              </div>
            )}
          </div>

          {/* Details */}
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1px 14px",
              alignContent: "start",
            }}
          >
            {[
              {
                label: "Student Name",
                value: `${report.studentSnapshot.firstName} ${report.studentSnapshot.lastName}`,
              },
              {
                label: "Admission No.",
                value: report.studentSnapshot.admissionNumber,
              },
              { label: "Class", value: report.className },
              { label: "Academic Session", value: report.sessionName },
              { label: "Term", value: `${report.termName.toUpperCase()} TERM` },
              {
                label: "Date of Birth",
                value: formatDate(report.studentSnapshot.dateOfBirth),
              },
              {
                label: "Gender",
                value:
                  report.studentSnapshot.gender.charAt(0).toUpperCase() +
                  report.studentSnapshot.gender.slice(1),
              },
              {
                label: "Department",
                value:
                  report.studentSnapshot.department !== "none"
                    ? report.studentSnapshot.department.toUpperCase()
                    : "N/A",
              },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: "2px 0" }}>
                <span
                  style={{
                    fontSize: 9.5,
                    color: "#6b7280",
                    display: "block",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{ fontSize: 12.5, fontWeight: "600", color: "#111" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Performance Box */}
          <div
            style={{
              flexShrink: 0,
              background: "#1e3a5f",
              borderRadius: 10,
              padding: "12px 16px",
              color: "white",
              textAlign: "center",
              minWidth: 115,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "#f59e0b",
                lineHeight: 1,
              }}
            >
              {avgScore}%
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.5)",
                margin: "3px 0",
              }}
            >
              Overall Score
            </div>
            <div style={{ fontSize: 20, fontWeight: "bold", margin: "3px 0" }}>
              {report.grade}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
              Grade
            </div>
            <div
              style={{
                marginTop: 8,
                paddingTop: 7,
                borderTop: "1px solid rgba(255,255,255,0.15)",
                fontSize: 11,
              }}
            >
              <span style={{ color: "#f59e0b", fontWeight: "bold" }}>
                {getOrdinal(report.position)}
              </span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9.5 }}>
                {" "}
                / {report.totalStudentsInClass} students
              </span>
            </div>
          </div>
        </div>

        {/* ── SCORES TABLE ── */}
        <div style={{ padding: "0 28px", flexShrink: 0 }}>
          <h3
            style={{
              fontSize: 12,
              fontWeight: "bold",
              color: "#1e3a5f",
              padding: "10px 0 7px",
              borderBottom: "2px solid #1e3a5f",
              margin: 0,
              letterSpacing: "0.5px",
            }}
          >
            ACADEMIC PERFORMANCE
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 11.5,
              tableLayout: "fixed",
            }}
          >
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
                    style={{
                      padding: "6px 5px",
                      textAlign: i === 0 ? "left" : "center",
                      fontSize: 9.5,
                      color: "#374151",
                      fontWeight: "700",
                      borderBottom: "1px solid #e2e8f0",
                      paddingLeft: i === 0 ? 8 : 5,
                      lineHeight: 1.3,
                    }}
                  >
                    {label}
                    {sub && (
                      <div
                        style={{
                          fontSize: 8.5,
                          color: "#6b7280",
                          fontWeight: "500",
                        }}
                      >
                        {sub}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.subjects.map((subject: ISubjectScore, i) => (
                <tr
                  key={subject.subject}
                  style={{ background: i % 2 === 0 ? "white" : "#fafbfc" }}
                >
                  <td
                    style={{
                      padding: `${Math.max(4, (rowHeight - 18) / 2)}px 8px`,
                      borderBottom: "1px solid #f0f4f8",
                      fontWeight: "500",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {subject.subjectName}
                  </td>
                  <td
                    style={{
                      padding: "4px 5px",
                      borderBottom: "1px solid #f0f4f8",
                      textAlign: "center",
                    }}
                  >
                    {subject.testScore}
                  </td>
                  <td
                    style={{
                      padding: "4px 5px",
                      borderBottom: "1px solid #f0f4f8",
                      textAlign: "center",
                    }}
                  >
                    {subject.examScore}
                  </td>
                  <td
                    style={{
                      padding: "4px 5px",
                      borderBottom: "1px solid #f0f4f8",
                      textAlign: "center",
                      color: subject.hasPractical ? "#111" : "#ccc",
                    }}
                  >
                    {subject.hasPractical ? subject.practicalScore : "—"}
                  </td>
                  <td
                    style={{
                      padding: "4px 5px",
                      borderBottom: "1px solid #f0f4f8",
                      textAlign: "center",
                      fontWeight: "bold",
                      color:
                        subject.totalScore < subject.maxTotalScore * 0.5
                          ? "#dc2626"
                          : "#1e3a5f",
                    }}
                  >
                    {subject.totalScore}/{subject.maxTotalScore}
                  </td>
                  <td
                    style={{
                      padding: "4px 5px",
                      borderBottom: "1px solid #f0f4f8",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "1px 6px",
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: "bold",
                        background:
                          subject.grade === "A"
                            ? "#d1fae5"
                            : subject.grade === "F"
                              ? "#fee2e2"
                              : subject.grade === "B"
                                ? "#dbeafe"
                                : "#fef3c7",
                        color:
                          subject.grade === "A"
                            ? "#065f46"
                            : subject.grade === "F"
                              ? "#991b1b"
                              : subject.grade === "B"
                                ? "#1e40af"
                                : "#92400e",
                      }}
                    >
                      {subject.grade}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "4px 5px",
                      borderBottom: "1px solid #f0f4f8",
                      textAlign: "center",
                      fontSize: 10,
                      color: "#6b7280",
                    }}
                  >
                    {subject.remark}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#1e3a5f", color: "white" }}>
                <td
                  colSpan={4}
                  style={{
                    padding: "7px 8px",
                    fontWeight: "bold",
                    fontSize: 11.5,
                  }}
                >
                  TOTAL
                </td>
                <td
                  style={{
                    padding: "7px 5px",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: 12.5,
                    color: "#f59e0b",
                  }}
                >
                  {report.totalObtained}/{report.totalObtainable}
                </td>
                <td
                  style={{
                    padding: "7px 5px",
                    textAlign: "center",
                    fontWeight: "bold",
                    color: "#f59e0b",
                  }}
                >
                  {report.grade}
                </td>
                <td
                  style={{
                    padding: "7px 5px",
                    textAlign: "center",
                    fontSize: 11.5,
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {avgScore}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── GRADE SCALE ── */}
        <div style={{ padding: "8px 28px", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              alignItems: "center",
              padding: "6px 10px",
              background: "#f8fafc",
              borderRadius: 7,
              border: "1px solid #e2e8f0",
            }}
          >
            <span
              style={{
                fontSize: 9.5,
                color: "#6b7280",
                marginRight: 3,
                fontWeight: "600",
                whiteSpace: "nowrap",
              }}
            >
              Grade Scale:
            </span>
            {[
              { grade: "A", range: "70–100%", bg: "#d1fae5", text: "#065f46" },
              { grade: "B", range: "60–69%", bg: "#dbeafe", text: "#1e40af" },
              { grade: "C", range: "50–59%", bg: "#fef3c7", text: "#92400e" },
              { grade: "D", range: "49–45%", bg: "#f3f4f6", text: "#374151" },
              { grade: "E", range: "44–40%", bg: "#fde68a", text: "#78350f" },
              { grade: "F", range: "0–39%", bg: "#fee2e2", text: "#991b1b" },
            ].map((g) => (
              <span
                key={g.grade}
                style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 9.5,
                  fontWeight: "600",
                  background: g.bg,
                  color: g.text,
                  whiteSpace: "nowrap",
                }}
              >
                {g.grade}: {g.range}
              </span>
            ))}
          </div>
        </div>

        {/* ── ATTENDANCE + COMMENTS — flex-grow fills remaining space ── */}
        <div
          style={{
            padding: "0 28px 10px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Attendance */}
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 9,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "12px 14px", flex: 1 }}>
              <h4
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  color: "#1e3a5f",
                  margin: "0 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Attendance Record
              </h4>
              {[
                {
                  label: "School Days Open",
                  value: report.attendance.schoolDaysOpen,
                },
                { label: "Days Present", value: report.attendance.daysPresent },
                { label: "Days Absent", value: report.attendance.daysAbsent },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 0",
                    borderBottom: "1px solid #e8edf2",
                  }}
                >
                  <span style={{ fontSize: 10.5, color: "#6b7280" }}>
                    {label}:
                  </span>
                  <span
                    style={{ fontSize: 11, fontWeight: "600", color: "#111" }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
            {/* Attendance rate pinned to bottom */}
            <div
              style={{
                padding: "7px 14px",
                background: "#1e3a5f",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)" }}>
                Attendance Rate:
              </span>
              <span
                style={{ fontSize: 12, fontWeight: "bold", color: "#f59e0b" }}
              >
                {report.attendance.attendancePercentage.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Comments */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 9,
                padding: "12px 13px",
                border: "1px solid #e2e8f0",
                flex: 1,
              }}
            >
              <h4
                style={{
                  fontSize: 10.5,
                  fontWeight: "bold",
                  color: "#1e3a5f",
                  margin: "0 0 5px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Class Teacher&apos;s Comment
              </h4>
              <p
                style={{
                  fontSize: 11.5,
                  color: "#374151",
                  margin: 0,
                  lineHeight: 1.5,
                  fontStyle: "italic",
                }}
              >
                {report.teacherComment ?? "No comment provided."}
              </p>
            </div>
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 9,
                padding: "12px 13px",
                border: "1px solid #e2e8f0",
                flex: 1,
              }}
            >
              <h4
                style={{
                  fontSize: 10.5,
                  fontWeight: "bold",
                  color: "#1e3a5f",
                  margin: "0 0 5px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Principal&apos;s Comment
              </h4>
              <p
                style={{
                  fontSize: 11.5,
                  color: "#374151",
                  margin: 0,
                  lineHeight: 1.5,
                  fontStyle: "italic",
                }}
              >
                {report.principalComment ?? "Keep up the good work!"}
              </p>
            </div>
          </div>
        </div>

        {/* ── PROMOTION STATUS (Third Term only) ── */}
        {/* ── PROMOTION STATUS (Third Term only) ── */}
        {isThirdTerm && report.promotedToClass && (
          <div style={{ padding: "0 28px 10px", flexShrink: 0 }}>
            {report.promotedToClass === "Pending Department Assignment" ? (
              <div
                style={{
                  padding: "11px 15px",
                  borderRadius: 9,
                  background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                  border: "1px solid #fde68a",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>⏳</span>
                <div>
                  <p
                    style={{
                      fontSize: 12.5,
                      fontWeight: "bold",
                      color: "#92400e",
                      margin: 0,
                    }}
                  >
                    DEPARTMENT ASSIGNMENT PENDING
                  </p>
                  <p
                    style={{
                      fontSize: 10.5,
                      color: "#78350f",
                      margin: "2px 0 0",
                      opacity: 0.8,
                    }}
                  >
                    Your child has passed! Admin will assign your SSS 1 class
                    and department shortly.
                  </p>
                </div>
              </div>
            ) : report.promotedToClass === "Graduated" ? (
              <div
                style={{
                  padding: "11px 15px",
                  borderRadius: 9,
                  background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                  border: "1px solid #6ee7b7",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>🎓</span>
                <div>
                  <p
                    style={{
                      fontSize: 12.5,
                      fontWeight: "bold",
                      color: "#065f46",
                      margin: 0,
                    }}
                  >
                    CONGRATULATIONS — GRADUATED!
                  </p>
                  <p
                    style={{
                      fontSize: 10.5,
                      color: "#065f46",
                      margin: "2px 0 0",
                      opacity: 0.7,
                    }}
                  >
                    Your child has successfully completed SSS 2. Well done!
                  </p>
                </div>
              </div>
            ) : report.promotedToClass === "Performance Under Review" ? (
              <div
                style={{
                  padding: "11px 15px",
                  borderRadius: 9,
                  background: "linear-gradient(135deg, #fee2e2, #fecaca)",
                  border: "1px solid #fca5a5",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>📋</span>
                <div>
                  <p
                    style={{
                      fontSize: 12.5,
                      fontWeight: "bold",
                      color: "#991b1b",
                      margin: 0,
                    }}
                  >
                    PERFORMANCE UNDER REVIEW
                  </p>
                  <p
                    style={{
                      fontSize: 10.5,
                      color: "#7f1d1d",
                      margin: "2px 0 0",
                      opacity: 0.8,
                    }}
                  >
                    Please contact the school for further information.
                  </p>
                </div>
              </div>
            ) : report.isPromoted ? (
              <div
                style={{
                  padding: "11px 15px",
                  borderRadius: 9,
                  background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                  border: "1px solid #6ee7b7",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>🎉</span>
                <div>
                  <p
                    style={{
                      fontSize: 12.5,
                      fontWeight: "bold",
                      color: "#065f46",
                      margin: 0,
                    }}
                  >
                    PROMOTED TO: {report.promotedToClass}
                  </p>
                  <p
                    style={{
                      fontSize: 10.5,
                      color: "#065f46",
                      margin: "2px 0 0",
                      opacity: 0.7,
                    }}
                  >
                    Congratulations! Continue to excel in the next academic
                    year.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── NEXT TERM DATE ── */}
        {report.nextTermResumptionDate && (
          <div style={{ padding: "0 28px 10px", flexShrink: 0 }}>
            <div
              style={{
                padding: "9px 15px",
                borderRadius: 7,
                background: "#fffbeb",
                border: "1px solid #fde68a",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 15 }}>📅</span>
              <div>
                <span
                  style={{
                    fontSize: 10.5,
                    color: "#78350f",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  Next Term Resumption:
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    color: "#92400e",
                    fontWeight: "bold",
                    marginLeft: 8,
                  }}
                >
                  {formatDate(report.nextTermResumptionDate)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div
          style={{
            padding: "12px 28px",
            background: "#0a1628",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 9.5,
                color: "rgba(255,255,255,0.4)",
                margin: 0,
              }}
            >
              Report generated on{" "}
              {new Date().toLocaleDateString("en-NG", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p
              style={{
                fontSize: 9.5,
                color: "rgba(255,255,255,0.3)",
                margin: "2px 0 0",
              }}
            >
              Report ID: {report._id} · Scan QR code to verify authenticity
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                width: 110,
                height: 1,
                background: "rgba(255,255,255,0.2)",
                marginBottom: 4,
              }}
            />
            <p
              style={{
                fontSize: 9.5,
                color: "rgba(255,255,255,0.4)",
                margin: 0,
              }}
            >
              Principal&apos;s Signature
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
