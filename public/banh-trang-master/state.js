// Modular Game State & Dish Definitions for "Bánh Tráng Master"

export const MENU_DISHES = {
  TRON: {
    id: 'TRON',
    name: 'Bánh Tráng Trộn',
    subtitle: 'Lắc đều tay — Đừng làm rách bịch!',
    basePrice: 25000,
    gestureHint: 'Giữ chuột & lắc qua lại đều tay (tránh giật quá mạnh gây bục bịch).',
  },
  CUON: {
    id: 'CUON',
    name: 'Bánh Tráng Cuốn',
    subtitle: 'Cuốn ngang chặt tay · Cắt đúng nhịp kéo!',
    basePrice: 28000,
    gestureHint: 'Bước 1: Vuốt ngang trái → phải 3 lần để cuốn chặt. Bước 2: Bấm cắt theo vòng nhịp!',
  },
  NUONG: {
    id: 'NUONG',
    name: 'Bánh Tráng Nướng',
    subtitle: 'Quạt than giữ nhiệt xanh · Xoay bánh kẻo khét!',
    basePrice: 32000,
    gestureHint: 'Vuốt lên/xuống bên quạt than giữ nhiệt vùng XANH · Click lên mặt bánh để xoay 90°!',
  },
};

export const SAUCE_INGREDIENTS = [
  {
    id: 'broth',
    name: 'Nước Dầm Bò',
    unit: 'ml',
    stepPerClick: 5,
    color: '#92400e',
    accent: '#f59e0b',
    note: 'Tạo vị đậm đà (quá nhiều sẽ bị mặn!)',
  },
  {
    id: 'chili',
    name: 'Sa Tế Ớt Rim',
    unit: 'ml',
    stepPerClick: 4,
    color: '#b91c1c',
    accent: '#ef4444',
    note: 'Tạo màu đỏ óng & cay nồng',
  },
  {
    id: 'tamarind',
    name: 'Nước Cốt Me',
    unit: 'ml',
    stepPerClick: 5,
    color: '#713f12',
    accent: '#eab308',
    note: 'Chua thanh cân bằng vị béo',
  },
];

export function createInitialGameState() {
  return {
    day: 1,
    clockMinutes: 8 * 60, // Starts at 08:00 AM
    money: 50000,
    reputation: 4.5, // 0.0 .. 5.0
    ordersServed: 0,
    activeMode: 'SAUCE', // 'SAUCE' | 'TRON' | 'CUON' | 'NUONG'
    sauceBuff: 'NONE', // 'NONE' | 'DELICIOUS' | 'TOO_SALTY'
    sauceSummary: 'Chưa nấu nồi sốt hôm nay',
    packagingLevel: 1, // Placeholder hook for Step 2 (1: Plastic+Band, 2: Ziplock, 3: Eco Box)
    lastFeedback: null,
  };
}

export function formatClock(totalMinutes) {
  const mins = Math.floor(totalMinutes) % (24 * 60);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatVnd(amount) {
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}
