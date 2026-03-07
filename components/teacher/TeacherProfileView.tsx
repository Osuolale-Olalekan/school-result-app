"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, BookOpen, Award, Calendar, GraduationCap, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Child {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  admissionNumber: string;
  profilePhoto?: string;
  currentClass?: { name: string };
}

interface TeacherProfile {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  employeeId?: string;
  qualification?: string;
  specialization?: string;
  dateOfEmployment?: string;
  status: string;
  roles: string[];
  children?: Child[];
  createdAt: string;
}

export default function TeacherProfileView() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/me")
      .then(r => r.json())
      .then((j: { success: boolean; data?: TeacherProfile }) => {
        if (j.success && j.data) setProfile(j.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  if (!profile) return (
    <div className="text-center py-20 text-gray-400">Failed to load profile</div>
  );

  const fullName = `${profile.surname} ${profile.firstName} ${profile.otherName}`;
  const isAlsoParent = profile.roles?.includes("parent");

  return (
    <div className="space-y-4 w-full max-w-3xl">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm">Your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-20 sm:h-24 bg-gradient-to-r from-[#1e3a5f] to-[#0a1628]" />
        <div className="px-4 sm:px-6 pb-5">
          {/* Avatar + name */}
          <div className="-mt-10 sm:-mt-12 mb-4 flex items-end gap-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 border-white bg-blue-100 flex items-center justify-center text-blue-700 text-xl sm:text-2xl font-bold shadow-sm overflow-hidden flex-shrink-0">
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                `${profile.surname.charAt(0)}${profile.firstName.charAt(0)}`
              )}
            </div>
            <div className="pb-1 min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-white leading-tight truncate">{fullName}</h2>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                  Teacher
                </span>
                {isAlsoParent && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                    Parent
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: Mail,     label: "Email",              value: profile.email },
              { icon: Phone,    label: "Phone",              value: profile.phone ?? "Not provided" },
              { icon: Award,    label: "Employee ID",        value: profile.employeeId ?? "Not assigned" },
              { icon: BookOpen, label: "Qualification",      value: profile.qualification ?? "Not provided" },
              { icon: BookOpen, label: "Specialization",     value: profile.specialization ?? "Not provided" },
              { icon: Calendar, label: "Date of Employment", value: profile.dateOfEmployment ? formatDate(profile.dateOfEmployment) : "Not provided" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Children — only shown if teacher is also a parent */}
      {isAlsoParent && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-[#1e3a5f] flex-shrink-0" />
            <h3 className="font-semibold text-gray-900">
              My {(profile.children?.length ?? 0) === 1 ? "Child" : "Children"}
              <span className="ml-2 text-xs text-gray-400 font-normal">({profile.children?.length ?? 0})</span>
            </h3>
          </div>
          {!profile.children?.length ? (
            <p className="text-gray-400 text-sm">No children linked to your account yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.children.map((child) => (
                <div key={child._id} className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0 overflow-hidden">
                    {child.profilePhoto ? (
                      <img src={child.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      `${child.surname.charAt(0)}${child.firstName.charAt(0)}`
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {child.surname} {child.firstName} {child.otherName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {child.admissionNumber} · {child.currentClass?.name ?? "No class"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}