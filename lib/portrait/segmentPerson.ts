/**
 * Client-side Person Segmentation & Foreground Extraction
 *
 * Uses Google MediaPipe ImageSegmenter (selfie_multiclass_256x256.tflite)
 * served 100% locally from /public/mediapipe/ so personal user photos never
 * leave the browser for external background-removal APIs and CSP `'self'`
 * rules are strictly honored.
 *
 * Includes:
 *  - EXIF-safe image decoding & aspect-preserving working resize
 *  - Connected-component primary-person selection (removes background bystanders)
 *  - Semantic head/face/shoulder bounding-box extraction
 *  - Fast 3-channel RGB Guided Filter alpha matting refinement for smooth hair & clothing edges
 *  - Subject-presence validation (triggers clean fallback when no person is detected)
 */

import type { FilesetResolver as FilesetResolverType, ImageSegmenter as ImageSegmenterType } from "@mediapipe/tasks-vision";

export class PortraitSegmentationError extends Error {
  readonly code: "NO_SUBJECT" | "LOAD_FAILED" | "DECODE_FAILED" | "INFERENCE_FAILED";

  constructor(
    code: PortraitSegmentationError["code"],
    message: string
  ) {
    super(message);
    this.name = "PortraitSegmentationError";
    this.code = code;
  }
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface SegmentedPortrait {
  /** Working canvas containing original orientation-corrected RGB pixels */
  sourceCanvas: HTMLCanvasElement;
  /** Raw RGBA ImageData of sourceCanvas */
  sourceImageData: ImageData;
  /** Refined alpha mask in [0, 1] per pixel (length = width * height) */
  alpha: Float32Array;
  /** Semantic upper-body / hair+face probability map in [0, 1] */
  headConfidence: Float32Array;
  /** Tight bounding box of segmented primary person */
  subjectBox: BoundingBox;
  /** Estimated head/hair bounding box used for portrait bust alignment */
  headBox: BoundingBox;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

const MEDIAPIPE_WASM_BASE = "/mediapipe/wasm";
const MEDIAPIPE_MODEL_PATH = "/mediapipe/models/selfie_multiclass_256x256.tflite";
const MAX_WORKING_DIMENSION = 1024;

let segmenterPromise: Promise<ImageSegmenterType> | null = null;

function clamp01(v: number): number {
  return v <= 0 ? 0 : v >= 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function runWithoutTfliteInfoNoise<T>(fn: () => T): T {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const first = typeof args[0] === "string" ? args[0] : "";
    if (
      first.includes("INFO: Created TensorFlow Lite") ||
      first.includes("W0000") && first.includes("mediapipe")
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
  try {
    return fn();
  } finally {
    console.error = originalConsoleError;
  }
}

async function runAsyncWithoutTfliteInfoNoise<T>(fn: () => Promise<T>): Promise<T> {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const first = typeof args[0] === "string" ? args[0] : "";
    if (
      first.includes("INFO: Created TensorFlow Lite") ||
      first.includes("W0000") && first.includes("mediapipe")
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
  try {
    return await fn();
  } finally {
    console.error = originalConsoleError;
  }
}

/**
 * Lazy-load MediaPipe ImageSegmenter using strictly local static assets under /mediapipe/.
 * Uses CPU WASM SIMD delegate so it does not compete for WebGL contexts with Three.js Lanyard.
 */
async function getSegmenter(): Promise<ImageSegmenterType> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const Resolver = vision.FilesetResolver as typeof FilesetResolverType;
        const Segmenter = vision.ImageSegmenter as typeof ImageSegmenterType;

        const fileset = await Resolver.forVisionTasks(MEDIAPIPE_WASM_BASE);
        return await runAsyncWithoutTfliteInfoNoise(() =>
          Segmenter.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: MEDIAPIPE_MODEL_PATH,
              delegate: "CPU",
            },
            runningMode: "IMAGE",
            outputConfidenceMasks: true,
            outputCategoryMask: false,
          })
        );
      } catch (err) {
        segmenterPromise = null;
        throw new PortraitSegmentationError(
          "LOAD_FAILED",
          err instanceof Error
            ? `Failed to initialize portrait segmentation engine: ${err.message}`
            : "Failed to initialize portrait segmentation engine."
        );
      }
    })();
  }
  return segmenterPromise;
}

/**
 * Decode an uploaded image Blob/File or URL into an orientation-normalized Canvas.
 */
export async function decodeImageSource(
  source: Blob | string,
  maxDimension: number = MAX_WORKING_DIMENSION
): Promise<{
  canvas: HTMLCanvasElement;
  originalWidth: number;
  originalHeight: number;
}> {
  if (typeof window === "undefined") {
    throw new PortraitSegmentationError("DECODE_FAILED", "Image decoding requires a browser context.");
  }

  let blob: Blob | null = null;
  if (typeof source === "string") {
    try {
      const response = await fetch(source, { mode: "cors" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      blob = await response.blob();
    } catch {
      blob = null;
    }
  } else {
    blob = source;
  }

  // Prefer createImageBitmap with EXIF orientation support
  if (blob && typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: "from-image",
      });
      try {
        const origW = bitmap.width;
        const origH = bitmap.height;
        if (origW <= 0 || origH <= 0) {
          throw new Error("Empty bitmap dimensions.");
        }
        const scale = Math.min(1, maxDimension / Math.max(origW, origH));
        const targetW = Math.max(1, Math.round(origW * scale));
        const targetH = Math.max(1, Math.round(origH * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          throw new Error("Unable to acquire 2D canvas context.");
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bitmap, 0, 0, targetW, targetH);

        return { canvas, originalWidth: origW, originalHeight: origH };
      } finally {
        bitmap.close();
      }
    } catch {
      // Fall through to HTMLImageElement decoding
    }
  }

  // Fallback decode via HTMLImageElement (handles SVG/data URLs/Safari fallback cleanly)
  const objectUrl = blob ? URL.createObjectURL(blob) : (source as string);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.decoding = "async";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image could not be decoded."));
      el.src = objectUrl;
    });

    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;
    if (origW <= 0 || origH <= 0) {
      throw new PortraitSegmentationError("DECODE_FAILED", "Decoded image has zero dimensions.");
    }

    const scale = Math.min(1, maxDimension / Math.max(origW, origH));
    const targetW = Math.max(1, Math.round(origW * scale));
    const targetH = Math.max(1, Math.round(origH * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new PortraitSegmentationError("DECODE_FAILED", "Unable to acquire 2D canvas context.");
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, targetW, targetH);

    return { canvas, originalWidth: origW, originalHeight: origH };
  } catch (err) {
    if (err instanceof PortraitSegmentationError) throw err;
    throw new PortraitSegmentationError(
      "DECODE_FAILED",
      err instanceof Error ? err.message : "Could not decode image file."
    );
  } finally {
    if (blob) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

/**
 * Separable O(N) box mean filter for single-channel Float32Array.
 */
function boxMean(
  src: Float32Array,
  w: number,
  h: number,
  r: number
): Float32Array {
  const tmp = new Float32Array(w * h);
  const dst = new Float32Array(w * h);
  const invRow = 1;

  // Horizontal pass with cumulative prefix sum
  for (let y = 0; y < h; y++) {
    const rowOff = y * w;
    let sum = 0;
    for (let dx = 0; dx <= Math.min(w - 1, r); dx++) {
      sum += src[rowOff + dx];
    }
    for (let x = 0; x < w; x++) {
      const left = Math.max(0, x - r);
      const right = Math.min(w - 1, x + r);
      const count = (right - left + 1) * invRow;
      tmp[rowOff + x] = sum / count;

      const nextRight = x + r + 1;
      const prevLeft = x - r;
      if (nextRight < w) sum += src[rowOff + nextRight];
      if (prevLeft >= 0) sum -= src[rowOff + prevLeft];
    }
  }

  // Vertical pass
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

function bilinearUpsample(
  src: Float32Array,
  sw: number,
  sh: number,
  dw: number,
  dh: number
): Float32Array {
  if (sw === dw && sh === dh) return new Float32Array(src);
  const out = new Float32Array(dw * dh);
  const xRatio = sw / dw;
  const yRatio = sh / dh;

  for (let dy = 0; dy < dh; dy++) {
    const sy = Math.min(sh - 1, Math.max(0, (dy + 0.5) * yRatio - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(sh - 1, y0 + 1);
    const fy = sy - y0;
    const row0 = y0 * sw;
    const row1 = y1 * sw;
    const dstRow = dy * dw;

    for (let dx = 0; dx < dw; dx++) {
      const sx = Math.min(sw - 1, Math.max(0, (dx + 0.5) * xRatio - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(sw - 1, x0 + 1);
      const fx = sx - x0;

      const v00 = src[row0 + x0];
      const v10 = src[row0 + x1];
      const v01 = src[row1 + x0];
      const v11 = src[row1 + x1];

      const top = v00 + (v10 - v00) * fx;
      const bot = v01 + (v11 - v01) * fx;
      out[dstRow + dx] = top + (bot - top) * fy;
    }
  }

  return out;
}

/**
 * Fast 3-channel RGB Guided Filter (He et al. 2015).
 * Snaps coarse ML segmentation probability boundaries cleanly onto high-res RGB edges
 * across hair wisps, ears, glasses frames, collars, and shoulders.
 */
function fastGuidedFilterRGB(
  rgba: Uint8ClampedArray,
  prob: Float32Array,
  w: number,
  h: number,
  radius: number,
  eps: number
): Float32Array {
  const s = Math.max(1, w * h > 400_000 ? 2 : 1);
  const gw = Math.max(16, Math.round(w / s));
  const gh = Math.max(16, Math.round(h / s));
  const gn = gw * gh;
  const rSmall = Math.max(2, Math.round(radius / s));

  const gR = new Float32Array(gn);
  const gG = new Float32Array(gn);
  const gB = new Float32Array(gn);
  const pSmall = new Float32Array(gn);

  // Subsample guide RGB and probability map via bilinear sample
  for (let y = 0; y < gh; y++) {
    const sy = Math.min(h - 1, Math.floor(((y + 0.5) * h) / gh));
    for (let x = 0; x < gw; x++) {
      const sx = Math.min(w - 1, Math.floor(((x + 0.5) * w) / gw));
      const idx = sy * w + sx;
      const pIdx = idx * 4;
      const gi = y * gw + x;
      gR[gi] = rgba[pIdx] / 255;
      gG[gi] = rgba[pIdx + 1] / 255;
      gB[gi] = rgba[pIdx + 2] / 255;
      pSmall[gi] = prob[idx];
    }
  }

  const meanR = boxMean(gR, gw, gh, rSmall);
  const meanG = boxMean(gG, gw, gh, rSmall);
  const meanB = boxMean(gB, gw, gh, rSmall);
  const meanP = boxMean(pSmall, gw, gh, rSmall);

  const mul = (a: Float32Array, b: Float32Array) => {
    const res = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) res[i] = a[i] * b[i];
    return res;
  };

  const meanRP = boxMean(mul(gR, pSmall), gw, gh, rSmall);
  const meanGP = boxMean(mul(gG, pSmall), gw, gh, rSmall);
  const meanBP = boxMean(mul(gB, pSmall), gw, gh, rSmall);

  const meanRR = boxMean(mul(gR, gR), gw, gh, rSmall);
  const meanRG = boxMean(mul(gR, gG), gw, gh, rSmall);
  const meanRB = boxMean(mul(gR, gB), gw, gh, rSmall);
  const meanGG = boxMean(mul(gG, gG), gw, gh, rSmall);
  const meanGB = boxMean(mul(gG, gB), gw, gh, rSmall);
  const meanBB = boxMean(mul(gB, gB), gw, gh, rSmall);

  const aR = new Float32Array(gn);
  const aG = new Float32Array(gn);
  const aB = new Float32Array(gn);
  const bArr = new Float32Array(gn);

  for (let i = 0; i < gn; i++) {
    const mR = meanR[i];
    const mG = meanG[i];
    const mB = meanB[i];
    const mP = meanP[i];

    // 3x3 regularized covariance Sigma + eps * I
    const s00 = meanRR[i] - mR * mR + eps;
    const s01 = meanRG[i] - mR * mG;
    const s02 = meanRB[i] - mR * mB;
    const s11 = meanGG[i] - mG * mG + eps;
    const s12 = meanGB[i] - mG * mB;
    const s22 = meanBB[i] - mB * mB + eps;

    // Covariance cov(I, p)
    const c0 = meanRP[i] - mR * mP;
    const c1 = meanGP[i] - mG * mP;
    const c2 = meanBP[i] - mB * mP;

    // Cofactors of symmetric 3x3 matrix
    const cof00 = s11 * s22 - s12 * s12;
    const cof01 = s02 * s12 - s01 * s22;
    const cof02 = s01 * s12 - s02 * s11;
    const cof11 = s00 * s22 - s02 * s02;
    const cof12 = s01 * s02 - s00 * s12;
    const cof22 = s00 * s11 - s01 * s01;

    const det = s00 * cof00 + s01 * cof01 + s02 * cof02;
    if (Math.abs(det) < 1e-12) {
      bArr[i] = mP;
      continue;
    }
    const invDet = 1 / det;

    const ar = (cof00 * c0 + cof01 * c1 + cof02 * c2) * invDet;
    const ag = (cof01 * c0 + cof11 * c1 + cof12 * c2) * invDet;
    const ab = (cof02 * c0 + cof12 * c1 + cof22 * c2) * invDet;

    aR[i] = ar;
    aG[i] = ag;
    aB[i] = ab;
    bArr[i] = mP - (ar * mR + ag * mG + ab * mB);
  }

  const meanAR = boxMean(aR, gw, gh, rSmall);
  const meanAG = boxMean(aG, gw, gh, rSmall);
  const meanAB = boxMean(aB, gw, gh, rSmall);
  const meanBVal = boxMean(bArr, gw, gh, rSmall);

  // Upsample linear coefficients (a, b) and evaluate against full-resolution RGB
  const upAR = bilinearUpsample(meanAR, gw, gh, w, h);
  const upAG = bilinearUpsample(meanAG, gw, gh, w, h);
  const upAB = bilinearUpsample(meanAB, gw, gh, w, h);
  const upB = bilinearUpsample(meanBVal, gw, gh, w, h);

  const output = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const pIdx = i * 4;
    const r = rgba[pIdx] / 255;
    const g = rgba[pIdx + 1] / 255;
    const b = rgba[pIdx + 2] / 255;
    output[i] = clamp01(upAR[i] * r + upAG[i] * g + upAB[i] * b + upB[i]);
  }

  return output;
}

/**
 * Connected-component selection on the low-res segmentation mask so distant
 * secondary people in the background are excluded while the primary subject stays intact.
 */
function isolatePrimarySubjectMask(
  fg: Float32Array,
  headProb: Float32Array,
  skinClothesProb: Float32Array,
  mw: number,
  mh: number
): {
  primaryKeepMask: Uint8Array;
  solidPixelCount: number;
  headScore: number;
} {
  const n = mw * mh;
  const seed = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (fg[i] >= 0.3) seed[i] = 1;
  }

  // Dilate seed by radius 2 (connects glasses, ear, hairline seams without bridging distant figures)
  const dilated = new Uint8Array(n);
  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      if (!seed[y * mw + x]) continue;
      for (let dy = -2; dy <= 2; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= mh) continue;
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= mw) continue;
          dilated[ny * mw + nx] = 1;
        }
      }
    }
  }

  const labels = new Int32Array(n);
  const queue = new Int32Array(n);
  let nextLabel = 1;

  interface ComponentStats {
    label: number;
    seedArea: number;
    headSum: number;
    sumX: number;
    sumY: number;
    score: number;
  }

  const stats: ComponentStats[] = [];

  for (let i = 0; i < n; i++) {
    if (!dilated[i] || labels[i] !== 0) continue;

    const label = nextLabel++;
    let head = 0;
    let tail = 0;
    queue[tail++] = i;
    labels[i] = label;

    let seedArea = 0;
    let headSum = 0;
    let sumX = 0;
    let sumY = 0;

    while (head < tail) {
      const idx = queue[head++];
      const cx = idx % mw;
      const cy = Math.floor(idx / mw);

      if (seed[idx]) {
        seedArea++;
        headSum += headProb[idx];
        sumX += cx;
        sumY += cy;
      }

      if (cx > 0 && dilated[idx - 1] && labels[idx - 1] === 0) {
        labels[idx - 1] = label;
        queue[tail++] = idx - 1;
      }
      if (cx + 1 < mw && dilated[idx + 1] && labels[idx + 1] === 0) {
        labels[idx + 1] = label;
        queue[tail++] = idx + 1;
      }
      if (cy > 0 && dilated[idx - mw] && labels[idx - mw] === 0) {
        labels[idx - mw] = label;
        queue[tail++] = idx - mw;
      }
      if (cy + 1 < mh && dilated[idx + mw] && labels[idx + mw] === 0) {
        labels[idx + mw] = label;
        queue[tail++] = idx + mw;
      }
    }

    if (seedArea === 0) continue;
    const normX = sumX / (seedArea * mw);
    const normY = sumY / (seedArea * mh);
    const centerDist = Math.hypot(normX - 0.5, normY - 0.48);
    const centerWeight = Math.max(0.45, 1.18 - centerDist * 0.68);
    const headRatio = Math.min(0.65, headSum / seedArea);
    const score = seedArea * (0.35 + 2.2 * headRatio) * centerWeight + headSum * 2.5;

    stats.push({ label, seedArea, headSum, sumX, sumY, score });
  }

  if (stats.length === 0) {
    return { primaryKeepMask: new Uint8Array(n), solidPixelCount: 0, headScore: 0 };
  }

  stats.sort((a, b) => b.score - a.score);
  const primary = stats[0];

  // Expand keep region slightly around primary dilated label so soft outer hair halos survive
  const keepBase = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (labels[i] === primary.label) keepBase[i] = 1;
  }

  const keepHalo = new Uint8Array(n);
  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      if (!keepBase[y * mw + x]) continue;
      for (let dy = -3; dy <= 3; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= mh) continue;
        for (let dx = -3; dx <= 3; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= mw) continue;
          keepHalo[ny * mw + nx] = 1;
        }
      }
    }
  }

  let bodyAndHeadEvidence = 0;
  for (let i = 0; i < n; i++) {
    if (keepBase[i]) {
      bodyAndHeadEvidence += skinClothesProb[i];
    }
  }

  return {
    primaryKeepMask: keepHalo,
    solidPixelCount: primary.seedArea,
    headScore: primary.headSum + bodyAndHeadEvidence * 0.2,
  };
}

function computeBoxFromWeight(
  weights: Float32Array,
  w: number,
  h: number,
  threshold: number
): BoundingBox {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  let weightedX = 0;
  let weightedY = 0;
  let totalWeight = 0;

  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const val = weights[row + x];
      if (val >= threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        weightedX += x * val;
        weightedY += y * val;
        totalWeight += val;
      }
    }
  }

  if (maxX < minX || maxY < minY || totalWeight <= 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: w - 1,
      maxY: h - 1,
      width: w,
      height: h,
      centerX: w / 2,
      centerY: h / 2,
    };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    centerX: weightedX / totalWeight,
    centerY: weightedY / totalWeight,
  };
}

/**
 * Segment the primary person from an image Blob/File/URL and produce a smooth,
 * high-resolution refined alpha matte plus semantic head/subject bounds.
 */
export async function segmentPrimaryPerson(
  source: Blob | string
): Promise<SegmentedPortrait> {
  const { canvas, originalWidth, originalHeight } = await decodeImageSource(source);
  const w = canvas.width;
  const h = canvas.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new PortraitSegmentationError("DECODE_FAILED", "Could not read canvas image data.");
  }
  const sourceImageData = ctx.getImageData(0, 0, w, h);

  const segmenter = await getSegmenter();
  let result;
  try {
    result = runWithoutTfliteInfoNoise(() => segmenter.segment(canvas));
  } catch (err) {
    throw new PortraitSegmentationError(
      "INFERENCE_FAILED",
      err instanceof Error ? err.message : "Segmentation inference failed."
    );
  }

  let mw = w;
  let mh = h;
  let fgLowRes: Float32Array;
  let headLowRes: Float32Array;
  let skinClothesLowRes: Float32Array;

  try {
    const masks = result.confidenceMasks;
    if (!masks || masks.length === 0) {
      throw new PortraitSegmentationError("INFERENCE_FAILED", "Model produced no segmentation masks.");
    }

    mw = masks[0].width;
    mh = masks[0].height;
    const mn = mw * mh;

    fgLowRes = new Float32Array(mn);
    headLowRes = new Float32Array(mn);
    skinClothesLowRes = new Float32Array(mn);

    if (masks.length >= 5) {
      // selfie_multiclass_256x256: [0:bg, 1:hair, 2:bodySkin, 3:faceSkin, 4:clothes, 5:others]
      const bg = new Float32Array(masks[0].getAsFloat32Array());
      const hair = new Float32Array(masks[1].getAsFloat32Array());
      const bodySkin = new Float32Array(masks[2].getAsFloat32Array());
      const faceSkin = new Float32Array(masks[3].getAsFloat32Array());
      const clothes = new Float32Array(masks[4].getAsFloat32Array());
      const others = masks[5] ? new Float32Array(masks[5].getAsFloat32Array()) : null;

      for (let i = 0; i < mn; i++) {
        const other = others ? others[i] : 0;
        const fgSum = hair[i] + bodySkin[i] + faceSkin[i] + clothes[i] + other;
        fgLowRes[i] = clamp01(Math.max(1 - bg[i], fgSum));
        headLowRes[i] = clamp01(faceSkin[i] + hair[i] * 0.85 + other * 0.35);
        skinClothesLowRes[i] = clamp01(faceSkin[i] + bodySkin[i] + hair[i] + clothes[i]);
      }
    } else if (masks.length === 2) {
      const bg = new Float32Array(masks[0].getAsFloat32Array());
      const fg = new Float32Array(masks[1].getAsFloat32Array());
      for (let i = 0; i < mn; i++) {
        fgLowRes[i] = clamp01(Math.max(fg[i], 1 - bg[i]));
        headLowRes[i] = fgLowRes[i];
        skinClothesLowRes[i] = fgLowRes[i];
      }
    } else {
      const single = new Float32Array(masks[0].getAsFloat32Array());
      for (let i = 0; i < mn; i++) {
        fgLowRes[i] = clamp01(single[i]);
        headLowRes[i] = fgLowRes[i];
        skinClothesLowRes[i] = fgLowRes[i];
      }
    }
  } finally {
    result.close();
  }

  // Filter strictly to primary foreground person component
  const { primaryKeepMask, solidPixelCount, headScore } = isolatePrimarySubjectMask(
    fgLowRes,
    headLowRes,
    skinClothesLowRes,
    mw,
    mh
  );

  const maskArea = mw * mh;
  const foregroundFraction = solidPixelCount / Math.max(1, maskArea);
  const headFraction = headScore / Math.max(1, maskArea);

  if (foregroundFraction < 0.035 || headFraction < 0.008) {
    throw new PortraitSegmentationError(
      "NO_SUBJECT",
      "Could not reliably detect a person in this photograph. Try a clearer portrait or continue with the cropped photo."
    );
  }

  // Zero out background bystanders outside primary subject halo
  const maskedFg = new Float32Array(fgLowRes.length);
  const maskedHead = new Float32Array(headLowRes.length);
  for (let i = 0; i < fgLowRes.length; i++) {
    if (primaryKeepMask[i]) {
      maskedFg[i] = fgLowRes[i];
      maskedHead[i] = headLowRes[i];
    }
  }

  // Gentle 3x3 morphological closing on maskedFg heals tiny 1-2px concavities/notches
  // (e.g. glasses temples, earlobes, collar junctions) without expanding outer silhouettes
  const dilMax = new Float32Array(maskedFg.length);
  for (let y = 0; y < mh; y++) {
    const y0 = Math.max(0, y - 1);
    const y1 = Math.min(mh - 1, y + 1);
    for (let x = 0; x < mw; x++) {
      const x0 = Math.max(0, x - 1);
      const x1 = Math.min(mw - 1, x + 1);
      let m = 0;
      for (let yy = y0; yy <= y1; yy++) {
        const row = yy * mw;
        for (let xx = x0; xx <= x1; xx++) {
          const val = maskedFg[row + xx];
          if (val > m) m = val;
        }
      }
      dilMax[y * mw + x] = m;
    }
  }
  const closedFg = new Float32Array(maskedFg.length);
  for (let y = 0; y < mh; y++) {
    const y0 = Math.max(0, y - 1);
    const y1 = Math.min(mh - 1, y + 1);
    for (let x = 0; x < mw; x++) {
      const x0 = Math.max(0, x - 1);
      const x1 = Math.min(mw - 1, x + 1);
      let m = 1;
      for (let yy = y0; yy <= y1; yy++) {
        const row = yy * mw;
        for (let xx = x0; xx <= x1; xx++) {
          const val = dilMax[row + xx];
          if (val < m) m = val;
        }
      }
      const idx = y * mw + x;
      closedFg[idx] = Math.max(maskedFg[idx], m * 0.94);
    }
  }

  // Upsample primary probability & head map to full working resolution
  const upsampledFg = bilinearUpsample(closedFg, mw, mh, w, h);
  const upsampledHead = bilinearUpsample(maskedHead, mw, mh, w, h);

  // Edge-aware 3-channel RGB Fast Guided Filter alpha matting
  const radius = Math.max(3, Math.round(Math.min(w, h) * 0.0075));
  const guided = fastGuidedFilterRGB(sourceImageData.data, upsampledFg, w, h, radius, 0.0035);

  // Trimap-locked composite so facial/clothing interiors stay 100% solid while outlines stay crisp
  const alpha = new Float32Array(w * h);
  for (let i = 0; i < alpha.length; i++) {
    const raw = upsampledFg[i];
    if (raw >= 0.82) {
      alpha[i] = 1;
    } else if (raw <= 0.04) {
      alpha[i] = 0;
    } else {
      const blended = 0.65 * guided[i] + 0.35 * raw;
      alpha[i] = smoothstep(0.28, 0.78, blended);
    }
  }

  const subjectBox = computeBoxFromWeight(alpha, w, h, 0.35);
  const headBox = computeBoxFromWeight(upsampledHead, w, h, 0.35);

  return {
    sourceCanvas: canvas,
    sourceImageData,
    alpha,
    headConfidence: upsampledHead,
    subjectBox,
    headBox,
    width: w,
    height: h,
    originalWidth,
    originalHeight,
  };
}
