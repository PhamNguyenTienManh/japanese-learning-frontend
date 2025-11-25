import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./TestPage.module.scss";

import { Link, useParams } from "react-router-dom";

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

import { getExamsByLevel } from "~/services/examService";

const cx = classNames.bind(styles);

export default function TestPage({ levelInfo = {}, basePath = "/practice" }) {
  const { level } = useParams();
  const upperLevel = level?.toUpperCase();
  const [tests, setTests] = useState([]);

  useEffect(() => {
    async function fetchTests() {
      try {
        const res = await getExamsByLevel(upperLevel);
        // API trả về { success: true, data: [...] }
        const apiTests = res.data || [];

        // map dữ liệu API + thêm các trường mặc định
        const levelDefaults = {
          N5: {
            duration: 90,
            pass_score: 80,
            sections: [
              { name: "Từ vựng", questions: 40 },
              { name: "Ngữ pháp - Đọc hiểu", questions: 80 },
              { name: "Nghe hiểu", questions: 60 },
            ],
          },
          N4: {
            duration: 115,
            pass_score: 90,
            sections: [
              { name: "Từ vựng", questions: 40 },
              { name: "Ngữ pháp - Đọc hiểu", questions: 80 },
              { name: "Nghe hiểu", questions: 60 },
            ],
          },
          N3: {
            duration: 140,
            pass_score: 95,
            sections: [
              { name: "Từ vựng", questions: 40 },
              { name: "Ngữ pháp - Đọc hiểu", questions: 80 },
              { name: "Nghe hiểu", questions: 60 },
            ],
          },
          N2: {
            duration: 155,
            pass_score: 90,
            sections: [
              { name: "Từ vựng", questions: 120 },
              { name: "Nghe hiểu", questions: 60 },
            ],
          },
          N1: {
            duration: 165,
            pass_score: 100,
            sections: [
              { name: "Từ vựng", questions: 120 },
              { name: "Nghe hiểu", questions: 60 },
            ],
          },
        };

        // Map API
        const mappedTests = apiTests.map((t) => {
          const defaults = levelDefaults[t.level] || {};
          return {
            id: t._id,
            name: t.title,
            duration: defaults.duration || 60,
            pass_score: defaults.pass_score || 80,
            completed: false,
            sections: defaults.sections || [
              { name: "Chữ và từ vựng", questions: 20 },
              { name: "Ngữ pháp", questions: 15 },
              { name: "Đọc hiểu", questions: 10 },
            ],
          };
        });

        setTests(mappedTests);
      } catch (err) {
        console.error("Lỗi khi tải đề thi:", err);
        setTests([]); // nếu lỗi thì trả về rỗng
      }
    }

    fetchTests();
  }, [upperLevel]);

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
              <Badge className={cx("badge", level)}>{upperLevel}</Badge>
              <h1 className={cx("title")}>Đề thi LPT {upperLevel}</h1>
            </div>

            {/* {description && <p className={cx("subtitle")}>{description}</p>} */}
          </div>

          {/* Stats overview */}
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
                  basePath={`${basePath}/${upperLevel.toLowerCase()}`}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
