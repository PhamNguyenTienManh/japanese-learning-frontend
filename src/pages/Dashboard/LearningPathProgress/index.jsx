import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";

import styles from "./LearningPathProgress.module.scss";
import { getLearningPathDashboard } from "~/services/learningPathService";

const cx = classNames.bind(styles);

const skillMeta = {
  vocab: { icon: "🔤", label: "Từ vựng" },
  grammar: { icon: "📝", label: "Ngữ pháp" },
  kanji: { icon: "🖊", label: "Kanji" },
  conversation: { icon: "🗣", label: "Hội thoại" },
  jlpt_exam: { icon: "📋", label: "Đề JLPT" },
  reading: { icon: "📖", label: "Đọc hiểu" },
  writing: { icon: "✍️", label: "Viết" },
};

const getTaskHref = (task, level) => {
  const order = Number(task.order) || 1;
  const levelLower = String(level || "N5").toLowerCase();

  if (task.skill === "vocab") {
    return `/jlpt?type=word&level=${level}&tour=flashcard&lpSkill=vocab&lpOrder=${order}`;
  }
  if (task.skill === "kanji") {
    return `/jlpt?type=kanji&level=${level}&tour=flashcard&lpSkill=kanji&lpOrder=${order}`;
  }
  if (task.skill === "grammar") {
    return `/jlpt?type=grammar&level=${level}&tour=flashcard&lpSkill=grammar&lpOrder=${order}`;
  }
  if (task.skill === "jlpt_exam") {
    return `/practice/${levelLower}?tour=exam`;
  }
  if (task.skill === "conversation") return "/conversation?tour=conversation";
  if (task.skill === "reading") return "/reading?tour=reading";
  if (task.skill === "writing") return `/jlpt?type=kanji&level=${level}&writing=1&tour=writing`;

  return null;
};

function LearningPathProgress() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getLearningPathDashboard();
      setData(result);
      setError("");
    } catch (err) {
      console.error("Failed to load learning path progress:", err);
      setError("Không tải được tiến độ lộ trình.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const weekTasks = data?.weekTasks || [];
  const weekProgress = data?.weekProgress || {};
  const weekPercent = Math.min(Math.max(Number(weekProgress.percent) || 0, 0), 100);
  const generationSource = data?.generationSource === "ai" ? "ai" : "fallback";

  return (
    <main className={cx("wrapper")}>
      <div className={cx("container")}>
        <header className={cx("hero")}>
          <div className={cx("heroContent")}>
            <div className={cx("eyebrow")}>Lộ trình cá nhân</div>
            <h1 className={cx("title")}>Kế hoạch học tuần này</h1>
            <p className={cx("subtitle")}>
              Theo dõi các mục AI đã lên lịch, mức hoàn thành từng kỹ năng và bắt đầu bài học đúng nơi trong hệ thống.
            </p>
          </div>
          <button type="button" className={cx("regenerateBtn")} onClick={() => navigate("/onboarding")}>
            Tạo lại lộ trình
          </button>
        </header>

        {loading ? (
          <div className={cx("state")}>
            <span className={cx("stateSpinner")} />
            <strong>Đang tải tiến độ lộ trình...</strong>
            <p>Chúng tôi đang lấy kế hoạch học mới nhất của bạn.</p>
          </div>
        ) : error ? (
          <div className={cx("state")}>
            <strong>{error}</strong>
            <button type="button" className={cx("stateBtn")} onClick={loadProgress}>
              Thử lại
            </button>
          </div>
        ) : !data?.hasLearningPath ? (
          <div className={cx("state")}>
            <strong>Bạn chưa có lộ trình học.</strong>
            <p>Hãy tạo lộ trình cá nhân hóa để AI sắp xếp bài học phù hợp với mục tiêu của bạn.</p>
            <button type="button" className={cx("stateBtn")} onClick={() => navigate("/onboarding")}>
              Tạo lộ trình
            </button>
          </div>
        ) : (
          <>
            <section className={cx("overview")}>
              <div className={cx("summaryCard")}>
                <div className={cx("summaryLabel")}>Tuần hiện tại</div>
                <div className={cx("summaryValue")}>{weekProgress.week || 1}</div>
                <p className={cx("summaryHint")}>Cấp độ {data.level || "N5"}</p>
              </div>
              <div className={cx("summaryCard")}>
                <div className={cx("summaryLabel")}>Bài hoàn thành</div>
                <div className={cx("summaryValue")}>
                  {weekProgress.completed || 0}/{weekProgress.total || 0}
                </div>
                <p className={cx("summaryHint")}>Theo kế hoạch tuần</p>
              </div>
              <div className={cx("summaryCard", "progressSummary")}>
                <div className={cx("summaryLabel")}>Tiến độ tuần</div>
                <div className={cx("summaryValue")}>{weekPercent}%</div>
                <div className={cx("miniTrack")}>
                  <span style={{ width: `${weekPercent}%` }} />
                </div>
              </div>
            </section>

            <section className={cx("panel")}>
              <div className={cx("panelHeader")}>
                <div>
                  <h2>Nhiệm vụ học tập</h2>
                  <p>{weekTasks.length} mục được AI đề xuất cho tuần này</p>
                </div>
                <div className={cx("panelBadges")}>
                  <span className={cx("panelBadge", { fallbackBadge: generationSource === "fallback" })}>
                    {generationSource === "ai" ? "Tạo bởi AI" : "Kế hoạch dự phòng"}
                  </span>
                  <span className={cx("panelBadge")}>{weekPercent}% hoàn thành</span>
                </div>
              </div>

              {weekTasks.length === 0 ? (
                <div className={cx("emptyTasks")}>
                  Tuần này chưa có mục học nào trong lộ trình.
                </div>
              ) : (
                <div className={cx("taskList")}>
                  {weekTasks.map((task) => {
                    const meta = skillMeta[task.skill] || { icon: "📌", label: task.skill };
                    const progress = task.progress || {
                      count: task.completedAt ? task.targetCount || 1 : 0,
                      target: task.targetCount || 1,
                      percent: task.completedAt ? 100 : 0,
                      label: `${task.completedAt ? task.targetCount || 1 : 0}/${task.targetCount || 1} mục`,
                    };
                    const progressPercent = Math.min(Math.max(Number(progress.percent) || 0, 0), 100);
                    const href = getTaskHref(task, data.level);
                    const isDone = Boolean(task.completedAt || progress.isComplete);

                    return (
                      <article key={`${task.skill}-${task.order}`} className={cx("taskCard")}>
                        <div className={cx("taskTop")}>
                          <span className={cx("icon")}>{meta.icon}</span>
                          <div className={cx("taskInfo")}>
                            <div className={cx("taskLabelRow")}>
                              <span>{meta.label}</span>
                              <span>{task.estimatedMinutes || 15} phút</span>
                            </div>
                            <h3 className={cx("taskTitle")}>{task.title || meta.label}</h3>
                            <p className={cx("taskMeta")}>
                              {progress.requirement || progress.label}
                            </p>
                          </div>
                          <span className={cx("badge", { badgeDone: isDone })}>
                            {isDone ? "Hoàn thành" : `${progressPercent}%`}
                          </span>
                        </div>

                        <div className={cx("progressBlock")}>
                          <div className={cx("progressMeta")}>
                            <span>{progress.label}</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className={cx("progressTrack")}>
                            <div
                              className={cx("progressFill", { progressFillDone: isDone })}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          {progress.latestScore !== null && progress.latestScore !== undefined && (
                            <p className={cx("scoreNote")}>Điểm cao nhất tuần này: {progress.latestScore}</p>
                          )}
                        </div>

                        {href && (
                          <div className={cx("taskActions")}>
                            <button type="button" className={cx("startBtn")} onClick={() => navigate(href)}>
                              {isDone ? "Tiếp tục luyện" : "Bắt đầu học"}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default LearningPathProgress;


