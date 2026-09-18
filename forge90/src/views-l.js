// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ================================================================
   FORGE 90 — the phone layout (below 860 px): bottom tabs, the Today
   page, the + sheet, Plan / Kitchen tabs, the You page, and the quick
   sheets for weigh-ins and meal swaps. Wide screens keep the sidebar.
   ================================================================ */
Object.assign(IC, { today: '<path d="M3 10h18M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="m9 16 2 2 4-4"/>' });
if (PHONE_MQ && PHONE_MQ.addEventListener) PHONE_MQ.addEventListener('change', () => { if (!$('#view')) return; closeModal(); render(); });

/* ---------------- bottom tabs and the Plan / Kitchen tabs ---------------- */
const HUBS = { plan: [['calendar', 'Calendário'], ['workouts', 'Treino'], ['diet', 'Nutrição']], kitchen: [['grocery', 'Lista'], ['pantry', 'Despensa'], ['foods', 'Receitas'], ['prep', 'Preparo']] };
function hubOf(page) { if (['calendar', 'workouts', 'diet'].includes(page)) return 'plan'; if (['grocery', 'pantry', 'foods', 'recipe', 'prep'].includes(page)) return 'kitchen'; return null; }
function phoneTab(page) { if (!page || page === 'day') return 'today'; return hubOf(page) || 'you'; }
function hubSegHTML(page) {
  const hub = hubOf(page); const cur = page === 'recipe' ? 'foods' : page;
  return `<div class="hub-top"><h1>${hub === 'plan' ? 'Plano' : 'Cozinha'}</h1></div><nav class="hub-seg" aria-label="${hub === 'plan' ? 'Plano' : 'Cozinha'}">${HUBS[hub].map(([k, l]) => `<a href="#/${k}" class="${cur === k ? 'on' : ''}" ${cur === k ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
}
function tabbarRender(page) {
  const el = $('#tabbar'); if (!el) return; const cur = phoneTab(page); const soon = S ? pantrySoon().length : 0;
  const href = k => k === 'today' ? '#/' : k === 'plan' ? '#/' + (UI.lastPlan || 'calendar') : k === 'kitchen' ? '#/' + (UI.lastKit || 'grocery') : '#/you';
  el.innerHTML = [['today', 'Hoje', 'today'], ['plan', 'Plano', 'cal'], ['add'], ['kitchen', 'Cozinha', 'cart'], ['you', 'Você', 'user']].map(([k, l, ic]) => k === 'add'
    ? `<button type="button" class="tb-add" data-act="plus-sheet" aria-label="Adição rápida"><span>${icon('plus')}</span></button>`
    : `<a class="tb ${cur === k ? 'on' : ''}" href="${href(k)}" ${cur === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${l}</span>${k === 'kitchen' && soon ? `<i class="tb-badge" title="${soon} item${soon === 1 ? '' : 's'} da despensa perto do vencimento">${soon}</i>` : ''}</a>`).join('');
}

/* ---------------- popups slide up from the bottom on phones: drag the handle down (or tap it) to close ---------------- */
let SHD = null;
document.addEventListener('pointerdown', e => {
  const h = e.target.closest && e.target.closest('.sh-hdl'); if (!h) return; const m = h.closest('.modal'); if (!m) return;
  e.preventDefault(); SHD = { y: e.clientY, dy: 0, m }; m.style.transition = 'none'; try { h.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
});
document.addEventListener('pointermove', e => { if (!SHD) return; SHD.dy = Math.max(0, e.clientY - SHD.y); SHD.m.style.transform = `translateY(${SHD.dy}px)`; });
document.addEventListener('pointerup', () => { if (!SHD) return; const { m, dy } = SHD; SHD = null; m.style.transition = ''; if (dy > 90 || dy < 6) closeModal(); else m.style.transform = ''; });
document.addEventListener('pointercancel', () => { if (SHD) { SHD.m.style.transition = ''; SHD.m.style.transform = ''; SHD = null; } });

/* ---------------- the + sheet ---------------- */
function plusSheet() {
  const t = todayISO(); const e = S.plan[t]; const c = gymActive();
  const b = (ic, l, attrs, cls = '') => `<button type="button" class="${cls}" ${attrs}>${icon(ic)}<span>${l}</span></button>`;
  const woL = e && e.w ? (loggedSets(t, sessionRows(e.w)).done ? 'Retomar treino' : 'Iniciar treino') : 'Treino';
  modal(`<div class="plus-m"><div class="row"><h2 style="flex:1">Adição rápida</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Fechar">${icon('x')}</button></div>
    <div class="qa-grid">${canScan() ? b('scan', 'Escanear alimento', 'data-act="scan" data-v="today"', 'hot') : ''}${b('plus', 'Adicionar alimento', 'data-act="qa-pick"', canScan() ? '' : 'hot')}${b('scale', 'Registrar peso', 'data-act="weigh-sheet"')}
      ${b('dumbbell', woL, `data-act="wo-open" data-d="${t}"`)}${c ? b('scan', 'Cartão da academia', `data-act="gym-full" data-id="${c.id}"`) : b('scan', 'Adicionar cartão da academia', 'data-act="gym-add"')}${canScan() ? b('box', 'Escanear para a despensa', 'data-act="scan" data-v="pantry"') : b('box', 'Adicionar à despensa', 'data-act="pan-add"')}</div></div>`, 'sm plus-modal', true);
}

/* ---------------- weigh-in sheet ---------------- */
let WS = null;
function weighSheet(date) {
  const d = date || todayISO(); const ex = S.weights.find(x => x.d === d); const last = sortedWeights().filter(x => x.d <= d).slice(-1)[0];
  WS = { d, v: ex ? +ex.w : last ? +last.w : +S.settings.startWeight, bf: ex && ex.bf != null && ex.bf !== '' ? ex.bf : '' }; renderWeigh();
}
function renderWeigh() {
  const t = todayISO(); const last = sortedWeights().filter(x => x.d < WS.d).slice(-1)[0];
  modal(`<div class="ws-m"><div class="row"><h2 style="flex:1">Registrar peso</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Fechar">${icon('x')}</button></div>
    <div class="tiny muted" style="text-align:center">${WS.d === t ? 'Hoje pela manhã' : esc(fmtDate(WS.d))}${last ? ` · última: ${fmt(last.w, 1)} kg em ${esc(fmtDate(last.d, { weekday: 'short', month: 'short', day: 'numeric' }))}` : ''}</div>
    <div class="big-num"><button type="button" data-act="ws-step" data-v="-0.1" aria-label="Diminuir 0,1 kg">−</button><input id="ws-v" class="num" type="number" inputmode="decimal" step="0.1" min="30" max="300" value="${fmt(WS.v, 1).replace(/,/g, '')}" data-input="ws-v" aria-label="Peso em kg"><button type="button" data-act="ws-step" data-v="0.1" aria-label="Aumentar 0,1 kg">+</button></div>
    <div class="row wrap ws-chips">${[-1, -0.5, 0.5, 1].map(v => `<button type="button" class="btn sm" data-act="ws-step" data-v="${v}">${v > 0 ? '+' : '−'}${Math.abs(v)} kg</button>`).join('')}</div>
    <div class="grid g2" style="gap:10px"><div class="field"><label for="ws-bf">GC % (opcional)</label><input id="ws-bf" class="inp" type="number" inputmode="decimal" step="0.1" min="3" max="60" value="${esc(WS.bf)}" placeholder="Estimativa se ficar em branco" data-input="ws-bf"></div>
      <div class="field"><label for="ws-d">Data</label><input id="ws-d" class="inp" type="date" value="${WS.d}" max="${t}" data-input="ws-d"></div></div>
    <button type="button" class="btn primary block big" id="ws-save" data-act="ws-save">${icon('check')}Salvar ${fmt(WS.v, 1)} kg</button></div>`, 'sm ws-modal');
}
function wsSync() { const i = $('#ws-v'), b = $('#ws-save'); if (i && document.activeElement !== i) i.value = fmt(WS.v, 1).replace(/,/g, ''); if (b) b.innerHTML = `${icon('check')}Salvar ${fmt(WS.v, 1)} kg`; }
function wsSave() {
  const w = Math.round(+WS.v * 10) / 10; if (!(w >= 30 && w <= 300)) { toast('Informe um peso entre 30 e 300 kg'); return; }
  const bf = WS.bf === '' || WS.bf == null ? null : +WS.bf; if (bf != null && !(bf >= 3 && bf <= 60)) { toast('A GC deve ficar entre 3 e 60%'); return; }
  S.weights = S.weights.filter(x => x.d !== WS.d); S.weights.push({ d: WS.d, w, bf }); saveState(); closeModal(); render();
  const t = latestStats(); toast(`Registrado: ${w} kg${bf != null ? ' · GC ' + bf + '%' : ''} — metas atualizadas para ${targetsFor(t.w, t.bf, true).kcal}/${targetsFor(t.w, t.bf, false).kcal} kcal`); WS = null;
}

/* ---------------- meal swap sheet: searchable, favorites first, macros shown ---------------- */
let MS = null;
const slotCat = s => /^snack/.test(s) ? 'snack' : s;
function mealSwap(d, slot) { if (!S.plan[d]) return; MS = { d, slot, q: '', all: false }; renderMealSwap(); }
function renderMealSwap() {
  const cur = (S.plan[MS.d].m || {})[MS.slot]; const r = cur && RECIPE[cur]; const cat = r ? r.cat : slotCat(MS.slot);
  modal(`<div class="ms-m"><div class="row"><h2 style="flex:1">${r ? 'Trocar' : 'Escolher'} ${esc(SLOT_LABEL[MS.slot].toLowerCase())}</h2><button class="btn icon ghost" data-act="close-modal" aria-label="Fechar">${icon('x')}</button></div>
    <div class="tiny muted">${r ? `Agora: ${esc(r.emoji)} ${esc(r.name)} · ` : ''}${esc(fmtDate(MS.d, { weekday: 'long', month: 'short', day: 'numeric' }))} · as porções são ajustadas às suas metas em qualquer opção</div>
    <div class="rec-search">${icon('search')}<input class="inp" type="search" id="ms-q" data-input="ms-q" value="${esc(MS.q)}" placeholder="Buscar receitas ou ingredientes…" aria-label="Buscar receitas" autocomplete="off"></div>
    <div class="row" style="gap:6px"><button type="button" class="btn sm ${MS.all ? '' : 'primary'}" data-act="ms-all" data-v="0">${esc(cat[0].toUpperCase() + cat.slice(1))}</button><button type="button" class="btn sm ${MS.all ? 'primary' : ''}" data-act="ms-all" data-v="1">Tudo</button></div>
    <div class="ms-list" id="ms-list">${msListHTML()}</div>
    ${r ? `<button type="button" class="btn sm ghost danger" data-act="ms-none">${icon('x')}Remover esta refeição</button>` : ''}</div>`, 'ms-modal', true);
}
function msListHTML() {
  const cur = (S.plan[MS.d].m || {})[MS.slot]; const r = cur && RECIPE[cur]; const cat = r ? r.cat : slotCat(MS.slot);
  const words = String(MS.q || '').toLowerCase().split(/\s+/).filter(Boolean);
  const hay = x => [x.name, x.cat, (x.tags || []).join(' '), x.ing.map(([id]) => ING[id] ? ING[id].n : '').join(' ')].join(' ').toLowerCase();
  const list = RECIPES.filter(x => x.id !== cur && recipeAllowed(x) && (MS.all || x.cat === cat) && words.every(w => hay(x).includes(w))).sort((a, b) => (isFav(b.id) ? 1 : 0) - (isFav(a.id) ? 1 : 0) || a.name.localeCompare(b.name));
  return list.map(x => { const m = RPS(x.id); return `<button type="button" class="ms-opt" data-act="ms-pick" data-rid="${x.id}"><span class="em">${esc(x.emoji || '🍽️')}</span><span class="t"><b>${esc(x.name)}</b><small class="num">${MS.all ? x.cat + ' · ' : ''}${fmt(m.k)} kcal · ${fmt(m.p)} g de proteína · ${x.time} min</small></span>${isFav(x.id) ? `<span class="ms-star" title="Favorito">${icon('star')}</span>` : ''}</button>`; }).join('')
    || `<div class="muted small" style="padding:12px 4px">No recipes match${MS.all ? '' : ' — try Everything'}.</div>`;
}
function msSet(rid) {
  const e = S.plan[MS.d]; if (!e) return; const slot = MS.slot; pushUndo('alteração de refeição');
  e.m[slot] = rid || null; markMealEdit(MS.d, slot); MS = null; closeModal();
  commitPlan(rid ? `${SLOT_LABEL[slot]} → ${RECIPE[rid].name}` : `${SLOT_LABEL[slot]} removido`);
}

/* ---------------- TODAY (phone): the dashboard and the day view in one page ---------------- */
const TODAY_PANELS = [
  ['workout', 'Treino', 'full', 'Sessão de hoje e botão Iniciar treino'],
  ['progress', 'Progresso', 'full', 'Peso, tendência, gordura corporal, distância até a meta e recorde mais recente — toque para abrir a página completa'],
  ['nutrition', 'Calorias e macros', 'full', 'Calorias, proteínas, carboidratos e gorduras em relação às metas de hoje'],
  ['meals', 'Refeições', 'full', 'Refeições do dia — toque em uma para ver a receita ou substituir'],
  ['week', 'Esta semana', 'full', 'Dias próximos a este — toque em um dia para abrir'],
  ['gym', 'Cartão da academia', 'full', 'Your membership barcode (Check in at the top shows it too)']
];
const dayHref = d => d === todayISO() ? '#/' : '#/day/' + d;
function dayWord(d) { const n = dayDiff(todayISO(), d); return n === 0 ? 'Hoje' : n === 1 ? 'Amanhã' : n === -1 ? 'Ontem' : fmtDate(d, { weekday: 'long' }); }
function viewToday(date) {
  const t = todayISO(); date = date || t; const st = S.settings;
  if (date >= st.startDate) ensurePlanThrough(addDays(date, 3));
  const c = gymActive();
  const checkin = c ? `<button type="button" class="btn ph-checkin" data-act="gym-full" data-id="${c.id}">${icon('scan')}Check in</button>` : '';
  const idx = planIndex(date);
  const head = `<div class="ph-head"><div class="ph-day"><a class="btn icon ghost" href="${dayHref(addDays(date, -1))}" aria-label="Dia anterior">${icon('left')}</a>
      <div class="d"><small>${esc(dayWord(date))}${idx >= 0 ? ` · Dia ${idx + 1}${idx < LAUNCH_DAYS ? ' de 90' : ''}` : ''}</small><b>${esc(fmtDate(date, { weekday: 'short', month: 'short', day: 'numeric' }))}</b></div>
      <a class="btn icon ghost" href="${dayHref(addDays(date, 1))}" aria-label="Próximo dia">${icon('right')}</a></div>${checkin}</div>`;
  const frac = idx < 0 ? 0 : Math.min(1, (idx + 1) / (idx < LAUNCH_DAYS ? LAUNCH_DAYS : 91));
  const bar = `<div class="ph-cyc" title="${idx >= 0 ? `Dia ${idx + 1}` : 'Antes do Dia 1'}"><i style="width:${frac * 100}%"></i></div>`;
  const weighed = S.weights.some(x => x.d === t); const last = sortedWeights().slice(-1)[0];
  const prompt = date === t && !weighed ? `<button type="button" class="ph-prompt" data-act="weigh-sheet">${icon('scale')}<span><b>Registrar o peso desta manhã</b><small class="num">${last ? `Último: ${fmt(last.w, 1)} kg em ${esc(fmtDate(last.d, { weekday: 'short' }))}` : 'Sua primeira pesagem inicia a linha de tendência'}</small></span><span class="go">Registrar</span></button>` : '';
  if (!inPlan(date)) {
    const before = date < st.startDate;
    return head + bar + prompt + `<div class="card empty-state">${icon('cal')}<h2 style="margin:8px 0 4px">${before ? `Your plan starts ${esc(fmtDate(st.startDate, { weekday: 'long', month: 'long', day: 'numeric' }))}` : 'That day isn’t in the plan'}</h2>
      <a class="btn primary" href="${dayHref(before ? st.startDate : t)}">${before ? 'Ver Dia 1' : 'Voltar para hoje'}</a></div><div style="height:16px"></div>${progressCardHTML()}`;
  }
  const A = computeAll(); const day = A.days[date];
  const panels = { workout: todayWorkoutHTML(date), progress: progressCardHTML(), nutrition: todayMacroHTML(day), meals: todayMealsHTML(date, day, A), week: todayWeekHTML(date, A), gym: gymPanelHTML() };
  const vis = dashOrder('today').filter(id => !dashHidden(id, 'today') && panels[id]); const nHid = dashOrder('today').filter(id => dashHidden(id, 'today')).length;
  return head + bar + `<div class="ph-stack">${syncInviteNote()}${bfEstimateNote()}${prompt}${vis.map(id => `<section class="ph-p" data-panel="${id}">${panels[id]}</section>`).join('')}
    <div class="ph-cust"><button type="button" class="btn sm ghost" data-act="dash-edit" data-l="today">${icon('grid')}Personalizar Hoje</button>${nHid ? `<span class="tiny muted">${nHid} panel${nHid === 1 ? '' : 's'} hidden</span>` : ''}</div></div>`;
}
function todayWorkoutHTML(date) {
  const e = S.plan[date]; const t0 = todayISO();
  if (!e.w) return `<div class="card ph-rest"><span class="pill">Dia de descanso</span><h2>Caminhe 8–10 mil passos</h2><p class="muted small">Hoje não há treino de força. Durma 7–9 horas e mantenha a proteína na meta; as calorias ficam ~${fmt(S.settings.sessionKcal)} kcal menores e as porções são ajustadas automaticamente.</p>
      <button type="button" class="btn sm" data-act="qe" data-d="${date}" data-f="wo">${icon('plus')}Adicionar sessão</button></div>`;
  const t = TEMPLATES[e.w.t]; const rows = sessionRows(e.w); const c = loggedSets(date, rows);
  const groups = [...new Set(rows.map(r => exGroupOf(r.ex)).filter(Boolean))].slice(0, 4);
  const lbl = S.done[date] ? 'Treino concluído — ver' : c.done ? 'Retomar treino' : date > t0 ? 'Pré-visualizar treino' : 'Iniciar treino';
  const kind = { push: 'Push', pull: 'Pull', legs: 'Legs', deload: 'Deload', test: 'Teste de recorde', upper: 'Superior', lower: 'Inferior', full: 'Corpo inteiro', mixed: 'Misto' }[t.kind] || t.short;
  return `<div class="card ph-wo"><div class="row" style="gap:8px"><span class="pill" style="background:${KIND_VAR(t.kind)};color:#fff">${esc(kind)}</span><span class="muted small">${rows.length} exercícios · ${c.total} séries · ~${estMinutes(rows)} min</span>${S.done[date] ? `<span class="pill acc">${icon('check')}Concluído</span>` : ''}</div>
    <h2>${esc(t.name)}</h2>${groups.length ? `<div class="row wrap" style="gap:6px">${groups.map(g => `<span class="pill">${esc(g)}</span>`).join('')}</div>` : ''}
    <div class="ph-prog"><div class="track"><i style="width:${c.total ? c.done / c.total * 100 : 0}%"></i></div><span class="num small muted">${c.done}/${c.total} séries</span></div>
    <button type="button" class="btn primary block big" data-act="wo-open" data-d="${date}">${icon('play')}${lbl}</button>
    <div class="row wrap ph-wo-links"><button type="button" class="btn sm ghost" data-act="qe" data-d="${date}" data-f="wo">${icon('edit')}Alterar sessão</button>${date <= t0 && !S.done[date] && c.done ? `<button type="button" class="btn sm ghost" data-act="toggle-done" data-date="${date}">${icon('check')}Marcar como concluído</button>` : ''}</div></div>`;
}
// the summary on Today and You — one tap to the Progress page
function progressCardHTML() {
  const st = S.settings; const ws = sortedWeights(); const cur = latestStats(); const trend = weightTrend(); const hasW = ws.length > 0;
  const dW = cur.w - st.startWeight; const sign = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '±') + fmt(Math.abs(v), d);
  let spark = '';
  if (ws.length > 1) {
    const lastD = ws[ws.length - 1].d; const pts = movingAvg(ws).filter(x => x.d >= addDays(lastD, -13)); const P = pts.length > 1 ? pts : movingAvg(ws).slice(-2);
    const ys = P.map(p => p.v), mn = Math.min(...ys), mx = Math.max(...ys), sp = Math.max(mx - mn, 1), x0 = P[0].d, span = Math.max(1, dayDiff(x0, P[P.length - 1].d));
    const X = d => 5 + dayDiff(x0, d) / span * 128, Y = v => 7 + (mx - v) / sp * 34; const L = P[P.length - 1];
    spark = `<svg class="pc-spark" viewBox="0 0 140 48" aria-hidden="true"><polyline points="${P.map(p => X(p.d).toFixed(1) + ',' + Y(p.v).toFixed(1)).join(' ')}" fill="none" stroke="var(--prot)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${X(L.d).toFixed(1)}" cy="${Y(L.v).toFixed(1)}" r="4" fill="var(--prot)" stroke="var(--solid)" stroke-width="2"/></svg>`;
  }
  const pr = recentPRs(1)[0];
  const mon = mondayOf(todayISO()); const wk = Array.from({ length: 7 }, (_, i) => addDays(mon, i)).filter(d => S.plan[d] && S.plan[d].w);
  const done = wk.filter(d => S.done[d]).length;
  return `<a class="card pcard" href="#/progress" aria-label="Progresso: ${fmt(cur.w, 1)} kg${hasW ? `, ${sign(dW)} kg desde o início` : ''}. Abrir a página de progresso">
    <span class="pc-top"><span class="h">Progresso</span><span class="see">Ver tudo${icon('right')}</span></span>
    <span class="pc-main"><span><small>Peso</small><b class="num">${fmt(cur.w, 1)} <span>kg</span></b><small class="num ${hasW ? (dW <= 0 ? 'good' : '') : ''}">${hasW ? `${sign(dW)} kg desde o início` : 'Registre uma pesagem para iniciar a tendência'}</small></span>${spark}</span>
    <span class="pc-mini"><span><small>GC</small><b class="num">${fmt(cur.bf, 1)}<span class="u">%${cur.est ? ' est.' : ''}</span></b></span><span><small>Tendência</small><b class="num">${trend ? sign(-trend.rate, 2) : '—'}<span class="u"> kg/sem.</span></b></span><span><small>Até a meta</small><b class="num">${fmt(Math.max(0, cur.w - st.goalWeight), 1)}<span class="u"> kg</span></b></span></span>
    <span class="pc-foot"><span class="pc-pr">${icon('trophy')}<span>${pr ? `${esc(EX[pr.ex].name)} ${fmt(+pr.set.w || 0, (+pr.set.w || 0) % 1 ? 1 : 0)} kg × ${pr.set.r} rep. · ${esc(fmtDate(pr.d, { weekday: 'short' }))}` : 'Registre séries para iniciar seu painel de recordes'}</span></span>${wk.length ? `<span class="wkdots">${wk.map(d => `<i class="${S.done[d] ? 'done' : ''}"></i>`).join('')}<span class="num">${done}/${wk.length} nesta semana</span></span>` : ''}</span></a>`;
}
function todayMacroHTML(day) {
  return `<div class="card ph-macro"><div class="kc"><b class="num">${fmt(day.totals.k)}</b><small>de ${fmt(day.tg.kcal)} kcal${(day.extras || []).length ? ' · incl. alimento adicionado' : ''}</small><span class="pill ${day.isTrain ? 'acc' : ''}">${day.isTrain ? 'Treino' : 'Descanso'}</span></div><div class="mb">${macroBars(day.totals, day.tg)}</div></div>`;
}
function todayMealsHTML(date, day, A) {
  const rows = MEAL_SLOTS.map(slot => {
    const m = day.meals.find(x => x.slot === slot); const b = A.batches.info[date + '|' + slot];
    const swp = `<button type="button" class="ph-swp" data-act="meal-swap" data-d="${date}" data-slot="${slot}" aria-label="Trocar ${esc(SLOT_LABEL[slot].toLowerCase())}" title="Trocar">${icon('loop')}</button>`;
    if (!m) return `<div class="ph-meal empty"><button type="button" class="ph-mb" data-act="meal-swap" data-d="${date}" data-slot="${slot}"><span class="em">+</span><span class="t"><span class="slot">${SLOT_LABEL[slot]}</span><b class="muted">Nada planejado — escolha uma refeição</b></span></button></div>${extrasHTML(day, slot)}`;
    return `<div class="ph-meal"><button type="button" class="ph-mb" data-act="recipe" data-rid="${m.r.id}"><span class="em">${esc(m.r.emoji)}</span><span class="t"><span class="slot">${SLOT_LABEL[slot]} ${batchBadge(b)}${shareBadge(date, slot)}</span><b>${esc(m.r.name)}</b><small class="num">${fmt(m.m.k)} kcal · ${fmt(m.m.p)} g de proteína</small></span></button>${swp}</div>${extrasHTML(day, slot)}`;
  }).join('');
  return `<div class="ph-sec"><h2>Refeições</h2><span class="spacer"></span>${canScan() ? `<button type="button" class="btn icon ghost" data-act="scan" data-v="today" data-d="${date}" aria-label="Escanear alimento" title="Escanear alimento">${icon('scan')}</button>` : ''}<button type="button" class="btn sm ghost" data-act="qa-pick" data-d="${date}">${icon('plus')}Adicionar alimento</button></div>
    <div class="card pad0 ph-meals">${rows}</div><div class="tiny muted ph-hint">Toque em uma refeição para ver a receita e as porções deste dia. ${icon('loop')} faz a troca.</div>`;
}
function todayWeekHTML(date, A) {
  const t = todayISO(); const days = Array.from({ length: 7 }, (_, k) => addDays(date, k - 3));
  return `<div class="ph-sec"><h2>Esta semana</h2><span class="spacer"></span><a class="btn sm ghost" href="#/calendar">Calendário ${icon('right')}</a></div><div class="ph-week">${days.map(d => {
    const e = inPlan(d) ? S.plan[d] : null; const tp = e && e.w ? TEMPLATES[e.w.t] : null; const dd = parseISO(d);
    return `<a class="w7 ${d === date ? 'on' : ''} ${d === t ? 'today' : ''} ${inPlan(d) ? '' : 'off'}" href="${dayHref(d)}" aria-label="${esc(fmtDate(d, { weekday: 'long', month: 'short', day: 'numeric' }))}${tp ? ' · ' + esc(tp.short) : ''}"><small>${DOW[dd.getDay()]}</small><b class="num">${dd.getDate()}</b><i style="${tp ? `background:${KIND_VAR(tp.kind)}` : ''}"></i>${S.done[d] ? '<span class="dn">' + icon('check') + '</span>' : ''}</a>`; }).join('')}</div>`;
}

/* ---------------- KITCHEN · List (phone): To buy / In the cart / At home ---------------- */
const groStateOf = (r, got) => { const s = groRowState(r, got); return s.covered && s.checked ? 'home' : s.checked ? 'cart' : 'buy'; };
function groceryPhoneHTML(G) {
  const { GL, got, opts } = G; const tab = ['buy', 'cart', 'home'].includes(UI.groTab) ? UI.groTab : 'buy';
  const n = { buy: 0, cart: 0, home: 0 }; GL.rows.forEach(r => n[groStateOf(r, got)]++); const all = GL.rows.length;
  const show = GL.rows.filter(r => groStateOf(r, got) === tab);
  const aisles = {}; show.forEach(r => { const ai = ING[r.id].a; (aisles[ai] = aisles[ai] || []).push(r); });
  const order = AISLES.concat(Object.keys(aisles).filter(a => !AISLES.includes(a)));
  const unitOf = id => ING[id].u ? ING[id].u + 's' : ING[id].ml ? 'ml' : 'g';
  const row = r => { const { id, total, have } = r; const g = groceryText(id, total); const st = groStateOf(r, got); const pi = packInfo(id); const npk = Math.ceil(total / pi.P - 1e-9);
    const pk = pi.w >= .3 && pi.P > 1 ? `≈ ${npk} embalagem${npk === 1 ? '' : 'ens'}` : '';
    const note = st === 'home' ? `<small class="at">${icon('box')}Na sua despensa${have > total * 1.01 ? ' · ' + esc(pantryQtyText(id, have)) : ''}</small>` : have > 0 ? `<small class="at">${icon('box')}${esc(pantryQtyText(id, have))} em casa</small>` : pk ? `<small>${pk} · ${fmt(pi.P)} ${unitOf(id)} cada</small>` : '';
    return `<div class="pg-row ${st}"><button type="button" class="pg-it" data-act="gro-tap" data-id="${id}" aria-pressed="${st !== 'buy'}"><span class="ck">${icon('check')}</span><span class="t"><b>${esc(g.name)}</b>${note}</span><span class="q num">${esc(g.qty)}${g.sub ? `<small>${esc(g.sub)}</small>` : ''}</span></button>${st === 'home' ? `<button type="button" class="btn sm pg-need" data-act="gro-need" data-id="${id}">Preciso comprar</button>` : ''}</div>`; };
  const list = order.filter(a => aisles[a]).map(a => `<section class="pg-aisle"><h3>${esc(a)}</h3><div class="card pad0">${aisles[a].sort((x, y) => ING[x.id].n.localeCompare(ING[y.id].n)).map(row).join('')}</div></section>`).join('');
  const empty = { buy: all ? 'Tudo está no carrinho ou em casa.' : 'Nada planejado para esta semana.', cart: 'Toque nos itens em Comprar enquanto faz as compras — eles aparecerão aqui.', home: 'Nada da sua despensa cobre esta semana.' }[tab];
  return `<div class="row pg-tools"><select class="inp" data-input="gro-week" aria-label="Semana">${opts}</select><button type="button" class="btn icon" data-act="copy-list-ph" aria-label="Copiar a lista" title="Copiar a lista">${icon('list')}</button></div>
    ${syncGroceryNote(G.wd, G.A)}
    <div class="pg-chips" role="group" aria-label="Mostrar">${[['buy', 'Comprar'], ['cart', 'No carrinho'], ['home', 'Em casa']].map(([k, l]) => `<button type="button" class="chipb ${tab === k ? 'on' : ''}" data-act="gro-tab" data-v="${k}" aria-pressed="${tab === k}">${l}<span class="n num">${n[k]}</span></button>`).join('')}</div>
    ${all ? `<div class="ph-prog"><div class="track"><i style="width:${(n.cart + n.home) / all * 100}%"></i></div><span class="num small muted">${n.cart + n.home} de ${all} organizados</span></div>
      <div class="row pg-all"><button type="button" class="btn sm ghost" data-act="gro-all" data-v="1" ${n.buy ? '' : 'disabled'}>${icon('check')}Marcar tudo</button><button type="button" class="btn sm ghost" data-act="gro-all" data-v="0" ${n.cart + n.home ? '' : 'disabled'}>${icon('x')}Desmarcar tudo</button></div>` : ''}
    ${GL.note}
    ${tab === 'home' && n.home ? `<div class="tiny muted" style="margin:0 2px 10px">Sua despensa já cobre estes itens, então eles aparecem marcados. Toque em <b>Preciso comprar</b> se a despensa estiver desatualizada.</div>` : ''}
    ${list || `<div class="card empty-state">${icon('cart')}<div>${empty}</div></div>`}
    <div class="tiny muted" style="margin-top:12px">Arroz e quinoa aparecem em peso cru (~⅓ do peso cozido). Temperos, alho, limão e spray culinário não aparecem na lista.</div>
    ${n.cart ? `<div class="pg-dock"><button type="button" class="btn primary big block" data-act="gro-pantry">${icon('box')}Colocar ${n.cart} item${n.cart === 1 ? '' : 'ns'} na despensa</button></div>` : ''}`;
}
function viewPrep() {
  const G = groceryWeek();
  return `<div class="row pg-tools"><select class="inp" data-input="gro-week" aria-label="Semana">${G.opts}</select></div>
    ${prepScheduleHTML(G)}<div style="height:16px"></div>${moneySaverHTML(G.wd)}`;
}

/* ---------------- YOU (phone) ---------------- */
const SET_GROUPS = {
  training: ['Dias de treino e cronômetro', () => trainingDaysCardHTML() + restSettingsHTML()],
  targets: ['Metas e ritmo de perda', () => lossRateCardHTML() + nutritionCardHTML()],
  body: ['Corpo e objetivos', () => bodyGoalsCardHTML()],
  gym: ['Cartões da academia', () => gymSettingsHTML()],
  food: ['Preferências alimentares', () => foodPrefsCardHTML()],
  money: ['Economia', () => moneyCardHTML()],
  app: ['Aparência e dados', () => appearanceCardHTML()],
  api: ['Conexões de API', () => apiCardHTML()]
};
function settingsGroupHTML(g) {
  const [title, f] = SET_GROUPS[g];
  return `<div class="page-head"><div class="t"><a class="back-lnk" href="${isPhone() ? '#/you' : '#/settings'}">${icon('left')}${isPhone() ? 'Você' : 'Configurações'}</a><h1>${esc(title)}</h1></div></div><div class="set-group">${f()}</div>`;
}
function viewYou() {
  const st = S.settings; const u = AUTH.user; const srv = AUTH.mode === 'server';
  const name = (u && u.name) || (S.profile && (S.profile.nick || S.profile.first)) || 'Você';
  const cur = latestStats(); const tT = targetsFor(cur.w, cur.bf, true), tR = targetsFor(cur.w, cur.bf, false);
  const row = (ic, l, sub, attrs) => `<a class="yrow" ${attrs}><span class="yi">${icon(ic)}</span><span class="t"><b>${l}</b><small>${sub}</small></span>${icon('right')}</a>`;
  const group = (title, rows) => rows.filter(Boolean).length ? `<section class="ygroup"><h3>${title}</h3><div class="card pad0">${rows.filter(Boolean).join('')}</div></section>` : '';
  const seen = new Set(); const prs = recentPRs(20).filter(p => !seen.has(p.ex) && seen.add(p.ex)).slice(0, 3);
  const cards = gymCards();
  return `<div class="you-top"><div class="me">${avatarHTML(u || { name })}<div><b>${esc(name)}</b><div class="tiny muted">${srv && u ? (u.role === 'admin' ? 'Administrador · ' : '') + esc(u.email || '') : 'Salvo neste navegador'}${syncActive() ? ` · refeições sincronizadas com ${esc(syncName())}` : ''}</div></div></div>${srv && u ? `<button type="button" class="btn icon ghost" data-act="logout" aria-label="Sair" title="Sair">${icon('logout')}</button>` : ''}</div>
    ${progressCardHTML()}
    <section class="ygroup"><div class="ph-sec"><h2>Recordes recentes</h2><span class="spacer"></span><a class="btn sm ghost" href="#/progress">Todo o progresso ${icon('right')}</a></div>
      ${prs.length ? `<div class="card pad0">${prs.map(p => `<a class="yrow" href="#/progress"><span class="yi pr">${icon('trophy')}</span><span class="t"><b>${esc(EX[p.ex].name)}</b><small class="num">${fmt(+p.set.w || 0, (+p.set.w || 0) % 1 ? 1 : 0)} kg × ${p.set.r} rep. · ${esc(fmtDate(p.d))}</small></span>${icon('right')}</a>`).join('')}</div>` : `<div class="card empty-state">${icon('trophy')}<div>Registre suas séries em um treino para exibir os recordes pessoais aqui.</div></div>`}</section>
    <section class="ygroup"><div class="ph-sec"><h2>Cartões da academia</h2><span class="spacer"></span><a class="btn sm ghost" href="#/settings/gym">Gerenciar</a></div>
      ${cards.length ? `<div class="card pad0">${cards.map(c => `<button type="button" class="yrow" data-act="gym-full" data-id="${c.id}"><span class="gcy ${c.fmt === 'qr' ? 'qr' : ''}">${barcodeSVG(c.code, c.fmt, { h: 40 })}</span><span class="t"><b>${esc(c.name)}</b><small class="num">${esc(gymHuman(c))}</small></span>${icon('expand')}</button>`).join('')}</div>`
        : `<button type="button" class="btn block" data-act="gym-add">${icon('plus')}Adicionar cartão da academia</button>`}</section>
    ${group('Plano', [row('dumbbell', 'Plano de treino', 'Sessões, trocas e biblioteca de exercícios', 'href="#/workouts"'), row('clock', 'Dias de treino e cronômetro', `${st.trainDays.length} ${st.trainDays.length === 1 ? 'dia' : 'dias'} por semana · descanso ${mmss((+st.restDef || 90) * 1000)} · ${esc(restSoundOf(st.restSound).n)}`, 'href="#/settings/training"'),
      row('target', 'Metas e ritmo de perda', `${fmt(st.rate, 2)} kg/sem. · ${fmt(tT.kcal)} / ${fmt(tR.kcal)} kcal`, 'href="#/settings/targets"'), row('scale', 'Corpo e objetivos', `Meta: ${st.goalWeight} kg · GC ${st.goalBF}%`, 'href="#/settings/body"')])}
    ${group('Alimentação', [row('food', 'Preferências alimentares', esc(fpCountText()), 'href="#/settings/food"'), row('book', 'Alimentos e macros', `${Object.keys(ING).length} alimentos`, 'href="#/foods" data-act="go-foods" data-v="foods"'), row('flame', 'Economia', st.shareIngredients !== false ? 'Ativada · receitas compartilham ingredientes' : 'Desativada', 'href="#/settings/money"')])}
    ${group('Aplicativo', [row(effTheme() === 'light' ? 'sun' : 'moon', 'Aparência e dados', `${{ dark: 'Tema escuro', light: 'Tema claro', system: 'Tema do sistema' }[st.theme] || st.theme} · backup e restauração`, 'href="#/settings/app"'), srv ? row('users', 'Sincronização de refeições', syncActive() ? `Sincronizado com ${esc(syncName())}` : 'Compartilhe refeições e a lista de compras com alguém', 'href="#/account" data-act="go-acc-sync"') : '', srv && isAdmin() ? row('link', 'Conexões de API', 'Importação de receitas do Mealie', 'href="#/settings/api"') : ''])}
    ${srv ? group('Conta', [row('user', 'Perfil e senha', esc((u && u.email) || ''), 'href="#/account"'), isAdmin() ? row('shield', 'Painel administrativo', 'Usuários, e-mail e segurança', 'href="#/admin"') : '']) : ''}
    <div class="you-foot"><button type="button" class="btn sm ghost" data-act="theme-toggle">${icon(effTheme() === 'light' ? 'moon' : 'sun')}${effTheme() === 'light' ? 'Modo escuro' : 'Modo claro'}</button>${settingsFootHTML()}</div>`;
}
function copyListPhone() {
  const G = GRO_ROWS; if (!G) return; const got = groGot();
  const txt = G.rows.map(r => { const g = groceryText(r.id, r.total); return `${groStateOf(r, got) === 'buy' ? '[ ]' : '[x]'} ${g.name} — ${g.qty}`; }).join('\n');
  (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Lista de compras copiada'), () => toast('A cópia não está disponível neste navegador'));
}

Object.assign(ACT, {
  'plus-sheet': () => plusSheet(),
  'weigh-sheet': el => weighSheet(el.dataset.d),
  'ws-step': el => { WS.v = Math.max(80, Math.min(500, Math.round((+WS.v + +el.dataset.v) * 10) / 10)); wsSync(); },
  'ws-save': () => wsSave(),
  'meal-swap': el => mealSwap(el.dataset.d, el.dataset.slot),
  'ms-all': el => { MS.all = el.dataset.v === '1'; renderMealSwap(); },
  'ms-pick': el => msSet(el.dataset.rid),
  'ms-none': () => msSet(null),
  'gro-tab': el => { UI.groTab = el.dataset.v; saveUI(); render(); },
  'gro-tap': el => { const G = GRO_ROWS; if (!G) return; const r = G.rows.find(x => x.id === el.dataset.id); if (!r) return; const st = groRowState(r, groGot());
    groSetMany([[r.id, st.covered ? (st.checked ? 0 : null) : (st.checked ? null : 1)]]); },
  'gro-need': el => { groSetMany([[el.dataset.id, 0]]); toast('Movido para Comprar'); },
  'copy-list-ph': () => copyListPhone(),
  'go-foods': el => { UI.foodsTab = el.dataset.v; saveUI(); location.hash = '#/foods'; render(); },
  'go-acc-sync': () => { UI._scrollTo = 'acc-sync'; location.hash = '#/account'; }
});
document.addEventListener('input', e => { const t = e.target; if (!t || !t.dataset) return;
  if (t.dataset.input === 'ws-v' && WS) { WS.v = +t.value || 0; const b = $('#ws-save'); if (b) b.innerHTML = `${icon('check')}Salvar ${fmt(WS.v, 1)} kg`; }
  if (t.dataset.input === 'ws-bf' && WS) WS.bf = t.value;
  if (t.dataset.input === 'ws-d' && WS && t.value) { WS.d = t.value > todayISO() ? todayISO() : t.value; }
  if (t.dataset.input === 'ms-q' && MS) { MS.q = t.value; const l = $('#ms-list'); if (l) l.innerHTML = msListHTML(); }
});
