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

## Phase 1 — Library (PR #27, chờ merge)
- [x] MDX content collection `library` + Zod schema (paid field sẵn)
- [x] Routes hub/category/entry + `deriveLibraryUrls()` sitemap
- [x] 9 category theo chức năng marketing
- [x] 13 seed entry free phủ 9 category (artifact thật)
- [x] AEO per entry: SoftwareSourceCode + FAQPage + BreadcrumbList JSON-LD
- [~] Paid entry (5 pack + bundle) + free/paid split UI + nút Polar — chặn Polar (Task 4)
- [ ] Mục `## Marketing Library` trong llms.txt/llms-full.txt (deferred)
- [ ] Nav link `/library/` vào siteData.ts (thuộc PR #26, thêm khi merge)
- [ ] Master GitHub repo `cc4-marketing/marketing-library` (hub đã forward-link)
- [ ] Cập nhật `faq.astro` ("no paid tier") khi pack đầu ship

## Phase 2 — nội dung & phân phối (đã bắt đầu)
- [x] Template tutorial + cadence + ownership — `phase-02-content-engine.md`
- [x] Draft bài đầu "SEO Content Brief with Claude Code" — `first-tutorial-draft.md`
- [ ] Publish bài đầu qua /publish-post + /ship (chờ bạn cho phép deploy production)
- [ ] Draft 5 bài batch đầu (map 1:1 với library entry)
- [ ] Retrofit internal link: blog + Module 2 lesson -> library entry (PR nhỏ)
- [ ] Launch Library như sự kiện: Product Hunt, Show HN, r/ClaudeAI, LinkedIn, X
- [ ] Expert roundup "N marketers dùng Claude Code thế nào" (backlink)
- [ ] Substack nurture hàng tuần: 1 entry + 1 tutorial + 1 nhắc paid
- [ ] Baseline: export GA4 + Search Console để có số trước khi chạy

## Việc chỉ bạn làm được (không code)
- [ ] Polar account + MoR onboarding (khởi động sớm, kẻo chặn launch paid)
- [ ] Export contact Resend
- [ ] Quyết: có commit thư mục `plans/` vào repo không
