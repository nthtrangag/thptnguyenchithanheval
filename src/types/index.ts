export type RoleId = 'ADMIN' | 'BGH' | 'TO_TRUONG' | 'TO_PHO' | 'GIAO_VIEN' | 'NHAN_VIEN';

export interface Role {
  id: RoleId;
  name: string;
  code: string;
  description: string;
  badgeColor: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  headUserId: string;
  description?: string;
}

export type EmulationGroup = 'GIAO_VIEN_TO_TRUONG' | 'NHAN_VIEN';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roleId: RoleId;
  departmentId: string;
  isDepartmentHead: boolean;
  title: string; // Chức vụ: Hiệu trưởng, Phó Hiệu trưởng, Tổ trưởng, Tổ phó, Giáo viên, Nhân viên
  emulationGroup?: EmulationGroup; // Nhóm thi đua: 'GIAO_VIEN_TO_TRUONG' (Nhóm GV, Tổ trưởng, Tổ phó) hoặc 'NHAN_VIEN' (Nhóm Nhân viên)
  avatar?: string;
  phone?: string;
  subject?: string; // Môn giảng dạy
  teacherCode: string; // Mã số viên chức/GV
  password?: string; // Mật khẩu đăng nhập
}

export interface EvaluationPeriod {
  id: string;
  name: string;
  academicYear: string;
  semester: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'CLOSED' | 'UPCOMING';
  description: string;
}

export type CriteriaTargetRole = 
  | 'ALL' 
  | 'TO_TRUONG_TO_PHO' 
  | 'GIAO_VIEN' 
  | 'KE_TOAN' 
  | 'TO_TRUONG_VAN_PHONG' 
  | 'VAN_THU'
  | 'THIET_BI'
  | 'Y_TE';

export interface CriterionLevel {
  level: string; // 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt'
  score: number;
  description: string;
}

export interface Criterion {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  description: string;
  maxScore: number;
  levels?: CriterionLevel[];
  applicableRoles?: CriteriaTargetRole[];
  highlightColor?: 'blue' | 'red';
  isSpecialBonus?: boolean;
}

export interface CriteriaCategory {
  id: string;
  code: string;
  name: string;
  order: number;
  description?: string;
  maxScore: number;
  sectionCode?: 'A' | 'B';
  sectionName?: string;
  applicableRoles?: CriteriaTargetRole[];
}

export type EvaluationStatus = 'DRAFT' | 'SUBMITTED' | 'GROUP_REVIEWED' | 'APPROVED';

export type RankingLevel = 
  | 'XUAT_SAC' 
  | 'TOT' 
  | 'HOAN_THANH' 
  | 'CHUA_HOAN_THANH';

export interface EvidenceFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  url?: string;
}

export interface EvaluationDetail {
  id: string;
  evaluationId: string;
  criterionId: string;
  selfScore: number | null;
  groupScore: number | null;
  bghScore: number | null;
  evidenceText: string;
  evidenceFiles: EvidenceFile[];
  teacherNote?: string;
  groupNote?: string;
  bghNote?: string;
}

export interface Evaluation {
  id: string;
  periodId: string;
  userId: string;
  departmentId: string;
  status: EvaluationStatus;
  
  selfTotalScore: number;
  groupTotalScore: number | null;
  bghTotalScore: number | null;
  
  selfRanking?: RankingLevel;
  groupRanking?: RankingLevel;
  bghRanking?: RankingLevel;
  
  selfSubmittedAt?: string;
  groupReviewedAt?: string;
  groupReviewerId?: string;
  bghApprovedAt?: string;
  bghReviewerId?: string;
  
  generalTeacherComment?: string;
  generalGroupComment?: string;
  generalBghComment?: string;
  
  returnReason?: string;
  returnedAt?: string;
  returnedBy?: string;
  
  updatedAt: string;
}
