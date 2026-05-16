import classNames from "classnames/bind";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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

const easeOut = [0.22, 1, 0.36, 1];

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

const container = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
};

const cardItem = {
    hidden: { opacity: 0, y: 32, scale: 0.97 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.55, ease: easeOut },
    },
};

const benefitItem = {
    hidden: { opacity: 0, x: -24 },
    show: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: easeOut },
    },
};

function About() {
    return (
        <div className={cx("wrapper")}>
            <motion.div
                className={cx("blob1")}
                animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className={cx("blob2")}
                animate={{ y: [0, 20, 0], x: [0, -14, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className={cx("blob3")}
                animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className={cx("container")}>
                {/* Hero */}
                <motion.section
                    className={cx("hero")}
                    initial="hidden"
                    animate="show"
                    variants={container}
                >
                    <motion.div className={cx("heroBadge")} variants={fadeUp}>
                        Về JAVI
                    </motion.div>
                    <motion.h1 className={cx("heroTitle")} variants={fadeUp}>
                        Học tiếng Nhật{" "}
                        <span className={cx("titleAccent")}>thông minh</span>, học
                        tiếng Nhật{" "}
                        <span className={cx("titleAccent")}>vui</span>.
                    </motion.h1>
                    <motion.p className={cx("heroDesc")} variants={fadeUp}>
                        Nền tảng học tiếng Nhật toàn diện với AI hỗ trợ, cộng đồng sôi
                        động và phương pháp học hiệu quả — từ N5 đến N1.
                    </motion.p>
                    <motion.div className={cx("heroActions")} variants={fadeUp}>
                        <Link to="/" className={cx("btnPrimary")}>
                            Bắt đầu học ngay
                        </Link>
                        <a href="#features" className={cx("btnOutline")}>
                            Tìm hiểu thêm
                        </a>
                    </motion.div>
                </motion.section>

                {/* Features */}
                <section id="features" className={cx("features")}>
                    <motion.div
                        className={cx("sectionHead")}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.4 }}
                        variants={container}
                    >
                        <motion.div className={cx("sectionLabel")} variants={fadeUp}>
                            Tính năng
                        </motion.div>
                        <motion.h2 className={cx("sectionTitle")} variants={fadeUp}>
                            Mọi thứ bạn cần để chinh phục tiếng Nhật
                        </motion.h2>
                    </motion.div>

                    <motion.div
                        className={cx("grid")}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.15 }}
                        variants={container}
                    >
                        {features.map((f) => (
                            <motion.div
                                key={f.title}
                                className={cx("card")}
                                variants={cardItem}
                                whileHover={{ y: -6 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <motion.div
                                    className={cx("iconBox", f.iconClass)}
                                    whileHover={{ rotate: -8, scale: 1.08 }}
                                    transition={{ type: "spring", stiffness: 320, damping: 14 }}
                                >
                                    <FontAwesomeIcon icon={f.icon} />
                                </motion.div>
                                <h3 className={cx("cardTitle")}>{f.title}</h3>
                                <p className={cx("cardDesc")}>{f.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* Benefits */}
                <section className={cx("benefits")}>
                    <motion.div
                        className={cx("sectionHead")}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.4 }}
                        variants={container}
                    >
                        <motion.div className={cx("sectionLabel")} variants={fadeUp}>
                            Vì sao chọn chúng tôi
                        </motion.div>
                        <motion.h2 className={cx("sectionTitle")} variants={fadeUp}>
                            Học cùng nền tảng thực sự hiểu người học
                        </motion.h2>
                    </motion.div>

                    <motion.div
                        className={cx("benefitGrid")}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.15 }}
                        variants={container}
                    >
                        {benefits.map((item, i) => (
                            <motion.div
                                key={item.title}
                                className={cx("benefitItem")}
                                variants={benefitItem}
                                whileHover={{ y: -2, x: 2 }}
                                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                            >
                                <div className={cx("benefitNum")}>
                                    {String(i + 1).padStart(2, "0")}
                                </div>
                                <div>
                                    <h3 className={cx("benefitTitle")}>{item.title}</h3>
                                    <p className={cx("benefitDesc")}>{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                <Pricing />

                {/* CTA */}
                <section className={cx("cta")}>
                    <motion.div
                        className={cx("ctaInner")}
                        initial={{ opacity: 0, y: 40, scale: 0.96 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.7, ease: easeOut }}
                    >
                        <motion.h2
                            className={cx("ctaTitle")}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
                        >
                            Sẵn sàng bắt đầu chưa?
                        </motion.h2>
                        <motion.p
                            className={cx("ctaDesc")}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{ duration: 0.5, delay: 0.25, ease: easeOut }}
                        >
                            Tham gia ngay hôm nay và bắt đầu hành trình học tiếng Nhật
                            của bạn.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{ duration: 0.5, delay: 0.35, ease: easeOut }}
                        >
                            <Link to="/signup" className={cx("ctaBtn")}>
                                Tạo tài khoản miễn phí
                            </Link>
                        </motion.div>
                    </motion.div>
                </section>
            </div>
        </div>
    );
}

export default About;
