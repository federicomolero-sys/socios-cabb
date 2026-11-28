/* Comisión CABB — Ordena la pestaña "Más" en grupos coherentes.
 * Se carga al final: toma las tarjetas que agregaron los demás archivos y las acomoda bajo títulos.
 * Cada tarjeta se reconoce por su id o por el título (primer h3 o summary).
 */
(function () {
  var mas = document.getElementById('vMas'); if (!mas) return;

  var GRUPOS = [
    { t: '💳 Cuotas y cobranza', d: 'Valores, vencimientos, generación de cuotas y deudas', r: [/^Cuotas$/, /Categorías y cuotas/, /Vencimiento, recargos/, /Cuota de ingreso/, /Recordatorios/, /Morosidad/, /Comprobantes de pago/] },
    { t: '👥 Socios', d: 'Grupos, descuentos, sanciones y reglas del Estatuto', r: [/Gestión de socios/, /Grupos y descuentos/, /Estatuto: licencias/] },
    { t: '♟️ Actividades', d: 'Clases, profesores y beneficios', r: [/^Clases$/, /Beneficios en locales/] },
    { t: '💰 Tesorería y reportes', d: 'Ingresos, gastos y balances', r: [/Caja de tesorería/, /^Reportes$/] },
    { t: '🗳️ Asamblea y documentos', d: 'Padrón, estatuto y ficha de inscripción', r: [/Padrón de socios/, /Documentos del Círculo/, /Ficha de inscripción/] },
    { t: '📣 Comunicación', d: 'Avisos a los celulares y saludos', r: [/Notificación a los celulares/, /Saludo de cumpleaños/] },
    { t: '🔐 Cuenta y seguridad', d: 'Tu clave, actividad del panel y copias', r: [/Cambiar mi clave/, /Actividad reciente/, /Copias de seguridad/] }
  ];

  var css = document.createElement('style');
  css.textContent = '.mg-tit{margin:22px 4px 8px;font-size:15px;font-weight:700;color:var(--verde,#1f3d2b);letter-spacing:.2px}' +
    '.mg-tit small{display:block;font-weight:400;color:var(--gris);font-size:12.5px;letter-spacing:0;margin-top:1px}' +
    '#vMas > h2 + .mg-tit{margin-top:6px}';
  document.head.appendChild(css);

  function titulo(card) {
    var h = card.querySelector('summary, h3');
    return h ? h.textContent.replace(/^[^A-Za-zÁÉÍÓÚÑáéíóúñ¿¡]+/, '').trim() : '';
  }

  function ordenar() {
    var cards = Array.prototype.filter.call(mas.children, function (x) { return x.classList && x.classList.contains('card'); });
    if (!cards.length) return;
    mas.querySelectorAll('.mg-tit').forEach(function (x) { x.remove(); });
    var asignadas = [], salir = document.getElementById('bSalir');
    var cajas = GRUPOS.map(function () { return []; }), otros = [];
    cards.forEach(function (c) {
      var t = titulo(c), gi = -1, ri = 0;
      GRUPOS.some(function (g, i) { return g.r.some(function (re, j) { if (re.test(t)) { gi = i; ri = j; return true; } return false; }); });
      if (gi < 0) otros.push(c); else cajas[gi].push({ c: c, o: ri });
      asignadas.push(c);
    });
    var frag = document.createDocumentFragment();
    function cabecera(t, d) { var h = document.createElement('div'); h.className = 'mg-tit'; h.innerHTML = t + (d ? '<small>' + d + '</small>' : ''); frag.appendChild(h); }
    GRUPOS.forEach(function (g, i) {
      if (!cajas[i].length) return;
      cabecera(g.t, g.d);
      cajas[i].sort(function (a, b) { return a.o - b.o; }).forEach(function (x) { frag.appendChild(x.c); });
    });
    if (otros.length) { cabecera('Otros', ''); otros.forEach(function (c) { frag.appendChild(c); }); }
    if (salir && salir.parentNode === mas) mas.insertBefore(frag, salir); else mas.appendChild(frag);
  }

  // Los demás archivos ya agregaron sus tarjetas; se ordena una vez cargada la página
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ordenar); else ordenar();
  window.ordenarMas = ordenar;
})();
