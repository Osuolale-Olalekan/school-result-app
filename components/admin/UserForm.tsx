"use client";

import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { UserRole } from "@/types/enums";
import { useState } from "react";
import { Department } from "@/types/enums";

const baseSchema = z.object({
  surname: z.string().min(2, "Required"),
  firstName: z.string().min(2, "Required"),
  otherName: z.string().optional(),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
});

const studentSchema = baseSchema.extend({
  role: z.literal(UserRole.STUDENT),
  admissionNumber: z.string().optional(), // can be auto-generated if not provided
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(
      (val) => {
        const date = new Date(val);
        const today = new Date();

        // Must be a valid date
        if (isNaN(date.getTime())) return false;

        // No dates before 1900
        if (date.getFullYear() < 1900) return false;

        // No future dates
        if (date > today) return false;

        // Must be at least 5 years old
        const minAgeDate = new Date(
          today.getFullYear() - 5,
          today.getMonth(),
          today.getDate(),
        );
        if (date > minAgeDate) return false;

        return true;
      },
      {
        message: "Student must be at least 5 years old and date must be valid",
      },
    ),
  gender: z.enum(["male", "female"]),
  currentClass: z.string().min(1, "Class is required"),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
});

const teacherSchema = baseSchema.extend({
  role: z.literal(UserRole.TEACHER),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
});

const parentSchema = baseSchema.extend({
  role: z.literal(UserRole.PARENT),
  occupation: z.string().optional(),
  relationship: z.string().optional(),
});

type FormData = z.infer<typeof baseSchema> & {
  admissionNumber?: string;
  Department?: Department;
  dateOfBirth?: string;
  gender?: "male" | "female";
  currentClass?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  qualification?: string;
  specialization?: string;
  occupation?: string;
  relationship?: string;
  children?: [];
};

const getSchema = (role: UserRole) => {
  if (role === UserRole.STUDENT) return studentSchema;
  if (role === UserRole.TEACHER) return teacherSchema;
  return parentSchema;
};

interface UserFormProps {
  selectedRole: UserRole;
  classes: Array<{ _id: string; name: string }>;
  students: Array<{
    _id: string;
    surname: string;
    firstName: string;
    otherName: string;
  }>;
  isLoading: boolean;
  uploadingPhoto: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

export default function UserForm({
  selectedRole,
  classes,
  students,
  isLoading,
  uploadingPhoto,
  onClose,
  onSubmit,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getSchema(selectedRole)) as Resolver<FormData>,
    defaultValues: { role: selectedRole },
  });

  const typedErrors = errors as Record<string, { message?: string }>;

  const [manualAdmission, setManualAdmission] = useState(false);
  const [selectedClassName, setSelectedClassName] = useState(""); // ← add this
  const [department, setDepartment] = useState<Department>(Department.NONE); // ← add this

  const isSSS = selectedClassName.startsWith("SSS");

  return (
    <form
      onSubmit={handleSubmit((data) => {
        // Validate department for SSS students
        if (isSSS && department === Department.NONE) {
          return; // don't submit — error message already shown above
        }
        onSubmit({ ...(data as Record<string, unknown>), department });
      })}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Surname *
          </label>
          <input
            {...register("surname")}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
          />
          {typedErrors.surname && (
            <p className="text-red-500 text-xs mt-1">
              {typedErrors.surname.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            {...register("firstName")}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
          />
          {typedErrors.firstName && (
            <p className="text-red-500 text-xs mt-1">
              {typedErrors.firstName.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Other Name
          </label>
          <input
            {...register("otherName")}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
          />
          {typedErrors.otherName && (
            <p className="text-red-500 text-xs mt-1">
              {typedErrors.otherName.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          {...register("email")}
          type="email"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
        />
        {typedErrors.email && (
          <p className="text-red-500 text-xs mt-1">
            {typedErrors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          {...register("phone")}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
        />
      </div>

      {/* Student-specific fields */}
      {selectedRole === UserRole.STUDENT && (
        <>
          {/* Admission Number — add this block first */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Admission Number
              </label>
              <button
                type="button"
                onClick={() => setManualAdmission(!manualAdmission)}
                className="text-xs text-blue-600 hover:underline"
              >
                {manualAdmission
                  ? "Auto-generate instead"
                  : "Enter manually instead"}
              </button>
            </div>
            {manualAdmission ? (
              <>
                <input
                  {...register("admissionNumber")}
                  placeholder="e.g. GWS/22/0234"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f] uppercase"
                  onChange={(e) =>
                    (e.target.value = e.target.value.toUpperCase())
                  }
                />
                <p className="text-xs text-gray-400 mt-1">
                  Must be unique — enter the student&apos;s existing admission
                  number
                </p>
              </>
            ) : (
              <input
                value="Will be auto-generated"
                disabled
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Class *
            </label>
            <select
              {...register("currentClass")}
              onChange={(e) => {
                register("currentClass").onChange(e); // keep react-hook-form working
                const selected = classes.find((c) => c._id === e.target.value);
                setSelectedClassName(selected?.name ?? "");
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Select class...</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>

            {/* Department — required for SSS classes */}
            {isSSS && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
                >
                  <option value={Department.NONE}>Select department...</option>
                  <option value={Department.SCIENCE}>Science</option>
                  <option value={Department.ART}>Art</option>
                  <option value={Department.COMMERCIAL}>Commercial</option>
                </select>
                {isSSS && department === Department.NONE && (
                  <p className="text-red-500 text-xs mt-1">
                    Department is required for SSS students
                  </p>
                )}
              </div>
            )}

            {typedErrors.currentClass && (
              <p className="text-red-500 text-xs mt-1">
                {typedErrors.currentClass.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                {...register("dateOfBirth")}
                type="date"
                min="1900-01-01"
                max={
                  new Date(new Date().setFullYear(new Date().getFullYear() - 5))
                    .toISOString()
                    .split("T")[0]
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none ${
                  typedErrors.dateOfBirth
                    ? "border-red-400 focus:border-red-400"
                    : "border-gray-200 focus:border-[#1e3a5f]"
                }`}
              />
              {typedErrors.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">
                  {typedErrors.dateOfBirth.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                {...register("gender")}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {typedErrors.gender && (
                <p className="text-red-500 text-xs mt-1">
                  {typedErrors.gender.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guardian Name
            </label>
            <input
              {...register("guardianName")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guardian Phone
            </label>
            <input
              {...register("guardianPhone")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              {...register("address")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
            />
          </div>
        </>
      )}

      {/* Teacher-specific fields */}
      {selectedRole === UserRole.TEACHER && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qualification
            </label>
            <input
              {...register("qualification")}
              placeholder="e.g. B.Ed, M.Sc"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization
            </label>
            <input
              {...register("specialization")}
              placeholder="e.g. Mathematics, English"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
            />
          </div>
        </>
      )}

      {/* Parent-specific fields */}
      {selectedRole === UserRole.PARENT && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Occupation
            </label>
            <input
              {...register("occupation")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship to Child
            </label>
            <select
              {...register("relationship")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Select...</option>
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Children{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              multiple
              {...register("children")}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1e3a5f] min-h-[120px]"
            >
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.surname} {s.firstName} {s.otherName}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple children
            </p>
          </div>
        </>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-xs text-blue-700">
          A temporary password will be auto-generated and sent to the
          user&apos;s email. They must change it on first login.
        </p>
      </div>

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
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create User"
          )}
        </button>
      </div>
    </form>
  );
}
