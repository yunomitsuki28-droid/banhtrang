import type {
  BaziProfile,
  CustomerOrder,
  CustomerType,
  DailyHexagram,
  DishType,
  ElementType,
  InventoryState,
  MarketPrices,
  NewspaperEvent,
  RawIngredientId,
  SeasoningLevel,
  TarotCardDef,
  TarotCardId,
  TarotDialogueOption,
  TarotDialogueTone,
  ToppingDef,
  ToppingId,
} from './types';

export const TOPPINGS: ToppingDef[] = [
  {
    id: 'kho_bo',
    name: 'Khô Bò',
    shortName: 'Khô bò',
    color: '#991B1B',
    accentColor: '#EF4444',
    isWeird: false,
  },
  {
    id: 'trung_cut',
    name: 'Trứng Cút',
    shortName: 'Trứng cút',
    color: '#FEF3C7',
    accentColor: '#F59E0B',
    isWeird: false,
  },
  {
    id: 'xoai',
    name: 'Xoài Bào',
    shortName: 'Xoài',
    color: '#FBBF24',
    accentColor: '#D97706',
    isWeird: false,
  },
  {
    id: 'rau_ram',
    name: 'Rau Răm',
    shortName: 'Rau răm',
    color: '#15803D',
    accentColor: '#4ADE80',
    isWeird: false,
  },
  {
    id: 'pho_mai',
    name: 'Phô Mai',
    shortName: 'Phô mai',
    color: '#FDE047',
    accentColor: '#EAB308',
    isWeird: true,
  },
  {
    id: 'tran_chau',
    name: 'Trân Châu',
    shortName: 'Trân châu',
    color: '#27272A',
    accentColor: '#71717A',
    isWeird: true,
  },
  {
    id: 'sau_rieng',
    name: 'Sầu Riêng',
    shortName: 'Sầu riêng',
    color: '#FDE047',
    accentColor: '#CA8A04',
    isWeird: true,
  },
  {
    id: 'nuoc_cot_dua',
    name: 'Nước Cốt Dừa',
    shortName: 'Cốt dừa',
    color: '#F8FAFC',
    accentColor: '#94A3B8',
    isWeird: true,
  },
];

export const TOPPING_MAP: Record<ToppingId, ToppingDef> = TOPPINGS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<ToppingId, ToppingDef>
);

export interface RawIngredientMeta {
  id: RawIngredientId;
  name: string;
  unit: string;
  basePrice: number;
  color: string;
}

export const RAW_INGREDIENTS: RawIngredientMeta[] = [
  { id: 'banh_trang', name: 'Bánh Tráng Phơi Sương', unit: 'xấp', basePrice: 2000, color: '#FEF3C7' },
  { id: 'kho_bo', name: 'Khô Bò Xé Sợi', unit: 'phần', basePrice: 4000, color: '#FEE2E2' },
  { id: 'trung_cut', name: 'Trứng Cút Luộc', unit: 'chục', basePrice: 3000, color: '#FEF9C3' },
  { id: 'xoai', name: 'Xoài Xanh Bào', unit: 'trái', basePrice: 2000, color: '#ECFCCB' },
  { id: 'rau_ram', name: 'Rau Răm Tươi', unit: 'bó', basePrice: 1000, color: '#DCFCE7' },
  { id: 'tac', name: 'Tắc & Sa Tế Tỏi', unit: 'bịch', basePrice: 2000, color: '#FFEDD5' },
];

export const BASE_MARKET_PRICES: MarketPrices = {
  banh_trang: 2000,
  kho_bo: 4000,
  trung_cut: 3000,
  xoai: 2000,
  rau_ram: 1000,
  tac: 2000,
};

export const NEWSPAPER_EVENTS: NewspaperEvent[] = [
  {
    id: 'egg_shortage',
    headline: 'KHAN HIẾM TRỨNG CÚT TOÀN THÀNH PHỐ!',
    subtext: 'Nguồn cung trứng cút sụt giảm mạnh, giá nhập tăng gấp đôi (x2) trong hôm nay.',
    multipliers: { trung_cut: 2.0 },
  },
  {
    id: 'lime_bumper',
    headline: 'ĐƯỢC MÙA TẮC & CHANH MIỀN TÂY!',
    subtext: 'Thương lái đổ về chợ đầu mối quá nhiều, giá Tắc & Sa tế giảm một nửa (x0.5)!',
    multipliers: { tac: 0.5 },
  },
  {
    id: 'beef_surge',
    headline: 'GIÁ KHÔ BÒ TĂNG VỌT VÌ MÙA BÓNG ĐÁ!',
    subtext: 'Dân nhậu gom sạch khô bò khắp chợ, giá Khô Bò tăng vọt (x1.75).',
    multipliers: { kho_bo: 1.75 },
  },
  {
    id: 'mango_bumper',
    headline: 'XOÀI KEO VÀO MÙA CHÍN RỘ!',
    subtext: 'Xoài xanh giòn ngọt ngập chợ đầu mối, giá Xoài Bào chỉ còn một nửa (x0.5).',
    multipliers: { xoai: 0.5 },
  },
  {
    id: 'paper_shortage',
    headline: 'LÀNG NGHỀ BÁNH TRÁNG GẶP MƯA LỚN!',
    subtext: 'Khó phơi bánh tráng ngoài trời, giá Bánh Tráng Phơi Sương nhích lên (x1.5).',
    multipliers: { banh_trang: 1.5, rau_ram: 1.5 },
  },
  {
    id: 'steady_market',
    headline: 'CHỢ ĐẦU MỐI BÌNH ỔN GIÁ CẢ',
    subtext: 'Mọi nguyên liệu hôm nay giao dịch bình thường, thời tiết đẹp để đẩy xe bán.',
    multipliers: {},
  },
];

export function rollNewspaperEvent(day: number): NewspaperEvent {
  if (day === 1) {
    // Showcase a recognizable economic event on Day 1 right away!
    return pickRandom([NEWSPAPER_EVENTS[0], NEWSPAPER_EVENTS[1]]);
  }
  return pickRandom(NEWSPAPER_EVENTS);
}

export function computeMarketPrices(event: NewspaperEvent): MarketPrices {
  const prices = { ...BASE_MARKET_PRICES };
  for (const item of RAW_INGREDIENTS) {
    const mult = event.multipliers[item.id] ?? 1;
    prices[item.id] = Math.max(500, Math.round((item.basePrice * mult) / 500) * 500);
  }
  return prices;
}

export const SEASONING_LABEL: Record<SeasoningLevel, string> = {
  IT: 'Ít',
  VUA: 'Vừa',
  NHIEU: 'Nhiều',
};

export const SEASONING_RANGE: Record<SeasoningLevel, [number, number]> = {
  IT: [14, 38],
  VUA: [40, 68],
  NHIEU: [70, 94],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface ElementMeta {
  element: ElementType;
  label: string;
  shortLabel: string;
  hexagramTitle: string;
  boostDesc: string;
  clashLabel: string;
  color: string;
  bg: string;
}

export const ELEMENT_META: Record<ElementType, ElementMeta> = {
  WOOD: {
    element: 'WOOD',
    label: 'Mộc (Sinh Khí)',
    shortLabel: 'Mộc',
    hexagramTitle: 'Quẻ Chấn · Mộc Vượng',
    boostDesc: 'Đơn có Xoài Xanh + Rau Răm tăng +35% giá bán!',
    clashLabel: 'Kỵ Hỏa (Khô Bò / Sa Tế Nhiều)',
    color: '#059669',
    bg: '#D1FAE5',
  },
  FIRE: {
    element: 'FIRE',
    label: 'Hỏa (Nhiệt Huyết)',
    shortLabel: 'Hỏa',
    hexagramTitle: 'Quẻ Ly · Hỏa Chiếu',
    boostDesc: 'Đơn có Khô Bò + Sa Tế Nhiều tăng +35% giá bán!',
    clashLabel: 'Kỵ Thủy (Trân Châu / Cốt Dừa / Chanh Nhiều)',
    color: '#DC2626',
    bg: '#FEE2E2',
  },
  EARTH: {
    element: 'EARTH',
    label: 'Thổ (Vững Chãi)',
    shortLabel: 'Thổ',
    hexagramTitle: 'Quẻ Khôn · Thổ Dày',
    boostDesc: 'Đơn có Trứng Cút (từ 2 quả) tăng +35% giá bán!',
    clashLabel: 'Kỵ Mộc (Xoài / Rau Răm)',
    color: '#D97706',
    bg: '#FEF3C7',
  },
  METAL: {
    element: 'METAL',
    label: 'Kim (Sắc Bén)',
    shortLabel: 'Kim',
    hexagramTitle: 'Quẻ Càn · Kim Cương',
    boostDesc: 'Đơn cắt từ 5 khúc trở lên + Khô Bò tăng +35% giá bán!',
    clashLabel: 'Kỵ Hỏa (Sa Tế Nhiều)',
    color: '#475569',
    bg: '#E2E8F0',
  },
  WATER: {
    element: 'WATER',
    label: 'Thủy (Linh Hoạt)',
    shortLabel: 'Thủy',
    hexagramTitle: 'Quẻ Khảm · Thủy Lưu',
    boostDesc: 'Đơn Chanh Nhiều hoặc Trân Châu tăng +35% giá bán!',
    clashLabel: 'Kỵ Thổ (Trứng Cút / Phô Mai)',
    color: '#0284C7',
    bg: '#E0F2FE',
  },
};

const ALL_ELEMENTS: ElementType[] = ['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER'];

export function rollDailyHexagram(day: number): DailyHexagram {
  const el = ALL_ELEMENTS[(day - 1 + Math.floor(Math.random() * ALL_ELEMENTS.length)) % ALL_ELEMENTS.length];
  const meta = ELEMENT_META[el];
  return {
    element: el,
    name: meta.label,
    hexagramTitle: meta.hexagramTitle,
    boostDesc: meta.boostDesc,
    boostPercent: 35,
  };
}

export const TOPPING_ELEMENT_MAP: Record<ToppingId, ElementType> = {
  xoai: 'WOOD',
  rau_ram: 'WOOD',
  kho_bo: 'FIRE',
  trung_cut: 'EARTH',
  pho_mai: 'EARTH',
  sau_rieng: 'EARTH',
  tran_chau: 'WATER',
  nuoc_cot_dua: 'WATER',
};

export const BAZI_PROFILES: BaziProfile[] = [
  {
    id: 'weak_ding_fire',
    title: 'Đinh Hỏa Nhược (Thiếu Mộc trợ Hỏa)',
    dayMaster: 'Đinh Hỏa Nhược',
    chartPillars: [
      { label: 'Trụ Năm', stem: 'Nhâm', branch: 'Thìn', element: 'WATER' },
      { label: 'Trụ Tháng', stem: 'Quý', branch: 'Hợi', element: 'WATER' },
      { label: 'Nhật Chủ', stem: 'Đinh', branch: 'Mão', element: 'FIRE' },
      { label: 'Trụ Giờ', stem: 'Canh', branch: 'Tý', element: 'WATER' },
    ],
    neededElements: ['WOOD', 'FIRE'],
    tabooElements: ['WATER'],
    businessWorry:
      'Tháng này thủy vượng khắc hỏa, hợp đồng lớn của anh sắp rớt hết rồi! Thầy coi giùm lá số trộn giùm bịch bánh tráng cải vận!',
    recommendedText: 'Dùng Xoài Bào / Rau Răm (Mộc) + Khô Bò / Sa Tế Nhiều (Hỏa). TRÁNH Chanh Nhiều, Trân Châu & Cốt Dừa (Thủy)!',
  },
  {
    id: 'weak_yi_wood',
    title: 'Ất Mộc Nhược (Kim vượng chém Mộc)',
    dayMaster: 'Ất Mộc Nhược',
    chartPillars: [
      { label: 'Trụ Năm', stem: 'Canh', branch: 'Thân', element: 'METAL' },
      { label: 'Trụ Tháng', stem: 'Tân', branch: 'Dậu', element: 'METAL' },
      { label: 'Nhật Chủ', stem: 'Ất', branch: 'Sửu', element: 'WOOD' },
      { label: 'Trụ Giờ', stem: 'Bính', branch: 'Tuất', element: 'FIRE' },
    ],
    neededElements: ['WATER', 'WOOD'],
    tabooElements: ['FIRE'],
    businessWorry:
      'Đối thủ cạnh tranh ép giá gay gắt quá, cây Mộc của chị héo khô luôn rồi! Làm cho chị phần cải vận giải hạn nha!',
    recommendedText: 'Dùng Chanh Nhiều (Thủy sinh Mộc) + Xoài Bào & Rau Răm (Mộc). TRÁNH Khô Bò & Sa Tế Nhiều (Hỏa đốt Mộc)!',
  },
  {
    id: 'weak_wu_earth',
    title: 'Mậu Thổ Nhược (Mộc khắc Thổ)',
    dayMaster: 'Mậu Thổ Nhược',
    chartPillars: [
      { label: 'Trụ Năm', stem: 'Giáp', branch: 'Dần', element: 'WOOD' },
      { label: 'Trụ Tháng', stem: 'Ất', branch: 'Mão', element: 'WOOD' },
      { label: 'Nhật Chủ', stem: 'Mậu', branch: 'Tý', element: 'EARTH' },
      { label: 'Trụ Giờ', stem: 'Nhâm', branch: 'Thân', element: 'WATER' },
    ],
    neededElements: ['FIRE', 'EARTH'],
    tabooElements: ['WOOD'],
    businessWorry:
      'Tiền bạc cứ trôi tuột qua kẽ tay, đất nền công ty đóng băng suốt quý! Trộn phần bánh tráng giữ lộc đất giúp anh!',
    recommendedText: 'Dùng Khô Bò / Sa Tế Nhiều (Hỏa sinh Thổ) + Trứng Cút (Thổ). TRÁNH Xoài Bào & Rau Răm (Mộc khắc Thổ)!',
  },
  {
    id: 'weak_geng_metal',
    title: 'Canh Kim Nhược (Hỏa vượng nung Kim)',
    dayMaster: 'Canh Kim Nhược',
    chartPillars: [
      { label: 'Trụ Năm', stem: 'Bính', branch: 'Ngọ', element: 'FIRE' },
      { label: 'Trụ Tháng', stem: 'Đinh', branch: 'Tỵ', element: 'FIRE' },
      { label: 'Nhật Chủ', stem: 'Canh', branch: 'Ngọ', element: 'METAL' },
      { label: 'Trụ Giờ', stem: 'Giáp', branch: 'Ngọ', element: 'WOOD' },
    ],
    neededElements: ['EARTH', 'METAL'],
    tabooElements: ['FIRE'],
    businessWorry:
      'Dòng tiền bị kẹt, cổ phiếu đỏ rực cả tuần nay! Trộn giúp tôi phần bánh tráng tụ tài Kim Thổ ngay!',
    recommendedText: 'Dùng Trứng Cút (Thổ sinh Kim) + Cắt từ 5 khúc trở lên (Kim sắc bén). TRÁNH Khô Bò & Sa Tế Nhiều (Hỏa)!',
  },
  {
    id: 'weak_ren_water',
    title: 'Nhâm Thủy Nhược (Thổ lấp dòng Thủy)',
    dayMaster: 'Nhâm Thủy Nhược',
    chartPillars: [
      { label: 'Trụ Năm', stem: 'Mậu', branch: 'Tuất', element: 'EARTH' },
      { label: 'Trụ Tháng', stem: 'Kỷ', branch: 'Mùi', element: 'EARTH' },
      { label: 'Nhật Chủ', stem: 'Nhâm', branch: 'Thìn', element: 'WATER' },
      { label: 'Trụ Giờ', stem: 'Bính', branch: 'Tuất', element: 'FIRE' },
    ],
    neededElements: ['METAL', 'WATER'],
    tabooElements: ['EARTH'],
    businessWorry:
      'Khách hàng bỗng dưng im ắng bất thường, đơn hàng tắc nghẽn như bị đất lấp! Cải vận khơi thông dòng tiền giùm anh!',
    recommendedText: 'Dùng Cắt từ 5 khúc trở lên (Kim) + Chanh Nhiều (Thủy). TRÁNH Trứng Cút & Phô Mai (Thổ)!',
  },
];

export function generateBaziProfile(): BaziProfile {
  return pickRandom(BAZI_PROFILES);
}

export function evaluateBaziIngredientMatch(
  profile: BaziProfile,
  addedToppings: Record<ToppingId, number>,
  sliceCount: number,
  limeValue: number,
  chiliValue: number
): {
  matched: boolean;
  hitNeeded: ElementType[];
  hitTaboo: ElementType[];
  missingNeeded: ElementType[];
} {
  const present = new Set<ElementType>();
  if ((addedToppings.xoai || 0) > 0 || (addedToppings.rau_ram || 0) > 0) {
    present.add('WOOD');
  }
  if ((addedToppings.kho_bo || 0) > 0 || chiliValue >= 68) {
    present.add('FIRE');
  }
  if (
    (addedToppings.trung_cut || 0) > 0 ||
    (addedToppings.pho_mai || 0) > 0 ||
    (addedToppings.sau_rieng || 0) > 0
  ) {
    present.add('EARTH');
  }
  if (sliceCount >= 5) {
    present.add('METAL');
  }
  if (
    limeValue >= 68 ||
    (addedToppings.tran_chau || 0) > 0 ||
    (addedToppings.nuoc_cot_dua || 0) > 0
  ) {
    present.add('WATER');
  }

  const hitNeeded = profile.neededElements.filter((el) => present.has(el));
  const missingNeeded = profile.neededElements.filter((el) => !present.has(el));
  const hitTaboo = profile.tabooElements.filter((el) => present.has(el));

  return {
    matched: hitTaboo.length === 0 && missingNeeded.length === 0,
    hitNeeded,
    hitTaboo,
    missingNeeded,
  };
}

export const STREET_TAROT_DECK: TarotCardDef[] = [
  {
    id: 'THE_LOST_SHIPPER',
    numeral: '0',
    name: 'The Lost Shipper (The Fool)',
    viName: 'Shipper Lạc Hẻm',
    imageRef: 'street_tarot_lost_shipper.svg',
    streetMeaning:
      'Blind leaps & wrong turns: lao đầu rẽ nhầm hẻm cụt không thèm bật Google Maps, tin lời hứa mù quáng.',
    advice: {
      A: 'Sự thật phũ phàng: Bạn đang đi nhầm đường hệt như shipper tắt GPS — người cũ đã rẽ sang ngã khác rồi, đừng chờ nữa!',
      B: 'An ủi dịu dàng: Lạc đường một chút thôi mà, biết đâu vòng ra đầu hẻm lại gặp đúng người xứng đáng hơn. Cứ từ từ thở nhẹ nhé!',
      C: 'Chốt đơn Tarot Combo: Vía đang rối ren lắm, làm ngay Tarot Combo (Bánh Tráng Đặc Biệt + Trà Tắc Size L, 3x giá) để mở cung tài lộc & dẫn đường chỉ lối!',
    },
  },
  {
    id: 'THE_STREET_VENDOR',
    numeral: 'I',
    name: 'The Street Vendor (The Magician)',
    viName: 'Bậc Thầy Xe Đẩy',
    imageRef: 'street_tarot_street_vendor.svg',
    streetMeaning:
      'Skill & elemental mastery: đôi tay lắc thau điêu luyện, biến nguyên liệu bình dân thành phép màu xoay chuyển cục diện.',
    advice: {
      A: 'Sự thật phũ phàng: Đừng tưởng mình kiểm soát được trái tim người ta — bạn chỉ đang tự huyễn hoặc và tự lừa mình thôi.',
      B: 'An ủi dịu dàng: Bạn đủ bản lĩnh và duyên dáng để tự làm chủ cuộc đời mình. Rồi người biết trân trọng phép màu của bạn sẽ tới!',
      C: 'Chốt đơn Tarot Combo: Nâng tầm năng lượng Bậc Thầy với Tarot Combo (Full Topping Ngũ Hành + Trà Tắc 3x giá) để hút vía chủ động ngay tối nay!',
    },
  },
  {
    id: 'THE_URBAN_GUARD',
    numeral: 'IV',
    name: 'The Urban Guard (The Emperor)',
    viName: 'Trật Tự Đô Thị',
    imageRef: 'street_tarot_urban_guard.svg',
    streetMeaning:
      'Harsh rules, authority & sudden stops: tiếng còi thổi gắt ngang vỉa hè, ranh giới thép buộc bạn phải dừng lại.',
    advice: {
      A: 'Sự thật phũ phàng: Luật chơi rõ ràng rồi — họ đã chặn hết đường lui của bạn, đừng cố lấn vỉa hè tình cảm nữa!',
      B: 'An ủi dịu dàng: Tạm dừng không phải thua cuộc, chỉ là vũ trụ nhắc bạn bảo vệ ranh giới và thương bản thân hơn một chút.',
      C: 'Chốt đơn Tarot Combo: Gặp cửa ải cứng nhắc phải "giải hạn" bằng Tarot Combo (3x giá) — vị cay nồng sẽ phá tan bế tắc tình duyên!',
    },
  },
  {
    id: 'THE_RIPPED_BAG',
    numeral: 'XIII',
    name: 'The Ripped Bag (Death)',
    viName: 'Bục Đáy Bịch',
    imageRef: 'street_tarot_ripped_bag.svg',
    streetMeaning:
      'Sudden loss & letting go: đáy bịch rách bất ngờ, trứng cút rơi vãi — đã đến lúc buông bỏ cái cũ không thể níu kéo.',
    advice: {
      A: 'Sự thật phũ phàng: Chuyện tình này bục đáy đổ hết rồi, có cúi xuống nhặt lại cũng không thể nguyên vẹn như ban đầu đâu!',
      B: 'An ủi dịu dàng: Mất mát nào rồi cũng qua. Buông được thứ cũ rách thì tay mới rảnh để đón điều tốt đẹp hơn đang chờ phía trước.',
      C: 'Chốt đơn Tarot Combo: Tống cựu nghênh tân! Đặt ngay Tarot Combo 2 lớp bịch siêu dày (3x giá) để thay vận mới, lộc lá đầy tay!',
    },
  },
  {
    id: 'THE_TOXIC_COMBO',
    numeral: 'XV',
    name: 'The Toxic Combo (The Devil)',
    viName: 'Combo Độc Hại',
    imageRef: 'street_tarot_toxic_combo.svg',
    streetMeaning:
      'Toxic relationships & bad temptations: biết rõ ăn cay xé lưỡi lúc nửa đêm là đau bụng nhưng vẫn không cưỡng nổi cám dỗ.',
    advice: {
      A: 'Sự thật phũ phàng: Đó là mối quan hệ độc hại! Bạn cứ tự đâm đầu vào tin nhắn nửa đêm của họ thì chỉ tự làm khổ mình thôi.',
      B: 'An ủi dịu dàng: Ai cũng từng yếu lòng trước cám dỗ ngọt ngào. Đừng tự trách mình nhé, tối nay cứ nhẹ nhàng buông điện thoại xuống thôi.',
      C: 'Chốt đơn Tarot Combo: Giải độc cám dỗ bằng vị chua thanh mát! Lên ngay Tarot Combo (3x giá) để thanh lọc năng lượng red flag ngay lập tức!',
    },
  },
  {
    id: 'THE_CONFISCATION',
    numeral: 'XVI',
    name: 'The Confiscation (The Tower)',
    viName: 'Tịch Thu Toàn Bộ',
    imageRef: 'street_tarot_confiscation.svg',
    streetMeaning:
      'Absolute disaster & losing everything: xe đẩy lên thùng công vụ trong chớp mắt, sụp đổ hoàn toàn ảo mộng cũ để làm lại từ đầu.',
    advice: {
      A: 'Sự thật phũ phàng: Toang sạch sẽ rồi! Họ xóa sạch dấu vết như xe bị hốt lên phường, đừng mơ ngày quay lại nữa.',
      B: 'An ủi dịu dàng: Sau cơn giông lớn trời lại sáng. Đừng buồn vì những gì sụp đổ, bạn còn trẻ và dư sức dựng lại tất cả rực rỡ hơn!',
      C: 'Chốt đơn Tarot Combo: Hồi sinh sau đại nạn! Order Tarot Combo Hoàng Kim (3x giá) để nạp full năng lượng tái thiết vận mệnh từ con số 0!',
    },
  },
];

export const TAROT_CARDS: TarotCardDef[] = STREET_TAROT_DECK;

export const HEARTBROKEN_QUESTIONS: string[] = [
  'Thầy ơi trải giùm em một quẻ... Người yêu cũ có nhắn tin lại cho em đêm nay không?',
  'Sao người ta seen tin nhắn em 3 ngày chưa rep vậy thầy? Có phải đang mập mờ mối khác không?',
  'Em vừa block crush xong giờ hối hận quá... Tháng này em có thoát ế nổi không thầy?',
  'Anh ấy nói "mình chỉ nên làm bạn" là ý gì vậy thầy? Em còn cơ hội không?',
];

export function drawTarotCard(deck: TarotCardDef[] = STREET_TAROT_DECK): TarotCardDef {
  const index = Math.floor(Math.random() * deck.length);
  return deck[index] ?? deck[0];
}

export function pickTarotSpread(): TarotCardDef[] {
  const copy = [...STREET_TAROT_DECK];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 3);
}

export function getTarotOptionsForCard(card: TarotCardDef): TarotDialogueOption[] {
  return [
    {
      choiceKey: 'A',
      tone: 'TRUTH',
      label: 'A. Sự Thật Phũ Phàng (Truth)',
      speech: card.advice.A,
    },
    {
      choiceKey: 'B',
      tone: 'COMFORT',
      label: 'B. An Ủi Nhẹ Nhàng (Comfort)',
      speech: card.advice.B,
    },
    {
      choiceKey: 'C',
      tone: 'UPSELL',
      label: 'C. Chốt Tarot Combo (Upsell x3)',
      speech: card.advice.C,
    },
  ];
}

export function resolveTarotInterpretation(
  _card: TarotCardDef,
  tone: TarotDialogueTone
): {
  outcomeKind: 'LEFT' | 'TIP' | 'COMBO_3X';
  customerLeft: boolean;
  tipAmount: number;
  priceMultiplier: number;
  upgradedToCombo: boolean;
  resultMessage: string;
} {
  if (tone === 'TRUTH') {
    return {
      outcomeKind: 'LEFT',
      customerLeft: true,
      tipAmount: 0,
      priceMultiplier: 0,
      upgradedToCombo: false,
      resultMessage:
        'Khách Gen Z rưng rưng nước mắt: "Thầy nói thật đau lòng quá... Em không nuốt nổi món gì nữa đâu, em về đây!" (Khách buồn bã bỏ đi, không mua gì)',
    };
  }
  if (tone === 'COMFORT') {
    return {
      outcomeKind: 'TIP',
      customerLeft: false,
      tipAmount: 10000,
      priceMultiplier: 1,
      upgradedToCombo: false,
      resultMessage:
        'Khách Gen Z mỉm cười nhẹ nhõm: "Nghe thầy nói em thấy ấm lòng hẳn! Em gửi thầy 10,000 VND tiền tip lấy lộc nha, làm giùm em phần thường ạ!"',
    };
  }
  return {
    outcomeKind: 'COMBO_3X',
    customerLeft: false,
    tipAmount: 0,
    priceMultiplier: 3,
    upgradedToCombo: true,
    resultMessage:
      'Khách Gen Z gật đầu lia lịa: "Chốt luôn Tarot Combo 3x giá nha thầy! Miễn sao đổi vận tình duyên là em chơi tới bến!"',
  };
}

export function generateCustomerOrder(
  orderIndex: number,
  nextId: () => number,
  genZUnlocked = false,
  forceType?: CustomerType,
  inventory?: InventoryState,
  cursedMenuUnlocked = false,
  forceShipperBrand?: 'GREEN' | 'ORANGE',
  dominantElement?: ElementType
): CustomerOrder {
  const difficulty = Math.min(1, orderIndex / 14);

  const pool: CustomerType[] = genZUnlocked
    ? ['STUDENT', 'NINJA_LEAD', 'GEN_Z', 'GEN_Z', 'OFFICE', 'APP_SHIPPER']
    : cursedMenuUnlocked
    ? ['STUDENT', 'NINJA_LEAD', 'GEN_Z', 'OFFICE', 'APP_SHIPPER']
    : orderIndex === 0
    ? ['STUDENT']
    : orderIndex === 1
    ? ['NINJA_LEAD']
    : ['STUDENT', 'NINJA_LEAD', 'OFFICE', 'APP_SHIPPER'];

  const customerType =
    forceType && (forceType !== 'GEN_Z' || genZUnlocked || cursedMenuUnlocked)
      ? forceType
      : pickRandom(pool);

  let dishType: DishType =
    orderIndex === 0 ? 'CUON' : orderIndex === 1 ? 'TRON' : Math.random() < 0.5 ? 'CUON' : 'TRON';

  if (
    customerType === 'FENG_SHUI' ||
    customerType === 'GYM_BRO' ||
    customerType === 'MUKBANGER' ||
    customerType === 'BUSINESS_BAZI'
  ) {
    dishType = 'TRON';
  }

  let targetSlices =
    customerType === 'GYM_BRO' || customerType === 'MUKBANGER'
      ? 0
      : customerType === 'GEN_Z'
      ? pickRandom([5, 6])
      : dishType === 'CUON'
      ? pickRandom([4, 5])
      : customerType === 'NINJA_LEAD' || customerType === 'APP_SHIPPER'
      ? pickRandom([3, 4])
      : pickRandom([4, 5]);

  const requiredToppings: Record<ToppingId, number> = {
    kho_bo: 0,
    trung_cut: 0,
    xoai: 0,
    rau_ram: 0,
    pho_mai: 0,
    tran_chau: 0,
    sau_rieng: 0,
    nuoc_cot_dua: 0,
  };

  let limeTarget: SeasoningLevel = pickRandom(['IT', 'VUA', 'NHIEU']);
  let chiliTarget: SeasoningLevel = pickRandom(['IT', 'VUA', 'NHIEU']);
  let dialogue = '';
  let customerLabel = '';
  let patienceDrainRate = 1.0;
  let maxPatience = (dishType === 'CUON' ? 56 : 50) - difficulty * 10;
  let baseReward = dishType === 'CUON' ? 42000 : 35000;
  let baseXu = dishType === 'CUON' ? 350 : 300;
  let isVip = false;
  let isCursedTrend = false;
  let shipperBrand: 'GREEN' | 'ORANGE' | undefined = undefined;
  let elementTag: ElementType | undefined = undefined;
  let elementClashText: string | undefined = undefined;
  let forbiddenToppings: ToppingId[] | undefined = undefined;
  let forbiddenChili: SeasoningLevel | undefined = undefined;
  let forbiddenLime: SeasoningLevel | undefined = undefined;
  let baziProfile: BaziProfile | undefined = undefined;

  if (customerType === 'BUSINESS_BAZI') {
    isVip = true;
    baziProfile = generateBaziProfile();
    customerLabel = 'Khách Doanh Nhân (Bát Tự)';
    elementTag = baziProfile.neededElements[0];
    elementClashText = `Kỵ ${baziProfile.tabooElements.map((e) => ELEMENT_META[e].shortLabel).join(', ')}`;

    // Configure matching order recipe so visual recipe hints align with Bazi balance
    if (baziProfile.id === 'weak_ding_fire') {
      targetSlices = 4;
      requiredToppings.xoai = 2;
      requiredToppings.rau_ram = 1;
      requiredToppings.kho_bo = 2;
      limeTarget = 'IT';
      chiliTarget = 'NHIEU';
      forbiddenToppings = ['tran_chau', 'nuoc_cot_dua'];
      forbiddenLime = 'NHIEU';
    } else if (baziProfile.id === 'weak_yi_wood') {
      targetSlices = 4;
      requiredToppings.xoai = 2;
      requiredToppings.rau_ram = 2;
      limeTarget = 'NHIEU';
      chiliTarget = 'IT';
      forbiddenToppings = ['kho_bo'];
      forbiddenChili = 'NHIEU';
    } else if (baziProfile.id === 'weak_wu_earth') {
      targetSlices = 4;
      requiredToppings.kho_bo = 2;
      requiredToppings.trung_cut = 2;
      limeTarget = 'VUA';
      chiliTarget = 'NHIEU';
      forbiddenToppings = ['xoai', 'rau_ram'];
    } else if (baziProfile.id === 'weak_geng_metal') {
      targetSlices = 5;
      requiredToppings.trung_cut = 3;
      limeTarget = 'VUA';
      chiliTarget = 'IT';
      forbiddenToppings = ['kho_bo'];
      forbiddenChili = 'NHIEU';
    } else {
      targetSlices = 5;
      requiredToppings.xoai = 1;
      limeTarget = 'NHIEU';
      chiliTarget = 'IT';
      forbiddenToppings = ['trung_cut', 'pho_mai'];
    }
    dialogue = `Lá số ${baziProfile.dayMaster}! ${baziProfile.recommendedText}`;
    patienceDrainRate = 0.75;
    maxPatience = 64;
    baseReward = 55000;
    baseXu = 480;
  } else if (customerType === 'HEARTBROKEN_GENZ') {
    customerLabel = 'Gen Z Thất Tình (Tarot)';
    requiredToppings.kho_bo = 1;
    requiredToppings.trung_cut = 1;
    requiredToppings.xoai = 1;
    requiredToppings.rau_ram = 1;
    limeTarget = 'VUA';
    chiliTarget = 'VUA';
    dialogue = 'Chờ thầy trải bài Tarot xong em chốt đơn luôn nha... Đang suy quá trời!';
    patienceDrainRate = 0.85;
    maxPatience = 58;
    baseReward = 38000;
    baseXu = 340;
  } else if (customerType === 'ROOM_HUNTERS') {
    dishType = 'TRON';
    targetSlices = 3;
    customerLabel = 'Nhóm Sinh Viên Tìm Trọ';
    requiredToppings.xoai = 1;
    requiredToppings.rau_ram = 1;
    limeTarget = 'VUA';
    chiliTarget = 'IT';
    dialogue = 'Tụi em đi tìm phòng trọ cả ngày mệt lả rồi... Cho bịch bánh tráng muối tắc rẻ nhất 10k thôi ạ!';
    patienceDrainRate = 0.8;
    maxPatience = 58;
    baseReward = 10000;
    baseXu = 140;
  } else if (customerType === 'MUKBANGER') {
    isVip = true;
    customerLabel = 'Thánh Mukbang (BOSS)';
    requiredToppings.kho_bo = 5;
    requiredToppings.trung_cut = 5;
    requiredToppings.xoai = 5;
    dialogue = 'ĐƠN BOSS 500K! Trộn cho anh Thau Bánh Tráng Khổng Lồ ngay trong 10 giây!';
    patienceDrainRate = 0;
    maxPatience = 99;
    baseReward = 500000;
    baseXu = 1000;
  } else if (customerType === 'APP_SHIPPER') {
    shipperBrand = forceShipperBrand ?? (Math.random() < 0.5 ? 'GREEN' : 'ORANGE');
    customerLabel = shipperBrand === 'GREEN' ? 'Shipper Áo Xanh' : 'Shipper Áo Cam';
    requiredToppings.kho_bo = pickRandom([1, 2]);
    requiredToppings.trung_cut = 1;
    requiredToppings.xoai = 1;
    requiredToppings.rau_ram = 1;
    limeTarget = 'VUA';
    chiliTarget = pickRandom(['VUA', 'NHIEU']);
    dialogue = `TRỄ GIỜ GIAO APP RỒI! Làm lẹ ${targetSlices} khúc giùm anh, khách hối quá trời!`;
    patienceDrainRate = 2.0; // 2x faster patience decrease!
    maxPatience = 46;
    baseReward = dishType === 'CUON' ? 48000 : 42000;
    baseXu = 380;
  } else if (customerType === 'FENG_SHUI') {
    isVip = true;
    customerLabel = 'Khách Tâm Linh (VIP)';
    const el = pickRandom(ALL_ELEMENTS);
    elementTag = el;
    elementClashText = ELEMENT_META[el].clashLabel;

    if (el === 'WOOD') {
      requiredToppings.xoai = 2;
      requiredToppings.rau_ram = 2;
      limeTarget = 'VUA';
      chiliTarget = 'IT';
      forbiddenToppings = ['kho_bo'];
      forbiddenChili = 'NHIEU';
      dialogue = `Thầy mạng MỘC! Cắt ${targetSlices} khúc, CHỈ bỏ Xoài + Rau Răm. Tuyệt đối CẤM Khô Bò & Cay Nhiều (kỵ Hỏa)!`;
    } else if (el === 'FIRE') {
      requiredToppings.kho_bo = 3;
      limeTarget = 'IT';
      chiliTarget = 'NHIEU';
      forbiddenToppings = ['tran_chau', 'nuoc_cot_dua'];
      forbiddenLime = 'NHIEU';
      dialogue = `Quẻ vượng HỎA! Cắt ${targetSlices} khúc với 3 Khô Bò & Sa Tế Nhiều. CẤM Chanh Nhiều & Trân Châu (Thủy khắc Hỏa)!`;
    } else if (el === 'EARTH') {
      requiredToppings.trung_cut = 3;
      if (genZUnlocked) requiredToppings.pho_mai = 1;
      limeTarget = 'VUA';
      chiliTarget = 'IT';
      forbiddenToppings = ['xoai', 'rau_ram'];
      dialogue = `Mệnh THỔ cần Trứng Cút${genZUnlocked ? ' + Phô Mai' : ''}! Cắt ${targetSlices} khúc, CẤM bỏ Xoài hoặc Rau Răm (Mộc khắc Thổ)!`;
    } else if (el === 'METAL') {
      targetSlices = 6;
      requiredToppings.kho_bo = 2;
      requiredToppings.trung_cut = 1;
      limeTarget = 'NHIEU';
      chiliTarget = 'IT';
      forbiddenChili = 'NHIEU';
      dialogue = `Bát tự KIM tinh khiết! Cắt đúng 6 khúc, 2 Khô Bò + 1 Trứng Cút + Chanh Nhiều. CẤM Sa Tế Nhiều (Hỏa khắc Kim)!`;
    } else {
      // WATER
      if (cursedMenuUnlocked) {
        requiredToppings.tran_chau = 2;
        requiredToppings.xoai = 1;
      } else {
        requiredToppings.xoai = 2;
        requiredToppings.rau_ram = 1;
      }
      limeTarget = 'NHIEU';
      chiliTarget = 'IT';
      forbiddenToppings = ['trung_cut', 'pho_mai'];
      dialogue = `Mệnh THỦY nhu hòa! Cắt ${targetSlices} khúc, Chanh Nhiều + ${
        cursedMenuUnlocked ? 'Trân Châu & Xoài' : 'Xoài & Rau Răm'
      }. CẤM Trứng Cút (Thổ khắc Thủy)!`;
    }
    patienceDrainRate = 0.85;
    maxPatience = 58;
    baseReward = 58000;
    baseXu = 520;
  } else if (customerType === 'GYM_BRO') {
    isVip = true;
    customerLabel = 'Gymer Đô Con (VIP)';
    dishType = 'TRON';
    targetSlices = 0;
    requiredToppings.kho_bo = 3;
    requiredToppings.trung_cut = 3;
    limeTarget = 'VUA';
    chiliTarget = 'IT';
    dialogue =
      'Anh đang siết cơ LOW-CARB! KHÔNG bánh tráng, CHỈ lấy 3 Khô Bò + 3 Trứng Cút! Chuẩn protein anh share bí kíp chạy bộ cực nhanh!';
    patienceDrainRate = 0.95;
    maxPatience = 52;
    baseReward = 60000;
    baseXu = 520;
  } else if (customerType === 'REAL_ESTATE') {
    isVip = true;
    customerLabel = 'Sale Bất Động Sản (VIP)';
    requiredToppings.kho_bo = 2;
    requiredToppings.trung_cut = 2;
    requiredToppings.xoai = 1;
    requiredToppings.rau_ram = 1;
    limeTarget = 'VUA';
    chiliTarget = 'VUA';
    dialogue =
      dishType === 'CUON'
        ? `Cuốn ${targetSlices} khúc thật bén để anh đi chốt căn Penthouse! Nhớ bớt anh 2k lấy lộc nha, chốt xong anh bo 100k!`
        : `Trộn ${targetSlices} khúc cho anh đi gặp khách VIP! Bớt anh 2k lấy hên lúc thối tiền, có lộc anh bo hẳn 100k!`;
    patienceDrainRate = 1.05;
    maxPatience = 54;
    baseReward = 52000;
    baseXu = 460;
  } else if (customerType === 'STUDENT') {
    customerLabel = 'Sinh Viên Đói Bụng';
    requiredToppings.kho_bo = pickRandom([2, 3]);
    requiredToppings.trung_cut = pickRandom([1, 2]);
    requiredToppings.xoai = 1;
    requiredToppings.rau_ram = 1;
    limeTarget = 'VUA';
    chiliTarget = pickRandom(['VUA', 'NHIEU']);
    dialogue =
      dishType === 'CUON'
        ? pickRandom([
            `Cuốn cho em ${targetSlices} khúc bánh tráng cuốn nhiều khô bò ăn cho qua môn nha!`,
            `Cho em 1 phần bánh tráng cuốn cắt ${targetSlices} khúc đầy đủ xoài rau răm!`,
          ])
        : pickRandom([
            `Cho em bánh tráng trộn cắt ${targetSlices} khúc, nhiều khô bò ăn quên deadline nha!`,
            `Cuối tháng rồi, trộn ${targetSlices} khúc đầy đủ xoài rau răm giúp em!`,
          ]);
    patienceDrainRate = 0.85;
    baseReward = dishType === 'CUON' ? 42000 : 36000;
    baseXu = 320;
  } else if (customerType === 'NINJA_LEAD') {
    customerLabel = 'Ninja Lead';
    requiredToppings.kho_bo = pickRandom([1, 2]);
    requiredToppings.xoai = 2;
    requiredToppings.rau_ram = 1;
    limeTarget = pickRandom(['IT', 'VUA']);
    chiliTarget = 'NHIEU';
    dialogue =
      dishType === 'CUON'
        ? `Cuốn lẹ rồi cắt ${targetSlices} khúc giùm chị, chị đang bật xi-nhan trái rẽ phải kìa!`
        : pickRandom([
            `Lẹ em ơi! Bánh tráng trộn cắt ${targetSlices} khúc, xe chị dựng ngoài lòng đường kìa!`,
            `Làm nhanh ${targetSlices} khúc cay xé lưỡi cho chị kịp đón con nha em!`,
          ]);
    patienceDrainRate = 1.45;
    maxPatience = 44 - difficulty * 8;
    baseReward = dishType === 'CUON' ? 50000 : 45000;
    baseXu = 400;
  } else if (customerType === 'GEN_Z') {
    if (cursedMenuUnlocked && (!genZUnlocked || Math.random() < 0.7)) {
      isCursedTrend = true;
      dishType = 'TRON';
      customerLabel = 'Reviewer Gen Z (Trend x3)';
      requiredToppings.sau_rieng = 2;
      requiredToppings.tran_chau = 2;
      requiredToppings.nuoc_cot_dua = 2;
      limeTarget = 'IT';
      chiliTarget = 'IT';
      dialogue = `TREND HẮC ÁM! Mix ${targetSlices} khúc Sầu Riêng + Trân Châu + Nước Cốt Dừa trả GẤP 3 giá nha xốp!`;
      patienceDrainRate = 1.0;
      baseReward = 126000; // 3x normal price!
      baseXu = 900;
    } else {
      customerLabel = 'Khách Gen Z (VIP x2)';
      requiredToppings.kho_bo = 2;
      requiredToppings.trung_cut = 1;
      requiredToppings.xoai = 1;
      requiredToppings.pho_mai = pickRandom([2, 3]);
      requiredToppings.tran_chau = pickRandom([2, 3]);
      limeTarget = 'IT';
      chiliTarget = pickRandom(['IT', 'VUA']);
      dialogue =
        dishType === 'CUON'
          ? `Thấy bảng LED xịn quá! Cuốn ${targetSlices} khúc Phô Mai + Trân Châu + Khô Bò trả tiền gấp đôi nè xốp!`
          : `Quán LED chất quá! Làm hộp ${targetSlices} khúc mix Phô Mai + Trân Châu + Xoài trả gấp đôi nha!`;
      patienceDrainRate = 1.05;
      baseReward = 90000;
      baseXu = 700;
    }
  } else {
    customerLabel = 'Dân Văn Phòng';
    requiredToppings.kho_bo = 2;
    requiredToppings.trung_cut = 2;
    requiredToppings.xoai = 1;
    requiredToppings.rau_ram = 1;
    limeTarget = pickRandom(['VUA', 'NHIEU']);
    chiliTarget = 'VUA';
    dialogue =
      dishType === 'CUON'
        ? `Cuốn chắc tay rồi cắt ${targetSlices} khúc vừa ăn cho anh mang lên văn phòng nhé!`
        : pickRandom([
            `Anh trốn sếp xuống mua, cắt ${targetSlices} khúc đều tay hộ anh nhé!`,
            `Cho chị hộp trộn ${targetSlices} khúc chanh vừa, ăn xong còn họp hành nữa em!`,
          ]);
    patienceDrainRate = 1.1;
    baseReward = dishType === 'CUON' ? 48000 : 42000;
    baseXu = 380;
  }

  // Clamp regular non-VIP topping needs to available inventory so player isn't given an impossible order while low on 1 topping
  if (inventory && !isVip && !isCursedTrend) {
    for (const key of ['kho_bo', 'trung_cut', 'xoai', 'rau_ram'] as const) {
      if (requiredToppings[key] > inventory[key]) {
        requiredToppings[key] = inventory[key];
      }
    }
    const totalCore =
      requiredToppings.kho_bo +
      requiredToppings.trung_cut +
      requiredToppings.xoai +
      requiredToppings.rau_ram;
    if (totalCore === 0) {
      for (const key of ['kho_bo', 'trung_cut', 'xoai', 'rau_ram'] as const) {
        if (inventory[key] > 0) {
          requiredToppings[key] = Math.min(2, inventory[key]);
          break;
        }
      }
    }
  }

  let hexagramBoosted = false;
  if (dominantElement && customerType !== 'MUKBANGER') {
    const matchesDom =
      elementTag === dominantElement ||
      (dominantElement === 'WOOD' && requiredToppings.xoai > 0 && requiredToppings.rau_ram > 0) ||
      (dominantElement === 'FIRE' && requiredToppings.kho_bo > 0 && chiliTarget === 'NHIEU') ||
      (dominantElement === 'EARTH' && requiredToppings.trung_cut >= 2) ||
      (dominantElement === 'METAL' && targetSlices >= 5 && requiredToppings.kho_bo > 0) ||
      (dominantElement === 'WATER' && (limeTarget === 'NHIEU' || requiredToppings.tran_chau > 0));

    if (matchesDom) {
      hexagramBoosted = true;
      baseReward = Math.round((baseReward * 1.35) / 1000) * 1000;
      baseXu = Math.round(baseXu * 1.25);
    }
  }

  return {
    id: nextId(),
    dishType,
    customerType,
    customerLabel,
    dialogue,
    targetSlices,
    requiredToppings,
    limeTarget,
    chiliTarget,
    patience: maxPatience,
    maxPatience,
    patienceDrainRate,
    baseReward,
    baseXu,
    isVip,
    isCursedTrend,
    shipperBrand,
    waitAge: 0,
    elementTag,
    elementClashText,
    hexagramBoosted,
    forbiddenToppings,
    forbiddenChili,
    forbiddenLime,
    baziProfile,
    hasTraTacCombo: false,
  };
}
