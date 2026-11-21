/* Comisión CABB — Clases (cursos, profesores, pedidos, alumnos y pagos, lista para imprimir)
 * y Beneficios en locales (cupones que ven los socios al día).
 * Se apoya en comision.js (api, token, esc, toast, modal, confirmar, ocupado, msg, mostrar, VISTAS)
 * y en los estilos de comision-gestion.js (gs-item, gs-tag, chk…).
 */
(function () {
  var D = null;          // datos de adminClases
  var solapa = 'cursos';
  var filtroCurso = '', filtroMes = '';

  var estilos = document.createElement('style');
  estilos.textContent =
    '.cl-tot { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }' +
    '.cl-tot div { background: #fff; border: 1px solid var(--linea); border-radius: 10px; padding: 8px 10px; font-size: 12px; color: var(--gris); } .cl-tot b { display: block; font-size: 17px; color: var(--tinta); }' +
    '.cl-al { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; border-top: 1px solid var(--linea); padding: 9px 0; font-size: 14px; } .cl-al:first-child { border-top: 0; }' +
    '.cl-al .s { font-size: 12px; color: var(--gris); } .cl-al .r { text-align: right; flex: none; }' +
    '.cl-al .ops { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }' +
    '.cl-head { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }' +
    '.cl-controles { display: flex; gap: 8px; flex-wrap: wrap; } .cl-controles > * { flex: 1; min-width: 140px; }' +
    '.cl-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; } .cl-btns .btn { flex: 1; min-width: 30%; margin: 0; padding: 10px; font-size: 14px; }' +
    '.bn-it { display: flex; gap: 10px; align-items: center; border-top: 1px solid var(--linea); padding: 10px 0; } .bn-it:first-child { border-top: 0; }' +
    '.bn-logo { width: 64px; height: 40px; flex: none; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid var(--linea); border-radius: 8px; overflow: hidden; } .bn-logo img { max-width: 100%; max-height: 100%; }' +
    '.bn-it .tx { flex: 1; min-width: 0; font-size: 14px; } .bn-it .s { font-size: 12px; color: var(--gris); }' +
    '.bn-ord { display: flex; flex-direction: column; gap: 2px; } .bn-ord button { border: 1px solid var(--linea); background: #fff; border-radius: 6px; width: 30px; height: 24px; font-size: 12px; padding: 0; }' +
    '.bn-prev { margin-top: 12px; }' +
    /* cupón (igual que en la app del socio) */
    '.cup { --c: #1f3d2b; position: relative; display: flex; background: #fff; border-radius: 16px; box-shadow: 0 1px 0 var(--linea), 0 6px 16px rgba(31,61,43,.10); overflow: hidden; min-height: 150px; }' +
    '.cup::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: var(--c); }' +
    '.cup-main { flex: 1; min-width: 0; padding: 14px 12px 12px 20px; display: flex; flex-direction: column; gap: 6px; }' +
    '.cup-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }' +
    '.cup-logo { height: 46px; max-width: 62%; display: flex; align-items: center; } .cup-logo img { max-height: 46px; max-width: 100%; object-fit: contain; }' +
    '.cup-ini { width: 46px; height: 46px; border-radius: 12px; background: var(--c); color: #fff; font-weight: 800; font-size: 18px; display: flex; align-items: center; justify-content: center; }' +
    '.cup-dto { text-align: right; line-height: .9; color: var(--c); flex: none; } .cup-dto .n { font-size: 38px; font-weight: 800; font-family: Georgia, serif; } .cup-dto .p { font-size: 22px; font-weight: 700; }' +
    '.cup-dto .t { display: block; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--gris); margin-top: 4px; } .cup-dto.txt { font-size: 18px; font-weight: 800; max-width: 45%; line-height: 1.1; }' +
    '.cup-local { font-weight: 700; font-size: 15px; } .cup-local span { font-weight: 400; color: var(--gris); font-size: 13px; } .cup-det { font-size: 12px; color: var(--gris); }' +
    '.cup-links { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; margin-top: auto; color: var(--verde); font-weight: 600; }' +
    '.cup-stub { position: relative; flex: none; width: 96px; border-left: 2px dashed var(--linea); background: repeating-conic-gradient(#f6f1e7 0 25%, #fffdf8 0 50%) 0 0 / 16px 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; }' +
    '.cup-stub::before, .cup-stub::after { content: ""; position: absolute; left: -11px; width: 20px; height: 20px; border-radius: 50%; background: var(--crema); } .cup-stub::before { top: -10px; } .cup-stub::after { bottom: -10px; }' +
    '.cup-stub img { width: 44px; } .cup-nro { font-size: 10px; font-weight: 800; letter-spacing: .1em; color: var(--verde); } .cup-sello { font-size: 10px; font-weight: 800; color: #fff; background: var(--ok); border-radius: 999px; padding: 3px 8px; }';
  document.head.appendChild(estilos);

  function plata(n) { return '$ ' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function hoyIso() { var h = new Date(); return h.getFullYear() + '-' + ('0' + (h.getMonth() + 1)).slice(-2) + '-' + ('0' + h.getDate()).slice(-2); }
  function opciones(lista, sel) { return lista.map(function (o) { var v = typeof o === 'string' ? o : o.v, t = typeof o === 'string' ? o : o.t; return '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join(''); }
  var MEDIOS = ['Efectivo', 'Transferencia', 'Mercado Pago'];

  /* ================= Vistas y accesos ================= */
  function seccion(id, titulo, sol) {
    var s = document.createElement('section');
    s.id = id; s.className = 'oculto';
    s.innerHTML = '<button class="volver" data-ir="mas" type="button">‹ Volver</button><h2>' + titulo + '</h2>' + (sol || '') + '<div id="' + id + 'Cuerpo"></div>';
    document.querySelector('.wrap').appendChild(s);
    VISTAS.push(id);
    return s;
  }
  seccion('vClases', 'Clases', '<div class="gs-sol chips" id="clSol">' +
    '<button class="chip on" data-s="cursos" type="button">Cursos</button><button class="chip" data-s="pedidos" type="button">Pedidos <span id="clNP"></span></button>' +
    '<button class="chip" data-s="alumnos" type="button">Alumnos y pagos</button><button class="chip" data-s="profes" type="button">Profesores</button></div>');
  seccion('vBeneficios', 'Beneficios en locales', '');

  var vMas = document.getElementById('vMas');
  var cardC = document.createElement('div');
  cardC.className = 'card';
  cardC.innerHTML = '<h3>Clases</h3><p class="muted" style="margin:0">Cursos y profesores, pedidos de inscripción de los socios, alumnos (también no socios), cuotas de las clases y listas para imprimir.</p><button class="btn" id="bClases" type="button">Abrir</button>';
  var cardB = document.createElement('div');
  cardB.className = 'card';
  cardB.innerHTML = '<h3>Beneficios en locales</h3><p class="muted" style="margin:0">Descuentos en comercios adheridos. Los socios al día los ven como cupones en su app.</p><button class="btn" id="bBenef" type="button">Abrir</button>';
  vMas.insertBefore(cardB, vMas.children[1]);
  vMas.insertBefore(cardC, vMas.children[1]);
  document.getElementById('bClases').addEventListener('click', function () { abrirClases('cursos'); });
  document.getElementById('bBenef').addEventListener('click', abrirBeneficios);

  function cuerpo(id, h) { var c = document.getElementById(id + 'Cuerpo'); c.innerHTML = h; return c; }
  function $q(sel) { return document.querySelector(sel); }

  function abrirClases(s, extra) {
    solapa = s;
    document.querySelectorAll('#clSol .chip').forEach(function (x) { x.classList.toggle('on', x.dataset.s === s); });
    mostrar('vClases');
    cuerpo('vClases', '<div class="muted">Cargando…</div>');
    return api('adminClases', token).then(function (d) {
      D = d;
      document.getElementById('clNP').textContent = d.pedidos.length ? '(' + d.pedidos.length + ')' : '';
      ({ cursos: vCursos, pedidos: vPedidos, alumnos: vAlumnos, profes: vProfes })[s](extra || {});
    }).catch(function (e) { cuerpo('vClases', '<div class="error">' + esc(msg(e)) + '</div>'); });
  }
  window.abrirClases = abrirClases;
  document.getElementById('clSol').addEventListener('click', function (ev) { var b = ev.target.closest('.chip'); if (b) abrirClases(b.dataset.s); });

  /* ================= Cursos ================= */
  function vCursos(pre) {
    var activos = D.cursos.filter(function (c) { return c.activo; }), inactivos = D.cursos.filter(function (c) { return !c.activo; });
    var item = function (c) {
      return '<div class="gs-item" data-id="' + esc(c.id) + '"><div class="t"><div><b>' + esc(c.nombre) + '</b> <span class="s">con ' + esc(c.profesorNombre || '—') + '</span>' +
        (!c.activo ? '<span class="gs-tag">inactivo</span>' : c.ofrecer ? '<span class="gs-tag ok">se ofrece</span>' : '<span class="gs-tag">no se ofrece</span>') +
        (c.prueba && c.activo ? '<span class="gs-tag ok">prueba gratis</span>' : '') +
        (c.pedidos ? '<span class="gs-tag av">' + c.pedidos + ' pedido' + (c.pedidos === 1 ? '' : 's') + '</span>' : '') +
        '<div class="s">' + esc(c.horario) + (c.proxima ? ' · próxima: ' + esc(c.proxima) : c.frecuencia === 'Quincenal' ? ' · falta la fecha de la primera clase' : '') + '</div>' +
        '<div class="s">Socios ' + esc(c.precioSocioTxt) + ' · No socios ' + esc(c.precioNoSocioTxt) + '</div></div>' +
        '<div style="text-align:right"><b>' + c.inscriptos + (c.cupo ? '/' + c.cupo : '') + '</b><div class="s">alumnos</div></div></div>' +
        '<div class="ops"><button class="link cuEd" type="button">Editar</button><button class="link cuAl" type="button">Alumnos</button>' +
        (c.activo ? '<button class="link cuOf" type="button">' + (c.ofrecer ? 'Dejar de ofrecer' : 'Ofrecer a socios') + '</button>' : '') +
        '<button class="mini cuBor" type="button">' + (c.activo ? 'quitar' : 'borrar') + '</button></div></div>';
    };
    var c = cuerpo('vClases', '<div class="card"><div class="cl-head"><h3>Cursos</h3><button class="link" id="cuNuevo" type="button">+ Nuevo curso</button></div>' +
      (activos.length ? activos.map(item).join('') : '<div class="muted">No hay cursos activos.</div>') +
      (inactivos.length ? '<details style="margin-top:8px"><summary class="muted" style="cursor:pointer">Inactivos (' + inactivos.length + ')</summary>' + inactivos.map(item).join('') + '</details>' : '') +
      '<p class="muted">"Se ofrece" = los socios lo ven en su app y pueden pedir anotarse. Sin precio para socios no se puede ofrecer.</p></div>' +
      '<div class="card oculto" id="cuForm"></div>');
    c.querySelector('#cuNuevo').onclick = function () { formCurso(null); };
    c.onclick = function (ev) {
      var row = ev.target.closest('.gs-item'); if (!row) return;
      var cu = D.cursos.filter(function (x) { return x.id === row.dataset.id; })[0];
      if (ev.target.classList.contains('cuEd')) formCurso(cu);
      else if (ev.target.classList.contains('cuAl')) { filtroCurso = cu.id; abrirClases('alumnos'); }
      else if (ev.target.classList.contains('cuOf')) {
        api('adminOfrecerCurso', token, cu.id, !cu.ofrecer).then(function () { toast(cu.ofrecer ? 'Ya no se ofrece' : 'Ahora los socios lo ven en su app'); abrirClases('cursos'); })
          .catch(function (e) { if (/precio/.test(msg(e))) { toast(msg(e)); formCurso(cu); } else toast(msg(e)); });
      } else if (ev.target.classList.contains('cuBor')) {
        confirmar('¿Quitar "' + cu.titulo + '"? Si tiene o tuvo alumnos queda inactivo (con su historial); si nunca tuvo, se borra.', 'Quitar', function () {
          api('adminBorrarCurso', token, cu.id).then(function (r) { toast(r.desactivado ? 'Curso desactivado' : 'Curso borrado'); abrirClases('cursos'); }).catch(function (e) { toast(msg(e)); });
        }, 'peligro');
      }
    };
    if (pre.nuevo) formCurso(null);
  }

  function formCurso(cu) {
    var f = $q('#cuForm'); f.classList.remove('oculto');
    cu = cu || { frecuencia: 'Semanal', desde: '18:00', hasta: '19:00', activo: true, ofrecer: false };
    var profes = D.profes.filter(function (p) { return p.activo || p.id === cu.profesor; });
    f.innerHTML = '<h3>' + (cu.id ? 'Editar curso' : 'Nuevo curso') + '</h3>' +
      '<div class="fila2"><div><label>Nombre / nivel</label><input id="cuNom" list="cuNoms" maxlength="60" value="' + esc(cu.nombre || '') + '" placeholder="Ej.: Intermedios"><datalist id="cuNoms"><option>Iniciales</option><option>Intermedios</option><option>Avanzados</option><option>Adultos</option><option>Infantiles</option></datalist></div>' +
      '<div><label>Profesor</label><select id="cuProf"><option value="">Elegí…</option>' + opciones(profes.map(function (p) { return { v: p.id, t: p.nombre }; }), cu.profesor) + '</select></div></div>' +
      '<div class="fila2"><div><label>Día</label><select id="cuDia"><option value="">Elegí…</option>' + opciones(D.dias, cu.dia) + '</select></div>' +
      '<div><label>Frecuencia</label><select id="cuFrec">' + opciones([{ v: 'Semanal', t: 'Todas las semanas' }, { v: 'Quincenal', t: 'Una semana sí, una no' }], cu.frecuencia) + '</select></div></div>' +
      '<div id="cuIniB" class="' + (cu.frecuencia === 'Quincenal' ? '' : 'oculto') + '"><label>Fecha de una clase (para calcular las semanas que toca)</label><input id="cuIni" type="date" value="' + esc(cu.inicio || '') + '"></div>' +
      '<div class="fila2"><div><label>Desde</label><input id="cuDesde" type="time" value="' + esc(cu.desde || '') + '"></div><div><label>Hasta</label><input id="cuHasta" type="time" value="' + esc(cu.hasta || '') + '"></div></div>' +
      '<div class="fila2"><div><label>Cuota mensual socios</label><input id="cuPS" type="number" min="0" step="100" value="' + (cu.precioSocio || '') + '"></div><div><label>Cuota mensual no socios</label><input id="cuPN" type="number" min="0" step="100" value="' + (cu.precioNoSocio || '') + '"></div></div>' +
      '<div class="fila2"><div><label>Cupo (vacío = sin límite)</label><input id="cuCupo" type="number" min="0" step="1" value="' + (cu.cupo || '') + '"></div><div></div></div>' +
      '<label>Descripción para los socios (opcional)</label><input id="cuDesc" maxlength="300" value="' + esc(cu.descripcion || '') + '" placeholder="Ej.: para chicos de 8 a 12 años que ya saben mover las piezas">' +
      '<label class="chk"><input type="checkbox" id="cuOf"' + (cu.ofrecer ? ' checked' : '') + '> Ofrecerlo a los socios en la app</label>' +
      '<label class="chk"><input type="checkbox" id="cuPrueba"' + (cu.prueba ? ' checked' : '') + '> Ofrece una clase de prueba gratis</label>' +
      '<label class="chk"><input type="checkbox" id="cuAct"' + (cu.activo !== false ? ' checked' : '') + '> Curso activo (si lo desactivás no se generan cuotas)</label>' +
      '<div class="fila2"><button class="btn" id="cuGuardar" type="button">Guardar</button><button class="btn sec" id="cuCancel" type="button">Cancelar</button></div><div class="error" id="cuErr"></div>';
    f.querySelector('#cuFrec').onchange = function () { f.querySelector('#cuIniB').classList.toggle('oculto', this.value !== 'Quincenal'); };
    f.querySelector('#cuCancel').onclick = function () { f.classList.add('oculto'); };
    f.querySelector('#cuGuardar').onclick = function () {
      var b = this; f.querySelector('#cuErr').textContent = ''; ocupado(b, true, 'Guardando…');
      api('adminGuardarCurso', token, { id: cu.id, nombre: $q('#cuNom').value, profesor: $q('#cuProf').value, dia: $q('#cuDia').value, frecuencia: $q('#cuFrec').value,
        inicio: $q('#cuIni').value, desde: $q('#cuDesde').value, hasta: $q('#cuHasta').value, precioSocio: $q('#cuPS').value, precioNoSocio: $q('#cuPN').value,
        cupo: $q('#cuCupo').value, descripcion: $q('#cuDesc').value, ofrecer: $q('#cuOf').checked, activo: $q('#cuAct').checked, prueba: $q('#cuPrueba').checked })
        .then(function () { toast('Curso guardado'); abrirClases('cursos'); })
        .catch(function (e) { f.querySelector('#cuErr').textContent = msg(e); }).then(function () { ocupado(b, false); });
    };
    f.scrollIntoView({ behavior: 'smooth' });
  }

  /* ================= Pedidos y clases de prueba ================= */
  function vPedidos() {
    var ins = D.pedidos.filter(function (p) { return p.tipo === 'Pedido'; });
    var pru = D.pedidos.filter(function (p) { return p.tipo === 'Prueba'; }), agen = D.pedidos.filter(function (p) { return p.tipo === 'PruebaAgendada'; });
    var item = function (p) {
      var ops = p.tipo === 'Pedido' ? '<button class="link peRech" type="button">Rechazar</button><button class="link peOk" type="button"><b>Aprobar</b></button>' :
        p.tipo === 'Prueba' ? '<button class="link peRech" type="button">Rechazar</button><button class="link peAgendar" type="button"><b>Agendar</b></button>' :
        '<button class="link peAgendar" type="button">Cambiar fecha</button><button class="link peNo" type="button">No siguió</button><button class="link peSi" type="button"><b>Se anotó</b></button>';
      return '<div class="gs-item" data-id="' + esc(p.id) + '"><div><b>' + esc(p.nombre) + '</b> <span class="s">' + (p.nro ? 'Nº ' + esc(p.nro) : 'no socio' + (p.telefono ? ' · ' + esc(p.telefono) : '')) + '</span>' +
        (!p.alDia ? '<span class="gs-tag mal">debe cuota social ' + esc(p.deudaTxt) + '</span>' : '') + (p.lleno && p.tipo === 'Pedido' ? '<span class="gs-tag av">cupo lleno ' + esc(p.cupoTxt) + '</span>' : '') +
        (p.tipo === 'PruebaAgendada' ? '<span class="gs-tag ok">prueba el ' + esc(p.fechaPrueba.slice(0, 5)) + '</span>' : '') +
        '<div class="s">' + esc(p.curso) + ' · ' + esc(p.horario) + '</div><div class="s">Pidió el ' + esc(p.fecha) + (p.comentario ? ' · "' + esc(p.comentario) + '"' : '') + '</div></div>' +
        '<div class="ops">' + ops + '</div></div>';
    };
    var bloque = function (tit, l, vacio) { return '<div class="card"><h3>' + tit + '</h3>' + (l.length ? l.map(item).join('') : '<div class="muted">' + vacio + '</div>') + '</div>'; };
    var c = cuerpo('vClases', bloque('Pedidos de inscripción', ins, 'No hay pedidos pendientes 👌') + bloque('Clases de prueba pedidas', pru, 'No hay pedidos de clase de prueba.') +
      bloque('Clases de prueba agendadas', agen, 'No hay clases de prueba agendadas.') + '<p class="muted">Después de la clase de prueba marcá si se anotó (queda inscripto) o si no siguió. Para anotar a alguien a una prueba a mano (también no socios) usá "Anotar alumno" en Alumnos y pagos.</p>');
    c.onclick = function (ev) {
      var row = ev.target.closest('.gs-item'); if (!row) return;
      var p = D.pedidos.filter(function (x) { return x.id === row.dataset.id; })[0];
      var luego = function () { abrirClases('pedidos'); };
      if (ev.target.closest('.peOk')) resolverPedido(p, true, luego);
      else if (ev.target.closest('.peRech')) resolverPedido(p, false, luego);
      else if (ev.target.closest('.peAgendar')) agendarPrueba(p, luego);
      else if (ev.target.closest('.peSi')) resultadoPrueba(p, true, luego);
      else if (ev.target.closest('.peNo')) resultadoPrueba(p, false, luego);
    };
  }
  function agendarPrueba(p, luego) {
    modal('<p><b>Clase de prueba de ' + esc(p.nombre) + '</b><br><span class="muted">' + esc(p.curso) + ' · ' + esc(p.horario) + '</span></p><label>Día</label><input type="date" id="peFecha" value="' + esc(p.fechaPruebaIso || p.proximaIso || '') + '">' +
      '<p class="muted">Le avisamos al celular el día y la hora.</p>',
      [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Agendar', clase: 'si', fn: function () {
        api('adminAgendarPrueba', token, p.id, document.getElementById('peFecha').value).then(function () { toast('Clase de prueba agendada'); luego(); }).catch(function (e) { toast(msg(e)); });
      } }]);
  }
  function resultadoPrueba(p, seQueda, luego) {
    if (seQueda) modal('<p><b>' + esc(p.nombre) + ' se anota en ' + esc(p.curso) + '</b></p><label class="chk"><input type="checkbox" id="peCob" checked> Cobrarle la cuota de este mes</label>',
      [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Anotar', clase: 'si', fn: function () {
        api('adminResultadoPrueba', token, p.id, true, document.getElementById('peCob').checked).then(function () { toast('Alumno inscripto'); luego(); }).catch(function (e) { toast(msg(e)); });
      } }]);
    else confirmar('¿' + esc(p.nombre) + ' no siguió después de la clase de prueba?', 'No siguió', function () {
      api('adminResultadoPrueba', token, p.id, false).then(function () { toast('Listo'); luego(); }).catch(function (e) { toast(msg(e)); });
    });
  }
  function resolverPedido(p, aprobar, luego) {
    if (aprobar) {
      modal('<p><b>Anotar a ' + esc(p.nombre) + ' en ' + esc(p.curso) + '</b></p>' + (p.lleno ? '<p class="error">Ojo: el cupo ya está completo (' + esc(p.cupoTxt || '') + ').</p>' : '') +
        '<label class="chk"><input type="checkbox" id="peCobrar" checked> Cobrarle la cuota de este mes</label><p class="muted">Le avisamos al celular que quedó anotado/a.</p>',
        [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Aprobar', clase: 'si', fn: function () {
          api('adminResolverPedido', token, p.id, true, document.getElementById('peCobrar').checked).then(function () { toast('Inscripción aprobada'); luego(); }).catch(function (e) { toast(msg(e)); });
        } }]);
    } else {
      modal('<p><b>¿Rechazar el pedido de ' + esc(p.nombre) + '?</b></p><label>Motivo (le llega al socio)</label><input id="peMot" maxlength="200" placeholder="Ej.: el curso está completo, te avisamos si se libera un lugar">',
        [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Rechazar', clase: 'peligro', fn: function () {
          api('adminResolverPedido', token, p.id, false, false, document.getElementById('peMot').value).then(function () { toast('Pedido rechazado'); luego(); }).catch(function (e) { toast(msg(e)); });
        } }]);
    }
  }

  /* ================= Alumnos y pagos ================= */
  var ultimaLista = null;
  function vAlumnos() {
    if (!filtroMes) filtroMes = D.periodoActual;
    var cursosSel = [{ v: '', t: 'Todos los cursos' }].concat(D.cursos.filter(function (c) { return c.activo || c.inscriptos; }).map(function (c) { return { v: c.id, t: c.nombre + ' — ' + (c.profesorNombre || '') + ' (' + c.dia + ')' }; }));
    var c = cuerpo('vClases', '<div class="card"><div class="cl-controles"><select id="alCurso">' + opciones(cursosSel, filtroCurso) + '</select><input type="month" id="alMes" value="' + esc(filtroMes) + '"></div>' +
      '<div class="cl-btns"><button class="btn" id="alAnotar" type="button">+ Anotar alumno</button><button class="btn sec" id="alImprimir" type="button">🖨 Imprimir</button><button class="btn sec" id="alGenerar" type="button">Generar cuotas del mes</button></div></div>' +
      '<div id="alRes"><div class="muted">Cargando…</div></div>');
    c.querySelector('#alCurso').onchange = function () { filtroCurso = this.value; cargarLista(); };
    c.querySelector('#alMes').onchange = function () { filtroMes = this.value || D.periodoActual; cargarLista(); };
    c.querySelector('#alAnotar').onclick = function () { anotar(filtroCurso); };
    c.querySelector('#alImprimir').onclick = function () { if (ultimaLista) imprimir(ultimaLista); };
    c.querySelector('#alGenerar').onclick = function () {
      var b = this; ocupado(b, true, 'Generando…');
      api('adminGenerarCargosClases', token, filtroMes).then(function (r) { toast(r.creadas ? 'Se generaron ' + r.creadas + ' cuotas de ' + r.legible : 'Las cuotas de ' + r.legible + ' ya estaban generadas'); cargarLista(); })
        .catch(function (e) { toast(msg(e)); }).then(function () { ocupado(b, false); });
    };
    c.querySelector('#alRes').onclick = function (ev) {
      var row = ev.target.closest('[data-al]'); if (!row) return;
      var a = buscarAlumno(row.dataset.al); if (!a) return;
      if (ev.target.classList.contains('alPagar')) pagar(a);
      else if (ev.target.classList.contains('alMas')) masAlumno(a);
    };
    cargarLista();
  }
  function buscarAlumno(id) {
    var r = null;
    (ultimaLista ? ultimaLista.cursos : []).forEach(function (c) { c.alumnos.forEach(function (a) { if (a.id === id) { r = a; r._curso = c; } }); });
    return r;
  }
  function cargarLista() {
    var res = document.getElementById('alRes'); if (!res) return;
    res.innerHTML = '<div class="muted">Cargando…</div>';
    api('adminAlumnosClases', token, filtroCurso, filtroMes).then(function (L) {
      if (!filtroCurso) L.cursos = L.cursos.filter(function (c) { return c.alumnos.length; });
      ultimaLista = L;
      var chip = function (a) {
        if (a.mes === 'Prueba') return '<span class="gs-tag av">clase de prueba ' + esc(a.fechaPrueba.slice(0, 5)) + '</span>';
        return a.mes === 'Pagada' ? '<span class="gs-tag ok">' + esc(L.legible.split(' ')[0]) + ' pagada</span>' : a.mes === 'Avisado' ? '<span class="gs-tag av">pago avisado</span>' :
          a.mes === 'Pendiente' ? '<span class="gs-tag mal">' + esc(L.legible.split(' ')[0]) + ' sin pagar</span>' : '<span class="gs-tag">sin cuota este mes</span>';
      };
      res.innerHTML = '<div class="cl-tot"><div>Alumnos<b>' + L.totales.inscriptos + '</b></div><div>Cobrado ' + esc(L.legible) + '<b>' + esc(L.totales.cobradoTxt) + '</b></div>' +
        '<div>Pendiente del mes<b>' + esc(L.totales.pendienteTxt) + '</b></div><div>Deuda total<b>' + esc(L.totales.deudaTxt) + '</b></div></div>' +
        (L.porProfesor.length > 1 || !filtroCurso ? '<div class="card"><h3>Por profesor · ' + esc(L.legible) + '</h3>' + L.porProfesor.map(function (p) {
          return '<div class="cl-al"><div>' + esc(p.profesor) + '<div class="s">' + p.alumnos + ' alumno' + (p.alumnos === 1 ? '' : 's') + '</div></div><div class="r"><b>' + esc(p.cobradoTxt) + '</b><div class="s">cobrado</div></div></div>';
        }).join('') + '</div>' : '') +
        L.cursos.map(function (c) {
          return '<div class="card"><div class="cl-head"><h3>' + esc(c.titulo) + '</h3><span class="s muted">' + c.inscriptos + (c.cupo ? '/' + c.cupo : '') + ' alumnos</span></div>' +
            '<div class="muted" style="margin:-4px 0 8px">' + esc(c.horario) + ' · cobrado ' + esc(c.cobradoTxt) + ' · pendiente ' + esc(c.pendienteTxt) + '</div>' +
            (c.alumnos.length ? c.alumnos.map(function (a) {
              return '<div class="cl-al" data-al="' + esc(a.id) + '"><div><b>' + esc(a.nombre) + '</b> <span class="s">' + (a.socio ? 'Nº ' + esc(a.nro) : 'no socio') + '</span>' +
                (a.estado === 'Baja' ? '<span class="gs-tag">de baja</span>' : '') + '<div class="s">' + esc(a.precioTxt) + (a.telefono ? ' · ' + esc(a.telefono) : '') + '</div>' + chip(a) + '</div>' +
                '<div class="r"><b' + (a.deuda ? ' style="color:var(--mal)"' : '') + '>' + esc(a.deudaTxt) + '</b><div class="s">debe</div><div class="ops">' +
                (a.pendientes.length ? '<button class="link alPagar" type="button">Cobrar</button>' : '') + (a.estado === 'PruebaAgendada' ? '' : '<button class="link alMas" type="button">Más</button>') + '</div></div></div>';
            }).join('') : '<div class="muted">Sin alumnos.</div>') + '</div>';
        }).join('') + (L.cursos.length ? '' : '<div class="card muted">No hay alumnos anotados.</div>');
    }).catch(function (e) { res.innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
  }
  function pagar(a) {
    modal('<p><b>Cobrar a ' + esc(a.nombre) + '</b></p>' + a.pendientes.map(function (p) {
      return '<label class="chk"><input type="checkbox" class="pgSel" value="' + esc(p.id) + '" data-m="' + p.monto + '" checked> ' + esc(p.legible) + ' — ' + esc(p.montoTxt) + (p.avisado ? ' (avisó que pagó)' : '') + '</label>';
    }).join('') + '<label>Medio</label><select id="pgMedio">' + opciones(MEDIOS) + '</select><label>Fecha</label><input type="date" id="pgFecha" value="' + hoyIso() + '">',
      [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Registrar pago', clase: 'si', fn: function () {
        var ids = Array.prototype.map.call(document.querySelectorAll('.pgSel:checked'), function (i) { return i.value; });
        if (!ids.length) { toast('No elegiste ninguna cuota'); return; }
        api('adminPagoClase', token, ids, document.getElementById('pgMedio').value, document.getElementById('pgFecha').value)
          .then(function (r) { toast('Pago registrado: ' + r.total); cargarLista(); }).catch(function (e) { toast(msg(e)); });
      } }]);
  }
  function masAlumno(a) {
    modal('<p><b>' + esc(a.nombre) + '</b> <span class="muted">' + (a.socio ? 'socio Nº ' + esc(a.nro) : 'no socio') + ' · ' + esc(a._curso.titulo) + '</span></p>' +
      (a.socio ? '' : '<label>Nombre</label><input id="maNom" value="' + esc(a.nombre) + '"><div class="fila2"><div><label>Teléfono</label><input id="maTel" value="' + esc(a.telefono) + '"></div><div><label>Email</label><input id="maMail" value="' + esc(a.email) + '"></div></div>') +
      '<label>Cuota especial (vacío = la del curso; 0 = becado)</label><input id="maPre" type="number" min="0" step="100" value="' + esc(a.precio) + '">' +
      '<label>Nota</label><input id="maCom" maxlength="200" value="' + esc(a.comentario) + '">' +
      (a.pendientes.length ? '<label>Anular una cuota</label><select id="maAnu"><option value="">— No —</option>' + opciones(a.pendientes.map(function (p) { return { v: p.id, t: p.legible + ' ' + p.montoTxt }; })) + '</select>' : '') +
      (a.estado === 'Inscripto' ? '<label class="chk"><input type="checkbox" id="maBaja"> Darlo de baja del curso</label><label class="chk"><input type="checkbox" id="maBajaAnu"> …y anular lo que debe</label>' : ''),
      [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Guardar', clase: 'si', fn: function () {
        var d = { precio: document.getElementById('maPre').value, comentario: document.getElementById('maCom').value };
        if (!a.socio) { d.nombre = document.getElementById('maNom').value; d.telefono = document.getElementById('maTel').value; d.email = document.getElementById('maMail').value; }
        var anu = document.getElementById('maAnu'), baja = document.getElementById('maBaja'), bajaAnu = document.getElementById('maBajaAnu');
        var p = api('adminEditarAlumno', token, a.id, d);
        if (anu && anu.value) p = p.then(function () { return api('adminAnularCargoClase', token, anu.value); });
        if (baja && baja.checked) p = p.then(function () { return api('adminBajaAlumno', token, a.id, bajaAnu && bajaAnu.checked); });
        p.then(function () { toast('Guardado'); cargarLista(); }).catch(function (e) { toast(msg(e)); });
      } }]);
  }
  function anotar(idCurso) {
    var cursos = D.cursos.filter(function (c) { return c.activo; });
    modal('<p><b>Anotar alumno</b></p><label>Curso</label><select id="caCur">' + opciones(cursos.map(function (c) { return { v: c.id, t: c.nombre + ' — ' + (c.profesorNombre || '') + ' (' + c.dia + ')' }; }), idCurso) + '</select>' +
      '<div class="radio-fila"><label><input type="radio" name="caTipo" value="s" checked> Socio</label><label><input type="radio" name="caTipo" value="n"> No socio</label></div>' +
      '<div id="caSoc"><input id="caBus" placeholder="Buscar socio por nombre o Nº"><div class="sel-res oculto" id="caRes"></div><div class="muted" id="caElegido"></div></div>' +
      '<div id="caNo" class="oculto"><label>Nombre y apellido</label><input id="caNom" maxlength="80"><div class="fila2"><div><label>Teléfono</label><input id="caTel" inputmode="tel"></div><div><label>Email</label><input id="caMail" type="email"></div></div></div>' +
      '<label>¿Qué hace?</label><div class="radio-fila"><label><input type="radio" name="caModo" value="i" checked> Se inscribe</label><label><input type="radio" name="caModo" value="p"> Clase de prueba gratis</label></div>' +
      '<div id="caIns"><label>Cuota especial (opcional; 0 = becado)</label><input id="caPre" type="number" min="0" step="100">' +
      '<label class="chk"><input type="checkbox" id="caCob" checked> Cobrarle la cuota de este mes</label></div>' +
      '<div id="caPru" class="oculto"><label>Día de la clase de prueba</label><input type="date" id="caFP"></div><div class="error" id="caErr"></div>',
      [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Anotar', clase: 'si', fn: function () {
        var no = document.querySelector('input[name=caTipo]:checked').value === 'n';
        var d = no ? { nombre: document.getElementById('caNom').value, telefono: document.getElementById('caTel').value, email: document.getElementById('caMail').value } : { nro: elegido };
        d.precio = document.getElementById('caPre').value;
        if (document.querySelector('input[name=caModo]:checked').value === 'p') { d.prueba = true; d.fechaPrueba = document.getElementById('caFP').value; }
        if (!no && !elegido) { toast('Elegí el socio'); return; }
        api('adminAltaAlumno', token, document.getElementById('caCur').value, d, document.getElementById('caCob').checked)
          .then(function (r) { toast(r.prueba ? 'Clase de prueba agendada' : 'Alumno anotado' + (r.cargos ? ' (con la cuota de este mes)' : '')); cargarLista(); }).catch(function (e) { toast(msg(e)); });
      } }]);
    var elegido = '';
    var fechaDe = function () { var cu = D.cursos.filter(function (x) { return x.id === document.getElementById('caCur').value; })[0]; document.getElementById('caFP').value = cu ? (cu.proximaIso || '') : ''; };
    fechaDe(); document.getElementById('caCur').onchange = fechaDe;
    document.querySelectorAll('input[name=caModo]').forEach(function (r) { r.onchange = function () { var pr = this.value === 'p'; document.getElementById('caIns').classList.toggle('oculto', pr); document.getElementById('caPru').classList.toggle('oculto', !pr); }; });
    document.querySelectorAll('input[name=caTipo]').forEach(function (r) { r.onchange = function () { var no = this.value === 'n'; document.getElementById('caSoc').classList.toggle('oculto', no); document.getElementById('caNo').classList.toggle('oculto', !no); }; });
    document.getElementById('caBus').oninput = function () {
      var q = sinAcentos(this.value.trim()), res = document.getElementById('caRes');
      if (!q) { res.classList.add('oculto'); return; }
      var m = D.socios.filter(function (s) { return s.nro === q || sinAcentos(s.nombre).indexOf(q) >= 0; }).slice(0, 8);
      res.innerHTML = m.length ? m.map(function (s) { return '<div data-nro="' + esc(s.nro) + '">' + esc(s.nombre) + ' <span class="muted">Nº ' + esc(s.nro) + '</span></div>'; }).join('') : '<div class="muted">Sin resultados</div>';
      res.classList.remove('oculto');
    };
    document.getElementById('caRes').onclick = function (ev) {
      var r = ev.target.closest('[data-nro]'); if (!r) return;
      elegido = r.dataset.nro; this.classList.add('oculto');
      document.getElementById('caBus').value = ''; document.getElementById('caElegido').innerHTML = 'Elegido: <b>' + esc(r.textContent) + '</b>';
    };
  }
  function imprimir(L) {
    var w = window.open('', '_blank');
    if (!w) { toast('El navegador bloqueó la ventana: permití las ventanas emergentes.'); return; }
    var h = '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Clases ' + esc(L.legible) + '</title><style>' +
      'body{font-family:Arial,sans-serif;color:#1d1d1b;margin:24px;font-size:12px} h1{font-size:18px;margin:0} .sub{color:#666;margin:2px 0 14px}' +
      'h2{font-size:14px;margin:18px 0 4px;page-break-after:avoid} .h{color:#666;margin-bottom:6px} table{width:100%;border-collapse:collapse;page-break-inside:auto} tr{page-break-inside:avoid}' +
      'th,td{border:1px solid #bbb;padding:4px 6px;text-align:left} th{background:#f0ede6;font-size:11px} td.n{text-align:right} td.a{width:22px} .mal{color:#b3261e;font-weight:bold} .ok{color:#2e7d4f}' +
      '.tot{margin-top:14px;font-size:12px} @media print{body{margin:10mm} .np{display:none}}</style></head><body>' +
      '<button class="np" onclick="print()" style="float:right;padding:8px 14px">Imprimir</button><h1>' + esc(L.club) + ' — Clases</h1><div class="sub">' + esc(L.legible) + ' · impreso el ' + new Date().toLocaleDateString('es-AR') + '</div>';
    L.cursos.forEach(function (c) {
      h += '<h2>' + esc(c.titulo) + '</h2><div class="h">' + esc(c.horario) + ' · ' + c.inscriptos + ' alumnos · cobrado ' + esc(c.cobradoTxt) + ' · pendiente ' + esc(c.pendienteTxt) + '</div>' +
        '<table><tr><th>#</th><th>Alumno</th><th>Socio</th><th>Teléfono</th><th>' + esc(L.legible) + '</th><th>Debe</th><th colspan="5">Asistencia</th></tr>' +
        (c.alumnos.length ? c.alumnos.map(function (a, i) {
          return '<tr><td>' + (i + 1) + '</td><td>' + esc(a.nombre) + (a.estado === 'Baja' ? ' (baja)' : '') + '</td><td>' + (a.socio ? 'Nº ' + esc(a.nro) : 'No') + '</td><td>' + esc(a.telefono) + '</td>' +
            '<td class="' + (a.mes === 'Pagada' ? 'ok' : a.mes === 'Pendiente' ? 'mal' : '') + '">' + esc(a.mes === 'Pagada' ? 'Pagada' : a.mes === 'Avisado' ? 'Avisó pago' : a.mes === 'Pendiente' ? 'Debe ' + a.mesMonto : a.mes === 'Prueba' ? 'Prueba ' + a.fechaPrueba.slice(0, 5) : '—') + '</td>' +
            '<td class="n' + (a.deuda ? ' mal' : '') + '">' + esc(a.deudaTxt) + '</td><td class="a"></td><td class="a"></td><td class="a"></td><td class="a"></td><td class="a"></td></tr>';
        }).join('') : '<tr><td colspan="11">Sin alumnos</td></tr>') + '</table>';
    });
    h += '<div class="tot"><b>Total ' + esc(L.legible) + ':</b> ' + L.totales.inscriptos + ' alumnos · cobrado ' + esc(L.totales.cobradoTxt) + ' · pendiente ' + esc(L.totales.pendienteTxt) + ' · deuda total ' + esc(L.totales.deudaTxt) +
      (L.porProfesor.length ? '<br>' + L.porProfesor.map(function (p) { return esc(p.profesor) + ': ' + esc(p.cobradoTxt); }).join(' · ') : '') + '</div></body></html>';
    w.document.open(); w.document.write(h); w.document.close();
    setTimeout(function () { try { w.focus(); w.print(); } catch (e) { /* el usuario imprime con el botón */ } }, 400);
  }

  /* ================= Profesores ================= */
  function vProfes() {
    var act = D.profes.filter(function (p) { return p.activo; }), inact = D.profes.filter(function (p) { return !p.activo; });
    var item = function (p) {
      return '<div class="gs-item" data-id="' + esc(p.id) + '"><div class="t"><div><b>' + esc(p.nombre) + '</b>' + (!p.activo ? '<span class="gs-tag">inactivo</span>' : '') +
        '<div class="s">' + [p.telefono, p.email].filter(Boolean).map(esc).join(' · ') + '</div></div><div class="s">' + p.cursos + ' curso' + (p.cursos === 1 ? '' : 's') + '</div></div>' +
        '<div class="ops"><button class="link prEd" type="button">Editar</button>' + (p.activo ? '<button class="mini prBor" type="button">quitar</button>' : '<button class="link prAct" type="button">Reactivar</button>') + '</div></div>';
    };
    var c = cuerpo('vClases', '<div class="card"><h3>Profesores</h3>' + act.map(item).join('') +
      (inact.length ? '<details style="margin-top:8px"><summary class="muted" style="cursor:pointer">Inactivos (' + inact.length + ')</summary>' + inact.map(item).join('') + '</details>' : '') + '</div>' +
      '<div class="card" id="prForm"><h3 id="prTit">Nuevo profesor</h3><label>Nombre</label><input id="prNom" maxlength="60">' +
      '<div class="fila2"><div><label>Teléfono</label><input id="prTel" inputmode="tel"></div><div><label>Email</label><input id="prMail" type="email"></div></div>' +
      '<label>Notas (opcional)</label><input id="prNotas" maxlength="200">' +
      '<div class="fila2"><button class="btn" id="prGuardar" type="button">Guardar</button><button class="btn sec oculto" id="prCancel" type="button">Cancelar</button></div><div class="error" id="prErr"></div></div>');
    var editId = null;
    c.onclick = function (ev) {
      var row = ev.target.closest('.gs-item'); if (!row) return;
      var p = D.profes.filter(function (x) { return x.id === row.dataset.id; })[0];
      if (ev.target.classList.contains('prEd')) {
        editId = p.id; $q('#prTit').textContent = 'Editar ' + p.nombre; $q('#prNom').value = p.nombre; $q('#prTel').value = p.telefono; $q('#prMail').value = p.email; $q('#prNotas').value = p.notas;
        $q('#prCancel').classList.remove('oculto'); $q('#prForm').scrollIntoView({ behavior: 'smooth' });
      } else if (ev.target.classList.contains('prBor')) {
        confirmar('¿Quitar a ' + p.nombre + '? Si tiene cursos queda inactivo; si no, se borra.', 'Quitar', function () {
          api('adminBorrarProfesor', token, p.id).then(function (r) { toast(r.desactivado ? 'Profesor desactivado' : 'Profesor borrado'); abrirClases('profes'); }).catch(function (e) { toast(msg(e)); });
        }, 'peligro');
      } else if (ev.target.classList.contains('prAct')) {
        api('adminGuardarProfesor', token, Object.assign({}, p, { activo: true })).then(function () { toast('Profesor reactivado'); abrirClases('profes'); }).catch(function (e) { toast(msg(e)); });
      }
    };
    $q('#prCancel').onclick = function () { abrirClases('profes'); };
    $q('#prGuardar').onclick = function () {
      var b = this; $q('#prErr').textContent = ''; ocupado(b, true, 'Guardando…');
      api('adminGuardarProfesor', token, { id: editId, nombre: $q('#prNom').value, telefono: $q('#prTel').value, email: $q('#prMail').value, notas: $q('#prNotas').value, activo: true })
        .then(function () { toast('Profesor guardado'); abrirClases('profes'); }).catch(function (e) { $q('#prErr').textContent = msg(e); }).then(function () { ocupado(b, false); });
    };
  }

  /* ================= Avisos: pedidos y pagos de clases ================= */
  // El contador de Avisos (cuotas y eventos) + los de clases. En el tablero el servidor ya los suma.
  var sumar = false, nCl = 0, nBase = null;
  var marcarPrev = window.marcarAvisos;
  window.marcarAvisos = marcarAvisos = function (n) { if (sumar) { nBase = n; marcarPrev(n + nCl); } else marcarPrev(n); };
  var tableroPrev = window.cargarTablero;
  window.cargarTablero = cargarTablero = function () { sumar = false; return tableroPrev.apply(this, arguments); };
  new MutationObserver(function () { if (nCl) { var v = $('aLista').querySelector('.card.muted'); if (v) v.remove(); } })
    .observe($('aLista'), { childList: true });

  var cargarPrev = window.cargarAvisos;
  window.cargarAvisos = cargarAvisos = function () {
    sumar = true; nCl = 0; nBase = null;
    cargarPrev();
    var cont = document.getElementById('aListaCl');
    if (!cont) { cont = document.createElement('div'); cont.id = 'aListaCl'; $('aLista').parentNode.appendChild(cont); }
    cont.innerHTML = '';
    api('adminAvisosClases', token).then(function (r) {
      nCl = r.pedidos.length + r.pagos.length;
      if (nBase !== null) marcarPrev(nBase + nCl);
      if (!nCl) return;
      var vacio = $('aLista').querySelector('.card.muted'); if (vacio) vacio.remove();
      cont.innerHTML = (r.pedidos.length ? '<h3 style="margin-top:18px">Clases: pedidos de inscripción y de prueba</h3>' + r.pedidos.map(function (p) {
        var pr = p.tipo === 'Prueba';
        return '<div class="aviso" data-pe="' + esc(p.id) + '"><b>' + esc(p.nombre) + '</b> (Nº ' + esc(p.nro) + ') — ' + esc(p.fecha) + '<br>' + (pr ? '🎁 Quiere probar una clase gratis de ' : 'Quiere anotarse en ') + esc(p.curso) + ' · ' + esc(p.horario) +
          (p.comentario ? '<br><i>"' + esc(p.comentario) + '"</i>' : '') + '<div class="acc"><button class="clPeNo">Rechazar</button><button class="si ' + (pr ? 'clPeAg">Agendar' : 'clPeSi">Aprobar') + '</button></div></div>';
      }).join('') : '') +
        (r.pagos.length ? '<h3 style="margin-top:18px">Clases: pagos avisados</h3>' + r.pagos.map(function (p, i) {
          return '<div class="aviso" data-pg="' + i + '"><b>' + esc(p.nombre) + '</b> (Nº ' + esc(p.nro) + ') — ' + esc(p.fecha) + '<br>Pagó ' + esc(p.totalTxt) + ' por ' + esc(p.medio) + ': ' + esc(p.detalle) +
            (p.comentario ? '<br><i>"' + esc(p.comentario) + '"</i>' : '') + '<div class="acc"><button class="clPgNo">No llegó</button>' +
            (p.comprobante ? '<button class="gaComp" data-comp="' + esc(p.comprobante) + '">📎 Ver comprobante</button>' : '') + '<button class="si clPgSi">Confirmar pago</button></div></div>';
        }).join('') : '');
      cont.onclick = function (ev) {
        var b = ev.target.closest('button'); if (!b || b.classList.contains('gaComp')) return;
        var pe = ev.target.closest('[data-pe]'), pg = ev.target.closest('[data-pg]');
        if (pe) {
          var p = r.pedidos.filter(function (x) { return x.id === pe.dataset.pe; })[0];
          if (b.classList.contains('clPeAg')) agendarPrueba({ id: p.id, nombre: p.nombre, curso: p.curso, horario: p.horario, proximaIso: p.proximaIso }, cargarAvisos);
          else resolverPedido({ id: p.id, nombre: p.nombre, curso: p.curso }, b.classList.contains('clPeSi'), cargarAvisos);
        } else if (pg) {
          var x = r.pagos[Number(pg.dataset.pg)];
          if (b.classList.contains('clPgSi')) confirmar('¿Llegó el pago de ' + esc(x.totalTxt) + '?', 'Confirmar', function () {
            api('adminPagoClase', token, x.ids, x.medio || 'Transferencia', hoyIso()).then(function () { toast('Pago de clases registrado'); cargarAvisos(); }).catch(function (e) { toast(msg(e)); });
          });
          else confirmar('¿No llegó el pago? Vuelve a quedar pendiente y le avisamos al socio.', 'No llegó', function () {
            api('adminRechazarAvisoClase', token, x.ids).then(function () { toast('Aviso rechazado'); cargarAvisos(); }).catch(function (e) { toast(msg(e)); });
          }, 'peligro');
        }
      };
    }).catch(function (e) { console.warn('avisos clases', e); });
  };

  /* ================= Grupos: cargar varios socios de una vez ================= */
  var gLista = document.getElementById('gLista');
  if (gLista) {
    new MutationObserver(function () {
      gLista.querySelectorAll('.grp').forEach(function (row) {
        if (row.querySelector('.gSoc')) return;
        var b = document.createElement('button'); b.className = 'mini gSoc'; b.type = 'button'; b.textContent = 'socios'; b.style.color = 'var(--azul)';
        row.insertBefore(b, row.querySelector('.gEdit'));
      });
    }).observe(gLista, { childList: true });
    gLista.addEventListener('click', function (ev) {
      if (!ev.target.classList.contains('gSoc')) return;
      ev.stopPropagation();
      sociosDelGrupo(ev.target.closest('.grp').dataset.g);
    }, true);
  }
  function sociosDelGrupo(grupo) {
    api('adminSociosDeGrupo', token, grupo).then(function (r) {
      var sel = {}; r.socios.forEach(function (s) { if (s.en) sel[s.nro] = true; });
      modal('<p><b>Socios del grupo "' + esc(r.grupo) + '"</b> <span class="muted" id="gsCuenta"></span></p>' +
        '<input id="gsBus" placeholder="Buscar por nombre o Nº">' +
        '<div class="chips" style="padding-top:8px"><button type="button" class="chip" data-r="fem">+ Todas las mujeres</button><button type="button" class="chip" data-r="masc">+ Todos los hombres</button>' +
        '<button type="button" class="chip" data-r="65">+ 65 años o más</button><button type="button" class="chip" data-r="menor">+ Menores de 18</button><button type="button" class="chip" data-r="nadie">Sacar a todos</button></div>' +
        '<div id="gsLis" style="max-height:46vh;overflow-y:auto;border:1px solid var(--linea);border-radius:10px;margin-top:8px;padding:0 10px"></div>' +
        '<p class="muted">Los descuentos del grupo se aplican en las cuotas que se generen de acá en adelante.</p>',
        [{ txt: 'Cancelar', clase: 'sec' }, { txt: 'Guardar', clase: 'si', fn: function () {
          api('adminSociosGrupo', token, r.grupo, Object.keys(sel)).then(function (x) {
            toast('Grupo actualizado: ' + x.agregados + ' agregado' + (x.agregados === 1 ? '' : 's') + ', ' + x.quitados + ' sacado' + (x.quitados === 1 ? '' : 's'));
            var det = document.getElementById('gDet'); if (det) { det.open = false; setTimeout(function () { det.open = true; }, 50); }
          }).catch(function (e) { toast(msg(e)); });
        } }]);
      var pintar = function () {
        var q = sinAcentos(document.getElementById('gsBus').value.trim());
        document.getElementById('gsLis').innerHTML = r.socios.filter(function (s) { return !q || s.nro === q || sinAcentos(s.nombre).indexOf(q) >= 0; }).map(function (s) {
          return '<label class="chk" style="border-top:1px solid var(--linea);margin:0;padding:8px 0"><input type="checkbox" value="' + esc(s.nro) + '"' + (sel[s.nro] ? ' checked' : '') + '> ' + esc(s.nombre) +
            ' <span class="muted">Nº ' + esc(s.nro) + (s.genero ? ' · ' + esc(s.genero) : '') + (s.edad !== null ? ' · ' + s.edad + ' años' : '') + (s.estado !== 'Activo' ? ' · ' + esc(s.estado) : '') + '</span></label>';
        }).join('') || '<div class="muted" style="padding:8px 0">Sin resultados</div>';
        document.getElementById('gsCuenta').textContent = '· ' + Object.keys(sel).length + ' elegidos';
      };
      pintar();
      document.getElementById('gsBus').oninput = pintar;
      document.getElementById('gsLis').onchange = function (ev) { if (ev.target.checked) sel[ev.target.value] = true; else delete sel[ev.target.value]; pintar(); };
      document.querySelector('#modalCaja .chips').onclick = function (ev) {
        var b = ev.target.closest('[data-r]'); if (!b) return;
        var f = { fem: function (s) { return s.genero === 'Femenino'; }, masc: function (s) { return s.genero === 'Masculino'; }, '65': function (s) { return s.edad !== null && s.edad >= 65; }, menor: function (s) { return s.edad !== null && s.edad < 18; } }[b.dataset.r];
        if (b.dataset.r === 'nadie') sel = {}; else r.socios.forEach(function (s) { if (f(s)) sel[s.nro] = true; });
        pintar();
      };
    }).catch(function (e) { toast(msg(e)); });
  }

  /* ================= Beneficios ================= */
  var BEN = [];
  function dtoHtml(t) {
    var m = String(t).match(/^\s*(\d{1,3})\s*%\s*(.*)$/);
    return m ? '<div class="cup-dto"><span class="n">' + m[1] + '</span><span class="p">%</span><span class="t">' + esc(m[2] || 'de descuento') + '</span></div>' : '<div class="cup-dto txt">' + esc(t || '…') + '</div>';
  }
  function cuponHtml(b) {
    var ini = String(b.local || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x.charAt(0).toUpperCase(); }).join('');
    var links = [b.direccion ? '📍 ' + b.direccion : '', b.instagram ? '@' + String(b.instagram).replace(/^@/, '') : '', b.telefono ? '📞 ' + b.telefono : ''].filter(Boolean).map(esc).join(' &nbsp; ');
    var det = [b.detalle, b.condiciones].filter(Boolean).map(esc).join(' · ');
    return '<div class="cup" style="--c:' + esc(b.color || '#1f3d2b') + '"><div class="cup-main"><div class="cup-top"><div class="cup-logo">' + (b.logo ? '<img src="' + esc(b.logo) + '" alt="">' : '<div class="cup-ini">' + esc(ini) + '</div>') + '</div>' + dtoHtml(b.descuento) + '</div>' +
      '<div class="cup-local">' + esc(b.local || 'Nombre del local') + (b.rubro ? ' <span>· ' + esc(b.rubro) + '</span>' : '') + '</div>' + (det ? '<div class="cup-det">' + det + '</div>' : '') + (links ? '<div class="cup-links">' + links + '</div>' : '') + '</div>' +
      '<div class="cup-stub"><img src="escudo.svg" alt=""><div class="cup-nro">SOCIO Nº 00</div><div class="cup-sello">AL DÍA ✓</div></div></div>';
  }
  function abrirBeneficios() {
    mostrar('vBeneficios');
    cuerpo('vBeneficios', '<div class="muted">Cargando…</div>');
    api('adminBeneficios', token).then(function (l) { BEN = l; pintarBeneficios(); }).catch(function (e) { cuerpo('vBeneficios', '<div class="error">' + esc(msg(e)) + '</div>'); });
  }
  window.abrirBeneficios = abrirBeneficios;
  function pintarBeneficios() {
    var c = cuerpo('vBeneficios', '<div class="card"><div class="cl-head"><h3>Locales adheridos</h3><button class="link" id="bnNuevo" type="button">+ Nuevo</button></div>' +
      (BEN.length ? BEN.map(function (b, i) {
        return '<div class="bn-it" data-id="' + esc(b.id) + '"><div class="bn-ord"><button class="bnUp" type="button"' + (i ? '' : ' disabled') + '>▲</button><button class="bnDn" type="button"' + (i < BEN.length - 1 ? '' : ' disabled') + '>▼</button></div>' +
          '<div class="bn-logo">' + (b.logo ? '<img src="' + esc(b.logo) + '" alt="">' : '<b>' + esc(b.local.charAt(0)) + '</b>') + '</div>' +
          '<div class="tx"><b>' + esc(b.local) + '</b> · ' + esc(b.descuento) + ' <span class="gs-tag ' + (b.estadoTxt === 'Visible' ? 'ok' : b.estadoTxt === 'Vencido' ? 'mal' : '') + '">' + esc(b.estadoTxt.toLowerCase()) + '</span>' +
          '<div class="s">' + esc(b.vigenciaTxt) + (b.detalle ? ' · ' + esc(b.detalle) : '') + '</div>' +
          '<div class="ops" style="display:flex;gap:10px;margin-top:4px"><button class="link bnEd" type="button">Editar</button><button class="link bnAct" type="button">' + (b.activo ? 'Pausar' : 'Activar') + '</button><button class="mini bnBor" type="button">borrar</button></div></div></div>';
      }).join('') : '<div class="muted">Todavía no hay beneficios cargados.</div>') +
      '<p class="muted">El orden de esta lista es el orden en que los ven los socios. Los socios con cuotas vencidas los ven bloqueados.</p></div><div class="card oculto" id="bnForm"></div>');
    c.querySelector('#bnNuevo').onclick = function () { formBeneficio(null); };
    c.onclick = function (ev) {
      var row = ev.target.closest('.bn-it'); if (!row) return;
      var b = BEN.filter(function (x) { return x.id === row.dataset.id; })[0];
      var t = ev.target;
      if (t.classList.contains('bnEd')) formBeneficio(b);
      else if (t.classList.contains('bnUp') || t.classList.contains('bnDn')) api('adminOrdenBeneficio', token, b.id, t.classList.contains('bnUp') ? -1 : 1).then(abrirBeneficios).catch(function (e) { toast(msg(e)); });
      else if (t.classList.contains('bnAct')) api('adminGuardarBeneficio', token, sinLogo(b, { activo: !b.activo })).then(function () { toast(b.activo ? 'Beneficio pausado' : 'Beneficio activo'); abrirBeneficios(); }).catch(function (e) { toast(msg(e)); });
      else if (t.classList.contains('bnBor')) confirmar('¿Borrar el beneficio de ' + esc(b.local) + '? (si es temporal, mejor pausalo)', 'Borrar', function () {
        api('adminBorrarBeneficio', token, b.id).then(function () { toast('Beneficio borrado'); abrirBeneficios(); }).catch(function (e) { toast(msg(e)); });
      }, 'peligro');
    };
  }
  function sinLogo(b, extra) { var x = Object.assign({}, b, extra || {}); delete x.logo; return x; }
  function formBeneficio(b) {
    var f = $q('#bnForm'); f.classList.remove('oculto');
    var nuevo = !b;
    b = b ? Object.assign({}, b) : { color: '#1f3d2b', activo: true, detalle: 'No acumulable con otras promociones' };
    var logo = b.logo || '';
    var campo = function (id, lab, val, extra) { return '<label>' + lab + '</label><input id="' + id + '" value="' + esc(val || '') + '"' + (extra || '') + '>'; };
    f.innerHTML = '<h3>' + (nuevo ? 'Nuevo beneficio' : 'Editar ' + esc(b.local)) + '</h3>' +
      '<div class="fila2"><div>' + campo('bnLocal', 'Local', b.local, ' maxlength="60"') + '</div><div>' + campo('bnDto', 'Descuento', b.descuento, ' maxlength="40" placeholder="15% · 2x1 · Envío gratis"') + '</div></div>' +
      campo('bnRubro', 'Rubro (opcional)', b.rubro, ' maxlength="60" placeholder="Ej.: Pinturería"') +
      campo('bnDet', 'Aclaración', b.detalle, ' maxlength="200"') + campo('bnCond', 'Condiciones (opcional)', b.condiciones, ' maxlength="200" placeholder="Ej.: Válido en efectivo"') +
      '<div class="fila2"><div>' + campo('bnDir', 'Dirección', b.direccion, ' maxlength="120"') + '</div><div>' + campo('bnTel', 'Teléfono', b.telefono, ' maxlength="40" inputmode="tel"') + '</div></div>' +
      '<div class="fila2"><div>' + campo('bnIg', 'Instagram', b.instagram, ' maxlength="60" placeholder="@usuario"') + '</div><div>' + campo('bnWeb', 'Web', b.web, ' maxlength="150"') + '</div></div>' +
      '<div class="fila2"><div><label>Desde (opcional)</label><input id="bnDesde" type="date" value="' + esc(b.desde || '') + '"></div><div><label>Hasta (opcional)</label><input id="bnHasta" type="date" value="' + esc(b.hasta || '') + '"></div></div>' +
      '<div class="fila2"><div><label>Color</label><input id="bnColor" type="color" value="' + esc(b.color) + '" style="height:44px;padding:4px"></div><div><label>Logo</label><input id="bnLogo" type="file" accept="image/*"></div></div>' +
      '<button class="link" id="bnSinLogo" type="button" style="margin-top:6px">Quitar logo</button>' +
      '<label class="chk"><input type="checkbox" id="bnAct"' + (b.activo ? ' checked' : '') + '> Visible para los socios</label>' +
      (nuevo ? '<label class="chk"><input type="checkbox" id="bnAvisar"> Avisar al celular a los socios</label>' : '') +
      '<div class="bn-prev" id="bnPrev"></div>' +
      '<div class="fila2"><button class="btn" id="bnGuardar" type="button">Guardar</button><button class="btn sec" id="bnCancel" type="button">Cancelar</button></div><div class="error" id="bnErr"></div>';
    var leer = function () {
      return { id: b.id, local: $q('#bnLocal').value, descuento: $q('#bnDto').value, rubro: $q('#bnRubro').value, detalle: $q('#bnDet').value, condiciones: $q('#bnCond').value,
               direccion: $q('#bnDir').value, telefono: $q('#bnTel').value, instagram: $q('#bnIg').value, web: $q('#bnWeb').value, desde: $q('#bnDesde').value, hasta: $q('#bnHasta').value,
               color: $q('#bnColor').value, activo: $q('#bnAct').checked, logo: logo };
    };
    var prev = function () { $q('#bnPrev').innerHTML = '<div class="muted" style="margin-bottom:6px">Así lo ve el socio:</div>' + cuponHtml(leer()); };
    f.oninput = prev; prev();
    $q('#bnSinLogo').onclick = function () { logo = ''; $q('#bnLogo').value = ''; prev(); };
    $q('#bnLogo').onchange = function () {
      var file = this.files[0]; if (!file) return;
      achicarLogo(file).then(function (d) { logo = d; prev(); }).catch(function (e) { toast(msg(e)); });
    };
    $q('#bnCancel').onclick = function () { f.classList.add('oculto'); };
    $q('#bnGuardar').onclick = function () {
      var btn = this; $q('#bnErr').textContent = ''; ocupado(btn, true, 'Guardando…');
      var d = leer();
      if (!nuevo && d.logo === (BEN.filter(function (x) { return x.id === b.id; })[0] || {}).logo) delete d.logo; // no reenviar el mismo logo
      api('adminGuardarBeneficio', token, d, nuevo && $q('#bnAvisar').checked)
        .then(function (r) { toast('Beneficio guardado' + (r.notificados ? ' · avisado a ' + r.notificados + ' celulares' : '')); abrirBeneficios(); })
        .catch(function (e) { $q('#bnErr').textContent = msg(e); }).then(function () { ocupado(btn, false); });
    };
    f.scrollIntoView({ behavior: 'smooth' });
  }
  /** Achica el logo a 360×140 máx., con fondo blanco, en JPEG (para que entre en una celda de la planilla). */
  function achicarLogo(file) {
    return new Promise(function (ok, mal) {
      if (!/^image\//.test(file.type)) { mal(new Error('Elegí una imagen (JPG o PNG).')); return; }
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, 360 / img.width, 140 / img.height);
        var c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var q = 0.88, d = c.toDataURL('image/jpeg', q);
        while (d.length > 45000 && q > 0.4) { q -= 0.1; d = c.toDataURL('image/jpeg', q); }
        if (d.length > 47000) mal(new Error('El logo es muy pesado.')); else ok(d);
      };
      img.onerror = function () { URL.revokeObjectURL(url); mal(new Error('No se pudo leer la imagen.')); };
      img.src = url;
    });
  }
})();
