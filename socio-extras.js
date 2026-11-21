/* Socios CABB — extras de la app del socio:
 *  - "Avisos en este celular" (notificaciones push estándar del navegador)
 *  - "Mis eventos anteriores"
 * Se apoya en app.js (api, esc, token, msgError, sesionVencida).
 */
(function () {
  // Clave PÚBLICA de notificaciones (la privada vive solo en el Apps Script).
  var VAPID_PUBLICA = 'BG-pQwCZGDFVUImJzSF9Jr5qisbVNy1kGlzZjV_tAElwzKCEvkvGVchefdLJ3NBavYKgCklqkyPIQ7qaNismRlo';

  var estilos = document.createElement('style');
  estilos.textContent =
    '.push { display: flex; gap: 12px; align-items: center; }' +
    '.push .ico { flex: none; width: 40px; height: 40px; border-radius: 50%; background: var(--crema); display: flex; align-items: center; justify-content: center; font-size: 20px; }' +
    '.push .txt { flex: 1; font-size: 14px; }' +
    '.push .txt b { display: block; font-size: 15px; }' +
    '.push .txt span { color: var(--gris); font-size: 13px; }' +
    '.push button { flex: none; width: auto; margin: 0; padding: 9px 14px; font-size: 14px; }' +
    '.pasado { display: flex; justify-content: space-between; gap: 10px; border-top: 1px solid var(--linea); padding: 10px 0; font-size: 14px; }' +
    '.pasado:first-child { border-top: 0; }' +
    '.pasado .f { color: var(--gris); font-size: 12px; }' +
    '.pasado .p { flex: none; text-align: right; font-size: 13px; color: var(--gris); }';
  document.head.appendChild(estilos);

  /* ---------------- Avisos al celular ---------------- */
  var esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  var soporta = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  var cardPush = document.createElement('div');
  cardPush.className = 'card oculto';
  cardPush.id = 'bPush';
  cardPush.innerHTML = '<div class="push"><div class="ico">🔔</div><div class="txt" id="pushTxt"></div><button class="btn" id="pushBtn" type="button"></button></div>' +
    '<div class="error" id="pushErr" style="min-height:0"></div>';
  var bEv = document.getElementById('bEventos') || document.getElementById('bDeuda');
  bEv.parentNode.insertBefore(cardPush, bEv.nextSibling);

  function b64uABytes(s) {
    var b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
    var out = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
    return out;
  }
  function dispositivo() {
    var u = navigator.userAgent;
    if (/iphone/i.test(u)) return 'iPhone';
    if (/ipad/i.test(u) || esIOS) return 'iPad';
    if (/android/i.test(u)) return 'Android';
    if (/windows/i.test(u)) return 'Windows';
    if (/mac/i.test(u)) return 'Mac';
    return 'Otro';
  }
  function registro() { return navigator.serviceWorker.ready; }
  function suscripcionActual() { return registro().then(function (r) { return r.pushManager.getSubscription(); }); }

  function pintarPush(estado) {
    var txt = document.getElementById('pushTxt'), btn = document.getElementById('pushBtn');
    cardPush.classList.remove('oculto');
    btn.classList.remove('oculto', 'sec');
    btn.disabled = false;
    if (estado === 'activo') {
      txt.innerHTML = '<b>Avisos activados</b><span>Te llegan los eventos y novedades del club a este dispositivo.</span>';
      btn.textContent = 'Desactivar'; btn.classList.add('sec'); btn.dataset.accion = 'off';
    } else if (estado === 'bloqueado') {
      txt.innerHTML = '<b>Avisos bloqueados</b><span>Los bloqueaste en este navegador. Para activarlos, habilitá las notificaciones de este sitio en la configuración del navegador.</span>';
      btn.classList.add('oculto');
    } else if (estado === 'ios') {
      txt.innerHTML = '<b>Avisos en el iPhone</b><span>Primero instalá la app: tocá Compartir <b style="display:inline">⎋</b> y después "Agregar a inicio". Abrila desde el ícono y vas a poder activar los avisos.</span>';
      btn.classList.add('oculto');
    } else {
      txt.innerHTML = '<b>Avisos en este celular</b><span>Enterate al toque de torneos, eventos y novedades del club.</span>';
      btn.textContent = 'Activar'; btn.dataset.accion = 'on';
    }
  }

  function revisarPush() {
    if (!token) return;
    if (!soporta) { if (esIOS && !instalada) pintarPush('ios'); else cardPush.classList.add('oculto'); return; }
    if (Notification.permission === 'denied') { pintarPush('bloqueado'); return; }
    suscripcionActual().then(function (sub) {
      if (sub && Notification.permission === 'granted') {
        pintarPush('activo');
        // La reasocio al socio que entró (por si cambió de usuario o se renovó).
        api('guardarSuscripcion', token, sub.toJSON(), dispositivo()).catch(function () {});
      } else pintarPush('inactivo');
    }).catch(function () { cardPush.classList.add('oculto'); });
  }

  document.getElementById('pushBtn').addEventListener('click', function () {
    var btn = this, err = document.getElementById('pushErr');
    err.textContent = ''; btn.disabled = true;
    if (btn.dataset.accion === 'off') {
      suscripcionActual().then(function (sub) {
        if (!sub) return;
        return api('borrarSuscripcion', token, sub.endpoint).catch(function () {}).then(function () { return sub.unsubscribe(); });
      }).then(function () { pintarPush('inactivo'); })
        .catch(function (e) { btn.disabled = false; err.textContent = msgError(e); });
      return;
    }
    Notification.requestPermission().then(function (p) {
      if (p !== 'granted') { pintarPush(p === 'denied' ? 'bloqueado' : 'inactivo'); return; }
      return registro().then(function (r) {
        return r.pushManager.getSubscription().then(function (s) {
          return s || r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uABytes(VAPID_PUBLICA) });
        });
      }).then(function (sub) {
        return api('guardarSuscripcion', token, sub.toJSON(), dispositivo());
      }).then(function () {
        pintarPush('activo');
        return registro().then(function (r) {
          r.showNotification('¡Listo! ♞', { body: 'Vas a recibir acá los avisos del Círculo de Ajedrez.', icon: 'icon-192.png', badge: 'favicon-32.png', tag: 'cabb-bienvenida' });
        });
      });
    }).catch(function (e) {
      btn.disabled = false;
      if (!sesionVencida(e)) err.textContent = 'No se pudieron activar los avisos: ' + msgError(e);
    });
  });

  // Al cerrar sesión, este dispositivo deja de recibir avisos de ese socio.
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest || !ev.target.closest('#bSalir') || !soporta || !token) return;
    var t = token;
    suscripcionActual().then(function (sub) {
      if (!sub) return;
      api('borrarSuscripcion', t, sub.endpoint).catch(function () {});
      sub.unsubscribe();
    }).catch(function () {});
  }, true);

  /* ---------------- Mis eventos anteriores ---------------- */
  var cardPas = document.createElement('div');
  cardPas.className = 'card oculto';
  cardPas.id = 'bPasados';
  cardPas.innerHTML = '<details id="pasDet"><summary>Mis eventos anteriores</summary><div id="pasLista" style="margin-top:10px"></div></details>';
  var cuotas = document.getElementById('lCuotas').closest('.card');
  cuotas.parentNode.insertBefore(cardPas, cuotas.nextSibling);

  function cargarPasados() {
    if (!token) return;
    api('misEventosPasados', token).then(function (l) {
      if (!l.length) { cardPas.classList.add('oculto'); return; }
      cardPas.classList.remove('oculto');
      document.getElementById('pasLista').innerHTML = l.map(function (e) {
        var p = !e.esPago ? 'Sin costo' : (e.pago === 'Pagado' ? 'Pagado ' + esc(e.montoTxt) : esc(e.pago) + (e.montoTxt ? ' · ' + esc(e.montoTxt) : ''));
        return '<div class="pasado"><div><div>' + esc(e.titulo) + '</div><div class="f">' + esc(e.fecha) + (e.lugar ? ' · ' + esc(e.lugar) : '') + '</div></div>' +
          '<div class="p">' + p + '</div></div>';
      }).join('');
    }).catch(function () {});
  }

  /* ---------------- Disparadores ---------------- */
  var panel = document.getElementById('vPanel');
  function alMostrar() {
    if (!panel.classList.contains('oculto')) { revisarPush(); cargarPasados(); }
    else { cardPush.classList.add('oculto'); cardPas.classList.add('oculto'); }
  }
  new MutationObserver(alMostrar).observe(panel, { attributes: true, attributeFilter: ['class'] });
  alMostrar();
})();
