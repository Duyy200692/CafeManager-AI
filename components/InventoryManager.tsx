import React, { useState, useMemo } from 'react';
import { Material, AppState } from '../types';

interface InventoryManagerProps {
  materials: Material[];
  onUpdateMaterials: (newMaterials: Material[]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ materials, onUpdateMaterials }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Material | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Material>({
    id: 0,
    category: '',
    name: '',
    unit: '',
    price: 0
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Extract unique categories for Filter AND for Autocomplete in Form
  const categories = useMemo(() => {
    const cats = new Set(materials.map(m => m.category));
    return Array.from(cats).sort();
  }, [materials]);

  // Filter logic
  const filteredMaterials = materials.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category for display
  const groupedMaterials = useMemo(() => {
    const groups: { [key: string]: Material[] } = {};
    filteredMaterials.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredMaterials]);

  // --- CRUD Handlers ---

  const handleOpenModal = (item?: Material) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        id: 0,
        category: '',
        name: '',
        unit: '',
        price: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    if (!formData.name || !formData.category || !formData.unit) {
      alert("Vui lòng điền đầy đủ tên, nhóm hàng và đơn vị tính.");
      return;
    }

    let updatedMaterials = [...materials];

    if (editingItem) {
      // Update existing
      updatedMaterials = updatedMaterials.map(m => m.id === editingItem.id ? formData : m);
    } else {
      // Add new
      const maxId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) : 0;
      updatedMaterials.push({ ...formData, id: maxId + 1 });
    }

    onUpdateMaterials(updatedMaterials);
    handleCloseModal();
  };

  const handleDelete = (item: Material) => {
    if (window.confirm(`Bạn có chắc muốn xóa nguyên liệu "${item.name}" không?`)) {
      const updatedMaterials = materials.filter(m => m.id !== item.id);
      onUpdateMaterials(updatedMaterials);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Bảng Giá Nguyên Vật Liệu (Master Data)</h3>
          <p className="text-slate-500 text-sm">Quản lý đơn giá nhập hàng để tính Cost chuẩn xác</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           {/* Category Filter */}
           <select 
             value={selectedCategory}
             onChange={(e) => setSelectedCategory(e.target.value)}
             className="px-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50 min-w-[150px]"
           >
             <option value="All">Tất cả nhóm hàng</option>
             {categories.map(c => (
               <option key={c} value={c}>{c}</option>
             ))}
           </select>

           {/* Search */}
           <div className="relative">
            <input 
              type="text" 
              placeholder="Tìm tên nguyên liệu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none w-full sm:w-64"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 absolute left-3 top-2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 001.513 1.513z" />
            </svg>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Thêm Mới
          </button>
        </div>
      </div>

      {/* Material List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 w-16 text-center">STT</th>
                <th className="px-6 py-3">Tên Nguyên Liệu</th>
                <th className="px-6 py-3 text-center">ĐVT</th>
                <th className="px-6 py-3 text-right">Đơn Giá</th>
                <th className="px-6 py-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.keys(groupedMaterials).length > 0 ? (
                Object.keys(groupedMaterials).map(category => (
                  <React.Fragment key={category}>
                    {/* Category Header Row */}
                    <tr className="bg-orange-50">
                      <td colSpan={5} className="px-6 py-2 font-bold text-orange-800 uppercase text-xs border-y border-orange-100">
                        {category}
                      </td>
                    </tr>
                    {/* Items */}
                    {groupedMaterials[category].map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-3 text-center text-slate-400 text-xs">{item.id}</td>
                        <td className="px-6 py-3 font-medium text-slate-700">{item.name}</td>
                        <td className="px-6 py-3 text-center">
                          <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-slate-800">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => handleOpenModal(item)}
                               className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                               title="Chỉnh sửa"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                             </button>
                             <button 
                               onClick={() => handleDelete(item)}
                               className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                               title="Xóa"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Không tìm thấy nguyên liệu nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingItem ? 'Điều chỉnh Giá / Thông tin' : 'Thêm Nguyên Liệu Mới'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Category Input with Datalist */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhóm Hàng</label>
                <input 
                  list="category-list" 
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Chọn hoặc nhập nhóm mới..."
                />
                <datalist id="category-list">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Nguyên Liệu</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="VD: Cà phê Arabica..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị tính</label>
                  <input 
                    type="text" 
                    name="unit" 
                    value={formData.unit} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Kg, Lit, Hộp..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đơn Giá (VND)</label>
                  <input 
                    type="number" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm transition-colors"
              >
                Lưu Thông Tin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};