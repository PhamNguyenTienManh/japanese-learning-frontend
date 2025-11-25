import React, { useState } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faBolt,
    faUsers,
    faFileLines,
    faPlay,
    faShuffle,
    faPlus,
    faVolumeHigh,
    faDownload,
} from "@fortawesome/free-solid-svg-icons";

import Button from "~/components/Button";
import styles from "./JLPT.module.scss";
import Card from "~/components/Card";


const cx = classNames.bind(styles);

const jlptFeatures = [
    {
        icon: faBookOpen,
        label: "FlashCard",
        href: "/flashcards",
    },
    {
        icon: faBolt,
        label: "Quizz",
        href: "/quizz",
    },
    {
        icon: faUsers,
        label: "Luyện nói, viết",
        href: "/speaking",
    },
    {
        icon: faFileLines,
        label: "Mini Test",
        href: "/mini-test",
    },
];

const vocabularyTypes = ["Từ vựng", "Ngữ pháp", "Hán tự"];
const jlptLevels = ["N5", "N4", "N3", "N2", "N1"];

const sampleVocabulary = [
    {
        id: 1,
        kanji: "人",
        hiragana: "たり と ヒト にん ひとり",
        meaning: "con người; nhân loại; người khác",
        translation: "person; human; people; mankind",
    },
    {
        id: 2,
        kanji: "年",
        hiragana: "ねん と し と ねん",
        meaning: "năm; niên; tuổi",
        translation: "year; age; years old",
    },
    {
        id: 3,
        kanji: "中",
        hiragana: "ちゅう と なか",
        meaning: "giữa; trong; trung",
        translation: "middle; inside; center; during",
    },
    {
        id: 4,
        kanji: "何",
        hiragana: "なに で も なん",
        meaning: "cái gì; bao nhiêu",
        translation: "what; which; how many",
    },
    {
        id: 5,
        kanji: "私",
        hiragana: "わたし あ たし",
        meaning: "tôi; cá nhân; tư nhân",
        translation: "I; me; private; personal",
    },
    {
        id: 6,
        kanji: "で も",
        hiragana: "で も",
        meaning: "nhưng; tuy nhiên; thậm chí",
        translation: "but; however; even; any",
    },
];

const initialDisplayOptions = [
    { label: "Từ vựng", checked: true },
    { label: "Phiên âm", checked: true },
    { label: "Nghĩa", checked: true },
];

function JLPT() {
    const [selectedType, setSelectedType] = useState("Từ vựng");
    const [selectedLevel, setSelectedLevel] = useState("N5");
    const [displaySettings, setDisplaySettings] =
        useState(initialDisplayOptions);

    const handleToggleDisplayOption = (label) => {
        setDisplaySettings((prev) =>
            prev.map((opt) =>
                opt.label === label ? { ...opt, checked: !opt.checked } : opt
            )
        );
    };

    const isShown = (label) =>
        displaySettings.find((o) => o.label === label)?.checked;

    return (
        <div className={cx("wrapper")}>
            <div className={cx("inner")}>
                {/* Header */}
                <div className={cx("header")}>
                    <h1 className={cx("title")}>JLPT</h1>
                </div>

                <div className={cx("features")}>
                    {jlptFeatures.map((feature) => (
                        <Button
                            key={feature.label}
                            to={feature.href}
                            primary
                            leftIcon={<FontAwesomeIcon
                                icon={feature.icon}
                                className={cx("feature-icon")}
                            />}
                        >
                            {feature.label}
                        </Button>
                    ))}
                </div>

                <div className={cx("layout")}>
                    {/* Sidebar */}
                    <aside className={cx("sidebar")}>
                        <Card >
                            {/* Loại từ */}
                            <div className={cx("filter-block")}>
                                <h3 className={cx("filter-title")}>Chọn loại từ</h3>
                                <div className={cx("filter-options")}>
                                    {vocabularyTypes.map((type) => (
                                        <label
                                            key={type}
                                            className={cx("filter-option", {
                                                active: selectedType === type,
                                            })}
                                        >
                                            <input
                                                type="radio"
                                                name="vocab-type"
                                                value={type}
                                                checked={selectedType === type}
                                                onChange={(e) => setSelectedType(e.target.value)}
                                                className={cx("radio")}
                                            />
                                            <span className={cx("filter-label")}>{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Cấp độ */}
                            <div className={cx("filter-block")}>
                                <h3 className={cx("filter-title")}>Chọn cấp độ</h3>
                                <div className={cx("filter-options")}>
                                    {jlptLevels.map((level) => (
                                        <label
                                            key={level}
                                            className={cx("filter-option", {
                                                active: selectedLevel === level,
                                            })}
                                        >
                                            <input
                                                type="radio"
                                                name="level"
                                                value={level}
                                                checked={selectedLevel === level}
                                                onChange={(e) => setSelectedLevel(e.target.value)}
                                                className={cx("radio")}
                                            />
                                            <span className={cx("filter-label")}>{level}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </aside>

                    {/* Content */}
                    <div className={cx("content")}>
                        {/* Display settings + actions */}
                        <Card className={cx("display-card")}>
                            <div className={cx("display-row")}>
                                <div className={cx("display-options")}>
                                    {displaySettings.map((option) => (
                                        <label
                                            key={option.label}
                                            className={cx("display-option")}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={option.checked}
                                                onChange={() =>
                                                    handleToggleDisplayOption(option.label)
                                                }
                                                className={cx("checkbox")}
                                            />
                                            <span className={cx("display-label")}>
                                                {option.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                <div className={cx("display-actions")}>
                                    <Button
                                        outline
                                        className={"no-margin"}
                                        leftIcon={
                                            <FontAwesomeIcon icon={faDownload} />
                                        }
                                    >
                                    </Button>
                                    <Button
                                        outline
                                        className={"no-margin"}
                                        leftIcon={
                                            <FontAwesomeIcon icon={faPlay} />
                                        }
                                    >
                                    </Button>
                                    <Button
                                        outline
                                        className={"no-margin"}
                                        leftIcon={
                                            <FontAwesomeIcon icon={faShuffle} />
                                        }
                                    >
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Vocabulary grid */}
                        <div className={cx("vocab-grid")}>
                            {sampleVocabulary.map((vocab) => (
                                <Card key={vocab.id} >
                                    <div className={cx("vocab-inner")}>
                                        <div className={cx("vocab-header")}>
                                            <div className={cx("vocab-main")}>
                                                <Button
                                                    outline
                                                    className={"no-margin"}
                                                    leftIcon={<FontAwesomeIcon icon={faVolumeHigh} />}
                                                >
                                                </Button>
                                                {isShown("Từ vựng") && (
                                                    <span className={cx("kanji")}>
                                                        {vocab.kanji}
                                                    </span>
                                                )}
                                            </div>

                                            <Button
                                                outline
                                                className={"no-margin"}
                                                leftIcon={<FontAwesomeIcon icon={faPlus} />}
                                            >
                                            </Button>
                                        </div>

                                        {/* Hiragana */}
                                        {isShown("Phiên âm") && (
                                            <div className={cx("hiragana")}>
                                                {vocab.hiragana}
                                            </div>
                                        )}

                                        {/* Meaning + translation */}
                                        {isShown("Nghĩa") && (
                                            <div className={cx("meaning-block")}>
                                                <p className={cx("meaning")}>
                                                    {vocab.meaning}
                                                </p>
                                                <p className={cx("translation")}>
                                                    {vocab.translation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JLPT