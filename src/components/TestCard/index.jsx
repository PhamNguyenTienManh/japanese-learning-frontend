import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./TestCard.module.scss";

import Button from "~/components/Button";
import Card from "~/components/Card";
import Badge from "~/components/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faBookOpen,
  faPlay,
  faCheckCircle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { startExam, checkExamStatus } from "~/services/examService";
import { useAuth } from "~/context/AuthContext";
const cx = classNames.bind(styles);

export default function TestCard({
  test,
  basePath = "/practice",
  className = "",
}) {
  const {
    id,
    name,
    duration = 0,
    completed = false,
    pass_score = 80,
    sections = [],
  } = test || {};

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedExamResultId, setSavedExamResultId] = useState(null);
  const { isLoggedIn } = useAuth();
  console.log("test: ", test);

  const resultsLink = `${basePath}/results/${id}`;

  const doStartNewExam = async () => {
    const response = await startExam(id);
    const examResultId = response?.data?._id;
    if (!examResultId) throw new Error("Không nhận được examResultId từ server");
    localStorage.setItem("currentExamResultId", examResultId);
    navigate(`${basePath}/test/${id}`);
  };

  // Hàm xử lý khi nhấn "Bắt đầu" hoặc "Làm lại"
  const handleStartExam = async () => {
    try {
      setIsLoading(true);

      // Kiểm tra trạng thái bài thi trước
      const statusRes = await checkExamStatus(id);
      const status = statusRes?.data?.status;

      if (status === "saving") {
        setSavedExamResultId(statusRes.data.examResultId);
        setShowResumeDialog(true);
        return;
      }

      await doStartNewExam();
    } catch (error) {
      console.error("Lỗi khi bắt đầu bài thi:", error);
      alert("Có lỗi xảy ra khi bắt đầu bài thi. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeExam = () => {
    localStorage.setItem("currentExamResultId", savedExamResultId);
    setShowResumeDialog(false);
    navigate(`${basePath}/test/${id}`);
  };

  const handleStartNewExam = async () => {
    try {
      setIsLoading(true);
      setShowResumeDialog(false);
      await doStartNewExam();
    } catch (error) {
      console.error("Lỗi khi bắt đầu bài thi mới:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const resumeDialog = showResumeDialog
    ? createPortal(
        <div className={cx("resume-overlay")} onClick={() => setShowResumeDialog(false)}>
          <div className={cx("resume-dialog")} onClick={(e) => e.stopPropagation()}>
            <h3 className={cx("resume-title")}>Bài thi đang làm dở</h3>
            <p className={cx("resume-message")}>
              Bạn có bài thi chưa hoàn thành. Bạn muốn tiếp tục hay bắt đầu bài mới?
            </p>
            <div className={cx("resume-actions")}>
              <Button primary onClick={handleResumeExam}>Tiếp tục bài cũ</Button>
              <Button outline onClick={handleStartNewExam} disabled={isLoading}>Làm bài mới</Button>
              <button className={cx("resume-cancel")} onClick={() => setShowResumeDialog(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
    {resumeDialog}
    <Card className={`${cx("root")} ${className}`}>
      <div className={cx("inner")}>
        <div className={cx("main")}>
          <div className={cx("top")}>
            <h3 className={cx("name")}>{name}</h3>

            {completed && (
              <Badge variant="secondary" className={cx("completed")}>
                <FontAwesomeIcon icon={faCheckCircle} className={cx("check")} />
                Đã hoàn thành
              </Badge>
            )}
          </div>

          <div className={cx("meta-row")}>
            <div className={cx("meta-item")}>
              <FontAwesomeIcon icon={faClock} className={cx("meta-icon")} />
              <span>{duration} phút</span>
            </div>

            <div className={cx("meta-item")}>
              <span>Điểm đạt: {pass_score} điểm</span>
            </div>
          </div>

          <div className={cx("sections")}>
            <p className={cx("sections-title")}>Các phần thi:</p>
            <div className={cx("sections-grid")}>
              {Array.isArray(sections) && sections.length > 0 ? (
                sections.map((s, i) => (
                  <div key={i} className={cx("section-item")}>
                    • {s.name} ({s.questions} điểm)
                  </div>
                ))
              ) : (
                <div className={cx("section-item", "muted")}>
                  Không có thông tin phần thi
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={cx("actions")}>
          {!isLoggedIn ?
            <Button primary disabled>
              Bạn cần đăng nhập để thực hiện bài thi
            </Button>
            :
            <Button
              onClick={handleStartExam}
              full
              primary
              disabled={isLoading}
              leftIcon={
                <FontAwesomeIcon
                  icon={isLoading ? faSpinner : faPlay}
                  spin={isLoading}
                />
              }
            >
              {isLoading
                ? "Đang tải..."
                : completed
                  ? "Làm lại"
                  : "Bắt đầu"
              }
            </Button>}

          {completed && (
            <Button to={resultsLink} outline className={"orange"}>
              Xem kết quả
            </Button>
          )}
        </div>
      </div>
    </Card>
    </>
  );
}