/* Socios CABB — sección de eventos en la app del socio.
 * Se apoya en app.js (usa sus funciones api, esc, token y datos).
 */
(function () {
  var LS_VISTOS = 'socios_eventos_vistos';
  var eventos = [];

  var estilos = document.createElement('style');
  estilos.textContent =
    '.ev { border-top: 1px solid var(--linea); padding: 14px 0; }' +
    '.ev:first-of-type { border-top: 0; padding-top: 4px; }' +
    '.ev-top { display: flex; gap: 12px; align-items: flex-start; }' +
    '.ev-fecha { flex: none; width: 52px; text-align: center; background: var(--verde); color: #fff; border-radius: 10px; padding: 6px 0; line-height: 1.1; }' +
    '.ev-fecha .d { font-size: 20px; font-weight: 700; }' +
    '.ev-fecha .m { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; opacity: .85; }' +
    '.ev-info { flex: 1; min-width: 0; }' +
    '.ev-tit { font-weight: 700; font-size: 15px; }' +
    '.ev-sub { font-size: 13px; color: var(--gris); margin-top: 2px; }' +
    '.ev-nuevo { display: inline-block; background: var(--mal); color: #fff; font-size: 10px; font-weight: 700; border-radius: 999px; padding: 2px 7px; margin-left: 6px; vertical-align: middle; }' +
    '.ev-desc { font-size: 13px; margin-top: 8px; white-space: pre-wrap; }' +
    '.ev-precio { font-size: 14px; margin-top: 8px; }' +
    '.ev-precio s { color: var(--gris); margin-right: 6px; }' +
    '.ev-dto { font-size: 12px; color: var(--ok); }' +
    '.ev-ok { display: inline-block; background: #d8f0e0; color: var(--ok); font-weight: 700; font-size: 12px; border-radius: 999px; padding: 4px 10px; margin-top: 8px; }' +
    '.ev-pend { display: inline-block; background: #fff1d6; color: var(--aviso); font-weight: 700; font-size: 12px; border-radius: 999px; padding: 4px 10px; margin-top: 8px; margin-left: 4px; }' +
    '.ev-lleno { display: inline-block; background: #eee; color: #555; font-weight: 700; font-size: 12px; border-radius: 999px; padding: 4px 10px; margin-top: 8px; }' +
    '.ev .btn { margin-top: 10px; padding: 10px; font-size: 14px; }' +
    '.ev .link { margin-top: 8px; display: inline-block; }' +
    '.ev-pago { background: var(--crema); border-radius: 10px; padding: 10px 12px; margin-top: 10px; font-size: 13px; }' +
    '.ev-pago select, .ev-pago input { margin-top: 6px; padding: 9px; font-size: 15px; }';
  document.head.appendChild(estilos);

  var card = document.createElement('div');
  card.className = 'card oculto';
  card.id = 'bEventos';
  card.innerHTML = '<h2 style="display:flex;align-items:center;gap:8px">Próximos eventos <span id="evBadge" class="ev-nuevo oculto"></span></h2><div id="evLista"></div>';
  var ancla = document.getElementById('bDeuda');
  ancla.parentNode.insertBefore(card, ancla.nextSibling);

  function vistos() { try { return JSON.parse(localStorage.getItem(LS_VISTOS) || '[]'); } catch (e) { return []; } }
  function marcarVistos() {
    try { localStorage.setItem(LS_VISTOS, JSON.stringify(eventos.map(function (e) { return e.id; }).concat(vistos()).slice(0, 200))); } catch (e) {}
  }
  function fechaPartes(f) {
    var p = String(f).split('/');
    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return { d: Number(p[0]) || '', m: meses[(Number(p[1]) || 1) - 1] || '' };
  }

  function cargar() {
    if (!token) return;
    api('eventos', token).then(function (l) { eventos = l; pintar(); }).catch(function () {});
  }

  function pintar() {
    var c = document.getElementById('bEventos');
    if (!eventos.length) { c.classList.add('oculto'); return; }
    c.classList.remove('oculto');
    var v = vistos();
    var nuevos = eventos.filter(function (e) { return v.indexOf(e.id) < 0; }).length;
    var badge = document.getElementById('evBadge');
    badge.textContent = nuevos === 1 ? '1 nuevo' : nuevos + ' nuevos';
    badge.classList.toggle('oculto', !nuevos);
    document.getElementById('evLista').innerHTML = eventos.map(function (e) {
      var f = fechaPartes(e.fecha);
      var h = '<div class="ev" data-id="' + esc(e.id) + '"><div class="ev-top">' +
        '<div class="ev-fecha"><div class="d">' + esc(f.d) + '</div><div class="m">' + esc(f.m) + '</div></div>' +
        '<div class="ev-info"><div class="ev-tit">' + esc(e.titulo) + (v.indexOf(e.id) < 0 ? '<span class="ev-nuevo">Nuevo</span>' : '') + '</div>' +
        '<div class="ev-sub">' + esc(e.fechaLarga.charAt(0).toUpperCase() + e.fechaLarga.slice(1)) + (e.hora ? ' · ' + esc(e.hora) + ' hs' : '') + (e.lugar ? ' · ' + esc(e.lugar) : '') + '</div>' +
        (e.quedan !== null && !e.inscripcion ? '<div class="ev-sub">' + (e.lleno ? '' : 'Quedan ' + e.quedan + ' lugar' + (e.quedan === 1 ? '' : 'es')) + '</div>' : '') +
        '</div></div>';
      if (e.descripcion) h += '<div class="ev-desc">' + esc(e.descripcion) + '</div>';

      if (e.inscripcion) {
        var i = e.inscripcion;
        h += '<span class="ev-ok">✓ Estás anotado</span>';
        if (e.esPago && i.monto > 0) {
          if (i.pago === 'Pagado') h += '<span class="ev-ok">Pagado</span>';
          else if (i.pago === 'Avisado') h += '<span class="ev-pend">Pago avisado, a confirmar</span>';
          else {
            h += '<span class="ev-pend">Falta pagar ' + esc(i.montoTxt) + '</span>' +
              '<div class="ev-pago">' + datosPago() +
              '<label style="margin-top:10px">¿Ya pagaste? Avisanos:</label>' +
              '<select class="evMedio">' + datos.medios.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('') + '</select>' +
              '<input class="evComent" maxlength="300" placeholder="Comentario (opcional)">' +
              '<button class="btn evAvisar" type="button">Avisar que pagué ' + esc(i.montoTxt) + '</button></div>';
          }
        }
        if (i.pago !== 'Pagado' && i.pago !== 'Avisado') h += '<div><button class="link evBaja" type="button">Darme de baja</button></div>';
      } else if (e.lleno) {
        h += '<span class="ev-lleno">Cupo completo</span>';
      } else {
        if (e.esPago) {
          var p = e.miPrecio;
          h += '<div class="ev-precio">Para vos: ' + (p.monto < p.base ? '<s>' + esc(p.baseTxt) + '</s>' : '') + '<b>' + esc(p.montoTxt) + '</b></div>';
          p.descuentos.forEach(function (d) { h += '<div class="ev-dto">✔ ' + esc(d) + '</div>'; });
          var otros = e.descuentos.length && !p.descuentos.length ? e.descuentos : [];
          otros.forEach(function (d) { h += '<div class="ev-sub">' + esc(d) + '</div>'; });
        } else {
          h += '<div class="ev-precio"><b>Sin costo</b></div>';
        }
        h += '<button class="btn evAnotar" type="button">Anotarme</button>';
      }
      return h + '<div class="error evErr"></div></div>';
    }).join('');
  }

  function datosPago() {
    var p = datos.pago, h = '<b>Cómo pagar</b>';
    if (p.alias) h += '<div>Alias: <b>' + esc(p.alias) + '</b> <button type="button" class="copiar" data-v="' + esc(p.alias) + '">Copiar</button></div>';
    if (p.cbu) h += '<div style="margin-top:4px">CBU/CVU: <b>' + esc(p.cbu) + '</b> <button type="button" class="copiar" data-v="' + esc(p.cbu) + '">Copiar</button></div>';
    if (p.titular) h += '<div class="muted">Titular: ' + esc(p.titular) + '</div>';
    if (p.mp) h += '<a class="btn" style="background:#009ee3" href="' + esc(p.mp) + '" target="_blank" rel="noopener">Pagar con Mercado Pago</a>';
    h += '<div class="muted" style="margin-top:6px">También en efectivo en la sede.</div>';
    return h;
  }

  document.getElementById('evLista').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    var box = ev.target.closest('.ev'); if (!box) return;
    var id = box.getAttribute('data-id');
    var err = box.querySelector('.evErr');
    var accion = null, args = [];
    if (b.classList.contains('evAnotar')) { accion = 'inscribirEvento'; args = [token, id]; }
    else if (b.classList.contains('evBaja')) { accion = 'cancelarEvento'; args = [token, id]; }
    else if (b.classList.contains('evAvisar')) { accion = 'avisarPagoEvento'; args = [token, id, box.querySelector('.evMedio').value, box.querySelector('.evComent').value]; }
    if (!accion) return;
    err.textContent = '';
    b.disabled = true;
    api.apply(null, [accion].concat(args)).then(function () { cargar(); })
      .catch(function (e) { b.disabled = false; if (!sesionVencida(e)) err.textContent = msgError(e); });
  });

  // Cargar cuando se muestra el panel del socio, y marcar como vistos al salir
  var panel = document.getElementById('vPanel');
  new MutationObserver(function () {
    if (!panel.classList.contains('oculto')) cargar();
    else { eventos = []; pintar(); }
  }).observe(panel, { attributes: true, attributeFilter: ['class'] });
  if (!panel.classList.contains('oculto')) cargar();
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') marcarVistos();
    else if (!panel.classList.contains('oculto')) cargar();
  });
  window.addEventListener('pagehide', marcarVistos);
})();
