import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./Notebook.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVolumeHigh,
  faTrash,
  faArrowLeft,
  faPlus,
  faCopy,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

// Mock notebooks data
const mockNotebooks = [
  {
    id: 1,
    name: "test",
    wordCount: 5,
    createdDate: "2025-11-24",
    words: [
      { id: 1, kanji: "勉強", hiragana: "べんきょう", meaning: "học tập" },
      { id: 2, kanji: "学校", hiragana: "がっこう", meaning: "trường học" },
    ],
  },
  {
    id: 2,
    name: "JLPT N5",
    wordCount: 12,
    createdDate: "2025-11-20",
    words: [],
  },
];

const mockCommunityNotebooks = [
  {
    id: 101,
    name: "N1-Mimikara - new",
    wordCount: 2199,
    author: "Minh Hà",
    views: 26509,
  },
  {
    id: 102,
    name: "Mimikara Oboeru n2",
    wordCount: 3524,
    author: "hoangvan2481",
    views: 25994,
  },
  {
    id: 103,
    name: "Các cấp từ động từ và tha động từ...",
    wordCount: 81,
    author: "Haki Natsumi",
    views: 24583,
  },
  {
    id: 104,
    name: "Tettei n1",
    wordCount: 744,
    author: "hoangvan2481",
    views: 19881,
  },
  {
    id: 105,
    name: "Ngữ pháp N3",
    wordCount: 211,
    author: "thanhhang4715",
    views: 13117,
  },
  {
    id: 106,
    name: "Từ vựng",
    wordCount: 2739,
    author: "Kiều Lê",
    views: 11074,
  },
  {
    id: 107,
    name: "kanji n3",
    wordCount: 1005,
    author: "Đặng Ngọc Diệp",
    views: 7945,
  },
  {
    id: 108,
    name: "Tango n3",
    wordCount: 2119,
    author: "hoangvan2481",
    views: 6324,
  },
];

const mockPremiumNotebooks = [
  {
    id: 201,
    name: "Từ vựng trung thu",
    wordCount: 30,
    author: "Mazii Customer Support",
    views: 3102,
  },
  {
    id: 202,
    name: "50 bài Minna no Nihongo - Hiragana",
    wordCount: 2037,
    lessons: 50,
    author: "Mazii Customer Support",
    views: 107,
  },
  {
    id: 203,
    name: "50 bài Minna no Nihongo",
    wordCount: 2092,
    lessons: 50,
    author: "Mazii Customer Support",
    views: 101,
  },
  {
    id: 204,
    name: "Từ vựng tiếng nhật chuyên ngành th...",
    wordCount: 85,
    lessons: 3,
    author: "Mazii Customer Support",
    views: 14,
  },
  {
    id: 205,
    name: "Từ vựng tiếng nhật chuyên ngành gi...",
    wordCount: 81,
    lessons: 2,
    author: "Mazii Customer Support",
    views: 4,
  },
  {
    id: 206,
    name: "Mimi kara Oboeru N3",
    wordCount: 875,
    lessons: 12,
    author: "Mazii Customer Support",
    views: 3,
  },
  {
    id: 207,
    name: "Từ vựng tiếng nhật chuyên ngành...",
    wordCount: 66,
    lessons: 3,
    author: "Mazii Customer Support",
    views: 2,
  },
  {
    id: 208,
    name: "Mimi kara Oboeru N2",
    wordCount: 1183,
    lessons: 13,
    author: "Mazii Customer Support",
    views: 1,
  },
];

const wordCategories = ["Từ vựng", "Hán tự", "Ngữ pháp"];

function Notebook() {
  const [notebooks, setNotebooks] = useState(mockNotebooks);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [showAddWord, setShowAddWord] = useState(false);
  const [showCreateNotebook, setShowCreateNotebook] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [newWord, setNewWord] = useState({
    term: "",
    phonetic: "",
    meaning: "",
    note: "",
    category: "Từ vựng",
  });

  const handleCreateNotebook = () => {
    if (!newNotebookName.trim()) return;

    const newNotebook = {
      id: Math.max(...notebooks.map((n) => n.id), 0) + 1,
      name: newNotebookName.trim(),
      wordCount: 0,
      createdDate: new Date().toISOString().split("T")[0],
      words: [],
    };

    setNotebooks((prev) => [...prev, newNotebook]);
    setNewNotebookName("");
    setShowCreateNotebook(false);
    setSelectedNotebook(newNotebook.id);
  };

  const handleAddWord = () => {
    if (!newWord.term.trim() || !selectedNotebook) return;

    setNotebooks((prev) =>
      prev.map((notebook) => {
        if (notebook.id === selectedNotebook) {
          const newId =
            Math.max(0, ...notebook.words.map((w) => w.id || 0)) + 1;
          return {
            ...notebook,
            wordCount: notebook.wordCount + 1,
            words: [
              ...notebook.words,
              {
                id: newId,
                kanji: newWord.term,
                hiragana: newWord.phonetic,
                meaning: newWord.meaning,
              },
            ],
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
  };

  const removeWord = (notebookId, wordId) => {
    setNotebooks((prev) =>
      prev.map((notebook) => {
        if (notebook.id === notebookId) {
          return {
            ...notebook,
            wordCount: Math.max(0, notebook.wordCount - 1),
            words: notebook.words.filter((w) => w.id !== wordId),
          };
        }
        return notebook;
      })
    );
  };

  const removeNotebook = (notebookId) => {
    setNotebooks((prev) => prev.filter((n) => n.id !== notebookId));
    if (selectedNotebook === notebookId) {
      setSelectedNotebook(null);
    }
  };

  const currentNotebook = notebooks.find((n) => n.id === selectedNotebook);

  const handlePlayAudio = (text) => {
    alert(`Phát âm: ${text}`);
  };

  if (!selectedNotebook) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            {/* Header */}
            <div className={cx("header")}>
              <h1 className={cx("title")}>Sổ tay từ vựng</h1>
            </div>

            <div className={cx("create-block")}>
              {!showCreateNotebook ? (
                <Button
                  primary
                  onClick={() => setShowCreateNotebook(true)}
                  leftIcon={<FontAwesomeIcon icon={faPlus} />}
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
                      />
                    </div>
                    <div className={cx("form-actions")}>
                      <Button
                        primary
                        className={cx("form-btn")}
                        onClick={handleCreateNotebook}
                      >
                        Tạo sổ tay
                      </Button>
                      <Button
                        outline
                        className={cx("form-btn")}
                        onClick={() => {
                          setShowCreateNotebook(false);
                          setNewNotebookName("");
                        }}
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
              <div className={cx("notebooks-list")}>
                {notebooks.map((notebook) => (
                  <Card
                    key={notebook.id}
                    className={cx("notebook-card")}
                    onClick={() => setSelectedNotebook(notebook.id)}
                  >
                    <div className={cx("notebook-row")}>
                      <div className={cx("notebook-main")}>
                        <h3 className={cx("notebook-name")}>{notebook.name}</h3>
                        <div className={cx("notebook-meta")}>
                          <span>({notebook.wordCount} từ)</span>
                          <span>Ngày tạo: {notebook.createdDate}</span>
                        </div>
                      </div>
                      <Button
                        text
                        className={cx("icon-btn", "danger")}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotebook(notebook.id);
                        }}
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
            </section>

            {/* Discover */}
            <section className={cx("section")}>
              <div className={cx("section-header")}>
                <h2 className={cx("section-title")}>Khám phá</h2>
                <a href="#" className={cx("link-more", "small")}>
                  Xem thêm
                </a>
              </div>
              <div className={cx("grid")}>
                {mockCommunityNotebooks.map((notebook) => (
                  <Card key={notebook.id} className={cx("discover-card")}>
                    <h3 className={cx("discover-title")}>{notebook.name}</h3>
                    <div className={cx("discover-meta")}>
                      <p>({notebook.wordCount} từ)</p>
                    </div>
                    <div className={cx("discover-author")}>
                      <div className={cx("avatar-placeholder")} />
                      <span>{notebook.author}</span>
                    </div>
                    <div className={cx("discover-views")}>
                      <span>👁️ {notebook.views.toLocaleString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Premium */}
            <section className={cx("section")}>
              <div className={cx("section-header")}>
                <h2 className={cx("section-title")}>Premium</h2>
                <a href="#" className={cx("link-more", "small")}>
                  Xem thêm
                </a>
              </div>
              <div className={cx("grid")}>
                {mockPremiumNotebooks.map((notebook) => (
                  <Card key={notebook.id} className={cx("premium-card")}>
                    <h3 className={cx("discover-title")}>{notebook.name}</h3>
                    <div className={cx("discover-meta")}>
                      <p>
                        ({notebook.wordCount} từ
                        {Object.prototype.hasOwnProperty.call(
                          notebook,
                          "lessons"
                        )
                          ? ` | ${notebook.lessons} bài`
                          : ""}
                        )
                      </p>
                    </div>
                    <div className={cx("discover-author")}>
                      <div className={cx("premium-badge")}>M</div>
                      <span>{notebook.author}</span>
                    </div>
                    <div className={cx("discover-views")}>
                      <span>👁️ {notebook.views.toLocaleString()}</span>
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
          {/* Header */}
          <div className={cx("header")}>
            <button
              type="button"
              onClick={() => setSelectedNotebook(null)}
              className={cx("back-link")}
            >
              <FontAwesomeIcon icon={faArrowLeft} className={cx("back-icon")} />
              <span>Quay lại</span>
            </button>
            <h1 className={cx("title")}>{currentNotebook?.name}</h1>
            <p className={cx("subtitle")}>
              {currentNotebook?.wordCount} từ đã lưu
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
              <div className={cx("form")}>
                <div className={cx("field")}>
                  <label className={cx("label")}>Từ</label>
                  <Input
                    placeholder="Nhập từ..."
                    value={newWord.term}
                    onChange={(e) =>
                      setNewWord((prev) => ({
                        ...prev,
                        term: e.target.value,
                      }))
                    }
                    className={"notebook-input"}
                  />
                </div>
                <div className={cx("field")}>
                  <label className={cx("label")}>Phonetic</label>
                  <Input
                    placeholder="Nhập phonetic..."
                    value={newWord.phonetic}
                    onChange={(e) =>
                      setNewWord((prev) => ({
                        ...prev,
                        phonetic: e.target.value,
                      }))
                    }
                    className={"notebook-input"}
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
                  />
                </div>
                <div className={cx("field")}>
                  <label className={cx("label")}>Từ loại</label>
                  <select
                    className={cx("select")}
                    value={newWord.category}
                    onChange={(e) =>
                      setNewWord((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  >
                    {wordCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={cx("form-actions")}>
                  <Button primary className={"green"} onClick={handleAddWord}>
                    Thêm từ
                  </Button>
                  <Button
                    outline
                    className={"orange"}
                    onClick={() => setShowAddWord(false)}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Words list */}
          <div className={cx("words-list")}>
            {(!currentNotebook?.words ||
              currentNotebook.words.length === 0) && (
              <Card className={cx("empty-card")}>
                <p className={cx("empty-text")}>
                  Chưa có từ nào trong sổ tay này
                </p>
              </Card>
            )}

            {currentNotebook?.words?.map((word) => (
              <Card key={word.id} className={cx("word-card")}>
                <div className={cx("word-row")}>
                  <div className={cx("word-main")}>
                    <div className={cx("word-header")}>
                      <h3 className={cx("word-kanji")}>{word.kanji}</h3>
                      <Button
                        text
                        className={cx("icon-btn")}
                        onClick={() =>
                          handlePlayAudio(word.hiragana || word.kanji)
                        }
                        leftIcon={
                          <FontAwesomeIcon
                            icon={faVolumeHigh}
                            className={cx("volume-icon")}
                          />
                        }
                      />
                    </div>
                    <div className={cx("word-sub")}>
                      <p className={cx("word-hira")}>{word.hiragana}</p>
                    </div>
                    <p className={cx("word-meaning")}>
                      <span className={cx("word-meaning-label")}>Nghĩa:</span>{" "}
                      {word.meaning}
                    </p>
                  </div>
                  <Button
                    text
                    className={cx("icon-btn", "danger")}
                    onClick={() => removeWord(currentNotebook.id, word.id)}
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
