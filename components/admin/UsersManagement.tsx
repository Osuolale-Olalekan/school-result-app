"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Plus,
  Filter,
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
} from "lucide-react";
import { UserRole, UserStatus } from "@/types/enums";
import type { IUser } from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import CreateUserModal from "@/components/admin/CreateUserModal";
import EditUserModal from "./EditUserModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import CreateAdminModal from "./CreateAdminModal";

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

export default function UsersManagement() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<ExtendedUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<ExtendedUser | null>(null);

  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

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
    // For delete, show the modal instead of proceeding directly
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
      const json = (await res.json()) as {
        success: boolean;
        message?: string;
      };
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowCreateAdmin(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors"
        >
          <Shield className="w-4 h-4" />
          Add Admin
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Users Management
          </h1>
          <p className="text-gray-500 text-sm">{total} total users</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#152847] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New User
        </button>
      </div> */}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div className="flex gap-1 p-1 bg-gray-50 rounded-xl border border-gray-200">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setRoleFilter(tab.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  ID / Admission
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
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
                              getInitials(user.firstName, user.lastName)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {user.email}
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
                      <td className="px-4 py-3.5 hidden sm:table-cell">
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
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right relative">
                        <button
                          onClick={() =>
                            setActionMenu(
                              actionMenu === user._id ? null : user._id,
                            )
                          }
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {actionMenu === user._id && (
                          <div className="absolute right-10 top-2 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[160px]">
                            {user.status !== UserStatus.ACTIVE && (
                              <button
                                onClick={() =>
                                  handleAction(user._id, "activate")
                                }
                                className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                              >
                                <UserCheck className="w-4 h-4" /> Activate
                              </button>
                            )}
                            {user.status === UserStatus.ACTIVE && (
                              <button
                                onClick={() =>
                                  handleAction(user._id, "deactivate")
                                }
                                className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <UserX className="w-4 h-4" /> Deactivate
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditUser(user);
                                setActionMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" /> Edit
                            </button>

                            <button
                              onClick={() => handleAction(user._id, "suspend")}
                              className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                            >
                              <AlertTriangle className="w-4 h-4" /> Suspend
                            </button>
                            <hr className="my-1 border-gray-50" />
                            <button
                              onClick={() => handleAction(user._id, "delete")}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
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
          userName={`${deleteUser.firstName} ${deleteUser.lastName}`}
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
    </div>
  );
}
