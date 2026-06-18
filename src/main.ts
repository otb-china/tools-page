import { createApp } from 'vue'
// 状态管理
import { createPinia } from "pinia"
import App from './App.vue'
import router from '@/router'
// UI框架
import ElementPlus from "element-plus"
import "element-plus/dist/index.css"
// Vant组件样式
import 'vant/lib/index.css';
import Vant from "vant"
// 全局样式
import "otb-toolkit/src/styles/index.scss"
import "@/style.scss"
// 路由守卫
import "@/router/routerGuards"

const app = createApp(App)
const pinia = createPinia()

app.use(pinia).use(router).use(ElementPlus).use(Vant)

app.mount('#app')
