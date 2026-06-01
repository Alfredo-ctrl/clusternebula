<p align="center">
  <img src="assets/readme-hero.svg" alt="ClusterNebula banner" width="100%" />
</p>

<h1 align="center">ClusterNebula</h1>

<p align="center"><strong>A 3D browser lab for exploring CSV datasets with local k-means clustering.</strong></p>

<p align="center">
  <img alt="focus: data science" src="https://img.shields.io/badge/focus-data%20science-41f4ff?style=for-the-badge&labelColor=03040a" />
  <img alt="engine: three.js" src="https://img.shields.io/badge/engine-three.js-ff4fb8?style=for-the-badge&labelColor=03040a" />
  <img alt="model: k-means" src="https://img.shields.io/badge/model-k--means-b7ff4a?style=for-the-badge&labelColor=03040a" />
</p>

## Concept

ClusterNebula turns a plain CSV into an interactive 3D point cloud. Pick three numeric features, choose the number of clusters, and inspect the result as a rotating data nebula.

## Features

- Three.js full-screen 3D scene with orbit controls.
- CSV paste or file upload.
- Local k-means clustering in the browser.
- Cluster centroids, connecting halos, hover readouts, and color-coded groups.
- Inertia, separation, balance, and quality score.
- Markdown report generation and copy button.
- Demo dataset for instant testing.

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

## Portfolio Identity

This project starts the new 3D direction for the portfolio: data science tooling with a cinematic, interactive visual system instead of a flat dashboard.
