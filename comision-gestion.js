/* Socios CABB — "Gestión de socios" en el panel de la comisión:
 * grupos familiares (con responsable de pago), descuentos temporales y multas, sanciones
 * (apercibimiento y suspensión con vencimiento) y planes anuales/semestrales con descuento.
 * También amplía Avisos (comprobantes, planes, pagos familiares) y la ficha del socio.
 * Se apoya en comision.js y comision-socios-extra.js.
 */
(function () {
  var OP = null; // opciones (socios, grupos, familias…)
  var solapa = 'familias';

  var estilos = document.createElement('style');
  estilos.textContent =
    '.gs-sol { display: flex; gap: 6px; overflow-x: auto; margin-bottom: 10px; } .gs-sol button { flex: none; }' +
    '.gs-item { border-top: 1px solid var(--linea); padding: 10px 0; font-size: 14px; } .gs-item:first-child { border-top: 0; }' +
    '.gs-item .t { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }' +
    '.gs-item .s { color: var(--gris); font-size: 12px; margin-top: 2px; }' +
    '.gs-item .ops { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px; }' +
    '.gs-tag { display: inline-block; font-size: 11px; font-weight: 700; border-radius: 999px; padding: 2px 8px; background: #eee; color: #555; margin-left: 4px; }' +
    '.gs-tag.ok { background: #dcefe3; color: var(--ok); } .gs-tag.mal { background: #fbe0de; color: var(--mal); } .gs-tag.av { background: #fff1d6; color: var(--aviso); }' +
    '.sel-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }' +
    '.sel-chip { display: inline-flex; align-items: center; gap: 6px; background: var(--azul); color: #fff; border-radius: 999px; padding: 5px 10px; font-size: 13px; }' +
    '.sel-chip button { background: none; border: 0; color: #fff; font-size: 14px; padding: 0; cursor: pointer; }' +
    '.sel-res { border: 1px solid var(--linea); border-radius: 10px; max-height: 200px; overflow-y: auto; background: #fff; }' +
    '.sel-res div { padding: 8px 10px; font-size: 14px; cursor: pointer; border-top: 1px solid var(--linea); } .sel-res div:first-child { border-top: 0; } .sel-res div:hover { background: var(--crema); }' +
    '.radio-fila { display: flex; gap: 14px; flex-wrap: wrap; margin: 6px 0; font-size: 14px; } .radio-fila label { display: flex; gap: 6px; align-items: center; margin: 0; color: var(--tinta); } .radio-fila input { width: auto; margin: 0; }' +
    '.chk { display: flex; gap: 8px; align-items: center; margin: 8px 0; font-size: 14px; color: var(--tinta); } .chk input { width: auto; margin: 0; }' +
    '.ficha-gs { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 12px; } .ficha-gs button { flex: 1; min-width: 30%; }';
  document.head.appendChild(estilos);

  function hoyIso() { var h = new Date(); return h.getFullYear() + '-' + ('0' + (h.getMonth() + 1)).slice(-2) + '-' + ('0' + h.getDate()).slice(-2); }
  function mesIso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); }
  function diaIso(d) { return mesIso(d) + '-' + ('0' + d.getDate()).slice(-2); }
  function cargarOpciones(forzar) {
    if (OP && !forzar) return Promise.resolve(OP);
    return api('adminOpcionesGestion', token).then(function (o) { OP = o; return o; });
  }

  /* ================= Selector de alcance (a quién se aplica) ================= */
  function selectorAlcance(cont, permitidos, inicial) {
    inicial = inicial || {};
    var est = { alcance: inicial.alcance || permitidos[0], sel: (inicial.destinos || []).slice() };
    var NOMBRE = { Todos: 'Todos', Socios: 'Socios', Grupos: 'Grupos', Familias: 'Familias', 'Categorías': 'Categorías', 'Géneros': 'Géneros' };
    function lista() {
      if (est.alcance === 'Grupos') return OP.grupos;
      if (est.alcance === 'Familias') return OP.familias;
      if (est.alcance === 'Categorías') return OP.categorias;
      if (est.alcance === 'Géneros') return OP.generos;
      return [];
    }
    function pintar() {
      var h = '<label>¿A quién?</label><div class="chips" style="padding-top:0">' + permitidos.map(function (a) {
        return '<button type="button" class="chip' + (a === est.alcance ? ' on' : '') + '" data-alc="' + esc(a) + '">' + esc(NOMBRE[a]) + '</button>';
      }).join('') + '</div>';
      if (est.alcance === 'Socios') {
        h += '<div class="sel-chips">' + est.sel.map(function (n) {
          var s = OP.socios.filter(function (x) { return x.nro === n; })[0];
          return '<span class="sel-chip">' + esc(s ? s.nombre : 'Nº ' + n) + ' <button type="button" data-quitar="' + esc(n) + '">✕</button></span>';
        }).join('') + '</div><input class="sel-buscar" placeholder="Buscar socio por nombre o Nº"><div class="sel-res oculto"></div>';
      } else if (est.alcance !== 'Todos') {
        var l = lista();
        h += l.length ? '<div class="gchips">' + l.map(function (g) {
          var on = est.sel.indexOf(g) >= 0;
          return '<label class="gchip' + (on ? ' on' : '') + '"><input type="checkbox" value="' + esc(g) + '"' + (on ? ' checked' : '') + '>' + esc(g) + '</label>';
        }).join('') + '</div>' : '<div class="muted">No hay ' + esc(NOMBRE[est.alcance].toLowerCase()) + ' cargados.</div>';
      } else h += '<div class="muted">Se aplica a todos los socios activos.</div>';
      cont.innerHTML = h;
    }
    cont.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-alc]');
      if (a) { if (a.dataset.alc !== est.alcance) { est.alcance = a.dataset.alc; est.sel = []; pintar(); } return; }
      var q = ev.target.closest('[data-quitar]');
      if (q) { est.sel = est.sel.filter(function (x) { return x !== q.dataset.quitar; }); pintar(); return; }
      var r = ev.target.closest('[data-elegir]');
      if (r) { if (est.sel.indexOf(r.dataset.elegir) < 0) est.sel.push(r.dataset.elegir); pintar(); cont.querySelector('.sel-buscar').focus(); }
    });
    cont.addEventListener('change', function (ev) {
      if (ev.target.type !== 'checkbox') return;
      ev.target.parentNode.classList.toggle('on', ev.target.checked);
      est.sel = Array.prototype.map.call(cont.querySelectorAll('.gchips input:checked'), function (i) { return i.value; });
    });
    cont.addEventListener('input', function (ev) {
      if (!ev.target.classList.contains('sel-buscar')) return;
      var q = sinAcentos(ev.target.value.trim()), res = cont.querySelector('.sel-res');
      if (!q) { res.classList.add('oculto'); return; }
      var m = OP.socios.filter(function (s) { return est.sel.indexOf(s.nro) < 0 && (s.nro === q || sinAcentos(s.nombre).indexOf(q) >= 0); }).slice(0, 8);
      res.innerHTML = m.length ? m.map(function (s) { return '<div data-elegir="' + esc(s.nro) + '">' + esc(s.nombre) + ' <span class="muted">Nº ' + esc(s.nro) + (s.estado !== 'Activo' ? ' · ' + esc(s.estado) : '') + '</span></div>'; }).join('') : '<div class="muted">Sin resultados</div>';
      res.classList.remove('oculto');
    });
    pintar();
    return { valor: function () { return { alcance: est.alcance, destinos: est.sel.join(', '), cantidad: est.sel.length }; } };
  }

  /* ================= Vista ================= */
  var sec = document.createElement('section');
  sec.id = 'vGestion'; sec.className = 'oculto';
  sec.innerHTML = '<button class="volver" data-ir="mas" type="button">‹ Volver</button><h2>Gestión de socios</h2>' +
    '<div class="gs-sol chips" id="gsSol">' +
    '<button class="chip on" data-s="familias" type="button">Familias</button><button class="chip" data-s="descuentos" type="button">Descuentos y multas</button>' +
    '<button class="chip" data-s="sanciones" type="button">Sanciones</button><button class="chip" data-s="planes" type="button">Planes anuales</button></div>' +
    '<div id="gsCuerpo"></div>';
  document.querySelector('.wrap').appendChild(sec);
  VISTAS.push('vGestion');

  var cardAcc = document.createElement('div');
  cardAcc.className = 'card';
  cardAcc.innerHTML = '<h3>Gestión de socios</h3><p class="muted" style="margin:0">Grupos familiares, descuentos por un mes o más, multas, sanciones y suspensiones, y planes de pago anual o semestral.</p>' +
    '<button class="btn" id="bGestion" type="button">Abrir</button>';
  var vMas = document.getElementById('vMas');
  vMas.insertBefore(cardAcc, vMas.children[1]);
  document.getElementById('bGestion').addEventListener('click', function () { abrir('familias'); });

  function abrir(s, prefill) {
    solapa = s;
    document.querySelectorAll('#gsSol .chip').forEach(function (x) { x.classList.toggle('on', x.dataset.s === s); });
    mostrar('vGestion'); window.scrollTo(0, 0);
    document.getElementById('gsCuerpo').innerHTML = '<div class="muted">Cargando…</div>';
    cargarOpciones(true).then(function () { ({ familias: vFamilias, descuentos: vDescuentos, sanciones: vSanciones, planes: vPlanes })[s](prefill || {}); })
      .catch(function (e) { document.getElementById('gsCuerpo').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
  }
  window.abrirGestion = abrir;
  document.getElementById('gsSol').addEventListener('click', function (ev) { var b = ev.target.closest('.chip'); if (b) abrir(b.dataset.s); });
  function cuerpo(h) { var c = document.getElementById('gsCuerpo'); c.innerHTML = h; return c; }
  function q(sel) { return document.querySelector('#gsCuerpo ' + sel); }

  /* ================= Familias ================= */
  function vFamilias(pre) {
    var c = cuerpo('<div class="card"><h3>Grupos familiares</h3><div id="gfLista"><div class="muted">Cargando…</div></div></div>' +
      '<div class="card" id="gfForm"><h3 id="gfTit">Nuevo grupo familiar</h3>' +
      '<label>Nombre</label><input id="gfNombre" maxlength="60" placeholder="Ej.: Familia Pérez">' +
      '<label>Integrantes</label><div id="gfInt"></div>' +
      '<label>Responsable de pago</label><select id="gfResp"><option value="">— Sin responsable —</option></select>' +
      '<label class="chk"><input type="checkbox" id="gfCuotas"> Paga las cuotas de toda la familia</label>' +
      '<label class="chk"><input type="checkbox" id="gfEventos"> Paga los eventos de toda la familia</label>' +
      '<label>Notas (opcional)</label><input id="gfNotas" maxlength="200">' +
      '<div class="fila2"><button class="btn" id="gfGuardar" type="button">Guardar</button><button class="btn sec oculto" id="gfCancelar" type="button">Cancelar</button></div>' +
      '<div class="error" id="gfErr"></div><p class="muted">El descuento familiar (%) se configura en Más → Grupos y descuentos.</p></div>');
    var editando = null;
    var selInt = selectorAlcance(q('#gfInt'), ['Socios'], { alcance: 'Socios', destinos: pre.nro ? [String(pre.nro)] : [] });
    function actualizarResp() {
      var v = selInt.valor(), sel = q('#gfResp'), actual = sel.value;
      var nros = v.destinos ? v.destinos.split(', ') : [];
      sel.innerHTML = '<option value="">— Sin responsable —</option>' + nros.map(function (n) {
        var s = OP.socios.filter(function (x) { return x.nro === n; })[0]; return '<option value="' + esc(n) + '">' + esc(s ? s.nombre : n) + '</option>'; }).join('');
      if (nros.indexOf(actual) >= 0) sel.value = actual;
    }
    q('#gfInt').addEventListener('click', function () { setTimeout(actualizarResp, 0); });
    actualizarResp();
    function cargar() {
      api('adminFamilias', token).then(function (l) {
        q('#gfLista').innerHTML = l.length ? l.map(function (f, i) {
          return '<div class="gs-item" data-i="' + i + '"><div class="t"><div><b>' + esc(f.nombre) + '</b>' +
            (f.pagaCuotas ? '<span class="gs-tag ok">paga cuotas</span>' : '') + (f.pagaEventos ? '<span class="gs-tag ok">paga eventos</span>' : '') +
            '<div class="s">' + (f.responsableNombre ? 'Responsable: ' + esc(f.responsableNombre) : 'Sin responsable de pago') + '</div></div>' +
            '<div style="text-align:right"><b>' + esc(f.deudaTxt) + '</b><div class="s">pendiente</div></div></div>' +
            '<div class="s">' + f.integrantes.map(function (x) { return esc(x.nombre) + (x.deuda ? ' (' + esc(x.deudaTxt) + ')' : '') + (x.estado !== 'Activo' ? ' · ' + esc(x.estado) : ''); }).join(' · ') + '</div>' +
            '<div class="ops"><button class="link gfEd" type="button">Editar</button>' + (f.deuda ? '<button class="link gfPagar" type="button">Registrar pago de todo</button>' : '') +
            '<button class="mini gfBorrar" type="button">borrar</button></div></div>';
        }).join('') : '<div class="muted">Todavía no hay grupos familiares.</div>';
        q('#gfLista').onclick = function (ev) {
          var row = ev.target.closest('.gs-item'); if (!row) return;
          var f = l[Number(row.dataset.i)];
          if (ev.target.classList.contains('gfEd')) {
            editando = f.nombre;
            q('#gfTit').textContent = 'Editar "' + f.nombre + '"'; q('#gfNombre').value = f.nombre; q('#gfNotas').value = f.notas || '';
            selInt = selectorAlcance(q('#gfInt'), ['Socios'], { alcance: 'Socios', destinos: f.integrantes.map(function (x) { return x.nro; }) });
            actualizarResp(); q('#gfResp').value = f.responsable; q('#gfCuotas').checked = f.pagaCuotas; q('#gfEventos').checked = f.pagaEventos;
            q('#gfCancelar').classList.remove('oculto'); q('#gfForm').scrollIntoView({ behavior: 'smooth' });
          } else if (ev.target.classList.contains('gfBorrar')) {
            confirmar('¿Borrar el grupo familiar "' + f.nombre + '"? Los socios quedan sin familia (y sin descuento familiar en las cuotas próximas).', 'Borrar', function () {
              api('adminBorrarFamilia', token, f.nombre).then(function () { toast('Grupo familiar borrado'); abrir('familias'); }).catch(function (e) { toast(msg(e)); });
            }, 'peligro');
          } else if (ev.target.classList.contains('gfPagar')) {
            modal('<p><b>Registrar el pago de todo lo pendiente de ' + esc(f.nombre) + ': ' + esc(f.deudaTxt) + '</b></p><label>Medio</label><select id="gfMedio"><option>Efectivo</option><option>Transferencia</option><option>Mercado Pago</option></select>',
              [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Registrar', clase: 'si', fn: function () {
                api('adminPagoFamilia', token, f.nombre, document.getElementById('gfMedio').value, hoyIso(), '').then(function (r) { toast('Pago registrado: ' + r.cantidad + ' cuotas, ' + r.total); abrir('familias'); }).catch(function (e) { toast(msg(e)); });
              } }]);
          }
        };
      }).catch(function (e) { q('#gfLista').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
    }
    q('#gfCancelar').onclick = function () { abrir('familias'); };
    q('#gfGuardar').onclick = function () {
      var b = this, v = selInt.valor(); q('#gfErr').textContent = '';
      ocupado(b, true, 'Guardando…');
      api('adminGuardarFamilia', token, { nombre: q('#gfNombre').value, integrantes: v.destinos ? v.destinos.split(', ') : [], responsable: q('#gfResp').value,
        pagaCuotas: q('#gfCuotas').checked, pagaEventos: q('#gfEventos').checked, notas: q('#gfNotas').value }, editando)
        .then(function () { toast('Grupo familiar guardado'); abrir('familias'); })
        .catch(function (e) { q('#gfErr').textContent = msg(e); }).then(function () { ocupado(b, false); });
    };
    cargar();
    if (pre.nro) q('#gfForm').scrollIntoView();
  }

  /* ================= Descuentos y multas ================= */
  function vDescuentos(pre) {
    var tipo = pre.tipo || 'Descuento';
    var c = cuerpo('<div class="card"><div class="pestanas" id="gdTipo"><button type="button" data-t="Descuento">Descuento</button><button type="button" data-t="Multa">Multa</button></div>' +
      '<div id="gdAlc"></div>' +
      '<div id="gdDesc"><div class="fila2"><div><label>Descuento</label><input id="gdValor" type="number" min="0" step="1"></div>' +
      '<div><label>Tipo</label><select id="gdTipoV"><option value="%">% de la cuota</option><option value="$">$ fijo</option></select></div></div>' +
      '<label>¿Por cuánto tiempo?</label><div class="radio-fila"><label><input type="radio" name="gdVig" value="1" checked> Una sola vez</label><label><input type="radio" name="gdVig" value="n"> Varios meses</label></div>' +
      '<div class="fila2"><div><label id="gdDesdeL">Mes</label><input id="gdDesde" type="month"></div><div id="gdHastaB" class="oculto"><label>Hasta</label><input id="gdHasta" type="month"></div></div></div>' +
      '<div id="gdMulta" class="oculto"><div class="fila2"><div><label>Monto</label><input id="gmMonto" type="number" min="0" step="100"></div><div><label>Vence</label><input id="gmVence" type="date"></div></div>' +
      '<p class="muted" style="margin:6px 0 0">La multa aparece como deuda aparte junto a las cuotas y queda registrada en Sanciones.</p></div>' +
      '<label>Motivo</label><input id="gdMotivo" maxlength="80" placeholder="Ej.: Bonificación por organizar el torneo">' +
      '<button class="btn" id="gdCrear" type="button">Aplicar</button><div class="error" id="gdErr"></div></div>' +
      '<div class="card"><h3>Descuentos temporales vigentes</h3><div id="gdLista"></div><p class="muted">Los descuentos fijos (jubilados, damas, becados…) se manejan como grupos en Más → Grupos y descuentos.</p></div>');
    var sel = selectorAlcance(q('#gdAlc'), ['Socios', 'Grupos', 'Familias', 'Categorías', 'Géneros', 'Todos'], { alcance: 'Socios', destinos: pre.nro ? [String(pre.nro)] : [] });
    q('#gdDesde').value = OP.periodoActual; q('#gdHasta').value = OP.periodoActual;
    var v = new Date(); v.setDate(v.getDate() + 10); q('#gmVence').value = diaIso(v);
    function ponerTipo(t) {
      tipo = t;
      document.querySelectorAll('#gdTipo button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); });
      q('#gdDesc').classList.toggle('oculto', t !== 'Descuento'); q('#gdMulta').classList.toggle('oculto', t !== 'Multa');
      q('#gdCrear').textContent = t === 'Descuento' ? 'Aplicar descuento' : 'Aplicar multa';
      q('#gdMotivo').placeholder = t === 'Descuento' ? 'Ej.: Bonificación por organizar el torneo' : 'Ej.: Daño de material';
    }
    ponerTipo(tipo);
    q('#gdTipo').onclick = function (ev) { var b = ev.target.closest('button'); if (b) ponerTipo(b.dataset.t); };
    c.addEventListener('change', function (ev) {
      if (ev.target.name === 'gdVig') { var n = ev.target.value === 'n'; q('#gdHastaB').classList.toggle('oculto', !n); q('#gdDesdeL').textContent = n ? 'Desde' : 'Mes'; }
    });
    q('#gdLista').innerHTML = OP.descuentos.length ? OP.descuentos.map(function (d) {
      return '<div class="gs-item"><div class="t"><div><b>' + esc(d.motivo) + '</b> · ' + esc(d.valorTxt) + '<div class="s">' + esc(d.meses) + ' · ' + esc(d.alcance) + '</div></div>' +
        '<button class="mini gdQuitar" data-id="' + esc(d.id) + '" type="button">quitar</button></div></div>';
    }).join('') : '<div class="muted">No hay descuentos temporales vigentes.</div>';
    q('#gdLista').onclick = function (ev) {
      var b = ev.target.closest('.gdQuitar'); if (!b) return;
      confirmar('¿Quitar este descuento? Las cuotas pendientes de esos meses se recalculan sin él (las pagadas no cambian).', 'Quitar', function () {
        api('adminQuitarDescuento', token, b.dataset.id).then(function (r) { toast('Descuento quitado' + (r.recalculadas ? ' · ' + r.recalculadas + ' cuotas recalculadas' : '')); abrir('descuentos'); }).catch(function (e) { toast(msg(e)); });
      }, 'peligro');
    };
    q('#gdCrear').onclick = function () {
      var b = this, a = sel.valor(), err = q('#gdErr'); err.textContent = '';
      var p;
      if (tipo === 'Descuento') {
        var varios = c.querySelector('input[name=gdVig]:checked').value === 'n';
        p = api('adminCrearDescuento', token, { alcance: a.alcance, destinos: a.destinos, tipo: q('#gdTipoV').value, valor: q('#gdValor').value,
          desde: q('#gdDesde').value, hasta: varios ? q('#gdHasta').value : q('#gdDesde').value, motivo: q('#gdMotivo').value })
          .then(function (r) { modal('<p><b>Descuento aplicado a ' + r.socios + ' socio' + (r.socios === 1 ? '' : 's') + '.</b></p><p class="muted">Se aplica a las cuotas que se generen en esos meses' + (r.recalculadas ? ' y se recalcularon ' + r.recalculadas + ' cuotas pendientes ya generadas' : '') + '.</p>'); abrir('descuentos'); });
      } else {
        p = api('adminSancionar', token, { alcance: a.alcance, destinos: a.destinos, tipo: 'Multa', monto: q('#gmMonto').value, vence: q('#gmVence').value, motivo: q('#gdMotivo').value })
          .then(function (r) { modal('<p><b>Multa aplicada a ' + r.socios + ' socio' + (r.socios === 1 ? '' : 's') + '.</b></p><p class="muted">Les aparece como deuda en la app y se cobra como una cuota.</p>'); abrir('descuentos', { tipo: 'Multa' }); });
      }
      ocupado(b, true, 'Aplicando…');
      p.catch(function (e) { err.textContent = msg(e); }).then(function () { ocupado(b, false); });
    };
  }

  /* ================= Sanciones ================= */
  function vSanciones(pre) {
    var tipo = 'Suspensión';
    var c = cuerpo('<div class="card"><h3>Nueva sanción</h3><div class="pestanas" id="gsTipo"><button type="button" data-t="Suspensión">Suspensión</button><button type="button" data-t="Apercibimiento">Apercibimiento</button></div>' +
      '<div id="gsAlc"></div>' +
      '<div id="gsSusp"><div class="fila2"><div><label>Desde</label><input id="gsDesde" type="date"></div><div><label>Duración (meses)</label><input id="gsMeses" type="number" min="1" step="1"></div></div>' +
      '<div class="muted" id="gsHastaTxt" style="margin-top:4px"></div>' +
      '<label class="chk"><input type="checkbox" id="gsCuota"> Sigue pagando la cuota mientras dure</label>' +
      '<p class="muted" style="margin:0">Al vencer, el socio vuelve a Activo solo. Se puede levantar antes desde la lista.</p></div>' +
      '<label>Motivo</label><input id="gsMotivo" maxlength="200" placeholder="Ej.: Art. 12 del estatuto — falta de pago">' +
      '<button class="btn peligro" id="gsAplicar" type="button">Aplicar sanción</button><div class="error" id="gsErr"></div>' +
      '<p class="muted">Las multas se ponen desde "Descuentos y multas".</p></div>' +
      '<div class="card"><h3>Sanciones</h3><div id="gsLista"><div class="muted">Cargando…</div></div></div>');
    var sel = selectorAlcance(q('#gsAlc'), ['Socios', 'Grupos', 'Familias'], { alcance: 'Socios', destinos: pre.nro ? [String(pre.nro)] : [] });
    q('#gsDesde').value = OP.hoy; q('#gsMeses').value = OP.mesesSuspension;
    function hastaTxt() {
      var d = new Date(q('#gsDesde').value + 'T12:00:00'), m = Number(q('#gsMeses').value) || 0;
      if (isNaN(d) || !m) { q('#gsHastaTxt').textContent = ''; return; }
      var h = new Date(d); h.setMonth(h.getMonth() + m);
      q('#gsHastaTxt').textContent = 'Hasta el ' + ('0' + h.getDate()).slice(-2) + '/' + ('0' + (h.getMonth() + 1)).slice(-2) + '/' + h.getFullYear() + (m === OP.mesesSuspension ? ' (plazo del estatuto)' : '');
    }
    hastaTxt();
    q('#gsDesde').oninput = hastaTxt; q('#gsMeses').oninput = hastaTxt;
    function ponerTipo(t) {
      tipo = t;
      document.querySelectorAll('#gsTipo button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); });
      q('#gsSusp').classList.toggle('oculto', t !== 'Suspensión');
      q('#gsAplicar').textContent = t === 'Suspensión' ? 'Suspender' : 'Registrar apercibimiento';
    }
    ponerTipo(tipo);
    q('#gsTipo').onclick = function (ev) { var b = ev.target.closest('button'); if (b) ponerTipo(b.dataset.t); };
    q('#gsAplicar').onclick = function () {
      var b = this, a = sel.valor(), err = q('#gsErr'); err.textContent = '';
      var go = function () {
        ocupado(b, true, 'Aplicando…');
        api('adminSancionar', token, { alcance: a.alcance, destinos: a.destinos, tipo: tipo, desde: q('#gsDesde').value, meses: q('#gsMeses').value,
          conCuota: q('#gsCuota').checked, motivo: q('#gsMotivo').value })
          .then(function (r) { toast(tipo + ' aplicada a ' + r.socios + ' socio' + (r.socios === 1 ? '' : 's') + (r.hasta ? ' hasta el ' + r.hasta : '')); abrir('sanciones'); })
          .catch(function (e) { err.textContent = msg(e); }).then(function () { ocupado(b, false); });
      };
      if (tipo === 'Suspensión') confirmar('¿Suspender ' + (a.alcance === 'Socios' ? (a.cantidad === 1 ? 'a este socio' : 'a ' + a.cantidad + ' socios') : 'a los socios de ' + a.destinos) + '? ' + q('#gsHastaTxt').textContent + '.', 'Suspender', go, 'peligro');
      else go();
    };
    api('adminSanciones', token).then(function (l) {
      var activa = function (x) { return x.estado === 'Vigente' || (x.tipo === 'Apercibimiento' && x.estado === 'Registrada'); };
      var vig = l.filter(activa), resto = l.filter(function (x) { return !activa(x); });
      var fila = function (x) {
        var tag = x.estado === 'Vigente' ? '<span class="gs-tag mal">vigente</span>' : x.estado === 'Registrada' ? '<span class="gs-tag mal">registrado</span>' : '<span class="gs-tag">' + esc(x.estado.toLowerCase()) + '</span>';
        var det = x.tipo === 'Suspensión' ? 'Del ' + esc(x.desde) + ' al ' + esc(x.hasta) + (x.conCuota ? ' · con cuota' : ' · sin cuota') :
          x.tipo === 'Multa' ? esc(x.montoTxt) + (x.multaEstado ? ' · ' + (x.multaEstado === 'Pagada' ? 'pagada' : x.multaEstado === 'Anulada' ? 'anulada' : 'sin pagar') : '') : esc(x.desde);
        return '<div class="gs-item" data-id="' + esc(x.id) + '" data-tipo="' + esc(x.tipo) + '"><div class="t"><div><b>' + esc(x.tipo) + '</b> · ' + esc(x.socio) + ' <span class="s">Nº ' + esc(x.nro) + '</span>' + tag +
          '<div class="s">' + det + '</div><div class="s">' + esc(x.motivo) + (x.usuario ? ' · ' + esc(x.usuario) : '') + '</div></div></div>' +
          (activa(x) ? '<div class="ops">' + (x.tipo === 'Suspensión' ? '<button class="link gsLevantar" type="button">Levantar suspensión</button>' : '') +
            (x.tipo === 'Apercibimiento' ? '<button class="link gsSinEfecto" type="button">Dejar sin efecto</button>' : '') +
            (x.tipo === 'Multa' && x.multaEstado === 'Pendiente' ? '<button class="link gsAnular" type="button">Anular multa</button>' : '') + '<button class="link" data-ficha="' + esc(x.nro) + '" type="button">Ver ficha</button></div>' : '') + '</div>';
      };
      q('#gsLista').innerHTML = l.length ? (vig.length ? vig.map(fila).join('') : '<div class="muted">No hay sanciones vigentes.</div>') +
        (resto.length ? '<details style="margin-top:10px"><summary class="muted" style="cursor:pointer">Historial (' + resto.length + ')</summary>' + resto.map(fila).join('') + '</details>' : '')
        : '<div class="muted">Todavía no hay sanciones registradas.</div>';
      q('#gsLista').onclick = function (ev) {
        var f = ev.target.closest('[data-ficha]'); if (f) { abrirFicha(f.dataset.ficha, 'mas'); return; }
        var row = ev.target.closest('.gs-item'); if (!row) return;
        var lev = ev.target.classList.contains('gsLevantar'), anu = ev.target.classList.contains('gsAnular'), sin = ev.target.classList.contains('gsSinEfecto');
        if (!lev && !anu && !sin) return;
        var preg = lev ? '¿Levantar la suspensión? El socio vuelve a Activo hoy.' : anu ? '¿Anular la multa? Deja de figurar como deuda.' : '¿Dejar sin efecto el apercibimiento? Queda en el historial como "sin efecto".';
        modal('<p><b>' + preg + '</b></p><label>Motivo (opcional)</label><input id="gsLevMot" maxlength="120">',
          [{ txt: 'Cancelar', clase: 'sec' }, { txt: lev ? 'Levantar' : anu ? 'Anular' : 'Dejar sin efecto', clase: 'si', fn: function () {
            api('adminLevantarSancion', token, row.dataset.id, document.getElementById('gsLevMot').value, anu).then(function () { toast(lev ? 'Suspensión levantada' : anu ? 'Multa anulada' : 'Apercibimiento sin efecto'); abrir('sanciones'); }).catch(function (e) { toast(msg(e)); });
          } }]);
      };
    }).catch(function (e) { q('#gsLista').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
  }

  /* ================= Planes anuales / semestrales ================= */
  function vPlanes() {
    var c = cuerpo('<div class="card"><h3>Planes de pago adelantado</h3><div id="gpLista"><div class="muted">Cargando…</div></div></div>' +
      '<div class="card" id="gpForm"><h3 id="gpTit">Nuevo plan</h3>' +
      '<div class="pestanas" id="gpTipo"><button type="button" data-t="Anual" class="on">Anual (12 meses)</button><button type="button" data-t="Semestral">Semestral (6 meses)</button></div>' +
      '<div class="fila2"><div><label>Cubre desde</label><input id="gpDesde" type="month"></div><div><label>Descuento (%)</label><input id="gpDesc" type="number" min="0" max="99" step="1" value="10"></div></div>' +
      '<div class="fila2"><div><label>Se ofrece desde</label><input id="gpOD" type="date"></div><div><label>Hasta</label><input id="gpOH" type="date"></div></div>' +
      '<label>Nombre (opcional)</label><input id="gpNombre" maxlength="60" placeholder="Se arma solo: Plan anual Enero 2027 a Diciembre 2027">' +
      '<div id="gpAlc"></div>' +
      '<label class="chk"><input type="checkbox" id="gpAvisar" checked> Avisar ahora al celular a quienes corresponda</label>' +
      '<div class="fila2"><button class="btn" id="gpGuardar" type="button">Crear plan</button><button class="btn sec oculto" id="gpCancelar" type="button">Cancelar</button></div>' +
      '<div class="error" id="gpErr"></div>' +
      '<p class="muted">Al socio le aparece como oferta en su app, con el total y lo que ahorra. Cuando avisa que pagó, la confirmás en Avisos y se registran todos los meses juntos.</p></div>');
    var tipo = 'Anual', editId = null;
    var sel = selectorAlcance(q('#gpAlc'), ['Todos', 'Grupos', 'Familias', 'Categorías', 'Géneros', 'Socios'], { alcance: 'Todos' });
    function defaults(t) {
      var h = new Date(), y = h.getFullYear();
      if (t === 'Anual') { var ya = h.getMonth() >= 1; var yy = ya ? y + 1 : y; q('#gpDesde').value = yy + '-01'; q('#gpOD').value = (ya ? yy - 1 : yy) + (ya ? '-12-15' : '-01-01'); q('#gpOH').value = yy + '-01-31'; }
      else { var j = h.getMonth() >= 6 ? y + 1 : y; q('#gpDesde').value = j + '-07'; q('#gpOD').value = j + '-06-01'; q('#gpOH').value = j + '-07-15'; }
    }
    function ponerTipo(t) { tipo = t; document.querySelectorAll('#gpTipo button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); }); if (!editId) defaults(t); }
    ponerTipo('Anual');
    q('#gpTipo').onclick = function (ev) { var b = ev.target.closest('button'); if (b) ponerTipo(b.dataset.t); };
    q('#gpCancelar').onclick = function () { abrir('planes'); };
    q('#gpGuardar').onclick = function () {
      var b = this, a = sel.valor(), err = q('#gpErr'); err.textContent = '';
      ocupado(b, true, 'Guardando…');
      api('adminGuardarPlan', token, { id: editId, tipo: tipo, desde: q('#gpDesde').value, descuento: q('#gpDesc').value, ofertaDesde: q('#gpOD').value, ofertaHasta: q('#gpOH').value,
        nombre: q('#gpNombre').value, alcance: a.alcance, destinos: a.destinos }, q('#gpAvisar').checked)
        .then(function (r) { toast('Plan guardado' + (r.notificados ? ' · avisado a ' + r.notificados + ' celulares' : '')); abrir('planes'); })
        .catch(function (e) { err.textContent = msg(e); }).then(function () { ocupado(b, false); });
    };
    api('adminPlanes', token).then(function (l) {
      q('#gpLista').innerHTML = l.length ? l.map(function (p, i) {
        return '<div class="gs-item" data-i="' + i + '"><div class="t"><div><b>' + esc(p.nombre) + '</b>' +
          (p.vigente ? '<span class="gs-tag ok">ofreciéndose</span>' : p.activo ? '<span class="gs-tag">fuera de fecha</span>' : '<span class="gs-tag">desactivado</span>') +
          (p.pendientes ? '<span class="gs-tag av">' + p.pendientes + ' a confirmar</span>' : '') +
          '<div class="s">' + esc(p.tipo) + ' · ' + p.descuento + '% · oferta del ' + esc(p.ofertaTxt) + ' · ' + esc(p.alcanceTxt) + '</div>' +
          '<div class="s">Adhirieron ' + p.adheridos + ' socio' + (p.adheridos === 1 ? '' : 's') + ' · ' + esc(p.cobradoTxt) + '</div></div></div>' +
          '<div class="ops"><button class="link gpEd" type="button">Editar</button><button class="link gpAct" type="button">' + (p.activo ? 'Desactivar' : 'Activar') + '</button></div></div>';
      }).join('') : '<div class="muted">Todavía no hay planes. Creá uno abajo.</div>';
      q('#gpLista').onclick = function (ev) {
        var row = ev.target.closest('.gs-item'); if (!row) return;
        var p = l[Number(row.dataset.i)];
        if (ev.target.classList.contains('gpAct')) {
          api('adminEstadoPlan', token, p.id, !p.activo).then(function () { toast(p.activo ? 'Plan desactivado' : 'Plan activado'); abrir('planes'); }).catch(function (e) { toast(msg(e)); });
        } else if (ev.target.classList.contains('gpEd')) {
          editId = p.id; ponerTipo(p.tipo);
          q('#gpDesde').value = p.desde; q('#gpDesc').value = p.descuento; q('#gpOD').value = p.ofertaDesde; q('#gpOH').value = p.ofertaHasta; q('#gpNombre').value = p.nombre;
          sel = selectorAlcance(q('#gpAlc'), ['Todos', 'Grupos', 'Familias', 'Categorías', 'Géneros', 'Socios'], { alcance: p.alcance, destinos: p.destinos ? p.destinos.split(', ') : [] });
          q('#gpAvisar').checked = false; q('#gpTit').textContent = 'Editar plan'; q('#gpGuardar').textContent = 'Guardar cambios'; q('#gpCancelar').classList.remove('oculto');
          q('#gpForm').scrollIntoView({ behavior: 'smooth' });
        }
      };
    }).catch(function (e) { q('#gpLista').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
  }

  /* ================= Avisos: comprobantes, planes y pagos familiares ================= */
  function verComprobante(id, btn) {
    if (btn) ocupado(btn, true, 'Abriendo…');
    api('adminComprobante', token, id).then(function (f) {
      var bin = atob(f.datos), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      var url = URL.createObjectURL(new Blob([arr], { type: f.tipo }));
      if (/^image\//.test(f.tipo)) modal('<img src="' + url + '" style="width:100%;border-radius:8px" alt="Comprobante"><p class="muted">' + esc(f.nombre) + '</p><a class="btn sec" href="' + url + '" download="' + esc(f.nombre) + '">Descargar</a>');
      else modal('<p><b>' + esc(f.nombre) + '</b></p><a class="btn" href="' + url + '" target="_blank" rel="noopener">Abrir PDF</a><a class="btn sec" href="' + url + '" download="' + esc(f.nombre) + '">Descargar</a>');
    }).catch(function (e) { toast(msg(e)); }).then(function () { if (btn) ocupado(btn, false); });
  }
  window.cargarAvisos = cargarAvisos = function () {
    $('aLista').innerHTML = '<div class="cargando">Cargando…</div>';
    var cont = $('aListaEv');
    if (!cont) { cont = document.createElement('div'); cont.id = 'aListaEv'; $('aLista').parentNode.appendChild(cont); }
    cont.innerHTML = '';
    Promise.all([api('adminAvisos', token), api('adminAvisosEventos', token)]).then(function (r) {
      var l = r[0], le = r[1];
      marcarAvisos(l.length + le.length);
      var comp = function (id) { return id ? '<button class="gaComp" data-comp="' + esc(id) + '">📎 Ver comprobante</button>' : ''; };
      $('aLista').innerHTML = l.length ? '<h3>Cuotas y planes</h3>' + l.map(function (a) {
        var acc;
        if (a.tipo === 'Plan') acc = '<button data-rech="' + a.fila + '">Rechazar</button>' + comp(a.comprobante) + '<button class="si gaPlan" data-fila="' + a.fila + '" data-medio="' + esc(a.medio) + '">Confirmar plan</button>';
        else if (a.tipo === 'Familia') acc = '<button data-rech="' + a.fila + '">Rechazar</button>' + comp(a.comprobante) + '<button class="si gaFam" data-fila="' + a.fila + '" data-fam="' + esc(a.familia) + '" data-medio="' + esc(a.medio) + '">Registrar pago familiar</button>';
        else acc = '<button data-rech="' + a.fila + '">Rechazar</button>' + comp(a.comprobante) + '<button class="si" data-ficha="' + esc(a.nro) + '">Controlar y registrar</button>';
        return '<div class="aviso"><b>' + esc(a.socio) + '</b> (Nº ' + esc(a.nro) + ') — ' + esc(a.fecha) + (a.tipo !== 'Cuota' ? ' <span class="gs-tag av">' + esc(a.tipo.toLowerCase()) + '</span>' : '') +
          '<br>Pagó: ' + esc(a.periodo) + ' por ' + esc(a.medio) + (a.comentario ? '<br><i>"' + esc(a.comentario) + '"</i>' : '') +
          '<div class="acc">' + acc + '</div></div>';
      }).join('') : (le.length ? '' : '<div class="card muted" style="text-align:center">No hay avisos pendientes 👌</div>');
      cont.innerHTML = le.length ? '<h3 style="margin-top:18px">Pagos de eventos</h3>' + le.map(function (a) {
        return '<div class="aviso"><b>' + esc(a.nombre) + '</b> — ' + esc(a.evento) + '<br>Avisó que pagó ' + esc(a.montoTxt) + ' por ' + esc(a.medio) +
          (a.comentario ? '<br><i>"' + esc(a.comentario) + '"</i>' : '') +
          '<div class="acc"><button data-evrech="' + esc(a.id) + '">No llegó</button>' + comp(a.comprobante) + '<button class="si" data-evok="' + esc(a.id) + '" data-medio="' + esc(a.medio) + '">Confirmar pago</button></div></div>';
      }).join('') : '';
    }).catch(function (e) { $('aLista').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
  };
  document.getElementById('vAvisos').addEventListener('click', function (ev) {
    var t = ev.target.closest('button'); if (!t) return;
    if (t.classList.contains('gaComp')) { verComprobante(t.dataset.comp, t); return; }
    if (t.classList.contains('gaPlan')) {
      confirmar('¿Llegó el pago del plan? Se registran todos los meses como pagados, con el descuento del plan.', 'Confirmar', function () {
        api('adminConfirmarPlan', token, Number(t.dataset.fila), t.dataset.medio || 'Transferencia', hoyIso())
          .then(function (r) { toast('Plan registrado: ' + r.meses + ' meses, ' + r.total); cargarAvisos(); }).catch(function (e) { toast(msg(e)); });
      });
    } else if (t.classList.contains('gaFam')) {
      confirmar('¿Llegó el pago? Se registra todo lo pendiente (cuotas y multas) de "' + t.dataset.fam + '".', 'Registrar', function () {
        api('adminPagoFamilia', token, t.dataset.fam, t.dataset.medio || 'Transferencia', hoyIso(), '', Number(t.dataset.fila))
          .then(function (r) { toast('Pago familiar: ' + r.cantidad + ' cuotas, ' + r.total); cargarAvisos(); }).catch(function (e) { toast(msg(e)); });
      });
    }
  });

  /* ================= Ficha: accesos rápidos, sanciones y descuentos vigentes ================= */
  var accesos = document.createElement('div');
  accesos.className = 'ficha-gs';
  accesos.innerHTML = '<button class="btn sec" type="button" data-g="sanciones">Sancionar</button><button class="btn sec" type="button" data-g="descuentos">Descuento o multa</button><button class="btn sec" type="button" data-g="familias">Familia</button>';
  var fCuota = document.getElementById('fCuotaCard');
  fCuota.parentNode.insertBefore(accesos, fCuota);
  accesos.addEventListener('click', function (ev) { var b = ev.target.closest('[data-g]'); if (b && ficha) abrir(b.dataset.g, { nro: ficha.nro }); });

  var cardSit = document.createElement('div');
  cardSit.className = 'card oculto'; cardSit.id = 'fGestion';
  fCuota.parentNode.insertBefore(cardSit, fCuota.nextSibling);
  var pintarPrev = window.pintarFicha;
  window.pintarFicha = function (f) {
    pintarPrev(f);
    var h = '';
    (f.sanciones || []).forEach(function (x) {
      h += '<div class="gs-item"><b>' + esc(x.tipo) + '</b> <span class="gs-tag mal">vigente</span>' +
        '<div class="s">' + (x.tipo === 'Suspensión' ? 'Hasta el ' + esc(x.hasta) + (x.conCuota ? ' · con cuota' : ' · sin cuota') : esc(x.montoTxt)) + ' · ' + esc(x.motivo) + '</div></div>';
    });
    (f.descuentosTemp || []).forEach(function (d) { h += '<div class="gs-item"><b>🏷 ' + esc(d.txt) + '</b><div class="s">' + esc(d.meses) + ' · ' + esc(d.alcance) + '</div></div>'; });
    if (f.familiaInfo) {
      var fi = f.familiaInfo;
      h += '<div class="gs-item"><b>👪 ' + esc(fi.nombre) + '</b>' + (fi.pagaCuotas ? '<span class="gs-tag ok">paga cuotas</span>' : '') + (fi.pagaEventos ? '<span class="gs-tag ok">paga eventos</span>' : '') +
        '<div class="s">' + (fi.responsable ? 'Responsable de pago: ' + esc(fi.responsable) + ' · ' : '') + esc(fi.integrantes.join(' · ')) + '</div></div>';
    }
    cardSit.innerHTML = h ? '<h3>Situación</h3>' + h : '';
    cardSit.classList.toggle('oculto', !h);
  };
})();
