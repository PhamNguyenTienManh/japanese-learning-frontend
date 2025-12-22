import { useState, useEffect } from "react";
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
import postService from "~/services/postService";
import notificationService from "~/services/notificationService";

import styles from "./AdminPosts.module.scss";

const cx = classNames.bind(styles);

function AdminPosts() {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPosts, setTotalPosts] = useState(0);
    const [countComment, setCountComment] = useState([])

    // Load categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await postService.getCategories();
                setCategories(data || []);
            } catch (error) {
                console.error("Error loading categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Load posts
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                let data;

                // Nếu có search query, dùng search API
                if (searchQuery.trim()) {
                    data = await postService.searchPosts(searchQuery, page, 50);
                }
                // Nếu có filter category, dùng category API
                else if (categoryFilter !== "all") {
                    data = await postService.getPostsByCategory(categoryFilter, page, 50);
                }
                // Mặc định load tất cả posts
                else {
                    data = await postService.getPosts(page, 50);
                }

                setPosts(data.data.data || []);
                setCountComment(data.data.countComment)
                setTotalPosts(data.pagination?.total || data.data?.length || 0);
            } catch (error) {
                console.error("Error loading posts:", error);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timer = setTimeout(() => {
            fetchPosts();
        }, searchQuery ? 500 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, categoryFilter, page]);

    // Handle delete post
    const handleDeletePost = async (postId, title, targetUserId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
            return;
        }

        try {
            await postService.deletePost(postId);
            setPosts(posts.filter(post => post.id !== postId));
            setTotalPosts(prev => prev - 1);
            alert("Xóa bài viết thành công!");
            try {
                await notificationService.pushNotification({
                    userId: targetUserId,
                    targetId: postId,
                    title: "Bài viết vi phạm",
                    message: "Admin đã xoá bài viết vì vi phạm tiêu chuẩn cộng đồng: "+ title,
                });
            } catch (error) {
                console.error("Error pushing notification:", error);
            }
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Có lỗi xảy ra khi xóa bài viết!");
        }
    };

    // Filter posts by status (reported/published)
    const filteredPosts = posts.filter((post) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "reported") return post.hasReports || post.status === 0;
        if (statusFilter === "published") return !post.hasReports && post.status !== 0;
        return true;
    });

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

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
                                    {filteredPosts.length !== totalPosts &&
                                        `${filteredPosts.length} kết quả`}
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
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat._id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                {/* <select
                                    className={cx("select")}
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="published">Đã xuất bản</option>
                                    <option value="reported">Bị báo cáo</option>
                                </select> */}
                            </div>
                        </div>
                    </Card>

                    {/* Loading State */}
                    {loading && (
                        <Card className={cx("emptyCard")}>
                            <p className={cx("emptyText")}>Đang tải dữ liệu...</p>
                        </Card>
                    )}

                    {/* Posts List */}
                    {!loading && (
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
                                                <span className={cx("badge")}>
                                                    {post.category_id.name || "Khác"}
                                                </span>
                                            </div>
                                            <p className={cx("meta")}>
                                                Bởi {post.
                                                    profile_id
                                                    ?.name || "Ẩn danh"} • {formatDate(post.updated_at || post.createdDate)}
                                            </p>
                                            <div className={cx("statsRow")}>
                                                <span>{countComment.find(x => x._id === post._id)?.totalComment || 0} bình luận</span>
                                                <span>{ }</span>
                                                <span>{post.liked.length || 0} thích</span>
                                            </div>
                                        </div>
                                        <div className={cx("actions")}>
                                            <Link to={`/community/${post._id}`}>
                                                <Button
                                                    outline
                                                    rounded
                                                    leftIcon={<FontAwesomeIcon icon={faEye} />}
                                                />
                                            </Link>
                                            <Button
                                                outline
                                                rounded
                                                className={cx("dangerBtn")}
                                                leftIcon={<FontAwesomeIcon icon={faTrash} />}
                                                onClick={() => handleDeletePost(post._id, post.title, post.profile_id.userId)}
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
                    )}
                </div>
            </main>
        </div>
    );
}

export default AdminPosts;