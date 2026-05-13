/* ============================================================
   Bloch Sphere Visualizer — app.js
   Quantum state visualization with Three.js + vanilla JS
   ============================================================ */
'use strict';

// ── Configuration ───────────────────────────────────────────
const MAX_QUBITS = 6;
const QUBIT_COLORS = ['#e6584d','#4d8de6','#e6a84d','#8b5cf6','#06b6d4','#ec4899'];

// Circuit layout constants
const C_LABEL_W = 58;   // qubit label column width
const C_INIT_W  = 68;   // Init column width
const C_COL_W   = 66;   // gate column width
const C_ROW_H   = 50;   // row height per qubit
const C_VPAD    = 14;   // vertical padding top & bottom
const C_BOX_W   = 40;   // gate box width
const C_BOX_H   = 28;   // gate box height

// ── Global State ────────────────────────────────────────────
let qubits   = [];   // array of qubit objects
let gateOps  = [];   // ordered array of gate operations
let opId     = 0;    // unique op ID counter

// ── Three.js scene objects ───────────────────────────────────
let renderer, scene, camera, sphereMesh;
let needsRender = true;
let poleLabels  = [];   // { pos:Vector3, el:HTMLElement }
let qubitLabels = [];   // { qubitId, el }
let arrows      = {};   // qubitId → ArrowHelper

// ── Orbit controls ───────────────────────────────────────────
const orbit = {
  active: false, lastX: 0, lastY: 0,
  radius: 4.2, theta: Math.PI * 0.55, phi: Math.PI * 0.38
};

// ── Drag-on-sphere state ─────────────────────────────────────
let dragQubitId  = null;  // qubit being dragged on sphere
const raycaster  = new THREE.Raycaster();

// ── Pending gate-drop state ──────────────────────────────────
let pendingGate = null;  // { type, targetQubit, angle? }

// ── Circuit drag state ───────────────────────────────────────
let draggingGateType = null;
let circuitHoverRow  = -1;
let circuitHitAreas  = [];  // { x, y, w, h, opId }

// ── DOM refs ─────────────────────────────────────────────────
const addQubitBtn     = document.getElementById('addQubitBtn');
const qubitCountEl    = document.getElementById('qubitCount');
const sphereContainer = document.getElementById('sphereContainer');
const sphereHint      = document.getElementById('sphereHint');
const labelOverlay    = document.getElementById('labelOverlay');
const stateList       = document.getElementById('stateList');
const singleGateChips = document.getElementById('singleGateChips');
const twoQubitChips   = document.getElementById('twoQubitChips');
const circuitScroll   = document.getElementById('circuitScroll');
const circuitCanvas   = document.getElementById('circuitCanvas');
const circuitEmpty    = document.getElementById('circuitEmpty');
const clearBtn        = document.getElementById('clearBtn');
const entWarning      = document.getElementById('entWarning');
const anglePopup      = document.getElementById('anglePopup');
const angleInput      = document.getElementById('angleInput');
const angleCancel     = document.getElementById('angleCancel');
const angleConfirm    = document.getElementById('angleConfirm');
const controlPopup    = document.getElementById('controlPopup');
const controlList     = document.getElementById('controlList');
const controlCancel   = document.getElementById('controlCancel');
const legendCanvas    = document.getElementById('legendCanvas');

// ════════════════════════════════════════════════════════════
//   QUANTUM MATH
// ════════════════════════════════════════════════════════════

// Complex number helpers
function cadd(a, b)  { return { re: a.re+b.re, im: a.im+b.im }; }
function cmul(a, b)  { return { re: a.re*b.re - a.im*b.im, im: a.re*b.im + a.im*b.re }; }
function cabs2(a)    { return a.re*a.re + a.im*a.im; }
function cabs(a)     { return Math.sqrt(cabs2(a)); }
function cconj(a)    { return { re: a.re, im: -a.im }; }
function cfmt(a) {
  const re = Math.abs(a.re) < 0.005 ? 0 : +a.re.toFixed(2);
  const im = Math.abs(a.im) < 0.005 ? 0 : +a.im.toFixed(2);
  if (im === 0) return re.toFixed(2);
  if (re === 0) return im.toFixed(2) + 'i';
  return `(${re.toFixed(2)}${im >= 0 ? '+' : ''}${im.toFixed(2)}i)`;
}

// Apply 2×2 complex matrix to state [α, β]
function applyGate(mat, alpha, beta) {
  return {
    alpha: cadd(cmul(mat[0][0], alpha), cmul(mat[0][1], beta)),
    beta:  cadd(cmul(mat[1][0], alpha), cmul(mat[1][1], beta))
  };
}

// Normalize global phase so α is real and non-negative
function normalizePhase(alpha, beta) {
  const phase = Math.atan2(alpha.im, alpha.re);
  const ef = { re: Math.cos(-phase), im: Math.sin(-phase) };
  return { alpha: cmul(alpha, ef), beta: cmul(beta, ef) };
}

// Normalize state vector to unit length
function normalizeState(alpha, beta) {
  const n = Math.sqrt(cabs2(alpha) + cabs2(beta));
  if (n < 1e-10) return { alpha: { re:1, im:0 }, beta: { re:0, im:0 } };
  return { alpha: { re: alpha.re/n, im: alpha.im/n }, beta: { re: beta.re/n, im: beta.im/n } };
}

// State → Bloch vector (x, y, z)
function stateToBloch(alpha, beta) {
  const prod = cmul(cconj(alpha), beta);
  return {
    x: 2 * prod.re,
    y: 2 * prod.im,
    z: cabs2(alpha) - cabs2(beta)
  };
}

// Bloch (x,y,z) → State (α, β). Normalizes to unit sphere.
function blochToState(x, y, z) {
  const r = Math.sqrt(x*x + y*y + z*z);
  if (r < 1e-10) return { alpha: { re:1, im:0 }, beta: { re:0, im:0 } };
  const zn = Math.max(-1, Math.min(1, z/r));
  const theta = Math.acos(zn);
  const phi   = Math.atan2(y, x);
  return {
    alpha: { re: Math.cos(theta/2), im: 0 },
    beta:  { re: Math.cos(phi)*Math.sin(theta/2), im: Math.sin(phi)*Math.sin(theta/2) }
  };
}

// Map Bloch (x,y,z) → Three.js Vector3
// Bloch Z (|0⟩/|1⟩) is the vertical axis → Three.js Y
// Bloch X (|+⟩/|−⟩) → Three.js X
// Bloch Y (|+i⟩/|−i⟩) → Three.js Z
function blochToThree(bx, by, bz) {
  return new THREE.Vector3(bx, bz, by);
}

// Gate matrices
const M = {
  C: (v) => ({ re: v, im: 0 }),
  I: (v) => ({ re: 0, im: v })
};

const GATE_MAT = {
  X: () => [[{re:0,im:0},{re:1,im:0}],[{re:1,im:0},{re:0,im:0}]],
  Y: () => [[{re:0,im:0},{re:0,im:-1}],[{re:0,im:1},{re:0,im:0}]],
  Z: () => [[{re:1,im:0},{re:0,im:0}],[{re:0,im:0},{re:-1,im:0}]],
  H: () => {
    const f = 1/Math.SQRT2;
    return [[{re:f,im:0},{re:f,im:0}],[{re:f,im:0},{re:-f,im:0}]];
  },
  RX: (θ) => {
    const c = Math.cos(θ/2), s = Math.sin(θ/2);
    return [[{re:c,im:0},{re:0,im:-s}],[{re:0,im:-s},{re:c,im:0}]];
  },
  RY: (θ) => {
    const c = Math.cos(θ/2), s = Math.sin(θ/2);
    return [[{re:c,im:0},{re:-s,im:0}],[{re:s,im:0},{re:c,im:0}]];
  },
  RZ: (θ) => {
    const c = Math.cos(θ/2), s = Math.sin(θ/2);
    return [[{re:c,im:-s},{re:0,im:0}],[{re:0,im:0},{re:c,im:s}]];
  }
};

function getGateMat(op) {
  const g = op.type;
  if (g === 'X' || g === 'Y' || g === 'Z' || g === 'H') return GATE_MAT[g]();
  if (g === 'RX' || g === 'CRX') return GATE_MAT.RX(op.angle);
  if (g === 'RY' || g === 'CRY') return GATE_MAT.RY(op.angle);
  if (g === 'RZ' || g === 'CRZ') return GATE_MAT.RZ(op.angle);
  return null;
}

function isTwoQubit(type) {
  return ['CNOT','CRX','CRY','CRZ'].includes(type);
}
function isRotation(type) {
  return ['RX','RY','RZ','CRX','CRY','CRZ'].includes(type);
}

// Apply two-qubit gate (classical mixture approximation)
function applyTwoQubitGate(op, ctrlState, tgtState) {
  const p0 = cabs2(ctrlState.alpha);  // prob of |0⟩
  const p1 = cabs2(ctrlState.beta);   // prob of |1⟩
  // Get target Bloch before
  const b0 = stateToBloch(tgtState.alpha, tgtState.beta);

  // Apply gate to target (as if control=|1⟩)
  let applied;
  if (op.type === 'CNOT') {
    applied = applyGate(GATE_MAT.X(), tgtState.alpha, tgtState.beta);
  } else {
    const mat = getGateMat(op);
    applied = applyGate(mat, tgtState.alpha, tgtState.beta);
  }
  const b1 = stateToBloch(applied.alpha, applied.beta);

  // Classical mixture of Bloch vectors
  const mx = p0*b0.x + p1*b1.x;
  const my = p0*b0.y + p1*b1.y;
  const mz = p0*b0.z + p1*b1.z;

  return blochToState(mx, my, mz);
}

// ════════════════════════════════════════════════════════════
//   RECOMPUTE
// ════════════════════════════════════════════════════════════

function recompute() {
  if (!qubits.length) return;

  // Initialize each qubit to its initial state
  const states = {};
  for (const q of qubits) {
    states[q.id] = {
      alpha: { ...q.initAlpha },
      beta:  { ...q.initBeta }
    };
  }

  // Apply gate ops in order
  for (const op of gateOps) {
    if (isTwoQubit(op.type)) {
      const ctrlSt = states[op.control];
      const tgtSt  = states[op.target];
      if (!ctrlSt || !tgtSt) continue;
      const newTgt = applyTwoQubitGate(op, ctrlSt, tgtSt);
      states[op.target] = newTgt;
    } else {
      const st = states[op.qubit];
      if (!st) continue;
      const mat = getGateMat(op);
      if (!mat) continue;
      const res = applyGate(mat, st.alpha, st.beta);
      states[op.qubit] = normalizeState(res.alpha, res.beta);
    }
  }

  // Commit to qubits and update scene
  for (const q of qubits) {
    const s = states[q.id];
    if (!s) continue;
    const norm = normalizePhase(s.alpha, s.beta);
    q.alpha = norm.alpha;
    q.beta  = norm.beta;
    updateArrow(q);
  }

  updateStatePanel();
  redrawCircuit();
  needsRender = true;
}

// ════════════════════════════════════════════════════════════
//   THREE.JS SCENE
// ════════════════════════════════════════════════════════════

function initThreeScene() {
  const container = sphereContainer;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('threeCanvas'),
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);
  resizeRenderer();

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
  updateCameraFromOrbit();

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.38);
  dirLight.position.set(2, 3, 2);
  scene.add(dirLight);

  // Sphere (transparent, sage-tinted)
  const sphereGeo = new THREE.SphereGeometry(1, 64, 64);
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0xa8c5ab,
    transparent: true,
    opacity: 0.13,
    roughness: 0.35,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphereMesh);

  // Wireframe overlay
  const wireGeo = new THREE.WireframeGeometry(sphereGeo);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x7a9e7e, transparent: true, opacity: 0.09 });
  const wireframe = new THREE.LineSegments(wireGeo, wireMat);
  scene.add(wireframe);

  // Axes (Bloch X → Three.js X, red; Bloch Y → Three.js Z, green; Bloch Z → Three.js Y, blue)
  addAxisLine(new THREE.Vector3(1,0,0), new THREE.Vector3(-1,0,0), 0xcc4444);   // Bloch X
  addAxisLine(new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,-1), 0x44bb44);   // Bloch Y (Three Z)
  addAxisLine(new THREE.Vector3(0,1,0), new THREE.Vector3(0,-1,0), 0x4488ee);   // Bloch Z (Three Y)

  // Great circles (XY, XZ, YZ in Three.js coords)
  addGreatCircle('xz', 0x7a9e7e, 0.15);  // equatorial (Bloch XY plane)
  addGreatCircle('xy', 0x7a9e7e, 0.11);  // Bloch XZ plane
  addGreatCircle('yz', 0x7a9e7e, 0.11);  // Bloch YZ plane

  // Pole labels
  addPoleLabels();

  window.addEventListener('resize', onResize);
}

function addAxisLine(p1, p2, colorHex) {
  const geo = new THREE.BufferGeometry().setFromPoints([p1.clone().multiplyScalar(1.2), p2.clone().multiplyScalar(1.2)]);
  const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.65 });
  scene.add(new THREE.Line(geo, mat));
}

function addGreatCircle(plane, colorHex, opacity) {
  const pts = [];
  const N = 128;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    if (plane === 'xz') pts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    else if (plane === 'xy') pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
    else pts.push(new THREE.Vector3(0, Math.cos(a), Math.sin(a)));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineDashedMaterial({ color: colorHex, transparent: true, opacity, dashSize: 0.09, gapSize: 0.07 });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  scene.add(line);
}

function addPoleLabels() {
  const poles = [
    { text: '|0⟩',  pos: new THREE.Vector3(0,  1.38, 0)  },
    { text: '|1⟩',  pos: new THREE.Vector3(0, -1.38, 0)  },
    { text: '|+⟩',  pos: new THREE.Vector3( 1.38, 0, 0)  },
    { text: '|−⟩',  pos: new THREE.Vector3(-1.38, 0, 0)  },
    { text: '|+i⟩', pos: new THREE.Vector3(0, 0,  1.38)  },
    { text: '|−i⟩', pos: new THREE.Vector3(0, 0, -1.38)  }
  ];
  for (const p of poles) {
    const el = document.createElement('div');
    el.className = 'pole-label';
    el.textContent = p.text;
    labelOverlay.appendChild(el);
    poleLabels.push({ pos: p.pos, el });
  }
}

function updateLabelPositions() {
  const w = sphereContainer.clientWidth;
  const h = sphereContainer.clientHeight;
  const toScreen = (v) => {
    const c = v.clone().project(camera);
    return { x: (c.x * 0.5 + 0.5) * w, y: (-c.y * 0.5 + 0.5) * h, z: c.z };
  };

  for (const lbl of poleLabels) {
    const s = toScreen(lbl.pos);
    if (s.z >= 1.0) { lbl.el.style.display = 'none'; continue; }
    lbl.el.style.display = '';
    lbl.el.style.left = s.x + 'px';
    lbl.el.style.top  = s.y + 'px';
  }

  for (const ql of qubitLabels) {
    const q = qubits.find(q => q.id === ql.qubitId);
    if (!q) { ql.el.style.display = 'none'; continue; }
    const bloch = stateToBloch(q.alpha, q.beta);
    const r = Math.sqrt(bloch.x**2 + bloch.y**2 + bloch.z**2);
    const tipDir = blochToThree(bloch.x, bloch.y, bloch.z);
    tipDir.normalize().multiplyScalar(r + 0.08);
    const s = toScreen(tipDir);
    if (s.z >= 1.0) { ql.el.style.display = 'none'; continue; }
    ql.el.style.display = '';
    ql.el.style.left = s.x + 'px';
    ql.el.style.top  = s.y + 'px';
  }
}

function drawScaleLegend() {
  const ctx = legendCanvas.getContext('2d');
  const w = legendCanvas.width, h = legendCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w/2, cy = h/2, len = 22;
  const orig = new THREE.Vector3(0,0,0).project(camera);

  const axDefs = [
    { dir: new THREE.Vector3(1,0,0), color: '#cc4444', lbl: 'X' },
    { dir: new THREE.Vector3(0,0,1), color: '#44bb44', lbl: 'Y' },
    { dir: new THREE.Vector3(0,1,0), color: '#4488ee', lbl: 'Z' }
  ];

  // Sort back-to-front by z (so labels of back axes don't cover front)
  const projected = axDefs.map(ax => {
    const p = ax.dir.clone().project(camera);
    const dx = p.x - orig.x;
    const dy = -(p.y - orig.y);
    const d = Math.sqrt(dx*dx+dy*dy) || 1;
    return { ...ax, nx: dx/d, ny: dy/d, depth: p.z };
  }).sort((a,b) => b.depth - a.depth);

  for (const ax of projected) {
    const x2 = cx + ax.nx * len;
    const y2 = cy + ax.ny * len;
    ctx.strokeStyle = ax.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = ax.color;
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ax.lbl, cx + ax.nx*(len+9), cy + ax.ny*(len+9));
  }

  // Center dot
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI*2);
  ctx.fill();
}

function resizeRenderer() {
  const w = sphereContainer.clientWidth;
  const h = sphereContainer.clientHeight;
  renderer.setSize(w, h);
}

function onResize() {
  resizeRenderer();
  if (camera) {
    camera.aspect = sphereContainer.clientWidth / sphereContainer.clientHeight;
    camera.updateProjectionMatrix();
  }
  needsRender = true;
}

function updateCameraFromOrbit() {
  const { radius, theta, phi } = orbit;
  camera.position.set(
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta)
  );
  camera.lookAt(0, 0, 0);
}

// ════════════════════════════════════════════════════════════
//   QUBIT MANAGEMENT
// ════════════════════════════════════════════════════════════

function addQubit() {
  if (qubits.length >= MAX_QUBITS) return;

  const id    = qubits.length;
  const color = QUBIT_COLORS[id];

  const q = {
    id,
    color,
    alpha: { re:1, im:0 },
    beta:  { re:0, im:0 },
    initAlpha: { re:1, im:0 },
    initBeta:  { re:0, im:0 },
    draggedBeforeGates: false,
    highlighted: false
  };
  qubits.push(q);

  // Create Three.js ArrowHelper
  const dir = blochToThree(0, 0, 1).normalize();
  const arrow = new THREE.ArrowHelper(
    dir,
    new THREE.Vector3(0,0,0),
    0.92, parseInt(color.slice(1), 16),
    0.14, 0.07
  );
  arrow.line.material.linewidth = 2;
  arrow.renderOrder = 1;
  scene.add(arrow);
  arrows[id] = arrow;

  // Scale from 0 → 1 animation
  arrow.scale.set(0,0,0);
  let t = 0;
  const grow = setInterval(() => {
    t = Math.min(1, t + 0.08);
    const s = 1 - Math.pow(1-t, 3);
    arrow.scale.set(s, s, s);
    needsRender = true;
    if (t >= 1) clearInterval(grow);
  }, 16);

  // HTML qubit label on sphere
  const lbl = document.createElement('div');
  lbl.className = 'qubit-label';
  lbl.textContent = `q${id}`;
  lbl.style.color = color;
  lbl.style.borderColor = color + '66';
  labelOverlay.appendChild(lbl);
  qubitLabels.push({ qubitId: id, el: lbl });

  // Update UI
  updateStatePanel();
  updateAddBtn();
  sphereHint.classList.add('hidden');
  circuitEmpty.classList.add('hidden');
  recompute();
}

function updateArrow(q) {
  const arrow = arrows[q.id];
  if (!arrow) return;
  const bloch = stateToBloch(q.alpha, q.beta);
  const r = Math.sqrt(bloch.x**2 + bloch.y**2 + bloch.z**2);
  const threeDir = blochToThree(bloch.x, bloch.y, bloch.z);
  if (threeDir.length() < 1e-9) {
    arrow.setDirection(new THREE.Vector3(0,1,0));
  } else {
    arrow.setDirection(threeDir.normalize());
  }
  // Arrow length ∝ Bloch vector magnitude (1.0 for pure, shorter for mixed)
  const arrowLen = Math.max(0.05, Math.min(0.92, r * 0.92));
  arrow.setLength(arrowLen, 0.14 * arrowLen / 0.92, 0.07 * arrowLen / 0.92);
  needsRender = true;
}

function updateAddBtn() {
  const full = qubits.length >= MAX_QUBITS;
  addQubitBtn.disabled = full;
  addQubitBtn.title = full ? 'Maximum 6 qubits reached.' : '';
  qubitCountEl.textContent = `${qubits.length} / ${MAX_QUBITS} qubits`;
  // Disable two-qubit chips if < 2 qubits
  document.querySelectorAll('.gate-chip.two').forEach(c => {
    c.setAttribute('data-disabled', qubits.length < 2 ? 'true' : 'false');
    c.style.pointerEvents = qubits.length < 2 ? 'none' : '';
  });
}

// ════════════════════════════════════════════════════════════
//   STATE DISPLAY PANEL
// ════════════════════════════════════════════════════════════

function stateString(q) {
  const a = q.alpha, b = q.beta;
  const aStr = cfmt(a);
  const bStr = cfmt(b);
  const aIsZero = Math.abs(a.re) < 0.005 && Math.abs(a.im) < 0.005;
  const bIsZero = Math.abs(b.re) < 0.005 && Math.abs(b.im) < 0.005;
  if (aIsZero && bIsZero) return '0';
  if (aIsZero) return `${bStr}|1⟩`;
  if (bIsZero) return `${aStr}|0⟩`;
  return `${aStr}|0⟩ + ${bStr}|1⟩`;
}

function updateStatePanel() {
  stateList.innerHTML = '';
  if (!qubits.length) {
    stateList.innerHTML = '<p class="list-empty">No qubits added.</p>';
    return;
  }
  for (const q of qubits) {
    const row = document.createElement('div');
    row.className = 'state-row' + (q.highlighted ? ' highlighted' : '');
    row.dataset.qid = q.id;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', `Qubit q${q.id} state`);
    row.innerHTML = `
      <div class="state-dot" style="background:${q.color}"></div>
      <span class="state-lbl">q${q.id}</span>
      <span class="state-val">${stateString(q)}</span>
    `;
    row.addEventListener('click', () => highlightQubit(q.id));
    stateList.appendChild(row);
  }
}

function highlightQubit(id) {
  for (const q of qubits) {
    q.highlighted = (q.id === id);
    const arrow = arrows[q.id];
    if (arrow) {
      // Pulse effect: briefly scale up
      if (q.highlighted) {
        let t = 0;
        const pulse = setInterval(() => {
          t += 0.1;
          const s = 1 + 0.18 * Math.sin(t * Math.PI);
          arrow.scale.set(s,s,s);
          needsRender = true;
          if (t >= 1) { arrow.scale.set(1,1,1); clearInterval(pulse); needsRender = true; }
        }, 20);
      }
    }
  }
  updateStatePanel();
}

// ════════════════════════════════════════════════════════════
//   POINTER EVENTS — DRAG QUBIT ON SPHERE / ORBIT
// ════════════════════════════════════════════════════════════

function getMouseNDC(event) {
  const rect = sphereContainer.getBoundingClientRect();
  return new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
}

function getSphereIntersect(ndc) {
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObject(sphereMesh);
  return hits.length > 0 ? hits[0].point.normalize() : null;
}

function findNearestQubit(point) {
  if (!qubits.length) return -1;
  let minAngle = Infinity, bestId = -1;
  for (const q of qubits) {
    const bloch = stateToBloch(q.alpha, q.beta);
    const r = Math.sqrt(bloch.x**2 + bloch.y**2 + bloch.z**2);
    if (r < 0.1) continue;
    const dir = blochToThree(bloch.x, bloch.y, bloch.z).normalize();
    const angle = dir.angleTo(point.clone().normalize());
    if (angle < minAngle) { minAngle = angle; bestId = q.id; }
  }
  return (minAngle < 0.38 && bestId !== -1) ? bestId : -1;
}

document.getElementById('threeCanvas').addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const ndc = getMouseNDC(e);
  const hit = getSphereIntersect(ndc);
  if (hit) {
    const nearest = findNearestQubit(hit);
    if (nearest !== -1) {
      dragQubitId = nearest;
      e.preventDefault();
      return;
    }
  }
  // Start orbiting
  orbit.active = true;
  orbit.lastX = e.clientX;
  orbit.lastY = e.clientY;
  e.preventDefault();
});

document.getElementById('threeCanvas').addEventListener('pointermove', (e) => {
  if (dragQubitId !== null) {
    const ndc = getMouseNDC(e);
    const hit = getSphereIntersect(ndc);
    if (hit) {
      // hit is a unit vector in Three.js space (y=bloch_z, z=bloch_y, x=bloch_x)
      const bx = hit.x, by = hit.z, bz = hit.y;  // inverse of blochToThree
      const q = qubits.find(q => q.id === dragQubitId);
      if (q) {
        const { alpha, beta } = blochToState(bx, by, bz);
        const norm = normalizePhase(alpha, beta);
        q.alpha = q.initAlpha = norm.alpha;
        q.beta  = q.initBeta  = norm.beta;

        // Check if gates already applied
        const hasGates = gateOps.some(op => op.qubit === q.id || op.target === q.id || op.control === q.id);
        q.draggedBeforeGates = !hasGates || q.draggedBeforeGates;

        updateArrow(q);
        updateStatePanel();
        recompute();
      }
    }
    return;
  }
  if (!orbit.active) return;
  const dx = e.clientX - orbit.lastX;
  const dy = e.clientY - orbit.lastY;
  orbit.theta -= dx * 0.008;
  orbit.phi    = Math.max(0.08, Math.min(Math.PI - 0.08, orbit.phi + dy * 0.008));
  orbit.lastX  = e.clientX;
  orbit.lastY  = e.clientY;
  updateCameraFromOrbit();
  needsRender = true;
});

document.getElementById('threeCanvas').addEventListener('pointerup', () => {
  dragQubitId  = null;
  orbit.active = false;
});

document.getElementById('threeCanvas').addEventListener('wheel', (e) => {
  orbit.radius = Math.max(1.5, Math.min(10, orbit.radius + e.deltaY * 0.004));
  updateCameraFromOrbit();
  needsRender = true;
}, { passive: true });

// ════════════════════════════════════════════════════════════
//   GATE PALETTE
// ════════════════════════════════════════════════════════════

const SINGLE_GATES = ['X','Y','Z','H','RX','RY','RZ'];
const TWO_GATES    = ['CNOT','CRX','CRY','CRZ'];

function initGatePalette() {
  for (const g of SINGLE_GATES) {
    const chip = makeGateChip(g, 'single');
    singleGateChips.appendChild(chip);
  }
  for (const g of TWO_GATES) {
    const chip = makeGateChip(g, 'two');
    twoQubitChips.appendChild(chip);
  }
}

function makeGateChip(name, cls) {
  const el = document.createElement('div');
  el.className = `gate-chip ${cls}`;
  el.textContent = name;
  el.draggable = true;
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `${name} gate — drag to circuit`);
  el.addEventListener('dragstart', (e) => {
    draggingGateType = name;
    el.classList.add('dragging');
    e.dataTransfer.setData('text/plain', name);
    e.dataTransfer.effectAllowed = 'copy';
  });
  el.addEventListener('dragend', () => {
    draggingGateType = null;
    el.classList.remove('dragging');
  });
  return el;
}

// ════════════════════════════════════════════════════════════
//   CIRCUIT CANVAS
// ════════════════════════════════════════════════════════════

function circuitWidth() {
  const hasInit = qubits.some(q => q.draggedBeforeGates);
  const cols = gateOps.length;
  const minW = circuitScroll.clientWidth || 600;
  return Math.max(minW, C_LABEL_W + (hasInit ? C_INIT_W : 0) + cols * C_COL_W + C_COL_W);
}

function circuitHeight() {
  return Math.max(
    circuitScroll.clientHeight || 150,
    qubits.length * C_ROW_H + 2 * C_VPAD
  );
}

function getQubitY(idx) {
  return C_VPAD + idx * C_ROW_H + C_ROW_H / 2;
}

function columnX(colIdx) {
  const hasInit = qubits.some(q => q.draggedBeforeGates);
  return C_LABEL_W + (hasInit ? C_INIT_W : 0) + colIdx * C_COL_W + C_COL_W / 2;
}

function redrawCircuit() {
  if (!qubits.length) {
    circuitCanvas.width = 1;
    circuitCanvas.height = 1;
    circuitEmpty.classList.remove('hidden');
    return;
  }
  circuitEmpty.classList.add('hidden');

  const W = circuitWidth();
  const H = circuitHeight();
  circuitCanvas.width  = W;
  circuitCanvas.height = H;
  circuitCanvas.style.width  = W + 'px';
  circuitCanvas.style.height = H + 'px';

  const ctx = circuitCanvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  circuitHitAreas = [];
  const hasInit = qubits.some(q => q.draggedBeforeGates);

  // ── Draw wires ──
  for (let i = 0; i < qubits.length; i++) {
    const q = qubits[i];
    const y = getQubitY(i);
    // Qubit label
    ctx.font = '500 11px JetBrains Mono, monospace';
    ctx.fillStyle = q.color;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`q${q.id}`, C_LABEL_W - 8, y);
    // Wire line
    ctx.beginPath();
    ctx.moveTo(C_LABEL_W, y);
    ctx.lineTo(W - 20, y);
    ctx.strokeStyle = q.color + '55';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  // ── Draw Init columns ──
  if (hasInit) {
    for (let i = 0; i < qubits.length; i++) {
      const q = qubits[i];
      if (!q.draggedBeforeGates) continue;
      const y   = getQubitY(i);
      const bx  = C_LABEL_W + C_INIT_W/2;
      drawGateBox(ctx, bx, y, 'Init', q.color, true);
    }
  }

  // ── Draw gate operations ──
  for (let idx = 0; idx < gateOps.length; idx++) {
    const op = gateOps[idx];
    const cx = columnX(idx);

    if (isTwoQubit(op.type)) {
      const cy1 = getQubitY(op.control);
      const cy2 = getQubitY(op.target);
      const minY = Math.min(cy1, cy2);
      const maxY = Math.max(cy1, cy2);

      // Vertical connecting line
      ctx.beginPath();
      ctx.moveTo(cx, minY);
      ctx.lineTo(cx, maxY);
      ctx.strokeStyle = 'rgba(200,200,200,0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.stroke();

      // Control dot
      ctx.beginPath();
      ctx.arc(cx, cy1, 5, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(200,200,200,0.85)';
      ctx.fill();

      // Target symbol
      const tq = qubits.find(q => q.id === op.target);
      const tc = tq ? tq.color : '#aaa';
      if (op.type === 'CNOT') {
        drawCNOTTarget(ctx, cx, cy2, tc);
      } else {
        const shortName = op.type.slice(1); // CRX→RX etc.
        const label = shortName + (op.angle !== undefined ? `\n${angleLabel(op.angle)}` : '');
        drawGateBox(ctx, cx, cy2, op.type.slice(1), tc, false);
        if (op.angle !== undefined) {
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.fillStyle = tc;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(angleLabel(op.angle), cx, cy2 + 18);
        }
      }

      // Hit area for the gate (target)
      circuitHitAreas.push({ x: cx - C_BOX_W/2, y: cy2 - C_BOX_H/2, w: C_BOX_W, h: C_BOX_H, opId: op.id });

    } else {
      // Single-qubit gate
      const q = qubits.find(q => q.id === op.qubit);
      if (!q) continue;
      const cy = getQubitY(qubits.indexOf(q));
      const col = q.color;
      drawGateBox(ctx, cx, cy, op.type, col, false);
      if (op.angle !== undefined) {
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = col;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(angleLabel(op.angle), cx, cy + 18);
      }
      circuitHitAreas.push({ x: cx - C_BOX_W/2, y: cy - C_BOX_H/2, w: C_BOX_W, h: C_BOX_H, opId: op.id });
    }
  }

  // ── Hover highlight ──
  if (circuitHoverRow >= 0 && circuitHoverRow < qubits.length && draggingGateType) {
    const y = getQubitY(circuitHoverRow);
    const nextColX = columnX(gateOps.length);
    ctx.fillStyle = 'rgba(122,158,126,0.12)';
    ctx.strokeStyle = 'rgba(122,158,126,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(nextColX - C_BOX_W/2, y - C_BOX_H/2, C_BOX_W, C_BOX_H, 4)
      : ctx.rect(nextColX - C_BOX_W/2, y - C_BOX_H/2, C_BOX_W, C_BOX_H);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawGateBox(ctx, cx, cy, label, color, init) {
  const bw = C_BOX_W, bh = C_BOX_H;
  const x = cx - bw/2, y = cy - bh/2;
  ctx.fillStyle = init ? color + '22' : color + '1a';
  ctx.strokeStyle = color + (init ? 'aa' : '88');
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, 4);
  else ctx.rect(x, y, bw, bh);
  ctx.fill();
  ctx.stroke();
  ctx.font = `500 ${label.length > 2 ? '9' : '11'}px JetBrains Mono, monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy);
}

function drawCNOTTarget(ctx, cx, cy, color) {
  const r = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.strokeStyle = color + '99';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
  ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
  ctx.strokeStyle = color + 'cc';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function angleLabel(rad) {
  const quarters = [
    [Math.PI/4, 'π/4'], [Math.PI/2, 'π/2'], [Math.PI, 'π'],
    [3*Math.PI/2, '3π/2'], [2*Math.PI, '2π'], [-Math.PI, '-π'],
    [-Math.PI/2, '-π/2'], [-Math.PI/4, '-π/4']
  ];
  for (const [v,l] of quarters) {
    if (Math.abs(rad - v) < 0.001) return l;
  }
  return rad.toFixed(2);
}

// ════════════════════════════════════════════════════════════
//   CIRCUIT DRAG-AND-DROP
// ════════════════════════════════════════════════════════════

function getRowFromEvent(e) {
  const rect = circuitCanvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const idx = Math.floor((y - C_VPAD) / C_ROW_H);
  return (idx >= 0 && idx < qubits.length) ? idx : -1;
}

circuitCanvas.addEventListener('dragover', (e) => {
  if (!qubits.length || !draggingGateType) return;
  // Check two-qubit gate with < 2 qubits
  if (isTwoQubit(draggingGateType) && qubits.length < 2) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  const row = getRowFromEvent(e);
  if (row !== circuitHoverRow) {
    circuitHoverRow = row;
    redrawCircuit();
  }
});

circuitCanvas.addEventListener('dragleave', () => {
  circuitHoverRow = -1;
  redrawCircuit();
});

circuitCanvas.addEventListener('drop', (e) => {
  e.preventDefault();
  circuitHoverRow = -1;
  const gateType = e.dataTransfer.getData('text/plain') || draggingGateType;
  if (!gateType || !qubits.length) return;
  const row = getRowFromEvent(e);
  if (row < 0) return;
  const targetQubit = qubits[row];
  if (!targetQubit) return;
  handleGateDrop(gateType, targetQubit.id);
});

function handleGateDrop(gateType, targetQubitId) {
  if (isTwoQubit(gateType)) {
    if (qubits.length < 2) return;
    pendingGate = { type: gateType, targetQubit: targetQubitId };
    if (isRotation(gateType)) {
      openAnglePopup((angle) => {
        pendingGate.angle = angle;
        openControlPopup(targetQubitId);
      });
    } else {
      openControlPopup(targetQubitId);
    }
  } else if (isRotation(gateType)) {
    pendingGate = { type: gateType, targetQubit: targetQubitId };
    openAnglePopup((angle) => {
      commitGate({ type: gateType, qubit: targetQubitId, angle });
    });
  } else {
    commitGate({ type: gateType, qubit: targetQubitId });
  }
}

function commitGate(spec) {
  const op = { id: opId++, ...spec };
  gateOps.push(op);
  pendingGate = null;
  redrawCircuit();
  recompute();
  // Show entanglement warning if two-qubit gate was just used
  if (isTwoQubit(spec.type)) {
    showEntanglementWarning();
  }
}

// Right-click to remove gate
circuitCanvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const rect = circuitCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  for (const area of circuitHitAreas) {
    if (mx >= area.x && mx <= area.x + area.w && my >= area.y && my <= area.y + area.h) {
      gateOps = gateOps.filter(op => op.id !== area.opId);
      recompute();
      return;
    }
  }
});

function showEntanglementWarning() {
  entWarning.classList.add('show');
  setTimeout(() => entWarning.classList.remove('show'), 4000);
}

// ════════════════════════════════════════════════════════════
//   ANGLE POPUP
// ════════════════════════════════════════════════════════════

let angleCallback = null;

function openAnglePopup(cb) {
  angleCallback = cb;
  angleInput.value = '';
  document.querySelectorAll('.preset.selected').forEach(p => p.classList.remove('selected'));
  anglePopup.classList.remove('hidden');
  angleInput.focus();
}

function closeAnglePopup() {
  anglePopup.classList.add('hidden');
  angleCallback = null;
  pendingGate   = null;
}

document.querySelectorAll('.preset').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.preset.selected').forEach(p => p.classList.remove('selected'));
    btn.classList.add('selected');
    angleInput.value = btn.dataset.val;
  });
});

angleConfirm.addEventListener('click', () => {
  const val = parseFloat(angleInput.value);
  if (isNaN(val)) { angleInput.focus(); angleInput.style.borderColor = '#e6584d'; return; }
  angleInput.style.borderColor = '';
  const cb = angleCallback;
  anglePopup.classList.add('hidden');
  angleCallback = null;
  if (cb) cb(val);
});

angleCancel.addEventListener('click', closeAnglePopup);
anglePopup.addEventListener('click', (e) => { if (e.target === anglePopup) closeAnglePopup(); });
angleInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') angleConfirm.click(); });

// ════════════════════════════════════════════════════════════
//   CONTROL QUBIT POPUP
// ════════════════════════════════════════════════════════════

function openControlPopup(targetId) {
  controlList.innerHTML = '';
  const targets = qubits.filter(q => q.id !== targetId);
  if (!targets.length) { pendingGate = null; return; }

  for (const q of targets) {
    const btn = document.createElement('button');
    btn.className = 'ctrl-opt';
    btn.setAttribute('role', 'listitem');
    btn.innerHTML = `
      <div class="ctrl-dot" style="background:${q.color}"></div>
      <span class="ctrl-name">q${q.id}</span>
      <span class="ctrl-state">${stateString(q)}</span>
    `;
    btn.addEventListener('click', () => {
      closeControlPopup();
      const tgt = pendingGate ? pendingGate.targetQubit : targetId;
      commitGate({
        type:    pendingGate ? pendingGate.type : 'CNOT',
        control: q.id,
        target:  tgt,
        angle:   pendingGate ? pendingGate.angle : undefined
      });
    });
    controlList.appendChild(btn);
  }
  controlPopup.classList.remove('hidden');
}

function closeControlPopup() {
  controlPopup.classList.add('hidden');
  pendingGate = null;
}

controlCancel.addEventListener('click', closeControlPopup);
controlPopup.addEventListener('click', (e) => { if (e.target === controlPopup) closeControlPopup(); });

// ════════════════════════════════════════════════════════════
//   TOOLBAR BUTTONS
// ════════════════════════════════════════════════════════════

addQubitBtn.addEventListener('click', addQubit);

clearBtn.addEventListener('click', () => {
  gateOps = [];
  // Reset all qubits to initial states
  for (const q of qubits) {
    q.alpha = { ...q.initAlpha };
    q.beta  = { ...q.initBeta };
    updateArrow(q);
  }
  updateStatePanel();
  redrawCircuit();
  needsRender = true;
});

document.getElementById('infoBtn').addEventListener('click', () => {
  alert('Bloch Sphere Limitation:\n\nThe Bloch sphere represents individual single-qubit states only. Quantum entanglement between qubits cannot be visualized here.\n\nFor two-qubit gates (CNOT, CRX, CRY, CRZ), a classical mixture approximation is used:\nThe target qubit\'s Bloch vector is updated as:\n  |α_c|² × target + |β_c|² × gate(target)\nwhere α_c and β_c are the control qubit\'s amplitudes.');
});

// ════════════════════════════════════════════════════════════
//   ANIMATION LOOP
// ════════════════════════════════════════════════════════════

function animate() {
  requestAnimationFrame(animate);
  if (!needsRender) return;
  needsRender = false;
  renderer.render(scene, camera);
  updateLabelPositions();
  drawScaleLegend();
}

// ════════════════════════════════════════════════════════════
//   INIT
// ════════════════════════════════════════════════════════════

function init() {
  initThreeScene();
  initGatePalette();
  redrawCircuit();
  updateAddBtn();
  animate();

  // Resize circuit canvas when window resizes
  window.addEventListener('resize', () => {
    if (qubits.length) redrawCircuit();
  });
}

init();
