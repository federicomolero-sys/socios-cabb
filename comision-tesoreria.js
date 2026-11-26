/* Comisión CABB — Tesorería: comprobantes de pago, padrón de socios habilitados (art. 33),
 * morosidad con avisos escalonados (art. 12), caja de tesorería y copias de seguridad.
 */
(function () {
  function e(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function pesos(n) { var v = Math.round(Number(n) || 0); return (v < 0 ? '− ' : '') + '$ ' + Math.abs(v).toLocaleString('es-AR'); }
  function hoyIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function $id(id) { return document.getElementById(id); }

  var css = document.createElement('style');
  css.textContent =
    '.ts-sw{display:flex;gap:10px;align-items:center;margin:6px 0}.ts-sw input{width:auto;transform:scale(1.2)}' +
    '.ts-res{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.ts-res div{background:var(--crema);border-radius:10px;padding:8px 10px}' +
    '.ts-res small{display:block;color:var(--gris);font-size:12px}.ts-res b{font-size:16px}.ts-neg{color:var(--mal)}.ts-pos{color:var(--verde)}' +
    '.ts-it{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--linea);font-size:14px}.ts-it:first-child{border-top:0}' +
    '.ts-it .s{color:var(--gris);font-size:12.5px}.ts-it .m{white-space:nowrap;font-weight:600;text-align:right}' +
    '.ts-tag{display:inline-block;border-radius:6px;padding:1px 6px;font-size:12px;font-weight:600;background:#eee;margin-left:4px}' +
    '.ts-tag.p1{background:#fff3cd;color:#7a5a00}.ts-tag.p2{background:#fde2e1;color:#9b1c1c}.ts-tag.p3{background:#9b1c1c;color:#fff}' +
    '.ts-tag.prox{background:#e7eefc;color:#1d4f9c}.ts-tabs{display:flex;gap:6px;margin:8px 0}.ts-tabs button{flex:1}' +
    '.ts-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.ts-grid3 label,.ts-grid2 label{margin-top:6px}.ts-grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px}' +
    '.ts-tabla{width:100%;border-collapse:collapse;font-size:13px;margin-top:6px}.ts-tabla td,.ts-tabla th{padding:4px 3px;border-bottom:1px solid var(--linea);text-align:right}' +
    '.ts-tabla td:first-child,.ts-tabla th:first-child{text-align:left}';
  document.head.appendChild(css);

  var mas = $id('vMas');
  var antes = $id('rcCard') || $id('ctCard') || $id('dcCard');
  function tarjeta(id, titulo) {
    var c = document.createElement('div');
    c.className = 'card'; c.id = id;
    c.innerHTML = '<details><summary style="font-weight:600;cursor:pointer">' + titulo + '</summary><div class="ts-cuerpo" style="margin-top:10px"><div class="muted">Cargando…</div></div></details>';
    if (mas) { if (antes && antes.parentNode === mas) mas.insertBefore(c, antes); else mas.appendChild(c); }
    return c;
  }
  function alAbrir(card, fn) { card.querySelector('details').addEventListener('toggle', function () { if (this.open) fn(); }); }
  function cuerpo(card, html) { card.querySelector('.ts-cuerpo').innerHTML = html; }
  function falla(card) { return function (x) { cuerpo(card, '<div class="error">' + e(msg(x)) + '</div>'); }; }
  function ventana(titulo) {
    var w = window.open('', '_blank');
    if (!w) { toast('El navegador bloqueó la ventana: permití las ventanas emergentes para este sitio.'); return null; }
    w.document.write('<p style="font-family:sans-serif;padding:20px">Preparando ' + e(titulo) + '…</p>');
    return w;
  }
  function escribir(w, html) { w.document.open(); w.document.write(html); w.document.close(); }
  function paginaSimple(titulo, club, cuerpoHtml) {
    return '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + e(titulo) + '</title><style>' +
      'body{font-family:Georgia,serif;color:#1d1d1b;max-width:820px;margin:20px auto;padding:0 18px;font-size:13.5px}h1{font-size:20px;margin:4px 0}.club{color:#1f3d2b;font-weight:bold;border-bottom:3px double #1f3d2b;padding-bottom:6px}' +
      'table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #bbb;padding:5px 6px;text-align:left}th{background:#f1ede4}td.n{text-align:right;white-space:nowrap}' +
      '.firma{width:30%}.muted{color:#666}.barra{text-align:center;margin:10px}.barra button{background:#1f3d2b;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-size:15px}' +
      '@media print{.barra{display:none}body{margin:0}}</style></head><body><div class="barra"><button onclick="window.print()">Imprimir o guardar en PDF</button></div>' +
      '<div class="club">' + e(club) + '</div>' + cuerpoHtml + '</body></html>';
  }

  /* ================= Comprobantes ================= */
  var cRec = tarjeta('tsRec', '🧾 Comprobantes de pago');
  function pintarRec(r) {
    cuerpo(cRec, '<div class="muted">Cada pago que se registra genera un comprobante numerado. El socio lo ve en su app (en el historial de cuotas) y lo puede imprimir o guardar en PDF.</div>' +
      '<label class="ts-sw"><input type="checkbox" id="tsRecAuto"' + (r.auto ? ' checked' : '') + '> Mandárselo automáticamente al socio (mail y aviso en la app)</label>' +
      '<div class="muted">Comprobantes emitidos: ' + r.ultimo + '. Desde la ficha de cada socio se puede ver, imprimir o reenviar cada uno.</div><div class="error" id="tsRecErr" style="min-height:0"></div>');
  }
  alAbrir(cRec, function () { api('adminRecibosConfig', token).then(pintarRec).catch(falla(cRec)); });
  cRec.addEventListener('change', function (ev) {
    if (ev.target.id !== 'tsRecAuto') return;
    var chk = ev.target; chk.disabled = true;
    api('adminGuardarRecibos', token, { auto: chk.checked }).then(function () { toast(chk.checked ? 'Se mandan automáticamente' : 'Ya no se mandan solos'); chk.disabled = false; })
      .catch(function (x) { chk.checked = !chk.checked; chk.disabled = false; $id('tsRecErr').textContent = msg(x); });
  });

  // En la ficha: botones para cada cuota pagada con comprobante
  var F = null;
  var pintarPrev = window.pintarFicha;
  window.pintarFicha = function (f) {
    var r = pintarPrev.apply(this, arguments);
    F = f;
    try {
      var filas = document.querySelectorAll('#fHistorial > .cuota');
      (f && f.cuotas || []).forEach(function (x, i) {
        if (!x.recibo || x.estado !== 'Pagada' || !filas[i]) return;
        var d = filas[i].querySelector('.det'); if (!d) return;
        d.insertAdjacentHTML('beforeend', ' · <button class="mini" data-recibo="' + e(x.recibo) + '">🧾 comprobante</button> <button class="mini" data-reenviar="' + e(x.recibo) + '">reenviar</button>');
      });
    } catch (x) { console.warn(x); }
    return r;
  };
  $id('fHistorial').addEventListener('click', function (ev) {
    var t = ev.target;
    if (t.dataset && t.dataset.recibo) {
      var w = ventana('el comprobante'); if (!w) return;
      api('adminRecibo', token, t.dataset.recibo).then(function (r) { escribir(w, r.html); }).catch(function (x) { w.close(); toast(msg(x)); });
    } else if (t.dataset && t.dataset.reenviar) {
      confirmar('¿Reenviarle el comprobante al socio (mail y aviso en la app)?', 'Reenviar', function () {
        api('adminReenviarRecibo', token, t.dataset.reenviar).then(function (r) {
          toast(r.mail || r.push ? 'Comprobante reenviado' + (r.mail ? ' por mail' : '') + (r.push ? (r.mail ? ' y' : '') + ' a la app' : '') : 'No tiene mail ni la app con avisos: mostráselo desde "comprobante"');
        }).catch(function (x) { toast(msg(x)); });
      });
    }
  });

  /* ================= Padrón ================= */
  var cPad = tarjeta('tsPad', '🗳️ Padrón de socios habilitados');
  var PD = null, vistaPad = 'si';
  function formPadron(c) {
    return '<div class="muted">Listado de socios en condiciones de votar (art. 33 del Estatuto: tiene que estar listo 30 días antes de la asamblea; quien regularice su deuda hasta 24 h antes se agrega).</div>' +
      '<div class="ts-grid2"><div><label>Situación al día</label><input id="tsPFecha" type="date" value="' + hoyIso() + '"></div>' +
      '<div><label>Edad mínima</label><input id="tsPEdad" type="number" min="0" max="99" value="' + c.edad + '"></div></div>' +
      '<div class="ts-grid2"><div><label>Cuotas vencidas que puede deber</label><input id="tsPVenc" type="number" min="0" max="24" value="' + c.maxVencidas + '"></div>' +
      '<div><label>Antigüedad mínima para votar (meses)</label><input id="tsPAnt" type="number" min="0" max="120" value="' + c.antiguedad + '"></div></div>' +
      '<div class="ts-grid2"><div><label>Antigüedad para ser candidato (meses)</label><input id="tsPCand" type="number" min="0" max="120" value="' + c.antigCandidato + '"></div><div></div></div>' +
      '<label class="ts-sw"><input type="checkbox" id="tsPSusp"' + (c.sinSancion ? ' checked' : '') + '> Excluir a los suspendidos (cumpliendo sanción)</label>' +
      '<button class="btn" id="tsPVer" type="button">Ver padrón</button><div class="error" id="tsPErr"></div><div id="tsPRes"></div>';
  }
  function pintarPadronRes() {
    var r = PD, lista = r.lista.filter(function (x) { return vistaPad === 'si' ? x.habilitado : !x.habilitado; });
    $id('tsPRes').innerHTML =
      '<div class="ts-res"><div><small>Habilitados</small><b>' + r.habilitados + '</b> de ' + r.total + '</div><div><small>Quórum 1ª convocatoria</small><b>' + r.quorum1 + '</b> (51 %)</div>' +
      '<div><small>Quórum 2ª convocatoria</small><b>' + r.quorum2 + '</b>' + (r.total < 100 ? ' (CD + CRC + 1)' : ' (20 %)') + '</div></div>' +
      '<div class="ts-tabs"><button type="button" class="btn ' + (vistaPad === 'si' ? '' : 'sec') + '" data-pv="si">Habilitados (' + r.habilitados + ')</button>' +
      '<button type="button" class="btn ' + (vistaPad === 'no' ? '' : 'sec') + '" data-pv="no">No habilitados (' + (r.total - r.habilitados) + ')</button></div>' +
      (lista.length ? lista.map(function (x) {
        return '<div class="ts-it"><div><b>' + e(x.apellido + ', ' + x.nombre) + '</b> <span class="s">Nº ' + e(x.nro) + (x.dni ? ' · DNI ' + e(x.dni) : '') + '</span>' +
          (x.habilitado ? (x.candidato ? '<span class="ts-tag prox">puede ser candidato</span>' : '') : '<div class="s">' + e(x.motivos.join(' · ')) + '</div>') + '</div></div>';
      }).join('') : '<div class="muted">Nadie en esta lista.</div>') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sec" id="tsPImp" type="button">🖨️ Imprimir padrón (con firmas)</button>' +
      '<button class="btn sec" id="tsPImpNo" type="button">🖨️ No habilitados y motivo</button></div>' +
      (r.lista.some(function (x) { return x.revisar; }) ? '<div class="muted" style="margin-top:6px">Hay socios sin fecha de nacimiento: cargala en su ficha para confirmar si votan.</div>' : '');
  }
  function imprimirPadron(habilitados) {
    var r = PD, l = r.lista.filter(function (x) { return x.habilitado === habilitados; });
    var filas = l.map(function (x, i) {
      return '<tr><td class="n">' + (i + 1) + '</td><td>' + e(x.nro) + '</td><td>' + e(x.apellido + ', ' + x.nombre) + '</td><td>' + e(x.dni) + '</td>' +
        (habilitados ? '<td class="firma"></td>' : '<td>' + e(x.motivos.join(' · ')) + '</td>') + '</tr>';
    }).join('');
    var w = ventana('el padrón'); if (!w) return;
    escribir(w, paginaSimple('Padrón', r.club, '<h1>' + (habilitados ? 'Padrón de socios en condiciones de votar' : 'Socios no habilitados para votar') + '</h1>' +
      '<div class="muted">Situación al ' + e(r.fechaTxt) + ' · ' + l.length + ' socios' + (habilitados ? ' · Quórum: 1ª convocatoria ' + r.quorum1 + ', 2ª convocatoria ' + r.quorum2 : '') + '</div>' +
      '<table><tr><th>#</th><th>Nº socio</th><th>Apellido y nombre</th><th>DNI</th><th>' + (habilitados ? 'Firma' : 'Motivo') + '</th></tr>' + filas + '</table>'));
  }
  alAbrir(cPad, function () { api('adminPadron', token).then(function (r) { PD = null; cuerpo(cPad, formPadron(r.config)); }).catch(falla(cPad)); });
  cPad.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t.id === 'tsPVer') {
      var c = { edad: $id('tsPEdad').value, maxVencidas: $id('tsPVenc').value, antiguedad: $id('tsPAnt').value, sinSancion: $id('tsPSusp').checked, antigCandidato: $id('tsPCand').value };
      $id('tsPErr').textContent = ''; ocupado(t, true, 'Armando…');
      api('adminGuardarPadron', token, c).then(function () { return api('adminPadron', token, $id('tsPFecha').value); })
        .then(function (r) { PD = r; vistaPad = 'si'; pintarPadronRes(); })
        .catch(function (x) { $id('tsPErr').textContent = msg(x); }).then(function () { ocupado(t, false); });
    } else if (t.dataset && t.dataset.pv) { vistaPad = t.dataset.pv; pintarPadronRes(); }
    else if (t.id === 'tsPImp') imprimirPadron(true);
    else if (t.id === 'tsPImpNo') imprimirPadron(false);
  });

  /* ================= Morosidad ================= */
  var cMor = tarjeta('tsMor', '🚨 Morosidad');
  var MO = null;
  function pintarMor() {
    var c = MO.config, l = MO.lista;
    var prox = l.filter(function (x) { return x.proximo; });
    var cuenta = function (p) { return prox.filter(function (x) { return x.proximo === p; }).length; };
    cuerpo(cMor, '<div class="muted">Avisos escalonados según el art. 12 del Estatuto: con 3 cuotas impagas, intimación; si al mes sigue igual, la comisión lo evalúa. El sistema avisa y deja registro, pero <b>no da de baja a nadie</b>: eso lo decide la comisión.</div>' +
      '<label class="ts-sw" style="margin-top:10px"><input type="checkbox" id="tsMAct"' + (c.activo ? ' checked' : '') + '> <b>Mandar los avisos automáticamente</b> (una vez por día)</label>' +
      '<div class="ts-grid2"><label class="ts-sw"><input type="checkbox" id="tsMAv"' + (c.aviso ? ' checked' : '') + '> Aviso amable a las</label><div><input id="tsMAvN" type="number" min="1" max="24" value="' + c.mesesAviso + '"> <span class="muted">cuotas vencidas</span></div></div>' +
      '<div class="ts-grid2"><label class="ts-sw"><input type="checkbox" id="tsMIn"' + (c.intimacion ? ' checked' : '') + '> Intimación a las</label><div><input id="tsMInN" type="number" min="1" max="24" value="' + c.mesesIntimacion + '"> <span class="muted">cuotas vencidas</span></div></div>' +
      '<div class="ts-grid2"><label class="ts-sw"><input type="checkbox" id="tsMAl"' + (c.alerta ? ' checked' : '') + '> Avisar a la comisión</label><div><input id="tsMAlN" type="number" min="1" max="180" value="' + c.diasAlerta + '"> <span class="muted">días después de la intimación</span></div></div>' +
      '<details style="margin-top:8px"><summary style="cursor:pointer">Textos de los avisos</summary><div class="muted" style="margin-top:6px">Podés usar {nombre}, {cuotas}, {meses}, {deuda} y {club}.</div>' +
      '<label>Aviso amable</label><textarea id="tsMTA" rows="4">' + e(c.textoAviso) + '</textarea><label>Intimación</label><textarea id="tsMTI" rows="9">' + e(c.textoIntimacion) + '</textarea></details>' +
      '<button class="btn" id="tsMGuardar" type="button" style="margin-top:10px">Guardar</button><div class="error" id="tsMErr"></div>' +
      (prox.length ? '<div class="aviso" style="margin-top:10px">Pendientes de enviar: ' + [[1, 'aviso amable'], [2, 'intimación'], [3, 'aviso a la comisión']].filter(function (p) { return cuenta(p[0]); })
        .map(function (p) { return cuenta(p[0]) + ' ' + p[1] + (cuenta(p[0]) === 1 ? '' : (p[0] === 2 ? 'es' : 's')); }).join(', ') +
        '. ' + (c.activo ? 'Salen en la próxima revisión diaria.' : 'Revisá la lista antes de activar.') +
        ' <button class="mini" id="tsMYa" type="button">mandar ahora</button></div>' : '') +
      '<h3 style="margin:14px 0 4px">Socios con cuotas vencidas (' + l.length + ')</h3>' +
      (l.length ? l.map(function (x) {
        return '<div class="ts-it"><div><b>' + e(x.nombre) + '</b> <span class="s">Nº ' + e(x.nro) + '</span>' +
          (x.paso ? '<span class="ts-tag p' + x.paso + '">' + e(x.pasoTxt) + (x.fecha ? ' · ' + e(x.fecha) : '') + '</span>' : '') +
          (x.proximo ? '<span class="ts-tag prox">próximo: ' + e(x.proximoTxt) + '</span>' : '') +
          '<div class="s">' + x.cuotas + (x.cuotas === 1 ? ' cuota' : ' cuotas') + ': ' + e(x.meses) + '</div>' +
          '<div class="s"><button class="mini" data-mficha="' + e(x.nro) + '">ficha</button>' + (x.cuotas >= MO.config.mesesIntimacion ? ' · <button class="mini" data-mcarta="' + e(x.nro) + '">carta de intimación</button>' : '') + '</div></div>' +
          '<div class="m">' + e(x.deudaTxt) + '</div></div>';
      }).join('') : '<div class="muted">Nadie tiene cuotas vencidas. 🎉</div>') +
      (MO.log.length ? '<details style="margin-top:10px"><summary style="cursor:pointer">Últimos avisos</summary>' + MO.log.map(function (g) {
        return '<div class="ts-it"><div>' + e(g.socio) + '<div class="s">' + e(g.paso) + (g.canal ? ' · ' + e(g.canal) : '') + '</div></div><div class="s">' + e(g.fecha) + '</div></div>';
      }).join('') + '</details>' : ''));
  }
  function cargarMor() { return api('adminMorosidad', token).then(function (r) { MO = r; pintarMor(); }).catch(falla(cMor)); }
  alAbrir(cMor, cargarMor);
  cMor.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t.id === 'tsMGuardar') {
      var c = { activo: $id('tsMAct').checked, aviso: $id('tsMAv').checked, mesesAviso: $id('tsMAvN').value, intimacion: $id('tsMIn').checked, mesesIntimacion: $id('tsMInN').value,
                alerta: $id('tsMAl').checked, diasAlerta: $id('tsMAlN').value, textoAviso: $id('tsMTA').value, textoIntimacion: $id('tsMTI').value };
      $id('tsMErr').textContent = ''; ocupado(t, true, 'Guardando…');
      api('adminGuardarMorosidad', token, c).then(function () { toast('Guardado'); return cargarMor(); })
        .catch(function (x) { $id('tsMErr').textContent = msg(x); ocupado(t, false); });
    } else if (t.id === 'tsMYa') {
      if (!MO.config.activo) { toast('Primero activá "Mandar los avisos automáticamente" y guardá.'); return; }
      confirmar('¿Mandar ahora los avisos pendientes? Les llega por mail y a la app a cada socio de la lista.', 'Mandar', function () {
        api('adminRevisarMorosidad', token).then(function (r) {
          toast('Enviado: ' + r.avisos + ' avisos, ' + r.intimaciones + ' intimaciones' + (r.alertas ? ', ' + r.alertas + ' para la comisión' : ''));
          cargarMor();
        }).catch(function (x) { toast(msg(x)); });
      });
    } else if (t.dataset && t.dataset.mficha) { abrirFicha(t.dataset.mficha, 'mas'); }
    else if (t.dataset && t.dataset.mcarta) {
      var w = ventana('la carta'); if (!w) return;
      api('adminCartaIntimacion', token, t.dataset.mcarta).then(function (r) { escribir(w, r.html); }).catch(function (x) { w.close(); toast(msg(x)); });
    }
  });

  /* ================= Caja ================= */
  var cCaja = tarjeta('tsCaja', '💰 Caja de tesorería');
  var CJ = null, tipoMov = 'Egreso', catAbierto = false;
  function guardarCats(tipo, lista) {
    return api('adminCajaCategorias', token, tipo, lista).then(function (cats) { CJ.categorias = cats; catAbierto = true; pintarCaja(); })
      .catch(function (x) { toast(msg(x)); });
  }
  function pintarCaja() {
    var r = CJ, a = r.auto;
    var opts = (r.categorias[tipoMov] || []).map(function (k) { return '<option>' + e(k) + '</option>'; }).join('');
    cuerpo(cCaja, '<div class="fila2"><div><label>Mes</label><input id="tsCMes" type="month" value="' + e(r.periodo) + '"></div><div></div></div>' +
      '<div class="ts-res"><div><small>Ingresos</small><b class="ts-pos">' + pesos(r.ingresos) + '</b></div><div><small>Egresos</small><b class="ts-neg">' + pesos(r.egresos) + '</b></div>' +
      '<div><small>Saldo del mes</small><b class="' + (r.saldo < 0 ? 'ts-neg' : 'ts-pos') + '">' + pesos(r.saldo) + '</b></div></div>' +
      '<div class="ts-it"><div>Cuotas cobradas<div class="s">registradas en el sistema</div></div><div class="m">' + pesos(a.cuotas) + '</div></div>' +
      (a.multas ? '<div class="ts-it"><div>Multas cobradas</div><div class="m">' + pesos(a.multas) + '</div></div>' : '') +
      (a.eventos ? '<div class="ts-it"><div>Inscripciones a eventos</div><div class="m">' + pesos(a.eventos) + '</div></div>' : '') +
      (a.clases ? '<div class="ts-it"><div>Clases</div><div class="m">' + pesos(a.clases) + '</div></div>' : '') +
      r.porCategoria.map(function (x) { return '<div class="ts-it"><div>' + e(x.categoria) + '<div class="s">' + (x.tipo === 'Ingreso' ? 'otros ingresos' : 'gasto') + '</div></div><div class="m ' + (x.tipo === 'Egreso' ? 'ts-neg' : '') + '">' + (x.tipo === 'Egreso' ? '− ' : '') + pesos(x.monto) + '</div></div>'; }).join('') +
      '<h3 style="margin:14px 0 4px">Cargar un movimiento</h3>' +
      '<div class="ts-tabs"><button type="button" class="btn ' + (tipoMov === 'Egreso' ? '' : 'sec') + '" data-tm="Egreso">Gasto</button><button type="button" class="btn ' + (tipoMov === 'Ingreso' ? '' : 'sec') + '" data-tm="Ingreso">Otro ingreso</button></div>' +
      '<div class="ts-grid2"><div><label>Fecha</label><input id="tsCFecha" type="date" value="' + hoyIso() + '"></div><div><label>Monto</label><input id="tsCMonto" type="number" min="0" step="any"></div></div>' +
      '<div class="ts-grid2"><div><label>Categoría</label><input id="tsCCat" list="tsCCats" placeholder="Elegí o escribí"><datalist id="tsCCats">' + opts + '</datalist></div>' +
      '<div><label>Medio</label><select id="tsCMedio"><option></option>' + r.medios.map(function (m) { return '<option>' + e(m) + '</option>'; }).join('') + '</select></div></div>' +
      '<label>Concepto</label><input id="tsCConc" maxlength="120" placeholder="' + (tipoMov === 'Egreso' ? 'Ej.: Alquiler de noviembre' : 'Ej.: Donación de un socio') + '">' +
      '<button class="btn" id="tsCGuardar" type="button" style="margin-top:8px">Guardar</button><div class="error" id="tsCErr"></div>' +
      '<h3 style="margin:14px 0 4px">Movimientos de ' + e(r.legible) + '</h3>' +
      (r.movimientos.length ? r.movimientos.map(function (x) {
        return '<div class="ts-it"><div><b>' + e(x.concepto) + '</b><div class="s">' + e(x.fecha) + (x.categoria ? ' · ' + e(x.categoria) : '') + (x.medio ? ' · ' + e(x.medio) : '') + ' · ' + e(x.usuario) +
          ' · <button class="mini" data-cborrar="' + e(x.id) + '">borrar</button></div></div><div class="m ' + (x.tipo === 'Egreso' ? 'ts-neg' : 'ts-pos') + '">' + (x.tipo === 'Egreso' ? '− ' : '+ ') + pesos(x.monto) + '</div></div>';
      }).join('') : '<div class="muted">Todavía no hay gastos ni otros ingresos cargados este mes.</div>') +
      '<details id="tsCCatDet" style="margin-top:14px"' + (catAbierto ? ' open' : '') + '><summary style="cursor:pointer;font-weight:600">🏷️ Categorías de gastos e ingresos</summary>' +
      '<div class="muted" style="margin-top:6px">Las que aparecen para elegir al cargar un movimiento. Si escribís una nueva al cargar, también queda guardada. Borrar una no cambia los movimientos ya cargados.</div>' +
      [['Egreso', 'Gastos'], ['Ingreso', 'Otros ingresos']].map(function (t) {
        return '<h4 style="margin:10px 0 4px">' + t[1] + '</h4><div class="gchips">' + (r.categorias[t[0]] || []).map(function (k, i) {
          return '<span class="sel-chip">' + e(k) + ' <button type="button" data-cqt="' + t[0] + '" data-cqi="' + i + '" title="Borrar">✕</button></span>';
        }).join(' ') + '</div><div style="display:flex;gap:6px;margin-top:6px"><input id="tsCNueva' + t[0] + '" maxlength="60" placeholder="Nueva categoría (ej.: Celular)" style="flex:1">' +
          '<button class="btn sec" type="button" data-cqadd="' + t[0] + '" style="width:auto;margin:0">Agregar</button></div>';
      }).join('') + '</details>' +
      '<h3 style="margin:14px 0 4px">Últimos 12 meses</h3><table class="ts-tabla"><tr><th>Mes</th><th>Ingresos</th><th>Egresos</th><th>Saldo</th></tr>' +
      r.meses.slice().reverse().map(function (m) { return '<tr><td>' + e(m.legible) + '</td><td>' + pesos(m.ingresos) + '</td><td>' + pesos(m.egresos) + '</td><td class="' + (m.saldo < 0 ? 'ts-neg' : '') + '">' + pesos(m.saldo) + '</td></tr>'; }).join('') + '</table>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sec" id="tsCImp" type="button">🖨️ Imprimir balance del mes</button><button class="btn sec" id="tsCCsv" type="button">⬇️ Descargar planilla (CSV)</button></div>');
  }
  function cargarCaja(p) { return api('adminCaja', token, p || '').then(function (r) { CJ = r; pintarCaja(); }).catch(falla(cCaja)); }
  alAbrir(cCaja, function () { cargarCaja(CJ ? CJ.periodo : ''); });
  cCaja.addEventListener('change', function (ev) { if (ev.target.id === 'tsCMes' && ev.target.value) cargarCaja(ev.target.value); });
  cCaja.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t.dataset && t.dataset.tm) { tipoMov = t.dataset.tm; catAbierto = !!($id('tsCCatDet') && $id('tsCCatDet').open); pintarCaja(); return; }
    if (t.dataset && t.dataset.cqt) {
      var lt = (CJ.categorias[t.dataset.cqt] || []).slice(), nom = lt[Number(t.dataset.cqi)];
      confirmar('¿Borrar la categoría "' + e(nom) + '"? Los movimientos ya cargados no cambian.', 'Borrar', function () {
        lt.splice(Number(t.dataset.cqi), 1); guardarCats(t.dataset.cqt, lt);
      }, 'peligro');
      return;
    }
    if (t.dataset && t.dataset.cqadd) {
      var inp = $id('tsCNueva' + t.dataset.cqadd), v = inp.value.trim();
      if (!v) { inp.focus(); return; }
      var la = (CJ.categorias[t.dataset.cqadd] || []).slice();
      if (la.some(function (x) { return x.toLowerCase() === v.toLowerCase(); })) { toast('Esa categoría ya existe'); return; }
      la.push(v); guardarCats(t.dataset.cqadd, la).then(function () { toast('Categoría agregada'); });
      return;
    }
    if (t.id === 'tsCGuardar') {
      $id('tsCErr').textContent = ''; ocupado(t, true, 'Guardando…');
      api('adminCajaGuardar', token, { tipo: tipoMov, fecha: $id('tsCFecha').value, monto: $id('tsCMonto').value, categoria: $id('tsCCat').value, medio: $id('tsCMedio').value, concepto: $id('tsCConc').value })
        .then(function () { toast('Movimiento guardado'); return cargarCaja(CJ.periodo); })
        .catch(function (x) { $id('tsCErr').textContent = msg(x); ocupado(t, false); });
    } else if (t.dataset && t.dataset.cborrar) {
      confirmar('¿Borrar este movimiento de la caja?', 'Borrar', function () {
        api('adminCajaBorrar', token, t.dataset.cborrar).then(function () { toast('Borrado'); cargarCaja(CJ.periodo); }).catch(function (x) { toast(msg(x)); });
      }, 'peligro');
    } else if (t.id === 'tsCImp') {
      var r = CJ, a = r.auto;
      var fila = function (k, v, neg) { return '<tr><td>' + e(k) + '</td><td class="n">' + (neg ? '− ' : '') + pesos(v) + '</td></tr>'; };
      var ing = fila('Cuotas cobradas', a.cuotas) + (a.multas ? fila('Multas', a.multas) : '') + (a.eventos ? fila('Eventos', a.eventos) : '') + (a.clases ? fila('Clases', a.clases) : '') +
        r.porCategoria.filter(function (x) { return x.tipo === 'Ingreso'; }).map(function (x) { return fila(x.categoria, x.monto); }).join('');
      var egr = r.porCategoria.filter(function (x) { return x.tipo === 'Egreso'; }).map(function (x) { return fila(x.categoria, x.monto, true); }).join('');
      var det = r.movimientos.map(function (x) { return '<tr><td>' + e(x.fecha) + '</td><td>' + e(x.concepto) + '</td><td>' + e(x.categoria) + '</td><td>' + e(x.medio) + '</td><td class="n">' + (x.tipo === 'Egreso' ? '− ' : '') + pesos(x.monto) + '</td></tr>'; }).join('');
      var w = ventana('el balance'); if (!w) return;
      escribir(w, paginaSimple('Balance ' + r.legible, r.club, '<h1>Balance de tesorería — ' + e(r.legible) + '</h1>' +
        '<h3>Ingresos</h3><table>' + ing + '<tr><th>Total ingresos</th><th class="n">' + pesos(r.ingresos) + '</th></tr></table>' +
        '<h3>Egresos</h3><table>' + (egr || '<tr><td colspan="2" class="muted">Sin egresos cargados</td></tr>') + '<tr><th>Total egresos</th><th class="n">' + pesos(r.egresos) + '</th></tr></table>' +
        '<h3>Resultado del mes: ' + pesos(r.saldo) + '</h3>' + (det ? '<h3>Detalle de movimientos cargados</h3><table><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Medio</th><th>Monto</th></tr>' + det + '</table>' : '') +
        '<p class="muted">Generado desde la app de la comisión. Tesorero/a: ____________________ Presidente: ____________________</p>'));
    } else if (t.id === 'tsCCsv') {
      var q = function (v) { return '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"'; };
      var l = [['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Medio', 'Monto', 'Cargado por'].map(q).join(';')];
      l.push([q(CJ.legible), q('Ingreso'), q('Cuotas (sistema)'), q('Cuotas cobradas'), q(''), q(CJ.auto.cuotas), q('')].join(';'));
      if (CJ.auto.multas) l.push([q(CJ.legible), q('Ingreso'), q('Multas (sistema)'), q('Multas cobradas'), q(''), q(CJ.auto.multas), q('')].join(';'));
      if (CJ.auto.eventos) l.push([q(CJ.legible), q('Ingreso'), q('Eventos (sistema)'), q('Inscripciones'), q(''), q(CJ.auto.eventos), q('')].join(';'));
      if (CJ.auto.clases) l.push([q(CJ.legible), q('Ingreso'), q('Clases (sistema)'), q('Clases cobradas'), q(''), q(CJ.auto.clases), q('')].join(';'));
      CJ.movimientos.forEach(function (x) { l.push([q(x.fecha), q(x.tipo), q(x.categoria), q(x.concepto), q(x.medio), q(x.tipo === 'Egreso' ? -x.monto : x.monto), q(x.usuario)].join(';')); });
      var blob = new Blob(['﻿' + l.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      var aEl = document.createElement('a'); aEl.href = URL.createObjectURL(blob); aEl.download = 'caja-' + CJ.periodo + '.csv';
      document.body.appendChild(aEl); aEl.click(); setTimeout(function () { URL.revokeObjectURL(aEl.href); aEl.remove(); }, 1000);
    }
  });

  /* ================= Copias de seguridad ================= */
  var cCop = tarjeta('tsCop', '💾 Copias de seguridad');
  function pintarCop(r) {
    var c = r.config;
    cuerpo(cCop, '<div class="muted">Se guarda una copia de toda la planilla en tu Google Drive, en la carpeta "Socios CABB - Copias de seguridad" (es privada: solo la ve el dueño de la planilla). Si alguien borra algo sin querer, se recupera desde ahí.</div>' +
      '<label class="ts-sw" style="margin-top:8px"><input type="checkbox" id="tsBAct"' + (c.activo ? ' checked' : '') + '> Hacer copias automáticas</label>' +
      '<div class="ts-grid2"><div><label>Cada cuántos días</label><input id="tsBDias" type="number" min="1" max="60" value="' + c.dias + '"></div><div><label>Cuántas conservar</label><input id="tsBCons" type="number" min="1" max="52" value="' + c.conservar + '"></div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn" id="tsBGuardar" type="button">Guardar</button><button class="btn sec" id="tsBYa" type="button">Hacer una copia ahora</button></div>' +
      '<div class="error" id="tsBErr"></div>' +
      '<h3 style="margin:14px 0 4px">Últimas copias</h3>' + (r.lista.length ? r.lista.map(function (x) {
        return '<div class="ts-it"><div>' + e(x.nombre) + '<div class="s">' + e(x.fecha) + '</div></div><a class="mini" href="' + e(x.url) + '" target="_blank" rel="noopener">abrir</a></div>';
      }).join('') : '<div class="muted">Todavía no hay copias.</div>') +
      (r.carpeta ? '<p><a href="' + e(r.carpeta) + '" target="_blank" rel="noopener">Abrir la carpeta en Drive</a></p>' : ''));
  }
  function cargarCop() { return api('adminCopias', token).then(pintarCop).catch(falla(cCop)); }
  alAbrir(cCop, cargarCop);
  cCop.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t.id === 'tsBGuardar') {
      ocupado(t, true, 'Guardando…');
      api('adminGuardarCopias', token, { activo: $id('tsBAct').checked, dias: $id('tsBDias').value, conservar: $id('tsBCons').value })
        .then(function () { toast('Guardado'); return cargarCop(); }).catch(function (x) { $id('tsBErr').textContent = msg(x); ocupado(t, false); });
    } else if (t.id === 'tsBYa') {
      ocupado(t, true, 'Copiando…');
      api('adminCopiaAhora', token).then(function (r) { toast('Copia hecha: ' + r.nombre); return cargarCop(); })
        .catch(function (x) { $id('tsBErr').textContent = msg(x); ocupado(t, false); });
    }
  });
})();
