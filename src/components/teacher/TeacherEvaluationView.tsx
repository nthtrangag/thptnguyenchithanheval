import React, { useState, useEffect } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import { 
  FileCheck, 
  Send, 
  Save, 
  Paperclip, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HelpCircle,
  Printer,
  ChevronRight,
  ChevronDown,
  Sparkles,
  FileText,
  Building,
  User as UserIcon,
  Award,
  Check,
  Info,
  RotateCcw,
  UserCheck,
  FileSpreadsheet,
  FlaskConical,
  HeartPulse,
  ArrowLeft
} from 'lucide-react';
import { CriteriaTargetRole } from '../../types';
import { 
  STATUS_DEFINITIONS, 
  RANKING_DEFINITIONS, 
  calculateTotalScore, 
  determineRanking,
  formatDate,
  getOfficialEvidenceForCriterion,
  isDepartmentLeaderOrDeputy,
  isAccountingStaff,
  isOfficeHead,
  isClericalStaff,
  isEquipmentStaff,
  isMedicalStaff,
  filterCriteriaForUser,
} from '../../utils/evaluationRules';
import { PrintEvaluationModal } from '../PrintEvaluationModal';

export const TeacherEvaluationView: React.FC = () => {
  const {
    currentUser,
    selectedPeriodId,
    periods,
    categories,
    criteria,
    evaluations,
    evaluationDetails,
    getUserDepartment,
    getUserCriteria,
    initEvaluationForTeacher,
    saveTeacherEvaluationDraft,
    submitTeacherEvaluation,
    addEvidenceFile,
    removeEvidenceFile,
  } = useEvaluation();

  const userDept = getUserDepartment(currentUser.departmentId);
  const currentPeriod = periods.find(p => p.id === selectedPeriodId);

  // Get or initialize evaluation for this teacher and period
  const existingEval = evaluations.find(
    e => e.userId === currentUser.id && e.periodId === selectedPeriodId
  );

  const activeEval = existingEval || {
    id: `eval-temp-${currentUser.id}`,
    periodId: selectedPeriodId,
    userId: currentUser.id,
    departmentId: currentUser.departmentId,
    status: 'DRAFT' as const,
    selfTotalScore: 0,
    groupTotalScore: null,
    bghTotalScore: null,
    updatedAt: new Date().toISOString(),
  };

  useEffect(() => {
    if (!existingEval) {
      initEvaluationForTeacher(currentUser.id, selectedPeriodId);
    }
  }, [currentUser.id, selectedPeriodId, existingEval]);

  // Form states: Map criterionId -> { score, evidence, note }
  const currentEvalDetails = evaluationDetails.filter(d => d.evaluationId === activeEval.id);

  const [formScores, setFormScores] = useState<Record<string, number>>({});
  const [formEvidence, setFormEvidence] = useState<Record<string, string>>({});
  const [formNotes, setFormNotes] = useState<Record<string, string>>({});
  const [generalComment, setGeneralComment] = useState(activeEval.generalTeacherComment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [openCustomPctId, setOpenCustomPctId] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Role detection and strict assignment
  const isDetectedOfficeHead = isOfficeHead(currentUser);
  const isDetectedEquipment = isEquipmentStaff(currentUser);
  const isDetectedMedical = isMedicalStaff(currentUser);
  const isDetectedClerical = isClericalStaff(currentUser);
  const isDetectedAccounting = isAccountingStaff(currentUser);
  const isDetectedLeader = isDepartmentLeaderOrDeputy(currentUser);

  // Exact assigned target role based on user's position
  const assignedRole: CriteriaTargetRole = isDetectedOfficeHead 
    ? 'TO_TRUONG_VAN_PHONG' 
    : isDetectedEquipment 
    ? 'THIET_BI' 
    : isDetectedMedical 
    ? 'Y_TE' 
    : isDetectedClerical 
    ? 'VAN_THU' 
    : isDetectedAccounting 
    ? 'KE_TOAN' 
    : isDetectedLeader 
    ? 'TO_TRUONG_TO_PHO' 
    : 'GIAO_VIEN';

  const isAdmin = currentUser.roleId === 'ADMIN';

  // Admin has full control to test/switch all roles; non-admin is strictly locked to assignedRole
  const [viewRoleOverride, setViewRoleOverride] = useState<CriteriaTargetRole | 'AUTO'>('AUTO');
  const effectiveRole: CriteriaTargetRole = isAdmin 
    ? (viewRoleOverride === 'AUTO' ? assignedRole : viewRoleOverride)
    : assignedRole;

  const isOfficeHeadRole = effectiveRole === 'TO_TRUONG_VAN_PHONG';
  const isEquipment = effectiveRole === 'THIET_BI';
  const isMedical = effectiveRole === 'Y_TE';
  const isClerical = effectiveRole === 'VAN_THU';
  const isAccounting = effectiveRole === 'KE_TOAN';
  const isLeader = effectiveRole === 'TO_TRUONG_TO_PHO';
  const { categories: userCategories, criteria: userCriteria } = filterCriteriaForUser(
    currentUser,
    categories,
    criteria,
    effectiveRole
  );

  // Sync state from context details
  useEffect(() => {
    const scores: Record<string, number> = {};
    const evidence: Record<string, string> = {};
    const notes: Record<string, string> = {};

    currentEvalDetails.forEach(d => {
      if (d.selfScore !== null && d.selfScore !== undefined) {
        scores[d.criterionId] = d.selfScore;
      }
      if (d.evidenceText) {
        evidence[d.criterionId] = d.evidenceText;
      }
      if (d.teacherNote) {
        notes[d.criterionId] = d.teacherNote;
      }
    });

    setFormScores(scores);
    setFormEvidence(evidence);
    setFormNotes(notes);
    setGeneralComment(activeEval.generalTeacherComment || '');
  }, [activeEval.id, evaluationDetails.length]);

  const isLocked = activeEval.status !== 'DRAFT';

  // Calculate live total, ranking, and evidence completion
  const totalScore = Object.values(formScores).reduce((sum, val) => sum + val, 0);
  const maxPossibleScore = userCriteria.reduce((sum, c) => sum + c.maxScore, 0);
  const completedCriteriaCount = Object.keys(formScores).length;

  // Track how many criteria have evidence (either descriptive text or attached files)
  const criteriaWithEvidenceCount = userCriteria.filter(c => {
    const text = formEvidence[c.id];
    const detail = currentEvalDetails.find(d => d.criterionId === c.id);
    const hasFiles = detail?.evidenceFiles && detail.evidenceFiles.length > 0;
    return (text && text.trim().length > 0) || hasFiles;
  }).length;

  const mockDetailsForRank = userCriteria.map(c => ({
    id: 'temp',
    evaluationId: activeEval.id,
    criterionId: c.id,
    selfScore: formScores[c.id] ?? null,
    groupScore: null,
    bghScore: null,
    evidenceText: formEvidence[c.id] || '',
    evidenceFiles: [],
  }));

  const projectedRank = determineRanking(mockDetailsForRank, userCriteria, 'selfScore');
  const rankMeta = RANKING_DEFINITIONS[projectedRank];
  const statusMeta = STATUS_DEFINITIONS[activeEval.status];

  // Quick fill all with standard score & evidence
  const handleQuickFill = (rate: number) => {
    if (isLocked) return;
    const newScores: Record<string, number> = {};
    const newEvidence: Record<string, string> = { ...formEvidence };
    userCriteria.forEach(c => {
      newScores[c.id] = Math.round(c.maxScore * rate * 10) / 10;
      if (!newEvidence[c.id] || newEvidence[c.id].trim() === '') {
        const sample = getOfficialEvidenceForCriterion(c.code, c.name);
        newEvidence[c.id] = sample.text;
      }
    });
    setFormScores(newScores);
    setFormEvidence(newEvidence);
  };

  const handleScoreChange = (criterionId: string, score: number) => {
    if (isLocked) return;
    setFormScores(prev => ({ ...prev, [criterionId]: score }));
  };

  const handleEvidenceChange = (criterionId: string, text: string) => {
    if (isLocked) return;
    setFormEvidence(prev => ({ ...prev, [criterionId]: text }));
  };

  const handleNoteChange = (criterionId: string, text: string) => {
    if (isLocked) return;
    setFormNotes(prev => ({ ...prev, [criterionId]: text }));
  };

  // Real file upload from computer
  const handleRealFileUpload = (detailId: string, critId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const sizeMB = file.size / (1024 * 1024);
      const sizeStr = sizeMB >= 1 ? `${sizeMB.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
      addEvidenceFile(detailId, {
        name: file.name,
        size: sizeStr,
        type: file.type || 'application/octet-stream',
      });

      // Update text if currently empty
      setFormEvidence(prev => {
        if (!prev[critId] || prev[critId].trim() === '') {
          return { ...prev, [critId]: `Minh chứng tệp đính kèm: ${file.name}` };
        }
        return prev;
      });
    });

    e.target.value = '';
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2000);
  };

  // Attach official sample evidence for single criterion
  const handleAttachSampleForCriterion = (detailId: string, criterion: any) => {
    if (isLocked) return;
    const sample = getOfficialEvidenceForCriterion(criterion.code, criterion.name);
    setFormEvidence(prev => ({
      ...prev,
      [criterion.id]: sample.text,
    }));
    addEvidenceFile(detailId, {
      name: sample.fileName,
      size: sample.size,
      type: 'application/pdf',
    });
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2000);
  };

  // Auto-fill official evidence for all criteria at once
  const handleAutoFillAllEvidence = () => {
    if (isLocked) return;
    const newEvidence: Record<string, string> = { ...formEvidence };

    userCriteria.forEach(c => {
      const sample = getOfficialEvidenceForCriterion(c.code, c.name);
      newEvidence[c.id] = sample.text;

      const detail = currentEvalDetails.find(d => d.criterionId === c.id);
      if (detail && (!detail.evidenceFiles || detail.evidenceFiles.length === 0)) {
        addEvidenceFile(detail.id, {
          name: sample.fileName,
          size: sample.size,
          type: 'application/pdf',
        });
      }
    });

    setFormEvidence(newEvidence);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const prepareUpdates = () => {
    return userCriteria.map(c => ({
      criterionId: c.id,
      selfScore: formScores[c.id] || 0,
      evidenceText: formEvidence[c.id] || '',
      teacherNote: formNotes[c.id] || '',
    }));
  };

  const handleSaveDraft = () => {
    const updates = prepareUpdates();
    saveTeacherEvaluationDraft(activeEval.id, updates, generalComment);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Submission with compulsory evidence validation for each criterion
  const handleSubmitEvaluation = () => {
    // 1. Check score completion
    if (completedCriteriaCount < userCriteria.length) {
      if (!confirm(`Bạn mới cho điểm ${completedCriteriaCount}/${userCriteria.length} tiêu chí. Bạn có chắc muốn gửi hồ sơ lên Tổ trưởng không?`)) {
        return;
      }
    }

    // 2. Compulsory check: Mỗi tiêu chí cần phải đính kèm minh chứng
    const missingEvidenceCriteria = userCriteria.filter(c => {
      const text = formEvidence[c.id];
      const detail = currentEvalDetails.find(d => d.criterionId === c.id);
      const hasFiles = detail?.evidenceFiles && detail.evidenceFiles.length > 0;
      return !text?.trim() && !hasFiles;
    });

    if (missingEvidenceCriteria.length > 0) {
      const shouldAutoFill = confirm(
        `⚠️ QUY ĐỊNH BẮT BUỘC: MỖI TIÊU CHÍ CẦN PHẢI ĐÍNH KÈM MINH CHỨNG!\n\n` +
        `Hiện có ${missingEvidenceCriteria.length}/${userCriteria.length} tiêu chí chưa có minh chứng (${missingEvidenceCriteria.slice(0, 4).map(c => c.code).join(', ')}...).\n\n` +
        `• Bấm "OK" để hệ thống tự động đính kèm đầy đủ hồ sơ minh chứng chuẩn cho ${missingEvidenceCriteria.length} tiêu chí này và gửi ngay.\n` +
        `• Bấm "Cancel" để quay lại kiểm tra và tự tải tệp minh chứng.`
      );

      if (shouldAutoFill) {
        handleAutoFillAllEvidence();
        setTimeout(() => {
          setIsSubmitting(true);
          const updates = userCriteria.map(c => {
            const sample = getOfficialEvidenceForCriterion(c.code, c.name);
            return {
              criterionId: c.id,
              selfScore: formScores[c.id] || 0,
              evidenceText: formEvidence[c.id] || sample.text,
              teacherNote: formNotes[c.id] || '',
            };
          });
          submitTeacherEvaluation(activeEval.id, updates, generalComment);
          setIsSubmitting(false);
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 3500);
        }, 300);
        return;
      } else {
        return;
      }
    }

    if (!confirm('Xác nhận gửi bản tự đánh giá lên Tổ trưởng chuyên môn? Trạng thái sẽ chuyển từ DRAFT sang SUBMITTED.')) {
      return;
    }

    setIsSubmitting(true);
    const updates = prepareUpdates();
    submitTeacherEvaluation(activeEval.id, updates, generalComment);
    setIsSubmitting(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3500);
  };

  const handleSimulateUpload = (detailId: string, critCode: string) => {
    const sample = getOfficialEvidenceForCriterion(critCode);
    addEvidenceFile(detailId, {
      name: sample.fileName,
      size: sample.size,
      type: 'application/pdf',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Profile & Summary Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-200 shrink-0">
              {currentUser.fullName.split(' ').slice(-1)[0][0]}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {currentUser.roleId === 'NHAN_VIEN' ? 'Bước 2: Nhân Viên Tự Đánh Giá' : 'Bước 2: Giáo Viên Tự Đánh Giá'}
                </span>
                <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                  Mã VC: {currentUser.teacherCode}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {currentUser.fullName}
              </h2>
              <div className="text-xs text-slate-600 flex items-center gap-3 mt-1 flex-wrap">
                <span>Chức vụ: <strong>{currentUser.title}</strong></span>
                <span>•</span>
                <span>Tổ chuyên môn: <strong>{userDept?.name}</strong></span>
                {currentUser.subject && (
                  <>
                    <span>•</span>
                    <span>{currentUser.roleId === 'NHAN_VIEN' ? 'Nhiệm vụ' : 'Môn'}: <strong>{currentUser.subject}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Status Pill */}
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${statusMeta.color}`}>
              <div className="shrink-0">
                {activeEval.status === 'APPROVED' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : activeEval.status === 'GROUP_REVIEWED' ? (
                  <Clock className="w-5 h-5 text-indigo-600" />
                ) : activeEval.status === 'SUBMITTED' ? (
                  <Clock className="w-5 h-5 text-amber-600" />
                ) : (
                  <FileText className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                  Trạng thái hồ sơ
                </div>
                <div className="text-xs font-bold">{statusMeta.label}</div>
              </div>
            </div>

            {/* Print button */}
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>In Phiếu Đánh Giá</span>
            </button>
          </div>
        </div>

        {/* Progress & Live Score Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Tiến độ điền điểm</span>
            <div className="text-lg font-black text-slate-800 mt-0.5">
              {completedCriteriaCount} / {userCriteria.length} tiêu chí
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${userCriteria.length > 0 ? (completedCriteriaCount / userCriteria.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 block">Tiến độ minh chứng</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${criteriaWithEvidenceCount === userCriteria.length ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {criteriaWithEvidenceCount === userCriteria.length ? 'Đủ 100%' : 'Bắt buộc'}
              </span>
            </div>
            <div className={`text-lg font-black mt-0.5 ${criteriaWithEvidenceCount === userCriteria.length ? 'text-emerald-700' : 'text-amber-700'}`}>
              {criteriaWithEvidenceCount} / {userCriteria.length} tiêu chí
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${criteriaWithEvidenceCount === userCriteria.length ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${userCriteria.length > 0 ? (criteriaWithEvidenceCount / userCriteria.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Tổng điểm tự chấm</span>
            <div className="text-lg font-black text-emerald-700 mt-0.5">
              {totalScore} / {maxPossibleScore} điểm
            </div>
            <span className="text-[10px] text-slate-400">
              Đạt {((totalScore / maxPossibleScore) * 100).toFixed(0)}% điểm tối đa
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Dự kiến xếp loại</span>
            <div className="mt-0.5">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${rankMeta.color}`}>
                {rankMeta.shortLabel}: {rankMeta.label}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Nghị định 233/2026/NĐ-CP</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 block">Thời gian nộp</span>
            <div className="text-xs font-semibold text-slate-700">
              {activeEval.selfSubmittedAt ? formatDate(activeEval.selfSubmittedAt) : 'Chưa nộp (Bản nháp)'}
            </div>
            <span className="text-[10px] text-slate-400">
              Đợt: {currentPeriod?.semester}
            </span>
          </div>
        </div>

        {/* Quick Helper Banner if locked */}
        {isLocked && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Hồ sơ đã được gửi đi (trạng thái: <strong>{activeEval.status}</strong>). Bạn đang ở chế độ xem.
                {activeEval.status === 'SUBMITTED' && ' Chờ Tổ trưởng chuyên môn thẩm định.'}
                {activeEval.status === 'GROUP_REVIEWED' && ' Tổ trưởng đã cho điểm, đang chờ Ban Giám hiệu phê duyệt.'}
                {activeEval.status === 'APPROVED' && ' Ban Giám hiệu đã phê duyệt kết quả chính thức!'}
              </span>
            </div>
          </div>
        )}

        {/* Returned Dossier Notice (When Department Head returned dossier for redo) */}
        {!isLocked && activeEval.status === 'DRAFT' && activeEval.returnReason && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs flex items-start gap-3 shadow-xs">
            <RotateCcw className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 w-full">
              <div className="font-bold text-rose-900 text-sm flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <span>Hồ sơ đã được Tổ trưởng chuyên môn trả lại để thực hiện lại</span>
                  <span className="text-[10px] uppercase font-black bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                    Cần chỉnh sửa
                  </span>
                </span>
                {activeEval.returnedAt && (
                  <span className="text-[11px] font-normal text-rose-700">
                    Thời gian trả: {formatDate(activeEval.returnedAt)} {activeEval.returnedBy ? `(bởi ${activeEval.returnedBy})` : ''}
                  </span>
                )}
              </div>
              <p className="text-rose-800 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-rose-200 mt-1">
                <strong>Ý kiến / Lý do hoàn trả:</strong> {activeEval.returnReason}
              </p>
              <p className="text-[11px] text-rose-700 italic pt-0.5">
                💡 Bạn vui lòng kiểm tra lại từng tiêu chí, bổ sung đầy đủ minh chứng hoặc điều chỉnh điểm tự chấm, sau đó nhấn <strong>"Gửi Đánh Giá (SUBMITTED)"</strong> để gửi lại hồ sơ lên Tổ trưởng chuyên môn.
              </p>
            </div>
          </div>
        )}

        {/* Floating action bar for draft / submit if not locked */}
        {!isLocked && (
          <div className="mt-5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap text-xs text-emerald-900">
              <span className="font-semibold flex items-center gap-1 text-emerald-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Thao tác nhanh:
              </span>
              <button
                type="button"
                onClick={() => handleQuickFill(1)}
                className="px-2 py-1 bg-white hover:bg-emerald-100 rounded border border-emerald-300 font-medium text-[11px] text-emerald-800 transition-colors"
                title="Tự chấm điểm tối đa cho tất cả tiêu chí"
              >
                Mức Tối Đa (100đ)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(0.90)}
                className="px-2 py-1 bg-white hover:bg-emerald-100 rounded border border-emerald-300 font-medium text-[11px] text-emerald-800 transition-colors"
                title="Tự chấm mức Xuất sắc (90đ)"
              >
                Mức Xuất Sắc (90đ)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(0.89)}
                className="px-2 py-1 bg-white hover:bg-emerald-100 rounded border border-emerald-300 font-medium text-[11px] text-emerald-800 transition-colors"
                title="Tự chấm mức Tốt (~89đ)"
              >
                Mức Tốt (~89đ)
              </button>

              <span className="text-emerald-300">|</span>

              {/* 1-Click attach all evidence */}
              <button
                type="button"
                onClick={handleAutoFillAllEvidence}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                title={`Tự động đính kèm minh chứng chuẩn cho cả ${userCriteria.length} tiêu chí theo quy định`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Đính kèm đủ minh chứng ({userCriteria.length} tiêu chí)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-slate-600" />
                <span>Lưu bản nháp</span>
              </button>
              <button
                type="button"
                onClick={handleSubmitEvaluation}
                disabled={isSubmitting}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-xs shadow-xs transition-colors ${
                  isLocked 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLocked ? 'Đã Gửi Đánh Giá (Hồ sơ đã khóa)' : 'Gửi Đánh Giá (SUBMITTED)'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast alert */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold">Đã cập nhật thành công!</div>
            <div className="text-slate-300 text-[11px]">
              {activeEval.status === 'SUBMITTED' 
                ? 'Hồ sơ đã được gửi lên Tổ trưởng chuyên môn.' 
                : 'Bản nháp tự đánh giá đã được lưu vào hệ thống.'}
            </div>
          </div>
        </div>
      )}

      {/* Role Selection & Preview Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-800 flex items-center gap-2">
              <span>Biểu mẫu tự đánh giá theo chức vụ</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {currentUser.title || currentUser.roleId}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {isOfficeHeadRole
                ? 'Thang điểm 100đ: Mục A (30đ) + Mục B (70đ gồm B.II Văn thư và Mục 4 Đặc thù quản lý tổ Văn phòng 20đ)'
                : isEquipment
                ? 'Thang điểm 100đ: Mục A (30đ) + Mục B (70đ gồm B.III Thiết bị: Số lượng 30đ, Chất lượng 19đ+11đ, Tiến độ 10đ)'
                : isMedical
                ? 'Thang điểm 100đ: Mục A (30đ) + Mục B (70đ gồm B.IV Y tế: Số lượng 30đ, Chất lượng 19đ+11đ, Tiến độ 10đ)'
                : isClerical
                ? 'Thang điểm 100đ: Mục A (30đ) + Mục B (70đ gồm B.II Số lượng 30đ, Chất lượng 19đ+11đ, Tiến độ 10đ)'
                : isAccounting
                ? 'Thang điểm 100đ: Mục A (30đ) + Mục B (70đ gồm Số lượng 30đ, Chất lượng 19đ+11đ, Tiến độ 10đ)'
                : isLeader 
                ? 'Thang điểm 100đ: Mục A (30đ) + Mục B (70đ gồm Mục 4 Đặc thù quản lý tổ CM 20đ)'
                : 'Thang điểm 100đ: Mục A (30đ) + Mục B (70đ gồm Số lượng 30đ, Chất lượng 30đ, Tiến độ 10đ)'}
            </div>
          </div>
        </div>

        {/* If Admin: Show full role switcher to test and inspect all roles */}
        {isAdmin ? (
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <div className="text-[11px] font-bold text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1.5 self-start md:self-end">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Chế độ Quản trị viên: Toàn quyền xem và kiểm thử tiêu chuẩn từng chức vụ</span>
            </div>
            {/* Toggle buttons to switch role view */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold w-full md:w-auto flex-wrap">
              <button
                type="button"
                onClick={() => setViewRoleOverride('AUTO')}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 ${
                  viewRoleOverride === 'AUTO'
                    ? 'bg-white text-slate-900 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tự động theo chức vụ tài khoản hiện tại"
              >
                <span>Tự động</span>
                {isDetectedOfficeHead ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold">TT Văn phòng</span>
                ) : isDetectedEquipment ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">Thiết bị</span>
                ) : isDetectedMedical ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold">Y tế</span>
                ) : isDetectedClerical ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold">Văn thư</span>
                ) : isDetectedAccounting ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-bold">Kế toán</span>
                ) : isDetectedLeader ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">TT/TP CM</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-bold">GV</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewRoleOverride('Y_TE')}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 ${
                  viewRoleOverride === 'Y_TE'
                    ? 'bg-rose-700 text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Nhân viên Y tế (100đ)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewRoleOverride('THIET_BI')}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 ${
                  viewRoleOverride === 'THIET_BI'
                    ? 'bg-purple-700 text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Nhân viên Thiết bị, thí nghiệm (100đ)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewRoleOverride('TO_TRUONG_VAN_PHONG')}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 ${
                  viewRoleOverride === 'TO_TRUONG_VAN_PHONG'
                    ? 'bg-indigo-700 text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>TT Tổ Văn Phòng - Văn thư (100đ - Có Mục 4)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewRoleOverride('VAN_THU')}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 ${
                  viewRoleOverride === 'VAN_THU'
                    ? 'bg-sky-700 text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Nhân viên Văn thư (100đ)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewRoleOverride('KE_TOAN')}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 ${
                  viewRoleOverride === 'KE_TOAN'
                    ? 'bg-teal-700 text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Nhân viên Kế toán (100đ)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewRoleOverride('TO_TRUONG_TO_PHO')}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 ${
                  viewRoleOverride === 'TO_TRUONG_TO_PHO'
                    ? 'bg-amber-600 text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Tổ trưởng &amp; Tổ phó CM (100đ - Có Mục 4)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewRoleOverride('GIAO_VIEN')}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 ${
                  viewRoleOverride === 'GIAO_VIEN'
                    ? 'bg-blue-900 text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Giáo viên bộ môn (100đ)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Non-Admin: Strict role assignment indicator - role cannot be altered */
          <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-300 px-4 py-2 rounded-xl text-emerald-950 text-xs font-bold shadow-2xs shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 block">Tiêu chí phân quyền cố định</span>
              <span className="text-emerald-950">
                {isMedical ? 'Nhân viên Y tế (Thang 100đ - Mục B.IV)'
                  : isEquipment ? 'Nhân viên Thiết bị (Thang 100đ - Mục B.III)'
                  : isClerical ? 'Nhân viên Văn thư (Thang 100đ - Mục B.II)'
                  : isAccounting ? 'Nhân viên Kế toán (Thang 100đ)'
                  : isOfficeHeadRole ? 'Tổ trưởng Tổ Văn phòng (Thang 100đ có Mục 4)'
                  : isLeader ? 'Tổ trưởng / Tổ phó CM (Thang 100đ có Mục 4)'
                  : 'Giáo viên bộ môn (Thang 100đ)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Medical Staff Notice Banner */}
      {isMedical && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-800 via-rose-900 to-pink-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md border-2 border-rose-400">
          <div className="flex items-center gap-3.5">
            <span className="p-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30 shrink-0">
              <HeartPulse className="w-7 h-7" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-300 text-rose-950">
                  Dành Riêng Cho Nhân Viên Y Tế
                </span>
                <span className="text-xs font-bold text-rose-200">
                  Nghị định 233/2026/NĐ-CP • Biểu mẫu Mục B.IV (Thang điểm 100)
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-1">
                Bảng Đánh Giá Chất Lượng Viên Chức Y Tế Theo Đúng Văn Bản &amp; Biểu Mẫu Đính Kèm
              </h4>
              <p className="text-xs text-rose-100/90 mt-0.5 leading-relaxed">
                Cơ cấu Mục B (70đ): <strong>1. Số lượng (30đ: 6 tiêu chí x 5đ)</strong> (Sơ cấp cứu &amp; CSSK ban đầu, Hồ sơ sức khỏe học sinh, BH y tế &amp; tai nạn, Tuyên truyền sức khỏe vị thành niên, Phòng chống dịch bệnh &amp; bạo lực học đường, Tư vấn tâm lý) • <strong>2. Chất lượng (19đ thường + 11đ vượt trội 2*)</strong> (Đúng quy trình chuyên môn 4đ, Lưu trữ hồ sơ chính xác 4đ, Khám sức khỏe định kỳ 4đ, Bảo mật thông tin học sinh 4đ, Phối hợp GVBM &amp; GVCN 3đ, Vượt trội 2* 11đ) • <strong>3. Tiến độ (10đ)</strong> (Xử lý nghiệp vụ y tế &amp; tư vấn kịp thời 5đ, Tiến độ đầu việc 5đ).
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-xs font-black px-3.5 py-2 rounded-xl bg-rose-300 text-rose-950 shadow-sm inline-block">
              Vị trí: Nhân viên Y tế
            </span>
          </div>
        </div>
      )}

      {/* Office Head Notice Banner */}
      {isOfficeHeadRole && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md border-2 border-indigo-400">
          <div className="flex items-center gap-3.5">
            <span className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0">
              <Building className="w-7 h-7" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-300 text-indigo-950">
                  Dành Riêng Cho Tổ Trưởng Tổ Văn Phòng - Văn Thư
                </span>
                <span className="text-xs font-bold text-indigo-200">
                  Nghị định 233/2026/NĐ-CP • Biểu mẫu Mục B.II &amp; Tiêu chuẩn đặc thù Mục 4
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-1">
                Bảng Đánh Giá Chất Lượng Viên Chức Tổ Trưởng Tổ Văn Phòng Theo Đúng Văn Bản &amp; Biểu Mẫu Đính Kèm
              </h4>
              <p className="text-xs text-indigo-100/90 mt-0.5 leading-relaxed">
                Cơ cấu Mục B (70đ): <strong>1. Số lượng (20đ)</strong> (Văn bản đến, Văn bản đi, Con dấu, Lập hồ sơ lưu trữ, Học bạ số, Văn bằng/chứng chỉ) • <strong>2. Chất lượng (20đ = 9đ thường + 11đ vượt trội 2*)</strong> (Bảo mật con dấu, Báo cáo thống kê, Tính chính xác hồ sơ, CNTT văn thư, Cấp văn bằng kịp thời, Cải cách hành chính) • <strong>3. Tiến độ (10đ)</strong> (Gửi văn bản đúng hạn, Tiến độ các đầu việc) • <strong className="text-amber-300 underline underline-offset-2">4. Quản lý hoạt động của tổ (20đ - TIÊU CHUẨN ĐẶC THÙ)</strong> (Tổ thực hiện đủ việc, Tổ thực hiện chất lượng tiến độ, Năng lực tổ chức triển khai, Đoàn kết nội bộ tổ).
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-xs font-black px-3.5 py-2 rounded-xl bg-indigo-300 text-indigo-950 shadow-sm inline-block">
              Vị trí: Tổ trưởng Tổ Văn Phòng
            </span>
          </div>
        </div>
      )}

      {/* Equipment Staff Notice Banner */}
      {isEquipment && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-800 via-purple-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md border-2 border-purple-400">
          <div className="flex items-center gap-3.5">
            <span className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
              <FlaskConical className="w-7 h-7" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-300 text-purple-950">
                  Dành Riêng Cho Nhân Viên Thiết Bị, Thí Nghiệm
                </span>
                <span className="text-xs font-bold text-purple-200">
                  Nghị định 233/2026/NĐ-CP • Biểu mẫu Mục B.III (Thang điểm 100)
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-1">
                Bảng Đánh Giá Chất Lượng Viên Chức Thiết Bị, Thí Nghiệm Theo Đúng Văn Bản &amp; Biểu Mẫu Đính Kèm
              </h4>
              <p className="text-xs text-purple-100/90 mt-0.5 leading-relaxed">
                Cơ cấu Mục B (70đ): <strong>1. Số lượng (30đ: 6 tiêu chí x 5đ)</strong> (Quản lý thiết bị dùng chung, Thiết bị dạy học PHBM, Đủ loại sổ sách thiết bị, Quản lý phần mềm tài sản, Kiểm kê tài sản cuối năm tài chính, Kiểm định chất lượng) • <strong>2. Chất lượng (19đ thường + 11đ vượt trội 2*)</strong> (Quản lý hồ sơ số liệu 4đ, Bảo quản thiết bị dùng chung &amp; PHBM 4đ, Phối hợp GVBM chuẩn bị giờ dạy mượn trả 3đ, An toàn sử dụng thiết bị 4đ, CNTT công tác thiết bị 4đ, Vượt trội 2* 11đ) • <strong>3. Tiến độ (10đ)</strong> (Chuẩn bị thiết bị đúng giờ lên lớp 5đ, Tiến độ đầu việc 5đ).
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-xs font-black px-3.5 py-2 rounded-xl bg-purple-300 text-purple-950 shadow-sm inline-block">
              Vị trí: Nhân viên Thiết bị, thí nghiệm
            </span>
          </div>
        </div>
      )}

      {/* Clerical Staff Notice Banner */}
      {isClerical && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-800 via-sky-900 to-blue-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md border-2 border-sky-400">
          <div className="flex items-center gap-3.5">
            <span className="p-3 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 shrink-0">
              <FileText className="w-7 h-7" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-300 text-sky-950">
                  Dành Riêng Cho Nhân Viên Văn Thư
                </span>
                <span className="text-xs font-bold text-sky-200">
                  Nghị định 233/2026/NĐ-CP • Biểu mẫu Mục B.II (Thang điểm 100)
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-1">
                Bảng Đánh Giá Chất Lượng Viên Chức Văn Thư Theo Đúng Văn Bản &amp; Biểu Mẫu Đính Kèm
              </h4>
              <p className="text-xs text-sky-100/90 mt-0.5 leading-relaxed">
                Cơ cấu Mục B (70đ): <strong>1. Số lượng (30đ: 6 tiêu chí x 5đ)</strong> (Tiếp nhận văn bản đến, Quản lý văn bản đi, Quản lý con dấu, Lập hồ sơ lưu trữ, Quản lý học bạ số, Quản lý văn bằng) • <strong>2. Chất lượng (19đ thường + 11đ vượt trội 2*)</strong> (Bảo mật con dấu 4đ, Báo cáo thống kê 3đ, Chính xác hồ sơ 3đ, CNTT văn thư 3đ, Cấp văn bằng kịp thời 3đ, Cải cách hành chính 3đ, Vượt trội 2* 11đ) • <strong>3. Tiến độ (10đ)</strong> (Gửi văn bản đi đúng hạn 5đ, Tiến độ đầu việc 5đ).
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-xs font-black px-3.5 py-2 rounded-xl bg-sky-300 text-sky-950 shadow-sm inline-block">
              Vị trí: Nhân viên Văn thư
            </span>
          </div>
        </div>
      )}

      {/* Accounting Staff Notice Banner */}
      {isAccounting && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-800 via-teal-900 to-emerald-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md border-2 border-teal-500">
          <div className="flex items-center gap-3.5">
            <span className="p-3 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 shrink-0">
              <FileSpreadsheet className="w-7 h-7" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-300 text-teal-950">
                  Tiêu Chuẩn &amp; Tiêu Chí Dành Riêng Cho Nhân Viên Kế Toán
                </span>
                <span className="text-xs font-bold text-teal-200">
                  Nghị định 233/2026/NĐ-CP • Thang điểm 100
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-1">
                Bảng Đánh Giá Chất Lượng Viên Chức Kế Toán Theo Đúng Văn Bản &amp; Biểu Mẫu Đính Kèm
              </h4>
              <p className="text-xs text-teal-100/90 mt-0.5 leading-relaxed">
                Cơ cấu Mục B (70đ): <strong>1. Số lượng (30đ)</strong> (Sổ sách chứng từ, Dự toán kinh phí, Báo cáo quyết toán, Quản lý tài sản) • <strong>2. Chất lượng (19đ thường + 11đ vượt trội 2*)</strong> (Độ chính xác dữ liệu, Báo cáo tài chính, Chi lương &amp; an sinh, Công khai minh bạch &amp; chống lãng phí) • <strong>3. Tiến độ (10đ)</strong> (Báo cáo tài chính đúng tiến độ, Chi trả lương &amp; chính sách kịp thời).
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-xs font-black px-3.5 py-2 rounded-xl bg-teal-400 text-teal-950 shadow-sm inline-block">
              Vị trí: Kế toán viên
            </span>
          </div>
        </div>
      )}

      {/* Leader / Deputy Leader Notice Banner */}
      {isLeader && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md border-2 border-amber-500">
          <div className="flex items-center gap-3.5">
            <span className="p-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
              <Award className="w-7 h-7" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950">
                  Cơ Cấu Thang Điểm 100 Cho Tổ Trưởng &amp; Tổ Phó
                </span>
                <span className="text-xs font-bold text-amber-200">
                  Nghị định 233/2026/NĐ-CP
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-1">
                Phiếu Đánh Giá Chuyên Biệt Có Tiêu Chuẩn Đặc Thù Quản Lý Tổ/Nhóm CM (20 Điểm)
              </h4>
              <p className="text-xs text-amber-100/90 mt-0.5 leading-relaxed">
                Phân bổ Mục B (70đ): <strong>1. Số lượng (20đ)</strong> • <strong>2. Chất lượng (20đ)</strong> • <strong>3. Tiến độ (10đ)</strong> • <strong className="text-amber-300 underline underline-offset-2">4. Quản lý hoạt động của tổ/nhóm chuyên môn (20đ)</strong>.
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-xs font-black px-3.5 py-2 rounded-xl bg-amber-500 text-amber-950 shadow-sm inline-block">
              Khối Tổ trưởng &amp; Tổ phó CM
            </span>
          </div>
        </div>
      )}

      {/* Main Form: List of Criteria grouped by Section A (30đ) and Section B (70đ) */}
      <div className="space-y-8">
        {[
          {
            code: 'A',
            title: 'MỤC A: TIÊU CHÍ CHUNG',
            subTitle: 'Gồm Tiêu chuẩn 1 (TC1 - 10đ), Tiêu chuẩn 2 (TC2 - 10đ), Tiêu chuẩn 3 (TC3 - 10đ)',
            maxScore: 30,
            badgeStyle: 'bg-indigo-600 text-white shadow-indigo-200',
            cardStyle: 'bg-indigo-50/80 border-indigo-200 text-indigo-950',
            scoreColor: 'text-indigo-700',
            categories: userCategories.filter(c => c.sectionCode === 'A'),
          },
          {
            code: 'B',
            title: 'MỤC B: KẾT QUẢ THỰC HIỆN CHỨC TRÁCH, NHIỆM VỤ ĐƯỢC GIAO',
            subTitle: isOfficeHeadRole
              ? 'Gồm B.II: 1. Số lượng (20đ: 1.a-1.e), 2. Chất lượng (20đ: 2.a-2.e + 2*), 3. Tiến độ (10đ: 3.a-3.b) và 4. Quản lý hoạt động của tổ Văn phòng (20đ - TIÊU CHUẨN ĐẶC THÙ)'
              : isEquipment
              ? 'Gồm B.III: 1. Số lượng (30đ: 6 tiêu chí x 5đ), 2. Chất lượng (19đ thường + 11đ vượt trội 2*), 3. Tiến độ (10đ: 3.a 5đ, 3.b 5đ)'
              : isMedical
              ? 'Gồm B.IV: 1. Số lượng (30đ: 6 tiêu chí x 5đ), 2. Chất lượng (19đ thường + 11đ vượt trội 2*), 3. Tiến độ (10đ: 3.a 5đ, 3.b 5đ)'
              : isClerical
              ? 'Gồm B.II: 1. Số lượng (30đ: 6 tiêu chí x 5đ), 2. Chất lượng (19đ thường + 11đ vượt trội 2*), 3. Tiến độ (10đ: 3.a 5đ, 3.b 5đ)'
              : isAccounting
              ? 'Gồm 1. Số lượng (30đ: Sổ sách, Dự toán, Quyết toán, Quản lý tài sản), 2. Chất lượng (19đ thường + 11đ vượt trội 2*), 3. Tiến độ (10đ: Báo cáo, Chi trả lương kịp thời)'
              : isLeader
              ? 'Gồm 1. Số lượng (20đ), 2. Chất lượng (20đ), 3. Tiến độ (10đ), 4. Quản lý hoạt động của tổ/nhóm CM (20đ - TIÊU CHUẨN ĐẶC THÙ)'
              : 'Gồm 1. Số lượng công việc (30đ), 2. Chất lượng công việc (30đ), 3. Tiến độ thực hiện (10đ)',
            maxScore: 70,
            badgeStyle: isOfficeHeadRole
              ? 'bg-indigo-700 text-white shadow-indigo-200'
              : isEquipment
              ? 'bg-purple-700 text-white shadow-purple-200'
              : isMedical
              ? 'bg-rose-700 text-white shadow-rose-200'
              : isClerical
              ? 'bg-sky-700 text-white shadow-sky-200'
              : isAccounting
              ? 'bg-teal-700 text-white shadow-teal-200'
              : isLeader 
              ? 'bg-amber-600 text-white shadow-amber-200' 
              : 'bg-emerald-600 text-white shadow-emerald-200',
            cardStyle: isOfficeHeadRole
              ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950'
              : isEquipment
              ? 'bg-purple-50/80 border-purple-300 text-purple-950'
              : isMedical
              ? 'bg-rose-50/80 border-rose-300 text-rose-950'
              : isClerical
              ? 'bg-sky-50/80 border-sky-300 text-sky-950'
              : isAccounting
              ? 'bg-teal-50/80 border-teal-300 text-teal-950'
              : isLeader 
              ? 'bg-amber-50/80 border-amber-300 text-amber-950' 
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
            scoreColor: isOfficeHeadRole
              ? 'text-indigo-800'
              : isEquipment
              ? 'text-purple-800'
              : isMedical
              ? 'text-rose-800'
              : isClerical
              ? 'text-sky-800'
              : isAccounting
              ? 'text-teal-800'
              : isLeader 
              ? 'text-amber-800' 
              : 'text-emerald-700',
            categories: userCategories.filter(c => c.sectionCode === 'B'),
          },
        ].map((section) => {
          const sectionCriteria = userCriteria.filter(c => section.categories.some(cat => cat.id === c.categoryId));
          const sectionTotal = sectionCriteria.reduce((sum, c) => sum + (formScores[c.id] || 0), 0);

          return (
            <div key={section.code} className="space-y-4">
              {/* Section Header Banner */}
              <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${section.cardStyle}`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-md shrink-0 ${section.badgeStyle}`}>
                    {section.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${section.badgeStyle}`}>
                        Phần {section.code}
                      </span>
                      <span className="text-xs font-bold text-slate-500">Thang điểm: {section.maxScore} điểm</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      {section.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">{section.subTitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                  <span className="text-xs font-semibold text-slate-600">Điểm tự chấm Mục {section.code}:</span>
                  <span className={`text-base font-black font-mono ${section.scoreColor}`}>
                    {sectionTotal} <span className="text-xs text-slate-400 font-normal">/ {section.maxScore}đ</span>
                  </span>
                </div>
              </div>

              {/* Categories in this section */}
              <div className="space-y-5">
                {section.categories.map((category) => {
                  const catCriteria = userCriteria.filter(c => c.categoryId === category.id);
                  const catScores = catCriteria.map(c => formScores[c.id] || 0);
                  const catTotal = catScores.reduce((a, b) => a + b, 0);
                  const catMax = catCriteria.reduce((a, c) => a + c.maxScore, 0);
                  const isOfficeHeadSpecialSection = category.id === 'cat-b4-vttp';
                  const isLeaderSpecialSection = category.id === 'cat-b4-tt';
                  const isEquipmentCategory = category.id.includes('-tb') || category.applicableRoles?.includes('THIET_BI');
                  const isMedicalCategory = category.id.includes('-yt') || category.applicableRoles?.includes('Y_TE');
                  const isClericalCategory = category.id.includes('-vt') || category.applicableRoles?.includes('VAN_THU');
                  const isAccountingSpecialSection = category.id.includes('-kt') || category.applicableRoles?.includes('KE_TOAN');

                  return (
                    <div 
                      key={category.id} 
                      className={`rounded-2xl overflow-hidden transition-all ${
                        isOfficeHeadSpecialSection
                          ? 'border-2 border-indigo-500 bg-white ring-4 ring-indigo-400/20 shadow-md'
                          : isLeaderSpecialSection
                          ? 'border-2 border-amber-500 bg-white ring-4 ring-amber-400/20 shadow-md'
                          : isEquipmentCategory
                          ? 'border-2 border-purple-500 bg-white ring-4 ring-purple-400/20 shadow-md'
                          : isMedicalCategory
                          ? 'border-2 border-rose-500 bg-white ring-4 ring-rose-400/20 shadow-md'
                          : isClericalCategory
                          ? 'border-2 border-sky-500 bg-white ring-4 ring-sky-400/20 shadow-md'
                          : isAccountingSpecialSection
                          ? 'border-2 border-teal-500 bg-white ring-4 ring-teal-400/20 shadow-md'
                          : 'bg-white border border-slate-200 shadow-2xs'
                      }`}
                    >
                      {/* Category Header */}
                      {isOfficeHeadSpecialSection ? (
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-inner">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black uppercase tracking-wider bg-indigo-300 text-indigo-950 px-2.5 py-0.5 rounded shadow-xs">
                                {category.code}
                              </span>
                              <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded border border-white/30 flex items-center gap-1">
                                <Building className="w-3.5 h-3.5 text-indigo-200" />
                                TIÊU CHUẨN ĐẶC THÙ: TỔ TRƯỞNG TỔ VĂN PHÒNG (20 ĐIỂM)
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-white mt-1.5 flex items-center gap-2">
                              <span>{category.name}</span>
                            </h3>
                            <p className="text-xs text-indigo-100 mt-1 font-medium leading-relaxed">
                              {category.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 bg-white/10 px-3.5 py-2 rounded-xl border border-white/20">
                            <span className="text-xs font-bold text-indigo-100">Điểm nhóm đặc thù:</span>
                            <span className="text-sm font-black px-3 py-1 rounded-full bg-indigo-300 text-indigo-950 shadow-xs">
                              {catTotal} / {catMax} điểm
                            </span>
                          </div>
                        </div>
                      ) : isLeaderSpecialSection ? (
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex flex-wrap items-center justify-between gap-3 shadow-inner">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded shadow-xs">
                                {category.code}
                              </span>
                              <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded border border-white/30 flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-amber-300" />
                                TIÊU CHUẨN ĐẶC THÙ: TỔ TRƯỞNG &amp; TỔ PHÓ (20 ĐIỂM)
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-white mt-1.5 flex items-center gap-2">
                              <span>{category.name}</span>
                            </h3>
                            <p className="text-xs text-amber-100 mt-1 font-medium leading-relaxed">
                              {category.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 bg-white/10 px-3.5 py-2 rounded-xl border border-white/20">
                            <span className="text-xs font-bold text-amber-100">Điểm nhóm đặc thù:</span>
                            <span className="text-sm font-black px-3 py-1 rounded-full bg-amber-400 text-amber-950 shadow-xs">
                              {catTotal} / {catMax} điểm
                            </span>
                          </div>
                        </div>
                      ) : isEquipmentCategory ? (
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-inner">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black uppercase tracking-wider bg-purple-300 text-purple-950 px-2.5 py-0.5 rounded shadow-xs">
                                {category.code}
                              </span>
                              <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded border border-white/30 flex items-center gap-1">
                                <FlaskConical className="w-3.5 h-3.5 text-purple-200" />
                                TIÊU CHUẨN DÀNH CHO NHÂN VIÊN THIẾT BỊ, THÍ NGHIỆM (Nghị định 233/2026/NĐ-CP)
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-white mt-1.5 flex items-center gap-2">
                              <span>{category.name}</span>
                            </h3>
                            <p className="text-xs text-purple-100 mt-1 font-medium leading-relaxed">
                              {category.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 bg-white/10 px-3.5 py-2 rounded-xl border border-white/20">
                            <span className="text-xs font-bold text-purple-100">Điểm nhóm thiết bị:</span>
                            <span className="text-sm font-black px-3 py-1 rounded-full bg-purple-300 text-purple-950 shadow-xs">
                              {catTotal} / {catMax} điểm
                            </span>
                          </div>
                        </div>
                      ) : isMedicalCategory ? (
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-700 via-rose-800 to-pink-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-inner">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black uppercase tracking-wider bg-rose-300 text-rose-950 px-2.5 py-0.5 rounded shadow-xs">
                                {category.code}
                              </span>
                              <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded border border-white/30 flex items-center gap-1">
                                <HeartPulse className="w-3.5 h-3.5 text-rose-200" />
                                TIÊU CHUẨN DÀNH CHO NHÂN VIÊN Y TẾ (Nghị định 233/2026/NĐ-CP)
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-white mt-1.5 flex items-center gap-2">
                              <span>{category.name}</span>
                            </h3>
                            <p className="text-xs text-rose-100 mt-1 font-medium leading-relaxed">
                              {category.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 bg-white/10 px-3.5 py-2 rounded-xl border border-white/20">
                            <span className="text-xs font-bold text-rose-100">Điểm nhóm y tế:</span>
                            <span className="text-sm font-black px-3 py-1 rounded-full bg-rose-300 text-rose-950 shadow-xs">
                              {catTotal} / {catMax} điểm
                            </span>
                          </div>
                        </div>
                      ) : isClericalCategory ? (
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-700 via-sky-800 to-blue-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-inner">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black uppercase tracking-wider bg-sky-300 text-sky-950 px-2.5 py-0.5 rounded shadow-xs">
                                {category.code}
                              </span>
                              <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded border border-white/30 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-sky-200" />
                                TIÊU CHUẨN DÀNH CHO NHÂN VIÊN VĂN THƯ (Nghị định 233/2026/NĐ-CP)
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-white mt-1.5 flex items-center gap-2">
                              <span>{category.name}</span>
                            </h3>
                            <p className="text-xs text-sky-100 mt-1 font-medium leading-relaxed">
                              {category.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 bg-white/10 px-3.5 py-2 rounded-xl border border-white/20">
                            <span className="text-xs font-bold text-sky-100">Điểm nhóm văn thư:</span>
                            <span className="text-sm font-black px-3 py-1 rounded-full bg-sky-300 text-sky-950 shadow-xs">
                              {catTotal} / {catMax} điểm
                            </span>
                          </div>
                        </div>
                      ) : isAccountingSpecialSection ? (
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-inner">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black uppercase tracking-wider bg-teal-300 text-teal-950 px-2.5 py-0.5 rounded shadow-xs">
                                {category.code}
                              </span>
                              <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded border border-white/30 flex items-center gap-1">
                                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-200" />
                                TIÊU CHUẨN DÀNH CHO NHÂN VIÊN KẾ TOÁN
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-white mt-1.5 flex items-center gap-2">
                              <span>{category.name}</span>
                            </h3>
                            <p className="text-xs text-teal-100 mt-1 font-medium leading-relaxed">
                              {category.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 bg-white/10 px-3.5 py-2 rounded-xl border border-white/20">
                            <span className="text-xs font-bold text-teal-100">Điểm nhóm kế toán:</span>
                            <span className="text-sm font-black px-3 py-1 rounded-full bg-teal-300 text-teal-950 shadow-xs">
                              {catTotal} / {catMax} điểm
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-blue-50/70 border-b border-blue-200 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="text-[11px] font-black text-blue-900 uppercase tracking-wider bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded">
                              {category.code}
                            </span>
                            <h3 className="text-sm font-black text-blue-950 mt-1">{category.name}</h3>
                            <p className="text-xs text-blue-900/80 mt-0.5 font-medium">{category.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-900">Điểm nhóm:</span>
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-900 text-white shadow-2xs">
                              {catTotal} / {catMax} điểm
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Criteria List */}
                      <div className="divide-y divide-slate-100">
                        {catCriteria.map((criterion, critIdx) => {
                          const detail = currentEvalDetails.find(d => d.criterionId === criterion.id);
                          const selectedScore = formScores[criterion.id] ?? null;
                          const evidenceText = formEvidence[criterion.id] || '';
                          const teacherNote = formNotes[criterion.id] || '';
                          const hasEvidence = (evidenceText && evidenceText.trim().length > 0) || (detail?.evidenceFiles && detail.evidenceFiles.length > 0);
                          const isBlueHighlight = criterion.highlightColor === 'blue';
                          const isRedHighlight = criterion.highlightColor === 'red';

                          return (
                            <div 
                              key={criterion.id} 
                              className={`p-4 sm:p-5 transition-colors space-y-4 ${
                                isBlueHighlight 
                                  ? 'bg-sky-50/50 border-l-4 border-l-sky-500 hover:bg-sky-50/80' 
                                  : isRedHighlight
                                  ? 'bg-rose-50/30 border-l-4 border-l-rose-500 hover:bg-rose-50/60'
                                  : 'hover:bg-slate-50/50'
                              }`}
                            >
                              {/* Top Header Row: Code (Màu xanh dương đậm), Group Name, Status Pill and Top-Right Stepper */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-md shadow-2xs ${
                                    isAccountingSpecialSection
                                      ? 'bg-teal-700 text-white'
                                      : isLeaderSpecialSection
                                      ? 'bg-amber-700 text-white'
                                      : isBlueHighlight 
                                      ? 'bg-sky-700 text-white' 
                                      : 'bg-blue-900 text-white'
                                  }`}>
                                    Tiêu chí {criterion.code}
                                  </span>
                                  {isAccountingSpecialSection && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-teal-600 text-white flex items-center gap-1 shadow-2xs">
                                      <FileSpreadsheet className="w-3 h-3" />
                                      Nghiệp vụ Kế toán
                                    </span>
                                  )}
                                  {isLeaderSpecialSection && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-600 text-white flex items-center gap-1 shadow-2xs">
                                      <Award className="w-3 h-3" />
                                      Đặc thù Quản lý Tổ
                                    </span>
                                  )}
                                  {isBlueHighlight && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-600 text-white">
                                      Vượt trội (11đ)
                                    </span>
                                  )}
                                  {isRedHighlight && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-600 text-white">
                                      Trọng tâm NĐ 233
                                    </span>
                                  )}
                                  <span className={`text-xs font-bold ${
                                    isAccountingSpecialSection
                                      ? 'text-teal-900'
                                      : isLeaderSpecialSection
                                      ? 'text-amber-900'
                                      : 'text-blue-900'
                                  }`}>
                                    {category.name.includes(':') ? category.name.split(':')[1]?.trim() || category.name : category.name}
                                  </span>
                                  {/* Score Status Badge */}
                                  {selectedScore !== null && selectedScore >= criterion.maxScore ? (
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300">
                                      Đạt tối đa
                                    </span>
                                  ) : selectedScore !== null && selectedScore > 0 ? (
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      Đạt {Math.round((selectedScore / criterion.maxScore) * 100)}%
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                      Chưa chấm (0%)
                                    </span>
                                  )}

                                  {/* Compulsory Evidence Status Badge */}
                                  {hasEvidence ? (
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                      <span>Đã có minh chứng ({detail?.evidenceFiles?.length || 0} tệp)</span>
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3 text-amber-600" />
                                      <span>Bắt buộc có minh chứng</span>
                                    </span>
                                  )}
                                </div>

                                {/* Top Right: Chuẩn tối đa + Big bold score + Stepper [-] [input] [+] */}
                                <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <div className="text-[11px] text-slate-500 font-medium">
                              Chuẩn tối đa: {criterion.maxScore}đ
                            </div>
                            <div className="text-lg font-black text-slate-900 font-mono leading-none mt-0.5">
                              {selectedScore !== null ? selectedScore : 0}đ
                            </div>
                          </div>

                          {/* Stepper Buttons and Number Input */}
                          <div className="flex items-center">
                            <button
                              type="button"
                              disabled={isLocked || (selectedScore !== null && selectedScore <= 0)}
                              onClick={() => {
                                const step = criterion.maxScore <= 2 ? 0.5 : 1;
                                const curr = selectedScore !== null ? selectedScore : criterion.maxScore;
                                handleScoreChange(criterion.id, Math.max(0, Math.round((curr - step) * 10) / 10));
                              }}
                              className="w-8 h-8 rounded-l-lg border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                              title="Giảm điểm"
                            >
                              -
                            </button>

                            <input
                              type="number"
                              min="0"
                              max={criterion.maxScore}
                              step={criterion.maxScore <= 2 ? "0.25" : "0.5"}
                              disabled={isLocked}
                              value={selectedScore !== null ? selectedScore : 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                handleScoreChange(
                                  criterion.id,
                                  isNaN(val) ? 0 : Math.min(criterion.maxScore, Math.max(0, val))
                                );
                              }}
                              className="w-14 h-8 text-center font-mono font-bold text-sm bg-white border-y-2 border-x-2 border-emerald-500 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />

                            <button
                              type="button"
                              disabled={isLocked || (selectedScore !== null && selectedScore >= criterion.maxScore)}
                              onClick={() => {
                                const step = criterion.maxScore <= 2 ? 0.5 : 1;
                                const curr = selectedScore !== null ? selectedScore : 0;
                                handleScoreChange(criterion.id, Math.min(criterion.maxScore, Math.round((curr + step) * 10) / 10));
                              }}
                              className="w-8 h-8 rounded-r-lg border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                              title="Tăng điểm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Criterion Full Name / Statement (Màu đen đậm) */}
                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-[15px] font-black text-black leading-relaxed">
                          {criterion.name}
                        </h4>
                        {criterion.description && (
                          <p className="text-xs text-black font-semibold leading-relaxed">
                            {criterion.description}
                          </p>
                        )}
                      </div>

                      {/* Percentage Suggestion Section */}
                      <div className="space-y-2.5 pt-0.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1">
                              <span>%</span>
                              <span>Gợi ý thang điểm:</span>
                            </span>
                            <span className="text-xs text-slate-500">
                              (Bấm chọn nhanh theo mức độ hoàn thành)
                            </span>
                          </div>

                          {/* Tùy chọn % Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => setOpenCustomPctId(openCustomPctId === criterion.id ? null : criterion.id)}
                              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tùy chọn %</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {openCustomPctId === criterion.id && (
                              <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 w-48 text-xs">
                                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                                  Chọn tỉ lệ hoàn thành:
                                </div>
                                {[100, 90, 80, 75, 60, 50, 25, 0].map(pct => {
                                  const sc = Math.round((criterion.maxScore * (pct / 100)) * 10) / 10;
                                  return (
                                    <button
                                      key={pct}
                                      type="button"
                                      onClick={() => {
                                        handleScoreChange(criterion.id, sc);
                                        setOpenCustomPctId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-left hover:bg-emerald-50 flex items-center justify-between text-slate-700 transition-colors"
                                    >
                                      <span>{pct}% hoàn thành</span>
                                      <span className="font-mono font-bold text-emerald-700">{sc}đ</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 4 Quick Completion Buttons: 100%, 75%, 50%, 0% */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {[
                            { pct: 100, score: criterion.maxScore },
                            { pct: 75, score: Math.round(criterion.maxScore * 0.75 * 10) / 10 },
                            { pct: 50, score: Math.round(criterion.maxScore * 0.5 * 10) / 10 },
                            { pct: 0, score: 0 },
                          ].map(item => {
                            const isChosen = selectedScore === item.score;

                            return (
                              <button
                                key={item.pct}
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleScoreChange(criterion.id, item.score)}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  isChosen
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-2xs'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                                } ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                              >
                                {isChosen && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                <span>{item.pct}% ({item.score}đ)</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Info Note: Tối đa Xđ khi hoàn thành 100% công việc; hoàn thành 50% công việc sẽ là Yđ. */}
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800 pt-0.5">
                          <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            Mục {criterion.code}: Tối đa {criterion.maxScore}đ khi hoàn thành 100% công việc; hoàn thành 50% công việc sẽ là {Math.round(criterion.maxScore * 0.5 * 10) / 10}đ.
                          </span>
                        </div>
                      </div>

                      {/* Evidence & Documentation Container (Compulsory for every criterion) */}
                      <div className={`p-3.5 rounded-xl border transition-all ${
                        hasEvidence 
                          ? 'bg-slate-50/70 border-slate-200' 
                          : 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Paperclip className={`w-4 h-4 ${hasEvidence ? 'text-emerald-600' : 'text-amber-600'}`} />
                            <span className="text-xs font-bold text-slate-800">
                              Hồ sơ minh chứng bắt buộc:
                            </span>
                            {hasEvidence ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Đã hoàn thiện ({detail?.evidenceFiles?.length || 0} tệp)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1 animate-pulse">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span>Chưa có minh chứng</span>
                              </span>
                            )}
                          </div>

                          {/* Action Buttons: Real File Upload & Standard Sample */}
                          {!isLocked && detail && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Real Computer File Upload */}
                              <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-lg cursor-pointer shadow-2xs transition-colors">
                                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Tải tệp từ máy tính</span>
                                <input
                                  type="file"
                                  multiple
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
                                  onChange={(e) => handleRealFileUpload(detail.id, criterion.id, e)}
                                />
                              </label>

                              {/* Official Sample Evidence Button */}
                              <button
                                type="button"
                                onClick={() => handleAttachSampleForCriterion(detail.id, criterion)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                title="Tự động nạp minh chứng chuẩn và tệp PDF mẫu cho tiêu chí này"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Gợi ý minh chứng chuẩn</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Evidence description & reference details */}
                        <textarea
                          disabled={isLocked}
                          rows={2}
                          placeholder="Nhập tên minh chứng, số hiệu văn bản/kế hoạch, đường dẫn liên kết hoặc mô tả chi tiết..."
                          value={evidenceText}
                          onChange={e => handleEvidenceChange(criterion.id, e.target.value)}
                          className="w-full text-xs px-3.5 py-2 border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-600 shadow-2xs mb-2"
                        />

                        {/* File attachments list */}
                        <div>
                          {detail?.evidenceFiles && detail.evidenceFiles.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {detail.evidenceFiles.map(file => (
                                <div
                                  key={file.id}
                                  className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs shadow-2xs group hover:border-emerald-300"
                                >
                                  <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span className="font-semibold text-slate-800 text-[11px] max-w-[240px] truncate" title={file.name}>
                                    {file.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">({file.size})</span>
                                  {!isLocked && (
                                    <button
                                      type="button"
                                      onClick={() => removeEvidenceFile(detail.id, file.id)}
                                      className="text-slate-400 hover:text-rose-600 ml-1 p-0.5 rounded transition-colors"
                                      title="Xóa tệp"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-700/80 italic flex items-center gap-1.5 py-1 bg-amber-50/60 px-2.5 rounded-md border border-amber-200/60">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Mỗi tiêu chí cần phải có minh chứng. Nhấn <strong>"Tải tệp từ máy tính"</strong> hoặc bấm <strong>"Gợi ý minh chứng chuẩn"</strong> để đính kèm.</span>
                            </div>
                          )}
                        </div>

                        {/* Feedback from Group or BGH if available */}
                        {detail?.groupNote && (
                          <div className="mt-2.5 p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
                            <span className="font-bold">Ý kiến thẩm định của Tổ trưởng:</span> {detail.groupNote}
                          </div>
                        )}
                        {detail?.bghNote && (
                          <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900">
                            <span className="font-bold">Kết luận của Ban Giám hiệu:</span> {detail.bghNote}
                          </div>
                        )}
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

        {/* General Teacher Statement */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Ý Kiến &amp; Kế Hoạch Phấn Đấu Của Bản Thân
          </h3>
          <p className="text-xs text-slate-500">
            Tự nhận xét về những điểm mạnh, tồn tại cần khắc phục và phương hướng bồi dưỡng chuyên môn trong năm học tiếp theo
          </p>
          <textarea
            disabled={isLocked}
            rows={3}
            value={generalComment}
            onChange={e => setGeneralComment(e.target.value)}
            placeholder="Ví dụ: Bản thân luôn chấp hành tốt chủ trương chính sách, tích cực học hỏi đổi mới phương pháp giảng dạy. Năm tới sẽ tiếp tục nghiên cứu chuyển đổi số và tham gia thi giáo viên dạy giỏi..."
            className="w-full text-xs px-3 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-slate-100"
          />

          {!isLocked && (
            <div className="pt-4 flex items-center justify-end gap-3 flex-wrap border-t border-slate-100 mt-4">
              {/* 1. Lưu & In phiếu */}
              <button
                type="button"
                onClick={() => {
                  handleSaveDraft();
                  setShowPrintModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-200 transition-colors cursor-pointer"
                title="Lưu tiến độ bản nháp hiện tại và mở cửa sổ In phiếu đánh giá"
              >
                <Printer className="w-4 h-4" />
                <span>Lưu &amp; In phiếu</span>
              </button>

              {/* 2. Nộp phiếu (Gửi đánh giá) */}
              <button
                type="button"
                onClick={handleSubmitEvaluation}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-200 transition-colors cursor-pointer"
                title="Gửi bản tự đánh giá lên Tổ trưởng chuyên môn"
              >
                <Send className="w-4 h-4" />
                <span>Nộp phiếu</span>
              </button>

              {/* 3. Quay lại */}
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                title="Quay lại đầu trang"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span>Quay lại</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Printable Evaluation Modal */}
      {showPrintModal && (
        <PrintEvaluationModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          evaluation={activeEval}
          teacher={currentUser}
        />
      )}
    </div>
  );
};
