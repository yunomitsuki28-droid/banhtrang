import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw, Home, Store, X, Check, Newspaper, TrendingUp, TrendingDown, Truck, Zap, Wrench, Scissors, Clock, LogOut, Map as MapIcon, Swords, Shield, Sparkles, Users, AlertTriangle, Trash2, Megaphone, Smartphone } from 'lucide-react';
import { GameEngine } from './game/engine';
import { BASE_MARKET_PRICES, ELEMENT_META, RAW_INGREDIENTS } from './game/orders';
import type { BestRecord, CityDistrictId, GameHudSnapshot, RawIngredientId, ShopItemId, TarotCardId, TycoonPolicyId, VehicleLevel, WireColorId } from './game/types';
import heroBgUrl from './assets/images/saigon_sidewalk_hero_1794649926456.jpg';

const STORAGE_KEY = 'banh_trang_tron_sinh_ton_record_v1';

interface VehicleTierMeta {
  level: VehicleLevel;
  name: string;
  capacity: number;
  upgradeCost: number;
  perk: string;
}

const VEHICLE_TIERS: VehicleTierMeta[] = [
  {
    level: 1,
    name: 'Rổ Nhựa Vỉa Hè',
    capacity: 12,
    upgradeCost: 0,
    perk: 'Sức chứa tối đa 12 đơn vị mỗi nguyên liệu.',
  },
  {
    level: 2,
    name: 'Xe Đẩy Inox',
    capacity: 25,
    upgradeCost: 5000,
    perk: 'Nâng cấp lên 25 đơn vị mỗi nguyên liệu để bán cả ngày.',
  },
  {
    level: 3,
    name: 'Xe Tay Ga Air Blade',
    capacity: 35,
    upgradeCost: 15000,
    perk: 'Chứa 35 đơn vị/món + tặng 1 lần NÉ MIỄN PHÍ mỗi pha Trật Tự!',
  },
];

function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

const DURATION_PRESETS = [
  { label: '2 phút', seconds: 120 },
  { label: '3 phút', seconds: 180 },
  { label: '5 phút', seconds: 300 },
  { label: '10 phút', seconds: 600 },
  { label: 'Tự do ∞', seconds: 0 },
];

function ShiftDurationSelector({
  dayDuration,
  onSelect,
  dark = false,
}: {
  dayDuration: number;
  onSelect: (seconds: number) => void;
  dark?: boolean;
}) {
  const minutes = dayDuration > 0 ? Math.max(1, Math.round(dayDuration / 60)) : 3;
  return (
    <div
      className={`rounded-xl border-2 border-[#111318] px-3 py-2.5 flex flex-wrap items-center justify-between gap-2.5 ${
        dark ? 'bg-[#181920]/90 text-slate-100' : 'bg-slate-100 text-[#111318]'
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs font-extrabold whitespace-nowrap">
        <Clock className={`w-4 h-4 ${dark ? 'text-[#FBBF24]' : 'text-amber-600'}`} />
        <span>Thời lượng mỗi ngày:</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {DURATION_PRESETS.map((preset) => {
          const active = dayDuration === preset.seconds;
          return (
            <button
              key={preset.seconds}
              type="button"
              onClick={() => onSelect(preset.seconds)}
              className={`px-2.5 py-1 rounded-lg border-2 border-[#111318] font-display font-bold text-xs whitespace-nowrap transition-transform active:translate-y-0.5 cursor-pointer ${
                active
                  ? 'bg-[#F59E0B] text-[#111318]'
                  : dark
                  ? 'bg-[#272A36] hover:bg-[#343848] text-slate-200'
                  : 'bg-white hover:bg-amber-50 text-[#111318]'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
        <div className="flex items-center gap-1 ml-1">
          <button
            type="button"
            aria-label="Giảm 1 phút"
            onClick={() => onSelect(Math.max(60, (dayDuration > 0 ? minutes - 1 : 2) * 60))}
            className={`w-7 h-7 rounded-lg border-2 border-[#111318] font-mono-tabular font-extrabold text-xs cursor-pointer ${
              dark ? 'bg-[#272A36] hover:bg-[#343848] text-white' : 'bg-white hover:bg-slate-200 text-[#111318]'
            }`}
          >
            -
          </button>
          <span className="font-mono-tabular font-extrabold text-xs px-1.5 min-w-[54px] text-center">
            {dayDuration === 0 ? 'Tự do ∞' : `${minutes} phút`}
          </span>
          <button
            type="button"
            aria-label="Tăng 1 phút"
            onClick={() => onSelect(Math.min(3600, (dayDuration > 0 ? minutes + 1 : 3) * 60))}
            className={`w-7 h-7 rounded-lg border-2 border-[#111318] font-mono-tabular font-extrabold text-xs cursor-pointer ${
              dark ? 'bg-[#272A36] hover:bg-[#343848] text-white' : 'bg-white hover:bg-slate-200 text-[#111318]'
            }`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

interface ShopItemMeta {
  id: ShopItemId;
  key: keyof GameHudSnapshot['upgrades'];
  name: string;
  cost: number;
  desc: string;
  accent: string;
}

const SHOP_ITEMS: ShopItemMeta[] = [
  {
    id: 'dep_to_ong',
    key: 'depToOng',
    name: 'Dép Tổ Ong Huyền Thoại',
    cost: 500,
    desc: 'Giảm 20% tốc độ chướng ngại vật khi đẩy xe né Trật Tự.',
    accent: '#FEF3C7',
  },
  {
    id: 'ghe_bat_tu',
    key: 'gheBatTu',
    name: 'Ghế Nhựa Bất Tử',
    cost: 800,
    desc: 'Tăng +1 Ghế Nhựa Đỏ (HP) và tặng Khiên đỡ đòn đầu mỗi pha chạy Trật Tự.',
    accent: '#FFE4E6',
  },
  {
    id: 'loa_keo_keo',
    key: 'loaKeoKeo',
    name: 'Loa Kẹo Kéo Siêu Thanh',
    cost: 1000,
    desc: 'Khách vào nhanh hơn 50%, nhưng cũng tăng 30% tỉ lệ bị Trật Tự chú ý.',
    accent: '#DBEAFE',
  },
  {
    id: 'led_rgb',
    key: 'ledRgb',
    name: 'Bảng Hiệu LED RGB',
    cost: 1500,
    desc: 'Mở khóa khách Gen Z (trả tiền gấp đôi với đơn Phô Mai + Trân Châu).',
    accent: '#F3E8FF',
  },
  {
    id: 'cursed_menu',
    key: 'cursedMenu',
    name: 'Nguyên Liệu Hắc Ám',
    cost: 600,
    desc: 'Mở khóa Sầu Riêng, Trân Châu & Nước Cốt Dừa. Khách Gen Z trả gấp 3 (126k), nhưng 50% bị ngộ độc (-20% khách ngày hôm sau).',
    accent: '#F5F3FF',
  },
  {
    id: 'diy_mixer',
    key: 'diyMixer',
    name: 'Máy Trộn Tự Chế DIY',
    cost: 900,
    desc: 'Tự động trộn tốc độ x2! Có 15% tỉ lệ chập mạch bắn sa tế cần nối lại 3 dây màu.',
    accent: '#E0F2FE',
  },
];

const WIRE_META: Record<WireColorId, { label: string; bg: string; border: string; text: string }> = {
  RED: { label: 'Dây Đỏ (Lửa)', bg: '#EF4444', border: '#7F1D1D', text: '#FFFFFF' },
  YELLOW: { label: 'Dây Vàng (Tín hiệu)', bg: '#FACC15', border: '#854D0E', text: '#111318' },
  BLUE: { label: 'Dây Xanh (Mát)', bg: '#3B82F6', border: '#1E3A8A', text: '#FFFFFF' },
};

const BILL_STYLES: Record<number, { label: string; bg: string; border: string; text: string; keyHint?: string }> = {
  1: { label: '1.000đ', bg: '#EAE3C8', border: '#78716C', text: '#292524', keyHint: '1' },
  2: { label: '2.000đ', bg: '#E2E8F0', border: '#475569', text: '#1E293B', keyHint: '2' },
  5: { label: '5.000đ', bg: '#CFFAFE', border: '#0E7490', text: '#164E63', keyHint: '3' },
  10: { label: '10.000đ', bg: '#FEF3C7', border: '#B45309', text: '#78350F', keyHint: '4' },
  20: { label: '20.000đ', bg: '#DBEAFE', border: '#1D4ED8', text: '#1E3A8A', keyHint: '5' },
  50: { label: '50.000đ', bg: '#FCE7F3', border: '#BE185D', text: '#831843', keyHint: '6' },
  100: { label: '100.000đ', bg: '#DCFCE7', border: '#15803D', text: '#14532D' },
};

const REGISTER_BILLS = [1, 2, 5, 10, 20, 50];

const INITIAL_HUD: GameHudSnapshot = {
  screen: 'TITLE_MENU',
  phase: 'COOKING',
  dishType: 'CUON',
  prepStep: 'TOPPINGS',
  money: 120000,
  xu: 0,
  score: 0,
  ordersServed: 0,
  perfectOrders: 0,
  raidsSurvived: 0,
  redChairs: 3,
  maxRedChairs: 4,
  combo: 0,
  raidTimeLeft: 0,
  muted: false,
  shopOpen: false,
  upgrades: {
    depToOng: false,
    loaKeoKeo: false,
    gheBatTu: false,
    ledRgb: false,
    cursedMenu: false,
    diyMixer: false,
  },
  viralOrdersLeft: 0,
  bocPhotTimer: 0,
  rainActive: false,
  qteActive: false,
  rippedBagActive: false,
  bossFightActive: false,
  hasAngryCustomer: false,
  landladySweeping: false,
  lotteryTicketsToday: 0,
  spawnPenaltyPercentToday: 0,
  nextDayOneStarCount: 0,
  flowPerfectCount: 0,
  flowRhythmActive: false,
  parryWindowActive: false,
  guardStunned: false,
  roomHunters: {
    active: false,
    customerLabel: '',
    promptText: '',
  },
  diyMalfunction: {
    active: false,
    timeLeft: 0,
    maxTime: 4.5,
    leftOrder: ['RED', 'YELLOW', 'BLUE'],
    rightOrder: ['BLUE', 'RED', 'YELLOW'],
    selectedLeftColor: null,
    connected: [],
    wrongFlash: 0,
  },
  loanDebt: 0,
  loanDailyInterest: 0,
  thugsActive: false,
  loanModalOpen: false,
  checkout: {
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
  },
  raidChanceBonus: 0,
  day: 1,
  dayTimeLeft: 180,
  dayDuration: 180,
  dailyPacing: {
    currentDay: 1,
    customerSpawnTimer: 4.5,
    customerPatience: 36,
    actionTimeLimit: 5.5,
    policeRaidChancePerMin: 0.16,
    patienceRatio: 1,
    actionTimeRatio: 1,
    speedMultiplierLabel: '1.00x',
  },
  dayBannerTimer: 0,
  dayBannerText: '',
  inventory: {
    banh_trang: 0,
    kho_bo: 0,
    trung_cut: 0,
    xoai: 0,
    rau_ram: 0,
    tac: 0,
  },
  maxStockPerItem: 12,
  marketPrices: { ...BASE_MARKET_PRICES },
  newspaper: {
    id: 'steady_market',
    headline: 'CHỢ ĐẦU MỐI SÀI GÒN',
    subtext: '',
    multipliers: {},
  },
  dayPnl: {
    day: 1,
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
  },
  vehicleLevel: 1,
  dailyBuffs: {
    luckyCharm: false,
    proteinBuff: false,
    landladySpeedBuff: false,
    karmaBuff: false,
  },
  freeDodgesLeft: 0,
  dailyHexagram: {
    element: 'WOOD',
    name: ELEMENT_META.WOOD.label,
    hexagramTitle: ELEMENT_META.WOOD.hexagramTitle,
    boostDesc: ELEMENT_META.WOOD.boostDesc,
    boostPercent: 35,
  },
  cityTycoon: {
    squads: [
      { id: 'sq1', name: 'Biệt Đội Bạch Tuộc', color: '#10B981', members: 4, districtId: 'CONG_VIEN', morale: 85, stamina: 94, status: 'DEPLOYED' },
      { id: 'sq2', name: 'Tổ Săn Đèn Đỏ', color: '#F59E0B', members: 4, districtId: 'DAI_HOC', morale: 85, stamina: 90, status: 'DEPLOYED' },
      { id: 'sq3', name: 'Chi Nhánh Sinh Viên', color: '#38BDF8', members: 4, districtId: null, morale: 90, stamina: 100, status: 'IDLE' },
      { id: 'sq4', name: 'Đội Phản Ứng Nhanh', color: '#EC4899', members: 4, districtId: null, morale: 85, stamina: 100, status: 'IDLE' },
    ],
    totalStaff: 16,
    passiveIncomePerSec: 2100,
    totalEarned: 0,
    heatLevel: 18,
    upgradeLevel: 1,
    activePolicy: 'NONE',
    crises: [],
    eventFeed: [
      { id: -1, text: '4 tổ đội (16 nhân sự) sẵn sàng nhận lệnh triển khai trên bản đồ!', tone: 'INFO', timeStr: '00:00' },
    ],
    lastTickLog: '4 tổ đội (16 nhân sự) sẵn sàng nhận lệnh.',
  },
  wuxiaCombat: {
    active: false,
    playerHp: 100,
    maxPlayerHp: 100,
    thiefHp: 100,
    maxThiefHp: 100,
    playerX: 300,
    thiefX: 900,
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
    stolenTipJar: 35000,
    projectiles: [],
    statusText: '',
  },
  baziReading: {
    active: false,
    acknowledged: false,
    profile: null,
    customerLabel: '',
  },
  tarot: {
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
  },
  policeHeat: 0,
  ruinedBagBlocking: false,
  badRepOrdersLeft: 0,
  recordingPhoneTimer: 0,
  yellingTimer: 0,
  sauceSplatterWipes: 0,
  gameOverReason: '',
};

const TYCOON_DISTRICTS: {
  id: CityDistrictId;
  name: string;
  rate: number;
  xPct: number;
  yPct: number;
  traffic: string;
  risk: string;
}[] = [
  { id: 'CONG_VIEN', name: 'Công Viên 23/9', rate: 180, xPct: 22, yPct: 68, traffic: 'Trung bình', risk: 'Thấp' },
  { id: 'NGA_TU', name: 'Ngã Tư Hàng Xanh', rate: 240, xPct: 76, yPct: 26, traffic: 'Cao', risk: 'Trung bình' },
  { id: 'DAI_HOC', name: 'Hồ Con Rùa', rate: 270, xPct: 50, yPct: 26, traffic: 'Rất đông', risk: 'Trung bình' },
  { id: 'CHO_BEN_THANH', name: 'Chợ Bến Thành', rate: 330, xPct: 26, yPct: 30, traffic: 'Cực đông', risk: 'Cao' },
  { id: 'PHO_DI_BO', name: 'Phố Đi Bộ Nguyễn Huệ', rate: 390, xPct: 66, yPct: 68, traffic: 'Đỉnh điểm', risk: 'Rất cao' },
];

const TYCOON_POLICIES: { id: TycoonPolicyId; name: string; desc: string }[] = [
  { id: 'NONE', name: 'Cân Bằng', desc: 'Thu nhập & Heat chuẩn' },
  { id: 'OVERDRIVE', name: 'Tăng Ca Chốt Đơn', desc: '+35% Thu nhập, tăng Heat' },
  { id: 'BRIBE_PATROL', name: 'Ngoại Giao Vỉa Hè', desc: '-45% tốc độ tăng Heat' },
  { id: 'TEA_BREAK', name: 'Trà Tắc Dưỡng Sức', desc: 'Hồi thể lực x2 nhanh' },
];

function loadBestRecord(): BestRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bestMoney: 0, bestOrders: 0 };
    const parsed = JSON.parse(raw) as Partial<BestRecord>;
    return {
      bestMoney: typeof parsed.bestMoney === 'number' ? parsed.bestMoney : 0,
      bestOrders: typeof parsed.bestOrders === 'number' ? parsed.bestOrders : 0,
    };
  } catch {
    return { bestMoney: 0, bestOrders: 0 };
  }
}

function saveBestRecord(record: BestRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage quota errors
  }
}

function RedChairSvg({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={active ? 'opacity-100' : 'opacity-25'}
    >
      <path d="M5 10H19V14H5V10Z" fill="#EF4444" stroke="#111318" strokeWidth="2" />
      <path d="M7 14L5 21H8.5L10 14H7Z" fill="#B91C1C" stroke="#111318" strokeWidth="1.8" />
      <path d="M17 14L19 21H15.5L14 14H17Z" fill="#B91C1C" stroke="#111318" strokeWidth="1.8" />
      <rect x="9.5" y="11" width="5" height="1.8" rx="0.9" fill="#7F1D1D" />
    </svg>
  );
}

function TarotArtworkSvg({ cardId }: { cardId: TarotCardId }) {
  return (
    <svg viewBox="0 0 120 150" className="w-24 h-30 mx-auto" aria-hidden="true">
      <rect x="4" y="4" width="112" height="142" rx="10" fill="#1E1B4B" stroke="#FACC15" strokeWidth="3" />
      <rect x="11" y="11" width="98" height="128" rx="6" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeDasharray="4 3" />
      {cardId === 'THE_LOST_SHIPPER' && (
        <g>
          <circle cx="88" cy="30" r="10" fill="#FDE047" />
          <path d="M24 114 L52 94 L68 106 L96 86" fill="none" stroke="#38BDF8" strokeWidth="3.5" strokeDasharray="5 4" strokeLinecap="round" />
          <circle cx="52" cy="54" r="10" fill="#22C55E" stroke="#F8FAFC" strokeWidth="2" />
          <rect x="40" y="66" width="24" height="24" rx="5" fill="#16A34A" stroke="#F8FAFC" strokeWidth="2" />
          <text x="60" y="46" textAnchor="middle" fill="#FACC15" fontSize="14" fontWeight="900">?</text>
        </g>
      )}
      {cardId === 'THE_STREET_VENDOR' && (
        <g>
          <circle cx="60" cy="40" r="13" fill="#FACC15" stroke="#FEF08A" strokeWidth="2" />
          <path d="M30 88 Q60 116 90 88 Z" fill="#94A3B8" stroke="#F8FAFC" strokeWidth="2.5" />
          <circle cx="48" cy="74" r="5" fill="#FB923C" />
          <circle cx="64" cy="68" r="5" fill="#4ADE80" />
          <circle cx="76" cy="76" r="4" fill="#FACC15" />
          <line x1="36" y1="54" x2="84" y2="54" stroke="#FDE047" strokeWidth="2" strokeDasharray="3 3" />
        </g>
      )}
      {cardId === 'THE_URBAN_GUARD' && (
        <g>
          <rect x="34" y="46" width="52" height="14" rx="4" fill="#15803D" stroke="#F8FAFC" strokeWidth="2" />
          <circle cx="60" cy="40" r="5" fill="#FACC15" />
          <rect x="38" y="64" width="44" height="44" rx="6" fill="#166534" stroke="#F8FAFC" strokeWidth="2" />
          <path d="M46 118 L74 118" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
          <circle cx="84" cy="84" r="9" fill="#EF4444" stroke="#FEF2F2" strokeWidth="2" />
        </g>
      )}
      {cardId === 'THE_RIPPED_BAG' && (
        <g>
          <path d="M40 34 L80 34 L86 88 L64 78 L54 94 L34 86 Z" fill="#E2E8F0" fillOpacity="0.25" stroke="#F8FAFC" strokeWidth="2.5" />
          <path d="M36 92 L58 84 L78 96" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
          <circle cx="48" cy="112" r="7" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="1.5" />
          <circle cx="70" cy="120" r="6" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="1.5" />
          <circle cx="58" cy="126" r="5" fill="#FB923C" />
        </g>
      )}
      {cardId === 'THE_TOXIC_COMBO' && (
        <g>
          <path d="M38 42 L48 54 M82 42 L72 54" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
          <path d="M60 112 C40 94 30 78 38 64 C45 53 55 58 60 68 C65 58 75 53 82 64 C90 78 80 94 60 112 Z" fill="#DC2626" stroke="#FCA5A5" strokeWidth="2.5" />
          <path d="M52 76 L68 92 M68 76 L52 92" stroke="#FEF2F2" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {cardId === 'THE_CONFISCATION' && (
        <g>
          <path d="M44 124 L48 52 L72 52 L76 124 Z" fill="#64748B" stroke="#F8FAFC" strokeWidth="2" />
          <path d="M42 46 L52 34 L64 42 L78 34 L74 50 L46 50 Z" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="2" />
          <path d="M84 18 L64 46 L74 48 L54 78" fill="none" stroke="#FACC15" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [hud, setHud] = useState<GameHudSnapshot>(INITIAL_HUD);
  const [bestRecord, setBestRecord] = useState<BestRecord>(() => loadBestRecord());
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [draggingSquadId, setDraggingSquadId] = useState<string | null>(null);
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  const [dropHoverNodeId, setDropHoverNodeId] = useState<CityDistrictId | null>(null);
  const [activeCrisisId, setActiveCrisisId] = useState<number | null>(null);
  const [policyMenuOpen, setPolicyMenuOpen] = useState(false);
  const [trashDragHover, setTrashDragHover] = useState(false);
  const [touchBagPos, setTouchBagPos] = useState<{ x: number; y: number } | null>(null);
  const trashCanRef = useRef<HTMLButtonElement | null>(null);
  const splatterTrackRef = useRef<{ lastX: number; lastY: number; dir: -1 | 0 | 1; dist: number }>({
    lastX: 0,
    lastY: 0,
    dir: 0,
    dist: 0,
  });

  const handleSplatterStart = (clientX: number, clientY: number) => {
    splatterTrackRef.current = {
      lastX: clientX,
      lastY: clientY,
      dir: 0,
      dist: 0,
    };
  };

  const handleSplatterMove = (clientX: number, clientY: number) => {
    const st = splatterTrackRef.current;
    if (st.lastX === 0 && st.lastY === 0) {
      st.lastX = clientX;
      st.lastY = clientY;
      return;
    }
    const dx = clientX - st.lastX;
    const dy = clientY - st.lastY;
    const step = Math.hypot(dx, dy);
    st.lastX = clientX;
    st.lastY = clientY;
    if (step < 1.5) return;

    const curDir: -1 | 0 | 1 =
      Math.abs(dx) >= Math.abs(dy)
        ? dx > 1
          ? 1
          : dx < -1
            ? -1
            : 0
        : dy > 1
          ? 1
          : dy < -1
            ? -1
            : 0;
    st.dist += step;

    if (curDir !== 0 && st.dir !== 0 && curDir !== st.dir && st.dist >= 42) {
      st.dir = curDir;
      st.dist = 0;
      engineRef.current?.wipeSauceSplatter();
    } else if (st.dir === 0 && curDir !== 0) {
      st.dir = curDir;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, (snapshot) => {
      setHud(snapshot);
    });
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Persist high scores cleanly whenever money or ordersServed increases
  useEffect(() => {
    if (hud.money > bestRecord.bestMoney || hud.ordersServed > bestRecord.bestOrders) {
      const next: BestRecord = {
        bestMoney: Math.max(bestRecord.bestMoney, hud.money),
        bestOrders: Math.max(bestRecord.bestOrders, hud.ordersServed),
      };
      setBestRecord(next);
      saveBestRecord(next);
    }
  }, [hud.money, hud.ordersServed, bestRecord.bestMoney, bestRecord.bestOrders]);

  // Enter / Space starts game on Title Screen; Checkout modal keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (hud.screen === 'TITLE_MENU' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        engineRef.current?.startNewGame();
        return;
      }
      if (hud.screen === 'PLAYING' && hud.checkout.active && !hud.shopOpen) {
        const keyToBill: Record<string, number> = {
          Digit1: 1,
          Numpad1: 1,
          Digit2: 2,
          Numpad2: 2,
          Digit3: 5,
          Numpad3: 5,
          Digit4: 10,
          Numpad4: 10,
          Digit5: 20,
          Numpad5: 20,
          Digit6: 50,
          Numpad6: 50,
        };
        if (keyToBill[e.code] !== undefined) {
          e.preventDefault();
          engineRef.current?.addCheckoutBill(keyToBill[e.code]);
        } else if (e.code === 'Backspace') {
          e.preventDefault();
          engineRef.current?.undoCheckoutBill();
        } else if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          engineRef.current?.submitCheckout();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hud.screen, hud.checkout.active, hud.shopOpen]);

  const handleStart = () => {
    engineRef.current?.startNewGame();
  };

  const handleTogglePause = () => {
    engineRef.current?.togglePause();
  };

  const handleToggleMute = () => {
    engineRef.current?.toggleMute();
  };

  const handleReturnTitle = () => {
    engineRef.current?.returnToTitle();
  };

  const handleOpenShop = () => {
    engineRef.current?.setShopOpen(true);
  };

  const handleCloseShop = () => {
    engineRef.current?.setShopOpen(false);
  };

  const handleBuyItem = (id: ShopItemId) => {
    engineRef.current?.buyShopItem(id);
  };

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-[#181920] text-[#F8FAFC] touch-none select-none">
      {/* Isolated 60fps Game Canvas */}
      <div className="absolute inset-0 w-full h-full touch-none">
        <canvas ref={canvasRef} className="block w-full h-full touch-none cursor-crosshair" />
      </div>

      {/* Lightweight Top HUD Bar during active play / prep / end-of-day / pause / game over */}
      {hud.screen !== 'TITLE_MENU' && (
        <div className="pointer-events-none safe-top-bar pb-2 absolute top-0 left-0 right-0 z-10 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 bg-[#181920]/95 border-b-[3px] border-[#111318]">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs sm:text-sm font-semibold whitespace-nowrap overflow-hidden">
            <span className="font-display font-extrabold text-[#F59E0B] tracking-tight">
              Ngày {hud.day}
            </span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span
              className={`font-mono-tabular ${
                hud.dayDuration > 0 && hud.dayTimeLeft <= 20 && hud.screen === 'PLAYING'
                  ? 'text-rose-400 font-bold'
                  : 'text-sky-300'
              }`}
            >
              {hud.dayDuration === 0 ? 'Tự do ∞' : formatClock(hud.dayTimeLeft)}
            </span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="font-mono-tabular text-emerald-400">
              {hud.money.toLocaleString('vi-VN')}đ
            </span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="font-mono-tabular text-amber-300">
              {hud.xu.toLocaleString('vi-VN')} Xu
            </span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="font-mono-tabular text-slate-200">
              {hud.ordersServed} hộp
            </span>
            <span aria-hidden="true" className="text-slate-500 hidden sm:inline">·</span>
            <span className="font-mono-tabular text-sky-300 font-bold hidden sm:inline" title="Gia tốc theo ngày">
              Tốc độ {hud.dailyPacing.speedMultiplierLabel}
            </span>
            {hud.combo > 1 && (
              <>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="font-mono-tabular text-amber-300">
                  Chuỗi x{hud.combo}
                </span>
              </>
            )}
            {hud.viralOrdersLeft > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="font-mono-tabular text-emerald-300 font-bold">
                  Viral x3 ({hud.viralOrdersLeft})
                </span>
              </>
            )}
            {hud.freeDodgesLeft > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-500 hidden md:inline">·</span>
                <span className="font-mono-tabular text-amber-200 hidden md:inline">
                  Né x{hud.freeDodgesLeft}
                </span>
              </>
            )}
            {hud.lotteryTicketsToday > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-500 hidden md:inline">·</span>
                <span className="font-mono-tabular text-amber-300 font-bold hidden md:inline">
                  Vé số: {hud.lotteryTicketsToday}
                </span>
              </>
            )}
            {hud.spawnPenaltyPercentToday > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-500 hidden md:inline">·</span>
                <span className="font-mono-tabular text-lime-300 font-bold hidden md:inline">
                  -{hud.spawnPenaltyPercentToday}% Khách (1⭐)
                </span>
              </>
            )}
            {hud.bocPhotTimer > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="font-mono-tabular text-rose-400 font-bold">
                  Bóc Phốt: {hud.bocPhotTimer}s
                </span>
              </>
            )}
            <span aria-hidden="true" className="text-slate-500 hidden md:inline">·</span>
            <span className="font-mono-tabular text-yellow-300 font-bold hidden md:inline">
              ✂️ Flow {hud.flowPerfectCount}/5
            </span>
            <span aria-hidden="true" className="text-slate-500 hidden lg:inline">·</span>
            <span className="font-mono-tabular text-teal-300 font-bold hidden lg:inline" title={hud.dailyHexagram.boostDesc}>
              ☯️ Quẻ {ELEMENT_META[hud.dailyHexagram.element].shortLabel} (+35%)
            </span>
            {hud.dailyBuffs.karmaBuff && (
              <>
                <span aria-hidden="true" className="text-slate-500 hidden lg:inline">·</span>
                <span className="font-mono-tabular text-amber-300 font-bold hidden lg:inline" title="Bát Tự Cải Vận: +15% tiền bo hôm nay">
                  ✨ Hồng Phúc +15%
                </span>
              </>
            )}
            {hud.badRepOrdersLeft > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span
                  className="font-mono-tabular text-rose-400 font-bold"
                  title="Đang bị Bóc Phốt: khách mới giảm sẵn 30% thanh kiên nhẫn"
                >
                  📱 Bóc phốt: {hud.badRepOrdersLeft} khách (-30% kiên nhẫn)
                </span>
              </>
            )}
            {hud.loanDebt > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="font-mono-tabular text-rose-400 font-bold">
                  ⚡ Nợ {hud.loanDebt.toLocaleString('vi-VN')}đ
                </span>
              </>
            )}
            {hud.phase === 'RAID_CHASE' && (
              <>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="font-mono-tabular text-rose-400">
                  Thoát trật tự: {hud.raidTimeLeft}s
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Police Raid Heat Bar */}
            {hud.screen === 'PLAYING' && (
              <div
                className="flex items-center gap-1.5 shrink-0"
                title="Thanh Nóng Trật Tự — Đạt 100% sẽ kích hoạt Trật Tự Đô Thị ập vào ngay!"
              >
                <span
                  className={`text-xs font-extrabold whitespace-nowrap font-mono-tabular ${
                    hud.policeHeat >= 75
                      ? 'text-rose-400'
                      : hud.policeHeat >= 40
                        ? 'text-amber-300'
                        : 'text-sky-300'
                  }`}
                >
                  🚨 Heat {hud.policeHeat}%
                </span>
                <div className="w-16 h-2.5 rounded-full bg-slate-800 border border-[#111318] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      hud.policeHeat >= 75
                        ? 'bg-rose-500'
                        : hud.policeHeat >= 40
                          ? 'bg-amber-400'
                          : 'bg-sky-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, hud.policeHeat))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Ghế Nhựa Đỏ HP indicator (with explicit count + SVG icons) */}
            <div className="flex items-center gap-1.5" title="Số Ghế Nhựa Đỏ còn lại">
              <span className="text-xs font-semibold text-rose-300 mr-1 whitespace-nowrap">
                Ghế Đỏ {hud.redChairs}/{hud.maxRedChairs}
              </span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: hud.maxRedChairs }).map((_, idx) => (
                  <RedChairSvg key={idx} active={idx < hud.redChairs} />
                ))}
              </div>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              {hud.screen === 'PLAYING' && hud.phase === 'COOKING' && hud.hasAngryCustomer && !hud.checkout.active && (
                <button
                  type="button"
                  disabled={hud.money < 2000}
                  onClick={() => engineRef.current?.appeaseAngryCustomer()}
                  className="flex items-center gap-1 px-3 h-9 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] disabled:bg-slate-600 disabled:text-slate-300 border-2 border-[#111318] text-[#111318] font-extrabold text-xs whitespace-nowrap shrink-0 transition-transform active:translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>🥚 Tặng Trứng (-2k)</span>
                </button>
              )}
              {hud.screen === 'PLAYING' && hud.phase === 'COOKING' && !hud.checkout.active && (
                <>
                  {!hud.flowRhythmActive && (
                    <>
                      <button
                        type="button"
                        onClick={() => engineRef.current?.summonFortuneCustomer()}
                        title="Bói Toán Vỉa Hè: Mời Khách Bát Tự hoặc Gen Z Trải Bài Tarot"
                        className="flex items-center gap-1 px-3 h-9 rounded-lg bg-[#6366F1] hover:bg-[#818CF8] border-2 border-[#111318] text-white font-extrabold text-xs whitespace-nowrap shrink-0 transition-transform active:translate-y-0.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Bói Vỉa Hè</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => engineRef.current?.triggerScissorRhythm()}
                        title="Vào chế độ Nhịp Kéo Flow State (Phím M)"
                        className="flex items-center gap-1 px-3 h-9 rounded-lg bg-[#A855F7] hover:bg-[#C084FC] border-2 border-[#111318] text-white font-extrabold text-xs whitespace-nowrap shrink-0 transition-transform active:translate-y-0.5 cursor-pointer"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Nhịp Kéo</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => engineRef.current?.setLoanModalOpen(true)}
                    className="flex items-center gap-1 px-3 h-9 rounded-lg bg-[#FACC15] hover:bg-[#FDE047] border-2 border-[#111318] text-[#111318] font-extrabold text-xs whitespace-nowrap shrink-0 transition-transform active:translate-y-0.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Cột Điện</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenShop}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#10B981] hover:bg-[#34D399] border-2 border-[#111318] text-white font-bold text-xs whitespace-nowrap shrink-0 transition-transform active:translate-y-0.5 cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Cửa Hàng</span>
                  </button>
                  {hud.dayDuration === 0 && !hud.flowRhythmActive && (
                    <button
                      type="button"
                      onClick={() => engineRef.current?.closeShopNow()}
                      className="flex items-center gap-1 px-3 h-9 rounded-lg bg-rose-500 hover:bg-rose-400 border-2 border-[#111318] text-white font-bold text-xs whitespace-nowrap shrink-0 transition-transform active:translate-y-0.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đóng Ca</span>
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={hud.muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#272A36] hover:bg-[#343848] border-2 border-[#111318] text-slate-100 transition-transform active:translate-y-0.5 cursor-pointer"
              >
                {hud.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              {(hud.screen === 'PLAYING' || hud.screen === 'PAUSED') && (
                <button
                  type="button"
                  onClick={handleTogglePause}
                  aria-label={hud.screen === 'PAUSED' ? 'Tiếp tục' : 'Tạm dừng'}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] border-2 border-[#111318] text-[#111318] font-bold text-xs whitespace-nowrap shrink-0 transition-transform active:translate-y-0.5 cursor-pointer"
                >
                  {hud.screen === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{hud.screen === 'PAUSED' ? 'Tiếp Tục' : 'Tạm Dừng'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TITLE SCREEN */}
      {hud.screen === 'TITLE_MENU' && (
        <div className="safe-inset-container absolute inset-0 z-20 flex items-center overflow-y-auto allow-touch-scroll bg-[#181920]">
          {/* Illustrated Key-Art Backdrop with Zero-Broken-Image fallback */}
          {!heroImgFailed ? (
            <img
              src={heroBgUrl}
              alt="Xe bánh tráng trộn vỉa hè Sài Gòn về đêm"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="absolute inset-0 w-full h-full object-cover object-right"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E2230] via-[#2B2D38] to-[#422006]" />
          )}

          {/* Measured left scrim for crisp readability over 35-40% negative space */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#111318]/95 via-[#111318]/80 to-[#111318]/15" />

          {/* Sound toggle in top right (Dynamic Island safe) */}
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={hud.muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            style={{ top: 'max(1.25rem, env(safe-area-inset-top, 0px))', right: 'max(1.25rem, env(safe-area-inset-right, 0px))' }}
            className="absolute z-30 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#181920]/90 hover:bg-[#272A36] border-2 border-[#111318] text-slate-100 text-xs font-semibold whitespace-nowrap cursor-pointer"
          >
            {hud.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{hud.muted ? 'Đang Tắt Tiếng' : 'Âm Thanh Bật'}</span>
          </button>

          {/* Left-aligned Title Lockup & Primary CTA */}
          <div className="relative z-10 max-w-xl px-4 sm:px-8 md:px-14 my-auto flex flex-col items-start gap-5">
            {/* Bespoke SVG Comic Title Lockup */}
            <svg
              viewBox="0 0 540 165"
              className="w-full max-w-[500px] h-auto overflow-visible"
              role="img"
              aria-label="Bánh Tráng Trộn Sinh Tồn: Đam Mê và Trật Tự"
            >
              <g transform="rotate(-1.5 270 80)">
                {/* Comic drop shadow */}
                <text
                  x="6"
                  y="62"
                  fill="#111318"
                  fontFamily="Bricolage Grotesque, sans-serif"
                  fontWeight="800"
                  fontSize="52"
                  letterSpacing="-1"
                >
                  BÁNH TRÁNG TRỘN
                </text>
                <text
                  x="2"
                  y="58"
                  fill="#FBBF24"
                  stroke="#111318"
                  strokeWidth="6"
                  paintOrder="stroke"
                  fontFamily="Bricolage Grotesque, sans-serif"
                  fontWeight="800"
                  fontSize="52"
                  letterSpacing="-1"
                >
                  BÁNH TRÁNG TRỘN
                </text>

                <text
                  x="6"
                  y="118"
                  fill="#111318"
                  fontFamily="Bricolage Grotesque, sans-serif"
                  fontWeight="800"
                  fontSize="46"
                  letterSpacing="-0.5"
                >
                  SINH TỒN
                </text>
                <text
                  x="2"
                  y="114"
                  fill="#FFFFFF"
                  stroke="#111318"
                  strokeWidth="6"
                  paintOrder="stroke"
                  fontFamily="Bricolage Grotesque, sans-serif"
                  fontWeight="800"
                  fontSize="46"
                  letterSpacing="-0.5"
                >
                  SINH TỒN
                </text>

                {/* Accent ribbon bar for subtitle */}
                <rect x="2" y="132" width="320" height="30" rx="6" fill="#E11D48" stroke="#111318" strokeWidth="3" />
                <text
                  x="162"
                  y="152"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontFamily="Bricolage Grotesque, sans-serif"
                  fontWeight="800"
                  fontSize="16"
                  letterSpacing="1"
                >
                  ĐAM MÊ &amp; TRẬT TỰ
                </text>
              </g>
            </svg>

            <p className="text-base text-slate-200 leading-relaxed max-w-md text-balance">
              Cắt bánh tráng chuẩn từng khúc, chiều lòng Ninja Lead &amp; Gen Z với combo dị, và đẩy xe chạy hết tốc lực mỗi khi còi Trật Tự vang lên.
            </p>

            {/* Customizable Play Duration Selector */}
            <div className="w-full max-w-lg">
              <ShiftDurationSelector
                dayDuration={hud.dayDuration}
                onSelect={(secs) => engineRef.current?.setDayDuration(secs)}
                dark
              />
            </div>

            {/* Primary CTA */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleStart}
                className="px-7 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#111318] font-display font-extrabold text-lg border-[3px] border-[#111318] comic-shadow transition-transform hover:-translate-y-0.5 active:translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Bắt Đầu Bán (Enter)
              </button>
              <button
                type="button"
                onClick={() => engineRef.current?.openCityTycoon()}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#10B981] hover:bg-[#34D399] text-white font-display font-extrabold text-base border-[3px] border-[#111318] comic-shadow transition-transform hover:-translate-y-0.5 active:translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <MapIcon className="w-5 h-5" />
                <span>Bản Đồ Đội Nhóm (16 NV)</span>
              </button>
              <a
                href="/banh-trang-master.html"
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#111318] font-display font-extrabold text-base border-[3px] border-[#111318] comic-shadow transition-transform hover:-translate-y-0.5 active:translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Bánh Tráng Master (2D Lab)</span>
              </a>
            </div>

            {/* Single flat control-hint line + personal best */}
            <div className="flex flex-col gap-2 pt-2 text-xs text-slate-300">
              <p className="font-medium text-slate-200">
                Kéo cắt bánh · Bỏ topping · Cuộn màn hình để cuốn · A/D hoặc ←/→ né trật tự · Esc Tạm dừng
              </p>
              {(bestRecord.bestMoney > 0 || bestRecord.bestOrders > 0) && (
                <p className="font-mono-tabular text-amber-300">
                  Kỷ lục vỉa hè: {bestRecord.bestMoney.toLocaleString('vi-VN')}đ · Nhiều nhất {bestRecord.bestOrders} hộp
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MORNING PREP: DAILY NEWSPAPER & WHOLESALE INVENTORY MARKET */}
      {hud.screen === 'MORNING_PREP' && (() => {
        const totalToppings =
          hud.inventory.kho_bo + hud.inventory.trung_cut + hud.inventory.xoai + hud.inventory.rau_ram;
        const canOpenShop =
          hud.inventory.banh_trang >= 1 && hud.inventory.tac >= 1 && totalToppings >= 2;
        const vehicleMeta = VEHICLE_TIERS.find((v) => v.level === hud.vehicleLevel) ?? VEHICLE_TIERS[0];

        return (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111318]/85 p-4 pt-16 overflow-y-auto allow-touch-scroll safe-inset-container">
            <div className="w-full max-w-3xl rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] border-[#111318] comic-shadow p-6 flex flex-col gap-4 my-auto">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
                <div>
                  <h2 className="font-display font-extrabold text-2xl text-[#111318]">
                    Chợ Sớm Ngày {hud.day} · Nhập Nguyên Liệu
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Phương tiện: <strong className="text-[#111318]">{vehicleMeta.name}</strong> (Tối đa{' '}
                    <span className="font-mono-tabular font-bold">{hud.maxStockPerItem}</span> phần/món) ·{' '}
                    {hud.dayDuration === 0
                      ? 'Bán Tự Do (đóng quán khi nào muốn)'
                      : `Ca bán ${Math.round(hud.dayDuration / 60)} phút`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-500">Vốn tiền mặt</div>
                  <div className="font-mono-tabular font-extrabold text-2xl text-emerald-700">
                    {hud.money.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>

              {/* Customizable Shift Duration before opening */}
              <ShiftDurationSelector
                dayDuration={hud.dayDuration}
                onSelect={(secs) => engineRef.current?.setDayDuration(secs)}
              />

              {/* Daily Newspaper Event & Daily Hexagram */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#FEF3C7] border-[2.5px] border-[#111318] p-3.5 flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#111318] text-[#FBBF24] shrink-0 mt-0.5">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-extrabold tracking-wider text-rose-700">
                      BÁO BUỔI SÁNG · KINH TẾ THỊ TRƯỜNG
                    </div>
                    <h3 className="font-display font-extrabold text-base text-[#111318] mt-0.5">
                      {hud.newspaper.headline}
                    </h3>
                    <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                      {hud.newspaper.subtext}
                    </p>
                  </div>
                </div>

                {(() => {
                  const elMeta = ELEMENT_META[hud.dailyHexagram.element];
                  return (
                    <div
                      style={{ backgroundColor: elMeta.bg }}
                      className="rounded-xl border-[2.5px] border-[#111318] p-3.5 flex items-start gap-3"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#111318] text-white shrink-0 mt-0.5">
                        <Sparkles className="w-5 h-5 text-amber-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-extrabold tracking-wider" style={{ color: elMeta.color }}>
                          QUẺ BÁT TỰ HÔM NAY · {elMeta.label.toUpperCase()}
                        </div>
                        <h3 className="font-display font-extrabold text-base text-[#111318] mt-0.5">
                          {hud.dailyHexagram.hexagramTitle}
                        </h3>
                        <p className="text-xs text-slate-800 mt-0.5 leading-relaxed">
                          {hud.dailyHexagram.boostDesc} · <strong className="text-rose-700">{elMeta.clashLabel}</strong>
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Endless Daily Acceleration ("Gia tốc theo ngày") Live Scaling Summary */}
              <div className="rounded-xl bg-[#EEF2FF] border-[2.5px] border-[#111318] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#111318]">
                <div className="font-display font-extrabold text-indigo-950">
                  ⚡ GIA TỐC NGÀY {hud.day} ({hud.dailyPacing.speedMultiplierLabel})
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono-tabular font-bold text-slate-700">
                  <span>Khách mới: {hud.dailyPacing.customerSpawnTimer.toFixed(1)}s</span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span>Chờ tối đa: {hud.dailyPacing.customerPatience.toFixed(1)}s</span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span>Thời gian thao tác: {hud.dailyPacing.actionTimeLimit.toFixed(1)}s</span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span className="text-rose-700">
                    Trật tự: {Math.round(hud.dailyPacing.policeRaidChancePerMin * 100)}%/phút
                  </span>
                </div>
              </div>

              {hud.spawnPenaltyPercentToday > 0 && (
                <div className="rounded-xl bg-lime-100 border-2 border-[#111318] px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <div className="text-xs font-bold text-[#111318]">
                    ⚠️ Dư âm Bão 1⭐ hôm qua (Nguyên Liệu Hắc Ám gây ngộ độc): Tốc độ khách ghé quán hôm nay giảm{' '}
                    <span className="font-mono-tabular font-extrabold text-rose-700">
                      -{hud.spawnPenaltyPercentToday}%
                    </span>
                    .
                  </div>
                </div>
              )}

              {/* Wholesale Market Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {RAW_INGREDIENTS.map((item) => {
                  const id: RawIngredientId = item.id;
                  const price = hud.marketPrices[id];
                  const mult = hud.newspaper.multipliers[id] ?? 1;
                  const stock = hud.inventory[id];
                  const isFull = stock >= hud.maxStockPerItem;
                  const canBuy1 = !isFull && hud.money >= price;
                  const canBuy5 = !isFull && hud.money >= price;

                  return (
                    <div
                      key={id}
                      style={{ backgroundColor: item.color }}
                      className="rounded-xl border-2 border-[#111318] p-3 flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-display font-extrabold text-sm text-[#111318] leading-tight">
                            {item.name}
                          </span>
                          {mult !== 1 && (
                            <span
                              className={`inline-flex items-center gap-0.5 font-mono-tabular font-extrabold text-[11px] px-1.5 py-0.5 rounded border border-[#111318] shrink-0 ${
                                mult > 1 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                              }`}
                            >
                              {mult > 1 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              x{mult}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-xs">
                          <span className="font-mono-tabular font-bold text-[#111318]">
                            {price.toLocaleString('vi-VN')}đ/{item.unit}
                          </span>
                          <span
                            className={`font-mono-tabular font-extrabold ${
                              stock === 0 ? 'text-rose-600' : 'text-emerald-800'
                            }`}
                          >
                            Kho: {stock}/{hud.maxStockPerItem}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!canBuy1}
                          onClick={() => engineRef.current?.buyIngredient(id, 1)}
                          className="flex-1 py-1.5 rounded-lg bg-white hover:bg-amber-100 disabled:opacity-40 border-2 border-[#111318] font-mono-tabular font-extrabold text-xs cursor-pointer disabled:cursor-not-allowed"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          disabled={!canBuy5}
                          onClick={() => engineRef.current?.buyIngredient(id, 5)}
                          className="flex-1 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] disabled:opacity-40 border-2 border-[#111318] font-mono-tabular font-extrabold text-xs cursor-pointer disabled:cursor-not-allowed"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t-2 border-slate-200">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => engineRef.current?.buyRecommendedStock()}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-[#111318] font-display font-bold text-xs text-[#111318] comic-shadow-sm active:translate-y-0.5 cursor-pointer"
                  >
                    Mua Nhanh Đủ Bán (Mỗi món +8)
                  </button>
                  {!canOpenShop && hud.money < 15000 && (
                    <button
                      type="button"
                      onClick={() => engineRef.current?.takeEmergencyLoan()}
                      className="px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 border-2 border-[#111318] font-display font-bold text-xs text-rose-800 cursor-pointer"
                    >
                      Vay Vỉa Hè (+80.000đ · Phí 15k)
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!canOpenShop}
                  onClick={() => engineRef.current?.startDayShift()}
                  className="px-6 py-3 rounded-xl bg-[#10B981] hover:bg-[#34D399] disabled:bg-slate-300 disabled:text-slate-500 text-white font-display font-extrabold text-sm border-[3px] border-[#111318] comic-shadow-sm active:translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {canOpenShop
                    ? `Mở Quán Ngày ${hud.day}! →`
                    : 'Cần ít nhất 1 Bánh Tráng, 1 Tắc & 2 Topping'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* END OF DAY P&L & GARAGE UPGRADES */}
      {hud.screen === 'END_OF_DAY' && (() => {
        const pnl = hud.dayPnl;
        const netPositive = pnl.netProfit >= 0;
        const nextTier = VEHICLE_TIERS.find((v) => v.level === hud.vehicleLevel + 1);

        return (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111318]/85 p-4 pt-16 overflow-y-auto allow-touch-scroll safe-inset-container">
            <div className="w-full max-w-2xl rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] border-[#111318] comic-shadow p-6 flex flex-col gap-5 my-auto">
              <div className="flex items-start justify-between gap-4 border-b-2 border-slate-200 pb-3">
                <div>
                  <div className="text-xs font-extrabold text-amber-700">
                    ĐÓNG QUÁN CUỐI NGÀY
                  </div>
                  <h2 className="font-display font-extrabold text-2xl text-[#111318]">
                    Sổ Thu Chi Ngày {pnl.day} (P&amp;L)
                  </h2>
                  {pnl.closedEarlyReason && (
                    <p className="text-xs font-bold text-rose-600 mt-1">
                      {pnl.closedEarlyReason}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold text-slate-500">Tiền mặt hiện có</div>
                  <div className="font-mono-tabular font-extrabold text-2xl text-emerald-700">
                    {hud.money.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>

              {/* Accurate P&L Breakdown */}
              <div className="rounded-xl bg-[#FEF9E7] border-2 border-[#111318] p-4 flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">
                    Tổng Doanh Thu ({pnl.ordersCompleted} đơn hàng)
                  </span>
                  <span className="font-mono-tabular font-bold text-emerald-700">
                    +{pnl.revenue.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Chi Phí Nhập Nguyên Liệu</span>
                  <span className="font-mono-tabular font-bold text-rose-600">
                    -{pnl.ingredientCosts.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Tiền Bến Bãi Vỉa Hè</span>
                  <span className="font-mono-tabular font-bold text-rose-600">
                    -{pnl.rentCost.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Tiền Phạt Trật Tự &amp; Khác</span>
                  <span className="font-mono-tabular font-bold text-rose-600">
                    -{pnl.finesCost.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                {pnl.loanInterestCost > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Lãi Tín Dụng Đen (25%/ngày)</span>
                    <span className="font-mono-tabular font-bold text-rose-600">
                      -{pnl.loanInterestCost.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}
                {pnl.lotteryTickets > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">
                      Xổ Số Kiến Thiết ({pnl.lotteryTickets} vé mua hôm nay)
                    </span>
                    <span
                      className={`font-mono-tabular font-bold ${
                        pnl.lotteryWin > 0 ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {pnl.lotteryWin > 0
                        ? `+${pnl.lotteryWin.toLocaleString('vi-VN')}đ (TRÚNG ĐỘC ĐẮC!)`
                        : 'Trượt giải (0đ)'}
                    </span>
                  </div>
                )}
                <div className="border-t-2 border-[#111318] pt-2 mt-1 flex items-center justify-between">
                  <span className="font-display font-extrabold text-base text-[#111318]">
                    Lãi Ròng Hôm Nay (Net Profit)
                  </span>
                  <span
                    className={`font-mono-tabular font-extrabold text-xl ${
                      netPositive ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {netPositive ? '+' : ''}
                    {pnl.netProfit.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                {hud.loanDebt > 0 && (
                  <div className="mt-1 rounded-lg bg-rose-100 border-2 border-[#111318] px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-rose-900">
                    <span>
                      {hud.thugsActive
                        ? `⚠️ Không đủ tiền đóng lãi! 2 Đàn Em Đòi Nợ đang chặn nửa đường (-50% khách) · Nợ gốc: ${hud.loanDebt.toLocaleString('vi-VN')}đ`
                        : `⚡ Đang nợ Tín Dụng Đen ${hud.loanDebt.toLocaleString('vi-VN')}đ (Lãi ngày mai: ${hud.loanDailyInterest.toLocaleString('vi-VN')}đ)`}
                    </span>
                    <button
                      type="button"
                      disabled={hud.money < hud.loanDebt}
                      onClick={() => engineRef.current?.repayLoanShark()}
                      className="px-3 py-1 rounded-lg bg-[#10B981] hover:bg-[#34D399] disabled:bg-slate-300 disabled:text-slate-500 text-white font-display font-extrabold border-2 border-[#111318] cursor-pointer disabled:cursor-not-allowed"
                    >
                      Trả Sạch Nợ ({hud.loanDebt.toLocaleString('vi-VN')}đ)
                    </button>
                  </div>
                )}
                {hud.nextDayOneStarCount > 0 && (
                  <div className="mt-1 rounded-lg bg-lime-100 border border-[#111318] px-3 py-1.5 text-xs font-bold text-[#111318]">
                    🤢 Nhận {hud.nextDayOneStarCount} đánh giá 1⭐ vì khách ngộ độc Menu Hắc Ám → Ngày mai giảm{' '}
                    {Math.min(60, hud.nextDayOneStarCount * 20)}% lượng khách!
                  </div>
                )}
              </div>

              {/* Mechanic 9: Garage Vehicle Upgrades */}
              <div className="rounded-xl bg-slate-100 border-2 border-[#111318] p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#111318]" />
                  <h3 className="font-display font-extrabold text-base text-[#111318]">
                    Gara Nâng Cấp Xe Bán Hàng
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {VEHICLE_TIERS.map((tier) => {
                    const owned = hud.vehicleLevel >= tier.level;
                    const isCurrent = hud.vehicleLevel === tier.level;
                    return (
                      <div
                        key={tier.level}
                        className={`rounded-lg border-2 border-[#111318] p-3 flex flex-col justify-between gap-1.5 ${
                          isCurrent ? 'bg-[#FEF3C7]' : owned ? 'bg-[#ECFDF5]' : 'bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-display font-extrabold text-xs text-[#111318]">
                              Cấp {tier.level}: {tier.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">{tier.perk}</p>
                        </div>
                        <div className="text-[11px] font-mono-tabular font-bold pt-1">
                          {isCurrent ? (
                            <span className="text-amber-700">Đang sử dụng</span>
                          ) : owned ? (
                            <span className="text-emerald-700">Đã vượt qua</span>
                          ) : (
                            <span className="text-slate-700">
                              Giá: {tier.upgradeCost.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {nextTier && (
                  <button
                    type="button"
                    disabled={hud.money < nextTier.upgradeCost}
                    onClick={() => engineRef.current?.upgradeVehicle()}
                    className="w-full py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] disabled:bg-slate-300 disabled:text-slate-500 text-[#111318] font-display font-extrabold text-xs border-2 border-[#111318] comic-shadow-sm cursor-pointer disabled:cursor-not-allowed"
                  >
                    {hud.money >= nextTier.upgradeCost
                      ? `Nâng Cấp Lên ${nextTier.name} (${nextTier.upgradeCost.toLocaleString('vi-VN')}đ)`
                      : `Cần ${nextTier.upgradeCost.toLocaleString('vi-VN')}đ để lên ${nextTier.name}`}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => engineRef.current?.startNextDay()}
                className="w-full py-3.5 rounded-xl bg-[#10B981] hover:bg-[#34D399] text-white font-display font-extrabold text-base border-[3px] border-[#111318] comic-shadow-sm active:translate-y-0.5 cursor-pointer"
              >
                Sang Ngày {hud.day + 1} · Đi Chợ Sớm →
              </button>
            </div>
          </div>
        );
      })()}

      {/* CITY MAP TYCOON MODE ("Bản Đồ Điều Phối Tổ Đội — 16 Nhân Sự") */}
      {hud.screen === 'CITY_TYCOON' && (() => {
        const arrestedCount = hud.cityTycoon.squads.filter((s) => s.status === 'ARRESTED').length;
        const bailCost = arrestedCount * 18000;
        const upgradeCost = hud.cityTycoon.upgradeLevel * 15000;
        const activeCrisisModal =
          activeCrisisId !== null
            ? hud.cityTycoon.crises.find((c) => c.id === activeCrisisId) ?? null
            : null;
        const statusLabelMap = {
          IDLE: { text: 'Rảnh (Kéo thả)', bg: '#E2E8F0', fg: '#334155' },
          DEPLOYED: { text: 'Đang Bán', bg: '#DCFCE7', fg: '#166534' },
          CRISIS: { text: 'Gặp Biến!', bg: '#FEE2E2', fg: '#B91C1C' },
          ARRESTED: { text: 'Bị Tạm Giữ', bg: '#1E293B', fg: '#FCA5A5' },
        } as const;

        return (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111318]/92 p-3 sm:p-4 overflow-y-auto allow-touch-scroll safe-inset-container">
            <div className="w-full max-w-6xl rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] border-[#111318] comic-shadow p-4 sm:p-5 flex flex-col gap-3.5 my-auto">
              {/* 1. TOP HUD: Total Money, Passive Income (+VND/sec), Heat Level progress bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#181920] text-white border-2 border-[#111318] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F59E0B] border-2 border-[#111318] flex items-center justify-center text-[#111318] shrink-0">
                    <MapIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold tracking-wider text-amber-300">
                      BẢN ĐỒ CHIẾN THUẬT VỈA HÈ · 16 NHÂN SỰ
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-0.5 text-sm">
                      <span className="font-mono-tabular font-extrabold text-emerald-400">
                        Tổng tiền: {hud.money.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="font-mono-tabular font-extrabold text-amber-300">
                        +{hud.cityTycoon.passiveIncomePerSec.toLocaleString('vi-VN')}đ/giây
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-1 justify-end min-w-[260px]">
                  <div className="flex flex-col gap-1 min-w-[175px] max-w-[230px] w-full">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={hud.cityTycoon.heatLevel >= 70 ? 'text-rose-400' : 'text-amber-200'}>
                        🔥 Chú Ý Trật Tự (Heat)
                      </span>
                      <span className="font-mono-tabular text-white">
                        {Math.round(hud.cityTycoon.heatLevel)}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-150 ${
                          hud.cityTycoon.heatLevel >= 75
                            ? 'bg-rose-500'
                            : hud.cityTycoon.heatLevel >= 45
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, hud.cityTycoon.heatLevel))}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveCrisisId(null);
                      setPolicyMenuOpen(false);
                      engineRef.current?.closeCityTycoon();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border-2 border-[#111318] text-white font-display font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    ← Trang Chủ
                  </button>
                </div>
              </div>

              {/* MAIN 3-COLUMN TACTICAL GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                {/* 3. LEFT ROSTER PANEL: 4 Draggable Squad Cards */}
                <div className="lg:col-span-3 rounded-2xl bg-[#FEF9E7] border-[2.5px] border-[#111318] p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-[#111318]/15 pb-1.5">
                    <div className="flex items-center gap-1.5 font-display font-extrabold text-sm text-[#111318]">
                      <Users className="w-4 h-4 text-amber-700" />
                      <span>Đội Ngũ (4 Tổ · 16 NV)</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">Kéo / Chọn</span>
                  </div>

                  {hud.cityTycoon.squads.map((sq) => {
                    const st = statusLabelMap[sq.status];
                    const canDrag = sq.status === 'IDLE' || sq.status === 'DEPLOYED';
                    const isSelected = selectedSquadId === sq.id;
                    const distName = sq.districtId
                      ? TYCOON_DISTRICTS.find((d) => d.id === sq.districtId)?.name
                      : null;

                    return (
                      <div
                        key={sq.id}
                        draggable={canDrag}
                        onDragStart={(e) => {
                          if (!canDrag) {
                            e.preventDefault();
                            return;
                          }
                          e.dataTransfer.setData('text/plain', sq.id);
                          setDraggingSquadId(sq.id);
                          setSelectedSquadId(sq.id);
                        }}
                        onDragEnd={() => {
                          setDraggingSquadId(null);
                          setDropHoverNodeId(null);
                        }}
                        onClick={() => {
                          if (canDrag) {
                            setSelectedSquadId((prev) => (prev === sq.id ? null : sq.id));
                          }
                        }}
                        className={`rounded-xl border-2 p-2.5 flex flex-col gap-2 transition-transform ${
                          canDrag ? 'cursor-grab active:cursor-grabbing hover:-translate-y-0.5' : 'opacity-80 cursor-not-allowed'
                        } ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-300 bg-white'
                            : sq.status === 'CRISIS'
                            ? 'border-rose-600 bg-rose-50 animate-pulse'
                            : sq.status === 'ARRESTED'
                            ? 'border-slate-700 bg-slate-200'
                            : 'border-[#111318] bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              style={{ backgroundColor: sq.color }}
                              className="w-3 h-3 rounded-full border border-[#111318] shrink-0"
                            />
                            <span className="font-display font-extrabold text-xs text-[#111318] truncate">
                              {sq.name} ({sq.members} NV)
                            </span>
                          </div>
                          <span
                            style={{ backgroundColor: st.bg, color: st.fg }}
                            className="px-1.5 py-0.5 rounded border border-[#111318] text-[10px] font-extrabold whitespace-nowrap shrink-0"
                          >
                            {st.text}
                          </span>
                        </div>

                        {/* Stamina Bar */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                            <span>Thể lực</span>
                            <span className="font-mono-tabular">{Math.round(sq.stamina)}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 border border-[#111318] overflow-hidden">
                            <div
                              className={`h-full transition-all duration-150 ${
                                sq.stamina < 25 ? 'bg-rose-500' : sq.stamina < 55 ? 'bg-amber-400' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, sq.stamina))}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="text-slate-600 font-semibold truncate">
                            {distName ? `📍 ${distName}` : sq.status === 'ARRESTED' ? '🚔 Đang ở phường' : '☕ Đang nghỉ tại kho'}
                          </span>
                          {sq.status === 'DEPLOYED' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                engineRef.current?.assignSquadDistrict(sq.id, null);
                              }}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-amber-100 border border-[#111318] font-bold text-[#111318] whitespace-nowrap cursor-pointer"
                            >
                              Thu hồi
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. CENTER MAP AREA: Stylized Crumpled-Paper Tactical Saigon Map with 5 Absolute Nodes */}
                <div className="lg:col-span-6 flex flex-col gap-2">
                  <div
                    className="relative w-full h-[380px] sm:h-[420px] rounded-2xl border-[3px] border-[#111318] overflow-hidden select-none"
                    style={{
                      backgroundColor: '#EDE0C8',
                      backgroundImage:
                        'radial-gradient(circle at 22% 28%, rgba(180,130,70,0.16) 0%, transparent 45%), radial-gradient(circle at 78% 72%, rgba(160,115,65,0.14) 0%, transparent 42%), repeating-linear-gradient(12deg, rgba(17,19,24,0.03) 0px, rgba(17,19,24,0.03) 1px, transparent 1px, transparent 36px)',
                    }}
                  >
                    {/* Crumpled creases, Saigon river & tactical road markings */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 480" preserveAspectRatio="none">
                      <path d="M0,360 Q220,275 430,335 T800,220" fill="none" stroke="#60A5FA" strokeWidth="34" opacity="0.55" />
                      <path d="M0,360 Q220,275 430,335 T800,220" fill="none" stroke="#1E3A8A" strokeWidth="2" strokeDasharray="8 6" opacity="0.4" />
                      <line x1="90" y1="40" x2="680" y2="430" stroke="#78716C" strokeWidth="5" strokeDasharray="12 8" opacity="0.45" />
                      <line x1="650" y1="55" x2="120" y2="410" stroke="#78716C" strokeWidth="5" strokeDasharray="12 8" opacity="0.45" />
                      <line x1="200" y1="130" x2="620" y2="130" stroke="#A8A29E" strokeWidth="3" opacity="0.5" />
                      {/* Paper fold lines */}
                      <line x1="400" y1="0" x2="400" y2="480" stroke="#57534E" strokeWidth="1.2" strokeDasharray="4 6" opacity="0.25" />
                      <line x1="0" y1="240" x2="800" y2="240" stroke="#57534E" strokeWidth="1.2" strokeDasharray="4 6" opacity="0.25" />
                    </svg>

                    <div className="relative z-10 flex items-center justify-between px-3.5 py-2 bg-[#111318]/85 text-[#FEF3C7] text-[11px] font-bold">
                      <span>🗺️ BẢN ĐỒ TÁC CHIẾN VỈA HÈ SÀI GÒN</span>
                      <span className="text-amber-300 font-mono-tabular">
                        {selectedSquadId ? 'Chạm vào 1 điểm để điều động!' : 'Kéo thẻ từ cột trái thả vào điểm nóng'}
                      </span>
                    </div>

                    {TYCOON_DISTRICTS.map((dist) => {
                      const occupant = hud.cityTycoon.squads.find((s) => s.districtId === dist.id);
                      const crisis = hud.cityTycoon.crises.find((c) => c.districtId === dist.id);
                      const isDropTarget = dropHoverNodeId === dist.id;

                      return (
                        <div
                          key={dist.id}
                          style={{ left: `${dist.xPct}%`, top: `${dist.yPct}%` }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dropHoverNodeId !== dist.id) {
                              setDropHoverNodeId(dist.id);
                            }
                          }}
                          onDragLeave={() => {
                            if (dropHoverNodeId === dist.id) {
                              setDropHoverNodeId(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const sqId = e.dataTransfer.getData('text/plain') || draggingSquadId;
                            setDraggingSquadId(null);
                            setDropHoverNodeId(null);
                            setSelectedSquadId(null);
                            if (sqId) {
                              engineRef.current?.assignSquadDistrict(sqId, dist.id);
                            }
                          }}
                          onClick={() => {
                            if (crisis) {
                              setActiveCrisisId(crisis.id);
                              return;
                            }
                            if (selectedSquadId) {
                              engineRef.current?.assignSquadDistrict(selectedSquadId, dist.id);
                              setSelectedSquadId(null);
                            }
                          }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 w-[166px] rounded-xl border-[2.5px] p-2.5 comic-shadow-sm transition-transform cursor-pointer ${
                            crisis
                              ? 'bg-rose-600 text-white border-[#111318] animate-pulse scale-105'
                              : isDropTarget
                              ? 'bg-amber-200 text-[#111318] border-indigo-600 scale-105'
                              : occupant
                              ? 'bg-[#FFFDF5] text-[#111318] border-[#111318]'
                              : 'bg-[#FFFDF5]/92 text-[#111318] border-dashed border-[#44403C] hover:scale-105'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-display font-extrabold text-xs truncate">
                              {dist.name}
                            </span>
                            <span
                              className={`font-mono-tabular font-extrabold text-[10px] shrink-0 ${
                                crisis ? 'text-yellow-200' : 'text-emerald-700'
                              }`}
                            >
                              {dist.rate}đ/s
                            </span>
                          </div>

                          <div
                            className={`text-[10px] mt-1 font-semibold flex items-center justify-between ${
                              crisis ? 'text-rose-100' : 'text-slate-600'
                            }`}
                          >
                            <span>Đông: {dist.traffic}</span>
                            <span>Rủi ro: {dist.risk}</span>
                          </div>

                          <div className="mt-1.5 pt-1 border-t border-black/10 flex items-center justify-between">
                            {crisis ? (
                              <span className="w-full text-center font-display font-extrabold text-[11px] text-yellow-200">
                                🚨 BẤM XỬ LÝ ({crisis.timeLeft.toFixed(1)}s)!
                              </span>
                            ) : occupant ? (
                              <div className="flex items-center gap-1.5 w-full">
                                <span
                                  style={{ backgroundColor: occupant.color }}
                                  className="w-2.5 h-2.5 rounded-full border border-[#111318] shrink-0"
                                />
                                <span className="font-display font-extrabold text-[10px] truncate">
                                  {occupant.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500">
                                + Thả tổ đội vào đây
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. RIGHT EVENT FEED: Live scrolling list of notifications */}
                <div className="lg:col-span-3 rounded-2xl bg-[#181920] text-slate-100 border-[2.5px] border-[#111318] p-3 flex flex-col gap-2.5 max-h-[420px]">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <div className="flex items-center gap-1.5 font-display font-extrabold text-sm text-amber-300">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Nhật Ký Đường Phố</span>
                    </div>
                    <span className="font-mono-tabular text-[10px] text-slate-400">
                      {hud.cityTycoon.crises.length > 0 ? `${hud.cityTycoon.crises.length} biến` : 'Ổn định'}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto allow-touch-scroll safe-inset-container flex flex-col gap-2 pr-1">
                    {hud.cityTycoon.eventFeed.map((ev) => (
                      <div
                        key={ev.id}
                        className={`rounded-lg border px-2.5 py-2 text-xs leading-snug ${
                          ev.tone === 'ALERT'
                            ? 'bg-rose-950/80 border-rose-500/60 text-rose-100'
                            : ev.tone === 'PROFIT'
                            ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-100'
                            : 'bg-slate-800/90 border-slate-600 text-slate-200'
                        }`}
                      >
                        <div className="font-mono-tabular text-[10px] opacity-65 mb-0.5">
                          [{ev.timeStr}]
                        </div>
                        <div className="font-medium">{ev.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. BOTTOM ACTION BAR: Upgrades, Policies, Bail Out (Pay Fine) */}
              <div className="relative rounded-xl bg-[#FEF3C7] border-2 border-[#111318] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={hud.cityTycoon.upgradeLevel >= 5 || hud.money < upgradeCost}
                    onClick={() => engineRef.current?.upgradeTycoonNetwork()}
                    className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#34D399] disabled:bg-slate-300 disabled:text-slate-500 text-white font-display font-extrabold text-xs border-2 border-[#111318] whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                  >
                    {hud.cityTycoon.upgradeLevel >= 5
                      ? '⬆️ Nâng Cấp Tối Đa (Cấp 5)'
                      : `⬆️ Nâng Cấp Đội Xe Lv.${hud.cityTycoon.upgradeLevel + 1} (${upgradeCost.toLocaleString('vi-VN')}đ)`}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPolicyMenuOpen((v) => !v)}
                    className="px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-[#818CF8] text-white font-display font-extrabold text-xs border-2 border-[#111318] whitespace-nowrap cursor-pointer"
                  >
                    📜 Chính Sách: {TYCOON_POLICIES.find((p) => p.id === hud.cityTycoon.activePolicy)?.name}
                  </button>

                  <button
                    type="button"
                    disabled={arrestedCount === 0 || hud.money < bailCost}
                    onClick={() => engineRef.current?.bailOutArrestedSquads()}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 disabled:text-slate-500 text-white font-display font-extrabold text-xs border-2 border-[#111318] whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                  >
                    {arrestedCount === 0
                      ? '🔓 Bảo Lãnh (0 Đội Bị Bắt)'
                      : `🔓 Bảo Lãnh ${arrestedCount} Đội (${bailCost.toLocaleString('vi-VN')}đ)`}
                  </button>
                </div>

                <div className="text-xs font-bold text-amber-950 font-mono-tabular">
                  Tổng đã thu: +{hud.cityTycoon.totalEarned.toLocaleString('vi-VN')}đ
                </div>

                {policyMenuOpen && (
                  <div className="w-full pt-2 border-t border-amber-900/20 grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {TYCOON_POLICIES.map((pol) => {
                      const active = hud.cityTycoon.activePolicy === pol.id;
                      return (
                        <button
                          key={pol.id}
                          type="button"
                          onClick={() => {
                            engineRef.current?.setTycoonPolicy(pol.id);
                            setPolicyMenuOpen(false);
                          }}
                          className={`rounded-xl border-2 p-2.5 text-left transition-transform active:translate-y-0.5 cursor-pointer ${
                            active
                              ? 'bg-[#111318] text-white border-[#111318]'
                              : 'bg-white hover:bg-amber-50 text-[#111318] border-[#111318]'
                          }`}
                        >
                          <div className="font-display font-extrabold text-xs">{pol.name}</div>
                          <div className={`text-[10px] mt-0.5 ${active ? 'text-amber-300' : 'text-slate-600'}`}>
                            {pol.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* CRISIS MODAL (Opens when clicking a red flashing Node; 2 choices: Pay Bribe or Flee) */}
            {activeCrisisModal && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#111318]/80 p-4">
                <div className="w-full max-w-md rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] border-rose-600 comic-shadow p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-extrabold text-rose-600 tracking-wide">
                        🚨 KHẨN CẤP TẠI ĐIỂM NÓNG
                      </div>
                      <h3 className="font-display font-extrabold text-xl text-[#111318] mt-0.5">
                        {activeCrisisModal.title}
                      </h3>
                    </div>
                    <span className="font-mono-tabular font-extrabold text-2xl text-rose-600 shrink-0">
                      {activeCrisisModal.timeLeft.toFixed(1)}s
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-200 border-2 border-[#111318] overflow-hidden">
                    <div
                      className="h-full bg-rose-600 transition-all duration-75"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, (activeCrisisModal.timeLeft / activeCrisisModal.maxTime) * 100)
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    {activeCrisisModal.desc}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={hud.money < activeCrisisModal.budgetCost}
                      onClick={() => {
                        engineRef.current?.resolveCityCrisis(activeCrisisModal.id, 'BRIBE');
                        setActiveCrisisId(null);
                      }}
                      className="py-3 px-3 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] disabled:bg-slate-300 disabled:text-slate-500 text-[#111318] font-display font-extrabold text-xs border-2 border-[#111318] cursor-pointer disabled:cursor-not-allowed"
                    >
                      💵 Chi Dàn Xếp (-{activeCrisisModal.budgetCost.toLocaleString('vi-VN')}đ)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        engineRef.current?.resolveCityCrisis(activeCrisisModal.id, 'FLEE');
                        setActiveCrisisId(null);
                      }}
                      className="py-3 px-3 rounded-xl bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#111318] font-display font-extrabold text-xs border-2 border-[#111318] cursor-pointer"
                    >
                      💨 Bỏ Chạy Bảo Toàn (Miễn phí)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* DAY START ACCELERATION FLASH BANNER ("Day [X] - Tốc độ tăng cường!") */}
      {hud.screen === 'PLAYING' && hud.dayBannerTimer > 0 && hud.dayBannerText && (
        <div
          className="pointer-events-none absolute inset-x-0 top-16 z-30 flex justify-center px-4 transition-opacity duration-200"
          style={{ opacity: Math.min(1, hud.dayBannerTimer * 1.4) }}
        >
          <div className="rounded-2xl bg-[#111318]/95 border-[3px] border-[#FACC15] comic-shadow px-6 py-3 flex flex-col items-center text-center gap-1 animate-bounce">
            <div className="font-display font-extrabold text-xl md:text-2xl text-[#FACC15] tracking-wide">
              ⚡ {hud.dayBannerText}
            </div>
            <div className="font-mono-tabular text-xs font-bold text-slate-200">
              Khách mới {hud.dailyPacing.customerSpawnTimer.toFixed(1)}s · Kiên nhẫn {hud.dailyPacing.customerPatience.toFixed(0)}s · Thao tác {hud.dailyPacing.actionTimeLimit.toFixed(1)}s · Trật tự {Math.round(hud.dailyPacing.policeRaidChancePerMin * 100)}%/phút
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER PENALTY SYSTEM OVERLAYS (COOKING PHASE) */}
      {hud.screen === 'PLAYING' && hud.phase === 'COOKING' && (
        <>
          {/* 2. "Bóc Phốt" Recording Phone Animation (30% chance on failed order) */}
          {hud.recordingPhoneTimer > 0 && (
            <div className="pointer-events-none absolute left-6 top-20 z-20 animate-bounce">
              <div className="rounded-2xl bg-[#181920]/95 text-white border-[3px] border-rose-500 comic-shadow px-4 py-2.5 flex items-center gap-3">
                <div className="w-10 h-14 rounded-lg bg-slate-900 border-2 border-slate-400 flex flex-col items-center justify-between py-1 shrink-0">
                  <span className="text-[9px] font-mono-tabular font-extrabold text-rose-400">● REC</span>
                  <Smartphone className="w-5 h-5 text-amber-300" />
                  <span className="w-3 h-0.5 rounded bg-slate-500" />
                </div>
                <div>
                  <div className="font-display font-extrabold text-sm text-rose-400 whitespace-nowrap">
                    📱 QUAY CLIP BÓC PHỐT!
                  </div>
                  <div className="text-xs text-slate-200 font-semibold">
                    5 khách tới giảm sẵn 30% thanh kiên nhẫn!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Yelling Scene Speech Bubble (70% chance on failed order -> +25% Police Heat) */}
          {hud.yellingTimer > 0 && (
            <div className="pointer-events-none absolute right-6 top-20 z-20 animate-bounce">
              <div className="rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] border-rose-600 comic-shadow px-4 py-2.5 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center border-2 border-[#111318] shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display font-extrabold text-sm text-rose-700 whitespace-nowrap">
                    📢 LA Ó OM SÒM! (+25% Police Heat)
                  </div>
                  <div className="text-xs text-slate-700 font-semibold">
                    Tiếng ồn đang thu hút Trật Tự Đô Thị!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1. Material Loss & Trash Management: Ruined "Bánh Tráng Hỏng" blocking counter */}
          {hud.ruinedBagBlocking &&
            !hud.checkout.active &&
            !hud.shopOpen &&
            !hud.loanModalOpen && (
              <div
                style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
                className="pointer-events-auto absolute left-1/2 -translate-x-1/2 z-20 w-[min(94vw,560px)] rounded-2xl bg-[#FFFDF5]/95 text-[#111318] border-[3px] border-[#111318] comic-shadow p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-3 border-b-2 border-slate-200 pb-2">
                  <div>
                    <div className="text-[11px] font-extrabold text-rose-600 tracking-wide">
                      QUẦY ĐANG BỊ CHẶN · MẤT NGUYÊN LIỆU
                    </div>
                    <div className="font-display font-extrabold text-sm sm:text-base text-[#111318]">
                      Kéo “Bánh Tráng Hỏng” bỏ vào Thùng Rác để đón khách mới!
                    </div>
                  </div>
                  <span className="font-mono-tabular text-xs font-extrabold text-rose-700 bg-rose-100 border-2 border-[#111318] rounded-lg px-2 py-1 whitespace-nowrap shrink-0">
                    0đ (Khách hủy)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 items-stretch">
                  {/* Draggable Ruined Bag (Mouse + Native iOS Touch Drag) */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', 'RUINED_BAG');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onTouchStart={(e) => {
                      const t = e.touches[0];
                      if (t) setTouchBagPos({ x: t.clientX, y: t.clientY });
                    }}
                    onTouchMove={(e) => {
                      const t = e.touches[0];
                      if (!t) return;
                      setTouchBagPos({ x: t.clientX, y: t.clientY });
                      const trashRect = trashCanRef.current?.getBoundingClientRect();
                      const over = !!(
                        trashRect &&
                        t.clientX >= trashRect.left &&
                        t.clientX <= trashRect.right &&
                        t.clientY >= trashRect.top &&
                        t.clientY <= trashRect.bottom
                      );
                      setTrashDragHover(over);
                    }}
                    onTouchEnd={(e) => {
                      const t = e.changedTouches[0];
                      const trashRect = trashCanRef.current?.getBoundingClientRect();
                      const over = !!(
                        t &&
                        trashRect &&
                        t.clientX >= trashRect.left &&
                        t.clientX <= trashRect.right &&
                        t.clientY >= trashRect.top &&
                        t.clientY <= trashRect.bottom
                      );
                      setTouchBagPos(null);
                      setTrashDragHover(false);
                      if (over) {
                        engineRef.current?.clearRuinedTrash();
                      }
                    }}
                    className="touch-none rounded-xl bg-amber-100 border-[2.5px] border-[#111318] p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing select-none hover:-translate-y-0.5 transition-transform"
                  >
                    <svg viewBox="0 0 64 64" className="w-11 h-11 sm:w-12 sm:h-12 shrink-0" aria-hidden="true">
                      <path
                        d="M16 18 L24 12 L32 18 L40 11 L48 18 L52 52 C52 55 49 58 45 58 L19 58 C15 58 12 55 12 52 Z"
                        fill="#92400E"
                        stroke="#111318"
                        strokeWidth="3"
                        strokeLinejoin="round"
                      />
                      <path d="M22 28 L42 46 M42 28 L22 46" stroke="#FCA5A5" strokeWidth="4" strokeLinecap="round" />
                      <circle cx="24" cy="24" r="3" fill="#EF4444" />
                      <circle cx="44" cy="40" r="2.5" fill="#10B981" />
                    </svg>
                    <div className="min-w-0">
                      <div className="font-display font-extrabold text-xs sm:text-sm text-[#111318]">
                        Bánh Tráng Hỏng
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700">
                        Nắm kéo sang Thùng Rác →
                      </div>
                    </div>
                  </div>

                  {/* Trash Can Dropzone */}
                  <button
                    ref={trashCanRef}
                    type="button"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (!trashDragHover) setTrashDragHover(true);
                    }}
                    onDragLeave={() => setTrashDragHover(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setTrashDragHover(false);
                      engineRef.current?.clearRuinedTrash();
                    }}
                    onClick={() => {
                      setTrashDragHover(false);
                      engineRef.current?.clearRuinedTrash();
                    }}
                    className={`rounded-xl border-[2.5px] border-dashed p-3 flex items-center justify-center gap-2.5 transition-colors cursor-pointer ${
                      trashDragHover
                        ? 'bg-emerald-200 border-emerald-700 text-emerald-950 scale-[1.02]'
                        : 'bg-slate-200 hover:bg-slate-300 border-[#111318] text-[#111318]'
                    }`}
                  >
                    <Trash2 className="w-7 h-7 text-rose-700 shrink-0" />
                    <div className="text-left">
                      <div className="font-display font-extrabold text-xs sm:text-sm">
                        Thùng Rác
                      </div>
                      <div className="text-[11px] font-bold text-slate-700">
                        Thả vào đây (hoặc chạm)
                      </div>
                    </div>
                  </button>
                </div>

                {touchBagPos && (
                  <div
                    className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-amber-200/95 border-2 border-[#111318] px-3 py-1.5 text-xs font-extrabold text-[#111318] shadow-lg"
                    style={{ left: touchBagPos.x, top: touchBagPos.y }}
                  >
                    🗑️ Kéo vào Thùng Rác
                  </div>
                )}
              </div>
            )}

          {/* 4. The Sauce Splatter (Visual Blindness): Swipe/drag finger or mouse back and forth 3 times */}
          {hud.sauceSplatterWipes > 0 && !hud.shopOpen && !hud.loanModalOpen && (
            <div
              onTouchStart={(e) => {
                const t = e.touches[0];
                if (t) handleSplatterStart(t.clientX, t.clientY);
              }}
              onTouchMove={(e) => {
                const t = e.touches[0];
                if (t) handleSplatterMove(t.clientX, t.clientY);
              }}
              onPointerEnter={(e) => {
                if (e.pointerType === 'touch') return;
                handleSplatterStart(e.clientX, e.clientY);
              }}
              onPointerDown={(e) => {
                if (e.pointerType === 'touch') return;
                handleSplatterStart(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (e.pointerType === 'touch') return;
                handleSplatterMove(e.clientX, e.clientY);
              }}
              className="pointer-events-auto touch-none absolute inset-x-0 top-12 bottom-36 z-[25] flex flex-col items-center justify-center select-none cursor-grab active:cursor-grabbing"
            >
              {/* Vivid Chili Sauce Splatter SVG */}
              <svg
                viewBox="0 0 800 450"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-150"
                style={{ opacity: Math.min(0.95, 0.25 + (hud.sauceSplatterWipes / 3) * 0.7) }}
                aria-hidden="true"
              >
                <g fill="#DC2626" opacity="0.92">
                  <path d="M180,140 C130,90 220,30 290,85 C350,35 455,60 445,130 C525,95 620,145 570,220 C645,255 595,355 505,315 C455,390 325,380 310,305 C225,355 120,305 165,225 C95,210 115,130 180,140 Z" />
                  <ellipse cx="135" cy="95" rx="34" ry="22" />
                  <ellipse cx="645" cy="115" rx="42" ry="28" />
                  <ellipse cx="620" cy="340" rx="36" ry="25" />
                  <ellipse cx="165" cy="345" rx="30" ry="20" />
                  {/* Drips */}
                  <path d="M235,295 C235,345 252,380 245,420 C238,430 225,425 227,405 C228,370 218,330 220,295 Z" />
                  <path d="M405,320 C405,375 420,405 412,438 C404,446 393,438 395,418 C397,385 388,350 390,320 Z" />
                  <path d="M525,290 C525,335 538,365 532,395 C525,403 514,395 516,378 C518,348 510,318 512,290 Z" />
                </g>
                {/* Darker Chili Oil Gloss + Chili Seeds */}
                <g fill="#991B1B" opacity="0.75">
                  <circle cx="290" cy="170" r="46" />
                  <circle cx="430" cy="210" r="54" />
                  <circle cx="340" cy="255" r="38" />
                </g>
                <g fill="#FEF08A">
                  <ellipse cx="260" cy="150" rx="6" ry="3.5" transform="rotate(28 260 150)" />
                  <ellipse cx="385" cy="130" rx="6" ry="3.5" transform="rotate(-18 385 130)" />
                  <ellipse cx="470" cy="195" rx="6.5" ry="3.5" transform="rotate(42 470 195)" />
                  <ellipse cx="315" cy="240" rx="6" ry="3.5" transform="rotate(-35 315 240)" />
                  <ellipse cx="420" cy="285" rx="6" ry="3.5" transform="rotate(15 420 285)" />
                  <ellipse cx="220" cy="230" rx="5.5" ry="3" transform="rotate(60 220 230)" />
                  <ellipse cx="525" cy="245" rx="6" ry="3.5" transform="rotate(-48 525 245)" />
                </g>
              </svg>

              {/* Wipe Prompt Card */}
              <div className="relative z-10 rounded-2xl bg-[#111318]/90 text-white border-[3px] border-[#FACC15] comic-shadow px-5 py-3 flex flex-col items-center gap-1 text-center pointer-events-none">
                <div className="font-display font-extrabold text-base text-[#FACC15]">
                  🌶️ KHÁCH TẠT TƯƠNG ỚT CHE MẮT!
                </div>
                <div className="text-xs font-bold text-slate-100">
                  Quẹt / rê chuột qua lại trên màn hình để lau sạch ({hud.sauceSplatterWipes}/3 lần còn lại)
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* WUXIA STREET COMBAT HUD OVERLAY */}
      {hud.screen === 'PLAYING' && hud.phase === 'WUXIA_COMBAT' && hud.wuxiaCombat.active && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 pt-16 pb-6">
          {/* Top Fighter HP Bars */}
          <div className="mx-auto w-full max-w-4xl grid grid-cols-2 gap-6">
            <div className="rounded-xl bg-[#181920]/90 border-[2.5px] border-[#111318] p-3">
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-300 mb-1.5">
                <span>🥋 CHỦ QUÁN VÕ HIỆP</span>
                <span className="font-mono-tabular">
                  {hud.wuxiaCombat.playerHp}/{hud.wuxiaCombat.maxPlayerHp} HP
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full bg-slate-800 border-2 border-[#111318] overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-100"
                  style={{ width: `${(hud.wuxiaCombat.playerHp / hud.wuxiaCombat.maxPlayerHp) * 100}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl bg-[#181920]/90 border-[2.5px] border-[#111318] p-3">
              <div className="flex items-center justify-between text-xs font-extrabold text-rose-400 mb-1.5">
                <span>🥷 ĐẠO CHÍCH HŨ TIỀN</span>
                <span className="font-mono-tabular">
                  {hud.wuxiaCombat.thiefHp}/{hud.wuxiaCombat.maxThiefHp} HP
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full bg-slate-800 border-2 border-[#111318] overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-100"
                  style={{ width: `${(hud.wuxiaCombat.thiefHp / hud.wuxiaCombat.maxThiefHp) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Wuxia Combat Skills */}
          <div className="pointer-events-auto mx-auto flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={hud.wuxiaCombat.shurikenCd > 0}
              onClick={() => engineRef.current?.wuxiaShuriken()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FEF3C7] hover:bg-[#FDE68A] disabled:opacity-50 text-[#111318] font-display font-extrabold text-sm border-[3px] border-[#111318] comic-shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>
                Phi Tiêu Bánh Tráng [J]
                {hud.wuxiaCombat.shurikenCd > 0 ? ` (${hud.wuxiaCombat.shurikenCd.toFixed(1)}s)` : ''}
              </span>
            </button>

            <button
              type="button"
              disabled={hud.wuxiaCombat.meleeCd > 0}
              onClick={() => engineRef.current?.wuxiaMelee()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] disabled:opacity-50 text-[#111318] font-display font-extrabold text-sm border-[3px] border-[#111318] comic-shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Swords className="w-4 h-4" />
              <span>
                Chém Kẹp Đá [K]
                {hud.wuxiaCombat.meleeCd > 0 ? ` (${hud.wuxiaCombat.meleeCd.toFixed(1)}s)` : ''}
              </span>
            </button>

            <button
              type="button"
              disabled={hud.wuxiaCombat.blockCd > 0}
              onClick={() => engineRef.current?.wuxiaBlock()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#38BDF8] hover:bg-[#7DD3FC] disabled:opacity-50 text-[#111318] font-display font-extrabold text-sm border-[3px] border-[#111318] comic-shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Shield className="w-4 h-4" />
              <span>
                Đỡ &amp; Phản Kiếm [L]
                {hud.wuxiaCombat.blockCd > 0 ? ` (${hud.wuxiaCombat.blockCd.toFixed(1)}s)` : ''}
              </span>
            </button>

            <button
              type="button"
              disabled={hud.wuxiaCombat.dodgeCd > 0}
              onClick={() => engineRef.current?.wuxiaDodge()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#10B981] hover:bg-[#34D399] disabled:opacity-50 text-white font-display font-extrabold text-sm border-[3px] border-[#111318] comic-shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <span>
                Né Thân [Space]
                {hud.wuxiaCombat.dodgeCd > 0 ? ` (${hud.wuxiaCombat.dodgeCd.toFixed(1)}s)` : ''}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* MENTAL MATH CHECKOUT MODAL ("Tính Tiền Thối") */}
      {hud.screen === 'PLAYING' && hud.checkout.active && !hud.shopOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111318]/75 p-4">
          <div className="animate-register-pop w-full max-w-xl rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] border-[#111318] comic-shadow p-6 flex flex-col gap-4">
            {/* Header + 5s Timer */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-extrabold text-2xl text-[#111318]">
                  Tính Tiền Thối Nhanh!
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {hud.checkout.customerLabel} ·{' '}
                  {hud.checkout.dishType === 'CUON' ? 'Bánh Tráng Cuốn' : 'Bánh Tráng Trộn'}
                  {hud.checkout.isTricky ? ' · Khách đưa kèm tiền lẻ!' : ''}
                </p>
              </div>
              <div
                className={`font-mono-tabular font-extrabold text-2xl shrink-0 ${
                  hud.checkout.timeLeft <= 2 ? 'text-rose-600' : 'text-amber-600'
                }`}
              >
                {hud.checkout.timeLeft.toFixed(1)}s
              </div>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full h-3.5 rounded-full bg-slate-200 border-2 border-[#111318] overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  hud.checkout.timeLeft > 2.2 ? 'bg-[#10B981]' : 'bg-[#E11D48]'
                }`}
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (hud.checkout.timeLeft / hud.checkout.maxTime) * 100)
                  )}%`,
                }}
              />
            </div>

            {/* Masterpiece 5x Banner */}
            {hud.checkout.isMasterpiece && (
              <div className="rounded-xl bg-[#FEF08A] border-2 border-[#111318] px-3.5 py-2 flex items-center justify-between gap-2 text-xs font-extrabold text-[#111318]">
                <span>🌟 TUYỆT TÁC BÁNH TRÁNG (FLOW STATE)!</span>
                <span className="font-mono-tabular text-amber-800">GIÁ TRỊ x5 ({hud.checkout.pendingMoney.toLocaleString('vi-VN')}đ)</span>
              </div>
            )}

            {/* Real Estate Agent 2k Discount Offer */}
            {hud.checkout.discount2kAvailable && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 border-2 border-[#111318] px-3.5 py-2.5">
                <div className="text-xs font-bold text-emerald-900">
                  {hud.checkout.discountAccepted
                    ? '✓ Đã giảm 2.000đ cho Sale BĐS! Thối chuẩn để có 20% cơ hội Tip 100k!'
                    : 'Sale BĐS xin bớt 2.000đ lấy lộc (20% cơ hội chốt deal Tip 100.000đ!)'}
                </div>
                {!hud.checkout.discountAccepted && (
                  <button
                    type="button"
                    onClick={() => engineRef.current?.toggleRealEstateDiscount()}
                    className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-white font-display font-extrabold text-xs border-2 border-[#111318] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Giảm 2k!
                  </button>
                )}
              </div>
            )}

            {/* Receipt Summary: Bill vs Customer Payment */}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#FEF9E7] border-2 border-[#111318] p-3.5">
              <div>
                <div className="text-xs font-semibold text-slate-500">Tổng tiền bánh</div>
                <div className="font-mono-tabular font-extrabold text-2xl text-[#111318] mt-0.5">
                  {hud.checkout.billK.toLocaleString('vi-VN')}.000đ
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Khách đưa ({hud.checkout.paidK.toLocaleString('vi-VN')}.000đ)
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {hud.checkout.paidBills.map((b, idx) => {
                    const st = BILL_STYLES[b] ?? BILL_STYLES[50];
                    return (
                      <span
                        key={idx}
                        style={{ backgroundColor: st.bg, borderColor: st.border, color: st.text }}
                        className="px-2 py-0.5 rounded border-2 font-mono-tabular font-extrabold text-xs"
                      >
                        {st.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Accumulated Change Tray */}
            <div className="rounded-xl bg-slate-100 border-2 border-[#111318] p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-slate-600">Tiền thối bạn đang cầm: </span>
                  <span className="font-mono-tabular font-extrabold text-xl text-emerald-700">
                    {hud.checkout.givenChangeK > 0
                      ? `${hud.checkout.givenChangeK.toLocaleString('vi-VN')}.000đ`
                      : '0đ'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={hud.checkout.selectedBills.length === 0}
                    onClick={() => engineRef.current?.undoCheckoutBill()}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-40 border-2 border-[#111318] text-xs font-bold cursor-pointer"
                  >
                    Hoàn tác
                  </button>
                  <button
                    type="button"
                    disabled={hud.checkout.selectedBills.length === 0}
                    onClick={() => engineRef.current?.clearCheckoutBills()}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 disabled:opacity-40 border-2 border-[#111318] text-xs font-bold text-rose-700 cursor-pointer"
                  >
                    Xóa hết
                  </button>
                </div>
              </div>

              {hud.checkout.selectedBills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200">
                  {hud.checkout.selectedBills.map((b, idx) => {
                    const st = BILL_STYLES[b] ?? BILL_STYLES[1];
                    return (
                      <span
                        key={`${idx}-${b}`}
                        style={{ backgroundColor: st.bg, borderColor: st.border, color: st.text }}
                        className="animate-bill-pop px-1.5 py-0.5 rounded border font-mono-tabular font-bold text-[11px]"
                      >
                        +{b}k
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Vietnamese Currency Cash Register */}
            <div>
              <div className="text-xs font-bold text-slate-600 mb-2">
                Bấm chọn các tờ tiền trong ngăn kéo (hoặc phím 1–6):
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {REGISTER_BILLS.map((denom) => {
                  const st = BILL_STYLES[denom];
                  return (
                    <button
                      key={denom}
                      type="button"
                      onClick={() => engineRef.current?.addCheckoutBill(denom)}
                      style={{ backgroundColor: st.bg, borderColor: st.border, color: st.text }}
                      className="relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border-[2.5px] comic-shadow-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-transform cursor-pointer"
                    >
                      <span className="font-mono-tabular font-extrabold text-base">{st.label}</span>
                      <span className="text-[10px] font-bold opacity-70">Phím {st.keyHint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Change Button */}
            <button
              type="button"
              onClick={() => engineRef.current?.submitCheckout()}
              className="w-full py-3.5 rounded-xl bg-[#10B981] hover:bg-[#34D399] text-white font-display font-extrabold text-base border-[3px] border-[#111318] comic-shadow-sm active:translate-y-0.5 transition-transform cursor-pointer"
            >
              Thối Tiền! (Enter)
            </button>
          </div>
        </div>
      )}

      {/* ROOM HUNTERS UPSELL MODAL ("Nghệ Thuật Chốt Sale") */}
      {hud.screen === 'PLAYING' && hud.roomHunters.active && !hud.shopOpen && !hud.loanModalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111318]/75 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] border-[#111318] comic-shadow p-6 flex flex-col gap-4">
            <div className="border-b-2 border-slate-200 pb-3">
              <div className="text-xs font-extrabold text-sky-700 tracking-wide">
                SỰ KIỆN CHỐT SALE · KHÁCH TÌM TRỌ
              </div>
              <h2 className="font-display font-extrabold text-2xl text-[#111318] mt-0.5">
                {hud.roomHunters.customerLabel}
              </h2>
            </div>

            <div className="rounded-xl bg-[#FEF9E7] border-2 border-[#111318] p-3.5 text-sm font-medium text-slate-800 leading-relaxed">
              “{hud.roomHunters.promptText}”
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => engineRef.current?.chooseRoomHuntersOption('HARD_SELL')}
                className="w-full text-left px-4 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-[#111318] transition-transform active:translate-y-0.5 cursor-pointer"
              >
                <div className="font-display font-extrabold text-sm text-rose-800">
                  A. Chốt gắt ép giá
                </div>
                <div className="text-xs text-slate-700 mt-0.5">
                  “Combo 30k đi mấy em, ăn bịch 10k không bõ công anh trộn đâu!”
                </div>
              </button>

              <button
                type="button"
                onClick={() => engineRef.current?.chooseRoomHuntersOption('EMPATHY_SELL')}
                className="w-full text-left px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border-2 border-[#111318] transition-transform active:translate-y-0.5 cursor-pointer"
              >
                <div className="font-display font-extrabold text-sm text-emerald-800">
                  B. Đồng cảm tâm lý
                </div>
                <div className="text-xs text-slate-700 mt-0.5">
                  “Nắng nôi tìm trọ mệt hả? Anh làm combo 30k nhiều bò + trứng ăn lấy sức đi xem phòng nha!”
                </div>
              </button>

              <button
                type="button"
                onClick={() => engineRef.current?.chooseRoomHuntersOption('JUST_SERVE')}
                className="w-full text-left px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-[#111318] transition-transform active:translate-y-0.5 cursor-pointer"
              >
                <div className="font-display font-extrabold text-sm text-[#111318]">
                  C. Bán nhanh gói 10.000đ
                </div>
                <div className="text-xs text-slate-700 mt-0.5">
                  “Ok đợi xíu anh làm nhanh bịch 10k cho mấy đứa kịp giờ hẹn!”
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STREET FORTUNE TELLER 1: BAZI & FENG SHUI READING MODAL ("Bát Tự & Cải Vận") */}
      {hud.screen === 'PLAYING' &&
        hud.baziReading.active &&
        !hud.baziReading.acknowledged &&
        hud.baziReading.profile &&
        !hud.shopOpen &&
        !hud.loanModalOpen && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111318]/80 p-4 pt-16 overflow-y-auto allow-touch-scroll safe-inset-container">
            <div className="w-full max-w-xl rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] border-[#111318] comic-shadow p-6 flex flex-col gap-4 my-auto">
              <div className="flex items-start justify-between gap-3 border-b-2 border-slate-200 pb-3">
                <div>
                  <div className="text-[11px] font-extrabold tracking-wider text-amber-700">
                    BÓI TOÁN VỈA HÈ · LUẬN LÁ SỐ BÁT TỰ
                  </div>
                  <h2 className="font-display font-extrabold text-2xl text-[#111318] mt-0.5">
                    {hud.baziReading.profile.title}
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#1E293B] text-[#FACC15] border-2 border-[#111318] font-display font-bold text-xs whitespace-nowrap shrink-0">
                  {hud.baziReading.customerLabel}
                </span>
              </div>

              <div className="rounded-xl bg-[#FEF9E7] border-2 border-[#111318] p-3.5 text-sm font-medium text-slate-800 leading-relaxed">
                “{hud.baziReading.profile.businessWorry}”
              </div>

              {/* 4-Pillar Bazi Chart */}
              <div>
                <div className="text-xs font-extrabold text-slate-600 mb-2">
                  TỨ TRỤ BÁT TỰ (CAN CHI NGŨ HÀNH)
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {hud.baziReading.profile.chartPillars.map((pillar) => {
                    const meta = ELEMENT_META[pillar.element];
                    return (
                      <div
                        key={pillar.label}
                        className="rounded-xl border-2 border-[#111318] p-2.5 text-center flex flex-col gap-1"
                        style={{ backgroundColor: meta.bg }}
                      >
                        <div className="text-[11px] font-bold text-slate-700">{pillar.label}</div>
                        <div className="font-display font-extrabold text-base text-[#111318]">
                          {pillar.stem} {pillar.branch}
                        </div>
                        <div className="text-xs font-extrabold" style={{ color: meta.color }}>
                          {meta.shortLabel}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Needed vs Taboo Elements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 border-2 border-[#111318] p-3">
                  <div className="text-xs font-extrabold text-emerald-800">
                    ✓ DỤNG THẦN CẦN BỔ SUNG
                  </div>
                  <div className="font-display font-extrabold text-sm text-emerald-950 mt-1">
                    {hud.baziReading.profile.neededElements
                      .map((e) => ELEMENT_META[e].label)
                      .join(' + ')}
                  </div>
                </div>
                <div className="rounded-xl bg-rose-50 border-2 border-[#111318] p-3">
                  <div className="text-xs font-extrabold text-rose-800">
                    ✕ KỴ THẦN TUYỆT ĐỐI TRÁNH
                  </div>
                  <div className="font-display font-extrabold text-sm text-rose-950 mt-1">
                    {hud.baziReading.profile.tabooElements
                      .map((e) => ELEMENT_META[e].label)
                      .join(' / ')}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 border-2 border-[#111318] px-3.5 py-2.5 text-xs font-bold text-amber-950">
                ☯️ Công thức Cải Vận: {hud.baziReading.profile.recommendedText}
              </div>

              <button
                type="button"
                onClick={() => engineRef.current?.acknowledgeBaziReading()}
                className="w-full py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#111318] font-display font-extrabold text-base border-[3px] border-[#111318] comic-shadow-sm active:translate-y-0.5 transition-transform cursor-pointer whitespace-nowrap"
              >
                Xem Quẻ Xong · Trộn Bánh Cải Vận →
              </button>
            </div>
          </div>
        )}

      {/* STREET FORTUNE TELLER 2: GEN Z TAROT MINIGAME MODAL ("Street Tarot Deck") */}
      {hud.screen === 'PLAYING' && hud.tarot.active && !hud.shopOpen && !hud.loanModalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111318]/85 p-4 pt-16 overflow-y-auto allow-touch-scroll safe-inset-container">
          <div className="w-full max-w-xl rounded-2xl bg-[#1E1B4B] text-slate-100 border-[3px] border-[#FACC15] comic-shadow p-6 flex flex-col gap-4 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-indigo-700/80 pb-3">
              <div>
                <div className="text-[11px] font-extrabold tracking-wider text-amber-300">
                  STREET TAROT DECK · GEN Z BÓI TÌNH CẢM VỈA HÈ
                </div>
                <h2 className="font-display font-extrabold text-2xl text-white mt-0.5">
                  {hud.tarot.customerLabel}
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white border border-purple-300 font-display font-bold text-xs whitespace-nowrap shrink-0">
                Cơ hội x3 Tarot Combo
              </span>
            </div>

            <div className="rounded-xl bg-indigo-950/90 border-2 border-indigo-400/50 p-3.5 text-sm font-medium text-indigo-100 leading-relaxed">
              “{hud.tarot.question}”
            </div>

            {hud.tarot.stage === 'PICK_CARD' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-extrabold text-amber-300 tracking-wide">
                    CHỌN 1 LÁ BÀI TRONG BỘ STREET TAROT (6 LÁ)
                  </div>
                  <button
                    type="button"
                    onClick={() => engineRef.current?.drawTarotCard()}
                    className="px-3 py-1 rounded-lg bg-[#FACC15] hover:bg-[#FDE047] text-[#111318] font-display font-extrabold text-xs border-2 border-[#111318] cursor-pointer whitespace-nowrap"
                  >
                    Rút Ngẫu Nhiên
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 py-1">
                  {hud.tarot.cardPool.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => engineRef.current?.drawTarotCard(idx)}
                      className="group rounded-xl bg-gradient-to-b from-indigo-900 to-purple-950 hover:from-purple-800 hover:to-indigo-900 border-2 border-[#FACC15] p-4 flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1 active:translate-y-0 cursor-pointer min-h-[168px]"
                    >
                      <svg viewBox="0 0 80 110" className="w-16 h-22" aria-hidden="true">
                        <rect x="4" y="4" width="72" height="102" rx="8" fill="#312E81" stroke="#FACC15" strokeWidth="2.5" />
                        <circle cx="40" cy="55" r="16" fill="none" stroke="#FDE047" strokeWidth="2" />
                        <path d="M40 34 L44 51 L61 55 L44 59 L40 76 L36 59 L19 55 L36 51 Z" fill="#FACC15" />
                      </svg>
                      <span className="font-display font-extrabold text-xs text-amber-200 group-hover:text-white whitespace-nowrap">
                        Rút Lá #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hud.tarot.stage === 'INTERPRET' && hud.tarot.drawnCard && (
              <div className="flex flex-col gap-3.5">
                <div className="rounded-xl bg-indigo-950 border-2 border-[#FACC15] p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="shrink-0">
                    <TarotArtworkSvg cardId={hud.tarot.drawnCard.id} />
                  </div>
                  <div className="flex flex-col gap-1 text-center sm:text-left">
                    <div className="text-xs font-mono-tabular font-bold text-amber-300">
                      LÁ {hud.tarot.drawnCard.numeral} · {hud.tarot.drawnCard.name}
                    </div>
                    <div className="font-display font-extrabold text-xl text-white">
                      {hud.tarot.drawnCard.viName}
                    </div>
                    <p className="text-xs text-indigo-200 leading-relaxed mt-1">
                      <span className="font-bold text-amber-200">Street Meaning:</span> {hud.tarot.drawnCard.streetMeaning}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-extrabold text-amber-300">
                  CHỌN LỜI PHÁN CHO KHÁCH GEN Z (A: TRUTH · B: COMFORT · C: UPSELL):
                </div>

                <div className="flex flex-col gap-2">
                  {hud.tarot.options.map((opt) => (
                    <button
                      key={opt.tone}
                      type="button"
                      onClick={() => engineRef.current?.chooseTarotDialogue(opt.tone)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-[#FFFDF5] hover:bg-amber-50 text-[#111318] border-2 border-[#111318] transition-transform active:translate-y-0.5 cursor-pointer"
                    >
                      <div className="font-display font-extrabold text-sm text-indigo-900">
                        {opt.label}
                      </div>
                      <div className="text-xs text-slate-700 mt-0.5">“{opt.speech}”</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hud.tarot.stage === 'RESULT' && (
              <div className="flex flex-col gap-4">
                <div
                  className={`rounded-xl border-2 p-4 text-sm font-semibold leading-relaxed ${
                    hud.tarot.outcomeKind === 'COMBO_3X'
                      ? 'bg-purple-950/90 border-amber-400 text-amber-100'
                      : hud.tarot.outcomeKind === 'TIP'
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100'
                        : 'bg-rose-950/90 border-rose-400 text-rose-100'
                  }`}
                >
                  <div className="font-display font-extrabold text-base mb-1 text-white">
                    {hud.tarot.outcomeKind === 'COMBO_3X'
                      ? '🔮 CHỐT ĐƠN: TAROT COMBO (3x GIÁ)!'
                      : hud.tarot.outcomeKind === 'TIP'
                        ? '💖 KHÁCH VUI VẺ: +10,000 VND TIP!'
                        : '💔 KHÁCH BUỒN BỎ ĐI KHÔNG MUA GÌ'}
                  </div>
                  {hud.tarot.resultMessage}
                </div>

                <button
                  type="button"
                  onClick={() => engineRef.current?.closeTarotResult()}
                  className="w-full py-3.5 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#111318] font-display font-extrabold text-base border-[3px] border-[#111318] comic-shadow-sm active:translate-y-0.5 transition-transform cursor-pointer whitespace-nowrap"
                >
                  {hud.tarot.outcomeKind === 'COMBO_3X'
                    ? 'Trộn Tarot Combo x3 Ngay →'
                    : hud.tarot.outcomeKind === 'TIP'
                      ? 'Nhận 10,000đ Tip & Làm Đơn →'
                      : 'Tiếp Tục Đón Khách Khác →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIY MIXER WIRE-CONNECTING MALFUNCTION PUZZLE */}
      {hud.screen === 'PLAYING' && hud.diyMalfunction.active && !hud.shopOpen && !hud.loanModalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111318]/80 p-4">
          <div
            className={`w-full max-w-md rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] comic-shadow p-6 flex flex-col gap-4 ${
              hud.diyMalfunction.wrongFlash > 0 ? 'border-rose-600 bg-rose-50' : 'border-[#111318]'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-rose-600 text-white border-2 border-[#111318] flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-xl text-rose-700">
                    CHẬP MẠCH MÁY TRỘN DIY!
                  </h2>
                  <p className="text-xs text-slate-600">
                    Chọn đầu dây bên trái rồi nối đúng màu bên phải để cứu đĩa bánh!
                  </p>
                </div>
              </div>
              <div className="font-mono-tabular font-extrabold text-2xl text-rose-600 shrink-0">
                {hud.diyMalfunction.timeLeft.toFixed(1)}s
              </div>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-200 border-2 border-[#111318] overflow-hidden">
              <div
                className="h-full bg-rose-600 transition-all duration-75"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (hud.diyMalfunction.timeLeft / hud.diyMalfunction.maxTime) * 100)
                  )}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-6 py-2">
              <div className="flex flex-col gap-2.5">
                <div className="text-[11px] font-extrabold text-slate-500 text-center">NGUỒN RA (CHỌN)</div>
                {hud.diyMalfunction.leftOrder.map((color) => {
                  const meta = WIRE_META[color];
                  const isConnected = hud.diyMalfunction.connected.includes(color);
                  const isSelected = hud.diyMalfunction.selectedLeftColor === color;
                  return (
                    <button
                      key={`left-${color}`}
                      type="button"
                      disabled={isConnected}
                      onClick={() => engineRef.current?.selectDiyWireLeft(color)}
                      style={{ backgroundColor: meta.bg, borderColor: meta.border, color: meta.text }}
                      className={`px-3 py-3 rounded-xl border-[2.5px] font-display font-extrabold text-xs transition-transform cursor-pointer disabled:opacity-45 disabled:cursor-default ${
                        isSelected ? 'ring-4 ring-[#111318] scale-[1.03]' : 'hover:scale-[1.02]'
                      }`}
                    >
                      {isConnected ? `✓ ${meta.label}` : isSelected ? `▶ ${meta.label}` : meta.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="text-[11px] font-extrabold text-slate-500 text-center">CỔNG VÀO (NỐI)</div>
                {hud.diyMalfunction.rightOrder.map((color) => {
                  const meta = WIRE_META[color];
                  const isConnected = hud.diyMalfunction.connected.includes(color);
                  return (
                    <button
                      key={`right-${color}`}
                      type="button"
                      disabled={isConnected || !hud.diyMalfunction.selectedLeftColor}
                      onClick={() => engineRef.current?.connectDiyWireRight(color)}
                      style={{ backgroundColor: meta.bg, borderColor: meta.border, color: meta.text }}
                      className="px-3 py-3 rounded-xl border-[2.5px] font-display font-extrabold text-xs transition-transform hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnected ? `✓ Đã nối` : meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-center text-xs font-bold text-slate-600">
              Đã nối: <span className="font-mono-tabular text-emerald-700">{hud.diyMalfunction.connected.length}/3</span> dây
            </div>
          </div>
        </div>
      )}

      {/* ELECTRIC POLE LOAN SHARK MODAL ("Cột Điện Vay Nóng") */}
      {hud.loanModalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111318]/80 p-4 pt-16 overflow-y-auto allow-touch-scroll safe-inset-container">
          <div className="w-full max-w-md rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] border-[#111318] comic-shadow p-6 flex flex-col gap-4 my-auto">
            <div className="flex items-start justify-between gap-3 border-b-2 border-slate-200 pb-3">
              <div>
                <div className="text-[11px] font-extrabold tracking-wider text-rose-600">
                  TỜ RƠI CỘT ĐIỆN · TÍN DỤNG ĐEN VỈA HÈ
                </div>
                <h2 className="font-display font-extrabold text-2xl text-[#111318] mt-0.5">
                  VAY NÓNG KHÔNG THẾ CHẤP
                </h2>
              </div>
              <button
                type="button"
                onClick={() => engineRef.current?.setLoanModalOpen(false)}
                aria-label="Đóng bảng vay nóng"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 border-2 border-[#111318] text-[#111318] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-[#FEF3C7] border-2 border-[#111318] p-3.5 flex flex-col gap-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-semibold">Tiền mặt hiện có:</span>
                <span className="font-mono-tabular font-extrabold text-emerald-700">
                  {hud.money.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-semibold">Tổng nợ gốc hiện tại:</span>
                <span className="font-mono-tabular font-extrabold text-rose-600">
                  {hud.loanDebt.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-semibold">Lãi cuối ngày (25% / tối thiểu 5k):</span>
                <span className="font-mono-tabular font-bold text-amber-800">
                  {hud.loanDailyInterest.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50 border border-rose-200 rounded-lg p-3">
              <strong className="text-rose-700">Cảnh báo:</strong> Có thể dùng tiền mặt vừa vay để mua ngay nâng cấp xịn trong Cửa Hàng. Nếu cuối ngày không đủ tiền đóng lãi, <strong>2 Đàn Em Đòi Nợ</strong> sẽ đứng chặn nửa màn hình khiến lượng khách ghé giảm 50%!
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => engineRef.current?.borrowLoanShark(20000)}
                className="w-full py-3 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-[#111318] font-display font-extrabold text-sm border-[2.5px] border-[#111318] comic-shadow-sm active:translate-y-0.5 cursor-pointer"
              >
                ⚡ Vay Ngay +20.000đ (Lãi 25%/ngày)
              </button>
              <button
                type="button"
                disabled={hud.loanDebt === 0 || hud.money < hud.loanDebt}
                onClick={() => engineRef.current?.repayLoanShark()}
                className="w-full py-3 rounded-xl bg-[#10B981] hover:bg-[#34D399] disabled:bg-slate-200 disabled:text-slate-500 text-white font-display font-extrabold text-sm border-[2.5px] border-[#111318] cursor-pointer disabled:cursor-not-allowed"
              >
                {hud.loanDebt === 0
                  ? 'Không Có Nợ Cần Trả'
                  : `Trả Sạch Nợ (${hud.loanDebt.toLocaleString('vi-VN')}đ)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE SHOP MODAL ("Cửa Hàng Nâng Cấp") */}
      {hud.screen === 'PLAYING' && hud.shopOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111318]/80 p-4 pt-16 overflow-y-auto allow-touch-scroll safe-inset-container">
          <div className="w-full max-w-2xl rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] border-[#111318] comic-shadow p-6 flex flex-col gap-5 my-auto">
            <div className="flex items-start justify-between gap-4 border-b-2 border-slate-200 pb-4">
              <div>
                <h2 className="font-display font-extrabold text-2xl text-[#111318]">
                  Cửa Hàng Nâng Cấp Xe Bánh Tráng
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Dùng Xu hoặc Tiền Mặt (có thể vay từ Cột Điện) để trang bị đồ nghề vỉa hè.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="font-mono-tabular font-extrabold text-base text-amber-600">
                    {hud.xu.toLocaleString('vi-VN')} Xu
                  </div>
                  <div className="font-mono-tabular font-bold text-xs text-emerald-700">
                    {hud.money.toLocaleString('vi-VN')}đ
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseShop}
                  aria-label="Đóng cửa hàng"
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 border-2 border-[#111318] text-[#111318] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {SHOP_ITEMS.map((item) => {
                const owned = hud.upgrades[item.key];
                const canAffordXu = hud.xu >= item.cost;
                const cashCost = item.cost * 20;
                const canAffordCash = hud.money >= cashCost;
                return (
                  <div
                    key={item.id}
                    style={{ backgroundColor: owned ? '#ECFDF5' : item.accent }}
                    className="rounded-xl border-[2.5px] border-[#111318] p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display font-extrabold text-base text-[#111318]">
                          {item.name}
                        </h3>
                        <span className="font-mono-tabular font-bold text-xs text-amber-800 whitespace-nowrap">
                          {item.cost.toLocaleString('vi-VN')} Xu
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    {owned ? (
                      <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border-2 border-[#111318] font-display font-bold text-xs bg-[#10B981] text-white">
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã Trang Bị</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          disabled={!canAffordXu}
                          onClick={() => handleBuyItem(item.id)}
                          className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border-2 border-[#111318] font-display font-bold text-xs whitespace-nowrap transition-transform ${
                            canAffordXu
                              ? 'bg-[#F59E0B] hover:bg-[#FBBF24] text-[#111318] active:translate-y-0.5 cursor-pointer'
                              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <span>Mua ({item.cost.toLocaleString('vi-VN')} Xu)</span>
                        </button>
                        <button
                          type="button"
                          disabled={!canAffordCash}
                          onClick={() => engineRef.current?.buyShopItem(item.id, true)}
                          className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border-2 border-[#111318] font-mono-tabular font-bold text-[11px] whitespace-nowrap transition-transform ${
                            canAffordCash
                              ? 'bg-white hover:bg-emerald-50 text-emerald-800 active:translate-y-0.5 cursor-pointer'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span>Mua Tiền Mặt ({cashCost.toLocaleString('vi-VN')}đ)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleCloseShop}
                className="px-5 py-2.5 rounded-xl bg-[#111318] hover:bg-slate-800 text-white font-display font-bold text-sm cursor-pointer"
              >
                Đóng &amp; Bán Tiếp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {hud.screen === 'PAUSED' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111318]/75 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] border-[#111318] comic-shadow p-7 flex flex-col gap-5">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-[#111318]">
                Tạm Nghỉ Đẩy Xe
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Khách vẫn đang đứng chờ bên ngoài, quay lại kẻo nguội xoài!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y-2 border-slate-200 text-sm">
              <div>
                <div className="text-slate-500 text-xs">Doanh thu hiện tại</div>
                <div className="font-mono-tabular font-bold text-lg text-emerald-700">
                  {hud.money.toLocaleString('vi-VN')}đ
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Ghế Nhựa Đỏ</div>
                <div className="font-mono-tabular font-bold text-lg text-rose-600">
                  {hud.redChairs} / {hud.maxRedChairs} chiếc
                </div>
              </div>
            </div>

            <ShiftDurationSelector
              dayDuration={hud.dayDuration}
              onSelect={(secs) => engineRef.current?.setDayDuration(secs)}
            />

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleTogglePause}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#10B981] hover:bg-[#34D399] text-white font-display font-bold text-sm border-[3px] border-[#111318] comic-shadow-sm whitespace-nowrap cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Tiếp Tục Bán</span>
              </button>
              <button
                type="button"
                onClick={() => engineRef.current?.closeShopNow()}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-display font-bold text-sm border-[3px] border-[#111318] comic-shadow-sm whitespace-nowrap cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đóng Ca</span>
              </button>
              <button
                type="button"
                onClick={handleStart}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#111318] font-display font-bold text-sm border-[3px] border-[#111318] comic-shadow-sm whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lại</span>
              </button>
              <button
                type="button"
                onClick={handleReturnTitle}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#111318] font-display font-bold text-sm border-[3px] border-[#111318] comic-shadow-sm whitespace-nowrap cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Trang Chủ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {hud.screen === 'GAME_OVER' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#111318]/80 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#FFFDF5] text-[#111318] border-[3px] border-[#111318] comic-shadow p-7 flex flex-col gap-5">
            <div>
              <div className="text-xs font-bold text-rose-600 mb-1">
                Kết Thúc Ca Bán Hàng
              </div>
              <h2 className="font-display font-extrabold text-3xl text-[#111318] text-balance">
                Xe Bánh Tráng Bị Tạm Giữ!
              </h2>
              <p className="text-sm text-slate-700 mt-2">
                {hud.gameOverReason || 'Hết Ghế Nhựa Đỏ, hẹn gặp lại trên vỉa hè ngày mai!'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y-2 border-slate-200">
              <div>
                <div className="text-xs text-slate-500">Tổng doanh thu</div>
                <div className="font-mono-tabular font-extrabold text-2xl text-emerald-700">
                  {hud.money.toLocaleString('vi-VN')}đ
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Số hộp đã giao</div>
                <div className="font-mono-tabular font-extrabold text-2xl text-[#111318]">
                  {hud.ordersServed} hộp
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Đơn chuẩn vị</div>
                <div className="font-mono-tabular font-bold text-lg text-amber-600">
                  {hud.perfectOrders} hộp
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Lần thoát Trật Tự</div>
                <div className="font-mono-tabular font-bold text-lg text-rose-600">
                  {hud.raidsSurvived} lần
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#111318] font-display font-extrabold text-base border-[3px] border-[#111318] comic-shadow-sm whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lại</span>
              </button>
              <button
                type="button"
                onClick={handleReturnTitle}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-[#111318] font-display font-bold text-base border-[3px] border-[#111318] comic-shadow-sm whitespace-nowrap cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Trang Chủ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
