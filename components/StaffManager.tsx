import React, { useState, useEffect } from 'react';
import { StaffShift, StaffDailyDetail, User } from '../types';
import { formatDateVN, getDayOfWeekVN } from '../utils/dateUtils';

interface StaffManagerProps {
  staffList: StaffShift[];
  onUpdateStaff: (newStaffList: StaffShift[]) => void;
  currentUser: User;
}

const DAYS_OF_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const StaffManager: React.FC<StaffManagerProps> = ({ staffList, onUpdateStaff, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // State for Attendance Form (Chấm công)
  const [isAttendanceFormOpen, setIsAttendanceFormOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    checkIn: '07:00',
    checkOut: '15:00',
    allowance: 0
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [viewDetailStaff, setViewDetailStaff] = useState<StaffShift | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailSearchTerm, setDetailSearchTerm] = useState(''); // Search for detail modal
  
  // Form State for Staff Edit
  const [formData, setFormData] = useState<StaffShift>({
    name: '',
    role: '',
    totalHours: 0,
    salary: 0,
    hourlyRate: 0,
    startDate: '',
    offDays: [],
    dateOfBirth: '',
    phoneNumber: ''
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Check if current user is Admin
  const isAdmin = currentUser.role === 'Admin';

  // Effect to Auto-Select current user for Non-Admins
  useEffect(() => {
    if (!isAdmin) {
      const myProfile = staffList.find(s => s.name === currentUser.name);
      if (myProfile) {
        setViewDetailStaff(myProfile);
      }
    }
  }, [isAdmin, currentUser, staffList]);

  // Filter Staff List
  const filteredStaffList = staffList.filter(staff => 
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (staff.role && staff.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter Details in Modal
  const filteredDetails = viewDetailStaff?.details?.filter(detail => {
    if (!detailSearchTerm) return true;
    const searchLower = detailSearchTerm.toLowerCase();
    const dateStr = formatDateVN(detail.date).toLowerCase();
    const dayStr = getDayOfWeekVN(detail.date).toLowerCase();
    const incomeStr = detail.totalDailyIncome.toString();
    
    return dateStr.includes(searchLower) || 
           dayStr.includes(searchLower) || 
           incomeStr.includes(searchLower);
  }) || [];

  // Sort details by date descending
  const sortedDetails = [...filteredDetails].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- Tenure Calculation Helper ---
  const calculateTenure = (startDateStr?: string) => {
    if (!startDateStr) return null;
    const start = new Date(startDateStr);
    const now = new Date();
    
    let months = (now.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += now.getMonth();
    
    if (months <= 0) return { label: 'Thử việc', months: 0, color: 'bg-yellow-100 text-yellow-800' };
    if (months < 2) return { label: 'Thử việc', months, color: 'bg-yellow-100 text-yellow-800' };
    
    if (months < 12) {
      return { label: `${months} tháng`, months, color: 'bg-blue-100 text-blue-800' };
    }
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    let label = `${years} năm`;
    if (remainingMonths > 0) label += ` ${remainingMonths} tháng`;
    
    return { label, months, color: 'bg-purple-100 text-purple-800' };
  };

  const handleOpenModal = (index: number | null = null) => {
    if (index !== null) {
      setEditingIndex(index);
      const staff = staffList[index];
      const calculatedRate = staff.hourlyRate !== undefined 
        ? staff.hourlyRate 
        : (staff.totalHours > 0 ? Math.round(staff.salary / staff.totalHours) : 0);

      setFormData({
        ...staff,
        hourlyRate: calculatedRate,
        startDate: staff.startDate || '',
        offDays: staff.offDays || [],
        dateOfBirth: staff.dateOfBirth || '',
        phoneNumber: staff.phoneNumber || ''
      });
    } else {
      setEditingIndex(null);
      setFormData({ 
        name: '', role: '', totalHours: 0, salary: 0, hourlyRate: 0, startDate: '', 
        offDays: [], dateOfBirth: '', phoneNumber: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenDetailModal = (staff: StaffShift) => {
    setViewDetailStaff(staff);
    setDetailSearchTerm(''); 
    setIsDetailModalOpen(true);
    setIsAttendanceFormOpen(false); 
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setViewDetailStaff(null);
  };

  const handleSave = () => {
    if (!formData.name) {
      alert("Vui lòng nhập tên nhân viên");
      return;
    }

    const updatedList = [...staffList];
    if (editingIndex !== null) {
      updatedList[editingIndex] = formData;
    } else {
      updatedList.push(formData);
    }

    onUpdateStaff(updatedList);
    handleCloseModal();
  };

  const handleDelete = (index: number) => {
    if (window.confirm(`Bạn có chắc muốn xóa nhân viên ${staffList[index].name}?`)) {
      const updatedList = staffList.filter((_, i) => i !== index);
      onUpdateStaff(updatedList);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      // String fields
      if (['name', 'role', 'startDate', 'dateOfBirth', 'phoneNumber'].includes(name)) {
        return { ...prev, [name]: value };
      }
      
      // Numeric fields
      const numValue = value === '' ? 0 : Number(value);
      const newData = { ...prev, [name]: numValue };

      if (name === 'hourlyRate') {
        newData.salary = numValue * (prev.totalHours || 0);
      } else if (name === 'totalHours') {
        newData.salary = (prev.hourlyRate || 0) * numValue;
      } 

      return newData;
    });
  };

  // Handle Off Day Toggling
  const handleOffDayToggle = (day: string) => {
    setFormData(prev => {
      const currentDays = prev.offDays || [];
      let newDays;
      if (currentDays.includes(day)) {
        newDays = currentDays.filter(d => d !== day);
      } else {
        newDays = [...currentDays, day];
      }
      // Sort days for display (T2, T3 ... CN)
      newDays.sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));
      return { ...prev, offDays: newDays };
    });
  };

  // --- ATTENDANCE HANDLERS ---
  const handleAttendanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAttendanceData(prev => ({
      ...prev,
      [name]: name === 'allowance' ? Number(value) : value
    }));
  };

  const handleSaveAttendance = () => {
    if (!viewDetailStaff) return;

    // 1. Calculate Hours
    const start = new Date(`2000-01-01T${attendanceData.checkIn}`);
    const end = new Date(`2000-01-01T${attendanceData.checkOut}`);
    
    let diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; 
    const hours = diffMs / (1000 * 60 * 60);
    
    // 2. Calculate Pay
    const rate = viewDetailStaff.hourlyRate || 0;
    const pay = Math.round(hours * rate);
    const totalDaily = pay + attendanceData.allowance;

    // 3. Create Record
    const newDetail: StaffDailyDetail = {
      date: attendanceData.date,
      checkIn: attendanceData.checkIn,
      checkOut: attendanceData.checkOut,
      workHours: Number(hours.toFixed(2)),
      workDayCredit: hours >= 8 ? 1.0 : Number((hours / 8).toFixed(2)),
      dailySalary: pay,
      allowance: attendanceData.allowance,
      totalDailyIncome: totalDaily
    };

    // 4. Update Staff Object
    let currentDetails = viewDetailStaff.details ? [...viewDetailStaff.details] : [];
    
    const existingIndex = currentDetails.findIndex(d => d.date === attendanceData.date);
    if (existingIndex >= 0) {
      if(!window.confirm(`Đã có dữ liệu chấm công ngày ${formatDateVN(attendanceData.date)}. Bạn có muốn ghi đè?`)) {
        return;
      }
      currentDetails[existingIndex] = newDetail;
    } else {
      currentDetails.push(newDetail);
    }
    
    const newTotalHours = currentDetails.reduce((sum, d) => sum + d.workHours, 0);
    const newTotalSalary = currentDetails.reduce((sum, d) => sum + d.totalDailyIncome, 0);

    const updatedStaff: StaffShift = {
      ...viewDetailStaff,
      details: currentDetails,
      totalHours: newTotalHours,
      salary: newTotalSalary
    };

    const updatedList = staffList.map(s => s.name === viewDetailStaff.name ? updatedStaff : s);
    onUpdateStaff(updatedList);
    setViewDetailStaff(updatedStaff);
    setIsAttendanceFormOpen(false);
  };

  // --- RENDER CONTENT COMPONENT (To reuse between Modal and Non-Admin View) ---
  const renderDetailContent = () => (
    <div className="flex-1 bg-slate-50 p-4 md:p-8 flex flex-col min-h-0 relative h-full">
       <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
          {/* Card Title (Fixed) */}
          <div className="px-6 py-4 border-b border-slate-100 bg-white rounded-t-lg shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
               <h3 className="font-bold text-slate-800">Chi tiết chấm công</h3>
               
               {/* BUTTON CHẤM CÔNG */}
               <button 
                 onClick={() => setIsAttendanceFormOpen(true)}
                 className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors w-full sm:w-auto"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Chấm công
               </button>
            </div>

            <div className="relative w-full sm:w-auto">
               <input 
                 type="text" 
                 placeholder="Tìm ngày..." 
                 value={detailSearchTerm}
                 onChange={(e) => setDetailSearchTerm(e.target.value)}
                 className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-56"
               />
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400 absolute left-3 top-2">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 001.513 1.513z" />
               </svg>
             </div>
          </div>

          {/* ATTENDANCE FORM (OVERLAY) */}
          {isAttendanceFormOpen && (
            <div className="bg-slate-50 border-b border-slate-200 p-4 animate-fade-in">
              <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase">Ghi nhận giờ làm việc</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                 <div className="col-span-2 md:col-span-1">
                   <label className="block text-xs font-medium text-slate-500 mb-1">Ngày làm việc</label>
                   <input 
                     type="date" 
                     name="date"
                     value={attendanceData.date}
                     onChange={handleAttendanceChange}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Giờ Vào (In)</label>
                   <input 
                     type="time" 
                     name="checkIn"
                     value={attendanceData.checkIn}
                     onChange={handleAttendanceChange}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Giờ Ra (Out)</label>
                   <input 
                     type="time" 
                     name="checkOut"
                     value={attendanceData.checkOut}
                     onChange={handleAttendanceChange}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                   />
                 </div>
                  <div className="col-span-2 md:col-span-1">
                   <label className="block text-xs font-medium text-slate-500 mb-1">Phụ cấp (nếu có)</label>
                   <input 
                     type="number" 
                     name="allowance"
                     value={attendanceData.allowance}
                     onChange={handleAttendanceChange}
                     placeholder="0"
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                   />
                 </div>
                 <div className="col-span-2 md:col-span-1 flex gap-2">
                    <button 
                      onClick={handleSaveAttendance}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-sm"
                    >
                      Lưu
                    </button>
                    <button 
                      onClick={() => setIsAttendanceFormOpen(false)}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-sm"
                    >
                      Hủy
                    </button>
                 </div>
              </div>
            </div>
          )}
          
          {/* Table Scroll Container */}
          <div className="flex-1 overflow-auto relative rounded-b-lg">
            <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-30 shadow-sm">
                <tr>
                  <th className="px-6 py-3 bg-slate-50 sticky left-0 z-50 border-r border-slate-200 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.1)]">Ngày</th>
                  <th className="px-6 py-3 bg-slate-50 border-r border-slate-100">Thứ</th>
                  <th className="px-6 py-3 bg-slate-50 border-r border-slate-100">Ca làm (Vào - Ra)</th>
                  <th className="px-6 py-3 text-right bg-slate-50 border-r border-slate-100">Giờ làm</th>
                  <th className="px-6 py-3 text-right bg-slate-50 border-r border-slate-100">Ngày Công</th>
                  <th className="px-6 py-3 text-right bg-slate-50 border-r border-slate-100">Lương CB</th>
                  <th className="px-6 py-3 text-right bg-slate-50 border-r border-slate-100">Phụ cấp</th>
                  <th className="px-6 py-3 text-right font-bold bg-slate-50">Tổng ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedDetails.length > 0 ? (
                  sortedDetails.map((detail, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                      {/* DETAIL TABLE STICKY COLUMN FIXED */}
                      <td className="px-6 py-4 font-medium text-slate-900 sticky left-0 z-40 bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.1)] transition-colors">
                          {formatDateVN(detail.date)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs border-r border-slate-50">{getDayOfWeekVN(detail.date)}</td>
                      <td className="px-6 py-4 text-slate-600 border-r border-slate-50">
                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold mr-2">{detail.checkIn}</span>
                        <span className="text-slate-400">→</span>
                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold ml-2">{detail.checkOut}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium border-r border-slate-50">{detail.workHours}h</td>
                      <td className="px-6 py-4 text-right border-r border-slate-50">{detail.workDayCredit}</td>
                      <td className="px-6 py-4 text-right text-slate-600 border-r border-slate-50">{formatCurrency(detail.dailySalary)}</td>
                      <td className="px-6 py-4 text-right text-slate-600 border-r border-slate-50">{formatCurrency(detail.allowance)}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(detail.totalDailyIncome)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                        {detailSearchTerm ? 'Không tìm thấy ngày phù hợp.' : 'Chưa có dữ liệu chấm công. Hãy bấm "Chấm công" để thêm.'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
       </div>
    </div>
  );

  // === RENDER FOR NON-ADMIN (STAFF VIEW) ===
  if (!isAdmin) {
    if (!viewDetailStaff) {
       return <div className="p-8 text-center text-slate-500">Không tìm thấy thông tin nhân viên cho tài khoản này.</div>;
    }
    const tenure = calculateTenure(viewDetailStaff.startDate);
    return (
       <div className="bg-white rounded-xl shadow-2xl w-full h-full flex flex-col overflow-hidden animate-fade-in border border-slate-200">
          {/* Header */}
           <div className="px-8 py-6 bg-slate-800 text-white flex justify-between items-center shrink-0">
             <div>
               <div className="flex items-center gap-3">
                 <h2 className="text-2xl font-bold">{viewDetailStaff.name}</h2>
                 {tenure && (
                   <span className={`text-xs px-2 py-0.5 rounded font-bold ${tenure.color.replace('bg-', 'bg-white/20 ').replace('text-', 'text-white ')}`}>
                     {tenure.label}
                   </span>
                 )}
               </div>
               <div className="flex flex-col gap-2 mt-2">
                 <p className="text-slate-400 text-sm">
                   {viewDetailStaff.role || 'Nhân viên'} 
                   {viewDetailStaff.startDate && ` • Vào làm: ${formatDateVN(viewDetailStaff.startDate)}`}
                 </p>
                 
                 {/* Personal Info Row */}
                 <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                   {viewDetailStaff.dateOfBirth && (
                     <span className="flex items-center gap-1.5 bg-slate-700/50 px-2 py-1 rounded">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-pink-400">
                         <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.189a1 1 0 011.892.632l-1.18 2.214a3 3 0 011.635 2.715V17a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4H5v4a1 1 0 01-1 1H2a1 1 0 01-1-1v-8.723a3 3 0 011.635-2.715l-1.18-2.214a1 1 0 111.892-.632l1.699 3.189L9 4.323V3a1 1 0 011-1zm-8 7v2h14V9H2z" clipRule="evenodd" />
                       </svg>
                       {formatDateVN(viewDetailStaff.dateOfBirth)}
                     </span>
                   )}
                   {viewDetailStaff.phoneNumber && (
                     <span className="flex items-center gap-1.5 bg-slate-700/50 px-2 py-1 rounded">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-400">
                         <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                       </svg>
                       {viewDetailStaff.phoneNumber}
                     </span>
                   )}
                 </div>

                 <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                   <span>Tổng giờ: <span className="text-white font-medium">{viewDetailStaff.totalHours.toFixed(1)}h</span></span>
                   <span>•</span>
                   <span>Lương: <span className="text-green-400 font-bold">{formatCurrency(viewDetailStaff.salary)}</span></span>
                 </p>
                 {viewDetailStaff.offDays && viewDetailStaff.offDays.length > 0 && (
                   <p className="text-orange-400 text-sm font-medium flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                     </svg>
                     Lịch nghỉ cố định: {viewDetailStaff.offDays.join(', ')}
                   </p>
                 )}
               </div>
             </div>
             <div className="bg-slate-700 px-3 py-1 rounded-full text-xs text-slate-300">
               Chế độ xem cá nhân
             </div>
           </div>
           
           {/* Re-use content renderer */}
           {renderDetailContent()}
       </div>
    );
  }

  // === RENDER FOR ADMIN (LIST VIEW) ===
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Danh Sách Nhân Sự</h3>
          <p className="text-slate-500 text-sm">Quản lý thông tin và lương nhân viên</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Tìm kiếm nhân viên..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none w-full md:w-64"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 absolute left-3 top-2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 001.513 1.513z" />
            </svg>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap w-full md:w-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Thêm Nhân Viên
          </button>
        </div>
      </div>

      {/* SINGLE CONTAINER for Table - Fixes Double Scrollbar & Sticky Overlap */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
          <table className="min-w-full text-sm text-left text-slate-600 whitespace-nowrap border-collapse">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                {/* STICKY HEADER - Solid Background & High Z-Index */}
                <th className="px-6 py-4 sticky left-0 z-30 bg-slate-50 border-r border-slate-200 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.1)]">
                  Tên Nhân Viên
                </th>
                <th className="px-6 py-4">Chức vụ</th>
                <th className="px-6 py-4">Ngày vào làm / Thâm niên</th>
                <th className="px-6 py-4 text-right">Giờ công</th>
                <th className="px-6 py-4 text-right">Lương thực nhận</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaffList.length > 0 ? filteredStaffList.map((item, idx) => {
                const tenure = calculateTenure(item.startDate);
                return (
                <tr key={idx} className="bg-white border-b hover:bg-slate-50 transition-colors group">
                  {/* STICKY COLUMN FIXED - Removed flex from TD, solid BG, Z-20 */}
                  <td className="px-6 py-4 sticky left-0 z-20 bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-[2px_0_10px_-2px_rgba(0,0,0,0.1)] transition-colors">
                     <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleOpenDetailModal(item)}>
                        <div className="flex flex-col">
                          <span className="truncate max-w-[120px] sm:max-w-none font-medium text-slate-900 group-hover:text-orange-600 transition-colors">
                            {item.name}
                          </span>
                          {/* Show Off Days in List View as well */}
                          {item.offDays && item.offDays.length > 0 && (
                             <span className="text-[10px] text-orange-600 font-medium">Off: {item.offDays.join(', ')}</span>
                          )}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 group-hover:text-orange-500 shrink-0">
                          <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                          <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full border border-slate-200">
                      {item.role || 'Nhân viên'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.startDate ? (
                      <div className="flex flex-col">
                        <span className="text-slate-700">{formatDateVN(item.startDate)}</span>
                        {tenure && (
                          <span className={`text-[10px] w-fit px-1.5 py-0.5 rounded font-bold mt-1 ${tenure.color}`}>
                            {tenure.label}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Chưa cập nhật</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">{item.totalHours.toFixed(1)}h</td>
                  <td className="px-6 py-4 text-right text-blue-600 font-bold">{formatCurrency(item.salary)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                        onClick={() => handleOpenDetailModal(item)}
                        className="text-slate-400 hover:text-blue-600 p-1"
                        title="Xem chi tiết"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleOpenModal(idx)}
                        className="text-slate-400 hover:text-green-600 p-1"
                        title="Chỉnh sửa"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Xóa"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )}) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Danh sách trống.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-slate-50 z-10">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingIndex !== null ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên nhân viên</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="Nhập tên..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chức vụ / Vị trí</label>
                <input 
                  type="text" 
                  name="role" 
                  value={formData.role || ''} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="VD: Pha chế, Phục vụ..."
                />
              </div>

              {/* Personal Info Group */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh (DoB)</label>
                  <input 
                    type="date" 
                    name="dateOfBirth" 
                    value={formData.dateOfBirth || ''} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                  <input 
                    type="tel" 
                    name="phoneNumber" 
                    value={formData.phoneNumber || ''} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="09..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu làm việc</label>
                <input 
                  type="date" 
                  name="startDate" 
                  value={formData.startDate || ''} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>

              {/* Weekly Off Days Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lịch nghỉ cố định trong tuần (Off)</label>
                <div className="flex flex-wrap gap-2">
                   {DAYS_OF_WEEK.map(day => (
                     <label 
                       key={day} 
                       className={`
                         flex items-center justify-center w-10 h-10 rounded-full border cursor-pointer text-xs font-bold transition-all select-none
                         ${formData.offDays?.includes(day) 
                            ? 'bg-orange-600 text-white border-orange-600 shadow-md' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300 hover:text-orange-600'}
                       `}
                     >
                       <input 
                         type="checkbox" 
                         className="hidden"
                         checked={formData.offDays?.includes(day) || false}
                         onChange={() => handleOffDayToggle(day)}
                       />
                       {day}
                     </label>
                   ))}
                </div>
              </div>

              {/* Salary Calculation Section */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lương theo giờ (đầu vào)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        name="hourlyRate" 
                        value={formData.hourlyRate || ''} 
                        onChange={handleInputChange}
                        className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-sm">đ/h</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tổng giờ công</label>
                      <input 
                        type="number" 
                        name="totalHours" 
                        value={formData.totalHours} 
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Lương thực nhận</label>
                      <input 
                        type="number" 
                        name="salary" 
                        value={formData.salary} 
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 text-green-700 font-bold outline-none transition-all"
                      />
                    </div>
                  </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 z-10">
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
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Modal (For Admin to see staff details) */}
      {isDetailModalOpen && viewDetailStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-fade-in">
             {/* Header */}
             <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
               <div>
                 <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{viewDetailStaff.name}</h2>
                    {(() => {
                      const tenure = calculateTenure(viewDetailStaff.startDate);
                      return tenure ? (
                         <span className={`text-xs px-2 py-0.5 rounded font-bold ${tenure.color.replace('bg-', 'bg-white/20 ').replace('text-', 'text-white ')}`}>
                           {tenure.label}
                         </span>
                      ) : null;
                    })()}
                 </div>
                 <div className="flex flex-col gap-2 mt-2">
                   <p className="text-slate-400 text-sm">
                     {viewDetailStaff.role || 'Nhân viên'} 
                     {viewDetailStaff.startDate && ` • Vào làm: ${formatDateVN(viewDetailStaff.startDate)}`}
                   </p>

                   {/* Personal Info Row */}
                   <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                     {viewDetailStaff.dateOfBirth && (
                       <span className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-pink-400">
                           <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.189a1 1 0 011.892.632l-1.18 2.214a3 3 0 011.635 2.715V17a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4H5v4a1 1 0 01-1 1H2a1 1 0 01-1-1v-8.723a3 3 0 011.635-2.715l-1.18-2.214a1 1 0 111.892-.632l1.699 3.189L9 4.323V3a1 1 0 011-1zm-8 7v2h14V9H2z" clipRule="evenodd" />
                         </svg>
                         {formatDateVN(viewDetailStaff.dateOfBirth)}
                       </span>
                     )}
                     {viewDetailStaff.phoneNumber && (
                       <span className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-400">
                           <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                         </svg>
                         {viewDetailStaff.phoneNumber}
                       </span>
                     )}
                   </div>

                    {/* Display Off Days in Detail Header */}
                    {viewDetailStaff.offDays && viewDetailStaff.offDays.length > 0 && (
                     <p className="text-orange-400 text-sm font-medium flex items-center gap-2 mt-1">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                       </svg>
                       Lịch nghỉ cố định: {viewDetailStaff.offDays.join(', ')}
                     </p>
                   )}
                 </div>
               </div>
               <button onClick={handleCloseDetailModal} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             {renderDetailContent()}
          </div>
        </div>
      )}
    </div>
  );
};