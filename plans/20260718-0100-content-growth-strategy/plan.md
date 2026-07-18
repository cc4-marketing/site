# Chiến lược nội dung & growth cc4.marketing (mô hình sheetsformarketers.com)

Ngày: 2026-07-18. Nguồn: nghiên cứu sâu sheetsformarketers.com + rà toàn bộ repo cc4-site.

## Quyết định đã chốt (2026-07-18)

- Thị trường chính: EN global. Kênh phân phối: Product Hunt, r/ClaudeAI, Hacker News, LinkedIn, X.
- Course free = top of funnel, build audience + email list.
- Monetization: bán advanced skills và flows (skill packs, workflow templates trả phí).
- Email: Substack = newsletter/nurture, Resend = transactional (welcome, download, receipt).
- Viết đều đặn: AI-assisted, dùng cả 2 persona Tri (Course Creator) + Alice (AI Marketing Strategist).
- Giá: skill pack/flow $19.99, bán lẻ và bundle đều được.
- Thanh toán: Polar (MoR lo tax EU/US, đã có skill payment-integration).

## Bài học lõi từ sheetsformarketers.com (SFM)

- Directory tuyển chọn trước, nội dung gốc sau. Founder không tự làm template nào lúc launch, chỉ curate 100+ sheet của người khác. Mỗi creator được feature trở thành người chia sẻ/backlink.
- Kiến trúc hub-and-spoke 3 tầng: homepage -> 5 hub -> 17 category -> bài lẻ. Internal link dày ở sidebar/footer.
- Tutorial công thức hóa: "How to X in Google Sheets in 2026 (+ Examples)", 600-700 từ, kèm artifact copy được. Rẻ, lặp lại được, ~400 bài.
- 1 master Google Sheet public chứa cả directory: tự lan truyền, tự rank, tự kéo link.
- Expert roundup ("50+ tips theo 85 marketers") để sản xuất backlink + quan hệ.
- Resource không gate, email là lời mời phụ. Launch bằng cộng đồng (Product Hunt) chứ không chờ SEO.
- Cảnh báo: SFM kiếm tiền kém, đứng im từ 2024. Đây là playbook kéo audience, không phải business model.

## Hiện trạng cc4.marketing (điểm tựa + gap)

- Điểm tựa: nền SEO/AEO tốt (llms.txt, FAQPage schema, robots đã sửa, sitemap chuẩn), pipeline publish-post tự động hóa một phần, changelog máy-đọc-được, brand system rõ, course 18 bài là lead magnet sẵn.
- Gap: chưa có editorial strategy; blog 9 bài đăng thất thường (6 bài T4, trống 2 tháng); chưa có keyword map; 2 newsletter (Substack + Resend) chưa phân vai; funnel không có KPI; EN/VN chưa chốt; sitemap Emdash collision là rủi ro treo; lesson count lệch giữa các surface.

## Outline chiến lược cập nhật

### Giai đoạn 0: chốt nền (1 tuần)
- Dọn nợ: thống nhất lesson count, xử lý sitemap Emdash, tự động sync llms.txt trong skill publish-post.
- Setup bán hàng: tích hợp Polar (skill payment-integration). SKU đầu tiên: 1 advanced skill pack + 1 flow, mỗi cái $19.99, thêm bundle (2+ pack) giảm giá nhẹ.
- Nối Substack vào mọi trang (thay form Resend generic): Resend chỉ còn transactional.

### Giai đoạn 1: Directory play, tài sản trung tâm (2-4 tuần)
- Xây "Claude Code Marketing Library": directory curate prompts, slash commands, skills, MCP servers, subagents cho marketer. Category theo chức năng: SEO, content, ads, analytics, email, social, reporting.
- Mỗi entry: tên, mô tả 1-2 câu, artifact copy/tải được (file .md command thật). Curate của cộng đồng + của mình (khác SFM: nguồn cung ít nên tự author nhiều hơn, đổi lại defensible).
- 1 master doc public (GitHub repo hoặc Sheet) chứa cả library, kèm link về site.
- Free/paid split ngay trong library: entry free (prompts, commands đơn) đầy đủ và không gate; entry advanced (skill packs, multi-step flows) hiện trong cùng category nhưng dẫn sang trang bán. Directory vừa là link magnet vừa là kệ hàng.
- Launch như sự kiện: Product Hunt, r/ClaudeAI, Hacker News (Show HN), LinkedIn, X.

### Giai đoạn 2: Spoke tutorials công thức hóa (liên tục)
- Pattern: "How to [task] with Claude Code (+ copy-paste prompt)" 600-900 từ, cấu trúc y hệt nhau, năm trong title, 4 internal link (hub + lesson liên quan + 2 bài anh em).
- Ưu tiên AEO/LLM discoverability hơn volume SEO thuần: search volume "claude code" còn nhỏ và biến động, nhưng AI engines đang trích dẫn; cc4 đã có lợi thế llms.txt/FAQ. Mỗi bài thêm Q&A block + schema.
- Cadence tối thiểu: 2 bài/tuần từ tutorial template, xen 1 bài thought-leadership/tháng (giữ giọng hiện có).

### Giai đoạn 3: Flywheel phân phối + backlink
- Expert roundup: "N marketers dùng Claude Code thế nào" (phỏng vấn cộng đồng, mỗi người được feature sẽ share).
- Form submit tool/prompt vào library: giữ nguồn cung + quan hệ.
- Email: Resend giữ welcome/download (transactional); nurture đi qua Substack, mỗi tuần 1 số: 1 entry library nổi bật + 1 tutorial + 1 nhắc paid pack. Broadcast khi có lesson/pack mới.

### Giai đoạn 4: Funnel + đo lường
- Funnel: tutorial/library (free) -> subscribe Substack + download course (Resend) -> course modules -> paid skill packs/flows. Mỗi lesson advanced và mỗi entry free có CTA sang pack liên quan.
- KPI: Substack subscribers, course starts (/start-0-0), GitHub stars/clones, số entry library, bài được AI engines trích dẫn, doanh thu pack + conversion rate list -> paid.
- Case study kéo trust: Threadmark, sigil, castmd làm proof cho paid flows.
- Baseline: export GA4 + Search Console ngay để có số trước khi chạy.

## Phase file chi tiết
- `phase-00-debt-cleanup.md`: sitemap Emdash collision, thống nhất lesson count, auto-sync llms.txt, prep Polar, tách email Resend/Substack.
- `phase-01-library.md`: entry schema, 9 category, URL/hub, free/paid split, ~26 seed entry, master GitHub repo, AEO per entry.

## Quyết định đã chốt thêm (2026-07-18)
- Canonical lesson count: 19 (github-pr-guide tính là lesson). Reconcile mọi surface về 19.
- Email flow: 1 signup -> Resend gửi resource/download (transactional) + auto-subscribe Substack server-side (không popup). Export contact Resend cũ sang Substack trước khi bỏ audience code.
- Cập nhật FAQ ("no paid tier") khi pack đầu ship.
