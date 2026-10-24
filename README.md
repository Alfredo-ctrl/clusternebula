<p align="center">
  <img src="assets/readme-hero.svg" alt="ClusterNebula 3D Data Lab Architectural Banner" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/ALGORITHM-K-MEANS%20CLUSTERING-0F172A?style=flat-square&labelColor=05080F&color=0284C7" alt="ALGORITHM: K-MEANS CLUSTERING" />
  <img src="https://img.shields.io/badge/ENGINE-THREE.JS%20WEBGL-0F172A?style=flat-square&labelColor=05080F&color=1E293B" alt="ENGINE: THREE.JS WEBGL" />
  <img src="https://img.shields.io/badge/INPUT-DYNAMIC%20CSV-0F172A?style=flat-square&labelColor=05080F&color=1E293B" alt="INPUT: DYNAMIC CSV" />
  <img src="https://img.shields.io/badge/PROJECTION-3D%20SPATIAL%20CLOUD-0F172A?style=flat-square&labelColor=05080F&color=1E293B" alt="PROJECTION: 3D SPATIAL CLOUD" />
</p>

---

<h1 align="center">ClusterNebula</h1>

<p align="center"><strong>A full-screen 3D clustering studio for reading CSV data as an interactive field.</strong></p>

<p align="center">
  <img alt="focus: data science" src="https://img.shields.io/badge/focus-data%20science-101010?style=for-the-badge&labelColor=f7f6f1" />
  <img alt="engine: three.js" src="https://img.shields.io/badge/engine-three.js-245cff?style=for-the-badge&labelColor=f7f6f1" />
  <img alt="model: k-means" src="https://img.shields.io/badge/model-k--means-ff4d3e?style=for-the-badge&labelColor=f7f6f1" />
</p>

## Concept

ClusterNebula turns a plain CSV into a living 3D point field. Choose three numeric features, set the number of clusters, and inspect how local k-means groups the data directly in the browser.

## Highlights

- Full-screen Three.js scene with orbit controls and motion toggle.
- CSV paste, CSV file upload, and instant demo dataset.
- Local k-means clustering with no external API.
- Cluster centroids, connection traces, hover readouts, and quality metrics.
- Markdown report generation for quick documentation.
- Minimal creative-coding interface with a `more details / back` workbench.

## Run

```bash
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

## Build

```bash
npm run build
```

## Design Note

The interface was rebuilt as an original minimalist WebGL direction for the portfolio. It does not include copied assets, text, or source code from external sites.
