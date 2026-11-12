import React, { useState, useEffect } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { 
  X, 
  Award, 
  CheckCircle2, 
  ShieldAlert, 
  Paperclip, 
  FileText, 
  Sparkles, 
  Check, 
  Building2,
  Stamp,
  Trash2
} from 'lucide-react';
import { Evaluation, User, Criterion, RankingLevel } from '../../types';
import { calculateTotalScore, determineRanking, RANKING_DEFINITIONS, isDepartmentLeaderOrDeputy, isAccountingStaff, isOfficeHead, isClericalStaff, isEquipmentStaff, isMedicalStaff } from '../../utils/evaluationRules';

interface BghApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: Evaluation;
  teacher: User;
}

export const BghApprovalModal: React.FC<BghApprovalModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  teacher,
}) => {
  const {
    categories: allCategories,
    criteria: allCriteria,
    getUserCriteria,
    evaluationDetails,
    submitBghApproval,
    resetEvaluationByBgh,
    getUserDepartment,
    getUserById,
  } = useEvaluation();

  const isHeadOfOffice = isOfficeHead(teacher);
  const isEquipment = isEquipmentStaff(teacher);
  const isMedical = isMedicalStaff(teacher);
  const isClerical = isClericalStaff(teacher);
  const isLeader = isDepartmentLeaderOrDeputy(teacher);
  const isAccounting = isAccountingStaff(teacher);
  const { categories, criteria } = getUserCriteria(teacher);

  const dept = getUserDepartment(teacher.departmentId);
  const evalDetails = evaluationDetails.filter(d => d.evaluationId === evaluation.id);
  const reviewer = evaluation.groupReviewerId ? getUserById(evaluation.groupReviewerId) : null;

  // BGH score state
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [ranking, setRanking] = useState<RankingLevel>(
    evaluation.bghRanking || evaluation.groupRanking || evaluation.selfRanking || 'TOT'
  );
  const [generalComment, setGeneralComment] = useState(
    evaluation.generalBghComment ||
      `Ban Giám hiệu thống nhất với kết quả thẩm định của Tổ chuyên môn. Đánh giá cao tinh thần trách nhiệm và kết quả thực hiện nhiệm vụ của đồng chí ${teacher.fullName}.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialScores: Record<string, number> = {};
    const initialNotes: Record<string, string> = {};

    evalDetails.forEach(d => {
      // Mặc định BGH khởi tạo là 0 điểm (hoặc giữ bghScore nếu đã chấm trước đó)
      const score = d.bghScore !== null && d.bghScore !== undefined
        ? d.bghScore
        : 0;
      initialScores[d.criterionId] = score;
      if (d.bghNote) initialNotes[d.criterionId] = d.bghNote;
    });

    setScores(initialScores);
    setNotes(initialNotes);

    const initialRanking = evaluation.bghRanking || 'TOT';
    setRanking(initialRanking);
  }, [evaluation.id]);

  if (!isOpen) return null;

  const totalBghScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const maxPossible = criteria.reduce((sum, c) => sum + c.maxScore, 0);

  const handleScoreChange = (criterionId: string, score: number) => {
    setScores(prev => ({ ...prev, [criterionId]: score }));
  };

  const handleNoteChange = (criterionId: string, text: string) => {
    setNotes(prev => ({ ...prev, [criterionId]: text }));
  };

  // Quick action: Kế thừa điểm đánh giá của Tổ chuyên môn (Lấy groupScore, nếu chưa có lấy 0)
  const handleAdoptGroupScores = () => {
    const matched: Record<string, number> = {};
    evalDetails.forEach(d => {
      const score = d.groupScore !== null && d.groupScore !== undefined ? d.groupScore : 0;
      matched[d.criterionId] = score;
    });
    setScores(matched);
    if (evaluation.groupRanking) {
      setRanking(evaluation.groupRanking);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Xác nhận phê duyệt kết quả chính thức cho giáo viên ${teacher.fullName} với mức xếp loại: "${RANKING_DEFINITIONS[ranking].label}"? Trạng thái sẽ chuyển thành APPROVED.`)) {
      return;
    }

    setIsSubmitting(true);
    const updates = criteria.map(c => ({
      criterionId: c.id,
      bghScore: scores[c.id] || 0,
      bghNote: notes[c.id] || '',
    }));

    submitBghApproval(evaluation.id, updates, ranking, generalComment);
    setIsSubmitting(false);
    onClose();
  };

  const handleResetEvaluation = () => {
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA TOÀN BỘ PHIẾU ĐÁNH GIÁ (cả điểm tự chấm, điểm tổ thẩm định và điểm BGH) của giáo viên ${teacher.fullName} và trả về trạng thái ban đầu chưa đánh giá không?`)) {
      return;
    }

    const reason = prompt('Nhập lý do xóa/hủy phiếu để giáo viên lập lại từ đầu:', 'Ban Giám Hiệu kiểm tra phát hiện sai sót, yêu cầu hủy phiếu và lập lại từ đầu.');
    if (reason === null) return; // Cancelled

    resetEvaluationByBgh(evaluation.id, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                  Bước 4: Ban Giám Hiệu Phê Duyệt Cuối Cùng
                </span>
                <span className="text-xs text-rose-200 font-mono">
                  Mã VC: {teacher.teacherCode}
                </span>
                {isEquipment && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-400 text-purple-950 shadow-2xs">
                    Nhân viên Thiết bị, thí nghiệm (100đ)
                  </span>
                )}
                {isHeadOfOffice && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-400 text-indigo-950 shadow-2xs">
                    Tổ Trưởng Tổ Văn Phòng - Văn Thư (100đ)
                  </span>
                )}
                {isClerical && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-400 text-sky-950 shadow-2xs">
                    Nhân viên Văn thư (100đ)
                  </span>
                )}
                {isAccounting && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-400 text-teal-950 shadow-2xs">
                    Nhân viên Kế toán (100đ)
                  </span>
                )}
                {isLeader && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 shadow-2xs">
                    Tổ Trưởng / Tổ Phó (100đ - Có Mục 4 Quản Lý Tổ)
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold mt-0.5">
                Xem Xét Hồ Sơ &amp; Quyết Định Xếp Loại: {teacher.fullName}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Way Summary Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">1. GV tự chấm:</span>
              <span className="text-sm font-bold text-emerald-700">
                {evaluation.selfTotalScore} / {maxPossible}đ
              </span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">2. Tổ trưởng chấm:</span>
              <span className="text-sm font-bold text-amber-800">
                {evaluation.groupTotalScore !== null ? `${evaluation.groupTotalScore} / ${maxPossible}đ` : 'Chưa chấm'}
              </span>
            </div>

            <div className="bg-rose-50 p-2 rounded-lg border border-rose-300">
              <span className="text-rose-700 block text-[11px] font-bold">3. BGH chính thức (bgh_score):</span>
              <span className="text-sm font-black text-rose-900">
                {totalBghScore} / {maxPossible}đ
              </span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Người thẩm định tổ:</span>
              <span className="text-xs font-semibold text-slate-800 truncate block">
                {reviewer ? reviewer.fullName : dept?.name}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdoptGroupScores}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 font-semibold text-xs hover:bg-indigo-100 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Kế thừa điểm đánh giá của Tổ</span>
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Criteria Evaluation Comparison Table */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>Bảng Đối Chiếu 3 Cấp Đánh Giá &amp; Minh Chứng (Theo Mục A &amp; Mục B)</span>
            </h4>

            {[
              {
                code: 'A',
                title: 'MỤC A: TIÊU CHÍ CHUNG (30 ĐIỂM)',
                subTitle: 'Tiêu chuẩn 1 (TC1 - 10đ), Tiêu chuẩn 2 (TC2 - 10đ), Tiêu chuẩn 3 (TC3 - 10đ)',
                maxScore: 30,
                badgeStyle: 'bg-indigo-600 text-white',
                cardStyle: 'bg-indigo-50/80 border-indigo-200 text-indigo-950',
                categories: categories.filter(c => c.sectionCode === 'A' || ['cat-a1', 'cat-a2', 'cat-a3'].includes(c.id)),
              },
              {
                code: 'B',
                title: 'MỤC B: KẾT QUẢ THỰC HIỆN CHỨC TRÁCH, NHIỆM VỤ ĐƯỢC GIAO (70 ĐIỂM)',
                subTitle: isHeadOfOffice
                  ? 'B.II: 1. Số lượng (20đ), 2. Chất lượng (20đ), 3. Tiến độ (10đ), 4. Quản lý hoạt động tổ Văn phòng (20đ - TIÊU CHUẨN ĐẶC THÙ)'
                  : isEquipment
                  ? 'B.III: 1. Số lượng (30đ), 2. Chất lượng (19đ thường + 11đ vượt trội 2*), 3. Tiến độ (10đ) theo chuẩn Thiết bị NĐ 233'
                  : isMedical
                  ? 'B.IV: 1. Số lượng (30đ), 2. Chất lượng (19đ thường + 11đ vượt trội 2*), 3. Tiến độ (10đ) theo chuẩn Y tế NĐ 233'
                  : isClerical
                  ? 'B.II: 1. Số lượng (30đ), 2. Chất lượng (19đ thường + 11đ vượt trội 2*), 3. Tiến độ (10đ) theo chuẩn Văn thư NĐ 233'
                  : isAccounting
                  ? '1. Số lượng (30đ), 2. Chất lượng (19đ thường + 11đ vượt trội 2*), 3. Tiến độ (10đ) theo chuẩn Kế toán NĐ 233'
                  : isLeader
                  ? '1. Số lượng (20đ), 2. Chất lượng (20đ), 3. Tiến độ (10đ), 4. Quản lý hoạt động tổ/nhóm CM (20đ)'
                  : '1. Số lượng công việc (30đ), 2. Chất lượng công việc (30đ), 3. Tiến độ thực hiện (10đ)',
                maxScore: 70,
                badgeStyle: isHeadOfOffice 
                  ? 'bg-indigo-700 text-white' 
                  : isEquipment
                  ? 'bg-purple-700 text-white'
                  : isMedical
                  ? 'bg-rose-700 text-white'
                  : isClerical 
                  ? 'bg-sky-700 text-white' 
                  : isAccounting 
                  ? 'bg-teal-700 text-white' 
                  : isLeader 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-emerald-600 text-white',
                cardStyle: isHeadOfOffice 
                  ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950' 
                  : isEquipment
                  ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                  : isMedical
                  ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                  : isClerical 
                  ? 'bg-sky-50/80 border-sky-200 text-sky-950' 
                  : isAccounting 
                  ? 'bg-teal-50/80 border-teal-200 text-teal-950' 
                  : isLeader 
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950' 
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
                categories: categories.filter(c => c.sectionCode === 'B'),
              },
            ].map(section => {
              const sectionCriteria = criteria.filter(c => section.categories.some(cat => cat.id === c.categoryId));
              const sectionScore = sectionCriteria.reduce((sum, c) => sum + (scores[c.id] || 0), 0);

              return (
                <div key={section.code} className="space-y-4">
                  <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs ${section.cardStyle}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${section.badgeStyle}`}>
                        {section.code}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wide">{section.title}</h4>
                        <p className="text-[11px] text-slate-500">{section.subTitle}</p>
                      </div>
                    </div>
                    <div className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-white border border-slate-200 self-start sm:self-auto">
                      BGH chấm Mục {section.code}: <span className="text-rose-700 text-sm font-black">{sectionScore}</span> / {section.maxScore}đ
                    </div>
                  </div>

                  <div className="space-y-4">
                    {section.categories.map(cat => {
                      const catCriteria = criteria.filter(c => c.categoryId === cat.id);
                      const isCatLeader = cat.id === 'cat-b4-tt';
                      const isCatMedical = cat.id.includes('-yt') || isMedical;
                      const isCatAccounting = cat.id.includes('-kt') || isAccounting;

                      return (
                        <div 
                          key={cat.id} 
                          className={`border rounded-xl overflow-hidden bg-white ${
                            isCatMedical
                              ? 'border-2 border-rose-500 shadow-xs'
                              : isCatAccounting
                              ? 'border-2 border-teal-500 shadow-xs'
                              : isCatLeader 
                              ? 'border-2 border-amber-500 shadow-xs' 
                              : 'border-slate-200'
                          }`}
                        >
                          <div className={`p-3 font-black text-xs border-b flex items-center justify-between ${
                            isCatMedical
                              ? 'bg-gradient-to-r from-rose-700 to-pink-800 text-white border-rose-700'
                              : isCatAccounting
                              ? 'bg-gradient-to-r from-teal-700 to-emerald-800 text-white border-teal-700'
                              : isCatLeader 
                              ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-600' 
                              : 'bg-blue-50/70 text-blue-950 border-blue-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs sm:text-sm">{cat.name}</span>
                              {isCatMedical && (
                                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-rose-300 text-rose-950 shadow-2xs">
                                  TIÊU CHUẨN Y TẾ (NĐ 233)
                                </span>
                              )}
                              {isCatAccounting && (
                                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-teal-300 text-teal-950 shadow-2xs">
                                  TIÊU CHUẨN KẾ TOÁN (NĐ 233)
                                </span>
                              )}
                              {isCatLeader && (
                                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-400 text-amber-950 shadow-2xs">
                                  TIÊU CHUẨN ĐẶC THÙ (20 ĐIỂM)
                                </span>
                              )}
                            </div>
                            <span className={`font-mono text-[11px] font-black px-2.5 py-0.5 rounded shadow-2xs ${
                              isCatMedical ? 'bg-rose-300 text-rose-950' : isCatAccounting ? 'bg-teal-300 text-teal-950' : isCatLeader ? 'bg-amber-400 text-amber-950' : 'bg-blue-900 text-white'
                            }`}>{cat.code}</span>
                          </div>

                          <div className="divide-y divide-slate-100 text-xs">
                    {catCriteria.map(crit => {
                      const detail = evalDetails.find(d => d.criterionId === crit.id);
                      const bghScore = scores[crit.id] ?? 4;
                      const bghNote = notes[crit.id] || '';
                      const isBlueSpecial = crit.highlightColor === 'blue' || crit.code === '2*';
                      const isRedSpecial = crit.highlightColor === 'red' || crit.code === '1.h' || crit.code === '3.a';

                      return (
                        <div key={crit.id} className={`p-3.5 transition-colors space-y-2.5 ${isBlueSpecial ? 'bg-sky-50/70 border-l-4 border-sky-500' : isRedSpecial ? 'bg-rose-50/30 border-l-4 border-rose-500' : 'hover:bg-slate-50/70'}`}>
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                            <div className="space-y-1.5 max-w-xl">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-mono font-black px-2 py-0.5 rounded text-[11px] shadow-2xs shrink-0 ${isBlueSpecial ? 'bg-sky-700 text-white' : isRedSpecial ? 'bg-rose-700 text-white' : 'bg-blue-900 text-white'}`}>
                                  {crit.code}
                                </span>
                                <strong className={`font-black text-sm leading-snug ${isBlueSpecial ? 'text-sky-950' : isRedSpecial ? 'text-rose-900' : 'text-black'}`}>
                                  {crit.name}
                                </strong>
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
                              </div>
                              {crit.description && (
                                <p className={`font-semibold text-xs leading-relaxed ${isBlueSpecial ? 'text-sky-900' : isRedSpecial ? 'text-rose-950' : 'text-black'}`}>
                                  {crit.description}
                                </p>
                              )}

                              {/* Teacher's evidence and notes */}
                              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 mt-1">
                                <span className="font-semibold text-slate-700">Minh chứng: </span>
                                {detail?.evidenceText || 'Chưa có mô tả'}
                                {detail?.evidenceFiles && detail.evidenceFiles.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {detail.evidenceFiles.map(f => (
                                      <span key={f.id} className="text-[10px] bg-white border px-1.5 py-0.2 rounded text-indigo-700">
                                        📎 {f.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Group head note */}
                              {detail?.groupNote && (
                                <div className="text-[11px] text-amber-800 bg-amber-50/70 p-1.5 rounded border border-amber-200">
                                  <strong>Tổ trưởng nhận xét:</strong> {detail.groupNote}
                                </div>
                              )}
                            </div>

                            {/* 3 Columns Score Comparison */}
                            <div className="shrink-0 flex items-center gap-2">
                              {/* 1. Self score */}
                              <div className="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-200 min-w-[56px]">
                                <div className="text-[9px] uppercase font-bold text-emerald-800">GV Tự Chấm</div>
                                <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                                  {detail?.selfScore ?? '-'}đ
                                </div>
                              </div>

                              {/* 2. Group score */}
                              <div className="text-center p-2 rounded-lg bg-amber-50 border border-amber-200 min-w-[56px]">
                                <div className="text-[9px] uppercase font-bold text-amber-800">Tổ Chấm</div>
                                <div className="font-mono font-bold text-amber-700 text-sm mt-0.5">
                                  {detail?.groupScore ?? '-'}đ
                                </div>
                              </div>

                              {/* 3. BGH official selector */}
                              <div className="text-center p-2 rounded-lg bg-rose-50 border border-rose-300 min-w-[120px]">
                                <div className="text-[9px] uppercase font-bold text-rose-800 flex items-center justify-between">
                                  <span>BGH Chấm:</span>
                                  <span className="font-mono text-[9px] text-rose-700">/{crit.maxScore}đ</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max={crit.maxScore}
                                    step="0.1"
                                    value={bghScore}
                                    onChange={e => handleScoreChange(crit.id, Math.min(crit.maxScore, Math.max(0, parseFloat(e.target.value) || 0)))}
                                    className="w-12 px-1 py-0.5 text-center font-mono font-bold text-xs bg-white border border-rose-300 rounded focus:ring-1 focus:ring-rose-500"
                                  />
                                  <div className="flex items-center gap-1 ml-0.5 flex-wrap">
                                    {[
                                      { pct: 100, score: crit.maxScore },
                                      { pct: 75, score: Math.round(crit.maxScore * 0.75 * 10) / 10 },
                                      { pct: 50, score: Math.round(crit.maxScore * 0.5 * 10) / 10 },
                                      { pct: 0, score: 0 },
                                    ].map(item => (
                                      <button
                                        key={item.pct}
                                        type="button"
                                        onClick={() => handleScoreChange(crit.id, item.score)}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                          bghScore === item.score
                                            ? 'bg-rose-600 text-white shadow-2xs'
                                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                        }`}
                                        title={`${item.pct}% hoàn thành (${item.score}đ)`}
                                      >
                                        {item.pct}% ({item.score}đ)
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* BGH note */}
                          <div>
                            <input
                              type="text"
                              placeholder="Ghi chú thẩm định của BGH cho tiêu chí này (nếu có)..."
                              value={bghNote}
                              onChange={e => handleNoteChange(crit.id, e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
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

          {/* Previous General Comments from Teacher & Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <span className="font-bold text-slate-700 block mb-1">
                Ý kiến của Giáo viên:
              </span>
              <p className="text-slate-600 italic">
                "{evaluation.generalTeacherComment || 'Không có ý kiến bổ sung'}"
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs">
              <span className="font-bold text-amber-900 block mb-1">
                Ý kiến kết luận của Tổ chuyên môn:
              </span>
              <p className="text-amber-800 italic">
                "{evaluation.generalGroupComment || 'Tổ chuyên môn nhất trí với hồ sơ tự đánh giá.'}"
              </p>
            </div>
          </div>

          {/* FINAL BGH RANKING SELECTION (bgh_ranking) */}
          <div className="p-5 rounded-2xl border-2 border-rose-300 bg-rose-50/40 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Stamp className="w-5 h-5 text-rose-700" />
                <h4 className="text-sm font-black text-rose-950 uppercase tracking-wide">
                  Quyết Định Xếp Loại Chất Lượng Viên Chức (bgh_ranking) *
                </h4>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Căn cứ theo Nghị định số 233/2026/NĐ-CP của Chính phủ và kết quả điểm thẩm định chính thức của Ban Giám hiệu
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(Object.keys(RANKING_DEFINITIONS) as RankingLevel[]).map(rankKey => {
                const def = RANKING_DEFINITIONS[rankKey];
                const isSelected = ranking === rankKey;

                return (
                  <button
                    key={rankKey}
                    type="button"
                    onClick={() => setRanking(rankKey)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400/30'
                        : 'bg-white border-slate-300 text-slate-800 hover:border-rose-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase">
                        {def.shortLabel}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`text-[11px] leading-tight ${isSelected ? 'text-white/90' : 'text-slate-600'}`}>
                      {def.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* BGH General Statement */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Kết Luận &amp; Nhận Xét Của Ban Giám Hiệu
              </label>
              <textarea
                rows={3}
                required
                value={generalComment}
                onChange={e => setGeneralComment(e.target.value)}
                placeholder="Ghi nhận thành tích, phê duyệt xếp loại và định hướng khen thưởng..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetEvaluation}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa Phiếu &amp; Lập Lại Từ Đầu</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-md shadow-rose-200 transition-all hover:scale-[1.01]"
              >
                <Stamp className="w-4 h-4" />
                <span>Ký &amp; Phê Duyệt Hồ Sơ (APPROVED)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
