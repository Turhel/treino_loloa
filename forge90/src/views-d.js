// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ============================================================
   FORGE 90 — Custom exercise editor (exercise library + cards)
   ============================================================ */
const GROUP_REGION = { Chest: 'chest', Back: 'lats', Shoulders: 'sideDelt', Biceps: 'biceps', Triceps: 'triceps', Quads: 'quads', Hamstrings: 'hamstrings', Glutes: 'glutes', Calves: 'calves', Core: 'abs' };
let XE = null;
function slotOptionsFor(group, sel) {
  const slots = Object.entries(SLOTS).filter(([, v]) => v.group === group);
  return `<option value="">Somente biblioteca — não adicionar à rotação</option>` + slots.map(([k, v]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>Adicionar à rotação “${esc(v.label)}” (${v.vars.filter(id => !exOffNow(id)).length + (CUSTOM_SLOT[k] || []).filter(e => e.id !== (XE && XE.id)).length} → ${v.vars.filter(id => !exOffNow(id)).length + (CUSTOM_SLOT[k] || []).filter(e => e.id !== (XE && XE.id)).length + 1} variações)</option>`).join('');
}
function exerciseEditor(id, group) {
  const e = id ? S.customExercises[id] : null;
  const g = e ? e.group : (group || 'Chest');
  XE = { id: id || null, group: g, compound: e ? !!e.compound : false, bw: e ? !!e.bw : false,
    primary: new Set(e ? e.primary : [GROUP_REGION[g]]), secondary: new Set(e ? e.secondary : []), slot: e ? (e.slot || '') : '' };
  const chips = which => Object.entries(REGION_LABEL).map(([k, l]) => `<button type="button" class="mus ${XE[which].has(k) ? 'on ' + which : ''}" data-act="xe-mus" data-k="${k}" data-which="${which}">${esc(l)}</button>`).join('');
  modal(`<div class="row"><h2 style="flex:1">${id ? 'Editar exercício' : 'Novo exercício'}</h2><button class="btn icon ghost" data-act="close-modal">${icon('x')}</button></div>
    <form data-form="exercise" class="xe" style="margin-top:12px">
      <div class="xe-top"><div class="xe-fields">
        <div class="field"><label>Nome do exercício</label><input class="inp" name="name" value="${esc(e ? e.name : '')}" placeholder="ex.: desenvolvimento landmine" required></div>
        <div class="grid g2" style="gap:10px;margin-top:10px">
          <div class="field"><label>Grupo muscular</label><select class="inp" name="group" data-input="xe-group">${EX_GROUPS.map(x => `<option ${x === g ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
          <div class="field"><label>Equipamento</label><input class="inp" name="equip" value="${esc(e ? e.equip : '')}" placeholder="ex.: barra + landmine"></div></div>
        <div class="row wrap" style="gap:14px;margin-top:10px">
          <div class="seg"><button type="button" class="${!XE.compound ? 'on' : ''}" data-act="xe-type" data-v="0">Isolador</button><button type="button" class="${XE.compound ? 'on' : ''}" data-act="xe-type" data-v="1">Composto</button></div>
          <label class="small"><input type="checkbox" name="bw" ${XE.bw ? 'checked' : ''}> Peso corporal (registrar apenas repetições)</label></div></div>
        <div class="xe-map" id="xe-map">${muscleMap([...XE.primary], [...XE.secondary])}</div></div>
      <div class="field" style="margin-top:12px"><label>Músculos principais</label><div class="mus-row">${chips('primary')}</div></div>
      <div class="field" style="margin-top:10px"><label>Músculos secundários</label><div class="mus-row">${chips('secondary')}</div></div>
      <div class="field" style="margin-top:12px"><label>Plano de treino</label><select class="inp" name="slot" id="xe-slot">${slotOptionsFor(g, XE.slot)}</select>
        <span class="tiny muted">Exercícios adicionados entram na rotação semanal a partir desta semana — as semanas anteriores permanecem como estavam.</span></div>
      <div class="grid g2" style="gap:10px;margin-top:12px">
        <div class="field"><label>Como executar (uma etapa por linha)</label><textarea class="inp" name="steps" rows="5" style="height:auto;padding:8px 11px" placeholder="Posicione-se…&#10;Desça com controle…">${esc(e ? e.steps.join('\n') : '')}</textarea></div>
        <div class="field"><label>Pontos-chave de execução (um por linha)</label><textarea class="inp" name="cues" rows="5" style="height:auto;padding:8px 11px" placeholder="Cotovelos junto ao corpo&#10;Amplitude completa">${esc(e ? e.cues.join('\n') : '')}</textarea></div></div>
      <div class="field" style="margin-top:10px"><label>Erro comum a evitar</label><input class="inp" name="mistake" value="${esc(e ? e.mistake : '')}" placeholder="ex.: encolher os ombros"></div>
      <div class="row" style="justify-content:flex-end;margin-top:16px">
        ${id ? `<button type="button" class="btn danger" data-act="ex-del" data-id="${id}" style="margin-right:auto">${icon('trash')}Excluir</button>` : ''}
        <button type="button" class="btn" data-act="close-modal">Cancelar</button><button class="btn primary" type="submit">${id ? 'Salvar alterações' : 'Adicionar exercício'}</button></div></form>`);
}
function refreshXEMap() { const m = $('#xe-map'); if (m && XE) m.innerHTML = muscleMap([...XE.primary], [...XE.secondary]); }
function saveExercise(form) {
  const fd = new FormData(form); const name = String(fd.get('name') || '').trim();
  if (!name) { toast('Dê um nome ao exercício'); return; }
  const group = fd.get('group');
  if (!XE.primary.size) XE.primary.add(GROUP_REGION[group]);
  const lines = k => String(fd.get(k) || '').split('\n').map(x => x.trim()).filter(Boolean);
  const prev = XE.id ? S.customExercises[XE.id] : null;
  const slot = fd.get('slot') || null;
  const id = XE.id || 'ux_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24) + '_' + Date.now().toString(36).slice(-4);
  const since = prev && prev.slot === slot ? prev.since : mondayOf(maxISO(todayISO(), S.settings.startDate));
  S.customExercises[id] = { id, name, group, equip: String(fd.get('equip') || '').trim(), compound: XE.compound, bw: !!fd.get('bw'),
    primary: [...XE.primary], secondary: [...XE.secondary].filter(k => !XE.primary.has(k)), slot, since,
    steps: lines('steps'), cues: lines('cues'), mistake: String(fd.get('mistake') || '').trim() };
  rebuildExercises(); saveState(); closeModal(); render();
  toast(`${name} ${prev ? 'updated' : 'added'}${slot ? ` — joins the ${SLOTS[slot].label.toLowerCase()} rotation` : ''}`);
}
document.addEventListener('submit', e => { if (e.target.dataset && e.target.dataset.form === 'exercise') { e.preventDefault(); saveExercise(e.target); } });
document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.input === 'xe-group' && XE) { XE.group = e.target.value; const s = $('#xe-slot'); if (s) s.innerHTML = slotOptionsFor(XE.group, ''); } });
Object.assign(ACT, {
  'ex-new': el => exerciseEditor(null, el.dataset.group),
  'ex-edit': el => exerciseEditor(el.dataset.id),
  'xe-type': el => { XE.compound = el.dataset.v === '1'; $$('[data-act="xe-type"]').forEach(b => b.classList.toggle('on', b === el)); },
  'xe-mus': el => {
    const k = el.dataset.k, which = el.dataset.which, other = which === 'primary' ? 'secondary' : 'primary';
    if (XE[which].has(k)) XE[which].delete(k); else { XE[which].add(k); XE[other].delete(k); }
    $$(`[data-act="xe-mus"][data-k="${k}"]`).forEach(b => { const w = b.dataset.which; b.className = 'mus' + (XE[w].has(k) ? ' on ' + w : ''); });
    refreshXEMap();
  },
  'ex-del': el => { const x = S.customExercises[el.dataset.id]; confirmBox('Excluir exercício?', `Excluir <b>${esc(x.name)}</b>? Ele sairá da rotação; as séries já registradas continuarão salvas, mas não aparecerão no quadro de recordes.`, 'Excluir', () => {
    delete S.customExercises[x.id]; rebuildExercises(); saveState(); render(); toast('Exercício excluído'); }, true); }
});

/* ---------------- quick edit (dashboard): change a day's workout and meals without leaving the page ---------------- */
let QE = null;
function quickEdit(date, focus) { QE = { date, focus: focus || 'meals' }; renderQuickEdit(); }
function renderQuickEdit() {
  if (!QE) return; const d = QE.date; ensurePlanThrough(d);
  const e = S.plan[d]; if (!e) return; const A = computeAll(); const x = A.days[d];
  const prev = inPlan(addDays(d, -1)) ? addDays(d, -1) : null, next = inPlan(addDays(d, 1)) ? addDays(d, 1) : null;
  const ph = phaseForWeek(planWeek(d));
  const tplOpt = k => `<option value="${k}" ${e.w && e.w.t === k ? 'selected' : ''}>${esc(TEMPLATES[k].name)}</option>`;
  const woOpts = `<option value="">— Dia de descanso —</option>` + (e.w && TEMPLATES[e.w.t] && TEMPLATES[e.w.t].legacy ? `<option value="${e.w.t}" selected>${esc(TEMPLATES[e.w.t].name)} (plano anterior)</option>` : '')
    + `<optgroup label="Fase desta semana — ${esc(ph.name)}">${ph.templates.map(tplOpt).join('')}</optgroup>`
    + ALL_PHASES.filter(p => p.templates.join() !== ph.templates.join()).map(p => `<optgroup label="${esc(p.name)}">${p.templates.map(tplOpt).join('')}</optgroup>`).join('');
  let woBody = '';
  if (e.w && TEMPLATES[e.w.t]) { const t = TEMPLATES[e.w.t]; const rows = sessionRows(e.w);
    woBody = `<div class="row wrap" style="gap:6px;margin-top:10px"><span class="pill" style="background:${KIND_VAR(t.kind)};color:#fff">${esc(t.short || t.name)}</span><span class="small muted">${rows.reduce((a, r) => a + r.sets, 0)} séries · ~${estMinutes(rows)} min</span></div>
      <div class="sets" style="margin-top:8px;gap:5px">${rows.map(r => `<button type="button" class="pill qe-ex ${r.daySwap ? 'acc' : ''}" data-act="swap-day" data-date="${d}" data-i="${r.i}" data-back="qe" data-tip-ex="${r.ex.id}" title="Trocar ${esc(r.ex.name)} somente neste dia">${esc(r.ex.name)} <span class="muted">${r.sets}×${esc(r.reps)}</span>${icon('loop')}</button>`).join('')}</div>
      <div class="tiny muted" style="margin-top:6px">Toque em um exercício para trocá-lo somente neste dia.</div>`; }
  else woBody = `<div class="small muted" style="margin-top:8px">Dia de descanso — escolha uma sessão acima para treinar neste dia.</div>`;
  const mealRow = sl => { const cur = e.m && e.m[sl]; const cat = SLOT_CAT[sl]; const m = x.meals.find(q => q.slot === sl);
    const list = sortRecipes(RECIPES.filter(r => r.cat === cat && (recipeAllowed(r) || r.id === cur))).sort((a, b) => isFav(b.id) - isFav(a.id));
    const opt = r => { const ps = RPS(r.id); return `<option value="${r.id}" ${r.id === cur ? 'selected' : ''}>${isFav(r.id) ? '★ ' : ''}${esc(r.name)} · ${fmt(ps.k)} kcal · ${fmt(ps.p)}P${recipeAllowed(r) ? '' : ' (bloqueado)'}</option>`; };
    return `<div class="qe-meal ${QE.focus === 'meal:' + sl ? 'focus' : ''}"><span class="em">${m ? esc(m.r.emoji) : '—'}</span><div style="flex:1;min-width:0"><label class="tiny muted" for="qe-${sl}">${SLOT_LABEL[sl]}</label>
      <select class="inp" id="qe-${sl}" data-input="qe-meal" data-slot="${sl}"><option value="">— nenhum —</option>${list.map(opt).join('')}</select></div>
      <span class="num small qe-mac">${m ? `<b>${fmt(m.m.k)}</b> kcal<br><span style="color:var(--prot)">${fmt(m.m.p)}P</span>` : ''}</span></div>`; };
  modal(`<div class="row"><button class="btn icon ghost" data-act="qe-day" data-d="${prev || ''}" ${prev ? '' : 'disabled'} aria-label="Dia anterior">${icon('left')}</button>
      <div style="flex:1;text-align:center"><div class="tiny muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.08em">Edição rápida · ${x.isTrain ? 'dia de treino' : 'dia de descanso'}</div><h2 style="margin-top:2px">${d === todayISO() ? 'Hoje · ' : ''}${fmtDate(d, { weekday: 'long', month: 'short', day: 'numeric' })}</h2></div>
      <button class="btn icon ghost" data-act="qe-day" data-d="${next || ''}" ${next ? '' : 'disabled'} aria-label="Próximo dia">${icon('right')}</button><button class="btn icon ghost" data-act="close-modal" aria-label="Fechar">${icon('x')}</button></div>
    <section class="qe-sec ${QE.focus === 'wo' ? 'focus' : ''}"><div class="row"><h3 style="flex:1">${icon('dumbbell')}Treino</h3>${e.w ? `<button class="btn sm ${S.done[d] ? 'primary' : ''}" data-act="qe-done">${icon('check')}${S.done[d] ? 'Concluído' : 'Marcar como concluído'}</button>` : ''}</div>
      <select class="inp" id="qe-wo" data-input="qe-wo" style="margin-top:8px;width:100%">${woOpts}</select>${woBody}
      <div class="row wrap" style="gap:6px;margin-top:10px"><a class="btn sm ghost" href="#/day/${d}" data-act="close-go" data-h="#/day/${d}">${icon('list')}Abrir dia para registrar séries</a><a class="btn sm ghost" href="#/workouts" data-act="close-go" data-h="#/workouts">${icon('grip')}Trocar no programa</a></div></section>
    <section class="qe-sec ${QE.focus !== 'wo' ? 'focus' : ''}"><div class="row"><h3 style="flex:1">${icon('food')}Refeições</h3><span class="tiny muted">★ favoritos primeiro · alterações preservam suas refeições escolhidas manualmente quando o plano é recalculado</span></div>
      ${MEAL_SLOTS.map(mealRow).join('')}
      <div class="qe-tot"><div><span class="tiny muted">Total do dia</span><b class="num">${fmt(x.totals.k)}</b><span class="small muted"> / ${fmt(x.tg.kcal)} kcal</span></div><div class="small num"><span style="color:var(--prot)"><b>${fmt(x.totals.p)}</b>/${fmt(x.tg.protein)}g P</span> · <span style="color:var(--carb)">${fmt(x.totals.c)}C</span> · <span style="color:var(--fat)">${fmt(x.totals.f)}F</span></div><span class="tiny muted">As porções são ajustadas automaticamente</span></div></section>
    <div class="row" style="justify-content:flex-end;margin-top:12px;gap:6px"><button class="btn" data-act="undo" ${undoStack.length ? '' : 'disabled'}>${icon('undo')}Desfazer</button><button class="btn primary" data-act="close-modal">Concluído</button></div>`);
  const f = QE.focus === 'wo' ? $('#qe-wo') : QE.focus.startsWith('meal:') ? $('#qe-' + QE.focus.slice(5)) : null;
  if (f) setTimeout(() => { f.focus(); f.closest('section, .qe-meal').scrollIntoView({ block: 'nearest' }); }, 30);
}
Object.assign(ACT, {
  qe: el => quickEdit(el.dataset.d, el.dataset.f),
  'qe-day': el => { if (!el.dataset.d) return; QE.date = el.dataset.d; renderQuickEdit(); },
  'qe-done': () => { const d = QE.date; if (S.done[d]) delete S.done[d]; else S.done[d] = true; saveState(); render(); renderQuickEdit(); },
  'close-go': el => { closeModal(); location.hash = el.dataset.h; }
});
document.addEventListener('change', e => {
  const t = e.target; if (!t.dataset || !QE || !$('#modal')) return;
  if (t.dataset.input === 'qe-wo') { const d = QE.date; pushUndo('alteração de treino'); S.plan[d].w = t.value ? { t: t.value, wk: planWeek(d) } : null; QE.focus = 'wo';
    saveState(); render(); renderQuickEdit(); toast(t.value ? `${fmtDate(d)}: ${TEMPLATES[t.value].name}` : `${fmtDate(d)} agora é um dia de descanso`, true); }
  if (t.dataset.input === 'qe-meal') { const d = QE.date, sl = t.dataset.slot; pushUndo('alteração de refeição'); S.plan[d].m[sl] = t.value || null; markMealEdit(d, sl); QE.focus = 'meal:' + sl;
    saveState(); render(); renderQuickEdit(); toast(t.value ? `${SLOT_LABEL[sl]} → ${RECIPE[t.value].name}` : `${SLOT_LABEL[sl]} removido`, true); }
});

/* ---------------- switch exercises on / off ---------------- */
function curPlanWeekStart() { const t = todayISO(), st = S.settings.startDate; return t < st ? st : planWeekStart(planWeek(t)); }
function toggleExercise(id, on) {
  const e = EX[id]; if (!e) return; const g = exGroupOf(e);
  if (!on && !Object.values(EX).some(x => x.id !== id && exGroupOf(x) === g && !exOffNow(x.id))) { toast(`Mantenha pelo menos um exercício de ${g.toLowerCase()} ativado — ative outro antes.`); render(); return; }
  let from = curPlanWeekStart();
  if (!on) {   // already logged this week? then the change starts next week so today's log stays with the exercise
    const logged = Object.keys(S.logs || {}).some(d => d >= from && d <= todayISO() && (S.logs[d][id] || []).some(x => x && (x.w != null || x.r != null)));
    if (logged) from = addDays(from, 7);
  }
  S.exOff = S.exOff || {}; const per = S.exOff[id] = S.exOff[id] || [];
  if (!on) { if (!per.some(([, t]) => !t)) per.push([from, null]); }
  else { const open = per.find(([, t]) => !t); if (open) { if (open[0] >= from) per.splice(per.indexOf(open), 1); else open[1] = from; } if (!per.length) delete S.exOff[id]; }
  saveState(); render();
  toast(on ? `${e.name} voltou à rotação a partir de ${fmtDate(from)}` : `${e.name} foi desativado a partir de ${fmtDate(from)} — as sessões usarão seus outros exercícios de ${g.toLowerCase()}`);
}
document.addEventListener('change', e => { const t = e.target; if (t && t.dataset && t.dataset.input === 'ex-on') toggleExercise(t.dataset.id, t.checked); });
