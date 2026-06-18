import router from '@/router'

// 监听路由变化
router.beforeEach((to, _from, next) => {
  // 动态设置标题
  if (to.meta.title) document.title = to.meta.title as string;
  next();
})
