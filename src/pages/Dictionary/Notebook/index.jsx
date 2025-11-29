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
  faPenToSquare,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from '~/context/AuthContext';
const cx = classNames.bind(styles);

const wordCategories = ["word", "kanji", "grammar", "other"];

function Notebook() {
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [showAddWord, setShowAddWord] = useState(false);
  const [showCreateNotebook, setShowCreateNotebook] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingNotebookId, setEditingNotebookId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const { isLoggedIn } = useAuth();
  const [newWord, setNewWord] = useState({
    name: "",
    phonetic: "",
    mean: "",
    notes: "",
    type: "word",
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotebooks();
    } else {
      setNotebooks([]);
      setError('⚠️ Bạn cần đăng nhập để xem danh sách sổ tay');
    }
  }, [isLoggedIn]);

  // Fetch danh sách notebooks
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

  // Fetch words của một notebook
  const fetchWords = async (notebookId) => {
    try {
      const response = await notebookService.getWord(notebookId);
      return response.data || [];
    } catch (err) {
      console.error('Failed to fetch words:', err);
      setError('Không thể tải danh sách từ');
      return [];
    }
  };

  // Tạo notebook mới
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

      // Set selected notebook to the new one
      if (newNotebook && newNotebook._id) {
        setSelectedNotebook(newNotebook._id);
      }

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

  // Cập nhật tên notebook
  const handleUpdateNotebook = async (notebookId, e) => {
    e.stopPropagation();

    if (!editingName.trim()) {
      setError('Tên sổ tay không được để trống');
      return;
    }

    try {
      setLoading(true);
      await notebookService.updateNotebook(notebookId, editingName.trim());

      // Update local state
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
    if (!newWord.name.trim() || !selectedNotebook) return;

    try {
      setLoading(true);
      const wordData = {
        name: newWord.name,
        phonetic: newWord.phonetic,
        mean: newWord.meaning,
        notes: newWord.note,
        type: newWord.type,
      };

      const addedWord = await notebookService.addWord(
        selectedNotebook,
        wordData
      );

      // Refresh words list
      const updatedWords = await fetchWords(selectedNotebook);


      // Update notebooks state
      setNotebooks((prev) =>
        prev.map((notebook) => {
          if (notebook._id === selectedNotebook) {
            return {
              ...notebook,
              wordCount: updatedWords.length,
              words: updatedWords,
            };
          }
          return notebook;
        })
      );

      // Reset form
      setNewWord({
        name: "",
        phonetic: "",
        mean: "",
        notes: "",
        type: "word",
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

  // Xóa từ
  const removeWord = async (notebookId, wordId) => {
    try {
      setLoading(true);
      await notebookService.deleteWord(notebookId, wordId);

      // Refresh words list
      const updatedWords = await fetchWords(notebookId);

      // Update notebooks state
      setNotebooks((prev) =>
        prev.map((notebook) => {
          if (notebook._id === notebookId) {
            return {
              ...notebook,
              wordCount: updatedWords.length,
              words: updatedWords,
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

  // Xóa notebook
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

  // Load words khi chọn notebook
  const handleSelectNotebook = async (notebookId) => {
    setSelectedNotebook(notebookId);

    try {
      setLoading(true);
      const words = await fetchWords(notebookId);


      // Update notebook with words
      setNotebooks((prev) =>
        prev.map((notebook) => {
          if (notebook._id === notebookId) {
            return {
              ...notebook,
              words: words,
              wordCount: words.length,
            };
          }
          return notebook;
        })
      );
    } catch (err) {
      console.error('Failed to load words:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentNotebook = notebooks.find((n) => n._id === selectedNotebook);

  const handlePlayAudio = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Phát âm: ${text}`);
    }
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

  // VIEW: NOTEBOOK LIST
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
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateNotebook();
                          }
                        }}
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
              {!loading && notebooks.length === 0 && (
                <p className={cx("empty-text")}>Chưa có sổ tay nào. Hãy tạo sổ tay đầu tiên!</p>
              )}
              <div className={cx("notebooks-list")}>
                {notebooks.map((notebook) => (
                  <Card
                    key={notebook._id}
                    className={cx("notebook-card")}
                    onClick={() => !editingNotebookId && handleSelectNotebook(notebook._id)}
                  >
                    <div className={cx("notebook-row")}>
                      <div className={cx("notebook-main")}>
                        {editingNotebookId === notebook._id ? (
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
                          <>
                            <h3 className={cx("notebook-name")}>{notebook.name}</h3>
                            <div className={cx("notebook-meta")}>

                              <span>
                                Ngày tạo: {notebook.createdAt ? new Date(notebook.createdAt).toLocaleDateString('vi-VN') : ''}
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

          <div className={cx("header")}>
            <button
              type="button"
              onClick={() => setSelectedNotebook(null)}
              className={cx("back-link")}
              disabled={loading}
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
              <div className={cx("title-view-mode")}>
                <h1 className={cx("title")}>{currentNotebook?.name}</h1>
                <Button
                  text
                  className={cx("icon-btn", "edit")}
                  onClick={(e) => startEditNotebook(currentNotebook, e)}
                  disabled={loading}
                  leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
                />
              </div>
            )}

            <p className={cx("subtitle")}>
              {currentNotebook?.wordCount || 0} từ đã lưu
            </p>
          </div>

          <div className={cx("actions")}>
            <Button
              primary
              onClick={() => setShowAddWord((v) => !v)}
              leftIcon={<FontAwesomeIcon icon={faPlus} />}
              disabled={loading}
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

          {showAddWord && (
            <Card className={cx("add-card")}>
              <h3 className={cx("section-title")}>Thêm từ mới</h3>
              <div className={cx("form")}>
                <div className={cx("field")}>
                  <label className={cx("label")}>Từ (Kanji)</label>
                  <Input
                    placeholder="Nhập từ..."
                    value={newWord.name}
                    onChange={(e) =>
                      setNewWord((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className={"notebook-input"}
                    disabled={loading}
                  />
                </div>
                <div className={cx("field")}>
                  <label className={cx("label")}>Hiragana</label>
                  <Input
                    placeholder="Nhập hiragana..."
                    value={newWord.phonetic}
                    onChange={(e) =>
                      setNewWord((prev) => ({
                        ...prev,
                        phonetic: e.target.value,
                      }))
                    }
                    className={"notebook-input"}
                    disabled={loading}
                  />
                </div>
                <div className={cx("field")}>
                  <label className={cx("label")}>Nghĩa của từ</label>
                  <Input
                    placeholder="Nhập nghĩa..."
                    value={newWord.meaning}
                    onChange={(e) =>
                      setNewWord((prev) => ({
                        ...prev,
                        meaning: e.target.value,
                      }))
                    }
                    className={"notebook-input"}
                    disabled={loading}
                  />
                </div>
                <div className={cx("field")}>
                  <label className={cx("label")}>Thêm ghi chú</label>
                  <Input
                    placeholder="Nhập ghi chú..."
                    value={newWord.note}
                    onChange={(e) =>
                      setNewWord((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                    className={"notebook-input"}
                    disabled={loading}
                  />
                </div>
                <div className={cx("field")}>
                  <label className={cx("label")}>Từ loại</label>
                  <select
                    className={cx("select")}
                    value={newWord.type}
                    onChange={(e) =>
                      setNewWord((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    disabled={loading}
                  >
                    {wordCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={cx("form-actions")}>
                  <Button
                    primary
                    onClick={handleAddWord}
                    disabled={loading || !newWord.name.trim()}
                  >
                    {loading ? "Đang thêm..." : "Thêm từ"}
                  </Button>
                  <Button
                    outline
                    onClick={() => {
                      setShowAddWord(false);
                      setNewWord({
                        name: "",
                        phonetic: "",
                        mean: "",
                        notes: "",
                        type: "word",
                      });
                    }}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className={cx("words-list")}>
            {loading && <p>Đang tải từ...</p>}

            {!loading && (!currentNotebook?.words || currentNotebook.words.length === 0) && (
              <Card className={cx("empty-card")}>
                <p className={cx("empty-text")}>
                  Chưa có từ nào trong sổ tay này
                </p>
              </Card>
            )}

            {!loading && currentNotebook?.words?.map((word) => (
              <Card key={word._id || word.id} className={cx("word-card")}>
                <div className={cx("word-row")}>
                  <div className={cx("word-main")}>
                    <div className={cx("word-header")}>
                      <h3 className={cx("word-kanji")}>{word.name}</h3>
                      <Button
                        text
                        className={cx("icon-btn")}
                        onClick={() => handlePlayAudio(word.phonetic || word.phonetic)}
                        disabled={loading}
                      // leftIcon={
                      //   <FontAwesomeIcon
                      //     icon={faVolumeHigh}
                      //     className={cx("volume-icon")}
                      //   />
                      // }
                      />
                    </div>
                    <div className={cx("word-sub")}>
                      <p className={cx("word-hira")}>{word.phonetic}</p>
                    </div>
                    <p className={cx("word-meaning")}>
                      <span className={cx("word-meaning-label")}>Nghĩa:</span>{" "}
                      {word.mean}
                    </p>
                    {word.notes && (
                      <p className={cx("word-note")}>
                        <span className={cx("word-note-label")}>Ghi chú:</span>{" "}
                        {word.notes}
                      </p>
                    )}
                    {word.type && (
                      <span className={cx("word-category")}>{word.type}</span>
                    )}
                  </div>
                  <Button
                    text
                    className={cx("icon-btn", "danger")}
                    onClick={() => removeWord(currentNotebook._id, word._id || word.id)}
                    disabled={loading}
                    leftIcon={
                      <FontAwesomeIcon
                        icon={faTrash}
                        className={cx("trash-icon")}
                      />
                    }
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Notebook;