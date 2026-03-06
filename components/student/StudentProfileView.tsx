"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, User, Calendar, BookOpen, Droplets, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Parent {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  phone?: string;
  email: string;
  relationship?: string;
  occupation?: string;
}

interface StudentProfile {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  admissionNumber: string;
  admissionDate?: string;
  dateOfBirth?: string;
  gender: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  department?: string;
  studentStatus: string;
  bloodGroup?: string;
  religion?: string;
  stateOfOrigin?: string;
  currentClass?: { name: string; section?: string };
  parents?: Parent[];
  createdAt: string;
}

export default function StudentProfileView() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/me")
      .then(r => r.json())
      .then((j: { success: boolean; data?: StudentProfile }) => {
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
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm">Your student information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#1e3a5f] to-[#0a1628]" />
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4 flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-white bg-purple-100 flex items-center justify-center text-purple-700 text-2xl font-bold shadow-sm overflow-hidden">
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                `${profile.surname.charAt(0)}${profile.firstName.charAt(0)}`
              )}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-white py-2">{fullName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Student</span>
                <span className="text-xs text-gray-400">{profile.admissionNumber}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Mail,     label: "Email",           value: profile.email },
              { icon: Phone,    label: "Phone",           value: profile.phone ?? "Not provided" },
              { icon: BookOpen, label: "Class",           value: profile.currentClass?.name ?? "Not assigned" },
              { icon: BookOpen, label: "Department",      value: profile.department && profile.department !== "none" ? profile.department.charAt(0).toUpperCase() + profile.department.slice(1) : "N/A" },
              { icon: Calendar, label: "Date of Birth",   value: profile.dateOfBirth ? formatDate(profile.dateOfBirth) : "Not provided" },
              { icon: User,     label: "Gender",          value: profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : "Not provided" },
              { icon: Calendar, label: "Admission Date",  value: profile.admissionDate ? formatDate(profile.admissionDate) : "Not provided" },
              { icon: Droplets, label: "Blood Group",     value: profile.bloodGroup ?? "Not provided" },
              { icon: MapPin,   label: "State of Origin", value: profile.stateOfOrigin ?? "Not provided" },
              { icon: MapPin,   label: "Address",         value: profile.address ?? "Not provided" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guardian Info */}
      {(profile.guardianName ?? profile.guardianPhone) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Guardian Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.guardianName && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Guardian Name</p>
                  <p className="text-sm font-medium text-gray-800">{profile.guardianName}</p>
                </div>
              </div>
            )}
            {profile.guardianPhone && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Guardian Phone</p>
                  <p className="text-sm font-medium text-gray-800">{profile.guardianPhone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Parents */}
      {!!profile.parents?.length && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Parent{profile.parents.length > 1 ? "s" : ""} / Guardian{profile.parents.length > 1 ? "s" : ""}
          </h3>
          <div className="space-y-3">
            {profile.parents.map((parent) => (
              <div key={parent._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                  {parent.surname.charAt(0)}{parent.firstName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {parent.surname} {parent.firstName} {parent.otherName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {parent.relationship ? parent.relationship.charAt(0).toUpperCase() + parent.relationship.slice(1) : "Parent"}
                    {parent.occupation ? ` · ${parent.occupation}` : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p>{parent.phone ?? ""}</p>
                  <p>{parent.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}