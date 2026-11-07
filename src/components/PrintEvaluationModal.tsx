import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { useEvaluation } from '../context/EvaluationContext';
import { Evaluation, User } from '../types';
import { RANKING_DEFINITIONS, formatDate, getUserEmulationGroup, EMULATION_GROUPS, isDepartmentLeaderOrDeputy, isAccountingStaff, isOfficeHead, isClericalStaff, isEquipmentStaff, isMedicalStaff } from '../utils/evaluationRules';

interface PrintEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: Evaluation;
  teacher: User;
}

export const PrintEvaluationModal: React.FC<PrintEvaluationModalProps> = ({
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
    getUserDepartment,
    getUserById,
    periods,
  } = useEvaluation();

  if (!isOpen) return null;

  const isHeadOfOffice = isOfficeHead(teacher);
  const isEquipment = isEquipmentStaff(teacher);
  const isMedical = isMedicalStaff(teacher);
  const isClerical = isClericalStaff(teacher);
  const isLeader = isDepartmentLeaderOrDeputy(teacher);
  const isAccounting = isAccountingStaff(teacher);
  const { categories, criteria } = getUserCriteria(teacher);

  const dept = getUserDepartment(teacher.departmentId);
  const period = periods.find(p => p.id === evaluation.periodId);
  const evalDetails = evaluationDetails.filter(d => d.evaluationId === evaluation.id);
  const groupReviewer = evaluation.groupReviewerId ? getUserById(evaluation.groupReviewerId) : null;
  const bghReviewer = evaluation.bghReviewerId ? getUserById(evaluation.bghReviewerId) : null;

  const bghRankDef = evaluation.bghRanking ? RANKING_DEFINITIONS[evaluation.bghRanking] : null;
  const totalMaxScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);
  const emulationGroupKey = getUserEmulationGroup(teacher);
  const emulationGroupDef = EMULATION_GROUPS[emulationGroupKey];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Controls (Not Printed) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold">Phiếu Đánh Giá Viên Chức Theo Nghị Định 233/2026/NĐ-CP</span>
            {isHeadOfOffice ? (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-400 text-indigo-950 shadow-2xs">
                Dành Cho Tổ Trưởng Tổ Văn Phòng - Văn Thư (100đ - Có Mục 4)
              </span>
            ) : isMedical ? (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-400 text-rose-950 shadow-2xs">
                Dành Cho Nhân Viên Y Tế (100đ)
              </span>
            ) : isEquipment ? (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-400 text-purple-950 shadow-2xs">
                Dành Cho Nhân Viên Thiết Bị, Thí Nghiệm (100đ)
              </span>
            ) : isClerical ? (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-400 text-sky-950 shadow-2xs">
                Dành Cho Nhân Viên Văn Thư (100đ)
              </span>
            ) : isAccounting ? (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-400 text-teal-950 shadow-2xs">
                Dành Cho Nhân Viên Kế Toán (100đ)
              </span>
            ) : isLeader ? (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 shadow-2xs">
                Dành Cho Tổ Trưởng / Tổ Phó CM (100đ - Có Mục 4)
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu Ngay</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-slate-900 bg-white font-serif">
          {/* Official National Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4 pb-6 border-b-2 border-slate-900">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/logo_b43cd193.jpg"
                alt="Logo Trường THPT Nguyễn Chí Thanh"
                className="w-14 h-14 object-cover rounded-full border border-slate-300 shrink-0 shadow-xs"
              />
              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-slate-700">
                  SỞ GIÁO DỤC VÀ ĐÀO TẠO AN GIANG
                </div>
                <div className="text-xs uppercase font-black tracking-wide text-slate-900">
                  TRƯỜNG THPT NGUYỄN CHÍ THANH
                </div>
                <div className="text-[11px] text-slate-600 italic">Phú Tân - An Giang • Số: ...... /PĐG-VC-233</div>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase font-black tracking-wider">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="text-xs font-bold tracking-wide">
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div className="text-xs tracking-widest text-slate-400">❖ ❖ ❖</div>
            </div>
          </div>

          {/* Form Title */}
          <div className="text-center my-6 space-y-1">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">
              PHIẾU ĐÁNH GIÁ VÀ XẾP LOẠI CHẤT LƯỢNG VIÊN CHỨC
            </h2>
            <p className="text-xs italic text-slate-600">
              (Theo quy định tại Nghị định số 233/2026/NĐ-CP của Chính phủ về đánh giá, xếp loại chất lượng viên chức)
            </p>
            {isHeadOfOffice && (
              <p className="text-xs font-bold text-indigo-900">
                [Biểu mẫu tiêu chuẩn &amp; tiêu chí dành riêng cho Tổ trưởng Tổ Văn Phòng - Văn thư - Thang điểm 100]
              </p>
            )}
            {isMedical && (
              <p className="text-xs font-bold text-rose-900">
                [Biểu mẫu tiêu chuẩn &amp; tiêu chí dành riêng cho Nhân viên Y tế - Thang điểm 100]
              </p>
            )}
            {isEquipment && (
              <p className="text-xs font-bold text-purple-900">
                [Biểu mẫu tiêu chuẩn &amp; tiêu chí dành riêng cho Nhân viên Thiết bị, thí nghiệm - Thang điểm 100]
              </p>
            )}
            {isClerical && (
              <p className="text-xs font-bold text-sky-900">
                [Biểu mẫu tiêu chuẩn &amp; tiêu chí dành riêng cho Nhân viên Văn thư - Thang điểm 100]
              </p>
            )}
            {isAccounting && (
              <p className="text-xs font-bold text-teal-900">
                [Biểu mẫu tiêu chuẩn &amp; tiêu chí dành riêng cho Nhân viên Kế toán - Thang điểm 100]
              </p>
            )}
            {isLeader && (
              <p className="text-xs font-bold text-amber-900">
                [Biểu mẫu tiêu chuẩn &amp; tiêu chí dành riêng cho Tổ trưởng, Tổ phó chuyên môn - Thang điểm 100]
              </p>
            )}
            <p className="text-xs font-bold text-indigo-900 pt-1">
              Đợt đánh giá: {period?.name} ({period?.academicYear})
            </p>
          </div>

          {/* Teacher Basic Info */}
          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 mb-6 font-sans text-xs space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500">Họ và tên viên chức: </span>
                <strong className="text-slate-900 text-sm">{teacher.fullName}</strong>
                {isLeader && (
                  <span className="ml-2 font-mono text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    Tổ trưởng / Tổ phó
                  </span>
                )}
                {isMedical && (
                  <span className="ml-2 font-mono text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold border border-rose-300">
                    Nhân viên Y tế
                  </span>
                )}
                {isEquipment && (
                  <span className="ml-2 font-mono text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold border border-purple-300">
                    Nhân viên Thiết bị, thí nghiệm
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500">Mã số viên chức: </span>
                <strong className="font-mono text-slate-900">{teacher.teacherCode}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-200">
              <div>
                <span className="text-slate-500">Tổ / bộ phận: </span>
                <strong>{dept?.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">{emulationGroupKey === 'NHAN_VIEN' ? 'Vị trí công tác: ' : 'Môn giảng dạy: '}</span>
                <strong>{emulationGroupKey === 'NHAN_VIEN' ? (teacher.title || 'Nhân viên') : (teacher.subject || 'Giảng dạy')}</strong>
              </div>
              <div>
                <span className="text-slate-500">Chức vụ: </span>
                <strong>{teacher.title}</strong>
              </div>
              <div>
                <span className="text-slate-500">Nhóm thi đua: </span>
                <strong className="text-indigo-900 font-bold">{emulationGroupDef.name}</strong>
              </div>
            </div>
          </div>

          {/* Score Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left border-collapse border border-slate-400 font-sans text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 text-center font-bold">
                  <th className="border border-slate-400 p-2 w-12">Mã</th>
                  <th className="border border-slate-400 p-2 text-left">Tiêu chuẩn &amp; Tiêu chí đánh giá</th>
                  <th className="border border-slate-400 p-2 w-16">Tối đa</th>
                  <th className="border border-slate-400 p-2 w-20">GV tự chấm</th>
                  <th className="border border-slate-400 p-2 w-20">Tổ chấm</th>
                  <th className="border border-slate-400 p-2 w-20">BGH chấm</th>
                  <th className="border border-slate-400 p-2 text-left">Minh chứng tóm tắt</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    code: 'A',
                    title: 'MỤC A: TIÊU CHÍ CHUNG (30 ĐIỂM)',
                    maxScore: 30,
                    headerBg: 'bg-indigo-950 text-white',
                    categories: categories.filter(c => c.sectionCode === 'A' || ['cat-a1', 'cat-a2', 'cat-a3'].includes(c.id)),
                  },
                  {
                    code: 'B',
                    title: 'MỤC B: KẾT QUẢ THỰC HIỆN CHỨC TRÁCH, NHIỆM VỤ ĐƯỢC GIAO (70 ĐIỂM)',
                    maxScore: 70,
                    headerBg: isAccounting ? 'bg-teal-950 text-white' : 'bg-emerald-950 text-white',
                    categories: categories.filter(c => c.sectionCode === 'B' || (isAccounting ? ['cat-b1-kt', 'cat-b2-kt', 'cat-b3-kt'].includes(c.id) : isLeader ? ['cat-b1-tt', 'cat-b2-tt', 'cat-b3-tt', 'cat-b4-tt'].includes(c.id) : ['cat-b1', 'cat-b2', 'cat-b3'].includes(c.id))),
                  },
                ].map((section) => (
                  <React.Fragment key={section.code}>
                    {/* Section Header Row */}
                    <tr className={`${section.headerBg} font-black text-xs uppercase border-b-2 border-slate-900 tracking-wider`}>
                      <td colSpan={7} className="border border-slate-900 p-2.5">
                        <div className="flex items-center justify-between">
                          <span>{section.title}</span>
                          <span className="font-mono text-[11px] font-bold">Tối đa: {section.maxScore} điểm</span>
                        </div>
                      </td>
                    </tr>

                    {/* Standard Categories in this section */}
                    {section.categories.map((cat) => {
                      const catCrit = criteria.filter((c) => c.categoryId === cat.id);
                      const isLeaderSpecialCat = cat.id === 'cat-b4-tt';
                      const isAccountingCat = cat.id.includes('-kt') || isAccounting;

                      return (
                        <React.Fragment key={cat.id}>
                          <tr className={isAccountingCat ? "bg-teal-100/90 font-bold border-b border-teal-400" : isLeaderSpecialCat ? "bg-amber-100/90 font-bold border-b border-amber-400" : "bg-blue-100/90 font-bold border-b border-slate-400"}>
                            <td colSpan={7} className={`border p-2 text-xs ${isAccountingCat ? 'border-teal-400 text-teal-950 font-black' : isLeaderSpecialCat ? 'border-amber-400 text-amber-950 font-black' : 'border-slate-400 text-blue-950 font-black'}`}>
                              <span className={`font-mono mr-2 font-black ${isAccountingCat ? 'text-teal-900' : isLeaderSpecialCat ? 'text-amber-900' : 'text-blue-900'}`}>[{cat.code}]</span>
                              <span className="uppercase">{cat.name}</span>
                              <span className={`font-mono ml-2 font-bold ${isAccountingCat ? 'text-teal-900' : isLeaderSpecialCat ? 'text-amber-900' : 'text-blue-900'}`}>
                                ({cat.maxScore} điểm{isAccountingCat ? ' - TIÊU CHUẨN KẾ TOÁN' : isLeaderSpecialCat ? ' - TIÊU CHUẨN ĐẶC THÙ' : ''})
                              </span>
                            </td>
                          </tr>

                          {catCrit.map((crit) => {
                            const detail = evalDetails.find((d) => d.criterionId === crit.id);
                            const isBlueSpecial = crit.highlightColor === 'blue' || crit.code === '2*';
                            const isRedSpecial = crit.highlightColor === 'red' || crit.code === '1.h' || crit.code === '3.a';

                            return (
                              <tr key={crit.id} className={`border-b border-slate-300 ${isBlueSpecial ? 'bg-sky-100/60 font-semibold' : isRedSpecial ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}>
                                <td className={`border border-slate-300 p-2 font-mono text-center font-black ${isBlueSpecial ? 'text-sky-950 bg-sky-200/60' : isRedSpecial ? 'text-rose-900 bg-rose-100/60' : 'text-blue-900 bg-blue-50/40'}`}>
                                  {crit.code}
                                </td>
                                <td className={`border border-slate-300 p-2 text-xs ${isBlueSpecial ? 'text-sky-950 font-black' : isRedSpecial ? 'text-rose-950 font-bold' : 'font-bold text-black'}`}>
                                  <div>{crit.name}</div>
                                  {isBlueSpecial && (
                                    <div className="text-[10px] text-sky-800 font-mono font-bold mt-0.5">
                                      * Thưởng chất lượng: Tối đa {crit.maxScore}đ
                                    </div>
                                  )}
                                </td>
                                <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                                  {crit.maxScore}đ
                                </td>
                                <td className="border border-slate-300 p-2 text-center font-mono font-bold text-emerald-800">
                                  {detail?.selfScore ?? '-'}
                                </td>
                                <td className="border border-slate-300 p-2 text-center font-mono font-bold text-amber-800">
                                  {detail?.groupScore ?? '-'}
                                </td>
                                <td className="border border-slate-300 p-2 text-center font-mono font-black text-rose-800">
                                  {detail?.bghScore ?? '-'}
                                </td>
                                <td className="border border-slate-300 p-2 text-slate-700 text-xs">
                                  {detail?.evidenceText && (
                                    <div className="line-clamp-2 text-slate-800">{detail.evidenceText}</div>
                                  )}
                                  {detail?.evidenceFiles && detail.evidenceFiles.length > 0 && (
                                    <div className="font-mono text-[10px] text-indigo-800 font-semibold mt-0.5">
                                      Tệp đính kèm: {detail.evidenceFiles.map(f => f.name).join(', ')}
                                    </div>
                                  )}
                                  {!detail?.evidenceText && (!detail?.evidenceFiles || detail.evidenceFiles.length === 0) && (
                                    <span className="italic text-slate-400">Chưa có minh chứng</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}

                {/* Total row */}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-center">
                  <td colSpan={2} className="border border-slate-400 p-2.5 text-right uppercase">
                    TỔNG CỘNG ĐIỂM ĐÁNH GIÁ:
                  </td>
                  <td className="border border-slate-400 p-2.5 font-mono">{totalMaxScore}đ</td>
                  <td className="border border-slate-400 p-2.5 font-mono text-emerald-900 text-sm">
                    {evaluation.selfTotalScore}đ
                  </td>
                  <td className="border border-slate-400 p-2.5 font-mono text-amber-900 text-sm">
                    {evaluation.groupTotalScore !== null ? `${evaluation.groupTotalScore}đ` : '-'}
                  </td>
                  <td className="border border-slate-400 p-2.5 font-mono text-rose-900 text-sm font-black">
                    {evaluation.bghTotalScore !== null ? `${evaluation.bghTotalScore}đ` : '-'}
                  </td>
                  <td className="border border-slate-400 p-2.5 text-left font-sans text-xs">
                    Xếp loại: <strong>{bghRankDef ? bghRankDef.label : 'Đang xử lý'}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detailed Comments */}
          <div className="space-y-4 mb-8 font-sans text-xs">
            <div className="p-3 border border-slate-300 rounded-lg">
              <span className="font-bold block text-slate-800 mb-1">1. Ý kiến tự nhận xét của giáo viên:</span>
              <p className="italic text-slate-700">
                "{evaluation.generalTeacherComment || 'Bản thân luôn chấp hành tốt mọi nhiệm vụ được giao.'}"
              </p>
            </div>

            <div className="p-3 border border-slate-300 rounded-lg">
              <span className="font-bold block text-slate-800 mb-1">2. Ý kiến thẩm định và đề xuất của Tổ chuyên môn:</span>
              <p className="italic text-slate-700">
                "{evaluation.generalGroupComment || 'Tổ chuyên môn nhất trí với kết quả tự đánh giá.'}"
              </p>
            </div>

            <div className="p-4 border-2 border-slate-900 rounded-lg bg-slate-50/50">
              <span className="font-black uppercase block text-slate-900 mb-1">
                3. Kết luận và Quyết định xếp loại của Thủ trưởng đơn vị (Ban Giám hiệu):
              </span>
              <div className="font-bold text-sm text-indigo-950 mb-1">
                Xếp loại chính thức: {bghRankDef ? bghRankDef.label.toUpperCase() : 'CHƯA PHÊ DUYỆT'}
              </div>
              <p className="italic text-slate-800">
                "{evaluation.generalBghComment || 'Ban Giám hiệu phê chuẩn kết quả đánh giá theo đúng quy định.'}"
              </p>
            </div>
          </div>

          {/* Signature Grid */}
          <div className="grid grid-cols-3 text-center text-xs pt-4 gap-4">
            <div>
              <div className="font-bold uppercase text-slate-900">GIÁO VIÊN ĐÁNH GIÁ</div>
              <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
              <div className="h-20 flex items-end justify-center font-bold font-serif text-slate-800">
                {teacher.fullName}
              </div>
            </div>

            <div>
              <div className="font-bold uppercase text-slate-900">TỔ TRƯỞNG CHUYÊN MÔN</div>
              <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
              <div className="h-20 flex items-end justify-center font-bold font-serif text-slate-800">
                {groupReviewer ? groupReviewer.fullName : 'ThS. Lê Văn Nam'}
              </div>
            </div>

            <div>
              <div className="font-bold uppercase text-slate-900">HIỆU TRƯỞNG</div>
              <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký tên, đóng dấu)</div>
              <div className="h-20 flex flex-col items-center justify-end font-bold font-serif text-rose-800">
                {evaluation.status === 'APPROVED' && (
                  <span className="text-[10px] uppercase border border-rose-600 px-2 py-0.5 rounded text-rose-700 font-mono mb-1">
                    [ĐÃ ĐÓNG DẤU ĐIỆN TỬ]
                  </span>
                )}
                <span>{bghReviewer ? bghReviewer.fullName : 'PGS.TS Nguyễn Văn An'}</span>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-10 pt-4 border-t border-slate-200">
            Hệ thống Đánh giá viên chức theo Nghị định 233/2026/NĐ-CP • Xuất bản ngày {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>
    </div>
  );
};
