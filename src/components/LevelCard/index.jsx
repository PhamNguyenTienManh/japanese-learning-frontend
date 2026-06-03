import React from "react";
import classNames from "classnames/bind";
import styles from "./LevelCard.module.scss";

import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faClock,
  faBullseye,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

export default function LevelCard({
  level,
  startTo,
  onStart,
  className = "",
}) {
  const {
    level: levelName,
    name,
    description,
    totalTests,
    duration,
    passScore,
    focus,
    colorClass,
  } = level;

  const rootClass = `${cx("root", colorClass)} ${className}`.trim();

  return (
    <article className={rootClass}>
      <div className={cx("inner")}>
        <div className={cx("glyph")}>{levelName}</div>

        <div className={cx("main")}>
          <div className={cx("top")}>
            <h3 className={cx("name")}>{name}</h3>
            <span className={cx("level-label")}>JLPT {levelName}</span>
          </div>

          <p className={cx("desc")}>{description}</p>

          <div className={cx("meta")}>
            <div className={cx("meta-item")}>
              <FontAwesomeIcon icon={faBookOpen} className={cx("meta-icon")} />
              <span>{totalTests} đề thi</span>
            </div>

            <div className={cx("meta-item")}>
              <FontAwesomeIcon icon={faClock} className={cx("meta-icon")} />
              <span>{duration} phút</span>
            </div>

            <div className={cx("meta-item")}>
              <FontAwesomeIcon icon={faBullseye} className={cx("meta-icon")} />
              <span>Đạt {passScore} điểm</span>
            </div>
          </div>

          <p className={cx("focus")}>{focus}</p>
        </div>

        <div className={cx("actions")}>
          <Button
            to={startTo}
            primary
            full
            className={cx("start-button")}
            onClick={onStart}
            rightIcon={<FontAwesomeIcon icon={faArrowRight} />}
          >
            Xem đề thi
          </Button>
        </div>
      </div>
    </article>
  );
}
