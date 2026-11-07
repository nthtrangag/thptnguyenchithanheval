import React, { useState } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Search, 
  Printer, 
  Building2, 
  ChevronRight, 
  Sparkles, 
  Download,
  Filter,
  BarChart,
  FileCheck,
  Users,
  Briefcase,
  GraduationCap,
  Layers,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Evaluation, EvaluationStatus, User, RankingLevel, EmulationGroup } from '../../types';
import { 
  STATUS_DEFINITIONS, 
  RANKING_DEFINITIONS, 
  formatDate,
  getUserEmulationGroup,
  EMULATION_GROUPS,
  isDepartmentLeaderOrDeputy
} from '../../utils/evaluationRules';
import { BghApprovalModal } from './BghApprovalModal';
import { PrintEvaluationModal } from '../PrintEvaluationModal';
import { PrintEmulationSummaryModal } from './PrintEmulationSummaryModal';

export const BghDashboardView: React.FC = () => {
  const {
    currentUser,
    users,
    departments,
    evaluations,
    selectedPeriodId,
    periods,
    criteria,
  } = useEvaluation();

  const currentPeriod = periods.find(p => p.id === selectedPeriodId);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | EvaluationStatus>('ALL');
  const [rankingFilter, setRankingFilter] = useState<'ALL' | RankingLevel>('ALL');
  const [emulationFilter, setEmulationFilter] = useState<'ALL' | EmulationGroup>('ALL');
  const [summaryViewMode, setSummaryViewMode] = useState<'EMULATION_SPLIT' | 'ALL_LIST'>('EMULATION_SPLIT');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEmulationPrintOpen, setIsEmulationPrintOpen] = useState(false);

  // All staff & teachers in school
  const allStaff = users.filter(u => u.roleId === 'GIAO_VIEN' || u.roleId === 'TO_TRUONG' || u.roleId === 'NHAN_VIEN');
  const periodEvals = evaluations.filter(e => e.periodId === selectedPeriodId);

  // Split into 2 Emulation Groups (Nhóm Thi Đua)
  const groupGiaoVien = allStaff.filter(u => getUserEmulationGroup(u) === 'GIAO_VIEN_TO_TRUONG');
  const groupNhanVien = allStaff.filter(u => getUserEmulationGroup(u) === 'NHAN_VIEN');

  // Metrics for Group 1: Giáo viên, Tổ trưởng, Tổ phó
  const evalsGiaoVien = periodEvals.filter(e => groupGiaoVien.some(u => u.id === e.userId));
  const xuatSacGiaoVien = evalsGiaoVien.filter(e => (e.bghRanking || e.groupRanking) === 'XUAT_SAC').length;
  const totGiaoVien = evalsGiaoVien.filter(e => (e.bghRanking || e.groupRanking) === 'TOT').length;
  const hoanThanhGiaoVien = evalsGiaoVien.filter(e => (e.bghRanking || e.groupRanking) === 'HOAN_THANH').length;
  const chuaHTGiaoVien = evalsGiaoVien.filter(e => (e.bghRanking || e.groupRanking) === 'CHUA_HOAN_THANH').length;
  const percentXSGiaoVien = groupGiaoVien.length > 0 ? (xuatSacGiaoVien / groupGiaoVien.length) * 100 : 0;

  // Metrics for Group 2: Nhân viên
  const evalsNhanVien = periodEvals.filter(e => groupNhanVien.some(u => u.id === e.userId));
  const xuatSacNhanVien = evalsNhanVien.filter(e => (e.bghRanking || e.groupRanking) === 'XUAT_SAC').length;
  const totNhanVien = evalsNhanVien.filter(e => (e.bghRanking || e.groupRanking) === 'TOT').length;
  const hoanThanhNhanVien = evalsNhanVien.filter(e => (e.bghRanking || e.groupRanking) === 'HOAN_THANH').length;
  const chuaHTNhanVien = evalsNhanVien.filter(e => (e.bghRanking || e.groupRanking) === 'CHUA_HOAN_THANH').length;
  const percentXSNhanVien = groupNhanVien.length > 0 ? (xuatSacNhanVien / groupNhanVien.length) * 100 : 0;

  // Overall School Metrics
  const pendingBghCount = periodEvals.filter(e => e.status === 'GROUP_REVIEWED').length;
  const approvedCount = periodEvals.filter(e => e.status === 'APPROVED').length;
  const pendingGroupCount = periodEvals.filter(e => e.status === 'SUBMITTED').length;

  const countXuatSac = periodEvals.filter(e => (e.bghRanking || e.groupRanking) === 'XUAT_SAC').length;
  const countTot = periodEvals.filter(e => (e.bghRanking || e.groupRanking) === 'TOT').length;
  const countHoanThanh = periodEvals.filter(e => (e.bghRanking || e.groupRanking) === 'HOAN_THANH').length;

  // Process rows with emulation group
  const staffRows = allStaff.map(teacher => {
    const evaluation = periodEvals.find(e => e.userId === teacher.id);
    const dept = departments.find(d => d.id === teacher.departmentId);
    const emuGroup = getUserEmulationGroup(teacher);
    const score = evaluation?.bghTotalScore ?? evaluation?.groupTotalScore ?? evaluation?.selfTotalScore ?? 0;
    return {
      teacher,
      evaluation,
      dept,
      emuGroup,
      score,
    };
  }).filter(({ teacher, evaluation, dept, emuGroup }) => {
    const status = evaluation ? evaluation.status : 'DRAFT';
    const ranking = evaluation?.bghRanking || evaluation?.groupRanking;

    const matchEmu = emulationFilter === 'ALL' || emuGroup === emulationFilter;
    const matchDept = selectedDeptId === 'ALL' || teacher.departmentId === selectedDeptId;
    const matchStatus = statusFilter === 'ALL' || status === statusFilter;
    const matchRanking = rankingFilter === 'ALL' || ranking === rankingFilter;
    const matchSearch =
      teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept?.name && dept.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchEmu && matchDept && matchStatus && matchRanking && matchSearch;
  });

  const handleStartApproval = (evaluation: Evaluation, teacher: User) => {
    setSelectedEval(evaluation);
    setSelectedTeacher(teacher);
    setIsApprovalModalOpen(true);
  };

  const handleOpenPrint = (evaluation: Evaluation, teacher: User) => {
    setSelectedEval(evaluation);
    setSelectedTeacher(teacher);
    setIsPrintModalOpen(true);
  };

  // Export CSV summary with Emulation Group column
  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Mã VC',
      'Họ và Tên',
      'Chức vụ',
      'Nhóm Thi Đua',
      'Tổ Chuyên Môn / Bộ Phận',
      'Trạng Thái',
      'Điểm Tự Chấm',
      'Điểm Tổ Chấm',
      'Điểm BGH Chấm',
      'Xếp Loại Cuối Cùng',
      'Đề Xuất Danh Hiệu Thi Đua'
    ];

    const rows = staffRows.map(({ teacher, evaluation, dept, emuGroup }, idx) => {
      const ranking = evaluation?.bghRanking || evaluation?.groupRanking;
      const emuMeta = EMULATION_GROUPS[emuGroup];
      const danhHieu = ranking === 'XUAT_SAC' ? 'Chiến sĩ thi đua cơ sở' : ranking === 'TOT' ? 'Lao động tiên tiến' : '';

      return [
        idx + 1,
        `"${teacher.teacherCode}"`,
        `"${teacher.fullName}"`,
        `"${teacher.title}"`,
        `"${emuMeta.shortName}"`,
        `"${dept?.name || ''}"`,
        `"${evaluation ? STATUS_DEFINITIONS[evaluation.status].label : 'Chưa nộp'}"`,
        evaluation?.selfTotalScore ?? '',
        evaluation?.groupTotalScore ?? '',
        evaluation?.bghTotalScore ?? '',
        `"${ranking ? RANKING_DEFINITIONS[ranking].label : ''}"`,
        `"${danhHieu}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bang_TongKet_ThiDua_2Nhom_ND233_${selectedPeriodId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top BGH Portal Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-indigo-700 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-rose-200 shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                  Bước 4: Ban Giám Hiệu Phê Duyệt &amp; Tổng Kết Thi Đua
                </span>
                <span className="text-xs text-slate-500">• Đợt: {currentPeriod?.name}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Bảng Thẩm Định, Phê Duyệt &amp; Tổng Kết Thi Đua Toàn Trường
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng kết xếp loại thi đua viên chức theo 02 nhóm thi đua: <strong>Nhóm Nhân viên</strong> và <strong>Nhóm Giáo viên, Tổ trưởng, Tổ phó</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Button In Bảng Tổng Kết 2 Nhóm Thi Đua */}
            <button
              onClick={() => setIsEmulationPrintOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              title="In bảng tổng kết kết quả thi đua phân theo 2 nhóm thi đua chuẩn Nghị định 233"
            >
              <Printer className="w-4 h-4 text-blue-700" />
              <span>In Bảng Tổng Kết 2 Nhóm Thi Đua</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Xuất Báo Cáo Excel/CSV</span>
            </button>
          </div>
        </div>

        {/* High Level Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => setStatusFilter('GROUP_REVIEWED')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'GROUP_REVIEWED'
                ? 'bg-rose-100/70 border-rose-400 ring-2 ring-rose-400/20'
                : 'bg-rose-50/50 border-rose-200 hover:bg-rose-100/50'
            }`}
          >
            <span className="text-[11px] font-bold text-rose-800 block">
              Chờ BGH Phê Duyệt (GROUP_REVIEWED)
            </span>
            <div className="text-2xl font-black text-rose-900 mt-0.5">{pendingBghCount} hồ sơ</div>
            <span className="text-[10px] text-rose-700 font-medium">Tổ đã thẩm định xong</span>
          </button>

          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-400/20'
                : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50'
            }`}
          >
            <span className="text-[11px] font-bold text-emerald-800 block">
              Đã Phê Duyệt Chính Thức (APPROVED)
            </span>
            <div className="text-2xl font-black text-emerald-900 mt-0.5">{approvedCount} hồ sơ</div>
            <span className="text-[10px] text-emerald-700 font-medium">Đã có quyết định</span>
          </button>

          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="text-[11px] font-bold text-blue-800 block">
              Tổng số Hoàn Thành Xuất Sắc
            </span>
            <div className="text-2xl font-black text-blue-900 mt-0.5">{countXuatSac} người</div>
            <span className="text-[10px] text-blue-700 font-medium">Toàn trường đề xuất khen thưởng</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[11px] font-bold text-slate-700 block">
              Tổng số viên chức đánh giá
            </span>
            <div className="text-2xl font-black text-slate-800 mt-0.5">{allStaff.length} người</div>
            <span className="text-[10px] text-slate-500 font-medium">Gồm 2 nhóm thi đua</span>
          </div>
        </div>

        {/* Emulation Groups Summary Cards (2 Nhóm Thi Đua Khi Tổng Kết) */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Tổng Kết &amp; Cân Đối Thi Đua Theo 02 Nhóm Viên Chức
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-amber-900">
              ⚡ Quy định NĐ 233: Tỷ lệ hoàn thành xuất sắc nhiệm vụ không quá 20% tổng số viên chức của mỗi nhóm thi đua
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nhóm 1: Giáo viên, Tổ trưởng, Tổ phó */}
            <div className={`p-4 rounded-xl border transition-all ${
              emulationFilter === 'GIAO_VIEN_TO_TRUONG' 
                ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-400/20' 
                : 'bg-emerald-50/40 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-emerald-950 uppercase flex items-center gap-1.5">
                      <span>Khối 1: Nhóm Giáo Viên, Tổ Trưởng, Tổ Phó</span>
                    </h4>
                    <span className="text-[10px] text-emerald-800 font-medium">
                      Đội ngũ trực tiếp giảng dạy &amp; quản lý chuyên môn ({groupGiaoVien.length} viên chức)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEmulationFilter(emulationFilter === 'GIAO_VIEN_TO_TRUONG' ? 'ALL' : 'GIAO_VIEN_TO_TRUONG')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                    emulationFilter === 'GIAO_VIEN_TO_TRUONG'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {emulationFilter === 'GIAO_VIEN_TO_TRUONG' ? 'Đang lọc nhóm này' : 'Lọc danh sách'}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-3 text-center">
                <div className="p-2 rounded-lg bg-white/90 border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-semibold">Tổng số VC</span>
                  <span className="text-base font-black text-slate-900">{groupGiaoVien.length}</span>
                </div>

                <div className="p-2 rounded-lg bg-white/90 border border-emerald-300 shadow-2xs">
                  <span className="text-[10px] text-emerald-700 block font-bold">Xuất sắc</span>
                  <span className="text-base font-black text-emerald-800">{xuatSacGiaoVien}</span>
                  <span className={`text-[9px] font-bold block ${percentXSGiaoVien > 20 ? 'text-rose-600 font-black' : 'text-emerald-700'}`}>
                    {percentXSGiaoVien.toFixed(1)}% {percentXSGiaoVien > 20 ? '⚠️ (>20%)' : '(<=20%)'}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white/90 border border-blue-200 shadow-2xs">
                  <span className="text-[10px] text-blue-700 block font-bold">Tốt</span>
                  <span className="text-base font-black text-blue-800">{totGiaoVien}</span>
                  <span className="text-[9px] text-blue-600 font-semibold">
                    {groupGiaoVien.length > 0 ? ((totGiaoVien / groupGiaoVien.length) * 100).toFixed(0) : 0}%
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white/90 border border-amber-200 shadow-2xs">
                  <span className="text-[10px] text-amber-700 block font-bold">Hoàn thành</span>
                  <span className="text-base font-black text-amber-800">{hoanThanhGiaoVien}</span>
                  <span className="text-[9px] text-amber-600 font-semibold">
                    {groupGiaoVien.length > 0 ? ((hoanThanhGiaoVien / groupGiaoVien.length) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Nhóm 2: Nhân viên */}
            <div className={`p-4 rounded-xl border transition-all ${
              emulationFilter === 'NHAN_VIEN' 
                ? 'bg-sky-50/90 border-sky-400 ring-2 ring-sky-400/20' 
                : 'bg-sky-50/40 border-sky-200'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-sky-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-sky-950 uppercase flex items-center gap-1.5">
                      <span>Khối 2: Nhóm Nhân Viên</span>
                    </h4>
                    <span className="text-[10px] text-sky-800 font-medium">
                      Hành chính, kế toán, y tế, văn thư, thủ quỹ, thiết bị, thư viện ({groupNhanVien.length} nhân viên)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEmulationFilter(emulationFilter === 'NHAN_VIEN' ? 'ALL' : 'NHAN_VIEN')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                    emulationFilter === 'NHAN_VIEN'
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white hover:bg-sky-100 text-sky-800 border-sky-300'
                  }`}
                >
                  {emulationFilter === 'NHAN_VIEN' ? 'Đang lọc nhóm này' : 'Lọc danh sách'}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-3 text-center">
                <div className="p-2 rounded-lg bg-white/90 border border-sky-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-semibold">Tổng số NV</span>
                  <span className="text-base font-black text-slate-900">{groupNhanVien.length}</span>
                </div>

                <div className="p-2 rounded-lg bg-white/90 border border-sky-300 shadow-2xs">
                  <span className="text-[10px] text-sky-700 block font-bold">Xuất sắc</span>
                  <span className="text-base font-black text-sky-800">{xuatSacNhanVien}</span>
                  <span className={`text-[9px] font-bold block ${percentXSNhanVien > 20 ? 'text-rose-600 font-black' : 'text-sky-700'}`}>
                    {percentXSNhanVien.toFixed(1)}% {percentXSNhanVien > 20 ? '⚠️ (>20%)' : '(<=20%)'}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white/90 border border-blue-200 shadow-2xs">
                  <span className="text-[10px] text-blue-700 block font-bold">Tốt</span>
                  <span className="text-base font-black text-blue-800">{totNhanVien}</span>
                  <span className="text-[9px] text-blue-600 font-semibold">
                    {groupNhanVien.length > 0 ? ((totNhanVien / groupNhanVien.length) * 100).toFixed(0) : 0}%
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white/90 border border-amber-200 shadow-2xs">
                  <span className="text-[10px] text-amber-700 block font-bold">Hoàn thành</span>
                  <span className="text-base font-black text-amber-800">{hoanThanhNhanVien}</span>
                  <span className="text-[9px] text-amber-600 font-semibold">
                    {groupNhanVien.length > 0 ? ((hoanThanhNhanVien / groupNhanVien.length) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          
          {/* Row 1: Emulation Group Tab Buttons & View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Nhóm thi đua:
              </span>
              <button
                onClick={() => setEmulationFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  emulationFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Tất cả ({allStaff.length})
              </button>
              <button
                onClick={() => setEmulationFilter('GIAO_VIEN_TO_TRUONG')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  emulationFilter === 'GIAO_VIEN_TO_TRUONG'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Nhóm GV, Tổ trưởng, Tổ phó ({groupGiaoVien.length})</span>
              </button>
              <button
                onClick={() => setEmulationFilter('NHAN_VIEN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  emulationFilter === 'NHAN_VIEN'
                    ? 'bg-sky-700 text-white shadow-2xs'
                    : 'bg-white border border-sky-300 text-sky-800 hover:bg-sky-50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Nhóm Nhân viên ({groupNhanVien.length})</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSummaryViewMode('EMULATION_SPLIT')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  summaryViewMode === 'EMULATION_SPLIT'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Chia 2 bảng thi đua</span>
              </button>
              <button
                type="button"
                onClick={() => setSummaryViewMode('ALL_LIST')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  summaryViewMode === 'ALL_LIST'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart className="w-3.5 h-3.5 text-blue-600" />
                <span>Danh sách gộp</span>
              </button>
            </div>
          </div>

          {/* Row 2: Department, Search & Status Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Department dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Tổ bộ môn / Phòng ban:</span>
              <select
                value={selectedDeptId}
                onChange={e => setSelectedDeptId(e.target.value)}
                aria-label="Chọn tổ chuyên môn"
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-rose-500"
              >
                <option value="ALL">Tất cả đơn vị ({departments.length - 1})</option>
                {departments
                  .filter(d => d.id !== 'dept-bgh')
                  .map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên viên chức, mã, chức vụ..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Status Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-600">Trạng thái hồ sơ:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Tất cả ({staffRows.length})
            </button>
            <button
              onClick={() => setStatusFilter('GROUP_REVIEWED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'GROUP_REVIEWED'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Chờ BGH Duyệt ({pendingBghCount})
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Đã Phê Duyệt ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('SUBMITTED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'SUBMITTED'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Chờ Tổ Chấm ({pendingGroupCount})
            </button>
          </div>
        </div>

        {/* Content View: EMULATION_SPLIT (2 separate emulation tables) vs ALL_LIST */}
        {summaryViewMode === 'EMULATION_SPLIT' ? (
          <div className="p-4 sm:p-6 space-y-8">
            
            {/* 1. KHỐI 1: BẢNG TỔNG KẾT NHÓM GIÁO VIÊN, TỔ TRƯỞNG, TỔ PHÓ */}
            {(emulationFilter === 'ALL' || emulationFilter === 'GIAO_VIEN_TO_TRUONG') && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-sm shrink-0">
                      I
                    </span>
                    <div>
                      <h3 className="font-black text-xs sm:text-sm uppercase text-emerald-950 flex items-center gap-2">
                        <span>BẢNG TỔNG KẾT KHỐI 1: NHÓM GIÁO VIÊN, TỔ TRƯỞNG, TỔ PHÓ</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                          {groupGiaoVien.length} người
                        </span>
                      </h3>
                      <p className="text-[11px] text-emerald-800">
                        Xếp hạng theo điểm số phê duyệt cuối cùng • Tỷ lệ xuất sắc: <strong>{xuatSacGiaoVien}/{groupGiaoVien.length} ({percentXSGiaoVien.toFixed(1)}%)</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right self-start sm:self-auto">
                    <span className="text-[11px] font-bold text-emerald-900 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg inline-block">
                      Chỉ tiêu XS: {xuatSacGiaoVien}/{Math.max(1, Math.round(groupGiaoVien.length * 0.2))} người (tối đa 20%)
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-semibold text-center">
                        <th className="py-2.5 px-3 w-12 border-r border-slate-200">Thứ hạng</th>
                        <th className="py-2.5 px-3 w-20 border-r border-slate-200">Mã VC</th>
                        <th className="py-2.5 px-3 text-left border-r border-slate-200">Họ và Tên Viên Chức</th>
                        <th className="py-2.5 px-3 text-left border-r border-slate-200">Chức vụ / Nhiệm vụ</th>
                        <th className="py-2.5 px-3 text-left border-r border-slate-200">Tổ chuyên môn</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Trạng thái</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Tự chấm</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Tổ chấm</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">BGH chấm</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Xếp loại</th>
                        <th className="py-2.5 px-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffRows
                        .filter(item => item.emuGroup === 'GIAO_VIEN_TO_TRUONG')
                        .sort((a, b) => b.score - a.score)
                        .map((item, idx) => {
                          const status = item.evaluation ? item.evaluation.status : 'DRAFT';
                          const statusMeta = STATUS_DEFINITIONS[status];
                          const rankingKey = item.evaluation?.bghRanking || item.evaluation?.groupRanking;
                          const rankingMeta = rankingKey ? RANKING_DEFINITIONS[rankingKey] : null;

                          return (
                            <tr key={item.teacher.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 text-center font-bold text-slate-700 border-r border-slate-100">
                                #{idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-900 border-r border-slate-100 text-center">
                                {item.teacher.teacherCode}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-100">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900">{item.teacher.fullName}</span>
                                  {isDepartmentLeaderOrDeputy(item.teacher) && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                      Tổ trưởng/Tổ phó (100đ có Mục 4)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 border-r border-slate-100">
                                <span className="font-semibold text-emerald-950">{item.teacher.title}</span>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-700 border-r border-slate-100">
                                {item.dept?.name}
                              </td>
                              <td className="py-2.5 px-3 text-center border-r border-slate-100">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.color}`}>
                                  {statusMeta.label}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 border-r border-slate-100">
                                {item.evaluation?.selfTotalScore ? `${item.evaluation.selfTotalScore}đ` : '---'}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700 border-r border-slate-100">
                                {item.evaluation?.groupTotalScore !== null && item.evaluation?.groupTotalScore !== undefined 
                                  ? `${item.evaluation.groupTotalScore}đ` 
                                  : '---'}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-black text-rose-800 border-r border-slate-100">
                                {item.evaluation?.bghTotalScore !== null && item.evaluation?.bghTotalScore !== undefined 
                                  ? `${item.evaluation.bghTotalScore}đ` 
                                  : '---'}
                              </td>
                              <td className="py-2.5 px-3 text-center border-r border-slate-100">
                                {rankingMeta ? (
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rankingMeta.color}`}>
                                    {rankingMeta.shortLabel}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px] italic">Chưa xếp loại</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {item.evaluation && (
                                    <button
                                      onClick={() => handleStartApproval(item.evaluation!, item.teacher)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 ${
                                        status === 'GROUP_REVIEWED'
                                          ? 'bg-rose-700 hover:bg-rose-800 text-white'
                                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      <span>{status === 'GROUP_REVIEWED' ? 'Duyệt' : 'Xem'}</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  )}
                                  {item.evaluation && (
                                    <button
                                      onClick={() => handleOpenPrint(item.evaluation!, item.teacher)}
                                      className="p-1 text-slate-500 hover:text-slate-900 rounded"
                                      title="In phiếu cá nhân"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>
                                  )}
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

            {/* 2. KHỐI 2: BẢNG TỔNG KẾT NHÓM NHÂN VIÊN */}
            {(emulationFilter === 'ALL' || emulationFilter === 'NHAN_VIEN') && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center font-black text-sm shrink-0">
                      II
                    </span>
                    <div>
                      <h3 className="font-black text-xs sm:text-sm uppercase text-sky-950 flex items-center gap-2">
                        <span>BẢNG TỔNG KẾT KHỐI 2: NHÓM NHÂN VIÊN</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-200 text-sky-900">
                          {groupNhanVien.length} người
                        </span>
                      </h3>
                      <p className="text-[11px] text-sky-800">
                        Cán bộ hành chính, kế toán, y tế, văn thư, thủ quỹ, thiết bị, thư viện • Tỷ lệ xuất sắc: <strong>{xuatSacNhanVien}/{groupNhanVien.length} ({percentXSNhanVien.toFixed(1)}%)</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right self-start sm:self-auto">
                    <span className="text-[11px] font-bold text-sky-900 bg-white border border-sky-300 px-2.5 py-1 rounded-lg inline-block">
                      Chỉ tiêu XS: {xuatSacNhanVien}/{Math.max(1, Math.round(groupNhanVien.length * 0.2))} người (tối đa 20%)
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-semibold text-center">
                        <th className="py-2.5 px-3 w-12 border-r border-slate-200">Thứ hạng</th>
                        <th className="py-2.5 px-3 w-20 border-r border-slate-200">Mã VC</th>
                        <th className="py-2.5 px-3 text-left border-r border-slate-200">Họ và Tên Nhân Viên</th>
                        <th className="py-2.5 px-3 text-left border-r border-slate-200">Vị trí việc làm / Chức danh</th>
                        <th className="py-2.5 px-3 text-left border-r border-slate-200">Đơn vị / Phòng</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Trạng thái</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Tự chấm</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Tổ chấm</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">BGH chấm</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Xếp loại</th>
                        <th className="py-2.5 px-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffRows
                        .filter(item => item.emuGroup === 'NHAN_VIEN')
                        .sort((a, b) => b.score - a.score)
                        .map((item, idx) => {
                          const status = item.evaluation ? item.evaluation.status : 'DRAFT';
                          const statusMeta = STATUS_DEFINITIONS[status];
                          const rankingKey = item.evaluation?.bghRanking || item.evaluation?.groupRanking;
                          const rankingMeta = rankingKey ? RANKING_DEFINITIONS[rankingKey] : null;

                          return (
                            <tr key={item.teacher.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 text-center font-bold text-slate-700 border-r border-slate-100">
                                #{idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-900 border-r border-slate-100 text-center">
                                {item.teacher.teacherCode}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-100">
                                <div className="font-bold text-slate-900">{item.teacher.fullName}</div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 border-r border-slate-100">
                                <span className="font-semibold text-sky-950">{item.teacher.title}</span>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-700 border-r border-slate-100">
                                {item.dept?.name}
                              </td>
                              <td className="py-2.5 px-3 text-center border-r border-slate-100">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.color}`}>
                                  {statusMeta.label}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 border-r border-slate-100">
                                {item.evaluation?.selfTotalScore ? `${item.evaluation.selfTotalScore}đ` : '---'}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700 border-r border-slate-100">
                                {item.evaluation?.groupTotalScore !== null && item.evaluation?.groupTotalScore !== undefined 
                                  ? `${item.evaluation.groupTotalScore}đ` 
                                  : '---'}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-black text-rose-800 border-r border-slate-100">
                                {item.evaluation?.bghTotalScore !== null && item.evaluation?.bghTotalScore !== undefined 
                                  ? `${item.evaluation.bghTotalScore}đ` 
                                  : '---'}
                              </td>
                              <td className="py-2.5 px-3 text-center border-r border-slate-100">
                                {rankingMeta ? (
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rankingMeta.color}`}>
                                    {rankingMeta.shortLabel}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px] italic">Chưa xếp loại</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {item.evaluation && (
                                    <button
                                      onClick={() => handleStartApproval(item.evaluation!, item.teacher)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 ${
                                        status === 'GROUP_REVIEWED'
                                          ? 'bg-rose-700 hover:bg-rose-800 text-white'
                                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      <span>{status === 'GROUP_REVIEWED' ? 'Duyệt' : 'Xem'}</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  )}
                                  {item.evaluation && (
                                    <button
                                      onClick={() => handleOpenPrint(item.evaluation!, item.teacher)}
                                      className="p-1 text-slate-500 hover:text-slate-900 rounded"
                                      title="In phiếu cá nhân"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>
                                  )}
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
          </div>
        ) : (
          /* Standard Combined Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold">Mã VC</th>
                  <th className="py-3 px-4 font-semibold">Họ và Tên Viên Chức</th>
                  <th className="py-3 px-4 font-semibold">Nhóm Thi Đua</th>
                  <th className="py-3 px-4 font-semibold">Tổ Chuyên Môn / Đơn Vị</th>
                  <th className="py-3 px-4 font-semibold text-center">Trạng Thái</th>
                  <th className="py-3 px-4 font-semibold text-center">Điểm Tự Chấm</th>
                  <th className="py-3 px-4 font-semibold text-center">Điểm Tổ Chấm</th>
                  <th className="py-3 px-4 font-semibold text-center">Điểm BGH Chấm</th>
                  <th className="py-3 px-4 font-semibold text-center">Xếp Loại Cuối Cùng</th>
                  <th className="py-3 px-4 font-semibold text-center">Thao Tác BGH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                      Không tìm thấy hồ sơ viên chức nào phù hợp với điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  staffRows.map(({ teacher, evaluation, dept, emuGroup }) => {
                    const status = evaluation ? evaluation.status : 'DRAFT';
                    const statusMeta = STATUS_DEFINITIONS[status];
                    const rankingKey = evaluation?.bghRanking || evaluation?.groupRanking;
                    const rankingMeta = rankingKey ? RANKING_DEFINITIONS[rankingKey] : null;
                    const emuMeta = EMULATION_GROUPS[emuGroup];

                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-600">
                          {teacher.teacherCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900">{teacher.fullName}</span>
                            {isDepartmentLeaderOrDeputy(teacher) && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                Tổ trưởng/Tổ phó (100đ có Mục 4)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{teacher.title}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${emuMeta.badgeLight}`}>
                            {emuMeta.shortName}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {dept?.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                          {evaluation?.selfTotalScore ? `${evaluation.selfTotalScore}đ` : '---'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">
                          {evaluation?.groupTotalScore !== null && evaluation?.groupTotalScore !== undefined 
                            ? `${evaluation.groupTotalScore}đ` 
                            : '---'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black text-rose-800">
                          {evaluation?.bghTotalScore !== null && evaluation?.bghTotalScore !== undefined 
                            ? `${evaluation.bghTotalScore}đ` 
                            : '---'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {rankingMeta ? (
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rankingMeta.color}`}>
                              {rankingMeta.shortLabel}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Chưa xếp loại</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {evaluation && (
                              <button
                                onClick={() => handleStartApproval(evaluation, teacher)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 ${
                                  status === 'GROUP_REVIEWED'
                                    ? 'bg-rose-700 hover:bg-rose-800 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                <span>{status === 'GROUP_REVIEWED' ? 'Xem xét & Duyệt' : 'Xem chi tiết'}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {evaluation && (
                              <button
                                onClick={() => handleOpenPrint(evaluation, teacher)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                                title="In phiếu đánh giá"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {isApprovalModalOpen && selectedEval && selectedTeacher && (
        <BghApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          evaluation={selectedEval}
          teacher={selectedTeacher}
        />
      )}

      {/* Print Individual Evaluation Modal */}
      {isPrintModalOpen && selectedEval && selectedTeacher && (
        <PrintEvaluationModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          evaluation={selectedEval}
          teacher={selectedTeacher}
        />
      )}

      {/* Print Emulation Summary Modal (Phân theo 2 nhóm thi đua) */}
      {isEmulationPrintOpen && currentPeriod && (
        <PrintEmulationSummaryModal
          isOpen={isEmulationPrintOpen}
          onClose={() => setIsEmulationPrintOpen(false)}
          period={currentPeriod}
          users={users}
          evaluations={evaluations}
          departments={departments}
        />
      )}
    </div>
  );
};
