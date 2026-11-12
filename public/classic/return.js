/* Aggiunto da Bibo Tune 0.1.41, non fa parte della 0.1.27: un modo di tornare alla versione recente da dentro la finestra.
   Nell'app Windows chiede al processo principale di cambiare interfaccia; nel browser (dove non c'è l'app) apre la pagina principale.
   Nel browser vale anche Ctrl+Maiusc+V; nell'app lo gestisce già il processo principale. */
(function () {
  function back() {
    if (window.bibo && window.bibo.setUiVersion) window.bibo.setUiVersion('recent').catch(function () {});
    else location.assign('../');
  }
  var b = document.createElement('button');
  b.type = 'button'; b.id = 'bibo-back-to-recent'; b.textContent = '‹ Versione recente';
  b.title = 'Torna alla versione recente (Ctrl+Maiusc+V)'; b.setAttribute('aria-label', 'Torna alla versione recente');
  b.style.cssText = 'position:fixed;top:7px;left:92px;z-index:50;height:26px;padding:0 12px;border-radius:13px;border:1px solid rgba(255,255,255,.28);background:rgba(16,36,48,.88);color:#e8f4f4;font:600 12px system-ui,sans-serif;cursor:pointer;-webkit-app-region:no-drag';
  b.addEventListener('click', back);
  document.body.appendChild(b);
  if (!window.bibo) addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey && String(e.key).toLowerCase() === 'v') { e.preventDefault(); back(); }
  });
})();
