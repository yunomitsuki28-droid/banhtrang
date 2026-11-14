export type GameScreenState =
  | 'TITLE_MENU'
  | 'MORNING_PREP'
  | 'PLAYING'
  | 'PAUSED'
  | 'END_OF_DAY'
  | 'GAME_OVER'
  | 'CITY_TYCOON';

export type PlayPhase = 'COOKING' | 'RAID_WARNING' | 'RAID_CHASE' | 'WUXIA_COMBAT';

export type DishType = 'TRON' | 'CUON';

export type PrepStep = 'CUTTING' | 'TOPPINGS' | 'SEASONING' | 'ROLLING' | 'SHAKING' | 'READY' | 'FLOW_RHYTHM';

export type CustomerType =
  | 'STUDENT'
  | 'NINJA_LEAD'
  | 'GEN_Z'
  | 'OFFICE'
  | 'FENG_SHUI'
  | 'GYM_BRO'
  | 'REAL_ESTATE'
  | 'APP_SHIPPER'
  | 'MUKBANGER'
  | 'ROOM_HUNTERS'
  | 'BUSINESS_BAZI'
  | 'HEARTBROKEN_GENZ';

export type ToppingId =
  | 'kho_bo'
  | 'trung_cut'
  | 'xoai'
  | 'rau_ram'
  | 'pho_mai'
  | 'tran_chau'
  | 'sau_rieng'
  | 'nuoc_cot_dua';

export type RawIngredientId =
  | 'banh_trang'
  | 'kho_bo'
  | 'trung_cut'
  | 'xoai'
  | 'rau_ram'
  | 'tac';

export type InventoryState = Record<RawIngredientId, number>;

export type MarketPrices = Record<RawIngredientId, number>;

export interface NewspaperEvent {
  id: string;
  headline: string;
  subtext: string;
  multipliers: Partial<Record<RawIngredientId, number>>;
}

export type VehicleLevel = 1 | 2 | 3;

export interface DailyBuffs {
  luckyCharm: boolean; // +10% tips for the day (Feng Shui Master)
  proteinBuff: boolean; // Run faster during Police Raids (Gym Bro)
  landladySpeedBuff: boolean; // Temporary speed buff for next Police Raid (Bribed Landlady)
  karmaBuff: boolean; // +15% tips & fortune karma for the day (Bazi Business Reading)
}

export interface DayPnlSummary {
  day: number;
  revenue: number;
  ingredientCosts: number;
  rentCost: number;
  finesCost: number;
  loanInterestCost: number;
  lotteryWin: number;
  lotteryTickets: number;
  netProfit: number;
  ordersCompleted: number;
  closedEarlyReason: string;
}

export type SeasoningLevel = 'IT' | 'VUA' | 'NHIEU';

export type ShopItemId =
  | 'dep_to_ong'
  | 'loa_keo_keo'
  | 'ghe_bat_tu'
  | 'led_rgb'
  | 'cursed_menu'
  | 'diy_mixer';

export interface ShopUpgrades {
  depToOng: boolean; // -20% obstacle speed in Raid
  loaKeoKeo: boolean; // +50% customer spawn rate, +30% police raid chance
  gheBatTu: boolean; // +1 Extra HP (shield) during endless runner
  ledRgb: boolean; // Unlocks Gen Z customer (2x pay, complex order)
  cursedMenu: boolean; // Unlocks Cursed Menu (Durian, Boba, Coconut Milk - 3x pay, 50% food poisoning)
  diyMixer: boolean; // Automates Phase 1 mixing at 2x speed, 15% chance to malfunction (wire puzzle)
}

export type ArrowKey = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface TiktokQteState {
  active: boolean;
  sequence: ArrowKey[];
  progressIndex: number;
  timeLeft: number;
  maxTime: number;
  wrongFlash: number;
}

export interface WaitingCustomer {
  id: number;
  customerType: CustomerType;
  customerLabel: string;
  hasRaincoat: boolean;
  waitAge: number; // How long they have been waiting in line
  isAngry: boolean;
  shipperBrand?: 'GREEN' | 'ORANGE';
}

export interface SaigonRainState {
  active: boolean;
  timeLeft: number;
  maxTime: number;
  activeCustomerHasRaincoat: boolean;
}

// Mechanic 1: The "Ripped Bag" (Bục Đáy Bịch)
export interface FallingBagItem {
  id: number;
  toppingId: ToppingId;
  x: number;
  y: number;
  vy: number;
  vx: number;
  rotation: number;
  vRot: number;
  caught: boolean;
  missed: boolean;
  isFinalQuailEgg: boolean;
}

export interface RippedBagState {
  active: boolean;
  timeLeft: number;
  maxTime: number;
  items: FallingBagItem[];
}

// Mechanic 3: Street Diplomacy (Bà Chủ Nhà & Chú Vé Số)
export interface LandladyState {
  active: boolean;
  sweeping: boolean;
  x: number;
  y: number;
  bribed: boolean;
  timer: number;
}

export interface LotterySellerState {
  active: boolean;
  x: number;
  y: number;
  dir: 1 | -1;
  boughtThisPass: boolean;
}

// Mechanic 4: End-of-Day Boss Fight (Trộn Thau Khổng Lồ)
export interface BossFightState {
  active: boolean;
  stage: 'DUMP' | 'MIX';
  taps: number;
  targetTaps: number;
  mixAngleAccum: number;
  targetMixAngle: number;
  timeLeft: number;
  maxTime: number;
  lastPointerAngle: number | null;
  swirlTrail: Point2D[];
}

// Feature 1: Scissor Rhythm Minigame ("Flow State")
export interface FlowRhythmNote {
  id: number;
  lane: number; // 0..3
  toppingId: ToppingId;
  hitTime: number; // elapsed rhythm time when note crosses hit line
  judged: boolean;
  result?: 'PERFECT' | 'GOOD' | 'MISS';
}

export interface FlowRhythmState {
  active: boolean;
  elapsed: number;
  beatInterval: number;
  lastBeatIndex: number;
  notes: FlowRhythmNote[];
  hitsPerfect: number;
  hitsGood: number;
  missed: number;
  combo: number;
  lastJudgmentText: string;
  lastJudgmentColor: string;
  lastJudgmentTimer: number;
  laneFlashTimers: [number, number, number, number];
  finishingTimer: number;
}

// Feature 2: Parry Mechanic against Urban Guards
export interface GuardGrabState {
  phase: 'IDLE' | 'TELEGRAPH' | 'STUNNED';
  timer: number;
  maxTimer: number;
  cooldown: number;
  side: 'LEFT' | 'RIGHT';
  parryFlash: number;
}

// Feature 3: Room Hunters Upsell Choice
export type RoomHuntersOption = 'HARD_SELL' | 'EMPATHY_SELL' | 'JUST_SERVE';

export interface RoomHuntersState {
  active: boolean;
  customerLabel: string;
  promptText: string;
}

// Feature 4: DIY Mixer Wire-Connecting Malfunction
export type WireColorId = 'RED' | 'YELLOW' | 'BLUE';

export interface DiyMalfunctionState {
  active: boolean;
  timeLeft: number;
  maxTime: number;
  leftOrder: WireColorId[];
  rightOrder: WireColorId[];
  selectedLeftColor: WireColorId | null;
  connected: WireColorId[];
  wrongFlash: number;
}

export interface ToppingDef {
  id: ToppingId;
  name: string;
  shortName: string;
  color: string;
  accentColor: string;
  isWeird: boolean;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface PolygonSlice {
  id: number;
  points: Point2D[];
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  angle: number;
  va: number;
  area: number;
  hitFlash: number;
}

// Mechanic 1 (New): Metaphysics & Elemental Orders ("Hệ thống Bát Tự & Ngũ Hành")
export type ElementType = 'WOOD' | 'FIRE' | 'EARTH' | 'METAL' | 'WATER';

export interface DailyHexagram {
  element: ElementType;
  name: string;
  hexagramTitle: string;
  boostDesc: string;
  boostPercent: number;
}

// Street Fortune Teller Mode: Bazi & Feng Shui Reading + Gen Z Tarot
export interface BaziPillar {
  label: string;
  stem: string;
  branch: string;
  element: ElementType;
}

export interface BaziProfile {
  id: string;
  title: string;
  dayMaster: string;
  chartPillars: BaziPillar[];
  neededElements: ElementType[];
  tabooElements: ElementType[];
  businessWorry: string;
  recommendedText: string;
}

export interface BaziReadingState {
  active: boolean;
  acknowledged: boolean;
  profile: BaziProfile | null;
  customerLabel: string;
}

export type TarotCardId =
  | 'THE_LOST_SHIPPER'
  | 'THE_STREET_VENDOR'
  | 'THE_URBAN_GUARD'
  | 'THE_RIPPED_BAG'
  | 'THE_TOXIC_COMBO'
  | 'THE_CONFISCATION';

export type TarotDialogueTone = 'TRUTH' | 'COMFORT' | 'UPSELL';

export interface TarotCardDef {
  id: TarotCardId;
  numeral: string;
  name: string;
  viName: string;
  imageRef: string;
  streetMeaning: string;
  advice: {
    A: string; // Truth
    B: string; // Comfort
    C: string; // Upsell
  };
}

export interface TarotDialogueOption {
  choiceKey: 'A' | 'B' | 'C';
  tone: TarotDialogueTone;
  label: string;
  speech: string;
}

export interface TarotState {
  active: boolean;
  stage: 'PICK_CARD' | 'INTERPRET' | 'RESULT';
  customerLabel: string;
  question: string;
  cardPool: TarotCardDef[];
  drawnCard: TarotCardDef | null;
  options: TarotDialogueOption[];
  chosenTone: TarotDialogueTone | null;
  outcomeKind: 'LEFT' | 'TIP' | 'COMBO_3X' | null;
  tipEarned: number;
  customerLeft: boolean;
  resultMessage: string;
  upgradedToCombo: boolean;
}

// Mechanic 2 (New): Squad Management Tycoon ("Quản lý Đội Nhóm — 16 Nhân Sự")
export type CityDistrictId =
  | 'CONG_VIEN'
  | 'NGA_TU'
  | 'DAI_HOC'
  | 'CHO_BEN_THANH'
  | 'PHO_DI_BO';

export type SquadCrisisType = 'TURF_WAR' | 'CONFISCATED' | 'LOW_STOCK';

export type TycoonSquadStatus = 'IDLE' | 'DEPLOYED' | 'CRISIS' | 'ARRESTED';

export type TycoonPolicyId = 'NONE' | 'OVERDRIVE' | 'BRIBE_PATROL' | 'TEA_BREAK';

export interface TycoonLogEntry {
  id: number;
  text: string;
  tone: 'PROFIT' | 'ALERT' | 'INFO';
  timeStr: string;
}

export interface TycoonSquad {
  id: string;
  name: string;
  color: string;
  members: number;
  districtId: CityDistrictId | null;
  morale: number; // 0..100
  stamina: number; // 0..100
  status: TycoonSquadStatus;
}

export interface CityCrisis {
  id: number;
  type: SquadCrisisType;
  title: string;
  desc: string;
  districtId: CityDistrictId;
  squadId: string;
  timeLeft: number;
  maxTime: number;
  budgetCost: number;
  penaltyMoney: number;
}

export interface CityTycoonState {
  squads: TycoonSquad[];
  totalStaff: number;
  passiveIncomePerSec: number;
  totalEarned: number;
  heatLevel: number; // 0..100 Police attention
  upgradeLevel: number; // 1..5
  activePolicy: TycoonPolicyId;
  crises: CityCrisis[];
  eventFeed: TycoonLogEntry[];
  lastTickLog: string;
}

// Mechanic 3 (New): Wuxia Street Combat ("Combat Võ Hiệp")
export interface ShurikenProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  rotation: number;
}

export interface WuxiaCombatState {
  active: boolean;
  playerHp: number;
  maxPlayerHp: number;
  thiefHp: number;
  maxThiefHp: number;
  playerX: number;
  thiefX: number;
  thiefIntent: 'IDLE' | 'TELEGRAPH' | 'LUNGE' | 'STUNNED';
  thiefIntentTimer: number;
  shurikenCd: number;
  meleeCd: number;
  blockTimer: number;
  blockCd: number;
  dodgeTimer: number;
  dodgeCd: number;
  slashAnimTimer: number;
  thiefHitFlash: number;
  playerHitFlash: number;
  stolenTipJar: number;
  projectiles: ShurikenProjectile[];
  statusText: string;
}

export interface CustomerOrder {
  id: number;
  dishType: DishType;
  customerType: CustomerType;
  customerLabel: string;
  dialogue: string;
  targetSlices: number;
  requiredToppings: Record<ToppingId, number>;
  limeTarget: SeasoningLevel;
  chiliTarget: SeasoningLevel;
  patience: number;
  maxPatience: number;
  patienceDrainRate: number;
  baseReward: number;
  baseXu: number;
  isVip?: boolean;
  isAngry?: boolean;
  isCursedTrend?: boolean;
  isMasterpiece?: boolean;
  shipperBrand?: 'GREEN' | 'ORANGE';
  waitAge?: number;
  elementTag?: ElementType;
  elementClashText?: string;
  hexagramBoosted?: boolean;
  forbiddenToppings?: ToppingId[];
  forbiddenChili?: SeasoningLevel;
  forbiddenLime?: SeasoningLevel;
  baziProfile?: BaziProfile;
  hasTraTacCombo?: boolean;
}

export interface SeasoningMeter {
  value: number; // 0..100
  direction: 1 | -1;
  holding: boolean;
  locked: boolean;
  resultLabel: string | null;
  accuracy: number; // 0..1
}

export interface FlyingTopping {
  id: ToppingId;
  x: number;
  y: number;
  tx: number;
  ty: number;
  progress: number;
  rotation: number;
}

export interface FlyingCashItem {
  kind: 'BILL' | 'COIN';
  denomK: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  arcHeight: number;
  delay: number;
  progress: number;
  rotation: number;
  vRot: number;
}

export interface BowlIngredient {
  id: ToppingId;
  ox: number;
  oy: number;
  rotation: number;
  scale: number;
}

export type ObstacleType =
  | 'POTHOLE'
  | 'DOG'
  | 'GOSSIP_LADY'
  | 'BARRIER'
  | 'NINJA_SCOOTER'
  | 'SHIPPER'
  | 'PUDDLE'
  | 'PICKUP_CHAIR'
  | 'PICKUP_CASH'
  | 'PICKUP_SHIELD';

export type RaidSituation = 'NONE' | 'RAIN' | 'TRUCK_SURGE' | 'NINJA_CROSS' | 'ROADBLOCK';

export interface RaidObstacle {
  id: number;
  type: ObstacleType;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  lane: number;
  telegraphTimer: number;
  dashedCrossed: boolean;
  animPhase: number;
  hit: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
  shape: 'circle' | 'rect' | 'chair' | 'bill' | 'coin';
}

export interface FloatingCallout {
  text: string;
  subtext?: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface CheckoutState {
  active: boolean;
  customerLabel: string;
  customerType: CustomerType;
  dishType: DishType;
  billK: number;
  paidK: number;
  paidBills: number[];
  expectedChangeK: number;
  givenChangeK: number;
  selectedBills: number[];
  timeLeft: number;
  maxTime: number;
  pendingMoney: number;
  pendingXu: number;
  pendingScore: number;
  viralMult: number;
  isTricky: boolean;
  discount2kAvailable: boolean;
  discountAccepted: boolean;
  isCursedTrend: boolean;
  isMasterpiece: boolean;
}

export interface DailyPacingSnapshot {
  currentDay: number;
  customerSpawnTimer: number;
  customerPatience: number;
  actionTimeLimit: number;
  policeRaidChancePerMin: number;
  patienceRatio: number;
  actionTimeRatio: number;
  speedMultiplierLabel: string;
}

export interface GameHudSnapshot {
  screen: GameScreenState;
  phase: PlayPhase;
  dishType: DishType;
  prepStep: PrepStep;
  money: number;
  xu: number;
  score: number;
  ordersServed: number;
  perfectOrders: number;
  raidsSurvived: number;
  redChairs: number;
  maxRedChairs: number;
  combo: number;
  raidTimeLeft: number;
  muted: boolean;
  shopOpen: boolean;
  upgrades: ShopUpgrades;
  viralOrdersLeft: number;
  bocPhotTimer: number;
  rainActive: boolean;
  qteActive: boolean;
  rippedBagActive: boolean;
  bossFightActive: boolean;
  hasAngryCustomer: boolean;
  landladySweeping: boolean;
  lotteryTicketsToday: number;
  spawnPenaltyPercentToday: number;
  nextDayOneStarCount: number;
  flowPerfectCount: number;
  flowRhythmActive: boolean;
  parryWindowActive: boolean;
  guardStunned: boolean;
  roomHunters: RoomHuntersState;
  diyMalfunction: DiyMalfunctionState;
  loanDebt: number;
  loanDailyInterest: number;
  thugsActive: boolean;
  loanModalOpen: boolean;
  checkout: CheckoutState;
  raidChanceBonus: number;
  policeHeat: number;
  ruinedBagBlocking: boolean;
  badRepOrdersLeft: number;
  recordingPhoneTimer: number;
  yellingTimer: number;
  sauceSplatterWipes: number;
  day: number;
  dayTimeLeft: number;
  dayDuration: number;
  dailyPacing: DailyPacingSnapshot;
  dayBannerTimer: number;
  dayBannerText: string;
  inventory: InventoryState;
  maxStockPerItem: number;
  marketPrices: MarketPrices;
  newspaper: NewspaperEvent;
  dayPnl: DayPnlSummary;
  vehicleLevel: VehicleLevel;
  dailyBuffs: DailyBuffs;
  freeDodgesLeft: number;
  dailyHexagram: DailyHexagram;
  cityTycoon: CityTycoonState;
  wuxiaCombat: WuxiaCombatState;
  baziReading: BaziReadingState;
  tarot: TarotState;
  gameOverReason: string;
}

export interface BestRecord {
  bestMoney: number;
  bestOrders: number;
}
