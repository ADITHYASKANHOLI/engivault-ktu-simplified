/**
 * Dynamic ID Card Front Composer
 *
 * Produces a 1024x1440 portrait ID card texture tailored for components/Lanyard.jsx:
 *  - Clean off-white textured matte cardstock surface (#FFFFFF -> #F6F8FA)
 *  - Subtle monochrome FOLE brand mark in the upper-left corner
 *  - Authenticated user's dynamic @username in the upper-right corner
 *  - Calculated clearance zone for Lanyard's top slot cutout & metal hardware
 *  - Centered isolated monochrome portrait layered directly on the card surface,
 *    framed from head/hair crown through upper shoulders & torso extending to card bottom
 *  - Clean, properly cropped fallback card builder when background removal cannot complete
 */

import type { BoundingBox } from "./segmentPerson";

export const CARD_WIDTH = 1024;
export const CARD_HEIGHT = Math.round((1024 * 2.25) / 1.6); // 1440, matching Lanyard.jsx

export interface ComposedIdCard {
  canvas: HTMLCanvasElement;
  blob: Blob;
  objectUrl: string;
  width: number;
  height: number;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function normalizeUsername(username: string): string {
  const cleaned = (username || "student").trim().replace(/^@+/, "");
  return `@${cleaned || "student"}`;
}

function paintCardSurface(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#FFFFFF");
  grad.addColorStop(0.55, "#F9FAFB");
  grad.addColorStop(1, "#F3F5F8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Ultra-subtle tactile paper grain across card background
  const tileSize = 128;
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = tileSize;
  grainCanvas.height = tileSize;
  const gCtx = grainCanvas.getContext("2d");
  if (gCtx) {
    const img = gCtx.createImageData(tileSize, tileSize);
    let seed = 42197;
    for (let i = 0; i < img.data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const n = ((seed >>> 24) & 0xff) - 128;
      const shade = clamp(246 + Math.round(n * 0.045), 235, 255);
      img.data[i] = shade;
      img.data[i + 1] = shade;
      img.data[i + 2] = shade + 1;
      img.data[i + 3] = 28;
    }
    gCtx.putImageData(img, 0, 0);
    const pattern = ctx.createPattern(grainCanvas, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, w, h);
    }
  }
}

/**
 * Draw the exact monochrome vector FOLE mark from FoleLogoVector.tsx in upper-left.
 * Placed safely inside rounded bevel corner (r~75px) and left of center slot (x~400..624).
 */
function drawFoleHeaderMark(ctx: CanvasRenderingContext2D) {
  ctx.save();
  // FoleLogoVector viewBox is -400 -120 800 240 (800 x 240 -> aspect 10:3)
  // Scale 0.16 renders ~128px wide x 38px tall at (x: 78..206, y: 76..114)
  const scale = 0.165;
  ctx.translate(78 + 400 * scale, 78 + 120 * scale);
  ctx.scale(scale, scale);

  const primaryInk = "rgba(15, 23, 42, 0.86)";
  const accentInk = "rgba(51, 65, 85, 0.78)";

  if (typeof Path2D !== "undefined") {
    ctx.fillStyle = primaryInk;
    ctx.fill(
      new Path2D(
        "M-360,-95 H-210 A8,8 0 0 1 -202,-87 V-57 A8,8 0 0 1 -210,-49 H-306 V-20 H-230 A8,8 0 0 1 -222,-12 V16 A8,8 0 0 1 -230,24 H-306 V87 A8,8 0 0 1 -314,95 H-360 A8,8 0 0 1 -368,87 V-87 A8,8 0 0 1 -360,-95 Z"
      )
    );

    ctx.beginPath();
    ctx.arc(-92, 0, 102, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.arc(-92, -46, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accentInk;
    ctx.beginPath();
    ctx.arc(-92, -46, 17, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F8FAFC";
    ctx.fill(
      new Path2D(
        "M-87,-6 C-70,-24 -44,-30 -30,-28 L-30,34 C-47,32 -70,40 -87,58 Z"
      )
    );
    ctx.fill(
      new Path2D(
        "M-97,-6 C-114,-24 -140,-30 -154,-28 L-154,34 C-137,32 -114,40 -97,58 Z"
      )
    );

    ctx.fillStyle = primaryInk;
    ctx.fill(
      new Path2D(
        "M36,-95 H82 A8,8 0 0 1 90,-87 V49 H182 A8,8 0 0 1 190,57 V87 A8,8 0 0 1 182,95 H36 A8,8 0 0 1 28,87 V-87 A8,8 0 0 1 36,-95 Z"
      )
    );
    ctx.fill(
      new Path2D(
        "M214,-95 H364 A8,8 0 0 1 372,-87 V-59 A8,8 0 0 1 364,-51 H268 V-21 H344 A8,8 0 0 1 352,-13 V13 A8,8 0 0 1 344,21 H268 V51 H364 A8,8 0 0 1 372,59 V87 A8,8 0 0 1 364,95 H214 A8,8 0 0 1 206,87 V-87 A8,8 0 0 1 214,-95 Z"
      )
    );
  } else {
    ctx.font = '700 180px ui-sans-serif, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = primaryInk;
    ctx.textBaseline = "middle";
    ctx.fillText("FOLE", -360, 0);
  }

  ctx.restore();
}

/**
 * Draw the authenticated user's dynamic @username in the upper-right corner,
 * cleanly right-aligned and constrained to avoid the center slot cutout (x <= 624).
 */
function drawUsernameHeader(ctx: CanvasRenderingContext2D, username: string) {
  ctx.save();
  const handle = normalizeUsername(username);
  const rightX = CARD_WIDTH - 78; // 946, clears top-right rounded corner nicely
  const maxWidth = 286; // Stays cleanly >= 660, right of the 624 slot boundary

  let fontSize = 30;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  while (fontSize > 19) {
    ctx.font = `600 ${fontSize}px "Inter", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    if (ctx.measureText(handle).width <= maxWidth) break;
    fontSize -= 1;
  }

  let displayHandle = handle;
  if (ctx.measureText(displayHandle).width > maxWidth) {
    while (displayHandle.length > 4 && ctx.measureText(`${displayHandle}…`).width > maxWidth) {
      displayHandle = displayHandle.slice(0, -1);
    }
    displayHandle = `${displayHandle}…`;
  }

  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.fillText(displayHandle, rightX, 94);

  // Subtle understated institutional label below username
  ctx.font = `600 13px "Inter", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = "rgba(100, 116, 139, 0.85)";
  ctx.fillText("FOLE STUDENT ID", rightX, 122);
  ctx.restore();
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to serialize ID card PNG."));
    }, "image/png");
  });
}

/**
 * Feather left/right cropped image boundaries ONLY when the source portrait was
 * tightly cropped at the camera edge inside the destination card bounds, preventing
 * hard vertical cut seams against the white card background.
 */
function prepareSoftEdgePortraitCanvas(
  portraitCanvas: HTMLCanvasElement,
  featherLeft: boolean,
  featherRight: boolean
): HTMLCanvasElement {
  if (!featherLeft && !featherRight) return portraitCanvas;

  const w = portraitCanvas.width;
  const h = portraitCanvas.height;
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const ctx = tmp.getContext("2d");
  if (!ctx) return portraitCanvas;

  ctx.drawImage(portraitCanvas, 0, 0);
  ctx.globalCompositeOperation = "destination-in";

  const featherW = Math.min(Math.floor(w / 3), Math.max(24, Math.round(w * 0.08)));
  const leftBand = featherLeft ? featherW : 0;
  const rightBand = featherRight ? featherW : 0;
  const midStart = leftBand;
  const midEnd = w - rightBand;

  if (featherLeft) {
    const gL = ctx.createLinearGradient(0, 0, leftBand, 0);
    gL.addColorStop(0, "rgba(0,0,0,0)");
    gL.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = gL;
    ctx.fillRect(0, 0, leftBand, h);
  }
  if (midEnd > midStart) {
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(midStart, 0, midEnd - midStart, h);
  }
  if (featherRight) {
    const gR = ctx.createLinearGradient(midEnd, 0, w, 0);
    gR.addColorStop(0, "rgba(0,0,0,1)");
    gR.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gR;
    ctx.fillRect(midEnd, 0, rightBand, h);
  }
  ctx.globalCompositeOperation = "source-over";
  return tmp;
}

/**
 * Compose an isolated monochrome portrait onto the personalized white ID card front.
 */
export async function composeIsolatedPortraitIdCard({
  portraitCanvas,
  subjectBox,
  headBox,
  username,
}: {
  portraitCanvas: HTMLCanvasElement;
  subjectBox: BoundingBox;
  headBox: BoundingBox;
  username: string;
}): Promise<ComposedIdCard> {
  const card = document.createElement("canvas");
  card.width = CARD_WIDTH;
  card.height = CARD_HEIGHT;
  const ctx = card.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to acquire 2D canvas context for ID card composition.");
  }

  paintCardSurface(ctx, CARD_WIDTH, CARD_HEIGHT);
  drawFoleHeaderMark(ctx);
  drawUsernameHeader(ctx, username);

  const sw = portraitCanvas.width;
  const sh = portraitCanvas.height;

  // Determine ideal upper-body / bust bottom boundary:
  // If user uploaded a wide sitting or full-body photo, frame gracefully around upper torso/chest
  // (~2.55x head height below top of head) so face & shoulders fill the card cleanly.
  const bustEstimateBottom =
    subjectBox.height > headBox.height * 3.05
      ? subjectBox.minY + headBox.height * 2.55
      : subjectBox.minY + Math.max(headBox.height * 2.65, subjectBox.height * 0.85);
  const touchesBottomEdge = subjectBox.maxY >= sh - 4;
  const sourceCropBottom = touchesBottomEdge
    ? Math.min(sh, subjectBox.height < headBox.height * 3.05 ? sh : bustEstimateBottom)
    : Math.min(sh, Math.min(subjectBox.maxY + 2, bustEstimateBottom));

  const sourceCropTop = Math.max(0, subjectBox.minY - headBox.height * 0.04);
  const cropHeight = Math.max(48, sourceCropBottom - sourceCropTop);

  // Maintain safe top clearance below slot cutout (y=110) and header typography (y=125)
  const minHeadTopY = 215;
  const availableHeight = CARD_HEIGHT - minHeadTopY;

  // Fit vertically from targetTop to CARD_HEIGHT, while keeping head proportions balanced
  let scale = availableHeight / cropHeight;

  // Guard against overly huge faces in tight headshots clipping ears off card sides
  const maxHeadScale = (CARD_WIDTH * 0.54) / Math.max(headBox.width, 1);
  if (scale > maxHeadScale) {
    scale = maxHeadScale;
  }

  // Ensure foreground doesn't shrink excessively narrow horizontally if cropped on camera borders
  const touchedLeft = subjectBox.minX <= 2;
  const touchedRight = subjectBox.maxX >= sw - 3;

  // Align horizontal center of user's head/face directly to horizontal card center (512)
  let destLeft = CARD_WIDTH / 2 - headBox.centerX * scale;
  const destWidth = sw * scale;
  const destHeight = sh * scale;

  // Clamp subtle horizontal drift if head alignment would leave asymmetric empty side margin on edge-cropped photo
  if (touchedLeft && destLeft > 0 && destLeft + destWidth < CARD_WIDTH) {
    destLeft = Math.max(destLeft - Math.min(destLeft, 48), (CARD_WIDTH - destWidth) / 2);
  }

  // Anchor cropped bottom strictly flush with CARD_HEIGHT (1440) so subject never floats mid-card
  const destTop = CARD_HEIGHT - sourceCropBottom * scale;
  // Ensure top of hair never rises into lanyard hardware / header zone
  const finalTop =
    destTop + subjectBox.minY * scale < minHeadTopY
      ? minHeadTopY - subjectBox.minY * scale
      : destTop;

  const preparedPortrait = prepareSoftEdgePortraitCanvas(
    portraitCanvas,
    touchedLeft && destLeft > 2,
    touchedRight && destLeft + destWidth < CARD_WIDTH - 2
  );

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(preparedPortrait, destLeft, finalTop, destWidth, destHeight);

  // Subtle paper-surface harmony whisper at bottom card edge so shoulders blend organically
  const bottomBlend = ctx.createLinearGradient(0, CARD_HEIGHT - 64, 0, CARD_HEIGHT);
  bottomBlend.addColorStop(0, "rgba(243, 245, 248, 0)");
  bottomBlend.addColorStop(1, "rgba(243, 245, 248, 0.16)");
  ctx.fillStyle = bottomBlend;
  ctx.fillRect(0, CARD_HEIGHT - 64, CARD_WIDTH, 64);
  ctx.restore();

  const blob = await canvasToBlob(card);
  const objectUrl = URL.createObjectURL(blob);

  return {
    canvas: card,
    blob,
    objectUrl,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  };
}

/**
 * Fallback ID Card composer: preserves user's uploaded photo with clean top-weighted
 * rounded framing when foreground person segmentation fails or finds no clear subject.
 */
export async function composeFallbackIdCard({
  sourceCanvas,
  username,
}: {
  sourceCanvas: HTMLCanvasElement;
  username: string;
}): Promise<ComposedIdCard> {
  const card = document.createElement("canvas");
  card.width = CARD_WIDTH;
  card.height = CARD_HEIGHT;
  const ctx = card.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to acquire 2D canvas context for fallback ID card.");
  }

  paintCardSurface(ctx, CARD_WIDTH, CARD_HEIGHT);
  drawFoleHeaderMark(ctx);
  drawUsernameHeader(ctx, username);

  // Clean centered portrait frame below top slot/header clearance
  const frameX = 78;
  const frameY = 205;
  const frameW = CARD_WIDTH - 156;
  const frameH = CARD_HEIGHT - frameY - 72;

  ctx.save();
  drawRoundedRectPath(ctx, frameX, frameY, frameW, frameH, 36);
  ctx.clip();

  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  const coverScale = Math.max(frameW / sw, frameH / sh);
  const drawW = sw * coverScale;
  const drawH = sh * coverScale;
  const drawX = frameX + (frameW - drawW) / 2;
  // Slightly top-weighted (0.28) vertical crop so portrait faces aren't cut at forehead
  const drawY = frameY + (frameH - drawH) * 0.28;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceCanvas, drawX, drawY, drawW, drawH);
  ctx.restore();

  // Hairline matte frame border
  ctx.save();
  drawRoundedRectPath(ctx, frameX, frameY, frameW, frameH, 36);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
  ctx.stroke();
  ctx.restore();

  const blob = await canvasToBlob(card);
  const objectUrl = URL.createObjectURL(blob);

  return {
    canvas: card,
    blob,
    objectUrl,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  };
}

/**
 * Clean personalized starter/empty ID card rendered on white cardstock
 * before a user uploads their photograph (matching Requirements C & G aesthetic).
 */
export async function composeStarterIdCard(username: string): Promise<ComposedIdCard> {
  const card = document.createElement("canvas");
  card.width = CARD_WIDTH;
  card.height = CARD_HEIGHT;
  const ctx = card.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to acquire 2D canvas context.");
  }

  paintCardSurface(ctx, CARD_WIDTH, CARD_HEIGHT);
  drawFoleHeaderMark(ctx);
  drawUsernameHeader(ctx, username);

  // Subtle centered monochrome silhouette extending gracefully toward bottom
  ctx.save();
  const silGrad = ctx.createLinearGradient(0, 420, 0, CARD_HEIGHT);
  silGrad.addColorStop(0, "rgba(15, 23, 42, 0.11)");
  silGrad.addColorStop(1, "rgba(15, 23, 42, 0.04)");
  ctx.fillStyle = silGrad;

  // Head
  ctx.beginPath();
  ctx.arc(CARD_WIDTH / 2, 575, 165, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders & upper torso extending to bottom
  ctx.beginPath();
  ctx.moveTo(140, CARD_HEIGHT);
  ctx.bezierCurveTo(155, 1020, 290, 825, CARD_WIDTH / 2, 825);
  ctx.bezierCurveTo(734, 825, 869, 1020, 884, CARD_HEIGHT);
  ctx.closePath();
  ctx.fill();

  ctx.font = `500 24px "Inter", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = "rgba(71, 85, 105, 0.72)";
  ctx.textAlign = "center";
  ctx.fillText("Upload your portrait below", CARD_WIDTH / 2, 1280);
  ctx.restore();

  const blob = await canvasToBlob(card);
  const objectUrl = URL.createObjectURL(blob);

  return {
    canvas: card,
    blob,
    objectUrl,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  };
}

