import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "../Notebook.module.scss";
import notebookService from "~/services/notebookService";

import Button from "~/components/Button";
import Input from "~/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVolumeHigh,
  faTrash,
  faArrowLeft,
  faPlus,
  faPenToSquare,
  faCheck,
  faTimes,
  faEllipsisVertical,
  faXmark,
  faBook,
  faBookOpen,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "~/context/AuthContext";

const cx = classNames.bind(styles);

const wordCategories = [
  { value: "word", label: "Từ vựng" },
  { value: "kanji", label: "Kanji" },
  { value: "grammar", label: "Ngữ pháp" },
  { value: "other", label: "Khác" },
];

const emptyWordForm = {
  name: "",
  phonetic: "",
  meaning: "",
  note: "",
  type: "word",
};

function NotebookDetail() {
  const { notebookId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [notebook, setNotebook] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingNotebook, setEditingNotebook] = useState(false);
  const [editingName, setEditingName] = useState("");

  const [showAddWord, setShowAddWord] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [newWord, setNewWord] = useState(emptyWordForm);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [openWordMenuId, setOpenWordMenuId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteWord, setConfirmDeleteWord] = useState(null);

  const menuRef = useRef(null);
  const wordMenuRef = useRef(null);

  // Load notebook info + words
  useEffect(() => {
    if (!isLoggedIn) {
      setError("Bạn cần đăng nhập để xem sổ tay");
      setLoading(false);
      return;
    }
    if (!notebookId) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const all = await notebookService.getNotebooks();
        if (cancelled) return;
        const target = (all || []).find((n) => n._id === notebookId);
        if (!target) {
          setError("Không tìm thấy sổ tay");
          setNotebook(null);
          setWords([]);
          return;
        }
        setNotebook(target);

        const res = await notebookService.getWord(notebookId);
        if (cancelled) return;
        setWords(res.data || []);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load notebook:", err);
          setError("Không thể tải sổ tay");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [notebookId, isLoggedIn]);

  // Close notebook dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuId]);

  // Close word dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wordMenuRef.current && !wordMenuRef.current.contains(e.target)) {
        setOpenWordMenuId(null);
      }
    };
    if (openWordMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openWordMenuId]);

  const refreshWords = async () => {
    try {
      const res = await notebookService.getWord(notebookId);
      setWords(res.data || []);
    } catch (err) {
      console.error("Failed to fetch words:", err);
      setError("Không thể tải danh sách từ");
    }
  };

  const startEditNotebook = () => {
    setOpenMenuId(null);
    setEditingNotebook(true);
    setEditingName(notebook?.name || "");
  };

  const cancelEditNotebook = () => {
    setEditingNotebook(false);
    setEditingName("");
  };

  const handleUpdateNotebook = async () => {
    if (!editingName.trim()) {
      setError("Tên sổ tay không được để trống");
      return;
    }
    try {
      setLoading(true);
      await notebookService.updateNotebook(notebookId, editingName.trim());
      setNotebook((prev) => ({ ...prev, name: editingName.trim() }));
      setEditingNotebook(false);
      setEditingName("");
      setError(null);
    } catch (err) {
      console.error("Failed to update notebook:", err);
      setError("Không thể cập nhật tên sổ tay. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const removeNotebook = async () => {
    try {
      setLoading(true);
      await notebookService.deleteNotebook(notebookId);
      setConfirmDelete(null);
      navigate("/dictionary/notebook", { replace: true });
    } catch (err) {
      console.error("Failed to delete notebook:", err);
      setError("Không thể xóa sổ tay. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const resetWordForm = () => {
    setNewWord(emptyWordForm);
    setEditingWord(null);
    setShowAddWord(false);
  };

  const startEditWord = (word) => {
    setOpenWordMenuId(null);
    setEditingWord(word);
    setNewWord({
      name: word.name || "",
      phonetic: word.phonetic || "",
      meaning: word.mean || "",
      note: word.notes || "",
      type: word.type || "word",
    });
    setShowAddWord(true);
  };

  const handleSubmitWord = async () => {
    if (!newWord.name.trim()) return;

    try {
      setLoading(true);
      const wordData = {
        name: newWord.name,
        phonetic: newWord.phonetic,
        mean: newWord.meaning,
        notes: newWord.note,
        type: newWord.type,
      };

      if (editingWord) {
        await notebookService.updateWord(
          editingWord._id || editingWord.id,
          wordData
        );
      } else {
        await notebookService.addWord(notebookId, wordData);
      }

      await refreshWords();
      resetWordForm();
      setError(null);
    } catch (err) {
      console.error("Failed to save word:", err);
      setError(
        editingWord
          ? "Không thể cập nhật từ. Vui lòng thử lại."
          : "Từ này đã có trong sổ tay"
      );
    } finally {
      setLoading(false);
    }
  };

  const removeWord = async (wordId) => {
    try {
      setLoading(true);
      await notebookService.deleteWord(notebookId, wordId);
      await refreshWords();
      setConfirmDeleteWord(null);
      setError(null);
    } catch (err) {
      console.error("Failed to delete word:", err);
      setError("Không thể xóa từ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Phát âm: ${text}`);
    }
  };

  const ErrorBanner = () => {
    if (!error) return null;
    return (
      <div className={cx("error-banner")}>
        <span className={cx("error-dot")}></span>
        <p>{error}</p>
        <button onClick={() => setError(null)} aria-label="Đóng">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    );
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          <ErrorBanner />

          <button
            type="button"
            onClick={() => navigate("/dictionary/notebook")}
            className={cx("back-link")}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faArrowLeft} className={cx("back-icon")} />
            <span>Quay lại danh sách</span>
          </button>

          {loading && !notebook && (
            <div className={cx("words-loading")}>Đang tải sổ tay...</div>
          )}

          {!loading && !notebook && (
            <div className={cx("empty-state")}>
              <div className={cx("empty-icon")}>
                <FontAwesomeIcon icon={faBook} />
              </div>
              <h3 className={cx("empty-title")}>Không tìm thấy sổ tay</h3>
              <p className={cx("empty-desc")}>
                Sổ tay có thể đã bị xóa hoặc bạn không có quyền truy cập.
              </p>
              <button
                className={cx("create-btn")}
                onClick={() => navigate("/dictionary/notebook")}
              >
                <span>Về danh sách</span>
              </button>
            </div>
          )}

          {notebook && (
            <>
              <div className={cx("detail-header")}>
                <div className={cx("detail-cover")}>
                  <FontAwesomeIcon icon={faBookOpen} />
                </div>
                <div className={cx("detail-info")}>
                  {editingNotebook ? (
                    <div className={cx("detail-edit")}>
                      <input
                        type="text"
                        className={cx("detail-edit-input")}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateNotebook();
                          if (e.key === "Escape") cancelEditNotebook();
                        }}
                      />
                      <button
                        className={cx("edit-btn", "confirm")}
                        onClick={handleUpdateNotebook}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        className={cx("edit-btn", "cancel")}
                        onClick={cancelEditNotebook}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ) : (
                    <div className={cx("detail-title-row")}>
                      <h1 className={cx("detail-title")}>{notebook.name}</h1>
                      <div
                        className={cx("menu-wrap")}
                        ref={openMenuId === notebook._id ? menuRef : null}
                      >
                        <button
                          className={cx("menu-trigger", "menu-trigger-dark")}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === notebook._id ? null : notebook._id
                            );
                          }}
                          aria-label="Mở menu"
                        >
                          <FontAwesomeIcon icon={faEllipsisVertical} />
                        </button>
                        {openMenuId === notebook._id && (
                          <div className={cx("menu-dropdown")}>
                            <button
                              className={cx("menu-item")}
                              onClick={startEditNotebook}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                              <span>Đổi tên</span>
                            </button>
                            <button
                              className={cx("menu-item", "danger")}
                              onClick={() => {
                                setOpenMenuId(null);
                                setConfirmDelete(notebook);
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              <span>Xóa sổ tay</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <p className={cx("detail-subtitle")}>
                    <span className={cx("badge-count")}>{words.length} từ</span>
                    {notebook.createdAt && (
                      <span className={cx("detail-date")}>
                        Tạo ngày{" "}
                        {new Date(notebook.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className={cx("detail-actions")}>
                <button
                  className={cx("create-btn")}
                  onClick={() => {
                    if (showAddWord) {
                      resetWordForm();
                    } else {
                      setEditingWord(null);
                      setNewWord(emptyWordForm);
                      setShowAddWord(true);
                    }
                  }}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Thêm từ mới</span>
                </button>
                <Button
                  outline
                  to={`/dictionary/notebook/${notebookId}/flashcards`}
                  className={"orange"}
                >
                  Luyện tập Flashcard
                </Button>
              </div>

              {showAddWord && (
                <div className={cx("add-card")}>
                  <div className={cx("add-card-header")}>
                    <h3>{editingWord ? "Chỉnh sửa từ" : "Thêm từ mới"}</h3>
                    <button
                      className={cx("modal-close")}
                      onClick={resetWordForm}
                      aria-label="Đóng"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                  <div className={cx("form-grid")}>
                    <div className={cx("field")}>
                      <label className={cx("label")}>Từ (Kanji)</label>
                      <Input
                        placeholder="VD: 勉強"
                        value={newWord.name}
                        onChange={(e) =>
                          setNewWord((p) => ({ ...p, name: e.target.value }))
                        }
                        disabled={loading}
                      />
                    </div>
                    <div className={cx("field")}>
                      <label className={cx("label")}>Hiragana</label>
                      <Input
                        placeholder="VD: べんきょう"
                        value={newWord.phonetic}
                        onChange={(e) =>
                          setNewWord((p) => ({
                            ...p,
                            phonetic: e.target.value,
                          }))
                        }
                        disabled={loading}
                      />
                    </div>
                    <div className={cx("field")}>
                      <label className={cx("label")}>Nghĩa</label>
                      <Input
                        placeholder="VD: học tập"
                        value={newWord.meaning}
                        onChange={(e) =>
                          setNewWord((p) => ({
                            ...p,
                            meaning: e.target.value,
                          }))
                        }
                        disabled={loading}
                      />
                    </div>
                    <div className={cx("field")}>
                      <label className={cx("label")}>Từ loại</label>
                      <select
                        className={cx("select")}
                        value={newWord.type}
                        onChange={(e) =>
                          setNewWord((p) => ({ ...p, type: e.target.value }))
                        }
                        disabled={loading}
                      >
                        {wordCategories.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={cx("field", "full")}>
                      <label className={cx("label")}>Ghi chú</label>
                      <Input
                        placeholder="Thêm ghi chú (không bắt buộc)..."
                        value={newWord.note}
                        onChange={(e) =>
                          setNewWord((p) => ({ ...p, note: e.target.value }))
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className={cx("form-actions")}>
                    <button
                      className={cx("btn-ghost")}
                      onClick={resetWordForm}
                      disabled={loading}
                    >
                      Hủy
                    </button>
                    <button
                      className={cx("btn-primary")}
                      onClick={handleSubmitWord}
                      disabled={!newWord.name.trim() || loading}
                    >
                      {loading
                        ? editingWord
                          ? "Đang lưu..."
                          : "Đang thêm..."
                        : editingWord
                        ? "Lưu thay đổi"
                        : "Thêm từ"}
                    </button>
                  </div>
                </div>
              )}

              <div className={cx("words-list")}>
                {loading && words.length === 0 && (
                  <div className={cx("words-loading")}>Đang tải từ...</div>
                )}

                {!loading && words.length === 0 && (
                  <div className={cx("empty-state")}>
                    <div className={cx("empty-icon")}>
                      <FontAwesomeIcon icon={faBook} />
                    </div>
                    <h3 className={cx("empty-title")}>Chưa có từ nào</h3>
                    <p className={cx("empty-desc")}>
                      Thêm từ vựng đầu tiên để bắt đầu học!
                    </p>
                  </div>
                )}

                {words.map((word) => (
                  <div
                    key={word._id || word.id}
                    className={cx("word-card")}
                  >
                    <div className={cx("word-row")}>
                      <div className={cx("word-main")}>
                        <div className={cx("word-header")}>
                          <h3 className={cx("word-kanji")}>{word.name}</h3>
                          <button
                            className={cx("audio-btn")}
                            onClick={() =>
                              handlePlayAudio(word.phonetic || word.name)
                            }
                            disabled={loading}
                            aria-label="Phát âm"
                          >
                            <FontAwesomeIcon icon={faVolumeHigh} />
                          </button>
                          {word.type && (
                            <span
                              className={cx(
                                "word-category",
                                `cat-${word.type}`
                              )}
                            >
                              {wordCategories.find(
                                (c) => c.value === word.type
                              )?.label || word.type}
                            </span>
                          )}
                        </div>
                        {word.phonetic && (
                          <p className={cx("word-hira")}>{word.phonetic}</p>
                        )}
                        <p className={cx("word-meaning")}>
                          <span className={cx("word-meaning-label")}>
                            Nghĩa:
                          </span>{" "}
                          {word.mean}
                        </p>
                        {word.notes && (
                          <p className={cx("word-note")}>
                            <span className={cx("word-note-label")}>
                              Ghi chú:
                            </span>{" "}
                            {word.notes}
                          </p>
                        )}
                      </div>
                      <div
                        className={cx("word-menu-wrap")}
                        ref={
                          openWordMenuId === (word._id || word.id)
                            ? wordMenuRef
                            : null
                        }
                      >
                        <button
                          className={cx("menu-trigger", "menu-trigger-dark")}
                          onClick={(e) => {
                            e.stopPropagation();
                            const id = word._id || word.id;
                            setOpenWordMenuId(
                              openWordMenuId === id ? null : id
                            );
                          }}
                          disabled={loading}
                          aria-label="Mở menu"
                        >
                          <FontAwesomeIcon icon={faEllipsisVertical} />
                        </button>
                        {openWordMenuId === (word._id || word.id) && (
                          <div
                            className={cx("menu-dropdown")}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className={cx("menu-item")}
                              onClick={() => startEditWord(word)}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                              <span>Chỉnh sửa</span>
                            </button>
                            <button
                              className={cx("menu-item", "danger")}
                              onClick={() => {
                                setOpenWordMenuId(null);
                                setConfirmDeleteWord(word);
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              <span>Xóa từ</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {confirmDelete && (
            <div
              className={cx("modal-overlay")}
              onClick={() => setConfirmDelete(null)}
            >
              <div
                className={cx("modal")}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={cx("modal-header")}>
                  <h3>Xác nhận xóa</h3>
                  <button
                    className={cx("modal-close")}
                    onClick={() => setConfirmDelete(null)}
                    aria-label="Đóng"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
                <div className={cx("modal-body")}>
                  <p className={cx("confirm-text")}>
                    Bạn có chắc muốn xóa sổ tay{" "}
                    <strong>"{confirmDelete.name}"</strong>? Mọi từ vựng trong
                    sổ tay này sẽ bị xóa vĩnh viễn.
                  </p>
                </div>
                <div className={cx("modal-footer")}>
                  <button
                    className={cx("btn-ghost")}
                    onClick={() => setConfirmDelete(null)}
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  <button
                    className={cx("btn-danger")}
                    onClick={removeNotebook}
                    disabled={loading}
                  >
                    {loading ? "Đang xóa..." : "Xóa sổ tay"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {confirmDeleteWord && (
            <div
              className={cx("modal-overlay")}
              onClick={() => setConfirmDeleteWord(null)}
            >
              <div
                className={cx("modal")}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={cx("modal-header")}>
                  <h3>Xác nhận xóa từ</h3>
                  <button
                    className={cx("modal-close")}
                    onClick={() => setConfirmDeleteWord(null)}
                    aria-label="Đóng"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
                <div className={cx("modal-body")}>
                  <p className={cx("confirm-text")}>
                    Bạn có chắc muốn xóa từ{" "}
                    <strong>"{confirmDeleteWord.name}"</strong> khỏi sổ tay?
                  </p>
                </div>
                <div className={cx("modal-footer")}>
                  <button
                    className={cx("btn-ghost")}
                    onClick={() => setConfirmDeleteWord(null)}
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  <button
                    className={cx("btn-danger")}
                    onClick={() =>
                      removeWord(
                        confirmDeleteWord._id || confirmDeleteWord.id
                      )
                    }
                    disabled={loading}
                  >
                    {loading ? "Đang xóa..." : "Xóa từ"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default NotebookDetail;
