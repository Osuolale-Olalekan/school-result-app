import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
}

export default async function VerifyReportPage({ params }: Props) {
  // Fetch the report from your DB using the ID
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/report-card/${params.id}`, {
    cache: "no-store",
  });

  if (!res.ok) return notFound();

  const report = await res.json();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full border border-gray-200">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">✅</span>
          </div>
          <h1 className="text-xl font-bold text-[#1e3a5f]">Report Card Verified</h1>
          <p className="text-sm text-gray-500 mt-1">This report card is authentic</p>
        </div>

        {/* Student Details */}
        <div className="space-y-3 text-sm">
          {[
            { label: "Student Name", value: `${report.studentSnapshot.surname} ${report.studentSnapshot.firstName}` },
            { label: "Admission No.", value: report.studentSnapshot.admissionNumber },
            { label: "Class", value: report.className },
            { label: "Term", value: report.termName },
            { label: "Session", value: report.sessionName },
            { label: "Total Score", value: `${report.totalObtained}/${report.totalObtainable}` },
            { label: "Grade", value: report.grade },
            { label: "Percentage", value: `${report.percentage.toFixed(1)}%` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">{label}</span>
              <span className="font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          God&apos;s Way Model Schools
        </div>
      </div>
    </div>
  );
}