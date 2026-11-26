/* Socios CABB — comprobante de pago: lo abre para ver, imprimir o guardar en PDF. */
(function () {
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-recibo]');
    if (!b) return;
    ev.preventDefault();
    var w = window.open('', '_blank');
    if (!w) { alert('El navegador bloqueó la ventana: permití las ventanas emergentes para ver el comprobante.'); return; }
    w.document.write('<p style="font-family:sans-serif;padding:20px">Preparando el comprobante…</p>');
    api('recibo', token, b.dataset.recibo)
      .then(function (r) { w.document.open(); w.document.write(r.html); w.document.close(); })
      .catch(function (e) { w.close(); alert((e && e.message) || 'No se pudo abrir el comprobante.'); });
  });
})();
