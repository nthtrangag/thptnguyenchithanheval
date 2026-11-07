import React, { useState, useEffect } from 'react';
import { useEvaluation } from '../context/EvaluationContext';
import { 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  ShieldCheck, 
  School,
  KeyRound,
  CheckCircle2,
  Zap,
  Sparkles,
  X,
  ArrowRight,
  BookOpen,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface SampleAccount {
  id: string;
  title: string;
  name: string;
  username: string;
  pass: string;
  role: string;
  roleBadge: string;
  step: string;
  department: string;
  desc: string;
  avatarColor: string;
}

export const LoginPage: React.FC = () => {
  const { login, switchUserById, users, justLoggedOut, clearJustLoggedOut } = useEvaluation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Show guide modal when just logged out or when user requests it
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    if (justLoggedOut) {
      setShowGuideModal(true);
    }
  }, [justLoggedOut]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập tên đăng nhập hoặc mã viên chức!');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu!');
      return;
    }

    setIsSubmitting(true);
    const result = login(username, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại!');
    }
  };

  // Quick fill into inputs
  const handleQuickFill = (acc: SampleAccount) => {
    setUsername(acc.username);
    setPassword(acc.pass);
    setErrorMessage('');
    setShowGuideModal(false);
    clearJustLoggedOut();
  };

  // 1-click Instant Direct Login
  const handleInstantLogin = (acc: SampleAccount) => {
    clearJustLoggedOut();
    const result = login(acc.username, acc.pass);
    if (!result.success && acc.id) {
      // Fallback to switchUserById if needed
      switchUserById(acc.id);
    }
  };

  const sampleAccounts: SampleAccount[] = [
    {
      id: 'u-bgh-1',
      title: 'Bước 4: Ban Giám Hiệu (Hiệu trưởng)',
      name: 'Trần Kiên Cường',
      username: 'hieutruong',
      pass: '123456',
      role: 'BAN GIÁM HIỆU',
      roleBadge: 'bg-rose-100 text-rose-800 border-rose-300',
      step: 'Bước 4: Phê duyệt & Xếp loại',
      department: 'Ban Giám Hiệu Nhà Trường',
      desc: 'Nhập điểm bgh_score, quyết định xếp loại cuối cùng bgh_ranking và Phê duyệt (APPROVED) toàn trường theo NĐ 233/2026.',
      avatarColor: 'from-rose-500 to-pink-600',
    },
    {
      id: 'u-tt-toan',
      title: 'Bước 3: Tổ Trưởng Chuyên Môn (Tổ Toán)',
      name: 'Trần Văn Miễng',
      username: 'totruongtoan',
      pass: '123456',
      role: 'TỔ TRƯỞNG',
      roleBadge: 'bg-amber-100 text-amber-800 border-amber-300',
      step: 'Bước 3: Thẩm định tổ',
      department: 'Tổ Toán',
      desc: 'Lọc các giáo viên thuộc Tổ Toán có trạng thái SUBMITTED, cho điểm cột group_score và chuyển sang GROUP_REVIEWED.',
      avatarColor: 'from-amber-500 to-orange-600',
    },
    {
      id: 'u-tt-van',
      title: 'Bước 3: Tổ Trưởng Chuyên Môn (Văn - Thư Viện - GDĐP)',
      name: 'Nguyễn Thu Trinh',
      username: 'totruongvan',
      pass: '123456',
      role: 'TỔ TRƯỞNG',
      roleBadge: 'bg-amber-100 text-amber-800 border-amber-300',
      step: 'Bước 3: Thẩm định tổ',
      department: 'Tổ Ngữ Văn-Thư Viện-GDĐP',
      desc: 'Thẩm định hồ sơ giáo viên Tổ Ngữ Văn-Thư Viện-GDĐP, nhận xét chuyên môn và chuyển trạng thái đánh giá.',
      avatarColor: 'from-amber-600 to-yellow-600',
    },
    {
      id: 'u-tt-hoa-tin',
      title: 'Bước 3: Tổ Trưởng Chuyên Môn (Hóa - Tin - TNHN)',
      name: 'Thầy Trần Quốc Tuấn',
      username: 'totruonghoatin',
      pass: '123456',
      role: 'TỔ TRƯỞNG',
      roleBadge: 'bg-amber-100 text-amber-800 border-amber-300',
      step: 'Bước 3: Thẩm định tổ',
      department: 'Tổ Hóa-Tin-TNHN',
      desc: 'Thẩm định hồ sơ viên chức Tổ Hóa - Tin - Trải nghiệm hướng nghiệp, chấm điểm và chuyển trạng thái.',
      avatarColor: 'from-teal-500 to-cyan-600',
    },
    {
      id: 'u-gv-toan-1',
      title: 'Bước 2: Tổ Phó Tự Đánh Giá (Tổ Toán - Thang 100đ có Mục 4)',
      name: 'Cô Phạm Thu Hà (Tổ phó Tổ Toán)',
      username: 'gvtoan1',
      pass: '123456',
      role: 'TỔ PHÓ CHUYÊN MÔN',
      roleBadge: 'bg-amber-100 text-amber-800 border-amber-300',
      step: 'Bước 2: Tự chấm (Có Mục 4 đặc thù 20đ)',
      department: 'Tổ Toán',
      desc: 'Tổ phó tự đánh giá theo Thang 100đ bao gồm Mục 4: Quản lý hoạt động tổ/nhóm CM (20đ - TIÊU CHUẨN ĐẶC THÙ), đính kèm minh chứng và nộp hồ sơ.',
      avatarColor: 'from-amber-500 to-teal-600',
    },
    {
      id: 'u-gv-van-1',
      title: 'Bước 2: Giáo Viên Bộ Môn Tự Đánh Giá (Tổ Ngữ Văn)',
      name: 'Cô Vũ Thị Bích Ngọc',
      username: 'gvvan1',
      pass: '123456',
      role: 'GIÁO VIÊN BỘ MÔN',
      roleBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      step: 'Bước 2: Tự chấm & Nộp hồ sơ',
      department: 'Tổ Ngữ Văn-Thư Viện-GDĐP',
      desc: 'Điền điểm tự chấm theo tiêu chuẩn giáo viên giảng dạy (Số lượng 30đ, Chất lượng 30đ, Tiến độ 10đ), đính kèm minh chứng.',
      avatarColor: 'from-emerald-500 to-green-600',
    },
    {
      id: 'u-tt-van-phong',
      title: 'Bước 2 & 3: Tổ Trưởng Tổ Văn Phòng - Văn Thư (Thang 100đ có Mục 4)',
      name: 'Bà Vũ Minh Hạnh (Tổ trưởng Tổ Văn Phòng)',
      username: 'totruongvanphong',
      pass: '123456',
      role: 'TỔ TRƯỞNG TỔ VĂN PHÒNG',
      roleBadge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      step: 'Bước 2 & 3: Tự chấm (Mục 4 quản lý tổ) & Duyệt tổ',
      department: 'Tổ Văn Phòng',
      desc: 'Tự đánh giá theo Thang điểm 100 dành riêng cho Tổ trưởng tổ Văn phòng - Văn thư (Mục B.II theo Nghị định 233: Văn bản đến, Văn bản đi, Con dấu, Lưu trữ, Học bạ số, Văn bằng và Mục 4 Quản lý hoạt động tổ 20đ).',
      avatarColor: 'from-indigo-600 to-slate-700',
    },
    {
      id: 'u-nv-van-phong-2',
      title: 'Bước 2: Nhân Viên Kế Toán (Thang 100đ theo NĐ 233)',
      name: 'Cô Lê Thị Kim Oanh',
      username: 'nvvanphong2',
      pass: '123456',
      role: 'KẾ TOÁN VIÊN',
      roleBadge: 'bg-teal-100 text-teal-800 border-teal-300',
      step: 'Bước 2: Tự chấm (Biểu mẫu Kế toán NĐ 233)',
      department: 'Tổ Văn Phòng',
      desc: 'Tự đánh giá thang điểm 100 theo đúng văn bản và biểu mẫu Kế toán: Sổ sách kế toán (10đ), Dự toán kinh phí (10đ), Quyết toán (5đ), Quản lý tài sản (5đ), Chất lượng (19đ+11đ*), Tiến độ (10đ).',
      avatarColor: 'from-teal-600 to-emerald-600',
    },
    {
      id: 'u-gv-van-phong-1',
      title: 'Bước 2: Nhân Viên Văn Thư (Thang 100đ theo NĐ 233)',
      name: 'Ông Nguyễn Thanh Tùng',
      username: 'nvvanphong1',
      pass: '123456',
      role: 'NHÂN VIÊN VĂN THƯ',
      roleBadge: 'bg-sky-100 text-sky-800 border-sky-300',
      step: 'Bước 2: Tự chấm & Nộp hồ sơ',
      department: 'Tổ Văn Phòng',
      desc: 'Tự đánh giá theo Thang 100đ dành riêng cho Nhân viên Văn thư (Mục B.II theo Nghị định 233: Số lượng 30đ [6 tiêu chí x 5đ], Chất lượng 30đ [19đ+11đ*], Tiến độ 10đ), đính kèm minh chứng và nộp lên Tổ trưởng.',
      avatarColor: 'from-sky-500 to-blue-600',
    },
    {
      id: 'u-nv-van-phong-3',
      title: 'Bước 2: Nhân Viên Thiết Bị, Thí Nghiệm (Thang 100đ theo NĐ 233)',
      name: 'Cô Trần Ngọc Ánh',
      username: 'nvvanphong3',
      pass: '123456',
      role: 'NHÂN VIÊN THIẾT BỊ',
      roleBadge: 'bg-purple-100 text-purple-800 border-purple-300',
      step: 'Bước 2: Tự chấm (Biểu mẫu Thiết bị NĐ 233)',
      department: 'Tổ Văn Phòng',
      desc: 'Tự đánh giá theo Thang 100đ dành riêng cho Nhân viên Thiết bị, thí nghiệm (Mục B.III theo Nghị định 233: Số lượng 30đ [6 tiêu chí x 5đ], Chất lượng 30đ [19đ+11đ*], Tiến độ 10đ), đính kèm minh chứng và nộp lên Tổ trưởng.',
      avatarColor: 'from-purple-600 to-indigo-600',
    },
    {
      id: 'u-nv-van-phong-5',
      title: 'Bước 2: Nhân Viên Y Tế (Thang 100đ theo NĐ 233)',
      name: 'Cô Hoàng Thu Thảo',
      username: 'nvyte',
      pass: '123456',
      role: 'NHÂN VIÊN Y TẾ',
      roleBadge: 'bg-rose-100 text-rose-800 border-rose-300',
      step: 'Bước 2: Tự chấm (Biểu mẫu Y tế NĐ 233)',
      department: 'Tổ Văn Phòng',
      desc: 'Tự đánh giá theo Thang 100đ dành riêng cho Nhân viên Y tế (Mục B.IV theo Nghị định 233: Số lượng 30đ [6 tiêu chí x 5đ: Sơ cấp cứu, Hồ sơ sức khỏe, BH y tế & tai nạn, Tuyên truyền, Phòng dịch & phòng bạo lực, Tư vấn tâm lý], Chất lượng 30đ [19đ+11đ*], Tiến độ 10đ), đính kèm minh chứng và nộp lên Tổ trưởng.',
      avatarColor: 'from-rose-600 to-pink-600',
    },
    {
      id: 'u-admin-1',
      title: 'Bước 1: Quản Trị Hệ Thống (Admin)',
      name: 'Nguyễn Quản Trị',
      username: 'admin',
      pass: '123456',
      role: 'QUẢN TRỊ VIÊN',
      roleBadge: 'bg-purple-100 text-purple-800 border-purple-300',
      step: 'Bước 1: Cấu hình hệ thống',
      department: 'Ban Giám Hiệu Nhà Trường',
      desc: 'Quản lý tài khoản viên chức, phân 9 tổ chuyên môn, cấu hình tiêu chí (criteria), đợt đánh giá và nạp file Excel.',
      avatarColor: 'from-purple-600 to-indigo-600',
    },
  ];

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
            <button
              onClick={() => setShowGuideModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all text-xs cursor-pointer shadow-sm hover:scale-105"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bảng hướng dẫn tài khoản mẫu &amp; đăng nhập nhanh</span>
            </button>
            <span className="hidden md:inline text-slate-400 font-mono text-[11px]">
              Năm học 2026-2027
            </span>
          </div>
        </div>
      </header>

      {/* Notification banner if just logged out */}
      {justLoggedOut && (
        <div className="relative z-10 max-w-4xl mx-auto w-full px-4 pt-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50 text-white shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  Bạn đã đăng xuất an toàn khỏi hệ thống!
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Đã kích hoạt tính năng <strong className="text-white">Bảng hướng dẫn tài khoản mẫu &amp; đăng nhập nhanh</strong> để bạn thuận tiện kiểm thử quy trình 4 bước.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGuideModal(true)}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Mở Bảng Hướng Dẫn</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Login Card Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left: Login Form Card (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between p-6 sm:p-8">
            <div>
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
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                    Trường THPT Nguyễn Chí Thanh
                  </h2>
                  <p className="text-xs text-indigo-700 font-bold mt-0.5">
                    Đánh giá viên chức theo Nghị định 233/2026/NĐ-CP
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    Năm học: 2026-2027 • Đăng nhập tài khoản viên chức
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

                {/* Username Input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tên đăng nhập hoặc Mã viên chức *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="Ví dụ: hieutruong, gvtoan1, admin..."
                      value={username}
                      onChange={e => {
                        setUsername(e.target.value);
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
                    Bảo mật dữ liệu viên chức
                  </span>
                  <span className="text-slate-600">
                    Mật khẩu chung: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">123456</code>
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Xác Nhận &amp; Đăng Nhập Hệ Thống</span>
                </button>
              </form>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Nghị định 233/2026/NĐ-CP • THPT Nguyễn Chí Thanh</span>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 underline cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Xem tài khoản mẫu &amp; hướng dẫn</span>
              </button>
            </div>
          </div>

          {/* Right: Quick Demo Credentials / Helper Card (5 cols) */}
          <div className="lg:col-span-5 bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700 p-5 sm:p-6 flex flex-col justify-between text-white shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      Đăng Nhập Nhanh 1-Chạm
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuideModal(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                >
                  Xem bảng đầy đủ
                </button>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                Bấm <strong>⚡ Đăng nhập</strong> để vào ngay hệ thống theo đúng vai trò, hoặc bấm vào ô để tự động điền form:
              </p>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {sampleAccounts
                  .filter(acc => acc.role === 'QUẢN TRỊ VIÊN' || acc.role === 'BAN GIÁM HIỆU')
                  .map((acc) => (
                  <div
                    key={acc.username}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-emerald-500/60 transition-all duration-150 group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-200">
                        {acc.title}
                      </span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${acc.roleBadge}`}>
                        {acc.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                      <span>{acc.name}</span>
                      <span className="text-[10px] text-slate-400">{acc.department}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-800 text-[11px]">
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="text-emerald-400">@{acc.username}</span>
                        <span className="text-slate-400">MK: 123456</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickFill(acc)}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer border border-slate-600 transition-colors"
                          title="Điền tên đăng nhập & mật khẩu vào form"
                        >
                          Điền form
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInstantLogin(acc)}
                          className="px-2 py-0.5 rounded text-[10px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold cursor-pointer shadow flex items-center gap-1 transition-transform active:scale-95"
                          title="Đăng nhập ngay vào vai trò này"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Đăng nhập</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Mật khẩu chung: 123456
              </span>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="text-slate-300 hover:text-white font-semibold underline text-[11px] cursor-pointer"
              >
                Hướng dẫn quy trình 4 bước
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 px-6 text-center text-xs text-slate-400 border-t border-slate-800/80 bg-slate-950/40">
        Trường THPT Nguyễn Chí Thanh (Phú Tân - An Giang) • Bản quyền hệ thống đánh giá chất lượng viên chức theo Nghị định 233/2026/NĐ-CP
      </footer>

      {/* POPUP MODAL: BẢNG HƯỚNG DẪN TÀI KHOẢN MẪU & ĐĂNG NHẬP NHANH */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-white">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Bảng Hướng Dẫn Tài Khoản Mẫu &amp; Đăng Nhập Nhanh
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      NĐ 233/2026/NĐ-CP
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Trường THPT Nguyễn Chí Thanh • Chọn nhanh vai trò để kiểm thử toàn diện quy trình 4 bước
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowGuideModal(false);
                  clearJustLoggedOut();
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng bảng hướng dẫn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Workflow Guide + Accounts Table */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* 4-Step Flow Banner */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-slate-300">
                <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  <span>Quy trình đánh giá 4 bước theo Nghị định 233/2026/NĐ-CP:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                    <strong className="text-purple-300 block font-bold mb-0.5">Bước 1: Quản Trị (Admin)</strong>
                    <span className="text-slate-400 leading-tight">Thêm/sửa tài khoản, cấu hình tiêu chí &amp; tạo đợt đánh giá.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                    <strong className="text-emerald-300 block font-bold mb-0.5">Bước 2: GV &amp; Nhân Viên Tự Đánh Giá</strong>
                    <span className="text-slate-400 leading-tight">Điền điểm, tải minh chứng &amp; gửi hồ sơ (DRAFT → SUBMITTED).</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                    <strong className="text-amber-300 block font-bold mb-0.5">Bước 3: Tổ Trưởng Thẩm Định</strong>
                    <span className="text-slate-400 leading-tight">Lọc giáo viên tổ, chấm group_score → GROUP_REVIEWED.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                    <strong className="text-rose-300 block font-bold mb-0.5">Bước 4: BGH Phê Duyệt</strong>
                    <span className="text-slate-400 leading-tight">Chấm bgh_score, xếp hạng cuối cùng &amp; ấn Phê duyệt (APPROVED).</span>
                  </div>
                </div>
              </div>

              {/* Accounts Table */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Danh sách tài khoản mẫu thử nghiệm (Mật khẩu chung: <code className="text-emerald-400 font-mono">123456</code>)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Bấm &quot;⚡ Đăng nhập ngay&quot; để chuyển đổi vai trò ngay lập tức
                  </span>
                </div>

                <div className="space-y-3">
                  {sampleAccounts.map((acc) => (
                    <div
                      key={acc.username}
                      className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 hover:border-emerald-400/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${acc.roleBadge}`}>
                            {acc.role}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {acc.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            • {acc.department}
                          </span>
                        </div>
                        
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          <strong className="text-amber-300">{acc.step}:</strong> {acc.desc}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
                          <div className="flex items-center gap-1 font-mono">
                            <span className="text-slate-400">Tên đăng nhập:</span>
                            <span className="text-emerald-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                              {acc.username}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 font-mono">
                            <span className="text-slate-400">Mật khẩu:</span>
                            <span className="text-slate-200 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                              {acc.pass}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => handleQuickFill(acc)}
                          className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-colors cursor-pointer border border-slate-600 flex items-center gap-1.5"
                          title="Điền thông tin tài khoản này vào ô đăng nhập"
                        >
                          <span>Điền vào form</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInstantLogin(acc)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                          title="Đăng nhập trực tiếp không cần nhập mật khẩu"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>⚡ Đăng nhập ngay</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
              <span>Được xây dựng cho Trường THPT Nguyễn Chí Thanh • Năm học 2026-2027</span>
              <button
                type="button"
                onClick={() => {
                  setShowGuideModal(false);
                  clearJustLoggedOut();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
              >
                Đóng hướng dẫn
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
