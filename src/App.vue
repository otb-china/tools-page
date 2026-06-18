<template>
  <RouterView />
</template>

<script setup lang="ts">
import { useScreenOrientation } from "@/utils/useScreenOrientation.ts";
import { onMounted, onUnmounted, provide, ref } from "vue";
import { RouterView } from "vue-router";

declare global {
  interface Window {
    orientationChangeTimer?: ReturnType<typeof setTimeout>;
  }
}

let screenType = ref(useScreenOrientation().orientation.value);

// 3. 监听屏幕方向变化（防抖处理，避免频繁触发）
const handleOrientationChange = () => {
  clearTimeout(window.orientationChangeTimer);
  // 防抖延迟 300ms（避免屏幕旋转过程中频繁切换）
  window.orientationChangeTimer = setTimeout(() => {
    screenType.value = useScreenOrientation().orientation.value

    console.log(screenType.value, "screenType.value");
  }, 300);
};

onMounted(() => {
  // 绑定监听事件（兼容不同浏览器）
  window.addEventListener("orientationchange", handleOrientationChange);
  window.addEventListener("resize", handleOrientationChange); // 窗口缩放时也触发（PC 端）
});

onUnmounted(() => {
  // 解绑事件，避免内存泄漏
  window.removeEventListener("orientationchange", handleOrientationChange);
  window.removeEventListener("resize", handleOrientationChange);
  clearTimeout(window.orientationChangeTimer);
});

provide("screenState", {
  screenType
});
</script>

<style scoped lang="scss">
:deep(.van-nav-bar__title),
:deep(.van-nav-bar__left i),
:deep(.van-nav-bar__left span) {
  color: #ffffff !important;
}
</style>
