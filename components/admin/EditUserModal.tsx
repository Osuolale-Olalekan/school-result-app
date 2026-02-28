"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, Camera, User, Save } from "lucide-react";
import { UserRole } from "@/types/enums";
import { toast } from "sonner";

interface ExtendedUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  // role: UserRole;
  roles: UserRole[];
  activeRole: UserRole;
  profilePhoto?: string;
  // Student fields
  dateOfBirth?: string;
  gender?: string;
  currentClass?: { _id: string; name: string } | string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  // Teacher fields
  qualification?: string;
  specialization?: string;
  // Parent fields
  occupation?: string;
  relationship?: string;
  children?: Array<{ _id: string; firstName: string; lastName: string }> | string[];
}

interface Props {
  user: ExtendedUser;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({ user, onClose, onSuccess }: Props) {
  const primaryRole = user.roles[0];
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user.profilePhoto ?? null);
  const [classes, setClasses] = useState<Array<{ _id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ _id: string; firstName: string; lastName: string }>>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>(() => {
    if (!user.children) return [];
    return user.children.map((c) => typeof c === "string" ? c : c._id);
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAlsoParent, setIsAlsoParent] = useState(
  user.roles?.includes(UserRole.PARENT) ?? false
);

  const [form, setForm] = useState({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    guardianName: user.guardianName ?? "",
    guardianPhone: user.guardianPhone ?? "",
    qualification: user.qualification ?? "",
    specialization: user.specialization ?? "",
    occupation: user.occupation ?? "",
    relationship: user.relationship ?? "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
    gender: user.gender ?? "",
    currentClass: typeof user.currentClass === "object" && user.currentClass !== null
      ? user.currentClass._id
      : user.currentClass ?? "",
  });

  useEffect(() => {
    fetch("/api/admin/classes")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Array<{ _id: string; name: string }> }) => {
        if (j.success && j.data) setClasses(j.data);
      });

    // Fetch students for parent linking (both parents AND teachers)
  if (primaryRole === UserRole.PARENT || primaryRole === UserRole.TEACHER) {
    fetch("/api/admin/users?role=student&limit=100")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Array<{ _id: string; firstName: string; lastName: string }> }) => {
        if (j.success && j.data) setStudents(j.data);
      });
  }
}, [primaryRole]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      formData.append("folder", "school/profiles");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json() as { secure_url?: string; error?: { message: string } };
      if (data.secure_url) { setProfilePhoto(data.secure_url); toast.success("Photo uploaded"); }
      else { toast.error(data.error?.message ?? "Upload failed"); }
    } catch { toast.error("Upload failed"); }
    finally { setUploadingPhoto(false); }
  }

  function toggleChild(id: string) {
    setSelectedChildren((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        profilePhoto: profilePhoto ?? undefined,
      };
      if (primaryRole === UserRole.PARENT) {
        payload.children = selectedChildren;
      }

      // Handle teacher being assigned parent role
    if (primaryRole === UserRole.TEACHER) {
      if (isAlsoParent) {
        payload.roles = [UserRole.TEACHER, UserRole.PARENT];
        payload.children = selectedChildren;
      } else {
        payload.roles = [UserRole.TEACHER];
      }
    }
   
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("User updated successfully");
        onSuccess();
      } else {
        toast.error(json.error ?? "Failed to update user");
      }
    } catch { toast.error("Network error"); }
    finally { setIsLoading(false); }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const inputClass = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
            <p className="text-xs text-gray-400 mt-0.5">{user.firstName} {user.lastName} · {primaryRole}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#1e3a5f] hover:bg-gray-50 transition-all overflow-hidden group"
            >
              {uploadingPhoto ? (
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              ) : profilePhoto ? (
                <>
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <User className="w-8 h-8 text-gray-300" />
                  <Camera className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <p className="text-xs text-gray-400">{profilePhoto ? "Click to change photo" : "Click to upload photo"}</p>
          </div>

          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email Address</label>
            <input
              value={user.email}
              disabled
              className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`}
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
          </div>

          {/* Student-specific fields */}
          {primaryRole === UserRole.STUDENT && (
            <>
              <div>
                <label className={labelClass}>Assign to Class</label>
                <select name="currentClass" value={form.currentClass} onChange={handleChange} className={inputClass}>
                  <option value="">Select class...</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Guardian Name</label>
                <input name="guardianName" value={form.guardianName} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Guardian Phone</label>
                <input name="guardianPhone" value={form.guardianPhone} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input name="address" value={form.address} onChange={handleChange} className={inputClass} />
              </div>
            </>
          )}

          {/* Teacher-specific fields */}
          {primaryRole === UserRole.TEACHER && (
            <>
              <div>
                <label className={labelClass}>Qualification</label>
                <input name="qualification" value={form.qualification} onChange={handleChange} placeholder="e.g. B.Ed, M.Sc" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Specialization</label>
                <input name="specialization" value={form.specialization} onChange={handleChange} placeholder="e.g. Mathematics, English" className={inputClass} />
              </div>
            </>
          )}

          {/* Show this section only for teachers */}
{primaryRole === UserRole.TEACHER && (
  <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-800">
          Also a Parent?
        </p>
        <p className="text-xs text-gray-400">
          Grant this teacher parent access to view their child&apos;s results
        </p>
      </div>
      <button
        type="button"
        onClick={() => setIsAlsoParent(!isAlsoParent)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          isAlsoParent ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          isAlsoParent ? "translate-x-5" : "translate-x-0.5"
        }`} />
      </button>
    </div>

    {isAlsoParent && (
      <div>
        <label className={labelClass}>
          Link Their Children
        </label>
        <div className="border border-gray-200 rounded-xl max-h-[180px] overflow-y-auto divide-y divide-gray-50">
          {students.length === 0 ? (
            <p className="text-xs text-gray-400 p-3">No students found</p>
          ) : (
            students.map((s) => {
              const isSelected = selectedChildren.includes(s._id);
              return (
                <div
                  key={s._id}
                  onClick={() => toggleChild(s._id)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm text-gray-700">
                    {s.firstName} {s.lastName}
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    )}
  </div>
)}




          {/* Parent-specific fields */}
          {primaryRole === UserRole.PARENT && (
            <>
              <div>
                <label className={labelClass}>Occupation</label>
                <input name="occupation" value={form.occupation} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Relationship to Child</label>
                <select name="relationship" value={form.relationship} onChange={handleChange} className={inputClass}>
                  <option value="">Select...</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Linked Children <span className="text-gray-400 font-normal">(click to toggle)</span>
                </label>
                <div className="border border-gray-200 rounded-xl max-h-[180px] overflow-y-auto divide-y divide-gray-50">
                  {students.length === 0 ? (
                    <p className="text-xs text-gray-400 p-3">No students found</p>
                  ) : (
                    students.map((s) => {
                      const isSelected = selectedChildren.includes(s._id);
                      return (
                        <div
                          key={s._id}
                          onClick={() => toggleChild(s._id)}
                          className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                            isSelected ? "bg-[#1e3a5f]/5" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-sm text-gray-700">{s.firstName} {s.lastName}</span>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? "bg-[#1e3a5f] border-[#1e3a5f]" : "border-gray-300"
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{selectedChildren.length} child{selectedChildren.length !== 1 ? "ren" : ""} selected</p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || uploadingPhoto}
              className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
              ) : (
                <><Save className="w-4 h-4" />Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}