import React, { useState } from 'react';
import { EvaluationProvider, useEvaluation } from './context/EvaluationContext';
import { Header } from './components/Header';
import { StepWorkflowSidebar } from './components/StepWorkflowSidebar';
import { LoginModal } from './components/LoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TeacherEvaluationView } from './components/teacher/TeacherEvaluationView';
import { DepartmentHeadView } from './components/department/DepartmentHeadView';
import { BghDashboardView } from './components/bgh/BghDashboardView';
import { LoginPage } from './components/LoginPage';
import { 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Award
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentRole, currentUser, isAuthenticated } = useEvaluation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [toTruongSubTab, setToTruongSubTab] = useState<'review' | 'self'>('review');
  const [adminActiveTab, setAdminActiveTab] = useState<'dashboard' | 'evaluation' | 'department' | 'bgh'>('dashboard');
  
  // If not authenticated, require username and password login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Header */}
      <Header onOpenLoginModal={() => setIsLoginModalOpen(true)} />

      {/* Main Layout with Sidebar Workflow (Right or Left) and Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row items-start gap-6">
        
        {/* Main Role-Based Content Area (Left/Center) */}
        <main className="flex-1 w-full space-y-6 min-w-0">
          {/* If user is ADMIN: Provide tabs to access ALL system functions */}
          {currentRole.id === 'ADMIN' && (
            <div className="bg-white rounded-2xl p-2.5 border-2 border-purple-300 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-white">
              <div className="flex items-center gap-2.5 px-2">
                <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                    <span>Toàn Quyền Quản Trị Hệ Thống (Admin)</span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-200 text-purple-900">
                      Tất Cả Chức Năng
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-700">
                    Chuyển đổi trực tiếp giữa 4 phân hệ để cấu hình, kiểm thử biểu mẫu từng vai trò và giám sát
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold flex-wrap">
                <button
                  type="button"
                  onClick={() => setAdminActiveTab('dashboard')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                    adminActiveTab === 'dashboard'
                      ? 'bg-purple-700 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>1. Bảng Quản Trị</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveTab('evaluation')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                    adminActiveTab === 'evaluation'
                      ? 'bg-emerald-700 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>2. Biểu Mẫu Tự Đánh Giá</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveTab('department')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                    adminActiveTab === 'department'
                      ? 'bg-amber-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>3. Thẩm Định Tổ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveTab('bgh')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                    adminActiveTab === 'bgh'
                      ? 'bg-rose-700 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>4. Phê Duyệt BGH</span>
                </button>
              </div>
            </div>
          )}

          {/* If user is TO_TRUONG: provide toggle between Team Review (Step 3) and Personal Evaluation */}
          {currentRole.id === 'TO_TRUONG' && (
            <div className="bg-white rounded-xl p-2 border border-slate-200 flex items-center gap-2 shadow-2xs">
              <button
                onClick={() => setToTruongSubTab('review')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                  toTruongSubTab === 'review'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Bước 3: Thẩm Định Giáo Viên Thuộc Tổ Chuyên Môn</span>
              </button>
              <button
                onClick={() => setToTruongSubTab('self')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                  toTruongSubTab === 'self'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Phiếu Tự Đánh Giá Của Tổ Trưởng (Thang 100đ có Mục 4 - 20đ)</span>
              </button>
            </div>
          )}

          {/* ROLE-BASED DYNAMIC VIEWS */}
          {currentRole.id === 'ADMIN' && (
            adminActiveTab === 'dashboard' ? (
              <AdminDashboard />
            ) : adminActiveTab === 'evaluation' ? (
              <TeacherEvaluationView />
            ) : adminActiveTab === 'department' ? (
              <DepartmentHeadView />
            ) : (
              <BghDashboardView />
            )
          )}

          {(currentRole.id === 'GIAO_VIEN' || currentRole.id === 'NHAN_VIEN') && (
            <TeacherEvaluationView />
          )}

          {currentRole.id === 'TO_TRUONG' && (
            toTruongSubTab === 'review' ? (
              <DepartmentHeadView />
            ) : (
              <TeacherEvaluationView />
            )
          )}

          {currentRole.id === 'BGH' && (
            <BghDashboardView />
          )}
        </main>

        {/* 4-Step Interactive Workflow Sidebar (Right Side) */}
        {(currentRole.id === 'ADMIN' || currentRole.id === 'BGH') && (
          <StepWorkflowSidebar
            onSelectStep={(step) => {
              if (currentRole.id === 'ADMIN') {
                if (step === 1) setAdminActiveTab('dashboard');
                if (step === 2) setAdminActiveTab('evaluation');
                if (step === 3) setAdminActiveTab('department');
                if (step === 4) setAdminActiveTab('bgh');
              }
            }}
            adminActiveStep={
              currentRole.id === 'ADMIN'
                ? adminActiveTab === 'dashboard' ? 1
                  : adminActiveTab === 'evaluation' ? 2
                  : adminActiveTab === 'department' ? 3
                  : 4
                : 4
            }
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/logo_b43cd193.jpg"
              alt="Logo Trường THPT Nguyễn Chí Thanh"
              className="w-10 h-10 object-cover rounded-full border border-slate-200 shrink-0"
            />
            <div>
              <div className="font-bold text-slate-800">
                Trường Trung Học Phổ Thông Nguyễn Chí Thanh (Phú Tân - An Giang)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Đánh giá viên chức theo Nghị định 233/2026/NĐ-CP • Năm học: 2026-2027
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Bước 1: Admin cấu hình</span>
            <span>•</span>
            <span>Bước 2: Viên chức tự đánh giá</span>
            <span>•</span>
            <span>Bước 3: Tổ trưởng thẩm định</span>
            <span>•</span>
            <span>Bước 4: BGH phê duyệt</span>
          </div>
        </div>
      </footer>

      {/* Login / Switch Account Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <EvaluationProvider>
      <AppContent />
    </EvaluationProvider>
  );
}
