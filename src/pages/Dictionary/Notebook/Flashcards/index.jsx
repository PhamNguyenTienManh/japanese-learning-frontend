import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "./Flashcards.module.scss";

import Button from "~/components/Button";
import Card from "~/components/Card";
import Progress from "~/components/Progress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faRotate,
  faChevronRight,
  faVolumeUp,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const mockFlashcards = [
  {
    id: 1,
    kanji: "勉強",
    hiragana: "べんきょう",
    romaji: "benkyou",
    meaning: "học tập, học hành",
  },
  {
    id: 2,
    kanji: "学校",
    hiragana: "がっこう",
    romaji: "gakkou",
    meaning: "trường học",
  },
  {
    id: 3,
    kanji: "先生",
    hiragana: "せんせい",
    romaji: "sensei",
    meaning: "giáo viên, thầy/cô",
  },
];

export default function Flashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(0);

  const total = mockFlashcards.length;
  const currentCard = mockFlashcards[currentIndex] ?? null;
  const progress =
    total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
      setCompleted((c) => c + 1);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(0);
  };

  const playAudio = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return;
    }
    alert(`Phát âm: ${text}`);
  };

  return (
    <div className={cx("root")}>
      <div className={cx("container")}>
        {/* Header */}
        <div className={cx("header")}>
          <Button
            to="/dictionary/notebook"
            back
            leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}
          >
            Quay lại sổ tay
          </Button>

          <h1 className={cx("title")}>Luyện tập Flashcard</h1>
          <p className={cx("subtitle")}>
            Thẻ {Math.min(currentIndex + 1, total)} / {total}
          </p>
        </div>

        <div className={cx("progress-wrap")}>
          <Progress value={progress} className={cx("progress")} />
        </div>

        <div className={cx("flashcard-area")}>
          {currentCard ? (
            <>
              <Card
                className={cx("card", { flipped: isFlipped })}
                onClick={() => setIsFlipped((f) => !f)}
              >
                {!isFlipped ? (
                  <div className={cx("front")}>
                    <div className={cx("front-top")}>
                      <h2 className={cx("kanji")}>{currentCard.kanji}</h2>

                      <Button
                        outline
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio(currentCard.hiragana);
                        }}
                        className={"no-margin"}
                        leftIcon={
                          <FontAwesomeIcon icon={faVolumeUp} />
                        }
                      >
                      </Button>
                    </div>

                    <p className={cx("hiragana")}>{currentCard.hiragana}</p>
                    {currentCard.romaji && (
                      <p className={cx("romaji")}>[{currentCard.romaji}]</p>
                    )}
                    <p className={cx("hint")}>Nhấn để xem nghĩa</p>
                  </div>
                ) : (
                  <div className={cx("back")}>
                    <p className={cx("meaning")}>{currentCard.meaning}</p>
                    <div className={cx("meta")}>
                      <p className={cx("meta-kanji")}>{currentCard.kanji}</p>
                      <p className={cx("meta-hira")}>{currentCard.hiragana}</p>
                    </div>
                    <p className={cx("hint")}>Nhấn để quay lại</p>
                  </div>
                )}
              </Card>

              {/* Actions */}
              <div className={cx("actions")}>
                <Button
                  outline
                  onClick={handleReset}
                  leftIcon={<FontAwesomeIcon icon={faRotate} />
                  }>
                  Bắt đầu lại
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={currentIndex >= total - 1}
                  primary
                  rightIcon={
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className={cx("icon-right")}
                    />
                  }
                >
                  Tiếp theo

                </Button>
              </div>
            </>
          ) : (
            <Card className={cx("empty")}>
              <h2 className={cx("empty-title")}>Hoàn thành!</h2>
              <p className={cx("empty-sub")}>Bạn đã hoàn thành {total} thẻ</p>
              <Button onClick={handleReset} className={cx("restart-btn")}>
                <FontAwesomeIcon icon={faRotate} className={cx("icon-left")} />
                Luyện lại
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
