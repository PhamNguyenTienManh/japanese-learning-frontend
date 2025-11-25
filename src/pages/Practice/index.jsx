import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./Practice.module.scss";

import Card from "~/components/Card";
import LevelCard from "~/components/LevelCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy,
  faClock,
  faBookOpen,
  faBullseye,
} from "@fortawesome/free-solid-svg-icons";

import { getExamCountByLevel } from "~/services/examService";

const cx = classNames.bind(styles);

export default function Practice() {
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    async function fetchExamCounts() {
      try {
        const data = await getExamCountByLevel();
        const counts = data.data || {};

        const mappedLevels = [
          {
            level: "N5",
            name: "Sơ cấp",
            description: "Hiểu được tiếng Nhật cơ bản",
            totalTests: counts.N5 || 0,
            // duration: "90 phút",
            // questions: 180,
            colorClass: "n5",
          },
          {
            level: "N4",
            name: "Sơ cấp nâng cao",
            description: "Hiểu được tiếng Nhật cơ bản ở mức độ cao hơn",
            totalTests: counts.N4 || 0,
            // duration: "115 phút",
            // questions: 180,
            colorClass: "n4",
          },
          {
            level: "N3",
            name: "Trung cấp",
            description:
              "Hiểu được tiếng Nhật sử dụng trong cuộc sống hàng ngày",
            totalTests: counts.N3 || 0,
            // duration: "140 phút",
            // questions: 180,
            colorClass: "n3",
          },
          {
            level: "N2",
            name: "Trung cấp nâng cao",
            description: "Hiểu được tiếng Nhật trong nhiều tình huống",
            totalTests: counts.N2 || 0,
            // duration: "155 phút",
            // questions: 180,
            colorClass: "n2",
          },
          {
            level: "N1",
            name: "Cao cấp",
            description: "Hiểu được tiếng Nhật trong nhiều tình huống phức tạp",
            totalTests: counts.N1 || 0,
            // duration: "165 phút",
            // questions: 180,
            colorClass: "n1",
          },
        ];

        setLevels(mappedLevels);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      }
    }

    fetchExamCounts();
  }, []);

  const totalExams = levels.reduce(
    (sum, lvl) => sum + (lvl.totalTests || 0),
    0
  );

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
                <p className={cx("stat-value")}>{totalExams}</p>
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

        {/* Level cards */}
        <div className={cx("levels")}>
          {levels.map((lvl) => (
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
