import React from 'react';
import { useEvaluation } from '../context/EvaluationContext';
import { 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Award, 
  CheckCircle2, 
  Layers
} from 'lucide-react';

interface StepWorkflowSidebarProps {
  onSelectStep?: (step: number) => void;
  adminActiveStep?: number;
}

export const StepWorkflowSidebar: React.FC<StepWorkflowSidebarProps> = ({
  onSelectStep,
  adminActiveStep,
}) => {
  const { currentRole, switchUserById } = useEvaluation();

  if (currentRole.id !== 'ADMIN' && currentRole.id !== 'BGH') {
    return null;
  }

  const isAdmin = currentRole.id === 'ADMIN';
  const isBgh = currentRole.id === 'BGH';

  const steps = [
    {
      step: 1,
      title: 'Bước 1: Quản trị & Phân quyền',
      shortTitle: 'Bước 1: Cấu hình Admin',
      roleCode: 'ADMIN',
      roleName: 'Quản trị viên (Admin)',
      desc: 'Quản lý tài khoản, danh mục tiêu chí NĐ 233, tổ chuyên môn và đợt đánh giá.',
      demoUserId: 'u-admin-1',
      isActive: isAdmin ? (adminActiveStep === 1) : (currentRole.id === 'ADMIN'),
      icon: ShieldCheck,
      theme: {
        baseBg: 'bg-purple-50/90',
        baseBorder: 'border-purple-200 hover:border-purple-400 hover:bg-purple-100/60',
        activeBg: 'bg-gradient-to-br from-purple-100 via-indigo-50 to-purple-50 border-purple-600 ring-2 ring-purple-500/30 shadow-md',
        headerText: 'text-purple-950',
        badgeBg: 'bg-purple-700 text-white',
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
      desc: 'Tự cho điểm (Thang 100đ theo từng vị trí), đính kèm minh chứng và nộp hồ sơ.',
      demoUserId: 'u-gv-toan-1',
      isActive: isAdmin ? (adminActiveStep === 2) : (currentRole.id === 'GIAO_VIEN' || currentRole.id === 'NHAN_VIEN'),
      icon: UserCheck,
      theme: {
        baseBg: 'bg-emerald-50/90',
        baseBorder: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/60',
        activeBg: 'bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-50 border-emerald-600 ring-2 ring-emerald-500/30 shadow-md',
        headerText: 'text-emerald-950',
        badgeBg: 'bg-emerald-700 text-white',
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
      isActive: isAdmin ? (adminActiveStep === 3) : (currentRole.id === 'TO_TRUONG'),
      icon: Users,
      theme: {
        baseBg: 'bg-amber-50/90',
        baseBorder: 'border-amber-200 hover:border-amber-400 hover:bg-amber-100/60',
        activeBg: 'bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 border-amber-600 ring-2 ring-amber-500/30 shadow-md',
        headerText: 'text-amber-950',
        badgeBg: 'bg-amber-700 text-white',
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
      theme: {
        baseBg: 'bg-rose-50/90',
        baseBorder: 'border-rose-200 hover:border-rose-400 hover:bg-rose-100/60',
        activeBg: 'bg-gradient-to-br from-rose-100 via-pink-50 to-rose-50 border-rose-600 ring-2 ring-rose-500/30 shadow-md',
        headerText: 'text-rose-950',
        badgeBg: 'bg-rose-700 text-white',
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
      if (s.step !== 4) {
        switchUserById(s.demoUserId);
      }
    }
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-3">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
              Quy trình 4 Bước (NĐ 233)
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {isAdmin ? 'Admin Panel' : 'BGH Giám Sát'}
          </span>
        </div>

        <div className="space-y-2.5">
          {steps.map((s) => {
            const { theme } = s;

            return (
              <div
                key={s.step}
                onClick={() => handleStepClick(s)}
                className={`group relative rounded-xl p-3 border transition-all duration-200 cursor-pointer ${
                  s.isActive
                    ? `${theme.activeBg}`
                    : `${theme.baseBg} ${theme.baseBorder} shadow-2xs hover:shadow-xs`
                }`}
                title={isAdmin ? `Chuyển tới ${s.title}` : s.title}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shadow-xs shrink-0 ${theme.badgeBg}`}
                    >
                      {s.step}
                    </div>
                    <div className={`text-xs font-black tracking-tight leading-snug ${theme.headerText}`}>
                      {s.title}
                    </div>
                  </div>

                  {s.isActive ? (
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${theme.activePill}`}>
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Chọn</span>
                    </span>
                  ) : (
                    <span className={`text-[10px] font-bold shrink-0 ${theme.indicatorText}`}>
                      ➔
                    </span>
                  )}
                </div>

                <p className={`text-[11px] leading-relaxed line-clamp-2 ${theme.descText}`}>
                  {s.desc}
                </p>

                <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[10px] ${theme.footerBorder}`}>
                  <span className={`font-bold px-1.5 py-0.2 rounded border ${theme.stepTag}`}>
                    {s.roleName}
                  </span>
                  <span className={`font-semibold opacity-75 ${theme.footerText}`}>
                    Bước {s.step}/4
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
