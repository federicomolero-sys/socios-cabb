/* Socios CABB — Pestaña "Estadísticas" del panel de la comisión.
 * Fluctuación de socios (altas, bajas, suspensiones, sanciones), demografía por edad y género,
 * ingresos por cuotas y eventos por mes o año, y desglose de cuotas por categoría, descuento,
 * grupo, género y edad. Todo filtrable. Los datos llegan en crudo y se agrupan acá.
 * Se apoya en comision.js.
 */
(function () {
  var D = null;          // datos crudos del servidor
  var porNro = {};       // socio por número
  var est = { vista: 'mes', anio: String(new Date().getFullYear()), genero: '', edad: '', categoria: '', grupo: '', desglose: 'descuento' };

  var FRANJAS = [['0-11', 'Menores de 12', 0, 11], ['12-17', '12 a 17', 12, 17], ['18-29', '18 a 29', 18, 29], ['30-44', '30 a 44', 30, 44],
                 ['45-59', '45 a 59', 45, 59], ['60-64', '60 a 64', 60, 64], ['65+', '65 o más', 65, 200]];
  var MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  // Paleta categórica validada (orden fijo, nunca se cicla)
  var C = { s1: '#2a78d6', s2: '#eb6834', s3: '#1baf7a', s4: '#eda100', s5: '#e87ba4', s6: '#008300', s7: '#6250d6', otro: '#a3a29b' };
  var COL_GENERO = { 'Masculino': C.s1, 'Femenino': C.s2, 'Otro': C.s3, 'Prefiere no decir': C.s4, 'Sin dato': C.otro };

  var estilos = document.createElement('style');
  estilos.textContent =
    'nav.tabs button[data-ir=estadisticas] { font-size: 10px; letter-spacing: -.01em; }' +
    '.es-filtros { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }' +
    '.es-filtros select { padding: 9px; font-size: 14px; }' +
    '.es-filtros .full { grid-column: 1 / -1; }' +
    '.es-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }' +
    '.es-kpi { background: var(--papel); border: 1px solid var(--linea); border-radius: 12px; padding: 10px; }' +
    '.es-kpi .v { font-size: 22px; font-weight: 700; margin-top: 2px; } .es-kpi .l { font-size: 11px; color: var(--gris); text-transform: uppercase; letter-spacing: .03em; }' +
    '.es-kpi .s { font-size: 11px; color: var(--gris); margin-top: 2px; }' +
    '.es-graf { width: 100%; height: auto; display: block; margin: 4px 0; }' +
    '.es-graf text { font-family: inherit; font-size: 17px; fill: #52514e; }' +
    '.es-graf .eje { stroke: #e3e0d8; stroke-width: 1; } .es-graf .base { stroke: #b9b6ad; stroke-width: 1; }' +
    '.es-graf rect.b:hover, .es-graf rect.b:focus { opacity: .8; }' +
    '.es-ley { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 12px; margin: 2px 0 6px; }' +
    '.es-ley i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; }' +
    '.es-t { width: 100%; border-collapse: collapse; font-size: 12.5px; }' +
    '.es-t th { text-align: right; font-weight: 600; color: var(--gris); font-size: 10.5px; text-transform: uppercase; letter-spacing: .03em; padding: 5px 3px; border-bottom: 1px solid var(--linea); white-space: nowrap; }' +
    '.es-t th:first-child, .es-t td:first-child { text-align: left; }' +
    '.es-t td { padding: 6px 3px; border-bottom: 1px solid var(--linea); text-align: right; white-space: nowrap; }' +
    '.es-t td:first-child { white-space: normal; } .es-t tr.tot td { font-weight: 700; border-bottom: 0; }' +
    '.es-scroll { overflow-x: auto; } .es-nota { font-size: 12px; color: var(--gris); margin-top: 6px; }' +
    '.es-tip { position: fixed; z-index: 50; pointer-events: none; background: #1d1d1b; color: #fff; font-size: 12px; padding: 6px 8px; border-radius: 8px; max-width: 220px; line-height: 1.35; }' +
    '.es-sel { display: flex; gap: 6px; overflow-x: auto; padding: 2px 0 8px; }' +
    '.es-mov { font-size: 13px; border-top: 1px solid var(--linea); padding: 7px 0; } .es-mov:first-child { border-top: 0; }' +
    '.es-mov .s { color: var(--gris); font-size: 12px; }';
  document.head.appendChild(estilos);

  // ---------- pestaña y vista ----------
  var nav = document.getElementById('nav');
  var tab = document.createElement('button');
  tab.setAttribute('data-ir', 'estadisticas');
  tab.innerHTML = '<span class="i">▥</span>Estadísticas';
  nav.insertBefore(tab, nav.querySelector('[data-ir=mas]'));

  var sec = document.createElement('section');
  sec.id = 'vEstad'; sec.className = 'oculto';
  sec.innerHTML =
    '<div class="fila2" style="align-items:center;margin-bottom:6px"><h2 style="margin:0">Estadísticas</h2>' +
    '<button class="btn sec" id="esXlsx" type="button" style="flex:0 0 auto;width:auto;margin:0;padding:8px 12px;font-size:13px">Excel</button></div>' +
    '<div class="pestanas" id="esVista"><button class="on" data-v="mes" type="button">Por mes</button><button data-v="anio" type="button">Por año</button></div>' +
    '<div class="es-filtros">' +
    '  <select id="esAnio" aria-label="Año"></select>' +
    '  <select id="esCategoria" aria-label="Categoría"></select>' +
    '  <select id="esGenero" aria-label="Género"></select>' +
    '  <select id="esEdad" aria-label="Edad"></select>' +
    '  <select id="esGrupo" class="full" aria-label="Grupo o descuento"></select>' +
    '</div>' +
    '<div id="esCuerpo"><div class="muted">Cargando…</div></div>';
  document.querySelector('.wrap').appendChild(sec);
  VISTAS.push('vEstad');

  var irPrevio = window.ir;
  window.ir = function (nombre) {
    if (nombre !== 'estadisticas') return irPrevio.apply(this, arguments);
    document.querySelectorAll('nav.tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.ir === 'estadisticas'); });
    mostrar('vEstad'); window.scrollTo(0, 0); cargar();
  };

  var tip = document.createElement('div'); tip.className = 'es-tip oculto'; document.body.appendChild(tip);
  sec.addEventListener('mousemove', function (ev) {
    var t = ev.target.closest('[data-tip]');
    if (!t) { tip.classList.add('oculto'); return; }
    tip.innerHTML = t.getAttribute('data-tip'); tip.classList.remove('oculto');
    var x = Math.min(ev.clientX + 12, window.innerWidth - tip.offsetWidth - 8);
    tip.style.left = x + 'px'; tip.style.top = (ev.clientY - tip.offsetHeight - 10) + 'px';
  });
  sec.addEventListener('mouseleave', function () { tip.classList.add('oculto'); });
  sec.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-tip]');
    if (!t) { tip.classList.add('oculto'); return; }
    var r = t.getBoundingClientRect();
    tip.innerHTML = t.getAttribute('data-tip'); tip.classList.remove('oculto');
    tip.style.left = Math.max(8, Math.min(r.left, window.innerWidth - tip.offsetWidth - 8)) + 'px'; tip.style.top = (r.top - tip.offsetHeight - 6) + 'px';
  });

  // ---------- carga ----------
  var cargando = false;
  function cargar() {
    if (cargando) return; cargando = true;
    document.getElementById('esCuerpo').innerHTML = '<div class="muted">Cargando…</div>';
    api('adminEstadisticas', token).then(function (d) {
      D = d; porNro = {};
      d.socios.forEach(function (s) { porNro[s.nro] = s; });
      armarFiltros(); pintar();
    }).catch(function (e) { document.getElementById('esCuerpo').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; })
      .then(function () { cargando = false; });
  }

  function armarFiltros() {
    var anios = {};
    anios[D.hoy.slice(0, 4)] = 1;
    D.socios.forEach(function (s) { if (s.alta) anios[s.alta.slice(0, 4)] = 1; });
    D.cuotas.forEach(function (c) { if (c[6]) anios[c[6].slice(0, 4)] = 1; });
    D.eventos.forEach(function (e) { if (e[1]) anios[e[1].slice(0, 4)] = 1; });
    D.historial.forEach(function (h) { if (h[0]) anios[h[0].slice(0, 4)] = 1; });
    var la = Object.keys(anios).sort().reverse();
    if (la.indexOf(est.anio) < 0) est.anio = la[0];
    sel('esAnio', la.map(function (a) { return [a, a]; }), est.anio);
    sel('esCategoria', [['', 'Todas las categorías']].concat(D.categorias.concat(['General']).filter(function (x, i, a) { return a.indexOf(x) === i; }).map(function (c) { return [c, c]; })), est.categoria);
    sel('esGenero', [['', 'Todos los géneros']].concat(D.generos.map(function (g) { return [g, g]; })).concat([['Sin dato', 'Género sin dato']]), est.genero);
    sel('esEdad', [['', 'Todas las edades']].concat(FRANJAS.map(function (f) { return [f[0], f[1] + ' años']; })).concat([['?', 'Edad sin dato']]), est.edad);
    sel('esGrupo', [['', 'Todos (grupos y descuentos)']].concat(D.grupos.map(function (g) { return ['g:' + g, 'Grupo: ' + g]; }))
      .concat([['fam', 'Con grupo familiar'], ['ind', 'Con descuento individual'], ['cdesc', 'Con algún descuento'], ['sdesc', 'Sin descuento']]), est.grupo);
    document.getElementById('esAnio').classList.toggle('oculto', est.vista !== 'mes');
  }
  function sel(id, ops, val) {
    document.getElementById(id).innerHTML = ops.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('');
  }
  ['esAnio', 'esCategoria', 'esGenero', 'esEdad', 'esGrupo'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', function () {
      var k = { esAnio: 'anio', esCategoria: 'categoria', esGenero: 'genero', esEdad: 'edad', esGrupo: 'grupo' }[id];
      est[k] = this.value; if (D) pintar();
    });
  });
  document.getElementById('esVista').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    est.vista = b.dataset.v;
    document.querySelectorAll('#esVista button').forEach(function (x) { x.classList.toggle('on', x === b); });
    document.getElementById('esAnio').classList.toggle('oculto', est.vista !== 'mes');
    if (D) pintar();
  });

  // ---------- utilidades ----------
  function franja(edad) {
    if (edad === null || edad === undefined) return '?';
    for (var i = 0; i < FRANJAS.length; i++) if (edad >= FRANJAS[i][2] && edad <= FRANJAS[i][3]) return FRANJAS[i][0];
    return '?';
  }
  function nombreFranja(k) { if (k === '?') return 'Sin dato'; var f = FRANJAS.filter(function (x) { return x[0] === k; })[0]; return f ? f[1] : k; }
  function pasaSocio(s) {
    if (!s) return false;
    if (est.categoria && s.categoria !== est.categoria) return false;
    if (est.genero && (s.genero || 'Sin dato') !== est.genero) return false;
    if (est.edad && franja(s.edad) !== est.edad) return false;
    var g = est.grupo;
    if (g) {
      if (g.indexOf('g:') === 0) { var n = g.slice(2).toLowerCase(); if (!s.grupos.some(function (x) { return x.toLowerCase() === n; })) return false; }
      else if (g === 'fam' && !s.familia) return false;
      else if (g === 'ind' && s.tiposDesc.indexOf('Individual') < 0) return false;
      else if (g === 'cdesc' && !s.descuentoActual) return false;
      else if (g === 'sdesc' && s.descuentoActual) return false;
    }
    return true;
  }
  function hayFiltro() { return !!(est.categoria || est.genero || est.edad || est.grupo); }
  function buckets() {
    var b = [];
    if (est.vista === 'mes') { for (var m = 1; m <= 12; m++) { var k = est.anio + '-' + ('0' + m).slice(-2); b.push({ k: k, l: MESES[m - 1], desde: k + '-01', hasta: finMes(k) }); } }
    else {
      var anios = Array.prototype.map.call(document.querySelectorAll('#esAnio option'), function (o) { return o.value; }).sort();
      anios.forEach(function (a) { b.push({ k: a, l: a, desde: a + '-01-01', hasta: a + '-12-31' }); });
    }
    return b;
  }
  function finMes(k) { var y = Number(k.slice(0, 4)), m = Number(k.slice(5, 7)); return k + '-' + ('0' + new Date(y, m, 0).getDate()).slice(-2); }
  function claveDe(iso) { return est.vista === 'mes' ? iso.slice(0, 7) : iso.slice(0, 4); }
  function tiposDeDetalle(det) {
    if (!det) return ['Sin descuento'];
    return det.split(' · ').map(function (p) {
      if (/^Familiar /.test(p)) return 'Grupo familiar';
      if (/^Individual /.test(p)) return 'Individual';
      var m = p.match(/^(.*) (\d+(\.\d+)?%|\$ ?[\d.]+)$/);
      return 'Grupo: ' + (m ? m[1] : p);
    });
  }
  function n0(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }
  function pct(a, b) { return b ? Math.round(a * 100 / b) + '%' : '—'; }

  // ---------- gráficos (SVG simple, un solo eje) ----------
  function grafBarras(labels, series, op) {
    op = op || {};
    var W = 600, H = op.alto || 230, ml = 58, mr = 8, mt = 12, mb = 32;
    var n = labels.length, iw = W - ml - mr, ih = H - mt - mb;
    var pos = labels.map(function (_, i) { return series.reduce(function (a, s) { return a + Math.max(0, s.values[i] || 0); }, 0); });
    var neg = labels.map(function (_, i) { return series.reduce(function (a, s) { return a + Math.min(0, s.values[i] || 0); }, 0); });
    var max = Math.max.apply(null, pos.concat([0])), min = Math.min.apply(null, neg.concat([0]));
    if (max === min) max = min + 1;
    var paso = escalaPaso((max - min) / 4); if (!op.fmt) paso = Math.max(1, Math.round(paso)); max = Math.ceil(max / paso) * paso; min = Math.floor(min / paso) * paso;
    var y = function (v) { return mt + ih * (max - v) / (max - min); };
    var bw = Math.max(4, Math.min(34, iw / n * 0.62)), gx = iw / n;
    var s = '<svg class="es-graf" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(op.titulo || '') + '">';
    for (var v = min; v <= max + 1e-9; v += paso) {
      s += '<line class="' + (Math.abs(v) < 1e-9 ? 'base' : 'eje') + '" x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
        '<text x="' + (ml - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + esc(op.fmt ? op.fmt(v, true) : abrev(v)) + '</text>';
    }
    labels.forEach(function (l, i) {
      var cx = ml + gx * i + gx / 2, acP = 0, acN = 0, partes = [];
      series.forEach(function (se, j) {
        var val = se.values[i] || 0; if (!val) return;
        var y0, y1;
        if (val > 0) { y0 = y(acP); acP += val; y1 = y(acP); } else { y0 = y(acN); acN += val; y1 = y(acN); }
        var top = Math.min(y0, y1), h = Math.max(1, Math.abs(y1 - y0) - (series.length > 1 ? 1 : 0));
        var detalle = (op.tipCab ? op.tipCab(i) : esc(l)) + '<br>' + series.map(function (x) { return '<b>' + esc(x.name) + ':</b> ' + esc(op.fmt ? op.fmt(Math.abs(x.values[i] || 0)) : String(Math.abs(x.values[i] || 0))); }).join('<br>');
        partes.push('<rect class="b" x="' + (cx - bw / 2) + '" y="' + top + '" width="' + bw + '" height="' + h + '" rx="3" fill="' + se.color + '" data-tip="' + esc(detalle) + '" tabindex="0"/>');
      });
      s += partes.join('');
      if (n <= 14 || i % Math.ceil(n / 12) === 0) s += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + '</text>';
    });
    return s + '</svg>' + (series.length > 1 ? leyenda(series) : '');
  }
  function grafHoriz(filas, series, op) {
    op = op || {};
    var W = 600, fh = 36, ml = 150, mr = 50, H = filas.length * fh + 8;
    var tot = filas.map(function (_, i) { return series.reduce(function (a, s) { return a + (s.values[i] || 0); }, 0); });
    var max = Math.max.apply(null, tot.concat([1])), iw = W - ml - mr;
    var s = '<svg class="es-graf" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(op.titulo || '') + '">';
    filas.forEach(function (f, i) {
      var y = 4 + i * fh, x = ml;
      s += '<text x="' + (ml - 10) + '" y="' + (y + 23) + '" text-anchor="end">' + esc(f) + '</text>';
      series.forEach(function (se) {
        var v = se.values[i] || 0; if (!v) return;
        var w = Math.max(1, iw * v / max - 2);
        s += '<rect class="b" x="' + x + '" y="' + (y + 3) + '" width="' + w + '" height="' + (fh - 12) + '" rx="4" fill="' + se.color + '" tabindex="0" data-tip="' +
          esc('<b>' + f + '</b><br>' + (series.length > 1 ? se.name + ': ' : '') + v + ' socio' + (v === 1 ? '' : 's')) + '"/>';
        x += iw * v / max;
      });
      s += '<text x="' + (x + 8) + '" y="' + (y + 23) + '">' + tot[i] + '</text>';
    });
    return s + '</svg>' + (series.length > 1 ? leyenda(series) : '');
  }
  function leyenda(series) { return '<div class="es-ley">' + series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>'; }).join('') + '</div>'; }
  function escalaPaso(x) { if (x <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(x))), f = x / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
  function abrev(v) { var a = Math.abs(v); return (v < 0 ? '−' : '') + (a >= 1e6 ? n0(a / 1e6) + 'M' : a >= 1e3 ? n0(a / 1e3) + 'k' : String(a)); }
  function fmtPlataEje(v, eje) { return eje ? '$' + abrev(v) : plata(v); }

  // ---------- cálculo ----------
  function calcular() {
    var B = buckets(), idx = {};
    B.forEach(function (b, i) { idx[b.k] = i; });
    var socios = D.socios.filter(pasaSocio);
    var ok = {}; socios.forEach(function (s) { ok[s.nro] = true; });
    var hoy = D.hoy;
    var desdeR = B[0].desde, hastaR = B[B.length - 1].hasta;

    // Fluctuación
    var flu = B.map(function () { return { altas: 0, bajas: 0, susp: 0, react: 0, sanc: 0, activos: null }; });
    socios.forEach(function (s) { if (s.alta && idx[claveDe(s.alta)] !== undefined) flu[idx[claveDe(s.alta)]].altas++; });
    var eventosPorSocio = {};
    D.historial.forEach(function (h) {
      if (!ok[h[1]] || !h[0]) return;
      (eventosPorSocio[h[1]] = eventosPorSocio[h[1]] || []).push(h);
      var i = idx[claveDe(h[0])]; if (i === undefined) return;
      if (h[2] === 'Baja') flu[i].bajas++;
      else if (h[2] === 'Suspensión') flu[i].susp++;
      else if (h[2] === 'Reactivación' || h[2] === 'Reincorporación') flu[i].react++;
      else if (/Sanci/.test(h[2])) flu[i].sanc++;
    });
    B.forEach(function (b, i) {
      if (b.desde > hoy) return;
      var corte = b.hasta < hoy ? b.hasta : hoy, n = 0;
      socios.forEach(function (s) {
        if (!s.alta || s.alta > corte) return;
        var evs = (eventosPorSocio[s.nro] || []).filter(function (h) { return !/Sanci/.test(h[2]); }).sort(function (a, c) { return a[0] < c[0] ? -1 : 1; });
        var antes = evs.filter(function (h) { return h[0] <= corte; }), despues = evs.filter(function (h) { return h[0] > corte; });
        var activo;
        if (antes.length) activo = /Reactivaci|Reincorporaci/.test(antes[antes.length - 1][2]);
        else if (despues.length) activo = !/Reactivaci|Reincorporaci/.test(despues[0][2]); // su primer cambio posterior dice cómo estaba
        else activo = s.estado === 'Activo'; // sin historial: si hoy no está activo, no se sabe desde cuándo (cuenta como inactivo)
        if (activo) n++;
      });
      flu[i].activos = n;
    });

    // Ingresos
    var ing = B.map(function () { return { cuotas: 0, nCuotas: 0, eventos: 0, nEventos: 0, descontado: 0 }; });
    var cuotasR = [];
    D.cuotas.forEach(function (c) {
      if (!c[6] || !ok[c[0]]) return;
      var i = idx[claveDe(c[6])]; if (i === undefined) return;
      ing[i].cuotas += c[2]; ing[i].nCuotas++; ing[i].descontado += c[4];
      cuotasR.push(c);
    });
    D.eventos.forEach(function (e) {
      if (!e[1]) return;
      if (e[0] ? !ok[e[0]] : hayFiltro()) return;
      var i = idx[claveDe(e[1])]; if (i === undefined) return;
      ing[i].eventos += e[2]; ing[i].nEventos++;
    });

    // Movimientos del historial en el rango
    var movs = D.historial.filter(function (h) { return ok[h[1]] && h[0] >= desdeR && h[0] <= hastaR; }).sort(function (a, b) { return a[0] < b[0] ? 1 : -1; });
    return { B: B, socios: socios, flu: flu, ing: ing, cuotasR: cuotasR, movs: movs };
  }

  function desglose(cuotasR, por) {
    var g = {};
    cuotasR.forEach(function (c) {
      var s = porNro[c[0]] || { categoria: '?', genero: '', edad: null, grupos: [] };
      var claves;
      if (por === 'categoria') claves = [s.categoria];
      else if (por === 'descuento') claves = tiposDeDetalle(c[5]);
      else if (por === 'grupo') claves = s.grupos.length ? s.grupos : ['Sin grupo'];
      else if (por === 'genero') claves = [s.genero || 'Sin dato'];
      else if (por === 'edad') claves = [nombreFranja(franja(s.edad))];
      else if (por === 'medio') claves = [c[7] || 'Sin dato'];
      claves.forEach(function (k) {
        var r = g[k] = g[k] || { k: k, n: 0, cobrado: 0, base: 0, desc: 0, socios: {} };
        r.n++; r.cobrado += c[2]; r.base += c[3]; r.desc += c[4]; r.socios[c[0]] = 1;
      });
    });
    var orden = por === 'edad' ? FRANJAS.map(function (f) { return f[1]; }).concat(['Sin dato']) : null;
    return Object.keys(g).map(function (k) { var r = g[k]; r.nSocios = Object.keys(r.socios).length; return r; })
      .sort(function (a, b) { return orden ? orden.indexOf(a.k) - orden.indexOf(b.k) : b.cobrado - a.cobrado; });
  }

  // ---------- dibujo ----------
  var ultimo = null;
  function pintar() {
    var R = ultimo = calcular(), html = '';
    var activos = R.socios.filter(function (s) { return s.estado === 'Activo'; });
    var susp = R.socios.filter(function (s) { return s.estado === 'Suspendido'; }).length;
    var bajas = R.socios.filter(function (s) { return s.estado === 'Baja'; }).length;
    var conDesc = activos.filter(function (s) { return s.descuentoActual > 0; }).length;
    var prom = activos.length ? activos.reduce(function (a, s) { return a + s.cuotaActual; }, 0) / activos.length : 0;
    var titPer = est.vista === 'mes' ? est.anio : 'todos los años';
    var filtroTxt = [est.categoria, est.genero, est.edad ? (est.edad === '?' ? 'edad sin dato' : nombreFranja(est.edad) + ' años') : '',
      est.grupo ? document.getElementById('esGrupo').selectedOptions[0].textContent : ''].filter(String).join(' · ');

    html += '<div class="es-kpis">' +
      kpi('Activos', activos.length, susp + ' suspendido' + (susp === 1 ? '' : 's')) +
      kpi('Bajas', bajas, 'en total') +
      kpi('Cuota prom.', plata(prom), pct(conDesc, activos.length) + ' con desc.') + '</div>';
    if (filtroTxt) html += '<div class="es-nota" style="margin:-4px 0 10px">Filtrado: ' + esc(filtroTxt) + '</div>';

    // 1) Socios activos y movimientos
    var lbl = R.B.map(function (b) { return b.l; });
    html += '<div class="card"><h3>Socios activos al cierre · ' + esc(titPer) + '</h3>' +
      grafBarras(lbl, [{ name: 'Activos', color: C.s1, values: R.flu.map(function (f) { return f.activos || 0; }) }],
        { titulo: 'Socios activos', tipCab: function (i) { return esc(R.B[i].l) + (est.vista === 'mes' ? ' ' + est.anio : ''); } }) + '</div>';
    html += '<div class="card"><h3>Altas y bajas · ' + esc(titPer) + '</h3>' +
      grafBarras(lbl, [
        { name: 'Altas', color: C.s1, values: R.flu.map(function (f) { return f.altas; }) },
        { name: 'Reactivaciones', color: C.s3, values: R.flu.map(function (f) { return f.react; }) },
        { name: 'Bajas', color: C.s2, values: R.flu.map(function (f) { return -f.bajas; }) },
        { name: 'Suspensiones', color: C.s4, values: R.flu.map(function (f) { return -f.susp; }) }
      ], { titulo: 'Altas y bajas', alto: 180, tipCab: function (i) { return esc(R.B[i].l) + (est.vista === 'mes' ? ' ' + est.anio : ''); } }) +
      tabla(['', 'Altas', 'React.', 'Bajas', 'Susp.', 'Sanc.', 'Activos'], R.B.map(function (b, i) {
        var f = R.flu[i]; return [b.l, f.altas, f.react, f.bajas, f.susp, f.sanc, f.activos === null ? '—' : f.activos];
      }), totales(R.flu, ['altas', 'react', 'bajas', 'susp', 'sanc'], true)) +
      '<div class="es-nota">Bajas, suspensiones y sanciones cuentan desde que existe el historial (' + esc(fechaCorta(D.historialDesde)) + ')' +
      (D.sinFecha ? '. ' + D.sinFecha + ' socio' + (D.sinFecha === 1 ? '' : 's') + ' ya estaba' + (D.sinFecha === 1 ? '' : 'n') + ' de baja o suspendido' + (D.sinFecha === 1 ? '' : 's') + ' antes, sin fecha registrada.' : '.') +
      ' Las sanciones con fecha de vencimiento se suman cuando se habiliten.</div></div>';

    // 2) Demografía
    var act = activos;
    var generos = D.generos.concat(['Sin dato']);
    var filasE = FRANJAS.map(function (f) { return f[0]; }).concat(['?']);
    var valsG = generos.map(function (g) {
      return { name: g, color: COL_GENERO[g], values: filasE.map(function (fe) { return act.filter(function (s) { return franja(s.edad) === fe && (s.genero || 'Sin dato') === g; }).length; }) };
    }).filter(function (se) { return se.values.some(Boolean); });
    var conEdad = act.filter(function (s) { return s.edad !== null; });
    var promEdad = conEdad.length ? conEdad.reduce(function (a, s) { return a + s.edad; }, 0) / conEdad.length : 0;
    html += '<div class="card"><h3>Socios activos por edad y género</h3>' +
      (act.length ? grafHoriz(filasE.map(nombreFranja), valsG, { titulo: 'Socios por edad y género' }) +
      tabla(['Género', 'Socios', '%'], generos.map(function (g) { var n = act.filter(function (s) { return (s.genero || 'Sin dato') === g; }).length; return [g, n, pct(n, act.length)]; }).filter(function (r) { return r[1]; }),
        ['Total', act.length, '100%']) +
      '<div class="es-nota">Edad promedio: ' + (conEdad.length ? n0(promEdad) + ' años' : 'sin datos') + ' · ' + (act.length - conEdad.length) + ' sin fecha de nacimiento · ' +
      act.filter(function (s) { return !s.genero; }).length + ' sin género cargado.</div>' : '<div class="muted">No hay socios activos con estos filtros.</div>') + '</div>';

    // 3) Ingresos
    html += '<div class="card"><h3>Ingresos · ' + esc(titPer) + '</h3>' +
      grafBarras(lbl, [
        { name: 'Cuotas', color: C.s1, values: R.ing.map(function (x) { return x.cuotas; }) },
        { name: 'Eventos', color: C.s2, values: R.ing.map(function (x) { return x.eventos; }) }
      ], { titulo: 'Ingresos', fmt: fmtPlataEje, tipCab: function (i) { return esc(R.B[i].l) + (est.vista === 'mes' ? ' ' + est.anio : ''); } }) +
      tabla(['', 'Cuotas', 'Eventos', 'Total', 'Descontado'], R.B.map(function (b, i) {
        var x = R.ing[i]; return [b.l, plata(x.cuotas), plata(x.eventos), plata(x.cuotas + x.eventos), x.descontado ? plata(x.descontado) : '—'];
      }), (function () { var t = R.ing.reduce(function (a, x) { a[0] += x.cuotas; a[1] += x.eventos; a[2] += x.descontado; return a; }, [0, 0, 0]); return ['Total', plata(t[0]), plata(t[1]), plata(t[0] + t[1]), t[2] ? plata(t[2]) : '—']; })()) +
      '<div class="es-nota">Por fecha de cobro. "Descontado" es lo que se dejó de cobrar por descuentos en esas cuotas.' + (hayFiltro() ? ' Con filtros, los eventos cuentan solo lo pagado por socios que cumplen el filtro.' : '') + '</div></div>';

    // 4) Desglose de cuotas
    var opcionesD = [['descuento', 'Descuento'], ['categoria', 'Categoría'], ['grupo', 'Grupo'], ['genero', 'Género'], ['edad', 'Edad'], ['medio', 'Medio de pago']];
    var filasD = desglose(R.cuotasR, est.desglose);
    var totD = R.cuotasR.reduce(function (a, c) { a.n++; a.cob += c[2]; a.base += c[3]; a.desc += c[4]; return a; }, { n: 0, cob: 0, base: 0, desc: 0 });
    html += '<div class="card"><h3>Cuotas cobradas por… · ' + esc(titPer) + '</h3>' +
      '<div class="es-sel chips" id="esDesg">' + opcionesD.map(function (o) { return '<button class="chip' + (o[0] === est.desglose ? ' on' : '') + '" data-d="' + o[0] + '" type="button">' + o[1] + '</button>'; }).join('') + '</div>' +
      (filasD.length ? tabla(['', 'Socios', 'Cuotas', 'Cobrado', 'Descontado'], filasD.map(function (r) {
        return [r.k, r.nSocios, r.n, plata(r.cobrado), r.desc ? plata(r.desc) + ' (' + pct(r.desc, r.base) + ')' : '—'];
      }), est.desglose === 'descuento' || est.desglose === 'grupo' ? null : ['Total', '', totD.n, plata(totD.cob), totD.desc ? plata(totD.desc) : '—'])
        + (est.desglose === 'descuento' || est.desglose === 'grupo' ? '<div class="es-nota">Una cuota con dos descuentos (o un socio en dos grupos) aparece en las dos filas. Total cobrado: ' + plata(totD.cob) + ' en ' + totD.n + ' cuotas.</div>' : '') +
        (est.desglose === 'grupo' || est.desglose === 'genero' || est.desglose === 'edad' ? '<div class="es-nota">Según los datos actuales de cada socio.</div>' : '')
        : '<div class="muted">No hay cuotas cobradas en este período con estos filtros.</div>') + '</div>';

    // 5) Movimientos
    html += '<div class="card"><h3>Movimientos de socios · ' + esc(titPer) + '</h3>' + (R.movs.length ? R.movs.slice(0, 50).map(function (h) {
      return '<div class="es-mov"><b>' + esc(h[2]) + '</b> · ' + esc(h[3]) + ' <span class="s">Nº ' + esc(h[1]) + '</span><div class="s">' + esc(fechaCorta(h[0])) +
        (h[4] ? ' · ' + esc(h[4]) : '') + (h[5] ? ' · ' + esc(h[5]) : '') + '</div></div>';
    }).join('') + (R.movs.length > 50 ? '<div class="es-nota">Se muestran los últimos 50 de ' + R.movs.length + '. El Excel tiene todos.</div>' : '')
      : '<div class="muted">Sin bajas, suspensiones ni reactivaciones en este período.</div>') + '</div>';

    document.getElementById('esCuerpo').innerHTML = html;
    var dsg = document.getElementById('esDesg');
    if (dsg) dsg.addEventListener('click', function (ev) { var b = ev.target.closest('.chip'); if (!b) return; est.desglose = b.dataset.d; pintar(); });
  }
  function kpi(l, v, s) { return '<div class="es-kpi"><div class="l">' + esc(l) + '</div><div class="v">' + esc(String(v)) + '</div><div class="s">' + esc(s) + '</div></div>'; }
  function tabla(cab, filas, tot) {
    return '<div class="es-scroll"><table class="es-t"><tr>' + cab.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>' +
      filas.map(function (f) { return '<tr>' + f.map(function (c) { return '<td>' + esc(String(c)) + '</td>'; }).join('') + '</tr>'; }).join('') +
      (tot ? '<tr class="tot">' + tot.map(function (c) { return '<td>' + esc(String(c)) + '</td>'; }).join('') + '</tr>' : '') + '</table></div>';
  }
  function totales(arr, campos, conActivos) {
    var t = ['Total'].concat(campos.map(function (k) { return arr.reduce(function (a, x) { return a + x[k]; }, 0); }));
    if (conActivos) { var ult = arr.filter(function (x) { return x.activos !== null; }).pop(); t.push(ult ? ult.activos : '—'); }
    return t;
  }
  function fechaCorta(iso) { return iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : ''; }

  // ---------- Excel ----------
  var cargandoX = null;
  function libX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (cargandoX) return cargandoX;
    cargandoX = new Promise(function (ok, mal) {
      var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = function () { ok(window.XLSX); }; s.onerror = function () { cargandoX = null; mal(new Error('No se pudo cargar el generador de Excel.')); };
      document.head.appendChild(s);
    });
    return cargandoX;
  }
  document.getElementById('esXlsx').addEventListener('click', function () {
    if (!ultimo) { toast('Esperá a que carguen las estadísticas'); return; }
    var b = this; ocupado(b, true, '…');
    libX().then(function (X) {
      var R = ultimo, wb = X.utils.book_new();
      var hoja = function (filas, anchos) { var ws = X.utils.aoa_to_sheet(filas); ws['!cols'] = anchos.map(function (w) { return { wch: w }; }); return ws; };
      var per = est.vista === 'mes' ? 'Mes' : 'Año';
      X.utils.book_append_sheet(wb, hoja([[per, 'Altas', 'Reactivaciones', 'Bajas', 'Suspensiones', 'Sanciones', 'Activos al cierre', 'Ingresos cuotas', 'Ingresos eventos', 'Total', 'Descontado']]
        .concat(R.B.map(function (bk, i) { var f = R.flu[i], x = R.ing[i]; return [est.vista === 'mes' ? bk.l + ' ' + est.anio : bk.l, f.altas, f.react, f.bajas, f.susp, f.sanc, f.activos === null ? '' : f.activos, x.cuotas, x.eventos, x.cuotas + x.eventos, x.descontado]; })),
        [12, 7, 14, 7, 12, 10, 16, 15, 15, 12, 12]), 'Por ' + per.toLowerCase());
      ['descuento', 'categoria', 'grupo', 'genero', 'edad', 'medio'].forEach(function (k) {
        var nom = { descuento: 'Descuento', categoria: 'Categoría', grupo: 'Grupo', genero: 'Género', edad: 'Edad', medio: 'Medio' }[k];
        X.utils.book_append_sheet(wb, hoja([[nom, 'Socios', 'Cuotas', 'Cobrado', 'Sin descuento sería', 'Descontado']].concat(
          desglose(R.cuotasR, k).map(function (r) { return [r.k, r.nSocios, r.n, r.cobrado, r.base, r.desc]; })), [26, 8, 8, 12, 18, 12]), 'Cuotas por ' + nom.toLowerCase());
      });
      X.utils.book_append_sheet(wb, hoja([['Nº', 'Socio', 'Estado', 'Género', 'Edad', 'Franja', 'Categoría', 'Grupos', 'Grupo familiar', 'Alta', 'Cuota actual', 'Descuento actual']].concat(
        R.socios.map(function (s) { return [Number(s.nro), s.nombre, s.estado, s.genero, s.edad === null ? '' : s.edad, nombreFranja(franja(s.edad)), s.categoria, s.grupos.join(', '), s.familia, s.alta, s.cuotaActual, s.descuentoActual]; })),
        [6, 26, 11, 16, 6, 14, 12, 22, 18, 11, 12, 15]), 'Socios');
      X.utils.book_append_sheet(wb, hoja([['Fecha', 'Nº', 'Socio', 'Movimiento', 'Detalle', 'Usuario']].concat(
        R.movs.map(function (h) { return [h[0], Number(h[1]), h[3], h[2], h[4], h[5]]; })), [11, 6, 26, 16, 30, 16]), 'Movimientos');
      X.writeFile(wb, 'Estadisticas CABB ' + (est.vista === 'mes' ? est.anio : 'por año') + '.xlsx');
    }).catch(function (e) { toast(msg(e)); }).then(function () { ocupado(b, false); });
  });
})();
