/* Comisión CABB — Reglas del Estatuto.
 * En "Más": licencias (art. 10 c), paso de cadetes a activos (art. 8), socios vitalicios (art. 6)
 * y cuota de ingreso (art. 7 c).
 * En la ficha: dar o terminar una licencia, reincorporar a un socio dado de baja (art. 12) y pasarlo a vitalicio.
 * En el alta: cobrar o no la cuota de ingreso, con un monto especial si hace falta.
 */
(function () {
  function e(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function pesos(n) { return '$ ' + Math.round(Number(n) || 0).toLocaleString('es-AR'); }
  function $id(id) { return document.getElementById(id); }
  function hoyIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function mesIso(mas) { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + (mas || 0)); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); }

  var css = document.createElement('style');
  css.textContent =
    '.es-sw{display:flex;gap:10px;align-items:center;margin:6px 0}.es-sw input{width:auto;transform:scale(1.2)}' +
    '.es-it{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--linea);font-size:14px}' +
    '.es-it .s{color:var(--gris);font-size:12.5px}.es-g2{display:grid;grid-template-columns:1fr 1fr;gap:6px}.es-g2 label{margin-top:6px}' +
    '.es-sec{margin-top:14px;padding-top:10px;border-top:2px solid var(--linea)}.es-sec h3{margin:0 0 4px}' +
    '.es-box{background:var(--crema);border-radius:10px;padding:10px 12px;margin-top:8px;font-size:13.5px;line-height:1.5}' +
    '.es-acc{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.es-acc .btn{width:auto;margin:0}' +
    '.es-op{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid var(--linea);cursor:pointer}' +
    '.es-op:first-of-type{border-top:0}.es-op input{width:auto;margin-top:3px}.es-op small{display:block;color:var(--gris)}';
  document.head.appendChild(css);

  var mas = $id('vMas');
  function tarjeta(id, titulo, antesDe) {
    var c = document.createElement('div');
    c.className = 'card'; c.id = id;
    c.innerHTML = '<details><summary style="font-weight:600;cursor:pointer">' + titulo + '</summary><div class="es-cuerpo" style="margin-top:10px"><div class="muted">Cargando…</div></div></details>';
    var ref = antesDe && $id(antesDe);
    if (mas) { if (ref && ref.parentNode === mas) mas.insertBefore(c, ref); else mas.appendChild(c); }
    return c;
  }
  function alAbrir(card, fn) { card.querySelector('details').addEventListener('toggle', function () { if (this.open) fn(); }); }
  function cuerpo(card, html) { card.querySelector('.es-cuerpo').innerHTML = html; }
  function falla(card) { return function (x) { cuerpo(card, '<div class="error">' + e(msg(x)) + '</div>'); }; }
  function opcionesCat(lista, sel) { return lista.map(function (c) { return '<option' + (c === sel ? ' selected' : '') + '>' + e(c) + '</option>'; }).join(''); }

  /* ================= Más: Estatuto ================= */
  var cEst = tarjeta('esCard', '📜 Estatuto: licencias, cadetes y vitalicios');
  function pintarEst(L, C, V) {
    var cats = C.categorias;
    cuerpo(cEst,
      '<h3 style="margin:0 0 4px">🧳 Licencias <small class="muted">(art. 10 c)</small></h3>' +
      '<div class="muted">Hasta 6 meses por causa justificada, sin pagar cuota. Se dan desde la ficha de cada socio (botón "Dar licencia"). Al terminar, el socio vuelve solo a activo y se le avisa en la app.</div>' +
      (L.length ? L.map(function (x) {
        return '<div class="es-it"><div><b>' + e(x.nombre) + '</b><div class="s">' + e(x.desde) + ' a ' + e(x.hasta) + (x.motivo ? ' · ' + e(x.motivo) : '') + '</div></div>' +
          '<div><button class="mini" data-esficha="' + e(x.nro) + '">ver ficha</button></div></div>';
      }).join('') : '<div class="muted" style="margin-top:6px">Nadie está de licencia ahora.</div>') +

      '<div class="es-sec"><h3>🎓 Cadetes que cumplen años <small class="muted">(art. 8)</small></h3>' +
      '<div class="muted">Cuando un socio de la categoría de menores cumple la edad, pasa a la categoría de activos: se le avisa en la app y le llega un mail a la comisión. Las cuotas ya generadas de meses que vienen se actualizan al valor nuevo.</div>' +
      '<label class="es-sw"><input type="checkbox" id="esCAct"' + (C.config.activo ? ' checked' : '') + '> <b>Hacerlo automáticamente</b></label>' +
      '<div class="es-g2"><div><label>De la categoría</label><select id="esCDe">' + opcionesCat(cats, C.config.de) + '</select></div>' +
      '<div><label>Pasa a</label><select id="esCA">' + opcionesCat(cats, C.config.a) + '</select></div></div>' +
      '<div class="es-g2"><div><label>Al cumplir (años)</label><input id="esCEdad" type="number" min="1" max="99" value="' + e(C.config.edad) + '"></div><div></div></div>' +
      '<div class="es-acc"><button class="btn" id="esCGuardar" type="button">Guardar</button><button class="btn sec" id="esCPasar" type="button">Pasar ahora a los que ya cumplieron</button></div>' +
      '<div class="error" id="esCErr" style="min-height:0"></div>' +
      (C.lista.length ? '<div class="muted" style="margin-top:8px">Próximos (90 días):</div>' + C.lista.map(function (x) {
        return '<div class="es-it"><div>' + e(x.nombre) + '<div class="s">cumple ' + e(C.config.edad) + ' el ' + e(x.fecha) + '</div></div><div class="s">' + (x.dias <= 0 ? '<b>ya cumplió</b>' : 'en ' + x.dias + ' días') + '</div></div>';
      }).join('') : '<div class="muted" style="margin-top:8px">Ningún socio de ' + e(C.config.de) + ' cumple ' + e(C.config.edad) + ' en los próximos 90 días.</div>') + '</div>' +

      '<div class="es-sec"><h3>🏆 Socios vitalicios <small class="muted">(art. 6)</small></h3>' +
      '<div class="muted">Con la antigüedad que fija el Estatuto quedan eximidos de la cuota. El sistema los pasa a una categoría con 100 % de descuento (si no existe, la crea). Ahora hay ' + V.actuales + ' vitalicio' + (V.actuales === 1 ? '' : 's') + '.</div>' +
      '<label class="es-sw"><input type="checkbox" id="esVAuto"' + (V.config.auto ? ' checked' : '') + '> <b>Pasarlos automáticamente</b> (si no, te los muestra acá y los pasás vos)</label>' +
      '<div class="es-g2"><div><label>Años de antigüedad</label><input id="esVAnios" type="number" min="1" max="80" value="' + e(V.config.anios) + '"></div>' +
      '<div><label>Categoría</label><input id="esVCat" maxlength="40" value="' + e(V.config.categoria) + '"></div></div>' +
      '<div class="es-acc"><button class="btn" id="esVGuardar" type="button">Guardar</button></div><div class="error" id="esVErr" style="min-height:0"></div>' +
      (V.candidatos.length ? '<div class="muted" style="margin-top:8px">Ya cumplen la antigüedad:</div>' + V.candidatos.map(function (x) {
        return '<div class="es-it"><div><b>' + e(x.nombre) + '</b><div class="s">' + x.anios + ' años · alta ' + e(x.alta) + '</div></div><div><button class="mini" data-esvit="' + e(x.nro) + '" data-esnom="' + e(x.nombre) + '">pasar a vitalicio</button></div></div>';
      }).join('') : '<div class="muted" style="margin-top:8px">Nadie cumple todavía la antigüedad (se cuenta desde la fecha de alta de la planilla).</div>') +
      (V.proximos.length ? '<div class="muted" style="margin-top:8px">Cumplen en el próximo año: ' + V.proximos.map(function (x) { return e(x.nombre) + ' (' + e(x.fecha) + ')'; }).join(', ') + '</div>' : '') + '</div>');
  }
  function cargarEst() {
    return Promise.all([api('adminLicencias', token), api('adminCadetes', token), api('adminVitalicios', token)])
      .then(function (r) { pintarEst(r[0], r[1], r[2]); }).catch(falla(cEst));
  }
  alAbrir(cEst, cargarEst);
  cEst.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t.dataset && t.dataset.esficha) { abrirFicha(t.dataset.esficha, 'mas'); return; }
    if (t.id === 'esCGuardar') {
      $id('esCErr').textContent = ''; ocupado(t, true, 'Guardando…');
      api('adminGuardarCadetes', token, { activo: $id('esCAct').checked, de: $id('esCDe').value, a: $id('esCA').value, edad: $id('esCEdad').value })
        .then(function () { toast('Guardado'); return cargarEst(); }).catch(function (x) { $id('esCErr').textContent = msg(x); ocupado(t, false); });
    } else if (t.id === 'esCPasar') {
      confirmar('¿Pasar ahora de categoría a los socios que ya cumplieron la edad? Se les avisa en la app.', 'Pasar', function () {
        api('adminPasarCadetes', token).then(function (n) { toast(n ? 'Pasaron ' + n + ' socio' + (n === 1 ? '' : 's') : 'No había nadie para pasar'); socios = []; cargarEst(); }).catch(function (x) { toast(msg(x)); });
      }, 'verde');
    } else if (t.id === 'esVGuardar') {
      $id('esVErr').textContent = ''; ocupado(t, true, 'Guardando…');
      api('adminGuardarVitalicios', token, { auto: $id('esVAuto').checked, anios: $id('esVAnios').value, categoria: $id('esVCat').value })
        .then(function () { toast('Guardado'); return cargarEst(); }).catch(function (x) { $id('esVErr').textContent = msg(x); ocupado(t, false); });
    } else if (t.dataset && t.dataset.esvit) {
      confirmar('¿Pasar a <b>' + e(t.dataset.esnom) + '</b> a socio vitalicio? Deja de pagar la cuota desde este mes (las deudas anteriores siguen).', 'Pasar a vitalicio', function () {
        api('adminHacerVitalicio', token, t.dataset.esvit).then(function () { toast('¡Listo! Ya es vitalicio'); socios = []; cargarEst(); }).catch(function (x) { toast(msg(x)); });
      }, 'verde');
    }
  });

  /* ================= Más: Cuota de ingreso ================= */
  var cIng = tarjeta('ciCard', '🚪 Cuota de ingreso', 'rcCard');
  var CI = null;
  function pintarIng(r) {
    CI = r; var c = r.config;
    cuerpo(cIng, '<div class="muted">Lo que paga un socio nuevo al asociarse (art. 7 c). Se le genera como una deuda aparte en el alta, con vencimiento a 10 días. Al dar de alta podés bonificarla o poner otro monto para ese socio.</div>' +
      '<label class="es-sw" style="margin-top:10px"><input type="checkbox" id="ciAct"' + (c.activo ? ' checked' : '') + '> <b>Cobrar cuota de ingreso</b></label>' +
      '<div class="es-g2"><div><label>Tipo</label><select id="ciTipo"><option value="$"' + (c.tipo !== '%' ? ' selected' : '') + '>Monto fijo ($)</option><option value="%"' + (c.tipo === '%' ? ' selected' : '') + '>% de la cuota mensual</option></select></div>' +
      '<div><label id="ciLbl">' + (c.tipo === '%' ? 'Porcentaje' : 'Monto') + '</label><input id="ciValor" type="number" min="0" step="any" value="' + e(c.valor) + '"></div></div>' +
      '<div class="es-box" id="ciPrev"></div>' +
      '<div class="es-acc"><button class="btn" id="ciGuardar" type="button">Guardar</button></div><div class="error" id="ciErr" style="min-height:0"></div>');
    previa();
  }
  function previa() {
    var p = $id('ciPrev'); if (!p) return;
    var act = $id('ciAct').checked, tipo = $id('ciTipo').value, v = Number(String($id('ciValor').value).replace(',', '.')) || 0;
    $id('ciLbl').textContent = tipo === '%' ? 'Porcentaje' : 'Monto';
    p.innerHTML = !act ? 'Desactivada: los socios nuevos no pagan cuota de ingreso.' : !v ? 'Con valor 0 no se genera ninguna cuota de ingreso.' :
      tipo === '%' ? 'Un socio nuevo paga el ' + String(v).replace('.', ',') + ' % de la cuota de su categoría. Con la cuota base (' + pesos(CI.cuotaBase) + '): <b>' + pesos(CI.cuotaBase * v / 100) + '</b>.' :
        'Cada socio nuevo paga <b>' + pesos(v) + '</b> al asociarse.';
  }
  function cargarIng() { return api('adminIngreso', token, 'General').then(pintarIng).catch(falla(cIng)); }
  alAbrir(cIng, cargarIng);
  cIng.addEventListener('input', previa); cIng.addEventListener('change', previa);
  cIng.addEventListener('click', function (ev) {
    var t = ev.target; if (t.id !== 'ciGuardar') return;
    $id('ciErr').textContent = ''; ocupado(t, true, 'Guardando…');
    api('adminGuardarIngreso', token, { activo: $id('ciAct').checked, tipo: $id('ciTipo').value, valor: $id('ciValor').value })
      .then(function () { toast('Guardado'); ingresoCfg = null; return cargarIng(); }).catch(function (x) { $id('ciErr').textContent = msg(x); ocupado(t, false); });
  });

  /* ================= Alta: cuota de ingreso ================= */
  var fAlta = $id('fAlta'), ingresoCfg = null;
  var bloque = document.createElement('div');
  bloque.id = 'aIngreso'; bloque.className = 'es-box oculto';
  bloque.innerHTML = '<label class="es-sw" style="margin:0"><input type="checkbox" name="IngresoCobrar" id="aIngCobrar" checked> Cobrarle la cuota de ingreso <b id="aIngMonto"></b></label>' +
    '<div id="aIngOtro"><label>Otro monto (opcional)</label><input name="IngresoMonto" id="aIngValor" type="number" min="0" step="any" placeholder="Dejalo vacío para el monto normal"></div>';
  if (fAlta) { var bA = $id('bAlta'); var antes = bA ? bA.previousElementSibling : null; fAlta.insertBefore(bloque, antes || bA); }
  function actualizarAlta() {
    var go = function () {
      var c = ingresoCfg && ingresoCfg.config;
      bloque.classList.toggle('oculto', !(c && c.activo && Number(c.valor) > 0));
      if (!c || !c.activo) return;
      api('adminIngreso', token, ($id('aCategoria') || {}).value || 'General').then(function (r) { $id('aIngMonto').textContent = '(' + r.montoTxt + ')'; }).catch(function () {});
    };
    if (ingresoCfg) go(); else api('adminIngreso', token, 'General').then(function (r) { ingresoCfg = r; go(); }).catch(function () {});
  }
  if (fAlta) {
    $id('aIngCobrar').addEventListener('change', function () { $id('aIngOtro').classList.toggle('oculto', !this.checked); if (!this.checked) $id('aIngValor').value = ''; });
    var cat = $id('aCategoria'); if (cat) cat.addEventListener('change', actualizarAlta);
    fAlta.addEventListener('reset', function () { setTimeout(function () { $id('aIngOtro').classList.remove('oculto'); }, 0); });
    // Cada vez que se abre la pestaña de alta
    document.addEventListener('click', function (ev) { var b = ev.target.closest && ev.target.closest('#bNuevo,[data-ir="alta"]'); if (b) { ingresoCfg = null; actualizarAlta(); } });
    if (typeof token !== 'undefined' && token) setTimeout(actualizarAlta, 1500);
  }

  /* ================= Ficha del socio ================= */
  var cFi = document.createElement('div');
  cFi.className = 'card oculto'; cFi.id = 'esFicha';
  var avisos = $id('fAvisos');
  if (avisos) avisos.parentNode.insertBefore(cFi, avisos.nextSibling);
  var F = null, ES = null;

  function pintarFichaEs(r) {
    ES = r; var h = '';
    if (r.baja) {
      var b = r.baja;
      h += '<h3>↩️ Reincorporación <small class="muted">(art. 12)</small></h3>' +
        '<div class="muted">Dado de baja ' + (b.fecha ? 'el ' + e(b.fecha) + (b.dias ? ' (hace ' + b.dias + ' día' + (b.dias === 1 ? '' : 's') + ')' : ' (hoy)') : '(sin fecha registrada)') + '. ' +
        (b.dentroAnio ? 'Está dentro del año: si paga la deuda a valores vigentes conserva su antigüedad.' : 'Pasó más de un año: el Estatuto lo considera socio nuevo, salvo que la comisión decida otra cosa.') + '</div>' +
        (b.cantidad ? '<div class="es-box">Debe ' + b.cantidad + ' cuota' + (b.cantidad === 1 ? '' : 's') + ': ' + e(b.deudaTxt) + ' con los montos de cuando se generaron, <b>' + e(b.vigenteTxt) + ' a valores de hoy</b>.</div>' : '<div class="es-box">No tiene deuda pendiente.</div>') +
        '<div class="es-acc"><button class="btn verde" id="esReinc" type="button">Reincorporar</button></div>';
    } else {
      if (r.licencia) {
        h += '<h3>🧳 Licencia <small class="muted">(art. 10 c)</small></h3><div class="es-box">' + (r.licencia.vigente ? 'De licencia' : 'Licencia programada') + ' de <b>' + e(r.licencia.desdeTxt) + '</b> a <b>' + e(r.licencia.hastaTxt) + '</b>' +
          (r.licencia.motivo ? '<br><span class="muted">' + e(r.licencia.motivo) + '</span>' : '') + '</div>' +
          '<div class="es-acc"><button class="btn sec" id="esLicEditar" type="button">Cambiar fechas</button><button class="btn sec" id="esLicFin" type="button">Terminar la licencia</button></div>';
      } else if (r.estado === 'Activo') {
        h += '<h3>📜 Estatuto</h3><div class="muted">Licencia de hasta ' + r.maxLicencia + ' meses sin pagar cuota, por causa justificada (art. 10 c).</div>' +
          '<div class="es-acc"><button class="btn sec" id="esLicNueva" type="button">🧳 Dar licencia</button></div>';
      }
      if (r.vitalicio && r.vitalicio.candidato) {
        h += '<div class="es-box" style="margin-top:10px">🏆 Tiene ' + r.antiguedad + ' años de antigüedad: le corresponde ser socio vitalicio (art. 6).' +
          '<div class="es-acc"><button class="btn verde" id="esVitF" type="button">Pasar a ' + e(r.vitalicio.categoria) + '</button></div></div>';
      }
    }
    cFi.innerHTML = h;
    cFi.classList.toggle('oculto', !h);
  }

  function selectEstado(f) {
    var sel = $id('eEstado'); if (!sel) return;
    var op = sel.querySelector('option[value="Licencia"]');
    if (f.estado === 'Licencia') {
      if (!op) { op = document.createElement('option'); op.value = 'Licencia'; op.textContent = 'Licencia'; sel.appendChild(op); }
      sel.value = 'Licencia';
    } else if (op) op.remove();
  }

  var pintarPrev = window.pintarFicha;
  window.pintarFicha = function (f) {
    var r = pintarPrev.apply(this, arguments);
    F = f; cFi.classList.add('oculto');
    try {
      if (f && f.nro) {
        selectEstado(f);
        var pedido = f.nro;
        api('adminEstatutoSocio', token, f.nro).then(function (x) { if (F && F.nro === pedido) pintarFichaEs(x); }).catch(function () {});
      }
    } catch (x) { console.warn(x); }
    return r;
  };
  function recargar(txt) { toast(txt); socios = []; abrirFicha(F.nro, vistaAnterior); }

  function modalLicencia(actual) {
    var d = actual ? actual.desde : mesIso(0), h = actual ? actual.hasta : mesIso(2);
    modal('<h3 style="margin-top:0">🧳 Licencia · ' + e(F.nombre + ' ' + F.apellido) + '</h3>' +
      '<div class="muted">Hasta ' + ES.maxLicencia + ' meses en total. En esos meses no se le generan cuotas y las que ya estaban generadas (pendientes) se anulan.</div>' +
      '<div class="es-g2"><div><label>Desde</label><input id="esLD" type="month" value="' + e(d) + '"></div><div><label>Hasta (inclusive)</label><input id="esLH" type="month" value="' + e(h) + '"></div></div>' +
      '<label>Motivo</label><input id="esLM" maxlength="150" value="' + e(actual ? actual.motivo : '') + '" placeholder="Ej.: viaje de trabajo, salud, estudio">' +
      '<div class="error" id="esLErr"></div>',
      [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Guardar licencia', clase: 'verde', fn: function () {
        api('adminLicencia', token, F.nro, { desde: $id('esLD').value, hasta: $id('esLH').value, motivo: $id('esLM').value })
          .then(function (r) { recargar('Licencia guardada' + (r.anuladas ? ' · ' + r.anuladas + ' cuota' + (r.anuladas === 1 ? '' : 's') + ' anulada' + (r.anuladas === 1 ? '' : 's') : '')); })
          .catch(function (x) { toast(msg(x)); });
      } }]);
  }

  function modalReinc() {
    var b = ES.baja, medios = ES.medios || ['Efectivo', 'Transferencia', 'Mercado Pago'];
    modal('<h3 style="margin-top:0">↩️ Reincorporar · ' + e(F.nombre + ' ' + F.apellido) + '</h3>' +
      '<label class="es-op"><input type="radio" name="esRM" value="conserva"' + (b.dentroAnio ? ' checked' : '') + '><span><b>Conserva su antigüedad</b>' +
      '<small>' + (b.cantidad ? 'Paga ahora la deuda a valores vigentes (' + e(b.vigenteTxt) + ') y vuelve a activo con su número y su fecha de alta.' : 'No tiene deuda: vuelve a activo con su número y su fecha de alta.') +
      (b.dentroAnio ? '' : ' Pasó más de un año: elegilo solo si lo decide la comisión.') + '</small>' +
      (b.cantidad ? '<span class="es-g2" style="margin-top:4px"><span><label>Medio</label><select id="esRMed">' + medios.map(function (m) { return '<option>' + e(m) + '</option>'; }).join('') + '</select></span>' +
        '<span><label>Fecha del pago</label><input id="esRFec" type="date" value="' + hoyIso() + '"></span></span>' : '') + '</span></label>' +
      '<label class="es-op"><input type="radio" name="esRM" value="nuevo"' + (b.dentroAnio ? '' : ' checked') + '><span><b>Como socio nuevo</b>' +
      '<small>Mismo número de socio, pero la antigüedad cuenta desde hoy.' + (b.ingreso ? ' Se le genera la cuota de ingreso.' : '') + '</small>' +
      (b.cantidad ? '<label class="es-sw" style="margin-top:4px"><input type="checkbox" id="esRAnular"> Anular la deuda anterior (' + e(b.deudaTxt) + ')</label>' : '') +
      (b.ingreso ? '<label class="es-sw"><input type="checkbox" id="esRIng" checked> Cobrarle la cuota de ingreso</label>' : '') + '</span></label>',
      [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Reincorporar', clase: 'verde', fn: function () {
        var sel = document.querySelector('input[name=esRM]:checked'); if (!sel) { toast('Elegí cómo'); return; }
        var o = { modo: sel.value };
        if (o.modo === 'conserva' && $id('esRMed')) { o.medio = $id('esRMed').value; o.fecha = $id('esRFec').value; }
        if (o.modo === 'nuevo') { o.anularDeuda = !!($id('esRAnular') && $id('esRAnular').checked); if ($id('esRIng')) o.cobrarIngreso = $id('esRIng').checked; }
        api('adminReincorporar', token, F.nro, o).then(function (r) { recargar(r.texto); }).catch(function (x) { toast(msg(x)); });
      } }]);
  }

  cFi.addEventListener('click', function (ev) {
    var t = ev.target; if (!F || !ES) return;
    if (t.id === 'esLicNueva') modalLicencia(null);
    else if (t.id === 'esLicEditar') modalLicencia(ES.licencia);
    else if (t.id === 'esLicFin') {
      modal('<h3 style="margin-top:0">Terminar la licencia</h3><p>' + e(F.nombre + ' ' + F.apellido) + ' vuelve a activo desde hoy.</p>' +
        '<label class="es-sw"><input type="checkbox" id="esLCobrar" checked> Generarle la cuota de este mes</label>',
        [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Terminar', fn: function () {
          api('adminTerminarLicencia', token, F.nro, $id('esLCobrar').checked)
            .then(function (r) { recargar('Licencia terminada' + (r.cuotaTxt ? ' · cuota del mes: ' + r.cuotaTxt : '')); }).catch(function (x) { toast(msg(x)); });
        } }]);
    } else if (t.id === 'esReinc') modalReinc();
    else if (t.id === 'esVitF') {
      confirmar('¿Pasar a <b>' + e(F.nombre + ' ' + F.apellido) + '</b> a socio vitalicio? Deja de pagar la cuota desde este mes.', 'Pasar a vitalicio', function () {
        api('adminHacerVitalicio', token, F.nro).then(function () { recargar('¡Listo! Ya es vitalicio'); }).catch(function (x) { toast(msg(x)); });
      }, 'verde');
    }
  });
})();
