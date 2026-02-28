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
  firstName: string;
  lastName: string;
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
      const j1 = (await studRes.json()) as {
        success: boolean;
        data?: Student[];
      };
      const j2 = (await classRes.json()) as {
        success: boolean;
        data?: Class[];
      };
      if (j1.success && j1.data) setStudents(j1.data);
      if (j2.success && j2.data) {
        
        setClasses(j2.data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePromote() {
    if (!promoteModal || !selectedClass) {
      toast.error("Please select a target class");
      return;
    }

    // ← Add this check
    if (
      isSSS1Transition &&
      selectedClass !== "graduate" &&
      selectedDept === Department.NONE
    ) {
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
      s.firstName.toLowerCase().includes(term) ||
      s.lastName.toLowerCase().includes(term) ||
      s.admissionNumber.toLowerCase().includes(term)
    );
  });

  const targetClasses = promoteModal
    ? classes.filter(
        (c) =>
          c.order > (promoteModal.currentClass?.order ?? 0) ||
          c._id !== promoteModal.currentClass?._id,
      )
    : [];

  const isSSS1Transition = promoteModal?.currentClass?.name === "JSS 3";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Student Promotion
        </h1>
        <p className="text-gray-500 text-sm">
          Manually promote or move students between classes
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Student
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Current Class
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                  Department
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
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
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        {student.admissionNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700">
                      {student.currentClass?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      {student.department !== Department.NONE ? (
                        <span className="capitalize text-gray-600">
                          {student.department}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          student.studentStatus === StudentStatus.ACTIVE
                            ? "bg-emerald-100 text-emerald-700"
                            : student.studentStatus === StudentStatus.GRADUATED
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
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
      </div>

      {/* Promote Modal */}
      {promoteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-display text-lg font-bold text-gray-900 mb-1">
              Promote Student
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {promoteModal.firstName} {promoteModal.lastName} — currently in{" "}
              {promoteModal.currentClass?.name ?? "Unknown"}
            </p>

            {isSSS1Transition && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  This student is transitioning from JSS 3 to SSS 1. Please
                  assign a department (Science, Art, or Commercial).
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Class *
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="">Select target class...</option>
                  {classes
                    .filter((c) => c._id !== promoteModal.currentClass?._id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                        {c.department !== Department.NONE
                          ? ` (${c.department})`
                          : ""}
                      </option>
                    ))}
                  <option value="graduate">
                    🎓 Graduate Student (SSS 2 completion)
                  </option>
                </select>
              </div>

              {(isSSS1Transition || selectedClass) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department{" "}
                    {isSSS1Transition && selectedClass !== "graduate" && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) =>
                      setSelectedDept(e.target.value as Department)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
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
            </div>

            <div className="flex gap-3 mt-5">
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
      )}
    </div>
  );
}
