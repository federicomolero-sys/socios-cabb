/* Comisión CABB — Categorías de socio (General, Menores, Jubilados, Sindicato…).
 * Cada categoría tiene su cuota (o la cuota general) y un descuento fijo en % o en $,
 * que se aplica solo al generar las cuotas de los socios de esa categoría.
 */
(function () {
  function e(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function plata(n) { return '$ ' + Math.round(Number(n) || 0).toLocaleString('es-AR'); }

  var css = document.createElement('style');
  css.textContent =
    '.ct-it{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:10px 0;border-top:1px solid var(--linea)}' +
    '.ct-it:first-child{border-top:0}.ct-it b{display:block;font-size:15px}.ct-it .s{color:var(--gris);font-size:12.5px}' +
    '.ct-it .fin{font-weight:700;color:var(--verde);white-space:nowrap;text-align:right}.ct-it .fin small{display:block;font-weight:400;color:var(--gris);font-size:11.5px}' +
    '.ct-form{background:var(--crema);border-radius:10px;padding:12px;margin-top:12px}.ct-form h3{margin:0 0 4px}' +
    '.ct-tag{display:inline-block;background:#e6f2ea;color:#1f6b3a;border-radius:6px;padding:1px 6px;font-size:12px;font-weight:600;margin-left:4px}';
  document.head.appendChild(css);

  var card = document.createElement('div');
  card.className = 'card'; card.id = 'ctCard';
  card.innerHTML = '<details id="ctDet"><summary style="font-weight:600;cursor:pointer">🏷️ Categorías y cuotas</summary><div id="ctCuerpo" style="margin-top:10px"><div class="muted">Cargando…</div></div></details>';
  var mas = document.getElementById('vMas');
  var ref = document.getElementById('dcCard') || document.getElementById('fiCard') || document.getElementById('cuCard');
  if (mas) { if (ref && ref.parentNode === mas) mas.insertBefore(card, ref); else mas.appendChild(card); }

  var D = null, editando = null;

  function descTxt(c) { return c.descValor > 0 ? (c.descTipo === '$' ? plata(c.descValor) + ' de descuento' : c.descValor + '% de descuento') : ''; }

  function pintar() {
    var lista = D.categorias.map(function (c) {
      var cuota = c.monto > 0 ? plata(c.monto) : 'cuota general (' + plata(D.cuotaBase) + ')';
      return '<div class="ct-it" data-n="' + e(c.nombre) + '"><div><b>' + e(c.nombre) + (c.descValor > 0 ? '<span class="ct-tag">' + (c.descTipo === '$' ? '−' + plata(c.descValor) : '−' + c.descValor + '%') + '</span>' : '') + '</b>' +
        '<div class="s">' + cuota + (descTxt(c) ? ' · ' + descTxt(c) : '') + ' · ' + c.socios + ' socio' + (c.socios === 1 ? '' : 's') + '</div>' +
        (c.descripcion ? '<div class="s">' + e(c.descripcion) + '</div>' : '') +
        '<div style="margin-top:4px"><button class="link ctEditar" type="button">Editar</button> · <button class="link ctBorrar" type="button" style="color:var(--mal)">Borrar</button></div></div>' +
        '<div class="fin">' + plata(c.cuotaFinal) + '<small>por mes</small></div></div>';
    }).join('');
    document.getElementById('ctCuerpo').innerHTML =
      '<div class="muted">La cuota de cada socio sale de su categoría. Si la categoría no tiene cuota propia, usa la cuota general. El descuento se aplica solo al generar las cuotas, y se suma a los de grupo, familia o individuales.</div>' +
      '<div style="margin-top:8px">' + (lista || '<div class="muted">No hay categorías cargadas.</div>') + '</div>' +
      '<div id="ctFormBox"></div>' +
      (editando === null ? '<button class="btn sec" id="ctNueva" type="button">+ Nueva categoría</button>' : '');
    if (editando !== null) pintarForm();
    refrescarSelects();
  }

  function pintarForm() {
    var c = editando || { nombre: '', monto: 0, descTipo: '%', descValor: 0, descripcion: '' };
    var nueva = !editando || !editando.nombre;
    document.getElementById('ctFormBox').innerHTML = '<div class="ct-form"><h3>' + (nueva ? 'Nueva categoría' : 'Editar: ' + e(c.nombre)) + '</h3>' +
      '<label>Nombre</label><input id="ctNombre" maxlength="40" value="' + e(c.nombre) + '" placeholder="Ej.: Jubilados, Sindicato">' +
      '<label>Cuota mensual</label><input id="ctMonto" type="number" min="0" step="100" value="' + (c.monto > 0 ? c.monto : '') + '" placeholder="Vacío = cuota general (' + plata(D.cuotaBase) + ')">' +
      '<div class="fila2"><div><label>Descuento</label><input id="ctDesc" type="number" min="0" step="1" value="' + (c.descValor > 0 ? c.descValor : '') + '" placeholder="0"></div>' +
      '<div><label>Tipo</label><select id="ctTipo"><option value="%"' + (c.descTipo !== '$' ? ' selected' : '') + '>% de la cuota</option><option value="$"' + (c.descTipo === '$' ? ' selected' : '') + '>$ fijo</option></select></div></div>' +
      '<label>Descripción (opcional)</label><input id="ctDescr" maxlength="120" value="' + e(c.descripcion) + '" placeholder="Ej.: Presentar carnet de jubilado">' +
      '<div class="muted" id="ctPrev" style="margin-top:8px"></div>' +
      (nueva ? '' : '<label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="ctRecalc" checked style="width:auto"> Aplicar también a las cuotas pendientes ya generadas (desde este mes)</label>') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn" id="ctGuardar" type="button">Guardar</button><button class="btn sec" id="ctCancelar" type="button">Cancelar</button></div>' +
      '<div class="error" id="ctErr"></div></div>';
    previa();
  }

  function previa() {
    var p = document.getElementById('ctPrev'); if (!p) return;
    var monto = Number(document.getElementById('ctMonto').value) || 0, base = monto > 0 ? monto : D.cuotaBase;
    var v = Number(document.getElementById('ctDesc').value) || 0, tipo = document.getElementById('ctTipo').value;
    var d = v > 0 ? (tipo === '$' ? v : Math.round(base * v / 100)) : 0;
    p.innerHTML = 'Así queda: <b>' + plata(base) + (d ? ' − ' + plata(d) + ' = ' + plata(Math.max(base - d, 0)) : '') + '</b> por mes (antes de otros descuentos del socio).';
  }

  /** Mantiene al día los desplegables de categoría del alta y de "Editar datos". */
  function refrescarSelects() {
    if (!D) return;
    var nombres = D.categorias.map(function (c) { return c.nombre; });
    ['aCategoria', 'eCategoria'].forEach(function (id) {
      var s = document.getElementById(id); if (!s) return;
      var actual = s.value, opts = nombres.slice();
      if (actual && opts.indexOf(actual) < 0) opts.push(actual);
      if (!opts.length) opts = ['General'];
      s.innerHTML = opts.map(function (k) { return '<option' + (k === actual ? ' selected' : '') + '>' + e(k) + '</option>'; }).join('');
    });
  }

  function cargar() {
    return api('adminCategoriasDet', token).then(function (r) { D = r; if (document.getElementById('ctDet').open) pintar(); else refrescarSelects(); })
      .catch(function (x) { if (document.getElementById('ctDet').open) document.getElementById('ctCuerpo').innerHTML = '<div class="error">' + e(msg(x)) + '</div>'; });
  }
  document.getElementById('ctDet').addEventListener('toggle', function () { if (this.open) { editando = null; cargar(); } });

  // Al abrir "Nuevo socio", que el desplegable tenga todas las categorías
  var vAlta = document.getElementById('vAlta');
  if (vAlta) new MutationObserver(function () { if (!vAlta.classList.contains('oculto') && window.token) cargar(); }).observe(vAlta, { attributes: true, attributeFilter: ['class'] });

  card.addEventListener('input', function (ev) { if (/^ct(Monto|Desc|Tipo)$/.test(ev.target.id)) previa(); });
  card.addEventListener('change', function (ev) { if (ev.target.id === 'ctTipo') previa(); });
  card.addEventListener('click', function (ev) {
    var t = ev.target, it = t.closest('.ct-it');
    if (t.id === 'ctNueva') { editando = {}; pintar(); document.getElementById('ctNombre').focus(); return; }
    if (t.id === 'ctCancelar') { editando = null; pintar(); return; }
    if (t.classList.contains('ctEditar') && it) {
      editando = D.categorias.filter(function (c) { return c.nombre === it.dataset.n; })[0] || null; pintar();
      document.getElementById('ctFormBox').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (t.classList.contains('ctBorrar') && it) {
      var c = D.categorias.filter(function (x) { return x.nombre === it.dataset.n; })[0];
      if (!c) return;
      if (!c.socios) {
        confirmar('¿Borrar la categoría "' + e(c.nombre) + '"?', 'Borrar', function () {
          api('adminBorrarCategoria', token, c.nombre).then(function () { toast('Categoría borrada'); cargar(); }).catch(function (x) { toast(msg(x)); });
        }, 'peligro');
      } else {
        var otras = D.categorias.filter(function (x) { return x.nombre !== c.nombre; });
        if (!otras.length) { toast('Es la única categoría: creá otra antes de borrarla.'); return; }
        modal('<p><b>"' + e(c.nombre) + '" tiene ' + c.socios + ' socio' + (c.socios === 1 ? '' : 's') + '.</b> ¿A qué categoría los pasamos?</p>' +
          '<select id="ctMover">' + otras.map(function (x) { return '<option>' + e(x.nombre) + '</option>'; }).join('') + '</select>' +
          '<p class="muted">Las cuotas ya generadas no cambian; las próximas salen con la categoría nueva.</p>',
          [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Pasarlos y borrar', clase: 'peligro', fn: function () {
            var s = document.getElementById('ctMover'), destino = s ? s.value : otras[0].nombre;
            api('adminBorrarCategoria', token, c.nombre, destino)
              .then(function (r) { toast('Categoría borrada · ' + r.movidos + ' socio' + (r.movidos === 1 ? '' : 's') + ' pasado' + (r.movidos === 1 ? '' : 's') + ' a ' + destino); cargar(); })
              .catch(function (x) { toast(msg(x)); });
          } }]);
      }
      return;
    }
    if (t.id === 'ctGuardar') {
      var err = document.getElementById('ctErr'); err.textContent = '';
      var anterior = editando && editando.nombre ? editando.nombre : null;
      var rec = document.getElementById('ctRecalc');
      var datos = { nombre: document.getElementById('ctNombre').value, monto: document.getElementById('ctMonto').value,
        descValor: document.getElementById('ctDesc').value, descTipo: document.getElementById('ctTipo').value,
        descripcion: document.getElementById('ctDescr').value, recalcular: !!(rec && rec.checked) };
      if (!String(datos.nombre).trim()) { err.textContent = 'Poné un nombre a la categoría.'; return; }
      ocupado(t, true, 'Guardando…');
      api('adminGuardarCategoria', token, datos, anterior).then(function (r) {
        editando = null;
        var extra = [];
        if (r.renombrados) extra.push(r.renombrados + ' socio' + (r.renombrados === 1 ? '' : 's') + ' actualizado' + (r.renombrados === 1 ? '' : 's'));
        if (r.recalculadas) extra.push(r.recalculadas + ' cuota' + (r.recalculadas === 1 ? '' : 's') + ' recalculada' + (r.recalculadas === 1 ? '' : 's'));
        toast('Categoría guardada' + (extra.length ? ' · ' + extra.join(' · ') : ''));
        return cargar();
      }).catch(function (x) { err.textContent = msg(x); ocupado(t, false); });
    }
  });
})();
