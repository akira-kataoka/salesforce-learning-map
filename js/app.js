/* ============================================================
   app.js — データ結合・UI配線・詳細パネル
   ============================================================ */
(function () {
  'use strict';

  var TYPE_META = {
    product: { color: '#2dd4bf', label: '製品' },
    role:    { color: '#fbbf24', label: '職種' },
    cert:    { color: '#c084fc', label: '認定資格' },
    concept: { color: '#f472b6', label: '概念' },
    topic:   { color: '#60a5fa', label: 'トピック' }
  };
  var TYPE_ORDER = ['role', 'cert', 'product', 'concept', 'topic'];
  var LEVEL_META = {
    beginner: { label: '入門', color: '#7dd3fc' },
    intermediate: { label: '中級', color: '#fbbf24' },
    advanced: { label: '上級', color: '#fb7185' }
  };

  /* ---------- build nodes ---------- */
  var anchors = window.SFMAP_ANCHORS || [];
  var topics = window.SFMAP_TOPICS || [];
  var nodes = [];
  var byId = {};

  anchors.forEach(function (a) {
    var n = {
      id: a.id, label: a.label, type: a.type, category: a.category,
      summary: a.summary, detail: a.detail, tags: a.tags || [],
      links: a.links || [], anchor: true, color: TYPE_META[a.type].color, deg: 0
    };
    nodes.push(n); byId[n.id] = n;
  });
  topics.forEach(function (t) {
    var n = {
      id: t.id, label: t.label, type: 'topic', category: t.category, level: t.level,
      summary: t.summary, detail: t.detail, tags: t.tags || [],
      prereq: t.prereq || [], anchorRefs: t.anchors || [], anchor: false,
      color: TYPE_META.topic.color, deg: 0
    };
    nodes.push(n); byId[n.id] = n;
  });

  /* ---------- build links ---------- */
  // リンク種別で「包含関係」を表現する:
  //  contains  : 製品 ⊃ トピック（製品がその機能・トピックを含む）
  //  covers    : 資格 ⊃ トピック（資格がそのトピックを出題範囲としてカバー/グルーピング）
  //  category  : 概念 — トピック（カテゴリ分類）
  //  role      : 職種 — トピック（関連）
  //  prereq    : トピック → トピック（学習の前提・順序）
  //  anchor    : 製品/職種/資格/概念どうしの関係（推奨資格・基盤 等）
  var links = [];
  function addLink(sId, tId, kind, len, strength, rel) {
    var s = byId[sId], t = byId[tId];
    if (!s || !t) return;
    links.push({ _s: s, _t: t, kind: kind, len: len, strength: strength, rel: rel || null });
    s.deg++; t.deg++;
  }
  // anchor <-> anchor（グループ同士の関係）
  anchors.forEach(function (a) {
    (a.links || []).forEach(function (l) { addLink(a.id, l.to, 'anchor', 120, 0.10, l.rel); });
  });
  // topic <- anchor（包含・グルーピング）と topic → topic（前提）
  // 製品・資格・概念・職種はすべて「トピックを束ねるグループ(包含)」として扱う
  var TOPIC_EDGE = {
    product: { kind: 'contains', len: 92, strength: 0.16 },
    cert:    { kind: 'covers',   len: 116, strength: 0.12 },
    concept: { kind: 'category', len: 128, strength: 0.11 },
    role:    { kind: 'role',     len: 138, strength: 0.09 }
  };
  topics.forEach(function (t) {
    (t.anchors || []).forEach(function (aid) {
      var target = byId[aid];
      if (!target) return;
      var cfg = TOPIC_EDGE[target.type] || TOPIC_EDGE.role;
      addLink(aid, t.id, cfg.kind, cfg.len, cfg.strength); // 方向: グループ → トピック
    });
    (t.prereq || []).forEach(function (pid) { addLink(pid, t.id, 'prereq', 98, 0.20); });
  });

  /* ---------- radii by degree ---------- */
  nodes.forEach(function (n) {
    var base = { concept: 13, product: 12.5, role: 12, cert: 8.5, topic: 5.2 }[n.type];
    n.r = base + Math.min(6, Math.sqrt(n.deg) * (n.anchor ? 1.4 : 0.9));
  });

  /* ---------- adjacency for panel ---------- */
  var adj = {}; // id -> array of {other, kind, dir}
  nodes.forEach(function (n) { adj[n.id] = []; });
  links.forEach(function (l) {
    adj[l._s.id].push({ other: l._t, kind: l.kind, dir: 'out' });
    adj[l._t.id].push({ other: l._s, kind: l.kind, dir: 'in' });
  });
  function neighborSet(id) {
    var s = new Set([id]);
    (adj[id] || []).forEach(function (e) { s.add(e.other.id); });
    return s;
  }

  /* ============================================================
     GRAPH
     ============================================================ */
  var canvas = document.getElementById('graph');
  var tooltip = document.getElementById('tooltip');
  var graph = new ForceGraph(canvas, {
    nodes: nodes, links: links,
    onHover: handleHover,
    onSelect: function (n) { selectNode(n.id, true); },
    onBackground: function () { deselect(); }
  });
  // keep the whole graph framed while the layout expands & settles,
  // until the user takes over.
  var refitCount = 0;
  var refitTimer = setInterval(function () {
    if (graph._userInteracted || selectedId) { clearInterval(refitTimer); return; }
    graph.fit(80);
    if (++refitCount > 16) clearInterval(refitTimer);
  }, 450);

  var selectedId = null;

  function handleHover(n, p) {
    if (n) {
      var m = TYPE_META[n.type];
      var lvl = n.level ? ' · ' + LEVEL_META[n.level].label : '';
      tooltip.innerHTML =
        '<div class="tt-type" style="color:' + m.color + '">' + m.label + lvl + '</div>' +
        '<div class="tt-label">' + esc(n.label) + '</div>' +
        (n.summary ? '<div class="tt-sum">' + esc(n.summary) + '</div>' : '');
      tooltip.classList.remove('hidden');
      var tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
      var x = p.x + 16, y = p.y + 16;
      if (x + tw > window.innerWidth - 10) x = p.x - tw - 16;
      if (y + th > window.innerHeight - 10) y = p.y - th - 16;
      tooltip.style.left = x + 'px'; tooltip.style.top = y + 'px';
      if (!selectedId) graph.setHighlight(neighborSet(n.id));
    } else {
      tooltip.classList.add('hidden');
      if (!selectedId) graph.setHighlight(null);
    }
  }

  /* ============================================================
     SELECTION + PANEL
     ============================================================ */
  var panel = document.getElementById('panel');
  var panelContent = document.getElementById('panel-content');

  function selectNode(id, doFocus) {
    var n = byId[id];
    if (!n) return;
    selectedId = id;
    graph.setSelected(id);
    graph.setHighlight(neighborSet(id));
    if (doFocus) graph.focus(id, Math.max(graph.scale, 1.05));
    renderPanel(n);
    panel.classList.remove('hidden');
  }
  function deselect() {
    selectedId = null;
    graph.setSelected(null);
    graph.setHighlight(null);
    panel.classList.add('hidden');
  }

  function renderPanel(n) {
    var m = TYPE_META[n.type];
    var html = '';
    html += '<div class="p-badges">';
    html += '<span class="p-badge" style="background:' + hexA(m.color, 0.16) + ';color:' + m.color + '"><span class="bd" style="background:' + m.color + '"></span>' + m.label + '</span>';
    if (n.level) html += '<span class="p-badge lvl"><span class="bd" style="background:' + LEVEL_META[n.level].color + '"></span>' + LEVEL_META[n.level].label + '</span>';
    if (n.category) html += '<span class="p-badge lvl">' + esc(catLabel(n.category)) + '</span>';
    html += '</div>';
    html += '<div class="p-title">' + esc(n.label) + '</div>';
    if (n.summary) html += '<div class="p-summary">' + esc(n.summary) + '</div>';
    html += '<div class="p-body">' + mdToHtml(n.detail || '') + '</div>';
    html += buildRefs(n);
    html += buildRelated(n);
    panelContent.innerHTML = html;
    panel.scrollTop = 0;
    // wire relation chips
    panelContent.querySelectorAll('.rel-chip').forEach(function (el) {
      el.addEventListener('click', function () { selectNode(el.getAttribute('data-id'), true); });
    });
  }

  // 関連ノードを「包含関係」を明示したグループに整理して表示
  var ANCHOR_TITLE = { role: '関連する職種', cert: '関連する認定資格', product: '関連する製品', concept: '関連する概念', topic: '関連するトピック' };
  var REL_ORDER = ['inprod', 'incert', 'pin', 'pout', 'ctopics', 'covtopics', 'cattopics', 'roletopics', 't_role', 't_cert', 't_product', 't_concept', 'incat', 'inrole'];
  var REL_TITLE = {
    inprod: '所属する製品グループ', incert: '所属する資格グループ',
    incat: '所属する概念グループ', inrole: '所属する職種グループ',
    pin: '前提となる項目', pout: 'この後に学べる項目',
    ctopics: '含まれる機能・トピック', covtopics: 'この資格に含まれるトピック',
    cattopics: 'この概念グループに含まれるトピック', roletopics: 'この職種グループに含まれるトピック',
    t_role: '対象の職種', t_cert: '推奨・関連する資格', t_product: '関連する製品', t_concept: '関連する概念'
  };
  function relKey(node, e) {
    var o = e.other, k = e.kind;
    if (k === 'prereq') return e.dir === 'in' ? 'pin' : 'pout';
    if (k === 'contains') return node.type === 'product' ? 'ctopics' : 'inprod';
    if (k === 'covers') return node.type === 'cert' ? 'covtopics' : 'incert';
    if (k === 'category') return node.type === 'concept' ? 'cattopics' : 'incat';
    if (k === 'role') return node.type === 'role' ? 'roletopics' : 'inrole';
    return 't_' + o.type; // anchor-anchor
  }
  function buildRelated(n) {
    var edges = adj[n.id] || [];
    var groups = {}, seen = {};
    edges.forEach(function (e) {
      var o = e.other;
      var key = relKey(n, e);
      var sk = key + ':' + o.id;
      if (seen[sk]) return; seen[sk] = 1;
      (groups[key] || (groups[key] = [])).push(o);
    });
    var out = '<div class="p-rel">', any = false;
    REL_ORDER.forEach(function (key) {
      var items = groups[key];
      if (!items || !items.length) return;
      any = true;
      items.sort(function (a, b) { return b.deg - a.deg; });
      out += '<div class="p-rel-group"><div class="p-rel-title">' + REL_TITLE[key] +
        ' <span style="opacity:.5">(' + items.length + ')</span></div><div class="rel-chips">';
      items.forEach(function (o) {
        out += '<button class="rel-chip" data-id="' + o.id + '"><span class="rc-dot" style="background:' +
          TYPE_META[o.type].color + '"></span><span class="rc-label">' + esc(o.label) + '</span></button>';
      });
      out += '</div></div>';
    });
    out += '</div>';
    return any ? out : '';
  }

  /* ---------- 参考ページ(外部リンク) ---------- */
  var DEV_CATS = { apex: 1, lwc: 1, aura: 1, integration: 1, devops: 1, testing: 1, programmatic: 1, 'integration-arch': 1, 'security-arch': 1 };
  function refsFor(n) {
    var term = n.label.replace(/[（(].*?[)）]/g, '').replace(/\s*\/\s*/g, ' ').trim() || n.label;
    var q = encodeURIComponent(term);
    var refs = [
      { site: 'Trailhead', label: 'Trailheadで学ぶ', url: 'https://trailhead.salesforce.com/ja/search?keywords=' + q },
      { site: 'ヘルプ', label: '公式ヘルプを検索', url: 'https://help.salesforce.com/s/search-result?language=ja&searchQuery=' + q }
    ];
    if (DEV_CATS[n.category]) refs.push({ site: '開発者', label: '開発者ドキュメント', url: 'https://developer.salesforce.com/search?q=' + q });
    if (n.type === 'cert') refs.push({ site: '資格', label: '認定資格カタログ', url: 'https://trailhead.salesforce.com/ja/credentials/' });
    return refs;
  }
  function buildRefs(n) {
    var refs = refsFor(n);
    var out = '<div class="p-rel p-refs"><div class="p-rel-title">📚 参考ページ</div><div class="ref-chips">';
    refs.forEach(function (r) {
      out += '<a class="ref-chip" href="' + r.url + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="ref-site">' + esc(r.site) + '</span><span class="rc-label">' + esc(r.label) + '</span>' +
        '<span class="ref-ext">↗</span></a>';
    });
    out += '</div></div>';
    return out;
  }

  document.getElementById('panel-close').addEventListener('click', deselect);

  /* ============================================================
     LEGEND + FILTERS
     ============================================================ */
  var typeEnabled = { product: true, role: true, cert: true, concept: true, topic: true };
  var levelEnabled = { beginner: true, intermediate: true, advanced: true };
  var anchorsOnly = false;

  function applyVisibility() {
    graph.setVisible(function (n) {
      if (!typeEnabled[n.type]) return false;
      if (anchorsOnly && !n.anchor) return false;
      if (n.type === 'topic' && n.level && !levelEnabled[n.level]) return false;
      return true;
    });
    updateStats();
  }

  // build type chips
  var counts = {};
  nodes.forEach(function (n) { counts[n.type] = (counts[n.type] || 0) + 1; });
  var legendTypes = document.getElementById('legend-types');
  TYPE_ORDER.forEach(function (t) {
    var m = TYPE_META[t];
    var b = document.createElement('button');
    b.className = 'type-chip';
    b.innerHTML = '<span class="dot" style="background:' + m.color + ';color:' + m.color + '"></span>' +
      '<span>' + m.label + '</span><span class="count">' + (counts[t] || 0) + '</span>';
    b.addEventListener('click', function () {
      typeEnabled[t] = !typeEnabled[t];
      b.classList.toggle('off', !typeEnabled[t]);
      applyVisibility();
    });
    legendTypes.appendChild(b);
  });
  // level chips
  document.querySelectorAll('.lvl-chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var lv = b.getAttribute('data-level');
      levelEnabled[lv] = !levelEnabled[lv];
      b.classList.toggle('off', !levelEnabled[lv]);
      applyVisibility();
    });
  });

  function updateStats() {
    var vn = nodes.filter(function (n) {
      if (!typeEnabled[n.type]) return false;
      if (anchorsOnly && !n.anchor) return false;
      if (n.type === 'topic' && n.level && !levelEnabled[n.level]) return false;
      return true;
    }).length;
    document.getElementById('stats').textContent = vn + ' / ' + nodes.length + ' ノード · ' + links.length + ' リンク';
  }
  updateStats();

  /* ============================================================
     SEARCH
     ============================================================ */
  var search = document.getElementById('search');
  var searchWrap = search.closest('.search-wrap');
  var searchClear = document.getElementById('search-clear');
  search.addEventListener('input', function () {
    var q = search.value.trim().toLowerCase();
    searchWrap.classList.toggle('has-text', q.length > 0);
    if (!q) { if (!selectedId) graph.setHighlight(null); return; }
    var matches = nodes.filter(function (n) {
      return n.label.toLowerCase().indexOf(q) >= 0 ||
        (n.summary && n.summary.toLowerCase().indexOf(q) >= 0) ||
        (n.tags && n.tags.join(' ').toLowerCase().indexOf(q) >= 0);
    });
    var set = new Set(matches.map(function (n) { return n.id; }));
    graph.setHighlight(set.size ? set : new Set(['__none__']));
    if (matches.length === 1) { graph.focus(matches[0].id, Math.max(graph.scale, 1.1)); }
    else if (matches.length > 1) { fitToSet(matches); }
  });
  search.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var q = search.value.trim().toLowerCase();
      var m = nodes.filter(function (n) { return n.label.toLowerCase().indexOf(q) >= 0; });
      if (m.length) selectNode(m[0].id, true);
    }
  });
  searchClear.addEventListener('click', function () {
    search.value = ''; searchWrap.classList.remove('has-text');
    if (!selectedId) graph.setHighlight(null);
    search.focus();
  });

  function fitToSet(list) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    list.forEach(function (n) {
      if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    });
    if (!isFinite(minX)) return;
    var pad = 120;
    var w = (maxX - minX) || 1, h = (maxY - minY) || 1;
    var s = Math.max(0.2, Math.min(1.6, Math.min((graph.W - pad * 2) / w, (graph.H - pad * 2) / h)));
    graph.scale = s;
    graph.tx = graph.W / 2 - ((minX + maxX) / 2) * s;
    graph.ty = graph.H / 2 - ((minY + maxY) / 2) * s;
  }

  /* ============================================================
     TOP ACTIONS
     ============================================================ */
  document.getElementById('btn-reset').addEventListener('click', function () {
    deselect();
    search.value = ''; searchWrap.classList.remove('has-text');
    typeEnabled = { product: true, role: true, cert: true, concept: true, topic: true };
    levelEnabled = { beginner: true, intermediate: true, advanced: true };
    anchorsOnly = false;
    document.querySelectorAll('.type-chip,.lvl-chip').forEach(function (b) { b.classList.remove('off'); });
    document.getElementById('btn-focus').classList.remove('active');
    applyVisibility();
    graph.fit(80);
  });

  var btnFocus = document.getElementById('btn-focus');
  btnFocus.addEventListener('click', function () {
    anchorsOnly = !anchorsOnly;
    btnFocus.classList.toggle('active', anchorsOnly);
    btnFocus.textContent = anchorsOnly ? '全体表示' : '学習パス';
    applyVisibility();
    setTimeout(function () { graph.fit(90); }, 60);
  });

  // zoom controls
  document.querySelectorAll('#zoom-controls button').forEach(function (b) {
    b.addEventListener('click', function () {
      var z = b.getAttribute('data-zoom');
      if (z === 'in') graph.zoomBy(1.3);
      else if (z === 'out') graph.zoomBy(1 / 1.3);
      else graph.fit(80);
    });
  });

  /* ============================================================
     THEME
     ============================================================ */
  var root = document.documentElement;
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('sfmap-theme', t); } catch (e) {}
    if (t === 'light') ForceGraph.setThemeColors('rgba(26,34,51,0.96)', 'rgba(255,255,255,0.88)');
    else ForceGraph.setThemeColors('rgba(231,236,243,0.92)', 'rgba(8,10,15,0.85)');
  }
  var saved = 'dark';
  try { saved = localStorage.getItem('sfmap-theme') || 'dark'; } catch (e) {}
  setTheme(saved);
  document.getElementById('btn-theme').addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });

  /* ============================================================
     HELP MODAL
     ============================================================ */
  var helpModal = document.getElementById('help-modal');
  document.getElementById('btn-help').addEventListener('click', function () { helpModal.classList.remove('hidden'); });
  document.getElementById('help-close').addEventListener('click', function () { helpModal.classList.add('hidden'); });
  helpModal.addEventListener('click', function (e) { if (e.target === helpModal) helpModal.classList.add('hidden'); });
  var ep = document.getElementById('help-entrypoints');
  ['role-admin', 'role-developer', 'role-consultant', 'role-marketer', 'role-architect', 'concept-ai'].forEach(function (id) {
    var n = byId[id]; if (!n) return;
    var c = TYPE_META[n.type].color;
    var b = document.createElement('button');
    b.className = 'rel-chip';
    b.innerHTML = '<span class="rc-dot" style="background:' + c + '"></span><span class="rc-label">' + esc(n.label) + '</span>';
    b.addEventListener('click', function () { helpModal.classList.add('hidden'); selectNode(id, true); });
    ep.appendChild(b);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { helpModal.classList.add('hidden'); if (selectedId) deselect(); }
    if (e.key === '/' && document.activeElement !== search) { e.preventDefault(); search.focus(); }
  });

  // show help on first visit
  try {
    if (!localStorage.getItem('sfmap-seen')) { helpModal.classList.remove('hidden'); localStorage.setItem('sfmap-seen', '1'); }
  } catch (e) {}

  /* ============================================================
     HELPERS
     ============================================================ */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function inlineMd(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
  }
  function mdToHtml(md) {
    var lines = md.split('\n');
    var html = '', inList = false, para = [];
    function flushPara() { if (para.length) { html += '<p>' + inlineMd(para.join(' ')) + '</p>'; para = []; } }
    function flushList() { if (inList) { html += '</ul>'; inList = false; } }
    lines.forEach(function (raw) {
      var line = raw.replace(/\s+$/, '');
      if (/^###\s+/.test(line)) { flushPara(); flushList(); html += '<h3>' + inlineMd(line.replace(/^###\s+/, '')) + '</h3>'; }
      else if (/^##\s+/.test(line)) { flushPara(); flushList(); html += '<h2>' + inlineMd(line.replace(/^##\s+/, '')) + '</h2>'; }
      else if (/^[-*]\s+/.test(line)) { flushPara(); if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + inlineMd(line.replace(/^[-*]\s+/, '')) + '</li>'; }
      else if (/^\d+\.\s+/.test(line)) { flushPara(); if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + inlineMd(line.replace(/^\d+\.\s+/, '')) + '</li>'; }
      else if (line.trim() === '') { flushPara(); flushList(); }
      else { para.push(line.trim()); }
    });
    flushPara(); flushList();
    return html;
  }
  function hexA(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  var CAT_LABELS = {
    'data': 'データ', 'security': 'セキュリティ', 'automation': '自動化', 'declarative-ui': 'UI(宣言的)',
    'reporting': 'レポート', 'data-management': 'データ管理', 'deployment': 'リリース', 'governance': 'ガバナンス',
    'apex': 'Apex', 'lwc': 'LWC', 'aura': 'Aura/VF', 'integration': '統合', 'devops': 'DevOps', 'testing': 'テスト',
    'sales': 'Sales', 'service': 'Service', 'field-service': 'Field Service', 'revenue': 'Revenue/CPQ', 'crm-foundation': 'CRM基盤',
    'marketing': 'マーケティング', 'experience': 'Experience', 'commerce': 'Commerce', 'data-cloud': 'Data Cloud',
    'ai': 'AI', 'analytics': '分析', 'architecture': 'アーキテクチャ', 'integration-arch': '統合設計',
    'security-arch': 'セキュリティ設計', 'career': 'キャリア', 'platform': 'プラットフォーム', 'cloud': 'クラウド',
    'role': '職種', 'cert': '資格', 'concept': '概念', 'collaboration': 'コラボ', 'mobile': 'モバイル'
  };
  function catLabel(c) { return CAT_LABELS[c] || c; }
})();
