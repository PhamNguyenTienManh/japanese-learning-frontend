import React from "react";
import classNames from "classnames/bind";
import styles from "./Practice.module.scss";

import Card from "~/components/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faClock,
  faBookOpen,
  faBullseye,
} from "@fortawesome/free-solid-svg-icons";
import LevelCard from "~/components/LevelCard";

const cx = classNames.bind(styles);

const jlptLevels = [
  {
    level: "N5",
    name: "Sơ cấp",
    description: "Hiểu được tiếng Nhật cơ bản",
    totalTests: 20,
    duration: "60 phút",
    questions: 50,
    colorClass: "n5",
  },
  {
    level: "N4",
    name: "Sơ cấp nâng cao",
    description: "Hiểu được tiếng Nhật cơ bản ở mức độ cao hơn",
    totalTests: 18,
    duration: "90 phút",
    questions: 70,
    colorClass: "n4",
  },
  {
    level: "N3",
    name: "Trung cấp",
    description: "Hiểu được tiếng Nhật sử dụng trong cuộc sống hàng ngày",
    totalTests: 15,
    duration: "120 phút",
    questions: 90,
    colorClass: "n3",
  },
  {
    level: "N2",
    name: "Trung cấp nâng cao",
    description: "Hiểu được tiếng Nhật trong nhiều tình huống",
    totalTests: 12,
    duration: "150 phút",
    questions: 100,
    colorClass: "n2",
  },
  {
    level: "N1",
    name: "Cao cấp",
    description: "Hiểu được tiếng Nhật trong nhiều tình huống phức tạp",
    totalTests: 10,
    duration: "170 phút",
    questions: 110,
    colorClass: "n1",
  },
];

export default function Practice() {
  return (
    <div className={cx("root")}>
      <div className={cx("container")}>
        {/* Header */}
        <div className={cx("header")}>
          <h1 className={cx("title")}>Luyện thi JLPT</h1>
          <p className={cx("subtitle")}>
            Hệ thống đề thi JLPT đầy đủ từ N5 đến N1 với chấm điểm tự động
          </p>
        </div>

        {/* Stats */}
        <div className={cx("stats-grid")}>
          <Card className={cx("stat-card")}>
            <div className={cx("stat-inner")}>
              <div className={cx("stat-icon")}>
                <FontAwesomeIcon icon={faTrophy} />
              </div>
              <div>
                <p className={cx("stat-value")}>75</p>
                <p className={cx("stat-label")}>Đề thi</p>
              </div>
            </div>
          </Card>

          <Card className={cx("stat-card")}>
            <div className={cx("stat-inner")}>
              <div className={cx("stat-icon")}>
                <FontAwesomeIcon icon={faBookOpen} />
              </div>
              <div>
                <p className={cx("stat-value")}>420</p>
                <p className={cx("stat-label")}>Câu hỏi</p>
              </div>
            </div>
          </Card>

          <Card className={cx("stat-card")}>
            <div className={cx("stat-inner")}>
              <div className={cx("stat-icon")}>
                <FontAwesomeIcon icon={faBullseye} />
              </div>
              <div>
                <p className={cx("stat-value")}>12</p>
                <p className={cx("stat-label")}>Đã hoàn thành</p>
              </div>
            </div>
          </Card>

          <Card className={cx("stat-card")}>
            <div className={cx("stat-inner")}>
              <div className={cx("stat-icon")}>
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div>
                <p className={cx("stat-value")}>85%</p>
                <p className={cx("stat-label")}>Điểm TB</p>
              </div>
            </div>
          </Card>
        </div>

        <div className={cx("levels")}>
          {jlptLevels.map((lvl) => (
            <LevelCard
              key={lvl.level}
              level={lvl}
              startTo={`/practice/${lvl.level.toLowerCase()}`}
              resultsTo={`/practice/${lvl.level.toLowerCase()}/results`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
