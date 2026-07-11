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

    // links (spring)
    for (i = 0; i < links.length; i++) {
      var l = links[i];
      a = l._s; b = l._t;
      if (!a || !b) continue;
      dx = b.x - a.x; dy = b.y - a.y;
      dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      var target = l.len || 90;
      force = (dist - target) / dist * alpha * (l.strength || 0.22);
      var lx = dx * force, ly = dy * force;
      a.vx += lx; a.vy += ly;
      b.vx -= lx; b.vy -= ly;
    }

    // centering gravity
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      a.vx += (-a.x) * alpha * 0.019;
      a.vy += (-a.y) * alpha * 0.019;
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

    // ---- links ----
    ctx.lineWidth = 1 / s;
    for (var i = 0; i < this.links.length; i++) {
      var l = this.links[i], a = l._s, b = l._t;
      if (!a || !b) continue;
      if (!this._isVisible(a) || !this._isVisible(b)) continue;
      var lit = hasHL && (hl.has(a.id) && hl.has(b.id));
      if (hasHL && !lit) {
        ctx.globalAlpha = 0.04;
        ctx.strokeStyle = '#8a93a5';
      } else if (lit) {
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = b.color;
      } else {
        ctx.globalAlpha = 0.14;
        ctx.strokeStyle = '#7f8aa0';
      }
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ---- nodes ----
    for (var k = 0; k < this.nodes.length; k++) {
      var n = this.nodes[k];
      if (!this._isVisible(n)) continue;
      var dim = hasHL && !hl.has(n.id);
      var isHover = n === this.hoverNode;
      var isSel = n.id === this.selectedId;
      var r = n.r;

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

      // labels — declutter: hubs first, details on zoom / hover / highlight
      var showLabel = false;
      var th = n.anchor ? (n.type === 'cert' ? 0.9 : 0.46) : 1.25;
      if (s > th) showLabel = true;
      if (isHover || isSel || (hasHL && hl.has(n.id))) showLabel = true;
      if (dim && s <= 1.35) showLabel = false;

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

  var FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif';
  var LABEL = 'rgba(231,236,243,0.92)';
  var HALO = 'rgba(8,10,15,0.85)';
  ForceGraph.setThemeColors = function (label, halo) { LABEL = label; HALO = halo; };

  global.ForceGraph = ForceGraph;
})(window);
