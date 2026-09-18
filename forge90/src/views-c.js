// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ============================================================
   FORGE 90 — Foods & recipes (editors), food preferences,
   section backgrounds
   ============================================================ */

/* ---------------- section backgrounds (Unsplash License photos) ---------------- */
const SECTION_BG = {
  dashboard: { id: '1517836357463-d25dfeac3438', who: 'Victor Freitas', slug: 'WvDYdXDzkhs', alt: 'Atleta se preparando para levantar uma barra', label: 'Painel' },
  calendar: { id: '1758922769578-68c5ba000d87', who: 'Jorge Alberto Vega Barrera', slug: '1J6oEUhEWU4', alt: 'Corredor em uma pista ao nascer do sol', label: 'Calendário' },
  day: { id: '1764426445439-681ca4a15c1d', who: 'Mina Rad', slug: 'KI13sHKszxg', alt: 'Homem treinando em uma máquina de cabos', label: 'Detalhes do dia' },
  workouts: { id: '1744551154623-4b5336e95c28', who: 'Shan A. Rajpoot', slug: 'yqI0r1AMSsQ', alt: 'Homem musculoso levantando halteres', label: 'Plano de treino' },
  diet: { id: '1760888548654-b75cced14d9d', who: 'Rodrigo Rodrigues', slug: '6dBK-bL8Eyg', alt: 'Salada de frango rica em proteína', label: 'Plano alimentar' },
  foods: { id: '1556911220-dabc1f02913a', who: 'Jason Briscoe', slug: '5IGprlBT5g4', alt: 'Homem cortando vegetais em uma cozinha', label: 'Alimentos e receitas' },
  grocery: { id: '1753354868656-53671f69602a', who: 'Vitaly Gariev', slug: 'eJM7swj-D4g', alt: 'Mulher comprando hortifruti fresco', label: 'Compras e preparo' },
  progress: { id: '1545346315-f4c47e3e1b55', who: 'Jakob Owens', slug: 'qkQwDvRqQY8', alt: 'Homem musculoso flexionando os músculos', label: 'Progresso' },
  settings: { id: '1651786039465-d0580bb22ab7', who: 'Alina Rubo', slug: 'TaxQjdfhGQM', alt: 'Pessoa se alongando em um tapete de yoga', label: 'Configurações' }
};
// Fallbacks shown if a photo can't load (offline): tinted gradients per section
const BG_FALLBACK = {
  dashboard: 'radial-gradient(1200px 700px at 80% 0%, #2d4a1a, transparent 60%), linear-gradient(135deg, #0d1a12, #101826)',
  calendar: 'radial-gradient(1200px 700px at 20% 0%, #5a3a12, transparent 60%), linear-gradient(135deg, #1a120a, #0e1622)',
  day: 'radial-gradient(1200px 700px at 70% 10%, #3a1f5a, transparent 60%), linear-gradient(135deg, #140e1f, #0d1320)',
  workouts: 'radial-gradient(1200px 700px at 70% 10%, #13375e, transparent 60%), linear-gradient(135deg, #0a1422, #0d0f14)',
  diet: 'radial-gradient(1200px 700px at 30% 10%, #1d4d34, transparent 60%), linear-gradient(135deg, #0b1a13, #141410)',
  foods: 'radial-gradient(1200px 700px at 70% 0%, #5a2a17, transparent 60%), linear-gradient(135deg, #1a100b, #0f1319)',
  grocery: 'radial-gradient(1200px 700px at 20% 10%, #2f5a1d, transparent 60%), linear-gradient(135deg, #0f1a0b, #121417)',
  progress: 'radial-gradient(1200px 700px at 80% 10%, #5a4a12, transparent 60%), linear-gradient(135deg, #1a160b, #0f1219)',
  settings: 'radial-gradient(1200px 700px at 50% 0%, #2a3a5a, transparent 60%), linear-gradient(135deg, #0f1420, #101216)'
};
const bgPhotoURL = sec => `https://images.unsplash.com/photo-${SECTION_BG[sec].id}?auto=format&fit=crop&w=2200&q=72`;
const bgURL = sec => bgPhotoURL(sec);
let bgCurrent = null, bgFlip = false;
function applyBackground(sec) {
  document.documentElement.style.setProperty('--dim', '0.7');
  const off = !!(S && S.settings && S.settings.bgPhotos === false); document.body.classList.toggle('no-bg', off);
  if (off) { if (bgCurrent === 'off') return; bgCurrent = 'off'; $$('#bg .bg-layer').forEach(l => { l.classList.remove('on'); l.style.backgroundImage = 'none'; }); return; }
  const url = bgURL(sec); const key = sec + '|' + url.slice(0, 80);
  if (bgCurrent === key) return; bgCurrent = key;
  const layers = $$('#bg .bg-layer'); if (layers.length < 2) return;
  bgFlip = !bgFlip; const next = layers[bgFlip ? 1 : 0], prev = layers[bgFlip ? 0 : 1];
  next.style.backgroundImage = BG_FALLBACK[sec];
  next.classList.add('on'); prev.classList.remove('on');
  const img = new Image();
  img.onload = () => { if (bgCurrent === key) next.style.backgroundImage = `url("${url}"), ${BG_FALLBACK[sec]}`; };
  img.src = url;
}
function resizeImageFile(file, maxW = 1920) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => { const im = new Image(); im.onload = () => { const sc = Math.min(1, maxW / im.width); const c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.78)); }; im.onerror = rej; im.src = fr.result; };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}
function backgroundsHTML() {
  return `<div class="field"><label>Visibilidade do fundo</label><input type="range" min="0.1" max="0.75" step="0.05" value="${(1 - S.settings.bgDim).toFixed(2)}" data-input="bg-dim"><span class="tiny muted">Deslize para a direita para mostrar mais da foto atrás dos cartões.</span></div>
    <div class="bg-grid" style="margin-top:12px">${Object.entries(SECTION_BG).map(([k, b]) => `<div class="bg-item"><div class="bg-thumb" style="background-image:url('${esc(bgURL(k))}'), ${BG_FALLBACK[k]}"></div>
      <div style="min-width:0;flex:1"><b class="small">${b.label}</b><div class="tiny muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${S.bgCustom[k] ? 'Sua imagem' : esc(b.alt)}</div>
      <div class="row" style="gap:4px;margin-top:4px"><label class="btn sm">${icon('upload')}Enviar<input type="file" accept="image/*" hidden data-input="bg-file" data-sec="${k}"></label>
      <button class="btn sm" data-act="bg-url" data-sec="${k}">URL</button>${S.bgCustom[k] ? `<button class="btn sm ghost" data-act="bg-reset" data-sec="${k}">Restaurar</button>` : ''}</div></div></div>`).join('')}</div>
    <div class="tiny muted" style="margin-top:12px">Fotos padrão do Unsplash, sob a licença gratuita do serviço: ${Object.values(SECTION_BG).map(b => `<a href="https://unsplash.com/photos/${b.slug}" target="_blank" rel="noopener">${esc(b.who)}</a>`).join(' · ')}. As fotos carregam pela internet; sem conexão, serão exibidos fundos em degradê.</div>`;
}

/* ---------------- food preferences (checkbox tree: group → subgroup → food) ---------------- */
function sw(on, act, k, dis) { return `<button class="switch ${on ? 'on' : ''}" data-act="${act}" data-k="${k}" role="switch" aria-checked="${on}" ${dis ? 'disabled' : ''}><i></i></button>`; }
const fpOpen = k => { const o = UI.fpOpen || {}; return k in o ? o[k] : k.startsWith('cat:'); };
function fpCountText() { const allowed = RECIPES.filter(r => recipeAllowed(r)).length; return `${allowed} de ${RECIPES.length} receitas disponíveis`; }
function foodPrefsHTML() {
  const n = Object.keys(ING).length;
  return `<div class="fp-tools"><span class="pill acc" data-fp-count>${fpCountText()}</span>
      <label class="fp-search">${icon('search')}<input class="inp" type="search" placeholder="Buscar entre ${n} alimentos…" data-input="fpq" value="${esc(UI.fpQ || '')}" aria-label="Buscar alimentos"></label>
      <div class="row" style="gap:4px;margin-left:auto"><button class="btn sm ghost" data-act="fp-all" data-v="1">Expandir tudo</button><button class="btn sm ghost" data-act="fp-all" data-v="0">Recolher tudo</button></div></div>
    <div class="tiny muted" style="margin:8px 0 12px">Desmarque um grupo, subgrupo ou alimento. Receitas que usam itens desmarcados são ocultadas e substituídas nas próximas refeições.</div>
    <div class="fp-tree" data-fp-tree>${fpTreeHTML()}</div>`;
}
function fpTreeHTML() {
  const P = S.foodPrefs || {}; const q = (UI.fpQ || '').trim().toLowerCase();
  const bySub = {}; Object.values(ING).forEach(g => (bySub[g.sub] = bySub[g.sub] || []).push(g));
  const uses = {}; RECIPES.forEach(r => new Set(r.ing.map(([id]) => id)).forEach(id => { uses[id] = (uses[id] || 0) + 1; }));
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : w === 'alimento' ? 's' : 's'}`;
  const html = FOOD_CATS.map(c => {
    const catOn = P['cat:' + c.id] !== false; const catHit = q && c.name.toLowerCase().includes(q);
    let partial = false, total = 0, onCount = 0;
    const subs = c.subs.map(([sid, label]) => {
      const foods = (bySub[sid] || []).slice().sort((a, b) => a.n.localeCompare(b.n));
      const subOnP = P[sid] !== false; const offFoods = foods.filter(g => P['f:' + g.id] === false).length;
      total += foods.length; if (catOn && subOnP) onCount += foods.length - offFoods;
      if (!subOnP || offFoods) partial = true;
      const subHit = q && label.toLowerCase().includes(q);
      const shown = q && !catHit && !subHit ? foods.filter(g => g.n.toLowerCase().includes(q)) : foods;
      if (q && !catHit && !subHit && !shown.length) return '';
      const open = q ? shown.length > 0 && (!subHit || shown.length <= 40) : fpOpen(sid);
      const onTxt = subOnP && offFoods ? `${foods.length - offFoods} de ${plural(foods.length, 'alimento')}` : plural(foods.length, 'alimento');
      return `<div class="fp-sub ${subOnP && catOn ? '' : 'off'}">
        <div class="fp-row l1"><button class="fp-caret ${open ? 'open' : ''}" data-act="fp-open" data-k="${sid}" aria-label="Mostrar alimentos" ${foods.length ? '' : 'disabled'}>${icon('right')}</button>
          <label class="fp-lab"><input type="checkbox" data-fp="${sid}" ${subOnP ? 'checked' : ''} ${catOn ? '' : 'disabled'} ${subOnP && offFoods ? 'data-ind="1"' : ''}><span>${esc(label)}</span></label><span class="fp-n">${onTxt}</span></div>
        ${open ? `<div class="fp-foods">${shown.map(g => { const on = P['f:' + g.id] !== false;
          return `<label class="fp-food ${on ? '' : 'off'}"><input type="checkbox" data-fp="f:${g.id}" ${on ? 'checked' : ''} ${catOn && subOnP ? '' : 'disabled'}><span>${esc(g.n)}${g.custom ? ' <em class="fp-tag">personalizado</em>' : ''}${uses[g.id] ? `<small>${plural(uses[g.id], 'receita')}</small>` : ''}</span></label>`; }).join('')}</div>` : ''}
      </div>`;
    }).join('');
    if (q && !subs) return '';
    const open = q ? true : fpOpen('cat:' + c.id);
    const recs = RECIPES.filter(r => r.ing.some(([id]) => ING[id] && SUB_CAT[ING[id].sub] === c.id)).length;
    return `<div class="fp-cat ${catOn ? '' : 'off'}">
      <div class="fp-row l0"><button class="fp-caret ${open ? 'open' : ''}" data-act="fp-open" data-k="cat:${c.id}" aria-label="Mostrar subgrupos">${icon('right')}</button>
        <label class="fp-lab"><input type="checkbox" data-fp="cat:${c.id}" ${catOn ? 'checked' : ''} ${catOn && partial ? 'data-ind="1"' : ''}><span class="fp-ic">${c.icon}</span><b>${esc(c.name)}</b></label>
        <span class="fp-n">${catOn && partial ? `${onCount} de ${total}` : catOn ? total : `0 de ${total}`} alimentos · ${plural(recs, 'receita')}</span></div>
      ${open ? `<div class="fp-children">${subs}</div>` : ''}</div>`;
  }).join('');
  return html || `<div class="muted small" style="padding:10px 4px">Nenhum alimento corresponde a “${esc(q)}”.</div>`;
}
function fpAfter() { $$('input[data-fp][data-ind]').forEach(el => { el.indeterminate = true; }); }
function refreshFoodPrefs() {
  $$('[data-fp-tree]').forEach(el => { el.innerHTML = fpTreeHTML(); });
  $$('[data-fp-count]').forEach(el => { el.textContent = fpCountText(); });
  fpAfter();
}
function setFoodPref(k, on, wasPartial) {
  const P = S.foodPrefs = S.foodPrefs || {}; let label, off = false;
  const foodsOf = sid => Object.values(ING).filter(g => g.sub === sid);
  if (k.startsWith('f:')) { const g = ING[k.slice(2)]; label = g ? g.n : k; if (on) delete P[k]; else { P[k] = false; off = true; } }
  else {
    const isCat = k.startsWith('cat:'); const cat = isCat && FOOD_CATS.find(c => 'cat:' + c.id === k);
    label = isCat ? cat.name : SUB_LABEL[k];
    const clearKids = () => (isCat ? cat.subs.map(([s]) => s) : [k]).forEach(s => { if (isCat) delete P[s]; foodsOf(s).forEach(g => delete P['f:' + g.id]); });
    if (wasPartial) { clearKids(); on = true; }           // partly checked → everything in it on
    else if (on) delete P[k];                            // back on: keeps any finer choices inside it
    else { P[k] = false; off = true; }
  }
  invalidate();
  const n = off ? substitutePlan(maxISO(todayISO(), S.settings.startDate)) : 0;
  saveState(); refreshFoodPrefs();
  toast(`${label} ${on ? 'ativado' : 'desativado'}${n ? ` — ${n} refeição${n === 1 ? '' : 'ões'} futura${n === 1 ? '' : 's'} substituída${n === 1 ? '' : 's'}` : ''}`);
}
document.addEventListener('change', e => { const t = e.target; if (t && t.dataset && t.dataset.fp) setFoodPref(t.dataset.fp, t.checked, t.dataset.ind === '1'); });
document.addEventListener('input', e => { const t = e.target; if (t && t.dataset && t.dataset.input === 'fpq') { UI.fpQ = t.value; $$('[data-fp-tree]').forEach(el => { el.innerHTML = fpTreeHTML(); }); fpAfter(); } });

/* ---------------- favorites, sorting & links (shared by Diet plan and Foods & recipes) ---------------- */
function favBtnHTML(id, cls = '') { const on = isFav(id);
  return `<button type="button" class="fav-btn ${cls} ${on ? 'on' : ''}" data-act="fav" data-rid="${id}" aria-pressed="${on}" title="${on ? 'Favorita — aparece aproximadamente duas vezes mais no plano alimentar. Clique para remover.' : 'Adicionar aos favoritos — aparece com mais frequência no plano alimentar'}">${icon('star')}</button>`; }
function refreshFavButtons() { $$('.fav-btn[data-rid]').forEach(b => { const on = isFav(b.dataset.rid); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); }
function toggleFav(id) {
  const r = RECIPE[id]; if (!r) return;
  const on = !isFav(id); pushUndo(`${on ? 'favoritar' : 'remover dos favoritos'} ${r.name}`);
  S.favRecipes = S.favRecipes || {}; if (on) S.favRecipes[id] = true; else delete S.favRecipes[id];
  const from = nextPlanWeekStart(); replanMeals(from);
  const cnt = Object.keys(S.plan).filter(d => d >= from).reduce((a, d) => a + MEAL_SLOTS.filter(sl => S.plan[d].m && S.plan[d].m[sl] === id).length, 0);
  saveState(); render(); refreshFavButtons();
  const note = !recipeAllowed(r) ? ' — mas está bloqueada pelas suas preferências alimentares, então não será programada' : ` — refeições a partir de ${fmtDate(from)} replanejadas (${cnt} porção${cnt === 1 ? '' : 'ões'} programada${cnt === 1 ? '' : 's'}; suas escolhas manuais foram mantidas)`;
  toast(`${on ? '★ Favoritada' : 'Removida dos favoritos:'} ${r.name}${note}`, true);
}
const REC_SORTS = [['default', 'Favoritos primeiro'], ['name', 'Nome'], ['k', 'Calorias'], ['p', 'Proteína'], ['c', 'Carboidratos'], ['f', 'Gorduras'], ['pp', 'Proteína por 100 kcal']];
function sortRecipes(list) {
  const key = UI.recSort || 'default';
  if (key === 'default') return list.slice().sort((a, b) => isFav(b.id) - isFav(a.id));
  const dir = UI.recDir === 'asc' ? 1 : -1;
  const val = r => { if (key === 'name') return r.name; const m = RPS(r.id); return key === 'pp' ? (m.k ? m.p * 100 / m.k : 0) : m[key]; };
  return list.slice().sort((a, b) => { const x = val(a), y = val(b); return dir * (key === 'name' ? x.localeCompare(y) : x - y) || a.name.localeCompare(b.name); });
}
function recipeSortHTML() {
  const key = UI.recSort || 'default', asc = UI.recDir === 'asc';
  const lbl = key === 'name' ? (asc ? 'A → Z' : 'Z → A') : (asc ? 'Menor → maior' : 'Maior → menor');
  return `<div class="sortbar"><span class="tiny muted">Ordenar</span><select class="inp sm" data-input="rec-sort" aria-label="Ordenar receitas">${REC_SORTS.map(([v, l]) => `<option value="${v}" ${key === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    ${key === 'default' ? '' : `<button type="button" class="btn sm sort-dir" data-act="rec-dir" title="Mudar para ordem ${asc ? 'decrescente' : 'crescente'}" aria-label="Direção da ordenação: ${asc ? 'crescente' : 'decrescente'}">${icon(asc ? 'arrowUp' : 'arrowDown')}${lbl}</button>`}</div>`;
}
const recFilterLabel = c => ({ all: 'Todos', fav: '★ Favoritos', breakfast: 'Café da manhã', lunch: 'Almoço', dinner: 'Jantar', snack: 'Lanche' }[c] || c);
const linkHost = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
function linksBlockHTML(r) {
  const ls = (r.links || []).filter(l => l && l.url);
  return `<h3 style="margin-top:16px">Links da receita</h3>${ls.length ? `<div class="link-list">${ls.map(l => `<a class="link-card" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer"><span class="lk-ic">${icon('link')}</span><span class="lk-t"><b>${esc(l.title || linkHost(l.url))}</b><small>${esc(l.site || linkHost(l.url))}</small></span>${icon('ext')}</a>`).join('')}</div>` : `<div class="tiny muted">Nenhum link ainda — adicione usando Editar na página Alimentos e receitas.</div>`}
    <div class="tiny muted" style="margin-top:6px">Os links abrem a receita original; a versão do FORGE 90 acima é ajustada aos seus macros.</div>`;
}
function linkChipsHTML(r) { const ls = (r.links || []).filter(l => l && l.url); if (!ls.length) return '';
  return `<div class="rec-links">${icon('link')}${ls.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" title="${esc(l.title || '')}">${esc(l.site || linkHost(l.url))}</a>`).join('<span>·</span>')}</div>`; }

/* ---------------- Foods & recipes page ---------------- */
function viewFoods() {
  const tab = UI.foodsTab || 'recipes';
  const head = `<div class="page-head"><div class="t"><h1>Alimentos e receitas</h1><p>Edite os macros de qualquer alimento, adicione seus próprios alimentos e receitas e escolha quais grupos o plano pode usar.</p></div>
    <div class="row wrap">${scanBtnHTML('today')}${AUTH.mode === 'server' ? `<button class="btn" data-act="imp-open">${icon('download')}Importar receita</button>` : ''}<button class="btn primary" data-act="recipe-new">${icon('plus')}Nova receita</button><button class="btn" data-act="food-by-name" data-v="foods">${icon('search')}Encontrar alimento</button><button class="btn" data-act="food-new">${icon('plus')}Adicionar alimento</button></div></div>
    <div class="seg" style="margin-bottom:16px">${[['recipes', 'Receitas'], ['foods', 'Alimentos e macros'], ['prefs', 'Preferências alimentares']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="foods-tab" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (tab === 'prefs') return head + `<div class="card"><div class="card-h"><h2>Preferências alimentares</h2></div>${foodPrefsHTML()}</div>`;
  if (tab === 'foods') return head + foodsTableHTML();
  const f = UI.recFilter || 'all';
  const words = String(UI.recQ || '').toLowerCase().split(/\s+/).filter(Boolean);
  const hay = r => [r.name, r.cat, (r.tags || []).join(' '), r.ing.map(([id]) => ING[id] ? ING[id].n : '').join(' ')].join(' ').toLowerCase();
  const rs = sortRecipes(RECIPES.filter(r => (f === 'all' || (f === 'fav' ? isFav(r.id) : r.cat === f)) && (!words.length || words.every(w => hay(r).includes(w)))));
  const cards = rs.map(r => { const m = RPS(r.id); const ok = recipeAllowed(r); const bl = blockedBy(r); const g = RECIPE_GRAD[r.cat];
    const badges = [r.custom ? '<span class="pill acc">Personalizada</span>' : '', r.edited ? '<span class="pill">Editada</span>' : '', S.recipeOff[r.id] ? '<span class="pill">Desativada</span>' : '', bl.length ? `<span class="pill warn-pill" data-tip="Bloqueada pelas preferências alimentares: ${esc(bl.join(', '))}">Bloqueada · ${esc(bl[0])}${bl.length > 1 ? ' +' + (bl.length - 1) : ''}</span>` : ''].join('');
    return `<div class="card recipe-row clickable ${ok ? '' : 'dim'} ${isFav(r.id) ? 'is-fav' : ''}" data-act="recipe" data-rid="${r.id}" title="Mostrar detalhes da receita"><div class="art sm" style="--g1:${g[0]};--g2:${g[1]}">${esc(r.emoji || '🍽️')}</div>
      <div class="rr-t" style="flex:1;min-width:0"><div class="tiny muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.08em">${recFilterLabel(r.cat)} · rende ${r.yield}</div><b>${esc(r.name)}</b>
        <div class="mac small"><span><b>${fmt(m.k)}</b> kcal</span> <span style="color:var(--prot)">${fmt(m.p)}P</span> <span style="color:var(--carb)">${fmt(m.c)}C</span> <span style="color:var(--fat)">${fmt(m.f)}F</span></div>
        ${linkChipsHTML(r)}<div class="row wrap" style="gap:4px;margin-top:4px">${badges}</div></div>
      <div class="row rr-acts" style="gap:4px;flex-wrap:wrap;justify-content:flex-end">
        ${favBtnHTML(r.id)}<button class="btn sm" data-act="recipe-edit" data-rid="${r.id}">Editar</button><button class="btn sm ghost" data-act="recipe-dup" data-rid="${r.id}">Duplicar</button>
        ${r.custom ? `<button class="btn sm ghost danger" data-act="recipe-del" data-rid="${r.id}">${icon('trash')}</button>` : ''}
        ${r.edited ? `<button class="btn sm ghost" data-act="recipe-reset" data-rid="${r.id}">Restaurar</button>` : ''}
        ${sw(!S.recipeOff[r.id], 'recipe-off', r.id)}</div></div>`; }).join('');
  return head + `<div class="row wrap rec-bar" style="margin-bottom:12px"><div class="rec-search">${icon('search')}<input class="inp" type="search" placeholder="Buscar receitas, ingredientes ou tags…" data-input="recq" value="${esc(UI.recQ || '')}" aria-label="Buscar receitas" autocomplete="off"></div><div class="filters">${['all', 'fav', 'breakfast', 'lunch', 'dinner', 'snack'].map(c => `<button class="${f === c ? 'on' : ''}" data-act="rec-filter" data-v="${c}">${recFilterLabel(c)}</button>`).join('')}</div>${recipeSortHTML()}</div>
    <div class="tiny muted" style="margin:-4px 0 12px">★ Favoritas aparecem aproximadamente duas vezes mais no plano alimentar. Desative uma receita para removê-la do plano. Receitas bloqueadas contêm algum alimento que você desmarcou.</div>
    ${words.length ? `<div class="small muted" style="margin:-4px 0 10px">${rs.length} receita${rs.length === 1 ? '' : 's'} encontrada${rs.length === 1 ? '' : 's'} para “${esc(UI.recQ.trim())}” <button class="btn sm ghost" data-act="recq-clear">${icon('x')}Limpar</button></div>` : ''}
    <div class="grid g2" style="gap:10px">${cards || `<div class="muted small">${f === 'fav' && !words.length ? 'Ainda não há favoritas — toque na ☆ de qualquer receita.' : 'Nenhuma receita corresponde à busca.'}</div>`}</div>`;
}
function foodsTableHTML() {
  const q = (UI.foodQ || '').toLowerCase(); const cf = UI.foodCat || 'all';
  const words = q.split(/\s+/).filter(Boolean); const hay = g => (g.n + ' ' + (g.brand || '') + ' ' + (g.gtin || '')).toLowerCase();
  const foods = Object.values(ING).filter(g => (cf === 'all' || (cf === 'fav' ? isFavFood(g.id) : cf === 'shared' ? g.shared : SUB_CAT[g.sub] === cf)) && words.every(w => hay(g).includes(w)));
  const addOk = inPlan(todayISO());
  const roleName = { P: 'Proteína', C: 'Carboidrato', F: 'Gordura', V: 'Fixo' };
  const rows = FOOD_CATS.map(c => { const fs = foods.filter(g => SUB_CAT[g.sub] === c.id).sort((a, b) => a.n.localeCompare(b.n)); if (!fs.length) return '';
    return `<tr class="grp"><td colspan="9">${c.icon} ${esc(c.name)}</td></tr>` + fs.map(g => { const used = RECIPES.filter(r => r.ing.some(([id]) => id === g.id)).length;
      return `<tr class="${foodAllowed(g.id) ? '' : 'dim'}"><td><b>${esc(g.n)}</b> ${g.custom ? '<span class="pill acc">Personalizada</span>' : ''}${g.shared ? `<span class="pill acc" title="Na lista compartilhada de alimentos${g.byName ? ' — adicionado por ' + esc(g.byName) : ''}">${icon('scan')}Escaneado</span>` : ''}${g.edited ? '<span class="pill">Editada</span>' : ''}<div class="tiny muted">${g.brand ? esc(g.brand) + ' · ' : ''}${esc(SUB_LABEL[g.sub] || g.sub)} · usado em ${used} receita${used === 1 ? '' : 's'}</div></td>
        <td class="muted small">${g.u ? `por ${esc(pt(g.u))} (${g.g || '?'} g)` : g.ml ? 'por 100 ml' : 'por 100 g'}</td><td class="num"><b>${fmt(g.k)}</b></td><td class="num" style="color:var(--prot)">${fmt(g.p, 1)}</td><td class="num" style="color:var(--carb)">${fmt(g.c, 1)}</td><td class="num" style="color:var(--fat)">${fmt(g.f, 1)}</td>
        <td><span class="pill">${roleName[g.r] || g.r}</span></td><td style="text-align:right"><div class="food-acts">${favFoodBtnHTML(g.id)}${addOk ? `<button class="btn sm ghost" data-act="qa-food" data-id="${g.id}" title="Adicionar a hoje">${icon('plus')}Hoje</button>` : ''}<button class="btn sm" data-act="food-edit" data-id="${g.id}">${g.shared && !(AUTH.user && (g.by === AUTH.user.id || isAdmin())) ? 'Ver' : 'Editar'}</button></div></td></tr>`; }).join(''); }).join('');
  return `<div class="card"><div class="row wrap" style="margin-bottom:12px"><input class="inp" type="search" style="max-width:260px" placeholder="Buscar alimentos, marcas ou códigos de barras…" data-input="foodq" value="${esc(UI.foodQ || '')}">
      <select class="inp" style="max-width:220px" data-input="foodcat"><option value="all">Todas as categorias</option><option value="fav" ${cf === 'fav' ? 'selected' : ''}>★ Alimentos favoritos</option>${AUTH.mode === 'server' ? `<option value="shared" ${cf === 'shared' ? 'selected' : ''}>Produtos escaneados</option>` : ''}${FOOD_CATS.map(c => `<option value="${c.id}" ${cf === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      <span class="tiny muted">${foods.length} alimentos · macros por 100 g, salvo indicação. “Ajuste” mostra como as porções variam a cada dia.</span></div>
    <div class="scroll-x"><table class="tbl foods"><thead><tr><th>Alimento</th><th>Base</th><th>kcal</th><th>Proteína</th><th>Carboidratos</th><th>Gorduras</th><th>Ajuste</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="9" class="muted">Nenhum alimento corresponde.</td></tr>'}</tbody></table></div></div>`;
}

/* ---------- food editor ---------- */
function subOptions(sel) { return FOOD_CATS.map(c => `<optgroup label="${esc(c.name)}">${c.subs.map(([id, l]) => `<option value="${id}" ${sel === id ? 'selected' : ''}>${esc(l)}</option>`).join('')}</optgroup>`).join(''); }
// Built-in values for a food (used by "Restaurar padrão" and the "Default:" hints)
function foodDefaults(id) {
  const b = BASE_ING[id]; if (!b) return null; const sub = BASE_SUB[id] || 'sauces';
  return { n: b.n, sub, a: b.a, basis: b.u ? 'u' : b.ml ? 'ml' : 'g', u: b.u || '', g: b.g || '', k: b.k, p: b.p, c: b.c, f: b.f, r: b.r, pk: defaultPack(id, sub, b) };
}
const FE_ROLE = { P: 'Fonte de proteína', C: 'Fonte de carboidratos', F: 'Fonte de gorduras', V: 'Fixo' };
function foodEditor(id) {
  const g = id ? ING[id] : { n: '', sub: 'chicken_white', a: 'Meat & Seafood', r: 'P', k: '', p: '', c: '', f: '' };
  const basis = g.u ? 'u' : g.ml ? 'ml' : 'g';
  const pk = id ? packInfo(id).P : '';
  const def = id && g.base ? foodDefaults(id) : null;
  const hint = k => def ? `<span class="fe-def tiny" data-def="${k}" hidden></span>` : '';
  const unitLbl = basis === 'u' ? (g.u ? pt(g.u) : 'unidade') : basis === 'ml' ? 'ml' : 'g';
  modal(`<div class="row"><h2 style="flex:1">${id ? 'Editar alimento' : 'Adicionar alimento'}</h2><button class="btn icon ghost" data-act="close-modal">${icon('x')}</button></div>
    ${def ? `<div class="note" style="margin:10px 0">${icon('info')}<span>Alimento padrão — as alterações valem em todos os lugares onde ele é usado. <b>Restaurar padrões</b> recupera os valores originais; os campos alterados mostram o valor padrão logo abaixo.</span></div>` : ''}
    <form data-form="food" data-id="${id || ''}" class="grid g2" style="gap:12px;margin-top:12px">
      <div class="field" style="grid-column:1/-1"><label>Nome</label><input class="inp" name="n" value="${esc(g.n)}" required placeholder="ex.: linguiça de frango">${hint('n')}</div>
      <div class="field"><label>Grupo alimentar</label><select class="inp" name="sub">${subOptions(g.sub)}</select>${hint('sub')}</div>
      <div class="field"><label>Corredor da compra</label><select class="inp" name="a">${AISLES.map(a => `<option ${g.a === a ? 'selected' : ''}>${a}</option>`).join('')}</select>${hint('a')}</div>
      <div class="field"><label>Macros referentes a</label><select class="inp" name="basis" data-input="fe-basis"><option value="g" ${basis === 'g' ? 'selected' : ''}>100 g</option><option value="ml" ${basis === 'ml' ? 'selected' : ''}>100 ml</option><option value="u" ${basis === 'u' ? 'selected' : ''}>1 unidade (ovo, barra, fatia…)</option></select>${hint('basis')}</div>
      <div class="field fe-unit ${basis === 'u' ? '' : 'hidden'}"><label>Nome e peso da unidade</label><div class="row" style="gap:6px"><input class="inp" name="u" value="${esc(g.u || '')}" placeholder="barra" style="width:50%"><input class="inp" type="number" step="1" min="1" name="g" value="${esc(g.g || '')}" placeholder="gramas" style="width:50%"></div>${hint('u')}</div>
      <div class="field"><label>Calorias (kcal)</label><div class="row" style="gap:6px"><input class="inp" type="number" step="0.1" min="0" name="k" value="${esc(g.k)}" required><button type="button" class="btn sm" data-act="fe-calc" data-tip="Proteína×4 + Carboidratos×4 + Gorduras×9">Calcular</button></div>${hint('k')}</div>
      <div class="field"><label>Proteína (g)</label><input class="inp" type="number" step="0.1" min="0" name="p" value="${esc(g.p)}" required>${hint('p')}</div>
      <div class="field"><label>Carboidratos (g)</label><input class="inp" type="number" step="0.1" min="0" name="c" value="${esc(g.c)}" required>${hint('c')}</div>
      <div class="field"><label>Gorduras (g)</label><input class="inp" type="number" step="0.1" min="0" name="f" value="${esc(g.f)}" required>${hint('f')}</div>
      <div class="field" style="grid-column:1/-1"><label>Ajuste de porção</label><select class="inp" name="r">${[['P', 'Fonte de proteína — ajustada para atingir sua meta de proteína'], ['C', 'Fonte de carboidratos — ajustada para atingir as calorias'], ['F', 'Fonte de gorduras — ajustada para atingir as calorias'], ['V', 'Fixo — vegetais, molhos e temperos']].map(([v, l]) => `<option value="${v}" ${g.r === v ? 'selected' : ''}>${l}</option>`).join('')}</select><span class="tiny muted" id="fe-suggest"></span>${hint('r')}</div>
      <div class="field" style="grid-column:1/-1"><label>Tamanho típico da embalagem <span class="muted" style="font-weight:500">— usado pelo planejador econômico e pela lista de compras</span></label>
        <div class="row" style="gap:8px"><input class="inp" type="number" step="1" min="1" name="pk" value="${esc(pk)}" placeholder="${id ? '' : 'ex.: 680'}" style="max-width:140px"><span class="small muted" id="fe-pk-unit">${unitLbl} por embalagem</span></div>${hint('pk')}</div>
      <div class="row" style="grid-column:1/-1;justify-content:flex-end;margin-top:6px">
        ${id && g.custom ? `<button type="button" class="btn danger" data-act="food-del" data-id="${id}" style="margin-right:auto">${icon('trash')}Excluir</button>` : ''}
        ${def ? `<button type="button" class="btn" data-act="food-reset" data-id="${id}" id="fe-reset" style="margin-right:auto" title="Restaurar os valores originais deste alimento">${icon('undo')}Restaurar padrões</button>` : ''}
        <button type="button" class="btn" data-act="close-modal">Cancelar</button><button class="btn primary" type="submit">Salvar alimento</button></div></form>`);
  feSuggest(); feDefHints();
}
// Show "Default: …" under every field that differs from the built-in value, and enable Reset only when something differs
function feDefHints() {
  const f = $('#modal form[data-form="food"]'); if (!f) return; const id = f.dataset.id; const d = id && ING[id] && ING[id].base ? foodDefaults(id) : null; if (!d) return;
  const val = n => f.elements[n] ? f.elements[n].value : '';
  const same = (n, dv) => { const v = val(n); return (typeof dv === 'number') ? Math.abs((+v || 0) - dv) < 1e-6 : String(v).trim() === String(dv); };
  const show = { n: d.n, sub: SUB_LABEL[d.sub] || d.sub, a: d.a, basis: { g: '100 g', ml: '100 ml', u: '1 unidade' }[d.basis], u: d.u ? `${d.u}, ${d.g} g` : '', k: fmt(d.k, 1), p: fmt(d.p, 1), c: fmt(d.c, 1), f: fmt(d.f, 1), r: FE_ROLE[d.r], pk: `${fmt(d.pk)} ${d.basis === 'u' ? 'itens' : d.basis === 'ml' ? 'ml' : 'g'}` };
  let dirty = false;
  $$('#modal .fe-def').forEach(el => { const k = el.dataset.def; let diff;
    if (k === 'u') diff = d.basis === 'u' && (!same('u', d.u) || !same('g', d.g)); else if (k === 'basis') diff = !same('basis', d.basis); else diff = !same(k, d[k]);
    if (diff) dirty = true; el.hidden = !diff || !show[k]; el.textContent = `Padrão: ${show[k]}`; });
  const rb = $('#fe-reset'); if (rb) { const on = dirty || !!ING[id].edited; rb.disabled = !on; rb.title = on ? 'Restaurar os valores originais deste alimento' : 'Já usando os valores originais'; }
}
function feSuggest() {
  const f = $('#modal form[data-form="food"]'); if (!f) return;
  const v = n => +f.elements[n].value || 0; const r = suggestRole(v('k'), v('p'), v('c'), v('f'));
  const el = $('#fe-suggest'); if (el) el.textContent = v('k') ? `Sugerido pelos macros: ${{ P: 'Fonte de proteína', C: 'Fonte de carboidratos', F: 'Fonte de gorduras', V: 'Fixo' }[r]}` : '';
}
function saveFood(form) {
  const fd = new FormData(form); const id = form.dataset.id;
  const num = k => Math.max(0, +fd.get(k) || 0);
  const basis = fd.get('basis');
  const rec = { n: String(fd.get('n')).trim(), sub: fd.get('sub'), a: fd.get('a'), r: fd.get('r'), k: num('k'), p: num('p'), c: num('c'), f: num('f'), pk: num('pk') || null };
  if (!rec.n) { toast('Dê um nome ao alimento'); return; }
  if (basis === 'u') { rec.u = String(fd.get('u') || 'item').trim() || 'item'; rec.g = num('g') || 100; rec.ml = false; } else { rec.u = null; rec.g = null; rec.ml = basis === 'ml'; }
  if (id && ING[id] && ING[id].base) {
    const b = BASE_ING[id]; const o = {};
    const dPk = defaultPack(id, rec.sub, rec.u ? { u: rec.u } : { ml: rec.ml }); if (rec.pk == null || Math.abs(rec.pk - dPk) < 1e-6) rec.pk = null;
    Object.keys(rec).forEach(k => { const bv = k === 'sub' ? BASE_SUB[id] : (b[k] == null ? (k === 'ml' ? false : null) : b[k]); if (String(rec[k]) !== String(bv)) o[k] = rec[k]; });
    if (Object.keys(o).length) S.foodOverrides[id] = o; else delete S.foodOverrides[id];
  } else {
    const nid = id || 'cf_' + rec.n.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24) + '_' + Date.now().toString(36).slice(-4);
    S.customFoods[nid] = rec;
  }
  const newId = id || Object.keys(S.customFoods).find(k => S.customFoods[k] === rec);
  rebuildCatalog(); saveState();
  if (UI.returnToRecipe && RE) { UI.returnToRecipe = false; if (!id) RE.ing.push([newId, ING[newId].u ? 1 : 100]); render(); renderRecipeEditor(); toast(`${rec.n} adicionado à receita`); return; }
  closeModal(); render(); toast(`${rec.n} salvo — todas as receitas que o utilizam foram atualizadas`);
}

/* ---------- recipe editor ---------- */
let RE = null;
function recipeEditor(rid, dup) {
  const r = rid ? RECIPE[rid] : null;
  RE = { id: r && !dup ? rid : null, base: !!(r && r.base && !dup), name: r ? (dup ? r.name + ' (cópia)' : r.name) : '', emoji: r ? r.emoji : '🍽️', cat: r ? r.cat : 'dinner', yield: r ? r.yield : 1,
    storage: r ? r.storage : 'fridge', time: r ? r.time : 20, tags: r ? (r.tags || []).join(', ') : '', fixed: !!(r && r.fixed), rotate: r ? r.rotate !== false && (r.custom || dup) : true,
    ing: r ? r.ing.map(([id, a]) => [id, a]) : [['chicken_breast', 200]], steps: r ? (r.steps || []).join('\n') : '',
    links: r ? (r.links || []).map(l => ({ title: l.title || '', url: l.url || '', site: l.site || '' })) : [] };
  renderRecipeEditor();
}
function foodSelect(sel, i, sugg) {
  const bySub = {}; Object.values(ING).forEach(g => (bySub[g.sub] = bySub[g.sub] || []).push(g));
  const sg = (sugg || []).filter(id => ING[id]); const inSg = sg.includes(sel);
  return `<select class="inp" data-re="ing-id" data-i="${i}">${ING[sel] ? '' : `<option value="" selected disabled>Escolha um alimento…</option>`}${sg.length ? `<optgroup label="Melhores correspondências">${sg.map(id => `<option value="${id}" ${sel === id ? 'selected' : ''}>${esc(ING[id].n)}${foodAllowed(id) ? '' : ' (desativado)'}</option>`).join('')}</optgroup>` : ''}${FOOD_CATS.map(c => c.subs.map(([sid, l]) => { const fs = (bySub[sid] || []).sort((a, b) => a.n.localeCompare(b.n));
    return fs.length ? `<optgroup label="${esc(c.icon + ' ' + c.name + ' · ' + l)}">${fs.map(g => `<option value="${g.id}" ${sel === g.id && !inSg ? 'selected' : ''}>${esc(g.n)}${foodAllowed(g.id) ? '' : ' (desativado)'}</option>`).join('')}</optgroup>` : ''; }).join('')).join('')}</select>`;
}
/* food-only emoji dropdown */
function emojiPickerHTML(cur) {
  return `<button type="button" class="inp emo-btn" data-act="emo-toggle" aria-haspopup="true" aria-expanded="false" title="Escolher um emoji"><span class="emo-cur">${esc(cur || '🍽️')}</span>${icon('right')}</button>
    <div class="emo-pop" role="dialog" aria-label="Emoji do alimento"><input class="inp" type="search" placeholder="Buscar emoji de alimento…" data-input="emoq" aria-label="Buscar emoji">
      <div class="emo-groups">${FOOD_EMOJI.map(([g, list]) => `<div class="emo-g"><div class="emo-h">${esc(g)}</div><div class="emo-grid">${list.map(([em, name]) => `<button type="button" class="emo ${em === cur ? 'on' : ''}" data-act="emo-pick" data-e="${em}" data-n="${esc(name)}" title="${esc(name)}">${em}</button>`).join('')}</div></div>`).join('')}
      <div class="emo-none tiny muted">Nenhum emoji de alimento corresponde.</div></div></div>`;
}
function emoClose() { const p = $('#modal .emo-pop.open'); if (p) { p.classList.remove('open'); const b = $('#modal .emo-btn'); if (b) b.setAttribute('aria-expanded', 'false'); } }
/* tags already used by any recipe, most common first */
function usedTags() { const c = {}; RECIPES.forEach(r => (r.tags || []).forEach(t => { t = String(t).trim(); if (!t) return; const k = Object.keys(c).find(x => x.toLowerCase() === t.toLowerCase()) || t; c[k] = (c[k] || 0) + 1; })); return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); }
const reTagList = () => (RE ? RE.tags : '').split(',').map(t => t.trim()).filter(Boolean);
function tagChipsHTML() {
  const cur = reTagList().map(t => t.toLowerCase());
  return usedTags().map(([t, n]) => { const on = cur.includes(t.toLowerCase());
    return `<button type="button" class="tag-chip ${on ? 'on' : ''}" data-act="re-tag" data-t="${esc(t)}" aria-pressed="${on}">${icon(on ? 'check' : 'plus')}${esc(t)}<small>${n}</small></button>`; }).join('') || '<span class="tiny muted">Nenhuma tag ainda.</span>';
}
function reLinksHTML() {
  return RE.links.map((l, i) => `<div class="re-link"><span class="lk-ic">${icon('link')}</span><input class="inp" data-re="link-title" data-i="${i}" value="${esc(l.title)}" placeholder="Título (opcional)"><input class="inp" type="url" data-re="link-url" data-i="${i}" value="${esc(l.url)}" placeholder="https://…" inputmode="url">
    ${/^https?:\/\//i.test(l.url) ? `<a class="btn icon ghost" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" title="Abrir link">${icon('ext')}</a>` : ''}<button type="button" class="btn icon ghost" data-act="re-link-rm" data-i="${i}" title="Remover link">${icon('x')}</button></div>`).join('') || '<div class="tiny muted">Nenhum link ainda.</div>';
}
function cleanLinks(list) {
  let bad = 0; const out = [];
  list.forEach(l => { let u = String(l.url || '').trim(); const t = String(l.title || '').trim(); if (!u) return;
    if (!/^https?:\/\//i.test(u) && /^[\w-]+(\.[\w-]+)+(\/|$)/.test(u)) u = 'https://' + u;
    const host = linkHost(u); if (!/^https?:\/\//i.test(u) || !host) { bad++; return; }
    const prev = (RE.links.find(x => x.url === l.url) || {}).site;
    out.push({ title: t || host, url: u, site: prev && linkHost(u) === linkHost(l.url) ? prev : host }); });
  return { links: out, bad };
}
function refreshTagChips() { const el = $('#re-tag-chips'); if (el) el.innerHTML = tagChipsHTML(); }
const reAmtNote = y => `quantidades para a receita inteira${+y >= 1 ? ` (todas as ${+y} porções)` : ''}`;
function renderRecipeEditor() {
  const e = RE; const im = e.imp; const prevScroll = $('#modal .modal.re-modal') ? $('#modal .modal.re-modal').scrollTop : 0;
  modal(`<div class="row"><h2 style="flex:1">${e.id ? 'Editar receita' : im ? 'Revisar receita importada' : 'Nova receita'}</h2><button class="btn icon ghost" data-act="close-modal">${icon('x')}</button></div>
    ${im ? impBannerHTML() : ''}
    ${e.base ? `<div class="note" style="margin:10px 0">${icon('info')}<span>Editar uma receita original salva a sua versão; você poderá restaurar a original depois.</span></div>` : ''}
    <div class="grid" style="grid-template-columns:86px 1fr;gap:12px;margin-top:12px">
      <div class="field emo-field"><label>Emoji</label>${emojiPickerHTML(e.emoji)}</div>
      <div class="field"><label>Nome</label><input class="inp" data-re="name" value="${esc(e.name)}" placeholder="ex.: Massa com frango e pesto"></div></div>
    <div class="grid g4" style="gap:12px;margin-top:12px">
      <div class="field ${im && !e.cat ? 'imp-need' : ''}"><label>Refeição</label><select class="inp" data-re="cat">${e.cat ? '' : '<option value="" selected disabled>Escolha…</option>'}${['breakfast', 'lunch', 'dinner', 'snack'].map(c => `<option ${e.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="field ${im && (!(+e.yield >= 1) || +e.yield > 12) ? 'imp-need' : ''}"><label>Porções que rende</label><input class="inp" type="number" min="1" max="12" data-re="yield" value="${e.yield}" ${im ? 'placeholder="?"' : ''}></div>
      <div class="field"><label>Armazenamento</label><select class="inp" data-re="storage">${[['fresh', 'Consumir fresco'], ['fridge', 'Geladeira (4 dias)'], ['freezer', 'Pode ser congelado']].map(([v, l]) => `<option value="${v}" ${e.storage === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label>Preparo (min)</label><input class="inp" type="number" min="0" data-re="time" value="${e.time}"></div>
      <div class="field" style="grid-column:1/-1"><label>Tags (separadas por vírgula)</label><input class="inp" data-re="tags" value="${esc(e.tags)}" placeholder="Digite uma nova tag ou escolha na lista abaixo">
        <div class="tag-pick"><span class="tiny muted">Tags já usadas — clique para adicionar ou remover</span><div class="tag-chips" id="re-tag-chips">${tagChipsHTML()}</div></div></div></div>
    <h3 style="margin:16px 0 8px">Ingredientes <span class="tiny muted" style="font-weight:500">— ${reAmtNote(e.yield)}</span></h3>
    <div id="re-ings">${e.ing.map((r, i) => { const [id, a, m] = r; const g = ING[id]; const st = m ? impRowState(r) : null;
      return `<div class="re-item"><div class="re-row ${st ? IMP_ST[st][1] : ''}" data-row="${i}">${foodSelect(id, i, m && m.sugg)}<input class="inp num" type="number" step="0.5" min="0" data-re="ing-amt" data-i="${i}" value="${a}" style="width:90px" ${m ? 'placeholder="?"' : ''}><span class="tiny muted" style="width:54px">${g ? (g.u ? g.u + 's' : g.ml ? 'ml' : 'g') : ''}</span><span class="tiny num re-m" data-i="${i}"></span><button class="btn icon ghost" data-act="re-rm" data-i="${i}" title="Remover este ingrediente">${icon('x')}</button></div>${m ? impSrcHTML(r, i) : ''}</div>`; }).join('') || (im ? '<div class="tiny muted">Nenhum ingrediente ainda.</div>' : '')}</div>
    <div class="row" style="margin-top:6px"><button class="btn sm" data-act="re-add">${icon('plus')}Adicionar ingrediente</button><button class="btn sm ghost" data-act="food-new-inline">${icon('plus')}Novo alimento</button></div>
    <div class="card re-preview" id="re-preview" style="margin-top:12px"></div>
    <div class="field" style="margin-top:12px"><label>Etapas (uma por linha)</label><textarea class="inp" data-re="steps" rows="4" style="height:auto;padding:8px 11px">${esc(e.steps)}</textarea></div>
    <h3 style="margin:16px 0 8px">Links <span class="tiny muted" style="font-weight:500">— receita original, vídeo ou qualquer referência útil</span></h3>
    <div id="re-links">${reLinksHTML()}</div>
    <button class="btn sm" data-act="re-link-add" style="margin-top:6px">${icon('plus')}Adicionar link</button>
    <div class="row wrap" style="margin-top:10px;gap:16px"><label class="small"><input type="checkbox" data-re="fixed" ${e.fixed ? 'checked' : ''}> Porção fixa (não ajustar diariamente)</label>
      <label class="small"><input type="checkbox" data-re="rotate" ${e.rotate ? 'checked' : ''}> Incluir no planejamento automático das próximas semanas</label></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px">${im && im.q ? `<button class="btn" data-act="re-skip" style="margin-right:auto" title="Não importar esta e passar para a próxima">Pular</button>` : ''}<button class="btn" data-act="close-modal">${im && im.q ? 'Parar importação' : 'Cancelar'}</button><button class="btn primary" data-act="re-save">${im ? (im.q && im.q.i < im.q.n ? 'Salvar e avançar' : 'Salvar receita') : 'Salvar receita'}</button></div>`, 're-modal');
  updateRecipePreview();
  if (prevScroll) { const md = $('#modal .modal.re-modal'); if (md) md.scrollTop = prevScroll; }
}
function updateRecipePreview() {
  const e = RE; const el = $('#re-preview'); if (!el) return;
  const tot = zeroM(); e.ing.forEach(([id, a], i) => { if (!ING[id]) return; const m = ingMacros(id, +a || 0); addM(tot, m); const s = $(`.re-m[data-i="${i}"]`); if (s) s.textContent = `${fmt(m.k)} kcal · ${fmt(m.p)}P`; });
  const y = Math.max(1, +e.yield || 1); const ps = { k: tot.k / y, p: tot.p / y, c: tot.c / y, f: tot.f / y };
  const blocked = e.ing.filter(([id]) => !foodAllowed(id)).map(([id]) => ING[id] && ING[id].n).filter(Boolean);
  el.innerHTML = `<div class="row wrap" style="gap:18px"><div><div class="tiny muted">Per serving</div><div style="font-size:22px;font-weight:700" class="num">${fmt(ps.k)} kcal</div></div>
    <div class="num"><span style="color:var(--prot)"><b>${fmt(ps.p)}</b>g protein</span> · <span style="color:var(--carb)"><b>${fmt(ps.c)}</b>g carbs</span> · <span style="color:var(--fat)"><b>${fmt(ps.f)}</b>g fat</span></div>
    <div class="tiny muted">${ps.k ? Math.round(ps.p * 4 / ps.k * 100) : 0}% of calories from protein</div></div>
    ${e.imp && e.imp.nut && e.imp.nut.k ? (() => { const n = e.imp.nut; const off = ps.k && n.k ? Math.abs(ps.k - n.k) / n.k : 0;
      return `<div class="tiny ${off > .25 ? '' : 'muted'}" style="margin-top:6px">The source lists <b>${fmt(n.k)} kcal</b>${n.p ? ` and <b>${fmt(n.p)} g protein</b>` : ''} por porção${off > .25 && e.ing.every(r => ING[r[0]] && +r[1] > 0) ? ` — yours is ${fmt(off * 100)}% ${ps.k > n.k ? 'higher' : 'lower'}, so check the amounts and servings.` : '.'}</div>`; })() : ''}
    ${blocked.length ? `<div class="note warn" style="margin-top:8px">${icon('info')}<span>Uses foods you’ve turned off (${esc(blocked.join(', '))}) — it won’t be scheduled until they’re back on.</span></div>` : ''}`;
}
function saveRecipe() {
  const e = RE; const name = e.name.trim();
  if (!name) { toast('Dê um nome à receita'); const n = $('#modal [data-re="name"]'); if (n) n.focus(); return; }
  if (e.imp && !impValidate()) return;
  const ing = e.ing.filter(([id, a]) => ING[id] && +a > 0).map(([id, a]) => [id, +a]);
  if (!ing.length) { toast('Adicione pelo menos um ingrediente'); return; }
  const cl = cleanLinks(e.links);
  const rec = { links: cl.links, name, emoji: e.emoji || '🍽️', cat: e.cat, yield: Math.max(1, Math.round(+e.yield || 1)), storage: e.storage, time: +e.time || 0,
    tags: (() => { const known = usedTags().map(([t]) => t); const out = []; e.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => { t = known.find(k => k.toLowerCase() === t.toLowerCase()) || t; if (!out.some(o => o.toLowerCase() === t.toLowerCase())) out.push(t); }); return out; })(), fixed: !!e.fixed, rotate: !!e.rotate, ing, steps: e.steps.split('\n').map(s => s.trim()).filter(Boolean) };
  if (e.id && e.base) S.recipeOverrides[e.id] = rec;
  else { const id = e.id || 'cr_' + Date.now().toString(36) + (e.imp ? Math.random().toString(36).slice(2, 5) : ''); S.customRecipes[id] = Object.assign(rec, { id }); }
  if (e.imp) { impRemember(); rebuildCatalog(); saveState(); if (IMPQ) { IMPQ.done++; toast(`${name} importada`); impNext(); return; } closeModal(); render(); toast(`${name} importada — encontre em Alimentos e receitas e na biblioteca do calendário`); return; }
  rebuildCatalog(); saveState(); closeModal(); render(); toast(`${name} salva — encontre na biblioteca do calendário${cl.bad ? ` · skipped ${cl.bad} link${cl.bad > 1 ? 's' : ''} that ${cl.bad > 1 ? 'não são endereços da web' : 'não é um endereço da web'}` : ''}`);
}
function replaceRecipeEverywhere(rid) {
  const r = RECIPE[rid]; let n = 0; const cat = r ? r.cat : null;
  Object.values(S.plan).forEach(e => MEAL_SLOTS.forEach(slot => { if (e.m && e.m[slot] === rid) { e.m[slot] = pickSubstitute(cat || SLOT_CAT[slot], r ? r.yield : 1, n); n++; } }));
  return n;
}
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset && t.dataset.input === 'emoq') {
    const q = t.value.trim().toLowerCase(); let any = 0;
    $$('#modal .emo-g').forEach(g => { let vis = 0; g.querySelectorAll('.emo').forEach(b => { const m = !q || b.dataset.n.includes(q); b.style.display = m ? '' : 'none'; if (m) vis++; }); g.style.display = vis ? '' : 'none'; any += vis; });
    const none = $('#modal .emo-none'); if (none) none.style.display = any ? 'none' : 'block'; return;
  }
  if (t.closest && t.closest('#modal form[data-form="food"]')) { feSuggest(); feDefHints(); }
  if (!t.dataset || !t.dataset.re || !RE) return;
  const k = t.dataset.re, i = +t.dataset.i;
  if (k === 'link-title' || k === 'link-url') { RE.links[i][k === 'link-title' ? 'title' : 'url'] = t.value; return; }
  if (k === 'ing-amt') { RE.ing[i][1] = t.value; const m = RE.ing[i][2]; if (m) { m.userAmt = true; if (m.st === 'amt' && +t.value > 0) m.st = 'ok'; } }
  else if (k === 'fixed' || k === 'rotate') RE[k] = t.checked;
  else if (k !== 'ing-id') RE[k] = t.value;
  if (k === 'tags') refreshTagChips();
  if (k === 'yield') { const h = $('#modal h3 .tiny'); if (h) h.textContent = '— ' + reAmtNote(RE.yield); }
  updateRecipePreview(); if (RE.imp) impRefresh();
});
document.addEventListener('change', e => {
  const t = e.target; if (!t.dataset) return;
  if (t.dataset.re === 'ing-id' && RE) { const i = +t.dataset.i; RE.ing[i][0] = t.value; const g = ING[t.value];
    if (RE.ing[i][2]) impFoodChanged(i); else if (g && g.u && +RE.ing[i][1] > 20) RE.ing[i][1] = 1; renderRecipeEditor(); }
  if (t.dataset.re === 'cat' && RE && RE.imp) { RE.cat = t.value; impRefresh(); }
  if (t.dataset.re === 'fixed' || t.dataset.re === 'rotate') { if (RE) RE[t.dataset.re] = t.checked; }
  if (t.dataset.input === 'fe-basis') { const u = $('#modal .fe-unit'); if (u) u.classList.toggle('hidden', t.value !== 'u'); const pu = $('#fe-pk-unit'); if (pu) pu.textContent = (t.value === 'u' ? 'items' : t.value === 'ml' ? 'ml' : 'g') + ' per package'; }
  if (t.closest && t.closest('#modal form[data-form="food"]')) feDefHints();
});
Object.assign(ACT, {
  'foods-tab': el => { UI.foodsTab = el.dataset.v; saveUI(); render(); },
  'rec-filter': el => { UI.recFilter = el.dataset.v; saveUI(); render(); },
  'fp-open': el => { const k = el.dataset.k; UI.fpOpen = UI.fpOpen || {}; UI.fpOpen[k] = !fpOpen(k); saveUI(); refreshFoodPrefs(); },
  'fp-all': el => { const v = el.dataset.v === '1'; UI.fpOpen = {}; FOOD_CATS.forEach(c => { UI.fpOpen['cat:' + c.id] = v; c.subs.forEach(([s]) => { UI.fpOpen[s] = v; }); }); saveUI(); refreshFoodPrefs(); },
  'recipe-new': () => recipeEditor(null),
  'recipe-edit': el => recipeEditor(el.dataset.rid),
  'recipe-dup': el => recipeEditor(el.dataset.rid, true),
  'recipe-reset': el => confirmBox('Redefinir receita?', `Restaurar a versão original de <b>${esc(RECIPE[el.dataset.rid].name)}</b>?`, 'Redefinir', () => { delete S.recipeOverrides[el.dataset.rid]; rebuildCatalog(); saveState(); render(); toast('Receita redefinida'); }),
  'recipe-del': el => { const r = RECIPE[el.dataset.rid]; confirmBox('Excluir receita?', `Excluir <b>${esc(r.name)}</b>? As porções planejadas serão substituídas por outra receita da mesma categoria.`, 'Excluir', () => { delete S.customRecipes[r.id]; const n = replaceRecipeEverywhere(r.id); rebuildCatalog(); saveState(); render(); toast(`Excluída${n ? ` — ${n} refeição${n === 1 ? '' : 'ões'} planejada${n === 1 ? '' : 's'} substituída${n === 1 ? '' : 's'}` : ''}`); }, true); },
  'recipe-off': el => { const id = el.dataset.k; if (S.recipeOff[id]) delete S.recipeOff[id]; else S.recipeOff[id] = true; invalidate(); const n = S.recipeOff[id] ? substitutePlan(maxISO(todayISO(), S.settings.startDate)) : 0; saveState(); render(); toast(`${RECIPE[id].name} ${S.recipeOff[id] ? 'desativada' : 'ativada'}${n ? ` — swapped ${n} upcoming meal${n === 1 ? '' : 's'}` : ''}`); },
  fav: el => toggleFav(el.dataset.rid),
  'rec-dir': () => { UI.recDir = UI.recDir === 'asc' ? 'desc' : 'asc'; saveUI(); render(); },
  're-link-add': () => { RE.links.push({ title: '', url: '', site: '' }); const w = $('#re-links'); if (w) { w.innerHTML = reLinksHTML(); const ins = w.querySelectorAll('[data-re="link-url"]'); if (ins.length) ins[ins.length - 1].focus(); } },
  're-link-rm': el => { RE.links.splice(+el.dataset.i, 1); const w = $('#re-links'); if (w) w.innerHTML = reLinksHTML(); },
  'emo-toggle': el => { const p = el.parentElement.querySelector('.emo-pop'); const open = !p.classList.contains('open'); p.classList.toggle('open', open); el.setAttribute('aria-expanded', String(open)); if (open) { const q = p.querySelector('input'); q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); q.focus(); const on = p.querySelector('.emo.on'); if (on) on.scrollIntoView({ block: 'nearest' }); } },
  'emo-pick': el => { if (!RE) return; RE.emoji = el.dataset.e; const c = $('#modal .emo-cur'); if (c) c.textContent = RE.emoji; $$('#modal .emo').forEach(b => b.classList.toggle('on', b === el)); emoClose(); },
  're-tag': el => { const t = el.dataset.t; const list = reTagList(); const i = list.findIndex(x => x.toLowerCase() === t.toLowerCase()); if (i >= 0) list.splice(i, 1); else list.push(t);
    RE.tags = list.join(', '); const inp = $('#modal [data-re="tags"]'); if (inp) inp.value = RE.tags; refreshTagChips(); },
  're-add': () => { RE.ing.push(['chicken_breast', 100]); renderRecipeEditor(); },
  're-rm': el => { RE.ing.splice(+el.dataset.i, 1); renderRecipeEditor(); },
  're-save': () => saveRecipe(),
  'food-new': () => foodEditor(null),
  'food-new-inline': () => { const keep = RE; foodEditor(null); RE = keep; UI.returnToRecipe = true; },
  'food-edit': el => foodEditor(el.dataset.id),
  'fe-calc': () => { const f = $('#modal form[data-form="food"]'); const v = n => +f.elements[n].value || 0; f.elements.k.value = Math.round(v('p') * 4 + v('c') * 4 + v('f') * 9); feSuggest(); },
  'food-reset': el => { const id = el.dataset.id; if (!BASE_ING[id]) return; const keep = UI.returnToRecipe, re = RE;
    delete S.foodOverrides[id]; rebuildCatalog(); saveState(); render(); foodEditor(id); UI.returnToRecipe = keep; RE = re;
    toast(`${ING[id].n} restaurado aos valores padrão — todas as receitas que o utilizam foram atualizadas`); },
  'food-del': el => { const id = el.dataset.id; const used = RECIPES.filter(r => r.ing.some(([x]) => x === id));
    confirmBox('Excluir alimento?', used.length ? `Ele é usado em ${used.length} receita${used.length > 1 ? 's' : ''} (${esc(used.map(r => r.name).join(', '))}); será removido delas.` : 'Esta ação não pode ser desfeita.', 'Excluir', () => {
      delete S.customFoods[id]; Object.values(S.customRecipes).forEach(r => r.ing = r.ing.filter(([x]) => x !== id)); Object.values(S.recipeOverrides).forEach(r => r.ing = r.ing.filter(([x]) => x !== id));
      rebuildCatalog(); saveState(); render(); toast('Alimento excluído'); }, true); },
  'bg-reset': el => { delete S.bgCustom[el.dataset.sec]; bgCurrent = null; saveState(); render(); },
  'bg-url': el => { const sec = el.dataset.sec; modal(`<h2>Fundo de ${esc(SECTION_BG[sec].label)}</h2><p class="sub small">Cole um link direto para uma imagem .jpg, .png ou .webp, ou um endereço images.unsplash.com.</p><input class="inp" id="bg-url-in" style="width:100%" placeholder="https://…"><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-act="close-modal">Cancelar</button><button class="btn primary" id="bg-url-ok">Usar imagem</button></div>`, 'sm');
    $('#bg-url-ok').onclick = () => { const v = $('#bg-url-in').value.trim(); if (!/^https?:\/\//.test(v)) { toast('Informe um link http(s) completo'); return; } S.bgCustom[sec] = v; bgCurrent = null; saveState(); closeModal(); render(); toast('Fundo atualizado'); }; }
});
document.addEventListener('submit', e => { if (e.target.dataset && e.target.dataset.form === 'food') { e.preventDefault(); saveFood(e.target); } });

document.addEventListener('mousedown', e => { if ($('#modal .emo-pop.open') && !e.target.closest('.emo-field')) emoClose(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal .emo-pop.open')) { e.stopImmediatePropagation(); emoClose(); } }, true);
document.addEventListener('change', e => { const t = e.target; if (t && t.dataset && t.dataset.input === 'rec-sort') { UI.recSort = t.value; UI.recDir = t.value === 'name' ? 'asc' : 'desc'; saveUI(); render(); } });
