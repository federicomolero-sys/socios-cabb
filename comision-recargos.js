/* Comisión CABB — Vencimiento de la cuota y recargos por pago fuera de término.
 * En "Más": día de vencimiento y tramos (desde tal día, recargo en % o $ fijo).
 * En la ficha de cada socio: detalle del recargo, condonar (recargo, una parte o toda la deuda)
 * y la opción de no cobrarle recargos a ese socio.
 */
(function () {
  function e(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function pesos(n) { return '$ ' + Math.round(Number(n) || 0).toLocaleString('es-AR'); }
  function txtT(t) { return t.tipo === '$' ? pesos(t.valor) : String(t.valor).replace('.', ',') + ' %'; }

  var css = document.createElement('style');
  css.textContent =
    '.rc-tr{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:6px;align-items:end;margin-top:8px}' +
    '.rc-tr label{margin-top:0}.rc-tr button{height:42px;border:0;background:none;font-size:18px;color:var(--gris);cursor:pointer}' +
    '.rc-sw{display:flex;gap:10px;align-items:center;margin:4px 0 6px}.rc-sw input{width:auto;transform:scale(1.25)}' +
    '.rc-prev{background:var(--crema);border-radius:10px;padding:10px 12px;margin-top:12px;font-size:13.5px;line-height:1.55}' +
    '.rc-det{color:#9a5b00}.rc-ok{color:var(--verde)}' +
    '.rc-op{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid var(--linea);cursor:pointer}' +
    '.rc-op:first-of-type{border-top:0}.rc-op input{width:auto;margin-top:3px}.rc-op small{display:block;color:var(--gris)}';
  document.head.appendChild(css);

  /* ================= Más: configuración ================= */
  var card = document.createElement('div');
  card.className = 'card'; card.id = 'rcCard';
  card.innerHTML = '<details id="rcDet"><summary style="font-weight:600;cursor:pointer">⏰ Vencimiento, recargos y altas</summary><div id="rcCuerpo" style="margin-top:10px"><div class="muted">Cargando…</div></div></details>';
  var mas = document.getElementById('vMas');
  var ref = document.getElementById('ctCard') || document.getElementById('dcCard');
  if (mas) { if (ref && ref.parentNode === mas) mas.insertBefore(card, ref); else mas.appendChild(card); }

  var R = null;

  function leerForm() {
    var tramos = [];
    card.querySelectorAll('.rc-tr').forEach(function (f) {
      tramos.push({ desde: Number(f.querySelector('.rcDesde').value) || 0, valor: Number(String(f.querySelector('.rcValor').value).replace(',', '.')) || 0, tipo: f.querySelector('.rcTipo').value });
    });
    var v = function (id) { return document.getElementById(id); };
    return { activo: v('rcActivo').checked, dia: Number(v('rcDia').value) || 0, desde: v('rcDesde').value, tramos: tramos,
             mensual: { activo: v('rcMActivo').checked, valor: Number(String(v('rcMValor').value).replace(',', '.')) || 0, tipo: v('rcMTipo').value },
             alta: { activo: v('rcAActivo').checked, diaMedia: Number(v('rcADia').value) || 0, pct: Number(v('rcAPct').value) || 0, diaSiguiente: Number(v('rcASig').value) || 0 } };
  }

  function filaTramo(t) {
    return '<div class="rc-tr"><div><label>Desde el día</label><input class="rcDesde" type="number" min="2" max="31" value="' + (t.desde || '') + '"></div>' +
      '<div><label>Recargo</label><input class="rcValor" type="number" min="0" step="any" value="' + (t.valor || '') + '"></div>' +
      '<div><label>Tipo</label><select class="rcTipo"><option value="%"' + (t.tipo !== '$' ? ' selected' : '') + '>%</option><option value="$"' + (t.tipo === '$' ? ' selected' : '') + '>$ fijo</option></select></div>' +
      '<button type="button" class="rcQuitar" title="Quitar tramo">✕</button></div>';
  }

  function pintar() {
    var tramos = R.tramos.length ? R.tramos : [{ desde: 11, tipo: '%', valor: 10 }, { desde: 21, tipo: '%', valor: 15 }];
    var M = R.mensual || { activo: false, tipo: '%', valor: 5 }, A = R.alta || { activo: false, diaMedia: 15, pct: 50, diaSiguiente: 29 };
    document.getElementById('rcCuerpo').innerHTML =
      '<div class="muted">La cuota vale lo normal hasta el día de vencimiento. Después, cada tramo le suma un recargo, que se actualiza solo en la planilla y en la app del socio. Las cuotas de meses anteriores llevan el recargo del último tramo.</div>' +
      '<label class="rc-sw" style="margin-top:12px"><input type="checkbox" id="rcActivo"' + (R.activo ? ' checked' : '') + '> <b>Cobrar recargos</b></label>' +
      '<div class="fila2"><div><label>La cuota vence el día</label><input id="rcDia" type="number" min="1" max="28" value="' + R.dia + '"></div>' +
      '<div><label>Aplicar a cuotas desde</label><input id="rcDesde" type="month" value="' + e(R.desde) + '"></div></div>' +
      '<div class="muted" style="margin-top:4px">Las cuotas de meses anteriores a "Aplicar desde" no llevan recargo (así no se le suma a deudas viejas, salvo que lo elijas).</div>' +
      '<h3 style="margin:14px 0 0">Tramos</h3><div id="rcTramos">' + tramos.map(filaTramo).join('') + '</div>' +
      '<button class="btn sec" id="rcMas" type="button" style="margin-top:10px">+ Agregar tramo</button>' +
      '<label class="rc-sw" style="margin-top:14px"><input type="checkbox" id="rcMActivo"' + (M.activo ? ' checked' : '') + '> <b>Sumar recargo por cada mes de atraso</b></label>' +
      '<div class="muted">Para deudas de varios meses: además del último tramo, suma esto por cada mes adicional que pasa sin pagar.</div>' +
      '<div class="fila2" style="margin-top:6px"><div><label>Recargo por mes</label><input id="rcMValor" type="number" min="0" step="any" value="' + (M.valor || 5) + '"></div>' +
      '<div><label>Tipo</label><select id="rcMTipo"><option value="%"' + (M.tipo !== '$' ? ' selected' : '') + '>%</option><option value="$"' + (M.tipo === '$' ? ' selected' : '') + '>$ fijo</option></select></div></div>' +
      '<div class="rc-prev" id="rcPrev"></div>' +
      '<h3 style="margin:18px 0 0">🆕 Cuota del mes de alta</h3>' +
      '<div class="muted">Al dar de alta a alguien se genera sola la cuota de ese mes, según el día en que se asocia. Si se asocia pasado el vencimiento, tiene 10 días para pagarla y ese mes no lleva recargo.</div>' +
      '<label class="rc-sw" style="margin-top:8px"><input type="checkbox" id="rcAActivo"' + (A.activo ? ' checked' : '') + '> <b>Usar esta regla</b></label>' +
      '<div class="fila2"><div><label>Desde el día</label><input id="rcADia" type="number" min="2" max="31" value="' + (A.diaMedia || '') + '"></div>' +
      '<div><label>Paga este % de la cuota</label><input id="rcAPct" type="number" min="1" max="99" value="' + (A.pct || '') + '"></div></div>' +
      '<label>Desde el día (empieza a pagar el mes siguiente)</label><input id="rcASig" type="number" min="2" max="31" value="' + (A.diaSiguiente || '') + '">' +
      '<div class="rc-prev" id="rcAPrev"></div>' +
      '<button class="btn" id="rcGuardar" type="button" style="margin-top:12px">Guardar</button><div class="error" id="rcErr"></div>';
    previa();
  }

  function previa() {
    var p = document.getElementById('rcPrev'); if (!p) return;
    var d = leerForm(), base = R.cuotaBase || 10000;
    var tr = d.tramos.filter(function (t) { return t.desde > 0 && t.valor > 0; }).sort(function (a, b) { return a.desde - b.desde; });
    var con = function (t) { return base + (t.tipo === '$' ? Math.round(t.valor) : Math.round(base * t.valor / 100)); };
    var h = '<b>Ejemplo con una cuota de ' + pesos(base) + ':</b><br>Del 1 al ' + (d.dia || '?') + ': <b>' + pesos(base) + '</b>';
    if (tr.length && tr[0].desde > d.dia + 1) h += '<br>Del ' + (d.dia + 1) + ' al ' + (tr[0].desde - 1) + ': ' + pesos(base) + ' (vencida, sin recargo todavía)';
    tr.forEach(function (t, i) {
      var sig = tr[i + 1];
      h += '<br>' + (sig ? 'Del ' + t.desde + ' al ' + (sig.desde - 1) : 'Desde el ' + t.desde) + ': <b>' + pesos(con(t)) + '</b> <span class="muted">(+' + txtT(t) + ')</span>';
    });
    if (tr.length) {
      var ult = con(tr[tr.length - 1]);
      var porMes = d.mensual.activo && d.mensual.valor > 0 ? (d.mensual.tipo === '$' ? Math.round(d.mensual.valor) : Math.round(base * d.mensual.valor / 100)) : 0;
      h += '<br>' + (porMes ? 'Cuotas de meses anteriores (1 mes de atraso)' : 'Meses anteriores') + ': <b>' + pesos(ult) + '</b>';
      if (porMes) h += '<br>2 meses de atraso: <b>' + pesos(ult + porMes) + '</b> · 3 meses: <b>' + pesos(ult + 2 * porMes) + '</b> <span class="muted">(+' + txtT(d.mensual) + ' por mes)</span>';
    }
    if (!d.activo) h += '<br><span class="muted">Los recargos están apagados: hoy no se cobra ninguno.</span>';
    p.innerHTML = h;
    var pa = document.getElementById('rcAPrev'), a = d.alta;
    if (pa) {
      var t = [], ini = 1;
      if (a.diaMedia) { t.push('Se asocia del ' + ini + ' al ' + (a.diaMedia - 1) + ': cuota completa (' + pesos(base) + ')'); ini = a.diaMedia; }
      if (a.diaMedia && a.pct) t.push('Del ' + a.diaMedia + (a.diaSiguiente ? ' al ' + (a.diaSiguiente - 1) : ' a fin de mes') + ': ' + a.pct + ' % (' + pesos(Math.round(base * a.pct / 100)) + ')');
      if (a.diaSiguiente) t.push((a.diaMedia ? 'Desde el ' : 'Del 1 al ' + (a.diaSiguiente - 1) + ': cuota completa · desde el ') + a.diaSiguiente + ': no paga ese mes, arranca el siguiente');
      pa.innerHTML = '<b>Ejemplo:</b><br>' + t.join('<br>') + (a.activo ? '' : '<br><span class="muted">Apagada: al dar de alta no se genera ninguna cuota (como hasta ahora).</span>');
    }
  }

  function cargar() {
    return api('adminRecargos', token).then(function (r) { R = r; pintar(); })
      .catch(function (x) { document.getElementById('rcCuerpo').innerHTML = '<div class="error">' + e(msg(x)) + '</div>'; });
  }
  document.getElementById('rcDet').addEventListener('toggle', function () { if (this.open) cargar(); });
  card.addEventListener('input', previa);
  card.addEventListener('change', previa);
  card.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t.id === 'rcMas') {
      var filas = card.querySelectorAll('.rc-tr');
      if (filas.length >= 6) { toast('Como máximo 6 tramos.'); return; }
      var ult = filas.length ? Number(filas[filas.length - 1].querySelector('.rcDesde').value) || 0 : Number(document.getElementById('rcDia').value) || 10;
      document.getElementById('rcTramos').insertAdjacentHTML('beforeend', filaTramo({ desde: Math.min(ult + 10, 31), tipo: '%', valor: '' }));
      previa(); return;
    }
    if (t.classList.contains('rcQuitar')) { t.closest('.rc-tr').remove(); previa(); return; }
    if (t.id === 'rcGuardar') {
      var err = document.getElementById('rcErr'); err.className = 'error'; err.textContent = '';
      var d = leerForm();
      d.tramos = d.tramos.filter(function (x) { return x.desde || x.valor; });
      ocupado(t, true, 'Guardando…');
      api('adminGuardarRecargos', token, d).then(function (r) {
        toast('Guardado' + (r.actualizadas ? ' · ' + r.actualizadas + ' cuota' + (r.actualizadas === 1 ? '' : 's') + ' actualizada' + (r.actualizadas === 1 ? '' : 's') : ''));
        socios = [];
        return cargar();
      }).catch(function (x) { err.textContent = msg(x); ocupado(t, false); });
    }
  });

  /* ================= Ficha del socio ================= */
  var cSoc = document.createElement('div');
  cSoc.className = 'card oculto'; cSoc.id = 'rcFicha';
  var hist = document.getElementById('fHistorial');
  var cardHist = hist && hist.closest('.card');
  if (cardHist) cardHist.parentNode.insertBefore(cSoc, cardHist.nextSibling);

  var nota = document.createElement('div');
  nota.className = 'muted oculto'; nota.id = 'rcNotaPago'; nota.style.marginTop = '4px';
  nota.textContent = 'El recargo se calcula con la fecha del pago: si pagó antes y lo registrás hoy, poné la fecha real.';
  var fTot = document.getElementById('fTotal');
  if (fTot) fTot.parentNode.insertBefore(nota, fTot.nextSibling);

  var F = null;

  function detalle(x) {
    var p = [];
    if (x.recargo > 0) p.push('<span class="rc-det">incluye ' + e(x.detalleRecargo.replace(/^Recargo/, 'recargo')) + ': ' + e(x.recargoTxt) + '</span>');
    else if (x.recargoCondonado && x.detalleRecargo) p.push('<span class="rc-ok">recargo condonado</span>');
    else if (x.estado === 'Pendiente' && /exento/.test(x.detalleRecargo)) p.push('<span class="rc-ok">sin recargo (exento)</span>');
    if (x.condonadoTxt) p.push('<span class="rc-ok">condonados ' + e(x.condonadoTxt) + '</span>');
    return p.join(' · ');
  }

  function decorar(f) {
    F = f;
    nota.classList.toggle('oculto', !f.recargosActivos);
    // Pendientes (para cobrar)
    document.querySelectorAll('#fPendientes .chkCuota').forEach(function (chk) {
      var x = f.cuotas.filter(function (c) { return c.id === chk.value; })[0];
      var det = x && detalle(x); if (!det) return;
      var d = chk.parentNode.querySelector('.det'); if (d) d.insertAdjacentHTML('beforeend', '<br>' + det);
    });
    // Historial
    var filas = document.querySelectorAll('#fHistorial > .cuota');
    f.cuotas.forEach(function (x, i) {
      var fila = filas[i]; if (!fila) return;
      var d = fila.querySelector('.det'), det = detalle(x);
      if (x.estado === 'Pendiente') {
        var an = fila.querySelector('[data-anular]');
        var b = '<button class="mini" data-condonar="' + e(x.id) + '">condonar</button> · ';
        if (an) an.insertAdjacentHTML('beforebegin', b); else if (d) d.insertAdjacentHTML('beforeend', ' · ' + b);
      }
      if (det && d) d.insertAdjacentHTML('beforeend', (d.textContent ? '<br>' : '') + det);
    });
    // Tarjeta de recargos del socio
    var conRecargo = f.cuotas.filter(function (x) { return x.estado === 'Pendiente' && x.recargo > 0; });
    if (!f.recargosActivos && !f.sinRecargo) { cSoc.classList.add('oculto'); return; }
    cSoc.innerHTML = '<h3>💸 Recargos de este socio</h3>' +
      '<label class="rc-sw"><input type="checkbox" id="rcSin"' + (f.sinRecargo ? ' checked' : '') + '> No cobrarle recargos (paga siempre la cuota normal)</label>' +
      (conRecargo.length ? '<button class="btn sec" id="rcCondTodos" type="button">Condonar todos sus recargos (' + pesos(conRecargo.reduce(function (t, x) { return t + x.recargo; }, 0)) + ')</button>' : '') +
      '<div class="muted" style="margin-top:6px">Para condonar una cuota puntual (el recargo, una parte o toda la deuda) usá "condonar" en el historial.</div>' +
      '<div class="error" id="rcSErr" style="min-height:0"></div>';
    cSoc.classList.remove('oculto');
  }

  var pintarPrev = window.pintarFicha;
  window.pintarFicha = function (f) {
    var r = pintarPrev.apply(this, arguments);
    try { if (f && f.cuotas) decorar(f); } catch (x) { console.warn(x); }
    return r;
  };

  function recargarFicha(txt) { toast(txt); socios = []; abrirFicha(F.nro, vistaAnterior); }

  cSoc.addEventListener('change', function (ev) {
    var chk = ev.target; if (chk.id !== 'rcSin' || !F) return;
    chk.disabled = true;
    api('adminSinRecargo', token, F.nro, chk.checked)
      .then(function () { recargarFicha(chk.checked ? 'Listo: a este socio no se le cobran recargos' : 'Listo: vuelve a tener recargos'); })
      .catch(function (x) { chk.checked = !chk.checked; chk.disabled = false; document.getElementById('rcSErr').textContent = msg(x); });
  });
  cSoc.addEventListener('click', function (ev) {
    if (ev.target.id !== 'rcCondTodos' || !F) return;
    confirmar('¿Condonar todos los recargos de las cuotas pendientes de <b>' + e(F.nombre + ' ' + F.apellido) + '</b>? Va a pagar solo la cuota.', 'Condonar', function () {
      api('adminCondonar', token, F.nro, '', { tipo: 'recargo' })
        .then(function (r) { recargarFicha('Recargos condonados: ' + r.totalTxt); })
        .catch(function (x) { toast(msg(x)); });
    }, 'verde');
  });

  document.getElementById('fHistorial').addEventListener('click', function (ev) {
    var id = ev.target.dataset && ev.target.dataset.condonar; if (!id || !F) return;
    ev.stopPropagation();
    var x = F.cuotas.filter(function (c) { return c.id === id; })[0]; if (!x) return;
    var base = x.monto - (x.recargo || 0);
    var ops = '';
    if (x.recargo > 0) ops += '<label class="rc-op"><input type="radio" name="rcTipo" value="recargo" checked><span><b>Solo el recargo</b> (' + e(x.recargoTxt) + ')<small>Paga la cuota sin recargo: ' + pesos(base) + '</small></span></label>';
    if (x.recargoCondonado) ops += '<label class="rc-op"><input type="radio" name="rcTipo" value="cobrarRecargo"' + (x.recargo > 0 ? '' : ' checked') + '><span><b>Volver a cobrarle el recargo</b><small>Deshace la condonación del recargo</small></span></label>';
    ops += '<label class="rc-op"><input type="radio" name="rcTipo" value="parte"' + (x.recargo > 0 || x.recargoCondonado ? '' : ' checked') + '><span><b>Una parte de la cuota</b><small>Le perdonás un porcentaje o un monto</small>' +
      '<span style="display:flex;gap:8px;margin-top:6px"><input id="rcPValor" type="number" min="0" step="any" placeholder="Cuánto" style="flex:1"><select id="rcPModo" style="width:96px;flex:none"><option value="%">%</option><option value="$">$</option></select></span></span></label>';
    ops += '<label class="rc-op"><input type="radio" name="rcTipo" value="todo"><span><b>Toda la deuda de esta cuota</b> (' + e(x.montoTxt) + ')<small>Deja de figurar como deuda</small></span></label>';
    modal('<h3 style="margin-top:0">Condonar · ' + e(x.legible) + '</h3><div>' + ops + '</div>' +
      '<label>Motivo (opcional)</label><input id="rcMotivo" maxlength="120" placeholder="Ej.: acuerdo con la comisión">',
      [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Condonar', clase: 'verde', fn: function () {
        var sel = document.querySelector('input[name=rcTipo]:checked');
        var o = { tipo: sel ? sel.value : '', motivo: document.getElementById('rcMotivo').value };
        if (o.tipo === 'parte') { o.valor = document.getElementById('rcPValor').value; o.modo = document.getElementById('rcPModo').value; }
        api('adminCondonar', token, F.nro, id, o)
          .then(function (r) { recargarFicha(o.tipo === 'cobrarRecargo' ? 'Se vuelve a cobrar el recargo' : 'Condonado: ' + r.totalTxt); })
          .catch(function (er) { toast(msg(er)); });
      } }]);
    var pv = document.getElementById('rcPValor');
    if (pv) pv.addEventListener('focus', function () { var r = document.querySelector('input[name=rcTipo][value=parte]'); if (r) r.checked = true; });
  }, true);
})();
