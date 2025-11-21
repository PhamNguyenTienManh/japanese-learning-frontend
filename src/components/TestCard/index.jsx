import React from "react";
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
} from "@fortawesome/free-solid-svg-icons";

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

  const startLink = `${basePath}/${id}/test`;
  const resultsLink = `${basePath}/${id}/results`;

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
              <FontAwesomeIcon icon={faBookOpen} className={cx("meta-icon")} />
              <span>{questions} câu hỏi</span>
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
                    • {s.name} ({s.questions} câu)
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
          <Button
            to={startLink}
            full
            className={"green"}
            leftIcon={<FontAwesomeIcon icon={faPlay} />}
          >
            {completed ? "Làm lại" : "Bắt đầu"}
          </Button>

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
