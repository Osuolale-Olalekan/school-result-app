"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface TeacherStats {
  assignedClasses: number;
  totalStudents: number;
  pendingReports: number;
  approvedReports: number;
  declinedReports: number;
}

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState<TeacherStats | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/teacher/classes");
      const json = await res.json() as { success: boolean; data?: unknown[] };
      if (json.success) {
        setStats({
          assignedClasses: json.data?.length ?? 0,
          totalStudents: 0,
          pendingReports: 0,
          approvedReports: 0,
          declinedReports: 0,
        });
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your classes and submit student results.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: "My Classes", value: stats?.assignedClasses ?? 0, color: "bg-blue-500", href: "/teacher/classes" },
          { icon: FileText, label: "Results Submitted", value: stats?.approvedReports ?? 0, color: "bg-emerald-500", href: "/teacher/results" },
          { icon: Clock, label: "Pending Approval", value: stats?.pendingReports ?? 0, color: "bg-amber-500", href: "/teacher/results" },
          { icon: AlertTriangle, label: "Declined", value: stats?.declinedReports ?? 0, color: "bg-red-500", href: "/teacher/results" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold font-display text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-display font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/teacher/classes"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">View My Classes</p>
              <p className="text-xs text-gray-500">See your assigned classes & students</p>
            </div>
          </Link>
          <Link
            href="/teacher/results"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Enter Results</p>
              <p className="text-xs text-gray-500">Input test & exam scores for students</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
