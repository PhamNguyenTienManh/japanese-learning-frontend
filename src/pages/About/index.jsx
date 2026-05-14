import classNames from "classnames/bind";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faComments,
    faUsers,
    faAward,
    faChartLine,
    faBookmark,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./About.module.scss";
import Pricing from "~/components/Pricing";

const cx = classNames.bind(styles);

const features = [
    {
        icon: faBookOpen,
        iconClass: "iconTeal",
        title: "Từ điển thông minh",
        desc: "Tra cứu từ vựng với nhận diện chữ viết tay, phát âm chuẩn và ví dụ sử dụng.",
    },
    {
        icon: faComments,
        iconClass: "iconOrange",
        title: "AI Chat cá nhân",
        desc: "Trò chuyện với AI để luyện hội thoại và hỏi đáp về ngữ pháp.",
    },
    {
        icon: faAward,
        iconClass: "iconYellow",
        title: "Luyện thi JLPT",
        desc: "Bộ đề JLPT từ N5 → N1 cùng phân tích kết quả chi tiết.",
    },
    {
        icon: faUsers,
        iconClass: "iconMint",
        title: "Cộng đồng sôi động",
        desc: "Hỏi đáp, chia sẻ kiến thức cùng hàng nghìn người học.",
    },
    {
        icon: faChartLine,
        iconClass: "iconOrange",
        title: "Theo dõi tiến độ",
        desc: "Dashboard thống kê học tập, chuỗi học và thành tích cá nhân.",
    },
    {
        icon: faBookmark,
        iconClass: "iconYellow",
        title: "Sổ tay từ vựng",
        desc: "Lưu từ yêu thích và luyện flashcard theo phương pháp lặp lại.",
    },
];

const benefits = [
    {
        title: "Phương pháp học hiệu quả",
        desc: "Kết hợp lý thuyết, thực hành và ứng dụng thực tế.",
    },
    {
        title: "Cộng đồng hỗ trợ",
        desc: "Được giúp đỡ bởi những người học cùng mục tiêu.",
    },
    {
        title: "AI hỗ trợ cá nhân",
        desc: "Nhận lời khuyên và hỗ trợ được cá nhân hoá.",
    },
    {
        title: "Tiến độ có thể đo lường",
        desc: "Theo dõi sự tiến bộ qua các thước đo rõ ràng.",
    },
    {
        title: "Nội dung cập nhật liên tục",
        desc: "Thêm mới đề thi, từ vựng và tính năng thường xuyên.",
    },
    {
        title: "Hoàn toàn miễn phí",
        desc: "Truy cập tất cả tính năng chính mà không tốn phí.",
    },
];

function About() {
    return (
        <div className={cx("wrapper")}>
            <div className={cx("blob1")} />
            <div className={cx("blob2")} />
            <div className={cx("blob3")} />

            <div className={cx("container")}>
                {/* Hero */}
                <section className={cx("hero")}>
                    <div className={cx("heroBadge")}>Về 日本語Learn</div>
                    <h1 className={cx("heroTitle")}>
                        Học tiếng Nhật{" "}
                        <span className={cx("titleAccent")}>thông minh</span>, học
                        tiếng Nhật{" "}
                        <span className={cx("titleAccent")}>vui</span>.
                    </h1>
                    <p className={cx("heroDesc")}>
                        Nền tảng học tiếng Nhật toàn diện với AI hỗ trợ, cộng đồng sôi
                        động và phương pháp học hiệu quả — từ N5 đến N1.
                    </p>
                    <div className={cx("heroActions")}>
                        <Link to="/" className={cx("btnPrimary")}>
                            Bắt đầu học ngay
                        </Link>
                        <a href="#features" className={cx("btnOutline")}>
                            Tìm hiểu thêm
                        </a>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className={cx("features")}>
                    <div className={cx("sectionHead")}>
                        <div className={cx("sectionLabel")}>Tính năng</div>
                        <h2 className={cx("sectionTitle")}>
                            Mọi thứ bạn cần để chinh phục tiếng Nhật
                        </h2>
                    </div>

                    <div className={cx("grid")}>
                        {features.map((f) => (
                            <div key={f.title} className={cx("card")}>
                                <div className={cx("iconBox", f.iconClass)}>
                                    <FontAwesomeIcon icon={f.icon} />
                                </div>
                                <h3 className={cx("cardTitle")}>{f.title}</h3>
                                <p className={cx("cardDesc")}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Benefits */}
                <section className={cx("benefits")}>
                    <div className={cx("sectionHead")}>
                        <div className={cx("sectionLabel")}>Vì sao chọn chúng tôi</div>
                        <h2 className={cx("sectionTitle")}>
                            Học cùng nền tảng thực sự hiểu người học
                        </h2>
                    </div>

                    <div className={cx("benefitGrid")}>
                        {benefits.map((item, i) => (
                            <div key={item.title} className={cx("benefitItem")}>
                                <div className={cx("benefitNum")}>
                                    {String(i + 1).padStart(2, "0")}
                                </div>
                                <div>
                                    <h3 className={cx("benefitTitle")}>{item.title}</h3>
                                    <p className={cx("benefitDesc")}>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <Pricing />

                {/* CTA */}
                <section className={cx("cta")}>
                    <div className={cx("ctaInner")}>
                        <h2 className={cx("ctaTitle")}>Sẵn sàng bắt đầu chưa?</h2>
                        <p className={cx("ctaDesc")}>
                            Tham gia ngay hôm nay và bắt đầu hành trình học tiếng Nhật
                            của bạn.
                        </p>
                        <Link to="/signup" className={cx("ctaBtn")}>
                            Tạo tài khoản miễn phí
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default About;
