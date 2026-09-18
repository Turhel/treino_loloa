// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Oroshi-zz
'use strict';
/* Branded, email-client-safe HTML templates (table layout, inline styles, CID logo) + plain-text versions. */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const C = { bg: '#eef1f4', card: '#ffffff', ink: '#111827', text: '#374151', muted: '#6b7280', line: '#e5e7eb', dark: '#0f140c', lime: '#a3e635', limeInk: '#1a2e05' };

function layout({ preheader, title, bodyHtml, footerNote, appUrl, appName = 'FORGE 90', repliesTo }) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background:${C.bg};">
<tr><td align="center" style="padding:32px 14px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td bgcolor="${C.dark}" style="background:${C.dark};border-radius:16px 16px 0 0;padding:22px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding-right:12px;"><img src="cid:logo@forge90" width="44" height="44" alt="" style="display:block;border:0;border-radius:11px;"></td>
        <td style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:1px;color:#f7f9fc;">FORGE <span style="color:${C.lime};">90</span></td>
      </tr></table></td></tr>
    <tr><td bgcolor="${C.card}" style="background:${C.card};padding:34px 28px 28px;border-left:1px solid ${C.line};border-right:1px solid ${C.line};font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:${C.text};font-size:15px;line-height:1.6;">
      ${bodyHtml}
    </td></tr>
    <tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.line};border-top:0;border-radius:0 0 16px 16px;padding:0 28px 26px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="border-top:1px solid ${C.line};padding-top:16px;font-size:12px;line-height:1.55;color:${C.muted};">${footerNote || ''}</div></td></tr>
    <tr><td align="center" style="padding:18px 10px 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:${C.muted};">
      Enviado por ${esc(appName)}${appUrl ? ` · <a href="${esc(appUrl)}" style="color:${C.muted};">${esc(appUrl.replace(/^https?:\/\//, ''))}</a>` : ''}<br>${repliesTo ? `Responder a este e-mail envia a mensagem para ${esc(repliesTo)}.` : 'Esta é uma mensagem automática — as respostas não são monitoradas.'}</td></tr>
  </table>
</td></tr></table></body></html>`;
}
const h1 = t => `<h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:${C.ink};font-weight:800;">${t}</h1>`;
const p = t => `<p style="margin:0 0 14px;">${t}</p>`;
const button = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 18px;"><tr><td bgcolor="${C.lime}" style="background:${C.lime};border-radius:12px;">
  <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;font-weight:800;color:${C.limeInk};text-decoration:none;border-radius:12px;">${esc(label)}</a></td></tr></table>`;
const callout = (html, color = '#f7fee7', border = '#d9f99d') => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 16px;"><tr><td bgcolor="${color}" style="background:${color};border:1px solid ${border};border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.5;color:${C.text};">${html}</td></tr></table>`;
function device(ua) { ua = String(ua || ''); const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
  const o = /Windows/.test(ua) ? 'Windows' : /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''; return b ? b + (o ? ' on ' + o : '') : ''; }
const fmtTime = d => d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

function resetEmail({ name, link, minutes, expiresAt, reason, attempts, ip, ua, appUrl, appName }) {
  const hello = name ? `Olá ${esc(name.split(' ')[0])},` : 'Olá,';
  const locked = reason === 'lockout';
  const why = locked
    ? callout(`<b style="color:${C.ink};">Sua conta foi bloqueada</b> após ${attempts || 'várias'} tentativas de login sem sucesso. Redefinir sua senha desbloqueia a conta imediatamente.`, '#fff7ed', '#fed7aa')
    : '';
  const bodyHtml = `${h1(locked ? 'Sua conta está bloqueada' : 'Redefina sua senha')}
    ${p(hello)}${why}
    ${p(locked ? 'Para voltar a acessar, escolha uma nova senha usando o botão abaixo.' : 'Recebemos uma solicitação para redefinir a senha da sua conta FORGE 90. Escolha uma nova senha usando o botão abaixo.')}
    ${button(link, 'Redefinir minha senha')}
    ${callout(`⏱ <b style="color:${C.ink};">Este link expira em ${minutes} minutos</b> (${esc(fmtTime(expiresAt))}) e só pode ser usado uma vez.`)}
    <p style="margin:0 0 6px;font-size:13px;color:${C.muted};">O botão não funciona? Copie e cole este link no navegador:</p>
    <p style="margin:0 0 18px;font-size:13px;word-break:break-all;"><a href="${esc(link)}" style="color:#4d7c0f;">${esc(link)}</a></p>
    ${p(`Se você não solicitou isso, pode ignorar este e-mail — sua senha não será alterada. ${locked ? 'Se você não tentou entrar, alguém pode ter seu endereço de e-mail; sua conta continuará bloqueada até o bloqueio expirar ou a senha ser redefinida.' : ''}`)}`;
  const footerNote = `Solicitado em ${esc(fmtTime(new Date()))}${device(ua) ? ` · ${esc(device(ua))}` : ''}${ip ? ` · IP ${esc(ip)}` : ''}`;
  const html = layout({ preheader: `Use este link em até ${minutes} minutos para escolher uma nova senha.`, title: 'Redefina sua senha do FORGE 90', bodyHtml, footerNote, appUrl, appName });
  const text = `${hello.replace(/&#39;/g, "'")}\n\n${locked ? `Sua conta FORGE 90 foi bloqueada após ${attempts || 'várias'} tentativas de login sem sucesso. Redefinir sua senha desbloqueia a conta.\n\n` : 'Recebemos uma solicitação para redefinir a senha da sua conta FORGE 90.\n\n'}Escolha uma nova senha aqui:\n${link}\n\nEste link expira em ${minutes} minutos (${fmtTime(expiresAt)}) e só pode ser usado uma vez.\n\nSe você não solicitou isso, pode ignorar este e-mail — sua senha não será alterada.\n\nSolicitado em ${fmtTime(new Date())}${ip ? ` do IP ${ip}` : ''}.\n— FORGE 90`;
  return { subject: locked ? 'Sua conta FORGE 90 está bloqueada — redefina sua senha' : 'Redefina sua senha do FORGE 90', html, text };
}
function passwordChangedEmail({ name, when, ip, appUrl, appName, via }) {
  const hello = name ? `Olá ${esc(name.split(' ')[0])},` : 'Olá,';
  const bodyHtml = `${h1('Sua senha foi alterada')}${p(hello)}${p(`A senha da sua conta FORGE 90 acabou de ser alterada${via === 'reset' ? ' usando um link de redefinição' : via === 'admin' ? ' por um administrador' : ''}. Sua sessão foi encerrada nos outros dispositivos.`)}
    ${callout(`<b style="color:${C.ink};">Não foi você?</b> Use “Esqueceu a senha?” na tela de login imediatamente e entre em contato com o administrador do FORGE 90.`, '#fef2f2', '#fecaca')}
    ${appUrl ? button(appUrl, 'Abrir FORGE 90') : ''}`;
  const html = layout({ preheader: 'Sua senha do FORGE 90 acabou de ser alterada.', title: 'Senha alterada', bodyHtml, footerNote: `${esc(fmtTime(when))}${ip ? ` · IP ${esc(ip)}` : ''}`, appUrl, appName });
  const text = `${hello}\n\nA senha da sua conta FORGE 90 acabou de ser alterada. Se não foi você, use “Esqueceu a senha?” na tela de login imediatamente e entre em contato com o administrador.\n\n${fmtTime(when)}${ip ? ` · IP ${ip}` : ''}\n— FORGE 90`;
  return { subject: 'Sua senha do FORGE 90 foi alterada', html, text };
}
function simpleEmail({ title, heading, lines, buttonUrl, buttonLabel, appUrl, appName, preheader }) {
  const bodyHtml = `${h1(esc(heading || title))}${lines.map(l => p(esc(l))).join('')}${buttonUrl ? button(buttonUrl, buttonLabel || 'Abrir FORGE 90') : ''}`;
  return { subject: title, html: layout({ preheader: preheader || lines[0] || title, title, bodyHtml, footerNote: esc(fmtTime(new Date())), appUrl, appName }), text: `${heading || title}\n\n${lines.join('\n\n')}${buttonUrl ? `\n\n${buttonUrl}` : ''}\n— FORGE 90` };
}
function inviteEmail({ name, email, inviter, role, link, days, expiresAt, appUrl, appName, inviterEmail }) {
  const first = name ? name.split(' ')[0] : ''; const hello = first ? `Olá ${esc(first)},` : 'Olá,';
  const who = inviter ? esc(inviter) : 'Um administrador'; const admin = role === 'admin';
  const bodyHtml = `${h1(`Você foi convidado para ${esc(appName || 'FORGE 90')}`)}
    ${p(hello)}
    ${p(`${who} convidou você para participar de ${esc(appName || 'FORGE 90')}${admin ? ' como <b style="color:' + C.ink + ';">administrador</b>' : ''}. O aplicativo reúne seu plano de treino, refeições, lista de compras e progresso em um só lugar.`)}
    ${p('Aceite o convite para escolher sua senha e concluir a configuração da conta.')}
    ${button(link, 'Aceitar convite')}
    ${callout(`⏱ <b style="color:${C.ink};">Este convite expira em ${days} dias</b> (${esc(fmtTime(expiresAt))}) e só pode ser usado uma vez. Você entrará com <b style="color:${C.ink};">${esc(email)}</b>.`)}
    <p style="margin:0 0 6px;font-size:13px;color:${C.muted};">O botão não funciona? Copie e cole este link no navegador:</p>
    <p style="margin:0 0 18px;font-size:13px;word-break:break-all;"><a href="${esc(link)}" style="color:#4d7c0f;">${esc(link)}</a></p>
    ${p('Não esperava este convite? Pode ignorar este e-mail — nenhuma conta será criada enquanto você não aceitar.')}`;
  const footerNote = `Convidado por ${who} · ${esc(fmtTime(new Date()))}`;
  const html = layout({ preheader: `${inviter || 'Um administrador'} convidou você para ${appName || 'FORGE 90'}. O convite expira em ${days} dias.`, title: `Você foi convidado para ${appName || 'FORGE 90'}`, bodyHtml, footerNote, appUrl, appName, repliesTo: inviterEmail || '' });
  const text = `${first ? `Olá ${first},` : 'Olá,'}\n\n${inviter || 'Um administrador'} convidou você para participar de ${appName || 'FORGE 90'}${admin ? ' como administrador' : ''}.\n\nAceite o convite e escolha sua senha aqui:\n${link}\n\nEste convite expira em ${days} dias (${fmtTime(expiresAt)}) e só pode ser usado uma vez. Você entrará com ${email}.\n\nNão esperava este convite? Pode ignorar este e-mail — nenhuma conta será criada enquanto você não aceitar.\n— ${appName || 'FORGE 90'}`;
  return { subject: `${inviter || 'Um administrador'} convidou você para ${appName || 'FORGE 90'}`, html, text };
}
module.exports = { resetEmail, passwordChangedEmail, simpleEmail, inviteEmail };
