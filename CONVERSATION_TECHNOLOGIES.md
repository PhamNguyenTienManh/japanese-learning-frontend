# Tổng quan công nghệ trang `/conversation`

## 1. Tổng quan chức năng

`/conversation` là trang luyện hội thoại tiếng Nhật dành cho tài khoản **Pro**. Trang cung cấp ba chế độ học:

1. Học từ vựng và ngữ pháp theo chủ đề.
2. Luyện nói theo hội thoại có sẵn, kèm phụ đề và chấm độ khớp.
3. Luyện hội thoại tự do với AI, nhận phản hồi theo thời gian thực.

Các file chính:

- Route: `src/config/routes.js:18`
- Đăng ký route: `src/routes/index.jsx:68`
- Trang chính: `src/pages/ConversationPractice/index.jsx`
- Hội thoại theo vai: `src/pages/ConversationPractice/ConversationChat/index.jsx`
- Hội thoại AI: `src/pages/ConversationPractice/AiConversation/index.jsx`
- API hội thoại: `src/services/conversationService.js`
- API AI: `src/services/aiService.js`

## 2. React 19

Dự án sử dụng **React 19.1.0** và **React DOM 19.1.0**.

Trang được chia thành các functional component:

- `ConversationPractice`: quản lý toàn bộ trang và chế độ học.
- `ConversationCard`: hiển thị một bài hội thoại.
- `ModeRail`: chuyển đổi giữa ba chế độ học.
- `VocabGrammarStudy`: hiển thị từ vựng và ngữ pháp.
- `ConversationChat`: mô phỏng hội thoại theo vai.
- `AiConversation`: hội thoại tự do với AI.

Các React Hook được sử dụng:

- `useState`: lưu bài được chọn, chế độ học, transcript, lỗi, loading và tin nhắn AI.
- `useEffect`: tải dữ liệu, khởi tạo Kuroshiro, tự cuộn chat và dọn tài nguyên.
- `useMemo`: lọc bài học, đọc query parameter và chọn bài cho hướng dẫn.
- `useRef`: giữ SpeechRecognition, session AI, AbortController và DOM reference.
- `useCallback`: giữ các hàm điều khiển hội thoại ổn định.

Trang không dùng Redux. Trạng thái của phiên luyện được quản lý cục bộ bằng React state.

## 3. React Router DOM

Dự án sử dụng **React Router DOM 6.30.1**.

Route được cấu hình như sau:

```jsx
conversationPractice: "/conversation"
```

Sau đó ánh xạ tới component:

```jsx
{ path: config.routes.conversationPractice, component: ConversationPractice }
```

Trang dùng `useLocation()` để đọc query parameter, ví dụ:

```text
/conversation?tour=conversation
```

Query này kích hoạt `GuidedCoachmark`, hướng dẫn người dùng chọn bài hội thoại đầu tiên.

## 4. REST API và Fetch

Module này dùng native `fetch`, không dùng Axios.

Base URL lấy từ biến môi trường:

```js
process.env.REACT_APP_BASE_URL_API
```

### Lấy danh sách hội thoại

```http
GET /conversation
```

API trả về các nhóm chủ đề cùng danh sách bài học.

### Lấy chi tiết bài học

```http
GET /conversation/:idOrSlug
```

Chi tiết bài học có thể chứa:

- Tiêu đề và trình độ.
- Hình ảnh và chủ đề.
- Danh sách từ vựng.
- Danh sách ngữ pháp.
- Các câu hội thoại bằng tiếng Nhật, kana và tiếng Việt.

Các request đều dùng:

```js
credentials: "include"
```

Cookie xác thực được trình duyệt gửi tự động tới backend. Frontend có xử lý loading, lỗi HTTP và tránh cập nhật state sau khi component đã unmount.

## 5. Phân quyền Premium

Trang lấy trạng thái người dùng từ `AuthContext`:

```jsx
const { isPremium } = useAuth();
```

Nếu người dùng không có gói Pro, `PremiumGate` được hiển thị thay cho nội dung luyện tập. Nút nâng cấp dẫn tới:

```text
/payment?plan=Pro
```

Route `/conversation` nằm trong danh sách public, nhưng quyền sử dụng tính năng được kiểm tra ở cấp component.

## 6. Ba chế độ học

State `studyMode` nhận ba giá trị:

- `vocab`: học từ vựng và ngữ pháp.
- `speaking`: luyện nói theo kịch bản có sẵn.
- `ai`: luyện hội thoại với AI.

Khi chuyển chế độ, hệ thống dừng giọng đang phát, hủy nhận dạng giọng nói và đặt lại trạng thái của phiên luyện.

## 7. Web Speech API

Web Speech API là công nghệ chính của phần luyện nói. Trang sử dụng trực tiếp API trình duyệt, không cần thư viện speech bên ngoài.

### Text-to-Speech

Các API được dùng:

- `window.speechSynthesis`
- `SpeechSynthesisUtterance`

Ví dụ:

```js
const utterance = new SpeechSynthesisUtterance(line.japanese);
utterance.lang = "ja-JP";
utterance.rate = 0.88;
utterance.pitch = 1;
window.speechSynthesis.speak(utterance);
```

Chức năng:

- Đọc câu mẫu tiếng Nhật.
- Chọn ngôn ngữ `ja-JP`.
- Điều chỉnh tốc độ và cao độ.
- Dừng câu đang đọc.
- Xử lý khi đọc xong hoặc xảy ra lỗi.

Trong chế độ hội thoại theo vai, câu dài được tách theo dấu `。` rồi đọc tuần tự. Người dùng có thể chỉnh tốc độ từ `0.5x` đến `1.5x`.

### Speech-to-Text

Trang hỗ trợ cả API chuẩn và API có tiền tố của Chrome:

```js
window.SpeechRecognition || window.webkitSpeechRecognition
```

Cấu hình nhận dạng:

```js
recognition.lang = "ja-JP";
recognition.interimResults = true;
recognition.continuous = false;
```

Chức năng:

- Nhận âm thanh từ micro.
- Chuyển lời nói thành văn bản tiếng Nhật.
- Cập nhật transcript trong lúc người dùng nói.
- Đưa transcript vào phần chấm độ khớp hoặc ô nhập AI.

Nếu trình duyệt không hỗ trợ Speech API, giao diện hiển thị thông báo lỗi thay vì bị crash.

## 8. Kuroshiro và Kuromoji

Trang sử dụng:

- `kuroshiro`
- `kuroshiro-analyzer-kuromoji`

Khởi tạo:

```js
const kuroshiro = new Kuroshiro();
await kuroshiro.init(new KuromojiAnalyzer({ dictPath: "/dict" }));
```

Kuroshiro chuyển văn bản tiếng Nhật sang hiragana:

```js
await kuroshiro.convert(text, { to: "hiragana" });
```

Ví dụ:

```text
今日は学校へ行きます
```

được chuẩn hóa gần dạng:

```text
きょうはがっこうへいきます
```

Bước này cần thiết vì SpeechRecognition có thể trả về Kanji, trong khi câu mẫu được lưu bằng kana. Chuẩn hóa về hiragana giúp việc so sánh công bằng hơn.

Từ điển Kuromoji được tải từ `/dict`; quá trình phân tích tiếng Nhật diễn ra ngay trên trình duyệt.

## 9. Thuật toán Levenshtein Distance

Trang tự cài đặt thuật toán **Levenshtein Distance** để tính độ tương đồng văn bản.

Quy trình:

1. Chuyển chuỗi thành chữ thường.
2. Loại bỏ khoảng trắng và dấu câu.
3. Tính số thao tác thêm, xóa hoặc thay thế ký tự.
4. Chuyển khoảng cách thành phần trăm tương đồng.

Công thức khái quát:

```text
similarity = 1 - editDistance / maxLength
```

Hệ thống so sánh ba trường hợp:

1. Câu tiếng Nhật gốc với transcript.
2. Kana mẫu với transcript.
3. Kana mẫu với transcript đã chuyển sang hiragana.

Điểm cuối cùng là giá trị cao nhất trong ba phép so sánh.

Ở màn hình luyện từng câu:

- Từ `80%`: Tuyệt vời.
- Từ `50%`: Tạm được.
- Dưới `50%`: Chưa chính xác.

Ở chế độ hội thoại theo vai, ngưỡng đạt là `60%`.

> Lưu ý: đây là độ tương đồng của văn bản sau nhận dạng giọng nói, không phải mô hình AI phân tích âm vị hay ngữ điệu. Khi thuyết trình nên gọi là **chấm độ khớp câu nói**, không phải **chấm phát âm tuyệt đối**.

## 10. Hội thoại theo vai

`ConversationChat` mô phỏng hai vai A và B. Vai được xác định theo vị trí câu:

```js
index % 2 === 0 ? "B" : "A"
```

Luồng hoạt động:

1. Hệ thống hiển thị câu hội thoại.
2. Câu của vai B được đọc bằng Text-to-Speech.
3. Đến vai A, hệ thống chờ người học.
4. Người học bấm micro và nói lại câu mẫu.
5. SpeechRecognition tạo transcript.
6. Kuroshiro chuẩn hóa transcript về hiragana.
7. Levenshtein tính độ khớp.
8. Người học chọn tiếp tục hoặc bỏ qua.
9. Quy trình lặp lại tới hết bài.

Các state chính:

- `revealed`: số câu đã hiển thị.
- `userTurn`: đánh dấu lượt của người học.
- `finished`: đánh dấu hội thoại hoàn tất.
- `listening`: trạng thái micro.
- `transcript`: văn bản nhận dạng.

Luồng được quản lý bằng React state và effect, không dùng thư viện state machine riêng.

## 11. Hội thoại với AI

### Tạo phiên AI

Khi `AiConversation` được mount, frontend gọi:

```http
POST /ai-chat
```

Session ID được lưu bằng `useRef` để giữ xuyên suốt phiên chat mà không gây render lại.

### Prompt engineering

Frontend tạo prompt dựa trên:

- Chủ đề của bài học.
- Trình độ JLPT.
- Yêu cầu AI trả lời ngắn.
- Yêu cầu có tiếng Nhật, hiragana và nghĩa tiếng Việt.
- Yêu cầu sửa lỗi ngắn gọn.
- Yêu cầu luôn kết thúc bằng câu hỏi.

Khi người dùng kết thúc buổi luyện, hệ thống gửi prompt tổng kết, yêu cầu AI đưa ra:

1. Điểm người học làm tốt.
2. Điểm cần cải thiện về ngữ pháp, từ vựng và cách diễn đạt.
3. Ví dụ sửa đúng.
4. Lời khuyên để luyện tiếp.

Người học có thể nhập nội dung bằng bàn phím hoặc dùng SpeechRecognition để chuyển giọng nói thành văn bản trước khi gửi tới AI.

## 12. Server-Sent Events và streaming

AI trả lời theo dạng streaming qua endpoint:

```http
POST /ai-chat/:sessionId/message/stream
Accept: text/event-stream
```

Frontend xử lý stream bằng:

- `response.body.getReader()`
- `TextDecoder`
- Buffer văn bản.
- Phân tách SSE theo `\n\n`.
- Đọc các dòng `data:`.
- Parse JSON event.

Các loại event được hỗ trợ:

- `chunk`: một phần nội dung AI.
- `progress`: tiến trình xử lý.
- `action`: hành động đặc biệt.
- `done`: phản hồi hoàn tất.
- `aborted`: phản hồi bị hủy.

Mỗi `chunk` được nối vào tin nhắn AI đang hiển thị. Người dùng thấy nội dung xuất hiện dần thay vì chờ toàn bộ phản hồi hoàn thành.

## 13. AbortController và cleanup

AI stream dùng `AbortController` để hủy request đang chạy.

Khi component unmount hoặc người dùng chuyển chế độ, hệ thống:

- Hủy AI stream.
- Hủy SpeechRecognition.
- Dừng SpeechSynthesis.

Mục đích:

- Tránh giọng đọc tiếp tục sau khi rời trang.
- Tránh micro tiếp tục hoạt động.
- Tránh cập nhật state trên component đã unmount.
- Giảm rò rỉ tài nguyên.

## 14. Sass, CSS Modules và classnames

Trang sử dụng:

- Sass.
- CSS Modules với `.module.scss`.
- `classnames/bind`.

Ví dụ:

```js
import styles from "./ConversationPractice.module.scss";
const cx = classNames.bind(styles);
```

Ghép class theo trạng thái:

```jsx
className={cx("micButton", { active: listening })}
```

Các file style được tách theo component, giúp class có phạm vi cục bộ và tránh xung đột CSS. Trang này không dùng Tailwind dù Tailwind tồn tại trong dependency của dự án.

## 15. Font Awesome

Font Awesome cung cấp các icon:

- Phát và dừng âm thanh.
- Micro.
- Tìm kiếm.
- Cài đặt.
- Gợi ý.
- AI.
- Gửi tin nhắn.
- Hoàn thành.
- Trạng thái chấm điểm.

Icon được render dưới dạng SVG qua `FontAwesomeIcon`.

## 16. Tìm kiếm phía client

Tìm kiếm không gọi API mới. Dữ liệu đã tải được lọc bằng `useMemo` theo:

- Tiêu đề bài học.
- Trình độ bài học.

Mặc định mỗi nhóm hiển thị ba bài. Người dùng có thể chọn **Xem thêm** hoặc **Thu gọn**. Danh sách nhóm đang mở được lưu bằng `Set`.

## 17. Khả năng truy cập

Trang có các xử lý accessibility cơ bản:

- Dùng phần tử `button` cho hành động.
- Khai báo `type="button"`.
- Có `aria-label` cho nút chỉ chứa icon.
- Có nhãn cho breadcrumb.
- Hỗ trợ phím Enter và Space để chọn dòng hội thoại.
- Có `tabIndex` cho phần tử tương tác.
- Input tìm kiếm nằm trong `label`.

## 18. Build tooling

Dự án dựa trên Create React App và sử dụng:

- `react-scripts 5.0.1`
- `react-app-rewired 2.2.1`
- `customize-cra 1.0.0`

Các script chính:

```json
"start": "react-app-rewired start",
"build": "react-app-rewired build",
"test": "react-app-rewired test"
```

`react-app-rewired` cho phép tùy chỉnh cấu hình Create React App mà không cần eject.

## 19. Luồng end-to-end

1. Người dùng mở `/conversation`.
2. React Router render `ConversationPractice`.
3. `AuthContext` kiểm tra quyền Pro.
4. Frontend gọi `GET /conversation`.
5. Người dùng tìm kiếm hoặc chọn bài.
6. Frontend gọi `GET /conversation/:idOrSlug`.
7. Người dùng chọn một trong ba chế độ học.
8. Chế độ từ vựng hiển thị dữ liệu bài học.
9. Chế độ luyện nói dùng SpeechSynthesis và SpeechRecognition.
10. Kuroshiro chuyển transcript sang hiragana.
11. Levenshtein tính phần trăm độ khớp.
12. Chế độ AI tạo session qua `POST /ai-chat`.
13. Prompt được tạo theo chủ đề và trình độ.
14. AI trả kết quả theo thời gian thực bằng SSE.
15. Người dùng kết thúc và nhận đánh giá tổng hợp.

## 20. Đoạn trình bày ngắn

> Trang `/conversation` được xây dựng bằng React 19 và React Router. Nội dung hội thoại được lấy từ REST API bằng Fetch, xác thực qua cookie. Trang có ba chế độ gồm học từ vựng-ngữ pháp, luyện hội thoại theo kịch bản và hội thoại với AI. Phần luyện nói sử dụng Web Speech API của trình duyệt để phát âm tiếng Nhật và nhận dạng giọng nói. Transcript được Kuroshiro cùng Kuromoji chuyển về hiragana, sau đó thuật toán Levenshtein tính độ khớp với câu mẫu. Phần AI tạo session riêng và nhận phản hồi theo thời gian thực bằng Server-Sent Events. Giao diện sử dụng Sass, CSS Modules, classnames và Font Awesome. Tính năng chỉ dành cho tài khoản Pro thông qua AuthContext và PremiumGate.

## 21. Điểm cần nhấn mạnh khi thuyết trình

- Speech API chạy trực tiếp trên trình duyệt, giảm nhu cầu xây dựng hệ thống speech riêng.
- Kuroshiro và Kuromoji giải quyết khác biệt giữa Kanji và kana trước khi so sánh.
- Levenshtein chấm độ khớp văn bản, không thay thế mô hình đánh giá phát âm chuyên sâu.
- SSE giúp phản hồi AI xuất hiện theo thời gian thực.
- `AbortController` và cleanup bảo đảm stream, micro và giọng đọc được dừng đúng lúc.
- React state đủ cho phạm vi phiên luyện; không cần thêm Redux.
