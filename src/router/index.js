import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import CompanyRelation from '../views/CompanyRelation.vue'
import ExcelMerge from '../views/ExcelMerge.vue'
import SmartMap from '../views/SmartMap.vue'
import HospitalAuthAnalysis from '../views/HospitalAuthAnalysis.vue'
import OrderAchievementAnalysis from '../views/OrderAchievementAnalysis.vue'

// 无需登录，所有工具对所有访问者开放
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/company-relation',
    name: 'CompanyRelation',
    component: CompanyRelation
  },
  {
    path: '/excel-merge',
    name: 'ExcelMerge',
    component: ExcelMerge
  },
  {
    path: '/company-relation2',
    name: 'CompanyRelation2',
    component: () => import('@/views/CompanyRelation2.vue')
  },
  {
    path: '/smart-map',
    name: 'SmartMap',
    component: SmartMap
  },
  {
    path: '/hospital-auth-analysis',
    name: 'HospitalAuthAnalysis',
    component: HospitalAuthAnalysis
  },
  {
    path: '/order-achievement-analysis',
    name: 'OrderAchievementAnalysis',
    component: OrderAchievementAnalysis
  },
  {
    // 旧的 /login 书签及未知路径都回到首页
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
