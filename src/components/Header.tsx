import React, { useState } from 'react';
import { useEvaluation } from '../context/EvaluationContext';
import { 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  Calendar, 
  RefreshCw, 
  LogOut, 
  UserCheck, 
  ChevronDown,
  Layers,
  Sparkles,
  School
} from 'lucide-react';
import { User, RoleId } from '../types';

interface HeaderProps {
  onOpenLoginModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLoginModal }) => {
  const { 
    currentUser, 
    currentRole, 
    users, 
    switchUserById, 
    periods, 
    selectedPeriodId, 
    setSelectedPeriodId,
    getUserDepartment,
    resetAllData,
    logout
  } = useEvaluation();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDept = getUserDepartment(currentUser.departmentId);

  // Group quick accounts by role for quick switching
  const sampleAccounts: { label: string; roleId: RoleId; userId: string; desc: string }[] = [
    { label: 'Nguyễn Quản Trị', roleId: 'ADMIN', userId: 'u-admin-1', desc: 'Bước 1: Cấu hình hệ thống' },
    { label: 'Cô Hoàng Thu Thảo', roleId: 'NHAN_VIEN', userId: 'u-nv-van-phong-5', desc: 'Bước 2: NV Y tế học đường (100đ)' },
    { label: 'Cô Trần Ngọc Ánh', roleId: 'NHAN_VIEN', userId: 'u-nv-van-phong-3', desc: 'Bước 2: NV Thiết bị, thí nghiệm (100đ)' },
    { label: 'Ông Nguyễn Thanh Tùng', roleId: 'NHAN_VIEN', userId: 'u-gv-van-phong-1', desc: 'Bước 2: Nhân viên Văn thư (100đ)' },
    { label: 'Cô Lê Thị Kim Oanh', roleId: 'NHAN_VIEN', userId: 'u-nv-van-phong-2', desc: 'Bước 2: NV Kế toán (100đ)' },
    { label: 'Cô Phạm Thu Hà', roleId: 'GIAO_VIEN', userId: 'u-gv-toan-1', desc: 'Bước 2: GV Tự đánh giá (Đang nộp)' },
    { label: 'ThS. Lê Văn Nam', roleId: 'TO_TRUONG', userId: 'u-tt-toan', desc: 'Bước 3: Tổ trưởng Toán' },
    { label: 'Bà Vũ Minh Hạnh', roleId: 'TO_TRUONG', userId: 'u-tt-van-phong', desc: 'Bước 3: Tổ trưởng Tổ Văn Phòng' },
    { label: 'Trần Kiên Cường', roleId: 'BGH', userId: 'u-bgh-1', desc: 'Bước 4: Hiệu trưởng (Phê duyệt)' },
  ];

  const handleReset = () => {
    if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu của hệ thống?')) {
      resetAllData();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top institution bar */}
      <div className="bg-slate-900 text-slate-100 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <School className="w-4 h-4 text-emerald-400" />
            <span>SỞ GIÁO DỤC VÀ ĐÀO TẠO AN GIANG • TRƯỜNG THPT NGUYỄN CHÍ THANH (PHÚ TÂN)</span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-300">Đánh giá viên chức theo Nghị định 233/2026/NĐ-CP</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Trực tuyến</span>
            </span>
            <button 
              onClick={handleReset}
              title="Đặt lại dữ liệu mô phỏng ban đầu"
              className="hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Khôi phục dữ liệu mẫu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation & quick role switch bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/logo_b43cd193.jpg"
                alt="Logo Trường THPT Nguyễn Chí Thanh"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Trường Trung Học Phổ Thông Nguyễn Chí Thanh
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Năm học: 2026-2027.
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Đánh giá viên chức theo Nghị định 233/2026/NĐ-CP.
              </p>
            </div>
          </div>

          {/* Center: Period Selection */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0 ml-1.5" />
            <span className="text-xs font-medium text-slate-600 shrink-0">Đợt đánh giá:</span>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              aria-label="Chọn đợt đánh giá"
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:ring-0 cursor-pointer pr-6 py-0.5"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status === 'ACTIVE' ? '🟢 (Đang mở)' : '🔒 (Đã đóng)'}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Quick Switch & Current User */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Demo Switch dropdown - ONLY available for Admin */}
            {currentUser.roleId === 'ADMIN' && (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold shadow-2xs transition-colors"
                  title="Toàn quyền Admin: Đổi tài khoản demo để kiểm tra"
                >
                  <Layers className="w-4 h-4 text-purple-700" />
                  <span className="hidden sm:inline">Chuyển tài khoản demo (Admin)</span>
                  <ChevronDown className="w-3.5 h-3.5 text-purple-600" />
                </button>

              {showUserDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Đăng nhập nhanh theo từng vai trò
                  </div>
                  <div className="max-h-80 overflow-y-auto p-1 space-y-1">
                    {sampleAccounts.map((acc) => {
                      const u = users.find(x => x.id === acc.userId);
                      const isSelected = currentUser.id === acc.userId;
                      return (
                        <button
                          key={acc.userId}
                          onClick={() => switchUserById(acc.userId)}
                          className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            isSelected ? 'bg-indigo-50 border border-indigo-200 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-semibold flex items-center gap-1.5">
                              <span>{acc.label}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                acc.roleId === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                acc.roleId === 'BGH' ? 'bg-rose-100 text-rose-700' :
                                acc.roleId === 'TO_TRUONG' ? 'bg-amber-100 text-amber-700' :
                                acc.roleId === 'NHAN_VIEN' ? 'bg-sky-100 text-sky-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {acc.roleId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">{acc.desc}</div>
                          </div>
                          {isSelected && <span className="text-indigo-600 text-xs font-bold">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 pt-1.5 px-2">
                    <button
                      onClick={onOpenLoginModal}
                      className="w-full text-center py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-50 rounded"
                    >
                      Đăng nhập tài khoản khác...
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Current user badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                {currentUser.fullName.split(' ').slice(-1)[0][0]}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight flex items-center gap-1">
                  <span>{userDept?.name || 'Toàn trường'}</span>
                  <span>•</span>
                  <span className={`font-semibold px-1 rounded text-[10px] ${currentRole.badgeColor}`}>
                    {currentRole.name}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                }}
                title="Đăng xuất khỏi hệ thống và xem bảng tài khoản mẫu"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors ml-1 text-xs font-semibold border border-rose-200 cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Đăng xuất</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
