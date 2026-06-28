import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

const radicals214Data = "一|nhất|1|số 1,丨|cổn|1|nét sổ,丶|chủ|1|điểm chấm,丿|phiệt|1|nét phẩy,乙|ất|1|vị trí thứ 2 trong thiên can,亅|quyết|1|nét sổ có móc,二|nhị|2|số 2,亠|đầu|2|không có nghĩa,人 (亻)|nhân|2|người,儿|nhi|2|trẻ con,入|nhập|2|vào,八|bát|2|số 8,冂|quynh|2|vùng biên giới xa,冖|mịch|2|trùm khăn lên,冫|băng|2|nước đá,几|kỷ|2|ghế dựa,凵|khảm|2|há miệng chờ hứng,刀 (刂)|đao|2|con dao,力|lực|2|sức mạnh,勹|bao|2|bao bọc,匕|chủy|2|cái thìa,匚|phương|2|tủ đựng,匸|hệ|2|che đậy,十|thập|2|số 10,卜|bốc|2|xem bói,卩|tiết|2|đốt tre,厂|hán|2|sườn núi,厶|khư|2|riêng tư,又|hựu|2|lại nữa,口|khẩu|3|cái miệng,囗|vi|3|vây quanh,土|thổ|3|đất,士|sĩ|3|kẻ sĩ,夂|truy|3|đi sau,夊|truy|3|đi chậm,夕|tịch|3|đêm tối,大|đại|3|to lớn,女|nữ|3|nữ giới,子|tử|3|con,宀|miên|3|mái nhà,寸|thốn|3|đơn vị đo,小|tiểu|3|nhỏ bé,尢|uông|3|yếu đuối,尸|thi|3|thây ma,屮|triệt|3|mầm non,山|sơn|3|núi,巛 (川)|xuyên|3|sông,工|công|3|công việc,己|kỷ|3|bản thân,巾|cân|3|cái khăn,干|can|3|thiên can,幺|yêu|3|nhỏ nhắn,广|nghiễm|3|mái nhà,廴|dẫn|3|bước dài,廾|củng|3|chắp tay,弋|dặc|3|bắn tên,弓|cung|3|cây cung,彐 (彑)|ký|3|đầu con nhím,彡|sam|3|lông tóc,彳|xích|3|bước ngắn,心 (忄)|tâm|4|trái tim,戈|qua|4|cây qua,戶|hộ|4|cửa một cánh,手 (扌)|thủ|4|cái tay,支|chi|4|cành nhánh,攴 (攵)|phộc|4|đánh khẽ,文|văn|4|văn vẻ,斗|đẩu|4|cái đấu đo lường,斤|cân|4|cái búa,方|phương|4|vuông góc,无|vô|4|không có,日|nhật|4|mặt trời,曰|viết|4|nói rằng,月|nguyệt|4|mặt trăng,木|mộc|4|cây cối,欠|khiếm|4|thiếu thốn,止|chỉ|4|dừng lại,歹|đãi|4|xấu xa,殳|thù|4|binh khí dài,毋 (母)|vô (mẫu)|4|chớ/mẹ,比|tỷ|4|so sánh,毛|mao|4|lông,氏|thị|4|họ,气|khí|4|hơi nước,水 (氵)|thủy|4|nước,火 (灬)|hỏa|4|lửa,爪 (爫)|trảo|4|móng vuốt,父|phụ|4|cha,爻|hào|4|hào âm dương,爿|tường|4|mảnh gỗ,片|phiến|4|mảnh,牙|nha|4|răng nanh,牛 (牜)|ngưu|4|con bò,犬 (犭)|khuyển|4|con chó,玄|huyền|5|màu đen sẫm,玉 (王)|ngọc|5|đá quý,瓜|qua|5|quả dưa,瓦|ngõa|5|ngói đất,甘|cam|5|ngọt,生|sinh|5|sinh đẻ,用|dụng|5|sử dụng,田|điền|5|ruộng,疋|thất|5|đơn vị đo (tấm vải),疒|nạch|5|bệnh tật,癶|bát|5|gạt ra,白|bạch|5|màu trắng,皮|bì|5|da,皿|mãnh|5|bát đĩa,目|mục|5|con mắt,矛|mâu|5|cây mâu,矢|thỉ|5|mũi tên,石|thạch|5|hòn đá,示 (礻)|thị|5|chỉ thị,禸|nhựu|5|vết chân thú,禾|hòa|5|cây lúa,穴|huyệt|5|cái hang,立|lập|5|đứng,竹|trúc|6|cây tre,米|mễ|6|gạo,糸 (纟)|mịch|6|sợi tơ,缶|phẫu|6|đồ sành,网 (罒)|võng|6|cái lưới,羊|dương|6|con dê,羽|vũ|6|lông chim,老|lão|6|người già,而|nhi|6|mà,耒|lỗi|6|cái cày,耳|nhĩ|6|cái tai,聿|duật|6|cây bút,肉 (月)|nhục|6|thịt,臣|thần|6|bầy tôi,自|tự|6|tự bản thân,至|chí|6|đến nơi,臼|cữu|6|cái cối giã,舌|thiệt|6|cái lưỡi,舛|suyễn|6|sai trái,舟|chu|6|cái thuyền,艮|cấn|6|dừng lại,色|sắc|6|màu sắc,艸 (艹)|thảo|6|cỏ,虍|hô|6|vằn hổ,虫|trùng|6|côn trùng,血|huyết|6|máu,行|hành|6|đi lại,衣 (衤)|y|6|cái áo,襾|á|6|che đậy,見|kiến|7|nhìn thấy,角|giác|7|cái sừng,言 (讠)|ngôn|7|lời nói,谷|cốc|7|thung lũng,豆|đậu|7|hạt đậu,豕|thỉ|7|con lợn,豸|trãi|7|loài bò sát,貝|bối|7|vỏ sò/tiền,赤|xích|7|màu đỏ,走|tẩu|7|chạy,足 (⻊)|túc|7|cái chân,身|thân|7|thân thể,車|xa|7|cái xe,辛|tân|7|cay đắng,辰|thần|7|thìn (ngôi sao),辵 (辶)|sước|7|chợt đi chợt dừng,邑 (阝)|ấp|7|vùng đất,酉|dậu|7|rượu,釆|biện|7|phân biệt,里|lý|7|dặm,金 (钅)|kim|8|kim loại,長|trường|8|dài/lớn,門|môn|8|cái cửa,阜 (阝)|phụ|8|đống đất,隶|đãi|8|kịp đến,隹|chuy|8|chim đuôi ngắn,雨|vũ|8|mưa,青|thanh|8|màu xanh,非|phi|8|không phải,面|diện|9|khuôn mặt,革|cách|9|da thú,韋|vi|9|da thuộc,韭|cửu|9|rau hẹ,音|âm|9|âm thanh,頁|hiệt|9|trang sách/đầu,風|phong|9|gió,飛|phi|9|bay,食 (飠)|thực|9|ăn,首|thủ|9|cái đầu,香|hương|9|mùi thơm,馬|mã|10|con ngựa,骨|cốt|10|xương,高|cao|10|cao,髟|bưu|10|tóc xõa,鬥|đấu|10|chiến đấu,鬯|xưởng|10|rượu cúng,鬲|cách|10|cái vạc,鬼|quỷ|10|ma quỷ,魚|ngư|11|con cá,鳥|điểu|11|con chim,鹵|lỗ|11|đất mặn,鹿|lộc|11|con hươu,麥|mạch|11|lúa mạch,麻|ma|11|cây gai,黃|hoàng|12|màu vàng,黍|thử|12|lúa nếp,黑|hắc|12|màu đen,黹|chỉ|12|may vá,黽|mãnh|13|con ếch,鼎|đỉnh|13|cái đỉnh,鼓|cổ|13|cái trống,鼠|thử|13|con chuột,鼻|tị|14|cái mũi,齊|tề|14|đều đặn,齒|xỉ|15|răng,龍|long|16|con rồng,龜|quy|16|con rùa,龠|dược|17|cây sáo"
  .split(",")
  .map((x, i) => {
    const [radical, reading, strokeCount, meaning] = x.split("|");
    return {
      no: i + 1,
      radical,
      reading,
      strokeCount: parseInt(strokeCount),
      meaning,
    };
  });

const wrapperCls =
  "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,135,154,0.10),transparent_28%),linear-gradient(180deg,#f6fbfb_0%,#eef6f7_100%)] px-5 pb-10 pt-5";
const shellCls = "mx-auto w-full max-w-[1100px]";

const toolbarCls =
  "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d6e4e7] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(16,42,45,0.04)]";

const sectionPanelCls =
  "rounded-xl border border-[#d6e4e7] bg-white p-3 shadow-[0_6px_18px_rgba(16,42,45,0.04)] h-full flex flex-col";

const sectionHeadCls =
  "mb-2 flex items-baseline justify-between border-b border-[#eef3f4] pb-2";

const radicalRowBaseCls =
  "group flex items-center gap-3 rounded-md border border-[#eef3f4] bg-white hover:border-primary hover:bg-primary-low/30 px-3 py-2.5 transition-colors";

function speak(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore
  }
}

function RadicalRow({ item }) {
  return (
    <div className={radicalRowBaseCls}>
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#f0f7f8] text-[26px] font-bold text-text-high">
        {item.radical}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold leading-tight text-text-high capitalize">
            {item.reading}
          </span>
          <span className="shrink-0 text-[11px] text-grey-low">
            Nét: {item.strokeCount}
          </span>
        </div>
        <div className="text-[12px] text-orange mt-0.5 truncate" title={item.meaning}>
          {item.meaning}
        </div>
      </div>
      <button
        type="button"
        title="Phát âm tiếng Nhật"
        aria-label="Phát âm"
        className="shrink-0 rounded border-0 bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors"
        onClick={() => speak(item.radical)}
      >
        🔊
      </button>
    </div>
  );
}

function FullRadicals() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRadicals = useMemo(() => {
    if (!searchTerm.trim()) return radicals214Data;
    const lower = searchTerm.toLowerCase();
    return radicals214Data.filter(
      (r) =>
        r.reading.toLowerCase().includes(lower) ||
        r.meaning.toLowerCase().includes(lower) ||
        r.radical.includes(lower)
    );
  }, [searchTerm]);

  // Group by stroke count
  const grouped = useMemo(() => {
    const groups = {};
    filteredRadicals.forEach((r) => {
      if (!groups[r.strokeCount]) groups[r.strokeCount] = [];
      groups[r.strokeCount].push(r);
    });
    return Object.keys(groups)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((k) => ({
        strokeCount: k,
        items: groups[k],
      }));
  }, [filteredRadicals]);

  return (
    <main className={wrapperCls}>
      <div className={shellCls}>
        <div className={toolbarCls}>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-text-high">
                Bảng 214 Bộ Thủ Kanji
              </h1>
              <p className="text-xs text-grey-low">
                Danh sách đầy đủ 214 bộ thủ            </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Tìm kiếm bộ thủ..."
              className="px-3 py-1.5 text-sm border border-[#d6e4e7] rounded-md focus:outline-none focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="rounded-xl border border-[#d6e4e7] bg-white p-6 text-center text-sm text-grey-low">
            Không tìm thấy bộ thủ nào phù hợp.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {grouped.map((group) => (
              <section key={group.strokeCount} className={sectionPanelCls}>
                <div className={sectionHeadCls}>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-primary">
                      {group.strokeCount} Nét
                    </h3>
                  </div>
                  <span className="shrink-0 text-[11px] text-grey">
                    {group.items.length} bộ
                  </span>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  {group.items.map((item) => (
                    <RadicalRow key={item.no} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default FullRadicals;
