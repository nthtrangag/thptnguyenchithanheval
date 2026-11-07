import React, { useState } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter, 
  Search, 
  FileText, 
  ChevronRight,
  Printer,
  Sparkles,
  Award,
  RotateCcw,
  Undo2,
  AlertTriangle,
  X
} from 'lucide-react';
import { Evaluation, EvaluationStatus, User } from '../../types';
import { STATUS_DEFINITIONS, RANKING_DEFINITIONS, formatDate, isDepartmentLeaderOrDeputy } from '../../utils/evaluationRules';
import { GroupReviewModal } from './GroupReviewModal';
import { PrintEvaluationModal } from '../PrintEvaluationModal';

export const DepartmentHeadView: React.FC = () => {
  const {
    currentUser,
    users,
    evaluations,
    selectedPeriodId,
    periods,
    getUserDepartment,
    departments,
    revertEvaluationSubmission,
  } = useEvaluation();

  const isAdmin = currentUser.roleId === 'ADMIN';
  const [adminDeptId, setAdminDeptId] = useState<string>('dept-toan');
  const targetDeptId = isAdmin ? adminDeptId : currentUser.departmentId;
  const userDept = getUserDepartment(targetDeptId);
  const currentPeriod = periods.find(p => p.id === selectedPeriodId);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'ALL' | EvaluationStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Revert / Return dossier modal state
  const [returnTarget, setReturnTarget] = useState<{ evalId: string; teacherName: string; teacherCode: string } | null>(null);
  const [returnReasonInput, setReturnReasonInput] = useState('');
  const [returnToast, setReturnToast] = useState<string | null>(null);

  // Teachers in this department (excluding department head themselves or including them if needed)
  const deptTeachers = users.filter(u => u.departmentId === targetDeptId);

  // Evaluations for this department in this period
  const deptEvals = evaluations.filter(
    e => e.departmentId === targetDeptId && e.periodId === selectedPeriodId
  );

  // Counts
  const submittedCount = deptEvals.filter(e => e.status === 'SUBMITTED').length;
  const reviewedCount = deptEvals.filter(e => e.status === 'GROUP_REVIEWED').length;
  const approvedCount = deptEvals.filter(e => e.status === 'APPROVED').length;
  const draftCount = deptEvals.filter(e => e.status === 'DRAFT').length;

  // Filtered teachers list
  const teacherRows = deptTeachers.map(teacher => {
    const evaluation = deptEvals.find(e => e.userId === teacher.id);
    return {
      teacher,
      evaluation,
    };
  }).filter(({ teacher, evaluation }) => {
    const status = evaluation ? evaluation.status : 'DRAFT';
    const matchStatus = statusFilter === 'ALL' || status === statusFilter;
    const matchSearch =
      teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.subject && teacher.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const handleStartReview = (evaluation: Evaluation, teacher: User) => {
    setSelectedEval(evaluation);
    setSelectedTeacher(teacher);
    setIsReviewModalOpen(true);
  };

  const handleOpenPrint = (evaluation: Evaluation, teacher: User) => {
    setSelectedEval(evaluation);
    setSelectedTeacher(teacher);
    setIsPrintModalOpen(true);
  };

  // Open return confirmation modal
  const handleOpenReturnModal = (evaluation: Evaluation, teacher: User) => {
    setReturnTarget({
      evalId: evaluation.id,
      teacherName: teacher.fullName,
      teacherCode: teacher.teacherCode,
    });
    setReturnReasonInput(
      'Hồ sơ còn thiếu minh chứng bắt buộc theo quy định / có một số tiêu chí tự chấm chưa phù hợp với tỷ lệ hoàn thành. Đề nghị giáo viên rà soát, bổ sung minh chứng và tự đánh giá lại.'
    );
  };

  // Confirm returning dossier to teacher as DRAFT
  const handleConfirmReturn = () => {
    if (!returnTarget) return;
    revertEvaluationSubmission(returnTarget.evalId, returnReasonInput);
    setReturnToast(
      `Đã xóa trạng thái đã nộp của GV ${returnTarget.teacherName} (${returnTarget.teacherCode}). Hồ sơ đã chuyển về Bản nháp (DRAFT) để giáo viên bổ sung minh chứng và thực hiện lại.`
    );
    setReturnTarget(null);
    setReturnReasonInput('');
    setTimeout(() => setReturnToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-200 font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Bước 3: Tổ Trưởng Chuyên Môn
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {userDept?.name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Bảng Thẩm Định &amp; Đánh Giá Cấp Tổ Chuyên Môn
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem xét hồ sơ tự đánh giá &amp; minh chứng của giáo viên trong tổ, cho điểm group_score và gửi lên BGH
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            {isAdmin && (
              <div className="flex items-center gap-2 bg-purple-50 p-2 rounded-xl border border-purple-200 shadow-2xs">
                <span className="text-xs font-bold text-purple-900">Admin chọn tổ xem:</span>
                <select
                  value={adminDeptId}
                  onChange={e => setAdminDeptId(e.target.value)}
                  className="text-xs font-bold text-purple-900 bg-white border border-purple-300 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-purple-400 cursor-pointer"
                >
                  {departments
                    .filter(d => d.id !== 'dept-bgh')
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div className="text-right">
              <div className="font-bold text-slate-800">{currentUser.fullName}</div>
              <div className="text-slate-500">{currentUser.title}</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => setStatusFilter('SUBMITTED')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'SUBMITTED'
                ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-400/20'
                : 'bg-amber-50/50 border-amber-200 hover:bg-amber-100/50'
            }`}
          >
            <span className="text-[11px] font-bold text-amber-800 block">Cần Chấm Ngay (SUBMITTED)</span>
            <div className="text-2xl font-black text-amber-900 mt-0.5">{submittedCount}</div>
            <span className="text-[10px] text-amber-700">Giáo viên đã nộp hồ sơ</span>
          </button>

          <button
            onClick={() => setStatusFilter('GROUP_REVIEWED')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'GROUP_REVIEWED'
                ? 'bg-indigo-100/70 border-indigo-400 ring-2 ring-indigo-400/20'
                : 'bg-indigo-50/50 border-indigo-200 hover:bg-indigo-100/50'
            }`}
          >
            <span className="text-[11px] font-bold text-indigo-800 block">Đã Duyệt Tổ (GROUP_REVIEWED)</span>
            <div className="text-2xl font-black text-indigo-900 mt-0.5">{reviewedCount}</div>
            <span className="text-[10px] text-indigo-700">Đang chờ BGH duyệt</span>
          </button>

          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-400/20'
                : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50'
            }`}
          >
            <span className="text-[11px] font-bold text-emerald-800 block">Đã Phê Duyệt (APPROVED)</span>
            <div className="text-2xl font-black text-emerald-900 mt-0.5">{approvedCount}</div>
            <span className="text-[10px] text-emerald-700">Có kết quả chính thức</span>
          </button>

          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'DRAFT'
                ? 'bg-slate-200 border-slate-400 ring-2 ring-slate-400/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-700 block">Bản Nháp (DRAFT)</span>
            <div className="text-2xl font-black text-slate-800 mt-0.5">{draftCount}</div>
            <span className="text-[10px] text-slate-500">Giáo viên chưa nộp</span>
          </button>
        </div>
      </div>

      {/* Teachers Table Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Lọc trạng thái:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Tất cả ({deptTeachers.length})
            </button>
            <button
              onClick={() => setStatusFilter('SUBMITTED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'SUBMITTED'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Chờ Tổ Chấm ({submittedCount})
            </button>
            <button
              onClick={() => setStatusFilter('GROUP_REVIEWED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'GROUP_REVIEWED'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Đã Duyệt Tổ ({reviewedCount})
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Đã Hoàn Tất ({approvedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm giáo viên theo tên, mã..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Mã VC</th>
                <th className="py-3 px-4 font-semibold">Giáo Viên</th>
                <th className="py-3 px-4 font-semibold">Môn Dạy</th>
                <th className="py-3 px-4 font-semibold text-center">Trạng Thái Hồ Sơ</th>
                <th className="py-3 px-4 font-semibold text-center">GV Tự Chấm</th>
                <th className="py-3 px-4 font-semibold text-center">Tổ Chấm (group_score)</th>
                <th className="py-3 px-4 font-semibold text-center">BGH Chấm (bgh_score)</th>
                <th className="py-3 px-4 font-semibold text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teacherRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Không có giáo viên nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                teacherRows.map(({ teacher, evaluation }) => {
                  const status = evaluation ? evaluation.status : 'DRAFT';
                  const statusMeta = STATUS_DEFINITIONS[status];
                  const canReview = evaluation && (status === 'SUBMITTED' || status === 'GROUP_REVIEWED');

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
                              Tổ Phó / Tổ Trưởng (100đ có Mục 4)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{teacher.title}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {teacher.subject || '---'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {evaluation?.selfTotalScore ? (
                          <span className="font-bold text-emerald-700 text-sm">
                            {evaluation.selfTotalScore}đ
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa nộp</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {evaluation?.groupTotalScore !== null && evaluation?.groupTotalScore !== undefined ? (
                          <span className="font-bold text-amber-800 text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {evaluation.groupTotalScore}đ
                          </span>
                        ) : (
                          <span className="text-slate-400">---</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {evaluation?.bghTotalScore !== null && evaluation?.bghTotalScore !== undefined ? (
                          <span className="font-bold text-rose-800 text-sm bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {evaluation.bghTotalScore}đ
                          </span>
                        ) : (
                          <span className="text-slate-400">---</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {canReview && (
                            <>
                              <button
                                onClick={() => handleStartReview(evaluation, teacher)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 ${
                                  status === 'SUBMITTED'
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                <span>{status === 'SUBMITTED' ? 'Tiến hành chấm' : 'Xem / Sửa điểm tổ'}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>

                              {/* Button to Revert Submission / Return Dossier to Teacher for Redo */}
                              <button
                                onClick={() => handleOpenReturnModal(evaluation, teacher)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 flex items-center gap-1 transition-all shadow-2xs"
                                title="Xóa nộp hồ sơ: Chuyển hồ sơ về Bản nháp để giáo viên bổ sung minh chứng hoặc sửa lại điểm"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                <span>Xóa nộp / Trả lại</span>
                              </button>
                            </>
                          )}

                          {status === 'DRAFT' && (
                            <div className="text-center">
                              {evaluation?.returnReason ? (
                                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-block">
                                  Đã trả lại cho GV làm lại
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  Đang chờ GV gửi
                                </span>
                              )}
                            </div>
                          )}

                          {status === 'APPROVED' && evaluation && (
                            <button
                              onClick={() => handleOpenPrint(evaluation, teacher)}
                              className="px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 font-medium"
                              title="In phiếu đánh giá"
                            >
                              <Printer className="w-3 h-3" />
                              <span>In phiếu</span>
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
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && selectedEval && selectedTeacher && (
        <GroupReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          evaluation={selectedEval}
          teacher={selectedTeacher}
        />
      )}

      {/* Print Modal */}
      {isPrintModalOpen && selectedEval && selectedTeacher && (
        <PrintEvaluationModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          evaluation={selectedEval}
          teacher={selectedTeacher}
        />
      )}

      {/* Return Dossier Modal (Xóa nộp hồ sơ để GV thực hiện lại) */}
      {returnTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-900">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <h3 className="text-sm font-bold">Xác Nhận Xóa Nộp &amp; Trả Hồ Sơ Cho Giáo Viên</h3>
              </div>
              <button
                type="button"
                onClick={() => setReturnTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed">
                Bạn đang thực hiện thao tác hoàn trả hồ sơ của giáo viên{' '}
                <strong>{returnTarget.teacherName}</strong> (Mã VC: {returnTarget.teacherCode}).{' '}
                Hồ sơ sẽ được chuyển về trạng thái <strong>Bản Nháp (DRAFT)</strong> và mở khóa toàn bộ để giáo viên có thể chỉnh sửa điểm và bổ sung minh chứng.
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Lý do hoàn trả hồ sơ (Giáo viên sẽ nhìn thấy thông báo này):
                </label>
                <textarea
                  rows={3}
                  value={returnReasonInput}
                  onChange={e => setReturnReasonInput(e.target.value)}
                  placeholder="Nhập lý do hoặc hướng dẫn giáo viên bổ sung minh chứng..."
                  className="w-full p-3 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>

              {/* Quick Suggestion Reason Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">Chọn nhanh lý do mẫu:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Thiếu minh chứng bắt buộc theo quy định.',
                    'Điểm tự chấm chưa khớp với tỷ lệ hoàn thành công việc.',
                    'Cần bổ sung kế hoạch bài dạy và giáo án minh chứng.',
                    'Cần đính kèm quyết định và chứng chỉ bồi dưỡng chuyên môn.',
                  ].map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReturnReasonInput(sug)}
                      className="text-[10px] bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 px-2 py-1 rounded-lg transition-colors text-slate-700 text-left"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setReturnTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xác nhận xóa nộp &amp; Trả hồ sơ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {returnToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-2 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold">Đã xử lý thành công!</div>
            <div className="text-slate-300 text-[11px] mt-0.5">{returnToast}</div>
          </div>
        </div>
      )}
    </div>
  );
};
