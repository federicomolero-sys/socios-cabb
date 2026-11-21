/* Socios CABB — saludo de cumpleaños en la app del socio.
 * El día del cumple aparece una tarjeta con confeti en Inicio; en Perfil se puede desactivar.
 */
(function () {
  var panel = document.getElementById('vPanel');
  if (!panel) return;

  var css = document.createElement('style');
  css.textContent =
    '.cumple{position:relative;overflow:hidden;background:linear-gradient(135deg,#fff7e0,#ffe9c7 55%,#fde0e6);border:1px solid #f1d9a8;text-align:center;padding:22px 18px 18px}' +
    '.cumple .torta{font-size:46px;line-height:1;display:block;margin-bottom:6px;animation:cumpleSalto 1.6s ease-in-out infinite}' +
    '.cumple h2{font-size:20px;color:#1f3d2b;margin:0 0 8px}' +
    '.cumple p{margin:0;font-size:15px;line-height:1.45;color:#4a4335}' +
    '.cumple .firma{margin-top:10px;font-size:12px;color:#8a7a55;letter-spacing:.06em;text-transform:uppercase}' +
    '.cumple .cerrar{position:absolute;top:6px;right:8px;border:0;background:none;font-size:18px;color:#8a7a55;padding:6px;cursor:pointer;z-index:2}' +
    '.cumple .conf{position:absolute;top:-24px;font-size:15px;animation:cumpleCae linear infinite;pointer-events:none;opacity:.45;z-index:0}' +
    '.cumple .torta,.cumple h2,.cumple p,.cumple .firma{position:relative;z-index:1}' +
    '@keyframes cumpleCae{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(260px) rotate(320deg)}}' +
    '@keyframes cumpleSalto{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}' +
    '@media (prefers-reduced-motion: reduce){.cumple .torta,.cumple .conf{animation:none}.cumple .conf{display:none}}' +
    '.cum-pref{display:flex;align-items:center;gap:14px}.cum-pref .ic{font-size:26px;flex:none}.cum-pref .tx{flex:1;font-size:14px}.cum-pref .tx b{display:block;font-size:15px;margin-bottom:2px}' +
    '.cum-pref .tx span{color:var(--gris);font-size:13px}' +
    '.sw{position:relative;width:50px;height:30px;flex:none}.sw input{opacity:0;width:0;height:0;position:absolute}' +
    '.sw i{position:absolute;inset:0;border-radius:15px;background:#cfc8b8;transition:.2s;cursor:pointer}' +
    '.sw i::after{content:"";position:absolute;left:3px;top:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:.2s}' +
    '.sw input:checked+i{background:var(--verde)}.sw input:checked+i::after{transform:translateX(20px)}' +
    '.sw input:focus-visible+i{outline:2px solid var(--verde2);outline-offset:2px}';
  document.head.appendChild(css);

  /* ---------------- tarjetas ---------------- */
  var cSaludo = document.createElement('div');
  cSaludo.className = 'card cumple oculto'; cSaludo.id = 'bCumple';
  var cPref = document.createElement('div');
  cPref.className = 'card oculto'; cPref.id = 'bCumplePref';
  cPref.innerHTML = '<div class="cum-pref"><div class="ic">🎂</div><div class="tx"><b>Saludo de cumpleaños</b><span id="cumTxt"></span></div>' +
    '<label class="sw"><input type="checkbox" id="cumChk" aria-label="Recibir el saludo de cumpleaños"><i></i></label></div><div class="error" id="cumErr" style="min-height:0"></div>';

  function ubicar() {
    var ini = document.getElementById('sec-inicio'), per = document.getElementById('sec-perfil');
    var carnet = panel.querySelector('.carnet');
    if (ini && carnet && carnet.parentNode === ini && cSaludo.previousSibling !== carnet) ini.insertBefore(cSaludo, carnet.nextSibling);
    else if (!ini && !cSaludo.parentNode) panel.insertBefore(cSaludo, panel.firstChild);
    var datos = document.getElementById('bMisDatos');
    if (per && datos && cPref.previousSibling !== datos) per.insertBefore(cPref, datos.nextSibling);
    else if (!per && !cPref.parentNode) panel.appendChild(cPref);
  }

  function hoyTxt() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function cerrado() { try { return localStorage.getItem('cumple_cerrado') === hoyTxt() + '|' + (window.datos && window.datos.nro); } catch (e) { return false; } }

  function pintarSaludo(r) {
    if (!r.esHoy || !r.activo || !r.clubActivo || cerrado()) { cSaludo.classList.add('oculto'); return; }
    var conf = '', em = ['🎉', '🎊', '✨', '🎈', '♟️', '🥳'];
    for (var i = 0; i < 14; i++) {
      conf += '<span class="conf" style="left:' + (4 + (i * 7) % 92) + '%;animation-duration:' + (3.2 + (i % 5) * 0.7) + 's;animation-delay:' + (-(i * 0.45)) + 's">' + em[i % em.length] + '</span>';
    }
    cSaludo.innerHTML = conf + '<button class="cerrar" type="button" aria-label="Cerrar el saludo">✕</button>' +
      '<span class="torta" aria-hidden="true">🎂</span><h2>' + esc(r.titulo.replace(/^🎂\s*/, '')) + '</h2><p>' + esc(r.mensaje) + '</p>' +
      '<div class="firma">' + esc((window.datos && window.datos.club) || 'Círculo de Ajedrez') + '</div>';
    cSaludo.classList.remove('oculto');
  }
  cSaludo.addEventListener('click', function (ev) {
    if (!ev.target.closest('.cerrar')) return;
    try { localStorage.setItem('cumple_cerrado', hoyTxt() + '|' + (window.datos && window.datos.nro)); } catch (e) {}
    cSaludo.classList.add('oculto');
  });

  function pintarPref(r) {
    cPref.classList.toggle('oculto', !r.clubActivo);
    document.getElementById('cumChk').checked = !!r.activo;
    document.getElementById('cumTxt').textContent = !r.tieneFecha
      ? 'La comisión todavía no tiene cargada tu fecha de nacimiento. Pasásela y el día de tu cumple te saludamos.'
      : r.activo ? 'El día de tu cumple te llega un saludo del club. Si no lo querés, desactivalo.' : 'Desactivado: no te vamos a mandar el saludo.';
  }

  cPref.addEventListener('change', function (ev) {
    var chk = ev.target; if (chk.id !== 'cumChk') return;
    var err = document.getElementById('cumErr'); err.textContent = '';
    chk.disabled = true;
    api('cumpleSocioGuardar', token, chk.checked).then(function (r) {
      estado.activo = r.activo; pintarPref(estado); pintarSaludo(estado);
    }).catch(function (e) {
      chk.checked = !chk.checked;
      if (!sesionVencida(e)) err.textContent = msgError(e);
    }).then(function () { chk.disabled = false; });
  });

  /* ---------------- carga ---------------- */
  var estado = null, ultima = 0, cargando = false;
  function cargar(forzar) {
    if (!window.token || !window.datos || cargando) return;
    if (!forzar && Date.now() - ultima < 60000) return;
    cargando = true;
    api('cumpleSocio', token).then(function (r) {
      estado = r; ultima = Date.now(); ubicar(); pintarSaludo(r); pintarPref(r);
    }).catch(function (e) { if (!sesionVencida(e)) console.warn('cumpleSocio', e); })
      .then(function () { cargando = false; });
  }
  new MutationObserver(function () {
    if (!panel.classList.contains('oculto')) setTimeout(function () { cargar(true); }, 0);
    else { estado = null; cSaludo.classList.add('oculto'); cPref.classList.add('oculto'); }
  }).observe(panel, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') cargar(); });
  // Mantener las tarjetas en su lugar si el resto de la pantalla se reacomoda
  new MutationObserver(function () { if (estado) ubicar(); }).observe(panel, { childList: true });
  ubicar();
  setTimeout(function () { cargar(true); }, 0);
})();
