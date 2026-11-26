/* Comisión CABB — panel de administración.
 * Usa la misma API del Apps Script que la app de socios.
 */
var API_URL = 'https://script.google.com/macros/s/AKfycbz6MBX6o76Dno-xnLE1PtckRpIqfLbuaZ7VbjCjXEuwnreJOD_wJYgCZ9hWd848Ij8/exec';
var LS_TOKEN = 'comision_token', LS_NOMBRE = 'comision_nombre';

var token = null, socios = [], filtro = 'todos', ficha = null, vistaAnterior = 'socios';

function $(id) { return document.getElementById(id); }
function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
function plata(n) { return '$ ' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function sinAcentos(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function msg(err) { return String((err && err.message) || err).replace(/^(Error|Exception):\s*/, ''); }
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }

function api(accion) {
  var args = Array.prototype.slice.call(arguments, 1);
  return fetch(API_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ accion: accion, args: args }), redirect: 'follow'
  }).then(function (r) {
    if (!r.ok) throw new Error('El servidor no respondió (' + r.status + ').');
    return r.json();
  }, function () { throw new Error('No hay conexión. Revisá internet.'); })
    .then(function (res) {
      if (!res || !res.ok) {
        var e = (res && res.error) || 'Error desconocido.';
        if (e === 'SESION') { salir(true); throw new Error('Tu sesión venció. Ingresá de nuevo.'); }
        throw new Error(e);
      }
      return res.data;
    });
}

/* ---------- utilidades de interfaz ---------- */
function toast(t) {
  var el = $('toast'); el.textContent = t; el.classList.remove('oculto');
  clearTimeout(toast._t); toast._t = setTimeout(function () { el.classList.add('oculto'); }, 2800);
}
function modal(html, botones) {
  var caja = $('modalCaja');
  caja.innerHTML = html + '<div class="fila2" id="modalBtns"></div>';
  (botones || [{ txt: 'Listo' }]).forEach(function (b) {
    var el = document.createElement('button');
    el.className = 'btn ' + (b.clase || ''); el.textContent = b.txt;
    el.onclick = function () { cerrarModal(); if (b.fn) b.fn(); };
    $('modalBtns').appendChild(el);
  });
  $('modal').classList.remove('oculto');
}
function cerrarModal() { $('modal').classList.add('oculto'); }
function confirmar(texto, txtSi, fn, clase) {
  modal('<p>' + texto + '</p>', [{ txt: 'Cancelar', clase: 'sec' }, { txt: txtSi, clase: clase || '', fn: fn }]);
}
function ocupado(btn, si, txt) {
  if (si) { btn.dataset.txt = btn.textContent; btn.disabled = true; btn.textContent = txt || 'Un momento…'; }
  else { btn.disabled = false; if (btn.dataset.txt) btn.textContent = btn.dataset.txt; }
}

var VISTAS = ['vLogin', 'vCargando', 'vInicio', 'vSocios', 'vFicha', 'vEscanear', 'vAvisos', 'vMas', 'vAlta'];
function mostrar(v) {
  VISTAS.forEach(function (x) { $(x).classList.toggle('oculto', x !== v); });
  if (v !== 'vEscanear') detenerCamara();
  window.scrollTo(0, 0);
}
function ir(nombre) {
  document.querySelectorAll('nav.tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.ir === nombre); });
  if (nombre === 'inicio') { mostrar('vInicio'); cargarTablero(); }
  else if (nombre === 'socios') { mostrar('vSocios'); cargarSocios(); }
  else if (nombre === 'escanear') { mostrar('vEscanear'); iniciarCamara(); }
  else if (nombre === 'avisos') { mostrar('vAvisos'); cargarAvisos(); }
  else if (nombre === 'mas') { mostrar('vMas'); }
  else if (nombre === 'alta') { mostrar('vAlta'); }
}
document.addEventListener('click', function (ev) {
  var b = ev.target.closest && ev.target.closest('[data-ir]');
  if (b) { ev.preventDefault(); ir(b.dataset.ir); }
});
$('modal').addEventListener('click', function (ev) { if (ev.target.id === 'modal') cerrarModal(); });

/* ---------- sesión ---------- */
$('fLogin').addEventListener('submit', function (ev) {
  ev.preventDefault();
  $('eLogin').textContent = '';
  ocupado($('bLogin'), true, 'Entrando…');
  api('adminLogin', $('lUsuario').value, $('lClave').value).then(function (r) {
    token = r.token; ls(LS_TOKEN, r.token); ls(LS_NOMBRE, r.nombre);
    $('lClave').value = '';
    entrar(r.nombre);
  }).catch(function (e) { $('eLogin').textContent = msg(e); })
    .then(function () { ocupado($('bLogin'), false); });
});

function entrar(nombre) {
  $('hQuien').textContent = nombre || ''; $('hQuien').classList.remove('oculto');
  $('nav').classList.remove('oculto');
  ir('inicio');
}

function salir(silencioso) {
  if (token && !silencioso) api('adminSalir', token).catch(function () {});
  token = null; ls(LS_TOKEN, null); ls(LS_NOMBRE, null);
  $('nav').classList.add('oculto'); $('hQuien').classList.add('oculto');
  mostrar('vLogin');
}
$('bSalir').addEventListener('click', function () { salir(false); });

/* ---------- tablero ---------- */
function cargarTablero() {
  api('adminTablero', token).then(function (d) {
    $('kActivos').textContent = d.activos;
    $('kAlDia').textContent = d.alDia;
    $('kMorosos').textContent = d.morosos;
    $('kDeuda').textContent = d.deudaVencida;
    $('kMes').textContent = d.mesLegible;
    $('kRec').textContent = d.recaudadoMes;
    $('kMedios').innerHTML = Object.keys(d.porMedioMes).map(function (m) { return '<span>' + esc(m) + ': <b>' + esc(d.porMedioMes[m]) + '</b></span>'; }).join('');
    var max = Math.max.apply(null, d.serie.map(function (s) { return s.total; }).concat([1]));
    $('kBarras').innerHTML = d.serie.map(function (s) {
      return '<div class="barra"><div class="t">' + (s.total ? esc(s.txt) : '') + '</div><div class="b" style="height:' + Math.round(s.total / max * 100) + '%"></div><div class="m">' + esc(s.mes) + '</div></div>';
    }).join('');
    marcarAvisos(d.avisosPendientes);
  }).catch(function (e) { toast(msg(e)); });
}
function marcarAvisos(n) {
  $('tAvisos').classList.toggle('oculto', !n);
  $('tAvisosN').textContent = n === 1 ? '1 aviso de pago para revisar' : n + ' avisos de pago para revisar';
  $('navBadge').classList.toggle('oculto', !n); $('navBadge').textContent = n;
}
$('tAvisos').addEventListener('click', function () { ir('avisos'); });
$('bRefrescar').addEventListener('click', cargarTablero);

/* ---------- socios ---------- */
function cargarSocios() {
  if (!socios.length) $('sLista').innerHTML = '<div class="cargando">Cargando socios…</div>';
  api('adminSocios', token).then(function (lista) { socios = lista; pintarSocios(); })
    .catch(function (e) { $('sLista').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
}
function estadoHtml(s) {
  if (s.estado !== 'Activo') return '<span class="estado gris">' + esc(s.estado || '—') + '</span>';
  if (!s.alDia) return '<span class="estado mal">Debe ' + esc(s.deudaTxt || plata(s.deuda)) + '</span>';
  if (s.pendientes) return '<span class="estado pend">Por vencer</span>';
  return '<span class="estado ok">Al día</span>';
}
function pintarSocios() {
  var q = sinAcentos($('sBuscar').value).trim();
  var lista = socios.filter(function (s) {
    if (filtro === 'deuda' && !(s.estado === 'Activo' && !s.alDia)) return false;
    if (filtro === 'aldia' && !(s.estado === 'Activo' && s.alDia)) return false;
    if (filtro === 'inactivos' && s.estado === 'Activo') return false;
    if (!q) return true;
    if (/^\d+$/.test(q)) return String(s.nro) === q || s.dni.indexOf(q) === 0;
    var t = sinAcentos(s.apellido + ' ' + s.nombre + ' ' + s.nombre + ' ' + s.apellido);
    return q.split(/\s+/).every(function (p) { return t.indexOf(p) >= 0; });
  });
  $('sCuenta').textContent = lista.length + (lista.length === 1 ? ' socio' : ' socios');
  $('sLista').innerHTML = lista.length ? lista.map(function (s) {
    var ini = (s.apellido.charAt(0) + s.nombre.charAt(0)).toUpperCase();
    return '<div class="socio" data-nro="' + esc(s.nro) + '"><div class="av">' + esc(ini) + '</div><div class="info">' +
      '<div class="n">' + esc(s.apellido) + ', ' + esc(s.nombre) + '</div><div class="d">Nº ' + esc(s.nro) + ' · DNI ' + esc(s.dni) + '</div></div>' +
      estadoHtml(s) + '</div>';
  }).join('') : '<div class="muted" style="text-align:center;padding:20px">No hay socios con ese criterio.</div>';
}
$('sBuscar').addEventListener('input', pintarSocios);
$('sChips').addEventListener('click', function (ev) {
  var c = ev.target.closest('.chip'); if (!c) return;
  filtro = c.dataset.f;
  document.querySelectorAll('#sChips .chip').forEach(function (x) { x.classList.toggle('on', x === c); });
  pintarSocios();
});
$('sLista').addEventListener('click', function (ev) {
  var el = ev.target.closest('.socio'); if (el) abrirFicha(el.dataset.nro, 'socios');
});
$('bNuevo').addEventListener('click', function () { ir('alta'); });

/* ---------- ficha ---------- */
function telWhatsApp(t) {
  var d = String(t || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.indexOf('54') === 0) return d;
  if (d.charAt(0) === '0') d = d.slice(1);
  d = d.replace(/^(\d{2,4})15/, '$1'); // saca el 15 de los celulares
  return '549' + d;
}
function abrirFicha(nro, desde) {
  vistaAnterior = desde || 'socios';
  mostrar('vFicha');
  $('fNombre').textContent = 'Cargando…'; $('fDatos').textContent = ''; $('fEstado').textContent = '';
  $('fContacto').innerHTML = ''; $('fAvisos').innerHTML = ''; $('fPendientes').innerHTML = ''; $('fHistorial').innerHTML = '';
  $('fAdelantos').innerHTML = ''; $('ePago').textContent = ''; $('fEditarDet').open = false;
  api('adminFicha', token, nro).then(pintarFicha).catch(function (e) { $('fNombre').textContent = msg(e); });
}
function pintarFicha(f) {
  ficha = f;
  $('fNombre').textContent = f.nombre + ' ' + f.apellido;
  $('fDatos').textContent = 'Nº ' + f.nro + ' · DNI ' + f.dni + (f.categoria ? ' · ' + f.categoria : '') + (f.socioDesde ? ' · desde ' + f.socioDesde : '');
  var e = $('fEstado');
  if (f.estado !== 'Activo') { e.className = 'estado gris'; e.textContent = f.estado; }
  else if (!f.alDia) { e.className = 'estado mal'; e.textContent = 'Debe ' + f.deudaTxt + ' (' + f.vencidas + ' vencida' + (f.vencidas === 1 ? '' : 's') + ')'; }
  else if (f.pendientes) { e.className = 'estado pend'; e.textContent = 'Cuota por vencer'; }
  else { e.className = 'estado ok'; e.textContent = 'Al día'; }

  var c = '';
  var wa = telWhatsApp(f.telefono);
  if (wa) c += '<a href="https://wa.me/' + wa + '" target="_blank" rel="noopener">WhatsApp</a>';
  if (f.telefono) c += '<a href="tel:' + esc(f.telefono.replace(/\s/g, '')) + '">Llamar</a>';
  if (f.email) c += '<a href="mailto:' + esc(f.email) + '">Mail</a>';
  $('fContacto').innerHTML = c || '<span class="muted" style="color:#fff;opacity:.7">Sin teléfono ni mail cargados</span>';

  $('fAvisos').innerHTML = f.avisos.map(function (a) {
    return '<div class="aviso">📩 <b>Avisó un pago</b> el ' + esc(a.fecha) + ': ' + esc(a.periodo) + ' por ' + esc(a.medio) +
      (a.comentario ? ' — "' + esc(a.comentario) + '"' : '') + '<div class="muted" style="margin-top:4px">Si el dinero está, marcá la cuota abajo y registrá el pago.</div></div>';
  }).join('');

  var pend = f.cuotas.filter(function (x) { return x.estado === 'Pendiente'; }).reverse();
  $('fPendientes').innerHTML = pend.length ? pend.map(function (x) {
    return '<label class="cuota"><input type="checkbox" class="chkCuota" value="' + esc(x.id) + '" data-m="' + x.monto + '"' + (f.avisos.length ? ' checked' : '') + '>' +
      '<div class="info">' + esc(x.legible) + '<div class="det">' + (x.vencida ? 'Venció el ' : 'Vence el ') + esc(x.vence) + '</div></div><div class="m">' + esc(x.montoTxt) + '</div></label>';
  }).join('') : '<div class="muted">No tiene cuotas pendientes.</div>';
  $('fFecha').value = f.hoy; $('fObs').value = '';
  totalPago();

  $('fHistorial').innerHTML = f.cuotas.length ? f.cuotas.map(function (x) {
    var det, est;
    if (x.estado === 'Pagada') { est = '<span class="estado ok">Pagada</span>'; det = esc(x.pagada) + (x.medio ? ' · ' + esc(x.medio) : '') + (x.registro ? ' · ' + esc(x.registro) : ''); }
    else if (x.estado === 'Anulada') { est = '<span class="estado gris">Anulada</span>'; det = ''; }
    else { est = '<span class="estado ' + (x.vencida ? 'mal">Vencida' : 'pend">Pendiente') + '</span>'; det = (x.vencida ? 'Venció el ' : 'Vence el ') + esc(x.vence) + ' · <button class="mini" data-anular="' + esc(x.id) + '">anular</button>'; }
    return '<div class="cuota"><div class="info">' + esc(x.legible) + ' — ' + esc(x.montoTxt) + '<div class="det">' + det + '</div></div>' + est + '</div>';
  }).join('') : '<div class="muted">Todavía no tiene cuotas.</div>';

  $('eApellido').value = f.apellido; $('eNombre').value = f.nombre; $('eEmail').value = f.email;
  $('eTelefono').value = f.telefono; $('eDomicilio').value = f.domicilio || ''; $('eObs').value = f.observaciones; $('eEstado').value = f.estado || 'Activo';
  var cats = f.categorias.slice(); if (f.categoria && cats.indexOf(f.categoria) < 0) cats.push(f.categoria);
  $('eCategoria').innerHTML = cats.map(function (k) { return '<option' + (k === f.categoria ? ' selected' : '') + '>' + esc(k) + '</option>'; }).join('');
  $('aCategoria').innerHTML = f.categorias.map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('');
}
$('bVolver').addEventListener('click', function () { ir(vistaAnterior); });

function siguientePeriodo(p) {
  var a = Number(p.slice(0, 4)), m = Number(p.slice(5, 7)) + 1;
  if (m > 12) { m = 1; a++; }
  return a + '-' + ('0' + m).slice(-2);
}
$('bAdelanto').addEventListener('click', function () {
  if (!ficha) return;
  var existentes = ficha.cuotas.map(function (x) { return x.periodo; });
  var filas = document.querySelectorAll('#fAdelantos input[type=month]');
  var p = filas.length ? filas[filas.length - 1].value : ficha.periodoActual;
  do { p = siguientePeriodo(p); } while (existentes.indexOf(p) >= 0);
  var div = document.createElement('div'); div.className = 'adel';
  div.innerHTML = '<input type="month" value="' + p + '"><input type="number" min="0" step="1" value="' + (ficha.montoSugerido || '') + '" placeholder="Monto"><button type="button" title="Quitar">✕</button>';
  $('fAdelantos').appendChild(div);
  totalPago();
});
$('fAdelantos').addEventListener('click', function (ev) { if (ev.target.tagName === 'BUTTON') { ev.target.parentNode.remove(); totalPago(); } });
$('vFicha').addEventListener('change', totalPago);
$('vFicha').addEventListener('input', function (ev) { if (ev.target.closest('#fAdelantos')) totalPago(); });
function totalPago() {
  var t = 0, n = 0;
  document.querySelectorAll('.chkCuota:checked').forEach(function (c) { t += Number(c.dataset.m) || 0; n++; });
  document.querySelectorAll('#fAdelantos .adel').forEach(function (a) { var m = Number(a.querySelectorAll('input')[1].value) || 0; if (m) { t += m; n++; } });
  $('fTotal').innerHTML = n ? n + (n === 1 ? ' cuota' : ' cuotas') + ' · Total <b>' + plata(t) + '</b>' : '';
  $('bPagar').disabled = !n;
}
$('bPagar').addEventListener('click', function () {
  var ids = []; document.querySelectorAll('.chkCuota:checked').forEach(function (c) { ids.push(c.value); });
  var adel = []; document.querySelectorAll('#fAdelantos .adel').forEach(function (a) { var i = a.querySelectorAll('input'); adel.push({ periodo: i[0].value, monto: i[1].value }); });
  $('ePago').textContent = '';
  var nro = ficha.nro, nombre = ficha.nombre + ' ' + ficha.apellido;
  confirmar('¿Registrar ' + $('fTotal').textContent.replace('·', '—') + ' de <b>' + esc(nombre) + '</b> en ' + esc($('fMedio').value) + '?', 'Registrar', function () {
    ocupado($('bPagar'), true, 'Registrando…');
    api('adminRegistrarPago', token, { nro: nro, ids: ids, adelantos: adel, medio: $('fMedio').value, fecha: $('fFecha').value, obs: $('fObs').value })
      .then(function (r) { toast('Pago registrado: ' + r.cantidad + (r.cantidad === 1 ? ' cuota' : ' cuotas') + ' por ' + r.total + (r.reciboTxt ? ' · comprobante Nº ' + r.reciboTxt + (r.envio && r.envio.mail ? ' (enviado por mail)' : '') : '')); socios = []; abrirFicha(nro, vistaAnterior); })
      .catch(function (e) { $('ePago').textContent = msg(e); })
      .then(function () { ocupado($('bPagar'), false); totalPago(); });
  }, 'verde');
});
$('fHistorial').addEventListener('click', function (ev) {
  var id = ev.target.dataset && ev.target.dataset.anular; if (!id) return;
  confirmar('¿Anular esta cuota? Queda como bonificada y deja de figurar como deuda.', 'Anular', function () {
    api('adminAnularCuota', token, id).then(function () { toast('Cuota anulada'); socios = []; abrirFicha(ficha.nro, vistaAnterior); })
      .catch(function (e) { toast(msg(e)); });
  }, 'peligro');
});
$('bGuardar').addEventListener('click', function () {
  var b = $('bGuardar'); $('eEditar').textContent = '';
  ocupado(b, true, 'Guardando…');
  api('adminEditar', token, ficha.nro, {
    Apellido: $('eApellido').value, Nombre: $('eNombre').value, Email: $('eEmail').value, Telefono: $('eTelefono').value, Domicilio: $('eDomicilio').value,
    Categoria: $('eCategoria').value, Estado: $('eEstado').value, Observaciones: $('eObs').value
  }).then(function () { toast('Datos guardados'); socios = []; abrirFicha(ficha.nro, vistaAnterior); })
    .catch(function (e) { $('eEditar').textContent = msg(e); })
    .then(function () { ocupado(b, false); });
});
$('bNuevaClave').addEventListener('click', function () {
  confirmar('¿Generar una clave nueva para el portal de ' + esc(ficha.nombre) + '? La anterior deja de funcionar.', 'Generar', function () {
    api('adminNuevaClave', token, ficha.nro).then(function (r) {
      var wa = telWhatsApp(ficha.telefono);
      var texto = 'Hola ' + ficha.nombre + ', tu nueva clave del portal de socios del Círculo es ' + r.clave + '. Entrá con tu DNI en https://federicomolero-sys.github.io/socios-cabb/';
      modal('<p>Clave nueva de <b>' + esc(r.socio) + '</b>:</p><div class="clave">' + esc(r.clave) + '</div><p class="muted">' +
        (r.enviado ? 'También se la mandamos por mail.' : 'No tiene mail cargado: pasásela por WhatsApp.') + ' Anotala: no se guarda.</p>' +
        (wa ? '<a class="btn verde" target="_blank" rel="noopener" href="https://wa.me/' + wa + '?text=' + encodeURIComponent(texto) + '">Mandar por WhatsApp</a>' : ''));
    }).catch(function (e) { toast(msg(e)); });
  });
});

/* ---------- avisos ---------- */
function cargarAvisos() {
  $('aLista').innerHTML = '<div class="cargando">Cargando…</div>';
  api('adminAvisos', token).then(function (l) {
    marcarAvisos(l.length);
    $('aLista').innerHTML = l.length ? l.map(function (a) {
      return '<div class="aviso"><b>' + esc(a.socio) + '</b> (Nº ' + esc(a.nro) + ') — ' + esc(a.fecha) + '<br>Pagó: ' + esc(a.periodo) + ' por ' + esc(a.medio) +
        (a.comentario ? '<br><i>"' + esc(a.comentario) + '"</i>' : '') +
        '<div class="acc"><button data-rech="' + a.fila + '">Rechazar</button><button class="si" data-ficha="' + esc(a.nro) + '">Controlar y registrar</button></div></div>';
    }).join('') : '<div class="card muted" style="text-align:center">No hay avisos pendientes 👌</div>';
  }).catch(function (e) { $('aLista').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
}
$('aLista').addEventListener('click', function (ev) {
  var t = ev.target;
  if (t.dataset.ficha) abrirFicha(t.dataset.ficha, 'avisos');
  if (t.dataset.rech) confirmar('¿Rechazar este aviso? (por ejemplo, si el dinero no llegó)', 'Rechazar', function () {
    api('adminResolverAviso', token, Number(t.dataset.rech), 'Rechazado').then(function () { toast('Aviso rechazado'); cargarAvisos(); })
      .catch(function (e) { toast(msg(e)); });
  }, 'peligro');
});

/* ---------- escáner de QR ---------- */
var stream = null, escaneando = false, detector = null;
function iniciarCamara() {
  $('escMsg').textContent = 'Apuntá la cámara al QR del carnet del socio.';
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('escMsg').textContent = 'Este navegador no permite usar la cámara.'; return; }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(function (s) {
    stream = s; var v = $('video'); v.srcObject = s; v.play();
    if ('BarcodeDetector' in window) { try { detector = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { detector = null; } }
    escaneando = true; requestAnimationFrame(leerCuadro);
  }).catch(function () { $('escMsg').textContent = 'No pude abrir la cámara. Revisá el permiso de cámara para este sitio.'; });
}
function detenerCamara() {
  escaneando = false;
  if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
}
var ultimoIntento = 0;
function leerCuadro() {
  if (!escaneando) return;
  var v = $('video');
  if (v.readyState >= 2 && Date.now() - ultimoIntento > 250) {
    ultimoIntento = Date.now();
    if (detector) {
      detector.detect(v).then(function (r) { if (r && r.length) encontrado(r[0].rawValue); }).catch(function () {});
    } else if (window.jsQR) {
      var c = $('escCanvas'), w = v.videoWidth, h = v.videoHeight, k = Math.min(1, 640 / w);
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(v, 0, 0, c.width, c.height);
      var d = g.getImageData(0, 0, c.width, c.height), r = window.jsQR(d.data, c.width, c.height);
      if (r && r.data) encontrado(r.data);
    }
  }
  requestAnimationFrame(leerCuadro);
}
function encontrado(texto) {
  if (!escaneando) return;
  escaneando = false;
  if (navigator.vibrate) navigator.vibrate(80);
  $('escMsg').textContent = 'Buscando socio…';
  api('adminPorQR', token, texto).then(function (nro) { abrirFicha(nro, 'escanear'); })
    .catch(function (e) { $('escMsg').textContent = msg(e) + ' Probá de nuevo.'; setTimeout(function () { escaneando = true; requestAnimationFrame(leerCuadro); }, 1500); });
}

/* ---------- alta ---------- */
$('fAlta').addEventListener('submit', function (ev) {
  ev.preventDefault();
  var f = $('fAlta'), d = {};
  Array.prototype.forEach.call(f.elements, function (el) { if (el.name) d[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
  $('eAlta').textContent = '';
  ocupado($('bAlta'), true, 'Guardando…');
  api('adminAlta', token, d).then(function (r) {
    f.reset(); socios = [];
    var nombre = d.Nombre + ' ' + d.Apellido, wa = telWhatsApp(d.Telefono);
    var texto = 'Hola ' + d.Nombre + ', ¡bienvenido/a al Círculo de Ajedrez! Ya podés ver tu carnet digital en https://federicomolero-sys.github.io/socios-cabb/ — entrás con tu DNI y la clave ' + r.clave +
      (r.estatuto ? '. Te compartimos también el Estatuto del Círculo: ' + r.estatuto + ' (lo tenés siempre en la app, en Perfil → Documentos).' : '');
    modal('<p><b>' + esc(nombre) + '</b> quedó como socio <b>Nº ' + r.nro + '</b>.</p><p>Clave inicial del portal:</p><div class="clave">' + esc(r.clave) + '</div><p class="muted">' +
      (r.emailEnviado ? 'Se la mandamos por mail.' : 'Pasásela por WhatsApp.') + ' Anotala: no se guarda.</p>' +
      (r.cuotaAlta && r.cuotaAlta.texto ? '<p class="muted">💳 ' + esc(r.cuotaAlta.texto) + '</p>' : '') +
      (wa ? '<a class="btn verde" target="_blank" rel="noopener" href="https://wa.me/' + wa + '?text=' + encodeURIComponent(texto) + '">Mandar por WhatsApp</a>' : ''),
      [{ txt: 'Imprimir ficha', clase: 'sec', fn: function () { if (window.imprimirFichaSocio) window.imprimirFichaSocio(r.nro); } },
       { txt: 'Ver su ficha', fn: function () { abrirFicha(r.nro, 'socios'); } }]);
  }).catch(function (e) { $('eAlta').textContent = msg(e); })
    .then(function () { ocupado($('bAlta'), false); });
});

/* ---------- más ---------- */
$('bGenerar').addEventListener('click', function () {
  var p = $('mPeriodo').value; if (!p) { toast('Elegí el mes'); return; }
  confirmar('¿Generar las cuotas de ' + p + ' para todos los socios activos?', 'Generar', function () {
    ocupado($('bGenerar'), true, '…');
    api('adminGenerarCuotas', token, p).then(function (r) {
      $('mGenerarRes').textContent = 'Cuotas nuevas: ' + r.generadas + '. Ya la tenían: ' + r.existentes + '.' + (r.sinMonto.length ? ' Sin monto definido: ' + r.sinMonto.join(', ') + '.' : '');
      socios = [];
    }).catch(function (e) { $('mGenerarRes').textContent = msg(e); })
      .then(function () { ocupado($('bGenerar'), false); });
  });
});
$('bRecordar').addEventListener('click', function () {
  confirmar('¿Mandar ahora los recordatorios? Llegan por mail y, a quienes activaron los avisos, también al celular.', 'Enviar', function () {
    ocupado($('bRecordar'), true, 'Enviando…');
    api('adminRecordatorios', token).then(function (r) {
      $('mRecordarRes').textContent = 'Mails enviados: ' + r.enviados + '.' + (r.notificados ? ' Avisos al celular: ' + r.notificados + '.' : '') + (r.porCupo ? ' Quedaron ' + r.porCupo + ' para mañana por el límite diario.' : '') +
        (r.sinEmail.length ? ' Sin mail ni avisos: ' + r.sinEmail.join(', ') + '.' : '');
    }).catch(function (e) { $('mRecordarRes').textContent = msg(e); })
      .then(function () { ocupado($('bRecordar'), false); });
  });
});
$('bCambiarClave').addEventListener('click', function () {
  $('eClave').textContent = ''; $('eClave').className = 'error';
  var n1 = $('cNueva').value.trim().toUpperCase(), n2 = $('cNueva2').value.trim().toUpperCase();
  if (n1 !== n2) { $('eClave').textContent = 'Las dos claves nuevas no coinciden. Escribilas de nuevo.'; $('cNueva2').value = ''; $('cNueva2').focus(); return; }
  if (n1.length < 10 || !/[A-ZÑ]/.test(n1) || !/[0-9]/.test(n1)) { $('eClave').textContent = 'La clave nueva tiene que tener al menos 10 caracteres, con letras y números.'; return; }
  api('adminCambiarClave', token, $('cActual').value, $('cNueva').value).then(function () {
    $('cActual').value = ''; $('cNueva').value = ''; $('cNueva2').value = ''; $('eClave').className = 'ok'; $('eClave').textContent = 'Clave cambiada.';
  }).catch(function (e) { $('eClave').textContent = msg(e); });
});
(function () { var d = new Date(); $('mPeriodo').value = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); })();

/* ---------- arranque ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}
token = ls(LS_TOKEN);
if (token) entrar(ls(LS_NOMBRE)); else mostrar('vLogin');

/* ---------- Ojito para ver la clave ---------- */
function ponerOjitos(raiz) {
  var abierto = '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var cerrado = '<svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.2-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  Array.prototype.forEach.call((raiz || document).querySelectorAll('input[type=password]'), function (inp) {
    if (inp.parentNode.classList.contains('ojo-w')) return;
    var w = document.createElement('div'); w.className = 'ojo-w';
    inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ojo'; b.setAttribute('aria-label', 'Mostrar la clave'); b.innerHTML = abierto;
    b.addEventListener('click', function () {
      var ver = inp.type === 'password';
      inp.type = ver ? 'text' : 'password';
      b.innerHTML = ver ? cerrado : abierto; b.setAttribute('aria-label', ver ? 'Ocultar la clave' : 'Mostrar la clave');
    });
    w.appendChild(b);
  });
}
ponerOjitos();
