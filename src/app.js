import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const $ = (selector) => document.querySelector(selector);

const colors = [0x41f4ff, 0xff4fb8, 0xb7ff4a, 0xffd166, 0x8f5cff, 0xff7a59, 0x7ee7c8];
const state = {
  rows: [],
  numericColumns: [],
  points: [],
  clusters: [],
  centroids: [],
  metrics: { inertia: 0, separation: 0, balance: 0, quality: 0 },
  spinning: true,
  report: ""
};

const els = {
  canvas: $("#scene"),
  file: $("#fileInput"),
  csv: $("#csvInput"),
  x: $("#xAxis"),
  y: $("#yAxis"),
  z: $("#zAxis"),
  k: $("#clusterCount"),
  kValue: $("#kValue"),
  analyze: $("#analyzeButton"),
  demo: $("#demoButton"),
  resetCamera: $("#resetCameraButton"),
  spin: $("#spinToggle"),
  rowCount: $("#rowCount"),
  quality: $("#qualityScore"),
  inertia: $("#inertiaValue"),
  separation: $("#separationValue"),
  balance: $("#balanceValue"),
  clusters: $("#clusterList"),
  report: $("#reportOutput"),
  copy: $("#copyReportButton"),
  hover: $("#hoverCard"),
  toast: $("#toast")
};

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03040a, 0.035);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 140);
camera.position.set(9, 7, 12);

const renderer = new THREE.WebGLRenderer({ canvas: els.canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 5;
controls.maxDistance = 34;

const root = new THREE.Group();
scene.add(root);

const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);

const keyLight = new THREE.PointLight(0x41f4ff, 26, 40);
keyLight.position.set(-8, 8, 10);
scene.add(keyLight);

const roseLight = new THREE.PointLight(0xff4fb8, 18, 38);
roseLight.position.set(9, -4, 8);
scene.add(roseLight);

const grid = new THREE.GridHelper(18, 18, 0x335577, 0x172035);
grid.position.y = -4.2;
root.add(grid);

const axisMaterial = new THREE.LineBasicMaterial({ color: 0x6d7cff, transparent: true, opacity: 0.45 });
const axisGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-8, 0, 0),
  new THREE.Vector3(8, 0, 0),
  new THREE.Vector3(0, -5, 0),
  new THREE.Vector3(0, 5, 0),
  new THREE.Vector3(0, 0, -8),
  new THREE.Vector3(0, 0, 8)
]);
root.add(new THREE.LineSegments(axisGeometry, axisMaterial));

let pointMesh;
let centroidMesh;
let haloMesh;
let starField;
let hoveredIndex = -1;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(10, 10);
const matrix = new THREE.Matrix4();
const dummy = new THREE.Object3D();
const clock = new THREE.Clock();

function createStars() {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const starColors = [];

  for (let index = 0; index < 700; index += 1) {
    const radius = 22 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    positions.push(
      Math.sin(phi) * Math.cos(theta) * radius,
      Math.cos(phi) * radius,
      Math.sin(phi) * Math.sin(theta) * radius
    );
    const color = new THREE.Color(colors[index % colors.length]);
    starColors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(starColors, 3));
  const material = new THREE.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true, opacity: 0.62 });
  starField = new THREE.Points(geometry, material);
  scene.add(starField);
}

function demoCsv() {
  const rows = ["engagement,retention,latency,revenue,risk"];
  const centers = [
    [82, 76, 18, 64, 12],
    [38, 42, 52, 28, 49],
    [64, 34, 78, 52, 66],
    [22, 82, 28, 18, 24]
  ];

  centers.forEach((center, cluster) => {
    for (let index = 0; index < 34; index += 1) {
      const values = center.map((value, axis) => {
        const wave = Math.sin(index * 0.72 + axis + cluster) * 7;
        const drift = Math.cos(index * 0.33 + cluster * 2) * 4;
        return Math.max(1, Math.min(99, Math.round(value + wave + drift + (axis - 2) * cluster)));
      });
      rows.push(values.join(","));
    }
  });

  return rows.join("\n");
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((item) => item.trim());

  return lines.slice(1).map((line, rowIndex) => {
    const values = splitCsvLine(line);
    const row = { __id: rowIndex + 1 };
    headers.forEach((header, index) => {
      const value = values[index]?.trim() ?? "";
      const numeric = Number(value);
      row[header] = Number.isFinite(numeric) && value !== "" ? numeric : value;
    });
    return row;
  });
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === "\"") quoted = !quoted;
    else if (char === "," && !quoted) {
      result.push(current);
      current = "";
    } else current += char;
  }

  result.push(current);
  return result;
}

function numericColumns(rows) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).filter((key) => key !== "__id" && rows.every((row) => Number.isFinite(row[key])));
}

function populateAxes(columns) {
  [els.x, els.y, els.z].forEach((select, index) => {
    select.innerHTML = columns.map((column) => `<option value="${column}">${column}</option>`).join("");
    select.value = columns[Math.min(index, columns.length - 1)] || "";
  });
}

function normalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((value) => ((value - min) / span - 0.5) * 10);
}

function buildPoints(rows, axes) {
  const nx = normalize(rows.map((row) => row[axes[0]]));
  const ny = normalize(rows.map((row) => row[axes[1]]));
  const nz = normalize(rows.map((row) => row[axes[2]]));

  return rows.map((row, index) => ({
    row,
    id: row.__id,
    vector: [nx[index], ny[index], nz[index]],
    raw: axes.map((axis) => row[axis])
  }));
}

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function kmeans(points, k, iterations = 28) {
  const vectors = points.map((point) => point.vector);
  const centroids = initializeCentroids(vectors, k);
  let clusters = new Array(vectors.length).fill(0);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    clusters = vectors.map((vector) => nearestCentroid(vector, centroids));
    const next = centroids.map((centroid, clusterIndex) => {
      const members = vectors.filter((_, index) => clusters[index] === clusterIndex);
      if (!members.length) return centroid;
      return [0, 1, 2].map((axis) => members.reduce((sum, vector) => sum + vector[axis], 0) / members.length);
    });
    centroids.splice(0, centroids.length, ...next);
  }

  return { clusters, centroids };
}

function initializeCentroids(vectors, k) {
  const centroids = [vectors[0]];

  while (centroids.length < k) {
    let candidate = vectors[0];
    let best = -1;

    vectors.forEach((vector) => {
      const nearest = Math.min(...centroids.map((centroid) => distance(vector, centroid)));
      if (nearest > best) {
        best = nearest;
        candidate = vector;
      }
    });

    centroids.push([...candidate]);
  }

  return centroids.map((centroid) => [...centroid]);
}

function nearestCentroid(vector, centroids) {
  let bestIndex = 0;
  let bestDistance = Infinity;

  centroids.forEach((centroid, index) => {
    const current = distance(vector, centroid);
    if (current < bestDistance) {
      bestDistance = current;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function calculateMetrics(points, clusters, centroids) {
  const distances = points.map((point, index) => distance(point.vector, centroids[clusters[index]]));
  const inertia = distances.reduce((sum, item) => sum + item * item, 0);
  const centroidDistances = [];

  centroids.forEach((a, index) => {
    centroids.slice(index + 1).forEach((b) => centroidDistances.push(distance(a, b)));
  });

  const separation = centroidDistances.length ? centroidDistances.reduce((sum, item) => sum + item, 0) / centroidDistances.length : 0;
  const counts = centroids.map((_, clusterIndex) => clusters.filter((item) => item === clusterIndex).length);
  const average = points.length / centroids.length;
  const balance = Math.max(0, 1 - counts.reduce((sum, count) => sum + Math.abs(count - average), 0) / (points.length * 1.5));
  const compactness = 1 / (1 + inertia / Math.max(1, points.length * 8));
  const separationScore = Math.min(1, separation / 8);
  const quality = Math.round((compactness * 0.45 + separationScore * 0.35 + balance * 0.2) * 100);

  return { inertia, separation, balance, quality, counts };
}

function updateScene() {
  if (pointMesh) root.remove(pointMesh);
  if (centroidMesh) root.remove(centroidMesh);
  if (haloMesh) root.remove(haloMesh);

  const pointGeometry = new THREE.SphereGeometry(0.105, 16, 16);
  const pointMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0.18,
    emissive: 0x111827,
    emissiveIntensity: 0.28
  });

  pointMesh = new THREE.InstancedMesh(pointGeometry, pointMaterial, state.points.length);
  pointMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  pointMesh.userData.kind = "points";
  const color = new THREE.Color();

  state.points.forEach((point, index) => {
    dummy.position.set(point.vector[0], point.vector[1], point.vector[2]);
    const size = 0.9 + (point.raw.reduce((sum, item) => sum + item, 0) / Math.max(1, point.raw.length)) / 180;
    dummy.scale.setScalar(size);
    dummy.updateMatrix();
    pointMesh.setMatrixAt(index, dummy.matrix);
    pointMesh.setColorAt(index, color.setHex(colors[state.clusters[index] % colors.length]));
  });

  pointMesh.instanceMatrix.needsUpdate = true;
  pointMesh.instanceColor.needsUpdate = true;
  root.add(pointMesh);

  const centroidGeometry = new THREE.OctahedronGeometry(0.34, 0);
  const centroidMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18, metalness: 0.5, emissive: 0x333333, emissiveIntensity: 0.4 });
  centroidMesh = new THREE.InstancedMesh(centroidGeometry, centroidMaterial, state.centroids.length);

  state.centroids.forEach((centroid, index) => {
    dummy.position.set(centroid[0], centroid[1], centroid[2]);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    centroidMesh.setMatrixAt(index, dummy.matrix);
    centroidMesh.setColorAt(index, color.setHex(colors[index % colors.length]));
  });

  centroidMesh.instanceMatrix.needsUpdate = true;
  centroidMesh.instanceColor.needsUpdate = true;
  root.add(centroidMesh);

  const haloGeometry = new THREE.BufferGeometry();
  const positions = [];
  const haloColors = [];
  state.centroids.forEach((centroid, clusterIndex) => {
    state.points.forEach((point, index) => {
      if (state.clusters[index] === clusterIndex && index % 3 === 0) {
        positions.push(...centroid, ...point.vector);
        const haloColor = new THREE.Color(colors[clusterIndex % colors.length]);
        haloColors.push(haloColor.r, haloColor.g, haloColor.b, haloColor.r, haloColor.g, haloColor.b);
      }
    });
  });

  haloGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  haloGeometry.setAttribute("color", new THREE.Float32BufferAttribute(haloColors, 3));
  haloMesh = new THREE.LineSegments(haloGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.12 }));
  root.add(haloMesh);
}

function renderUi() {
  els.rowCount.value = `${state.rows.length} rows`;
  els.quality.value = `${state.metrics.quality}%`;
  els.inertia.textContent = state.metrics.inertia.toFixed(1);
  els.separation.textContent = state.metrics.separation.toFixed(2);
  els.balance.textContent = `${Math.round(state.metrics.balance * 100)}%`;

  els.clusters.innerHTML = state.metrics.counts.map((count, index) => `
    <li>
      <i class="cluster-swatch" style="color:#${colors[index % colors.length].toString(16).padStart(6, "0")};background:currentColor"></i>
      <div>
        <strong>Cluster ${index + 1}</strong>
        <span>${count} puntos</span>
      </div>
      <b>${Math.round((count / state.rows.length) * 100)}%</b>
    </li>
  `).join("");

  state.report = buildReport();
  els.report.textContent = state.report;
}

function buildReport() {
  const axes = [els.x.value, els.y.value, els.z.value];
  return [
    "# ClusterNebula Report",
    "",
    `Rows: ${state.rows.length}`,
    `Numeric columns: ${state.numericColumns.join(", ")}`,
    `Axes: ${axes.join(" / ")}`,
    `Clusters: ${state.centroids.length}`,
    `Quality score: ${state.metrics.quality}%`,
    `Inertia: ${state.metrics.inertia.toFixed(2)}`,
    `Separation: ${state.metrics.separation.toFixed(2)}`,
    `Balance: ${Math.round(state.metrics.balance * 100)}%`,
    "",
    "## Cluster Sizes",
    ...state.metrics.counts.map((count, index) => `- Cluster ${index + 1}: ${count} rows`),
    "",
    "## Reading",
    state.metrics.quality >= 74
      ? "The selected variables produce visually separated and fairly readable groups."
      : "The selected variables are usable, but the clusters may need different axes or another value of k.",
    "",
    "## Suggested Next Steps",
    "- Try a neighboring k value and compare balance.",
    "- Swap one axis for another numeric feature.",
    "- Inspect outliers far from their centroid.",
    "- Use the report as a first-pass clustering note, not as final statistical proof."
  ].join("\n");
}

function analyze() {
  const rows = parseCsv(els.csv.value);
  const columns = numericColumns(rows);

  if (rows.length < 4 || columns.length < 3) {
    toast("Necesito al menos 4 filas y 3 columnas numericas.");
    return;
  }

  state.rows = rows;
  state.numericColumns = columns;

  if (![els.x.value, els.y.value, els.z.value].every((axis) => columns.includes(axis))) {
    populateAxes(columns);
  }

  const axes = [els.x.value, els.y.value, els.z.value];
  state.points = buildPoints(rows, axes);
  const result = kmeans(state.points, Number(els.k.value));
  state.clusters = result.clusters;
  state.centroids = result.centroids;
  state.metrics = calculateMetrics(state.points, state.clusters, state.centroids);
  updateScene();
  renderUi();
  toast("Analisis listo");
}

function loadDemo() {
  els.csv.value = demoCsv();
  const rows = parseCsv(els.csv.value);
  const columns = numericColumns(rows);
  populateAxes(columns);
  els.x.value = "engagement";
  els.y.value = "retention";
  els.z.value = "latency";
  analyze();
}

function resetCamera() {
  camera.position.set(9, 7, 12);
  controls.target.set(0, 0, 0);
  controls.update();
}

function updateHover(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  els.hover.style.left = `${event.clientX + 14}px`;
  els.hover.style.top = `${event.clientY + 14}px`;
}

function readHover() {
  if (!pointMesh || !state.points.length) return;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(pointMesh)[0];

  if (!hit || hit.instanceId === undefined) {
    hoveredIndex = -1;
    els.hover.hidden = true;
    return;
  }

  if (hoveredIndex !== hit.instanceId) {
    hoveredIndex = hit.instanceId;
    const point = state.points[hoveredIndex];
    const axes = [els.x.value, els.y.value, els.z.value];
    els.hover.innerHTML = `
      <strong>Row ${point.id} · Cluster ${state.clusters[hoveredIndex] + 1}</strong>
      <span>${axes[0]}: ${point.raw[0]}</span>
      <span>${axes[1]}: ${point.raw[1]}</span>
      <span>${axes[2]}: ${point.raw[2]}</span>
    `;
  }

  els.hover.hidden = false;
}

function animate() {
  const elapsed = clock.getElapsedTime();

  if (state.spinning) root.rotation.y += 0.0018;
  if (starField) starField.rotation.y -= 0.0008;
  if (pointMesh) {
    const pulse = 1 + Math.sin(elapsed * 2.2) * 0.035;
    pointMesh.scale.setScalar(pulse);
  }

  controls.update();
  readHover();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 1400);
}

els.file.addEventListener("change", async () => {
  const file = els.file.files?.[0];
  if (!file) return;
  els.csv.value = await file.text();
  const rows = parseCsv(els.csv.value);
  const columns = numericColumns(rows);
  if (columns.length >= 3) populateAxes(columns);
  analyze();
});

els.demo.addEventListener("click", loadDemo);
els.analyze.addEventListener("click", analyze);
els.resetCamera.addEventListener("click", resetCamera);
els.k.addEventListener("input", () => {
  els.kValue.textContent = els.k.value;
  if (state.rows.length) analyze();
});
[els.x, els.y, els.z].forEach((select) => select.addEventListener("change", () => state.rows.length && analyze()));
els.spin.addEventListener("click", () => {
  state.spinning = !state.spinning;
  els.spin.textContent = state.spinning ? "orbit on" : "orbit off";
});
els.copy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(state.report || els.report.textContent);
  toast("Reporte copiado");
});
window.addEventListener("pointermove", updateHover);
window.addEventListener("resize", resize);

createStars();
loadDemo();
animate();
