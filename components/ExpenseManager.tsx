import React, { useState, useMemo } from 'react';
import { ExpenseRecord, ExpenseCategory } from '../types';
import { formatDateVN } from '../utils/dateUtils';

interface ExpenseManagerProps {
  expenses: ExpenseRecord[];
  onSaveExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: 'RawMaterial', label: 'Nguyên liệu (Pha chế/Trái cây)', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'Tools', label: 'CCDC (Công cụ dụng cụ)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Consumables', label: 'Vật liệu tiêu hao (Ly, bao bì...)', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'Marketing', label: 'Marketing', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'Other', label: 'Khác', color: 'bg-slate-50 text-slate-700 border-slate-200' }
];

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, onSaveExpense, onDeleteExpense }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Form State
  const [category, setCategory] = useState<ExpenseCategory>('RawMaterial');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Filter expenses for selected date
  const dailyExpenses = useMemo(() => {
    return expenses.filter(e => e.date === selectedDate);
  }, [expenses, selectedDate]);

  const totalDailyExpense = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      alert("Vui lòng nhập nội dung chi và số tiền.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Số tiền không hợp lệ.");
      return;
    }

    const newExpense: ExpenseRecord = {
      id: `${selectedDate}-${Date.now()}`,
      date: selectedDate,
      category,
      description,
      amount: numAmount
    };

    onSaveExpense(newExpense);
    
    // Reset form but keep category
    setDescription('');
    setAmount('');
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in h-full flex flex-col">
       {/* Header Controls */}
       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
             <div className="bg-rose-100 p-2 rounded-lg text-rose-600 hidden md:block">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </div>
             <div>
               <h3 className="font-bold text-slate-800 text-lg text-center md:text-left">Sổ Chi Tiêu</h3>
               <p className="text-xs text-slate-500 hidden md:block">Ghi nhận các khoản chi mua ngoài, phát sinh</p>
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
             <input 
               type="date"
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-700 w-full md:w-auto text-center md:text-left"
             />
             <div className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm whitespace-nowrap w-full md:w-auto justify-between md:justify-start">
                <span className="text-xs text-slate-400 uppercase font-normal">Tổng chi:</span>
                <span className="text-rose-400">{formatCurrency(totalDailyExpense)}</span>
             </div>
          </div>
       </div>

       <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden min-h-0">
          {/* LEFT: Input Form */}
          <div className="w-full lg:w-1/3 shrink-0">
             <form onSubmit={handleSubmit} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                <h4 className="font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Thêm Khoản Chi Mới</h4>
                
                <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-600 mb-1">Danh mục</label>
                     <select 
                       value={category}
                       onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50 text-sm"
                     >
                       {EXPENSE_CATEGORIES.map(cat => (
                         <option key={cat.value} value={cat.value}>{cat.label}</option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-slate-600 mb-1">Nội dung / Diễn giải</label>
                     <input 
                       type="text" 
                       value={description}
                       onChange={(e) => setDescription(e.target.value)}
                       placeholder="VD: Mua thêm đá bi, Mua sáp thơm..."
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-slate-600 mb-1">Số tiền (VND)</label>
                     <input 
                       type="number" 
                       value={amount}
                       onChange={(e) => setAmount(e.target.value)}
                       placeholder="0"
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-rose-600 text-lg text-right"
                     />
                   </div>

                   <button 
                     type="submit"
                     className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-2"
                   >
                     Lưu Khoản Chi
                   </button>
                </div>
             </form>
          </div>

          {/* RIGHT: List */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
             <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
               <h4 className="font-bold text-slate-700">Chi Tiết Trong Ngày {formatDateVN(selectedDate)}</h4>
             </div>
             
             <div className="overflow-y-auto flex-1 p-0 no-scrollbar">
                {dailyExpenses.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10">
                      <tr>
                         <th className="px-4 py-3 font-medium text-xs uppercase">Danh mục</th>
                         <th className="px-4 py-3 font-medium text-xs uppercase">Nội dung</th>
                         <th className="px-4 py-3 font-medium text-xs uppercase text-right">Số tiền</th>
                         <th className="px-4 py-3 font-medium text-xs uppercase text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dailyExpenses.map(expense => {
                        const catInfo = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
                        return (
                          <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-4 py-3 align-top">
                               <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold border ${catInfo?.color}`}>
                                 {catInfo?.label.split(' (')[0]}
                               </span>
                             </td>
                             <td className="px-4 py-3 text-slate-700 align-top font-medium">
                               {expense.description}
                             </td>
                             <td className="px-4 py-3 text-right font-bold text-slate-800 align-top">
                               {formatCurrency(expense.amount)}
                             </td>
                             <td className="px-4 py-3 text-center align-top">
                               <button 
                                 onClick={() => onDeleteExpense(expense.id)}
                                 className="text-slate-400 hover:text-red-500 transition-colors"
                                 title="Xóa"
                               >
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                 </svg>
                               </button>
                             </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-2 opacity-50">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p>Chưa có khoản chi nào trong ngày này.</p>
                  </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};
