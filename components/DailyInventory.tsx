import React, { useState, useMemo, useEffect } from 'react';
import { AppState, Material, DailyInventorySession, InventoryRecord } from '../types';
import { formatDateVN } from '../utils/dateUtils';

interface DailyInventoryProps {
  materials: Material[];
  inventorySessions: DailyInventorySession[];
  onSaveSession: (session: DailyInventorySession) => void;
}

export const DailyInventory: React.FC<DailyInventoryProps> = ({ materials, inventorySessions, onSaveSession }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<number, InventoryRecord>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Initial Data Loading when Date Changes
  useEffect(() => {
    // Check if we already have data for this date
    const existingSession = inventorySessions.find(s => s.date === selectedDate);
    
    if (existingSession) {
      // Load existing records
      const recordMap: Record<number, InventoryRecord> = {};
      existingSession.records.forEach(r => {
        recordMap[r.materialId] = r;
      });
      setRecords(recordMap);
    } else {
      // Initialize new records
      const previousDate = new Date(selectedDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const prevDateStr = previousDate.toISOString().split('T')[0];
      const prevSession = inventorySessions.find(s => s.date === prevDateStr);

      const newRecordMap: Record<number, InventoryRecord> = {};
      materials.forEach(m => {
        newRecordMap[m.id] = {
          materialId: m.id,
          open: prevSession ? (prevSession.records.find(r => r.materialId === m.id)?.close || 0) : 0,
          import: 0,
          close: 0,
          used: 0,
          cost: 0
        };
      });
      setRecords(newRecordMap);
    }
  }, [selectedDate, materials, inventorySessions]);

  const handleInputChange = (materialId: number, field: keyof InventoryRecord, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    
    setRecords(prev => {
      const currentRecord = prev[materialId] || { 
        materialId, open: 0, import: 0, close: 0, used: 0, cost: 0 
      };

      const updatedRecord = { ...currentRecord, [field]: numValue };

      // Recalculate Logic: Used = Open + Import - Close
      if (field === 'open' || field === 'import' || field === 'close') {
        const used = Math.max(0, updatedRecord.open + updatedRecord.import - updatedRecord.close);
        const material = materials.find(m => m.id === materialId);
        const cost = used * (material?.price || 0);
        
        updatedRecord.used = used;
        updatedRecord.cost = cost;
      }

      return { ...prev, [materialId]: updatedRecord };
    });
  };

  const handleSave = () => {
    const recordList = Object.values(records) as InventoryRecord[];
    const totalCost = recordList.reduce((sum, r) => sum + r.cost, 0);

    const session: DailyInventorySession = {
      date: selectedDate,
      records: recordList,
      totalCost
    };

    onSaveSession(session);
    alert(`Đã lưu kiểm kê ngày ${formatDateVN(selectedDate)}.\nTổng chi phí sử dụng: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalCost)}`);
  };

  // Group materials by category for display
  const groupedMaterials = useMemo(() => {
    const groups: { [key: string]: Material[] } = {};
    const filtered = materials.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    filtered.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [materials, searchTerm]);

  const calculateTotalCost = () => {
    return (Object.values(records) as InventoryRecord[]).reduce((sum, r) => sum + r.cost, 0);
  };

  return (
    <div className="space-y-2 md:space-y-6 animate-fade-in h-full flex flex-col">
      {/* Header Controls - Compact on Mobile */}
      <div className="bg-white p-2 md:p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4 shrink-0">
        
        {/* Title Block - Hidden on Mobile to save space */}
        <div className="hidden md:flex items-center gap-4 w-full md:w-auto">
          <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
             </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Kiểm Kê Hàng Ngày (Checklist)</h3>
            <p className="text-xs text-slate-500">Nhập Tồn đầu/Nhập/Tồn cuối để tính Cost</p>
          </div>
        </div>

        {/* Compact Controls Row */}
        <div className="flex gap-2 w-full md:w-auto">
           <input 
             type="date"
             value={selectedDate}
             onChange={(e) => setSelectedDate(e.target.value)}
             className="flex-1 md:flex-none px-2 md:px-4 py-1.5 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700 text-sm"
           />
           <input 
              type="text" 
              placeholder="Tìm món..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 md:flex-none px-2 md:px-4 py-1.5 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
           />
           
           {/* Desktop Save Button */}
           <button 
             onClick={handleSave}
             className="hidden md:block bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-colors"
           >
             Lưu Báo Cáo
           </button>

           {/* Mobile Save Icon Button (Compact) */}
           <button 
             onClick={handleSave}
             className="md:hidden bg-orange-600 text-white p-2 rounded-lg shadow-sm"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
             </svg>
           </button>
        </div>
      </div>

      {/* Sticky Total Cost Banner - Slimmer on Mobile */}
      <div className="bg-slate-900 text-white p-2 md:p-4 rounded-lg md:rounded-xl shadow-lg flex justify-between items-center sticky top-0 z-20">
         <div className="text-xs md:text-sm text-slate-300">Tổng cost ngày:</div>
         <div className="text-lg md:text-2xl font-bold text-orange-400">
           {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotalCost())}
         </div>
      </div>

      {/* Spreadsheet Table - Full Width on Mobile */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 text-[10px] md:text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-2 md:px-4 py-2 md:py-3 border-r border-slate-200 sticky left-0 bg-slate-100 z-20 w-[120px] md:w-auto">Tên Món</th>
                <th className="px-1 md:px-2 py-2 md:py-3 text-center border-r border-slate-200 w-10 md:w-16">ĐVT</th>
                <th className="hidden md:table-cell px-4 py-3 text-right border-r border-slate-200">Đơn Giá</th>
                <th className="px-1 md:px-2 py-2 md:py-3 text-center border-r border-slate-200 w-16 md:w-24 bg-blue-50 text-blue-800">Tồn Đầu</th>
                <th className="px-1 md:px-2 py-2 md:py-3 text-center border-r border-slate-200 w-16 md:w-24 bg-green-50 text-green-800">Nhập</th>
                <th className="px-1 md:px-2 py-2 md:py-3 text-center border-r border-slate-200 w-16 md:w-24 bg-red-50 text-red-800">Tồn Cuối</th>
                <th className="hidden md:table-cell px-4 py-3 text-center border-r border-slate-200 bg-slate-200 font-bold">Đã Dùng</th>
                <th className="hidden md:table-cell px-4 py-3 text-right font-bold text-orange-700">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
              {Object.keys(groupedMaterials).map(category => (
                <React.Fragment key={category}>
                   <tr className="bg-slate-50">
                      <td colSpan={8} className="px-2 md:px-4 py-1.5 md:py-2 font-bold text-slate-800 border-y border-slate-200 text-[10px] md:text-xs uppercase tracking-wider">
                        {category}
                      </td>
                   </tr>
                   {groupedMaterials[category].map(item => {
                     const rec = records[item.id] || { open: 0, import: 0, close: 0, used: 0, cost: 0 };
                     return (
                       <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-2 md:px-4 py-2 border-r border-slate-100 font-medium text-slate-700 sticky left-0 bg-white shadow-[1px_0_5px_-2px_rgba(0,0,0,0.1)] truncate max-w-[120px] md:max-w-none">
                            {item.name}
                            {/* Mobile only: Show unit under name */}
                            <div className="md:hidden text-[9px] text-slate-400 font-normal">{item.unit}</div>
                         </td>
                         <td className="px-1 md:px-2 py-2 border-r border-slate-100 text-center text-slate-500">{item.unit}</td>
                         <td className="hidden md:table-cell px-4 py-2 border-r border-slate-100 text-right text-slate-500">
                           {new Intl.NumberFormat('vi-VN').format(item.price)}
                         </td>
                         
                         {/* Inputs - Maximized Touch Area */}
                         <td className="p-0 border-r border-slate-100">
                           <input 
                             type="number" 
                             min="0"
                             step="0.1"
                             value={rec.open || ''}
                             onChange={(e) => handleInputChange(item.id, 'open', e.target.value)}
                             className="w-full h-full px-1 py-3 md:py-2 text-center outline-none focus:bg-blue-50 focus:ring-inset focus:ring-2 focus:ring-blue-500 font-medium"
                             placeholder="0"
                           />
                         </td>
                         <td className="p-0 border-r border-slate-100">
                           <input 
                             type="number" 
                             min="0"
                             step="0.1"
                             value={rec.import || ''}
                             onChange={(e) => handleInputChange(item.id, 'import', e.target.value)}
                             className="w-full h-full px-1 py-3 md:py-2 text-center outline-none focus:bg-green-50 focus:ring-inset focus:ring-2 focus:ring-green-500 font-medium"
                             placeholder="0"
                           />
                         </td>
                         <td className="p-0 border-r border-slate-100">
                           <input 
                             type="number" 
                             min="0"
                             step="0.1"
                             value={rec.close || ''}
                             onChange={(e) => handleInputChange(item.id, 'close', e.target.value)}
                             className="w-full h-full px-1 py-3 md:py-2 text-center outline-none focus:bg-red-50 focus:ring-inset focus:ring-2 focus:ring-red-500 font-medium"
                             placeholder="0"
                           />
                         </td>

                         {/* Calculated Fields (Hidden on Mobile for Space, or could show small) */}
                         <td className="hidden md:table-cell px-4 py-2 border-r border-slate-100 text-center font-bold bg-slate-50">
                           {Number(rec.used).toFixed(2)}
                         </td>
                         <td className="hidden md:table-cell px-4 py-2 text-right font-bold text-orange-700">
                           {rec.cost > 0 ? new Intl.NumberFormat('vi-VN').format(Math.round(rec.cost)) : '-'}
                         </td>
                       </tr>
                     );
                   })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};