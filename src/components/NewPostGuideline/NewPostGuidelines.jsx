import classNames from "classnames/bind";
import styles from "./NewPostGuidelines.module.scss";

const cx = classNames.bind(styles);

const GUIDELINES = [
  "Viết tiêu đề rõ ràng, súc tích để thu hút người đọc",
  "Chia sẻ nội dung hữu ích, chính xác — kèm ví dụ nếu có thể",
  "Sử dụng ngôn ngữ lịch sự, tôn trọng cộng đồng",
  "Thêm ảnh minh hoạ nếu giúp người đọc hiểu nhanh hơn",
  "Tránh nội dung spam, quảng cáo hoặc trùng lặp",
];

function NewPostGuidelines() {
  return (
    <section className={cx("guide-card")}>
      <h3 className={cx("guide-title")}>Mẹo viết bài hay</h3>
      <ul className={cx("guide-list")}>
        {GUIDELINES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default NewPostGuidelines;
