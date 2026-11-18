/* App Palestra – versione 1 (modulo Palestra) */
(function () {
  'use strict';
  const SEED = window.SEED || null;   // presente solo nell'anteprima privata; su GitHub i dati si caricano da file
  let P = null, CAT = null;
  const KEY = 'apppalestra.v1';
  const VERSION = '1.1';

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
      settings: { sound: true, flash: true, autoAdvance: true, bw: 77.5 },
      ui: { tab: 'oggi', progWeek: null },
      orderSeq: seed.history.length,
    };
  }
  function load() {
    let st = null;
    try { const raw = localStorage.getItem(KEY); if (raw) st = JSON.parse(raw); } catch (e) { st = null; }
    if (st && !st.program && SEED) { st.program = SEED.program; st.catalog = SEED.catalog; }
    if (st && st.program) { if (st.settings.bw == null) st.settings.bw = 77.5; return st; }
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
    for (const s of doneSessions()) {
      const day = dayOf(s.week, s.day);
      for (const [si, en] of Object.entries(s.entries)) {
        const slot = day.slots[+si];
        if (!slot || keyOf(slot, en.sub) !== key) continue;
        const sets = (en.sets || []).filter(x => x.done && x.r != null);
        if (sets.length) out.push({ s, sets, ex: en.sub || slot.ex, note: en.note || en.sessNote || null });
      }
    }
    return out;
  }
  function bestOf(list) {
    let best = null;
    for (const p of list) for (const x of p.sets) if (!best || e1x(p.ex, x.w, x.r) > e1x(p.ex, best.w, best.r)) best = x;
    return best;
  }
  function ladderFor(ex) {
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
    const best = bestOf(list);
    const lo = slot.lo, hi = slot.hi;
    if (last.w == null) return { w: null, r: Math.min(hi, (last.r || lo) + 1), rir, why: 'Aggiungi una ripetizione rispetto all\'ultima volta.' };
    if (isAssisted(ex)) return suggestAssisted(ex, list, last, best, lo, hi, rir);
    if (last.r >= hi) {
      if (last.w === 0) return { w: 0, r: last.r + 1, rir, why: 'A corpo libero: una ripetizione in più.' };
      const next = weightUp(ex, last.w);
      const jump = (next - last.w) / last.w;
      if (jump <= 0.12 || last.r >= hi + 3) {
        return { w: next, r: lo, rir, up: true, why: 'L\'ultima volta hai chiuso il range (' + last.r + ' rip): sali di peso e riparti da ' + lo + '.' };
      }
      return { w: last.w, r: last.r + 1, rir, why: 'Il peso successivo (' + fmt(next) + ' kg) è un salto grande: prima aggiungi una ripetizione.' };
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
    const en = { sets: [], sub: null, warmDone: false, sessNote: '', tech: null, complete: false };
    fillSets(s, si, en);
    s.entries[si] = en;
    return en;
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
    if (left <= 10 && left > 9 && !warned) { warned = true; if (S.settings.sound) beep(660, 0.12); }
    if (left <= 0) endRest(true);
  }
  function endRest(natural) {
    const s = activeSession(); if (!s || !s.rest) return;
    s.rest = null;
    if (natural) {
      if (S.settings.sound) { beep(880, 0.18); setTimeout(() => beep(880, 0.18), 260); setTimeout(() => beep(1175, 0.3), 520); }
      if (S.settings.flash) flash();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if (S.settings.autoAdvance && slotComplete(s, s.cur)) {
        const n = nextIncomplete(s, s.cur);
        if (n != null) { s.cur = n; ensureEntry(s, n); toast('Avanti: ' + exName(dayOf(s.week, s.day).slots[n].ex)); }
      }
    }
    save(); render();
  }
  let actx = null;
  function unlockAudio() {
    try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { actx = null; }
  }
  function beep(freq, dur) {
    if (!actx) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.5, actx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + dur + 0.02);
  }
  function flash() {
    const d = document.createElement('div'); d.className = 'flash'; document.body.appendChild(d);
    setTimeout(() => d.remove(), 2600);
  }

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
  function toast(msg) {
    const old = $('.toast'); if (old) old.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }
  function sheet(html, onMount) {
    closeSheet();
    const sc = document.createElement('div'); sc.className = 'scrim'; sc.id = 'scrim';
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
      sheet(`<h3>${esc(title)}</h3><input id="ask-in" type="text" ${numeric ? 'inputmode="decimal"' : ''} value="${esc(value ?? '')}" autocomplete="off"><div style="height:10px"></div><button class="btn" data-act="input-ok">Conferma</button>`,
        sc => { const i = $('#ask-in', sc); i.focus(); i.select(); i.addEventListener('keydown', e => { if (e.key === 'Enter') $('[data-act=input-ok]', sc).click(); }); });
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
    if (view === 'summary' && summary) { app.innerHTML = renderSummary(); return; }
    view = 'tabs';
    const tab = S.ui.tab;
    const body = tab === 'oggi' ? renderOggi() : tab === 'programmi' ? renderProgrammi() : tab === 'progressi' ? renderProgressi() : renderImpostazioni();
    app.innerHTML = body + renderTabbar(tab);
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
    const last = doneSessions().filter(s => s.src !== 'excel').slice(-1)[0];
    if (last) {
      const day = dayOf(last.week, last.day);
      h += `<div class="section"><span class="label">Ultimo allenamento</span><div class="state done"><span class="dot" style="background:${day.color}"></span><span class="grow">${esc(day.name)} · sett. ${last.week}</span><span class="xs">${new Date(last.endedAt).toLocaleDateString('it-IT')}</span>${ICON.check}</div></div>`;
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
    sheet(h);
  }

  // ---------- PROGRESSI ----------
  function renderProgressi() {
    let h = `<div class="page"><h1 class="cond page-title">Progressi</h1><div class="section" style="margin-top:0"><span class="label">Record per esercizio</span><div style="display:flex;flex-direction:column;gap:8px">`;
    const keys = [];
    P.weeks[0].days.forEach(d => !d.rest && d.slots.forEach(sl => { const k = keyOf(sl); if (!keys.find(x => x.k === k)) keys.push({ k, sl }); }));
    for (const { k, sl } of keys) {
      const list = perfs(k); if (!list.length) continue;
      const best = bestOf(list); const lastP = list[list.length - 1]; const ex = lastP.ex;
      h += `<button class="state done" data-act="exstat" data-v="${esc(k)}" style="width:100%;text-align:left;color:#fff;min-height:56px"><span class="grow"><span style="font-weight:600">${esc(exName(sl.ex))}</span><br><span class="xs sub">${esc(sl.range)} rip · ultima ${wtx(ex, lastP.sets[0].w)} × ${lastP.sets[0].r}</span></span><span class="num" style="font-size:22px"><span style="color:var(--gold)">●</span> ${wtx(ex, best.w)} × ${best.r}</span></button>`;
    }
    h += `</div></div><div class="section"><div class="state todo" style="min-height:56px"><span class="grow small">Peso, misure, foto e statistiche avanzate arrivano nelle prossime versioni.</span></div></div></div>`;
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
      <div class="card" style="padding:4px 16px">${sw('sound', 'Suono a fine recupero', 'Tre bip, più un bip 10 secondi prima')}${sw('flash', 'Schermo che lampeggia', 'A fine recupero')}${sw('autoAdvance', 'Avanti automatico', 'A fine esercizio passa al successivo quando finisce il recupero')}
        <button class="setting" data-act="bw" style="width:100%;text-align:left"><div class="grow"><div style="font-weight:600">Peso corporeo</div><div class="xs sub">Serve per i record degli esercizi con assistenza (trazioni)</div></div><span class="num" style="font-size:22px">${fmt(S.settings.bw)} kg</span></button></div>
      <div class="section"><span class="label">Backup dei dati</span><div class="card" style="display:flex;flex-direction:column;gap:10px">
        <div class="small sub">I dati restano su questo iPhone. Fai un backup ogni tanto e salvalo su Google Drive o sul PC: se cambi telefono lo reimporti da qui.</div>
        <button class="btn" data-act="export">Esporta backup</button>
        <button class="btn ghost" data-act="csv">Esporta per Excel (CSV)</button>
        <label class="btn ghost" style="display:flex;align-items:center;justify-content:center;cursor:pointer">Ripristina da un backup<input type="file" accept="application/json,.json" data-act="import" hidden></label>
        <div class="xs sub">Backup automatico su Google Drive: in arrivo in una prossima versione.</div>
      </div></div>
      <div class="section"><span class="label">Attenzione</span><button class="btn danger" data-act="reset">Azzera tutto e riparti dai dati dell'Excel</button></div>
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
    if (slot.tech) h += `<div class="tag" style="margin-top:8px;background:#2A1F45;color:#D9C8FF">Ultima serie: ${TECH[slot.tech]}</div>`;

    // note
    const cat = CAT[ex] || {};
    const m = meta(ex);
    const list = perfs(key);
    const lastP = list[list.length - 1];
    h += `<div class="notes">`;
    if (cat.note) h += `<div class="note">${ICON.info}<div><div class="t" style="color:var(--cyan)">TECNICA (DAL PROGRAMMA)</div><div class="b">${esc(cat.note)}</div></div></div>`;
    h += `<button class="note" data-act="mynote" style="width:100%">${ICON.pin}<div><div class="t" style="color:var(--gold)">LA TUA NOTA</div><div class="b">${m.myNote ? esc(m.myNote) : '<span class="muted">Tocca per aggiungere (sedile, impugnatura…)</span>'}</div></div></button>`;
    if (lastP && lastP.note) h += `<div class="note">${ICON.clock}<div><div class="t" style="color:var(--sub)">NOTA DELL'ULTIMA VOLTA</div><div class="b">${esc(lastP.note)}</div></div></div>`;
    if (en.sessNote) h += `<div class="note">${ICON.clock}<div><div class="t" style="color:#fff">NOTA DI OGGI</div><div class="b">${esc(en.sessNote)}</div></div></div>`;
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
    if (wu.length) {
      h += `<button class="setrow ${en.warmDone ? 'done' : 'todo'}" data-act="warm"><span class="lbl">Risc.</span><span class="num">${wu.map(x => wtxt(x.w) + ' × ' + x.r).join(' · ')}</span>${en.warmDone ? ICON.check : '<span class="xs">tocca a fine riscaldamento</span>'}</button>`;
    }
    const nowIdx = en.sets.findIndex(x => !x.done);
    en.sets.forEach((x, i) => {
      if (x.done) {
        const isRec = best && x === best;
        h += `<button class="setrow done" data-act="reopen" data-v="${i}"><span class="lbl">Serie ${i + 1}</span><span class="num">${wtx(ex, x.w)} × ${x.r}${x.rir != null ? ' · RIR ' + x.rir : ''}</span>${isRec ? '<span class="pill" style="background:var(--gold);color:var(--bg);padding:2px 8px">REC</span>' : ''}${ICON.check}</button>`;
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
      h += `<div class="restbar idle"><div class="in"><button data-act="list">${ICON.list}&nbsp; Esercizi di oggi</button><button data-act="sessnote">Nota di oggi</button></div></div>`;
    }
    return h;
  }
  function videoUrl(slot, en) {
    let url = (CAT[slot.ex] || {}).video;
    if (en.sub) { const sb = ((CAT[slot.ex] || {}).subs || []).find(x => x.name === en.sub); url = sb ? sb.video : (CAT[en.sub] || {}).video; }
    return url || 'https://www.youtube.com/results?search_query=' + encodeURIComponent('Jeff Nippard ' + (en.sub || slot.ex));
  }
  function shortName(n) {
    return n.replace(/^Machine |^Chest-Supported |^Single-Arm |^Single-Leg |^Close-Grip |^Incline |^Standing |^Seated /, '').replace(/ \(.*\)/, '');
  }
  function renderSetCard(s, si, slot, en, i, ex) {
    const x = en.sets[i];
    const g = suggest(slot, i, en.sub);
    const target = slot.rir[i];
    const uni = meta(ex).unilateral;
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
      ${uni ? stepper('L') + stepper('R') : stepper('')}
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
    let records = 0, sets = 0;
    for (const si of Object.keys(s.entries)) { checkRecord(s, +si); if (s.entries[si].recordNew) records++; sets += slotDoneCount(s.entries[si]); }
    s.status = 'done'; s.endedAt = Date.now(); s.rest = null; s.records = records; s.order = ++S.orderSeq;
    summary = { day: day.name, color: day.color, week: s.week, min: Math.round((s.endedAt - s.startedAt) / 60000), dur: clockTxt(s.endedAt - s.startedAt), sets, records, recs: Object.entries(s.entries).filter(([, en]) => en.recordNew).map(([si, en]) => ({ ex: exName(en.sub || day.slots[+si].ex), ...en.recordNew })) };
    save(); view = 'summary'; render(); window.scrollTo({ top: 0 });
  }
  function renderSummary() {
    const m = summary;
    return `<div class="page"><div style="background:${m.color};border-radius:26px;padding:22px 18px"><div class="xs" style="font-weight:700">ALLENAMENTO COMPLETATO</div><div class="cond" style="font-size:44px;margin-top:4px">${esc(m.day)} · sett. ${m.week}</div></div>
      <div class="tiles" style="margin-top:12px"><div class="tile"><span class="xs sub">Durata</span><span class="num big" style="font-weight:800">${m.dur || m.min + '′'}</span></div><div class="tile"><span class="xs sub">Serie</span><span class="num big" style="font-weight:800">${m.sets}</span></div><div class="tile"><span class="xs sub">Record</span><span class="num big" style="font-weight:800;color:var(--gold)">${m.records}</span></div></div>
      ${m.recs.length ? `<div class="section"><span class="label">Record battuti</span>${m.recs.map(r => `<div class="state done" style="color:#fff;margin-bottom:8px"><span class="grow">${esc(r.ex)}</span><span class="num" style="font-size:20px"><span style="color:var(--gold)">●</span> ${r.txt || wtxt(r.w)} × ${r.r}</span></div>`).join('')}</div>` : ''}
      <div class="section"><button class="btn" data-act="home">Torna a Oggi</button></div></div>`;
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
      case 'soon': toast(v + ' arriva in una prossima versione'); break;
      case 'pweek': S.ui.progWeek = +v; save(); render(); break;
      case 'dayinfo': dayInfo(+el.dataset.w, +el.dataset.d); break;
      case 'exstat': exStat(v); break;
      case 'setting': S.settings[v] = !S.settings[v]; save(); render(); if (v === 'sound' && S.settings.sound) { unlockAudio(); beep(880, 0.15); } break;
      case 'export': download('app-palestra-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ app: 'app-palestra', version: VERSION, savedAt: new Date().toISOString(), state: S }), 'application/json'); break;
      case 'csv': exportCSV(); break;
      case 'bw': { const n = await promptNum('Peso corporeo in kg', S.settings.bw); if (n) { S.settings.bw = n; save(); render(); } break; }
      case 'reset':
        if (await ask('Azzerare tutto?', 'Cancello tutti i dati registrati nell\'app e riparto dallo storico dell\'Excel. Prima conviene esportare un backup.', 'Azzera tutto', true)) { S = freshState({ program: S.program, catalog: S.catalog, history: S.sessions.filter(x => x.src === 'excel') }); bindData(); save(); render(); toast('Dati azzerati'); }
        break;
      // allenamento
      case 'slot': goSlot(+v); break;
      case 'finish': finishSession(); break;
      case 'list': listSheet(); break;
      case 'w': case 'r': {
        const en = ensureEntry(s, s.cur); const i = +el.dataset.i; const side = el.dataset.s; const x = en.sets[i];
        const slot = dayOf(s.week, s.day).slots[s.cur]; const ex = en.sub || slot.ex;
        const k = a + side;
        let cur = side ? (x[k] ?? x[a]) : x[a];
        if (a === 'w') cur = +v > 0 ? weightUp(ex, cur ?? 0) : (cur == null ? 0 : weightDown(ex, cur));
        else cur = Math.max(0, (cur ?? 0) + (+v));
        x[k] = cur;
        if (side) { x.w = Math.min(x.wL ?? x.w ?? 0, x.wR ?? x.w ?? 0); x.r = Math.min(x.rL ?? x.r ?? 0, x.rR ?? x.r ?? 0); }
        save(); render(); break;
      }
      case 'wtype': case 'rtype': {
        const en = ensureEntry(s, s.cur); const i = +el.dataset.i; const side = el.dataset.s; const x = en.sets[i];
        const base = a === 'wtype' ? 'w' : 'r'; const k = base + side;
        const n = await promptNum(base === 'w' ? 'Peso in kg' : 'Ripetizioni', side ? (x[k] ?? x[base]) : x[base]);
        if (n == null) return;
        x[k] = base === 'r' ? Math.round(n) : n;
        if (side) { x.w = Math.min(x.wL ?? x.w ?? 0, x.wR ?? x.w ?? 0); x.r = Math.min(x.rL ?? x.r ?? 0, x.rR ?? x.r ?? 0); }
        if (base === 'w') { const ex = en.sub || dayOf(s.week, s.day).slots[s.cur].ex; const m = meta(ex); m.ladder = [...new Set([...(m.ladder || []), n])]; }
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
      case 'skiprest': endRest(false); break;
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
          if (left <= 0) { clearInterval(iv); if (S.settings.sound) beep(880, 0.3); if (S.settings.flash) flash(); }
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
  function subsSheet() {
    const s = activeSession(); const slot = dayOf(s.week, s.day).slots[s.cur]; const en = ensureEntry(s, s.cur);
    const subs = (CAT[slot.ex] || {}).subs || [];
    let h = `<h3>Sostituisci esercizio</h3><div class="small sub" style="margin:-6px 0 12px">Ogni variante ha il suo storico e i suoi record.</div>`;
    h += `<button class="opt" data-act="subpick" data-v="">${!en.sub ? '● ' : ''}${esc(exName(slot.ex))} <span class="xs sub">(originale)</span></button>`;
    for (const x of subs) h += `<button class="opt" data-act="subpick" data-v="${esc(x.name)}">${en.sub === x.name ? '● ' : ''}${esc(exName(x.name))}</button>`;
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
      <button class="opt" data-act="tolast">Fallo per ultimo (macchina occupata)</button>
      <button class="opt" data-act="refill">Ricalcola i suggerimenti per le serie da fare</button>`);
  }
  function noteSheet(kind) {
    const s = activeSession(); const slot = dayOf(s.week, s.day).slots[s.cur]; const en = ensureEntry(s, s.cur); const ex = en.sub || slot.ex;
    const val = kind === 'my' ? (meta(ex).myNote || '') : (en.sessNote || '');
    sheet(`<h3>${kind === 'my' ? 'La tua nota fissa' : 'Nota di oggi'}</h3><div class="small sub" style="margin:-6px 0 12px">${kind === 'my' ? 'Compare ogni volta che fai questo esercizio (sedile, impugnatura, regolazioni…).' : 'Resta solo in questo allenamento (es. "oggi stanco", "scalda bene il ginocchio").'}</div>
      <textarea id="note-ta">${esc(val)}</textarea><div style="height:10px"></div><button class="btn" data-act="notesave" data-v="${kind}">Salva</button>`, sc => { const t = $('#note-ta', sc); t.focus(); });
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
      case 'subpick': {
        en.sub = el.dataset.v || null; fillSets(s, s.cur, en); en.tech = null; closeSheet(); save(); render(); return true;
      }
      case 'subcustom': {
        askInput('Nome dell\'esercizio sostitutivo', '').then(n => { if (!n || !n.trim()) return; en.sub = n.trim(); fillSets(s, s.cur, en); save(); render(); });
        return true;
      }
      case 'rename': { askInput('Nuovo nome per ' + ex, exName(ex)).then(n => { if (n == null) return; meta(ex).alias = n.trim() || null; save(); render(); }); return true; }
      case 'mynote2': closeSheet(); noteSheet('my'); return true;
      case 'uni': { const m = meta(ex); m.unilateral = !m.unilateral; closeSheet(); save(); render(); return true; }
      case 'assist': { meta(ex).assisted = !isAssisted(ex); fillSets(s, s.cur, en); closeSheet(); save(); render(); return true; }
      case 'tolast': { const o = s.seq; o.splice(o.indexOf(s.cur), 1); o.push(s.cur); const n = nextIncomplete(s, o[o.length - 1]); closeSheet(); if (n != null && n !== s.cur) goSlot(n); else { save(); render(); } toast('Spostato in fondo'); return true; }
      case 'refill': { const keep = en.sets.filter(x => x.done); fillSets(s, s.cur, en); keep.forEach((x, i) => { en.sets[i] = x; }); closeSheet(); save(); render(); return true; }
      case 'notesave': {
        const t = $('#note-ta').value.trim();
        if (el.dataset.v === 'my') meta(ex).myNote = t || null; else en.sessNote = t;
        closeSheet(); save(); render(); return true;
      }
    }
    return false;
  }

  // delega degli eventi
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.tagName === 'INPUT') return;
    const a = el.dataset.act;
    if (sheetAct(a, el)) return;
    act(a, el, e);
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
  setInterval(() => { const el = $('#wo-clock'); const s = S && activeSession(); if (el && s) el.textContent = clockTxt(Date.now() - s.startedAt); }, 1000);

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
