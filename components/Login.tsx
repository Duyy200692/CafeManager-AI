import React, { useState } from 'react';
import { StaffShift, User } from '../types';

interface LoginProps {
  staffList: StaffShift[];
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ staffList, onLogin }) => {
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedStaff) {
      setError('Vui lòng chọn nhân viên.');
      return;
    }

    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    // Demo password check
    if (password === '1234') {
      const staff = staffList.find(s => s.name === selectedStaff);
      if (staff) {
        onLogin({
          name: staff.name,
          role: staff.role || 'Nhân viên',
          avatar: staff.name.charAt(0)
        });
      } else if (selectedStaff === 'admin') {
         onLogin({
          name: 'Quản Lý Cấp Cao',
          role: 'Admin',
          avatar: 'A'
        });
      }
    } else {
      setError('Mật khẩu không đúng. (Mặc định: 1234)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">
        {/* Login Form */}
        <div className="w-full p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center font-bold text-3xl text-white mx-auto mb-4">
              C
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Cafe Manager AI</h2>
            <p className="text-slate-500 text-sm mt-1">Hệ thống quản lý nội bộ</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bạn là ai?</label>
              <div className="relative">
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none appearance-none bg-white text-slate-700 transition-all"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  <option value="admin">Quản lý (Admin)</option>
                  {staffList.map((staff, idx) => (
                    <option key={idx} value={staff.name}>
                      {staff.name} - {staff.role}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (Demo: 1234)"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-900/10 active:scale-[0.98]"
            >
              Đăng nhập hệ thống
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            &copy; 2024 Cafe Manager System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};