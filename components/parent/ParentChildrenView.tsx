"use client";

import { useEffect, useState } from "react";
import { GraduationCap, FileText } from "lucide-react";
import Link from "next/link";

interface ChildInfo {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  profilePhoto?: string;
  currentClass: { name: string; section: string };
  gender: string;
  studentStatus: string;
}

export default function ParentChildrenView() {
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  async function fetchChildren() {
    try {
      const res = await fetch("/api/parent/me");
      const json = await res.json() as { success: boolean; data?: { children?: ChildInfo[] } };
      if (json.success && json.data?.children) {
        setChildren(json.data.children as ChildInfo[]);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">My Children</h1>
        <p className="text-gray-500 text-sm">View your children&apos;s academic information and report cards</p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500">No children linked to your account</p>
          <p className="text-gray-400 text-sm mt-1">Contact the school admin to link your children</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {children.map((child) => (
            <div key={child._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-amber-200 transition-colors">
              <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-700 flex-shrink-0">
                    {child.profilePhoto ? (
                      <img src={child.profilePhoto} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      `${child.firstName.charAt(0)}${child.lastName.charAt(0)}`
                    )}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900">{child.firstName} {child.lastName}</h3>
                    <p className="text-sm text-gray-500">{child.currentClass?.name}</p>
                    <p className="text-xs font-mono text-gray-400">{child.admissionNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{child.studentStatus}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{child.gender}</p>
                  </div>
                </div>

                <Link
                  href={`/parent/reports?studentId=${child._id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-medium hover:bg-[#152847] transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Report Cards
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
