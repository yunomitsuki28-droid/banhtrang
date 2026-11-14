// Main Bootstrapper & Modular Game Loop for "Bánh Tráng Master"
// Connects Canvas/UI, Mechanic 1 (Menu Gestures), and Mechanic 2 (Daily Secret Sauce).
// Ready for Step 2 modules: Rush Hour Memory (5:00 PM), Environmental Hazards, and Packaging Upgrades.

import { createInitialGameState, formatClock, formatVnd, MENU_DISHES } from './state.js';
import { SecretSauceMinigame } from './sauceMinigame.js';
import { MenuGestureController } from './menuGestures.js';
import { sfx } from './audio.js';

const LOGICAL_W = 1040;
const LOGICAL_H = 540;

const state = createInitialGameState();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const elClock = document.getElementById('hudClock');
const elMoney = document.getElementById('hudMoney');
const elRep = document.getElementById('hudRep');
const elBuff = document.getElementById('hudBuff');
const elFeedback = document.getElementById('hudFeedback');
const elMuteBtn = document.getElementById('btnMute');
const elResetBtn = document.getElementById('btnResetMode');
const modeButtons = Array.from(document.querySelectorAll('[data-mode]'));

const sauceGame = new SecretSauceMinigame((result) => {
  state.sauceBuff = result.buff;
  state.sauceSummary = result.title;
  if (result.buff === 'DELICIOUS') {
    state.reputation = Math.min(5.0, +(state.reputation + 0.2).toFixed(1));
    setFeedback('Nồi sốt đạt chuẩn! Kích hoạt Buff +20% tiền tip cho toàn bộ món hôm nay.', 'good');
  } else {
    state.reputation = Math.max(1.0, +(state.reputation - 0.2).toFixed(1));
    setFeedback('Nồi sốt bị mặn/lệch vị! Khách sẽ phàn nàn & đòi bù Trà Đá (-3,000đ mỗi đơn).', 'bad');
  }
  syncHud();
});

const gestureGame = new MenuGestureController((dishId, outcome) => {
  const dish = MENU_DISHES[dishId];
  let earned = Math.round(dish.basePrice * outcome.payoutMult);

  if (earned > 0) {
    if (state.sauceBuff === 'DELICIOUS') {
      const tipBonus = Math.round(earned * 0.2);
      earned += tipBonus;
      setFeedback(`${outcome.title} +${formatVnd(earned)} (gồm +20% Tip Sốt Ngon).`, 'good');
    } else if (state.sauceBuff === 'TOO_SALTY') {
      const icedTeaCost = 3000;
      earned = Math.max(0, earned - icedTeaCost);
      setFeedback(`${outcome.title} — Khách chê sốt mặn, trừ ${formatVnd(icedTeaCost)} mời Trà Đá -> Thu ${formatVnd(earned)}.`, 'warn');
    } else {
      setFeedback(`${outcome.title} — Thu ${formatVnd(earned)}.`, outcome.grade === 'PERFECT' ? 'good' : 'neutral');
    }
    state.money += earned;
    state.ordersServed += 1;
    state.clockMinutes += 25;
    if (outcome.grade === 'PERFECT') {
      state.reputation = Math.min(5.0, +(state.reputation + 0.1).toFixed(1));
    }
  } else {
    state.reputation = Math.max(1.0, +(state.reputation - 0.15).toFixed(1));
    state.clockMinutes += 15;
    setFeedback(`${outcome.title} — Hỏng món, không thu được tiền!`, 'bad');
  }
  syncHud();
});

function setFeedback(text, tone = 'neutral') {
  elFeedback.textContent = text;
  elFeedback.dataset.tone = tone;
}

function setMode(mode) {
  state.activeMode = mode;
  modeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (mode === 'SAUCE') {
    setFeedback('Mechanic 2: Nồi Sốt Sáng (30s) — Rót đủ Nước Dầm Bò, Sa Tế, Nước Me đúng vạch mục tiêu.', 'neutral');
  } else {
    gestureGame.setDish(mode);
    setFeedback(`Mechanic 1 (${MENU_DISHES[mode].name}): ${MENU_DISHES[mode].gestureHint}`, 'neutral');
  }
  syncHud();
}

function syncHud() {
  elClock.textContent = `Ngày ${state.day} · ${formatClock(state.clockMinutes)}`;
  elMoney.textContent = formatVnd(state.money);
  elRep.textContent = `${state.reputation.toFixed(1)} ★ · ${state.ordersServed} đơn`;

  if (state.sauceBuff === 'DELICIOUS') {
    elBuff.textContent = 'Buff Sốt Ngon (+20% Tip)';
    elBuff.className = 'buff-text buff-good';
  } else if (state.sauceBuff === 'TOO_SALTY') {
    elBuff.textContent = 'Debuff Sốt Mặn (Bù Trà Đá)';
    elBuff.className = 'buff-text buff-bad';
  } else {
    elBuff.textContent = 'Chưa Nấu Sốt Sáng';
    elBuff.className = 'buff-text buff-idle';
  }
}

function toLogicalCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * LOGICAL_W,
    y: ((clientY - rect.top) / rect.height) * LOGICAL_H,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  sfx.unlock();
  canvas.setPointerCapture(e.pointerId);
  const pt = toLogicalCoords(e.clientX, e.clientY);
  if (state.activeMode === 'SAUCE') {
    sauceGame.handlePointerDown(pt.x, pt.y);
  } else {
    gestureGame.handlePointerDown(pt.x, pt.y, LOGICAL_W, LOGICAL_H);
  }
});

canvas.addEventListener('pointermove', (e) => {
  const pt = toLogicalCoords(e.clientX, e.clientY);
  if (state.activeMode !== 'SAUCE') {
    gestureGame.handlePointerMove(pt.x, pt.y, LOGICAL_W, LOGICAL_H);
  }
});

canvas.addEventListener('pointerup', (e) => {
  const pt = toLogicalCoords(e.clientX, e.clientY);
  if (state.activeMode !== 'SAUCE') {
    gestureGame.handlePointerUp(pt.x, pt.y, LOGICAL_W, LOGICAL_H);
  }
});

// Optional device shake support for mobile testing of Bánh Tráng Trộn
window.addEventListener('devicemotion', (e) => {
  const acc = e.accelerationIncludingGravity;
  if (!acc) return;
  const mag = Math.hypot(acc.x || 0, acc.y || 0, acc.z || 0);
  if (state.activeMode === 'TRON') {
    gestureGame.handleDeviceMotion(mag);
  }
});

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

elMuteBtn.addEventListener('click', () => {
  sfx.muted = !sfx.muted;
  elMuteBtn.textContent = sfx.muted ? 'Âm Thanh: Tắt' : 'Âm Thanh: Bật';
});

elResetBtn.addEventListener('click', () => {
  if (state.activeMode === 'SAUCE') {
    sauceGame.reset();
  } else {
    gestureGame.reset(state.activeMode);
  }
  setFeedback('Đã làm mới bài test thao tác hiện tại.', 'neutral');
});

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (state.activeMode === 'SAUCE') {
    sauceGame.update(dt);
    sauceGame.render(ctx, LOGICAL_W, LOGICAL_H);
  } else {
    gestureGame.update(dt);
    gestureGame.render(ctx, LOGICAL_W, LOGICAL_H);
  }

  requestAnimationFrame(loop);
}

syncHud();
setMode('SAUCE');
requestAnimationFrame(loop);
