// 用户相关常量（对应 UserType / UserStatus / gender 显示）
export const UserTypeDesc = { 1: '普通用户', 2: '管理员' };
export const UserStatusDesc = { 0: '禁用', 1: '正常' };

export function genderDisplayName(gender) {
  if (gender == null) return '未知';
  if (gender === 1) return '男';
  if (gender === 2) return '女';
  return '未知';
}

// 日期格式化：mysql Date 对象 → 'YYYY-MM-DD'
function formatDate(d) {
  if (!d) return null;
  if (d instanceof Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return d;
}

// datetime 格式化为 'YYYY-MM-DD HH:mm:ss'
function formatDateTime(d) {
  if (!d) return null;
  if (d instanceof Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }
  return d;
}

// 把数据库行转为前端期望的 UserDetailResponseDTO（对应 UserConvert.entityToDetailResponse）
export function toUserDetail(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    nickname: row.nickname,
    avatar: row.avatar,
    phone: row.phone,
    gender: row.gender,
    genderDisplayName: genderDisplayName(row.gender),
    birthday: formatDate(row.birthday),
    userType: row.user_type,
    userTypeDisplayName: UserTypeDesc[row.user_type] || '未知',
    status: row.status,
    statusDisplayName: UserStatusDesc[row.status] || '未知',
    displayName: row.nickname && row.nickname.trim().length > 0 ? row.nickname : row.username,
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
  };
}

// 对外导出格式化工具（其他模块也用得到）
export const format = { date: formatDate, dateTime: formatDateTime };
