import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./Notebook.module.scss";
import notebookService from "~/services/notebookService";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVolumeHigh,
  faTrash,
  faArrowLeft,
  faPlus,
  faPenToSquare, // Thêm icon edit
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const wordCategories = ["Từ vựng", "Hán tự", "Ngữ pháp"];

function Notebook() {
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [showAddWord, setShowAddWord] = useState(false);
  const [showCreateNotebook, setShowCreateNotebook] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingNotebookId, setEditingNotebookId] = useState(null); // Thêm state
  const [editingName, setEditingName] = useState(""); // Thêm state
  const [newWord, setNewWord] = useState({
    term: "",
    phonetic: "",
    meaning: "",
    note: "",
    category: "Từ vựng",
  });

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const data = await notebookService.getNotebooks();
      setNotebooks(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch notebooks:', err);
      setError('Không thể tải danh sách sổ tay');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return;

    try {
      setLoading(true);
      const newNotebook = await notebookService.createNotebook(
        newNotebookName.trim()
      );
      await fetchNotebooks();
      setNewNotebookName("");
      setShowCreateNotebook(false);
      setSelectedNotebook(newNotebook._id);
      setError(null);
    } catch (err) {
      console.error('Failed to create notebook:', err);
      setError('Không thể tạo sổ tay. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Bắt đầu edit notebook
  const startEditNotebook = (notebook, e) => {
    e.stopPropagation();
    setEditingNotebookId(notebook._id);
    setEditingName(notebook.name);
  };

  // Hủy edit
  const cancelEditNotebook = (e) => {
    e.stopPropagation();
    setEditingNotebookId(null);
    setEditingName("");
  };

  // Lưu tên notebook mới
  const handleUpdateNotebook = async (notebookId, e) => {
    e.stopPropagation();
    
    if (!editingName.trim()) {
      setError('Tên sổ tay không được để trống');
      return;
    }

    try {
      setLoading(true);
      await notebookService.updateNotebook(notebookId, editingName.trim());

      setNotebooks((prev) =>
        prev.map((notebook) =>
          notebook._id === notebookId
            ? { ...notebook, name: editingName.trim() }
            : notebook
        )
      );

      setEditingNotebookId(null);
      setEditingName("");
      setError(null);
    } catch (err) {
      console.error('Failed to update notebook:', err);
      setError('Không thể cập nhật tên sổ tay. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.term.trim() || !selectedNotebook) return;

    try {
      setLoading(true);
      const wordData = {
        kanji: newWord.term,
        hiragana: newWord.phonetic,
        meaning: newWord.meaning,
        note: newWord.note,
        category: newWord.category,
      };

      const addedWord = await notebookService.addWord(
        selectedNotebook,
        wordData
      );

      setNotebooks((prev) =>
        prev.map((notebook) => {
          if (notebook._id === selectedNotebook) {
            return {
              ...notebook,
              wordCount: notebook.wordCount + 1,
              words: [...(notebook.words || []), addedWord],
            };
          }
          return notebook;
        })
      );

      setNewWord({
        term: "",
        phonetic: "",
        meaning: "",
        note: "",
        category: "Từ vựng",
      });
      setShowAddWord(false);
      setError(null);
    } catch (err) {
      console.error('Failed to add word:', err);
      setError('Không thể thêm từ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const removeWord = async (notebookId, wordId) => {
    try {
      setLoading(true);
      await notebookService.deleteWord(notebookId, wordId);

      setNotebooks((prev) =>
        prev.map((notebook) => {
          if (notebook._id === notebookId) {
            return {
              ...notebook,
              wordCount: Math.max(0, notebook.wordCount - 1),
              words: notebook.words.filter((w) => w.id !== wordId),
            };
          }
          return notebook;
        })
      );
      setError(null);
    } catch (err) {
      console.error('Failed to delete word:', err);
      setError('Không thể xóa từ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const removeNotebook = async (notebookId) => {
    if (!window.confirm('Bạn có chắc muốn xóa sổ tay này?')) return;

    try {
      setLoading(true);
      await notebookService.deleteNotebook(notebookId);

      setNotebooks((prev) => prev.filter((n) => n._id !== notebookId));
      if (selectedNotebook === notebookId) {
        setSelectedNotebook(null);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to delete notebook:', err);
      setError('Không thể xóa sổ tay. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const currentNotebook = notebooks.find((n) => n._id === selectedNotebook);

  const handlePlayAudio = (text) => {
    alert(`Phát âm: ${text}`);
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

  if (!selectedNotebook) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <ErrorMessage />
            
            <div className={cx("header")}>
              <h1 className={cx("title")}>Sổ tay từ vựng</h1>
            </div>

            <div className={cx("create-block")}>
              {!showCreateNotebook ? (
                <Button
                  primary
                  onClick={() => setShowCreateNotebook(true)}
                  leftIcon={<FontAwesomeIcon icon={faPlus} />}
                  disabled={loading}
                >
                  Tạo sổ tay mới
                </Button>
              ) : (
                <Card className={cx("create-card")}>
                  <h3 className={cx("section-title")}>Tạo sổ tay mới</h3>
                  <div className={cx("form")}>
                    <div className={cx("field")}>
                      <label className={cx("label")}>Tên sổ tay</label>
                      <Input
                        placeholder="Nhập tên sổ tay..."
                        value={newNotebookName}
                        onChange={(e) => setNewNotebookName(e.target.value)}
                        className={"notebook-input"}
                        disabled={loading}
                      />
                    </div>
                    <div className={cx("form-actions")}>
                      <Button
                        primary
                        className={cx("form-btn")}
                        onClick={handleCreateNotebook}
                        disabled={loading || !newNotebookName.trim()}
                      >
                        {loading ? "Đang tạo..." : "Tạo sổ tay"}
                      </Button>
                      <Button
                        outline
                        className={cx("form-btn")}
                        onClick={() => {
                          setShowCreateNotebook(false);
                          setNewNotebookName("");
                        }}
                        disabled={loading}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <section className={cx("section")}>
              <h2 className={cx("section-title")}>Sổ tay của bạn</h2>
              {loading && <p>Đang tải...</p>}
              <div className={cx("notebooks-list")}>
                {notebooks.map((notebook) => (
                  <Card
                    key={notebook._id}
                    className={cx("notebook-card")}
                    onClick={() => !editingNotebookId && setSelectedNotebook(notebook._id)}
                  >
                    <div className={cx("notebook-row")}>
                      <div className={cx("notebook-main")}>
                        {editingNotebookId === notebook._id ? (
                          // Edit mode
                          <div className={cx("edit-mode")}>
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className={"notebook-input"}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateNotebook(notebook._id, e);
                                }
                              }}
                            />
                            <div className={cx("edit-actions")}>
                              <Button
                                text
                                className={cx("icon-btn", "success")}
                                onClick={(e) => handleUpdateNotebook(notebook._id, e)}
                                disabled={loading}
                                leftIcon={<FontAwesomeIcon icon={faCheck} />}
                              />
                              <Button
                                text
                                className={cx("icon-btn", "cancel")}
                                onClick={cancelEditNotebook}
                                disabled={loading}
                                leftIcon={<FontAwesomeIcon icon={faTimes} />}
                              />
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <>
                            <h3 className={cx("notebook-name")}>{notebook.name}</h3>
                            <div className={cx("notebook-meta")}>
                              <span>
                                Ngày tạo: {notebook.createdAt ? notebook.createdAt.slice(0, 10) : ''}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {editingNotebookId !== notebook._id && (
                        <div className={cx("notebook-actions")}>
                          <Button
                            text
                            className={cx("icon-btn", "edit")}
                            onClick={(e) => startEditNotebook(notebook, e)}
                            disabled={loading}
                            leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
                          />
                          <Button
                            text
                            className={cx("icon-btn", "danger")}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotebook(notebook._id);
                            }}
                            disabled={loading}
                            leftIcon={<FontAwesomeIcon icon={faTrash} />}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  // VIEW: INSIDE A NOTEBOOK
  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          <ErrorMessage />
          
          {/* Header với edit inline */}
          <div className={cx("header")}>
            <button
              type="button"
              onClick={() => setSelectedNotebook(null)}
              className={cx("back-link")}
            >
              <FontAwesomeIcon icon={faArrowLeft} className={cx("back-icon")} />
              <span>Quay lại</span>
            </button>
            
            {editingNotebookId === currentNotebook?._id ? (
              <div className={cx("title-edit-mode")}>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className={"notebook-input-title"}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateNotebook(currentNotebook._id, e);
                    }
                  }}
                />
                <div className={cx("title-actions")}>
                  <Button
                    text
                    className={cx("icon-btn", "success")}
                    onClick={(e) => handleUpdateNotebook(currentNotebook._id, e)}
                    leftIcon={<FontAwesomeIcon icon={faCheck} />}
                  />
                  <Button
                    text
                    className={cx("icon-btn", "cancel")}
                    onClick={cancelEditNotebook}
                    leftIcon={<FontAwesomeIcon icon={faTimes} />}
                  />
                </div>
              </div>
            ) : (
              <div className={cx("title-view-mode")}>
                <h1 className={cx("title")}>{currentNotebook?.name}</h1>
                <Button
                  text
                  className={cx("icon-btn", "edit")}
                  onClick={(e) => startEditNotebook(currentNotebook, e)}
                  leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
                />
              </div>
            )}
            
            <p className={cx("subtitle")}>
              {currentNotebook?.wordCount || 0} từ đã lưu
            </p>
          </div>

          {/* Actions */}
          <div className={cx("actions")}>
            <Button
              className={"green"}
              onClick={() => setShowAddWord((v) => !v)}
              leftIcon={<FontAwesomeIcon icon={faPlus} />}
            >
              Thêm từ
            </Button>
            <Button
              outline
              href="/dictionary/notebook/flashcards"
              className={"orange"}
            >
              Luyện tập Flashcard
            </Button>
          </div>

          {/* Add word form */}
          {showAddWord && (
            <Card className={cx("add-card")}>
              <h3 className={cx("section-title")}>Thêm từ mới</h3>
              {/* Form giữ nguyên như cũ */}
            </Card>
          )}

          {/* Words list */}
          {/* Giữ nguyên */}
        </div>
      </main>
    </div>
  );
}

export default Notebook;