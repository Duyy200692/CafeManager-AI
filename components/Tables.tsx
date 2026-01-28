import React, { useState } from 'react';
import { AppState } from '../types';
import { formatDateVN } from '../utils/dateUtils';

interface TablesProps {
  data: AppState;
}

export const DataTables: React.FC<TablesProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Filter logic
  const filteredBusinessResults = data.businessResults
    .filter(item => {
       // Check if date matches
       const formattedDate = formatDateVN(item.date);
       return formattedDate.includes(searchTerm) || item.date.includes(searchTerm);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort newest first

  return (
    <div className="space-y-8">
      {/* Business Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
          <h3 className="font-semibold text-slate-800">Chi tiết Kết Quả Kinh Doanh</h3>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Tìm kiếm theo ngày (vd: 15/01)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none w-64"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 absolute left-3 top-2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 001.513 1.513z" />
            </svg>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm text-left text-slate-600 relative">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3">Ngày</th>
                <th className="px-6 py-3 text-right">Doanh thu Net</th>
                <th className="px-6 py-3 text-right">Sáng/Tối</th>
                <th className="px-6 py-3 text-right">Chi phí NVL</th>
                <th className="px-6 py-3 text-right">Hàng Hủy</th>
                <th className="px-6 py-3 text-right">Lợi nhuận</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinessResults.length > 0 ? filteredBusinessResults.map((item, idx) => (
                <tr key={idx} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{formatDateVN(item.date)}</td>
                  <td className="px-6 py-4 text-right text-blue-600 font-medium">{formatCurrency(item.netRevenue)}</td>
                  <td className="px-6 py-4 text-right text-xs">
                    <div className="text-orange-600">S: {formatCurrency(item.morningRevenue)}</div>
                    <div className="text-indigo-600">T: {formatCurrency(item.eveningRevenue)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">{formatCurrency(item.costOfGoodsSold)}</td>
                  <td className="px-6 py-4 text-right text-red-500">{formatCurrency(item.wasteCost)}</td>
                  <td className="px-6 py-4 text-right text-green-600 font-bold">{formatCurrency(item.netProfit)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Không tìm thấy dữ liệu phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};