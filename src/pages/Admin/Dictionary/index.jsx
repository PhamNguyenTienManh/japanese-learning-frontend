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
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";

import styles from "./DictionaryAdmin.module.scss";

const cx = classNames.bind(styles);

const mockWords = [
    {
        id: 1,
        word: "こんにちは",
        romaji: "konnichiwa",
        meaning: "Xin chào (ban ngày)",
        level: "N5",
        type: "Chào hỏi",
        examples: ["こんにちは、元気ですか？"],
    },
    {
        id: 2,
        word: "ありがとう",
        romaji: "arigatou",
        meaning: "Cảm ơn",
        level: "N5",
        type: "Cảm ơn",
        examples: ["ありがとうございます。"],
    },
    {
        id: 3,
        word: "勉強",
        romaji: "benkyou",
        meaning: "Học tập",
        level: "N5",
        type: "Danh từ",
        examples: ["日本語を勉強します。"],
    },
];

function DictionaryAdmin() {
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [levelFilter, setLevelFilter] = useState("all");

    const filteredWords = mockWords.filter((w) => {
        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
            !q ||
            w.word.includes(q) ||
            w.romaji.toLowerCase().includes(q) ||
            w.meaning.toLowerCase().includes(q);

        const matchLevel = levelFilter === "all" || w.level === levelFilter;

        return matchSearch && matchLevel;
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
                                <h1 className={cx("title")}>Quản lý từ điển</h1>
                                <p className={cx("subtitle")}>
                                    Tổng cộng {mockWords.length} từ vựng
                                    {filteredWords.length !== mockWords.length &&
                                        ` · ${filteredWords.length} kết quả`}
                                </p>
                            </div>

                            <Button
                                primary
                                leftIcon={<FontAwesomeIcon icon={faPlus} />}
                                onClick={() => setShowAddForm((prev) => !prev)}
                            >
                                Thêm từ mới
                            </Button>
                        </div>
                    </div>

                    {/* Add Word Form */}
                    {showAddForm && (
                        <Card className={cx("formCard")}>
                            <h3 className={cx("formTitle")}>Thêm từ vựng mới</h3>
                            <div className={cx("formGrid")}>
                                <div className={cx("formField")}>
                                    <label htmlFor="word" className={cx("label")}>
                                        Từ tiếng Nhật
                                    </label>
                                    <Input
                                        id="word"
                                        placeholder="こんにちは"
                                        className={cx("input")}
                                    />
                                </div>
                                <div className={cx("formField")}>
                                    <label htmlFor="romaji" className={cx("label")}>
                                        Romaji
                                    </label>
                                    <Input
                                        id="romaji"
                                        placeholder="konnichiwa"
                                        className={cx("input")}
                                    />
                                </div>
                                <div className={cx("formField")}>
                                    <label htmlFor="meaning" className={cx("label")}>
                                        Nghĩa tiếng Việt
                                    </label>
                                    <Input
                                        id="meaning"
                                        placeholder="Xin chào"
                                        className={cx("input")}
                                    />
                                </div>
                                <div className={cx("formField")}>
                                    <label htmlFor="level" className={cx("label")}>
                                        Cấp độ JLPT
                                    </label>
                                    <select
                                        id="level"
                                        className={cx("select")}
                                        defaultValue="N5"
                                    >
                                        <option value="N5">N5</option>
                                        <option value="N4">N4</option>
                                        <option value="N3">N3</option>
                                        <option value="N2">N2</option>
                                        <option value="N1">N1</option>
                                    </select>
                                </div>
                                <div className={cx("formField")}>
                                    <label htmlFor="type" className={cx("label")}>
                                        Loại từ
                                    </label>
                                    <Input
                                        id="type"
                                        placeholder="Danh từ, Động từ..."
                                        className={cx("input")}
                                    />
                                </div>
                                <div className={cx("formField")}>
                                    <label htmlFor="examples" className={cx("label")}>
                                        Ví dụ
                                    </label>
                                    <textarea
                                        id="examples"
                                        placeholder="Câu ví dụ..."
                                        className={cx("textarea")}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className={cx("formActions")}>
                                <Button primary>Thêm từ</Button>
                                <Button
                                    outline
                                    onClick={() => setShowAddForm(false)}
                                >
                                    Hủy
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Search */}
                    <Card className={cx("filterCard")}>
                        <div className={cx("filterRow")}>
                            <div className={cx("searchWrapper")}>
                                <FontAwesomeIcon
                                    icon={faMagnifyingGlass}
                                    className={cx("searchIcon")}
                                />
                                <Input
                                    placeholder="Tìm kiếm từ vựng..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={cx("searchInput")}
                                />
                            </div>
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
                    </Card>

                    {/* Words List */}
                    <div className={cx("list")}>
                        {filteredWords.map((word) => (
                            <Card key={word.id} className={cx("wordCard")}>
                                <div className={cx("wordHeader")}>
                                    <div className={cx("wordInfo")}>
                                        <div className={cx("wordTitleRow")}>
                                            <h3 className={cx("wordTitle")}>{word.word}</h3>
                                            <span className={cx("badge", "badgeLevel")}>
                                                {word.level}
                                            </span>
                                            <span className={cx("badge")}>{word.type}</span>
                                        </div>
                                        <p className={cx("romaji")}>{word.romaji}</p>
                                        <p className={cx("meaning")}>{word.meaning}</p>
                                        {word.examples && word.examples.length > 0 && (
                                            <div className={cx("examplesBox")}>
                                                <p className={cx("examplesLabel")}>Ví dụ:</p>
                                                {word.examples.map((ex, idx) => (
                                                    <p key={idx} className={cx("exampleItem")}>
                                                        {ex}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className={cx("actions")}>
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

                        {filteredWords.length === 0 && (
                            <Card className={cx("emptyCard")}>
                                <p className={cx("emptyText")}>
                                    Không tìm thấy từ vựng nào phù hợp
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DictionaryAdmin;
