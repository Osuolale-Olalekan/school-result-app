"use client";

import { useEffect, useState } from "react";
import { User, Phone, Mail, Briefcase, Heart, GraduationCap, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Child {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  admissionNumber: string;
  profilePhoto?: string;
  gender: string;
  studentStatus: string;
  dateOfBirth?: string;
  currentClass?: { name: string; section?: string };
}

interface ParentProfile {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  occupation?: string;
  relationship?: string;
  status: string;
  children?: Child[];
  createdAt: string;
}

export default function ParentProfileView() {
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/me")
      .then(r => r.json())
      .then((j: { success: boolean; data?: ParentProfile }) => {
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

  return (
    <div className="space-y-4 w-full max-w-3xl">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm">Your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header banner */}
        <div className="h-20 sm:h-24 bg-gradient-to-r from-[#1e3a5f] to-[#0a1628]" />

        <div className="px-3 min-[380px]:px-4 sm:px-6 pb-5">
          {/* Avatar + name row */}
          <div className="-mt-8 min-[380px]:-mt-10 sm:-mt-12 mb-4 flex items-end gap-2 min-[380px]:gap-3">
            <div className="w-14 h-14 min-[380px]:w-16 min-[380px]:h-16 sm:w-20 sm:h-20 rounded-2xl border-4 border-white bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg min-[380px]:text-xl sm:text-2xl font-bold shadow-sm overflow-hidden flex-shrink-0">
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                `${profile.surname.charAt(0)}${profile.firstName.charAt(0)}`
              )}
            </div>
            <div className="pb-1 min-w-0">
              <h2 className="text-sm min-[380px]:text-base sm:text-xl font-bold text-white leading-tight truncate">{fullName}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium capitalize inline-block mt-1">
                Parent
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: Mail, label: "Email", value: profile.email },
              { icon: Phone, label: "Phone", value: profile.phone ?? "Not provided" },
              { icon: Briefcase, label: "Occupation", value: profile.occupation ?? "Not provided" },
              { icon: Heart, label: "Relationship to Child", value: profile.relationship ? profile.relationship.charAt(0).toUpperCase() + profile.relationship.slice(1) : "Not provided" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2 min-[380px]:gap-3 p-2.5 min-[380px]:p-3 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 min-[380px]:w-8 min-[380px]:h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-xs min-[380px]:text-sm font-medium text-gray-800 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Children */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 min-[380px]:p-4 sm:p-6">
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
              <div key={child._id} className="flex items-center gap-2 min-[380px]:gap-3 p-2.5 min-[380px]:p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs min-[380px]:text-sm flex-shrink-0 overflow-hidden">
                  {child.profilePhoto ? (
                    <img src={child.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    `${child.surname.charAt(0)}${child.firstName.charAt(0)}`
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-xs min-[380px]:text-sm truncate">
                    {child.surname} {child.firstName} {child.otherName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {child.admissionNumber} · {child.currentClass?.name ?? "No class"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      child.studentStatus === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {child.studentStatus.charAt(0).toUpperCase() + child.studentStatus.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">{child.gender}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}