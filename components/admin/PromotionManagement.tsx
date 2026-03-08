"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  GraduationCap,
  Search,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { Department, StudentStatus } from "@/types/enums";
import { toast } from "sonner";

interface Student {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  admissionNumber: string;
  studentStatus: StudentStatus;
  currentClass: {
    _id: string;
    name: string;
    section: string;
    order: number;
  };
  department: Department;
  promotionEligibility?: {
    eligible: boolean;
    reason: string;
    allThreeTermsHaveApprovedReports: boolean;
    percentages: number[];
    lowestPercentage: number;
  };
}

interface Class {
  _id: string;
  name: string;
  section: string;
  department: Department;
  order: number;
}

export default function PromotionManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [promoteModal, setPromoteModal] = useState<Student | null>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDept, setSelectedDept] = useState<Department>(Department.NONE);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [studRes, classRes] = await Promise.all([
        fetch("/api/admin/users?role=student&limit=100"),
        fetch("/api/admin/classes"),
      ]);
      const j1 = (await studRes.json()) as { success: boolean; data?: Student[] };
      const j2 = (await classRes.json()) as { success: boolean; data?: Class[] };
      if (j1.success && j1.data) setStudents(j1.data);
      if (j2.success && j2.data) setClasses(j2.data);
    } finally {
      setLoading(false);
    }
  }

  async function handlePromote() {
    if (!promoteModal || !selectedClass) {
      toast.error("Please select a target class");
      return;
    }
    if (isSSS1Transition && selectedClass !== "graduate" && selectedDept === Department.NONE) {
      toast.error("Please assign a department for JSS 3 to SSS 1 transition");
      return;
    }

    setPromoting(true);
    try {
      const body: Record<string, string> = { targetClassId: selectedClass };
      if (selectedDept !== Department.NONE) body.department = selectedDept;

      const res = await fetch(`/api/admin/promote/${promoteModal._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        success: boolean;
        message?: string;
        error?: string;
      };
      if (json.success) {
        toast.success(json.message ?? "Student promoted successfully");
        setPromoteModal(null);
        fetchData();
      } else {
        toast.error(json.error ?? "Failed to promote student");
      }
    } finally {
      setPromoting(false);
    }
  }

  const filtered = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.surname.toLowerCase().includes(term) ||
      s.firstName.toLowerCase().includes(term) ||
      s.otherName.toLowerCase().includes(term) ||
      s.admissionNumber.toLowerCase().includes(term)
    );
  });

  const isSSS1Transition = promoteModal?.currentClass?.name === "JSS 3";

  const selectCls =
    "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400";

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">
          Student Promotion
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
          Manually promote or move students between classes
        </p>
      </div>

      {/* ── Search ── */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* ── Table (sm+) / Cards (mobile) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Desktop table — hidden below sm */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Current Class</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No students found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">
                        {student.surname} {student.firstName} {student.otherName}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">{student.admissionNumber}</p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700">
                      {student.currentClass?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {student.department !== Department.NONE ? (
                        <span className="capitalize text-gray-600">{student.department}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        student.studentStatus === StudentStatus.ACTIVE
                          ? "bg-emerald-100 text-emerald-700"
                          : student.studentStatus === StudentStatus.GRADUATED
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                      }`}>
                        {student.studentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {student.studentStatus !== StudentStatus.GRADUATED && (
                        <button
                          onClick={() => {
                            setPromoteModal(student);
                            setSelectedClass("");
                            setSelectedDept(Department.NONE);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f] text-xs font-medium hover:bg-[#1e3a5f]/20"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          Promote
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list — shown below sm */}
        <div className="sm:hidden divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 space-y-2 animate-pulse">
                <div className="h-3.5 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="flex gap-2 mt-1">
                  <div className="h-5 w-14 bg-gray-100 rounded-full" />
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <GraduationCap className="w-9 h-9 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No students found</p>
            </div>
          ) : (
            filtered.map((student) => (
              <div key={student._id} className="p-3 flex items-start gap-3">

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {student.surname} {student.firstName} {student.otherName}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">{student.admissionNumber}</p>

                  {/* Class · Dept */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      {student.currentClass?.name ?? "—"}
                    </span>
                    {student.department !== Department.NONE && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="capitalize">{student.department}</span>
                      </>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="pt-0.5">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      student.studentStatus === StudentStatus.ACTIVE
                        ? "bg-emerald-100 text-emerald-700"
                        : student.studentStatus === StudentStatus.GRADUATED
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                    }`}>
                      {student.studentStatus}
                    </span>
                  </div>
                </div>

                {/* Promote button */}
                {student.studentStatus !== StudentStatus.GRADUATED && (
                  <button
                    onClick={() => {
                      setPromoteModal(student);
                      setSelectedClass("");
                      setSelectedDept(Department.NONE);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f] text-xs font-medium hover:bg-[#1e3a5f]/20 shrink-0 mt-0.5"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Promote</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Promote Modal — bottom sheet on mobile, centered on sm+ ── */}
      {promoteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">

            {/* Sticky header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-base sm:text-lg font-bold text-gray-900">
                    Promote Student
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-snug">
                    <span className="font-medium">
                      {promoteModal.surname} {promoteModal.firstName} {promoteModal.otherName}
                    </span>
                    {" — "}
                    currently in{" "}
                    <span className="font-medium">
                      {promoteModal.currentClass?.name ?? "Unknown"}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setPromoteModal(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* JSS3 → SSS1 warning */}
              {isSSS1Transition && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    This student is transitioning from JSS 3 to SSS 1. Please
                    assign a department (Science, Art, or Commercial).
                  </p>
                </div>
              )}

              {/* Target class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Target Class *
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select target class...</option>
                  {classes
                    .filter((c) => c._id !== promoteModal.currentClass?._id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                        {c.department !== Department.NONE ? ` (${c.department})` : ""}
                      </option>
                    ))}
                  <option value="graduate">🎓 Graduate Student (SSS 2 completion)</option>
                </select>
              </div>

              {/* Department */}
              {(isSSS1Transition || selectedClass) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Department{" "}
                    {isSSS1Transition && selectedClass !== "graduate" && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value as Department)}
                    className={selectCls}
                  >
                    <option value={Department.NONE}>
                      {isSSS1Transition && selectedClass !== "graduate"
                        ? "Select department (required)..."
                        : "No department change"}
                    </option>
                    <option value={Department.SCIENCE}>Science</option>
                    <option value={Department.ART}>Art</option>
                    <option value={Department.COMMERCIAL}>Commercial</option>
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setPromoteModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePromote}
                  disabled={promoting || !selectedClass}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  {promoting ? "Promoting..." : "Confirm Promotion"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}