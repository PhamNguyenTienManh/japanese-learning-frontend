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

const cx = classNames.bind(styles);

function User() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");
    const [error, setError] = useState(null);

    // Fetch users khi component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userApi.getAllUsers();
            if (response.success) {
                setUsers(response.data.data);
            }
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
                // Cập nhật state local
                setUsers(users.map(user => 
                    user._id === userId 
                        ? { ...user, status: newStatus }
                        : user
                ));
                
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
                // Cập nhật state local
                setUsers(users.map(user => 
                    user._id === userId 
                        ? { ...user, role: newRole }
                        : user
                ));
                
                alert(response.data.message);
            }
        } catch (err) {
            console.error("Error updating role:", err);
            alert("Không thể cập nhật vai trò người dùng");
        }
    };

    const filteredUsers = users.filter((user) => {
        const q = searchQuery.trim().toLowerCase();
        const userName = user.profile?.name || "";
        const userEmail = user.email || "";
        
        const matchSearch =
            !q ||
            userName.toLowerCase().includes(q) ||
            userEmail.toLowerCase().includes(q);

        const matchStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && user.status === "active") ||
            (statusFilter === "banned" && user.status === "banned");

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
                    {/* Header */}
                    <div className={cx("header")}>
                        <Link to="/admin" className={cx("backLink")}>
                            <FontAwesomeIcon
                                icon={faArrowLeft}
                                className={cx("backIcon")}
                            />
                            <span>Quay lại bảng quản trị</span>
                        </Link>

                        <div className={cx("headerMain")}>
                            <div>
                                <h1 className={cx("title")}>Quản lý người dùng</h1>
                                <p className={cx("subtitle")}>
                                    Tổng cộng {users.length} người dùng
                                    {filteredUsers.length !== users.length &&
                                        ` · ${filteredUsers.length} kết quả`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <Card className={cx("filterCard")}>
                        <div className={cx("filterRow")}>
                            <div className={cx("searchWrapper")}>
                                <FontAwesomeIcon
                                    icon={faMagnifyingGlass}
                                    className={cx("searchIcon")}
                                />
                                <Input
                                    placeholder="Tìm kiếm theo tên hoặc email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={cx("searchInput")}
                                />
                            </div>
                            <div className={cx("selectGroup")}>
                                <select
                                    className={cx("select")}
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value={USER_STATUS.ACTIVE}>Đang hoạt động</option>
                                    <option value={USER_STATUS.BANNED}>Bị cấm</option>
                                </select>
                                <select
                                    className={cx("select")}
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option value="all">Tất cả vai trò</option>
                                    <option value={USER_ROLES.STUDENT}>Học viên</option>
                                    <option value={USER_ROLES.ADMIN}>Quản trị viên</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Users Table */}
                    <Card className={cx("usersCard")}>
                        <div className={cx("tableWrapper")}>
                            <table className={cx("table")}>
                                <thead className={cx("thead")}>
                                    <tr>
                                        <th className={cx("th")}>Người dùng</th>
                                        <th className={cx("th")}>Vai trò</th>
                                        <th className={cx("th")}>Trạng thái</th>
                                        <th className={cx("th")}>Provider</th>
                                        <th className={cx("th")}>Ngày đăng ký</th>
                                        <th className={cx("th", "thRight")}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr
                                            key={user._id}
                                            className={cx("row")}
                                        >
                                            <td className={cx("td")}>
                                                <div className={cx("userCell")}>
                                                    <img
                                                        src={user.profile?.image_url || "/placeholder.svg"}
                                                        alt={user.profile?.name || "User"}
                                                        className={cx("avatar")}
                                                    />
                                                    <div>
                                                        <p className={cx("userName")}>
                                                            {user.profile?.name || "Chưa có tên"}
                                                        </p>
                                                        <p className={cx("userEmail")}>{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className={cx("td")}>
                                                <select
                                                    className={cx("roleSelect")}
                                                    value={user.role || USER_ROLES.STUDENT}
                                                    onChange={(e) => handleChangeRole(user._id, e.target.value)}
                                                >
                                                    <option value={USER_ROLES.STUDENT}>Học viên</option>
                                                    <option value={USER_ROLES.ADMIN}>Quản trị viên</option>
                                                </select>
                                            </td>

                                            <td className={cx("td")}>
                                                {user.status === USER_STATUS.ACTIVE ? (
                                                    <span
                                                        className={cx("badge", "badgeActive")}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faCircleCheck}
                                                            className={cx("badgeIcon")}
                                                        />
                                                        <span>Hoạt động</span>
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={cx("badge", "badgeBanned")}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faBan}
                                                            className={cx("badgeIcon")}
                                                        />
                                                        <span>Bị cấm</span>
                                                    </span>
                                                )}
                                            </td>

                                            <td className={cx("td")}>
                                                <span className={cx("badge", "badgeProvider")}>
                                                    {PROVIDER_LABELS[user.provider] || user.provider || "local"}
                                                </span>
                                            </td>

                                            <td className={cx("td", "tdText")}>
                                                {new Date(user.registeredAt || user.createdAt).toLocaleDateString('vi-VN')}
                                            </td>

                                            <td className={cx("td")}>
                                                <div className={cx("actions")}>
                                                    <Button 
                                                        className={cx("actionButton", user.status === USER_STATUS.BANNED ? "unlockButton" : "banButton")} 
                                                        rounded
                                                        onClick={() => handleToggleStatus(user._id, user.status)}
                                                    >
                                                        <FontAwesomeIcon icon={user.status === USER_STATUS.BANNED ? faLockOpen : faLock} />
                                                        <span>{user.status === USER_STATUS.BANNED ? "Mở khóa" : "Cấm"}</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td
                                                className={cx("tdEmpty")}
                                                colSpan={6}
                                            >
                                                Không tìm thấy người dùng nào phù hợp
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}

export default User;