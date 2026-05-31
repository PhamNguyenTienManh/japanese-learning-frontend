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

import Pricing from "~/components/Pricing";

const features = [
    {
        icon: faBookOpen,
        iconClass:
            "bg-[linear-gradient(135deg,var(--primary-hover),var(--primary))] shadow-[0_4px_12px_-4px_rgba(0,135,154,0.45)]",
        title: "Từ điển thông minh",
        desc: "Tra cứu từ vựng với nhận diện chữ viết tay, phát âm chuẩn và ví dụ sử dụng.",
    },
    {
        icon: faComments,
        iconClass:
            "bg-[linear-gradient(135deg,#ff8a4c,var(--orange))] shadow-[0_4px_12px_-4px_rgba(252,95,0,0.45)]",
        title: "AI Chat cá nhân",
        desc: "Trò chuyện với AI để luyện hội thoại và hỏi đáp về ngữ pháp.",
    },
    {
        icon: faAward,
        iconClass:
            "bg-[linear-gradient(135deg,#ffd166,#f0b400)] text-[#5b4a16] shadow-[0_4px_12px_-4px_rgba(255,209,102,0.65)]",
        title: "Luyện thi JLPT",
        desc: "Bộ đề JLPT từ N5 → N1 cùng phân tích kết quả chi tiết.",
    },
    {
        icon: faUsers,
        iconClass:
            "bg-[linear-gradient(135deg,var(--primary),var(--primary-hover))] shadow-[0_4px_12px_-4px_rgba(0,135,154,0.5)]",
        title: "Cộng đồng sôi động",
        desc: "Hỏi đáp, chia sẻ kiến thức cùng hàng nghìn người học.",
    },
    {
        icon: faChartLine,
        iconClass:
            "bg-[linear-gradient(135deg,#ff8a4c,var(--orange))] shadow-[0_4px_12px_-4px_rgba(252,95,0,0.45)]",
        title: "Theo dõi tiến độ",
        desc: "Dashboard thống kê học tập, chuỗi học và thành tích cá nhân.",
    },
    {
        icon: faBookmark,
        iconClass:
            "bg-[linear-gradient(135deg,#ffd166,#f0b400)] text-[#5b4a16] shadow-[0_4px_12px_-4px_rgba(255,209,102,0.65)]",
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

const benefitNumStyles = [
    "bg-[#e6f7f2] text-primary",
    "bg-[rgba(252,95,0,0.12)] text-orange",
    "bg-[rgba(255,209,102,0.35)] text-[#8a6e1c]",
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
        <div className="w-full bg-[#f0fbf7] text-[#0f2a2a] relative overflow-hidden">
            <motion.div
                className="absolute rounded-full pointer-events-none z-0 w-[480px] h-[480px] top-[-120px] right-[-160px] bg-[radial-gradient(circle,rgba(168,239,217,0.55),transparent_70%)]"
                animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute rounded-full pointer-events-none z-0 w-[380px] h-[380px] top-[420px] left-[-160px] bg-[radial-gradient(circle,rgba(255,209,102,0.32),transparent_70%)]"
                animate={{ y: [0, 20, 0], x: [0, -14, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute rounded-full pointer-events-none z-0 w-[360px] h-[360px] bottom-[200px] right-[-120px] bg-[radial-gradient(circle,rgba(252,95,0,0.18),transparent_70%)]"
                animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative z-[1] w-full px-8 mx-auto max-w-[1240px]">
                {/* Hero */}
                <motion.section
                    className="pt-20 pb-[60px] text-center"
                    initial="hidden"
                    animate="show"
                    variants={container}
                >
                    <motion.div
                        className="inline-block py-1.5 px-3.5 rounded-full bg-[#e6f7f2] text-primary text-[13px] font-bold mb-[22px]"
                        variants={fadeUp}
                    >
                        Về JAVI
                    </motion.div>
                    <motion.h1
                        className="text-[52px] max-[768px]:text-[36px] font-extrabold leading-[1.15] tracking-[-1.5px] mx-auto max-w-[880px] text-[#0f2a2a]"
                        variants={fadeUp}
                    >
                        Học tiếng Nhật{" "}
                        <span className="bg-[linear-gradient(100deg,var(--primary)_0%,var(--orange)_45%,var(--primary)_90%)] bg-[length:220%_auto] bg-clip-text text-transparent [-webkit-text-fill-color:transparent] animate-shift-gradient">
                            thông minh
                        </span>
                        , học tiếng Nhật{" "}
                        <span className="bg-[linear-gradient(100deg,var(--primary)_0%,var(--orange)_45%,var(--primary)_90%)] bg-[length:220%_auto] bg-clip-text text-transparent [-webkit-text-fill-color:transparent] animate-shift-gradient">
                            vui
                        </span>
                        .
                    </motion.h1>
                    <motion.p
                        className="text-[17px] text-[#5b7575] mt-[22px] mb-[30px] mx-auto max-w-[660px] leading-[1.65]"
                        variants={fadeUp}
                    >
                        Nền tảng học tiếng Nhật toàn diện với AI hỗ trợ, cộng đồng sôi
                        động và phương pháp học hiệu quả — từ N5 đến N1.
                    </motion.p>
                    <motion.div
                        className="flex justify-center gap-3 flex-wrap"
                        variants={fadeUp}
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center py-3.5 px-7 rounded-2xl text-[15px] font-bold cursor-pointer no-underline transition-all duration-150 border-2 border-transparent bg-orange text-white shadow-[0_4px_0_#d44e00] hover:-translate-y-px hover:shadow-[0_5px_0_#d44e00] active:translate-y-0.5 active:shadow-[0_2px_0_#d44e00]"
                        >
                            Bắt đầu học ngay
                        </Link>
                        <a
                            href="#features"
                            className="inline-flex items-center justify-center py-3.5 px-7 rounded-2xl text-[15px] font-bold cursor-pointer no-underline transition-all duration-150 border-2 bg-white text-[#0f2a2a] border-[#dff1ea] shadow-[0_2px_0_rgba(15,42,42,0.04)] hover:-translate-y-px hover:border-primary-low hover:text-primary"
                        >
                            Tìm hiểu thêm
                        </a>
                    </motion.div>
                </motion.section>

                {/* Features */}
                <section id="features" className="py-14">
                    <motion.div
                        className="text-center mb-11"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.4 }}
                        variants={container}
                    >
                        <motion.div
                            className="inline-block text-xs font-extrabold tracking-[1.6px] uppercase text-primary mb-3"
                            variants={fadeUp}
                        >
                            Tính năng
                        </motion.div>
                        <motion.h2
                            className="text-[36px] max-[768px]:text-[28px] font-extrabold tracking-[-0.8px] mx-auto max-w-[720px] leading-[1.2] text-[#0f2a2a]"
                            variants={fadeUp}
                        >
                            Mọi thứ bạn cần để chinh phục tiếng Nhật
                        </motion.h2>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-3 max-[992px]:grid-cols-2 max-[600px]:grid-cols-1 gap-[18px]"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.15 }}
                        variants={container}
                    >
                        {features.map((f) => (
                            <motion.div
                                key={f.title}
                                className="relative overflow-hidden bg-white border-2 border-[#dff1ea] rounded-[20px] p-6 transition-[border-color,box-shadow] duration-[250ms] shadow-[0_4px_0_rgba(15,42,42,0.04)] hover:shadow-[0_14px_30px_-18px_rgba(0,135,154,0.45)] hover:border-transparent before:content-[''] before:absolute before:inset-0 before:rounded-[inherit] before:p-[2px] before:bg-[linear-gradient(135deg,var(--primary),var(--orange))] before:[-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:opacity-0 before:transition-opacity before:duration-[250ms] before:pointer-events-none hover:before:opacity-100"
                                variants={cardItem}
                                whileHover={{ y: -6 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <motion.div
                                    className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-[18px] text-[22px] text-white shrink-0 ${f.iconClass}`}
                                    whileHover={{ rotate: -8, scale: 1.08 }}
                                    transition={{ type: "spring", stiffness: 320, damping: 14 }}
                                >
                                    <FontAwesomeIcon icon={f.icon} />
                                </motion.div>
                                <h3 className="mb-2 text-lg font-extrabold tracking-[-0.2px] text-[#0f2a2a]">
                                    {f.title}
                                </h3>
                                <p className="text-[#5b7575] text-sm leading-[1.55]">
                                    {f.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* Benefits */}
                <section className="py-14">
                    <motion.div
                        className="text-center mb-11"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.4 }}
                        variants={container}
                    >
                        <motion.div
                            className="inline-block text-xs font-extrabold tracking-[1.6px] uppercase text-primary mb-3"
                            variants={fadeUp}
                        >
                            Vì sao chọn chúng tôi
                        </motion.div>
                        <motion.h2
                            className="text-[36px] max-[768px]:text-[28px] font-extrabold tracking-[-0.8px] mx-auto max-w-[720px] leading-[1.2] text-[#0f2a2a]"
                            variants={fadeUp}
                        >
                            Học cùng nền tảng thực sự hiểu người học
                        </motion.h2>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-2 max-[768px]:grid-cols-1 gap-4"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.15 }}
                        variants={container}
                    >
                        {benefits.map((item, i) => (
                            <motion.div
                                key={item.title}
                                className="flex gap-4 items-start bg-white border-2 border-[#dff1ea] rounded-[18px] py-5 px-[22px] transition-all duration-150 hover:border-primary-low hover:-translate-y-px"
                                variants={benefitItem}
                                whileHover={{ y: -2, x: 2 }}
                                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                            >
                                <div
                                    className={`w-9 h-9 rounded-xl inline-flex items-center justify-center font-extrabold text-sm shrink-0 ${benefitNumStyles[i % 3]}`}
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-[#0f2a2a] mb-1">
                                        {item.title}
                                    </h3>
                                    <p className="text-[13px] text-[#5b7575] leading-[1.5]">
                                        {item.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                <Pricing />

                {/* CTA */}
                <section className="py-20">
                    <motion.div
                        className="relative overflow-hidden bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-hover)_100%)] rounded-[28px] py-14 px-10 text-center text-white before:content-[''] before:absolute before:rounded-full before:pointer-events-none before:w-[280px] before:h-[280px] before:top-[-100px] before:right-[-80px] before:bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_70%)] after:content-[''] after:absolute after:rounded-full after:pointer-events-none after:w-[220px] after:h-[220px] after:bottom-[-80px] after:left-[-60px] after:bg-[radial-gradient(circle,rgba(255,209,102,0.28),transparent_70%)]"
                        initial={{ opacity: 0, y: 40, scale: 0.96 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.7, ease: easeOut }}
                    >
                        <motion.h2
                            className="relative text-[36px] max-[768px]:text-[26px] font-extrabold tracking-[-0.6px] mb-3 leading-[1.2]"
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
                        >
                            Sẵn sàng bắt đầu chưa?
                        </motion.h2>
                        <motion.p
                            className="relative text-base text-white/[0.88] mx-auto mb-7 max-w-[560px] leading-[1.6]"
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
                            <Link
                                to="/signup"
                                className="relative inline-flex items-center justify-center py-3.5 px-8 rounded-2xl text-[15px] font-bold bg-orange text-white no-underline shadow-[0_4px_0_#d44e00] transition-all duration-150 cursor-pointer overflow-hidden isolate hover:-translate-y-px hover:shadow-[0_5px_0_#d44e00] active:translate-y-0.5 active:shadow-[0_2px_0_#d44e00] after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(120deg,transparent_0%,transparent_35%,rgba(255,255,255,0.45)_50%,transparent_65%,transparent_100%)] after:translate-x-[-120%] after:transition-transform after:duration-700 after:pointer-events-none after:z-[1] hover:after:translate-x-[120%]"
                            >
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
