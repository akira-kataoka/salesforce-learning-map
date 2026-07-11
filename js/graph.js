/* ============================================================
   ForceGraph — Canvas製フォースシミュレーション(Obsidian風)
   依存なし。pan / zoom / drag / hover / highlight 対応。
   ============================================================ */
(function (global) {
  'use strict';

  function ForceGraph(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = opts.nodes;
    this.links = opts.links;
    this.nodeById = {};
    this.nodes.forEach(function (n) { this.nodeById[n.id] = n; }, this);

    // callbacks
    this.onHover = opts.onHover || function () {};
    this.onSelect = opts.onSelect || function () {};
    this.onBackground = opts.onBackground || function () {};

    // view transform
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;

    // interaction state
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.hoverNode = null;
    this.dragNode = null;
    this.panning = false;
    this.dragMoved = false;
    this.last = { x: 0, y: 0 };
    this.downPt = { x: 0, y: 0 };

    // highlight
    this.highlight = null;         // Set of node ids, or null
    this.selectedId = null;
    this.visiblePredicate = null;  // fn(node)->bool
    this.groupMode = false;        // グループ化(包含クラスタ)表示
    this.groupCenters = [];        // グループ中心ノードの配列

    // physics
    this.alpha = 1;
    this.alphaDecay = 0.018;
    this.alphaMin = 0.0025;
    this.velDecay = 0.62;
    this.running = true;

    this._seed();
    this._bind();
    this.resize();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  ForceGraph.prototype._seed = function () {
    var n = this.nodes.length;
    this.nodes.forEach(function (d, i) {
      var a = (i / n) * Math.PI * 2;
      var rad = 60 + (i % 40) * 14;
      if (d.x === undefined) d.x = Math.cos(a) * rad + (Math.random() - 0.5) * 40;
      if (d.y === undefined) d.y = Math.sin(a) * rad + (Math.random() - 0.5) * 40;
      d.vx = 0; d.vy = 0;
    });
  };

  ForceGraph.prototype.resize = function () {
    var r = this.canvas.getBoundingClientRect();
    this.W = r.width; this.H = r.height;
    this.canvas.width = r.width * this.dpr;
    this.canvas.height = r.height * this.dpr;
    if (!this._centered) { this.tx = this.W / 2; this.ty = this.H / 2; this._centered = true; }
    this.reheat(0.3);
  };

  ForceGraph.prototype.reheat = function (a) {
    this.alpha = Math.max(this.alpha, a === undefined ? 0.6 : a);
    this.running = true;
  };

  /* ---------- physics ---------- */
  ForceGraph.prototype._physics = function () {
    var nodes = this.nodes, links = this.links, alpha = this.alpha;
    var i, j, a, b, dx, dy, dist, force;

    // charge (repulsion) — O(n^2), fine for a few hundred nodes
    var K = 7200;          // repulsion constant
    var MAXF = 220;        // per-pair force cap (prevents explosions)
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = b.x - a.x; dy = b.y - a.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = (Math.random() - 0.5) || 0.1; dy = (Math.random() - 0.5) || 0.1; d2 = dx * dx + dy * dy; }
        if (d2 > 250000) continue; // ignore far pairs
        dist = Math.sqrt(d2);
        force = (K / d2) * alpha;
        if (force > MAXF) force = MAXF;
        var fx = (dx / dist) * force, fy = (dy / dist) * force;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // links (spring). グループ化中は「所属グループへの包含リンク」だけを強く働かせてクラスタを作る
    var gm = this.groupMode;
    for (i = 0; i < links.length; i++) {
      var l = links[i];
      a = l._s; b = l._t;
      if (!a || !b) continue;
      var target = l.len || 90, str = l.strength || 0.22;
      if (gm) {
        if (GROUP_KINDS[l.kind]) {
          if (b.group === a.id) { target = 46; str = 0.6; }   // 主グループ=強い包含
          else continue;                                       // 副グループ=レイアウトに影響させない(線は薄く描画)
        } else if (l.kind === 'prereq') { str = 0.06; }
        else { str = 0.04; }                                   // anchor同士は弱く
      }
      dx = b.x - a.x; dy = b.y - a.y;
      dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      force = (dist - target) / dist * alpha * str;
      var lx = dx * force, ly = dy * force;
      a.vx += lx; a.vy += ly;
      b.vx -= lx; b.vy -= ly;
    }

    if (gm) {
      // グループ中心をリング上の定位置へ、未所属ノードは弱く中央へ
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (a.isGroupCenter) { a.vx += (a.slotX - a.x) * alpha * 0.09; a.vy += (a.slotY - a.y) * alpha * 0.09; }
        else if (!a.group) { a.vx += (-a.x) * alpha * 0.004; a.vy += (-a.y) * alpha * 0.004; }
      }
    } else {
      // centering gravity
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.vx += (-a.x) * alpha * 0.019;
        a.vy += (-a.y) * alpha * 0.019;
      }
    }

    // collision (soft, based on radius)
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = b.x - a.x; dy = b.y - a.y;
        var min = a.r + b.r + 4;
        var dd = dx * dx + dy * dy;
        if (dd < min * min && dd > 0) {
          dist = Math.sqrt(dd);
          var push = (min - dist) / dist * 0.5;
          var px = dx * push, py = dy * push;
          a.x -= px; a.y -= py; b.x += px; b.y += py;
        }
      }
    }

    // integrate (with velocity clamp + NaN guard)
    var VMAX = 40;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      if (a === this.dragNode) { a.vx = 0; a.vy = 0; continue; }
      a.vx *= this.velDecay; a.vy *= this.velDecay;
      if (a.vx > VMAX) a.vx = VMAX; else if (a.vx < -VMAX) a.vx = -VMAX;
      if (a.vy > VMAX) a.vy = VMAX; else if (a.vy < -VMAX) a.vy = -VMAX;
      a.x += a.vx; a.y += a.vy;
      if (!isFinite(a.x) || !isFinite(a.y)) {
        a.x = (Math.random() - 0.5) * 200; a.y = (Math.random() - 0.5) * 200; a.vx = 0; a.vy = 0;
      }
    }

    this.alpha += (0 - this.alpha) * this.alphaDecay;
    if (this.alpha < this.alphaMin) {
      this.alpha = 0; this.running = false;
      if (!this._didAutoFit && !this._userInteracted) { this._didAutoFit = true; this.fit(80); }
    }
  };

  /* ---------- coordinate helpers ---------- */
  ForceGraph.prototype.toScreen = function (x, y) {
    return { x: x * this.scale + this.tx, y: y * this.scale + this.ty };
  };
  ForceGraph.prototype.toWorld = function (sx, sy) {
    return { x: (sx - this.tx) / this.scale, y: (sy - this.ty) / this.scale };
  };

  /* ---------- rendering ---------- */
  ForceGraph.prototype._loop = function () {
    if (this.running || this.dragNode) this._physics();
    this._draw();
    requestAnimationFrame(this._loop);
  };

  ForceGraph.prototype._drawHulls = function (s) {
    var ctx = this.ctx, PAD = 24, i, k;
    for (var g = 0; g < this.groupCenters.length; g++) {
      var c = this.groupCenters[g];
      if (!c || !this._isVisible(c)) continue;
      var pts = [];
      for (i = 0; i < this.nodes.length; i++) {
        var n = this.nodes[i];
        if (n.group === c.id && this._isVisible(n)) pts.push([n.x, n.y]);
      }
      pts.push([c.x, c.y]);
      var hue = c.groupHue || 0;
      var fill = 'hsla(' + hue + ',65%,58%,0.09)';
      var stroke = 'hsla(' + hue + ',70%,63%,0.30)';
      ctx.lineWidth = 1.4 / s; ctx.strokeStyle = stroke; ctx.fillStyle = fill;
      if (pts.length <= 2) {
        var cx = 0, cy = 0; for (i = 0; i < pts.length; i++) { cx += pts[i][0]; cy += pts[i][1]; }
        cx /= pts.length; cy /= pts.length;
        ctx.beginPath(); ctx.arc(cx, cy, PAD + 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        continue;
      }
      var hull = convexHull(pts);
      var mx = 0, my = 0; for (i = 0; i < hull.length; i++) { mx += hull[i][0]; my += hull[i][1]; }
      mx /= hull.length; my /= hull.length;
      var ex = [];
      for (i = 0; i < hull.length; i++) {
        var ddx = hull[i][0] - mx, ddy = hull[i][1] - my, dd = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
        ex.push([hull[i][0] + ddx / dd * PAD, hull[i][1] + ddy / dd * PAD]);
      }
      var nn = ex.length;
      ctx.beginPath();
      ctx.moveTo((ex[nn - 1][0] + ex[0][0]) / 2, (ex[nn - 1][1] + ex[0][1]) / 2);
      for (k = 0; k < nn; k++) {
        var cur = ex[k], nxt = ex[(k + 1) % nn];
        ctx.quadraticCurveTo(cur[0], cur[1], (cur[0] + nxt[0]) / 2, (cur[1] + nxt[1]) / 2);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  };

  ForceGraph.prototype._isVisible = function (n) {
    return this.visiblePredicate ? this.visiblePredicate(n) : true;
  };

  ForceGraph.prototype._draw = function () {
    var ctx = this.ctx, s = this.scale;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.save();
    ctx.translate(this.tx, this.ty);
    ctx.scale(s, s);

    var hl = this.highlight;
    var hasHL = !!hl;

    if (this.groupMode) this._drawHulls(s);

    // ---- links (種別で描き分け: 包含=グループ色の実線 / 前提=矢印付き破線 / 関連=淡色) ----
    for (var i = 0; i < this.links.length; i++) {
      var l = this.links[i], a = l._s, b = l._t;
      if (!a || !b) continue;
      if (!this._isVisible(a) || !this._isVisible(b)) continue;
      if (this.groupMode && GROUP_KINDS[l.kind] && b.group !== a.id) continue; // 副グループ線は描かない
      var st = KIND[l.kind] || KIND.anchor;
      var lit = hasHL && hl.has(a.id) && hl.has(b.id);
      var col, al, w;
      if (hasHL && !lit) { col = '#8a93a5'; al = 0.03; w = st.w; }
      else if (lit) { col = (l.kind === 'prereq') ? '#f6b545' : a.color; al = (st.a < 0.12 ? 0.42 : 0.55); w = st.w + 0.4; }
      else { col = st.col || a.color; al = st.a; w = st.w; }
      ctx.globalAlpha = al;
      ctx.strokeStyle = col;
      ctx.lineWidth = w / s;
      if (st.dash) ctx.setLineDash([5 / s, 4 / s]); else ctx.setLineDash(EMPTY_DASH);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (st.arrow && s > 0.5 && (!hasHL || lit)) drawArrow(ctx, a, b, col, Math.min(0.7, al * 1.6), s);
    }
    ctx.setLineDash(EMPTY_DASH);
    ctx.globalAlpha = 1;

    // ---- starfield glow (加算合成でノードをやわらかく発光させる) ----
    ctx.globalCompositeOperation = 'lighter';
    for (var gk = 0; gk < this.nodes.length; gk++) {
      var gn = this.nodes[gk];
      if (!this._isVisible(gn)) continue;
      if (hasHL && !hl.has(gn.id)) continue;
      var grr = Math.max(gn.r, 1.4 / s) * 2.0 + 1.4 / s;
      ctx.globalAlpha = gn.anchor ? 0.13 : 0.085;
      ctx.fillStyle = gn.color;
      ctx.beginPath(); ctx.arc(gn.x, gn.y, grr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // ---- nodes ----
    for (var k = 0; k < this.nodes.length; k++) {
      var n = this.nodes[k];
      if (!this._isVisible(n)) continue;
      var dim = hasHL && !hl.has(n.id);
      var isHover = n === this.hoverNode;
      var isSel = n.id === this.selectedId;
      var r = Math.max(n.r, 1.4 / s); // ズームアウト時も星として見えるよう最小サイズを確保

      ctx.globalAlpha = dim ? 0.22 : 1;

      // glow for anchors / hover / selected
      if (!dim && (n.anchor || isHover || isSel)) {
        ctx.shadowColor = n.color;
        ctx.shadowBlur = (isHover || isSel ? 22 : 12);
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // ring
      if (isSel || isHover) {
        ctx.lineWidth = (isSel ? 2.4 : 1.8) / s;
        ctx.strokeStyle = isSel ? '#ffffff' : n.color;
        ctx.globalAlpha = dim ? 0.3 : 0.95;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 3.5 / s + 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // labels — 星空セマンティックズーム: ズームするほど細かいトピックが順に見える
      var showLabel = false;
      if (n.anchor) {
        if (s > (n.type === 'cert' ? 0.85 : 0.42)) showLabel = true;
      } else {
        // 重要度(degree)が高いトピックから段階的にラベルを出す
        var tth = n.deg >= 7 ? 0.85 : (n.deg >= 4 ? 1.25 : (n.deg >= 2 ? 1.75 : 2.3));
        if (s > tth) showLabel = true;
      }
      if (isHover || isSel || (hasHL && hl.has(n.id))) showLabel = true;
      if (dim && s <= 1.4) showLabel = false;

      if (showLabel) {
        var fs = (n.anchor ? 12 : 10.5) / s;
        ctx.font = (n.anchor ? '700 ' : '500 ') + fs + 'px ' + FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        var ly = n.y + r + 3 / s;
        var txt = n.label;
        ctx.globalAlpha = dim ? 0.3 : 1;
        // halo
        ctx.lineWidth = 3 / s;
        ctx.strokeStyle = HALO;
        ctx.lineJoin = 'round';
        ctx.strokeText(txt, n.x, ly);
        ctx.fillStyle = (isHover || isSel) ? n.color : LABEL;
        ctx.fillText(txt, n.x, ly);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  };

  /* ---------- picking ---------- */
  ForceGraph.prototype._pick = function (sx, sy) {
    var w = this.toWorld(sx, sy);
    var best = null, bestD = Infinity;
    for (var i = this.nodes.length - 1; i >= 0; i--) {
      var n = this.nodes[i];
      if (!this._isVisible(n)) continue;
      var dx = n.x - w.x, dy = n.y - w.y;
      var d = dx * dx + dy * dy;
      var rr = (n.r + 6 / this.scale);
      if (d < rr * rr && d < bestD) { best = n; bestD = d; }
    }
    return best;
  };

  /* ---------- events ---------- */
  ForceGraph.prototype._bind = function () {
    var self = this, c = this.canvas;
    window.addEventListener('resize', function () { self.resize(); });

    function pos(e) {
      var r = c.getBoundingClientRect();
      var t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }

    function down(e) {
      var p = pos(e);
      self._userInteracted = true;
      self.downPt = p; self.last = p; self.dragMoved = false;
      var hit = self._pick(p.x, p.y);
      if (hit) {
        self.dragNode = hit; hit.fx = true;
        c.classList.add('grabbing');
      } else {
        self.panning = true;
        c.classList.add('grabbing');
      }
    }
    function move(e) {
      var p = pos(e);
      if (self.dragNode) {
        var w = self.toWorld(p.x, p.y);
        self.dragNode.x = w.x; self.dragNode.y = w.y;
        self.reheat(0.4);
        if (Math.abs(p.x - self.downPt.x) + Math.abs(p.y - self.downPt.y) > 3) self.dragMoved = true;
      } else if (self.panning) {
        self.tx += p.x - self.last.x;
        self.ty += p.y - self.last.y;
        self.last = p;
        if (Math.abs(p.x - self.downPt.x) + Math.abs(p.y - self.downPt.y) > 3) self.dragMoved = true;
      } else {
        var hit = self._pick(p.x, p.y);
        if (hit !== self.hoverNode) {
          self.hoverNode = hit;
          self.onHover(hit, p);
          c.style.cursor = hit ? 'pointer' : 'grab';
        } else if (hit) {
          self.onHover(hit, p); // keep tooltip following
        }
      }
    }
    function up() {
      if (self.dragNode) {
        if (!self.dragMoved) { self.onSelect(self.dragNode); }
        self.dragNode.fx = false;
        self.dragNode = null;
      } else if (self.panning) {
        if (!self.dragMoved) self.onBackground();
      }
      self.panning = false;
      c.classList.remove('grabbing');
    }

    c.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    c.addEventListener('mouseleave', function () { self.hoverNode = null; self.onHover(null); });

    c.addEventListener('touchstart', function (e) { down(e); }, { passive: true });
    c.addEventListener('touchmove', function (e) { move(e); e.preventDefault(); }, { passive: false });
    c.addEventListener('touchend', up);

    c.addEventListener('wheel', function (e) {
      e.preventDefault();
      var p = pos(e);
      var factor = Math.pow(1.0015, -e.deltaY);
      self.zoomAt(p.x, p.y, factor);
    }, { passive: false });
  };

  ForceGraph.prototype.zoomAt = function (sx, sy, factor) {
    this._userInteracted = true;
    var newScale = Math.max(0.15, Math.min(4, this.scale * factor));
    var w = this.toWorld(sx, sy);
    this.scale = newScale;
    this.tx = sx - w.x * this.scale;
    this.ty = sy - w.y * this.scale;
  };
  ForceGraph.prototype.zoomBy = function (factor) {
    this.zoomAt(this.W / 2, this.H / 2, factor);
  };

  /* ---------- public API ---------- */
  ForceGraph.prototype.setHighlight = function (set) { this.highlight = set; };
  ForceGraph.prototype.setSelected = function (id) { this.selectedId = id; };
  ForceGraph.prototype.setVisible = function (fn) { this.visiblePredicate = fn; this.reheat(0.2); };
  ForceGraph.prototype.setGrouping = function (on, centers) {
    this.groupMode = !!on; this.groupCenters = centers || [];
    this._userInteracted = false; this._didAutoFit = false; this.reheat(1);
  };

  ForceGraph.prototype.fit = function (pad) {
    pad = pad || 70;
    var vis = this.nodes.filter(this._isVisible, this);
    if (!vis.length) return;
    function pct(arr, p) { return arr[Math.max(0, Math.min(arr.length - 1, Math.round((arr.length - 1) * p)))]; }
    // robust center = median (unaffected by asymmetric outliers)
    var xs = vis.map(function (n) { return n.x; }).sort(function (a, b) { return a - b; });
    var ys = vis.map(function (n) { return n.y; }).sort(function (a, b) { return a - b; });
    var cx = pct(xs, 0.5), cy = pct(ys, 0.5);
    // radius covering ~92% of nodes around the core
    var dists = vis.map(function (n) { var dx = n.x - cx, dy = n.y - cy; return Math.sqrt(dx * dx + dy * dy); })
      .sort(function (a, b) { return a - b; });
    var R = pct(dists, vis.length > 14 ? 0.92 : 1) || 1;
    var span = R * 2 + 60;
    var s = Math.min((this.W - pad * 2) / span, (this.H - pad * 2) / span);
    s = Math.max(0.18, Math.min(2.0, s));
    this.scale = s;
    this.tx = this.W / 2 - cx * s;
    this.ty = this.H / 2 - cy * s;
  };

  ForceGraph.prototype.focus = function (id, targetScale) {
    var n = this.nodeById[id];
    if (!n) return;
    var s = targetScale || Math.max(this.scale, 1.15);
    this.scale = s;
    this.tx = this.W / 2 - n.x * s;
    this.ty = this.H / 2 - n.y * s;
  };

  // link kind → visual style. col:null = use source(group) node color
  // 製品/資格/概念/職種→トピックは、いずれもグループ色で描く「包含」リンク
  var KIND = {
    contains: { a: 0.19, w: 1.5, dash: false, col: null, arrow: false },
    covers:   { a: 0.13, w: 1.1, dash: false, col: null, arrow: false },
    category: { a: 0.11, w: 1.0, dash: false, col: null, arrow: false },
    role:     { a: 0.10, w: 1.0, dash: false, col: null, arrow: false },
    prereq:   { a: 0.15, w: 1.3, dash: true,  col: '#c9954a', arrow: true },
    anchor:   { a: 0.16, w: 1.2, dash: false, col: null, arrow: false }
  };
  var EMPTY_DASH = [];
  var GROUP_KINDS = { contains: 1, covers: 1, category: 1, role: 1 };

  // Andrew's monotone chain convex hull
  function convexHull(pts) {
    if (pts.length < 3) return pts.slice();
    pts = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cross(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lo = [], up = [], i, p;
    for (i = 0; i < pts.length; i++) { p = pts[i]; while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (i = pts.length - 1; i >= 0; i--) { p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    lo.pop(); up.pop(); return lo.concat(up);
  }

  function drawArrow(ctx, a, b, col, al, s) {
    var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / d, uy = dy / d;
    var tipX = b.x - ux * (b.r + 2.5 / s), tipY = b.y - uy * (b.r + 2.5 / s);
    var size = 6 / s, ang = Math.atan2(uy, ux);
    ctx.setLineDash(EMPTY_DASH);
    ctx.globalAlpha = al;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - size * Math.cos(ang - 0.42), tipY - size * Math.sin(ang - 0.42));
    ctx.lineTo(tipX - size * Math.cos(ang + 0.42), tipY - size * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();
  }

  var FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif';
  var LABEL = 'rgba(231,236,243,0.92)';
  var HALO = 'rgba(8,10,15,0.85)';
  ForceGraph.setThemeColors = function (label, halo) { LABEL = label; HALO = halo; };

  global.ForceGraph = ForceGraph;
})(window);
