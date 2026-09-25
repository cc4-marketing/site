---
title: "Offline Notes: Keep the Reason You Saved It"
slug: offline-notes-keep-the-reason
excerpt: "A free Chrome extension for saving articles, highlighting passages, and writing why they matter. Offline, no account, Markdown out. The v1.4.1 tester is open."
author: tri-vo
cover: /blog/cover-offline-notes-keep-the-reason.png
cover_alt: "A pinned article page with one highlighted passage and a small note card tied to it, next to a bookmark ribbon pinned over nothing"
published_at: 2026-09-25T11:00:00Z
keywords: [offline notes, chrome extension, web highlighter, markdown notes, read later, save articles offline]
---

Save a good article. Open it weeks later. Wonder why you saved it.

The link survived. The thought didn't.

A bookmark can take you back to an article. It can't tell you what you were thinking when you read it. That is the part I want to keep, so I built Offline Notes, a Chrome extension for desktop. Save an article's text, mark a passage, and leave a note beside it. When you return, the words are there. So is your reason for saving them.

The free v1.4.1 tester is open at [notes.cc4.marketing](https://notes.cc4.marketing).

## Why another notes tool

I have used Instapaper, Pocket, Save.day, Readwise. Years of saving and annotating the web leave you with habits: how you read a piece, which color means what, how you find a note again and carry it into your own writing.

What I did not want was my library locked inside someone else's app. So the two decisions that shaped this extension were made before any feature: it must work offline, and everything must come out as Markdown. Notes need an exit.

That leads to an unusual property for 2026 software: Offline Notes has no account, no server, no sync, no AI, and no analytics. Everything lives in `chrome.storage.local` on your machine. The extension makes no network requests of any kind.

## How I actually use it

Meet a good link with time to read it: I open the article, select the passage worth keeping, pick a highlight color, and save. Want to record a thought while it's fresh? The Note action opens the extension's own sidebar, and the comment stays private there.

No time to read now? `Alt+S` saves the article's readable text. Later, "Read offline" opens it in a minimal reader, serif or sans, light or dark, with my highlights already painted in place. Highlighting in the reader saves back to the source page, so the library stays whole.

The sidebar vault collects everything: search, tags, the highlights of every saved page with their comments. When something is worth moving into my knowledge base, I export Markdown and open it in Obsidian. There's also a Cornell-style export for page highlights, still experimental, and you can import your own `.md` or HTML files and annotate them inside the extension.

This is the reading loop I run every day. The plan is to keep doing that small set of things well before adding anything else.

## What v1.4.1 fixed

This release spends less effort looking new than protecting work already done. Malformed backups are rejected before they can overwrite your library. If a save fails, your typed edits stay on screen instead of vanishing. Private comments moved fully onto extension-owned pages, off the source website. Site-rule toggles and capture authorization now run on one write queue, so switching a site off mid-capture behaves.

## The honest limits

A few things you should know before installing. Visible highlights are rendered on the website's page, so the site can observe them; use the per-site switch where that matters. Notes are stored in your Chrome profile without encryption, and they can leave that profile if you export them or mirror to a folder another service syncs. Chrome internal pages and PDFs can't be highlighted. Some article pages resist extraction even with the retry.

And the tester itself is manual: you sign up by email on the site, the download appears on the page (no email is sent automatically), and you install and update the ZIP yourself. Use a separate Chrome profile for testing, and back up any existing library first. Three short videos on the page walk through setup and the main workflows.

## The test I'd ask you to run

Save one short article. Mark one passage. Write why it matters. Close it. Come back in a week.

What was missing when you returned? Tell me that, through the feedback links on the page. That answer is worth more to me than a feature request.

[Get the v1.4.1 tester](https://notes.cc4.marketing) It's free, and your notes stay yours.
