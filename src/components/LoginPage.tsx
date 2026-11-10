import React, { useState, useEffect } from 'react';
import { useEvaluation } from '../context/EvaluationContext';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  ShieldCheck, 
  School,
  CheckCircle2,
  X,
  BookOpen,
  HelpCircle,
  Sparkles,
  Zap
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, users, justLoggedOut, clearJustLoggedOut } = useEvaluation();

  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    if (justLoggedOut) {
      setShowGuideModal(true);
    }
  }, [justLoggedOut]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedInput = emailInput.trim().toLowerCase();
    if (!trimmedInput) {
      setErrorMessage('Vui lòng nhập email hoặc tên đăng nhập hoặc mã viên chức!');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu!');
      return;
    }

    setIsSubmitting(true);
    // Find user by email, username, or teacherCode
    const foundUser = users.find(
      u =>
        u.email.toLowerCase() === trimmedInput ||
        u.username.toLowerCase() === trimmedInput ||
        (u.teacherCode && u.teacherCode.toLowerCase() === trimmedInput)
    );

    if (!foundUser) {
      setIsSubmitting(false);
      setErrorMessage(`Không tìm thấy tài khoản với "${emailInput}" trên hệ thống!`);
      return;
    }

    const result = login(foundUser.username, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại mật khẩu!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-950/40 via-slate-900/10 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top institution header */}
      <header className="relative z-10 py-3.5 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <School className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-200 tracking-wide">
              SỞ GIÁO DỤC VÀ ĐÀO TẠO AN GIANG • TRƯỜNG THPT NGUYỄN CHÍ THANH
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-emerald-400 font-medium">
              Firebase DB: dgvcthptnguyenchithanh
            </span>
            <span className="hidden md:inline text-slate-400 font-mono text-[11px]">
              Năm học 2026-2027
            </span>
          </div>
        </div>
      </header>

      {/* Notification banner if just logged out */}
      {justLoggedOut && (
        <div className="relative z-10 max-w-xl mx-auto w-full px-4 pt-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50 text-white shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  Bạn đã đăng xuất an toàn khỏi hệ thống!
                </p>
              </div>
            </div>
            <button
              onClick={() => clearJustLoggedOut()}
              className="shrink-0 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Main Login Card Section (Centered & Clean without Quick Login) */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8">
          
          {/* School Logo & Title */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-md border-2 border-indigo-100 flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/logo_b43cd193.jpg"
                alt="Logo Trường THPT Nguyễn Chí Thanh"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                Trường THPT Nguyễn Chí Thanh
              </h2>
              <p className="text-xs text-indigo-700 font-bold mt-0.5">
                Đánh giá viên chức (NĐ 233/2026/NĐ-CP)
              </p>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                Đăng nhập bằng Email &amp; Mật khẩu
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Lỗi đăng nhập:</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Địa chỉ Email viên chức *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  autoFocus
                  required
                  placeholder="Ví dụ: c3nguyenchithanh-cuong@angiang.edu.vn"
                  value={emailInput}
                  onChange={e => {
                    setEmailInput(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Mật khẩu *
                </label>
                <span className="text-[10px] text-slate-400 italic">
                  (Mặc định: 123456)
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 hover:bg-white focus:bg-white transition-all text-slate-800 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 transition-colors"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Notice */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Firebase Auth &amp; Firestore
              </span>
              <span className="text-slate-600">
                MK: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">123456</code>
              </span>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập Hệ Thống</span>
            </button>
          </form>

          <div className="pt-4 mt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
            <span>Trường THPT Nguyễn Chí Thanh • Nghị định 233/2026/NĐ-CP</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 px-6 text-center text-xs text-slate-400 border-t border-slate-800/80 bg-slate-950/40">
        Trường THPT Nguyễn Chí Thanh (Phú Tân - An Giang) • Cơ sở dữ liệu Firebase Cloud Firestore
      </footer>
    </div>
  );
};
