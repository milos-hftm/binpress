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
    // preserveDrawingBuffer, damit "Bild speichern unter" auf dem Canvas
    // ein echtes Bild liefert statt einer leeren Flaeche.
    gl = canvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: true });
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
  // uRot: x = Drehwinkel um die Y-Achse, yz = Drehpunkt (X, Z). Wird nur fuer
  // den Deckel gesetzt, der um seine Scharnierlinie aufklappt.
  var VS =
    'attribute vec3 aPos; attribute vec3 aNrm;' +
    'uniform mat4 uProj, uView; uniform vec3 uOffset; uniform vec3 uRot;' +
    'varying vec3 vN;' +
    'void main(){' +
    ' vec3 p = aPos + uOffset; vec3 n = aNrm;' +
    ' if (uRot.x != 0.0) {' +
    '   float c = cos(uRot.x), s = sin(uRot.x);' +
    '   vec2 d = vec2(p.x - uRot.y, p.z - uRot.z);' +
    '   p.x = uRot.y + d.x * c + d.y * s;' +
    '   p.z = uRot.z - d.x * s + d.y * c;' +
    '   n = vec3(n.x * c + n.z * s, n.y, -n.x * s + n.z * c);' +
    ' }' +
    ' vN = mat3(uView) * n;' +
    ' gl_Position = uProj * uView * vec4(p, 1.0); }';

  var FS =
    'precision mediump float; varying vec3 vN;' +
    'uniform vec3 uColor; uniform float uPicking; uniform float uAlpha;' +
    'void main(){' +
    ' if (uPicking > 0.5) { gl_FragColor = vec4(uColor, 1.0); return; }' +
    ' vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;' +
    ' float key  = max(dot(n, normalize(vec3(0.35, 0.45, 0.82))), 0.0);' +
    ' float fill = max(dot(n, normalize(vec3(-0.6, -0.25, 0.35))), 0.0);' +
    ' float rim  = pow(1.0 - max(n.z, 0.0), 3.0);' +
    ' vec3 c = uColor * (0.42 + 0.58 * key + 0.20 * fill) + vec3(0.14) * rim;' +
    ' gl_FragColor = vec4(c, uAlpha); }';

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
  var uRot = gl.getUniformLocation(prog, 'uRot');
  var uAlpha = gl.getUniformLocation(prog, 'uAlpha');
  gl.uniform1f(uAlpha, 1);

  /* ---------- Farben je Baugruppe ---------- */
  var GROUP_COLOR = {
    basis:   [0.50, 0.54, 0.58],
    press:   [0.74, 0.77, 0.80],
    antrieb: [0.58, 0.63, 0.69],
    deckel:  [0.41, 0.45, 0.50],
    sensor:  [0.86, 0.66, 0.28]
  };
  var SELECTED = [0.18, 0.90, 0.55];
  var DIMMED   = [0.21, 0.23, 0.25];

  /* ---------- Pressbewegung ----------
     Aus der Baugruppe abgeleitet, nicht aus einer dokumentierten Kinematik:
     Pos. 20 "Presseinsatz Antrieb", 21 "Presseinsatz Bewegend" und 19
     "Schneidplatte" bilden einen zusammenhaengenden Block bei Y -117.5..-41.5.
     Der Linearantrieb (Pos. 15) endet bei Y -66 direkt dahinter, die feste
     Gegenflaeche Pos. 22 "Presseinsatz" liegt bei Y -327.5..-297.5.
     Freier Spalt 180 mm, dokumentierter Hub 200 mm - die letzten 20 mm fahren
     die 2 mm duennen Schneidplatten in den festen Presseinsatz. */
  var MOVING = { 19: 1, 20: 1, 21: 1 };
  var STROKE_MM = 200;

  /* ---------- Deckel ----------
     Die Drehachse ist aus den beiden Scharnierstiften (Pos. 11, 90003745)
     abgeleitet: beide liegen bei X 122.0..127.2 und Z 130.9..136.1 und sind
     in Y langgestreckt - also eine Achse parallel zur Y-Achse, 2.6 mm
     ausserhalb der +X-Kante des Deckels. Ausladung ab Achse 246.6 mm.
     Der Deckel (Z 125.9..130.9) liegt unmittelbar ueber der Pressmechanik
     (Z 85.9..125.9), das Aufklappen gibt sie also frei. */
  var LID_POS = 1;
  var LID_PIVOT_X = 124.6, LID_PIVOT_Z = 133.5;
  var LID_ANGLE = 0.73;            // rund 42 Grad, bleibt im Bildausschnitt
  var LID_OPEN_S = 0.6, LID_HOLD_S = 0.5, LID_CLOSE_S = 0.6;

  /* ---------- Zustand ---------- */
  var meta = null, parts = [], ready = false;
  var yaw = -0.72, pitch = 0.42, dist = 1250, baseDist = 1250, userZoom = 0, target = [0, 0, 0];
  var explode = 0, selectedPos = null, filterGroup = 'all';
  // phase: idle | opening | open | closing | pressing | returning
  var stroke = 0, lidOpen = 0, phase = 'idle', phaseT = 0;
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
          pos: p.pos,
          // Die Stueckliste liefert Positionen als Zeichenkette (data-pos),
          // die Metadaten als Zahl. Einmal vereinheitlichen statt ueberall casten.
          posKey: p.pos == null ? null : String(p.pos),
          pn: p.pn, label: p.label, group: p.group,
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
    return Math.max(rz / HALF, rxy / (HALF * aspect)) * 1.06;
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
    // Der aufgeklappte Deckel ragt ueber die statische Bounding-Box hinaus,
    // deshalb waehrend des Oeffnens etwas zurueckfahren.
    var d = dist * (1 + explode * 0.5 + lidOpen * 0.18);
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

  // Explosionsversatz plus Pressweg. Der Pressweg laeuft in -Y, also zur
  // festen Gegenflaeche hin. Der Deckel bekommt zusaetzlich seine Drehung.
  function setOffset(p, amp) {
    var mv = MOVING[p.pos] ? stroke * STROKE_MM : 0;
    gl.uniform3f(uOffset, p.dir[0] * amp, p.dir[1] * amp - mv, p.dir[2] * amp);
    if (p.pos === LID_POS && lidOpen > 0) {
      gl.uniform3f(uRot, lidOpen * LID_ANGLE, LID_PIVOT_X, LID_PIVOT_Z);
    } else {
      gl.uniform3f(uRot, 0, 0, 0);
    }
  }

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
    // Positionen 12-14 und 16-18 haben keinen Volumenkoerper. Waehlt man eine
    // davon, wird nicht die ganze Baugruppe abgedunkelt - es gaebe nichts zu sehen.
    var hasMatch = selectedPos != null && parts.some(function (q) { return q.posKey === selectedPos; });
    // Waehrend des Pressens ist der Deckel geschlossen und verriegelt - so
    // verlangt es das Sicherheitskonzept. Damit man die Mechanik trotzdem
    // sieht, wird er in dieser Phase als Schnittansicht durchscheinend
    // gezeichnet, nicht geoeffnet.
    var lidCutaway = (phase === 'pressing' || phase === 'returning') && !hasMatch;

    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (lidCutaway && p.pos === LID_POS) continue;   // kommt zuletzt
      var isSel = hasMatch && p.posKey === selectedPos;
      var col = visible(p) ? p.color : DIMMED;
      if (hasMatch) col = isSel ? SELECTED : DIMMED;
      gl.uniform3fv(uColor, col);
      setOffset(p, amp);
      gl.drawElements(gl.TRIANGLES, p.iCount, gl.UNSIGNED_SHORT, p.iOff * 2);
    }

    // Deckel zuletzt und durchscheinend. Er liegt ganz oben, deshalb ist
    // keine Sortierung noetig - Tiefentest an, Tiefenschreiben aus.
    if (lidCutaway) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.uniform1f(uAlpha, 0.22);
      for (var k = 0; k < parts.length; k++) {
        var lp = parts[k];
        if (lp.pos !== LID_POS) continue;
        gl.uniform3fv(uColor, visible(lp) ? lp.color : DIMMED);
        setOffset(lp, amp);
        gl.drawElements(gl.TRIANGLES, lp.iCount, gl.UNSIGNED_SHORT, lp.iOff * 2);
      }
      gl.uniform1f(uAlpha, 1);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    // Zweiter Durchgang ohne Tiefentest: Viele Positionen liegen im Gehaeuse
    // (z. B. Pos. 22 Presseinsatz). Ohne diesen Durchgang waere die Markierung
    // zwar gesetzt, aber vollstaendig verdeckt.
    if (hasMatch) {
      gl.disable(gl.DEPTH_TEST);
      gl.uniform3fv(uColor, SELECTED);
      for (var j = 0; j < parts.length; j++) {
        var q = parts[j];
        if (q.posKey !== selectedPos) continue;
        setOffset(q, amp);
        gl.drawElements(gl.TRIANGLES, q.iCount, gl.UNSIGNED_SHORT, q.iOff * 2);
      }
      gl.enable(gl.DEPTH_TEST);
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
      setOffset(p, amp);
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
  // 200 mm bei 11 mm/s sind 18.2 s je Richtung. Vierfacher Zeitraffer,
  // damit ein Zyklus im Browser erfassbar bleibt.
  var PRESS_SECONDS = (STROKE_MM / 11) / 4;

  var frame = 0;
  function tick(t) {
    // Layout kann nach dem Laden noch wachsen (Reveal-Animation, Tab-Wechsel,
    // spaet geladene Schriften). Deshalb regelmaessig nachmessen statt einmalig.
    if (ready && (frame++ % 10 === 0)) resize();
    var dt = lastT ? Math.min((t - lastT) / 1000, 0.1) : 0;
    lastT = t;

    // Ablauf nach Funktionsprinzip: Deckel oeffnen, befuellen, schliessen,
    // erst dann presst die Platte. Ein Pressvorgang bei offenem Deckel waere
    // ein Widerspruch zu den fuenf Startbedingungen der Steuerung.
    if (ready && phase !== 'idle') {
      phaseT += dt;
      if (phase === 'opening') {
        lidOpen = Math.min(1, phaseT / LID_OPEN_S);
        if (phaseT >= LID_OPEN_S) { lidOpen = 1; phase = 'open'; phaseT = 0; }
      } else if (phase === 'open') {
        if (phaseT >= LID_HOLD_S) { phase = 'closing'; phaseT = 0; }
      } else if (phase === 'closing') {
        lidOpen = Math.max(0, 1 - phaseT / LID_CLOSE_S);
        if (phaseT >= LID_CLOSE_S) { lidOpen = 0; phase = 'pressing'; phaseT = 0; }
      } else if (phase === 'pressing') {
        stroke = Math.min(1, phaseT / PRESS_SECONDS);
        if (stroke >= 1) { stroke = 1; phase = 'returning'; phaseT = 0; }
      } else if (phase === 'returning') {
        stroke = Math.max(0, 1 - phaseT / PRESS_SECONDS);
        if (stroke <= 0) { stroke = 0; phase = 'idle'; setPressUi(); }
      }
      updateInfo(); needsDraw = true;
    }
    if (spin && ready) { yaw += dt * 0.28; needsDraw = true; }
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
  var infoEl = document.getElementById('viewerInfo');
  var pressBtn = document.getElementById('viewerPress');
  var baseInfo = '';

  function running() { return phase !== 'idle'; }

  function stopSequence() { phase = 'idle'; phaseT = 0; stroke = 0; lidOpen = 0; }

  var PHASE_TEXT = {
    opening:   'Deckel öffnet — Abfall einfüllen',
    open:      'Deckel offen — Abfall einfüllen',
    closing:   'Deckel schliesst und verriegelt',
    pressing:  'Pressweg %s / ' + STROKE_MM + ' mm · 4× Zeitraffer · Schnittansicht',
    returning: 'Rückfahrt %s / ' + STROKE_MM + ' mm · 4× Zeitraffer · Schnittansicht'
  };

  function updateInfo() {
    if (!infoEl) return;
    var t = PHASE_TEXT[phase];
    infoEl.textContent = t
      ? t.replace('%s', Math.round(stroke * STROKE_MM))
      : baseInfo;
  }
  function setPressUi() {
    if (pressBtn) {
      pressBtn.textContent = running() ? 'Stopp' : 'Pressvorgang';
      pressBtn.setAttribute('aria-pressed', running() ? 'true' : 'false');
    }
    updateInfo();
  }
  if (pressBtn) pressBtn.addEventListener('click', function () {
    if (!ready) return;
    if (running()) { stopSequence(); }
    else {
      phase = 'opening'; phaseT = 0; stroke = 0; lidOpen = 0; spin = false;
      explode = 0; if (slider) slider.value = 0;   // Explosion und Ablauf schliessen sich aus
    }
    setPressUi(); draw();
  });

  if (slider) slider.addEventListener('input', function () {
    explode = parseFloat(slider.value) / 100; spin = false;
    if (explode > 0 && running()) { stopSequence(); setPressUi(); }
    draw();
  });
  var reset = document.getElementById('viewerReset');
  if (reset) reset.addEventListener('click', function () {
    yaw = -0.72; pitch = 0.42; explode = 0; userZoom = 0; dist = baseDist;
    stopSequence();
    if (slider) slider.value = 0;
    setPressUi(); emit(null); spin = !reduce; draw();
  });

  /* ---------- Kopplung an Stückliste ---------- */
  // Direkt zeichnen statt nur anzufordern: requestAnimationFrame ruht in
  // Hintergrundtabs und ist auf schwachen Geraeten gedrosselt.
  document.addEventListener('bp:select', function (e) {
    selectedPos = e.detail == null ? null : String(e.detail);
    draw();
  });
  document.addEventListener('bp:filter', function (e) { filterGroup = e.detail; draw(); });

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
    baseInfo = m.triangles.toLocaleString('de-CH') + ' Dreiecke · ' +
      m.size[0] + ' × ' + m.size[1] + ' × ' + m.size[2] + ' mm';
    updateInfo();
  }).catch(function (err) {
    stage.classList.add('is-unsupported');
    if (window.console) console.warn('3D-Viewer:', err);
  });
})();
