/* ============================================================
   TSP.MMIII — Widget de notícias
   Puxa o feed.json (hospedado no GitHub Pages) e renderiza as
   notícias agrupadas por tema. Estilo editorial escuro com
   destaque dourado, combinando com o site.

   Uso:
     <div data-tsp-noticias
          data-feed="https://SEU_USUARIO.github.io/SEU_REPO/feed.json"
          data-topic="geopolitica"   (opcional: filtra um tema)
          data-limit="5">            (opcional: itens por tema)
     </div>
     <script src="https://SEU_USUARIO.github.io/SEU_REPO/widget/noticias.js" defer></script>
   ============================================================ */
(function (global) {
  'use strict';

  var CSS = [
    '.tspn{--tspn-bg:#0e0d0b;--tspn-card:#171512;--tspn-line:#26221b;--tspn-ink:#ece7db;',
    '--tspn-muted:#9a917f;--tspn-accent:#c9a15a;--tspn-font:"Georgia","Times New Roman",serif;',
    'box-sizing:border-box;font-family:var(--tspn-font);color:var(--tspn-ink);line-height:1.5;}',
    '.tspn *{box-sizing:border-box;}',
    '.tspn{width:100%;max-width:960px;margin:0 auto;padding:8px 0;}',
    '.tspn__head{display:flex;align-items:baseline;gap:12px;margin:0 0 20px;padding-bottom:12px;border-bottom:1px solid var(--tspn-line);}',
    '.tspn__head h3{margin:0;font-size:1.35rem;letter-spacing:.01em;font-weight:600;}',
    '.tspn__head span{color:var(--tspn-muted);font-size:.8rem;font-style:italic;}',
    '.tspn__section{margin:0 0 26px;}',
    '.tspn__section-title{font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--tspn-accent);margin:0 0 10px;font-weight:600;}',
    '.tspn__item{display:block;padding:12px 14px;margin:0 0 8px;border:1px solid var(--tspn-line);border-radius:8px;background:var(--tspn-card);text-decoration:none;color:inherit;transition:border-color .15s ease,transform .15s ease;}',
    '.tspn__item:hover{border-color:var(--tspn-accent);}',
    '.tspn__item-title{font-size:1.02rem;font-weight:600;color:var(--tspn-ink);margin:0 0 5px;}',
    '.tspn__item:hover .tspn__item-title{color:var(--tspn-accent);}',
    '.tspn__item-meta{font-size:.78rem;color:var(--tspn-muted);}',
    '.tspn__item-meta b{color:var(--tspn-ink);font-weight:600;}',
    '.tspn__item-summary{font-size:.86rem;color:var(--tspn-muted);margin-top:5px;}',
    '.tspn__loading,.tspn__error{padding:20px;text-align:center;color:var(--tspn-muted);font-style:italic;border:1px dashed var(--tspn-line);border-radius:8px;}',
    '.tspn__more{font-size:.8rem;text-align:center;margin-top:8px;}',
    '.tspn__more a{color:var(--tspn-accent);text-decoration:none;}',
    '.tspn--light{--tspn-bg:#faf7f0;--tspn-card:#ffffff;--tspn-line:#e4dccb;--tspn-ink:#221d14;--tspn-muted:#7a7264;--tspn-accent:#9a6f1e;}'
  ].join('');

  var TOPIC_LABELS = {
    historia: 'História',
    geopolitica: 'Geopolítica',
    negocios: 'Negócios & Economia',
    filosofia: 'Filosofia',
    cinema: 'Cinema',
    medicina: 'Medicina',
  };

  function timeAgo(iso) {
    if (!iso) return '';
    var d = Date.parse(iso);
    if (isNaN(d)) return '';
    var diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60) return 'agora';
    if (diff < 3600) return Math.floor(diff / 60) + ' min';
    if (diff < 86400) return Math.floor(diff / 3600) + ' h';
    if (diff < 172800) return 'ontem';
    return Math.floor(diff / 86400) + ' dias';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderItem(it) {
    var meta = [it.source ? '<b>' + esc(it.source) + '</b>' : '', timeAgo(it.publishedAt)]
      .filter(Boolean).join(' · ');
    var sum = it.summary ? '<div class="tspn__item-summary">' + esc(it.summary) + '</div>' : '';
    return (
      '<a class="tspn__item" href="' + esc(it.link) + '" target="_blank" rel="noopener noreferrer">' +
        '<div class="tspn__item-title">' + esc(it.title) + '</div>' +
        '<div class="tspn__item-meta">' + meta + '</div>' + sum +
      '</a>'
    );
  }

  function render(el, data, opts) {
    var topics = data.topics || [];
    var byTopic = data.byTopic || {};
    var html = '';

    var groups = opts.topic
      ? topics.filter(function (t) { return t.id === opts.topic; })
      : topics;

    if (!groups.length) {
      html = '<div class="tspn__error">Nenhum tema encontrado.</div>';
    } else {
      groups.forEach(function (t) {
        var list = (byTopic[t.id] || []).slice(0, opts.limit);
        if (!list.length) return;
        html += '<section class="tspn__section">';
        html += '<h4 class="tspn__section-title">' + esc(TOPIC_LABELS[t.id] || t.label) + '</h4>';
        html += list.map(renderItem).join('');
        html += '</section>';
      });
      if (!html.trim()) {
        html = '<div class="tspn__error">Sem notícias no momento.</div>';
      }
    }

    var stamp = data.generatedAt ? '<span>atualizado ' + timeAgo(data.generatedAt) + '</span>' : '';
    el.innerHTML =
      '<div class="tspn__head"><h3>Notícias</h3>' + stamp + '</div>' + html;
  }

  function load(el, opts) {
    el.classList.add('tspn--loading');
    el.innerHTML = '<div class="tspn__loading">Carregando notícias…</div>';
    fetch(opts.feed, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        el.classList.remove('tspn--loading');
        render(el, data, opts);
      })
      .catch(function () {
        el.classList.remove('tspn--loading');
        el.innerHTML =
          '<div class="tspn__error">Não foi possível carregar as notícias agora.<br>Tente novamente em instantes.</div>';
      });
  }

  function mount(el) {
    var opts = {
      feed: el.getAttribute('data-feed') || 'feed.json',
      topic: el.getAttribute('data-topic') || null,
      limit: parseInt(el.getAttribute('data-limit') || '5', 10),
      light: el.hasAttribute('data-theme-light'),
    };
    if (opts.light) el.classList.add('tspn--light');
    el.classList.add('tspn');
    load(el, opts);
  }

  function init() {
    if (!document.getElementById('tspn-style')) {
      var style = document.createElement('style');
      style.id = 'tspn-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    var nodes = document.querySelectorAll('[data-tsp-noticias]');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  global.TSPNoticias = { mount: mount, init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
