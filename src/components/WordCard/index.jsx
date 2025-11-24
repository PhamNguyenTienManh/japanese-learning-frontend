import React from "react";
import classNames from "classnames/bind";
import styles from "./WordCard.module.scss";

import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVolumeUp,
  faBookmark as faBookmarkSolid,
} from "@fortawesome/free-solid-svg-icons";
import { faBookmark as faBookmarkRegular } from "@fortawesome/free-regular-svg-icons";
import Card from "../Card";

const cx = classNames.bind(styles);

function WordCard({ word, saved, onToggleSave, onPlay }) {
  return (
    <Card className={cx("card")}>
      <div className={cx("grid")}>
        <div className={cx("main")}>
          {/* Header */}
          <div className={cx("header")}>
            <h3 className={cx("kanji")}>{word.kanji}</h3>
            <span className={cx("jlpt")}>{word.jlptLevel}</span>
          </div>

          <div className={cx("reading")}>
            <p className={cx("hiragana")}>{word.hiragana}</p>
            <p className={cx("romaji")}>[{word.romaji}]</p>
          </div>

          {/* Meaning */}
          <div className={cx("meaning")}>
            <strong>Nghĩa: </strong> {word.meaning}
          </div>

          <div className={cx("divider")}></div>

          {/* Examples */}
          {word.examples.length > 0 && (
            <div className={cx("examples")}>
              <p className={cx("examples-label")}>Ví dụ:</p>

              {word.examples.map((ex, idx) => (
                <div key={idx} className={cx("example-item")}>
                  <p className={cx("example-jp")}>{ex.japanese}</p>
                  <p className={cx("example-vi")}>{ex.vietnamese}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className={cx("actions")}>
          <Button onClick={() => onPlay(word.hiragana)} className={"orange"}>
            <FontAwesomeIcon icon={faVolumeUp} className={cx("icon")} />
          </Button>
          <Button onClick={() => onToggleSave(word.id)} className={"orange"}>
            <FontAwesomeIcon
              icon={saved ? faBookmarkSolid : faBookmarkRegular}
              className={cx("icon")}
            />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default WordCard;
