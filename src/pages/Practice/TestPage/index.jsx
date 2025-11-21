import React from "react";
import classNames from "classnames/bind";
import styles from "./TestPage.module.scss";

import { Link } from "react-router-dom";

import Badge from "~/components/Badge";
import TestCard from "~/components/TestCard";
import Card from "~/components/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faTrophy,
  faBookOpen,
  faBullseye,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import Button from "~/components/Button";

const cx = classNames.bind(styles);

export default function TestPage({
  levelInfo = {},
  tests = [],
  basePath = "/practice",
}) {
  if (!tests.length) {
    tests = [
      {
        id: 1,
        name: "Đề thi JLPT N5 - Đề số 1",
        duration: 60,
        questions: 50,
        completed: true,
        score: 85,
        sections: [
          { name: "Chữ và từ vựng", questions: 20 },
          { name: "Ngữ pháp", questions: 15 },
          { name: "Đọc hiểu", questions: 10 },
          { name: "Nghe hiểu", questions: 5 },
        ],
      },
      {
        id: 2,
        name: "Đề thi JLPT N5 - Đề số 2",
        duration: 60,
        questions: 50,
        completed: false,
        sections: [
          { name: "Chữ và từ vựng", questions: 20 },
          { name: "Ngữ pháp", questions: 15 },
          { name: "Đọc hiểu", questions: 10 },
          { name: "Nghe hiểu", questions: 5 },
        ],
      },
      {
        id: 3,
        name: "Đề thi JLPT N5 - Đề số 3",
        duration: 60,
        questions: 50,
        completed: false,
        sections: [
          { name: "Chữ và từ vựng", questions: 20 },
          { name: "Ngữ pháp", questions: 15 },
          { name: "Đọc hiểu", questions: 10 },
          { name: "Nghe hiểu", questions: 5 },
        ],
      },
    ];
  }

  if (!levelInfo.code) {
    levelInfo = {
      code: "N5",
      name: "Đề thi JLPT N5",
      description: "Bộ đề thi luyện tập trình độ sơ cấp N5",
      colorClass: "n5",
    };
  }
  const {
    code = "N?",
    name = "Level",
    description = "",
    colorClass = "n5",
  } = levelInfo;

  const testList = Array.isArray(tests) ? tests : [];
  return (
    <div className={cx("root")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Header */}
          <div className={cx("header")}>
            <Link to="/practice" className={cx("back-link")}>
              <FontAwesomeIcon icon={faArrowLeft} />
              <span className={cx("back-text")}>Quay lại</span>
            </Link>

            <div className={cx("title-row")}>
              <Badge className={cx("badge", colorClass)}>{code}</Badge>
              <h1 className={cx("title")}>{name}</h1>
            </div>

            {description && <p className={cx("subtitle")}>{description}</p>}
          </div>

          {/* Stats overview (optional) */}
          <div className={cx("stats-grid")}>
            <Card className={cx("stat-card")}>
              <div className={cx("stat-inner")}>
                <div className={cx("stat-icon")}>
                  <FontAwesomeIcon icon={faTrophy} />
                </div>
                <div>
                  <p className={cx("stat-value")}>{testList.length}</p>
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
                  <p className={cx("stat-value")}>
                    {testList.reduce((sum, t) => sum + (t.questions || 0), 0)}
                  </p>
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
                  <p className={cx("stat-value")}>
                    {testList.filter((t) => t.completed).length}
                  </p>
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
                  <p className={cx("stat-value")}>
                    {testList.length
                      ? Math.round(
                          testList.reduce((s, t) => s + (t.duration || 0), 0) /
                            testList.length
                        )
                      : 0}
                    ’
                  </p>
                  <p className={cx("stat-label")}>Thời lượng TB</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tests list */}
          <div className={cx("list")}>
            {testList.length === 0 ? (
              <Card className={cx("empty")}>
                <p className={cx("empty-text")}>Chưa có đề thi cho cấp này</p>
                <Link to="/practice">
                  <Button className={cx("btn-back")}>Quay lại danh sách</Button>
                </Link>
              </Card>
            ) : (
              testList.map((test) => (
                <TestCard
                  key={test.id}
                  test={test}
                  basePath={`${basePath}/${code.toLowerCase()}`}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
