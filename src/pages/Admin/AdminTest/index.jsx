import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";

import styles from "./AdminTest.module.scss";
import { getExamsByLevel, updateExam } from "~/services/examService";

const cx = classNames.bind(styles);

function AdminTest() {
    const [searchQuery, setSearchQuery] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(false);

    const navigate = useNavigate();

    // Fetch dữ liệu theo level
    const fetchExams = async (level) => {
        try {
            setLoading(true);
            setError("");
            setExams([]); // reset dữ liệu cũ
            const res = await getExamsByLevel(level); // backend xử lý "all"
            setExams(res.data);
        } catch (err) {
            console.error(err);
            setError("Không thể tải dữ liệu đề thi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ show: false, message: '', type: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    useEffect(() => {
        fetchExams(levelFilter);
    }, [levelFilter]);

    // Filter dựa trên searchQuery và statusFilter
    const filteredExams = exams.filter((exam) => {
        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
            !q || exam.title.toLowerCase().includes(q) || exam.level.toLowerCase().includes(q);

        const matchStatus =
            statusFilter === "all" ||
            (statusFilter === "published" && exam.status === "published") ||
            (statusFilter === "draft" && exam.status === "draft") ||
            (statusFilter === "hidden" && exam.status === "hidden");

        return matchSearch && matchStatus;
    });

    // Xử lý thay đổi trạng thái
    const handleChangeStatus = async (id, newStatus) => {
        try {

            const response = await updateExam(id, { "status": newStatus });
            console.log("vv", response)
            if (response.success) {
                setToast({
                    show: true,
                    message: 'Cập nhật trạng thái thành công',
                    type: 'success'
                });
            }

            setExams((prev) =>
                prev.map((exam) =>
                    exam._id === id ? { ...exam, status: newStatus } : exam
                )
            );

        } catch (err) {
            setToast({
                show: true,
                message: 'Cập nhật trạng thái thất bại: ' + err,
                type: 'error'
            });

        }
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
                                <h1 className={cx("title")}>Quản lý đề thi</h1>
                                <p className={cx("subtitle")}>
                                    Tổng cộng {exams.length} đề thi
                                    {filteredExams.length !== exams.length &&
                                        ` · ${filteredExams.length} kết quả`}
                                </p>
                            </div>
                            <Link to="/admin/tests/create">
                                <Button primary>
                                    Tạo đề thi mới
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <Card className={cx("filterCard")}>
                        <div className={cx("filterRow")}>
                            <div className={cx("searchWrapper")}>
                                <Input
                                    placeholder="Tìm kiếm đề thi..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={cx("searchInput")}
                                />
                            </div>
                            <div className={cx("selectGroup")}>
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
                                <select
                                    className={cx("select")}
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="published">Công khai</option>
                                    <option value="draft">Bản nháp</option>
                                    <option value="hidden">Ẩn</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Loading / Error */}
                    {loading && <p>Đang tải dữ liệu...</p>}
                    {error && <p className={cx("errorText")}>{error}</p>}

                    {/* Tests List */}
                    {!loading && !error && (
                        <div className={cx("list")}>
                            {filteredExams.length > 0 ? (
                                filteredExams.map((exam) => (
                                    <Card key={exam._id} className={cx("testCard")}>
                                        <div className={cx("testHeader")}>
                                            <div className={cx("testInfo")}>
                                                <div className={cx("titleRow")}>
                                                    <h3 className={cx("testTitle")}>JLPT {exam.level} - {exam.title}</h3>
                                                    <span className={cx("badge", "badgeLevel")}>{exam.level}</span>
                                                </div>

                                                <div className={cx("statsGrid")}>
                                                    <div className={cx("statItem")}>
                                                        <p className={cx("statLabel")}>Số câu hỏi</p>
                                                        <p className={cx("statValue")}>{exam.score}</p>
                                                    </div>
                                                    <div className={cx("statItem")}>
                                                        <p className={cx("statLabel")}>Điểm đạt</p>
                                                        <p className={cx("statValue")}>{exam.pass_score}</p>
                                                    </div>
                                                </div>

                                                <p className={cx("createdText")}>
                                                    Tạo ngày: {new Date(exam.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {/* Actions: chỉ còn nút Sửa và dropdown trạng thái */}
                                            <div className={cx("actions")}>
                                                <Button
                                                    outline
                                                    rounded
                                                    leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
                                                    onClick={() => navigate(`/admin/tests/update/${exam._id}`)}
                                                />
                                                <select
                                                    className={cx("statusSelect")}
                                                    value={exam.status}
                                                    onChange={(e) => handleChangeStatus(exam._id, e.target.value)}
                                                >
                                                    <option value="draft">Bản nháp</option>
                                                    <option value="published">Công khai</option>
                                                    <option value="hidden">Ẩn</option>
                                                </select>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <Card className={cx("emptyCard")}>
                                    <p className={cx("emptyText")}>Không tìm thấy đề thi nào phù hợp</p>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Toast Notification */}
            {toast.show && (
                <div className={cx("toast", toast.type)}>
                    <div className={cx("toast-content")}>
                        <span className={cx("toast-icon")}>
                            {toast.type === 'success' ? '✓' : '⚠'}
                        </span>
                        <span className={cx("toast-message")}>{toast.message}</span>
                    </div>

                    <button
                        className={cx("toast-close")}
                        onClick={() => setToast({ show: false, message: '', type: '' })}
                    >
                        ×
                    </button>

                    {/* Progress bar */}
                    <div className={cx("toast-progress")}></div>
                </div>
            )}
        </div>
    );
}

export default AdminTest;
