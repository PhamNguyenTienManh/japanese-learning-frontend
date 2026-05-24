import { useEffect, useMemo, useState } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCommentDots,
  faMagnifyingGlass,
  faPenToSquare,
  faPlus,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import Card from "~/components/Card";
import Input from "~/components/Input";
import Button from "~/components/Button";
import {
  createConversationCategory,
  createConversationLesson,
  deleteConversationCategory,
  deleteConversationLesson,
  getConversationAdminData,
  updateConversationCategory,
  updateConversationLesson,
} from "~/services/conversationService";
import styles from "./AdminConversation.module.scss";

const cx = classNames.bind(styles);

const blankCategory = {
  id: "",
  slug: "",
  title: "",
  order: 1,
  isActive: true,
};

const blankLine = {
  order: 1,
  japanese: "",
  kana: "",
  vietnamese: "",
};

const blankLesson = {
  slug: "",
  level: "N5",
  title: "",
  image: "",
  order: 1,
  published: true,
  categoryId: "",
  lines: [{ ...blankLine }],
};

function slugify(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeAdminData(payload) {
  return {
    categories: payload?.categories || [],
    lessons: (payload?.lessons || []).map((lesson) => ({
      ...lesson,
      id: lesson.id || lesson._id,
      categoryId: lesson.category?.id || "",
    })),
  };
}

function AdminConversation() {
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categoryForm, setCategoryForm] = useState(null);
  const [lessonForm, setLessonForm] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const nextCategoryOrder = useMemo(() => {
    return categories.reduce((max, category) => {
      return Math.max(max, Number(category.order) || 0);
    }, 0) + 1;
  }, [categories]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = normalizeAdminData(await getConversationAdminData());
      setCategories(data.categories);
      setLessons(data.lessons);
    } catch (error) {
      console.error("Load conversation admin error:", error);
      setToast({ type: "error", message: "Không tải được dữ liệu hội thoại." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const filteredLessons = lessons.filter((lesson) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      lesson.title?.toLowerCase().includes(q) ||
      lesson.slug?.toLowerCase().includes(q);
    const matchCategory =
      categoryFilter === "all" || lesson.category?.id === categoryFilter;

    return matchSearch && matchCategory;
  });

  const publishedCount = lessons.filter((lesson) => lesson.published).length;

  const handleCategoryChange = (field, value) => {
    setCategoryForm((current) => ({ ...current, [field]: value }));
  };

  const handleLessonChange = (field, value) => {
    setLessonForm((current) => ({ ...current, [field]: value }));
  };

  const handleLineChange = (index, field, value) => {
    setLessonForm((current) => {
      const lines = [...(current.lines || [])];
      lines[index] = { ...lines[index], [field]: value };
      return { ...current, lines };
    });
  };

  const addLine = () => {
    setLessonForm((current) => ({
      ...current,
      lines: [
        ...(current.lines || []),
        { ...blankLine, order: (current.lines || []).length + 1 },
      ],
    }));
  };

  const removeLine = (index) => {
    setLessonForm((current) => ({
      ...current,
      lines: (current.lines || [])
        .filter((_, lineIndex) => lineIndex !== index)
        .map((line, lineIndex) => ({ ...line, order: lineIndex + 1 })),
    }));
  };

  const saveCategory = async () => {
    if (!categoryForm?.title?.trim() || !categoryForm?.id?.trim()) {
      setToast({ type: "error", message: "Vui lòng nhập tên và mã chủ đề." });
      return;
    }

    const stableId = slugify(categoryForm.id);

    const payload = {
      id: stableId,
      slug: stableId,
      title: categoryForm.title.trim(),
      order: Number(categoryForm.order) || nextCategoryOrder,
      isActive: Boolean(categoryForm.isActive),
    };

    try {
      if (categoryForm._id) {
        await updateConversationCategory(categoryForm._id, payload);
      } else {
        await createConversationCategory(payload);
      }
      setCategoryForm(null);
      setToast({ type: "success", message: "Đã lưu chủ đề hội thoại." });
      loadData();
    } catch (error) {
      console.error("Save category error:", error);
      setToast({ type: "error", message: "Lưu chủ đề thất bại." });
    }
  };

  const saveLesson = async () => {
    const category = categoryMap.get(lessonForm?.categoryId);
    if (!lessonForm?.title?.trim() || !lessonForm?.slug?.trim() || !category) {
      setToast({
        type: "error",
        message: "Vui lòng nhập tiêu đề, slug và chọn chủ đề.",
      });
      return;
    }

    const payload = {
      category: {
        id: category.id,
        title: category.title,
        order: Number(category.order) || 0,
      },
      slug: lessonForm.slug.trim(),
      level: lessonForm.level,
      title: lessonForm.title.trim(),
      image: lessonForm.image || "",
      order: Number(lessonForm.order) || 0,
      published: Boolean(lessonForm.published),
      lines: (lessonForm.lines || [])
        .filter((line) => line.japanese || line.kana || line.vietnamese)
        .map((line, index) => ({
          order: index + 1,
          japanese: line.japanese || "",
          kana: line.kana || "",
          vietnamese: line.vietnamese || "",
        })),
    };

    try {
      if (lessonForm.id) {
        await updateConversationLesson(lessonForm.id, payload);
      } else {
        await createConversationLesson(payload);
      }
      setLessonForm(null);
      setToast({ type: "success", message: "Đã lưu bài hội thoại." });
      loadData();
    } catch (error) {
      console.error("Save lesson error:", error);
      setToast({ type: "error", message: "Lưu bài hội thoại thất bại." });
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Xóa chủ đề "${category.title}"?`)) return;
    try {
      await deleteConversationCategory(category._id);
      setToast({ type: "success", message: "Đã xóa chủ đề." });
      loadData();
    } catch (error) {
      console.error("Delete category error:", error);
      setToast({ type: "error", message: "Xóa chủ đề thất bại." });
    }
  };

  const handleDeleteLesson = async (lesson) => {
    if (!window.confirm(`Xóa bài "${lesson.title}"?`)) return;
    try {
      await deleteConversationLesson(lesson.id);
      setToast({ type: "success", message: "Đã xóa bài hội thoại." });
      loadData();
    } catch (error) {
      console.error("Delete lesson error:", error);
      setToast({ type: "error", message: "Xóa bài thất bại." });
    }
  };

  const startCreateLesson = () => {
    setLessonForm({
      ...blankLesson,
      categoryId: categories[0]?.id || "",
      order: lessons.length + 1,
    });
  };

  const startEditLesson = (lesson) => {
    setLessonForm({
      ...lesson,
      categoryId: lesson.category?.id || "",
      lines: lesson.lines?.length ? lesson.lines : [{ ...blankLine }],
    });
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("inner")}>
          <div className={cx("header")}>
            <div className={cx("titleBlock")}>
              <span className={cx("eyebrow")}>Quản trị</span>
              <h1 className={cx("title")}>
                Quản lý <span className={cx("titleAccent")}>hội thoại</span>
              </h1>
              <p className={cx("subtitle")}>
                <strong>{categories.length}</strong> chủ đề ·{" "}
                <strong>{lessons.length}</strong> bài hội thoại
              </p>
            </div>

            <div className={cx("headerRight")}>
              <div className={cx("statsRow")}>
                <div className={cx("statPill", "tonePrimary")}>
                  <span className={cx("statValue")}>{lessons.length}</span>
                  <span className={cx("statLabel")}>Bài</span>
                </div>
                <div className={cx("statPill", "toneOrange")}>
                  <span className={cx("statValue")}>{publishedCount}</span>
                  <span className={cx("statLabel")}>Công khai</span>
                </div>
              </div>
              <button
                type="button"
                className={cx("primaryBtn")}
                onClick={startCreateLesson}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Thêm bài</span>
              </button>
            </div>
          </div>

          <Card className={cx("filterCard")}>
            <div className={cx("filterRow")}>
              <div className={cx("searchWrapper")}>
                <FontAwesomeIcon icon={faMagnifyingGlass} className={cx("searchIcon")} />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm bài hội thoại..."
                  className={cx("searchInput")}
                />
              </div>
              <select
                className={cx("select")}
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Tất cả chủ đề</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <section className={cx("grid")}>
            <Card className={cx("sideCard")}>
              <div className={cx("cardHead")}>
                <h2>Chủ đề</h2>
                <button
                  type="button"
                  className={cx("smallBtn")}
                  onClick={() => setCategoryForm({ ...blankCategory })}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>

              {categoryForm && (
                <div className={cx("miniForm")}>
                  <div className={cx("field")}>
                    <label>Tên chủ đề</label>
                    <Input
                      value={categoryForm.title}
                      onChange={(event) => handleCategoryChange("title", event.target.value)}
                      placeholder="Ví dụ: Chào hỏi"
                      className={cx("input")}
                    />
                  </div>
                  <div className={cx("field")}>
                    <label>Mã chủ đề</label>
                    <Input
                      value={categoryForm.id}
                      onChange={(event) => handleCategoryChange("id", event.target.value)}
                      placeholder="Ví dụ: greeting"
                      className={cx("input")}
                      disabled={Boolean(categoryForm._id)}
                    />
                    {categoryForm._id && (
                      <p className={cx("hintText")}>
                        Mã chủ đề được khóa khi chỉnh sửa để giữ liên kết với bài hội thoại.
                      </p>
                    )}
                  </div>
                  <div className={cx("field")}>
                    <label>Thứ tự</label>
                    <Input
                      type="number"
                      value={categoryForm.order}
                      onChange={(event) => handleCategoryChange("order", event.target.value)}
                      placeholder="1"
                      className={cx("input")}
                    />
                  </div>
                  <label className={cx("checkboxRow")}>
                    <input
                      type="checkbox"
                      checked={categoryForm.isActive}
                      onChange={(event) =>
                        handleCategoryChange("isActive", event.target.checked)
                      }
                    />
                    <span>Đang hiển thị</span>
                  </label>
                  <div className={cx("formActions")}>
                    <Button outline onClick={() => setCategoryForm(null)}>
                      Hủy
                    </Button>
                    <Button primary onClick={saveCategory}>
                      Lưu
                    </Button>
                  </div>
                </div>
              )}

              <div className={cx("categoryList")}>
                {categories.map((category) => (
                  <div className={cx("categoryItem")} key={category._id}>
                    <div>
                      <strong>{category.title}</strong>
                      <span>{category.id}</span>
                    </div>
                    <div className={cx("rowActions")}>
                      <button type="button" onClick={() => setCategoryForm(category)}>
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button type="button" onClick={() => handleDeleteCategory(category)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className={cx("contentCol")}>
              {lessonForm && (
                <Card className={cx("formCard")}>
                  <div className={cx("formHeader")}>
                    <h2>
                      {lessonForm.id ? "Chỉnh sửa bài hội thoại" : "Thêm bài hội thoại"}
                      <span>Nội dung hiển thị ở trang luyện hội thoại</span>
                    </h2>
                    <button type="button" onClick={() => setLessonForm(null)}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>

                  <div className={cx("formGrid")}>
                    <div className={cx("field")}>
                      <label>Chủ đề</label>
                      <select
                        className={cx("select")}
                        value={lessonForm.categoryId}
                        onChange={(event) =>
                          handleLessonChange("categoryId", event.target.value)
                        }
                      >
                        <option value="">Chọn chủ đề</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={cx("field")}>
                      <label>Level</label>
                      <select
                        className={cx("select")}
                        value={lessonForm.level}
                        onChange={(event) => handleLessonChange("level", event.target.value)}
                      >
                        {["N5", "N4", "N3", "N2", "N1"].map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={cx("field")}>
                      <label>Tiêu đề</label>
                      <Input
                        value={lessonForm.title}
                        onChange={(event) => handleLessonChange("title", event.target.value)}
                        className={cx("input")}
                      />
                    </div>
                    <div className={cx("field")}>
                      <label>Slug</label>
                      <Input
                        value={lessonForm.slug}
                        onChange={(event) => handleLessonChange("slug", event.target.value)}
                        className={cx("input")}
                      />
                    </div>
                    <div className={cx("field", "fieldFull")}>
                      <label>Ảnh</label>
                      <Input
                        value={lessonForm.image}
                        onChange={(event) => handleLessonChange("image", event.target.value)}
                        className={cx("input")}
                        placeholder="https://..."
                      />
                    </div>
                    <div className={cx("field")}>
                      <label>Thứ tự</label>
                      <Input
                        type="number"
                        value={lessonForm.order}
                        onChange={(event) => handleLessonChange("order", event.target.value)}
                        className={cx("input")}
                      />
                    </div>
                    <div className={cx("field")}>
                      <label>Trạng thái</label>
                      <label className={cx("checkboxRow")}>
                        <input
                          type="checkbox"
                          checked={lessonForm.published}
                          onChange={(event) =>
                            handleLessonChange("published", event.target.checked)
                          }
                        />
                        <span>Công khai</span>
                      </label>
                    </div>
                  </div>

                  <div className={cx("lineEditor")}>
                    <div className={cx("lineEditorHead")}>
                      <h3>Câu hội thoại</h3>
                      <button type="button" className={cx("smallBtn")} onClick={addLine}>
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Thêm câu</span>
                      </button>
                    </div>

                    {(lessonForm.lines || []).map((line, index) => (
                      <div className={cx("lineForm")} key={index}>
                        <span className={cx("lineIndex")}>{index + 1}</span>
                        <textarea
                          value={line.japanese}
                          onChange={(event) =>
                            handleLineChange(index, "japanese", event.target.value)
                          }
                          placeholder="Tiếng Nhật"
                        />
                        <textarea
                          value={line.kana}
                          onChange={(event) =>
                            handleLineChange(index, "kana", event.target.value)
                          }
                          placeholder="Kana"
                        />
                        <textarea
                          value={line.vietnamese}
                          onChange={(event) =>
                            handleLineChange(index, "vietnamese", event.target.value)
                          }
                          placeholder="Nghĩa tiếng Việt"
                        />
                        <button
                          type="button"
                          className={cx("dangerIcon")}
                          onClick={() => removeLine(index)}
                          disabled={(lessonForm.lines || []).length <= 1}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className={cx("formActions")}>
                    <Button outline onClick={() => setLessonForm(null)}>
                      Hủy
                    </Button>
                    <Button primary onClick={saveLesson}>
                      Lưu bài hội thoại
                    </Button>
                  </div>
                </Card>
              )}

              <div className={cx("lessonList")}>
                {loading ? (
                  <Card className={cx("emptyCard")}>Đang tải dữ liệu...</Card>
                ) : filteredLessons.length === 0 ? (
                  <Card className={cx("emptyCard")}>Không có bài hội thoại phù hợp</Card>
                ) : (
                  filteredLessons.map((lesson) => (
                    <Card className={cx("lessonCard")} key={lesson.id}>
                      <div className={cx("lessonThumb")}>
                        {lesson.image ? (
                          <img src={lesson.image} alt={lesson.title} />
                        ) : (
                          <FontAwesomeIcon icon={faCommentDots} />
                        )}
                      </div>
                      <div className={cx("lessonInfo")}>
                        <div className={cx("lessonMeta")}>
                          <span>{lesson.level}</span>
                          <span>{lesson.category?.title || "Chưa có chủ đề"}</span>
                          <span>{lesson.lines?.length || 0} câu</span>
                          {lesson.published && (
                            <span className={cx("published")}>
                              <FontAwesomeIcon icon={faCheck} />
                              Công khai
                            </span>
                          )}
                        </div>
                        <h3>{lesson.title}</h3>
                        <p>{lesson.slug}</p>
                      </div>
                      <div className={cx("lessonActions")}>
                        <button type="button" onClick={() => startEditLesson(lesson)}>
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button type="button" onClick={() => handleDeleteLesson(lesson)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {toast && (
        <div className={cx("toast", toast.type)}>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminConversation;
