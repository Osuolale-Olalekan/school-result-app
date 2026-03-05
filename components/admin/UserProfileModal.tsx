"use client";

import { useEffect, useState } from "react";
import {
  X,
  Mail,
  Phone,
  Briefcase,
  Heart,
  GraduationCap,
  BookOpen,
  Award,
  Calendar,
  MapPin,
  User,
  Droplets,
  Shield,
  Loader2,
  Edit,
} from "lucide-react";
import { UserRole, UserStatus } from "@/types/enums";
import { formatDate, getInitials } from "@/lib/utils";

interface Child {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  admissionNumber: string;
  profilePhoto?: string;
  gender: string;
  studentStatus: string;
  currentClass?: { name: string; section?: string };
}

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

interface FullUser {
  _id: string;
  surname: string;
  firstName: string;
  otherName: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  roles: UserRole[];
  activeRole: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
  // Student
  admissionNumber?: string;
  admissionDate?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  department?: string;
  studentStatus?: string;
  bloodGroup?: string;
  religion?: string;
  stateOfOrigin?: string;
  currentClass?: { name: string; section?: string };
  parents?: Parent[];
  // Teacher
  employeeId?: string;
  qualification?: string;
  specialization?: string;
  dateOfEmployment?: string;
  // Parent
  occupation?: string;
  relationship?: string;
  children?: Child[];
  classAssignments?: Array<{
    className: string;
    section?: string;
    session: string;
  }>;
}

interface Props {
  userId: string;
  onClose: () => void;
  onEdit: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-amber-100 text-amber-700",
  teacher: "bg-blue-100 text-blue-700",
  student: "bg-purple-100 text-purple-700",
  parent: "bg-emerald-100 text-emerald-700",
};

const AVATAR_COLORS: Record<string, string> = {
  admin: "bg-amber-100 text-amber-700",
  teacher: "bg-blue-100 text-blue-700",
  student: "bg-purple-100 text-purple-700",
  parent: "bg-emerald-100 text-emerald-700",
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function UserProfileModal({ userId, onClose, onEdit }: Props) {
  const [user, setUser] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((j: { success: boolean; data?: FullUser }) => {
        if (j.success && j.data) setUser(j.data);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const primaryRole = user?.roles?.[0] ?? "student";
  const fullName = user
    ? `${user.surname} ${user.firstName} ${user.otherName}`
    : "";
  const isAlsoParent =
    user?.roles?.includes(UserRole.PARENT) &&
    user?.roles?.includes(UserRole.TEACHER);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900">User Profile</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e3a5f] text-white text-xs font-medium hover:bg-[#152847] transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : !user ? (
            <div className="text-center py-20 text-gray-400">
              Failed to load profile
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden ${AVATAR_COLORS[primaryRole] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(user.surname, user.firstName, user.otherName)
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {fullName}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    ))}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.status === UserStatus.ACTIVE
                          ? "bg-emerald-100 text-emerald-700"
                          : user.status === UserStatus.SUSPENDED
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {user.status.charAt(0).toUpperCase() +
                        user.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Basic Information
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <InfoRow icon={Mail} label="Email" value={user.email} />
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={user.phone ?? "Not provided"}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Member Since"
                    value={formatDate(user.createdAt)}
                  />
                  {user.lastLogin && (
                    <InfoRow
                      icon={Calendar}
                      label="Last Login"
                      value={formatDate(user.lastLogin)}
                    />
                  )}
                </div>
              </div>

              {/* Student-specific */}
              {primaryRole === UserRole.STUDENT && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Academic Information
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <InfoRow
                        icon={BookOpen}
                        label="Admission No."
                        value={user.admissionNumber ?? "N/A"}
                      />
                      <InfoRow
                        icon={BookOpen}
                        label="Class"
                        value={user.currentClass?.name ?? "Not assigned"}
                      />
                      <InfoRow
                        icon={Shield}
                        label="Department"
                        value={
                          user.department && user.department !== "none"
                            ? user.department.charAt(0).toUpperCase() +
                              user.department.slice(1)
                            : "N/A"
                        }
                      />
                      <InfoRow
                        icon={Calendar}
                        label="Admission Date"
                        value={
                          user.admissionDate
                            ? formatDate(user.admissionDate)
                            : "N/A"
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Personal Information
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <InfoRow
                        icon={Calendar}
                        label="Date of Birth"
                        value={
                          user.dateOfBirth
                            ? formatDate(user.dateOfBirth)
                            : "Not provided"
                        }
                      />
                      <InfoRow
                        icon={User}
                        label="Gender"
                        value={
                          user.gender
                            ? user.gender.charAt(0).toUpperCase() +
                              user.gender.slice(1)
                            : "Not provided"
                        }
                      />
                      <InfoRow
                        icon={Droplets}
                        label="Blood Group"
                        value={user.bloodGroup ?? "Not provided"}
                      />
                      <InfoRow
                        icon={MapPin}
                        label="State of Origin"
                        value={user.stateOfOrigin ?? "Not provided"}
                      />
                      <InfoRow
                        icon={MapPin}
                        label="Address"
                        value={user.address ?? "Not provided"}
                      />
                    </div>
                  </div>
                  {(user.guardianName ?? user.guardianPhone) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Guardian
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {user.guardianName && (
                          <InfoRow
                            icon={User}
                            label="Guardian Name"
                            value={user.guardianName}
                          />
                        )}
                        {user.guardianPhone && (
                          <InfoRow
                            icon={Phone}
                            label="Guardian Phone"
                            value={user.guardianPhone}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  {!!user.parents?.length && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Parents / Guardians
                      </p>
                      <div className="space-y-2">
                        {user.parents.map((p) => (
                          <div
                            key={p._id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                          >
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
                              {p.surname.charAt(0)}
                              {p.firstName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">
                                {p.surname} {p.firstName} {p.otherName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {p.relationship
                                  ? p.relationship.charAt(0).toUpperCase() +
                                    p.relationship.slice(1)
                                  : "Parent"}{" "}
                                · {p.phone ?? p.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Teacher-specific */}
              {primaryRole === UserRole.TEACHER && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Employment Information
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <InfoRow
                      icon={Award}
                      label="Employee ID"
                      value={user.employeeId ?? "N/A"}
                    />
                    <InfoRow
                      icon={BookOpen}
                      label="Qualification"
                      value={user.qualification ?? "Not provided"}
                    />
                    <InfoRow
                      icon={BookOpen}
                      label="Specialization"
                      value={user.specialization ?? "Not provided"}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Date of Employment"
                      value={
                        user.dateOfEmployment
                          ? formatDate(user.dateOfEmployment)
                          : "Not provided"
                      }
                    />
                  </div>
                </div>
              )}

              {primaryRole === UserRole.TEACHER &&
                !!user.classAssignments?.length && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Assigned Classes
                    </p>
                    <div className="space-y-2">
                      {user.classAssignments.map((a, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {a.className}
                            </p>
                            <p className="text-xs text-gray-400">
                              {a.session} Session
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Parent-specific */}
              {(primaryRole === UserRole.PARENT || isAlsoParent) && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Parent Information
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <InfoRow
                      icon={Briefcase}
                      label="Occupation"
                      value={user.occupation ?? "Not provided"}
                    />
                    <InfoRow
                      icon={Heart}
                      label="Relationship to Child"
                      value={
                        user.relationship
                          ? user.relationship.charAt(0).toUpperCase() +
                            user.relationship.slice(1)
                          : "Not provided"
                      }
                    />
                  </div>
                </div>
              )}

              {/* Children */}
              {!!user.children?.length && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {user.children.length === 1 ? "Child" : "Children"} (
                    {user.children.length})
                  </p>
                  <div className="space-y-2">
                    {user.children.map((child) => (
                      <div
                        key={child._id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0 overflow-hidden">
                          {child.profilePhoto ? (
                            <img
                              src={child.profilePhoto}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            `${child.surname.charAt(0)}${child.firstName.charAt(0)}`
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            {child.surname} {child.firstName} {child.otherName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {child.admissionNumber} ·{" "}
                            {child.currentClass?.name ?? "No class"}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${child.studentStatus === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {child.studentStatus?.charAt(0).toUpperCase() +
                            child.studentStatus?.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
