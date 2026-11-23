/* Comisión CABB — Documentos del Círculo (estatuto y otros PDF).
 * En "Más": publicar un PDF (queda en el Drive del Círculo y visible con link), reemplazar versiones,
 * ver el histórico y avisar a los socios. Los socios lo ven en su app, en Perfil → Documentos.
 */
(function () {
  function e(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function tam(b) { return b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }

  var css = document.createElement('style');
  css.textContent =
    '.dc-it{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:10px 0;border-top:1px solid var(--linea)}' +
    '.dc-it:first-child{border-top:0}.dc-it b{display:block}.dc-it .s{color:var(--gris);font-size:12.5px}' +
    '.dc-it .ops{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex:none}' +
    '.dc-form{background:var(--crema);border-radius:10px;padding:12px;margin-top:12px}' +
    '.dc-form h3{margin:0 0 4px}';
  document.head.appendChild(css);

  var card = document.createElement('div');
  card.className = 'card'; card.id = 'dcCard';
  card.innerHTML = '<details id="dcDet"><summary style="font-weight:600;cursor:pointer">📚 Documentos del Círculo (estatuto)</summary><div id="dcCuerpo" style="margin-top:10px"><div class="muted">Cargando…</div></div></details>';
  var mas = document.getElementById('vMas');
  var ref = document.getElementById('fiCard') || document.getElementById('cuCard');
  if (mas) { if (ref && ref.parentNode === mas) mas.insertBefore(card, ref); else mas.appendChild(card); }

  var lista = null;
  function pintar() {
    var vig = lista.filter(function (d) { return d.estado === 'Vigente'; }), ant = lista.filter(function (d) { return d.estado === 'Anterior'; });
    var item = function (d, vigente) {
      return '<div class="dc-it" data-id="' + e(d.id) + '" data-titulo="' + e(d.titulo) + '"><div><b>' + e(d.titulo) + '</b>' +
        '<div class="s">' + (d.vigencia ? 'Vigente desde ' + e(d.vigencia) + ' · ' : '') + 'subido el ' + e(d.fecha) + (d.usuario ? ' por ' + e(d.usuario) : '') + ' · ' + tam(d.tam) + '</div></div>' +
        '<div class="ops"><a class="link" href="' + e(d.url) + '" target="_blank" rel="noopener">Ver PDF</a>' +
        (vigente ? '<button class="link dcReemp" type="button">Subir versión nueva</button>' : '') +
        '<button class="link dcBorrar" type="button" style="color:var(--mal)">Borrar</button></div></div>';
    };
    document.getElementById('dcCuerpo').innerHTML =
      '<div class="muted">Lo que publiques acá lo ven los socios en su app (Perfil → Documentos). El estatuto vigente además sale en el mail de bienvenida, en el WhatsApp del alta y en la ficha de inscripción.</div>' +
      '<div style="margin-top:8px">' + (vig.length ? vig.map(function (d) { return item(d, true); }).join('') : '<div class="muted">Todavía no hay documentos publicados.</div>') + '</div>' +
      (ant.length ? '<details style="margin-top:8px"><summary class="muted" style="cursor:pointer">Versiones anteriores (' + ant.length + ')</summary>' + ant.map(function (d) { return item(d, false); }).join('') + '</details>' : '') +
      '<div class="dc-form"><h3 id="dcTit">Publicar documento</h3>' +
      '<label>Título</label><input id="dcTitulo" maxlength="80" value="Estatuto" placeholder="Ej.: Estatuto, Reglamento interno">' +
      '<label>Vigente desde (opcional)</label><input id="dcVig" maxlength="60" placeholder="Ej.: marzo 2024, o Asamblea del 15/03/2024">' +
      '<label>Archivo PDF (máximo 8 MB)</label><input id="dcArch" type="file" accept="application/pdf,.pdf">' +
      '<label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="dcAvisar" checked style="width:auto"> Avisar a los socios con una notificación</label>' +
      '<div class="muted" style="margin-top:4px">Si ya hay uno vigente con el mismo título, el nuevo lo reemplaza y el anterior queda en "Versiones anteriores".</div>' +
      '<button class="btn" id="dcSubir" type="button">Publicar</button><div class="error" id="dcErr"></div></div>';
  }
  function cargar() {
    api('adminDocumentos', token).then(function (l) { lista = l; pintar(); })
      .catch(function (x) { document.getElementById('dcCuerpo').innerHTML = '<div class="error">' + e(msg(x)) + '</div>'; });
  }
  document.getElementById('dcDet').addEventListener('toggle', function () { if (this.open) cargar(); });

  function leerArchivo(f) {
    return new Promise(function (ok, mal) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).replace(/^data:[^,]*,/, '')); };
      r.onerror = function () { mal(new Error('No se pudo leer el archivo.')); };
      r.readAsDataURL(f);
    });
  }

  card.addEventListener('click', function (ev) {
    var t = ev.target, it = t.closest('.dc-it');
    if (t.classList.contains('dcReemp') && it) {
      document.getElementById('dcTitulo').value = it.dataset.titulo;
      document.getElementById('dcVig').value = '';
      document.getElementById('dcTit').textContent = 'Versión nueva de: ' + it.dataset.titulo;
      document.getElementById('dcArch').focus(); document.querySelector('.dc-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (t.classList.contains('dcBorrar') && it) {
      confirmar('¿Borrar "' + it.dataset.titulo + '"? Deja de verse en la app de los socios y el archivo va a la papelera de Drive.', 'Borrar', function () {
        api('adminBorrarDocumento', token, it.dataset.id).then(function () { toast('Documento borrado'); cargar(); }).catch(function (x) { toast(msg(x)); });
      }, 'peligro');
      return;
    }
    if (t.closest('#dcSubir')) {
      var b = t.closest('#dcSubir'), err = document.getElementById('dcErr'), f = document.getElementById('dcArch').files[0];
      err.className = 'error'; err.textContent = '';
      if (!f) { err.textContent = 'Elegí el archivo PDF.'; return; }
      if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { err.textContent = 'El archivo tiene que ser un PDF.'; return; }
      if (f.size > 8 * 1024 * 1024) { err.textContent = 'El PDF pesa ' + tam(f.size) + ': el máximo es 8 MB.'; return; }
      ocupado(b, true, 'Subiendo…');
      leerArchivo(f).then(function (b64) {
        return api('adminSubirDocumento', token, { titulo: document.getElementById('dcTitulo').value, vigencia: document.getElementById('dcVig').value,
          nombre: f.name, base64: b64, avisar: document.getElementById('dcAvisar').checked });
      }).then(function (r) {
        lista = r.lista; pintar();
        toast((r.reemplazo ? 'Versión nueva publicada' : 'Documento publicado') + (r.avisados ? ' · avisamos a ' + r.avisados + ' celular' + (r.avisados === 1 ? '' : 'es') : ''));
      }).catch(function (x) { err.textContent = msg(x); ocupado(b, false); });
    }
  });
})();
