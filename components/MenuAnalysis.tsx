import React, { useMemo, useState } from 'react';
import { MenuItemSales } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface MenuAnalysisProps {
  salesData: MenuItemSales[];
}

const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export const MenuAnalysis: React.FC<MenuAnalysisProps> = ({ salesData }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // Filter Data by Month
  const filteredData = useMemo(() => {
    return salesData.filter(item => item.date.startsWith(selectedMonth));
  }, [salesData, selectedMonth]);

  // Aggregate Data by Item Name
  const aggregatedItems = useMemo(() => {
    const map = new Map<string, { name: string, quantity: number, revenue: number }>();
    
    filteredData.forEach(item => {
      const existing = map.get(item.itemName) || { name: item.itemName, quantity: 0, revenue: 0 };
      map.set(item.itemName, {
        name: item.itemName,
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.revenue
      });
    });

    const items = Array.from(map.values());
    // Sort by Quantity Descending by default
    return items.sort((a, b) => b.quantity - a.quantity);
  }, [filteredData]);

  const totalQuantity = aggregatedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = aggregatedItems.reduce((sum, item) => sum + item.revenue, 0);

  // Top 5 Best Sellers
  const topItems = aggregatedItems.slice(0, 5);
  
  // Slow Movers (Bottom 5, but Quantity > 0)
  const slowItems = [...aggregatedItems].reverse().slice(0, 5).filter(i => i.quantity > 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h3 className="text-lg font-bold text-slate-800">Phân Tích Menu & Chiến Lược</h3>
           <p className="text-slate-500 text-sm">Theo dõi hiệu quả bán hàng của từng món nước</p>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-sm text-slate-600 font-medium">Tháng:</span>
           <input 
             type="month" 
             value={selectedMonth}
             onChange={(e) => setSelectedMonth(e.target.value)}
             className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700"
           />
        </div>
      </div>

      {aggregatedItems.length === 0 ? (
         <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-200 border-dashed text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2 opacity-50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Chưa có dữ liệu bán hàng chi tiết cho tháng này.</p>
            <p className="text-xs mt-1">Vui lòng vào tab "Nhập Liệu" để thêm danh sách món bán ra.</p>
         </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Chart: Top 5 Best Sellers */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                   <span className="text-orange-500">🔥</span> Top 5 Món Bán Chạy Nhất (Theo Ly)
                </h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topItems} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} interval={0} />
                      <Tooltip formatter={(val: number) => `${val} ly`} />
                      <Bar dataKey="quantity" fill="#ea580c" radius={[0, 4, 4, 0]} barSize={25}>
                         {topItems.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Strategy / Insights Panel */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                <h4 className="font-bold text-slate-700 mb-4">💡 Gợi Ý Chiến Lược</h4>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                   {/* Recommendation 1: Push Slow Movers */}
                   <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <h5 className="font-bold text-blue-800 text-sm mb-1">Đẩy Món Bán Chậm</h5>
                      <p className="text-xs text-blue-700 mb-2">Các món sau đang có doanh số thấp, cần xem lại vị hoặc làm Combo khuyến mãi:</p>
                      <div className="flex flex-wrap gap-2">
                         {slowItems.slice(0, 3).map(item => (
                            <span key={item.name} className="bg-white px-2 py-1 rounded text-xs font-medium text-slate-600 border border-blue-200">
                               {item.name} ({item.quantity} ly)
                            </span>
                         ))}
                      </div>
                   </div>

                   {/* Recommendation 2: Upsell Best Sellers */}
                   <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <h5 className="font-bold text-green-800 text-sm mb-1">Tối Ưu "Ngôi Sao"</h5>
                      <p className="text-xs text-green-700 mb-2">Các món bán chạy nhất. Hãy đảm bảo <b>nguyên liệu luôn đủ</b> và thử tăng size/topping để tăng giá trị đơn hàng:</p>
                      <div className="flex flex-wrap gap-2">
                         {topItems.slice(0, 3).map(item => (
                            <span key={item.name} className="bg-white px-2 py-1 rounded text-xs font-bold text-slate-700 border border-green-200 shadow-sm">
                               {item.name}
                            </span>
                         ))}
                      </div>
                   </div>

                   {/* Recommendation 3: Inventory Warning (Mock Logic) */}
                   <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <h5 className="font-bold text-orange-800 text-sm mb-1">Cảnh Báo Tồn Kho</h5>
                      <p className="text-xs text-orange-700">
                         Nếu các món bán chậm ở trên sử dụng nguyên liệu dễ hỏng (trái cây tươi, sữa...), hãy chạy chương trình <b>Giảm giá 20%</b> hoặc <b>Mua 1 Tặng 1</b> vào khung giờ thấp điểm để đẩy hàng tồn.
                      </p>
                   </div>
                </div>
             </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
               <h4 className="font-bold text-slate-700">Chi Tiết Doanh Số Món ({aggregatedItems.length} món)</h4>
               <div className="text-xs font-medium bg-slate-200 px-3 py-1 rounded-full text-slate-600">
                  Tổng: {totalQuantity} ly • {formatCurrency(totalRevenue)}
               </div>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-500 uppercase text-xs sticky top-0 z-10">
                     <tr>
                        <th className="px-6 py-3 w-16 text-center">#</th>
                        <th className="px-6 py-3">Tên Món</th>
                        <th className="px-6 py-3 text-right">Số Lượng</th>
                        <th className="px-6 py-3 text-right">Doanh Thu</th>
                        <th className="px-6 py-3 text-right">% Đóng Góp</th>
                        <th className="px-6 py-3 text-center">Phân Loại</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {aggregatedItems.map((item, idx) => {
                        const contribution = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                        
                        // Simple Classification Logic
                        let type = 'Bình thường';
                        let typeColor = 'text-slate-500 bg-slate-100';
                        
                        if (idx < 3) {
                           type = 'Best Seller';
                           typeColor = 'text-orange-700 bg-orange-100 font-bold';
                        } else if (idx >= aggregatedItems.length - 5) {
                           type = 'Bán Chậm';
                           typeColor = 'text-red-700 bg-red-100';
                        }

                        return (
                           <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 text-center text-slate-400 text-xs">{idx + 1}</td>
                              <td className="px-6 py-3 font-medium text-slate-800">{item.name}</td>
                              <td className="px-6 py-3 text-right font-bold">{item.quantity}</td>
                              <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(item.revenue)}</td>
                              <td className="px-6 py-3 text-right text-xs text-slate-500">
                                 {contribution.toFixed(1)}%
                                 <div className="w-full bg-slate-200 h-1 mt-1 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{ width: `${contribution}%` }}></div>
                                 </div>
                              </td>
                              <td className="px-6 py-3 text-center">
                                 <span className={`px-2 py-1 rounded text-[10px] uppercase ${typeColor}`}>
                                    {type}
                                 </span>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
