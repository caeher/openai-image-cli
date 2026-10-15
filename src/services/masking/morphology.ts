export function invertAlpha(alpha: Uint8Array): Uint8Array {
  const out = new Uint8Array(alpha.length);
  for (let i = 0; i < alpha.length; i++) {
    out[i] = 255 - (alpha[i] ?? 255);
  }
  return out;
}

export function unionAlpha(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    out[i] = Math.min(a[i] ?? 255, b[i] ?? 255);
  }
  return out;
}

export function intersectAlpha(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    out[i] = Math.max(a[i] ?? 0, b[i] ?? 0);
  }
  return out;
}

function isEditable(alpha: number | undefined): boolean {
  return alpha === 0;
}

export function dilateAlpha(
  alpha: Uint8Array,
  width: number,
  height: number,
  radius: number,
): Uint8Array {
  const out = new Uint8Array(alpha);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (isEditable(alpha[idx])) {
        continue;
      }
      let found = false;
      for (let dy = -radius; dy <= radius && !found; dy++) {
        for (let dx = -radius; dx <= radius && !found; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            continue;
          }
          if (isEditable(alpha[ny * width + nx])) {
            found = true;
          }
        }
      }
      if (found) {
        out[idx] = 0;
      }
    }
  }
  return out;
}

export function erodeAlpha(
  alpha: Uint8Array,
  width: number,
  height: number,
  radius: number,
): Uint8Array {
  const out = new Uint8Array(alpha);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!isEditable(alpha[idx])) {
        continue;
      }
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            out[idx] = 255;
            break;
          }
          if (!isEditable(alpha[ny * width + nx])) {
            out[idx] = 255;
            break;
          }
        }
      }
    }
  }
  return out;
}

export function blurAlpha(
  alpha: Uint8Array,
  width: number,
  height: number,
  radius: number,
): Uint8Array {
  const out = new Uint8Array(alpha.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            continue;
          }
          sum += alpha[ny * width + nx] ?? 0;
          count += 1;
        }
      }
      out[y * width + x] = Math.round(sum / count);
    }
  }
  return out;
}
