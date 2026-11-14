// Mechanic 1: Diverse Menu & Preparation Gestures
// Implements distinct tactile Canvas minigames for:
//   1. TRON  ("Bánh Tráng Trộn")  - Vigorous shaking (sweet spot vs bag rupture)
//   2. CUON  ("Bánh Tráng Cuốn")  - Horizontal swipe to roll + rhythmic tap to cut
//   3. NUONG ("Bánh Tráng Nướng") - Vertical swipe to fan coals in green zone + click to rotate rice paper

import { MENU_DISHES } from './state.js';
import { sfx } from './audio.js';
import { roundRect, wrapText } from './sauceMinigame.js';

export class MenuGestureController {
  constructor(onDishComplete) {
    this.onDishComplete = onDishComplete;
    this.dishId = 'TRON';
    this.pointerDown = false;
    this.lastPointer = null;
    this.trail = [];
    this.hitZones = [];
    this.particles = [];
    this.callout = null;
    this.reset('TRON');
  }

  setDish(dishId) {
    this.reset(dishId);
  }

  reset(dishId = this.dishId) {
    this.dishId = dishId;
    this.pointerDown = false;
    this.lastPointer = null;
    this.trail = [];
    this.particles = [];
    this.callout = null;

    if (dishId === 'TRON') {
      this.tron = {
        mixProgress: 0, // 0..100
        bagStress: 0, // 0..100 (100 = Ripped Bag!)
        bagOffsetX: 0,
        bagOffsetY: 0,
        lastVx: 0,
        lastShakeSfx: 0,
        finished: false,
        outcome: null,
      };
    } else if (dishId === 'CUON') {
      this.cuon = {
        stage: 'ROLL', // 'ROLL' | 'CUT' | 'DONE'
        rollsDone: 0,
        targetRolls: 3,
        swipeStart: null,
        rollTightness: 0, // visual animation 0..1
        cutsDone: 0,
        targetCuts: 4,
        beatTimer: 0,
        beatPeriod: 0.95,
        cutQualities: [], // 'PERFECT' | 'GOOD' | 'MISS'
        finished: false,
        outcome: null,
      };
    } else if (dishId === 'NUONG') {
      this.nuong = {
        heat: 52, // 0..100; green zone: 45..78
        fanAngle: 0,
        rotationSteps: 0, // 0,1,2,3 -> rotates 90 deg each click
        visualAngle: 0,
        quadCook: [12, 8, 5, 10], // 0..100+ per quadrant; >=75 cooked, >=100 burnt
        lastFanY: null,
        lastFanSfx: 0,
        finished: false,
        outcome: null,
      };
    }
  }

  showCallout(text, color = '#facc15') {
    this.callout = { text, color, timer: 1.4 };
  }

  spawnBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        r: 3 + Math.random() * 4,
        color,
        life: 0.7 + Math.random() * 0.4,
      });
    }
  }

  handleDeviceMotion(accelMagnitude) {
    if (this.dishId !== 'TRON' || this.tron.finished) return;
    if (accelMagnitude > 14) {
      this.applyTronShake(accelMagnitude * 18, 0.016, 480, 260);
    }
  }

  applyTronShake(speed, dt, cx, cy) {
    const st = this.tron;
    if (st.finished) return;

    // Sweet shake speed: ~220..950 px/s. Excessive violence > 1250 spikes stress rapidly!
    if (speed > 140) {
      const mixGain = Math.min(28, speed * 0.018) * dt * 2.4;
      st.mixProgress = Math.min(100, st.mixProgress + mixGain);

      if (speed > 1250) {
        const stressGain = ((speed - 1250) / 700) * 68 * dt * 2.2;
        st.bagStress = Math.min(100, st.bagStress + stressGain);
      } else {
        st.bagStress = Math.max(0, st.bagStress - 10 * dt);
      }

      st.bagOffsetX = (Math.random() - 0.5) * Math.min(26, speed * 0.02);
      st.bagOffsetY = (Math.random() - 0.5) * Math.min(22, speed * 0.018);

      const now = performance.now();
      if (now - st.lastShakeSfx > 90) {
        sfx.playShake();
        st.lastShakeSfx = now;
      }

      if (st.bagStress >= 100) {
        st.finished = true;
        this.spawnBurst(cx, cy + 40, '#facc15', 18);
        this.spawnBurst(cx, cy + 40, '#ef4444', 12);
        sfx.playFail();
        st.outcome = {
          grade: 'FAIL',
          title: 'BỤC ĐÁY BỊCH! (RÁCH TÚI)',
          detail: 'Bạn lắc quá bạo lực làm thủng đáy bịch! Trứng cút & xoài văng tung tóe.',
          payoutMult: 0,
        };
        this.onDishComplete?.(this.dishId, st.outcome);
      }
    }
  }

  finishTronServe() {
    const st = this.tron;
    if (st.finished) return;
    st.finished = true;

    if (st.mixProgress < 50) {
      sfx.playFail();
      st.outcome = {
        grade: 'POOR',
        title: 'TRỘN QUÁ NHẠT (CHƯA ĐỀU)',
        detail: `Mới lắc được ${Math.round(st.mixProgress)}% — bánh tráng còn dính cục và khô khốc!`,
        payoutMult: 0.45,
      };
    } else if (st.mixProgress < 80) {
      sfx.playSuccess();
      st.outcome = {
        grade: 'GOOD',
        title: 'TRỘN KHÁ ĐỀU TAY',
        detail: `Độ thấm đạt ${Math.round(st.mixProgress)}% — khách gật gù ăn ngon lành.`,
        payoutMult: 1.0,
      };
    } else {
      sfx.playSuccess();
      st.outcome = {
        grade: 'PERFECT',
        title: 'SIÊU PHẨM BÁNH TRÁNG TRỘN!',
        detail: `Độ thấm ${Math.round(st.mixProgress)}% mà bịch vẫn nguyên vẹn! Khách thưởng thêm tip!`,
        payoutMult: 1.35,
      };
    }
    this.onDishComplete?.(this.dishId, st.outcome);
  }

  handlePointerDown(x, y, width, height) {
    for (const z of this.hitZones) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
        if (z.action === 'RETRY') {
          this.reset(this.dishId);
          return;
        }
        if (z.action === 'TRON_SERVE') {
          this.finishTronServe();
          return;
        }
        if (z.action === 'NUONG_SERVE') {
          this.finishNuongServe();
          return;
        }
      }
    }

    this.pointerDown = true;
    this.lastPointer = { x, y, t: performance.now() };
    this.trail = [{ x, y, life: 0.35 }];

    if (this.dishId === 'CUON' && !this.cuon.finished) {
      if (this.cuon.stage === 'ROLL') {
        this.cuon.swipeStart = { x, y };
      } else if (this.cuon.stage === 'CUT') {
        this.evaluateCuonCut(width, height);
      }
    } else if (this.dishId === 'NUONG' && !this.nuong.finished) {
      // Check if clicking the Rice Paper Pizza on the grill (left-center circle)
      const grillX = width * 0.42;
      const grillY = height * 0.56;
      const dist = Math.hypot(x - grillX, y - grillY);
      if (dist <= 125) {
        this.nuong.rotationSteps = (this.nuong.rotationSteps + 1) % 4;
        sfx.playRotate();
        this.spawnBurst(grillX, grillY, '#fde047', 6);
        this.showCallout('Xoay bánh 90°!', '#fde047');
      }
      this.nuong.lastFanY = y;
    }
  }

  handlePointerMove(x, y, width, height) {
    this.trail.push({ x, y, life: 0.28 });
    if (this.trail.length > 22) this.trail.shift();

    if (!this.pointerDown || !this.lastPointer) return;
    const now = performance.now();
    const dt = Math.max(0.008, (now - this.lastPointer.t) / 1000);
    const dx = x - this.lastPointer.x;
    const dy = y - this.lastPointer.y;
    const dist = Math.hypot(dx, dy);
    const speed = dist / dt;

    if (this.dishId === 'TRON' && !this.tron.finished) {
      this.applyTronShake(speed, dt, width * 0.44, height * 0.52);
    } else if (this.dishId === 'NUONG' && !this.nuong.finished) {
      // Swiping vertically near the Fan / right side stokes the charcoal
      if (x > width * 0.62 && Math.abs(dy) > 4) {
        const stoke = Math.min(8, Math.abs(dy) * 0.24);
        this.nuong.heat = Math.min(100, this.nuong.heat + stoke);
        this.nuong.fanAngle = Math.sin(now * 0.04) * 0.4;
        if (now - this.nuong.lastFanSfx > 140) {
          sfx.playFan();
          this.nuong.lastFanSfx = now;
        }
        this.spawnBurst(width * 0.42, height * 0.64, '#fb923c', 2);
      }
    }

    this.lastPointer = { x, y, t: now };
  }

  handlePointerUp(x, y, width, height) {
    if (this.dishId === 'CUON' && this.cuon.stage === 'ROLL' && this.cuon.swipeStart && !this.cuon.finished) {
      const dx = x - this.cuon.swipeStart.x;
      const dy = y - this.cuon.swipeStart.y;
      if (dx > 85 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        this.cuon.rollsDone += 1;
        this.cuon.rollTightness = this.cuon.rollsDone / this.cuon.targetRolls;
        sfx.playRoll();
        this.spawnBurst(width * 0.45, height * 0.52, '#fef08a', 8);
        this.showCallout(`Cuốn vòng ${this.cuon.rollsDone}/${this.cuon.targetRolls}!`, '#4ade80');
        if (this.cuon.rollsDone >= this.cuon.targetRolls) {
          this.cuon.stage = 'CUT';
          this.cuon.beatTimer = 0;
          this.showCallout('CHUYỂN BƯỚC 2: CẮT ĐÚNG NHỊP!', '#38bdf8');
        }
      } else if (Math.hypot(dx, dy) > 30) {
        this.showCallout('Vuốt NGANG từ trái → phải để cuốn chặt!', '#f87171');
      }
      this.cuon.swipeStart = null;
    }

    this.pointerDown = false;
    this.lastPointer = null;
  }

  evaluateCuonCut(width, height) {
    const st = this.cuon;
    // Beat window: beatPhase near 0 or 1 (within ±0.20 of beat pulse)
    const phase = (st.beatTimer % st.beatPeriod) / st.beatPeriod;
    const distFromBeat = Math.min(phase, 1 - phase);

    let label = 'MISS';
    if (distFromBeat <= 0.14) {
      label = 'PERFECT';
      sfx.playSnip(true);
      this.showCallout('NHÁT CẮT HOÀN HẢO!', '#4ade80');
    } else if (distFromBeat <= 0.26) {
      label = 'GOOD';
      sfx.playSnip(true);
      this.showCallout('Cắt Khá Chuẩn!', '#facc15');
    } else {
      sfx.playSnip(false);
      this.showCallout('Lệch Nhịp Kéo!', '#f87171');
    }

    st.cutQualities.push(label);
    st.cutsDone += 1;
    const cutX = width * 0.28 + (st.cutsDone / (st.targetCuts + 1)) * (width * 0.36);
    this.spawnBurst(cutX, height * 0.54, label === 'MISS' ? '#ef4444' : '#fde047', 10);

    if (st.cutsDone >= st.targetCuts) {
      st.stage = 'DONE';
      st.finished = true;
      const perfectCount = st.cutQualities.filter((q) => q === 'PERFECT').length;
      const missCount = st.cutQualities.filter((q) => q === 'MISS').length;

      if (missCount >= 3) {
        sfx.playFail();
        st.outcome = {
          grade: 'POOR',
          title: 'CUỐN BỊ NÁT VỤN!',
          detail: `Cắt lệch nhịp ${missCount}/4 nhát — cuốn bánh bị bung nhân.`,
          payoutMult: 0.5,
        };
      } else if (perfectCount >= 2 && missCount === 0) {
        sfx.playSuccess();
        st.outcome = {
          grade: 'PERFECT',
          title: 'BÁNH TRÁNG CUỐN ĐỀU TĂM TẮP!',
          detail: `3 vòng cuốn chặt & ${perfectCount} nhát cắt đúng nhịp! Khách khen hết lời.`,
          payoutMult: 1.35,
        };
      } else {
        sfx.playSuccess();
        st.outcome = {
          grade: 'GOOD',
          title: 'HOÀN THÀNH BÁNH TRÁNG CUỐN',
          detail: 'Cuốn gọn gàng vừa miệng, sẵn sàng giao khách.',
          payoutMult: 1.0,
        };
      }
      this.onDishComplete?.(this.dishId, st.outcome);
    }
  }

  finishNuongServe() {
    const st = this.nuong;
    if (st.finished) return;
    st.finished = true;

    const minCook = Math.min(...st.quadCook);
    const maxCook = Math.max(...st.quadCook);

    if (maxCook >= 100) {
      sfx.playFail();
      st.outcome = {
        grade: 'FAIL',
        title: 'BÁNH TRÁNG NƯỚNG CHÁY KHÉT!',
        detail: 'Quên xoay bánh làm cháy đen một góc! Không thể bán cho khách.',
        payoutMult: 0,
      };
    } else if (minCook < 65) {
      sfx.playFail();
      st.outcome = {
        grade: 'POOR',
        title: 'BÁNH CÒN ỈU (CHƯA GIÒN)',
        detail: `Mặt bánh chín ít nhất mới ${Math.round(minCook)}% — chưa đạt độ giòn rụm!`,
        payoutMult: 0.5,
      };
    } else if (minCook >= 78 && maxCook < 94) {
      sfx.playSuccess();
      st.outcome = {
        grade: 'PERFECT',
        title: 'PIZZA VIỆT NAM VÀNG ƯƠM GIÒN TAN!',
        detail: 'Nhiệt than chuẩn & xoay đều 4 góc! Khách trả thêm tiền bo.',
        payoutMult: 1.4,
      };
    } else {
      sfx.playSuccess();
      st.outcome = {
        grade: 'GOOD',
        title: 'BÁNH TRÁNG NƯỚNG THƠM LỪNG',
        detail: 'Chín đều các góc, sẵn sàng gập đôi giao khách!',
        payoutMult: 1.0,
      };
    }
    this.onDishComplete?.(this.dishId, st.outcome);
  }

  update(dt) {
    if (this.callout) {
      this.callout.timer -= dt;
      if (this.callout.timer <= 0) this.callout = null;
    }

    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    if (this.dishId === 'TRON' && !this.tron.finished) {
      this.tron.bagOffsetX *= 0.85;
      this.tron.bagOffsetY *= 0.85;
      this.tron.bagStress = Math.max(0, this.tron.bagStress - 7 * dt);
    } else if (this.dishId === 'CUON' && !this.cuon.finished) {
      if (this.cuon.stage === 'CUT') {
        this.cuon.beatTimer += dt;
      }
    } else if (this.dishId === 'NUONG' && !this.nuong.finished) {
      const st = this.nuong;
      // Coal heat decays naturally; player fans up/down to keep in 45..78 green zone
      st.heat = Math.max(10, st.heat - 8.5 * dt);
      st.fanAngle *= 0.88;

      const targetVisual = st.rotationSteps * (Math.PI / 2);
      st.visualAngle += (targetVisual - st.visualAngle) * Math.min(1, dt * 12);

      // Quadrant resting directly over the hot spot (bottom-right of grill relative to rotation)
      const hotQuad = (4 - st.rotationSteps) % 4;
      const heatFactor = st.heat < 45 ? 0.35 : st.heat <= 78 ? 1.0 : 2.1;

      for (let q = 0; q < 4; q++) {
        const rate = q === hotQuad ? 15.5 * heatFactor : 4.2 * heatFactor;
        st.quadCook[q] = Math.min(105, st.quadCook[q] + rate * dt);
        if (st.quadCook[q] >= 100 && !st.finished) {
          this.finishNuongServe();
          break;
        }
      }
    }
  }

  render(ctx, width, height) {
    this.hitZones = [];
    const dishMeta = MENU_DISHES[this.dishId];

    // Table surface backdrop
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#1e293b');
    bg.addColorStop(0.62, '#334155');
    bg.addColorStop(1, '#475569');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Street stall wooden preparation board
    ctx.fillStyle = '#92400e';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    roundRect(ctx, 22, 82, width - 44, height - 102, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    roundRect(ctx, 32, 92, width - 64, height - 122, 12);
    ctx.fill();

    // Header
    ctx.fillStyle = '#fef3c7';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`CHẾ BIẾN: ${dishMeta.name.toUpperCase()}`, 26, 40);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(dishMeta.gestureHint, 26, 63);

    if (this.dishId === 'TRON') this.renderTron(ctx, width, height);
    else if (this.dishId === 'CUON') this.renderCuon(ctx, width, height);
    else if (this.dishId === 'NUONG') this.renderNuong(ctx, width, height);

    // Mouse gesture trail ribbon
    if (this.trail.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 1; i < this.trail.length; i++) {
        const p0 = this.trail[i - 1];
        const p1 = this.trail[i];
        ctx.strokeStyle = `rgba(250, 204, 21, ${Math.max(0, p1.life * 2)})`;
        ctx.lineWidth = 5 * (i / this.trail.length);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating gesture feedback callout
    if (this.callout) {
      ctx.save();
      ctx.font = '900 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 5;
      ctx.strokeText(this.callout.text, width * 0.44, 130);
      ctx.fillStyle = this.callout.color;
      ctx.fillText(this.callout.text, width * 0.44, 130);
      ctx.restore();
    }
  }

  renderTron(ctx, width, height) {
    const st = this.tron;
    const cx = width * 0.42 + st.bagOffsetX;
    const cy = height * 0.53 + st.bagOffsetY;

    // Mixing Bag visualization
    ctx.save();
    ctx.translate(cx, cy);
    if (st.outcome?.grade === 'FAIL') {
      ctx.rotate(0.28);
    }

    // Clear plastic bag outline
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.strokeStyle = st.bagStress > 65 ? '#ef4444' : '#f8fafc';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-80, -110);
    ctx.lineTo(80, -110);
    ctx.lineTo(105, 85);
    ctx.quadraticCurveTo(0, 125, -105, 85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rubber band knot at top
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-48, -105);
    ctx.lineTo(48, -105);
    ctx.stroke();

    // Ingredients inside bag blending color as mixProgress rises
    const blend = st.mixProgress / 100;
    ctx.fillStyle = blend > 0.65 ? '#ea580c' : '#fde047';
    ctx.beginPath();
    ctx.ellipse(0, 48, 86, 46, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mango strips, beef jerky, quail eggs
    const spots = [
      { x: -38, y: 36, c: '#22c55e', r: 9 },
      { x: 28, y: 48, c: '#991b1b', r: 10 },
      { x: -8, y: 24, c: '#fef9c3', r: 12 },
      { x: 42, y: 26, c: '#22c55e', r: 8 },
      { x: -45, y: 64, c: '#fef9c3', r: 11 },
    ];
    for (const s of spots) {
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(s.x + blend * 8, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rip tear lines if stressed
    if (st.bagStress > 40) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-24, 96);
      ctx.lineTo(0, 84);
      ctx.lineTo(22, 98);
      ctx.stroke();
    }
    ctx.restore();

    // Right Control & Meter Panel
    const px = width * 0.68;
    const py = 114;
    const pw = width * 0.26;
    this.drawMeterPanel(ctx, px, py, pw, [
      {
        label: 'Độ Thấm Gia Vị (Mix)',
        pct: st.mixProgress,
        color: st.mixProgress >= 80 ? '#22c55e' : st.mixProgress >= 50 ? '#facc15' : '#38bdf8',
        sub: 'Mục tiêu: ≥ 80% để đạt Tuyệt Hảo',
      },
      {
        label: 'Áp Lực Đáy Bịch (Risk)',
        pct: st.bagStress,
        color: st.bagStress >= 70 ? '#ef4444' : '#f59e0b',
        sub: 'Cảnh báo: 100% sẽ bị Bục Đáy Bịch!',
      },
    ]);

    if (!st.finished) {
      this.drawCanvasButton(ctx, px, py + 178, pw, 48, '#22c55e', '#052e16', 'CHỐT BỊCH & CHẤM ĐIỂM', 'TRON_SERVE');
    } else {
      this.drawOutcomeCard(ctx, px, py + 168, pw, st.outcome);
    }
  }

  renderCuon(ctx, width, height) {
    const st = this.cuon;
    const cx = width * 0.42;
    const cy = height * 0.54;

    if (st.stage === 'ROLL') {
      // Unrolled translucent rice paper sheet rolling tighter with each swipe
      const sheetW = 300 - st.rollTightness * 90;
      const sheetH = 190 - st.rollTightness * 120;
      ctx.fillStyle = 'rgba(254, 249, 195, 0.85)';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3;
      roundRect(ctx, cx - sheetW / 2, cy - sheetH / 2, sheetW, sheetH, 16);
      ctx.fill();
      ctx.stroke();

      // Filling strips inside
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(cx - sheetW * 0.35, cy - 12, sheetW * 0.7, 10);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(cx - sheetW * 0.32, cy + 4, sheetW * 0.64, 10);

      // Horizontal swipe arrow guide
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(cx - 120, cy + 95);
      ctx.lineTo(cx + 120, cy + 95);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#bae6fd';
      ctx.font = '800 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`VUỐT NGANG TRÁI → PHẢI (${st.rollsDone}/${st.targetRolls})`, cx, cy + 120);
    } else {
      // Rolled log ready for rhythmic cuts
      const logW = 300;
      const logH = 58;
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      roundRect(ctx, cx - logW / 2, cy - logH / 2, logW, logH, 24);
      ctx.fill();
      ctx.stroke();

      // Cut marks
      for (let i = 1; i <= st.targetCuts; i++) {
        const lx = cx - logW / 2 + (i / (st.targetCuts + 1)) * logW;
        const done = i <= st.cutsDone;
        ctx.strokeStyle = done ? '#0f172a' : 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = done ? 4 : 2.5;
        ctx.setLineDash(done ? [] : [5, 5]);
        ctx.beginPath();
        ctx.moveTo(lx, cy - logH / 2 - 8);
        ctx.lineTo(lx, cy + logH / 2 + 8);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Rhythm Beat Ring indicator
      if (!st.finished) {
        const phase = (st.beatTimer % st.beatPeriod) / st.beatPeriod;
        const ringRadius = 26 + (1 - phase) * 52;
        const inSweetSpot = Math.min(phase, 1 - phase) <= 0.22;

        ctx.strokeStyle = inSweetSpot ? '#4ade80' : '#facc15';
        ctx.lineWidth = inSweetSpot ? 5 : 3;
        ctx.beginPath();
        ctx.arc(cx, cy - 110, 26, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = inSweetSpot ? '#22c55e' : 'rgba(250, 204, 21, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy - 110, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(inSweetSpot ? 'BẤM CẮT NGAY!' : 'CHỜ VÒNG TRÙNG KHÍT...', cx, cy - 60);
      }
    }

    const px = width * 0.68;
    const py = 114;
    const pw = width * 0.26;
    this.drawMeterPanel(ctx, px, py, pw, [
      {
        label: 'Bước 1: Độ Chặt Cuốn',
        pct: (st.rollsDone / st.targetRolls) * 100,
        color: '#38bdf8',
        sub: `${st.rollsDone}/${st.targetRolls} lượt vuốt ngang`,
      },
      {
        label: 'Bước 2: Nhát Cắt Đều',
        pct: (st.cutsDone / st.targetCuts) * 100,
        color: '#22c55e',
        sub: `Đã cắt ${st.cutsDone}/${st.targetCuts} khúc`,
      },
    ]);

    if (st.finished) {
      this.drawOutcomeCard(ctx, px, py + 168, pw, st.outcome);
    }
  }

  renderNuong(ctx, width, height) {
    const st = this.nuong;
    const cx = width * 0.40;
    const cy = height * 0.56;

    // Charcoal Grill Base
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 134, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing coal pocket on bottom-right quadrant (why rotating is essential!)
    const coalGlow = 0.4 + (st.heat / 100) * 0.6;
    ctx.fillStyle = `rgba(239, 68, 68, ${coalGlow})`;
    ctx.beginPath();
    ctx.arc(cx + 42, cy + 42, 62, 0, Math.PI * 2);
    ctx.fill();

    // Grill metal grate lines
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    for (let gx = -105; gx <= 105; gx += 26) {
      ctx.beginPath();
      ctx.moveTo(cx + gx, cy - 105);
      ctx.lineTo(cx + gx, cy + 105);
      ctx.stroke();
    }

    // Rotating Rice Paper Pizza (4 Quadrants)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(st.visualAngle);

    for (let q = 0; q < 4; q++) {
      const startA = q * (Math.PI / 2);
      const endA = startA + Math.PI / 2;
      const cook = st.quadCook[q];

      let fill = '#fef9c3';
      if (cook >= 94) fill = '#292524'; // Near/At burnt!
      else if (cook >= 75) fill = '#f59e0b'; // Golden crispy!
      else if (cook >= 40) fill = '#fde047';

      ctx.fillStyle = fill;
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 112, startA, endA);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Topping details per quadrant
      const midA = startA + Math.PI / 4;
      const tx = Math.cos(midA) * 58;
      const ty = Math.sin(midA) * 58;
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(tx - 10, ty - 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(tx + 10, ty + 8, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cook >= 90 ? '#ffffff' : '#111318';
      ctx.font = '800 12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(cook)}%`, tx, ty + 4);
    }
    ctx.restore();

    ctx.fillStyle = '#fef3c7';
    ctx.font = '800 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK LÊN BÁNH ĐỂ XOAY 90°', cx, cy + 154);

    // Fan Swipe Pad (Right-middle)
    const fx = width * 0.64;
    const fy = 104;
    const fw = width * 0.30;
    const fh = 152;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    roundRect(ctx, fx, fy, fw, fh, 12);
    ctx.fill();
    ctx.stroke();

    // Heat Bar with GREEN ZONE (45..78%)
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`NHIỆT ĐỘ THAN: ${Math.round(st.heat)}°`, fx + 14, fy + 26);

    const hbx = fx + 14;
    const hby = fy + 38;
    const hbw = fw - 28;
    ctx.fillStyle = '#334155';
    roundRect(ctx, hbx, hby, hbw, 22, 6);
    ctx.fill();

    // Green Zone band (45%..78%)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
    ctx.fillRect(hbx + hbw * 0.45, hby, hbw * 0.33, 22);

    const inGreen = st.heat >= 45 && st.heat <= 78;
    ctx.fillStyle = inGreen ? '#22c55e' : st.heat > 78 ? '#ef4444' : '#38bdf8';
    roundRect(ctx, hbx, hby, Math.max(6, (st.heat / 100) * hbw), 22, 6);
    ctx.fill();

    // Bamboo Fan Icon that tilts as you swipe up/down
    ctx.save();
    ctx.translate(fx + fw / 2, fy + 108);
    ctx.rotate(st.fanAngle);
    ctx.fillStyle = '#fde68a';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.5;
    roundRect(ctx, -44, -22, 88, 44, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#451a03';
    ctx.font = '800 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↕ VUỐT LÊN / XUỐNG QUẠT THAN', 0, 5);
    ctx.restore();

    if (!st.finished) {
      this.drawCanvasButton(ctx, fx, fy + 168, fw, 48, '#22c55e', '#052e16', 'CHÍN GIÒN · RA MÓN →', 'NUONG_SERVE');
    } else {
      this.drawOutcomeCard(ctx, fx, fy + 168, fw, st.outcome);
    }
  }

  drawMeterPanel(ctx, x, y, w, meters) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, 152, 12);
    ctx.fill();
    ctx.stroke();

    meters.forEach((m, idx) => {
      const my = y + 26 + idx * 70;
      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(m.label, x + 14, my);

      ctx.font = '800 12px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(m.pct)}%`, x + w - 14, my);

      ctx.fillStyle = '#1e293b';
      roundRect(ctx, x + 14, my + 8, w - 28, 16, 6);
      ctx.fill();

      ctx.fillStyle = m.color;
      roundRect(ctx, x + 14, my + 8, Math.max(4, (Math.min(100, m.pct) / 100) * (w - 28)), 16, 6);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(m.sub, x + 14, my + 40);
    });
  }

  drawCanvasButton(ctx, x, y, w, h, bg, fg, label, action) {
    ctx.fillStyle = bg;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = fg;
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 5);

    this.hitZones.push({ x, y, w, h, action });
  }

  drawOutcomeCard(ctx, x, y, w, outcome) {
    if (!outcome) return;
    const isGood = outcome.grade === 'PERFECT' || outcome.grade === 'GOOD';
    ctx.fillStyle = isGood ? '#064e3b' : '#7f1d1d';
    ctx.strokeStyle = isGood ? '#34d399' : '#fca5a5';
    ctx.lineWidth = 2.5;
    roundRect(ctx, x, y, w, 134, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(outcome.title, x + 12, y + 24);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 12px system-ui, sans-serif';
    wrapText(ctx, outcome.detail, x + 12, y + 46, w - 24, 16);

    this.drawCanvasButton(ctx, x + 12, y + 84, w - 24, 38, '#facc15', '#111318', 'LÀM LẠI MÓN NÀY', 'RETRY');
  }
}
