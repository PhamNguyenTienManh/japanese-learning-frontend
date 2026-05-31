import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faComments,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";

function CommunityHeader() {
  return (
    <section className="relative isolate mb-6 overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#00879a_0%,#1f9bac_55%,#2bb6c4_100%)] px-8 py-9 text-white shadow-[0_18px_40px_rgba(0,135,154,0.25)] max-[640px]:rounded-[20px] max-[640px]:px-[22px] max-[640px]:py-7">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <span className="absolute -top-[30px] right-[60px] select-none font-['Noto_Serif_JP',serif] text-[220px] font-black leading-none text-white/10 max-[640px]:right-[-20px] max-[640px]:text-[160px]">
          友
        </span>
        <span className="absolute -bottom-10 right-60 select-none font-['Noto_Serif_JP',serif] text-[160px] font-black leading-none text-white/10 max-[640px]:hidden">
          学
        </span>
        <span className="absolute -right-[60px] -top-[100px] h-[280px] w-[280px] rounded-full bg-[rgba(252,95,0,0.35)] opacity-55 blur-[40px]" />
        <span className="absolute -bottom-[120px] left-[30%] h-[220px] w-[220px] rounded-full bg-[rgba(193,228,232,0.5)] opacity-55 blur-[40px]" />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-[640px]">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1.5 text-[13px] font-semibold text-white backdrop-blur-[6px]">
            <FontAwesomeIcon icon={faComments} />
            みんなのコミュニティ
          </span>
          <h1 className="m-0 mb-3 text-[40px] font-extrabold leading-[1.15] text-white max-[640px]:text-[30px]">
            Cộng đồng{" "}
            <span className="inline-block bg-[linear-gradient(90deg,#ffd56b_0%,#fc5f00_100%)] bg-clip-text text-transparent">
              học tiếng Nhật
            </span>
          </h1>
          <p className="m-0 mb-6 max-w-[560px] text-base leading-[1.6] text-white/90">
            Nơi bạn chia sẻ kinh nghiệm, đặt câu hỏi và cùng nhau tiến bộ mỗi ngày.
          </p>

          <div className="flex flex-wrap items-center gap-[18px]">
            <Button
              primary
              href="/community/new"
              className="!rounded-xl !bg-white !px-[22px] !py-3.5 !font-bold !text-primary shadow-[0_6px_18px_rgba(0,0,0,0.12)] transition hover:!-translate-y-px hover:!bg-[#fff8e1] hover:shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
              leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
            >
              Tạo bài viết
            </Button>
            <a
              className="inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold text-white transition-all hover:gap-3 hover:bg-white/15 hover:text-white"
              href="#feed"
            >
              Khám phá ngay <FontAwesomeIcon icon={faArrowRight} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CommunityHeader;
