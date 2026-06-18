<template>
  <div class="home-page" :style="themeStyle">
    <header ref="headerSection" class="page-header">
      <div>
        <p class="hero-tag">Tools Page</p>
        <h1>工具页</h1>
      </div>
      <div class="header-actions">
        <button v-if="showScrollTop" class="header-icon" type="button" @click="scrollToTop">
          <el-icon><Top /></el-icon>
        </button>
        <button class="header-icon" type="button" @click="settingsPopup = true">
          <el-icon><Setting /></el-icon>
        </button>
      </div>
    </header>

    <main class="tools-view">
      <section class="tool-grid" aria-label="工具列表">
        <div
          v-for="tool in tools"
          :key="tool.id"
          class="tool-cell"
          :class="{ dragging: draggingToolId === tool.id }"
          :data-tool-id="tool.id"
        >
          <a
            class="tool-item"
            :class="{ pressed: pressedToolId === tool.id }"
            :href="tool.url"
            @contextmenu.prevent
            @pointerdown="onToolPointerDown($event, tool)"
            @pointermove="onToolPointerMove"
            @pointerup="onToolPointerUp"
            @pointercancel="onToolPointerCancel"
            @click="handleToolClick"
          >
            <span class="app-icon letter-icon">{{ getToolInitial(tool.name) }}</span>
            <span class="tool-name">{{ tool.name }}</span>
          </a>

          <div v-if="actionToolId === tool.id" class="inline-action-menu">
            <button type="button" @click="editActionTool">编辑</button>
            <button type="button" @click="removeActionTool">移除</button>
          </div>
        </div>

        <button class="tool-item add-item" type="button" @click="openEditor()">
          <span class="app-icon plus-icon">
            <el-icon><Plus /></el-icon>
          </span>
          <span class="tool-name">添加</span>
        </button>
      </section>

      <div v-if="!tools.length" class="empty-state">
        <strong>还没有工具</strong>
        <span>点击添加创建第一个工具。</span>
      </div>
    </main>

    <button v-if="actionToolId" class="menu-backdrop" type="button" aria-label="关闭菜单" @click="closeActionMenu"></button>

    <van-popup v-model:show="editorPopup" class="edit-popup" round destroy-on-close>
      <form class="simple-editor" @submit.prevent="saveTool">
        <input v-model.trim="toolForm.name" class="simple-input" placeholder="名称" />
        <input v-model.trim="toolForm.url" class="simple-input" inputmode="url" placeholder="链接" />

        <div class="simple-actions">
          <button class="cancel-btn" type="button" @click="editorPopup = false">取消</button>
          <button class="confirm-btn" type="submit">保存</button>
        </div>
      </form>
    </van-popup>

    <SettingsPopup
      v-model:show="settingsPopup"
      :theme-options="themeOptions"
      :current-theme="currentTheme"
      :current-theme-name="currentThemeOption.name"
      :recycle-count="deletedTools.length"
      @set-theme="setTheme"
      @export="exportAllData"
      @open-import="openImportExport"
      @open-recycle="openRecycleBin"
      @reset="resetAllData"
    />

    <van-popup v-model:show="recyclePopup" position="bottom" round destroy-on-close>
      <div class="popup-body recycle-popup">
        <div class="popup-head">
          <div>
            <h3>回收站</h3>
            <p>移除的工具保留 7 天，可在这里恢复。</p>
          </div>
        </div>

        <div v-if="deletedTools.length" class="recycle-list">
          <div v-for="tool in deletedTools" :key="tool.id" class="recycle-item">
            <div>
              <strong>{{ tool.name }}</strong>
              <span>{{ tool.url }} · {{ getRecycleDaysLeft(tool) }} 天后清除</span>
            </div>
            <div class="recycle-actions">
              <button type="button" @click="restoreDeletedTool(tool.id)">恢复</button>
              <button class="danger" type="button" @click="purgeDeletedTool(tool.id)">删除</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state compact">
          <strong>回收站为空</strong>
          <span>移除的工具会在这里保留一周。</span>
        </div>
      </div>
    </van-popup>

    <ImportDataPopup
      v-model:show="importExportInfo.show"
      :has-overwrite-data="hasImportOverwriteData"
      :summary="importExportSummary"
      :file-name="importInfo.fileName"
      :has-file="Boolean(importInfo.dataStr)"
      @file-loaded="onImportFileLoaded"
      @file-error="showToast"
      @import="importData"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import dayjs from "dayjs";
import { showConfirmDialog, showToast } from "vant";
import { Plus, Setting, Top } from "@element-plus/icons-vue";
import ImportDataPopup from "@/components/ImportDataPopup.vue";
import SettingsPopup from "@/components/SettingsPopup.vue";
import { DEFAULT_THEME, isThemeKey, themeOptions } from "@/config/themes";
import { LStorage } from "@/utils/localStorage.ts";
import type { ThemeKey } from "@/config/themes";
import type { DeletedToolItem, ToolItem, ToolsPageBackupData } from "@/types/tool";

const LONG_PRESS_MS = 520;
const SCROLL_TOP_THRESHOLD = 240;
const DATE_FORMAT = "YYYY-MM-DD";
const RECYCLE_KEEP_DAYS = 7;
const RECYCLE_KEEP_MS = RECYCLE_KEEP_DAYS * 24 * 60 * 60 * 1000;

const defaultTools: ToolItem[] = [];

const headerSection = ref<HTMLElement | null>(null);
const showScrollTop = ref(false);
const currentTheme = ref<ThemeKey>(DEFAULT_THEME);
const tools = ref<ToolItem[]>([]);
const deletedTools = ref<DeletedToolItem[]>([]);
const settingsPopup = ref(false);
const recyclePopup = ref(false);
const editorPopup = ref(false);
const editingToolId = ref("");
const actionToolId = ref("");
const pressedToolId = ref("");
const draggingToolId = ref("");
const suppressNextClick = ref(false);
const longPressTimer = ref<number | undefined>();
const dragState = reactive({ id: "", startX: 0, startY: 0, active: false });
const toolForm = reactive({ name: "", url: "" });
const importExportInfo = ref({ show: false });
const importInfo = ref({ dataStr: "", fileName: "" });

const toolStorage = LStorage.new("toolsPageData");
const recycleStorage = LStorage.new("toolsPageRecycleBin");
const themeStorage = LStorage.new("toolsPageTheme");

const currentThemeOption = computed(() => {
  return themeOptions.find((theme) => theme.key === currentTheme.value) || themeOptions[0];
});
const themeStyle = computed(() => currentThemeOption.value.variables);
const actionTool = computed(() => tools.value.find((tool) => tool.id === actionToolId.value));
const importExportSummary = computed(() => `导入后将覆盖 ${tools.value.length} 个工具`);
const hasImportOverwriteData = computed(() => tools.value.length > 0);

watch(tools, saveTools, { deep: true });
watch(deletedTools, saveDeletedTools, { deep: true });

function init() {
  const storedTheme = themeStorage.getter();
  currentTheme.value = isThemeKey(storedTheme) ? storedTheme : DEFAULT_THEME;
  tools.value = normalizeTools(toolStorage.getter());
  deletedTools.value = purgeExpiredDeletedTools(normalizeDeletedTools(recycleStorage.getter()));
}

function createTool(name: string, url: string): ToolItem {
  return {
    id: createId("tool"),
    name,
    url,
    updatedAt: new Date().toISOString(),
  };
}

function createId(prefix = "id") {
  if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTools(value: unknown): ToolItem[] {
  if (!Array.isArray(value)) return defaultTools;
  return value
    .filter((item): item is Partial<ToolItem> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      id: typeof item.id === "string" && item.id ? item.id : createId("tool"),
      name: typeof item.name === "string" && item.name.trim() ? item.name.trim() : "未命名",
      url: typeof item.url === "string" && item.url.trim() ? normalizeUrl(item.url) : "#",
      updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString(),
    }));
}

function normalizeDeletedTools(value: unknown): DeletedToolItem[] {
  if (!Array.isArray(value)) return [];
  return normalizeTools(value).map((tool, index) => {
    const raw = value[index] as Partial<DeletedToolItem>;
    return {
      ...tool,
      deletedAt: typeof raw.deletedAt === "string" ? raw.deletedAt : new Date().toISOString(),
    };
  });
}

function saveTools() {
  if (tools.value.length) {
    toolStorage.setter(tools.value);
  } else {
    toolStorage.remove();
  }
}

function saveDeletedTools() {
  if (deletedTools.value.length) {
    recycleStorage.setter(deletedTools.value);
  } else {
    recycleStorage.remove();
  }
}

function setTheme(theme: ThemeKey) {
  currentTheme.value = theme;
  themeStorage.setter(theme);
}

function onToolPointerDown(event: PointerEvent, tool: ToolItem) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  closeActionMenu();
  suppressNextClick.value = false;
  pressedToolId.value = "";
  dragState.id = tool.id;
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  dragState.active = false;
  cancelLongPress();
  longPressTimer.value = window.setTimeout(() => {
    if (dragState.active) return;
    suppressNextClick.value = true;
    pressedToolId.value = tool.id;
    actionToolId.value = tool.id;
    window.setTimeout(() => {
      pressedToolId.value = "";
    }, 240);
  }, LONG_PRESS_MS);
}

function onToolPointerMove(event: PointerEvent) {
  if (!dragState.id) return;
  const distance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
  if (!dragState.active && distance < 14) return;

  if (!dragState.active) {
    dragState.active = true;
    draggingToolId.value = dragState.id;
    suppressNextClick.value = true;
    closeActionMenu();
    cancelLongPress();
  }

  event.preventDefault();
  const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
  const targetCell = target?.closest<HTMLElement>("[data-tool-id]");
  const targetId = targetCell?.dataset.toolId;
  if (!targetId || targetId === dragState.id) return;
  moveTool(dragState.id, targetId);
}

function onToolPointerUp() {
  if (dragState.active) suppressNextClick.value = true;
  resetDragState();
}

function onToolPointerCancel() {
  resetDragState();
}

function resetDragState() {
  dragState.id = "";
  dragState.active = false;
  draggingToolId.value = "";
  cancelLongPress();
}

function moveTool(sourceId: string, targetId: string) {
  const sourceIndex = tools.value.findIndex((tool) => tool.id === sourceId);
  const targetIndex = tools.value.findIndex((tool) => tool.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
  const nextTools = [...tools.value];
  const [movedTool] = nextTools.splice(sourceIndex, 1);
  nextTools.splice(targetIndex, 0, movedTool);
  tools.value = nextTools;
}

function cancelLongPress() {
  if (!longPressTimer.value) return;
  window.clearTimeout(longPressTimer.value);
  longPressTimer.value = undefined;
}

function handleToolClick(event: MouseEvent) {
  if (!suppressNextClick.value) return;
  event.preventDefault();
  suppressNextClick.value = false;
}

function closeActionMenu() {
  actionToolId.value = "";
  suppressNextClick.value = false;
}

function editActionTool() {
  if (!actionTool.value) return;
  openEditor(actionTool.value);
  closeActionMenu();
}

function removeActionTool() {
  if (!actionTool.value) return;
  const deletedTool = {
    ...actionTool.value,
    deletedAt: new Date().toISOString(),
  };
  tools.value = tools.value.filter((tool) => tool.id !== actionToolId.value);
  deletedTools.value = [deletedTool, ...deletedTools.value.filter((tool) => tool.id !== deletedTool.id)];
  closeActionMenu();
  showToast(`已移入回收站`);
}

function openEditor(tool?: ToolItem) {
  editingToolId.value = tool?.id || "";
  toolForm.name = tool?.name || "";
  toolForm.url = tool?.url || "";
  editorPopup.value = true;
}

function saveTool() {
  const name = toolForm.name.trim();
  const url = normalizeUrl(toolForm.url.trim());
  if (!name) {
    showToast("请填写名称");
    return;
  }
  if (!url) {
    showToast("请填写链接");
    return;
  }

  if (editingToolId.value) {
    tools.value = tools.value.map((tool) => tool.id === editingToolId.value ? {
      ...tool,
      name,
      url,
      updatedAt: new Date().toISOString(),
    } : tool);
  } else {
    tools.value.push(createTool(name, url));
  }

  editorPopup.value = false;
  showToast("已保存");
}

function openRecycleBin() {
  deletedTools.value = purgeExpiredDeletedTools(deletedTools.value);
  settingsPopup.value = false;
  recyclePopup.value = true;
}

function purgeExpiredDeletedTools(list: DeletedToolItem[]) {
  const now = Date.now();
  return list.filter((tool) => now - new Date(tool.deletedAt).getTime() < RECYCLE_KEEP_MS);
}

function getRecycleDaysLeft(tool: DeletedToolItem) {
  const deletedTime = new Date(tool.deletedAt).getTime();
  const leftMs = Math.max(0, RECYCLE_KEEP_MS - (Date.now() - deletedTime));
  return Math.max(1, Math.ceil(leftMs / (24 * 60 * 60 * 1000)));
}

function restoreDeletedTool(id: string) {
  const deletedTool = deletedTools.value.find((tool) => tool.id === id);
  if (!deletedTool) return;
  const { deletedAt: _deletedAt, ...restoredTool } = deletedTool;
  tools.value.push({
    ...restoredTool,
    id: tools.value.some((tool) => tool.id === restoredTool.id) ? createId("tool") : restoredTool.id,
    updatedAt: new Date().toISOString(),
  });
  deletedTools.value = deletedTools.value.filter((tool) => tool.id !== id);
  recyclePopup.value = false;
  showToast("工具已恢复");
}

function purgeDeletedTool(id: string) {
  deletedTools.value = deletedTools.value.filter((tool) => tool.id !== id);
  showToast("已彻底删除");
}

function openImportExport() {
  settingsPopup.value = false;
  importInfo.value.dataStr = "";
  importInfo.value.fileName = "";
  importExportInfo.value.show = true;
}

function exportAllData() {
  const backupText = JSON.stringify({ tools: tools.value, deletedTools: deletedTools.value }, null, 2);
  const blob = new Blob([backupText], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = `tools-page-backup-${dayjs(new Date()).format(DATE_FORMAT)}.json`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
  settingsPopup.value = false;
  showToast("备份文件已导出");
}

function onImportFileLoaded(payload: { dataStr: string; fileName: string }) {
  importInfo.value.dataStr = payload.dataStr;
  importInfo.value.fileName = payload.fileName;
  showToast("备份文件已读取");
}

function importData() {
  try {
    const parsedData = JSON.parse(importInfo.value.dataStr) as ToolsPageBackupData;
    if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) {
      throw new Error("Invalid backup data");
    }
    const importedTools = normalizeTools(parsedData.tools);
    const importedDeletedTools = normalizeDeletedTools(parsedData.deletedTools);
    if (!Array.isArray(parsedData.tools) || importedTools.length !== parsedData.tools.length) {
      throw new Error("Invalid tools");
    }
    tools.value = importedTools;
    deletedTools.value = importedDeletedTools;
    importExportInfo.value.show = false;
    importInfo.value.dataStr = "";
    importInfo.value.fileName = "";
    showToast("总数据导入成功");
  } catch {
    showToast("导入失败，请检查备份文件");
  }
}

function resetAllData() {
  showConfirmDialog({
    title: "提示",
    message: "确认清除所有工具数据吗？",
    width: "250px",
  }).then(() => {
    tools.value = [];
    deletedTools.value = [];
    toolStorage.remove();
    recycleStorage.remove();
    settingsPopup.value = false;
    showToast("数据已重置");
  }).catch(() => {});
}


function getToolInitial(name: string) {
  return name.trim().slice(0, 1) || "工";
}

function normalizeUrl(value: string) {
  if (!value) return "";
  if (/^(https?:|mailto:|tel:|\/|\.\/|\.\.\/|#)/i.test(value)) return value;
  return `https://${value}`;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateScrollTopVisibility() {
  showScrollTop.value = window.scrollY > SCROLL_TOP_THRESHOLD;
}

init();

onMounted(() => {
  updateScrollTopVisibility();
  window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateScrollTopVisibility);
  resetDragState();
});
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  padding: 12px;
  background: var(--page-bg);
  color: var(--text-main);
}

.home-page,
.home-page * {
  box-sizing: border-box;
}

.tools-view {
  width: min(100%, 780px);
  margin: 0 auto;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: -12px -12px 18px;
  padding: 18px max(18px, calc((100vw - 780px) / 2 + 18px)) 16px;
  background: color-mix(in srgb, var(--surface) 86%, transparent);
  box-shadow: var(--header-shadow);
  backdrop-filter: blur(12px);
}

.hero-tag {
  margin: 0 0 4px;
  color: var(--text-muted);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 0;
  color: var(--text-strong);
  font-size: 34px;
  line-height: 1.08;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: var(--header-icon-bg);
  color: var(--accent);
  font-size: 18px;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px 18px;
  padding: 10px 10px 120px;
  overflow: visible;
}

.tool-cell {
  position: relative;
  display: grid;
  justify-items: center;
  min-width: 0;
  z-index: 1;
}

.tool-cell:has(.inline-action-menu),
.tool-cell.dragging {
  z-index: 45;
}

.tool-cell.dragging .tool-item {
  opacity: 0.72;
}

.tool-cell:nth-child(4n + 1) .inline-action-menu {
  left: 0;
  transform-origin: 32px top;
  transform: translateX(0);
}

.tool-cell:nth-child(4n) .inline-action-menu {
  right: 0;
  left: auto;
  transform-origin: calc(100% - 32px) top;
  transform: translateX(0);
}

.tool-cell:has(.inline-action-menu) .app-icon {
  box-shadow: 0 14px 34px rgba(31, 107, 123, 0.14);
}

.tool-item {
  display: grid;
  justify-items: center;
  gap: 10px;
  min-width: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--text-main);
  text-align: center;
  text-decoration: none;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.app-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 28% 22%, rgba(255, 255, 255, 0.95), transparent 34%),
    linear-gradient(145deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 10px 26px rgba(38, 56, 88, 0.09);
  overflow: hidden;
}

.letter-icon {
  color: var(--accent-strong);
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.08em;
}

.tool-cell:nth-child(3n + 1) .letter-icon {
  color: #d85d69;
}

.tool-cell:nth-child(3n + 2) .letter-icon {
  color: var(--accent-strong);
}

.tool-cell:nth-child(3n) .letter-icon {
  color: #61752d;
}

.plus-icon {
  color: #0b64e8;
  font-size: 34px;
}

.tool-name {
  display: block;
  max-width: 82px;
  color: #62666d;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.18;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 34px 12px;
  text-align: center;
}

.empty-state.compact {
  padding: 22px 12px;
}

.empty-state strong {
  color: var(--text-strong);
}

.empty-state span {
  color: var(--text-muted);
  font-size: 12px;
}

.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 35;
  border: 0;
  background: transparent;
}

.inline-action-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  z-index: 46;
  width: 150px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.94)),
    radial-gradient(circle at 18% 0%, rgba(31, 107, 123, 0.12), transparent 46%);
  box-shadow:
    0 20px 48px rgba(30, 42, 54, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  overflow: hidden;
  transform: translateX(-50%);
  transform-origin: center top;
}

.inline-action-menu::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 50%;
  width: 14px;
  height: 14px;
  border-radius: 4px 0 0 0;
  background: rgba(255, 255, 255, 0.98);
  transform: translateX(-50%) rotate(45deg);
  box-shadow: -1px -1px 0 rgba(255, 255, 255, 0.8);
}

.tool-cell:nth-child(4n + 1) .inline-action-menu::before {
  left: 32px;
}

.tool-cell:nth-child(4n) .inline-action-menu::before {
  right: 32px;
  left: auto;
}

.inline-action-menu button {
  position: relative;
  display: block;
  width: 100%;
  height: 46px;
  border: 0;
  border-bottom: 1px solid rgba(30, 42, 54, 0.08);
  background: transparent;
  color: #17191d;
  font-size: 17px;
  font-weight: 850;
  letter-spacing: 0.02em;
  text-align: center;
}

.inline-action-menu button:active {
  background: rgba(31, 107, 123, 0.08);
}

.inline-action-menu button:last-child {
  color: #d05f52;
}

.inline-action-menu button:last-child {
  border-bottom: 0;
}

.home-page :deep(.van-popup) {
  background: var(--surface);
  color: var(--text-main);
}

.home-page :deep(.edit-popup) {
  width: min(80vw, 320px);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(38, 56, 88, 0.16);
  overflow: hidden;
}

.simple-editor {
  padding: 18px 18px 14px;
}

.simple-input {
  display: block;
  width: 100%;
  height: 42px;
  border: 0;
  border-bottom: 1px solid var(--divider);
  outline: 0;
  color: var(--text-main);
  background: transparent;
  padding: 0 2px;
  font-size: 15px;
  font-weight: 650;
}

.simple-input + .simple-input {
  margin-top: 4px;
}

.simple-input::placeholder {
  color: var(--text-muted);
  opacity: 0.7;
}

.simple-input:focus {
  border-bottom-color: var(--accent);
}

.simple-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 16px;
}

.simple-actions button {
  height: 36px;
  border: 0;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
}

.cancel-btn {
  color: var(--text-main);
  background: var(--header-icon-bg);
}

.confirm-btn {
  color: #ffffff;
  background: var(--submit-btn-bg);
  box-shadow: none;
}

.recycle-popup {
  max-height: 78vh;
  overflow-y: auto;
}

.popup-head p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.recycle-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.recycle-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  background: var(--surface-soft);
}

.recycle-item strong,
.recycle-item span {
  display: block;
}

.recycle-item strong {
  color: var(--text-strong);
}

.recycle-item span {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recycle-actions {
  display: flex;
  gap: 8px;
}

.recycle-actions button {
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: var(--header-icon-bg);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
}

.recycle-actions button.danger {
  background: var(--danger-bg);
  color: var(--danger-text);
}


@media (max-width: 520px) {
  .home-page {
    padding: 10px;
  }

  .page-header {
    margin: -10px -10px 18px;
    padding: 18px 24px 16px;
  }

  .page-header h1 {
    font-size: 30px;
  }

  .tool-grid {
    gap: 30px 12px;
    padding: 10px 8px 120px;
  }

  .recycle-item {
    grid-template-columns: 1fr;
  }

  .recycle-actions {
    justify-content: flex-end;
  }

  .inline-action-menu {
    width: 132px;
  }

  .app-icon {
    width: 58px;
    height: 58px;
    border-radius: 16px;
  }

  .letter-icon {
    font-size: 28px;
  }

  .tool-name {
    max-width: 76px;
    font-size: 15px;
  }
}
</style>
