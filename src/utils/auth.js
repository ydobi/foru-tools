// 用户认证相关的工具函数

/**
 * 获取当前登录用户信息
 * @returns {Object|null} 用户信息对象或null（未登录）
 */
export function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
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
  localStorage.removeItem('user');
}

/**
 * 根据用户角色获取可访问的菜单
 * @returns {Array} 菜单项数组
 */
export function getMenusByRole() {
  const user = getUser();
  
  // 所有用户都可以访问的菜单
  const commonMenus = [
    { name: 'Home', path: '/', label: '首页' }
  ];
  
  // 根据角色返回不同的菜单
  if (!user) {
    return commonMenus;
  }
  
  if (user.role === 'admin') {
    // 管理员可以访问所有菜单
    return [
      ...commonMenus,
      { name: 'CompanyRelation', path: '/company-relation', label: '公司关联关系处理' },
      { name: 'ExcelMerge', path: '/excel-merge', label: 'Excel文件合并' },
      { name: 'SmartMap', path: '/smart-map', label: '智能地图工具' },
      { name: 'UserManage', path: '/user-manage', label: '用户管理' },
      { name: 'RoleManage', path: '/company-relation2', label: '表格数据合并（植入公司、授权公司、订货公司）' }
    ];
  } else {
    // 普通用户只能访问部分菜单
    return [
      ...commonMenus,
      { name: 'ExcelMerge', path: '/excel-merge', label: 'Excel文件合并' }
    ];
  }
}