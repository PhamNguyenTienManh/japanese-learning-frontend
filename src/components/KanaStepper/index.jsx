import { Link } from "react-router-dom";

const STEPS = [
  { key: "alphabet", label: "Bảng chữ cái", to: "/kana" },
  { key: "combinations", label: "Cách ghép âm", to: "/kana/combinations" },
  { key: "basics", label: "Câu cơ bản", to: "/kana/basics" },
  { key: "radicals", label: "Bộ thủ", to: "/kana/radicals" },
];

function KanaStepper({ active }) {
  const activeIndex = STEPS.findIndex((s) => s.key === active);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[13px]">
      {STEPS.map((step, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        const isFuture = index > activeIndex;

        const circleCls = [
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          isActive
            ? "bg-primary text-white"
            : isDone
              ? "bg-orange text-white"
              : "bg-[#e1ecee] text-grey",
        ].join(" ");

        const labelCls = [
          "font-medium",
          isActive
            ? "text-text-high"
            : isDone
              ? "text-orange"
              : "text-grey",
        ].join(" ");

        const content = (
          <span className="flex items-center gap-1.5">
            <span className={circleCls}>{isDone ? "✓" : index + 1}</span>
            <span className={labelCls}>{step.label}</span>
          </span>
        );

        return (
          <div key={step.key} className="flex items-center gap-1.5">
            {isFuture ? (
              <span className="opacity-70">{content}</span>
            ) : (
              <Link to={step.to} className="no-underline hover:opacity-80">
                {content}
              </Link>
            )}
            {index < STEPS.length - 1 && (
              <span className="text-xs text-grey">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default KanaStepper;
