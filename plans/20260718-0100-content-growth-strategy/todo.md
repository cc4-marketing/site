# TODO — content & growth (cập nhật 2026-07-18)

Trạng thái: `[x]` xong, `[~]` chặn/chờ, `[ ]` chưa làm.

## Phase 0 — dọn nợ
- [x] Task 2: reconcile lesson count về 19 (7 file) — PR #26
- [x] Task 3: auto-sync llms.txt/llms-full.txt trong publish_post.py — PR #26
- [x] chore: gitignore `__pycache__/` — PR #26
- [~] Task 1: sitemap Emdash collision. Chặn: node_modules bị hook chặn, chưa verify flag disable-sitemap của emdash 0.1.0. Redirect vẫn chạy, mới là warning. Việc cần: xác nhận flag (đọc docs emdash hoặc tạm tắt hook) rồi tắt sitemap của emdash trong astro.config.mjs.
- [~] Task 4: prep Polar. Chặn: chờ tạo account + MoR onboarding (vài ngày). Việc cần: tạo org, bật MoR, verify thuế/payout.
- [~] Task 5: tách email. Chặn: chờ export contact Resend + xác nhận endpoint Substack. Việc cần:
  - [ ] export contact Resend hiện có, import sang Substack (thủ công, làm trước)
  - [ ] xác nhận endpoint `/api/v1/free` của Substack bằng test email thật
  - [ ] `subscribe.ts`: thêm auto-subscribe Substack server-side sau khi gửi Resend
  - [ ] `subscribe.ts`: bỏ push Resend audience (dòng 73-83 + read `RESEND_AUDIENCE_ID`)
  - [ ] `download.astro`: bỏ popup `window.open` Substack (dòng 313-318)

## Phase 1 — Library (chưa bắt đầu)
- [ ] Tạo MDX content collection `library` (copy pattern `modules`)
- [ ] Routes `/library/`, `/library/[category]/`, `/library/[category]/[entry]/` + `deriveLibraryUrls()` vào astro.config
- [ ] 9 category theo chức năng marketing
- [ ] Entry schema (type, access free|paid, polarProductId, author, related, tags)
- [ ] Viết ~26 seed entry (19 free + 5 paid pack + 1 bundle)
- [ ] Free/paid split UI: paid entry = preview + locked artifact + nút Polar
- [ ] Master public doc (GitHub repo) + link-back flywheel
- [ ] AEO per entry: SoftwareSourceCode + BreadcrumbList JSON-LD + Q&A block + mục llms.txt
- [ ] Cập nhật `faq.astro` ("no paid tier") khi pack đầu ship

## Phase 2+ — nội dung & phân phối (chưa bắt đầu)
- [ ] Template tutorial "How to [task] with Claude Code (+ prompt)", 2 bài/tuần, AI-assisted (Tri + Alice)
- [ ] Launch Library như sự kiện: Product Hunt, Show HN, r/ClaudeAI, LinkedIn, X
- [ ] Expert roundup "N marketers dùng Claude Code thế nào" (backlink)
- [ ] Substack nurture hàng tuần: 1 entry + 1 tutorial + 1 nhắc paid
- [ ] Baseline: export GA4 + Search Console để có số trước khi chạy

## Việc chỉ bạn làm được (không code)
- [ ] Polar account + MoR onboarding (khởi động sớm, kẻo chặn launch paid)
- [ ] Export contact Resend
- [ ] Quyết: có commit thư mục `plans/` vào repo không
