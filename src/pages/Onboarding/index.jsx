import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { ChevronLeft } from "lucide-react";

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
    value: "absolute_beginner",
    icon: "🌸",
    title: "Người chưa biết gì",
    text: "Chưa biết Hiragana/Katakana, học bảng chữ cái trước.",
  },
  {
    value: "new",
    icon: "🌱",
    title: "Hoàn toàn mới",
    text: "Bắt đầu từ N5, không cần làm bài kiểm tra.",
  },
  {
    value: "some",
    icon: "📚",
    title: "Chưa biết rõ trình độ",
    text: "Làm placement test để hệ thống gợi ý cấp độ.",
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
  listening: {
    icon: "🎧",
    label: "Nghe hiểu",
    text: "Làm câu hỏi nghe để kiểm tra khả năng nhận diện hội thoại.",
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

function formatTestTime(seconds) {
  const safeSeconds = Math.max(Number(seconds) || 0, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`;
}

function getPlacementAssessment(result) {
  const level = result?.suggestedLevel || "N5";
  const skills = result?.skillBreakdown || {};
  const weakestSkill = Object.entries(skills).sort((a, b) => Number(a[1]) - Number(b[1]))[0]?.[0];
  const skillLabel = SKILL_LABELS[weakestSkill] || "kỹ năng nền tảng";

  return `AI gợi ý bạn bắt đầu ở ${level}. Lộ trình sẽ ưu tiên củng cố ${skillLabel}, sau đó tăng dần độ khó để bạn học chắc hơn.`;
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
  const [placementMode, setPlacementMode] = useState("intro");
  const [showExitPlacementConfirm, setShowExitPlacementConfirm] = useState(false);
  const [placementSecondsPerQuestion, setPlacementSecondsPerQuestion] = useState(90);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submittingPlacement, setSubmittingPlacement] = useState(false);
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [jlptTargetScore, setJlptTargetScore] = useState(100);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = questions[questionIndex];
  const placementProgress = questions.length
    ? Math.round(((questionIndex + 1) / questions.length) * 100)
    : 0;
  const answeredCount = questions.filter((question) =>
    Object.prototype.hasOwnProperty.call(answers, question.id)
  ).length;
  const totalPlacementSeconds = questions.length * placementSecondsPerQuestion;
  const canContinueStep1 = goalTypes.length > 0 && experience;

  const primaryGoalType = goalTypes[0] || "jlpt_exam";
  const selectedGoalTitles = useMemo(
    () => getGoalTitles(goalTypes),
    [goalTypes]
  );
  const includesJlptExam = goalTypes.includes("jlpt_exam");
  const normalizedTargetScore = Math.min(Math.max(Math.round(Number(jlptTargetScore) || 0), 0), 180);
  const canGenerate = level && !generating && (!includesJlptExam || normalizedTargetScore > 0);

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

    if (experience === "absolute_beginner") {
      navigate("/kana");
      return;
    }

    if (experience === "new") {
      setLevel("N5");
      setStep(3);
      return;
    }

    setStep(2);
    if (experience === "some") {
      setPlacementMode("intro");
    }
  };

  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const data = await getPlacementQuestions(20);
      const nextQuestions = Array.isArray(data) ? data : data?.questions || [];
      const nextSecondsPerQuestion = Number(data?.secondsPerQuestion) || 90;
      setQuestions(nextQuestions);
      setPlacementSecondsPerQuestion(nextSecondsPerQuestion);
      setRemainingSeconds(Number(data?.totalSeconds) || nextQuestions.length * nextSecondsPerQuestion);
      setAnswers({});
      setQuestionIndex(0);
      setPlacementResult(null);
      return nextQuestions.length > 0;
    } catch (err) {
      setError(err?.message || "Không tải được bài kiểm tra trình độ.");
      return false;
    } finally {
      setLoadingQuestions(false);
    }
  };

  const startPlacementTest = async () => {
    setError("");
    setPlacementMode("test");
    const loaded = await loadQuestions();
    if (!loaded) {
      setPlacementMode("intro");
      setError((current) => current || "Ngân hàng câu hỏi hiện chưa đủ để tạo bài placement test.");
    }
  };

  const resetPlacementAttempt = () => {
    setShowExitPlacementConfirm(false);
    setError("");
    setPlacementMode("intro");
    setQuestions([]);
    setAnswers({});
    setQuestionIndex(0);
    setPlacementResult(null);
    setRemainingSeconds(0);
  };

  const selectAnswer = async (selected) => {
    if (!currentQuestion || submittingPlacement) return;

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: selected,
    };
    setAnswers(nextAnswers);
  };

  const finishPlacement = useCallback(async (finalAnswers = answers) => {
    if (!questions.length || submittingPlacement || placementResult) return;
    try {
      setSubmittingPlacement(true);
      setError("");
      const payload = questions.map((question) => ({
        questionId: question.id,
        selected: Object.prototype.hasOwnProperty.call(finalAnswers, question.id)
          ? finalAnswers[question.id]
          : -1,
      }));
      const result = await submitPlacement(payload);
      setPlacementResult(result);
      setPlacementMode("result");
      setLevel(result.suggestedLevel);
    } catch (err) {
      setError(err?.message || "Không chấm được bài kiểm tra.");
    } finally {
      setSubmittingPlacement(false);
    }
  }, [answers, placementResult, questions, submittingPlacement]);

  useEffect(() => {
    const shouldRunTimer =
      step === 2 &&
      experience === "some" &&
      placementMode === "test" &&
      questions.length > 0 &&
      !placementResult &&
      !showExitPlacementConfirm &&
      !submittingPlacement;

    if (!shouldRunTimer) return undefined;
    if (remainingSeconds <= 0) {
      finishPlacement(answers);
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [answers, experience, finishPlacement, placementMode, placementResult, questions.length, remainingSeconds, showExitPlacementConfirm, step, submittingPlacement]);

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
          ...(includesJlptExam ? { targetScore: normalizedTargetScore } : {}),
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
    <div className={cx("panel", "goalPanel")}>
      <section className={cx("goalIntro")}>
        <div>
          <span className={cx("sectionKicker")}>Mục tiêu học tập</span>
          <h2>Bạn muốn tiếng Nhật giúp mình làm gì?</h2>
          <p>
            Chọn một hoặc nhiều hướng học. Hệ thống sẽ tự phối kỹ năng phù hợp
            trước khi tạo lộ trình cho bạn.
          </p>
        </div>
        <div className={cx("goalCounter")}>
          <strong>{goalTypes.length}</strong>
          <span>mục tiêu</span>
        </div>
      </section>

      <section className={cx("goalSection")}>
        <div className={cx("goalGrid")}>
          {GOALS.map((goal) => {
            const active = goalTypes.includes(goal.type);
            return (
              <button
                key={goal.type}
                type="button"
                className={cx("goalCard", { goalCardActive: active })}
                onClick={() => toggleGoal(goal.type)}
              >
                <span className={cx("goalCardTop")}>
                  <span className={cx("goalIcon")}>{goal.icon}</span>
                  <span className={cx("goalCheck")}>{active ? "✓" : ""}</span>
                </span>
                <span className={cx("goalTitle")}>{goal.title}</span>
                <span className={cx("goalText")}>{goal.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={cx("experienceSection")}>
        <div className={cx("experienceHead")}>
          <span className={cx("sectionKicker")}>Trình độ</span>
          <h2>Bạn đang ở đâu trên hành trình này?</h2>
        </div>
        <div className={cx("experienceGrid")}>
          {EXPERIENCE_OPTIONS.map((option) => {
            const active = experience === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cx("experienceCard", { experienceCardActive: active })}
                onClick={() => setExperience(option.value)}
              >
                <span className={cx("experienceIcon")}>{option.icon}</span>
                <span className={cx("experienceCopy")}>
                  <strong>{option.title}</strong>
                  <small>{option.text}</small>
                </span>
                <span className={cx("goalCheck")}>{active ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className={cx("actions", "goalActions")}>
        <div className={cx("goalSummary")}>
          <span>Mục tiêu đã chọn</span>
          <strong>{selectedGoalTitles}</strong>
        </div>
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

  const renderPlacementIntro = () => (
    <section className={cx("placementIntro")}>
      <div className={cx("placementPageTopbar")}>
        <button type="button" className={cx("placementExitButton")} onClick={() => setStep(1)}>
          <ChevronLeft size={20} strokeWidth={3} />
          Thoát
        </button>
      </div>

      <div className={cx("placementIntroBody")}>
        <div className={cx("placementMascot")}>
          <span>日本</span>
        </div>
        <span className={cx("sectionKicker")}>Placement test</span>
        <h2>Bắt đầu kiểm tra trình độ</h2>
        <p>
          Bài test sẽ được tạo ngẫu nhiên theo cấu hình hiện tại. Sau khi hoàn thành,
          hệ thống sẽ gợi ý level bắt đầu và lộ trình phù hợp cho bạn.
        </p>
        <button
          type="button"
          className={cx("button", "primary", "startPlacementButton")}
          onClick={startPlacementTest}
          disabled={loadingQuestions}
        >
          {loadingQuestions ? "Đang tạo đề..." : "Bắt đầu"}
        </button>
      </div>

      <div className={cx("placementScenery")} aria-hidden="true">
        <span className={cx("hill", "hillOne")} />
        <span className={cx("hill", "hillTwo")} />
        <span className={cx("sunAccent")} />
      </div>
    </section>
  );

  const renderPlacement = () => {
    if (placementMode === "intro") {
      return renderPlacementIntro();
    }

    if (loadingQuestions) {
      return (
        <section className={cx("placementIntro", "placementLoading")}>
          <div className={cx("placementIntroBody")}>
            <div className={cx("placementMascot")}>
              <span>JP</span>
            </div>
            <h2>Đang tạo đề test...</h2>
            <p>Hệ thống đang random câu hỏi theo cấu hình admin.</p>
          </div>
        </section>
      );
    }

    if (placementResult) {
      const skillMetrics = [
        { key: "vocab", label: "Từ vựng", value: Number(placementResult.skillBreakdown?.vocab || 0) },
        { key: "grammar", label: "Ngữ pháp", value: Number(placementResult.skillBreakdown?.grammar || 0) },
        { key: "listening", label: "Nghe hiểu", value: Number(placementResult.skillBreakdown?.listening || 0) },
      ];
      const levelMetrics = Object.entries(placementResult.levelBreakdown || {}).map(([key, value]) => ({
        key,
        label: key,
        value: Number(value) || 0,
      }));

      return (
        <div className={cx("panel", "placementResultPanel")}>
          <div className={cx("resultHeader")}>
            <span className={cx("sectionKicker")}>AI placement</span>
            <h2 className={cx("sectionTitle")}>Kết quả kiểm tra đầu vào</h2>
          </div>
          <div className={cx("resultBox")}>
            <div className={cx("resultHero")}>
              <div className={cx("resultLevel")}>
                <span>{placementResult.suggestedLevel}</span>
                <small>Level gợi ý</small>
              </div>
              <div className={cx("resultHeroCopy")}>
                <span className={cx("resultBadge")}>Đã hoàn thành placement test</span>
                <h3>Sẵn sàng bắt đầu từ {placementResult.suggestedLevel}</h3>
                <p className={cx("aiAssessment")}>{getPlacementAssessment(placementResult)}</p>
              </div>
            </div>

            <section className={cx("resultSection")}>
              <div className={cx("resultSectionHead")}>
                <span>Kỹ năng nổi bật</span>
                <small>Dựa trên câu bạn vừa làm</small>
              </div>
              <div className={cx("breakdown", "skillBreakdown")}>
                {skillMetrics.map((metric) => (
                  <article className={cx("metric")} key={metric.key}>
                    <div className={cx("metricTop")}>
                      <span className={cx("metricLabel")}>{metric.label}</span>
                      <strong className={cx("metricValue")}>{metric.value}%</strong>
                    </div>
                    <i className={cx("metricBar")}>
                      <b style={{ width: `${metric.value}%` }} />
                    </i>
                  </article>
                ))}
              </div>
            </section>

            <section className={cx("resultSection")}>
              <div className={cx("resultSectionHead")}>
                <span>Mức độ theo level</span>
                <small>Giúp AI chọn điểm bắt đầu phù hợp</small>
              </div>
              <div className={cx("breakdown", "levelBreakdown")}>
                {levelMetrics.map((metric) => (
                  <article className={cx("metric")} key={metric.key}>
                    <div className={cx("metricTop")}>
                      <span className={cx("metricLabel")}>{metric.label}</span>
                      <strong className={cx("metricValue")}>{metric.value}%</strong>
                    </div>
                    <i className={cx("metricBar")}>
                      <b style={{ width: `${metric.value}%` }} />
                    </i>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className={cx("actions", "resultActions")}>
            <button
              type="button"
              className={cx("button", "secondary")}
              onClick={() => {
                setPlacementResult(null);
                setPlacementMode("intro");
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
      <div className={cx("placementTest")}>
        <section className={cx("placementMain")}>
          <div className={cx("placementTopbar")}>
            <button
              type="button"
              className={cx("backLink")}
              onClick={() => setShowExitPlacementConfirm(true)}
              disabled={submittingPlacement}
            >
              Quay lại
            </button>
            <div className={cx("placementProgressText")}>
              <strong>{questionIndex + 1}/{questions.length}</strong>
              <span>{answeredCount}/{questions.length} đã trả lời</span>
            </div>
            <div className={cx("progressTrack")}>
              <div className={cx("progressBar")} style={{ width: `${placementProgress}%` }} />
            </div>
          </div>

          <article className={cx("placementQuestionCard")}>
            <div className={cx("questionMeta")}>
              <span>Câu {questionIndex + 1}</span>
              <span>{currentQuestion.level} · {SKILL_LABELS[currentQuestion.skill]}</span>
            </div>
            {currentQuestion.general?.txt_read && (
              <div className={cx("placementPassage")}>{currentQuestion.general.txt_read}</div>
            )}
            {currentQuestion.general?.image && (
              <div className={cx("placementImage")}>
                <img src={currentQuestion.general.image} alt="Placement" />
              </div>
            )}
            {currentQuestion.general?.audio && (
              <audio className={cx("placementAudio")} controls src={currentQuestion.general.audio} />
            )}
            <div className={cx("question")}>{currentQuestion.content}</div>
            <div className={cx("options")}>
              {currentQuestion.options.map((option, index) => (
                <button
                  key={`${currentQuestion.id}-${index}`}
                  type="button"
                  className={cx("option", {
                    optionActive: answers[currentQuestion.id] === index,
                  })}
                  onClick={() => selectAnswer(index)}
                  disabled={submittingPlacement}
                >
                  <span>{index + 1}</span>
                  <strong>{option}</strong>
                </button>
              ))}
            </div>
          </article>

          <div className={cx("placementNavActions")}>
            <button
              type="button"
              className={cx("button", "secondary")}
              onClick={() => setQuestionIndex((current) => Math.max(current - 1, 0))}
              disabled={questionIndex === 0 || submittingPlacement}
            >
              Câu trước
            </button>
            <button
              type="button"
              className={cx("button", "primary")}
              onClick={() => setQuestionIndex((current) => Math.min(current + 1, questions.length - 1))}
              disabled={questionIndex >= questions.length - 1 || submittingPlacement}
            >
              Câu sau
            </button>
          </div>
        </section>

        <aside className={cx("placementSidebar")}>
          <div className={cx("timerBox", { timerDanger: remainingSeconds <= 60 })}>
            <span>Thời gian còn lại</span>
            <strong>{formatTestTime(remainingSeconds)}</strong>
            <small>{formatTestTime(totalPlacementSeconds)} tổng thời gian</small>
          </div>
          <div className={cx("questionMap")}>
            {questions.map((question, index) => {
              const answered = Object.prototype.hasOwnProperty.call(answers, question.id);
              return (
                <button
                  key={question.id}
                  type="button"
                  className={cx("questionMapItem", {
                    questionMapActive: index === questionIndex,
                    questionMapAnswered: answered,
                  })}
                  onClick={() => setQuestionIndex(index)}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={cx("button", "submitPlacement")}
            onClick={() => finishPlacement(answers)}
            disabled={answeredCount < questions.length || submittingPlacement}
          >
            {submittingPlacement ? "Đang chấm bài..." : "Nộp bài"}
          </button>
          <p className={cx("submitHint")}>
            Kết quả và đánh giá AI chỉ hiển thị sau khi nộp bài.
          </p>
        </aside>
      </div>
    );
  };

  const renderStepTwo = () => {
    if (experience === "known") return renderKnownLevel();
    return renderPlacement();
  };

  const renderGoalSetup = () => {
    return (
      <div className={cx("panel", "setupPanel")}>
        <div className={cx("setupHero")}>
          <div className={cx("setupHeroCopy")}>
            <span className={cx("sectionKicker")}>Lộ trình cá nhân</span>
            <h2>Sắp xếp nhịp học của bạn</h2>
            <p>
              Hệ thống sẽ tự chọn nhóm kỹ năng dựa trên mục tiêu {selectedGoalTitles}
              và trình độ bắt đầu {level}. Bạn chỉ cần chọn nhịp học phù hợp.
            </p>
          </div>
          <div className={cx("setupSummaryCard")}>
            <span>Level bắt đầu</span>
            <strong>{level}</strong>
            <small>{dailyMinutes} phút/ngày</small>
          </div>
        </div>

        <div className={cx("setupGrid")}>
          <section className={cx("setupControlCard")}>
            <div className={cx("setupControlHead")}>
              <span className={cx("setupControlIcon")}>⏱</span>
              <div>
                <h3>Thời gian học mỗi ngày</h3>
                <p>Chọn mức bạn có thể duy trì đều đặn.</p>
              </div>
            </div>
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
          </section>

          {includesJlptExam && (
            <section className={cx("setupControlCard", "scoreCard")}>
              <div className={cx("setupControlHead")}>
                <span className={cx("setupControlIcon")}>🏆</span>
                <div>
                  <h3>Điểm JLPT mong muốn</h3>
                  <p>AI sẽ ưu tiên nhịp ôn đề theo mục tiêu điểm này.</p>
                </div>
              </div>
              <div className={cx("scoreInputRow")}>
                <input
                  type="number"
                  min="1"
                  max="180"
                  className={cx("scoreInput")}
                  value={jlptTargetScore}
                  onChange={(event) => setJlptTargetScore(event.target.value)}
                />
                <span>/ 180</span>
              </div>
              <div className={cx("scoreOptions")}>
                {[80, 100, 120, 150].map((score) => (
                  <button
                    key={score}
                    type="button"
                    className={cx("chip", { chipActive: normalizedTargetScore === score })}
                    onClick={() => setJlptTargetScore(score)}
                  >
                    {score} điểm
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className={cx("setupPreview")}>
            <span className={cx("sectionKicker")}>Tóm tắt</span>
            <div className={cx("previewRows")}>
              <span>
                <small>Mục tiêu</small>
                <strong>{selectedGoalTitles}</strong>
              </span>
              <span>
                <small>Thời lượng</small>
                <strong>{dailyMinutes} phút/ngày</strong>
              </span>
              {includesJlptExam && (
                <span>
                  <small>Điểm mong muốn</small>
                  <strong>{normalizedTargetScore}/180</strong>
                </span>
              )}
            </div>
          </section>
        </div>

        <div className={cx("actions", "setupActions")}>
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

  const isPlacementJourney = step === 2 && experience === "some";

  return (
    <main className={cx("wrapper", { placementOnlyWrapper: isPlacementJourney })}>
      <div className={cx("shell", { placementOnlyShell: isPlacementJourney })}>
        {!isPlacementJourney && (
          <>
            <header className={cx("hero")}>
              <div className={cx("heroCopy")}>
                <div className={cx("eyebrow")}>Onboarding</div>
                <h1 className={cx("title")}>Tạo lộ trình học tiếng Nhật cá nhân hóa</h1>
                <p className={cx("subtitle")}>
                  Chọn mục tiêu, xác định trình độ và để hệ thống sắp xếp nội dung học
                  phù hợp với thời gian mỗi ngày của bạn.
                </p>
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
          </>
        )}

        {step === 1 && renderStepOne()}
        {step === 2 && renderStepTwo()}
        {step === 3 && renderGoalSetup()}

        {error && <div className={cx("error")}>{error}</div>}
        {showExitPlacementConfirm && (
          <div className={cx("confirmOverlay")} role="dialog" aria-modal="true">
            <div className={cx("confirmBox")}>
              <span className={cx("sectionKicker")}>Thoát bài test</span>
              <h3>Bạn muốn quay lại?</h3>
              <p>
                Câu trả lời hiện tại sẽ không được lưu. Bạn có thể bắt đầu lại bằng
                một bộ đề random mới.
              </p>
              <div className={cx("confirmActions")}>
                <button
                  type="button"
                  className={cx("button", "secondary")}
                  onClick={() => setShowExitPlacementConfirm(false)}
                >
                  Ở lại làm tiếp
                </button>
                <button
                  type="button"
                  className={cx("button", "primary")}
                  onClick={resetPlacementAttempt}
                >
                  Quay lại
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default Onboarding;

