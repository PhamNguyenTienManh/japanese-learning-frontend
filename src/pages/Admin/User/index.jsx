import { useState } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faMagnifyingGlass,
    faBan,
    faCircleCheck,
    faEllipsisVertical,
    faEnvelope,
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";

import styles from "./User.module.scss";

const cx = classNames.bind(styles);

const mockUsers = [
    {
        id: 1,
        name: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        avatar: "/current-user.jpg",
        level: "N5",
        status: "active",
        joinedDate: "2024-10-01",
        lastActive: "2 giờ trước",
        testsCompleted: 12,
        wordsLearned: 234,
    },
    {
        id: 2,
        name: "Trần Thị B",
        email: "tranthib@example.com",
        avatar: "/placeholder.svg?height=40&width=40",
        level: "N4",
        status: "active",
        joinedDate: "2024-09-15",
        lastActive: "1 ngày trước",
        testsCompleted: 25,
        wordsLearned: 456,
    },
    {
        id: 3,
        name: "Lê Văn C",
        email: "levanc@example.com",
        avatar: "/placeholder.svg?height=40&width=40",
        level: "N3",
        status: "banned",
        joinedDate: "2024-08-20",
        lastActive: "1 tuần trước",
        testsCompleted: 8,
        wordsLearned: 123,
    },
];

function User() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [levelFilter, setLevelFilter] = useState("all");

    const filteredUsers = mockUsers.filter((user) => {
        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
            !q ||
            user.name.toLowerCase().includes(q) ||
            user.email.toLowerCase().includes(q);

        const matchStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && user.status === "active") ||
            (statusFilter === "banned" && user.status === "banned");

        const matchLevel =
            levelFilter === "all" || user.level === levelFilter;

        return matchSearch && matchStatus && matchLevel;
    });

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
                                    Tổng cộng {mockUsers.length} người dùng
                                    {filteredUsers.length !== mockUsers.length &&
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
                                    <option value="active">Đang hoạt động</option>
                                    <option value="banned">Bị cấm</option>
                                </select>
                                <select
                                    className={cx("select")}
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                >
                                    <option value="all">Tất cả cấp độ</option>
                                    <option value="N5">N5</option>
                                    <option value="N4">N4</option>
                                    <option value="N3">N3</option>
                                    <option value="N2">N2</option>
                                    <option value="N1">N1</option>
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
                                        <th className={cx("th")}>Premium</th>
                                        <th className={cx("th")}>Trạng thái</th>
                                        <th className={cx("th")}>Ngày tham gia</th>
                                        <th className={cx("th")}>Hoạt động cuối</th>
                                        <th className={cx("th")}>Thống kê</th>
                                        <th className={cx("th", "thRight")}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className={cx("row")}
                                        >
                                            <td className={cx("td")}>
                                                <div className={cx("userCell")}>
                                                    <img
                                                        src={user.avatar || "/placeholder.svg"}
                                                        alt={user.name}
                                                        className={cx("avatar")}
                                                    />
                                                    <div>
                                                        <p className={cx("userName")}>{user.name}</p>
                                                        <p className={cx("userEmail")}>{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className={cx("td")}>
                                                <span className={cx("badge", "badgeLevel")}>
                                                    {user.level}
                                                </span>
                                            </td>

                                            <td className={cx("td")}>
                                                {user.status === "active" ? (
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

                                            <td className={cx("td", "tdText")}>
                                                {user.joinedDate}
                                            </td>
                                            <td className={cx("td", "tdMuted")}>
                                                {user.lastActive}
                                            </td>

                                            <td className={cx("td")}>
                                                <div className={cx("statsText")}>
                                                    <p>{user.testsCompleted} đề thi</p>
                                                    <p className={cx("statsMuted")}>
                                                        {user.wordsLearned} từ vựng
                                                    </p>
                                                </div>
                                            </td>

                                            <td className={cx("td")}>
                                                <div className={cx("actions")}>
                                                    <Button className={cx("iconButton")} rounded>
                                                        <FontAwesomeIcon icon={faEnvelope} />
                                                    </Button>
                                                    <Button className={cx("iconButton")} rounded>
                                                        <FontAwesomeIcon icon={faEllipsisVertical} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td
                                                className={cx("tdEmpty")}
                                                colSpan={7}
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
