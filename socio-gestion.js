/* Socios CABB — app del socio: familia, suspensión, ofertas de pago anual/semestral
 * y comprobante adjunto en los avisos de pago. Se apoya en app.js (api, esc, token, datos, msgError, sesionVencida).
 */
(function () {
  var estilos = document.createElement('style');
  estilos.textContent =
    '.sanc { background: #fff1d6; border: 1px solid #f0d49a; }' +
    '.sanc h2 { color: var(--aviso); }' +
    '.oferta { border: 2px solid var(--oro, #c9a85a); background: linear-gradient(180deg, #fffaf0, #fff); }' +
    '.oferta .precio { font-size: 26px; font-weight: 700; margin: 4px 0; } .oferta .precio s { font-size: 15px; color: var(--gris); font-weight: 400; margin-right: 6px; }' +
    '.oferta .ahorro { display: inline-block; background: #d8f0e0; color: var(--ok); font-weight: 700; font-size: 12px; border-radius: 999px; padding: 3px 10px; }' +
    '.of-form { margin-top: 10px; border-top: 1px solid var(--linea); padding-top: 10px; }' +
    '.fam-int { border-top: 1px solid var(--linea); padding: 8px 0; font-size: 14px; } .fam-int:first-of-type { border-top: 0; }' +
    '.fam-int .d { color: var(--gris); font-size: 12px; } .fam-int .v { color: var(--mal); }' +
    '.adj { font-size: 13px; color: var(--gris); margin-top: 4px; }' +
    'input[type=file] { font-size: 14px; padding: 8px; background: #fff; }';
  document.head.appendChild(estilos);

  /* ---------------- comprobante: leer y achicar ---------------- */
  // Fotos: se achican a 1600 px (JPEG) para que suban rápido. PDF: tal cual (máx. 6 MB).
  window.leerComprobante = function (input) {
    var f = input && input.files && input.files[0];
    if (!f) return Promise.resolve(null);
    if (f.type === 'application/pdf') {
      if (f.size > 6 * 1024 * 1024) return Promise.reject(new Error('El PDF es muy grande (máximo 6 MB).'));
      return leerB64(f).then(function (d) { return { nombre: f.name, tipo: f.type, datos: d }; });
    }
    if (!/^image\//.test(f.type)) return Promise.reject(new Error('Adjuntá una foto o un PDF.'));
    return new Promise(function (ok, mal) {
      var img = new Image(), url = URL.createObjectURL(f);
      img.onload = function () {
        var max = 1600, w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok({ nombre: f.name.replace(/\.\w+$/, '') + '.jpg', tipo: 'image/jpeg', datos: c.toDataURL('image/jpeg', 0.82).split(',')[1] });
      };
      img.onerror = function () { URL.revokeObjectURL(url); mal(new Error('No se pudo leer la imagen.')); };
      img.src = url;
    });
  };
  function leerB64(f) {
    return new Promise(function (ok, mal) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).split(',')[1]); };
      r.onerror = function () { mal(new Error('No se pudo leer el archivo.')); };
      r.readAsDataURL(f);
    });
  }
  var INPUT_COMP = '<label>Comprobante (opcional)</label><input type="file" accept="image/*,application/pdf" class="inComp">' +
    '<div class="adj">Foto o PDF de la transferencia. Le llega a la comisión junto con el aviso.</div>';

  /* ---------------- aviso de pago de cuotas, con comprobante y opción familia ---------------- */
  var viejo = document.getElementById('fAviso');
  var form = viejo.cloneNode(true); // sin el manejador original de app.js
  viejo.parentNode.replaceChild(form, viejo);
  var bAv = form.querySelector('#bAvisar');
  var compBox = document.createElement('div'); compBox.innerHTML = INPUT_COMP;
  form.insertBefore(compBox, bAv);
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var err = document.getElementById('eAviso'); err.textContent = '';
    var per = document.getElementById('aPeriodo').value;
    bAv.disabled = true; bAv.textContent = 'Enviando…';
    leerComprobante(form.querySelector('.inComp')).then(function (arch) {
      return api('avisarPago', token, { tipo: per === 'familia' ? 'familia' : 'cuota', periodo: per, medio: document.getElementById('aMedio').value,
        comentario: document.getElementById('aComent').value, archivo: arch });
    }).then(function () {
      document.getElementById('aComent').value = ''; form.querySelector('.inComp').value = '';
      document.getElementById('dAviso').classList.remove('oculto');
      form.closest('details').open = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }).catch(function (e) { if (!sesionVencida(e)) err.textContent = msgError(e); })
      .then(function () { bAv.disabled = false; bAv.textContent = 'Enviar aviso'; });
  });

  /* ---------------- tarjetas: suspensión, familia, ofertas ---------------- */
  var ancla = document.getElementById('bDeuda');
  function tarjeta(id, clase) {
    var c = document.getElementById(id);
    if (!c) { c = document.createElement('div'); c.id = id; c.className = 'card oculto ' + (clase || ''); ancla.parentNode.insertBefore(c, ancla.nextSibling); }
    return c;
  }
  var cOfertas = tarjeta('bOfertas'), cFam = tarjeta('bFamilia'), cSanc = tarjeta('bSancion', 'sanc');
  // orden: suspensión, deuda, familia, ofertas
  ancla.parentNode.insertBefore(cSanc, ancla);

  function pintarExtras() {
    var d = window.datos;
    if (!d) return;
    // Suspensión
    var s = d.sanciones || [];
    cSanc.classList.toggle('oculto', !s.length);
    cSanc.innerHTML = s.map(function (x) {
      return '<h2>Suspensión hasta el ' + esc(x.hasta) + '</h2><div class="muted">' + esc(x.motivo) + '</div>' +
        '<div class="muted" style="margin-top:6px">' + (x.conCuota ? 'Mientras dure, la cuota se sigue generando.' : 'Mientras dure, no se generan cuotas.') +
        ' Al terminar, quedás activo/a de nuevo automáticamente.</div>';
    }).join('');
    // Familia
    var f = d.familia;
    if (!f) cFam.classList.add('oculto');
    else {
      cFam.classList.remove('oculto');
      var h = '<h2>👪 ' + esc(f.nombre) + '</h2>';
      if (f.soyResponsable && f.pagaCuotas && f.integrantes) {
        h += '<div class="muted">Sos responsable de pago del grupo familiar' + (f.pagaEventos ? ' (cuotas y eventos)' : '') + '. Total pendiente de la familia: <b>' + esc(f.deudaTotal) + '</b></div>';
        h += f.integrantes.map(function (i) {
          return '<div class="fam-int"><b>' + esc(i.nombre) + '</b> — ' + esc(i.deuda) + (i.pendientes.length ? '<div class="d">' + i.pendientes.map(function (p) {
            return '<span' + (p.vencida ? ' class="v"' : '') + '>' + esc(p.legible) + ' ' + esc(p.monto) + '</span>'; }).join(' · ') + '</div>' : '<div class="d">Al día</div>') + '</div>';
        }).join('');
        h += '<div class="muted" style="margin-top:6px">Para avisar el pago de todo, usá "Avisar que pagué" y elegí "Todo lo de mi familia".</div>';
      } else if (f.responsable && (f.pagaCuotas || f.pagaEventos) && !f.soyResponsable) {
        h += '<div class="muted">Tus ' + (f.pagaCuotas && f.pagaEventos ? 'cuotas y eventos' : f.pagaCuotas ? 'cuotas' : 'eventos') + ' los paga <b>' + esc(f.responsable) + '</b>. Si querés, también podés pagar los tuyos.</div>';
      } else {
        h += '<div class="muted">Tenés grupo familiar en el club.</div>';
      }
      cFam.innerHTML = h;
    }
    // Ofertas
    var o = d.ofertas || [];
    cOfertas.classList.toggle('oculto', !o.length);
    cOfertas.className = 'card oferta' + (o.length ? '' : ' oculto');
    cOfertas.innerHTML = o.map(function (x) {
      return '<div class="of" data-id="' + esc(x.id) + '"><h2>🎁 ' + esc(x.nombre) + '</h2>' +
        '<div class="muted">Pagá ' + x.cantMeses + ' meses juntos (' + esc(x.desdeTxt) + ' a ' + esc(x.hastaTxt) + ')' + (x.hasta ? '. Oferta hasta el ' + esc(x.hasta) : '') + '.</div>' +
        '<div class="precio">' + (x.ahorroTxt !== '$ 0' ? '<s>' + esc(x.sinPlanTxt) + '</s>' : '') + esc(x.totalTxt) + '</div>' +
        (x.descuento ? '<span class="ahorro">Ahorrás ' + esc(x.ahorroTxt) + ' (' + x.descuento + '%)</span>' : '') +
        (x.avisado ? '<div class="okmsg" style="margin-top:10px">Ya avisaste este pago. La comisión lo va a confirmar.</div>' :
          '<button class="btn ofQuiero" type="button">Lo quiero</button><div class="of-form oculto">' + datosPagoHtml(d) +
          '<label>¿Cómo pagaste?</label><select class="ofMedio">' + d.medios.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('') + '</select>' +
          INPUT_COMP + '<label>Comentario (opcional)</label><input class="ofComent" maxlength="300">' +
          '<button class="btn ofAvisar" type="button">Ya pagué ' + esc(x.totalTxt) + ': avisar</button><div class="error ofErr"></div></div>') + '</div>';
    }).join('<hr style="border:0;border-top:1px solid var(--linea);margin:14px 0">');

    // Aviso: opción "familia" y mostrar el formulario aunque yo no deba
    var sel = document.getElementById('aPeriodo');
    if (f && f.soyResponsable && f.pagaCuotas && f.deudaOtros && f.deudaOtros !== '$ 0') {
      if (!sel.querySelector('option[value=familia]')) sel.insertAdjacentHTML('beforeend', '<option value="familia">Todo lo de mi familia — ' + esc(f.deudaTotal) + '</option>');
      document.getElementById('bAviso').classList.remove('oculto');
    }
  }
  function datosPagoHtml(d) {
    var p = d.pago, h = '<div class="muted" style="margin-bottom:6px">';
    if (p.alias) h += 'Alias: <b>' + esc(p.alias) + '</b> <button type="button" class="copiar" data-v="' + esc(p.alias) + '">Copiar</button><br>';
    if (p.cbu) h += 'CBU/CVU: <b>' + esc(p.cbu) + '</b> <button type="button" class="copiar" data-v="' + esc(p.cbu) + '">Copiar</button><br>';
    if (p.mp) h += '<a href="' + esc(p.mp) + '" target="_blank" rel="noopener">Pagar con Mercado Pago</a><br>';
    return h + 'O en efectivo en la sede.</div>';
  }
  cOfertas.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    var box = ev.target.closest('.of'); if (!box) return;
    if (b.classList.contains('ofQuiero')) { box.querySelector('.of-form').classList.remove('oculto'); b.classList.add('oculto'); return; }
    if (!b.classList.contains('ofAvisar')) return;
    var err = box.querySelector('.ofErr'); err.textContent = '';
    b.disabled = true; var txt = b.textContent; b.textContent = 'Enviando…';
    leerComprobante(box.querySelector('.inComp')).then(function (arch) {
      return api('avisarPago', token, { tipo: 'plan', plan: box.dataset.id, medio: box.querySelector('.ofMedio').value, comentario: box.querySelector('.ofComent').value, archivo: arch });
    }).then(function () { return api('datos', token); }).then(function (d) { window.datos = d; pintarExtras(); })
      .catch(function (e) { b.disabled = false; b.textContent = txt; if (!sesionVencida(e)) err.textContent = msgError(e); });
  });

  // Repintar cuando app.js vuelve a pintar el panel
  var obs = new MutationObserver(function () { setTimeout(pintarExtras, 0); });
  obs.observe(document.getElementById('cNombre'), { childList: true, characterData: true, subtree: true });
  obs.observe(document.getElementById('aPeriodo'), { childList: true });
  new MutationObserver(function () { if (!document.getElementById('vPanel').classList.contains('oculto')) setTimeout(pintarExtras, 0); })
    .observe(document.getElementById('vPanel'), { attributes: true, attributeFilter: ['class'] });
  setTimeout(pintarExtras, 0);
})();
