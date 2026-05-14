import classNames from "classnames/bind";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

import styles from "./AuthShell.module.scss";

const cx = classNames.bind(styles);

const DEFAULT_FEATURES = [
    { icon: "🎴", label: "Hơn 10,000 từ vựng & ngữ pháp JLPT" },
    { icon: "🤖", label: "AI luyện hội thoại tiếng Nhật mỗi ngày" },
    { icon: "🔥", label: "Theo dõi chuỗi học và tiến độ cá nhân" },
];

function AuthShell({
    title,
    subtitle,
    backTo = "/",
    backLabel = "Quay lại trang chủ",
    brandTitle = "Học tiếng Nhật cùng cộng đồng yêu Nihongo.",
    brandSub = "Flashcard, ngữ pháp, hán tự và AI luyện nói — tất cả ở một nơi.",
    features = DEFAULT_FEATURES,
    children,
}) {
    return (
        <div className={cx("wrapper")}>
            {/* Left brand panel */}
            <aside className={cx("brand")}>
                <div className={cx("blobA")} />
                <div className={cx("blobB")} />

                <div className={cx("brandTop")}>
                    <span className={cx("brandLogo")}>
                        日本語<span className={cx("brandLogoAccent")}>Learn</span>
                    </span>
                </div>

                <div className={cx("brandMain")}>
                    <div className={cx("brandHero")}>
                        日本語<span className={cx("brandHeroAccent")}>。</span>
                    </div>
                    <h2 className={cx("brandTitle")}>{brandTitle}</h2>
                    <p className={cx("brandSub")}>{brandSub}</p>
                </div>

                <div className={cx("brandFeatures")}>
                    {features.map((f) => (
                        <div key={f.label} className={cx("brandFeature")}>
                            <span className={cx("brandFeatureIcon")}>{f.icon}</span>
                            <span>{f.label}</span>
                        </div>
                    ))}
                </div>

                <div className={cx("brandFooter")}>
                    © {new Date().getFullYear()} 日本語Learn
                </div>
            </aside>

            {/* Right form panel */}
            <main className={cx("formPanel")}>
                <div className={cx("formInner")}>
                    <Link to={backTo} className={cx("backLink")}>
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>{backLabel}</span>
                    </Link>

                    <div className={cx("header")}>
                        <h1 className={cx("title")}>{title}</h1>
                        {subtitle && <p className={cx("subtitle")}>{subtitle}</p>}
                    </div>

                    {children}
                </div>
            </main>
        </div>
    );
}

export default AuthShell;
