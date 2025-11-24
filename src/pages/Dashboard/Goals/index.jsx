import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./Goals.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faTrash,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const mockGoals = [
  {
    id: 1,
    title: "Học 50 từ mới mỗi tuần",
    current: 34,
    target: 50,
    unit: "từ",
    period: "Tuần này",
    status: "active",
  },
  {
    id: 2,
    title: "Hoàn thành 3 đề thi",
    current: 2,
    target: 3,
    unit: "đề",
    period: "Tuần này",
    status: "active",
  },
  {
    id: 3,
    title: "Học 30 phút mỗi ngày",
    current: 5,
    target: 7,
    unit: "ngày",
    period: "Tuần này",
    status: "active",
  },
  {
    id: 4,
    title: "Học 100 chữ Kanji",
    current: 89,
    target: 100,
    unit: "chữ",
    period: "Tháng này",
    status: "active",
  },
  {
    id: 5,
    title: "Đăng 5 bài viết trong cộng đồng",
    current: 5,
    target: 5,
    unit: "bài",
    period: "Tháng này",
    status: "completed",
  },
];

function Goals() {
  const [goals, setGoals] = useState(mockGoals);
  const [showNewGoal, setShowNewGoal] = useState(false);

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const handleBack = () => {
    window.history.back();
  };

  // 3 field input tạm thời chưa lưu (giống bản gốc – TODO handle form)
  const handleDeleteGoal = (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Header */}
          <div className={cx("header")}>
            <button
              type="button"
              onClick={handleBack}
              className={cx("back-link")}
            >
              <FontAwesomeIcon icon={faArrowLeft} className={cx("back-icon")} />
              <span>Quay lại bảng điều khiển</span>
            </button>

            <div className={cx("header-row")}>
              <div>
                <h1 className={cx("title")}>Mục tiêu</h1>
                <p className={cx("subtitle")}>
                  {activeGoals.length} mục tiêu đang hoạt động •{" "}
                  {completedGoals.length} đã hoàn thành
                </p>
              </div>
              <Button
                primary
                className={cx("add-btn")}
                onClick={() => setShowNewGoal((v) => !v)}
                leftIcon={
                  <FontAwesomeIcon icon={faPlus} className={cx("add-icon")} />
                }
              >
                Thêm mục tiêu
              </Button>
            </div>
          </div>

          {/* New goal form */}
          {showNewGoal && (
            <Card className={cx("new-goal-card")}>
              <h3 className={cx("section-title")}>Tạo mục tiêu mới</h3>
              <div className={cx("form")}>
                <div className={cx("field")}>
                  <label htmlFor="goal-title" className={cx("label")}>
                    Tiêu đề mục tiêu
                  </label>
                  <Input
                    id="goal-title"
                    placeholder="Ví dụ: Học 50 từ mới mỗi tuần"
                    className={"goal-input"}
                  />
                </div>

                <div className={cx("field-row")}>
                  <div className={cx("field")}>
                    <label htmlFor="goal-target" className={cx("label")}>
                      Mục tiêu
                    </label>
                    <Input
                      id="goal-target"
                      type="number"
                      placeholder="50"
                      className={"goal-input"}
                    />
                  </div>
                  <div className={cx("field")}>
                    <label htmlFor="goal-unit" className={cx("label")}>
                      Đơn vị
                    </label>
                    <Input
                      id="goal-unit"
                      placeholder="từ"
                      className={"goal-input"}
                    />
                  </div>
                  <div className={cx("field")}>
                    <label htmlFor="goal-period" className={cx("label")}>
                      Thời gian
                    </label>
                    <select
                      id="goal-period"
                      className={cx("select")}
                      defaultValue="Tuần này"
                    >
                      <option>Tuần này</option>
                      <option>Tháng này</option>
                      <option>Năm nay</option>
                    </select>
                  </div>
                </div>

                <div className={cx("form-actions")}>
                  <Button primary className={cx("action-btn")}>
                    Tạo mục tiêu
                  </Button>
                  <Button
                    outline
                    className={cx("action-btn")}
                    onClick={() => setShowNewGoal(false)}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Active goals */}
          <section className={cx("section")}>
            <h2 className={cx("section-title")}>Đang hoạt động</h2>
            <div className={cx("goals-list")}>
              {activeGoals.map((goal) => {
                const progress = (goal.current / goal.target) * 100;
                const remaining = goal.target - goal.current;

                return (
                  <Card key={goal.id} className={cx("goal-card")}>
                    <div className={cx("goal-header")}>
                      <div className={cx("goal-header-main")}>
                        <h3 className={cx("goal-title")}>{goal.title}</h3>
                        <span className={cx("badge", "badge-period")}>
                          {goal.period}
                        </span>
                      </div>
                      <Button
                        text
                        className={cx("icon-btn", "danger")}
                        onClick={() => handleDeleteGoal(goal.id)}
                        leftIcon={
                          <FontAwesomeIcon
                            icon={faTrash}
                            className={cx("trash-icon")}
                          />
                        }
                      />
                    </div>

                    <div className={cx("goal-body")}>
                      <div className={cx("goal-row")}>
                        <span className={cx("goal-label")}>Tiến độ</span>
                        <span className={cx("goal-value")}>
                          {goal.current}/{goal.target} {goal.unit}
                        </span>
                      </div>
                      <div className={cx("progress")}>
                        <div
                          className={cx("progress-bar")}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className={cx("goal-remaining")}>
                        Còn {remaining} {goal.unit} nữa để hoàn thành
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Completed goals */}
          {completedGoals.length > 0 && (
            <section className={cx("section")}>
              <h2 className={cx("section-title")}>Đã hoàn thành</h2>
              <div className={cx("goals-list")}>
                {completedGoals.map((goal) => (
                  <Card
                    key={goal.id}
                    className={cx("goal-card", "goal-completed")}
                  >
                    <div className={cx("goal-header")}>
                      <div className={cx("goal-header-main")}>
                        <div className={cx("goal-completed-title-row")}>
                          <FontAwesomeIcon
                            icon={faCircleCheck}
                            className={cx("check-icon")}
                          />
                          <h3 className={cx("goal-title")}>{goal.title}</h3>
                        </div>
                        <span className={cx("badge", "badge-period")}>
                          {goal.period}
                        </span>
                        <p className={cx("goal-completed-text")}>
                          Hoàn thành: {goal.current}/{goal.target} {goal.unit}
                        </p>
                      </div>
                      <Button
                        text
                        className={cx("icon-btn", "danger")}
                        onClick={() => handleDeleteGoal(goal.id)}
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
          )}
        </div>
      </main>
    </div>
  );
}

export default Goals;
