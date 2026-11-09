/**
 * Monochrome Charcoal & Pencil-Sketch Portrait Stylizer
 *
 * Transforms an isolated-person segmentation result into a transparent-background
 * monochrome portrait with:
 *  - Natural black-and-white tonal response & foreground-only exposure consistency
 *  - Crisp preserved facial detail, skin tones, glasses, clothing & shoulders
 *  - Delicate charcoal/graphite micro-grain and subtle contour/silhouette shading
 *  - Clean edge decontamination so hair and light clothing integrate seamlessly on white cards
 */

import type { SegmentedPortrait } from "./segmentPerson";

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function clamp01(v: number): number {
  return v <= 0 ? 0 : v >= 1 ? 1 : v;
}

/** Deterministic spatial grain helper in [-1, 1] */
function paperGrain(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  const fine = ((h >>> 0) / 4294967295) * 2 - 1;

  // Coarser diagonal paper tooth
  const cx = Math.floor(x / 2);
  const cy = Math.floor(y / 2);
  let h2 = ((cx + cy) * 1597334677 + (cy - cx) * 3812015801) ^ 0x1b873593;
  h2 = Math.imul(h2 ^ (h2 >>> 15), 2246822519);
  h2 ^= h2 >>> 13;
  const coarse = ((h2 >>> 0) / 4294967295) * 2 - 1;

  return 0.65 * fine + 0.35 * coarse;
}

/** Separable O(N) box blur for scalar Float32Array */
function boxBlurScalar(
  src: Float32Array,
  w: number,
  h: number,
  r: number
): Float32Array {
  const tmp = new Float32Array(w * h);
  const dst = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    const rowOff = y * w;
    let sum = 0;
    for (let dx = 0; dx <= Math.min(w - 1, r); dx++) {
      sum += src[rowOff + dx];
    }
    for (let x = 0; x < w; x++) {
      const left = Math.max(0, x - r);
      const right = Math.min(w - 1, x + r);
      tmp[rowOff + x] = sum / (right - left + 1);
      const nextRight = x + r + 1;
      const prevLeft = x - r;
      if (nextRight < w) sum += src[rowOff + nextRight];
      if (prevLeft >= 0) sum -= src[rowOff + prevLeft];
    }
  }

  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let dy = 0; dy <= Math.min(h - 1, r); dy++) {
      sum += tmp[dy * w + x];
    }
    for (let y = 0; y < h; y++) {
      const top = Math.max(0, y - r);
      const bot = Math.min(h - 1, y + r);
      dst[y * w + x] = sum / (bot - top + 1);
      const nextBot = y + r + 1;
      const prevTop = y - r;
      if (nextBot < h) sum += tmp[nextBot * w + x];
      if (prevTop >= 0) sum -= tmp[prevTop * w + x];
    }
  }

  return dst;
}

export interface StylizedPortraitResult {
  /** Transparent PNG canvas of the isolated monochrome portrait */
  canvas: HTMLCanvasElement;
  /** PNG binary Blob suitable for persisting portrait.png */
  blob: Blob;
  width: number;
  height: number;
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to encode PNG blob from canvas."));
      }
    }, "image/png");
  });
}

/**
 * Apply natural black-and-white + subtle charcoal/pencil-sketch styling
 * strictly over the segmented primary person pixels, outputting a transparent PNG.
 */
export async function stylizeSegmentedPortrait(
  segmented: SegmentedPortrait
): Promise<StylizedPortraitResult> {
  const { width: w, height: h, sourceImageData, alpha } = segmented;
  const rgba = sourceImageData.data;
  const n = w * h;

  // 1. Perceptual luminance + foreground-only histogram normalization
  const rawLuma = new Float32Array(n);
  const hist = new Uint32Array(256);
  let fgCount = 0;

  for (let i = 0; i < n; i++) {
    const p = i * 4;
    // Slight warmth weighting preserves natural skin-tone differentiation in monochrome
    const luma = clamp01((0.32 * rgba[p] + 0.56 * rgba[p + 1] + 0.12 * rgba[p + 2]) / 255);
    rawLuma[i] = luma;
    if (alpha[i] > 0.2) {
      const bin = clamp(Math.round(luma * 255), 0, 255);
      hist[bin]++;
      fgCount++;
    }
  }

  let p02 = 0.03;
  let p50 = 0.45;
  let p98 = 0.94;

  if (fgCount > 50) {
    let acc = 0;
    let found02 = false;
    let found50 = false;
    for (let b = 0; b < 256; b++) {
      acc += hist[b];
      const frac = acc / fgCount;
      if (!found02 && frac >= 0.025) {
        p02 = b / 255;
        found02 = true;
      }
      if (!found50 && frac >= 0.5) {
        p50 = b / 255;
        found50 = true;
      }
      if (frac >= 0.975) {
        p98 = b / 255;
        break;
      }
    }
  }

  // Cap contrast normalization so bright or moody photos stay balanced & authentic
  const lo = Math.min(p02, 0.14);
  const hi = Math.max(p98, 0.82);
  const span = Math.max(0.45, hi - lo);
  // Lift midtones gently when subject is underexposed (common indoor/backlit selfies)
  const gammaLift = p50 < 0.34 ? clamp(0.84 + p50 * 0.45, 0.82, 0.98) : 0.96;

  const toned = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const stretched = clamp01((rawLuma[i] - lo) / span);
    const blended = 0.58 * stretched + 0.42 * rawLuma[i];
    const lifted = Math.pow(blended, gammaLift);
    const sCurve = lifted * lifted * (3 - 2 * lifted);
    toned[i] = 0.65 * lifted + 0.35 * sCurve;
  }

  // 2. Multi-scale tonal structure for clarity and gentle graphite edge definition
  const smooth1 = boxBlurScalar(toned, w, h, 1);
  const blur4 = boxBlurScalar(toned, w, h, 4);
  const blur11 = boxBlurScalar(toned, w, h, 11);
  const alphaSoft = boxBlurScalar(alpha, w, h, 2);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) {
    throw new Error("Could not acquire 2D context for monochrome portrait output.");
  }

  const outData = outCtx.createImageData(w, h);
  const dst = outData.data;

  for (let y = 0; y < h; y++) {
    const yUp = Math.max(0, y - 1);
    const yDn = Math.min(h - 1, y + 1);
    const rowOff = y * w;

    for (let x = 0; x < w; x++) {
      const i = rowOff + x;
      const a = alpha[i];
      const p = i * 4;

      if (a <= 0.008) {
        // Fill RGB with crisp white-card key color so texture interpolation stays fringe-free
        dst[p] = 250;
        dst[p + 1] = 250;
        dst[p + 2] = 252;
        dst[p + 3] = 0;
        continue;
      }

      const xL = Math.max(0, x - 1);
      const xR = Math.min(w - 1, x + 1);

      // Multi-scale photographic detail (keeps eyes, eyelashes, collar, stripes sharp)
      const base = toned[i];
      const microDetail = (smooth1[i] - blur4[i]) * 0.24;
      const midDetail = (blur4[i] - blur11[i]) * 0.11;

      // Subtle graphite/charcoal contour accent along tonal edges
      const gx = smooth1[rowOff + xR] - smooth1[rowOff + xL];
      const gy = smooth1[yDn * w + x] - smooth1[yUp * w + x];
      const grad = Math.min(1, Math.hypot(gx, gy) * 2.5);
      const pencilAccent = grad * 0.16 * (0.28 + 0.72 * base);

      // Subtle charcoal outline trace along semi-opaque subject perimeter so light
      // shirts and collars maintain clean separation on white card backgrounds
      const perimeterWeight = clamp01(4 * alphaSoft[i] * (1 - alphaSoft[i]));
      const rimTone =
        perimeterWeight > 0.04 && base > 0.54
          ? perimeterWeight * (base - 0.48) * 0.34
          : 0;

      const grain = paperGrain(x, y);
      const grainWeight = 0.03 * Math.sin(Math.PI * clamp01(base));

      const finalTone = clamp01(
        base + microDetail + midDetail - pencilAccent - rimTone + grain * grainWeight
      );

      // Keep crisp studio ink dynamic range (#0E0E10 .. #F6F6F7)
      const v = clamp(Math.round(14 + finalTone * 232), 14, 246);

      // Slightly organic stippled edge transition strictly in the thin outer halo
      const edgeAlpha =
        a > 0.06 && a < 0.82
          ? clamp01(a + grain * 0.038 * perimeterWeight)
          : a;

      dst[p] = v;
      dst[p + 1] = v;
      dst[p + 2] = v;
      dst[p + 3] = clamp(Math.round(edgeAlpha * 255), 0, 255);
    }
  }

  outCtx.putImageData(outData, 0, 0);
  const blob = await canvasToPngBlob(outCanvas);

  return {
    canvas: outCanvas,
    blob,
    width: w,
    height: h,
  };
}

