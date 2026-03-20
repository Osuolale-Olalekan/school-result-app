"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, Camera, User, Copy, CheckCircle, KeyRound } from "lucide-react";
import { UserRole } from "@/types/enums";
import { toast } from "sonner";
import UserForm from "./UserForm";

interface Props {
  onClose:   () => void;
  onSuccess: () => void;
}

// ─── Credentials Modal ────────────────────────────────────────────────────────

interface CredentialsModalProps {
  admissionNumber: string;
  password:        string;
  studentName:     string;
  onClose:         () => void;
}

function CredentialsModal({ admissionNumber, password, studentName, onClose }: CredentialsModalProps) {
  const [copiedAdm, setCopiedAdm] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);

  function copyText(text: string, type: "adm" | "pwd") {
    void navigator.clipboard.writeText(text);
    if (type === "adm") { setCopiedAdm(true); setTimeout(() => setCopiedAdm(false), 2000); }
    else                { setCopiedPwd(true); setTimeout(() => setCopiedPwd(false), 2000); }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        <div className="bg-amber-50 border-b border-amber-100 px-5 py-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Account Created</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Share these credentials with <span className="font-semibold">{studentName}</span>
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-700 font-medium">
              ⚠️ Save this password now — it will not be shown again.
            </p>
          </div>

          {/* Admission Number */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Admission Number</p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
              <span className="flex-1 text-sm font-mono font-semibold text-gray-900">{admissionNumber}</span>
              <button onClick={() => copyText(admissionNumber, "adm")} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 flex-shrink-0">
                {copiedAdm ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Temporary Password</p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
              <span className="flex-1 text-sm font-mono font-semibold text-gray-900 tracking-wider">{password}</span>
              <button onClick={() => copyText(password, "pwd")} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 flex-shrink-0">
                {copiedPwd ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            The student can change this password after logging in.
          </p>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function CreateUserModal({ onClose, onSuccess }: Props) {
  const [selectedRole,   setSelectedRole]   = useState<UserRole>(UserRole.STUDENT);
  const [isLoading,      setIsLoading]      = useState(false);
  const [classes,        setClasses]        = useState<Array<{ _id: string; name: string }>>([]);
  const [profilePhoto,   setProfilePhoto]   = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<Array<{ _id: string; surname: string; firstName: string; otherName: string }>>([]);
  const [credentials, setCredentials] = useState<{
    admissionNumber: string;
    password:        string;
    studentName:     string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/classes")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Array<{ _id: string; name: string }> }) => {
        if (j.success && j.data) setClasses(j.data);
      });

    fetch("/api/admin/users?role=student&limit=100")
      .then((r) => r.json())
      .then((j: { success: boolean; data?: Array<{ _id: string; surname: string; firstName: string; otherName: string }> }) => {
        if (j.success && j.data) setStudents(j.data);
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
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json() as { secure_url?: string; error?: { message: string } };
      if (data.secure_url) { setProfilePhoto(data.secure_url); toast.success("Photo uploaded"); }
      else toast.error(data.error?.message ?? "Upload failed");
    } catch { toast.error("Upload failed"); }
    finally { setUploadingPhoto(false); }
  }

  async function handleSubmit(data: Record<string, unknown>) {
    setIsLoading(true);
    try {
      const res  = await fetch("/api/admin/users", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...data, role: selectedRole, profilePhoto: profilePhoto ?? undefined }),
      });
      const json = await res.json() as {
        success: boolean;
        error?:  string;
        data?:   {
          hasEmail?:        boolean;
          tempPassword?:    string;
          admissionNumber?: string;
          surname?:         string;
          firstName?:       string;
        };
      };

      if (json.success) {
  // Email-less student — show credentials modal, delay onSuccess until Done is clicked
  if (selectedRole === UserRole.STUDENT && json.data?.hasEmail === false && json.data?.tempPassword) {
    toast.success("Student account created successfully!");
    setCredentials({
      admissionNumber: json.data.admissionNumber ?? "",
      password:        json.data.tempPassword,
      studentName:     `${json.data.surname ?? ""} ${json.data.firstName ?? ""}`.trim(),
    });
    // ← do NOT call onSuccess() or onClose() here
  } else {
    toast.success("User created! Login credentials sent to their email.");
    onSuccess(); // ← only call here for users with email
    onClose();
  }
} else {
        toast.error(json.error ?? "Failed to create user");
      }
    } catch { toast.error("Network error"); }
    finally { setIsLoading(false); }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Create New User</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Photo upload */}
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#1e3a5f] hover:bg-gray-50 transition-all overflow-hidden group"
              >
                {uploadingPhoto ? <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                : profilePhoto ? (
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

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
              <div className="grid grid-cols-3 gap-2">
                {[UserRole.STUDENT, UserRole.TEACHER, UserRole.PARENT].map((role) => (
                  <button key={role} type="button" onClick={() => setSelectedRole(role)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                      selectedRole === role ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>

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

      {credentials && (
        <CredentialsModal
          admissionNumber={credentials.admissionNumber}
          password={credentials.password}
          studentName={credentials.studentName}
          onClose={() => { setCredentials(null); onSuccess(); onClose(); }}
        />
      )}
    </>
  );
}
// "use client";

// import { useState, useEffect, useRef } from "react";
// import { X, Loader2, Camera, User } from "lucide-react";
// import { UserRole } from "@/types/enums";
// import { toast } from "sonner";
// import UserForm from "./UserForm";

// interface Props {
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function CreateUserModal({ onClose, onSuccess }: Props) {
//   const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
//   const [isLoading, setIsLoading] = useState(false);
//   const [classes, setClasses] = useState<Array<{ _id: string; name: string }>>([]);
//   const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
//   const [uploadingPhoto, setUploadingPhoto] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [students, setStudents] = useState<Array<{ _id: string; surname: string; firstName: string; otherName: string }>>([]);

// useEffect(() => {
//   fetch("/api/admin/classes")
//     .then((r) => r.json())
//     .then((j: { success: boolean; data?: Array<{ _id: string; name: string }> }) => {
//       if (j.success && j.data) setClasses(j.data);
//     });

//   fetch("/api/admin/users?role=student&limit=100")
//     .then((r) => r.json())
//     .then((j: { success: boolean; data?: Array<{ _id: string; surname: string; firstName: string; otherName:string }> }) => {
//       if (j.success && j.data) setStudents(j.data);
//     });
// }, []);

//   useEffect(() => {
//     fetch("/api/admin/classes")
//       .then((r) => r.json())
//       .then((j: { success: boolean; data?: Array<{ _id: string; name: string }> }) => {
//         if (j.success && j.data) setClasses(j.data);
//       });
//   }, []);

//   async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }

//     setUploadingPhoto(true);
//     try {
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
//       formData.append("folder", "school/profiles");

//       const res = await fetch(
//         `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
//         { method: "POST", body: formData }
//       );
//       const data = await res.json() as { secure_url?: string; error?: { message: string } };
//       if (data.secure_url) { setProfilePhoto(data.secure_url); toast.success("Photo uploaded"); }
//       else { toast.error(data.error?.message ?? "Upload failed"); }
//     } catch { toast.error("Upload failed"); }
//     finally { setUploadingPhoto(false); }
//   }

//   async function handleSubmit(data: Record<string, unknown>) {
//     setIsLoading(true);
//     try {
//       const res = await fetch("/api/admin/users", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ ...data, role: selectedRole, profilePhoto: profilePhoto ?? undefined }),
//       });
//       const json = await res.json() as { success: boolean; error?: string };
//       if (json.success) {
//         toast.success("User created successfully! Login credentials have been sent to their email.");
//         onSuccess();
//       } else {
//         toast.error(json.error ?? "Failed to create user");
//       }
//     } catch { toast.error("Network error"); }
//     finally { setIsLoading(false); }
//   }

//   return (
//     <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
//         <div className="flex items-center justify-between p-6 border-b border-gray-100">
//           <h2 className="text-lg font-bold text-gray-900">Create New User</h2>
//           <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="p-6 space-y-4">
//           {/* Profile Photo Upload */}
//           <div className="flex flex-col items-center gap-3">
//             <div
//               onClick={() => fileInputRef.current?.click()}
//               className="relative w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#1e3a5f] hover:bg-gray-50 transition-all overflow-hidden group"
//             >
//               {uploadingPhoto ? (
//                 <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
//               ) : profilePhoto ? (
//                 <>
//                   <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
//                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
//                     <Camera className="w-5 h-5 text-white" />
//                   </div>
//                 </>
//               ) : (
//                 <div className="flex flex-col items-center gap-1">
//                   <User className="w-8 h-8 text-gray-300" />
//                   <Camera className="w-4 h-4 text-gray-400" />
//                 </div>
//               )}
//             </div>
//             <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
//             <p className="text-xs text-gray-400">{profilePhoto ? "Click to change photo" : "Click to upload photo (optional)"}</p>
//           </div>

//           {/* Role Selector */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
//             <div className="grid grid-cols-3 gap-2">
//               {[UserRole.STUDENT, UserRole.TEACHER, UserRole.PARENT].map((role) => (
//                 <button
//                   key={role}
//                   type="button"
//                   onClick={() => setSelectedRole(role)}
//                   className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
//                     selectedRole === role ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "border-gray-200 text-gray-600 hover:border-gray-300"
//                   }`}
//                 >
//                   {role.charAt(0).toUpperCase() + role.slice(1)}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Form — key forces full remount when role changes */}
//           <UserForm
//             key={selectedRole}
//             selectedRole={selectedRole}
//             classes={classes}
//             students={students}
//             isLoading={isLoading}
//             uploadingPhoto={uploadingPhoto}
//             onClose={onClose}
//             onSubmit={handleSubmit}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }