"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, Camera, User } from "lucide-react";
import { UserRole } from "@/types/enums";
import { toast } from "sonner";
import UserForm from "./UserForm";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ onClose, onSuccess }: Props) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<Array<{ _id: string; name: string }>>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<Array<{ _id: string; surname: string; firstName: string; otherName: string }>>([]);

useEffect(() => {
  fetch("/api/admin/classes")
    .then((r) => r.json())
    .then((j: { success: boolean; data?: Array<{ _id: string; name: string }> }) => {
      if (j.success && j.data) setClasses(j.data);
    });

  fetch("/api/admin/users?role=student&limit=100")
    .then((r) => r.json())
    .then((j: { success: boolean; data?: Array<{ _id: string; surname: string; firstName: string; otherName:string }> }) => {
      if (j.success && j.data) setStudents(j.data);
    });
}, []);





  useEffect(() => {
    fetch("/api/admin/classes")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Array<{ _id: string; name: string }> }) => {
        if (j.success && j.data) setClasses(j.data);
      });
  }, []);

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

  async function handleSubmit(data: Record<string, unknown>) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: selectedRole, profilePhoto: profilePhoto ?? undefined }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        toast.success("User created successfully! Login credentials have been sent to their email.");
        onSuccess();
      } else {
        toast.error(json.error ?? "Failed to create user");
      }
    } catch { toast.error("Network error"); }
    finally { setIsLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Create New User</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Profile Photo Upload */}
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
            <p className="text-xs text-gray-400">{profilePhoto ? "Click to change photo" : "Click to upload photo (optional)"}</p>
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
            <div className="grid grid-cols-3 gap-2">
              {[UserRole.STUDENT, UserRole.TEACHER, UserRole.PARENT].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                    selectedRole === role ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Form — key forces full remount when role changes */}
          <UserForm
            key={selectedRole}
            selectedRole={selectedRole}
            classes={classes}
            students={students}
            isLoading={isLoading}
            uploadingPhoto={uploadingPhoto}
            onClose={onClose}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}