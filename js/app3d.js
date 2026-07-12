/* ============================================================
   app3d.js — Three.js による 3D ナレッジグラフ
   ============================================================ */
(function () {
  'use strict';
  var G = SFMAPCore.buildGraph();
  var nodes = G.nodes, links = G.links, byId = G.byId, adj = G.adj;
  var TYPE_META = SFMAPCore.TYPE_META, LEVEL_META = SFMAPCore.LEVEL_META;

  // 深さの色(浅い→深い)。種別色に少し混ぜて「深度」を体感させる / 習得・道の色
  var DEPTH_COLORS = [0xdff3ff, 0x9ec9ff, 0x7d8dfd, 0x7c5cf6, 0x6d28d9].map(function (h) { return new THREE.Color(h); });
  function depthColorFor(dn) {
    var t = Math.max(0, Math.min(1, dn)) * 4, i = Math.min(3, Math.floor(t)), f = t - i;
    return DEPTH_COLORS[i].clone().lerp(DEPTH_COLORS[i + 1], f);
  }
  var MASTERY = new THREE.Color(0xffd666), FRONTIER = new THREE.Color(0x4ade80), PATHCOL = new THREE.Color(0x9adcff);

  // リング(習得=金 / フロンティア=緑 の縁取り)テクスチャ
  function makeRingTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 5; g.beginPath(); g.arc(32, 32, 25, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 25, 0, Math.PI * 2); g.stroke();
    var tex = new THREE.CanvasTexture(c); tex.needsUpdate = true; return tex;
  }

  /* ---------- seed 3D positions: ハブを球面に、トピックは主ハブの近くに置いて最初からクラスタ化 ---------- */
  var N = nodes.length;
  // 主ハブ(製品優先、なければ最初のアンカー)
  var primaryHub = {};
  nodes.forEach(function (n) {
    if (n.anchor) return;
    var refs = n.anchorRefs || [], prod = null, first = null;
    for (var i = 0; i < refs.length; i++) { var a = byId[refs[i]]; if (!a) continue; if (!first) first = a.id; if (a.type === 'product') { prod = a.id; break; } }
    primaryHub[n.id] = prod || first || null;
  });
  // ハブをフィボナッチ球に配置(クラスタの核)
  var hubList = nodes.filter(function (n) { return n.anchor; });
  var HR = 620;
  hubList.forEach(function (h, i) {
    var y = 1 - (i / Math.max(1, hubList.length - 1)) * 2, rr = Math.sqrt(Math.max(0, 1 - y * y)), ph = i * 2.399963229;
    h.x = Math.cos(ph) * rr * HR; h.y = y * HR * 0.82; h.z = Math.sin(ph) * rr * HR;
  });
  nodes.forEach(function (n, i) {
    if (!n.anchor) {
      var h = primaryHub[n.id] && byId[primaryHub[n.id]];
      if (h) { n.x = h.x + (Math.random() - 0.5) * 95; n.y = h.y + (Math.random() - 0.5) * 95; n.z = h.z + (Math.random() - 0.5) * 95; }
      else { n.x = (Math.random() - 0.5) * 200; n.y = (Math.random() - 0.5) * 200; n.z = (Math.random() - 0.5) * 200; }
    }
    n.vx = n.vy = n.vz = 0;
    if (n.anchor) {
      var base = { concept: 5.4, product: 5.2, role: 5.0, cert: 3.5 }[n.type] || 5;
      n.r = base + Math.min(3.4, Math.sqrt(n.deg) * 0.75);
    } else {
      // トピックは重大度(sig)を順位で均等化した weight でサイズを大きく変える: 1.5〜9.0
      n.r = 1.5 + n.weight * 7.5;
    }
    // 反発の質量: ハブ(種別)ほど強く反発 → クラスタ同士が離れて「まとまり」が見える
    n.chg = n.anchor ? 5.5 : 1.0;
    n.col = new THREE.Color(n.color);
    // 表示色 = 種別色に「深さの色」を少し混ぜる(種別=色相 / 深さ=色味の変化)
    n.dispCol = n.anchor ? n.col.clone() : n.col.clone().lerp(depthColorFor(n.depthNorm || 0), 0.28 * (n.depthNorm || 0) + 0.06);
  });

  /* ---------- renderer / scene / camera ---------- */
  var mount = document.getElementById('scene3d');
  var W = window.innerWidth, H = window.innerHeight;
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  mount.appendChild(renderer.domElement);

  var labelRenderer = new THREE.CSS2DRenderer();
  labelRenderer.setSize(W, H);
  var labelHost = document.getElementById('labels3d');
  labelHost.appendChild(labelRenderer.domElement);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';

  var scene = new THREE.Scene();
  var DARK = { bg: 0x080a12, fog: 0.0013, bloom: 0.26, thr: 0.68 };

  var camera = new THREE.PerspectiveCamera(56, W / H, 1, 9000);
  var DIST0 = 1220;
  camera.position.set(0, 0, DIST0);

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;
  controls.minDistance = 60;
  controls.maxDistance = 3200;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;

  // やわらかなグラデーション照明(空=クール/地=ディープ)でプラスチック感のあるハイライトを避ける
  scene.add(new THREE.AmbientLight(0xffffff, 0.42));
  var hemi = new THREE.HemisphereLight(0xa6c8ff, 0x1a1230, 0.9); scene.add(hemi);
  var pl = new THREE.PointLight(0xcfe0ff, 0.22); pl.position.set(320, 420, 520); scene.add(pl);

  /* ---------- soft radial glow texture (星のにじみ・オーラに使い回す) ---------- */
  function makeGlowTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.22, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.14)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    var tex = new THREE.CanvasTexture(c); tex.needsUpdate = true; return tex;
  }
  var GLOW_TEX = makeGlowTexture();
  var RING_TEX = makeRingTexture();

  /* ---------- starfield (奥行き2層) + かすかな星雲 ---------- */
  (function () {
    function layer(count, rMin, rMax, size, col, opacity) {
      var g = new THREE.BufferGeometry(), pos = new Float32Array(count * 3);
      for (var i = 0; i < count; i++) {
        var r = rMin + Math.random() * (rMax - rMin);
        var th = Math.acos(2 * Math.random() - 1), ph = Math.random() * Math.PI * 2;
        pos[i * 3] = r * Math.sin(th) * Math.cos(ph);
        pos[i * 3 + 1] = r * Math.sin(th) * Math.sin(ph);
        pos[i * 3 + 2] = r * Math.cos(th);
      }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var m = new THREE.PointsMaterial({ color: col, size: size, map: GLOW_TEX, transparent: true, opacity: opacity, sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false });
      var pts = new THREE.Points(g, m); pts.renderOrder = -2; scene.add(pts); return pts;
    }
    layer(1300, 1500, 3000, 7, 0xaec4ea, 0.55);   // 遠くの細かい星
    layer(420, 1100, 2200, 14, 0xe7f0ff, 0.7);     // 近めの明るい星
    // 星雲(大きく淡い色の雲)
    var neb = [0x3b4da8, 0x1f6f8c, 0x6a2f7a, 0x24506b];
    for (var k = 0; k < 5; k++) {
      var mat = new THREE.SpriteMaterial({ map: GLOW_TEX, color: neb[k % neb.length], transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false });
      var sp = new THREE.Sprite(mat);
      var rr = 1300 + Math.random() * 900, th = Math.acos(2 * Math.random() - 1), ph = Math.random() * Math.PI * 2;
      sp.position.set(rr * Math.sin(th) * Math.cos(ph), rr * Math.sin(th) * Math.sin(ph), rr * Math.cos(th));
      sp.scale.setScalar(900 + Math.random() * 700); sp.renderOrder = -1;
      scene.add(sp);
    }
  })();

  /* ---------- nodes: InstancedMesh(球) + Points(グロー/リング)。1万ノードでも数ドローコール ---------- */
  var sphereGeo = new THREE.SphereGeometry(1, 16, 16);
  var sphereMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.0, roughness: 0.55, transparent: true, opacity: 0.98 });
  var spheres = new THREE.InstancedMesh(sphereGeo, sphereMat, N);
  spheres.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  spheres.frustumCulled = false;
  scene.add(spheres);
  // サイズ可変の加算ポイント(グロー/リング)用の軽量シェーダ
  function makePointMat(tex) {
    return new THREE.ShaderMaterial({
      uniforms: { map: { value: tex } },
      vertexShader: 'attribute float size; attribute vec3 acolor; varying vec3 vC; void main(){ vC=acolor; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=min(size*(900.0/max(1.0,-mv.z)),470.0); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'uniform sampler2D map; varying vec3 vC; void main(){ float a=texture2D(map,gl_PointCoord).a; if(a<0.01)discard; gl_FragColor=vec4(vC,1.0)*a; }',
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true
    });
  }
  var gGeo = new THREE.BufferGeometry();
  var gpos = new Float32Array(N * 3), gcol = new Float32Array(N * 3), gsz = new Float32Array(N);
  gGeo.setAttribute('position', new THREE.BufferAttribute(gpos, 3));
  gGeo.setAttribute('acolor', new THREE.BufferAttribute(gcol, 3));
  gGeo.setAttribute('size', new THREE.BufferAttribute(gsz, 1));
  var glowPoints = new THREE.Points(gGeo, makePointMat(GLOW_TEX)); glowPoints.frustumCulled = false; glowPoints.renderOrder = 2; scene.add(glowPoints);
  var rGeo = new THREE.BufferGeometry();
  var rpos = new Float32Array(N * 3), rcol = new Float32Array(N * 3), rsz = new Float32Array(N);
  rGeo.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
  rGeo.setAttribute('acolor', new THREE.BufferAttribute(rcol, 3));
  rGeo.setAttribute('size', new THREE.BufferAttribute(rsz, 1));
  var ringPoints = new THREE.Points(rGeo, makePointMat(RING_TEX)); ringPoints.frustumCulled = false; ringPoints.renderOrder = 3; scene.add(ringPoints);

  var labelRoot = new THREE.Group(); scene.add(labelRoot);
  nodes.forEach(function (n, i) {
    n.idx = i; n.vis = true; n.dim = false; n.scaleMul = 1;
    n.glowBase = n.anchor ? 0.5 : 0.34;
    n.glowSizeBase = n.r * (n.anchor ? 3.4 : 2.9);
    n.ringSizeBase = n.r * 3.6;
    n.sphColorEff = n.dispCol.clone();
    n.glowColor = n.dispCol.clone(); n.glowOpacity = n.glowBase;
    n.ringColor = MASTERY.clone(); n.ringOpacity = 0;
    if (n.anchor) {
      var el = document.createElement('div');
      el.className = 'node-label'; el.textContent = n.label;
      var lo = new THREE.CSS2DObject(el); lo.position.set(n.x, n.y + n.r + 4, n.z);
      labelRoot.add(lo);
      n.labelEl = el; n.labelObj = lo;
      el.style.opacity = (n.type === 'cert') ? '0' : '0.9';
    }
  });

  // 毎フレーム: ノードの位置/色/サイズを InstancedMesh と Points に反映(習得の呼吸・フロンティアの明滅も内包)
  var _m4 = new THREE.Matrix4(), _q0 = new THREE.Quaternion(), _sv = new THREE.Vector3(), _pv = new THREE.Vector3();
  function syncNodes(now) {
    var bs = 0.94 + 0.1 * Math.sin(now * 0.0016);           // 習得リングの呼吸
    var sh = 0.6 + 0.5 * (0.5 + 0.5 * Math.sin(now * 0.0025)); // フロンティアの明滅係数
    for (var i = 0; i < N; i++) {
      var n = nodes[i];
      var sc = n.vis ? n.r * n.scaleMul : 0.0001;
      _pv.set(n.x, n.y, n.z); _sv.set(sc, sc, sc); _m4.compose(_pv, _q0, _sv);
      spheres.setMatrixAt(i, _m4);
      spheres.setColorAt(i, n.sphColorEff);
      var b = i * 3;
      gpos[b] = n.x; gpos[b + 1] = n.y; gpos[b + 2] = n.z;
      var go = n.vis ? n.glowOpacity : 0;
      gsz[i] = n.vis ? n.glowSizeBase * n.scaleMul : 0;
      gcol[b] = n.glowColor.r * go; gcol[b + 1] = n.glowColor.g * go; gcol[b + 2] = n.glowColor.b * go;
      rpos[b] = n.x; rpos[b + 1] = n.y; rpos[b + 2] = n.z;
      var ro = n.vis ? n.ringOpacity : 0, rscale = 1;
      if (ro > 0.001 && n.learned) rscale = bs;
      else if (ro > 0.001 && n.frontier) ro *= sh;
      rsz[i] = ro > 0.001 ? n.ringSizeBase * rscale : 0;
      rcol[b] = n.ringColor.r * ro; rcol[b + 1] = n.ringColor.g * ro; rcol[b + 2] = n.ringColor.b * ro;
      if (n.labelObj) n.labelObj.position.set(n.x, n.y + n.r + 4, n.z);
    }
    spheres.instanceMatrix.needsUpdate = true;
    if (spheres.instanceColor) spheres.instanceColor.needsUpdate = true;
    gGeo.attributes.position.needsUpdate = true; gGeo.attributes.size.needsUpdate = true; gGeo.attributes.acolor.needsUpdate = true;
    rGeo.attributes.position.needsUpdate = true; rGeo.attributes.size.needsUpdate = true; rGeo.attributes.acolor.needsUpdate = true;
  }

  /* ---------- links ---------- */
  var GRAY = new THREE.Color(0x33405e), AMBER = new THREE.Color(0xd0a24a);
  var lpos = new Float32Array(links.length * 6);
  var lcol = new Float32Array(links.length * 6);
  // 製品/資格/概念/職種→トピックはグループ色で描く(包含)。前提=アンバー、アンカー間=グレー
  function baseLinkColor(l) {
    if (l.secondary) return new THREE.Color(0x090c15);   // 副ハブの橋は既定でほぼ不可視(選択時のみ表示)
    if (l.kind === 'contains') return l.source.col.clone().multiplyScalar(0.5);
    if (l.kind === 'covers') return l.source.col.clone().multiplyScalar(0.4);
    if (l.kind === 'category') return l.source.col.clone().multiplyScalar(0.34);
    if (l.kind === 'role') return l.source.col.clone().multiplyScalar(0.3);
    if (l.kind === 'prereq') return AMBER.clone().multiplyScalar(0.45);
    return GRAY.clone().multiplyScalar(0.28);   // ハブ同士の線は淡く(中央の交差を抑える)
  }
  links.forEach(function (l) { l.baseCol = baseLinkColor(l); });
  // 主ハブへ強く束ね、副ハブへは細い橋 → クラスタ(まとまり)を形成(primaryHub はシード時に算出済み)
  links.forEach(function (l) {
    if (l.kind === 'anchor') { l.len = 400; l.strength = 0.018; }         // 種別ハブ同士は遠く弱く(クラスタを離す)
    else if (l.kind === 'prereq') { l.len = 56; l.strength = 0.16; }      // 前提の連なりは近く
    else {                                                                 // ハブ ⊃ トピック
      if (primaryHub[l.target.id] === l.source.id) { l.len = 56; l.strength = 0.26; } // 主ハブへ強く=まとまり
      else { l.len = 240; l.strength = 0.008; l.secondary = true; }        // 副ハブへは弱く、既定では非表示
    }
  });
  // 副ハブへの橋は既定で見えないように(選択時のみ光る)。クラスタの塊がくっきり見える
  links.forEach(function (l) { l.baseCol = baseLinkColor(l); });
  var lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  lgeo.setAttribute('color', new THREE.BufferAttribute(lcol, 3));
  var lmat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  var lineSeg = new THREE.LineSegments(lgeo, lmat);
  scene.add(lineSeg);

  function writeLinkColors(hl) {
    for (var i = 0; i < links.length; i++) {
      var l = links[i], c;
      if (hl) {
        if (hl[l.source.id] && hl[l.target.id]) {
          c = (l.kind === 'prereq') ? AMBER : (l.kind === 'anchor') ? GRAY.clone().multiplyScalar(1.6) : l.source.col;
        } else { c = BLACK; }
      } else { c = l.baseCol; }
      lcol[i * 6] = c.r; lcol[i * 6 + 1] = c.g; lcol[i * 6 + 2] = c.b;
      lcol[i * 6 + 3] = c.r; lcol[i * 6 + 4] = c.g; lcol[i * 6 + 5] = c.b;
    }
    lgeo.attributes.color.needsUpdate = true;
  }
  var BLACK = new THREE.Color(0x05070b);

  function updateLinkPositions() {
    for (var i = 0; i < links.length; i++) {
      var a = links[i].source, b = links[i].target;
      lpos[i * 6] = a.x; lpos[i * 6 + 1] = a.y; lpos[i * 6 + 2] = a.z;
      lpos[i * 6 + 3] = b.x; lpos[i * 6 + 4] = b.y; lpos[i * 6 + 5] = b.z;
    }
    lgeo.attributes.position.needsUpdate = true;
    lgeo.computeBoundingSphere();
  }

  /* ---------- bloom composer ---------- */
  var composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W, H), DARK.bloom, 0.7, DARK.thr);
  composer.addPass(bloom);

  (function applyDark() {
    document.documentElement.setAttribute('data-theme', 'dark');
    scene.background = new THREE.Color(DARK.bg);
    scene.fog = new THREE.FogExp2(DARK.bg, DARK.fog);
  })();

  /* ---------- physics (3D force) ---------- */
  var alpha = 1, running = true;
  function physics() {
    var i, j, a, b, dx, dy, dz, d2, dist, f;
    var K = 620, MAXF = 190, CS = 800;
    // 空間グリッドで近傍セルのみ反発を計算(総当たり O(n²) → ほぼ O(n)。クラスタが離れているほど効く)
    var grid = {};
    for (i = 0; i < N; i++) {
      a = nodes[i];
      a._cx = Math.floor(a.x / CS); a._cy = Math.floor(a.y / CS); a._cz = Math.floor(a.z / CS);
      var key = (a._cx + 64) + (a._cy + 64) * 128 + (a._cz + 64) * 16384;
      (grid[key] || (grid[key] = [])).push(i);
    }
    for (i = 0; i < N; i++) {
      a = nodes[i];
      var bx = a._cx + 64, by = a._cy + 64, bz = a._cz + 64;
      for (var ox = -1; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) for (var oz = -1; oz <= 1; oz++) {
        var cell = grid[(bx + ox) + (by + oy) * 128 + (bz + oz) * 16384];
        if (!cell) continue;
        for (var ci = 0; ci < cell.length; ci++) {
          j = cell[ci]; if (j <= i) continue;   // 各ペアを1回だけ処理
          b = nodes[j];
          dx = b.x - a.x; dy = b.y - a.y; dz = b.z - a.z;
          d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dz = Math.random() - 0.5; d2 = dx * dx + dy * dy + dz * dz + 0.01; }
          if (d2 > 640000) continue;
          dist = Math.sqrt(d2);
          f = (K / d2) * alpha * a.chg * b.chg; if (f > MAXF) f = MAXF;
          var fx = dx / dist * f, fy = dy / dist * f, fz = dz / dist * f;
          a.vx -= fx; a.vy -= fy; a.vz -= fz;
          b.vx += fx; b.vy += fy; b.vz += fz;
        }
      }
    }
    for (i = 0; i < links.length; i++) {
      var l = links[i]; a = l.source; b = l.target;
      dx = b.x - a.x; dy = b.y - a.y; dz = b.z - a.z;
      dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;
      f = (dist - l.len) / dist * alpha * l.strength;
      a.vx += dx * f; a.vy += dy * f; a.vz += dz * f;
      b.vx -= dx * f; b.vy -= dy * f; b.vz -= dz * f;
    }
    var VMAX = 14;
    for (i = 0; i < N; i++) {
      a = nodes[i];
      a.vx += (-a.x) * alpha * 0.0009; a.vy += (-a.y) * alpha * 0.0009; a.vz += (-a.z) * alpha * 0.0009;
      a.vx *= 0.6; a.vy *= 0.6; a.vz *= 0.6;
      if (a.vx > VMAX) a.vx = VMAX; else if (a.vx < -VMAX) a.vx = -VMAX;
      if (a.vy > VMAX) a.vy = VMAX; else if (a.vy < -VMAX) a.vy = -VMAX;
      if (a.vz > VMAX) a.vz = VMAX; else if (a.vz < -VMAX) a.vz = -VMAX;
      a.x += a.vx; a.y += a.vy; a.z += a.vz;
      if (!isFinite(a.x) || !isFinite(a.y) || !isFinite(a.z)) { a.x = (Math.random() - 0.5) * 120; a.y = (Math.random() - 0.5) * 120; a.z = (Math.random() - 0.5) * 120; a.vx = a.vy = a.vz = 0; }
    }
    alpha += (0 - alpha) * 0.02;
    if (alpha < 0.004) { alpha = 0; running = false; }
  }
  function reheat(v) { alpha = Math.max(alpha, v || 0.5); running = true; }

  /* ---------- prerequisite graph (前提の連なり) ---------- */
  var preParents = {}, preChildren = {};
  nodes.forEach(function (n) { preParents[n.id] = []; preChildren[n.id] = []; });
  links.forEach(function (l) { if (l.kind === 'prereq') { preChildren[l.source.id].push(l.target.id); preParents[l.target.id].push(l.source.id); } });
  function walk(id, mapObj) {
    var seen = {}, st = [id];
    while (st.length) { var c = st.pop(); (mapObj[c] || []).forEach(function (p) { if (!seen[p]) { seen[p] = 1; st.push(p); } }); }
    return seen;
  }

  /* ---------- mastery (習得の灯) ---------- */
  var LEARN_KEY = 'sfmap-learned-3d', learned = {};
  try { (JSON.parse(localStorage.getItem(LEARN_KEY) || '[]')).forEach(function (id) { if (byId[id]) learned[id] = 1; }); } catch (e) {}
  function saveLearned() { try { localStorage.setItem(LEARN_KEY, JSON.stringify(Object.keys(learned))); } catch (e) {} }
  var topicTotal = nodes.filter(function (n) { return !n.anchor; }).length;
  function isFrontier(n) {
    if (n.anchor || learned[n.id]) return false;
    var ps = preParents[n.id]; if (!ps.length) return false;
    for (var i = 0; i < ps.length; i++) if (!learned[ps[i]]) return false;
    return true;   // 前提をすべて習得済みの「次に学べる」トピック
  }
  var MASTERY_LINK = MASTERY.clone().multiplyScalar(0.75);
  function recolorBase() {
    for (var i = 0; i < links.length; i++) {
      var l = links[i];
      l.baseCol = (learned[l.source.id] && learned[l.target.id]) ? MASTERY_LINK : baseLinkColor(l);
    }
  }
  function updateHUD(count) {
    var ring = document.getElementById('hud-ring');
    var pct = topicTotal ? count / topicTotal : 0;
    if (ring) { var C = 2 * Math.PI * 26; ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C * (1 - pct); }
    var num = document.getElementById('hud-num'); if (num) num.textContent = count;
    var den = document.getElementById('hud-den'); if (den) den.textContent = '/ ' + topicTotal + ' 習得';
  }
  function refreshStates() {
    var count = 0;
    nodes.forEach(function (n) {
      n.learned = !!learned[n.id];
      n.frontier = isFrontier(n);
      if (n.learned) count++;
      n.dim = false;
      n.sphColorEff.copy(n.dispCol);
      n.glowColor.copy(n.learned ? MASTERY : n.dispCol);
      n.glowOpacity = n.learned ? n.glowBase * 1.5 : n.glowBase;
      if (n.labelEl) n.labelEl.style.opacity = (n.type === 'cert') ? '0' : '0.9';
      if (!n.anchor && n.learned) { n.ringColor.copy(MASTERY); n.ringOpacity = 0.9; }
      else if (!n.anchor && n.frontier) { n.ringColor.copy(FRONTIER); n.ringOpacity = 0.7; }
      else n.ringOpacity = 0;
    });
    recolorBase();
    if (!selectedId) { writeLinkColors(null); curHL = null; }
    updateHUD(count);
  }

  // ラベルの間引き: カメラから遠い/選択外のラベルをフェードして中央の重なりを解消
  function updateLabels() {
    var cp = camera.position;
    for (var i = 0; i < N; i++) {
      var n = nodes[i]; if (!n.labelEl) continue;
      if (!n.vis) { n.labelEl.style.opacity = '0'; continue; }
      var dx = n.x - cp.x, dy = n.y - cp.y, dz = n.z - cp.z;
      var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var f = d < 950 ? 1 : (d > 1750 ? 0 : 1 - (d - 950) / 800);   // 近い=はっきり / 遠い=消える
      if (curHL) f *= curHL[n.id] ? 1 : 0.04;
      else if (n.type === 'cert') f = 0;                            // 資格ラベルは選択時のみ
      if (n.id === selectedId || n === hoverNode) f = 1;
      n.labelEl.style.opacity = f.toFixed(2);
    }
  }

  /* ---------- highlight / selection ---------- */
  var selectedId = null, activePath = null, curHL = null;
  function setHighlight(hl, roleMap) {
    curHL = hl;
    nodes.forEach(function (n) {
      var dim = hl && !hl[n.id];
      n.dim = dim;
      var role = roleMap && roleMap[n.id];
      if (dim) {
        n.sphColorEff.copy(n.dispCol).multiplyScalar(0.15);
        n.glowColor.copy(n.dispCol); n.glowOpacity = 0.025;
        n.ringOpacity = 0;
      } else {
        n.sphColorEff.copy(n.dispCol);
        n.glowColor.copy(role === 'anc' ? PATHCOL : role === 'desc' ? FRONTIER : (n.learned ? MASTERY : n.dispCol));
        n.glowOpacity = (n.id === selectedId) ? n.glowBase * 2.1 : (n.learned ? n.glowBase * 1.5 : n.glowBase);
        n.ringOpacity = n.learned ? 0.9 : (n.frontier ? 0.7 : 0);
      }
      if (n.labelEl) n.labelEl.style.opacity = dim ? '0.05' : (n.type === 'cert' ? '0.85' : '0.9');
    });
    writeLinkColors(hl);
  }
  function highlightFor(id) {
    var anc = walk(id, preParents), desc = walk(id, preChildren), nb = G.neighborSet(id);
    var hl = {}, roleMap = {};
    hl[id] = 1; roleMap[id] = 'sel';
    Object.keys(anc).forEach(function (k) { hl[k] = 1; roleMap[k] = 'anc'; });
    Object.keys(desc).forEach(function (k) { hl[k] = 1; if (!roleMap[k]) roleMap[k] = 'desc'; });
    Object.keys(nb).forEach(function (k) { hl[k] = 1; if (!roleMap[k]) roleMap[k] = 'nb'; });
    setHighlight(hl, roleMap);
    activePath = [];
    for (var i = 0; i < links.length; i++) { var l = links[i]; if (l.kind === 'prereq' && hl[l.source.id] && hl[l.target.id]) activePath.push(l); }
    if (!activePath.length) activePath = null;
  }

  /* ---------- panel ---------- */
  var panel = document.getElementById('panel');
  var panelContent = document.getElementById('panel-content');
  function injectPanelExtras(n) {
    if (n.anchor) return;
    var bar = document.createElement('div'); bar.className = 'p-actions';
    var on = !!learned[n.id];
    var btn = document.createElement('button');
    btn.className = 'btn-learn' + (on ? ' is-learned' : '');
    btn.textContent = on ? '習得済 ✓' : '未習得';
    btn.addEventListener('click', function () { toggleLearned(n); });
    bar.appendChild(btn);
    var host = panelContent.querySelector('.p-depth');
    if (host && host.parentNode) host.parentNode.insertBefore(bar, host.nextSibling);
    else panelContent.insertBefore(bar, panelContent.firstChild);
  }
  function toggleLearned(n) {
    if (learned[n.id]) delete learned[n.id]; else { learned[n.id] = 1; cascadePulse(n); }
    saveLearned();
    refreshStates();
    if (selectedId) highlightFor(selectedId);
    var btn = panelContent.querySelector('.btn-learn');
    if (btn) { var on = !!learned[n.id]; btn.classList.toggle('is-learned', on); btn.textContent = on ? '習得済 ✓' : '未習得'; }
  }
  function cascadePulse(n) {
    var out = links.filter(function (l) { return l.source.id === n.id || l.target.id === n.id; });
    for (var i = 0; i < Math.min(8, out.length); i++) { var p = pulses[i]; if (!p) break; p.l = out[i]; p.t = 0; p.spd = 0.02; p.col = MASTERY.clone(); }
  }
  function selectNode(id, focus) {
    var n = byId[id]; if (!n) return;
    selectedId = id;
    highlightFor(id);
    controls.autoRotate = false; document.getElementById('btn-rotate').classList.remove('active');
    if (focus) focusOn(n);
    panelContent.innerHTML = SFMAPCore.panelHTML(n, adj);
    injectPanelExtras(n);
    panel.classList.remove('hidden');
    panel.scrollTop = 0;
    panelContent.querySelectorAll('.rel-chip').forEach(function (el) {
      el.addEventListener('click', function () { selectNode(el.getAttribute('data-id'), true); });
    });
  }
  function deselect() { selectedId = null; activePath = null; refreshStates(); panel.classList.add('hidden'); }
  document.getElementById('panel-close').addEventListener('click', deselect);

  /* ---------- raycast hover / click ---------- */
  var ray = new THREE.Raycaster(); ray.params.Points = { threshold: 3 };
  var mouse = new THREE.Vector2();
  var tooltip = document.getElementById('tooltip');
  var hoverNode = null, downXY = null, moved = false;
  function pick(ev) {
    var r = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(mouse, camera);
    var hit = ray.intersectObject(spheres, false);
    for (var k = 0; k < hit.length; k++) { var id = hit[k].instanceId; if (id != null && nodes[id] && nodes[id].vis) return nodes[id]; }
    return null;
  }
  renderer.domElement.addEventListener('pointermove', function (ev) {
    if (downXY) { if (Math.abs(ev.clientX - downXY.x) + Math.abs(ev.clientY - downXY.y) > 4) moved = true; }
    var n = pick(ev);
    if (n !== hoverNode) {
      if (hoverNode) hoverNode.scaleMul = 1;
      hoverNode = n;
      if (n) n.scaleMul = 1.18;
      renderer.domElement.style.cursor = n ? 'pointer' : 'grab';
    }
    if (n) {
      var m = TYPE_META[n.type], lvl = n.level ? ' · ' + LEVEL_META[n.level].label : '';
      tooltip.innerHTML = '<div class="tt-type" style="color:' + m.color + '">' + m.label + lvl + '</div><div class="tt-label">' + SFMAPCore.esc(n.label) + '</div>' + (n.summary ? '<div class="tt-sum">' + SFMAPCore.esc(n.summary) + '</div>' : '');
      tooltip.classList.remove('hidden');
      var tw = tooltip.offsetWidth, th = tooltip.offsetHeight, x = ev.clientX + 16, y = ev.clientY + 16;
      if (x + tw > window.innerWidth - 10) x = ev.clientX - tw - 16;
      if (y + th > window.innerHeight - 10) y = ev.clientY - th - 16;
      tooltip.style.left = x + 'px'; tooltip.style.top = y + 'px';
    } else tooltip.classList.add('hidden');
  });
  renderer.domElement.addEventListener('pointerdown', function (ev) { downXY = { x: ev.clientX, y: ev.clientY }; moved = false; });
  renderer.domElement.addEventListener('pointerup', function (ev) {
    if (!moved) { var n = pick(ev); if (n) selectNode(n.id, false); else deselect(); }
    downXY = null;
  });
  renderer.domElement.addEventListener('pointerleave', function () { tooltip.classList.add('hidden'); if (hoverNode) { hoverNode.scaleMul = 1; hoverNode = null; } });

  /* ---------- filters (legend) ---------- */
  var typeEnabled = { product: true, role: true, cert: true, concept: true, topic: true };
  var levelEnabled = { beginner: true, intermediate: true, advanced: true };
  function nodeVisible(n) {
    if (n.anchor) return !!typeEnabled[n.type];
    // トピックはレベルで絞り込み。さらに「紐づく種別を消したら道連れで消える」ようにする(孤立を防ぎ分かりやすく)
    if (!typeEnabled.topic) return false;
    if (n.level && !levelEnabled[n.level]) return false;
    var refs = n.anchorRefs || [];
    if (!refs.length) return true;
    for (var i = 0; i < refs.length; i++) {
      var a = byId[refs[i]];
      if (a && typeEnabled[a.type]) return true; // 有効な種別に1つでも繋がっていれば表示
    }
    return false; // 紐づく種別がすべて非表示 → このトピックも消える
  }
  function applyVisibility() {
    nodes.forEach(function (n) { n.vis = nodeVisible(n); });
    writeLinkColors(selectedId ? G.neighborSet(selectedId) : null);
    // 端点が非表示のリンクは黒(=不可視)に
    for (var i = 0; i < links.length; i++) { var ll = links[i]; if (!(ll.source.vis && ll.target.vis)) { lcol[i * 6] = lcol[i * 6 + 1] = lcol[i * 6 + 2] = lcol[i * 6 + 3] = lcol[i * 6 + 4] = lcol[i * 6 + 5] = 0; } }
    lgeo.attributes.color.needsUpdate = true;
    var v = nodes.filter(nodeVisible).length;
    document.getElementById('stats').textContent = v + ' / ' + N + ' ノード · ' + links.length + ' リンク · 3D';
  }
  var counts = {}; nodes.forEach(function (n) { counts[n.type] = (counts[n.type] || 0) + 1; });
  var legendTypes = document.getElementById('legend-types');
  SFMAPCore.TYPE_ORDER.forEach(function (t) {
    var m = TYPE_META[t], b = document.createElement('button'); b.className = 'type-chip';
    b.innerHTML = '<span class="dot" style="background:' + m.color + ';color:' + m.color + '"></span><span>' + m.label + '</span><span class="count">' + (counts[t] || 0) + '</span>';
    b.addEventListener('click', function () { typeEnabled[t] = !typeEnabled[t]; b.classList.toggle('off', !typeEnabled[t]); applyVisibility(); });
    legendTypes.appendChild(b);
  });
  document.querySelectorAll('.lvl-chip').forEach(function (b) {
    b.addEventListener('click', function () { var lv = b.getAttribute('data-level'); levelEnabled[lv] = !levelEnabled[lv]; b.classList.toggle('off', !levelEnabled[lv]); applyVisibility(); });
  });

  /* ---------- search ---------- */
  var search = document.getElementById('search'), sw = search.closest('.search-wrap'), sc = document.getElementById('search-clear');
  search.addEventListener('input', function () {
    var q = search.value.trim().toLowerCase(); sw.classList.toggle('has-text', q.length > 0);
    if (!q) { if (!selectedId) setHighlight(null); return; }
    var matches = nodes.filter(function (n) { return n.label.toLowerCase().indexOf(q) >= 0 || (n.summary && n.summary.toLowerCase().indexOf(q) >= 0) || (n.tags && n.tags.join(' ').toLowerCase().indexOf(q) >= 0); });
    var set = {}; matches.forEach(function (n) { set[n.id] = 1; });
    setHighlight(matches.length ? set : { __none__: 1 });
    if (matches.length) {
      var cx = 0, cy = 0, cz = 0; matches.forEach(function (n) { cx += n.x; cy += n.y; cz += n.z; });
      controls.target.set(cx / matches.length, cy / matches.length, cz / matches.length);
      controls.autoRotate = false; document.getElementById('btn-rotate').classList.remove('active');
    }
  });
  search.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var q = search.value.trim().toLowerCase(); var m = nodes.filter(function (n) { return n.label.toLowerCase().indexOf(q) >= 0; }); if (m.length) selectNode(m[0].id, true); } });
  sc.addEventListener('click', function () { search.value = ''; sw.classList.remove('has-text'); if (!selectedId) setHighlight(null); search.focus(); });

  /* ---------- top actions ---------- */
  var btnRotate = document.getElementById('btn-rotate');
  btnRotate.addEventListener('click', function () { controls.autoRotate = !controls.autoRotate; btnRotate.classList.toggle('active', controls.autoRotate); });
  document.getElementById('btn-reset').addEventListener('click', function () {
    deselect(); search.value = ''; sw.classList.remove('has-text');
    typeEnabled = { product: true, role: true, cert: true, concept: true, topic: true };
    levelEnabled = { beginner: true, intermediate: true, advanced: true };
    document.querySelectorAll('.type-chip,.lvl-chip').forEach(function (b) { b.classList.remove('off'); });
    applyVisibility();
    camera.position.set(0, 0, DIST0); controls.target.set(0, 0, 0);
    controls.autoRotate = true; btnRotate.classList.add('active');
  });

  /* ---------- help ---------- */
  var hm = document.getElementById('help-modal');
  document.getElementById('btn-help').addEventListener('click', function () { hm.classList.remove('hidden'); });
  document.getElementById('help-close').addEventListener('click', function () { hm.classList.add('hidden'); });
  hm.addEventListener('click', function (e) { if (e.target === hm) hm.classList.add('hidden'); });
  var ep = document.getElementById('help-entrypoints');
  ['role-admin', 'role-developer', 'role-consultant', 'role-marketer', 'role-architect', 'concept-ai'].forEach(function (id) {
    var n = byId[id]; if (!n) return;
    var b = document.createElement('button'); b.className = 'rel-chip';
    b.innerHTML = '<span class="rc-dot" style="background:' + TYPE_META[n.type].color + '"></span><span class="rc-label">' + SFMAPCore.esc(n.label) + '</span>';
    b.addEventListener('click', function () { hm.classList.add('hidden'); selectNode(id, true); });
    ep.appendChild(b);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { hm.classList.add('hidden'); if (selectedId) deselect(); } if (e.key === '/' && document.activeElement !== search) { e.preventDefault(); search.focus(); } });
  try { if (!localStorage.getItem('sfmap-seen-3d')) { hm.classList.remove('hidden'); localStorage.setItem('sfmap-seen-3d', '1'); } } catch (e) {}

  /* ---------- resize ---------- */
  window.addEventListener('resize', function () {
    W = window.innerWidth; H = window.innerHeight;
    camera.aspect = W / H; camera.updateProjectionMatrix();
    renderer.setSize(W, H); composer.setSize(W, H); labelRenderer.setSize(W, H);
  });

  /* ---------- signal pulses (シナプスを流れる信号 = ニューロン発火) ---------- */
  var PULSE_N = 90;
  var pulses = [];
  var pgeo = new THREE.BufferGeometry();
  var ppos = new Float32Array(PULSE_N * 3);
  var pcol = new Float32Array(PULSE_N * 3);
  pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  pgeo.setAttribute('color', new THREE.BufferAttribute(pcol, 3));
  var pmat = new THREE.PointsMaterial({ size: 7, map: GLOW_TEX, vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  var pulseField = new THREE.Points(pgeo, pmat); pulseField.renderOrder = 3; scene.add(pulseField);
  var PULSE_TINT = new THREE.Color(0xdfeaff);
  function respawnPulse(p) {
    // 選択中は「学びの道(前提チェーン)」を、通常は表示中の全リンクを流れる
    var pool = (activePath && activePath.length) ? activePath : links;
    var tries = 0, l = null;
    do { l = pool[(Math.random() * pool.length) | 0]; tries++; }
    while (tries < 12 && l && (!l.source.vis || !l.target.vis));
    p.l = l; p.t = 0; p.spd = 0.006 + Math.random() * 0.016;
    var base = (activePath && activePath.length) ? PATHCOL : (l ? l.source.col : PULSE_TINT);
    p.col = base.clone().lerp(PULSE_TINT, 0.4);
  }
  for (var pi = 0; pi < PULSE_N; pi++) { var p = { l: null, t: Math.random(), spd: 0.01 }; respawnPulse(p); pulses.push(p); }
  function updatePulses() {
    for (var i = 0; i < PULSE_N; i++) {
      var p = pulses[i], l = p.l;
      if (!l || !l.source.vis || !l.target.vis) { respawnPulse(p); l = p.l; if (!l) { ppos[i * 3] = ppos[i * 3 + 1] = ppos[i * 3 + 2] = 99999; continue; } }
      p.t += p.spd;
      if (p.t >= 1) { respawnPulse(p); l = p.l; if (!l) continue; }
      var a = l.source, b = l.target, t = p.t, mt = t * t * (3 - 2 * t); // smooth
      ppos[i * 3] = a.x + (b.x - a.x) * mt;
      ppos[i * 3 + 1] = a.y + (b.y - a.y) * mt;
      ppos[i * 3 + 2] = a.z + (b.z - a.z) * mt;
      var fade = Math.sin(Math.PI * t); // 端で消え、中央で最も明るい
      pcol[i * 3] = p.col.r * fade; pcol[i * 3 + 1] = p.col.g * fade; pcol[i * 3 + 2] = p.col.b * fade;
    }
    pgeo.attributes.position.needsUpdate = true;
    pgeo.attributes.color.needsUpdate = true;
  }

  /* ---------- smooth focus (選択ノードへカメラをなめらかに寄せる) ---------- */
  var focusAnim = null;
  function focusOn(n) {
    var endT = new THREE.Vector3(n.x, n.y, n.z);
    var dir = camera.position.clone().sub(controls.target).normalize();
    var dist = Math.max(90, Math.min(220, camera.position.distanceTo(controls.target) * 0.55));
    var endP = endT.clone().add(dir.multiplyScalar(dist));
    focusAnim = { sT: controls.target.clone(), eT: endT, sP: camera.position.clone(), eP: endP, t: 0 };
  }

  /* ---------- loop ---------- */
  applyVisibility();
  refreshStates();
  function animate() {
    requestAnimationFrame(animate);
    var now = (window.performance && performance.now) ? performance.now() : 0;
    if (running) { physics(); updateLinkPositions(); }
    syncNodes(now);
    updatePulses();
    if (focusAnim) {
      focusAnim.t += 0.05;
      var e = focusAnim.t >= 1 ? 1 : (1 - Math.pow(1 - focusAnim.t, 3));
      controls.target.lerpVectors(focusAnim.sT, focusAnim.eT, e);
      camera.position.lerpVectors(focusAnim.sP, focusAnim.eP, e);
      if (focusAnim.t >= 1) focusAnim = null;
    }
    controls.update();
    updateLabels();
    composer.render();
    labelRenderer.render(scene, camera);
  }
  updateLinkPositions();
  animate();
})();
