import classNames from "classnames/bind";
import styles from "./NewPostGuidelines.module.scss";
import Card from "~/components/Card";

const cx = classNames.bind(styles);

const GUIDELINES = [
  "Viết tiêu đề rõ ràng, súc tích",
  "Chia sẻ nội dung hữu ích và chính xác",
  "Sử dụng ngôn ngữ lịch sự, tôn trọng",
  "Thêm ảnh minh họa nếu cần thiết",
  "Không spam hoặc quảng cáo",
];

function NewPostGuidelines() {
  return (
    <Card className={cx("guide-card")}>
      <h3 className={cx("guide-title")}>Hướng dẫn viết bài</h3>
      <ul className={cx("guide-list")}>
        {GUIDELINES.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </Card>
  );
}

export default NewPostGuidelines;
