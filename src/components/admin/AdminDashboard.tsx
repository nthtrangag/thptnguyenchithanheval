import React, { useState } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { 
  Users, 
  ListTree, 
  CalendarRange, 
  BarChart3, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ShieldCheck,
  Building2,
  FileCheck2,
  Clock,
  Sparkles,
  FileSpreadsheet,
  Download,
  FileCheck,
  UploadCloud,
  Upload,
  Edit
} from 'lucide-react';
import { RoleId, User, Criterion, EvaluationPeriod } from '../../types';
import { UserExcelImportModal } from './UserExcelImportModal';
import { CriteriaExcelImportModal } from './CriteriaExcelImportModal';
import { exportUsersToExcel, downloadSampleExcel } from '../../utils/excelUserUtils';
import { downloadCriteriaSampleExcel } from '../../utils/excelCriteriaUtils';
import { isDepartmentLeaderOrDeputy } from '../../utils/evaluationRules';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const {
    users,
    roles,
    departments,
    periods,
    categories,
    criteria,
    evaluations,
    selectedPeriodId,
    addUser,
    updateUser,
    deleteUser,
    addPeriod,
    updatePeriod,
    deletePeriod,
    addCriterion,
    updateCriterion,
    deleteCriterion,
  } = useEvaluation();

  const [activeTab, setActiveTab] = useState<'users' | 'criteria' | 'periods' | 'overview'>('overview');
  const [criteriaRoleFilter, setCriteriaRoleFilter] = useState<'ALL' | 'GIAO_VIEN' | 'TO_TRUONG_TO_PHO' | 'Y_TE' | 'THIET_BI' | 'VAN_THU' | 'KE_TOAN' | 'TO_TRUONG_VAN_PHONG'>('ALL');

  // Excel import modal state
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [showCriteriaExcelModal, setShowCriteriaExcelModal] = useState(false);

  // User form modal/inline state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    roleId: 'GIAO_VIEN' as RoleId,
    departmentId: 'dept-toan',
    isDepartmentHead: false,
    title: 'Giáo viên bộ môn',
    teacherCode: 'GV-',
    phone: '',
    subject: 'Toán học',
    password: '123456',
  });

  // Criteria form state
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [showAddCritModal, setShowAddCritModal] = useState(false);
  const [critFormData, setCritFormData] = useState({
    categoryId: 'cat-a1',
    code: '1.i',
    name: '',
    description: '',
    maxScore: 2,
  });

  // Period form state
  const [showAddPeriodModal, setShowAddPeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<EvaluationPeriod | null>(null);
  const [periodFormData, setPeriodFormData] = useState({
    name: '',
    academicYear: '2026-2027',
    semester: 'Học kỳ I',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    status: 'UPCOMING' as 'UPCOMING' | 'ACTIVE' | 'CLOSED',
    description: '',
  });

  // Overview statistics
  const currentPeriod = periods.find(p => p.id === selectedPeriodId);
  const periodEvals = evaluations.filter(e => e.periodId === selectedPeriodId);
  const totalTeachers = users.filter(u => u.roleId === 'GIAO_VIEN' || u.roleId === 'TO_TRUONG' || u.roleId === 'NHAN_VIEN').length;
  const draftCount = periodEvals.filter(e => e.status === 'DRAFT').length;
  const submittedCount = periodEvals.filter(e => e.status === 'SUBMITTED').length;
  const groupReviewedCount = periodEvals.filter(e => e.status === 'GROUP_REVIEWED').length;
  const approvedCount = periodEvals.filter(e => e.status === 'APPROVED').length;

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.fullName || !userFormData.username) return;

    if (editingUser) {
      updateUser(editingUser.id, userFormData);
      setEditingUser(null);
    } else {
      addUser(userFormData);
      setShowAddUserModal(false);
    }
    setUserFormData({
      username: '',
      fullName: '',
      email: '',
      roleId: 'GIAO_VIEN',
      departmentId: 'dept-toan',
      isDepartmentHead: false,
      title: 'Giáo viên bộ môn',
      teacherCode: `GV-0${users.length + 10}`,
      phone: '',
      subject: 'Toán học',
      password: '123456',
    });
  };

  const handleStartEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId,
      departmentId: user.departmentId,
      isDepartmentHead: user.isDepartmentHead,
      title: user.title,
      teacherCode: user.teacherCode,
      phone: user.phone || '',
      subject: user.subject || '',
      password: user.password || '123456',
    });
  };

  const handleSaveCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!critFormData.name || !critFormData.code) return;

    if (editingCriterion) {
      updateCriterion(editingCriterion.id, critFormData);
      setEditingCriterion(null);
    } else {
      const max = critFormData.maxScore || 1;
      addCriterion({
        ...critFormData,
        levels: [
          { level: 'Chưa đạt', score: 0, description: 'Chưa đạt yêu cầu tối thiểu.' },
          { level: 'Đạt', score: Math.max(1, Math.round(max * 0.5)), description: 'Đạt yêu cầu chuẩn cơ bản.' },
          { level: 'Khá', score: Math.max(1, Math.round(max * 0.75)), description: 'Thực hiện tốt, có tính sáng tạo.' },
          { level: 'Tốt', score: max, description: 'Mẫu mực, xuất sắc, lan tỏa tích cực.' },
        ],
      });
      setShowAddCritModal(false);
    }
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodFormData.name) return;
    if (editingPeriod) {
      updatePeriod(editingPeriod.id, periodFormData);
      setEditingPeriod(null);
    } else {
      addPeriod(periodFormData);
    }
    setShowAddPeriodModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                  Bước 1: Quản Trị Hệ Thống
                </span>
                <span className="text-xs text-slate-400">• Toàn quyền Admin</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Bảng Điều Khiển Cấu Hình &amp; Phân Quyền
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý bảng users &amp; roles, cấu hình bộ tiêu chí đánh giá theo Nghị định 233/2026/NĐ-CP và các đợt đánh giá định kỳ
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setEditingUser(null);
                setUserFormData({
                  username: `gv_${Date.now().toString().slice(-4)}`,
                  fullName: '',
                  email: '',
                  roleId: 'GIAO_VIEN',
                  departmentId: 'dept-toan-tin',
                  isDepartmentHead: false,
                  title: 'Giáo viên bộ môn',
                  teacherCode: `GV-0${users.length + 11}`,
                  phone: '',
                  subject: 'Toán học',
                  password: '123456',
                });
                setShowAddUserModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm Người Dùng
            </button>
            <button
              onClick={() => setShowCriteriaExcelModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Tải lên danh mục Tiêu chuẩn & Tiêu chí từ file Excel theo Nghị định 233"
            >
              <Upload className="w-4 h-4" />
              Tải Lên Tiêu Chuẩn (Excel)
            </button>
            <button
              onClick={() => setShowAddPeriodModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <CalendarRange className="w-4 h-4" />
              Tạo Đợt Đánh Giá
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 mt-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Tổng Quan Tiến Độ Đánh Giá
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Quản Lý Tài Khoản &amp; Phân Quyền ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('criteria')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'criteria'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTree className="w-4 h-4" />
            Cấu Hình Tiêu Chí Đánh Giá ({criteria.length})
          </button>
          <button
            onClick={() => setActiveTab('periods')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'periods'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            Quản Lý Đợt Đánh Giá ({periods.length})
          </button>
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Bước 2: Bản nháp (DRAFT)</span>
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                  {draftCount}
                </span>
              </div>
              <div className="text-2xl font-black text-slate-800 mt-2">{draftCount} hồ sơ</div>
              <p className="text-[11px] text-slate-500 mt-1">Giáo viên đang hoàn thiện minh chứng</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800">Bước 3: Chờ Tổ trưởng (SUBMITTED)</span>
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  {submittedCount}
                </span>
              </div>
              <div className="text-2xl font-black text-amber-900 mt-2">{submittedCount} hồ sơ</div>
              <p className="text-[11px] text-amber-700 mt-1">Chờ Tổ chuyên môn thẩm định &amp; cho điểm</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-indigo-200 bg-indigo-50/30 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-800">Bước 4: Chờ BGH (GROUP_REVIEWED)</span>
                <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {groupReviewedCount}
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-900 mt-2">{groupReviewedCount} hồ sơ</div>
              <p className="text-[11px] text-indigo-700 mt-1">Tổ đã duyệt xong, chờ Ban Giám hiệu xếp loại</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">Hoàn Tất Phê Duyệt (APPROVED)</span>
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  {approvedCount}
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-2">{approvedCount} hồ sơ</div>
              <p className="text-[11px] text-emerald-700 mt-1">Đã có quyết định xếp loại chính thức</p>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Tiến Độ Theo Từng Tổ Chuyên Môn Trong Đợt: {currentPeriod?.name}
            </h3>

            {/* Recharts Bar Chart */}
            <div className="w-full h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departments
                    .filter(d => d.id !== 'dept-bgh')
                    .map(dept => {
                      const deptEvals = periodEvals.filter(e => e.departmentId === dept.id);
                      return {
                        name: dept.name.replace('Tổ ', ''),
                        'Đã Nộp': deptEvals.filter(e => e.status === 'SUBMITTED').length,
                        'Tổ Duyệt': deptEvals.filter(e => e.status === 'GROUP_REVIEWED').length,
                        'BGH Duyệt': deptEvals.filter(e => e.status === 'APPROVED').length,
                      };
                    })}
                  margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip wrapperStyle={{ fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Đã Nộp" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Tổ Duyệt" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="BGH Duyệt" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-semibold">Mã Tổ</th>
                    <th className="py-2.5 px-3 font-semibold">Tên Tổ Chuyên Môn</th>
                    <th className="py-2.5 px-3 font-semibold">Tổ Trưởng</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Số Giáo Viên</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Đã Nộp (SUBMITTED)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Tổ Duyệt (GROUP_REVIEWED)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">BGH Duyệt (APPROVED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments
                    .filter(d => d.id !== 'dept-bgh')
                    .map((dept) => {
                      const headUser = users.find(u => u.id === dept.headUserId);
                      const deptTeachers = users.filter(u => u.departmentId === dept.id);
                      const deptEvals = periodEvals.filter(e => e.departmentId === dept.id);
                      const sub = deptEvals.filter(e => e.status === 'SUBMITTED').length;
                      const grp = deptEvals.filter(e => e.status === 'GROUP_REVIEWED').length;
                      const app = deptEvals.filter(e => e.status === 'APPROVED').length;

                      return (
                        <tr key={dept.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{dept.code}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{dept.name}</td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {headUser ? headUser.fullName : 'Chưa phân công'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold">{deptTeachers.length}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                              {sub}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                              {grp}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              {app}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users & Roles */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Danh Sách Tài Khoản &amp; Phân Quyền (Bảng Users &amp; Roles)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {users.length} tài khoản
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý quyền truy cập theo role_id, gán tổ chuyên môn department_id và quyền quản lý tổ
              </p>
            </div>

            {/* Action Buttons Toolbar: Excel Upload, Export, Sample & Manual Add */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => downloadSampleExcel(departments)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                title="Tải về file Excel mẫu để điền thông tin"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Mẫu Excel</span>
              </button>

              <button
                type="button"
                onClick={() => exportUsersToExcel(users, departments, roles)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                title="Xuất toàn bộ danh sách viên chức hiện có ra file Excel"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Xuất Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExcelImportModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Tải lên danh sách viên chức và phân quyền từ file Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Tải Lên File Excel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setShowAddUserModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Mới</span>
              </button>
            </div>
          </div>

          {/* Excel feature quick tip banner */}
          <div className="bg-emerald-50/60 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Tính năng Excel:</strong> Bạn có thể bấm <strong>&quot;Tải Lên File Excel&quot;</strong> để nạp hàng loạt giáo viên, gán tổ chuyên môn và quyền hạn từ file <code>.xlsx</code> / <code>.csv</code>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowExcelImportModal(true)}
              className="text-emerald-700 hover:text-emerald-900 font-bold underline shrink-0 ml-2 cursor-pointer"
            >
              Mở trình tải Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/75 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-semibold">Mã VC</th>
                  <th className="py-2.5 px-3 font-semibold">Họ và Tên</th>
                  <th className="py-2.5 px-3 font-semibold">Tên Đăng Nhập</th>
                  <th className="py-2.5 px-3 font-semibold">Tổ Chuyên Môn</th>
                  <th className="py-2.5 px-3 font-semibold">Vai Trò (role_id)</th>
                  <th className="py-2.5 px-3 font-semibold">Chức Vụ</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const dept = departments.find(d => d.id === u.departmentId);
                  const role = roles.find(r => r.id === u.roleId);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{u.teacherCode}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{u.fullName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">@{u.username}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{dept?.name || '---'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${role?.badgeColor}`}>
                          {role?.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="font-semibold text-slate-900">{u.title}</div>
                        {isDepartmentLeaderOrDeputy(u) && (
                          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                            {u.isDepartmentHead || u.roleId === 'TO_TRUONG' ? 'Tổ Trưởng (Thang 100đ có Mục 4)' : 'Tổ Phó (Thang 100đ có Mục 4)'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleStartEditUser(u)}
                            title="Sửa thông tin"
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa tài khoản ${u.fullName}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            title="Xóa tài khoản"
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Criteria Management */}
      {activeTab === 'criteria' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Bộ Tiêu Chuẩn &amp; Tiêu Chí Đánh Giá Viên Chức (Nghị định 233/2026/NĐ-CP)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {categories.length} Tiêu chuẩn • {criteria.length} Tiêu chí
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấu hình bộ tiêu chuẩn chuẩn hóa, quản lý thang điểm tối đa và 4 mức xếp loại (Chưa đạt, Đạt, Khá, Tốt)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={downloadCriteriaSampleExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                title="Tải file mẫu Excel chuẩn theo Nghị định 233/2026/NĐ-CP"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>File Mẫu Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCriteriaExcelModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Tải lên tiêu chuẩn & tiêu chí từ file Excel hoặc CSV"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải Lên Tiêu Chuẩn (Excel)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddCritModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Tiêu Chí</span>
              </button>
            </div>
          </div>

          {/* Quick upload highlight banner */}
          <div className="bg-emerald-50/70 px-4 py-2.5 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Tính năng Tải lên Tiêu chuẩn:</strong> Quản trị viên có thể tải lên toàn bộ danh mục Tiêu chuẩn &amp; Tiêu chí từ file <code>.xlsx</code> / <code>.csv</code> kèm theo thang điểm và 4 mức xếp loại chi tiết.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCriteriaExcelModal(true)}
              className="text-emerald-700 hover:text-emerald-900 font-bold underline shrink-0 ml-2 cursor-pointer"
            >
              Mở cửa sổ tải lên Excel
            </button>
          </div>

          {/* Role Filter Segmented Control */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col gap-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">Xem theo đối tượng áp dụng:</span>
              <div className="flex items-center gap-1.5 flex-wrap rounded-lg border border-slate-300 p-1 bg-slate-100 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCriteriaRoleFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    criteriaRoleFilter === 'ALL'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({criteria.length})
                </button>

                <button
                  type="button"
                  onClick={() => setCriteriaRoleFilter('Y_TE')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    criteriaRoleFilter === 'Y_TE'
                      ? 'bg-rose-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Nhân viên Y tế</span>
                  <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/20 text-white font-mono">100đ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCriteriaRoleFilter('THIET_BI')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    criteriaRoleFilter === 'THIET_BI'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Nhân viên Thiết bị</span>
                  <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/20 text-white font-mono">100đ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCriteriaRoleFilter('VAN_THU')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    criteriaRoleFilter === 'VAN_THU'
                      ? 'bg-sky-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Nhân viên Văn thư</span>
                  <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/20 text-white font-mono">100đ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCriteriaRoleFilter('KE_TOAN')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    criteriaRoleFilter === 'KE_TOAN'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Nhân viên Kế toán</span>
                  <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/20 text-white font-mono">100đ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCriteriaRoleFilter('TO_TRUONG_VAN_PHONG')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    criteriaRoleFilter === 'TO_TRUONG_VAN_PHONG'
                      ? 'bg-indigo-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>TT Tổ Văn Phòng</span>
                  <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/20 text-white font-mono">100đ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCriteriaRoleFilter('TO_TRUONG_TO_PHO')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    criteriaRoleFilter === 'TO_TRUONG_TO_PHO'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>TT &amp; TP CM</span>
                  <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/20 text-white font-mono">100đ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCriteriaRoleFilter('GIAO_VIEN')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    criteriaRoleFilter === 'GIAO_VIEN'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Giáo viên</span>
                  <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/20 text-white font-mono">100đ</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {criteriaRoleFilter === 'Y_TE' && (
                <span className="text-rose-900 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-block">
                  🌸 Tiêu chuẩn dành riêng cho Nhân viên Y tế (NĐ 233): Mục A (30đ) + Mục B.IV Y tế (Số lượng 30đ, Chất lượng 30đ, Tiến độ 10đ) = 100đ
                </span>
              )}
              {criteriaRoleFilter === 'THIET_BI' && (
                <span className="text-purple-900 font-semibold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 inline-block">
                  🔬 Tiêu chuẩn dành riêng cho Nhân viên Thiết bị, thí nghiệm (NĐ 233): Mục A (30đ) + Mục B.III Thiết bị (Số lượng 30đ, Chất lượng 30đ, Tiến độ 10đ) = 100đ
                </span>
              )}
              {criteriaRoleFilter === 'VAN_THU' && (
                <span className="text-sky-900 font-semibold bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 inline-block">
                  📄 Tiêu chuẩn dành riêng cho Nhân viên Văn thư (NĐ 233): Mục A (30đ) + Mục B.II Văn thư (Số lượng 30đ, Chất lượng 30đ, Tiến độ 10đ) = 100đ
                </span>
              )}
              {criteriaRoleFilter === 'KE_TOAN' && (
                <span className="text-teal-900 font-semibold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 inline-block">
                  📊 Tiêu chuẩn dành riêng cho Nhân viên Kế toán (NĐ 233): Mục A (30đ) + Mục B Kế toán (Số lượng 30đ, Chất lượng 30đ, Tiến độ 10đ) = 100đ
                </span>
              )}
              {criteriaRoleFilter === 'TO_TRUONG_VAN_PHONG' && (
                <span className="text-indigo-900 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 inline-block">
                  🏢 Tiêu chuẩn Tổ trưởng Tổ Văn Phòng (NĐ 233): Mục A (30đ) + Mục B.II Văn thư (50đ) + Mục 4 Đặc thù quản lý tổ Văn phòng (20đ) = 100đ
                </span>
              )}
              {criteriaRoleFilter === 'TO_TRUONG_TO_PHO' && (
                <span className="text-amber-900 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                  🏆 Tiêu chuẩn Tổ trưởng &amp; Tổ phó CM (NĐ 233): Mục A (30đ) + Mục B (50đ) + Mục 4 Quản lý hoạt động tổ/nhóm CM (20đ) = 100đ
                </span>
              )}
              {criteriaRoleFilter === 'GIAO_VIEN' && (
                <span className="text-emerald-900 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                  🧑‍🏫 Tiêu chuẩn Giáo viên bộ môn (NĐ 233): Mục A (30đ) + Mục B Giáo viên (Số lượng 30đ, Chất lượng 30đ, Tiến độ 10đ) = 100đ
                </span>
              )}
              {criteriaRoleFilter === 'ALL' && (
                <span>Hiển thị toàn bộ tiêu chuẩn &amp; tiêu chí của hệ thống</span>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {[
              {
                code: 'A',
                title: 'MỤC A: TIÊU CHÍ CHUNG (30 ĐIỂM)',
                subTitle: 'Gồm Tiêu chuẩn 1 (TC1 - 10đ), Tiêu chuẩn 2 (TC2 - 10đ), Tiêu chuẩn 3 (TC3 - 10đ)',
                maxScore: 30,
                badgeBg: 'bg-indigo-600 text-white',
                headerBg: 'bg-indigo-50/80 border-indigo-200 text-indigo-950',
                categories: categories.filter(c => {
                  const isSecA = c.sectionCode === 'A' || ['cat-a1', 'cat-a2', 'cat-a3'].includes(c.id);
                  if (!isSecA) return false;
                  if (criteriaRoleFilter === 'ALL') return true;
                  if (!c.applicableRoles || c.applicableRoles.includes('ALL')) return true;
                  return c.applicableRoles.includes(criteriaRoleFilter);
                }),
              },
              {
                code: 'B',
                title: 'MỤC B: KẾT QUẢ THỰC HIỆN CHỨC TRÁCH, NHIỆM VỤ ĐƯỢC GIAO (70 ĐIỂM)',
                subTitle: criteriaRoleFilter === 'Y_TE'
                  ? 'B.IV Y tế: 1. Số lượng (30đ: 6 tiêu chí x 5đ), 2. Chất lượng (19đ+11đ vượt trội 2*), 3. Tiến độ (10đ)'
                  : criteriaRoleFilter === 'THIET_BI'
                  ? 'B.III Thiết bị: 1. Số lượng (30đ: 6 tiêu chí x 5đ), 2. Chất lượng (19đ+11đ vượt trội 2*), 3. Tiến độ (10đ)'
                  : criteriaRoleFilter === 'VAN_THU'
                  ? 'B.II Văn thư: 1. Số lượng (30đ: 6 tiêu chí x 5đ), 2. Chất lượng (19đ+11đ vượt trội 2*), 3. Tiến độ (10đ)'
                  : criteriaRoleFilter === 'KE_TOAN'
                  ? 'Kế toán: 1. Số lượng (30đ), 2. Chất lượng (19đ+11đ vượt trội 2*), 3. Tiến độ (10đ)'
                  : criteriaRoleFilter === 'TO_TRUONG_VAN_PHONG'
                  ? 'B.II: 1. Số lượng (20đ), 2. Chất lượng (20đ), 3. Tiến độ (10đ), 4. Quản lý hoạt động tổ Văn phòng (20đ - TIÊU CHUẨN ĐẶC THÙ)'
                  : criteriaRoleFilter === 'TO_TRUONG_TO_PHO'
                  ? 'Gồm 1. Số lượng (20đ), 2. Chất lượng (20đ), 3. Tiến độ (10đ), 4. Quản lý hoạt động tổ/nhóm CM (20đ)'
                  : criteriaRoleFilter === 'GIAO_VIEN'
                  ? 'Gồm 1. Số lượng công việc (30đ), 2. Chất lượng công việc (30đ), 3. Tiến độ thực hiện (10đ)'
                  : 'Bao gồm tiêu chuẩn phân hóa theo từng vị trí (Y tế, Thiết bị, Văn thư, Kế toán, TT Văn phòng, TT/TP CM, Giáo viên)',
                maxScore: 70,
                badgeBg: 'bg-emerald-600 text-white',
                headerBg: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
                categories: categories.filter(c => {
                  const isSecB = c.sectionCode === 'B';
                  if (!isSecB) return false;
                  if (criteriaRoleFilter === 'ALL') return true;
                  if (!c.applicableRoles || c.applicableRoles.includes('ALL')) return true;
                  return c.applicableRoles.includes(criteriaRoleFilter);
                }),
              },
            ].map(section => {
              const secCriteria = criteria.filter(c => {
                const belongs = section.categories.some(cat => cat.id === c.categoryId);
                if (!belongs) return false;
                if (criteriaRoleFilter === 'ALL') return true;
                if (!c.applicableRoles || c.applicableRoles.includes('ALL')) return true;
                return c.applicableRoles.includes(criteriaRoleFilter);
              });

              return (
                <div key={section.code} className="space-y-3">
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between shadow-2xs ${section.headerBg}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${section.badgeBg}`}>
                        {section.code}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wide">{section.title}</h4>
                        <p className="text-[11px] text-slate-500">{section.subTitle}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                      {secCriteria.length} tiêu chí • Tối đa {section.maxScore}đ
                    </span>
                  </div>

                  <div className="space-y-3">
                    {section.categories.map((cat) => {
                      const catCriteria = criteria.filter(c => {
                        if (c.categoryId !== cat.id) return false;
                        if (criteriaRoleFilter === 'ALL') return true;
                        if (!c.applicableRoles || c.applicableRoles.includes('ALL')) return true;
                        return c.applicableRoles.includes(criteriaRoleFilter);
                      });

                      const isLeaderCat = cat.applicableRoles?.includes('TO_TRUONG_TO_PHO');
                      const isTeacherCat = cat.applicableRoles?.includes('GIAO_VIEN');

                      return (
                        <div key={cat.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                          <div className="px-4 py-3 bg-blue-50/70 border-b border-blue-200 flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black text-white px-2 py-0.5 rounded bg-blue-900 uppercase tracking-wider font-mono shadow-2xs">
                                {cat.code}
                              </span>
                              <span className="text-sm font-black text-blue-950">{cat.name}</span>
                              {isLeaderCat && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                  Áp dụng: Tổ trưởng / Tổ phó
                                </span>
                              )}
                              {isTeacherCat && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                                  Áp dụng: Giáo viên bộ môn
                                </span>
                              )}
                              {cat.description && (
                                <p className="text-[11px] text-slate-600 block w-full mt-0.5">{cat.description}</p>
                              )}
                            </div>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-white border border-blue-200 text-blue-900 font-mono shrink-0">
                              {catCriteria.length} tiêu chí • {cat.maxScore}đ
                            </span>
                          </div>

                  <div className="divide-y divide-slate-100">
                    {catCriteria.map((crit) => {
                      const isBlueSpecial = crit.highlightColor === 'blue' || crit.code === '2*';
                      const isRedSpecial = crit.highlightColor === 'red' || crit.code === '1.h' || crit.code === '3.a';

                      return (
                      <div key={crit.id} className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${isBlueSpecial ? 'bg-sky-50/70 border-l-4 border-sky-500' : isRedSpecial ? 'bg-rose-50/40 border-l-4 border-rose-500' : 'hover:bg-slate-50/70'}`}>
                        <div className="space-y-1.5 max-w-3xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-mono text-xs font-black px-2 py-0.5 rounded shadow-2xs shrink-0 ${isBlueSpecial ? 'bg-sky-700 text-white' : isRedSpecial ? 'bg-rose-700 text-white' : 'bg-blue-900 text-white'}`}>
                              {crit.code}
                            </span>
                            <span className={`text-xs font-black ${isBlueSpecial ? 'text-sky-950 font-black' : isRedSpecial ? 'text-rose-950 font-black' : 'text-black font-black'}`}>
                              {crit.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-bold font-mono">
                              (Tối đa: {crit.maxScore}đ)
                            </span>
                            {isBlueSpecial && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 uppercase">
                                Thưởng chất lượng (Tối đa 11đ)
                              </span>
                            )}
                            {isRedSpecial && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">
                                Tiêu chí điểm nhấn
                              </span>
                            )}
                            {crit.applicableRoles?.includes('TO_TRUONG_TO_PHO') && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                Tổ trưởng / Tổ phó
                              </span>
                            )}
                            {crit.applicableRoles?.includes('GIAO_VIEN') && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                                Giáo viên
                              </span>
                            )}
                          </div>
                          <p className={`text-xs leading-relaxed ${isBlueSpecial ? 'text-sky-900 font-semibold' : isRedSpecial ? 'text-rose-950 font-semibold' : 'text-black font-semibold'}`}>
                            {crit.description}
                          </p>

                          {/* 4 Completion Percentage Levels Preview */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                            {[
                              { label: '100% (Tối đa)', pct: 100, score: crit.maxScore, desc: `Hoàn thành 100% công việc: ${crit.maxScore}đ` },
                              { label: '75% (Khá/Tốt)', pct: 75, score: Math.round(crit.maxScore * 0.75 * 10) / 10, desc: `Hoàn thành 75% công việc: ${Math.round(crit.maxScore * 0.75 * 10) / 10}đ` },
                              { label: '50% (Đạt chuẩn)', pct: 50, score: Math.round(crit.maxScore * 0.5 * 10) / 10, desc: `Hoàn thành 50% công việc: ${Math.round(crit.maxScore * 0.5 * 10) / 10}đ` },
                              { label: '0% (Chưa đạt)', pct: 0, score: 0, desc: 'Không hoàn thành nhiệm vụ' },
                            ].map((lvl) => (
                              <div key={lvl.pct} className="p-1.5 rounded-lg bg-white border border-slate-200">
                                <div className="font-bold text-slate-800 flex items-center justify-between">
                                  <span>{lvl.label}</span>
                                  <span className="text-emerald-700 font-mono font-bold">{lvl.score}đ</span>
                                </div>
                                <div className="text-[10px] text-slate-500 line-clamp-1">{lvl.desc}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingCriterion(crit);
                              setCritFormData({
                                categoryId: crit.categoryId,
                                code: crit.code,
                                name: crit.name,
                                description: crit.description,
                                maxScore: crit.maxScore,
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                            title="Sửa tiêu chí"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Xóa tiêu chí ${crit.code}?`)) {
                                deleteCriterion(crit.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                            title="Xóa tiêu chí"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              );
            })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Periods */}
      {activeTab === 'periods' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Danh Sách Các Đợt Đánh Giá (evaluation_periods)
              </h3>
              <p className="text-xs text-slate-500">
                Mỗi đợt đánh giá ứng với một học kỳ hoặc năm học theo quy định của Phòng/Sở GD&amp;ĐT
              </p>
            </div>
            <button
              onClick={() => setShowAddPeriodModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm Đợt Mới
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {periods.map((period) => {
              const count = evaluations.filter(e => e.periodId === period.id).length;

              return (
                <div key={period.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{period.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        period.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : period.status === 'CLOSED'
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {period.status === 'ACTIVE' ? 'Đang Mở' : period.status === 'CLOSED' ? 'Đã Khóa' : 'Sắp Tới'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">{period.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                      <span>Năm học: <strong className="text-slate-700">{period.academicYear}</strong></span>
                      <span>Học kỳ: <strong className="text-slate-700">{period.semester}</strong></span>
                      <span>Thời gian: {period.startDate} đến {period.endDate}</span>
                      <span>Số hồ sơ: <strong className="text-indigo-600">{count} hồ sơ</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingPeriod(period);
                        setPeriodFormData({
                          name: period.name,
                          academicYear: period.academicYear,
                          semester: period.semester,
                          startDate: period.startDate,
                          endDate: period.endDate,
                          description: period.description,
                          status: period.status || 'UPCOMING',
                        });
                        setShowAddPeriodModal(true);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Xác nhận xóa đợt đánh giá "${period.name}"?`)) {
                          deletePeriod(period.id);
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                    {period.status !== 'ACTIVE' ? (
                      <button
                        onClick={() => updatePeriod(period.id, { status: 'ACTIVE' })}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                      >
                        Kích hoạt
                      </button>
                    ) : (
                      <button
                        onClick={() => updatePeriod(period.id, { status: 'CLOSED' })}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Đóng đợt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {(showAddUserModal || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? 'Cập Nhật Tài Khoản' : 'Thêm Người Dùng Mới'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddUserModal(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: ThS. Trần Văn Minh"
                  value={userFormData.fullName}
                  onChange={e => setUserFormData({ ...userFormData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    value={userFormData.username}
                    onChange={e => setUserFormData({ ...userFormData, username: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mã viên chức / GV *</label>
                  <input
                    type="text"
                    required
                    value={userFormData.teacherCode}
                    onChange={e => setUserFormData({ ...userFormData, teacherCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mật khẩu đăng nhập *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mặc định: 123456"
                    value={userFormData.password}
                    onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vai trò hệ thống (role_id) *</label>
                  <select
                    value={userFormData.roleId}
                    onChange={e => setUserFormData({ ...userFormData, roleId: e.target.value as RoleId })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tổ chuyên môn (department_id) *</label>
                  <select
                    value={userFormData.departmentId}
                    onChange={e => setUserFormData({ ...userFormData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Chức vụ / Vị trí *</label>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Tổ trưởng, Tổ phó, Giáo viên bộ môn..."
                    value={userFormData.title}
                    onChange={e => setUserFormData({ ...userFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* Quick role suggestions */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400">Chọn nhanh:</span>
                    {[
                      { label: 'Tổ trưởng', val: 'Tổ trưởng chuyên môn', isHead: true, role: 'TO_TRUONG' as RoleId },
                      { label: 'Tổ phó', val: 'Tổ phó chuyên môn', isHead: false, role: 'GIAO_VIEN' as RoleId },
                      { label: 'Giáo viên', val: 'Giáo viên bộ môn', isHead: false, role: 'GIAO_VIEN' as RoleId },
                      { label: 'Nhân viên', val: 'Nhân viên', isHead: false, role: 'NHAN_VIEN' as RoleId },
                    ].map(item => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setUserFormData({
                            ...userFormData,
                            title: item.val,
                            isDepartmentHead: item.isHead,
                            roleId: item.role,
                          });
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Môn giảng dạy / Chuyên trách</label>
                  <input
                    type="text"
                    value={userFormData.subject}
                    onChange={e => setUserFormData({ ...userFormData, subject: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDeptHead"
                    checked={userFormData.isDepartmentHead}
                    onChange={e => setUserFormData({ ...userFormData, isDepartmentHead: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="isDeptHead" className="font-bold text-amber-950 cursor-pointer">
                    Người này giữ vai trò Quản lý Tổ chuyên môn (Tổ trưởng)
                  </label>
                </div>
                <p className="text-[10px] text-amber-800 leading-relaxed pl-5">
                  ★ <strong>Quy định đánh giá:</strong> Viên chức là <strong>Tổ trưởng</strong> hoặc <strong>Tổ phó</strong> sẽ được hệ thống áp dụng bộ tiêu chí đánh giá chuẩn 100 điểm dành riêng (gồm <strong>Mục 4: Quản lý hoạt động tổ/nhóm CM - 20 điểm</strong>) theo Nghị định 233/2026/NĐ-CP.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Criterion Modal */}
      {(showAddCritModal || editingCriterion) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCriterion ? 'Sửa Tiêu Chí Đánh Giá' : 'Thêm Tiêu Chí Mới'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddCritModal(false);
                  setEditingCriterion(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCriterion} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Thuộc Tiêu chuẩn nào *</label>
                <select
                  value={critFormData.categoryId}
                  onChange={e => setCritFormData({ ...critFormData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mã tiêu chí *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 1.a, B.1.a, B.2.i..."
                    value={critFormData.code}
                    onChange={e => setCritFormData({ ...critFormData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Điểm tối đa</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={critFormData.maxScore}
                    onChange={e => setCritFormData({ ...critFormData, maxScore: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên tiêu chí *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tiêu chí 15: Sáng tạo trong nghiên cứu khoa học"
                  value={critFormData.name}
                  onChange={e => setCritFormData({ ...critFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mô tả nội dung tiêu chí</label>
                <textarea
                  rows={3}
                  value={critFormData.description}
                  onChange={e => setCritFormData({ ...critFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCritModal(false);
                    setEditingCriterion(null);
                  }}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                >
                  Lưu Tiêu Chí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Period Modal */}
      {showAddPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingPeriod ? 'Cập Nhật Đợt Đánh Giá' : 'Tạo Đợt Đánh Giá Mới'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddPeriodModal(false);
                  setEditingPeriod(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên đợt đánh giá *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đánh giá Chuẩn nghề nghiệp GV - Năm học 2026-2027"
                  value={periodFormData.name}
                  onChange={e => setPeriodFormData({ ...periodFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Năm học *</label>
                  <input
                    type="text"
                    required
                    value={periodFormData.academicYear}
                    onChange={e => setPeriodFormData({ ...periodFormData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Học kỳ *</label>
                  <input
                    type="text"
                    required
                    value={periodFormData.semester}
                    onChange={e => setPeriodFormData({ ...periodFormData, semester: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={periodFormData.startDate}
                    onChange={e => setPeriodFormData({ ...periodFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={periodFormData.endDate}
                    onChange={e => setPeriodFormData({ ...periodFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mô tả / Hướng dẫn</label>
                <textarea
                  rows={2}
                  placeholder="Căn cứ theo Nghị định 233/2026/NĐ-CP..."
                  value={periodFormData.description}
                  onChange={e => setPeriodFormData({ ...periodFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPeriodModal(false);
                    setEditingPeriod(null);
                  }}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg"
                >
                  {editingPeriod ? 'Cập Nhật Đợt' : 'Tạo Đợt Đánh Giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Excel Import Modal */}
      <UserExcelImportModal
        isOpen={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
      />

      {/* Criteria & Standards Excel Import Modal */}
      <CriteriaExcelImportModal
        isOpen={showCriteriaExcelModal}
        onClose={() => setShowCriteriaExcelModal(false)}
      />
    </div>
  );
};
