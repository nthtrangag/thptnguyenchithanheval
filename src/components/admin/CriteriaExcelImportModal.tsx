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
  Layers,
  ChevronDown,
  ChevronUp,
  FolderTree,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ParsedCriterionRow,
  ParseCriteriaResult,
  parseCriteriaExcel,
  downloadCriteriaSampleExcel,
  DEMO_PRESET_ND233_CRITERIA,
} from '../../utils/excelCriteriaUtils';
import { CriteriaCategory, Criterion } from '../../types';

interface CriteriaExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CriteriaExcelImportModal: React.FC<CriteriaExcelImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { categories, criteria, importCriteriaBatch } = useEvaluation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseCriteriaResult | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'upsert' | 'replace'>('upsert');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'existing' | 'error'>('all');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
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
      const result = parseCriteriaExcel(buffer, categories, criteria);
      setParseResult(result);
    } catch (err: any) {
      setParseError(err.message || 'Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng hoặc dùng file mẫu chuẩn.');
      setParseResult(null);
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

  // Quick demo loader for testing immediately without file upload
  const handleLoadDemoData = () => {
    setParseError('');
    setImportSuccessMessage('');
    setFileName('Mau_Tieu_Chuan_ND233_Demo.xlsx');
    setFileSize('14.2 KB');

    // Synthesize categories and criteria from DEMO_PRESET_ND233_CRITERIA
    const catMap = new Map<string, { code: string; name: string; order: number }>();
    DEMO_PRESET_ND233_CRITERIA.forEach(r => {
      if (!catMap.has(r.categoryCode)) {
        catMap.set(r.categoryCode, {
          code: r.categoryCode,
          name: r.categoryName,
          order: r.categoryOrder || 1,
        });
      }
    });

    const demoCategories: CriteriaCategory[] = Array.from(catMap.entries()).map(([code, val]) => {
      const existing = categories.find(c => c.code.toLowerCase() === code.toLowerCase());
      return {
        id: existing ? existing.id : `cat-${code.toLowerCase()}`,
        code: val.code,
        name: val.name,
        order: val.order,
        description: `Nhóm tiêu chuẩn theo Nghị định 233/2026/NĐ-CP: ${val.name}`,
        maxScore: DEMO_PRESET_ND233_CRITERIA.filter(r => r.categoryCode === code).reduce((s, r) => s + r.maxScore, 0),
        sectionCode: (val.order <= 3 || (val.code.startsWith('TC') && !val.code.startsWith('TC-B'))) ? 'A' : 'B',
        sectionName: (val.order <= 3 || (val.code.startsWith('TC') && !val.code.startsWith('TC-B'))) ? 'A. TIÊU CHÍ CHUNG (30 điểm)' : 'B. KẾT QUẢ THỰC HIỆN CHỨC TRÁCH, NHIỆM VỤ ĐƯỢC GIAO (70 điểm)',
      };
    });

    const demoCriteriaList: Criterion[] = DEMO_PRESET_ND233_CRITERIA.map(r => {
      const cat = demoCategories.find(c => c.code === r.categoryCode);
      const existing = criteria.find(c => c.code.toLowerCase() === r.criterionCode.toLowerCase());
      return {
        id: existing ? existing.id : `crit-demo-${r.criterionCode.toLowerCase()}`,
        categoryId: cat ? cat.id : 'cat-1',
        code: r.criterionCode,
        name: r.criterionName,
        description: r.description,
        maxScore: r.maxScore,
        levels: [
          { level: 'Chưa đạt', score: 1, description: r.levelChuaDat || '' },
          { level: 'Đạt', score: 2, description: r.levelDat || '' },
          { level: 'Khá', score: 3, description: r.levelKha || '' },
          { level: 'Tốt', score: 4, description: r.levelTot || '' },
        ],
      };
    });

    const validRows = DEMO_PRESET_ND233_CRITERIA.map(r => {
      const isExisting = criteria.some(c => c.code.toLowerCase() === r.criterionCode.toLowerCase());
      return {
        ...r,
        isExisting,
        status: isExisting ? ('warning' as const) : ('valid' as const),
        statusMessage: isExisting
          ? `Mã "${r.criterionCode}" đã có trong hệ thống (sẽ được cập nhật lại)`
          : 'Hợp lệ - sẵn sàng nạp mới',
      };
    });

    setParseResult({
      rows: validRows,
      extractedCategories: demoCategories,
      finalCriteria: demoCriteriaList,
      stats: {
        totalRows: validRows.length,
        validCount: validRows.filter(r => r.status === 'valid').length,
        warningCount: validRows.filter(r => r.status === 'warning').length,
        errorCount: 0,
        newCriteriaCount: validRows.filter(r => !r.isExisting).length,
        existingCriteriaCount: validRows.filter(r => r.isExisting).length,
        categoriesCount: demoCategories.length,
      },
    });
  };

  const handleApplyImport = () => {
    if (!parseResult || parseResult.finalCriteria.length === 0) return;

    try {
      const res = importCriteriaBatch(
        parseResult.extractedCategories,
        parseResult.finalCriteria,
        importMode
      );

      setImportSuccessMessage(
        `Nạp thành công! Đã xử lý ${parseResult.extractedCategories.length} Tiêu chuẩn (${res.categoriesAdded} thêm mới, ${res.categoriesUpdated} cập nhật) và ${parseResult.finalCriteria.length} Tiêu chí (${res.criteriaAdded} thêm mới, ${res.criteriaUpdated} cập nhật).`
      );

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setParseError(err.message || 'Lỗi khi lưu vào cơ sở dữ liệu hệ thống.');
    }
  };

  const filteredRows = parseResult?.rows.filter(r => {
    if (filterStatus === 'new') return !r.isExisting && r.status !== 'error';
    if (filterStatus === 'existing') return r.isExisting && r.status !== 'error';
    if (filterStatus === 'error') return r.status === 'error';
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <Upload className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Tải Lên Tiêu Chuẩn &amp; Tiêu Chí Đánh Giá (Excel)
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-purple-100">
                  Nghị định 233/2026/NĐ-CP
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Nhập danh mục Tiêu chuẩn (Categories) và Tiêu chí (Criteria) đánh giá chất lượng viên chức giáo dục từ file <code>.xlsx</code> / <code>.csv</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Action Ribbon: Template & Quick Demo */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Chưa có file mẫu chuẩn theo quy định?
                </span>
                <span className="text-[11px] text-slate-500">
                  Tải bảng mẫu Excel có sẵn các cột Tiêu chuẩn, Tiêu chí, Điểm tối đa và 4 mức xếp loại chi tiết.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadCriteriaSampleExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Tải File Mẫu Excel (.xlsx)
              </button>

              <button
                type="button"
                onClick={handleLoadDemoData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                title="Tự động nạp bộ 10 tiêu chí mẫu theo NĐ 233 để xem trước"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Nạp Tiêu Chuẩn Mẫu Demo
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                : fileName
                ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400'
                : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/70'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                {isProcessing ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                ) : fileName ? (
                  <FileCheck className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Upload className="w-6 h-6 text-indigo-600" />
                )}
              </div>

              <div>
                {fileName ? (
                  <>
                    <p className="text-sm font-bold text-slate-800">
                      {fileName} <span className="text-xs font-normal text-slate-500">({fileSize})</span>
                    </p>
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">
                      Nhấn vào đây hoặc kéo thả file khác để thay thế
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-700">
                      Nhấn để chọn file Excel hoặc kéo thả file vào đây
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Hỗ trợ định dạng Microsoft Excel <code>.xlsx</code>, <code>.xls</code> hoặc <code>.csv</code>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Lỗi xử lý file:</strong> {parseError}
              </div>
            </div>
          )}

          {/* Success Message */}
          {importSuccessMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>{importSuccessMessage}</div>
            </div>
          )}

          {/* Parsed Preview Section */}
          {parseResult && (
            <div className="space-y-4">
              {/* Stat summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-purple-600" />
                    Nhóm Tiêu Chuẩn
                  </div>
                  <div className="text-xl font-black text-purple-900 mt-1">
                    {parseResult.stats.categoriesCount} tiêu chuẩn
                  </div>
                  <div className="text-[10px] text-purple-600 mt-0.5">
                    Tự động nhận diện &amp; gom nhóm
                  </div>
                </div>

                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-indigo-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Tổng Tiêu Chí Đọc Được
                  </div>
                  <div className="text-xl font-black text-indigo-900 mt-1">
                    {parseResult.stats.totalRows} tiêu chí
                  </div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">
                    {parseResult.stats.newCriteriaCount} mới • {parseResult.stats.existingCriteriaCount} cập nhật
                  </div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Hợp Lệ Sẵn Sàng
                  </div>
                  <div className="text-xl font-black text-emerald-900 mt-1">
                    {parseResult.stats.validCount + parseResult.stats.warningCount}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">
                    Đủ mã, tên &amp; thang điểm
                  </div>
                </div>

                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Hàng Bị Lỗi
                  </div>
                  <div className="text-xl font-black text-rose-900 mt-1">
                    {parseResult.stats.errorCount}
                  </div>
                  <div className="text-[10px] text-rose-600 mt-0.5">
                    {parseResult.stats.errorCount > 0 ? 'Sẽ tự động bỏ qua khi nạp' : 'Không có lỗi'}
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Phương Thức Nạp Tiêu Chuẩn Vào Hệ Thống:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      importMode === 'upsert'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="criteriaImportMode"
                      value="upsert"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <strong className="text-slate-800 font-semibold block">
                        Bổ sung &amp; Cập nhật (Khuyên dùng)
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Giữ nguyên các tiêu chuẩn hiện tại; cập nhật thông tin nếu trùng mã và bổ sung tiêu chí mới.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'border-purple-600 bg-purple-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="criteriaImportMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <strong className="text-slate-800 font-semibold block">
                        Ghi đè toàn bộ (Thay thế hoàn toàn)
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Xóa bộ tiêu chuẩn cũ và áp dụng toàn bộ danh mục Tiêu chuẩn / Tiêu chí mới từ file Excel này.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Filter Tabs & Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {/* Table Header Controls */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700">Xem trước danh sách ({filteredRows.length}):</span>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('all')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        filterStatus === 'all'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tất cả ({parseResult.rows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('new')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        filterStatus === 'new'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Mới ({parseResult.stats.newCriteriaCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('existing')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        filterStatus === 'existing'
                          ? 'bg-amber-600 text-white'
                          : 'text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      Cập nhật ({parseResult.stats.existingCriteriaCount})
                    </button>
                    {parseResult.stats.errorCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterStatus('error')}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          filterStatus === 'error'
                            ? 'bg-rose-600 text-white'
                            : 'text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        Lỗi ({parseResult.stats.errorCount})
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Bấm vào từng dòng để xem chi tiết 4 mức xếp loại
                  </span>
                </div>

                {/* Table list */}
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 sticky top-0 z-10">
                        <th className="py-2.5 px-3 font-semibold w-12 text-center">STT</th>
                        <th className="py-2.5 px-3 font-semibold">Tiêu Chuẩn (Nhóm)</th>
                        <th className="py-2.5 px-3 font-semibold">Mã TC</th>
                        <th className="py-2.5 px-3 font-semibold">Tên Tiêu Chí</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Điểm Tối Đa</th>
                        <th className="py-2.5 px-3 font-semibold">Trạng Thái</th>
                        <th className="py-2.5 px-3 font-semibold text-center w-12">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.map((row) => {
                        const isExpanded = expandedRow === row.rowNumber;

                        return (
                          <React.Fragment key={row.rowNumber}>
                            <tr
                              onClick={() => setExpandedRow(isExpanded ? null : row.rowNumber)}
                              className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                                row.status === 'error'
                                  ? 'bg-rose-50/40'
                                  : row.isExisting
                                  ? 'bg-amber-50/30'
                                  : ''
                              }`}
                            >
                              <td className="py-2 px-3 text-center text-slate-400 font-mono">
                                {row.rowNumber}
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-semibold text-slate-700 block line-clamp-1">
                                  {row.categoryName}
                                </span>
                                <span className="text-[10px] text-indigo-600 font-mono font-bold">
                                  {row.categoryCode}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                  {row.criterionCode}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-slate-900">{row.criterionName}</div>
                                <div className="text-[11px] text-slate-500 line-clamp-1">{row.description}</div>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-mono">
                                  {row.maxScore}đ
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {row.status === 'error' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                                    <AlertCircle className="w-3 h-3" />
                                    Lỗi
                                  </span>
                                ) : row.isExisting ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                    <AlertTriangle className="w-3 h-3" />
                                    Cập nhật mã cũ
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Thêm mới
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center text-slate-400">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 mx-auto text-indigo-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 mx-auto" />
                                )}
                              </td>
                            </tr>

                            {/* Expanded Details Row */}
                            {isExpanded && (
                              <tr className="bg-slate-50/90 border-b border-slate-200">
                                <td colSpan={7} className="p-3">
                                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                                    <div className="text-[11px] text-slate-600">
                                      <strong className="text-slate-800">Mô tả &amp; Hướng dẫn minh chứng:</strong> {row.description || 'Chưa có mô tả chi tiết'}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                                      <div className="p-2 rounded bg-rose-50/70 border border-rose-200">
                                        <div className="font-bold text-rose-900 flex items-center justify-between">
                                          <span>1. Chưa đạt</span>
                                          <span className="font-mono text-rose-700">1đ</span>
                                        </div>
                                        <p className="text-[10px] text-rose-800 mt-0.5">
                                          {row.levelChuaDat || 'Chưa hoàn thành yêu cầu.'}
                                        </p>
                                      </div>

                                      <div className="p-2 rounded bg-amber-50/70 border border-amber-200">
                                        <div className="font-bold text-amber-900 flex items-center justify-between">
                                          <span>2. Đạt</span>
                                          <span className="font-mono text-amber-700">2đ</span>
                                        </div>
                                        <p className="text-[10px] text-amber-800 mt-0.5">
                                          {row.levelDat || 'Thực hiện đầy đủ nhiệm vụ theo quy định.'}
                                        </p>
                                      </div>

                                      <div className="p-2 rounded bg-blue-50/70 border border-blue-200">
                                        <div className="font-bold text-blue-900 flex items-center justify-between">
                                          <span>3. Khá</span>
                                          <span className="font-mono text-blue-700">3đ</span>
                                        </div>
                                        <p className="text-[10px] text-blue-800 mt-0.5">
                                          {row.levelKha || 'Thực hiện tốt, có tính tự giác và cải tiến.'}
                                        </p>
                                      </div>

                                      <div className="p-2 rounded bg-emerald-50/70 border border-emerald-200">
                                        <div className="font-bold text-emerald-900 flex items-center justify-between">
                                          <span>4. Tốt</span>
                                          <span className="font-mono text-emerald-700">{row.maxScore}đ</span>
                                        </div>
                                        <p className="text-[10px] text-emerald-800 mt-0.5">
                                          {row.levelTot || 'Tấm gương mẫu mực, có sáng kiến và lan tỏa ảnh hưởng.'}
                                        </p>
                                      </div>
                                    </div>

                                    {row.statusMessage && (
                                      <div className="text-[10px] text-slate-500 italic pt-1">
                                        Ghi chú hệ thống: {row.statusMessage}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!parseResult || parseResult.finalCriteria.length === 0}
              onClick={handleApplyImport}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                !parseResult || parseResult.finalCriteria.length === 0
                  ? 'bg-slate-300 cursor-not-allowed opacity-60'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              <span>Xác Nhận Nạp {parseResult?.finalCriteria.length || 0} Tiêu Chí Vào Hệ Thống</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
