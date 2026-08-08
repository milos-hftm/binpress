/* BinPress 3D-Viewer — WebGL ohne Fremdbibliothek.
   Geometrie: assets/binpress.bin + assets/binpress.json,
   erzeugt aus der Gesamtbaugruppe 10013869_A_1-Bin Press.stp. */
(function () {
  'use strict';

  var canvas = document.getElementById('viewer3d');
  var stage = document.getElementById('viewerStage');
  if (!canvas || !stage) return;

  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: false });
  } catch (e) { gl = null; }
  if (!gl) { stage.classList.add('is-unsupported'); return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Matrizen ---------- */
  function mIdent() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
  function mPerspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]);
  }
  function mLookAt(eye, ctr, up) {
    var z0=eye[0]-ctr[0], z1=eye[1]-ctr[1], z2=eye[2]-ctr[2];
    var l=Math.hypot(z0,z1,z2)||1; z0/=l; z1/=l; z2/=l;
    var x0=up[1]*z2-up[2]*z1, x1=up[2]*z0-up[0]*z2, x2=up[0]*z1-up[1]*z0;
    l=Math.hypot(x0,x1,x2)||1; x0/=l; x1/=l; x2/=l;
    var y0=z1*x2-z2*x1, y1=z2*x0-z0*x2, y2=z0*x1-z1*x0;
    return new Float32Array([
      x0,y0,z0,0, x1,y1,z1,0, x2,y2,z2,0,
      -(x0*eye[0]+x1*eye[1]+x2*eye[2]),
      -(y0*eye[0]+y1*eye[1]+y2*eye[2]),
      -(z0*eye[0]+z1*eye[1]+z2*eye[2]), 1
    ]);
  }

  /* ---------- Shader ---------- */
  var VS =
    'attribute vec3 aPos; attribute vec3 aNrm;' +
    'uniform mat4 uProj, uView; uniform vec3 uOffset;' +
    'varying vec3 vN;' +
    'void main(){ vN = mat3(uView) * aNrm;' +
    ' gl_Position = uProj * uView * vec4(aPos + uOffset, 1.0); }';

  var FS =
    'precision mediump float; varying vec3 vN;' +
    'uniform vec3 uColor; uniform float uPicking;' +
    'void main(){' +
    ' if (uPicking > 0.5) { gl_FragColor = vec4(uColor, 1.0); return; }' +
    ' vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;' +
    ' float key  = max(dot(n, normalize(vec3(0.35, 0.45, 0.82))), 0.0);' +
    ' float fill = max(dot(n, normalize(vec3(-0.6, -0.25, 0.35))), 0.0);' +
    ' float rim  = pow(1.0 - max(n.z, 0.0), 3.0);' +
    ' vec3 c = uColor * (0.34 + 0.62 * key + 0.20 * fill) + vec3(0.16) * rim;' +
    ' gl_FragColor = vec4(c, 1.0); }';

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { stage.classList.add('is-unsupported'); return; }
  gl.useProgram(prog);

  var aPos = gl.getAttribLocation(prog, 'aPos');
  var aNrm = gl.getAttribLocation(prog, 'aNrm');
  var uProj = gl.getUniformLocation(prog, 'uProj');
  var uView = gl.getUniformLocation(prog, 'uView');
  var uOffset = gl.getUniformLocation(prog, 'uOffset');
  var uColor = gl.getUniformLocation(prog, 'uColor');
  var uPicking = gl.getUniformLocation(prog, 'uPicking');

  /* ---------- Farben je Baugruppe ---------- */
  var GROUP_COLOR = {
    basis:   [0.42, 0.46, 0.50],
    press:   [0.62, 0.66, 0.70],
    antrieb: [0.52, 0.55, 0.60],
    deckel:  [0.36, 0.40, 0.44],
    sensor:  [0.78, 0.62, 0.30]
  };
  var SELECTED = [0.16, 0.85, 0.52];
  var DIMMED   = [0.30, 0.32, 0.34];

  /* ---------- Zustand ---------- */
  var meta = null, parts = [], ready = false;
  var yaw = -0.72, pitch = 0.42, dist = 1250, baseDist = 1250, userZoom = 0, target = [0, 0, 0];
  var explode = 0, selectedPos = null, filterGroup = 'all';
  var spin = !reduce, lastT = 0, needsDraw = true;
  var pickFB = null, pickTex = null, pickRB = null, pickW = 0, pickH = 0;

  /* ---------- Laden ---------- */
  function load() {
    return Promise.all([
      fetch('assets/binpress.json').then(function (r) { if (!r.ok) throw new Error('json ' + r.status); return r.json(); }),
      fetch('assets/binpress.bin').then(function (r) { if (!r.ok) throw new Error('bin ' + r.status); return r.arrayBuffer(); })
    ]).then(function (res) {
      meta = res[0];
      var buf = res[1], L = meta.layout;
      var pos = new Float32Array(buf, L.pos.off, L.pos.len);
      var idx = new Uint16Array(buf, L.idx.off, L.idx.len);
      var nrm = new Int8Array(buf, L.nrm.off, L.nrm.len);

      var bp = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bp); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
      var bn = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bn); gl.bufferData(gl.ARRAY_BUFFER, nrm, gl.STATIC_DRAW);
      var bi = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bi); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, bp);
      gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bn);
      gl.enableVertexAttribArray(aNrm); gl.vertexAttribPointer(aNrm, 3, gl.BYTE, true, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bi);

      parts = meta.parts.map(function (p, i) {
        var c = p.ctr, l = Math.hypot(c[0], c[1], c[2]);
        var d = l > 1 ? [c[0]/l, c[1]/l, c[2]/l] : [0, 0, 1];
        return {
          pos: p.pos, pn: p.pn, label: p.label, group: p.group,
          iOff: p.iOff, iCount: p.iCount, dir: d, index: i,
          color: GROUP_COLOR[p.group] || GROUP_COLOR.basis
        };
      });

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      ready = true;
      stage.classList.add('is-ready');
      scheduleRefit(); draw();
      return meta;
    });
  }

  /* ---------- Grösse ---------- */
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    var W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; needsDraw = true; }
    if (pickW !== w || pickH !== h) { pickW = w; pickH = h; buildPickTarget(); }
    refit(w / h);
  }

  function buildPickTarget() {
    if (pickFB) { gl.deleteFramebuffer(pickFB); gl.deleteTexture(pickTex); gl.deleteRenderbuffer(pickRB); }
    pickFB = gl.createFramebuffer(); pickTex = gl.createTexture(); pickRB = gl.createRenderbuffer();
    gl.bindTexture(gl.TEXTURE_2D, pickTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, pickW, pickH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pickFB);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pickTex, 0);
    gl.bindRenderbuffer(gl.RENDERBUFFER, pickRB);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, pickW, pickH);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, pickRB);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /* ---------- Kamera ---------- */
  var FOVY = 0.72, HALF = Math.tan(FOVY / 2);

  // Abstand so, dass die Baugruppe bei jeder Drehung um die Hochachse ins Bild passt.
  // Vertikal begrenzt die Z-Ausdehnung, horizontal die groessere von X und Y.
  function fitDistance(aspect) {
    var b = meta.bbox;
    var rz = Math.max(Math.abs(b.min[2]), Math.abs(b.max[2]));
    var rxy = Math.max(Math.abs(b.min[0]), Math.abs(b.max[0]), Math.abs(b.min[1]), Math.abs(b.max[1]));
    return Math.max(rz / HALF, rxy / (HALF * aspect)) * 1.14;
  }

  // Passt den Kameraabstand ans aktuelle Seitenverhaeltnis an. Laeuft auch dann,
  // wenn die Canvas-Groesse schon vor dem Laden der Geometrie feststand.
  function refit(aspect) {
    if (!meta || !aspect) return;
    var fit = fitDistance(aspect);
    if (Math.abs(fit - baseDist) < 0.5) return;
    baseDist = fit;
    dist = userZoom ? fit * userZoom : fit;
    needsDraw = true;
  }

  function camera(aspect) {
    var d = dist * (1 + explode * 0.5);
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var eye = [
      target[0] + d * cp * Math.sin(yaw),
      target[1] + d * cp * Math.cos(yaw),
      target[2] + d * sp
    ];
    return {
      proj: mPerspective(FOVY, aspect, meta.radius * 0.05, meta.radius * 14),
      view: mLookAt(eye, target, [0, 0, 1])
    };
  }

  function visible(p) { return filterGroup === 'all' || p.group === filterGroup; }

  /* ---------- Zeichnen ---------- */
  function draw() {
    if (!ready) return;
    var W = canvas.width, H = canvas.height;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var cam = camera(W / H);
    gl.uniformMatrix4fv(uProj, false, cam.proj);
    gl.uniformMatrix4fv(uView, false, cam.view);
    gl.uniform1f(uPicking, 0);

    var amp = meta.radius * 0.85 * explode;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var isSel = selectedPos != null && p.pos === selectedPos;
      var col = isSel ? SELECTED : (visible(p) ? p.color : DIMMED);
      if (selectedPos != null && !isSel) col = DIMMED;
      gl.uniform3fv(uColor, col);
      gl.uniform3f(uOffset, p.dir[0] * amp, p.dir[1] * amp, p.dir[2] * amp);
      gl.drawElements(gl.TRIANGLES, p.iCount, gl.UNSIGNED_SHORT, p.iOff * 2);
    }
    needsDraw = false;
  }

  function pickAt(cx, cy) {
    if (!ready || !pickFB) return null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, pickFB);
    gl.viewport(0, 0, pickW, pickH);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var cam = camera(pickW / pickH);
    gl.uniformMatrix4fv(uProj, false, cam.proj);
    gl.uniformMatrix4fv(uView, false, cam.view);
    gl.uniform1f(uPicking, 1);
    var amp = meta.radius * 0.85 * explode;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], id = i + 1;
      gl.uniform3f(uColor, (id & 255) / 255, ((id >> 8) & 255) / 255, ((id >> 16) & 255) / 255);
      gl.uniform3f(uOffset, p.dir[0] * amp, p.dir[1] * amp, p.dir[2] * amp);
      gl.drawElements(gl.TRIANGLES, p.iCount, gl.UNSIGNED_SHORT, p.iOff * 2);
    }
    var px = new Uint8Array(4);
    gl.readPixels(Math.round(cx), Math.round(pickH - cy), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    var id = px[0] | (px[1] << 8) | (px[2] << 16);
    needsDraw = true;
    return id > 0 && id <= parts.length ? parts[id - 1] : null;
  }

  /* ---------- Animationsschleife ---------- */
  var frame = 0;
  function tick(t) {
    // Layout kann nach dem Laden noch wachsen (Reveal-Animation, Tab-Wechsel,
    // spaet geladene Schriften). Deshalb regelmaessig nachmessen statt einmalig.
    if (ready && (frame++ % 10 === 0)) resize();
    if (spin && ready) { var dt = lastT ? (t - lastT) / 1000 : 0; yaw += dt * 0.28; needsDraw = true; }
    lastT = t;
    if (needsDraw) draw();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ---------- Interaktion ---------- */
  var drag = null, moved = 0;
  function ptr(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture(e.pointerId);
    drag = ptr(e); moved = 0; spin = false;
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var p = ptr(e), dx = p.x - drag.x, dy = p.y - drag.y;
    moved += Math.abs(dx) + Math.abs(dy);
    yaw -= dx * 0.008;
    pitch = Math.max(-1.45, Math.min(1.45, pitch + dy * 0.008));
    drag = p; needsDraw = true;
  });
  function endDrag(e) {
    if (!drag) return;
    var p = ptr(e); drag = null;
    if (moved < 5) {
      var hit = pickAt(p.x, p.y);
      if (hit && hit.pos != null) emit(String(hit.pos));
      else emit(null);
    }
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', function () { drag = null; });
  canvas.addEventListener('wheel', function (e) {
    if (!ready) return;
    e.preventDefault(); spin = false;
    dist = Math.max(baseDist * 0.35, Math.min(baseDist * 3.2, dist * (1 + Math.sign(e.deltaY) * 0.12)));
    userZoom = dist / baseDist;
    needsDraw = true;
  }, { passive: false });

  function emit(pos) {
    if (typeof window.bpSelect === 'function') window.bpSelect(pos);
    else { selectedPos = pos; needsDraw = true; }
  }

  /* ---------- Bedienelemente ---------- */
  var slider = document.getElementById('viewerExplode');
  if (slider) slider.addEventListener('input', function () {
    explode = parseFloat(slider.value) / 100; spin = false; needsDraw = true;
  });
  var reset = document.getElementById('viewerReset');
  if (reset) reset.addEventListener('click', function () {
    yaw = -0.72; pitch = 0.42; explode = 0; userZoom = 0; dist = baseDist;
    if (slider) slider.value = 0;
    emit(null); spin = !reduce; needsDraw = true;
  });

  /* ---------- Kopplung an Stückliste ---------- */
  document.addEventListener('bp:select', function (e) { selectedPos = e.detail; needsDraw = true; });
  document.addEventListener('bp:filter', function (e) { filterGroup = e.detail; needsDraw = true; });

  window.addEventListener('resize', function () { resize(); needsDraw = true; }, { passive: true });
  var ro = window.ResizeObserver ? new ResizeObserver(function () { resize(); needsDraw = true; }) : null;
  if (ro) ro.observe(canvas);

  // Laedt die Seite in einem Hintergrundtab, liefert das Layout anfangs 0 und
  // requestAnimationFrame ruht — die Nachmessung in tick() greift dann nicht.
  // Deshalb zusaetzlich ueber Timer und Sichtbarkeitswechsel nachfassen.
  function scheduleRefit() {
    resize(); needsDraw = true;
    [0, 120, 500, 1500].forEach(function (ms) {
      window.setTimeout(function () { resize(); needsDraw = true; }, ms);
    });
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) scheduleRefit(); });
  window.addEventListener('load', scheduleRefit);

  load().then(function (m) {
    var info = document.getElementById('viewerInfo');
    if (info) info.textContent = m.triangles.toLocaleString('de-CH') + ' Dreiecke · ' +
      m.size[0] + ' × ' + m.size[1] + ' × ' + m.size[2] + ' mm';
  }).catch(function (err) {
    stage.classList.add('is-unsupported');
    if (window.console) console.warn('3D-Viewer:', err);
  });
})();
