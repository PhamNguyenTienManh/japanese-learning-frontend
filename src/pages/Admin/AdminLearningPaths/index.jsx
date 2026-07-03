import { useCallback, useEffect, useState } from "react";
import classNames from "classnames/bind";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Edit3,
  Eye,
  ListChecks,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import learningPathService from "~/services/learningPathService";
import {
  FALLBACK_VOICEVOX_SPEAKERS,
  getVoicevoxSpeakers,
  mapVoicevoxSpeakersToOptions,
  uploadDialogueVoice,
  uploadVoice,
} from "~/services/textToSpeechService";
import { useToast } from "~/context/ToastContext";
import ImageUploadField from "~/pages/Admin/AdminTest/components/ImageUploadField";
import DialogueScriptEditor from "~/pages/Admin/AdminTest/components/DialogueScriptEditor";
import styles from "./AdminLearningPaths.module.scss";

const cx = classNames.bind(styles);

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const SKILLS = ["vocab", "grammar", "kanji", "reading", "writing", "conversation", "jlpt_exam"];
const PLACEMENT_SKILLS = ["vocab", "grammar", "listening"];
const GOALS = ["jlpt_exam", "conversation", "vocabulary", "writing"];
const PATH_PAGE_SIZE_OPTIONS = [10, 25, 50];
const QUESTION_PAGE_SIZE_OPTIONS = [10, 25, 50];
const PLACEMENT_TIME_OPTIONS = [
  { seconds: 30, label: "30 giây/câu" },
  { seconds: 45, label: "45 giây/câu" },
  { seconds: 60, label: "1 phút/câu" },
  { seconds: 90, label: "1.5 phút/câu" },
  { seconds: 120, label: "2 phút/câu" },
];
const MAIN_TABS = [
  { key: "paths", label: "Lộ trình cá nhân", icon: ListChecks },
  { key: "placement", label: "Placement Test", icon: ClipboardList },
];

function createDefaultPlacementAudioScript() {
  return {
    mode: "dialogue",
    pauseMs: 500,
    lines: [
      { speakerLabel: "A", speakerId: 2, text: "" },
      { speakerLabel: "B", speakerId: 13, text: "" },
    ],
  };
}

const emptyQuestion = {
  content: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  level: "N5",
  skill: "vocab",
  explanation: "",
  isActive: true,
  difficulty: "medium",
  tagsText: "",
  general: {
    audio: "",
    image: "",
    txt_read: "",
  },
};

function createEmptyPlacementMatrix() {
  return LEVELS.reduce((matrix, level) => {
    matrix[level] = PLACEMENT_SKILLS.reduce((skills, skill) => {
      skills[skill] = 0;
      return skills;
    }, {});
    return matrix;
  }, {});
}

function createEmptyPlacementLevelCounts() {
  return LEVELS.reduce((counts, level) => {
    counts[level] = 0;
    return counts;
  }, {});
}

function createDefaultPlacementConfig() {
  const skillCounts = createEmptyPlacementMatrix();
  const levelCounts = createEmptyPlacementLevelCounts();
  LEVELS.forEach((level) => {
    skillCounts[level] = { vocab: 2, grammar: 2, listening: 0 };
    levelCounts[level] = 4;
  });
  return {
    totalQuestions: 20,
    levelCounts,
    skillCounts,
    secondsPerQuestion: 90,
    isActive: true,
  };
}

function normalizePlacementConfig(config) {
  const nextConfig = {
    ...createDefaultPlacementConfig(),
    ...(config || {}),
    levelCounts: {
      ...createEmptyPlacementLevelCounts(),
      ...(config?.levelCounts || {}),
    },
    skillCounts: createEmptyPlacementMatrix(),
  };

  LEVELS.forEach((level) => {
    nextConfig.skillCounts[level] = {
      ...createEmptyPlacementMatrix()[level],
      ...(config?.skillCounts?.[level] || {}),
    };
  });

  return nextConfig;
}

function sumPlacementSkills(config, level) {
  return PLACEMENT_SKILLS.reduce(
    (total, skill) => total + Number(config?.skillCounts?.[level]?.[skill] || 0),
    0,
  );
}

function sumPlacementLevels(config) {
  return LEVELS.reduce(
    (total, level) => total + Number(config?.levelCounts?.[level] || 0),
    0,
  );
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(Number(seconds) || 0, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;
  if (!minutes) return `${restSeconds} giây`;
  return restSeconds ? `${minutes} phút ${restSeconds} giây` : `${minutes} phút`;
}

function formatDate(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa có" : date.toLocaleString("vi-VN");
}

function formatDateCompact(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Chưa có"
    : date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}

function formatGoal(goal) {
  const types = goal?.types?.length ? goal.types : [goal?.type].filter(Boolean);
  return types.length ? types.join(", ") : "-";
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value) || 0);
}

function getUserLabel(path) {
  return path?.user?.name || path?.user?.email || path?.userId || "User";
}

function clonePathForEdit(path) {
  if (!path) return null;
  return {
    ...path,
    goal: {
      ...(path.goal || {}),
      types: path.goal?.types?.length ? [...path.goal.types] : [path.goal?.type].filter(Boolean),
      focusSkills: [...(path.goal?.focusSkills || [])],
      examDate: path.goal?.examDate ? String(path.goal.examDate).slice(0, 10) : "",
    },
    weeklyPlans: (path.weeklyPlans || []).map((plan) => ({
      week: plan.week,
      items: (plan.items || []).map((item) => ({ ...item })),
    })),
  };
}

function toQuestionForm(question) {
  return {
    ...emptyQuestion,
    ...question,
    options: question?.options?.length === 4 ? [...question.options] : ["", "", "", ""],
    tagsText: (question?.tags || []).join(", "),
    general: {
      audio: question?.general?.audio || "",
      image: question?.general?.image || "",
      txt_read: question?.general?.txt_read || "",
      audioScript: question?.general?.audioScript || null,
    },
  };
}

function StatCard({ label, value, tone }) {
  return (
    <article className={cx("statCard", tone)}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AdminLearningPaths() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routePathId, questionId: routeQuestionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const isDetailMode = Boolean(routePathId);
  const isPlacementCreateMode = location.pathname.endsWith("/placement/new");
  const isPlacementEditMode = Boolean(routeQuestionId);
  const isPlacementFormMode = isPlacementCreateMode || isPlacementEditMode;
  const sectionParam = searchParams.get("section");
  const detailSection = ["review", "progress"].includes(sectionParam) ? sectionParam : "path";

  const [activeTab, setActiveTab] = useState("paths");
  const [paths, setPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [draftPath, setDraftPath] = useState(null);
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const [pathFilters, setPathFilters] = useState({ level: "", generationSource: "" });
  const [pathPage, setPathPage] = useState(1);
  const [pathLimit, setPathLimit] = useState(10);
  const [pathPagination, setPathPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [pathLoading, setPathLoading] = useState(false);
  const [pathSaving, setPathSaving] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [questionFilters, setQuestionFilters] = useState({ level: "", skill: "", isActive: "" });
  const [questionPage, setQuestionPage] = useState(1);
  const [questionLimit, setQuestionLimit] = useState(10);
  const [questionPagination, setQuestionPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [questionLoading, setQuestionLoading] = useState(false);
  const [audioInputType, setAudioInputType] = useState("link");
  const [speakerOptions, setSpeakerOptions] = useState(FALLBACK_VOICEVOX_SPEAKERS);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [placementConfig, setPlacementConfig] = useState(createDefaultPlacementConfig);
  const [placementAvailability, setPlacementAvailability] = useState({
    total: 0,
    levelCounts: createEmptyPlacementLevelCounts(),
    skillCounts: createEmptyPlacementMatrix(),
  });
  const [placementConfigLoading, setPlacementConfigLoading] = useState(false);
  const [placementConfigSaving, setPlacementConfigSaving] = useState(false);
  const [placementConfigModalOpen, setPlacementConfigModalOpen] = useState(false);

  const [reviewItems, setReviewItems] = useState([]);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const currentWeek = draftPath?.weeklyPlans?.[activeWeekIndex];
  const selectedReviewPath = selectedPath;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const openPathDetail = (id, section = "path") => {
    if (!id) return;
    const query = section === "path" ? "" : `?section=${section}`;
    navigate(`/admin/learning-paths/${id}${query}`);
  };

  const setDetailSection = (section) => {
    setSearchParams(section === "path" ? {} : { section });
  };

  const updatePathFilter = (key, value) => {
    setPathPage(1);
    setPathFilters((current) => ({ ...current, [key]: value }));
  };

  const updateQuestionFilter = (key, value) => {
    setQuestionPage(1);
    setQuestionFilters((current) => ({ ...current, [key]: value }));
  };

  const loadPathDetail = useCallback(async (id) => {
    if (!id) return;
    setPathLoading(true);
    setError("");
    try {
      const detail = await learningPathService.getAdminLearningPath(id);
      setSelectedPath(detail);
      setDraftPath(clonePathForEdit(detail));
      setReviewItems((detail.lastReview?.adjustedWeeklyItems || []).map((item) => ({ ...item })));
      setActiveWeekIndex(0);
    } catch (err) {
      setError(err?.message || "Không thể tải chi tiết lộ trình.");
    } finally {
      setPathLoading(false);
    }
  }, []);

  const loadPaths = useCallback(async () => {
    setPathLoading(true);
    setError("");
    try {
      const response = await learningPathService.getAdminLearningPaths({
        page: pathPage,
        limit: pathLimit,
        ...pathFilters,
      });
      const rows = response?.data || [];
      const pagination = response?.pagination || {};
      const totalPages = Math.max(Number(pagination.totalPages) || 1, 1);
      setPaths(rows);
      setPathPagination({
        page: Number(pagination.page) || pathPage,
        limit: Number(pagination.limit) || pathLimit,
        total: Number(pagination.total) || 0,
        totalPages,
      });
      if (pathPage > totalPages) {
        setPathPage(totalPages);
      }
    } catch (err) {
      setError(err?.message || "Không thể tải lộ trình.");
    } finally {
      setPathLoading(false);
    }
  }, [pathFilters, pathLimit, pathPage]);

  const loadQuestions = useCallback(async () => {
    setQuestionLoading(true);
    setError("");
    try {
      const response = await learningPathService.getAdminPlacementQuestions({
        page: questionPage,
        limit: questionLimit,
        ...questionFilters,
      });
      const pagination = response?.pagination || {};
      const totalPages = Math.max(Number(pagination.totalPages) || 1, 1);
      setQuestions(response?.data || []);
      setQuestionPagination({
        page: Number(pagination.page) || questionPage,
        limit: Number(pagination.limit) || questionLimit,
        total: Number(pagination.total) || 0,
        totalPages,
      });
      if (questionPage > totalPages) {
        setQuestionPage(totalPages);
      }
    } catch (err) {
      setError(err?.message || "Không thể tải câu hỏi placement.");
    } finally {
      setQuestionLoading(false);
    }
  }, [questionFilters, questionLimit, questionPage]);

  const loadPlacementConfig = useCallback(async () => {
    setPlacementConfigLoading(true);
    setError("");
    try {
      const response = await learningPathService.getAdminPlacementTestConfig();
      setPlacementConfig(normalizePlacementConfig(response?.config));
      setPlacementAvailability({
        total: Number(response?.availability?.total) || 0,
        levelCounts: {
          ...createEmptyPlacementLevelCounts(),
          ...(response?.availability?.levelCounts || {}),
        },
        skillCounts: normalizePlacementConfig({
          skillCounts: response?.availability?.skillCounts || {},
        }).skillCounts,
      });
    } catch (err) {
      setError(err?.message || "Không thể tải cấu hình placement test.");
    } finally {
      setPlacementConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaths();
  }, [loadPaths]);

  useEffect(() => {
    const loadSpeakers = async () => {
      try {
        const response = await getVoicevoxSpeakers();
        setSpeakerOptions(mapVoicevoxSpeakersToOptions(response));
      } catch {
        setSpeakerOptions(FALLBACK_VOICEVOX_SPEAKERS);
      }
    };

    loadSpeakers();
  }, []);

  useEffect(() => {
    if (!routePathId) {
      setSelectedPath(null);
      setDraftPath(null);
      setReviewItems([]);
      return;
    }
    setActiveTab("paths");
    loadPathDetail(routePathId);
  }, [loadPathDetail, routePathId]);

  useEffect(() => {
    if (isPlacementFormMode || searchParams.get("tab") === "placement") {
      setActiveTab("placement");
    }
  }, [isPlacementFormMode, searchParams]);

  useEffect(() => {
    if (activeTab === "placement" && !isPlacementFormMode) {
      loadQuestions();
      loadPlacementConfig();
    }
  }, [activeTab, isPlacementFormMode, loadPlacementConfig, loadQuestions]);

  useEffect(() => {
    if (!placementConfigModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [placementConfigModalOpen]);

  useEffect(() => {
    if (isPlacementCreateMode) {
      setEditingQuestionId("");
      setQuestionForm(emptyQuestion);
      setAudioInputType("link");
      return;
    }

    if (!isPlacementEditMode || !routeQuestionId) return;

    let isMounted = true;
    setQuestionLoading(true);
    setError("");
    learningPathService
      .getAdminPlacementQuestion(routeQuestionId)
      .then((question) => {
        if (!isMounted) return;
        setEditingQuestionId(question.id);
        setQuestionForm(toQuestionForm(question));
        setAudioInputType(question.general?.audioScript ? "dialogue" : "link");
      })
      .catch((err) => {
        if (!isMounted) return;
        const message = err?.message || "Không thể tải câu hỏi placement.";
        setError(message);
        addToast(message, "error");
      })
      .finally(() => {
        if (isMounted) setQuestionLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [addToast, isPlacementCreateMode, isPlacementEditMode, routeQuestionId]);

  const updateDraft = (patch) => {
    setDraftPath((current) => ({ ...current, ...patch }));
  };

  const updateGoal = (patch) => {
    setDraftPath((current) => ({
      ...current,
      goal: { ...(current?.goal || {}), ...patch },
    }));
  };

  const updateWeek = (weekIndex, updater) => {
    setDraftPath((current) => {
      const weeklyPlans = [...(current?.weeklyPlans || [])];
      weeklyPlans[weekIndex] = updater({ ...weeklyPlans[weekIndex], items: [...(weeklyPlans[weekIndex]?.items || [])] });
      return { ...current, weeklyPlans };
    });
  };

  const updateTask = (weekIndex, itemIndex, patch) => {
    updateWeek(weekIndex, (week) => {
      week.items[itemIndex] = { ...week.items[itemIndex], ...patch };
      return week;
    });
  };

  const addWeek = () => {
    setDraftPath((current) => {
      const weeklyPlans = [...(current?.weeklyPlans || [])];
      weeklyPlans.push({ week: weeklyPlans.length + 1, items: [] });
      return { ...current, weeklyPlans };
    });
    setActiveWeekIndex(draftPath?.weeklyPlans?.length || 0);
  };

  const deleteWeek = (weekIndex) => {
    setDraftPath((current) => {
      const weeklyPlans = (current?.weeklyPlans || [])
        .filter((_, index) => index !== weekIndex)
        .map((week, index) => ({ ...week, week: index + 1 }));
      return { ...current, weeklyPlans };
    });
    setActiveWeekIndex(0);
  };

  const addTask = () => {
    updateWeek(activeWeekIndex, (week) => ({
      ...week,
      items: [
        ...week.items,
        {
          skill: "vocab",
          title: "Task học mới",
          targetCount: 1,
          order: week.items.length + 1,
          estimatedMinutes: 15,
        },
      ],
    }));
  };

  const deleteTask = (itemIndex) => {
    updateWeek(activeWeekIndex, (week) => ({
      ...week,
      items: week.items.filter((_, index) => index !== itemIndex).map((item, index) => ({ ...item, order: index + 1 })),
    }));
  };

  const moveTask = (itemIndex, direction) => {
    updateWeek(activeWeekIndex, (week) => {
      const targetIndex = itemIndex + direction;
      if (targetIndex < 0 || targetIndex >= week.items.length) return week;
      const items = [...week.items];
      [items[itemIndex], items[targetIndex]] = [items[targetIndex], items[itemIndex]];
      return { ...week, items: items.map((item, index) => ({ ...item, order: index + 1 })) };
    });
  };

  const savePath = async () => {
    if (!draftPath) return;
    setPathSaving(true);
    setError("");
    try {
      const payload = {
        level: draftPath.level,
        currentWeek: draftPath.currentWeek,
        goal: draftPath.goal,
        weeklyPlans: draftPath.weeklyPlans,
      };
      const updated = await learningPathService.updateAdminLearningPath(draftPath.id, payload);
      setSelectedPath(updated);
      setDraftPath(clonePathForEdit(updated));
      await loadPaths();
      showNotice("Đã lưu lộ trình.");
    } catch (err) {
      setError(err?.message || "Không thể lưu lộ trình.");
    } finally {
      setPathSaving(false);
    }
  };

  const runReview = async (pathId = selectedReviewPath?.id) => {
    if (!pathId) return;
    setReviewBusy(true);
    setError("");
    try {
      await learningPathService.runAdminLearningPathReview(pathId);
      await loadPathDetail(pathId);
      await loadPaths();
      showNotice("Đã chạy AI review.");
    } catch (err) {
      setError(err?.message || "Không thể chạy AI review.");
    } finally {
      setReviewBusy(false);
    }
  };

  const applyReview = async () => {
    if (!selectedReviewPath?.id) return;
    setReviewBusy(true);
    setError("");
    try {
      await learningPathService.applyAdminLearningPathReview(selectedReviewPath.id, {
        confirmedItems: reviewItems,
      });
      await loadPathDetail(selectedReviewPath.id);
      await loadPaths();
      showNotice("Đã áp dụng đề xuất vào tuần tiếp theo.");
    } catch (err) {
      setError(err?.message || "Không thể áp dụng review.");
    } finally {
      setReviewBusy(false);
    }
  };

  const dismissReview = async () => {
    if (!selectedReviewPath?.id) return;
    setReviewBusy(true);
    setError("");
    try {
      await learningPathService.dismissAdminLearningPathReview(selectedReviewPath.id);
      await loadPathDetail(selectedReviewPath.id);
      await loadPaths();
      showNotice("Đã bỏ qua đề xuất.");
    } catch (err) {
      setError(err?.message || "Không thể bỏ qua đề xuất.");
    } finally {
      setReviewBusy(false);
    }
  };

  const updateQuestionOption = (optionIndex, value) => {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((item, itemIndex) => itemIndex === optionIndex ? value : item),
    }));
  };

  const updateQuestionGeneral = (field, value) => {
    setQuestionForm((current) => ({
      ...current,
      general: {
        ...(current.general || {}),
        [field]: value,
      },
    }));
  };

  const handleAudioInputTypeChange = (type) => {
    setAudioInputType(type);
    if (type === "dialogue" && !questionForm.general?.audioScript) {
      updateQuestionGeneral("audioScript", createDefaultPlacementAudioScript());
    }
  };

  const handleGenerateSingleAudio = async () => {
    const text = String(questionForm.general?.txt_read || "").trim();
    if (!text) {
      addToast("Vui lòng nhập đoạn đọc/script nghe trước khi tạo audio.", "warning");
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const result = await uploadVoice(text, 6);
      const audioUrl = result?.data?.audioUrl || result?.audioUrl;
      if (!audioUrl) throw new Error("Không nhận được URL audio");
      updateQuestionGeneral("audio", audioUrl);
      addToast("Tạo audio thành công.", "success");
    } catch (err) {
      addToast(err?.message || "Tạo audio thất bại.", "error");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleGenerateDialogueAudio = async () => {
    const audioScript = questionForm.general?.audioScript || createDefaultPlacementAudioScript();
    const lines = (audioScript.lines || []).map((line) => ({
      speakerLabel: line.speakerLabel || "",
      speakerId: Number(line.speakerId) || 6,
      text: String(line.text || "").trim(),
    }));
    const validLines = lines.filter((line) => line.text);

    if (!validLines.length) {
      addToast("Vui lòng nhập ít nhất 1 lời thoại trước khi tạo audio.", "warning");
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const result = await uploadDialogueVoice(validLines, audioScript.pauseMs || 500);
      const audioUrl = result?.data?.audioUrl || result?.audioUrl;
      if (!audioUrl) throw new Error("Không nhận được URL audio");
      updateQuestionGeneral("audio", audioUrl);
      updateQuestionGeneral("audioScript", {
        mode: "dialogue",
        pauseMs: audioScript.pauseMs || 500,
        lines,
      });
      addToast("Tạo audio hội thoại thành công.", "success");
    } catch (err) {
      addToast(err?.message || "Tạo audio hội thoại thất bại.", "error");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const validateQuestionForm = () => {
    const content = String(questionForm.content || "").trim();
    const explanation = String(questionForm.explanation || "").trim();
    const options = questionForm.options.map((option) => String(option || "").trim());

    if (!content) return "Nội dung câu hỏi không được để trống.";
    if (options.some((option) => !option)) return "Cần nhập đủ 4 đáp án.";
    if (!Number.isInteger(Number(questionForm.correctAnswer)) || Number(questionForm.correctAnswer) < 0 || Number(questionForm.correctAnswer) > 3) {
      return "Vui lòng chọn đáp án đúng.";
    }
    if (questionForm.skill === "listening" && !String(questionForm.general?.audio || "").trim() && !String(questionForm.general?.txt_read || "").trim()) {
      return "Câu hỏi listening cần có audio hoặc đoạn nghe.";
    }
    if (!explanation) return "Giải thích không được để trống.";
    return "";
  };

  const saveQuestion = async () => {
    const validationMessage = validateQuestionForm();
    if (validationMessage) {
      setError(validationMessage);
      addToast(validationMessage, "warning");
      return;
    }

    setQuestionLoading(true);
    setError("");
    const payload = {
      ...questionForm,
      correctAnswer: Number(questionForm.correctAnswer),
      general: {
        audio: questionForm.general?.audio || "",
        image: questionForm.general?.image || "",
        txt_read: questionForm.general?.txt_read || "",
        audioScript: questionForm.general?.audioScript || null,
      },
    };
    delete payload.tagsText;

    try {
      if (editingQuestionId) {
        await learningPathService.updateAdminPlacementQuestion(editingQuestionId, payload);
        addToast("Đã cập nhật câu hỏi placement.", "success");
      } else {
        await learningPathService.createAdminPlacementQuestion(payload);
        addToast("Đã thêm câu hỏi placement.", "success");
      }
      setQuestionForm(emptyQuestion);
      setEditingQuestionId("");
      navigate("/admin/learning-paths?tab=placement");
      await loadQuestions();
      await loadPlacementConfig();
    } catch (err) {
      const message = err?.message || "Không thể lưu câu hỏi placement.";
      setError(message);
      addToast(message, "error");
    } finally {
      setQuestionLoading(false);
    }
  };

  const deleteQuestion = async (question) => {
    const id = question?.id;
    if (!id) return;
    const ok = window.confirm(`Xóa mềm câu hỏi "${question.content}"? Câu hỏi sẽ chuyển sang trạng thái Inactive.`);
    if (!ok) return;

    setQuestionLoading(true);
    setError("");
    try {
      await learningPathService.deleteAdminPlacementQuestion(id);
      await loadQuestions();
      await loadPlacementConfig();
      addToast("Đã xóa mềm câu hỏi placement.", "success");
    } catch (err) {
      const message = err?.message || "Không thể xóa câu hỏi placement.";
      setError(message);
      addToast(message, "error");
    } finally {
      setQuestionLoading(false);
    }
  };

  const updatePlacementLevelCount = (level, value) => {
    setPlacementConfig((current) => ({
      ...current,
      levelCounts: {
        ...(current.levelCounts || {}),
        [level]: Math.max(Number(value) || 0, 0),
      },
    }));
  };

  const updatePlacementSkillCount = (level, skill, value) => {
    setPlacementConfig((current) => ({
      ...current,
      skillCounts: {
        ...(current.skillCounts || {}),
        [level]: {
          ...(current.skillCounts?.[level] || {}),
          [skill]: Math.max(Number(value) || 0, 0),
        },
      },
    }));
  };

  const updatePlacementSecondsPerQuestion = (value) => {
    setPlacementConfig((current) => ({
      ...current,
      secondsPerQuestion: Number(value) || 90,
    }));
  };

  const getPlacementConfigClientErrors = () => {
    const errors = [];
    const levelTotal = sumPlacementLevels(placementConfig);
    if (levelTotal < 1) {
      errors.push("Tổng số câu theo level phải lớn hơn 0.");
    }

    LEVELS.forEach((level) => {
      const skillTotal = sumPlacementSkills(placementConfig, level);
      const levelCount = Number(placementConfig.levelCounts?.[level] || 0);
      if (skillTotal !== levelCount) {
        errors.push(`${level}: tổng skill (${skillTotal}) phải bằng số câu level (${levelCount}).`);
      }

      PLACEMENT_SKILLS.forEach((skill) => {
        const requested = Number(placementConfig.skillCounts?.[level]?.[skill] || 0);
        const available = Number(placementAvailability.skillCounts?.[level]?.[skill] || 0);
        if (requested > available) {
          errors.push(`${level} ${skill}: cần ${requested}, hiện có ${available} câu active.`);
        }
      });
    });

    return errors;
  };

  const savePlacementConfig = async () => {
    const clientErrors = getPlacementConfigClientErrors();
    if (clientErrors.length) {
      addToast(clientErrors[0], "warning");
      return;
    }

    setPlacementConfigSaving(true);
    setError("");
    try {
      const response = await learningPathService.updateAdminPlacementTestConfig({
        ...placementConfig,
        totalQuestions: sumPlacementLevels(placementConfig),
        isActive: true,
      });
      setPlacementConfig(normalizePlacementConfig(response?.config));
      setPlacementAvailability({
        total: Number(response?.availability?.total) || 0,
        levelCounts: {
          ...createEmptyPlacementLevelCounts(),
          ...(response?.availability?.levelCounts || {}),
        },
        skillCounts: normalizePlacementConfig({
          skillCounts: response?.availability?.skillCounts || {},
        }).skillCounts,
      });
      addToast("Đã lưu cấu hình placement test.", "success");
      setPlacementConfigModalOpen(false);
    } catch (err) {
      const message = err?.message || "Không thể lưu cấu hình placement test.";
      setError(message);
      addToast(message, "error");
    } finally {
      setPlacementConfigSaving(false);
    }
  };

  const renderPathTable = () => {
    const total = pathPagination.total || 0;
    const totalPages = Math.max(pathPagination.totalPages || 1, 1);
    const currentPage = Math.min(pathPage, totalPages);
    const showingFrom = total === 0 ? 0 : (currentPage - 1) * pathLimit + 1;
    const showingTo = Math.min(currentPage * pathLimit, total);

    return (
    <section className={cx("detailPanel", "listTablePanel")}>
      <div className={cx("detailHeader")}>
        <div>
          <h2>Danh sách lộ trình cá nhân</h2>
          <p>{formatNumber(total)} lộ trình theo từng user</p>
        </div>
        <div className={cx("tableHeaderTools")}>
          <div className={cx("filters", "tableFilters")}>
            <select value={pathFilters.level} onChange={(e) => updatePathFilter("level", e.target.value)}>
              <option value="">Tất cả level</option>
              {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
            <select value={pathFilters.generationSource} onChange={(e) => updatePathFilter("generationSource", e.target.value)}>
              <option value="">Mọi nguồn tạo</option>
              <option value="ai">AI</option>
              <option value="fallback">Hệ thống</option>
            </select>
          </div>
          <button type="button" onClick={loadPaths} disabled={pathLoading}>
            <RefreshCw size={16} />
            <span>{pathLoading ? "Đang tải" : "Tải lại"}</span>
          </button>
        </div>
      </div>

      <div className={cx("tableWrap", "pathTableWrap")}>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Level / mục tiêu</th>
              <th>Tuần</th>
              <th>Tiến độ</th>
              <th>Nguồn</th>
              <th>AI review</th>
              <th>Cập nhật</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paths.map((path) => {
              const progress = path.progress || {};
              return (
                <tr key={path.id}>
                  <td>
                    <strong>{getUserLabel(path)}</strong>
                    <small>{path.user?.email || path.userId}</small>
                  </td>
                  <td>
                    <strong>{path.level}</strong>
                    <small>{formatGoal(path.goal)}</small>
                  </td>
                  <td>
                    <strong>Tuần {path.currentWeek || 1}</strong>
                    <small>{path.weeklyPlanCount || 0} tuần trong lộ trình</small>
                  </td>
                  <td>
                    <div className={cx("tableProgress")}>
                      <span>{progress.totalPercent || 0}%</span>
                      <i><b style={{ width: `${progress.totalPercent || 0}%` }} /></i>
                    </div>
                    <small>{progress.completedItems || 0}/{progress.totalItems || 0} task</small>
                  </td>
                  <td>
                    <span className={cx("sourceBadge", path.generationSource)}>{path.generationSource || "fallback"}</span>
                  </td>
                  <td>
                    <span className={cx("statusPill", path.lastReview ? "success" : "muted")}>
                      {path.lastReview ? "Đã có review" : "Chưa có"}
                    </span>
                    {path.lastReview?.reviewedAt && <small>{formatDateCompact(path.lastReview.reviewedAt)}</small>}
                  </td>
                  <td>{formatDateCompact(path.updatedAt)}</td>
                  <td>
                    <div className={cx("rowActions", "pathActions")}>
                      <button type="button" onClick={() => openPathDetail(path.id)} title="Xem lộ trình chi tiết">
                        <Eye size={15} />
                      </button>
                      <button type="button" onClick={() => openPathDetail(path.id, "review")} title="Xem AI review">
                        <Bot size={15} />
                      </button>
                      <button type="button" onClick={() => openPathDetail(path.id, "progress")} title="Xem tiến độ học">
                        <Activity size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!pathLoading && paths.length === 0 && <div className={cx("empty")}>Chưa có lộ trình.</div>}
      </div>

      <div className={cx("paginationBar")}>
        <span>
          Hiển thị {formatNumber(showingFrom)}-{formatNumber(showingTo)} trên {formatNumber(total)} lộ trình
        </span>
        <div className={cx("paginationControls")}>
          <select
            value={pathLimit}
            onChange={(e) => {
              setPathLimit(Number(e.target.value));
              setPathPage(1);
            }}
          >
            {PATH_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size} / trang</option>
            ))}
          </select>
          <button type="button" disabled={currentPage <= 1 || pathLoading} onClick={() => setPathPage((page) => Math.max(page - 1, 1))}>
            Trước
          </button>
          <strong>Trang {formatNumber(currentPage)} / {formatNumber(totalPages)}</strong>
          <button type="button" disabled={currentPage >= totalPages || pathLoading} onClick={() => setPathPage((page) => Math.min(page + 1, totalPages))}>
            Sau
          </button>
        </div>
      </div>
    </section>
    );
  };

  const renderPathEditor = () => {
    if (!draftPath) return <section className={cx("detailPanel", "empty")}>Chọn một lộ trình.</section>;
    return (
      <section className={cx("detailPanel")}>
        <div className={cx("detailHeader")}>
          <div>
            <h2>{getUserLabel(draftPath)}</h2>
            <p>{draftPath.user?.email || draftPath.userId}</p>
          </div>
          <button type="button" className={cx("primaryBtn")} onClick={savePath} disabled={pathSaving}>
            <Save size={16} />
            <span>{pathSaving ? "Đang lưu" : "Lưu lộ trình"}</span>
          </button>
        </div>

        <div className={cx("summaryGrid")}>
          <StatCard label="Nguồn tạo" value={draftPath.generationSource || "fallback"} tone="blue" />
          <StatCard label="Streak" value={`${draftPath.streakDays || 0} ngày`} tone="green" />
          <StatCard label="Tuần hiện tại" value={draftPath.currentWeek || 1} tone="orange" />
          <StatCard label="Cập nhật" value={formatDateCompact(draftPath.updatedAt)} tone="rose" />
        </div>

        <div className={cx("formGrid")}>
          <label>
            Level
            <select value={draftPath.level || "N5"} onChange={(e) => updateDraft({ level: e.target.value })}>
              {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </label>
          <label>
            Goal chính
            <select value={draftPath.goal?.type || "jlpt_exam"} onChange={(e) => updateGoal({ type: e.target.value, types: [e.target.value] })}>
              {GOALS.map((goal) => <option key={goal} value={goal}>{goal}</option>)}
            </select>
          </label>
          <label>
            Ngày thi
            <input type="date" value={draftPath.goal?.examDate || ""} onChange={(e) => updateGoal({ examDate: e.target.value })} />
          </label>
          <label>
            Phút/ngày
            <input type="number" min="5" value={draftPath.goal?.dailyMinutes || 30} onChange={(e) => updateGoal({ dailyMinutes: Number(e.target.value) })} />
          </label>
          <label>
            Current week
            <input type="number" min="1" value={draftPath.currentWeek || 1} onChange={(e) => updateDraft({ currentWeek: Number(e.target.value) })} />
          </label>
          <label className={cx("wideField")}>
            Kỹ năng ưu tiên
            <div className={cx("checkGrid")}>
              {SKILLS.map((skill) => (
                <span key={skill}>
                  <input
                    type="checkbox"
                    checked={draftPath.goal?.focusSkills?.includes(skill) || false}
                    onChange={(e) => {
                      const current = new Set(draftPath.goal?.focusSkills || []);
                      e.target.checked ? current.add(skill) : current.delete(skill);
                      updateGoal({ focusSkills: [...current] });
                    }}
                  />
                  {skill}
                </span>
              ))}
            </div>
          </label>
        </div>

        <div className={cx("weekToolbar")}>
          <div className={cx("weekTabs")}>
            {(draftPath.weeklyPlans || []).map((week, index) => (
              <button key={`${week.week}-${index}`} type="button" className={cx({ active: index === activeWeekIndex })} onClick={() => setActiveWeekIndex(index)}>
                Tuần {week.week}
              </button>
            ))}
          </div>
          <button type="button" onClick={addWeek}>
            <Plus size={16} />
            <span>Thêm tuần</span>
          </button>
          {currentWeek && (
            <button type="button" className={cx("dangerBtn")} onClick={() => deleteWeek(activeWeekIndex)}>
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {currentWeek && (
          <div className={cx("taskPanel")}>
            <div className={cx("taskHeader")}>
              <div>
                <h3>Items tuần {currentWeek.week}</h3>
                <p>Task trong tuần học thật của user</p>
              </div>
              <button type="button" onClick={addTask}>
                <Plus size={16} />
                <span>Thêm task</span>
              </button>
            </div>
            <div className={cx("taskList")}>
              <div className={cx("taskGridHead")}>
                <span>Thứ tự</span>
                <span>Skill</span>
                <span>Tiêu đề</span>
                <span>Target</span>
                <span>Phút</span>
                <span>Hoàn thành</span>
                <span></span>
              </div>
              {(currentWeek.items || []).map((item, index) => (
                <div key={`${item.order}-${index}`} className={cx("taskRow")}>
                  <div className={cx("orderTools")}>
                    <button type="button" onClick={() => moveTask(index, -1)} disabled={index === 0}><ChevronUp size={15} /></button>
                    <span>{index + 1}</span>
                    <button type="button" onClick={() => moveTask(index, 1)} disabled={index === currentWeek.items.length - 1}><ChevronDown size={15} /></button>
                  </div>
                  <select value={item.skill || "vocab"} onChange={(e) => updateTask(activeWeekIndex, index, { skill: e.target.value })}>
                    {SKILLS.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
                  </select>
                  <input value={item.title || ""} onChange={(e) => updateTask(activeWeekIndex, index, { title: e.target.value })} />
                  <input type="number" min="1" value={item.targetCount || 1} onChange={(e) => updateTask(activeWeekIndex, index, { targetCount: Number(e.target.value) })} />
                  <input type="number" min="1" value={item.estimatedMinutes || 15} onChange={(e) => updateTask(activeWeekIndex, index, { estimatedMinutes: Number(e.target.value) })} />
                  <button type="button" onClick={() => updateTask(activeWeekIndex, index, { completedAt: undefined })} disabled={!item.completedAt}>
                    <X size={15} />
                    <span>Reset</span>
                  </button>
                  <button type="button" className={cx("dangerBtn")} onClick={() => deleteTask(index)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {currentWeek.items?.length === 0 && <div className={cx("empty")}>Tuần này chưa có task.</div>}
            </div>
          </div>
        )}
      </section>
    );
  };

  const renderPathsTab = () => (isDetailMode ? renderPathDetailPage() : renderPathTable());

  const renderDetailReviewPanel = () => {
    const path = selectedPath;
    return (
      <section className={cx("detailPanel")}>
        <div className={cx("detailHeader")}>
          <div>
            <h2>AI Review</h2>
            <p>{path ? getUserLabel(path) : "Đang tải dữ liệu review"}</p>
          </div>
          <button type="button" className={cx("primaryBtn")} onClick={() => runReview(path?.id)} disabled={!path || reviewBusy}>
            <Bot size={16} />
            <span>{reviewBusy ? "Đang chạy" : "Chạy AI review"}</span>
          </button>
        </div>

        {!path?.lastReview ? (
          <div className={cx("empty")}>Chưa có AI review cho lộ trình này.</div>
        ) : (
          <>
            <div className={cx("reviewBox")}>
              <span className={cx("statusPill", path.lastReview.onTrack ? "success" : "warning")}>
                {path.lastReview.onTrack ? "Đúng tiến độ" : "Cần điều chỉnh"}
              </span>
              <p>{path.lastReview.assessment}</p>
              <small>{formatDate(path.lastReview.reviewedAt)}</small>
            </div>

            <div className={cx("suggestionGrid")}>
              {(path.lastReview.suggestions || []).map((suggestion, index) => (
                <article key={`${suggestion.type}-${index}`}>
                  <strong>{suggestion.type}</strong>
                  <span>{suggestion.skill || "general"}</span>
                  <p>{suggestion.reason}</p>
                </article>
              ))}
            </div>

            <div className={cx("taskPanel")}>
              <div className={cx("taskHeader")}>
                <div>
                  <h3>Adjusted weekly items</h3>
                  <p>Danh sách này sẽ replace items của tuần tiếp theo khi apply</p>
                </div>
                <button type="button" onClick={() => setReviewItems((items) => [...items, { skill: "vocab", title: "Task đề xuất", targetCount: 1, estimatedMinutes: 15 }])}>
                  <Plus size={16} />
                  <span>Thêm</span>
                </button>
              </div>
              <div className={cx("taskList")}>
                <div className={cx("taskGridHead", "reviewTaskGridHead")}>
                  <span>Skill</span>
                  <span>Tiêu đề</span>
                  <span>Target</span>
                  <span>Phút</span>
                  <span></span>
                </div>
                {reviewItems.map((item, index) => (
                  <div key={`${item.skill}-${index}`} className={cx("taskRow", "reviewTaskRow")}>
                    <select value={item.skill || "vocab"} onChange={(e) => setReviewItems((items) => items.map((row, rowIndex) => rowIndex === index ? { ...row, skill: e.target.value } : row))}>
                      {SKILLS.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
                    </select>
                    <input value={item.title || ""} onChange={(e) => setReviewItems((items) => items.map((row, rowIndex) => rowIndex === index ? { ...row, title: e.target.value } : row))} />
                    <input type="number" min="1" value={item.targetCount || 1} onChange={(e) => setReviewItems((items) => items.map((row, rowIndex) => rowIndex === index ? { ...row, targetCount: Number(e.target.value) } : row))} />
                    <input type="number" min="1" value={item.estimatedMinutes || 15} onChange={(e) => setReviewItems((items) => items.map((row, rowIndex) => rowIndex === index ? { ...row, estimatedMinutes: Number(e.target.value) } : row))} />
                    <button type="button" className={cx("dangerBtn")} onClick={() => setReviewItems((items) => items.filter((_, rowIndex) => rowIndex !== index))}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <div className={cx("actionBar")}>
                <button type="button" className={cx("primaryBtn")} onClick={applyReview} disabled={reviewBusy || reviewItems.length === 0}>
                  <Check size={16} />
                  <span>Apply tuần tiếp theo</span>
                </button>
                <button type="button" onClick={dismissReview} disabled={reviewBusy}>
                  <X size={16} />
                  <span>Bỏ qua</span>
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    );
  };

  const renderDetailProgressPanel = () => {
    const path = selectedPath;
    const detail = path?.progressDetail || {};
    const plan = detail.plan || path?.progress || {};
    const cards = detail.cards || {};
    const resources = detail.resources || {};
    const exams = detail.exams || {};

    return (
      <section className={cx("detailPanel")}>
        <div className={cx("detailHeader")}>
          <div>
            <h2>Tiến độ học</h2>
            <p>{path ? getUserLabel(path) : "Đang tải dữ liệu tiến độ"}</p>
          </div>
          <span className={cx("statusPill", plan.isBehind ? "warning" : "success")}>
            {plan.isBehind ? "Chậm tiến độ" : "Ổn"}
          </span>
        </div>

        <div className={cx("summaryGrid")}>
          <StatCard label="Tuần hiện tại" value={plan.currentWeek || path?.currentWeek || 1} tone="blue" />
          <StatCard label="Tuần này" value={`${plan.currentWeekPercent || 0}%`} tone="green" />
          <StatCard label="Tổng lộ trình" value={`${plan.totalPercent || 0}%`} tone="orange" />
          <StatCard label="Ngày đã qua" value={plan.daysElapsed || 0} tone="rose" />
        </div>

        <div className={cx("progressCards")}>
          <article>
            <h3>Task trong lộ trình</h3>
            <p>Tuần này: {plan.currentWeekCompleted || 0}/{plan.currentWeekTotal || 0} task</p>
            <p>Tổng: {plan.completedItems || 0}/{plan.totalItems || 0} task</p>
            <p>Tuần kỳ vọng: {plan.expectedWeek || "-"}</p>
          </article>

          <article>
            <h3>Flashcard JLPT</h3>
            {["vocab", "grammar", "kanji"].map((skill) => {
              const known = cards?.[skill]?.known || 0;
              const unknown = cards?.[skill]?.unknown || 0;
              return <p key={skill}>{skill}: {known}/{known + unknown} đã biết</p>;
            })}
          </article>

          <article>
            <h3>Reading / Writing</h3>
            <p>reading: {resources?.reading?.completedResources || 0} tài nguyên</p>
            <p>writing: {resources?.writing?.completedResources || 0} tài nguyên</p>
            <p>Cập nhật reading: {formatDateCompact(resources?.reading?.lastUpdatedAt)}</p>
          </article>

          <article>
            <h3>Exam</h3>
            <p>Lượt làm: {exams.attemptCount || 0}</p>
            <p>Đạt: {exams.passedCount || 0}</p>
            <p>Điểm TB: {exams.averageScore ?? "-"}</p>
            <p>Điểm cao nhất: {exams.bestScore ?? "-"}</p>
          </article>
        </div>
      </section>
    );
  };

  const renderPathDetailPage = () => (
    <div className={cx("detailPage")}>
      <div className={cx("detailNav")}>
        <button type="button" onClick={() => navigate("/admin/learning-paths")}>
          <ArrowLeft size={16} />
          <span>Danh sách lộ trình</span>
        </button>
        <div className={cx("detailSwitch")}>
          <button type="button" className={cx({ active: detailSection === "path" })} onClick={() => setDetailSection("path")}>
            <ListChecks size={16} />
            <span>Lộ trình chi tiết</span>
          </button>
          <button type="button" className={cx({ active: detailSection === "review" })} onClick={() => setDetailSection("review")}>
            <Bot size={16} />
            <span>AI review</span>
          </button>
          <button type="button" className={cx({ active: detailSection === "progress" })} onClick={() => setDetailSection("progress")}>
            <Activity size={16} />
            <span>Tiến độ học</span>
          </button>
        </div>
      </div>

      {pathLoading && !draftPath ? (
        <section className={cx("detailPanel", "empty")}>Đang tải chi tiết lộ trình.</section>
      ) : detailSection === "review" ? (
        renderDetailReviewPanel()
      ) : detailSection === "progress" ? (
        renderDetailProgressPanel()
      ) : (
        renderPathEditor()
      )}
    </div>
  );

  const renderPlacementFormPage = () => (
    <div className={cx("detailPage")}>
      <div className={cx("detailNav")}>
        <button type="button" onClick={() => navigate("/admin/learning-paths?tab=placement")}>
          <ArrowLeft size={16} />
          <span>Danh sách câu hỏi</span>
        </button>
      </div>

      <section className={cx("detailPanel")}>
        <div className={cx("detailHeader")}>
          <div>
            <h2>{editingQuestionId ? "Sửa câu hỏi placement" : "Thêm câu hỏi placement"}</h2>
            <p>Quản lý nội dung placement test đầu vào</p>
          </div>
          <button type="button" className={cx("primaryBtn")} onClick={saveQuestion} disabled={questionLoading}>
            <Save size={16} />
            <span>{questionLoading ? "Đang lưu" : "Lưu câu hỏi"}</span>
          </button>
        </div>
        <div className={cx("placementForm")}>
          <aside className={cx("placementPreview")}>
            <div className={cx("placementPreviewHeader")}>
              <div>
                <span>Preview</span>
                <h3>Câu hỏi placement</h3>
              </div>
              <span className={cx("levelBadge", questionForm.level)}>{questionForm.level}</span>
            </div>
            <div className={cx("placementPreviewMeta")}>
              <span>{questionForm.skill}</span>
              <span>{questionForm.difficulty}</span>
              <span>{questionForm.isActive ? "Active" : "Inactive"}</span>
            </div>
            {questionForm.general?.txt_read && (
              <div className={cx("placementPreviewPassage")}>{questionForm.general.txt_read}</div>
            )}
            {questionForm.general?.image && (
              <div className={cx("placementPreviewImage")}>
                <img src={questionForm.general.image} alt="Placement" />
              </div>
            )}
            {questionForm.general?.audio && (
              <audio className={cx("placementPreviewAudio")} controls src={questionForm.general.audio} />
            )}
            <div className={cx("placementPreviewQuestion")}>
              {questionForm.content || "Nội dung câu hỏi sẽ hiển thị tại đây."}
            </div>
            <div className={cx("placementPreviewOptions")}>
              {questionForm.options.map((option, index) => (
                <div key={index} className={cx("placementPreviewOption", { correct: Number(questionForm.correctAnswer) === index })}>
                  <span>{String.fromCharCode(65 + index)}</span>
                  <p>{option || `Đáp án ${String.fromCharCode(65 + index)}`}</p>
                </div>
              ))}
            </div>
            {questionForm.explanation && (
              <div className={cx("placementPreviewExplanation")}>
                <strong>Giải thích</strong>
                <p>{questionForm.explanation}</p>
              </div>
            )}
          </aside>

          <div className={cx("placementEditor")}>
          <article className={cx("placementCard", "questionCard")}>
            <div className={cx("placementCardHeader")}>
              <div>
                <span>Câu hỏi</span>
                <h3>Nội dung placement</h3>
              </div>
              <span className={cx("levelBadge", questionForm.level)}>{questionForm.level}</span>
            </div>
            <label className={cx("placementField")}>
              <span>Nội dung câu hỏi <b>*</b></span>
              <textarea
                rows="5"
                placeholder="Nhập nội dung câu hỏi..."
                value={questionForm.content}
                onChange={(e) => setQuestionForm((current) => ({ ...current, content: e.target.value }))}
              />
            </label>
          </article>

          <article className={cx("placementCard", "mediaCard")}>
            <div className={cx("placementCardHeader")}>
              <div>
                <span>Media</span>
                <h3>Nghe, hình ảnh và đoạn đọc</h3>
              </div>
            </div>
            <div className={cx("placementMetaGrid")}>
              <ImageUploadField
                label="Ảnh minh họa"
                placeholder="Nhập URL ảnh hoặc upload ảnh"
                value={questionForm.general?.image || ""}
                onChange={(nextUrl) => updateQuestionGeneral("image", nextUrl)}
                onSuccess={(message) => addToast(message, "success")}
                onError={(message) => addToast(message, "error")}
              />
              <label className={cx("placementField")}>
                <span>Đoạn đọc / script nghe</span>
                <textarea
                  rows="4"
                  placeholder="Nhập đoạn đọc hoặc transcript nghe nếu có..."
                  value={questionForm.general?.txt_read || ""}
                  onChange={(e) => updateQuestionGeneral("txt_read", e.target.value)}
                />
              </label>
              <div className={cx("placementAudioBox")}>
                <span className={cx("placementAudioLabel")}>Audio</span>
                <div className={cx("audioTypeSelector")}>
                  <label>
                    <input
                      type="radio"
                      name="placement-audio-type"
                      checked={audioInputType === "link"}
                      onChange={() => handleAudioInputTypeChange("link")}
                    />
                    <span>Gắn link</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="placement-audio-type"
                      checked={audioInputType === "generate"}
                      onChange={() => handleAudioInputTypeChange("generate")}
                    />
                    <span>Đơn thoại</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="placement-audio-type"
                      checked={audioInputType === "dialogue"}
                      onChange={() => handleAudioInputTypeChange("dialogue")}
                    />
                    <span>Hội thoại</span>
                  </label>
                </div>

                {audioInputType === "link" && (
                  <input
                    className={cx("placementAudioInput")}
                    placeholder="Nhập URL audio..."
                    value={questionForm.general?.audio || ""}
                    onChange={(e) => updateQuestionGeneral("audio", e.target.value)}
                  />
                )}

                {audioInputType === "generate" && (
                  <div className={cx("generateAudioSection")}>
                    <p>Audio sẽ được tạo từ đoạn đọc/script nghe bên trên bằng VoiceVox.</p>
                    <button type="button" className={cx("darkBtn")} onClick={handleGenerateSingleAudio} disabled={isGeneratingAudio}>
                      {isGeneratingAudio ? "Đang tạo..." : "Tạo audio"}
                    </button>
                  </div>
                )}

                {audioInputType === "dialogue" && (
                  <div className={cx("generateAudioSection")}>
                    <DialogueScriptEditor
                      lines={(questionForm.general?.audioScript || createDefaultPlacementAudioScript()).lines}
                      pauseMs={(questionForm.general?.audioScript || createDefaultPlacementAudioScript()).pauseMs}
                      speakerOptions={speakerOptions}
                      disabled={isGeneratingAudio}
                      onLinesChange={(nextLines) => updateQuestionGeneral("audioScript", {
                        ...(questionForm.general?.audioScript || createDefaultPlacementAudioScript()),
                        mode: "dialogue",
                        lines: nextLines,
                      })}
                      onPauseMsChange={(nextPauseMs) => updateQuestionGeneral("audioScript", {
                        ...(questionForm.general?.audioScript || createDefaultPlacementAudioScript()),
                        mode: "dialogue",
                        pauseMs: nextPauseMs,
                      })}
                    />
                    <button type="button" className={cx("darkBtn")} onClick={handleGenerateDialogueAudio} disabled={isGeneratingAudio}>
                      {isGeneratingAudio ? "Đang tạo..." : "Tạo audio hội thoại"}
                    </button>
                  </div>
                )}

                {questionForm.general?.audio && (
                  <audio className={cx("placementPreviewAudio")} controls src={questionForm.general.audio} />
                )}
              </div>
            </div>
          </article>

          <article className={cx("placementCard", "answerCard")}>
            <div className={cx("placementCardHeader")}>
              <div>
                <span>Đáp án</span>
                <h3>Chọn đáp án đúng</h3>
              </div>
              <small>{String.fromCharCode(65 + Number(questionForm.correctAnswer || 0))} là đáp án đúng</small>
            </div>
            <div className={cx("placementOptions")}>
              {questionForm.options.map((option, index) => (
                <div key={index} className={cx("placementOption", { correct: Number(questionForm.correctAnswer) === index })}>
                  <label>
                    <input
                      type="radio"
                      name="placement-correct-answer"
                      checked={Number(questionForm.correctAnswer) === index}
                      onChange={() => setQuestionForm((current) => ({ ...current, correctAnswer: index }))}
                    />
                    <span>{String.fromCharCode(65 + index)}</span>
                  </label>
                  <input
                    placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                    value={option}
                    onChange={(e) => updateQuestionOption(index, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </article>

          <article className={cx("placementCard", "metaCard")}>
            <div className={cx("placementCardHeader")}>
              <div>
                <span>Thiết lập</span>
                <h3>Phân loại câu hỏi</h3>
              </div>
            </div>
            <div className={cx("placementMetaGrid")}>
              <label className={cx("placementField")}>
                <span>Level</span>
                <select value={questionForm.level} onChange={(e) => setQuestionForm((current) => ({ ...current, level: e.target.value }))}>
                  {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </label>
              <label className={cx("placementField")}>
                <span>Skill</span>
                <select value={questionForm.skill} onChange={(e) => setQuestionForm((current) => ({ ...current, skill: e.target.value }))}>
                  {PLACEMENT_SKILLS.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
                </select>
              </label>
              <label className={cx("placementField")}>
                <span>Difficulty</span>
                <select value={questionForm.difficulty} onChange={(e) => setQuestionForm((current) => ({ ...current, difficulty: e.target.value }))}>
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </label>
              <label className={cx("placementToggle")}>
                <input type="checkbox" checked={questionForm.isActive} onChange={(e) => setQuestionForm((current) => ({ ...current, isActive: e.target.checked }))} />
                <span>Active</span>
              </label>
            </div>
          </article>

          <article className={cx("placementCard", "explainCard")}>
            <div className={cx("placementCardHeader")}>
              <div>
                <span>Giải thích</span>
                <h3>Phản hồi sau khi làm bài</h3>
              </div>
            </div>
            <label className={cx("placementField")}>
              <span>Giải thích <b>*</b></span>
              <textarea
                rows="4"
                placeholder="Nhập giải thích ngắn gọn..."
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm((current) => ({ ...current, explanation: e.target.value }))}
              />
            </label>
          </article>
          </div>
        </div>
      </section>
    </div>
  );

  const renderPlacementConfigPanel = () => {
    const configuredLevelTotal = sumPlacementLevels(placementConfig);
    const configErrors = getPlacementConfigClientErrors();
    const placementTotalSeconds = configuredLevelTotal * Number(placementConfig.secondsPerQuestion || 90);

    return (
      <>
        <section className={cx("detailPanel", "placementConfigPanel")}>
          <div className={cx("placementConfigCompact")}>
            <div>
              <span className={cx("compactEyebrow")}>Placement test</span>
              <h2>Cấu hình random đề</h2>
              <p>
                {formatNumber(configuredLevelTotal)} câu trong bộ test,
                {" "}
                {formatNumber(placementAvailability.total)} câu active trong ngân hàng.
              </p>
            </div>
            <div className={cx("placementConfigMetrics")}>
              <StatCard label="Số câu test" value={configuredLevelTotal} tone="blue" />
              <StatCard label="Trạng thái" value={configErrors.length ? "Cần sửa" : "Hợp lệ"} tone={configErrors.length ? "rose" : "green"} />
            </div>
            <div className={cx("placementConfigActions")}>
              <button type="button" className={cx("primaryBtn")} onClick={() => setPlacementConfigModalOpen(true)}>
                <SlidersHorizontal size={16} />
                <span>Cấu hình</span>
              </button>
            </div>
          </div>
        </section>

        {placementConfigModalOpen && (
          <div className={cx("modalOverlay")} role="presentation" onMouseDown={() => setPlacementConfigModalOpen(false)}>
            <section className={cx("placementConfigModal")} role="dialog" aria-modal="true" aria-labelledby="placement-config-title" onMouseDown={(e) => e.stopPropagation()}>
              <div className={cx("modalHeader")}>
                <div>
                  <span>Cấu hình đề test đầu vào</span>
                  <h2 id="placement-config-title">Random theo level và kỹ năng</h2>
                  <p>
                    Đề sẽ được random từ ngân hàng câu hỏi active theo ma trận bên dưới.
                  </p>
                </div>
                <button type="button" onClick={() => setPlacementConfigModalOpen(false)} title="Đóng">
                  <X size={18} />
                </button>
              </div>

              <div className={cx("placementConfigSummary")}>
                <StatCard label="Số câu test" value={configuredLevelTotal} tone="blue" />
                <StatCard label="Câu hỏi active" value={placementAvailability.total} tone="blue" />
                <article className={cx("placementTimeField")}>
                  <span>Thời gian mỗi câu</span>
                  <select
                    value={placementConfig.secondsPerQuestion || 90}
                    onChange={(e) => updatePlacementSecondsPerQuestion(e.target.value)}
                  >
                    {PLACEMENT_TIME_OPTIONS.map((option) => (
                      <option key={option.seconds} value={option.seconds}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </article>
                <StatCard label="Tổng thời gian" value={formatDuration(placementTotalSeconds)} tone="blue" />
                <StatCard label="Trạng thái" value={configErrors.length ? "Cần sửa" : "Hợp lệ"} tone={configErrors.length ? "rose" : "green"} />
              </div>

              <div className={cx("tableWrap", "placementConfigTableWrap")}>
                <table>
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Số câu level</th>
                      {PLACEMENT_SKILLS.map((skill) => (
                        <th key={skill}>{skill}</th>
                      ))}
                      <th>Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEVELS.map((level) => {
                      const levelCount = Number(placementConfig.levelCounts?.[level] || 0);
                      const skillTotal = sumPlacementSkills(placementConfig, level);
                      const hasRowMismatch = skillTotal !== levelCount;
                      const shortageChecks = PLACEMENT_SKILLS
                        .map((skill) => {
                          const requested = Number(placementConfig.skillCounts?.[level]?.[skill] || 0);
                          const available = Number(placementAvailability.skillCounts?.[level]?.[skill] || 0);
                          return requested > available
                            ? `${skill}: ${available}/${requested}`
                            : "";
                        })
                        .filter(Boolean);
                      const rowHasIssue = hasRowMismatch || shortageChecks.length > 0;
                      return (
                        <tr key={level}>
                          <td><span className={cx("levelBadge", level)}>{level}</span></td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={levelCount}
                              onChange={(e) => updatePlacementLevelCount(level, e.target.value)}
                            />
                          </td>
                          {PLACEMENT_SKILLS.map((skill) => {
                            const requested = Number(placementConfig.skillCounts?.[level]?.[skill] || 0);
                            const available = Number(placementAvailability.skillCounts?.[level]?.[skill] || 0);
                            const isShort = requested > available;
                            return (
                              <td key={`${level}-${skill}`} className={cx({ shortCell: isShort })}>
                                <input
                                  type="number"
                                  min="0"
                                  value={requested}
                                  onChange={(e) => updatePlacementSkillCount(level, skill, e.target.value)}
                                />
                              </td>
                            );
                          })}
                          <td>
                            <div className={cx("placementRowCheck")}>
                              <span className={cx("statusPill", rowHasIssue ? "warning" : "success")}>
                                {rowHasIssue ? "Cần sửa" : "Khớp"}
                              </span>
                              {hasRowMismatch && <small>Skill {skillTotal}/{levelCount}</small>}
                              {shortageChecks.map((item) => (
                                <small key={`${level}-${item}`}>Thiếu {item}</small>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={cx("modalFooter")}>
                <button type="button" onClick={() => setPlacementConfigModalOpen(false)}>
                  <X size={16} />
                  <span>Đóng</span>
                </button>
                <button type="button" className={cx("primaryBtn")} onClick={savePlacementConfig} disabled={placementConfigSaving || placementConfigLoading}>
                  <Save size={16} />
                  <span>{placementConfigSaving ? "Đang lưu" : "Lưu cấu hình"}</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </>
    );
  };

  const renderPlacementTab = () => {
    if (isPlacementFormMode) return renderPlacementFormPage();

    const total = questionPagination.total || 0;
    const totalPages = Math.max(questionPagination.totalPages || 1, 1);
    const currentPage = Math.min(questionPage, totalPages);
    const showingFrom = total === 0 ? 0 : (currentPage - 1) * questionLimit + 1;
    const showingTo = Math.min(currentPage * questionLimit, total);

    return (
      <>
      {renderPlacementConfigPanel()}
      <section className={cx("detailPanel", "listTablePanel")}>
        <div className={cx("detailHeader")}>
          <div>
            <h2>Danh sách câu hỏi placement</h2>
            <p>{formatNumber(total)} câu hỏi trong placement test</p>
          </div>
          <div className={cx("tableHeaderTools")}>
            <div className={cx("filters", "tableFilters", "questionFilters")}>
              <select value={questionFilters.level} onChange={(e) => updateQuestionFilter("level", e.target.value)}>
                <option value="">Tất cả level</option>
                {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
              <select value={questionFilters.skill} onChange={(e) => updateQuestionFilter("skill", e.target.value)}>
                <option value="">Tất cả skill</option>
                {PLACEMENT_SKILLS.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
              </select>
              <select value={questionFilters.isActive} onChange={(e) => updateQuestionFilter("isActive", e.target.value)}>
                <option value="">Mọi trạng thái</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <button type="button" onClick={loadQuestions} disabled={questionLoading} title="Tải lại">
              <RefreshCw size={16} />
            </button>
            <button type="button" className={cx("darkBtn")} onClick={() => navigate("/admin/learning-paths/placement/new")}>
              <Plus size={16} />
              <span>Thêm</span>
            </button>
          </div>
        </div>

        <div className={cx("tableWrap", "questionTableWrap")}>
          <table>
            <colgroup>
              <col className={cx("questionCol")} />
              <col className={cx("levelCol")} />
              <col className={cx("skillCol")} />
              <col className={cx("difficultyCol")} />
              <col className={cx("statusCol")} />
              <col className={cx("dateCol")} />
              <col className={cx("actionCol")} />
            </colgroup>
            <thead>
              <tr>
                <th>Câu hỏi</th>
                <th>Level</th>
                <th>Skill</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Cập nhật</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id}>
                  <td>
                    <strong>{question.content}</strong>
                    <small>Đáp án đúng: {question.options?.[question.correctAnswer] || "-"}</small>
                  </td>
                  <td><span className={cx("levelBadge", question.level)}>{question.level}</span></td>
                  <td>{question.skill}</td>
                  <td>{question.difficulty || "medium"}</td>
                  <td><span className={cx("statusPill", question.isActive ? "success" : "muted")}>{question.isActive ? "Active" : "Inactive"}</span></td>
                  <td>{formatDateCompact(question.updatedAt)}</td>
                  <td>
                    <div className={cx("rowActions", "questionActions")}>
                      <button type="button" onClick={() => navigate(`/admin/learning-paths/placement/${question.id}/edit`)} title="Sửa câu hỏi">
                        <Edit3 size={15} />
                      </button>
                      <button type="button" className={cx("dangerBtn")} onClick={() => deleteQuestion(question)} title="Xóa mềm câu hỏi">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!questionLoading && questions.length === 0 && <div className={cx("empty")}>Chưa có câu hỏi placement.</div>}
        </div>

        <div className={cx("paginationBar")}>
          <span>
            Hiển thị {formatNumber(showingFrom)}-{formatNumber(showingTo)} trên {formatNumber(total)} câu hỏi
          </span>
          <div className={cx("paginationControls")}>
            <select
              value={questionLimit}
              onChange={(e) => {
                setQuestionLimit(Number(e.target.value));
                setQuestionPage(1);
              }}
            >
              {QUESTION_PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} / trang</option>
              ))}
            </select>
            <button type="button" disabled={currentPage <= 1 || questionLoading} onClick={() => setQuestionPage((page) => Math.max(page - 1, 1))}>
              Trước
            </button>
            <strong>Trang {formatNumber(currentPage)} / {formatNumber(totalPages)}</strong>
            <button type="button" disabled={currentPage >= totalPages || questionLoading} onClick={() => setQuestionPage((page) => Math.min(page + 1, totalPages))}>
              Sau
            </button>
          </div>
        </div>
      </section>
      </>
    );
  };

  return (
    <div className={cx("page")}>
      <header className={cx("pageTitle")}>
        <div>
          <h1>Quản lý lộ trình</h1>
          <p>Placement, weekly plans, AI review và tiến độ học của user.</p>
        </div>
        <nav className={cx("tabs")}>
          {MAIN_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={cx({ active: activeTab === key })}
              onClick={() => {
                if (key === "paths") {
                  navigate("/admin/learning-paths");
                } else if (key === "placement") {
                  navigate("/admin/learning-paths?tab=placement");
                }
                setActiveTab(key);
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </header>

      {notice && <div className={cx("notice")}>{notice}</div>}
      {error && <div className={cx("error")}>{error}</div>}

      {activeTab === "paths" && renderPathsTab()}
      {activeTab === "placement" && renderPlacementTab()}
    </div>
  );
}

export default AdminLearningPaths;
