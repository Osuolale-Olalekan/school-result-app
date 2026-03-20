"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  Edit,
  GraduationCap,
  BookOpen,
  Users,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Copy,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { UserRole, UserStatus } from "@/types/enums";
import type { IUser } from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import CreateUserModal from "@/components/admin/CreateUserModal";
import EditUserModal from "./EditUserModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import CreateAdminModal from "./CreateAdminModal";
import UserProfileModal from "./UserProfileModal";

const ROLE_TABS = [
  { label: "All", value: "" },
  { label: "Students", value: UserRole.STUDENT },
  { label: "Teachers", value: UserRole.TEACHER },
  { label: "Parents", value: UserRole.PARENT },
];

const ROLE_ICONS = {
  [UserRole.ADMIN]: Shield,
  [UserRole.TEACHER]: BookOpen,
  [UserRole.STUDENT]: GraduationCap,
  [UserRole.PARENT]: Users,
};

const ROLE_COLORS = {
  [UserRole.ADMIN]: "bg-amber-100 text-amber-700",
  [UserRole.TEACHER]: "bg-blue-100 text-blue-700",
  [UserRole.STUDENT]: "bg-purple-100 text-purple-700",
  [UserRole.PARENT]: "bg-emerald-100 text-emerald-700",
};

const STATUS_COLORS = {
  [UserStatus.ACTIVE]: "bg-emerald-100 text-emerald-700",
  [UserStatus.INACTIVE]: "bg-gray-100 text-gray-600",
  [UserStatus.SUSPENDED]: "bg-red-100 text-red-700",
};

type ExtendedUser = IUser & {
  studentStatus?: string;
  admissionNumber?: string;
  employeeId?: string;
  role?: UserRole;
};

// ─── Reset Password Modal ─────────────────────────────────────────────────────

interface ResetPasswordModalProps {
  user: ExtendedUser;
  onClose: () => void;
}

function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const primaryRole = user.roles?.[0] ?? user.role;
  const hasEmail = !!user.email;

  async function handleReset() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}/reset-password`, {
        method: "POST",
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: string;
        data?: { hasEmail: boolean; newPassword?: string };
      };
      if (!json.success) throw new Error(json.error ?? "Failed");

      if (json.data?.hasEmail) {
        toast.success("New password sent to user's email");
        onClose();
      } else {
        setNewPassword(json.data?.newPassword ?? "");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reset password",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy() {
    if (!newPassword) return;
    void navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Reset Password
              </h3>
              <p className="text-xs text-gray-400">
                {user.surname} {user.firstName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
          >
            {/* X icon inline */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!newPassword ? (
            <>
              <p className="text-sm text-gray-600">
                {hasEmail
                  ? `A new password will be generated and sent to ${user.email}.`
                  : "A new password will be generated. Since this student has no email, you will need to share it manually."}
              </p>
              {!hasEmail && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-700 font-medium">
                    ⚠️ No email on file — you will need to give the new password
                    to the student directly.
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-red-700 font-medium">
                  ⚠️ Save this password now — it will not be shown again.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">
                  New Password
                </p>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="flex-1 text-sm font-mono font-semibold text-gray-900 tracking-wider">
                    {newPassword}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              {user.admissionNumber && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">
                    Admission Number
                  </p>
                  <div className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-sm font-mono font-semibold text-gray-900">
                      {user.admissionNumber}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847]"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsersManagement() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<ExtendedUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<ExtendedUser | null>(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<ExtendedUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        ...(roleFilter && { role: roleFilter }),
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: ExtendedUser[];
        pagination?: { totalPages: number; total: number };
      };
      if (json.success && json.data) {
        setUsers(json.data);
        setTotalPages(json.pagination?.totalPages ?? 1);
        setTotal(json.pagination?.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search]);

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  async function handleAction(
    userId: string,
    action: "activate" | "deactivate" | "suspend" | "delete",
  ) {
    if (action === "delete") {
      const user = users.find((u) => u._id === userId);
      if (user) {
        setDeleteUser(user);
        setActionMenu(null);
      }
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as { success: boolean };
      if (json.success) {
        toast.success(`User ${action}d successfully`);
        fetchUsers();
      }
    } catch {
      toast.error("An error occurred");
    }
    setActionMenu(null);
  }

  async function handleConfirmDelete() {
    if (!deleteUser) return;
    try {
      const res = await fetch(`/api/admin/users/${deleteUser._id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        toast.success("User deleted successfully");
        setDeleteUser(null);
        fetchUsers();
      } else {
        toast.error(json.error ?? "Failed to delete user");
      }
    } catch {
      toast.error("An error occurred");
    }
  }

  return (
    <div
      className="space-y-4"
      onClick={() => actionMenu && setActionMenu(null)}
    >
      {/* ── Header buttons ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowCreateAdmin(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-xs sm:text-sm font-semibold hover:bg-amber-100 transition-colors"
        >
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden xs:inline">Add Admin</span>
          <span className="xs:hidden">Admin</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowCreate(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#1e3a5f] text-white text-xs sm:text-sm font-semibold hover:bg-[#152847] transition-colors"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden xs:inline">Add New User</span>
          <span className="xs:hidden">Add User</span>
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div className="flex gap-1 p-1 bg-gray-50 rounded-xl border border-gray-200 overflow-x-auto">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setRoleFilter(tab.value);
                  setPage(1);
                }}
                className={`flex-1 min-w-[60px] px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  roleFilter === tab.value
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table / Cards ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  ID / Admission
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  Joined
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const primaryRole = user.roles?.[0] ?? user.role;
                  const RoleIcon = ROLE_ICONS[primaryRole] ?? Shield;
                  return (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center text-xs font-bold text-[#1e3a5f] flex-shrink-0">
                            {user.profilePhoto ? (
                              <img
                                src={user.profilePhoto}
                                alt=""
                                className="w-full h-full rounded-lg object-cover"
                              />
                            ) : (
                              getInitials(
                                user.surname,
                                user.firstName,
                                user.otherName,
                              )
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {user.surname} {user.firstName} {user.otherName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {user.email ?? (
                                <span className="italic text-gray-300">
                                  No email
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[primaryRole] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {primaryRole}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-gray-500 font-mono">
                          {user.admissionNumber ?? user.employeeId ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[user.status] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right relative">
                        <ActionMenuButton
                          userId={user._id}
                          user={user}
                          actionMenu={actionMenu}
                          setActionMenu={setActionMenu}
                          handleAction={handleAction}
                          setViewingUserId={setViewingUserId}
                          setEditUser={setEditUser}
                          setResetUser={setResetUser}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            users.map((user) => {
              const primaryRole = user.roles?.[0] ?? user.role;
              const RoleIcon = ROLE_ICONS[primaryRole] ?? Shield;
              return (
                <div key={user._id} className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center text-xs font-bold text-[#1e3a5f] shrink-0">
                    {user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt=""
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      getInitials(user.surname, user.firstName, user.otherName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.surname} {user.firstName} {user.otherName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email ?? (
                        <span className="italic text-gray-300">No email</span>
                      )}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[primaryRole] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        <RoleIcon className="w-2.5 h-2.5" />
                        {primaryRole}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[user.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {user.status}
                      </span>
                      {(user.admissionNumber ?? user.employeeId) && (
                        <span className="text-xs text-gray-400 font-mono">
                          {user.admissionNumber ?? user.employeeId}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <ActionMenuButton
                      userId={user._id}
                      user={user}
                      actionMenu={actionMenu}
                      setActionMenu={setActionMenu}
                      handleAction={handleAction}
                      setViewingUserId={setViewingUserId}
                      setEditUser={setEditUser}
                      setResetUser={setResetUser}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-5 py-3 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            fetchUsers();
          }}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => {
            setEditUser(null);
            fetchUsers();
          }}
        />
      )}
      {deleteUser && (
        <DeleteConfirmModal
          userName={`${deleteUser.surname} ${deleteUser.firstName}`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteUser(null)}
        />
      )}
      {showCreateAdmin && (
        <CreateAdminModal
          onClose={() => setShowCreateAdmin(false)}
          onSuccess={() => {
            setShowCreateAdmin(false);
            fetchUsers();
          }}
        />
      )}
      {viewingUserId && (
        <UserProfileModal
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
          onEdit={() => {
            const u = users.find((u) => u._id === viewingUserId);
            if (u) {
              setEditUser(u);
              setViewingUserId(null);
            }
          }}
        />
      )}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
        />
      )}
    </div>
  );
}

// ─── Action Menu Button ───────────────────────────────────────────────────────

interface ActionMenuButtonProps {
  userId: string;
  user: ExtendedUser;
  actionMenu: string | null;
  setActionMenu: (id: string | null) => void;
  handleAction: (
    userId: string,
    action: "activate" | "deactivate" | "suspend" | "delete",
  ) => void;
  setViewingUserId: (id: string | null) => void;
  setEditUser: (user: ExtendedUser | null) => void;
  setResetUser: (user: ExtendedUser | null) => void;
}

function ActionMenuButton({
  userId,
  user,
  actionMenu,
  setActionMenu,
  handleAction,
  setViewingUserId,
  setEditUser,
  setResetUser,
}: ActionMenuButtonProps) {
  const isOpen = actionMenu === userId;

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActionMenu(isOpen ? null : userId);
        }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Desktop dropdown */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="hidden sm:block absolute right-8 top-0 z-30 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[170px]"
        >
          {user.status !== UserStatus.ACTIVE && (
            <button
              onClick={() => handleAction(userId, "activate")}
              className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" /> Activate
            </button>
          )}
          {user.status === UserStatus.ACTIVE && (
            <button
              onClick={() => handleAction(userId, "deactivate")}
              className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <UserX className="w-4 h-4" /> Deactivate
            </button>
          )}
          <button
            onClick={() => {
              setViewingUserId(userId);
              setActionMenu(null);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> View Profile
          </button>
          <button
            onClick={() => {
              setEditUser(user);
              setActionMenu(null);
            }}
            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
          {/* Reset Password — available for all users */}
          <button
            onClick={() => {
              setResetUser(user);
              setActionMenu(null);
            }}
            className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4" /> Reset Password
          </button>
          <button
            onClick={() => handleAction(userId, "suspend")}
            className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" /> Suspend
          </button>
          <hr className="my-1 border-gray-50" />
          <button
            onClick={() => handleAction(userId, "delete")}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {isOpen && (
        <div className="sm:hidden" onClick={(e) => e.stopPropagation()}>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setActionMenu(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl pb-safe">
            <div className="flex items-center gap-3 px-4 pt-3 pb-2 border-b border-gray-50">
              <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
              <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center text-xs font-bold text-[#1e3a5f] mt-2">
                {user.surname.charAt(0)}
                {user.firstName.charAt(0)}
              </div>
              <div className="mt-2">
                <p className="text-sm font-semibold text-gray-800">
                  {user.surname} {user.firstName}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {user.roles?.[0]}
                </p>
              </div>
            </div>

            {/* Actions grid — 5 items now */}
            <div className="grid grid-cols-4 gap-1 p-3 border-b border-gray-50">
              <button
                onClick={() => {
                  setViewingUserId(userId);
                  setActionMenu(null);
                }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-gray-50"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-xs text-gray-500">View</span>
              </button>
              <button
                onClick={() => {
                  setEditUser(user);
                  setActionMenu(null);
                }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-blue-50"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Edit className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs text-blue-600">Edit</span>
              </button>
              {/* Reset Password */}
              <button
                onClick={() => {
                  setResetUser(user);
                  setActionMenu(null);
                }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-amber-50"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xs text-amber-600">Reset</span>
              </button>
              {user.status !== UserStatus.ACTIVE ? (
                <button
                  onClick={() => handleAction(userId, "activate")}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-emerald-50"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xs text-emerald-600">Activate</span>
                </button>
              ) : (
                <button
                  onClick={() => handleAction(userId, "suspend")}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-amber-50"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-xs text-amber-500">Suspend</span>
                </button>
              )}
            </div>

            {/* Delete + Cancel */}
            <div className="p-3 space-y-2">
              <button
                onClick={() => handleAction(userId, "delete")}
                className="w-full py-2.5 rounded-xl bg-red-50 text-sm font-medium text-red-600 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete User
              </button>
              <button
                onClick={() => setActionMenu(null)}
                className="w-full py-2.5 rounded-xl bg-gray-100 text-sm font-medium text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// "use client";

// import { useEffect, useState, useCallback } from "react";
// import {
//   Search,
//   Plus,
//   Filter,
//   MoreVertical,
//   UserCheck,
//   UserX,
//   Trash2,
//   Eye,
//   Edit,
//   GraduationCap,
//   BookOpen,
//   Users,
//   Shield,
//   AlertTriangle,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";
// import { UserRole, UserStatus } from "@/types/enums";
// import type { IUser } from "@/types";
// import { formatDate, getInitials } from "@/lib/utils";
// import { toast } from "sonner";
// import CreateUserModal from "@/components/admin/CreateUserModal";
// import EditUserModal from "./EditUserModal";
// import DeleteConfirmModal from "./DeleteConfirmModal";
// import CreateAdminModal from "./CreateAdminModal";
// import UserProfileModal from "./UserProfileModal";

// const ROLE_TABS = [
//   { label: "All", value: "" },
//   { label: "Students", value: UserRole.STUDENT },
//   { label: "Teachers", value: UserRole.TEACHER },
//   { label: "Parents", value: UserRole.PARENT },
// ];

// const ROLE_ICONS = {
//   [UserRole.ADMIN]: Shield,
//   [UserRole.TEACHER]: BookOpen,
//   [UserRole.STUDENT]: GraduationCap,
//   [UserRole.PARENT]: Users,
// };

// const ROLE_COLORS = {
//   [UserRole.ADMIN]: "bg-amber-100 text-amber-700",
//   [UserRole.TEACHER]: "bg-blue-100 text-blue-700",
//   [UserRole.STUDENT]: "bg-purple-100 text-purple-700",
//   [UserRole.PARENT]: "bg-emerald-100 text-emerald-700",
// };

// const STATUS_COLORS = {
//   [UserStatus.ACTIVE]: "bg-emerald-100 text-emerald-700",
//   [UserStatus.INACTIVE]: "bg-gray-100 text-gray-600",
//   [UserStatus.SUSPENDED]: "bg-red-100 text-red-700",
// };

// type ExtendedUser = IUser & {
//   studentStatus?: string;
//   admissionNumber?: string;
//   employeeId?: string;
//   role?: UserRole;
// };

// export default function UsersManagement() {
//   const [users, setUsers] = useState<ExtendedUser[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [roleFilter, setRoleFilter] = useState("");
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [total, setTotal] = useState(0);
//   const [showCreate, setShowCreate] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
//   const [actionMenu, setActionMenu] = useState<string | null>(null);
//   const [editUser, setEditUser] = useState<ExtendedUser | null>(null);
//   const [deleteUser, setDeleteUser] = useState<ExtendedUser | null>(null);
//   const [showCreateAdmin, setShowCreateAdmin] = useState(false);
//   const [viewingUserId, setViewingUserId] = useState<string | null>(null);

//   const fetchUsers = useCallback(async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         page: page.toString(),
//         limit: "15",
//         ...(roleFilter && { role: roleFilter }),
//         ...(search && { search }),
//       });
//       const res = await fetch(`/api/admin/users?${params}`);
//       const json = (await res.json()) as {
//         success: boolean;
//         data?: ExtendedUser[];
//         pagination?: { totalPages: number; total: number };
//       };
//       if (json.success && json.data) {
//         setUsers(json.data);
//         setTotalPages(json.pagination?.totalPages ?? 1);
//         setTotal(json.pagination?.total ?? 0);
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [page, roleFilter, search]);

//   useEffect(() => {
//     const debounce = setTimeout(fetchUsers, 300);
//     return () => clearTimeout(debounce);
//   }, [fetchUsers]);

//   async function handleAction(
//     userId: string,
//     action: "activate" | "deactivate" | "suspend" | "delete",
//   ) {
//     if (action === "delete") {
//       const user = users.find((u) => u._id === userId);
//       if (user) {
//         setDeleteUser(user);
//         setActionMenu(null);
//       }
//       return;
//     }

//     try {
//       const res = await fetch(`/api/admin/users/${userId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ action }),
//       });
//       const json = (await res.json()) as { success: boolean; message?: string };
//       if (json.success) {
//         toast.success(`User ${action}d successfully`);
//         fetchUsers();
//       }
//     } catch {
//       toast.error("An error occurred");
//     }
//     setActionMenu(null);
//   }

//   async function handleConfirmDelete() {
//     if (!deleteUser) return;
//     try {
//       const res = await fetch(`/api/admin/users/${deleteUser._id}`, {
//         method: "DELETE",
//       });
//       const json = (await res.json()) as { success: boolean; error?: string };
//       if (json.success) {
//         toast.success("User deleted successfully");
//         setDeleteUser(null);
//         fetchUsers();
//       } else {
//         toast.error(json.error ?? "Failed to delete user");
//       }
//     } catch {
//       toast.error("An error occurred");
//     }
//   }

//   return (
//     <div className="space-y-4" onClick={() => actionMenu && setActionMenu(null)}>

//       {/* ── Header buttons ── */}
//       <div className="flex items-center gap-2">
//         <button
//           onClick={(e) => { e.stopPropagation(); setShowCreateAdmin(true); }}
//           className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-xs sm:text-sm font-semibold hover:bg-amber-100 transition-colors"
//         >
//           <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
//           <span className="hidden xs:inline">Add Admin</span>
//           <span className="xs:hidden">Admin</span>
//         </button>
//         <button
//           onClick={(e) => { e.stopPropagation(); setShowCreate(true); }}
//           className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#1e3a5f] text-white text-xs sm:text-sm font-semibold hover:bg-[#152847] transition-colors"
//         >
//           <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
//           <span className="hidden xs:inline">Add New User</span>
//           <span className="xs:hidden">Add User</span>
//         </button>
//       </div>

//       {/* ── Filters ── */}
//       <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
//         <div className="flex flex-col gap-3">
//           {/* Search */}
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search by name or email..."
//               value={search}
//               onChange={(e) => { setSearch(e.target.value); setPage(1); }}
//               className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
//             />
//           </div>

//           {/* Role tabs — scrollable on tiny screens */}
//           <div className="flex gap-1 p-1 bg-gray-50 rounded-xl border border-gray-200 overflow-x-auto">
//             {ROLE_TABS.map((tab) => (
//               <button
//                 key={tab.value}
//                 onClick={() => { setRoleFilter(tab.value); setPage(1); }}
//                 className={`flex-1 min-w-[60px] px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
//                   roleFilter === tab.value
//                     ? "bg-white shadow-sm text-gray-900"
//                     : "text-gray-500 hover:text-gray-700"
//                 }`}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ── Table (desktop) / Cards (mobile) ── */}
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

//         {/* Desktop table — hidden below sm */}
//         <div className="hidden sm:block overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="border-b border-gray-50 bg-gray-50/50">
//                 <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
//                 <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
//                 <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">ID / Admission</th>
//                 <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
//                 <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
//                 <th className="px-4 py-3" />
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-50">
//               {loading ? (
//                 Array.from({ length: 6 }).map((_, i) => (
//                   <tr key={i}>
//                     {Array.from({ length: 6 }).map((__, j) => (
//                       <td key={j} className="px-5 py-3.5">
//                         <div className="h-4 bg-gray-100 rounded animate-pulse" />
//                       </td>
//                     ))}
//                   </tr>
//                 ))
//               ) : users.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="text-center py-12 text-gray-400">
//                     <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
//                     <p>No users found</p>
//                   </td>
//                 </tr>
//               ) : (
//                 users.map((user) => {
//                   const primaryRole = user.roles?.[0] ?? user.role;
//                   const RoleIcon = ROLE_ICONS[primaryRole] ?? Shield;
//                   return (
//                     <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
//                       <td className="px-5 py-3.5">
//                         <div className="flex items-center gap-3">
//                           <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center text-xs font-bold text-[#1e3a5f] flex-shrink-0">
//                             {user.profilePhoto ? (
//                               <img src={user.profilePhoto} alt="" className="w-full h-full rounded-lg object-cover" />
//                             ) : (
//                               getInitials(user.surname, user.firstName, user.otherName)
//                             )}
//                           </div>
//                           <div className="min-w-0">
//                             <p className="font-medium text-gray-900 truncate">
//                               {user.surname} {user.firstName} {user.otherName}
//                             </p>
//                             <p className="text-xs text-gray-400 truncate">{user.email}</p>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-4 py-3.5">
//                         <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[primaryRole] ?? "bg-gray-100 text-gray-600"}`}>
//                           <RoleIcon className="w-3 h-3" />
//                           {primaryRole}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3.5 hidden md:table-cell">
//                         <span className="text-xs text-gray-500 font-mono">
//                           {user.admissionNumber ?? user.employeeId ?? "—"}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3.5">
//                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[user.status] ?? "bg-gray-100 text-gray-600"}`}>
//                           {user.status}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-400">
//                         {formatDate(user.createdAt)}
//                       </td>
//                       <td className="px-4 py-3.5 text-right relative">
//                         <ActionMenuButton
//                           userId={user._id}
//                           user={user}
//                           actionMenu={actionMenu}
//                           setActionMenu={setActionMenu}
//                           handleAction={handleAction}
//                           setViewingUserId={setViewingUserId}
//                           setEditUser={setEditUser}
//                         />
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Mobile card list — shown below sm */}
//         <div className="sm:hidden divide-y divide-gray-50">
//           {loading ? (
//             Array.from({ length: 5 }).map((_, i) => (
//               <div key={i} className="p-4 space-y-2 animate-pulse">
//                 <div className="flex items-center gap-3">
//                   <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
//                   <div className="flex-1 space-y-1.5">
//                     <div className="h-3.5 bg-gray-100 rounded w-3/4" />
//                     <div className="h-3 bg-gray-100 rounded w-1/2" />
//                   </div>
//                 </div>
//               </div>
//             ))
//           ) : users.length === 0 ? (
//             <div className="text-center py-12 text-gray-400">
//               <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
//               <p className="text-sm">No users found</p>
//             </div>
//           ) : (
//             users.map((user) => {
//               const primaryRole = user.roles?.[0] ?? user.role;
//               const RoleIcon = ROLE_ICONS[primaryRole] ?? Shield;
//               return (
//                 <div key={user._id} className="p-3 flex items-center gap-3">
//                   {/* Avatar */}
//                   <div className="w-9 h-9 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center text-xs font-bold text-[#1e3a5f] shrink-0">
//                     {user.profilePhoto ? (
//                       <img src={user.profilePhoto} alt="" className="w-full h-full rounded-lg object-cover" />
//                     ) : (
//                       getInitials(user.surname, user.firstName, user.otherName)
//                     )}
//                   </div>

//                   {/* Info */}
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-medium text-gray-900 truncate">
//                       {user.surname} {user.firstName} {user.otherName}
//                     </p>
//                     <p className="text-xs text-gray-400 truncate">{user.email}</p>
//                     <div className="flex items-center gap-1.5 mt-1 flex-wrap">
//                       <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[primaryRole] ?? "bg-gray-100 text-gray-600"}`}>
//                         <RoleIcon className="w-2.5 h-2.5" />
//                         {primaryRole}
//                       </span>
//                       <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[user.status] ?? "bg-gray-100 text-gray-600"}`}>
//                         {user.status}
//                       </span>
//                       {(user.admissionNumber ?? user.employeeId) && (
//                         <span className="text-xs text-gray-400 font-mono">
//                           {user.admissionNumber ?? user.employeeId}
//                         </span>
//                       )}
//                     </div>
//                   </div>

//                   {/* Action menu */}
//                   <div className="relative shrink-0">
//                     <ActionMenuButton
//                       userId={user._id}
//                       user={user}
//                       actionMenu={actionMenu}
//                       setActionMenu={setActionMenu}
//                       handleAction={handleAction}
//                       setViewingUserId={setViewingUserId}
//                       setEditUser={setEditUser}
//                     />
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="px-4 sm:px-5 py-3 border-t border-gray-50 flex items-center justify-between">
//             <p className="text-xs text-gray-500">
//               Page {page} of {totalPages}
//             </p>
//             <div className="flex gap-1">
//               <button
//                 onClick={() => setPage(Math.max(1, page - 1))}
//                 disabled={page === 1}
//                 className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
//               >
//                 <ChevronLeft className="w-4 h-4" />
//               </button>
//               <button
//                 onClick={() => setPage(Math.min(totalPages, page + 1))}
//                 disabled={page === totalPages}
//                 className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
//               >
//                 <ChevronRight className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* ── Modals ── */}
//       {showCreate && (
//         <CreateUserModal
//           onClose={() => setShowCreate(false)}
//           onSuccess={() => { setShowCreate(false); fetchUsers(); }}
//         />
//       )}

//       {editUser && (
//         <EditUserModal
//           user={editUser}
//           onClose={() => setEditUser(null)}
//           onSuccess={() => { setEditUser(null); fetchUsers(); }}
//         />
//       )}

//       {deleteUser && (
//         <DeleteConfirmModal
//           userName={`${deleteUser.surname} ${deleteUser.firstName} ${deleteUser.otherName}`}
//           onConfirm={handleConfirmDelete}
//           onCancel={() => setDeleteUser(null)}
//         />
//       )}

//       {showCreateAdmin && (
//         <CreateAdminModal
//           onClose={() => setShowCreateAdmin(false)}
//           onSuccess={() => { setShowCreateAdmin(false); fetchUsers(); }}
//         />
//       )}

//       {viewingUserId && (
//         <UserProfileModal
//           userId={viewingUserId}
//           onClose={() => setViewingUserId(null)}
//           onEdit={() => {
//             const user = users.find((u) => u._id === viewingUserId);
//             if (user) { setEditUser(user); setViewingUserId(null); }
//           }}
//         />
//       )}
//     </div>
//   );
// }

// // ── Extracted action menu button — shared between table and card views ────────

// interface ActionMenuButtonProps {
//   userId: string;
//   user: ExtendedUser;
//   actionMenu: string | null;
//   setActionMenu: (id: string | null) => void;
//   handleAction: (userId: string, action: "activate" | "deactivate" | "suspend" | "delete") => void;
//   setViewingUserId: (id: string | null) => void;
//   setEditUser: (user: ExtendedUser | null) => void;
// }

// function ActionMenuButton({
//   userId,
//   user,
//   actionMenu,
//   setActionMenu,
//   handleAction,
//   setViewingUserId,
//   setEditUser,
// }: ActionMenuButtonProps) {
//   const isOpen = actionMenu === userId;

//   return (
//     <>
//       <button
//         onClick={(e) => { e.stopPropagation(); setActionMenu(isOpen ? null : userId); }}
//         className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
//       >
//         <MoreVertical className="w-4 h-4" />
//       </button>

//       {/* Desktop dropdown */}
//       {isOpen && (
//         <div
//           onClick={(e) => e.stopPropagation()}
//           className="hidden sm:block absolute right-8 top-0 z-30 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[160px]"
//         >
//           {user.status !== UserStatus.ACTIVE && (
//             <button
//               onClick={() => handleAction(userId, "activate")}
//               className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
//             >
//               <UserCheck className="w-4 h-4" /> Activate
//             </button>
//           )}
//           {user.status === UserStatus.ACTIVE && (
//             <button
//               onClick={() => handleAction(userId, "deactivate")}
//               className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
//             >
//               <UserX className="w-4 h-4" /> Deactivate
//             </button>
//           )}
//           <button
//             onClick={() => { setViewingUserId(userId); setActionMenu(null); }}
//             className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
//           >
//             <Eye className="w-4 h-4" /> View Profile
//           </button>
//           <button
//             onClick={() => { setEditUser(user); setActionMenu(null); }}
//             className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
//           >
//             <Edit className="w-4 h-4" /> Edit
//           </button>
//           <button
//             onClick={() => handleAction(userId, "suspend")}
//             className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
//           >
//             <AlertTriangle className="w-4 h-4" /> Suspend
//           </button>
//           <hr className="my-1 border-gray-50" />
//           <button
//             onClick={() => handleAction(userId, "delete")}
//             className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
//           >
//             <Trash2 className="w-4 h-4" /> Delete
//           </button>
//         </div>
//       )}

//       {/* Mobile bottom sheet */}
//       {isOpen && (
//         <div className="sm:hidden" onClick={(e) => e.stopPropagation()}>
//           <div
//             className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
//             onClick={() => setActionMenu(null)}
//           />
//           <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl pb-safe">
//             {/* Handle + user name */}
//             <div className="flex items-center gap-3 px-4 pt-3 pb-2 border-b border-gray-50">
//               <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
//               <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center text-xs font-bold text-[#1e3a5f] mt-2">
//                 {user.surname.charAt(0)}{user.firstName.charAt(0)}
//               </div>
//               <div className="mt-2">
//                 <p className="text-sm font-semibold text-gray-800">{user.surname} {user.firstName}</p>
//                 <p className="text-xs text-gray-400 capitalize">{user.roles?.[0]}</p>
//               </div>
//             </div>

//             {/* Actions grid */}
//             <div className="grid grid-cols-4 gap-1 p-3 border-b border-gray-50">
//               <button
//                 onClick={() => { setViewingUserId(userId); setActionMenu(null); }}
//                 className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
//               >
//                 <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
//                   <Eye className="w-4 h-4 text-gray-600" />
//                 </div>
//                 <span className="text-xs text-gray-500">View</span>
//               </button>
//               <button
//                 onClick={() => { setEditUser(user); setActionMenu(null); }}
//                 className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-blue-50 transition-colors"
//               >
//                 <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
//                   <Edit className="w-4 h-4 text-blue-600" />
//                 </div>
//                 <span className="text-xs text-blue-600">Edit</span>
//               </button>
//               {user.status !== UserStatus.ACTIVE ? (
//                 <button
//                   onClick={() => handleAction(userId, "activate")}
//                   className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-emerald-50 transition-colors"
//                 >
//                   <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
//                     <UserCheck className="w-4 h-4 text-emerald-600" />
//                   </div>
//                   <span className="text-xs text-emerald-600">Activate</span>
//                 </button>
//               ) : (
//                 <button
//                   onClick={() => handleAction(userId, "suspend")}
//                   className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-amber-50 transition-colors"
//                 >
//                   <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
//                     <AlertTriangle className="w-4 h-4 text-amber-500" />
//                   </div>
//                   <span className="text-xs text-amber-500">Suspend</span>
//                 </button>
//               )}
//               <button
//                 onClick={() => handleAction(userId, "delete")}
//                 className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-red-50 transition-colors"
//               >
//                 <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
//                   <Trash2 className="w-4 h-4 text-red-500" />
//                 </div>
//                 <span className="text-xs text-red-500">Delete</span>
//               </button>
//             </div>

//             {/* Cancel */}
//             <div className="p-3">
//               <button
//                 onClick={() => setActionMenu(null)}
//                 className="w-full py-2.5 rounded-xl bg-gray-100 text-sm font-medium text-gray-600"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
