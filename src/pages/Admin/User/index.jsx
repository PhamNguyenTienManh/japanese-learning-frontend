import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

import { userApi } from "~/services/userService";
import { getAdminUserActivities } from "~/services/userActivityService";
import UserHeader from "~/components/UserHeader/UserHeader";
import UserFilters from "~/components/UserFilters/UserFilters";
import UserTable from "~/components/UserTable/UserTable";
import UserActivityDrawer from "~/components/UserActivityDrawer/UserActivityDrawer";

function User() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [activityUser, setActivityUser] = useState(null);
  const [userActivities, setUserActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "banned" : "active";
      const response = await userApi.updateUserStatus(userId, newStatus);
      if (response.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u)),
        );
        alert(response.data.message);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Không thể cập nhật trạng thái người dùng");
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const response = await userApi.updateUserRole(userId, newRole);
      if (response.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)),
        );
        alert(response.data.message);
      }
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Không thể cập nhật vai trò người dùng");
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

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <UserHeader
          total={users.length}
          filteredCount={filteredUsers.length}
          page="người dùng"
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
              users={filteredUsers}
              onToggleStatus={handleToggleStatus}
              onChangeRole={handleChangeRole}
              onViewActivity={handleViewActivity}
            />
          </>
        )}
      </div>

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
