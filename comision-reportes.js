/* Socios CABB — Reportes de tesorería en el panel de la comisión.
 * Caja del período (cuotas + eventos, por medio de pago), movimientos, eventos, morosos y altas.
 * Exporta a Excel (.xlsx, con una hoja por sección) y a PDF (imprimir / guardar como PDF).
 * Se apoya en comision.js.
 */
(function () {
  var rep = null;

  var estilos = document.createElement('style');
  estilos.textContent =
    '.rp-per { display: flex; gap: 6px; overflow-x: auto; padding: 2px 0 8px; }' +
    '.rp-fechas { display: flex; gap: 8px; margin-bottom: 8px; } .rp-fechas > * { flex: 1; }' +
    '.rp-fechas label { margin: 0 0 4px; font-size: 12px; color: var(--gris); display: block; }' +
    '.rp-total { font-size: 30px; font-weight: 700; margin: 2px 0 6px; }' +
    '.rp-barra { display: flex; height: 10px; border-radius: 999px; overflow: hidden; background: var(--linea); margin: 8px 0; }' +
    '.rp-barra span { display: block; height: 100%; }' +
    '.rp-ley { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 13px; }' +
    '.rp-ley i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; }' +
    '.rp-t { width: 100%; border-collapse: collapse; font-size: 13px; }' +
    '.rp-t th { text-align: left; font-weight: 600; color: var(--gris); font-size: 11px; text-transform: uppercase; letter-spacing: .03em; padding: 6px 4px; border-bottom: 1px solid var(--linea); }' +
    '.rp-t td { padding: 7px 4px; border-bottom: 1px solid var(--linea); vertical-align: top; }' +
    '.rp-t td.n, .rp-t th.n { text-align: right; white-space: nowrap; }' +
    '.rp-t tr:last-child td { border-bottom: 0; }' +
    '.rp-t .sub { color: var(--gris); font-size: 12px; }' +
    '.rp-exp { display: flex; gap: 8px; margin: 4px 0 12px; } .rp-exp .btn { margin: 0; }' +
    '.rp-mas { text-align: center; margin-top: 8px; }' +
    '.rp-head { display: none; }' +
    '@media print {' +
    '  body { background: #fff; } .wrap { padding: 0; max-width: none; }' +
    '  header.top, nav.tabs, .volver, .rp-ctrl, .rp-exp, .rp-mas, #toast, #modal { display: none !important; }' +
    '  #vReportes .card { border: 0; padding: 0 0 10px; break-inside: avoid; }' +
    '  #vReportes .rp-t tr { break-inside: avoid; }' +
    '  .rp-head { display: block; margin-bottom: 10px; } .rp-head h1 { font-size: 18px; margin: 0; } .rp-head p { margin: 2px 0 0; color: #555; font-size: 12px; }' +
    '  #rpMovs tr.extra { display: table-row !important; }' +
    '}';
  document.head.appendChild(estilos);

  // ----- Vista -----
  var sec = document.createElement('section');
  sec.id = 'vReportes'; sec.className = 'oculto';
  sec.innerHTML =
    '<button class="volver" data-ir="mas" type="button">‹ Volver</button>' +
    '<div class="rp-head" id="rpHead"></div>' +
    '<div class="rp-ctrl">' +
    '  <h2>Reportes</h2>' +
    '  <div class="rp-per chips" id="rpPer">' +
    '    <button class="chip on" data-p="mes" type="button">Este mes</button>' +
    '    <button class="chip" data-p="ant" type="button">Mes anterior</button>' +
    '    <button class="chip" data-p="anio" type="button">Este año</button>' +
    '    <button class="chip" data-p="anioant" type="button">Año anterior</button>' +
    '    <button class="chip" data-p="otro" type="button">Elegir fechas</button>' +
    '  </div>' +
    '  <div class="rp-fechas oculto" id="rpFechas"><div><label>Desde</label><input type="date" id="rpDesde"></div><div><label>Hasta</label><input type="date" id="rpHasta"></div></div>' +
    '</div>' +
    '<div class="rp-exp"><button class="btn" id="rpXlsx" type="button">Descargar Excel</button><button class="btn sec" id="rpPdf" type="button">Guardar PDF</button></div>' +
    '<div id="rpCuerpo"><div class="muted">Cargando…</div></div>';
  document.querySelector('.wrap').appendChild(sec);
  VISTAS.push('vReportes');

  // Botón de acceso en "Más"
  var cardAcc = document.createElement('div');
  cardAcc.className = 'card';
  cardAcc.innerHTML = '<h3>Reportes</h3><p class="muted" style="margin:0">Caja del mes o del año, cuotas y eventos cobrados, morosos y altas. Se descargan en Excel o PDF.</p>' +
    '<button class="btn" id="bReportes" type="button">Ver reportes</button>';
  var vMas = document.getElementById('vMas');
  vMas.insertBefore(cardAcc, vMas.children[1]);
  document.getElementById('bReportes').addEventListener('click', function () { mostrar('vReportes'); window.scrollTo(0, 0); cargar(); });

  // ----- Períodos -----
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function rango(p) {
    var h = new Date(), y = h.getFullYear(), m = h.getMonth();
    if (p === 'mes') return [new Date(y, m, 1), new Date(y, m + 1, 0)];
    if (p === 'ant') return [new Date(y, m - 1, 1), new Date(y, m, 0)];
    if (p === 'anio') return [new Date(y, 0, 1), new Date(y, 11, 31)];
    if (p === 'anioant') return [new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)];
    return null;
  }
  var per = 'mes';
  (function () { var r = rango('mes'); document.getElementById('rpDesde').value = iso(r[0]); document.getElementById('rpHasta').value = iso(r[1]); })();
  document.getElementById('rpPer').addEventListener('click', function (ev) {
    var c = ev.target.closest('.chip'); if (!c) return;
    per = c.dataset.p;
    document.querySelectorAll('#rpPer .chip').forEach(function (x) { x.classList.toggle('on', x === c); });
    document.getElementById('rpFechas').classList.toggle('oculto', per !== 'otro');
    var r = rango(per);
    if (r) { document.getElementById('rpDesde').value = iso(r[0]); document.getElementById('rpHasta').value = iso(r[1]); }
    cargar();
  });
  ['rpDesde', 'rpHasta'].forEach(function (id) { document.getElementById(id).addEventListener('change', function () { if (per === 'otro') cargar(); }); });

  // ----- Carga y dibujo -----
  var pedido = 0;
  function cargar() {
    var n = ++pedido, d = document.getElementById('rpDesde').value, h = document.getElementById('rpHasta').value;
    document.getElementById('rpCuerpo').innerHTML = '<div class="muted">Cargando…</div>';
    api('adminReporte', token, d, h).then(function (r) { if (n !== pedido) return; rep = r; pintar(); })
      .catch(function (e) { if (n === pedido) document.getElementById('rpCuerpo').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
  }

  var COLORES = { Efectivo: '#2e7d4f', Transferencia: '#34495e', 'Mercado Pago': '#c9a85a', Otro: '#9a978f' };
  function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }

  function pintar() {
    var r = rep, html = '';
    document.getElementById('rpHead').innerHTML = '<h1>' + esc(r.club) + ' — Reporte de tesorería</h1><p>Del ' + esc(r.desde) + ' al ' + esc(r.hasta) + ' · generado el ' + esc(r.generado) + '</p>';

    // Caja
    var medios = Object.keys(r.porMedio).filter(function (k) { return r.porMedio[k] > 0; });
    html += '<div class="card"><h3>Caja del período</h3><div class="muted">' + esc(r.desde) + ' al ' + esc(r.hasta) + '</div>' +
      '<div class="rp-total">' + plata(r.total) + '</div>' +
      '<div class="muted">Cuotas: <b>' + plata(r.totalCuotas) + '</b> (' + r.cantCuotas + ') · Eventos: <b>' + plata(r.totalEventos) + '</b> (' + r.cantEventos + ')</div>';
    if (r.total) {
      html += '<div class="rp-barra">' + medios.map(function (k) { return '<span style="width:' + pct(r.porMedio[k], r.total) + '%;background:' + COLORES[k] + '"></span>'; }).join('') + '</div>' +
        '<div class="rp-ley">' + medios.map(function (k) { return '<span><i style="background:' + COLORES[k] + '"></i>' + esc(k) + ': <b>' + plata(r.porMedio[k]) + '</b> (' + pct(r.porMedio[k], r.total) + '%)</span>'; }).join('') + '</div>';
    }
    html += '</div>';

    // Socios
    var cu = r.cumplimiento;
    html += '<div class="card"><h3>Socios</h3><table class="rp-t">' +
      '<tr><td>Socios activos</td><td class="n"><b>' + r.activos + '</b></td></tr>' +
      '<tr><td>Al día hoy</td><td class="n"><b>' + r.alDia + '</b> (' + pct(r.alDia, r.activos) + '%)</td></tr>' +
      '<tr><td>Con cuotas vencidas hoy</td><td class="n"><b>' + r.morosos.length + '</b> · ' + plata(r.deudaVencida) + '</td></tr>' +
      (cu.generadas ? '<tr><td>Cuotas del período cobradas<div class="sub">De las generadas para esos meses</div></td><td class="n"><b>' + cu.pagas + '/' + cu.generadas + '</b> (' + pct(cu.montoCobrado, cu.montoGenerado) + '% del monto)</td></tr>' : '') +
      '<tr><td>Altas en el período</td><td class="n"><b>' + r.altas.length + '</b></td></tr>' +
      '</table>' +
      (r.altas.length ? '<div class="sub" style="margin-top:6px;font-size:12px;color:var(--gris)">' + r.altas.map(function (a) { return esc(a.nombre) + ' (' + esc(a.fecha) + ')'; }).join(' · ') + '</div>' : '') +
      '</div>';

    // Morosos
    html += '<div class="card"><h3>Morosos (a hoy)</h3>' + (r.morosos.length ?
      '<table class="rp-t"><tr><th>Socio</th><th class="n">Cuotas</th><th class="n">Deuda</th></tr>' +
      r.morosos.map(function (m) {
        return '<tr><td>' + esc(m.nombre) + ' <span class="sub">Nº ' + esc(m.nro) + '</span><div class="sub">' + esc(m.meses) + (m.telefono ? ' · ' + esc(m.telefono) : '') + '</div></td>' +
          '<td class="n">' + m.cuotas + '</td><td class="n"><b>' + plata(m.deuda) + '</b></td></tr>';
      }).join('') + '<tr><td><b>Total</b></td><td></td><td class="n"><b>' + plata(r.deudaVencida) + '</b></td></tr></table>'
      : '<div class="muted">Nadie tiene cuotas vencidas. 🎉</div>') + '</div>';

    // Eventos
    if (r.eventos.length) {
      html += '<div class="card"><h3>Eventos del período</h3><table class="rp-t"><tr><th>Evento</th><th class="n">Anotados</th><th class="n">Recaudado</th></tr>' +
        r.eventos.map(function (e) {
          return '<tr><td>' + esc(e.titulo) + '<div class="sub">' + esc(e.fecha) + (e.esPago ? ' · pagaron ' + e.pagados + (e.pendientes ? ', deben ' + e.pendientes : '') : ' · sin costo') + '</div></td>' +
            '<td class="n">' + e.inscriptos + '</td><td class="n">' + (e.esPago ? plata(e.recaudado) : '—') + '</td></tr>';
        }).join('') + '</table></div>';
    }

    // Movimientos
    html += '<div class="card"><h3>Movimientos (' + r.movimientos.length + ')</h3>' + (r.movimientos.length ?
      '<table class="rp-t" id="rpMovs"><tr><th>Fecha</th><th>Concepto</th><th class="n">Monto</th></tr>' +
      r.movimientos.slice().reverse().map(function (x, i) {
        return '<tr' + (i >= 30 ? ' class="extra oculto"' : '') + '><td style="white-space:nowrap">' + esc(x.fecha.slice(0, 5)) + '</td><td>' + esc(x.quien) +
          '<div class="sub">' + esc(x.tipo === 'Cuota' ? 'Cuota ' + x.detalle : x.detalle) + ' · ' + esc(x.medio) + (x.registro ? ' · ' + esc(x.registro) : '') + '</div></td>' +
          '<td class="n">' + plata(x.monto) + '</td></tr>';
      }).join('') + '</table>' + (r.movimientos.length > 30 ? '<div class="rp-mas"><button class="link" id="rpVerTodos" type="button">Ver los ' + r.movimientos.length + ' movimientos</button></div>' : '')
      : '<div class="muted">No hubo cobros en este período.</div>') + '</div>';

    document.getElementById('rpCuerpo').innerHTML = html;
    var vt = document.getElementById('rpVerTodos');
    if (vt) vt.addEventListener('click', function () { document.querySelectorAll('#rpMovs tr.extra').forEach(function (t) { t.classList.remove('oculto'); }); vt.remove(); });
  }

  // ----- PDF -----
  document.getElementById('rpPdf').addEventListener('click', function () {
    if (!rep) { toast('Esperá a que cargue el reporte'); return; }
    var titulo = document.title;
    document.title = 'Reporte ' + rep.desde.replace(/\//g, '-') + ' al ' + rep.hasta.replace(/\//g, '-');
    window.print();
    setTimeout(function () { document.title = titulo; }, 1000);
  });

  // ----- Excel -----
  var cargandoXlsx = null;
  function libXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (cargandoXlsx) return cargandoXlsx;
    cargandoXlsx = new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = function () { ok(window.XLSX); };
      s.onerror = function () { cargandoXlsx = null; mal(new Error('No se pudo cargar el generador de Excel. Revisá la conexión.')); };
      document.head.appendChild(s);
    });
    return cargandoXlsx;
  }
  function hoja(X, filas, anchos) {
    var ws = X.utils.aoa_to_sheet(filas);
    ws['!cols'] = anchos.map(function (w) { return { wch: w }; });
    return ws;
  }
  function aFecha(t) { var p = String(t).split('/'); return p.length === 3 ? new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0])) : t; }

  document.getElementById('rpXlsx').addEventListener('click', function () {
    if (!rep) { toast('Esperá a que cargue el reporte'); return; }
    var b = this; ocupado(b, true, 'Armando…');
    libXlsx().then(function (X) {
      var r = rep, wb = X.utils.book_new();
      var res = [
        [r.club + ' — Reporte de tesorería'], ['Período', 'Del ' + r.desde + ' al ' + r.hasta], ['Generado', r.generado], [],
        ['CAJA', 'Monto', 'Cantidad'], ['Cuotas', r.totalCuotas, r.cantCuotas], ['Eventos', r.totalEventos, r.cantEventos], ['Total', r.total, r.cantCuotas + r.cantEventos], [],
        ['POR MEDIO DE PAGO', 'Monto']
      ];
      Object.keys(r.porMedio).forEach(function (k) { if (r.porMedio[k] || k !== 'Otro') res.push([k, r.porMedio[k]]); });
      res.push([], ['SOCIOS', 'Cantidad'], ['Activos', r.activos], ['Al día hoy', r.alDia], ['Con cuotas vencidas hoy', r.morosos.length], ['Deuda vencida', r.deudaVencida],
        ['Cuotas del período generadas', r.cumplimiento.generadas], ['Cuotas del período cobradas', r.cumplimiento.pagas], ['Altas en el período', r.altas.length]);
      X.utils.book_append_sheet(wb, hoja(X, res, [32, 16, 10]), 'Resumen');

      X.utils.book_append_sheet(wb, hoja(X, [['Fecha', 'Tipo', 'Nº socio', 'Nombre', 'Concepto', 'Medio', 'Monto', 'Registrado por']].concat(
        r.movimientos.map(function (x) { return [aFecha(x.fecha), x.tipo, x.nro ? Number(x.nro) : '', x.quien, x.detalle, x.medio, x.monto, x.registro]; })),
        [11, 8, 9, 28, 26, 14, 11, 16]), 'Movimientos');

      X.utils.book_append_sheet(wb, hoja(X, [['Nº socio', 'Socio', 'Categoría', 'Teléfono', 'Mail', 'Cuotas vencidas', 'Meses', 'Deuda']].concat(
        r.morosos.map(function (m) { return [Number(m.nro), m.nombre, m.categoria, m.telefono, m.email, m.cuotas, m.meses, m.deuda]; }),
        r.morosos.length ? [['', 'TOTAL', '', '', '', '', '', r.deudaVencida]] : []),
        [9, 28, 12, 16, 26, 10, 34, 12]), 'Morosos');

      X.utils.book_append_sheet(wb, hoja(X, [['Fecha', 'Evento', 'Anotados', 'Socios', 'Pagaron', 'Deben', 'Recaudado']].concat(
        r.eventos.map(function (e) { return [aFecha(e.fecha), e.titulo, e.inscriptos, e.socios, e.esPago ? e.pagados : '', e.esPago ? e.pendientes : '', e.esPago ? e.recaudado : '']; })),
        [11, 32, 10, 8, 9, 8, 12]), 'Eventos');

      X.utils.book_append_sheet(wb, hoja(X, [['Nº socio', 'Socio', 'Fecha de alta', 'Categoría']].concat(
        r.altas.map(function (a) { return [Number(a.nro), a.nombre, aFecha(a.fecha), a.categoria]; })), [9, 28, 13, 12]), 'Altas');

      X.writeFile(wb, 'Reporte CABB ' + r.desde.replace(/\//g, '-') + ' al ' + r.hasta.replace(/\//g, '-') + '.xlsx', { cellDates: true });
    }).catch(function (e) { toast(msg(e)); }).then(function () { ocupado(b, false); });
  });

  // Si sesión vencida o se cambia de vista, nada que limpiar: el reporte se pide cada vez que se entra.
})();
