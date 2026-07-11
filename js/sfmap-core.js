/* ============================================================
   sfmap-core.js — 2D/3D 共通のデータ構築 & 詳細パネル生成
   window.SFMAPCore として公開
   ============================================================ */
window.SFMAPCore = (function () {
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
  // 製品・資格・概念・職種はすべて「トピックを束ねるグループ(包含)」として扱う
  var TOPIC_EDGE = {
    product: { kind: 'contains', len: 92, strength: 0.16 },
    cert:    { kind: 'covers',   len: 116, strength: 0.12 },
    concept: { kind: 'category', len: 128, strength: 0.11 },
    role:    { kind: 'role',     len: 138, strength: 0.09 }
  };

  function buildGraph() {
    var anchors = window.SFMAP_ANCHORS || [];
    var topics = window.SFMAP_TOPICS || [];
    var nodes = [], byId = {};
    anchors.forEach(function (a) {
      var n = { id: a.id, label: a.label, type: a.type, category: a.category,
        summary: a.summary, detail: a.detail, tags: a.tags || [],
        links: a.links || [], anchor: true, color: TYPE_META[a.type].color, deg: 0 };
      nodes.push(n); byId[n.id] = n;
    });
    topics.forEach(function (t) {
      var n = { id: t.id, label: t.label, type: 'topic', category: t.category, level: t.level,
        summary: t.summary, detail: t.detail, tags: t.tags || [],
        prereq: t.prereq || [], anchorRefs: t.anchors || [], anchor: false,
        color: TYPE_META.topic.color, deg: 0 };
      nodes.push(n); byId[n.id] = n;
    });

    var links = [];
    function addLink(sId, tId, kind, len, strength, rel) {
      var s = byId[sId], t = byId[tId];
      if (!s || !t) return;
      links.push({ source: s, target: t, kind: kind, len: len, strength: strength, rel: rel || null });
      s.deg++; t.deg++;
    }
    anchors.forEach(function (a) {
      (a.links || []).forEach(function (l) { addLink(a.id, l.to, 'anchor', 120, 0.10, l.rel); });
    });
    topics.forEach(function (t) {
      (t.anchors || []).forEach(function (aid) {
        var target = byId[aid]; if (!target) return;
        var cfg = TOPIC_EDGE[target.type] || TOPIC_EDGE.role;
        addLink(aid, t.id, cfg.kind, cfg.len, cfg.strength);
      });
      (t.prereq || []).forEach(function (pid) { addLink(pid, t.id, 'prereq', 98, 0.20); });
    });

    // ---- 重大性(機能量・優先度) → node weight (0..1) ----
    // breadth   : いくつのグループ(製品/資格/概念/職種)にまたがるか = 機能量
    // foundational: 何個のトピックがこれを前提にするか = 学習優先度(土台ほど重大)
    // content   : 詳細ボリューム = 機能量
    var prereqOut = {};
    links.forEach(function (l) { if (l.kind === 'prereq') prereqOut[l.source.id] = (prereqOut[l.source.id] || 0) + 1; });
    var maxScore = 1;
    nodes.forEach(function (n) {
      if (n.anchor) { n.importance = 0; return; }
      var breadth = (n.anchorRefs || []).length;
      var foundational = prereqOut[n.id] || 0;
      var content = (n.detail || '').length;
      var lvlW = n.level === 'advanced' ? 1.12 : (n.level === 'intermediate' ? 1.05 : 1.0);
      n.importance = (1 + breadth * 0.9 + foundational * 1.3 + Math.min(content / 850, 3)) * lvlW;
      if (n.importance > maxScore) maxScore = n.importance;
    });
    nodes.forEach(function (n) { n.weight = n.anchor ? 1 : Math.min(1, n.importance / maxScore); });

    var adj = {};
    nodes.forEach(function (n) { adj[n.id] = []; });
    links.forEach(function (l) {
      adj[l.source.id].push({ other: l.target, kind: l.kind, dir: 'out' });
      adj[l.target.id].push({ other: l.source, kind: l.kind, dir: 'in' });
    });
    function neighborSet(id) {
      var s = {}; s[id] = 1;
      (adj[id] || []).forEach(function (e) { s[e.other.id] = 1; });
      return s;
    }
    return { nodes: nodes, links: links, byId: byId, adj: adj, neighborSet: neighborSet };
  }

  /* ---------- panel HTML ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function inlineMd(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>'); }
  function mdToHtml(md) {
    var lines = (md || '').split('\n'), html = '', inList = false, para = [];
    function fp() { if (para.length) { html += '<p>' + inlineMd(para.join(' ')) + '</p>'; para = []; } }
    function fl() { if (inList) { html += '</ul>'; inList = false; } }
    lines.forEach(function (raw) {
      var line = raw.replace(/\s+$/, '');
      if (/^###\s+/.test(line)) { fp(); fl(); html += '<h3>' + inlineMd(line.replace(/^###\s+/, '')) + '</h3>'; }
      else if (/^##\s+/.test(line)) { fp(); fl(); html += '<h2>' + inlineMd(line.replace(/^##\s+/, '')) + '</h2>'; }
      else if (/^[-*]\s+/.test(line)) { fp(); if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + inlineMd(line.replace(/^[-*]\s+/, '')) + '</li>'; }
      else if (/^\d+\.\s+/.test(line)) { fp(); if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + inlineMd(line.replace(/^\d+\.\s+/, '')) + '</li>'; }
      else if (line.trim() === '') { fp(); fl(); }
      else { para.push(line.trim()); }
    });
    fp(); fl(); return html;
  }
  function hexA(hex, a) {
    var h = hex.replace('#', '');
    return 'rgba(' + parseInt(h.substr(0, 2), 16) + ',' + parseInt(h.substr(2, 2), 16) + ',' + parseInt(h.substr(4, 2), 16) + ',' + a + ')';
  }
  var CAT_LABELS = {
    'data': 'データ', 'security': 'セキュリティ', 'automation': '自動化', 'declarative-ui': 'UI(宣言的)',
    'reporting': 'レポート', 'data-management': 'データ管理', 'deployment': 'リリース', 'governance': 'ガバナンス',
    'apex': 'Apex', 'lwc': 'LWC', 'aura': 'Aura/VF', 'integration': '統合', 'devops': 'DevOps', 'testing': 'テスト',
    'sales': 'Sales', 'service': 'Service', 'field-service': 'Field Service', 'revenue': 'Revenue/CPQ', 'crm-foundation': 'CRM基盤',
    'marketing': 'マーケティング', 'experience': 'Experience', 'commerce': 'Commerce', 'data-cloud': 'Data Cloud',
    'ai': 'AI', 'analytics': '分析', 'architecture': 'アーキテクチャ', 'integration-arch': '統合設計',
    'security-arch': 'セキュリティ設計', 'career': 'キャリア', 'platform': 'プラットフォーム', 'cloud': 'クラウド',
    'role': '職種', 'cert': '資格', 'concept': '概念', 'collaboration': 'コラボ', 'mobile': 'モバイル',
    'identity': 'ID/認証', 'industry': '業種', 'omnistudio': 'OmniStudio', 'productivity': '生産性'
  };
  function catLabel(c) { return CAT_LABELS[c] || c; }

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
    return 't_' + o.type;
  }
  function buildRelated(n, adj) {
    var edges = adj[n.id] || [], groups = {}, seen = {};
    edges.forEach(function (e) {
      var key = relKey(n, e), sk = key + ':' + e.other.id;
      if (seen[sk]) return; seen[sk] = 1;
      (groups[key] || (groups[key] = [])).push(e.other);
    });
    var out = '<div class="p-rel">', any = false;
    REL_ORDER.forEach(function (key) {
      var items = groups[key]; if (!items || !items.length) return; any = true;
      items.sort(function (a, b) { return b.deg - a.deg; });
      out += '<div class="p-rel-group"><div class="p-rel-title">' + REL_TITLE[key] + ' <span style="opacity:.5">(' + items.length + ')</span></div><div class="rel-chips">';
      items.forEach(function (o) {
        out += '<button class="rel-chip" data-id="' + o.id + '"><span class="rc-dot" style="background:' + TYPE_META[o.type].color + '"></span><span class="rc-label">' + esc(o.label) + '</span></button>';
      });
      out += '</div></div>';
    });
    out += '</div>'; return any ? out : '';
  }
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
      out += '<a class="ref-chip" href="' + r.url + '" target="_blank" rel="noopener noreferrer"><span class="ref-site">' + esc(r.site) + '</span><span class="rc-label">' + esc(r.label) + '</span><span class="ref-ext">↗</span></a>';
    });
    out += '</div></div>'; return out;
  }

  function panelHTML(n, adj) {
    var m = TYPE_META[n.type], html = '';
    html += '<div class="p-badges">';
    html += '<span class="p-badge" style="background:' + hexA(m.color, 0.16) + ';color:' + m.color + '"><span class="bd" style="background:' + m.color + '"></span>' + m.label + '</span>';
    if (n.level) html += '<span class="p-badge lvl"><span class="bd" style="background:' + LEVEL_META[n.level].color + '"></span>' + LEVEL_META[n.level].label + '</span>';
    if (n.category) html += '<span class="p-badge lvl">' + esc(catLabel(n.category)) + '</span>';
    html += '</div>';
    html += '<div class="p-title">' + esc(n.label) + '</div>';
    if (n.summary) html += '<div class="p-summary">' + esc(n.summary) + '</div>';
    html += '<div class="p-body">' + mdToHtml(n.detail || '') + '</div>';
    html += buildRefs(n);
    html += buildRelated(n, adj);
    return html;
  }

  return {
    TYPE_META: TYPE_META, TYPE_ORDER: TYPE_ORDER, LEVEL_META: LEVEL_META,
    buildGraph: buildGraph, panelHTML: panelHTML, esc: esc, catLabel: catLabel, hexA: hexA
  };
})();
