import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import CompanyRelation from '../views/CompanyRelation.vue'
import ExcelMerge from '../views/ExcelMerge.vue'
import SmartMap from '../views/SmartMap.vue'
import Login from '../views/Login.vue'
import HospitalAuthAnalysis from '../views/HospitalAuthAnalysis.vue'
import OrderAchievementAnalysis from '../views/OrderAchievementAnalysis.vue'
import { isLoggedIn, hasRole, ensureSession } from '../utils/auth'

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
    path: '/company-relation2',
    name: 'CompanyRelation2',
    component: () => import('@/views/CompanyRelation2.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'] }
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
    path: '/hospital-auth-analysis',
    name: 'HospitalAuthAnalysis',
    component: HospitalAuthAnalysis,
    meta: { 
      requiresAuth: true,
      roles: ['admin', 'user'] // 管理员和普通用户都可以访问
    }
  },
  {
    path: '/order-achievement-analysis',
    name: 'OrderAchievementAnalysis',
    component: OrderAchievementAnalysis,
    meta: { 
      requiresAuth: true,
      roles: ['admin', 'user'] // 管理员和普通用户都可以访问
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
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isGuestOnly = to.matched.some(record => record.meta.guest)

  if (requiresAuth) {
    const ok = await ensureSession()
    if (!ok) {
      next({ name: 'Login' })
      return
    }

    const requiredRoles = to.meta.roles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasAccess = requiredRoles.some(role => hasRole(role))
      if (!hasAccess) {
        next({ name: 'Home' })
        return
      }
    }
  }

  // 登录页不调用 /api/me，避免无效 token 时 next(Login) 形成请求循环
  if (isGuestOnly && isLoggedIn()) {
    next({ name: 'Home' })
    return
  }

  next()
})

export default router
