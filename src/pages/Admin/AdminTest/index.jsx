import { useState } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faMagnifyingGlass,
    faPlus,
    faPenToSquare,
    faTrash,
    faEye,
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";

import styles from "./AdminTest.module.scss";

const cx = classNames.bind(styles);

const mockTests = [
    {
        id: 1,
        title: "JLPT N5 - Đề số 1",
        level: "N5",
        questions: 60,
        duration: 105,
        attempts: 234,
        averageScore: 78,
        status: "published",
        createdDate: "2024-10-01",
    },
    {
        id: 2,
        title: "JLPT N5 - Đề số 2",
        level: "N5",
        questions: 60,
        duration: 105,
        attempts: 189,
        averageScore: 82,
        status: "published",
        createdDate: "2024-10-05",
    },
    {
        id: 3,
        title: "JLPT N4 - Đề số 1",
        level: "N4",
        questions: 70,
        duration: 125,
        attempts: 156,
        averageScore: 75,
        status: "draft",
        createdDate: "2024-10-10",
    },
];

function AdminTest() {
    const [searchQuery, setSearchQuery] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredTests = mockTests.filter((test) => {
        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
            !q ||
            test.title.toLowerCase().includes(q) ||
            test.level.toLowerCase().includes(q);

        const matchLevel = levelFilter === "all" || test.level === levelFilter;

        const matchStatus =
            statusFilter === "all" ||
            (statusFilter === "published" && test.status === "published") ||
            (statusFilter === "draft" && test.status === "draft");

        return matchSearch && matchLevel && matchStatus;
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
                                <h1 className={cx("title")}>Quản lý đề thi</h1>
                                <p className={cx("subtitle")}>
                                    Tổng cộng {mockTests.length} đề thi
                                    {filteredTests.length !== mockTests.length &&
                                        ` · ${filteredTests.length} kết quả`}
                                </p>
                            </div>
                            <Link to="/admin/tests/create">
                                <Button
                                    primary
                                    leftIcon={<FontAwesomeIcon icon={faPlus} />}
                                >
                                    Tạo đề thi mới
                                </Button>
                            </Link>
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
                                    <option value="published">Đã xuất bản</option>
                                    <option value="draft">Bản nháp</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Tests List */}
                    <div className={cx("list")}>
                        {filteredTests.map((test) => (
                            <Card key={test.id} className={cx("testCard")}>
                                <div className={cx("testHeader")}>
                                    <div className={cx("testInfo")}>
                                        <div className={cx("titleRow")}>
                                            <h3 className={cx("testTitle")}>{test.title}</h3>
                                            <span className={cx("badge", "badgeLevel")}>
                                                {test.level}
                                            </span>
                                            {test.status === "published" ? (
                                                <span className={cx("badge", "badgePublished")}>
                                                    Đã xuất bản
                                                </span>
                                            ) : (
                                                <span className={cx("badge")}>Bản nháp</span>
                                            )}
                                        </div>

                                        <div className={cx("statsGrid")}>
                                            <div className={cx("statItem")}>
                                                <p className={cx("statLabel")}>Số câu hỏi</p>
                                                <p className={cx("statValue")}>{test.questions}</p>
                                            </div>
                                            <div className={cx("statItem")}>
                                                <p className={cx("statLabel")}>Thời gian</p>
                                                <p className={cx("statValue")}>
                                                    {test.duration} phút
                                                </p>
                                            </div>
                                            <div className={cx("statItem")}>
                                                <p className={cx("statLabel")}>Lượt thi</p>
                                                <p className={cx("statValue")}>{test.attempts}</p>
                                            </div>
                                            <div className={cx("statItem")}>
                                                <p className={cx("statLabel")}>Điểm TB</p>
                                                <p className={cx("statValue")}>
                                                    {test.averageScore}%
                                                </p>
                                            </div>
                                        </div>

                                        <p className={cx("createdText")}>
                                            Tạo ngày: {test.createdDate}
                                        </p>
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
                                            leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
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

                        {filteredTests.length === 0 && (
                            <Card className={cx("emptyCard")}>
                                <p className={cx("emptyText")}>
                                    Không tìm thấy đề thi nào phù hợp
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminTest;
