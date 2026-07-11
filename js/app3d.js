/* ============================================================
   app3d.js — Three.js による 3D ナレッジグラフ
   ============================================================ */
(function () {
  'use strict';
  var G = SFMAPCore.buildGraph();
  var nodes = G.nodes, links = G.links, byId = G.byId, adj = G.adj;
  var TYPE_META = SFMAPCore.TYPE_META, LEVEL_META = SFMAPCore.LEVEL_META;

  /* ---------- seed 3D positions (golden-spiral shell) + radii ---------- */
  var N = nodes.length;
  nodes.forEach(function (n, i) {
    var t = (i + 0.5) / N;
    var th = Math.acos(1 - 2 * t);
    var ph = i * 2.399963229;              // golden angle
    var rr = 150 + (i % 40) * 2.8;
    n.x = rr * Math.sin(th) * Math.cos(ph);
    n.y = rr * Math.sin(th) * Math.sin(ph);
    n.z = rr * Math.cos(th);
    n.vx = n.vy = n.vz = 0;
    var base = { concept: 5.4, product: 5.2, role: 5.0, cert: 3.5, topic: 2.1 }[n.type];
    n.r = base + Math.min(3.4, Math.sqrt(n.deg) * (n.anchor ? 0.75 : 0.42));
    n.col = new THREE.Color(n.color);
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
  var THEME = { dark: { bg: 0x0b0e14, fog: 0.0013, bloom: 0.42, thr: 0.32 }, light: { bg: 0xeef1f8, fog: 0.0013, bloom: 0.26, thr: 0.46 } };
  var themeName = (function () { try { return localStorage.getItem('sfmap-theme') || 'dark'; } catch (e) { return 'dark'; } })();

  var camera = new THREE.PerspectiveCamera(58, W / H, 1, 6000);
  var DIST0 = 440;
  camera.position.set(0, 0, DIST0);

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;
  controls.minDistance = 60;
  controls.maxDistance = 1600;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  var pl = new THREE.PointLight(0xffffff, 0.6); pl.position.set(200, 200, 300); scene.add(pl);

  /* ---------- starfield ---------- */
  (function () {
    var g = new THREE.BufferGeometry(), n = 900, pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var r = 1400 + Math.random() * 1600;
      var th = Math.acos(2 * Math.random() - 1), ph = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.sin(th) * Math.cos(ph);
      pos[i * 3 + 1] = r * Math.sin(th) * Math.sin(ph);
      pos[i * 3 + 2] = r * Math.cos(th);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var m = new THREE.PointsMaterial({ color: 0x8aa0c8, size: 2.2, transparent: true, opacity: 0.55, sizeAttenuation: false });
    scene.add(new THREE.Points(g, m));
  })();

  /* ---------- node meshes ---------- */
  var sphereGeo = new THREE.SphereGeometry(1, 18, 18);
  var group = new THREE.Group(); scene.add(group);
  nodes.forEach(function (n) {
    var mat = new THREE.MeshStandardMaterial({
      color: n.col, emissive: n.col, emissiveIntensity: n.anchor ? 0.5 : 0.32,
      metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0.96
    });
    var mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.scale.setScalar(n.r);
    mesh.position.set(n.x, n.y, n.z);
    mesh.userData.node = n;
    n.mesh = mesh; n.mat = mat; n.baseEmissive = mat.emissiveIntensity;
    group.add(mesh);
    // anchor labels
    if (n.anchor) {
      var el = document.createElement('div');
      el.className = 'node-label'; el.textContent = n.label;
      var lo = new THREE.CSS2DObject(el);
      lo.position.set(0, n.r + 3.5, 0);
      mesh.add(lo);
      n.labelEl = el;
      el.style.opacity = (n.type === 'cert') ? '0' : '0.9'; // 資格ラベルは既定で非表示(ハイライト時に表示)
    }
  });

  /* ---------- links ---------- */
  var GRAY = new THREE.Color(0x2b3448), AMBER = new THREE.Color(0xd0a24a);
  var lpos = new Float32Array(links.length * 6);
  var lcol = new Float32Array(links.length * 6);
  function baseLinkColor(l) {
    if (l.kind === 'contains') return l.source.col.clone().multiplyScalar(0.55);
    if (l.kind === 'covers') return l.source.col.clone().multiplyScalar(0.42);
    if (l.kind === 'prereq') return AMBER.clone().multiplyScalar(0.5);
    return GRAY.clone().multiplyScalar(0.6);
  }
  links.forEach(function (l) { l.baseCol = baseLinkColor(l); });
  var lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  lgeo.setAttribute('color', new THREE.BufferAttribute(lcol, 3));
  var lmat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
  var lineSeg = new THREE.LineSegments(lgeo, lmat);
  scene.add(lineSeg);

  function writeLinkColors(hl) {
    for (var i = 0; i < links.length; i++) {
      var l = links[i], c;
      if (hl) {
        if (hl[l.source.id] && hl[l.target.id]) {
          c = (l.kind === 'prereq') ? AMBER : (l.kind === 'contains' || l.kind === 'covers') ? l.source.col : GRAY.clone().multiplyScalar(1.6);
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
  var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W, H), THEME[themeName].bloom, 0.6, THEME[themeName].thr);
  composer.addPass(bloom);

  function applyTheme(name) {
    themeName = name;
    document.documentElement.setAttribute('data-theme', name);
    try { localStorage.setItem('sfmap-theme', name); } catch (e) {}
    var t = THEME[name];
    scene.background = new THREE.Color(t.bg);
    scene.fog = new THREE.FogExp2(t.bg, t.fog);
    bloom.strength = t.bloom; bloom.threshold = t.thr;
  }
  applyTheme(themeName);

  /* ---------- physics (3D force) ---------- */
  var alpha = 1, running = true;
  function physics() {
    var i, j, a, b, dx, dy, dz, d2, dist, f;
    var K = 430, MAXF = 110;
    for (i = 0; i < N; i++) {
      a = nodes[i];
      for (j = i + 1; j < N; j++) {
        b = nodes[j];
        dx = b.x - a.x; dy = b.y - a.y; dz = b.z - a.z;
        d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dz = Math.random() - 0.5; d2 = dx * dx + dy * dy + dz * dz + 0.01; }
        if (d2 > 160000) continue;
        dist = Math.sqrt(d2);
        f = (K / d2) * alpha; if (f > MAXF) f = MAXF;
        var fx = dx / dist * f, fy = dy / dist * f, fz = dz / dist * f;
        a.vx -= fx; a.vy -= fy; a.vz -= fz;
        b.vx += fx; b.vy += fy; b.vz += fz;
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
      a.vx += (-a.x) * alpha * 0.013; a.vy += (-a.y) * alpha * 0.013; a.vz += (-a.z) * alpha * 0.013;
      a.vx *= 0.6; a.vy *= 0.6; a.vz *= 0.6;
      if (a.vx > VMAX) a.vx = VMAX; else if (a.vx < -VMAX) a.vx = -VMAX;
      if (a.vy > VMAX) a.vy = VMAX; else if (a.vy < -VMAX) a.vy = -VMAX;
      if (a.vz > VMAX) a.vz = VMAX; else if (a.vz < -VMAX) a.vz = -VMAX;
      a.x += a.vx; a.y += a.vy; a.z += a.vz;
      if (!isFinite(a.x) || !isFinite(a.y) || !isFinite(a.z)) { a.x = (Math.random() - 0.5) * 120; a.y = (Math.random() - 0.5) * 120; a.z = (Math.random() - 0.5) * 120; a.vx = a.vy = a.vz = 0; }
      a.mesh.position.set(a.x, a.y, a.z);
    }
    alpha += (0 - alpha) * 0.02;
    if (alpha < 0.004) { alpha = 0; running = false; }
  }
  function reheat(v) { alpha = Math.max(alpha, v || 0.5); running = true; }

  /* ---------- highlight / selection ---------- */
  var selectedId = null;
  function setHighlight(hl) {
    nodes.forEach(function (n) {
      var dim = hl && !hl[n.id];
      n.mat.opacity = dim ? 0.1 : 0.96;
      n.mat.emissiveIntensity = dim ? 0.04 : (n.id === selectedId ? 0.95 : n.baseEmissive);
      if (n.labelEl) n.labelEl.style.opacity = dim ? '0.08' : (n.type === 'cert' ? (hl ? '0.85' : '0') : '0.9');
    });
    writeLinkColors(hl);
  }

  /* ---------- panel ---------- */
  var panel = document.getElementById('panel');
  var panelContent = document.getElementById('panel-content');
  function selectNode(id, focus) {
    var n = byId[id]; if (!n) return;
    selectedId = id;
    setHighlight(G.neighborSet(id));
    controls.autoRotate = false; document.getElementById('btn-rotate').classList.remove('active');
    if (focus) { controls.target.set(n.x, n.y, n.z); }
    panelContent.innerHTML = SFMAPCore.panelHTML(n, adj);
    panel.classList.remove('hidden');
    panel.scrollTop = 0;
    panelContent.querySelectorAll('.rel-chip').forEach(function (el) {
      el.addEventListener('click', function () { selectNode(el.getAttribute('data-id'), true); });
    });
  }
  function deselect() { selectedId = null; setHighlight(null); panel.classList.add('hidden'); }
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
    var vis = []; for (var i = 0; i < N; i++) if (nodes[i].mesh.visible) vis.push(nodes[i].mesh);
    var hit = ray.intersectObjects(vis, false);
    return hit.length ? hit[0].object.userData.node : null;
  }
  renderer.domElement.addEventListener('pointermove', function (ev) {
    if (downXY) { if (Math.abs(ev.clientX - downXY.x) + Math.abs(ev.clientY - downXY.y) > 4) moved = true; }
    var n = pick(ev);
    if (n !== hoverNode) {
      if (hoverNode) hoverNode.mesh.scale.setScalar(hoverNode.r);
      hoverNode = n;
      if (n) n.mesh.scale.setScalar(n.r * 1.35);
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
  renderer.domElement.addEventListener('pointerleave', function () { tooltip.classList.add('hidden'); if (hoverNode) { hoverNode.mesh.scale.setScalar(hoverNode.r); hoverNode = null; } });

  /* ---------- filters (legend) ---------- */
  var typeEnabled = { product: true, role: true, cert: true, concept: true, topic: true };
  var levelEnabled = { beginner: true, intermediate: true, advanced: true };
  function nodeVisible(n) {
    if (!typeEnabled[n.type]) return false;
    if (n.type === 'topic' && n.level && !levelEnabled[n.level]) return false;
    return true;
  }
  function applyVisibility() {
    nodes.forEach(function (n) { n.mesh.visible = nodeVisible(n); });
    // hide links whose endpoint is hidden by pushing them off-screen color black
    for (var i = 0; i < links.length; i++) {
      var l = links[i], vis = l.source.mesh.visible && l.target.mesh.visible;
      if (!vis) { lcol[i * 6] = lcol[i * 6 + 1] = lcol[i * 6 + 2] = lcol[i * 6 + 3] = lcol[i * 6 + 4] = lcol[i * 6 + 5] = 0; }
    }
    writeLinkColors(selectedId ? G.neighborSet(selectedId) : null);
    // re-blackout hidden after writeLinkColors
    for (i = 0; i < links.length; i++) { var ll = links[i]; if (!(ll.source.mesh.visible && ll.target.mesh.visible)) { lcol[i * 6] = lcol[i * 6 + 1] = lcol[i * 6 + 2] = lcol[i * 6 + 3] = lcol[i * 6 + 4] = lcol[i * 6 + 5] = 0; } }
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
  document.getElementById('btn-theme').addEventListener('click', function () { applyTheme(themeName === 'light' ? 'dark' : 'light'); });

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

  /* ---------- loop ---------- */
  applyVisibility();
  var settleFrames = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (running) { physics(); updateLinkPositions(); settleFrames++; }
    controls.update();
    composer.render();
    labelRenderer.render(scene, camera);
  }
  updateLinkPositions();
  animate();
})();
