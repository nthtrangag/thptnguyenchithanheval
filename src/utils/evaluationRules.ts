import { Criterion, CriteriaCategory, EvaluationDetail, EvaluationStatus, RankingLevel, EmulationGroup, CriteriaTargetRole } from '../types';

export const EMULATION_GROUPS: Record<
  EmulationGroup,
  {
    id: EmulationGroup;
    name: string;
    shortName: string;
    code: string;
    description: string;
    badgeColor: string;
    badgeLight: string;
    borderColor: string;
    headerGradient: string;
    targetPercentXuatSac: number;
  }
> = {
  GIAO_VIEN_TO_TRUONG: {
    id: 'GIAO_VIEN_TO_TRUONG',
    name: 'Nhóm Giáo Viên, Tổ Trưởng, Tổ Phó',
    shortName: 'Nhóm GV, Tổ trưởng, Tổ phó',
    code: 'GV_TT_TP',
    description: 'Đội ngũ trực tiếp giảng dạy và phụ trách chuyên môn (Giáo viên, Tổ trưởng, Tổ phó)',
    badgeColor: 'bg-emerald-700 text-white',
    badgeLight: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    borderColor: 'border-emerald-300',
    headerGradient: 'from-emerald-700 to-teal-800',
    targetPercentXuatSac: 20,
  },
  NHAN_VIEN: {
    id: 'NHAN_VIEN',
    name: 'Nhóm Nhân Viên',
    shortName: 'Nhóm Nhân viên',
    code: 'NV',
    description: 'Đội ngũ cán bộ nhân viên phục vụ, hành chính, văn phòng, kế toán, y tế, văn thư, thủ quỹ, thiết bị, thư viện',
    badgeColor: 'bg-sky-700 text-white',
    badgeLight: 'bg-sky-50 text-sky-800 border-sky-300',
    borderColor: 'border-sky-300',
    headerGradient: 'from-sky-700 to-blue-800',
    targetPercentXuatSac: 20,
  },
};

/**
 * Returns the emulation group of a user:
 * - 'NHAN_VIEN': Nhóm Nhân viên (hành chính, y tế, kế toán, văn thư, thủ quỹ, thư viện, thiết bị)
 * - 'GIAO_VIEN_TO_TRUONG': Nhóm Giáo viên, Tổ trưởng, Tổ phó (giảng dạy & quản lý chuyên môn)
 */
export function getUserEmulationGroup(user?: {
  roleId?: string;
  departmentId?: string;
  teacherCode?: string;
  title?: string;
  emulationGroup?: EmulationGroup;
}): EmulationGroup {
  if (!user) return 'GIAO_VIEN_TO_TRUONG';
  if (user.emulationGroup) return user.emulationGroup;

  const titleLower = (user.title || '').toLowerCase();
  const code = (user.teacherCode || '').toUpperCase();

  if (
    user.roleId === 'NHAN_VIEN' ||
    user.departmentId === 'dept-van-phong' ||
    code.startsWith('NV-') ||
    code.startsWith('NV') ||
    titleLower.includes('nhân viên') ||
    titleLower.includes('kế toán') ||
    titleLower.includes('y tế') ||
    titleLower.includes('văn thư') ||
    titleLower.includes('thủ quỹ') ||
    titleLower.includes('thiết bị') ||
    titleLower.includes('thư viện') ||
    titleLower.includes('hành chính')
  ) {
    return 'NHAN_VIEN';
  }

  return 'GIAO_VIEN_TO_TRUONG';
}

/**
 * Checks if a user is an Accounting staff member (Nhân viên Kế toán)
 */
export function isAccountingStaff(user?: {
  roleId?: string;
  title?: string;
  subject?: string;
  teacherCode?: string;
}): boolean {
  if (!user) return false;
  const title = (user.title || '').toLowerCase();
  const subject = (user.subject || '').toLowerCase();
  const code = (user.teacherCode || '').toUpperCase();
  return (
    code === 'NV-082' ||
    ((title.includes('kế toán') || title.includes('ke toan') || subject.includes('kế toán') || subject.includes('ke toan') || subject.includes('tài chính')) &&
      !title.includes('tổ trưởng') && !title.includes('to truong'))
  );
}

/**
 * Checks if a user is Office Department Head (Tổ trưởng Tổ Văn phòng)
 */
export function isOfficeHead(user?: {
  roleId?: string;
  departmentId?: string;
  isDepartmentHead?: boolean;
  title?: string;
  teacherCode?: string;
}): boolean {
  if (!user) return false;
  const title = (user.title || '').toLowerCase();
  const code = (user.teacherCode || '').toUpperCase();
  const isVpDept = user.departmentId === 'dept-van-phong';
  return (
    code === 'NV-080' ||
    ((user.roleId === 'TO_TRUONG' || user.isDepartmentHead) && (isVpDept || title.includes('văn phòng') || title.includes('van phong'))) ||
    title.includes('tổ trưởng tổ văn phòng') ||
    title.includes('to truong to van phong')
  );
}

/**
 * Checks if a user is Clerical Officer (Nhân viên Văn thư)
 */
export function isClericalStaff(user?: {
  roleId?: string;
  departmentId?: string;
  title?: string;
  subject?: string;
  teacherCode?: string;
}): boolean {
  if (!user) return false;
  if (isOfficeHead(user)) return false; // Office head uses TO_TRUONG_VAN_PHONG
  if (isMedicalStaff(user)) return false; // Medical staff uses Y_TE
  const title = (user.title || '').toLowerCase();
  const subject = (user.subject || '').toLowerCase();
  const code = (user.teacherCode || '').toUpperCase();
  return (
    code === 'NV-081' ||
    code === 'NV-084' ||
    (title.includes('văn thư') && !title.includes('y tế')) ||
    (title.includes('van thu') && !title.includes('y te')) ||
    (subject.includes('văn thư') && !subject.includes('y tế')) ||
    (subject.includes('van thu') && !subject.includes('y te'))
  );
}

/**
 * Checks if a user is Medical/Health staff (Nhân viên Y tế)
 */
export function isMedicalStaff(user?: {
  roleId?: string;
  departmentId?: string;
  title?: string;
  subject?: string;
  teacherCode?: string;
}): boolean {
  if (!user) return false;
  if (isOfficeHead(user)) return false;
  const title = (user.title || '').toLowerCase();
  const subject = (user.subject || '').toLowerCase();
  const code = (user.teacherCode || '').toUpperCase();
  return (
    code === 'NV-085' ||
    title.includes('y tế') ||
    title.includes('y te') ||
    title.includes('sức khỏe') ||
    (subject.includes('y tế') && !title.includes('tổ trưởng')) ||
    (subject.includes('y te') && !title.includes('to truong'))
  );
}

/**
 * Checks if a user is Equipment/Laboratory staff (Nhân viên Thiết bị, thí nghiệm)
 */
export function isEquipmentStaff(user?: {
  roleId?: string;
  departmentId?: string;
  title?: string;
  subject?: string;
  teacherCode?: string;
}): boolean {
  if (!user) return false;
  const title = (user.title || '').toLowerCase();
  const subject = (user.subject || '').toLowerCase();
  const code = (user.teacherCode || '').toUpperCase();
  return (
    code === 'NV-083' ||
    (title.includes('thiết bị') && !title.includes('kế toán')) ||
    title.includes('thiet bi') ||
    title.includes('thí nghiệm') ||
    title.includes('thi nghiem') ||
    (subject.includes('thiết bị') && !title.includes('kế toán')) ||
    subject.includes('thí nghiệm')
  );
}

/**
 * Checks if a user is a Department Head (Tổ trưởng) or Deputy Head (Tổ phó)
 */
export function isDepartmentLeaderOrDeputy(user?: {
  roleId?: string;
  isDepartmentHead?: boolean;
  title?: string;
}): boolean {
  if (!user) return false;
  if (user.roleId === 'TO_TRUONG' || user.roleId === 'TO_PHO' || user.isDepartmentHead) return true;
  const title = (user.title || '').toLowerCase();
  return (
    title.includes('tổ trưởng') ||
    title.includes('to truong') ||
    title.includes('tổ phó') ||
    title.includes('to pho') ||
    title.includes('phó tổ trưởng') ||
    title.includes('pho to truong') ||
    title.includes('nhóm trưởng') ||
    title.includes('nhom truong') ||
    title.includes('phó nhóm trưởng') ||
    title.includes('pho nhom truong')
  );
}

/**
 * Returns whether criteria should target 'TO_TRUONG_VAN_PHONG', 'Y_TE', 'THIET_BI', 'VAN_THU', 'KE_TOAN', 'TO_TRUONG_TO_PHO' or 'GIAO_VIEN'
 */
export function getUserTargetRole(user?: {
  roleId?: string;
  departmentId?: string;
  isDepartmentHead?: boolean;
  title?: string;
  subject?: string;
  teacherCode?: string;
}): CriteriaTargetRole {
  if (isOfficeHead(user)) return 'TO_TRUONG_VAN_PHONG';
  if (isMedicalStaff(user)) return 'Y_TE';
  if (isEquipmentStaff(user)) return 'THIET_BI';
  if (isClericalStaff(user)) return 'VAN_THU';
  if (isAccountingStaff(user)) return 'KE_TOAN';
  return isDepartmentLeaderOrDeputy(user) ? 'TO_TRUONG_TO_PHO' : 'GIAO_VIEN';
}

/**
 * Filters categories and criteria specifically for the given user:
 * - If Tổ trưởng Tổ Văn phòng: Includes dedicated section B.II (Số lượng 20đ, Chất lượng 20đ, Tiến độ 10đ)
 *   plus "4. Quản lý hoạt động của tổ (20đ - TIÊU CHUẨN ĐẶC THÙ)" totaling 70đ in Section B (100đ overall)
 * - If Nhân viên Thiết bị, thí nghiệm: Includes dedicated section B.III (Số lượng 30đ, Chất lượng 19đ+11đ, Tiến độ 10đ = 70đ)
 * - If Nhân viên Văn thư: Includes dedicated section B.II (Số lượng 30đ, Chất lượng 19đ+11đ, Tiến độ 10đ = 70đ)
 * - If Kế toán: Includes special accounting criteria (Số lượng 30đ, Chất lượng 19đ+11đ, Tiến độ 10đ = 70đ)
 * - If Tổ trưởng / Tổ phó chuyên môn: Includes "4. Quản lý hoạt động của tổ/nhóm CM (20đ)" (20đ-20đ-10đ-20đ = 70đ)
 * - If Giáo viên: Standard teaching criteria (Số lượng 30đ, Chất lượng 30đ, Tiến độ 10đ = 70đ)
 */
export function filterCriteriaForUser(
  user: { roleId?: string; departmentId?: string; isDepartmentHead?: boolean; title?: string; subject?: string; teacherCode?: string } | undefined,
  allCategories: CriteriaCategory[],
  allCriteria: Criterion[],
  overrideRole?: CriteriaTargetRole
): { categories: CriteriaCategory[]; criteria: Criterion[] } {
  const targetRole = overrideRole || getUserTargetRole(user);

  const matchedCategories = allCategories.filter(cat => {
    if (!cat.applicableRoles || cat.applicableRoles.length === 0) return true;
    return cat.applicableRoles.includes(targetRole) || cat.applicableRoles.includes('ALL');
  });

  const matchedCriteria = allCriteria.filter(crit => {
    const catExists = matchedCategories.some(cat => cat.id === crit.categoryId);
    if (!catExists) return false;

    if (!crit.applicableRoles || crit.applicableRoles.length === 0) return true;
    return crit.applicableRoles.includes(targetRole) || crit.applicableRoles.includes('ALL');
  });

  return {
    categories: matchedCategories,
    criteria: matchedCriteria,
  };
}

export const RANKING_DEFINITIONS: Record<RankingLevel, { label: string; shortLabel: string; color: string; badge: string; minScoreRate: number }> = {
  XUAT_SAC: {
    label: 'Hoàn thành xuất sắc nhiệm vụ',
    shortLabel: 'Xuất sắc',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-600 text-white',
    minScoreRate: 0.9,
  },
  TOT: {
    label: 'Hoàn thành tốt nhiệm vụ',
    shortLabel: 'Tốt',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    badge: 'bg-blue-600 text-white',
    minScoreRate: 0.75,
  },
  HOAN_THANH: {
    label: 'Hoàn thành nhiệm vụ',
    shortLabel: 'Hoàn thành',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    badge: 'bg-amber-600 text-white',
    minScoreRate: 0.5,
  },
  CHUA_HOAN_THANH: {
    label: 'Không hoàn thành nhiệm vụ',
    shortLabel: 'Chưa HT',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    badge: 'bg-rose-600 text-white',
    minScoreRate: 0,
  },
};

export const STATUS_DEFINITIONS: Record<EvaluationStatus, { label: string; step: number; color: string; description: string }> = {
  DRAFT: {
    label: 'Bản nháp (Chưa gửi)',
    step: 1,
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    description: 'Giáo viên đang hoàn thiện hồ sơ tự đánh giá và tải minh chứng',
  },
  SUBMITTED: {
    label: 'Đã gửi (Chờ Tổ trưởng thẩm định)',
    step: 2,
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Giáo viên đã nộp bản tự đánh giá, đang chờ Tổ trưởng chấm điểm tổ',
  },
  GROUP_REVIEWED: {
    label: 'Chờ BGH duyệt',
    step: 3,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'Tổ chuyên môn đã cho điểm group_score, chờ Ban Giám hiệu quyết định',
  },
  APPROVED: {
    label: 'Đã phê duyệt chính thức',
    step: 4,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'BGH đã xem xét toàn diện, cho điểm chính thức và xếp loại cuối cùng',
  },
};

/**
 * Calculates total score from evaluation details for a specific score key
 */
export function calculateTotalScore(
  details: EvaluationDetail[],
  scoreKey: 'selfScore' | 'groupScore' | 'bghScore'
): number {
  return details.reduce((sum, item) => {
    const val = item[scoreKey];
    return sum + (typeof val === 'number' ? val : 0);
  }, 0);
}

/**
 * Automatically determine ranking according to Circular 20/2018/TT-BGDĐT
 */
export function determineRanking(
  details: EvaluationDetail[],
  criteria: Criterion[],
  scoreKey: 'selfScore' | 'groupScore' | 'bghScore'
): RankingLevel {
  const scores = details
    .map(d => d[scoreKey])
    .filter((s): s is number => typeof s === 'number');

  if (scores.length === 0) return 'HOAN_THANH';

  const totalPossible = criteria.reduce((sum, c) => sum + c.maxScore, 0);
  const currentTotal = scores.reduce((sum, s) => sum + s, 0);
  const ratio = totalPossible > 0 ? currentTotal / totalPossible : 0;

  // Criteria with 0 score (failed)
  const hasZeroScore = scores.some(s => s <= 0);

  // Xuất sắc: Đạt từ 90% trở lên (>= 90/100 điểm) và không có tiêu chí bị điểm 0
  if (ratio >= 0.9 && !hasZeroScore) {
    return 'XUAT_SAC';
  }

  // Tốt: Đạt từ 75% trở lên (>= 75/100 điểm) và không có tiêu chí bị điểm 0
  if (ratio >= 0.75 && !hasZeroScore) {
    return 'TOT';
  }

  // Hoàn thành: Đạt từ 50% trở lên (>= 50/100 điểm)
  if (ratio >= 0.5) {
    return 'HOAN_THANH';
  }

  return 'CHUA_HOAN_THANH';
}

/**
 * Formats date to Vietnamese locale string
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'Chưa có';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Official evidence description & document sample catalog for all criteria
 */
export function getOfficialEvidenceForCriterion(code: string, name?: string): { text: string; fileName: string; size: string } {
  const catalog: Record<string, { text: string; fileName: string; size: string }> = {
    '1.a': {
      text: 'Chấp hành nghiêm túc chủ trương, chính sách Đảng, nội quy nhà trường; Bản cam kết chấp hành quy chế làm việc số 12/CK-THPT.',
      fileName: 'CamKet_ChapHanh_ChuTruong_1a.pdf',
      size: '1.2 MB',
    },
    '1.b': {
      text: 'Bản tự kiểm điểm đảng viên/viên chức năm học; phiếu đánh giá đạo đức lối sống không có biểu hiện suy thoái.',
      fileName: 'TuKiemDiem_DaoDuc_NhaGiao_1b.pdf',
      size: '1.4 MB',
    },
    '1.c': {
      text: 'Biên bản sinh hoạt chi bộ, tinh thần tự phê bình và phê bình, xây dựng khối đoàn kết nội bộ vững chắc.',
      fileName: 'BienBan_DoanKet_PheBinh_1c.pdf',
      size: '0.9 MB',
    },
    '1.d': {
      text: 'Quyết định phân công nhiệm vụ và biên bản hoàn thành tốt công tác phòng chống tham nhũng, lãng phí, tiêu cực.',
      fileName: 'HoSo_PhongChong_TieuCuc_1d.pdf',
      size: '1.5 MB',
    },
    '1.e': {
      text: 'Sổ theo dõi thực hiện nội quy, quy chế làm việc của đơn vị; chấp hành nghiêm giờ giấc lên lớp và kỷ luật lao động.',
      fileName: 'SoKiemTra_KyLuat_NoiQuy_1e.pdf',
      size: '1.1 MB',
    },
    '1.f': {
      text: 'Biên bản các buổi tuyên truyền, vận động phụ huynh và học sinh chấp hành tốt pháp luật và quy định cơ quan.',
      fileName: 'TuyenTruyen_PhapLuat_HocDuong_1f.pdf',
      size: '1.3 MB',
    },
    '1.g': {
      text: 'Quyết định điều động, phân công nhiệm vụ của Ban Giám hiệu; hoàn thành xuất sắc các nhiệm vụ được giao.',
      fileName: 'QuyetDinh_PhanCong_NhiemVu_1g.pdf',
      size: '1.7 MB',
    },
    '1.h': {
      text: 'Phiếu lấy ý kiến phản hồi của học sinh và phụ huynh cuối học kỳ; đạt tỉ lệ tín nhiệm mẫu mực trên 95%.',
      fileName: 'KhaoSat_TinNhiem_HocSinh_1h.pdf',
      size: '1.0 MB',
    },
    '2.a1': {
      text: 'Kế hoạch bài dạy (giáo án) bộ môn được tổ trưởng duyệt định kỳ; hồ sơ chuyên môn đầy đủ theo chuẩn.',
      fileName: 'KeHoachBaiDay_DuyetChuyenMon_2a1.pdf',
      size: '3.4 MB',
    },
    '2.a2': {
      text: 'Sổ theo dõi sử dụng thiết bị dạy học, đồ dùng dạy học và phòng thực hành bộ môn theo quy định.',
      fileName: 'NhatKy_SuDung_ThietBi_2a2.pdf',
      size: '1.6 MB',
    },
    '2.b1': {
      text: 'Phiếu dự giờ đánh giá tiết dạy của đồng nghiệp và biên bản thao giảng cấp trường xếp loại Tốt.',
      fileName: 'PhieuDuGio_ThaoGiang_2b1.pdf',
      size: '2.0 MB',
    },
    '2.b2': {
      text: 'Biên bản tham gia sinh hoạt chuyên môn theo nghiên cứu bài học và bồi dưỡng thường xuyên đầy đủ.',
      fileName: 'BienBan_SinhHoat_NghienCuuBH_2b2.pdf',
      size: '1.8 MB',
    },
    '2.b3': {
      text: 'Kế hoạch ứng dụng CNTT, bài giảng điện tử số hóa và sử dụng phần mềm quản lý học tập kiểm tra đánh giá.',
      fileName: 'BaoCao_UngDungCNTT_Elearning_2b3.pdf',
      size: '2.5 MB',
    },
    '2.c1': {
      text: 'Sổ ghi điểm điện tử, bảng tổng hợp điểm đánh giá thường xuyên và định kỳ của học sinh các lớp phụ trách.',
      fileName: 'SoTheoDoi_DanhGia_HocSinh_2c1.xlsx',
      size: '1.5 MB',
    },
    '2.c2': {
      text: 'Kế hoạch và biên bản phụ đạo học sinh yếu kém, bồi dưỡng học sinh có năng khiếu bộ môn tiến bộ rõ rệt.',
      fileName: 'KeHoach_PhuDao_BoiDuong_2c2.pdf',
      size: '1.7 MB',
    },
    '2.d1': {
      text: 'Đề kiểm tra định kỳ, ma trận đề, bản đặc tả và đáp án thang điểm được tổ chuyên môn phê duyệt đúng quy trình.',
      fileName: 'MaTran_DeKiemTra_DapAn_2d1.pdf',
      size: '2.2 MB',
    },
    '2.d2': {
      text: 'Bản phân tích phổ điểm, đánh giá ma trận đề và kết quả kiểm tra định kỳ của học sinh sau đánh giá.',
      fileName: 'BaoCao_PhanTich_PhoDiem_2d2.pdf',
      size: '1.3 MB',
    },
    '3.a': {
      text: 'Biên bản phối hợp giữa giáo viên bộ môn với giáo viên chủ nhiệm và ban đại diện cha mẹ học sinh trong giáo dục.',
      fileName: 'BienBan_PhoiHop_GVCN_CMHS_3a.pdf',
      size: '1.6 MB',
    },
    '3.b': {
      text: 'Báo cáo phối hợp với Công đoàn, Đoàn Thanh niên tham gia các phong trào thi đua dạy tốt - học tốt.',
      fileName: 'BaoCao_PhoiHop_DoanThe_3b.pdf',
      size: '1.5 MB',
    },
    '3.c': {
      text: 'Kế hoạch và hình ảnh tổ chức hoạt động giáo dục địa phương, trải nghiệm hướng nghiệp cho học sinh.',
      fileName: 'HoatDong_GiaoDuc_DiaPhuong_3c.pdf',
      size: '2.8 MB',
    },
    'B.1.a': {
      text: 'Lịch báo giảng học kỳ, bảng thống kê hoàn thành đầy đủ 100% định mức số tiết dạy được phân công.',
      fileName: 'LichBaoGiang_BangDinhMuc_B1a.pdf',
      size: '2.3 MB',
    },
    'B.1.b': {
      text: 'Kế hoạch và lịch trình dạy bồi dưỡng, ôn tập học sinh giỏi và phụ đạo học sinh theo kế hoạch trường.',
      fileName: 'LichTrinh_BoiDuong_OnTap_B1b.pdf',
      size: '1.9 MB',
    },
    'B.1.c': {
      text: 'Bộ hồ sơ bài giảng điện tử, kế hoạch bài dạy đầy đủ theo phân phối chương trình của Bộ GD&ĐT.',
      fileName: 'HoSo_GiaoAnDienTu_DayDu_B1c.pdf',
      size: '3.6 MB',
    },
    'B.1.d': {
      text: 'Báo cáo hoàn thành 100% số lần kiểm tra thường xuyên, định kỳ và nhập điểm vào hệ thống VNedu.',
      fileName: 'XacNhan_NhapDiem_HeThong_B1d.pdf',
      size: '1.4 MB',
    },
    'B.1.e': {
      text: 'Biên bản tham dự đầy đủ 100% các buổi sinh hoạt chuyên môn tổ, nhóm và hội đồng sư phạm.',
      fileName: 'DiemDanh_SinhHoatChuyenMon_B1e.pdf',
      size: '1.2 MB',
    },
    'B.1.f': {
      text: 'Biên bản kiểm tra hồ sơ chuyên môn của tổ trưởng chuyên môn, xếp loại Tốt toàn bộ hồ sơ sổ sách.',
      fileName: 'BienBan_KiemTra_HoSoTo_B1f.pdf',
      size: '1.7 MB',
    },
    'B.1.g': {
      text: 'Kế hoạch tổ chức các hoạt động giáo dục ngoài giờ lên lớp, trải nghiệm hướng nghiệp và văn thể mỹ.',
      fileName: 'KeHoach_HoatDongTraiNghiem_B1g.pdf',
      size: '2.1 MB',
    },
    'B.2.a': {
      text: 'Bảng thống kê chất lượng bộ môn học kỳ: Tỉ lệ học sinh khá giỏi đạt vượt 8% so với chỉ tiêu giao.',
      fileName: 'ThongKe_ChatLuong_BoMon_VuotChiTieu_B2a.pdf',
      size: '1.8 MB',
    },
    'B.2.b': {
      text: 'Báo cáo đổi mới phương pháp giảng dạy, áp dụng dạy học phân hóa và đổi mới kiểm tra đánh giá.',
      fileName: 'BaoCao_DoiMoiPPDH_B2b.pdf',
      size: '2.6 MB',
    },
    'B.2.c': {
      text: 'Danh sách học sinh tiến bộ rõ rệt trong học kỳ, không có học sinh bỏ học hoặc học lực kém kéo dài.',
      fileName: 'DanhSach_HocSinh_TienBo_B2c.pdf',
      size: '1.4 MB',
    },
    'B.2.d': {
      text: 'Bản sáng kiến kinh nghiệm được Hội đồng khoa học nhà trường nghiệm thu và xếp loại A.',
      fileName: 'SangKienKinhNghiem_NghiemThuA_B2d.pdf',
      size: '4.2 MB',
    },
    'B.2.e': {
      text: 'Giấy chứng nhận hoàn thành khóa tập huấn bồi dưỡng thường xuyên module Chương trình GDPT 2018.',
      fileName: 'ChungNhan_BoiDuong_Module_B2e.pdf',
      size: '1.5 MB',
    },
    'B.2.f': {
      text: 'Sản phẩm bài giảng E-learning tham gia kho học liệu số ngành giáo dục, ứng dụng công nghệ hiệu quả.',
      fileName: 'Link_SanPham_BaiGiangSo_B2f.pdf',
      size: '3.1 MB',
    },
    'B.2.g': {
      text: 'Phiếu đánh giá hồ sơ chuyên môn cá nhân đạt xếp loại Tốt trong đợt thanh tra chuyên môn nhà trường.',
      fileName: 'PhieuDanhGia_HoSoChuyenMon_B2g.pdf',
      size: '1.6 MB',
    },
    'B.2.h': {
      text: 'Báo cáo chuyên đề cấp tổ chuyên môn được triển khai thành công và áp dụng cho toàn thể giáo viên.',
      fileName: 'BaoCao_ChuyenDe_ToChuyenMon_B2h.pdf',
      size: '2.4 MB',
    },
    'B.2.i': {
      text: 'Giấy chứng nhận Giáo viên dạy giỏi cấp Tỉnh/Trường; Giấy khen hướng dẫn học sinh đạt giải KHKT.',
      fileName: 'GiayKhen_GVDayGioi_HocSinhGioi_B2i.pdf',
      size: '2.9 MB',
    },
    'B.3.a': {
      text: 'Lịch trình giảng dạy khớp 100% với kế hoạch dạy học, không dạy dồn, không cắt xén chương trình.',
      fileName: 'XacNhan_TienDo_ChuongTrinh_B3a.pdf',
      size: '1.1 MB',
    },
    'B.3.b': {
      text: 'Biên bản giao nộp đề kiểm tra định kỳ đúng thời hạn quy định của Ban Giám hiệu nhà trường.',
      fileName: 'BienBan_NopDeKiemTra_DungHan_B3b.pdf',
      size: '0.9 MB',
    },
    'B.3.c': {
      text: 'Sổ theo dõi trả bài kiểm tra, sửa bài và thông báo điểm số cho học sinh kịp thời theo đúng quy chế.',
      fileName: 'SoTraBai_NhapDiem_KipThoi_B3c.pdf',
      size: '1.3 MB',
    },
    'B.3.d': {
      text: 'Biên bản kiểm tra sổ đầu bài định kỳ, ký duyệt đầy đủ, ghi chép nhận xét tiết dạy chính xác.',
      fileName: 'BienBan_KiemTra_SoDauBai_B3d.pdf',
      size: '1.4 MB',
    },
    'B.3.e': {
      text: 'Phiếu mượn và trả thiết bị dạy học, nhật ký sử dụng phòng học bộ môn đúng thời gian quy định.',
      fileName: 'NhatKy_MuonTra_ThietBi_B3e.pdf',
      size: '1.0 MB',
    },
    'B.3.f': {
      text: 'Bảng tổng hợp nộp các loại báo cáo chuyên môn, báo cáo thống kê định kỳ đúng hạn 100%.',
      fileName: 'TongHop_NopBaoCao_DungHan_B3f.pdf',
      size: '1.2 MB',
    },
    // Minh chứng đặc thù cho Tổ trưởng & Tổ phó (Mục 4: Quản lý hoạt động tổ/nhóm CM)
    '4.a': {
      text: 'Kế hoạch giáo dục tổ chuyên môn năm học; sổ nghị quyết sinh hoạt tổ; báo cáo tiến độ và chất lượng các chuyên đề theo kế hoạch.',
      fileName: 'KeHoach_GiaoDuc_TienDo_ToChuyenMon_4a.pdf',
      size: '3.4 MB',
    },
    'B.4.a': {
      text: 'Kế hoạch giáo dục tổ chuyên môn năm học; sổ nghị quyết sinh hoạt tổ; báo cáo tiến độ và chất lượng các chuyên đề theo kế hoạch.',
      fileName: 'KeHoach_GiaoDuc_TienDo_ToChuyenMon_4a.pdf',
      size: '3.4 MB',
    },
    '4.b': {
      text: 'Bảng tổng hợp đối sánh chất lượng giáo dục bộ môn của tổ chuyên môn đạt và vượt chỉ tiêu đăng ký đầu năm học.',
      fileName: 'DoiSanh_ChatLuong_BoMon_To_4b.pdf',
      size: '2.1 MB',
    },
    'B.4.b': {
      text: 'Bảng tổng hợp đối sánh chất lượng giáo dục bộ môn của tổ chuyên môn đạt và vượt chỉ tiêu đăng ký đầu năm học.',
      fileName: 'DoiSanh_ChatLuong_BoMon_To_4b.pdf',
      size: '2.1 MB',
    },
    '4.c': {
      text: 'Kế hoạch kiểm tra đánh giá của tổ; ma trận, bản đặc tả đề thi định kỳ; biên bản duyệt đề, phân công chấm trả bài đúng quy định.',
      fileName: 'KeHoach_MaTran_KiemTra_ToChuyenMon_4c.pdf',
      size: '2.8 MB',
    },
    'B.4.c': {
      text: 'Kế hoạch kiểm tra đánh giá của tổ; ma trận, bản đặc tả đề thi định kỳ; biên bản duyệt đề, phân công chấm trả bài đúng quy định.',
      fileName: 'KeHoach_MaTran_KiemTra_ToChuyenMon_4c.pdf',
      size: '2.8 MB',
    },
    '4.d': {
      text: 'Sổ quản lý theo dõi thực hiện quy chế chuyên môn của giáo viên trong tổ; biên bản kiểm tra hồ sơ giáo viên không có sai sót nghiêm trọng.',
      fileName: 'QuanLy_QuyChe_ChuyenMon_To_4d.pdf',
      size: '1.9 MB',
    },
    'B.4.d': {
      text: 'Sổ quản lý theo dõi thực hiện quy chế chuyên môn của giáo viên trong tổ; biên bản kiểm tra hồ sơ giáo viên không có sai sót nghiêm trọng.',
      fileName: 'QuanLy_QuyChe_ChuyenMon_To_4d.pdf',
      size: '1.9 MB',
    },
    '4.đ': {
      text: 'Tập hợp các báo cáo định kỳ, báo cáo đột xuất của tổ chuyên môn gửi Ban Giám hiệu và cấp trên đúng hạn, số liệu chuẩn xác.',
      fileName: 'TapHop_BaoCao_DinhKy_DotXuat_To_4d2.pdf',
      size: '2.2 MB',
    },
    'B.4.đ': {
      text: 'Tập hợp các báo cáo định kỳ, báo cáo đột xuất của tổ chuyên môn gửi Ban Giám hiệu và cấp trên đúng hạn, số liệu chuẩn xác.',
      fileName: 'TapHop_BaoCao_DinhKy_DotXuat_To_4d2.pdf',
      size: '2.2 MB',
    },
    '4.e': {
      text: 'Biên bản các kỳ họp bình xét thi đua; đánh giá xây dựng khối đoàn kết nội bộ tổ vững mạnh; khảo sát sự tín nhiệm của tổ viên.',
      fileName: 'BienBan_DoanKet_TinNhiem_ToChuyenMon_4e.pdf',
      size: '1.7 MB',
    },
    'B.4.e': {
      text: 'Biên bản các kỳ họp bình xét thi đua; đánh giá xây dựng khối đoàn kết nội bộ tổ vững mạnh; khảo sát sự tín nhiệm của tổ viên.',
      fileName: 'BienBan_DoanKet_TinNhiem_ToChuyenMon_4e.pdf',
      size: '1.7 MB',
    },
    '2*': {
      text: 'Giấy chứng nhận Giáo viên dạy giỏi các cấp; Giấy khen bồi dưỡng HSG đạt giải cao; Đề tài NCKH sư phạm ứng dụng hoặc SKKN cấp Tỉnh; Sáng kiến chuyển đổi số hoặc giải thưởng chuyên môn.',
      fileName: 'ThanhTich_VuotTroi_GiaiThuong_2star.pdf',
      size: '3.9 MB',
    },
    // Minh chứng đặc thù cho Văn thư & Tổ trưởng Tổ Văn Phòng (Nghị định 233/2026/NĐ-CP)
    '1.a_vt': {
      text: 'Sổ theo dõi và phân loại văn bản đến; phần mềm quản lý văn bản điều hành Ides/VNPT-iOffice ghi nhận 100% văn bản đến được đăng ký kịp thời.',
      fileName: 'SoDangKy_PhanLoai_VanBanDen_1a.pdf',
      size: '2.5 MB',
    },
    '1.b_vt': {
      text: 'Sổ đăng ký văn bản đi; hồ sơ phát hành văn bản điện tử có chữ ký số và phát hành đúng thể thức văn bản quản lý nhà nước.',
      fileName: 'SoDangKy_PhatHanh_VanBanDi_1b.pdf',
      size: '2.3 MB',
    },
    '1.c_vt': {
      text: 'Sổ bàn giao, đóng dấu và nhật ký quản lý con dấu cơ quan; bảo quản con dấu trong két an toàn theo đúng Nghị định 30/2020/NĐ-CP.',
      fileName: 'NhatKy_SuDung_QuanLyConDau_1c.pdf',
      size: '1.8 MB',
    },
    '1.d_vt': {
      text: 'Mục lục hồ sơ lưu trữ cơ quan; biên bản giao nộp hồ sơ tài liệu vào kho lưu trữ hiện hành của trường THPT Nguyễn Chí Thanh.',
      fileName: 'MucLuc_HoSo_LuuTruHienHanh_1d.pdf',
      size: '3.2 MB',
    },
    '1.đ_vt': {
      text: 'Cơ sở dữ liệu học bạ điện tử, hồ sơ quản lý học bạ số toàn trường được đối soát và ký số đồng bộ 100% trên hệ thống quản lý giáo dục.',
      fileName: 'BaoCao_QuanLy_HocBaSo_DuLieuSo_1d2.pdf',
      size: '2.9 MB',
    },
    '1.e_vt': {
      text: 'Sổ gốc cấp phát văn bằng tốt nghiệp THPT, chứng chỉ giáo dục; hồ sơ cấp bản sao văn bằng theo yêu cầu của công dân đúng quy chế Bộ GD&ĐT.',
      fileName: 'SoGoc_CapPhat_VanBangChungChi_1e.pdf',
      size: '3.6 MB',
    },
    '2.a_vt': {
      text: 'Quy trình quản lý và bảo quản con dấu an toàn, bảo mật tuyệt đối; không để xảy ra bất kỳ sai phạm nào trong đóng dấu văn bản.',
      fileName: 'QuyTrinh_BaoMat_AnToanConDau_2a.pdf',
      size: '1.5 MB',
    },
    '2.b_vt': {
      text: 'Báo cáo thống kê công tác văn thư, lưu trữ định kỳ 6 tháng và năm gửi Sở GD&ĐT số liệu chuẩn xác, đầy đủ chỉ tiêu.',
      fileName: 'BaoCao_ThongKe_VanThuLuuTru_2b.pdf',
      size: '2.2 MB',
    },
    '2.c_vt': {
      text: 'Biên bản tự kiểm tra công tác văn thư nội bộ; bảo đảm 100% hồ sơ, công văn đi đến đúng thể thức và thẩm quyền ký ban hành.',
      fileName: 'BienBan_KiemTra_TheThucVanBan_2c.pdf',
      size: '1.9 MB',
    },
    '2.d_vt': {
      text: 'Chứng nhận sử dụng thành thạo phần mềm quản lý văn bản, ký số điện tử và ứng dụng chữ ký số công vụ trong phát hành văn bản.',
      fileName: 'ChungChi_Kynang_CNTT_KySoVanBan_2d.pdf',
      size: '2.1 MB',
    },
    '2.đ_vt': {
      text: 'Bảng theo dõi cấp phát văn bằng, chứng chỉ đúng quy định, thủ tục nhanh gọn, giải quyết 100% hồ sơ đúng hẹn.',
      fileName: 'TheoDoi_CapPhat_VanBangDungHen_2d2.pdf',
      size: '1.8 MB',
    },
    '2.e_vt': {
      text: 'Bản cam kết cải cách thủ tục hành chính; phiếu đánh giá sự hài lòng của phụ huynh, học sinh và nhân dân đạt mức Rất hài lòng.',
      fileName: 'KhaoSat_HaiLong_CaiCachHanhChinh_2e.pdf',
      size: '1.6 MB',
    },
    '3.a_vt': {
      text: 'Nhật ký gửi văn bản đi; 100% công văn hỏa tốc, văn bản khẩn và báo cáo gửi đúng hạn định yêu cầu.',
      fileName: 'NhatKy_PhatHanh_VanBanDungHan_3a.pdf',
      size: '1.4 MB',
    },
    '3.b_vt': {
      text: 'Bảng theo dõi tiến độ các đầu việc được Ban Giám hiệu phân công trong năm học, hoàn thành đúng và trước thời hạn 100%.',
      fileName: 'TheoDoi_TienDo_DauViecGiao_3b.pdf',
      size: '1.7 MB',
    },
    '4.a_vttp': {
      text: 'Kế hoạch công tác năm học của Tổ Văn phòng; báo cáo định kỳ tháng, quý; tổ hoàn thành 100% các công việc theo kế hoạch đề ra.',
      fileName: 'KeHoach_BaoCao_CongTac_ToVanPhong_4a.pdf',
      size: '3.5 MB',
    },
    '4.b_vttp': {
      text: 'Bảng đánh giá chất lượng và tiến độ phục vụ công tác văn thư, kế toán, y tế, thư viện, thủ quỹ của Tổ Văn phòng đạt hiệu quả cao.',
      fileName: 'ChatLuong_HieuQua_ToVanPhong_4b.pdf',
      size: '2.6 MB',
    },
    '4.c_vttp': {
      text: 'Quyết định phân công nhiệm vụ và lịch công tác tổ Văn phòng năm học; tổ chức điều hành nhịp nhàng các bộ phận văn phòng.',
      fileName: 'PhanCong_NhiemVu_DieuHanh_ToVP_4c.pdf',
      size: '2.4 MB',
    },
    '4.d_vttp': {
      text: 'Biên bản sinh hoạt tổ văn phòng hàng tháng; đánh giá tinh thần đoàn kết, tương trợ lẫn nhau giữa các thành viên trong tổ.',
      fileName: 'BienBan_DoanKet_SinhHoat_ToVP_4d.pdf',
      size: '1.8 MB',
    },
    // Section B.III - Nhân viên Thiết bị, thí nghiệm
    '1.a_tb': {
      text: 'Sổ theo dõi, danh mục trang thiết bị dùng chung của nhà trường; biên bản bàn giao, tiếp nhận và tình trạng hoạt động thiết bị.',
      fileName: 'SoTheoDoi_TrangThietBi_DungChung_1a.pdf',
      size: '2.4 MB',
    },
    '1.b_tb': {
      text: 'Sổ theo dõi thiết bị dạy học tại các phòng học bộ môn (PHBM Lý, Hóa, Sinh, Tin, Ngoại ngữ...); biên bản đối soát định kỳ.',
      fileName: 'QuanLy_ThietBiDayHoc_PHBM_1b.pdf',
      size: '2.8 MB',
    },
    '1.c_tb': {
      text: 'Hệ thống sổ sách thiết bị theo quy định: Sổ mượn-trả thiết bị, sổ theo dõi hỏng hóc - sửa chữa, sổ thanh lý, sổ tài sản thiết bị.',
      fileName: 'HeThong_SoSach_CongTac_ThietBi_1c.pdf',
      size: '3.1 MB',
    },
    '1.d_tb': {
      text: 'Báo cáo xuất dữ liệu phần mềm Quản lý thiết bị trường học trực tuyến; cập nhật 100% danh mục tài sản và biến động thiết bị.',
      fileName: 'BaoCao_PhanMem_TaiSanThietBi_1d.pdf',
      size: '2.2 MB',
    },
    '1.đ_tb': {
      text: 'Biên bản kiểm kê tài sản - thiết bị cuối năm tài chính; bảng tổng hợp hiện trạng, phân loại trang thiết bị còn tốt, hỏng chờ thanh lý.',
      fileName: 'BienBan_KiemKeTaiSan_CuoiNamTaiChinh_1d2.pdf',
      size: '3.6 MB',
    },
    '1.e_tb': {
      text: 'Bộ hồ sơ minh chứng tiêu chuẩn cơ sở vật chất và thiết bị dạy học phục vụ công tác kiểm định chất lượng giáo dục của trường.',
      fileName: 'HoSo_KiemDinhChatLuong_ThietBi_1e.pdf',
      size: '4.2 MB',
    },
    '2.a_tb': {
      text: 'Báo cáo số liệu thiết bị chính xác 100%, hồ sơ lưu trữ khoa học, phân loại rõ ràng theo từng môn học và khối lớp.',
      fileName: 'QuanLy_HoSo_SoLieuThietBi_2a.pdf',
      size: '2.5 MB',
    },
    '2.b_tb': {
      text: 'Kế hoạch và nhật ký bảo dưỡng định kỳ trang thiết bị dùng chung, thiết bị PHBM; tỷ lệ thiết bị hoạt động tốt đạt trên 98%.',
      fileName: 'NhatKy_BaoQuan_BaoDuong_ThietBi_2b.pdf',
      size: '2.9 MB',
    },
    '2.c_tb': {
      text: 'Nhật ký phối hợp với giáo viên bộ môn chuẩn bị đồ dùng, hóa chất, thiết bị thí nghiệm cho 100% tiết dạy thực hành theo thời khóa biểu.',
      fileName: 'PhoiHop_GVBM_ChuanBiGioDay_MuonTra_2c.pdf',
      size: '3.4 MB',
    },
    '2.d_tb': {
      text: 'Nội quy an toàn phòng thí nghiệm - phòng bộ môn; sổ theo dõi an toàn cháy nổ, bảo quản hóa chất độc hại, cam kết an toàn 100%.',
      fileName: 'BienBan_AnToan_PhongThiNghiem_2d.pdf',
      size: '2.1 MB',
    },
    '2.đ_tb': {
      text: 'Hồ sơ số hóa dữ liệu thiết bị, ứng dụng quét mã QR quản lý thiết bị dạy học, chia sẻ học liệu thực hành số trên cổng trường.',
      fileName: 'UngDung_CNTT_QuanLyThietBi_2d2.pdf',
      size: '2.7 MB',
    },
    '2*_tb': {
      text: 'Chứng nhận sáng kiến kinh nghiệm cấp trường/quận hoặc giải thưởng tự làm đồ dùng dạy học; thành tích vượt trội phục vụ hội thi giáo viên dạy giỏi.',
      fileName: 'ThanhTich_ChatLuong_VuotTroi_ThietBi_2star.pdf',
      size: '3.8 MB',
    },
    '3.a_tb': {
      text: 'Sổ nhật ký chuẩn bị thiết bị thí nghiệm đúng giờ lên lớp cho giáo viên bộ môn; không xảy ra sự cố trễ giờ hay thiếu thiết bị.',
      fileName: 'ChuanBi_ThietBi_DungGioLenLop_3a.pdf',
      size: '1.9 MB',
    },
    '3.b_tb': {
      text: 'Bảng theo dõi tiến độ các nhiệm vụ chuyên môn và công việc đột xuất được Ban Giám hiệu phân công, hoàn thành 100% đúng hạn.',
      fileName: 'TheoDoi_TienDo_CongViecDuocGiao_3b.pdf',
      size: '1.8 MB',
    },
    // Section B.IV - Nhân viên Y tế
    '1.a_yt': {
      text: 'Sổ theo dõi sơ cấp cứu ban đầu; cơ số thuốc và trang thiết bị y tế phòng y tế học đường đáp ứng 100% quy chuẩn Bộ Y tế.',
      fileName: 'SoTheoDoi_SoCapCuu_SucKhoeBanDau_1a.pdf',
      size: '2.1 MB',
    },
    '1.b_yt': {
      text: 'Hồ sơ theo dõi, quản lý sức khỏe học sinh toàn trường; cập nhật dữ liệu khám chuyên khoa và phân loại thể lực học sinh.',
      fileName: 'HoSo_QuanLy_SucKhoeHocSinh_1b.pdf',
      size: '3.4 MB',
    },
    '1.c_yt': {
      text: 'Báo cáo tỷ lệ học sinh tham gia BHYT đạt 100%; danh sách cấp thẻ và hồ sơ giải quyết quyền lợi bảo hiểm y tế, tai nạn kịp thời.',
      fileName: 'BaoCao_CongTac_BHYT_BHTaiNan_1c.pdf',
      size: '2.5 MB',
    },
    '1.d_yt': {
      text: 'Kế hoạch và hình ảnh/biên bản các buổi truyền thông giáo dục sức khỏe sinh sản vị thành niên, phòng chống tác hại thuốc lá điện tử.',
      fileName: 'KeHoach_TruyenThong_GDSK_ViThanhNien_1d.pdf',
      size: '3.8 MB',
    },
    '1.đ_yt': {
      text: 'Kế hoạch phòng chống dịch bệnh mùa, kiểm tra vệ sinh an toàn thực phẩm căng tin, nước uống, phòng chống ma túy và bạo lực học đường.',
      fileName: 'KeHoach_VeSinh_PhongDich_AnToanTruongHoc_1d2.pdf',
      size: '3.2 MB',
    },
    '1.e_yt': {
      text: 'Sổ theo dõi hoạt động tư vấn tâm lý học đường, biên bản các ca hỗ trợ tâm lý học sinh gặp khó khăn, căng thẳng học tập.',
      fileName: 'SoTheoDoi_HoatDong_TuVanTamLy_1e.pdf',
      size: '2.6 MB',
    },
    '2.a_yt': {
      text: 'Quy trình xử lý các tình huống cấp cứu tại trường; không để xảy ra sai sót chuyên môn hoặc tai biến trong chăm sóc sức khỏe ban đầu.',
      fileName: 'QuyTrinh_XuLy_CapCuuYTe_ChuyenMon_2a.pdf',
      size: '2.2 MB',
    },
    '2.b_yt': {
      text: 'Hệ thống hồ sơ bệnh án học đường số hóa, sắp xếp khoa học, 100% học sinh có mã hồ sơ sức khỏe điện tử chính xác.',
      fileName: 'HoSo_BenhAn_HocDuong_ChinhXac_2b.pdf',
      size: '2.8 MB',
    },
    '2.c_yt': {
      text: 'Biên bản phối hợp với Trạm y tế/Trung tâm y tế tổ chức khám sức khỏe định kỳ cho học sinh đầu năm học đạt 100% sĩ số.',
      fileName: 'BienBan_KhamSucKhoe_DinhKy_HocDuong_2c.pdf',
      size: '3.5 MB',
    },
    '2.d_yt': {
      text: 'Bản cam kết bảo mật thông tin hồ sơ sức khỏe và dữ liệu tư vấn tâm lý học sinh; thực hiện nghiêm quy định bảo mật thông tin y tế.',
      fileName: 'CamKet_BaoMat_ThongTinHocSinh_2d.pdf',
      size: '1.9 MB',
    },
    '2.đ_yt': {
      text: 'Kế hoạch phối hợp với giáo viên chủ nhiệm và phụ huynh về theo dõi học sinh có bệnh lý nền, tư vấn tâm lý và đảm bảo an toàn trường học.',
      fileName: 'PhoiHop_GVCN_QuanLySucKhoe_AnToan_2d2.pdf',
      size: '2.7 MB',
    },
    '2*_yt': {
      text: 'Chứng nhận sáng kiến kinh nghiệm cấp trường/ngành về mô hình y tế học đường xanh - an toàn hoặc giải thưởng truyền thông sức khỏe.',
      fileName: 'SangKien_MoHinhYTe_ThanhTichVuotTroi_2star.pdf',
      size: '4.1 MB',
    },
    '3.a_yt': {
      text: 'Nhật ký trực y tế trường học; tiếp nhận và xử lý kịp thời 100% các ca sốt, chấn thương, ngộ độc đúng quy trình y khoa.',
      fileName: 'NhatKy_TrucYTe_XuLyKipThoi_3a.pdf',
      size: '2.0 MB',
    },
    '3.b_yt': {
      text: 'Bảng theo dõi tiến độ nộp báo cáo y tế học đường, báo cáo tiêm chủng và các đầu việc phân công hoàn thành đúng hạn 100%.',
      fileName: 'TheoDoi_TienDo_BaoCaoYTe_3b.pdf',
      size: '1.7 MB',
    },
  };

  if (catalog[code]) return catalog[code];
  if (name) {
    const nameLower = name.toLowerCase();
    // Medical & School Health matching
    if (nameLower.includes('sơ cấp cứu') || nameLower.includes('chăm sóc sức khỏe ban đầu')) return catalog['1.a_yt'];
    if (nameLower.includes('quản lý hồ sơ sức khỏe học sinh') || (nameLower.includes('hồ sơ sức khỏe') && nameLower.includes('theo dõi'))) return catalog['1.b_yt'];
    if (nameLower.includes('bh y tế') || nameLower.includes('bảo hiểm y tế') || nameLower.includes('bh tai nạn')) return catalog['1.c_yt'];
    if (nameLower.includes('sức khỏe vị thành niên') || nameLower.includes('tuyên truyền, giáo dục sức khỏe')) return catalog['1.d_yt'];
    if (nameLower.includes('phòng chống dịch bệnh') || nameLower.includes('vệ sinh trường học') || nameLower.includes('phòng chống ma túy')) return catalog['1.đ_yt'];
    if (nameLower.includes('tư vấn tâm lý học sinh') && !nameLower.includes('bảo mật') && !nameLower.includes('phối hợp')) return catalog['1.e_yt'];
    if (nameLower.includes('xử lý tình huống y tế đúng quy trình') || (nameLower.includes('tình huống y tế') && nameLower.includes('quy trình'))) return catalog['2.a_yt'];
    if (nameLower.includes('lưu trữ đầy đủ, chính xác') && nameLower.includes('sức khỏe')) return catalog['2.b_yt'];
    if (nameLower.includes('khám/kiểm tra sức khỏe định kỳ') || nameLower.includes('khám sức khỏe định kỳ')) return catalog['2.c_yt'];
    if (nameLower.includes('bảo mật thông tin học sinh') || (nameLower.includes('bảo mật') && nameLower.includes('tâm lý'))) return catalog['2.d_yt'];
    if (nameLower.includes('phối hợp với gvbm, gvcn') || (nameLower.includes('phối hợp') && nameLower.includes('an toàn trường học'))) return catalog['2.đ_yt'];
    if (nameLower.includes('vượt trội') && (nameLower.includes('y tế') || code.includes('yt'))) return catalog['2*_yt'];
    if (nameLower.includes('nghiệp vụ y tế/công tác tư vấn') || (nameLower.includes('y tế') && nameLower.includes('kịp thời'))) return catalog['3.a_yt'];
    if (nameLower.includes('đúng tiến độ các đầu công việc được giao') && code.includes('yt')) return catalog['3.b_yt'];

    // Equipment & Laboratory matching
    if (nameLower.includes('trang thiết bị dùng chung') && nameLower.includes('quản lý')) return catalog['1.a_tb'];
    if (nameLower.includes('thiết bị dạy học ở các phbm') || (nameLower.includes('phbm') && nameLower.includes('quản lý'))) return catalog['1.b_tb'];
    if (nameLower.includes('sổ sách liên quan đến công tác thiết bị') || (nameLower.includes('sổ sách') && nameLower.includes('thiết bị'))) return catalog['1.c_tb'];
    if (nameLower.includes('phần mềm tài sản, thiết bị') || (nameLower.includes('phần mềm tài sản') && nameLower.includes('thiết bị'))) return catalog['1.d_tb'];
    if (nameLower.includes('kiểm kê tài sản cuối năm tài chính') || (nameLower.includes('kiểm kê tài sản') && nameLower.includes('tài chính'))) return catalog['1.đ_tb'];
    if (nameLower.includes('kiểm định chất lượng có liên quan đến công tác thiết bị') || (nameLower.includes('kiểm định chất lượng') && nameLower.includes('thiết bị'))) return catalog['1.e_tb'];
    if (nameLower.includes('quản lý tốt hồ sơ, số liệu thiết bị')) return catalog['2.a_tb'];
    if (nameLower.includes('bảo quản tốt trang thiết bị')) return catalog['2.b_tb'];
    if (nameLower.includes('phối hợp với gvbm') || (nameLower.includes('gvbm') && nameLower.includes('chuẩn bị'))) return catalog['2.c_tb'];
    if (nameLower.includes('khâu an toàn trong sử dụng, quản lý trang thiết bị') || (nameLower.includes('an toàn') && nameLower.includes('trang thiết bị'))) return catalog['2.d_tb'];
    if (nameLower.includes('cntt trong công tác thiết bị') || (nameLower.includes('cntt') && nameLower.includes('thiết bị'))) return catalog['2.đ_tb'];
    if (nameLower.includes('vượt trội') && (nameLower.includes('thiết bị') || code.includes('tb'))) return catalog['2*_tb'];
    if (nameLower.includes('chuẩn bị thiết bị đảm bảo giờ lên lớp') || (nameLower.includes('chuẩn bị thiết bị') && nameLower.includes('lên lớp'))) return catalog['3.a_tb'];
    if (nameLower.includes('đúng tiến độ các đầu công việc được giao') && code.includes('tb')) return catalog['3.b_tb'];

    // Clerical & Office matching
    if (nameLower.includes('văn bản đến')) return catalog['1.a_vt'];
    if (nameLower.includes('gửi văn bản đi đúng thời hạn')) return catalog['3.a_vt'];
    if (nameLower.includes('văn bản đi')) return catalog['1.b_vt'];
    if (nameLower.includes('an toàn/bảo mật') || nameLower.includes('an toàn, bảo mật')) return catalog['2.a_vt'];
    if (nameLower.includes('con dấu')) return catalog['1.c_vt'];
    if (nameLower.includes('lập hồ sơ') || nameLower.includes('lưu trữ')) return catalog['1.d_vt'];
    if (nameLower.includes('học bạ số')) return catalog['1.đ_vt'];
    if (nameLower.includes('cấp văn bằng') || (nameLower.includes('văn bằng') && nameLower.includes('kịp thời'))) return catalog['2.đ_vt'];
    if (nameLower.includes('văn bằng')) return catalog['1.e_vt'];
    if (nameLower.includes('thống kê công tác văn thư') || nameLower.includes('chất lượng báo cáo, thống kê')) return catalog['2.b_vt'];
    if (nameLower.includes('chính xác, đầy đủ hồ sơ')) return catalog['2.c_vt'];
    if (nameLower.includes('cntt trong công tác văn thư')) return catalog['2.d_vt'];
    if (nameLower.includes('cải cách hành chính')) return catalog['2.e_vt'];
    if (nameLower.includes('đúng tiến độ các đầu công việc')) return catalog['3.b_vt'];
    if (nameLower.includes('tổ thực hiện đầy đủ các công việc')) return catalog['4.a_vttp'];
    if (nameLower.includes('tổ thực hiện chất lượng, hiệu quả')) return catalog['4.b_vttp'];
    if (nameLower.includes('khả năng tổ chức triển khai')) return catalog['4.c_vttp'];
    if (nameLower.includes('năng lực tập hợp, đoàn kết')) return catalog['4.d_vttp'];
  }
  return {
    text: `Hồ sơ minh chứng thực hiện tiêu chí ${code}: ${name || 'Kế hoạch công tác, văn bản phân công và kết quả thực hiện.'}`,
    fileName: `MinhChung_${code}.pdf`,
    size: '1.5 MB',
  };
}
