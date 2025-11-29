import React, { useState } from "react";
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
import { startExam } from "~/services/examService";
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
    questions = 0,
    completed = false,
    score,
    sections = [],
  } = test || {};

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn } = useAuth();
  console.log("test: ", test);

  const resultsLink = `${basePath}/results/${id}`;

  // Hàm xử lý khi nhấn "Bắt đầu" hoặc "Làm lại"
  const handleStartExam = async () => {
    try {
      setIsLoading(true);

      // Gọi API để bắt đầu bài thi
      const response = await startExam(id);

      // Log để kiểm tra cấu trúc response
      console.log("Response từ API startExam:", response);

      // Lấy examResultId từ response.data._id
      const examResultId = response?.data?._id;

      if (examResultId) {
        // Lưu examResultId vào localStorage
        localStorage.setItem("currentExamResultId", examResultId);

        console.log("Đã lưu examResultId:", examResultId);

        // Chuyển hướng đến trang làm bài
        navigate(`${basePath}/test/${id}`);
      } else {
        console.error("Response structure:", JSON.stringify(response, null, 2));
        throw new Error("Không nhận được examResultId từ server");
      }
    } catch (error) {
      console.error("Lỗi khi bắt đầu bài thi:", error);
      alert("Có lỗi xảy ra khi bắt đầu bài thi. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
              <span>Điểm đạt: {questions} điểm</span>
            </div>

            {completed && typeof score === "number" && (
              <div className={cx("meta-item", "score")}>
                <span className={cx("score-text")}>Điểm: {score}%</span>
              </div>
            )}
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
  );
}