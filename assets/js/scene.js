/* ==========================================================================
   SmartChair — animazioni three.js
   - data-scene="neural": rete neurale 3D con impulsi che si propagano (homepage)
   - data-scene="waves":  campo di onde cerebrali in stile EEG (pagine interne)
   L'animazione si mette in pausa quando non è visibile e rispetta
   l'impostazione di sistema "riduci movimento" (mostra un fotogramma fisso).
   three.js è ospitato in /assets/vendor/three (licenza MIT).
   ========================================================================== */
import * as THREE from '../vendor/three/three.module.min.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const isSmall = () => window.innerWidth < 720;

const PALETTE = {
  blue: new THREE.Color('#1846ff'),
  glow: new THREE.Color('#4f8bff'),
  ice: new THREE.Color('#c9d8ff'),
  acid: new THREE.Color('#c6ff1a'),
  metal: new THREE.Color('#9aa3b2'),
};

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

/* --- Shader condivisi: punti morbidi e luminosi --------------------------- */
const pointVertex = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aBoost;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.8 + 0.2 * sin(uTime * 1.6 + aPhase);
    gl_PointSize = aSize * (1.0 + aBoost * 1.6) * twinkle * uPixelRatio * (60.0 / -mv.z);
    vColor = mix(aColor, vec3(1.0), aBoost * 0.6);
    vAlpha = clamp(0.5 + aBoost, 0.0, 1.0) * smoothstep(18.0, 4.0, -mv.z);
  }
`;
const pointFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float halo = pow(smoothstep(0.5, 0.0, d), 1.8);
    float core = smoothstep(0.14, 0.0, d);
    gl_FragColor = vec4(vColor + core * 0.5, (halo * 0.85 + core) * vAlpha);
  }
`;

function pointMaterial(pixelRatio) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
    vertexShader: pointVertex,
    fragmentShader: pointFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/* --- Base comune: renderer, ridimensionamento, pausa ---------------------- */
class BaseScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.clock = new THREE.Clock();
    this.elapsed = 2.5; // fotogramma iniziale già "vivo"
    this.pointer = new THREE.Vector2();
    this.pointerTarget = new THREE.Vector2();
    this.visible = true;
    this.running = false;

    this.build();
    this.resize();

    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; this.sync(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => this.sync());
    reduceMotion.addEventListener('change', () => this.sync());
    window.addEventListener('pointermove', (e) => {
      this.pointerTarget.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    }, { passive: true });

    canvas.classList.add('is-ready');
    this.sync();
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.layout(w, h);
    this.camera.updateProjectionMatrix();
    if (!this.running) this.draw(0);
  }

  shouldRun() { return this.visible && !document.hidden && !reduceMotion.matches; }

  sync() {
    const run = this.shouldRun();
    if (run && !this.running) {
      this.running = true;
      this.clock.getDelta();
      this.renderer.setAnimationLoop(() => this.draw(Math.min(this.clock.getDelta(), 0.05)));
    } else if (!run && this.running) {
      this.running = false;
      this.renderer.setAnimationLoop(null);
    }
  }

  draw(dt) {
    this.elapsed += dt;
    this.pointer.lerp(this.pointerTarget, 0.035);
    this.tick(dt, this.elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  /* da implementare nelle sottoclassi */
  build() {}
  layout() {}
  tick() {}
}

/* --- Rete neurale (homepage) ---------------------------------------------- */
class NeuralScene extends BaseScene {
  build() {
    const small = isSmall();
    const N = small ? 130 : 220;
    const K = 3;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Nodi distribuiti in due emisferi
    const nodes = [];
    while (nodes.length < N) {
      const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
      if (v.lengthSq() > 1) continue;
      v.normalize().multiplyScalar(0.62 + 0.38 * Math.sqrt(Math.random()));
      v.multiply(new THREE.Vector3(1.25, 0.95, 1.1)).multiplyScalar(2.2);
      v.x += Math.sign(v.x || 1) * 0.16;              // scissura tra gli emisferi
      v.y -= Math.max(0, -v.y) * 0.25;                // base leggermente schiacciata
      nodes.push(v);
    }
    this.nodes = nodes;

    // Connessioni: ogni nodo ai K vicini più prossimi
    const edgeSet = new Set();
    const neighbors = nodes.map(() => []);
    nodes.forEach((a, i) => {
      nodes
        .map((b, j) => ({ j, d: i === j ? Infinity : a.distanceToSquared(b) }))
        .sort((p, q) => p.d - q.d)
        .slice(0, K)
        .forEach(({ j }) => {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (edgeSet.has(key)) return;
          edgeSet.add(key);
          neighbors[i].push(j);
          neighbors[j].push(i);
        });
    });
    this.neighbors = neighbors;

    const edges = [...edgeSet].map((k) => k.split('-').map(Number));
    const linePos = new Float32Array(edges.length * 6);
    const lineCol = new Float32Array(edges.length * 6);
    const c = new THREE.Color();
    edges.forEach(([a, b], i) => {
      nodes[a].toArray(linePos, i * 6);
      nodes[b].toArray(linePos, i * 6 + 3);
      [a, b].forEach((n, k) => {
        c.copy(PALETTE.blue).lerp(PALETTE.ice, THREE.MathUtils.clamp((nodes[n].y + 2.2) / 4.4, 0, 1) * 0.5);
        c.toArray(lineCol, i * 6 + k * 3);
      });
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 3));
    this.lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.group.add(this.lines);

    // Punti dei nodi (alcuni verde acido: lo spirito open source)
    const nodePos = new Float32Array(N * 3);
    const nodeCol = new Float32Array(N * 3);
    const nodeSize = new Float32Array(N);
    const nodePhase = new Float32Array(N);
    this.nodeBoost = new Float32Array(N);
    nodes.forEach((v, i) => {
      v.toArray(nodePos, i * 3);
      const acid = Math.random() < 0.1;
      (acid ? PALETTE.acid : (Math.random() < 0.5 ? PALETTE.glow : PALETTE.ice)).toArray(nodeCol, i * 3);
      nodeSize[i] = (acid ? 1.6 : 1.0) * (0.9 + Math.random() * 0.9);
      nodePhase[i] = Math.random() * Math.PI * 2;
    });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute('aColor', new THREE.BufferAttribute(nodeCol, 3));
    nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(nodeSize, 1));
    nodeGeo.setAttribute('aPhase', new THREE.BufferAttribute(nodePhase, 1));
    this.boostAttr = new THREE.BufferAttribute(this.nodeBoost, 1).setUsage(THREE.DynamicDrawUsage);
    nodeGeo.setAttribute('aBoost', this.boostAttr);
    this.nodeMat = pointMaterial(this.pixelRatio);
    this.group.add(new THREE.Points(nodeGeo, this.nodeMat));

    // Impulsi che viaggiano lungo le sinapsi
    const P = small ? 22 : 40;
    this.pulses = [];
    const pPos = new Float32Array(P * 3);
    const pCol = new Float32Array(P * 3);
    const pSize = new Float32Array(P);
    const pPhase = new Float32Array(P);
    const pBoost = new Float32Array(P).fill(0.6);
    for (let i = 0; i < P; i++) {
      const from = Math.floor(Math.random() * N);
      this.pulses.push(this.makePulse(from, Math.random()));
      (Math.random() < 0.35 ? PALETTE.acid : PALETTE.ice).toArray(pCol, i * 3);
      pSize[i] = 1.0;
      pPhase[i] = Math.random() * Math.PI * 2;
    }
    const pGeo = new THREE.BufferGeometry();
    this.pulseAttr = new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage);
    pGeo.setAttribute('position', this.pulseAttr);
    pGeo.setAttribute('aColor', new THREE.BufferAttribute(pCol, 3));
    pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1));
    pGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhase, 1));
    pGeo.setAttribute('aBoost', new THREE.BufferAttribute(pBoost, 1));
    this.pulseMat = pointMaterial(this.pixelRatio);
    const pulsePoints = new THREE.Points(pGeo, this.pulseMat);
    pulsePoints.frustumCulled = false;
    this.group.add(pulsePoints);

    // Polvere di fondo
    const D = small ? 350 : 700;
    const dPos = new Float32Array(D * 3);
    const dCol = new Float32Array(D * 3);
    const dSize = new Float32Array(D);
    const dPhase = new Float32Array(D);
    for (let i = 0; i < D; i++) {
      const r = 4 + Math.random() * 7;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      dPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      dPos[i * 3 + 1] = r * Math.cos(ph) * 0.6;
      dPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      (Math.random() < 0.15 ? PALETTE.glow : PALETTE.metal).toArray(dCol, i * 3);
      dSize[i] = 0.35 + Math.random() * 0.5;
      dPhase[i] = Math.random() * Math.PI * 2;
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    dGeo.setAttribute('aColor', new THREE.BufferAttribute(dCol, 3));
    dGeo.setAttribute('aSize', new THREE.BufferAttribute(dSize, 1));
    dGeo.setAttribute('aPhase', new THREE.BufferAttribute(dPhase, 1));
    dGeo.setAttribute('aBoost', new THREE.BufferAttribute(new Float32Array(D), 1));
    this.dustMat = pointMaterial(this.pixelRatio);
    this.dust = new THREE.Points(dGeo, this.dustMat);
    this.scene.add(this.dust);

    this.tmp = new THREE.Vector3();
  }

  makePulse(from, progress = 0) {
    const options = this.neighbors[from];
    const to = options[Math.floor(Math.random() * options.length)];
    return { from, to, t: progress, speed: 0.45 + Math.random() * 0.7 };
  }

  layout(w, h) {
    const aspect = w / h;
    if (aspect < 1) {
      this.group.position.set(0, 1.2, 0);
      this.camera.position.set(0, 0, 10.5);
    } else {
      this.group.position.set(aspect > 1.6 ? 2.4 : 1.6, 0.1, 0);
      this.camera.position.set(0, 0, 8);
    }
    this.camera.lookAt(0, 0, 0);
  }

  tick(dt, time) {
    this.nodeMat.uniforms.uTime.value = time;
    this.pulseMat.uniforms.uTime.value = time;
    this.dustMat.uniforms.uTime.value = time;

    // Rotazione lenta + inclinazione seguendo il puntatore
    this.group.rotation.y = time * 0.07 + this.pointer.x * 0.35;
    this.group.rotation.x = Math.sin(time * 0.2) * 0.06 - this.pointer.y * 0.18;
    this.dust.rotation.y = time * 0.015;

    // Decadimento dell'attivazione dei nodi
    const boost = this.nodeBoost;
    for (let i = 0; i < boost.length; i++) boost[i] = Math.max(0, boost[i] - dt * 1.4);

    // Avanzamento degli impulsi: all'arrivo il nodo si accende e il segnale prosegue
    const pos = this.pulseAttr.array;
    this.pulses.forEach((p, i) => {
      p.t += dt * p.speed;
      if (p.t >= 1) {
        boost[p.to] = 1;
        Object.assign(p, this.makePulse(p.to));
      }
      this.tmp.lerpVectors(this.nodes[p.from], this.nodes[p.to], p.t).toArray(pos, i * 3);
    });
    this.pulseAttr.needsUpdate = true;
    this.boostAttr.needsUpdate = true;
  }
}

/* --- Onde cerebrali (pagine interne) -------------------------------------- */
const waveVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aPhase;
  varying float vHeight;
  varying float vFade;
  float wave(vec2 p, float t) {
    return sin(p.x * 0.55 + t * 0.7) * 0.42
         + sin(p.x * 1.35 - t * 1.1 + p.y * 0.7) * 0.16
         + sin(p.y * 0.9 + t * 0.45) * 0.22
         + sin((p.x + p.y) * 2.6 + t * 2.0) * 0.04;
  }
  void main() {
    vec3 pos = position;
    pos.y = wave(position.xz, uTime);
    vHeight = pos.y;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.4 + 0.6 * sin(aPhase + uTime)) * uPixelRatio * (18.0 / -mv.z);
    vFade = smoothstep(20.0, 3.0, -mv.z) * smoothstep(11.0, 6.0, abs(position.x));
  }
`;
const waveFragment = /* glsl */ `
  uniform vec3 uLow;
  uniform vec3 uHigh;
  uniform vec3 uAcid;
  varying float vHeight;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    float h = smoothstep(-0.6, 0.75, vHeight);
    vec3 col = mix(uLow, uHigh, h);
    col = mix(col, uAcid, smoothstep(0.62, 0.85, vHeight) * 0.85);
    gl_FragColor = vec4(col, a * vFade * (0.5 + h * 0.8));
  }
`;
const traceVertex = /* glsl */ `
  uniform float uTime;
  attribute float aT;
  varying float vT;
  float eeg(float x, float t) {
    return sin(x * 3.1 + t * 2.3) * 0.12 + sin(x * 7.3 - t * 3.7) * 0.06
         + sin(x * 13.0 + t * 5.1) * 0.03 + sin(x * 0.8 + t * 0.6) * 0.18;
  }
  void main() {
    vec3 pos = position;
    pos.y += eeg(position.x, uTime);
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
const traceFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOffset;
  varying float vT;
  void main() {
    float head = fract(uTime * 0.12 + uOffset);
    float dist = head - vT;
    if (dist < 0.0) dist += 1.0;
    float glow = exp(-dist * 9.0);
    float edge = smoothstep(0.0, 0.12, vT) * smoothstep(1.0, 0.88, vT);
    gl_FragColor = vec4(uColor, (0.12 + glow * 0.9) * edge);
  }
`;

class WavesScene extends BaseScene {
  build() {
    const small = isSmall();
    const cols = small ? 80 : 150;
    const rows = small ? 26 : 42;
    const pos = new Float32Array(cols * rows * 3);
    const phase = new Float32Array(cols * rows);
    let k = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        pos[k * 3] = (c / (cols - 1) - 0.5) * 22;
        pos[k * 3 + 1] = 0;
        pos[k * 3 + 2] = -12 + (r / (rows - 1)) * 13;
        phase[k] = Math.random() * Math.PI * 2;
        k++;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    this.waveMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.pixelRatio },
        uLow: { value: PALETTE.blue.clone() },
        uHigh: { value: PALETTE.ice.clone() },
        uAcid: { value: PALETTE.acid.clone() },
      },
      vertexShader: waveVertex,
      fragmentShader: waveFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, this.waveMat);
    points.frustumCulled = false;
    this.field = new THREE.Group();
    this.field.add(points);
    this.scene.add(this.field);

    // Tracciati EEG luminosi con un impulso che scorre
    this.traceMats = [];
    const S = 500;
    [
      { y: 1.35, z: 0.2, color: PALETTE.acid, offset: 0.0 },
      { y: 1.75, z: -1.6, color: PALETTE.glow, offset: 0.45 },
    ].forEach((cfg) => {
      const tp = new Float32Array(S * 3);
      const tt = new Float32Array(S);
      for (let i = 0; i < S; i++) {
        const u = i / (S - 1);
        tp[i * 3] = (u - 0.5) * 20;
        tp[i * 3 + 1] = cfg.y;
        tp[i * 3 + 2] = cfg.z;
        tt[i] = u;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(tp, 3));
      g.setAttribute('aT', new THREE.BufferAttribute(tt, 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uColor: { value: cfg.color.clone() }, uOffset: { value: cfg.offset } },
        vertexShader: traceVertex,
        fragmentShader: traceFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(g, m);
      line.frustumCulled = false;
      this.traceMats.push(m);
      this.field.add(line);
    });
  }

  layout(w, h) {
    const aspect = w / h;
    this.camera.fov = aspect < 1 ? 70 : 50;
    this.camera.position.set(0, 2.6, 6.5);
    this.camera.lookAt(0, 0.4, -2);
  }

  tick(dt, time) {
    this.waveMat.uniforms.uTime.value = time;
    this.traceMats.forEach((m) => { m.uniforms.uTime.value = time; });
    this.field.rotation.y = this.pointer.x * 0.08;
    this.field.position.y = this.pointer.y * 0.15;
  }
}

/* --- Avvio ---------------------------------------------------------------- */
const SCENES = { neural: NeuralScene, waves: WavesScene };

if (webglAvailable()) {
  document.querySelectorAll('canvas[data-scene]').forEach((canvas) => {
    const Scene = SCENES[canvas.dataset.scene];
    if (!Scene) return;
    try {
      new Scene(canvas);
    } catch (err) {
      // Senza WebGL resta lo sfondo sfumato in CSS: il sito funziona comunque.
      console.warn('[SmartChair] animazione non disponibile:', err);
    }
  });
}
