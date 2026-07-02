import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import postService from "~/services/postService";
import { getAvatarUrl, getInitials, getAvatarGradient } from "~/utils/avatar";

function CommunitySidebar() {
  const [activeMembers, setActiveMembers] = useState([]);

  useEffect(() => {
    postService
      .getActiveMembers(5)
      .then((data) => setActiveMembers(data || []))
      .catch(() => {});
  }, []);

  const getGradient = (name) => getAvatarGradient(name);

  const getInitialsFn = (name) => getInitials(name);

  const gradientColors = [
    "linear-gradient(135deg, #00879a, #1f9bac)",
    "linear-gradient(135deg, #fc5f00, #ff9800)",
    "linear-gradient(135deg, #7c3aed, #a78bfa)",
    "linear-gradient(135deg, #059669, #34d399)",
    "linear-gradient(135deg, #dc2626, #f87171)",
  ];

  return (
    <aside className="w-72 lg:w-80 flex-shrink-0 hidden md:flex flex-col gap-6 sticky">
      <Link
        to="/community/new"
        className="bg-white text-on-surface hover:bg-surface-container-high font-semibold text-base px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm no-underline"
        style={{ border: "2px solid rgba(0, 0, 0, 0.3)" }}
      >
        <span className="material-symbols-outlined">edit_square</span>
        Tạo bài viết
      </Link>

      <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30">
        <h3 className="text-sm font-semibold text-on-surface font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">groups</span>
          Thành viên tích cực
        </h3>
        <div className="flex flex-col gap-3">
          {activeMembers.length > 0 ? (
            activeMembers.map((member, idx) => (
              <div key={member._id} className="flex items-center gap-3">
                {member.image_url ? (
                  <img
                    src={getAvatarUrl(member.image_url)}
                    alt={member.name}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-outline-variant/20"
                  />
                ) : (
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                    style={{ background: getGradient(member.name) }}
                  >
                    {getInitialsFn(member.name)}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-on-surface truncate">{member.name}</p>
                  <p className="text-[11px] text-on-surface-variant">{member.postCount} bài viết</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-on-surface-variant">Chưa có thành viên nào</p>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30">
        <h3 className="text-sm font-semibold text-on-surface font-bold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant">gavel</span>
          Quy tắc cộng đồng
        </h3>
        <ul className="text-sm text-on-surface-variant space-y-2.5 list-none m-0 p-0">
          <li className="flex gap-2 items-start">
            <span className="text-primary mt-0.5">•</span>
            Tôn trọng mọi thành viên
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-primary mt-0.5">•</span>
            Không spam hoặc quảng cáo sai mục đích
          </li>
          <li className="flex gap-2 items-start">
            <span className="text-primary mt-0.5">•</span>
            Đăng bài đúng chuyên mục
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default CommunitySidebar;
