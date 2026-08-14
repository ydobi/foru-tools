// 用户认证相关的工具函数
import {
  HomeFilled,
  Connection,
  Document,
  MapLocation,
  Share,
  FirstAidKit,
  TrendCharts
} from '@element-plus/icons-vue'

const USER_KEY = 'user'
const TOKEN_KEY = 'token'

/**
 * 获取当前登录用户信息
 * @returns {Object|null} 用户信息对象或null（未登录）
 */
export function getUser() {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * 保存登录态（用户名/角色来自 API，令牌用于后续请求）
 */
export function setSession(user, token) {
  localStorage.setItem(USER_KEY, JSON.stringify({
    username: user.username,
    role: user.role
  }));
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 检查用户是否已登录
 * @returns {Boolean} 是否已登录
 */
export function isLoggedIn() {
  return !!getUser();
}

/**
 * 检查用户是否具有指定角色
 * @param {String} role 角色名称
 * @returns {Boolean} 是否具有该角色
 */
export function hasRole(role) {
  const user = getUser();
  return user ? user.role === role : false;
}

/**
 * 检查用户是否是管理员
 * @returns {Boolean} 是否是管理员
 */
export function isAdmin() {
  return hasRole('admin');
}

/**
 * 登出用户
 */
export function logout() {
  const token = getToken();
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  if (token) {
    fetch('/api/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token }
    }).catch(() => {});
  }
}

/**
 * 根据用户角色获取可访问的菜单
 * @returns {Array} 菜单项数组
 */
export function getMenusByRole() {
  const user = getUser();
  
  // 所有用户都可以访问的菜单
  const commonMenus = [
    { name: 'Home', path: '/', label: '首页', icon: HomeFilled }
  ];
  
  // 根据角色返回不同的菜单
  if (!user) {
    return commonMenus;
  }
  
  if (user.role === 'admin') {
    // 管理员可以访问所有菜单
    return [
      ...commonMenus,
      { name: 'CompanyRelation', path: '/company-relation', label: '公司关联关系处理', icon: Connection },
      { name: 'ExcelMerge', path: '/excel-merge', label: 'Excel文件合并', icon: Document },
      { name: 'SmartMap', path: '/smart-map', label: '智能地图工具', icon: MapLocation },
      { name: 'RoleManage', path: '/company-relation2', label: '公司关联关系处理2', icon: Share },
      { name: 'HospitalAuthAnalysis', path: '/hospital-auth-analysis', label: '医院授权&植入分析', icon: FirstAidKit },
      { name: 'OrderAchievementAnalysis', path: '/order-achievement-analysis', label: '订货达成率异常分析', icon: TrendCharts }
    ];
  } else {
    // 普通用户只能访问部分菜单
    return [
      ...commonMenus,
      { name: 'ExcelMerge', path: '/excel-merge', label: 'Excel文件合并', icon: Document },
      { name: 'HospitalAuthAnalysis', path: '/hospital-auth-analysis', label: '医院授权&植入分析', icon: FirstAidKit },
      { name: 'OrderAchievementAnalysis', path: '/order-achievement-analysis', label: '订货达成率异常分析', icon: TrendCharts }
    ];
  }
}
