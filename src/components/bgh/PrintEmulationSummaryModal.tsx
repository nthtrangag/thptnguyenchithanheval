import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Award, 
  School, 
  CheckCircle2, 
  FileText,
  Users,
  Briefcase
} from 'lucide-react';
import { User, Evaluation, EvaluationPeriod, Department } from '../../types';
import { 
  getUserEmulationGroup, 
  EMULATION_GROUPS, 
  RANKING_DEFINITIONS, 
  formatDate 
} from '../../utils/evaluationRules';

interface PrintEmulationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: EvaluationPeriod;
  users: User[];
  evaluations: Evaluation[];
  departments: Department[];
}

export const PrintEmulationSummaryModal: React.FC<PrintEmulationSummaryModalProps> = ({
  isOpen,
  onClose,
  period,
  users,
  evaluations,
  departments,
}) => {
  if (!isOpen) return null;

  // Filter teachers and staff
  const staffList = users.filter(u => ['GIAO_VIEN', 'TO_TRUONG', 'NHAN_VIEN'].includes(u.roleId));
  const periodEvals = evaluations.filter(e => e.periodId === period.id);

  // 1. Group Giáo viên, Tổ trưởng, Tổ phó
  const teachersGroup = staffList
    .filter(u => getUserEmulationGroup(u) === 'GIAO_VIEN_TO_TRUONG')
    .map(teacher => {
      const evaluation = periodEvals.find(e => e.userId === teacher.id);
      const dept = departments.find(d => d.id === teacher.departmentId);
      const score = evaluation?.bghTotalScore ?? evaluation?.groupTotalScore ?? evaluation?.selfTotalScore ?? 0;
      return { teacher, evaluation, dept, score };
    })
    .sort((a, b) => b.score - a.score);

  // 2. Group Nhân viên
  const staffGroup = staffList
    .filter(u => getUserEmulationGroup(u) === 'NHAN_VIEN')
    .map(teacher => {
      const evaluation = periodEvals.find(e => e.userId === teacher.id);
      const dept = departments.find(d => d.id === teacher.departmentId);
      const score = evaluation?.bghTotalScore ?? evaluation?.groupTotalScore ?? evaluation?.selfTotalScore ?? 0;
      return { teacher, evaluation, dept, score };
    })
    .sort((a, b) => b.score - a.score);

  // Calculate statistics for each group
  const statsTeachers = {
    total: teachersGroup.length,
    xuatSac: teachersGroup.filter(i => (i.evaluation?.bghRanking || i.evaluation?.groupRanking) === 'XUAT_SAC').length,
    tot: teachersGroup.filter(i => (i.evaluation?.bghRanking || i.evaluation?.groupRanking) === 'TOT').length,
    hoanThanh: teachersGroup.filter(i => (i.evaluation?.bghRanking || i.evaluation?.groupRanking) === 'HOAN_THANH').length,
    chuaHT: teachersGroup.filter(i => (i.evaluation?.bghRanking || i.evaluation?.groupRanking) === 'CHUA_HOAN_THANH').length,
  };

  const statsStaff = {
    total: staffGroup.length,
    xuatSac: staffGroup.filter(i => (i.evaluation?.bghRanking || i.evaluation?.groupRanking) === 'XUAT_SAC').length,
    tot: staffGroup.filter(i => (i.evaluation?.bghRanking || i.evaluation?.groupRanking) === 'TOT').length,
    hoanThanh: staffGroup.filter(i => (i.evaluation?.bghRanking || i.evaluation?.groupRanking) === 'HOAN_THANH').length,
    chuaHT: staffGroup.filter(i => (i.evaluation?.bghRanking || i.evaluation?.groupRanking) === 'CHUA_HOAN_THANH').length,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl my-6 shadow-2xl flex flex-col max-h-[92vh] border border-slate-300">
        
        {/* Top Header Controls (hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between rounded-t-2xl shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">
                Bảng Tổng Kết Xếp Loại Thi Đua Phân Theo 2 Nhóm Viên Chức
              </h3>
              <p className="text-[11px] text-slate-300">
                Căn cứ Nghị định 233/2026/NĐ-CP • Đợt: {period.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Bảng Tổng Kết</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 font-serif text-slate-900 leading-relaxed text-xs sm:text-sm bg-white">
          
          {/* Institutional Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
            <div className="text-center font-sans space-y-0.5">
              <div className="text-[11px] font-semibold uppercase text-slate-600">SỞ GIÁO DỤC VÀ ĐÀO TẠO AN GIANG</div>
              <div className="text-xs font-black uppercase text-slate-900 tracking-wide">TRƯỜNG THPT NGUYỄN CHÍ THANH</div>
              <div className="text-[10px] text-slate-500 italic">Số: ...../BC-THPTNCT</div>
            </div>

            <div className="text-center font-sans space-y-0.5">
              <div className="text-[11px] font-black uppercase text-slate-900">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="text-[11px] font-bold text-slate-800">Độc lập - Tự do - Hạnh phúc</div>
              <div className="text-[10px] text-slate-500 italic mt-1">Phú Tân, ngày ..... tháng ..... năm 2027</div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center my-6 space-y-1.5 font-sans">
            <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-wide">
              BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ, XẾP LOẠI THI ĐUA VIÊN CHỨC
            </h1>
            <p className="text-xs font-bold text-blue-900 uppercase">
              {period.name.toUpperCase()} (NĂM HỌC {period.academicYear})
            </p>
            <p className="text-[11px] text-slate-600 italic">
              (Thực hiện theo quy định phân chia 02 nhóm thi đua: Nhóm Nhân viên và Nhóm Giáo viên, Tổ trưởng, Tổ phó)
            </p>
          </div>

          {/* SECTION 1: NHÓM GIÁO VIÊN, TỔ TRƯỞNG, TỔ PHÓ */}
          <div className="mb-8 space-y-3 font-sans">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                  I
                </span>
                <div>
                  <h2 className="text-xs sm:text-sm font-black uppercase text-emerald-950">
                    KHỐI 1: NHÓM GIÁO VIÊN, TỔ TRƯỞNG, TỔ PHÓ
                  </h2>
                  <p className="text-[11px] text-emerald-800">
                    Đội ngũ trực tiếp giảng dạy và phụ trách chuyên môn ({statsTeachers.total} viên chức)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold flex-wrap">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Xuất sắc: {statsTeachers.xuatSac}/{statsTeachers.total} ({statsTeachers.total > 0 ? ((statsTeachers.xuatSac/statsTeachers.total)*100).toFixed(1) : 0}%)
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">
                  Tốt: {statsTeachers.tot}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Hoàn thành: {statsTeachers.hoanThanh}
                </span>
              </div>
            </div>

            {/* Table for Teachers Group */}
            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold text-center">
                    <th className="p-2 border-r border-slate-300 w-10">STT</th>
                    <th className="p-2 border-r border-slate-300 w-20">Mã VC</th>
                    <th className="p-2 border-r border-slate-300 text-left">Họ và Tên</th>
                    <th className="p-2 border-r border-slate-300 text-left">Chức vụ / Nhiệm vụ</th>
                    <th className="p-2 border-r border-slate-300 text-left">Tổ chuyên môn</th>
                    <th className="p-2 border-r border-slate-300 w-16">Tự chấm</th>
                    <th className="p-2 border-r border-slate-300 w-16">Tổ chấm</th>
                    <th className="p-2 border-r border-slate-300 w-16">BGH chấm</th>
                    <th className="p-2 border-r border-slate-300 w-28">Kết quả xếp loại</th>
                    <th className="p-2 w-28">Danh hiệu thi đua</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {teachersGroup.map((item, idx) => {
                    const rankingKey = item.evaluation?.bghRanking || item.evaluation?.groupRanking;
                    const rankingMeta = rankingKey ? RANKING_DEFINITIONS[rankingKey] : null;

                    return (
                      <tr key={item.teacher.id} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-300 text-center font-bold">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-mono text-center font-semibold text-blue-900">{item.teacher.teacherCode}</td>
                        <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{item.teacher.fullName}</td>
                        <td className="p-2 border-r border-slate-300 text-slate-700">{item.teacher.title}</td>
                        <td className="p-2 border-r border-slate-300 text-slate-700">{item.dept?.name}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-mono font-semibold text-emerald-800">{item.evaluation?.selfTotalScore ? `${item.evaluation.selfTotalScore}đ` : '-'}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-mono font-semibold text-amber-800">{item.evaluation?.groupTotalScore !== null && item.evaluation?.groupTotalScore !== undefined ? `${item.evaluation.groupTotalScore}đ` : '-'}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-mono font-bold text-rose-800">{item.evaluation?.bghTotalScore !== null && item.evaluation?.bghTotalScore !== undefined ? `${item.evaluation.bghTotalScore}đ` : '-'}</td>
                        <td className="p-2 border-r border-slate-300 text-center">
                          {rankingMeta ? (
                            <span className="font-bold text-slate-900">{rankingMeta.shortLabel}</span>
                          ) : (
                            <span className="text-slate-400 italic">Đang chấm</span>
                          )}
                        </td>
                        <td className="p-2 text-center font-semibold text-slate-700">
                          {rankingKey === 'XUAT_SAC' ? 'CSTĐ Cơ sở' : rankingKey === 'TOT' ? 'Lao động tiên tiến' : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: NHÓM NHÂN VIÊN */}
          <div className="mb-8 space-y-3 font-sans">
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                  II
                </span>
                <div>
                  <h2 className="text-xs sm:text-sm font-black uppercase text-sky-950">
                    KHỐI 2: NHÓM NHÂN VIÊN
                  </h2>
                  <p className="text-[11px] text-sky-800">
                    Đội ngũ nhân viên hành chính, kế toán, y tế, văn thư, thủ quỹ, thiết bị, thư viện ({statsStaff.total} nhân viên)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold flex-wrap">
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300">
                  Xuất sắc: {statsStaff.xuatSac}/{statsStaff.total} ({statsStaff.total > 0 ? ((statsStaff.xuatSac/statsStaff.total)*100).toFixed(1) : 0}%)
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">
                  Tốt: {statsStaff.tot}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Hoàn thành: {statsStaff.hoanThanh}
                </span>
              </div>
            </div>

            {/* Table for Staff Group */}
            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold text-center">
                    <th className="p-2 border-r border-slate-300 w-10">STT</th>
                    <th className="p-2 border-r border-slate-300 w-20">Mã VC</th>
                    <th className="p-2 border-r border-slate-300 text-left">Họ và Tên</th>
                    <th className="p-2 border-r border-slate-300 text-left">Vị trí việc làm</th>
                    <th className="p-2 border-r border-slate-300 text-left">Đơn vị / Tổ</th>
                    <th className="p-2 border-r border-slate-300 w-16">Tự chấm</th>
                    <th className="p-2 border-r border-slate-300 w-16">Tổ chấm</th>
                    <th className="p-2 border-r border-slate-300 w-16">BGH chấm</th>
                    <th className="p-2 border-r border-slate-300 w-28">Kết quả xếp loại</th>
                    <th className="p-2 w-28">Danh hiệu thi đua</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {staffGroup.map((item, idx) => {
                    const rankingKey = item.evaluation?.bghRanking || item.evaluation?.groupRanking;
                    const rankingMeta = rankingKey ? RANKING_DEFINITIONS[rankingKey] : null;

                    return (
                      <tr key={item.teacher.id} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-300 text-center font-bold">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-mono text-center font-semibold text-blue-900">{item.teacher.teacherCode}</td>
                        <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{item.teacher.fullName}</td>
                        <td className="p-2 border-r border-slate-300 text-slate-700">{item.teacher.title}</td>
                        <td className="p-2 border-r border-slate-300 text-slate-700">{item.dept?.name}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-mono font-semibold text-emerald-800">{item.evaluation?.selfTotalScore ? `${item.evaluation.selfTotalScore}đ` : '-'}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-mono font-semibold text-amber-800">{item.evaluation?.groupTotalScore !== null && item.evaluation?.groupTotalScore !== undefined ? `${item.evaluation.groupTotalScore}đ` : '-'}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-mono font-bold text-rose-800">{item.evaluation?.bghTotalScore !== null && item.evaluation?.bghTotalScore !== undefined ? `${item.evaluation.bghTotalScore}đ` : '-'}</td>
                        <td className="p-2 border-r border-slate-300 text-center">
                          {rankingMeta ? (
                            <span className="font-bold text-slate-900">{rankingMeta.shortLabel}</span>
                          ) : (
                            <span className="text-slate-400 italic">Đang chấm</span>
                          )}
                        </td>
                        <td className="p-2 text-center font-semibold text-slate-700">
                          {rankingKey === 'XUAT_SAC' ? 'CSTĐ Cơ sở' : rankingKey === 'TOT' ? 'Lao động tiên tiến' : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="grid grid-cols-2 gap-8 text-center mt-10 pt-6 font-sans">
            <div>
              <div className="font-bold text-slate-800 uppercase text-xs">CHỦ TỊCH CÔNG ĐOÀN CƠ SỞ</div>
              <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
              <div className="h-20"></div>
              <div className="font-bold text-slate-900 text-xs">ThS. Lê Văn Nam</div>
            </div>

            <div>
              <div className="font-bold text-slate-800 uppercase text-xs">HIỆU TRƯỞNG - CHỦ TỊCH HĐ THI ĐUA</div>
              <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký tên và đóng dấu)</div>
              <div className="h-20"></div>
              <div className="font-bold text-slate-900 text-xs">PGS.TS Nguyễn Văn An</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
