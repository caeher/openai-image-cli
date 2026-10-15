import type { ImageMetadata } from "../../core/entities/model.js";

export function renderGalleryHtml(images: ImageMetadata[]): string {
  const items = images
    .map(
      (img) =>
        `<figure><img src="${escapeAttr(relativePath(img.path))}" alt=""/><figcaption>${escapeHtml(img.path)}</figcaption></figure>`,
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><title>Galería</title>
<style>body{font-family:sans-serif} figure{margin:1rem;display:inline-block;vertical-align:top} img{max-width:320px;height:auto}</style>
</head>
<body><h1>Galería</h1>${items}</body></html>`;
}

function relativePath(p: string): string {
  return p.replace(/^\.\//, "");
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
