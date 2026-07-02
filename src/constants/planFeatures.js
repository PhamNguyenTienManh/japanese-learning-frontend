import {
  faBookOpen,
  faGraduationCap,
  faComments,
  faCheck,
  faRobot,
  faChartLine,
  faHeadset,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";

// ── Tính năng gói Miễn phí ────────────────────────────────────

export const FREE_FEATURES = [
  { icon: faBookOpen, label: "Từ điển cơ bản" },
  { icon: faGraduationCap, label: "Đề thi JLPT N5-N4" },
  { icon: faComments, label: "Cộng đồng" },
  { icon: faBookmark, label: "Sổ tay từ vựng" },
];

// ── Tính năng gói Pro ─────────────────────────────────────────

export const PRO_FEATURES = [
  { icon: faCheck, label: "Tất cả tính năng Miễn phí" },
  { icon: faRobot, label: "50 lượt chat với AI JAVI mỗi ngày" },
  { icon: faGraduationCap, label: "Đề thi JLPT N5-N1" },
  { icon: faChartLine, label: "Phân tích chi tiết" },
  { icon: faComments, label: "Luyện hội thoại" },
  { icon: faHeadset, label: "Luyện phát âm" },
];

// ── Thông tin gói cước (dùng ở Pricing) ───────────────────────

export const PLANS = [
  {
    name: "Miễn phí",
    price: "0 ₫/tháng",
    desc: "Hoàn hảo để bắt đầu",
    features: FREE_FEATURES,
  },
  {
    name: "Pro",
    price: "249.000 ₫/tháng",
    desc: "Quyền truy cập vào các chức năng nâng cao",
    features: PRO_FEATURES,
    highlight: true,
  },
];

// ── Giá ───────────────────────────────────────────────────────

export const MONTHLY_PRICE = 249000;
export const YEARLY_PRICE = 2390000; // ~20% off
