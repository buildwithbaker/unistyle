# Changelog

## 1.9.0 - 2026-06-30
- **Format Sentences now flattens case to true sentence case.** Previously it only *added* a capital at each sentence start, so ALL-CAPS or shouty input stayed capped. It now lowercases the body first, then capitalizes each sentence's first letter. Rules: the pronoun "I" (and I'm/I'll/I've/I'd) stays capital; ALL-CAPS words (NASA, API) are preserved as acronyms; ordinary proper nouns flatten to lowercase; URLs, emails, domains, @handles, and file extensions are still protected. Note: a sentence typed entirely in caps is treated as all-acronyms and is left as-is by design.
- Bumped service-worker cache to `unistyle-v9` so the engine fix reaches installed PWA users (engine.js is served cache-first and only refreshes on a cache-name change).

## 1.8.1 - 2026-05-31
- Replaced em dashes with plain hyphens in the in-page panel toast messages ("Selection lost", "can't replace text here", "engine not loaded") so they render consistently across fonts and platforms.

## 1.8.0 - 2026-05-29
- Right-click panel is now **draggable** — grab the header to reposition it anywhere on the page (stays clamped on-screen). The close button and body controls keep working normally.
- Right-click panel cleanup actions (Format Sentences, Strip Unicode, Remove Formatting) now show **one at a time** with ‹ › arrows to cycle and the last-used option shown first, matching the popup's cleanup carousel.

## 1.7.2 - 2026-05-28
- Added **Remove Formatting**: strips bold/italic/Markdown and pasted rich-text formatting back to plain text (like "Paste as plain text"). Available in the web app, the right-click panel, and the popup.
- Popup redesigned: Format Sentences, Strip Unicode, and Remove Formatting now share a single **cleanup carousel** (one tool at a time, prev/next, last-used shown first), replacing the standalone Format Sentences and Strip buttons.
- Fixed: **Strip Unicode was scrambling ordinary text** (letters b/d/n/u/q/p swapped via the upside-down and small-caps reverse maps, e.g. "quick brown" became "bnick qrowu"). Now only non-ASCII glyphs are reverse-mapped, so plain text passes through untouched.

## 1.7.1 - 2026-05-25
- Right-click panel now shows all 22 styles by default instead of 7. Users can still favorite/unfavorite to customize.
