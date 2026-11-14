import type { Point2D, PolygonSlice } from './types';

export function computePolygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) * 0.5;
}

export function computePolygonCentroid(points: Point2D[]): Point2D {
  if (points.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

export function createInitialRicePaper(cx: number, cy: number, radius: number, nextId: () => number): PolygonSlice {
  const sides = 14;
  const points: Point2D[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const jitter = 0.96 + (i % 3) * 0.02;
    points.push({
      x: cx + Math.cos(angle) * radius * jitter,
      y: cy + Math.sin(angle) * radius * jitter,
    });
  }
  const area = computePolygonArea(points);
  return {
    id: nextId(),
    points,
    cx,
    cy,
    vx: 0,
    vy: 0,
    angle: 0,
    va: 0,
    area,
    hitFlash: 0,
  };
}

export function createInitialRollPolygon(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  nextId: () => number
): PolygonSlice {
  // Plump rounded-stadium convex polygon representing a rolled Bánh Tráng Cuốn
  const points: Point2D[] = [];
  const capRadius = halfH;
  const straightHalf = Math.max(20, halfW - capRadius);

  // Right cap (top to bottom)
  for (let i = -3; i <= 3; i++) {
    const a = (i / 3) * (Math.PI * 0.5);
    points.push({
      x: cx + straightHalf + Math.cos(a) * capRadius,
      y: cy + Math.sin(a) * capRadius,
    });
  }
  // Left cap (bottom to top)
  for (let i = -3; i <= 3; i++) {
    const a = Math.PI + (i / 3) * (Math.PI * 0.5);
    points.push({
      x: cx - straightHalf + Math.cos(a) * capRadius,
      y: cy + Math.sin(a) * capRadius,
    });
  }

  const area = computePolygonArea(points);
  return {
    id: nextId(),
    points,
    cx,
    cy,
    vx: 0,
    vy: 0,
    angle: 0,
    va: 0,
    area,
    hitFlash: 0,
  };
}

function segmentsIntersect(a: Point2D, b: Point2D, c: Point2D, d: Point2D): boolean {
  const ccw = (p1: Point2D, p2: Point2D, p3: Point2D) =>
    (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}

function countSegmentPolygonIntersections(slice: PolygonSlice, a: Point2D, b: Point2D): number {
  const cos = Math.cos(-slice.angle);
  const sin = Math.sin(-slice.angle);
  const toLocal = (p: Point2D): Point2D => {
    const dx = p.x - slice.cx;
    const dy = p.y - slice.cy;
    return {
      x: dx * cos - dy * sin + slice.cx,
      y: dx * sin + dy * cos + slice.cy,
    };
  };

  const la = toLocal(a);
  const lb = toLocal(b);

  let intersections = 0;
  const pts = slice.points;
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    if (segmentsIntersect(la, lb, p1, p2)) {
      intersections++;
    }
  }
  return intersections;
}

export function splitPolygonBySegment(
  slice: PolygonSlice,
  segA: Point2D,
  segB: Point2D,
  nextId: () => number,
  allowExtendedLine = false,
  minPieceArea = 380
): PolygonSlice[] | null {
  let useA = segA;
  let useB = segB;

  const dxRaw = segB.x - segA.x;
  const dyRaw = segB.y - segA.y;
  const lenRaw = Math.hypot(dxRaw, dyRaw);
  if (lenRaw < 14) return null;

  let hitCount = countSegmentPolygonIntersections(slice, useA, useB);
  if (hitCount < 2 && allowExtendedLine && lenRaw >= 32) {
    const ux = dxRaw / lenRaw;
    const uy = dyRaw / lenRaw;
    useA = { x: segA.x - ux * 280, y: segA.y - uy * 280 };
    useB = { x: segB.x + ux * 280, y: segB.y + uy * 280 };
    hitCount = countSegmentPolygonIntersections(slice, useA, useB);
  }

  if (hitCount < 2) {
    return null;
  }

  const cos = Math.cos(-slice.angle);
  const sin = Math.sin(-slice.angle);
  const toLocal = (p: Point2D): Point2D => {
    const dx = p.x - slice.cx;
    const dy = p.y - slice.cy;
    return {
      x: dx * cos - dy * sin + slice.cx,
      y: dx * sin + dy * cos + slice.cy,
    };
  };

  const a = toLocal(useA);
  const b = toLocal(useB);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 12) return null;

  const nx = -dy / len;
  const ny = dx / len;

  const side = (p: Point2D) => (p.x - a.x) * dy - (p.y - a.y) * dx;

  const leftPts: Point2D[] = [];
  const rightPts: Point2D[] = [];

  const pts = slice.points;
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const nxt = pts[(i + 1) % pts.length];
    const dCur = side(cur);
    const dNxt = side(nxt);

    if (dCur >= 0) leftPts.push(cur);
    if (dCur <= 0) rightPts.push(cur);

    if ((dCur > 0 && dNxt < 0) || (dCur < 0 && dNxt > 0)) {
      const t = dCur / (dCur - dNxt);
      const inter: Point2D = {
        x: cur.x + (nxt.x - cur.x) * t,
        y: cur.y + (nxt.y - cur.y) * t,
      };
      leftPts.push(inter);
      rightPts.push(inter);
    }
  }

  const areaL = computePolygonArea(leftPts);
  const areaR = computePolygonArea(rightPts);

  if (areaL < minPieceArea || areaR < minPieceArea) {
    return null;
  }

  const wCos = Math.cos(slice.angle);
  const wSin = Math.sin(slice.angle);
  const toWorld = (p: Point2D): Point2D => {
    const lx = p.x - slice.cx;
    const ly = p.y - slice.cy;
    return {
      x: lx * wCos - ly * wSin + slice.cx,
      y: lx * wSin + ly * wCos + slice.cy,
    };
  };

  const makePiece = (localPts: Point2D[], area: number, pushSign: number): PolygonSlice => {
    const worldPts = localPts.map(toWorld);
    const c = computePolygonCentroid(worldPts);
    const wnx = nx * wCos - ny * wSin;
    const wny = nx * wSin + ny * wCos;
    const pushSpeed = 52;
    return {
      id: nextId(),
      points: worldPts,
      cx: c.x,
      cy: c.y,
      vx: slice.vx + wnx * pushSpeed * pushSign,
      vy: slice.vy + wny * pushSpeed * pushSign,
      angle: 0,
      va: pushSign * (Math.random() * 0.3 + 0.1),
      area,
      hitFlash: 1,
    };
  };

  return [makePiece(leftPts, areaL, 1), makePiece(rightPts, areaR, -1)];
}
