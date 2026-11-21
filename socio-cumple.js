/* Socios CABB — saludo de cumpleaños en la app del socio.
 * El día del cumple aparece una tarjeta con confeti en Inicio. Activarlo o desactivarlo lo maneja la comisión.
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
    '@media (prefers-reduced-motion: reduce){.cumple .torta,.cumple .conf{animation:none}.cumple .conf{display:none}}';
  document.head.appendChild(css);

  /* ---------------- tarjetas ---------------- */
  var cSaludo = document.createElement('div');
  cSaludo.className = 'card cumple oculto'; cSaludo.id = 'bCumple';

  function ubicar() {
    var ini = document.getElementById('sec-inicio');
    var carnet = panel.querySelector('.carnet');
    if (ini && carnet && carnet.parentNode === ini && cSaludo.previousSibling !== carnet) ini.insertBefore(cSaludo, carnet.nextSibling);
    else if (!ini && !cSaludo.parentNode) panel.insertBefore(cSaludo, panel.firstChild);
  }

  function hoyTxt() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function cerrado() { try { return localStorage.getItem('cumple_cerrado') === hoyTxt() + '|' + (window.datos && window.datos.nro); } catch (e) { return false; } }

  function pintarSaludo(r) {
    if (!r.esHoy || cerrado()) { cSaludo.classList.add('oculto'); return; }
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

  /* ---------------- carga ---------------- */
  var estado = null, ultima = 0, cargando = false;
  function cargar(forzar) {
    if (!window.token || !window.datos || cargando) return;
    if (!forzar && Date.now() - ultima < 60000) return;
    cargando = true;
    api('cumpleSocio', token).then(function (r) {
      estado = r; ultima = Date.now(); ubicar(); pintarSaludo(r);
    }).catch(function (e) { if (!sesionVencida(e)) console.warn('cumpleSocio', e); })
      .then(function () { cargando = false; });
  }
  new MutationObserver(function () {
    if (!panel.classList.contains('oculto')) setTimeout(function () { cargar(true); }, 0);
    else { estado = null; cSaludo.classList.add('oculto'); }
  }).observe(panel, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') cargar(); });
  // Mantener las tarjetas en su lugar si el resto de la pantalla se reacomoda
  new MutationObserver(function () { if (estado) ubicar(); }).observe(panel, { childList: true });
  ubicar();
  setTimeout(function () { cargar(true); }, 0);
})();
