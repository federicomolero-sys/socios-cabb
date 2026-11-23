/* Comisión CABB — ficha de inscripción para imprimir o guardar en PDF.
 * En la ficha de cada socio: botón "Imprimir ficha de inscripción" (dos ejemplares: Círculo y socio).
 * En "Más": editar el texto del compromiso y las normas de convivencia.
 */
(function () {
  function e(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function parrafos(t) {
    return String(t || '').split(/\n\s*\n/).map(function (p) { return '<p>' + e(p.trim()).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  /* ================= página imprimible ================= */
  function ejemplar(d, rotulo) {
    var escudo = new URL('escudo.svg', location.href).href;
    var fila = function (k, v) { return '<tr><th>' + k + '</th><td>' + (v ? e(v) : '<span class="linea"></span>') + '</td></tr>'; };
    var firmas = '<div class="firma"><div class="raya"></div><b>Por el ' + e(d.club) + '</b><span>Firma y aclaración</span></div>' +
      '<div class="firma"><div class="raya"></div><b>' + e(d.nombre + ' ' + d.apellido) + '</b><span>Socio/a · DNI ' + e(d.dni) + '</span></div>' +
      (d.menor ? '<div class="firma"><div class="raya"></div><b>Madre, padre o tutor/a</b><span>Firma, aclaración y DNI</span></div>' : '');
    return '<section class="hoja">' +
      '<header><img src="' + escudo + '" alt=""><div class="tit"><div class="club">' + e(d.club) + '</div><h1>Ficha de inscripción de socio</h1></div>' +
      '<div class="nro"><small>Socio Nº</small>' + e(d.nro) + '</div></header>' +
      '<div class="rotulo">' + e(rotulo) + '</div>' +
      '<h2>Datos del socio</h2><table>' +
      fila('Apellido y nombre', d.apellido + ', ' + d.nombre) + fila('DNI', d.dni) +
      fila('Fecha de nacimiento', d.nacimiento ? d.nacimiento + (d.edad !== null && d.edad !== undefined ? ' (' + d.edad + ' años)' : '') : '') +
      fila('Teléfono', d.telefono) + fila('Mail', d.email) + fila('Domicilio', d.domicilio) +
      fila('Categoría', d.categoria + (d.cuota ? ' · cuota mensual ' + d.cuota : '')) + fila('Fecha de alta', d.alta) + '</table>' +
      '<h2>Compromiso</h2><div class="texto">' + parrafos(d.compromiso) + '</div>' +
      (d.estatuto ? '<div class="estat">Estatuto vigente: ' + e(d.estatuto.titulo) + (d.estatuto.vigencia ? ', versión de ' + e(d.estatuto.vigencia) : '') + '. Disponible en la app de socios (Perfil → Documentos).</div>' : '') +
      (String(d.normas || '').trim() ? '<h2>Normas de convivencia</h2><div class="texto normas">' + e(d.normas) + '</div>' : '') +
      '<div class="lugar">Bahía Blanca, ' + e(d.hoy) + '</div>' +
      '<div class="firmas' + (d.menor ? ' tres' : '') + '">' + firmas + '</div></section>';
  }

  function paginaHTML(d) {
    return '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>Ficha de inscripción - ' + e(d.apellido + ', ' + d.nombre) + '</title><style>' +
      '@page{size:A4;margin:13mm 14mm}' +
      '*{box-sizing:border-box}body{margin:0;font-family:Georgia,"Times New Roman",serif;color:#1d1d1b;background:#e9e6df;font-size:10.5pt;line-height:1.38}' +
      '.barra{position:sticky;top:0;background:#1f3d2b;color:#fff;padding:10px 14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-family:-apple-system,"Segoe UI",Roboto,sans-serif;font-size:14px;z-index:2}' +
      '.barra button{background:#c9a85a;color:#1f1a0e;border:0;border-radius:8px;padding:9px 14px;font-weight:700;font-size:14px}' +
      '.barra label{display:flex;gap:6px;align-items:center}' +
      '.hoja{background:#fff;width:210mm;min-height:297mm;margin:14px auto;padding:13mm 14mm;box-shadow:0 2px 10px rgba(0,0,0,.12);position:relative}' +
      'header{display:flex;align-items:center;gap:14px;border-bottom:2px solid #1f3d2b;padding-bottom:8px}' +
      'header img{width:46px;height:62px}.tit{flex:1}.club{font-size:9.5pt;letter-spacing:.14em;text-transform:uppercase;color:#7a6224;font-weight:700}' +
      'h1{margin:2px 0 0;font-size:17pt;color:#1f3d2b;font-weight:700}' +
      '.nro{border:1.5px solid #1f3d2b;border-radius:8px;padding:4px 12px;text-align:center;font-size:16pt;font-weight:700;color:#1f3d2b;min-width:84px}.nro small{display:block;font-size:7.5pt;letter-spacing:.1em;font-weight:400;text-transform:uppercase}' +
      '.rotulo{text-align:right;font-size:8.5pt;letter-spacing:.12em;text-transform:uppercase;color:#777;margin-top:5px}' +
      'h2{font-size:10.5pt;letter-spacing:.1em;text-transform:uppercase;color:#1f3d2b;margin:12px 0 5px;border-bottom:1px solid #d9d2c3;padding-bottom:2px}' +
      'table{width:100%;border-collapse:collapse}th{text-align:left;font-weight:400;color:#666;width:34%;padding:3px 0;vertical-align:bottom}td{padding:3px 0;font-weight:700;border-bottom:1px dotted #bbb}' +
      '.linea{display:inline-block;width:100%}' +
      '.texto p{margin:0 0 6px;text-align:justify}.normas{white-space:pre-line;font-size:9.8pt}' +
      '.lugar{margin-top:14px}.estat{font-size:9.5pt;font-style:italic;color:#444;border-left:3px solid #c9a85a;padding:3px 8px;margin:2px 0 4px}' +
      '.firmas{display:flex;gap:26px;margin-top:40px}.firma{flex:1;text-align:center;font-size:9.5pt}.firma .raya{border-top:1px solid #1d1d1b;margin-bottom:4px}' +
      '.firma b{display:block}.firma span{color:#666;font-size:8.5pt}.firmas.tres{gap:16px}' +
      '@media screen and (max-width:820px){.hoja{width:auto;min-height:0;margin:10px;padding:16px}}' +
      '@media print{body{background:#fff}.barra{display:none}.hoja{box-shadow:none;margin:0;width:auto;min-height:0;padding:0;page-break-after:always}.hoja:last-child{page-break-after:auto}' +
      'body.uno .hoja.copia{display:none}}' +
      'body.uno .hoja.copia{display:none}' +
      '</style></head><body>' +
      '<div class="barra"><button type="button" onclick="window.print()">🖨️ Imprimir o guardar PDF</button>' +
      '<label><input type="checkbox" id="dos" checked onchange="document.body.classList.toggle(\'uno\', !this.checked)"> Dos ejemplares (Círculo y socio)</label></div>' +
      ejemplar(d, 'Ejemplar para el Círculo') +
      ejemplar(d, 'Ejemplar para el socio/a').replace('<section class="hoja">', '<section class="hoja copia">') +
      '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},400);});<\/script>' +
      '</body></html>';
  }

  function abrirVentana() {
    var w = window.open('', '_blank');
    if (!w) { toast('El navegador bloqueó la ventana: permití las ventanas emergentes para este sitio.'); return null; }
    w.document.write('<p style="font-family:sans-serif;padding:20px">Preparando la ficha…</p>');
    return w;
  }
  function escribir(w, d) { w.document.open(); w.document.write(paginaHTML(d)); w.document.close(); }

  window.imprimirFichaSocio = function (nro) {
    var w = abrirVentana(); if (!w) return;
    api('adminFichaImprimir', token, nro).then(function (d) { escribir(w, d); })
      .catch(function (err) { w.close(); toast(msg(err)); });
  };

  /* ================= botón en la ficha del socio ================= */
  var cImp = document.createElement('div');
  cImp.className = 'card oculto'; cImp.id = 'fiImp';
  cImp.innerHTML = '<button class="btn sec" type="button" id="fiImpBtn">🖨️ Imprimir ficha de inscripción</button>' +
    '<div class="muted" style="margin-top:6px">Con sus datos, el compromiso, las normas del Círculo y lugar para las firmas. También se puede guardar como PDF.</div>';
  var antes = document.getElementById('cuFicha') || document.getElementById('bNuevaClave');
  if (antes) antes.parentNode.insertBefore(cImp, antes);
  var nroImp = null;
  var pintarPrev = window.pintarFicha;
  window.pintarFicha = function (f) {
    var r = pintarPrev.apply(this, arguments);
    nroImp = f && f.nro;
    cImp.classList.toggle('oculto', !nroImp);
    return r;
  };
  cImp.addEventListener('click', function (ev) { if (ev.target.closest('#fiImpBtn') && nroImp) window.imprimirFichaSocio(nroImp); });

  /* ================= Más: editar textos ================= */
  var cMas = document.createElement('div');
  cMas.className = 'card'; cMas.id = 'fiCard';
  cMas.innerHTML = '<details id="fiDet"><summary style="font-weight:600;cursor:pointer">📄 Ficha de inscripción y normas del Círculo</summary><div id="fiCuerpo" style="margin-top:10px"><div class="muted">Cargando…</div></div></details>';
  var mas = document.getElementById('vMas');
  var ref = document.getElementById('cuCard') || (document.getElementById('cActual') && document.getElementById('cActual').closest('.card'));
  if (mas) { if (ref && ref.parentNode === mas) mas.insertBefore(cMas, ref); else mas.appendChild(cMas); }

  var tx = null;
  function pintarMas() {
    document.getElementById('fiCuerpo').innerHTML =
      '<div class="muted">Estos textos salen en la ficha que se imprime desde cada socio. Separá los párrafos con una línea en blanco.</div>' +
      '<label>Compromiso del socio</label><textarea id="fiComp" rows="9" maxlength="3000">' + e(tx.compromiso) + '</textarea>' +
      '<button class="link" type="button" data-rest="comp">Volver al texto original</button>' +
      '<label style="margin-top:12px">Normas de convivencia</label><textarea id="fiNorm" rows="11" maxlength="3000">' + e(tx.normas) + '</textarea>' +
      '<button class="link" type="button" data-rest="norm">Volver al texto original</button>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn" id="fiGuardar" type="button">Guardar</button>' +
      '<button class="btn sec" id="fiPrevia" type="button">Vista previa</button></div><div class="error" id="fiErr"></div>';
  }
  document.getElementById('fiDet').addEventListener('toggle', function () {
    if (!this.open || tx) return;
    api('adminTextosFicha', token).then(function (r) { tx = r; pintarMas(); })
      .catch(function (err) { document.getElementById('fiCuerpo').innerHTML = '<div class="error">' + e(msg(err)) + '</div>'; });
  });
  cMas.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t.dataset && t.dataset.rest) {
      if (t.dataset.rest === 'comp') document.getElementById('fiComp').value = tx.compromisoDef;
      else document.getElementById('fiNorm').value = tx.normasDef;
      return;
    }
    if (t.closest('#fiPrevia')) {
      var w = abrirVentana(); if (!w) return;
      escribir(w, { club: 'Círculo de Ajedrez de Bahía Blanca', nro: 0, apellido: 'Ejemplo', nombre: 'Socio', dni: '00.000.000', nacimiento: '01/01/1990', edad: 36,
        menor: false, telefono: '291 000-0000', email: 'socio@ejemplo.com', domicilio: 'Calle Ejemplo 123, Bahía Blanca', categoria: 'General', cuota: '', alta: '', hoy: new Date().toLocaleDateString('es-AR'),
        compromiso: document.getElementById('fiComp').value, normas: document.getElementById('fiNorm').value });
      return;
    }
    if (t.closest('#fiGuardar')) {
      var b = t.closest('#fiGuardar'), err = document.getElementById('fiErr');
      err.className = 'error'; err.textContent = ''; b.disabled = true;
      api('adminGuardarTextosFicha', token, { compromiso: document.getElementById('fiComp').value, normas: document.getElementById('fiNorm').value })
        .then(function (r) { tx.compromiso = r.compromiso; tx.normas = r.normas; err.className = 'ok'; err.textContent = 'Guardado.'; })
        .catch(function (x) { err.textContent = msg(x); })
        .then(function () { b.disabled = false; });
    }
  });
})();
