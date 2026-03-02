import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faMagnifyingGlass,
    faBan,
    faCircleCheck,
    faLock,
    faLockOpen,
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { userApi } from "~/services/userService";
import { USER_ROLES, USER_STATUS, PROVIDER_LABELS } from "~/services/userConstants";

import styles from "./User.module.scss";
import UserHeader from "~/components/UserHeader/UserHeader";
import UserFilters from "~/components/UserFilters/UserFilters";
import UserTable from "~/components/UserTable/UserTable";

const cx = classNames.bind(styles);

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
          prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
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
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
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
    const matchRole =
      roleFilter === "all" || user.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });


  if (loading) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("inner")}>
            <div className={cx("loading")}>Đang tải...</div>
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
            <div className={cx("error")}>{error}</div>
            <Button onClick={fetchUsers}>Thử lại</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("inner")}>
          <UserHeader total={users.length} filteredCount={filteredUsers.length} page='người dùng' />
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
          />
        </div>
      </main>
    </div>
  );
}

export default User;
