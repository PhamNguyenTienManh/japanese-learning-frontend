import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "./Notebook.module.scss";

import Button from "~/components/Button";
import Card from "~/components/Card";
import Badge from "~/components/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVolumeUp,
  faTrash,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const cx = classNames.bind(styles);

const mockSavedWords = [
  {
    id: 1,
    kanji: "勉強",
    hiragana: "べんきょう",
    romaji: "benkyou",
    meaning: "học tập, học hành",
    jlptLevel: "N5",
    savedDate: "2025-01-10",
  },
  {
    id: 2,
    kanji: "学校",
    hiragana: "がっこう",
    romaji: "gakkou",
    meaning: "trường học",
    jlptLevel: "N5",
    savedDate: "2025-01-09",
  },
];

export default function Notebook() {
  const [savedWords, setSavedWords] = useState(mockSavedWords);

  const removeWord = (wordId) => {
    setSavedWords((prev) => prev.filter((w) => w.id !== wordId));
  };

  const playAudio = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "ja-JP";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
      return;
    }
    alert(`Phát âm: ${text}`);
  };

  return (
    <div className={cx("root")}>
      <div className={cx("container")}>
        <div className={cx("header")}>
          <Button
            to="/dictionary"
            text
            className={"back-link"}
            leftIcon={<FontAwesomeIcon icon={faArrowLeft} />}
          >
            <span>Quay lại từ điển</span>
          </Button>

          <h1 className={cx("title")}>Sổ tay của tôi</h1>
          <p className={cx("subtitle")}>{savedWords.length} từ đã lưu</p>
        </div>

        <div className={cx("actions")}>
          <Button
            to="/dictionary/notebook/flashcards"
            className={"orange"}
            outline
          >
            Luyện tập Flashcard
          </Button>

          <Button
            outline
            className={"orange"}
            onClick={() => alert("Xuất file PDF (chưa tích hợp)")}
          >
            Xuất PDF
          </Button>
        </div>

        <div className={cx("list")}>
          {savedWords.length === 0 ? (
            <Card className={cx("empty")}>
              <p className={cx("empty-text")}>Bạn chưa lưu từ nào</p>
              <Link to="/dictionary">
                <Button className={"green"}>Khám phá từ điển</Button>
              </Link>
            </Card>
          ) : (
            savedWords.map((word) => (
              <Card key={word.id} className={cx("word-card")}>
                <div className={cx("word-row")}>
                  <div className={cx("word-main")}>
                    <div className={cx("word-header")}>
                      <h3 className={cx("kanji")}>{word.kanji}</h3>
                      {word.jlptLevel && (
                        <Badge className={cx("jlpt")} variant="secondary">
                          {word.jlptLevel}
                        </Badge>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudio(word.hiragana)}
                        className={cx("audio-btn")}
                      >
                        <FontAwesomeIcon icon={faVolumeUp} />
                      </Button>
                    </div>

                    <div className={cx("reading")}>
                      {word.hiragana && (
                        <p className={cx("hiragana")}>{word.hiragana}</p>
                      )}
                      {word.romaji && (
                        <p className={cx("romaji")}>[{word.romaji}]</p>
                      )}
                    </div>

                    {word.meaning && (
                      <div className={cx("meaning")}>
                        <span className={cx("label")}>Nghĩa:</span>{" "}
                        {word.meaning}
                      </div>
                    )}

                    {word.savedDate && (
                      <div className={cx("saved-date")}>
                        Đã lưu: {word.savedDate}
                      </div>
                    )}
                  </div>

                  <div className={cx("word-actions")}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWord(word.id)}
                      className={"text-destructive"}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
