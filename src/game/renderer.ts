import {
  computePrepLayout,
  computeRaidLayout,
  getActiveCustomerRect,
  getAppeaseActiveRect,
  getAppeaseWaitingRect,
  getElectricPoleRect,
  getFlowLaneRects,
  getLandladyRect,
  getLotterySellerRect,
  getQteArrowRects,
  getWaitingCustomerRects,
  type PrepLayout,
  type RaidLayout,
  type Rect,
} from './layout';
import { ELEMENT_META, SEASONING_LABEL, SEASONING_RANGE, TOPPING_MAP, TOPPINGS } from './orders';
import type {
  ArrowKey,
  BossFightState,
  BowlIngredient,
  CustomerOrder,
  CustomerType,
  DailyBuffs,
  DishType,
  FloatingCallout,
  FlowRhythmState,
  FlyingCashItem,
  FlyingTopping,
  GuardGrabState,
  InventoryState,
  LandladyState,
  LotterySellerState,
  Particle,
  PlayPhase,
  Point2D,
  PolygonSlice,
  PrepStep,
  RaidObstacle,
  RaidSituation,
  RawIngredientId,
  RippedBagState,
  SaigonRainState,
  SeasoningMeter,
  ShopUpgrades,
  TiktokQteState,
  ToppingId,
  VehicleLevel,
  WaitingCustomer,
  WuxiaCombatState,
} from './types';

export interface RenderState {
  width: number;
  height: number;
  time: number;
  dayProgress: number; // 0 (morning) -> 0.5 (sunset) -> 1 (night)
  phase: PlayPhase;
  dishType: DishType;
  prepStep: PrepStep;
  order: CustomerOrder | null;
  waitingCustomers: WaitingCustomer[];
  orderNumber: number;
  slices: PolygonSlice[];
  rollProgress: number;
  swipeTrail: Point2D[];
  addedToppings: Record<ToppingId, number>;
  inventory: InventoryState;
  bowlIngredients: BowlIngredient[];
  flyingToppings: FlyingTopping[];
  flyingCash: FlyingCashItem[];
  limeMeter: SeasoningMeter;
  chiliMeter: SeasoningMeter;
  shakeProgress: number;
  bowlShakeOffset: Point2D;
  bowlScale: number;
  redChairs: number;
  maxRedChairs: number;
  raidWarningTimer: number;
  raidTimeLeft: number;
  raidTotalTime: number;
  raidScrollY: number;
  raidSituation: RaidSituation;
  raidSituationText: string;
  cartX: number;
  cartLean: number;
  invulnTimer: number;
  hitFlashTimer: number;
  boostActiveTimer: number;
  boostCooldown: number;
  shieldTimer: number;
  slipTimer: number;
  truckSurgeOffset: number;
  obstacles: RaidObstacle[];
  particles: Particle[];
  callouts: FloatingCallout[];
  shakeX: number;
  shakeY: number;
  hoverTrayId: ToppingId | null;
  hoverPrimary: boolean;
  hoverSecondary: boolean;
  hoverShake: boolean;
  hoverRoll: boolean;
  hoverBoost: boolean;
  hoverAppeaseActive: boolean;
  hoverAppeaseWaitingIdx: number;
  upgrades: ShopUpgrades;
  vehicleLevel: VehicleLevel;
  dailyBuffs: DailyBuffs;
  freeDodgesLeft: number;
  tiktokQte: TiktokQteState;
  rainEvent: SaigonRainState;
  rippedBag: RippedBagState;
  landlady: LandladyState;
  lotterySeller: LotterySellerState;
  bossFight: BossFightState;
  sickCustomerTimer: number;
  viralOrdersLeft: number;
  bocPhotTimer: number;
  flowPerfectCount: number;
  flowRhythm: FlowRhythmState;
  guardGrab: GuardGrabState;
  loanDebt: number;
  thugsActive: boolean;
  hoverElectricPole: boolean;
  diyMalfunctionActive: boolean;
  wuxiaCombat: WuxiaCombatState;
  backdropImg: HTMLImageElement | null;
}

const INK = '#111318';

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w * 0.5, h * 0.5);
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

function drawComicBox(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  fill: string,
  radius = 12,
  shadowOffset = 4,
  strokeWidth = 3
): void {
  if (shadowOffset > 0) {
    ctx.fillStyle = INK;
    roundRectPath(ctx, r.x + shadowOffset, r.y + shadowOffset, r.w, r.h, radius);
    ctx.fill();
  }
  ctx.fillStyle = fill;
  roundRectPath(ctx, r.x, r.y, r.w, r.h, radius);
  ctx.fill();
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawRedPlasticChair(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale = 1,
  angle = 0
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;

  ctx.fillStyle = '#991B1B';
  ctx.beginPath();
  ctx.moveTo(-11, -1);
  ctx.lineTo(-15, 16);
  ctx.lineTo(-9, 16);
  ctx.lineTo(-6, -1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(11, -1);
  ctx.lineTo(15, 16);
  ctx.lineTo(9, 16);
  ctx.lineTo(6, -1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#EF4444';
  roundRectPath(ctx, -15, -9, 30, 10, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FCA5A5';
  ctx.fillRect(-12, -7.5, 24, 2);

  ctx.fillStyle = '#7F1D1D';
  roundRectPath(ctx, -4.5, -5.5, 9, 3.5, 1.5);
  ctx.fill();

  ctx.restore();
}

function drawToppingIcon(
  ctx: CanvasRenderingContext2D,
  id: ToppingId,
  cx: number,
  cy: number,
  scale = 1
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;

  if (id === 'kho_bo') {
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.rotate(i * 0.35);
      ctx.fillStyle = i === 0 ? '#B91C1C' : '#7F1D1D';
      roundRectPath(ctx, -14, -4 + i * 3, 28, 6.5, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(-10, -2.5 + i * 3, 18, 1.6);
      ctx.restore();
    }
  } else if (id === 'trung_cut') {
    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 10.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.arc(0, 2, 9, 0.2, Math.PI - 0.2);
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(2.5, 0, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(1, -1.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'xoai') {
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.rotate(-0.35 + i * 0.28);
      ctx.fillStyle = i === 0 ? '#FBBF24' : '#84CC16';
      roundRectPath(ctx, -13, -2 + i * 3.5, 26, 4.5, 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else if (id === 'rau_ram') {
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.ellipse(-5, 2, 10, 4.8, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.ellipse(5, -1, 10, 4.8, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#BBF7D0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(10, 1);
    ctx.stroke();
  } else if (id === 'pho_mai') {
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(-12, 8);
    ctx.lineTo(12, 8);
    ctx.lineTo(10, -8);
    ctx.lineTo(-10, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#CA8A04';
    ctx.beginPath();
    ctx.arc(-3, 2, 2.4, 0, Math.PI * 2);
    ctx.arc(4, -1, 1.9, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'tran_chau') {
    const coords = [
      [-6, 4],
      [6, 5],
      [0, -4],
    ];
    for (const [px, py] of coords) {
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.arc(px, py, 6.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(px - 2, py - 2, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'sau_rieng') {
    // Spiky green-gold durian wedge + rich yellow durian lobe
    ctx.fillStyle = '#65A30D';
    ctx.beginPath();
    ctx.moveTo(-14, 9);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-5, -4);
    ctx.lineTo(0, -11);
    ctx.lineTo(5, -4);
    ctx.lineTo(11, -9);
    ctx.lineTo(14, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.ellipse(0, 3, 10, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FEF9C3';
    ctx.beginPath();
    ctx.ellipse(-2.5, 1.5, 3.5, 2, -0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'nuoc_cot_dua') {
    // Half coconut cup with creamy coconut milk + splash droplet
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.arc(0, 2, 12, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, 2, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.arc(4, -7, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawCustomerCharacter(
  ctx: CanvasRenderingContext2D,
  order: CustomerOrder,
  x: number,
  y: number,
  time: number,
  sickTimer = 0
): void {
  const ratio = Math.max(0, order.patience / order.maxPatience);
  const anxious = ratio < 0.35 || Boolean(order.isAngry);
  const isSick = sickTimer > 0;
  const bounce = Math.sin(time * (isSick ? 18 : anxious ? 11 : 3.8)) * (anxious ? 3.5 : 2);
  const blink = Math.sin(time * 2.2) > 0.96;

  ctx.save();
  ctx.translate(x, y + bounce);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;

  if (order.customerType === 'NINJA_LEAD') {
    ctx.fillStyle = '#0D9488';
    roundRectPath(ctx, -40, -52, 80, 54, 22);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0F766E';
    roundRectPath(ctx, -38, -28, 76, 26, 12);
    ctx.fill();
    ctx.fillStyle = '#FDE047';
    for (const [dx, dy] of [
      [-20, -34],
      [16, -24],
      [-8, -14],
      [22, -40],
    ]) {
      ctx.beginPath();
      ctx.arc(dx, dy, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (order.customerType === 'APP_SHIPPER') {
    const isGreen = order.shipperBrand !== 'ORANGE';
    ctx.fillStyle = isGreen ? '#16A34A' : '#EA580C';
    roundRectPath(ctx, -40, -52, 80, 54, 20);
    ctx.fill();
    ctx.stroke();
    // Jacket reflector stripe + backpack straps
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-38, -26, 76, 8);
    ctx.strokeRect(-38, -26, 76, 8);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-26, -52, 9, 50);
    ctx.fillRect(17, -52, 9, 50);
  } else if (order.customerType === 'MUKBANGER') {
    ctx.fillStyle = '#18181B';
    roundRectPath(ctx, -46, -54, 92, 56, 22);
    ctx.fill();
    ctx.stroke();
    // Giant white Mukbang bib
    ctx.fillStyle = '#FFFDF5';
    roundRectPath(ctx, -26, -48, 52, 42, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E11D48';
    ctx.font = '800 10px "Bricolage Grotesque", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS', 0, -24);
  } else if (order.customerType === 'GEN_Z') {
    ctx.fillStyle = '#7C3AED';
    roundRectPath(ctx, -38, -50, 76, 52, 20);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5B21B6';
    roundRectPath(ctx, -20, -50, 40, 14, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-8, -38);
    ctx.lineTo(-9, -20);
    ctx.moveTo(8, -38);
    ctx.lineTo(9, -20);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
  } else if (order.customerType === 'OFFICE') {
    ctx.fillStyle = '#F8FAFC';
    roundRectPath(ctx, -38, -50, 76, 52, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1D4ED8';
    ctx.beginPath();
    ctx.moveTo(-6, -48);
    ctx.lineTo(6, -48);
    ctx.lineTo(8, -10);
    ctx.lineTo(0, -4);
    ctx.lineTo(-8, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (order.customerType === 'FENG_SHUI') {
    ctx.fillStyle = '#4C1D95';
    roundRectPath(ctx, -40, -52, 80, 54, 20);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.moveTo(-18, -50);
    ctx.lineTo(0, -18);
    ctx.lineTo(18, -50);
    ctx.stroke();
    for (let b = -3; b <= 3; b++) {
      ctx.fillStyle = '#92400E';
      ctx.beginPath();
      ctx.arc(b * 7, -42 + Math.abs(b) * 1.6, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (order.customerType === 'GYM_BRO') {
    ctx.fillStyle = '#E11D48';
    roundRectPath(ctx, -44, -52, 88, 54, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FDE6C4';
    ctx.fillRect(-16, -52, 32, 16);
    ctx.strokeRect(-16, -52, 32, 16);
    ctx.fillStyle = '#0EA5E9';
    roundRectPath(ctx, 29, -46, 17, 30, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#111318';
    ctx.fillRect(29, -46, 17, 7);
  } else if (order.customerType === 'REAL_ESTATE') {
    ctx.fillStyle = '#1E293B';
    roundRectPath(ctx, -39, -50, 78, 52, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-12, -50);
    ctx.lineTo(12, -50);
    ctx.lineTo(0, -24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(-4, -48);
    ctx.lineTo(4, -48);
    ctx.lineTo(6, -12);
    ctx.lineTo(0, -4);
    ctx.lineTo(-6, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (order.customerType === 'ROOM_HUNTERS') {
    // 2nd & 3rd exhausted friends peeking behind the lead student
    for (const dx of [-28, 28]) {
      ctx.fillStyle = dx < 0 ? '#3B82F6' : '#EC4899';
      roundRectPath(ctx, dx - 18, -42, 36, 42, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FDE6C4';
      ctx.beginPath();
      ctx.arc(dx, -62, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1F2937';
      ctx.beginPath();
      ctx.arc(dx, -66, 16, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#0EA5E9';
    roundRectPath(ctx, -34, -50, 68, 52, 18);
    ctx.fill();
    ctx.stroke();
  } else if (order.customerType === 'BUSINESS_BAZI') {
    // Dark pinstripe business blazer + gold tie + stressed briefcase
    ctx.fillStyle = '#1E293B';
    roundRectPath(ctx, -40, -52, 80, 54, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-12, -52);
    ctx.lineTo(12, -52);
    ctx.lineTo(0, -24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-4, -50);
    ctx.lineTo(4, -50);
    ctx.lineTo(6, -14);
    ctx.lineTo(0, -6);
    ctx.lineTo(-6, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (order.customerType === 'HEARTBROKEN_GENZ') {
    // Cozy oversized pastel hoodie + drawstring
    ctx.fillStyle = '#C084FC';
    roundRectPath(ctx, -40, -52, 80, 54, 20);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F3E8FF';
    roundRectPath(ctx, -22, -26, 44, 22, 8);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = '#F59E0B';
    roundRectPath(ctx, -38, -50, 76, 52, 20);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-28, -50, 11, 48);
    ctx.strokeRect(-28, -50, 11, 48);
    ctx.fillRect(17, -50, 11, 48);
    ctx.strokeRect(17, -50, 11, 48);
  }

  ctx.fillStyle = isSick ? '#A3E635' : '#F5CCA0';
  ctx.fillRect(-10, -60, 20, 14);

  // Face (turns sickly green if Cursed Menu food poisoning strikes!)
  ctx.fillStyle = isSick ? '#BEF264' : order.isAngry ? '#FCA5A5' : '#FDE6C4';
  ctx.beginPath();
  ctx.arc(0, -78, 31, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (order.customerType === 'NINJA_LEAD') {
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.arc(0, -80, 34, Math.PI * 0.88, Math.PI * 2.12);
    ctx.lineTo(34, -50);
    ctx.lineTo(-34, -50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#99F6E4';
    roundRectPath(ctx, -21, -72, 42, 25, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#18181B';
    roundRectPath(ctx, -23, -89, 20, 13, 5);
    ctx.fill();
    ctx.stroke();
    roundRectPath(ctx, 3, -89, 20, 13, 5);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-19, -85);
    ctx.lineTo(-11, -79);
    ctx.moveTo(7, -85);
    ctx.lineTo(15, -79);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;

    ctx.fillStyle = '#14B8A6';
    roundRectPath(ctx, -32, -102, 64, 11, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#334155';
    roundRectPath(ctx, -46, -24, 92, 12, 6);
    ctx.fill();
    ctx.stroke();
    const signalOn = Math.floor(time * 5) % 2 === 0;
    ctx.fillStyle = signalOn ? '#FACC15' : '#713F12';
    ctx.beginPath();
    ctx.arc(-36, -18, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = isSick ? 'rgba(101, 163, 13, 0.45)' : 'rgba(244, 63, 94, 0.25)';
    ctx.beginPath();
    ctx.ellipse(-16, -70, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(16, -70, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (order.customerType === 'APP_SHIPPER') {
      const helmetColor = order.shipperBrand !== 'ORANGE' ? '#15803D' : '#C2410C';
      ctx.fillStyle = helmetColor;
      ctx.beginPath();
      ctx.arc(0, -84, 34, Math.PI * 0.95, Math.PI * 2.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      roundRectPath(ctx, -28, -92, 56, 8, 4);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = order.customerType === 'GEN_Z' ? '#312E81' : '#1F2937';
      ctx.beginPath();
      ctx.arc(0, -84, 32, Math.PI * 0.95, Math.PI * 2.05);
      ctx.lineTo(28, -76);
      ctx.lineTo(14, -85);
      ctx.lineTo(0, -75);
      ctx.lineTo(-14, -85);
      ctx.lineTo(-28, -76);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    if (isSick) {
      // Dizzy X eyes + wavy green mouth + green fumes!
      ctx.strokeStyle = '#365314';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-14, -80);
      ctx.lineTo(-6, -72);
      ctx.moveTo(-6, -80);
      ctx.lineTo(-14, -72);
      ctx.moveTo(6, -80);
      ctx.lineTo(14, -72);
      ctx.moveTo(14, -80);
      ctx.lineTo(6, -72);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-11, -61);
      ctx.quadraticCurveTo(-5, -67, 0, -61);
      ctx.quadraticCurveTo(5, -55, 11, -61);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;

      for (let f = 0; f < 3; f++) {
        const fy = -120 - ((time * 36 + f * 12) % 24);
        ctx.fillStyle = 'rgba(132, 204, 22, 0.72)';
        ctx.beginPath();
        ctx.arc(-18 + f * 18, fy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (blink) {
      ctx.beginPath();
      ctx.moveTo(-15, -76);
      ctx.lineTo(-6, -76);
      ctx.moveTo(6, -76);
      ctx.lineTo(15, -76);
      ctx.stroke();
    } else {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-10, -76, 3.6, 0, Math.PI * 2);
      ctx.arc(10, -76, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-11.2, -77.5, 1.3, 0, Math.PI * 2);
      ctx.arc(8.8, -77.5, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!isSick) {
      ctx.beginPath();
      if (anxious) {
        ctx.moveTo(-17, -86);
        ctx.lineTo(-5, -81);
        ctx.moveTo(17, -86);
        ctx.lineTo(5, -81);
      } else {
        ctx.moveTo(-16, -84);
        ctx.lineTo(-5, -85);
        ctx.moveTo(5, -85);
        ctx.lineTo(16, -84);
      }
      ctx.stroke();

      ctx.beginPath();
      if (anxious) {
        ctx.arc(0, -59, 7, Math.PI * 1.15, Math.PI * 1.85);
      } else {
        ctx.arc(0, -66, 7.5, 0.15 * Math.PI, 0.85 * Math.PI);
      }
      ctx.stroke();
    }

    if (order.customerType === 'GEN_Z') {
      ctx.fillStyle = '#EC4899';
      roundRectPath(ctx, -38, -90, 11, 24, 5);
      ctx.fill();
      ctx.stroke();
      roundRectPath(ctx, 27, -90, 11, 24, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38BDF8';
      roundRectPath(ctx, 28, -42, 16, 26, 4);
      ctx.fill();
      ctx.stroke();
    } else if (order.customerType === 'MUKBANGER') {
      ctx.fillStyle = '#FACC15';
      roundRectPath(ctx, -32, -93, 64, 9, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0F172A';
      roundRectPath(ctx, -22, -83, 19, 11, 3);
      ctx.fill();
      roundRectPath(ctx, 3, -83, 19, 11, 3);
      ctx.fill();
    } else if (order.customerType === 'OFFICE') {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-18, -82, 14, 11);
      ctx.strokeRect(4, -82, 14, 11);
      ctx.beginPath();
      ctx.moveTo(-4, -77);
      ctx.lineTo(4, -77);
      ctx.stroke();
      ctx.fillStyle = '#92400E';
      roundRectPath(ctx, 28, -36, 16, 22, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(28, -36, 16, 5);
    } else if (order.customerType === 'FENG_SHUI') {
      ctx.fillStyle = '#3B0764';
      roundRectPath(ctx, -28, -114, 56, 20, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(0, -104, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.moveTo(-10, -58);
      ctx.lineTo(10, -58);
      ctx.lineTo(0, -34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (order.customerType === 'GYM_BRO') {
      ctx.fillStyle = '#FACC15';
      roundRectPath(ctx, -31, -93, 62, 10, 4);
      ctx.fill();
      ctx.stroke();
    } else if (order.customerType === 'REAL_ESTATE') {
      ctx.fillStyle = '#0F172A';
      roundRectPath(ctx, -20, -83, 17, 10, 3);
      ctx.fill();
      roundRectPath(ctx, 3, -83, 17, 10, 3);
      ctx.fill();
      ctx.fillStyle = '#E2E8F0';
      roundRectPath(ctx, 29, -38, 16, 26, 4);
      ctx.fill();
      ctx.stroke();
    } else if (order.customerType === 'BUSINESS_BAZI') {
      // Stressed under-eye circles + smartphone checking stocks
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-10, -72, 5.5, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(10, -72, 5.5, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = '#0F172A';
      roundRectPath(ctx, 29, -40, 15, 25, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(32, -35, 9, 14);
    } else if (order.customerType === 'HEARTBROKEN_GENZ') {
      // Cute tear drops + big Trà Tắc Size L cup if upgraded!
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(-11, -67, 2.8, 0, Math.PI * 2);
      ctx.arc(11, -67, 2.8, 0, Math.PI * 2);
      ctx.fill();
      if (order.hasTraTacCombo) {
        ctx.fillStyle = '#FACC15';
        roundRectPath(ctx, 28, -44, 18, 28, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#10B981';
        ctx.fillRect(35, -54, 4, 14);
      }
    } else if (order.customerType !== 'APP_SHIPPER') {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-10, -76, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(10, -76, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (order.isAngry && !isSick) {
    // Comic anger vein & warning tag!
    const pulse = 1 + Math.sin(time * 16) * 0.1;
    ctx.save();
    ctx.translate(34, -102);
    ctx.scale(pulse, pulse);
    drawComicBox(ctx, { x: -16, y: -14, w: 32, h: 24 }, '#E11D48', 7, 2, 2);
    ctx.font = '800 13px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💢', 0, -2);
    ctx.restore();
  } else if (anxious && !isSick) {
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(35, -92);
    ctx.quadraticCurveTo(43, -80, 35, -75);
    ctx.quadraticCurveTo(27, -80, 35, -92);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (isSick) {
    drawComicBox(ctx, { x: -72, y: -144, w: 144, h: 28 }, '#ECFCCB', 8, 2, 2.5);
    ctx.font = '800 12px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#3F6212';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🤢 NGỘ ĐỘC! 1 SAO ⭐', 0, -130);
  }

  ctx.font = '800 12px "Bricolage Grotesque", sans-serif';
  const labelW = ctx.measureText(order.customerLabel).width + 20;
  const tagBg =
    order.customerType === 'NINJA_LEAD'
      ? '#CCFBF1'
      : order.customerType === 'APP_SHIPPER'
      ? order.shipperBrand !== 'ORANGE'
        ? '#DCFCE7'
        : '#FFEDD5'
      : order.customerType === 'MUKBANGER'
      ? '#FEF08A'
      : order.customerType === 'FENG_SHUI'
      ? '#EDE9FE'
      : order.customerType === 'GYM_BRO'
      ? '#FFE4E6'
      : order.customerType === 'REAL_ESTATE'
      ? '#DCFCE7'
      : order.customerType === 'ROOM_HUNTERS'
      ? '#E0F2FE'
      : order.customerType === 'BUSINESS_BAZI'
      ? '#FEF3C7'
      : order.customerType === 'HEARTBROKEN_GENZ'
      ? '#F3E8FF'
      : '#FEF3C7';
  drawComicBox(
    ctx,
    { x: -labelW * 0.5, y: -14, w: labelW, h: 25 },
    tagBg,
    7,
    2,
    2.5
  );
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(order.customerLabel, 0, -1);

  ctx.restore();
}

function drawOrderBubble(
  ctx: CanvasRenderingContext2D,
  order: CustomerOrder,
  layout: PrepLayout,
  cutCount: number,
  addedToppings: Record<ToppingId, number>,
  prepStep: PrepStep
): void {
  const b = layout.bubbleRect;
  drawComicBox(ctx, b, '#FFFFFF', 14, 5, 3);

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(b.x + 2, b.y + b.h * 0.52);
  ctx.lineTo(b.x - 16, b.y + b.h * 0.62);
  ctx.lineTo(b.x + 2, b.y + b.h * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y + b.h * 0.52);
  ctx.lineTo(b.x - 16, b.y + b.h * 0.62);
  ctx.lineTo(b.x, b.y + b.h * 0.72);
  ctx.stroke();

  const padX = 16;
  const innerW = b.w - padX * 2;

  const barY = b.y + 12;
  const dishTag = order.dishType === 'CUON' ? 'BÁNH TRÁNG CUỐN' : 'BÁNH TRÁNG TRỘN';
  ctx.font = '800 11px "Bricolage Grotesque", sans-serif';
  const tagW = ctx.measureText(dishTag).width + 16;
  drawComicBox(
    ctx,
    { x: b.x + padX, y: barY - 2, w: tagW, h: 20 },
    order.dishType === 'CUON' ? '#DBEAFE' : '#FEF3C7',
    6,
    0,
    2
  );
  ctx.fillStyle = order.dishType === 'CUON' ? '#1E40AF' : '#92400E';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(dishTag, b.x + padX + tagW * 0.5, barY + 8);

  let nextTagX = b.x + padX + tagW + 8;
  if (order.baziProfile) {
    const baziTag = `☯️ ${order.baziProfile.dayMaster}`;
    const bW = ctx.measureText(baziTag).width + 14;
    drawComicBox(ctx, { x: nextTagX, y: barY - 2, w: bW, h: 20 }, '#FEF3C7', 6, 0, 2);
    ctx.fillStyle = '#92400E';
    ctx.fillText(baziTag, nextTagX + bW * 0.5, barY + 8);
    nextTagX += bW + 8;
  } else if (order.hasTraTacCombo) {
    const comboTag = '🧋 COMBO TRÀ TẮC L (x2)';
    const cW = ctx.measureText(comboTag).width + 14;
    drawComicBox(ctx, { x: nextTagX, y: barY - 2, w: cW, h: 20 }, '#F3E8FF', 6, 0, 2);
    ctx.fillStyle = '#7E22CE';
    ctx.fillText(comboTag, nextTagX + cW * 0.5, barY + 8);
    nextTagX += cW + 8;
  } else if (order.elementTag) {
    const em = ELEMENT_META[order.elementTag];
    const elTag = `☯️ Mệnh ${em.shortLabel}`;
    const elW = ctx.measureText(elTag).width + 14;
    drawComicBox(ctx, { x: nextTagX, y: barY - 2, w: elW, h: 20 }, em.bg, 6, 0, 2);
    ctx.fillStyle = em.color;
    ctx.fillText(elTag, nextTagX + elW * 0.5, barY + 8);
    nextTagX += elW + 8;
  } else if (order.hexagramBoosted) {
    const boostTag = '☯️ HỢP QUẺ +35%';
    const bW = ctx.measureText(boostTag).width + 14;
    drawComicBox(ctx, { x: nextTagX, y: barY - 2, w: bW, h: 20 }, '#FEF08A', 6, 0, 2);
    ctx.fillStyle = '#92400E';
    ctx.fillText(boostTag, nextTagX + bW * 0.5, barY + 8);
    nextTagX += bW + 8;
  }

  const pRatio = Math.max(0, Math.min(1, order.patience / order.maxPatience));
  const barX = nextTagX + 4;
  const barW = Math.max(60, b.x + b.w - padX - 78 - barX);
  const barH = 12;
  ctx.fillStyle = '#E2E8F0';
  roundRectPath(ctx, barX, barY + 2, barW, barH, 6);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.stroke();

  ctx.fillStyle = pRatio > 0.5 ? '#10B981' : pRatio > 0.25 ? '#F59E0B' : '#E11D48';
  if (pRatio > 0.02) {
    roundRectPath(ctx, barX + 1, barY + 3, Math.max(8, (barW - 2) * pRatio), barH - 2, 5);
    ctx.fill();
  }

  ctx.font = '700 12px "JetBrains Mono", monospace';
  ctx.fillStyle = pRatio < 0.28 ? '#BE123C' : '#334155';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Chờ: ${Math.ceil(order.patience)}s`, b.x + b.w - padX, barY + 8);

  ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const lines = wrapText(ctx, `"${order.dialogue}"`, innerW);
  let textY = barY + 26;
  for (let i = 0; i < Math.min(2, lines.length); i++) {
    ctx.fillText(lines[i], b.x + padX, textY);
    textY += 20;
  }

  const checkY = b.y + b.h - 34;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(b.x + padX, checkY - 8);
  ctx.lineTo(b.x + b.w - padX, checkY - 8);
  ctx.stroke();

  let cx = b.x + padX;
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.textBaseline = 'middle';

  const sliceDone = order.targetSlices === 0 || cutCount === order.targetSlices;
  ctx.fillStyle = prepStep === 'CUTTING' ? '#D97706' : sliceDone ? '#059669' : '#334155';
  const sliceText =
    order.targetSlices === 0 ? 'Low-Carb (Không bánh)' : `Cắt ${cutCount}/${order.targetSlices} khúc`;
  ctx.fillText(sliceText, cx, checkY + 8);
  cx += ctx.measureText(sliceText).width + 12;

  const reqEntries = (Object.keys(order.requiredToppings) as ToppingId[]).filter(
    (k) => order.requiredToppings[k] > 0
  );
  for (const tid of reqEntries) {
    const need = order.requiredToppings[tid];
    const got = addedToppings[tid] || 0;
    const def = TOPPING_MAP[tid];
    const done = got === need;
    const over = got > need;
    ctx.fillStyle = over ? '#E11D48' : done ? '#059669' : '#334155';
    const label = `${def.shortName} ${got}/${need}`;
    if (cx + ctx.measureText(label).width < b.x + b.w - 135) {
      ctx.fillText(`· ${label}`, cx, checkY + 8);
      cx += ctx.measureText(`· ${label}`).width + 8;
    }
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.fillText(
    `Chanh: ${SEASONING_LABEL[order.limeTarget]} · Sa tế: ${SEASONING_LABEL[order.chiliTarget]}`,
    b.x + b.w - padX,
    checkY + 8
  );
}

function drawRicePaperSlice(ctx: CanvasRenderingContext2D, slice: PolygonSlice, isRoll = false): void {
  if (slice.points.length < 3) return;
  ctx.save();

  ctx.translate(slice.cx, slice.cy);
  ctx.rotate(slice.angle);
  ctx.translate(-slice.cx, -slice.cy);

  ctx.fillStyle = 'rgba(17, 19, 24, 0.24)';
  ctx.beginPath();
  slice.points.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x + 4, p.y + 5);
    else ctx.lineTo(p.x + 4, p.y + 5);
  });
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = slice.hitFlash > 0.2 ? '#FEF08A' : isRoll ? '#FFF8E1' : '#FFFDF2';
  ctx.beginPath();
  slice.points.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.clip();

  if (isRoll) {
    // Rich layered roll filling stripes peeking through translucent rice paper!
    ctx.fillStyle = 'rgba(251, 191, 36, 0.42)'; // Mango
    ctx.fillRect(slice.cx - 260, slice.cy - 22, 520, 14);
    ctx.fillStyle = 'rgba(185, 28, 28, 0.36)'; // Khô bò
    ctx.fillRect(slice.cx - 260, slice.cy - 6, 520, 14);
    ctx.fillStyle = 'rgba(22, 163, 74, 0.34)'; // Rau răm
    ctx.fillRect(slice.cx - 260, slice.cy + 10, 520, 12);

    // Subtle cylindrical shading & rice-paper wrap sheen
    const cylGrad = ctx.createLinearGradient(0, slice.cy - 44, 0, slice.cy + 44);
    cylGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    cylGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
    cylGrad.addColorStop(1, 'rgba(180, 130, 70, 0.24)');
    ctx.fillStyle = cylGrad;
    ctx.fillRect(slice.cx - 260, slice.cy - 60, 520, 120);
  } else {
    ctx.strokeStyle = 'rgba(217, 179, 130, 0.4)';
    ctx.lineWidth = 1.5;
    const step = 15;
    for (let gx = slice.cx - 200; gx <= slice.cx + 200; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, slice.cy - 200);
      ctx.lineTo(gx, slice.cy + 200);
      ctx.stroke();
    }
    for (let gy = slice.cy - 200; gy <= slice.cy + 200; gy += step) {
      ctx.beginPath();
      ctx.moveTo(slice.cx - 200, gy);
      ctx.lineTo(slice.cx + 200, gy);
      ctx.stroke();
    }
  }

  // Tiny red chili/shrimp flecks
  ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
  for (let sx = -180; sx <= 180; sx += 30) {
    for (let sy = -90; sy <= 90; sy += 26) {
      ctx.beginPath();
      ctx.arc(slice.cx + sx + ((sy * 7) % 11), slice.cy + sy + ((sx * 5) % 11), 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();

  ctx.restore();
}

function drawBambooMat(ctx: CanvasRenderingContext2D, r: Rect): void {
  drawComicBox(ctx, r, '#D9A760', 14, 6, 3);
  ctx.save();
  roundRectPath(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.clip();
  for (let y = r.y + 10; y < r.y + r.h; y += 12) {
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    ctx.lineTo(r.x + r.w, y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(254, 243, 199, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(r.x, y + 2.5);
    ctx.lineTo(r.x + r.w, y + 2.5);
    ctx.stroke();
  }
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 3;
  for (const tx of [r.x + 36, r.x + r.w * 0.5, r.x + r.w - 36]) {
    ctx.beginPath();
    ctx.moveTo(tx, r.y);
    ctx.lineTo(tx, r.y + r.h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawButton(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  label: string,
  bg: string,
  textColor: string,
  hovered: boolean,
  disabled = false
): void {
  const offset = hovered && !disabled ? -2 : 0;
  const rect = { x: r.x, y: r.y + offset, w: r.w, h: r.h };
  drawComicBox(ctx, rect, disabled ? '#CBD5E1' : bg, 12, disabled ? 2 : 4, 3);
  ctx.font = '800 15px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = disabled ? '#64748B' : textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w * 0.5, rect.y + rect.h * 0.5 + 1);
}

function drawPowerBar(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  meter: SeasoningMeter,
  targetLevel: 'IT' | 'VUA' | 'NHIEU',
  fillGradientColor: string
): void {
  drawComicBox(ctx, rect, '#E2E8F0', 10, 3, 2.5);

  const [minT, maxT] = SEASONING_RANGE[targetLevel];
  const innerX = rect.x + 3;
  const innerW = rect.w - 6;

  const zoneX = innerX + (minT / 100) * innerW;
  const zoneW = ((maxT - minT) / 100) * innerW;
  ctx.fillStyle = 'rgba(16, 185, 129, 0.34)';
  ctx.fillRect(zoneX, rect.y + 3, zoneW, rect.h - 6);

  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2;
  ctx.strokeRect(zoneX, rect.y + 3, zoneW, rect.h - 6);

  const fillW = (meter.value / 100) * innerW;
  if (fillW > 2) {
    ctx.fillStyle = fillGradientColor;
    roundRectPath(ctx, innerX, rect.y + 5, fillW, rect.h - 10, 5);
    ctx.fill();
  }

  const needleX = innerX + (meter.value / 100) * innerW;
  ctx.fillStyle = INK;
  ctx.fillRect(needleX - 3, rect.y - 4, 6, rect.h + 8);

  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#065F46';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`Vùng chuẩn (${SEASONING_LABEL[targetLevel]})`, zoneX + zoneW * 0.5, rect.y - 4);

  if (meter.resultLabel) {
    ctx.font = '800 13px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = meter.accuracy >= 0.75 ? '#059669' : '#E11D48';
    ctx.textAlign = 'right';
    ctx.fillText(meter.resultLabel, rect.x + rect.w, rect.y - 4);
  }
}

export function renderGameFrame(ctx: CanvasRenderingContext2D, state: RenderState): void {
  const { width: w, height: h } = state;
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  ctx.translate(state.shakeX, state.shakeY);

  if (state.phase === 'RAID_CHASE') {
    renderRaidChase(ctx, state, computeRaidLayout(w, h));
  } else if (state.phase === 'WUXIA_COMBAT') {
    renderWuxiaCombat(ctx, state);
  } else {
    renderCookingPhase(ctx, state, computePrepLayout(w, h));
  }

  renderParticlesAndCallouts(ctx, state);

  if (state.phase === 'RAID_WARNING') {
    const pulse = 0.45 + 0.45 * Math.sin(state.time * 18);
    ctx.strokeStyle = `rgba(225, 29, 72, ${pulse})`;
    ctx.lineWidth = 26;
    ctx.strokeRect(13, 13, w - 26, h - 26);

    const bannerW = Math.min(640, w - 40);
    const bannerH = 128;
    const bannerRect: Rect = {
      x: (w - bannerW) * 0.5,
      y: h * 0.36,
      w: bannerW,
      h: bannerH,
    };
    drawComicBox(ctx, bannerRect, '#FFF1F2', 16, 6, 4);

    ctx.font = '800 28px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#E11D48';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚨 TRẬT TỰ TỚI! ĐẨY XE CHẠY NGAY! 🚨', w * 0.5, bannerRect.y + 46);

    ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = INK;
    ctx.fillText(
      'Dùng A / D, ← / → hoặc kéo xe · Nhấn Space để Bứt Tốc né rào chắn, Ninja Lead & mưa Sài Gòn!',
      w * 0.5,
      bannerRect.y + 88
    );
  }

  ctx.restore();
}

function renderCookingPhase(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  layout: PrepLayout
): void {
  const { width: w, height: h, time } = state;

  if (state.backdropImg && state.backdropImg.complete && state.backdropImg.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, layout.counterY);
    ctx.clip();

    const img = state.backdropImg;
    const scale = Math.max(w / img.naturalWidth, (layout.counterY * 1.45) / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    ctx.drawImage(img, (w - drawW) * 0.5, -drawH * 0.14, drawW, drawH);

    const dp = Math.max(0, Math.min(1, state.dayProgress));
    const scrim = ctx.createLinearGradient(0, 0, 0, layout.counterY);
    if (dp < 0.45) {
      // Morning sunlit alley
      scrim.addColorStop(0, 'rgba(253, 224, 71, 0.12)');
      scrim.addColorStop(1, 'rgba(17, 19, 24, 0.14)');
    } else if (dp < 0.78) {
      // Saigon sunset amber glow
      const t = (dp - 0.45) / 0.33;
      scrim.addColorStop(0, `rgba(234, 88, 12, ${0.22 + t * 0.18})`);
      scrim.addColorStop(1, `rgba(124, 45, 18, ${0.15 + t * 0.14})`);
    } else {
      // Night shift deep dusk
      const t = (dp - 0.78) / 0.22;
      scrim.addColorStop(0, `rgba(15, 23, 42, ${0.42 + t * 0.24})`);
      scrim.addColorStop(1, `rgba(17, 19, 24, ${0.26 + t * 0.18})`);
    }
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, layout.counterY);
    ctx.restore();
  } else {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, layout.counterY);
    skyGrad.addColorStop(0, '#1E2230');
    skyGrad.addColorStop(1, '#2D3245');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, layout.counterY);
  }

  const lanternBoost = state.dayProgress > 0.65 ? 1.65 : 0.75;
  for (let i = 1; i <= 9; i++) {
    const lx = (w * i) / 10;
    const ly = 64 + Math.sin(i * 1.2) * 8;
    const glow = 0.5 + 0.35 * Math.sin(time * 3 + i);
    ctx.fillStyle = `rgba(251, 191, 36, ${Math.min(0.65, glow * 0.25 * lanternBoost)})`;
    ctx.beginPath();
    ctx.arc(lx, ly, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state.order) {
    drawCustomerCharacter(
      ctx,
      state.order,
      layout.customerX,
      layout.customerY,
      time,
      state.sickCustomerTimer
    );
    if (state.order.isAngry) {
      const appeaseRect = getAppeaseActiveRect(layout);
      drawButton(
        ctx,
        appeaseRect,
        '🥚 Tặng Trứng (-2k)',
        '#FFE4E6',
        '#9F1239',
        state.hoverAppeaseActive
      );
    }
    if (state.rainEvent.active) {
      const activeRect = getActiveCustomerRect(layout);
      drawRaincoatAndTarget(
        ctx,
        activeRect.x + activeRect.w * 0.5,
        layout.customerY,
        state.rainEvent.activeCustomerHasRaincoat,
        time,
        1
      );
    }
    drawOrderBubble(
      ctx,
      state.order,
      layout,
      state.slices.length,
      state.addedToppings,
      state.prepStep
    );
  } else if (state.bocPhotTimer > 0) {
    // Bóc Phốt Mode empty counter card!
    const bpW = Math.min(540, w - 64);
    drawComicBox(
      ctx,
      { x: w * 0.5 - bpW * 0.5, y: layout.counterY - 120, w: bpW, h: 92 },
      '#FFF1F2',
      14,
      5,
      3
    );
    ctx.font = '800 20px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#E11D48';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💔 BỊ BÓC PHỐT TRÊN TÓP TÓP!', w * 0.5, layout.counterY - 88);
    ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = INK;
    ctx.fillText(
      `Khách sợ không dám tới trong ${Math.ceil(state.bocPhotTimer)} giây nữa...`,
      w * 0.5,
      layout.counterY - 54
    );
  }

  // Waiting customers standing in line behind/beside counter
  const waitingRects = getWaitingCustomerRects(layout, state.waitingCustomers.length);
  state.waitingCustomers.forEach((wc, idx) => {
    const wr = waitingRects[idx];
    const cx = wr.x + wr.w * 0.5;
    const cy = layout.counterY - 6;
    drawMiniWaitingCustomer(ctx, wc, cx, cy, time + idx);
    if (wc.isAngry && !state.rainEvent.active) {
      const appRect = getAppeaseWaitingRect(wr);
      drawComicBox(
        ctx,
        appRect,
        state.hoverAppeaseWaitingIdx === idx ? '#FDE047' : '#FFE4E6',
        7,
        2,
        2
      );
      ctx.font = '800 10px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = '#9F1239';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🥚 Dỗ (-2k)', appRect.x + appRect.w * 0.5, appRect.y + appRect.h * 0.5);
    } else if (wc.customerType === 'APP_SHIPPER' && !state.rainEvent.active) {
      drawComicBox(ctx, { x: wr.x - 8, y: wr.y - 26, w: 76, h: 22 }, '#FEF08A', 6, 1.5, 2);
      ctx.font = '800 10px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = '#92400E';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ Shipper!', wr.x + 30, wr.y - 15);
    }
    if (state.rainEvent.active) {
      drawRaincoatAndTarget(ctx, cx, cy, wc.hasRaincoat, time, 0.78);
    }
  });

  // Feature 5: Clickable Electric Pole ("Cột Điện Tín Dụng Đen") on far left sidewalk
  drawElectricPoleNpc(ctx, getElectricPoleRect(layout), state.loanDebt, state.hoverElectricPole, time);

  // Mechanic 3: Street Diplomacy NPCs (Chú Vé Số & Bà Chủ Nhà)
  if (state.lotterySeller.active) {
    drawLotterySellerNpc(ctx, state.lotterySeller, time);
  }
  if (state.landlady.active) {
    drawLandladyNpc(ctx, state.landlady, time);
  }

  // Feature 5: 2 Thug NPCs blocking half the screen if loan interest unpaid!
  if (state.thugsActive) {
    drawLoanSharkThugs(ctx, state, layout);
  }

  const counterGrad = ctx.createLinearGradient(0, layout.counterY, 0, h);
  counterGrad.addColorStop(0, '#F6EFE2');
  counterGrad.addColorStop(1, '#E6D9C3');
  ctx.fillStyle = counterGrad;
  ctx.fillRect(0, layout.counterY, w, h - layout.counterY);

  ctx.strokeStyle = 'rgba(120, 90, 50, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, layout.counterY + 22);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  const rimGrad = ctx.createLinearGradient(0, layout.counterY, 0, layout.counterY + 22);
  rimGrad.addColorStop(0, '#E2E8F0');
  rimGrad.addColorStop(0.5, '#CBD5E1');
  rimGrad.addColorStop(1, '#94A3B8');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(0, layout.counterY, w, 22);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, layout.counterY);
  ctx.lineTo(w, layout.counterY);
  ctx.moveTo(0, layout.counterY + 22);
  ctx.lineTo(w, layout.counterY + 22);
  ctx.stroke();

  // Sign with Vehicle Level & optional RGB LED Upgrade glow!
  const vehicleTag =
    state.vehicleLevel === 3
      ? 'AIR BLADE'
      : state.vehicleLevel === 2
      ? 'XE ĐẨY INOX'
      : 'RỔ BÁNH TRÁNG';
  const signW = 178;
  const signRect: Rect = { x: 18, y: layout.counterY - 14, w: signW, h: 30 };
  if (state.upgrades.ledRgb) {
    const hue = Math.floor((time * 160) % 360);
    ctx.save();
    ctx.strokeStyle = `hsl(${hue}, 90%, 55%)`;
    ctx.lineWidth = 7;
    roundRectPath(ctx, signRect.x - 2, signRect.y - 2, signRect.w + 4, signRect.h + 4, 9);
    ctx.stroke();
    ctx.restore();
    drawComicBox(ctx, signRect, '#111318', 7, 3, 2.5);
    ctx.font = '800 12px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = `hsl(${(hue + 60) % 360}, 95%, 65%)`;
  } else {
    drawComicBox(ctx, signRect, '#F59E0B', 7, 3, 2.5);
    ctx.font = '800 12px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = INK;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    state.upgrades.ledRgb ? `✨ ${vehicleTag} RGB` : vehicleTag,
    18 + signW * 0.5,
    layout.counterY + 1
  );

  // Loa Kẹo Kéo speaker prop if unlocked!
  if (state.upgrades.loaKeoKeo && w > 880) {
    const lx = 20;
    const ly = layout.counterY + 34;
    const pulse = Math.sin(time * 14) * 1.5;
    drawComicBox(ctx, { x: lx, y: ly, w: 46, h: 60 }, '#1E293B', 6, 3, 2.5);
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(lx + 23, ly + 36, 14 + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(lx + 23, ly + 14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '800 9px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#FACC15';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 LOA', lx + 23, ly + 72);
  } else if (w > 960) {
    const drawSpiceJar = (jx: number, jy: number, color: string, label: string) => {
      drawComicBox(ctx, { x: jx, y: jy, w: 32, h: 36 }, color, 6, 2, 2);
      ctx.fillStyle = '#E11D48';
      roundRectPath(ctx, jx - 2, jy - 6, 36, 9, 3);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.font = '800 7px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(label, jx + 16, jy + 19);
    };
    drawSpiceJar(24, layout.counterY + 38, '#EA580C', 'SA TẾ');
    drawSpiceJar(64, layout.counterY + 38, '#D97706', 'MUỐI');
  }

  // Viral Mode & Daily Buff badges on counter rim
  let badgeX = 208;
  if (state.viralOrdersLeft > 0) {
    drawComicBox(ctx, { x: badgeX, y: layout.counterY - 14, w: 148, h: 28 }, '#FEF08A', 7, 2, 2.5);
    ctx.font = '800 12px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#E11D48';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🔥 VIRAL x3 (${state.viralOrdersLeft})`, badgeX + 74, layout.counterY);
    badgeX += 156;
  }
  if (state.dailyBuffs.luckyCharm) {
    drawComicBox(ctx, { x: badgeX, y: layout.counterY - 14, w: 122, h: 28 }, '#DCFCE7', 7, 2, 2.5);
    ctx.font = '800 11px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#15803D';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍀 +10% Tiền Bo', badgeX + 61, layout.counterY);
    badgeX += 130;
  }
  if (state.dailyBuffs.proteinBuff) {
    drawComicBox(ctx, { x: badgeX, y: layout.counterY - 14, w: 128, h: 28 }, '#FFE4E6', 7, 2, 2.5);
    ctx.font = '800 11px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#BE123C';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💪 Chạy Nhanh!', badgeX + 64, layout.counterY);
    badgeX += 136;
  }
  if (state.dailyBuffs.landladySpeedBuff) {
    drawComicBox(ctx, { x: badgeX, y: layout.counterY - 14, w: 148, h: 28 }, '#FEF3C7', 7, 2, 2.5);
    ctx.font = '800 11px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#92400E';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧹 Bà Chủ Nhà +Speed', badgeX + 74, layout.counterY);
  }

  const chairBaseX = w - 46;
  for (let c = 0; c < state.redChairs; c++) {
    drawRedPlasticChair(ctx, chairBaseX - c * 11, layout.counterY - 5 - c * 5, 0.85, 0);
  }
  ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#9F1239';
  ctx.textAlign = 'right';
  ctx.fillText(`Ghế Nhựa Đỏ (${state.redChairs})`, w - 18, layout.counterY + 36);

  if (state.bossFight.active) {
    renderBossFightStation(ctx, state, layout);
  } else if (state.flowRhythm.active) {
    renderFlowRhythmStation(ctx, state, layout);
  } else {
    const stepNames: { key: PrepStep; label: string }[] =
      state.dishType === 'CUON'
        ? [
            { key: 'TOPPINGS', label: '1. Trải Topping' },
            { key: 'SEASONING', label: '2. Chanh & Sa Tế' },
            { key: 'ROLLING', label: '3. Cuốn Bánh' },
            { key: 'CUTTING', label: '4. Cắt Tự Do & Giao' },
          ]
        : [
            { key: 'CUTTING', label: '1. Cắt Bánh' },
            { key: 'TOPPINGS', label: '2. Bỏ Topping' },
            { key: 'SEASONING', label: '3. Chanh & Sa Tế' },
            { key: 'SHAKING', label: '4. Lắc & Giao' },
          ];

    ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const stepY = layout.counterY + 42;
    const totalStepSpan = Math.min(580, w - 80);
    stepNames.forEach((s, idx) => {
      const sx = w * 0.5 - totalStepSpan * 0.5 + (idx / 3) * totalStepSpan;
      const isActive = state.prepStep === s.key || (state.prepStep === 'READY' && idx === 3);
      ctx.fillStyle = isActive ? '#D97706' : '#64748B';
      ctx.fillText(s.label, sx, stepY);
      if (isActive) {
        const tw = ctx.measureText(s.label).width;
        ctx.fillRect(sx - tw * 0.5, stepY + 11, tw, 3);
      }
    });

    if (state.order) {
      if (state.dishType === 'CUON') {
        renderCuonStation(ctx, state, layout);
      } else {
        renderTronStation(ctx, state, layout);
      }
    }
  }

  if (state.prepStep === 'CUTTING' && !state.bossFight.active && !state.flowRhythm.active && state.swipeTrail.length >= 2) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < state.swipeTrail.length; i++) {
      const p0 = state.swipeTrail[i - 1];
      const p1 = state.swipeTrail[i];
      const t = i / state.swipeTrail.length;
      ctx.strokeStyle = `rgba(245, 158, 11, ${t * 0.9})`;
      ctx.lineWidth = 4 + t * 11;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${t})`;
      ctx.lineWidth = 2 + t * 4;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Mechanic 3: Grumpy Landlady Dust Overlay (30% opaque brown dust cloud blinding the player!)
  if (state.landlady.active && state.landlady.sweeping) {
    ctx.save();
    ctx.fillStyle = 'rgba(110, 65, 25, 0.30)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(146, 98, 52, 0.25)';
    for (let d = 0; d < 18; d++) {
      const dx = ((d * 137 + time * 140) % (w + 120)) - 60;
      const dy = 80 + ((d * 89 + Math.sin(time * 2 + d) * 35) % (h - 100));
      ctx.beginPath();
      ctx.arc(dx, dy, 26 + (d % 4) * 14, 0, Math.PI * 2);
      ctx.fill();
    }
    const dustBannerW = Math.min(540, w - 40);
    drawComicBox(
      ctx,
      { x: w * 0.5 - dustBannerW * 0.5, y: layout.counterY + 56, w: dustBannerW, h: 42 },
      '#78350F',
      10,
      3,
      2.5
    );
    ctx.font = '800 13px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#FEF3C7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      '🧹 BÀ CHỦ NHÀ ĐANG QUÉT BỤI! Bấm vào bả để hối lộ 1 Bánh Tráng (+Tốc Độ Chạy Trật Tự)!',
      w * 0.5,
      layout.counterY + 77
    );
    ctx.restore();
  }

  // Event 2: Sudden Saigon Rain dark overlay + rain streaks + countdown banner
  if (state.rainEvent.active) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.58)';
    ctx.lineWidth = 2;
    for (let r = 0; r < 55; r++) {
      const rx = ((r * 97 + time * 160) % (w + 60)) - 30;
      const ry = ((r * 173 + time * 1040) % (h + 60)) - 30;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 12, ry + 28);
      ctx.stroke();
    }

    const bannerW = Math.min(540, w - 40);
    drawComicBox(
      ctx,
      { x: w * 0.5 - bannerW * 0.5, y: layout.counterY + 56, w: bannerW, h: 48 },
      '#0EA5E9',
      12,
      4,
      3
    );
    ctx.font = '800 15px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `⛈️ MƯA SÀI GÒN! Bấm vào TẤT CẢ khách trong ${state.rainEvent.timeLeft.toFixed(1)}s để phát Áo Mưa Nilon!`,
      w * 0.5,
      layout.counterY + 80
    );
  }

  // Mechanic 1: The "Ripped Bag" Slow-Motion QTE Overlay
  if (state.rippedBag.active) {
    renderRippedBagOverlay(ctx, state);
  }

  // Event 1: Chiến Thần Tóp Tóp QTE Overlay
  if (state.tiktokQte.active) {
    renderTiktokQteOverlay(ctx, state);
  }
}

function drawMiniWaitingCustomer(
  ctx: CanvasRenderingContext2D,
  wc: WaitingCustomer,
  x: number,
  y: number,
  time: number
): void {
  const type = wc.customerType;
  const bob = Math.sin(time * (wc.isAngry ? 9 : 3.4)) * 1.8;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;

  const shirtColor =
    type === 'NINJA_LEAD'
      ? '#0D9488'
      : type === 'APP_SHIPPER'
      ? wc.shipperBrand !== 'ORANGE'
        ? '#16A34A'
        : '#EA580C'
      : type === 'GEN_Z'
      ? '#7C3AED'
      : type === 'FENG_SHUI'
      ? '#4C1D95'
      : type === 'GYM_BRO'
      ? '#E11D48'
      : type === 'REAL_ESTATE'
      ? '#1E293B'
      : type === 'BUSINESS_BAZI'
      ? '#334155'
      : type === 'HEARTBROKEN_GENZ'
      ? '#C084FC'
      : type === 'OFFICE'
      ? '#E2E8F0'
      : '#F59E0B';

  ctx.fillStyle = shirtColor;
  roundRectPath(ctx, -22, -36, 44, 38, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = wc.isAngry ? '#FCA5A5' : '#FDE6C4';
  ctx.beginPath();
  ctx.arc(0, -56, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (type === 'NINJA_LEAD') {
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.arc(0, -58, 22, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#18181B';
    ctx.fillRect(-13, -62, 26, 8);
  } else if (type === 'APP_SHIPPER') {
    ctx.fillStyle = wc.shipperBrand !== 'ORANGE' ? '#15803D' : '#C2410C';
    ctx.beginPath();
    ctx.arc(0, -60, 22, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(-6, -54, 2.2, 0, Math.PI * 2);
    ctx.arc(6, -54, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.arc(0, -61, 20, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(-6, -55, 2.2, 0, Math.PI * 2);
    ctx.arc(6, -55, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (wc.isAngry) {
    ctx.font = '800 13px "Bricolage Grotesque", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💢', 16, -72);
  }
  ctx.restore();
}

function drawLandladyNpc(
  ctx: CanvasRenderingContext2D,
  landlady: LandladyState,
  time: number
): void {
  const sweepSwing = landlady.sweeping ? Math.sin(time * 12) * 14 : 0;
  ctx.save();
  ctx.translate(landlady.x, landlady.y);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;

  // Floral "đồ bộ" outfit
  ctx.fillStyle = '#D946EF';
  roundRectPath(ctx, -26, -48, 52, 48, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FDE047';
  for (const [fx, fy] of [
    [-10, -34],
    [10, -24],
    [-4, -14],
  ]) {
    ctx.beginPath();
    ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head + pink hair curlers
  ctx.fillStyle = '#FDE6C4';
  ctx.beginPath();
  ctx.arc(0, -68, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(0, -73, 22, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FB7185';
  roundRectPath(ctx, -18, -94, 12, 8, 3);
  ctx.fill();
  ctx.stroke();
  roundRectPath(ctx, 6, -94, 12, 8, 3);
  ctx.fill();
  ctx.stroke();

  // Grumpy eyes & frown
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(-7, -67, 2.5, 0, Math.PI * 2);
  ctx.arc(7, -67, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-12, -74);
  ctx.lineTo(-3, -71);
  ctx.moveTo(12, -74);
  ctx.lineTo(3, -71);
  ctx.stroke();

  // Broom sweeping left & right
  ctx.save();
  ctx.translate(-22 + sweepSwing * 0.4, -22);
  ctx.rotate(-0.4 + sweepSwing * 0.025);
  ctx.fillStyle = '#B45309';
  ctx.fillRect(-3, -36, 6, 56);
  ctx.strokeRect(-3, -36, 6, 56);
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(-14, 20);
  ctx.lineTo(14, 20);
  ctx.lineTo(18, 36);
  ctx.lineTo(-18, 36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const rect = getLandladyRect(0, 0);
  drawComicBox(ctx, { x: rect.x - 16, y: -124, w: rect.w + 32, h: 24 }, '#FEF08A', 7, 2, 2);
  ctx.font = '800 10px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#9F1239';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧹 Hối lộ 1 Bánh Tráng!', 0, -112);

  ctx.restore();
}

function drawLotterySellerNpc(
  ctx: CanvasRenderingContext2D,
  seller: LotterySellerState,
  time: number
): void {
  const walkBob = Math.abs(Math.sin(time * 9)) * 4;
  ctx.save();
  ctx.translate(seller.x, seller.y - walkBob);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;

  // Shirt
  ctx.fillStyle = '#0EA5E9';
  roundRectPath(ctx, -22, -44, 44, 44, 14);
  ctx.fill();
  ctx.stroke();

  // Head + Nón lá
  ctx.fillStyle = '#FDE6C4';
  ctx.beginPath();
  ctx.arc(0, -62, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.moveTo(-30, -70);
  ctx.lineTo(0, -96);
  ctx.lineTo(30, -70);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Stack of lottery tickets in hand
  ctx.fillStyle = '#FEF08A';
  roundRectPath(ctx, 16, -42, 22, 28, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#E11D48';
  ctx.fillRect(19, -36, 16, 4);

  drawComicBox(ctx, { x: -58, y: -122, w: 116, h: 24 }, '#DCFCE7', 7, 2, 2);
  ctx.font = '800 10px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#15803D';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎟️ Vé Số 10k (500k)', 0, -110);

  ctx.restore();
}

function drawElectricPoleNpc(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  loanDebt: number,
  hovered: boolean,
  time: number
): void {
  ctx.save();
  const poleX = r.x + r.w * 0.5;
  // Utility pole concrete shaft
  ctx.fillStyle = hovered ? '#CBD5E1' : '#94A3B8';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  roundRectPath(ctx, poleX - 10, r.y, 20, r.h, 3);
  ctx.fill();
  ctx.stroke();

  // Top crossbar & black tangled cables
  ctx.fillStyle = '#475569';
  ctx.fillRect(poleX - 24, r.y + 8, 48, 7);
  ctx.strokeRect(poleX - 24, r.y + 8, 48, 7);
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, r.y + 18);
  ctx.quadraticCurveTo(poleX, r.y + 4, poleX + 140, r.y + 12);
  ctx.stroke();

  // Colorful Loan Shark Flyers ("VAY NÓNG 20K") pasted on the pole
  const flyer1: Rect = { x: poleX - 22, y: r.y + 34, w: 44, h: 32 };
  drawComicBox(ctx, flyer1, hovered ? '#FEF08A' : '#FDE047', 4, 2, 2);
  ctx.font = '800 8px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#DC2626';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VAY NÓNG', poleX, flyer1.y + 10);
  ctx.fillStyle = INK;
  ctx.fillText(loanDebt > 0 ? `NỢ ${Math.round(loanDebt / 1000)}K` : '20.000đ', poleX, flyer1.y + 22);

  const flyer2: Rect = { x: poleX - 18, y: r.y + 74, w: 38, h: 24 };
  drawComicBox(ctx, flyer2, '#FFE4E6', 3, 1.5, 2);
  ctx.font = '800 7.5px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#9F1239';
  ctx.fillText('0 THẾ CHẤP', poleX, flyer2.y + 12);

  if (hovered) {
    const pulse = 1 + Math.sin(time * 12) * 0.05;
    ctx.save();
    ctx.translate(poleX + 28, r.y + 20);
    ctx.scale(pulse, pulse);
    drawComicBox(ctx, { x: -42, y: -12, w: 84, h: 22 }, '#111318', 6, 1, 2);
    ctx.font = '800 9.5px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#FACC15';
    ctx.fillText('⚡ Bấm Vay Nóng', 0, -1);
    ctx.restore();
  }
  ctx.restore();
}

function drawLoanSharkThugs(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  layout: PrepLayout
): void {
  const { width: w, height: h, time } = state;
  const blockX = w * 0.54;
  // Semi-transparent intimidating shadow + caution stripe blocking half the screen
  ctx.save();
  ctx.fillStyle = 'rgba(17, 19, 24, 0.34)';
  ctx.fillRect(blockX, 56, w - blockX, h - 56);

  // Two muscular "Thug" NPCs standing guard on the right half
  const thugXs = [w * 0.66, w * 0.82];
  thugXs.forEach((tx, idx) => {
    const bob = Math.sin(time * 5 + idx * 1.4) * 2.5;
    const ty = layout.counterY + 26 + bob;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;

    // Broad tattooed torso / black tank top
    ctx.fillStyle = idx === 0 ? '#18181B' : '#334155';
    roundRectPath(ctx, -46, -54, 92, 74, 18);
    ctx.fill();
    ctx.stroke();

    // Thick gold chain
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -48, 22, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Head + menacing sunglasses
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.fillStyle = '#E5B88B';
    ctx.beginPath();
    ctx.arc(0, -84, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#09090B';
    roundRectPath(ctx, -24, -93, 21, 12, 3);
    ctx.fill();
    roundRectPath(ctx, 3, -93, 21, 12, 3);
    ctx.fill();
    ctx.fillRect(-3, -90, 6, 4);

    // Scowl
    ctx.beginPath();
    ctx.moveTo(-12, -68);
    ctx.quadraticCurveTo(0, -76, 12, -68);
    ctx.stroke();

    ctx.restore();
  });

  // Warning placard
  const cardW = Math.min(340, w - blockX - 24);
  const cardX = blockX + (w - blockX - cardW) * 0.5;
  drawComicBox(ctx, { x: cardX, y: layout.counterY + 58, w: cardW, h: 72 }, '#FFF1F2', 12, 4, 3);
  ctx.font = '800 15px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#E11D48';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🕶️ ĐÀN EM ĐÒI NỢ ÁN NGỮ (-50% KHÁCH)!', cardX + cardW * 0.5, layout.counterY + 82);
  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText(
    `Bấm Cột Điện góc trái để trả ${state.loanDebt.toLocaleString('vi-VN')}đ!`,
    cardX + cardW * 0.5,
    layout.counterY + 108
  );
  ctx.restore();
}

function drawBeatScissors(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  openAmount: number
): void {
  ctx.save();
  ctx.translate(x, y);
  const bladeAngle = 0.08 + openAmount * 0.42;

  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.rotate(dir * bladeAngle);
    // Silver scissor blade
    ctx.fillStyle = '#E2E8F0';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(15, -3 * dir);
    ctx.lineTo(18, 0);
    ctx.lineTo(-2, 2 * dir);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Red/gold finger loop handle
    ctx.strokeStyle = dir === -1 ? '#FACC15' : '#FB7185';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(-9, dir * 5, 4.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Pivot screw
  ctx.fillStyle = '#FACC15';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function renderFlowRhythmStation(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  layout: PrepLayout
): void {
  const { width: w, time } = state;
  const fr = state.flowRhythm;
  const fl = getFlowLaneRects(layout);
  const keyLabels = ['D', 'F', 'J', 'K'];
  const laneColors = ['#FB7185', '#FACC15', '#38BDF8', '#4ADE80'];

  // Glowing rainbow aura behind rhythm highway
  const hue = Math.floor((time * 180) % 360);
  ctx.save();
  ctx.strokeStyle = `hsl(${hue}, 95%, 58%)`;
  ctx.lineWidth = 7;
  roundRectPath(ctx, fl.container.x - 3, fl.container.y - 3, fl.container.w + 6, fl.container.h + 6, 18);
  ctx.stroke();
  ctx.restore();

  drawComicBox(ctx, fl.container, '#111827', 16, 6, 3.5);

  // Beat synchronization (0 = right on the beat snip!)
  const beatPhase = (fr.elapsed % fr.beatInterval) / fr.beatInterval;
  const beatImpulse = Math.max(0, 1 - beatPhase * 3.4);
  const openAmount = Math.abs(Math.sin(beatPhase * Math.PI));

  // Header bar
  ctx.font = '800 14px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#FACC15';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `FLOW STATE · NHỊP KÉO CẮT [D · F · J · K]`,
    fl.container.x + 18,
    fl.container.y + 20
  );

  // Combo + Masterpiece x5 goal pill in header
  ctx.font = '800 12px "JetBrains Mono", monospace';
  ctx.fillStyle = fr.hitsPerfect >= 5 ? '#4ADE80' : '#E2E8F0';
  ctx.textAlign = 'right';
  ctx.fillText(
    `Combo x${fr.combo} · Perfect ${fr.hitsPerfect}/5 (x5)`,
    fl.container.x + fl.container.w - 48,
    fl.container.y + 20
  );

  // Animated vector scissors synced to the audio snip-snip beat
  drawBeatScissors(
    ctx,
    fl.container.x + fl.container.w - 26,
    fl.container.y + 20,
    openAmount
  );

  // Visual Note-Tracker Strip on Canvas (live beat timeline & 8-note status)
  const tr = fl.trackerRect;
  drawComicBox(ctx, tr, '#0F172A', 10, 0, 2);

  if (fr.notes.length > 0) {
    const firstHit = fr.notes[0].hitTime - fr.beatInterval;
    const lastHit = fr.notes[fr.notes.length - 1].hitTime + 0.25;
    const span = Math.max(1, lastHit - firstHit);
    const playProgress = Math.max(0, Math.min(1, (fr.elapsed - firstHit) / span));
    const trackLeft = tr.x + 16;
    const trackW = tr.w - 32;
    const trackMidY = tr.y + tr.h * 0.5;

    // Base timeline rail + filled progress
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(trackLeft, trackMidY);
    ctx.lineTo(trackLeft + trackW, trackMidY);
    ctx.stroke();

    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(trackLeft, trackMidY);
    ctx.lineTo(trackLeft + trackW * playProgress, trackMidY);
    ctx.stroke();

    // Moving beat playhead marker
    const headX = trackLeft + trackW * playProgress;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(headX - 1.5, tr.y + 3, 3, tr.h - 6);

    // Individual note nodes along the visual tracker
    for (let idx = 0; idx < fr.notes.length; idx++) {
      const n = fr.notes[idx];
      const frac = Math.max(0, Math.min(1, (n.hitTime - firstHit) / span));
      const nx = trackLeft + frac * trackW;
      const isImminent = !n.judged && Math.abs(n.hitTime - fr.elapsed) <= 0.14;

      let fill = '#334155';
      let stroke = '#94A3B8';
      let textColor = '#F8FAFC';
      let label = keyLabels[n.lane];

      if (n.result === 'PERFECT') {
        fill = '#FACC15';
        stroke = '#FEF08A';
        textColor = INK;
        label = '★';
      } else if (n.result === 'GOOD') {
        fill = '#38BDF8';
        stroke = '#BAE6FD';
        textColor = INK;
        label = '✓';
      } else if (n.result === 'MISS') {
        fill = '#E11D48';
        stroke = '#FDA4AF';
        textColor = '#FFFFFF';
        label = '×';
      } else if (isImminent) {
        fill = laneColors[n.lane];
        stroke = '#FFFFFF';
        textColor = INK;
      }

      ctx.save();
      ctx.translate(nx, trackMidY);
      ctx.scale(isImminent ? 1.2 : 1, isImminent ? 1.2 : 1);
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = '800 10px "JetBrains Mono", monospace';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0.5);
      ctx.restore();
    }
  }

  const laneTop = fl.lanes[0].y;
  const fallSpan = Math.max(110, fl.hitY - laneTop);
  const travelTime = 1.35;

  // Draw 4 falling lanes, hit target rings, and tap pads
  fl.lanes.forEach((lr, idx) => {
    const flash = fr.laneFlashTimers[idx];
    const hasPerfectNote = fr.notes.some(
      (n) => !n.judged && n.lane === idx && Math.abs(n.hitTime - fr.elapsed) <= 0.12
    );

    ctx.fillStyle = flash > 0 ? 'rgba(250, 204, 21, 0.24)' : 'rgba(255, 255, 255, 0.06)';
    roundRectPath(ctx, lr.x, lr.y, lr.w, lr.h, 10);
    ctx.fill();
    ctx.strokeStyle = hasPerfectNote ? 'rgba(250, 204, 21, 0.65)' : 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = hasPerfectNote ? 2.5 : 1.5;
    ctx.stroke();

    // Beat-pulsing circular hit target ring at hitY
    const pad = fl.padRects[idx];
    const targetX = pad.x + pad.w * 0.5;
    const ringRadius = 22 + beatImpulse * 3;
    ctx.save();
    ctx.strokeStyle = hasPerfectNote ? '#FACC15' : flash > 0 ? '#FFFFFF' : 'rgba(56, 189, 248, 0.72)';
    ctx.lineWidth = hasPerfectNote ? 3.5 : 2.2;
    ctx.beginPath();
    ctx.arc(targetX, fl.hitY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    drawComicBox(ctx, pad, flash > 0 ? '#FACC15' : '#1E293B', 10, 2, 2.5);
    ctx.font = '800 15px "JetBrains Mono", monospace';
    ctx.fillStyle = flash > 0 ? INK : '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(keyLabels[idx], pad.x + pad.w * 0.5, pad.y + pad.h * 0.5 + 8);
  });

  // Glowing horizontal hit target bar
  ctx.strokeStyle = beatImpulse > 0.35 ? '#FACC15' : '#38BDF8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fl.container.x + 14, fl.hitY);
  ctx.lineTo(fl.container.x + fl.container.w - 14, fl.hitY);
  ctx.stroke();

  // Falling ingredient notes
  for (const note of fr.notes) {
    if (note.judged) continue;
    const dtToHit = note.hitTime - fr.elapsed;
    if (dtToHit > travelTime || dtToHit < -0.3) continue;
    const progress = 1 - dtToHit / travelTime;
    const ny = laneTop + progress * fallSpan;
    const pad = fl.padRects[note.lane];
    const nx = pad.x + pad.w * 0.5;
    const inPerfectWindow = Math.abs(dtToHit) <= 0.12;

    // Motion streak behind falling ingredient
    const streakGrad = ctx.createLinearGradient(nx, ny - 34, nx, ny);
    streakGrad.addColorStop(0, 'rgba(255,255,255,0)');
    streakGrad.addColorStop(1, inPerfectWindow ? 'rgba(250, 204, 21, 0.5)' : 'rgba(56, 189, 248, 0.32)');
    ctx.fillStyle = streakGrad;
    ctx.fillRect(nx - 10, ny - 34, 20, 34);

    ctx.save();
    ctx.translate(nx, ny);
    if (inPerfectWindow) {
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = inPerfectWindow ? '#FEF08A' : '#FFFFFF';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawToppingIcon(ctx, note.toppingId, 0, 0, 0.84);

    // Small lane key badge on note corner
    ctx.fillStyle = laneColors[note.lane];
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(15, -15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = '800 9px "JetBrains Mono", monospace';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(keyLabels[note.lane], 15, -14.5);
    ctx.restore();
  }

  // Last Judgment Text
  if (fr.lastJudgmentTimer > 0 && fr.lastJudgmentText) {
    ctx.font = '800 22px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = fr.lastJudgmentColor;
    ctx.textAlign = 'center';
    ctx.fillText(fr.lastJudgmentText, w * 0.5, fl.hitY - 52);
  }
}

function renderBossFightStation(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  layout: PrepLayout
): void {
  const { width: w, time } = state;
  const bf = state.bossFight;
  const bx = layout.bowlCenterX + state.bowlShakeOffset.x;
  const by = layout.bowlCenterY + 10 + state.bowlShakeOffset.y;
  const br = Math.min(148, layout.bowlRadius * 1.24) * state.bowlScale;

  // Giant stainless-steel basin!
  ctx.fillStyle = 'rgba(17, 19, 24, 0.28)';
  ctx.beginPath();
  ctx.arc(bx + 8, by + 10, br, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createRadialGradient(bx - br * 0.25, by - br * 0.25, br * 0.1, bx, by, br);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.75, '#CBD5E1');
  grad.addColorStop(1, '#64748B');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(bx, by, br, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();

  ctx.fillStyle = '#FEF3C7';
  ctx.beginPath();
  ctx.arc(bx, by, br * 0.84, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#64748B';
  ctx.stroke();

  // Giant contents swirling inside the basin
  const rotSpin = bf.stage === 'MIX' ? bf.mixAngleAccum : bf.taps * 0.12;
  const itemsToShow = Math.min(20, Math.floor(bf.taps / 2.5));
  const toppingsCycle: ToppingId[] = ['kho_bo', 'trung_cut', 'xoai', 'rau_ram'];
  for (let i = 0; i < itemsToShow; i++) {
    const ang = rotSpin + (i / 20) * Math.PI * 2;
    const rad = br * (0.2 + (i % 3) * 0.2);
    drawToppingIcon(
      ctx,
      toppingsCycle[i % toppingsCycle.length],
      bx + Math.cos(ang) * rad,
      by + Math.sin(ang) * rad,
      0.95
    );
  }

  // Swirl motion trail during circular mixing stage
  if (bf.stage === 'MIX' && bf.swirlTrail.length >= 2) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 1; i < bf.swirlTrail.length; i++) {
      const t = i / bf.swirlTrail.length;
      ctx.strokeStyle = `rgba(225, 29, 72, ${t * 0.8})`;
      ctx.lineWidth = 4 + t * 8;
      ctx.beginPath();
      ctx.moveTo(bf.swirlTrail[i - 1].x, bf.swirlTrail[i - 1].y);
      ctx.lineTo(bf.swirlTrail[i].x, bf.swirlTrail[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Boss banner & 10s urgency bar
  const barW = Math.min(460, w - 48);
  const barY = layout.counterY + 34;
  drawComicBox(ctx, { x: w * 0.5 - barW * 0.5, y: barY, w: barW, h: 42 }, '#FFF1F2', 10, 3, 3);
  const timePct = Math.max(0, Math.min(1, bf.timeLeft / bf.maxTime));
  ctx.fillStyle = timePct > 0.35 ? '#E11D48' : '#9F1239';
  roundRectPath(ctx, w * 0.5 - barW * 0.5 + 8, barY + 24, (barW - 16) * timePct, 10, 5);
  ctx.fill();

  ctx.font = '800 13px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#9F1239';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `🔥 BOSS THAU KHỔNG LỒ 500K · Còn ${bf.timeLeft.toFixed(1)}s (Thất bại = Hỏng sạch kho!)`,
    w * 0.5,
    barY + 13
  );

  // Stage progress badge inside basin
  const labelW = 280;
  const badgeY = by + br + 14;
  drawComicBox(
    ctx,
    { x: bx - labelW * 0.5, y: badgeY, w: labelW, h: 38 },
    bf.stage === 'DUMP' ? '#FACC15' : '#10B981',
    10,
    3,
    3
  );
  ctx.font = '800 14px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = bf.stage === 'DUMP' ? INK : '#FFFFFF';
  if (bf.stage === 'DUMP') {
    const pulse = 1 + Math.sin(time * 20) * 0.04;
    ctx.save();
    ctx.translate(bx, badgeY + 19);
    ctx.scale(pulse, pulse);
    ctx.fillText(`💥 BẤM LIÊN TỤC ĐỔ MỒI! (${bf.taps}/${bf.targetTaps})`, 0, 0);
    ctx.restore();
  } else {
    const pct = Math.min(100, Math.round((bf.mixAngleAccum / bf.targetMixAngle) * 100));
    ctx.fillText(`🌀 XOAY TRÒN QUANH THAU! (${pct}%)`, bx, badgeY + 19);
  }
}

function renderRippedBagOverlay(ctx: CanvasRenderingContext2D, state: RenderState): void {
  const { width: w, height: h, time } = state;
  const rb = state.rippedBag;

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.fillRect(0, 0, w, h);

  const bannerW = Math.min(560, w - 36);
  drawComicBox(ctx, { x: w * 0.5 - bannerW * 0.5, y: 70, w: bannerW, h: 58 }, '#FFF1F2', 14, 5, 3);
  ctx.font = '800 18px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#E11D48';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `💥 BỤC ĐÁY BỊCH (SLOW-MO)! BẮT ĐỒ RƠI TRONG ${rb.timeLeft.toFixed(1)}s!`,
    w * 0.5,
    90
  );
  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText(
    'Bấm trực tiếp vào từng topping đang rơi! Rớt quả Trứng Cút cuối cùng = Khách bỏ đi!',
    w * 0.5,
    112
  );

  for (const item of rb.items) {
    if (item.caught || item.missed) continue;
    ctx.save();
    ctx.translate(item.x, item.y);

    const pulse = 36 + Math.sin(time * 16 + item.id) * 4;
    ctx.strokeStyle = item.isFinalQuailEgg ? '#E11D48' : '#FACC15';
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = item.isFinalQuailEgg ? 'rgba(225, 29, 72, 0.25)' : 'rgba(250, 204, 21, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(item.rotation);
    drawToppingIcon(ctx, item.toppingId, 0, 0, item.isFinalQuailEgg ? 1.85 : 1.6);
    ctx.restore();

    if (item.isFinalQuailEgg) {
      drawComicBox(ctx, { x: item.x - 58, y: item.y - 62, w: 116, h: 22 }, '#E11D48', 6, 2, 2);
      ctx.font = '800 10px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠️ TRỨNG CUỐI!', item.x, item.y - 51);
    }
  }

  ctx.restore();
}

function drawRaincoatAndTarget(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hasRaincoat: boolean,
  time: number,
  scale: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  if (hasRaincoat) {
    // Translucent bright blue/pink plastic poncho ("Áo mưa nilon")
    ctx.fillStyle = 'rgba(56, 189, 248, 0.72)';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(-26, -54);
    ctx.lineTo(0, -108);
    ctx.lineTo(26, -54);
    ctx.lineTo(42, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 12px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#A7F3D0';
    ctx.textAlign = 'center';
    ctx.fillText('✓ Áo mưa', 0, -118);
  } else {
    const pulse = 1 + Math.sin(time * 14) * 0.08;
    ctx.scale(pulse, pulse);
    drawComicBox(ctx, { x: -58, y: -136, w: 116, h: 28 }, '#FACC15', 8, 2, 2.5);
    ctx.font = '800 12px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#9F1239';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☔ Phát Áo Mưa!', 0, -122);
  }

  ctx.restore();
}

function renderTiktokQteOverlay(ctx: CanvasRenderingContext2D, state: RenderState): void {
  const { width: w, height: h } = state;
  const qte = state.tiktokQte;

  ctx.fillStyle = 'rgba(17, 19, 24, 0.56)';
  ctx.fillRect(0, 0, w, h);

  const cardW = Math.min(460, w - 32);
  const cardH = 220;
  const cardX = w * 0.5 - cardW * 0.5;
  const cardY = h * 0.5 - cardH * 0.5;

  drawComicBox(
    ctx,
    { x: cardX, y: cardY, w: cardW, h: cardH },
    qte.wrongFlash > 0 ? '#FFE4E6' : '#FFFDF5',
    18,
    6,
    4
  );

  ctx.font = '800 20px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#E11D48';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📱 CHIẾN THẦN TÓP TÓP REVIEW!', w * 0.5, cardY + 34);

  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText(
    `Bấm ĐÚNG 4 phím mũi tên trong ${Math.max(0, qte.timeLeft).toFixed(1)}s (Thắng = Viral x3 · Sai = Bóc Phốt!)`,
    w * 0.5,
    cardY + 62
  );

  // 4 arrow boxes
  const rects = getQteArrowRects(w, h);
  const arrowChar: Record<ArrowKey, string> = {
    UP: '↑',
    DOWN: '↓',
    LEFT: '←',
    RIGHT: '→',
  };

  qte.sequence.forEach((key, idx) => {
    const r = rects[idx];
    const done = idx < qte.progressIndex;
    const isCurrent = idx === qte.progressIndex;
    const bg = done ? '#10B981' : isCurrent ? '#FACC15' : '#E2E8F0';
    drawComicBox(ctx, r, bg, 12, isCurrent ? 4 : 2, 3);

    ctx.font = '800 26px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = done ? '#FFFFFF' : INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(arrowChar[key], r.x + r.w * 0.5, r.y + r.h * 0.5);
  });

  // Countdown bar
  const barW = cardW - 60;
  const barX = cardX + 30;
  const barY = cardY + cardH - 36;
  drawComicBox(ctx, { x: barX, y: barY, w: barW, h: 16 }, '#E2E8F0', 8, 0, 2);
  const ratio = Math.max(0, Math.min(1, qte.timeLeft / qte.maxTime));
  if (ratio > 0.02) {
    ctx.fillStyle = ratio > 0.4 ? '#F59E0B' : '#E11D48';
    roundRectPath(ctx, barX + 2, barY + 2, (barW - 4) * ratio, 12, 6);
    ctx.fill();
  }
}

function renderToppingTrays(ctx: CanvasRenderingContext2D, state: RenderState, layout: PrepLayout): void {
  const stockKeys: Partial<Record<ToppingId, RawIngredientId>> = {
    kho_bo: 'kho_bo',
    trung_cut: 'trung_cut',
    xoai: 'xoai',
    rau_ram: 'rau_ram',
  };

  for (const t of TOPPINGS) {
    const rect = layout.trayRects[t.id];
    const count = state.addedToppings[t.id] || 0;
    const need = state.order?.requiredToppings[t.id] ?? 0;
    const stockKey = stockKeys[t.id];
    const stock = stockKey ? state.inventory[stockKey] : null;
    const outOfStock = stock !== null && stock <= 0;
    const cursedLocked = !state.upgrades.cursedMenu && (t.id === 'sau_rieng' || t.id === 'nuoc_cot_dua');
    const hovered = state.hoverTrayId === t.id && !outOfStock && !cursedLocked;
    const trayBg = cursedLocked
      ? '#CBD5E1'
      : outOfStock
      ? '#E2E8F0'
      : count > need
      ? '#FFE4E6'
      : need > 0 && count === need
      ? '#ECFDF5'
      : t.id === 'sau_rieng' || t.id === 'nuoc_cot_dua'
      ? '#FEF9C3'
      : '#F8FAFC';
    const drawRect = hovered ? { ...rect, y: rect.y - 3 } : rect;

    drawComicBox(ctx, drawRect, trayBg, 12, 3, 2.5);

    if (drawRect.w < 112) {
      // Compact Portrait Tray (fits 4-column iPhone/Android thumb grid cleanly)
      drawToppingIcon(ctx, t.id, drawRect.x + drawRect.w * 0.5, drawRect.y + 15, 0.65);

      ctx.font = '800 10px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = cursedLocked || outOfStock ? '#64748B' : INK;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.shortName, drawRect.x + drawRect.w * 0.5, drawRect.y + drawRect.h - 20, drawRect.w - 8);

      ctx.font = '700 10px "JetBrains Mono", monospace';
      if (cursedLocked) {
        ctx.fillStyle = '#7C3AED';
        ctx.fillText('🔒 Hắc Ám', drawRect.x + drawRect.w * 0.5, drawRect.y + drawRect.h - 8, drawRect.w - 8);
      } else {
        ctx.fillStyle = outOfStock
          ? '#E11D48'
          : count > need
          ? '#E11D48'
          : need > 0
          ? '#059669'
          : '#64748B';
        const progressStr = need > 0 ? `${count}/${need}` : `${count}`;
        const stockStr = stock !== null ? (outOfStock ? ' HẾT' : ` (${stock})`) : '';
        ctx.fillText(`${progressStr}${stockStr}`, drawRect.x + drawRect.w * 0.5, drawRect.y + drawRect.h - 8, drawRect.w - 8);
      }
    } else {
      const panRect: Rect = {
        x: drawRect.x + 8,
        y: drawRect.y + 8,
        w: 44,
        h: drawRect.h - 16,
      };
      drawComicBox(ctx, panRect, '#E2E8F0', 7, 0, 2);
      drawToppingIcon(ctx, t.id, panRect.x + panRect.w * 0.5, panRect.y + panRect.h * 0.5, 0.88);

      ctx.font = '800 13px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = cursedLocked || outOfStock ? '#64748B' : INK;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.name, drawRect.x + 58, drawRect.y + drawRect.h * 0.5 - 9, drawRect.w - 64);

      ctx.font = '700 11px "JetBrains Mono", monospace';
      if (cursedLocked) {
        ctx.fillStyle = '#7C3AED';
        ctx.fillText('🔒 Mua Hắc Ám', drawRect.x + 58, drawRect.y + drawRect.h * 0.5 + 10, drawRect.w - 64);
      } else {
        ctx.fillStyle = outOfStock
          ? '#E11D48'
          : count > need
          ? '#E11D48'
          : need > 0
          ? '#059669'
          : '#64748B';
        const progressStr = need > 0 ? `${count}/${need}` : `${count}`;
        const stockStr = stock !== null ? (outOfStock ? ' · HẾT' : ` · Kho:${stock}`) : '';
        ctx.fillText(`${progressStr}${stockStr}`, drawRect.x + 58, drawRect.y + drawRect.h * 0.5 + 10, drawRect.w - 64);
      }
    }
  }
}

function renderCuonStation(ctx: CanvasRenderingContext2D, state: RenderState, layout: PrepLayout): void {
  const { width: w, time } = state;

  if (state.prepStep === 'TOPPINGS' || state.prepStep === 'SEASONING' || state.prepStep === 'ROLLING') {
    drawBambooMat(ctx, layout.matRect);

    const sheetPad = 18;
    const fullX = layout.matRect.x + sheetPad;
    const fullW = layout.matRect.w - sheetPad * 2;
    const fullTop = layout.matRect.y + 14;
    const fullBottom = layout.matRect.y + layout.matRect.h - 14;
    const fullH = fullBottom - fullTop;

    const p = Math.max(0, Math.min(1, state.rollProgress / 100));
    const currentBottom = fullBottom - p * (fullH - 42);
    const currentH = Math.max(12, currentBottom - fullTop);

    if (p < 0.98) {
      drawComicBox(ctx, { x: fullX, y: fullTop, w: fullW, h: currentH }, '#FFFDF2', 12, 2, 2.5);

      ctx.save();
      roundRectPath(ctx, fullX, fullTop, fullW, currentH, 12);
      ctx.clip();
      ctx.strokeStyle = 'rgba(217, 179, 130, 0.35)';
      ctx.lineWidth = 1.5;
      for (let gx = fullX; gx <= fullX + fullW; gx += 16) {
        ctx.beginPath();
        ctx.moveTo(gx, fullTop);
        ctx.lineTo(gx, currentBottom);
        ctx.stroke();
      }
      for (let gy = fullTop; gy <= currentBottom; gy += 16) {
        ctx.beginPath();
        ctx.moveTo(fullX, gy);
        ctx.lineTo(fullX + fullW, gy);
        ctx.stroke();
      }

      for (const ing of state.bowlIngredients) {
        const ix = fullX + fullW * 0.5 + ing.ox * (fullW * 0.36);
        const iy = fullTop + fullH * 0.55 + ing.oy * (fullH * 0.16);
        if (iy < currentBottom + 6) {
          ctx.save();
          ctx.translate(ix, iy);
          ctx.rotate(ing.rotation);
          drawToppingIcon(ctx, ing.id, 0, 0, 0.9);
          ctx.restore();
        }
      }

      if (state.limeMeter.locked || state.chiliMeter.locked) {
        ctx.strokeStyle = state.chiliMeter.locked ? 'rgba(234, 88, 12, 0.65)' : 'rgba(132, 204, 22, 0.6)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(fullX + 24, fullTop + fullH * 0.55);
        ctx.bezierCurveTo(
          fullX + fullW * 0.35,
          fullTop + fullH * 0.45,
          fullX + fullW * 0.65,
          fullTop + fullH * 0.65,
          fullX + fullW - 24,
          fullTop + fullH * 0.52
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    if (p > 0.03) {
      const rollCylH = 22 + p * 34;
      const rollCylY = currentBottom - rollCylH * 0.5;
      drawComicBox(
        ctx,
        { x: fullX - 4, y: rollCylY, w: fullW + 8, h: rollCylH },
        '#FFFDF2',
        rollCylH * 0.48,
        4,
        3
      );

      for (const sideX of [fullX + 8, fullX + fullW - 8]) {
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.ellipse(sideX, rollCylY + rollCylH * 0.5, 6, rollCylH * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#16A34A';
        ctx.beginPath();
        ctx.arc(sideX, rollCylY + rollCylH * 0.5 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#991B1B';
        ctx.beginPath();
        ctx.arc(sideX, rollCylY + rollCylH * 0.5 + 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const ft of state.flyingToppings) {
      const t = ft.progress;
      const arcY = -Math.sin(t * Math.PI) * 55;
      const curX = ft.x + (ft.tx - ft.x) * t;
      const curY = ft.y + (ft.ty - ft.y) * t + arcY;
      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(ft.rotation);
      drawToppingIcon(ctx, ft.id, 0, 0, 1.15);
      ctx.restore();
    }

    if (state.prepStep === 'TOPPINGS') {
      renderToppingTrays(ctx, state, layout);
      drawButton(
        ctx,
        { ...layout.primaryBtn, x: w * 0.5 - layout.primaryBtn.w * 0.5 },
        'Xong Topping · Nêm Gia Vị →',
        '#F59E0B',
        INK,
        state.hoverPrimary
      );
    } else if (state.prepStep === 'SEASONING') {
      renderSeasoningPanel(ctx, state, layout, 'Sang Bước Cuốn Bánh →');
    } else if (state.prepStep === 'ROLLING') {
      const barW = 280;
      const barRect: Rect = {
        x: w * 0.5 - barW * 0.5,
        y: layout.matRect.y - 34,
        w: barW,
        h: 18,
      };
      drawComicBox(ctx, barRect, '#E2E8F0', 8, 2, 2.5);
      if (p > 0.02) {
        ctx.fillStyle = p >= 1 ? '#10B981' : '#F59E0B';
        roundRectPath(ctx, barRect.x + 2, barRect.y + 2, (barRect.w - 4) * p, barRect.h - 4, 6);
        ctx.fill();
      }

      ctx.font = '800 15px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = INK;
      ctx.textAlign = 'center';
      ctx.fillText(
        `Cuộn con lăn chuột hoặc vuốt lên trên mành tre để cuốn (${Math.round(state.rollProgress)}%)`,
        w * 0.5,
        barRect.y - 16
      );

      const arrowOffset = ((time * 45) % 24) - 12;
      ctx.save();
      ctx.translate(w * 0.5, layout.matRect.y + layout.matRect.h * 0.5 - arrowOffset);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(16, 2);
      ctx.lineTo(6, 2);
      ctx.lineTo(6, 18);
      ctx.lineTo(-6, 18);
      ctx.lineTo(-6, 2);
      ctx.lineTo(-16, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      drawButton(ctx, layout.rollBtn, 'Cuốn Nhanh (Hoặc Cuộn Chuột)', '#F59E0B', INK, state.hoverRoll);
    }
  } else {
    // CUTTING step for Bánh Tráng Cuốn: FREE 2D polygon slicing (horizontal, vertical, diagonal!)
    const bw = Math.max(layout.rollRect.w + 84, layout.boardRadius * 2.85);
    const bh = layout.boardRadius * 2.05;
    const boardRect: Rect = {
      x: layout.boardCenterX - bw * 0.5,
      y: layout.boardCenterY - bh * 0.5,
      w: bw,
      h: bh,
    };
    drawComicBox(ctx, boardRect, '#E6C79C', 24, 6, 3);
    ctx.strokeStyle = 'rgba(146, 64, 14, 0.16)';
    ctx.lineWidth = 2;
    for (let gy = boardRect.y + 24; gy < boardRect.y + boardRect.h - 20; gy += 28) {
      ctx.beginPath();
      ctx.moveTo(boardRect.x + 20, gy);
      ctx.lineTo(boardRect.x + boardRect.w - 20, gy);
      ctx.stroke();
    }

    for (const slice of state.slices) {
      drawRicePaperSlice(ctx, slice, true);
    }

    const target = state.order?.targetSlices ?? 4;
    const count = state.slices.length;
    ctx.font = '800 17px "Bricolage Grotesque", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = count === target ? '#059669' : count > target ? '#E11D48' : INK;
    ctx.fillText(
      `Cắt tự do ngang, dọc hoặc chéo thành ${target} khúc (Hiện tại: ${count} khúc)`,
      layout.boardCenterX,
      boardRect.y - 16
    );

    drawButton(ctx, layout.secondaryBtn, 'Cắt Lại', '#FFFFFF', INK, state.hoverSecondary);
    drawButton(
      ctx,
      layout.primaryBtn,
      'Giao Hàng Ngay! (Enter)',
      count === target ? '#10B981' : '#F59E0B',
      count === target ? '#FFFFFF' : INK,
      state.hoverPrimary
    );
  }
}

function renderTronStation(ctx: CanvasRenderingContext2D, state: RenderState, layout: PrepLayout): void {
  const { width: w } = state;

  if (state.prepStep === 'CUTTING') {
    const bw = layout.boardRadius * 2.6;
    const bh = layout.boardRadius * 2.08;
    const boardRect: Rect = {
      x: layout.boardCenterX - bw * 0.5,
      y: layout.boardCenterY - bh * 0.5,
      w: bw,
      h: bh,
    };
    drawComicBox(ctx, boardRect, '#E6C79C', 24, 6, 3);

    ctx.strokeStyle = 'rgba(146, 64, 14, 0.16)';
    ctx.lineWidth = 2;
    for (let gy = boardRect.y + 24; gy < boardRect.y + boardRect.h - 20; gy += 28) {
      ctx.beginPath();
      ctx.moveTo(boardRect.x + 20, gy);
      ctx.lineTo(boardRect.x + boardRect.w - 20, gy);
      ctx.stroke();
    }

    for (const slice of state.slices) {
      drawRicePaperSlice(ctx, slice, false);
    }

    const target = state.order?.targetSlices ?? 4;
    const count = state.slices.length;
    ctx.font = '800 17px "Bricolage Grotesque", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = count === target ? '#059669' : count > target ? '#E11D48' : INK;
    ctx.fillText(
      `Kéo chuột cắt tự do tấm bánh thành ${target} khúc (Hiện tại: ${count} khúc)`,
      layout.boardCenterX,
      boardRect.y - 16
    );

    drawButton(ctx, layout.secondaryBtn, 'Cắt Lại', '#FFFFFF', INK, state.hoverSecondary);
    drawButton(
      ctx,
      layout.primaryBtn,
      'Xong Cắt · Bỏ Topping →',
      count === target ? '#10B981' : '#F59E0B',
      count === target ? '#FFFFFF' : INK,
      state.hoverPrimary
    );
  } else {
    const bx = layout.bowlCenterX + state.bowlShakeOffset.x;
    const by = layout.bowlCenterY + state.bowlShakeOffset.y;
    const br = layout.bowlRadius * state.bowlScale;

    ctx.fillStyle = 'rgba(17, 19, 24, 0.22)';
    ctx.beginPath();
    ctx.arc(bx + 6, by + 8, br, 0, Math.PI * 2);
    ctx.fill();

    const bowlGrad = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, br * 0.1, bx, by, br);
    bowlGrad.addColorStop(0, '#F8FAFC');
    bowlGrad.addColorStop(0.7, '#CBD5E1');
    bowlGrad.addColorStop(1, '#94A3B8');
    ctx.fillStyle = bowlGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = INK;
    ctx.stroke();

    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(bx, by, br * 0.84, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#64748B';
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, by, br * 0.81, 0, Math.PI * 2);
    ctx.clip();

    const isLowCarb = (state.order?.targetSlices ?? 1) === 0;
    const pieceCount = isLowCarb ? 0 : Math.min(8, state.slices.length || 4);
    for (let i = 0; i < pieceCount; i++) {
      const ang = (i / pieceCount) * Math.PI * 2 + state.shakeProgress * 0.08;
      const dist = br * 0.28;
      ctx.save();
      ctx.translate(bx + Math.cos(ang) * dist, by + Math.sin(ang) * dist);
      ctx.rotate(ang + 0.5);
      ctx.fillStyle = state.chiliMeter.locked && state.chiliMeter.value > 25 ? '#FED7AA' : '#FFFDF5';
      roundRectPath(ctx, -22, -12, 44, 24, 4);
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.restore();
    }

    if (isLowCarb && state.bowlIngredients.length === 0) {
      ctx.font = '800 12px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = '#E11D48';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TÔ LOW-CARB', bx, by - 8);
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('(Không bánh tráng)', bx, by + 10);
    }

    for (const ing of state.bowlIngredients) {
      ctx.save();
      ctx.translate(bx + ing.ox * br * 0.65, by + ing.oy * br * 0.65);
      ctx.rotate(ing.rotation + state.shakeProgress * 0.06);
      drawToppingIcon(ctx, ing.id, 0, 0, ing.scale);
      ctx.restore();
    }
    ctx.restore();

    for (const ft of state.flyingToppings) {
      const t = ft.progress;
      const arcY = -Math.sin(t * Math.PI) * 55;
      const curX = ft.x + (ft.tx - ft.x) * t;
      const curY = ft.y + (ft.ty - ft.y) * t + arcY;
      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(ft.rotation);
      drawToppingIcon(ctx, ft.id, 0, 0, 1.15);
      ctx.restore();
    }

    if (state.upgrades.diyMixer) {
      // DIY Automated Mixing Machine clamped onto the bowl!
      ctx.save();
      ctx.translate(bx + br * 0.85, by - br * 0.35);
      drawComicBox(ctx, { x: -24, y: -22, w: 48, h: 44 }, state.diyMalfunctionActive ? '#E11D48' : '#0EA5E9', 8, 2, 2.5);
      ctx.font = '800 9px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText('DIY x2', 0, -4);
      ctx.fillText(state.diyMalfunctionActive ? '⚡ HỎNG' : '⚙️ AUTO', 0, 9);
      ctx.restore();

      if (state.prepStep === 'SHAKING' && !state.diyMalfunctionActive) {
        // Spinning whisk arm inside the bowl
        const spin = state.time * 16;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(spin);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-br * 0.45, 0);
        ctx.lineTo(br * 0.45, 0);
        ctx.moveTo(0, -br * 0.45);
        ctx.lineTo(0, br * 0.45);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (state.diyMalfunctionActive) {
      // Chili sauce splatters across the bowl area during DIY malfunction!
      ctx.fillStyle = 'rgba(220, 38, 38, 0.72)';
      for (let s = 0; s < 6; s++) {
        const ang = s * 1.05;
        ctx.beginPath();
        ctx.arc(bx + Math.cos(ang) * (br * 0.65), by + Math.sin(ang) * (br * 0.65), 14 + (s % 3) * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (state.prepStep === 'TOPPINGS') {
      renderToppingTrays(ctx, state, layout);
      drawButton(
        ctx,
        { ...layout.primaryBtn, x: w * 0.5 - layout.primaryBtn.w * 0.5 },
        'Xong Topping · Nêm Gia Vị →',
        '#F59E0B',
        INK,
        state.hoverPrimary
      );
    } else if (state.prepStep === 'SEASONING') {
      renderSeasoningPanel(ctx, state, layout, 'Sang Bước Lắc Đều →');
    } else if (state.prepStep === 'SHAKING' || state.prepStep === 'READY') {
      const meterW = 280;
      const meterRect: Rect = {
        x: w * 0.5 - meterW * 0.5,
        y: layout.shakeBtn.y - 34,
        w: meterW,
        h: 20,
      };
      drawComicBox(ctx, meterRect, '#E2E8F0', 8, 2, 2.5);
      const p = Math.min(1, state.shakeProgress / 100);
      if (p > 0.02) {
        ctx.fillStyle = p >= 1 ? '#10B981' : '#F59E0B';
        roundRectPath(ctx, meterRect.x + 2, meterRect.y + 2, (meterRect.w - 4) * p, meterRect.h - 4, 6);
        ctx.fill();
      }

      ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = INK;
      ctx.textAlign = 'center';
      ctx.fillText(
        state.prepStep === 'READY'
          ? 'Trộn đều tăm tắp! Giao cho khách ngay!'
          : state.upgrades.diyMixer
          ? '⚙️ Máy Trộn Tự Chế đang tự trộn tốc độ x2 (hoặc bấm phụ)!'
          : 'Bấm liên tục nút Lắc Đều hoặc lắc chuột qua lại trên tô!',
        w * 0.5,
        meterRect.y - 14
      );

      if (state.prepStep === 'SHAKING') {
        drawButton(ctx, layout.shakeBtn, 'Lắc Đều! (Bấm hoặc Lắc Chuột)', '#F59E0B', INK, state.hoverShake);
      } else {
        drawButton(
          ctx,
          { ...layout.primaryBtn, x: w * 0.5 - layout.primaryBtn.w * 0.5 },
          'Giao Hàng Ngay! (Enter)',
          '#10B981',
          '#FFFFFF',
          state.hoverPrimary
        );
      }
    }
  }
}

function renderSeasoningPanel(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  layout: PrepLayout,
  nextLabel: string
): void {
  const { width: w } = state;
  const panelW = layout.limeBarRect.x + layout.limeBarRect.w - layout.limeHoldRect.x + 36;
  const panelH = 192;
  const panelRect: Rect = {
    x: layout.limeHoldRect.x - 18,
    y: layout.limeHoldRect.y - 26,
    w: panelW,
    h: panelH,
  };
  drawComicBox(ctx, panelRect, 'rgba(255, 255, 255, 0.96)', 16, 4, 3);

  drawButton(
    ctx,
    layout.limeHoldRect,
    state.limeMeter.locked ? 'Đã Vắt Chanh' : state.limeMeter.holding ? 'Đang Vắt...' : 'Giữ Vắt Chanh',
    state.limeMeter.locked ? '#A7F3D0' : '#84CC16',
    INK,
    state.limeMeter.holding
  );
  drawPowerBar(ctx, layout.limeBarRect, state.limeMeter, state.order?.limeTarget ?? 'VUA', '#84CC16');

  drawButton(
    ctx,
    layout.chiliHoldRect,
    state.chiliMeter.locked ? 'Đã Rưới Sa Tế' : state.chiliMeter.holding ? 'Đang Rưới...' : 'Giữ Rưới Sa Tế',
    state.chiliMeter.locked ? '#FECACA' : '#F97316',
    INK,
    state.chiliMeter.holding
  );
  drawPowerBar(ctx, layout.chiliBarRect, state.chiliMeter, state.order?.chiliTarget ?? 'VUA', '#EA580C');

  const bothDone = state.limeMeter.locked && state.chiliMeter.locked;
  drawButton(
    ctx,
    { ...layout.primaryBtn, x: w * 0.5 - layout.primaryBtn.w * 0.5 },
    bothDone ? nextLabel : 'Hãy Vắt Chanh & Rưới Sa Tế',
    bothDone ? '#10B981' : '#CBD5E1',
    bothDone ? '#FFFFFF' : '#475569',
    state.hoverPrimary && bothDone,
    !bothDone
  );
}

function renderRaidChase(ctx: CanvasRenderingContext2D, state: RenderState, layout: RaidLayout): void {
  const { width: w, height: h, time } = state;

  // Sidewalk pavement
  ctx.fillStyle = state.raidSituation === 'RAIN' ? '#334155' : '#475569';
  ctx.fillRect(0, 0, w, h);

  const shopColors = ['#B45309', '#0F766E', '#9F1239', '#1D4ED8'];
  const shopLabels = ['TẠP HÓA', 'TRÀ SỮA', 'CƠM TẤM', 'PHỞ BÒ'];
  const shopBlock = 240;
  const shopOffset = state.raidScrollY % (shopBlock * 2);

  for (let sy = -shopBlock * 2; sy < h + shopBlock; sy += shopBlock) {
    const idx = Math.abs(Math.floor((sy + shopBlock * 2) / shopBlock)) % 4;
    const drawY = sy + shopOffset;
    if (layout.roadX > 118) {
      drawComicBox(
        ctx,
        { x: layout.roadX - 118, y: drawY, w: 88, h: 112 },
        shopColors[idx],
        8,
        4,
        2.5
      );
      ctx.font = '800 10px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(shopLabels[idx], layout.roadX - 74, drawY + 55);

      // Parked motorbike on sidewalk
      ctx.fillStyle = '#E11D48';
      roundRectPath(ctx, layout.roadX - 52, drawY + 135, 16, 36, 5);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
    if (w - (layout.roadX + layout.roadW) > 118) {
      const tx = layout.roadX + layout.roadW + 72;
      ctx.fillStyle = '#14532D';
      ctx.beginPath();
      ctx.arc(tx, drawY + 55, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(tx - 6, drawY + 48, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Sidewalk curbs
  const curbW = 24;
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(layout.roadX - curbW, 0, curbW, h);
  ctx.fillRect(layout.roadX + layout.roadW, 0, curbW, h);

  // Asphalt road
  ctx.fillStyle = state.raidSituation === 'RAIN' ? '#161922' : '#1E2028';
  ctx.fillRect(layout.roadX, 0, layout.roadW, h);

  // Scrolling zebra crosswalks every 560px
  const cwPeriod = 560;
  const cwY = (state.raidScrollY % cwPeriod) - 80;
  ctx.fillStyle = 'rgba(248, 250, 252, 0.16)';
  for (let x = layout.roadX + 20; x < layout.roadX + layout.roadW - 30; x += 48) {
    ctx.fillRect(x, cwY, 26, 46);
  }

  // Scrolling yellow/black curb blocks
  const blockH = 44;
  const offset = state.raidScrollY % (blockH * 2);
  for (let y = -blockH * 2; y < h + blockH; y += blockH * 2) {
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(layout.roadX - 10, y + offset, 10, blockH);
    ctx.fillRect(layout.roadX + layout.roadW, y + offset, 10, blockH);
  }

  // Lane dividers
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
  ctx.lineWidth = 4;
  ctx.setLineDash([28, 28]);
  ctx.lineDashOffset = -state.raidScrollY;
  for (let lane = 1; lane < layout.laneCount; lane++) {
    const lx = layout.roadX + lane * layout.laneW;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, h);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Overhead Saigon tangled utility wires scrolling across the alley
  const wirePeriod = 320;
  const wireY = (state.raidScrollY * 1.15) % wirePeriod;
  ctx.strokeStyle = 'rgba(9, 9, 11, 0.55)';
  ctx.lineWidth = 2;
  for (let wy = wireY - wirePeriod; wy < h + 60; wy += wirePeriod) {
    ctx.beginPath();
    ctx.moveTo(layout.roadX - 40, wy);
    ctx.quadraticCurveTo(w * 0.5, wy + 22, layout.roadX + layout.roadW + 40, wy + 4);
    ctx.stroke();
  }

  // Obstacles & pickups
  for (const obs of state.obstacles) {
    drawRaidObstacle(ctx, obs, time);
  }

  // Incoming fast threat lane-top exclamation telegraphs
  for (const obs of state.obstacles) {
    if (obs.y < 10 && (obs.type === 'SHIPPER' || obs.type === 'NINJA_SCOOTER')) {
      const warnX = Math.max(layout.roadX + 24, Math.min(layout.roadX + layout.roadW - 24, obs.x));
      drawComicBox(ctx, { x: warnX - 16, y: 126, w: 32, h: 32 }, '#FACC15', 8, 2, 2.5);
      ctx.font = '800 18px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = '#E11D48';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', warnX, 142);
    }
  }

  // Player Cart ("Xe Bánh Tráng")
  const blinkSkip = state.invulnTimer > 0 && Math.floor(state.invulnTimer * 18) % 2 === 0;
  if (!blinkSkip) {
    ctx.save();
    ctx.translate(state.cartX, layout.cartY + layout.cartH * 0.5);
    ctx.rotate(state.cartLean);

    const cw = layout.cartW;
    const ch = layout.cartH;

    // Speed boost flames & aura
    if (state.boostActiveTimer > 0) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.42)';
      ctx.beginPath();
      ctx.ellipse(0, ch * 0.55, cw * 0.55, 28 + Math.sin(time * 35) * 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Trà Đá Shield Aura
    if (state.shieldTimer > 0) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 4;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, cw * 0.78 + Math.sin(time * 12) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Headlight beam
    const beamGrad = ctx.createLinearGradient(0, -ch * 0.5, 0, -ch * 2.2);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.34)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-cw * 0.25, -ch * 0.5);
    ctx.lineTo(-cw * 0.9, -ch * 2.2);
    ctx.lineTo(cw * 0.9, -ch * 2.2);
    ctx.lineTo(cw * 0.25, -ch * 0.5);
    ctx.closePath();
    ctx.fill();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRectPath(ctx, -cw * 0.5 + 5, -ch * 0.5 + 6, cw, ch, 12);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#09090B';
    ctx.fillRect(-cw * 0.5 - 6, -ch * 0.34, 7, 18);
    ctx.fillRect(cw * 0.5 - 1, -ch * 0.34, 7, 18);
    ctx.fillRect(-cw * 0.5 - 6, ch * 0.16, 7, 18);
    ctx.fillRect(cw * 0.5 - 1, ch * 0.16, 7, 18);

    ctx.fillStyle = state.hitFlashTimer > 0 ? '#FFFFFF' : '#E2E8F0';
    roundRectPath(ctx, -cw * 0.5, -ch * 0.5, cw, ch, 12);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(-cw * 0.22, -ch * 0.24, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(cw * 0.2, -ch * 0.24, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(0, -ch * 0.29, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    roundRectPath(ctx, -cw * 0.45, -6, cw * 0.9, 24, 6);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '800 9px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('XE BÁNH TRÁNG', 0, 6);

    for (let i = 0; i < state.redChairs; i++) {
      drawRedPlasticChair(ctx, -18 + i * 12, ch * 0.36, 0.58, 0);
    }

    const stepCycle = Math.sin(time * (state.boostActiveTimer > 0 ? 34 : 22)) * 5;
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(-10, ch * 0.68 + stepCycle, 6, 0, Math.PI * 2);
    ctx.arc(10, ch * 0.68 - stepCycle, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F97316';
    roundRectPath(ctx, -18, ch * 0.52, 36, 16, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(0, ch * 0.6, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Pursuing Urban Management truck (falls back when Guard is Stunned by a Parry!)
  const stunOffset = state.guardGrab.phase === 'STUNNED' ? -55 : 0;
  const truckY = h - 34 - state.truckSurgeOffset - stunOffset + Math.sin(time * 12) * 3;
  const truckX = w * 0.5 + (state.cartX - w * 0.5) * 0.35;
  ctx.save();
  ctx.translate(truckX, truckY);

  const sirenFlip = Math.floor(time * 10) % 2 === 0;
  ctx.fillStyle = sirenFlip ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(-150, -160);
  ctx.lineTo(150, -160);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1E3A8A';
  roundRectPath(ctx, -82, 0, 164, 62, 12);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();

  ctx.fillStyle = sirenFlip ? '#EF4444' : '#3B82F6';
  ctx.fillRect(-42, 6, 40, 10);
  ctx.fillStyle = sirenFlip ? '#3B82F6' : '#EF4444';
  ctx.fillRect(2, 6, 40, 10);

  ctx.font = '800 11px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('TRẬT TỰ ĐÔ THỊ', 0, 28);

  if (state.guardGrab.phase === 'STUNNED') {
    drawComicBox(ctx, { x: -95, y: -38, w: 190, h: 28 }, '#FEF08A', 8, 2, 2.5);
    ctx.font = '800 12px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#9F1239';
    ctx.fillText(`💫 BỊ CHOÁNG ${state.guardGrab.timer.toFixed(1)}s!`, 0, -24);
  } else if (state.raidSituation === 'TRUCK_SURGE') {
    drawComicBox(ctx, { x: -110, y: -42, w: 220, h: 30 }, '#FFFFFF', 8, 2, 2.5);
    ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#E11D48';
    ctx.fillText('📢 Tấp xe vô lề mau lên!', 0, -27);
  }
  ctx.restore();

  // Feature 2: Urban Guard Grab Telegraph (0.5s Red Flash + Reaching Hand + Parry prompt!)
  if (state.guardGrab.phase === 'TELEGRAPH') {
    const flashAlpha = 0.25 + 0.22 * Math.sin(time * 42);
    ctx.strokeStyle = `rgba(225, 29, 72, ${flashAlpha + 0.5})`;
    ctx.lineWidth = 22;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    const sideDir = state.guardGrab.side === 'LEFT' ? -1 : 1;
    const progress = 1 - Math.max(0, state.guardGrab.timer / Math.max(0.1, state.guardGrab.maxTimer));
    const handX = state.cartX + sideDir * (135 - progress * 85);
    const handY = layout.cartY + layout.cartH * 0.5;

    ctx.save();
    ctx.translate(handX, handY);
    // Reached arm from Urban Guard
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(sideDir * 75, 10);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Grabbing gloved hand + red warning circle
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#FDE6C4';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const pW = Math.min(440, w - 36);
    drawComicBox(ctx, { x: w * 0.5 - pW * 0.5, y: layout.cartY - 82, w: pW, h: 46 }, '#E11D48', 12, 4, 3);
    ctx.font = '800 15px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `⚡ BỊ CHỤP XE (${state.guardGrab.timer.toFixed(2)}s)! VUỐT HOẶC BẤM [W / ↑ / SPACE] PHẢN ĐÒN!`,
      w * 0.5,
      layout.cartY - 59
    );
  }

  // Rain streaks & Speed lines overlay
  if (state.raidSituation === 'RAIN') {
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
    ctx.lineWidth = 2;
    for (let r = 0; r < 45; r++) {
      const rx = ((r * 97 + time * 140) % (w + 60)) - 30;
      const ry = ((r * 173 + time * 980) % (h + 60)) - 30;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 10, ry + 26);
      ctx.stroke();
    }
  }
  if (state.boostActiveTimer > 0) {
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.32)';
    ctx.lineWidth = 3;
    for (let s = 0; s < 14; s++) {
      const sx = layout.roadX + ((s * 61) % layout.roadW);
      const sy = ((s * 131 + time * 1400) % h);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy + 50);
      ctx.stroke();
    }
  }

  // Top Chase Progress Bar & Active Situation Banner
  const progW = Math.min(440, layout.roadW - 24);
  const progX = w * 0.5 - progW * 0.5;
  const progY = 64;
  drawComicBox(ctx, { x: progX, y: progY, w: progW, h: 24 }, '#111318', 10, 2, 2);

  const escapePct = Math.max(0, Math.min(1, 1 - state.raidTimeLeft / Math.max(1, state.raidTotalTime)));
  ctx.fillStyle = '#10B981';
  if (escapePct > 0.02) {
    roundRectPath(ctx, progX + 3, progY + 3, (progW - 6) * escapePct, 18, 7);
    ctx.fill();
  }
  ctx.font = '800 12px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const buffSuffix = [
    state.dailyBuffs.proteinBuff ? '💪 Whey x1.35' : '',
    state.dailyBuffs.landladySpeedBuff ? '🧹 Bà Chủ Nhà +Speed' : '',
    state.freeDodgesLeft > 0 ? `🛵 Air Blade Né Free: ${state.freeDodgesLeft}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  ctx.fillText(
    buffSuffix
      ? `Chạy về Hẻm An Toàn · ${Math.ceil(state.raidTimeLeft)}s (${buffSuffix})`
      : `Đang chạy về Hẻm An Toàn · Còn ${Math.ceil(state.raidTimeLeft)}s`,
    w * 0.5,
    progY + 12
  );

  if (state.raidSituation !== 'NONE' && state.raidSituationText) {
    const sitW = Math.min(500, w - 32);
    drawComicBox(
      ctx,
      { x: w * 0.5 - sitW * 0.5, y: progY + 30, w: sitW, h: 32 },
      '#FEF08A',
      10,
      3,
      2.5
    );
    ctx.font = '800 13px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#9F1239';
    ctx.fillText(state.raidSituationText, w * 0.5, progY + 46);
  }

  // Interactive Boost Button on bottom right
  const ready = state.boostCooldown <= 0;
  const boostLabel =
    state.boostActiveTimer > 0
      ? 'ĐANG BỨT TỐC!'
      : ready
      ? 'Bứt Tốc! (Space)'
      : `Hồi chiêu (${Math.ceil(state.boostCooldown)}s)`;
  drawButton(
    ctx,
    layout.boostBtn,
    boostLabel,
    state.boostActiveTimer > 0 ? '#F97316' : ready ? '#FACC15' : '#94A3B8',
    INK,
    state.hoverBoost && ready,
    !ready && state.boostActiveTimer <= 0
  );
}

function drawRaidObstacle(ctx: CanvasRenderingContext2D, obs: RaidObstacle, time: number): void {
  ctx.save();
  ctx.translate(obs.x, obs.y);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;

  if (obs.type === 'POTHOLE') {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(0, 0, obs.width * 0.58, obs.height * 0.52, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#09090B';
    ctx.beginPath();
    ctx.ellipse(0, 0, obs.width * 0.48, obs.height * 0.42, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748B';
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.ellipse(-4, 2, obs.width * 0.22, obs.height * 0.16, -0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (obs.type === 'PUDDLE') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0, obs.width * 0.52, obs.height * 0.46, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (obs.type === 'BARRIER') {
    // Orange/white construction sawhorse barrier
    drawComicBox(
      ctx,
      { x: -obs.width * 0.5, y: -obs.height * 0.5, w: obs.width, h: obs.height },
      '#F97316',
      6,
      3,
      2.5
    );
    ctx.fillStyle = '#FFFFFF';
    for (let sx = -obs.width * 0.35; sx < obs.width * 0.4; sx += 24) {
      ctx.fillRect(sx, -obs.height * 0.5 + 2, 10, obs.height - 4);
    }
  } else if (obs.type === 'NINJA_SCOOTER') {
    // Teal scooter + floral rider cutting diagonally!
    const angle = Math.atan2(obs.vy, obs.vx) - Math.PI * 0.5;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = '#14B8A6';
    roundRectPath(ctx, -16, -26, 32, 52, 12);
    ctx.fill();
    ctx.stroke();
    // Blinking turn signal
    const blink = Math.floor(time * 10) % 2 === 0;
    ctx.fillStyle = blink ? '#FACC15' : '#713F12';
    ctx.beginPath();
    ctx.arc(-14, -18, 5, 0, Math.PI * 2);
    ctx.fill();
    // Rider sun-hood
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.arc(0, 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (obs.type === 'SHIPPER') {
    // Wrong-way green delivery motorbike
    ctx.fillStyle = '#16A34A';
    roundRectPath(ctx, -16, -24, 32, 48, 10);
    ctx.fill();
    ctx.stroke();
    // Thermal delivery box
    ctx.fillStyle = '#22C55E';
    roundRectPath(ctx, -14, -20, 28, 20, 4);
    ctx.fill();
    ctx.stroke();
    // Helmet
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.arc(0, 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (obs.type === 'DOG') {
    if (obs.vx !== 0 && !obs.dashedCrossed) {
      const dir = Math.sign(obs.vx);
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(dir * 75, 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const wiggle = Math.sin(time * 18 + obs.animPhase) * 3;
    ctx.fillStyle = '#D97706';
    roundRectPath(ctx, -21, -14 + wiggle * 0.3, 42, 26, 10);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.stroke();

    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.arc(-6, -2, 6, 0, Math.PI * 2);
    ctx.fill();

    const headX = obs.vx >= 0 ? 16 : -16;
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(headX, -6 + wiggle * 0.4, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 10px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#FEF08A';
    ctx.textAlign = 'center';
    ctx.fillText('GÂU!', 0, -24);
  } else if (obs.type === 'GOSSIP_LADY') {
    const sway = Math.sin(time * 8 + obs.animPhase) * 3;
    ctx.fillStyle = '#EC4899';
    ctx.beginPath();
    ctx.arc(sway, 0, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(sway - 8, 4, 3, 0, Math.PI * 2);
    ctx.arc(sway + 9, -2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.arc(sway, -8, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F43F5E';
    ctx.fillRect(sway - 12, -16, 7, 5);
    ctx.fillRect(sway + 5, -16, 7, 5);

    ctx.font = '800 9px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#FBCFE8';
    ctx.textAlign = 'center';
    ctx.fillText('NGHE NÓI...', 0, -26);
  } else if (obs.type === 'PICKUP_CHAIR') {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, 28 + Math.sin(time * 8) * 3, 0, Math.PI * 2);
    ctx.fill();
    drawRedPlasticChair(ctx, 0, 0, 1.15, Math.sin(time * 5) * 0.12);
  } else if (obs.type === 'PICKUP_CASH') {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 26 + Math.sin(time * 8) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22C55E';
    roundRectPath(ctx, -19, -11, 38, 22, 4);
    ctx.fill();
    ctx.stroke();
    ctx.font = '800 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('20K', 0, 0);
  } else if (obs.type === 'PICKUP_SHIELD') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
    ctx.beginPath();
    ctx.arc(0, 0, 28 + Math.sin(time * 8) * 3, 0, Math.PI * 2);
    ctx.fill();
    // Iced Tea glass
    ctx.fillStyle = '#BAE6FD';
    roundRectPath(ctx, -11, -14, 22, 28, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#D97706';
    ctx.fillRect(-9, -4, 18, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-6, -10, 6, 6);
    ctx.fillRect(1, -8, 6, 6);
  }

  ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = obs.type.startsWith('PICKUP')
    ? '#A7F3D0'
    : obs.type === 'PUDDLE'
    ? '#BAE6FD'
    : '#FCA5A5';
  ctx.fillText(obs.label, 0, obs.height * 0.5 + 4);

  ctx.restore();
}

function renderParticlesAndCallouts(ctx: CanvasRenderingContext2D, state: RenderState): void {
  for (const p of state.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    if (p.shape === 'chair') {
      drawRedPlasticChair(ctx, 0, 0, p.size / 14, 0);
    } else if (p.shape === 'bill') {
      const w = p.size * 2.1;
      const h = p.size * 1.15;
      drawComicBox(ctx, { x: -w * 0.5, y: -h * 0.5, w, h }, p.color, 3, 1.5, 2);
      ctx.font = '800 9px "JetBrains Mono", monospace';
      ctx.fillStyle = INK;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₫', 0, 0.5);
    } else if (p.shape === 'coin') {
      ctx.fillStyle = p.color;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(-p.size * 0.18, -p.size * 0.18, p.size * 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'rect') {
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size * 0.65);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size * 0.65);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  for (const fc of state.flyingCash) {
    if (fc.delay > 0) continue;
    const t = Math.max(0, Math.min(1, fc.progress));
    const ease = 1 - Math.pow(1 - t, 2.2);
    const x = fc.sx + (fc.tx - fc.sx) * ease;
    const y = fc.sy + (fc.ty - fc.sy) * ease - Math.sin(t * Math.PI) * fc.arcHeight;
    const scale = 1.15 - t * 0.25;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(fc.rotation);
    ctx.scale(scale, scale);

    if (fc.kind === 'BILL') {
      const billColors: Record<number, { bg: string; stripe: string; text: string }> = {
        1: { bg: '#EAE3C8', stripe: '#A8A29E', text: '#292524' },
        2: { bg: '#E2E8F0', stripe: '#94A3B8', text: '#1E293B' },
        5: { bg: '#CFFAFE', stripe: '#22D3EE', text: '#164E63' },
        10: { bg: '#FEF3C7', stripe: '#F59E0B', text: '#78350F' },
        20: { bg: '#DBEAFE', stripe: '#3B82F6', text: '#1E3A8A' },
        50: { bg: '#FCE7F3', stripe: '#EC4899', text: '#831843' },
      };
      const pal = billColors[fc.denomK] ?? billColors[10];
      // Fluttering banknote rectangle
      const flutterY = 1 + Math.sin(t * Math.PI * 5 + fc.vRot) * 0.14;
      ctx.scale(1, flutterY);
      drawComicBox(ctx, { x: -24, y: -13, w: 48, h: 26 }, pal.bg, 4, 2, 2.2);
      ctx.fillStyle = pal.stripe;
      ctx.fillRect(-18, -9, 10, 18);
      ctx.font = '800 11px "JetBrains Mono", monospace';
      ctx.fillStyle = pal.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${fc.denomK}k`, 7, 1);
    } else {
      // Spinning golden coin with shine
      const spinScaleX = Math.max(0.28, Math.abs(Math.cos(t * Math.PI * 4 + fc.rotation)));
      ctx.scale(spinScaleX, 1);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(-2, -2, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '800 11px "Bricolage Grotesque", sans-serif';
      ctx.fillStyle = '#92400E';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₫', 0, 1);
    }

    ctx.restore();
  }

  for (const c of state.callouts) {
    const t = c.life / c.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 2);
    ctx.translate(c.x, c.y);
    ctx.scale(c.scale, c.scale);

    ctx.font = '800 22px "Bricolage Grotesque", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = INK;
    ctx.strokeText(c.text, 0, 0);
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, 0, 0);

    if (c.subtext) {
      ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
      ctx.lineWidth = 3.5;
      ctx.strokeText(c.subtext, 0, 22);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(c.subtext, 0, 22);
    }
    ctx.restore();
  }
}

function renderWuxiaCombat(ctx: CanvasRenderingContext2D, state: RenderState): void {
  const { width: w, height: h, time, wuxiaCombat: wc } = state;
  const groundY = h * 0.72;

  // Dramatic Wuxia night alley sky gradient + neon Saigon haze
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#090D16');
  bgGrad.addColorStop(0.55, '#1E1B4B');
  bgGrad.addColorStop(1, '#111827');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Full moon behind rooftop silhouettes
  ctx.save();
  ctx.fillStyle = 'rgba(254, 240, 138, 0.16)';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.28, 128, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FEF08A';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.28, 72, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Rooftop alley silhouettes
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, groundY - 95, w * 0.24, 95);
  ctx.fillRect(w * 0.76, groundY - 110, w * 0.24, 110);

  // Comic asphalt stage floor
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();

  // Subtle martial speed lines in background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const ly = 110 + i * 48;
    const offset = ((time * 220 + i * 70) % (w + 200)) - 100;
    ctx.beginPath();
    ctx.moveTo(offset, ly);
    ctx.lineTo(offset + 90, ly);
    ctx.stroke();
  }

  // Top Duel Banner (between top bar & fighters)
  const bannerW = Math.min(540, w - 40);
  drawComicBox(
    ctx,
    { x: w * 0.5 - bannerW * 0.5, y: 72, w: bannerW, h: 48 },
    '#FEF08A',
    12,
    4,
    3
  );
  ctx.font = '800 16px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = '#9F1239';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `⚔️ VÕ HIỆP VỈA HÈ · ĐOẠT LẠI HŨ TIỀN BO (${wc.stolenTipJar.toLocaleString('vi-VN')}đ)!`,
    w * 0.5,
    96
  );

  // Player Martial Chef (left)
  const px = wc.playerX;
  const py = groundY;
  const isBlocking = wc.blockTimer > 0;
  const isDodging = wc.dodgeTimer > 0;
  const isSlashing = wc.slashAnimTimer > 0;

  ctx.save();
  ctx.translate(px, py - (isDodging ? 18 : 0));
  if (isDodging) {
    ctx.globalAlpha = 0.65;
    ctx.rotate(-0.24);
  }
  if (wc.playerHitFlash > 0) {
    ctx.translate((Math.random() - 0.5) * 10, 0);
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 38, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flowing martial apron/cape
  ctx.fillStyle = wc.playerHitFlash > 0 ? '#FCA5A5' : '#F59E0B';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  roundRectPath(ctx, -28, -94, 56, 74, 14);
  ctx.fill();
  ctx.stroke();

  // Chef martial bandana & head
  ctx.fillStyle = '#FDE6C4';
  ctx.beginPath();
  ctx.arc(0, -118, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#E11D48';
  roundRectPath(ctx, -26, -135, 52, 12, 5);
  ctx.fill();
  ctx.stroke();
  // Headband fluttering tails
  const tailWave = Math.sin(time * 12) * 8;
  ctx.beginPath();
  ctx.moveTo(-25, -130);
  ctx.lineTo(-48, -124 + tailWave);
  ctx.lineTo(-44, -114 + tailWave);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Determined eyes
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(6, -118, 3, 0, Math.PI * 2);
  ctx.arc(17, -118, 3, 0, Math.PI * 2);
  ctx.fill();

  // Ice Tongs Sword ("Kiếm Kẹp Gắp Đá")
  ctx.save();
  ctx.translate(22, -62);
  ctx.rotate(isSlashing ? 0.95 : isBlocking ? -0.35 : -0.75);
  ctx.fillStyle = '#CBD5E1';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  roundRectPath(ctx, -5, -72, 10, 76, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(-2, -68, 4, 58);
  ctx.restore();

  // Parry Shield Aura when Blocking
  if (isBlocking) {
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(16, -78, 66, -Math.PI * 0.48, Math.PI * 0.48);
    ctx.stroke();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.beginPath();
    ctx.arc(16, -78, 66, -Math.PI * 0.48, Math.PI * 0.48);
    ctx.fill();
  }

  // Slash Crescent Arc
  if (isSlashing) {
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(46, -74, 72, -Math.PI * 0.42, Math.PI * 0.35);
    ctx.stroke();
  }
  ctx.restore();

  // Thief ("Đạo Chích Hũ Tiền") on the right
  const tx = wc.thiefX;
  const ty = groundY;
  const isTelegraph = wc.thiefIntent === 'TELEGRAPH';
  const isStunned = wc.thiefIntent === 'STUNNED';

  ctx.save();
  ctx.translate(tx, ty);
  if (wc.thiefHitFlash > 0) {
    ctx.translate((Math.random() - 0.5) * 12, -4);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 38, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark bandit outfit
  ctx.fillStyle = wc.thiefHitFlash > 0 ? '#FDA4AF' : '#312E81';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  roundRectPath(ctx, -26, -92, 52, 72, 14);
  ctx.fill();
  ctx.stroke();

  // Masked head
  ctx.fillStyle = '#1E1B4B';
  ctx.beginPath();
  ctx.arc(0, -116, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FDE6C4';
  roundRectPath(ctx, -18, -124, 30, 12, 5);
  ctx.fill();
  ctx.fillStyle = '#E11D48';
  ctx.beginPath();
  ctx.arc(-9, -118, 2.8, 0, Math.PI * 2);
  ctx.arc(2, -118, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Stolen Tip Jar clutched by Thief
  ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
  roundRectPath(ctx, 18, -74, 26, 32, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(22, -62, 18, 12);
  ctx.font = '800 10px "JetBrains Mono", monospace';
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TIP', 31, -56);

  // Red "!" Telegraph or Stunned stars
  if (isTelegraph) {
    const pulse = 1 + Math.sin(time * 28) * 0.16;
    ctx.save();
    ctx.translate(0, -162);
    ctx.scale(pulse, pulse);
    drawComicBox(ctx, { x: -46, y: -16, w: 92, h: 30 }, '#E11D48', 8, 2, 2.5);
    ctx.font = '800 13px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('⚠️ ĐỠ / NÉ!', 0, -1);
    ctx.restore();
  } else if (isStunned) {
    ctx.font = '800 16px "Bricolage Grotesque", sans-serif';
    ctx.fillStyle = '#FACC15';
    ctx.fillText('💫 CHOÁNG!', 0, -156);
  }
  ctx.restore();

  // Flying Rice Paper Shurikens ("Phi Tiêu Bánh Tráng")
  for (const sh of wc.projectiles) {
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(sh.rotation);
    ctx.fillStyle = '#FEF3C7';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17);
      ctx.lineTo(Math.cos(a + 0.45) * 6, Math.sin(a + 0.45) * 6);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Status banner above ground
  ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.textAlign = 'center';
  ctx.fillText(wc.statusText, w * 0.5, groundY + 26);
}
