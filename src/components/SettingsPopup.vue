<template>
  <van-popup v-model:show="popupShow" position="bottom" round destroy-on-close>
    <div class="popup-body">
      <div class="popup-head">
        <div>
          <h3>更多操作</h3>
        </div>
      </div>

      <div class="theme-panel">
        <div class="theme-panel-head">
          <strong>界面主题</strong>
          <span>{{ currentThemeName }}</span>
        </div>
        <div class="theme-options">
          <button
            v-for="theme in themeOptions"
            :key="theme.key"
            class="theme-option"
            :class="{ active: currentTheme === theme.key }"
            type="button"
            @click="emit('set-theme', theme.key)"
          >
            <span class="theme-swatch" :style="{ background: theme.swatch }"></span>
            <span>
              <strong>{{ theme.name }}</strong>
              <em>{{ theme.caption }}</em>
            </span>
          </button>
        </div>
      </div>

      <div class="settings-grid">
        <button class="settings-item settings-item-feature" type="button" @click="emit('export')">
          <span class="settings-item-icon">
            <el-icon><Download /></el-icon>
          </span>
          <span>
            <strong>导出总数据</strong>
            <em>下载工具页备份文件</em>
          </span>
        </button>

        <button class="settings-item settings-item-feature" type="button" @click="emit('open-import')">
          <span class="settings-item-icon">
            <el-icon><Upload /></el-icon>
          </span>
          <span>
            <strong>导入总数据</strong>
            <em>上传备份文件后恢复工具</em>
          </span>
        </button>

        <button class="settings-item settings-item-feature" type="button" @click="emit('open-recycle')">
          <span class="settings-item-icon">
            <el-icon><RefreshLeft /></el-icon>
          </span>
          <span>
            <strong>回收站</strong>
            <em>{{ recycleCount }} 个工具，一周内可恢复</em>
          </span>
        </button>

        <button class="settings-item settings-item-feature danger" type="button" @click="emit('reset')">
          <span class="settings-item-icon">
            <el-icon><Delete /></el-icon>
          </span>
          <span>
            <strong>重置数据</strong>
            <em>清除全部工具数据</em>
          </span>
        </button>
      </div>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Delete, Download, RefreshLeft, Upload } from "@element-plus/icons-vue";
import type { ThemeKey, ThemeOption } from "@/config/themes";

const props = defineProps<{
  show: boolean;
  themeOptions: ThemeOption[];
  currentTheme: ThemeKey;
  currentThemeName: string;
  recycleCount: number;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "set-theme": [theme: ThemeKey];
  export: [];
  "open-import": [];
  "open-recycle": [];
  reset: [];
}>();

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});
</script>

<style lang="scss" scoped>
.theme-panel {
  margin-top: 16px;
  padding: 14px;
  border-radius: 12px;
  background: var(--surface-soft);
}

.theme-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.theme-panel-head strong {
  color: var(--text-strong);
}

.theme-panel-head span {
  flex: 0 0 auto;
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--surface);
  text-align: left;
}

.theme-option.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-ring);
}

.theme-swatch {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48);
}

.theme-option > span:last-child {
  min-width: 0;
}

.theme-option strong,
.theme-option em {
  display: block;
}

.theme-option strong {
  color: var(--text-strong);
  font-size: 13px;
}

.theme-option em {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 11px;
  font-style: normal;
  line-height: 1.2;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.settings-item {
  padding: 14px 16px;
  border: 0;
  border-radius: 10px;
  background: var(--surface-soft);
  text-align: left;
}

.settings-item-feature {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: var(--settings-card-bg);
}

.settings-item-feature.danger {
  background: var(--settings-danger-bg);
}

.settings-item-feature.danger .settings-item strong,
.settings-item span {
  display: block;
}

.settings-item strong {
  color: var(--text-main);
  font-size: 14px;
}

.settings-item span {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
}

.settings-item-feature > span:last-child {
  min-width: 0;
  margin-top: 0;
}

.settings-item-feature em {
  display: block;
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-style: normal;
  line-height: 1.35;
}

@media (max-width: 720px) {
  .settings-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
