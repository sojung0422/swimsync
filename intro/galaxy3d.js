/* SwimSync 홈페이지 — 갤럭시 스타일 3D 휴대폰 (three.js)
 * 평면 디스플레이·균일한 얇은 베젤·가운데 펀치홀·오른쪽 음량/전원 버튼·뒷면 세로 카메라 3개.
 * 화면은 실제 앱 캡처를 캔버스에 합성: 위 상태 표시줄·아래 탭 바는 고정, 가운데 내용만 스크롤.
 * WebGL이 안 되면 아무것도 하지 않고, 기존 CSS 휴대폰이 그대로 보인다. */
(function () {
  var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var CW = 600, CH = 1332, STATUS = 60, NAV = 97;        // 화면 캔버스(약 20:9)
  var SRC_TOP = 74, SRC_NAV_Y = 1349;                     // 원본 캡처의 상태 표시줄 끝·탭 바 시작
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function webgl() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
  function loadThree(cb) {
    if (window.THREE) return cb();
    var s = document.createElement('script'); s.src = THREE_URL; s.async = true; s.onload = cb; document.head.appendChild(s);
  }
  function img(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; }); }

  function rrect(w, h, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  }
  function flatUV(geo, w, h) {
    var p = geo.attributes.position, uv = geo.attributes.uv;
    for (var i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
    uv.needsUpdate = true; return geo;
  }

  // ── 화면 합성 ──────────────────────────────────────────────
  function statusBar(x) {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, CW, STATUS);
    x.fillStyle = '#111827'; x.font = '600 25px "IBM Plex Sans KR", system-ui, sans-serif'; x.textBaseline = 'middle';
    x.fillText('9:41', 34, STATUS / 2 + 2);
    // 신호
    for (var i = 0; i < 4; i++) x.fillRect(470 + i * 9, 40 - (i + 1) * 5, 6, (i + 1) * 5);
    // 배터리
    x.strokeStyle = '#111827'; x.lineWidth = 2.5; x.strokeRect(520, 22, 44, 20); x.fillRect(523.5, 25.5, 34, 13); x.fillRect(566, 28, 4, 8);
  }
  function compose(x, app, frac) {
    var nh = app.navH, vh = CH - STATUS - nh, ch = app.cBot - app.cTop, h = Math.min(vh, ch), off = Math.max(0, ch - vh) * frac;
    x.fillStyle = app.bg || '#f8fafc'; x.fillRect(0, STATUS, CW, vh);
    x.drawImage(app.content, 0, app.cTop + off, CW, h, 0, STATUS, CW, h);
    x.drawImage(app.nav, 0, app.navY, CW, nh, 0, CH - nh, CW, nh);
    statusBar(x);
  }

  // ── 휴대폰 만들기 ───────────────────────────────────────────
  function Phone(el, apps, opt) {
    var self = this;
    this.el = el; this.apps = apps; this.opt = opt || {};
    this.cur = 0; this.prev = -1; this.mix = 1; this.frac = 0; this.prevFrac = 0; this.dirty = true;
    this.rx = 0.07; this.ry = -0.42; this.trx = 0.07; this.try_ = -0.42; this.prog = 0;

    var r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    el.appendChild(r.domElement);
    var sc = this.scene = new THREE.Scene();
    var cam = this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

    sc.add(new THREE.HemisphereLight(0xffffff, 0x8193b8, 0.85));
    var key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(3, 4, 6); sc.add(key);
    var rim = new THREE.DirectionalLight(0xa9c4ff, 0.9); rim.position.set(-5, 1, -2); sc.add(rim);
    var fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-2, -3, 4); sc.add(fill);

    var SW = 1, SH = SW * CH / CW, B = 0.042, BW = SW + B * 2, BH = SH + B * 2 + 0.02, R = 0.13, D = 0.105;
    this.BW = BW; this.BH = BH;
    var g = this.group = new THREE.Group(); sc.add(g);

    var frameMat = new THREE.MeshStandardMaterial({ color: 0x9aa1ad, metalness: 0.82, roughness: 0.28 });
    var body = new THREE.ExtrudeGeometry(rrect(BW - 0.04, BH - 0.04, R - 0.02), { depth: D - 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 6, curveSegments: 36 });
    body.translate(0, 0, -(D - 0.04) / 2); g.add(new THREE.Mesh(body, frameMat));

    var glass = new THREE.Mesh(new THREE.ShapeGeometry(rrect(BW - 0.014, BH - 0.014, R - 0.008), 36), new THREE.MeshStandardMaterial({ color: 0x050608, metalness: 0.25, roughness: 0.12 }));
    glass.position.z = D / 2 + 0.0008; g.add(glass);

    var cv = this.canvas = document.createElement('canvas'); cv.width = CW; cv.height = CH; this.ctx = cv.getContext('2d');
    var tex = this.tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; tex.anisotropy = r.capabilities.getMaxAnisotropy();
    var screen = new THREE.Mesh(flatUV(new THREE.ShapeGeometry(rrect(SW, SH, 0.085), 36), SW, SH), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    screen.position.z = D / 2 + 0.002; g.add(screen);

    var hole = new THREE.Mesh(new THREE.CircleGeometry(0.026, 40), new THREE.MeshBasicMaterial({ color: 0x020203 }));
    hole.position.set(0, SH / 2 - 0.045, D / 2 + 0.003); g.add(hole);
    var lens = new THREE.Mesh(new THREE.CircleGeometry(0.009, 24), new THREE.MeshBasicMaterial({ color: 0x1d2a45 }));
    lens.position.set(-0.006, SH / 2 - 0.041, D / 2 + 0.0032); g.add(lens);

    var gc = document.createElement('canvas'); gc.width = 64; gc.height = 256; var gx = gc.getContext('2d');
    var gr = gx.createLinearGradient(0, 0, 64, 256); gr.addColorStop(0, 'rgba(255,255,255,.30)'); gr.addColorStop(0.32, 'rgba(255,255,255,.05)'); gr.addColorStop(0.55, 'rgba(255,255,255,0)');
    gx.fillStyle = gr; gx.fillRect(0, 0, 64, 256);
    var glare = new THREE.Mesh(flatUV(new THREE.ShapeGeometry(rrect(SW, SH, 0.085), 36), SW, SH), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false, toneMapped: false }));
    glare.position.z = D / 2 + 0.0042; g.add(glare);

    var back = new THREE.Mesh(new THREE.ShapeGeometry(rrect(BW - 0.014, BH - 0.014, R - 0.008), 36), new THREE.MeshStandardMaterial({ color: 0xd9d4e6, metalness: 0.35, roughness: 0.38 }));
    back.rotation.y = Math.PI; back.position.z = -D / 2 - 0.0008; g.add(back);
    var ringMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc6, metalness: 0.9, roughness: 0.22 }), lensMat = new THREE.MeshStandardMaterial({ color: 0x07080c, metalness: 0.4, roughness: 0.08 });
    for (var k = 0; k < 3; k++) {
      var ring = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 48), ringMat); ring.rotation.x = Math.PI / 2;
      ring.position.set(-BW / 2 + 0.23, BH / 2 - 0.27 - k * 0.255, -D / 2 - 0.014); g.add(ring);
      var gl = new THREE.Mesh(new THREE.CircleGeometry(0.078, 40), lensMat); gl.rotation.y = Math.PI; gl.position.set(ring.position.x, ring.position.y, -D / 2 - 0.0295); g.add(gl);
    }
    var flash = new THREE.Mesh(new THREE.CircleGeometry(0.028, 24), new THREE.MeshStandardMaterial({ color: 0xf3efe2, roughness: 0.5 }));
    flash.rotation.y = Math.PI; flash.position.set(-BW / 2 + 0.43, BH / 2 - 0.27, -D / 2 - 0.002); g.add(flash);
    [[0.3, 0.55], [0.16, 0.16]].forEach(function (b) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(0.022, b[0], 0.045), frameMat); m.position.set(BW / 2 + 0.006, b[1], 0); g.add(m);
    });

    this.resize = function () {
      var w = el.clientWidth || 1, h = el.clientHeight || 1;
      r.setSize(w, h, false); cam.aspect = w / h;
      var t = Math.tan(cam.fov * Math.PI / 360);
      cam.position.set(0, 0, Math.max((BH * 1.12 / 2) / t, (BW * 1.5 / 2) / (t * cam.aspect)));
      cam.updateProjectionMatrix(); self.dirty = true;
    };
    this.resize();
    if (window.ResizeObserver) new ResizeObserver(this.resize).observe(el); else addEventListener('resize', this.resize);

    this.visible = true;
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; if (self.visible) self.loop(); }).observe(el);
    this.last = performance.now();
    this.loop = function () {
      if (self._raf) return;
      self._raf = requestAnimationFrame(function step(now) {
        self._raf = 0; if (!self.visible) return;
        var dt = Math.min(0.05, (now - self.last) / 1000); self.last = now;
        if (self.mix < 1) { self.mix = Math.min(1, self.mix + dt * 3.2); self.dirty = true; }
        if (self.dirty) { self.paint(); self.dirty = false; }
        var t = now / 1000, sway = reduce ? 0 : Math.sin(t * 0.8) * 0.05, bob = reduce ? 0 : Math.sin(t * 1.1) * 0.03;
        self.rx += (self.trx - self.rx) * Math.min(1, dt * 5); self.ry += (self.try_ + sway - self.ry) * Math.min(1, dt * 5);
        g.rotation.set(self.rx, self.ry, 0); g.position.y = bob;
        r.render(sc, cam);
        self.loop();
      });
    };
    this.paint = function () {
      var x = self.ctx;
      if (self.mix < 1 && self.prev >= 0) {
        compose(x, self.apps[self.prev], self.prevFrac);
        x.globalAlpha = self.mix; compose(x, self.apps[self.cur], self.frac); x.globalAlpha = 1;
      } else compose(x, self.apps[self.cur], self.frac);
      self.tex.needsUpdate = true;
    };
    this.paint(); this.loop();
  }
  Phone.prototype.show = function (i, frac, prog) {
    if (i !== this.cur) { this.prev = this.cur; this.prevFrac = this.frac; this.cur = i; this.mix = 0; }
    if (Math.abs(frac - this.frac) > 0.0005) { this.frac = frac; this.dirty = true; }
    if (prog != null) { this.try_ = -0.5 + prog * 0.7; this.trx = 0.06; }
    this.loop();
  };
  Phone.prototype.point = function (tx, ty) { this.try_ = -0.42 + tx * 0.7; this.trx = 0.07 - ty * 0.35; this.loop(); };

  // ── 붙이기 ─────────────────────────────────────────────────
  function appsFrom(el) {
    var cfg = JSON.parse(el.getAttribute('data-apps'));
    return Promise.all(cfg.map(function (a) {
      return Promise.all([img(a.content), img(a.nav)]).then(function (im) {
        var navY = a.navY != null ? a.navY : SRC_NAV_Y;   // 앱마다 탭 바 위치·높이가 다를 수 있다
        return { content: im[0], nav: im[1], cTop: a.top != null ? a.top : SRC_TOP, cBot: a.bottom === 'end' ? im[0].naturalHeight : (a.bottom || navY), navY: navY, navH: a.navH || NAV, bg: a.bg };
      });
    }));
  }
  function mount(el) {
    return appsFrom(el).then(function (apps) {
      var p = new Phone(el, apps, {});
      el.closest('[data-g-host]').classList.add('g-on');
      return p;
    });
  }
  function start() {
    if (!webgl()) return;
    var els = [].slice.call(document.querySelectorAll('.galaxy[data-apps]'));
    if (!els.length) return;
    loadThree(function () {
      if (!window.THREE) return;
      els.forEach(function (el) {
        mount(el).then(function (p) {
          if (el.id === 'g-story') { window.__gStory = p; if (window.__ssTick) window.__ssTick(); }
          if (el.id === 'g-hero') {
            var hero = el.closest('.hero');
            if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
              hero.addEventListener('pointermove', function (e) { var b = hero.getBoundingClientRect(); p.point((e.clientX - b.left) / b.width - 0.5, (e.clientY - b.top) / b.height - 0.5); });
              hero.addEventListener('pointerleave', function () { p.point(0, 0); });
            }
          }
        }).catch(function () { /* 이미지 실패 → CSS 휴대폰 유지 */ });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
