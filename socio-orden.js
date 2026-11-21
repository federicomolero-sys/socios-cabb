/* Socios CABB — orden de la app del socio en pestañas.
 * Se carga al final: toma las tarjetas que arman los otros archivos y las reparte en
 * secciones (Inicio, Cuotas, Eventos, Clases, Beneficios, Perfil) con una barra abajo.
 * No cambia ninguna función: solo mueve tarjetas, así que todo sigue andando igual.
 */
(function () {
  var panel = document.getElementById('vPanel');
  if (!panel) return;

  /* ---------------- estilos ---------------- */
  var css = document.createElement('style');
  css.textContent =
    '.wrap.con-tabs{padding-bottom:calc(92px + env(safe-area-inset-bottom))}' +
    '.seccion{display:none}.seccion.activa{display:block;animation:secIn .18s ease-out}' +
    '@keyframes secIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}' +
    '.sec-tit{font-size:20px;font-weight:700;color:var(--verde);margin:4px 2px 12px;display:flex;align-items:baseline;justify-content:space-between;gap:8px}' +
    '.sec-tit small{font-size:13px;font-weight:400;color:var(--gris)}' +
    '.tabbar{position:fixed;left:0;right:0;bottom:0;z-index:50;background:rgba(255,253,248,.97);border-top:1px solid var(--linea);' +
      'padding:6px 4px calc(6px + env(safe-area-inset-bottom));backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 -2px 10px rgba(0,0,0,.04)}' +
    '.tabbar .in{max-width:520px;margin:0 auto;display:flex;justify-content:space-around}' +
    '.tab{flex:1;min-width:0;border:0;background:none;color:var(--gris);display:flex;flex-direction:column;align-items:center;gap:3px;padding:5px 2px 3px;border-radius:10px;font-size:10.5px;font-weight:600;position:relative;-webkit-tap-highlight-color:transparent}' +
    '.tab svg{width:23px;height:23px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    '.tab span.l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}' +
    '.tab.activa{color:var(--verde)}.tab.activa::before{content:"";position:absolute;top:-6px;left:28%;right:28%;height:3px;border-radius:0 0 3px 3px;background:var(--verde)}' +
    '.tab .pt{position:absolute;top:2px;left:calc(50% + 7px);min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--mal);color:#fff;font-size:10px;line-height:16px;font-weight:700}' +
    '.tab .pt.v{background:var(--ok)}' +
    '.nov{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--linea);cursor:pointer}' +
    '.nov:first-of-type{border-top:0;padding-top:2px}.nov:last-child{padding-bottom:0}' +
    '.nov .ic{width:38px;height:38px;border-radius:10px;background:var(--crema);display:flex;align-items:center;justify-content:center;font-size:19px;flex:none}' +
    '.nov .tx{flex:1;min-width:0;font-size:14px}.nov .tx b{display:block;font-size:14px}.nov .tx span{color:var(--gris);font-size:12.5px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.nov .fl{color:var(--gris);font-size:18px}' +
    '.ir{display:inline-flex;align-items:center;gap:6px;margin-top:12px;border:0;background:var(--verde);color:#fff;border-radius:9px;padding:9px 14px;font-weight:600;font-size:14px}' +
    '.vacio{text-align:center;color:var(--gris);font-size:14px;padding:26px 10px}.vacio .e{font-size:30px;display:block;margin-bottom:6px}' +
    '.perfil-d{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:14px}.perfil-d dt{color:var(--gris)}.perfil-d dd{margin:0;font-weight:600}' +
    '#vPanel>footer{margin-top:4px}' +
    '@media print{.tabbar{display:none}}';
  document.head.appendChild(css);

  /* ---------------- secciones ---------------- */
  var ICON = {
    inicio: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
    cuotas: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><path d="M7 15h4"/>',
    eventos: '<path d="M8 4h8v3a4 4 0 0 1-8 0z"/><path d="M8 5.5H5a2.5 2.5 0 0 0 3 3.2M16 5.5h3a2.5 2.5 0 0 1-3 3.2"/><path d="M12 11v4M9 20h6M10 15h4l.5 5h-5z"/>',
    clases: '<path d="M8.5 20h7M9.5 20l.8-6h3.4l.8 6"/><path d="M8.8 14h6.4"/><circle cx="12" cy="8.5" r="3"/><path d="M12 3.2v2.3M10.8 4.3h2.4"/>',
    beneficios: '<path d="M4 9.5h16v3H4z"/><path d="M5.5 12.5V20h13v-7.5"/><path d="M12 9.5V20"/><path d="M12 9.5S10.5 4.5 8 5.5 9 9.5 12 9.5zM12 9.5s1.5-5 4-4-1 4-4 4z"/>',
    perfil: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.8-3.8 3.8-5.8 7.5-5.8s6.7 2 7.5 5.8"/>'
  };
  var SECS = [
    { id: 'inicio', nombre: 'Inicio' },
    { id: 'cuotas', nombre: 'Cuotas', titulo: 'Mis cuotas' },
    { id: 'eventos', nombre: 'Eventos', titulo: 'Eventos' },
    { id: 'clases', nombre: 'Clases', titulo: 'Clases' },
    { id: 'beneficios', nombre: 'Beneficios', titulo: 'Beneficios' },
    { id: 'perfil', nombre: 'Perfil', titulo: 'Mi perfil' }
  ];
  var sec = {};
  SECS.forEach(function (s) {
    var d = document.createElement('section');
    d.className = 'seccion'; d.id = 'sec-' + s.id;
    if (s.titulo) d.innerHTML = '<div class="sec-tit">' + s.titulo + '<small></small></div>';
    panel.appendChild(d);
    sec[s.id] = d;
  });

  function porId(id) { return document.getElementById(id); }
  function cardDe(id) { var e = porId(id); return e ? (e.classList.contains('card') ? e : e.closest('.card')) : null; }
  function mover(destino, el) { if (el && el.parentNode !== destino) destino.appendChild(el); }

  // Tarjetas propias de esta pantalla
  var cNov = document.createElement('div');
  cNov.className = 'card oculto'; cNov.id = 'bNovedades';
  cNov.innerHTML = '<h2>Novedades</h2><div id="novLista"></div>';
  var novLista = cNov.querySelector('#novLista');
  var cResumen = document.createElement('div');
  cResumen.className = 'card deuda'; cResumen.id = 'bResumenCuotas';
  var cEvVacio = document.createElement('div');
  cEvVacio.className = 'card vacio oculto'; cEvVacio.innerHTML = '<span class="e">♟</span>Por ahora no hay eventos próximos.<br>Cuando la comisión publique uno, lo vas a ver acá.';
  var cDatos = document.createElement('div');
  cDatos.className = 'card'; cDatos.id = 'bMisDatos';

  // Botón "ir a cuotas" dentro del resumen de deuda del inicio
  var irCuotas = document.createElement('button');
  irCuotas.type = 'button'; irCuotas.className = 'ir oculto'; irCuotas.id = 'irCuotas';
  irCuotas.innerHTML = 'Pagar o avisar un pago →';
  irCuotas.addEventListener('click', function () { ir('cuotas'); });
  porId('bDeuda').appendChild(irCuotas);

  function repartir() {
    var carnet = panel.querySelector('.carnet');
    // Inicio
    mover(sec.inicio, carnet);
    mover(sec.inicio, porId('bSancion'));
    mover(sec.inicio, porId('bDeuda'));
    var push = porId('bPush');
    var pushActivo = push && porId('pushBtn') && porId('pushBtn').dataset.accion === 'off';
    if (!pushActivo) mover(sec.inicio, push);
    mover(sec.inicio, cNov);
    // Cuotas
    mover(sec.cuotas, cResumen);
    mover(sec.cuotas, porId('bFamilia'));
    mover(sec.cuotas, porId('bOfertas'));
    mover(sec.cuotas, porId('bPago'));
    mover(sec.cuotas, porId('bAviso'));
    mover(sec.cuotas, cardDe('lCuotas'));
    // Eventos
    mover(sec.eventos, porId('bEventos'));
    mover(sec.eventos, cEvVacio);
    mover(sec.eventos, porId('bPasados'));
    // Clases y beneficios
    mover(sec.clases, porId('bClases'));
    mover(sec.beneficios, porId('bBeneficios'));
    // Perfil
    mover(sec.perfil, cDatos);
    if (pushActivo) mover(sec.perfil, push);
    mover(sec.perfil, cardDe('fClave'));
    mover(sec.perfil, panel.querySelector('#vPanel > footer') || cardDe('bSalir') || (porId('bSalir') && porId('bSalir').parentNode));
    // Cualquier tarjeta nueva que no conozcamos queda en Inicio, para que no se pierda
    Array.prototype.slice.call(panel.children).forEach(function (el) {
      if (el.tagName !== 'SECTION' && el.classList.contains('card')) sec.inicio.insertBefore(el, cNov);
    });
  }

  /* ---------------- barra de pestañas ---------------- */
  var bar = document.createElement('nav');
  bar.className = 'tabbar oculto'; bar.setAttribute('aria-label', 'Secciones');
  bar.innerHTML = '<div class="in">' + SECS.map(function (s) {
    return '<button type="button" class="tab" data-sec="' + s.id + '" aria-label="' + s.nombre + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[s.id] + '</svg><span class="l">' + s.nombre + '</span></button>';
  }).join('') + '</div>';
  document.body.appendChild(bar);
  bar.addEventListener('click', function (ev) {
    var b = ev.target.closest('.tab'); if (!b) return;
    ir(b.dataset.sec);
  });
  function tab(id) { return bar.querySelector('.tab[data-sec="' + id + '"]'); }

  var actual = 'inicio';
  function disponible(id) { var t = tab(id); return !!t && !t.classList.contains('oculto'); }
  function ir(id, sinHistorial) {
    if (!sec[id] || !disponible(id)) id = 'inicio';
    var cambio = id !== actual;
    actual = id;
    SECS.forEach(function (s) {
      sec[s.id].classList.toggle('activa', s.id === id);
      tab(s.id).classList.toggle('activa', s.id === id);
      if (s.id === id) tab(s.id).setAttribute('aria-current', 'page'); else tab(s.id).removeAttribute('aria-current');
    });
    if (!sinHistorial) {
      var h = id === 'inicio' ? location.pathname + location.search : '#' + id;
      try { if (cambio) history.pushState({ sec: id }, '', h); } catch (e) {}
    }
    if (cambio) window.scrollTo(0, 0);
  }
  window.irSeccion = ir;
  window.addEventListener('popstate', function () { ir(desdeHash(), true); });
  function desdeHash() { var h = (location.hash || '').replace('#', ''); return sec[h] ? h : 'inicio'; }

  // Algunos avisos de pago hacen scroll arriba para mostrar el "recibimos tu aviso":
  // eso queda en Inicio, así que el resumen de Cuotas también lo muestra.

  /* ---------------- contenido propio ---------------- */
  function visible(el) { return !!el && !el.classList.contains('oculto'); }
  function texto(el) { return el ? el.textContent.trim() : ''; }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function setHTML(el, h) { if (el.__h !== h) { el.__h = h; el.innerHTML = h; } }
  function setOculto(el, o) { if (el.classList.contains('oculto') !== o) el.classList.toggle('oculto', o); }

  function refrescar() {
    var d = window.datos;
    if (!d) return;
    repartir();

    // Pestañas que dependen de lo que haya
    setOculto(tab('clases'), !visible(porId('bClases')));
    setOculto(tab('beneficios'), !visible(porId('bBeneficios')));
    if (actual && !disponible(actual)) ir('inicio', true);

    // Inicio: botón a cuotas si debe
    setOculto(irCuotas, !(d.cantPendientes > 0));

    // Resumen de cuotas
    var hay = d.cantPendientes > 0;
    cResumen.className = 'card deuda' + (hay && d.cantVencidas ? '' : ' ok');
    setHTML(cResumen, hay
      ? '<h2>Saldo pendiente: ' + esc(d.deuda) + '</h2><div class="muted">' + esc(texto(porId('dTexto'))) + ' Más abajo tenés cómo pagar y el botón para avisar el pago.</div>' +
        (d.avisosPendientes ? '<div class="okmsg">Recibimos tu aviso de pago. La comisión lo va a confirmar.</div>' : '')
      : '<h2>Estás al día 👍</h2><div class="muted">No tenés cuotas pendientes.</div>' +
        (d.avisosPendientes ? '<div class="okmsg">Recibimos tu aviso de pago. La comisión lo va a confirmar.</div>' : ''));
    var nPend = d.cantPendientes || 0;
    var pc = tab('cuotas').querySelector('.pt');
    if (nPend && d.cantVencidas) { if (!pc) { pc = document.createElement('span'); pc.className = 'pt'; tab('cuotas').appendChild(pc); } pc.textContent = d.cantVencidas; }
    else if (pc) pc.remove();

    // Eventos
    var bEv = porId('bEventos');
    var hayEv = visible(bEv);
    setOculto(cEvVacio, hayEv);
    var badge = porId('evBadge');
    var nuevos = visible(badge) ? parseInt(texto(badge), 10) || 0 : 0;
    var pe = tab('eventos').querySelector('.pt');
    if (nuevos) { if (!pe) { pe = document.createElement('span'); pe.className = 'pt v'; tab('eventos').appendChild(pe); } pe.textContent = nuevos; }
    else if (pe) pe.remove();

    // Novedades del inicio
    var nov = [];
    if (hayEv) {
      var ev = bEv.querySelector('.ev');
      var tit = ev ? ev.querySelector('.ev-tit') : null;
      var nombre = tit ? (tit.firstChild && tit.firstChild.nodeType === 3 ? tit.firstChild.textContent : texto(tit)) : '';
      var sub = ev ? texto(ev.querySelector('.ev-sub')) : '';
      var cant = bEv.querySelectorAll('.ev').length;
      nov.push({ sec: 'eventos', ic: '🏆', t: nuevos ? (nuevos === 1 ? '1 evento nuevo' : nuevos + ' eventos nuevos') : (cant === 1 ? 'Próximo evento' : cant + ' eventos próximos'), s: nombre + (sub ? ' · ' + sub : '') });
    }
    if (visible(porId('bClases'))) {
      var mias = porId('bClases').querySelectorAll('.cl[data-al]').length;
      var esperando = porId('bClases').querySelectorAll('.cl-chip.av').length;
      nov.push({ sec: 'clases', ic: '♟', t: mias ? 'Mis clases' : 'Clases del Círculo', s: esperando ? 'Tenés un pedido esperando respuesta' : mias ? 'Horarios, próxima clase y cuotas' : 'Mirá los cursos y pedí una clase de prueba' });
    }
    if (visible(porId('bBeneficios'))) {
      var nb = porId('benLista').querySelectorAll('.cup').length;
      var bloq = porId('benLista').querySelector('.cup.bloq');
      nov.push({ sec: 'beneficios', ic: '🎁', t: nb === 1 ? '1 descuento para socios' : nb + ' descuentos para socios', s: bloq ? 'Ponete al día para usarlos' : 'Mostralos en el local desde el celu' });
    }
    if (visible(porId('bOfertas'))) nov.push({ sec: 'cuotas', ic: '💸', t: 'Plan de cuotas con descuento', s: 'Pagá varios meses juntos y ahorrá' });
    setOculto(cNov, !nov.length);
    setHTML(novLista, nov.map(function (n) {
      return '<div class="nov" data-sec="' + n.sec + '" role="button" tabindex="0"><div class="ic">' + n.ic + '</div><div class="tx"><b>' + esc(n.t) + '</b><span>' + esc(n.s) + '</span></div><div class="fl">›</div></div>';
    }).join(''));

    // Perfil
    setHTML(cDatos, '<h2>' + esc(d.nombre + ' ' + d.apellido) + '</h2><dl class="perfil-d">' +
      '<dt>Socio Nº</dt><dd>' + esc(d.nro) + '</dd>' +
      (d.categoria ? '<dt>Categoría</dt><dd>' + esc(d.categoria) + '</dd>' : '') +
      '<dt>DNI</dt><dd>' + esc(d.dni) + '</dd>' +
      (d.socioDesde ? '<dt>Socio desde</dt><dd>' + esc(d.socioDesde) + '</dd>' : '') +
      '<dt>Estado</dt><dd>' + esc(d.estado === 'Activo' ? (d.alDia ? 'Activo, al día' : 'Activo, con cuotas pendientes') : d.estado) + '</dd></dl>' +
      '<div class="muted" style="margin-top:10px">Si algún dato está mal, avisale a la comisión.</div>');
  }
  novLista.addEventListener('click', function (ev) { var n = ev.target.closest('.nov'); if (n) ir(n.dataset.sec); });
  novLista.addEventListener('keydown', function (ev) { var n = ev.target.closest('.nov'); if (n && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); ir(n.dataset.sec); } });

  // Repintar cuando cambie algo del panel (sin entrar en bucle con lo nuestro)
  var pendiente = false;
  function programar() {
    if (pendiente) return; pendiente = true;
    (window.requestAnimationFrame || setTimeout)(function () { pendiente = false; refrescar(); });
  }
  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var t = muts[i].target;
      if (t === cNov || cNov.contains(t) || t === cResumen || t === cDatos || cDatos.contains(t) || cResumen.contains(t) || t.tagName === 'SECTION') continue;
      programar(); return;
    }
  }).observe(panel, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-accion'] });

  // Mostrar u ocultar la barra con el panel
  function alPanel() {
    var on = !panel.classList.contains('oculto');
    setOculto(bar, !on);
    document.querySelector('.wrap').classList.toggle('con-tabs', on);
    if (on) { refrescar(); ir(desdeHash(), true); }
    else { actual = ''; try { if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
  }
  new MutationObserver(alPanel).observe(panel, { attributes: true, attributeFilter: ['class'] });
  repartir();
  ir('inicio', true);
  alPanel();
})();
