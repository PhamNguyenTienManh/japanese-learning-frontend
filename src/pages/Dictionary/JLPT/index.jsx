import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faBolt,
    faUsers,
    faFileLines,
    faPlay,
    faShuffle,
    faPlus,
    faVolumeHigh,
    faDownload,
    faChevronLeft,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import Button from "~/components/Button";
import styles from "./JLPT.module.scss";
import Card from "~/components/Card";
import { getJlptWords, getJlptKanji, getJlptGrammar } from "~/services/jlptService";
import notebookService from "~/services/notebookService";
import AuthRequiredModal from "~/components/AuthRequiredModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "~/context/AuthContext";
import handlePlayAudio from "~/services/handlePlayAudio";


const cx = classNames.bind(styles);

const vocabularyTypes = ["Từ vựng", "Ngữ pháp", "Hán tự"];
const jlptLevels = ["N5", "N4", "N3", "N2", "N1"];

const initialDisplayOptions = {
    "Từ vựng": [
        { label: "Từ vựng", checked: true },
        { label: "Phiên âm", checked: true },
        { label: "Nghĩa", checked: true },
    ],
    "Ngữ pháp": [
        { label: "Từ vựng", checked: true },
        { label: "Nghĩa", checked: true },
    ],
    "Hán tự": [
        { label: "Từ vựng", checked: true },
        { label: "Nghĩa", checked: true },
    ],
};


function JLPT() {
    const [selectedType, setSelectedType] = useState("Từ vựng");
    const [selectedLevel, setSelectedLevel] = useState("N5");
    const [displaySettings, setDisplaySettings] = useState(initialDisplayOptions);
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notebooks, setNotebooks] = useState([]);
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    // Thêm từ vựng, ngữ pháp vào Notebook
    const [showModal, setShowModal] = useState(false);
    const [selectedWord, setSelectedWord] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchNotebooks();
    }, []);




    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingHref, setPendingHref] = useState("");

    const handleFlashCardClick = (href) => {
        if (!isLoggedIn) {
            setPendingHref(href);        // lưu lại link để chuyển sau khi login
            setShowAuthModal(true);      // mở modal yêu cầu login
            return;
        }

        // Nếu đã login → điều hướng bằng window.location hoặc Button của bạn
        window.location.href = "/jlpt/" + href;
    };
    // Fetch danh sách notebooks
    const fetchNotebooks = async () => {
        try {
            const data = await notebookService.getNotebooks();
            setNotebooks(data);
        } catch (err) {
            console.log('Không thể tải danh sách sổ tay');
        }
    };

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = "hidden"; // khóa scroll
        } else {
            document.body.style.overflow = "auto"; // mở lại
        }

        return () => {
            document.body.style.overflow = "auto"; // cleanup
        };
    }, [showModal]);

    // Auto hide toast after 3 seconds
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ show: false, message: '', type: '' });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);


    const itemsPerPage = 9;

    // Tạo link flashcard động với type và level hiện tại
    const getFlashcardLink = () => {
        const typeParam = selectedType === "Từ vựng" ? "word" :
            selectedType === "Ngữ pháp" ? "grammar" : "kanji";
        return `flashcards?type=${typeParam}&level=${selectedLevel}&source=jlpt`;
    };

    const handleAddWord = async (newWord, type, selectedNotebook) => {
        try {
            setLoading(true);
            let wordData;
            if (type === "Từ vựng") {
                wordData = {
                    name: newWord.word,
                    phonetic: newWord.phonetic,
                    mean: newWord.meanings,
                    notes: "",
                    type: "word",
                };
            }
            else if (type === "Ngữ pháp") {
                wordData = {
                    name: newWord.title,
                    mean: newWord.mean,
                    notes: "",
                    type: "grammar",
                }
            } else {
                wordData = {
                    name: newWord.kanji,
                    phonetic: newWord.reading,
                    mean: newWord.mean,
                    notes: "",
                    type: "kanji",
                }
            }

            const response = await notebookService.addWord(
                selectedNotebook._id,
                wordData
            );
            if (response.success === true) {
                setToast({
                    show: true,
                    message: 'Đã thêm vào sổ tay thành công!',
                    type: 'success'
                });
            } else {
                setToast({
                    show: true,
                    message: response.message,
                    type: 'error'
                });
            }

            // Show success toast
        } catch (err) {
            console.error('Failed to add word:', err);
            // Show error toast
            setToast({
                show: true,
                message: err.message || 'Không thể thêm từ. Vui lòng thử lại.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const jlptFeatures = [
        {
            icon: faBookOpen,
            label: "FlashCard",
            href: getFlashcardLink(),
            requireLogin: true,
        },
        {
            icon: faBolt,
            label: "Quizz",
            href: "/quizz",
        },
        {
            icon: faUsers,
            label: "Luyện nói, viết",
            href: "/speaking",
        },
        {
            icon: faFileLines,
            label: "Mini Test",
            href: "/mini-test",
        },
    ];

    useEffect(() => {
        fetchData();
    }, [selectedType, selectedLevel, currentPage]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            let response;

            if (selectedType === "Từ vựng") {
                response = await getJlptWords(currentPage, itemsPerPage, selectedLevel);
            } else if (selectedType === "Ngữ pháp") {
                response = await getJlptGrammar(currentPage, itemsPerPage, selectedLevel);
            } else if (selectedType === "Hán tự") {
                response = await getJlptKanji(currentPage, itemsPerPage, selectedLevel);
            }

            if (response?.success) {
                setData(response.data.data || []);
                setTotalPages(response.data.totalPages || 0);
            }
        } catch (err) {
            setError(err.message);
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDisplayOption = (label) => {
        setDisplaySettings((prev) => ({
            ...prev,
            [selectedType]: prev[selectedType].map((opt) =>
                opt.label === label ? { ...opt, checked: !opt.checked } : opt
            ),
        }));
    };

    const isShown = (label) => {
        const options = displaySettings[selectedType];
        return options?.find((o) => o.label === label)?.checked;
    };

    const currentDisplayOptions = displaySettings[selectedType] || [];

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTypeChange = (type) => {
        setSelectedType(type);
        setCurrentPage(1);
    };

    const handleLevelChange = (level) => {
        setSelectedLevel(level);
        setCurrentPage(1);
    };

    const getPageNumbers = () => {
        const pages = [];

        if (totalPages <= 6) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (currentPage <= 3) {
                for (let i = 2; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const renderCard = (item, index) => {
        if (selectedType === "Từ vựng") {
            return (
                <Card key={index}>
                    <div className={cx("vocab-inner")}>
                        <div className={cx("vocab-header")}>
                            <div className={cx("vocab-main")}>
                                <Button
                                    outline
                                    className={"no-margin"}
                                    leftIcon={<FontAwesomeIcon icon={faVolumeHigh} />}
                                    onClick={() => handlePlayAudio(item.phonetic)}
                                ></Button>
                                {isShown("Từ vựng") && (
                                    <span className={cx("kanji")}>{item.word}</span>
                                )}
                            </div>
                            <Button
                                outline
                                className={"no-margin"}
                                leftIcon={<FontAwesomeIcon icon={faPlus} />}
                                onClick={() => {
                                    setSelectedWord(item);
                                    setShowModal(true);
                                }}
                            ></Button>
                        </div>
                        {isShown("Phiên âm") && (
                            <div className={cx("hiragana")}>{item.phonetic}</div>
                        )}
                        {isShown("Nghĩa") && (
                            <div className={cx("meaning-block")}>
                                <p className={cx("meaning")}>{item.meanings}</p>
                            </div>
                        )}
                    </div>
                </Card>
            );
        } else if (selectedType === "Ngữ pháp") {
            return (
                <div key={item._id} className={cx("grammar-item")}>
                    <div className={cx("grammar-content")}>
                        {isShown("Từ vựng") && (
                            <div className={cx("grammar-pattern")}>{item.title}</div>
                        )}
                        {isShown("Nghĩa") && (
                            <div className={cx("grammar-meaning")}>{item.mean}</div>
                        )}
                    </div>
                    <Button
                        outline
                        className={"no-margin"}
                        leftIcon={<FontAwesomeIcon icon={faPlus} />}
                        onClick={() => {
                            setSelectedWord(item);
                            setShowModal(true);
                        }}
                    ></Button>
                </div>
            );
        } else if (selectedType === "Hán tự") {
            return (
                <div
                    key={item._id}
                    className={cx("kanji-item")}
                    onClick={() => {
                        setSelectedWord(item);
                        setShowModal(true);
                    }}
                >
                    {isShown("Từ vựng") && (
                        <div className={cx("kanji-char")}>{item.kanji}</div>
                    )}
                    {isShown("Nghĩa") && (
                        <div className={cx("kanji-meaning")}>{item.mean}</div>
                    )}
                </div>
            );
        }
    };

    return (
        <div className={cx("wrapper")}>
            <div className={cx("inner")}>
                <div className={cx("header")}>
                    <h1 className={cx("title")}>JLPT</h1>
                    <p className={cx("subtitle")}>
                        Đang xem: {selectedType} - Cấp độ {selectedLevel}
                    </p>
                </div>

                <div className={cx("features")}>
                    {jlptFeatures.map((feature) => (
                        <Button
                            key={feature.label}
                            primary
                            leftIcon={<FontAwesomeIcon icon={feature.icon} />}
                            {...(!feature.requireLogin
                                ? { to: feature.href }                 // 👉 Các feature bình thường vẫn dùng to
                                : { onClick: () => handleFlashCardClick(feature.href) }  // 👉 FlashCard thì kiểm tra login
                            )}
                        >
                            {feature.label}
                        </Button>
                    ))}
                </div>

                <div className={cx("layout")}>
                    <aside className={cx("sidebar")}>
                        <Card>
                            <div className={cx("filter-block")}>
                                <h3 className={cx("filter-title")}>Chọn loại từ</h3>
                                <div className={cx("filter-options")}>
                                    {vocabularyTypes.map((type) => (
                                        <label
                                            key={type}
                                            className={cx("filter-option", {
                                                active: selectedType === type,
                                            })}
                                        >
                                            <input
                                                type="radio"
                                                name="vocab-type"
                                                value={type}
                                                checked={selectedType === type}
                                                onChange={(e) => handleTypeChange(e.target.value)}
                                                className={cx("radio")}
                                            />
                                            <span className={cx("filter-label")}>{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className={cx("filter-block")}>
                                <h3 className={cx("filter-title")}>Chọn cấp độ</h3>
                                <div className={cx("filter-options")}>
                                    {jlptLevels.map((level) => (
                                        <label
                                            key={level}
                                            className={cx("filter-option", {
                                                active: selectedLevel === level,
                                            })}
                                        >
                                            <input
                                                type="radio"
                                                name="level"
                                                value={level}
                                                checked={selectedLevel === level}
                                                onChange={(e) => handleLevelChange(e.target.value)}
                                                className={cx("radio")}
                                            />
                                            <span className={cx("filter-label")}>{level}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </aside>

                    <div className={cx("content")}>
                        <Card className={cx("display-card")}>
                            <div className={cx("display-row")}>
                                <div className={cx("display-options")}>
                                    {currentDisplayOptions.map((option) => (
                                        <label
                                            key={option.label}
                                            className={cx("display-option")}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={option.checked}
                                                onChange={() =>
                                                    handleToggleDisplayOption(option.label)
                                                }
                                                className={cx("checkbox")}
                                            />
                                            <span className={cx("display-label")}>
                                                {option.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                <div className={cx("display-actions")}>
                                    <Button
                                        outline
                                        className={"no-margin"}
                                        leftIcon={<FontAwesomeIcon icon={faDownload} />}
                                    ></Button>
                                    <Button
                                        outline
                                        className={"no-margin"}
                                        leftIcon={<FontAwesomeIcon icon={faPlay} />}
                                    ></Button>
                                    <Button
                                        outline
                                        className={"no-margin"}
                                        leftIcon={<FontAwesomeIcon icon={faShuffle} />}
                                    ></Button>
                                </div>
                            </div>
                        </Card>

                        {loading && (
                            <div className={cx("loading")}>Đang tải dữ liệu...</div>
                        )}

                        {error && (
                            <div className={cx("error")}>Lỗi: {error}</div>
                        )}

                        {!loading && !error && (
                            <div className={cx("vocab-grid", {
                                "kanji-grid": selectedType === "Hán tự"
                            })}>
                                {data.length > 0 ? (
                                    data.map((item, index) => renderCard(item, index))
                                ) : (
                                    <div className={cx("no-data")}>Không có dữ liệu</div>
                                )}
                            </div>
                        )}

                        {!loading && !error && totalPages > 1 && (
                            <div className={cx("pagination")}>
                                <button
                                    className={cx("pagination-btn", "pagination-arrow", {
                                        disabled: currentPage === 1,
                                    })}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>

                                {getPageNumbers().map((page, index) =>
                                    page === "..." ? (
                                        <span
                                            key={`ellipsis-${index}`}
                                            className={cx("pagination-ellipsis")}
                                        >
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={page}
                                            className={cx("pagination-btn", {
                                                active: currentPage === page,
                                            })}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}

                                <button
                                    className={cx("pagination-btn", "pagination-arrow", {
                                        disabled: currentPage === totalPages,
                                    })}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>


                {/* Hiển thị show modal */}
                {showModal && (
                    <div className={cx("modal-overlay")} onClick={() => setShowModal(false)}>
                        <div
                            className={cx("modal-container")}
                            onClick={(e) => e.stopPropagation()} // ngăn tắt modal khi click bên trong
                        >
                            <div className={cx("modal-header")}>
                                <h3>Thêm từ vào sổ tay</h3>
                                <button className={cx("close-btn")} onClick={() => setShowModal(false)}>×</button>
                            </div>

                            <div className={cx("notebook-list")}>
                                {notebooks.map((note) => (
                                    <div
                                        key={note._id}
                                        className={cx("notebook-item")}
                                        onClick={() => {
                                            console.log("Đã chọn:", selectedWord, selectedType, "👉 đưa vào:", note);
                                            handleAddWord(selectedWord, selectedType, note);
                                            setShowModal(false);
                                        }}
                                    >
                                        <h4>{note.name}</h4>
                                        <p>Ngày tạo: {new Date(note.createdAt).toLocaleDateString("vi-VN")}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

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
                    </div>
                )}

            </div>
        </div>
    );
}

export default JLPT;