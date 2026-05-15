import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import { motion } from "framer-motion";

import Button from "~/components/Button";
import { userApi } from "~/services/userService";

import styles from "./User.module.scss";
import UserHeader from "~/components/UserHeader/UserHeader";
import UserFilters from "~/components/UserFilters/UserFilters";
import UserTable from "~/components/UserTable/UserTable";

const cx = classNames.bind(styles);

const easeOut = [0.22, 1, 0.36, 1];

function User() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

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

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      (user.profile?.name || "").toLowerCase().includes(q) ||
      (user.email || "").toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "all" || user.status === statusFilter;
    const matchRole = roleFilter === "all" || user.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  if (loading) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("inner")}>
            <div className={cx("loading")}>
              <div className={cx("loadingRing")} />
              <p>Đang tải danh sách người dùng...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("inner")}>
            <div className={cx("errorState")}>
              <p>{error}</p>
              <Button primary onClick={fetchUsers}>
                Thử lại
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cx("wrapper")}>
      <motion.div
        className={cx("blob1")}
        animate={{ y: [0, -22, 0], x: [0, 12, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={cx("blob2")}
        animate={{ y: [0, 18, 0], x: [0, -14, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <main className={cx("main")}>
        <div className={cx("inner")}>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <UserHeader
              total={users.length}
              filteredCount={filteredUsers.length}
              page="người dùng"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.1 }}
          >
            <UserFilters
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              roleFilter={roleFilter}
              onSearchChange={setSearchQuery}
              onStatusChange={setStatusFilter}
              onRoleChange={setRoleFilter}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.18 }}
          >
            <UserTable
              users={filteredUsers}
              onToggleStatus={handleToggleStatus}
              onChangeRole={handleChangeRole}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default User;
