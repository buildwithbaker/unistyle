# UniStyle

> Convert plain text into 22 Unicode styles for Discord, Notion, X, Slack, and anywhere Unicode renders. Free. No signup, no tracking, no server.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nhckckecpjaibnldmdcjjdadmadpainh?label=Chrome%20Web%20Store&color=2B4A8B)](https://chromewebstore.google.com/detail/unistyle-unicode-text-for/nhckckecpjaibnldmdcjjdadmadpainh)
[![Web App](https://img.shields.io/badge/Web%20App-unistyle.io-2B4A8B)](https://unistyle.io)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/abaker421)

## Quick start

1. **[Install UniStyle from the Chrome Web Store](https://chromewebstore.google.com/detail/unistyle-unicode-text-for/nhckckecpjaibnldmdcjjdadmadpainh)**
2. Pin it to your toolbar (puzzle icon → pin)
3. Select text on any page → right-click → **Format with UniStyle** (or press `Ctrl+Shift+Y`)

Prefer no install? The full tool runs in your browser at **[unistyle.io](https://unistyle.io)** - installable as a PWA on desktop and Android, works offline.

## What it does

UniStyle generates real Unicode characters that look bold, italic, scripted, monospace, and more. Because the output is real Unicode (not Markdown), the formatting travels with the text - paste it into Discord usernames, X bios, Slack messages, LinkedIn headlines, anywhere a text field renders Unicode.

Type:

```
Hello World
```

Get back:

```
𝐇𝐞𝐥𝐥𝐨 𝐖𝐨𝐫𝐥𝐝     ← bold
𝐻𝑒𝑙𝑙𝑜 𝑊𝑜𝑟𝑙𝑑     ← italic
𝓗𝓮𝓵𝓵𝓸 𝓦𝓸𝓻𝓵𝓭     ← script
Ｈｅｌｌｏ Ｗｏｒｌｄ     ← fullwidth (vaporwave)
```

...and 18 more.

## Features

- **22 Unicode styles:** bold, italic, bold italic, sans-serif bold, sans-serif italic, sans-serif bold italic, underline, strikethrough, monospace, script, fraktur, double-struck, fullwidth, small caps, bubble, upside down, reverse, alternating case, zalgo, subscript, superscript, regional indicator (country flag codes)
- **Style combiner:** stack a modifier (strikethrough, underline, overline, reverse) on any base style
- **Favorites:** pin your most-used styles
- **History:** recent transformations are saved locally
- **Special characters row:** quick-insert for em dashes, ellipsis, smart quotes, etc.
- **Cleanup transforms:** Format Sentences, CAPS, lowercase, Title Case, Strip Unicode
- **Keyboard shortcuts** (extension): `Ctrl+Shift+Y` opens popup, `Ctrl+Shift+U` transforms selected text with last-used style, `Ctrl+Shift+F` opens inline panel
- **Right-click context menu** (extension): "Format with UniStyle" on any selected text
- **PWA installable** (web): works offline once installed

## Who it's for

Discord server owners styling channel names and announcements. Creators dressing up X bios and LinkedIn headlines. Notion and Slack users who want emphasis where the platform doesn't allow formatting - usernames, statuses, titles. Anyone who's ever wanted bold text in a field that only accepts plain text.

## How it works

Plain text uses standard Unicode (U+0041 = "A"). UniStyle maps each character to its equivalent in another Unicode block - "Mathematical Alphanumeric Symbols" (U+1D400+) for bold/italic/script/fraktur, "Halfwidth and Fullwidth Forms" (U+FF21+) for fullwidth, "Combining Diacritical Marks" for zalgo, etc. The output is real Unicode that displays styled glyphs anywhere a font renders those code points.

This is different from Markdown formatting (which only works inside platforms that parse it). UniStyle output works in usernames, bios, status fields, third-party clients, and anywhere plain text is accepted.

## FAQ

**Is it really free?**
Yes. MIT licensed, no account, no ads, no tracking. [Ko-fi](https://ko-fi.com/abaker421) exists if you want to say thanks - the tool stays free either way.

**Why do some styles show empty boxes (□)?**
Font coverage varies. Some platforms and older devices don't render every Unicode block. Each style in UniStyle has a compatibility tip showing where it works (Discord, X, Notion, Slack).

**Will styled text hurt accessibility?**
It can. Screen readers often read mathematical alphanumeric characters letter-by-letter or skip them. Use styled text for short decorative strings (names, headers), not body text.

**What's the difference between the extension and the web app?**
Same engine. The extension adds the right-click menu, keyboard shortcuts, and an inline panel on any page. The web app is the full-page tool and installs as an offline PWA.

**Is my text sent anywhere?**
No. Conversion happens locally in JavaScript. Nothing is sent to a server, saved to a database, or logged. Full policy: [unistyle.io/privacy](https://unistyle.io/privacy)

## Local development

```bash
git clone https://github.com/buildwithbaker/unistyle.git
cd unistyle
# Serve over HTTP for the service worker to register correctly:
python3 -m http.server 8000
# Then open http://localhost:8000 in a browser
```

No build step. No dependencies. Edit `index.html`, `engine.js`, `sw.js` directly. The Chrome extension source lives in `extension/`; the shared `engine.js` is kept byte-identical between the web and extension copies.

## Contributing

Issues and pull requests welcome. For larger changes please open an issue first to discuss.

> **Internals:** see [docs/internal/architecture.md](docs/internal/architecture.md) for the full architecture reference - engine internals, the STYLES model, extension architecture, and gotchas.

When adding a new Unicode style:

1. Add the style definition to `engine.js` in the `STYLES` array
2. Include `key`, `label`, `compat` (Discord/Twitter/Notion/Slack support), `tip` (tooltip explaining the style)
3. Implement the transform function `fn` that maps input chars to the new Unicode range
4. For styles with partial alphabet coverage, document the gap in the `tip`

## Support

If UniStyle saved you time, a coffee on [Ko-fi](https://ko-fi.com/abaker421) keeps the builds coming - and a ⭐ on this repo helps other people find it.

## License

MIT - see [LICENSE](LICENSE) for details.

## Author

Built by Adam Baker - part of [Build with Baker](https://ko-fi.com/abaker421), a small-tool maker brand for things that make the web a little less annoying.
