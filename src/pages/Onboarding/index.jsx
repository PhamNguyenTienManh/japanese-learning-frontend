import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";

import styles from "./Onboarding.module.scss";
import {
  generateLearningPath,
  getPlacementQuestions,
  submitPlacement,
} from "~/services/learningPathService";
import { useToast } from "~/context/ToastContext";

const cx = classNames.bind(styles);

const GOALS = [
  {
    type: "jlpt_exam",
    icon: "🎯",
    title: "Luyện thi JLPT",
    text: "Tập trung từ vựng, ngữ pháp, kanji, đọc hiểu và đề thi.",
  },
  {
    type: "conversation",
    icon: "💬",
    title: "Luyện giao tiếp",
    text: "Tăng phản xạ với hội thoại theo tình huống.",
  },
  {
    type: "vocabulary",
    icon: "📖",
    title: "Luyện từ vựng",
    text: "Mở rộng vốn từ và ghi nhớ bằng flashcard.",
  },
  {
    type: "writing",
    icon: "✍️",
    title: "Luyện viết",
    text: "Củng cố kanji, cấu trúc câu và luyện viết bằng PDF.",
  },
];

const EXPERIENCE_OPTIONS = [
  {
    value: "new",
    icon: "🌱",
    title: "Hoàn toàn mới",
    text: "Bắt đầu từ N5, không cần làm bài kiểm tra.",
  },
  {
    value: "some",
    icon: "📚",
    title: "Đã học một chút",
    text: "Làm placement test 20 câu để gợi ý cấp độ.",
  },
  {
    value: "known",
    icon: "✅",
    title: "Biết rõ trình độ",
    text: "Tự chọn cấp độ JLPT hiện tại.",
  },
];

const LEVELS = [
  { level: "N5", text: "Mới bắt đầu, câu đơn giản, từ vựng cơ bản." },
  { level: "N4", text: "Nắm nền tảng và giao tiếp quen thuộc." },
  { level: "N3", text: "Hiểu nội dung thường ngày ở mức trung cấp." },
  { level: "N2", text: "Đọc hiểu và giao tiếp trong nhiều ngữ cảnh." },
  { level: "N1", text: "Nâng cao, nhiều sắc thái học thuật và công việc." },
];

const GOAL_SKILL_DEFAULTS = {
  jlpt_exam: ["vocab", "grammar", "kanji", "reading", "jlpt_exam"],
  conversation: ["vocab", "reading", "conversation"],
  vocabulary: ["vocab", "kanji", "grammar"],
  writing: ["kanji", "grammar", "writing"],
};

const SKILL_META = {
  vocab: {
    icon: "🔤",
    label: "Từ vựng",
    text: "Hoàn thành khi đánh dấu đủ flashcard Đã thuộc.",
  },
  grammar: {
    icon: "📝",
    label: "Ngữ pháp",
    text: "Ôn mẫu câu bằng flashcard JLPT theo level.",
  },
  kanji: {
    icon: "🖊",
    label: "Kanji",
    text: "Học kanji và đánh dấu Đã thuộc trong flashcard.",
  },
  conversation: {
    icon: "🗣",
    label: "Giao tiếp",
    text: "Mở bài hội thoại và luyện theo tình huống.",
  },
  jlpt_exam: {
    icon: "📋",
    label: "Đề JLPT",
    text: "Hoàn thành khi bài thi trong tuần đạt từ 80 điểm.",
  },
  reading: {
    icon: "📖",
    label: "Đọc hiểu",
    text: "Tính theo số bài đọc đã mở trong trang Luyện đọc.",
  },
  writing: {
    icon: "✍️",
    label: "Viết",
    text: "Tính theo số PDF luyện viết kanji đã tải.",
  },
};

const SKILL_LABELS = Object.fromEntries(
  Object.entries(SKILL_META).map(([skill, meta]) => [skill, meta.label])
);
const ALL_SKILLS = ["vocab", "grammar", "kanji", "reading", "writing", "conversation", "jlpt_exam"];

function getDefaultSkillsForGoals(goalTypes) {
  const selectedGoalTypes = goalTypes?.length ? goalTypes : ["jlpt_exam"];
  return [
    ...new Set(
      selectedGoalTypes.flatMap((type) => GOAL_SKILL_DEFAULTS[type] || [])
    ),
  ];
}

function getGoalTitles(goalTypes) {
  const selectedGoalTypes = goalTypes?.length ? goalTypes : ["jlpt_exam"];
  return selectedGoalTypes
    .map((type) => GOALS.find((goal) => goal.type === type)?.title)
    .filter(Boolean)
    .join(", ");
}

function Onboarding() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [goalTypes, setGoalTypes] = useState(["jlpt_exam"]);
  const [experience, setExperience] = useState("new");
  const [level, setLevel] = useState("N5");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [placementResult, setPlacementResult] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submittingPlacement, setSubmittingPlacement] = useState(false);
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [examDate, setExamDate] = useState("");
  const [focusSkills, setFocusSkills] = useState(getDefaultSkillsForGoals(["jlpt_exam"]));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFocusSkills(getDefaultSkillsForGoals(goalTypes));
  }, [goalTypes]);

  const currentQuestion = questions[questionIndex];
  const placementProgress = questions.length
    ? Math.round(((questionIndex + 1) / questions.length) * 100)
    : 0;
  const canContinueStep1 = goalTypes.length > 0 && experience;
  const canGenerate = level && focusSkills.length > 0 && !generating;

  const primaryGoalType = goalTypes[0] || "jlpt_exam";
  const selectedGoalTitles = useMemo(
    () => getGoalTitles(goalTypes),
    [goalTypes]
  );
  const includesJlptExam = goalTypes.includes("jlpt_exam");

  const toggleGoal = (type) => {
    setGoalTypes((current) => {
      if (current.includes(type)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== type);
      }
      return [...current, type];
    });
  };

  const goToLevelStep = async () => {
    setError("");
    if (!canContinueStep1) return;

    if (experience === "new") {
      setLevel("N5");
      setStep(3);
      return;
    }

    setStep(2);
    if (experience === "some" && questions.length === 0) {
      await loadQuestions();
    }
  };

  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const data = await getPlacementQuestions(20);
      setQuestions(data || []);
      setAnswers({});
      setQuestionIndex(0);
      setPlacementResult(null);
    } catch (err) {
      setError(err?.message || "Không tải được bài kiểm tra trình độ.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const selectAnswer = async (selected) => {
    if (!currentQuestion || submittingPlacement) return;

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: selected,
    };
    setAnswers(nextAnswers);

    if (questionIndex < questions.length - 1) {
      setTimeout(() => setQuestionIndex((current) => current + 1), 120);
      return;
    }

    await finishPlacement(nextAnswers);
  };

  const finishPlacement = async (finalAnswers) => {
    try {
      setSubmittingPlacement(true);
      setError("");
      const payload = questions.map((question) => ({
        questionId: question.id,
        selected: finalAnswers[question.id],
      }));
      const result = await submitPlacement(payload);
      setPlacementResult(result);
      setLevel(result.suggestedLevel);
    } catch (err) {
      setError(err?.message || "Không chấm được bài kiểm tra.");
    } finally {
      setSubmittingPlacement(false);
    }
  };

  const toggleSkill = (skill) => {
    setFocusSkills((current) => {
      if (current.includes(skill)) {
        return current.filter((item) => item !== skill);
      }
      return [...current, skill];
    });
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    try {
      setGenerating(true);
      setError("");
      const payload = {
        level,
        goal: {
          type: primaryGoalType,
          types: goalTypes,
          dailyMinutes,
          focusSkills,
          ...(includesJlptExam && examDate ? { examDate } : {}),
        },
      };
      const result = await generateLearningPath(payload);
      const warnings = result?.warnings || [];
      if (warnings.length) {
        addToast(warnings[0], "warning");
      }
      addToast(warnings.length ? "Đã tạo lộ trình bằng kế hoạch dự phòng." : "AI đã tạo lộ trình học cá nhân hóa!", "success");
      navigate("/dashboard/learning-path");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Không tạo được lộ trình.");
    } finally {
      setGenerating(false);
    }
  };

  const renderStepOne = () => (
    <div className={cx("panel", "panelStack")}>
      <section className={cx("sectionBlock")}>
        <div className={cx("sectionHead")}>
          <span className={cx("sectionKicker")}>Mục tiêu</span>
          <h2 className={cx("sectionTitle")}>Bạn muốn học để làm gì?</h2>
          <p className={cx("sectionHint")}>
            Có thể chọn nhiều mục tiêu. Lộ trình sẽ tự phối kỹ năng phù hợp.
          </p>
        </div>
        <div className={cx("grid")}>
          {GOALS.map((goal) => {
            const active = goalTypes.includes(goal.type);
            return (
              <button
                key={goal.type}
                type="button"
                className={cx("card", { cardActive: active })}
                onClick={() => toggleGoal(goal.type)}
              >
                <span className={cx("cardTop")}>
                  <span className={cx("cardIcon")}>{goal.icon}</span>
                  <span className={cx("checkDot")}>{active ? "✓" : ""}</span>
                </span>
                <span className={cx("cardTitle")}>{goal.title}</span>
                <span className={cx("cardText")}>{goal.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={cx("sectionBlock")}>
        <div className={cx("sectionHead")}>
          <span className={cx("sectionKicker")}>Trình độ</span>
          <h2 className={cx("sectionTitle")}>Bạn đã biết tiếng Nhật chưa?</h2>
        </div>
        <div className={cx("grid")}>
          {EXPERIENCE_OPTIONS.map((option) => {
            const active = experience === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cx("card", { cardActive: active })}
                onClick={() => setExperience(option.value)}
              >
                <span className={cx("cardTop")}>
                  <span className={cx("cardIcon")}>{option.icon}</span>
                  <span className={cx("checkDot")}>{active ? "✓" : ""}</span>
                </span>
                <span className={cx("cardTitle")}>{option.title}</span>
                <span className={cx("cardText")}>{option.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className={cx("actions")}>
        <span />
        <button
          type="button"
          className={cx("button", "primary")}
          onClick={goToLevelStep}
          disabled={!canContinueStep1}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );

  const renderKnownLevel = () => (
    <div className={cx("panel", "panelStack")}>
      <div className={cx("sectionHead")}>
        <span className={cx("sectionKicker")}>JLPT level</span>
        <h2 className={cx("sectionTitle")}>Chọn trình độ hiện tại</h2>
        <p className={cx("sectionHint")}>
          Chọn cấp độ gần nhất với khả năng hiện tại của bạn.
        </p>
      </div>
      <div className={cx("grid")}>
        {LEVELS.map((item) => {
          const active = level === item.level;
          return (
            <button
              key={item.level}
              type="button"
              className={cx("card", "levelCard", { cardActive: active })}
              onClick={() => setLevel(item.level)}
            >
              <span className={cx("cardTop")}>
                <span className={cx("levelMark")}>{item.level}</span>
                <span className={cx("checkDot")}>{active ? "✓" : ""}</span>
              </span>
              <span className={cx("cardText")}>{item.text}</span>
            </button>
          );
        })}
      </div>
      <div className={cx("actions")}>
        <button
          type="button"
          className={cx("button", "secondary")}
          onClick={() => setStep(1)}
        >
          Quay lại
        </button>
        <button
          type="button"
          className={cx("button", "primary")}
          onClick={() => setStep(3)}
        >
          Dùng cấp độ này
        </button>
      </div>
    </div>
  );

  const renderPlacement = () => {
    if (loadingQuestions) {
      return <div className={cx("panel")}>Đang tải bài kiểm tra...</div>;
    }

    if (placementResult) {
      return (
        <div className={cx("panel")}>
          <h2 className={cx("sectionTitle")}>Kết quả placement test</h2>
          <div className={cx("resultBox")}>
            <div className={cx("metricLabel")}>Level gợi ý</div>
            <div className={cx("resultLevel")}>{placementResult.suggestedLevel}</div>
            <div className={cx("metricLabel")}>
              Độ tự tin: {Math.round((placementResult.confidence || 0) * 100)}%
            </div>
            <div className={cx("breakdown")}>
              <div className={cx("metric")}>
                <div className={cx("metricLabel")}>Từ vựng</div>
                <div className={cx("metricValue")}>
                  {placementResult.skillBreakdown?.vocab ?? 0}%
                </div>
              </div>
              <div className={cx("metric")}>
                <div className={cx("metricLabel")}>Ngữ pháp</div>
                <div className={cx("metricValue")}>
                  {placementResult.skillBreakdown?.grammar ?? 0}%
                </div>
              </div>
              {Object.entries(placementResult.levelBreakdown || {}).map(([key, value]) => (
                <div className={cx("metric")} key={key}>
                  <div className={cx("metricLabel")}>{key}</div>
                  <div className={cx("metricValue")}>{value}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className={cx("actions")}>
            <button
              type="button"
              className={cx("button", "secondary")}
              onClick={() => {
                setPlacementResult(null);
                setExperience("known");
              }}
            >
              Tự chọn level khác
            </button>
            <button
              type="button"
              className={cx("button", "primary")}
              onClick={() => setStep(3)}
            >
              Dùng level này
            </button>
          </div>
        </div>
      );
    }

    if (!currentQuestion) {
      return (
        <div className={cx("panel")}>
          <h2 className={cx("sectionTitle")}>Không có câu hỏi placement</h2>
          <button type="button" className={cx("button", "primary")} onClick={loadQuestions}>
            Tải lại
          </button>
        </div>
      );
    }

    return (
      <div className={cx("panel")}>
        <div className={cx("questionMeta")}>
          <span>
            Câu {questionIndex + 1}/{questions.length}
          </span>
          <span>
            {currentQuestion.level} · {SKILL_LABELS[currentQuestion.skill]}
          </span>
        </div>
        <div className={cx("progressTrack")}>
          <div className={cx("progressBar")} style={{ width: `${placementProgress}%` }} />
        </div>
        <div className={cx("question")}>{currentQuestion.content}</div>
        <div className={cx("options")}>
          {currentQuestion.options.map((option, index) => (
            <button
              key={option}
              type="button"
              className={cx("option", {
                optionActive: answers[currentQuestion.id] === index,
              })}
              onClick={() => selectAnswer(index)}
              disabled={submittingPlacement}
            >
              {option}
            </button>
          ))}
        </div>
        <div className={cx("actions")}>
          <button
            type="button"
            className={cx("button", "secondary")}
            onClick={() => (questionIndex > 0 ? setQuestionIndex(questionIndex - 1) : setStep(1))}
          >
            Quay lại
          </button>
          <span>{submittingPlacement ? "Đang chấm bài..." : ""}</span>
        </div>
      </div>
    );
  };

  const renderStepTwo = () => {
    if (experience === "known") return renderKnownLevel();
    return renderPlacement();
  };

  const renderGoalSetup = () => {
    const visibleSkills = [...new Set([...getDefaultSkillsForGoals(goalTypes), ...ALL_SKILLS])];

    return (
      <div className={cx("panel", "panelStack")}>
        <div className={cx("setupHeader")}>
          <div>
            <span className={cx("sectionKicker")}>Cá nhân hóa</span>
            <h2 className={cx("sectionTitle")}>Thiết lập lộ trình</h2>
            <p className={cx("sectionHint")}>
              Mục tiêu: {selectedGoalTitles} · Trình độ bắt đầu: {level}. Gemini sẽ cạnh chỉnh task theo thời gian học của bạn.
            </p>
          </div>
          <div className={cx("setupBadge")}>
            <span>{dailyMinutes}</span>
            phút/ngày
          </div>
        </div>

        <div className={cx("field")}>
          <label className={cx("label")}>Kỹ năng muốn tập trung</label>
          <div className={cx("skillGrid")}>
            {visibleSkills.map((skill) => {
              const meta = SKILL_META[skill];
              const active = focusSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  className={cx("skillCard", {
                    skillActive: active,
                  })}
                  onClick={() => toggleSkill(skill)}
                >
                  <span className={cx("skillTop")}>
                    <span className={cx("skillIcon")}>{meta.icon}</span>
                    <span className={cx("checkDot")}>{active ? "✓" : ""}</span>
                  </span>
                  <span className={cx("skillTitle")}>{meta.label}</span>
                  <span className={cx("skillText")}>{meta.text}</span>
                </button>
              );
            })}
          </div>
          <p className={cx("infoNote")}>
            Đọc hiểu liên kết với trang Luyện đọc. Viết liên kết với PDF luyện viết kanji
            trong JLPT Hán tự và được tính khi user tải PDF.
          </p>
        </div>

        <div className={cx("field")}>
          <label className={cx("label")}>Thời gian học mỗi ngày</label>
          <div className={cx("minuteOptions")}>
            {[15, 30, 45, 60].map((minute) => (
              <button
                key={minute}
                type="button"
                className={cx("chip", { chipActive: dailyMinutes === minute })}
                onClick={() => setDailyMinutes(minute)}
              >
                {minute} phút
              </button>
            ))}
          </div>
        </div>

        {includesJlptExam && (
          <div className={cx("field")}>
            <label className={cx("label")} htmlFor="examDate">
              Ngày thi JLPT dự kiến
            </label>
            <input
              id="examDate"
              type="date"
              className={cx("input")}
              value={examDate}
              onChange={(event) => setExamDate(event.target.value)}
            />
            <p className={cx("sectionHint")}>JLPT thường tổ chức vào tháng 7 và tháng 12.</p>
          </div>
        )}

        <div className={cx("actions")}>
          <button
            type="button"
            className={cx("button", "secondary")}
            onClick={() => (experience === "new" ? setStep(1) : setStep(2))}
          >
            Quay lại
          </button>
          <button
            type="button"
            className={cx("button", "primary")}
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {generating ? "Đang tạo weekly plan..." : "Tạo lộ trình bằng AI"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className={cx("wrapper")}>
      <div className={cx("shell")}>
        <header className={cx("hero")}>
          <div className={cx("heroCopy")}>
            <div className={cx("eyebrow")}>Onboarding</div>
            <h1 className={cx("title")}>Tạo lộ trình học tiếng Nhật cá nhân hóa</h1>
            <p className={cx("subtitle")}>
              Chọn mục tiêu, xác định trình độ và để hệ thống sắp xếp nội dung học
              phù hợp với thời gian mỗi ngày của bạn.
            </p>
          </div>
          <div className={cx("heroPanel")}>
            <span className={cx("heroPanelLabel")}>Đang thiết lập</span>
            <strong>{selectedGoalTitles}</strong>
            <span>{level} · {dailyMinutes} phút/ngày</span>
          </div>
        </header>

        <div className={cx("steps")}>
          {["Mục tiêu", "Trình độ", "Lộ trình"].map((label, index) => (
            <div
              key={label}
              className={cx("step", { stepActive: step === index + 1 })}
            >
              <span className={cx("stepNumber")}>{index + 1}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {step === 1 && renderStepOne()}
        {step === 2 && renderStepTwo()}
        {step === 3 && renderGoalSetup()}

        {error && <div className={cx("error")}>{error}</div>}
      </div>
    </main>
  );
}

export default Onboarding;

