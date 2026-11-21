/* Comisión CABB — eventos (torneos, charlas, simultáneas…).
 * Se apoya en comision.js (api, esc, token, modal, confirmar, toast, ocupado, mostrar, ir, VISTAS, socios).
 */
(function () {
  var evActual = null;

  var css = document.createElement('style');
  css.textContent =
    '.evc { display: flex; gap: 12px; background: var(--papel); border: 1px solid var(--linea); border-radius: 12px; padding: 12px; margin-bottom: 8px; cursor: pointer; }' +
    '.evc.pasado { opacity: .6; }' +
    '.evc .f { flex: none; width: 50px; text-align: center; background: var(--azul); color: #fff; border-radius: 10px; padding: 6px 0; line-height: 1.1; }' +
    '.evc .f .d { font-size: 19px; font-weight: 700; } .evc .f .m { font-size: 11px; text-transform: uppercase; opacity: .85; }' +
    '.evc .i { flex: 1; min-width: 0; } .evc .t { font-weight: 700; } .evc .s { font-size: 12px; color: var(--gris); margin-top: 2px; }' +
    '.chipest { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; margin-left: 6px; vertical-align: middle; }' +
    '.chipest.Publicado { background: #dcefe3; color: var(--ok); } .chipest.Borrador { background: #eee; color: #555; } .chipest.Cancelado { background: #fbe0de; color: var(--mal); }' +
    '.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }' +
    '.stats div { background: var(--papel); border: 1px solid var(--linea); border-radius: 12px; padding: 10px; text-align: center; }' +
    '.stats b { display: block; font-size: 20px; } .stats span { font-size: 11px; color: var(--gris); text-transform: uppercase; }' +
    '.acciones { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; } .acciones .btn { margin: 0; font-size: 14px; padding: 11px 8px; }' +
    '.insc { border-top: 1px solid var(--linea); padding: 10px 0; font-size: 14px; } .insc:first-child { border-top: 0; }' +
    '.insc .fila { display: flex; align-items: center; gap: 8px; } .insc .n { flex: 1; font-weight: 600; } .insc .d { font-size: 12px; color: var(--gris); }' +
    '.insc .ops { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; } .insc .ops select { width: auto; padding: 7px; font-size: 14px; }' +
    '.insc .ops button { border: 1px solid var(--azul); background: #fff; color: var(--azul); border-radius: 8px; padding: 7px 10px; font-size: 13px; }' +
    '.insc .ops button.si { background: var(--ok); border-color: var(--ok); color: #fff; } .insc .ops button.no { border-color: var(--mal); color: var(--mal); }' +
    '.desc { border: 1px solid var(--linea); border-radius: 10px; padding: 10px; margin-top: 10px; }' +
    '.desc > label:first-child { display: flex; gap: 8px; align-items: center; color: var(--tinta); font-weight: 600; margin: 0; }' +
    '.desc input[type=checkbox], .chkfila input[type=checkbox] { width: 20px; height: 20px; }' +
    '.desc .cuerpo { margin-top: 6px; } .tipoval { display: flex; gap: 8px; } .tipoval select { flex: 0 0 90px; }' +
    '.chkfila { display: flex; gap: 8px; align-items: center; color: var(--tinta); font-weight: 600; margin-top: 12px; }' +
    '.pestanas { display: flex; gap: 6px; margin-bottom: 8px; } .pestanas button { flex: 1; border: 1px solid var(--azul); background: #fff; color: var(--azul); border-radius: 8px; padding: 8px; }' +
    '.pestanas button.on { background: var(--azul); color: #fff; }' +
    '.resultado { border: 1px solid var(--linea); border-radius: 8px; padding: 8px 10px; margin-top: 6px; cursor: pointer; font-size: 14px; }';
  document.head.appendChild(css);

  /* ---------- pestaña en la barra inferior ---------- */
  var nav = document.getElementById('nav');
  var tab = document.createElement('button');
  tab.setAttribute('data-ir', 'eventos');
  tab.innerHTML = '<span class="i">★</span>Eventos';
  nav.insertBefore(tab, nav.querySelector('[data-ir=mas]'));

  /* ---------- vistas ---------- */
  var wrap = document.querySelector('.wrap');
  var html =
    '<section id="vEventos" class="oculto">' +
    '  <div class="fila2" style="align-items:center;margin-bottom:8px"><h2 style="margin:0">Eventos</h2>' +
    '  <button class="btn" id="bNuevoEv" type="button" style="flex:0 0 auto;width:auto;margin:0;padding:10px 14px">＋ Nuevo</button></div>' +
    '  <div id="evcLista"></div>' +
    '</section>' +
    '<section id="vEvento" class="oculto">' +
    '  <button class="volver" data-ir="eventos" type="button">‹ Eventos</button>' +
    '  <div class="ficha-top"><div class="n" id="edTit"></div><div class="d" id="edSub"></div><div class="d" id="edPrecio" style="margin-top:6px"></div></div>' +
    '  <div class="stats"><div><b id="edIns"></b><span>Anotados</span></div><div><b id="edPag"></b><span>Pagaron</span></div><div><b id="edRec"></b><span>Recaudado</span></div></div>' +
    '  <div class="acciones">' +
    '    <a class="btn verde" id="edWa" target="_blank" rel="noopener">Compartir en WhatsApp</a>' +
    '    <button class="btn" id="edMail" type="button">Mandar por mail</button>' +
    '    <button class="btn sec" id="edCopiar" type="button">Copiar texto</button>' +
    '    <button class="btn sec" id="edEditar" type="button">Editar</button>' +
    '  </div>' +
    '  <div class="muted" id="edMails" style="margin:-4px 0 10px"></div>' +
    '  <div class="card"><h3>Anotar a alguien</h3>' +
    '    <div class="pestanas"><button class="on" data-p="socio" type="button">Socio</button><button data-p="externo" type="button">No socio</button></div>' +
    '    <div id="anSocio"><input id="anBuscar" placeholder="Buscar socio por apellido, nombre o Nº" autocomplete="off"><div id="anRes"></div></div>' +
    '    <div id="anExterno" class="oculto"><input id="anNombre" placeholder="Nombre y apellido"><div class="fila2" style="margin-top:6px"><input id="anDni" placeholder="DNI (opcional)" inputmode="numeric"><input id="anTel" placeholder="Teléfono (opcional)" inputmode="tel"></div>' +
    '    <button class="btn" id="anExtOk" type="button">Anotar con precio de no socio</button></div>' +
    '    <div class="error" id="anErr"></div></div>' +
    '  <div class="card"><h3 id="edInsTit">Anotados</h3><div id="edInsLista"></div></div>' +
    '  <div class="fila2"><button class="btn sec" id="edBorrador" type="button"></button><button class="btn peligro" id="edCancelar" type="button">Cancelar evento</button></div>' +
    '</section>' +
    '<section id="vEventoForm" class="oculto">' +
    '  <button class="volver" id="efVolver" type="button">‹ Volver</button>' +
    '  <h2 id="efTitulo">Nuevo evento</h2>' +
    '  <div class="card">' +
    '    <label>Título *</label><input id="efTit" placeholder="Ej.: Torneo relámpago de noviembre">' +
    '    <div class="fila2"><div><label>Fecha *</label><input id="efFecha" type="date"></div><div><label>Horario</label><input id="efHora" type="time"></div></div>' +
    '    <label>Lugar</label><input id="efLugar" placeholder="Ej.: Sede del Círculo">' +
    '    <label>Descripción</label><textarea id="efDesc" rows="3" placeholder="Ritmo de juego, rondas, premios, qué llevar…"></textarea>' +
    '    <label class="chkfila"><input type="checkbox" id="efCupoSi"> Tiene cupo</label>' +
    '    <div id="efCupoBox" class="oculto"><label>Cantidad de lugares</label><input id="efCupo" type="number" min="1" step="1"></div>' +
    '    <label class="chkfila"><input type="checkbox" id="efPago"> Es pago</label>' +
    '    <div id="efPagoBox" class="oculto">' +
    '      <div class="fila2"><div><label>Precio socios</label><input id="efPS" type="number" min="0" step="1"></div><div><label>Precio no socios</label><input id="efPE" type="number" min="0" step="1" placeholder="Opcional"></div></div>' +
    '      <p class="muted" style="margin:10px 0 0">Descuentos (elegí los que quieras; si a alguien le tocan varios, se suman):</p>' +
    '      <div class="desc"><label><input type="checkbox" id="dAD"> Socios con la cuota al día</label><div class="cuerpo oculto" id="dADc"><div class="tipoval"><select id="dADt"><option value="%">%</option><option value="$">$</option></select><input id="dADv" type="number" min="0" placeholder="Valor"></div></div></div>' +
    '      <div class="desc"><label><input type="checkbox" id="dAN"> Inscripción anticipada</label><div class="cuerpo oculto" id="dANc"><label>Vale para quien se anote hasta el</label><input id="dANh" type="date"><div class="tipoval" style="margin-top:6px"><select id="dANt"><option value="%">%</option><option value="$">$</option></select><input id="dANv" type="number" min="0" placeholder="Valor"></div></div></div>' +
    '      <div class="desc"><label><input type="checkbox" id="dCA"> Por categoría de socio</label><div class="cuerpo oculto" id="dCAc"><div id="dCAlist" class="muted"></div><div class="tipoval" style="margin-top:6px"><select id="dCAt"><option value="%">%</option><option value="$">$</option></select><input id="dCAv" type="number" min="0" placeholder="Valor"></div></div></div>' +
    '    </div>' +
    '    <label>Estado</label><select id="efEstado"><option value="Publicado">Publicado (lo ven los socios)</option><option value="Borrador">Borrador (todavía no se muestra)</option></select>' +
    '    <button class="btn verde" id="efGuardar" type="button">Guardar evento</button>' +
    '    <div class="error" id="efErr"></div>' +
    '  </div>' +
    '</section>';
  wrap.insertAdjacentHTML('beforeend', html);
  VISTAS.push('vEventos', 'vEvento', 'vEventoForm');

  var $ = function (id) { return document.getElementById(id); };
  var irOriginal = ir;
  ir = function (nombre) {
    if (nombre === 'eventos') {
      document.querySelectorAll('nav.tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.ir === 'eventos'); });
      mostrar('vEventos'); cargarLista();
    } else irOriginal(nombre);
  };

  /* ---------- lista ---------- */
  function partes(f) {
    var p = String(f).split('/'), m = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return { d: Number(p[0]) || '', m: m[(Number(p[1]) || 1) - 1] || '' };
  }
  function cargarLista() {
    $('evcLista').innerHTML = '<div class="cargando">Cargando…</div>';
    api('adminEventos', token).then(function (l) {
      $('evcLista').innerHTML = l.length ? l.map(function (e) {
        var f = partes(e.fecha);
        return '<div class="evc' + (e.pasado ? ' pasado' : '') + '" data-id="' + esc(e.id) + '"><div class="f"><div class="d">' + f.d + '</div><div class="m">' + f.m + '</div></div>' +
          '<div class="i"><div class="t">' + esc(e.titulo) + '<span class="chipest ' + esc(e.estado) + '">' + esc(e.pasado ? 'Finalizado' : e.estado) + '</span></div>' +
          '<div class="s">' + (e.hora ? esc(e.hora) + ' hs · ' : '') + e.inscriptos + (e.cupo ? '/' + e.cupo : '') + ' anotados' +
          (e.esPago ? ' · ' + esc(e.recaudadoTxt) + ' cobrados' : ' · sin costo') + (e.avisados ? ' · <b style="color:var(--aviso)">' + e.avisados + ' aviso' + (e.avisados === 1 ? '' : 's') + '</b>' : '') + '</div></div></div>';
      }).join('') : '<div class="card muted" style="text-align:center">Todavía no hay eventos. Creá el primero con ＋ Nuevo.</div>';
    }).catch(function (e) { $('evcLista').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
  }
  $('evcLista').addEventListener('click', function (ev) { var c = ev.target.closest('.evc'); if (c) abrir(c.dataset.id); });
  $('bNuevoEv').addEventListener('click', function () { abrirForm(null); });

  /* ---------- detalle ---------- */
  function abrir(id) {
    mostrar('vEvento');
    $('edTit').textContent = 'Cargando…'; $('edSub').textContent = ''; $('edPrecio').textContent = ''; $('edInsLista').innerHTML = '';
    $('anErr').textContent = ''; $('anRes').innerHTML = ''; $('anBuscar').value = '';
    api('adminEvento', token, id).then(pintar).catch(function (e) { $('edTit').textContent = msg(e); });
  }
  function pintar(e) {
    evActual = e;
    $('edTit').innerHTML = esc(e.titulo) + ' <span class="chipest ' + esc(e.estado) + '">' + esc(e.pasado ? 'Finalizado' : e.estado) + '</span>';
    $('edSub').textContent = e.fechaLarga.charAt(0).toUpperCase() + e.fechaLarga.slice(1) + (e.hora ? ' · ' + e.hora + ' hs' : '') + (e.lugar ? ' · ' + e.lugar : '');
    $('edPrecio').innerHTML = e.esPago ? 'Socios ' + esc(e.precioSocioTxt) + (e.precioExterno ? ' · No socios ' + esc(e.precioExternoTxt) : '') +
      (e.descuentos.length ? '<br>' + e.descuentos.map(esc).join('<br>') : '') : 'Sin costo';
    $('edIns').textContent = e.inscriptos + (e.cupo ? '/' + e.cupo : '');
    $('edPag').textContent = e.esPago ? e.pagados : '—';
    $('edRec').textContent = e.esPago ? e.recaudadoTxt : '—';
    $('edWa').href = 'https://wa.me/?text=' + encodeURIComponent(e.textoWhatsApp);
    $('edMails').textContent = e.mailsEnviados ? 'Ya se mandó por mail a ' + e.mailsEnviados + ' socio' + (e.mailsEnviados === 1 ? '' : 's') + '.' : '';
    $('edBorrador').textContent = e.estado === 'Publicado' ? 'Pasar a borrador' : 'Publicar';
    $('edCancelar').classList.toggle('oculto', e.estado === 'Cancelado');
    $('edInsTit').textContent = 'Anotados (' + e.inscriptos + ')';
    $('edInsLista').innerHTML = e.lista.length ? listaInscriptos(e) : '<div class="muted">Todavía no se anotó nadie.</div>';
  }
  function listaInscriptos(e) {
    return e.lista.map(function (i) {
      var est;
      if (i.pago === 'Pagado') est = '<span class="estado ok">Pagó ' + esc(i.montoTxt) + '</span>';
      else if (i.pago === 'Avisado') est = '<span class="estado pend">Avisó pago</span>';
      else if (i.pago === 'Pendiente') est = '<span class="estado mal">Debe ' + esc(i.montoTxt) + '</span>';
      else est = '<span class="estado ok">Sin costo</span>';
      var ops = '';
      if (i.pago === 'Pendiente' || i.pago === 'Avisado') {
        ops += '<select class="iMedio"><option' + (i.medio === 'Efectivo' ? ' selected' : '') + '>Efectivo</option><option' + (i.medio === 'Transferencia' ? ' selected' : '') + '>Transferencia</option><option' + (i.medio === 'Mercado Pago' ? ' selected' : '') + '>Mercado Pago</option></select>' +
          '<button class="si iCobrar" type="button">' + (i.pago === 'Avisado' ? 'Confirmar pago' : 'Cobrar') + '</button>';
        if (i.pago === 'Avisado') ops += '<button class="no iRechazar" type="button">No llegó</button>';
      }
      ops += '<button class="no iQuitar" type="button">Quitar</button>';
      return '<div class="insc" data-id="' + esc(i.id) + '"><div class="fila"><div class="n">' + esc(i.nombre) + '</div>' + est + '</div>' +
        '<div class="d">' + (i.tipo === 'Socio' ? 'Socio Nº ' + esc(i.nro) : 'No socio') + (i.telefono ? ' · ' + esc(i.telefono) : '') +
        (i.descuentos ? ' · ' + esc(i.descuentos) : '') + (i.comentario ? ' · "' + esc(i.comentario) + '"' : '') + '</div>' +
        '<div class="ops">' + ops + '</div></div>';
    }).join('');
  }
  $('edInsLista').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    var row = ev.target.closest('.insc'), id = row.dataset.id;
    var hecho = function (t) { toast(t); abrir(evActual.id); };
    if (b.classList.contains('iCobrar')) {
      var medio = row.querySelector('.iMedio').value, hoy = new Date();
      var f = hoy.getFullYear() + '-' + ('0' + (hoy.getMonth() + 1)).slice(-2) + '-' + ('0' + hoy.getDate()).slice(-2);
      b.disabled = true;
      api('adminPagoInscripcion', token, id, medio, f).then(function () { hecho('Pago registrado'); }).catch(function (e) { b.disabled = false; toast(msg(e)); });
    } else if (b.classList.contains('iRechazar')) {
      confirmar('¿El dinero no llegó? La inscripción vuelve a quedar como pendiente de pago.', 'Sí, no llegó', function () {
        api('adminRechazarPagoEvento', token, id).then(function () { hecho('Aviso rechazado'); }).catch(function (e) { toast(msg(e)); });
      }, 'peligro');
    } else if (b.classList.contains('iQuitar')) {
      confirmar('¿Quitar a esta persona del evento?', 'Quitar', function () {
        api('adminCancelarInscripcion', token, id).then(function () { hecho('Inscripción quitada'); }).catch(function (e) { toast(msg(e)); });
      }, 'peligro');
    }
  });

  // anotar
  document.querySelector('#vEvento .pestanas').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    document.querySelectorAll('#vEvento .pestanas button').forEach(function (x) { x.classList.toggle('on', x === b); });
    $('anSocio').classList.toggle('oculto', b.dataset.p !== 'socio');
    $('anExterno').classList.toggle('oculto', b.dataset.p !== 'externo');
  });
  var listaSocios = [];
  $('anBuscar').addEventListener('focus', function () {
    if (!listaSocios.length) api('adminSocios', token).then(function (l) { listaSocios = l; buscar(); }).catch(function () {});
  });
  $('anBuscar').addEventListener('input', buscar);
  function buscar() {
    var q = sinAcentos($('anBuscar').value).trim();
    if (!q) { $('anRes').innerHTML = ''; return; }
    var r = listaSocios.filter(function (s) {
      if (s.estado === 'Baja') return false;
      if (/^\d+$/.test(q)) return String(s.nro) === q || s.dni.indexOf(q) === 0;
      var t = sinAcentos(s.apellido + ' ' + s.nombre + ' ' + s.nombre + ' ' + s.apellido);
      return q.split(/\s+/).every(function (p) { return t.indexOf(p) >= 0; });
    }).slice(0, 6);
    $('anRes').innerHTML = r.map(function (s) { return '<div class="resultado" data-nro="' + esc(s.nro) + '"><b>' + esc(s.apellido) + ', ' + esc(s.nombre) + '</b> · Nº ' + esc(s.nro) + '</div>'; }).join('') ||
      '<div class="muted" style="margin-top:6px">Sin resultados.</div>';
  }
  $('anRes').addEventListener('click', function (ev) {
    var r = ev.target.closest('.resultado'); if (!r) return;
    $('anErr').textContent = '';
    api('adminInscribir', token, evActual.id, { nro: r.dataset.nro }).then(function (x) { toast('Anotado' + (evActual.esPago ? ': paga ' + x.monto : '')); abrir(evActual.id); })
      .catch(function (e) { $('anErr').textContent = msg(e); });
  });
  $('anExtOk').addEventListener('click', function () {
    $('anErr').textContent = '';
    api('adminInscribir', token, evActual.id, { nombre: $('anNombre').value, dni: $('anDni').value, telefono: $('anTel').value })
      .then(function (x) { $('anNombre').value = ''; $('anDni').value = ''; $('anTel').value = ''; toast('Anotado' + (evActual.esPago ? ': paga ' + x.monto : '')); abrir(evActual.id); })
      .catch(function (e) { $('anErr').textContent = msg(e); });
  });

  // acciones del evento
  $('edCopiar').addEventListener('click', function () {
    var t = evActual.textoWhatsApp;
    var ok = function () { toast('Texto copiado: pegalo donde quieras'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, ok); else ok();
  });
  $('edMail').addEventListener('click', function () {
    if (evActual.estado !== 'Publicado') { toast('Publicá el evento antes de mandarlo'); return; }
    confirmar('¿Mandar el evento por mail a todos los socios activos con mail? A quienes ya lo recibieron no se les repite.', 'Mandar', function () {
      ocupado($('edMail'), true, 'Enviando…');
      api('adminMailEvento', token, evActual.id).then(function (r) {
        modal('<p><b>Mails enviados: ' + r.enviados + '</b></p><p class="muted">' +
          (r.yaTenian ? r.yaTenian + ' ya lo habían recibido. ' : '') + (r.sinEmail ? r.sinEmail + ' socios no tienen mail cargado. ' : '') +
          (r.pendientesPorCupo ? r.pendientesPorCupo + ' quedaron sin mandar por el límite diario de Gmail: volvé a tocar "Mandar por mail" mañana y salen los que faltan.' : '') + '</p>');
        abrir(evActual.id);
      }).catch(function (e) { toast(msg(e)); }).then(function () { ocupado($('edMail'), false); });
    });
  });
  $('edEditar').addEventListener('click', function () { abrirForm(evActual); });
  $('edBorrador').addEventListener('click', function () {
    var nuevo = evActual.estado === 'Publicado' ? 'Borrador' : 'Publicado';
    api('adminEstadoEvento', token, evActual.id, nuevo).then(function () { toast(nuevo === 'Publicado' ? 'Evento publicado' : 'Evento pasado a borrador'); abrir(evActual.id); })
      .catch(function (e) { toast(msg(e)); });
  });
  $('edCancelar').addEventListener('click', function () {
    confirmar('¿Cancelar el evento? Deja de verse en la app de los socios. Si alguien ya pagó, la devolución la arreglan ustedes.', 'Cancelar evento', function () {
      api('adminEstadoEvento', token, evActual.id, 'Cancelado').then(function () { toast('Evento cancelado'); abrir(evActual.id); }).catch(function (e) { toast(msg(e)); });
    }, 'peligro');
  });

  /* ---------- formulario ---------- */
  var categorias = [];
  function toggle(chk, box) { $(chk).addEventListener('change', function () { $(box).classList.toggle('oculto', !$(chk).checked); }); }
  toggle('efCupoSi', 'efCupoBox'); toggle('efPago', 'efPagoBox'); toggle('dAD', 'dADc'); toggle('dAN', 'dANc'); toggle('dCA', 'dCAc');

  function abrirForm(e) {
    var d = e ? e.editar : null;
    $('efTitulo').textContent = d ? 'Editar evento' : 'Nuevo evento';
    $('efErr').textContent = '';
    var v = function (id, val) { $(id).value = val === undefined || val === null ? '' : val; };
    var c = function (id, val) { $(id).checked = !!val; $(id).dispatchEvent(new Event('change')); };
    v('efTit', d && d.Titulo); v('efFecha', d && d.Fecha); v('efHora', d && d.Hora); v('efLugar', d && d.Lugar); v('efDesc', d && d.Descripcion);
    c('efCupoSi', d && d.Cupo); v('efCupo', d && d.Cupo);
    c('efPago', d && d.EsPago); v('efPS', d && d.PrecioSocio); v('efPE', d && d.PrecioExterno);
    c('dAD', d && d.DescAlDia); v('dADt', (d && d.DescAlDiaTipo) || '%'); v('dADv', d && d.DescAlDiaValor);
    c('dAN', d && d.DescAnticipado); v('dANh', d && d.DescAnticipadoHasta); v('dANt', (d && d.DescAnticipadoTipo) || '%'); v('dANv', d && d.DescAnticipadoValor);
    c('dCA', d && d.DescCategoria); v('dCAt', (d && d.DescCategoriaTipo) || '%'); v('dCAv', d && d.DescCategoriaValor);
    v('efEstado', (d && d.Estado !== 'Cancelado' && d.Estado) || 'Publicado');
    var elegidas = d ? String(d.DescCategorias || '').split(',').map(function (x) { return x.trim(); }) : [];
    var pintarCats = function (lista) {
      $('dCAlist').innerHTML = lista.length ? 'Categorías con descuento:' + lista.map(function (k) {
        return '<label class="chkfila" style="font-weight:400;margin-top:6px"><input type="checkbox" class="dCAk" value="' + esc(k) + '"' + (elegidas.indexOf(k) >= 0 ? ' checked' : '') + '> ' + esc(k) + '</label>';
      }).join('') : 'No hay categorías cargadas en la planilla (hoja Categorias).';
    };
    if (e && e.categorias) { categorias = e.categorias; pintarCats(categorias); }
    else if (categorias.length) pintarCats(categorias);
    else {
      $('dCAlist').textContent = 'Cargando categorías…';
      api('adminCategorias', token).then(function (l) { categorias = l; pintarCats(categorias); })
        .catch(function () { $('dCAlist').textContent = 'No pude cargar las categorías.'; });
    }
    $('efGuardar').dataset.id = d ? d.id : '';
    mostrar('vEventoForm');
  }
  $('efVolver').addEventListener('click', function () { if ($('efGuardar').dataset.id) abrir($('efGuardar').dataset.id); else ir('eventos'); });
  $('efGuardar').addEventListener('click', function () {
    var cats = []; document.querySelectorAll('.dCAk:checked').forEach(function (x) { cats.push(x.value); });
    var d = {
      id: $('efGuardar').dataset.id || '', Titulo: $('efTit').value, Fecha: $('efFecha').value, Hora: $('efHora').value,
      Lugar: $('efLugar').value, Descripcion: $('efDesc').value, Estado: $('efEstado').value,
      Cupo: $('efCupoSi').checked ? $('efCupo').value : '',
      EsPago: $('efPago').checked, PrecioSocio: $('efPS').value, PrecioExterno: $('efPE').value,
      DescAlDia: $('dAD').checked, DescAlDiaTipo: $('dADt').value, DescAlDiaValor: $('dADv').value,
      DescAnticipado: $('dAN').checked, DescAnticipadoHasta: $('dANh').value, DescAnticipadoTipo: $('dANt').value, DescAnticipadoValor: $('dANv').value,
      DescCategoria: $('dCA').checked && cats.length > 0, DescCategorias: cats.join(', '), DescCategoriaTipo: $('dCAt').value, DescCategoriaValor: $('dCAv').value
    };
    if ($('efCupoSi').checked && !(Number(d.Cupo) > 0)) { $('efErr').textContent = 'Indicá la cantidad de lugares.'; return; }
    $('efErr').textContent = '';
    ocupado($('efGuardar'), true, 'Guardando…');
    api('adminGuardarEvento', token, d).then(function (id) { toast('Evento guardado'); abrir(id); })
      .catch(function (e) { $('efErr').textContent = msg(e); })
      .then(function () { ocupado($('efGuardar'), false); });
  });

  /* ---------- avisos de pago de eventos (en la pestaña Avisos) ---------- */
  cargarAvisos = function () {
    $('aLista').innerHTML = '<div class="cargando">Cargando…</div>';
    var cont = $('aListaEv');
    if (!cont) { cont = document.createElement('div'); cont.id = 'aListaEv'; $('aLista').parentNode.appendChild(cont); }
    cont.innerHTML = '';
    Promise.all([api('adminAvisos', token), api('adminAvisosEventos', token)]).then(function (r) {
      var l = r[0], le = r[1];
      marcarAvisos(l.length + le.length);
      $('aLista').innerHTML = l.length ? '<h3>Cuotas</h3>' + l.map(function (a) {
        return '<div class="aviso"><b>' + esc(a.socio) + '</b> (Nº ' + esc(a.nro) + ') — ' + esc(a.fecha) + '<br>Pagó: ' + esc(a.periodo) + ' por ' + esc(a.medio) +
          (a.comentario ? '<br><i>"' + esc(a.comentario) + '"</i>' : '') +
          '<div class="acc"><button data-rech="' + a.fila + '">Rechazar</button><button class="si" data-ficha="' + esc(a.nro) + '">Controlar y registrar</button></div></div>';
      }).join('') : (le.length ? '' : '<div class="card muted" style="text-align:center">No hay avisos pendientes 👌</div>');
      cont.innerHTML = le.length ? '<h3 style="margin-top:18px">Pagos de eventos</h3>' + le.map(function (a) {
        return '<div class="aviso"><b>' + esc(a.nombre) + '</b> — ' + esc(a.evento) + '<br>Avisó que pagó ' + esc(a.montoTxt) + ' por ' + esc(a.medio) +
          (a.comentario ? '<br><i>"' + esc(a.comentario) + '"</i>' : '') +
          '<div class="acc"><button data-evrech="' + esc(a.id) + '">No llegó</button><button class="si" data-evok="' + esc(a.id) + '" data-medio="' + esc(a.medio) + '">Confirmar pago</button></div></div>';
      }).join('') : '';
    }).catch(function (e) { $('aLista').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
  };
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t.dataset) return;
    if (t.dataset.evok) {
      var hoy = new Date(), f = hoy.getFullYear() + '-' + ('0' + (hoy.getMonth() + 1)).slice(-2) + '-' + ('0' + hoy.getDate()).slice(-2);
      t.disabled = true;
      api('adminPagoInscripcion', token, t.dataset.evok, t.dataset.medio || 'Transferencia', f).then(function () { toast('Pago confirmado'); cargarAvisos(); })
        .catch(function (e) { t.disabled = false; toast(msg(e)); });
    } else if (t.dataset.evrech) {
      confirmar('¿El dinero no llegó? La inscripción vuelve a quedar como pendiente de pago.', 'Sí, no llegó', function () {
        api('adminRechazarPagoEvento', token, t.dataset.evrech).then(function () { toast('Aviso rechazado'); cargarAvisos(); }).catch(function (e) { toast(msg(e)); });
      }, 'peligro');
    }
  });
})();
