import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers,
    faBookOpen,
    faFileLines,
    faComments,
    faChartLine,
    faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import styles from "./Admin.module.scss";

const cx = classNames.bind(styles);

const stats = {
    totalUsers: 1234,
    activeUsers: 856,
    totalWords: 5678,
    totalTests: 45,
    totalPosts: 234,
    pendingReports: 3,
};

const recentActivity = [
    {
        type: "user",
        message: "Người dùng mới đăng ký: nguyenvana@example.com",
        time: "5 phút trước",
    },
    {
        type: "post",
        message: "Bài viết mới: Cách học Kanji hiệu quả",
        time: "15 phút trước",
    },
    {
        type: "report",
        message: "Báo cáo vi phạm từ user123",
        time: "1 giờ trước",
    },
    {
        type: "test",
        message: "Đề thi N5 - Đề số 10 được tạo",
        time: "2 giờ trước",
    },
];

function Admin() {
    return (
        <div className={cx("wrapper")}>

            <main className={cx("main")}>
                <div className={cx("inner")}>
                    {/* Header */}
                    <header className={cx("header")}>
                        <h1 className={cx("title")}>Bảng quản trị</h1>
                        <p className={cx("subtitle")}>
                            Quản lý và giám sát hệ thống học tiếng Nhật
                        </p>
                    </header>

                    {/* Stats Grid */}
                    <div className={cx("statsGrid")}>
                        <Link to="/admin/users" className={cx("link")}>
                            <Card className={cx("statCard")}>
                                <div className={cx("cardHeader")}>
                                    <div className={cx("iconBox", "iconBoxBlue")}>
                                        <FontAwesomeIcon icon={faUsers} />
                                    </div>
                                    <div>
                                        <p className={cx("cardValue")}>{stats.totalUsers}</p>
                                        <p className={cx("cardLabel")}>Người dùng</p>
                                    </div>
                                </div>
                                <p className={cx("cardSub")}>
                                    {stats.activeUsers} đang hoạt động
                                </p>
                            </Card>
                        </Link>

                        <Link to="/admin/dictionary" className={cx("link")}>
                            <Card className={cx("statCard")}>
                                <div className={cx("cardHeader")}>
                                    <div className={cx("iconBox", "iconBoxGreen")}>
                                        <FontAwesomeIcon icon={faBookOpen} />
                                    </div>
                                    <div>
                                        <p className={cx("cardValue")}>{stats.totalWords}</p>
                                        <p className={cx("cardLabel")}>Từ vựng</p>
                                    </div>
                                </div>
                                <p className={cx("cardSub")}>Trong từ điển</p>
                            </Card>
                        </Link>

                        <Link to="/admin/tests" className={cx("link")}>
                            <Card className={cx("statCard")}>
                                <div className={cx("cardHeader")}>
                                    <div className={cx("iconBox", "iconBoxPurple")}>
                                        <FontAwesomeIcon icon={faFileLines} />
                                    </div>
                                    <div>
                                        <p className={cx("cardValue")}>{stats.totalTests}</p>
                                        <p className={cx("cardLabel")}>Đề thi</p>
                                    </div>
                                </div>
                                <p className={cx("cardSub")}>JLPT N5-N1</p>
                            </Card>
                        </Link>

                        <Link to="/admin/posts" className={cx("link")}>
                            <Card className={cx("statCard")}>
                                <div className={cx("cardHeader")}>
                                    <div className={cx("iconBox", "iconBoxOrange")}>
                                        <FontAwesomeIcon icon={faComments} />
                                    </div>
                                    <div>
                                        <p className={cx("cardValue")}>{stats.totalPosts}</p>
                                        <p className={cx("cardLabel")}>Bài viết</p>
                                    </div>
                                </div>
                                <p className={cx("cardSub")}>Trong cộng đồng</p>
                            </Card>
                        </Link>

                        <Link to="/admin/analytics" className={cx("link")}>
                            <Card className={cx("statCard")}>
                                <div className={cx("cardHeader")}>
                                    <div className={cx("iconBox", "iconBoxPrimary")}>
                                        <FontAwesomeIcon icon={faChartLine} />
                                    </div>
                                    <div>
                                        <p className={cx("cardValue")}>+24%</p>
                                        <p className={cx("cardLabel")}>Tăng trưởng</p>
                                    </div>
                                </div>
                                <p className={cx("cardSub")}>So với tháng trước</p>
                            </Card>
                        </Link>

                        <Link to="/admin/reports" className={cx("link")}>
                            <Card className={cx("statCard")}>
                                <div className={cx("cardHeader")}>
                                    <div className={cx("iconBox", "iconBoxRed")}>
                                        <FontAwesomeIcon icon={faTriangleExclamation} />
                                    </div>
                                    <div>
                                        <p className={cx("cardValue")}>{stats.pendingReports}</p>
                                        <p className={cx("cardLabel")}>Báo cáo</p>
                                    </div>
                                </div>
                                <p className={cx("cardSub")}>Cần xử lý</p>
                            </Card>
                        </Link>


                    </div>

                    {/* Recent Activity */}
                    <Card className={cx("activityCard")}>
                        <h2 className={cx("activityTitle")}>Hoạt động gần đây</h2>
                        <div className={cx("activityList")}>
                            {recentActivity.map((activity, index) => (
                                <div key={index} className={cx("activityItem")}>
                                    <div
                                        className={cx(
                                            "activityIcon",
                                            activity.type === "user" && "activityIconBlue",
                                            activity.type === "post" && "activityIconOrange",
                                            activity.type === "report" && "activityIconRed",
                                            activity.type === "test" && "activityIconPurple"
                                        )}
                                    >
                                        {activity.type === "user" && (
                                            <FontAwesomeIcon icon={faUsers} />
                                        )}
                                        {activity.type === "post" && (
                                            <FontAwesomeIcon icon={faComments} />
                                        )}
                                        {activity.type === "report" && (
                                            <FontAwesomeIcon icon={faTriangleExclamation} />
                                        )}
                                        {activity.type === "test" && (
                                            <FontAwesomeIcon icon={faFileLines} />
                                        )}
                                    </div>
                                    <div className={cx("activityContent")}>
                                        <p className={cx("activityMessage")}>
                                            {activity.message}
                                        </p>
                                        <p className={cx("activityTime")}>{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}

export default Admin;
