/* ══════════════════════════════════════════════════════════════════════
   Chúc mừng tốt nghiệp — Tuyết Nhi
   Không dùng thư viện ngoài: mọi hiệu ứng đều viết bằng JavaScript thuần.
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  /* ✎ TUỲ CHỈNH NHANH ─────────────────────────────────────────────── */
  const CONFIG = {
    music: {
      enabled: true,
      // Để trống  → nhạc hộp do trình duyệt tự tổng hợp (không cần file).
      // Muốn dùng bài hát riêng: chép file vào thư mục assets rồi điền, ví dụ 'assets/music.mp3'
      src: '',
      volume: 0.5,
    },
  };

  /* ───────────────────────── tiện ích ───────────────────────── */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const map = (v, a, b, c, d) => c + (d - c) * clamp((v - a) / (b - a));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];
  const ease = {
    outCubic: t => 1 - Math.pow(1 - t, 3),
    outQuart: t => 1 - Math.pow(1 - t, 4),
    outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  };
  const root = document.documentElement;
  const mq = q => window.matchMedia(q).matches;
  const env = {
    reduced: mq('(prefers-reduced-motion: reduce)'),
    fine: mq('(hover: hover) and (pointer: fine)'),
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };
  const docTop = el => el.getBoundingClientRect().top + window.scrollY;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  function tween({ dur = 1000, delay = 0, easing = ease.outCubic, update, done }) {
    let start = null, raf = 0, dead = false;
    const step = now => {
      if (dead) return;
      if (start === null) start = now + delay;
      const t = clamp((now - start) / dur);
      if (now >= start) update(easing(t), t);
      if (t < 1) raf = requestAnimationFrame(step);
      else if (done) done();
    };
    raf = requestAnimationFrame(step);
    return () => { dead = true; cancelAnimationFrame(raf); };
  }

  /* ───────────────────────── tách chữ ───────────────────────── */
  // Tách đoạn văn thành từng từ (giữ nguyên thẻ con như <em>, <span class="hl">)
  function splitWords(el, cls, innerCls) {
    const out = [];
    const walk = node => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const part of child.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); continue; }
            const w = document.createElement('span');
            w.className = cls;
            if (innerCls) {
              const wi = document.createElement('span');
              wi.className = innerCls;
              wi.textContent = part;
              w.appendChild(wi);
            } else w.textContent = part;
            frag.appendChild(w);
            out.push(w);
          }
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
      }
    };
    walk(el);
    return out;
  }

  // Gán chỉ số dòng cho từng từ để cả dòng trượt lên cùng lúc
  function assignLines(words) {
    let line = -1, lastTop = null;
    for (const w of words) {
      const t = w.offsetTop;
      if (lastTop === null || Math.abs(t - lastTop) > 6) { line++; lastTop = t; }
      w.style.setProperty('--l', line);
    }
  }

  // Tách từng ký tự nhưng vẫn giữ đúng khoảng cách (kerning) của font gốc
  const kernCache = {};
  function splitChars(el, startIndex) {
    const text = (el.textContent || '').normalize('NFC');
    const chars = Array.from(text);
    const cs = getComputedStyle(el);
    const key = text + '|' + cs.fontStyle;
    const visible = el.getClientRects().length > 0;
    let lefts = null;
    if (!kernCache[key] && visible && el.firstChild && el.firstChild.nodeType === 3) {
      const range = document.createRange();
      lefts = [];
      let off = 0;
      for (const ch of chars) {
        range.setStart(el.firstChild, off);
        range.setEnd(el.firstChild, off + ch.length);
        lefts.push(range.getBoundingClientRect().left);
        off += ch.length;
      }
    }
    el.textContent = '';
    const spans = chars.map((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.display = 'inline-block';
      s.style.setProperty('--i', startIndex + i);
      el.appendChild(s);
      return s;
    });
    if (lefts) {
      const fs = parseFloat(cs.fontSize) || 16;
      const kern = [0];
      for (let i = 1; i < spans.length; i++) {
        const natural = lefts[i] - lefts[i - 1];
        const actual = spans[i - 1].getBoundingClientRect().width;
        kern.push((natural - actual) / fs);
      }
      kernCache[key] = kern;
    }
    spans.forEach(s => { s.className = 'c'; s.style.display = ''; });
    return { spans, key };
  }
  function applyKerning(list) {
    for (const { spans, key } of list) {
      const kern = kernCache[key];
      if (!kern) continue;
      spans.forEach((s, i) => { if (Math.abs(kern[i]) > 0.002) s.style.marginLeft = kern[i].toFixed(4) + 'em'; });
    }
  }

  /* ───────────────────────── bộ máy cuộn ───────────────────────── */
  const S = { sy: 0, dsy: 0, vel: 0, vw: 0, vh: 0, t: 0, max: 1 };
  const scenes = [];
  const tickers = [];
  const addScene = s => { s.cur = -1; scenes.push(s); return s; };
  const TAU = env.touch && !env.fine ? 0.055 : 0.075;

  // Cuộn mượt cho chuột (máy tính). Trên điện thoại dùng cuộn gốc của trình duyệt.
  const Wheel = (() => {
    let target = 0, current = 0, running = false, lastSet = -1;
    const api = { locked: false };
    if (env.fine && !env.reduced) {
      window.addEventListener('wheel', e => {
        if (e.ctrlKey) return;
        e.preventDefault();
        if (api.locked || root.classList.contains('is-locked')) return;
        let d = e.deltaY;
        if (e.deltaMode === 1) d *= 36; else if (e.deltaMode === 2) d *= S.vh;
        if (!running) { current = target = window.scrollY; running = true; }
        target = clamp(target + d, 0, S.max);
      }, { passive: false });
      window.addEventListener('scroll', () => {
        if (running && Math.abs(window.scrollY - lastSet) > 6) running = false;   // người dùng kéo thanh cuộn / bấm phím
      }, { passive: true });
    }
    api.step = dt => {
      if (!running) return;
      current += (target - current) * (1 - Math.exp(-dt / 0.115));
      if (Math.abs(target - current) < 0.4) { current = target; running = false; }
      lastSet = current;
      window.scrollTo(0, current);
    };
    api.stop = () => { running = false; };
    return api;
  })();

  function measure() {
    S.vw = root.clientWidth;
    S.vh = window.innerHeight;
    for (const s of scenes) { s.measure(); s.cur = -1; }
    Chapters.measure();
    S.max = Math.max(1, root.scrollHeight - S.vh);
  }

  let lastNow = performance.now();
  function frame(now) {
    const dt = clamp((now - lastNow) / 1000, 0.001, 0.05);
    lastNow = now;
    Wheel.step(dt);
    const sy = window.scrollY;
    S.dsy = sy - S.sy;
    S.vel += (S.dsy / dt - S.vel) * Math.min(1, dt * 10);
    S.sy = sy;
    S.t += dt;
    const k = 1 - Math.exp(-dt / TAU);
    for (const s of scenes) {
      const raw = s.progress(sy);
      let cur = s.cur < 0 ? raw : s.cur + (raw - s.cur) * k;
      if (Math.abs(raw - cur) < 0.0002) cur = raw;
      if (cur !== s.cur) { s.cur = cur; s.update(cur, raw); }
    }
    for (const f of tickers) f(dt, now);
    requestAnimationFrame(frame);
  }

  /* ───────────────────────── hạt bụi vàng / tuyết ───────────────────────── */
  const FX = (() => {
    const cv = $('#fx');
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, lastW = 0;
    let level = 1, levelTarget = 1;
    const amb = [], sparks = [];
    const mouse = { x: -9999, y: -9999, lx: 0, ly: 0, acc: 0 };

    const mkSprite = (r, g, b) => {
      const s = document.createElement('canvas');
      s.width = s.height = 64;
      const c = s.getContext('2d');
      const grd = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, `rgba(${r},${g},${b},1)`);
      grd.addColorStop(0.22, `rgba(${r},${g},${b},.62)`);
      grd.addColorStop(0.55, `rgba(${r},${g},${b},.16)`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      c.fillStyle = grd;
      c.fillRect(0, 0, 64, 64);
      return s;
    };
    const sprites = { gold: mkSprite(244, 214, 156), white: mkSprite(255, 247, 238), rose: mkSprite(244, 168, 158) };
    const FLAKE = ['#f6e3bd', '#e2b866', '#fff3d6', '#e8a39b'];

    function make(init) {
      const z = Math.random();
      const bokeh = Math.random() > 0.66;
      return {
        x: rand(0, W), y: init ? rand(0, H) : -20, z, bokeh,
        r: bokeh ? rand(7, 14) + z * 14 : rand(1.2, 2.6) + z * 1.6,
        a: bokeh ? rand(0.05, 0.14) : rand(0.4, 0.95),
        vy: rand(5, 14) + z * 14, vx: rand(-4, 4),
        ph: rand(0, 6.283), sw: rand(0.3, 0.9), tw: rand(0.7, 2.4),
        sp: Math.random() < 0.66 ? 'gold' : Math.random() < 0.6 ? 'white' : 'rose',
      };
    }
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (Math.abs(W - lastW) > 2) {
        lastW = W;
        amb.length = 0;
        const n = env.reduced ? 14 : Math.round(clamp((W * H) / 24000, 24, 66));
        for (let i = 0; i < n; i++) amb.push(make(true));
      }
    }
    function burst(x, y, n, o = {}) {
      const sp = o.speed || [120, 520], life = o.life || [0.8, 1.7];
      const a0 = o.angle != null ? o.angle : 0, spread = o.spread != null ? o.spread : Math.PI * 2;
      for (let i = 0; i < n; i++) {
        const a = a0 + rand(-spread / 2, spread / 2), v = rand(sp[0], sp[1]) * (0.35 + Math.random() * 0.65);
        const flake = Math.random() < (o.flakes != null ? o.flakes : 0.4);
        const ttl = rand(life[0], life[1]);
        sparks.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: ttl, ttl, flake,
          r: flake ? rand(3, 7) : rand(1.6, 4.2), g: o.gravity != null ? o.gravity : 220, drag: o.drag || 0.955,
          rot: rand(0, 6.283), vr: rand(-9, 9), c: pick(FLAKE), sp: Math.random() < 0.7 ? 'gold' : 'white',
        });
      }
    }
    if (env.fine) {
      window.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        mouse.acc += Math.hypot(e.clientX - mouse.lx, e.clientY - mouse.ly);
        mouse.lx = mouse.x = e.clientX; mouse.ly = mouse.y = e.clientY;
        if (mouse.acc > 46 && !env.reduced && sparks.length < 260) {
          mouse.acc = 0;
          sparks.push({ x: e.clientX + rand(-4, 4), y: e.clientY + rand(-4, 4), vx: rand(-14, 14), vy: rand(-6, 26), life: 0.8, ttl: 0.8, flake: false, r: rand(1.2, 2.8), g: 40, drag: 0.94, rot: 0, vr: 0, c: '#fff', sp: 'gold' });
        }
      }, { passive: true });
    }
    function tick(dt) {
      level += (levelTarget - level) * Math.min(1, dt * 2.5);
      ctx.clearRect(0, 0, W, H);
      const span = H + 80;
      for (const p of amb) {
        p.y += p.vy * dt - S.dsy * (0.06 + p.z * 0.26);
        p.x += (p.vx + Math.sin(S.t * p.sw + p.ph) * 9) * dt;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 16900) {
          const d = Math.sqrt(d2) || 1, f = (1 - d2 / 16900) * 70 * dt;
          p.x += (dx / d) * f; p.y += (dy / d) * f;
        }
        p.y = (((p.y + 40) % span) + span) % span - 40;
        if (p.x > W + 30) p.x = -30; else if (p.x < -30) p.x = W + 30;
        const tw = p.bokeh ? 0.8 + 0.2 * Math.sin(S.t * p.tw * 0.4 + p.ph) : 0.5 + 0.5 * Math.sin(S.t * p.tw + p.ph);
        ctx.globalAlpha = p.a * tw * level;
        const r = p.bokeh ? p.r : p.r * 2.6;
        ctx.drawImage(sprites[p.sp], p.x - r, p.y - r, r * 2, r * 2);
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt;
        if (s.life <= 0) { sparks[i] = sparks[sparks.length - 1]; sparks.pop(); continue; }
        const dr = Math.pow(s.drag, dt * 60);
        s.vx *= dr; s.vy = s.vy * dr + s.g * dt;
        s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
        const a = clamp(s.life / s.ttl);
        if (s.flake) {
          ctx.globalAlpha = Math.min(1, a * 2.2);
          ctx.fillStyle = s.c;
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.rot);
          ctx.scale(1, Math.cos(s.rot * 1.7));
          ctx.fillRect(-s.r / 2, -s.r / 2, s.r, s.r * 0.62);
          ctx.restore();
        } else {
          ctx.globalAlpha = Math.min(1, a * 1.8);
          const r = s.r * 2.6 * (0.5 + a * 0.5);
          ctx.drawImage(sprites[s.sp], s.x - r, s.y - r, r * 2, r * 2);
        }
      }
      ctx.globalAlpha = 1;
    }
    return { resize, tick, burst, setLevel: v => { levelTarget = v; } };
  })();

  /* ───────────────────────── nền lụa (WebGL, không cần ảnh) ───────────────────────── */
  const Silk = (() => {
    let cv = $('#silk');
    let gl = null, uR, uT, uS, ok = false, n = 0;
    const api = { active: true };
    const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    const FRAG = `precision highp float;
uniform vec2 uR;uniform float uT;uniform float uS;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;mat2 m=mat2(.8,-.6,.6,.8);
  for(int i=0;i<4;i++){s+=a*noise(p);p=m*p*2.03+7.1;a*=.5;}return s;}
void main(){
  vec2 uv=gl_FragCoord.xy/uR;
  vec2 p=(gl_FragCoord.xy-.5*uR)/min(uR.x,uR.y);
  p.y-=uS;
  float t=uT*.04;
  vec2 q=vec2(fbm(p*1.15+vec2(0.,t)),fbm(p*1.15+vec2(5.2,1.3-t*.8)));
  vec2 r=vec2(fbm(p*1.5+2.2*q+vec2(1.7,9.2)+t*.5),fbm(p*1.5+2.2*q+vec2(8.3,2.8)-t*.4));
  float f=fbm(p*1.25+2.4*r);
  float band=abs(sin((f*4.2+r.x*1.8)*3.14159));
  float sheen=pow(1.-band,7.);
  vec3 c0=vec3(.046,.017,.022),c1=vec3(.215,.04,.06),c2=vec3(.46,.085,.1);
  vec3 col=mix(c0,c1,smoothstep(.22,.78,f));
  col=mix(col,c2,smoothstep(.5,1.,f)*dot(q,q)*.9);
  col+=vec3(.95,.74,.46)*sheen*.085*smoothstep(.3,.8,f);
  vec2 g=(uv-vec2(.5,.66))*vec2(uR.x/uR.y,1.);
  col+=vec3(.62,.24,.2)*.2*exp(-dot(g,g)*2.6);
  float v=length((uv-.5)*vec2(1.,.9));
  col*=mix(1.,.42,smoothstep(.25,.85,v));
  gl_FragColor=vec4(col,1.);
}`;
    function init() {
      try {
        gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' });
        if (!gl) return;
        const sh = (type, src) => {
          const s = gl.createShader(type);
          gl.shaderSource(s, src);
          gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
          return s;
        };
        const pr = gl.createProgram();
        gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
        gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link');
        gl.useProgram(pr);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, 'a');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        uR = gl.getUniformLocation(pr, 'uR'); uT = gl.getUniformLocation(pr, 'uT'); uS = gl.getUniformLocation(pr, 'uS');
        ok = true;
        cv.addEventListener('webglcontextlost', e => { e.preventDefault(); fallback(); });
      } catch (err) { fallback(); }
    }
    function fallback() {
      // WebGL không dùng được → để lại nền gradient CSS
      ok = false;
      if (cv && cv.tagName === 'CANVAS') {
        const d = document.createElement('div');
        d.className = cv.className; d.id = cv.id;
        cv.replaceWith(d); cv = d;
      }
    }
    function resize() {
      if (!ok) return;
      const sc = S.vw < 760 ? 0.44 : 0.5;
      cv.width = Math.max(2, Math.round(cv.clientWidth * sc));
      cv.height = Math.max(2, Math.round(cv.clientHeight * sc));
      gl.viewport(0, 0, cv.width, cv.height);
      draw();
    }
    function draw() {
      gl.uniform2f(uR, cv.width, cv.height);
      gl.uniform1f(uT, env.reduced ? 12 : S.t + 12);
      gl.uniform1f(uS, S.sy * 0.00024);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function tick() {
      if (!ok || !api.active) return;
      if ((n++ & 1) && !env.reduced) return;      // ~30fps là đủ cho nền
      draw();
    }
    api.init = init; api.resize = resize; api.tick = tick;
    return api;
  })();

  /* ───────────────────────── âm thanh ───────────────────────── */
  const Sound = (() => {
    const btn = $('#sound');
    let ctx = null, master = null, bus = null, noiseBuf = null, audioEl = null;
    let on = false, timer = 0, nextT = 0, bar = 0;
    const E = 0.37;                                    // độ dài một nốt móc đơn (giây) — nhịp 6/8
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    // Hợp âm C – G/B – Am – Em/G – F – C/E – Dm7 – G  ·  [nốt trầm, rải hợp âm, giai điệu [nốt, số phách]]
    const BARS = [
      [48, [55, 60, 64, 67, 64], [[76, 3], [79, 3]]],
      [47, [55, 59, 62, 67, 62], [[74, 4], [71, 1], [74, 1]]],
      [45, [52, 57, 60, 64, 60], [[72, 3], [76, 3]]],
      [43, [52, 55, 59, 64, 59], [[71, 6]]],
      [41, [48, 53, 57, 60, 57], [[69, 3], [72, 3]]],
      [40, [48, 52, 55, 60, 55], [[67, 3], [72, 2], [76, 1]]],
      [38, [45, 50, 53, 60, 53], [[77, 2], [76, 1], [74, 3]]],
      [43, [50, 55, 60, 59, 62], [[74, 6]]],
      [48, [55, 60, 64, 67, 64], [[79, 3], [84, 3]]],
      [47, [55, 59, 62, 67, 62], [[83, 3], [79, 3]]],
      [45, [52, 57, 60, 64, 60], [[81, 3], [76, 3]]],
      [43, [52, 55, 59, 64, 59], [[79, 6]]],
      [41, [48, 53, 57, 60, 57], [[77, 3], [81, 3]]],
      [40, [48, 52, 55, 60, 55], [[79, 3], [76, 3]]],
      [38, [45, 50, 53, 60, 53], [[74, 2], [77, 1], [81, 3]]],
      [43, [50, 55, 59, 62, 59], [[79, 3], [74, 3]]],
    ];

    function ensure() {
      if (ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        ctx = new AC();
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* iOS cũ */ }
        master = ctx.createGain();
        master.gain.value = 0;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
        master.connect(comp); comp.connect(ctx.destination);
        bus = ctx.createGain();
        bus.connect(master);
        // vang (reverb) tự tạo từ nhiễu tắt dần
        const len = Math.floor(ctx.sampleRate * 3.2);
        const ir = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const d = ir.getChannelData(ch);
          let y = 0;
          for (let i = 0; i < len; i++) {
            const x = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
            y += (x - y) * 0.32;
            d[i] = y;
          }
        }
        const rev = ctx.createConvolver();
        rev.buffer = ir;
        const wet = ctx.createGain();
        wet.gain.value = 0.55;
        bus.connect(rev); rev.connect(wet); wet.connect(master);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        return true;
      } catch (e) { ctx = null; return false; }
    }

    function voice(m, t, dur, vel, bright) {
      const f = mtof(m);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.012);
      g.gain.exponentialRampToValueAtTime(vel * 0.4, t + 0.22);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      g.connect(bus);
      const o1 = ctx.createOscillator();
      o1.type = 'sine'; o1.frequency.value = f; o1.connect(g);
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'sine'; o2.frequency.value = f * 2; g2.gain.value = 0.2 + (bright || 0) * 0.22;
      o2.connect(g2); g2.connect(g);
      const o3 = ctx.createOscillator(), g3 = ctx.createGain();
      o3.type = 'triangle'; o3.frequency.value = f * 1.003; g3.gain.value = 0.16;
      o3.connect(g3); g3.connect(g);
      for (const o of [o1, o2, o3]) { o.start(t); o.stop(t + dur + 0.05); }
    }
    function scheduleBar(i, t0) {
      const [bass, arp, mel] = BARS[i % BARS.length];
      const h = () => (Math.random() - 0.5) * 0.014;
      voice(bass, t0 + h(), 3.6, 0.15, 0);
      arp.forEach((m, k) => voice(m, t0 + (k + 1) * E + h(), 2.6, 0.068 + Math.random() * 0.02, 0));
      let off = 0;
      for (const [m, len] of mel) {
        voice(m, t0 + off * E + h(), Math.max(1.9, len * E + 1.7), 0.14, 0.5);
        off += len;
      }
      if (Math.random() < 0.3) voice(mel[0][0] + 12, t0 + 5 * E + h(), 1.6, 0.03, 1);
    }
    function pump() {
      if (!on || !ctx || audioEl) return;
      while (nextT < ctx.currentTime + 1.2) { scheduleBar(bar++, nextT); nextT += 6 * E; }
    }
    function setUI() {
      if (!btn) return;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
    }
    function start(withChime) {
      if (!CONFIG.music.enabled) { setUI(); return; }
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      on = true;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
      master.gain.linearRampToValueAtTime(CONFIG.music.volume * 2.3, t + 2.2);
      if (withChime) [72, 76, 79, 84, 88, 91].forEach((m, i) => voice(m, t + 0.03 + i * 0.075, 2.2, 0.085, 1));
      if (CONFIG.music.src) {
        if (!audioEl) { audioEl = new Audio(CONFIG.music.src); audioEl.loop = true; audioEl.volume = CONFIG.music.volume; }
        audioEl.play().catch(() => {});
      } else {
        nextT = t + (withChime ? 1.3 : 0.15);
        clearInterval(timer);
        timer = setInterval(pump, 280);
        pump();
      }
      setUI();
    }
    function stop() {
      on = false;
      clearInterval(timer);
      if (ctx) {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0.0001, t + 0.6);
      }
      if (audioEl) audioEl.pause();
      setUI();
    }
    // tiếng pháo hoa nhỏ nhẹ (chỉ khi đang bật nhạc)
    function boom(panX, big) {
      if (!on || !ctx) return;
      const t = ctx.currentTime, k = big || 1;
      const out = ctx.createGain();
      let dest = out;
      if (ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = clamp(panX * 2 - 1, -0.8, 0.8); out.connect(pn); pn.connect(bus); } else out.connect(bus);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * k, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.6);
      const nz = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = ctx.createGain();
      nz.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = rand(1800, 3800); bp.Q.value = 0.8;
      ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.06 * k, t + 0.02); ng.gain.exponentialRampToValueAtTime(0.0001, t + rand(0.5, 0.95));
      nz.connect(bp); bp.connect(ng); ng.connect(dest); nz.start(t, rand(0, 0.4)); nz.stop(t + 1);
    }
    if (btn) btn.addEventListener('click', () => (on ? stop() : start(false)));
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) { ctx.suspend(); if (audioEl) audioEl.pause(); }
      else if (on) { ctx.resume(); if (audioEl) audioEl.play().catch(() => {}); }
    });
    if (!CONFIG.music.enabled && btn) btn.style.display = 'none';
    return { start, stop, boom, get on() { return on; } };
  })();

  /* ───────────────────────── chương hiện tại + thanh tiến độ ───────────────────────── */
  const Chapters = (() => {
    const box = $('#chapter'), bar = $('#progress');
    const list = $$('[data-chapter]').map(el => ({ el, name: el.dataset.chapter, top: 0 }));
    let current = list.length ? list[0].name : '';
    function measure() {
      const sheet = $('#sheet');
      for (const c of list) c.top = c.el.id === 'finale' ? docTop(sheet) + sheet.offsetHeight : docTop(c.el);
    }
    function set(name) {
      if (name === current || !box) return;
      current = name;
      const old = box.lastElementChild;
      const neo = document.createElement('span');
      neo.textContent = name;
      neo.className = 'is-pre';
      box.appendChild(neo);
      void neo.offsetWidth;
      neo.className = '';
      if (old) { old.className = 'is-out'; old.style.position = 'absolute'; old.style.left = '0'; old.style.right = '0'; setTimeout(() => old.remove(), 750); }
    }
    function tick() {
      const y = S.sy + S.vh * 0.5;
      let name = list[0] ? list[0].name : '';
      for (const c of list) if (c.top <= y) name = c.name;
      set(name);
      if (bar) bar.style.transform = `scaleX(${clamp(S.sy / S.max).toFixed(4)})`;
    }
    return { measure, tick };
  })();

  /* ───────────────────────── HERO ───────────────────────── */
  const Hero = (() => {
    const el = $('#hero'), inner = $('#heroInner'), arch = $('#heroArch'), frameEl = $('.hero__frame'), img = $('#heroImg');
    const names = $$('.hero__name'), badge = $('#heroBadge'), meta = $('#heroMeta'), hint = $('#heroScroll');
    let p = 0, intro = 0, mx = 0, my = 0, tx = 0, ty = 0, done = false, lastP = -1;
    if (env.fine && !env.reduced) {
      window.addEventListener('pointermove', e => { tx = e.clientX / S.vw - 0.5; ty = e.clientY / S.vh - 0.5; }, { passive: true });
    }
    addScene({
      measure() { this.len = el.offsetHeight; },
      progress(sy) { return clamp(sy / this.len); },
      update(v) { p = v; },
    });
    function tick(dt) {
      if (p >= 1) return;
      const f = Math.min(1, dt * 4);
      mx += (tx - mx) * f; my += (ty - my) * f;
      // khi đứng yên: chốt các lớp vào đúng điểm ảnh màn hình để chữ và ảnh không bị nhoè
      const still = p === lastP && Math.abs(tx - mx) + Math.abs(ty - my) < 0.0006;
      lastP = p;
      const k = window.devicePixelRatio || 1;
      const px = v => (still ? Math.round(v * k) / k : v).toFixed(2);
      const breathe = env.reduced ? 0 : Math.sin(S.t * 0.32) * 0.012;
      const s = 1.07 + (1 - intro) * 0.3 + p * 0.14 + breathe;
      img.style.transform = `translate3d(${(-mx * 16).toFixed(2)}px,${(p * 9 - my * 1.4).toFixed(2)}%,0) scale(${s.toFixed(4)})`;
      const ay = -p * S.vh * 0.1;
      arch.style.transform = `translate3d(${px(mx * 12)}px,${px(ay + my * 10)}px,0)`;
      frameEl.style.transform = `translate3d(${px(mx * 24)}px,${px(ay * 1.3 + my * 20)}px,0)`;
      const ny = -p * S.vh * 0.24;
      for (const n of names) n.style.transform = `translate3d(${px(-mx * 30)}px,${px(ny - my * 18)}px,0)`;
      badge.style.transform = `translate3d(${px(mx * 42)}px,${px(-p * S.vh * 0.32 + my * 30)}px,0)`;
      meta.style.transform = `translate3d(0,${px(-p * S.vh * 0.3)}px,0)`;
      meta.style.opacity = clamp(1 - p * 2.8).toFixed(3);
      if (done) hint.style.opacity = clamp(1 - p * 8).toFixed(3);
      inner.style.opacity = p > 0.5 ? clamp(1 - (p - 0.5) / 0.42).toFixed(3) : '';
    }
    function play() {
      el.classList.add('is-live');
      tween({ dur: 3000, easing: ease.outExpo, update: v => { intro = v; } });
      setTimeout(() => { done = true; el.classList.add('is-done'); }, 3800);
    }
    return { tick, play };
  })();

  /* ───────────────────────── I — HÔM NAY ───────────────────────── */
  const Statement = (() => {
    const sec = $('#today'), sticky = $('.pin__sticky', sec), text = $('#statementText'), stats = $('#stats');
    let words = [], last = [], counted = false;
    function init() {
      words = splitWords(text, 'sw', null);
      last = words.map(() => -1);
    }
    function count() {
      $$('[data-count]', stats).forEach((el, i) => {
        const to = +el.dataset.count, pad = +(el.dataset.pad || 0);
        tween({ dur: 1900, delay: 150 + i * 180, easing: ease.outExpo, update: v => { el.textContent = String(Math.round(to * v)).padStart(pad, '0'); } });
      });
    }
    addScene({
      measure() { this.top = docTop(sec) - S.vh * 0.5; this.len = sec.offsetHeight - sticky.offsetHeight + S.vh * 0.5; },
      progress(sy) { return clamp((sy - this.top) / this.len); },
      update(p) {
        const n = words.length, head = map(p, 0.1, 0.72, -1, n + 2.5);
        for (let i = 0; i < n; i++) {
          const o = Math.round(clamp((head - i) / 2.5) * 50) / 50;
          if (o !== last[i]) { last[i] = o; words[i].style.opacity = (0.13 + 0.87 * o).toFixed(3); }
        }
        const show = p > 0.66;
        if (show !== stats.classList.contains('is-in')) {
          stats.classList.toggle('is-in', show);
          if (show && !counted) { counted = true; count(); }
        }
      },
    });
    return { init };
  })();

  /* ───────────────────────── II — KHOẢNH KHẮC (cuộn ngang) ───────────────────────── */
  (() => {
    const sec = $('#moments'), sticky = $('#hgalSticky'), track = $('#hgalTrack'), ghost = $('#hgalGhost'), bar = $('#hgalBar'), count = $('#hgalCount');
    const cards = $$('.hcard', track).map(el => ({ el, frame: $('.hcard__frame', el), img: $('img', el), x: 0, w: 0, iw: 0, active: false, near: false }));
    let vw = 0, dist = 0, ghostDist = 0, lastIdx = -1;
    const SPEED = 1.25;
    addScene({
      measure() {
        vw = sticky.clientWidth;
        const vh = sticky.offsetHeight;
        dist = Math.max(0, track.offsetWidth - vw);
        sec.style.height = Math.round(dist / SPEED + vh) + 'px';
        this.top = docTop(sec);
        this.len = Math.max(1, sec.offsetHeight - vh);
        for (const c of cards) { c.x = c.el.offsetLeft; c.w = c.el.offsetWidth; c.iw = c.img.offsetWidth; }
        ghostDist = Math.max(0, ghost.offsetWidth - vw);
      },
      progress(sy) { return clamp((sy - this.top) / this.len); },
      update(p) {
        const k = window.devicePixelRatio || 1;
        const x = Math.round(-p * dist * k) / k;          // chốt theo điểm ảnh màn hình → ảnh không nhoè
        track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
        ghost.style.transform = `translate3d(${(-p * ghostDist * 0.85 - vw * 0.03).toFixed(2)}px,-50%,0)`;
        bar.style.transform = `scaleX(${p.toFixed(4)})`;
        const zone = vw < 900 ? 0.44 : 0.3;
        let best = 0, bestD = 99;
        for (let i = 0; i < cards.length; i++) {
          const c = cards[i];
          const d = (c.x + c.w / 2 + x - vw / 2) / vw, ad = Math.abs(d);
          if (ad < bestD) { bestD = ad; best = i; }
          const near = ad < 1.7;                           // chỉ giữ lớp GPU cho các ảnh quanh màn hình (nhẹ bộ nhớ)
          if (near !== c.near) { c.near = near; c.el.classList.toggle('is-near', near); }
          if (ad < 1.3) {
            const dd = clamp(d, -1, 1);
            // ảnh ở giữa màn hình nằm phẳng tuyệt đối (nét nhất); chỉ nghiêng dần khi trôi ra mép
            const e = clamp((Math.abs(dd) - 0.22) / 0.78), t = Math.sign(dd) * e * e * (3 - 2 * e);
            if (!env.reduced) c.frame.style.transform = t ? `rotateY(${(t * 17).toFixed(2)}deg) translateZ(${(-Math.abs(t) * 80).toFixed(1)}px)` : 'none';
            c.img.style.transform = `translate3d(${(Math.round(-dd * 0.046 * c.iw * k) / k).toFixed(2)}px,0,0)`;
          }
          const act = ad < zone;
          if (act !== c.active) { c.active = act; c.el.classList.toggle('is-active', act); }
        }
        if (best !== lastIdx) { lastIdx = best; count.textContent = String(best + 1).padStart(2, '0'); }
      },
    });
  })();

  /* ───────────────────────── III — NHÂN VẬT CHÍNH (zoom xuyên ảnh) ───────────────────────── */
  (() => {
    const sec = $('#lead'), sticky = $('#zoomSticky'), veil = $('#zoomVeil'), label = $('#zoomLabel');
    const tiles = $$('.zoom__tile', sticky).map(el => ({ el, center: el.classList.contains('zoom__tile--center'), img: $('img', el) }));
    let W = 0, H = 0, Zmax = 4, quoteOn = false;
    const num = (cs, name, d) => { const v = parseFloat(cs.getPropertyValue(name)); return isNaN(v) ? d : v; };
    addScene({
      measure() {
        W = sticky.clientWidth; H = sticky.offsetHeight;
        for (const t of tiles) {
          const cs = getComputedStyle(t.el);
          t.x = (num(cs, '--x', 0) / 100) * W; t.y = (num(cs, '--y', 0) / 100) * H;
          t.w = (num(cs, '--w', 20) / 100) * W; t.h = (num(cs, '--h', 20) / 100) * H;
          t.d = num(cs, '--d', 1);
          if (t.center) { Zmax = Math.max(W / t.w, H / t.h) * 1.004; t.F = Zmax; } else t.F = 2;
          const lw = t.w * t.F, lh = t.h * t.F;
          t.el.style.width = lw.toFixed(1) + 'px'; t.el.style.height = lh.toFixed(1) + 'px';
          t.el.style.marginLeft = (-lw / 2).toFixed(1) + 'px'; t.el.style.marginTop = (-lh / 2).toFixed(1) + 'px';
          t.el.style.borderRadius = (12 * t.F).toFixed(1) + 'px';
        }
        this.top = docTop(sec);
        this.len = Math.max(1, sec.offsetHeight - H);
      },
      progress(sy) { return clamp((sy - this.top) / this.len); },
      update(p) {
        const zp = ease.inOutCubic(clamp(p / 0.62));
        const Z = 1 + (Zmax - 1) * zp;
        for (const t of tiles) {
          if (t.center) {
            t.el.style.transform = `translate3d(0,0,0) scale(${(Z / t.F).toFixed(5)})`;
            t.el.style.borderRadius = (12 * t.F * (1 - zp)).toFixed(1) + 'px';
            t.img.style.transform = `scale(${(1 + clamp((p - 0.5) / 0.5) * 0.07).toFixed(4)})`;
          } else {
            const zd = Math.pow(Z, t.d);
            t.el.style.transform = `translate3d(${(t.x * zd).toFixed(1)}px,${(t.y * zd).toFixed(1)}px,0) scale(${(zd / t.F).toFixed(4)})`;
          }
        }
        veil.style.opacity = clamp((p - 0.5) / 0.2).toFixed(3);
        label.style.opacity = clamp(1 - p * 7).toFixed(3);
        const q = p > 0.6;
        if (q !== quoteOn) { quoteOn = q; sec.classList.toggle('is-quote', q); }
      },
    });
  })();

  /* ───────────────────────── IV — ĐIỀU ANH MONG (thẻ xếp chồng) ───────────────────────── */
  (() => {
    const stack = $('#wishStack');
    const items = $$('.wish', stack).map(el => ({ el, card: $('.wish__card', el), D: -1 }));
    let top0 = 0, H = 1, gap = 0, stick = [];
    addScene({
      measure() {
        H = items[0].el.offsetHeight;
        gap = parseFloat(getComputedStyle(items[0].el).marginBottom) || 0;
        top0 = docTop(stack);
        stick = items.map(it => parseFloat(getComputedStyle(it.el).top) || 0);
        this.a = top0 - S.vh * 1.2;
        this.b = top0 + items.length * (H + gap) + S.vh * 1.2;
        items.forEach(it => { it.D = -1; });
      },
      progress(sy) { return clamp((sy - this.a) / (this.b - this.a)); },
      update() {
        const sy = S.sy;
        const q = items.map((it, j) => {
          if (j === 0) return 0;
          const tv = Math.max(top0 + j * (H + gap) - sy, stick[j]);
          return clamp(1 - (tv - stick[j]) / (H * 0.85));
        });
        for (let i = 0; i < items.length; i++) {
          let D = 0;
          for (let j = i + 1; j < items.length; j++) D += q[j];
          D = Math.round(D * 500) / 500;
          const it = items[i];
          if (D === it.D) continue;
          it.D = D;
          it.card.style.transform = `translate3d(0,${(-D * 5).toFixed(1)}px,0) scale(${(1 - 0.045 * D).toFixed(4)})`;
          it.card.style.setProperty('--dim', Math.min(0.58, D * 0.21).toFixed(3));
        }
      },
    });
  })();

  /* ───────────────────────── V — CHỒNG ẢNH POLAROID ───────────────────────── */
  const Deck = (() => {
    const deck = $('#deck'), countEl = $('#deckCount');
    const cards = $$('.polaroid', deck);
    const N = cards.length;
    let order = cards.slice();                       // order[0] = tấm trên cùng
    const meta = new Map(cards.map((c, i) => [c, { rot: parseFloat(c.dataset.rot) || 0, x: ((i * 37) % 17) - 8, y: ((i * 53) % 13) - 6 }]));
    let dealt = false, busy = false, shown = 0, dir = 1, drag = null;

    // màn hình mật độ thường: tấm trên cùng nằm thẳng để ảnh không bị nhoè do xoay; màn hình nét cao vẫn nghiêng nhẹ
    const topRot = m => ((window.devicePixelRatio || 1) < 2 ? 0 : m.rot * 0.35);
    const slot = (c, k) => {
      const m = meta.get(c), kk = Math.min(k, 5);
      return `translate3d(${m.x}px,${m.y - kk * 3}px,0) rotate(${(k === 0 ? topRot(m) : m.rot).toFixed(2)}deg) scale(${(1 - Math.min(k, 4) * 0.012).toFixed(3)})`;
    };
    function layout() {
      order.forEach((c, k) => {
        c.style.zIndex = N - k;
        c.style.transition = `transform .75s cubic-bezier(.2,.9,.3,1) ${Math.min(k, 4) * 18}ms`;
        c.style.transform = slot(c, k);
        c.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');
      });
      countEl.textContent = `${shown + 1} / ${N}`;
    }
    function prime() {
      order.forEach((c, k) => {
        const sgn = k % 2 ? 1 : -1;
        c.style.transition = 'none';
        c.style.zIndex = N - k;
        c.style.transform = `translate3d(${sgn * 70}px,${Math.round(window.innerHeight * 0.75)}px,0) rotate(${sgn * 26}deg)`;
      });
    }
    function deal() {
      if (dealt) return;
      dealt = true;
      deck.classList.add('is-dealt');
      void deck.offsetWidth;
      order.forEach((c, k) => {
        c.style.transition = `transform 1.25s cubic-bezier(.16,1,.3,1) ${(N - 1 - k) * 110}ms`;
        c.style.transform = slot(c, k);
      });
      countEl.textContent = `1 / ${N}`;
    }
    function next(sign, dy) {
      if (busy || !dealt) return;
      busy = true;
      if (!sign) { dir = -dir; sign = dir; }
      const c = order[0], W = deck.offsetWidth;
      c.style.transition = 'transform .5s cubic-bezier(.3,.6,.3,1)';
      c.style.transform = `translate3d(${(sign * W * 1.3).toFixed(0)}px,${((dy || 0) * 1.5 - 30).toFixed(0)}px,0) rotate(${sign * 26}deg)`;
      setTimeout(() => {
        order.push(order.shift());
        shown = (shown + 1) % N;
        layout();
        setTimeout(() => { busy = false; }, 360);
      }, 320);
    }
    function prev() {
      if (busy || !dealt) return;
      busy = true;
      const c = order[N - 1], W = deck.offsetWidth;
      c.style.transition = 'transform .42s cubic-bezier(.4,0,.6,1)';
      c.style.transform = `translate3d(${(-W * 1.2).toFixed(0)}px,-20px,0) rotate(-22deg)`;
      setTimeout(() => {
        order.unshift(order.pop());
        shown = (shown - 1 + N) % N;
        layout();
        setTimeout(() => { busy = false; }, 420);
      }, 300);
    }
    const settle = d => {
      d.c.classList.remove('is-drag');
      d.c.style.transition = 'transform .65s cubic-bezier(.3,1.45,.4,1)';
      d.c.style.transform = slot(d.c, 0);
    };
    deck.addEventListener('pointerdown', e => {
      if (busy || !dealt || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const c = order[0];
      if (!c.contains(e.target)) return;
      drag = { c, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, moved: false, lx: e.clientX, lt: performance.now(), vx: 0 };
      c.classList.add('is-drag');
      c.style.transition = 'none';
      try { c.setPointerCapture(e.pointerId); } catch (err) { /* không sao */ }
    });
    deck.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.x0; drag.dy = e.clientY - drag.y0;
      if (Math.abs(drag.dx) + Math.abs(drag.dy) > 7) drag.moved = true;
      const now = performance.now(), dtm = now - drag.lt;
      if (dtm > 4) { drag.vx = lerp(drag.vx, (e.clientX - drag.lx) / dtm, 0.6); drag.lx = e.clientX; drag.lt = now; }
      const m = meta.get(drag.c);
      drag.c.style.transform = `translate3d(${(m.x + drag.dx).toFixed(1)}px,${(m.y + drag.dy * 0.45).toFixed(1)}px,0) rotate(${(topRot(m) + drag.dx * 0.055).toFixed(2)}deg) scale(1.03)`;
    });
    deck.addEventListener('pointerup', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      d.c.classList.remove('is-drag');
      if (!d.moved) { next(0, 0); return; }
      if (Math.abs(d.dx) > deck.offsetWidth * 0.26 || Math.abs(d.vx) > 0.55) next(Math.sign(d.dx || d.vx) || 1, d.dy * 0.45);
      else settle(d);
    });
    deck.addEventListener('pointercancel', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      settle(d);
    });
    deck.addEventListener('dragstart', e => e.preventDefault());
    deck.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(1, 0); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    });
    $('#deckNext').addEventListener('click', () => next(1, 0));
    $('#deckPrev').addEventListener('click', prev);
    new IntersectionObserver((es, io) => {
      if (es.some(e => e.isIntersecting)) { deal(); io.disconnect(); }
    }, { threshold: 0.4 }).observe(deck);
    return { prime };
  })();

  /* ───────────────────────── VII — PHÁO HOA + TUNG MŨ ───────────────────────── */
  const Finale = (() => {
    const el = $('#finale'), sheet = $('#sheet'), cv = $('#fireworks'), ctx = cv.getContext('2d');
    const capsEl = $('#caps'), starsEl = $('#finaleStars'), fireBtn = $('#fireBtn'), topbar = $('#topbar');
    const NS = 'http://www.w3.org/2000/svg';
    let W = 0, H = 0, lastW = 0, lastH = 0, kScale = 1;
    let live = false, entered = false, auto = 1.2, idle = 0, clean = true, shots = 0;
    const rockets = [], sparks = [], flashes = [];
    const MAX = env.fine ? 1800 : 950;
    const PAL = [['#ffe6ae', '#ffc75f'], ['#ffc2c7', '#ff6f7d'], ['#fff8ea', '#ffe3b0'], ['#ff9a7a', '#ff4f55'], ['#f3ccff', '#ffd6a0'], ['#e3f3ff', '#b9dcff']];
    const KINDS = ['peony', 'peony', 'ring', 'willow', 'snow', 'peony'];

    const glow = document.createElement('canvas');
    glow.width = glow.height = 128;
    (() => {
      const c = glow.getContext('2d'), g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,244,220,1)'); g.addColorStop(0.3, 'rgba(255,214,160,.45)'); g.addColorStop(1, 'rgba(255,200,140,0)');
      c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    })();

    function resize() {
      const w = el.clientWidth, h = el.offsetHeight;
      if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2) return;
      lastW = w; lastH = h; W = w; H = h;
      const dpr = Math.min(window.devicePixelRatio || 1, env.fine ? 2 : 1.5);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      kScale = clamp(Math.min(W, H) / 760, 0.62, 1.35);
      // bầu trời sao
      starsEl.textContent = '';
      for (let layer = 0; layer < 2; layer++) {
        const sh = [], n = Math.round(clamp((W * H) / 16000, 40, 110));
        for (let i = 0; i < n; i++) {
          const big = Math.random() < 0.12;
          sh.push(`${rand(0, W).toFixed(0)}px ${(Math.pow(Math.random(), 1.5) * H * 0.92).toFixed(0)}px 0 ${big ? 0.8 : 0}px rgba(255,${(232 + Math.random() * 20) | 0},${(208 + Math.random() * 40) | 0},${rand(0.25, 0.9).toFixed(2)})`);
        }
        const i = document.createElement('i');
        i.style.boxShadow = sh.join(',');
        starsEl.appendChild(i);
      }
    }
    function launch(x, y, kind) {
      if (!W || rockets.length > 14) return;
      const sx = clamp(x + rand(-70, 70), 16, W - 16);
      rockets.push({ sx, x: sx, y: H + 14, tx: x, ty: y, t: 0, T: rand(0.72, 1.02), kind: kind || pick(KINDS), pal: pick(PAL), bend: rand(-26, 26) });
    }
    function spark(x, y, vx, vy, ttl, c, size, drag, g, tw) {
      if (sparks.length >= MAX) return;
      sparks.push({ x, y, vx, vy, life: ttl, ttl, c, s: size, drag, g, tw, ph: Math.random() * 6.283 });
    }
    function explode(x, y, kind, pal) {
      const k = kScale;
      flashes.push({ x, y, life: 0.16, ttl: 0.16, r: 120 * k });
      Sound.boom(x / W, kind === 'heart' ? 1.25 : 1);
      if (kind === 'heart') {
        const n = 130, sc = 15 * k;
        for (let i = 0; i < n; i++) {
          const t = (i / n) * Math.PI * 2;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          const j = rand(0.94, 1.06);
          spark(x, y, hx * sc * j, hy * sc * j, rand(1.7, 2.3), i % 3 ? '#ff6f7d' : '#ffd2d6', rand(1.8, 2.8), 0.948, 24, 0);
        }
        for (let i = 0; i < 26; i++) { const a = rand(0, 6.283), v = rand(20, 110) * k; spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(0.8, 1.4), '#fff1e2', 1.6, 0.95, 30, 1); }
        return;
      }
      const power = rand(300, 430) * k;
      if (kind === 'ring') {
        const n = 78, tilt = rand(0.45, 1), rot = rand(0, 3.14);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 6.283, cx = Math.cos(a), cy = Math.sin(a) * tilt;
          const vx = (cx * Math.cos(rot) - cy * Math.sin(rot)) * power * 0.9, vy = (cx * Math.sin(rot) + cy * Math.cos(rot)) * power * 0.9;
          spark(x, y, vx, vy, rand(1.2, 1.6), pal[i % 2], 2.2, 0.955, 60, 0);
        }
        for (let i = 0; i < 34; i++) { const a = rand(0, 6.283), v = rand(0.1, 0.45) * power; spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(0.9, 1.4), '#fff6e4', 1.7, 0.95, 50, 1); }
      } else if (kind === 'willow') {
        const n = 86;
        for (let i = 0; i < n; i++) { const a = rand(0, 6.283), v = Math.sqrt(Math.random()) * power * 0.86; spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(2, 2.9), i % 4 ? '#ffd27a' : '#fff0c8', rand(1.5, 2.3), 0.972, 150, 0); }
      } else if (kind === 'snow') {
        const n = 110;
        for (let i = 0; i < n; i++) { const a = rand(0, 6.283), v = Math.sqrt(Math.random()) * power; spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(1.5, 2.4), i % 3 ? '#f2f8ff' : '#bfe0ff', rand(1.5, 2.6), 0.955, 55, 1); }
      } else {
        const n = Math.round(rand(100, 140));
        for (let i = 0; i < n; i++) { const a = rand(0, 6.283), v = (0.35 + Math.sqrt(Math.random()) * 0.65) * power; spark(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(1.15, 1.9), pal[i % 2], rand(1.7, 2.7), 0.958, 85, i % 7 === 0 ? 1 : 0); }
      }
    }
    function tossCaps(n) {
      const w = el.clientWidth, h = el.offsetHeight;
      for (let i = 0; i < n; i++) {
        const s = document.createElementNS(NS, 'svg');
        s.setAttribute('viewBox', '0 0 64 56');
        const u = document.createElementNS(NS, 'use');
        u.setAttribute('href', '#cap-solid');
        s.appendChild(u);
        capsEl.appendChild(s);
        const x0 = rand(0.06, 0.94) * w - 37, x1 = x0 + rand(-0.14, 0.14) * w, x2 = x1 + (x1 - x0) * 0.9;
        const peak = rand(0.1, 0.5) * h, sc = rand(0.7, 1.4) * clamp(w / 900, 0.7, 1.25), r0 = rand(-40, 40);
        const spin = rand(220, 640) * (Math.random() < 0.5 ? -1 : 1);
        if (!s.animate) { s.remove(); continue; }
        const a = s.animate([
          { transform: `translate3d(${x0}px,${h + 90}px,0) rotate(${r0}deg) scale(${sc})`, opacity: 1, easing: 'cubic-bezier(.15,.75,.35,1)' },
          { transform: `translate3d(${x1}px,${peak}px,0) rotate(${r0 + spin * 0.55}deg) scale(${sc})`, opacity: 1, offset: 0.46, easing: 'cubic-bezier(.6,0,.85,.4)' },
          { transform: `translate3d(${x2}px,${h + 130}px,0) rotate(${r0 + spin}deg) scale(${sc})`, opacity: 1 },
        ], { duration: rand(2300, 3400), delay: rand(0, 700), fill: 'both' });
        a.onfinish = () => s.remove();
      }
    }
    function volley(n) {
      for (let i = 0; i < n; i++) setTimeout(() => launch(rand(0.14, 0.86) * W, rand(0.13, 0.46) * H), i * rand(240, 420));
      setTimeout(() => launch(W * 0.5, H * 0.3, 'heart'), n * 300 + 250);
    }
    function enter() {
      entered = true;
      el.classList.add('is-in');
      if (env.reduced) return;
      setTimeout(() => tossCaps(env.fine ? 14 : 10), 350);
      setTimeout(() => volley(5), 900);
      auto = 5.2;
    }
    function setLive(v) {
      if (v === live) return;
      live = v;
      el.classList.toggle('is-live', v);
      if (!v) { rockets.length = sparks.length = flashes.length = 0; ctx.clearRect(0, 0, W, H); clean = true; }
    }
    function tick(dt) {
      if (!live) return;
      if (entered && !document.hidden && !env.reduced) {
        auto -= dt;
        if (auto <= 0) {
          auto = rand(1.1, 2.5);
          launch(rand(0.12, 0.88) * W, rand(0.12, 0.5) * H, Math.random() < 0.14 ? 'heart' : null);
        }
      }
      if (!rockets.length && !sparks.length && !flashes.length) {
        idle += dt;
        if (idle > 0.9 && !clean) { ctx.clearRect(0, 0, W, H); clean = true; }
        if (clean) return;
      } else { idle = 0; clean = false; }

      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(0,0,0,${(1 - Math.exp(-dt * 10.5)).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.life -= dt;
        if (f.life <= 0) { flashes.splice(i, 1); continue; }
        ctx.globalAlpha = (f.life / f.ttl) * 0.09;
        ctx.drawImage(glow, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
      }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.t += dt;
        const u = clamp(r.t / r.T), e = 1 - Math.pow(1 - u, 2.2);
        r.x = lerp(r.sx, r.tx, u) + Math.sin(u * Math.PI) * r.bend;
        r.y = lerp(H + 14, r.ty, e);
        spark(r.x + rand(-1, 1), r.y + rand(0, 6), rand(-14, 14), rand(30, 80), rand(0.3, 0.55), '#ffe2b0', 1.5, 0.92, 40, 0);
        ctx.globalAlpha = 1;
        ctx.drawImage(glow, r.x - 7, r.y - 7, 14, 14);
        if (u >= 1) { rockets.splice(i, 1); explode(r.tx, r.ty, r.kind, r.pal); }
      }
      const t30 = S.t * 30;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt;
        if (s.life <= 0) { sparks[i] = sparks[sparks.length - 1]; sparks.pop(); continue; }
        const dr = Math.pow(s.drag, dt * 60);
        s.vx *= dr; s.vy = s.vy * dr + s.g * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
        const a = s.life / s.ttl;
        let al = a < 0.4 ? a / 0.4 : 1;
        if (s.tw) al *= 0.45 + 0.55 * Math.abs(Math.sin(t30 + s.ph));
        const sz = s.s * (0.55 + 0.45 * a);
        ctx.globalAlpha = al;
        ctx.fillStyle = s.c;
        ctx.fillRect(s.x - sz / 2, s.y - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    el.addEventListener('click', e => {
      if (!entered || e.target.closest('button')) return;
      const r = el.getBoundingClientRect();
      shots++;
      launch(e.clientX - r.left, Math.min(e.clientY - r.top, H * 0.8), shots % 3 === 0 ? 'heart' : null);
    });
    fireBtn.addEventListener('click', () => {
      const r = fireBtn.getBoundingClientRect();
      FX.burst(r.left + r.width / 2, r.top + r.height / 2, 40, { speed: [120, 420], gravity: 320, life: [0.7, 1.4], angle: -Math.PI / 2, spread: Math.PI * 1.1 });
      volley(6);
      tossCaps(8);
      auto = 3.6;
    });

    addScene({
      measure() { this.bottom = docTop(sheet) + sheet.offsetHeight; this.top = docTop(sheet); resize(); },
      progress(sy) { return clamp((sy + S.vh - this.bottom) / S.vh); },
      update(r) {
        setLive(r > 0.02);
        if (r > 0.5 && !entered) enter();
      },
    });
    // nền kem che hết màn hình → tạm nghỉ nền lụa, làm dịu hạt bụi
    tickers.push(() => {
      const sc = scenes[scenes.length - 1];
      if (sc.top == null) return;
      const topV = sc.top - S.sy, botV = sc.bottom - S.sy;
      Silk.active = topV > 0;
      if (topbar) topbar.classList.toggle('is-ink', topV < 24 && botV > 40);
      FX.setLevel(topV < S.vh * 0.45 && botV > S.vh * 0.55 ? 0.5 : 1);
    });
    return { tick };
  })();

  /* ───────────────────────── trình xem ảnh ───────────────────────── */
  const Lightbox = (() => {
    const lb = $('#lightbox'), frameEl = $('#lbFrame'), img = $('#lbImg'), cap = $('#lbCap');
    const items = $$('.hcard__frame[data-full]');
    let idx = -1, open = false, rect = null, kill = null, token = 0;
    const AR = 3 / 2;
    const target = () => {
      const vw = window.innerWidth, vh = window.innerHeight, small = vw < 760;
      const mw = vw * (small ? 0.94 : 0.84), mh = vh * (small ? 0.6 : 0.78);
      let w = mw, h = w / AR;
      if (h > mh) { h = mh; w = h * AR; }
      return { x: (vw - w) / 2, y: (vh - h) / 2 - (small ? 16 : 6), w, h, r: 8 };
    };
    const rectOf = el => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, r: Math.min(b.width, b.height) * 0.06 }; };
    const apply = r => {
      rect = r;
      frameEl.style.left = r.x.toFixed(1) + 'px'; frameEl.style.top = r.y.toFixed(1) + 'px';
      frameEl.style.width = r.w.toFixed(1) + 'px'; frameEl.style.height = r.h.toFixed(1) + 'px';
      frameEl.style.borderRadius = r.r.toFixed(1) + 'px';
    };
    const morph = (a, b, dur, done) => {
      if (kill) kill();
      kill = tween({ dur, easing: ease.outExpo, update: t => apply({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), r: lerp(a.r, b.r, t) }), done });
    };
    const inView = r => r.x < window.innerWidth && r.x + r.w > 0 && r.y < window.innerHeight && r.y + r.h > 0;
    function load(i) {
      const it = items[i], thumb = $('img', it), my = ++token;
      img.src = thumb.currentSrc || thumb.src;
      cap.textContent = ($('.hcard__cap', it.parentElement) || {}).textContent || '';
      const tg = target(), best = Pix.choose(it.dataset.full, tg.w, tg.h, 1).url;
      const full = new Image();
      let fell = false;
      full.onload = () => { if (my === token && open) img.src = full.src; };
      full.onerror = () => { if (!fell && best !== it.dataset.full) { fell = true; full.src = it.dataset.full; } };   // thiếu bản nét cao → dùng bản thường
      full.src = best;
    }
    function show(i) {
      if (open) return;
      open = true; idx = i;
      Wheel.locked = true; Wheel.stop();
      const it = items[i];
      lb.hidden = false;
      frameEl.style.opacity = '1';
      load(i);
      apply(rectOf(it));
      it.style.visibility = 'hidden';
      requestAnimationFrame(() => { lb.classList.add('is-open'); morph(rect, target(), 760); });
      $('#lbClose').focus({ preventScroll: true });
    }
    function close() {
      if (!open) return;
      open = false; token++;
      const it = items[idx], to = rectOf(it);
      lb.classList.remove('is-open');
      const fin = () => { lb.hidden = true; it.style.visibility = ''; Wheel.locked = false; };
      if (inView(to)) morph(rect, to, 560, fin);
      else { frameEl.style.transition = 'opacity .4s ease'; frameEl.style.opacity = '0'; setTimeout(() => { frameEl.style.transition = ''; fin(); }, 420); }
    }
    function go(d) {
      if (!open) return;
      items[idx].style.visibility = '';
      idx = (idx + d + items.length) % items.length;
      img.style.transition = 'opacity .22s ease';
      img.style.opacity = '0';
      setTimeout(() => { load(idx); img.style.opacity = '1'; }, 220);
    }
    let sx = null, swiped = false;
    const tapClose = () => { if (swiped) { swiped = false; return; } close(); };
    items.forEach((it, i) => it.addEventListener('click', () => show(i)));
    $('#lbBackdrop').addEventListener('click', tapClose);
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', () => go(-1));
    $('#lbNext').addEventListener('click', () => go(1));
    frameEl.addEventListener('click', tapClose);
    lb.addEventListener('pointerdown', e => { sx = e.clientX; swiped = false; });
    lb.addEventListener('pointerup', e => {
      if (sx == null) return;
      const d = e.clientX - sx;
      sx = null;
      if (Math.abs(d) > 60) { swiped = true; go(d < 0 ? 1 : -1); setTimeout(() => { swiped = false; }, 60); }
    });
    window.addEventListener('keydown', e => {
      if (!open) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if ([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) e.preventDefault();
    });
    window.addEventListener('resize', () => { if (open) apply(target()); });
    return { get open() { return open; } };
  })();

  /* ───────────────────────── con trỏ + nút hút chuột ───────────────────────── */
  if (env.fine) {
    const cur = $('#cursor'), dot = $('i', cur), ring = $('b', cur), lab = $('span', ring);
    let x = -100, y = -100, rx = -100, ry = -100, shown = false;
    window.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!shown) { shown = true; rx = x; ry = y; cur.classList.add('is-on'); }
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
    }, { passive: true });
    tickers.push(dt => {
      if (!shown) return;
      const k = 1 - Math.exp(-dt / 0.085);
      rx += (x - rx) * k; ry += (y - ry) * k;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
    });
    document.addEventListener('pointerover', e => {
      const t = e.target.closest ? e.target.closest('[data-cursor],a,button') : null;
      const label = t && t.dataset ? t.dataset.cursor : '';
      cur.classList.toggle('is-label', !!label);
      cur.classList.toggle('is-hover', !!t && !label);
      if (label) lab.textContent = label;
    });
    document.addEventListener('pointerdown', () => cur.classList.add('is-down'));
    document.addEventListener('pointerup', () => cur.classList.remove('is-down'));
    root.addEventListener('mouseleave', () => cur.classList.add('is-hidden'));
    root.addEventListener('mouseenter', () => cur.classList.remove('is-hidden'));

    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transition = 'transform .25s ease-out, color .5s ease, border-color .5s ease';
        el.style.transform = `translate3d(${((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * 0.36).toFixed(1)}px,0)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform .9s cubic-bezier(.3,1.6,.4,1), color .5s ease, border-color .5s ease';
        el.style.transform = '';
      });
    });
  }

  /* ───────────────────────── chọn bản ảnh đủ nét cho từng màn hình ─────────────────────────
     Mỗi ảnh có vài bản độ phân giải. Trang đo khung ảnh thật (tính theo điểm ảnh màn hình) rồi lấy
     bản NHỎ NHẤT mà vẫn đủ điểm ảnh: nét trên điện thoại / retina, vẫn nhẹ trên màn hình thường.
       l (1320) → full (2000) → xl (3000)        ảnh ngang nguyên khung
       p (900)  → p-hd (1350)                    ảnh cắt dọc 3:4
       hero (960) → hero-hd (1440)   ·   zoom-tall (900) → zoom-tall-hd (1620)
     HTML vẫn chỉ cần ghi bản thường (l / p / full …) như cũ.                                      */
  const Pix = (() => {
    const ladders = [
      { re: /(^|\/)l\/(\d+)\.webp$/, aspect: 1.5, steps: n => [[`l/${n}.webp`, 1320], [`full/${n}.webp`, 2000], [`xl/${n}.webp`, 3000]] },
      { re: /(^|\/)full\/(\d+)\.webp$/, aspect: 1.5, steps: n => [[`full/${n}.webp`, 2000], [`xl/${n}.webp`, 3000]] },
      { re: /(^|\/)p\/(\d+)\.webp$/, aspect: 0.75, steps: n => [[`p/${n}.webp`, 900], [`p-hd/${n}.webp`, 1350]] },
      { re: /(^|\/)(zoom-tall)\.webp$/, aspect: 0.5625, steps: () => [['zoom-tall.webp', 900], ['zoom-tall-hd.webp', 1620]] },
      { re: /(^|\/)(hero)\.webp$/, aspect: 0.75, steps: () => [['hero.webp', 960], ['hero-hd.webp', 1440]] },
    ];
    const density = () => {
      const save = navigator.connection && navigator.connection.saveData;      // người dùng bật tiết kiệm dữ liệu
      return Math.min(window.devicePixelRatio || 1, save ? 1.5 : 3);
    };
    function ladder(url) {
      for (const L of ladders) {
        const m = url.match(L.re);
        if (m) {
          const prefix = url.slice(0, m.index + m[1].length);
          return { aspect: L.aspect, steps: L.steps(m[2]).map(([file, w]) => ({ url: prefix + file, w })) };
        }
      }
      return null;
    }
    // khung boxW × boxH (px CSS, ảnh phủ kín khung) → bản nhỏ nhất có dư điểm ảnh theo hệ số `head`
    // (mặc định dư 8%; ảnh luôn co giãn nhẹ thì cần dư ~20% để GPU không làm mềm khi lấy mẫu lại)
    function choose(url, boxW, boxH, factor, head) {
      const L = url ? ladder(url) : null;
      if (!L || !boxW) return { url, w: 0 };
      const need = Math.max(boxW, boxH * L.aspect) * density() * (factor || 1) * (head || 1.08);
      for (const s of L.steps) if (s.w >= need) return s;
      return L.steps[L.steps.length - 1];
    }
    // [hệ số phóng to do hiệu ứng, hệ số dư điểm ảnh] của từng vị trí
    function factorOf(img) {
      if (img.id === 'heroImg') return [1.08, 1.2];
      if (img.closest('.zoom__tile--center')) return [1.07, 1.2];
      if (img.closest('.zoom__tile')) return [0.75, 1.08];   // khung bố cục gấp đôi kích thước hiển thị
      if (img.closest('.wish')) return [1.12, 1.08];
      return [1, 1.08];
    }
    // đường dẫn gốc ghi trong HTML (có xét <source media="…"> của thẻ <picture>)
    function baseOf(img) {
      const pic = img.parentElement && img.parentElement.tagName === 'PICTURE' ? img.parentElement : null;
      if (pic) {
        for (const s of $$('source', pic)) {
          const set = s.dataset.srcset;
          if (set && (!s.media || window.matchMedia(s.media).matches)) return set;
        }
      }
      return img.dataset.src || img.getAttribute('src');
    }
    function want(img) {
      const base = baseOf(img), f = factorOf(img);
      const c = choose(base, img.offsetWidth, img.offsetHeight, f[0], f[1]);
      return { base, url: c.url, w: c.w };
    }
    // đổi sang bản khác một cách êm: tải + giải mã xong mới thay
    function swap(img, w) {
      img._pix = w;
      const pre = new Image();
      pre.onload = () => {
        const go = () => { if (img._pix === w) img.src = w.url; };
        const d = pre.decode ? pre.decode() : null;
        if (d && d.then) d.then(go, go); else go();
      };
      pre.src = w.url;
    }
    // sau khi đổi kích thước cửa sổ / xoay máy / phóng to trình duyệt: nâng cấp nếu cần (không hạ cấp)
    function refresh() {
      for (const img of $$('img[data-src]')) {
        if (!img._pix) continue;                            // chưa tới lượt tải
        const w = want(img);
        if (w.base !== img._pix.base || w.w > img._pix.w) swap(img, w);
      }
      hero();
    }
    // ảnh hero nằm sẵn trong HTML → nếu màn hình cần thì chuyển sang bản nét cao
    const heroImg = $('#heroImg');
    const heroBase = heroImg ? heroImg.getAttribute('src') : '';
    function hero() {
      if (!heroImg || !heroBase) return;
      const f = factorOf(heroImg);
      const c = choose(heroBase, heroImg.offsetWidth, heroImg.offsetHeight, f[0], f[1]);
      const cur = heroImg._pix ? heroImg._pix.w : 0;
      if (c.url === heroBase || c.w <= cur) return;
      const w = { base: heroBase, url: c.url, w: c.w };
      if (heroImg.complete && heroImg.naturalWidth) { swap(heroImg, w); return; }
      heroImg._pix = w;
      heroImg.addEventListener('error', () => { if (heroImg._pix === w) { heroImg._pix = null; heroImg.src = heroBase; } }, { once: true });
      heroImg.src = w.url;
    }
    return { choose, want, refresh, hero };
  })();

  /* ───────────────────────── tải ảnh nền sau ───────────────────────── */
  function loadImg(img) {
    return new Promise(res => {
      const w = Pix.want(img);
      let triedBase = w.url === w.base;
      const finish = () => { img.onload = img.onerror = null; img.classList.add('is-loaded'); res(); };
      img.onload = () => {
        const d = img.decode ? img.decode() : null;
        if (d && d.then) d.then(finish, finish); else finish();
      };
      img.onerror = () => {
        if (triedBase) { finish(); return; }
        triedBase = true;                                   // thiếu bản nét cao → quay về bản thường
        img._pix = { base: w.base, url: w.base, w: 0 };
        img.src = w.base;
      };
      img._pix = w;
      img.src = w.url;
    });
  }
  async function loadQueue() {
    const imgs = $$('img[data-src]');
    let i = 0;
    const worker = async () => { while (i < imgs.length) await loadImg(imgs[i++]); };
    await Promise.all([worker(), worker(), worker()]);
  }
  function buildReel() {
    const tr = $('#reelTrack');
    if (!tr) return;
    const order = [1, 22, 4, 13, 27, 8, 16, 23, 19, 2, 26, 10, 21, 28, 6, 12, 25, 17, 3, 29, 14, 20, 24, 7, 15, 5, 18, 9, 11];
    const html = order.map(n => `<img src="assets/img/t/${String(n).padStart(2, '0')}.webp" alt="" width="360" height="240" decoding="async">`).join('');
    tr.innerHTML = html + html;
  }

  /* ───────────────────────── xem lại từ đầu ───────────────────────── */
  function replay() {
    Wheel.stop();
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;inset:0;z-index:180;background:#0d0607;opacity:0;transition:opacity .55s ease;pointer-events:none';
    document.body.appendChild(c);
    requestAnimationFrame(() => { c.style.opacity = '1'; });
    setTimeout(() => {
      window.scrollTo(0, 0);
      setTimeout(() => { c.style.opacity = '0'; setTimeout(() => c.remove(), 600); }, 120);
    }, 580);
  }
  $('#toTop').addEventListener('click', replay);
  $('.topbar__brand').addEventListener('click', e => { e.preventDefault(); replay(); });

  /* ───────────────────────── khởi động: tải trang → dấu sáp → mở ───────────────────────── */
  const intro = $('#intro'), seal = $('#seal'), iris = $('#iris');
  let opening = false;

  function openGate() {
    if (opening || !intro.classList.contains('is-ready')) return;
    opening = true;
    window.scrollTo(0, 0);
    const r = seal.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    intro.style.setProperty('--hx', cx.toFixed(1) + 'px');
    intro.style.setProperty('--hy', cy.toFixed(1) + 'px');
    intro.classList.add('is-opening');
    const cur = $('#cursor');
    if (cur) cur.classList.remove('is-label', 'is-hover');
    Sound.start(true);
    FX.burst(cx, cy, env.fine ? 120 : 70, { speed: [150, 640], life: [0.9, 2], gravity: 260 });
    const R = Math.hypot(Math.max(cx, S.vw - cx), Math.max(cy, window.innerHeight - cy)) + 150;
    setTimeout(() => Hero.play(), 420);
    setTimeout(() => { root.classList.remove('is-locked'); root.classList.add('is-open'); }, 1500);
    tween({
      dur: 2100, delay: 300, easing: ease.inOutCubic,
      update: v => {
        const h = v * R;
        intro.style.setProperty('--hole', h.toFixed(1) + 'px');
        const d = Math.max(0, h - 62) * 2;
        iris.style.width = iris.style.height = d.toFixed(1) + 'px';
        iris.style.opacity = (v < 0.08 ? v / 0.08 : 1 - v * v).toFixed(3);
      },
      done: () => { intro.remove(); root.classList.remove('is-locked'); root.classList.add('is-open'); },
    });
  }
  seal.addEventListener('click', openGate);
  intro.addEventListener('touchmove', e => { if (e.cancelable) e.preventDefault(); }, { passive: false });

  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const sample = 'Tuyết Nhi ễ ộ ử';
    const list = ['400 1em "Cormorant Garamond"', '500 1em "Cormorant Garamond"', 'italic 400 1em "Cormorant Garamond"', 'italic 500 1em "Cormorant Garamond"',
      '300 1em "Be Vietnam Pro"', '500 1em "Be Vietnam Pro"', '400 1em "Great Vibes"', '600 1em "Dancing Script"'];
    return Promise.all(list.map(f => document.fonts.load(f, sample).catch(() => {})));
  }
  function loadHero() {
    const img = $('#heroImg');
    if (img.complete && img.naturalWidth) return Promise.resolve();
    return new Promise(res => { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); });
  }

  let linesAll = [];
  function relayoutLines() { for (const ws of linesAll) assignLines(ws); }

  async function boot() {
    try { history.scrollRestoration = 'manual'; } catch (e) { /* bỏ qua */ }
    window.scrollTo(0, 0);
    S.vw = root.clientWidth; S.vh = window.innerHeight;
    FX.resize();
    Pix.hero();
    Silk.init(); Silk.resize();
    tickers.push(FX.tick, Silk.tick, Hero.tick, Finale.tick, Chapters.tick);
    requestAnimationFrame(frame);

    // thanh tải: bám theo tiến độ thật nhưng luôn chạy mượt
    const num = $('#loaderNum'), bar = $('#loaderBar');
    const tasks = [loadFonts(), loadHero(), wait(1500)];
    let done = 0, shownP = 0;
    const t0 = performance.now();
    tasks.forEach(t => t.then(() => { done++; }, () => { done++; }));
    const all = Promise.race([Promise.all(tasks), wait(9000)]);
    let finished = false;
    all.then(() => { finished = true; });
    await new Promise(res => {
      const step = () => {
        const real = finished ? 1 : (done / tasks.length) * 0.9;
        const cap = Math.min(1, (performance.now() - t0) / 1500);
        shownP += (Math.min(real, cap) - shownP) * 0.12;
        if (finished && shownP > 0.994) shownP = 1;
        num.textContent = String(Math.round(shownP * 100));
        bar.style.transform = `scaleX(${shownP.toFixed(4)})`;
        if (shownP >= 1) res(); else requestAnimationFrame(step);
      };
      step();
    });

    // tách chữ (sau khi font đã sẵn sàng để đo cho chuẩn)
    const charSets = [];
    const nameEls = $$('.hero__name');
    nameEls.sort((a, b) => b.getClientRects().length - a.getClientRects().length);   // lớp đang hiển thị đo trước
    for (const n of nameEls) {
      let i = 0;
      for (const w of $$('[data-chars]', n)) { const r = splitChars(w, i); i += r.spans.length; charSets.push(r); }
    }
    applyKerning(charSets);
    Statement.init();
    linesAll = $$('[data-lines]').map(el => splitWords(el, 'w', 'wi'));
    relayoutLines();
    Deck.prime();

    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }, { threshold: 0.16, rootMargin: '0px 0px -7% 0px' });
    $$('[data-reveal]').forEach(el => io.observe(el));

    measure();
    await wait(200);
    intro.classList.add('is-ready');
    loadQueue().then(buildReel);

    let rz = 0, lastW = S.vw;
    window.addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => {
        FX.resize();
        if (Math.abs(root.clientWidth - lastW) > 1) { lastW = root.clientWidth; relayoutLines(); }
        measure();
        Silk.resize();
        Pix.refresh();
      }, 140);
    });
    window.addEventListener('orientationchange', () => setTimeout(() => { FX.resize(); relayoutLines(); measure(); Silk.resize(); Pix.refresh(); }, 320));
    window.addEventListener('load', () => measure());
    // nếu chiều cao trang đổi (font/ảnh về muộn) thì đo lại các mốc cuộn
    if ('ResizeObserver' in window) {
      let lastH = document.body.offsetHeight, ro = 0;
      new ResizeObserver(() => {
        const hNow = document.body.offsetHeight;
        if (Math.abs(hNow - lastH) < 2) return;
        lastH = hNow;
        clearTimeout(ro);
        ro = setTimeout(() => { measure(); lastH = document.body.offsetHeight; }, 200);
      }).observe(document.body);
    }
  }

  boot();
})();
