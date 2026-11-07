import React, { useState } from 'react';
import { useEvaluation } from '../context/EvaluationContext';
import { X, LogIn, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { RoleId } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { users, roles, departments, login, currentUser } = useEvaluation();
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');

  // Direct login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // List filter state
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleLoginFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!usernameInput.trim()) {
      setErrorMessage('Vui lòng nhập tên đăng nhập hoặc mã viên chức!');
      return;
    }
    if (!passwordInput) {
      setErrorMessage('Vui lòng nhập mật khẩu!');
      return;
    }

    const res = login(usernameInput, passwordInput);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
    }
  };

  const handleSelectQuickAccount = (username: string) => {
    setUsernameInput(username);
    setPasswordInput('123456');
    setActiveTab('form');
    setErrorMessage('');
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = selectedRoleFilter === 'ALL' || u.roleId === selectedRoleFilter;
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.teacherCode && u.teacherCode.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchRole && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-xs border border-slate-300 flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/logo_b43cd193.jpg"
                alt="Logo THPT Nguyễn Chí Thanh"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-base font-bold">Xác Thực &amp; Đăng Nhập Viên Chức</h3>
              <p className="text-xs text-slate-300">
                Trường THPT Nguyễn Chí Thanh • Nghị định 233/2026/NĐ-CP
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'form'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Nhập Tên Đăng Nhập &amp; Mật Khẩu
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'list'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Danh Sách Tài Khoản Mẫu ({users.length})
          </button>
        </div>

        {/* Tab 1: Form Login */}
        {activeTab === 'form' && (
          <div className="p-6 overflow-y-auto">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLoginFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tên đăng nhập hoặc Mã viên chức *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: hieutruong, gvtoan1, admin..."
                    value={usernameInput}
                    onChange={e => {
                      setUsernameInput(e.target.value);
                      setErrorMessage('');
                    }}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Mật khẩu *
                  </label>
                  <span className="text-[10px] text-slate-400 italic">Mặc định: 123456</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu..."
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value);
                      setErrorMessage('');
                    }}
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Ngay</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: User List with quick select */}
        {activeTab === 'list' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2">
              <input
                type="text"
                placeholder="Tìm theo họ tên, username hoặc mã viên chức..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[360px]">
              {filteredUsers.map((user) => {
                const dept = departments.find((d) => d.id === user.departmentId);
                const role = roles.find((r) => r.id === user.roleId);
                const isCurrent = currentUser.id === user.id;

                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectQuickAccount(user.username)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">
                          {user.fullName}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${role?.badgeColor}`}>
                          {role?.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-indigo-700 font-semibold">@{user.username}</span>
                        <span>•</span>
                        <span>{dept?.name}</span>
                        <span>•</span>
                        <span className="text-slate-400">Pass: 123456</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100"
                    >
                      Chọn ➔
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Yêu cầu xác thực tài khoản viên chức</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
