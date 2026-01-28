import React, { useState, useEffect } from 'react';
import { analyzeExcelImage } from '../services/geminiService';
import { AppState, DailyBusinessResult, MenuItemSales } from '../types';
import { saveSalesBatchToFirestore } from '../services/firebase';

interface DataEntryProps {
  onDataUpdate: (newData: Partial<AppState>) => void;
  currentData: AppState;
}

export const UploadAnalyzer: React.FC<DataEntryProps> = ({ onDataUpdate, currentData }) => {
  const [mode, setMode] = useState<'upload' | 'manual'>('manual'); // Default to manual for quick entry
  
  // State for AI Upload
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Manual Form
  const [formData, setFormData] = useState<DailyBusinessResult>({
    date: new Date().toISOString().split('T')[0],
    totalRevenue: 0,
    morningRevenue: 0,
    eveningRevenue: 0,
    discounts: 0,
    netRevenue: 0,
    costOfGoodsSold: 0,
    costOfGoodsImport: 0,
    wasteCost: 0,
    staffTotalCost: 0,
    staffSalary: 0,
    staffBonus: 0,
    staffAllowance: 0,
    operatingTotalCost: 0,
    marketing: 0,
    tools: 0,
    consumables: 0,
    otherCash: 0,
    netProfit: 0
  });

  // State for Sales Mix (Menu Items)
  const [salesItems, setSalesItems] = useState<MenuItemSales[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemRev, setNewItemRev] = useState('');

  // --- LOGIC: SYNC FROM EXPENSE LOG & EXISTING DATA ---
  useEffect(() => {
    // This effect runs when the DATE changes or when EXPENSE data changes
    const date = formData.date;

    // 1. Get existing business result for this date (if any)
    const existing = currentData.businessResults.find(r => r.date === date);

    // 2. Calculate Expenses from Expense Log
    const dailyExpenses = currentData.expenses.filter(e => e.date === date);
    
    const marketingSum = dailyExpenses.filter(e => e.category === 'Marketing').reduce((a, b) => a + b.amount, 0);
    const toolsSum = dailyExpenses.filter(e => e.category === 'Tools').reduce((a, b) => a + b.amount, 0);
    const consumablesSum = dailyExpenses.filter(e => e.category === 'Consumables').reduce((a, b) => a + b.amount, 0);
    const otherSum = dailyExpenses.filter(e => e.category === 'Other').reduce((a, b) => a + b.amount, 0);
    const importSum = dailyExpenses.filter(e => e.category === 'RawMaterial').reduce((a, b) => a + b.amount, 0);

    // 3. Load Sales Details if any
    const existingSales = currentData.salesDetails.filter(s => s.date === date);
    setSalesItems(existingSales);

    setFormData(prev => {
      // TypeScript Fix: Use explicit if/else instead of logical OR with objects to prevent 'never' type inference on 'existing'
      const expenseFields = {
        marketing: marketingSum,
        tools: toolsSum,
        consumables: consumablesSum,
        otherCash: otherSum,
        costOfGoodsImport: importSum
      };

      if (existing) {
        return {
          ...prev, // Keep prev to ensure all keys present
          ...existing,
          ...expenseFields
        };
      } else {
        // Reset fields for new date but keep current date and prev structure
        return {
          ...prev,
          date: date,
          totalRevenue: 0,
          morningRevenue: 0,
          eveningRevenue: 0,
          discounts: 0,
          netRevenue: 0,
          costOfGoodsSold: 0,
          wasteCost: 0,
          staffSalary: 0,
          staffBonus: 0,
          staffAllowance: 0,
          staffTotalCost: 0,
          operatingTotalCost: 0,
          netProfit: 0,
          ...expenseFields
        };
      }
    });
  }, [formData.date, currentData.expenses, currentData.businessResults, currentData.salesDetails]);


  // --- LOGIC: AI UPLOAD ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const extractedData = await analyzeExcelImage(base64String);
        
        onDataUpdate(extractedData);
        
        // Also save extracted Sales Details if any
        if (extractedData.salesDetails && extractedData.salesDetails.length > 0) {
           saveSalesBatchToFirestore(extractedData.salesDetails);
        }

        alert("Đã phân tích dữ liệu thành công! Dashboard và Menu Analysis đã được cập nhật.");
      } catch (err: any) {
        setError(err.message || "Có lỗi xảy ra khi phân tích hình ảnh.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- LOGIC: MANUAL FORM ---
  
  useEffect(() => {
    const totalRev = Number(formData.morningRevenue) + Number(formData.eveningRevenue);
    const netRev = totalRev - Number(formData.discounts);
    const staffTotal = Number(formData.staffSalary) + Number(formData.staffBonus) + Number(formData.staffAllowance);
    const opTotal = Number(formData.marketing) + Number(formData.tools) + Number(formData.consumables) + Number(formData.otherCash);
    const profit = netRev - Number(formData.costOfGoodsSold) - Number(formData.wasteCost) - staffTotal - opTotal;

    setFormData(prev => ({
      ...prev,
      totalRevenue: totalRev,
      netRevenue: netRev,
      staffTotalCost: staffTotal,
      operatingTotalCost: opTotal,
      netProfit: profit
    }));
  }, [
    formData.morningRevenue, formData.eveningRevenue, formData.discounts,
    formData.costOfGoodsSold, formData.wasteCost,
    formData.staffSalary, formData.staffBonus, formData.staffAllowance,
    formData.marketing, formData.tools, formData.consumables, formData.otherCash
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'date') {
      setFormData(prev => ({ ...prev, date: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    }
  };

  const handleAddItem = () => {
    if (!newItemName || !newItemQty) return;
    const item: MenuItemSales = {
      id: `${formData.date}-${newItemName.replace(/\s+/g, '_')}-${Date.now()}`,
      date: formData.date,
      itemName: newItemName,
      quantity: parseInt(newItemQty),
      revenue: newItemRev ? parseInt(newItemRev) : 0
    };
    setSalesItems([...salesItems, item]);
    setNewItemName('');
    setNewItemQty('');
    setNewItemRev('');
  };

  const handleDeleteItem = (index: number) => {
    const newItems = [...salesItems];
    newItems.splice(index, 1);
    setSalesItems(newItems);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save Business Results
    onDataUpdate({
      businessResults: [formData]
    });

    // Save Sales Details
    if (salesItems.length > 0) {
      saveSalesBatchToFirestore(salesItems);
    }

    alert(`Đã cập nhật dữ liệu ngày ${formData.date}`);
  };

  return (
    <div className="space-y-6">
      {/* Toggle Tabs */}
      <div className="flex justify-center">
        <div className="bg-slate-200 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setMode('manual')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Nhập Tay (Form)
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${mode === 'upload' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Quét Ảnh (AI)
          </button>
        </div>
      </div>

      {/* --- MODE: MANUAL FORM --- */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
             <h3 className="text-lg font-bold text-slate-800">Cập nhật Kết Quả Kinh Doanh Ngày</h3>
             <input 
               type="date" 
               name="date"
               required
               value={formData.date}
               onChange={handleInputChange}
               className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700"
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Revenue & COGS */}
            <div className="space-y-6">
              {/* Sales Mix Section (NEW) */}
              <section className="bg-white p-4 rounded-lg border-2 border-slate-100 shadow-sm">
                 <h4 className="text-sm font-bold text-slate-800 uppercase mb-3 flex items-center justify-between">
                    <span>Chi Tiết Bán Hàng (Menu Mix)</span>
                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">Mới</span>
                 </h4>
                 <div className="space-y-3">
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         placeholder="Tên món (VD: Bạc xỉu)" 
                         value={newItemName}
                         onChange={(e) => setNewItemName(e.target.value)}
                         className="flex-1 p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-orange-500"
                       />
                       <input 
                         type="number" 
                         placeholder="SL" 
                         value={newItemQty}
                         onChange={(e) => setNewItemQty(e.target.value)}
                         className="w-14 p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-orange-500"
                       />
                       <input 
                         type="number" 
                         placeholder="Tổng tiền (opt)" 
                         value={newItemRev}
                         onChange={(e) => setNewItemRev(e.target.value)}
                         className="w-24 p-2 border rounded text-xs outline-none focus:ring-1 focus:ring-orange-500"
                       />
                       <button type="button" onClick={handleAddItem} className="bg-orange-500 text-white px-3 rounded font-bold text-lg">+</button>
                    </div>
                    
                    {/* List */}
                    <div className="max-h-40 overflow-y-auto border rounded divide-y divide-slate-100">
                       {salesItems.length === 0 && <p className="text-xs text-slate-400 p-2 text-center">Chưa có món nào. Thêm để phân tích.</p>}
                       {salesItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 text-xs">
                             <span>{item.itemName}</span>
                             <div className="flex items-center gap-3">
                                <b>x{item.quantity}</b>
                                <span className="text-slate-500 w-16 text-right">{new Intl.NumberFormat('vi-VN').format(item.revenue)}</span>
                                <button type="button" onClick={() => handleDeleteItem(idx)} className="text-red-500 font-bold">×</button>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </section>

              <section className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h4 className="text-sm font-bold text-blue-700 uppercase mb-3 border-b border-blue-100 pb-2">1. Doanh Thu</h4>
                <div className="space-y-3">
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Ca Sáng</label>
                        <input type="number" name="morningRevenue" value={formData.morningRevenue} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Ca Tối</label>
                        <input type="number" name="eveningRevenue" value={formData.eveningRevenue} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none" placeholder="0" />
                      </div>
                   </div>
                   <div>
                      <label className="text-xs text-slate-500 font-medium">Chiết khấu / Giảm giá</label>
                      <input type="number" name="discounts" value={formData.discounts} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-1 focus:ring-red-500 outline-none text-red-600" placeholder="0" />
                   </div>
                   <div className="flex justify-between items-center pt-2 font-bold">
                      <span className="text-sm">Tổng Doanh Thu Net:</span>
                      <span className="text-blue-600">{new Intl.NumberFormat('vi-VN').format(formData.netRevenue)}</span>
                   </div>
                </div>
              </section>

              <section className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h4 className="text-sm font-bold text-orange-700 uppercase mb-3 border-b border-orange-100 pb-2">2. Giá Vốn & Hàng Hủy</h4>
                <div className="space-y-3">
                   <div>
                      <label className="text-xs text-slate-500 font-medium">Chi phí Nguyên Vật Liệu (Cost - Theo công thức/Kho)</label>
                      <input type="number" name="costOfGoodsSold" value={formData.costOfGoodsSold} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-1 focus:ring-orange-500 outline-none" placeholder="0" />
                   </div>
                   <div>
                      <label className="text-xs text-slate-500 font-medium">Hàng Hủy / Đổ vỡ</label>
                      <input type="number" name="wasteCost" value={formData.wasteCost} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-1 focus:ring-orange-500 outline-none text-red-600" placeholder="0" />
                   </div>
                   <div className="pt-2 border-t border-dashed border-slate-300">
                      <label className="text-xs text-slate-400 font-medium flex justify-between">
                         <span>NVL Nhập (Tự động từ Sổ Chi Tiêu)</span>
                         <span className="text-orange-500 text-[10px] italic">Auto-filled</span>
                      </label>
                      <input type="number" name="costOfGoodsImport" value={formData.costOfGoodsImport} onChange={handleInputChange} className="w-full p-2 border rounded bg-slate-100 text-slate-700 font-bold text-xs" readOnly />
                   </div>
                </div>
              </section>
            </div>

            {/* Right Column: Staff, Ops & Summary */}
            <div className="space-y-6">
              <section className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h4 className="text-sm font-bold text-purple-700 uppercase mb-3 border-b border-purple-100 pb-2">3. Nhân Sự & Vận Hành (Tự Động)</h4>
                 <div className="space-y-3">
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Lương NV (Ngày)</label>
                        <input type="number" name="staffSalary" value={formData.staffSalary} onChange={handleInputChange} className="w-full p-2 border rounded outline-none" placeholder="Nhập tay" />
                      </div>
                      <div>
                         <label className="text-xs text-slate-500 font-medium">Phụ cấp / Thưởng</label>
                         <input type="number" name="staffAllowance" value={formData.staffAllowance} onChange={handleInputChange} className="w-full p-2 border rounded outline-none" placeholder="Nhập tay" />
                      </div>
                   </div>
                   
                   {/* Auto-filled fields from Expenses */}
                   <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 mt-2">
                      <div className="relative">
                        <label className="text-xs text-slate-500 font-medium">Marketing</label>
                        <input type="number" name="marketing" value={formData.marketing} readOnly className="w-full p-2 border rounded outline-none bg-slate-100 font-bold text-slate-700" />
                        <span className="absolute right-2 top-6 text-[9px] text-orange-500">Auto</span>
                      </div>
                      <div className="relative">
                         <label className="text-xs text-slate-500 font-medium">CCDC</label>
                         <input type="number" name="tools" value={formData.tools} readOnly className="w-full p-2 border rounded outline-none bg-slate-100 font-bold text-slate-700" />
                         <span className="absolute right-2 top-6 text-[9px] text-orange-500">Auto</span>
                      </div>
                      <div className="relative">
                         <label className="text-xs text-slate-500 font-medium">Vật liệu tiêu hao</label>
                         <input type="number" name="consumables" value={formData.consumables} readOnly className="w-full p-2 border rounded outline-none bg-slate-100 font-bold text-slate-700" />
                         <span className="absolute right-2 top-6 text-[9px] text-orange-500">Auto</span>
                      </div>
                      <div className="relative">
                         <label className="text-xs text-slate-500 font-medium">Khác (Tiền mặt)</label>
                         <input type="number" name="otherCash" value={formData.otherCash} readOnly className="w-full p-2 border rounded outline-none bg-slate-100 font-bold text-slate-700" />
                         <span className="absolute right-2 top-6 text-[9px] text-orange-500">Auto</span>
                      </div>
                   </div>
                </div>
              </section>

              <section className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                 <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Tổng Kết Ngày</h4>
                 <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                       <span className="opacity-80">Doanh thu Net:</span>
                       <span className="font-bold">{new Intl.NumberFormat('vi-VN').format(formData.netRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-orange-400">
                       <span className="opacity-80">Tổng Chi Phí:</span>
                       <span>- {new Intl.NumberFormat('vi-VN').format(Number(formData.costOfGoodsSold) + Number(formData.wasteCost) + Number(formData.staffTotalCost) + Number(formData.operatingTotalCost))}</span>
                    </div>
                    <div className="border-t border-slate-700 my-2 pt-2 flex justify-between text-xl font-bold">
                       <span>Lợi Nhuận:</span>
                       <span className={formData.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                         {new Intl.NumberFormat('vi-VN').format(formData.netProfit)}
                       </span>
                    </div>
                 </div>
                 <button 
                  type="submit"
                  className="w-full mt-6 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg shadow-lg transition-colors"
                 >
                   Lưu Dữ Liệu
                 </button>
              </section>
            </div>
          </div>
        </form>
      )}

      {/* --- MODE: UPLOAD --- */}
      {mode === 'upload' && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-dashed border-slate-300 text-center animate-fade-in">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            
            <h3 className="text-xl font-semibold text-slate-800">Tải lên hình ảnh báo cáo</h3>
            <p className="text-slate-500">
              Chụp ảnh màn hình file Excel (Kết quả kinh doanh, Bảng lương, <b>Danh sách món bán</b>) và tải lên đây. 
              AI sẽ tự động trích xuất dữ liệu cho bạn.
            </p>

            <label className="relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-white transition duration-300 ease-out border-2 border-orange-500 rounded-lg shadow-md group cursor-pointer bg-orange-500 hover:bg-orange-600">
              <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-orange-600 group-hover:translate-x-0 ease">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </span>
              <span className="absolute flex items-center justify-center w-full h-full text-white transition-all duration-300 transform group-hover:translate-x-full ease">
                {isLoading ? 'Đang phân tích...' : 'Chọn hình ảnh'}
              </span>
              <span className="relative invisible">Chọn hình ảnh</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
                disabled={isLoading}
              />
            </label>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};