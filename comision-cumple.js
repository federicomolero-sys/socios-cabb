/* Comisión CABB — saludo de cumpleaños.
 * En "Más": activar/desactivar para todo el club, mensaje propio y próximos cumpleaños.
 * En la ficha de cada socio: activar/desactivar su saludo.
 */
(function () {
  var css = document.createElement('style');
  css.textContent =
    '.cu-sw{display:flex;align-items:center;gap:12px;margin:4px 0}.cu-sw .tx{flex:1;font-size:14px}.cu-sw .tx b{display:block}.cu-sw .tx span{color:var(--gris);font-size:13px}' +
    '.sw{position:relative;width:50px;height:30px;flex:none;margin:0}.sw input{opacity:0;width:0;height:0;position:absolute}' +
    '.sw i{position:absolute;inset:0;border-radius:15px;background:#cfc8b8;transition:.2s;cursor:pointer}' +
    '.sw i::after{content:"";position:absolute;left:3px;top:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:.2s}' +
    '.sw input:checked+i{background:var(--ok)}.sw input:checked+i::after{transform:translateX(20px)}' +
    '.sw input:disabled+i{opacity:.5}' +
    '.cu-lista{margin-top:8px}.cu-it{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--linea);font-size:14px}' +
    '.cu-it:first-child{border-top:0}.cu-it .d{color:var(--gris);font-size:12px}.cu-it .hoy{color:#b4690e;font-weight:700}' +
    '.cu-it .off{color:var(--mal);font-size:12px}.cu-ej{background:var(--crema);border-radius:8px;padding:8px 10px;font-size:13px;margin-top:6px;color:#444}';
  document.head.appendChild(css);

  function sw(id, checked) { return '<label class="sw"><input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + '><i></i></label>'; }

  /* ================= Más: configuración general ================= */
  var cMas = document.createElement('div');
  cMas.className = 'card'; cMas.id = 'cuCard';
  cMas.innerHTML = '<details id="cuDet"><summary style="font-weight:600;cursor:pointer">🎂 Saludo de cumpleaños</summary><div id="cuCuerpo" style="margin-top:10px"><div class="muted">Cargando…</div></div></details>';
  var clave = document.getElementById('cActual');
  var antes = clave ? clave.closest('.card') : null;
  var mas = document.getElementById('vMas');
  if (mas) { if (antes && antes.parentNode === mas) mas.insertBefore(cMas, antes); else mas.appendChild(cMas); }

  var datosCu = null;
  function cargarMas() {
    api('adminCumple', token).then(function (r) { datosCu = r; pintarMas(); })
      .catch(function (e) { document.getElementById('cuCuerpo').innerHTML = '<div class="error">' + esc(msg(e)) + '</div>'; });
  }
  function pintarMas() {
    var r = datosCu;
    var prox = r.proximos.length ? r.proximos.map(function (p) {
      var cuando = p.dias === 0 ? '<span class="hoy">¡Hoy!</span>' : p.dias === 1 ? 'Mañana' : 'En ' + p.dias + ' días';
      return '<div class="cu-it"><div>' + esc(p.nombre) + '<div class="d">' + esc(p.fecha) + (p.edad ? ' · cumple ' + p.edad : '') + '</div></div>' +
        '<div style="text-align:right">' + cuando + (p.activo ? '' : '<div class="off">sin saludo</div>') + '</div></div>';
    }).join('') : '<div class="muted">Nadie cumple en los próximos 15 días.</div>';
    document.getElementById('cuCuerpo').innerHTML =
      '<div class="cu-sw"><div class="tx"><b>Saludar a los socios en su cumpleaños</b><span>Todos los días a las 10 sale el saludo: al celular si activaron los avisos, si no por mail. Ese día también lo ven en la app.</span></div>' + sw('cuGeneral', r.activo) + '</div>' +
      '<label>Mensaje propio (opcional)</label>' +
      '<textarea id="cuMsg" rows="3" maxlength="300" placeholder="Dejalo vacío para usar los mensajes del sistema">' + esc(r.mensaje) + '</textarea>' +
      '<div class="muted" style="margin-top:4px">Escribí <b>{nombre}</b> donde va el nombre. Ej.: ¡Feliz cumple {nombre}! 🎉 Te esperamos en el club.</div>' +
      '<details style="margin-top:8px"><summary class="muted" style="cursor:pointer">Ver los mensajes del sistema (van rotando)</summary>' +
      r.ejemplos.map(function (x) { return '<div class="cu-ej">🎂 ¡Feliz cumple, Nombre! ' + esc(x) + '</div>'; }).join('') + '</details>' +
      '<button class="btn" id="cuGuardar" type="button">Guardar</button><div class="error" id="cuErr"></div>' +
      '<h3 style="margin-top:18px">Próximos cumpleaños</h3><div class="cu-lista">' + prox + '</div>' +
      (r.desactivados.length ? '<div class="muted" style="margin-top:10px">Sin saludo: ' + r.desactivados.map(function (x) { return esc(x.nombre); }).join(', ') + '. Se cambia desde la ficha de cada socio.</div>' : '') +
      (r.sinFecha ? '<div class="muted" style="margin-top:6px">' + r.sinFecha + ' socio' + (r.sinFecha === 1 ? '' : 's') + ' sin fecha de nacimiento cargada: a ' + (r.sinFecha === 1 ? 'ese no lo' : 'esos no los') + ' podemos saludar.</div>' : '');
  }
  document.getElementById('cuDet').addEventListener('toggle', function () { if (this.open) cargarMas(); });
  cMas.addEventListener('click', function (ev) {
    if (!ev.target.closest('#cuGuardar')) return;
    var b = ev.target.closest('#cuGuardar'), err = document.getElementById('cuErr');
    err.className = 'error'; err.textContent = ''; b.disabled = true;
    api('adminCumpleGuardar', token, { activo: document.getElementById('cuGeneral').checked, mensaje: document.getElementById('cuMsg').value })
      .then(function (r) { datosCu.activo = r.activo; datosCu.mensaje = r.mensaje; pintarMas(); var e2 = document.getElementById('cuErr'); e2.className = 'ok'; e2.textContent = 'Guardado.'; })
      .catch(function (e) { err.textContent = msg(e); b.disabled = false; });
  });

  /* ================= Ficha: saludo de este socio ================= */
  var cFicha = document.createElement('div');
  cFicha.className = 'card oculto'; cFicha.id = 'cuFicha';
  var nuevaClave = document.getElementById('bNuevaClave');
  if (nuevaClave) nuevaClave.parentNode.insertBefore(cFicha, nuevaClave);

  var nroFicha = null;
  function pintarFichaCu(r) {
    var txt = !r.fecha ? 'No tiene fecha de nacimiento cargada: cargala en "Editar datos" para poder saludarlo.'
      : (r.esHoy ? '¡Cumple hoy! 🎉 ' : 'Cumple el ' + r.fecha + '. ') +
        (!r.general ? 'El saludo está apagado para todo el club (se cambia en Más).' : r.activo ? (r.esHoy ? 'Hoy le llega el saludo.' : 'Ese día le llega el saludo.') : 'No le vamos a mandar el saludo.');
    cFicha.innerHTML = '<div class="cu-sw"><div class="tx"><b>🎂 Saludo de cumpleaños</b><span>' + esc(txt) + '</span></div>' + sw('cuSocio', r.activo) + '</div><div class="error" id="cuFErr" style="min-height:0"></div>';
    cFicha.classList.remove('oculto');
  }
  var pintarAnterior = window.pintarFicha;
  window.pintarFicha = function (f) {
    var r = pintarAnterior.apply(this, arguments);
    nroFicha = f && f.nro;
    cFicha.classList.add('oculto');
    if (nroFicha) {
      var pedido = nroFicha;
      api('adminCumpleSocio', token, pedido).then(function (x) { if (pedido === nroFicha) pintarFichaCu(x); }).catch(function () {});
    }
    return r;
  };
  cFicha.addEventListener('change', function (ev) {
    var chk = ev.target; if (chk.id !== 'cuSocio') return;
    chk.disabled = true;
    api('adminCumpleSocioGuardar', token, nroFicha, chk.checked)
      .then(function () { return api('adminCumpleSocio', token, nroFicha); })
      .then(pintarFichaCu)
      .catch(function (e) { chk.checked = !chk.checked; chk.disabled = false; var er = document.getElementById('cuFErr'); if (er) er.textContent = msg(e); });
  });
})();
