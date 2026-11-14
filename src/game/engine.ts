import { GameAudio } from './audio';
import { DayManager } from './dayManager';
import { createInitialRicePaper, createInitialRollPolygon, splitPolygonBySegment } from './geometry';
import { Haptics } from './haptics';
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
  pointInRect,
} from './layout';
import {
  computeMarketPrices,
  drawTarotCard as drawRandomStreetTarotCard,
  ELEMENT_META,
  evaluateBaziIngredientMatch,
  generateCustomerOrder,
  getTarotOptionsForCard,
  HEARTBROKEN_QUESTIONS,
  pickTarotSpread,
  resolveTarotInterpretation,
  rollDailyHexagram,
  rollNewspaperEvent,
  SEASONING_RANGE,
  TOPPING_MAP,
  TOPPINGS,
} from './orders';
import { renderGameFrame, type RenderState } from './renderer';
import cookingBackdropUrl from '../assets/images/cooking_saigon_backdrop_1794650756811.jpg';
import type {
  ArrowKey,
  BaziReadingState,
  BossFightState,
  BowlIngredient,
  CheckoutState,
  CityCrisis,
  CityDistrictId,
  CityTycoonState,
  CustomerOrder,
  CustomerType,
  DailyBuffs,
  DailyHexagram,
  DayPnlSummary,
  DishType,
  DiyMalfunctionState,
  FallingBagItem,
  FloatingCallout,
  FlowRhythmNote,
  FlowRhythmState,
  FlyingCashItem,
  FlyingTopping,
  GameHudSnapshot,
  GameScreenState,
  GuardGrabState,
  InventoryState,
  LandladyState,
  LotterySellerState,
  MarketPrices,
  NewspaperEvent,
  ObstacleType,
  Particle,
  PlayPhase,
  Point2D,
  PolygonSlice,
  PrepStep,
  RaidObstacle,
  RaidSituation,
  RawIngredientId,
  RippedBagState,
  RoomHuntersOption,
  RoomHuntersState,
  SaigonRainState,
  SeasoningLevel,
  SeasoningMeter,
  ShopItemId,
  ShopUpgrades,
  SquadCrisisType,
  TarotDialogueTone,
  TarotState,
  TiktokQteState,
  ToppingId,
  TycoonLogEntry,
  TycoonPolicyId,
  VehicleLevel,
  WaitingCustomer,
  WireColorId,
  WuxiaCombatState,
} from './types';

function emptyToppings(): Record<ToppingId, number> {
  return {
    kho_bo: 0,
    trung_cut: 0,
    xoai: 0,
    rau_ram: 0,
    pho_mai: 0,
    tran_chau: 0,
    sau_rieng: 0,
    nuoc_cot_dua: 0,
  };
}

function emptyInventory(): InventoryState {
  return {
    banh_trang: 0,
    kho_bo: 0,
    trung_cut: 0,
    xoai: 0,
    rau_ram: 0,
    tac: 0,
  };
}

function freshDailyBuffs(): DailyBuffs {
  return {
    luckyCharm: false,
    proteinBuff: false,
    landladySpeedBuff: false,
    karmaBuff: false,
  };
}

function freshBaziReading(): BaziReadingState {
  return {
    active: false,
    acknowledged: false,
    profile: null,
    customerLabel: '',
  };
}

function freshTarot(): TarotState {
  return {
    active: false,
    stage: 'PICK_CARD',
    customerLabel: '',
    question: '',
    cardPool: [],
    drawnCard: null,
    options: [],
    chosenTone: null,
    outcomeKind: null,
    tipEarned: 0,
    customerLeft: false,
    resultMessage: '',
    upgradedToCombo: false,
  };
}

function freshDayPnl(day = 1): DayPnlSummary {
  return {
    day,
    revenue: 0,
    ingredientCosts: 0,
    rentCost: 25000,
    finesCost: 0,
    loanInterestCost: 0,
    lotteryWin: 0,
    lotteryTickets: 0,
    netProfit: 0,
    ordersCompleted: 0,
    closedEarlyReason: '',
  };
}

function freshMeter(): SeasoningMeter {
  return {
    value: 0,
    direction: 1,
    holding: false,
    locked: false,
    resultLabel: null,
    accuracy: 0,
  };
}

function freshUpgrades(): ShopUpgrades {
  return {
    depToOng: false,
    loaKeoKeo: false,
    gheBatTu: false,
    ledRgb: false,
    cursedMenu: false,
    diyMixer: false,
  };
}

function freshQte(): TiktokQteState {
  return {
    active: false,
    sequence: [],
    progressIndex: 0,
    timeLeft: 0,
    maxTime: 3.0,
    wrongFlash: 0,
  };
}

function freshRain(): SaigonRainState {
  return {
    active: false,
    timeLeft: 0,
    maxTime: 3.0,
    activeCustomerHasRaincoat: false,
  };
}

function freshRippedBag(): RippedBagState {
  return {
    active: false,
    timeLeft: 0,
    maxTime: 2.0,
    items: [],
  };
}

function freshLandlady(): LandladyState {
  return {
    active: false,
    sweeping: false,
    x: 0,
    y: 0,
    bribed: false,
    timer: 0,
  };
}

function freshLotterySeller(): LotterySellerState {
  return {
    active: false,
    x: 0,
    y: 0,
    dir: 1,
    boughtThisPass: false,
  };
}

function freshBossFight(): BossFightState {
  return {
    active: false,
    stage: 'DUMP',
    taps: 0,
    targetTaps: 50,
    mixAngleAccum: 0,
    targetMixAngle: Math.PI * 10,
    timeLeft: 10.0,
    maxTime: 10.0,
    lastPointerAngle: null,
    swirlTrail: [],
  };
}

function freshFlowRhythm(): FlowRhythmState {
  return {
    active: false,
    elapsed: 0,
    beatInterval: 0.54,
    lastBeatIndex: -1,
    notes: [],
    hitsPerfect: 0,
    hitsGood: 0,
    missed: 0,
    combo: 0,
    lastJudgmentText: '',
    lastJudgmentColor: '#FACC15',
    lastJudgmentTimer: 0,
    laneFlashTimers: [0, 0, 0, 0],
    finishingTimer: 0,
  };
}

function freshGuardGrab(): GuardGrabState {
  return {
    phase: 'IDLE',
    timer: 0,
    maxTimer: 0.5,
    cooldown: 4.2,
    side: 'LEFT',
    parryFlash: 0,
  };
}

function freshRoomHunters(): RoomHuntersState {
  return {
    active: false,
    customerLabel: '',
    promptText: '',
  };
}

function freshDiyMalfunction(): DiyMalfunctionState {
  return {
    active: false,
    timeLeft: 0,
    maxTime: 4.5,
    leftOrder: ['RED', 'YELLOW', 'BLUE'],
    rightOrder: ['BLUE', 'RED', 'YELLOW'],
    selectedLeftColor: null,
    connected: [],
    wrongFlash: 0,
  };
}

function freshCheckout(): CheckoutState {
  return {
    active: false,
    customerLabel: '',
    customerType: 'STUDENT',
    dishType: 'TRON',
    billK: 0,
    paidK: 0,
    paidBills: [],
    expectedChangeK: 0,
    givenChangeK: 0,
    selectedBills: [],
    timeLeft: 0,
    maxTime: 5.0,
    pendingMoney: 0,
    pendingXu: 0,
    pendingScore: 0,
    viralMult: 1,
    isTricky: false,
    discount2kAvailable: false,
    discountAccepted: false,
    isCursedTrend: false,
    isMasterpiece: false,
  };
}

const DISTRICT_RATE: Record<
  CityDistrictId,
  { name: string; ratePerMember: number; heatPerSec: number; traffic: string; risk: string }
> = {
  CONG_VIEN: { name: 'Công Viên 23/9', ratePerMember: 180, heatPerSec: 0.7, traffic: 'Trung bình', risk: 'Thấp' },
  NGA_TU: { name: 'Ngã Tư Hàng Xanh', ratePerMember: 240, heatPerSec: 1.3, traffic: 'Cao', risk: 'Trung bình' },
  DAI_HOC: { name: 'Hồ Con Rùa', ratePerMember: 270, heatPerSec: 1.5, traffic: 'Rất đông', risk: 'Trung bình' },
  CHO_BEN_THANH: { name: 'Chợ Bến Thành', ratePerMember: 330, heatPerSec: 2.2, traffic: 'Cực đông', risk: 'Cao' },
  PHO_DI_BO: { name: 'Phố Đi Bộ Nguyễn Huệ', ratePerMember: 390, heatPerSec: 2.8, traffic: 'Đỉnh điểm', risk: 'Rất cao' },
};

function computeTycoonIncome(
  squads: CityTycoonState['squads'],
  upgradeLevel = 1,
  activePolicy: TycoonPolicyId = 'NONE'
): number {
  const upgradeMult = 1 + (upgradeLevel - 1) * 0.25;
  const policyMult = activePolicy === 'OVERDRIVE' ? 1.35 : activePolicy === 'TEA_BREAK' ? 0.75 : 1.0;
  let total = 0;
  for (const sq of squads) {
    if (!sq.districtId || sq.status === 'IDLE' || sq.status === 'ARRESTED') continue;
    const rate = DISTRICT_RATE[sq.districtId].ratePerMember;
    const moraleFactor = 0.6 + (sq.morale / 100) * 0.6;
    const statusFactor = sq.status === 'CRISIS' ? 0.25 : 1.0;
    total += sq.members * rate * moraleFactor * statusFactor * upgradeMult * policyMult;
  }
  return Math.round(total);
}

function freshCityTycoon(): CityTycoonState {
  const squads: CityTycoonState['squads'] = [
    { id: 'sq1', name: 'Tổ 1 · Bạch Tuộc', color: '#10B981', members: 4, districtId: 'CONG_VIEN', morale: 90, stamina: 92, status: 'DEPLOYED' },
    { id: 'sq2', name: 'Tổ 2 · Săn Đèn Đỏ', color: '#F59E0B', members: 4, districtId: 'NGA_TU', morale: 85, stamina: 88, status: 'DEPLOYED' },
    { id: 'sq3', name: 'Tổ 3 · Sinh Viên', color: '#38BDF8', members: 4, districtId: null, morale: 90, stamina: 100, status: 'IDLE' },
    { id: 'sq4', name: 'Tổ 4 · Cơ Động', color: '#EC4899', members: 4, districtId: null, morale: 88, stamina: 100, status: 'IDLE' },
  ];
  return {
    squads,
    totalStaff: 16,
    passiveIncomePerSec: computeTycoonIncome(squads, 1, 'NONE'),
    totalEarned: 0,
    heatLevel: 18,
    upgradeLevel: 1,
    activePolicy: 'NONE',
    crises: [],
    eventFeed: [
      { id: -1, text: 'Kéo thả Tổ 3 & Tổ 4 vào Hồ Con Rùa hoặc Phố Đi Bộ để tăng thu nhập!', tone: 'INFO', timeStr: '00:00' },
      { id: -2, text: 'Tổ 1 & Tổ 2 đang bán đều tay tại Công Viên 23/9 & Hàng Xanh.', tone: 'PROFIT', timeStr: '00:00' },
    ],
    lastTickLog: 'Kéo thả thẻ Tổ Đội vào các điểm nóng trên bản đồ Sài Gòn!',
  };
}

function freshWuxiaCombat(): WuxiaCombatState {
  return {
    active: false,
    playerHp: 100,
    maxPlayerHp: 100,
    thiefHp: 100,
    maxThiefHp: 100,
    playerX: 300,
    thiefX: 900,
    thiefIntent: 'IDLE',
    thiefIntentTimer: 1.4,
    shurikenCd: 0,
    meleeCd: 0,
    blockTimer: 0,
    blockCd: 0,
    dodgeTimer: 0,
    dodgeCd: 0,
    slashAnimTimer: 0,
    thiefHitFlash: 0,
    playerHitFlash: 0,
    stolenTipJar: 35000,
    projectiles: [],
    statusText: 'Dùng Phi Tiêu (J), Kiếm Kẹp Đá (K), Đỡ Đòn (L) hoặc Né (Space)!',
  };
}

const SHOP_COSTS: Record<ShopItemId, number> = {
  dep_to_ong: 500,
  cursed_menu: 600,
  ghe_bat_tu: 800,
  diy_mixer: 900,
  loa_keo_keo: 1000,
  led_rgb: 1500,
};

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audio = new GameAudio();
  private onHudChange: (snapshot: GameHudSnapshot) => void;
  private backdropImg: HTMLImageElement | null = null;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private time = 0;
  private width = 1280;
  private height = 720;
  private dpr = 1;
  private idSeq = 1;

  // Screen & Phase
  private screen: GameScreenState = 'TITLE_MENU';
  private phase: PlayPhase = 'COOKING';
  private dishType: DishType = 'CUON';
  private prepStep: PrepStep = 'TOPPINGS';
  private shopOpen = false;

  // Economy & Stats
  private money = 120000;
  private xu = 0;
  private score = 0;
  private ordersServed = 0;
  private perfectOrders = 0;
  private raidsSurvived = 0;
  private redChairs = 3;
  private maxRedChairs = 4;
  private combo = 0;
  private gameOverReason = '';
  private upgrades: ShopUpgrades = freshUpgrades();

  // Mechanic 7, 8, 9: Day/Night Tycoon, Inventory, VIPs & Garage
  private day = 1;
  private dayDuration = 180; // Default 3 minutes (customizable; 0 = Endless)
  private dayTimeLeft = 180;
  private dayElapsedTime = 0;
  private inventory: InventoryState = emptyInventory();
  private newspaper: NewspaperEvent = rollNewspaperEvent(1);
  private marketPrices: MarketPrices = computeMarketPrices(this.newspaper);
  private vehicleLevel: VehicleLevel = 1;
  private dailyBuffs: DailyBuffs = freshDailyBuffs();
  private freeDodgesLeft = 0;
  private vipsRemainingToday: CustomerType[] = [];
  private dayRevenue = 0;
  private dayIngredientSpend = 0;
  private dayRentCost = 25000;
  private dayFinesCost = 0;
  private dayOrdersCompleted = 0;
  private dayPnl: DayPnlSummary = freshDayPnl(1);
  private endOfDayPending = false;
  private dayManager = new DayManager();
  private dayBannerTimer = 0;
  private dayBannerText = '';
  private perMinuteRaidCheckTimer = 15;

  // Active Order & Customer Queue
  private order: CustomerOrder | null = null;
  private waitingCustomers: WaitingCustomer[] = [];
  private customerSpawnDelay = 0;
  private viralOrdersLeft = 0;
  private bocPhotTimer = 0;
  private tiktokQte: TiktokQteState = freshQte();
  private rainEvent: SaigonRainState = freshRain();
  private rainCooldownTimer = 16;
  private checkout: CheckoutState = freshCheckout();
  private checkoutFinishTimer = 0;
  private raidChanceBonus = 0;
  private policeHeat = 0; // 0..100%
  private ruinedBagBlocking = false;
  private badRepOrdersLeft = 0;
  private recordingPhoneTimer = 0;
  private yellingTimer = 0;
  private sauceSplatterWipes = 0;

  private slices: PolygonSlice[] = [];
  private swipeTrail: Point2D[] = [];
  private isSwiping = false;
  private activeCutAnchor: Point2D | null = null;
  private lastSwipePoint: Point2D | null = null;

  // Bánh Tráng Cuốn rolling state
  private rollProgress = 0;
  private isRollingDrag = false;
  private lastRollDragY = 0;
  private rollSoundCooldown = 0;

  private addedToppings: Record<ToppingId, number> = emptyToppings();
  private bowlIngredients: BowlIngredient[] = [];
  private flyingToppings: FlyingTopping[] = [];
  private flyingCash: FlyingCashItem[] = [];

  private limeMeter: SeasoningMeter = freshMeter();
  private chiliMeter: SeasoningMeter = freshMeter();
  private squeezeTickTimer = 0;

  private shakeProgress = 0;
  private bowlShakeOffset: Point2D = { x: 0, y: 0 };
  private bowlScale = 1;
  private lastMouseShakePos: Point2D | null = null;
  private lastMouseShakeTime = 0;
  private violentShakeHeat = 0;
  private shakeSoundCooldown = 0;

  // 5 Advanced Mechanics States
  private rippedBag: RippedBagState = freshRippedBag();
  private rippedBagTriggeredThisOrder = false;
  private landlady: LandladyState = freshLandlady();
  private landladyCooldown = 18;
  private lotterySeller: LotterySellerState = freshLotterySeller();
  private lotteryCooldown = 12;
  private lotteryTicketsToday = 0;
  private bossFight: BossFightState = freshBossFight();
  private bossFightRolledToday = false;
  private nextDayOneStarCount = 0;
  private spawnPenaltyPercentToday = 0;
  private sickCustomerTimer = 0;

  // 5 High-Level Action, Rhythm & Business Features
  private flowPerfectCount = 0;
  private flowRhythm: FlowRhythmState = freshFlowRhythm();
  private guardGrab: GuardGrabState = freshGuardGrab();
  private parrySwipeOrigin: Point2D | null = null;
  private roomHunters: RoomHuntersState = freshRoomHunters();
  private diyMalfunction: DiyMalfunctionState = freshDiyMalfunction();
  private loanDebt = 0;
  private thugsActive = false;
  private loanModalOpen = false;

  // 3 New Major Mechanics: Elemental Hexagram, City Map Tycoon (16 Staff), Wuxia Street Combat
  private dailyHexagram: DailyHexagram = rollDailyHexagram(1);
  private cityTycoon: CityTycoonState = freshCityTycoon();
  private tycoonIncomeBuffer = 0;
  private tycoonCrisisTimer = 10.0;
  private tycoonProfitLogTimer = 6.0;
  private tycoonElapsed = 0;
  private wuxiaCombat: WuxiaCombatState = freshWuxiaCombat();

  // Street Fortune Teller Mode: Bazi Reading & Gen Z Tarot
  private baziReading: BaziReadingState = freshBaziReading();
  private tarot: TarotState = freshTarot();
  private nextFortuneToggle: 'BAZI' | 'TAROT' = 'BAZI';

  // Raid State & Dynamic Event Director
  private ordersSinceRaid = 0;
  private raidWarningTimer = 0;
  private raidTotalTime = 20;
  private raidTimeLeft = 0;
  private raidScrollY = 0;
  private raidSpawnTimer = 0;
  private raidSituation: RaidSituation = 'NONE';
  private raidSituationText = '';
  private raidSituationTimer = 0;
  private nextSituationTimer = 3.2;
  private cartX = 640;
  private cartLean = 0;
  private pointerDragRoad = false;
  private targetPointerCartX: number | null = null;
  private invulnTimer = 0;
  private hitFlashTimer = 0;
  private hitstopTimer = 0;
  private boostActiveTimer = 0;
  private boostCooldown = 0;
  private shieldTimer = 0;
  private slipTimer = 0;
  private slipVx = 0;
  private truckSurgeOffset = 0;
  private obstacles: RaidObstacle[] = [];

  // Juice
  private particles: Particle[] = [];
  private callouts: FloatingCallout[] = [];
  private shakeIntensity = 0;
  private shakeX = 0;
  private shakeY = 0;

  // Input state (multi-touch + pointer)
  private heldKeys = new Set<string>();
  private hoverPos: Point2D = { x: -999, y: -999 };
  private lastHudHash = '';
  private activeTouches = new Map<
    number,
    {
      anchorPt: Point2D;
      lastPt: Point2D;
      lastTime: number;
      isSwiping: boolean;
      isRollingDrag: boolean;
      pointerDragRoad: boolean;
      parryOrigin: Point2D | null;
      lastBossAngle: number | null;
    }
  >();
  private limeTouchId: number | null = null;
  private chiliTouchId: number | null = null;

  private resizeObserver: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement, onHudChange: (snapshot: GameHudSnapshot) => void) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
    this.onHudChange = onHudChange;

    const img = new Image();
    img.src = cookingBackdropUrl;
    this.backdropImg = img;

    this.handleResize();
    this.bindEvents();
    this.emitHud(true);
    this.startLoop();
  }

  private nextId = (): number => {
    this.idSeq += 1;
    return this.idSeq;
  };

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);
    window.visualViewport?.addEventListener('resize', this.handleResize);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Native Touch API for zero-latency iOS/mobile swiping & multi-touch
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });

    // Pointer API for mouse & stylus
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);

    if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  public destroy(): void {
    this.audio.stopBgm();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);
    window.visualViewport?.removeEventListener('resize', this.handleResize);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);

    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);

    this.resizeObserver?.disconnect();
  }

  private handleResize = (): void => {
    const parent = this.canvas.parentElement;
    const rect = parent
      ? parent.getBoundingClientRect()
      : { width: window.innerWidth, height: window.innerHeight };
    const nextW = Math.max(320, Math.floor(rect.width || window.innerWidth));
    const nextH = Math.max(320, Math.floor(rect.height || window.innerHeight));
    const prevW = this.width || nextW;
    const prevH = this.height || nextH;

    this.width = nextW;
    this.height = nextH;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Re-center active rice paper slices cleanly on orientation/resize changes
    if (this.slices.length > 0 && (prevW !== nextW || prevH !== nextH)) {
      const prevLayout = computePrepLayout(prevW, prevH);
      const nextLayout = computePrepLayout(nextW, nextH);
      const dx = nextLayout.boardCenterX - prevLayout.boardCenterX;
      const dy = nextLayout.boardCenterY - prevLayout.boardCenterY;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        this.slices = this.slices.map((s) => ({
          ...s,
          points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
        }));
      }
    }

    const raidLayout = computeRaidLayout(this.width, this.height);
    const minX = raidLayout.roadX + raidLayout.cartW * 0.5 + 10;
    const maxX = raidLayout.roadX + raidLayout.roadW - raidLayout.cartW * 0.5 - 10;
    this.cartX = Math.max(minX, Math.min(maxX, this.cartX || this.width * 0.5));
  };

  private handleWindowBlur = (): void => {
    this.heldKeys.clear();
    this.activeTouches.clear();
    this.limeTouchId = null;
    this.chiliTouchId = null;
    this.isSwiping = false;
    this.activeCutAnchor = null;
    this.isRollingDrag = false;
    this.pointerDragRoad = false;
    this.limeMeter.holding = false;
    this.chiliMeter.holding = false;
  };

  public startNewGame(): void {
    this.audio.unlock();
    this.screen = 'MORNING_PREP';
    this.phase = 'COOKING';
    this.shopOpen = false;
    this.money = 120000; // Vốn khởi nghiệp ngày đầu
    this.xu = 0;
    this.score = 0;
    this.ordersServed = 0;
    this.perfectOrders = 0;
    this.raidsSurvived = 0;
    this.maxRedChairs = 4;
    this.redChairs = 3;
    this.combo = 0;
    this.ordersSinceRaid = 0;
    this.gameOverReason = '';
    this.upgrades = freshUpgrades();

    this.day = 1;
    this.dayManager.recalculate(1);
    this.dayBannerTimer = 0;
    this.dayBannerText = '';
    this.perMinuteRaidCheckTimer = 15;
    this.dayTimeLeft = this.dayDuration;
    this.dayElapsedTime = 0;
    this.inventory = emptyInventory();
    this.newspaper = rollNewspaperEvent(1);
    this.marketPrices = computeMarketPrices(this.newspaper);
    this.vehicleLevel = 1;
    this.dailyBuffs = freshDailyBuffs();
    this.freeDodgesLeft = 0;
    this.vipsRemainingToday = [];
    this.dayRevenue = 0;
    this.dayIngredientSpend = 0;
    this.dayFinesCost = 0;
    this.dayOrdersCompleted = 0;
    this.dayPnl = freshDayPnl(1);
    this.endOfDayPending = false;

    this.order = null;
    this.waitingCustomers = [];
    this.customerSpawnDelay = 0;
    this.viralOrdersLeft = 0;
    this.bocPhotTimer = 0;
    this.tiktokQte = freshQte();
    this.rainEvent = freshRain();
    this.rainCooldownTimer = 14 + Math.random() * 10;
    this.checkout = freshCheckout();
    this.checkoutFinishTimer = 0;
    this.raidChanceBonus = 0;
    this.policeHeat = 0;
    this.ruinedBagBlocking = false;
    this.badRepOrdersLeft = 0;
    this.recordingPhoneTimer = 0;
    this.yellingTimer = 0;
    this.sauceSplatterWipes = 0;

    this.rippedBag = freshRippedBag();
    this.rippedBagTriggeredThisOrder = false;
    this.landlady = freshLandlady();
    this.landladyCooldown = 16;
    this.lotterySeller = freshLotterySeller();
    this.lotteryCooldown = 10;
    this.lotteryTicketsToday = 0;
    this.bossFight = freshBossFight();
    this.bossFightRolledToday = false;
    this.baziReading = freshBaziReading();
    this.tarot = freshTarot();
    this.nextDayOneStarCount = 0;
    this.spawnPenaltyPercentToday = 0;
    this.sickCustomerTimer = 0;

    this.flowPerfectCount = 0;
    this.flowRhythm = freshFlowRhythm();
    this.guardGrab = freshGuardGrab();
    this.parrySwipeOrigin = null;
    this.roomHunters = freshRoomHunters();
    this.diyMalfunction = freshDiyMalfunction();
    this.loanDebt = 0;
    this.thugsActive = false;
    this.loanModalOpen = false;
    this.dailyHexagram = rollDailyHexagram(1);
    this.wuxiaCombat = freshWuxiaCombat();

    this.particles = [];
    this.callouts = [];
    this.obstacles = [];
    this.flyingCash = [];
    this.heldKeys.clear();

    this.emitHud(true);
  }

  private getMaxStockPerItem(): number {
    return this.vehicleLevel === 3 ? 35 : this.vehicleLevel === 2 ? 25 : 12;
  }

  private hasEnoughIngredientsToOperate(): boolean {
    const totalToppings =
      this.inventory.kho_bo + this.inventory.trung_cut + this.inventory.xoai + this.inventory.rau_ram;
    return this.inventory.banh_trang >= 1 && this.inventory.tac >= 1 && totalToppings >= 2;
  }

  public buyIngredient(id: RawIngredientId, qty = 1): boolean {
    if (this.screen !== 'MORNING_PREP') return false;
    this.audio.unlock();
    const maxCap = this.getMaxStockPerItem();
    const room = Math.max(0, maxCap - this.inventory[id]);
    const price = this.marketPrices[id];
    const maxAffordable = Math.floor(this.money / price);
    const actualQty = Math.min(qty, room, maxAffordable);
    if (actualQty <= 0) return false;

    const cost = actualQty * price;
    this.money -= cost;
    this.dayIngredientSpend += cost;
    this.inventory[id] += actualQty;
    this.audio.playPickup();
    this.emitHud(true);
    return true;
  }

  public buyRecommendedStock(): void {
    if (this.screen !== 'MORNING_PREP') return;
    this.audio.unlock();
    const maxCap = this.getMaxStockPerItem();
    const targetPerItem = Math.min(maxCap, 8);
    const orderIds: RawIngredientId[] = ['banh_trang', 'tac', 'kho_bo', 'trung_cut', 'xoai', 'rau_ram'];

    let boughtAny = false;
    for (let round = 0; round < targetPerItem; round++) {
      let progressThisRound = false;
      for (const id of orderIds) {
        if (this.inventory[id] < targetPerItem) {
          const price = this.marketPrices[id];
          if (this.money >= price) {
            this.money -= price;
            this.dayIngredientSpend += price;
            this.inventory[id] += 1;
            boughtAny = true;
            progressThisRound = true;
          }
        }
      }
      if (!progressThisRound) break;
    }

    if (boughtAny) {
      this.audio.playCashChing();
      this.emitHud(true);
    }
  }

  public takeEmergencyLoan(): void {
    if (this.screen !== 'MORNING_PREP') return;
    if (this.hasEnoughIngredientsToOperate()) return;
    this.audio.unlock();
    this.money += 80000;
    this.dayFinesCost += 15000; // Phí lãi vay nóng tính vào chi phí cuối ngày
    this.audio.playPickup();
    this.emitHud(true);
  }

  public startDayShift(): boolean {
    if (this.screen !== 'MORNING_PREP') return false;
    if (!this.hasEnoughIngredientsToOperate()) return false;
    this.audio.unlock();

    this.screen = 'PLAYING';
    this.phase = 'COOKING';
    this.dayManager.recalculate(this.day);
    this.dayBannerTimer = 2.8;
    this.dayBannerText = this.dayManager.getDayFlashText();
    this.perMinuteRaidCheckTimer = 15;
    this.dayTimeLeft = this.dayDuration;
    this.dayElapsedTime = 0;
    this.endOfDayPending = false;
    this.dailyBuffs = freshDailyBuffs();
    this.freeDodgesLeft = this.vehicleLevel >= 3 ? 1 : 0;

    // Shuffle 3 Special VIPs for this day
    const vips: CustomerType[] = ['FENG_SHUI', 'GYM_BRO', 'REAL_ESTATE'];
    for (let i = vips.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [vips[i], vips[j]] = [vips[j], vips[i]];
    }
    this.vipsRemainingToday = vips;

    this.waitingCustomers = [];
    this.customerSpawnDelay = 0;
    this.rainEvent = freshRain();
    this.rainCooldownTimer = 16 + Math.random() * 12;
    this.tiktokQte = freshQte();
    this.checkout = freshCheckout();
    this.checkoutFinishTimer = 0;
    this.bocPhotTimer = 0;
    this.ruinedBagBlocking = false;
    this.recordingPhoneTimer = 0;
    this.yellingTimer = 0;
    this.sauceSplatterWipes = 0;
    this.rippedBag = freshRippedBag();
    this.landlady = freshLandlady();
    this.landladyCooldown = 14 + Math.random() * 10;
    this.lotterySeller = freshLotterySeller();
    this.lotteryCooldown = 9 + Math.random() * 8;
    this.lotteryTicketsToday = 0;
    this.bossFight = freshBossFight();
    this.bossFightRolledToday = false;
    this.sickCustomerTimer = 0;
    this.flowRhythm = freshFlowRhythm();
    this.guardGrab = freshGuardGrab();
    this.roomHunters = freshRoomHunters();
    this.diyMalfunction = freshDiyMalfunction();
    this.baziReading = freshBaziReading();
    this.tarot = freshTarot();
    this.loanModalOpen = false;

    this.fillWaitingQueue();
    this.spawnNextOrder(false);
    this.audio.playDropTopping();
    this.lastTimestamp = performance.now();
    this.emitHud(true);
    return true;
  }

  public upgradeVehicle(): boolean {
    if (this.screen !== 'END_OF_DAY' && this.screen !== 'MORNING_PREP') return false;
    this.audio.unlock();
    if (this.vehicleLevel === 1) {
      if (this.money < 5000) return false;
      this.money -= 5000;
      this.vehicleLevel = 2;
      this.audio.playRaidWin();
      this.emitHud(true);
      return true;
    } else if (this.vehicleLevel === 2) {
      if (this.money < 15000) return false;
      this.money -= 15000;
      this.vehicleLevel = 3;
      this.freeDodgesLeft = 1;
      this.audio.playRaidWin();
      this.emitHud(true);
      return true;
    }
    return false;
  }

  public startNextDay(): void {
    if (this.screen !== 'END_OF_DAY') return;
    this.audio.unlock();
    this.day += 1;
    this.dayManager.advanceDay();
    this.dayBannerTimer = 0;
    this.dayBannerText = '';
    this.dayTimeLeft = this.dayDuration;
    this.dayElapsedTime = 0;
    this.dayRevenue = 0;
    this.dayIngredientSpend = 0;
    this.dayFinesCost = 0;
    this.dayOrdersCompleted = 0;
    this.lotteryTicketsToday = 0;
    this.endOfDayPending = false;
    this.dailyBuffs = freshDailyBuffs();
    this.freeDodgesLeft = this.vehicleLevel >= 3 ? 1 : 0;
    // Apply 1-star food poisoning reviews from yesterday (-20% customer spawn rate per review, capped at 60%)
    this.spawnPenaltyPercentToday = Math.min(60, this.nextDayOneStarCount * 20);
    this.nextDayOneStarCount = 0;

    if (this.redChairs < 2) {
      this.redChairs = 2; // Sáng hôm sau mượn tạm thêm ghế đủ bán
    }
    this.newspaper = rollNewspaperEvent(this.day);
    this.marketPrices = computeMarketPrices(this.newspaper);
    this.dailyHexagram = rollDailyHexagram(this.day);
    this.screen = 'MORNING_PREP';
    this.phase = 'COOKING';
    this.order = null;
    this.waitingCustomers = [];
    this.audio.playPickup();
    this.emitHud(true);
  }

  private endCurrentDay(closedEarlyReason: string): void {
    if (this.screen === 'END_OF_DAY' || this.screen === 'GAME_OVER') return;

    // Mechanic 3: Draw Lottery Tickets (2% chance per ticket to win 500,000 VND!)
    let lotteryWin = 0;
    for (let i = 0; i < this.lotteryTicketsToday; i++) {
      if (Math.random() < 0.02) {
        lotteryWin += 500000;
      }
    }
    if (lotteryWin > 0) {
      this.money += lotteryWin;
      this.dayRevenue += lotteryWin;
    }

    // Feature 5: Loan Shark Daily Interest (25% per day, min 5,000 VND)
    let loanInterestCost = 0;
    if (this.loanDebt > 0) {
      const interestDue = Math.max(5000, Math.round((this.loanDebt * 0.25) / 1000) * 1000);
      if (this.money >= interestDue) {
        this.money -= interestDue;
        loanInterestCost = interestDue;
        this.thugsActive = false;
      } else {
        // Cannot pay interest -> 2 Thug NPCs spawn and block half the screen (-50% customer spawn rate)!
        this.thugsActive = true;
      }
    } else {
      this.thugsActive = false;
    }

    const deductions = this.dayRentCost + this.dayFinesCost;
    this.money = Math.max(0, this.money - deductions);
    this.dayPnl = {
      day: this.day,
      revenue: this.dayRevenue,
      ingredientCosts: this.dayIngredientSpend,
      rentCost: this.dayRentCost,
      finesCost: this.dayFinesCost,
      loanInterestCost,
      lotteryWin,
      lotteryTickets: this.lotteryTicketsToday,
      netProfit: this.dayRevenue - this.dayIngredientSpend - this.dayRentCost - this.dayFinesCost - loanInterestCost,
      ordersCompleted: this.dayOrdersCompleted,
      closedEarlyReason,
    };
    this.order = null;
    this.waitingCustomers = [];
    this.checkout = freshCheckout();
    this.tiktokQte = freshQte();
    this.rainEvent = freshRain();
    this.rippedBag = freshRippedBag();
    this.landlady = freshLandlady();
    this.lotterySeller = freshLotterySeller();
    this.bossFight = freshBossFight();
    this.flowRhythm = freshFlowRhythm();
    this.roomHunters = freshRoomHunters();
    this.diyMalfunction = freshDiyMalfunction();
    this.loanModalOpen = false;
    this.isSwiping = false;
    this.activeCutAnchor = null;
    this.isRollingDrag = false;
    this.limeMeter.holding = false;
    this.chiliMeter.holding = false;
    this.screen = 'END_OF_DAY';
    this.phase = 'COOKING';
    if (lotteryWin > 0) {
      this.audio.playCashChing();
    } else {
      this.audio.playRaidWin();
    }
    this.emitHud(true);
  }

  public togglePause(): void {
    if (this.screen === 'PLAYING') {
      this.screen = 'PAUSED';
      this.shopOpen = false;
      this.heldKeys.clear();
      this.isSwiping = false;
      this.activeCutAnchor = null;
      this.isRollingDrag = false;
      this.limeMeter.holding = false;
      this.chiliMeter.holding = false;
      this.emitHud(true);
    } else if (this.screen === 'PAUSED') {
      this.screen = 'PLAYING';
      this.lastTimestamp = performance.now();
      this.emitHud(true);
    }
  }

  public setDayDuration(seconds: number): void {
    const normalized = seconds <= 0 ? 0 : Math.max(60, Math.min(3600, Math.round(seconds)));
    this.dayDuration = normalized;
    if (this.screen === 'PAUSED' || this.screen === 'PLAYING') {
      if (normalized === 0) {
        this.dayTimeLeft = 0;
        this.endOfDayPending = false;
      } else {
        this.dayTimeLeft = Math.max(10, normalized - this.dayElapsedTime);
        this.endOfDayPending = false;
      }
    } else {
      this.dayTimeLeft = normalized;
    }
    this.emitHud(true);
  }

  public closeShopNow(): void {
    if (this.screen !== 'PLAYING' && this.screen !== 'PAUSED') return;
    this.audio.unlock();
    this.endCurrentDay('Chủ quán chủ động chốt sổ đóng ca.');
  }

  public returnToTitle(): void {
    this.screen = 'TITLE_MENU';
    this.shopOpen = false;
    this.loanModalOpen = false;
    this.heldKeys.clear();
    this.emitHud(true);
  }

  public openCityTycoon(): void {
    this.audio.unlock();
    this.screen = 'CITY_TYCOON';
    this.shopOpen = false;
    this.loanModalOpen = false;
    this.lastTimestamp = performance.now();
    this.emitHud(true);
  }

  public closeCityTycoon(): void {
    this.screen = 'TITLE_MENU';
    this.emitHud(true);
  }

  private pushTycoonFeed(text: string, tone: TycoonLogEntry['tone']): void {
    const sec = Math.floor(this.tycoonElapsed);
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    const entry: TycoonLogEntry = {
      id: this.nextId(),
      text,
      tone,
      timeStr: `${m}:${s}`,
    };
    this.cityTycoon.eventFeed = [entry, ...this.cityTycoon.eventFeed].slice(0, 18);
    this.cityTycoon.lastTickLog = text;
  }

  public assignSquadDistrict(squadId: string, districtId: CityDistrictId | null): void {
    this.audio.unlock();
    const sq = this.cityTycoon.squads.find((s) => s.id === squadId);
    if (!sq) return;
    if (sq.status === 'ARRESTED') {
      this.pushTycoonFeed(`🚨 ${sq.name} đang bị tạm giữ! Hãy bấm "Bảo Lãnh" để chuộc đội!`, 'ALERT');
      this.audio.playServeFail();
      this.emitHud(true);
      return;
    }
    if (sq.status === 'CRISIS') {
      this.pushTycoonFeed(`⚠️ ${sq.name} đang gặp sự cố truy quét! Xử lý sự cố trước!`, 'ALERT');
      this.audio.playServeFail();
      this.emitHud(true);
      return;
    }

    if (districtId === null) {
      if (sq.status === 'IDLE') return;
      sq.districtId = null;
      sq.status = 'IDLE';
      this.cityTycoon.passiveIncomePerSec = computeTycoonIncome(
        this.cityTycoon.squads,
        this.cityTycoon.upgradeLevel,
        this.cityTycoon.activePolicy
      );
      this.pushTycoonFeed(`☕ ${sq.name} đã thu quân về nghỉ ngơi hồi thể lực.`, 'INFO');
      this.audio.playDropTopping();
      this.emitHud(true);
      return;
    }

    if (sq.stamina < 12) {
      this.pushTycoonFeed(`🥵 ${sq.name} kiệt sức (${Math.round(sq.stamina)}%), cần nghỉ hồi thể lực!`, 'ALERT');
      this.audio.playServeFail();
      this.emitHud(true);
      return;
    }

    // If another deployed squad occupies this node, swap it cleanly back to IDLE (unless in crisis)
    const occupant = this.cityTycoon.squads.find(
      (other) => other.id !== sq.id && other.districtId === districtId
    );
    if (occupant) {
      if (occupant.status === 'CRISIS') {
        this.pushTycoonFeed(`⚠️ ${DISTRICT_RATE[districtId].name} đang bị phong tỏa do sự cố!`, 'ALERT');
        this.audio.playServeFail();
        this.emitHud(true);
        return;
      }
      occupant.districtId = null;
      occupant.status = 'IDLE';
    }

    sq.districtId = districtId;
    sq.status = 'DEPLOYED';
    this.cityTycoon.passiveIncomePerSec = computeTycoonIncome(
      this.cityTycoon.squads,
      this.cityTycoon.upgradeLevel,
      this.cityTycoon.activePolicy
    );
    this.pushTycoonFeed(`🛵 ${sq.name} đã chốt vị trí tại ${DISTRICT_RATE[districtId].name}!`, 'PROFIT');
    this.audio.playPickup();
    this.emitHud(true);
  }

  public transferSquadMember(fromSquadId: string, toSquadId: string): void {
    if (fromSquadId === toSquadId) return;
    const fromSq = this.cityTycoon.squads.find((s) => s.id === fromSquadId);
    const toSq = this.cityTycoon.squads.find((s) => s.id === toSquadId);
    if (!fromSq || !toSq || fromSq.members <= 1 || toSq.members >= 8) return;
    this.audio.unlock();
    fromSq.members -= 1;
    toSq.members += 1;
    this.cityTycoon.passiveIncomePerSec = computeTycoonIncome(
      this.cityTycoon.squads,
      this.cityTycoon.upgradeLevel,
      this.cityTycoon.activePolicy
    );
    this.pushTycoonFeed(`👥 Điều 1 nhân sự từ ${fromSq.name} sang ${toSq.name}.`, 'INFO');
    this.audio.playDropTopping();
    this.emitHud(true);
  }

  public resolveCityCrisis(crisisId: number, action: 'BUDGET' | 'BACKUP' | 'BRIBE' | 'FLEE'): void {
    const idx = this.cityTycoon.crises.findIndex((c) => c.id === crisisId);
    if (idx === -1) return;
    const crisis = this.cityTycoon.crises[idx];
    const sq = this.cityTycoon.squads.find((s) => s.id === crisis.squadId);

    if (action === 'BUDGET' || action === 'BRIBE') {
      if (this.money < crisis.budgetCost) {
        this.pushTycoonFeed(`❌ Không đủ ${crisis.budgetCost.toLocaleString('vi-VN')}đ để dàn xếp!`, 'ALERT');
        this.audio.playServeFail();
        this.emitHud(true);
        return;
      }
      this.money -= crisis.budgetCost;
      this.cityTycoon.heatLevel = Math.max(0, this.cityTycoon.heatLevel - 15);
      if (sq) {
        sq.morale = Math.min(100, sq.morale + 8);
        sq.status = sq.districtId ? 'DEPLOYED' : 'IDLE';
      }
      this.pushTycoonFeed(
        `💵 Chi ${crisis.budgetCost.toLocaleString('vi-VN')}đ dàn xếp xong "${crisis.title}" (-15% Heat)!`,
        'PROFIT'
      );
      this.audio.playCashChing();
    } else {
      // FLEE / BACKUP: Safely pull the squad off the node back to IDLE
      if (sq) {
        sq.districtId = null;
        sq.status = 'IDLE';
        sq.stamina = Math.max(10, sq.stamina - 15);
      }
      this.cityTycoon.heatLevel = Math.max(0, this.cityTycoon.heatLevel - 6);
      this.pushTycoonFeed(`💨 ${sq ? sq.name : 'Tổ đội'} bỏ chạy rút lui an toàn khỏi ${DISTRICT_RATE[crisis.districtId].name}!`, 'INFO');
      this.audio.playDodgeWhoosh();
    }

    this.cityTycoon.crises.splice(idx, 1);
    this.cityTycoon.passiveIncomePerSec = computeTycoonIncome(
      this.cityTycoon.squads,
      this.cityTycoon.upgradeLevel,
      this.cityTycoon.activePolicy
    );
    this.emitHud(true);
  }

  public upgradeTycoonNetwork(): boolean {
    if (this.cityTycoon.upgradeLevel >= 5) return false;
    const cost = this.cityTycoon.upgradeLevel * 15000;
    if (this.money < cost) {
      this.audio.playServeFail();
      this.pushTycoonFeed(`❌ Cần ${cost.toLocaleString('vi-VN')}đ để nâng cấp đội xe!`, 'ALERT');
      this.emitHud(true);
      return false;
    }
    this.audio.unlock();
    this.money -= cost;
    this.cityTycoon.upgradeLevel += 1;
    this.cityTycoon.passiveIncomePerSec = computeTycoonIncome(
      this.cityTycoon.squads,
      this.cityTycoon.upgradeLevel,
      this.cityTycoon.activePolicy
    );
    this.pushTycoonFeed(
      `⬆️ Nâng cấp Chuỗi Xe Cấp ${this.cityTycoon.upgradeLevel} (+25% thu nhập & giảm hao thể lực)!`,
      'PROFIT'
    );
    this.audio.playRaidWin();
    this.emitHud(true);
    return true;
  }

  public setTycoonPolicy(policy: TycoonPolicyId): void {
    this.audio.unlock();
    this.cityTycoon.activePolicy = policy;
    this.cityTycoon.passiveIncomePerSec = computeTycoonIncome(
      this.cityTycoon.squads,
      this.cityTycoon.upgradeLevel,
      this.cityTycoon.activePolicy
    );
    const labelMap: Record<TycoonPolicyId, string> = {
      NONE: 'Bình thường (Cân bằng)',
      OVERDRIVE: 'Tăng Tốc Bán Hàng (+35% Thu Nhập, +Heat)',
      BRIBE_PATROL: 'Ngoại Giao Vỉa Hè (-45% Tốc độ tăng Heat)',
      TEA_BREAK: 'Uống Trà Tắc Dưỡng Sức (Hồi thể lực cực nhanh)',
    };
    this.pushTycoonFeed(`📜 Đổi chính sách: ${labelMap[policy]}`, 'INFO');
    this.audio.playPickup();
    this.emitHud(true);
  }

  public bailOutArrestedSquads(): boolean {
    const arrested = this.cityTycoon.squads.filter((s) => s.status === 'ARRESTED');
    if (arrested.length === 0) return false;
    const finePerSquad = 18000;
    const totalCost = arrested.length * finePerSquad;
    if (this.money < totalCost) {
      this.audio.playServeFail();
      this.pushTycoonFeed(`❌ Cần ${totalCost.toLocaleString('vi-VN')}đ tiền phạt để bảo lãnh ${arrested.length} tổ đội!`, 'ALERT');
      this.emitHud(true);
      return false;
    }
    this.audio.unlock();
    this.money -= totalCost;
    for (const sq of arrested) {
      sq.status = 'IDLE';
      sq.districtId = null;
      sq.stamina = 75;
    }
    this.cityTycoon.heatLevel = Math.max(0, this.cityTycoon.heatLevel - 18);
    this.pushTycoonFeed(
      `🔓 Đóng phạt ${totalCost.toLocaleString('vi-VN')}đ bảo lãnh thành công ${arrested.length} tổ đội!`,
      'PROFIT'
    );
    this.audio.playCashChing();
    this.emitHud(true);
    return true;
  }

  private updateCityTycoon(dt: number): void {
    this.tycoonElapsed += dt;

    // 1. Stamina Drain (Deployed) & Recovery (Idle) + Heat Level dynamics
    const drainMult =
      Math.max(0.55, 1 - (this.cityTycoon.upgradeLevel - 1) * 0.1) *
      (this.cityTycoon.activePolicy === 'OVERDRIVE'
        ? 1.3
        : this.cityTycoon.activePolicy === 'TEA_BREAK'
        ? 0.5
        : 1.0);
    const recoverRate = this.cityTycoon.activePolicy === 'TEA_BREAK' ? 11.0 : 5.5;

    let heatDelta = -1.1; // Passive natural cooldown
    for (const sq of this.cityTycoon.squads) {
      if ((sq.status === 'DEPLOYED' || sq.status === 'CRISIS') && sq.districtId) {
        sq.stamina = Math.max(0, sq.stamina - 2.2 * drainMult * dt);
        heatDelta += DISTRICT_RATE[sq.districtId].heatPerSec;
        if (sq.stamina <= 0 && sq.status === 'DEPLOYED') {
          const oldDistrict = DISTRICT_RATE[sq.districtId].name;
          sq.status = 'IDLE';
          sq.districtId = null;
          this.pushTycoonFeed(`🥵 ${sq.name} hết thể lực tại ${oldDistrict}, tự động rút về nghỉ!`, 'INFO');
        }
      } else if (sq.status === 'IDLE') {
        sq.stamina = Math.min(100, sq.stamina + recoverRate * dt);
      }
    }

    if (heatDelta > 0) {
      if (this.cityTycoon.activePolicy === 'OVERDRIVE') heatDelta *= 1.35;
      if (this.cityTycoon.activePolicy === 'BRIBE_PATROL') heatDelta *= 0.55;
    }
    this.cityTycoon.heatLevel = Math.max(0, Math.min(100, this.cityTycoon.heatLevel + heatDelta * dt));

    // 2. Passive Income accumulation
    this.cityTycoon.passiveIncomePerSec = computeTycoonIncome(
      this.cityTycoon.squads,
      this.cityTycoon.upgradeLevel,
      this.cityTycoon.activePolicy
    );
    this.tycoonIncomeBuffer += this.cityTycoon.passiveIncomePerSec * dt;
    if (this.tycoonIncomeBuffer >= 100) {
      const payout = Math.floor(this.tycoonIncomeBuffer / 100) * 100;
      this.tycoonIncomeBuffer -= payout;
      this.money += payout;
      this.cityTycoon.totalEarned += payout;
    }

    // 3. Periodic Profit Notifications
    this.tycoonProfitLogTimer -= dt;
    if (this.tycoonProfitLogTimer <= 0) {
      this.tycoonProfitLogTimer = 6.5;
      const deployed = this.cityTycoon.squads.filter((s) => s.status === 'DEPLOYED' && s.districtId);
      if (deployed.length > 0) {
        const pick = deployed[Math.floor(Math.random() * deployed.length)];
        const dName = pick.districtId ? DISTRICT_RATE[pick.districtId].name : '';
        this.pushTycoonFeed(`💰 ${pick.name} đang hốt bạc tại ${dName}!`, 'PROFIT');
      }
    }

    // 4. Countdown active crises (5 seconds window -> Arrested if ignored!)
    for (let i = this.cityTycoon.crises.length - 1; i >= 0; i--) {
      const c = this.cityTycoon.crises[i];
      c.timeLeft -= dt;
      if (c.timeLeft <= 0) {
        const sq = this.cityTycoon.squads.find((s) => s.id === c.squadId);
        if (sq) {
          sq.status = 'ARRESTED';
          sq.districtId = null;
          sq.morale = Math.max(30, sq.morale - 20);
        }
        this.pushTycoonFeed(
          `🚔 BỎ QUA SỰ CỐ! ${sq ? sq.name : 'Tổ đội'} đã bị TẠM GIỮ, ngừng thu nhập!`,
          'ALERT'
        );
        this.audio.playServeFail();
        this.cityTycoon.crises.splice(i, 1);
      }
    }

    // 5. Random Crises every ~10 seconds (targeting deployed squads)
    this.tycoonCrisisTimer -= dt;
    if (this.tycoonCrisisTimer <= 0) {
      const heatFactor = this.cityTycoon.heatLevel >= 70 ? 0.72 : 1.0;
      this.tycoonCrisisTimer = 10.0 * heatFactor;
      const deployedTargets = this.cityTycoon.squads.filter(
        (s) => s.status === 'DEPLOYED' && s.districtId !== null
      );
      if (deployedTargets.length > 0 && this.cityTycoon.crises.length < 2) {
        const sq = deployedTargets[Math.floor(Math.random() * deployedTargets.length)];
        if (sq.districtId) {
          const types: SquadCrisisType[] = ['TURF_WAR', 'CONFISCATED', 'LOW_STOCK'];
          const type = types[Math.floor(Math.random() * types.length)];
          const dName = DISTRICT_RATE[sq.districtId].name;
          const crisisMap: Record<SquadCrisisType, { title: string; desc: string; cost: number; pen: number }> = {
            CONFISCATED: {
              title: `Trật Tự Đô Thị ập vào (${dName})`,
              desc: `${sq.name} đang bị đội Trật Tự vây bắt! Bấm vào điểm đỏ để xử lý trong 5 giây!`,
              cost: 12000,
              pen: 18000,
            },
            TURF_WAR: {
              title: `Tranh Chấp Vỉa Hè (${dName})`,
              desc: `${sq.name} bị băng xe đẩy đối thủ gây sự! Dàn xếp ngay kẻo bị hốt xe!`,
              cost: 9000,
              pen: 15000,
            },
            LOW_STOCK: {
              title: `Cháy Hàng Khô Bò (${dName})`,
              desc: `${sq.name} hết hàng giữa lúc khách bu đông nghẹt, sắp vỡ trận!`,
              cost: 7000,
              pen: 12000,
            },
          };
          const meta = crisisMap[type];
          sq.status = 'CRISIS';
          const newCrisis: CityCrisis = {
            id: this.nextId(),
            type,
            title: meta.title,
            desc: meta.desc,
            districtId: sq.districtId,
            squadId: sq.id,
            timeLeft: 5.0,
            maxTime: 5.0,
            budgetCost: meta.cost,
            penaltyMoney: meta.pen,
          };
          this.cityTycoon.crises.push(newCrisis);
          this.pushTycoonFeed(`🚨 BÁO ĐỘNG ĐỎ: ${sq.name} gặp biến tại ${dName} (5s)!`, 'ALERT');
          this.audio.playPickup();
        }
      }
    }

    this.emitHud(false);
  }

  public toggleMute(): boolean {
    const muted = this.audio.toggleMute();
    this.emitHud(true);
    return muted;
  }

  public setShopOpen(open: boolean): void {
    if (this.screen !== 'PLAYING' && open) return;
    this.shopOpen = open;
    if (open) {
      this.heldKeys.clear();
      this.activeTouches.clear();
      this.limeTouchId = null;
      this.chiliTouchId = null;
      this.isSwiping = false;
      this.activeCutAnchor = null;
      this.isRollingDrag = false;
      this.pointerDragRoad = false;
      this.limeMeter.holding = false;
      this.chiliMeter.holding = false;
    } else {
      this.lastTimestamp = performance.now();
    }
    this.emitHud(true);
  }

  public setLoanModalOpen(open: boolean): void {
    this.loanModalOpen = open;
    if (open) {
      this.heldKeys.clear();
      this.activeTouches.clear();
      this.limeTouchId = null;
      this.chiliTouchId = null;
      this.isSwiping = false;
      this.activeCutAnchor = null;
      this.isRollingDrag = false;
      this.limeMeter.holding = false;
      this.chiliMeter.holding = false;
    } else {
      this.lastTimestamp = performance.now();
    }
    this.emitHud(true);
  }

  public borrowLoanShark(amount = 20000): boolean {
    this.audio.unlock();
    this.money += amount;
    this.loanDebt += amount;
    this.audio.playCashChing();
    this.spawnCallout(
      `⚡ VAY NÓNG +${amount.toLocaleString('vi-VN')}đ!`,
      `Lãi 25%/ngày · Tổng nợ: ${this.loanDebt.toLocaleString('vi-VN')}đ`,
      this.width * 0.5,
      this.height * 0.32,
      '#F59E0B'
    );
    this.emitHud(true);
    return true;
  }

  public repayLoanShark(): boolean {
    if (this.loanDebt <= 0 || this.money < this.loanDebt) return false;
    this.audio.unlock();
    const paid = this.loanDebt;
    this.money -= paid;
    this.loanDebt = 0;
    this.thugsActive = false;
    this.loanModalOpen = false;
    this.audio.playRaidWin();
    this.spawnCallout(
      `✓ TRẢ SẠCH NỢ ${paid.toLocaleString('vi-VN')}đ!`,
      'Đàn em đòi nợ đã rút lui!',
      this.width * 0.5,
      this.height * 0.34,
      '#10B981'
    );
    this.emitHud(true);
    return true;
  }

  public buyShopItem(id: ShopItemId, payWithVnd = false): boolean {
    const xuCost = SHOP_COSTS[id];
    const vndCost = xuCost * 20; // E.g. 900 Xu = 18.000đ (borrowable via Electric Pole!)
    if (payWithVnd) {
      if (this.money < vndCost) return false;
    } else {
      if (this.xu < xuCost) return false;
    }

    const deduct = () => {
      if (payWithVnd) this.money -= vndCost;
      else this.xu -= xuCost;
    };

    if (id === 'dep_to_ong') {
      if (this.upgrades.depToOng) return false;
      deduct();
      this.upgrades.depToOng = true;
      this.spawnCallout('Đã mua Dép Tổ Ong!', 'Né chướng ngại vật dễ hơn 20%!', this.width * 0.5, this.height * 0.36, '#10B981');
    } else if (id === 'loa_keo_keo') {
      if (this.upgrades.loaKeoKeo) return false;
      deduct();
      this.upgrades.loaKeoKeo = true;
      this.spawnCallout('Đã mua Loa Kẹo Kéo!', 'Khách đông +50% · Coi chừng Trật Tự!', this.width * 0.5, this.height * 0.36, '#F59E0B');
    } else if (id === 'ghe_bat_tu') {
      if (this.upgrades.gheBatTu) return false;
      deduct();
      this.upgrades.gheBatTu = true;
      this.maxRedChairs = 5;
      this.redChairs = Math.min(this.maxRedChairs, this.redChairs + 1);
      this.spawnCallout('Ghế Nhựa Bất Tử!', '+1 Ghế Đỏ & Khiên bảo vệ khi chạy!', this.width * 0.5, this.height * 0.36, '#38BDF8');
    } else if (id === 'led_rgb') {
      if (this.upgrades.ledRgb) return false;
      deduct();
      this.upgrades.ledRgb = true;
      if (!this.waitingCustomers.some((c) => c.customerType === 'GEN_Z')) {
        if (this.waitingCustomers.length > 0) {
          this.waitingCustomers[0] = this.createWaitingCustomer('GEN_Z');
        } else {
          this.waitingCustomers.push(this.createWaitingCustomer('GEN_Z'));
        }
      }
      this.spawnCallout('Bảng Hiệu LED RGB!', 'Mở khóa Khách Gen Z trả gấp đôi!', this.width * 0.5, this.height * 0.36, '#EC4899');
    } else if (id === 'cursed_menu') {
      if (this.upgrades.cursedMenu) return false;
      deduct();
      this.upgrades.cursedMenu = true;
      if (!this.waitingCustomers.some((c) => c.customerType === 'GEN_Z')) {
        this.waitingCustomers.unshift(this.createWaitingCustomer('GEN_Z'));
        if (this.waitingCustomers.length > 2) this.waitingCustomers.pop();
      }
      this.spawnCallout(
        'Mở Khóa Hắc Ám Menu!',
        'Sầu Riêng + Trân Châu + Cốt Dừa · Gen Z trả x3 (50% ngộ độc)!',
        this.width * 0.5,
        this.height * 0.36,
        '#A855F7'
      );
    } else if (id === 'diy_mixer') {
      if (this.upgrades.diyMixer) return false;
      deduct();
      this.upgrades.diyMixer = true;
      this.spawnCallout(
        '⚙️ Máy Trộn Tự Chế!',
        'Tự động trộn tốc độ x2 (15% tỉ lệ chập mạch)!',
        this.width * 0.5,
        this.height * 0.36,
        '#0EA5E9'
      );
    }

    this.audio.unlock();
    this.audio.playPickup();
    this.emitHud(true);
    return true;
  }

  private createWaitingCustomer(forceType?: CustomerType): WaitingCustomer {
    const pool: CustomerType[] = this.upgrades.ledRgb
      ? ['STUDENT', 'NINJA_LEAD', 'GEN_Z', 'GEN_Z', 'OFFICE', 'APP_SHIPPER']
      : this.upgrades.cursedMenu
      ? ['STUDENT', 'NINJA_LEAD', 'GEN_Z', 'OFFICE', 'APP_SHIPPER']
      : ['STUDENT', 'NINJA_LEAD', 'OFFICE', 'APP_SHIPPER'];
    const type = forceType ?? pool[Math.floor(Math.random() * pool.length)];
    const shipperBrand = type === 'APP_SHIPPER' ? (Math.random() < 0.5 ? 'GREEN' : 'ORANGE') : undefined;
    const labelMap: Record<CustomerType, string> = {
      STUDENT: 'Sinh Viên Đói Bụng',
      NINJA_LEAD: 'Ninja Lead',
      GEN_Z: this.upgrades.cursedMenu ? 'Reviewer Gen Z (x3)' : 'Khách Gen Z (VIP x2)',
      OFFICE: 'Dân Văn Phòng',
      FENG_SHUI: 'Khách Tâm Linh (VIP)',
      GYM_BRO: 'Gymer Đô Con (VIP)',
      REAL_ESTATE: 'Sale Bất Động Sản (VIP)',
      APP_SHIPPER: shipperBrand === 'GREEN' ? 'Shipper Áo Xanh' : 'Shipper Áo Cam',
      MUKBANGER: 'Thánh Mukbang (BOSS)',
      ROOM_HUNTERS: 'Nhóm Sinh Viên Tìm Trọ',
      BUSINESS_BAZI: 'Khách Doanh Nhân (Bát Tự)',
      HEARTBROKEN_GENZ: 'Gen Z Thất Tình (Tarot)',
    };
    return {
      id: this.nextId(),
      customerType: type,
      customerLabel: labelMap[type],
      hasRaincoat: false,
      waitAge: 0,
      isAngry: false,
      shipperBrand,
    };
  }

  private fillWaitingQueue(): void {
    while (this.waitingCustomers.length < 2) {
      this.waitingCustomers.push(this.createWaitingCustomer());
    }
  }

  private shouldSpawnVipType(): CustomerType | undefined {
    if (this.vipsRemainingToday.length === 0) return undefined;
    const dueByOrders =
      (this.dayOrdersCompleted === 1 && this.vipsRemainingToday.length === 3) ||
      (this.dayOrdersCompleted === 3 && this.vipsRemainingToday.length === 2) ||
      (this.dayOrdersCompleted === 5 && this.vipsRemainingToday.length === 1);
    let dueByTime = false;
    if (this.dayDuration > 0) {
      const ratioLeft = this.dayTimeLeft / this.dayDuration;
      dueByTime =
        (ratioLeft <= 0.75 && this.vipsRemainingToday.length === 3) ||
        (ratioLeft <= 0.48 && this.vipsRemainingToday.length === 2) ||
        (ratioLeft <= 0.20 && this.vipsRemainingToday.length === 1);
    } else {
      dueByTime =
        (this.dayElapsedTime >= 35 && this.vipsRemainingToday.length === 3) ||
        (this.dayElapsedTime >= 75 && this.vipsRemainingToday.length === 2) ||
        (this.dayElapsedTime >= 115 && this.vipsRemainingToday.length === 1);
    }
    if (dueByOrders || dueByTime) {
      return this.vipsRemainingToday.shift();
    }
    return undefined;
  }

  private spawnNextOrder(allowQte = true, forceFortuneType?: 'BUSINESS_BAZI' | 'HEARTBROKEN_GENZ'): void {
    if ((this.dayDuration > 0 && this.dayTimeLeft <= 0) || this.endOfDayPending) {
      this.endCurrentDay('');
      return;
    }

    if (!this.hasEnoughIngredientsToOperate()) {
      this.endCurrentDay('Hết nguyên liệu giữa ca! Phải dọn xe đóng quán sớm.');
      return;
    }

    if (this.bocPhotTimer > 0) {
      this.order = null;
      return;
    }

    this.baziReading = freshBaziReading();
    this.tarot = freshTarot();

    const vipType = forceFortuneType ? undefined : this.shouldSpawnVipType();
    const isFlowOrder = !forceFortuneType && this.flowPerfectCount >= 5;
    const rollFortuneType: 'BUSINESS_BAZI' | 'HEARTBROKEN_GENZ' | undefined =
      forceFortuneType ??
      (!vipType &&
      !isFlowOrder &&
      this.ordersServed >= 1 &&
      !this.rainEvent.active &&
      !this.bossFight.active &&
      Math.random() < 0.18
        ? this.nextFortuneToggle === 'BAZI'
          ? 'BUSINESS_BAZI'
          : 'HEARTBROKEN_GENZ'
        : undefined);
    if (rollFortuneType && !forceFortuneType) {
      this.nextFortuneToggle = rollFortuneType === 'BUSINESS_BAZI' ? 'TAROT' : 'BAZI';
    }

    const rollRoomHunters =
      !vipType &&
      !isFlowOrder &&
      !rollFortuneType &&
      this.ordersServed >= 1 &&
      !this.rainEvent.active &&
      !this.bossFight.active &&
      Math.random() < 0.14;

    const nextWaiting =
      vipType || rollRoomHunters || rollFortuneType ? undefined : this.waitingCustomers.shift();
    this.fillWaitingQueue();

    this.order = generateCustomerOrder(
      this.ordersServed,
      this.nextId,
      this.upgrades.ledRgb,
      vipType ?? rollFortuneType ?? (rollRoomHunters ? 'ROOM_HUNTERS' : nextWaiting?.customerType),
      this.inventory,
      this.upgrades.cursedMenu,
      nextWaiting?.shipperBrand,
      this.dailyHexagram.element
    );
    if (nextWaiting?.isAngry) {
      this.order.isAngry = true;
    }
    if (nextWaiting) {
      this.order.waitAge = nextWaiting.waitAge;
    }
    if (this.order.patienceDrainRate > 0) {
      this.order.maxPatience = Math.max(
        6,
        Number((this.order.maxPatience * this.dayManager.pacing.patienceRatio).toFixed(1))
      );
      if (this.badRepOrdersLeft > 0) {
        this.badRepOrdersLeft -= 1;
        this.order.patience = Math.max(3, Number((this.order.maxPatience * 0.7).toFixed(1)));
      } else {
        this.order.patience = this.order.maxPatience;
      }
    }

    this.dishType = this.order.dishType;
    if (this.order.targetSlices === 0) {
      // Gym Bro Low-Carb order skips rice paper slicing completely!
      this.prepStep = 'TOPPINGS';
    } else {
      this.prepStep = this.dishType === 'CUON' ? 'TOPPINGS' : 'CUTTING';
    }
    this.resetPrepBoard();

    // Feature 1: Flow State Scissor Rhythm Minigame triggers after 5 perfect orders!
    if (isFlowOrder) {
      this.flowPerfectCount = 0;
      this.startFlowRhythm();
      return;
    }

    // Street Fortune Teller Mode 1: Business Customer Bazi Reading
    if (this.order.customerType === 'BUSINESS_BAZI' && this.order.baziProfile) {
      this.baziReading = {
        active: true,
        acknowledged: false,
        profile: this.order.baziProfile,
        customerLabel: this.order.customerLabel,
      };
      this.audio.playMysticBell();
      this.emitHud(true);
      return;
    }

    // Street Fortune Teller Mode 2: Heartbroken Gen Z Tarot Minigame
    if (this.order.customerType === 'HEARTBROKEN_GENZ') {
      const q =
        HEARTBROKEN_QUESTIONS[Math.floor(Math.random() * HEARTBROKEN_QUESTIONS.length)];
      this.tarot = {
        active: true,
        stage: 'PICK_CARD',
        customerLabel: this.order.customerLabel,
        question: q,
        cardPool: pickTarotSpread(),
        drawnCard: null,
        options: [],
        chosenTone: null,
        outcomeKind: null,
        tipEarned: 0,
        customerLeft: false,
        resultMessage: '',
        upgradedToCombo: false,
      };
      this.audio.playMysticBell();
      this.emitHud(true);
      return;
    }

    // Feature 3: Room Hunters Dialogue Upsell Event
    if (this.order.customerType === 'ROOM_HUNTERS') {
      this.roomHunters = {
        active: true,
        customerLabel: this.order.customerLabel,
        promptText: this.order.dialogue,
      };
      this.audio.playDropTopping();
      this.emitHud(true);
      return;
    }

    if (vipType) {
      this.spawnCallout(
        `✨ KHÁCH VIP: ${this.order.customerLabel}!`,
        'Làm chuẩn để nhận Buff đặc biệt!',
        this.width * 0.5,
        this.height * 0.34,
        '#FACC15'
      );
      return;
    }

    // Event 1: 10% chance when a regular customer spawns -> Chiến thần Tóp Tóp QTE
    if (
      allowQte &&
      this.ordersServed >= 1 &&
      !this.rainEvent.active &&
      !this.tiktokQte.active &&
      !this.bossFight.active &&
      this.viralOrdersLeft <= 0 &&
      this.bocPhotTimer <= 0 &&
      Math.random() < 0.1
    ) {
      this.startTiktokQte();
    }
  }

  public summonFortuneCustomer(kind?: 'BAZI' | 'TAROT'): boolean {
    if (
      this.screen !== 'PLAYING' ||
      this.phase !== 'COOKING' ||
      this.flowRhythm.active ||
      this.checkout.active ||
      this.bossFight.active ||
      this.diyMalfunction.active ||
      this.roomHunters.active ||
      this.rippedBag.active ||
      this.tiktokQte.active ||
      this.tarot.active ||
      (this.baziReading.active && !this.baziReading.acknowledged) ||
      this.endOfDayPending
    ) {
      return false;
    }
    this.audio.unlock();
    const chosen: 'BAZI' | 'TAROT' = kind ?? this.nextFortuneToggle;
    this.nextFortuneToggle = chosen === 'BAZI' ? 'TAROT' : 'BAZI';
    this.customerSpawnDelay = 0;
    this.spawnNextOrder(false, chosen === 'BAZI' ? 'BUSINESS_BAZI' : 'HEARTBROKEN_GENZ');
    return true;
  }

  public acknowledgeBaziReading(): void {
    if (!this.baziReading.active) return;
    this.audio.unlock();
    this.baziReading.acknowledged = true;
    this.baziReading.active = false;
    this.audio.playDropTopping();
    if (this.baziReading.profile) {
      this.spawnCallout(
        `☯️ CẢI VẬN: ${this.baziReading.profile.dayMaster}!`,
        'Trộn đúng Ngũ Hành Dụng Thần để nhận Hồng Phúc!',
        this.width * 0.5,
        this.height * 0.32,
        '#F59E0B'
      );
    }
    this.emitHud(true);
  }

  public drawTarotCard(slotIndex?: number): void {
    if (!this.tarot.active || this.tarot.stage !== 'PICK_CARD') return;
    const card =
      typeof slotIndex === 'number'
        ? (this.tarot.cardPool[slotIndex] ?? drawRandomStreetTarotCard())
        : drawRandomStreetTarotCard();
    if (!card) return;
    this.audio.unlock();
    this.audio.playTarotFlip();
    this.tarot.drawnCard = card;
    this.tarot.options = getTarotOptionsForCard(card);
    this.tarot.stage = 'INTERPRET';
    this.emitHud(true);
  }

  public chooseTarotDialogue(tone: TarotDialogueTone): void {
    if (!this.tarot.active || this.tarot.stage !== 'INTERPRET' || !this.tarot.drawnCard) return;
    this.audio.unlock();
    const outcome = resolveTarotInterpretation(this.tarot.drawnCard, tone);
    this.tarot.chosenTone = tone;
    this.tarot.outcomeKind = outcome.outcomeKind;
    this.tarot.customerLeft = outcome.customerLeft;
    this.tarot.tipEarned = outcome.tipAmount;
    this.tarot.upgradedToCombo = outcome.upgradedToCombo;
    this.tarot.resultMessage = outcome.resultMessage;
    this.tarot.stage = 'RESULT';

    if (outcome.outcomeKind === 'LEFT') {
      this.combo = 0;
      this.audio.playServeFail();
    } else if (outcome.outcomeKind === 'TIP') {
      this.money += outcome.tipAmount;
      this.dayRevenue += outcome.tipAmount;
      this.dayPnl.revenue += outcome.tipAmount;
      this.score += 180;
      if (this.order) {
        this.order.dialogue = `Cảm ơn thầy an ủi (+10k tip)! Làm giùm em phần thường nha!`;
      }
      this.audio.playCashChing();
    } else if (outcome.outcomeKind === 'COMBO_3X' && this.order) {
      this.order.hasTraTacCombo = true;
      this.order.baseReward *= outcome.priceMultiplier;
      this.order.baseXu *= outcome.priceMultiplier;
      this.order.dialogue = `Đã chốt Tarot Combo (x3 Giá)! Trộn liền cho em đổi vận nha thầy!`;
      this.score += 350;
      this.audio.playRaidWin();
    }
    this.emitHud(true);
  }

  public closeTarotResult(): void {
    if (!this.tarot.active) return;
    const outcomeKind = this.tarot.outcomeKind;
    const tipEarned = this.tarot.tipEarned;
    this.tarot = freshTarot();

    if (outcomeKind === 'LEFT') {
      this.order = null;
      this.scheduleNextCustomer();
      this.spawnCallout(
        '💔 KHÁCH BUỒN BỎ ĐI!',
        'Phán thẳng quá khiến khách rơi lệ, không mua gì cả!',
        this.width * 0.5,
        this.height * 0.32,
        '#E11D48'
      );
    } else if (outcomeKind === 'TIP') {
      this.spawnCallout(
        `💖 +${tipEarned.toLocaleString('vi-VN')}đ TIP AN ỦI!`,
        'Khách rất hài lòng — làm nốt phần thường cho bạn ấy nhé!',
        this.width * 0.5,
        this.height * 0.32,
        '#10B981'
      );
    } else if (outcomeKind === 'COMBO_3X') {
      this.spawnCallout(
        '🔮 CHỐT TAROT COMBO (x3 GIÁ)!',
        'Trộn chuẩn để hốt trọn doanh thu gấp 3 lần!',
        this.width * 0.5,
        this.height * 0.32,
        '#A855F7'
      );
    }
    this.emitHud(true);
  }

  public triggerScissorRhythm(): boolean {
    if (
      this.screen !== 'PLAYING' ||
      this.phase !== 'COOKING' ||
      !this.order ||
      this.flowRhythm.active ||
      this.checkout.active ||
      this.bossFight.active ||
      this.diyMalfunction.active ||
      this.roomHunters.active ||
      this.rippedBag.active ||
      this.tiktokQte.active ||
      this.tarot.active ||
      (this.baziReading.active && !this.baziReading.acknowledged)
    ) {
      return false;
    }
    this.audio.unlock();
    if (this.flowPerfectCount >= 5) {
      this.flowPerfectCount = 0;
    }
    this.startFlowRhythm();
    return true;
  }

  private startFlowRhythm(): void {
    const laneToppings: ToppingId[] = ['kho_bo', 'trung_cut', 'xoai', 'rau_ram'];
    const beatInterval = 0.54;
    const notes: FlowRhythmNote[] = [];
    for (let i = 0; i < 8; i++) {
      const lane = Math.floor(Math.random() * 4);
      notes.push({
        id: this.nextId(),
        lane,
        toppingId: laneToppings[lane],
        hitTime: 1.45 + i * beatInterval,
        judged: false,
      });
    }
    this.prepStep = 'FLOW_RHYTHM';
    this.isSwiping = false;
    this.activeCutAnchor = null;
    this.isRollingDrag = false;
    this.limeMeter.holding = false;
    this.chiliMeter.holding = false;
    this.flowRhythm = {
      active: true,
      elapsed: 0,
      beatInterval,
      lastBeatIndex: -1,
      notes,
      hitsPerfect: 0,
      hitsGood: 0,
      missed: 0,
      combo: 0,
      lastJudgmentText: 'FLOW STATE! KÉO CẮT THEO NHỊP!',
      lastJudgmentColor: '#FACC15',
      lastJudgmentTimer: 1.2,
      laneFlashTimers: [0, 0, 0, 0],
      finishingTimer: 0,
    };
    this.audio.playRaidWin();
    this.spawnCallout(
      '✂️ FLOW STATE ĐÃ KÍCH HOẠT!',
      'Bắt nhịp Kéo Cắt tạo Tuyệt Tác x5 Giá Bán!',
      this.width * 0.5,
      this.height * 0.34,
      '#FACC15'
    );
    this.emitHud(true);
  }

  private handleFlowLaneTap(lane: number): void {
    if (!this.flowRhythm.active || this.flowRhythm.finishingTimer > 0 || lane < 0 || lane > 3) return;
    this.flowRhythm.laneFlashTimers[lane] = 0.16;

    // Find closest unjudged note in this lane
    let bestNote: FlowRhythmNote | null = null;
    let bestAbs = Infinity;
    for (const note of this.flowRhythm.notes) {
      if (note.judged || note.lane !== lane) continue;
      const diff = Math.abs(note.hitTime - this.flowRhythm.elapsed);
      if (diff <= 0.25 && diff < bestAbs) {
        bestAbs = diff;
        bestNote = note;
      }
    }

    if (bestNote) {
      bestNote.judged = true;
      const fl = getFlowLaneRects(computePrepLayout(this.width, this.height));
      const pad = fl.padRects[lane];
      const hitX = pad ? pad.x + pad.w * 0.5 : this.width * 0.5;
      if (bestAbs <= 0.12) {
        bestNote.result = 'PERFECT';
        this.flowRhythm.hitsPerfect += 1;
        this.flowRhythm.combo += 1;
        this.flowRhythm.lastJudgmentText = '✨ PERFECT!';
        this.flowRhythm.lastJudgmentColor = '#FACC15';
        this.audio.playRhythmHit(true);
        this.spawnParticles(hitX, fl.hitY, 14, '#FACC15', 'rect');
      } else {
        bestNote.result = 'GOOD';
        this.flowRhythm.hitsGood += 1;
        this.flowRhythm.combo += 1;
        this.flowRhythm.lastJudgmentText = '👍 GOOD!';
        this.flowRhythm.lastJudgmentColor = '#38BDF8';
        this.audio.playRhythmHit(false);
        this.spawnParticles(hitX, fl.hitY, 8, '#38BDF8', 'circle');
      }
      this.flowRhythm.lastJudgmentTimer = 0.65;
    } else {
      this.flowRhythm.combo = 0;
      this.flowRhythm.lastJudgmentText = 'MISS!';
      this.flowRhythm.lastJudgmentColor = '#FB7185';
      this.flowRhythm.lastJudgmentTimer = 0.45;
      this.audio.playScissorSnip(false);
    }

    if (this.flowRhythm.notes.every((n) => n.judged)) {
      this.beginFinishFlowRhythm();
    }
  }

  private beginFinishFlowRhythm(): void {
    const fr = this.flowRhythm;
    if (!fr.active || fr.finishingTimer > 0) return;
    fr.finishingTimer = 0.55;
    const isMasterpiece = fr.hitsPerfect >= 5 && fr.missed <= 1;
    fr.lastJudgmentText = isMasterpiece ? '🌟 TUYỆT TÁC x5!' : '✂️ HOÀN TẤT NHỊP KÉO!';
    fr.lastJudgmentColor = isMasterpiece ? '#FACC15' : '#38BDF8';
    fr.lastJudgmentTimer = 0.65;
    if (isMasterpiece) {
      this.audio.playRaidWin();
      this.spawnParticles(this.width * 0.5, this.height * 0.5, 28, '#FACC15', 'rect');
    } else {
      this.audio.playServeSuccess(0.8);
    }
  }

  private finishFlowRhythm(): void {
    if (!this.flowRhythm.active || !this.order) return;
    const fr = this.flowRhythm;
    this.flowRhythm = freshFlowRhythm();

    const isMasterpiece = fr.hitsPerfect >= 5 && fr.missed <= 1;
    const order = this.order;
    const viralMult = this.viralOrdersLeft > 0 ? 3 : 1;
    const tipMult = this.dailyBuffs.luckyCharm ? 1.1 : 1.0;

    if (isMasterpiece) {
      order.isMasterpiece = true;
      const earned = Math.round((order.baseReward * 5 * tipMult * viralMult) / 1000) * 1000;
      const earnedXu = Math.round(order.baseXu * 3 * viralMult);
      const pts = 2500 * viralMult;
      this.combo += 1;
      this.perfectOrders += 1;
      this.audio.playRaidWin();
      this.spawnParticles(this.width * 0.5, this.height * 0.5, 32, '#FACC15', 'rect');
      this.spawnCallout(
        '🌟 TUYỆT TÁC BÁNH TRÁNG (x5 GIÁ)!',
        `${fr.hitsPerfect}/8 Perfect · Giá trị ${earned.toLocaleString('vi-VN')}đ!`,
        this.width * 0.5,
        this.height * 0.34,
        '#FACC15'
      );
      this.openCheckoutModal(order, earned, earnedXu, pts, viralMult);
    } else {
      const mult = Math.max(1, 1 + fr.hitsPerfect * 0.25 + fr.hitsGood * 0.1);
      const earned = Math.round((order.baseReward * mult * tipMult * viralMult) / 1000) * 1000;
      const earnedXu = Math.round(order.baseXu * mult * viralMult);
      const pts = Math.round(800 * mult) * viralMult;
      this.audio.playServeSuccess(0.8);
      this.spawnCallout(
        `✂️ XONG FLOW! (${fr.hitsPerfect} Perfect)`,
        `Đĩa bánh ngon x${mult.toFixed(1)} giá!`,
        this.width * 0.5,
        this.height * 0.34,
        '#38BDF8'
      );
      this.openCheckoutModal(order, earned, earnedXu, pts, viralMult);
    }
    this.emitHud(true);
  }

  public chooseRoomHuntersOption(option: RoomHuntersOption): void {
    if (!this.roomHunters.active || !this.order) return;
    this.audio.unlock();
    this.roomHunters = freshRoomHunters();

    if (option === 'EMPATHY_SELL') {
      this.order.baseReward = 30000;
      this.order.baseXu = 380;
      this.order.dialogue = 'Cảm ơn anh hiểu tụi em! Cho tụi em combo 30k ăn lấy sức tìm trọ nha!';
      this.score += 250;
      this.audio.playRaidWin();
      this.spawnCallout(
        '💬 CHỐT SALE THÀNH CÔNG! (10k → 30k)',
        'Đồng cảm đúng tâm lý! Nâng cấp đơn lên Combo 30.000đ!',
        this.width * 0.5,
        this.height * 0.34,
        '#10B981'
      );
    } else if (option === 'HARD_SELL') {
      this.combo = 0;
      this.audio.playServeFail();
      this.spawnCallout(
        '😤 CHỐT ÉP GIÁ THẤT BẠI!',
        'Sinh viên mệt mỏi bỏ đi luôn rồi!',
        this.width * 0.5,
        this.height * 0.34,
        '#E11D48'
      );
      this.scheduleNextCustomer();
    } else {
      this.audio.playDropTopping();
      this.spawnCallout(
        'Bán gói 10.000đ bình thường',
        'Làm nhanh cho mấy bạn kịp đi xem phòng!',
        this.width * 0.5,
        this.height * 0.34,
        '#38BDF8'
      );
    }
    this.emitHud(true);
  }

  public selectDiyWireLeft(color: WireColorId): void {
    if (!this.diyMalfunction.active || this.diyMalfunction.connected.includes(color)) return;
    this.audio.unlock();
    this.diyMalfunction.selectedLeftColor = color;
    this.audio.playDropTopping();
    this.emitHud(true);
  }

  public connectDiyWireRight(rightColor: WireColorId): void {
    if (!this.diyMalfunction.active || !this.diyMalfunction.selectedLeftColor) return;
    this.audio.unlock();
    const leftColor = this.diyMalfunction.selectedLeftColor;
    this.diyMalfunction.selectedLeftColor = null;

    if (leftColor === rightColor) {
      if (!this.diyMalfunction.connected.includes(leftColor)) {
        this.diyMalfunction.connected = [...this.diyMalfunction.connected, leftColor];
      }
      this.audio.playWireZap(true);
      if (this.diyMalfunction.connected.length >= 3) {
        this.resolveDiyMalfunction(true);
        return;
      }
    } else {
      this.diyMalfunction.wrongFlash = 0.25;
      this.diyMalfunction.timeLeft = Math.max(0.2, this.diyMalfunction.timeLeft - 0.6);
      this.audio.playWireZap(false);
    }
    this.emitHud(true);
  }

  private triggerDiyMalfunction(): void {
    const colors: WireColorId[] = ['RED', 'YELLOW', 'BLUE'];
    const right = [...colors];
    // Ensure shuffled order differs when possible
    for (let i = right.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [right[i], right[j]] = [right[j], right[i]];
    }
    const diyTime = Math.max(3.0, Number((4.5 * this.dayManager.pacing.actionTimeRatio).toFixed(1)));
    this.diyMalfunction = {
      active: true,
      timeLeft: diyTime,
      maxTime: diyTime,
      leftOrder: colors,
      rightOrder: right,
      selectedLeftColor: null,
      connected: [],
      wrongFlash: 0,
    };
    this.audio.playWireZap(false);
    this.shakeIntensity = Math.max(this.shakeIntensity, 10);
    this.spawnCallout(
      '⚡ CHẬP MẠCH MÁY TRỘN DIY!',
      'Bắn sa tế tung tóe! Nối đúng 3 dây màu trong 4.5s!',
      this.width * 0.5,
      this.height * 0.34,
      '#E11D48'
    );
    this.emitHud(true);
  }

  private resolveDiyMalfunction(fixed: boolean): void {
    this.diyMalfunction = freshDiyMalfunction();
    if (fixed) {
      this.shakeProgress = 100;
      this.prepStep = 'READY';
      this.score += 200;
      this.audio.playRaidWin();
      this.spawnCallout(
        '🔧 SỬA MÁY THÀNH CÔNG!',
        'Cứu kịp tô bánh tráng (+200 điểm)!',
        this.width * 0.5,
        this.height * 0.34,
        '#10B981'
      );
    } else {
      this.combo = 0;
      this.audio.playServeFail();
      this.spawnCallout(
        '💥 NỔ MÁY TRỘN! HỎNG ĐĨA BÁNH!',
        'Khách dính sa tế bỏ đi mất tiêu!',
        this.width * 0.5,
        this.height * 0.34,
        '#E11D48'
      );
      this.scheduleNextCustomer();
    }
    this.emitHud(true);
  }

  private enterShakingStep(): void {
    this.prepStep = 'SHAKING';
    this.audio.playDropTopping();
    if (this.upgrades.diyMixer && Math.random() < 0.15) {
      this.triggerDiyMalfunction();
    } else {
      this.emitHud(true);
    }
  }

  public appeaseAngryCustomer(waitingIdx?: number): boolean {
    if (this.screen !== 'PLAYING' || this.phase !== 'COOKING') return false;
    this.audio.unlock();
    if (this.money < 2000) {
      this.audio.playServeFail();
      this.spawnCallout('Không đủ 2.000đ!', 'Không thể tặng thêm trứng cút!', this.width * 0.5, this.height * 0.3, '#E11D48');
      return false;
    }

    const layout = computePrepLayout(this.width, this.height);
    if (waitingIdx === undefined) {
      if (this.order && this.order.isAngry) {
        this.money -= 2000;
        this.dayIngredientSpend += 2000;
        this.order.isAngry = false;
        this.order.patience = this.order.maxPatience;
        this.audio.playPickup();
        this.spawnParticles(layout.customerX, layout.customerY - 50, 10, '#FACC15', 'circle');
        this.spawnCallout('🥚 Dỗ Khách Thành Công!', 'Tặng thêm Trứng Cút (-2k) · Hết quạu!', layout.customerX + 100, layout.customerY - 70, '#10B981');
        this.emitHud(true);
        return true;
      }
      // Fallback: if called from HUD button without index, appease first angry customer found
      const firstAngryIdx = this.waitingCustomers.findIndex((wc) => wc.isAngry);
      if (firstAngryIdx >= 0) {
        return this.appeaseAngryCustomer(firstAngryIdx);
      }
      return false;
    }

    const wc = this.waitingCustomers[waitingIdx];
    if (!wc || !wc.isAngry) return false;
    this.money -= 2000;
    this.dayIngredientSpend += 2000;
    wc.isAngry = false;
    wc.waitAge = 0;
    this.audio.playPickup();
    const wr = getWaitingCustomerRects(layout, this.waitingCustomers.length)[waitingIdx];
    if (wr) {
      this.spawnParticles(wr.x + wr.w * 0.5, wr.y + 30, 10, '#FACC15', 'circle');
      this.spawnCallout('🥚 Hết Quạu!', '-2.000đ tặng Trứng Cút', wr.x + wr.w * 0.5, wr.y - 20, '#10B981');
    }
    this.emitHud(true);
    return true;
  }

  private prioritizeWaitingShipper(shipperIdx: number): void {
    const shipper = this.waitingCustomers[shipperIdx];
    if (!shipper || shipper.customerType !== 'APP_SHIPPER') return;
    const layout = computePrepLayout(this.width, this.height);

    // Remove shipper from queue
    this.waitingCustomers.splice(shipperIdx, 1);

    // Any local customer waiting longer gets Angry status!
    let madeAngryCount = 0;
    if (this.order && this.order.customerType !== 'APP_SHIPPER' && !this.order.isVip) {
      const displaced: WaitingCustomer = {
        id: this.order.id,
        customerType: this.order.customerType,
        customerLabel: this.order.customerLabel,
        hasRaincoat: false,
        waitAge: this.order.waitAge ?? 6,
        isAngry: true,
      };
      this.waitingCustomers.unshift(displaced);
      madeAngryCount += 1;
    }

    for (const wc of this.waitingCustomers) {
      if (wc.customerType !== 'APP_SHIPPER' && wc.waitAge >= shipper.waitAge) {
        if (!wc.isAngry) {
          wc.isAngry = true;
          madeAngryCount += 1;
        }
      }
    }

    this.order = generateCustomerOrder(
      this.ordersServed,
      this.nextId,
      this.upgrades.ledRgb,
      'APP_SHIPPER',
      this.inventory,
      this.upgrades.cursedMenu,
      shipper.shipperBrand
    );
    this.dishType = this.order.dishType;
    this.prepStep = this.dishType === 'CUON' ? 'TOPPINGS' : 'CUTTING';
    this.resetPrepBoard();
    this.audio.playDropTopping();
    this.spawnCallout(
      '⚡ ƯU TIÊN SHIPPER!',
      madeAngryCount > 0 ? 'Khách chờ lâu đang QUẠU! Bấm 🥚 Dỗ (-2k)!' : 'Làm nhanh kẻo trễ app!',
      layout.customerX + 120,
      layout.customerY - 80,
      '#F59E0B'
    );
    this.emitHud(true);
  }

  private startTiktokQte(): void {
    const keys: ArrowKey[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const sequence: ArrowKey[] = [0, 1, 2, 3].map(() => keys[Math.floor(Math.random() * keys.length)]);
    this.tiktokQte = {
      active: true,
      sequence,
      progressIndex: 0,
      timeLeft: 3.0,
      maxTime: 3.0,
      wrongFlash: 0,
    };
    this.isSwiping = false;
    this.activeCutAnchor = null;
    this.isRollingDrag = false;
    this.limeMeter.holding = false;
    this.chiliMeter.holding = false;
    this.audio.playPickup();
    this.emitHud(true);
  }

  private failTiktokQte(reason: string): void {
    this.tiktokQte.active = false;
    this.tiktokQte.wrongFlash = 0.28;
    this.bocPhotTimer = 10.0;
    this.order = null;
    this.waitingCustomers = [];
    this.customerSpawnDelay = 0;
    this.shakeIntensity = Math.max(this.shakeIntensity, 9);
    this.audio.playServeFail();
    this.spawnCallout(
      '💔 BỊ BÓC PHỐT!',
      `${reason} Không có khách trong 10 giây!`,
      this.width * 0.5,
      this.height * 0.36,
      '#E11D48'
    );
    this.emitHud(true);
  }

  private handleQteInput(key: ArrowKey): void {
    if (!this.tiktokQte.active) return;
    const expected = this.tiktokQte.sequence[this.tiktokQte.progressIndex];
    if (key === expected) {
      this.tiktokQte.progressIndex += 1;
      this.audio.playPickup();
      if (this.tiktokQte.progressIndex >= this.tiktokQte.sequence.length) {
        this.tiktokQte.active = false;
        this.viralOrdersLeft = 5;
        this.score += 500;
        this.audio.playRaidWin();
        this.spawnParticles(this.width * 0.5, this.height * 0.45, 22, '#FACC15', 'rect');
        this.spawnCallout(
          '🔥 VIRAL TÓP TÓP!',
          'Hoàn hảo! x3 tiền & xu trong 5 đơn tới!',
          this.width * 0.5,
          this.height * 0.36,
          '#10B981'
        );
        this.emitHud(true);
      }
    } else {
      this.failTiktokQte('Bấm nhầm phím!');
    }
  }

  private startSaigonRain(): void {
    this.rainEvent = {
      active: true,
      timeLeft: 3.0,
      maxTime: 3.0,
      activeCustomerHasRaincoat: false,
    };
    for (const wc of this.waitingCustomers) {
      wc.hasRaincoat = false;
    }
    this.audio.playDropTopping();
    this.spawnCallout(
      '⛈️ MƯA SÀI GÒN ĐỔ XUỐNG!',
      'Bấm vào từng khách để phát Áo Mưa Nilon!',
      this.width * 0.5,
      this.height * 0.32,
      '#38BDF8'
    );
    this.emitHud(true);
  }

  private checkRainAllProtected(): void {
    if (!this.rainEvent.active) return;
    const activeProtected = !this.order || this.rainEvent.activeCustomerHasRaincoat;
    const queueProtected = this.waitingCustomers.every((wc) => wc.hasRaincoat);
    if (activeProtected && queueProtected) {
      this.rainEvent.active = false;
      this.xu += 150;
      this.score += 300;
      this.audio.playRaidWin();
      this.spawnCallout(
        '☔ CỨU KHÁCH KỊP LÚC!',
        '+150 Xu & +300 điểm giữ khách!',
        this.width * 0.5,
        this.height * 0.34,
        '#10B981'
      );
      this.emitHud(true);
    }
  }

  private resetPrepBoard(): void {
    const layout = computePrepLayout(this.width, this.height);
    this.slices =
      this.dishType === 'CUON'
        ? [
            createInitialRollPolygon(
              layout.boardCenterX,
              layout.boardCenterY,
              layout.rollRect.w * 0.5,
              layout.rollRect.h * 0.5,
              this.nextId
            ),
          ]
        : [createInitialRicePaper(layout.boardCenterX, layout.boardCenterY, layout.boardRadius, this.nextId)];
    this.swipeTrail = [];
    this.isSwiping = false;
    this.activeCutAnchor = null;
    this.lastSwipePoint = null;
    this.rollProgress = 0;
    this.isRollingDrag = false;
    this.addedToppings = emptyToppings();
    this.bowlIngredients = [];
    this.flyingToppings = [];
    this.limeMeter = freshMeter();
    this.chiliMeter = freshMeter();
    this.shakeProgress = 0;
    this.bowlShakeOffset = { x: 0, y: 0 };
    this.bowlScale = 1;
    this.violentShakeHeat = 0;
    this.rippedBag = freshRippedBag();
    this.rippedBagTriggeredThisOrder = false;
  }

  private startRippedBagQte(): void {
    this.rippedBagTriggeredThisOrder = true;
    const w = this.width;
    const minX = Math.max(120, w * 0.24);
    const maxX = Math.min(w - 120, w * 0.76);
    const span = Math.max(160, maxX - minX);
    const toppingList: ToppingId[] = ['kho_bo', 'xoai', 'trung_cut', 'kho_bo', 'trung_cut'];

    const items: FallingBagItem[] = toppingList.map((tid, idx) => {
      const isFinalQuailEgg = idx === toppingList.length - 1;
      return {
        id: this.nextId(),
        toppingId: tid,
        x: minX + ((idx + 0.5) / toppingList.length) * span + (Math.random() - 0.5) * 32,
        y: isFinalQuailEgg ? 88 : 112 + idx * 18,
        vy: isFinalQuailEgg ? 115 : 135 + Math.random() * 35,
        vx: (Math.random() - 0.5) * 42,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 2.5,
        caught: false,
        missed: false,
        isFinalQuailEgg,
      };
    });

    this.rippedBag = {
      active: true,
      timeLeft: 2.0,
      maxTime: 2.0,
      items,
    };
    this.audio.playServeFail();
    Haptics.bagRipped();
    this.shakeIntensity = Math.max(this.shakeIntensity, 10);
    this.spawnCallout(
      '💥 BỤC ĐÁY BỊCH!',
      'Lắc mạnh quá! Bắt lấy đồ rơi trong 2 giây!',
      w * 0.5,
      this.height * 0.34,
      '#E11D48'
    );
    this.emitHud(true);
  }

  private resolveRippedBagQte(): void {
    if (!this.rippedBag.active) return;
    const items = this.rippedBag.items;
    this.rippedBag = freshRippedBag();

    let missedCount = 0;
    let droppedFinalEgg = false;
    for (const item of items) {
      if (!item.caught) {
        missedCount += 1;
        if (item.isFinalQuailEgg) {
          droppedFinalEgg = true;
        }
      }
    }

    if (missedCount > 0) {
      const loss = missedCount * 5000;
      this.money = Math.max(0, this.money - loss);
      this.dayFinesCost += loss;
    }

    if (droppedFinalEgg) {
      this.combo = 0;
      this.audio.playServeFail();
      this.spawnCallout(
        '🥚 RỚT TRỨNG CÚT CUỐI!',
        `Khách bỏ đi! Mất -${(missedCount * 5000).toLocaleString('vi-VN')}đ nguyên liệu!`,
        this.width * 0.5,
        this.height * 0.36,
        '#E11D48'
      );
      this.scheduleNextCustomer();
    } else if (missedCount > 0) {
      this.spawnCallout(
        `Rớt ${missedCount} món (-${(missedCount * 5000).toLocaleString('vi-VN')}đ)`,
        'May quá chụp kịp quả Trứng Cút cuối cùng!',
        this.width * 0.5,
        this.height * 0.36,
        '#F59E0B'
      );
    } else {
      this.score += 350;
      this.audio.playRaidWin();
      this.spawnCallout(
        '⚡ BẮT TRỌN BỊCH RÁCH!',
        '+350 điểm phản xạ thần sầu!',
        this.width * 0.5,
        this.height * 0.36,
        '#10B981'
      );
    }
    this.emitHud(true);
  }

  private startBossFight(): void {
    this.bossFightRolledToday = true;
    this.order = generateCustomerOrder(
      this.ordersServed,
      this.nextId,
      this.upgrades.ledRgb,
      'MUKBANGER',
      this.inventory
    );
    this.dishType = 'TRON';
    this.prepStep = 'SHAKING';
    this.bossFight = {
      active: true,
      stage: 'DUMP',
      taps: 0,
      targetTaps: 50,
      mixAngleAccum: 0,
      targetMixAngle: Math.PI * 10,
      timeLeft: 10.0,
      maxTime: 10.0,
      lastPointerAngle: null,
      swirlTrail: [],
    };
    this.rippedBag = freshRippedBag();
    this.rainEvent = freshRain();
    this.tiktokQte = freshQte();
    this.isSwiping = false;
    this.activeCutAnchor = null;
    this.isRollingDrag = false;
    this.limeMeter.holding = false;
    this.chiliMeter.holding = false;
    this.audio.playRaidWin();
    this.shakeIntensity = Math.max(this.shakeIntensity, 8);
    this.spawnCallout(
      '🔥 BOSS CUỐI NGÀY: THAU KHỔNG LỒ 500K!',
      'Bấm 50 lần đổ mồi + Xoay tròn trộn trong 10s!',
      this.width * 0.5,
      this.height * 0.32,
      '#E11D48'
    );
    this.emitHud(true);
  }

  private completeBossFight(won: boolean): void {
    this.bossFight.active = false;
    if (won) {
      this.money += 500000;
      this.dayRevenue += 500000;
      this.xu += 1000;
      this.score += 2500;
      this.ordersServed += 1;
      this.dayOrdersCompleted += 1;
      this.perfectOrders += 1;
      this.audio.playCashChing();
      this.audio.playRaidWin();
      const layout = computePrepLayout(this.width, this.height);
      this.spawnParticles(layout.bowlCenterX, layout.bowlCenterY, 35, '#FACC15', 'bill');
      this.spawnCallout(
        '🏆 PHÁ ĐẢO THAU 500K!',
        '+500.000đ · +1.000 Xu · Thánh Mukbang mãn nhãn!',
        this.width * 0.5,
        this.height * 0.34,
        '#10B981'
      );
      this.scheduleNextCustomer();
    } else {
      this.inventory = emptyInventory();
      this.combo = 0;
      this.audio.playServeFail();
      this.shakeIntensity = 14;
      this.endCurrentDay('Thất bại trước Boss Thau Khổng Lồ! Đổ hỏng sạch toàn bộ kho nguyên liệu!');
    }
    this.emitHud(true);
  }

  private getCanvasPoint(e: { clientX: number; clientY: number }): Point2D {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private handleWheel = (e: WheelEvent): void => {
    if (this.screen !== 'PLAYING' || this.shopOpen || this.phase !== 'COOKING') return;
    if (this.tiktokQte.active || this.checkout.active) return;
    if (this.dishType === 'CUON' && this.prepStep === 'ROLLING') {
      e.preventDefault();
      this.audio.unlock();
      const delta = Math.abs(e.deltaY) + Math.abs(e.deltaX);
      if (delta > 0) {
        this.addRollProgress(Math.max(4, Math.min(18, delta * 0.14)));
      }
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Escape') {
      if (this.loanModalOpen) {
        e.preventDefault();
        this.setLoanModalOpen(false);
        return;
      }
      if (this.shopOpen) {
        e.preventDefault();
        this.setShopOpen(false);
        return;
      }
      if (this.screen === 'PLAYING' || this.screen === 'PAUSED') {
        e.preventDefault();
        this.togglePause();
      }
      return;
    }

    if (
      this.screen !== 'PLAYING' ||
      this.shopOpen ||
      this.loanModalOpen ||
      this.roomHunters.active ||
      this.diyMalfunction.active ||
      this.tarot.active ||
      (this.baziReading.active && !this.baziReading.acknowledged)
    )
      return;

    this.heldKeys.add(e.code);

    // Feature 1: Flow State Scissor Rhythm inputs
    if (this.phase === 'COOKING' && this.flowRhythm.active) {
      if (e.repeat) return;
      const laneMap: Record<string, number | undefined> = {
        KeyD: 0,
        ArrowLeft: 0,
        Digit1: 0,
        KeyF: 1,
        ArrowDown: 1,
        Digit2: 1,
        KeyJ: 2,
        ArrowUp: 2,
        Digit3: 2,
        KeyK: 3,
        ArrowRight: 3,
        Digit4: 3,
      };
      const lane = laneMap[e.code];
      if (lane !== undefined) {
        e.preventDefault();
        this.audio.unlock();
        this.handleFlowLaneTap(lane);
      }
      return;
    }

    // Event 1: Tiktok QTE arrow inputs (checked first, ignore key auto-repeat)
    if (this.phase === 'COOKING' && this.tiktokQte.active) {
      if (e.repeat) return;
      const map: Record<string, ArrowKey | undefined> = {
        ArrowUp: 'UP',
        KeyW: 'UP',
        ArrowDown: 'DOWN',
        KeyS: 'DOWN',
        ArrowLeft: 'LEFT',
        KeyA: 'LEFT',
        ArrowRight: 'RIGHT',
        KeyD: 'RIGHT',
      };
      const arrow = map[e.code];
      if (arrow) {
        e.preventDefault();
        this.audio.unlock();
        this.handleQteInput(arrow);
      }
      return;
    }

    // Feature 2: Parry active window during Urban Guard Grab Telegraph!
    if (this.phase === 'RAID_CHASE') {
      if (
        this.guardGrab.phase === 'TELEGRAPH' &&
        (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'KeyE' || e.code === 'KeyF')
      ) {
        e.preventDefault();
        this.executeGuardParry();
        return;
      }
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        this.triggerBoost();
        return;
      }
    }

    // Wuxia Street Combat inputs (J/1 = Shuriken, K/2 = Ice Tongs Slash, L/3 = Block, Space/Shift = Dodge)
    if (this.phase === 'WUXIA_COMBAT') {
      if (e.repeat) return;
      if (e.code === 'KeyJ' || e.code === 'Digit1') {
        e.preventDefault();
        this.wuxiaShuriken();
      } else if (e.code === 'KeyK' || e.code === 'Digit2') {
        e.preventDefault();
        this.wuxiaMelee();
      } else if (e.code === 'KeyL' || e.code === 'Digit3') {
        e.preventDefault();
        this.wuxiaBlock();
      } else if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        this.wuxiaDodge();
      }
      return;
    }

    if (this.phase === 'COOKING' && !this.flowRhythm.active && e.code === 'KeyM' && !e.repeat) {
      if (this.triggerScissorRhythm()) {
        e.preventDefault();
        return;
      }
    }

    if (this.phase === 'COOKING' && this.checkout.active) return;

    if (this.phase === 'COOKING' && this.bossFight.active) {
      if ((e.code === 'Enter' || e.code === 'Space') && this.bossFight.stage === 'DUMP') {
        e.preventDefault();
        this.handleBossTap();
      }
      return;
    }

    if ((e.code === 'Enter' || e.code === 'Space') && this.phase === 'COOKING' && this.order && !this.rippedBag.active) {
      e.preventDefault();
      if (this.dishType === 'CUON') {
        if (this.prepStep === 'TOPPINGS') {
          this.prepStep = 'SEASONING';
          this.emitHud(true);
        } else if (this.prepStep === 'SEASONING' && this.limeMeter.locked && this.chiliMeter.locked) {
          this.prepStep = 'ROLLING';
          this.emitHud(true);
        } else if (this.prepStep === 'ROLLING') {
          this.addRollProgress(22);
        } else if (this.prepStep === 'CUTTING') {
          this.serveCurrentOrder();
        }
      } else {
        if (this.prepStep === 'CUTTING') {
          this.advanceFromCutting();
        } else if (this.prepStep === 'TOPPINGS') {
          this.prepStep = 'SEASONING';
          this.emitHud(true);
        } else if (this.prepStep === 'SEASONING' && this.limeMeter.locked && this.chiliMeter.locked) {
          this.enterShakingStep();
        } else if (this.prepStep === 'SHAKING') {
          this.addShakeProgress(20, this.width * 0.5, this.height * 0.6);
        } else if (this.prepStep === 'READY') {
          this.serveCurrentOrder();
        }
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
  };

  private handleBossTap(): void {
    if (!this.bossFight.active || this.bossFight.stage !== 'DUMP') return;
    this.bossFight.taps += 1;
    this.bowlScale = 1.07;
    this.bowlShakeOffset = { x: (Math.random() - 0.5) * 14, y: (Math.random() - 0.5) * 12 };
    this.audio.playDropTopping();
    if (this.bossFight.taps >= this.bossFight.targetTaps) {
      this.bossFight.stage = 'MIX';
      this.bossFight.lastPointerAngle = null;
      this.audio.playPickup();
      this.spawnCallout(
        '🌀 ĐỦ 50 MỒI! XOAY TRÒN QUANH THAU!',
        'Quay chuột vòng tròn thật nhanh!',
        this.width * 0.5,
        this.height * 0.38,
        '#10B981'
      );
    }
    this.emitHud(true);
  }

  private executeGuardParry(): void {
    if (this.guardGrab.phase !== 'TELEGRAPH') return;
    this.guardGrab.phase = 'STUNNED';
    this.guardGrab.timer = 2.0;
    this.parrySwipeOrigin = null;
    this.boostActiveTimer = Math.max(this.boostActiveTimer, 2.0);
    this.score += 300;
    this.shakeIntensity = Math.max(this.shakeIntensity, 10);
    this.audio.playParryClash();
    const layout = computeRaidLayout(this.width, this.height);
    this.spawnParticles(this.cartX, layout.cartY + layout.cartH * 0.4, 20, '#FACC15', 'rect');
    this.spawnCallout(
      '⚔️ PHẢN ĐÒN THÀNH CÔNG!',
      'Trật tự choáng 2s! +Tốc độ & +300 điểm!',
      this.cartX,
      layout.cartY - 36,
      '#FACC15'
    );
    this.emitHud(true);
  }

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.cancelable) e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const pt = this.getCanvasPoint(touch);
      this.processInputStart(touch.identifier, pt);
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (e.cancelable) e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const pt = this.getCanvasPoint(touch);
      this.processInputMove(touch.identifier, pt);
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (e.cancelable) e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const pt = this.getCanvasPoint(touch);
      this.processInputEnd(touch.identifier, pt);
    }
  };

  private handlePointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    const pt = this.getCanvasPoint(e);
    this.processInputStart(-1, pt);
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    const pt = this.getCanvasPoint(e);
    this.processInputMove(-1, pt);
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    const pt = this.getCanvasPoint(e);
    this.processInputEnd(-1, pt);
  };

  private processInputStart(inputId: number, pt: Point2D): void {
    if (
      this.screen !== 'PLAYING' ||
      this.shopOpen ||
      this.loanModalOpen ||
      this.roomHunters.active ||
      this.diyMalfunction.active ||
      this.tarot.active ||
      (this.baziReading.active && !this.baziReading.acknowledged)
    )
      return;
    this.audio.unlock();
    this.hoverPos = pt;

    const now = performance.now();
    const touchState = {
      anchorPt: pt,
      lastPt: pt,
      lastTime: now,
      isSwiping: false,
      isRollingDrag: false,
      pointerDragRoad: false,
      parryOrigin: null as Point2D | null,
      lastBossAngle: null as number | null,
    };
    this.activeTouches.set(inputId, touchState);

    if (this.phase === 'RAID_CHASE') {
      const raidLayout = computeRaidLayout(this.width, this.height);
      if (this.guardGrab.phase === 'TELEGRAPH') {
        this.parrySwipeOrigin = pt;
        touchState.parryOrigin = pt;
      }
      if (pointInRect(pt.x, pt.y, raidLayout.boostBtn)) {
        this.triggerBoost();
        return;
      }
      this.pointerDragRoad = true;
      touchState.pointerDragRoad = true;
      this.targetPointerCartX = pt.x;
      return;
    }

    if (this.phase !== 'COOKING' || this.checkout.active || this.checkoutFinishTimer > 0) return;

    const layout = computePrepLayout(this.width, this.height);

    // Feature 5: Clickable Electric Pole ("Cột Điện Vay Nóng") on left sidewalk
    if (pointInRect(pt.x, pt.y, getElectricPoleRect(layout))) {
      this.setLoanModalOpen(true);
      return;
    }

    // Feature 1: Flow State Scissor Rhythm pad taps (multi-touch ready)
    if (this.flowRhythm.active) {
      const fl = getFlowLaneRects(layout);
      for (let i = 0; i < fl.padRects.length; i++) {
        if (pointInRect(pt.x, pt.y, fl.padRects[i]) || pointInRect(pt.x, pt.y, fl.lanes[i])) {
          this.handleFlowLaneTap(i);
          return;
        }
      }
      return;
    }

    // Mechanic 1: Ripped Bag Slow-Motion QTE catches (multi-touch ready)
    if (this.rippedBag.active) {
      for (const item of this.rippedBag.items) {
        if (!item.caught && !item.missed && Math.hypot(pt.x - item.x, pt.y - item.y) <= 60) {
          item.caught = true;
          this.audio.playPickup();
          this.spawnParticles(item.x, item.y, 10, item.isFinalQuailEgg ? '#FACC15' : '#10B981', 'circle');
          if (this.rippedBag.items.every((it) => it.caught || it.missed)) {
            this.resolveRippedBagQte();
          }
          return;
        }
      }
      return;
    }

    // Event 1 QTE clickable arrow support for touch/mouse
    if (this.tiktokQte.active) {
      const rects = getQteArrowRects(this.width, this.height);
      const curIdx = this.tiktokQte.progressIndex;
      if (curIdx < rects.length && pointInRect(pt.x, pt.y, rects[curIdx])) {
        this.handleQteInput(this.tiktokQte.sequence[curIdx]);
        return;
      }
      for (let i = curIdx + 1; i < rects.length; i++) {
        if (pointInRect(pt.x, pt.y, rects[i])) {
          this.failTiktokQte('Bấm sai thứ tự!');
          return;
        }
      }
      return;
    }

    // Mechanic 3: Street Diplomacy NPC clicks (Bà Chủ Nhà & Chú Vé Số)
    if (this.landlady.active && pointInRect(pt.x, pt.y, getLandladyRect(this.landlady.x, this.landlady.y))) {
      if (this.inventory.banh_trang >= 1) {
        this.inventory.banh_trang -= 1;
        this.spawnCallout('🧹 Đã Hối Lộ 1 Bánh Tráng!', 'Bà Chủ Nhà ngừng quét & tặng Speed Buff!', this.landlady.x, this.landlady.y - 90, '#10B981');
      } else if (this.money >= 3000) {
        this.money -= 3000;
        this.dayFinesCost += 3000;
        this.spawnCallout('🧹 Đã Hối Lộ 3.000đ!', 'Bà Chủ Nhà ngừng quét & tặng Speed Buff!', this.landlady.x, this.landlady.y - 90, '#10B981');
      } else {
        this.audio.playServeFail();
        this.spawnCallout('Không còn Bánh Tráng hay 3k!', undefined, this.landlady.x, this.landlady.y - 90, '#E11D48');
        return;
      }
      this.landlady.active = false;
      this.landlady.sweeping = false;
      this.landlady.bribed = true;
      this.dailyBuffs.landladySpeedBuff = true;
      this.audio.playPickup();
      this.spawnParticles(this.landlady.x, this.landlady.y - 50, 14, '#FACC15', 'circle');
      this.emitHud(true);
      return;
    }

    if (
      this.lotterySeller.active &&
      !this.lotterySeller.boughtThisPass &&
      pointInRect(pt.x, pt.y, getLotterySellerRect(this.lotterySeller.x, this.lotterySeller.y))
    ) {
      if (this.money >= 10000) {
        this.money -= 10000;
        this.dayFinesCost += 10000;
        this.lotteryTicketsToday += 1;
        this.lotterySeller.boughtThisPass = true;
        this.audio.playBillSnap();
        this.spawnParticles(this.lotterySeller.x, this.lotterySeller.y - 50, 12, '#22C55E', 'circle');
        this.spawnCallout(
          '🎟️ +1 Tờ Vé Số (-10.000đ)!',
          'Chờ xổ số 500.000đ cuối ngày!',
          this.lotterySeller.x,
          this.lotterySeller.y - 90,
          '#22C55E'
        );
        this.emitHud(true);
      } else {
        this.audio.playServeFail();
        this.spawnCallout('Thiếu 10.000đ mua vé số!', undefined, this.lotterySeller.x, this.lotterySeller.y - 90, '#E11D48');
      }
      return;
    }

    // Event 2: Saigon Rain raincoat clicks on active or waiting customers
    if (this.rainEvent.active) {
      const activeRect = getActiveCustomerRect(layout);
      if (this.order && !this.rainEvent.activeCustomerHasRaincoat && pointInRect(pt.x, pt.y, activeRect)) {
        this.rainEvent.activeCustomerHasRaincoat = true;
        this.audio.playPickup();
        this.spawnParticles(activeRect.x + activeRect.w * 0.5, activeRect.y + 40, 8, '#38BDF8', 'circle');
        this.spawnCallout('Đã mặc áo mưa!', undefined, activeRect.x + activeRect.w * 0.5, activeRect.y - 10, '#38BDF8');
        this.checkRainAllProtected();
        return;
      }
      const waitingRects = getWaitingCustomerRects(layout, this.waitingCustomers.length);
      for (let i = 0; i < this.waitingCustomers.length; i++) {
        const wc = this.waitingCustomers[i];
        const wr = waitingRects[i];
        if (!wc.hasRaincoat && wr && pointInRect(pt.x, pt.y, wr)) {
          wc.hasRaincoat = true;
          this.audio.playPickup();
          this.spawnParticles(wr.x + wr.w * 0.5, wr.y + 30, 8, '#38BDF8', 'circle');
          this.spawnCallout('Đã mặc áo mưa!', undefined, wr.x + wr.w * 0.5, wr.y - 10, '#38BDF8');
          this.checkRainAllProtected();
          return;
        }
      }
    }

    // Mechanic 2: Appease angry customer clicks & prioritize waiting App Shipper
    if (this.order?.isAngry && pointInRect(pt.x, pt.y, getAppeaseActiveRect(layout))) {
      this.appeaseAngryCustomer();
      return;
    }

    if (!this.bossFight.active) {
      const waitingRects = getWaitingCustomerRects(layout, this.waitingCustomers.length);
      for (let i = 0; i < this.waitingCustomers.length; i++) {
        const wc = this.waitingCustomers[i];
        const wr = waitingRects[i];
        if (!wr) continue;
        if (wc.isAngry && pointInRect(pt.x, pt.y, getAppeaseWaitingRect(wr))) {
          this.appeaseAngryCustomer(i);
          return;
        }
        if (wc.customerType === 'APP_SHIPPER' && !this.rainEvent.active && pointInRect(pt.x, pt.y, wr)) {
          this.prioritizeWaitingShipper(i);
          return;
        }
      }
    }

    // Mechanic 4: Boss Fight Giant Basin Mix multi-touch taps (tap multiple ingredients/fingers simultaneously!)
    if (this.bossFight.active) {
      if (this.bossFight.stage === 'DUMP') {
        this.handleBossTap();
      }
      return;
    }

    if (!this.order) return;

    if (this.prepStep === 'CUTTING') {
      if (pointInRect(pt.x, pt.y, layout.secondaryBtn)) {
        if (this.dishType === 'CUON') {
          this.slices = [
            createInitialRollPolygon(
              layout.boardCenterX,
              layout.boardCenterY,
              layout.rollRect.w * 0.5,
              layout.rollRect.h * 0.5,
              this.nextId
            ),
          ];
        } else {
          this.slices = [
            createInitialRicePaper(layout.boardCenterX, layout.boardCenterY, layout.boardRadius, this.nextId),
          ];
        }
        this.swipeTrail = [];
        this.audio.playDropTopping();
        return;
      }
      if (pointInRect(pt.x, pt.y, layout.primaryBtn)) {
        if (this.dishType === 'CUON') {
          this.serveCurrentOrder();
        } else {
          this.advanceFromCutting();
        }
        return;
      }
      touchState.isSwiping = true;
      this.isSwiping = true;
      this.activeCutAnchor = pt;
      this.lastSwipePoint = pt;
      this.swipeTrail = [pt];
    } else if (this.prepStep === 'TOPPINGS') {
      const primRect = { ...layout.primaryBtn, x: this.width * 0.5 - layout.primaryBtn.w * 0.5 };
      if (pointInRect(pt.x, pt.y, primRect)) {
        this.prepStep = 'SEASONING';
        this.audio.playDropTopping();
        this.emitHud(true);
        return;
      }
      // Multi-touch simultaneous topping taps
      for (const t of TOPPINGS) {
        if (pointInRect(pt.x, pt.y, layout.trayRects[t.id])) {
          this.addTopping(t.id, layout);
          return;
        }
      }
    } else if (this.prepStep === 'SEASONING') {
      const primRect = { ...layout.primaryBtn, x: this.width * 0.5 - layout.primaryBtn.w * 0.5 };
      if (pointInRect(pt.x, pt.y, primRect) && this.limeMeter.locked && this.chiliMeter.locked) {
        if (this.dishType === 'CUON') {
          this.prepStep = 'ROLLING';
          this.audio.playDropTopping();
          this.emitHud(true);
        } else {
          this.enterShakingStep();
        }
        return;
      }
      // Multi-touch: allow holding Lime and Chili simultaneously with two thumbs
      if (!this.limeMeter.locked && pointInRect(pt.x, pt.y, layout.limeHoldRect)) {
        this.limeMeter.holding = true;
        this.limeTouchId = inputId;
        return;
      }
      if (!this.chiliMeter.locked && pointInRect(pt.x, pt.y, layout.chiliHoldRect)) {
        this.chiliMeter.holding = true;
        this.chiliTouchId = inputId;
        return;
      }
    } else if (this.prepStep === 'ROLLING') {
      if (pointInRect(pt.x, pt.y, layout.rollBtn)) {
        this.addRollProgress(22);
        return;
      }
      touchState.isRollingDrag = true;
      this.isRollingDrag = true;
      this.lastRollDragY = pt.y;
    } else if (this.prepStep === 'SHAKING') {
      const distBowl = Math.hypot(pt.x - layout.bowlCenterX, pt.y - layout.bowlCenterY);
      if (pointInRect(pt.x, pt.y, layout.shakeBtn) || distBowl <= layout.bowlRadius * 1.25) {
        this.addShakeProgress(20, pt.x, pt.y);
      }
    } else if (this.prepStep === 'READY') {
      const primRect = { ...layout.primaryBtn, x: this.width * 0.5 - layout.primaryBtn.w * 0.5 };
      if (pointInRect(pt.x, pt.y, primRect)) {
        this.serveCurrentOrder();
      }
    }
  }

  private processInputMove(inputId: number, pt: Point2D): void {
    this.hoverPos = pt;
    const touchState = this.activeTouches.get(inputId);

    if (
      this.screen !== 'PLAYING' ||
      this.shopOpen ||
      this.loanModalOpen ||
      this.roomHunters.active ||
      this.diyMalfunction.active ||
      this.tarot.active ||
      (this.baziReading.active && !this.baziReading.acknowledged)
    )
      return;

    if (this.phase === 'RAID_CHASE') {
      if (this.guardGrab.phase === 'TELEGRAPH') {
        const origin = touchState?.parryOrigin ?? this.parrySwipeOrigin;
        if (!origin) {
          this.parrySwipeOrigin = pt;
          if (touchState) touchState.parryOrigin = pt;
        } else if (Math.hypot(pt.x - origin.x, pt.y - origin.y) >= 34) {
          this.executeGuardParry();
          return;
        }
      }
      if (touchState?.pointerDragRoad || this.pointerDragRoad) {
        this.targetPointerCartX = pt.x;
      }
      if (touchState) touchState.lastPt = pt;
      return;
    }

    if (this.phase !== 'COOKING' || this.tiktokQte.active || this.rippedBag.active || !this.order) {
      if (touchState) touchState.lastPt = pt;
      return;
    }

    // Mechanic 4: Boss Fight circular mixing movement around the giant basin (multi-touch friendly)
    if (this.bossFight.active) {
      if (this.bossFight.stage === 'MIX') {
        const layout = computePrepLayout(this.width, this.height);
        const cx = layout.bowlCenterX;
        const cy = layout.bowlCenterY + 10;
        const dist = Math.hypot(pt.x - cx, pt.y - cy);
        if (dist > 20 && dist < 250) {
          const angle = Math.atan2(pt.y - cy, pt.x - cx);
          const prevAngle = touchState ? touchState.lastBossAngle : this.bossFight.lastPointerAngle;
          if (prevAngle !== null) {
            let delta = angle - prevAngle;
            if (delta > Math.PI) delta -= Math.PI * 2;
            if (delta < -Math.PI) delta += Math.PI * 2;
            if (Math.abs(delta) < 1.2) {
              this.bossFight.mixAngleAccum += Math.abs(delta);
              this.bowlShakeOffset = { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 };
              if (this.shakeSoundCooldown <= 0) {
                this.audio.playShake();
                this.shakeSoundCooldown = 0.09;
              }
            }
          }
          if (touchState) {
            touchState.lastBossAngle = angle;
          }
          this.bossFight.lastPointerAngle = angle;
          this.bossFight.swirlTrail.push(pt);
          if (this.bossFight.swirlTrail.length > 22) {
            this.bossFight.swirlTrail.shift();
          }
          if (this.bossFight.mixAngleAccum >= this.bossFight.targetMixAngle) {
            this.completeBossFight(true);
          }
        }
      }
      if (touchState) touchState.lastPt = pt;
      return;
    }

    if (this.prepStep === 'ROLLING' && (touchState?.isRollingDrag || this.isRollingDrag)) {
      const prevY = touchState ? touchState.lastPt.y : this.lastRollDragY;
      const dy = prevY - pt.y;
      this.lastRollDragY = pt.y;
      if (touchState) touchState.lastPt = pt;
      if (dy > 2) {
        this.addRollProgress(dy * 0.65);
      }
      return;
    }

    if (this.prepStep === 'CUTTING' && ((touchState && touchState.isSwiping) || (inputId === -1 && this.isSwiping))) {
      const prevPt = touchState ? touchState.lastPt : this.lastSwipePoint;
      const anchor = touchState ? touchState.anchorPt : this.activeCutAnchor;
      if (prevPt) {
        const dist = Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y);
        if (dist >= 6) {
          if (anchor) {
            const cutHappened = this.performSliceSegment(anchor, pt, false);
            if (cutHappened) {
              if (touchState) touchState.anchorPt = pt;
              this.activeCutAnchor = pt;
            }
          }
          if (touchState) touchState.lastPt = pt;
          this.lastSwipePoint = pt;
          this.swipeTrail.push(pt);
          if (this.swipeTrail.length > 16) {
            this.swipeTrail.shift();
          }
        }
      }
    } else if (this.prepStep === 'SHAKING') {
      const now = performance.now();
      const layout = computePrepLayout(this.width, this.height);
      const distBowl = Math.hypot(pt.x - layout.bowlCenterX, pt.y - layout.bowlCenterY);
      const prevShakePt = touchState ? touchState.lastPt : this.lastMouseShakePos;
      const prevShakeTime = touchState ? touchState.lastTime : this.lastMouseShakeTime;
      if (distBowl <= layout.bowlRadius * 1.45 && prevShakePt) {
        const moveDist = Math.hypot(pt.x - prevShakePt.x, pt.y - prevShakePt.y);
        const dtMove = Math.max(0.008, (now - prevShakeTime) / 1000);
        const speed = moveDist / dtMove;

        // Mechanic 1: Detect violent swipe/cursor speed exceeding threshold -> Bục Đáy Bịch!
        if (speed > 1750 && moveDist > 18) {
          this.violentShakeHeat += 0.36;
          if (
            this.violentShakeHeat >= 1.0 &&
            !this.rippedBagTriggeredThisOrder &&
            this.shakeProgress > 10 &&
            this.shakeProgress < 92
          ) {
            if (touchState) {
              touchState.lastPt = pt;
              touchState.lastTime = now;
            }
            this.lastMouseShakePos = pt;
            this.lastMouseShakeTime = now;
            this.startRippedBagQte();
            return;
          }
        } else {
          this.violentShakeHeat = Math.max(0, this.violentShakeHeat - dtMove * 1.2);
        }

        if (moveDist > 12) {
          this.addShakeProgress(Math.min(8, moveDist * 0.14), pt.x, pt.y);
        }
      }
      if (touchState) {
        touchState.lastPt = pt;
        touchState.lastTime = now;
      }
      this.lastMouseShakePos = pt;
      this.lastMouseShakeTime = now;
    } else if (touchState) {
      touchState.lastPt = pt;
    }
  }

  private processInputEnd(inputId: number, pt: Point2D): void {
    const touchState = this.activeTouches.get(inputId);

    if (
      this.screen === 'PLAYING' &&
      !this.shopOpen &&
      this.phase === 'COOKING' &&
      !this.tiktokQte.active &&
      this.order &&
      this.prepStep === 'CUTTING' &&
      (touchState?.isSwiping || (inputId === -1 && this.isSwiping))
    ) {
      const anchor = touchState?.anchorPt ?? this.activeCutAnchor;
      if (anchor) {
        this.performSliceSegment(anchor, pt, true);
      }
    }

    this.activeTouches.delete(inputId);

    if (this.activeTouches.size === 0) {
      this.isSwiping = false;
      this.activeCutAnchor = null;
      this.lastSwipePoint = null;
      this.isRollingDrag = false;
      this.pointerDragRoad = false;
      this.targetPointerCartX = null;
    }

    if (this.screen === 'PLAYING' && this.phase === 'COOKING' && this.prepStep === 'SEASONING') {
      if (this.limeMeter.holding && (this.limeTouchId === null || this.limeTouchId === inputId)) {
        this.limeTouchId = null;
        this.lockSeasoningMeter(this.limeMeter, this.order?.limeTarget ?? 'VUA');
      }
      if (this.chiliMeter.holding && (this.chiliTouchId === null || this.chiliTouchId === inputId)) {
        this.chiliTouchId = null;
        this.lockSeasoningMeter(this.chiliMeter, this.order?.chiliTarget ?? 'VUA');
      }
    }
  }

  private performSliceSegment(a: Point2D, b: Point2D, allowExtendedLine: boolean): boolean {
    let anyCut = false;
    const nextSlices: PolygonSlice[] = [];
    const minArea = this.dishType === 'CUON' ? 280 : 400;

    for (const s of this.slices) {
      const split = splitPolygonBySegment(s, a, b, this.nextId, allowExtendedLine, minArea);
      if (split) {
        anyCut = true;
        nextSlices.push(split[0], split[1]);
      } else {
        nextSlices.push(s);
      }
    }

    if (anyCut) {
      this.slices = nextSlices;
      this.audio.playSlice();
      Haptics.cutRicePaper();
      this.shakeIntensity = Math.max(this.shakeIntensity, 4);

      const midX = (a.x + b.x) * 0.5;
      const midY = (a.y + b.y) * 0.5;
      this.spawnParticles(midX, midY, 8, '#FEF08A', 'circle');
      this.spawnCallout('XOẸT!', `${this.slices.length} khúc`, midX, midY - 18, '#F59E0B');
    }
    return anyCut;
  }

  private addRollProgress(amount: number): void {
    if (this.prepStep !== 'ROLLING') return;
    this.rollProgress = Math.min(100, this.rollProgress + amount);
    if (this.rollSoundCooldown <= 0) {
      this.audio.playRollTick(this.rollProgress);
      this.rollSoundCooldown = 0.07;
    }
    if (this.rollProgress >= 100) {
      const layout = computePrepLayout(this.width, this.height);
      this.slices = [
        createInitialRollPolygon(
          layout.boardCenterX,
          layout.boardCenterY,
          layout.rollRect.w * 0.5,
          layout.rollRect.h * 0.5,
          this.nextId
        ),
      ];
      this.prepStep = 'CUTTING';
      this.swipeTrail = [];
      this.audio.playSeasonResult(true);
      this.spawnParticles(layout.boardCenterX, layout.boardCenterY, 12, '#FDE047', 'circle');
      this.spawnCallout('Cuốn Chặt Tay!', 'Cắt tự do ngang dọc!', layout.boardCenterX, layout.boardCenterY - 40, '#10B981');
      this.emitHud(true);
    }
  }

  private advanceFromCutting(): void {
    this.prepStep = 'TOPPINGS';
    this.swipeTrail = [];
    this.audio.playDropTopping();
    this.emitHud(true);
  }

  private addTopping(id: ToppingId, layout: ReturnType<typeof computePrepLayout>): void {
    const r = layout.trayRects[id];
    const startX = r.x + r.w * 0.5;
    const startY = r.y + r.h * 0.5;
    const def = TOPPING_MAP[id];

    if (!this.upgrades.cursedMenu && (id === 'sau_rieng' || id === 'nuoc_cot_dua')) {
      this.audio.playServeFail();
      this.spawnCallout('Chưa Mở Khóa!', 'Mua "Nguyên Liệu Hắc Ám" trong Cửa Hàng!', startX, startY - 14, '#7C3AED');
      return;
    }

    if (id === 'kho_bo' || id === 'trung_cut' || id === 'xoai' || id === 'rau_ram') {
      if (this.inventory[id] <= 0) {
        this.audio.playServeFail();
        this.spawnCallout(`Hết ${def.shortName}!`, 'Hết hàng trong kho hôm nay!', startX, startY - 14, '#E11D48');
        this.emitHud(true);
        return;
      }
      this.inventory[id] -= 1;
    }

    this.addedToppings[id] = (this.addedToppings[id] || 0) + 1;
    const targetX =
      this.dishType === 'CUON'
        ? layout.matRect.x + layout.matRect.w * (0.25 + Math.random() * 0.5)
        : layout.bowlCenterX + (Math.random() - 0.5) * 44;
    const targetY =
      this.dishType === 'CUON'
        ? layout.matRect.y + layout.matRect.h * (0.45 + Math.random() * 0.18)
        : layout.bowlCenterY + (Math.random() - 0.5) * 44;

    this.flyingToppings.push({
      id,
      x: startX,
      y: startY,
      tx: targetX,
      ty: targetY,
      progress: 0,
      rotation: Math.random() * Math.PI * 2,
    });
    this.audio.playDropTopping();
    Haptics.addIngredient();
    this.spawnCallout(`+${def.shortName}`, undefined, startX, startY - 10, def.accentColor);
    this.emitHud(true);
  }

  private lockSeasoningMeter(meter: SeasoningMeter, target: SeasoningLevel): void {
    meter.holding = false;
    meter.locked = true;
    if (meter === this.limeMeter && this.inventory.tac > 0) {
      this.inventory.tac -= 1;
    }
    const [minT, maxT] = SEASONING_RANGE[target];
    if (meter.value >= minT && meter.value <= maxT) {
      meter.accuracy = 1;
      meter.resultLabel = 'Chuẩn vị!';
      this.audio.playSeasonResult(true);
    } else if (meter.value >= minT - 15 && meter.value <= maxT + 15) {
      meter.accuracy = 0.65;
      meter.resultLabel = 'Tạm ổn';
      this.audio.playSeasonResult(true);
    } else {
      meter.accuracy = 0.2;
      meter.resultLabel = meter.value < minT ? 'Hơi nhạt!' : 'Quá tay rồi!';
      this.audio.playSeasonResult(false);
    }
  }

  private addShakeProgress(amount: number, x: number, y: number): void {
    if (this.prepStep !== 'SHAKING') return;
    this.shakeProgress = Math.min(100, this.shakeProgress + amount);
    this.bowlScale = 1.09;
    this.bowlShakeOffset = {
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 14,
    };
    if (this.shakeSoundCooldown <= 0) {
      this.audio.playShake();
      this.shakeSoundCooldown = 0.08;
      this.spawnParticles(x, y, 4, '#F59E0B', 'circle');
      this.spawnCallout('LẮC!', undefined, x + (Math.random() - 0.5) * 40, y - 35, '#F59E0B');
    }
    if (this.shakeProgress >= 100) {
      this.prepStep = 'READY';
      this.bowlShakeOffset = { x: 0, y: 0 };
      this.audio.playSeasonResult(true);
      this.emitHud(true);
    }
  }

  private shouldTriggerRaidAfterOrder(): boolean {
    if (this.ordersSinceRaid < 2 && this.raidChanceBonus <= 0) return false;
    const maxOrders = this.upgrades.loaKeoKeo ? 3 : 4;
    if (this.ordersSinceRaid >= maxOrders) return true;
    const basePerMin = this.dayManager.pacing.policeRaidChancePerMin;
    const raidChance = Math.min(
      0.95,
      basePerMin * 1.4 + (this.upgrades.loaKeoKeo ? 0.2 : 0) + this.raidChanceBonus
    );
    return Math.random() < raidChance;
  }

  private scheduleNextCustomer(): void {
    this.order = null;
    // Endless Daily Acceleration scales spawn timer down by 10%/day with strict floor >= 2.5s
    const loaMult = this.upgrades.loaKeoKeo ? 0.8 : 1.0;
    const penaltyFactor = 1 / Math.max(0.4, 1 - this.spawnPenaltyPercentToday / 100);
    const thugFactor = this.thugsActive ? 1.5 : 1.0;
    this.customerSpawnDelay = Math.max(
      2.5,
      this.dayManager.pacing.customerSpawnTimer * loaMult * penaltyFactor * thugFactor
    );
  }

  private breakIntoSmallBillsK(amountK: number): number[] {
    const bills: number[] = [];
    let rem = amountK;
    for (const denom of [5, 2, 1]) {
      while (rem >= denom) {
        bills.push(denom);
        rem -= denom;
      }
    }
    return bills;
  }

  private openCheckoutModal(
    order: CustomerOrder,
    pendingMoney: number,
    pendingXu: number,
    pendingScore: number,
    viralMult: number
  ): void {
    const trickyBills = [16, 17, 18, 22, 23, 24, 26, 27, 28, 32, 33, 34, 36, 37, 38, 42, 43];
    const standardBills = [15, 18, 20, 22, 25, 27, 30, 32, 35, 37, 40, 42, 45];
    const useTricky = Math.random() < 0.55;

    let billK = trickyBills[Math.floor(Math.random() * trickyBills.length)];
    let paidBills: number[] = [50];
    let paidK = 50;
    let isTricky = false;

    if (useTricky) {
      const bigBill = billK >= 38 && Math.random() < 0.5 ? 100 : 50;
      const roundChanges = bigBill === 100 ? [60, 70] : [20, 30, 15, 25];
      let chosenChange: number | null = null;
      let chosenExtra = 0;

      for (const rc of roundChanges) {
        const extra = billK + rc - bigBill;
        if (extra >= 1 && extra <= 9) {
          chosenChange = rc;
          chosenExtra = extra;
          break;
        }
      }

      if (chosenChange !== null && chosenExtra > 0) {
        paidBills = [bigBill, ...this.breakIntoSmallBillsK(chosenExtra)];
        paidK = bigBill + chosenExtra;
        isTricky = true;
      } else {
        paidBills = [bigBill];
        paidK = bigBill;
      }
    } else {
      billK = standardBills[Math.floor(Math.random() * standardBills.length)];
      const bigBill = billK >= 35 && Math.random() < 0.45 ? 100 : 50;
      paidBills = [bigBill];
      paidK = bigBill;
    }

    const isRealEstate = order.customerType === 'REAL_ESTATE';
    this.checkout = {
      active: true,
      customerLabel: order.customerLabel,
      customerType: order.customerType,
      dishType: order.dishType,
      billK,
      paidK,
      paidBills,
      expectedChangeK: paidK - billK,
      givenChangeK: 0,
      selectedBills: [],
      timeLeft: this.dayManager.pacing.actionTimeLimit,
      maxTime: this.dayManager.pacing.actionTimeLimit,
      pendingMoney,
      pendingXu,
      pendingScore,
      viralMult,
      isTricky,
      discount2kAvailable: isRealEstate,
      discountAccepted: false,
      isCursedTrend: Boolean(order.isCursedTrend),
      isMasterpiece: Boolean(order.isMasterpiece),
    };

    this.isSwiping = false;
    this.activeCutAnchor = null;
    this.isRollingDrag = false;
    this.limeMeter.holding = false;
    this.chiliMeter.holding = false;
    this.rainEvent.active = false;
    this.audio.playDropTopping();
    this.emitHud(true);
  }

  public toggleRealEstateDiscount(): void {
    if (!this.checkout.active || !this.checkout.discount2kAvailable || this.checkout.discountAccepted) {
      return;
    }
    this.audio.unlock();
    this.checkout.discountAccepted = true;
    this.checkout.billK = Math.max(1, this.checkout.billK - 2);
    this.checkout.expectedChangeK = this.checkout.paidK - this.checkout.billK;
    this.audio.playPickup();
    this.emitHud(true);
  }

  public addCheckoutBill(denominationK: number): void {
    if (!this.checkout.active || this.screen !== 'PLAYING' || this.shopOpen) return;
    this.audio.unlock();
    this.checkout.selectedBills = [...this.checkout.selectedBills, denominationK];
    this.checkout.givenChangeK += denominationK;
    this.audio.playBillSnap();
    this.emitHud(true);
  }

  public undoCheckoutBill(): void {
    if (!this.checkout.active || this.checkout.selectedBills.length === 0) return;
    const next = [...this.checkout.selectedBills];
    const removed = next.pop() ?? 0;
    this.checkout.selectedBills = next;
    this.checkout.givenChangeK = Math.max(0, this.checkout.givenChangeK - removed);
    this.audio.playDropTopping();
    this.emitHud(true);
  }

  public clearCheckoutBills(): void {
    if (!this.checkout.active) return;
    this.checkout.selectedBills = [];
    this.checkout.givenChangeK = 0;
    this.audio.playDropTopping();
    this.emitHud(true);
  }

  public submitCheckout(): void {
    if (!this.checkout.active || this.screen !== 'PLAYING' || this.shopOpen) return;
    this.resolveCheckout(false);
  }

  public playMoneyAnimation(x: number, y: number, amount: number, bills?: number[], withChing = true): void {
    this.audio.unlock();
    if (withChing) {
      this.audio.playCashChing();
    }

    const layout = computePrepLayout(this.width, this.height);
    const handX = layout.customerX + 24;
    const handY = layout.customerY - 36;

    // Derive representative bill denominations from amount if explicit bills array is not supplied
    const resolvedBills =
      bills && bills.length > 0
        ? bills
        : (() => {
            const out: number[] = [];
            let remK = Math.max(1, Math.round(amount / 1000));
            for (const d of [50, 20, 10, 5, 2, 1]) {
              while (remK >= d && out.length < 10) {
                out.push(d);
                remK -= d;
              }
            }
            return out.length > 0 ? out : [10];
          })();

    resolvedBills.forEach((denomK, idx) => {
      this.flyingCash.push({
        kind: 'BILL',
        denomK,
        sx: x + (Math.random() - 0.5) * 90,
        sy: y + (Math.random() - 0.5) * 28,
        tx: handX + (Math.random() - 0.5) * 18,
        ty: handY + (Math.random() - 0.5) * 16,
        arcHeight: 85 + Math.random() * 55,
        delay: idx * 0.045,
        progress: 0,
        rotation: (Math.random() - 0.5) * 0.6,
        vRot: (Math.random() - 0.5) * 8,
      });
    });

    const coinCount = Math.min(14, Math.max(6, Math.round(amount / 5000)));
    for (let i = 0; i < coinCount; i++) {
      this.flyingCash.push({
        kind: 'COIN',
        denomK: 1,
        sx: x + (Math.random() - 0.5) * 110,
        sy: y + (Math.random() - 0.5) * 32,
        tx: handX + (Math.random() - 0.5) * 24,
        ty: handY + (Math.random() - 0.5) * 20,
        arcHeight: 105 + Math.random() * 70,
        delay: i * 0.035,
        progress: 0,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 11,
      });
    }

    // Spawn directional canvas particles (bills & coins) flying from register (x, y) toward customer's hand
    const particleCount = Math.min(18, Math.max(8, resolvedBills.length + 6));
    const billPalette = ['#86EFAC', '#FDE68A', '#BAE6FD', '#FBCFE8'];
    for (let i = 0; i < particleCount; i++) {
      const isCoin = i % 2 === 0;
      const travelTime = 0.45 + Math.random() * 0.25;
      const dx = handX - x + (Math.random() - 0.5) * 40;
      const dy = handY - y + (Math.random() - 0.5) * 30;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 20,
        vx: dx / travelTime,
        vy: dy / travelTime - 160 * travelTime,
        size: isCoin ? 11 + Math.random() * 3 : 13 + Math.random() * 4,
        color: isCoin ? '#FACC15' : billPalette[i % billPalette.length],
        alpha: 1,
        life: travelTime + 0.15,
        maxLife: travelTime + 0.15,
        rotation: (Math.random() - 0.5) * 0.8,
        vRot: (Math.random() - 0.5) * 9,
        shape: isCoin ? 'coin' : 'bill',
      });
    }
  }

  private resolveCheckout(timedOut: boolean): void {
    if (!this.checkout.active) return;
    const c = this.checkout;
    this.checkout = freshCheckout();

    const layout = computePrepLayout(this.width, this.height);
    const registerX = this.width * 0.5;
    const registerY = this.height * 0.66;
    const launchedBills = !timedOut && c.selectedBills.length > 0;

    if (!timedOut && c.givenChangeK === c.expectedChangeK) {
      const speedBonus = Math.round(Math.max(0, c.timeLeft) * 140);
      this.money += c.pendingMoney;
      this.dayRevenue += c.pendingMoney;
      this.xu += c.pendingXu;
      this.score += c.pendingScore + speedBonus;
      this.playMoneyAnimation(registerX, registerY, c.givenChangeK * 1000, c.selectedBills);
      this.spawnParticles(layout.customerX + 24, layout.customerY - 40, 22, '#FACC15', 'rect');
      this.spawnCallout(
        `+${c.pendingMoney.toLocaleString('vi-VN')}đ · +${c.pendingXu} Xu`,
        c.viralMult > 1
          ? `CHING! Thối chuẩn! VIRAL x3 (+${speedBonus}đ tốc độ)`
          : `CHING! Thối chuẩn từng đồng! (+${speedBonus}đ tốc độ)`,
        layout.customerX + 120,
        layout.customerY - 60,
        '#10B981'
      );

      // Mechanic 8: Real Estate Agent 20% chance to close a deal and tip 100k if 2k discount accepted!
      if (c.customerType === 'REAL_ESTATE' && c.discountAccepted) {
        if (Math.random() < 0.2) {
          this.money += 100000;
          this.dayRevenue += 100000;
          this.score += 1000;
          this.audio.playCashChing();
          this.spawnParticles(layout.customerX + 24, layout.customerY - 40, 32, '#22C55E', 'bill');
          this.spawnCallout(
            '🏠 CHỐT DEAL BĐS! +100.000đ TIP!',
            'Khách Sale BĐS chốt căn Penthouse, bo cực đậm!',
            this.width * 0.5,
            this.height * 0.3,
            '#22C55E'
          );
        } else {
          this.spawnCallout(
            'Đã bớt 2k lấy lộc!',
            'Sale BĐS cảm ơn! Chúc sớm chốt đơn!',
            layout.customerX + 120,
            layout.customerY - 95,
            '#38BDF8'
          );
        }
      }
    } else if (!timedOut && c.givenChangeK > c.expectedChangeK) {
      const overpaidK = c.givenChangeK - c.expectedChangeK;
      const overpaidVnd = overpaidK * 1000;
      const netMoney = Math.max(0, c.pendingMoney - overpaidVnd);
      const scorePenalty = overpaidK * 120;
      this.money += netMoney;
      this.dayRevenue += netMoney;
      this.xu += c.pendingXu;
      this.score = Math.max(0, this.score + Math.round(c.pendingScore * 0.5) - scorePenalty);
      this.playMoneyAnimation(registerX, registerY, c.givenChangeK * 1000, c.selectedBills);
      this.spawnCallout(
        `Lỗ vốn -${overpaidVnd.toLocaleString('vi-VN')}đ!`,
        `Thối dư ${overpaidK}k! Trừ ${scorePenalty} điểm lợi nhuận`,
        layout.customerX + 120,
        layout.customerY - 60,
        '#F59E0B'
      );
    } else {
      this.combo = 0;
      if (launchedBills) {
        this.playMoneyAnimation(registerX, registerY, c.givenChangeK * 1000, c.selectedBills, false);
      }
      this.failOrder(timedOut ? 'Hết giờ thối tiền!' : 'Thối thiếu tiền cho khách!', {
        severeFlavor: false,
      });
      return;
    }

    if (this.viralOrdersLeft > 0) {
      this.viralOrdersLeft -= 1;
    }

    this.ordersServed += 1;
    this.dayOrdersCompleted += 1;
    this.ordersSinceRaid += 1;

    // Mechanic 5: Cursed Menu 50% Food Poisoning Risk -> Green Sick Face + 1-Star Review (-20% spawn next day!)
    let poisoned = false;
    if (c.isCursedTrend && !timedOut && Math.random() < 0.5) {
      poisoned = true;
      this.sickCustomerTimer = 1.65;
      this.nextDayOneStarCount += 1;
      this.audio.playServeFail();
      this.spawnParticles(layout.customerX, layout.customerY - 70, 16, '#84CC16', 'circle');
      this.spawnCallout(
        '🤢 NGỘ ĐỘC THỰC PHẨM! 1 SAO ⭐',
        'Review 1 Sao giảm -20% khách ngày hôm sau!',
        layout.customerX + 120,
        layout.customerY - 125,
        '#65A30D'
      );
    }

    // Keep customer on counter briefly so flying bills & coins or sick face show clearly
    this.checkoutFinishTimer = poisoned
      ? 1.55
      : launchedBills || (!timedOut && c.givenChangeK === c.expectedChangeK)
      ? 0.65
      : 0.12;
    this.emitHud(true);
  }

  private serveCurrentOrder(): void {
    if (!this.order || this.checkout.active) return;
    const order = this.order;

    // Consume 1 rice paper unless it's Gym Bro's zero-carb bowl
    if (order.targetSlices > 0 && this.inventory.banh_trang > 0) {
      this.inventory.banh_trang -= 1;
    }

    const sliceDiff = Math.abs(this.slices.length - order.targetSlices);
    const sliceScore = order.targetSlices === 0 ? 1 : sliceDiff === 0 ? 1 : sliceDiff === 1 ? 0.6 : 0.2;

    let reqTotal = 0;
    let penalty = 0;
    for (const t of TOPPINGS) {
      const need = order.requiredToppings[t.id] || 0;
      const got = this.addedToppings[t.id] || 0;
      reqTotal += need;
      penalty += Math.abs(need - got);
    }
    const toppingScore = reqTotal > 0 ? Math.max(0, 1 - penalty / (reqTotal + 1)) : 1;
    const seasonScore = (this.limeMeter.accuracy + this.chiliMeter.accuracy) * 0.5;
    const totalAccuracy = sliceScore * 0.35 + toppingScore * 0.35 + seasonScore * 0.3;
    const viralMult = this.viralOrdersLeft > 0 ? 3 : 1;

    const tipMult =
      (this.dailyBuffs.luckyCharm ? 1.1 : 1.0) *
      (this.dailyBuffs.karmaBuff ? 1.15 : 1.0);

    // Street Fortune Teller Mode: Business Bazi Elemental Balance Judgment
    if (order.customerType === 'BUSINESS_BAZI' && order.baziProfile) {
      const limeVal = this.limeMeter.locked ? this.limeMeter.value : 0;
      const chiliVal = this.chiliMeter.locked ? this.chiliMeter.value : 0;
      const baziEval = evaluateBaziIngredientMatch(
        order.baziProfile,
        this.addedToppings,
        this.slices.length,
        limeVal,
        chiliVal
      );
      if (baziEval.matched) {
        this.dailyBuffs.karmaBuff = true;
        this.combo += 1;
        this.perfectOrders += 1;
        const massiveTip = 95000;
        const earned = Math.round(((order.baseReward + massiveTip) * tipMult * viralMult) / 1000) * 1000;
        const earnedXu = (order.baseXu + 320) * viralMult;
        const pts = 1400 * viralMult;
        this.audio.playMysticBell();
        this.spawnParticles(this.width * 0.5, this.height * 0.45, 28, '#FACC15', 'bill');
        this.spawnCallout(
          '☯️ CẢI VẬN ĐẠI CÁT! +HỒNG PHÚC (+15% BO)!',
          `Chuẩn Bát Tự ${order.baziProfile.dayMaster}! Tip cực khủng +95.000đ!`,
          this.width * 0.5,
          this.height * 0.28,
          '#10B981'
        );
        this.openCheckoutModal(order, earned, earnedXu, pts, viralMult);
      } else {
        this.combo = 0;
        this.flowPerfectCount = 0;
        order.isAngry = true;
        this.nextDayOneStarCount += 1;
        this.spawnPenaltyPercentToday = Math.min(60, this.spawnPenaltyPercentToday + 15);
        this.audio.playServeFail();
        this.shakeIntensity = Math.max(this.shakeIntensity, 10);
        const failDetail =
          baziEval.hitTaboo.length > 0
            ? `Phạm Kỵ Thần (${baziEval.hitTaboo.map((e) => ELEMENT_META[e].shortLabel).join(', ')})`
            : `Thiếu Dụng Thần (${baziEval.missingNeeded.map((e) => ELEMENT_META[e].shortLabel).join(', ')})`;
        this.failOrder(`${failDetail} — Khách mất hợp đồng, từ chối trả tiền!`, {
          severeFlavor: true,
        });
      }
      return;
    }

    // Mechanic 1 (New): Elemental Clash check on FENG_SHUI VIP orders!
    let elementalClash = false;
    if (order.elementTag) {
      if (order.forbiddenToppings) {
        for (const ft of order.forbiddenToppings) {
          if ((this.addedToppings[ft] || 0) > 0) {
            elementalClash = true;
            break;
          }
        }
      }
      if (order.forbiddenChili === 'NHIEU' && this.chiliMeter.locked && this.chiliMeter.value >= 68) {
        elementalClash = true;
      }
      if (order.forbiddenLime === 'NHIEU' && this.limeMeter.locked && this.limeMeter.value >= 68) {
        elementalClash = true;
      }
    }

    if (elementalClash) {
      this.failOrder(`Phạm ${order.elementClashText ?? 'nguyên liệu kỵ mệnh'}!`, {
        severeFlavor: true,
      });
      return;
    }

    // Mechanic 8: Special VIP Rewards when served accurately (with Elemental Harmony)!
    if (totalAccuracy >= 0.7) {
      if (order.customerType === 'FENG_SHUI' && !this.dailyBuffs.luckyCharm) {
        this.dailyBuffs.luckyCharm = true;
        const em = order.elementTag ? ELEMENT_META[order.elementTag] : null;
        this.spawnCallout(
          em ? `☯️ HỢP MỆNH ${em.shortLabel.toUpperCase()}!` : '🍀 BÙA MAY MẮN!',
          '+10% Tiền Bo cho tất cả đơn hôm nay!',
          this.width * 0.5,
          this.height * 0.28,
          '#10B981'
        );
      } else if (order.customerType === 'GYM_BRO' && !this.dailyBuffs.proteinBuff) {
        this.dailyBuffs.proteinBuff = true;
        this.spawnCallout(
          '💪 PROTEIN BUFF!',
          'Chạy xe né Trật Tự nhanh +35% hôm nay!',
          this.width * 0.5,
          this.height * 0.28,
          '#F97316'
        );
      }
    }

    if (totalAccuracy >= 0.85) {
      this.combo += 1;
      this.perfectOrders += 1;
      this.flowPerfectCount += 1;
      const earned = Math.round(((order.baseReward + this.combo * 5000) * tipMult * viralMult) / 1000) * 1000;
      const earnedXu = Math.round((order.baseXu + this.combo * 40) * viralMult);
      const pts = (Math.round(totalAccuracy * 1000) + this.combo * 150) * viralMult;
      if (this.flowPerfectCount >= 5) {
        this.spawnCallout('⚡ ĐẠT 5 ĐƠN HOÀN HẢO!', 'Khách kế tiếp kích hoạt FLOW STATE (x5 Giá)!', this.width * 0.5, this.height * 0.26, '#FACC15');
      }
      this.openCheckoutModal(order, earned, earnedXu, pts, viralMult);
    } else if (totalAccuracy >= 0.5) {
      this.combo = Math.max(0, this.combo);
      this.flowPerfectCount = 0;
      const earned = Math.max(15000, Math.round((order.baseReward * totalAccuracy * tipMult * viralMult) / 1000) * 1000);
      const earnedXu = Math.round(order.baseXu * totalAccuracy * viralMult);
      const pts = Math.round(totalAccuracy * 600) * viralMult;
      this.openCheckoutModal(order, earned, earnedXu, pts, viralMult);
    } else {
      const severeFlavor = seasonScore < 0.45 || totalAccuracy < 0.35;
      this.failOrder(
        severeFlavor ? 'Nêm sai vị quá nặng (quá mặn/cay/chua)!' : 'Làm sai công thức khách gọi!',
        { severeFlavor }
      );
    }
  }

  public clearRuinedTrash(): void {
    if (!this.ruinedBagBlocking) return;
    this.audio.unlock();
    this.ruinedBagBlocking = false;
    this.audio.playDropTopping();
    this.spawnCallout(
      '🗑️ ĐÃ VỨT BỊCH HỎNG VÀO THÙNG RÁC!',
      'Quầy đã sạch — sẵn sàng đón khách tiếp theo!',
      this.width * 0.5,
      this.height * 0.36,
      '#10B981'
    );
    if (!this.order && this.customerSpawnDelay <= 0) {
      this.scheduleNextCustomer();
    }
    this.emitHud(true);
  }

  public wipeSauceSplatter(): void {
    if (this.sauceSplatterWipes <= 0) return;
    this.audio.unlock();
    this.sauceSplatterWipes = Math.max(0, this.sauceSplatterWipes - 1);
    this.audio.playPickup();
    if (this.sauceSplatterWipes === 0) {
      this.spawnCallout(
        '✨ ĐÃ LAU SẠCH TƯƠNG ỚT!',
        'Tầm nhìn trở lại bình thường!',
        this.width * 0.5,
        this.height * 0.32,
        '#38BDF8'
      );
    }
    this.emitHud(true);
  }

  public failOrder(reason: string, options?: { severeFlavor?: boolean }): void {
    this.combo = 0;
    this.flowPerfectCount = 0;
    this.audio.playServeFail();
    Haptics.wrongOrder();
    this.shakeIntensity = Math.max(this.shakeIntensity, 10);

    // 1. Material Loss & Trash Management: Customer refuses to pay, ingredients remain lost, ruined bag blocks counter
    this.order = null;
    this.ruinedBagBlocking = true;
    this.customerSpawnDelay = 0.8;
    this.resetPrepBoard();

    this.spawnCallout(
      '❌ KHÁCH TỪ CHỐI TRẢ TIỀN!',
      `${reason} Bịch hỏng kẹt trên quầy — kéo vào Thùng Rác!`,
      this.width * 0.5,
      this.height * 0.28,
      '#E11D48'
    );

    // 2. "Bóc Phốt" (Bad Review) Debuff: 30% chance -> Recording Phone animation + next 5 customers -30% patience
    if (Math.random() < 0.3) {
      this.recordingPhoneTimer = 2.8;
      this.badRepOrdersLeft = 5;
      this.spawnCallout(
        '📱 QUAY CLIP BÓC PHỐT!',
        '5 khách tiếp theo giảm sẵn 30% thanh kiên nhẫn!',
        this.width * 0.32,
        this.height * 0.42,
        '#F59E0B'
      );
    }

    // 3. The Yelling Scene: 70% chance -> 📢 Speech bubble + +25% Police Raid Heat Bar (100% -> Immediate Raid!)
    if (Math.random() < 0.7) {
      this.yellingTimer = 2.6;
      this.policeHeat = Math.min(100, this.policeHeat + 25);
      this.raidChanceBonus = Math.min(0.6, this.raidChanceBonus + 0.15);
      this.spawnCallout(
        '📢 KHÁCH LA Ó OM SÒM! (+25% HEAT)',
        `Tiếng ồn kéo Trật Tự tới! (Mức Heat: ${this.policeHeat}%)`,
        this.width * 0.68,
        this.height * 0.42,
        '#EF4444'
      );

      if (this.policeHeat >= 100) {
        this.ruinedBagBlocking = false;
        this.triggerRaidWarning();
        return;
      }
    }

    // 4. The Sauce Splatter (Visual Blindness): Severely wrong flavor profile -> Throws Chili Sauce at screen!
    if (options?.severeFlavor) {
      this.sauceSplatterWipes = 3;
      this.spawnCallout(
        '🌶️ KHÁCH TẠT TƯƠNG ỚT LÊN MÀN HÌNH!',
        'Quẹt chuột qua lại 3 lần lên vết sốt để lau sạch!',
        this.width * 0.5,
        this.height * 0.52,
        '#DC2626'
      );
    }

    this.emitHud(true);
  }

  private triggerRaidWarning(): void {
    this.phase = 'RAID_WARNING';
    this.raidWarningTimer = 2.3;
    Haptics.policeSiren();
    this.ordersSinceRaid = 0;
    this.raidChanceBonus = 0;
    this.policeHeat = 0;
    this.ruinedBagBlocking = false;
    this.sauceSplatterWipes = 0;
    this.order = null;
    this.checkout = freshCheckout();
    this.rainEvent.active = false;
    this.tiktokQte.active = false;
    this.flowRhythm.active = false;
    this.roomHunters.active = false;
    this.diyMalfunction.active = false;
    this.baziReading.active = false;
    this.tarot.active = false;
    this.limeMeter.holding = false;
    this.chiliMeter.holding = false;
    this.isSwiping = false;
    this.activeCutAnchor = null;
    this.isRollingDrag = false;
    this.emitHud(true);
  }

  private startRaidChase(): void {
    this.phase = 'RAID_CHASE';
    this.raidTotalTime = Math.min(28, 20 + this.raidsSurvived * 2);
    this.raidTimeLeft = this.raidTotalTime;
    this.raidScrollY = 0;
    this.raidSpawnTimer = 0.55;
    this.raidSituation = 'NONE';
    this.raidSituationText = '';
    this.raidSituationTimer = 0;
    this.nextSituationTimer = 2.4;
    this.obstacles = [];
    this.invulnTimer = 0;
    this.hitFlashTimer = 0;
    this.boostActiveTimer = 0;
    this.boostCooldown = 0;
    this.shieldTimer = this.upgrades.gheBatTu ? 6.0 : 0;
    this.slipTimer = 0;
    this.slipVx = 0;
    this.truckSurgeOffset = 0;
    this.guardGrab = freshGuardGrab();
    this.parrySwipeOrigin = null;

    const layout = computeRaidLayout(this.width, this.height);
    this.cartX = layout.roadX + layout.roadW * 0.5;
    this.cartLean = 0;
    if (this.upgrades.gheBatTu) {
      this.spawnCallout('GHẾ NHỰA BẤT TỬ!', 'Kích hoạt Khiên bảo vệ đầu trận!', this.cartX, layout.cartY - 30, '#38BDF8');
    }
    this.emitHud(true);
  }

  private triggerBoost(): void {
    if (this.boostCooldown > 0 || this.boostActiveTimer > 0) return;
    this.boostActiveTimer = 1.65;
    this.boostCooldown = 4.0;
    this.audio.playPickup();
    const layout = computeRaidLayout(this.width, this.height);
    this.spawnParticles(this.cartX, layout.cartY + layout.cartH, 12, '#F59E0B', 'circle');
    this.spawnCallout('BỨT TỐC!', 'Đạp hết ga luôn!', this.cartX, layout.cartY - 24, '#FACC15');
  }

  private triggerNextRaidSituation(): void {
    const situations: RaidSituation[] = ['RAIN', 'TRUCK_SURGE', 'NINJA_CROSS', 'ROADBLOCK'];
    const next = situations[Math.floor(Math.random() * situations.length)];
    this.raidSituation = next;
    this.raidSituationTimer = 4.6;

    const layout = computeRaidLayout(this.width, this.height);
    const speedFactor = this.upgrades.depToOng ? 0.8 : 1.0;

    if (next === 'RAIN') {
      this.raidSituationText = '🌧️ MƯA RÀO SÀI GÒN! Tránh vũng nước kẻo trượt bánh!';
      this.audio.playDropTopping();
    } else if (next === 'TRUCK_SURGE') {
      this.raidSituationText = '📢 LOA PHƯỜNG! Xe Trật Tự đang ép sát từ phía sau!';
      this.audio.playSirenPulse(this.time);
    } else if (next === 'NINJA_CROSS') {
      this.raidSituationText = '🛵 BÁO ĐỘNG! Ninja Lead bật xi-nhan trái tạt đầu!';
      const fromLeft = Math.random() < 0.5;
      const startX = fromLeft ? layout.roadX + 20 : layout.roadX + layout.roadW - 20;
      this.obstacles.push({
        id: this.nextId(),
        type: 'NINJA_SCOOTER',
        label: 'Ninja Lead Tạt Đầu',
        x: startX,
        y: -70,
        vx: (fromLeft ? 1 : -1) * (155 + this.raidsSurvived * 14) * speedFactor,
        vy: 330 * speedFactor,
        width: 44,
        height: 54,
        lane: fromLeft ? 0 : 3,
        telegraphTimer: 0,
        dashedCrossed: false,
        animPhase: 0,
        hit: false,
      });
    } else if (next === 'ROADBLOCK') {
      this.raidSituationText = '🚧 LÔ CỐT ĐÀO ĐƯỜNG! Lách qua khe hở mau!';
      const openLane = Math.floor(Math.random() * layout.laneCount);
      for (let lane = 0; lane < layout.laneCount; lane++) {
        if (lane === openLane || lane === (openLane + 1) % layout.laneCount) continue;
        this.obstacles.push({
          id: this.nextId(),
          type: 'BARRIER',
          label: 'Rào Lô Cốt',
          x: layout.roadX + (lane + 0.5) * layout.laneW,
          y: -50,
          vx: 0,
          vy: (295 + this.raidsSurvived * 30) * speedFactor,
          width: layout.laneW * 0.82,
          height: 30,
          lane,
          telegraphTimer: 0,
          dashedCrossed: false,
          animPhase: 0,
          hit: false,
        });
      }
    }
  }

  private spawnRaidObstacle(): void {
    const layout = computeRaidLayout(this.width, this.height);
    const lane = Math.floor(Math.random() * layout.laneCount);
    const x = layout.roadX + (lane + 0.5) * layout.laneW;
    const speedFactor = this.upgrades.depToOng ? 0.8 : 1.0;

    const roll = Math.random();
    let type: ObstacleType = 'POTHOLE';
    let label = 'Ổ Gà';
    let vx = 0;
    let width = 54;
    let height = 38;
    let extraVy = 0;

    if (this.raidSituation === 'RAIN' && roll < 0.35) {
      type = 'PUDDLE';
      label = 'Vũng Nước Trơn';
      width = 64;
      height = 38;
    } else if (roll < 0.24) {
      type = 'POTHOLE';
      label = 'Ổ Gà';
      width = 58;
      height = 38;
    } else if (roll < 0.44) {
      type = 'DOG';
      label = 'Chó Thả Rông';
      const dir = lane === 0 ? 1 : lane === layout.laneCount - 1 ? -1 : Math.random() < 0.5 ? 1 : -1;
      vx = dir * (135 + this.raidsSurvived * 15) * speedFactor;
      width = 46;
      height = 32;
      extraVy = 35;
    } else if (roll < 0.62) {
      type = 'GOSSIP_LADY';
      label = 'Cô Hàng Xóm';
      width = 42;
      height = 42;
    } else if (roll < 0.78) {
      type = 'SHIPPER';
      label = 'Shipper Ngược Chiều';
      width = 36;
      height = 50;
      extraVy = 155;
    } else if (roll < 0.86 && this.redChairs < this.maxRedChairs) {
      type = 'PICKUP_CHAIR';
      label = '+1 Ghế Đỏ';
      width = 36;
      height = 36;
    } else if (roll < 0.93) {
      type = 'PICKUP_SHIELD';
      label = 'Trà Đá Bất Tử';
      width = 34;
      height = 34;
    } else {
      type = 'PICKUP_CASH';
      label = '+20.000đ';
      width = 40;
      height = 26;
    }

    const baseSpeed = (295 + this.raidsSurvived * 35 + (this.raidSituation === 'TRUCK_SURGE' ? 40 : 0)) * speedFactor;

    this.obstacles.push({
      id: this.nextId(),
      type,
      label,
      x,
      y: -60,
      vx,
      vy: baseSpeed + extraVy * speedFactor,
      width,
      height,
      lane,
      telegraphTimer: 0,
      dashedCrossed: false,
      animPhase: Math.random() * Math.PI * 2,
      hit: false,
    });
  }

  private startLoop(): void {
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      if (this.screen === 'PLAYING' && !this.shopOpen && !this.loanModalOpen) {
        this.update(dt);
      } else if (this.screen === 'CITY_TYCOON') {
        this.time += dt;
        this.updateCityTycoon(dt);
      }

      const bgmMode =
        this.screen !== 'PLAYING'
          ? 'NONE'
          : this.phase === 'RAID_WARNING' || this.phase === 'RAID_CHASE' || this.phase === 'WUXIA_COMBAT'
          ? 'CHAOTIC_RAID'
          : 'CHILL_LOFI';
      const bgmDucked = this.shopOpen || this.loanModalOpen || this.flowRhythm.active;
      this.audio.updateBgm(bgmMode, bgmDucked);

      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  // Mechanic 3 (New): Wuxia Street Combat ("Combat Võ Hiệp")
  public startWuxiaCombat(): void {
    this.audio.unlock();
    const stolenTipJar = 25000 + Math.floor(Math.random() * 4) * 5000;
    this.money = Math.max(0, this.money - stolenTipJar);
    this.phase = 'WUXIA_COMBAT';
    this.order = null;
    this.checkout = freshCheckout();
    this.rainEvent.active = false;
    this.tiktokQte.active = false;
    this.flowRhythm.active = false;
    this.roomHunters.active = false;
    this.diyMalfunction.active = false;
    this.baziReading.active = false;
    this.tarot.active = false;
    this.wuxiaCombat = {
      active: true,
      playerHp: 100,
      maxPlayerHp: 100,
      thiefHp: 100,
      maxThiefHp: 100,
      playerX: this.width * 0.28,
      thiefX: this.width * 0.72,
      thiefIntent: 'IDLE',
      thiefIntentTimer: 1.5,
      shurikenCd: 0,
      meleeCd: 0,
      blockTimer: 0,
      blockCd: 0,
      dodgeTimer: 0,
      dodgeCd: 0,
      slashAnimTimer: 0,
      thiefHitFlash: 0,
      playerHitFlash: 0,
      stolenTipJar,
      projectiles: [],
      statusText: 'Đạo chích giật Hũ Tiền Bo! Tung chiêu đoạt lại ngay!',
    };
    this.audio.playServeFail();
    this.shakeIntensity = Math.max(this.shakeIntensity, 10);
    this.spawnCallout(
      '🥷 TRỘM GIẬT HŨ TIỀN BO!',
      `Đoạt lại ${stolenTipJar.toLocaleString('vi-VN')}đ + Thưởng Võ Hiệp!`,
      this.width * 0.5,
      this.height * 0.34,
      '#E11D48'
    );
    this.emitHud(true);
  }

  public wuxiaShuriken(): void {
    if (this.phase !== 'WUXIA_COMBAT' || !this.wuxiaCombat.active) return;
    const wc = this.wuxiaCombat;
    if (wc.shurikenCd > 0) return;
    this.audio.unlock();
    wc.shurikenCd = 0.55;
    wc.projectiles.push({
      id: this.nextId(),
      x: wc.playerX + 36,
      y: this.height * 0.72 - 78,
      vx: 780,
      rotation: 0,
    });
    wc.statusText = 'Phi Tiêu Bánh Tráng phóng ra!';
    this.audio.playShurikenThrow();
    this.emitHud(true);
  }

  public wuxiaMelee(): void {
    if (this.phase !== 'WUXIA_COMBAT' || !this.wuxiaCombat.active) return;
    const wc = this.wuxiaCombat;
    if (wc.meleeCd > 0) return;
    this.audio.unlock();
    wc.meleeCd = 0.65;
    wc.slashAnimTimer = 0.24;
    this.audio.playSwordSlash();

    // Dash closer toward thief
    wc.playerX = Math.min(wc.thiefX - 88, wc.playerX + 120);
    const dist = Math.abs(wc.thiefX - wc.playerX);
    if (dist <= 190) {
      const dmg = wc.thiefIntent === 'STUNNED' ? 32 : 24;
      wc.thiefHp = Math.max(0, wc.thiefHp - dmg);
      wc.thiefHitFlash = 0.18;
      this.shakeIntensity = Math.max(this.shakeIntensity, 8);
      this.spawnParticles(wc.thiefX, this.height * 0.72 - 75, 12, '#FACC15', 'rect');
      this.spawnCallout(`-${dmg} HP`, 'Chém Kiếm Kẹp Đá!', wc.thiefX, this.height * 0.72 - 140, '#FACC15');
      wc.statusText = `Chém Kiếm Kẹp Đá trúng đích (-${dmg} HP)!`;
      if (wc.thiefHp <= 0) {
        this.finishWuxiaCombat(true);
        return;
      }
    } else {
      wc.statusText = 'Áp sát vung Kiếm Kẹp Đá!';
    }
    this.emitHud(true);
  }

  public wuxiaBlock(): void {
    if (this.phase !== 'WUXIA_COMBAT' || !this.wuxiaCombat.active) return;
    const wc = this.wuxiaCombat;
    if (wc.blockCd > 0) return;
    this.audio.unlock();
    wc.blockTimer = 0.7;
    wc.blockCd = 1.3;
    wc.statusText = 'Thủ thế Kiếm Kẹp Đá đỡ đòn!';
    this.audio.playBlockClang();
    this.emitHud(true);
  }

  public wuxiaDodge(): void {
    if (this.phase !== 'WUXIA_COMBAT' || !this.wuxiaCombat.active) return;
    const wc = this.wuxiaCombat;
    if (wc.dodgeCd > 0) return;
    this.audio.unlock();
    wc.dodgeTimer = 0.55;
    wc.dodgeCd = 1.2;
    wc.playerX = Math.max(110, wc.playerX - 95);
    wc.statusText = 'Lộn người né đòn chớp nhoáng!';
    this.audio.playDodgeWhoosh();
    this.emitHud(true);
  }

  private updateWuxiaCombat(dt: number): void {
    const wc = this.wuxiaCombat;
    if (!wc.active) return;

    wc.shurikenCd = Math.max(0, wc.shurikenCd - dt);
    wc.meleeCd = Math.max(0, wc.meleeCd - dt);
    wc.blockTimer = Math.max(0, wc.blockTimer - dt);
    wc.blockCd = Math.max(0, wc.blockCd - dt);
    wc.dodgeTimer = Math.max(0, wc.dodgeTimer - dt);
    wc.dodgeCd = Math.max(0, wc.dodgeCd - dt);
    wc.slashAnimTimer = Math.max(0, wc.slashAnimTimer - dt);
    wc.thiefHitFlash = Math.max(0, wc.thiefHitFlash - dt);
    wc.playerHitFlash = Math.max(0, wc.playerHitFlash - dt);

    // Move projectiles
    for (let i = wc.projectiles.length - 1; i >= 0; i--) {
      const sh = wc.projectiles[i];
      sh.x += sh.vx * dt;
      sh.rotation += dt * 18;
      if (Math.abs(sh.x - wc.thiefX) <= 40) {
        wc.projectiles.splice(i, 1);
        const dmg = wc.thiefIntent === 'STUNNED' ? 22 : 16;
        wc.thiefHp = Math.max(0, wc.thiefHp - dmg);
        wc.thiefHitFlash = 0.16;
        this.audio.playDropTopping();
        this.spawnParticles(wc.thiefX, this.height * 0.72 - 80, 10, '#FEF3C7', 'rect');
        this.spawnCallout(`-${dmg} HP`, 'Phi Tiêu Bánh Tráng!', wc.thiefX, this.height * 0.72 - 140, '#38BDF8');
        if (wc.thiefHp <= 0) {
          this.finishWuxiaCombat(true);
          return;
        }
        continue;
      }
      if (sh.x > this.width + 60) {
        wc.projectiles.splice(i, 1);
      }
    }

    // Gentle spacing restore
    const idealPx = this.width * 0.28;
    if (wc.slashAnimTimer <= 0 && wc.dodgeTimer <= 0) {
      wc.playerX += (idealPx - wc.playerX) * Math.min(1, dt * 1.4);
    }

    // Thief AI state machine
    wc.thiefIntentTimer -= dt;
    if (wc.thiefIntent === 'IDLE') {
      const targetTx = this.width * 0.72 + Math.sin(this.time * 2.5) * 45;
      wc.thiefX += (targetTx - wc.thiefX) * Math.min(1, dt * 3);
      if (wc.thiefIntentTimer <= 0) {
        wc.thiefIntent = 'TELEGRAPH';
        wc.thiefIntentTimer = 0.85;
        wc.statusText = '⚠️ Đạo chích sắp lao tới! Bấm Đỡ (L) hoặc Né (Space)!';
        this.audio.playPickup();
      }
    } else if (wc.thiefIntent === 'TELEGRAPH') {
      if (wc.thiefIntentTimer <= 0) {
        wc.thiefIntent = 'LUNGE';
        wc.thiefIntentTimer = 0.3;
        wc.thiefX = wc.playerX + 75;
        // Resolve strike!
        if (wc.blockTimer > 0) {
          // Perfect Block & Counter!
          wc.thiefIntent = 'STUNNED';
          wc.thiefIntentTimer = 2.1;
          wc.thiefHp = Math.max(0, wc.thiefHp - 14);
          wc.thiefHitFlash = 0.25;
          this.audio.playParryClash();
          this.shakeIntensity = 12;
          this.spawnParticles(wc.playerX + 35, this.height * 0.72 - 80, 18, '#38BDF8', 'rect');
          this.spawnCallout('🛡️ PHẢN KIẾM! -14 HP', 'Đạo chích choáng 2s!', wc.thiefX, this.height * 0.72 - 150, '#38BDF8');
          wc.statusText = 'Đỡ chuẩn! Đạo chích bị choáng 2 giây — phản công ngay!';
          if (wc.thiefHp <= 0) {
            this.finishWuxiaCombat(true);
            return;
          }
        } else if (wc.dodgeTimer > 0) {
          this.audio.playDodgeWhoosh();
          this.spawnCallout('💨 NÉ ĐÒN!', 'Tránh gọn cú chém!', wc.playerX, this.height * 0.72 - 150, '#10B981');
          wc.statusText = 'Né đòn thành công!';
        } else {
          wc.playerHp = Math.max(0, wc.playerHp - 22);
          wc.playerHitFlash = 0.25;
          this.audio.playServeFail();
          this.shakeIntensity = 12;
          this.spawnCallout('-22 HP', 'Dính đòn Đạo Chích!', wc.playerX, this.height * 0.72 - 150, '#E11D48');
          wc.statusText = 'Trúng đòn! Canh nhịp Đỡ (L) hoặc Né (Space)!';
          if (wc.playerHp <= 0) {
            this.finishWuxiaCombat(false);
            return;
          }
        }
      }
    } else if (wc.thiefIntent === 'LUNGE') {
      if (wc.thiefIntentTimer <= 0) {
        wc.thiefIntent = 'IDLE';
        wc.thiefIntentTimer = 1.4;
      }
    } else if (wc.thiefIntent === 'STUNNED') {
      if (wc.thiefIntentTimer <= 0) {
        wc.thiefIntent = 'IDLE';
        wc.thiefIntentTimer = 1.3;
      }
    }
  }

  private finishWuxiaCombat(won: boolean): void {
    const tipJar = this.wuxiaCombat.stolenTipJar;
    this.wuxiaCombat = freshWuxiaCombat();
    this.phase = 'COOKING';

    if (won) {
      const bonus = 50000;
      const totalGain = tipJar + bonus;
      this.money += totalGain;
      this.dayRevenue += bonus;
      this.xu += 350;
      this.score += 800;
      this.audio.playCashChing();
      this.audio.playRaidWin();
      this.spawnParticles(this.width * 0.5, this.height * 0.5, 28, '#FACC15', 'bill');
      this.spawnCallout(
        `🏆 ĐOẠT LẠI HŨ TIỀN! +${totalGain.toLocaleString('vi-VN')}đ`,
        `Lấy lại ${tipJar.toLocaleString('vi-VN')}đ + Thưởng +50k & +350 Xu!`,
        this.width * 0.5,
        this.height * 0.34,
        '#10B981'
      );
      this.scheduleNextCustomer();
    } else {
      this.redChairs -= 1;
      this.audio.playChairBreak();
      this.spawnCallout(
        '💔 Đạo Chích Chạy Thoát! -1 Ghế Đỏ',
        `Mất Hũ Tiền ${tipJar.toLocaleString('vi-VN')}đ!`,
        this.width * 0.5,
        this.height * 0.34,
        '#E11D48'
      );
      if (this.redChairs <= 0) {
        this.redChairs = 0;
        this.screen = 'GAME_OVER';
        this.gameOverReason = 'Thua trận trước Đạo Chích Vỉa Hè và vỡ sạch Ghế Nhựa Đỏ!';
      } else {
        this.scheduleNextCustomer();
      }
    }
    this.emitHud(true);
  }

  private update(dt: number): void {
    this.time += dt;

    // Day/Night shift clock ticks during active play (pauses during modal minigames)
    if (
      this.screen === 'PLAYING' &&
      !this.shopOpen &&
      !this.loanModalOpen &&
      !this.checkout.active &&
      !this.tiktokQte.active &&
      !this.bossFight.active &&
      !this.rippedBag.active &&
      !this.flowRhythm.active &&
      !this.roomHunters.active &&
      !this.diyMalfunction.active &&
      !this.tarot.active &&
      !(this.baziReading.active && !this.baziReading.acknowledged)
    ) {
      this.dayElapsedTime += dt;
      if (this.dayDuration > 0) {
        this.dayTimeLeft = Math.max(0, this.dayTimeLeft - dt);
        if (this.dayTimeLeft <= 0) {
          this.endOfDayPending = true;
        }
      }
    }

    if (this.shakeIntensity > 0.1) {
      this.shakeIntensity *= Math.exp(-12 * dt);
      this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
    } else {
      this.shakeIntensity = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    }

    this.updateParticlesAndCallouts(dt);

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    if (this.phase === 'COOKING') {
      if (this.endOfDayPending && !this.checkout.active && this.checkoutFinishTimer <= 0 && !this.bossFight.active) {
        this.endCurrentDay('');
        return;
      }
      this.updateCooking(dt);
    } else if (this.phase === 'WUXIA_COMBAT') {
      this.updateWuxiaCombat(dt);
    } else if (this.phase === 'RAID_WARNING') {
      this.raidWarningTimer -= dt;
      this.audio.playSirenPulse(this.time);
      this.shakeIntensity = Math.max(this.shakeIntensity, 4);
      if (this.raidWarningTimer <= 0) {
        this.startRaidChase();
      }
    } else if (this.phase === 'RAID_CHASE') {
      this.updateRaidChase(dt);
    }

    this.emitHud(false);
  }

  private updateCooking(dt: number): void {
    if (!this.isSwiping && this.swipeTrail.length > 0) {
      this.swipeTrail.shift();
    }

    if (this.rollSoundCooldown > 0) {
      this.rollSoundCooldown -= dt;
    }
    if (this.sickCustomerTimer > 0) {
      this.sickCustomerTimer = Math.max(0, this.sickCustomerTimer - dt);
    }
    if (this.dayBannerTimer > 0) {
      this.dayBannerTimer = Math.max(0, this.dayBannerTimer - dt);
    }

    // Periodic Police Raid Frequency check scaled by DayManager (<= 40% per minute)
    if (
      this.ordersServed >= 2 &&
      !this.checkout.active &&
      !this.bossFight.active &&
      !this.flowRhythm.active &&
      !this.diyMalfunction.active &&
      !this.roomHunters.active &&
      !this.tarot.active &&
      (!this.baziReading.active || this.baziReading.acknowledged) &&
      !this.endOfDayPending
    ) {
      this.perMinuteRaidCheckTimer -= dt;
      if (this.perMinuteRaidCheckTimer <= 0) {
        this.perMinuteRaidCheckTimer = 15;
        const pPer15s = 1 - Math.pow(1 - this.dayManager.pacing.policeRaidChancePerMin, 0.25);
        if (this.ordersSinceRaid >= 1 && Math.random() < pPer15s) {
          this.triggerRaidWarning();
          return;
        }
      }
    }

    const layout = computePrepLayout(this.width, this.height);

    // Handle Bóc Phốt Mode countdown (10s with no customers)
    if (this.bocPhotTimer > 0) {
      this.bocPhotTimer = Math.max(0, this.bocPhotTimer - dt);
      if (this.bocPhotTimer <= 0) {
        this.fillWaitingQueue();
        this.spawnNextOrder(false);
        this.spawnCallout('HẾT BÓC PHỐT!', 'Khách bắt đầu quay lại!', this.width * 0.5, this.height * 0.36, '#10B981');
        this.emitHud(true);
      }
      return;
    }

    if (this.recordingPhoneTimer > 0) {
      this.recordingPhoneTimer = Math.max(0, this.recordingPhoneTimer - dt);
    }
    if (this.yellingTimer > 0) {
      this.yellingTimer = Math.max(0, this.yellingTimer - dt);
    }

    // Handle brief customer transition delay (blocked until ruined trash bag is dragged to Trash Can!)
    if (!this.order && this.customerSpawnDelay > 0 && !this.ruinedBagBlocking) {
      this.customerSpawnDelay -= dt;
      if (this.customerSpawnDelay <= 0) {
        this.spawnNextOrder(true);
        this.emitHud(true);
      }
    }

    // Brief handoff pause so flying bills & coins reach customer's hand before switching
    if (this.checkoutFinishTimer > 0) {
      this.checkoutFinishTimer = Math.max(0, this.checkoutFinishTimer - dt);
      if (this.checkoutFinishTimer <= 0) {
        if (this.shouldTriggerRaidAfterOrder()) {
          this.triggerRaidWarning();
        } else if (
          this.ordersServed >= 1 &&
          !this.endOfDayPending &&
          this.money >= 25000 &&
          Math.random() < 0.14
        ) {
          this.startWuxiaCombat();
          return;
        } else {
          this.scheduleNextCustomer();
        }
        this.emitHud(true);
      }
      return;
    }

    // Mechanic 6: Mental Math Checkout 5s countdown (pauses customer patience & rain)
    if (this.checkout.active) {
      this.checkout.timeLeft = Math.max(0, this.checkout.timeLeft - dt);
      if (this.checkout.timeLeft <= 0) {
        this.resolveCheckout(true);
      }
      return;
    }

    // Event 1: Chiến thần Tóp Tóp QTE timer
    if (this.tiktokQte.active) {
      if (this.tiktokQte.wrongFlash > 0) {
        this.tiktokQte.wrongFlash = Math.max(0, this.tiktokQte.wrongFlash - dt);
      }
      this.tiktokQte.timeLeft -= dt;
      if (this.tiktokQte.timeLeft <= 0) {
        this.failTiktokQte('Hết 3 giây!');
      }
      return;
    }

    // Feature 3: Room Hunters Dialogue Choice pauses timers
    if (this.roomHunters.active) {
      return;
    }

    // Street Fortune Teller overlays pause cooking timers
    if ((this.baziReading.active && !this.baziReading.acknowledged) || this.tarot.active) {
      return;
    }

    // Feature 4: DIY Mixing Machine Wire Puzzle countdown
    if (this.diyMalfunction.active) {
      if (this.diyMalfunction.wrongFlash > 0) {
        this.diyMalfunction.wrongFlash = Math.max(0, this.diyMalfunction.wrongFlash - dt);
      }
      this.diyMalfunction.timeLeft = Math.max(0, this.diyMalfunction.timeLeft - dt);
      if (this.diyMalfunction.timeLeft <= 0) {
        this.resolveDiyMalfunction(false);
      }
      return;
    }

    // Feature 1: Flow State Scissor Rhythm Minigame update
    if (this.flowRhythm.active) {
      const fr = this.flowRhythm;
      if (fr.lastJudgmentTimer > 0) {
        fr.lastJudgmentTimer = Math.max(0, fr.lastJudgmentTimer - dt);
      }
      for (let i = 0; i < 4; i++) {
        if (fr.laneFlashTimers[i] > 0) {
          fr.laneFlashTimers[i] = Math.max(0, fr.laneFlashTimers[i] - dt);
        }
      }
      if (fr.finishingTimer > 0) {
        fr.finishingTimer = Math.max(0, fr.finishingTimer - dt);
        if (fr.finishingTimer <= 0) {
          this.finishFlowRhythm();
        }
        return;
      }
      fr.elapsed += dt;
      const beatIdx = Math.floor(fr.elapsed / fr.beatInterval);
      if (beatIdx > fr.lastBeatIndex) {
        fr.lastBeatIndex = beatIdx;
        this.audio.playScissorSnip(beatIdx % 2 === 0);
      }
      for (const note of fr.notes) {
        if (!note.judged && fr.elapsed - note.hitTime > 0.25) {
          note.judged = true;
          note.result = 'MISS';
          fr.missed += 1;
          fr.combo = 0;
          fr.lastJudgmentText = 'MISS!';
          fr.lastJudgmentColor = '#FB7185';
          fr.lastJudgmentTimer = 0.45;
        }
      }
      if (fr.notes.every((n) => n.judged)) {
        this.beginFinishFlowRhythm();
      }
      return;
    }

    // Mechanic 1: Ripped Bag Slow-Motion QTE (2.0s)
    if (this.rippedBag.active) {
      this.rippedBag.timeLeft = Math.max(0, this.rippedBag.timeLeft - dt);
      for (const item of this.rippedBag.items) {
        if (item.caught || item.missed) continue;
        item.x += item.vx * dt;
        item.y += item.vy * dt;
        item.rotation += item.vRot * dt;
        if (item.y > this.height - 20) {
          item.missed = true;
        }
      }
      if (
        this.rippedBag.timeLeft <= 0 ||
        this.rippedBag.items.every((it) => it.caught || it.missed)
      ) {
        this.resolveRippedBagQte();
      }
      return;
    }

    // Mechanic 4: End-of-Day Boss Fight (final 15% / 18s of timed shift, or 6+ orders in Endless)
    const bossTimeWindow =
      this.dayDuration > 0
        ? this.dayTimeLeft <= Math.min(18, this.dayDuration * 0.15) && this.dayTimeLeft > 1
        : this.dayOrdersCompleted >= 6;
    if (
      !this.bossFight.active &&
      !this.bossFightRolledToday &&
      bossTimeWindow &&
      !this.rainEvent.active &&
      this.order
    ) {
      this.bossFightRolledToday = true;
      if (Math.random() < 0.2) {
        this.startBossFight();
        return;
      }
    }

    if (this.bossFight.active) {
      this.bowlScale += (1 - this.bowlScale) * Math.min(1, dt * 14);
      this.bowlShakeOffset.x *= Math.exp(-16 * dt);
      this.bowlShakeOffset.y *= Math.exp(-16 * dt);
      if (this.shakeSoundCooldown > 0) this.shakeSoundCooldown -= dt;
      this.bossFight.timeLeft = Math.max(0, this.bossFight.timeLeft - dt);
      if (this.bossFight.timeLeft <= 0) {
        this.completeBossFight(false);
      }
      return;
    }

    // Mechanic 3: Street Diplomacy NPCs (Bà Chủ Nhà & Chú Vé Số)
    if (this.landlady.active) {
      this.landlady.timer -= dt;
      if (this.landlady.timer <= 0) {
        this.landlady.active = false;
        this.landlady.sweeping = false;
      }
    } else if (!this.landlady.bribed && this.order && this.ordersServed >= 1) {
      this.landladyCooldown -= dt;
      if (this.landladyCooldown <= 0) {
        this.landladyCooldown = 22 + Math.random() * 14;
        this.landlady = {
          active: true,
          sweeping: true,
          x: Math.max(this.width - 135, layout.bubbleRect.x + layout.bubbleRect.w + 90),
          y: layout.counterY - 6,
          bribed: false,
          timer: 10.0,
        };
        this.spawnCallout('🧹 BÀ CHỦ NHÀ QUÉT BỤI!', 'Bấm vào bả hối lộ 1 Bánh Tráng để hết mù!', this.landlady.x - 40, this.landlady.y - 105, '#D97706');
      }
    }

    if (this.lotterySeller.active) {
      this.lotterySeller.x += this.lotterySeller.dir * 72 * dt;
      if (
        (this.lotterySeller.dir === 1 && this.lotterySeller.x > this.width + 60) ||
        (this.lotterySeller.dir === -1 && this.lotterySeller.x < -60)
      ) {
        this.lotterySeller.active = false;
      }
    } else if (this.order) {
      this.lotteryCooldown -= dt;
      if (this.lotteryCooldown <= 0) {
        this.lotteryCooldown = 16 + Math.random() * 14;
        const fromLeft = Math.random() < 0.5;
        this.lotterySeller = {
          active: true,
          x: fromLeft ? -30 : this.width + 30,
          y: layout.counterY - 6,
          dir: fromLeft ? 1 : -1,
          boughtThisPass: false,
        };
      }
    }

    // Event 2: Sudden Saigon Rain random trigger & countdown
    if (this.rainEvent.active) {
      this.rainEvent.timeLeft -= dt;
      if (this.rainEvent.timeLeft <= 0) {
        this.rainEvent.active = false;
        let lostWaiting = 0;
        this.waitingCustomers = this.waitingCustomers.filter((wc) => {
          if (!wc.hasRaincoat) {
            lostWaiting += 1;
            return false;
          }
          return true;
        });
        if (lostWaiting > 0) {
          this.score = Math.max(0, this.score - lostWaiting * 150);
          this.spawnCallout(
            `-${lostWaiting * 150} điểm`,
            `${lostWaiting} khách xếp hàng chạy mưa mất tiêu!`,
            layout.bubbleRect.x + layout.bubbleRect.w + 40,
            layout.counterY - 70,
            '#E11D48'
          );
        }
        this.fillWaitingQueue();

        if (this.order && !this.rainEvent.activeCustomerHasRaincoat) {
          this.score = Math.max(0, this.score - 250);
          this.combo = 0;
          this.audio.playServeFail();
          this.spawnCallout(
            'KHÁCH BỎ VỀ VÌ MƯA!',
            '-250 điểm! Chậm phát áo mưa rồi!',
            layout.customerX + 100,
            layout.customerY - 55,
            '#E11D48'
          );
          this.scheduleNextCustomer();
        }
        this.emitHud(true);
      }
    } else if (this.order && this.ordersServed >= 1) {
      this.rainCooldownTimer -= dt;
      if (this.rainCooldownTimer <= 0) {
        this.rainCooldownTimer = 18 + Math.random() * 14;
        this.startSaigonRain();
      }
    }

    // Track waitAge in queue & detect Shipper priority conflict when a Shipper is served while older local customers wait
    for (const wc of this.waitingCustomers) {
      wc.waitAge += dt;
    }

    const boardHalfW = this.dishType === 'CUON' ? layout.rollRect.w * 0.58 : layout.boardRadius * 1.15;
    const boardHalfH = layout.boardRadius * 0.9;

    for (const s of this.slices) {
      if (s.hitFlash > 0) s.hitFlash = Math.max(0, s.hitFlash - dt * 5);
      if (Math.abs(s.vx) > 0.5 || Math.abs(s.vy) > 0.5) {
        const dx = s.vx * dt;
        const dy = s.vy * dt;
        s.cx += dx;
        s.cy += dy;
        for (const p of s.points) {
          p.x += dx;
          p.y += dy;
        }
        s.vx *= Math.exp(-7 * dt);
        s.vy *= Math.exp(-7 * dt);
        s.angle += s.va * dt;
        s.va *= Math.exp(-7 * dt);

        const clampDx =
          s.cx < layout.boardCenterX - boardHalfW
            ? layout.boardCenterX - boardHalfW - s.cx
            : s.cx > layout.boardCenterX + boardHalfW
            ? layout.boardCenterX + boardHalfW - s.cx
            : 0;
        const clampDy =
          s.cy < layout.boardCenterY - boardHalfH
            ? layout.boardCenterY - boardHalfH - s.cy
            : s.cy > layout.boardCenterY + boardHalfH
            ? layout.boardCenterY + boardHalfH - s.cy
            : 0;
        if (clampDx !== 0 || clampDy !== 0) {
          s.cx += clampDx;
          s.cy += clampDy;
          for (const p of s.points) {
            p.x += clampDx;
            p.y += clampDy;
          }
        }
      }
    }

    for (let i = this.flyingToppings.length - 1; i >= 0; i--) {
      const ft = this.flyingToppings[i];
      ft.progress += dt * 4.5;
      ft.rotation += dt * 8;
      if (ft.progress >= 1) {
        this.bowlIngredients.push({
          id: ft.id,
          ox: (Math.random() - 0.5) * 1.1,
          oy: (Math.random() - 0.5) * 1.1,
          rotation: Math.random() * Math.PI * 2,
          scale: 0.9,
        });
        this.bowlScale = 1.08;
        this.flyingToppings.splice(i, 1);
      }
    }

    this.bowlScale += (1 - this.bowlScale) * Math.min(1, dt * 14);
    this.bowlShakeOffset.x *= Math.exp(-16 * dt);
    this.bowlShakeOffset.y *= Math.exp(-16 * dt);
    if (this.shakeSoundCooldown > 0) {
      this.shakeSoundCooldown -= dt;
    }

    // Feature 4: DIY Mixing Machine automates Phase 1 mixing at 2x speed!
    if (this.upgrades.diyMixer && this.prepStep === 'SHAKING' && !this.diyMalfunction.active) {
      this.addShakeProgress(dt * 44, layout.bowlCenterX, layout.bowlCenterY);
    }

    const updateMeter = (m: SeasoningMeter) => {
      if (!m.holding || m.locked) return;
      m.value += m.direction * 98 * dt;
      if (m.value >= 100) {
        m.value = 100;
        m.direction = -1;
      } else if (m.value <= 0) {
        m.value = 0;
        m.direction = 1;
      }
      this.squeezeTickTimer -= dt;
      if (this.squeezeTickTimer <= 0) {
        this.audio.playSqueezeTick(m.value);
        this.squeezeTickTimer = 0.06;
      }
    };
    updateMeter(this.limeMeter);
    updateMeter(this.chiliMeter);

    if (this.order) {
      this.order.waitAge = (this.order.waitAge ?? 0) + dt;
      const angryMult = this.order.isAngry ? 1.4 : 1.0;
      this.order.patience -= dt * this.order.patienceDrainRate * angryMult;
      if (this.order.patience <= 0) {
        this.combo = 0;
        this.rainEvent.active = false;
        this.audio.playServeFail();
        Haptics.wrongOrder();
        this.spawnCallout(
          'Khách bỏ đi!',
          'Đợi lâu quá trời ơi!',
          layout.customerX + 90,
          layout.customerY - 50,
          '#E11D48'
        );
        this.ordersServed += 1;
        this.ordersSinceRaid += 1;
        if (this.shouldTriggerRaidAfterOrder()) {
          this.triggerRaidWarning();
        } else {
          this.scheduleNextCustomer();
        }
        this.emitHud(true);
      }
    }
  }

  private updateRaidChase(dt: number): void {
    const layout = computeRaidLayout(this.width, this.height);
    const boostMult = this.boostActiveTimer > 0 ? 1.85 : 1;
    const sandalsFactor = this.upgrades.depToOng ? 0.8 : 1.0;
    const roadSpeed = (320 + this.raidsSurvived * 35) * boostMult * sandalsFactor;

    this.raidScrollY += roadSpeed * dt;
    this.raidTimeLeft -= dt * boostMult;
    this.audio.playSirenPulse(this.time * (this.raidSituation === 'TRUCK_SURGE' ? 1.2 : 0.8));

    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.boostActiveTimer > 0) this.boostActiveTimer = Math.max(0, this.boostActiveTimer - dt);
    if (this.boostCooldown > 0) this.boostCooldown = Math.max(0, this.boostCooldown - dt);
    if (this.shieldTimer > 0) this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    if (this.slipTimer > 0) this.slipTimer = Math.max(0, this.slipTimer - dt);

    // Feature 2: Urban Guard Grab & Parry timing state machine!
    if (this.guardGrab.phase === 'IDLE') {
      this.guardGrab.cooldown -= dt;
      if (this.guardGrab.cooldown <= 0 && this.raidTimeLeft > 2.2) {
        this.guardGrab.phase = 'TELEGRAPH';
        this.guardGrab.timer = 0.5;
        this.guardGrab.maxTimer = 0.5;
        this.guardGrab.side = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
        this.parrySwipeOrigin = null;
        this.audio.playSirenPulse(this.time + 0.13);
      }
    } else if (this.guardGrab.phase === 'TELEGRAPH') {
      this.guardGrab.timer -= dt;
      if (this.guardGrab.timer <= 0) {
        // Missed Parry timing -> Instant HP loss!
        this.guardGrab.phase = 'IDLE';
        this.guardGrab.cooldown = 4.8;
        this.redChairs -= 1;
        this.dayFinesCost += 10000;
        this.invulnTimer = 1.1;
        this.hitFlashTimer = 0.16;
        this.shakeIntensity = 15;
        this.audio.playChairBreak();
        this.spawnParticles(this.cartX, layout.cartY + layout.cartH * 0.5, 10, '#EF4444', 'chair');
        this.spawnCallout(
          'HỤT PHẢN ĐÒN! -1 GHẾ!',
          'Bị Trật Tự chụp xe (+10k phạt)!',
          this.cartX,
          layout.cartY - 34,
          '#E11D48'
        );
        if (this.redChairs <= 0) {
          this.redChairs = 0;
          this.screen = 'GAME_OVER';
          this.gameOverReason = 'Không kịp phản đòn cú chụp xe của Trật tự đô thị! Đổ sạch Ghế Nhựa Đỏ.';
          this.emitHud(true);
          return;
        }
        this.emitHud(true);
      }
    } else if (this.guardGrab.phase === 'STUNNED') {
      this.guardGrab.timer -= dt;
      if (this.guardGrab.timer <= 0) {
        this.guardGrab.phase = 'IDLE';
        this.guardGrab.cooldown = 4.6;
      }
    }

    if (this.raidSituation !== 'NONE') {
      this.raidSituationTimer -= dt;
      if (this.raidSituationTimer <= 0) {
        this.raidSituation = 'NONE';
        this.raidSituationText = '';
        this.nextSituationTimer = 2.6;
      }
    } else {
      this.nextSituationTimer -= dt;
      if (this.nextSituationTimer <= 0 && this.raidTimeLeft > 3.5) {
        this.triggerNextRaidSituation();
      }
    }

    const targetSurge = this.raidSituation === 'TRUCK_SURGE' ? 42 : 0;
    this.truckSurgeOffset += (targetSurge - this.truckSurgeOffset) * Math.min(1, dt * 4);

    let moveDir = 0;
    if (this.heldKeys.has('ArrowLeft') || this.heldKeys.has('KeyA')) moveDir -= 1;
    if (this.heldKeys.has('ArrowRight') || this.heldKeys.has('KeyD')) moveDir += 1;

    const baseSpeed = this.dailyBuffs.proteinBuff ? 595 : 440;
    const cartSpeed = baseSpeed + (this.dailyBuffs.landladySpeedBuff ? 120 : 0);
    if (this.slipTimer > 0) {
      this.cartX += this.slipVx * dt;
      this.cartLean = Math.sign(this.slipVx) * 0.25;
    } else if (moveDir !== 0) {
      this.cartX += moveDir * cartSpeed * dt;
      this.cartLean += (moveDir * 0.14 - this.cartLean) * Math.min(1, dt * 14);
    } else if (this.targetPointerCartX !== null) {
      const diff = this.targetPointerCartX - this.cartX;
      const step = Math.sign(diff) * Math.min(Math.abs(diff), cartSpeed * 1.25 * dt);
      this.cartX += step;
      this.cartLean += (Math.sign(diff) * 0.12 - this.cartLean) * Math.min(1, dt * 14);
    } else {
      this.cartLean += (0 - this.cartLean) * Math.min(1, dt * 12);
    }

    const minX = layout.roadX + layout.cartW * 0.5 + 10;
    const maxX = layout.roadX + layout.roadW - layout.cartW * 0.5 - 10;
    this.cartX = Math.max(minX, Math.min(maxX, this.cartX));

    this.raidSpawnTimer -= dt * boostMult;
    if (this.raidSpawnTimer <= 0) {
      this.spawnRaidObstacle();
      this.raidSpawnTimer = Math.max(0.36, 0.72 - this.raidsSurvived * 0.05);
    }

    const cartCy = layout.cartY + layout.cartH * 0.5;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += obs.vy * boostMult * dt;

      if (obs.type === 'DOG') {
        if (!obs.dashedCrossed && obs.y > this.height * 0.25) {
          obs.dashedCrossed = true;
        }
        if (obs.dashedCrossed) {
          obs.x += obs.vx * dt;
          if (obs.x < layout.roadX + 26 || obs.x > layout.roadX + layout.roadW - 26) {
            obs.vx *= -1;
          }
        }
      } else if (obs.type === 'NINJA_SCOOTER') {
        obs.x += obs.vx * dt;
        if (obs.x < layout.roadX + 20 || obs.x > layout.roadX + layout.roadW - 20) {
          obs.vx *= -1;
        }
      } else if (obs.type === 'GOSSIP_LADY') {
        obs.x += Math.sin(this.time * 4 + obs.animPhase) * 52 * dt;
      }

      if (!obs.hit) {
        const hitW = (layout.cartW * 0.72 + obs.width * 0.72) * 0.5;
        const hitH = (layout.cartH * 0.72 + obs.height * 0.72) * 0.5;
        if (Math.abs(obs.x - this.cartX) < hitW && Math.abs(obs.y - cartCy) < hitH) {
          obs.hit = true;
          if (obs.type === 'PICKUP_CHAIR') {
            if (this.redChairs < this.maxRedChairs) {
              this.redChairs += 1;
              this.audio.playPickup();
              this.spawnCallout('+1 Ghế Nhựa Đỏ!', undefined, obs.x, obs.y - 20, '#10B981');
            }
            this.obstacles.splice(i, 1);
            continue;
          } else if (obs.type === 'PICKUP_CASH') {
            this.money += 20000;
            this.dayRevenue += 20000;
            this.xu += 150;
            this.score += 200;
            this.audio.playPickup();
            this.spawnCallout('+20.000đ · +150 Xu', 'Lượm được tiền rơi!', obs.x, obs.y - 20, '#22C55E');
            this.obstacles.splice(i, 1);
            continue;
          } else if (obs.type === 'PICKUP_SHIELD') {
            this.shieldTimer = 4.0;
            this.audio.playPickup();
            this.spawnCallout('TRÀ ĐÁ BẤT TỬ!', 'Miễn nhiễm va chạm 4 giây!', obs.x, obs.y - 24, '#38BDF8');
            this.obstacles.splice(i, 1);
            continue;
          } else if (obs.type === 'PUDDLE') {
            if (this.boostActiveTimer <= 0 && this.shieldTimer <= 0) {
              this.slipTimer = 0.42;
              this.slipVx = (Math.random() < 0.5 ? -1 : 1) * 260;
              this.audio.playDropTopping();
              this.spawnParticles(obs.x, obs.y, 10, '#38BDF8', 'circle');
              this.spawnCallout('TRƯỢT BÁNH!', 'Vũng nước trơn quá!', obs.x, obs.y - 25, '#38BDF8');
            }
            continue;
          } else if (this.shieldTimer > 0) {
            this.shieldTimer = 0;
            this.invulnTimer = 0.9;
            this.shakeIntensity = 8;
            this.audio.playPickup();
            this.spawnParticles(obs.x, obs.y, 14, '#38BDF8', 'circle');
            this.spawnCallout('ĐỠ ĐÒN!', 'Khiên cứu một bàn thua!', obs.x, obs.y - 30, '#38BDF8');
            this.obstacles.splice(i, 1);
            continue;
          } else if (this.freeDodgesLeft > 0) {
            // Mechanic 9: Lvl 3 Air Blade Scooter 1 free dodge!
            this.freeDodgesLeft -= 1;
            this.invulnTimer = 1.25;
            this.shakeIntensity = 6;
            this.audio.playPickup();
            this.spawnParticles(this.cartX, cartCy, 14, '#FACC15', 'circle');
            this.spawnCallout('🛵 AIR BLADE NÉ FREE!', 'Lách ngọt xớt khỏi chướng ngại vật!', obs.x, obs.y - 32, '#FACC15');
            this.obstacles.splice(i, 1);
            this.emitHud(true);
            continue;
          } else if (this.invulnTimer <= 0) {
            this.redChairs -= 1;
            this.dayFinesCost += 10000; // Phí phạt va chạm / Trật Tự tính vào P&L cuối ngày
            this.invulnTimer = 1.25;
            this.hitFlashTimer = 0.14;
            this.hitstopTimer = 0.055;
            this.shakeIntensity = 14;
            this.audio.playChairBreak();

            this.spawnParticles(this.cartX, cartCy, 10, '#EF4444', 'chair');
            this.spawnCallout(
              'BỐP! -1 Ghế · +10k Phạt',
              `Đụng trúng ${obs.label}!`,
              this.cartX,
              cartCy - 45,
              '#E11D48'
            );

            if (this.redChairs <= 0) {
              this.redChairs = 0;
              this.screen = 'GAME_OVER';
              this.gameOverReason = `Đụng trúng ${obs.label} làm rơi sạch Ghế Nhựa Đỏ! Xe bánh tráng đã bị Trật tự đô thị tạm giữ.`;
              this.emitHud(true);
              return;
            }
            this.emitHud(true);
          }
        }
      }

      if (obs.y > this.height + 90) {
        this.obstacles.splice(i, 1);
      }
    }

    if (this.raidTimeLeft <= 0) {
      this.raidsSurvived += 1;
      this.money += 50000;
      this.dayRevenue += 50000;
      this.xu += 250;
      this.score += 500;
      this.ordersSinceRaid = 0;
      this.phase = 'COOKING';
      this.audio.playRaidWin();
      if (this.endOfDayPending) {
        this.endCurrentDay('');
      } else {
        this.spawnNextOrder(true);
        this.spawnCallout(
          '+50.000đ · +250 Xu Cắt Đuôi!',
          'Trật tự bỏ cuộc rồi, bán tiếp thôi!',
          this.width * 0.5,
          this.height * 0.5,
          '#10B981'
        );
      }
      this.emitHud(true);
    }
  }

  private updateParticlesAndCallouts(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt;
      p.rotation += p.vRot * dt;
      p.alpha = p.life / p.maxLife;
    }

    for (let i = this.callouts.length - 1; i >= 0; i--) {
      const c = this.callouts[i];
      c.life -= dt;
      if (c.life <= 0) {
        this.callouts.splice(i, 1);
        continue;
      }
      c.y += c.vy * dt;
      c.scale += (1 - c.scale) * Math.min(1, dt * 12);
    }

    for (let i = this.flyingCash.length - 1; i >= 0; i--) {
      const fc = this.flyingCash[i];
      if (fc.delay > 0) {
        fc.delay -= dt;
        continue;
      }
      fc.progress += dt * 2.15;
      fc.rotation += fc.vRot * dt;
      if (fc.progress >= 1) {
        this.spawnParticles(fc.tx, fc.ty, fc.kind === 'COIN' ? 3 : 5, '#FACC15', 'circle');
        this.flyingCash.splice(i, 1);
      }
    }
  }

  private spawnParticles(
    x: number,
    y: number,
    count: number,
    color: string,
    shape: Particle['shape']
  ): void {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 200;
      const maxLife = 0.45 + Math.random() * 0.45;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 90,
        size: shape === 'chair' ? 12 : 5 + Math.random() * 5,
        color,
        alpha: 1,
        life: maxLife,
        maxLife,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 10,
        shape,
      });
    }
  }

  private spawnCallout(
    text: string,
    subtext: string | undefined,
    x: number,
    y: number,
    color: string
  ): void {
    this.callouts.push({
      text,
      subtext,
      x: Math.max(90, Math.min(this.width - 90, x)),
      y,
      vy: -36,
      color,
      life: 1.25,
      maxLife: 1.25,
      scale: 1.35,
    });
  }

  private emitHud(force: boolean): void {
    const raidSec = Math.ceil(this.raidTimeLeft);
    const daySec = Math.ceil(this.dayTimeLeft);
    const bpSec = Math.ceil(this.bocPhotTimer);
    const chkTenths = this.checkout.active ? Math.ceil(this.checkout.timeLeft * 10) : 0;
    const hasAngryCustomer = Boolean(this.order?.isAngry) || this.waitingCustomers.some((wc) => wc.isAngry);
    const upHash = `${this.upgrades.depToOng}-${this.upgrades.loaKeoKeo}-${this.upgrades.gheBatTu}-${this.upgrades.ledRgb}-${this.upgrades.cursedMenu}-${this.upgrades.diyMixer}`;
    const invHash = `${this.inventory.banh_trang}-${this.inventory.kho_bo}-${this.inventory.trung_cut}-${this.inventory.xoai}-${this.inventory.rau_ram}-${this.inventory.tac}`;
    const buffHash = `${this.dailyBuffs.luckyCharm}-${this.dailyBuffs.proteinBuff}-${this.dailyBuffs.landladySpeedBuff}-${this.dailyBuffs.karmaBuff}-${this.freeDodgesLeft}-${this.vehicleLevel}`;
    const advHash = `${this.rippedBag.active}-${this.bossFight.active}-${hasAngryCustomer}-${this.landlady.sweeping}-${this.lotteryTicketsToday}-${this.spawnPenaltyPercentToday}-${this.nextDayOneStarCount}`;
    const featHash = `${this.flowPerfectCount}-${this.flowRhythm.active}-${this.guardGrab.phase}-${this.roomHunters.active}-${this.diyMalfunction.active}-${Math.ceil(this.diyMalfunction.timeLeft * 10)}-${this.diyMalfunction.selectedLeftColor}-${this.diyMalfunction.connected.length}-${this.loanDebt}-${this.thugsActive}-${this.loanModalOpen}-${this.baziReading.active}-${this.baziReading.acknowledged}-${this.tarot.active}-${this.tarot.stage}-${this.tarot.drawnCard?.id ?? ''}-${this.tarot.upgradedToCombo}`;
    const tycoonHash =
      this.screen === 'CITY_TYCOON'
        ? `${this.cityTycoon.passiveIncomePerSec}-${Math.floor(this.cityTycoon.totalEarned / 100)}-${Math.round(this.cityTycoon.heatLevel)}-${this.cityTycoon.upgradeLevel}-${this.cityTycoon.activePolicy}-${this.cityTycoon.eventFeed[0]?.id ?? 0}-${this.cityTycoon.crises.map((c) => `${c.id}:${Math.ceil(c.timeLeft * 10)}`).join(',')}-${this.cityTycoon.squads.map((s) => `${s.members}${s.districtId ?? ''}${s.status}${Math.round(s.stamina)}`).join(',')}`
        : '';
    const wuxiaHash = this.wuxiaCombat.active
      ? `${this.wuxiaCombat.playerHp}-${this.wuxiaCombat.thiefHp}-${this.wuxiaCombat.thiefIntent}-${Math.ceil(this.wuxiaCombat.shurikenCd * 10)}-${Math.ceil(this.wuxiaCombat.meleeCd * 10)}-${Math.ceil(this.wuxiaCombat.blockCd * 10)}-${Math.ceil(this.wuxiaCombat.dodgeCd * 10)}-${this.wuxiaCombat.statusText}`
      : '0';
    const dayBannerTenths = Math.ceil(this.dayBannerTimer * 10);
    const penaltyHash = `${this.policeHeat}-${this.ruinedBagBlocking}-${this.badRepOrdersLeft}-${Math.ceil(this.recordingPhoneTimer * 5)}-${Math.ceil(this.yellingTimer * 5)}-${this.sauceSplatterWipes}`;
    const hash = `${this.screen}|${this.phase}|${this.dishType}|${this.prepStep}|${this.money}|${this.xu}|${this.score}|${this.ordersServed}|${this.redChairs}|${this.maxRedChairs}|${this.combo}|${raidSec}|${this.day}-${daySec}-${this.dayDuration}-${dayBannerTenths}|${this.audio.isMuted()}|${this.shopOpen}|${upHash}|${invHash}|${buffHash}|${advHash}|${featHash}|${tycoonHash}|${wuxiaHash}|${this.dailyHexagram.element}|${this.viralOrdersLeft}|${bpSec}|${this.rainEvent.active}|${this.tiktokQte.active}|${this.checkout.active}-${this.checkout.givenChangeK}-${chkTenths}-${this.checkout.selectedBills.length}-${this.checkout.discountAccepted}|${this.raidChanceBonus}|${penaltyHash}`;
    if (!force && hash === this.lastHudHash) return;
    this.lastHudHash = hash;

    const loanDailyInterest =
      this.loanDebt > 0 ? Math.max(5000, Math.round((this.loanDebt * 0.25) / 1000) * 1000) : 0;

    this.onHudChange({
      screen: this.screen,
      phase: this.phase,
      dishType: this.dishType,
      prepStep: this.prepStep,
      money: this.money,
      xu: this.xu,
      score: this.score,
      ordersServed: this.ordersServed,
      perfectOrders: this.perfectOrders,
      raidsSurvived: this.raidsSurvived,
      redChairs: this.redChairs,
      maxRedChairs: this.maxRedChairs,
      combo: this.combo,
      raidTimeLeft: Math.max(0, raidSec),
      muted: this.audio.isMuted(),
      shopOpen: this.shopOpen,
      upgrades: { ...this.upgrades },
      viralOrdersLeft: this.viralOrdersLeft,
      bocPhotTimer: Math.max(0, bpSec),
      rainActive: this.rainEvent.active,
      qteActive: this.tiktokQte.active,
      rippedBagActive: this.rippedBag.active,
      bossFightActive: this.bossFight.active,
      hasAngryCustomer,
      landladySweeping: this.landlady.active && this.landlady.sweeping,
      lotteryTicketsToday: this.lotteryTicketsToday,
      spawnPenaltyPercentToday: this.spawnPenaltyPercentToday,
      nextDayOneStarCount: this.nextDayOneStarCount,
      flowPerfectCount: this.flowPerfectCount,
      flowRhythmActive: this.flowRhythm.active,
      parryWindowActive: this.guardGrab.phase === 'TELEGRAPH',
      guardStunned: this.guardGrab.phase === 'STUNNED',
      roomHunters: { ...this.roomHunters },
      diyMalfunction: {
        ...this.diyMalfunction,
        leftOrder: [...this.diyMalfunction.leftOrder],
        rightOrder: [...this.diyMalfunction.rightOrder],
        connected: [...this.diyMalfunction.connected],
      },
      loanDebt: this.loanDebt,
      loanDailyInterest,
      thugsActive: this.thugsActive,
      loanModalOpen: this.loanModalOpen,
      checkout: {
        ...this.checkout,
        paidBills: [...this.checkout.paidBills],
        selectedBills: [...this.checkout.selectedBills],
      },
      raidChanceBonus: this.raidChanceBonus,
      policeHeat: this.policeHeat,
      ruinedBagBlocking: this.ruinedBagBlocking,
      badRepOrdersLeft: this.badRepOrdersLeft,
      recordingPhoneTimer: this.recordingPhoneTimer,
      yellingTimer: this.yellingTimer,
      sauceSplatterWipes: this.sauceSplatterWipes,
      day: this.day,
      dayTimeLeft: Math.max(0, daySec),
      dayDuration: this.dayDuration,
      dailyPacing: { ...this.dayManager.pacing },
      dayBannerTimer: this.dayBannerTimer,
      dayBannerText: this.dayBannerText,
      inventory: { ...this.inventory },
      maxStockPerItem: this.getMaxStockPerItem(),
      marketPrices: { ...this.marketPrices },
      newspaper: { ...this.newspaper, multipliers: { ...this.newspaper.multipliers } },
      dayPnl: { ...this.dayPnl },
      vehicleLevel: this.vehicleLevel,
      dailyBuffs: { ...this.dailyBuffs },
      freeDodgesLeft: this.freeDodgesLeft,
      dailyHexagram: { ...this.dailyHexagram },
      cityTycoon: {
        ...this.cityTycoon,
        squads: this.cityTycoon.squads.map((s) => ({ ...s })),
        crises: this.cityTycoon.crises.map((c) => ({ ...c })),
        eventFeed: this.cityTycoon.eventFeed.map((e) => ({ ...e })),
      },
      wuxiaCombat: {
        ...this.wuxiaCombat,
        projectiles: this.wuxiaCombat.projectiles.map((p) => ({ ...p })),
      },
      baziReading: {
        ...this.baziReading,
        profile: this.baziReading.profile ? { ...this.baziReading.profile } : null,
      },
      tarot: {
        ...this.tarot,
        cardPool: [...this.tarot.cardPool],
        options: [...this.tarot.options],
      },
      gameOverReason: this.gameOverReason,
    });
  }

  private render(): void {
    const layout = computePrepLayout(this.width, this.height);
    const raidLayout = computeRaidLayout(this.width, this.height);
    let hoverTrayId: ToppingId | null = null;
    if (this.phase === 'COOKING' && this.prepStep === 'TOPPINGS' && this.order && !this.bossFight.active) {
      for (const t of TOPPINGS) {
        if (pointInRect(this.hoverPos.x, this.hoverPos.y, layout.trayRects[t.id])) {
          hoverTrayId = t.id;
          break;
        }
      }
    }

    const centeredPrimary = {
      ...layout.primaryBtn,
      x: this.width * 0.5 - layout.primaryBtn.w * 0.5,
    };
    const activePrimary = this.prepStep === 'CUTTING' ? layout.primaryBtn : centeredPrimary;
    const dayProgress =
      this.dayDuration > 0
        ? Math.max(0, Math.min(1, 1 - this.dayTimeLeft / this.dayDuration))
        : Math.min(0.85, this.dayElapsedTime / 300);

    const waitingRects = getWaitingCustomerRects(layout, this.waitingCustomers.length);
    let hoverAppeaseWaitingIdx = -1;
    if (this.phase === 'COOKING') {
      for (let i = 0; i < this.waitingCustomers.length; i++) {
        if (this.waitingCustomers[i].isAngry && waitingRects[i]) {
          if (pointInRect(this.hoverPos.x, this.hoverPos.y, getAppeaseWaitingRect(waitingRects[i]))) {
            hoverAppeaseWaitingIdx = i;
            break;
          }
        }
      }
    }

    const renderState: RenderState = {
      width: this.width,
      height: this.height,
      time: this.time,
      dayProgress,
      phase: this.phase,
      dishType: this.dishType,
      prepStep: this.prepStep,
      order: this.order,
      waitingCustomers: this.waitingCustomers,
      orderNumber: this.ordersServed + 1,
      slices: this.slices,
      rollProgress: this.rollProgress,
      swipeTrail: this.swipeTrail,
      addedToppings: this.addedToppings,
      inventory: this.inventory,
      bowlIngredients: this.bowlIngredients,
      flyingToppings: this.flyingToppings,
      flyingCash: this.flyingCash,
      limeMeter: this.limeMeter,
      chiliMeter: this.chiliMeter,
      shakeProgress: this.shakeProgress,
      bowlShakeOffset: this.bowlShakeOffset,
      bowlScale: this.bowlScale,
      redChairs: this.redChairs,
      maxRedChairs: this.maxRedChairs,
      raidWarningTimer: this.raidWarningTimer,
      raidTimeLeft: this.raidTimeLeft,
      raidTotalTime: this.raidTotalTime,
      raidScrollY: this.raidScrollY,
      raidSituation: this.raidSituation,
      raidSituationText: this.raidSituationText,
      cartX: this.cartX,
      cartLean: this.cartLean,
      invulnTimer: this.invulnTimer,
      hitFlashTimer: this.hitFlashTimer,
      boostActiveTimer: this.boostActiveTimer,
      boostCooldown: this.boostCooldown,
      shieldTimer: this.shieldTimer,
      slipTimer: this.slipTimer,
      truckSurgeOffset: this.truckSurgeOffset,
      obstacles: this.obstacles,
      particles: this.particles,
      callouts: this.callouts,
      shakeX: this.shakeX,
      shakeY: this.shakeY,
      hoverTrayId,
      hoverPrimary: Boolean(this.order) && pointInRect(this.hoverPos.x, this.hoverPos.y, activePrimary),
      hoverSecondary:
        Boolean(this.order) && this.prepStep === 'CUTTING' && pointInRect(this.hoverPos.x, this.hoverPos.y, layout.secondaryBtn),
      hoverShake:
        Boolean(this.order) && this.prepStep === 'SHAKING' && pointInRect(this.hoverPos.x, this.hoverPos.y, layout.shakeBtn),
      hoverRoll:
        Boolean(this.order) && this.prepStep === 'ROLLING' && pointInRect(this.hoverPos.x, this.hoverPos.y, layout.rollBtn),
      hoverBoost:
        this.phase === 'RAID_CHASE' && pointInRect(this.hoverPos.x, this.hoverPos.y, raidLayout.boostBtn),
      hoverAppeaseActive:
        Boolean(this.order?.isAngry) && pointInRect(this.hoverPos.x, this.hoverPos.y, getAppeaseActiveRect(layout)),
      hoverAppeaseWaitingIdx,
      upgrades: this.upgrades,
      vehicleLevel: this.vehicleLevel,
      dailyBuffs: this.dailyBuffs,
      freeDodgesLeft: this.freeDodgesLeft,
      tiktokQte: this.tiktokQte,
      rainEvent: this.rainEvent,
      rippedBag: this.rippedBag,
      landlady: this.landlady,
      lotterySeller: this.lotterySeller,
      bossFight: this.bossFight,
      sickCustomerTimer: this.sickCustomerTimer,
      viralOrdersLeft: this.viralOrdersLeft,
      bocPhotTimer: this.bocPhotTimer,
      flowPerfectCount: this.flowPerfectCount,
      flowRhythm: this.flowRhythm,
      guardGrab: this.guardGrab,
      loanDebt: this.loanDebt,
      thugsActive: this.thugsActive,
      hoverElectricPole: this.phase === 'COOKING' && pointInRect(this.hoverPos.x, this.hoverPos.y, getElectricPoleRect(layout)),
      diyMalfunctionActive: this.diyMalfunction.active,
      wuxiaCombat: this.wuxiaCombat,
      backdropImg: this.backdropImg,
    };

    renderGameFrame(this.ctx, renderState);
  }
}
