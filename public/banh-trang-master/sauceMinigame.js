// Mechanic 2: Daily Secret Sauce Minigame (30-second Morning Pot)
// Player adds Beef Broth, Chili, and Tamarind into a simmering pot to match exact target ratios.

import { SAUCE_INGREDIENTS } from './state.js';
import { sfx } from './audio.js';

export class SecretSauceMinigame {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.reset();
  }

  reset() {
    // Generate crisp morning target recipe ratios summing cleanly
    const targets = [
      { broth: 45, chili: 20, tamarind: 35 },
      { broth: 40, chili: 28, tamarind: 32 },
      { broth: 50, chili: 16, tamarind: 34 },
      { broth: 35, chili: 24, tamarind: 41 },
    ];
    const pick = targets[Math.floor(Math.random() * targets.length)];
    this.target = { ...pick };
    this.amounts = { broth: 0, chili: 0, tamarind: 0 };
    this.tolerance = 6; // ±6 ml window counts as exact match
    this.timeLeft = 30.0;
    this.finished = false;
    this.result = null;
    this.bubbles = Array.from({ length: 18 }, () => ({
      x: (Math.random() - 0.5) * 140,
      y: Math.random() * 40,
      r: 3 + Math.random() * 6,
      speed: 22 + Math.random() * 35,
    }));
    this.pourFlash = { broth: 0, chili: 0, tamarind: 0 };
    this.hitZones = []; // Computed on render for direct canvas ladle clicks
  }

  addIngredient(id, mult = 1) {
    if (this.finished) return;
    const ing = SAUCE_INGREDIENTS.find((i) => i.id === id);
    if (!ing) return;
    this.amounts[id] = Math.min(80, this.amounts[id] + ing.stepPerClick * mult);
    this.pourFlash[id] = 0.25;
    sfx.playPour();
  }

  finishEarly() {
    if (this.finished) return;
    this.evaluate();
  }

  evaluate() {
    this.finished = true;
    const diffs = {
      broth: this.amounts.broth - this.target.broth,
      chili: this.amounts.chili - this.target.chili,
      tamarind: this.amounts.tamarind - this.target.tamarind,
    };

    const absTotal = Math.abs(diffs.broth) + Math.abs(diffs.chili) + Math.abs(diffs.tamarind);
    const allWithinWindow =
      Math.abs(diffs.broth) <= this.tolerance &&
      Math.abs(diffs.chili) <= this.tolerance &&
      Math.abs(diffs.tamarind) <= this.tolerance;

    if (allWithinWindow && absTotal <= 12) {
      this.result = {
        status: 'DELICIOUS',
        title: 'NỒI SỐT TUYỆT HẢO (DELICIOUS BUFF)',
        detail: 'Tỷ lệ Nước Dầm Bò, Sa Tế và Me chuẩn từng giọt! Kích hoạt +20% Tiền Tip cả ngày hôm nay.',
        buff: 'DELICIOUS',
      };
      sfx.playSuccess();
    } else {
      let reason = 'Tỷ lệ gia vị chưa cân bằng';
      if (diffs.broth > 8) reason = 'Quá nhiều Nước Dầm Bò -> Sốt BỊ MẶN CHÁT!';
      else if (diffs.chili > 8) reason = 'Quá nhiều Sa Tế -> Sốt CAY XÉ LƯỠI!';
      else if (diffs.tamarind > 8) reason = 'Quá nhiều Cốt Me -> Sốt CHUA LÈ!';
      else if (this.amounts.broth + this.amounts.chili + this.amounts.tamarind < 40) {
        reason = 'Nồi sốt quá ít gia vị -> Nhạt nhẽo!';
      }

      this.result = {
        status: 'TOO_SALTY',
        title: 'SỐT LỆCH VỊ (DEBUFF TRÀ ĐÁ)',
        detail: `${reason} Khách sẽ phàn nàn và đòi tặng Trà Đá miễn phí cả ngày!`,
        buff: 'TOO_SALTY',
      };
      sfx.playFail();
    }

    if (this.onComplete) {
      this.onComplete(this.result);
    }
  }

  update(dt) {
    if (!this.finished) {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft <= 0) {
        this.evaluate();
      }
    }

    Object.keys(this.pourFlash).forEach((k) => {
      this.pourFlash[k] = Math.max(0, this.pourFlash[k] - dt);
    });

    for (const b of this.bubbles) {
      b.y -= b.speed * dt;
      if (b.y < -30) {
        b.y = 26 + Math.random() * 14;
        b.x = (Math.random() - 0.5) * 140;
      }
    }
  }

  handlePointerDown(x, y) {
    for (const zone of this.hitZones) {
      if (x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h) {
        if (zone.action === 'FINISH') {
          this.finishEarly();
        } else if (zone.action === 'RETRY') {
          this.reset();
        } else if (zone.ingredientId) {
          this.addIngredient(zone.ingredientId);
        }
        return true;
      }
    }
    return false;
  }

  render(ctx, width, height) {
    this.hitZones = [];

    // Warm morning street-stall counter backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(0.55, '#292524');
    bgGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle stainless steel table edge
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, height * 0.68, width, height * 0.32);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, height * 0.68, width, 6);

    // Header Banner
    ctx.fillStyle = '#fef3c7';
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BƯỚC KHỞI ĐỘNG SÁNG: NẤU NỒI SỐT BÍ TRUYỀN', 28, 42);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText('Bấm rót từng loại gia vị vào nồi sao cho vừa khít vạch vàng (±6ml).', 28, 65);

    // 30s Countdown Timer badge
    const timerColor = this.timeLeft <= 8 ? '#ef4444' : '#f59e0b';
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = timerColor;
    ctx.lineWidth = 3;
    roundRect(ctx, width - 170, 20, 142, 48, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = timerColor;
    ctx.font = '800 22px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.timeLeft.toFixed(1)}s`, width - 99, 52);

    // Draw Simmering Pot in Center
    const potX = width * 0.34;
    const potY = height * 0.56;

    // Burner flame glow
    ctx.save();
    const flamePulse = 0.85 + Math.sin(performance.now() * 0.015) * 0.15;
    ctx.fillStyle = `rgba(249, 115, 22, ${0.45 * flamePulse})`;
    ctx.beginPath();
    ctx.ellipse(potX, potY + 78, 95, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Pot Handles
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(potX - 115, potY + 12, 18, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(potX + 115, potY + 12, 18, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();

    // Pot Body
    const potGrad = ctx.createLinearGradient(potX - 110, 0, potX + 110, 0);
    potGrad.addColorStop(0, '#64748b');
    potGrad.addColorStop(0.35, '#cbd5e1');
    potGrad.addColorStop(0.75, '#94a3b8');
    potGrad.addColorStop(1, '#475569');
    ctx.fillStyle = potGrad;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    roundRect(ctx, potX - 110, potY - 35, 220, 105, 18);
    ctx.fill();
    ctx.stroke();

    // Pot Rim & Liquid Color blended dynamically from ingredients
    const total = Math.max(1, this.amounts.broth + this.amounts.chili + this.amounts.tamarind);
    const r = Math.min(230, Math.round(95 + (this.amounts.chili / total) * 130 + (this.amounts.broth / total) * 45));
    const g = Math.min(180, Math.round(62 + (this.amounts.tamarind / total) * 75));
    const b = Math.round(28 + (this.amounts.broth / total) * 18);

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(potX, potY - 35, 110, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = total <= 1 ? '#451a03' : `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.ellipse(potX, potY - 32, 98, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Simmering bubbles inside pot
    for (const bub of this.bubbles) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.5)';
      ctx.beginPath();
      ctx.arc(potX + bub.x * 0.55, potY - 30 + bub.y * 0.25, bub.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ingredient Ladle Buttons below pot
    const cardW = 148;
    const cardGap = 14;
    const startX = potX - ((cardW * 3 + cardGap * 2) / 2) + 25;
    const btnY = height * 0.74;

    SAUCE_INGREDIENTS.forEach((ing, idx) => {
      const bx = startX + idx * (cardW + cardGap);
      const flashing = this.pourFlash[ing.id] > 0;
      ctx.fillStyle = flashing ? '#fef08a' : '#fffdf5';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      roundRect(ctx, bx, btnY, cardW, 86, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = ing.color;
      ctx.fillRect(bx + 10, btnY + 10, cardW - 20, 8);

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+ Rót ${ing.name}`, bx + cardW / 2, btnY + 38);

      ctx.fillStyle = '#475569';
      ctx.font = '700 12px ui-monospace, monospace';
      ctx.fillText(`+${ing.stepPerClick}${ing.unit} / lần`, bx + cardW / 2, btnY + 58);

      ctx.fillStyle = ing.color;
      ctx.font = '700 11px system-ui, sans-serif';
      ctx.fillText(`Hiện tại: ${this.amounts[ing.id]}${ing.unit}`, bx + cardW / 2, btnY + 75);

      this.hitZones.push({
        x: bx,
        y: btnY,
        w: cardW,
        h: 86,
        ingredientId: ing.id,
      });
    });

    // Right Panel: Target Ratio Gauges
    const panelX = width * 0.62;
    const panelY = 92;
    const panelW = width * 0.34;
    const panelH = 278;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    roundRect(ctx, panelX, panelY, panelW, panelH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = '800 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CÔNG THỨC MỤC TIÊU HÔM NAY', panelX + 18, panelY + 28);

    SAUCE_INGREDIENTS.forEach((ing, i) => {
      const gy = panelY + 56 + i * 68;
      const cur = this.amounts[ing.id];
      const tgt = this.target[ing.id];
      const maxScale = 70;
      const diff = Math.abs(cur - tgt);
      const inZone = diff <= this.tolerance;

      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ing.name, panelX + 18, gy);

      ctx.fillStyle = inZone ? '#4ade80' : '#f8fafc';
      ctx.font = '800 13px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${cur} / ${tgt}${ing.unit}`, panelX + panelW - 18, gy);

      // Bar track
      const barX = panelX + 18;
      const barY = gy + 10;
      const barW = panelW - 36;
      const barH = 18;
      ctx.fillStyle = '#1e293b';
      roundRect(ctx, barX, barY, barW, barH, 6);
      ctx.fill();

      // Target sweet-spot zone
      const minZ = Math.max(0, (tgt - this.tolerance) / maxScale);
      const maxZ = Math.min(1, (tgt + this.tolerance) / maxScale);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.fillRect(barX + minZ * barW, barY, (maxZ - minZ) * barW, barH);

      // Fill bar
      const fillRatio = Math.min(1, cur / maxScale);
      ctx.fillStyle = inZone ? '#22c55e' : cur > tgt + this.tolerance ? '#ef4444' : ing.accent;
      roundRect(ctx, barX, barY, Math.max(4, fillRatio * barW), barH, 6);
      ctx.fill();

      // Target marker line
      const markerX = barX + (tgt / maxScale) * barW;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(markerX, barY - 3);
      ctx.lineTo(markerX, barY + barH + 3);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ing.note, panelX + 18, barY + 34);
    });

    // Finish Pot CTA Button
    if (!this.finished) {
      const fbx = panelX;
      const fby = panelY + panelH + 14;
      const fbw = panelW;
      const fbh = 52;
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      roundRect(ctx, fbx, fby, fbw, fbh, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#052e16';
      ctx.font = '900 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CHỐT NỒI SỐT & MỞ QUÁN →', fbx + fbw / 2, fby + 32);

      this.hitZones.push({
        x: fbx,
        y: fby,
        w: fbw,
        h: fbh,
        action: 'FINISH',
      });
    } else if (this.result) {
      // Outcome banner inside canvas
      const boxY = panelY + panelH + 12;
      const isGood = this.result.status === 'DELICIOUS';
      ctx.fillStyle = isGood ? '#064e3b' : '#7f1d1d';
      ctx.strokeStyle = isGood ? '#34d399' : '#fca5a5';
      ctx.lineWidth = 2.5;
      roundRect(ctx, panelX, boxY, panelW, 92, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(this.result.title, panelX + 14, boxY + 24);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '500 12px system-ui, sans-serif';
      wrapText(ctx, this.result.detail, panelX + 14, boxY + 45, panelW - 28, 16);

      // Retry Sauce Button
      const rbx = panelX + panelW - 122;
      const rby = boxY + 58;
      ctx.fillStyle = '#facc15';
      roundRect(ctx, rbx, rby, 110, 26, 7);
      ctx.fill();
      ctx.fillStyle = '#111318';
      ctx.font = '800 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Nấu Lại Sốt', rbx + 55, rby + 17);

      this.hitZones.push({
        x: rbx,
        y: rby,
        w: 110,
        h: 26,
        action: 'RETRY',
      });
    }
  }
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, cy);
      line = words[n] + ' ';
      cy += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, cy);
}
