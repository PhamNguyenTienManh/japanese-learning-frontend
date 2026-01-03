import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./Flashcards.module.scss";
import notebookService from "~/services/notebookService";

import Button from "~/components/Button";
import Card from "~/components/Card";
import Progress from "~/components/Progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faRotate,
  faChevronRight,
  faVolumeUp,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const wordCategories = ["Tất cả", "word", "kanji", "grammar"];

export default function Flashcards() {
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [showFilter, setShowFilter] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load notebooks khi component mount
  useEffect(() => {
    fetchNotebooks();
  }, []);

  // Load words khi chọn notebook
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
    // Reset về card đầu tiên khi filter
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(0);
  }, [selectedCategory, allCards]);

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const data = await notebookService.getNotebooks();
      setNotebooks(data);

      // Auto select first notebook if available
      if (data && data.length > 0) {
        setSelectedNotebook(data[0]._id);
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

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
      setCompleted((c) => c + 1);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(0);
  };

  const playAudio = (text) => {
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
    setSelectedNotebook(e.target.value);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(0);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setShowFilter(false);
  };

  const ErrorMessage = () => {
    if (!error) return null;
    return (
      <div className={cx("error-message")}>
        <p>{error}</p>
        <button onClick={() => setError(null)}>✕</button>
      </div>
    );
  };

  // Nếu chưa có notebook nào
  if (!loading && notebooks.length === 0) {
    return (
      <div className={cx("root")}>
        <div className={cx("container")}>
          <div className={cx("header")}>
            <Button
              to="/dictionary/notebook"
              text
              className={"back-link"}
              leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}
            >
              <span className={cx("back-text")}>Quay lại sổ tay</span>
            </Button>
            <h1 className={cx("title")}>Luyện tập Flashcard</h1>
          </div>

          <Card className={cx("empty")}>
            <h2 className={cx("empty-title")}>Chưa có sổ tay nào</h2>
            <p className={cx("empty-sub")}>
              Vui lòng tạo sổ tay và thêm từ trước khi luyện tập
            </p>
            <Button to="/dictionary/notebook" className={cx("restart-btn")}>
              Đến sổ tay
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("root")}>
      <div className={cx("container")}>
        <ErrorMessage />

        {/* Header */}
        <div className={cx("header")}>
          <Button
            to="/dictionary/notebook"
            back
            leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}
          >
            Quay lại sổ tay
          </Button>

          <h1 className={cx("title")}>Luyện tập Flashcard</h1>
          <p className={cx("subtitle")}>
            {total > 0
              ? `Thẻ ${Math.min(currentIndex + 1, total)} / ${total}`
              : "Không có thẻ nào"}
          </p>
        </div>

        {/* Notebook & Filter Selection */}
        <div className={cx("controls")}>
          <div className={cx("control-group")}>
            <label className={cx("control-label")}>Chọn sổ tay:</label>
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

          <div className={cx("control-group")}>
            <Button
              outline
              onClick={() => setShowFilter(!showFilter)}
              leftIcon={<FontAwesomeIcon icon={faFilter} />}
              className={cx("filter-btn")}
            >
              {selectedCategory}
            </Button>

            {showFilter && (
              <Card className={cx("filter-dropdown")}>
                {wordCategories.map((type) => (
                  <button
                    key={type}
                    className={cx("filter-item", {
                      active: selectedCategory === type,
                    })}
                    onClick={() => handleCategoryChange(type)}
                  >
                    {type}
                    {type === "Tất cả"
                      ? ` (${allCards.length})`
                      : ` (${allCards.filter((c) => c.type === type).length})`}
                  </button>
                ))}
              </Card>
            )}
          </div>
        </div>

        {loading && (
          <div className={cx("loading")}>
            <p>Đang tải...</p>
          </div>
        )}

        {!loading && (
          <>
            {total > 0 && (
              <div className={cx("progress-wrap")}>
                <Progress value={progress} className={cx("progress")} />
              </div>
            )}

            <div className={cx("flashcard-area")}>
              {currentCard ? (
                <>
                  <Card
                    className={cx("card", { flipped: isFlipped })}
                    onClick={() => setIsFlipped((f) => !f)}
                  >
                    {!isFlipped ? (
                      <div className={cx("front")}>
                        <div className={cx("category-badge")}>
                          {currentCard.type || "word"}
                        </div>

                        <div className={cx("front-top")}>
                          <h2 className={cx("kanji")}>{currentCard.name}</h2>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              playAudio(currentCard.phonetic || currentCard.mean);
                            }}
                            className={cx("audio-btn")}
                          >
                            <FontAwesomeIcon icon={faVolumeUp} />
                          </Button>
                        </div>

                        <p className={cx("hint")}>Nhấn để xem nghĩa</p>
                      </div>
                    ) : (
                      <div className={cx("back")}>
                        <p className={cx("meaning")}>{currentCard.mean}</p>

                        <div className={cx("meta")}>
                          <p className={cx("meta-hira")}>{currentCard.phonetic}</p>
                        </div>
                        <p className={cx("hint")}>Nhấn để quay lại</p>
                        {currentCard.notes && (
                          <p className={cx("note")}>
                            <strong>Ghi chú:</strong> {currentCard.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </Card>

                  {/* Actions */}
                  <div className={cx("actions")}>
                    <Button outline onClick={handleReset} className={"orange"}>
                      <FontAwesomeIcon
                        icon={faRotate}
                        className={cx("icon-left")}
                      />
                      Bắt đầu lại
                    </Button>

                    <Button
                      primary
                      onClick={handleNext}
                      disabled={currentIndex >= total - 1}
                    >
                      Tiếp theo
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className={cx("icon-right")}
                      />
                    </Button>
                  </div>
                </>
              ) : (
                <Card className={cx("empty")}>
                  <h2 className={cx("empty-title")}>
                    {total === 0 ? "Chưa có thẻ nào" : "Hoàn thành!"}
                  </h2>
                  <p className={cx("empty-sub")}>
                    {total === 0
                      ? selectedCategory === "Tất cả"
                        ? "Sổ tay này chưa có từ nào. Hãy thêm từ để bắt đầu luyện tập!"
                        : `Không có từ nào thuộc loại "${selectedCategory}"`
                      : `Bạn đã hoàn thành ${total} thẻ`}
                  </p>
                  {total === 0 ? (
                    <Button
                      to="/dictionary/notebook"
                      className={cx("restart-btn")}
                    >
                      Quay lại sổ tay
                    </Button>
                  ) : (
                    <Button onClick={handleReset} className={cx("restart-btn")}>
                      <FontAwesomeIcon
                        icon={faRotate}
                        className={cx("icon-left")}
                      />
                      Luyện lại
                    </Button>
                  )}
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
