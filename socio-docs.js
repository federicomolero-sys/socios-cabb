/* Socios CABB — "Documentos del Círculo" en Perfil: estatuto vigente (PDF) y normas de convivencia. */
(function () {
  var panel = document.getElementById('vPanel');
  if (!panel) return;

  var css = document.createElement('style');
  css.textContent =
    '.doc-it{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--linea);text-decoration:none;color:inherit}' +
    '.doc-it:first-of-type{border-top:0;padding-top:2px}' +
    '.doc-it .ic{width:38px;height:38px;border-radius:10px;background:var(--crema);display:flex;align-items:center;justify-content:center;font-size:19px;flex:none}' +
    '.doc-it .tx{flex:1;min-width:0}.doc-it .tx b{display:block;font-size:15px}.doc-it .tx span{color:var(--gris);font-size:12.5px}' +
    '.doc-it .fl{color:var(--verde);font-weight:700;font-size:13px;white-space:nowrap}' +
    '#docNormas summary{cursor:pointer;font-weight:600;padding:10px 0 2px;border-top:1px solid var(--linea);list-style:none}' +
    '#docNormas summary::-webkit-details-marker{display:none}#docNormas summary::after{content:" ›";color:var(--gris)}#docNormas[open] summary::after{content:" ⌄"}' +
    '#docNormas .txt{white-space:pre-line;font-size:14px;line-height:1.5;color:#3a3a36;margin-top:8px}';
  document.head.appendChild(css);

  var card = document.createElement('div');
  card.className = 'card oculto'; card.id = 'bDocumentos';
  card.innerHTML = '<h2>📄 Documentos del Círculo</h2><div id="docLista"></div>' +
    '<details id="docNormas" class="oculto"><summary>🤝 Normas de convivencia</summary><div class="txt" id="docNormasTxt"></div></details>';

  function ubicar() {
    var per = document.getElementById('sec-perfil');
    var ref = document.getElementById('bMisDatos');
    if (per && ref && ref.parentNode === per) { if (card.previousSibling !== ref) per.insertBefore(card, ref.nextSibling); }
    else if (!card.parentNode) panel.appendChild(card);
  }

  function pintar(r) {
    var docs = r.docs || [];
    document.getElementById('docLista').innerHTML = docs.map(function (d) {
      return '<a class="doc-it" href="' + esc(d.url) + '" target="_blank" rel="noopener"><div class="ic">📜</div><div class="tx"><b>' + esc(d.titulo) + '</b>' +
        '<span>' + (d.vigencia ? 'Vigente desde ' + esc(d.vigencia) : 'Versión vigente') + '</span></div><div class="fl">Ver PDF</div></a>';
    }).join('');
    var normas = String(r.normas || '').trim();
    document.getElementById('docNormasTxt').textContent = normas;
    document.getElementById('docNormas').classList.toggle('oculto', !normas);
    card.classList.toggle('oculto', !docs.length && !normas);
  }

  var cargando = false, ultima = 0;
  function cargar(forzar) {
    if (!window.token || !window.datos || cargando) return;
    if (!forzar && Date.now() - ultima < 5 * 60000) return;
    cargando = true;
    api('socioDocumentos', token).then(function (r) { ultima = Date.now(); ubicar(); pintar(r); })
      .catch(function (e) { if (!sesionVencida(e)) console.warn('socioDocumentos', e); })
      .then(function () { cargando = false; });
  }
  new MutationObserver(function () {
    if (!panel.classList.contains('oculto')) setTimeout(function () { cargar(true); }, 0);
    else card.classList.add('oculto');
  }).observe(panel, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(function () { if (card.parentNode) ubicar(); }).observe(panel, { childList: true });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') cargar(); });
  setTimeout(function () { cargar(true); }, 0);
})();
