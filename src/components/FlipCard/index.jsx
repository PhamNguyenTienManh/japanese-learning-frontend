const cn = (...classes) => classes.filter(Boolean).join(" ");

/**
 * FlipCard — component thuần trình bày, đóng gói cơ chế lật thẻ 3D.
 *
 * Chỉ lo phần hiệu ứng lật (perspective / preserve-3d / backface) vốn hay bị
 * lặp lại và dễ sai. Nội dung và style từng mặt do nơi dùng truyền vào qua
 * `front` / `back` và các class tương ứng.
 *
 * @param {boolean} flipped   Đang lật sang mặt sau hay không (controlled).
 * @param {Function} onFlip   Gọi khi bấm vào thẻ để lật.
 * @param {React.ReactNode} front  Nội dung mặt trước.
 * @param {React.ReactNode} back   Nội dung mặt sau.
 * @param {string} className        Class cho khung ngoài (kích thước, khoảng cách...).
 * @param {string} faceClassName    Class dùng chung cho cả hai mặt.
 * @param {string} frontClassName   Class riêng mặt trước.
 * @param {string} backClassName    Class riêng mặt sau.
 * @param {number} duration         Thời lượng lật (ms). Mặc định 500.
 */
export default function FlipCard({
  flipped = false,
  onFlip,
  front,
  back,
  className = "",
  faceClassName = "",
  frontClassName = "",
  backClassName = "",
  duration = 500,
}) {
  return (
    <div
      className={cn("[perspective:1000px] cursor-pointer", className)}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip?.();
        }
      }}
    >
      <div
        className={cn(
          "relative w-full h-full [transform-style:preserve-3d] transition-transform ease-in-out",
          flipped && "[transform:rotateY(180deg)]"
        )}
        style={{ transitionDuration: `${duration}ms` }}
      >
        {/* Mặt trước */}
        <div
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]",
            faceClassName,
            frontClassName
          )}
        >
          {front}
        </div>

        {/* Mặt sau */}
        <div
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)]",
            faceClassName,
            backClassName
          )}
        >
          {back}
        </div>
      </div>
    </div>
  );
}
