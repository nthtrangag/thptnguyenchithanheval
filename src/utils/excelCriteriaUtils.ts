import * as XLSX from 'xlsx';
import { CriteriaCategory, Criterion, CriterionLevel } from '../types';
import { INITIAL_CATEGORIES, INITIAL_CRITERIA } from '../data/initialData';

export interface ParsedCriterionRow {
  rowNumber: number;
  categoryCode: string;
  categoryName: string;
  criterionCode: string;
  criterionName: string;
  description: string;
  maxScore: number;
  levelChuaDat?: string;
  levelDat?: string;
  levelKha?: string;
  levelTot?: string;
  status: 'valid' | 'warning' | 'error';
  statusMessage: string;
  isExisting: boolean;
  categoryOrder?: number;
  raw: Record<string, any>;
}

export interface ParseCriteriaResult {
  rows: ParsedCriterionRow[];
  extractedCategories: CriteriaCategory[];
  finalCriteria: Criterion[];
  stats: {
    totalRows: number;
    validCount: number;
    warningCount: number;
    errorCount: number;
    newCriteriaCount: number;
    existingCriteriaCount: number;
    categoriesCount: number;
  };
}

// Normalize strings for flexible column and value matching
function normalizeKey(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]/g, ''); // alphanumeric only
}

/**
 * Download standard Excel template for uploading criteria according to ND 233 / 100-point table
 */
export function downloadCriteriaSampleExcel(): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Main criteria data
  const headers = [
    'Mục Lớn',
    'Mã Tiêu Chuẩn',
    'Tên Tiêu Chuẩn',
    'Thứ Tự TC',
    'Mã Tiêu Chí',
    'Tên Tiêu Chí',
    'Điểm Tối Đa',
    'Mô Tả Tiêu Chí & Hướng Dẫn Minh Chứng',
    'Mức 1 (Chưa đạt)',
    'Mức 2 (Đạt)',
    'Mức 3 (Khá)',
    'Mức 4 (Tốt)',
  ];

  const sampleData = INITIAL_CRITERIA.map(crit => {
    const cat = INITIAL_CATEGORIES.find(c => c.id === crit.categoryId);
    const lvl1 = crit.levels?.[0]?.description || 'Chưa đạt yêu cầu.';
    const lvl2 = crit.levels?.[1]?.description || 'Đạt yêu cầu chuẩn.';
    const lvl3 = crit.levels?.[2]?.description || 'Khá, có sáng tạo và cải tiến.';
    const lvl4 = crit.levels?.[3]?.description || crit.description;

    const sectionLabel = cat?.sectionName || ((cat?.order || 1) <= 3 ? 'A. TIÊU CHÍ CHUNG (30 điểm)' : 'B. KẾT QUẢ THỰC HIỆN CHỨC TRÁCH, NHIỆM VỤ ĐƯỢC GIAO (70 điểm)');

    return [
      sectionLabel,
      cat?.code || 'TC1',
      cat?.name || 'Tiêu chuẩn',
      cat?.order || 1,
      crit.code,
      crit.name,
      crit.maxScore,
      crit.description,
      lvl1,
      lvl2,
      lvl3,
      lvl4,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

  // Set column widths
  ws['!cols'] = [
    { wch: 32 }, // Mục Lớn
    { wch: 15 }, // Mã Tiêu chuẩn
    { wch: 45 }, // Tên Tiêu chuẩn
    { wch: 12 }, // Thứ tự
    { wch: 14 }, // Mã Tiêu chí
    { wch: 40 }, // Tên Tiêu chí
    { wch: 12 }, // Điểm tối đa
    { wch: 50 }, // Mô tả & minh chứng
    { wch: 40 }, // Mức Chưa đạt
    { wch: 40 }, // Mức Đạt
    { wch: 40 }, // Mức Khá
    { wch: 45 }, // Mức Tốt
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Tieu_Chuan_Va_Tieu_Chi');

  // Sheet 2: Instructions
  const instructionHeaders = ['Mục', 'Quy Định & Hướng Dẫn Chi Tiết'];
  const instructionsData = [
    ['Quy chuẩn áp dụng', 'Nghị định 233/2026/NĐ-CP & Thông tư 20/2018/TT-BGDĐT đánh giá chuẩn nghề nghiệp viên chức giáo dục.'],
    ['Cột bắt buộc', 'Mã Tiêu Chuẩn, Tên Tiêu Chuẩn, Mã Tiêu Chí, Tên Tiêu Chí, Điểm Tối Đa.'],
    ['Mã Tiêu Chuẩn', 'Ví dụ: TC-1, TC-2, hoặc TC01... Dùng để nhóm các tiêu chí lại với nhau.'],
    ['Tên Tiêu Chuẩn', 'Ví dụ: Tiêu chuẩn 1: Phẩm chất nhà giáo, Tiêu chuẩn 2: Phát triển chuyên môn...'],
    ['Mã Tiêu Chí', 'Mã duy nhất, ví dụ: TC01, TC02, TC03... Hệ thống dùng mã này để liên kết minh chứng và điểm số.'],
    ['Điểm Tối Đa', 'Thang điểm tối đa cho tiêu chí (thông thường là 4 điểm cho 4 mức xếp loại: Chưa đạt (1đ), Đạt (2đ), Khá (3đ), Tốt (4đ)).'],
    ['4 Mức Xếp Loại', 'Cột Mức 1 (Chưa đạt), Mức 2 (Đạt), Mức 3 (Khá), Mức 4 (Tốt) sẽ hiển thị chi tiết khi giáo viên và ban giám hiệu chấm điểm.'],
    ['Chế độ nạp dữ liệu', 'Hệ thống hỗ trợ 2 chế độ: "Bổ sung / Cập nhật" (giữ tiêu chí cũ, chỉ cập nhật theo mã) hoặc "Ghi đè toàn bộ" (thay thế bộ tiêu chuẩn hiện tại).'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet([instructionHeaders, ...instructionsData]);
  wsInstructions['!cols'] = [{ wch: 22 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Huong_Dan_Nhap');

  XLSX.writeFile(wb, 'Mau_Tieu_Chuan_Tieu_Chi_Danh_Gia_ND233.xlsx');
}

/**
 * Parses an Excel or CSV file buffer containing criteria and standards.
 */
export function parseCriteriaExcel(
  buffer: ArrayBuffer,
  existingCategories: CriteriaCategory[],
  existingCriteria: Criterion[]
): ParseCriteriaResult {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });

  // Find target sheet (prefer name with 'tieu_chi' or first sheet)
  let sheetName = wb.SheetNames[0];
  for (const name of wb.SheetNames) {
    const norm = normalizeKey(name);
    if (norm.includes('tieuchi') || norm.includes('tieuchuan') || norm.includes('criteria') || norm.includes('standard')) {
      sheetName = name;
      break;
    }
  }

  const ws = wb.Sheets[sheetName];
  if (!ws) {
    throw new Error('Không tìm thấy dữ liệu trong file Excel!');
  }

  // Convert to 2D array of rows
  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (rawRows.length === 0) {
    throw new Error('File Excel rỗng!');
  }

  // Find header row (the first row containing keywords like 'tiêu chí', 'mã', 'criterion', 'code')
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const rowStr = rawRows[i].map(c => normalizeKey(String(c))).join(' ');
    if (
      rowStr.includes('tieuchi') ||
      rowStr.includes('tieuchuan') ||
      rowStr.includes('criterion') ||
      rowStr.includes('matc') ||
      (rowStr.includes('ma') && rowStr.includes('ten'))
    ) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    // Fallback to row 0 if no clear header detected
    headerRowIndex = 0;
  }

  const headerRow = rawRows[headerRowIndex].map(c => String(c).trim());

  // Detect column mapping
  let colCatCode = -1;
  let colCatName = -1;
  let colCatOrder = -1;
  let colCritCode = -1;
  let colCritName = -1;
  let colMaxScore = -1;
  let colDesc = -1;
  let colLevelChuaDat = -1;
  let colLevelDat = -1;
  let colLevelKha = -1;
  let colLevelTot = -1;

  headerRow.forEach((colName, idx) => {
    const norm = normalizeKey(colName);
    
    // Category Code
    if (
      (norm.includes('matieuchuan') || norm.includes('machuan') || norm.includes('catcode') || norm.includes('standardcode') || norm === 'matc') &&
      colCatCode === -1
    ) {
      colCatCode = idx;
      return;
    }

    // Category Name
    if (
      (norm.includes('tentieuchuan') || norm.includes('tenchuan') || norm.includes('tieuchuan') || norm.includes('standardname') || norm.includes('category')) &&
      !norm.includes('tieuchi') &&
      colCatName === -1
    ) {
      colCatName = idx;
      return;
    }

    // Category Order
    if ((norm.includes('thutu') || norm.includes('order') || norm.includes('stttc')) && colCatOrder === -1) {
      colCatOrder = idx;
      return;
    }

    // Criterion Code
    if (
      (norm.includes('matieuchi') || norm.includes('critcode') || norm.includes('criterioncode') || norm === 'matc' || norm === 'ma') &&
      colCritCode === -1
    ) {
      colCritCode = idx;
      return;
    }

    // Criterion Name
    if (
      (norm.includes('tentieuchi') || norm.includes('tieuchi') || norm.includes('critname') || norm.includes('criterion')) &&
      !norm.includes('tieuchuan') &&
      colCritName === -1
    ) {
      colCritName = idx;
      return;
    }

    // Max Score
    if (
      (norm.includes('diemtoida') || norm.includes('thangdiem') || norm.includes('diem') || norm.includes('maxscore') || norm.includes('score')) &&
      colMaxScore === -1
    ) {
      colMaxScore = idx;
      return;
    }

    // Description / Evidence instruction
    if (
      (norm.includes('mota') || norm.includes('minhchung') || norm.includes('huongdan') || norm.includes('description')) &&
      colDesc === -1
    ) {
      colDesc = idx;
      return;
    }

    // Level 1: Chua dat
    if (norm.includes('chuadat') || norm.includes('muc1') || norm.includes('level1')) {
      colLevelChuaDat = idx;
      return;
    }

    // Level 2: Dat
    if ((norm.includes('dat') && !norm.includes('chuadat') && !norm.includes('toida')) || norm.includes('muc2') || norm.includes('level2')) {
      colLevelDat = idx;
      return;
    }

    // Level 3: Kha
    if (norm.includes('kha') || norm.includes('muc3') || norm.includes('level3')) {
      colLevelKha = idx;
      return;
    }

    // Level 4: Tot
    if (norm.includes('tot') || norm.includes('muc4') || norm.includes('level4')) {
      colLevelTot = idx;
      return;
    }
  });

  // Fallbacks if not precisely matched
  if (colCritCode === -1) {
    // Look for column containing 'mã' or column 3
    colCritCode = headerRow.findIndex(h => normalizeKey(h).includes('ma'));
    if (colCritCode === -1 && headerRow.length > 3) colCritCode = 3;
    else if (colCritCode === -1) colCritCode = 0;
  }

  if (colCritName === -1) {
    colCritName = headerRow.findIndex((h, idx) => idx !== colCritCode && normalizeKey(h).includes('ten'));
    if (colCritName === -1 && headerRow.length > 4) colCritName = 4;
    else if (colCritName === -1) colCritName = 1;
  }

  if (colCatCode === -1) {
    colCatCode = headerRow.findIndex(h => normalizeKey(h).includes('chuan'));
    if (colCatCode === -1 && colCritCode !== 0) colCatCode = 0;
  }

  if (colCatName === -1) {
    if (colCatCode !== -1 && colCatCode + 1 < headerRow.length && colCatCode + 1 !== colCritCode && colCatCode + 1 !== colCritName) {
      colCatName = colCatCode + 1;
    }
  }

  const parsedRows: ParsedCriterionRow[] = [];
  const categoryMap = new Map<string, { code: string; name: string; order: number }>();
  let lastSeenCatCode = 'TC-1';
  let lastSeenCatName = 'Tiêu chuẩn chung';
  let lastSeenCatOrder = 1;

  // Process data rows
  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Check if entire row is empty
    const hasAnyContent = row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
    if (!hasAnyContent) continue;

    let catCode = colCatCode !== -1 ? String(row[colCatCode] || '').trim() : '';
    let catName = colCatName !== -1 ? String(row[colCatName] || '').trim() : '';
    const catOrderVal = colCatOrder !== -1 ? parseInt(row[colCatOrder], 10) : NaN;
    const critCode = colCritCode !== -1 ? String(row[colCritCode] || '').trim() : '';
    const critName = colCritName !== -1 ? String(row[colCritName] || '').trim() : '';
    const rawScore = colMaxScore !== -1 ? row[colMaxScore] : 4;
    const description = colDesc !== -1 ? String(row[colDesc] || '').trim() : '';
    const lvlChuaDat = colLevelChuaDat !== -1 ? String(row[colLevelChuaDat] || '').trim() : '';
    const lvlDat = colLevelDat !== -1 ? String(row[colLevelDat] || '').trim() : '';
    const lvlKha = colLevelKha !== -1 ? String(row[colLevelKha] || '').trim() : '';
    const lvlTot = colLevelTot !== -1 ? String(row[colLevelTot] || '').trim() : '';

    // If row looks like a Category section header (has catName but empty critCode and critName)
    if (!critCode && !critName && (catCode || catName)) {
      lastSeenCatCode = catCode || `TC-${categoryMap.size + 1}`;
      lastSeenCatName = catName || `Tiêu chuẩn ${categoryMap.size + 1}`;
      lastSeenCatOrder = !isNaN(catOrderVal) ? catOrderVal : categoryMap.size + 1;
      categoryMap.set(lastSeenCatCode, {
        code: lastSeenCatCode,
        name: lastSeenCatName,
        order: lastSeenCatOrder,
      });
      continue;
    }

    // Skip rows without at least a criterion code or name
    if (!critCode && !critName) {
      continue;
    }

    // If catCode is empty, use last seen
    if (!catCode) {
      catCode = lastSeenCatCode;
      catName = lastSeenCatName;
    } else {
      lastSeenCatCode = catCode;
      if (catName) lastSeenCatName = catName;
    }

    if (!catName) {
      // Find matching existing category or synthesize
      const existingCat = existingCategories.find(c => c.code.toLowerCase() === catCode.toLowerCase());
      catName = existingCat ? existingCat.name : `Tiêu chuẩn ${catCode}`;
    }

    const catOrder = !isNaN(catOrderVal) ? catOrderVal : lastSeenCatOrder;
    categoryMap.set(catCode, { code: catCode, name: catName, order: catOrder });

    // Validate score
    let parsedMaxScore = 4;
    if (rawScore !== undefined && rawScore !== null && rawScore !== '') {
      const num = Number(rawScore);
      if (!isNaN(num) && num > 0) {
        parsedMaxScore = num;
      }
    }

    // Validate Status
    let status: 'valid' | 'warning' | 'error' = 'valid';
    const messages: string[] = [];

    if (!critCode) {
      status = 'error';
      messages.push('Thiếu Mã Tiêu Chí (bắt buộc).');
    }
    if (!critName) {
      status = 'error';
      messages.push('Thiếu Tên Tiêu Chí (bắt buộc).');
    }

    // Check duplicate in file
    const isDuplicateInFile = parsedRows.some(p => p.criterionCode.toLowerCase() === critCode.toLowerCase());
    if (isDuplicateInFile && critCode) {
      status = 'error';
      messages.push(`Mã tiêu chí "${critCode}" bị trùng trong file.`);
    }

    // Check existing in database
    const existingCrit = existingCriteria.find(
      c => c.code.toLowerCase() === critCode.toLowerCase()
    );
    const isExisting = !!existingCrit;

    if (status !== 'error') {
      if (isExisting) {
        status = 'warning';
        messages.push(`Mã "${critCode}" đã tồn tại trên hệ thống (sẽ được cập nhật lại dữ liệu).`);
      } else {
        messages.push('Hợp lệ - sẵn sàng nạp mới.');
      }
    }

    parsedRows.push({
      rowNumber: r + 1,
      categoryCode: catCode,
      categoryName: catName,
      criterionCode: critCode,
      criterionName: critName,
      description,
      maxScore: parsedMaxScore,
      levelChuaDat: lvlChuaDat,
      levelDat: lvlDat,
      levelKha: lvlKha,
      levelTot: lvlTot,
      status,
      statusMessage: messages.join(' '),
      isExisting,
      categoryOrder: catOrder,
      raw: row,
    });
  }

  // Construct Final Categories
  const extractedCategories: CriteriaCategory[] = [];
  let catIndex = 1;

  categoryMap.forEach((val, code) => {
    const existing = existingCategories.find(
      c => c.code.toLowerCase() === code.toLowerCase() || normalizeKey(c.name) === normalizeKey(val.name)
    );

    const categoryId = existing ? existing.id : `cat-imp-${normalizeKey(code)}-${Date.now()}`;
    
    // Sum maxScore of criteria in this category
    const catRows = parsedRows.filter(p => p.categoryCode === code && p.status !== 'error');
    const computedMax = catRows.reduce((sum, r) => sum + r.maxScore, 0);

    const order = val.order || existing?.order || catIndex++;
    const isSectionA = (val.code && (val.code.startsWith('TC') || val.code.startsWith('1') || val.code.startsWith('2') || val.code.startsWith('3')) && !val.code.startsWith('TC-B') && !val.code.startsWith('B')) || order <= 3;

    extractedCategories.push({
      id: categoryId,
      code: val.code,
      name: val.name,
      order: order,
      description: existing?.description || `Nhóm tiêu chuẩn ${val.name}`,
      maxScore: computedMax > 0 ? computedMax : existing?.maxScore || 10,
      sectionCode: isSectionA ? 'A' : 'B',
      sectionName: isSectionA ? 'A. TIÊU CHÍ CHUNG (30 điểm)' : 'B. KẾT QUẢ THỰC HIỆN CHỨC TRÁCH, NHIỆM VỤ ĐƯỢC GIAO (70 điểm)',
    });
  });

  // Construct Final Criteria objects
  const finalCriteria: Criterion[] = parsedRows
    .filter(r => r.status !== 'error')
    .map((r, idx) => {
      const cat = extractedCategories.find(c => c.code === r.categoryCode);
      const categoryId = cat ? cat.id : extractedCategories[0]?.id || 'cat-1';

      const existing = existingCriteria.find(c => c.code.toLowerCase() === r.criterionCode.toLowerCase());
      const criterionId = existing ? existing.id : `crit-imp-${Date.now()}-${idx}`;

      // Build levels
      const max = r.maxScore || 4;
      const step = max / 4;
      const levels: CriterionLevel[] = [
        {
          level: 'Chưa đạt',
          score: Math.round(step * 10) / 10,
          description: r.levelChuaDat || 'Chưa thực hiện đầy đủ theo yêu cầu của tiêu chí.',
        },
        {
          level: 'Đạt',
          score: Math.round(step * 2 * 10) / 10,
          description: r.levelDat || 'Thực hiện đầy đủ theo quy định của tiêu chí.',
        },
        {
          level: 'Khá',
          score: Math.round(step * 3 * 10) / 10,
          description: r.levelKha || 'Thực hiện tốt, có ý thức cải tiến và tự giác nâng cao chất lượng.',
        },
        {
          level: 'Tốt',
          score: max,
          description: r.levelTot || 'Là hình mẫu tiêu biểu, có sáng kiến và lan tỏa ảnh hưởng tích cực trong nhà trường.',
        },
      ];

      return {
        id: criterionId,
        categoryId,
        code: r.criterionCode,
        name: r.criterionName,
        description: r.description || `Đánh giá mức độ hoàn thành nhiệm vụ theo ${r.criterionName}`,
        maxScore: max,
        levels,
      };
    });

  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const warningCount = parsedRows.filter(r => r.status === 'warning').length;
  const errorCount = parsedRows.filter(r => r.status === 'error').length;
  const existingCriteriaCount = parsedRows.filter(r => r.isExisting && r.status !== 'error').length;
  const newCriteriaCount = parsedRows.filter(r => !r.isExisting && r.status !== 'error').length;

  return {
    rows: parsedRows,
    extractedCategories,
    finalCriteria,
    stats: {
      totalRows: parsedRows.length,
      validCount,
      warningCount,
      errorCount,
      newCriteriaCount,
      existingCriteriaCount,
      categoriesCount: extractedCategories.length,
    },
  };
}

/**
 * Demo preset: Complete 100-point standards dataset for fast preview & testing
 */
export const DEMO_PRESET_ND233_CRITERIA: ParsedCriterionRow[] = INITIAL_CRITERIA.map((crit, idx) => {
  const cat = INITIAL_CATEGORIES.find(c => c.id === crit.categoryId);
  return {
    rowNumber: idx + 2,
    categoryCode: cat?.code || 'TC-1',
    categoryName: cat?.name || 'Tiêu chuẩn',
    criterionCode: crit.code,
    criterionName: crit.name,
    description: crit.description,
    maxScore: crit.maxScore,
    levelChuaDat: crit.levels?.[0]?.description,
    levelDat: crit.levels?.[1]?.description,
    levelKha: crit.levels?.[2]?.description,
    levelTot: crit.levels?.[3]?.description,
    status: 'valid' as const,
    statusMessage: 'Hợp lệ - chuẩn khung tiêu chuẩn đánh giá giáo viên 100 điểm',
    isExisting: false,
    categoryOrder: cat?.order || 1,
    raw: {},
  };
});
