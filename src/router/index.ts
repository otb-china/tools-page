import {createRouter, createWebHashHistory, type RouteRecordRaw} from 'vue-router'
import type {RSA} from "otb-toolkit/src/types/index.ts";

export const fixRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '工具页',
      header: true,
      icon: "House",
    }
  },
];

const router = createRouter({
  history: createWebHashHistory((import.meta as RSA).env.BASE_URL),
  routes: fixRoutes
})
export default router
