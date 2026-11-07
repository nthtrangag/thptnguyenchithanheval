import * as XLSX from 'xlsx';
import { User, Role, Department, RoleId } from '../types';

export interface ParsedUserRow {
  rowNumber: number;
  teacherCode: string;
  fullName: string;
  username: string;
  password?: string;
  email: string;
  roleId: RoleId;
  roleName: string;
  departmentId: string;
  departmentName: string;
  title: string;
  isDepartmentHead: boolean;
  subject: string;
  phone: string;
  status: 'valid' | 'warning' | 'error';
  statusMessage: string;
  raw: Record<string, any>;
}

// Helper to normalize strings for flexible column matching
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]/g, ''); // alphanumeric only
}

// Match Role from string
export function mapRoleString(val: string): { roleId: RoleId; roleName: string } {
  if (!val) return { roleId: 'GIAO_VIEN', roleName: 'Giáo Viên' };
  const norm = normalizeKey(String(val));
  
  if (norm.includes('admin') || norm.includes('quantri') || norm === 'admin') {
    return { roleId: 'ADMIN', roleName: 'Quản Trị Viên' };
  }
  if (norm.includes('bgh') || norm.includes('hieutruong') || norm.includes('giamhieu') || norm.includes('bangianghieu')) {
    return { roleId: 'BGH', roleName: 'Ban Giám Hiệu' };
  }
  if (norm.includes('totruong') || norm.includes('ttcm') || norm.includes('truongbo') || norm.includes('totruongchuyenmon')) {
    return { roleId: 'TO_TRUONG', roleName: 'Tổ Trưởng Chuyên Môn' };
  }
  if (
    norm.includes('nhanvien') ||
    norm.includes('nv') ||
    norm.includes('canbo') ||
    norm.includes('staff') ||
    norm.includes('vienchuc') ||
    norm.includes('ketoan') ||
    norm.includes('vanthu') ||
    norm.includes('yte') ||
    norm.includes('thuvien') ||
    norm.includes('thietbi') ||
    norm.includes('thuquy')
  ) {
    return { roleId: 'NHAN_VIEN', roleName: 'Nhân Viên' };
  }
  return { roleId: 'GIAO_VIEN', roleName: 'Giáo Viên' };
}

// Match Department from string
export function mapDepartmentString(
  val: string,
  departments: Department[]
): { departmentId: string; departmentName: string } {
  if (!val) {
    const defaultDept = departments.find(d => d.id === 'dept-toan') || departments[1] || departments[0];
    return { departmentId: defaultDept.id, departmentName: defaultDept.name };
  }

  const rawStr = String(val).trim();
  const norm = normalizeKey(rawStr);

  // 1. Direct matching by department name or code
  for (const dept of departments) {
    const deptNorm = normalizeKey(dept.name);
    const codeNorm = normalizeKey(dept.code);
    if (norm === deptNorm || norm === codeNorm || norm.includes(deptNorm) || deptNorm.includes(norm)) {
      return { departmentId: dept.id, departmentName: dept.name };
    }
  }

  // 2. Intelligent keyword detection for THPT Nguyễn Chí Thanh departments

  // Ban Giám Hiệu Nhà Trường
  if (norm.includes('bgh') || norm.includes('giamhieu') || norm.includes('hieutruong') || norm.includes('bangianghieu')) {
    const found = departments.find(d => d.id === 'dept-bgh' || d.code === 'BGH');
    if (found) return { departmentId: found.id, departmentName: found.name };
  }

  // Tổ Văn Phòng
  if (norm.includes('vanphong') || norm.includes('hanhchinh') || norm.includes('ketoan') || norm.includes('yte') || norm.includes('vanthu') || norm.includes('thuquy')) {
    const found = departments.find(d => d.id === 'dept-van-phong' || d.code === 'VAN_PHONG');
    if (found) return { departmentId: found.id, departmentName: found.name };
  }

  // Tổ Tiếng Anh (hoặc Ngoại ngữ)
  if (norm.includes('tienganh') || norm.includes('ngoaingu') || norm.includes('anhvan') || norm.includes('english')) {
    const found = departments.find(d => d.id === 'dept-tieng-anh' || d.code === 'TIENG_ANH');
    if (found) return { departmentId: found.id, departmentName: found.name };
  }

  // Tổ Sinh-KTNN-GDTC-QPAN
  if (
    norm.includes('ktnn') ||
    norm.includes('gdtc') ||
    norm.includes('qpan') ||
    norm.includes('theduc') ||
    norm.includes('quocphong') ||
    (norm.includes('sinh') && !norm.includes('hoc')) ||
    norm.includes('sinhhoc')
  ) {
    const found = departments.find(d => d.id === 'dept-sinh-ktnn-gdtc-qpan' || d.code === 'SINH_KTNN_GDTC_QPAN');
    if (found) return { departmentId: found.id, departmentName: found.name };
  }

  // Tổ Lý-KTCN
  if (
    norm.includes('ktcn') ||
    norm.includes('lyktcn') ||
    norm.includes('vatly') ||
    norm.includes('congnghe') ||
    (norm.includes('ly') && !norm.includes('dia'))
  ) {
    const found = departments.find(d => d.id === 'dept-ly-ktcn' || d.code === 'LY_KTCN');
    if (found) return { departmentId: found.id, departmentName: found.name };
  }

  // Tổ Hóa-Tin-TNHN
  if (
    norm.includes('tnhn') ||
    norm.includes('hoatin') ||
    norm.includes('trainghiem') ||
    norm.includes('huongnghiep') ||
    norm.includes('hoahoc') ||
    norm.includes('hoa') ||
    norm.includes('tinhoc') ||
    norm.includes('tin')
  ) {
    const found = departments.find(d => d.id === 'dept-hoa-tin-tnhn' || d.code === 'HOA_TIN_TNHN');
    if (found) return { departmentId: found.id, departmentName: found.name };
  }

  // Tổ Sử-Địa-GDKTPL
  if (
    norm.includes('gdktpl') ||
    norm.includes('sudia') ||
    norm.includes('lichsu') ||
    norm.includes('diali') ||
    norm.includes('su') ||
    norm.includes('dia') ||
    norm.includes('kinhtephapluat')
  ) {
    const found = departments.find(d => d.id === 'dept-su-dia-gdktpl' || d.code === 'SU_DIA_GDKTPL');
    if (found) return { departmentId: found.id, departmentName: found.name };
  }

  // Tổ Ngữ Văn-Thư Viện-GDĐP
  if (
    norm.includes('gddp') ||
    norm.includes('thuvien') ||
    norm.includes('nguvan') ||
    norm.includes('van') ||
    norm.includes('giaoducdiaphuong')
  ) {
    const found = departments.find(d => d.id === 'dept-van-tv-gddp' || d.code === 'VAN_TV_GDDP');
    if (found) return { departmentId: found.id, departmentName: found.name };
  }

  // Tổ Toán
  if (norm.includes('toan')) {
    const found = departments.find(d => d.id === 'dept-toan' || d.code === 'TOAN');
    if (found) return { departmentId: found.id, departmentName: found.name };
  }

  // Fallback to first non-BGH department
  const fallback = departments.find(d => d.id !== 'dept-bgh') || departments[0];
  return { departmentId: fallback.id, departmentName: fallback.name };
}

// Parse Excel file buffer or array buffer
export function parseExcelFile(
  fileBuffer: ArrayBuffer,
  departments: Department[],
  existingUsers: User[]
): ParsedUserRow[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Tệp Excel không chứa sheet nào!');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse rows as raw objects
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('Tệp Excel không có dữ liệu dòng nào!');
  }

  const parsedList: ParsedUserRow[] = [];

  rawRows.forEach((row, index) => {
    // Map columns dynamically
    let teacherCode = '';
    let fullName = '';
    let username = '';
    let password = '123456';
    let email = '';
    let rawRole = '';
    let rawDept = '';
    let title = 'Giáo viên bộ môn';
    let isDepartmentHead = false;
    let subject = '';
    let phone = '';

    // Inspect each field in the row
    Object.keys(row).forEach((colName) => {
      const normCol = normalizeKey(colName);
      const val = String(row[colName]).trim();

      if (normCol.includes('mavc') || normCol.includes('mavienchuc') || normCol === 'ma' || normCol === 'code' || normCol.includes('teachercode')) {
        teacherCode = val;
      } else if (normCol.includes('hoten') || normCol.includes('hovaten') || normCol === 'ten' || normCol.includes('fullname')) {
        fullName = val;
      } else if (normCol.includes('tendangnhap') || normCol.includes('taikhoan') || normCol === 'username' || normCol === 'user') {
        username = val;
      } else if (normCol.includes('matkhau') || normCol === 'pass' || normCol === 'password') {
        if (val) password = val;
      } else if (normCol.includes('email') || normCol.includes('mail') || normCol.includes('thudientu')) {
        email = val;
      } else if (normCol.includes('vaitro') || normCol.includes('quyen') || normCol.includes('role') || normCol.includes('roleid')) {
        rawRole = val;
      } else if (normCol.includes('tochuyenmon') || normCol.includes('phongban') || normCol.includes('bomon') || normCol.includes('department') || normCol === 'to') {
        rawDept = val;
      } else if (normCol.includes('chucvu') || normCol.includes('chucdanh') || normCol === 'title') {
        title = val;
      } else if (normCol.includes('latotruong') || normCol.includes('totruong') || normCol.includes('isdepartmenthead')) {
        const valNorm = normalizeKey(val);
        isDepartmentHead = valNorm === 'co' || valNorm === 'true' || valNorm === '1' || valNorm === 'dung' || valNorm === 'x';
      } else if (normCol.includes('monday') || normCol.includes('chuyenmon') || normCol === 'subject') {
        subject = val;
      } else if (normCol.includes('sdt') || normCol.includes('dienthoai') || normCol.includes('phone') || normCol.includes('didong')) {
        phone = val;
      }
    });

    // Skip empty lines (where no name or code exists)
    if (!fullName && !username && !teacherCode) {
      return;
    }

    // Auto-generate username or teacherCode if missing
    if (!username && fullName) {
      const parts = fullName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      username = `gv_${parts.slice(0, 10)}_${index + 1}`;
    }
    if (!teacherCode) {
      teacherCode = `GV-${String(existingUsers.length + index + 10).padStart(3, '0')}`;
    }
    if (!email && username) {
      email = `${username}@thptnguyenchithanh.edu.vn`;
    }

    const { roleId, roleName } = mapRoleString(rawRole);
    if (roleId === 'TO_TRUONG') {
      isDepartmentHead = true;
    }
    const { departmentId, departmentName } = mapDepartmentString(rawDept, departments);

    // Validation checks
    let status: 'valid' | 'warning' | 'error' = 'valid';
    let statusMessage = 'Sẵn sàng thêm mới';

    if (!fullName) {
      status = 'error';
      statusMessage = 'Thiếu Họ và Tên';
    } else {
      const isUsernameDuplicate = existingUsers.some(
        u => u.username.toLowerCase() === username.toLowerCase()
      );
      const isCodeDuplicate = existingUsers.some(
        u => u.teacherCode.toLowerCase() === teacherCode.toLowerCase()
      );

      if (isUsernameDuplicate || isCodeDuplicate) {
        status = 'warning';
        statusMessage = `Đã tồn tại tài khoản (@${username}). Sẽ cập nhật dữ liệu.`;
      }
    }

    parsedList.push({
      rowNumber: index + 2, // Excel 1-based header is row 1
      teacherCode,
      fullName,
      username,
      password: password || '123456',
      email,
      roleId,
      roleName,
      departmentId,
      departmentName,
      title: title || (isDepartmentHead ? 'Tổ trưởng chuyên môn' : roleId === 'NHAN_VIEN' ? 'Nhân viên chuyên trách' : 'Giáo viên bộ môn'),
      isDepartmentHead,
      subject: subject || (roleId === 'NHAN_VIEN' ? 'Hành chính - Nghiệp vụ' : departmentName.includes('Toán') ? 'Toán học' : departmentName.includes('Văn') ? 'Ngữ Văn' : 'Chuyên môn'),
      phone,
      status,
      statusMessage,
      raw: row,
    });
  });

  return parsedList;
}

// Generate & download Sample Excel file
export function downloadSampleExcel(departments: Department[]) {
  const sampleData = [
    {
      'STT': 1,
      'Mã Viên Chức (*)': 'GV-001',
      'Họ và Tên (*)': 'Phạm Thu Hà',
      'Tên Đăng Nhập (*)': 'gvtoan1',
      'Mật Khẩu': '123456',
      'Email': 'phamthuha@thptnguyenchithanh.edu.vn',
      'Tổ Chuyên Môn (*)': 'Tổ Toán',
      'Vai Trò (role_id) (*)': 'GIAO_VIEN',
      'Chức Vụ': 'Giáo viên bộ môn',
      'Là Tổ Trưởng (Có/Không)': 'Không',
      'Môn Dạy': 'Toán học',
      'Số Điện Thoại': '0912345671',
    },
    {
      'STT': 2,
      'Mã Viên Chức (*)': 'GV-002',
      'Họ và Tên (*)': 'Lê Văn Nam',
      'Tên Đăng Nhập (*)': 'totruongtoan',
      'Mật Khẩu': '123456',
      'Email': 'levannam@thptnguyenchithanh.edu.vn',
      'Tổ Chuyên Môn (*)': 'Tổ Toán',
      'Vai Trò (role_id) (*)': 'TO_TRUONG',
      'Chức Vụ': 'Tổ trưởng chuyên môn',
      'Là Tổ Trưởng (Có/Không)': 'Có',
      'Môn Dạy': 'Toán học',
      'Số Điện Thoại': '0912345672',
    },
    {
      'STT': 3,
      'Mã Viên Chức (*)': 'GV-003',
      'Họ và Tên (*)': 'Hoàng Thị Hương',
      'Tên Đăng Nhập (*)': 'totruongvan',
      'Mật Khẩu': '123456',
      'Email': 'hoanghuong@thptnguyenchithanh.edu.vn',
      'Tổ Chuyên Môn (*)': 'Tổ Ngữ Văn-Thư Viện-GDĐP',
      'Vai Trò (role_id) (*)': 'TO_TRUONG',
      'Chức Vụ': 'Tổ trưởng chuyên môn',
      'Là Tổ Trưởng (Có/Không)': 'Có',
      'Môn Dạy': 'Ngữ Văn',
      'Số Điện Thoại': '0912345673',
    },
    {
      'STT': 4,
      'Mã Viên Chức (*)': 'GV-004',
      'Họ và Tên (*)': 'Nguyễn Mai Chi',
      'Tên Đăng Nhập (*)': 'totruongtienganh',
      'Mật Khẩu': '123456',
      'Email': 'nguyenmaichi@thptnguyenchithanh.edu.vn',
      'Tổ Chuyên Môn (*)': 'Tổ Tiếng Anh',
      'Vai Trò (role_id) (*)': 'TO_TRUONG',
      'Chức Vụ': 'Tổ trưởng chuyên môn',
      'Là Tổ Trưởng (Có/Không)': 'Có',
      'Môn Dạy': 'Tiếng Anh',
      'Số Điện Thoại': '0912345674',
    },
    {
      'STT': 5,
      'Mã Viên Chức (*)': 'GV-005',
      'Họ và Tên (*)': 'Trần Quốc Tuấn',
      'Tên Đăng Nhập (*)': 'totruonghoatin',
      'Mật Khẩu': '123456',
      'Email': 'quoctuan@thptnguyenchithanh.edu.vn',
      'Tổ Chuyên Môn (*)': 'Tổ Hóa-Tin-TNHN',
      'Vai Trò (role_id) (*)': 'TO_TRUONG',
      'Chức Vụ': 'Tổ trưởng chuyên môn',
      'Là Tổ Trưởng (Có/Không)': 'Có',
      'Môn Dạy': 'Tin học - TNHN',
      'Số Điện Thoại': '0912345675',
    },
    {
      'STT': 6,
      'Mã Viên Chức (*)': 'GV-006',
      'Họ và Tên (*)': 'Đỗ Quốc Hưng',
      'Tên Đăng Nhập (*)': 'totruonglyktcn',
      'Mật Khẩu': '123456',
      'Email': 'doquochung@thptnguyenchithanh.edu.vn',
      'Tổ Chuyên Môn (*)': 'Tổ Lý-KTCN',
      'Vai Trò (role_id) (*)': 'TO_TRUONG',
      'Chức Vụ': 'Tổ trưởng chuyên môn',
      'Là Tổ Trưởng (Có/Không)': 'Có',
      'Môn Dạy': 'Vật lý - KTCN',
      'Số Điện Thoại': '0912345676',
    },
    {
      'STT': 7,
      'Mã Viên Chức (*)': 'GV-007',
      'Họ và Tên (*)': 'Trịnh Thúy Lan',
      'Tên Đăng Nhập (*)': 'totruongsinh',
      'Mật Khẩu': '123456',
      'Email': 'trinhthuylan@thptnguyenchithanh.edu.vn',
      'Tổ Chuyên Môn (*)': 'Tổ Sinh-KTNN-GDTC-QPAN',
      'Vai Trò (role_id) (*)': 'TO_TRUONG',
      'Chức Vụ': 'Tổ trưởng chuyên môn',
      'Là Tổ Trưởng (Có/Không)': 'Có',
      'Môn Dạy': 'Sinh học - GDTC',
      'Số Điện Thoại': '0912345677',
    },
    {
      'STT': 8,
      'Mã Viên Chức (*)': 'GV-008',
      'Họ và Tên (*)': 'Ngô Quang Minh',
      'Tên Đăng Nhập (*)': 'totruongsudia',
      'Mật Khẩu': '123456',
      'Email': 'ngoquangminh@thptnguyenchithanh.edu.vn',
      'Tổ Chuyên Môn (*)': 'Tổ Sử-Địa-GDKTPL',
      'Vai Trò (role_id) (*)': 'TO_TRUONG',
      'Chức Vụ': 'Tổ trưởng chuyên môn',
      'Là Tổ Trưởng (Có/Không)': 'Có',
      'Môn Dạy': 'Lịch sử - Địa lý',
      'Số Điện Thoại': '0912345678',
    },
    {
      'STT': 9,
      'Mã Viên Chức (*)': 'NV-001',
      'Họ và Tên (*)': 'Vũ Minh Hạnh',
      'Tên Đăng Nhập (*)': 'totruongvanphong',
      'Mật Khẩu': '123456',
      'Email': 'vuminhhanh@thptnguyenchithanh.edu.vn',
      'Tổ Chuyên Môn (*)': 'Tổ Văn Phòng',
      'Vai Trò (role_id) (*)': 'TO_TRUONG',
      'Chức Vụ': 'Tổ trưởng tổ Văn phòng',
      'Là Tổ Trưởng (Có/Không)': 'Có',
      'Môn Dạy': 'Hành chính - Kế toán',
      'Số Điện Thoại': '0912345679',
    },
    {
      'STT': 10,
      'Mã Viên Chức (*)': 'NV-002',
      'Họ và Tên (*)': 'Nguyễn Thanh Tùng',
      'Tên Đăng Nhập (*)': 'nvvanphong1',
      'Mật Khẩu': '123456',
      'Email': 'nguyenthanhtung@thptnguyenchithanh.edu.vn',
      'Tổ Chuyên Môn (*)': 'Tổ Văn Phòng',
      'Vai Trò (role_id) (*)': 'NHAN_VIEN',
      'Chức Vụ': 'Cán bộ Y tế học đường & Văn thư',
      'Là Tổ Trưởng (Có/Không)': 'Không',
      'Môn Dạy': 'Y tế - Văn thư',
      'Số Điện Thoại': '0945667788',
    },
    {
      'STT': 11,
      'Mã Viên Chức (*)': 'BGH-001',
      'Họ và Tên (*)': 'Nguyễn Văn An',
      'Tên Đăng Nhập (*)': 'hieutruong',
      'Mật Khẩu': '123456',
      'Email': 'nguyenvanan@thptnguyenchithanh.edu.vn',
      'Tổ Chuyên Môn (*)': 'Ban Giám Hiệu Nhà Trường',
      'Vai Trò (role_id) (*)': 'BGH',
      'Chức Vụ': 'Hiệu trưởng',
      'Là Tổ Trưởng (Có/Không)': 'Không',
      'Môn Dạy': 'Quản lý giáo dục',
      'Số Điện Thoại': '0912345680',
    },
    {
      'STT': 12,
      'Mã Viên Chức (*)': 'QT-001',
      'Họ và Tên (*)': 'Nguyễn Quản Trị',
      'Tên Đăng Nhập (*)': 'admin',
      'Mật Khẩu': '123456',
      'Email': 'admin@thptnguyenchithanh.edu.vn',
      'Tổ Chuyên Môn (*)': 'Ban Giám Hiệu Nhà Trường',
      'Vai Trò (role_id) (*)': 'ADMIN',
      'Chức Vụ': 'Quản trị viên hệ thống',
      'Là Tổ Trưởng (Có/Không)': 'Không',
      'Môn Dạy': 'Công nghệ thông tin',
      'Số Điện Thoại': '0912345681',
    },
  ];

  // Instructions Sheet
  const guideData = [
    { 'HƯỚNG DẪN ĐIỀN FILE EXCEL DANH SÁCH VIÊN CHỨC & PHÂN QUYỀN': '' },
    { 'HƯỚNG DẪN ĐIỀN FILE EXCEL DANH SÁCH VIÊN CHỨC & PHÂN QUYỀN': '1. Cột có dấu (*) là thông tin quan trọng bắt buộc (Mã VC, Họ tên, Tên đăng nhập, Tổ chuyên môn, Vai trò).' },
    { 'HƯỚNG DẪN ĐIỀN FILE EXCEL DANH SÁCH VIÊN CHỨC & PHÂN QUYỀN': '2. Vai trò (role_id) gồm 5 loại chuẩn: ADMIN (Quản trị), BGH (Ban Giám Hiệu), TO_TRUONG (Tổ trưởng), GIAO_VIEN (Giáo viên), NHAN_VIEN (Nhân viên).' },
    { 'HƯỚNG DẪN ĐIỀN FILE EXCEL DANH SÁCH VIÊN CHỨC & PHÂN QUYỀN': '3. Tổ Chuyên Môn hiện có trong hệ thống THPT Nguyễn Chí Thanh:' },
    ...departments.map(d => ({
      'HƯỚNG DẪN ĐIỀN FILE EXCEL DANH SÁCH VIÊN CHỨC & PHÂN QUYỀN': `   - ${d.name} (Mã: ${d.code})`,
    })),
    { 'HƯỚNG DẪN ĐIỀN FILE EXCEL DANH SÁCH VIÊN CHỨC & PHÂN QUYỀN': '4. Mật khẩu mặc định nếu để trống sẽ tự động đặt là 123456.' },
    { 'HƯỚNG DẪN ĐIỀN FILE EXCEL DANH SÁCH VIÊN CHỨC & PHÂN QUYỀN': '5. Hệ thống hỗ trợ định dạng .xlsx, .xls, .csv.' },
  ];

  const wb = XLSX.utils.book_new();
  const wsSample = XLSX.utils.json_to_sheet(sampleData);
  const wsGuide = XLSX.utils.json_to_sheet(guideData);

  // Set column widths
  wsSample['!cols'] = [
    { wch: 6 },  // STT
    { wch: 15 }, // Ma VC
    { wch: 22 }, // Ho ten
    { wch: 18 }, // Username
    { wch: 12 }, // Pass
    { wch: 30 }, // Email
    { wch: 26 }, // To chuyen mon
    { wch: 22 }, // Vai tro
    { wch: 22 }, // Chuc vu
    { wch: 22 }, // La to truong
    { wch: 18 }, // Mon day
    { wch: 16 }, // SDT
  ];

  XLSX.utils.book_append_sheet(wb, wsSample, 'Danh_Sach_Vien_Chuc');
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Huong_Dan_Nhap_Lieu');

  XLSX.writeFile(wb, 'Mau_Danh_Sach_Vien_Chuc_THPT_NguyenChiThanh.xlsx');
}

// Export Current Users to Excel
export function exportUsersToExcel(
  users: User[],
  departments: Department[],
  roles: Role[]
) {
  const exportData = users.map((u, idx) => {
    const dept = departments.find(d => d.id === u.departmentId);
    const role = roles.find(r => r.id === u.roleId);

    return {
      'STT': idx + 1,
      'Mã Viên Chức': u.teacherCode,
      'Họ và Tên': u.fullName,
      'Tên Đăng Nhập': u.username,
      'Mật Khẩu': u.password || '123456',
      'Email': u.email,
      'Tổ Chuyên Môn': dept?.name || 'Chưa phân tổ',
      'Mã Tổ (department_id)': u.departmentId,
      'Vai Trò Hệ Thống': role?.name || u.roleId,
      'Mã Vai Trò (role_id)': u.roleId,
      'Chức Danh / Chức Vụ': u.title,
      'Là Tổ Trưởng': u.isDepartmentHead ? 'Có' : 'Không',
      'Chuyên Môn / Môn Dạy': u.subject,
      'Số Điện Thoại': u.phone || '',
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 28 },
    { wch: 26 },
    { wch: 20 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 14 },
    { wch: 20 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Users_And_Roles');
  XLSX.writeFile(
    wb,
    `Danh_Sach_Vien_Chuc_THPT_NguyenChiThanh_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}
