/* Socios CABB — app del socio: beneficios en locales (cupones) y clases del Círculo.
 * Se apoya en app.js (api, esc, token, datos, msgError, sesionVencida) y socio-gestion.js (leerComprobante).
 */
(function () {
  var estilos = document.createElement('style');
  estilos.textContent =
    /* cupones */
    '.cups { display: flex; flex-direction: column; gap: 14px; }' +
    '.cup { --c: #1f3d2b; position: relative; display: flex; background: #fff; border-radius: 16px; box-shadow: 0 1px 0 var(--linea), 0 6px 16px rgba(31,61,43,.10); overflow: hidden; cursor: pointer; transition: transform .15s; min-height: 150px; }' +
    '.cup:active { transform: scale(.985); }' +
    '.cup::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: var(--c); }' +
    '.cup-main { flex: 1; min-width: 0; padding: 14px 12px 12px 20px; display: flex; flex-direction: column; gap: 6px; }' +
    '.cup-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }' +
    '.cup-logo { height: 46px; max-width: 62%; display: flex; align-items: center; } .cup-logo img { max-height: 46px; max-width: 100%; object-fit: contain; }' +
    '.cup-ini { width: 46px; height: 46px; border-radius: 12px; background: var(--c); color: #fff; font-weight: 800; font-size: 18px; display: flex; align-items: center; justify-content: center; }' +
    '.cup-dto { text-align: right; line-height: .9; color: var(--c); flex: none; }' +
    '.cup-dto .n { font-size: 38px; font-weight: 800; letter-spacing: -.02em; font-family: Georgia, "Times New Roman", serif; }' +
    '.cup-dto .p { font-size: 22px; font-weight: 700; }' +
    '.cup-dto .t { display: block; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--gris); margin-top: 4px; }' +
    '.cup-dto.txt { font-size: 18px; font-weight: 800; max-width: 45%; line-height: 1.1; }' +
    '.cup-local { font-weight: 700; font-size: 15px; margin-top: 2px; } .cup-local span { font-weight: 400; color: var(--gris); font-size: 13px; }' +
    '.cup-det { font-size: 12px; color: var(--gris); line-height: 1.35; }' +
    '.cup-links { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; margin-top: auto; padding-top: 4px; } .cup-links a { color: var(--verde2); text-decoration: none; font-weight: 600; }' +
    '.cup-stub { position: relative; flex: none; width: 96px; border-left: 2px dashed var(--linea); background: repeating-conic-gradient(#f6f1e7 0 25%, #fffdf8 0 50%) 0 0 / 16px 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 10px 6px; text-align: center; }' +
    '.cup-stub::before, .cup-stub::after { content: ""; position: absolute; left: -11px; width: 20px; height: 20px; border-radius: 50%; background: var(--crema); box-shadow: inset 0 0 0 1px var(--linea); }' +
    '.cup-stub::before { top: -10px; } .cup-stub::after { bottom: -10px; }' +
    '.cup-stub img { width: 44px; height: auto; }' +
    '.cup-nro { font-size: 10px; font-weight: 800; letter-spacing: .1em; color: var(--verde); }' +
    '.cup-sello { font-size: 10px; font-weight: 800; letter-spacing: .06em; color: #fff; background: var(--ok); border-radius: 999px; padding: 3px 8px; }' +
    '.cup-hasta { font-size: 10px; color: var(--gris); }' +
    '.cup.bloq { cursor: default; } .cup.bloq .cup-main, .cup.bloq .cup-stub img { filter: grayscale(1); opacity: .55; }' +
    '.cup.bloq .cup-sello { background: var(--mal); }' +
    '.cup-aviso { background: #fbe0de; color: var(--mal); border-radius: 10px; padding: 10px 12px; font-size: 13px; margin-bottom: 12px; }' +
    /* cupón en grande */
    '.cup-full { position: fixed; inset: 0; z-index: 50; background: rgba(20,32,25,.88); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; gap: 16px; }' +
    '.cup-full .cup { width: 100%; max-width: 420px; cursor: default; min-height: 190px; }' +
    '.cup-full .cup-dto .n { font-size: 52px; } .cup-full .cup-stub { width: 116px; } .cup-full .cup-stub img { width: 56px; }' +
    '.cup-full .cup-stub::before, .cup-full .cup-stub::after { background: #2a3a30; box-shadow: none; }' +
    '.cup-vivo { color: #fff; text-align: center; font-size: 14px; } .cup-vivo b { font-size: 22px; display: block; letter-spacing: .04em; font-variant-numeric: tabular-nums; }' +
    '.cup-vivo .pt { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: #5fd38d; margin-right: 6px; animation: cupLat 1.2s infinite; }' +
    '@keyframes cupLat { 50% { opacity: .2; } }' +
    '.cup-brillo { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,.55) 50%, transparent 65%); background-size: 250% 100%; animation: cupBrillo 2.8s infinite; }' +
    '@keyframes cupBrillo { from { background-position: 150% 0; } to { background-position: -100% 0; } }' +
    '.cup-cerrar { background: #fff; color: var(--verde); border: 0; border-radius: 999px; padding: 12px 28px; font-weight: 700; font-size: 15px; }' +
    /* clases */
    '.cl { border-top: 1px solid var(--linea); padding: 12px 0; } .cl:first-of-type { border-top: 0; padding-top: 2px; }' +
    '.cl-t { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; } .cl-n { font-weight: 700; font-size: 15px; }' +
    '.cl-s { font-size: 13px; color: var(--gris); margin-top: 2px; } .cl-p { font-weight: 700; font-size: 14px; white-space: nowrap; }' +
    '.cl-chip { display: inline-block; font-size: 11px; font-weight: 700; border-radius: 999px; padding: 3px 9px; margin-top: 6px; background: #eee; color: #555; }' +
    '.cl-chip.ok { background: #d8f0e0; color: var(--ok); } .cl-chip.av { background: #fff1d6; color: var(--aviso); } .cl-chip.mal { background: #fbe0de; color: var(--mal); }' +
    '.cl .btn { margin-top: 10px; padding: 10px; font-size: 14px; } .cl textarea { margin-top: 8px; font-size: 15px; }' +
    '.cl-deuda { background: var(--crema); border-radius: 10px; padding: 10px 12px; margin-top: 10px; font-size: 13px; }' +
    '.cl-deuda .f { display: flex; justify-content: space-between; padding: 3px 0; } .cl-deuda .v { color: var(--mal); }' +
    '.cl-sub { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--gris); margin: 14px 0 4px; }';
  document.head.appendChild(estilos);

  var club = null;

  /* ---------------- tarjetas ---------------- */
  var ancla = document.getElementById('bPago');
  var cBen = document.createElement('div');
  cBen.className = 'card oculto'; cBen.id = 'bBeneficios';
  cBen.innerHTML = '<h2>🎁 Beneficios para socios</h2><div id="benAviso"></div><div class="cups" id="benLista"></div><p class="muted" id="benTip" style="margin:12px 0 0">Tocá un cupón para mostrarlo en el local.</p>';
  var cCla = document.createElement('div');
  cCla.className = 'card oculto'; cCla.id = 'bClases';
  cCla.innerHTML = '<h2>♟ Clases del Círculo</h2><div id="claMias"></div><div id="claOfer"></div><div class="error" id="claErr"></div>';
  ancla.parentNode.insertBefore(cBen, ancla);
  ancla.parentNode.insertBefore(cCla, ancla);

  /* ---------------- beneficios ---------------- */
  function dtoHtml(t) {
    var m = String(t).match(/^\s*(\d{1,3})\s*%\s*(.*)$/);
    if (m) return '<div class="cup-dto"><span class="n">' + m[1] + '</span><span class="p">%</span><span class="t">' + esc(m[2] || 'de descuento') + '</span></div>';
    return '<div class="cup-dto txt">' + esc(t) + '</div>';
  }
  function iniciales(n) { return String(n).split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x.charAt(0).toUpperCase(); }).join(''); }
  function cupon(b, bloqueado) {
    var d = window.datos || {};
    var links = [];
    if (b.direccion) links.push('<a href="https://maps.google.com/?q=' + encodeURIComponent(b.direccion + ', Bahía Blanca') + '" target="_blank" rel="noopener">📍 ' + esc(b.direccion) + '</a>');
    if (b.instagram) links.push('<a href="https://instagram.com/' + encodeURIComponent(b.instagram) + '" target="_blank" rel="noopener">@' + esc(b.instagram) + '</a>');
    if (b.telefono) links.push('<a href="tel:' + esc(b.telefono.replace(/[^\d+]/g, '')) + '">📞 ' + esc(b.telefono) + '</a>');
    if (b.web) links.push('<a href="' + esc(b.web) + '" target="_blank" rel="noopener">🌐 Web</a>');
    var det = [b.detalle, b.condiciones].filter(Boolean).map(esc).join(' · ');
    return '<div class="cup' + (bloqueado ? ' bloq' : '') + '" data-id="' + esc(b.id) + '" style="--c:' + esc(b.color || '#1f3d2b') + '">' +
      '<div class="cup-main"><div class="cup-top"><div class="cup-logo">' + (b.logo ? '<img src="' + esc(b.logo) + '" alt="' + esc(b.local) + '">' : '<div class="cup-ini">' + esc(iniciales(b.local)) + '</div>') + '</div>' + dtoHtml(b.descuento) + '</div>' +
      '<div class="cup-local">' + esc(b.local) + (b.rubro ? ' <span>· ' + esc(b.rubro) + '</span>' : '') + '</div>' +
      (det ? '<div class="cup-det">' + det + '</div>' : '') + (links.length ? '<div class="cup-links">' + links.join('') + '</div>' : '') + '</div>' +
      '<div class="cup-stub"><img src="escudo.svg" alt="CABB"><div class="cup-nro">SOCIO Nº ' + esc(d.nro || '') + '</div>' +
      '<div class="cup-sello">' + (bloqueado ? 'CON DEUDA' : 'AL DÍA ✓') + '</div>' + (b.hasta ? '<div class="cup-hasta">hasta ' + esc(b.hasta) + '</div>' : '') + '</div></div>';
  }
  function pintarBeneficios() {
    var l = club.beneficios || [];
    cBen.classList.toggle('oculto', !l.length);
    document.getElementById('benAviso').innerHTML = club.alDia ? '' : '<div class="cup-aviso">' + esc(club.motivoBloqueo) + ' Ponete al día para usar los beneficios.</div>';
    document.getElementById('benTip').classList.toggle('oculto', !club.alDia);
    document.getElementById('benLista').innerHTML = l.map(function (b) { return cupon(b, !club.alDia); }).join('');
  }
  document.getElementById('benLista').addEventListener('click', function (ev) {
    if (ev.target.closest('a')) return;
    var c = ev.target.closest('.cup'); if (!c || c.classList.contains('bloq')) return;
    var b = club.beneficios.filter(function (x) { return x.id === c.dataset.id; })[0]; if (b) mostrarGrande(b);
  });
  function mostrarGrande(b) {
    var d = window.datos || {};
    var o = document.createElement('div');
    o.className = 'cup-full';
    o.innerHTML = cupon(b, false) + '<div class="cup-vivo"><span class="pt"></span>' + esc((d.nombre || '') + ' ' + (d.apellido || '')) + '<b id="cupReloj"></b></div><button class="cup-cerrar" type="button">Cerrar</button>';
    o.querySelector('.cup').insertAdjacentHTML('beforeend', '<div class="cup-brillo"></div>');
    document.body.appendChild(o);
    var reloj = o.querySelector('#cupReloj');
    var tic = function () { var n = new Date(); reloj.textContent = n.toLocaleDateString('es-AR') + ' · ' + n.toLocaleTimeString('es-AR'); };
    tic(); var iv = setInterval(tic, 1000);
    var cerrar = function () { clearInterval(iv); o.remove(); };
    o.addEventListener('click', function (ev) { if (ev.target === o || ev.target.classList.contains('cup-cerrar')) cerrar(); });
  }

  /* ---------------- clases ---------------- */
  function pintarClases() {
    var mias = club.mias || [], ofer = club.cursos || [];
    cCla.classList.toggle('oculto', !mias.length && !ofer.length);
    var h = '';
    if (mias.length) {
      h += '<div class="cl-sub">Mis clases</div>';
      var pendientes = [];
      mias.forEach(function (m) {
        var chip = m.estado === 'Inscripto' ? '<span class="cl-chip ok">Anotado/a</span>' : m.estado === 'Pedido' ? '<span class="cl-chip av">Esperando confirmación</span>' :
          m.estado === 'Prueba' ? '<span class="cl-chip av">Clase de prueba pedida: la comisión te avisa el día</span>' :
          m.estado === 'PruebaAgendada' ? '<span class="cl-chip ok">Clase de prueba gratis: ' + esc(m.fechaPrueba.slice(0, 5)) + (m.hora ? ' a las ' + esc(m.hora) : '') + '</span>' : '<span class="cl-chip">Dejaste el curso</span>';
        h += '<div class="cl" data-al="' + esc(m.id) + '"><div class="cl-t"><div><div class="cl-n">' + esc(m.curso) + (m.profesor ? ' <span class="cl-s">con ' + esc(m.profesor) + '</span>' : '') + '</div>' +
          '<div class="cl-s">' + esc(m.horario) + (m.estado === 'Inscripto' && m.proxima ? ' · próxima: ' + esc(m.proxima) : '') + '</div>' + chip + '</div>' +
          (m.precioTxt ? '<div class="cl-p">' + esc(m.precioTxt) + '</div>' : '') + '</div>' +
          (m.estado === 'Pedido' || m.estado === 'Prueba' || m.estado === 'PruebaAgendada' ? '<button class="link clDejar" type="button" style="margin-top:8px">' + (m.estado === 'Pedido' ? 'Cancelar pedido' : 'Cancelar la clase de prueba') + '</button>' : '') +
          (m.estado === 'PruebaAgendada' ? '<button class="btn clAnotarme" type="button" data-cur="' + esc(m.idCurso) + '">¿Te gustó? Quiero anotarme</button>' : '') +
          (m.estado === 'Inscripto' ? '<button class="link clDejar" type="button" style="margin-top:8px;font-size:13px">Dejar el curso</button>' : '') + '</div>';
        m.pendientes.forEach(function (p) { pendientes.push({ curso: m.curso, p: p }); });
      });
      if (pendientes.length) {
        var porAvisar = pendientes.filter(function (x) { return !x.p.avisado; });
        var total = porAvisar.reduce(function (t, x) { return t + x.p.monto; }, 0);
        h += '<div class="cl-deuda"><b>Cuotas de clases pendientes</b>' + pendientes.map(function (x) {
          return '<div class="f"><span' + (x.p.vencida && !x.p.avisado ? ' class="v"' : '') + '>' + esc(x.curso) + ' · ' + esc(x.p.legible) + '</span><span>' + esc(x.p.montoTxt) + (x.p.avisado ? ' · avisado' : '') + '</span></div>';
        }).join('');
        if (porAvisar.length) {
          h += '<details style="margin-top:8px"><summary style="font-size:14px">Avisar que pagué ' + esc(plata(total)) + '</summary>' +
            '<label>¿Cómo pagaste?</label><select id="clMedio">' + club.medios.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select>' +
            '<label>Comprobante (opcional)</label><input type="file" accept="image/*,application/pdf" id="clComp">' +
            '<label>Comentario (opcional)</label><input id="clComent" maxlength="300">' +
            '<button class="btn" id="clAvisar" type="button">Enviar aviso</button></details>';
        }
        h += '</div>';
      }
    }
    var mis = {}; mias.forEach(function (m) { if (m.estado === 'Pedido' || m.estado === 'Inscripto') mis[m.curso + '|' + m.horario] = true; });
    var libres = ofer.filter(function (c) { return !c.estado; });
    if (libres.length) {
      h += '<div class="cl-sub">' + (mias.length ? 'Otros cursos' : 'Cursos para socios') + '</div>';
      h += libres.map(function (c) {
        return '<div class="cl" data-cur="' + esc(c.id) + '"><div class="cl-t"><div><div class="cl-n">' + esc(c.nombre) + (c.profesor ? ' <span class="cl-s">con ' + esc(c.profesor) + '</span>' : '') + '</div>' +
          '<div class="cl-s">' + esc(c.horario) + (c.proxima ? ' · próxima: ' + esc(c.proxima) : '') + '</div>' +
          (c.cupoTxt ? '<span class="cl-chip ' + (c.lleno ? 'mal' : '') + '">' + esc(c.cupoTxt) + '</span>' : '') + '</div><div class="cl-p">' + esc(c.precioTxt) + '</div></div>' +
          (c.descripcion ? '<div class="cl-s" style="margin-top:6px">' + esc(c.descripcion) + '</div>' : '') +
          (c.prueba ? '<button class="btn clProbar" type="button">🎁 Probar una clase gratis</button>' : '') +
          '<button class="btn sec clQuiero" type="button">' + (c.lleno ? 'Pedir lugar (cupo completo)' : 'Quiero anotarme') + '</button>' +
          '<div class="clFormP oculto"><textarea rows="2" maxlength="300" placeholder="Comentario (opcional): día que preferís, nivel…"></textarea>' +
          '<button class="btn clPedirP" type="button">Pedir clase de prueba</button><div class="muted" style="margin-top:6px">Es gratis y sin compromiso. La comisión te confirma el día.</div></div>' +
          '<div class="clForm oculto"><textarea rows="2" maxlength="300" placeholder="Comentario para la comisión (opcional)"></textarea>' +
          '<button class="btn clPedir" type="button">Enviar pedido</button><div class="muted" style="margin-top:6px">La comisión confirma tu lugar. La cuota del curso se paga aparte de la cuota social.</div></div></div>';
      }).join('');
    }
    document.getElementById('claMias').innerHTML = h;
    document.getElementById('claOfer').innerHTML = '';
  }
  function plata(n) { return '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  cCla.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    var err = document.getElementById('claErr'); err.textContent = '';
    var cur = ev.target.closest('[data-cur]'), al = ev.target.closest('[data-al]');
    var fallo = function (e) { if (!sesionVencida(e)) err.textContent = msgError(e); };
    if (b.classList.contains('clQuiero')) { cur.querySelector('.clForm').classList.remove('oculto'); cur.querySelector('.clFormP').classList.add('oculto'); b.classList.add('oculto'); return; }
    if (b.classList.contains('clProbar')) { cur.querySelector('.clFormP').classList.remove('oculto'); cur.querySelector('.clForm').classList.add('oculto'); b.classList.add('oculto'); return; }
    if (b.classList.contains('clPedirP')) {
      b.disabled = true; b.textContent = 'Enviando…';
      api('pedirPrueba', token, cur.dataset.cur, cur.querySelector('.clFormP textarea').value).then(function () { return cargar(true); })
        .catch(function (e) { b.disabled = false; b.textContent = 'Pedir clase de prueba'; fallo(e); });
      return;
    }
    if (b.classList.contains('clAnotarme')) {
      b.disabled = true; b.textContent = 'Enviando…';
      api('pedirClase', token, b.dataset.cur, 'Después de la clase de prueba').then(function () { return cargar(true); })
        .catch(function (e) { b.disabled = false; b.textContent = '¿Te gustó? Quiero anotarme'; fallo(e); });
      return;
    }
    if (b.classList.contains('clPedir')) {
      b.disabled = true; b.textContent = 'Enviando…';
      api('pedirClase', token, cur.dataset.cur, cur.querySelector('.clForm textarea').value).then(function () { return cargar(true); })
        .catch(function (e) { b.disabled = false; b.textContent = 'Enviar pedido'; fallo(e); });
      return;
    }
    if (b.classList.contains('clDejar')) {
      var m = club.mias.filter(function (x) { return x.id === al.dataset.al; })[0];
      var txt = m.estado === 'Pedido' ? '¿Cancelar el pedido para ' + m.curso + '?' : /^Prueba/.test(m.estado) ? '¿Cancelar la clase de prueba de ' + m.curso + '?' : '¿Dejar el curso ' + m.curso + '? Si debés cuotas del curso, siguen pendientes.';
      if (!window.confirm(txt)) return;
      b.disabled = true;
      api('dejarClase', token, m.id).then(function () { return cargar(true); }).catch(function (e) { b.disabled = false; fallo(e); });
      return;
    }
    if (b.id === 'clAvisar') {
      b.disabled = true; b.textContent = 'Enviando…';
      leerComprobante(document.getElementById('clComp')).then(function (arch) {
        return api('avisarPagoClase', token, 'todas', document.getElementById('clMedio').value, document.getElementById('clComent').value, arch);
      }).then(function () { return cargar(true); }).catch(function (e) { b.disabled = false; b.textContent = 'Enviar aviso'; fallo(e); });
    }
  });

  /* ---------------- carga ---------------- */
  var ultima = 0, cargando = null;
  function cargar(forzar) {
    if (!window.token || !window.datos) return Promise.resolve();
    if (!forzar && (cargando || Date.now() - ultima < 20000)) return cargando || Promise.resolve();
    cargando = api('clubSocio', token).then(function (r) {
      club = r; ultima = Date.now();
      pintarBeneficios(); pintarClases();
    }).catch(function (e) { if (!sesionVencida(e)) console.warn('clubSocio', e); })
      .then(function () { cargando = null; });
    return cargando;
  }
  new MutationObserver(function () { if (!document.getElementById('vPanel').classList.contains('oculto')) setTimeout(cargar, 0); })
    .observe(document.getElementById('vPanel'), { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(function () { ultima = 0; setTimeout(cargar, 0); })
    .observe(document.getElementById('cNombre'), { childList: true, characterData: true, subtree: true });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') cargar(); });
  setTimeout(cargar, 0);
})();
