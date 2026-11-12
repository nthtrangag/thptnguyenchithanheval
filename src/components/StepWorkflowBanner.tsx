import React from 'react';
import { useEvaluation } from '../context/EvaluationContext';
import { 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Layers,
  Lock
} from 'lucide-react';

interface StepWorkflowBannerProps {
  onSelectStep?: (step: number) => void;
  adminActiveStep?: number;
}

export const StepWorkflowBanner: React.FC<StepWorkflowBannerProps> = ({
  onSelectStep,
  adminActiveStep,
}) => {
  const { currentRole, switchUserById } = useEvaluation();

  // CHỈ HIỂN THỊ VỚI VAI TRÒ ADMIN VÀ BAN GIÁM HIỆU
  if (currentRole.id !== 'ADMIN' && currentRole.id !== 'BGH') {
    return null;
  }

  const isAdmin = currentRole.id === 'ADMIN';
  const isBgh = currentRole.id === 'BGH';

  // 4 bước với 4 màu sắc hoàn toàn khác nhau theo đúng yêu cầu
  const steps = [
    {
      step: 1,
      title: 'Bước 1: Quản trị & Phân quyền',
      shortTitle: 'Bước 1: Cấu hình Admin',
      roleCode: 'ADMIN',
      roleName: 'Quản trị viên (Admin)',
      desc: 'Quản lý tài khoản, danh mục tiêu chí NĐ 233, tổ chuyên môn và đợt đánh giá.',
      demoUserId: 'u-admin-1',
      // Condition: if admin, active when adminActiveStep === 1; if not admin, active when role is ADMIN
      isActive: isAdmin ? (adminActiveStep === 1) : (currentRole.id === 'ADMIN'),
      icon: ShieldCheck,
      // Color theme: TÍM & INDIGO SANG TRỌNG
      theme: {
        baseBg: 'bg-purple-50/90',
        baseBorder: 'border-purple-200 hover:border-purple-400 hover:bg-purple-100/60',
        activeBg: 'bg-gradient-to-br from-purple-100 via-indigo-50 to-purple-50 border-purple-600 ring-2 ring-purple-500/30 shadow-md',
        headerText: 'text-purple-950',
        badgeBg: 'bg-purple-700 text-white',
        iconBg: 'bg-purple-600 text-white',
        descText: 'text-purple-800/90',
        footerBorder: 'border-purple-200/80',
        footerText: 'text-purple-900',
        stepTag: 'bg-purple-200/80 text-purple-900 border-purple-300',
        activePill: 'bg-purple-700 text-white shadow-2xs',
        indicatorText: 'text-purple-700 group-hover:text-purple-900',
      },
    },
    {
      step: 2,
      title: 'Bước 2: Tự đánh giá & Minh chứng',
      shortTitle: 'Bước 2: Tự đánh giá',
      roleCode: 'GIAO_VIEN',
      roleName: 'Giáo viên & Nhân viên',
      desc: 'Tự cho điểm (Thang 100đ theo từng vị trí), đính kèm minh chứng bắt buộc và nộp hồ sơ.',
      demoUserId: 'u-gv-toan-1',
      isActive: isAdmin ? (adminActiveStep === 2) : ((currentRole.id as string) === 'GIAO_VIEN' || (currentRole.id as string) === 'NHAN_VIEN'),
      icon: UserCheck,
      // Color theme: XANH NGỌC LỤC BẢO / EMERALD TƯƠI SÁNG
      theme: {
        baseBg: 'bg-emerald-50/90',
        baseBorder: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/60',
        activeBg: 'bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-50 border-emerald-600 ring-2 ring-emerald-500/30 shadow-md',
        headerText: 'text-emerald-950',
        badgeBg: 'bg-emerald-700 text-white',
        iconBg: 'bg-emerald-600 text-white',
        descText: 'text-emerald-800/90',
        footerBorder: 'border-emerald-200/80',
        footerText: 'text-emerald-900',
        stepTag: 'bg-emerald-200/80 text-emerald-900 border-emerald-300',
        activePill: 'bg-emerald-700 text-white shadow-2xs',
        indicatorText: 'text-emerald-700 group-hover:text-emerald-900',
      },
    },
    {
      step: 3,
      title: 'Bước 3: Tổ trưởng thẩm định',
      shortTitle: 'Bước 3: Thẩm định cấp tổ',
      roleCode: 'TO_TRUONG',
      roleName: 'Tổ trưởng chuyên môn',
      desc: 'Kiểm tra hồ sơ minh chứng, chấm điểm thẩm định (group_score) hoặc trả về chỉnh sửa.',
      demoUserId: 'u-tt-toan',
      isActive: isAdmin ? (adminActiveStep === 3) : ((currentRole.id as string) === 'TO_TRUONG'),
      icon: Users,
      // Color theme: VÀNG CAM HỔ PHÁCH / AMBER NỔI BẬT
      theme: {
        baseBg: 'bg-amber-50/90',
        baseBorder: 'border-amber-200 hover:border-amber-400 hover:bg-amber-100/60',
        activeBg: 'bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 border-amber-600 ring-2 ring-amber-500/30 shadow-md',
        headerText: 'text-amber-950',
        badgeBg: 'bg-amber-700 text-white',
        iconBg: 'bg-amber-600 text-white',
        descText: 'text-amber-800/90',
        footerBorder: 'border-amber-200/80',
        footerText: 'text-amber-900',
        stepTag: 'bg-amber-200/80 text-amber-900 border-amber-300',
        activePill: 'bg-amber-700 text-white shadow-2xs',
        indicatorText: 'text-amber-800 group-hover:text-amber-950',
      },
    },
    {
      step: 4,
      title: 'Bước 4: Ban Giám Hiệu phê duyệt',
      shortTitle: 'Bước 4: Phê duyệt BGH',
      roleCode: 'BGH',
      roleName: 'Ban Giám Hiệu',
      desc: 'Hội đồng thẩm định, chấm bgh_score, xếp loại 4 mức chất lượng và ban hành quyết định.',
      demoUserId: 'u-bgh-1',
      isActive: isAdmin ? (adminActiveStep === 4) : (currentRole.id === 'BGH'),
      icon: Award,
      // Color theme: ĐỎ HỒNG RUBY / ROSE TRANG TRỌNG
      theme: {
        baseBg: 'bg-rose-50/90',
        baseBorder: 'border-rose-200 hover:border-rose-400 hover:bg-rose-100/60',
        activeBg: 'bg-gradient-to-br from-rose-100 via-pink-50 to-rose-50 border-rose-600 ring-2 ring-rose-500/30 shadow-md',
        headerText: 'text-rose-950',
        badgeBg: 'bg-rose-700 text-white',
        iconBg: 'bg-rose-600 text-white',
        descText: 'text-rose-800/90',
        footerBorder: 'border-rose-200/80',
        footerText: 'text-rose-900',
        stepTag: 'bg-rose-200/80 text-rose-900 border-rose-300',
        activePill: 'bg-rose-700 text-white shadow-2xs',
        indicatorText: 'text-rose-700 group-hover:text-rose-900',
      },
    },
  ];

  const handleStepClick = (s: typeof steps[0]) => {
    if (isAdmin && onSelectStep) {
      onSelectStep(s.step);
    } else if (isAdmin) {
      switchUserById(s.demoUserId);
    } else if (isBgh) {
      // BGH can inspect other demo steps if needed
      if (s.step !== 4) {
        switchUserById(s.demoUserId);
      }
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-100 via-slate-50 to-white border-b border-slate-200/80 py-3.5 px-4 sm:px-6 shadow-2xs">
      <div className="max-w-7xl mx-auto">
        {/* Top workflow bar meta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
              <Layers className="w-4 h-4 text-purple-700" />
              <span>Quy trình đánh giá 4 bước (Nghị định 233/2026/NĐ-CP)</span>
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {isAdmin ? '🛡️ Toàn Quyền Quản Trị Hệ Thống' : '🏛️ Ban Giám Hiệu Phê Duyệt'}
            </span>
            <span className="text-[11px] text-slate-500 hidden lg:inline">
              {isAdmin 
                ? '• Bấm vào từng bước để chuyển nhanh phân hệ làm việc'
                : '• Giám sát toàn bộ tiến độ 4 bước xuyên suốt năm học'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Phân quyền hiện tại:</span>
            <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-600' : 'bg-rose-600'} animate-pulse`} />
              <span>{currentRole.name}</span>
            </span>
          </div>
        </div>

        {/* 4 Steps Grid with 4 Distinct Colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((s) => {
            const Icon = s.icon;
            const { theme } = s;

            return (
              <div
                key={s.step}
                onClick={() => handleStepClick(s)}
                className={`group relative rounded-2xl p-3.5 border transition-all duration-200 cursor-pointer ${
                  s.isActive
                    ? `${theme.activeBg}`
                    : `${theme.baseBg} ${theme.baseBorder} shadow-2xs hover:shadow-xs`
                }`}
                title={isAdmin ? `Chuyển tới ${s.title}` : s.title}
              >
                {/* Step Top Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-xs shrink-0 ${theme.badgeBg}`}
                    >
                      {s.step}
                    </div>
                    <div>
                      <div className={`text-xs font-black tracking-tight ${theme.headerText}`}>
                        {s.title}
                      </div>
                    </div>
                  </div>

                  {s.isActive ? (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${theme.activePill}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Đang chọn</span>
                    </span>
                  ) : (
                    <span className={`text-[10px] font-bold transition-transform group-hover:translate-x-0.5 shrink-0 ${theme.indicatorText}`}>
                      {isAdmin ? 'Xem bước ➔' : 'Chi tiết ➔'}
                    </span>
                  )}
                </div>

                {/* Step Description */}
                <p className={`text-[11px] leading-relaxed line-clamp-2 ${theme.descText}`}>
                  {s.desc}
                </p>

                {/* Step Footer Badge */}
                <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] ${theme.footerBorder}`}>
                  <span className={`font-bold px-2 py-0.5 rounded-md border text-[10px] ${theme.stepTag}`}>
                    {s.roleName}
                  </span>
                  <span className={`text-[10px] font-semibold opacity-75 ${theme.footerText}`}>
                    Giai đoạn {s.step}/4
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
