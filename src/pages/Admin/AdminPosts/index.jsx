import { useState } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faMagnifyingGlass,
    faEye,
    faTrash,
    faFlag,
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";

import styles from "./AdminPosts.module.scss";

const cx = classNames.bind(styles);

const mockPosts = [
    {
        id: 1,
        title: "Cách học Kanji hiệu quả cho người mới bắt đầu",
        author: "Nguyễn Văn A",
        category: "Học tập",
        views: 234,
        comments: 12,
        likes: 45,
        status: "published",
        createdDate: "2024-10-15",
        hasReports: false,
    },
    {
        id: 2,
        title: "Chia sẻ kinh nghiệm thi JLPT N5",
        author: "Trần Thị B",
        category: "Kinh nghiệm",
        views: 189,
        comments: 8,
        likes: 32,
        status: "published",
        createdDate: "2024-10-14",
        hasReports: false,
    },
    {
        id: 3,
        title: "Bài viết vi phạm nội dung",
        author: "Lê Văn C",
        category: "Khác",
        views: 45,
        comments: 2,
        likes: 1,
        status: "reported",
        createdDate: "2024-10-13",
        hasReports: true,
    },
];

function AdminPosts() {
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredPosts = mockPosts.filter((post) => {
        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
            !q ||
            post.title.toLowerCase().includes(q) ||
            post.author.toLowerCase().includes(q);

        const matchCategory =
            categoryFilter === "all" || post.category === categoryFilter;

        const matchStatus =
            statusFilter === "all" ||
            (statusFilter === "published" && post.status === "published") ||
            (statusFilter === "reported" && post.status === "reported");

        return matchSearch && matchCategory && matchStatus;
    });

    return (
        <div className={cx("wrapper")}>

            <main className={cx("main")}>
                <div className={cx("inner")}>
                    {/* Header */}
                    <div className={cx("header")}>
                        <Link to="/admin" className={cx("backLink")}>
                            <FontAwesomeIcon icon={faArrowLeft} className={cx("backIcon")} />
                            <span>Quay lại bảng quản trị</span>
                        </Link>
                        <div className={cx("headerMain")}>
                            <div>
                                <h1 className={cx("title")}>Quản lý bài viết</h1>
                                <p className={cx("subtitle")}>
                                    Tổng cộng {mockPosts.length} bài viết
                                    {filteredPosts.length !== mockPosts.length &&
                                        ` · ${filteredPosts.length} kết quả`}
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
                                    placeholder="Tìm kiếm bài viết..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={cx("searchInput")}
                                />
                            </div>
                            <div className={cx("selectGroup")}>
                                <select
                                    className={cx("select")}
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="all">Tất cả danh mục</option>
                                    <option value="Học tập">Học tập</option>
                                    <option value="Kinh nghiệm">Kinh nghiệm</option>
                                    <option value="Hỏi đáp">Hỏi đáp</option>
                                    <option value="Khác">Khác</option>
                                </select>
                                <select
                                    className={cx("select")}
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="published">Đã xuất bản</option>
                                    <option value="reported">Bị báo cáo</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Posts List */}
                    <div className={cx("list")}>
                        {filteredPosts.map((post) => (
                            <Card
                                key={post.id}
                                className={cx(
                                    "postCard",
                                    post.hasReports && "postCardReported"
                                )}
                            >
                                <div className={cx("postInner")}>
                                    <div className={cx("postContent")}>
                                        <div className={cx("titleRow")}>
                                            <h3 className={cx("postTitle")}>{post.title}</h3>
                                            {post.hasReports && (
                                                <span className={cx("badge", "badgeReported")}>
                                                    <FontAwesomeIcon
                                                        icon={faFlag}
                                                        className={cx("badgeIcon")}
                                                    />
                                                    <span>Bị báo cáo</span>
                                                </span>
                                            )}
                                            <span className={cx("badge")}>{post.category}</span>
                                        </div>
                                        <p className={cx("meta")}>
                                            Bởi {post.author} • {post.createdDate}
                                        </p>
                                        <div className={cx("statsRow")}>
                                            <span>{post.views} lượt xem</span>
                                            <span>{post.comments} bình luận</span>
                                            <span>{post.likes} thích</span>
                                        </div>
                                    </div>
                                    <div className={cx("actions")}>
                                        <Button
                                            outline
                                            rounded
                                            leftIcon={<FontAwesomeIcon icon={faEye} />}
                                        />
                                        <Button
                                            outline
                                            rounded
                                            className={cx("dangerBtn")}
                                            leftIcon={<FontAwesomeIcon icon={faTrash} />}
                                        />
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {filteredPosts.length === 0 && (
                            <Card className={cx("emptyCard")}>
                                <p className={cx("emptyText")}>
                                    Không tìm thấy bài viết nào phù hợp
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminPosts;
