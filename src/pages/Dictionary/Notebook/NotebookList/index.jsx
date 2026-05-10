import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "../Notebook.module.scss";
import notebookService from "~/services/notebookService";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPlus,
  faPenToSquare,
  faCheck,
  faTimes,
  faEllipsisVertical,
  faMagnifyingGlass,
  faXmark,
  faBook,
  faBookOpen,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "~/context/AuthContext";

const cx = classNames.bind(styles);

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
];

function NotebookList() {
  const [notebooks, setNotebooks] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingNotebookId, setEditingNotebookId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { isLoggedIn } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const menuRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const didInitRef = useRef(false);

  // Backward-compat: nếu URL có ?id=... thì redirect sang /dictionary/notebook/:id
  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl) {
      navigate(`/dictionary/notebook/${idFromUrl}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotebooks();
    } else {
      setNotebooks([]);
      setError("Bạn cần đăng nhập để xem danh sách sổ tay");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuId]);

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const data = await notebookService.getNotebooks();
      setNotebooks(data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch notebooks:", err);
      setError("Không thể tải danh sách sổ tay");
    } finally {
      setLoading(false);
      didInitRef.current = true;
    }
  };

  const performSearch = useCallback(
    async (keyword) => {
      if (!isLoggedIn) return;
      try {
        setLoading(true);
        const data = await notebookService.searchNotebooks(keyword);
        setNotebooks(data || []);
        setError(null);
      } catch (err) {
        console.error("Failed to search notebooks:", err);
        setError("Không thể tìm kiếm sổ tay");
      } finally {
        setLoading(false);
      }
    },
    [isLoggedIn]
  );

  // Debounced search — chỉ chạy khi user gõ vào ô tìm kiếm (sau lần init đầu)
  useEffect(() => {
    if (!didInitRef.current) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchKeyword);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword]);

  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return;

    try {
      setLoading(true);
      const newNotebook = await notebookService.createNotebook(
        newNotebookName.trim()
      );

      setNewNotebookName("");
      setShowCreateModal(false);

      if (newNotebook && newNotebook._id) {
        navigate(`/dictionary/notebook/${newNotebook._id}`);
      } else {
        await fetchNotebooks();
      }

      setError(null);
    } catch (err) {
      console.error("Failed to create notebook:", err);
      setError("Không thể tạo sổ tay. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const startEditNotebook = (notebook, e) => {
    if (e) e.stopPropagation();
    setOpenMenuId(null);
    setEditingNotebookId(notebook._id);
    setEditingName(notebook.name);
  };

  const cancelEditNotebook = (e) => {
    if (e) e.stopPropagation();
    setEditingNotebookId(null);
    setEditingName("");
  };

  const handleUpdateNotebook = async (notebookId, e) => {
    if (e) e.stopPropagation();

    if (!editingName.trim()) {
      setError("Tên sổ tay không được để trống");
      return;
    }

    try {
      setLoading(true);
      await notebookService.updateNotebook(notebookId, editingName.trim());
      setNotebooks((prev) =>
        prev.map((n) =>
          n._id === notebookId ? { ...n, name: editingName.trim() } : n
        )
      );
      setEditingNotebookId(null);
      setEditingName("");
      setError(null);
    } catch (err) {
      console.error("Failed to update notebook:", err);
      setError("Không thể cập nhật tên sổ tay. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const removeNotebook = async (notebookId) => {
    try {
      setLoading(true);
      await notebookService.deleteNotebook(notebookId);
      setNotebooks((prev) => prev.filter((n) => n._id !== notebookId));
      setConfirmDelete(null);
      setError(null);
    } catch (err) {
      console.error("Failed to delete notebook:", err);
      setError("Không thể xóa sổ tay. Vui lòng thử lại.");
    } finally {
      setLoading(false);
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

  const getGradient = (idx) => GRADIENTS[idx % GRADIENTS.length];

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          <div className={cx("hero")}>
            <div className={cx("hero-content")}>
              <div className={cx("hero-badge")}>
                <FontAwesomeIcon icon={faBookOpen} />
                <span>Sổ tay từ vựng</span>
              </div>
              <h1 className={cx("hero-title")}>Quản lý từ vựng của bạn</h1>
              <p className={cx("hero-subtitle")}>
                Tổ chức từ vựng theo chủ đề, ôn tập với flashcard, học hiệu quả
                mỗi ngày.
              </p>
            </div>
            <div className={cx("hero-stats")}>
              <div className={cx("stat-item")}>
                <div className={cx("stat-icon")}>
                  <FontAwesomeIcon icon={faLayerGroup} />
                </div>
                <div>
                  <div className={cx("stat-value")}>{notebooks.length}</div>
                  <div className={cx("stat-label")}>Sổ tay</div>
                </div>
              </div>
            </div>
          </div>

          <ErrorBanner />

          <div className={cx("toolbar")}>
            <div className={cx("search-wrap")}>
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className={cx("search-icon")}
              />
              <input
                type="text"
                className={cx("search-input")}
                placeholder="Tìm kiếm sổ tay theo tên..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              {searchKeyword && (
                <button
                  className={cx("search-clear")}
                  onClick={() => setSearchKeyword("")}
                  aria-label="Xóa tìm kiếm"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>
            <button
              className={cx("create-btn")}
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Tạo sổ tay mới</span>
            </button>
          </div>

          <section className={cx("section")}>
            <div className={cx("section-header")}>
              <h2 className={cx("section-title")}>
                {searchKeyword
                  ? `Kết quả cho "${searchKeyword}"`
                  : "Sổ tay của bạn"}
              </h2>
              {!loading && (
                <span className={cx("section-count")}>
                  {notebooks.length} sổ tay
                </span>
              )}
            </div>

            {loading && (
              <div className={cx("notebooks-grid")}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={cx("skeleton-card")}>
                    <div className={cx("skeleton-cover")}></div>
                    <div className={cx("skeleton-line", "lg")}></div>
                    <div className={cx("skeleton-line", "sm")}></div>
                  </div>
                ))}
              </div>
            )}

            {!loading && notebooks.length === 0 && (
              <div className={cx("empty-state")}>
                <div className={cx("empty-icon")}>
                  <FontAwesomeIcon icon={faBook} />
                </div>
                <h3 className={cx("empty-title")}>
                  {searchKeyword
                    ? "Không tìm thấy sổ tay nào"
                    : "Chưa có sổ tay nào"}
                </h3>
                <p className={cx("empty-desc")}>
                  {searchKeyword
                    ? "Thử tìm với từ khóa khác hoặc tạo sổ tay mới."
                    : "Hãy bắt đầu hành trình học tiếng Nhật với sổ tay đầu tiên của bạn!"}
                </p>
                {!searchKeyword && (
                  <button
                    className={cx("create-btn")}
                    onClick={() => setShowCreateModal(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Tạo sổ tay đầu tiên</span>
                  </button>
                )}
              </div>
            )}

            {!loading && notebooks.length > 0 && (
              <div className={cx("notebooks-grid")}>
                {notebooks.map((notebook, idx) => (
                  <div
                    key={notebook._id}
                    className={cx("notebook-card")}
                    onClick={() =>
                      !editingNotebookId &&
                      navigate(`/dictionary/notebook/${notebook._id}`)
                    }
                  >
                    <div
                      className={cx("notebook-cover")}
                      style={{ background: getGradient(idx) }}
                    >
                      <FontAwesomeIcon
                        icon={faBookOpen}
                        className={cx("cover-icon")}
                      />
                      {editingNotebookId !== notebook._id && (
                        <div
                          className={cx("menu-wrap")}
                          ref={openMenuId === notebook._id ? menuRef : null}
                        >
                          <button
                            className={cx("menu-trigger")}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === notebook._id
                                  ? null
                                  : notebook._id
                              );
                            }}
                            aria-label="Mở menu"
                          >
                            <FontAwesomeIcon icon={faEllipsisVertical} />
                          </button>
                          {openMenuId === notebook._id && (
                            <div
                              className={cx("menu-dropdown")}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className={cx("menu-item")}
                                onClick={(e) => startEditNotebook(notebook, e)}
                              >
                                <FontAwesomeIcon icon={faPenToSquare} />
                                <span>Đổi tên</span>
                              </button>
                              <button
                                className={cx("menu-item", "danger")}
                                onClick={(e) => {
                                  e.stopPropagation();
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
                      )}
                    </div>

                    <div className={cx("notebook-body")}>
                      {editingNotebookId === notebook._id ? (
                        <div
                          className={cx("edit-mode")}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            className={cx("edit-input")}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleUpdateNotebook(notebook._id, e);
                              if (e.key === "Escape") cancelEditNotebook(e);
                            }}
                          />
                          <div className={cx("edit-actions")}>
                            <button
                              className={cx("edit-btn", "confirm")}
                              onClick={(e) =>
                                handleUpdateNotebook(notebook._id, e)
                              }
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
                        </div>
                      ) : (
                        <>
                          <h3 className={cx("notebook-name")}>
                            {notebook.name}
                          </h3>
                          <div className={cx("notebook-meta")}>
                            <span className={cx("meta-date")}>
                              {notebook.createdAt
                                ? new Date(
                                    notebook.createdAt
                                  ).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : ""}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {showCreateModal && (
            <div
              className={cx("modal-overlay")}
              onClick={() => {
                setShowCreateModal(false);
                setNewNotebookName("");
              }}
            >
              <div
                className={cx("modal")}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={cx("modal-header")}>
                  <h3>Tạo sổ tay mới</h3>
                  <button
                    className={cx("modal-close")}
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewNotebookName("");
                    }}
                    aria-label="Đóng"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
                <div className={cx("modal-body")}>
                  <label className={cx("modal-label")}>Tên sổ tay</label>
                  <input
                    type="text"
                    className={cx("modal-input")}
                    placeholder="VD: Từ vựng N3, Kanji thông dụng..."
                    value={newNotebookName}
                    onChange={(e) => setNewNotebookName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateNotebook();
                    }}
                  />
                </div>
                <div className={cx("modal-footer")}>
                  <button
                    className={cx("btn-ghost")}
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewNotebookName("");
                    }}
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  <button
                    className={cx("btn-primary")}
                    onClick={handleCreateNotebook}
                    disabled={loading || !newNotebookName.trim()}
                  >
                    {loading ? "Đang tạo..." : "Tạo sổ tay"}
                  </button>
                </div>
              </div>
            </div>
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
                    onClick={() => removeNotebook(confirmDelete._id)}
                    disabled={loading}
                  >
                    {loading ? "Đang xóa..." : "Xóa sổ tay"}
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

export default NotebookList;
