import type { ToppingId } from './types';
import { TOPPINGS } from './orders';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PrepLayout {
  width: number;
  height: number;
  counterY: number;
  customerX: number;
  customerY: number;
  bubbleRect: Rect;
  boardCenterX: number;
  boardCenterY: number;
  boardRadius: number;
  matRect: Rect;
  rollRect: Rect;
  bowlCenterX: number;
  bowlCenterY: number;
  bowlRadius: number;
  trayRects: Record<ToppingId, Rect>;
  primaryBtn: Rect;
  secondaryBtn: Rect;
  limeHoldRect: Rect;
  chiliHoldRect: Rect;
  limeBarRect: Rect;
  chiliBarRect: Rect;
  shakeBtn: Rect;
  rollBtn: Rect;
}

export interface RaidLayout {
  width: number;
  height: number;
  roadX: number;
  roadW: number;
  laneCount: number;
  laneW: number;
  cartY: number;
  cartW: number;
  cartH: number;
  boostBtn: Rect;
}

export function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function getActiveCustomerRect(layout: PrepLayout): Rect {
  return {
    x: layout.customerX - 48,
    y: layout.customerY - 115,
    w: 96,
    h: 118,
  };
}

export function getWaitingCustomerRects(layout: PrepLayout, count: number): Rect[] {
  const rects: Rect[] = [];
  for (let i = 0; i < count; i++) {
    const wx = Math.min(layout.width - 70, layout.bubbleRect.x + layout.bubbleRect.w + 48 + i * 74);
    rects.push({
      x: wx - 30,
      y: layout.counterY - 96,
      w: 60,
      h: 92,
    });
  }
  return rects;
}

export function getAppeaseActiveRect(layout: PrepLayout): Rect {
  return {
    x: Math.max(12, layout.customerX - 66),
    y: layout.counterY + 4,
    w: 132,
    h: 28,
  };
}

export function getAppeaseWaitingRect(waitingRect: Rect): Rect {
  return {
    x: waitingRect.x - 12,
    y: waitingRect.y - 30,
    w: 84,
    h: 26,
  };
}

export function getLandladyRect(x: number, y: number): Rect {
  return {
    x: x - 44,
    y: y - 105,
    w: 88,
    h: 108,
  };
}

export function getLotterySellerRect(x: number, y: number): Rect {
  return {
    x: x - 42,
    y: y - 102,
    w: 84,
    h: 104,
  };
}

export function getElectricPoleRect(layout: PrepLayout): Rect {
  const poleW = layout.width >= 900 ? 64 : 50;
  const topY = Math.max(64, layout.counterY - 196);
  return {
    x: 10,
    y: topY,
    w: poleW,
    h: Math.max(120, layout.counterY - topY - 4),
  };
}

export interface FlowRhythmLayout {
  container: Rect;
  trackerRect: Rect;
  lanes: Rect[];
  padRects: Rect[];
  hitY: number;
}

export function getFlowLaneRects(layout: PrepLayout): FlowRhythmLayout {
  const cw = Math.min(560, layout.width - 36);
  const topY = layout.counterY + 52;
  const ch = Math.max(246, layout.height - topY - 18);
  const cx = layout.width * 0.5 - cw * 0.5;
  const padH = 54;
  const hitY = topY + ch - padH - 16;
  const trackerRect: Rect = {
    x: cx + 16,
    y: topY + 38,
    w: cw - 32,
    h: 30,
  };
  const laneTopY = trackerRect.y + trackerRect.h + 10;
  const laneGap = 10;
  const laneW = (cw - 36 - laneGap * 3) / 4;
  const lanes: Rect[] = [];
  const padRects: Rect[] = [];
  for (let i = 0; i < 4; i++) {
    const lx = cx + 18 + i * (laneW + laneGap);
    lanes.push({ x: lx, y: laneTopY, w: laneW, h: topY + ch - laneTopY - 14 });
    padRects.push({ x: lx, y: hitY - 22, w: laneW, h: padH });
  }
  return {
    container: { x: cx, y: topY, w: cw, h: ch },
    trackerRect,
    lanes,
    padRects,
    hitY,
  };
}

export function readSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  const cs = getComputedStyle(document.documentElement);
  const parsePx = (v: string): number => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    top: parsePx(cs.getPropertyValue('--sat')),
    right: parsePx(cs.getPropertyValue('--sar')),
    bottom: parsePx(cs.getPropertyValue('--sab')),
    left: parsePx(cs.getPropertyValue('--sal')),
  };
}

export function getQteArrowRects(w: number, h: number): Rect[] {
  const isNarrow = w < 420;
  const boxSize = isNarrow ? 48 : 54;
  const gap = isNarrow ? 10 : 14;
  const totalW = boxSize * 4 + gap * 3;
  const startX = w * 0.5 - totalW * 0.5;
  const y = h * 0.5 - 10;
  return [0, 1, 2, 3].map((i) => ({
    x: startX + i * (boxSize + gap),
    y,
    w: boxSize,
    h: boxSize,
  }));
}

export function computePrepLayout(w: number, h: number): PrepLayout {
  const insets = readSafeAreaInsets();
  const isPortrait = w < 680;
  const safeTop = Math.max(isPortrait ? 86 : 58, insets.top + (isPortrait ? 78 : 54));
  const safeBottom = Math.max(12, insets.bottom + 8);
  const counterY = isPortrait
    ? Math.max(safeTop + 128, Math.min(h * 0.34, safeTop + 165))
    : Math.max(safeTop + 175, Math.min(h * 0.38, 300));

  const maxSceneW = Math.min(w - (isPortrait ? 16 : 32), 1080);
  const sceneLeft = (w - maxSceneW) * 0.5;

  const customerX = isPortrait
    ? Math.max(48, Math.min(68, w * 0.14))
    : sceneLeft + Math.min(130, maxSceneW * 0.16);
  const customerY = counterY - 6;

  const bubbleX = isPortrait ? customerX + 54 : customerX + 90;
  const queueReserve = w >= 860 ? 185 : isPortrait ? 12 : 110;
  const bubbleW = isPortrait
    ? Math.max(180, w - bubbleX - 12 - insets.right)
    : Math.max(260, Math.min(580, sceneLeft + maxSceneW - bubbleX - queueReserve));
  const bubbleY = safeTop + 6;
  const bubbleH = counterY - bubbleY - 12;

  const workTop = counterY + 16;
  const workH = h - workTop - safeBottom;

  const btnW = isPortrait ? Math.min(220, w * 0.52) : Math.min(256, maxSceneW * 0.38);
  const btnH = isPortrait ? 48 : 50;
  const btnY = Math.min(h - btnH - safeBottom, workTop + workH - btnH - 4);

  const boardCenterX = w * 0.5;
  const boardCenterY = isPortrait ? workTop + workH * 0.38 : workTop + workH * 0.44;
  const boardRadius = isPortrait
    ? Math.max(76, Math.min(126, Math.min(workH * 0.28, (w - 36) * 0.36)))
    : Math.max(92, Math.min(144, Math.min(workH * 0.33, maxSceneW * 0.18)));

  const bowlCenterX = w * 0.5;
  const bowlCenterY = isPortrait ? workTop + Math.min(workH * 0.25, 118) : workTop + workH * 0.42;
  const bowlRadius = isPortrait
    ? Math.max(58, Math.min(86, Math.min(workH * 0.2, (w - 40) * 0.24)))
    : Math.max(82, Math.min(124, Math.min(workH * 0.3, maxSceneW * 0.16)));

  const matW = isPortrait ? Math.min(w - 32, 260) : Math.min(320, bowlRadius * 2.55);
  const matH = isPortrait ? Math.min(132, workH * 0.28) : Math.min(230, workH * 0.56);
  const matRect: Rect = {
    x: bowlCenterX - matW * 0.5,
    y: bowlCenterY - matH * 0.5,
    w: matW,
    h: matH,
  };

  const rollW = isPortrait ? Math.min(w - 40, 300) : Math.min(390, maxSceneW * 0.54);
  const rollH = isPortrait ? 72 : 82;
  const rollRect: Rect = {
    x: boardCenterX - rollW * 0.5,
    y: boardCenterY - rollH * 0.5,
    w: rollW,
    h: rollH,
  };

  const trayRects = {} as Record<ToppingId, Rect>;
  if (isPortrait) {
    // Portrait mobile: 2 rows x 4 columns in the lower thumb zone above primary CTA
    const cols = 4;
    const gapX = 8;
    const gapY = 8;
    const sidePad = Math.max(12, insets.left + 10);
    const trayW = Math.floor((w - sidePad * 2 - gapX * (cols - 1)) / cols);
    const trayH = Math.max(48, Math.min(58, (btnY - (bowlCenterY + bowlRadius + 24)) / 2.25));
    const gridStartY = Math.max(bowlCenterY + bowlRadius + 14, btnY - trayH * 2 - gapY - 14);
    TOPPINGS.forEach((t, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      trayRects[t.id] = {
        x: sidePad + col * (trayW + gapX),
        y: gridStartY + row * (trayH + gapY),
        w: trayW,
        h: trayH,
      };
    });
  } else {
    const trayW = Math.max(114, Math.min(170, (maxSceneW - bowlRadius * 2 - 96) * 0.46));
    const trayH = Math.max(46, Math.min(64, (workH - 84) / 4.4));
    const trayGapY = 8;
    const totalTrayH = trayH * 4 + trayGapY * 3;
    const trayStartY = Math.max(workTop + 48, bowlCenterY - totalTrayH * 0.5 - 6);
    const leftTrayX = Math.max(16, bowlCenterX - Math.max(bowlRadius, matW * 0.5) - 24 - trayW);
    const rightTrayX = Math.min(w - trayW - 16, bowlCenterX + Math.max(bowlRadius, matW * 0.5) + 24);

    TOPPINGS.forEach((t, idx) => {
      const isLeft = idx < 4;
      const row = idx % 4;
      trayRects[t.id] = {
        x: isLeft ? leftTrayX : rightTrayX,
        y: trayStartY + row * (trayH + trayGapY),
        w: trayW,
        h: trayH,
      };
    });
  }

  const secW = isPortrait ? Math.min(116, w * 0.34) : 132;
  const gapBtns = isPortrait ? 10 : 16;
  const totalBtnsW = secW + gapBtns + btnW;
  const secondaryBtn: Rect = {
    x: isPortrait ? w * 0.5 - totalBtnsW * 0.5 : w * 0.5 - btnW * 0.5 + 72 - 148,
    y: btnY,
    w: secW,
    h: btnH,
  };
  const primaryBtn: Rect = {
    x: isPortrait ? secondaryBtn.x + secW + gapBtns : w * 0.5 - btnW * 0.5 + 72,
    y: btnY,
    w: btnW,
    h: btnH,
  };

  const limeHoldW = isPortrait ? Math.min(122, Math.floor(w * 0.33)) : 144;
  const barW = isPortrait ? Math.max(130, w - limeHoldW - 68) : Math.min(340, maxSceneW * 0.48);
  const barH = 26;
  const holdH = isPortrait ? 52 : 58;
  const gapHold = isPortrait ? 12 : 18;
  const seasonStartY = isPortrait ? workTop + 34 : bowlCenterY - 56;
  const seasonLeftX = w * 0.5 - (limeHoldW + gapHold + barW) * 0.5;

  const limeHoldRect: Rect = {
    x: seasonLeftX,
    y: seasonStartY,
    w: limeHoldW,
    h: holdH,
  };
  const limeBarRect: Rect = {
    x: seasonLeftX + limeHoldW + gapHold,
    y: seasonStartY + (holdH - barH) * 0.5,
    w: barW,
    h: barH,
  };

  const chiliHoldRect: Rect = {
    x: seasonLeftX,
    y: seasonStartY + holdH + 20,
    w: limeHoldW,
    h: holdH,
  };
  const chiliBarRect: Rect = {
    x: seasonLeftX + limeHoldW + gapHold,
    y: seasonStartY + holdH + 20 + (holdH - barH) * 0.5,
    w: barW,
    h: barH,
  };

  const shakeBtnW = isPortrait ? Math.min(264, w - 32) : 276;
  const shakeBtn: Rect = {
    x: w * 0.5 - shakeBtnW * 0.5,
    y: btnY - 62,
    w: shakeBtnW,
    h: 52,
  };

  const rollBtnW = isPortrait ? Math.min(250, w - 32) : 250;
  const rollBtn: Rect = {
    x: w * 0.5 - rollBtnW * 0.5,
    y: btnY,
    w: rollBtnW,
    h: 50,
  };

  return {
    width: w,
    height: h,
    counterY,
    customerX,
    customerY,
    bubbleRect: { x: bubbleX, y: bubbleY, w: bubbleW, h: bubbleH },
    boardCenterX,
    boardCenterY,
    boardRadius,
    matRect,
    rollRect,
    bowlCenterX,
    bowlCenterY,
    bowlRadius,
    trayRects,
    primaryBtn,
    secondaryBtn,
    limeHoldRect,
    chiliHoldRect,
    limeBarRect,
    chiliBarRect,
    shakeBtn,
    rollBtn,
  };
}

export function computeRaidLayout(w: number, h: number): RaidLayout {
  const insets = readSafeAreaInsets();
  const isPortrait = w < 680;
  const safeBottom = Math.max(14, insets.bottom + 10);
  const laneCount = 4;
  const roadW = isPortrait ? Math.min(400, w - 24) : Math.min(560, Math.max(320, w * 0.54));
  const roadX = (w - roadW) * 0.5;
  const laneW = roadW / laneCount;
  const cartW = Math.min(88, laneW * 0.68);
  const cartH = cartW * 1.3;
  const cartY = h - cartH - safeBottom - (isPortrait ? 74 : 82);

  const boostBtn: Rect = isPortrait
    ? {
        x: w - 154 - Math.max(12, insets.right + 10),
        y: h - safeBottom - 54,
        w: 146,
        h: 50,
      }
    : {
        x: Math.min(w - 178, roadX + roadW + 24),
        y: h - safeBottom - 64,
        w: 158,
        h: 54,
      };

  return {
    width: w,
    height: h,
    roadX,
    roadW,
    laneCount,
    laneW,
    cartY,
    cartW,
    cartH,
    boostBtn,
  };
}
