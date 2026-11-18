'use strict';

/* =========================================================
   Combo Lab — schemi a blocchi per combo Yu-Gi-Oh!
   Dati carte: YGOPRODeck API (https://ygoprodeck.com/api-guide/)
   ========================================================= */

const API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const KEY_DATA = 'combolab.data.v1';
const KEY_SETTINGS = 'combolab.settings.v1';
const NODE_W = 132, NODE_H = 158;
const GAP_X = 44, GAP_Y = 96;

const ACTIONS = [
  'Normal Summon', 'Special Summon', 'Attiva effetto', 'Cerca dal Deck', 'Aggiungi alla mano',
  'Manda al Cimitero', 'Scarta', 'Bandisci', 'Tributa', 'Usa come materiale',
  'Fusion Summon', 'Synchro Summon', 'Xyz Summon', 'Link Summon', 'Ritual Summon', 'Pendulum Summon',
  'Evoca dal Cimitero', 'Recupera dal Cimitero', 'Equipaggia', 'Piazza sul terreno'
];

const FRAME_COLORS = {
  normal: '#d9b45b', effect: '#d8763a', ritual: '#5b82d6', fusion: '#9a62c4',
  synchro: '#e9e9ef', xyz: '#55556a', link: '#2f7bd0', spell: '#1fa58f',
  trap: '#c2408a', token: '#9aa0a6', skill: '#3aa0c8'
};

const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  more: '<circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/>',
  gear: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  layout: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
  swap: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  replace: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.1 9.5 4.25 4.25 0 0 0 7 18z"/>',
  hand: '<rect x="3" y="6" width="10" height="14" rx="1.5"/><path d="M9.5 4.2l8.8 2.4a1.5 1.5 0 0 1 1 1.8L16.6 19"/>',
  play: '<path d="M7 5l12 7-12 7z"/>',
  prev: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  board: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 12h18M9 4v16M15 4v16"/>'
};

const ZONES = [
  ['monsters', 'Mostri sul terreno'], ['spells', 'Magie/Trappole sul terreno'],
  ['hand', 'Mano'], ['gy', 'Cimitero'], ['banished', 'Bandite']
];
const icon = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- Utility ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/* parole di una ricerca, senza accenti né punteggiatura: "Blue eyes" -> ["blue", "eyes"] */
const words = q => norm(q).split(/[^a-z0-9]+/).filter(Boolean);
/* vero se il nome contiene tutte le parole cercate, ignorando trattini, spazi e simboli */
const nameMatches = (name, ws) => { const n = norm(name).replace(/[^a-z0-9]/g, ''); return ws.every(w => n.includes(w)); };
const clone = o => JSON.parse(JSON.stringify(o));
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;
const frameColor = f => FRAME_COLORS[String(f || '').split('_')[0]] || '#5d6475';

function loadJSON(k, def) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; }
}
function saveJSON(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); if (k === KEY_DATA) scheduleSync(); return true; }
  catch { toast('Impossibile salvare: memoria piena?'); return false; }
}

let data = loadJSON(KEY_DATA, { combos: [] });
if (!data || !Array.isArray(data.combos)) data = { combos: [] };
if (!Array.isArray(data.decks)) data.decks = [];
const saveData = () => saveJSON(KEY_DATA, data);
let settings = Object.assign({ lang: 'en' }, loadJSON(KEY_SETTINGS, {}));
// da questa versione le carte sono in inglese (testo originale TCG); l'italiano resta selezionabile
if (settings.langV !== 2) { settings.lang = 'en'; settings.langV = 2; saveJSON(KEY_SETTINGS, settings); }

function persist() {
  if (current) current.updated = Date.now();
  saveJSON(KEY_DATA, data);
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- Bottom sheet ---------- */
let sheetOnClose = null;
function openSheet(html, opts = {}) {
  const s = $('#sheet'), b = $('#backdrop');
  s.className = 'sheet' + (opts.tall ? ' tall' : '');
  s.innerHTML = `<div class="sheet-head"><div class="grab"></div><button class="sheet-x" aria-label="Chiudi">${icon('close')}</button></div>
    <div class="sheet-body">${html}</div>`;
  s.hidden = false; b.hidden = false;
  sheetOnClose = opts.onClose || null;
  requestAnimationFrame(() => requestAnimationFrame(() => { s.classList.add('open'); b.classList.add('open'); }));
  return s;
}
function closeSheet() {
  const s = $('#sheet'), b = $('#backdrop');
  if (s.hidden) return;
  s.classList.remove('open'); b.classList.remove('open');
  const cb = sheetOnClose; sheetOnClose = null;
  setTimeout(() => {
    if (!s.classList.contains('open')) { s.hidden = true; b.hidden = true; s.innerHTML = ''; }
  }, 230);
  if (cb) cb();
}
/* chiude il foglio senza eseguire la callback onClose */
function dismissSheet() { sheetOnClose = null; closeSheet(); }

function askText(title, value, okLabel = 'OK') {
  return new Promise(resolve => {
    openSheet(`<h2>${esc(title)}</h2>
      <input id="askInput" class="field" value="${esc(value)}" autocomplete="off">
      <div class="row-btns"><button class="btn" id="askCancel">Annulla</button><button class="btn primary" id="askOk">${esc(okLabel)}</button></div>`,
      { onClose: () => resolve(null) });
    const i = $('#askInput');
    setTimeout(() => { i.focus(); i.select(); }, 260);
    const ok = () => { const v = i.value.trim(); dismissSheet(); resolve(v || null); };
    $('#askOk').onclick = ok;
    i.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    $('#askCancel').onclick = () => closeSheet();
  });
}

/* ---------- Database carte (YGOPRODeck) ---------- */
function normCard(c) {
  const im = (c.card_images && c.card_images[0]) || {};
  return {
    id: c.id, name: c.name, altName: '',
    type: c.humanReadableCardType || c.type || '', frame: c.frameType || '',
    desc: c.desc || '', atk: c.atk, def: c.def, level: c.level, linkval: c.linkval,
    attribute: c.attribute || '', race: c.race || '',
    img: im.image_url || '', small: im.image_url_small || '', crop: im.image_url_cropped || ''
  };
}

async function fetchCards(q, lang) {
  // spazi e simboli diventano un jolly (%): "blue eyes" trova "Blue-Eyes", "ash blossom joyous" trova "Ash Blossom & Joyous"
  const pattern = q.trim().split(/[\s\-_'’.,:;&!?"()\/]+/).filter(Boolean).join('%');
  let url = `${API}?fname=${encodeURIComponent(pattern)}&num=40&offset=0`;
  if (lang !== 'en') url += `&language=${lang}`;
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  return Array.isArray(j.data) ? j.data : [];
}

/* Cerca sia nella lingua scelta sia in inglese e unisce i risultati per id */
async function searchCards(q) {
  const langs = settings.lang === 'en' ? ['en', 'it'] : [settings.lang, 'en'];
  const res = await Promise.allSettled(langs.map(l => fetchCards(q, l)));
  if (res.every(r => r.status === 'rejected')) throw new Error('offline');
  const map = new Map();
  res.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    for (const raw of r.value) {
      const c = normCard(raw);
      let m = map.get(c.id);
      if (!m) { m = { ...c, names: {} }; map.set(c.id, m); }
      m.names[langs[i]] = c.name;
      if (i === 0) { m.desc = c.desc; m.type = c.type; }
    }
  });
  const pref = langs[0];
  // carte trovate solo con il nome nell'altra lingua: scarico nome ed effetto nella lingua scelta
  const missing = [...map.values()].filter(m => !m.names[pref]).map(m => m.id);
  if (missing.length) {
    try {
      const tr = await fetchLang(missing.slice(0, 50), pref);
      for (const id of missing) {
        const t = tr.get(id), m = map.get(id);
        if (t && m) { m.names[pref] = t.name; m.desc = t.desc; m.type = t.type; }
      }
    } catch { /* resta il testo disponibile */ }
  }
  return [...map.values()].map(m => {
    const name = m.names[pref] || m.names.en || m.name;
    const altName = Object.values(m.names).find(n => n !== name) || '';
    const out = { ...m, name, altName, lang: m.names[pref] ? pref : langs[1] };
    delete out.names;
    return out;
  });
}

/* dati delle carte per id in UNA lingua precisa (senza ripiego) */
async function fetchLang(ids, lang) {
  const map = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    let url = `${API}?id=${ids.slice(i, i + 50).join(',')}`;
    if (lang !== 'en') url += `&language=${lang}`;
    const r = await fetch(url);
    const j = await r.json().catch(() => ({}));
    for (const raw of (j.data || [])) {
      const c = normCard(raw);
      c.lang = lang;
      map.set(raw.id, c);
      for (const im of raw.card_images || []) map.set(im.id, c);
    }
  }
  return map;
}

/* porta nome ed effetto delle carte già salvate nella lingua scelta (dove la traduzione esiste).
   Le carte senza traduzione vengono ricontrollate ogni 7 giorni. */
let refreshingTexts = false;
async function refreshCardTexts() {
  // con l'account: solo dopo aver ricevuto i dati aggiornati dagli altri dispositivi
  if (refreshingTexts || !navigator.onLine || (syncMeta.uid && !cloudReady)) return;
  refreshingTexts = true;
  try {
    const lang = settings.lang;
    const groups = new Map();
    const add = (card, owner) => {
      if (!card || card.id == null || card.lang === lang) return;
      if (card.lang === lang + ':none' && Date.now() - (card.langChecked || 0) < 7 * 864e5) return;
      if (!groups.has(card.id)) groups.set(card.id, []);
      groups.get(card.id).push({ card, owner });
    };
    for (const c of data.combos) {
      c.nodes.forEach(n => add(n.card, c));
      if (c.board) ZONES.forEach(([z]) => (c.board[z] || []).forEach(it => add(it.card, c)));
    }
    for (const d of data.decks) DECK_SECTIONS.forEach(([s]) => (d[s] || []).forEach(e => add(e.card, d)));
    if (!groups.size) return;
    const tr = await fetchLang([...groups.keys()], lang);
    const touched = new Set();
    for (const [id, list] of groups) {
      const t = tr.get(id);
      for (const { card, owner } of list) {
        if (t) {
          if (card.name !== t.name) card.altName = card.name;   // il vecchio nome resta come secondario
          if (card.altName === t.name) card.altName = '';
          card.name = t.name; card.desc = t.desc; card.type = t.type; card.lang = lang;
          delete card.langChecked;
        } else {
          card.lang = lang + ':none';
          card.langChecked = Date.now();
        }
        touched.add(owner);
      }
    }
    const now = Date.now();
    touched.forEach(o => { o.updated = now; });
    saveData();
    if (current) renderGraph();
    if (currentDeck) renderDeck();
    if (!$('#home').hidden) renderHome();
  } catch { /* offline o errore: riprova al prossimo avvio */ }
  finally { refreshingTexts = false; }
}

/* salva le immagini nella cache (service worker) per l'uso offline */
function precache(card) {
  [card.crop, card.img, card.small].forEach(u => { if (u) fetch(u, { mode: 'no-cors' }).catch(() => {}); });
}

/* opts: deck (mostra prima le carte di quel deck; default = deck della combo aperta),
         keepOpen (resta aperto dopo la scelta), badge(card) -> numero copie, hint */
function openSearch(title, onPick, opts = {}) {
  const deck = 'deck' in opts ? opts.deck : (current ? deckById(current.deckId) : null);
  const deckCards = deck ? uniqueDeckCards(deck) : [];
  const HINT_DB = 'Scrivi almeno 3 lettere del nome, in italiano o in inglese.';
  openSheet(`<h2>${esc(title)}</h2>
    <label class="searchbox">${icon('search')}<input id="cardQ" type="search" placeholder="Nome carta (IT o EN)" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"></label>
    ${opts.hint ? `<p class="muted small" style="margin:8px 0 0">${esc(opts.hint)}</p>` : ''}
    <div id="cardResults" class="results"></div>`, { tall: true });
  const q = $('#cardQ'), out = $('#cardResults');
  let timer, token = 0, local = [], remote = [], status = '', shown = [];

  const cardBtn = (c, i) => {
    const n = opts.badge ? opts.badge(c) : 0;
    return `<button class="result" data-i="${i}"${hc(c)}>${n ? `<em class="qty">${n}</em>` : ''}${banBadge(c.id)}<img loading="lazy" src="${esc(c.small)}" alt=""><span>${esc(c.name)}</span>${c.altName ? `<small>${esc(c.altName)}</small>` : ''}</button>`;
  };
  const draw = () => {
    const ids = new Set(local.map(c => c.id));
    const rem = remote.filter(c => !ids.has(c.id));
    shown = [...local, ...rem];
    let h = '';
    if (local.length) h += `<p class="res-h">Dal deck “${esc(deck.name)}”</p>` + local.map((c, i) => cardBtn(c, i)).join('');
    if (local.length && rem.length) h += '<p class="res-h">Database</p>';
    h += rem.map((c, i) => cardBtn(c, local.length + i)).join('');
    if (status) h += `<p class="muted small">${esc(status)}</p>`;
    out.innerHTML = h;
  };
  const filterLocal = v => {
    const nq = norm(v);
    const ws = words(v);
    return nq ? deckCards.filter(c => nameMatches(c.name, ws) || nameMatches(c.altName, ws)) : deckCards.slice();
  };

  local = filterLocal('');
  status = deckCards.length ? 'Oppure scrivi per cercare nel database.' : HINT_DB;
  draw();

  q.addEventListener('input', () => {
    clearTimeout(timer);
    const v = q.value.trim();
    local = filterLocal(v);
    remote = [];
    if (v.length < 3) {
      token++;
      status = v.length ? 'Scrivi almeno 3 lettere per cercare nel database.' : (deckCards.length ? 'Oppure scrivi per cercare nel database.' : HINT_DB);
      draw();
      return;
    }
    status = 'Cerco…';
    draw();
    timer = setTimeout(async () => {
      const my = ++token;
      try {
        const r = await searchCards(v);
        if (my !== token) return;
        remote = r;
        status = r.length || local.length ? '' : 'Nessuna carta trovata.';
      } catch {
        if (my !== token) return;
        status = 'Ricerca non disponibile. Sei offline?';
      }
      draw();
    }, 380);
  });
  q.addEventListener('keydown', e => { if (e.key === 'Enter') q.blur(); });
  if (opts.initialQuery) { q.value = opts.initialQuery; q.dispatchEvent(new Event('input')); }
  out.addEventListener('click', e => {
    const b = e.target.closest('.result');
    if (!b) return;
    onPick(shown[+b.dataset.i]);
    if (opts.keepOpen) draw();
  });
  if (!isTouch() && !opts.initialQuery) setTimeout(() => q.focus(), 260);
}

/* ---------- Consulta una carta (solo lettura) ---------- */
const banLineHTML = id => {
  const lim = banLimit(id);
  return lim < 3 ? `<p class="banline b${lim}">${banBadge(id)} ${BAN_LABEL[lim]} nella banlist TCG — ${lim === 0 ? 'non utilizzabile' : `massimo ${lim} ${lim === 1 ? 'copia' : 'copie'}`}</p>` : '';
};

function openCardLookup(query = '') {
  openSearch('Cerca una carta', card => {
    const q = ($('#cardQ') || {}).value || query;
    openSheet(`${cardHeadHTML(card)}${banLineHTML(card.id)}
      ${card.desc ? `<div class="desc">${esc(card.desc)}</div>` : ''}
      <div class="row-btns"><button class="btn" id="ciBack">${icon('back')} Indietro</button></div>`);
    $('#ciBack').onclick = () => openCardLookup(q);
  }, { deck: null, initialQuery: query, hint: "Tocca una carta per leggerne l'effetto." });
}

/* ---------- Home ---------- */
let starterFilter = null;

function rootsOf(c) {
  const inc = new Set(c.edges.map(e => e.to));
  return c.nodes.filter(n => !inc.has(n.id)).sort((a, b) => a.y - b.y || a.x - b.x);
}

let homeTab = settings.tab === 'decks' ? 'decks' : 'combos';

function renderHome() {
  $('#paneCombos').hidden = homeTab !== 'combos';
  $('#paneDecks').hidden = homeTab !== 'decks';
  [...$('#homeTabs').children].forEach(b => b.classList.toggle('on', b.dataset.tab === homeTab));
  $('#fabLabel').textContent = homeTab === 'decks' ? 'Nuovo deck' : 'Nuova combo';
  renderCombos();
  renderDecks();
}

function renderCombos() {
  const q = norm($('#homeSearch').value.trim());
  const ws = words(q);
  const starterMap = new Map();
  for (const c of data.combos) {
    for (const n of rootsOf(c)) {
      const k = n.card.id;
      if (!starterMap.has(k)) starterMap.set(k, { card: n.card, count: 0 });
      starterMap.get(k).count++;
    }
  }
  if (starterFilter != null && !starterMap.has(starterFilter)) starterFilter = null;

  $('#startersWrap').hidden = starterMap.size === 0;
  $('#starters').innerHTML = [...starterMap.values()]
    .sort((a, b) => b.count - a.count || a.card.name.localeCompare(b.card.name))
    .map(s => `<button class="starter${s.card.id === starterFilter ? ' active' : ''}" data-card="${s.card.id}">
        <img src="${esc(s.card.crop)}" alt="" loading="lazy"><span>${esc(s.card.name)}</span></button>`).join('');

  const list = data.combos
    .filter(c => starterFilter == null || rootsOf(c).some(n => n.card.id === starterFilter))
    .filter(c => !ws.length || nameMatches(c.name, ws) || c.nodes.some(n => nameMatches(n.card.name, ws) || nameMatches(n.card.altName, ws)))
    .sort((a, b) => (b.updated || 0) - (a.updated || 0));

  const el = $('#comboList');
  if (!data.combos.length) {
    el.innerHTML = `<div class="empty"><b>Nessuna combo ancora</b>Tocca <b style="display:inline;color:var(--accent);font-size:inherit">Nuova combo</b> e scegli la carta di partenza.</div>`;
    return;
  }
  if (!list.length) { el.innerHTML = '<div class="empty">Nessuna combo trovata.</div>'; return; }
  el.innerHTML = list.map(c => {
    const roots = rootsOf(c).slice(0, 3);
    const thumbs = roots.length ? roots.map(n => `<img src="${esc(n.card.crop)}" alt="" loading="lazy">`).join('') : '<div class="ph"></div>';
    const date = c.updated ? new Date(c.updated).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '';
    const deck = deckById(c.deckId);
    return `<div class="combo-item" data-id="${c.id}">
      <div class="thumbs">${thumbs}</div>
      <div class="ci-text"><b>${esc(c.name)}</b><small>${c.nodes.length} carte · ${c.edges.length} passi${date ? ' · ' + date : ''}</small>${deck ? `<small class="ci-deck">Deck: ${esc(deck.name)}</small>` : ''}</div>
      <button class="icon-btn" data-more aria-label="Opzioni">${icon('more')}</button>
    </div>`;
  }).join('');
}

async function newCombo(deckId) {
  const name = await askText('Nuova combo', `Combo ${data.combos.length + 1}`, 'Crea');
  if (!name) return;
  if (deckId === undefined && data.decks.length) deckId = await chooseDeck(null);
  const c = { id: uid(), name, nodes: [], edges: [], deckId: deckId || null, created: Date.now(), updated: Date.now() };
  data.combos.push(c);
  persist();
  openEditor(c.id);
  openSearch('Carta di partenza', card => {
    dismissSheet();
    const n = addNode(card, 0, 0);
    sel = n.id;
    renderGraph(); renderBar(); fitView();
  });
}

function comboMenu(id) {
  const c = data.combos.find(x => x.id === id);
  if (!c) return;
  openSheet(`<h2>${esc(c.name)}</h2><div class="menu">
    <button data-a="open">${icon('edit')} Apri</button>
    <button data-a="rename">${icon('edit')} Rinomina</button>
    <button data-a="dup">${icon('copy')} Duplica</button>
    <button data-a="export">${icon('download')} Esporta</button>
    <button data-a="del" class="danger">${icon('trash')} Elimina</button></div>`);
  $('#sheet .menu').onclick = async e => {
    const a = e.target.closest('button')?.dataset.a;
    if (!a) return;
    if (a === 'open') { dismissSheet(); openEditor(id); }
    else if (a === 'rename') {
      const v = await askText('Rinomina combo', c.name, 'Salva');
      if (v) { c.name = v; c.updated = Date.now(); saveJSON(KEY_DATA, data); renderHome(); }
    }
    else if (a === 'dup') { dismissSheet(); duplicateCombo(c); renderHome(); toast('Combo duplicata'); }
    else if (a === 'export') { dismissSheet(); exportCombos([c], fileName(c.name)); }
    else if (a === 'del') { dismissSheet(); deleteCombo(c); }
  };
}

function duplicateCombo(c) {
  const d = clone(c);
  d.id = uid(); d.name = c.name + ' (copia)'; d.created = d.updated = Date.now();
  data.combos.push(d);
  saveJSON(KEY_DATA, data);
  return d;
}

function deleteCombo(c) {
  if (!confirm(`Eliminare la combo "${c.name}"?`)) return false;
  data.combos = data.combos.filter(x => x.id !== c.id);
  markDeleted('combos', c.id);
  saveJSON(KEY_DATA, data);
  renderHome();
  toast('Combo eliminata');
  return true;
}

/* ---------- Backup ---------- */
const fileBase = s => String(s).replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'combo';
const fileName = s => fileBase(s) + '.json';

function exportCombos(list, name) { exportData({ combos: list }, name); }

function exportData(obj, name) {
  const payload = { app: 'combolab', version: 2, exported: new Date().toISOString(), combos: obj.combos || [], decks: obj.decks || [] };
  shareFile(JSON.stringify(payload, null, 1), name, 'application/json');
}

async function shareFile(content, name, type) {
  const file = new File([content], name, { type });
  if (isTouch() && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}

/* Importa un backup .json (combo e/o deck) oppure un deck .ydk */
function importFile() {
  const inp = document.createElement('input');
  inp.type = 'file';   // niente filtro: su iPhone i .ydk altrimenti non sono selezionabili
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    const text = await f.text();
    if (/\.ydk$/i.test(f.name) || (!/^\s*[[{]/.test(text) && /^\s*[#!](main|extra|side|created)/im.test(text))) {
      await importYdk(text, f.name.replace(/\.[^.]+$/, ''));
      return;
    }
    try {
      const j = JSON.parse(text);
      const combos = Array.isArray(j) ? j : Array.isArray(j.combos) ? j.combos : (j.nodes ? [j] : []);
      const decks = Array.isArray(j.decks) ? j.decks : [];
      const vc = combos.filter(c => c && Array.isArray(c.nodes) && Array.isArray(c.edges));
      const vd = decks.filter(d => d && ['main', 'extra', 'side'].every(s => Array.isArray(d[s])));
      if (!vc.length && !vd.length) throw new Error('vuoto');
      const upsert = (arr, item, defName) => {
        if (!item.id) item.id = uid();
        if (!item.name) item.name = defName;
        item.updated = Date.now();
        const i = arr.findIndex(x => x.id === item.id);
        if (i >= 0) arr[i] = item; else arr.push(item);
      };
      vc.forEach(c => upsert(data.combos, c, 'Combo importata'));
      vd.forEach(d => upsert(data.decks, d, 'Deck importato'));
      saveData();
      renderHome();
      dismissSheet();
      toast([vc.length && `${vc.length} combo`, vd.length && `${vd.length} deck`].filter(Boolean).join(' e ') + ' importati');
    } catch {
      toast('File non valido');
    }
  };
  inp.click();
}

function openSettings() {
  openSheet(`<h2>Impostazioni</h2>
    <label class="lbl">Account e sincronizzazione</label>
    <button class="btn" id="acctBtn" style="width:100%;justify-content:flex-start">${icon('cloud')} ${cloudUser ? esc(cloudUser.email) : 'Accedi per sincronizzare iPhone e PC'}</button>
    <label class="lbl">Lingua delle carte</label>
    <div class="seg" id="langSeg">
      <button data-lang="en" class="${settings.lang === 'en' ? 'on' : ''}">English</button>
      <button data-lang="it" class="${settings.lang === 'it' ? 'on' : ''}">Italiano</button>
    </div>
    <p class="muted small">Consigliato: English (testo originale TCG, disponibile per tutte le carte). La ricerca trova le carte sia col nome inglese sia con quello italiano. Cambiando lingua, anche le carte già salvate vengono aggiornate (le carte senza traduzione italiana restano in inglese).</p>
    <label class="lbl">Backup</label>
    <div class="row-btns" style="margin-top:4px">
      <button class="btn" id="expAll">${icon('download')} Esporta tutto</button>
      <button class="btn" id="impBtn">${icon('upload')} Importa</button>
    </div>
    <p class="muted small">Le combo sono salvate solo su questo dispositivo. Fai un backup ogni tanto: se elimini l'app dalla schermata Home, i dati vengono cancellati.</p>
    <label class="lbl">Banlist TCG</label>
    <div class="custom-row">
      <p class="muted small" id="banInfo" style="flex:1;margin:0">${banlist ? `Aggiornata il ${new Date(banlist.t).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Non ancora scaricata'}</p>
      <button class="btn" id="banRefresh" style="flex:none;min-width:0">${icon('replace')} Aggiorna</button>
    </div>
    <p class="muted small">Viene aggiornata da sola ogni 3 giorni. Limita le copie delle carte Proibite (0), Limitate (1) e Semi-Limitate (2).</p>
    <p class="muted small">Dati e immagini delle carte: YGOPRODeck. App non ufficiale, per uso personale.</p>`);
  $('#acctBtn').onclick = () => openAccount();
  $('#banRefresh').onclick = async () => {
    $('#banInfo').textContent = 'Scarico…';
    const ok = await refreshBanlist(true);
    $('#banInfo').textContent = ok
      ? `Aggiornata il ${new Date(banlist.t).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : 'Impossibile aggiornare: sei offline?';
  };
  $('#langSeg').onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (settings.lang === b.dataset.lang) return;
    settings.lang = b.dataset.lang;
    saveJSON(KEY_SETTINGS, settings);
    toast('Aggiorno i testi delle carte…');
    refreshCardTexts();
    [...$('#langSeg').children].forEach(x => x.classList.toggle('on', x === b));
  };
  $('#expAll').onclick = () => {
    if (!data.combos.length && !data.decks.length) { toast('Niente da esportare'); return; }
    exportData({ combos: data.combos, decks: data.decks }, `combolab-backup-${new Date().toISOString().slice(0, 10)}.json`);
  };
  $('#impBtn').onclick = importFile;
}

/* ---------- Editor ---------- */
let current = null, sel = null, linkFrom = null;
let view = { x: 0, y: 0, k: 1 };
let play = null;   // stato della modalità "Riproduci"

function resetPlayUI() {
  play = null;
  $('#canvas').classList.remove('playing', 'play-end');
  $('#playPanel').hidden = true;
}

const nodeById = id => current.nodes.find(n => n.id === id);

function openEditor(id, push = true) {
  current = data.combos.find(c => c.id === id);
  if (!current) return;
  sel = null; linkFrom = null;
  resetPlayUI();
  $('#linkBanner').hidden = true;
  $('#home').hidden = true;
  $('#deckView').hidden = true;
  $('#editor').hidden = false;
  $('#comboName').value = current.name;
  if (push) history.pushState({ combo: id }, '');
  renderGraph(); renderBar();
  requestAnimationFrame(fitView);
}

function closeEditor() {
  if (!current) return;
  persist();
  current = null; sel = null; linkFrom = null;
  resetPlayUI();
  dismissSheet();
  $('#editor').hidden = true;
  $('#home').hidden = false;
  renderHome();
}

function slimCard(c) {
  const { id, name, altName, type, frame, desc, atk, def, level, linkval, attribute, race, img, small, crop, lang } = c;
  return { id, name, altName, type, frame, desc, atk, def, level, linkval, attribute, race, img, small, crop, lang: lang || settings.lang };
}

function addNode(card, x, y) {
  const n = { id: uid(), card: slimCard(card), x: Math.round(x), y: Math.round(y), note: '' };
  current.nodes.push(n);
  precache(card);
  persist();
  return n;
}

function addEdge(from, to, action, note, meta = {}) {
  const step = current.edges.reduce((m, e) => Math.max(m, e.step || 0), 0) + 1;
  const e = { id: uid(), from, to, action: action || '', note: note || '', step };
  if (meta.kind === 'alt') { e.kind = 'alt'; e.cond = meta.cond || ''; }
  current.edges.push(e);
  persist();
  renderEdges();
}

function deleteNode(id) {
  const n = nodeById(id);
  if (!n || !confirm(`Togliere "${n.card.name}" dalla combo?`)) return false;
  current.nodes = current.nodes.filter(x => x.id !== id);
  current.edges = current.edges.filter(e => e.from !== id && e.to !== id);
  if (sel === id) sel = null;
  persist();
  renderGraph(); renderBar();
  return true;
}

function overlaps(x, y, ignoreId) {
  return current.nodes.some(n => n.id !== ignoreId && Math.abs(n.x - x) < NODE_W + 12 && Math.abs(n.y - y) < NODE_H + 12);
}

/* posizione libera sotto la carta di origine (accanto agli eventuali "fratelli") */
function freeSpotBelow(src) {
  const y = src.y + NODE_H + GAP_Y;
  for (let i = 0; i < 40; i++) {
    const k = i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2);
    const x = src.x + k * (NODE_W + GAP_X);
    if (!overlaps(x, y)) return { x, y };
  }
  return { x: src.x, y: y + NODE_H + GAP_Y };
}

function freeSpotNear(x, y) {
  for (let i = 0; i < 60; i++) {
    const cx = x + (i % 6) * (NODE_W + GAP_X) * (i % 2 ? 1 : -1) * 0.5;
    const cy = y + Math.floor(i / 6) * (NODE_H + 30);
    if (!overlaps(cx, cy)) return { x: cx, y: cy };
  }
  return { x, y };
}

/* ---------- Rendering grafo ---------- */
function nodeHTML(n) {
  let cls = 'node' + (n.id === sel ? ' sel' : '') + (n.id === linkFrom ? ' linkfrom' : '');
  if (play) cls += play.onNodes.has(n.id) ? ' pl-on' : play.doneNodes.has(n.id) ? ' pl-done' : ' pl-off';
  return `<div class="${cls}" data-id="${n.id}"${hc(n.card)} style="left:${n.x}px;top:${n.y}px;--fc:${frameColor(n.card.frame)}">
    <div class="art"><img src="${esc(n.card.crop || n.card.small)}" data-fb="${esc(n.card.small)}" alt="" draggable="false"></div>
    <div class="nname">${esc(n.card.name)}</div>${n.note ? `<div class="nnote">${esc(n.note)}</div>` : ''}</div>`;
}

function renderGraph() {
  if (!current) return;
  $('#nodes').innerHTML = current.nodes.map(nodeHTML).join('');
  $('#emptyHint').hidden = current.nodes.length > 0;
  renderEdges();
}

function updateSelClasses() {
  document.querySelectorAll('#nodes .node').forEach(el => {
    el.classList.toggle('sel', el.dataset.id === sel);
    el.classList.toggle('linkfrom', el.dataset.id === linkFrom);
  });
}

const center = n => ({ x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 });
const OPP = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const DIRS = { top: { x: 0, y: -1 }, bottom: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

/* lato della carta di origine da cui parte la freccia */
function edgeSide(a, b) {
  const ac = center(a), bc = center(b), dx = bc.x - ac.x, dy = bc.y - ac.y;
  if (Math.abs(dy) / NODE_H >= Math.abs(dx) / NODE_W && Math.abs(dy) > NODE_H * 0.5) return dy > 0 ? 'bottom' : 'top';
  return dx > 0 ? 'right' : 'left';
}

function anchor(n, side, off) {
  const c = center(n);
  if (side === 'top') return { x: c.x + off, y: n.y };
  if (side === 'bottom') return { x: c.x + off, y: n.y + NODE_H };
  if (side === 'left') return { x: n.x, y: c.y + off };
  return { x: n.x + NODE_W, y: c.y + off };
}

function edgeGeom(a, b, sa, offA, offB, t) {
  const sb = OPP[sa];
  const p0 = anchor(a, sa, offA), p3 = anchor(b, sb, offB);
  const da = DIRS[sa], db = DIRS[sb];
  const L = Math.max(36, Math.hypot(p3.x - p0.x, p3.y - p0.y) * 0.4);
  const p1 = { x: p0.x + da.x * L, y: p0.y + da.y * L };
  const p2 = { x: p3.x + db.x * L, y: p3.y + db.y * L };
  const u = 1 - t;
  const m = {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
  };
  return { p0, p1, p2, p3, m };
}

function renderEdges() {
  if (!current) return;
  const byId = new Map(current.nodes.map(n => [n.id, n]));
  const items = current.edges
    .map(e => ({ e, a: byId.get(e.from), b: byId.get(e.to) }))
    .filter(it => it.a && it.b && it.a !== it.b);

  // distribuisce i punti di attacco quando più frecce escono/entrano dallo stesso lato
  const groups = new Map();
  const push = (node, side, it, key, other) => {
    const k = node.id + side;
    if (!groups.has(k)) groups.set(k, { side, list: [] });
    groups.get(k).list.push({ it, key, coord: (side === 'top' || side === 'bottom') ? center(other).x : center(other).y });
  };
  for (const it of items) {
    it.sa = edgeSide(it.a, it.b);
    push(it.a, it.sa, it, 'offA', it.b);
    push(it.b, OPP[it.sa], it, 'offB', it.a);
  }
  for (const { side, list } of groups.values()) {
    list.sort((p, q) => p.coord - q.coord);
    const span = ((side === 'top' || side === 'bottom') ? NODE_W : NODE_H) * 0.55;
    list.forEach((p, i) => { p.it[p.key] = list.length > 1 ? (i / (list.length - 1) - 0.5) * span : 0; });
  }
  const outN = new Map(), inN = new Map();
  for (const it of items) {
    outN.set(it.a.id, (outN.get(it.a.id) || 0) + 1);
    inN.set(it.b.id, (inN.get(it.b.id) || 0) + 1);
  }

  let paths = '', labels = '';
  for (const it of items) {
    const { e, a, b } = it;
    // l'etichetta va dove le frecce sono più distanti tra loro
    const t = 0.5 + (outN.get(a.id) > 1 ? 0.17 : 0) - (inN.get(b.id) > 1 ? 0.17 : 0);
    const g = edgeGeom(a, b, it.sa, it.offA || 0, it.offB || 0, t);
    const alt = e.kind === 'alt';
    const st = play ? (play.onEdge === e.id ? ' on' : play.doneEdges.has(e.id) ? ' done' : ' off') : '';
    const marker = st === ' on' ? 'arrowOn' : alt ? 'arrowAlt' : 'arrow';
    paths += `<path class="${alt ? 'alt' : ''}${st}" d="M${g.p0.x} ${g.p0.y} C${g.p1.x} ${g.p1.y} ${g.p2.x} ${g.p2.y} ${g.p3.x} ${g.p3.y}" marker-end="url(#${marker})"/>`;
    const cond = alt && e.cond ? `<small class="cond">se ${esc(e.cond)}: </small>` : '';
    const text = e.action || e.note || cond
      ? `<span class="t">${cond}${esc(e.action)}${e.note ? `<small>${e.action ? ' · ' : ''}${esc(e.note)}</small>` : ''}</span>` : '';
    labels += `<div class="elabel${text ? '' : ' bare'}${alt ? ' alt' : ''}${st}" data-id="${e.id}" style="left:${g.m.x}px;top:${g.m.y}px"><span class="step">${alt ? 'B' : ''}${e.step}</span>${text}</div>`;
  }
  $('#edgePaths').innerHTML = paths;
  $('#labels').innerHTML = labels;
}

function applyView() {
  $('#world').style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.k})`;
  const cv = $('#canvas');
  cv.style.backgroundSize = `${24 * view.k}px ${24 * view.k}px`;
  cv.style.backgroundPosition = `${view.x}px ${view.y}px`;
}

function fitView() {
  if (!current) return;
  const cv = $('#canvas').getBoundingClientRect();
  const ns = current.nodes;
  if (!ns.length) { view = { x: cv.width / 2 - NODE_W / 2, y: 60, k: 1 }; applyView(); return; }
  const minX = Math.min(...ns.map(n => n.x)), minY = Math.min(...ns.map(n => n.y));
  const maxX = Math.max(...ns.map(n => n.x + NODE_W)), maxY = Math.max(...ns.map(n => n.y + NODE_H));
  const w = maxX - minX, h = maxY - minY, pad = 32;
  const k = clamp(Math.min((cv.width - pad * 2) / w, (cv.height - pad * 2) / h), 0.3, 1.1);
  view = { k, x: (cv.width - w * k) / 2 - minX * k, y: (cv.height - h * k) / 2 - minY * k };
  applyView();
}

function ensureVisible(n) {
  const cv = $('#canvas').getBoundingClientRect();
  const sx = n.x * view.k + view.x, sy = n.y * view.k + view.y;
  const w = NODE_W * view.k, h = NODE_H * view.k;
  if (sx < 10 || sy < 10 || sx + w > cv.width - 10 || sy + h > cv.height - 10) {
    view.x = cv.width / 2 - (n.x + NODE_W / 2) * view.k;
    view.y = cv.height / 2 - (n.y + NODE_H / 2) * view.k;
    applyView();
  }
}

function zoomAt(p, k) {
  k = clamp(k, 0.25, 2.5);
  const wx = (p.x - view.x) / view.k, wy = (p.y - view.y) / view.k;
  view.k = k; view.x = p.x - wx * k; view.y = p.y - wy * k;
  applyView();
}

/* ---------- Barra inferiore ---------- */
function renderBar() {
  const b = $('#bar');
  const btn = (ic, label, act, cls = '') => `<button class="${cls}" data-act="${act}">${icon(ic)}<span>${label}</span></button>`;
  if (play) {
    const atEnd = play.i >= play.steps.length;
    b.innerHTML = btn('prev', 'Indietro', 'pprev') + btn('close', 'Esci', 'pexit') +
      (atEnd ? btn('play', 'Da capo', 'prestart', 'primary') : btn('next', 'Avanti', 'pnext', 'primary'));
  } else if (sel && !linkFrom) {
    b.innerHTML = btn('next', 'Prossima', 'next', 'primary') + btn('link', 'Collega', 'link') +
      btn('info', 'Dettagli', 'info') + btn('trash', 'Elimina', 'del', 'danger');
  } else {
    b.innerHTML = btn('plus', 'Carta', 'add', 'primary') + btn('play', 'Riproduci', 'play') + btn('board', 'Board', 'board') +
      btn('layout', 'Ordina', 'layout') + btn('fit', 'Adatta', 'fit');
  }
}

function onBar(act) {
  if (act === 'pnext') playGo(play.i + 1);
  else if (act === 'pprev') playGo(play.i - 1);
  else if (act === 'prestart') playGo(0);
  else if (act === 'pexit') stopPlay();
  else if (act === 'play') startPlay();
  else if (act === 'board') openBoard();
  else if (act === 'add') addFreeCard();
  else if (act === 'layout') { if (current.nodes.length) { autoLayout(); toast('Schema riordinato'); } }
  else if (act === 'fit') fitView();
  else if (act === 'next') addNext();
  else if (act === 'link') startLink();
  else if (act === 'info') openNodeSheet(sel);
  else if (act === 'del') deleteNode(sel);
}

function addFreeCard() {
  openSearch(current.nodes.length ? 'Aggiungi carta' : 'Carta di partenza', card => {
    dismissSheet();
    const cv = $('#canvas').getBoundingClientRect();
    const cx = (cv.width / 2 - view.x) / view.k - NODE_W / 2;
    const cy = (cv.height / 2 - view.y) / view.k - NODE_H / 2;
    const p = current.nodes.length ? freeSpotNear(cx, cy) : { x: 0, y: 0 };
    const n = addNode(card, p.x, p.y);
    sel = n.id;
    renderGraph(); renderBar();
    if (current.nodes.length === 1) fitView(); else ensureVisible(n);
  });
}

function addNext() {
  const src = nodeById(sel);
  if (!src) return;
  openSearch('Prossima carta', card => {
    const p = freeSpotBelow(src);
    const n = addNode(card, p.x, p.y);
    sel = n.id;
    renderGraph(); renderBar(); ensureVisible(n);
    pickAction(src.id, n.id, (action, note, meta) => {
      if (action === null) {             // annullato: togli la carta appena aggiunta
        current.nodes = current.nodes.filter(x => x.id !== n.id);
        sel = src.id;
        persist(); renderGraph(); renderBar();
        return;
      }
      addEdge(src.id, n.id, action, note, meta);
    });
  });
}

function startLink() {
  linkFrom = sel;
  $('#linkBanner').hidden = false;
  updateSelClasses(); renderBar();
}
function cancelLink() {
  linkFrom = null;
  $('#linkBanner').hidden = true;
  updateSelClasses(); renderBar();
}

const pairHTML = (a, b) => `<div class="pair">
  <div class="pc"><img src="${esc(a.card.crop)}" alt=""><span>${esc(a.card.name)}</span></div>${icon('next')}
  <div class="pc"><img src="${esc(b.card.crop)}" alt=""><span>${esc(b.card.name)}</span></div></div>`;

const kindHTML = (kind, cond) => `
  <div class="seg kind" id="kSeg" style="margin-top:10px">
    <button data-k="main" class="${kind !== 'alt' ? 'on' : ''}">Linea principale</button>
    <button data-k="alt" class="${kind === 'alt' ? 'on alt' : ''}">Piano B</button>
  </div>
  <input id="kCond" class="field" placeholder="Condizione (es. l'avversario usa Ash Blossom)" value="${esc(cond)}" autocomplete="off"${kind === 'alt' ? '' : ' hidden'}>`;

function wireKind() {
  let kind = $('#kSeg .on').dataset.k;
  $('#kSeg').onclick = ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    kind = b.dataset.k;
    [...$('#kSeg').children].forEach(x => { x.classList.toggle('on', x === b); x.classList.toggle('alt', x === b && kind === 'alt'); });
    $('#kCond').hidden = kind !== 'alt';
    if (kind === 'alt' && !isTouch()) $('#kCond').focus();
  };
  return () => ({ kind, cond: $('#kCond').value.trim() });
}

/* scelta dell'azione per una nuova freccia. done(action|null, note, {kind, cond}) */
function pickAction(fromId, toId, done) {
  const a = nodeById(fromId), b = nodeById(toId);
  let finished = false;
  const finish = (act, note, meta = {}) => { if (!finished) { finished = true; done(act, note, meta); } };
  openSheet(`<h2>Cosa succede?</h2>${pairHTML(a, b)}${kindHTML('main', '')}
    <input id="pNote" class="field" placeholder="Nota facoltativa (es. dalla mano, OPT)" autocomplete="off">
    <div class="chips" id="pChips">${ACTIONS.map(x => `<button class="chip" data-a="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    <div class="custom-row"><input id="pCustom" class="field" placeholder="Altra azione…" autocomplete="off"><button class="btn primary" id="pUse">OK</button></div>
    <div class="row-btns"><button class="btn" id="pSkip">Senza azione</button><button class="btn" id="pCancel">Annulla</button></div>`,
    { onClose: () => finish('', '') });
  const getKind = wireKind();
  const end = act => { const note = $('#pNote').value.trim(), meta = getKind(); dismissSheet(); finish(act, note, meta); };
  $('#pChips').onclick = e => { const c = e.target.closest('.chip'); if (c) end(c.dataset.a); };
  $('#pUse').onclick = () => end($('#pCustom').value.trim());
  $('#pCustom').addEventListener('keydown', e => { if (e.key === 'Enter') end($('#pCustom').value.trim()); });
  $('#pSkip').onclick = () => end('');
  $('#pCancel').onclick = () => { dismissSheet(); finish(null, ''); };
}

function editEdge(id) {
  const e = current.edges.find(x => x.id === id);
  if (!e) return;
  const a = nodeById(e.from), b = nodeById(e.to);
  let chip = ACTIONS.includes(e.action) ? e.action : '';
  openSheet(`<h2>Passo ${e.kind === 'alt' ? 'B' : ''}${e.step}</h2>${pairHTML(a, b)}${kindHTML(e.kind, e.cond || '')}
    <label class="lbl">Azione</label>
    <div class="chips" id="eChips">${ACTIONS.map(x => `<button class="chip${x === chip ? ' on' : ''}" data-a="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    <input id="eCustom" class="field" placeholder="Azione personalizzata" value="${chip ? '' : esc(e.action)}" autocomplete="off">
    <label class="lbl">Nota</label>
    <input id="eNote" class="field" value="${esc(e.note)}" placeholder="es. OPT, costo, condizione…" autocomplete="off">
    <label class="lbl">Numero del passo</label>
    <input id="eStep" class="field" type="number" inputmode="numeric" min="1" value="${e.step}" style="max-width:120px">
    <div class="row-btns"><button class="btn" id="eSwap">${icon('swap')} Inverti</button><button class="btn danger" id="eDel">${icon('trash')} Elimina</button></div>
    <div class="row-btns"><button class="btn primary" id="eSave">Salva</button></div>`);
  $('#eChips').onclick = ev => {
    const c = ev.target.closest('.chip');
    if (!c) return;
    chip = c.classList.contains('on') ? '' : c.dataset.a;
    [...$('#eChips').children].forEach(x => x.classList.toggle('on', x.dataset.a === chip));
    $('#eCustom').value = '';
  };
  $('#eCustom').addEventListener('input', () => {
    if ($('#eCustom').value) { chip = ''; [...$('#eChips').children].forEach(x => x.classList.remove('on')); }
  });
  const getKind = wireKind();
  $('#eSave').onclick = () => {
    const k = getKind();
    if (k.kind === 'alt') { e.kind = 'alt'; e.cond = k.cond; } else { delete e.kind; delete e.cond; }
    e.action = $('#eCustom').value.trim() || chip;
    e.note = $('#eNote').value.trim();
    const s = parseInt($('#eStep').value, 10);
    if (s > 0) e.step = s;
    persist(); renderEdges(); dismissSheet();
  };
  $('#eSwap').onclick = () => { [e.from, e.to] = [e.to, e.from]; persist(); renderEdges(); dismissSheet(); };
  $('#eDel').onclick = () => {
    current.edges = current.edges.filter(x => x.id !== id);
    persist(); renderEdges(); dismissSheet();
  };
}

function cardStats(c) {
  const stats = [];
  if (c.level) stats.push((String(c.frame).startsWith('xyz') ? 'Rango ' : 'Livello ') + c.level);
  if (c.linkval) stats.push('Link-' + c.linkval);
  if (c.atk != null) stats.push('ATK ' + c.atk);
  if (c.def != null) stats.push('DEF ' + c.def);
  return stats.join(' · ');
}

function cardHeadHTML(c) {
  const stats = cardStats(c);
  return `<div class="card-detail">
      <img src="${esc(c.img || c.small)}" alt="">
      <div style="min-width:0">
        <h2>${esc(c.name)}</h2>
        ${c.altName ? `<p class="meta">${esc(c.altName)}</p>` : ''}
        <p class="meta">${esc([c.type, c.attribute, c.race].filter(Boolean).join(' · '))}</p>
        ${stats ? `<p class="meta">${esc(stats)}</p>` : ''}
      </div>
    </div>`;
}

/* ---------- Anteprima al passaggio del mouse (solo computer) ---------- */
const hoverReg = new Map();
/* attributo da mettere su ogni elemento-carta: registra la carta per l'anteprima */
const hc = c => { if (!c || c.id == null) return ''; hoverReg.set(String(c.id), c); return ` data-hc="${c.id}"`; };
const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function hoverHTML(c) {
  const stats = cardStats(c), lim = banLimit(c.id);
  return `<img class="hc-img" src="${esc(c.img || c.small)}" style="background-image:url('${esc(c.small)}')" alt="">
    <div class="hc-text">
      <h3>${esc(c.name)}</h3>
      ${c.altName ? `<p class="meta">${esc(c.altName)}</p>` : ''}
      <p class="meta">${esc([c.type, c.attribute, c.race].filter(Boolean).join(' · '))}</p>
      ${stats ? `<p class="meta">${esc(stats)}</p>` : ''}
      ${lim < 3 ? `<p class="banline b${lim}">${banBadge(c.id)} ${BAN_LABEL[lim]} nella banlist TCG</p>` : ''}
      ${c.desc ? `<div class="hc-desc">${esc(c.desc)}</div>` : ''}
    </div>`;
}

function setupHoverPreview() {
  const box = document.createElement('div');
  box.className = 'hover-card';
  box.hidden = true;
  document.body.appendChild(box);
  let timer = null, curEl = null;
  const hide = () => { clearTimeout(timer); timer = null; curEl = null; box.hidden = true; };
  const place = el => {
    const r = el.getBoundingClientRect(), m = 12;
    const bw = box.offsetWidth, bh = box.offsetHeight, vw = innerWidth, vh = innerHeight;
    let x = r.right + m;
    if (x + bw > vw - m) x = r.left - m - bw;          // non c'è spazio a destra: a sinistra
    if (x < m) x = Math.max(m, (vw - bw) / 2);
    const y = Math.max(m, Math.min(r.top + r.height / 2 - bh / 2, vh - bh - m));
    box.style.left = x + 'px';
    box.style.top = y + 'px';
  };
  const show = el => {
    if (el !== curEl || !el.isConnected) return;
    const c = hoverReg.get(el.dataset.hc);
    if (!c) return;
    box.innerHTML = hoverHTML(c);
    box.hidden = false;
    place(el);
    const img = box.querySelector('.hc-img');
    if (img && !img.complete) img.addEventListener('load', () => { if (!box.hidden && curEl === el) place(el); }, { once: true });
  };
  document.addEventListener('mouseover', e => {
    if (!canHover() || document.body.classList.contains('deck-dragging')) return;
    const el = e.target.closest('[data-hc]');
    if (el === curEl) return;
    if (!el) { hide(); return; }
    curEl = el;
    clearTimeout(timer);
    timer = setTimeout(() => show(el), box.hidden ? 200 : 40);
  });
  document.addEventListener('mouseout', e => { if (!e.relatedTarget) hide(); });
  document.addEventListener('pointerdown', hide, true);
  document.addEventListener('wheel', hide, { passive: true, capture: true });
  document.addEventListener('scroll', hide, true);
  window.addEventListener('blur', hide);
}

function openNodeSheet(id) {
  const n = nodeById(id);
  if (!n) return;
  const c = n.card;
  if (play) {   // in riproduzione: solo lettura
    openSheet(cardHeadHTML(c) + (n.note ? `<p class="meta" style="color:var(--accent)">${esc(n.note)}</p>` : '') +
      (c.desc ? `<div class="desc">${esc(c.desc)}</div>` : ''));
    return;
  }
  openSheet(`${cardHeadHTML(c)}
    <label class="lbl">Nota su questa carta nella combo</label>
    <textarea id="nNote" class="field" rows="2" placeholder="es. dalla mano, resta sul terreno, OPT…">${esc(n.note)}</textarea>
    ${c.desc ? `<div class="desc">${esc(c.desc)}</div>` : ''}
    <div class="row-btns">
      <button class="btn" id="nReplace">${icon('replace')} Sostituisci</button>
      <button class="btn danger" id="nDel">${icon('trash')} Elimina</button>
    </div>`);
  $('#nNote').addEventListener('input', ev => { n.note = ev.target.value; persist(); renderGraph(); });
  $('#nReplace').onclick = () => openSearch('Sostituisci carta', card => {
    n.card = slimCard(card);
    precache(card);
    persist(); renderGraph();
    openNodeSheet(n.id);
  });
  $('#nDel').onclick = () => { if (deleteNode(n.id)) dismissSheet(); };
}

function comboEditorMenu() {
  const linked = deckById(current.deckId);
  openSheet(`<h2>${esc(current.name)}</h2><div class="menu">
    <button data-a="deck">${icon('board')} Deck: ${linked ? esc(linked.name) : 'nessuno'}</button>
    <button data-a="layout">${icon('layout')} Ordina automaticamente</button>
    <button data-a="fit">${icon('fit')} Adatta allo schermo</button>
    <button data-a="renumber">${icon('edit')} Rinumera i passi (1, 2, 3…)</button>
    <button data-a="dup">${icon('copy')} Duplica combo</button>
    <button data-a="export">${icon('download')} Esporta combo</button>
    <button data-a="del" class="danger">${icon('trash')} Elimina combo</button></div>`);
  $('#sheet .menu').onclick = e => {
    const a = e.target.closest('button')?.dataset.a;
    if (!a) return;
    dismissSheet();
    if (a === 'deck') {
      if (!data.decks.length) { toast('Crea prima un deck nella sezione Deck'); return; }
      const c = current;
      chooseDeck(c.deckId).then(id => {
        c.deckId = id;
        persist();
        const d = deckById(id);
        toast(d ? `Collegata al deck ${d.name}` : 'Nessun deck collegato');
      });
    }
    else if (a === 'layout') autoLayout();
    else if (a === 'fit') fitView();
    else if (a === 'renumber') {
      [...current.edges].sort((x, y) => x.step - y.step).forEach((ed, i) => { ed.step = i + 1; });
      persist(); renderEdges(); toast('Passi rinumerati');
    }
    else if (a === 'dup') { persist(); const d = duplicateCombo(current); openEditor(d.id, false); toast('Stai modificando la copia'); }
    else if (a === 'export') exportCombos([current], fileName(current.name));
    else if (a === 'del') {
      const c = current;
      if (confirm(`Eliminare la combo "${c.name}"?`)) {
        current = null;
        resetPlayUI();
        data.combos = data.combos.filter(x => x.id !== c.id);
        markDeleted('combos', c.id);
        saveJSON(KEY_DATA, data);
        $('#editor').hidden = true; $('#home').hidden = false;
        renderHome();
        toast('Combo eliminata');
      }
    }
  };
}

/* ---------- Riproduci: la combo passo per passo ---------- */
function playSteps(withAlt) {
  const ids = new Set(current.nodes.map(n => n.id));
  return current.edges
    .filter(e => ids.has(e.from) && ids.has(e.to) && (withAlt || e.kind !== 'alt'))
    .sort((a, b) => (a.step - b.step) || ((a.kind === 'alt') - (b.kind === 'alt')));
}

function startPlay() {
  if (!current.edges.length) { toast('Aggiungi almeno un passo (una freccia)'); return; }
  if (linkFrom) cancelLink();
  sel = null;
  const hasMain = current.edges.some(e => e.kind !== 'alt');
  play = { alt: !hasMain, i: 0, steps: [], onEdge: null, onNodes: new Set(), doneNodes: new Set(), doneEdges: new Set() };
  play.steps = playSteps(play.alt);
  $('#canvas').classList.add('playing');
  $('#playPanel').hidden = false;
  playGo(0);
}

function stopPlay() {
  resetPlayUI();
  renderGraph(); renderBar();
}

function playGo(i) {
  if (!play) return;
  const steps = play.steps;
  play.i = clamp(i, 0, steps.length);
  const cur = steps[play.i];
  play.onEdge = cur ? cur.id : null;
  play.onNodes = new Set(cur ? [cur.from, cur.to] : []);
  play.doneNodes = new Set();
  play.doneEdges = new Set();
  steps.slice(0, play.i).forEach(e => { play.doneEdges.add(e.id); play.doneNodes.add(e.from); play.doneNodes.add(e.to); });
  $('#canvas').classList.toggle('play-end', !cur);
  renderGraph(); renderBar(); renderPlayPanel();
  if (cur) focusNodes([nodeById(cur.from), nodeById(cur.to)]);
  else fitView();
}

function renderPlayPanel() {
  const steps = play.steps, cur = steps[play.i];
  const altCount = current.edges.filter(e => e.kind === 'alt').length;
  const toggle = altCount ? `<button class="pp-toggle${play.alt ? ' on' : ''}" data-pp="alt">Piani B: ${play.alt ? 'sì' : 'no'}</button>` : '';
  let body;
  if (cur) {
    const a = nodeById(cur.from), b = nodeById(cur.to), alt = cur.kind === 'alt';
    body = `${alt ? `<div class="pp-alt">Piano B${cur.cond ? ' — se ' + esc(cur.cond) : ''}</div>` : ''}
      <div class="pp-row"><img src="${esc(a.card.crop)}" alt=""><b>${esc(a.card.name)}</b></div>
      <div class="pp-act">${icon('next')}<span>${esc(cur.action || 'poi')}</span>${cur.note ? `<small>${esc(cur.note)}</small>` : ''}</div>
      <div class="pp-row"><img src="${esc(b.card.crop)}" alt=""><b>${esc(b.card.name)}</b></div>`;
  } else {
    const bd = current.board;
    const nb = bd ? ZONES.reduce((s, [z]) => s + (bd[z] ? bd[z].length : 0), 0) : 0;
    body = `<p class="muted small" style="margin:6px 0 10px">Hai visto tutti i ${steps.length} passi.</p>
      <button class="btn primary" data-pp="board" style="width:100%">${icon('board')} ${nb ? 'Vedi la board finale' : 'Imposta la board finale'}</button>`;
  }
  $('#playPanel').innerHTML = `<div class="pp-head"><span>${cur ? `Passo <b>${play.i + 1}</b> di ${steps.length}` : '<b>Fine combo</b>'}</span><span class="sp"></span>${toggle}</div>${body}`;
}

function onPlayPanel(e) {
  const b = e.target.closest('[data-pp]');
  if (!b || !play) return;
  if (b.dataset.pp === 'board') openBoard();
  else if (b.dataset.pp === 'alt') {
    const cur = play.steps[play.i];
    play.alt = !play.alt;
    play.steps = playSteps(play.alt);
    let i = cur ? play.steps.findIndex(x => x.id === cur.id) : play.steps.length;
    if (i < 0) { const j = play.steps.findIndex(x => x.step >= cur.step); i = j < 0 ? play.steps.length : j; }
    if (!play.steps.length) { toast('Nessun passo della linea principale'); play.alt = true; play.steps = playSteps(true); i = 0; }
    playGo(i);
  }
}

let animTimer;
function animateView() {
  const w = $('#world'), cv = $('#canvas');
  w.classList.add('anim'); cv.classList.add('anim');
  applyView();
  clearTimeout(animTimer);
  animTimer = setTimeout(() => { w.classList.remove('anim'); cv.classList.remove('anim'); }, 400);
}

function focusNodes(ns) {
  ns = ns.filter(Boolean);
  if (!ns.length) return;
  const cv = $('#canvas').getBoundingClientRect();
  const minX = Math.min(...ns.map(n => n.x)), maxX = Math.max(...ns.map(n => n.x + NODE_W));
  const minY = Math.min(...ns.map(n => n.y)), maxY = Math.max(...ns.map(n => n.y + NODE_H));
  const w = maxX - minX, h = maxY - minY;
  const k = clamp(Math.min((cv.width - 48) / w, (cv.height - 48) / h), 0.3, 1);
  view = { k, x: cv.width / 2 - (minX + w / 2) * k, y: cv.height / 2 - (minY + h / 2) * k };
  animateView();
}

/* ---------- Board finale ---------- */
function boardOf(c) {
  if (!c.board || typeof c.board !== 'object') c.board = {};
  for (const [z] of ZONES) if (!Array.isArray(c.board[z])) c.board[z] = [];
  if (typeof c.board.notes !== 'string') c.board.notes = '';
  return c.board;
}

function openBoard() {
  const b = boardOf(current);
  openSheet(`<div id="boardWrap"><h2>Board finale</h2>
    <p class="muted small" style="margin-top:-6px">Cosa ti resta alla fine della combo.</p>
    ${ZONES.map(([z, l]) => `<div class="zone">
      <div class="zone-h"><span>${esc(l)}</span><button class="zadd" data-z="${z}" aria-label="Aggiungi">${icon('plus')}</button></div>
      <div class="zone-cards">${b[z].length
        ? b[z].map(it => `<button class="bcard" data-z="${z}" data-u="${it.uid}"${hc(it.card)}><img src="${esc(it.card.small)}" alt=""><span>${esc(it.card.name)}</span></button>`).join('')
        : '<span class="muted small">Vuoto</span>'}</div>
    </div>`).join('')}
    <label class="lbl">Interruzioni e note</label>
    <textarea id="bNotes" class="field" rows="3" placeholder="es. 2 negazioni, 1 distruzione in Quick Effect…">${esc(b.notes)}</textarea></div>`, { tall: true });
  $('#boardWrap').onclick = e => {
    const add = e.target.closest('.zadd');
    if (add) { boardAdd(add.dataset.z); return; }
    const bc = e.target.closest('.bcard');
    if (bc) boardItem(bc.dataset.z, bc.dataset.u);
  };
  $('#bNotes').addEventListener('input', e => { b.notes = e.target.value; persist(); });
}

function boardAdd(z) {
  const label = ZONES.find(x => x[0] === z)[1];
  const seen = new Set();
  const cards = current.nodes.map(n => n.card).filter(c => !seen.has(c.id) && seen.add(c.id));
  openSheet(`<h2>Aggiungi a: ${esc(label)}</h2>
    <button class="btn primary" id="bSearch" style="width:100%">${icon('search')} Cerca nel database</button>
    ${cards.length ? `<label class="lbl">Carte di questa combo</label><div class="results" id="bCards">${cards.map((c, i) => `<button class="result" data-i="${i}"${hc(c)}><img src="${esc(c.small)}" alt=""><span>${esc(c.name)}</span></button>`).join('')}</div>` : ''}
    <div class="row-btns"><button class="btn" id="bBack">${icon('back')} Indietro</button></div>`, { tall: true });
  const addCard = card => {
    boardOf(current)[z].push({ uid: uid(), card: slimCard(card) });
    precache(card);
    persist();
    openBoard();
  };
  $('#bSearch').onclick = () => openSearch(`Aggiungi a: ${label}`, addCard);
  if (cards.length) $('#bCards').onclick = e => { const r = e.target.closest('.result'); if (r) addCard(cards[+r.dataset.i]); };
  $('#bBack').onclick = openBoard;
}

function boardItem(z, u) {
  const b = boardOf(current), it = b[z].find(x => x.uid === u);
  if (!it) return;
  openSheet(`${cardHeadHTML(it.card)}
    <label class="lbl">Sposta in</label>
    <div class="chips" id="biMove">${ZONES.filter(x => x[0] !== z).map(([k, l]) => `<button class="chip" data-z="${k}">${esc(l)}</button>`).join('')}</div>
    ${it.card.desc ? `<div class="desc">${esc(it.card.desc)}</div>` : ''}
    <div class="row-btns"><button class="btn" id="biBack">${icon('back')} Indietro</button><button class="btn danger" id="biDel">${icon('trash')} Rimuovi</button></div>`);
  $('#biMove').onclick = e => {
    const c = e.target.closest('.chip');
    if (!c) return;
    b[z] = b[z].filter(x => x !== it);
    b[c.dataset.z].push(it);
    persist(); openBoard();
  };
  $('#biDel').onclick = () => { b[z] = b[z].filter(x => x !== it); persist(); openBoard(); };
  $('#biBack').onclick = openBoard;
}

/* =========================================================
   DECK BUILDING
   ========================================================= */
const DECK_SECTIONS = [['main', 'Main Deck', 40, 60], ['extra', 'Extra Deck', 0, 15], ['side', 'Side Deck', 0, 15]];

/* ---------- Banlist TCG (scaricata ogni 3 giorni e salvata sul dispositivo) ---------- */
const KEY_BAN = 'combolab.banlist.v1';
const BAN_LABEL = { 0: 'Proibita', 1: 'Limitata', 2: 'Semi-Limitata' };
let banlist = loadJSON(KEY_BAN, null);   // { t: data aggiornamento, m: { id: 0|1|2 } }
const banLimit = id => (banlist && banlist.m && banlist.m[id] != null ? banlist.m[id] : 3);
const banBadge = id => {
  const l = banLimit(id);
  return l < 3 ? `<i class="ban b${l}" title="${BAN_LABEL[l]}">${l === 0 ? '✕' : l}</i>` : '';
};

async function refreshBanlist(force) {
  if (!force && banlist && Date.now() - banlist.t < 3 * 864e5) return false;
  try {
    const r = await fetch(`${API}?banlist=tcg`);
    const j = await r.json();
    if (!Array.isArray(j.data) || !j.data.length) return false;
    const m = {};
    for (const c of j.data) {
      const st = c.banlist_info && c.banlist_info.ban_tcg;
      const n = st === 'Forbidden' ? 0 : st === 'Limited' ? 1 : st === 'Semi-Limited' ? 2 : null;
      if (n == null) continue;
      m[c.id] = n;
      for (const im of c.card_images || []) m[im.id] = n;
    }
    banlist = { t: Date.now(), m };
    saveJSON(KEY_BAN, banlist);
    if (currentDeck) renderDeck();
    renderDecks();
    return true;
  } catch { return false; }
}

/* carte oltre il limite (3 o banlist) in tutto il deck */
function deckIssues(d) {
  const tot = new Map();
  for (const [s] of DECK_SECTIONS) for (const e of d[s]) {
    const t = tot.get(e.card.id) || { card: e.card, n: 0 };
    t.n += e.qty;
    tot.set(e.card.id, t);
  }
  return [...tot.values()].filter(t => t.n > banLimit(t.card.id)).map(t => ({ ...t, lim: banLimit(t.card.id) }));
}
const FRAME_ORDER = { normal: 0, effect: 0, ritual: 1, spell: 2, trap: 3, fusion: 4, synchro: 5, xyz: 6, link: 7 };
const frameBase = c => String(c.frame || '').split('_')[0];
const isExtraCard = c => /^(fusion|synchro|xyz|link)/.test(String(c.frame || ''));
const sectionLabel = s => DECK_SECTIONS.find(x => x[0] === s)[1];
let currentDeck = null;

const deckById = id => (id ? data.decks.find(d => d.id === id) || null : null);
const deckCount = (d, s) => d[s].reduce((t, e) => t + e.qty, 0);
const copiesOf = (d, id) => DECK_SECTIONS.reduce((t, [s]) => t + ((d[s].find(e => e.card.id === id) || {}).qty || 0), 0);
const cmpCard = (a, b) => ((FRAME_ORDER[frameBase(a)] ?? 9) - (FRAME_ORDER[frameBase(b)] ?? 9)) || a.name.localeCompare(b.name);
const sortedEntries = list => [...list].sort((a, b) => cmpCard(a.card, b.card));
function sortDeck(d) { for (const [s] of DECK_SECTIONS) d[s] = sortedEntries(d[s]); d.ordered = true; }

function uniqueDeckCards(d) {
  const seen = new Set(), out = [];
  for (const [s] of DECK_SECTIONS) for (const e of sortedEntries(d[s])) if (!seen.has(e.card.id)) { seen.add(e.card.id); out.push(e.card); }
  return out;
}

function deckPut(d, s, card, n) {
  let e = d[s].find(x => x.card.id === card.id);
  if (!e) {
    // nuova carta: inserita vicino a quelle dello stesso tipo
    e = { card: slimCard(card), qty: 0 };
    const i = d[s].findIndex(x => cmpCard(x.card, card) > 0);
    if (i < 0) d[s].push(e); else d[s].splice(i, 0, e);
  }
  e.qty += n;
  d.updated = Date.now();
}

function deckRemove(d, s, id, n) {
  const e = d[s].find(x => x.card.id === id);
  if (!e) return;
  e.qty -= Math.min(n, e.qty);
  if (e.qty <= 0) d[s] = d[s].filter(x => x !== e);
  d.updated = Date.now();
  saveData();
}

/* aggiunge 1 copia; le carte Fusion/Synchro/Xyz/Link vanno nell'Extra. Ritorna la sezione o false */
function deckAdd(d, card, s) {
  if (s !== 'side') s = isExtraCard(card) ? 'extra' : 'main';
  const lim = banLimit(card.id);
  if (lim === 0) { toast(`${card.name} è Proibita nella banlist TCG`); return false; }
  if (copiesOf(d, card.id) >= lim) {
    toast(lim === 3 ? 'Massimo 3 copie per carta' : `${card.name} è ${BAN_LABEL[lim]}: massimo ${lim} ${lim === 1 ? 'copia' : 'copie'}`);
    return false;
  }
  deckPut(d, s, card, 1);
  precache(card);
  saveData();
  return s;
}

function renderDecks() {
  const el = $('#deckList');
  if (!data.decks.length) {
    el.innerHTML = `<div class="empty"><b>Nessun deck ancora</b>Tocca <b style="display:inline;color:var(--accent);font-size:inherit">Nuovo deck</b> per crearne uno o importare un file .ydk.</div>`;
    return;
  }
  el.innerHTML = [...data.decks].sort((a, b) => (b.updated || 0) - (a.updated || 0)).map(d => {
    const cover = uniqueDeckCards(d).slice(0, 3);
    const thumbs = cover.length ? cover.map(c => `<img src="${esc(c.crop)}" alt="" loading="lazy">`).join('') : '<div class="ph"></div>';
    return `<div class="combo-item" data-id="${d.id}">
      <div class="thumbs">${thumbs}</div>
      <div class="ci-text"><b>${esc(d.name)}</b><small>Main ${deckCount(d, 'main')} · Extra ${deckCount(d, 'extra')} · Side ${deckCount(d, 'side')}</small>${deckIssues(d).length ? '<small class="ci-warn">⚠ Carte oltre il limite</small>' : ''}</div>
      <button class="icon-btn" data-more aria-label="Opzioni">${icon('more')}</button>
    </div>`;
  }).join('');
}

function newDeckMenu() {
  openSheet(`<h2>Nuovo deck</h2><div class="menu">
    <button data-a="empty">${icon('plus')} Deck vuoto</button>
    <button data-a="ydk">${icon('upload')} Importa file .ydk</button></div>
    <p class="muted small">Il formato .ydk si esporta da YGOPRODeck, EDOPro e altri simulatori.</p>`);
  $('#sheet .menu').onclick = async e => {
    const a = e.target.closest('button')?.dataset.a;
    if (a === 'empty') {
      const name = await askText('Nuovo deck', `Deck ${data.decks.length + 1}`, 'Crea');
      if (!name) return;
      const d = { id: uid(), name, main: [], extra: [], side: [], created: Date.now(), updated: Date.now() };
      data.decks.push(d);
      saveData();
      openDeck(d.id);
    } else if (a === 'ydk') { dismissSheet(); importFile(); }
  };
}

function openDeck(id, push = true) {
  currentDeck = deckById(id);
  if (!currentDeck) return;
  if (!currentDeck.ordered) { sortDeck(currentDeck); saveData(); }
  dismissSheet();
  $('#home').hidden = true;
  $('#editor').hidden = true;
  $('#deckView').hidden = false;
  $('#deckName').value = currentDeck.name;
  if (push) history.pushState({ deck: id }, '');
  renderDeck();
  $('#deckBody').scrollTop = 0;
}

function closeDeck() {
  if (!currentDeck) return;
  saveData();
  currentDeck = null;
  dismissSheet();
  $('#deckView').hidden = true;
  $('#home').hidden = false;
  renderHome();
}

function renderDeck() {
  const d = currentDeck;
  if (!d) return;
  const cnt = f => d.main.filter(e => f(e.card)).reduce((t, e) => t + e.qty, 0);
  const nS = cnt(c => frameBase(c) === 'spell'), nT = cnt(c => frameBase(c) === 'trap');
  const nM = deckCount(d, 'main') - nS - nT;
  const total = DECK_SECTIONS.reduce((t, [s]) => t + deckCount(d, s), 0);
  const tools = total ? `<div class="dtools">
      <button class="btn primary" data-hand>${icon('hand')} Test mano</button>
      <p class="dhint">${isTouch() ? 'Tieni premuta una carta per trascinarla.' : 'Trascina una carta per spostarla, clicca per i dettagli.'}</p>
    </div>` : '';
  const issues = deckIssues(d);
  const overIds = new Set(issues.map(i => i.card.id));
  const warn = issues.length ? `<div class="dwarn"><b>⚠ Carte oltre il limite (banlist TCG)</b>${issues.map(i =>
    `<span>${esc(i.card.name)}: ${i.n} ${i.n === 1 ? 'copia' : 'copie'} — ${i.lim === 0 ? 'Proibita' : `max ${i.lim}`}</span>`).join('')}</div>` : '';
  $('#deckBody').innerHTML = tools + warn + DECK_SECTIONS.map(([s, label, min, max]) => {
    const n = deckCount(d, s);
    const state = n > max ? ' bad' : (s === 'main' && n < min ? ' warn' : ' ok');
    const copies = d[s].flatMap(e => Array.from({ length: e.qty }, () => e));
    return `<div class="dsec" data-sec="${s}">
      <div class="dsec-h"><b>${label}</b><span class="dcount${state}">${n}<small> / ${s === 'main' ? '40–60' : max}</small></span><span class="sp"></span>
        <button class="zadd" data-add="${s}" aria-label="Aggiungi carte">${icon('plus')}</button></div>
      ${s === 'main' && n ? `<p class="dsum">${nM} mostri · ${nS} magie · ${nT} trappole</p>` : ''}
      <div class="dgrid">${copies.length
        ? copies.map(e => `<button class="dcard${overIds.has(e.card.id) ? ' over' : ''}" data-s="${s}" data-id="${e.card.id}"${hc(e.card)}><img src="${esc(e.card.small)}" alt="${esc(e.card.name)}" loading="lazy">${banBadge(e.card.id)}</button>`).join('')
        : `<p class="muted small">Tocca ＋ per aggiungere carte.</p>`}</div>
    </div>`;
  }).join('');
}

function addToDeck(s) {
  const d = currentDeck;
  openSearch(`Aggiungi al ${sectionLabel(s)}`, card => {
    const where = deckAdd(d, card, s);
    if (!where) return;
    toast(`+1 ${card.name}` + (where !== s ? ` → ${sectionLabel(where)}` : ''));
    renderDeck();
  }, { deck: null, keepOpen: true, badge: c => copiesOf(d, c.id), hint: 'Tocca una carta per aggiungerne una copia (anche più volte).' });
}

function deckCardSheet(s, id) {
  const d = currentDeck;
  const e = d[s].find(x => x.card.id === id);
  if (!e) return;
  const other = s === 'side' ? (isExtraCard(e.card) ? 'extra' : 'main') : 'side';
  const lim = banLimit(id);
  openSheet(`${cardHeadHTML(e.card)}
    ${lim < 3 ? `<p class="banline b${lim}">${banBadge(id)} ${BAN_LABEL[lim]} nella banlist TCG — ${lim === 0 ? 'non utilizzabile' : `massimo ${lim} ${lim === 1 ? 'copia' : 'copie'}`}</p>` : ''}
    <div class="qty-row"><span>Copie nel ${sectionLabel(s)}</span>
      <button class="qbtn" id="qMinus" aria-label="Togli una copia">−</button><b id="qVal">${e.qty}</b><button class="qbtn" id="qPlus" aria-label="Aggiungi una copia">+</button></div>
    <div class="row-btns">
      <button class="btn" id="qMove">${icon('swap')} Sposta 1 nel ${sectionLabel(other)}</button>
      <button class="btn danger" id="qDel">${icon('trash')} Rimuovi</button>
    </div>
    ${e.card.desc ? `<div class="desc">${esc(e.card.desc)}</div>` : ''}`);
  const refresh = () => {
    const cur = d[s].find(x => x.card.id === id);
    if (!cur) dismissSheet(); else $('#qVal').textContent = cur.qty;
    renderDeck();
  };
  $('#qPlus').onclick = () => { if (deckAdd(d, e.card, s) === s) refresh(); else renderDeck(); };
  $('#qMinus').onclick = () => { deckRemove(d, s, id, 1); refresh(); };
  $('#qMove').onclick = () => {
    deckRemove(d, s, id, 1);
    deckPut(d, other, e.card, 1);
    saveData(); refresh();
    toast(`Spostata nel ${sectionLabel(other)}`);
  };
  $('#qDel').onclick = () => { deckRemove(d, s, id, Infinity); refresh(); };
}

/* ---------- Trascinamento delle carte nel deck ----------
   touch: pressione lunga (così lo scorrimento della pagina resta libero); mouse: basta trascinare */
function setupDeckDrag() {
  const body = $('#deckBody'), trash = $('#deckTrash');
  let pend = null, drag = null, suppressClick = false;

  const clearMarks = () => {
    document.querySelectorAll('.drop-before, .drop-after, .drop-sec').forEach(el => el.classList.remove('drop-before', 'drop-after', 'drop-sec'));
    trash.classList.remove('over');
  };

  const moveGhost = () => {
    drag.ghost.style.transform = `translate(${drag.x - drag.w / 2}px, ${drag.y - drag.h * 0.65}px) scale(1.12)`;
  };

  const updateTarget = () => {
    clearMarks();
    const el = document.elementFromPoint(drag.x, drag.y);
    let t = null;
    if (el && el.closest('#deckTrash')) {
      t = { trash: true };
      trash.classList.add('over');
    } else {
      const sec = el && el.closest('.dsec');
      if (sec) {
        const card = el.closest('.dcard');
        if (card && card !== drag.src) {
          const r = card.getBoundingClientRect();
          const after = drag.x > r.left + r.width / 2;
          t = { s: sec.dataset.sec, refId: +card.dataset.id, after };
          card.classList.add(after ? 'drop-after' : 'drop-before');
        } else if (!card) {
          t = { s: sec.dataset.sec, end: true };
        }
        sec.classList.add('drop-sec');
      }
    }
    drag.target = t;
  };

  const autoScroll = () => {
    if (!drag) return;
    const r = body.getBoundingClientRect(), edge = 70;
    let v = 0;
    if (drag.y < r.top + edge) v = -Math.min(18, (r.top + edge - drag.y) / 3);
    else if (drag.y > r.bottom - edge) v = Math.min(18, (drag.y - (r.bottom - edge)) / 3);
    if (v) { body.scrollTop += v; updateTarget(); }
    requestAnimationFrame(autoScroll);
  };

  const startDrag = () => {
    const p = pend;
    pend = null;
    if (!p || !p.card.isConnected) return;
    const r = p.card.getBoundingClientRect();
    const ghost = p.card.querySelector('img').cloneNode();
    ghost.className = 'drag-ghost';
    ghost.style.width = r.width + 'px';
    document.body.appendChild(ghost);
    p.card.classList.add('dragging');
    drag = { src: p.card, s: p.card.dataset.s, id: +p.card.dataset.id, ghost, w: r.width, h: r.height, x: p.lx, y: p.ly, pid: p.pid, target: null };
    trash.hidden = false;
    document.body.classList.add('deck-dragging');
    moveGhost();
    updateTarget();
    requestAnimationFrame(autoScroll);
  };

  const stopDrag = () => {
    clearMarks();
    drag.ghost.remove();
    drag.src.classList.remove('dragging');
    trash.hidden = true;
    document.body.classList.remove('deck-dragging');
    const info = { s: drag.s, id: drag.id, target: drag.target };
    drag = null;
    return info;
  };

  body.addEventListener('pointerdown', e => {
    const card = e.target.closest('.dcard');
    if (!card || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    pend = { card, pid: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, mouse: e.pointerType === 'mouse' };
    if (!pend.mouse) pend.timer = setTimeout(startDrag, 380);
  });

  window.addEventListener('pointermove', e => {
    if (pend && e.pointerId === pend.pid) {
      pend.lx = e.clientX; pend.ly = e.clientY;
      const dist = Math.hypot(e.clientX - pend.x, e.clientY - pend.y);
      if (pend.mouse) { if (dist > 6) startDrag(); }
      else if (dist > 10) { clearTimeout(pend.timer); pend = null; }   // è uno scorrimento
      return;
    }
    if (drag && e.pointerId === drag.pid) {
      drag.x = e.clientX; drag.y = e.clientY;
      moveGhost();
      updateTarget();
    }
  });

  const end = (e, cancelled) => {
    if (pend && e.pointerId === pend.pid) { clearTimeout(pend.timer); pend = null; return; }
    if (!drag || e.pointerId !== drag.pid) return;
    const info = stopDrag();
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 80);
    if (!cancelled && info.target) applyDeckDrop(info);
  };
  window.addEventListener('pointerup', e => end(e, false));
  window.addEventListener('pointercancel', e => end(e, true));

  // durante il trascinamento la pagina non deve scorrere
  document.addEventListener('touchmove', e => { if (drag) e.preventDefault(); }, { passive: false });
  body.addEventListener('contextmenu', e => { if (e.target.closest('.dcard')) e.preventDefault(); });
  body.addEventListener('click', e => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);
}

function applyDeckDrop({ s, id, target: t }) {
  const d = currentDeck;
  if (!d) return;
  const e = d[s].find(x => x.card.id === id);
  if (!e) return;
  if (t.trash) {
    deckRemove(d, s, id, 1);
    renderDeck();
    toast(`−1 ${e.card.name}`);
    return;
  }
  const ts = t.s, extra = isExtraCard(e.card);
  if ((ts === 'main' && extra) || (ts === 'extra' && !extra)) {
    toast(extra ? "Questa carta va nell'Extra Deck" : "Nell'Extra Deck solo Fusion, Synchro, Xyz e Link");
    return;
  }
  const arr = d[ts];
  const indexOfRef = () => {
    if (t.end) return arr.length;
    const i = arr.findIndex(x => x.card.id === t.refId);
    return i < 0 ? arr.length : i + (t.after ? 1 : 0);
  };
  if (ts === s) {
    // stessa sezione: cambia l'ordine (si spostano tutte le copie insieme)
    if (t.refId === id) return;
    arr.splice(arr.indexOf(e), 1);
    arr.splice(indexOfRef(), 0, e);
  } else {
    // sezione diversa: si sposta 1 copia
    e.qty--;
    if (e.qty <= 0) d[s] = d[s].filter(x => x !== e);
    const te = arr.find(x => x.card.id === id);
    if (te) te.qty++;
    else arr.splice(indexOfRef(), 0, { card: e.card, qty: 1 });
    toast(`Spostata nel ${sectionLabel(ts)}`);
  }
  d.ordered = true;
  d.updated = Date.now();
  saveData();
  renderDeck();
}

/* ---------- Test mano ---------- */
let handState = null;

function shuffled(arr) {
  const a = [...arr], r = new Uint32Array(1);
  for (let i = a.length - 1; i > 0; i--) {
    crypto.getRandomValues(r);
    const j = r[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function openHand(fresh) {
  const d = currentDeck;
  if (!d) return;
  if (deckCount(d, 'main') < 5) { toast('Servono almeno 5 carte nel Main Deck'); return; }
  if (fresh || !handState || handState.deckId !== d.id) {
    const pile = d.main.flatMap(e => Array.from({ length: e.qty }, () => e.card));
    handState = { deckId: d.id, pile: shuffled(pile), n: 5 };
  }
  const hand = handState.pile.slice(0, handState.n);
  const left = handState.pile.length - handState.n;
  const ids = new Set(hand.map(c => c.id));
  const linked = data.combos.filter(c => c.deckId === d.id);
  const pool = linked.length ? linked : data.combos;
  const playable = pool.filter(c => { const r = rootsOf(c); return r.length && r.every(n => ids.has(n.card.id)); });
  const drawn = handState.n - 5;

  openSheet(`<h2>Test mano</h2>
    <p class="muted small" style="margin-top:-6px">${drawn ? `Mano iniziale + ${drawn} pescat${drawn === 1 ? 'a' : 'e'}` : 'Mano iniziale'} · ${left} carte nel deck</p>
    <div class="hand${fresh ? ' deal' : ''}">${hand.map((c, i) => `<button class="hcard" data-i="${i}"${hc(c)} style="--d:${i * 70}ms"><img src="${esc(c.small)}" alt=""><span>${esc(c.name)}</span></button>`).join('')}</div>
    <div class="row-btns">
      <button class="btn primary" id="hNew">${icon('replace')} Nuova mano</button>
      <button class="btn" id="hDraw"${left ? '' : ' disabled'}>${icon('plus')} Pesca 1</button>
    </div>
    <label class="lbl">Combo che puoi iniziare</label>
    ${playable.length
      ? `<div class="menu" id="hCombos">${playable.map(c => `<button data-id="${c.id}">${icon('play')} ${esc(c.name)}</button>`).join('')}</div>`
      : `<p class="muted small">${pool.length ? 'Nessuna delle tue combo parte da questa mano.' : 'Crea delle combo collegate a questo deck: qui vedrai quali puoi iniziare con la mano pescata.'}</p>`}`);

  $('#hNew').onclick = () => openHand(true);
  $('#hDraw').onclick = () => { handState.n++; openHand(false); };
  $('#sheet .hand').onclick = e => {
    const b = e.target.closest('.hcard');
    if (!b) return;
    const c = hand[+b.dataset.i];
    openSheet(`${cardHeadHTML(c)}${c.desc ? `<div class="desc">${esc(c.desc)}</div>` : ''}
      <div class="row-btns"><button class="btn" id="hBack">${icon('back')} Torna alla mano</button></div>`);
    $('#hBack').onclick = () => openHand(false);
  };
  if (playable.length) $('#hCombos').onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    dismissSheet();
    closeDeck();
    openEditor(b.dataset.id);
  };
}

function chooseDeck(curId) {
  return new Promise(resolve => {
    openSheet(`<h2>Con quale deck?</h2>
      <p class="muted small" style="margin-top:-6px">Quando cerchi una carta, quelle del deck compaiono per prime.</p>
      <div class="menu" id="cdList">
        ${data.decks.map(d => `<button data-id="${d.id}"${d.id === curId ? ' class="on"' : ''}>${icon('board')} ${esc(d.name)}</button>`).join('')}
        <button data-id="">${icon('close')} Nessun deck</button>
      </div>`, { onClose: () => resolve(curId || null) });
    $('#cdList').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      dismissSheet();
      resolve(b.dataset.id || null);
    };
  });
}

function deckMenu(id, fromDeck) {
  const d = deckById(id);
  if (!d) return;
  openSheet(`<h2>${esc(d.name)}</h2><div class="menu">
    ${fromDeck ? '' : `<button data-a="open">${icon('edit')} Apri</button>`}
    <button data-a="combo">${icon('plus')} Nuova combo con questo deck</button>
    ${fromDeck ? '' : `<button data-a="rename">${icon('edit')} Rinomina</button>`}
    ${fromDeck ? `<button data-a="sort">${icon('layout')} Riordina per tipo</button>` : ''}
    <button data-a="dup">${icon('copy')} Duplica</button>
    <button data-a="ydk">${icon('download')} Esporta .ydk</button>
    <button data-a="json">${icon('download')} Esporta backup (.json)</button>
    <button data-a="del" class="danger">${icon('trash')} Elimina</button></div>`);
  $('#sheet .menu').onclick = async e => {
    const a = e.target.closest('button')?.dataset.a;
    if (!a) return;
    if (a === 'open') { dismissSheet(); openDeck(id); }
    else if (a === 'sort') { dismissSheet(); sortDeck(d); d.updated = Date.now(); saveData(); renderDeck(); toast('Carte riordinate per tipo'); }
    else if (a === 'combo') { dismissSheet(); if (currentDeck) closeDeck(); newCombo(id); }
    else if (a === 'rename') {
      const v = await askText('Rinomina deck', d.name, 'Salva');
      if (v) { d.name = v; d.updated = Date.now(); saveData(); renderHome(); }
    }
    else if (a === 'dup') {
      dismissSheet();
      const c = clone(d);
      c.id = uid(); c.name = d.name + ' (copia)'; c.created = c.updated = Date.now();
      data.decks.push(c);
      saveData();
      if (currentDeck) openDeck(c.id, false); else renderHome();
      toast('Deck duplicato');
    }
    else if (a === 'ydk') { dismissSheet(); shareFile(deckToYdk(d), fileBase(d.name) + '.ydk', 'text/plain'); }
    else if (a === 'json') { dismissSheet(); exportData({ decks: [d] }, fileName(d.name)); }
    else if (a === 'del') {
      dismissSheet();
      if (!confirm(`Eliminare il deck "${d.name}"?`)) return;
      data.decks = data.decks.filter(x => x.id !== id);
      markDeleted('decks', id);
      saveData();
      if (currentDeck && currentDeck.id === id) { currentDeck = null; $('#deckView').hidden = true; $('#home').hidden = false; }
      renderHome();
      toast('Deck eliminato');
    }
  };
}

/* ---------- Formato .ydk ---------- */
function deckToYdk(d) {
  const lines = ['#created by Combo Lab', '#main'];
  const push = s => d[s].forEach(e => { for (let i = 0; i < e.qty; i++) lines.push(String(e.card.id)); });
  push('main'); lines.push('#extra'); push('extra'); lines.push('!side'); push('side');
  return lines.join('\n') + '\n';
}

function parseYdk(text) {
  const sec = { main: [], extra: [], side: [] };
  let cur = 'main';
  for (const raw of text.split(/\r?\n/)) {
    const l = raw.trim();
    if (/^#main/i.test(l)) cur = 'main';
    else if (/^#extra/i.test(l)) cur = 'extra';
    else if (/^!side/i.test(l)) cur = 'side';
    else if (/^\d+$/.test(l)) sec[cur].push(+l);
  }
  return sec;
}

/* scarica i dati delle carte per id (anche artwork alternativi), prima nella lingua scelta poi in inglese */
async function fetchByIds(ids) {
  const map = new Map();
  const langs = settings.lang === 'en' ? ['en'] : [settings.lang, 'en'];
  let todo = [...new Set(ids)];
  for (const lang of langs) {
    for (let i = 0; i < todo.length; i += 50) {
      let url = `${API}?id=${todo.slice(i, i + 50).join(',')}`;
      if (lang !== 'en') url += `&language=${lang}`;
      const r = await fetch(url);
      const j = await r.json().catch(() => ({}));
      for (const raw of (j.data || [])) {
        const c = normCard(raw);
        c.lang = lang;
        map.set(raw.id, c);
        for (const im of raw.card_images || []) map.set(im.id, c);
      }
    }
    todo = todo.filter(id => !map.has(id));
    if (!todo.length) break;
  }
  return map;
}

async function importYdk(text, name) {
  const sec = parseYdk(text);
  const all = [...sec.main, ...sec.extra, ...sec.side];
  if (!all.length) { toast('File .ydk vuoto o non valido'); return; }
  toast('Importo il deck…');
  let map;
  try { map = await fetchByIds(all); } catch { toast('Serve internet per importare un .ydk'); return; }
  const d = { id: uid(), name: name || 'Deck importato', main: [], extra: [], side: [], created: Date.now(), updated: Date.now() };
  let missing = 0;
  for (const [s] of DECK_SECTIONS) {
    for (const id of sec[s]) {
      const c = map.get(id);
      if (c) deckPut(d, s, c, 1); else missing++;
    }
  }
  data.decks.push(d);
  saveData();
  homeTab = 'decks';
  openDeck(d.id);
  toast(missing ? `Deck importato (${missing} carte non trovate)` : 'Deck importato');
}

/* Disposizione automatica a livelli, dall'alto verso il basso */
function autoLayout() {
  const c = current, N = c.nodes.length;
  if (!N) return;
  const ids = new Set(c.nodes.map(n => n.id));
  const edges = c.edges.filter(e => ids.has(e.from) && ids.has(e.to) && e.from !== e.to).sort((a, b) => a.step - b.step);
  const depth = new Map(c.nodes.map(n => [n.id, 0]));
  for (let i = 0; i < N; i++) {
    let changed = false;
    for (const e of edges) {
      const d = depth.get(e.from) + 1;
      if (d > depth.get(e.to) && d < N) { depth.set(e.to, d); changed = true; }
    }
    if (!changed) break;
  }
  const layers = [];
  for (const n of c.nodes) { const d = depth.get(n.id); (layers[d] || (layers[d] = [])).push(n); }
  const pos = new Map();
  layers.filter(Boolean).forEach((layer, row) => {
    const key = new Map(layer.map(n => {
      const parents = edges.filter(e => e.to === n.id && pos.has(e.from)).map(e => pos.get(e.from).x);
      return [n.id, parents.length ? parents.reduce((s, v) => s + v, 0) / parents.length : n.x];
    }));
    layer.sort((a, b) => key.get(a.id) - key.get(b.id));
    layer.forEach((n, i) => {
      pos.set(n.id, { x: Math.round((i - (layer.length - 1) / 2) * (NODE_W + GAP_X)), y: row * (NODE_H + GAP_Y) });
    });
  });
  for (const n of c.nodes) { const p = pos.get(n.id); n.x = p.x; n.y = p.y; }
  persist(); renderGraph(); fitView();
}

/* ---------- Gesti: trascina, pan, pinch-zoom ---------- */
function setupCanvas() {
  const cv = $('#canvas');
  const pointers = new Map();
  let g = null;
  const local = (x, y) => { const r = cv.getBoundingClientRect(); return { x: x - r.left, y: y - r.top }; };

  cv.addEventListener('pointerdown', e => {
    if (e.target.closest('.banner')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { cv.setPointerCapture(e.pointerId); } catch {}
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      const nodeEl = e.target.closest('.node'), labelEl = e.target.closest('.elabel');
      g = { type: nodeEl ? 'node' : labelEl ? 'label' : 'pan', id: (nodeEl || labelEl)?.dataset.id,
            sx: e.clientX, sy: e.clientY, moved: false, vx: view.x, vy: view.y };
      if (g.type === 'node') { const n = nodeById(g.id); g.nx = n.x; g.ny = n.y; g.el = nodeEl; }
    } else if (pointers.size === 2) {
      const [p1, p2] = [...pointers.values()];
      const mid = local((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      if (g && g.type === 'node' && g.moved) persist();
      g = { type: 'pinch', d0: Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1, k0: view.k,
            wx: (mid.x - view.x) / view.k, wy: (mid.y - view.y) / view.k, moved: true };
    }
  });

  cv.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!g) return;
    if (g.type === 'pinch') {
      if (pointers.size < 2) return;
      const [p1, p2] = [...pointers.values()];
      const mid = local((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      const k = clamp(g.k0 * Math.hypot(p1.x - p2.x, p1.y - p2.y) / g.d0, 0.25, 2.5);
      view.k = k; view.x = mid.x - g.wx * k; view.y = mid.y - g.wy * k;
      applyView();
      return;
    }
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (!g.moved && Math.hypot(dx, dy) > 6) g.moved = true;
    if (!g.moved) return;
    if (g.type === 'node' && !play) {
      const n = nodeById(g.id);
      n.x = Math.round(g.nx + dx / view.k); n.y = Math.round(g.ny + dy / view.k);
      g.el.style.left = n.x + 'px'; g.el.style.top = n.y + 'px';
      renderEdges();
    } else {
      view.x = g.vx + dx; view.y = g.vy + dy;
      applyView();
    }
  });

  const end = e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (!g) return;
    if (g.type === 'pinch') { if (pointers.size === 0) g = null; return; }
    const was = g; g = null;
    if (e.type === 'pointercancel') { if (was.type === 'node' && was.moved) persist(); return; }
    if (was.moved) { if (was.type === 'node' && !play) persist(); return; }
    if (play) {
      if (was.type === 'node') openNodeSheet(was.id);
      else if (was.type === 'label') { const i = play.steps.findIndex(x => x.id === was.id); if (i >= 0) playGo(i); }
      return;
    }
    if (was.type === 'node') onNodeTap(was.id);
    else if (was.type === 'label') { if (linkFrom) cancelLink(); editEdge(was.id); }
    else if (linkFrom) cancelLink();
    else if (sel) { sel = null; updateSelClasses(); renderBar(); }
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);

  cv.addEventListener('wheel', e => {
    e.preventDefault();
    const p = local(e.clientX, e.clientY);
    zoomAt(p, view.k * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
  }, { passive: false });
}

function onNodeTap(id) {
  if (linkFrom) {
    if (id === linkFrom) { cancelLink(); return; }
    const from = linkFrom;
    if (current.edges.some(e => e.from === from && e.to === id)) { toast('Queste carte sono già collegate'); cancelLink(); return; }
    cancelLink();
    sel = id; updateSelClasses(); renderBar();
    pickAction(from, id, (action, note, meta) => { if (action !== null) addEdge(from, id, action, note, meta); });
    return;
  }
  if (sel === id) { openNodeSheet(id); return; }
  sel = id;
  updateSelClasses(); renderBar();
}

/* =========================================================
   ACCOUNT E SINCRONIZZAZIONE (Firebase Authentication + Firestore)
   I dati restano anche sul dispositivo (localStorage): Firebase è la copia
   condivisa tra iPhone e PC. Vince sempre la versione modificata più di recente.
   ========================================================= */
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyApGlnUewfuf1BqRR9e6qvwy7XxhxeXHYA',
  authDomain: 'combo--lab.firebaseapp.com',
  projectId: 'combo--lab',
  storageBucket: 'combo--lab.firebasestorage.app',
  messagingSenderId: '343425631690',
  appId: '1:343425631690:web:9df781cee2c2fca0da7b33'
};
const FB_VERSION = '10.14.1';
const KEY_SYNC = 'combolab.sync.v1';
const COLLS = ['combos', 'decks'];
let fb = null, fbLoading = null, cloudUser = null, cloudState = 'off', cloudUnsubs = [];
let syncMeta = Object.assign({ uid: null, synced: {}, pendingDel: [] }, loadJSON(KEY_SYNC, {}));
let syncTimer = null, pushing = false, pushAgain = false, cloudReady = false;
const saveSyncMeta = () => { try { localStorage.setItem(KEY_SYNC, JSON.stringify(syncMeta)); } catch { /* ignore */ } };

const CLOUD_LABEL = {
  off: 'Non connesso',
  syncing: 'Sincronizzazione in corso…',
  ok: 'Sincronizzato',
  offline: 'Offline: le modifiche verranno inviate appena torni online',
  error: 'Errore di sincronizzazione: riprova più tardi'
};

function loadFirebase() {
  if (fb) return Promise.resolve(fb);
  if (!fbLoading) {
    fbLoading = (async () => {
      const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}/`;
      const [A0, A, F] = await Promise.all([
        import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')
      ]);
      const app = A0.initializeApp(FIREBASE_CONFIG);
      fb = { A, F, auth: A.getAuth(app), db: F.getFirestore(app) };
      A.onAuthStateChanged(fb.auth, onAuthChange);
      return fb;
    })().catch(e => { fbLoading = null; throw e; });
  }
  return fbLoading;
}

function initCloud() {
  window.addEventListener('online', () => { if (cloudUser) pushDirty(); });
  window.addEventListener('offline', () => { if (cloudUser) setCloudState('offline'); });
  $('#cloudBtn').onclick = () => openAccount();
  setCloudState('off');
  // carica Firebase all'avvio solo se su questo dispositivo è già stato fatto l'accesso
  if (syncMeta.uid) loadFirebase().catch(() => setCloudState('offline'));
}

function setCloudState(s) {
  cloudState = s;
  const b = $('#cloudBtn');
  b.className = 'icon-btn cloud-btn ' + (cloudUser ? 'st-' + s : 'st-none');
  b.title = cloudUser ? CLOUD_LABEL[s] : 'Accedi per sincronizzare';
  const st = $('#acctStatus');
  if (st) st.textContent = CLOUD_LABEL[s];
}

function onAuthChange(user) {
  cloudUser = user;
  cloudReady = false;
  cloudUnsubs.forEach(u => u());
  cloudUnsubs = [];
  if (!user) { setCloudState('off'); return; }
  if (syncMeta.uid !== user.uid) {            // primo accesso con questo account su questo dispositivo
    syncMeta = { uid: user.uid, synced: {}, pendingDel: [] };
    saveSyncMeta();
  }
  setCloudState(navigator.onLine ? 'syncing' : 'offline');
  const first = new Set(), reconciled = new Set();
  for (const coll of COLLS) {
    const ref = fb.F.collection(fb.db, 'users', user.uid, coll);
    cloudUnsubs.push(fb.F.onSnapshot(ref, { includeMetadataChanges: true }, snap => {
      applyRemote(coll, snap);
      // al primo elenco confermato dal server: togli ciò che è stato eliminato da un altro dispositivo
      if (!snap.metadata.fromCache && !reconciled.has(coll)) { reconciled.add(coll); reconcileDeleted(coll, snap); }
      if (!first.has(coll)) {
        first.add(coll);
        if (first.size === COLLS.length) {   // dopo aver letto tutto, invia ciò che manca online
          cloudReady = true;
          pushDirty();
          refreshCardTexts();
        }
      }
    }, err => { console.warn('sync', err); setCloudState('error'); }));
  }
}

const validRemote = (coll, o) => coll === 'combos'
  ? Array.isArray(o.nodes) && Array.isArray(o.edges)
  : ['main', 'extra', 'side'].every(s => Array.isArray(o[s]));

function applyRemote(coll, snap) {
  const arr = data[coll];
  let changed = false;
  for (const ch of snap.docChanges()) {
    const id = ch.doc.id, key = coll + '/' + id;
    const i = arr.findIndex(x => x.id === id);
    if (ch.type === 'removed') {
      // eliminato su un altro dispositivo: lo tolgo solo se qui non è stato modificato dopo
      if (i >= 0 && (arr[i].updated || 0) <= (syncMeta.synced[key] ?? -1)) {
        arr.splice(i, 1);
        changed = true;
        onRemoteRemoved(coll, id);
      }
      delete syncMeta.synced[key];
      continue;
    }
    if (ch.doc.metadata.hasPendingWrites || syncMeta.pendingDel.includes(key)) continue;
    const remote = ch.doc.data();
    remote.id = id;
    if (!validRemote(coll, remote)) continue;
    const local = i >= 0 ? arr[i] : null;
    const ru = remote.updated || 0, lu = local ? (local.updated || 0) : -1;
    if (ru > lu) {
      if (local) arr[i] = remote; else arr.push(remote);
      changed = true;
      onRemoteReplaced(coll, id, remote);
    }
    if (ru >= lu) syncMeta.synced[key] = ru;
  }
  saveSyncMeta();
  if (changed) {
    try { localStorage.setItem(KEY_DATA, JSON.stringify(data)); } catch { /* ignore */ }
    if (!$('#home').hidden) renderHome();
  }
}

function reconcileDeleted(coll, snap) {
  const online = new Set(snap.docs.map(d => d.id));
  const arr = data[coll];
  let changed = false;
  for (let i = arr.length - 1; i >= 0; i--) {
    const it = arr[i], key = coll + '/' + it.id;
    if (online.has(it.id) || !(key in syncMeta.synced) || syncMeta.pendingDel.includes(key)) continue;
    // era sincronizzato ma online non c'è più: eliminato altrove (se qui non è stato modificato dopo)
    if ((it.updated || 0) <= syncMeta.synced[key]) {
      arr.splice(i, 1);
      changed = true;
      onRemoteRemoved(coll, it.id);
    }
    delete syncMeta.synced[key];
  }
  saveSyncMeta();
  if (changed) {
    try { localStorage.setItem(KEY_DATA, JSON.stringify(data)); } catch { /* ignore */ }
    if (!$('#home').hidden) renderHome();
  }
}

function onRemoteReplaced(coll, id, obj) {
  if (coll === 'combos' && current && current.id === id) {
    current = obj;
    if (sel && !nodeById(sel)) sel = null;
    if (play) resetPlayUI();
    $('#comboName').value = current.name;
    renderGraph(); renderBar();
  } else if (coll === 'decks' && currentDeck && currentDeck.id === id) {
    currentDeck = obj;
    $('#deckName').value = currentDeck.name;
    renderDeck();
  }
}

function onRemoteRemoved(coll, id) {
  if (coll === 'combos' && current && current.id === id) {
    current = null; resetPlayUI(); dismissSheet();
    $('#editor').hidden = true; $('#home').hidden = false;
    toast('Questa combo è stata eliminata su un altro dispositivo');
  } else if (coll === 'decks' && currentDeck && currentDeck.id === id) {
    currentDeck = null; dismissSheet();
    $('#deckView').hidden = true; $('#home').hidden = false;
    toast('Questo deck è stato eliminato su un altro dispositivo');
  }
}

function markDeleted(coll, id) {
  if (!syncMeta.uid) return;
  const key = coll + '/' + id;
  if (!syncMeta.pendingDel.includes(key)) syncMeta.pendingDel.push(key);
  saveSyncMeta();
}

function scheduleSync() {
  if (!cloudUser) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(pushDirty, 1200);
}

/* invia le eliminazioni e tutto ciò che è stato modificato dopo l'ultima sincronizzazione */
async function pushDirty() {
  if (!cloudUser || !fb) return;
  if (pushing) { pushAgain = true; return; }
  pushing = true;
  setCloudState(navigator.onLine ? 'syncing' : 'offline');
  const uid = cloudUser.uid, F = fb.F;
  try {
    for (const key of [...syncMeta.pendingDel]) {
      const [coll, id] = key.split('/');
      await F.deleteDoc(F.doc(fb.db, 'users', uid, coll, id));
      syncMeta.pendingDel = syncMeta.pendingDel.filter(k => k !== key);
      delete syncMeta.synced[key];
      saveSyncMeta();
    }
    for (const coll of COLLS) {
      for (const item of [...data[coll]]) {
        if (!item.updated) item.updated = item.created || Date.now();
        const key = coll + '/' + item.id;
        if (item.updated <= (syncMeta.synced[key] ?? -1)) continue;
        const ver = item.updated;
        await F.setDoc(F.doc(fb.db, 'users', uid, coll, item.id), JSON.parse(JSON.stringify(item)));
        syncMeta.synced[key] = ver;
        saveSyncMeta();
      }
    }
    setCloudState(navigator.onLine ? 'ok' : 'offline');
  } catch (e) {
    console.warn('sync', e);
    setCloudState('error');
  }
  pushing = false;
  if (pushAgain) { pushAgain = false; pushDirty(); }
}

function authError(e) {
  const c = (e && e.code) || '';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Email o password errati.';
  if (c.includes('email-already-in-use')) return 'Esiste già un account con questa email: usa "Accedi".';
  if (c.includes('weak-password')) return 'La password deve avere almeno 6 caratteri.';
  if (c.includes('invalid-email') || c.includes('missing-email')) return 'Email non valida.';
  if (c.includes('missing-password')) return 'Scrivi la password.';
  if (c.includes('network')) return 'Connessione assente: riprova quando sei online.';
  if (c.includes('too-many-requests')) return 'Troppi tentativi: aspetta qualche minuto.';
  if (c.includes('operation-not-allowed') || c.includes('admin-restricted')) return 'La creazione di nuovi account è disattivata.';
  return 'Si è verificato un errore' + (c ? ` (${c})` : '') + '.';
}

async function openAccount(mode = 'login', keepEmail = '') {
  if (cloudUser) {
    openSheet(`<h2>Account</h2>
      <p class="acct-mail">${icon('cloud')} ${esc(cloudUser.email)}</p>
      <p class="muted small" id="acctStatus">${CLOUD_LABEL[cloudState]}</p>
      <p class="muted small">Combo e deck si sincronizzano da soli su tutti i dispositivi in cui accedi con questo account.</p>
      <div class="row-btns">
        <button class="btn" id="acSync">${icon('replace')} Sincronizza ora</button>
        <button class="btn danger" id="acOut">Esci</button>
      </div>`);
    $('#acSync').onclick = () => pushDirty();
    $('#acOut').onclick = async () => {
      if (!confirm('Uscire dall\'account?\nCombo e deck restano su questo dispositivo, ma non verranno più sincronizzati.')) return;
      await fb.A.signOut(fb.auth);
      syncMeta = { uid: null, synced: {}, pendingDel: [] };
      saveSyncMeta();
      dismissSheet();
      toast('Sei uscito dall\'account');
    };
    return;
  }
  const create = mode === 'create';
  openSheet(`<h2>${create ? 'Crea account' : 'Accedi'}</h2>
    <p class="muted small" style="margin-top:-6px">${create
      ? 'Scegli email e password: ti serviranno per accedere da iPhone e PC.'
      : 'Accedi per avere le stesse combo e gli stessi deck su iPhone e PC. Senza account l\'app funziona lo stesso, ma i dati restano solo su questo dispositivo.'}</p>
    <input id="acEmail" class="field" type="email" autocomplete="${create ? 'email' : 'username'}" autocapitalize="off" spellcheck="false" placeholder="Email" value="${esc(keepEmail)}">
    <div class="pass-row">
      <input id="acPass" class="field" type="password" autocomplete="${create ? 'new-password' : 'current-password'}" placeholder="Password${create ? ' (almeno 6 caratteri)' : ''}">
      <button class="eye" id="acEye" type="button">Mostra</button>
    </div>
    ${create ? '<input id="acPass2" class="field" type="password" autocomplete="new-password" placeholder="Ripeti la password">' : ''}
    <p class="small" id="acMsg" style="min-height:1.2em;margin:6px 2px;color:var(--danger)"></p>
    <div class="row-btns" style="margin-top:4px">
      <button class="btn primary" id="acGo">${create ? 'Crea account' : 'Accedi'}</button>
    </div>
    <p class="acct-switch">${create
      ? 'Hai già un account? <button class="linkbtn" id="acSwitch">Accedi</button>'
      : 'Non hai un account? <button class="linkbtn" id="acSwitch">Creane uno</button>'}</p>
    ${create ? '' : '<button class="linkbtn" id="acReset">Password dimenticata?</button>'}
    <p class="muted small">Al primo accesso, le combo e i deck già presenti su questo dispositivo vengono caricati nel tuo account.</p>`);
  const msg = (t, ok) => { const m = $('#acMsg'); m.textContent = t; m.style.color = ok ? 'var(--muted)' : 'var(--danger)'; };
  const creds = () => [$('#acEmail').value.trim(), $('#acPass').value];
  $('#acEye').onclick = () => {
    const show = $('#acPass').type === 'password';
    ['#acPass', '#acPass2'].forEach(s => { const el = $(s); if (el) el.type = show ? 'text' : 'password'; });
    $('#acEye').textContent = show ? 'Nascondi' : 'Mostra';
  };
  $('#acSwitch').onclick = () => openAccount(create ? 'login' : 'create', $('#acEmail').value.trim());
  const run = async () => {
    const [email, pass] = creds();
    if (!email || !pass) { msg('Scrivi email e password.'); return; }
    if (create) {
      if (pass.length < 6) { msg('La password deve avere almeno 6 caratteri.'); return; }
      if (pass !== $('#acPass2').value) { msg('Le due password non coincidono.'); $('#acPass2').focus(); return; }
    }
    msg('Attendi…', true);
    try {
      await loadFirebase();
      if (create) await fb.A.createUserWithEmailAndPassword(fb.auth, email, pass);
      else await fb.A.signInWithEmailAndPassword(fb.auth, email, pass);
      dismissSheet();
      toast(create ? 'Account creato: carico i tuoi dati…' : 'Accesso effettuato: sincronizzo…');
    } catch (e) {
      msg(e && e.code ? authError(e) : 'Impossibile collegarsi: sei offline?');
    }
  };
  $('#acGo').onclick = run;
  ['#acPass', '#acPass2'].forEach(s => { const el = $(s); if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') run(); }); });
  if (!create) $('#acReset').onclick = async () => {
    const [email] = creds();
    if (!email) { msg('Scrivi prima la tua email qui sopra.'); return; }
    try {
      await loadFirebase();
      await fb.A.sendPasswordResetEmail(fb.auth, email);
      msg('Ti ho mandato un\'email per reimpostare la password (controlla anche lo spam).', true);
    } catch (e) { msg(authError(e)); }
  };
}

/* ---------- Avvio ---------- */
function init() {
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });

  // immagine di riserva se l'artwork non si carica
  document.addEventListener('error', e => {
    const t = e.target;
    if (t.tagName === 'IMG' && t.dataset.fb && t.src !== t.dataset.fb) t.src = t.dataset.fb;
  }, true);

  $('#homeSearch').addEventListener('input', renderHome);
  $('#starters').addEventListener('click', e => {
    const b = e.target.closest('.starter');
    if (!b) return;
    const id = +b.dataset.card;
    starterFilter = starterFilter === id ? null : id;
    renderHome();
  });
  $('#comboList').addEventListener('click', e => {
    const item = e.target.closest('.combo-item');
    if (!item) return;
    if (e.target.closest('[data-more]')) comboMenu(item.dataset.id);
    else openEditor(item.dataset.id);
  });
  $('#newComboBtn').onclick = () => { if (homeTab === 'decks') newDeckMenu(); else newCombo(); };
  $('#homeTabs').onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    homeTab = b.dataset.tab;
    settings.tab = homeTab;
    saveJSON(KEY_SETTINGS, settings);
    renderHome();
  };
  $('#deckList').addEventListener('click', e => {
    const item = e.target.closest('.combo-item');
    if (!item) return;
    if (e.target.closest('[data-more]')) deckMenu(item.dataset.id, false);
    else openDeck(item.dataset.id);
  });
  $('#deckBack').onclick = () => { if (history.state && history.state.deck) history.back(); else closeDeck(); };
  $('#deckMenuBtn').onclick = () => deckMenu(currentDeck.id, true);
  $('#deckSearchBtn').onclick = () => openCardLookup();
  $('#deckName').addEventListener('input', e => { if (currentDeck) { currentDeck.name = e.target.value.trim() || 'Senza nome'; currentDeck.updated = Date.now(); saveData(); } });
  $('#deckName').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  $('#deckBody').addEventListener('click', e => {
    if (e.target.closest('[data-hand]')) { openHand(true); return; }
    const add = e.target.closest('[data-add]');
    if (add) { addToDeck(add.dataset.add); return; }
    const dc = e.target.closest('.dcard');
    if (dc) deckCardSheet(dc.dataset.s, +dc.dataset.id);
  });
  $('#settingsBtn').onclick = openSettings;

  $('#backBtn').onclick = () => { if (history.state && history.state.combo) history.back(); else closeEditor(); };
  window.addEventListener('popstate', () => { if (current) closeEditor(); else if (currentDeck) closeDeck(); else dismissSheet(); });
  $('#comboName').addEventListener('input', e => { if (current) { current.name = e.target.value.trim() || 'Senza nome'; persist(); } });
  $('#comboName').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  $('#comboMenuBtn').onclick = comboEditorMenu;
  $('#bar').addEventListener('click', e => { const b = e.target.closest('button'); if (b) onBar(b.dataset.act); });
  $('#linkCancel').onclick = cancelLink;
  $('#playPanel').addEventListener('click', onPlayPanel);
  $('#backdrop').addEventListener('click', closeSheet);
  $('#sheet').addEventListener('click', e => { if (e.target.closest('.sheet-x')) closeSheet(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#sheet').hidden) closeSheet(); else if (linkFrom) cancelLink(); } });
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden && current) persist(); });
  window.addEventListener('resize', () => { if (current) applyView(); });

  setupCanvas();
  setupDeckDrag();
  setupHoverPreview();
  renderHome();
  refreshBanlist(false);
  initCloud();
  setTimeout(refreshCardTexts, 2500);

  const m = location.hash.match(/^#c=(.+)$/);
  if (m) openEditor(decodeURIComponent(m[1]), false);

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

init();
