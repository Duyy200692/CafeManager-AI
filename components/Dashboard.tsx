import React, { useMemo, useState } from 'react';
import { AppState, DailyBusinessResult } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { formatShortDateVN, getDayOfWeekVN, formatDateVN } from '../utils/dateUtils';

interface DashboardProps {
  data: AppState;
}

const COLORS = ['#ea580c', '#3b82f6', '#ef4444', '#a855f7', '#fbbf24', '#84cc16'];

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // State for filtering and view mode
  // Fix: Default to CURRENT month instead of hardcoded date
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  
  const [viewMode, setViewMode] = useState<'overview' | 'calendar'>('overview');
  
  // State for Calendar Detail Modal
  const [selectedDayData, setSelectedDayData] = useState<DailyBusinessResult | null>(null);

  // Filter Data based on Selected Month
  const filteredData = useMemo(() => {
    return data.businessResults.filter(item => item.date.startsWith(selectedMonth));
  }, [data.businessResults, selectedMonth]);
  
  // Calculate Summaries based on FILTERED Data
  const summary = useMemo(() => {
    const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const morningRevenue = filteredData.reduce((acc, curr) => acc + curr.morningRevenue, 0);
    const eveningRevenue = filteredData.reduce((acc, curr) => acc + curr.eveningRevenue, 0);
    const discounts = filteredData.reduce((acc, curr) => acc + curr.discounts, 0);
    const netRevenue = filteredData.reduce((acc, curr) => acc + curr.netRevenue, 0);

    const costNVL = filteredData.reduce((acc, curr) => acc + curr.costOfGoodsSold, 0);
    const costImport = filteredData.reduce((acc, curr) => acc + curr.costOfGoodsImport, 0);
    const waste = filteredData.reduce((acc, curr) => acc + curr.wasteCost, 0);

    const staffTotal = filteredData.reduce((acc, curr) => acc + curr.staffTotalCost, 0);
    const operatingTotal = filteredData.reduce((acc, curr) => acc + curr.operatingTotalCost, 0);
    
    const profit = filteredData.reduce((acc, curr) => acc + curr.netProfit, 0);

    // Breakdown for specific line items
    const staffSalary = filteredData.reduce((acc, curr) => acc + curr.staffSalary, 0);
    const staffAllowance = filteredData.reduce((acc, curr) => acc + curr.staffAllowance, 0);
    const marketing = filteredData.reduce((acc, curr) => acc + curr.marketing, 0);
    const consumables = filteredData.reduce((acc, curr) => acc + curr.consumables, 0);

    return { 
      totalRevenue, morningRevenue, eveningRevenue, discounts, netRevenue,
      costNVL, costImport, waste,
      staffTotal, staffSalary, staffAllowance,
      operatingTotal, marketing, consumables,
      profit
    };
  }, [filteredData]);

  const costDistribution = [
    { name: 'NVL (Cost)', value: summary.costNVL },
    { name: 'Nhân sự', value: summary.staffTotal },
    { name: 'Hàng hủy', value: summary.waste },
    { name: 'Vận hành khác', value: summary.operatingTotal },
    { name: 'Lợi nhuận', value: summary.profit > 0 ? summary.profit : 0 },
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatCurrencyCompact = (val: number) => {
    if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val;
  };

  // --- CALENDAR LOGIC ---
  const renderCalendar = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 = Sunday
    
    // Adjust for Monday start: Sun(0) -> 6, Mon(1) -> 0, ...
    const startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = [];
    // Padding for empty cells before start of month
    for (let i = 0; i < startDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="bg-slate-50 border border-slate-100 min-h-[60px] md:min-h-[120px]"></div>);
    }

    // Days with data
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = filteredData.find(item => item.date === dateStr);
      
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      // Determine colors based on profit
      const profitClass = dayData 
        ? (dayData.netProfit >= 0 ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200')
        : 'text-slate-400 bg-white border-slate-100';

      days.push(
        <div 
          key={d} 
          onClick={() => dayData && setSelectedDayData(dayData)}
          className={`border min-h-[60px] md:min-h-[120px] p-1 md:p-2 flex flex-col justify-between relative transition-all 
            ${dayData ? 'cursor-pointer hover:shadow-md hover:border-orange-300' : 'cursor-default bg-slate-50'}
            ${isToday ? 'ring-2 ring-orange-500 z-10' : 'border-slate-100'}
            ${dayData ? profitClass : ''}
          `}
        >
          {/* Day Number */}
          <div className="flex justify-between items-start">
             <span className={`text-[10px] md:text-sm font-semibold w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full 
               ${isToday ? 'bg-orange-600 text-white' : (dayData ? 'bg-white/80' : 'text-slate-400')}
             `}>
               {d}
             </span>
             
             {/* Simple Dot/Badge for Mobile */}
             {dayData && (
                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full md:hidden ${dayData.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
             )}
          </div>
          
          {/* Compact Info */}
          {dayData ? (
            <div className="mt-1 text-right">
              {/* Only show on Desktop/Larger screens */}
              <div className="hidden md:block text-xs text-slate-500 mb-1">
                 Thu: {formatCurrencyCompact(dayData.totalRevenue)}
              </div>
              
              {/* Main Metric (Profit) - Visible on all but simplified */}
              <div className={`text-[10px] md:text-sm font-bold truncate`}>
                 {dayData.netProfit > 0 ? '+' : ''}{formatCurrencyCompact(dayData.netProfit)}
              </div>
              
              {/* Percentage Badge - Desktop only */}
              <div className="hidden md:block mt-1">
                 <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${dayData.netProfit >= 0 ? 'border-green-200 bg-green-100' : 'border-red-200 bg-red-100'}`}>
                   {((dayData.netProfit / dayData.netRevenue) * 100).toFixed(0)}%
                 </span>
              </div>
            </div>
          ) : (
             <div className="flex-1"></div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden select-none">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 bg-slate-900 text-white text-center py-3 text-[10px] md:text-sm font-medium">
          <div>T2</div>
          <div>T3</div>
          <div>T4</div>
          <div>T5</div>
          <div>T6</div>
          <div>T7</div>
          <div className="text-orange-400">CN</div>
        </div>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 bg-slate-50">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 relative">
      {/* --- Control Bar --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 w-full md:w-auto">
           {/* Month Picker */}
           <div className="relative w-full md:w-auto">
             <input 
               type="month" 
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(e.target.value)}
               className="w-full md:w-auto pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium text-slate-700"
             />
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 absolute left-3 top-2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
             </svg>
           </div>
           
           <span className="text-sm text-slate-500 hidden md:inline-block">
             Dữ liệu tháng: <b>{selectedMonth}</b>
           </span>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
           <button 
             onClick={() => setViewMode('overview')}
             className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'overview' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Tổng quan
           </button>
           <button 
             onClick={() => setViewMode('calendar')}
             className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Lịch
           </button>
        </div>
      </div>

      {/* --- KPI Summary (Always Visible) --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-3 md:p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] md:text-sm font-medium uppercase">Doanh Thu Tổng</p>
          <h3 className="text-base md:text-2xl font-bold text-slate-800 mt-1 md:mt-2">{formatCurrencyCompact(summary.totalRevenue)}</h3>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] md:text-sm font-medium uppercase">Doanh Thu NET</p>
          <h3 className="text-base md:text-2xl font-bold text-blue-600 mt-1 md:mt-2">{formatCurrencyCompact(summary.netRevenue)}</h3>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] md:text-sm font-medium uppercase">Chi Phí NVL</p>
          <h3 className="text-base md:text-2xl font-bold text-orange-600 mt-1 md:mt-2">{formatCurrencyCompact(summary.costNVL)}</h3>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] md:text-sm font-medium uppercase">Lợi Nhuận</p>
          <h3 className={`text-base md:text-2xl font-bold mt-1 md:mt-2 ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrencyCompact(summary.profit)}
          </h3>
        </div>
      </div>

      {/* --- Main Content based on View Mode --- */}
      {viewMode === 'calendar' ? (
        <>
          {renderCalendar()}
          <p className="text-center text-xs text-slate-400 mt-2 italic">* Bấm vào ngày để xem chi tiết đầy đủ</p>
        </>
      ) : (
        <>
          {/* Detailed P&L Report Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 md:px-6 md:py-4 bg-slate-900 text-white border-b border-slate-800">
              <h3 className="font-bold text-base md:text-lg">Báo Cáo Kết Quả Kinh Doanh</h3>
              <p className="text-slate-400 text-xs md:text-sm opacity-80">Tổng hợp số liệu tháng {selectedMonth}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] md:text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 md:px-6">Danh mục</th>
                    <th className="px-4 py-3 md:px-6 text-right">Giá trị</th>
                    <th className="px-4 py-3 md:px-6 text-right">% DT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {/* Revenue Section */}
                  <tr className="bg-orange-50 font-bold text-slate-900">
                    <td className="px-4 py-3 md:px-6">1. DOANH THU TỔNG</td>
                    <td className="px-4 py-3 md:px-6 text-right">{formatCurrency(summary.totalRevenue)}</td>
                    <td className="px-4 py-3 md:px-6 text-right">100%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-2 md:px-8 text-slate-600 pl-8 md:pl-10">- Doanh thu Ca Sáng</td>
                    <td className="px-4 py-2 md:px-6 text-right">{formatCurrency(summary.morningRevenue)}</td>
                    <td className="px-4 py-2 md:px-6 text-right opacity-60">
                       {summary.totalRevenue ? ((summary.morningRevenue / summary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-2 md:px-8 text-slate-600 pl-8 md:pl-10">- Doanh thu Ca Tối</td>
                    <td className="px-4 py-2 md:px-6 text-right">{formatCurrency(summary.eveningRevenue)}</td>
                    <td className="px-4 py-2 md:px-6 text-right opacity-60">
                       {summary.totalRevenue ? ((summary.eveningRevenue / summary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                   <tr>
                    <td className="px-6 py-2 md:px-8 text-red-500 pl-8 md:pl-10">- Chiết khấu / Giảm giá</td>
                    <td className="px-4 py-2 md:px-6 text-right text-red-500">({formatCurrency(summary.discounts)})</td>
                    <td className="px-4 py-2 md:px-6 text-right opacity-60">
                       {summary.totalRevenue ? ((summary.discounts / summary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  
                  <tr className="bg-blue-50 font-bold text-blue-900">
                    <td className="px-4 py-3 md:px-6">2. DOANH THU NET</td>
                    <td className="px-4 py-3 md:px-6 text-right">{formatCurrency(summary.netRevenue)}</td>
                    <td className="px-4 py-3 md:px-6 text-right">
                      {summary.totalRevenue ? ((summary.netRevenue / summary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>

                  {/* COGS Section */}
                  <tr className="font-semibold bg-slate-50">
                    <td className="px-4 py-3 md:px-6">3. CHI PHÍ GIÁ VỐN</td>
                    <td className="px-4 py-3 md:px-6 text-right text-orange-700">{formatCurrency(summary.costNVL)}</td>
                    <td className="px-4 py-3 md:px-6 text-right">
                       {summary.netRevenue > 0 ? ((summary.costNVL / summary.netRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                   <tr>
                    <td className="px-6 py-2 md:px-8 text-slate-600 pl-8 md:pl-10 italic">- Thực nhập (Tham khảo)</td>
                    <td className="px-4 py-2 md:px-6 text-right italic text-slate-500">{formatCurrency(summary.costImport)}</td>
                    <td className="px-4 py-2 md:px-6 text-right"></td>
                  </tr>
                   <tr>
                    <td className="px-6 py-2 md:px-8 text-red-600 pl-8 md:pl-10">- Hàng hủy</td>
                    <td className="px-4 py-2 md:px-6 text-right text-red-600">{formatCurrency(summary.waste)}</td>
                    <td className="px-4 py-2 md:px-6 text-right opacity-60">
                      {summary.netRevenue > 0 ? ((summary.waste / summary.netRevenue) * 100).toFixed(2) : 0}%
                    </td>
                  </tr>

                  {/* Staff Section */}
                   <tr className="font-semibold bg-slate-50">
                    <td className="px-4 py-3 md:px-6">4. CHI PHÍ NHÂN SỰ</td>
                    <td className="px-4 py-3 md:px-6 text-right">{formatCurrency(summary.staffTotal)}</td>
                    <td className="px-4 py-3 md:px-6 text-right">
                       {summary.netRevenue > 0 ? ((summary.staffTotal / summary.netRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr>
                     <td className="px-6 py-2 md:px-8 text-slate-600 pl-8 md:pl-10">- Tiền lương</td>
                     <td className="px-4 py-2 md:px-6 text-right">{formatCurrency(summary.staffSalary)}</td>
                     <td className="px-4 py-2 md:px-6 text-right"></td>
                  </tr>
                   <tr>
                     <td className="px-6 py-2 md:px-8 text-slate-600 pl-8 md:pl-10">- Phụ cấp / Thưởng</td>
                     <td className="px-4 py-2 md:px-6 text-right">{formatCurrency(summary.staffAllowance)}</td>
                     <td className="px-4 py-2 md:px-6 text-right"></td>
                  </tr>

                  {/* Operating Section */}
                  <tr className="font-semibold bg-slate-50">
                    <td className="px-4 py-3 md:px-6">5. CHI PHÍ VẬN HÀNH</td>
                    <td className="px-4 py-3 md:px-6 text-right">{formatCurrency(summary.operatingTotal)}</td>
                    <td className="px-4 py-3 md:px-6 text-right">
                       {summary.netRevenue > 0 ? ((summary.operatingTotal / summary.netRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  {summary.marketing > 0 && (
                    <tr>
                      <td className="px-6 py-2 md:px-8 text-slate-600 pl-8 md:pl-10">- Marketing</td>
                      <td className="px-4 py-2 md:px-6 text-right">{formatCurrency(summary.marketing)}</td>
                      <td className="px-4 py-2 md:px-6 text-right"></td>
                    </tr>
                  )}
                   {summary.consumables > 0 && (
                    <tr>
                      <td className="px-6 py-2 md:px-8 text-slate-600 pl-8 md:pl-10">- Vật liệu tiêu hao</td>
                      <td className="px-4 py-2 md:px-6 text-right">{formatCurrency(summary.consumables)}</td>
                      <td className="px-4 py-2 md:px-6 text-right"></td>
                    </tr>
                  )}

                  {/* Net Profit Section */}
                  <tr className="bg-green-50 font-bold text-green-800 text-sm md:text-base border-t-2 border-green-200">
                    <td className="px-4 py-4 md:px-6">6. LỢI NHUẬN RÒNG</td>
                    <td className="px-4 py-4 md:px-6 text-right">{formatCurrency(summary.profit)}</td>
                    <td className="px-4 py-4 md:px-6 text-right">
                       {summary.netRevenue > 0 ? ((summary.profit / summary.netRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4">Cơ cấu Doanh thu (Sáng/Tối)</h3>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      tick={{fontSize: 10}} 
                      tickFormatter={(val) => formatShortDateVN(val)}
                      interval={2} 
                    />
                    <YAxis tickFormatter={(val) => `${val / 1000000}M`} tick={{fontSize: 10}} width={35} />
                    <Tooltip 
                      labelFormatter={(val) => `Ngày: ${formatShortDateVN(val as string)}`}
                      formatter={(val: number) => formatCurrency(val)} 
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Area type="monotone" dataKey="morningRevenue" name="Ca Sáng" stackId="1" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="eveningRevenue" name="Ca Tối" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4">Phân bổ Chi phí & Lợi nhuận</h3>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {costDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px', width: '35%'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- DAY DETAIL MODAL --- */}
      {selectedDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 animate-fade-in">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-4 py-3 md:px-6 md:py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
                 <div>
                    <h3 className="text-base md:text-lg font-bold">Chi Tiết Ngày {formatDateVN(selectedDayData.date)}</h3>
                    <p className="text-slate-400 text-xs">{getDayOfWeekVN(selectedDayData.date)}</p>
                 </div>
                 <button onClick={() => setSelectedDayData(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
              </div>

              <div className="overflow-y-auto p-4 md:p-6 space-y-4">
                 {/* 1. Revenue Block */}
                 <div className="bg-slate-50 p-3 md:p-4 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                       <h4 className="font-bold text-slate-700">1. Doanh Thu</h4>
                       <span className="font-bold text-blue-600 text-base md:text-lg">{formatCurrency(selectedDayData.totalRevenue)}</span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 pl-2 border-l-2 border-slate-200">
                       <div className="flex justify-between">
                          <span>Ca Sáng:</span>
                          <span>{formatCurrency(selectedDayData.morningRevenue)}</span>
                       </div>
                       <div className="flex justify-between">
                          <span>Ca Tối:</span>
                          <span>{formatCurrency(selectedDayData.eveningRevenue)}</span>
                       </div>
                       {selectedDayData.discounts > 0 && (
                          <div className="flex justify-between text-red-500">
                             <span>Giảm giá:</span>
                             <span>-{formatCurrency(selectedDayData.discounts)}</span>
                          </div>
                       )}
                    </div>
                    <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-slate-200">
                       <span>Doanh thu Net:</span>
                       <span className="text-blue-700">{formatCurrency(selectedDayData.netRevenue)}</span>
                    </div>
                 </div>

                 {/* 2. Costs Block */}
                 <div className="bg-slate-50 p-3 md:p-4 rounded-lg border border-slate-100">
                    <h4 className="font-bold text-slate-700 mb-2">2. Chi Phí</h4>
                    <div className="space-y-2 text-sm text-slate-600">
                       <div className="flex justify-between">
                          <span>Giá vốn (NVL):</span>
                          <span className="font-medium text-orange-600">{formatCurrency(selectedDayData.costOfGoodsSold)}</span>
                       </div>
                       {selectedDayData.wasteCost > 0 && (
                          <div className="flex justify-between text-red-500">
                             <span>Hàng hủy:</span>
                             <span>{formatCurrency(selectedDayData.wasteCost)}</span>
                          </div>
                       )}
                       <div className="flex justify-between">
                          <span>Nhân sự:</span>
                          <span className="font-medium">{formatCurrency(selectedDayData.staffTotalCost)}</span>
                       </div>
                       {selectedDayData.operatingTotalCost > 0 && (
                          <div className="flex justify-between">
                             <span>Vận hành khác:</span>
                             <span className="font-medium">{formatCurrency(selectedDayData.operatingTotalCost)}</span>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* 3. Profit Block */}
                 <div className={`p-4 rounded-lg border-2 text-center ${selectedDayData.netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <h4 className="text-sm uppercase text-slate-500 font-bold">Lợi Nhuận Ròng</h4>
                    <div className={`text-2xl font-black mt-1 ${selectedDayData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                       {formatCurrency(selectedDayData.netProfit)}
                    </div>
                    <div className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded-full ${selectedDayData.netProfit >= 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                       Margin: {selectedDayData.netRevenue > 0 ? ((selectedDayData.netProfit / selectedDayData.netRevenue) * 100).toFixed(1) : 0}%
                    </div>
                 </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                 <button 
                   onClick={() => setSelectedDayData(null)}
                   className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-2 rounded-lg hover:bg-slate-100"
                 >
                   Đóng
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};