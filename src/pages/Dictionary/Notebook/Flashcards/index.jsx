import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./Flashcards.module.scss";
import notebookService from "~/services/notebookService";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faRotate,
  faChevronRight,
  faChevronLeft,
  faVolumeUp,
  faXmark,
  faBookOpen,
  faKeyboard,
  faShuffle,
  faCheck,
  faRepeat,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const wordCategories = [
  { value: "Tất cả", label: "Tất cả" },
  { value: "word", label: "Từ vựng" },
  { value: "kanji", label: "Kanji" },
  { value: "grammar", label: "Ngữ pháp" },
  { value: "other", label: "Khác" },
];

const categoryLabel = (value) =>
  wordCategories.find((c) => c.value === value)?.label || value;

export default function Flashcards() {
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [searchParams] = useSearchParams();
  const { notebookId: notebookIdFromPath } = useParams();
  const navigate = useNavigate();

  const filterRef = useRef(null);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    fetchNotebooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedNotebook) {
      fetchWords(selectedNotebook);
    }
  }, [selectedNotebook]);

  // Filter cards theo category
  useEffect(() => {
    if (selectedCategory === "Tất cả") {
      setFilteredCards(allCards);
    } else {
      setFilteredCards(
        allCards.filter((card) => card.type === selectedCategory)
      );
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownIds(new Set());
  }, [selectedCategory, allCards]);

  // Click outside để đóng filter dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    };
    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showFilter]);

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const data = await notebookService.getNotebooks();
      setNotebooks(data);

      if (data && data.length > 0) {
        const idCandidate =
          notebookIdFromPath || searchParams.get("id") || null;
        const target = idCandidate && data.find((n) => n._id === idCandidate);
        setSelectedNotebook(target ? target._id : data[0]._id);
      }

      setError(null);
    } catch (err) {
      console.error("Failed to fetch notebooks:", err);
      setError("Không thể tải danh sách sổ tay");
    } finally {
      setLoading(false);
    }
  };

  const fetchWords = async (notebookId) => {
    try {
      setLoading(true);
      const response = await notebookService.getWord(notebookId);
      const words = response.data || [];
      setAllCards(words);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch words:", err);
      setError("Không thể tải danh sách từ");
      setAllCards([]);
    } finally {
      setLoading(false);
    }
  };

  const total = filteredCards.length;
  const currentCard = filteredCards[currentIndex] ?? null;
  const progress = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;
  const knownCount = knownIds.size;
  const currentNotebookName =
    notebooks.find((n) => n._id === selectedNotebook)?.name || "";

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, total]);

  const flipCard = useCallback(() => setIsFlipped((f) => !f), []);

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownIds(new Set());
  };

  const toggleKnown = useCallback((id) => {
    if (!id) return;
    setKnownIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const shuffleCards = () => {
    const arr = [...filteredCards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setFilteredCards(arr);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const playAudio = (text) => {
    if (!text) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return;
    }
    alert(`Phát âm: ${text}`);
  };

  const handleNotebookChange = (e) => {
    const newId = e.target.value;
    setSelectedNotebook(newId);
    navigate(`/dictionary/notebook/${newId}/flashcards`, { replace: true });
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownIds(new Set());
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT")
        return;
      if (e.code === "Space") {
        e.preventDefault();
        flipCard();
      } else if (e.code === "ArrowRight") {
        goNext();
      } else if (e.code === "ArrowLeft") {
        goPrev();
      } else if (e.code === "KeyK") {
        if (currentCard) toggleKnown(currentCard._id || currentCard.id);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flipCard, goNext, goPrev, toggleKnown, currentCard]);

  const backToNotebookHref = selectedNotebook
    ? `/dictionary/notebook/${selectedNotebook}`
    : "/dictionary/notebook";

  // ============ Empty: chưa có sổ tay nào ============
  if (!loading && notebooks.length === 0) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <button
              type="button"
              onClick={() => navigate(backToNotebookHref)}
              className={cx("back-link")}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Quay lại sổ tay</span>
            </button>

            <div className={cx("hero")}>
              <div className={cx("hero-content")}>
                <div className={cx("hero-badge")}>
                  <FontAwesomeIcon icon={faBookOpen} />
                  <span>Flashcard</span>
                </div>
                <h1 className={cx("hero-title")}>Luyện tập Flashcard</h1>
                <p className={cx("hero-subtitle")}>
                  Học từ vựng hiệu quả với phương pháp lặp lại có chủ đích.
                </p>
              </div>
            </div>

            <div className={cx("empty-state")}>
              <div className={cx("empty-icon")}>
                <FontAwesomeIcon icon={faBookOpen} />
              </div>
              <h3 className={cx("empty-title")}>Chưa có sổ tay nào</h3>
              <p className={cx("empty-desc")}>
                Vui lòng tạo sổ tay và thêm từ trước khi luyện tập
              </p>
              <button
                className={cx("btn-primary")}
                onClick={() => navigate("/dictionary/notebook")}
              >
                Đến sổ tay
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {error && (
            <div className={cx("error-banner")}>
              <span className={cx("error-dot")}></span>
              <p>{error}</p>
              <button onClick={() => setError(null)} aria-label="Đóng">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate(backToNotebookHref)}
            className={cx("back-link")}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Quay lại sổ tay</span>
          </button>

          {/* Hero */}
          <div className={cx("hero")}>
            <div className={cx("hero-content")}>
              <div className={cx("hero-badge")}>
                <FontAwesomeIcon icon={faBookOpen} />
                <span>Flashcard</span>
              </div>
              <h1 className={cx("hero-title")}>Luyện tập Flashcard</h1>
              <p className={cx("hero-subtitle")}>
                {currentNotebookName && (
                  <>
                    Sổ tay <strong>"{currentNotebookName}"</strong> •{" "}
                  </>
                )}
                {total > 0
                  ? `${total} thẻ${
                      selectedCategory !== "Tất cả"
                        ? ` thuộc ${categoryLabel(selectedCategory)}`
                        : ""
                    }`
                  : "Không có thẻ nào"}
              </p>
            </div>
            <div className={cx("hero-stats")}>
              <div className={cx("stat-item")}>
                <div className={cx("stat-value")}>
                  {total > 0 ? Math.min(currentIndex + 1, total) : 0}
                  <span className={cx("stat-divider")}>/</span>
                  {total}
                </div>
                <div className={cx("stat-label")}>Thẻ hiện tại</div>
              </div>
              <div className={cx("stat-item")}>
                <div className={cx("stat-value")}>{knownCount}</div>
                <div className={cx("stat-label")}>Đã thuộc</div>
              </div>
              <div className={cx("stat-item")}>
                <div className={cx("stat-value")}>{progress}%</div>
                <div className={cx("stat-label")}>Tiến độ</div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className={cx("toolbar")}>
            <div className={cx("control-group")}>
              <label className={cx("control-label")}>Sổ tay:</label>
              <select
                className={cx("select")}
                value={selectedNotebook || ""}
                onChange={handleNotebookChange}
                disabled={loading}
              >
                {notebooks.map((notebook) => (
                  <option key={notebook._id} value={notebook._id}>
                    {notebook.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={cx("control-group", "filter-group")}
              ref={filterRef}
            >
              <button
                className={cx("filter-btn")}
                onClick={() => setShowFilter((v) => !v)}
              >
                <span>{categoryLabel(selectedCategory)}</span>
                <span className={cx("filter-count")}>
                  {selectedCategory === "Tất cả"
                    ? allCards.length
                    : allCards.filter((c) => c.type === selectedCategory).length}
                </span>
              </button>
              {showFilter && (
                <div className={cx("filter-dropdown")}>
                  {wordCategories.map((c) => {
                    const count =
                      c.value === "Tất cả"
                        ? allCards.length
                        : allCards.filter((card) => card.type === c.value)
                            .length;
                    return (
                      <button
                        key={c.value}
                        className={cx("filter-item", {
                          active: selectedCategory === c.value,
                        })}
                        onClick={() => {
                          setSelectedCategory(c.value);
                          setShowFilter(false);
                        }}
                      >
                        <span>{c.label}</span>
                        <span className={cx("filter-item-count")}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={cx("toolbar-spacer")} />

            <button
              className={cx("icon-action")}
              onClick={shuffleCards}
              disabled={total === 0}
              title="Trộn thẻ"
              aria-label="Trộn thẻ"
            >
              <FontAwesomeIcon icon={faShuffle} />
            </button>
            <button
              className={cx("icon-action")}
              onClick={() => setShowShortcuts(true)}
              title="Phím tắt"
              aria-label="Phím tắt"
            >
              <FontAwesomeIcon icon={faKeyboard} />
            </button>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className={cx("progress-bar")}>
              <div
                className={cx("progress-fill")}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className={cx("flashcard-area")}>
              <div className={cx("skeleton-card")}>
                <div className={cx("skeleton-shimmer")} />
              </div>
            </div>
          )}

          {!loading && (
            <div className={cx("flashcard-area")}>
              {currentCard ? (
                <>
                  <div
                    className={cx("flip-stage", { flipped: isFlipped })}
                    onClick={flipCard}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={cx("flip-inner")}>
                      {/* FRONT */}
                      <div className={cx("flip-face", "flip-front")}>
                        <div className={cx("card-top")}>
                          <span
                            className={cx(
                              "card-category",
                              `cat-${currentCard.type || "word"}`
                            )}
                          >
                            {categoryLabel(currentCard.type || "word")}
                          </span>
                          <button
                            className={cx("audio-btn")}
                            onClick={(e) => {
                              e.stopPropagation();
                              playAudio(
                                currentCard.phonetic || currentCard.name
                              );
                            }}
                            aria-label="Phát âm"
                          >
                            <FontAwesomeIcon icon={faVolumeUp} />
                          </button>
                        </div>

                        <div className={cx("card-center")}>
                          <h2 className={cx("card-kanji")}>
                            {currentCard.name}
                          </h2>
                        </div>

                        <div className={cx("card-bottom")}>
                          <span className={cx("flip-hint")}>
                            Nhấn hoặc <kbd>Space</kbd> để xem nghĩa
                          </span>
                        </div>
                      </div>

                      {/* BACK */}
                      <div className={cx("flip-face", "flip-back")}>
                        <div className={cx("card-top")}>
                          <span
                            className={cx(
                              "card-category",
                              `cat-${currentCard.type || "word"}`
                            )}
                          >
                            {categoryLabel(currentCard.type || "word")}
                          </span>
                          <button
                            className={cx("audio-btn")}
                            onClick={(e) => {
                              e.stopPropagation();
                              playAudio(
                                currentCard.phonetic || currentCard.name
                              );
                            }}
                            aria-label="Phát âm"
                          >
                            <FontAwesomeIcon icon={faVolumeUp} />
                          </button>
                        </div>

                        <div className={cx("card-center")}>
                          {currentCard.phonetic && (
                            <p className={cx("card-hira")}>
                              {currentCard.phonetic}
                            </p>
                          )}
                          <p className={cx("card-meaning")}>
                            {currentCard.mean}
                          </p>
                          {currentCard.notes && (
                            <p className={cx("card-note")}>
                              <strong>Ghi chú:</strong> {currentCard.notes}
                            </p>
                          )}
                        </div>

                        <div className={cx("card-bottom")}>
                          <span className={cx("flip-hint")}>
                            Nhấn hoặc <kbd>Space</kbd> để quay lại
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card position indicator */}
                  {total > 1 && total <= 30 && (
                    <div className={cx("dots")}>
                      {filteredCards.map((c, i) => (
                        <button
                          key={c._id || c.id || i}
                          className={cx("dot", {
                            active: i === currentIndex,
                            known: knownIds.has(c._id || c.id),
                          })}
                          onClick={() => {
                            setCurrentIndex(i);
                            setIsFlipped(false);
                          }}
                          aria-label={`Tới thẻ ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className={cx("actions")}>
                    <button
                      className={cx("ghost-btn")}
                      onClick={handleReset}
                      title="Bắt đầu lại"
                      aria-label="Bắt đầu lại"
                    >
                      <FontAwesomeIcon icon={faRotate} />
                    </button>

                    <button
                      className={cx("nav-btn")}
                      onClick={goPrev}
                      disabled={currentIndex === 0}
                      aria-label="Thẻ trước"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                      <span>Trước</span>
                    </button>

                    <button
                      className={cx("known-btn", {
                        marked: knownIds.has(
                          currentCard._id || currentCard.id
                        ),
                      })}
                      onClick={() =>
                        toggleKnown(currentCard._id || currentCard.id)
                      }
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      <span>
                        {knownIds.has(currentCard._id || currentCard.id)
                          ? "Đã thuộc"
                          : "Thuộc"}
                      </span>
                    </button>

                    <button
                      className={cx("nav-btn", "primary")}
                      onClick={goNext}
                      disabled={currentIndex >= total - 1}
                      aria-label="Thẻ tiếp theo"
                    >
                      <span>Tiếp theo</span>
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                </>
              ) : (
                <div className={cx("empty-state")}>
                  <div className={cx("empty-icon")}>
                    <FontAwesomeIcon
                      icon={total === 0 ? faBookOpen : faRepeat}
                    />
                  </div>
                  <h3 className={cx("empty-title")}>
                    {total === 0 ? "Chưa có thẻ nào" : "Hoàn thành!"}
                  </h3>
                  <p className={cx("empty-desc")}>
                    {total === 0
                      ? selectedCategory === "Tất cả"
                        ? "Sổ tay này chưa có từ nào. Hãy thêm từ để bắt đầu luyện tập!"
                        : `Không có từ nào thuộc loại "${categoryLabel(
                            selectedCategory
                          )}"`
                      : `Bạn đã hoàn thành ${total} thẻ. Đã thuộc ${knownCount}/${total}.`}
                  </p>
                  {total === 0 ? (
                    <button
                      className={cx("btn-primary")}
                      onClick={() => navigate(backToNotebookHref)}
                    >
                      Quay lại sổ tay
                    </button>
                  ) : (
                    <button
                      className={cx("btn-primary")}
                      onClick={handleReset}
                    >
                      <FontAwesomeIcon icon={faRotate} />
                      <span>Luyện lại</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Keyboard shortcuts modal */}
          {showShortcuts && (
            <div
              className={cx("modal-overlay")}
              onClick={() => setShowShortcuts(false)}
            >
              <div
                className={cx("modal")}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={cx("modal-header")}>
                  <h3>Phím tắt</h3>
                  <button
                    className={cx("modal-close")}
                    onClick={() => setShowShortcuts(false)}
                    aria-label="Đóng"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
                <div className={cx("modal-body")}>
                  <ul className={cx("shortcut-list")}>
                    <li>
                      <kbd>Space</kbd>
                      <span>Lật thẻ</span>
                    </li>
                    <li>
                      <kbd>←</kbd>
                      <span>Thẻ trước</span>
                    </li>
                    <li>
                      <kbd>→</kbd>
                      <span>Thẻ tiếp theo</span>
                    </li>
                    <li>
                      <kbd>K</kbd>
                      <span>Đánh dấu đã thuộc</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
