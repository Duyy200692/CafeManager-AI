import React, { useState } from 'react';
import { Material, DailyInventorySession, ExpenseRecord } from '../types';
import { DailyInventory } from './DailyInventory';
import { InventoryManager } from './InventoryManager';
import { ExpenseManager } from './ExpenseManager';

interface InventoryCombinedProps {
  materials: Material[];
  onUpdateMaterials: (newMaterials: Material[]) => void;
  inventorySessions: DailyInventorySession[];
  onSaveSession: (session: DailyInventorySession) => void;
  expenses: ExpenseRecord[];
  onSaveExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const InventoryCombined: React.FC<InventoryCombinedProps> = (props) => {
  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'expenses' | 'master'>('checklist');

  return (
    <div className="h-full flex flex-col space-y-2 md:space-y-4">
      {/* Top Navigation / Switcher - Compact on Mobile */}
      <div className="bg-white p-1 md:p-2 rounded-xl border border-slate-200 shadow-sm shrink-0 flex justify-center md:justify-start">
        <div className="bg-slate-100 p-1 rounded-lg flex flex-row relative w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('checklist')}
            className={`flex-1 sm:flex-none px-4 md:px-6 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
              activeSubTab === 'checklist' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 hidden md:block">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <span className="truncate">Kiểm Kê</span>
          </button>

          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`flex-1 sm:flex-none px-4 md:px-6 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
              activeSubTab === 'expenses' 
                ? 'bg-white text-rose-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 hidden md:block">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">Sổ Chi Tiêu</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('master')}
            className={`flex-1 sm:flex-none px-4 md:px-6 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
              activeSubTab === 'master' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 hidden md:block">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <span className="truncate">Cấu Hình Giá</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeSubTab === 'checklist' && (
          <DailyInventory 
            materials={props.materials} 
            inventorySessions={props.inventorySessions}
            onSaveSession={props.onSaveSession}
          />
        )}
        {activeSubTab === 'expenses' && (
          <ExpenseManager
            expenses={props.expenses}
            onSaveExpense={props.onSaveExpense}
            onDeleteExpense={props.onDeleteExpense}
          />
        )}
        {activeSubTab === 'master' && (
          <InventoryManager 
            materials={props.materials} 
            onUpdateMaterials={props.onUpdateMaterials}
          />
        )}
      </div>
    </div>
  );
};