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

/* Voce "Versione" dentro Impostazioni della versione classica (aggiunta da Bibo Tune 0.1.44, non fa parte della 0.1.27).
   L'interfaccia classica è compilata e non conosce l'opzione: la sezione si inserisce da qui, quando compare la pagina Impostazioni. */
(function () {
  var ID = 'bibo-version-section';
  var css = '#' + ID + ' .bv-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px}'
    + '#' + ID + ' .bv-opt{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:6px;padding:16px;border:1px solid var(--glass-border);border-radius:var(--radius-lg);background:var(--glass-bg);color:var(--color-text);min-width:0}'
    + '#' + ID + ' .bv-opt:hover{background:var(--color-surface-raised)}#' + ID + ' .bv-opt.on{border-color:var(--color-accent);background:var(--color-surface-raised)}'
    + '#' + ID + ' .bv-opt:focus-visible{outline:2px solid var(--color-accent-cyan);outline-offset:2px}'
    + '#' + ID + ' .bv-opt b{font-weight:600}#' + ID + ' .bv-opt small{color:var(--color-text-muted);font-size:14px;line-height:20px}'
    + '#' + ID + ' .bv-pt{color:var(--color-text-muted);font-size:14px;line-height:21px;padding-left:14px;position:relative}#' + ID + ' .bv-pt::before{content:"\\2022";position:absolute;left:2px}'
    + '#' + ID + ' .bv-act{margin-top:16px}#' + ID + ' .btn[disabled]{opacity:.5;cursor:not-allowed}'
    + '@media (max-width:700px){#' + ID + ' .bv-grid{grid-template-columns:1fr}}';
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function build(recentLabel) {
    var sec = el('section', 'reminder tight'); sec.id = ID; sec.setAttribute('aria-label', 'Versione');
    sec.appendChild(el('h2', 'h2s', 'Versione'));
    sec.appendChild(el('p', 'sub', "Scegli come appare l'app. I tuoi dati e le funzioni di pulizia sono gli stessi in entrambe."));
    var grid = el('div', 'bv-grid'); grid.setAttribute('role', 'radiogroup'); grid.setAttribute('aria-label', 'Versione');
    var defs = [['recent', recentLabel, "L'interfaccia di adesso.", ['Barra con i nomi accanto alle icone', 'Benvenuto e riepilogo a riquadri', 'Caos e Mappa del disco']],
                ['classic', 'Classica · 0.1.27', "Com'era prima del rifacimento.", ['Barra a sole icone', 'Panoramica con le tre schede', 'Elenchi con le caselle, File grandi e Duplicati a parte']]];
    var pick = 'classic', apply = el('button', 'btn primary', 'Applica e riapri'); apply.type = 'button'; apply.disabled = true;
    var btns = defs.map(function (d) {
      var b = el('button', 'bv-opt' + (d[0] === pick ? ' on' : '')); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(d[0] === pick));
      b.appendChild(el('b', '', d[1])); b.appendChild(el('small', '', d[2])); d[3].forEach(function (t) { b.appendChild(el('span', 'bv-pt', t)); });
      b.addEventListener('click', function () { pick = d[0]; btns.forEach(function (x, i) { var on = defs[i][0] === pick; x.className = 'bv-opt' + (on ? ' on' : ''); x.setAttribute('aria-checked', String(on)); }); apply.disabled = pick === 'classic'; });
      grid.appendChild(b); return b;
    });
    sec.appendChild(grid);
    sec.appendChild(el('p', 'sub bv-act', 'Cambiando versione la finestra si riapre. Per tornare qui: pulsante “‹ Versione recente” in alto, voce nel menu dell’icona, oppure Ctrl + Maiusc + V.'));
    apply.addEventListener('click', function () { if (pick === 'recent') back(); });
    sec.appendChild(apply);
    return sec;
  }
  function ensure() {
    var h = Array.prototype.find.call(document.querySelectorAll('h2.h2s.sect'), function (x) { return x.textContent.trim() === 'Impostazioni'; });
    if (!h || document.getElementById(ID)) return;
    if (!document.getElementById('bibo-version-style')) { var st = document.createElement('style'); st.id = 'bibo-version-style'; st.textContent = css; document.head.appendChild(st); }
    var sec = build('Recente'); h.parentNode.insertBefore(sec, h.nextSibling);
    if (window.bibo && window.bibo.getUiVersion) window.bibo.getUiVersion().then(function (r) { var b = sec.querySelector('.bv-opt b'); if (b && r && r.current) b.textContent = 'Recente · ' + r.current; }).catch(function () {});
  }
  function back() {
    if (window.bibo && window.bibo.setUiVersion) window.bibo.setUiVersion('recent').catch(function () {});
    else location.assign('../');
  }
  new MutationObserver(ensure).observe(document.body, { childList: true, subtree: true });
  ensure();
})();
