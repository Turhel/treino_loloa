// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
/* ============================================================
   FORGE 90 — accounts: sign-in screens, server sync, account settings, admin console
   When the page is served by server.js the app requires an account; opened as a plain
   file it runs in single-user "local mode" exactly as before.
   ============================================================ */
const AUTH = { mode: 'local', user: null, config: null, rev: 0, syncT: null, pending: false, inflight: false, sync: 'ok', lastPw: null, savedAt: null };
async function api(method, url, body) {
  let r;
  try { r = await fetch(url, { method, credentials: 'same-origin', headers: body !== undefined || method !== 'GET' ? { 'Content-Type': 'application/json', 'X-F90': '1' } : {}, body: body !== undefined ? JSON.stringify(body) : (method !== 'GET' ? '{}' : undefined) }); }
  catch (e) { const x = new Error('Não foi possível acessar o servidor FORGE 90. Verifique sua conexão.'); x.status = 0; throw x; }
  let j = null; try { j = await r.json(); } catch (e) { /* not JSON */ }
  if (!r.ok) { const x = new Error((j && j.error) || `A solicitação falhou (${r.status})`); x.status = r.status; x.data = j; throw x; }
  return j;
}
const isAdmin = () => AUTH.mode === 'server' && AUTH.user && AUTH.user.role === 'admin';
function navItems() { const n = NAV.slice(); if (isAdmin()) n.push(['admin', 'Admin', 'shield']); return n; }
const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
// profile picture, or initials when there isn't one (the picture sits over the initials, which show if it fails to load)
function avatarHTML(u, cls = '') { const n = esc(initials(u && u.name)); return `<span class="avatar ${cls}" aria-hidden="true">${n}${u && u.avatarUrl ? `<img src="${esc(u.avatarUrl)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>`; }
function userChipHTML() {
  if (AUTH.mode !== 'server' || !AUTH.user) return '';
  const u = AUTH.user; const sy = { ok: 'Salvo', saving: 'Salvando…', offline: 'Offline — tentando novamente', conflict: 'Atualizado' }[AUTH.sync] || '';
  return `<div class="user-chip"><a class="uc-main" href="#/account" title="Configurações da conta">${avatarHTML(u)}<span class="uc-t"><b>${esc(u.name)}</b><small>${u.role === 'admin' ? 'Administrador' : esc(u.email)}</small></span></a>
    <button class="btn icon ghost uc-out" data-act="logout" title="Sair" aria-label="Sair">${icon('logout')}</button><span class="sync-dot ${AUTH.sync}" title="${sy}" aria-label="${sy}"></span></div>`;
}
function setSync(st) { AUTH.sync = st; const d = $('.sync-dot'); if (d) { d.className = 'sync-dot ' + st; const t = { ok: 'Salvo', saving: 'Salvando…', offline: 'Offline — tentando novamente', conflict: 'Atualizado' }[st]; d.title = t; d.setAttribute('aria-label', t); } }

/* ---------- saving to the server ---------- */
function onStateSaved() { if (AUTH.mode !== 'server' || !AUTH.user || AUTH.booting) return; if (typeof syncOnSave === 'function') syncOnSave(); AUTH.pending = true; setSync('saving'); clearTimeout(AUTH.syncT); AUTH.syncT = setTimeout(pushState, 700); }
async function pushState() {
  if (!AUTH.user || !S) return;
  if (AUTH.inflight) { clearTimeout(AUTH.syncT); AUTH.syncT = setTimeout(pushState, 400); return; }
  AUTH.inflight = true; AUTH.pending = false;
  try { const r = await api('PUT', '/api/state', { baseRev: AUTH.rev, state: S }); AUTH.rev = r.rev; AUTH.savedAt = r.updatedAt; if (!AUTH.pending) setSync('ok'); }
  catch (e) {
    if (e.status === 409 && e.data) { AUTH.rev = e.data.rev; AUTH.booting = true; loadState(e.data.state); AUTH.booting = false; applyTheme(); render(); setSync('ok'); toast('Seu plano foi alterado em outro dispositivo — exibindo a versão mais recente.'); }
    else if (e.status === 401) { AUTH.user = null; showAuth('login', { info: 'Sua sessão terminou. Entre novamente — suas alterações mais recentes ficam salvas neste dispositivo até lá.' }); }
    else { AUTH.pending = true; setSync('offline'); clearTimeout(AUTH.syncT); AUTH.syncT = setTimeout(pushState, 5000); }
  } finally { AUTH.inflight = false; }
}
window.addEventListener('beforeunload', e => { if (AUTH.mode === 'server' && (AUTH.pending || AUTH.inflight)) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- start-up ---------- */
async function boot() {
  const qs = new URLSearchParams(location.search);
  if (/^https?:$/.test(location.protocol)) {
    try { const s = await api('GET', '/api/session'); AUTH.mode = 'server'; AUTH.user = s.user; AUTH.config = s.config; NEW_STATE_DEFAULTS = s.config.defaults || null; }
    catch (e) { if (e.status === 0) { AUTH.mode = 'server'; return showAuth('down'); } AUTH.mode = 'local'; }
  }
  if (AUTH.mode === 'local') { loadState(); applyTheme(); if (!S.onboarded) return showOnboarding(() => { shell(); render(); afterStart(); }); shell(); render(); afterStart(); return; }
  if (qs.get('token') && location.pathname.replace(/\/+$/, '') === '/reset') return showAuth('reset', { token: qs.get('token') });
  if (qs.get('token') && location.pathname.replace(/\/+$/, '') === '/invite') return showAuth('invite', { token: qs.get('token') });
  if (!AUTH.user) return showAuth('login');
  if (AUTH.user.mustChange) return showAuth('first');
  startApp();
}
async function startApp() {
  let st; try { st = await api('GET', '/api/state'); } catch (e) { if (e.status === 401) return showAuth('login'); if (e.data && e.data.mustChange) return showAuth('first'); return showAuth('down'); }
  AUTH.rev = st.rev || 0; AUTH.savedAt = st.updatedAt; STORE_KEY = 'forge90.v1:' + AUTH.user.id;
  let legacy = null; if (!st.state) { try { legacy = localStorage.getItem('forge90.v1'); } catch (e) { /* ignore */ } }
  AUTH.booting = true; loadState(st.state || null); AUTH.booting = false;
  if (!st.state) pushState();                       // first save for a brand-new account
  if (location.pathname !== '/') history.replaceState(null, '', '/' + location.hash);
  applyTheme();
  if (!S.onboarded) {
    showOnboarding(() => enterApp());
    if (legacy && !(UI.legacyAsked || {})[AUTH.user.id]) {
      UI.legacyAsked = Object.assign({}, UI.legacyAsked, { [AUTH.user.id]: true }); saveUI();
      confirmBox('Usar o plano salvo neste navegador?', 'Este navegador tem um plano do FORGE 90 de antes da criação das contas. Copiar esse plano para sua nova conta em vez de começar do zero? (Pesagens, registros, alimentos e receitas personalizados serão incluídos.)', 'Usar este plano', () => { try { loadState(JSON.parse(legacy)); S.onboarded = true; saveState(); OB = null; applyTheme(); enterApp(); toast('Plano copiado para sua conta'); } catch (e) { toast('Não foi possível ler o plano salvo'); } });
    }
    return;
  }
  enterApp();
}
function enterApp() { shell(); render(); setSync('ok'); afterStart(); if (typeof syncStart === 'function') syncStart(); if (typeof loadSharedFoods === 'function') loadSharedFoods().then(() => pantryCatchUp()); }
function afterStart() {
  if (AUTH.mode !== 'server' && typeof pantryCatchUp === 'function') pantryCatchUp();
  if (S._sharingIntro) { delete S._sharingIntro; saveState(); setTimeout(() => toast(`Novidade: as refeições a partir de ${fmtDate(nextPlanWeekStart())} foram replanejadas para compartilhar ingredientes e reduzir a quantidade de embalagens. Esta semana e as refeições escolhidas manualmente não foram alteradas — veja Compras e preparo → Economia.`), 600); }
}
async function logout() {
  if (AUTH.pending || AUTH.inflight) { clearTimeout(AUTH.syncT); await pushState().catch(() => {}); }
  try { await api('POST', '/api/logout'); } catch (e) { /* ignore */ }
  try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
  AUTH.user = null; S = null; undoStack.length = 0; STORE_KEY = 'forge90.v1'; showAuth('login', { info: 'Você saiu da conta.' });
}

/* ---------- sign-in, invite, forgot, reset, first sign-in ---------- */
let AS = { screen: 'login' };
// Sign-in page photo (Unsplash License): a personal trainer coaching a man through a push-up
const AUTH_PHOTO = { url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1800&q=75', page: 'https://unsplash.com/photos/R0y_bEUjiOM', who: 'Jonathan Borba',
  fallback: 'radial-gradient(900px 600px at 30% 20%, #2d4a1a, transparent 60%), linear-gradient(160deg, #141b10, #07090c)' };
function pwMeter(pw) {
  const c = AUTH.config || { pwMinLength: 10, pwRequireMix: true }; pw = pw || '';
  let sc = 0; if (pw.length >= c.pwMinLength) sc++; if (pw.length >= c.pwMinLength + 4) sc++; if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) sc++; if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) sc++;
  if (pw.length < c.pwMinLength) sc = Math.min(sc, 1);
  const lbl = ['Muito curta', 'Fraca', 'OK', 'Boa', 'Forte'][sc];
  const rules = [[pw.length >= c.pwMinLength, `${c.pwMinLength}+ caracteres`]].concat(c.pwRequireMix ? [[/[A-Za-z]/.test(pw) && /[^A-Za-z]/.test(pw), 'letras + um número ou símbolo']] : []);
  return `<div class="pw-meter s${sc}" aria-live="polite"><i></i><i></i><i></i><i></i><span>${pw ? lbl : ''}</span></div><div class="pw-rules">${rules.map(([ok, t]) => `<span class="${ok ? 'ok' : ''}">${icon(ok ? 'check' : 'x')}${t}</span>`).join('')}</div>`;
}
const pwField = (name, label, auto, extra = '') => `<div class="field"><label for="af-${name}">${label}</label><div class="pw-wrap"><input class="inp" id="af-${name}" name="${name}" type="password" autocomplete="${auto}" required ${extra}><button type="button" class="pw-eye" data-act="pw-eye" aria-label="Mostrar senha" tabindex="-1">${icon('eye')}</button></div></div>`;
function showAuth(screen, opts = {}) {
  AS = Object.assign({ screen }, opts); closeModal();
  if (!$('#auth')) {
    document.body.className = 'auth-page'; bgCurrent = null;
    document.body.innerHTML = `<div class="auth-split"><section class="auth-hero" aria-label="Um personal trainer orientando um homem durante uma flexão"><div class="auth-photo" style="background-image:url('${AUTH_PHOTO.url}'), ${AUTH_PHOTO.fallback}"></div>
        <div class="auth-hero-copy"><div class="auth-brand">${LOGO}<b class="wm">FORGE<em>90</em></b></div><p>Seu treino, refeições, compras e progresso — tudo em um só lugar.</p></div>
        <a class="auth-credit" href="${AUTH_PHOTO.page}" target="_blank" rel="noopener noreferrer">Foto · ${AUTH_PHOTO.who} / Unsplash</a></section>
      <main id="auth" class="auth-wrap"></main></div><div id="tip"></div><div id="toast"></div>`;
  }
  document.body.dataset.sec = 'auth'; applyTheme();
  if (screen === 'reset' || screen === 'invite') AS.checking = true;
  renderAuth(); if (screen === 'reset') checkResetToken(); if (screen === 'invite') checkInvite();
}
function renderAuth() {
  const c = AUTH.config || {}; const s = AS; const msg = s.error ? `<div class="auth-msg err" role="alert">${icon('info')}<span>${esc(s.error)}</span></div>` : s.info ? `<div class="auth-msg" role="status">${icon('info')}<span>${esc(s.info)}</span></div>` : '';
  let body = '';
  if (s.screen === 'login') body = `<h1>Bem-vindo de volta</h1><p class="sub">Entre para acessar seu plano.</p>${msg}
    <form data-form="auth-login" class="auth-form" novalidate>
      <div class="field"><label for="af-email">E-mail</label><input class="inp" id="af-email" name="email" type="email" autocomplete="username" required value="${esc(s.email || '')}"></div>
      ${pwField('password', 'Senha', 'current-password')}
      <div class="row" style="justify-content:space-between;gap:10px"><label class="small chk"><input type="checkbox" name="remember" ${s.remember !== false ? 'checked' : ''}> Manter conectado por ${c.rememberDays || 30} dias</label><a href="#" data-act="auth-go" data-v="forgot" class="small">Esqueceu a senha?</a></div>
      ${s.locked ? `<button type="button" class="btn" data-act="auth-go" data-v="forgot">${icon('mail')}Enviar link de redefinição por e-mail</button>` : ''}
      <button class="btn primary big" type="submit">Entrar</button></form>
    <div class="auth-foot">Primeira vez aqui? As contas do FORGE 90 são criadas por convite — peça ao administrador para enviar um convite.</div>`;
  else if (s.screen === 'invite') body = s.checking ? `<h1>Verificando seu convite…</h1><div class="auth-spin"></div>` : s.expired
    ? `<div class="auth-ic warn">${icon('clock')}</div><h1>Este convite expirou</h1><p class="sub">Os convites funcionam por ${c.inviteDays || 7} dias e apenas uma vez. Peça ao administrador do FORGE 90 para enviar um novo.</p>${msg}<div class="auth-foot"><a href="#" data-act="auth-go" data-v="login">${icon('left')}Voltar para o login</a></div>`
    : `<div class="auth-ic">${icon('mail')}</div><h1>Entrar no FORGE 90</h1><p class="sub"><b>${esc(s.invitedBy || 'Um administrador')}</b> convidou você${s.role === 'admin' ? ' como <b>administrador</b>' : ''}. Escolha uma senha e responda algumas perguntas rápidas para configurar seu plano.</p>${msg}
      <form data-form="auth-invite" class="auth-form" novalidate>
      <div class="field"><label for="af-email">E-mail</label><input class="inp" id="af-email" name="email" type="email" autocomplete="username" value="${esc(s.inviteEmail || '')}" readonly><span class="tiny muted">Você entrará usando este endereço.</span></div>
      ${pwField('password', 'Senha', 'new-password', 'data-meter="1"')}<div id="af-meter">${pwMeter('')}</div>
      ${pwField('confirm', 'Confirmar senha', 'new-password')}
      <label class="small chk"><input type="checkbox" name="remember" checked> Manter conectado por ${c.rememberDays || 30} dias</label>
      <button class="btn primary big" type="submit">Criar minha conta</button></form>
      <div class="auth-foot">O convite expira ${s.expiresAt ? esc(new Date(s.expiresAt).toLocaleString('pt-BR', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) : 'em ' + (c.inviteDays || 7) + ' dias'}. Já tem uma conta? <a href="#" data-act="auth-go" data-v="login">Entrar</a></div>`;
  else if (s.screen === 'forgot') body = `<h1>Redefinir sua senha</h1><p class="sub">Informe o e-mail usado para entrar e enviaremos um link para escolher uma nova senha. O link funciona por ${c.resetMinutes || 30} minutos.</p>${msg}
    <form data-form="auth-forgot" class="auth-form" novalidate><div class="field"><label for="af-email">E-mail</label><input class="inp" id="af-email" name="email" type="email" autocomplete="username" required value="${esc(s.email || '')}"></div>
      <button class="btn primary big" type="submit">${icon('mail')}Enviar link de redefinição</button></form>
    <div class="auth-foot"><a href="#" data-act="auth-go" data-v="login">${icon('left')}Voltar para o login</a></div>`;
  else if (s.screen === 'sent') body = `<div class="auth-ic">${icon('mail')}</div><h1>Verifique seu e-mail</h1><p class="sub">Se existir uma conta para <b>${esc(s.email)}</b>, um link de redefinição está a caminho. Ele expira em <b>${c.resetMinutes || 30} minutos</b> e funciona uma vez.</p>
    <div class="auth-msg">${icon('info')}<span>Nada depois de alguns minutos? Verifique o spam ou peça ao administrador para enviar pelo menu Admin → Usuários.</span></div>
    <div class="auth-foot"><a href="#" data-act="auth-go" data-v="login">${icon('left')}Voltar para o login</a></div>`;
  else if (s.screen === 'reset') body = s.checking ? `<h1>Verificando seu link…</h1><div class="auth-spin"></div>` : s.expired
    ? `<div class="auth-ic warn">${icon('clock')}</div><h1>Este link expirou</h1><p class="sub">Os links de redefinição funcionam por ${c.resetMinutes || 30} minutos e apenas uma vez. Solicite um novo abaixo.</p>${msg}<button class="btn primary big" data-act="auth-go" data-v="forgot" style="width:100%">Enviar novo link</button><div class="auth-foot"><a href="#" data-act="auth-go" data-v="login">Voltar para o login</a></div>`
    : `<h1>Escolha uma nova senha</h1><p class="sub">Para <b>${esc(s.maskedEmail || '')}</b>. <span class="reset-timer" data-exp="${s.expiresAt || 0}"></span></p>${msg}
      <form data-form="auth-reset" class="auth-form" novalidate>${pwField('password', 'Nova senha', 'new-password', 'data-meter="1"')}<div id="af-meter">${pwMeter('')}</div>${pwField('confirm', 'Confirmar nova senha', 'new-password')}
      <button class="btn primary big" type="submit">Salvar senha e entrar</button></form><div class="auth-foot">Os acessos em outros dispositivos serão encerrados — por segurança, todas as outras sessões serão desconectadas.</div>`;
  else if (s.screen === 'first') { const u = AUTH.user || {}; const adminDefault = /@forge90\.local$/.test(u.email || '');
    body = `<div class="auth-ic">${icon('key')}</div><h1>${u.role === 'admin' && adminDefault ? 'Configurar a conta de administrador' : 'Escolha uma nova senha'}</h1><p class="sub">${u.role === 'admin' && adminDefault ? 'Você entrou com a senha padrão de administrador. Escolha uma senha própria e use um e-mail válido para receber mensagens de redefinição de senha.' : 'Um administrador definiu uma senha temporária para você. Escolha uma senha própria para continuar.'}</p>${msg}
    <form data-form="auth-first" class="auth-form" novalidate>
      ${adminDefault ? `<div class="field"><label for="af-email">E-mail</label><input class="inp" id="af-email" name="email" type="email" required value="${esc(u.email || '')}"><span class="tiny muted">Usado para login e redefinição de senha.</span></div>` : ''}
      ${AUTH.lastPw ? '' : pwField('current', 'Senha atual (temporária)', 'current-password')}
      ${pwField('password', 'Nova senha', 'new-password', 'data-meter="1"')}<div id="af-meter">${pwMeter('')}</div>${pwField('confirm', 'Confirmar nova senha', 'new-password')}
      <button class="btn primary big" type="submit">Salvar e continuar</button></form><div class="auth-foot"><a href="#" data-act="logout">Sair</a></div>`; }
  else if (s.screen === 'down') body = `<div class="auth-ic warn">${icon('info')}</div><h1>Não foi possível acessar o servidor</h1><p class="sub">O FORGE 90 não conseguiu se conectar ao servidor. Verifique se ele está em execução e tente novamente.</p><button class="btn primary big" data-act="auth-retry" style="width:100%">Tentar novamente</button>`;
  document.title = appTitle() + ({ login: ' · Entrar', invite: ' · Convite', forgot: ' · Redefinir senha', sent: ' · Verifique seu e-mail', reset: ' · Redefinir senha', first: ' · Configuração' }[s.screen] || '');
  $('#auth').innerHTML = `<div class="auth-card"><div class="auth-brand">${LOGO}<b class="wm">FORGE<em>90</em></b></div>${body}</div>
    ${c.appName && c.appName !== 'FORGE 90' ? `<div class="auth-legal">${esc(c.appName)}</div>` : ''}`;
  const f = $('#auth form input:not([type=checkbox])'); if (f && !s.noFocus) setTimeout(() => { const e = $('#auth input[name="email"]'); (s.screen === 'login' && e && e.value ? $('#auth input[name="password"]') : s.screen === 'invite' ? $('#auth input[name="password"]') : f).focus(); }, 30);
  resetTimer();
}
function resetTimer() {
  clearInterval(resetTimer.t); const el = $('.reset-timer'); if (!el) return;
  if (!+el.dataset.exp) return;
  const tick = () => { const ms = +el.dataset.exp - Date.now(); if (ms <= 0) { clearInterval(resetTimer.t); AS.expired = true; AS.error = null; renderAuth(); return; } const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60; el.textContent = `O link expira em ${m}:${String(s).padStart(2, '0')}.`; };
  tick(); resetTimer.t = setInterval(tick, 1000);
}
async function checkResetToken() {
  AS.checking = true; renderAuth();
  try { const r = await api('GET', '/api/reset/' + encodeURIComponent(AS.token)); Object.assign(AS, { checking: false, expired: false, maskedEmail: r.email, expiresAt: r.expiresAt }); }
  catch (e) { Object.assign(AS, { checking: false, expired: true, error: e.status === 410 ? null : e.message }); }
  renderAuth();
}
async function checkInvite() {
  try { const r = await api('GET', '/api/invite/' + encodeURIComponent(AS.token)); Object.assign(AS, { checking: false, expired: false, inviteEmail: r.email, name: AS.name || r.name, role: r.role, invitedBy: r.invitedBy, expiresAt: r.expiresAt });
    if (r.exists) Object.assign(AS, { error: 'Já existe uma conta com este e-mail. Entre na conta ou use “Esqueceu a senha?”.' }); }
  catch (e) { Object.assign(AS, { checking: false, expired: true, error: e.status === 410 ? null : e.message }); }
  renderAuth();
}
function authBusy(form, on) { const b = form.querySelector('button[type=submit]'); if (b) { b.disabled = on; b.classList.toggle('loading', on); } }
async function authSubmit(form) {
  const fd = Object.fromEntries(new FormData(form)); const kind = form.dataset.form.slice(5);
  const bad = m => { AS.error = m; AS.info = null; AS.noFocus = true; Object.assign(AS, { email: fd.email || AS.email, name: fd.name || AS.name }); renderAuth(); AS.noFocus = false; };
  if ((kind === 'invite' || kind === 'reset' || kind === 'first') && fd.password !== fd.confirm) return bad('As duas senhas não coincidem.');
  if ((kind === 'login' || kind === 'forgot') && !/^\S+@\S+\.\S+$/.test(fd.email || '')) return bad('Informe um endereço de e-mail válido.');
  authBusy(form, true);
  try {
    if (kind === 'login') { const r = await api('POST', '/api/login', { email: fd.email, password: fd.password, remember: !!fd.remember }); AUTH.user = r.user; AUTH.lastPw = r.user.mustChange ? fd.password : null; if (r.user.mustChange) return showAuth('first'); return startApp(); }
    if (kind === 'invite') { const r = await api('POST', '/api/invite/accept', { token: AS.token, password: fd.password, remember: !!fd.remember }); history.replaceState(null, '', '/'); AUTH.user = r.user; return startApp(); }
    if (kind === 'forgot') { await api('POST', '/api/forgot', { email: fd.email }); return showAuth('sent', { email: fd.email }); }
    if (kind === 'reset') { const r = await api('POST', '/api/reset', { token: AS.token, password: fd.password }); history.replaceState(null, '', '/'); if (r.user) { AUTH.user = r.user; toast('Senha salva — você entrou na conta'); return startApp(); } return showAuth('login', { info: 'Senha salva. Entre usando sua nova senha.' }); }
    if (kind === 'first') {
      if (fd.email != null) { const r = await api('PATCH', '/api/account', { email: fd.email }); AUTH.user = r.user; }
      const r = await api('POST', '/api/account/password', { current: AUTH.lastPw || fd.current, next: fd.password }); AUTH.user = r.user; AUTH.lastPw = null; toast('Senha salva'); return startApp();
    }
  } catch (e) {
    authBusy(form, false);
    if (kind === 'login' && e.data && e.data.locked) { AS.locked = true; return bad(e.message); }
    if ((kind === 'reset' || kind === 'invite') && e.status === 410) { AS.expired = true; return bad(null); }
    return bad(e.message);
  }
}
document.addEventListener('submit', e => { const f = e.target; if (f.dataset && /^auth-/.test(f.dataset.form || '')) { e.preventDefault(); authSubmit(f); } });
document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.meter) { const m = t.closest('form').querySelector('#af-meter, .af-meter'); if (m) m.innerHTML = pwMeter(t.value); } });
Object.assign(ACT, {
  'auth-go': el => { const v = el.dataset.v; const em = ($('#auth input[name="email"]') || {}).value; if (location.pathname !== '/') history.replaceState(null, '', '/'); showAuth(v, { email: em || AS.email || AS.inviteEmail }); },
  'auth-retry': () => { location.reload(); },
  'pw-eye': el => { const i = el.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.innerHTML = icon(show ? 'eyeOff' : 'eye'); el.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha'); },
  logout: () => logout()
});

/* ---------- shared helpers ---------- */
function ago(t) { if (!t) return '—'; const s = Math.round((Date.now() - t) / 1000); if (s < 45) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; if (s < 86400 * 30) return Math.round(s / 86400) + ' d ago'; return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
const when = t => t ? new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
function uaLabel(ua) { ua = ua || ''; const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const o = /Windows/.test(ua) ? 'Windows' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''; return b + (o ? ' em ' + o : ''); }
const kb = n => n > 1048576 ? fmt(n / 1048576, 1) + ' MB' : fmt(Math.max(1, n / 1024)) + ' KB';
const EV = { login_ok: 'Login realizado', login_fail: 'Falha ao entrar', locked: 'Conta bloqueada', unlocked: 'Desbloqueado pelo administrador', logout: 'Sessão encerrada', reset_requested: 'Redefinição de senha solicitada', reset_email_sent: 'E-mail de redefinição enviado', reset_email_failed: 'Falha no e-mail de redefinição', reset_done: 'Senha redefinida', password_changed: 'Senha alterada', temp_password_set: 'Senha temporária definida', register: 'Cadastro realizado', user_created: 'Conta criada pelo administrador', user_deleted: 'Conta excluída pelo administrador', account_deleted: 'Excluiu a própria conta', email_changed: 'E-mail alterado', profile_updated: 'Perfil atualizado', session_revoked: 'Desconectou um dispositivo', sessions_revoked: 'Desconectou outros dispositivos', role_changed: 'Função alterada', status_changed: 'Status alterado', settings_changed: 'Configurações alteradas', email_test: 'E-mail de teste', email_failed: 'Falha no e-mail', backup_downloaded: 'Backup baixado', admin_created: 'Administrador padrão criado', invite_sent: 'Convite enviado', invite_resent: 'Convite reenviado', invite_revoked: 'Convite revogado', invite_accepted: 'Entrou por convite', invite_failed: 'Falha ao enviar e-mail de convite', sync_requested: 'Sincronização de refeições solicitada', sync_started: 'Sincronização de refeições iniciada', sync_declined: 'Sincronização de refeições recusada', sync_cancelled: 'Solicitação de sincronização cancelada', sync_ended: 'Sincronização de refeições encerrada', integration_changed: 'Integração alterada', avatar_changed: 'Foto do perfil alterada', product_added: 'Produto adicionado', product_edited: 'Produto editado', product_deleted: 'Produto excluído' };
const EV_BAD = /fail|locked|deleted/;
function downloadJSON(obj, name) { const blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
const serverOnly = title => `<div class="page-head"><div class="t"><h1>${title}</h1></div></div><div class="card"><div class="note">${icon('info')}<span>Accounts need the FORGE 90 server. You opened the app as a file, so it runs in single-user mode with data saved in this browser. Start the server (see README) and open <b>http://localhost:8090</b> to sign in.</span></div></div>`;

/* ---------- account settings (#/account) ---------- */
let ACC = null;
function viewAccount() {
  if (AUTH.mode !== 'server' || !AUTH.user) return serverOnly('Account');
  return `<div class="page-head"><div class="t"><h1>Account</h1><p>Your profile, password, signed-in devices and account data.</p></div>${isAdmin() ? `<a class="btn" href="#/admin">${icon('shield')}Painel administrativo</a>` : ''}</div><div id="acc-root">${ACC ? accountHTML(ACC) : '<div class="card"><div class="auth-spin"></div></div>'}</div>`;
}
async function accountAfter() { try { ACC = await api('GET', '/api/account'); AUTH.user = ACC.user; const r = $('#acc-root'); if (r) { r.innerHTML = accountHTML(ACC); } } catch (e) { toast(e.message); } syncFetch(true); }
function accountHTML(d) {
  const u = d.user; const notify = u.notify || {};
  const sessions = d.sessions.map(s => `<div class="sess-row"><span class="lk-ic">${icon('device')}</span><div style="flex:1;min-width:0"><b>${esc(uaLabel(s.ua))}</b> ${s.current ? '<span class="pill acc">This device</span>' : ''}${s.remember ? '<span class="pill">Kept signed in</span>' : ''}
      <div class="tiny muted">IP ${esc(s.ip || '—')} · active ${ago(s.lastSeen)} · signed in ${when(s.createdAt)}</div></div>
      <button class="btn sm ${s.current ? 'ghost' : ''}" data-act="acc-revoke" data-id="${s.id}" data-self="${s.current ? 1 : 0}">${s.current ? 'Sign out' : 'Sign out device'}</button></div>`).join('');
  const events = d.events.map(e => `<div class="ev-row"><span class="ev-dot ${EV_BAD.test(e.type) ? 'bad' : ''}"></span><div style="flex:1;min-width:0"><b>${esc(EV[e.type] || e.type)}</b>${e.detail ? `<span class="tiny muted"> · ${esc(e.detail)}</span>` : ''}<div class="tiny muted">${when(e.t)}${e.ip ? ' · IP ' + esc(e.ip) : ''}</div></div></div>`).join('') || '<div class="muted small">No activity yet.</div>';
  return `<div class="grid g2">
    <div class="card"><div class="card-h"><h2>${icon('user')}Profile</h2>${u.owner ? '<span class="pill own">Owner</span>' : ''}<span class="pill ${u.role === 'admin' ? 'acc' : ''}">${u.role === 'admin' ? 'Administrador' : 'Member'}</span></div>
      <div class="acc-id"><div class="acc-pic">${avatarHTML(u, 'xl')}<div class="acc-pic-acts"><label class="btn sm">${icon('upload')}${u.avatarUrl ? 'Change photo' : 'Enviar foto'}<input type="file" accept="image/*" data-input="avatar" hidden></label>${u.avatarUrl ? `<button type="button" class="btn sm ghost" data-act="avatar-rm">Remove</button>` : ''}</div></div><div><b>${esc(u.name)}</b>${u.firstName || u.lastName ? `<div class="small">${esc([u.firstName, u.lastName].filter(Boolean).join(' '))}</div>` : ''}<div class="small muted">${esc(u.email)}</div><div class="tiny muted">Member since ${new Date(u.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div></div></div>
      <form data-form="acc-profile" class="grid" style="gap:12px;margin-top:14px">
        <div class="grid g2" style="gap:12px"><div class="field"><label>First name</label><input class="inp" name="firstName" value="${esc(u.firstName || '')}" maxlength="40" autocomplete="given-name"></div><div class="field"><label>Last name</label><input class="inp" name="lastName" value="${esc(u.lastName || '')}" maxlength="40" autocomplete="family-name"></div></div>
        <div class="field"><label>Nickname <span class="muted" style="font-weight:500">— your display name</span></label><input class="inp" name="name" value="${esc(u.name)}" maxlength="40" required><span class="tiny muted">Shown in the app and to anyone you sync meal plans with.</span></div>
        <div class="field"><label>Email (used to sign in and for password resets)</label><input class="inp" name="email" type="email" value="${esc(u.email)}" required data-input="acc-email"></div>
        <div class="field hidden" id="acc-cur"><label>Senha atual — needed to change your email</label><input class="inp" name="currentPassword" type="password" autocomplete="current-password"></div>
        <div><button class="btn primary" type="submit">Save profile</button></div></form></div>
    <div class="card"><div class="card-h"><h2>${icon('lock')}Password</h2><span class="tiny muted">Last changed ${ago(d.pwChangedAt)}</span></div>
      <form data-form="acc-password" class="grid" style="gap:12px">
        ${pwField('current', 'Senha atual', 'current-password')}
        ${pwField('password', 'Nova senha', 'new-password', 'data-meter="1"')}<div class="af-meter">${pwMeter('')}</div>
        ${pwField('confirm', 'Confirmar nova senha', 'new-password')}
        <div class="row wrap"><button class="btn primary" type="submit">Change password</button><span class="tiny muted">Your other devices will be signed out.</span></div></form>
      <hr class="sep"><label class="row small" style="gap:10px;cursor:pointer"><input type="checkbox" data-input="acc-notify" ${notify.passwordChange !== false ? 'checked' : ''}> Email me when my password is changed or reset</label>
      <div class="tiny muted" style="margin-top:6px">Forgot it? Sign out and use “Forgot password” — the reset link is emailed to ${esc(u.email)} and expires after ${(d.config && d.config.resetMinutes) || 30} minutes.</div></div>
  </div><div style="height:16px"></div>
  <div class="card" id="acc-sync">${syncCardHTML()}</div><div style="height:16px"></div>
  <div class="card"><div class="card-h"><h2>${icon('device')}Signed-in devices</h2>${d.sessions.length > 1 ? `<button class="btn sm" data-act="acc-revoke-others">Sign out all other devices</button>` : ''}</div>${sessions || '<div class="muted small">No active sessions.</div>'}</div>
  <div style="height:16px"></div>
  <div class="grid g2">
    <div class="card"><div class="card-h"><h2>${icon('activity')}Recent activity</h2></div><div class="ev-list">${events}</div></div>
    <div class="card"><div class="card-h"><h2>${icon('download')}Your data</h2></div>
      <div class="small sub">Your plan, weigh-ins, strength logs, custom foods and recipes are saved to your account and follow you to any device you sign in on.</div>
      <div class="grid g2" style="gap:10px;margin-top:12px"><div class="ms-stat"><span class="tiny muted">Last saved</span><b style="font-size:16px">${ago(AUTH.savedAt || d.data.updatedAt)}</b></div><div class="ms-stat"><span class="tiny muted">Size</span><b style="font-size:16px">${kb(d.data.bytes)}</b></div></div>
      <div class="row wrap" style="margin-top:12px"><button class="btn" data-act="export">${icon('download')}Export backup</button><label class="btn">${icon('upload')}Import backup<input type="file" accept="application/json" data-input="import" hidden></label><a class="btn ghost" href="#/settings">Plan settings ${icon('right')}</a></div>
      <hr class="sep"><div class="danger-zone"><div><b>Delete account</b><div class="tiny muted">Permanently removes your account and all of its data. This can’t be undone.</div></div><button class="btn danger" data-act="acc-delete">${icon('trash')}Delete account</button></div></div>
  </div>`;
}
async function accSubmit(form) {
  const fd = Object.fromEntries(new FormData(form)); const b = form.querySelector('button[type=submit]'); b.disabled = true;
  try {
    if (form.dataset.form === 'acc-profile') { const r = await api('PATCH', '/api/account', { name: fd.name, firstName: fd.firstName, lastName: fd.lastName, email: fd.email, currentPassword: fd.currentPassword }); AUTH.user = r.user; toast('Perfil salvo'); sideFoot(); }
    else { if (fd.password !== fd.confirm) throw new Error('As duas novas senhas não coincidem.'); const r = await api('POST', '/api/account/password', { current: fd.current, next: fd.password }); AUTH.user = r.user; toast(`Senha alterada${r.signedOut ? ` — ${r.signedOut} other device${r.signedOut === 1 ? '' : 's'} signed out` : ''}`); }
    await accountAfter();
  } catch (e) { toast(e.message); b.disabled = false; }
}
document.addEventListener('submit', e => { const f = e.target; if (f.dataset && /^acc-/.test(f.dataset.form || '')) { e.preventDefault(); accSubmit(f); } });
document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.input === 'acc-email') { const c = $('#acc-cur'); if (c) c.classList.toggle('hidden', t.value.trim().toLowerCase() === (AUTH.user.email || '')); } });
document.addEventListener('change', async e => { const t = e.target; if (t.dataset && t.dataset.input === 'acc-notify') { try { const r = await api('PATCH', '/api/account', { notify: { passwordChange: t.checked } }); AUTH.user = r.user; toast(t.checked ? 'Você receberá um e-mail quando sua senha for alterada' : 'E-mails sobre alteração de senha desativados'); } catch (x) { toast(x.message); t.checked = !t.checked; } } });
Object.assign(ACT, {
  'acc-revoke': async el => { const self = el.dataset.self === '1'; const go = async () => { try { await api('DELETE', '/api/account/sessions/' + el.dataset.id); if (self) { AUTH.user = null; return showAuth('login', { info: 'Você saiu da conta.' }); } toast('Dispositivo desconectado'); accountAfter(); } catch (e) { toast(e.message); } }; if (self) logout(); else go(); },
  'acc-revoke-others': () => confirmBox('Desconectar outros dispositivos?', 'Todos os outros navegadores conectados à sua conta precisarão entrar novamente.', 'Desconectar', async () => { try { const r = await api('POST', '/api/account/sessions/revoke-others'); toast(`${r.revoked} dispositivo${r.revoked === 1 ? '' : 's'} desconectado${r.revoked === 1 ? '' : 's'}`); accountAfter(); } catch (e) { toast(e.message); } }),
  'acc-delete': () => { modal(`<h2>Delete your account?</h2><p class="sub small">This permanently deletes <b>${esc(AUTH.user.email)}</b> with its plan, weigh-ins, logs, custom foods and recipes. Export a backup first if you want to keep anything.</p>
      <form data-form="acc-del" style="margin-top:12px">${pwField('password', 'Sua senha', 'current-password')}<div class="row" style="justify-content:flex-end;margin-top:14px"><button type="button" class="btn" data-act="close-modal">Cancel</button><button class="btn danger" type="submit">${icon('trash')}Delete forever</button></div></form>`, 'sm'); }
});
document.addEventListener('submit', async e => { const f = e.target; if (!f.dataset || f.dataset.form !== 'acc-del') return; e.preventDefault();
  try { await api('DELETE', '/api/account', { password: new FormData(f).get('password') }); try { localStorage.removeItem(STORE_KEY); } catch (x) { /* ignore */ } AUTH.user = null; S = null; showAuth('login', { info: 'Sua conta foi excluída.' }); } catch (x) { toast(x.message); } });

/* ---------- admin console (#/admin) ---------- */
const ADM = { tab: 'overview', users: null, invites: null, settings: null, stats: null, audit: null, q: '', filter: 'all', evType: '', evUser: '' };
const ADM_TABS = [['overview', 'Visão geral', 'grid'], ['users', 'Usuários', 'users'], ['security', 'Segurança', 'lock'], ['app', 'Configurações do aplicativo', 'sliders'], ['email', 'E-mail', 'mail'], ['proxy', 'Servidor e proxy', 'shield'], ['activity', 'Registro de atividades', 'activity'], ['data', 'Dados e backup', 'download']];
function viewAdmin() {
  if (AUTH.mode !== 'server' || !AUTH.user) return serverOnly('Admin');
  if (!isAdmin()) return `<div class="page-head"><div class="t"><h1>Admin</h1></div></div><div class="card"><div class="note warn">${icon('lock')}<span>Only administrators can open the admin console.</span></div></div>`;
  return `<div class="page-head"><div class="t"><h1>Painel administrativo</h1><p>Convide pessoas, gerencie contas e privilégios de administrador, segurança de login e e-mail.</p></div></div>
    <div class="adm-tabs" role="tablist">${ADM_TABS.map(([k, l, i]) => `<button role="tab" aria-selected="${ADM.tab === k}" class="${ADM.tab === k ? 'on' : ''}" data-act="adm-tab" data-v="${k}">${icon(i)}<span>${l}</span></button>`).join('')}</div>
    <div id="adm-root">${admTabHTML()}</div>`;
}
async function adminAfter(force) {
  if (!isAdmin()) return; const t = ADM.tab;
  try {
    const need = { overview: ['stats', 'users', 'settings', 'invites'], users: ['users', 'invites'], security: ['settings'], app: ['settings'], email: ['settings'], proxy: ['proxy', 'settings'], activity: ['audit', 'users'], data: ['stats'] }[t];
    await Promise.all(need.filter(k => force || !ADM[k] || k === 'stats' || k === 'audit' || k === 'invites' || k === 'proxy' || (k === 'users' && t === 'users')).map(async k => {
      if (k === 'users') ADM.users = (await api('GET', '/api/admin/users')).users;
      if (k === 'invites') ADM.invites = (await api('GET', '/api/admin/invites')).invites;
      if (k === 'settings') ADM.settings = await api('GET', '/api/admin/settings');
      if (k === 'stats') ADM.stats = await api('GET', '/api/admin/stats');
      if (k === 'proxy') ADM.proxy = await api('GET', '/api/admin/proxy');
      if (k === 'audit') ADM.audit = (await api('GET', `/api/admin/audit?limit=400${ADM.evType ? '&type=' + ADM.evType : ''}${ADM.evUser ? '&user=' + ADM.evUser : ''}`)).events;
    }));
  } catch (e) { toast(e.message); if (e.status === 403 || e.status === 401) { AUTH.user && (AUTH.user.role = 'user'); return render(); } }
  if (ADM.tab === t) { const r = $('#adm-root'); if (r) r.innerHTML = admTabHTML(); }
}
const spin = '<div class="card"><div class="auth-spin"></div></div>';
const statusPill = u => u.status === 'pending' ? '<span class="pill warn-pill">Aguardando aprovação</span>' : u.status === 'disabled' ? '<span class="pill">Desativado</span>' : u.locked ? `<span class="pill warn-pill" title="Bloqueado até ${when(u.lockedUntil)}">${icon('lock')}Bloqueado</span>` : '<span class="pill acc">Ativo</span>';
function invDue(i) { const ms = i.expiresAt - Date.now(); if (i.expired || ms <= 0) return '<span class="pill warn-pill">Expirado</span>'; const h = Math.round(ms / 3600000); return `<span class="small">em ${h < 24 ? h + ' h' : Math.round(h / 24) + ' dia' + (Math.round(h / 24) === 1 ? '' : 's')}</span>`; }
const invActs = i => `<button class="btn sm" data-act="adm-inv-resend" data-id="${i.id}" title="Enviar um novo link válido por mais ${(ADM.settings && ADM.settings.inviteDays) || 7} dias">${icon('mail')}Reenviar</button><button class="btn sm ghost danger" data-act="adm-inv-revoke" data-id="${i.id}">Revogar</button>`;
function admTabHTML() {
  const t = ADM.tab, st = ADM.settings;
  if (t === 'overview') {
    if (!ADM.stats || !ADM.users || !st) return spin; const s = ADM.stats; const pend = ADM.users.filter(u => u.status === 'pending'); const locked = ADM.users.filter(u => u.locked);
    const tile = (l, v, sub, bad) => `<div class="ms-stat"><span class="tiny muted">${l}</span><b class="num">${v}</b><span class="tiny ${bad ? 'bad' : 'muted'}">${sub}</span></div>`;
    return `${st.email.ready ? '' : `<div class="note warn" style="margin-bottom:14px">${icon('mail')}<span><b>Email isn’t working yet</b> — invites and password-reset emails can’t be sent. Finish setup in <a href="#" data-act="adm-tab" data-v="email">Email</a>.</span></div>`}
      <div class="grid g4" style="gap:10px">${tile('Accounts', s.users, `${s.admins} administrador${s.admins === 1 ? '' : 'es'} · ${s.invites || 0} convite${s.invites === 1 ? '' : 's'} pendente${s.invites === 1 ? '' : 's'}`)}${tile('Signed-in sessions', s.sessions, 'active right now or kept signed in')}${tile('Sign-ins · 24 h', s.logins24, `${s.failed24} tentativa${s.failed24 === 1 ? '' : 's'} com falha`, s.failed24 > 10)}${tile('Reset emails · 24 h', s.emails24, s.emailFail24 ? `${s.emailFail24} falha${s.emailFail24 === 1 ? '' : 's'} no envio` : 'nenhuma falha', s.emailFail24 > 0)}</div>
      <div style="height:16px"></div><div class="grid g2">
      <div class="card"><div class="card-h"><h2>Pending invites</h2><span class="pill">${(ADM.invites || []).length}</span><button class="btn sm ghost" style="margin-left:auto" data-act="adm-new">${icon('plus')}Invite</button></div>${(ADM.invites || []).slice(0, 6).map(i => `<div class="sess-row"><span class="avatar">${esc(initials(i.name || i.email))}</span><div style="flex:1;min-width:0"><b>${esc(i.name || i.email)}</b>${i.role === 'admin' ? ' <span class="pill acc">Admin</span>' : ''}<div class="tiny muted">${i.name ? esc(i.email) + ' · ' : ''}enviado ${ago(i.sentAt)} · ${i.expired ? 'expirado' : 'expira ' + invDue(i).replace(/<[^>]+>/g, '')}</div></div>${invActs(i)}</div>`).join('') || `<div class="muted small">No invites waiting. New accounts are invite-only — use <b>Invite</b> to email someone a link (it lasts ${st.inviteDays || 7} days).</div>`}
        ${pend.length ? `<div class="tiny muted" style="margin-top:10px">${pend.length} cadastro${pend.length === 1 ? '' : 's'} antigo${pend.length === 1 ? '' : 's'} ainda aguardando aprovação — veja Usuários.</div>` : ''}</div>
      <div class="card"><div class="card-h"><h2>Locked accounts</h2><span class="pill">${locked.length}</span></div>${locked.map(u => `<div class="sess-row">${avatarHTML(u)}<div style="flex:1;min-width:0"><b>${esc(u.name)}</b><div class="tiny muted">${esc(u.email)} · até ${when(u.lockedUntil)}</div></div><button class="btn sm" data-act="adm-unlock" data-id="${u.id}">Unlock</button></div>`).join('') || `<div class="muted small">Nenhuma conta bloqueada. As contas são bloqueadas após ${st.security.lockThreshold} tentativas de login com falha por ${st.security.lockMinutes} minutos${st.security.autoResetOnLock ? ', e o proprietário recebe um link de redefinição por e-mail' : ''}.</div>`}</div></div>
      <div style="height:16px"></div><div class="card"><div class="card-h"><h2>Quick settings</h2></div><div class="grid g3" style="gap:10px">
        ${admSwitch('Email a reset link on lockout', 'security.autoResetOnLock', st.security.autoResetOnLock)}${admSwitch('Email people when their password changes', 'security.notifyPasswordChange', st.security.notifyPasswordChange)}</div></div>`;
  }
  if (t === 'users') {
    if (!ADM.users) return spin; const q = ADM.q.toLowerCase();
    const list = ADM.users.filter(u => (!q || (u.name + ' ' + u.email).toLowerCase().includes(q)) && (ADM.filter === 'all' || (ADM.filter === 'admin' && u.role === 'admin') || (ADM.filter === 'locked' && u.locked) || u.status === ADM.filter))
      .sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0) || (b.role === 'admin') - (a.role === 'admin') || a.name.localeCompare(b.name));
    const counts = { all: ADM.users.length, admin: ADM.users.filter(u => u.role === 'admin').length, pending: ADM.users.filter(u => u.status === 'pending').length, locked: ADM.users.filter(u => u.locked).length, disabled: ADM.users.filter(u => u.status === 'disabled').length };
    const rows = list.map(u => { const me = u.id === AUTH.user.id;
      return `<tr><td><div class="row" style="gap:10px;flex-wrap:nowrap">${avatarHTML(u)}<div style="min-width:0"><b>${esc(u.name)}</b>${me ? ' <span class="pill">You</span>' : ''}<div class="tiny muted">${esc(u.email)}</div></div></div></td>
        <td>${u.owner ? `<span class="pill own" title="The person who set this server up">Owner</span>` : `<label class="adm-role" title="${me ? 'You can’t remove your own admin access here' : !(AUTH.user && AUTH.user.owner) ? 'Only the owner can change administrator access' : 'Give or remove administrator privileges'}"><input type="checkbox" data-input="adm-role" data-id="${u.id}" ${u.role === 'admin' ? 'checked' : ''} ${me || u.status !== 'active' || !(AUTH.user && AUTH.user.owner) ? 'disabled' : ''}><i class="switch ${u.role === 'admin' ? 'on' : ''}" aria-hidden="true"><i></i></i><span class="small">${u.role === 'admin' ? 'Admin' : 'Membro'}</span></label>`}</td>
        <td>${statusPill(u)}${u.mustChange ? ' <span class="pill" title="Must choose a new password at next sign-in">Temp password</span>' : ''}</td>
        <td class="small">${u.lastLoginAt ? ago(u.lastLoginAt) : ' <span class="muted">nunca</span>'}</td><td class="small num">${u.sessions}</td><td class="small num">${u.dataBytes ? kb(u.dataBytes) : '—'}</td>
        <td style="text-align:right;white-space:nowrap">${u.status === 'pending' ? `<button class="btn sm primary" data-act="adm-approve" data-id="${u.id}">Approve</button> ` : ''}${u.locked ? `<button class="btn sm" data-act="adm-unlock" data-id="${u.id}">Unlock</button> ` : ''}<button class="btn sm" data-act="adm-user" data-id="${u.id}">Manage</button></td></tr>`; }).join('');
    const invs = ADM.invites || [];
    const invCard = invs.length ? `<div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Pending invites</h2><span class="pill">${invs.length}</span><span class="tiny muted" style="margin-left:auto">Os links duram ${(ADM.settings && ADM.settings.inviteDays) || 7} dias e funcionam uma vez</span></div><div class="scroll-x"><table class="tbl adm-invites"><thead><tr><th>Convidado</th><th>Função</th><th>Enviado</th><th>Expira</th><th></th></tr></thead><tbody>${invs.map(i => `<tr><td><div class="row" style="gap:10px;flex-wrap:nowrap"><span class="avatar">${esc(initials(i.name || i.email))}</span><div style="min-width:0"><b>${esc(i.name || i.email)}</b>${i.name ? `<div class="tiny muted">${esc(i.email)}</div>` : ''}</div></div></td><td><span class="pill ${i.role === 'admin' ? 'acc' : ''}">${i.role === 'admin' ? 'Admin' : 'Membro'}</span></td><td class="small">${ago(i.sentAt)}${i.invitedBy ? `<div class="tiny muted">por ${esc(i.invitedBy)}${i.sends > 1 ? ` · enviado ${i.sends}×` : ''}</div>` : ''}</td><td>${invDue(i)}</td><td style="text-align:right;white-space:nowrap">${invActs(i)}</td></tr>`).join('')}</tbody></table></div></div>` : '';
    return `${invCard}<div class="card"><div class="row wrap" style="margin-bottom:12px"><input class="inp" style="max-width:260px" placeholder="Search name or email…" data-input="adm-q" value="${esc(ADM.q)}" aria-label="Search users">
        <div class="filters">${[['all', 'All'], ['admin', 'Admins']].concat(counts.pending ? [['pending', 'Waiting approval']] : [], [['locked', 'Locked'], ['disabled', 'Disabled']]).map(([k, l]) => `<button class="${ADM.filter === k ? 'on' : ''}" data-act="adm-filter" data-v="${k}">${l} ${counts[k]}</button>`).join('')}</div>
        <button class="btn primary" style="margin-left:auto" data-act="adm-new">${icon('mail')}Convidar usuário</button></div>
      <div class="scroll-x"><table class="tbl adm-users"><thead><tr><th>Usuário</th><th>Função</th><th>Status</th><th>Último acesso</th><th>Dispositivos</th><th>Dados</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="muted">No users match.</td></tr>'}</tbody></table></div></div>`;
  }
  if (!st && (t === 'security' || t === 'app' || t === 'email')) return spin;
  if (t === 'security') { const s = st.security;
    return `<form data-form="adm-security" class="card"><div class="card-h"><h2>Segurança de login</h2></div><div class="grid g2" style="gap:14px">
      ${admNum('Tamanho mínimo da senha', 'pwMinLength', s.pwMinLength, 8, 64, 'caracteres')}${admChk('Exigir letras e um número ou símbolo', 'pwRequireMix', s.pwRequireMix)}
      ${admNum('Falhas de login antes do bloqueio', 'lockThreshold', s.lockThreshold, 3, 20, 'tentativas')}${admNum('Duração do bloqueio', 'lockMinutes', s.lockMinutes, 1, 1440, 'minutos')}
      ${admChk('Quando uma conta for bloqueada, enviar ao proprietário um link de redefinição de senha', 'autoResetOnLock', s.autoResetOnLock)}${admChk('Avisar usuários por e-mail quando a senha for alterada ou redefinida', 'notifyPasswordChange', s.notifyPasswordChange)}
      ${admChk(`<b>Exigir HTTPS</b> — enviar acessos HTTP sem criptografia para o endereço seguro do aplicativo<br><span class="tiny muted">${st.httpsEnvOff ? 'Desativado por <code>REQUIRE_HTTPS=false</code> nas configurações do contêiner.' : st.httpsTarget ? `Acessos como <code>http://&lt;server-ip&gt;:8090</code> vão para <b>${esc(st.httpsTarget)}</b>, e os navegadores são instruídos a sempre usar HTTPS.` : 'Passa a valer quando o endereço do aplicativo começar com https:// (Admin → Configurações do aplicativo).'} Veja <a href="#" data-act="adm-tab" data-v="proxy">Servidor e proxy</a>.</span>`, 'requireHttps', s.requireHttps !== false)}
      ${admNum('Duração da sessão conectada (inativa)', 'sessionHours', s.sessionHours, 1, 168, 'horas')}${admNum('Duração de “Manter conectado”', 'rememberDays', s.rememberDays, 1, 365, 'dias')}
      <div class="field"><label>Links de redefinição de senha expiram após</label><div class="row"><input class="inp" value="${st.resetMinutes}" disabled style="max-width:90px"><span class="small muted">minutos · uso único</span></div></div></div>
      <div class="note" style="margin-top:14px">${icon('info')}<span>As senhas são armazenadas como hashes scrypt com salt; os links de redefinição usam tokens aleatórios de 256 bits armazenados em hash, e toda alteração de senha encerra as outras sessões da conta. Novas regras passam a valer na próxima vez que alguém escolher uma senha.</span></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" type="submit">Salvar configurações de segurança</button></div></form>`; }
  if (t === 'app') {
    return `<form data-form="adm-app" class="card"><div class="card-h"><h2>Configurações do aplicativo</h2></div>
      <div class="note acc" style="margin-bottom:14px">${icon('mail')}<span><b>Novas contas entram apenas por convite.</b> Um administrador convida pessoas em <a href="#" data-act="adm-tab" data-v="users">Usuários → Convidar usuário</a>. Cada link de convite dura ${st.inviteDays || 7} dias e funciona uma única vez; ninguém pode criar uma conta por conta própria.</span></div>
      <div class="grid g2" style="gap:14px">
      <div class="field"><label>Nome do aplicativo (exibido nos e-mails)</label><input class="inp" name="appName" value="${esc(st.appName)}" maxlength="40"></div>
      <div class="field"><label>Tema padrão para novas contas</label><select class="inp" name="theme">${['dark', 'light', 'system'].map(v => `<option ${st.defaults.theme === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field" style="grid-column:1/-1"><label>Endereço do aplicativo <span class="muted" style="font-weight:500">— usado nos links de convite e redefinição de senha</span></label><input class="inp" name="appUrl" value="${esc(st.appUrl)}" placeholder="${esc(st.envAppUrl || location.origin)}"><span class="tiny muted">Defina o endereço usado pelas pessoas para abrir o FORGE 90 (por exemplo http://192.168.1.20:8090 ou https://forge.example.com). Se ficar em branco, os links usam ${esc(st.envAppUrl || 'o endereço de cada solicitação')}.</span></div></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn primary" type="submit">Salvar</button></div></form>`; }
  if (t === 'email') { const e = st.email;
    const warn = (e.warnings || []).length ? `<div class="note warn" style="margin-bottom:14px">${icon('info')}<span><b>Entregabilidade</b><ul style="margin:6px 0 0;padding-left:18px">${e.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul></span></div>` : '';
    return `<div class="grid g-split"><form data-form="adm-email" class="card"><div class="card-h"><h2>E-mail de saída (SMTP)</h2>${e.ready ? '<span class="pill acc">Pronto</span>' : '<span class="pill warn-pill">Não configurado</span>'}</div>${warn}<div class="grid g2" style="gap:14px">
      <div class="field"><label>Servidor SMTP</label><input class="inp" name="host" value="${esc(e.host)}" placeholder="smtp.gmail.com"></div>
      <div class="field"><label>Porta e segurança</label><div class="row" style="gap:6px;flex-wrap:nowrap"><input class="inp" name="port" type="number" value="${e.port}" style="max-width:100px"><select class="inp" name="security">${[['tls', 'SSL/TLS (465)'], ['starttls', 'STARTTLS (587)'], ['none', 'Nenhuma (relay local)']].map(([v, l]) => `<option value="${v}" ${e.security === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
      <div class="field"><label>Usuário</label><input class="inp" name="user" value="${esc(e.user)}" autocomplete="off"></div>
      <div class="field"><label>Senha / senha de app</label><input class="inp" name="pass" type="password" autocomplete="new-password" placeholder="${e.passSet ? '•••••••• salva' + (e.passSource === 'env' ? ' no ambiente' : ' aqui') + ' — digite para substituir' : 'Não definida'}">${e.passSource === 'admin' ? `<label class="tiny chk"><input type="checkbox" name="clearPass" > Remover a senha salva${ENV_HINT()}</label>` : ''}</div>
      <div class="field"><label>Nome do remetente</label><input class="inp" name="fromName" value="${esc(e.fromName)}"></div>
      <div class="field"><label>Endereço do remetente</label><input class="inp" name="fromEmail" type="email" value="${esc(e.fromEmail)}"></div></div>
      <div class="tiny muted" style="margin-top:10px">${Object.values(e.source || {}).includes('admin') || e.passSource === 'admin' ? 'Alguns valores estão definidos aqui e substituem o ambiente do servidor (variáveis do Docker / .env).' : 'Todos os valores vêm do ambiente do servidor (variáveis do Docker / .env). Tudo o que for salvo aqui os substituirá.'}</div>
      <div class="row" style="justify-content:flex-end;margin-top:12px">${Object.values(e.source || {}).includes('admin') || e.passSource === 'admin' ? `<button class="btn ghost" type="button" data-act="adm-email-env">Usar valores do ambiente</button>` : ''}<button class="btn primary" type="submit">Salvar configurações de e-mail</button></div></form>
      <div><div class="card"><div class="card-h"><h2>Enviar um teste</h2></div><div class="row" style="gap:6px;flex-wrap:nowrap"><input class="inp" id="adm-test-to" type="email" value="${esc(AUTH.user.email)}" aria-label="Enviar teste para"><button class="btn" data-act="adm-test-email">${icon('mail')}Send</button></div><div class="tiny muted" style="margin-top:8px" id="adm-test-out">Envia uma mensagem de exemplo usando as configurações salvas.</div></div>
      <div style="height:16px"></div><div class="card"><div class="card-h"><h2>Usando Gmail</h2></div><ol class="small sub" style="padding-left:18px;margin:0">
        <li>O Google não aceita mais a senha normal da conta via SMTP. Ative a <b>Verificação em duas etapas</b> na conta remetente.</li>
        <li>Crie uma <b>senha de app</b> em <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">myaccount.google.com/apppasswords</a> (16 caracteres).</li>
        <li>Cole-a em <b>Senha</b> aqui (ou em <code>SMTP_PASS</code> no <code>.env</code>), mantenha smtp.gmail.com · 465 · SSL/TLS e envie um teste.</li></ol></div></div></div>`; }
  if (t === 'activity') {
    if (!ADM.audit) return spin; const users = ADM.users || [];
    const rows = ADM.audit.map(a => `<tr><td class="small nowrap">${when(a.t)}</td><td><span class="ev-dot ${EV_BAD.test(a.type) ? 'bad' : ''}"></span>${esc(EV[a.type] || a.type)}</td><td class="small">${esc(a.user || '—')}</td><td class="small">${a.actor && a.actor !== a.user ? esc(a.actor) : '<span class="muted">—</span>'}</td><td class="small nowrap">${esc(a.ip || '—')}</td><td class="small muted">${esc(a.detail || '')}</td></tr>`).join('');
    return `<div class="card"><div class="row wrap" style="margin-bottom:12px"><select class="inp" style="max-width:220px" data-input="adm-evtype"><option value="">Todos os eventos</option>${Object.entries(EV).map(([k, l]) => `<option value="${k}" ${ADM.evType === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select class="inp" style="max-width:240px" data-input="adm-evuser"><option value="">Todos os usuários</option>${users.map(u => `<option value="${u.id}" ${ADM.evUser === u.id ? 'selected' : ''}>${esc(u.email)}</option>`).join('')}</select><button class="btn" data-act="adm-refresh">${icon('loop')}Refresh</button><span class="tiny muted" style="margin-left:auto">Mais recentes primeiro · últimos 400 eventos correspondentes</span></div>
      <div class="scroll-x"><table class="tbl"><thead><tr><th>Quando</th><th>Evento</th><th>Conta</th><th>Por</th><th>IP</th><th>Detalhes</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="muted">Nenhum evento.</td></tr>'}</tbody></table></div></div>`;
  }
  if (t === 'proxy') return admProxyHTML();
  if (t === 'data') { if (!ADM.stats) return spin; const s = ADM.stats;
    return `<div class="grid g2"><div class="card"><div class="card-h"><h2>Backup completo</h2></div><div class="small sub">Baixa todas as contas (sem senhas), os dados de plano de cada conta e as configurações do aplicativo (sem a senha do e-mail) em um único arquivo JSON.</div>
      <div class="row" style="margin-top:12px"><button class="btn primary" data-act="adm-backup">${icon('download')}Download backup</button></div>
      <div class="note" style="margin-top:12px">${icon('info')}<span>Para fazer backup de tudo, inclusive senhas, copie a pasta <code>data</code> do servidor enquanto ele estiver parado.</span></div></div>
      <div class="card"><div class="card-h"><h2>Servidor</h2></div><table class="tbl"><tbody><tr><td>Pasta de dados</td><td class="small"><code>${esc(s.dataDir)}</code></td></tr><tr><td>Dados armazenados</td><td class="num">${kb(s.dataBytes)}</td></tr><tr><td>Contas</td><td class="num">${s.users} · ${s.invites || 0} convidados · ${s.disabled} desativados</td></tr><tr><td>FORGE 90</td><td>${esc(s.version || APP_VERSION)}</td></tr><tr><td>Licença</td><td><a href="${SOURCE_URL}/blob/main/LICENSE" target="_blank" rel="noopener">AGPL-3.0</a> · <a href="${SOURCE_URL}" target="_blank" rel="noopener">Código-fonte</a></td></tr><tr><td>Node.js</td><td>${esc(s.node)}</td></tr><tr><td>Ativo há</td><td>${s.uptime > 86400 ? fmt(s.uptime / 86400, 1) + ' dias' : s.uptime > 3600 ? fmt(s.uptime / 3600, 1) + ' h' : Math.round(s.uptime / 60) + ' min'}</td></tr></tbody></table></div></div>`; }
  return '';
}
/* Admin → Server & proxy: what the server sees for this very request, with fixes for common reverse-proxy mistakes */
const urlHost = u => { try { return new URL(u).host.toLowerCase(); } catch (e) { return ''; } };
function trustSuggestion(peer) { const m = /^(\d+)\.(\d+)\.\d+\.\d+$/.exec(peer || ''); if (m && +m[1] === 172 && +m[2] >= 16 && +m[2] <= 31) return `${m[1]}.${m[2]}.0.0/16`; return peer || 'ip-do-seu-proxy'; }
function admProxyHTML() {
  const p = ADM.proxy; if (!p) return spin;
  const via = !!(p.headers.xff || p.headers.proto || p.headers.xRealIp); const reqHost = String(p.headers.host || '').toLowerCase(); const appHost = urlHost(p.appUrl);
  const sug = esc(trustSuggestion(p.peer)); const code = v => `<code>${esc(v)}</code>`; const checks = []; const add = (st, title, text) => checks.push({ st, title, text });
  if (p.https) add('ok', 'Conectado por HTTPS', via ? 'Seu proxy envia <code>X-Forwarded-Proto: https</code> e o FORGE 90 confia nele.' : 'Esta conexão é criptografada.');
  else if (via && !p.trusted) add('bad', 'HTTPS não detectado', `Seu proxy em ${code(p.peer)} envia cabeçalhos encaminhados, mas o FORGE 90 não está configurado para confiar nele. Defina ${code('TRUST_PROXY=' + trustSuggestion(p.peer))} no template do Unraid e reinicie o contêiner.`);
  else if (appHost && reqHost === appHost) add('bad', 'HTTPS não detectado', `Você abriu ${code(reqHost)}, mas a solicitação chegou ao FORGE 90 por HTTP sem criptografia. No Nginx Proxy Manager, adicione um certificado SSL ao host do proxy e ative <b>Force SSL</b>.`);
  else add('warn', 'Plain HTTP', `Você está conectado diretamente a ${code(reqHost)} sem criptografia, então as senhas trafegam pela rede em texto simples. Use seu endereço https://.`);
  if (via && p.trusted) add(p.trustMode === 'all' ? 'warn' : 'ok', 'Endereços IP dos visitantes', `O FORGE 90 identifica você como <b>${esc(p.clientIp)}</b>, por meio do proxy em ${code(p.peer)}.` + (p.trustMode === 'all' ? `<br><code>TRUST_PROXY=true</code> confia em cabeçalhos encaminhados de qualquer origem que consiga alcançar a porta ${p.port}, então alguém na sua rede poderia falsificar o endereço. Restrinja ao seu proxy: ${code('TRUST_PROXY=' + trustSuggestion(p.peer))}.` : ''));
  else if (via) add('bad', 'Endereços IP dos visitantes', `Todos os visitantes aparecem como ${code(p.peer)} (seu proxy), então limites de login e bloqueios afetariam todos ao mesmo tempo e o registro de atividades mostraria o proxy. Defina ${code('TRUST_PROXY=' + trustSuggestion(p.peer))}.`);
  else add('ok', 'Endereços IP dos visitantes', `Conexão direta — o FORGE 90 identifica você como <b>${esc(p.clientIp)}</b>.`);
  if (!p.appUrl) add('warn', 'Endereço do aplicativo', 'Não definido; por isso, links de convite e redefinição usam o endereço de origem de cada solicitação. Defina <code>APP_URL</code> (ou Admin → Configurações do aplicativo) com seu endereço https://.');
  else if (!/^https:/i.test(p.appUrl)) add('warn', 'Endereço do aplicativo', `${code(p.appUrl)} não usa https. Altere para seu endereço https:// para que os links dos e-mails sejam seguros e a opção Exigir HTTPS funcione.`);
  else if (appHost !== reqHost) add('info', 'Endereço do aplicativo', `Os e-mails apontam para <b>${esc(p.appUrl)}</b>; agora você está usando ${code(reqHost)}.`);
  else add('ok', 'Endereço do aplicativo', `Os e-mails de convite e redefinição apontam para <b>${esc(p.appUrl)}</b>${p.appUrlSource === 'admin' ? ' (definido em Configurações do aplicativo)' : ''}.`);
  if (p.https && p.cookieSecure) add('ok', 'Cookie de login seguro', 'O cookie de sessão só é enviado por HTTPS.');
  else if (p.https) add('warn', 'Cookie de login seguro', `<code>COOKIE_SECURE=${esc(p.cookieSetting)}</code> — remova essa configuração ou defina como <code>auto</code>.`);
  else add('info', 'Cookie de login seguro', 'É ativado automaticamente quando você se conecta por HTTPS.');
  const rh = p.requireHttps;
  if (rh.envOff) add('info', 'Exigir HTTPS', 'Desativado por <code>REQUIRE_HTTPS=false</code> nas configurações do contêiner.');
  else if (!rh.setting) add('warn', 'Exigir HTTPS', 'Desativado (Admin → Segurança), então acessos por IP usando HTTP sem criptografia são permitidos.');
  else if (!rh.target) add('info', 'Exigir HTTPS', 'Aguardando um endereço https:// do aplicativo. Quando for definido, acessos HTTP sem criptografia, como <code>http://&lt;server-ip&gt;:8090</code>, serão redirecionados para ele.');
  else add('ok', 'Exigir HTTPS', `Acessos HTTP sem criptografia a qualquer outro endereço são enviados para <b>${esc(rh.target)}</b>${p.hsts ? ', e os navegadores são instruídos a sempre usar HTTPS (HSTS).' : '.'}`);
  if (p.trustBad.length) add('bad', 'TRUST_PROXY', `Ignorados porque não são endereços IP nem intervalos CIDR: ${p.trustBad.map(code).join(', ')}.`);
  const ic = { ok: 'check', warn: 'info', bad: 'x', info: 'info' };
  const bad = checks.filter(c => c.st === 'bad' || c.st === 'warn').length;
  const rows = [['Conectado a partir de', p.peer], ['X-Forwarded-For', p.headers.xff], ['X-Forwarded-Proto', p.headers.proto], ['X-Real-IP', p.headers.xRealIp], ['Host', p.headers.host], ['TRUST_PROXY', p.trustRaw || '(não definido)'], ['Escutando em', `${p.host}:${p.port}`], ['Versão', p.version]];
  const appUrlEx = p.appUrl && /^https:/i.test(p.appUrl) ? p.appUrl : 'https://forge.yourdomain.com';
  return `<div class="grid g-split"><div class="card"><div class="card-h"><h2>Verificações de conexão</h2>${bad ? `<span class="pill warn-pill">${bad} para corrigir</span>` : '<span class="pill acc">Tudo certo</span>'}<button class="btn sm ghost" style="margin-left:auto" data-act="adm-refresh">${icon('loop')}Verificar novamente</button></div>
      <div class="px-checks">${checks.map(c => `<div class="px-row ${c.st}"><span class="px-ic">${icon(ic[c.st])}</span><div><b>${c.title}</b><div class="small sub">${c.text}</div></div></div>`).join('')}</div>
      <div class="tiny muted" style="margin-top:10px">As verificações descrevem a conexão deste navegador. Abra esta página pelo seu endereço https:// para testar o proxy.</div></div>
    <div><div class="card"><div class="card-h"><h2>O que o servidor recebeu</h2></div><table class="tbl"><tbody>${rows.map(([k, v]) => `<tr><td class="small">${k}</td><td class="small">${v ? `<code>${esc(v)}</code>` : '<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>
      <div style="height:16px"></div><div class="card"><div class="card-h"><h2>Configuração do Nginx Proxy Manager</h2></div><ol class="small sub px-steps">
        <li><b>Host do proxy:</b> domínio <code>${esc(urlHost(appUrlEx))}</code>, esquema <code>http</code>, encaminhando para o contêiner do FORGE 90 (nome ou IP) na porta <code>${p.port}</code>. Ative <b>Block Common Exploits</b>.</li>
        <li><b>Aba SSL:</b> escolha seu certificado e ative <b>Force SSL</b>, <b>HTTP/2</b> e <b>HSTS</b>.</li>
        <li><b>Template do Unraid:</b> <code>APP_URL=${esc(appUrlEx)}</code> e <code>TRUST_PROXY=${via ? sug : '&lt;IP ou sub-rede do proxy&gt;'}</code>; depois aplique.</li>
        <li><b>Melhor opção:</b> coloque o FORGE 90 e o Nginx Proxy Manager na mesma rede Docker personalizada e remova o mapeamento de porta do FORGE 90, para que ele só possa ser acessado pelo proxy.</li></ol></div></div></div>`;
}
const ENV_HINT = () => ' (usa o ambiente como alternativa)';
const admNum = (label, name, v, lo, hi, unit) => `<div class="field"><label>${label}</label><div class="row" style="gap:8px;flex-wrap:nowrap"><input class="inp" type="number" name="${name}" value="${v}" min="${lo}" max="${hi}" style="max-width:110px"><span class="small muted">${unit}</span></div></div>`;
const admChk = (label, name, v) => `<label class="adm-chk"><input type="checkbox" name="${name}" ${v ? 'checked' : ''}><span>${label}</span></label>`;
const admSwitch = (label, key, v) => `<label class="adm-chk"><input type="checkbox" data-input="adm-quick" data-k="${key}" ${v ? 'checked' : ''}><span>${label}</span></label>`;
async function admSave(patch, msg) { try { ADM.settings = await api('PATCH', '/api/admin/settings', patch); AUTH.config = Object.assign({}, AUTH.config, { appName: ADM.settings.appName }); document.title = appTitle() + ' · Admin'; toast(msg || 'Configurações salvas'); const r = $('#adm-root'); if (r) r.innerHTML = admTabHTML(); } catch (e) { toast(e.message); } }
async function admUserAction(id, method, path, body, msg) { try { const r = await api(method, `/api/admin/users/${id}${path}`, body); if (msg) toast(typeof msg === 'function' ? msg(r) : msg); ADM.users = (await api('GET', '/api/admin/users')).users; ADM.stats = null; const rt = $('#adm-root'); if (rt) rt.innerHTML = admTabHTML(); if ($('#modal .adm-user-modal')) admUserModal(id); if (ADM.tab === 'overview') adminAfter(); return r; } catch (e) { toast(e.message); return null; } }
function admUserModal(id) {
  const u = (ADM.users || []).find(x => x.id === id); if (!u) return closeModal(); const me = u.id === AUTH.user.id;
  const info = [['Cadastro', when(u.createdAt)], ['Último acesso', u.lastLoginAt ? `${when(u.lastLoginAt)}${u.lastLoginIp ? ' · ' + esc(u.lastLoginIp) : ''}` : 'nunca'], ['Senha alterada', ago(u.pwChangedAt)], ['Dispositivos conectados', u.sessions], ['Dados do plano', u.dataBytes ? `${kb(u.dataBytes)} · salvo ${ago(u.dataUpdatedAt)}` : 'ainda não há dados'], ['Falhas de login', u.failed]];
  const iAmOwner = !!(AUTH.user && AUTH.user.owner);
  const locked = u.owner && !iAmOwner;                       // the owner is off limits to other admins
  const noAdminAct = !iAmOwner && u.role === 'admin';        // only the owner changes another admin's access
  const why = locked ? ' disabled title="Somente o proprietário pode alterar a conta do proprietário"' : '';
  const whyAdm = noAdminAct ? ' disabled title="Somente o proprietário pode alterar o acesso de um administrador"' : '';
  modal(`<div class="adm-user-modal"><div class="row" style="align-items:flex-start">${avatarHTML(u, 'lg')}<div style="flex:1;min-width:0"><h2>${esc(u.name)}${me ? ' <span class="pill">You</span>' : ''}</h2><div class="small muted">${esc(u.email)}</div><div class="row wrap" style="gap:6px;margin-top:6px">${u.owner ? '<span class="pill own">Owner</span>' : ''}<span class="pill ${u.role === 'admin' ? 'acc' : ''}">${u.role === 'admin' ? 'Administrador' : 'Member'}</span>${statusPill(u)}</div></div><button class="btn icon ghost" data-act="close-modal">${icon('x')}</button></div>
    <div class="grid g3 adm-info">${info.map(([k, v]) => `<div><span class="tiny muted">${k}</span><b class="small">${v}</b></div>`).join('')}</div>
    ${locked ? `<div class="note" style="margin-top:12px">${icon('shield')}<span>This is the owner account — the person who set the server up. Only they can change it.</span></div>` : ''}
    <h3>Access</h3><div class="adm-acts">
      ${u.status === 'pending' ? `<button class="btn primary" data-act="adm-approve" data-id="${id}"${why}>${icon('check')}Approve account</button>` : ''}
      ${me || u.owner ? '' : u.role === 'admin' ? `<button class="btn" data-act="adm-setrole" data-id="${id}" data-v="user"${iAmOwner ? '' : ' disabled title="Only the owner can remove administrator access"'}>${icon('shield')}Remove admin privileges</button>` : `<button class="btn" data-act="adm-setrole" data-id="${id}" data-v="admin" ${u.status !== 'active' ? 'disabled title="Activate the account first"' : iAmOwner ? '' : 'disabled title="Only the owner can make someone an administrator"'}>${icon('shield')}Tornar administradoristrator</button>`}
      ${me || locked ? '' : u.status === 'disabled' ? `<button class="btn" data-act="adm-status" data-id="${id}" data-v="active">Enable account</button>` : u.status === 'active' ? `<button class="btn" data-act="adm-status" data-id="${id}" data-v="disabled"${whyAdm}>Disable account</button>` : ''}</div>
    ${u.avatarUrl && !me && !locked ? `<h3>Profile picture</h3><div class="adm-acts"><button class="btn" data-act="adm-avatar-rm" data-id="${id}">${icon('trash')}Remove profile picture</button></div>` : ''}
    <h3>Sign-in help</h3><div class="adm-acts">
      ${u.locked || u.failed ? `<button class="btn" data-act="adm-unlock" data-id="${id}"${why}>${icon('lock')}Unlock${u.locked ? '' : ' / clear failed attempts'}</button>` : ''}
      <button class="btn" data-act="adm-reset" data-id="${id}" ${u.status === 'disabled' ? 'disabled' : ''}${why}>${icon('mail')}Email a password-reset link</button>
      <button class="btn" data-act="adm-temp" data-id="${id}"${why || whyAdm}>${icon('key')}Set a temporary password</button>
      <button class="btn" data-act="adm-signout" data-id="${id}" ${u.sessions ? '' : 'disabled'}${why || whyAdm}>${icon('logout')}Sign out of all devices</button></div>
    <h3>Profile & data</h3><form data-form="adm-profile" data-id="${id}" class="grid g2" style="gap:10px"><div class="field"><label>Name</label><input class="inp" name="name" value="${esc(u.name)}"${locked ? ' disabled' : ''}></div><div class="field"><label>Email</label><input class="inp" name="email" type="email" value="${esc(u.email)}"${locked ? ' disabled' : ''}></div>
      <div class="row wrap" style="grid-column:1/-1"><button class="btn" type="submit"${why}>Save profile</button><button class="btn ghost" type="button" data-act="adm-userdata" data-id="${id}" ${u.dataBytes ? '' : 'disabled'}${why}>${icon('download')}Download their plan data</button>
      ${me || u.owner ? '' : `<button class="btn danger" type="button" data-act="adm-delete" data-id="${id}" style="margin-left:auto"${whyAdm}>${icon('trash')}Delete account</button>`}</div></form></div>`);
}
function admNewUser() {
  const st = ADM.settings; const ready = !st || st.email.ready;
  modal(`<div class="row"><h2 style="flex:1">Invite someone</h2><button class="btn icon ghost" data-act="close-modal">${icon('x')}</button></div>
    <p class="sub small" style="margin:6px 0 0">They’ll get an email with a link to create their account and choose a password. The link lasts <b>${(st && st.inviteDays) || 7} days</b> and works once.</p>
    ${ready ? '' : `<div class="note warn" style="margin-top:12px">${icon('mail')}<span>Email isn’t set up yet, so invites can’t be sent. <a href="#" data-act="adm-tab" data-v="email">Set up email</a> first.</span></div>`}
    <form data-form="adm-new" class="grid g2" style="gap:12px;margin-top:12px"><div class="field" style="grid-column:1/-1"><label>Email</label><input class="inp" name="email" type="email" required autocomplete="off" placeholder="name@example.com"></div>
      <div class="field"><label>Name <span class="muted" style="font-weight:500">— optional</span></label><input class="inp" name="name" maxlength="80" placeholder="A pessoa poderá alterá-la"></div>
      <div class="field"><label>Role</label><select class="inp" name="role"><option value="user">Member</option><option value="admin">Administrator</option></select></div>
      <div class="row" style="grid-column:1/-1;justify-content:flex-end"><button type="button" class="btn" data-act="close-modal">Cancel</button><button class="btn primary" type="submit" ${ready ? '' : 'disabled'}>${icon('mail')}Send invite</button></div></form>`);
  setTimeout(() => { const e = $('#modal input[name="email"]'); if (e) e.focus(); }, 30);
}
async function admInvAction(id, method, path, msg) { try { const r = await api(method, `/api/admin/invites/${id}${path}`); toast(msg); ADM.stats = null; await adminAfter(true); return r; } catch (e) { toast(e.message); return null; } }
Object.assign(ACT, {
  'adm-tab': el => { closeModal(); ADM.tab = el.dataset.v; if (location.hash !== '#/admin') { location.hash = '#/admin'; return; } $$('.adm-tabs button').forEach(b => { const on = b.dataset.v === ADM.tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }); const r = $('#adm-root'); if (r) r.innerHTML = admTabHTML(); adminAfter(); },
  'adm-filter': el => { ADM.filter = el.dataset.v; $('#adm-root').innerHTML = admTabHTML(); },
  'adm-refresh': () => adminAfter(true),
  'adm-new': () => admNewUser(),
  'adm-inv-resend': el => { const i = (ADM.invites || []).find(x => x.id === el.dataset.id); if (!i) return; el.disabled = true; admInvAction(i.id, 'POST', '/resend', `Novo convite enviado para ${i.email} — válido por ${(ADM.settings && ADM.settings.inviteDays) || 7} dias`).then(() => { el.disabled = false; }); },
  'adm-inv-revoke': el => { const i = (ADM.invites || []).find(x => x.id === el.dataset.id); if (!i) return; confirmBox('Revogar este convite?', `O link enviado para <b>${esc(i.email)}</b> deixará de funcionar. Você poderá convidar essa pessoa novamente depois.`, 'Revoke invite', () => admInvAction(i.id, 'DELETE', '', 'Convite revogado'), true); },
  'adm-user': el => admUserModal(el.dataset.id),
  'adm-avatar-rm': el => confirmBox('Remover foto do perfil?', 'A foto será excluída do servidor. A pessoa poderá enviar uma nova quando quiser.', 'Remove', () => admUserAction(el.dataset.id, 'DELETE', '/avatar', undefined, 'Foto do perfil removida'), true),
  'adm-approve': el => admUserAction(el.dataset.id, 'PATCH', '', { status: 'active' }, 'Conta aprovada — a pessoa foi avisada por e-mail'),
  'adm-decline': el => { const u = ADM.users.find(x => x.id === el.dataset.id); confirmBox('Recusar este cadastro?', `Excluir a conta pendente de <b>${esc(u.email)}</b>?`, 'Decline', () => admUserAction(u.id, 'DELETE', '', undefined, 'Sign-up declined'), true); },
  'adm-unlock': el => admUserAction(el.dataset.id, 'POST', '/unlock', undefined, 'Conta desbloqueada'),
  'adm-setrole': el => { const u = ADM.users.find(x => x.id === el.dataset.id); const up = el.dataset.v === 'admin';
    confirmBox(up ? 'Conceder privilégios de administrador?' : 'Remover privilégios de administrador?', up ? `<b>${esc(u.name)}</b> poderá gerenciar todas as contas, alterar configurações de segurança e e-mail e conceder acesso de administrador a outras pessoas.` : `<b>${esc(u.name)}</b> se tornará um membro comum.`, up ? 'Tornar administrador' : 'Remover administrador', () => admUserAction(u.id, 'PATCH', '', { role: el.dataset.v }, up ? `${u.name} agora é administrador` : `${u.name} agora é membro`), !up); },
  'adm-status': el => { const u = ADM.users.find(x => x.id === el.dataset.id); const off = el.dataset.v === 'disabled';
    const go = () => admUserAction(u.id, 'PATCH', '', { status: el.dataset.v }, off ? 'Conta desativada e desconectada' : 'Conta ativada');
    if (off) confirmBox('Desativar esta conta?', `<b>${esc(u.email)}</b> será desconectado e não poderá entrar até que você ative a conta novamente. Os dados serão mantidos.`, 'Desativar', go, true); else go(); },
  'adm-reset': el => { const u = ADM.users.find(x => x.id === el.dataset.id); confirmBox('Enviar link de redefinição por e-mail?', `Enviar para <b>${esc(u.email)}</b> um link de redefinição de senha que expira em ${ADM.settings ? ADM.settings.resetMinutes : 30} minutos?`, 'Enviar e-mail', () => admUserAction(u.id, 'POST', '/send-reset', undefined, 'Reset email sent')); },
  'adm-temp': el => { const u = ADM.users.find(x => x.id === el.dataset.id); const sug = Array.from(crypto.getRandomValues(new Uint8Array(9)), b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('') + '-' + (10 + crypto.getRandomValues(new Uint8Array(1))[0] % 90);
    modal(`<h2>Senha temporária para ${esc(u.name)}</h2><p class="sub small">A pessoa será desconectada de todos os dispositivos e deverá escolher uma nova senha no próximo login. Compartilhe a senha temporária de forma privada.</p><form data-form="adm-temp" data-id="${u.id}" style="margin-top:12px"><div class="field"><label>Senha temporária</label><input class="inp" name="password" value="${sug}" autocomplete="off" required></div><div class="row" style="justify-content:flex-end;margin-top:14px"><button type="button" class="btn" data-act="adm-user" data-id="${u.id}">Voltar</button><button class="btn primary" type="submit">Definir senha</button></div></form>`, 'sm'); },
  'adm-signout': el => admUserAction(el.dataset.id, 'POST', '/revoke-sessions', undefined, r => `${r.revoked} sessão${r.revoked === 1 ? '' : 'ões'} desconectada${r.revoked === 1 ? '' : 's'}`),
  'adm-delete': el => { const u = ADM.users.find(x => x.id === el.dataset.id); confirmBox('Excluir esta conta?', `Excluir permanentemente <b>${esc(u.email)}</b> e todos os dados do plano? Isso não pode ser desfeito.`, 'Excluir conta', async () => { await admUserAction(u.id, 'DELETE', '', undefined, 'Conta excluída'); closeModal(); }, true); },
  'adm-userdata': async el => { const u = ADM.users.find(x => x.id === el.dataset.id); try { const d = await api('GET', `/api/admin/users/${u.id}/state`); downloadJSON(d.state || {}, `forge90-${u.email.replace(/[^a-z0-9]+/gi, '_')}.json`); } catch (e) { toast(e.message); } },
  'adm-backup': async () => { try { downloadJSON(await api('GET', '/api/admin/backup'), `forge90-backup-${todayISO()}.json`); toast('Backup baixado'); } catch (e) { toast(e.message); } },
  'adm-email-env': () => confirmBox('Usar os valores do ambiente?', 'Limpa as configurações de e-mail salvas aqui para que o servidor volte a usar as variáveis do Docker / .env.', 'Usar ambiente', () => admSave({ email: { useEnv: true } }, 'O e-mail agora usa as configurações do ambiente')),
  'adm-test-email': async el => { const to = $('#adm-test-to').value.trim(); const out = $('#adm-test-out'); el.disabled = true; out.textContent = 'Enviando…'; out.className = 'tiny muted';
    try { await api('POST', '/api/admin/email/test', { to }); out.textContent = `✔ Enviado para ${to}. Verifique a caixa de entrada e o spam.`; out.className = 'tiny good'; } catch (e) { out.textContent = '✖ ' + e.message; out.className = 'tiny bad'; } el.disabled = false; }
});
document.addEventListener('submit', async e => {
  const f = e.target; const k = f.dataset && f.dataset.form; if (!k || !/^adm-/.test(k)) return; e.preventDefault();
  const fd = new FormData(f); const g = n => fd.get(n); const on = n => !!f.elements[n] && f.elements[n].checked;
  if (k === 'adm-security') return admSave({ security: { pwMinLength: +g('pwMinLength'), pwRequireMix: on('pwRequireMix'), lockThreshold: +g('lockThreshold'), lockMinutes: +g('lockMinutes'), autoResetOnLock: on('autoResetOnLock'), notifyPasswordChange: on('notifyPasswordChange'), requireHttps: on('requireHttps'), sessionHours: +g('sessionHours'), rememberDays: +g('rememberDays') } }, 'Configurações de segurança salvas');
  if (k === 'adm-app') return admSave({ appName: g('appName'), appUrl: g('appUrl'), defaults: { theme: g('theme') } }, 'Configurações do aplicativo salvas');
  if (k === 'adm-email') { const p = { host: g('host'), port: +g('port'), security: g('security'), user: g('user'), fromName: g('fromName'), fromEmail: g('fromEmail') }; if (g('pass')) p.pass = g('pass'); if (on('clearPass')) p.clearPass = true; return admSave({ email: p }, 'Configurações de e-mail salvas — envie um teste para verificá-las'); }
  if (k === 'adm-profile') return admUserAction(f.dataset.id, 'PATCH', '', { name: g('name'), email: g('email') }, 'Perfil salvo');
  if (k === 'adm-temp') { const r = await admUserAction(f.dataset.id, 'POST', '/temp-password', { password: g('password') }, 'Senha temporária definida — a pessoa escolherá uma nova senha ao entrar'); if (r) admUserModal(f.dataset.id); return; }
  if (k === 'adm-new') {
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.classList.add('loading');
    try { const r = await api('POST', '/api/admin/invites', { name: g('name'), email: g('email'), role: g('role') }); closeModal(); toast(r.resent ? `${r.invite.email} já havia sido convidado — um novo link foi enviado` : `Convite enviado para ${r.invite.email}`); ADM.stats = null; adminAfter(true); }
    catch (x) { btn.disabled = false; btn.classList.remove('loading'); toast(x.message); }
  }
});
document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.input === 'adm-q') { ADM.q = t.value; const pos = t.selectionStart; $('#adm-root').innerHTML = admTabHTML(); const n = $('[data-input="adm-q"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } } });
document.addEventListener('change', e => {
  const t = e.target; if (!t.dataset) return;
  if (t.dataset.input === 'adm-role') { const u = ADM.users.find(x => x.id === t.dataset.id); t.checked = u.role === 'admin'; ACT['adm-setrole']({ dataset: { id: u.id, v: u.role === 'admin' ? 'user' : 'admin' } }); }
  if (t.dataset.input === 'adm-quick') { const [a, b] = t.dataset.k.split('.'); admSave({ [a]: { [b]: t.checked } }); }
  if (t.dataset.input === 'adm-evtype') { ADM.evType = t.value; adminAfter(true); }
  if (t.dataset.input === 'adm-evuser') { ADM.evUser = t.value; adminAfter(true); }
});
// When you come back to this tab, pick up changes made on another device (avoids editing a stale copy)
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || AUTH.mode !== 'server' || !AUTH.user || !S || AUTH.pending || AUTH.inflight) return;
  try { const st = await api('GET', '/api/state'); if (st.rev > AUTH.rev && !AUTH.pending) { AUTH.rev = st.rev; AUTH.booting = true; loadState(st.state); AUTH.booting = false; applyTheme(); render(); toast('Atualizado com alterações de outro dispositivo'); } }
  catch (e) { if (e.status === 401) showAuth('login', { info: 'Sua sessão terminou — entre novamente.' }); }
});
