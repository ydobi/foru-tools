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
import { apiFetch } from './api.js'

let sessionVerified = false

/**
 * 获取当前登录用户信息
 * @returns {Object|null} 用户信息对象或null（未登录）
 */
export function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function getToken() {
  return localStorage.getItem('token');
}

/**
 * 检查用户是否已登录
 * @returns {Boolean} 是否已登录
 */
export function isLoggedIn() {
  return !!getUser() && !!getToken();
}

/**
 * 用 GET /api/me 校验 JWT。本页加载内只请求一次。
 * @returns {Promise<Boolean>} 会话是否有效
 */
export async function ensureSession() {
  if (!getToken()) {
    logout();
    return false;
  }
  if (sessionVerified) {
    return true;
  }
  try {
    const res = await apiFetch('/api/me');
    if (res.ok) {
      const data = await res.json();
      setSession({ user: data });
      return true;
    }
    logout();
    return false;
  } catch (e) {
    logout();
    return false;
  }
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

export function setSession(payload) {
  const user = payload.user || {
    username: payload.username,
    role: payload.role
  };
  localStorage.setItem('user', JSON.stringify(user));
  if (payload.access_token) {
    localStorage.setItem('token', payload.access_token);
  }
  sessionVerified = true;
}

export function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  sessionVerified = false;
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
