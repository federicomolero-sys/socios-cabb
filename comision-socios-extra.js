/* Socios CABB — datos ampliados del socio en el panel de la comisión:
 * género, fecha de nacimiento, grupo familiar, grupos (con descuento), descuento individual,
 * motivo de bajas/suspensiones e historial de estados. Además "Grupos y descuentos" en Más.
 * Se apoya en comision.js.
 */
(function () {
  var GENEROS = ['Masculino', 'Femenino', 'Otro', 'Prefiere no decir'];
  var infoGrupos = null; // { grupos, familiar, familiarDesde, familias }

  var estilos = document.createElement('style');
  estilos.textContent =
    '.gchips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }' +
    '.gchip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--linea); background: #fff; border-radius: 999px; padding: 6px 11px; font-size: 13px; cursor: pointer; user-select: none; }' +
    '.gchip input { width: auto; margin: 0; }' +
    '.gchip.on { background: var(--azul); border-color: var(--azul); color: #fff; }' +
    '.cuota-calc { font-size: 14px; } .cuota-calc .m { font-size: 22px; font-weight: 700; }' +
    '.cuota-calc .d { color: var(--gris); font-size: 13px; margin-top: 2px; }' +
    '.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }' +
    '.tag { font-size: 12px; background: var(--crema); border-radius: 999px; padding: 3px 9px; }' +
    '.hist { font-size: 13px; border-top: 1px solid var(--linea); padding: 7px 0; } .hist:first-child { border-top: 0; }' +
    '.hist .t { font-weight: 600; } .hist .s { color: var(--gris); font-size: 12px; }' +
    '.grp { display: flex; align-items: center; gap: 8px; border-top: 1px solid var(--linea); padding: 9px 0; font-size: 14px; }' +
    '.grp:first-child { border-top: 0; } .grp .n { flex: 1; } .grp .s { color: var(--gris); font-size: 12px; }' +
    '.grp button { flex: none; }';
  document.head.appendChild(estilos);

  function opciones(lista, vacio) {
    return (vacio !== undefined ? '<option value="">' + esc(vacio) + '</option>' : '') + lista.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
  }
  function chipsGrupos(cont, disponibles, elegidos, onChange) {
    var sel = elegidos.map(function (x) { return x.toLowerCase(); });
    cont.innerHTML = disponibles.length ? disponibles.map(function (g) {
      var on = sel.indexOf(g.toLowerCase()) >= 0;
      return '<label class="gchip' + (on ? ' on' : '') + '"><input type="checkbox" value="' + esc(g) + '"' + (on ? ' checked' : '') + '>' + esc(g) + '</label>';
    }).join('') : '<span class="muted">Todavía no hay grupos. Se crean en Más → Grupos y descuentos.</span>';
    cont.onchange = function (ev) {
      if (ev.target.type === 'checkbox') ev.target.parentNode.classList.toggle('on', ev.target.checked);
      if (onChange) onChange();
    };
  }
  function gruposElegidos(cont) {
    return Array.prototype.map.call(cont.querySelectorAll('input:checked'), function (i) { return i.value; }).join(', ');
  }
  function cargarInfoGrupos() {
    return api('adminGrupos', token).then(function (g) { infoGrupos = g; pintarFamiliasDatalist(); return g; });
  }
  function pintarFamiliasDatalist() {
    var dl = document.getElementById('dlFamilias');
    if (dl && infoGrupos) dl.innerHTML = infoGrupos.familias.map(function (f) { return '<option value="' + esc(f.nombre) + '">'; }).join('');
  }
  var dl = document.createElement('datalist'); dl.id = 'dlFamilias'; document.body.appendChild(dl);

  /* ================= Ficha: resumen de cuota, grupos e historial ================= */
  var cardCuota = document.createElement('div');
  cardCuota.className = 'card'; cardCuota.id = 'fCuotaCard';
  var cardPago = document.getElementById('fPendientes').closest('.card');
  cardPago.parentNode.insertBefore(cardCuota, cardPago);

  var cardHist = document.createElement('div');
  cardHist.className = 'card oculto'; cardHist.id = 'fHistEstados';
  var cardEditar = document.getElementById('fEditarDet').closest('.card');
  cardEditar.parentNode.insertBefore(cardHist, cardEditar);

  // Campos nuevos en "Editar datos"
  var obsLabel = document.getElementById('eObs').previousElementSibling;
  var extra = document.createElement('div');
  extra.innerHTML =
    '<div id="eMotivoBox" class="oculto"><label>Motivo del cambio de estado (queda en el historial)</label><input id="eMotivo" placeholder="Ej.: falta de pago, se mudó, sanción…"></div>' +
    '<div class="fila2"><div><label>Fecha de nacimiento</label><input id="eNac" type="date"></div>' +
    '<div><label>Género</label><select id="eGenero">' + opciones(GENEROS, 'Sin dato') + '</select></div></div>' +
    '<label>Grupo familiar</label><input id="eFamilia" list="dlFamilias" placeholder="Ej.: Familia Pérez (mismo nombre para todos)">' +
    '<label>Grupos</label><div class="gchips" id="eGrupos"></div>' +
    '<div class="fila2"><div><label>Descuento individual</label><input id="eDescInd" placeholder="Ej.: 20% o 1500"></div>' +
    '<div><label>Motivo del descuento</label><input id="eDescMot"></div></div>';
  obsLabel.parentNode.insertBefore(extra, obsLabel);
  var estadoOriginal = '';
  document.getElementById('eEstado').addEventListener('change', function () {
    document.getElementById('eMotivoBox').classList.toggle('oculto', this.value === estadoOriginal);
  });

  var pintarOriginal = window.pintarFicha;
  window.pintarFicha = function (f) {
    pintarOriginal(f);
    // Resumen de la cuota
    var cc = f.cuotaCalc, tags = [];
    if (f.genero) tags.push(f.genero);
    if (f.familia) tags.push('👪 ' + f.familia);
    String(f.grupos || '').split(',').map(function (x) { return x.trim(); }).filter(String).forEach(function (g) { tags.push(g); });
    cardCuota.innerHTML = '<h3>Cuota mensual</h3>' + (cc ?
      '<div class="cuota-calc"><div class="m">' + esc(cc.montoTxt) + '</div>' +
      (cc.descuento ? '<div class="d">Base ' + esc(cc.baseTxt) + ' − ' + esc(cc.descuentoTxt) + ' (' + esc(cc.detalle) + ')</div>' : '<div class="d">Sin descuentos · categoría ' + esc(f.categoria || 'General') + '</div>') +
      (f.descMotivo && f.descIndividual ? '<div class="d">Motivo del descuento individual: ' + esc(f.descMotivo) + '</div>' : '') + '</div>'
      : '<div class="muted">—</div>') +
      (tags.length ? '<div class="tags">' + tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' : '');
    // Historial de estados
    var h = f.historial || [];
    cardHist.classList.toggle('oculto', !h.length);
    cardHist.innerHTML = '<h3>Historial de estado</h3>' + h.map(function (x) {
      return '<div class="hist"><span class="t">' + esc(x.tipo) + '</span> · ' + esc(x.fecha) + (x.detalle ? '<div>' + esc(x.detalle) + '</div>' : '') +
        (x.usuario ? '<div class="s">por ' + esc(x.usuario) + '</div>' : '') + '</div>';
    }).join('');
    // Descuento en el historial de cuotas
    var filas = document.querySelectorAll('#fHistorial .cuota');
    f.cuotas.forEach(function (c, i) {
      if (c.descuento && filas[i]) {
        var det = filas[i].querySelector('.det');
        if (det) det.insertAdjacentHTML('beforeend', (det.textContent ? ' · ' : '') + '<span title="Descuento">🏷 ' + esc(c.descuento) + '</span>');
      }
    });
    // Formulario de edición
    estadoOriginal = f.estado || 'Activo';
    document.getElementById('eMotivoBox').classList.add('oculto'); document.getElementById('eMotivo').value = '';
    document.getElementById('eNac').value = f.nacimientoIso || '';
    document.getElementById('eGenero').value = f.genero || '';
    document.getElementById('eFamilia').value = f.familia || '';
    document.getElementById('eDescInd').value = f.descIndividual || '';
    document.getElementById('eDescMot').value = f.descMotivo || '';
    chipsGrupos(document.getElementById('eGrupos'), f.gruposDisponibles || [], String(f.grupos || '').split(',').map(function (x) { return x.trim(); }).filter(String));
    if (!infoGrupos) cargarInfoGrupos().catch(function () {});
  };

  // Reemplazo el botón Guardar para mandar también los campos nuevos
  var bViejo = document.getElementById('bGuardar');
  var bNuevo = bViejo.cloneNode(true);
  bViejo.parentNode.replaceChild(bNuevo, bViejo);
  bNuevo.addEventListener('click', function () {
    var b = bNuevo, err = document.getElementById('eEditar'); err.textContent = '';
    var datos = {
      Apellido: $('eApellido').value, Nombre: $('eNombre').value, Email: $('eEmail').value, Telefono: $('eTelefono').value, Domicilio: $('eDomicilio').value,
      Categoria: $('eCategoria').value, Estado: $('eEstado').value, Observaciones: $('eObs').value,
      FechaNacimiento: $('eNac').value, Genero: $('eGenero').value, GrupoFamiliar: $('eFamilia').value.trim(),
      Grupos: gruposElegidos($('eGrupos')), DescIndividual: $('eDescInd').value.trim(), DescMotivo: $('eDescMot').value.trim(),
      MotivoEstado: $('eMotivo').value.trim()
    };
    var guardar = function () {
      ocupado(b, true, 'Guardando…');
      api('adminEditar', token, ficha.nro, datos).then(function () { toast('Datos guardados'); socios = []; infoGrupos = null; abrirFicha(ficha.nro, vistaAnterior); })
        .catch(function (e) { err.textContent = msg(e); })
        .then(function () { ocupado(b, false); });
    };
    if (datos.Estado !== estadoOriginal && datos.Estado !== 'Activo') {
      confirmar('¿Pasar a ' + ficha.nombre + ' ' + ficha.apellido + ' a "' + datos.Estado + '"? ' +
        (datos.Estado === 'Baja' ? 'Deja de generar cuotas y no puede entrar a la app.' : 'Deja de generar cuotas hasta que se reactive.'), 'Sí, cambiar', guardar, 'peligro');
    } else guardar();
  });

  /* ================= Alta: campos nuevos ================= */
  var fAlta = document.getElementById('fAlta');
  var obsAlta = fAlta.querySelector('[name=Observaciones]').previousElementSibling;
  var extraAlta = document.createElement('div');
  extraAlta.innerHTML =
    '<label>Género</label><select name="Genero">' + opciones(GENEROS, 'Sin dato') + '</select>' +
    '<label>Grupo familiar</label><input name="GrupoFamiliar" list="dlFamilias" placeholder="Si tiene familiares socios: mismo nombre para todos">' +
    '<label>Grupos</label><div class="gchips" id="aGrupos"></div><input type="hidden" name="Grupos" id="aGruposVal">' +
    '<div class="fila2"><div><label>Descuento individual</label><input name="DescIndividual" placeholder="Ej.: 20% o 1500"></div>' +
    '<div><label>Motivo del descuento</label><input name="DescMotivo"></div></div>';
  obsAlta.parentNode.insertBefore(extraAlta, obsAlta);
  function prepararAlta() {
    var c = document.getElementById('aGrupos');
    var pintar = function () { chipsGrupos(c, infoGrupos ? infoGrupos.grupos.map(function (g) { return g.nombre; }) : [], [], function () { document.getElementById('aGruposVal').value = gruposElegidos(c); }); };
    pintar();
    cargarInfoGrupos().then(pintar).catch(function () {});
  }
  fAlta.addEventListener('reset', function () { setTimeout(function () { document.querySelectorAll('#aGrupos .gchip').forEach(function (x) { x.classList.remove('on'); }); document.getElementById('aGruposVal').value = ''; }, 0); });

  /* ================= Más: Grupos y descuentos ================= */
  var vMas = document.getElementById('vMas');
  var cardG = document.createElement('div');
  cardG.className = 'card';
  cardG.innerHTML = '<details id="gDet"><summary style="font-weight:600;cursor:pointer">Grupos y descuentos</summary>' +
    '<p class="muted">Los grupos sirven para descuentos (ej.: Jubilados 30%) y para las estadísticas (ej.: Mujeres, sin descuento). Se asignan desde la ficha de cada socio. Los descuentos se aplican en las cuotas que se generen de acá en adelante.</p>' +
    '<div id="gLista"></div>' +
    '<h3 style="margin-top:14px" id="gFormTit">Nuevo grupo</h3>' +
    '<label>Nombre</label><input id="gNombre" maxlength="40" placeholder="Ej.: Jubilados">' +
    '<div class="fila2"><div><label>Descuento</label><input id="gValor" type="number" min="0" step="1" value="0"></div>' +
    '<div><label>Tipo</label><select id="gTipo"><option value="%">% de la cuota</option><option value="$">$ fijo</option></select></div></div>' +
    '<label>Descripción (opcional)</label><input id="gDesc" maxlength="120">' +
    '<div class="fila2"><button class="btn" id="gGuardar" type="button">Guardar grupo</button><button class="btn sec oculto" id="gCancelar" type="button">Cancelar</button></div>' +
    '<div class="error" id="gErr"></div>' +
    '<h3 style="margin-top:18px">Descuento por grupo familiar</h3>' +
    '<div class="fila2"><div><label>Descuento (%)</label><input id="gFam" type="number" min="0" max="100" step="1"></div>' +
    '<div><label>Desde el integrante Nº</label><input id="gFamDesde" type="number" min="2" step="1"></div></div>' +
    '<button class="btn sec" id="gFamGuardar" type="button">Guardar descuento familiar</button>' +
    '<div id="gFamilias" style="margin-top:10px"></div>' +
    '</details>';
  vMas.insertBefore(cardG, document.getElementById('bSalir'));
  var editando = null;

  function pintarGrupos() {
    var g = infoGrupos;
    document.getElementById('gLista').innerHTML = g.grupos.length ? g.grupos.map(function (x) {
      return '<div class="grp" data-g="' + esc(x.nombre) + '"><div class="n"><b>' + esc(x.nombre) + '</b> · ' + (x.valor ? (x.tipo === '%' ? x.valor + '%' : plata(x.valor)) : 'sin descuento') +
        '<div class="s">' + x.socios + ' socio' + (x.socios === 1 ? '' : 's') + (x.descripcion ? ' · ' + esc(x.descripcion) : '') + '</div></div>' +
        '<button class="mini gEdit" type="button">editar</button><button class="mini gBorrar" type="button">borrar</button></div>';
    }).join('') : '<div class="muted">Todavía no hay grupos.</div>';
    document.getElementById('gFam').value = g.familiar; document.getElementById('gFamDesde').value = g.familiarDesde;
    document.getElementById('gFamilias').innerHTML = g.familias.length ?
      '<div class="muted" style="margin-bottom:4px">Grupos familiares cargados (' + g.familias.length + '):</div>' + g.familias.map(function (f) {
        return '<div class="hist"><span class="t">' + esc(f.nombre) + '</span><div class="s">' + f.integrantes.map(esc).join(' · ') + '</div></div>';
      }).join('') : '<div class="muted">Ningún socio tiene grupo familiar cargado todavía.</div>';
  }
  function limpiarForm() {
    editando = null;
    ['gNombre', 'gDesc'].forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('gValor').value = 0; document.getElementById('gTipo').value = '%';
    document.getElementById('gFormTit').textContent = 'Nuevo grupo'; document.getElementById('gCancelar').classList.add('oculto');
  }
  function recargarGrupos() {
    document.getElementById('gLista').innerHTML = '<div class="muted">Cargando…</div>';
    cargarInfoGrupos().then(pintarGrupos).catch(function (e) { document.getElementById('gLista').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
  }
  document.getElementById('gDet').addEventListener('toggle', function () { if (this.open) recargarGrupos(); });
  document.getElementById('gLista').addEventListener('click', function (ev) {
    var row = ev.target.closest('.grp'); if (!row) return;
    var g = infoGrupos.grupos.filter(function (x) { return x.nombre === row.dataset.g; })[0]; if (!g) return;
    if (ev.target.classList.contains('gEdit')) {
      editando = g.nombre;
      document.getElementById('gNombre').value = g.nombre; document.getElementById('gValor').value = g.valor;
      document.getElementById('gTipo').value = g.tipo; document.getElementById('gDesc').value = g.descripcion;
      document.getElementById('gFormTit').textContent = 'Editar "' + g.nombre + '"'; document.getElementById('gCancelar').classList.remove('oculto');
      document.getElementById('gNombre').focus();
    } else if (ev.target.classList.contains('gBorrar')) {
      confirmar('¿Borrar el grupo "' + g.nombre + '"? Se les quita a ' + g.socios + ' socio' + (g.socios === 1 ? '' : 's') + '. Las cuotas ya generadas no cambian.', 'Borrar', function () {
        api('adminBorrarGrupo', token, g.nombre).then(function () { toast('Grupo borrado'); limpiarForm(); recargarGrupos(); }).catch(function (e) { toast(msg(e)); });
      }, 'peligro');
    }
  });
  document.getElementById('gCancelar').addEventListener('click', limpiarForm);
  document.getElementById('gGuardar').addEventListener('click', function () {
    var b = this, err = document.getElementById('gErr'); err.textContent = '';
    ocupado(b, true, 'Guardando…');
    api('adminGuardarGrupo', token, { nombre: document.getElementById('gNombre').value, valor: document.getElementById('gValor').value,
      tipo: document.getElementById('gTipo').value, descripcion: document.getElementById('gDesc').value }, editando)
      .then(function () { toast('Grupo guardado'); limpiarForm(); recargarGrupos(); })
      .catch(function (e) { err.textContent = msg(e); }).then(function () { ocupado(b, false); });
  });
  document.getElementById('gFamGuardar').addEventListener('click', function () {
    var b = this; ocupado(b, true, 'Guardando…');
    api('adminDescuentoFamiliar', token, document.getElementById('gFam').value, document.getElementById('gFamDesde').value)
      .then(function () { toast('Descuento familiar guardado'); recargarGrupos(); })
      .catch(function (e) { toast(msg(e)); }).then(function () { ocupado(b, false); });
  });

  // Al entrar a "Nuevo socio", cargar grupos y familias
  var irPrevio = window.ir;
  window.ir = function (nombre) {
    irPrevio.apply(this, arguments);
    if (nombre === 'alta') prepararAlta();
  };
})();
