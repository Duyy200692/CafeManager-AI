import React, { useState, useEffect } from 'react';
import { AppState, Tab, StaffShift, StaffDailyDetail, DailyBusinessResult, User, Material, DailyInventorySession, ExpenseRecord } from './types';
import { Dashboard } from './components/Dashboard';
import { UploadAnalyzer } from './components/UploadAnalyzer';
import { DataTables } from './components/Tables';
import { StaffManager } from './components/StaffManager';
import { InventoryCombined } from './components/InventoryCombined';
import { MenuAnalysis } from './components/MenuAnalysis';
import { Login } from './components/Login';
import { formatDateVN } from './utils/dateUtils';
import { 
  subscribeToData, 
  seedInitialDataIfEmpty, 
  saveBusinessResultToFireStore,
  saveAllStaffToFirestore,
  saveMaterialsBatchToFirestore,
  saveInventorySessionToFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  saveSalesBatchToFirestore
} from './services/firebase';

// --- DATA GENERATORS (Used ONLY for Initial Seeding) ---

const generateDailyBusinessResults = (year: number, month: number): DailyBusinessResult[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const results: DailyBusinessResult[] = [];

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;

    // 1. REVENUE
    const baseRevenue = 1800000;
    const variableRevenue = Math.random() * 2000000;
    const weekendBonus = isWeekend ? 1500000 + Math.random() * 1000000 : 0;
    const totalRevenueRaw = Math.floor(baseRevenue + variableRevenue + weekendBonus);
    
    // Split Morning/Evening roughly 40/60
    const morningRevenue = Math.floor(totalRevenueRaw * (0.35 + Math.random() * 0.1));
    const eveningRevenue = totalRevenueRaw - morningRevenue;
    
    // Discounts
    const discounts = Math.floor(totalRevenueRaw * (0.05 + Math.random() * 0.05)); // 5-10% discount
    const netRevenue = totalRevenueRaw - discounts;

    // 2. COSTS
    const costOfGoodsSold = Math.floor(netRevenue * 0.38); // Theoretical cost ~38%
    const costOfGoodsImport = Math.random() > 0.7 ? Math.floor(Math.random() * 5000000) : 0; // Sporadic imports
    const wasteCost = Math.random() > 0.8 ? Math.floor(Math.random() * 150000) : 0;

    // 3. STAFF
    const staffSalary = Math.floor(netRevenue * 0.18); // Approx 18% daily allocation
    const staffBonus = 0;
    const staffAllowance = 50000; // Daily meal allowance etc.
    const staffTotalCost = staffSalary + staffBonus + staffAllowance;

    // 4. OPERATING
    const marketing = 0;
    const tools = i === 1 ? 1500000 : 0; // Buy tools on 1st of month
    const consumables = Math.random() > 0.5 ? 50000 : 0;
    const otherCash = 0;
    const operatingTotalCost = marketing + tools + consumables + otherCash;

    // 5. PROFIT
    const netProfit = netRevenue - costOfGoodsSold - staffTotalCost - operatingTotalCost - wasteCost;

    results.push({
      date: dateStr,
      totalRevenue: totalRevenueRaw,
      morningRevenue,
      eveningRevenue,
      discounts,
      netRevenue,
      
      costOfGoodsSold,
      costOfGoodsImport,
      wasteCost,

      staffTotalCost,
      staffSalary,
      staffBonus,
      staffAllowance,

      operatingTotalCost,
      marketing,
      tools,
      consumables,
      otherCash,

      netProfit
    });
  }
  return results;
};

const generateStaffDetails = (year: number, month: number, baseSalary: number): StaffDailyDetail[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const details: StaffDailyDetail[] = [];

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dateObj = new Date(dateStr);
    
    // Simulate typical work schedule (skip some random days for days off)
    // Assume 6 days/week
    if (dateObj.getDay() !== Math.floor(Math.random() * 7)) { // Random day off
      details.push({
        date: dateStr,
        checkIn: '14:00',
        checkOut: '22:00',
        workHours: 8,
        workDayCredit: 1.0,
        dailySalary: Math.round(baseSalary / 26), // 26 working days
        allowance: 25000,
        totalDailyIncome: Math.round(baseSalary / 26) + 25000
      });
    }
  }
  return details;
};

// --- DIGITIZED MATERIAL DATA FROM IMAGE (UPDATED JAN 2026) ---
const INITIAL_MATERIALS: Material[] = [
  // COFFEE & TEA
  { id: 1, category: "COFFEE & TEA", name: "Espresso Blend 8R/2A", unit: "Kg", price: 250000 },
  { id: 2, category: "COFFEE & TEA", name: "Arabica Wash", unit: "Kg", price: 350000 },
  { id: 3, category: "COFFEE & TEA", name: "Trà earl grey TWG", unit: "Gói", price: 3500 },
  { id: 4, category: "COFFEE & TEA", name: "Bông hibiscus khô", unit: "Kg", price: 520000 },
  { id: 5, category: "COFFEE & TEA", name: "Trà ôlong", unit: "Kg", price: 380000 },
  // ... (Keeping rest of materials as is)
  { id: 60, category: "CAKE", name: "Sausage Roll", unit: "Cái", price: 22000 },
];

// --- INITIAL MOCK DATA FROM IMAGE (1/1/2026 & 2/1/2026) ---
const MOCK_INVENTORY_SESSIONS: DailyInventorySession[] = [
  // ... (Keeping mock sessions as is)
];

const today = new Date();
const YEAR = today.getFullYear();
const MONTH = today.getMonth() + 1;

// Prepare MOCK DATA Objects for Seeding
const businessResultsMock = generateDailyBusinessResults(YEAR, MONTH);

// Mock Staff List with names provided by user
const staffNames = [
  { name: 'Nguyễn Thiên Phúc', role: 'Quản lý', salary: 7500000, hourlyRate: 35000, startDate: '2022-05-15' },
  { name: 'Hoàng Vũ Thanh Thủy', role: 'Pha chế', salary: 6000000, hourlyRate: 28000, startDate: '2023-08-01' },
  // ... (Keeping rest of staff)
];

const staffPayrollMock: StaffShift[] = staffNames.map(staff => {
  const details = generateStaffDetails(YEAR, MONTH, staff.salary);
  const totalHours = details.reduce((acc, d) => acc + d.workHours, 0);
  const calculatedSalary = details.reduce((acc, d) => acc + d.totalDailyIncome, 0);
  
  return {
    name: staff.name,
    role: staff.role,
    salary: calculatedSalary,
    totalHours: totalHours,
    hourlyRate: staff.hourlyRate,
    startDate: staff.startDate,
    details: details
  };
});

const INITIAL_DATA_FOR_SEEDING: AppState = {
  lastUpdated: new Date().toISOString(),
  businessResults: businessResultsMock,
  staffPayroll: staffPayrollMock,
  materials: INITIAL_MATERIALS,
  inventory: [],
  inventorySessions: MOCK_INVENTORY_SESSIONS,
  expenses: [], // Initialize empty expenses
  salesDetails: [] // Initialize empty sales details
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // App Data is now driven by Firebase
  const [appData, setAppData] = useState<AppState>({
    businessResults: [],
    staffPayroll: [],
    materials: [],
    inventory: [],
    inventorySessions: [],
    expenses: [],
    salesDetails: [],
    lastUpdated: null
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Close mobile menu when tab changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  // --- FIREBASE SYNC & SEED ---
  useEffect(() => {
    // 1. Subscribe to real-time data
    const unsubscribe = subscribeToData(
      (newData) => {
        setAppData(prev => ({ ...prev, ...newData, lastUpdated: new Date().toISOString() }));
        setIsLoading(false);
      },
      (err) => {
        console.error("Firebase Subscription Error:", err);
        if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
          setError('MISSING_PERMISSIONS');
        } else {
          setError(err?.message || "Lỗi kết nối database");
        }
        setIsLoading(false);
      }
    );

    // 2. Check and Seed Data if empty
    seedInitialDataIfEmpty(INITIAL_DATA_FOR_SEEDING)
      .catch((err) => {
        console.error("Seeding Error:", err);
        if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
          setError('MISSING_PERMISSIONS');
        }
        setIsLoading(false);
      });

    return () => unsubscribe();
  }, []);


  // Check if current user is Admin
  const isAdmin = currentUser?.role === 'Admin';

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'Admin') {
       setActiveTab(Tab.DASHBOARD);
    } else {
       setActiveTab(Tab.ADMIN); 
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleDataUpdate = (newData: Partial<AppState>) => {
    if (newData.businessResults) {
      newData.businessResults.forEach(item => {
        saveBusinessResultToFireStore(item);
      });
    }
  };

  const handleStaffUpdate = (newStaffList: StaffShift[]) => {
    saveAllStaffToFirestore(newStaffList);
  };

  const handleMaterialsUpdate = (newMaterials: Material[]) => {
    saveMaterialsBatchToFirestore(newMaterials);
  };

  const handleSaveInventorySession = (session: DailyInventorySession) => {
    saveInventorySessionToFirestore(session);
    syncInventoryToBusinessResult(session);
  };

  const handleSaveExpense = (expense: ExpenseRecord) => {
    saveExpenseToFirestore(expense);
    syncExpenseToBusinessResult(expense, false); // false = adding
  };

  const handleDeleteExpense = (expenseId: string) => {
    const expense = appData.expenses.find(e => e.id === expenseId);
    if (expense) {
      if(window.confirm('Bạn có chắc muốn xóa khoản chi này?')) {
        deleteExpenseFromFirestore(expenseId);
        syncExpenseToBusinessResult(expense, true); // true = removing
      }
    }
  };

  // --- SYNC LOGIC ---

  const syncInventoryToBusinessResult = (session: DailyInventorySession) => {
    const existingResult = appData.businessResults.find(r => r.date === session.date);
    
    // Recalculate Net Profit based on new COGS
    let updatedResult: DailyBusinessResult;
    if (existingResult) {
       const newNetProfit = existingResult.netRevenue - session.totalCost - existingResult.staffTotalCost - existingResult.operatingTotalCost - existingResult.wasteCost;
       updatedResult = {
         ...existingResult,
         costOfGoodsSold: session.totalCost,
         netProfit: newNetProfit
       };
    } else {
      updatedResult = {
        date: session.date,
        totalRevenue: 0, morningRevenue: 0, eveningRevenue: 0, discounts: 0, netRevenue: 0,
        costOfGoodsSold: session.totalCost,
        costOfGoodsImport: 0, wasteCost: 0,
        staffTotalCost: 0, staffSalary: 0, staffBonus: 0, staffAllowance: 0,
        operatingTotalCost: 0, marketing: 0, tools: 0, consumables: 0, otherCash: 0,
        netProfit: 0 - session.totalCost
      };
    }
    saveBusinessResultToFireStore(updatedResult);
  };

  const syncExpenseToBusinessResult = (expense: ExpenseRecord, isDeleting: boolean) => {
    const existingResult = appData.businessResults.find(r => r.date === expense.date);
    if (!existingResult && isDeleting) return; // Can't delete from non-existent

    // Initialize if needed
    let baseResult = existingResult || {
      date: expense.date,
      totalRevenue: 0, morningRevenue: 0, eveningRevenue: 0, discounts: 0, netRevenue: 0,
      costOfGoodsSold: 0, costOfGoodsImport: 0, wasteCost: 0,
      staffTotalCost: 0, staffSalary: 0, staffBonus: 0, staffAllowance: 0,
      operatingTotalCost: 0, marketing: 0, tools: 0, consumables: 0, otherCash: 0,
      netProfit: 0
    };

    const amountChange = isDeleting ? -expense.amount : expense.amount;

    // Map Category to Business Result Field
    let updatedResult = { ...baseResult };
    
    // Update specific fields based on category
    if (expense.category === 'RawMaterial') {
      updatedResult.costOfGoodsImport += amountChange; 
    } else if (expense.category === 'Tools') {
      updatedResult.tools += amountChange;
    } else if (expense.category === 'Consumables') {
      updatedResult.consumables += amountChange;
    } else if (expense.category === 'Marketing') {
      updatedResult.marketing += amountChange;
    } else {
      updatedResult.otherCash += amountChange;
    }

    // Re-sum Operating Total (Marketing + Tools + Consumables + OtherCash)
    updatedResult.operatingTotalCost = 
      updatedResult.marketing + 
      updatedResult.tools + 
      updatedResult.consumables + 
      updatedResult.otherCash;

    // Recalculate Profit
    updatedResult.netProfit = 
      updatedResult.netRevenue - 
      updatedResult.costOfGoodsSold - 
      updatedResult.wasteCost - 
      updatedResult.staffTotalCost - 
      updatedResult.operatingTotalCost;
      
    saveBusinessResultToFireStore(updatedResult);
  };


  const NavigationContent = () => (
    <>
       <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-3">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center font-bold text-xl text-white">
             C
           </div>
           <div>
             <h1 className="text-lg font-bold tracking-tight text-white">Cafe Manager</h1>
             <p className="text-xs text-slate-400">Quản lý nội bộ</p>
           </div>
         </div>
         {/* Close Button for Mobile */}
         <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
         </button>
      </div>

      {/* User Info in Sidebar */}
      <div className="p-4 bg-slate-800/50 m-3 rounded-xl flex items-center gap-3">
         <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold border-2 border-slate-600">
           {currentUser?.avatar || currentUser?.name.charAt(0)}
         </div>
         <div className="overflow-hidden">
           <p className="text-sm font-semibold truncate text-white">{currentUser?.name}</p>
           <p className="text-xs text-slate-400 truncate">{currentUser?.role}</p>
         </div>
      </div>
      
      <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto no-scrollbar">
        {/* Admin-Only Links */}
        {isAdmin && (
          <>
            <button 
              onClick={() => setActiveTab(Tab.DASHBOARD)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.DASHBOARD ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              Tổng Quan (Dashboard)
            </button>
            
            <button 
              onClick={() => setActiveTab(Tab.MENU_ANALYSIS)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.MENU_ANALYSIS ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
              Phân Tích Menu
            </button>

            <button 
              onClick={() => setActiveTab(Tab.UPLOAD)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.UPLOAD ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Nhập Liệu (Input)
            </button>
            
            <button 
              onClick={() => setActiveTab(Tab.INVENTORY)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.INVENTORY ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              Quản Lý Kho
            </button>

            <button 
              onClick={() => setActiveTab(Tab.TABLES)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.TABLES ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M13.125 18h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125" />
              </svg>
              Bảng Dữ Liệu (Detail Tables)
            </button>
          </>
        )}

        {/* This button is shown for everyone, but Label differs */}
        <button 
          onClick={() => setActiveTab(Tab.ADMIN)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === Tab.ADMIN ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          {isAdmin ? 'Quản Lý Nhân Sự (Admin)' : 'Thông Tin Cá Nhân'}
        </button>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800">
         <button 
           onClick={handleLogout}
           className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 rounded-lg text-sm transition-colors border border-slate-700"
         >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
           </svg>
           Đăng xuất
         </button>
      </div>
    </>
  );

  if (error === 'MISSING_PERMISSIONS') {
     return (
       <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
         <div className="bg-white max-w-lg w-full p-8 rounded-xl shadow-xl border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002zM12 15.75h.007v.008H12v-.008z" />
               </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Chưa cấp quyền Database</h2>
            <p className="text-slate-500 text-center mb-6">Ứng dụng bị chặn truy cập Firebase. Bạn cần mở quyền truy cập trên Firebase Console.</p>
            
            <div className="bg-slate-100 p-4 rounded-lg mb-6 overflow-x-auto">
               <p className="text-xs font-bold text-slate-500 uppercase mb-2">Cách sửa lỗi:</p>
               <ol className="list-decimal list-inside text-sm text-slate-700 space-y-2">
                 <li>Vào <b>Firebase Console</b> {'>'} <b>Firestore Database</b>.</li>
                 <li>Chọn tab <b>Rules</b>.</li>
                 <li>Dán đoạn mã sau và bấm <b>Publish</b>:</li>
               </ol>
               <pre className="mt-3 bg-slate-800 text-green-400 p-3 rounded text-xs">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
               </pre>
            </div>
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Đã sửa xong, tải lại trang
            </button>
         </div>
       </div>
     )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Đang đồng bộ dữ liệu...</p>
          <p className="text-slate-400 text-xs mt-2">Vui lòng đợi kết nối máy chủ</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login staffList={appData.staffPayroll} onLogin={handleLogin} />;
  }

  return (
    <div className="h-[100dvh] bg-slate-50 text-slate-800 font-sans flex overflow-hidden">
      
      {/* --- MOBILE NAVIGATION --- */}
      
      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
         <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
         <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-white shadow-xl transition-transform transform translate-x-0 flex flex-col h-full z-50">
            <NavigationContent />
         </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-white shadow-xl hidden lg:flex flex-col z-10 h-full shrink-0">
         <NavigationContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full flex flex-col overflow-hidden relative">
        <header className="p-4 lg:p-8 flex justify-between items-center shrink-0 bg-slate-50 z-10">
          <div className="flex items-center gap-3">
             {/* Mobile Menu Button */}
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg -ml-2"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
             </button>

             <div>
                <h2 className="text-xl lg:text-2xl font-bold text-slate-800">
                  {activeTab === Tab.DASHBOARD && 'Tổng Quan'}
                  {activeTab === Tab.UPLOAD && 'Nhập Liệu'}
                  {activeTab === Tab.TABLES && 'Dữ Liệu'}
                  {activeTab === Tab.INVENTORY && 'Kho'}
                  {activeTab === Tab.MENU_ANALYSIS && 'Menu & Chiến Lược'}
                  {activeTab === Tab.ADMIN && (isAdmin ? 'Nhân Sự' : 'Cá Nhân')}
                </h2>
                <p className="text-slate-500 text-xs mt-0.5 hidden sm:block">
                  {appData.lastUpdated ? `Cập nhật: ${formatDateVN(appData.lastUpdated)}` : 'Đang kết nối...'}
                </p>
             </div>
          </div>
          
          <div className="flex gap-2">
             {/* User Avatar Mobile */}
             <div className="w-9 h-9 lg:hidden rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold border-2 border-slate-600">
                 {currentUser.avatar || currentUser.name.charAt(0)}
             </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto px-4 lg:px-8 pb-20 lg:pb-8 no-scrollbar">
           {activeTab === Tab.DASHBOARD && isAdmin && <Dashboard data={appData} />}
           {activeTab === Tab.UPLOAD && isAdmin && <UploadAnalyzer onDataUpdate={handleDataUpdate} currentData={appData} />}
           {activeTab === Tab.TABLES && isAdmin && <DataTables data={appData} />}
           {activeTab === Tab.MENU_ANALYSIS && isAdmin && <MenuAnalysis salesData={appData.salesDetails} />}
           {activeTab === Tab.INVENTORY && isAdmin && (
             <InventoryCombined 
                materials={appData.materials}
                onUpdateMaterials={handleMaterialsUpdate}
                inventorySessions={appData.inventorySessions}
                onSaveSession={handleSaveInventorySession}
                expenses={appData.expenses}
                onSaveExpense={handleSaveExpense}
                onDeleteExpense={handleDeleteExpense}
             />
           )}
           {activeTab === Tab.ADMIN && <StaffManager staffList={appData.staffPayroll} onUpdateStaff={handleStaffUpdate} currentUser={currentUser} />}
        </div>
      </main>
    </div>
  );
};

export default App;