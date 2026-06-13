# Báo Cáo Đối Chiếu: Tài Liệu Word vs Thực Tế Codebase

Tài liệu này liệt kê **toàn bộ** các tính năng, module, và trang (pages) hiện đang tồn tại trong mã nguồn (Codebase) nhưng **chưa được đề cập** hoặc **đề cập rất mờ nhạt** trong file báo cáo Word. 

Để file Word khớp 100% với Codebase, bạn cần bổ sung các phần dưới đây vào báo cáo.

---

## 1. Các Tính Năng Lớn (Features) Cần Viết Thêm Vào Word

Đầu tiên, trong phần "Mô tả tính năng" hoặc "Các chức năng chính của hệ thống" trong file Word, bạn cần viết bổ sung các Epic/Feature lớn sau:

### 1.1. Hệ Thống Thanh Toán & Tài Khoản Premium (Payments)
*   **Mô tả:** Hệ thống hỗ trợ người dùng nâng cấp tài khoản hoặc mua các gói học thuật thông qua cổng thanh toán.
*   **Chi tiết backend:** Đã có module `payments`. Quản lý giao dịch, tạo mã thanh toán, và xác nhận trạng thái thanh toán.
*   **Chi tiết frontend:** Có trang `Payment` để người dùng thao tác.
*   **Lý do cần thêm:** Đây là tính năng rất quan trọng liên quan đến luồng nghiệp vụ kinh doanh (Business Logic) của đồ án, giúp dự án có tính thực tiễn (Monetization).

### 1.2. Hệ Thống Gamification (Danh Hiệu & Ghi Nhận Thành Tích)
*   **Mô tả:** Tăng cường động lực học tập bằng cách trao các danh hiệu (Trophies/Badges) khi người dùng hoàn thành các cột mốc.
*   **Chi tiết backend:** Các module `trophies`, `user_trophies`, `user_activities`.
*   **Lý do cần thêm:** Gamification đang là xu hướng bắt buộc trong các app giáo dục (như Duolingo). Việc bổ sung vào báo cáo sẽ làm tăng điểm đánh giá UX và tính sáng tạo.

### 1.3. Khởi Tạo & Gợi Ý Lộ Trình Học Tập (Onboarding & Learning Path)
*   **Mô tả:** Khi người dùng mới đăng ký, hệ thống sẽ có các bước khảo sát mục tiêu (Onboarding) để từ đó tự động sinh ra một lộ trình học tập phù hợp (Learning Path).
*   **Chi tiết backend:** Module `learning-path`.
*   **Chi tiết frontend:** Trang `Onboarding`.
*   **Lý do cần thêm:** Thể hiện sự ứng dụng AI hoặc thuật toán cá nhân hóa người dùng, làm tăng giá trị công nghệ của đồ án.

### 1.4. Luyện Tập Giao Tiếp Riêng Biệt (Conversation Practice)
*   **Mô tả:** Bên cạnh Chatbot AI hỏi đáp ngữ pháp thông thường, hệ thống có một phân hệ riêng biệt dành cho việc luyện tập giao tiếp theo tình huống thực tế.
*   **Chi tiết backend:** Module `conversation`, có thể kết hợp với module `kantan` (phương pháp Kantan).
*   **Chi tiết frontend:** Trang `ConversationPractice`.

### 1.5. Hệ Thống Kiểm Duyệt Nội Dung & Tương Tác Nâng Cao
*   **Mô tả:** Diễn đàn (Forum) không chỉ dừng ở mức post bài/comment, mà còn có hệ thống kiểm duyệt (tự động hoặc thủ công) và ghi nhận đóng góp người dùng.
*   **Chi tiết backend:** Module `moderation` (kiểm duyệt), `contribution` (đóng góp), `par_comment` (bình luận phân cấp sâu/reply).

---

## 2. Bổ Sung Sơ Đồ Khối / Kiến Trúc (Backend Modules)

Trong phần "Thiết kế Backend" hoặc "Danh sách các Module/API", bạn cần bổ sung các thư mục module sau (chưa hề có trong Word):

1.  **`payments`**: Quản lý thanh toán.
2.  **`trophies` & `user_trophies`**: Quản lý danh hiệu và huy hiệu cá nhân.
3.  **`user_activities`**: Ghi log chi tiết hành động của người dùng trên hệ thống.
4.  **`learning-path`**: Quản lý và cung cấp lộ trình học.
5.  **`conversation`**: Quản lý các đoạn hội thoại mẫu hoặc AI Roleplay.
6.  **`kantan`**: (Có thể là chức năng học ngữ pháp Kantan/Easy hoặc liên quan đến phương pháp học độc quyền của team).
7.  **`moderation`**: Quản lý spam/từ ngữ nhạy cảm trên Forum.
8.  **`contribution`**: Quản lý các báo cáo lỗi/đóng góp nội dung từ người dùng.
9.  **`pdf`**: Module xử lý xuất/đọc file PDF (VD: xuất sổ tay, tải đề thi).
10. **`search_history`**: Lưu lịch sử tra cứu từ vựng/kanji để gợi ý.
11. **`upload`**: Module xử lý việc đẩy file chung (tách biệt với Cloudinary config).
12. **`flashcard`**: Tính năng Flashcard đang đứng thành 1 module độc lập ở backend (trong Word chỉ nhắc đến như một chức năng nhỏ của Notebook).

---

## 3. Bổ Sung Sơ Đồ Chuyển Trang / UI (Frontend Pages)

Trong phần "Thiết kế Giao diện" hoặc "Sơ đồ chuyển trang (Sitemap)", cần vẽ/thêm các trang sau:

1.  **`Onboarding` Page**: Nơi thu thập thông tin đầu vào.
2.  **`Payment` Page**: Giao diện thanh toán/Upgrade VIP.
3.  **`ConversationPractice` Page**: Giao diện luyện giao tiếp.
4.  **`About` Page**: Trang giới thiệu về dự án/team.

---

## 4. Cập Nhật Cấu Trúc Database (MongoDB Collections)

Khi cập nhật biểu đồ ERD (Entity Relationship Diagram) hoặc danh sách Database Schema trong Word, hãy đảm bảo bạn **VẼ THÊM** các bảng (collections) tương ứng với các module trên:

*   Bảng `payments` / `transactions`.
*   Bảng `trophies` (danh mục cúp) và `user_trophies` (cúp người dùng đã đạt).
*   Bảng `learning_paths`.
*   Bảng `user_activities` (log logs).
*   Bảng `search_histories`.
*   Bảng `moderations` / `reports`.

---

## Tóm Lược Để Hoàn Thiện File Word:

Để khớp 100%, bạn hãy mở file Word ra và làm theo 3 bước:
1.  **Thêm 5 mục lớn** vào phần "Danh sách chức năng hệ thống" ở mục 1.
2.  **Cập nhật hình ảnh Sơ đồ ERD** để nhét thêm các bảng liên quan đến Thanh Toán, Danh Hiệu, Lộ trình học.
3.  **Cập nhật Sơ đồ chức năng Backend/Frontend** để đưa các module/page mới vào kiến trúc.
