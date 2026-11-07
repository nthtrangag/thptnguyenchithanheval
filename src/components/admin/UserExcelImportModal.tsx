import React, { useState, useRef } from 'react';
import { useEvaluation } from '../../context/EvaluationContext';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  ParsedUserRow,
  parseExcelFile,
  downloadSampleExcel
} from '../../utils/excelUserUtils';
import { User, RoleId } from '../../types';

interface UserExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserExcelImportModal: React.FC<UserExcelImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { users, departments, roles, importUsersBatch } = useEvaluation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [parseError, setParseError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'upsert' | 'replace'>('upsert');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'warning' | 'error'>('all');
  const [importSuccessMessage, setImportSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setParseError('');
    setImportSuccessMessage('');
    setIsProcessing(true);
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    try {
      const buffer = await file.arrayBuffer();
      const rows = parseExcelFile(buffer, departments, users);
      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err.message || 'Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng!');
      setParsedRows([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // Load sample demo rows immediately without needing a local file
  const handleLoadDemoData = () => {
    setParseError('');
    setImportSuccessMessage('');
    setFileName('Mau_Du_Lieu_Vi_Du_THPT_NguyenChiThanh.xlsx');
    setFileSize('18.4 KB');

    const demoUsers: ParsedUserRow[] = [
      {
        rowNumber: 2,
        teacherCode: 'GV-020',
        fullName: 'ThS. Đặng Thị Ánh Tuyết',
        username: 'anhtuyet_toan',
        password: '123456',
        email: 'anhtuyet@thptnguyenchithanh.edu.vn',
        roleId: 'GIAO_VIEN',
        roleName: 'Giáo Viên',
        departmentId: 'dept-toan',
        departmentName: 'Tổ Toán',
        title: 'Giáo viên bộ môn',
        isDepartmentHead: false,
        subject: 'Toán học',
        phone: '0988112233',
        status: 'valid',
        statusMessage: 'Sẵn sàng thêm mới',
        raw: {},
      },
      {
        rowNumber: 3,
        teacherCode: 'GV-021',
        fullName: 'Thầy Võ Hoàng Long',
        username: 'hoanglong_tin',
        password: '123456',
        email: 'hoanglong@thptnguyenchithanh.edu.vn',
        roleId: 'GIAO_VIEN',
        roleName: 'Giáo Viên',
        departmentId: 'dept-hoa-tin-tnhn',
        departmentName: 'Tổ Hóa-Tin-TNHN',
        title: 'Giáo viên bộ môn',
        isDepartmentHead: false,
        subject: 'Tin học - TNHN',
        phone: '0988223344',
        status: 'valid',
        statusMessage: 'Sẵn sàng thêm mới',
        raw: {},
      },
      {
        rowNumber: 4,
        teacherCode: 'GV-022',
        fullName: 'Cô Mai Thị Bích Ngọc',
        username: 'bichngoc_van',
        password: '123456',
        email: 'bichngoc@thptnguyenchithanh.edu.vn',
        roleId: 'GIAO_VIEN',
        roleName: 'Giáo Viên',
        departmentId: 'dept-van-tv-gddp',
        departmentName: 'Tổ Ngữ Văn-Thư Viện-GDĐP',
        title: 'Giáo viên bộ môn',
        isDepartmentHead: false,
        subject: 'Ngữ Văn - GDĐP',
        phone: '0988334455',
        status: 'valid',
        statusMessage: 'Sẵn sàng thêm mới',
        raw: {},
      },
      {
        rowNumber: 5,
        teacherCode: 'GV-023',
        fullName: 'Thầy Nguyễn Trí Dũng',
        username: 'tridung_ly',
        password: '123456',
        email: 'tridung@thptnguyenchithanh.edu.vn',
        roleId: 'TO_TRUONG',
        roleName: 'Tổ Trưởng Chuyên Môn',
        departmentId: 'dept-ly-ktcn',
        departmentName: 'Tổ Lý-KTCN',
        title: 'Tổ trưởng chuyên môn Lý-KTCN',
        isDepartmentHead: true,
        subject: 'Vật Lý - KTCN',
        phone: '0988445566',
        status: 'valid',
        statusMessage: 'Sẵn sàng thêm mới',
        raw: {},
      },
      {
        rowNumber: 6,
        teacherCode: 'GV-024',
        fullName: 'Cô Lê Thu Trang',
        username: 'thutrang_tienganh',
        password: '123456',
        email: 'thutrang@thptnguyenchithanh.edu.vn',
        roleId: 'GIAO_VIEN',
        roleName: 'Giáo Viên',
        departmentId: 'dept-tieng-anh',
        departmentName: 'Tổ Tiếng Anh',
        title: 'Giáo viên Tiếng Anh',
        isDepartmentHead: false,
        subject: 'Tiếng Anh',
        phone: '0988556677',
        status: 'valid',
        statusMessage: 'Sẵn sàng thêm mới',
        raw: {},
      },
      {
        rowNumber: 7,
        teacherCode: 'NV-030',
        fullName: 'Cô Lê Thị Kim Oanh',
        username: 'kimoanh_vp',
        password: '123456',
        email: 'kimoanh@thptnguyenchithanh.edu.vn',
        roleId: 'NHAN_VIEN',
        roleName: 'Nhân Viên',
        departmentId: 'dept-van-phong',
        departmentName: 'Tổ Văn Phòng',
        title: 'Kế toán viên - Quản trị thiết bị',
        isDepartmentHead: false,
        subject: 'Tài chính - Kế toán & Thiết bị',
        phone: '0988667788',
        status: 'valid',
        statusMessage: 'Sẵn sàng thêm mới',
        raw: {},
      },
      {
        rowNumber: 8,
        teacherCode: 'GV-001',
        fullName: 'Cô Phạm Thu Hà',
        username: 'gvtoan1',
        password: '123456',
        email: 'phamthuha@thptnguyenchithanh.edu.vn',
        roleId: 'GIAO_VIEN',
        roleName: 'Giáo Viên',
        departmentId: 'dept-toan',
        departmentName: 'Tổ Toán',
        title: 'Giáo viên bộ môn',
        isDepartmentHead: false,
        subject: 'Toán học',
        phone: '0912345671',
        status: 'warning',
        statusMessage: 'Đã tồn tại tài khoản (@gvtoan1). Sẽ cập nhật dữ liệu.',
        raw: {},
      },
    ];

    setParsedRows(demoUsers);
  };

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter(r => r.status !== 'error');
    if (validRows.length === 0) {
      setParseError('Không có dòng dữ liệu hợp lệ nào để nạp!');
      return;
    }

    const payload: Omit<User, 'id'>[] = validRows.map(r => ({
      username: r.username,
      password: r.password || '123456',
      fullName: r.fullName,
      email: r.email,
      roleId: r.roleId,
      departmentId: r.departmentId,
      isDepartmentHead: r.isDepartmentHead,
      title: r.title,
      teacherCode: r.teacherCode,
      phone: r.phone,
      subject: r.subject,
    }));

    const result = importUsersBatch(payload, importMode);
    setImportSuccessMessage(
      `Đã nạp thành công! Thêm mới: ${result.added} tài khoản, Cập nhật: ${result.updated} tài khoản.`
    );

    // Auto-close modal after brief feedback
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const warningCount = parsedRows.filter(r => r.status === 'warning').length;
  const errorCount = parsedRows.filter(r => r.status === 'error').length;

  const filteredRows = parsedRows.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                Tải Lên Danh Sách Tài Khoản &amp; Phân Quyền Từ File Excel
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  .xlsx / .xls / .csv
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập danh sách viên chức, phân bổ tổ chuyên môn, role_id và chức vụ hàng loạt theo quy chuẩn NĐ 233/2026
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast if completed */}
        {importSuccessMessage && (
          <div className="m-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs font-bold">{importSuccessMessage}</div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Top Actions: Template Download & Test Demo */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-700 text-xs">
                Chưa có file Excel mẫu chuẩn?
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadSampleExcel(departments)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 font-bold transition-all text-xs cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tải File Mẫu Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleLoadDemoData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-bold transition-all text-xs cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Nạp Dữ Liệu Thử Nghiệm</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/60 scale-[0.99]'
                : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
              <Upload className="w-6 h-6" />
            </div>

            <div className="font-bold text-slate-800 text-sm">
              Kéo thả file Excel vào đây hoặc <span className="text-emerald-600 underline">bấm để chọn tệp</span>
            </div>
            <p className="text-slate-500 text-[11px] mt-1">
              Hỗ trợ tệp định dạng .xlsx, .xls, .csv (Tối đa 10MB)
            </p>

            {fileName && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>{fileName} ({fileSize})</span>
              </div>
            )}
          </div>

          {/* Parsing Errors */}
          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Không thể đọc file:</strong>
                <span>{parseError}</span>
              </div>
            </div>
          )}

          {/* Preview Section if rows parsed */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              {/* Summary Stats & Filter Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 text-xs">
                    Xem trước danh sách ({parsedRows.length} dòng):
                  </span>

                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      filterStatus === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả ({parsedRows.length})
                  </button>

                  <button
                    onClick={() => setFilterStatus('valid')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      filterStatus === 'valid'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    🟢 Hợp lệ ({validCount})
                  </button>

                  {warningCount > 0 && (
                    <button
                      onClick={() => setFilterStatus('warning')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                        filterStatus === 'warning'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      🟡 Cập nhật ({warningCount})
                    </button>
                  )}

                  {errorCount > 0 && (
                    <button
                      onClick={() => setFilterStatus('error')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                        filterStatus === 'error'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      🔴 Lỗi ({errorCount})
                    </button>
                  )}
                </div>

                {/* Import Mode Radio */}
                <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-lg text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium px-2 py-1 rounded bg-white text-slate-800 shadow-2xs">
                    <input
                      type="radio"
                      name="importMode"
                      value="upsert"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Thêm mới &amp; Cập nhật (Khuyên dùng)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium px-2 py-1 rounded text-slate-600 hover:text-slate-900">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Thay thế danh sách</span>
                  </label>
                </div>
              </div>

              {/* Table Grid */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 font-bold text-center w-12">Dòng</th>
                      <th className="py-2 px-2.5 font-bold">Mã VC</th>
                      <th className="py-2 px-2.5 font-bold">Họ và Tên</th>
                      <th className="py-2 px-2.5 font-bold">Tài Khoản / Mật Khẩu</th>
                      <th className="py-2 px-2.5 font-bold">Tổ Chuyên Môn</th>
                      <th className="py-2 px-2.5 font-bold">Vai Trò (role_id)</th>
                      <th className="py-2 px-2.5 font-bold">Chức Vụ</th>
                      <th className="py-2 px-2.5 font-bold">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredRows.map((r) => {
                      const roleObj = roles.find(x => x.id === r.roleId);
                      return (
                        <tr key={r.rowNumber} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 text-center font-mono text-slate-400">
                            #{r.rowNumber}
                          </td>
                          <td className="py-2 px-2.5 font-mono font-bold text-slate-800">
                            {r.teacherCode}
                          </td>
                          <td className="py-2 px-2.5 font-bold text-slate-900">
                            {r.fullName}
                          </td>
                          <td className="py-2 px-2.5 font-mono">
                            <span className="text-emerald-700 font-bold">@{r.username}</span>
                            <span className="text-slate-400 ml-1.5">({r.password})</span>
                          </td>
                          <td className="py-2 px-2.5 text-slate-700 font-medium">
                            {r.departmentName}
                          </td>
                          <td className="py-2 px-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleObj?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                              {r.roleId}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-slate-600">
                            {r.title}
                            {r.isDepartmentHead && (
                              <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                Tổ trưởng
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5">
                            {r.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Hợp lệ
                              </span>
                            )}
                            {r.status === 'warning' && (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title={r.statusMessage}>
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Cập nhật
                              </span>
                            )}
                            {r.status === 'error' && (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200" title={r.statusMessage}>
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                {r.statusMessage}
                              </span>
                            )}
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

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 ? (
              <span>
                Sẵn sàng nạp <strong>{validCount + warningCount}</strong> / {parsedRows.length} tài khoản vào hệ thống
              </span>
            ) : (
              <span>Chọn file Excel hoặc bấm &quot;Nạp Dữ Liệu Thử Nghiệm&quot; để tiếp tục</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              disabled={parsedRows.length === 0 || validCount + warningCount === 0 || isProcessing}
              onClick={handleExecuteImport}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xác Nhận Nạp Tài Khoản Vào Hệ Thống</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
