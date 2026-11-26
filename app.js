/* App Palestra – versione 1 (modulo Palestra) */
(function () {
  'use strict';
  const SEED = window.SEED || null;   // presente solo nell'anteprima privata; su GitHub i dati si caricano da file
  let P = null, CAT = null;
  const KEY = 'apppalestra.v1';
  const VERSION = '1.6.5';

  // ---------- stato ----------
  let S = load();
  bindData();
  function bindData() { P = S ? S.program : null; CAT = S ? S.catalog : null; }
  function freshState(seed) {
    return {
      v: 2,
      program: seed.program,
      catalog: seed.catalog,
      sessions: seed.history.map(h => JSON.parse(JSON.stringify(h))),
      meta: {},              // per esercizio: {alias, myNote, ladder:[], unilateral, assisted}
      settings: { sound: true, flash: true, autoAdvance: true, bw: 77.5, plates: [15, 5, 2.5] },
      ui: { tab: 'oggi', progWeek: null },
      orderSeq: seed.history.length,
    };
  }
  function load() {
    let st = null;
    try { const raw = localStorage.getItem(KEY); if (raw) st = JSON.parse(raw); } catch (e) { st = null; }
    if (st && !st.program && SEED) { st.program = SEED.program; st.catalog = SEED.catalog; }
    if (st && st.program) { if (st.settings.bw == null) st.settings.bw = 77.5; if (!st.settings.plates) st.settings.plates = [15, 5, 2.5]; return st; }
    return SEED ? freshState(SEED) : null;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast('Spazio pieno: esporta un backup dalle Impostazioni'); }
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // ---------- utilità ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => (n == null || n === '') ? '–' : (Math.round(n * 100) / 100).toString().replace('.', ',');
  const e1 = (w, r) => r == null ? 0 : (w > 0 ? w * (1 + r / 30) : r);
  const wtxt = w => (w == null || w === 0) ? 'PC' : fmt(w);
  const meta = ex => (S.meta[ex] = S.meta[ex] || {});
  const isAssisted = ex => { const m = S.meta[ex]; return (m && m.assisted != null) ? m.assisted : !!(CAT[ex] && CAT[ex].assisted); };
  // carico effettivo: con l'assistenza della macchina conta il peso corporeo meno l'assistenza
  const loadOf = (ex, w) => isAssisted(ex) ? Math.max(1, (S.settings.bw || 77.5) - (w || 0)) : w;
  const e1x = (ex, w, r) => e1(loadOf(ex, w), r);
  const wtx = (ex, w) => isAssisted(ex) ? (w ? 'ass. ' + fmt(w) : 'PC') : wtxt(w);
  const exName = ex => (S.meta[ex] && S.meta[ex].alias) || ex;
  const dayOf = (w, d) => P.weeks[w - 1].days[d];
  const keyOf = (slot, sub) => (sub || slot.ex) + '|' + slot.range;
  const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const clockTxt = ms => { const t = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, sec = t % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sec).padStart(2, '0'); };
  const restTxt = s => s >= 60 ? (s % 60 ? (s / 60).toString().replace('.', ',') : s / 60) + ' min' : s + ' s';
  const TECH = { drop: 'Due drop set (~25% ciascuno)', myo: 'Myo-reps', hold: 'Tenuta statica con carico (30 s)' };
  const ICON = {
    check: '<svg class="check" viewBox="0 0 24 24" fill="none" stroke="#5FD38D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3.5v17l15-8.5z"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="#3DE0E6" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="#FFC94D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5M9 3h6l-1 7 4 3H6l4-3z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="#A9B4C8" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    stopwatch: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2h4M12 2v3"/></svg>',
    list: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  };

  // ---------- storico e record ----------
  function doneSessions() {
    return S.sessions.filter(s => s.status === 'done').sort((a, b) => a.order - b.order);
  }
  // prestazioni passate per una chiave esercizio|range (escluse quelle della sessione attiva)
  function perfs(key) {
    const out = [];
    const since = (S.since || {})[key] || 0;
    for (const s of doneSessions()) {
      if (s.order < since) continue;
      const day = dayOf(s.week, s.day);
      for (const [si, en] of Object.entries(s.entries)) {
        const slot = day.slots[+si];
        if (!slot || keyOf(slot, en.sub) !== key) continue;
        const sets = (en.sets || []).filter(x => x.done && x.r != null);
        if (sets.length) out.push({ s, si: +si, sets, ex: en.sub || slot.ex, note: en.note || en.sessNote || null });
      }
    }
    return out;
  }
  function bestAt(list, i) {
    let best = null;
    for (const p of list) { const x = p.sets[i] || p.sets[p.sets.length - 1]; if (x && x.r != null && (!best || e1x(p.ex, x.w, x.r) > e1x(p.ex, best.w, best.r))) best = x; }
    return best;
  }
  function bestOf(list) {
    let best = null;
    for (const p of list) for (const x of p.sets) if (!best || e1x(p.ex, x.w, x.r) > e1x(p.ex, best.w, best.r)) best = x;
    return best;
  }
  // ---------- DISCHI: bilancieri e macchine a dischi ----------
  const EQUIP = { bar: 'Bilanciere', m2: 'Macchina a dischi, 2 lati', m1: 'Macchina a dischi, 1 lato', none: 'Nessun disegno' };
  function plateCfg(ex, perArm) {
    const q = meta(ex).equip; if (!q || isAssisted(ex)) return null;
    if (perArm && (q.type === 'm2' || q.type === 'm1')) return { mult: 1, base: 0, arm: true };
    if (q.type === 'bar') return { mult: 2, base: q.bar || 0 };
    if (q.type === 'm2') return { mult: 2, base: 0 };
    if (q.type === 'm1') return { mult: 1, base: 0 };
    return null;
  }
  const platesList = () => [...(S.settings.plates || [15, 5, 2.5])].filter(x => x > 0).sort((a, b) => b - a);
  // pesi per lato ottenibili con i dischi (somme possibili, fino a 200 kg per lato)
  function sideSums() {
    const ps = platesList(); const q = 0.25; const max = Math.round(200 / q);
    const ok = new Uint8Array(max + 1); ok[0] = 1;
    for (let v = 0; v <= max; v++) if (ok[v]) for (const p of ps) { const n = v + Math.round(p / q); if (n <= max) ok[n] = 1; }
    const out = []; for (let v = 0; v <= max; v++) if (ok[v]) out.push(v * q); return out;
  }
  function platesFor(ex, total, perArm) {
    const c = plateCfg(ex, perArm); if (!c || total == null) return null;
    const side = +((total - c.base) / c.mult).toFixed(3);
    if (side < 0) return { side, list: [], rest: side, c };
    const list = []; let r = side;
    for (const p of platesList()) while (r >= p - 0.001) { list.push(p); r = +(r - p).toFixed(3); }
    return { side, list, rest: r, c };
  }
  // converte i pesi già registrati di un esercizio da una configurazione all'altra (es. da "un lato" a totale)
  function convertHist(ex, from, to) {
    const f = w => w == null ? w : +((((w - from.base) / from.mult) * to.mult) + to.base).toFixed(2);
    for (const ss of S.sessions) { const d = dayOf(ss.week, ss.day); if (!d) continue;
      for (const [k, e] of Object.entries(ss.entries || {})) { const sl = d.slots[k]; if (!sl || (e.sub || sl.ex) !== ex) continue;
        for (const x of e.sets || []) { x.w = f(x.w); if (x.wL != null) x.wL = f(x.wL); if (x.wR != null) x.wR = f(x.wR); }
        if (e.tech && e.tech.steps) e.tech.steps.forEach(t => { t.w = f(t.w); });
        if (e.recordNew && e.recordNew.w != null) e.recordNew.w = f(e.recordNew.w); } }
    const m = meta(ex); if (m.ladder) m.ladder = m.ladder.map(f);
  }
  function setEquip(ex, q) {
    const m = meta(ex); const old = m.equip; const oldC = plateCfg(ex);
    const raw = { mult: 1, base: 0 };
    m.equip = { type: q.type, bar: q.type === 'bar' ? q.bar : undefined, conv: !!(old && old.conv) };
    const newC = plateCfg(ex);
    if (!m.equip.conv && q.conv && newC) { convertHist(ex, raw, newC); m.equip.conv = true; }
    else if (m.equip.conv && oldC && newC && (oldC.mult !== newC.mult || oldC.base !== newC.base)) convertHist(ex, oldC, newC);
  }
  // disegno del lato da caricare
  const PLATE = { 25: ['#E5484D', 84, 15], 20: ['#3B82F6', 84, 14], 15: ['#F5C542', 76, 13], 10: ['#22A55B', 66, 12], 5: ['#E8EDF5', 50, 10], 2.5: ['#E5484D', 38, 9], 1.25: ['#B9C2D0', 30, 8] };
  function plateSvg(pl) {
    let x = 34; const H = 92, mid = H / 2; let parts = '';
    for (const p of pl.list) {
      const [col, h, w] = PLATE[p] || ['#8995AB', Math.max(26, Math.min(84, 26 + p * 3)), Math.max(8, Math.min(15, 6 + p / 2))];
      parts += `<rect x="${x}" y="${mid - h / 2}" width="${w}" height="${h}" rx="3" fill="${col}" stroke="#0E1726" stroke-width="1.5"/>`;
      x += w + 2;
    }
    const end = Math.max(x + 22, 150);
    const sleeve = `<rect x="22" y="${mid - 6}" width="${end - 22}" height="12" rx="3" fill="#56647D"/>`;
    const stop = pl.c.mult === 2 && pl.c.base ? `<rect x="6" y="${mid - 4}" width="18" height="8" fill="#56647D"/><rect x="20" y="${mid - 16}" width="10" height="32" rx="2" fill="#8995AB"/>` : `<rect x="16" y="${mid - 20}" width="14" height="40" rx="3" fill="#8995AB"/>`;
    return `<svg class="plate-svg" viewBox="0 0 ${end + 4} ${H}" aria-hidden="true">${sleeve}${stop}${parts}</svg>`;
  }
  function renderPlates(ex, x, prev, side) {
    const m = meta(ex);
    if (isAssisted(ex) || (m.equip && m.equip.type === 'none')) return '';
    if (!m.equip) return side === 'R' ? '' : `<button class="plate-set" data-act="equip">🏋 Disegno dischi · imposta</button>`;
    const val = o => o && (side ? (o['w' + side] ?? o.w) : o.w);
    const pl = platesFor(ex, val(x), !!side);
    if (!pl) return `<button class="plate-set" data-act="equip">🏋 Scrivi il peso per vedere come caricare</button>`;
    const one = pl.c.mult === 1;
    const lbl = side ? (side === 'L' ? 'BRACCIO SINISTRO' : 'BRACCIO DESTRO') : one ? 'SUL LATO' : 'PER LATO';
    const txt = pl.list.length ? pl.list.map(fmt).join(' + ') : 'nessun disco';
    let delta = '';
    if (prev && val(prev) != null) {
      const pp = platesFor(ex, val(prev), !!side); const d = +(pl.side - pp.side).toFixed(2);
      delta = d > 0 ? `Rispetto alla serie prima: aggiungi ${fmt(d)}${one ? '' : ' per lato'}` : d < 0 ? `Rispetto alla serie prima: togli ${fmt(-d)}${one ? '' : ' per lato'}` : 'Stesso carico della serie prima';
    }
    const warn = pl.side < 0 ? `<div class="plate-warn">Il peso è inferiore alla barra (${fmt(pl.c.base)} kg)</div>` : pl.rest > 0.001 ? `<div class="plate-warn">Con i tuoi dischi non si arriva esatti: mancano ${fmt(pl.rest)}${one ? '' : ' per lato'}</div>` : '';
    return `<button class="plates" data-act="equip" aria-label="Come caricare: ${lbl.toLowerCase()} ${txt}">
      ${plateSvg(pl)}<div class="plate-txt"><span class="t">${lbl}${pl.c.base ? ' · barra ' + fmt(pl.c.base) : ''}</span><span class="num">${esc(txt)}</span>${delta ? `<span class="d">${delta}</span>` : ''}${warn}</div></button>`;
  }
  let eqDraft = null;
  function equipSheet(ex) {
    const m = meta(ex);
    if (!eqDraft) eqDraft = { ex, type: (m.equip && m.equip.type) || 'bar', bar: (m.equip && m.equip.bar) || (/EZ/i.test(ex) ? 10 : 20), conv: !(m.equip && m.equip.conv) };
    const q = eqDraft; const done = m.equip && m.equip.conv;
    const opt = (t, d) => `<button class="opt" data-act="eqtype" data-v="${t}" aria-pressed="${q.type === t}"><span style="width:18px">${q.type === t ? '●' : '○'}</span><div><div style="font-weight:600">${EQUIP[t]}</div><div class="xs sub">${d}</div></div></button>`;
    let h = `<h3>Attrezzo · ${esc(exName(ex))}</h3><div class="small sub" style="margin:-6px 0 12px">Da ora i kg di questo esercizio sono il <b>peso totale</b>; il disegno ti dice come caricarlo.</div>`;
    h += opt('bar', 'Il totale comprende la barra');
    if (q.type === 'bar') h += `<div class="row" style="gap:8px;margin:-2px 0 10px 28px;flex-wrap:wrap"><span class="xs sub">Peso barra</span>${[20, 15, 10].map(b => `<button class="chipbtn ${q.bar === b ? 'on' : ''}" data-act="eqbar" data-v="${b}">${b} kg${b === 10 ? ' (EZ)' : ''}</button>`).join('')}<button class="chipbtn ${[20, 15, 10].includes(q.bar) ? '' : 'on'}" data-act="eqbar" data-v="custom">${[20, 15, 10].includes(q.bar) ? 'Altro…' : fmt(q.bar) + ' kg'}</button></div>`;
    h += opt('m2', 'Chest press, hack squat, leg press… dischi su entrambi i lati');
    h += opt('m1', 'T-bar row e macchine caricate da una parte sola');
    h += `<div class="xs sub" style="margin:-2px 0 10px 28px">Macchine con i bracci indipendenti usate un braccio alla volta: scegli "2 lati" e nel menu ⋯ attiva "Separa lato sinistro e destro": il disegno mostra cosa caricare su ogni braccio.</div>`;
    h += opt('none', 'Pacco pesi a perno, cavi, manubri');
    if (!done && q.type !== 'none') h += `<button class="opt" data-act="eqconv" style="margin-top:6px"><span style="width:18px;font-size:18px">${q.conv ? '☑' : '☐'}</span><div><div style="font-weight:600">Finora ho segnato il peso di un lato</div><div class="xs sub">Converte una volta lo storico in totali (es. 27,5 → ${q.type === 'm1' ? '27,5' : fmt(27.5 * 2 + (q.type === 'bar' ? q.bar : 0))}), così record e suggerimenti restano giusti</div></div></button>`;
    if (done) h += `<div class="xs sub" style="margin:4px 0 10px">Lo storico è già stato convertito in totali.</div>`;
    h += `<button class="btn" data-act="eqsave" style="margin-top:6px">Salva</button>`;
    sheet(h);
  }
  function ladderFor(ex) {
    const pc = plateCfg(ex, meta(ex).unilateral);
    if (pc) return sideSums().map(v => +(pc.base + v * pc.mult).toFixed(2));
    const set = new Set((meta(ex).ladder || []));
    for (const s of S.sessions) {
      const day = dayOf(s.week, s.day);
      for (const [si, en] of Object.entries(s.entries)) {
        const slot = day.slots[+si];
        if (!slot) continue;
        if ((en.sub || slot.ex) !== ex) continue;
        for (const x of en.sets || []) if (x.done && x.w != null) set.add(x.w);
      }
    }
    return [...set].sort((a, b) => a - b);
  }
  function stepOf(lad) {
    const d = [];
    for (let i = 1; i < lad.length; i++) { const v = +(lad[i] - lad[i - 1]).toFixed(2); if (v > 0) d.push(v); }
    if (!d.length) return 2.5;
    d.sort((a, b) => a - b);
    return d[0];
  }
  function weightUp(ex, w) {
    const lad = ladderFor(ex);
    const st = stepOf(lad);
    const higher = lad.find(x => x > w + 0.001);
    if (higher != null && higher - w <= st * 1.5 + 0.001) return higher;
    return +(w + st).toFixed(2);
  }
  function weightDown(ex, w) {
    const lad = ladderFor(ex);
    const st = stepOf(lad);
    const lower = [...lad].reverse().find(x => x < w - 0.001);
    if (lower != null && w - lower <= st * 1.5 + 0.001) return lower;
    return Math.max(0, +(w - st).toFixed(2));
  }
  function roundToLadder(ex, w) {
    const lad = ladderFor(ex);
    if (!lad.length) return Math.round(w * 2) / 2;
    let best = lad[0];
    for (const x of lad) if (Math.abs(x - w) < Math.abs(best - w)) best = x;
    return best;
  }

  // suggerimento per la serie i: {w, r, rir, why, up}
  function suggest(slot, i, sub) {
    const ex = sub || slot.ex;
    const key = keyOf(slot, sub);
    const list = perfs(key);
    const rir = slot.rir[i] ?? null;
    if (!list.length) return { w: null, r: slot.lo, rir, why: 'Prima volta: scegli un carico con cui arrivi a ' + slot.range + ' rip.' };
    const lastP = list[list.length - 1];
    const last = lastP.sets[i] || lastP.sets[lastP.sets.length - 1];
    const best = bestAt(list, i);   // record della stessa serie (la 2ª si confronta con le 2ª serie)
    const lo = slot.lo, hi = slot.hi;
    if (last.w == null) return { w: null, r: Math.min(hi, (last.r || lo) + 1), rir, why: 'Aggiungi una ripetizione rispetto all\'ultima volta.' };
    if (last.next === 'back' && last.prevW != null) {
      const r = (last.prevR || lo) + 1;
      return { w: last.prevW, r, rir, why: 'L\'ultima volta hai provato ' + fmt(last.w) + ' kg × ' + last.r + ' e hai scelto di tornare a ' + fmt(last.prevW) + ' kg: una ripetizione in più rispetto a prima.', alt: { w: last.w, r: last.r + 1, lbl: 'Resta a ' + fmt(last.w) } };
    }
    if (isAssisted(ex)) return suggestAssisted(ex, list, last, best, lo, hi, rir);
    if (last.r >= hi) {
      if (last.w === 0) return { w: 0, r: last.r + 1, rir, why: 'A corpo libero: una ripetizione in più.' };
      // range chiuso: due strade (salire di peso o aggiungere una ripetizione). Consiglia quella giusta
      // in base alle ripetizioni previste al peso nuovo con la forza dell'ultima volta; l'altra resta sceglibile.
      const next = weightUp(ex, last.w);
      const repsAt = (E, w) => Math.max(1, Math.round(30 * (E / w - 1)));
      // forza di riferimento: l'ultima volta o il migliore di tutte le serie, se più alto
      const top = bestOf(list);
      const Eref = Math.max(e1(last.w, last.r), top && top.w ? e1(top.w, top.r) : 0);
      const pr = repsAt(Eref, next);
      const pct = Math.round((next - last.w) / last.w * 100);
      if (pr >= lo || last.r >= hi + 6) {
        const g = { w: next, r: Math.max(lo, Math.min(pr, hi)), rir, up: true };
        g.why = 'Hai chiuso il range (' + last.r + ' rip). A ' + fmt(next) + ' kg (+' + pct + '%) dovresti fare circa ' + pr + ' rip, dentro il range: consiglio di salire.';
        g.alt = { w: last.w, r: last.r + 1, lbl: 'Resta a ' + fmt(last.w) };
        return g;
      }
      const g = { w: last.w, r: last.r + 1, rir };
      g.why = 'Hai chiuso il range (' + last.r + ' rip), ma a ' + fmt(next) + ' kg (+' + pct + '%) faresti circa ' + pr + ' rip, sotto ' + lo + ': consiglio di restare e aggiungere una ripetizione.';
      g.alt = { w: next, r: repsAt(e1(g.w, g.r), next), lbl: 'Sali a ' + fmt(next) };
      return g;
    }
    if (!last.w) {
      // corpo libero: si confronta solo con le serie a corpo libero
      const bw = Math.max(0, ...list.flatMap(p => p.sets.filter(x => !x.w).map(x => x.r || 0)));
      return { w: last.w, r: Math.max(last.r + 1, bw > last.r ? bw : 0), rir, why: bw > last.r ? 'A corpo libero: obiettivo superare il tuo massimo (' + bw + ' rip).' : 'A corpo libero: una ripetizione in più.' };
    }
    const lastE = e1(last.w, last.r);
    if (best && best.w && e1(best.w, best.r) > lastE + 0.01) {
      const need = Math.floor(30 * (e1(best.w, best.r) / last.w - 1)) + 1;
      const r = Math.min(hi + 2, Math.max(last.r + 1, need));
      return { w: last.w, r, rir, why: 'L\'ultima volta sei calato: stesso peso, obiettivo battere il record (' + wtxt(best.w) + ' × ' + best.r + ').' };
    }
    return { w: last.w, r: Math.min(hi, last.r + 1), rir, why: 'Stesso peso, una ripetizione in più verso ' + hi + '.' };
  }
  function suggestAssisted(ex, list, last, best, lo, hi, rir) {
    if (last.r >= hi) {
      if (!last.w) return { w: 0, r: last.r + 1, rir, up: true, why: 'Già senza assistenza: una ripetizione in più.' };
      const next = weightDown(ex, last.w);
      const jump = (loadOf(ex, next) - loadOf(ex, last.w)) / loadOf(ex, last.w);
      if (jump <= 0.12 || last.r >= hi + 3) return { w: next, r: lo, rir, up: true, why: 'Hai chiuso il range: togli assistenza (' + (next ? fmt(next) + ' kg' : 'nessuna') + ') e riparti da ' + lo + '.' };
      return { w: last.w, r: last.r + 1, rir, why: 'Togliere assistenza ora è un salto grande: prima aggiungi una ripetizione.' };
    }
    const bE = best ? e1x(ex, best.w, best.r) : 0, lE = e1x(ex, last.w, last.r);
    if (bE > lE + 0.01) {
      const need = Math.floor(30 * (bE / loadOf(ex, last.w) - 1)) + 1;
      return { w: last.w, r: Math.min(hi + 2, Math.max(last.r + 1, need)), rir, why: 'L\'ultima volta sei calato: stessa assistenza, obiettivo battere il record (' + wtx(ex, best.w) + ' × ' + best.r + ').' };
    }
    return { w: last.w, r: Math.min(hi, last.r + 1), rir, why: 'Stessa assistenza, una ripetizione in più verso ' + hi + '.' };
  }
  // obiettivo per la serie i con il peso scelto ora: stesso "sforzo" del suggerimento, ripetizioni ricalcolate
  // obiettivo della serie i tenendo conto delle serie già fatte oggi: se una serie precedente è andata
  // sotto l'obiettivo, quello della serie i si abbassa nella stessa proporzione (mai alzato)
  function suggestToday(slot, i, en) {
    const g = suggest(slot, i, en && en.sub);
    if (!en || i === 0 || g.w == null || g.r == null) return g;
    const ex = en.sub || slot.ex;
    if (!g.w && !isAssisted(ex)) return g;
    for (let j = i - 1; j >= 0; j--) {
      const x = en.sets[j]; if (!x || !x.done || x.r == null) continue;
      const plan = suggest(slot, j, en.sub); if (plan.w == null || plan.r == null || (!plan.w && !isAssisted(ex))) return g;
      const ratio = e1x(ex, x.w, x.r) / e1x(ex, plan.w, plan.r);
      if (!(ratio < 0.995)) return g;
      let w = g.w, up = g.up;
      const repsAt = ww => Math.max(1, Math.round(30 * (e1x(ex, g.w, g.r) * ratio / loadOf(ex, ww) - 1)));
      let r = repsAt(w);
      if (up && r < slot.lo) { const prevW = isAssisted(ex) ? weightUp(ex, w) : weightDown(ex, w); if (prevW !== w && loadOf(ex, prevW) > 0) { w = prevW; r = repsAt(w); up = false; } }
      if (r >= g.r && w === g.w) return g;
      return { w, r, rir: g.rir, up: false, why: 'La serie ' + (j + 1) + ' di oggi è andata sotto l\'obiettivo (' + wtx(ex, x.w) + ' × ' + x.r + ' invece di ' + wtx(ex, plan.w) + ' × ' + plan.r + '): obiettivo abbassato in proporzione.' };
    }
    return g;
  }
  function targetFor(slot, i, sub, w, en) {
    const ex = sub || slot.ex;
    const g = en ? suggestToday(slot, i, en) : suggest(slot, i, sub);
    if (g.w == null || g.r == null || w == null) return null;
    if (w === g.w) return { w, r: g.r, rir: g.rir, same: true };
    if (g.alt && w === g.alt.w) return { w, r: g.alt.r, rir: g.rir, same: false, alt: true };
    const L = loadOf(ex, w), E = e1x(ex, g.w, g.r);
    if (!(L > 0) || (!g.w && !isAssisted(ex))) return null;
    const r = Math.max(1, Math.min(slot.hi + 4, Math.round(30 * (E / L - 1))));
    return { w, r, rir: g.rir, same: false };
  }
  function retarget(slot, en, i) {
    const x = en.sets[i]; const t = targetFor(slot, i, en.sub, x.w, en);
    if (t) x.r = t.r;
  }
  function fatigue(key) {
    const list = perfs(key);
    if (list.length < 3) return false;
    const v = list.slice(-3).map(p => e1x(p.ex, p.sets[0].w, p.sets[0].r));
    if (list.slice(-3).some(p => !p.sets[0].w && !isAssisted(p.ex))) return false;
    return v[2] < v[1] - 0.01 && v[1] < v[0] - 0.01;
  }
  function warmups(slot, workW) {
    if (isAssisted(slot.ex)) return [];
    const n = parseInt(String(slot.warmup).split('-').pop(), 10) || 0;
    if (!n || !workW) return [];
    const plan = { 1: [[0.6, 6]], 2: [[0.5, 8], [0.75, 4]], 3: [[0.4, 8], [0.6, 5], [0.8, 3]] }[Math.min(n, 3)];
    return plan.map(([p, r]) => ({ w: roundToLadder(slot.ex, workW * p), r }));
  }

  // ---------- programma: prossimo allenamento ----------
  function sessionFor(w, d) { return S.sessions.find(s => s.week === w && s.day === d && s.status === 'done'); }
  function activeSession() { return S.sessions.find(s => s.status === 'active'); }
  function nextWorkout() {
    // il primo giorno dopo l'ultimo giorno completato, nell'ordine del programma
    let lastIdx = -1, idx = 0;
    const seq = [];
    P.weeks.forEach(wk => wk.days.forEach((d, di) => { if (!d.rest) seq.push({ w: wk.week, d: di }); }));
    seq.forEach((x, i) => { if (sessionFor(x.w, x.d)) lastIdx = i; });
    idx = lastIdx + 1;
    return seq[idx] || null;
  }
  function weekStats(w) {
    const days = P.weeks[w - 1].days.map((d, di) => ({ d, di })).filter(x => !x.d.rest);
    const done = days.filter(x => sessionFor(w, x.di)).length;
    let sets = 0, records = 0;
    for (const s of S.sessions) if (s.week === w && s.status === 'done') {
      for (const en of Object.values(s.entries)) sets += (en.sets || []).filter(x => x.done).length;
      records += s.records || 0;
    }
    return { done, total: days.length, sets, records };
  }

  // ---------- sessione attiva ----------
  function startSession(w, d) {
    const cur = activeSession();
    if (cur) { openWorkout(); return; }
    const day = dayOf(w, d);
    const s = { id: 's' + Date.now(), week: w, day: d, status: 'active', startedAt: Date.now(), entries: {}, seq: day.slots.map((_, i) => i), cur: 0, rest: null };
    S.sessions.push(s);
    ensureEntry(s, 0);
    save(); openWorkout();
  }
  function ensureEntry(s, si) {
    if (s.entries[si]) return s.entries[si];
    const slot = dayOf(s.week, s.day).slots[si];
    const en = { sets: [], sub: subFor(s, si), warmDone: false, sessNote: '', tech: null, complete: false };
    fillSets(s, si, en);
    s.entries[si] = en;
    return en;
  }
  // variante da proporre: quella scelta oggi su un altro esercizio uguale, altrimenti quella dell'ultima volta
  function subFor(s, si) {
    const day = dayOf(s.week, s.day); const slot = day.slots[si];
    for (const k of Object.keys(s.entries)) { if (day.slots[k] && day.slots[k].ex === slot.ex) return s.entries[k].sub || null; }
    const list = doneSessions();
    let any;
    for (let j = list.length - 1; j >= 0; j--) {
      const ss = list[j]; const d = dayOf(ss.week, ss.day); if (!d) continue;
      for (const [k, e] of Object.entries(ss.entries || {})) {
        const sl = d.slots[k]; if (!sl || sl.ex !== slot.ex || !(e.sets || []).some(x => x.done)) continue;
        if (sl.range === slot.range) return e.sub || null;
        if (any === undefined) any = e.sub || null;
      }
      if (any !== undefined) return any;
    }
    return null;
  }
  // varianti scritte a mano già usate per questo esercizio
  function customSubs(ex) {
    const known = new Set(((CAT[ex] || {}).subs || []).map(x => x.name));
    const out = [];
    for (const ss of S.sessions) { const d = dayOf(ss.week, ss.day); if (!d) continue;
      for (const [k, e] of Object.entries(ss.entries || {})) { const sl = d.slots[k];
        if (sl && sl.ex === ex && e.sub && !known.has(e.sub) && !out.includes(e.sub)) out.push(e.sub); } }
    return out;
  }
  // applica la variante anche agli altri esercizi uguali di oggi non ancora iniziati
  function applySub(s, si, sub) {
    const day = dayOf(s.week, s.day); const ex = day.slots[si].ex; let n = 0;
    const en = ensureEntry(s, si); en.sub = sub; fillSets(s, si, en); en.tech = null;
    for (const k of s.seq) { if (k === si || day.slots[k].ex !== ex) continue;
      const e = s.entries[k]; if (e && e.sets.some(x => x.done)) continue;
      if (e) { e.sub = sub; fillSets(s, k, e); e.tech = null; } n++; }
    if (n) toast('Applicata anche a ' + n + (n > 1 ? ' altri esercizi uguali' : ' altro esercizio uguale') + ' di oggi');
  }
  function fillSets(s, si, en) {
    const slot = dayOf(s.week, s.day).slots[si];
    en.sets = [];
    for (let i = 0; i < slot.sets; i++) {
      const g = suggest(slot, i, en.sub);
      en.sets.push({ w: g.w, r: g.r, rir: null, done: false });
    }
  }
  function slotDoneCount(en) { return (en.sets || []).filter(x => x.done).length; }
  function slotComplete(s, si) {
    const en = s.entries[si];
    if (!en) return false;
    const slot = dayOf(s.week, s.day).slots[si];
    const setsDone = slotDoneCount(en) >= slot.sets;
    const tech = techFor(s, si);
    return setsDone && (!tech || (en.tech && en.tech.done));
  }
  function techFor(s, si) { return dayOf(s.week, s.day).slots[si].tech; }
  function nextIncomplete(s, from) {
    const ord = s.seq;
    const pos = ord.indexOf(from);
    for (let k = 1; k <= ord.length; k++) {
      const si = ord[(pos + k) % ord.length];
      if (!slotComplete(s, si)) return si;
    }
    return null;
  }
  function goSlot(si) {
    const s = activeSession(); if (!s) return;
    s.cur = si; ensureEntry(s, si); save(); render();
    window.scrollTo({ top: 0 });
  }
  function completeSet(si, i) {
    const s = activeSession();
    const day = dayOf(s.week, s.day);
    const slot = day.slots[si];
    const en = ensureEntry(s, si);
    const set = en.sets[i];
    if (set.r == null) { toast('Inserisci le ripetizioni'); return; }
    if (set.rir == null) set.rir = slot.rir[i];
    set.done = true; set.ts = Date.now();
    if (set.w != null) { const m = meta(en.sub || slot.ex); m.ladder = [...new Set([...(m.ladder || []), set.w])]; }
    unlockAudio();
    delete set.askNext; delete set.next; delete set.prevW; delete set.prevR;
    if (!isAssisted(en.sub || slot.ex) && set.w) {
      const lp = perfs(keyOf(slot, en.sub)).slice(-1)[0];
      const ls = lp && (lp.sets[i] || lp.sets[lp.sets.length - 1]);
      if (ls && ls.w != null && set.w > ls.w && set.r >= slot.lo) { set.askNext = true; set.next = 'keep'; set.prevW = ls.w; set.prevR = ls.r; }
    }
    // le serie successive ancora come da suggerimento si adeguano a com'è andata questa
    for (let k = i + 1; k < en.sets.length; k++) {
      const y = en.sets[k]; if (y.done) continue;
      const base = suggest(slot, k, en.sub); if (y.w !== base.w || y.r !== base.r) continue;
      const adj = suggestToday(slot, k, en); y.w = adj.w; y.r = adj.r;
    }
    // superserie: passa al compagno senza recupero
    if (slot.group) {
      const mates = s.seq.filter(x => day.slots[x].group === slot.group);
      const myDone = slotDoneCount(en);
      const after = mates.slice(mates.indexOf(si) + 1);
      const partner = after.find(m => { const e = ensureEntry(s, m); return slotDoneCount(e) < myDone && slotDoneCount(e) < day.slots[m].sets; });
      if (partner != null) { save(); toast('Superserie → ' + exName(day.slots[partner].ex)); goSlot(partner); return; }
      const restSec = Math.max(...mates.map(m => day.slots[m].rest));
      const back = mates.find(m => slotDoneCount(ensureEntry(s, m)) < day.slots[m].sets);
      startRest(restSec, si);
      if (back != null) { s.cur = back; ensureEntry(s, back); }
      save(); render(); return;
    }
    const allDone = slotDoneCount(en) >= slot.sets;
    if (allDone && slot.tech && !en.tech) en.tech = newTech(slot, en);
    startRest(slot.rest, si);
    save(); render();
  }
  function newTech(slot, en) {
    const last = [...en.sets].reverse().find(x => x.done) || {};
    const ex = en.sub || slot.ex;
    if (slot.tech === 'drop') {
      const d1 = last.w ? roundDown(ex, last.w * 0.75) : null;
      const d2 = d1 ? roundDown(ex, d1 * 0.75) : null;
      return { type: 'drop', steps: [{ w: d1, r: Math.max(4, (last.r || 8) - 2), done: false }, { w: d2, r: Math.max(4, (last.r || 8) - 3), done: false }], done: false };
    }
    if (slot.tech === 'myo') return { type: 'myo', mini: [], r: 4, done: false };
    return { type: 'hold', endAt: null, done: false };
  }
  function roundDown(ex, w) {
    const lad = ladderFor(ex).filter(x => x <= w + 0.001);
    return lad.length ? lad[lad.length - 1] : Math.floor(w * 2) / 2;
  }

  // ---------- recupero ----------
  let tick = null, warned = false;
  function startRest(sec, si) {
    const s = activeSession();
    if (!sec) { s.rest = null; return; }
    s.rest = { endAt: Date.now() + sec * 1000, total: sec, slot: si };
    warned = false;
    ensureTick();
  }
  function ensureTick() {
    if (tick) return;
    tick = setInterval(onTick, 250);
  }
  function onTick() {
    const s = activeSession();
    if (!s || !s.rest) { clearInterval(tick); tick = null; return; }
    const left = (s.rest.endAt - Date.now()) / 1000;
    const t = $('#rest-time'); const f = $('#rest-fill');
    if (t) t.textContent = mmss(left);
    if (f) f.style.width = Math.max(0, Math.min(100, 100 * left / s.rest.total)) + '%';
    const lr = $('#live-rest'); if (lr) lr.textContent = mmss(left);
    if (left <= 10 && left > 0 && !warned) { warned = true; alertWarn(); }
    if (left <= 0) endRest(true);
  }
  function endRest(natural) {
    const s = activeSession(); if (!s || !s.rest) return;
    s.rest = null;
    if (natural) {
      alertEnd();
      if (S.settings.autoAdvance && slotComplete(s, s.cur)) {
        const n = nextIncomplete(s, s.cur);
        if (n != null) { s.cur = n; ensureEntry(s, n); toast('Avanti: ' + exName(dayOf(s.week, s.day).slots[n].ex)); }
      }
    }
    save(); render();
  }
  // ---------- avvisi: suono, lampeggio, vibrazione ----------
  // Il suono passa da un elemento <audio> (non dalla Web Audio), così su iPhone si sente anche con il silenzioso.
  function wavBeeps(list) {
    const rate = 22050; let total = 0; list.forEach(b => { total += b.d + (b.gap || 0); });
    const n = Math.ceil(total * rate), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    let t0 = 0;
    for (const b of list) {
      const len = Math.floor(b.d * rate), start = Math.floor(t0 * rate);
      for (let i = 0; i < len && start + i < n; i++) {
        const env = Math.min(1, i / 200, (len - i) / 400);
        v.setInt16(44 + (start + i) * 2, Math.sin(2 * Math.PI * b.f * i / rate) * 0.8 * env * 32767, true);
      }
      t0 += b.d + (b.gap || 0);
    }
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }
  const SND = {};
  let audioReady = false;
  function unlockAudio() {
    if (audioReady) return;
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
      SND.warn = new Audio(wavBeeps([{ f: 880, d: 0.15 }]));
      SND.end = new Audio(wavBeeps([{ f: 880, d: 0.18, gap: 0.08 }, { f: 880, d: 0.18, gap: 0.08 }, { f: 1175, d: 0.35 }]));
      for (const a of Object.values(SND)) { a.preload = 'auto'; a.volume = 0; a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = 1; }).catch(() => { a.volume = 1; }); }
      audioReady = true;
    } catch (e) { audioReady = false; }
  }
  function play(name) {
    const a = SND[name]; if (!a) return;
    try { a.currentTime = 0; a.volume = 1; a.play().catch(() => {}); } catch (e) { /* niente suono */ }
  }
  // vibrazione: su iPhone il web non può vibrare davvero; si usa il "tocco" dell'interruttore di sistema dove iOS lo permette
  let hapticEl = null;
  function haptic() {
    try {
      if (navigator.vibrate) { navigator.vibrate(120); return; }
      if (!hapticEl) {
        hapticEl = document.createElement('label'); hapticEl.style.cssText = 'position:fixed;left:-99px;top:0;opacity:0;pointer-events:none';
        hapticEl.innerHTML = '<input type="checkbox" switch>'; document.body.appendChild(hapticEl);
      }
      hapticEl.click();
    } catch (e) { /* non supportato */ }
  }
  function flash(times, ms) {
    const d = document.createElement('div'); d.className = 'flash';
    d.style.animation = `flash ${ms}ms ease-out ${times}`; document.body.appendChild(d);
    setTimeout(() => d.remove(), times * ms + 100);
  }
  function alertWarn() {
    if (S.settings.sound) play('warn');
    if (S.settings.flash) flash(3, 180);
    if (S.settings.vibe !== false) haptic();
  }
  function alertEnd() {
    if (S.settings.sound) play('end');
    if (S.settings.flash) flash(5, 180);
    if (S.settings.vibe !== false) haptic();
  }
  function beep() { play('warn'); }

  // schermo sempre acceso durante l'allenamento
  let wake = null;
  async function keepAwake(on) {
    try {
      if (on && !wake && 'wakeLock' in navigator && document.visibilityState === 'visible') {
        wake = await navigator.wakeLock.request('screen');
        wake.addEventListener('release', () => { wake = null; });
      } else if (!on && wake) { await wake.release(); wake = null; }
    } catch (e) { wake = null; }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && S) { if (activeSession()) keepAwake(true); onTick(); render(); }
  });

  // ---------- UI di base ----------
  let view = 'tabs'; // 'tabs' | 'workout' | 'summary'
  let summary = null;
  function openWorkout() { view = 'workout'; render(); window.scrollTo({ top: 0 }); }
  function toast(msg, actLabel, fn) {
    const old = $('.toast'); if (old) old.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    if (actLabel) {
      const b = document.createElement('button'); b.textContent = actLabel;
      b.style.cssText = 'margin-left:12px;font-weight:800;color:#2F6BFF;text-decoration:underline;min-height:32px';
      b.addEventListener('click', ev => { ev.stopPropagation(); t.remove(); fn(); });
      t.appendChild(b); t.style.pointerEvents = 'auto';
    }
    document.body.appendChild(t);
    setTimeout(() => t.remove(), actLabel ? 6000 : 2200);
  }
  function sheet(html, onMount, top) {
    closeSheet();
    const sc = document.createElement('div'); sc.className = 'scrim' + (top ? ' top' : ''); sc.id = 'scrim';
    sc.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div>';
    sc.addEventListener('click', e => { if (e.target === sc) closeSheet(); });
    document.body.appendChild(sc);
    if (onMount) onMount(sc);
  }
  let pending = null;
  function closeSheet() { const s = $('#scrim'); if (s) s.remove(); if (pending) { const p = pending; pending = null; p(null); } }
  // dialoghi dentro l'app (al posto di confirm/prompt del browser)
  function ask(title, msg, ok, danger) {
    return new Promise(res => {
      sheet(`<h3>${esc(title)}</h3>${msg ? `<div class="small sub" style="margin:-6px 0 14px;line-height:1.4">${esc(msg)}</div>` : ''}
        <button class="btn ${danger ? 'danger' : ''}" data-act="ask-ok" style="${danger ? '' : ''}">${esc(ok || 'Sì')}</button><div style="height:8px"></div><button class="btn ghost" data-act="ask-no">Annulla</button>`);
      pending = v => res(!!v);
    });
  }
  function askInput(title, value, numeric) {
    return new Promise(res => {
      sheet(`<h3>${esc(title)}</h3><input id="ask-in" class="${numeric ? 'bignum' : ''}" type="text" ${numeric ? 'inputmode="decimal"' : ''} value="${esc(value ?? '')}" autocomplete="off"><div style="height:10px"></div><button class="btn" data-act="input-ok">Conferma</button>`,
        sc => { const i = $('#ask-in', sc); i.focus(); i.select(); i.addEventListener('keydown', e => { if (e.key === 'Enter') $('[data-act=input-ok]', sc).click(); }); }, true);
      pending = v => res(v);
    });
  }
  function resolvePending(v) { const p = pending; pending = null; const sc = $('#scrim'); if (sc) sc.remove(); if (p) p(v); }

  function render() {
    const app = $('#app');
    if (!S) { app.innerHTML = renderWelcome(); return; }
    const s = activeSession();
    if (view === 'workout' && s) { app.innerHTML = renderWorkout(s); keepAwake(true); if (s.rest) ensureTick(); scrollChip(); return; }
    keepAwake(false);
    if (view === 'summary' && summary) { app.innerHTML = renderSummary(); requestAnimationFrame(animateSummary); return; }
    if (view === 'edit' && draft) { app.innerHTML = renderEdit(); return; }
    view = 'tabs';
    const tab = S.ui.tab;
    const body = tab === 'oggi' ? renderOggi() : tab === 'programmi' ? renderProgrammi() : tab === 'progressi' ? renderProgressi() : renderImpostazioni();
    app.innerHTML = (s ? renderLiveBar(s) : '') + body + renderTabbar(tab);
    if (s && s.rest) ensureTick();
  }
  function renderLiveBar(s) {
    const day = dayOf(s.week, s.day);
    const left = s.rest ? (s.rest.endAt - Date.now()) / 1000 : null;
    return `<button class="livebar" data-act="resume" style="--c:${day.color}" aria-label="Torna all'allenamento in corso">
      <span class="dot" style="background:${day.color}"></span><span class="grow" style="text-align:left"><b>${esc(day.name)}</b> in corso · <span id="live-clock" class="num">${clockTxt(Date.now() - s.startedAt)}</span></span>
      ${s.rest ? `<span class="pill" style="background:#23365A">Recupero <span id="live-rest" class="num" style="font-size:17px">${mmss(left)}</span></span>` : ''}<span style="font-size:20px">›</span></button>`;
  }
  function scrollChip() {
    const c = $('.chip.now'); if (c) c.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  function renderTabbar(tab) {
    const items = [
      ['oggi', 'Oggi', '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>'],
      ['programmi', 'Programmi', '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>'],
      ['progressi', 'Progressi', '<path d="M3 20h18M6 16l4-5 3 3 5-7"/>'],
      ['impostazioni', 'Impostazioni', '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'],
    ];
    return '<nav class="tabbar" aria-label="Sezioni">' + items.map(([k, l, p]) =>
      `<button data-act="tab" data-v="${k}" ${tab === k ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>${l}</button>`).join('') + '</nav>';
  }

  function renderWelcome() {
    return `<div class="page" style="display:flex;flex-direction:column;gap:16px;padding-top:calc(var(--safe-top) + 60px)">
      <img src="icons/icon-192.png" alt="" width="84" height="84" style="border-radius:20px">
      <h1 class="cond" style="font-size:44px">App Palestra</h1>
      <div class="sub" style="line-height:1.5">Per iniziare carica il file con il tuo programma e il tuo storico (<b style="color:#fff">app-palestra-dati.json</b>). Va fatto solo la prima volta: poi i dati restano su questo iPhone.</div>
      <label class="btn" style="display:flex;align-items:center;justify-content:center;cursor:pointer">Carica il file dei dati<input type="file" accept="application/json,.json" data-act="import" hidden></label>
      <div class="xs sub" style="line-height:1.5">Hai un backup fatto dall'app? Puoi caricare anche quello da qui.</div></div>`;
  }

  // ---------- OGGI ----------
  function renderOggi() {
    const nw = nextWorkout();
    const act = activeSession();
    const wk = act ? act.week : nw ? nw.w : P.weeks.length;
    const st = weekStats(wk);
    let today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); today = today.charAt(0).toUpperCase() + today.slice(1);
    let h = `<div class="page"><div class="sub small" style="font-weight:600;padding-left:4px">${esc(today)}</div><h1 class="cond page-title" style="margin-top:2px">Oggi</h1>`;
    h += `<div class="section" style="margin-top:4px"><span class="label">Settimana ${wk} del programma</span><div class="tiles">
      <div class="tile"><span class="xs sub" style="font-weight:600">Palestra</span><span class="num big" style="font-weight:800">${st.done}/${st.total}</span>
      <div style="display:grid;grid-template-columns:repeat(${st.total},minmax(0,1fr));gap:3px;margin-top:4px">${P.weeks[wk - 1].days.map((d, di) => d.rest ? '' : `<span style="height:5px;border-radius:3px;${sessionFor(wk, di) ? 'background:' + d.color : 'border:1px dashed #5A6A86'}"></span>`).join('')}</div></div>
      <div class="tile"><span class="xs sub" style="font-weight:600">Serie fatte</span><span class="num big" style="font-weight:800">${st.sets}</span><span class="xs sub">questa settimana</span></div>
      <div class="tile"><span class="xs sub" style="font-weight:600">Record</span><span class="num big" style="font-weight:800;color:var(--gold)">${st.records}</span><span class="xs sub">battuti</span></div>
    </div></div>`;
    h += `<div class="section"><span class="label">${act ? 'Allenamento in corso' : 'Prossimo allenamento'}</span>`;
    const target = act ? { w: act.week, d: act.day } : nw;
    if (target) {
      const day = dayOf(target.w, target.d);
      const exs = [...new Set(day.slots.map(x => exName(x.ex)))];
      h += `<div style="border-radius:22px;overflow:hidden;background:var(--card)">
        <div style="background:${day.color};padding:14px 16px;display:flex;justify-content:space-between;align-items:flex-end;gap:8px">
          <div><div class="xs" style="font-weight:700">PALESTRA · SETT. ${target.w}${P.weeks[target.w - 1].deload ? ' · SCARICO' : ''}</div><div class="cond" style="font-size:34px;margin-top:2px">${esc(day.name)}</div></div>
          <div class="small" style="font-weight:600;text-align:right">${exs.length} esercizi<br>~${estMinutes(day)} min</div></div>
        <div style="padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px">
          <div class="small" style="color:var(--soft);line-height:1.45">${exs.map(esc).join(' · ')}</div>
          <button class="btn" data-act="${act ? 'resume' : 'start'}" data-w="${target.w}" data-d="${target.d}">${act ? 'Riprendi · in corso da ' + clockTxt(Date.now() - act.startedAt) : 'Inizia'}</button>
        </div></div>`;
    } else {
      h += `<div class="card">Programma completato. Complimenti!</div>`;
    }
    h += `<div class="state todo" style="margin-top:10px;min-height:56px"><span class="dot" style="background:var(--cyan)"></span><span class="grow"><b style="color:#fff">Corsa</b><br><span class="xs">Arriva nella prossima versione dell'app</span></span></div>`;
    h += `</div>`;
    const nDone = doneSessions().filter(s => s.src !== 'excel').length;
    const days = S.lastBackup ? Math.floor((Date.now() - S.lastBackup) / 86400000) : null;
    if (nDone && (days == null || days >= 7)) {
      h += `<div class="section"><div class="card" style="display:flex;align-items:center;gap:12px;border:1.5px solid #6B5A1E"><div class="grow"><div style="font-weight:700">Fai un backup</div><div class="xs sub">${days == null ? 'Non hai ancora salvato i tuoi dati fuori dal telefono.' : 'Ultimo backup ' + days + ' giorni fa.'}</div></div><button class="btn" style="width:auto;height:44px;padding:0 16px;font-size:15px" data-act="export">Esporta</button></div></div>`;
    }
    const last = doneSessions().filter(s => s.src !== 'excel').slice(-1)[0];
    if (last) {
      const day = dayOf(last.week, last.day);
      h += `<div class="section"><span class="label">Ultimo allenamento</span><button class="state done" data-act="editsess" data-v="${esc(last.id)}" style="width:100%;text-align:left"><span class="dot" style="background:${day.color}"></span><span class="grow">${esc(day.name)} · sett. ${last.week}</span><span class="xs">${new Date(last.endedAt).toLocaleDateString('it-IT')} · modifica</span>${ICON.check}</button></div>`;
    }
    return h + '</div>';
  }
  function estMinutes(day) {
    let sec = 0;
    for (const s of day.slots) sec += s.sets * (s.rest + 50) + 60;
    return Math.round(sec / 60 / 5) * 5;
  }

  // ---------- PROGRAMMI ----------
  function renderProgrammi() {
    const nw = nextWorkout();
    const curWeek = activeSession() ? activeSession().week : nw ? nw.w : 12;
    const sel = S.ui.progWeek || curWeek;
    let h = `<div class="page"><h1 class="cond page-title">Programmi</h1>`;
    h += `<div class="card"><div class="row" style="align-items:flex-start"><div class="grow"><div class="xs" style="font-weight:700;color:var(--green)">ATTIVO</div>
      <div class="cond" style="font-size:28px;margin-top:2px">${esc(P.name)}</div><div class="small sub" style="margin-top:4px">Upper · Lower · Push · Pull · Arms · di ${esc(P.author)}</div></div></div>
      <div class="row small sub" style="justify-content:space-between;margin:12px 0 8px"><span>Settimana ${curWeek} di ${P.weeks.length}</span><span>scarico in sett. 7</span></div>
      <div class="weeks">${P.weeks.map(wk => {
        const st = weekStats(wk.week);
        const cls = st.done === st.total ? 'done' : wk.week === curWeek ? 'now' : wk.deload ? 'deload' : 'todo';
        return `<button class="${cls}${wk.week === sel ? ' sel' : ''}" data-act="pweek" data-v="${wk.week}" aria-label="Settimana ${wk.week}"></button>`;
      }).join('')}</div></div>`;
    h += `<div class="section"><span class="label">Settimana ${sel}${P.weeks[sel - 1].deload ? ' · scarico' : ''}</span><div style="display:flex;flex-direction:column;gap:8px">`;
    P.weeks[sel - 1].days.forEach((d, di) => {
      if (d.rest) return;
      const done = sessionFor(sel, di);
      const isNext = nw && nw.w === sel && nw.d === di;
      const isAct = activeSession() && activeSession().week === sel && activeSession().day === di;
      const cls = done ? 'done' : (isNext || isAct) ? 'now' : 'todo';
      const right = done ? ICON.check : isAct ? '<span class="xs" style="font-weight:700">in corso</span>' : isNext ? '<span class="xs" style="font-weight:700">prossimo</span>' : '';
      h += `<button class="state ${cls}" data-act="dayinfo" data-w="${sel}" data-d="${di}" style="width:100%;text-align:left"><span class="dot" style="background:${d.color}"></span><span class="grow" style="font-size:15px;font-weight:${cls === 'now' ? 700 : 600}">${esc(d.name)}</span>${right}</button>`;
    });
    h += `</div></div><div class="section row"><button class="btn ghost" data-act="soon" data-v="L'import di nuovi programmi da Excel">Importa da Excel</button><button class="btn ghost" data-act="soon" data-v="L'elenco dei programmi passati">Programmi passati</button></div></div>`;
    return h;
  }
  function dayInfo(w, d) {
    const day = dayOf(w, d);
    const done = sessionFor(w, d);
    let h = `<h3 class="cond" style="font-size:30px">${esc(day.name)} · sett. ${w}</h3>`;
    day.slots.forEach((sl, si) => {
      const en = done && done.entries[si];
      const sets = en ? en.sets.filter(x => x.done).map(x => wtx(en.sub || sl.ex, x.w) + '×' + x.r).join(' · ') : '';
      h += `<div class="opt" style="flex-direction:column;align-items:flex-start;gap:2px"><b>${sl.group ? sl.group + ' · ' : ''}${esc(exName(sl.ex))}</b>
        <span class="xs sub">${sl.sets} serie · ${esc(sl.range)} rip · RIR ${sl.rir.map(x => x ?? '–').join('/')} · rec. ${esc(sl.restTxt)}${sl.tech ? ' · ' + TECH[sl.tech] : ''}</span>
        ${sets ? `<span class="small" style="color:var(--green)">${sets}</span>` : ''}</div>`;
    });
    const act = activeSession();
    if (!done) h += act ? `<button class="btn" data-act="resume">Riprendi l'allenamento in corso</button>` : `<button class="btn" data-act="start" data-w="${w}" data-d="${d}">Inizia questo allenamento</button>`;
    else h += `<button class="btn" data-act="editsess" data-v="${esc(done.id)}">Modifica questo allenamento</button>`;
    sheet(h);
  }

  // ---------- MODIFICA DI UN ALLENAMENTO PASSATO ----------
  let draft = null;
  function openEdit(id) {
    const s = S.sessions.find(x => x.id === id); if (!s) return;
    draft = { id, entries: JSON.parse(JSON.stringify(s.entries)) };
    closeSheet(); view = 'edit'; render(); window.scrollTo({ top: 0 });
  }
  function renderEdit() {
    const s = S.sessions.find(x => x.id === draft.id);
    const day = dayOf(s.week, s.day);
    document.documentElement.style.setProperty('--day', day.color);
    const num = 'style="width:100%;height:44px;background:var(--bg);color:#fff;border:1px solid var(--dash);border-radius:10px;padding:0 10px;font-size:17px;font-family:var(--cond);font-weight:700"';
    let h = `<header class="wo-head"><div class="wo-top"><button class="end" data-act="editcancel">Annulla</button><span>MODIFICA · ${esc(day.name.toUpperCase())} · SETT. ${s.week}</span><button class="end" data-act="editsave" style="background:#fff;color:var(--bg)">Salva</button></div></header><main class="wo-body">`;
    day.slots.forEach((sl, si) => {
      const en = draft.entries[si];
      const ex = (en && en.sub) || sl.ex;
      h += `<div class="card" style="margin-bottom:10px"><div style="font-weight:700">${sl.group ? sl.group + ' · ' : ''}${esc(exName(ex))}</div><div class="xs sub" style="margin:2px 0 10px">${esc(sl.range)} rip · ${isAssisted(ex) ? 'kg = assistenza' : 'kg'}</div>
        <div style="display:grid;grid-template-columns:44px 1fr 1fr 1fr 44px;gap:6px;align-items:center" class="xs sub"><span></span><span>Kg</span><span>Rip</span><span>RIR</span><span></span></div>`;
      (en ? en.sets : []).forEach((x, i) => {
        h += `<div style="display:grid;grid-template-columns:44px 1fr 1fr 1fr 44px;gap:6px;align-items:center;margin-top:6px"><span class="small sub">S${i + 1}</span>
          <input ${num} inputmode="decimal" aria-label="Kg serie ${i + 1}" data-edit="w" data-si="${si}" data-i="${i}" value="${x.w == null ? '' : fmt(x.w)}">
          <input ${num} inputmode="numeric" aria-label="Ripetizioni serie ${i + 1}" data-edit="r" data-si="${si}" data-i="${i}" value="${x.r ?? ''}">
          <input ${num} inputmode="numeric" aria-label="RIR serie ${i + 1}" data-edit="rir" data-si="${si}" data-i="${i}" value="${x.rir ?? ''}">
          <button class="iconbtn" style="background:var(--dim)" data-act="editdel" data-si="${si}" data-i="${i}" aria-label="Elimina serie ${i + 1}">✕</button></div>`;
      });
      h += `<button class="btn ghost" style="margin-top:10px;height:44px" data-act="editadd" data-si="${si}">+ Aggiungi serie</button></div>`;
    });
    h += `<button class="btn danger" data-act="editdelsess" style="margin-top:6px">Elimina questo allenamento</button><div class="xs sub" style="margin-top:8px;text-align:center">Eliminandolo, il giorno torna "da fare" nel programma.</div></main>`;
    return h;
  }
  function numOrNull(v) { v = String(v).trim().replace(',', '.'); if (v === '') return null; const n = parseFloat(v); return isNaN(n) ? null : n; }

  // ---------- PROGRESSI ----------
  function allKeys() {
    const keys = [];
    P.weeks[0].days.forEach(d => !d.rest && d.slots.forEach(sl => { const k = keyOf(sl); if (!keys.find(x => x.k === k)) keys.push({ k, sl }); }));
    // anche le varianti usate al posto degli originali
    for (const s of doneSessions()) { const day = dayOf(s.week, s.day); for (const [si, en] of Object.entries(s.entries)) { const sl = day.slots[+si]; if (sl && en.sub) { const k = keyOf(sl, en.sub); if (!keys.find(x => x.k === k)) keys.push({ k, sl, sub: en.sub }); } } }
    return keys;
  }
  function firstE(p) { return e1x(p.ex, p.sets[0].w, p.sets[0].r); }
  function progressStats() {
    const keys = allKeys();
    let ch = [], records = 0;
    const watch = [];
    for (const { k, sl, sub } of keys) {
      const list = perfs(k); if (!list.length) continue;
      if (list.length >= 2) { const a = firstE(list[0]), b = firstE(list[list.length - 1]); if (a > 0) ch.push(b / a - 1); }
      let best = 0, stall = 0;
      list.forEach((p, i) => { const e = Math.max(...p.sets.map(x => e1x(p.ex, x.w, x.r))); if (i > 0 && e > best + 0.01) { records++; stall = 0; } else if (i > 0) stall++; best = Math.max(best, e); });
      if (list.length >= 3) {
        const v = list.slice(-3).map(firstE);
        const down = v[2] < v[1] - 0.01 && v[1] < v[0] - 0.01;
        const rising = v[2] > v[1] + 0.01 && v[1] > v[0] + 0.01;   // sta risalendo: non è fermo
        if (down || (stall >= 2 && !rising)) watch.push({ k, sl, sub, list, down, stall });
      }
    }
    watch.sort((a, b) => (b.down - a.down) || (b.stall - a.stall));
    const vol = {}, sets = {}, recW = {};
    for (const s of doneSessions()) { vol[s.week] = (vol[s.week] || 0) + sessionVolume(s); for (const en of Object.values(s.entries)) sets[s.week] = (sets[s.week] || 0) + (en.sets || []).filter(x => x.done).length; recW[s.week] = (recW[s.week] || 0) + (s.records || 0); }
    const done = doneSessions().length;
    const total = P.weeks.reduce((n, w) => n + w.days.filter(d => !d.rest).length, 0);
    const nw = nextWorkout(); const act = activeSession();
    const cur = act ? act.week : nw ? nw.w : P.weeks.length;
    let streak = 0; for (let w = cur; w >= 1; w--) { if (vol[w] || sets[w]) streak++; else if (w !== cur) break; }
    const full = w => P.weeks[w - 1] && P.weeks[w - 1].days.every((d, di) => d.rest || sessionFor(w, di));
    let cmp = null; for (let w = cur; w >= 2; w--) { if (full(w) && full(w - 1) && vol[w - 1]) { cmp = { w, pct: Math.round(100 * (vol[w] / vol[w - 1] - 1)) }; break; } }
    return { change: ch.length ? ch.reduce((a, b) => a + b, 0) / ch.length : null, nChange: ch.length, records, watch, vol, sets, done, total, cur, streak, cmp };
  }
  function tons(kg) { return kg >= 1000 ? (Math.round(kg / 100) / 10).toString().replace('.', ',') + 't' : Math.round(kg) + ''; }
  function watchAdvice(w) {
    const ex = w.sub || w.sl.ex;
    if (w.down) return 'Due cali di fila: controlla sonno, alimentazione e recupero. Se succede su più esercizi insieme, valuta una settimana di scarico.';
    if (isAssisted(ex)) return 'Tieni la prima serie così e cura la discesa lenta: il progresso arriva prima nelle serie con assistenza.';
    const subs = ((CAT[w.sl.ex] || {}).subs || []).map(x => x.name);
    return (w.sl.rest ? 'Recupera il tempo pieno (' + w.sl.restTxt + ') prima della prima serie e punta a una ripetizione in più.' : 'Punta a una ripetizione in più nella prima serie.') + (subs.length && !w.sub ? ' Se resta fermo ancora, prova una variante (es. ' + subs[0] + ').' : '');
  }
  function renderProgressi() {
    const tab = S.ui.progTab || 'pano';
    let h = `<div class="page"><h1 class="cond page-title">Progressi</h1>
      <div role="tablist" class="seg" style="grid-template-columns:repeat(2,minmax(0,1fr))"><button role="tab" aria-selected="${tab === 'pano'}" data-act="progtab" data-v="pano">Panoramica</button><button role="tab" aria-selected="${tab === 'ex'}" data-act="progtab" data-v="ex">Esercizi</button></div>`;
    h += tab === 'ex' ? renderEsercizi() : renderPanoramica();
    return h + '</div>';
  }
  function renderPanoramica() {
    const st = progressStats();
    const maxV = Math.max(1, ...Object.values(st.vol));
    let h = `<div class="card" style="margin-top:14px;display:flex;flex-direction:column;gap:12px">
      <div><div class="label" style="letter-spacing:.5px">${esc(P.name)} · sett. ${st.cur} di ${P.weeks.length}</div><div class="small" style="color:var(--soft);margin-top:2px">Forza media dall'inizio del programma</div></div>
      <div class="row" style="align-items:baseline;gap:10px"><span class="cond" style="font-size:64px;color:${st.change == null || st.change >= 0 ? 'var(--green)' : '#FF8A8A'}">${st.change == null ? '–' : (st.change >= 0 ? '+' : '−') + Math.abs(Math.round(st.change * 100)) + '%'}</span>
        <span class="xs sub" style="line-height:1.4">${st.nChange ? 'su ' + st.nChange + ' esercizi<br>prima volta → ultima volta' : 'servono almeno due allenamenti'}</span></div>
      <div class="tiles">
        <div class="tile" style="background:var(--dim)"><span class="xs sub" style="font-weight:700">ALLENAMENTI</span><span class="num" style="font-size:24px;font-weight:800">${st.done} / ${st.total}</span></div>
        <div class="tile" style="background:var(--dim)"><span class="xs sub" style="font-weight:700">RECORD</span><span class="num" style="font-size:24px;font-weight:800;color:var(--gold)">${st.records}</span></div>
        <div class="tile" style="background:var(--dim)"><span class="xs sub" style="font-weight:700">COSTANZA</span><span class="num" style="font-size:24px;font-weight:800">${st.streak} sett.</span></div></div></div>`;
    h += `<div class="card" style="margin-top:10px;display:flex;flex-direction:column;gap:10px">
      <div class="row" style="justify-content:space-between"><span class="label">Kg sollevati per settimana</span><span class="xs sub">S = scarico</span></div>
      <div class="wbars" role="img" aria-label="Kg sollevati per settimana">${P.weeks.map(wk => {
        const v = st.vol[wk.week] || 0;
        if (!v) return `<div class="wb"><div class="bar ${wk.deload ? 'deload' : 'empty'}" style="height:24px"></div></div>`;
        return `<div class="wb"><span class="v">${tons(v)}</span><div class="bar" style="height:${Math.max(8, Math.round(110 * v / maxV))}px;background:${wk.week === st.cur ? '#fff' : 'var(--day-blue,#2F6BFF)'}"></div></div>`;
      }).join('')}</div>
      <div class="wbars xs sub" style="height:auto">${P.weeks.map(wk => `<span style="text-align:center;${wk.week === st.cur ? 'color:#fff;font-weight:800' : ''}">${wk.deload ? 'S' : wk.week}</span>`).join('')}</div>
      <div class="row small" style="border-top:1px solid var(--line);padding-top:10px;color:var(--soft)"><span class="grow">Settimana ${st.cur}: ${st.sets[st.cur] || 0} serie</span>${st.cmp ? `<span style="font-weight:700;color:${st.cmp.pct >= 0 ? 'var(--green)' : '#FF8A8A'}">${st.cmp.pct >= 0 ? '▲ +' : '▼ '}${st.cmp.pct}% sett. ${st.cmp.w} vs ${st.cmp.w - 1}</span>` : ''}</div></div>`;
    h += `<div class="section"><div class="row" style="justify-content:space-between;padding:0 4px 8px"><span class="label">Da tenere d'occhio</span><span class="xs sub">${st.watch.length ? st.watch.length + (st.watch.length === 1 ? ' esercizio' : ' esercizi') : ''}</span></div>`;
    if (!st.watch.length) h += `<div class="state done" style="min-height:56px;color:#fff"><span class="grow small">Nessun esercizio fermo o in calo: continua così.</span>${ICON.check}</div>`;
    for (const w of st.watch.slice(0, 6)) {
      const ex = w.sub || w.sl.ex;
      const last3 = w.list.slice(-3).map(p => wtx(p.ex, p.sets[0].w) + ' × ' + p.sets[0].r).join(w.down ? ' → ' : ' · ');
      h += `<div class="watch ${w.down ? 'down' : ''}"><div class="row" style="justify-content:space-between;gap:8px"><span style="font-weight:700">${esc(exName(ex))} <span class="xs sub">${esc(w.sl.range)}</span></span>
        <span class="pill" style="${w.down ? 'background:#B03A3A;color:#fff' : 'background:var(--gold);color:var(--bg)'};font-size:12px;font-weight:800">${w.down ? 'IN CALO' : 'FERMO DA ' + (w.stall + 1) + ' VOLTE'}</span></div>
        <span class="num" style="font-size:18px;color:var(--soft)">${last3}</span>
        <span class="small" style="color:#E6EBF4;line-height:1.4">${esc(watchAdvice(w))}</span>
        <button class="xs" data-act="resetbase" data-v="${esc(w.k)}" style="align-self:flex-start;color:var(--sub);text-decoration:underline;min-height:32px">Ho cambiato attrezzo o variante: riparti da qui</button></div>`;
    }
    return h + `</div><div class="section"><button class="btn ghost" data-act="progtab" data-v="ex">Tutti gli esercizi e i record ›</button></div>`;
  }
  function renderEsercizi() {
    let h = `<div class="section" style="margin-top:14px"><span class="label">Record per esercizio</span><div style="display:flex;flex-direction:column;gap:8px">`;
    const keys = [];
    P.weeks[0].days.forEach(d => !d.rest && d.slots.forEach(sl => { const k = keyOf(sl); if (!keys.find(x => x.k === k)) keys.push({ k, sl }); }));
    for (const { k, sl } of keys) {
      const list = perfs(k); if (!list.length) continue;
      const best = bestOf(list); const lastP = list[list.length - 1]; const ex = lastP.ex;
      h += `<button class="state done" data-act="exstat" data-v="${esc(k)}" style="width:100%;text-align:left;color:#fff;min-height:56px"><span class="grow"><span style="font-weight:600">${esc(exName(sl.ex))}</span><br><span class="xs sub">${esc(sl.range)} rip · ultima ${wtx(ex, lastP.sets[0].w)} × ${lastP.sets[0].r}</span></span><span class="num" style="font-size:22px"><span style="color:var(--gold)">●</span> ${wtx(ex, best.w)} × ${best.r}</span></button>`;
    }
    h += `</div></div><div class="section"><div class="state todo" style="min-height:56px"><span class="grow small">Peso, misure, foto e statistiche avanzate arrivano nelle prossime versioni.</span></div></div>`;
    return h;
  }
  function exStat(k) {
    const list = perfs(k);
    const [ex, range] = k.split('|');
    const pts = list.map(p => Math.max(...p.sets.map(x => e1x(p.ex, x.w, x.r))));
    const W = 320, H = 120, pad = 10;
    const mn = Math.min(...pts), mx = Math.max(...pts);
    const xy = pts.map((v, i) => [pad + (pts.length === 1 ? (W - 2 * pad) / 2 : i * (W - 2 * pad) / (pts.length - 1)), H - pad - (mx === mn ? (H - 2 * pad) / 2 : (v - mn) / (mx - mn) * (H - 2 * pad))]);
    let h = `<h3 class="cond" style="font-size:28px">${esc(exName(ex))}</h3><div class="small sub" style="margin:-6px 0 10px">${esc(range)} rip · forza stimata nel tempo</div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Andamento della forza stimata"><polyline points="${xy.map(p => p.join(',')).join(' ')}" fill="none" stroke="#3DE0E6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${xy.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#fff"/>`).join('')}</svg>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:12px">`;
    for (const p of [...list].reverse()) {
      h += `<div class="row small" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:6px 0"><span class="sub">Sett. ${p.s.week}${p.s.endedAt ? ' · ' + new Date(p.s.endedAt).toLocaleDateString('it-IT') : ''}</span><span class="num" style="font-size:18px">${p.sets.map(x => wtx(p.ex, x.w) + '×' + x.r).join(' · ')}</span></div>`;
    }
    sheet(h + '</div>');
  }

  // ---------- IMPOSTAZIONI ----------
  function renderImpostazioni() {
    const sw = (k, l, d) => `<div class="setting"><div class="grow"><div style="font-weight:600">${l}</div><div class="xs sub">${d}</div></div><button class="switch" role="switch" aria-checked="${!!S.settings[k]}" aria-label="${l}" data-act="setting" data-v="${k}"></button></div>`;
    return `<div class="page"><h1 class="cond page-title">Impostazioni</h1>
      <div class="card" style="padding:4px 16px">${sw('sound', 'Suono a fine recupero', 'Un bip 10 secondi prima, tre bip alla fine. Si sente anche con il silenzioso')}${sw('flash', 'Schermo che lampeggia', '3 lampi 10 secondi prima, 5 a fine recupero')}
        <div class="setting"><div class="grow"><div style="font-weight:600">Vibrazione</div><div class="xs sub">10 secondi prima e a fine recupero, dove l'iPhone lo permette</div></div><button class="switch" role="switch" aria-checked="${S.settings.vibe !== false}" aria-label="Vibrazione" data-act="setting" data-v="vibe"></button></div>
        <button class="setting" data-act="testalert" style="width:100%;text-align:left"><div class="grow"><div style="font-weight:600">Prova gli avvisi</div><div class="xs sub">Suono, lampeggio e vibrazione di fine recupero</div></div><span style="font-size:20px">▶</span></button>${sw('autoAdvance', 'Avanti automatico', 'A fine esercizio passa al successivo quando finisce il recupero')}
        <button class="setting" data-act="bw" style="width:100%;text-align:left"><div class="grow"><div style="font-weight:600">Peso corporeo</div><div class="xs sub">Serve per i record degli esercizi con assistenza (trazioni)</div></div><span class="num" style="font-size:22px">${fmt(S.settings.bw)} kg</span></button>
        <button class="setting" data-act="plates" style="width:100%;text-align:left"><div class="grow"><div style="font-weight:600">Dischi della palestra</div><div class="xs sub">Per il disegno di bilancieri e macchine a dischi e per i salti di +/−</div></div><span class="num" style="font-size:20px">${platesList().map(fmt).join(' · ')}</span></button></div>
      <div class="section"><span class="label">Backup dei dati</span><div class="card" style="display:flex;flex-direction:column;gap:10px">
        <div class="small sub">I dati restano su questo iPhone. Fai un backup ogni tanto e salvalo su Google Drive o sul PC: se cambi telefono lo reimporti da qui.</div>
        <button class="btn" data-act="export">Esporta backup</button>
        <button class="btn ghost" data-act="csv">Esporta per Excel (CSV)</button>
        <label class="btn ghost" style="display:flex;align-items:center;justify-content:center;cursor:pointer">Ripristina da un backup<input type="file" accept="application/json,.json" data-act="import" hidden></label>
        <div class="xs sub">Backup automatico su Google Drive: in arrivo in una prossima versione.</div>
      </div></div>
      <div class="section"><span class="label">Attenzione</span><button class="btn danger" data-act="reset">Azzera tutto e riparti dai dati dell'Excel</button></div>
      <div class="section"><button class="btn ghost" data-act="update">Cerca aggiornamenti</button></div>
      <div class="section xs sub" style="text-align:center">App Palestra · versione ${VERSION}</div></div>`;
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const file = new File([blob], name, { type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: name }).catch(() => {});
      return;
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function exportCSV() {
    const rows = [['Settimana', 'Giorno', 'Data', 'Esercizio', 'Range', 'Serie', 'Kg', 'Ripetizioni', 'RIR', 'Nota']];
    for (const s of doneSessions()) {
      const day = dayOf(s.week, s.day);
      for (const [si, en] of Object.entries(s.entries)) {
        const sl = day.slots[+si]; if (!sl) continue;
        (en.sets || []).forEach((x, i) => { if (x.done) rows.push([s.week, day.name, s.endedAt ? new Date(s.endedAt).toLocaleDateString('it-IT') : '', exName(en.sub || sl.ex), sl.range, i + 1, wtxt(x.w), x.r ?? '', x.rir ?? '', i === 0 ? (en.note || en.sessNote || '') : '']); });
      }
    }
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\n');
    download('app-palestra-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + csv, 'text/csv');
  }

  // ---------- ALLENAMENTO ----------
  function renderWorkout(s) {
    const day = dayOf(s.week, s.day);
    document.documentElement.style.setProperty('--day', day.color);
    const si = s.cur;
    const slot = day.slots[si];
    const en = ensureEntry(s, si);
    const ex = en.sub || slot.ex;
    const key = keyOf(slot, en.sub);
    const pos = s.seq.indexOf(si) + 1;
    let h = `<header class="wo-head"><div class="wo-top"><span class="row"><button class="end" data-act="leave" aria-label="Torna a Oggi" style="width:34px;padding:0;font-size:20px">‹</button>SETT. ${s.week} · ${esc(day.name.toUpperCase())}${P.weeks[s.week - 1].deload ? ' · SCARICO' : ''}</span><span class="row"><span>${pos}/${s.seq.length}</span><span class="clock" aria-label="Durata dell'allenamento">${ICON.stopwatch}<span id="wo-clock" class="num">${clockTxt(Date.now() - s.startedAt)}</span></span><button class="end" data-act="finish">Termina</button></span></div>
      <nav class="chips" aria-label="Esercizi di oggi">${s.seq.map((x, k) => {
        const sl = day.slots[x];
        const st = slotComplete(s, x) ? 'done' : x === si ? 'now' : 'todo';
        const lbl = (sl.group ? sl.group + ' ' : (k + 1) + ' · ') + shortName(exName((s.entries[x] && s.entries[x].sub) || sl.ex)) + (sl.hi !== day.slots.find(y => y.ex === sl.ex).hi ? ' ' + sl.range : '');
        return `<button class="chip ${st}" data-act="slot" data-v="${x}" ${x === si ? 'aria-current="step"' : ''}>${st === 'done' ? ICON.check.replace('class="check"', '') : ''}${esc(lbl)}</button>`;
      }).join('')}</nav></header><main class="wo-body">`;

    // intestazione esercizio
    h += `<div class="row" style="align-items:flex-start;justify-content:space-between">
      <div class="grow"><h1 class="cond ex-name">${esc(exName(ex))}</h1>
      <div class="ex-meta"><span>${esc(slot.range)} rip</span><span>RIR ${slot.rir.map(x => x ?? '–').join('/')}</span><span>${slot.rest ? restTxt(slot.rest) : 'superserie'}</span>${slot.warmup && slot.warmup !== '0' ? `<span>risc. ${esc(slot.warmup)}</span>` : ''}</div></div>
      <div class="row" style="flex:none;gap:6px">
        <a class="iconbtn" aria-label="Guarda il video" href="${esc(videoUrl(slot, en))}" target="_blank" rel="noopener">${ICON.play}</a>
        <button class="iconbtn" aria-label="Sostituisci esercizio" data-act="subs">${ICON.swap}</button>
        <button class="iconbtn" aria-label="Altre opzioni" data-act="exmenu">${ICON.more}</button></div></div>`;
    if (en.sub) h += `<div class="tag" style="margin-top:8px">Sostituisce ${esc(exName(slot.ex))}</div>`;
    if (slot.group) h += renderSSGuide(s, day, si);
    if (slot.tech) h += `<div class="tag" style="margin-top:8px;background:#2A1F45;color:#D9C8FF">Ultima serie: ${TECH[slot.tech]}</div>`;

    // note
    const cat = CAT[ex] || {};
    const m = meta(ex);
    const list = perfs(key);
    const lastP = list[list.length - 1];
    // note: tutte modificabili con un tocco; se vuote diventano una riga sottile
    const techTxt = (m.techNote != null) ? m.techNote : (cat.note || '');
    const noteRow = (kind, icon, label, color, txt, empty) => txt
      ? `<button class="note" data-act="note" data-v="${kind}">${icon}<div><div class="t" style="color:${color}">${label}</div><div class="b">${esc(txt)}</div></div></button>`
      : `<button class="note empty" data-act="note" data-v="${kind}">${icon}<span class="t" style="color:${color}">${label}</span><span class="add">${empty}</span></button>`;
    h += `<div class="notes">`;
    h += noteRow('tech', ICON.info, 'TECNICA' + (m.techNote != null ? '' : ' (DAL PROGRAMMA)'), 'var(--cyan)', techTxt, '+ aggiungi');
    h += noteRow('my', ICON.pin, 'LA TUA NOTA', 'var(--gold)', m.myNote, '+ sedile, impugnatura…');
    if (lastP) h += noteRow('last', ICON.clock, 'NOTA DELL\'ULTIMA VOLTA', 'var(--sub)', lastP.note, '+ aggiungi');
    h += noteRow('sess', ICON.clock, 'NOTA DI OGGI', '#fff', en.sessNote, '+ aggiungi');
    h += `</div>`;

    // ultima / record per la serie attuale
    const curI = Math.min(en.sets.findIndex(x => !x.done) === -1 ? en.sets.length - 1 : en.sets.findIndex(x => !x.done), en.sets.length - 1);
    const lastSet = lastP ? (lastP.sets[curI] || lastP.sets[lastP.sets.length - 1]) : null;
    const best = bestOf(list);
    h += `<div class="refs"><div class="ref"><span class="xs sub" style="font-weight:600">ULTIMA${lastP ? ' · S' + lastP.s.week : ''}</span><span class="num">${lastSet ? wtx(ex, lastSet.w) + ' × ' + lastSet.r : '–'}</span></div>
      <div class="ref"><span class="xs" style="color:var(--gold);font-weight:600">RECORD</span><span class="num">${best ? wtx(ex, best.w) + ' × ' + best.r : '–'}</span></div></div>`;
    if (fatigue(key)) h += `<div class="warn">⚠ Due cali di fila su questo esercizio: controlla sonno e recupero. Se continua, valuta lo scarico.</div>`;

    // serie
    h += `<div class="sets">`;
    const firstW = (en.sets.find(x => !x.done) || en.sets[0] || {}).w;
    const wu = warmups(slot, firstW);
    const wuTxt = wu.length ? wu.map(x => wtxt(x.w) + ' × ' + x.r).join(' · ')
      : (slot.warmup && slot.warmup !== '0' ? '<span style="font-size:17px">' + slot.warmup + (slot.warmup === '1' ? ' serie leggera' : ' serie leggere') + (isAssisted(ex) ? ' (più assistenza)' : '') + '</span>' : '');
    if (wuTxt) {
      h += `<button class="setrow ${en.warmDone ? 'done' : 'todo'}" data-act="warm"><span class="lbl">Risc.${String(slot.warmup).startsWith('0-') ? '<br><span class="xs">facolt.</span>' : ''}</span><span class="num">${wuTxt}</span>${en.warmDone ? ICON.check : '<span class="xs">tocca a fine riscaldamento</span>'}</button>`;
    }
    const nowIdx = en.sets.findIndex(x => !x.done);
    en.sets.forEach((x, i) => {
      if (x.done) {
        const isRec = best && x === best;
        h += `<button class="setrow done" data-act="reopen" data-v="${i}"><span class="lbl">Serie ${i + 1}</span><span class="num">${wtx(ex, x.w)} × ${x.r}${x.rir != null ? ' · RIR ' + x.rir : ''}</span>${isRec ? '<span class="pill" style="background:var(--gold);color:var(--bg);padding:2px 8px">REC</span>' : ''}${ICON.check}</button>`;
        if (x.askNext) h += `<div class="nextask"><span>Prossima volta, serie ${i + 1}:</span><div class="row" style="gap:8px"><button class="${x.next !== 'back' ? 'on' : ''}" data-act="nextpick" data-i="${i}" data-v="keep">Tieni ${fmt(x.w)} kg</button><button class="${x.next === 'back' ? 'on' : ''}" data-act="nextpick" data-i="${i}" data-v="back">Torna a ${fmt(x.prevW)} kg</button></div></div>`;
      } else if (i === nowIdx) {
        h += renderSetCard(s, si, slot, en, i, ex);
      } else {
        const g = suggest(slot, i, en.sub);
        h += `<div class="setrow todo"><span class="lbl">Serie ${i + 1}</span><span class="num">${wtx(ex, x.w)} × ${x.r ?? '–'}${g.rir != null ? ' · RIR ' + g.rir : ''}</span></div>`;
      }
    });
    h += `</div>`;

    // tecnica speciale / esercizio completato
    if (nowIdx === -1) {
      if (en.tech && !en.tech.done) h += renderTech(en.tech, ex);
      else h += renderDoneCard(s, si, best);
    }
    h += `</main>`;

    // barra recupero / azioni
    if (s.rest) {
      const left = (s.rest.endAt - Date.now()) / 1000;
      h += `<div class="restbar"><div class="fill" id="rest-fill" style="width:${Math.max(0, 100 * left / s.rest.total)}%"></div><div class="in"><span class="xs sub" style="font-weight:600">RECUPERO</span><span class="num time" id="rest-time">${mmss(left)}</span>
        <button data-act="rest" data-v="-15" aria-label="Togli 15 secondi">−15</button><button data-act="rest" data-v="15" aria-label="Aggiungi 15 secondi">+15</button><button data-act="skiprest" aria-label="Salta il recupero" style="width:44px">✕</button></div></div>`;
    } else {
      h += `<div class="restbar idle"><div class="in"><button data-act="list">${ICON.list}&nbsp; Esercizi</button><button data-act="restart" aria-label="Avvia il recupero">${ICON.stopwatch}&nbsp; Recupero</button><button data-act="sessnote">Nota</button></div></div>`;
    }
    return h;
  }
  function videoUrl(slot, en) {
    let url = (CAT[slot.ex] || {}).video;
    if (en.sub) { const sb = ((CAT[slot.ex] || {}).subs || []).find(x => x.name === en.sub); url = sb ? sb.video : (CAT[en.sub] || {}).video; }
    return url || 'https://www.youtube.com/results?search_query=' + encodeURIComponent('Jeff Nippard ' + (en.sub || slot.ex));
  }
  // riquadro guida superserie: giro attuale, ordine degli esercizi e quando parte il recupero
  function renderSSGuide(s, day, si) {
    const g = day.slots[si].group;
    const mates = s.seq.filter(x => day.slots[x].group === g);
    const counts = mates.map(m => slotDoneCount(ensureEntry(s, m)));
    const rounds = Math.max(...mates.map(m => day.slots[m].sets));
    const allDone = mates.every((m, k) => counts[k] >= day.slots[m].sets);
    const round = allDone ? rounds : Math.min(rounds, Math.min(...mates.map((m, k) => counts[k] < day.slots[m].sets ? counts[k] : Infinity)) + 1);
    const restSec = Math.max(...mates.map(m => day.slots[m].rest));
    const last = mates[mates.length - 1];
    const steps = mates.map((m, k) => {
      const done = counts[k] >= round;
      const st = done ? 'done' : m === si ? 'now' : 'todo';
      const enM = ensureEntry(s, m);
      const exM = enM.sub || day.slots[m].ex;
      const nm = shortName(exName(exM));
      // peso e ripetizioni da preparare per questo giro (quelli già impostati nella serie)
      const set = enM.sets[Math.min(round, enM.sets.length) - 1] || {};
      const w = set.w != null ? set.w : set.wL;
      const r = set.r != null ? set.r : set.rL;
      const plan = (w != null || r != null) ? `<em class="num">${esc(wtx(exM, w))}${!isAssisted(exM) && w ? ' kg' : ''} × ${r != null ? r : '–'}</em>` : '';
      return `<button class="ss-step ${st}" data-act="slot" data-v="${m}">${done ? ICON.check : `<b>${String.fromCharCode(65 + k)}</b>`}<span class="ss-txt"><span>${esc(nm)}</span>${plan}</span></button>`;
    }).join('<span class="ss-arrow" aria-hidden="true">→</span>');
    const restDone = allDone || counts.every(c => c >= round);
    const lastName = shortName(exName((s.entries[last] && s.entries[last].sub) || day.slots[last].ex));
    return `<div class="ss-guide"><div class="ss-head"><span>SUPERSERIE ${esc(g)}</span><span>${allDone ? 'COMPLETATA' : 'GIRO ' + round + ' DI ' + rounds}</span></div>
      <div class="ss-steps">${steps}<span class="ss-arrow" aria-hidden="true">→</span><span class="ss-step rest ${restDone ? 'done' : 'todo'}">${ICON.clock}<span>${restTxt(restSec)}</span></span></div>
      <div class="ss-tip">Nessuna pausa tra gli esercizi: il recupero parte dopo ${esc(lastName)}.</div></div>`;
  }
  function shortName(n) {
    return n.replace(/^Machine |^Chest-Supported |^Single-Arm |^Single-Leg |^Close-Grip |^Incline |^Standing |^Seated /, '').replace(/ \(.*\)/, '');
  }
  function renderSetCard(s, si, slot, en, i, ex) {
    const x = en.sets[i];
    const g = suggestToday(slot, i, en);
    const target = slot.rir[i];
    const uni = meta(ex).unilateral;
    const tgt = targetFor(slot, i, en.sub, x.w, en);
    if (tgt && !tgt.same) {
      g.w = tgt.w; g.r = tgt.r; g.up = false;
      if (tgt.alt) g.why = 'Hai scelto l\'alternativa: ' + fmt(tgt.w) + ' kg × ' + tgt.r + '.';
      else g.why = 'Peso cambiato: con ' + (isAssisted(ex) ? 'assistenza ' : '') + fmt(tgt.w) + ' kg l\'obiettivo equivalente è ' + tgt.r + (tgt.r === 1 ? ' ripetizione.' : ' ripetizioni.');
    }
    const badge = g.w != null || g.r != null ? `<span class="sugg ${g.up ? '' : 'keep'}">${g.up ? '↑ prova' : 'obiettivo'} ${isAssisted(ex) ? (g.w ? 'ass. ' + fmt(g.w) + ' kg × ' : 'senza assist. × ') : (g.w ? fmt(g.w) + ' kg × ' : '')}${g.r}${g.rir != null ? ' · RIR ' + g.rir : ''}</span>` : '';
    const stepper = (side) => {
      const wk = side ? 'w' + side : 'w', rk = side ? 'r' + side : 'r';
      const wv = side ? (x[wk] ?? x.w) : x.w, rv = side ? (x[rk] ?? x.r) : x.r;
      return `${side ? `<div class="side">${side === 'L' ? 'SINISTRO' : 'DESTRO'}</div>` : ''}<div class="steppers">
        <div class="stepper"><button class="pm" data-act="w" data-v="-1" data-i="${i}" data-s="${side || ''}" aria-label="Diminuisci carico">−</button><button class="val" data-act="wtype" data-i="${i}" data-s="${side || ''}" aria-label="Scrivi il carico"><span class="num">${wv == null ? '–' : fmt(wv)}</span><span class="u">${isAssisted(ex) ? 'KG ASSIST.' : 'KG'}</span></button><button class="pm" data-act="w" data-v="1" data-i="${i}" data-s="${side || ''}" aria-label="Aumenta carico">+</button></div>
        <div class="stepper"><button class="pm" data-act="r" data-v="-1" data-i="${i}" data-s="${side || ''}" aria-label="Diminuisci ripetizioni">−</button><button class="val" data-act="rtype" data-i="${i}" data-s="${side || ''}" aria-label="Scrivi le ripetizioni"><span class="num">${rv ?? '–'}</span><span class="u">RIP</span></button><button class="pm" data-act="r" data-v="1" data-i="${i}" data-s="${side || ''}" aria-label="Aumenta ripetizioni">+</button></div></div>`;
    };
    const rirSel = x.rir ?? null;
    return `<div class="setcard"><div class="row" style="justify-content:space-between"><span style="font-weight:700">Serie ${i + 1}${slot.sets > 1 ? ' di ' + slot.sets : ''}</span>${badge}</div>
      ${g.why ? `<div class="why">${esc(g.why)}</div>` : ''}
      ${g.alt && !uni ? (() => { const sg = suggest(slot, i, en.sub); const rec = { w: sg.w, r: sg.r }; const isRec = x.w === rec.w; const isAlt = x.w === g.alt.w;
        return `<div class="choice"><button class="${isRec ? 'on' : ''}" data-act="pickopt" data-i="${i}" data-w="${rec.w}" data-r="${rec.r}"><span class="k">★ CONSIGLIATO</span><span class="num">${fmt(rec.w)} kg × ${rec.r}</span></button><button class="${isAlt ? 'on' : ''}" data-act="pickopt" data-i="${i}" data-w="${g.alt.w}" data-r="${g.alt.r}"><span class="k">${esc(g.alt.lbl.toUpperCase())}</span><span class="num">${fmt(g.alt.w)} kg × ${g.alt.r}</span></button></div>`; })() : ''}
      ${uni ? stepper('L') + renderPlates(ex, x, i > 0 ? en.sets[i - 1] : null, 'L') + stepper('R') + renderPlates(ex, x, i > 0 ? en.sets[i - 1] : null, 'R') : stepper('') + renderPlates(ex, x, i > 0 ? en.sets[i - 1] : null)}
      <div class="rir"><span>RIR</span>${[0, 1, 2, 3].map(v => `<button class="${target === v ? 'target' : ''} ${rirSel === v ? 'sel' : ''}" data-act="rir" data-i="${i}" data-v="${v}" aria-pressed="${rirSel === v}">${v === 3 ? '3+' : v}</button>`).join('')}</div>
      <button class="btn dark" data-act="done" data-i="${i}">Fatto${rirSel == null && target != null ? ' · RIR ' + target : ''}</button></div>`;
  }
  function renderTech(t, ex) {
    if (t.type === 'drop') {
      return `<div class="techcard"><div style="font-weight:700">Drop set: togli ~25% e continua subito</div>${t.steps.map((st, k) => st.done
        ? `<div class="setrow done" style="background:rgba(0,0,0,.2)"><span class="lbl">Drop ${k + 1}</span><span class="num">${wtxt(st.w)} × ${st.r}</span>${ICON.check}</div>`
        : `<div class="setcard"><span style="font-weight:700">Drop ${k + 1}</span><div class="steppers">
            <div class="stepper"><button class="pm" data-act="tw" data-k="${k}" data-v="-1" aria-label="Diminuisci carico">−</button><div class="val"><span class="num">${wtxt(st.w)}</span><span class="u">KG</span></div><button class="pm" data-act="tw" data-k="${k}" data-v="1" aria-label="Aumenta carico">+</button></div>
            <div class="stepper"><button class="pm" data-act="tr" data-k="${k}" data-v="-1" aria-label="Diminuisci ripetizioni">−</button><div class="val"><span class="num">${st.r}</span><span class="u">RIP</span></div><button class="pm" data-act="tr" data-k="${k}" data-v="1" aria-label="Aumenta ripetizioni">+</button></div></div>
            <button class="btn dark" data-act="tdone" data-k="${k}">Fatto drop ${k + 1}</button></div>`).join('')}
        <button class="btn ghost" data-act="tskip">Salta la tecnica</button></div>`;
    }
    if (t.type === 'myo') {
      return `<div class="techcard"><div style="font-weight:700">Myo-reps: riposa 3-5 respiri, poi mini-serie da poche ripetizioni</div>
        ${t.mini.length ? `<div class="num" style="font-size:20px">${t.mini.map((r, k) => 'Mini ' + (k + 1) + ': ' + r).join(' · ')}</div>` : ''}
        <div class="setcard"><div class="stepper"><button class="pm" data-act="mr" data-v="-1" aria-label="Diminuisci ripetizioni">−</button><div class="val"><span class="num">${t.r}</span><span class="u">RIP MINI-SERIE ${t.mini.length + 1}</span></div><button class="pm" data-act="mr" data-v="1" aria-label="Aumenta ripetizioni">+</button></div>
        <button class="btn dark" data-act="madd">Aggiungi mini-serie</button></div>
        <button class="btn" data-act="tend">Fine myo-reps</button></div>`;
    }
    const left = t.endAt ? Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000)) : 30;
    return `<div class="techcard"><div style="font-weight:700">Tenuta statica: resta fermo nel punto indicato per 30 s</div>
      <div class="num" style="font-size:56px;text-align:center" id="hold-time">${left}</div>
      ${t.endAt ? '' : '<button class="btn dark" style="background:#fff;color:var(--bg)" data-act="hstart">Avvia 30 secondi</button>'}
      <button class="btn ghost" data-act="tend">${t.endAt ? 'Fatto' : 'Salta la tecnica'}</button></div>`;
  }
  function renderDoneCard(s, si, best) {
    const day = dayOf(s.week, s.day);
    const en = s.entries[si];
    const nxt = nextIncomplete(s, si);
    const rec = en.recordNew;
    let h = `<div class="donecard"><div class="row"><span style="width:36px;height:36px;border-radius:18px;background:var(--green);display:flex;align-items:center;justify-content:center">${ICON.check.replace('#5FD38D', '#0E1726')}</span>
      <div><div style="font-weight:700;font-size:17px">Esercizio completato</div>${rec ? `<div class="small" style="color:#B8E8C8">Nuovo record: ${(rec.txt || wtxt(rec.w))} × ${rec.r}</div>` : ''}</div></div>`;
    if (nxt != null) {
      const auto = s.rest && S.settings.autoAdvance ? 'AVANTI A FINE RECUPERO · O TOCCA ORA' : 'PROSSIMO';
      h += `<button class="next-btn" data-act="slot" data-v="${nxt}"><span><span class="xs" style="font-weight:700;color:#4A5568">${auto}</span><br><span style="font-weight:700;font-size:16px">${esc(exName((s.entries[nxt] && s.entries[nxt].sub) || day.slots[nxt].ex))}</span></span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>`;
    } else {
      h += `<button class="btn" data-act="finish">Hai finito: termina l'allenamento</button>`;
    }
    return h + '</div>';
  }

  function checkRecord(s, si) {
    const day = dayOf(s.week, s.day);
    const slot = day.slots[si];
    const en = s.entries[si];
    const prev = bestOf(perfs(keyOf(slot, en.sub)));
    const mine = en.sets.filter(x => x.done && x.r != null);
    let top = null;
    const ex = en.sub || slot.ex;
    for (const x of mine) if (!top || e1x(ex, x.w, x.r) > e1x(ex, top.w, top.r)) top = x;
    en.recordNew = (top && (!prev || e1x(ex, top.w, top.r) > e1x(ex, prev.w, prev.r) + 0.01)) ? { w: top.w, r: top.r, txt: wtx(ex, top.w) } : null;
  }

  async function finishSession() {
    const s = activeSession(); if (!s) return;
    const anyDone = Object.values(s.entries).some(en => slotDoneCount(en) > 0);
    if (!anyDone) {
      if (!await ask('Annullare l\'allenamento?', 'Non hai ancora registrato nessuna serie.', 'Annulla allenamento', true)) return;
      S.sessions = S.sessions.filter(x => x !== s); save(); view = 'tabs'; render(); return;
    }
    const day = dayOf(s.week, s.day);
    const missing = s.seq.filter(si => !slotComplete(s, si)).length;
    if (missing && !await ask('Terminare l\'allenamento?', 'Mancano ' + missing + (missing === 1 ? ' esercizio.' : ' esercizi.'), 'Termina')) return;
    let records = 0, sets = 0, improved = 0, compared = 0;
    const recs = [];
    for (const si of Object.keys(s.entries)) {
      const en = s.entries[si]; const slot = day.slots[+si]; const ex = en.sub || slot.ex; const key = keyOf(slot, en.sub);
      const list = perfs(key); const prevBest = bestOf(list); const prevLast = list[list.length - 1];
      checkRecord(s, +si); sets += slotDoneCount(en);
      const mine = en.sets.filter(x => x.done && x.r != null);
      if (prevLast && mine.length) { compared++; if (e1x(ex, mine[0].w, mine[0].r) > e1x(ex, prevLast.sets[0].w, prevLast.sets[0].r) + 0.01) improved++; }
      if (en.recordNew) { records++; recs.push({ ex: exName(ex), txt: en.recordNew.txt, w: en.recordNew.w, r: en.recordNew.r, delta: recordDelta(ex, prevBest, en.recordNew) }); }
    }
    const vol = sessionVolume(s);
    const prevSame = doneSessions().filter(x => x !== s && dayOf(x.week, x.day).name === day.name).slice(-1)[0];
    s.status = 'done'; s.endedAt = Date.now(); s.rest = null; s.records = records; s.order = ++S.orderSeq;
    const vc = prevSame ? volumeCompare(s, prevSame) : null;
    summary = { day: day.name, color: day.color, week: s.week, min: Math.round((s.endedAt - s.startedAt) / 60000), dur: clockTxt(s.endedAt - s.startedAt), sets, records, recs, vol, vc, improved, compared };
    save(); view = 'summary'; render(); window.scrollTo({ top: 0 });
  }
  function recordDelta(ex, prev, now) {
    if (!prev) return 'primo record';
    const out = [];
    const dw = (now.w || 0) - (prev.w || 0);
    if (Math.abs(dw) > 0.001) out.push(isAssisted(ex) ? (dw < 0 ? '−' + fmt(-dw) + ' kg assist.' : '+' + fmt(dw) + ' kg assist.') : (dw > 0 ? '+' : '−') + fmt(Math.abs(dw)) + ' kg');
    const dr = now.r - prev.r;
    if (dr) out.push((dr > 0 ? '+' : '−') + Math.abs(dr) + ' rip');
    return out.join(' · ') || 'stesso carico, più forza';
  }
  // kg sollevati per esercizio (chiave esercizio|range)
  function volumeByKey(s) {
    const day = dayOf(s.week, s.day); const out = {};
    for (const [si, en] of Object.entries(s.entries)) {
      const slot = day.slots[+si]; if (!slot) continue; const ex = en.sub || slot.ex;
      if (isAssisted(ex)) continue;
      let v = 0; for (const x of en.sets || []) if (x.done && x.w && x.r) v += x.w * x.r;
      if (v) out[keyOf(slot, en.sub)] = (out[keyOf(slot, en.sub)] || 0) + v;
    }
    return out;
  }
  function sessionVolume(s) { return Math.round(Object.values(volumeByKey(s)).reduce((a, b) => a + b, 0)); }
  // confronto solo sugli esercizi fatti sia oggi sia l'ultima volta
  function volumeCompare(now, prev) {
    const a = volumeByKey(now), b = volumeByKey(prev); let x = 0, y = 0;
    for (const k of Object.keys(a)) if (b[k]) { x += a[k]; y += b[k]; }
    return y ? { now: Math.round(x), prev: Math.round(y) } : null;
  }
  function renderSummary() {
    const m = summary;
    const dv = m.vc ? m.vc.now - m.vc.prev : null;
    const dvp = m.vc ? Math.round(100 * dv / m.vc.prev) : null;
    return `<div class="page recap">
      <div class="recap-hero" style="background:${m.color}">
        <div class="recap-check"><svg viewBox="0 0 24 24" fill="none" stroke="#0E1726" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <div class="xs" style="font-weight:700;letter-spacing:.5px">ALLENAMENTO COMPLETATO</div>
        <div class="cond" style="font-size:44px;margin-top:4px">${esc(m.day)} · sett. ${m.week}</div></div>
      <div class="tiles rise" style="margin-top:12px;--d:.15s">
        <div class="tile"><span class="xs sub">Durata</span><span class="num big" style="font-weight:800">${m.dur || m.min + '′'}</span></div>
        <div class="tile"><span class="xs sub">Serie</span><span class="num big" style="font-weight:800" data-count="${m.sets}">${m.sets}</span></div>
        <div class="tile"><span class="xs sub">Record</span><span class="num big" style="font-weight:800;color:var(--gold)" data-count="${m.records}">${m.records}</span></div></div>
      ${m.recs.length ? `<div class="section"><span class="label">Record battuti</span>${m.recs.map((r, k) => `<div class="state done rise" style="--d:${0.35 + k * 0.12}s;color:#fff;margin-bottom:8px;min-height:58px"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFC94D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/></svg><span class="grow"><span style="font-weight:600">${esc(r.ex)}</span><br><span class="xs" style="color:var(--green);font-weight:700">${esc(r.delta)}</span></span><span class="num" style="font-size:22px">${r.txt || wtxt(r.w)} × ${r.r}</span></div>`).join('')}</div>` : ''}
      <div class="section rise" style="--d:${0.45 + m.recs.length * 0.12}s"><span class="label">Rispetto all'ultima volta</span><div class="card" style="display:flex;flex-direction:column;gap:10px">
        ${m.compared ? `<div class="row"><span class="grow">Esercizi migliorati</span><span class="num" style="font-size:22px">${m.improved} su ${m.compared}</span></div>` : ''}
        <div class="row"><span class="grow">Kg sollevati in totale</span><span class="num" style="font-size:22px"><span data-count="${m.vol}">${m.vol}</span> kg</span></div>
        ${dv != null ? `<div class="xs" style="font-weight:700;color:${dv >= 0 ? 'var(--green)' : '#FF8A8A'}">${dv >= 0 ? '▲ +' : '▼ −'}${Math.abs(dv)} kg (${dvp >= 0 ? '+' : ''}${dvp}%) sugli stessi esercizi dell'ultimo ${esc(m.day)}</div>` : ''}
      </div></div>
      <div class="section"><button class="btn" data-act="home">Torna a Oggi</button></div></div>`;
  }
  function animateSummary() {
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    document.querySelectorAll('[data-count]').forEach(el => {
      const to = +el.dataset.count; if (!to) return; const t0 = performance.now(), D = 900;
      const step = t => { const p = Math.min(1, (t - t0) / D); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
    if (summary && summary.records) confetti([summary.color, '#FFC94D', '#FFFFFF', '#5FD38D']);
  }
  function confetti(colors) {
    const c = document.createElement('canvas'); c.className = 'confetti'; c.width = innerWidth * 2; c.height = innerHeight * 2; document.body.appendChild(c);
    const g = c.getContext('2d'); g.scale(2, 2);
    const P = Array.from({ length: 90 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.22, vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 3, s: 4 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: colors[Math.floor(Math.random() * colors.length)] }));
    const t0 = performance.now();
    const frame = t => {
      const el = t - t0; g.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of P) { p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.r += p.vr; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = Math.max(0, 1 - el / 2200); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }
      if (el < 2200) requestAnimationFrame(frame); else c.remove();
    };
    requestAnimationFrame(frame);
  }

  // ---------- azioni ----------
  async function promptNum(label, val) {
    const v = await askInput(label, val == null ? '' : String(val).replace('.', ','), true);
    if (v == null || String(v).trim() === '') return null;
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  async function act(a, el, e) {
    const s = activeSession();
    const v = el.dataset.v;
    switch (a) {
      case 'tab': S.ui.tab = v; save(); render(); window.scrollTo({ top: 0 }); break;
      case 'start': closeSheet(); unlockAudio(); startSession(+el.dataset.w, +el.dataset.d); break;
      case 'resume': closeSheet(); unlockAudio(); openWorkout(); break;
      case 'leave': view = 'tabs'; S.ui.tab = 'oggi'; save(); render(); break;
      case 'home': view = 'tabs'; S.ui.tab = 'oggi'; summary = null; save(); render(); break;
      case 'progtab': S.ui.progTab = v; save(); render(); window.scrollTo({ top: 0 }); break;
      case 'resetbase': {
        if (!await ask('Ripartire da qui?', 'Per questo esercizio confronto, record e suggerimenti terranno conto solo dell\'ultimo allenamento in poi. Utile se hai cambiato attrezzo o variante.', 'Riparti da qui')) return;
        const list = perfs(v); const last = list[list.length - 1];
        S.since = S.since || {}; S.since[v] = last ? last.s.order : 0; save(); render(); toast('Fatto: si riparte dall\'ultimo allenamento'); break;
      }
      case 'soon': toast(v + ' arriva in una prossima versione'); break;
      case 'pweek': S.ui.progWeek = +v; save(); render(); break;
      case 'dayinfo': dayInfo(+el.dataset.w, +el.dataset.d); break;
      case 'exstat': exStat(v); break;
      case 'setting': S.settings[v] = v === 'vibe' ? S.settings.vibe === false : !S.settings[v]; save(); render(); if (v === 'sound' && S.settings.sound) { unlockAudio(); setTimeout(() => play('warn'), 150); } break;
      case 'testalert': unlockAudio(); setTimeout(alertEnd, 200); break;
      case 'export': download('app-palestra-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ app: 'app-palestra', version: VERSION, savedAt: new Date().toISOString(), state: S }), 'application/json'); S.lastBackup = Date.now(); save(); render(); break;
      case 'csv': exportCSV(); break;
      case 'update': {
        toast('Scarico l\'ultima versione…');
        try {
          if ('serviceWorker' in navigator) { const regs = await navigator.serviceWorker.getRegistrations(); for (const r of regs) await r.update(); }
          if (window.caches) { const keys = await caches.keys(); for (const k of keys) await caches.delete(k); }
          await Promise.all(['./', 'index.html', 'app.js', 'styles.css', 'sw.js'].map(u => fetch(u, { cache: 'reload' }).catch(() => {})));
        } catch (err) { /* si ricarica comunque */ }
        location.reload(); break;
      }
      case 'plates': {
        const t = await askInput('Dischi disponibili (kg), separati da spazi', platesList().map(fmt).join(' '));
        if (t == null) break;
        const ps = [...new Set(String(t).split(/[\s;\/]+|-(?=\d)/).map(x => parseFloat(x.replace(',', '.'))).filter(x => x > 0 && x < 100))];
        if (ps.length) { S.settings.plates = ps.sort((a, b) => b - a); save(); render(); }
        break;
      }
      case 'bw': { const n = await promptNum('Peso corporeo in kg', S.settings.bw); if (n) { S.settings.bw = n; save(); render(); } break; }
      case 'reset':
        if (await ask('Azzerare tutto?', 'Cancello tutti i dati registrati nell\'app e riparto dallo storico dell\'Excel. Prima conviene esportare un backup.', 'Azzera tutto', true)) { S = freshState({ program: S.program, catalog: S.catalog, history: S.sessions.filter(x => x.src === 'excel') }); bindData(); save(); render(); toast('Dati azzerati'); }
        break;
      // allenamento
      case 'slot': goSlot(+v); break;
      case 'finish': finishSession(); break;
      case 'list': listSheet(); break;
      case 'nextpick': {
        const en = ensureEntry(s, s.cur); const x = en.sets[+el.dataset.i]; x.next = v; save(); render();
        toast(v === 'back' ? 'La prossima volta riparti da ' + fmt(x.prevW) + ' kg' : 'La prossima volta resti a ' + fmt(x.w) + ' kg');
        break;
      }
      case 'pickopt': {
        const en = ensureEntry(s, s.cur); const x = en.sets[+el.dataset.i];
        x.w = +el.dataset.w; x.r = +el.dataset.r; save(); render(); break;
      }
      case 'w': case 'r': {
        const en = ensureEntry(s, s.cur); const i = +el.dataset.i; const side = el.dataset.s; const x = en.sets[i];
        const slot = dayOf(s.week, s.day).slots[s.cur]; const ex = en.sub || slot.ex;
        const k = a + side;
        let cur = side ? (x[k] ?? x[a]) : x[a];
        if (a === 'w') cur = +v > 0 ? weightUp(ex, cur ?? 0) : (cur == null ? 0 : weightDown(ex, cur));
        else cur = Math.max(0, (cur ?? 0) + (+v));
        x[k] = cur;
        if (side) { x.w = Math.min(x.wL ?? x.w ?? 0, x.wR ?? x.w ?? 0); x.r = Math.min(x.rL ?? x.r ?? 0, x.rR ?? x.r ?? 0); }
        if (a === 'w' && !side) retarget(slot, en, i);
        save(); render(); break;
      }
      case 'wtype': case 'rtype': {
        const en = ensureEntry(s, s.cur); const i = +el.dataset.i; const side = el.dataset.s; const x = en.sets[i];
        const base = a === 'wtype' ? 'w' : 'r'; const k = base + side;
        const n = await promptNum(base === 'w' ? 'Peso in kg' : 'Ripetizioni', side ? (x[k] ?? x[base]) : x[base]);
        if (n == null) return;
        x[k] = base === 'r' ? Math.round(n) : n;
        if (side) { x.w = Math.min(x.wL ?? x.w ?? 0, x.wR ?? x.w ?? 0); x.r = Math.min(x.rL ?? x.r ?? 0, x.rR ?? x.r ?? 0); }
        if (base === 'w') { const ex = en.sub || dayOf(s.week, s.day).slots[s.cur].ex; const m = meta(ex); m.ladder = [...new Set([...(m.ladder || []), n])]; if (!side) retarget(dayOf(s.week, s.day).slots[s.cur], en, i); }
        save(); render(); break;
      }
      case 'rir': { const x = ensureEntry(s, s.cur).sets[+el.dataset.i]; x.rir = x.rir === +v ? null : +v; save(); render(); break; }
      case 'done': {
        completeSet(s.cur, +el.dataset.i);
        const en = s.entries[s.cur] || {};
        if (s.entries[s.cur] && slotDoneCount(en) >= dayOf(s.week, s.day).slots[s.cur].sets) { checkRecord(s, s.cur); save(); render(); }
        break;
      }
      case 'reopen': {
        if (!await ask('Modificare la serie ' + (+v + 1) + '?', 'La serie torna da completare e puoi correggere peso, ripetizioni e RIR.', 'Modifica')) return;
        const en = ensureEntry(s, s.cur); en.sets[+v].done = false; en.recordNew = null; save(); render(); break;
      }
      case 'warm': { const en = ensureEntry(s, s.cur); en.warmDone = !en.warmDone; save(); render(); break; }
      case 'rest': { if (s.rest) { s.rest.endAt += (+v) * 1000; s.rest.total = Math.max(s.rest.total + (+v), 1); save(); onTick(); } break; }
      case 'editsess': openEdit(v); break;
      case 'editcancel': draft = null; view = 'tabs'; render(); break;
      case 'editadd': {
        const si = el.dataset.si; const en = draft.entries[si] || (draft.entries[si] = { sets: [], note: null });
        const prev = en.sets[en.sets.length - 1];
        en.sets.push({ w: prev ? prev.w : null, r: prev ? prev.r : null, rir: null, done: true });
        render(); break;
      }
      case 'editdel': { const en = draft.entries[el.dataset.si]; en.sets.splice(+el.dataset.i, 1); render(); break; }
      case 'editsave': {
        const s = S.sessions.find(x => x.id === draft.id);
        for (const k of Object.keys(draft.entries)) { const en = draft.entries[k]; en.sets = en.sets.filter(x => x.w != null || x.r != null); en.sets.forEach(x => { x.done = true; }); if (!en.sets.length && !en.note) delete draft.entries[k]; }
        s.entries = draft.entries; s.edited = Date.now(); draft = null; save(); view = 'tabs'; render(); toast('Allenamento modificato'); break;
      }
      case 'editdelsess': {
        if (!await ask('Eliminare questo allenamento?', 'Le serie registrate vengono cancellate e il giorno torna da fare. Non si può annullare.', 'Elimina', true)) return;
        S.sessions = S.sessions.filter(x => x.id !== draft.id); draft = null; save(); view = 'tabs'; render(); toast('Allenamento eliminato'); break;
      }
      case 'skiprest': endRest(false); toast('Recupero fermato: lo riavvii dal tasto Recupero'); break;
      case 'restart': {
        const day = dayOf(s.week, s.day); const slot = day.slots[s.cur];
        let sec = slot.rest;
        if (!sec && slot.group) sec = Math.max(...s.seq.filter(m => day.slots[m].group === slot.group).map(m => day.slots[m].rest));
        startRest(sec || 90, s.cur); unlockAudio(); save(); render(); break;
      }
      case 'video': {
        const en = ensureEntry(s, s.cur); const slot = dayOf(s.week, s.day).slots[s.cur];
        let url = (CAT[slot.ex] || {}).video;
        if (en.sub) { const sb = ((CAT[slot.ex] || {}).subs || []).find(x => x.name === en.sub); url = sb ? sb.video : (CAT[en.sub] || {}).video; }
        if (!url) url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent('Jeff Nippard ' + (en.sub || slot.ex));
        window.open(url, '_blank', 'noopener'); break;
      }
      case 'subs': subsSheet(); break;
      case 'exmenu': exMenu(); break;
      case 'mynote': noteSheet('my'); break;
      case 'note': noteSheet(v); break;
      case 'sessnote': noteSheet('sess'); break;
      // tecniche
      case 'tw': case 'tr': {
        const en = ensureEntry(s, s.cur); const st = en.tech.steps[+el.dataset.k]; const ex = en.sub || dayOf(s.week, s.day).slots[s.cur].ex;
        if (a === 'tw') st.w = +v > 0 ? weightUp(ex, st.w || 0) : weightDown(ex, st.w || 0); else st.r = Math.max(0, st.r + (+v));
        save(); render(); break;
      }
      case 'tdone': { const en = ensureEntry(s, s.cur); en.tech.steps[+el.dataset.k].done = true; if (en.tech.steps.every(x => x.done)) en.tech.done = true; save(); render(); break; }
      case 'tskip': case 'tend': { const en = ensureEntry(s, s.cur); en.tech.done = true; en.tech.skipped = a === 'tskip'; save(); render(); break; }
      case 'mr': { const t = ensureEntry(s, s.cur).tech; t.r = Math.max(1, t.r + (+v)); save(); render(); break; }
      case 'madd': { const t = ensureEntry(s, s.cur).tech; t.mini.push(t.r); save(); render(); break; }
      case 'hstart': {
        const t = ensureEntry(s, s.cur).tech; t.endAt = Date.now() + 30000; save(); render(); unlockAudio();
        const iv = setInterval(() => {
          const el2 = $('#hold-time'); const left = Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000));
          if (el2) el2.textContent = left;
          if (left <= 0) { clearInterval(iv); alertEnd(); }
        }, 250);
        break;
      }
    }
  }
  function listSheet() {
    const s = activeSession(); const day = dayOf(s.week, s.day);
    let h = `<h3>Esercizi di oggi</h3><div class="small sub" style="margin:-6px 0 12px">Macchina occupata? Sposta un esercizio con le frecce.</div>`;
    s.seq.forEach((si, k) => {
      const st = slotComplete(s, si) ? 'done' : si === s.cur ? 'now' : 'todo';
      const sl = day.slots[si];
      h += `<div class="row" style="margin-bottom:8px"><button class="state ${st} grow" data-act="slotclose" data-v="${si}" style="text-align:left">${st === 'done' ? ICON.check : `<span style="width:20px;text-align:center;font-weight:700">${k + 1}</span>`}<span class="grow">${sl.group ? sl.group + ' · ' : ''}${esc(exName((s.entries[si] && s.entries[si].sub) || sl.ex))} <span class="xs">${esc(sl.range)}</span></span></button>
        ${st === 'done' ? '' : `<button class="iconbtn" data-act="mv" data-v="${si}" data-d="-1" aria-label="Sposta su">↑</button><button class="iconbtn" data-act="mv" data-v="${si}" data-d="1" aria-label="Sposta giù">↓</button>`}</div>`;
    });
    sheet(h);
  }
  // sposta tutto lo storico registrato con un nome su un'altra variante (es. segnato Cable Crunch, fatto Machine Crunch)
  function moveHist(from, to) {
    let n = 0;
    for (const ss of S.sessions) { const d = dayOf(ss.week, ss.day); if (!d) continue;
      for (const [k, e] of Object.entries(ss.entries || {})) { const sl = d.slots[k]; if (!sl || (e.sub || sl.ex) !== from) continue;
        e.sub = sl.ex === to ? null : to; if (ss.status === 'done') n++;
        if (ss.status === 'active' && !e.sets.some(x => x.done)) fillSets(ss, +k, e); } }
    const a = meta(from), b = meta(to);
    for (const f of ['myNote', 'ladder', 'equip', 'unilateral', 'assisted']) if (a[f] != null && b[f] == null) b[f] = a[f];
    if (S.since) for (const key of Object.keys(S.since)) if (key.startsWith(from + '|')) { S.since[to + key.slice(from.length)] = S.since[key]; delete S.since[key]; }
    return n;
  }
  function histSheet() {
    const s = activeSession(); const slot = dayOf(s.week, s.day).slots[s.cur]; const en = ensureEntry(s, s.cur); const cur = en.sub || slot.ex;
    const names = [slot.ex, ...((CAT[slot.ex] || {}).subs || []).map(x => x.name), ...customSubs(slot.ex)].filter((x, i, a) => x !== cur && a.indexOf(x) === i);
    let h = `<h3>Lo storico era con un'altra variante</h3><div class="small sub" style="margin:-6px 0 12px">Tutte le serie registrate come <b>${esc(exName(cur))}</b> passano alla variante che scegli, con record e suggerimenti. Da oggi l'esercizio parte con quella.</div>`;
    for (const x of names) h += `<button class="opt" data-act="histmove" data-v="${esc(x)}">${esc(exName(x))}${x === slot.ex ? ' <span class="xs sub">(originale)</span>' : ''}</button>`;
    h += `<button class="opt" data-act="histcustom">+ Un altro esercizio…</button>`;
    sheet(h);
  }
  function subsSheet() {
    const s = activeSession(); const slot = dayOf(s.week, s.day).slots[s.cur]; const en = ensureEntry(s, s.cur);
    const subs = (CAT[slot.ex] || {}).subs || [];
    let h = `<h3>Sostituisci esercizio</h3><div class="small sub" style="margin:-6px 0 12px">Ogni variante ha il suo storico e i suoi record.</div>`;
    h += `<button class="opt" data-act="subpick" data-v="">${!en.sub ? '● ' : ''}${esc(exName(slot.ex))} <span class="xs sub">(originale)</span></button>`;
    for (const x of subs) h += `<button class="opt" data-act="subpick" data-v="${esc(x.name)}">${en.sub === x.name ? '● ' : ''}${esc(exName(x.name))}</button>`;
    for (const x of customSubs(slot.ex)) h += `<button class="opt" data-act="subpick" data-v="${esc(x)}">${en.sub === x ? '● ' : ''}${esc(exName(x))} <span class="xs sub">(tua)</span></button>`;
    h += `<button class="opt" data-act="subcustom">+ Un altro esercizio…</button>`;
    sheet(h);
  }
  function exMenu() {
    const s = activeSession(); const slot = dayOf(s.week, s.day).slots[s.cur]; const en = ensureEntry(s, s.cur); const ex = en.sub || slot.ex;
    const m = meta(ex);
    sheet(`<h3>${esc(exName(ex))}</h3>
      <button class="opt" data-act="rename">Rinomina (come lo chiami in palestra)</button>
      <button class="opt" data-act="mynote2">Modifica la tua nota fissa</button>
      <button class="opt" data-act="uni">${m.unilateral ? '✓ ' : ''}Separa lato sinistro e destro</button>
      <button class="opt" data-act="assist">${isAssisted(ex) ? '✓ ' : ''}I kg sono assistenza della macchina</button>
      <button class="opt" data-act="equip">Attrezzo e disegno dischi: ${m.equip ? EQUIP[m.equip.type] + (m.equip.type === 'bar' ? ' ' + fmt(m.equip.bar) + ' kg' : '') : 'non impostato'}</button>
      <button class="opt" data-act="histsheet">Lo storico finora era con un'altra variante…</button>
      <button class="opt" data-act="tolast">Fallo per ultimo (macchina occupata)</button>
      <button class="opt" data-act="refill">Ricalcola i suggerimenti per le serie da fare</button>`);
  }
  const NOTE_INFO = {
    tech: ['Tecnica dell\'esercizio', 'Le indicazioni del programma, che puoi riscrivere a modo tuo.'],
    my: ['La tua nota fissa', 'Compare ogni volta che fai questo esercizio (sedile, impugnatura, regolazioni…).'],
    last: ['Nota dell\'ultima volta', 'La nota dell\'allenamento precedente di questo esercizio.'],
    sess: ['Nota di oggi', 'Resta solo in questo allenamento (es. "oggi stanco", "scalda bene il ginocchio").'],
  };
  function noteTarget(kind) {
    const s = activeSession(); const slot = dayOf(s.week, s.day).slots[s.cur]; const en = ensureEntry(s, s.cur); const ex = en.sub || slot.ex;
    const m = meta(ex); const cat = CAT[ex] || {};
    if (kind === 'tech') return { get: () => (m.techNote != null ? m.techNote : (cat.note || '')), set: t => { m.techNote = (t === (cat.note || '')) ? null : t; }, reset: m.techNote != null && cat.note ? () => { m.techNote = null; } : null };
    if (kind === 'my') return { get: () => m.myNote || '', set: t => { m.myNote = t || null; } };
    if (kind === 'last') {
      const list = perfs(keyOf(slot, en.sub)); const p = list[list.length - 1];
      const e2 = p && p.s.entries[p.si];
      return { get: () => (e2 ? (e2.note || e2.sessNote || '') : ''),
        set: t => { if (!e2) return; if (e2.noteOrig === undefined) e2.noteOrig = e2.note || e2.sessNote || ''; e2.note = t || null; e2.sessNote = ''; },
        reset: e2 && e2.noteOrig !== undefined && e2.noteOrig !== (e2.note || '') ? () => { e2.note = e2.noteOrig || null; } : null };
    }
    return { get: () => en.sessNote || '', set: t => { en.sessNote = t; } };
  }
  function noteSheet(kind) {
    const [title, help] = NOTE_INFO[kind] || NOTE_INFO.sess;
    const tg = noteTarget(kind);
    sheet(`<h3>${title}</h3><div class="small sub" style="margin:-6px 0 12px">${help}</div>
      <textarea id="note-ta">${esc(tg.get())}</textarea><div style="height:10px"></div><button class="btn" data-act="notesave" data-v="${kind}">Salva</button>
      ${tg.reset ? `<div style="height:8px"></div><button class="btn ghost" data-act="notereset" data-v="${kind}">${kind === 'tech' ? 'Ripristina il testo del programma' : 'Ripristina la nota originale'}</button>` : ''}`,
      sc => { const t = $('#note-ta', sc); t.focus(); });
  }
  function sheetAct(a, el) {
    if (a === 'ask-ok') { resolvePending(true); return true; }
    if (a === 'ask-no') { resolvePending(false); return true; }
    if (a === 'input-ok') { resolvePending($('#ask-in').value); return true; }
    const s = activeSession();
    const slot = s && dayOf(s.week, s.day).slots[s.cur];
    const en = s && ensureEntry(s, s.cur);
    const ex = en && (en.sub || slot.ex);
    switch (a) {
      case 'slotclose': closeSheet(); goSlot(+el.dataset.v); return true;
      case 'mv': {
        const si = +el.dataset.v, d = +el.dataset.d; const o = s.seq; const p = o.indexOf(si); const q = p + d;
        if (q < 0 || q >= o.length) return true;
        [o[p], o[q]] = [o[q], o[p]]; save(); listSheet(); render(); return true;
      }
      case 'equip': eqDraft = null; equipSheet(ex); return true;
      case 'eqtype': eqDraft.type = el.dataset.v; equipSheet(eqDraft.ex); return true;
      case 'eqconv': eqDraft.conv = !eqDraft.conv; equipSheet(eqDraft.ex); return true;
      case 'eqbar': {
        if (el.dataset.v !== 'custom') { eqDraft.bar = +el.dataset.v; equipSheet(eqDraft.ex); return true; }
        const d = eqDraft; promptNum('Peso della barra in kg', d.bar).then(n => { eqDraft = d; if (n != null) d.bar = n; equipSheet(d.ex); });
        return true;
      }
      case 'eqsave': {
        const q = eqDraft; setEquip(q.ex, q); eqDraft = null; closeSheet(); save(); render();
        toast(q.type === 'none' ? 'Nessun disegno per questo esercizio' : (q.conv && meta(q.ex).equip.conv ? 'Storico convertito in pesi totali' : 'Attrezzo salvato'));
        return true;
      }
      case 'histsheet': histSheet(); return true;
      case 'histmove': case 'histcustom': {
        const from = ex;
        const go = to => { if (!to || to === from) return;
          ask('Spostare lo storico?', 'Le serie registrate come ' + exName(from) + ' diventano ' + exName(to) + '.', 'Sposta').then(ok => {
            if (!ok) { closeSheet(); return; }
            const n = moveHist(from, to); closeSheet(); save(); render();
            toast(n + (n === 1 ? ' allenamento spostato' : ' allenamenti spostati') + ' su ' + exName(to), 'Annulla', () => { moveHist(to, from); save(); render(); });
          }); };
        if (a === 'histmove') go(el.dataset.v); else askInput('Nome della variante', '').then(t => go(t && t.trim()));
        return true;
      }
      case 'subpick': {
        closeSheet(); applySub(s, s.cur, el.dataset.v || null); save(); render(); return true;
      }
      case 'subcustom': {
        askInput('Nome dell\'esercizio sostitutivo', '').then(n => { if (!n || !n.trim()) return; applySub(s, s.cur, n.trim()); save(); render(); });
        return true;
      }
      case 'rename': { askInput('Nuovo nome per ' + ex, exName(ex)).then(n => { if (n == null) return; meta(ex).alias = n.trim() || null; save(); render(); }); return true; }
      case 'mynote2': closeSheet(); noteSheet('my'); return true;
      case 'uni': { const m = meta(ex); m.unilateral = !m.unilateral; closeSheet(); save(); render(); return true; }
      case 'assist': { meta(ex).assisted = !isAssisted(ex); fillSets(s, s.cur, en); closeSheet(); save(); render(); return true; }
      case 'tolast': { const o = s.seq; o.splice(o.indexOf(s.cur), 1); o.push(s.cur); const n = nextIncomplete(s, o[o.length - 1]); closeSheet(); if (n != null && n !== s.cur) goSlot(n); else { save(); render(); } toast('Spostato in fondo'); return true; }
      case 'refill': { const keep = en.sets.filter(x => x.done); fillSets(s, s.cur, en); keep.forEach((x, i) => { en.sets[i] = x; }); closeSheet(); save(); render(); return true; }
      case 'notesave': {
        const kind = el.dataset.v; const tg = noteTarget(kind); const before = tg.get(); const after = $('#note-ta').value.trim();
        tg.set(after); closeSheet(); save(); render();
        if (before && !after) toast('Nota cancellata', 'Annulla', () => { noteTarget(kind).set(before); save(); render(); });
        return true;
      }
      case 'notereset': { const tg = noteTarget(el.dataset.v); if (tg.reset) tg.reset(); closeSheet(); save(); render(); return true; }
    }
    return false;
  }

  // delega degli eventi
  document.addEventListener('click', e => {
    unlockAudio();
    const el = e.target.closest('[data-act]');
    if (!el || el.tagName === 'INPUT') return;
    const a = el.dataset.act;
    if (sheetAct(a, el)) return;
    act(a, el, e);
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (!el.dataset.edit || !draft) return;
    const x = draft.entries[el.dataset.si].sets[+el.dataset.i];
    const n = numOrNull(el.value);
    x[el.dataset.edit] = el.dataset.edit === 'w' ? n : (n == null ? null : Math.round(n));
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.act !== 'import' || !el.files[0]) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (d.app !== 'app-palestra' || (!d.state && !d.seed)) throw new Error('file non valido');
        if (d.seed) {
          const go = () => { S = freshState(d.seed); bindData(); save(); render(); toast('Dati caricati'); };
          if (!S) { go(); return; }
          ask('Ricaricare i dati iniziali?', 'Sostituisco tutto con il programma e lo storico del file. Prima conviene esportare un backup.', 'Ricarica', true).then(ok => { if (ok) go(); });
          return;
        }
        if (!S) { S = d.state; bindData(); save(); render(); toast('Backup ripristinato'); return; }
        ask('Ripristinare il backup?', 'Sostituisco i dati attuali con quelli del backup del ' + new Date(d.savedAt).toLocaleDateString('it-IT') + '.', 'Ripristina').then(ok => { if (!ok) return; S = d.state; bindData(); save(); render(); toast('Backup ripristinato'); });
      } catch (err) { toast('Questo file non è un backup dell\'app'); }
    };
    r.readAsText(el.files[0]);
  });

  // avvio: se c'è un allenamento in corso, riparte da lì
  if (S && activeSession()) view = 'workout';
  render();
  if (S && activeSession() && activeSession().rest) ensureTick();
  // cronometro dell'allenamento: aggiorna solo il numero, ogni secondo
  setInterval(() => { const s = S && activeSession(); if (!s) return; for (const id of ['#wo-clock', '#live-clock']) { const el = $(id); if (el) el.textContent = clockTxt(Date.now() - s.startedAt); } }, 1000);

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
