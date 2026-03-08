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
//     principalSignature?: string | null;
//   };
//   showActions?: boolean;
// }

// const SCHOOL_LOGO_URL =
//   "https://res.cloudinary.com/disxrmlco/image/upload/v1771881211/android-chrome-512x512_mc7kty.png";

// // A4 at 96dpi
// const A4_W = 794;
// const A4_H = 1123;

// export default function ReportCardComponent({
//   report,
//   showActions = true,
// }: ReportCardProps) {
//   const cardRef = useRef<HTMLDivElement>(null);
//   const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
//   const [isPrinting, setIsPrinting] = useState(false);
//   const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(
//     null,
//   );
//   const [logoBase64, setLogoBase64] = useState<string | null>(null);

//   async function generateQR() {
//     const verifyUrl = `${window.location.origin}/verify-report/${report._id}`;
//     return QRCode.toDataURL(verifyUrl, { width: 100, margin: 1 });
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
//     const [qr, logo] = await Promise.all([
//       generateQR(),
//       convertImageToBase64(SCHOOL_LOGO_URL),
//     ]);
//     setQrDataUrl(qr);
//     setLogoBase64(logo);
//     await new Promise((r) => setTimeout(r, 300));
//     window.print();
//     setIsPrinting(false);
//   }

//   async function handleDownload() {
//     setIsPrinting(true);

//     const [qr, logo] = await Promise.all([
//       generateQR(),
//       convertImageToBase64(SCHOOL_LOGO_URL),
//     ]);
//     setQrDataUrl(qr);
//     setLogoBase64(logo);

//     if (report.studentSnapshot.profilePhoto) {
//       const base64 = await convertImageToBase64(
//         report.studentSnapshot.profilePhoto,
//       );
//       setProfilePhotoBase64(base64);
//     }

//     // Wait for state + repaint
//     await new Promise((r) => setTimeout(r, 500));

//     const { jsPDF } = await import("jspdf");
//     const { default: html2canvas } = await import("html2canvas");

//     if (!cardRef.current) return;

//     const canvas = await html2canvas(cardRef.current, {
//       scale: 3,
//       useCORS: true,
//       allowTaint: false,
//       logging: false,
//       // Always capture exactly A4 dimensions — card is fixed to A4_W x A4_H
//       width: A4_W,
//       height: A4_H,
//       windowWidth: A4_W,
//     });

//     const imgData = canvas.toDataURL("image/png");

//     const pdf = new jsPDF({
//       orientation: "portrait",
//       unit: "mm",
//       format: "a4",
//       compress: true,
//     });

//     // Always fill the full A4 page — 210mm x 297mm
//     pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
//     pdf.save(
//       `ReportCard_${report.studentSnapshot.admissionNumber}_${report.termName}_${report.sessionName}.pdf`,
//     );
//     setIsPrinting(false);
//   }

//   const isThirdTerm = report.termName === TermName.THIRD;
//   const avgScore = report.percentage.toFixed(1);

//   const FIXED_HEIGHT = 170 + 122 + 42 + 36 + 42 + 140 + 46 + 40;
//   const conditionalHeight =
//     (isThirdTerm ? 52 : 0) + (report.nextTermResumptionDate ? 46 : 0);
//   const availableForRows = A4_H - FIXED_HEIGHT - conditionalHeight;
//   const subjectCount = report.subjects.length;
//   // Min row height 24px, max 52px — clamp so it always looks good
//   const rowHeight = Math.min(
//     52,
//     Math.max(24, Math.floor(availableForRows / Math.max(subjectCount, 1))),
//   );

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

//       {/* ── Report Card — fixed A4 size always ── */}
//       <div
//         ref={cardRef}
//         style={{
//           width: A4_W,
//           height: A4_H,
//           backgroundColor: "white",
//           fontFamily: "Georgia, 'Times New Roman', serif",
//           color: "#111",
//           margin: "0 auto",
//           boxSizing: "border-box",
//           display: "flex",
//           flexDirection: "column",
//           overflow: "hidden",
//         }}
//       >
//         {/* ── HEADER ── */}
//         <div
//           style={{
//             background: "linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)",
//             color: "white",
//             padding: "16px 28px",
//             position: "relative",
//             overflow: "hidden",
//             flexShrink: 0,
//           }}
//         >
//           <div
//             style={{
//               position: "absolute",
//               top: -40,
//               right: -40,
//               width: 150,
//               height: 150,
//               borderRadius: "50%",
//               background: "rgba(245,158,11,0.08)",
//             }}
//           />
//           <div
//             style={{
//               position: "absolute",
//               bottom: -20,
//               left: -20,
//               width: 100,
//               height: 100,
//               borderRadius: "50%",
//               background: "rgba(255,255,255,0.03)",
//             }}
//           />

//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "space-between",
//               position: "relative",
//               zIndex: 1,
//             }}
//           >
//             {/* Logo */}
//             <div
//               style={{
//                 flexShrink: 0,
//                 width: 100,
//                 height: 100,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <img
//                 src={logoBase64 || SCHOOL_LOGO_URL}
//                 alt="School Logo"
//                 crossOrigin="anonymous"
//                 style={{
//                   width: 100,
//                   height: 100,
//                   objectFit: "contain",
//                   borderRadius: 10,
//                 }}
//               />
//             </div>

//             {/* School Info */}
//             <div style={{ flex: 1, textAlign: "center", padding: "0 18px" }}>
//               <h1
//                 style={{
//                   fontSize: 18,
//                   fontWeight: "900",
//                   margin: "0 0 3px",
//                   letterSpacing: "0.5px",
//                   textTransform: "uppercase",
//                   color: "white",
//                   lineHeight: 1.2,
//                 }}
//               >
//                 GOD&apos;S WAY MODEL GROUPS OF SCHOOLS
//               </h1>
//               <p
//                 style={{
//                   fontSize: 10,
//                   color: "rgba(255,255,255,0.5)",
//                   margin: "0 0 6px",
//                   letterSpacing: "2px",
//                 }}
//               >
//                 SOWING THE SEED OF MERIT AND EXCELLENCE
//               </p>
//               <div
//                 style={{
//                   fontSize: 10.5,
//                   color: "rgba(255,255,255,0.6)",
//                   lineHeight: 1.75,
//                 }}
//               >
//                 <p style={{ margin: 0 }}>
//                   📍 NO 12 SIYANBOLA STREET, OSOGBO, OSUN STATE
//                 </p>
//                 <p style={{ margin: 0 }}>
//                   📞 08069825847, 08067110930 &nbsp;|&nbsp; ✉️
//                   godswaygroupofschools@gmail.com
//                 </p>
//               </div>
//             </div>

//             {/* QR */}
//             <div style={{ flexShrink: 0, textAlign: "center" }}>
//               {qrDataUrl ? (
//                 <div
//                   style={{ background: "white", padding: 7, borderRadius: 8 }}
//                 >
//                   <img
//                     src={qrDataUrl}
//                     alt="QR Code"
//                     style={{ width: 86, height: 86, display: "block" }}
//                   />
//                   <p
//                     style={{
//                       fontSize: 9,
//                       color: "#555",
//                       margin: "3px 0 0",
//                       textAlign: "center",
//                     }}
//                   >
//                     Verify Report
//                   </p>
//                 </div>
//               ) : (
//                 <div
//                   style={{
//                     width: 100,
//                     height: 100,
//                     background: "rgba(255,255,255,0.05)",
//                     borderRadius: 8,
//                     border: "1px dashed rgba(255,255,255,0.2)",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}
//                 >
//                   <span
//                     style={{
//                       fontSize: 9,
//                       color: "rgba(255,255,255,0.3)",
//                       textAlign: "center",
//                       padding: 4,
//                     }}
//                   >
//                     QR on Download
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Title Bar */}
//           <div
//             style={{ marginTop: 12, display: "flex", justifyContent: "center" }}
//           >
//             <div
//               style={{
//                 padding: "7px 20px",
//                 background: "rgba(245,158,11,0.15)",
//                 borderRadius: 8,
//                 border: "1px solid rgba(245,158,11,0.3)",
//                 display: "inline-flex",
//                 alignItems: "center",
//                 gap: 12,
//               }}
//             >
//               <span
//                 style={{
//                   color: "#f59e0b",
//                   fontSize: 12,
//                   fontWeight: "bold",
//                   letterSpacing: "0.5px",
//                 }}
//               >
//                 STUDENT REPORT CARD
//               </span>
//               <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
//                 ·
//               </span>
//               <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
//                 {report.termName.toUpperCase()} TERM &nbsp;·&nbsp;{" "}
//                 {report.sessionName} SESSION
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* ── STUDENT INFO ── */}
//         <div
//           style={{
//             padding: "12px 28px",
//             borderBottom: "2px solid #f0f4f8",
//             display: "flex",
//             gap: 14,
//             alignItems: "stretch",
//             flexShrink: 0,
//           }}
//         >
//           {/* Photo */}
//           <div style={{ flexShrink: 0 }}>
//             {report.studentSnapshot.profilePhoto ? (
//               <img
//                 src={profilePhotoBase64 || report.studentSnapshot.profilePhoto}
//                 alt="Student"
//                 style={{
//                   width: 86,
//                   height: 86,
//                   objectFit: "cover",
//                   borderRadius: 10,
//                   border: "3px solid #1e3a5f",
//                 }}
//               />
//             ) : (
//               <div
//                 style={{
//                   width: 86,
//                   height: 86,
//                   borderRadius: 10,
//                   background: "#e8eff7",
//                   border: "3px solid #1e3a5f",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontSize: 26,
//                   color: "#1e3a5f",
//                   fontWeight: "bold",
//                 }}
//               >
//                 {report.studentSnapshot.surname.charAt(0)}
//                 {report.studentSnapshot.firstName.charAt(0)}
//                 {report.studentSnapshot.otherName.charAt(0)}
//               </div>
//             )}
//           </div>

//           {/* Details */}
//           <div
//             style={{
//               flex: 1,
//               display: "grid",
//               gridTemplateColumns: "1fr 1fr",
//               gap: "1px 14px",
//               alignContent: "start",
//             }}
//           >
//             {[
//               {
//                 label: "Student Name",
//                 value: `${report.studentSnapshot.surname} ${report.studentSnapshot.firstName} ${report.studentSnapshot.otherName}`,
//               },
//               {
//                 label: "Admission No.",
//                 value: report.studentSnapshot.admissionNumber,
//               },
//               { label: "Class", value: report.className },
//               { label: "Academic Session", value: report.sessionName },
//               { label: "Term", value: `${report.termName.toUpperCase()} TERM` },
//               {
//                 label: "Date of Birth",
//                 value: formatDate(report.studentSnapshot.dateOfBirth),
//               },
//               {
//                 label: "Gender",
//                 value:
//                   report.studentSnapshot.gender.charAt(0).toUpperCase() +
//                   report.studentSnapshot.gender.slice(1),
//               },
//               {
//                 label: "Department",
//                 value:
//                   report.studentSnapshot.department !== "none"
//                     ? report.studentSnapshot.department.toUpperCase()
//                     : "N/A",
//               },
//             ].map(({ label, value }) => (
//               <div key={label} style={{ padding: "2px 0" }}>
//                 <span
//                   style={{
//                     fontSize: 9.5,
//                     color: "#6b7280",
//                     display: "block",
//                     textTransform: "uppercase",
//                     letterSpacing: "0.5px",
//                   }}
//                 >
//                   {label}
//                 </span>
//                 <span
//                   style={{ fontSize: 12.5, fontWeight: "600", color: "#111" }}
//                 >
//                   {value}
//                 </span>
//               </div>
//             ))}
//           </div>

//           {/* Performance Box */}
//           <div
//             style={{
//               flexShrink: 0,
//               background: "#1e3a5f",
//               borderRadius: 10,
//               padding: "12px 16px",
//               color: "white",
//               textAlign: "center",
//               minWidth: 115,
//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: 32,
//                 fontWeight: "bold",
//                 color: "#f59e0b",
//                 lineHeight: 1,
//               }}
//             >
//               {avgScore}%
//             </div>
//             <div
//               style={{
//                 fontSize: 10,
//                 color: "rgba(255,255,255,0.5)",
//                 margin: "3px 0",
//               }}
//             >
//               Overall Score
//             </div>
//             <div style={{ fontSize: 20, fontWeight: "bold", margin: "3px 0" }}>
//               {report.grade}
//             </div>
//             <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
//               Grade
//             </div>
//             <div
//               style={{
//                 marginTop: 8,
//                 paddingTop: 7,
//                 borderTop: "1px solid rgba(255,255,255,0.15)",
//                 fontSize: 11,
//               }}
//             >
//               <span style={{ color: "#f59e0b", fontWeight: "bold" }}>
//                 {getOrdinal(report.position)}
//               </span>
//               <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9.5 }}>
//                 {" "}
//                 / {report.totalStudentsInClass} students
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* ── SCORES TABLE ── */}
//         <div style={{ padding: "0 28px", flexShrink: 0 }}>
//           <h3
//             style={{
//               fontSize: 12,
//               fontWeight: "bold",
//               color: "#1e3a5f",
//               padding: "10px 0 7px",
//               borderBottom: "2px solid #1e3a5f",
//               margin: 0,
//               letterSpacing: "0.5px",
//             }}
//           >
//             ACADEMIC PERFORMANCE
//           </h3>
//           <table
//             style={{
//               width: "100%",
//               borderCollapse: "collapse",
//               fontSize: 11.5,
//               tableLayout: "fixed",
//             }}
//           >
//             <colgroup>
//               <col style={{ width: "30%" }} />
//               <col style={{ width: "10%" }} />
//               <col style={{ width: "10%" }} />
//               <col style={{ width: "10%" }} />
//               <col style={{ width: "14%" }} />
//               <col style={{ width: "10%" }} />
//               <col style={{ width: "16%" }} />
//             </colgroup>
//             <thead>
//               <tr style={{ background: "#f0f4f8" }}>
//                 {[
//                   { label: "SUBJECT", sub: "" },
//                   { label: "TEST", sub: "(20/30)" },
//                   { label: "EXAM", sub: "(60/70)" },
//                   { label: "PRAC.", sub: "(20)" },
//                   { label: "TOTAL", sub: "" },
//                   { label: "GRADE", sub: "" },
//                   { label: "REMARK", sub: "" },
//                 ].map(({ label, sub }, i) => (
//                   <th
//                     key={i}
//                     style={{
//                       padding: "6px 5px",
//                       textAlign: i === 0 ? "left" : "center",
//                       fontSize: 9.5,
//                       color: "#374151",
//                       fontWeight: "700",
//                       borderBottom: "1px solid #e2e8f0",
//                       paddingLeft: i === 0 ? 8 : 5,
//                       lineHeight: 1.3,
//                     }}
//                   >
//                     {label}
//                     {sub && (
//                       <div
//                         style={{
//                           fontSize: 8.5,
//                           color: "#6b7280",
//                           fontWeight: "500",
//                         }}
//                       >
//                         {sub}
//                       </div>
//                     )}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {report.subjects.map((subject: ISubjectScore, i) => (
//                 <tr
//                   key={subject.subject}
//                   style={{ background: i % 2 === 0 ? "white" : "#fafbfc" }}
//                 >
//                   <td
//                     style={{
//                       padding: `${Math.max(4, (rowHeight - 18) / 2)}px 8px`,
//                       borderBottom: "1px solid #f0f4f8",
//                       fontWeight: "500",
//                       overflow: "hidden",
//                       whiteSpace: "nowrap",
//                       textOverflow: "ellipsis",
//                     }}
//                   >
//                     {subject.subjectName}
//                   </td>
//                   <td
//                     style={{
//                       padding: "4px 5px",
//                       borderBottom: "1px solid #f0f4f8",
//                       textAlign: "center",
//                     }}
//                   >
//                     {subject.testScore}
//                   </td>
//                   <td
//                     style={{
//                       padding: "4px 5px",
//                       borderBottom: "1px solid #f0f4f8",
//                       textAlign: "center",
//                     }}
//                   >
//                     {subject.examScore}
//                   </td>
//                   <td
//                     style={{
//                       padding: "4px 5px",
//                       borderBottom: "1px solid #f0f4f8",
//                       textAlign: "center",
//                       color: subject.hasPractical ? "#111" : "#ccc",
//                     }}
//                   >
//                     {subject.hasPractical ? subject.practicalScore : "—"}
//                   </td>
//                   <td
//                     style={{
//                       padding: "4px 5px",
//                       borderBottom: "1px solid #f0f4f8",
//                       textAlign: "center",
//                       fontWeight: "bold",
//                       color:
//                         subject.totalScore < subject.maxTotalScore * 0.5
//                           ? "#dc2626"
//                           : "#1e3a5f",
//                     }}
//                   >
//                     {subject.totalScore}/{subject.maxTotalScore}
//                   </td>
//                   <td
//                     style={{
//                       padding: "4px 5px",
//                       borderBottom: "1px solid #f0f4f8",
//                       textAlign: "center",
//                     }}
//                   >
//                     <span
//                       style={{
//                         display: "inline-block",
//                         padding: "1px 6px",
//                         borderRadius: 3,
//                         fontSize: 10,
//                         fontWeight: "bold",
//                         background:
//                           subject.grade === "A"
//                             ? "#d1fae5"
//                             : subject.grade === "F"
//                               ? "#fee2e2"
//                               : subject.grade === "B"
//                                 ? "#dbeafe"
//                                 : "#fef3c7",
//                         color:
//                           subject.grade === "A"
//                             ? "#065f46"
//                             : subject.grade === "F"
//                               ? "#991b1b"
//                               : subject.grade === "B"
//                                 ? "#1e40af"
//                                 : "#92400e",
//                       }}
//                     >
//                       {subject.grade}
//                     </span>
//                   </td>
//                   <td
//                     style={{
//                       padding: "4px 5px",
//                       borderBottom: "1px solid #f0f4f8",
//                       textAlign: "center",
//                       fontSize: 10,
//                       color: "#6b7280",
//                     }}
//                   >
//                     {subject.remark}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//             <tfoot>
//               <tr style={{ background: "#1e3a5f", color: "white" }}>
//                 <td
//                   colSpan={4}
//                   style={{
//                     padding: "7px 8px",
//                     fontWeight: "bold",
//                     fontSize: 11.5,
//                   }}
//                 >
//                   TOTAL
//                 </td>
//                 <td
//                   style={{
//                     padding: "7px 5px",
//                     textAlign: "center",
//                     fontWeight: "bold",
//                     fontSize: 12.5,
//                     color: "#f59e0b",
//                   }}
//                 >
//                   {report.totalObtained}/{report.totalObtainable}
//                 </td>
//                 <td
//                   style={{
//                     padding: "7px 5px",
//                     textAlign: "center",
//                     fontWeight: "bold",
//                     color: "#f59e0b",
//                   }}
//                 >
//                   {report.grade}
//                 </td>
//                 <td
//                   style={{
//                     padding: "7px 5px",
//                     textAlign: "center",
//                     fontSize: 11.5,
//                     color: "rgba(255,255,255,0.85)",
//                   }}
//                 >
//                   {avgScore}%
//                 </td>
//               </tr>
//             </tfoot>
//           </table>
//         </div>

//         {/* ── GRADE SCALE ── */}
//         <div style={{ padding: "8px 28px", flexShrink: 0 }}>
//           <div
//             style={{
//               display: "flex",
//               gap: 4,
//               flexWrap: "wrap",
//               alignItems: "center",
//               padding: "6px 10px",
//               background: "#f8fafc",
//               borderRadius: 7,
//               border: "1px solid #e2e8f0",
//             }}
//           >
//             <span
//               style={{
//                 fontSize: 9.5,
//                 color: "#6b7280",
//                 marginRight: 3,
//                 fontWeight: "600",
//                 whiteSpace: "nowrap",
//               }}
//             >
//               Grade Scale:
//             </span>
//             {[
//               { grade: "A", range: "70–100%", bg: "#d1fae5", text: "#065f46" },
//               { grade: "B", range: "60–69%", bg: "#dbeafe", text: "#1e40af" },
//               { grade: "C", range: "50–59%", bg: "#fef3c7", text: "#92400e" },
//               { grade: "D", range: "49–45%", bg: "#f3f4f6", text: "#374151" },
//               { grade: "E", range: "44–40%", bg: "#fde68a", text: "#78350f" },
//               { grade: "F", range: "0–39%", bg: "#fee2e2", text: "#991b1b" },
//             ].map((g) => (
//               <span
//                 key={g.grade}
//                 style={{
//                   padding: "2px 8px",
//                   borderRadius: 4,
//                   fontSize: 9.5,
//                   fontWeight: "600",
//                   background: g.bg,
//                   color: g.text,
//                   whiteSpace: "nowrap",
//                 }}
//               >
//                 {g.grade}: {g.range}
//               </span>
//             ))}
//           </div>
//         </div>

//         {/* ── ATTENDANCE + COMMENTS — flex-grow fills remaining space ── */}
//         <div
//           style={{
//             padding: "0 28px 10px",
//             display: "grid",
//             gridTemplateColumns: "1fr 1fr",
//             gap: 14,
//             flex: 1,
//             minHeight: 0,
//           }}
//         >
//           {/* Attendance */}
//           <div
//             style={{
//               background: "#f8fafc",
//               borderRadius: 9,
//               border: "1px solid #e2e8f0",
//               overflow: "hidden",
//               display: "flex",
//               flexDirection: "column",
//             }}
//           >
//             <div style={{ padding: "12px 14px", flex: 1 }}>
//               <h4
//                 style={{
//                   fontSize: 11,
//                   fontWeight: "bold",
//                   color: "#1e3a5f",
//                   margin: "0 0 8px",
//                   textTransform: "uppercase",
//                   letterSpacing: "0.5px",
//                 }}
//               >
//                 Attendance Record
//               </h4>
//               {[
//                 {
//                   label: "School Days Open",
//                   value: report.attendance.schoolDaysOpen,
//                 },
//                 { label: "Days Present", value: report.attendance.daysPresent },
//                 { label: "Days Absent", value: report.attendance.daysAbsent },
//               ].map(({ label, value }) => (
//                 <div
//                   key={label}
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     padding: "4px 0",
//                     borderBottom: "1px solid #e8edf2",
//                   }}
//                 >
//                   <span style={{ fontSize: 10.5, color: "#6b7280" }}>
//                     {label}:
//                   </span>
//                   <span
//                     style={{ fontSize: 11, fontWeight: "600", color: "#111" }}
//                   >
//                     {value}
//                   </span>
//                 </div>
//               ))}
//             </div>
//             {/* Attendance rate pinned to bottom */}
//             <div
//               style={{
//                 padding: "7px 14px",
//                 background: "#1e3a5f",
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 flexShrink: 0,
//               }}
//             >
//               <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)" }}>
//                 Attendance Rate:
//               </span>
//               <span
//                 style={{ fontSize: 12, fontWeight: "bold", color: "#f59e0b" }}
//               >
//                 {report.attendance.attendancePercentage.toFixed(0)}%
//               </span>
//             </div>
//           </div>

//           {/* Comments */}
//           <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//             <div
//               style={{
//                 background: "#f8fafc",
//                 borderRadius: 9,
//                 padding: "12px 13px",
//                 border: "1px solid #e2e8f0",
//                 flex: 1,
//               }}
//             >
//               <h4
//                 style={{
//                   fontSize: 10.5,
//                   fontWeight: "bold",
//                   color: "#1e3a5f",
//                   margin: "0 0 5px",
//                   textTransform: "uppercase",
//                   letterSpacing: "0.5px",
//                 }}
//               >
//                 Class Teacher&apos;s Comment
//               </h4>
//               <p
//                 style={{
//                   fontSize: 11.5,
//                   color: "#374151",
//                   margin: 0,
//                   lineHeight: 1.5,
//                   fontStyle: "italic",
//                 }}
//               >
//                 {report.teacherComment ?? "No comment provided."}
//               </p>
//             </div>
//             <div
//               style={{
//                 background: "#f8fafc",
//                 borderRadius: 9,
//                 padding: "12px 13px",
//                 border: "1px solid #e2e8f0",
//                 flex: 1,
//               }}
//             >
//               <h4
//                 style={{
//                   fontSize: 10.5,
//                   fontWeight: "bold",
//                   color: "#1e3a5f",
//                   margin: "0 0 5px",
//                   textTransform: "uppercase",
//                   letterSpacing: "0.5px",
//                 }}
//               >
//                 Principal&apos;s Comment
//               </h4>
//               <p
//                 style={{
//                   fontSize: 11.5,
//                   color: "#374151",
//                   margin: 0,
//                   lineHeight: 1.5,
//                   fontStyle: "italic",
//                 }}
//               >
//                 {report.principalComment ?? "Keep up the good work!"}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* ── PROMOTION STATUS (Third Term only) ── */}
//         {/* ── PROMOTION STATUS (Third Term only) ── */}
//         {isThirdTerm && report.promotedToClass && (
//           <div style={{ padding: "0 28px 10px", flexShrink: 0 }}>
//             {report.promotedToClass === "Pending Department Assignment" ? (
//               <div
//                 style={{
//                   padding: "11px 15px",
//                   borderRadius: 9,
//                   background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
//                   border: "1px solid #fde68a",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 10,
//                 }}
//               >
//                 <span style={{ fontSize: 18 }}>⏳</span>
//                 <div>
//                   <p
//                     style={{
//                       fontSize: 12.5,
//                       fontWeight: "bold",
//                       color: "#92400e",
//                       margin: 0,
//                     }}
//                   >
//                     DEPARTMENT ASSIGNMENT PENDING
//                   </p>
//                   <p
//                     style={{
//                       fontSize: 10.5,
//                       color: "#78350f",
//                       margin: "2px 0 0",
//                       opacity: 0.8,
//                     }}
//                   >
//                     Your child has passed! Admin will assign your SSS 1 class
//                     and department shortly.
//                   </p>
//                 </div>
//               </div>
//             ) : report.promotedToClass === "Graduated" ? (
//               <div
//                 style={{
//                   padding: "11px 15px",
//                   borderRadius: 9,
//                   background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
//                   border: "1px solid #6ee7b7",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 10,
//                 }}
//               >
//                 <span style={{ fontSize: 18 }}>🎓</span>
//                 <div>
//                   <p
//                     style={{
//                       fontSize: 12.5,
//                       fontWeight: "bold",
//                       color: "#065f46",
//                       margin: 0,
//                     }}
//                   >
//                     CONGRATULATIONS — GRADUATED!
//                   </p>
//                   <p
//                     style={{
//                       fontSize: 10.5,
//                       color: "#065f46",
//                       margin: "2px 0 0",
//                       opacity: 0.7,
//                     }}
//                   >
//                     Your child has successfully completed SSS 2. Well done!
//                     {/* Your child has successfully completed SSS 3. Well done! */}
//                   </p>
//                 </div>
//               </div>
//             ) : report.promotedToClass === "Performance Under Review" ? (
//               <div
//                 style={{
//                   padding: "11px 15px",
//                   borderRadius: 9,
//                   background: "linear-gradient(135deg, #fee2e2, #fecaca)",
//                   border: "1px solid #fca5a5",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 10,
//                 }}
//               >
//                 <span style={{ fontSize: 18 }}>📋</span>
//                 <div>
//                   <p
//                     style={{
//                       fontSize: 12.5,
//                       fontWeight: "bold",
//                       color: "#991b1b",
//                       margin: 0,
//                     }}
//                   >
//                     PERFORMANCE UNDER REVIEW
//                   </p>
//                   <p
//                     style={{
//                       fontSize: 10.5,
//                       color: "#7f1d1d",
//                       margin: "2px 0 0",
//                       opacity: 0.8,
//                     }}
//                   >
//                     Please contact the school for further information.
//                   </p>
//                 </div>
//               </div>
//             ) : report.isPromoted ? (
//               <div
//                 style={{
//                   padding: "11px 15px",
//                   borderRadius: 9,
//                   background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
//                   border: "1px solid #6ee7b7",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 10,
//                 }}
//               >
//                 <span style={{ fontSize: 18 }}>🎉</span>
//                 <div>
//                   <p
//                     style={{
//                       fontSize: 12.5,
//                       fontWeight: "bold",
//                       color: "#065f46",
//                       margin: 0,
//                     }}
//                   >
//                     PROMOTED TO: {report.promotedToClass}
//                   </p>
//                   <p
//                     style={{
//                       fontSize: 10.5,
//                       color: "#065f46",
//                       margin: "2px 0 0",
//                       opacity: 0.7,
//                     }}
//                   >
//                     Congratulations! Continue to excel in the next academic
//                     year.
//                   </p>
//                 </div>
//               </div>
//             ) : null}
//           </div>
//         )}

//         {/* ── NEXT TERM DATE ── */}
//         {report.nextTermResumptionDate && (
//           <div style={{ padding: "0 28px 10px", flexShrink: 0 }}>
//             <div
//               style={{
//                 padding: "9px 15px",
//                 borderRadius: 7,
//                 background: "#fffbeb",
//                 border: "1px solid #fde68a",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 8,
//               }}
//             >
//               <span style={{ fontSize: 15 }}>📅</span>
//               <div>
//                 <span
//                   style={{
//                     fontSize: 10.5,
//                     color: "#78350f",
//                     fontWeight: "600",
//                     textTransform: "uppercase",
//                   }}
//                 >
//                   Next Term Resumption:
//                 </span>
//                 <span
//                   style={{
//                     fontSize: 12.5,
//                     color: "#92400e",
//                     fontWeight: "bold",
//                     marginLeft: 8,
//                   }}
//                 >
//                   {formatDate(report.nextTermResumptionDate)}
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── FOOTER ── */}
//         <div
//           style={{
//             padding: "12px 28px",
//             background: "#0a1628",
//             color: "white",
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             flexShrink: 0,
//           }}
//         >
//           <div>
//             <p
//               style={{
//                 fontSize: 9.5,
//                 color: "rgba(255,255,255,0.4)",
//                 margin: 0,
//               }}
//             >
//               Report generated on{" "}
//               {new Date().toLocaleDateString("en-NG", {
//                 day: "2-digit",
//                 month: "long",
//                 year: "numeric",
//               })}
//             </p>
//             <p
//               style={{
//                 fontSize: 9.5,
//                 color: "rgba(255,255,255,0.3)",
//                 margin: "2px 0 0",
//               }}
//             >
//               Report ID: {report._id} · Scan QR code to verify authenticity
//             </p>
//           </div>

//           {/* Signature — single block */}
//           <div style={{ textAlign: "right" }}>
//             {report.principalSignature ? (
//               <img
//                 src={report.principalSignature}
//                 alt="Principal Signature"
//                 style={{
//                   height: 44,
//                   objectFit: "contain",
//                   marginBottom: 4,
//                   display: "block",
//                   marginLeft: "auto",
//                   filter: "brightness(0) invert(1)",
//                 }}
//               />
//             ) : (
//               <div
//                 style={{
//                   width: 110,
//                   height: 1,
//                   background: "rgba(255,255,255,0.2)",
//                   marginBottom: 4,
//                 }}
//               />
//             )}
//             <p
//               style={{
//                 fontSize: 9.5,
//                 color: "rgba(255,255,255,0.4)",
//                 margin: 0,
//               }}
//             >
//               Principal&apos;s Signature
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useRef, useState, useEffect } from "react";
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
    principalSignature?: string | null;
  };
  showActions?: boolean;
}

const SCHOOL_LOGO_URL =
  "https://res.cloudinary.com/disxrmlco/image/upload/v1771881211/android-chrome-512x512_mc7kty.png";

const A4_W = 794;
const A4_H = 1123;

export default function ReportCardComponent({
  report,
  showActions = true,
}: ReportCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  // Compute scale whenever the wrapper resizes
  useEffect(() => {
    function updateScale() {
      if (!wrapperRef.current) return;
      const available = wrapperRef.current.clientWidth;
      const newScale = Math.min(1, available / A4_W);
      setScale(newScale);
    }
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

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
    // Also convert profile photo
  if (report.studentSnapshot.profilePhoto) {
    const base64 = await convertImageToBase64(report.studentSnapshot.profilePhoto);
    setProfilePhotoBase64(base64);
  }
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
      const base64 = await convertImageToBase64(report.studentSnapshot.profilePhoto);
      setProfilePhotoBase64(base64);
    }

    await new Promise((r) => setTimeout(r, 500));

    const { jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    if (!cardRef.current) return;

    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      logging: false,
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

      {/* 
        Outer wrapper: full width, height collapses to the scaled card height.
        The card itself is always A4 but scaled down on small screens.
      */}
      <div
        ref={wrapperRef}
        className="w-full overflow-hidden no-print-scale"
        style={{ height: A4_H * scale }}
      >
        <div
          style={{
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            width: A4_W,
          }}
        >
          {/* ── Report Card — fixed A4 size always ── */}
          <div
            ref={cardRef}
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
                    {report.studentSnapshot.surname.charAt(0)}
                    {report.studentSnapshot.firstName.charAt(0)}
                    {report.studentSnapshot.otherName.charAt(0)}
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
                    value: `${report.studentSnapshot.surname} ${report.studentSnapshot.firstName} ${report.studentSnapshot.otherName}`,
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
                      <td style={{ padding: "4px 5px", borderBottom: "1px solid #f0f4f8", textAlign: "center" }}>
                        {subject.testScore}
                      </td>
                      <td style={{ padding: "4px 5px", borderBottom: "1px solid #f0f4f8", textAlign: "center" }}>
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
                      <td style={{ padding: "4px 5px", borderBottom: "1px solid #f0f4f8", textAlign: "center" }}>
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
                    <td colSpan={4} style={{ padding: "7px 8px", fontWeight: "bold", fontSize: 11.5 }}>
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
                    <td style={{ padding: "7px 5px", textAlign: "center", fontWeight: "bold", color: "#f59e0b" }}>
                      {report.grade}
                    </td>
                    <td style={{ padding: "7px 5px", textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.85)" }}>
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

            {/* ── ATTENDANCE + COMMENTS ── */}
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
                    { label: "School Days Open", value: report.attendance.schoolDaysOpen },
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
                      <span style={{ fontSize: 10.5, color: "#6b7280" }}>{label}:</span>
                      <span style={{ fontSize: 11, fontWeight: "600", color: "#111" }}>{value}</span>
                    </div>
                  ))}
                </div>
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
                  <span style={{ fontSize: 12, fontWeight: "bold", color: "#f59e0b" }}>
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
                      <p style={{ fontSize: 12.5, fontWeight: "bold", color: "#92400e", margin: 0 }}>
                        DEPARTMENT ASSIGNMENT PENDING
                      </p>
                      <p style={{ fontSize: 10.5, color: "#78350f", margin: "2px 0 0", opacity: 0.8 }}>
                        Your child has passed! Admin will assign your SSS 1 class and department shortly.
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
                      <p style={{ fontSize: 12.5, fontWeight: "bold", color: "#065f46", margin: 0 }}>
                        CONGRATULATIONS — GRADUATED!
                      </p>
                      <p style={{ fontSize: 10.5, color: "#065f46", margin: "2px 0 0", opacity: 0.7 }}>
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
                      <p style={{ fontSize: 12.5, fontWeight: "bold", color: "#991b1b", margin: 0 }}>
                        PERFORMANCE UNDER REVIEW
                      </p>
                      <p style={{ fontSize: 10.5, color: "#7f1d1d", margin: "2px 0 0", opacity: 0.8 }}>
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
                      <p style={{ fontSize: 12.5, fontWeight: "bold", color: "#065f46", margin: 0 }}>
                        PROMOTED TO: {report.promotedToClass}
                      </p>
                      <p style={{ fontSize: 10.5, color: "#065f46", margin: "2px 0 0", opacity: 0.7 }}>
                        Congratulations! Continue to excel in the next academic year.
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
                    <span style={{ fontSize: 10.5, color: "#78350f", fontWeight: "600", textTransform: "uppercase" }}>
                      Next Term Resumption:
                    </span>
                    <span style={{ fontSize: 12.5, color: "#92400e", fontWeight: "bold", marginLeft: 8 }}>
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
                <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  Report generated on{" "}
                  {new Date().toLocaleDateString("en-NG", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>
                  Report ID: {report._id} · Scan QR code to verify authenticity
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                {report.principalSignature ? (
                  <img
                    src={report.principalSignature}
                    alt="Principal Signature"
                    style={{
                      height: 44,
                      objectFit: "contain",
                      marginBottom: 4,
                      display: "block",
                      marginLeft: "auto",
                      filter: "brightness(0) invert(1)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 110,
                      height: 1,
                      background: "rgba(255,255,255,0.2)",
                      marginBottom: 4,
                    }}
                  />
                )}
                <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  Principal&apos;s Signature
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}