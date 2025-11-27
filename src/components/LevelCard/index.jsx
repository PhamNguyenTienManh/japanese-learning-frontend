import React from "react";
import classNames from "classnames/bind";
import styles from "./LevelCard.module.scss";

import Button from "~/components/Button";
import Badge from "~/components/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faClock,
  faBullseye,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

export default function LevelCard({
  level,
  startTo,
  resultsTo,
  onStart,
  onResults,
  className = "",
}) {
  const {
    level: levelName,
    name,
    description,
    totalTests,
    duration,
    questions,
    colorClass,
  } = level;

  const rootClass = className ? `${cx("root")} ${className}` : cx("root");

  return (
    <div className={rootClass}>
      <div className={cx("inner")}>
        <div className={cx("main")}>
          <div className={cx("top")}>
            <Badge className={cx("badge", colorClass)}>{levelName}</Badge>
            <h3 className={cx("name")}>{name}</h3>
          </div>

          <p className={cx("desc")}>{description}</p>

          <div className={cx("meta")}>
            <div className={cx("meta-item")}>
              <FontAwesomeIcon icon={faBookOpen} className={cx("meta-icon")} />
              <span>{totalTests} đề thi</span>
            </div>

            {/* <div className={cx("meta-item")}>
              <FontAwesomeIcon icon={faClock} className={cx("meta-icon")} />
              <span>{duration}</span>
            </div>

            <div className={cx("meta-item")}>
              <FontAwesomeIcon icon={faBullseye} className={cx("meta-icon")} />
              <span>{questions} câu hỏi</span>
            </div> */}
          </div>
        </div>


        <Button to={startTo} primary onClick={onStart}>
          Bắt đầu luyện thi
        </Button>

      </div>
    </div>
  );
}
