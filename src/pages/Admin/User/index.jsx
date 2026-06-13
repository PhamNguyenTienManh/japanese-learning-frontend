import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

import { userApi } from "~/services/userService";
import { getAdminUserActivities } from "~/services/userActivityService";
import UserHeader from "~/components/UserHeader/UserHeader";
import UserFilters from "~/components/UserFilters/UserFilters";
import UserTable from "~/components/UserTable/UserTable";
import UserActivityDrawer from "~/components/UserActivityDrawer/UserActivityDrawer";
import AdminUserModal from "~/components/AdminUserModal/AdminUserModal";
import { useToast } from "~/context/ToastContext";

const PAGE_SIZE = 10;

const FIELD_ERROR_PATTERNS = [
  { field: "email", patterns: ["email"] },
  { field: "password", patterns: ["password", "mật khẩu"] },
  { field: "name", patterns: ["name", "tên"] },
  { field: "phone", patterns: ["phone", "số điện thoại"] },
  { field: "birthday", patterns: ["birthday", "birth", "date", "age", "tuổi"] },
  { field: "role", patterns: ["role", "vai trò"] },
  { field: "status", patterns: ["status", "trạng thái"] },
  { field: "sex", patterns: ["sex", "gender", "giới tính"] },
  { field: "address", patterns: ["address", "địa chỉ"] },
  { field: "job", patterns: ["job", "nghề"] },
  { field: "introduction", patterns: ["introduction", "giới thiệu"] },
];

function normalizeErrorMessages(error) {
  const message = error?.message || error?.response?.data?.message;
  if (Array.isArray(message)) return message;
  if (typeof message === "string") return [message];
  return ["Không thể lưu người dùng"];
}

function parseFieldErrors(error) {
  const fieldErrors = {};
  const genericErrors = [];

  normalizeErrorMessages(error).forEach((message) => {
    const normalized = String(message).toLowerCase();
    const match = FIELD_ERROR_PATTERNS.find(({ patterns }) =>
      patterns.some((pattern) => normalized.includes(pattern)),
    );

    if (match && !fieldErrors[match.field]) {
      fieldErrors[match.field] = message;
    } else {
      genericErrors.push(message);
    }
  });

  return { fieldErrors, genericMessage: genericErrors[0] || "" };
}

const getPaginationItems = (totalPages, currentPage) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visible = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

  if (currentPage <= 3) {
    visible.add(2);
    visible.add(3);
    visible.add(4);
  }

  if (currentPage >= totalPages - 2) {
    visible.add(totalPages - 3);
    visible.add(totalPages - 2);
    visible.add(totalPages - 1);
  }

  const pages = Array.from(visible)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return pages.reduce((items, page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) {
      items.push(`ellipsis-${page}`);
    }
    items.push(page);
    return items;
  }, []);
};

function User() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [activityUser, setActivityUser] = useState(null);
  const [userActivities, setUserActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState("create");
  const [editingUser, setEditingUser] = useState(null);
  const [userSaving, setUserSaving] = useState(false);
  const [userModalError, setUserModalError] = useState("");
  const [userFieldErrors, setUserFieldErrors] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userApi.getAllUsers();
      if (response.success) setUsers(response.data.data);
    } catch (err) {
      setError("Không thể tải danh sách người dùng");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivities = async (userId) => {
    try {
      setActivitiesLoading(true);
      setActivitiesError("");
      const response = await getAdminUserActivities(userId, 50);
      const activities = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setUserActivities(activities);
    } catch (err) {
      console.error("Error fetching user activities:", err);
      setActivitiesError("Không thể tải lịch sử hoạt động của người dùng");
      setUserActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleViewActivity = (user) => {
    setActivityUser(user);
    setActivityDrawerOpen(true);
    setUserActivities([]);
    loadUserActivities(user._id);
  };

  const handleRetryActivities = () => {
    if (activityUser?._id) loadUserActivities(activityUser._id);
  };

  const handleOpenCreateUser = () => {
    setUserModalMode("create");
    setEditingUser(null);
    setUserModalError("");
    setUserFieldErrors({});
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setUserModalMode("edit");
    setEditingUser(user);
    setUserModalError("");
    setUserFieldErrors({});
    setUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    if (userSaving) return;
    setUserModalOpen(false);
    setEditingUser(null);
    setUserModalError("");
    setUserFieldErrors({});
  };

  const handleSubmitUser = async (payload) => {
    try {
      setUserSaving(true);
      setUserModalError("");
      setUserFieldErrors({});

      const response =
        userModalMode === "edit" && editingUser?._id
          ? await userApi.updateUser(editingUser._id, payload)
          : await userApi.createUser(payload);

      const savedUser = response?.data;
      if (savedUser?._id) {
        setUsers((current) => {
          if (userModalMode === "edit") {
            return current.map((user) =>
              user._id === savedUser._id ? savedUser : user,
            );
          }
          setCurrentPage(1);
          return [savedUser, ...current];
        });
      } else {
        await fetchUsers();
      }

      setUserModalOpen(false);
      setEditingUser(null);
      addToast(
        userModalMode === "edit"
          ? "Cập nhật người dùng thành công"
          : "Tạo người dùng thành công",
        "success",
      );
    } catch (err) {
      console.error("Error saving user:", err);
      const { fieldErrors, genericMessage } = parseFieldErrors(err);
      setUserFieldErrors(fieldErrors);
      setUserModalError(genericMessage);
    } finally {
      setUserSaving(false);
    }
  };

  const handleClearUserFieldError = (field) => {
    setUserFieldErrors((current) => ({ ...current, [field]: "" }));
    setUserModalError("");
  };

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      (user.profile?.name || "").toLowerCase().includes(q) ||
      (user.email || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || user.status === statusFilter;
    const matchRole = roleFilter === "all" || user.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredUsers.length);
  const showingFrom = filteredUsers.length > 0 ? startIndex + 1 : 0;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const showPagination = filteredUsers.length > PAGE_SIZE;
  const paginationItems = getPaginationItems(totalPages, safeCurrentPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#f7f8fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <UserHeader
          total={users.length}
          filteredCount={filteredUsers.length}
          page="người dùng"
          onRefresh={fetchUsers}
          refreshing={loading}
        />

        {loading ? (
          <div className="grid min-h-[260px] place-items-center rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center gap-3 text-sm font-semibold text-slate-500">
              <RefreshCw size={22} className="animate-spin" aria-hidden="true" />
              Đang tải danh sách người dùng...
            </div>
          </div>
        ) : error ? (
          <div className="grid min-h-[260px] place-items-center rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="m-0 text-sm font-semibold text-rose-700">{error}</p>
              <button
                type="button"
                onClick={fetchUsers}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <RefreshCw size={16} aria-hidden="true" />
                Thử lại
              </button>
            </div>
          </div>
        ) : (
          <>
            <UserFilters
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              roleFilter={roleFilter}
              onSearchChange={setSearchQuery}
              onStatusChange={setStatusFilter}
              onRoleChange={setRoleFilter}
            />

            <UserTable
              users={paginatedUsers}
              showingFrom={showingFrom}
              showingTo={endIndex}
              totalCount={filteredUsers.length}
              pagination={
                filteredUsers.length > 0 ? (
                  <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-bold text-slate-500">
                      Trang {safeCurrentPage} / {totalPages}
                    </span>

                    {showPagination && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => goToPage(safeCurrentPage - 1)}
                          disabled={safeCurrentPage === 1}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-slate-200 bg-white text-slate-700 transition hover:-translate-y-px hover:border-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-[0_8px_16px_-10px_rgba(37,99,235,0.45)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700 disabled:hover:shadow-none"
                          aria-label="Trang trước"
                        >
                          <ChevronLeft size={16} aria-hidden="true" />
                        </button>

                        {paginationItems.map((item) =>
                          typeof item === "number" ? (
                            <button
                              key={item}
                              type="button"
                              onClick={() => goToPage(item)}
                              className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded-full px-3 text-sm font-extrabold transition ${
                                item === safeCurrentPage
                                  ? "bg-slate-950 text-white shadow-sm"
                                  : "border-[1.5px] border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-100 hover:text-blue-600"
                              }`}
                              aria-current={item === safeCurrentPage ? "page" : undefined}
                            >
                              {item}
                            </button>
                          ) : (
                            <span
                              key={item}
                              className="inline-flex h-9 min-w-[28px] items-center justify-center text-sm font-extrabold text-slate-400"
                            >
                              ...
                            </span>
                          ),
                        )}

                        <button
                          type="button"
                          onClick={() => goToPage(safeCurrentPage + 1)}
                          disabled={safeCurrentPage === totalPages}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-slate-200 bg-white text-slate-700 transition hover:-translate-y-px hover:border-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-[0_8px_16px_-10px_rgba(37,99,235,0.45)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700 disabled:hover:shadow-none"
                          aria-label="Trang sau"
                        >
                          <ChevronRight size={16} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : null
              }
              onViewActivity={handleViewActivity}
              onEditUser={handleOpenEditUser}
              onCreateUser={handleOpenCreateUser}
            />
          </>
        )}
      </div>

      <AdminUserModal
        open={userModalOpen}
        mode={userModalMode}
        user={editingUser}
        saving={userSaving}
        error={userModalError}
        fieldErrors={userFieldErrors}
        onClose={handleCloseUserModal}
        onSubmit={handleSubmitUser}
        onClearFieldError={handleClearUserFieldError}
      />

      <UserActivityDrawer
        open={activityDrawerOpen}
        user={activityUser}
        activities={userActivities}
        loading={activitiesLoading}
        error={activitiesError}
        onClose={() => setActivityDrawerOpen(false)}
        onRetry={handleRetryActivities}
      />
    </div>
  );
}

export default User;
