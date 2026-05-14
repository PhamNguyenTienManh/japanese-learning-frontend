import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlay,
    faShuffle,
    faPlus,
    faVolumeHigh,
    faDownload,
    faChevronLeft,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./JLPT.module.scss";
import { getJlptWords, getJlptKanji, getJlptGrammar } from "~/services/jlptService";
import notebookService from "~/services/notebookService";
import AuthRequiredModal from "~/components/AuthRequiredModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "~/context/AuthContext";
import handlePlayAudio from "~/services/handlePlayAudio";
import PdfModal from "~/components/PdfModal/PdfModal";


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

const jlptTabs = [
    { icon: "🎴", label: "FlashCard", key: "flashcard", requireLogin: true },
    { icon: "⚡", label: "Quiz", key: "quizz", href: "/quizz" },
    { icon: "🗣️", label: "Luyện nói, viết", key: "speaking", href: "/speaking" },
    { icon: "📝", label: "Mini Test", key: "minitest", href: "/mini-test" },
];


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
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingHref, setPendingHref] = useState("");
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [pdfLoading, setPdfLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("flashcard");

    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [selectedWord, setSelectedWord] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchNotebooks();
    }, []);

    const getFlashcardLink = () => {
        const typeParam = selectedType === "Từ vựng" ? "word" :
            selectedType === "Ngữ pháp" ? "grammar" : "kanji";
        return `flashcards?type=${typeParam}&level=${selectedLevel}&source=jlpt`;
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab.key);
        if (tab.requireLogin) {
            const href = getFlashcardLink();
            if (!isLoggedIn) {
                setPendingHref(href);
                setShowAuthModal(true);
                return;
            }
            window.location.href = "/jlpt/" + href;
        } else if (tab.href) {
            navigate(tab.href);
        }
    };

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
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showModal]);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ show: false, message: '', type: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);


    const itemsPerPage = 9;

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
        } catch (err) {
            console.error('Failed to add word:', err);
            setToast({
                show: true,
                message: err.message || 'Không thể thêm từ. Vui lòng thử lại.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewPdf = async () => {
        if (selectedType === "Ngữ pháp") {
            setToast({
                show: true,
                message: 'Bạn không thể download file Ngữ pháp',
                type: 'error'
            });
            return;
        }

        try {
            setPdfLoading(true);
            setShowPdfModal(true);

            const typeParam =
                selectedType === "Từ vựng" ? "word" :
                    selectedType === "Hán tự" ? "kanji" :
                        "word";

            const url = `${process.env.REACT_APP_BASE_URL_API}/pdf/jlpt?page=${currentPage}&limit=9&level=${selectedLevel}&type=${typeParam}`;

            const response = await fetch(url);
            const blob = await response.blob();

            const pdfPreviewUrl = URL.createObjectURL(blob);
            setPdfUrl(pdfPreviewUrl);
        } catch (err) {
            console.error(err);
            setShowPdfModal(false);
            setToast({
                show: true,
                message: 'Không thể tải PDF. Vui lòng thử lại.',
                type: 'error'
            });
        } finally {
            setPdfLoading(false);
        }
    };

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
                <div key={index} className={cx("card")}>
                    <div className={cx("cardTop")}>
                        <button
                            type="button"
                            className={cx("speakerBtn")}
                            onClick={() => handlePlayAudio(item.phonetic)}
                            aria-label="Nghe phát âm"
                        >
                            <FontAwesomeIcon icon={faVolumeHigh} />
                        </button>
                        <button
                            type="button"
                            className={cx("addBtn")}
                            onClick={() => {
                                setSelectedWord(item);
                                setShowModal(true);
                            }}
                            aria-label="Thêm vào sổ tay"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    </div>
                    {isShown("Từ vựng") && (
                        <div className={cx("kanji")}>{item.word}</div>
                    )}
                    {isShown("Phiên âm") && (
                        <div className={cx("hiragana")}>{item.phonetic}</div>
                    )}
                    {isShown("Nghĩa") && (
                        <div className={cx("meaning")}>{item.meanings}</div>
                    )}
                </div>
            );
        } else if (selectedType === "Ngữ pháp") {
            return (
                <div key={item._id} className={cx("card", "grammarCard")}>
                    <div className={cx("grammarBody")}>
                        {isShown("Từ vựng") && (
                            <div className={cx("grammarPattern")}>{item.title}</div>
                        )}
                        {isShown("Nghĩa") && (
                            <div className={cx("grammarMeaning")}>{item.mean}</div>
                        )}
                    </div>
                    <button
                        type="button"
                        className={cx("addBtn")}
                        onClick={() => {
                            setSelectedWord(item);
                            setShowModal(true);
                        }}
                        aria-label="Thêm vào sổ tay"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                </div>
            );
        } else if (selectedType === "Hán tự") {
            return (
                <div
                    key={item._id}
                    className={cx("card", "kanjiCard")}
                    onClick={() => {
                        setSelectedWord(item);
                        setShowModal(true);
                    }}
                >
                    {isShown("Từ vựng") && (
                        <div className={cx("kanji")}>{item.kanji}</div>
                    )}
                    {isShown("Nghĩa") && (
                        <div className={cx("meaning")}>{item.mean}</div>
                    )}
                </div>
            );
        }
    };

    const gridClass = cx("grid", {
        kanjiGrid: selectedType === "Hán tự",
        grammarGrid: selectedType === "Ngữ pháp",
    });

    return (
        <div className={cx("wrapper")}>
            <div className={cx("blob1")} />
            <div className={cx("blob2")} />

            <div className={cx("inner")}>
                {/* Hero */}
                <div className={cx("hero")}>
                    <div className={cx("heroLeft")}>
                        <div className={cx("heroBadge")}>{selectedLevel}</div>
                        <div>
                            <h1 className={cx("title")}>Học JLPT</h1>
                            <div className={cx("subtitle")}>
                                <span className={cx("chip")}>{selectedType}</span>
                                <span className={cx("dot")}>·</span>
                                <span>Cấp độ {selectedLevel}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className={cx("tabs")}>
                    {jlptTabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            className={cx("tab", { tabActive: activeTab === tab.key })}
                            onClick={() => handleTabClick(tab)}
                        >
                            <span className={cx("tabIcon")}>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className={cx("layout")}>
                    <aside className={cx("sidebar")}>
                        <div className={cx("sideTitle")}>Loại từ</div>
                        <div className={cx("radioGroup")}>
                            {vocabularyTypes.map((type) => (
                                <label
                                    key={type}
                                    className={cx("radioRow", {
                                        radioActive: selectedType === type,
                                    })}
                                >
                                    <input
                                        type="radio"
                                        name="vocab-type"
                                        value={type}
                                        checked={selectedType === type}
                                        onChange={(e) => handleTypeChange(e.target.value)}
                                        className={cx("radioInput")}
                                    />
                                    <span className={cx("radioDot")} />
                                    <span>{type}</span>
                                </label>
                            ))}
                        </div>

                        <div className={cx("divider")} />

                        <div className={cx("sideTitle")}>Cấp độ</div>
                        <div className={cx("radioGroup")}>
                            {jlptLevels.map((level) => (
                                <label
                                    key={level}
                                    className={cx("radioRow", {
                                        radioActive: selectedLevel === level,
                                    })}
                                >
                                    <input
                                        type="radio"
                                        name="level"
                                        value={level}
                                        checked={selectedLevel === level}
                                        onChange={(e) => handleLevelChange(e.target.value)}
                                        className={cx("radioInput")}
                                    />
                                    <span className={cx("radioDot")} />
                                    <span>{level}</span>
                                </label>
                            ))}
                        </div>
                    </aside>

                    <div className={cx("content")}>
                        <div className={cx("toolbar")}>
                            <div className={cx("displayOptions")}>
                                {currentDisplayOptions.map((option) => (
                                    <label
                                        key={option.label}
                                        className={cx("displayOption", {
                                            displayOptionChecked: option.checked,
                                        })}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={option.checked}
                                            onChange={() =>
                                                handleToggleDisplayOption(option.label)
                                            }
                                            className={cx("checkbox")}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className={cx("iconBtns")}>
                                <button
                                    type="button"
                                    className={cx("iconBtn")}
                                    onClick={handlePreviewPdf}
                                    aria-label="Tải PDF"
                                >
                                    <FontAwesomeIcon icon={faDownload} />
                                </button>
                                <button
                                    type="button"
                                    className={cx("iconBtn")}
                                    aria-label="Phát"
                                >
                                    <FontAwesomeIcon icon={faPlay} />
                                </button>
                                <button
                                    type="button"
                                    className={cx("iconBtn", "shuffleBtn")}
                                    aria-label="Trộn"
                                >
                                    <FontAwesomeIcon icon={faShuffle} />
                                </button>
                            </div>
                        </div>

                        {loading && (
                            <div className={cx("loading")}>Đang tải dữ liệu...</div>
                        )}

                        {error && (
                            <div className={cx("error")}>Lỗi: {error}</div>
                        )}

                        {!loading && !error && (
                            <>
                                {data.length > 0 ? (
                                    <div className={gridClass}>
                                        {data.map((item, index) => renderCard(item, index))}
                                    </div>
                                ) : (
                                    <div className={cx("noData")}>Không có dữ liệu</div>
                                )}
                            </>
                        )}

                        {!loading && !error && totalPages > 1 && (
                            <div className={cx("pagination")}>
                                <button
                                    className={cx("pagBtn", {
                                        pagDisabled: currentPage === 1,
                                    })}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    aria-label="Trang trước"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>

                                {getPageNumbers().map((page, index) =>
                                    page === "..." ? (
                                        <span
                                            key={`ellipsis-${index}`}
                                            className={cx("pagEllipsis")}
                                        >
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={page}
                                            className={cx("pagBtn", {
                                                pagActive: currentPage === page,
                                            })}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}

                                <button
                                    className={cx("pagBtn", {
                                        pagDisabled: currentPage === totalPages,
                                    })}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    aria-label="Trang sau"
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal chọn sổ tay */}
                {showModal && (
                    <div className={cx("modal-overlay")} onClick={() => setShowModal(false)}>
                        <div
                            className={cx("modal-container")}
                            onClick={(e) => e.stopPropagation()}
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

                {/* Modal hiển thị bản xem trước file Pdf */}
                <PdfModal
                    show={showPdfModal}
                    onClose={() => {
                        setShowPdfModal(false);
                        setPdfUrl("");
                    }}
                    pdfUrl={pdfUrl}
                    loading={pdfLoading}
                />

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

                {/* Auth required modal */}
                <AuthRequiredModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    onConfirm={() => {
                        setShowAuthModal(false);
                        navigate("/login");
                    }}
                />
            </div>
        </div>
    );
}

export default JLPT;
