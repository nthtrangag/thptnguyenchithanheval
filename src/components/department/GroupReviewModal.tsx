import React, { useState, useEffect } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Users, 
  Send, 
  Sparkles, 
  Paperclip,
  Check,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { Evaluation, User } from '../../types';
import { calculateTotalScore, determineRanking, RANKING_DEFINITIONS, isDepartmentLeaderOrDeputy, isAccountingStaff, isOfficeHead, isClericalStaff, isEquipmentStaff, isMedicalStaff } from '../../utils/evaluationRules';

interface GroupReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: Evaluation;
  teacher: User;
}

export const GroupReviewModal: React.FC<GroupReviewModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  teacher,
}) => {
  const {
    categories,
    criteria,
    evaluationDetails,
    submitGroupReview,
    revertEvaluationSubmission,
    getUserDepartment,
    getUserCriteria,
  } = useEvaluation();

  const dept = getUserDepartment(teacher.departmentId);
  const evalDetails = evaluationDetails.filter(d => d.evaluationId === evaluation.id);
  const isTeacherOfficeHead = isOfficeHead(teacher);
  const isTeacherEquipment = isEquipmentStaff(teacher);
  const isTeacherMedical = isMedicalStaff(teacher);
  const isTeacherClerical = isClericalStaff(teacher);
  const isTeacherLeader = isDepartmentLeaderOrDeputy(teacher);
  const isTeacherAccounting = isAccountingStaff(teacher);
  const { categories: teacherCategories, criteria: teacherCriteria } = getUserCriteria(teacher);

  // Group scores state
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [generalComment, setGeneralComment] = useState(evaluation.generalGroupComment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return to draft state
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);
  const [returnReason, setReturnReason] = useState(
    'Hồ sơ còn thiếu minh chứng bắt buộc theo quy định / có một số tiêu chí tự chấm chưa phù hợp với tỷ lệ hoàn thành. Đề nghị giáo viên rà soát, bổ sung minh chứng và tự đánh giá lại.'
  );

  // Initialize group scores from existing groupScore or fallback to selfScore
  useEffect(() => {
    const initialScores: Record<string, number> = {};
    const initialNotes: Record<string, string> = {};

    evalDetails.forEach(d => {
      // If groupScore already exists, use it; otherwise default to selfScore
      const score = d.groupScore !== null && d.groupScore !== undefined 
        ? d.groupScore 
        : (d.selfScore !== null ? d.selfScore : 4);
      initialScores[d.criterionId] = score;
      if (d.groupNote) {
        initialNotes[d.criterionId] = d.groupNote;
      }
    });

    setScores(initialScores);
    setNotes(initialNotes);
    setGeneralComment(
      evaluation.generalGroupComment ||
        `Tổ chuyên môn đã họp, thống nhất cao với hồ sơ tự đánh giá và minh chứng của đồng chí ${teacher.fullName}.`
    );
  }, [evaluation.id]);

  if (!isOpen) return null;

  // Calculate live group total and ranking
  const totalGroupScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const maxPossible = teacherCriteria.reduce((sum, c) => sum + c.maxScore, 0);

  const mockDetailsForRank = teacherCriteria.map(c => ({
    id: 'temp',
    evaluationId: evaluation.id,
    criterionId: c.id,
    selfScore: c.maxScore,
    groupScore: scores[c.id] ?? null,
    bghScore: null,
    evidenceText: '',
    evidenceFiles: [],
  }));

  const projectedRank = determineRanking(mockDetailsForRank, teacherCriteria, 'groupScore');
  const rankMeta = RANKING_DEFINITIONS[projectedRank];

  const handleScoreChange = (criterionId: string, score: number) => {
    setScores(prev => ({ ...prev, [criterionId]: score }));
  };

  const handleNoteChange = (criterionId: string, text: string) => {
    setNotes(prev => ({ ...prev, [criterionId]: text }));
  };

  const handleMatchSelfScores = () => {
    const matched: Record<string, number> = {};
    evalDetails.forEach(d => {
      if (d.selfScore !== null) {
        matched[d.criterionId] = d.selfScore;
      }
    });
    setScores(matched);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Xác nhận hoàn tất đánh giá của Tổ chuyên môn và chuyển trạng thái sang GROUP_REVIEWED để gửi lên Ban Giám hiệu?')) {
      return;
    }

    setIsSubmitting(true);
    const updates = teacherCriteria.map(c => ({
      criterionId: c.id,
      groupScore: scores[c.id] || 0,
      groupNote: notes[c.id] || '',
    }));

    submitGroupReview(evaluation.id, updates, generalComment);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                  Bước 3: Tổ Trưởng Đánh Giá
                </span>
                <span className="text-xs text-amber-100 font-mono">
                  Mã: {teacher.teacherCode}
                </span>
              </div>
              <h3 className="text-base font-bold mt-0.5">
                Thẩm Định Đánh Giá: {teacher.fullName} ({dept?.name})
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

        {/* Top Summary & Live Ranking Banner */}
        <div className="p-4 bg-amber-50/70 border-b border-amber-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Điểm GV tự chấm:</span>
              <span className="text-sm font-bold text-slate-800">
                {evaluation.selfTotalScore} / {maxPossible}đ
              </span>
            </div>
            <div className="h-6 w-px bg-amber-300" />
            <div>
              <span className="text-slate-500 block">Điểm Tổ trưởng chấm (group_score):</span>
              <span className="text-sm font-black text-amber-900">
                {totalGroupScore} / {maxPossible}đ
              </span>
            </div>
            <div className="h-6 w-px bg-amber-300" />
            <div>
              <span className="text-slate-500 block">Đề xuất xếp loại của Tổ:</span>
              <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs border ${rankMeta.color}`}>
                {rankMeta.shortLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMatchSelfScores}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold text-xs hover:bg-amber-100 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Đồng thuận với điểm tự chấm của GV</span>
          </button>
        </div>

        {/* Scrollable Criteria Scoring Table */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {[
            {
              code: 'A',
              title: 'MỤC A: TIÊU CHÍ CHUNG (30 ĐIỂM)',
              subTitle: 'Tiêu chuẩn 1 (10đ), Tiêu chuẩn 2 (10đ), Tiêu chuẩn 3 (10đ)',
              maxScore: 30,
              badgeStyle: 'bg-indigo-600 text-white',
              cardStyle: 'bg-indigo-50/80 border-indigo-200 text-indigo-950',
              categories: teacherCategories.filter(c => c.sectionCode === 'A'),
            },
            {
              code: 'B',
              title: 'MỤC B: KẾT QUẢ THỰC HIỆN CHỨC TRÁCH, NHIỆM VỤ ĐƯỢC GIAO (70 ĐIỂM)',
              subTitle: isTeacherOfficeHead
                ? 'B.II: 1. Số lượng (20đ), 2. Chất lượng (20đ), 3. Tiến độ (10đ), 4. Quản lý hoạt động tổ Văn phòng (20đ - TIÊU CHUẨN ĐẶC THÙ)'
                : isTeacherEquipment
                ? 'B.III: 1. Số lượng (30đ), 2. Chất lượng (19đ thường + 11đ vượt trội 2*), 3. Tiến độ (10đ) theo chuẩn Thiết bị NĐ 233'
                : isTeacherMedical
                ? 'B.IV: 1. Số lượng (30đ), 2. Chất lượng (19đ thường + 11đ vượt trội 2*), 3. Tiến độ (10đ) theo chuẩn Y tế NĐ 233'
                : isTeacherClerical
                ? 'B.II: 1. Số lượng (30đ), 2. Chất lượng (19đ thường + 11đ vượt trội 2*), 3. Tiến độ (10đ) theo chuẩn Văn thư NĐ 233'
                : isTeacherAccounting
                ? '1. Số lượng (30đ), 2. Chất lượng (19đ thường + 11đ vượt trội 2*), 3. Tiến độ (10đ) theo chuẩn Kế toán NĐ 233'
                : isTeacherLeader
                ? '1. Số lượng (20đ), 2. Chất lượng (20đ), 3. Tiến độ (10đ), 4. Quản lý hoạt động tổ/nhóm CM (20đ)'
                : '1. Số lượng công việc (30đ), 2. Chất lượng công việc (30đ), 3. Tiến độ thực hiện (10đ)',
              maxScore: 70,
              badgeStyle: isTeacherOfficeHead
                ? 'bg-indigo-700 text-white'
                : isTeacherEquipment
                ? 'bg-purple-700 text-white'
                : isTeacherMedical
                ? 'bg-rose-700 text-white'
                : isTeacherClerical
                ? 'bg-sky-700 text-white'
                : isTeacherAccounting 
                ? 'bg-teal-700 text-white' 
                : isTeacherLeader
                ? 'bg-amber-600 text-white'
                : 'bg-emerald-600 text-white',
              cardStyle: isTeacherOfficeHead
                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                : isTeacherEquipment
                ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                : isTeacherMedical
                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                : isTeacherClerical
                ? 'bg-sky-50/80 border-sky-200 text-sky-950'
                : isTeacherAccounting 
                ? 'bg-teal-50/80 border-teal-200 text-teal-950' 
                : isTeacherLeader
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
              categories: teacherCategories.filter(c => c.sectionCode === 'B'),
            },
          ].map(section => {
            const sectionCriteria = teacherCriteria.filter(c => section.categories.some(cat => cat.id === c.categoryId));
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
                    Tổ chấm Mục {section.code}: <span className="text-amber-700 text-sm font-black">{sectionScore}</span> / {section.maxScore}đ
                  </div>
                </div>

                <div className="space-y-4">
                  {section.categories.map(cat => {
                    const catCriteria = teacherCriteria.filter(c => c.categoryId === cat.id);
                    const isCatLeader = cat.id === 'cat-b4-tt';
                    const isCatMedical = cat.id.includes('-yt') || isTeacherMedical;
                    const isCatAccounting = cat.id.includes('-kt') || isTeacherAccounting;

                    return (
                      <div 
                        key={cat.id} 
                        className={`border rounded-xl overflow-hidden ${
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
                    const groupScore = scores[crit.id] ?? 4;
                    const groupNote = notes[crit.id] || '';

                    return (
                      <div key={crit.id} className="p-3.5 hover:bg-slate-50/70 transition-colors space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="space-y-1.5 max-w-xl">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black px-2 py-0.5 bg-blue-900 text-white rounded text-[11px] shadow-2xs shrink-0">
                                {crit.code}
                              </span>
                              <strong className="text-black font-black text-sm leading-snug">{crit.name}</strong>
                            </div>
                            {crit.description && (
                              <p className="text-black font-semibold text-xs leading-relaxed">{crit.description}</p>
                            )}
                            
                            {/* Teacher's Evidence Display */}
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 mt-1">
                              <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                                <Paperclip className="w-3 h-3 text-emerald-600" />
                                <span>Minh chứng của GV:</span>
                              </div>
                              <div className="text-slate-600 text-[11px] italic mt-0.5">
                                {detail?.evidenceText || 'Chưa nhập mô tả minh chứng'}
                              </div>

                              {detail?.evidenceFiles && detail.evidenceFiles.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {detail.evidenceFiles.map(f => (
                                    <span key={f.id} className="inline-flex items-center gap-1 text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-indigo-700 font-medium">
                                      <FileText className="w-2.5 h-2.5" />
                                      {f.name} ({f.size})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Scores Column */}
                          <div className="shrink-0 flex items-center gap-3">
                            <div className="text-center p-2 rounded-lg bg-slate-100 border border-slate-200">
                              <div className="text-[10px] text-slate-500 font-medium">GV tự chấm</div>
                              <div className="font-mono font-bold text-emerald-700 text-sm">
                                {detail?.selfScore ?? '-'}đ
                              </div>
                            </div>

                            <div className="text-center p-2 rounded-lg bg-amber-50 border border-amber-300 min-w-[120px]">
                              <div className="text-[10px] text-amber-800 font-bold flex items-center justify-between">
                                <span>Tổ chấm:</span>
                                <span className="font-mono text-[9px] text-amber-700">(Tối đa {crit.maxScore}đ)</span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={crit.maxScore}
                                  step="0.1"
                                  value={groupScore}
                                  onChange={e => handleScoreChange(crit.id, Math.min(crit.maxScore, Math.max(0, parseFloat(e.target.value) || 0)))}
                                  className="w-12 px-1 py-0.5 text-center font-mono font-bold text-xs bg-white border border-amber-300 rounded focus:ring-1 focus:ring-amber-500"
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
                                        groupScore === item.score
                                          ? 'bg-amber-600 text-white shadow-2xs'
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

                        {/* Group leader individual note */}
                        <div>
                          <input
                            type="text"
                            placeholder="Nhận xét riêng của tổ trưởng cho tiêu chí này (nếu có)..."
                            value={groupNote}
                            onChange={e => handleNoteChange(crit.id, e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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

          {/* General Department Comment */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              Nhận Xét Đánh Giá Toàn Diện Của Tổ Chuyên Môn
            </label>
            <textarea
              rows={3}
              required
              value={generalComment}
              onChange={e => setGeneralComment(e.target.value)}
              placeholder="Nhận xét về ưu điểm, hạn chế và đề xuất mức xếp loại của tổ chuyên môn..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Footer Actions: Return to Teacher (Left) & Submit Review (Right) */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowReturnPrompt(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Xóa nộp hồ sơ: Trả hồ sơ về Bản nháp để giáo viên bổ sung minh chứng hoặc sửa lại điểm"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Xóa nộp / Trả lại để GV làm lại</span>
            </button>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Lưu &amp; Xác Nhận Đánh Giá Tổ (GROUP_REVIEWED)</span>
              </button>
            </div>
          </div>
        </form>

        {/* Modal Prompt to Confirm Return to Teacher */}
        {showReturnPrompt && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <h3 className="text-sm font-bold">Xác Nhận Xóa Nộp &amp; Trả Hồ Sơ Cho Giáo Viên</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReturnPrompt(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed">
                  Bạn đang hủy trạng thái đã nộp của giáo viên <strong>{teacher.fullName}</strong> ({teacher.teacherCode}).{' '}
                  Hồ sơ sẽ chuyển về trạng thái <strong>Bản Nháp (DRAFT)</strong> và mở khóa toàn bộ để giáo viên có thể chỉnh sửa điểm và bổ sung minh chứng.
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">
                    Lý do hoàn trả hồ sơ (Giáo viên sẽ nhìn thấy thông báo này trên màn hình tự đánh giá):
                  </label>
                  <textarea
                    rows={3}
                    value={returnReason}
                    onChange={e => setReturnReason(e.target.value)}
                    placeholder="Nhập lý do thiếu minh chứng hoặc hướng dẫn sửa đổi..."
                    className="w-full p-3 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                  />
                </div>

                {/* Quick suggestions */}
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
                        onClick={() => setReturnReason(sug)}
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
                  onClick={() => setShowReturnPrompt(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    revertEvaluationSubmission(evaluation.id, returnReason);
                    setShowReturnPrompt(false);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xác nhận xóa nộp &amp; Trả hồ sơ</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
