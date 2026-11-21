/* Socios CABB — extras del panel de la comisión:
 *  - Notificar un evento a los celulares de los socios
 *  - Mandar una notificación libre (en "Más")
 *  - Actividad reciente: quién hizo qué en el panel (en "Más")
 * Se apoya en comision.js y comision-eventos.js.
 */
(function () {
  var estilos = document.createElement('style');
  estilos.textContent =
    '.reg { border-top: 1px solid var(--linea); padding: 9px 0; font-size: 14px; }' +
    '.reg:first-child { border-top: 0; }' +
    '.reg .t { display: flex; justify-content: space-between; gap: 8px; }' +
    '.reg .u { font-weight: 600; }' +
    '.reg .f { color: var(--gris); font-size: 12px; flex: none; }' +
    '.reg .d { color: var(--gris); font-size: 12px; margin-top: 2px; word-break: break-word; }' +
    '.reg.err .a { color: var(--mal); }';
  document.head.appendChild(estilos);

  function resultadoPush(r) {
    if (!r.dispositivos) return '<p><b>Todavía no hay celulares con avisos activados.</b></p><p class="muted">Cada socio los activa desde su app, con el botón "Activar" de "Avisos en este celular".</p>';
    return '<p><b>Notificación enviada a ' + r.enviadas + ' dispositivo' + (r.enviadas === 1 ? '' : 's') + '.</b></p><p class="muted">' +
      (r.borradas ? r.borradas + ' ya no estaban activos y se quitaron de la lista. ' : '') +
      (r.fallidas ? r.fallidas + ' no se pudieron enviar (se reintenta en el próximo aviso).' : '') + '</p>';
  }

  /* ---------- Botón en el detalle del evento ---------- */
  var edMail = document.getElementById('edMail');
  if (edMail) {
    var b = document.createElement('button');
    b.className = 'btn'; b.id = 'edPush'; b.type = 'button'; b.textContent = 'Notificar a los celulares';
    edMail.parentNode.insertBefore(b, edMail.nextSibling);
    b.addEventListener('click', function () {
      var ev = window.evActual;
      if (!ev) return;
      if (ev.estado !== 'Publicado') { toast('Publicá el evento antes de avisar'); return; }
      confirmar('¿Mandar una notificación de "' + ev.titulo + '" a todos los socios que activaron los avisos en el celular?', 'Mandar', function () {
        ocupado(b, true, 'Enviando…');
        api('adminNotificarEvento', token, ev.id).then(function (r) { modal(resultadoPush(r)); })
          .catch(function (e) { toast(msg(e)); }).then(function () { ocupado(b, false); });
      });
    });
  }

  /* ---------- Tarjetas en "Más" ---------- */
  var vMas = document.getElementById('vMas');
  var antes = document.getElementById('bSalir');
  var cardN = document.createElement('div');
  cardN.className = 'card';
  cardN.innerHTML = '<h3>Notificación a los celulares</h3>' +
    '<p class="muted" style="margin:0" id="nSubs">…</p>' +
    '<label>Título</label><input id="nTitulo" maxlength="60" placeholder="Ej.: Sede cerrada el lunes">' +
    '<label>Mensaje</label><textarea id="nTexto" rows="2" maxlength="200" placeholder="Hasta 200 caracteres"></textarea>' +
    '<button class="btn" id="nEnviar" type="button">Enviar notificación</button>';
  var cardR = document.createElement('div');
  cardR.className = 'card';
  cardR.innerHTML = '<details id="rDet"><summary style="font-weight:600;cursor:pointer">Actividad reciente del panel</summary>' +
    '<p class="muted">Últimas 100 acciones de la comisión, con los ingresos (también los fallidos). El historial completo queda en la hoja "Registro" de la planilla.</p>' +
    '<div id="rLista"></div></details>';
  vMas.insertBefore(cardN, antes);
  vMas.insertBefore(cardR, antes);

  function cargarSubs() {
    api('adminSuscriptos', token).then(function (s) {
      document.getElementById('nSubs').textContent = s.dispositivos
        ? s.socios + ' socio' + (s.socios === 1 ? '' : 's') + ' con avisos activados (' + s.dispositivos + ' dispositivo' + (s.dispositivos === 1 ? '' : 's') + ').'
        : 'Todavía ningún socio activó los avisos en el celular.';
    }).catch(function () { document.getElementById('nSubs').textContent = ''; });
  }
  function cargarRegistro() {
    var l = document.getElementById('rLista');
    l.innerHTML = '<div class="muted">Cargando…</div>';
    api('adminRegistro', token).then(function (rs) {
      l.innerHTML = rs.length ? rs.map(function (r) {
        var err = r.resultado !== 'OK';
        return '<div class="reg' + (err ? ' err' : '') + '"><div class="t"><div><span class="u">' + esc(r.usuario) + '</span> · <span class="a">' + esc(r.accion) + '</span></div>' +
          '<div class="f">' + esc(r.fecha) + '</div></div>' +
          ((r.detalle || err) ? '<div class="d">' + esc(r.detalle) + (err ? (r.detalle ? ' · ' : '') + esc(r.resultado) : '') + '</div>' : '') + '</div>';
      }).join('') : '<div class="muted">Sin actividad registrada todavía.</div>';
    }).catch(function (e) { l.innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
  }
  document.getElementById('rDet').addEventListener('toggle', function () { if (this.open) cargarRegistro(); });

  document.getElementById('nEnviar').addEventListener('click', function () {
    var bt = this, ti = document.getElementById('nTitulo').value.trim(), tx = document.getElementById('nTexto').value.trim();
    if (!ti || !tx) { toast('Completá el título y el mensaje'); return; }
    confirmar('¿Mandar "' + ti + '" a todos los celulares con avisos activados?', 'Mandar', function () {
      ocupado(bt, true, 'Enviando…');
      api('adminNotificarTexto', token, ti, tx).then(function (r) {
        modal(resultadoPush(r));
        if (r.dispositivos) { document.getElementById('nTitulo').value = ''; document.getElementById('nTexto').value = ''; }
        cargarSubs();
      }).catch(function (e) { toast(msg(e)); }).then(function () { ocupado(bt, false); });
    });
  });

  // Al entrar a "Más", actualizar contador (y registro si está abierto)
  var irOriginal = window.ir;
  window.ir = function (nombre) {
    irOriginal.apply(this, arguments);
    if (nombre === 'mas') { cargarSubs(); if (document.getElementById('rDet').open) cargarRegistro(); }
  };
})();
