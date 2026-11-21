/* Socios CABB — app del socio.
 * Habla con el Apps Script de la planilla a través de su API (doPost).
 * Si se vuelve a publicar el script con OTRO link, cambiar API_URL.
 */
var API_URL = 'https://script.google.com/macros/s/AKfycbz6MBX6o76Dno-xnLE1PtckRpIqfLbuaZ7VbjCjXEuwnreJOD_wJYgCZ9hWd848Ij8/exec';

var token = null;
var datos = null;
var CLAVE_LS = 'socios_token';

function $(id) { return document.getElementById(id); }

/** Llama a una acción del servidor. Devuelve una promesa con los datos o un Error. */
function api(accion) {
  var args = Array.prototype.slice.call(arguments, 1);
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita el preflight CORS
    body: JSON.stringify({ accion: accion, args: args }),
    redirect: 'follow'
  })
    .then(function (r) {
      if (!r.ok) throw new Error('El servidor no respondió (' + r.status + '). Probá de nuevo.');
      return r.json();
    }, function () {
      throw new Error('No hay conexión. Revisá internet y probá de nuevo.');
    })
    .then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || 'Error desconocido.');
      return res.data;
    });
}

function mostrar(vista) {
  ['vCargando', 'vLogin', 'vPanel'].forEach(function (v) { $(v).classList.toggle('oculto', v !== vista); });
}
function guardarToken(t) { token = t; try { t ? localStorage.setItem(CLAVE_LS, t) : localStorage.removeItem(CLAVE_LS); } catch (e) {} }
function leerToken() { try { return localStorage.getItem(CLAVE_LS); } catch (e) { return null; } }
function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
function msgError(err) {
  var m = (err && err.message) ? err.message : String(err);
  return m.replace(/^Error:\s*/, '').replace(/^Exception:\s*/, '');
}
function sesionVencida(err) {
  if (msgError(err) === 'SESION') {
    guardarToken(null); mostrar('vLogin');
    $('eLogin').textContent = 'Tu sesión venció. Ingresá de nuevo.';
    return true;
  }
  return false;
}

function iniciar() {
  var t = leerToken();
  if (!t) { mostrar('vLogin'); return; }
  token = t;
  api('datos', t).then(pintar).catch(function (err) {
    if (msgError(err) === 'SESION') { guardarToken(null); mostrar('vLogin'); return; }
    mostrar('vLogin');
    $('eLogin').textContent = msgError(err);
  });
}

$('fLogin').addEventListener('submit', function (ev) {
  ev.preventDefault();
  $('eLogin').textContent = '';
  $('bLogin').disabled = true; $('bLogin').textContent = 'Entrando…';
  api('login', $('dni').value, $('clave').value)
    .then(function (r) {
      guardarToken(r.token); $('clave').value = ''; pintar(r.datos);
    })
    .catch(function (err) { $('eLogin').textContent = msgError(err); })
    .then(function () { $('bLogin').disabled = false; $('bLogin').textContent = 'Entrar'; });
});

function pintar(d) {
  datos = d;
  $('cClub').textContent = d.club;
  $('cNombre').textContent = d.nombre + ' ' + d.apellido;
  $('cDatos').textContent = 'Socio Nº ' + d.nro + (d.categoria ? ' · ' + d.categoria : '') + ' · DNI ' + d.dni;
  $('cDesde').textContent = d.socioDesde ? 'Socio desde ' + d.socioDesde : '';
  var b = $('cBadge');
  if (d.estado !== 'Activo') { b.className = 'badge gris'; b.textContent = d.estado.toUpperCase(); }
  else if (d.alDia) { b.className = 'badge ok'; b.textContent = '✓ AL DÍA'; }
  else { b.className = 'badge mal'; b.textContent = 'CUOTAS VENCIDAS'; }

  $('cQR').innerHTML = '';
  if (window.QRCode) {
    new QRCode($('cQR'), { text: d.qr, width: 240, height: 240, correctLevel: QRCode.CorrectLevel.M });
  } else {
    $('cQR').innerHTML = '<div style="color:#333;font-size:11px;padding:6px">No se pudo dibujar el QR.</div>';
  }

  var bd = $('bDeuda');
  if (d.cantPendientes === 0) {
    bd.className = 'card deuda ok';
    $('dTitulo').textContent = 'Estás al día 👍';
    $('dTexto').textContent = 'No tenés cuotas pendientes. ¡Gracias por acompañar al club!';
  } else {
    bd.className = 'card deuda' + (d.cantVencidas ? '' : ' ok');
    $('dTitulo').textContent = 'Saldo pendiente: ' + d.deuda;
    $('dTexto').textContent = d.cantPendientes + (d.cantPendientes === 1 ? ' cuota pendiente' : ' cuotas pendientes') +
      (d.cantVencidas ? ' (' + d.cantVencidas + ' vencida' + (d.cantVencidas === 1 ? '' : 's') + ')' : ' (todavía no vencida)') + '.';
  }
  $('dAviso').classList.toggle('oculto', !d.avisosPendientes);
  $('bAviso').classList.toggle('oculto', d.cantPendientes === 0);
  $('detPago').open = d.cantPendientes > 0;

  var p = d.pago, h = '';
  if (p.alias) h += filaPago('Alias', p.alias);
  if (p.cbu) h += filaPago('CBU/CVU', p.cbu);
  if (p.titular) h += '<div class="muted" style="margin-top:6px">Titular: ' + esc(p.titular) + '</div>';
  if (p.mp) h += '<a class="btn" style="background:#009ee3" href="' + esc(p.mp) + '" target="_blank" rel="noopener">Pagar con Mercado Pago</a>';
  $('pDatos').innerHTML = h;

  var pend = d.cuotas.filter(function (c) { return c.estado === 'Pendiente'; });
  var opts = pend.map(function (c) { return '<option value="' + esc(c.periodo) + '">' + esc(c.legible) + ' — ' + esc(c.monto) + '</option>'; });
  if (pend.length > 1) opts.push('<option value="todas">Todas las pendientes</option>');
  $('aPeriodo').innerHTML = opts.join('');
  $('aMedio').innerHTML = d.medios.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('');

  if (!d.cuotas.length) {
    $('lCuotas').innerHTML = '<div class="muted">Todavía no hay cuotas registradas.</div>';
  } else {
    $('lCuotas').innerHTML = d.cuotas.map(function (c) {
      var est, det;
      if (c.estado === 'Pagada') { est = '<span class="est-Pagada">Pagada</span>'; det = 'Pagada el ' + c.pagada + (c.medio ? ' · ' + c.medio : ''); }
      else if (c.vencida) { est = '<span class="est-vencida">Vencida</span>'; det = 'Venció el ' + c.vence; }
      else { est = '<span class="est-Pendiente">Pendiente</span>'; det = 'Vence el ' + c.vence; }
      return '<div class="cuota"><div><div>' + esc(c.legible) + '</div><div class="det">' + esc(det) + '</div></div>' +
             '<div class="monto">' + esc(c.monto) + '<br>' + est + '</div></div>';
    }).join('');
  }
  mostrar('vPanel');
}

function filaPago(rotulo, valor) {
  return '<div class="dato-pago"><span>' + esc(rotulo) + ': <b>' + esc(valor) + '</b></span>' +
         '<button type="button" class="copiar" data-v="' + esc(valor) + '">Copiar</button></div>';
}

document.addEventListener('click', function (ev) {
  var b = ev.target.closest && ev.target.closest('.copiar');
  if (!b) return;
  var v = b.getAttribute('data-v');
  var listo = function () { b.textContent = '¡Copiado!'; setTimeout(function () { b.textContent = 'Copiar'; }, 1500); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(v).then(listo, function () { copiarViejo(v); listo(); });
  } else { copiarViejo(v); listo(); }
});
function copiarViejo(v) {
  var t = document.createElement('textarea'); t.value = v; document.body.appendChild(t); t.select();
  try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(t);
}

$('fAviso').addEventListener('submit', function (ev) {
  ev.preventDefault();
  $('eAviso').textContent = '';
  $('bAvisar').disabled = true;
  api('avisarPago', token, { periodo: $('aPeriodo').value, medio: $('aMedio').value, comentario: $('aComent').value })
    .then(function () {
      $('aComent').value = '';
      $('dAviso').classList.remove('oculto');
      $('fAviso').closest('details').open = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
    .catch(function (err) { if (!sesionVencida(err)) $('eAviso').textContent = msgError(err); })
    .then(function () { $('bAvisar').disabled = false; });
});

$('fClave').addEventListener('submit', function (ev) {
  ev.preventDefault();
  var e = $('eClave'); e.textContent = ''; e.className = 'error';
  var n1 = $('kNueva').value.trim().toUpperCase(), n2 = $('kNueva2').value.trim().toUpperCase();
  if (n1 !== n2) { e.textContent = 'Las dos claves nuevas no coinciden. Escribilas de nuevo.'; $('kNueva2').value = ''; $('kNueva2').focus(); return; }
  if (n1.length < 8 || !/[A-ZÑ]/.test(n1) || !/[0-9]/.test(n1)) { e.textContent = 'La clave nueva tiene que tener al menos 8 caracteres, con letras y números.'; return; }
  $('bClave').disabled = true;
  api('cambiarClave', token, $('kActual').value, $('kNueva').value)
    .then(function () {
      $('kActual').value = ''; $('kNueva').value = ''; $('kNueva2').value = '';
      e.className = 'okmsg'; e.textContent = 'Listo, tu clave quedó cambiada.';
    })
    .catch(function (err) { if (!sesionVencida(err)) e.textContent = msgError(err); })
    .then(function () { $('bClave').disabled = false; });
});

$('bSalir').addEventListener('click', function () {
  var t = token; guardarToken(null); datos = null; mostrar('vLogin');
  api('salir', t).catch(function () {});
});

// Al volver a la app (por ejemplo después de pagar), refrescar los datos
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible' && token && datos) {
    api('datos', token).then(pintar).catch(function (err) { sesionVencida(err); });
  }
});

/* ---------- Instalación ---------- */
var eventoInstalar = null;
function yaInstalada() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function bannerDescartado() { try { return localStorage.getItem('socios_no_instalar') === '1'; } catch (e) { return false; } }

window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  eventoInstalar = e;
  if (!yaInstalada() && !bannerDescartado()) $('bInstalar').classList.remove('oculto');
});
$('bInstalarOk').addEventListener('click', function () {
  if (eventoInstalar) {
    eventoInstalar.prompt();
    eventoInstalar.userChoice.then(function () { eventoInstalar = null; $('bInstalar').classList.add('oculto'); });
  } else {
    $('tInstalar').innerHTML = 'Tocá <b>Compartir</b> <span aria-hidden="true">⬆︎</span> y después <b>Agregar a inicio</b>.';
    $('bInstalarOk').classList.add('oculto');
  }
});
$('bInstalarNo').addEventListener('click', function () {
  $('bInstalar').classList.add('oculto');
  try { localStorage.setItem('socios_no_instalar', '1'); } catch (e) {}
});
// iPhone/iPad: Safari no avisa, mostramos la ayuda nosotros
if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !yaInstalada() && !bannerDescartado()) {
  $('bInstalar').classList.remove('oculto');
}
window.addEventListener('appinstalled', function () { $('bInstalar').classList.add('oculto'); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}

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

iniciar();
