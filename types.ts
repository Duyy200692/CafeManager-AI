
export interface DailyBusinessResult {
  date: string;
  
  // Revenue Breakdown
  totalRevenue: number;      // Doanh thu tổng
  morningRevenue: number;    // Doanh thu ca sáng
  eveningRevenue: number;    // Doanh thu ca tối
  discounts: number;         // Chiết khấu/Giảm giá
  netRevenue: number;        // Doanh thu (NET)

  // COGS / NVL
  costOfGoodsSold: number;   // Chi phí NVL COST (theo công thức %)
  costOfGoodsImport: number; // Chi phí NVL nhập trong tháng
  wasteCost: number;         // Hàng hủy

  // Staff Costs
  staffTotalCost: number;    // Tổng chi phí nhân viên
  staffSalary: number;       // Tiền lương
  staffBonus: number;        // Tiền thưởng
  staffAllowance: number;    // Phụ cấp

  // Operating Expenses
  operatingTotalCost: number; // Tổng chi phí vận hành khác
  marketing: number;          // Chi phí Marketing
  tools: number;              // Chi phí CCDC
  consumables: number;        // Chi phí vật liệu tiêu hao
  otherCash: number;          // Chi phí bằng tiền khác

  netProfit: number;          // Lợi nhuận ròng
}

export interface StaffDailyDetail {
  date: string;
  checkIn: string;    // Giờ vô ca (VD: "14:00")
  checkOut: string;   // Giờ ra ca (VD: "22:00")
  workHours: number;  // Tổng giờ làm
  workDayCredit: number; // Ngày công (VD: 1.0)
  dailySalary: number;   // Lương ngày
  allowance: number;     // Phụ cấp
  totalDailyIncome: number; // Tổng lương ngày (Lương + Phụ cấp)
}

export interface StaffShift {
  name: string;
  totalHours: number;
  salary: number;
  role?: string;
  hourlyRate?: number; // Lương theo giờ (đầu vào)
  startDate?: string;  // Ngày bắt đầu làm việc (YYYY-MM-DD)
  details?: StaffDailyDetail[]; // Danh sách chấm công chi tiết
  offDays?: string[]; // Danh sách ngày nghỉ cố định trong tuần (VD: ['T2', 'CN'])
  dateOfBirth?: string; // Ngày sinh (YYYY-MM-DD)
  phoneNumber?: string; // Số điện thoại
}

// Master Data for Materials
export interface Material {
  id: number;
  category: string;
  name: string;
  unit: string;
  price: number;
}

// Daily Inventory Tracking
export interface InventoryRecord {
  materialId: number;
  open: number;   // Tồn đầu
  import: number; // Nhập trong ngày
  close: number;  // Tồn cuối
  // Calculated
  used: number;   // Đã dùng = Open + Import - Close
  cost: number;   // Thành tiền = Used * Price
}

export interface DailyInventorySession {
  date: string;
  records: InventoryRecord[];
  totalCost: number;
}

export interface InventoryItem {
  name: string;
  unit: string;
  quantityUsed: number;
  totalCost: number;
}

// NEW: Expense Management
export type ExpenseCategory = 'RawMaterial' | 'Tools' | 'Consumables' | 'Marketing' | 'Other';

export interface ExpenseRecord {
  id: string;
  date: string;
  category: ExpenseCategory; // Danh mục: Nguyên liệu, CCDC, Tiêu hao, MKT...
  description: string;       // Chi tiết: Mua đá, mua ly...
  amount: number;            // Số tiền
}

// NEW: Menu Sales Analysis
export interface MenuItemSales {
  id: string; // Composite key: date_itemName
  date: string;
  itemName: string;
  quantity: number;
  revenue: number;
}

export interface AppState {
  businessResults: DailyBusinessResult[];
  staffPayroll: StaffShift[];
  materials: Material[]; // Danh sách bảng giá
  inventory: InventoryItem[];
  inventorySessions: DailyInventorySession[]; // Danh sách các phiếu kiểm kê
  expenses: ExpenseRecord[]; // Danh sách chi tiêu
  salesDetails: MenuItemSales[]; // Chi tiết món bán ra
  lastUpdated: string | null;
}

export interface User {
  name: string;
  role: string;
  avatar?: string;
}

export enum Tab {
  DASHBOARD = 'dashboard',
  UPLOAD = 'upload',
  TABLES = 'tables',
  ADMIN = 'admin',
  INVENTORY = 'inventory',
  MENU_ANALYSIS = 'menu_analysis' // New Tab
}
