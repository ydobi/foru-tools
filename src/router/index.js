import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import CompanyRelation from '../views/CompanyRelation.vue'
import ExcelMerge from '../views/ExcelMerge.vue'
import SmartMap from '../views/SmartMap.vue'
import Login from '../views/Login.vue'
import { isLoggedIn, hasRole } from '../utils/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/company-relation',
    name: 'CompanyRelation',
    component: CompanyRelation,
    meta: { 
      requiresAuth: true,
      roles: ['admin'] // 只有管理员可以访问
    }
  },
  {
    path: '/excel-merge',
    name: 'ExcelMerge',
    component: ExcelMerge,
    meta: { 
      requiresAuth: true,
      roles: ['admin', 'user'] // 管理员和普通用户都可以访问
    }
  },
  {
    path: '/smart-map',
    name: 'SmartMap',
    component: SmartMap,
    meta: { 
      requiresAuth: true,
      roles: ['admin'] // 只有管理员可以访问
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true } // 只有未登录用户可以访问
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isGuestOnly = to.matched.some(record => record.meta.guest)
  
  // 检查是否需要认证
  if (requiresAuth) {
    // 如果需要认证但未登录，重定向到登录页
    if (!isLoggedIn()) {
      next({ name: 'Login' })
      return
    }
    
    // 检查角色权限
    const requiredRoles = to.meta.roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasAccess = requiredRoles.some(role => hasRole(role))
      if (!hasAccess) {
        // 如果没有所需角色权限，重定向到首页
        next({ name: 'Home' })
        return
      }
    }
  }
  
  // 如果是仅限游客的页面（如登录页），已登录用户应重定向到首页
  if (isGuestOnly && isLoggedIn()) {
    next({ name: 'Home' })
    return
  }
  
  // 其他情况正常导航
  next()
})

export default router