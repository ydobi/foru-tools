import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import CompanyRelation from '../views/CompanyRelation.vue'
import ExcelMerge from '../views/ExcelMerge.vue'
import SmartMap from '../views/SmartMap.vue'

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
    path: '/smart-map',
    name: 'SmartMap',
    component: SmartMap
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router