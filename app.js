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
const clone = o => JSON.parse(JSON.stringify(o));
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;
const frameColor = f => FRAME_COLORS[String(f || '').split('_')[0]] || '#5d6475';

function loadJSON(k, def) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; }
}
function saveJSON(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); return true; }
  catch { toast('Impossibile salvare: memoria piena?'); return false; }
}

let data = loadJSON(KEY_DATA, { combos: [] });
if (!data || !Array.isArray(data.combos)) data = { combos: [] };
let settings = Object.assign({ lang: 'it' }, loadJSON(KEY_SETTINGS, {}));

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
  s.innerHTML = '<div class="grab"></div>' + html;
  s.hidden = false; b.hidden = false;
  s.scrollTop = 0;
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
  let url = `${API}?fname=${encodeURIComponent(q)}&num=40&offset=0`;
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
  return [...map.values()].map(m => {
    const name = m.names[pref] || m.names.en || m.name;
    const altName = Object.values(m.names).find(n => n !== name) || '';
    const out = { ...m, name, altName };
    delete out.names;
    return out;
  });
}

/* salva le immagini nella cache (service worker) per l'uso offline */
function precache(card) {
  [card.crop, card.img, card.small].forEach(u => { if (u) fetch(u, { mode: 'no-cors' }).catch(() => {}); });
}

function openSearch(title, onPick) {
  openSheet(`<h2>${esc(title)}</h2>
    <label class="searchbox">${icon('search')}<input id="cardQ" type="search" placeholder="Nome carta (IT o EN)" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"></label>
    <div id="cardResults" class="results"><p class="muted small">Scrivi almeno 3 lettere del nome, in italiano o in inglese.</p></div>`, { tall: true });
  const q = $('#cardQ'), out = $('#cardResults');
  let timer, token = 0, last = [];
  q.addEventListener('input', () => {
    clearTimeout(timer);
    const v = q.value.trim();
    if (v.length < 3) { out.innerHTML = '<p class="muted small">Scrivi almeno 3 lettere.</p>'; return; }
    out.innerHTML = '<p class="muted small">Cerco…</p>';
    timer = setTimeout(async () => {
      const my = ++token;
      try {
        const r = await searchCards(v);
        if (my !== token) return;
        last = r;
        out.innerHTML = r.length
          ? r.map((c, i) => `<button class="result" data-i="${i}"><img loading="lazy" src="${esc(c.small)}" alt=""><span>${esc(c.name)}</span>${c.altName ? `<small>${esc(c.altName)}</small>` : ''}</button>`).join('')
          : '<p class="muted small">Nessuna carta trovata.</p>';
      } catch {
        if (my === token) out.innerHTML = '<p class="muted small">Ricerca non disponibile. Sei offline?</p>';
      }
    }, 380);
  });
  q.addEventListener('keydown', e => { if (e.key === 'Enter') q.blur(); });
  out.addEventListener('click', e => {
    const b = e.target.closest('.result');
    if (b) onPick(last[+b.dataset.i]);
  });
  if (!isTouch()) setTimeout(() => q.focus(), 260);
}

/* ---------- Home ---------- */
let starterFilter = null;

function rootsOf(c) {
  const inc = new Set(c.edges.map(e => e.to));
  return c.nodes.filter(n => !inc.has(n.id)).sort((a, b) => a.y - b.y || a.x - b.x);
}

function renderHome() {
  const q = norm($('#homeSearch').value.trim());
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
    .filter(c => !q || norm(c.name).includes(q) || c.nodes.some(n => norm(n.card.name).includes(q) || norm(n.card.altName).includes(q)))
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
    return `<div class="combo-item" data-id="${c.id}">
      <div class="thumbs">${thumbs}</div>
      <div class="ci-text"><b>${esc(c.name)}</b><small>${c.nodes.length} carte · ${c.edges.length} passi${date ? ' · ' + date : ''}</small></div>
      <button class="icon-btn" data-more aria-label="Opzioni">${icon('more')}</button>
    </div>`;
  }).join('');
}

async function newCombo() {
  const name = await askText('Nuova combo', `Combo ${data.combos.length + 1}`, 'Crea');
  if (!name) return;
  const c = { id: uid(), name, nodes: [], edges: [], created: Date.now(), updated: Date.now() };
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
  saveJSON(KEY_DATA, data);
  renderHome();
  toast('Combo eliminata');
  return true;
}

/* ---------- Backup ---------- */
const fileName = s => (String(s).replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'combo') + '.json';

async function exportCombos(list, name) {
  const payload = { app: 'combolab', version: 1, exported: new Date().toISOString(), combos: list };
  const file = new File([JSON.stringify(payload, null, 1)], name, { type: 'application/json' });
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

function importCombos() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      const list = Array.isArray(j) ? j : Array.isArray(j.combos) ? j.combos : (j.nodes ? [j] : []);
      const valid = list.filter(c => c && Array.isArray(c.nodes) && Array.isArray(c.edges));
      if (!valid.length) throw new Error('vuoto');
      for (const c of valid) {
        if (!c.id) c.id = uid();
        if (!c.name) c.name = 'Combo importata';
        const i = data.combos.findIndex(x => x.id === c.id);
        if (i >= 0) data.combos[i] = c; else data.combos.push(c);
      }
      saveJSON(KEY_DATA, data);
      renderHome();
      dismissSheet();
      toast(`Importate ${valid.length} combo`);
    } catch {
      toast('File non valido');
    }
  };
  inp.click();
}

function openSettings() {
  openSheet(`<h2>Impostazioni</h2>
    <label class="lbl">Lingua delle carte</label>
    <div class="seg" id="langSeg">
      <button data-lang="it" class="${settings.lang === 'it' ? 'on' : ''}">Italiano</button>
      <button data-lang="en" class="${settings.lang === 'en' ? 'on' : ''}">English</button>
    </div>
    <p class="muted small">La ricerca trova le carte sia col nome italiano sia con quello inglese; la lingua scelta decide quale nome ed effetto vengono mostrati e salvati.</p>
    <label class="lbl">Backup</label>
    <div class="row-btns" style="margin-top:4px">
      <button class="btn" id="expAll">${icon('download')} Esporta tutto</button>
      <button class="btn" id="impBtn">${icon('upload')} Importa</button>
    </div>
    <p class="muted small">Le combo sono salvate solo su questo dispositivo. Fai un backup ogni tanto: se elimini l'app dalla schermata Home, i dati vengono cancellati.</p>
    <p class="muted small">Dati e immagini delle carte: YGOPRODeck. App non ufficiale, per uso personale.</p>`);
  $('#langSeg').onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    settings.lang = b.dataset.lang;
    saveJSON(KEY_SETTINGS, settings);
    [...$('#langSeg').children].forEach(x => x.classList.toggle('on', x === b));
  };
  $('#expAll').onclick = () => {
    if (!data.combos.length) { toast('Nessuna combo da esportare'); return; }
    exportCombos(data.combos, `combolab-backup-${new Date().toISOString().slice(0, 10)}.json`);
  };
  $('#impBtn').onclick = importCombos;
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
  const { id, name, altName, type, frame, desc, atk, def, level, linkval, attribute, race, img, small, crop } = c;
  return { id, name, altName, type, frame, desc, atk, def, level, linkval, attribute, race, img, small, crop };
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
  return `<div class="${cls}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px;--fc:${frameColor(n.card.frame)}">
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

function cardHeadHTML(c) {
  const stats = [];
  if (c.level) stats.push((String(c.frame).startsWith('xyz') ? 'Rango ' : 'Livello ') + c.level);
  if (c.linkval) stats.push('Link-' + c.linkval);
  if (c.atk != null) stats.push('ATK ' + c.atk);
  if (c.def != null) stats.push('DEF ' + c.def);
  return `<div class="card-detail">
      <img src="${esc(c.img || c.small)}" alt="">
      <div style="min-width:0">
        <h2>${esc(c.name)}</h2>
        ${c.altName ? `<p class="meta">${esc(c.altName)}</p>` : ''}
        <p class="meta">${esc([c.type, c.attribute, c.race].filter(Boolean).join(' · '))}</p>
        ${stats.length ? `<p class="meta">${esc(stats.join(' · '))}</p>` : ''}
      </div>
    </div>`;
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
  openSheet(`<h2>${esc(current.name)}</h2><div class="menu">
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
    if (a === 'layout') autoLayout();
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
        ? b[z].map(it => `<button class="bcard" data-z="${z}" data-u="${it.uid}"><img src="${esc(it.card.small)}" alt=""><span>${esc(it.card.name)}</span></button>`).join('')
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
    ${cards.length ? `<label class="lbl">Carte di questa combo</label><div class="results" id="bCards">${cards.map((c, i) => `<button class="result" data-i="${i}"><img src="${esc(c.small)}" alt=""><span>${esc(c.name)}</span></button>`).join('')}</div>` : ''}
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
  $('#newComboBtn').onclick = newCombo;
  $('#settingsBtn').onclick = openSettings;

  $('#backBtn').onclick = () => { if (history.state && history.state.combo) history.back(); else closeEditor(); };
  window.addEventListener('popstate', () => { if (current) closeEditor(); else dismissSheet(); });
  $('#comboName').addEventListener('input', e => { if (current) { current.name = e.target.value.trim() || 'Senza nome'; persist(); } });
  $('#comboName').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  $('#comboMenuBtn').onclick = comboEditorMenu;
  $('#bar').addEventListener('click', e => { const b = e.target.closest('button'); if (b) onBar(b.dataset.act); });
  $('#linkCancel').onclick = cancelLink;
  $('#playPanel').addEventListener('click', onPlayPanel);
  $('#backdrop').addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#sheet').hidden) closeSheet(); else if (linkFrom) cancelLink(); } });
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden && current) persist(); });
  window.addEventListener('resize', () => { if (current) applyView(); });

  setupCanvas();
  renderHome();

  const m = location.hash.match(/^#c=(.+)$/);
  if (m) openEditor(decodeURIComponent(m[1]), false);

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

init();
