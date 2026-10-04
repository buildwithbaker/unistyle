/* UniStyle web app UI logic. Moved out of index.html so the CSP can drop
   script-src 'unsafe-inline'. Loaded after assets/js/engine.js. */
'use strict';

/* ── Cached output element refs (populated in buildRows) */
const outputEls = {};
let zalgoSlider = null;

/* ── DOM refs ────────────────────────────────────────── */
const inputEl      = document.getElementById('inputText');
const outputList   = document.getElementById('outputList');
const formatBtn    = document.getElementById('formatBtn');
const clearBtn     = document.getElementById('clearBtn');
const histBtn      = document.getElementById('histBtn');
const capsBtn      = document.getElementById('capsBtn');
const lowerBtn     = document.getElementById('lowerBtn');
const titleBtn     = document.getElementById('titleBtn');
const stripBtn     = document.getElementById('stripBtn');
const removeFmtBtn = document.getElementById('removeFmtBtn');
const charsToggle  = document.getElementById('charsToggle');
const specialCharsRow = document.getElementById('specialCharsRow');
const emojiToggle  = document.getElementById('emojiToggle');
const emojiRow     = document.getElementById('emojiRow');
const installBtn   = document.getElementById('installBtn');
const charCounter  = document.getElementById('charCounter');
const limitBarFill = document.getElementById('limitBarFill');
const limitStatus  = document.getElementById('limitStatus');
const sizeSlider   = document.getElementById('sizeSlider');
const styleSearch  = document.getElementById('styleSearch');
const comboBase    = document.getElementById('comboBase');
const comboMod     = document.getElementById('comboMod');
const comboCopy    = document.getElementById('combo-copy');
const comboOut     = document.getElementById('combo-out');
const srAnnounce   = document.getElementById('sr-announce');
const histDropdown = document.getElementById('hist-dropdown');
const filterChips  = document.querySelectorAll('.chip[data-filter]');

/* ── Favorites ───────────────────────────────────────── */
let favorites = new Set(JSON.parse(localStorage.getItem('tf-favs') || '[]'));
let activeFilter = 'all';
/* ── Mobile pagination state ─────────────────────────── */
let mobilePage = 0;
let mobilePool = []; // filter-visible rows, updated by applyVisibility
let perPage    = 5;  // dynamic: how many whole rows fit with NO internal scroll (recomputed on mobile)

function saveFavorites() { localStorage.setItem('tf-favs',JSON.stringify([...favorites])); }

function toggleFavorite(key, btn) {
  favorites.has(key) ? favorites.delete(key) : favorites.add(key);
  btn.classList.toggle('active', favorites.has(key));
  btn.textContent = favorites.has(key) ? '★' : '☆';
  saveFavorites();
  applyVisibility();
}

/* ── Unified visibility (search + filter chip) ────────── */
function applyVisibility() {
  const q = styleSearch.value.toLowerCase().trim();
  const rows = document.querySelectorAll('.style-row[data-key]');
  rows.forEach(row => {
    const key = row.dataset.key;
    const style = STYLES_MAP[key];
    let show;
    if (q) {
      show = style && (style.label.toLowerCase().includes(q) || style.key.toLowerCase().includes(q));
    } else {
      show = activeFilter === 'all' || favorites.has(key);
    }
    row.style.display = show ? '' : 'none';
  });

  // No-favs message
  const noFavsNeeded = !q && activeFilter === 'favs' && favorites.size === 0;
  let noFavMsg = document.getElementById('no-favs-msg');
  if (noFavsNeeded) {
    if (!noFavMsg) {
      noFavMsg = document.createElement('p');
      noFavMsg.id = 'no-favs-msg';
      noFavMsg.style.cssText = 'font-size:12px;color:#bbb;padding:12px 4px;font-style:italic;';
      noFavMsg.textContent = 'No favorites yet — click ☆ on any style to pin it here.';
      outputList.prepend(noFavMsg);
    }
    noFavMsg.style.display = '';
  } else if (noFavMsg) { noFavMsg.style.display = 'none'; }

  // No-search-results message
  const visible = [...rows].some(r => r.style.display !== 'none');
  let noSearchMsg = document.getElementById('no-search-msg');
  if (q && !visible) {
    if (!noSearchMsg) {
      noSearchMsg = document.createElement('p');
      noSearchMsg.id = 'no-search-msg';
      noSearchMsg.style.cssText = 'font-size:12px;color:#bbb;padding:12px 4px;font-style:italic;';
      noSearchMsg.textContent = 'No styles match that search.';
      outputList.prepend(noSearchMsg);
    }
    noSearchMsg.style.display = '';
  } else if (noSearchMsg) { noSearchMsg.style.display = 'none'; }
  // Mobile pagination - capture visible pool and re-paginate from page 0
  mobilePool = [...rows].filter(r => r.style.display !== 'none');
  mobilePage = 0;
  applyMobilePagination();
}

/* ── Mobile style pagination ─────────────────────────── */
const styleNav     = document.getElementById('styleNav');
const stylePrevBtn = document.getElementById('stylePrevBtn');
const styleNextBtn = document.getElementById('styleNextBtn');
const stylePageInd = document.getElementById('stylePageInd');
const MOBILE_BREAK = 680;
const PAGE_SIZE    = 5;
// How many whole style rows fit in the list box right now, with NO internal scroll.
// Returns at least 1 and at most PAGE_SIZE. The middle section must never scroll, so we
// paginate by however many actually fit rather than forcing a fixed count.
function computePerPage() {
  const sample = mobilePool[0];
  if (!sample) return PAGE_SIZE;
  const prevDisplay = sample.style.display;
  sample.style.display = '';                    // ensure the sample row is measurable
  const cs = getComputedStyle(sample);
  const margin = parseFloat(cs.marginBottom || '0');
  const rowH = sample.getBoundingClientRect().height + margin;
  sample.style.display = prevDisplay;
  const olcs = getComputedStyle(outputList);
  const padV = parseFloat(olcs.paddingTop || '0') + parseFloat(olcs.paddingBottom || '0');
  const avail = outputList.clientHeight - padV;
  if (rowH <= 0 || avail <= 0) return PAGE_SIZE;
  // The last visible row needs no bottom margin, so credit one margin of slack.
  const fit = Math.floor((avail + margin) / rowH);
  return Math.max(1, Math.min(PAGE_SIZE, fit));
}
function applyMobilePagination() {
  const isMobile = window.innerWidth <= MOBILE_BREAK;
  if (!isMobile) {
    // Desktop: hide the nav and show the full list (no pagination).
    styleNav.style.display = 'none';
    mobilePool.forEach(r => { r.style.display = ''; });
    return;
  }
  // Mobile: the nav is ALWAYS visible (even with one page) to avoid layout shift.
  styleNav.style.display = 'flex';
  perPage = computePerPage();
  const total = Math.max(1, Math.ceil(mobilePool.length / perPage));
  if (mobilePage >= total) mobilePage = total - 1;
  if (mobilePage < 0)      mobilePage = 0;
  // Hide all rows, then show only the current page's slice (exactly what fits, no scroll).
  document.querySelectorAll('#outputList .style-row[data-key]')
    .forEach(r => { r.style.display = 'none'; });
  mobilePool
    .slice(mobilePage * perPage, (mobilePage + 1) * perPage)
    .forEach(r => { r.style.display = ''; });
  // Update nav controls. With one page, both buttons disable and the indicator reads "1 / 1".
  stylePrevBtn.disabled    = mobilePage === 0;
  styleNextBtn.disabled    = mobilePage >= total - 1;
  stylePageInd.textContent = (mobilePage + 1) + ' / ' + total;
}
stylePrevBtn.addEventListener('click', () => {
  if (mobilePage > 0) { mobilePage--; applyMobilePagination(); }
});
styleNextBtn.addEventListener('click', () => {
  const total = Math.max(1, Math.ceil(mobilePool.length / perPage));
  if (mobilePage < total - 1) { mobilePage++; applyMobilePagination(); }
});
// Re-run on resize so rotating from portrait to landscape resets correctly
window.addEventListener('resize', () => {
  mobilePage = 0;
  applyMobilePagination();
}, { passive: true });
/* ── History ─────────────────────────────────────────── */
let histIsOpen = false;

/* Text saved by the blur that happens when focus leaves the box for the Clear
   button. Clear removes it again, so Clear never leaves the text in History. */
let lastBlurSave = null;

function saveToHistory(text) {
  if (!text || text.trim().length < 5) return;
  let hist = getHistory();
  hist = hist.filter(h => h.text !== text);
  hist.unshift({ text, ts: Date.now() });
  localStorage.setItem('tf-hist', JSON.stringify(hist.slice(0, 10)));
}
function getHistory() {
  try { return JSON.parse(localStorage.getItem('tf-hist') || '[]'); }
  catch { return []; }
}
function removeFromHistory(text) {
  localStorage.setItem('tf-hist', JSON.stringify(getHistory().filter(h => h.text !== text)));
}
function clearHistory() {
  localStorage.removeItem('tf-hist');
  lastBlurSave = null;
}
function buildHistoryContent() {
  histDropdown.innerHTML = '';
  const hdr = document.createElement('div');
  hdr.className = 'hist-header'; hdr.textContent = 'Recent Texts';
  histDropdown.appendChild(hdr);
  const hist = getHistory();
  if (!hist.length) {
    const e = document.createElement('p');
    e.style.cssText = 'padding:12px;font-size:12px;color:#5f6b7d;font-style:italic;';
    e.textContent = 'Nothing saved yet. Texts auto-save as you use the tool.';
    histDropdown.appendChild(e); return;
  }
  hist.forEach(h => {
    const item = document.createElement('div'); item.className = 'hist-item';
    const prev = document.createElement('span'); prev.className = 'hist-preview';
    const raw = h.text.replace(/\n/g,' ').trim();
    prev.textContent = raw.length > 68 ? raw.slice(0,68)+'…' : raw;
    const btn = document.createElement('button'); btn.className = 'hist-use'; btn.textContent = 'Use';
    btn.addEventListener('click', () => { inputEl.value = h.text; updateOutputs(); closeHistory(); inputEl.focus(); });
    item.append(prev, btn); histDropdown.appendChild(item);
  });
  const clr = document.createElement('button');
  clr.type = 'button'; clr.className = 'hist-clear'; clr.textContent = 'Clear history';
  clr.addEventListener('click', e => {
    e.stopPropagation();
    clearHistory();
    buildHistoryContent();
    srAnnounce.textContent = 'History cleared';
    setTimeout(() => { srAnnounce.textContent = ''; }, 1500);
    histBtn.focus();
  });
  histDropdown.appendChild(clr);
}
function openHistory() {
  histIsOpen = true;
  buildHistoryContent();
  const r = histBtn.getBoundingClientRect();
  histDropdown.style.top  = (r.bottom+4)+'px';
  histDropdown.style.right = (window.innerWidth-r.right)+'px';
  histDropdown.style.left = 'auto';
  histDropdown.style.display = 'block';
  setTimeout(() => document.addEventListener('click', histOutside), 0);
}
function closeHistory() {
  histIsOpen = false;
  histDropdown.style.display = 'none';
  document.removeEventListener('click', histOutside);
}
function histOutside(e) { if (!histDropdown.contains(e.target) && e.target !== histBtn) closeHistory(); }

/* ── Build rows ──────────────────────────────────────── */
const PLAT = [{k:'d',l:'Discord',b:'D'},{k:'t',l:'X/Twitter',b:'X'},{k:'n',l:'Notion',b:'N'},{k:'s',l:'SMS',b:'S'}];
const COMPAT_LABEL = ['Limited','Partial','Full'];

function buildRows() {
  outputList.innerHTML = '';
  comboBase.replaceChildren(...STYLES.filter(s=>!s.hasSlider).map(s => new Option(s.label, s.key)));
  STYLES.forEach(style => {
    const row = document.createElement('div');
    row.className = 'style-row'; row.dataset.key = style.key;
    row.setAttribute('data-tip', style.tip);

    const pillCell = document.createElement('div'); pillCell.className = 'pill-cell';
    const pill = document.createElement('span'); pill.className = 'style-pill'; pill.textContent = style.label;
    pillCell.appendChild(pill);
    if (style.compat) {
      const cr = document.createElement('div'); cr.className = 'compat-row';
      PLAT.forEach(p => {
        const dot = document.createElement('span');
        const lv = style.compat[p.k];
        dot.className = 'cd cd-'+lv; dot.textContent = p.b;
        dot.setAttribute('data-tip', p.l+': '+COMPAT_LABEL[lv]);
        cr.appendChild(dot);
      });
      pillCell.appendChild(cr);
    }

    const out = document.createElement('span');
    out.className = 'style-output placeholder'; out.id = 'out-'+style.key; out.textContent = 'Waiting for input…';
    outputEls[style.key] = out;

    const heartBtn = document.createElement('button');
    heartBtn.className = 'heart-btn'+(favorites.has(style.key)?' active':'');
    heartBtn.setAttribute('aria-label','Favorite '+style.label);
    heartBtn.textContent = favorites.has(style.key) ? '★' : '☆';
    heartBtn.addEventListener('click', () => toggleFavorite(style.key, heartBtn));

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn'; copyBtn.textContent = 'Copy';
    copyBtn.setAttribute('aria-label', 'Copy ' + style.label);
    copyBtn.setAttribute('data-tip', style.tip);
    copyBtn.addEventListener('click', () => copyStyle(style.key, copyBtn));

    if (style.hasSlider) {
      const ctrl = document.createElement('div'); ctrl.className = 'zalgo-ctrl';
      const slider = document.createElement('input');
      slider.type='range'; slider.min=1; slider.max=3; slider.step=1; slider.value=1; slider.id='zalgo-slider';
      slider.setAttribute('aria-label', 'Zalgo intensity');
      zalgoSlider = slider;
      const lvlLbl = document.createElement('span'); lvlLbl.className='zalgo-level'; lvlLbl.id='zalgo-val';
      const LEVELS=['Subtle','Medium','Chaos']; lvlLbl.textContent=LEVELS[0];
      slider.setAttribute('aria-valuetext', LEVELS[0]);
      slider.addEventListener('input', () => {
        lvlLbl.textContent = LEVELS[parseInt(slider.value)-1];
        slider.setAttribute('aria-valuetext', lvlLbl.textContent);
        const raw = inputEl.value;
        if (raw.trim()) { out.textContent=zalgoText(raw,parseInt(slider.value)); out.className='style-output'; }
      });
      ctrl.append(slider, lvlLbl); row.append(pillCell, ctrl, out, heartBtn, copyBtn);
    } else {
      row.append(pillCell, out, heartBtn, copyBtn);
    }
    outputList.appendChild(row);
  });
  applyVisibility();
}

/* ── Limit bar config ─────────────────────────────────── */
const LIMITS = [
  { name: 'X/Twitter', n:  280 },
  { name: 'Discord',   n: 2000 },
  { name: 'Instagram', n: 2200 },
];
const BAR_MAX = 3000;

/* ── Char counter + limit bar ────────────────────────── */
function updateCounter() {
  const raw = inputEl.value;
  const chars = [...raw].length;
  const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
  charCounter.textContent = chars.toLocaleString() + ' chars · ' + words.toLocaleString() + ' words';
  updateLimitBar(chars);
}

function updateLimitBar(chars) {
  if (!limitBarFill) return;
  limitBarFill.style.width = Math.min(chars / BAR_MAX * 100, 100) + '%';

  const active = LIMITS.find(l => chars <= l.n);

  let color = '#4ade80';
  if (active) {
    const pct = chars / active.n;
    if (pct > 0.9) color = '#f87171';
    else if (pct > 0.75) color = '#fb923c';
  } else { color = '#f87171'; }
  limitBarFill.style.background = color;

  if (!limitStatus) return;
  if (chars === 0) {
    limitStatus.textContent = 'X/Twitter 280 · Discord 2,000 · Instagram 2,200';
    limitStatus.classList.remove('limit-exceeded');
  } else if (active) {
    const remaining = active.n - chars;
    const left = remaining.toLocaleString() + ' left for ' + active.name + ' (' + active.n.toLocaleString() + ' char limit)';
    // Name every platform already exceeded, so passing X's 280 is never silent.
    const over = LIMITS.filter(l => chars > l.n);
    if (over.length) {
      const overText = over.map(l => l.name + ' by ' + (chars - l.n).toLocaleString()).join(' and ');
      limitStatus.textContent = 'Over ' + overText + ' · ' + left;
      limitStatus.classList.add('limit-exceeded');
    } else {
      limitStatus.textContent = left;
      limitStatus.classList.toggle('limit-exceeded', remaining < active.n * 0.1);
    }
  } else {
    limitStatus.textContent = 'Over all limits — X/Twitter · Discord · Instagram';
    limitStatus.classList.add('limit-exceeded');
  }
}

/* ── Combo modifier transforms ───────────────────────── */
/* Maps comboMod <select> values to transform functions. The "none" key returns
   null so updateCombo skips the apply step. Strikethrough and underline use the
   same combining marks as the standalone styles in engine.js. */
const COMBO_MODS = {
  none:   null,
  strike: t => [...t].map(c => c + '̶').join(''), // U+0336 combining long stroke overlay
  under:  t => [...t].map(c => c + '̲').join(''), // U+0332 combining low line
  over:   t => [...t].map(c => c + '̅').join(''), // U+0305 combining overline
  rev:    t => [...t].reverse().join('')
};

/* ── Combo ───────────────────────────────────────────── */
function updateCombo() {
  const out = comboOut;
  if (!out) return;
  const raw = inputEl.value;
  if (!raw.trim()) { out.textContent='Waiting for input…'; out.className='style-output placeholder'; return; }
  const baseStyle = STYLES.find(s => s.key === comboBase.value);
  if (!baseStyle) return;
  let result = baseStyle.fn(raw);
  const modFn = COMBO_MODS[comboMod.value];
  if (modFn) result = modFn(result);
  out.textContent = result; out.className = 'style-output';
}

/* ── Update all outputs ──────────────────────────────── */
function updateOutputs() {
  const raw = inputEl.value;
  updateCounter();
  STYLES.forEach(style => {
    const el = outputEls[style.key];
    if (!el) return;
    if (!raw.trim()) { el.textContent='Waiting for input…'; el.className='style-output placeholder'; }
    else {
      const level = style.hasSlider ? (parseInt(zalgoSlider?.value)||1) : undefined;
      el.textContent = style.fn(raw,level); el.className = 'style-output';
    }
  });
  updateCombo();
}

/* ── Copy ────────────────────────────────────────────── */
function copyStyle(key, btn) {
  const el = outputEls[key];
  if (!el||el.classList.contains('placeholder')) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    const orig=btn.textContent; btn.textContent='✓ Copied'; btn.classList.add('copied');
    srAnnounce.textContent = STYLES_MAP[key]?.label + ' style copied';
    maybeShowAhaNudge(btn.closest('.style-row'));
    setTimeout(()=>{ btn.textContent=orig; btn.classList.remove('copied'); srAnnounce.textContent=''; },1500);
  });
}

/* Post-copy aha-nudge: surface a one-per-session Ko-fi tip beneath the
   row the user just copied. Placement at the moment of value (right after
   a successful copy) per the browser-extension-monetization module 04. */
function maybeShowAhaNudge(anchorRow) {
  if (!anchorRow) return;
  if (sessionStorage.getItem('aha-shown')) return;
  sessionStorage.setItem('aha-shown', '1');
  const nudge = document.createElement('div');
  nudge.className = 'aha-nudge show';
  nudge.innerHTML = `
    <span class="aha-msg">Found this useful?</span>
    <a class="aha-tip" href="https://ko-fi.com/abaker421" target="_blank" rel="noopener noreferrer">☕ Tip</a>
    <button class="aha-x" aria-label="Dismiss">×</button>
  `;
  const fadeOut = () => { nudge.style.opacity = '0'; setTimeout(() => nudge.remove(), 300); };
  let dismissTimer = setTimeout(fadeOut, 8000);
  nudge.addEventListener('mouseenter', () => clearTimeout(dismissTimer));
  nudge.addEventListener('mouseleave', () => { dismissTimer = setTimeout(fadeOut, 8000); });
  nudge.querySelector('.aha-x').addEventListener('click', () => { clearTimeout(dismissTimer); fadeOut(); });
  nudge.querySelector('.aha-tip').addEventListener('click', () => { clearTimeout(dismissTimer); setTimeout(fadeOut, 100); });
  anchorRow.insertAdjacentElement('afterend', nudge);
}

/* ── Event listeners ─────────────────────────────────── */
/* Per-button click-to-undo: clicking the same transform button twice in a row
   reverts the input to its pre-transform value. The tracker remembers the last
   button + its before/after values; a click that matches both rolls back, any
   other click (or any manual edit / input event) resets the tracker.
   Cleared on input/paste so a manual edit invalidates the undo path. */
let lastTransform = { btn: null, before: null, after: null };
function applyTransform(btn, transformFn) {
  const cur = inputEl.value;
  if (lastTransform.btn === btn && cur === lastTransform.after) {
    inputEl.value = lastTransform.before;
    lastTransform = { btn: null, before: null, after: null };
    updateOutputs();
    return;
  }
  saveToHistory(cur);
  const next = transformFn(cur);
  inputEl.value = next;
  lastTransform = { btn, before: cur, after: next };
  updateOutputs();
}
inputEl.addEventListener('input', () => { lastTransform = { btn: null, before: null, after: null }; });

formatBtn.addEventListener('click', () => applyTransform(formatBtn, formatSentences));
clearBtn.addEventListener('click',  () => { if (lastBlurSave !== null && lastBlurSave === inputEl.value) removeFromHistory(lastBlurSave); lastBlurSave = null; inputEl.value=''; lastTransform = { btn: null, before: null, after: null }; updateOutputs(); inputEl.focus(); });
histBtn.addEventListener('click', e => { e.stopPropagation(); histIsOpen ? closeHistory() : openHistory(); });
capsBtn.addEventListener('click',   () => applyTransform(capsBtn,  s => s.toUpperCase()));
lowerBtn.addEventListener('click',  () => applyTransform(lowerBtn, s => s.toLowerCase()));
titleBtn.addEventListener('click',  () => applyTransform(titleBtn, s => s.replace(/\b\w/g, c => c.toUpperCase())));
stripBtn.addEventListener('click',  () => applyTransform(stripBtn, stripUnicode));
removeFmtBtn.addEventListener('click', () => applyTransform(removeFmtBtn, removeFormatting));

/* ── Chars + Emoji toggles ───────────────────────────── */
charsToggle.addEventListener('click', () => {
  const open = specialCharsRow.classList.toggle('open');
  charsToggle.classList.toggle('open', open);
  charsToggle.textContent = open ? 'Chars ▴' : 'Chars ▾';
  charsToggle.setAttribute('aria-expanded', String(open));
});
emojiToggle.addEventListener('click', () => {
  const open = emojiRow.classList.toggle('open');
  emojiToggle.classList.toggle('open', open);
  emojiToggle.textContent = open ? 'Emoji ▴' : 'Emoji ▾';
  emojiToggle.setAttribute('aria-expanded', String(open));
});

/* ── JS tooltip portal ───────────────────────────────── */
const ttPortal = document.getElementById('tt-portal');
let ttActive = null;

/* Help text toggle — power users can disable tooltips */
const HELP_KEY = 'unistyle-show-tips';
const helpToggle = document.getElementById('helpToggle');
let helpEnabled = localStorage.getItem(HELP_KEY) !== 'false';
helpToggle.checked = helpEnabled;
helpToggle.addEventListener('change', () => {
  helpEnabled = helpToggle.checked;
  localStorage.setItem(HELP_KEY, helpEnabled ? 'true' : 'false');
  if (!helpEnabled) {
    if (ttActive) {
      ttActive = null;
      ttPortal.style.opacity = '0';
      ttPortal.style.display = 'none';
    }
    if (mhbActive) {
      hideMobileHelp();
    }
  }
});

/* Mobile help bar: replaces the floating tooltip on coarse-pointer devices.
   - On mobile, tooltip portal is suppressed; tapping any [data-tip] element
     populates the help bar at the top of the viewport and highlights the
     target via [data-tip-active="true"].
   - Coexists with normal click handlers (button still does its job; help bar
     just shows what it does).
   - Auto-dismisses after 6 seconds, on close button, or when tapping outside
     any [data-tip] element. */
const mobileHelpBar     = document.getElementById('mobileHelpBar');
const mobileHelpBarText = document.getElementById('mobileHelpBarText');
const mobileHelpBarClose = document.getElementById('mobileHelpBarClose');
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
let mhbActive = null;
let mhbTimer  = null;
function showMobileHelp(target) {
  if (mhbActive && mhbActive !== target) mhbActive.removeAttribute('data-tip-active');
  mhbActive = target;
  target.setAttribute('data-tip-active', 'true');
  mobileHelpBarText.textContent = target.dataset.tip;
  mobileHelpBar.classList.add('active');
  clearTimeout(mhbTimer);
  mhbTimer = setTimeout(hideMobileHelp, 6000);
}
function hideMobileHelp() {
  if (mhbActive) mhbActive.removeAttribute('data-tip-active');
  mhbActive = null;
  mobileHelpBar.classList.remove('active');
  clearTimeout(mhbTimer);
}
mobileHelpBarClose.addEventListener('click', e => { e.stopPropagation(); hideMobileHelp(); });
if (isCoarsePointer) {
  document.addEventListener('click', e => {
    if (!helpEnabled) return;
    if (e.target.closest('#mobileHelpBar')) return;
    const t = e.target.closest('[data-tip]');
    if (t) showMobileHelp(t);
    else if (mhbActive) hideMobileHelp();
  }, true);
}

document.addEventListener('mouseover', e => {
  if (!helpEnabled) return;
  if (isCoarsePointer) return;                         // mobile uses help bar, not portal
  const t = e.target.closest('[data-tip]');
  if (!t || t === ttActive) return;
  ttActive = t;
  ttPortal.textContent = t.dataset.tip;
  ttPortal.style.display = 'block';
  ttPortal.style.opacity = '0';
  requestAnimationFrame(() => {
    const r  = t.getBoundingClientRect();
    const tw = ttPortal.offsetWidth;
    const th = ttPortal.offsetHeight;
    // Prefer below; fall back to above if not enough space
    const top = (window.innerHeight - r.bottom > th + 12)
      ? r.bottom + 5
      : r.top - th - 8;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    ttPortal.style.top  = top  + 'px';
    ttPortal.style.left = left + 'px';
    ttPortal.style.opacity = '1';
  });
});
document.addEventListener('mouseout', e => {
  if (!ttActive || ttActive.contains(e.relatedTarget)) return;
  ttActive = null;
  ttPortal.style.opacity = '0';
  setTimeout(() => { if (ttPortal.style.opacity === '0') ttPortal.style.display = 'none'; }, 160);
});
/* ── Special character insert ─────────────────────────── */
function insertAtCursor(char) {
  const s = inputEl.selectionStart ?? inputEl.value.length;
  const e = inputEl.selectionEnd   ?? inputEl.value.length;
  const v = inputEl.value;
  inputEl.value = v.slice(0, s) + char + v.slice(e);
  // focus() before setting cursor — some browsers reset selection on focus()
  inputEl.focus();
  inputEl.selectionStart = inputEl.selectionEnd = s + char.length;
  updateOutputs();
}
document.querySelectorAll('.btn-special').forEach(btn => {
  btn.addEventListener('click', () => insertAtCursor(btn.dataset.char));
});

styleSearch.addEventListener('input', applyVisibility);
styleSearch.addEventListener('search', applyVisibility); // fires on clear (×) click

sizeSlider.addEventListener('input', () => {
  outputList.style.setProperty('--output-size', sizeSlider.value+'px');
  document.querySelector('.combo-section').style.setProperty('--output-size', sizeSlider.value+'px');
  applyMobilePagination(); // row height changed -> recompute how many fit without scrolling
});

comboBase.addEventListener('change', updateCombo);
comboMod.addEventListener('change',  updateCombo);

comboCopy.addEventListener('click', () => {
  const out = comboOut;
  if (!out||out.classList.contains('placeholder')) return;
  navigator.clipboard.writeText(out.textContent).then(() => {
    const orig=comboCopy.textContent; comboCopy.textContent='✓ Copied'; comboCopy.classList.add('copied');
    srAnnounce.textContent = 'Combo style copied';
    setTimeout(()=>{ comboCopy.textContent=orig; comboCopy.classList.remove('copied'); srAnnounce.textContent=''; },1500);
  });
});

filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c=>{ c.classList.remove('active'); c.setAttribute('aria-pressed','false'); });
    chip.classList.add('active');
    chip.setAttribute('aria-pressed','true');
    activeFilter = chip.dataset.filter;
    styleSearch.value = ''; // clear search when switching tabs
    applyVisibility();
  });
});

inputEl.addEventListener('blur', () => {
  const text = inputEl.value;
  const isNew = !getHistory().some(h => h.text === text);
  saveToHistory(text);
  lastBlurSave = isNew ? text : null;
});
inputEl.addEventListener('focus', () => { lastBlurSave = null; });

let rafId;
inputEl.addEventListener('input', () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(updateOutputs); });

/* ── Textarea auto-grow ──────────────────────────────── */
/* Default 360px (about half the desktop left-panel card). Grows with content
   up to CSS max-height (60vh). Floor matches the CSS default so short input
   never shrinks the textarea below the user-friendly resting size. */
const INPUT_DEFAULT_HEIGHT = 360;
function autoGrowInput() {
  // Reset to baseline so scrollHeight reflects content, not previous expansion
  inputEl.style.height = 'auto';
  const next = Math.max(INPUT_DEFAULT_HEIGHT, inputEl.scrollHeight);
  inputEl.style.height = next + 'px';
}
inputEl.addEventListener('input', autoGrowInput);
// Also auto-grow when transform buttons / format / paste change the value
['capsBtn','lowerBtn','titleBtn','stripBtn','removeFmtBtn','formatBtn','clearBtn'].forEach(id => {
  const b = document.getElementById(id);
  if (b) b.addEventListener('click', () => requestAnimationFrame(autoGrowInput));
});
// Initial sizing on load
requestAnimationFrame(autoGrowInput);

/* ── PWA install ─────────────────────────────────────── */
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstallPrompt=e; installBtn.style.display='block'; });
installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const r = await deferredInstallPrompt.userChoice;
  if (r.outcome==='accepted') installBtn.style.display='none';
  deferredInstallPrompt=null;
});
window.addEventListener('appinstalled', ()=>{ installBtn.style.display='none'; });

/* ── Service worker ──────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('./sw.js').catch(()=>{}); });
}

/* ── Init ────────────────────────────────────────────── */
buildRows();
updateOutputs();
