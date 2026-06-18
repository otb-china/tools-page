<template>
  <div class="home-page" :style="themeStyle">
    <header ref="headerSection" class="page-header">
      <div>
        <p class="hero-tag">Tools Page</p>
        <h1>工具页</h1>
      </div>
      <button v-if="showScrollTop" class="header-icon" type="button" @click="scrollToTop">
        <el-icon><Top /></el-icon>
      </button>
    </header>

    <main class="tools-view">
      <section class="tool-grid" aria-label="工具列表">
        <div v-for="tool in tools" :key="tool.id" class="tool-cell">
          <a
            class="tool-item"
            :class="{ pressed: pressedToolId === tool.id }"
            :href="tool.url"
            @contextmenu.prevent
            @pointerdown="startLongPress(tool)"
            @pointerup="cancelLongPress"
            @pointercancel="cancelLongPress"
            @pointerleave="cancelLongPress"
            @click="handleToolClick"
          >
            <span class="app-icon">
              <img src="@/assets/logo.png" alt="" />
            </span>
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
        <h3>{{ editingToolId ? "编辑" : "添加" }}</h3>
        <input v-model.trim="toolForm.name" class="simple-input" placeholder="名称" />
        <input v-model.trim="toolForm.url" class="simple-input" inputmode="url" placeholder="链接" />
        <div class="simple-actions">
          <button type="button" @click="editorPopup = false">取消</button>
          <button type="submit">确定</button>
        </div>
      </form>
    </van-popup>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { showToast } from "vant";
import { Plus, Top } from "@element-plus/icons-vue";
import { DEFAULT_THEME, isThemeKey, themeOptions } from "@/config/themes";
import { LStorage } from "@/utils/localStorage.ts";
import type { ThemeKey } from "@/config/themes";
import type { ToolItem } from "@/types/tool";

const LONG_PRESS_MS = 520;
const SCROLL_TOP_THRESHOLD = 240;

const defaultTools: ToolItem[] = [
  createTool("备料", "../stock-statistics/#/"),
  createTool("本地账单", "../local-bill/#/"),
  createTool("会员账单", "../vip-bill/#/"),
];

const headerSection = ref<HTMLElement | null>(null);
const showScrollTop = ref(false);
const currentTheme = ref<ThemeKey>(DEFAULT_THEME);
const tools = ref<ToolItem[]>([]);
const editorPopup = ref(false);
const editingToolId = ref("");
const actionToolId = ref("");
const pressedToolId = ref("");
const suppressNextClick = ref(false);
const longPressTimer = ref<number | undefined>();
const toolForm = reactive({ name: "", url: "" });

const toolStorage = LStorage.new("toolsPageData");
const themeStorage = LStorage.new("toolsPageTheme");

const currentThemeOption = computed(() => {
  return themeOptions.find((theme) => theme.key === currentTheme.value) || themeOptions[0];
});
const themeStyle = computed(() => currentThemeOption.value.variables);
const actionTool = computed(() => tools.value.find((tool) => tool.id === actionToolId.value));

watch(tools, saveTools, { deep: true });

function init() {
  const storedTheme = themeStorage.getter();
  currentTheme.value = isThemeKey(storedTheme) ? storedTheme : DEFAULT_THEME;
  tools.value = normalizeTools(toolStorage.getter());
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

function saveTools() {
  if (tools.value.length) {
    toolStorage.setter(tools.value);
  } else {
    toolStorage.remove();
  }
}

function startLongPress(tool: ToolItem) {
  suppressNextClick.value = false;
  pressedToolId.value = "";
  cancelLongPress();
  longPressTimer.value = window.setTimeout(() => {
    suppressNextClick.value = true;
    pressedToolId.value = tool.id;
    actionToolId.value = tool.id;
    window.setTimeout(() => {
      pressedToolId.value = "";
    }, 240);
  }, LONG_PRESS_MS);
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
  const name = actionTool.value.name;
  tools.value = tools.value.filter((tool) => tool.id !== actionToolId.value);
  closeActionMenu();
  showToast(`已移除「${name}」`);
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
  cancelLongPress();
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
  gap: 22px 18px;
  padding: 10px 4px 24px;
}

.tool-cell {
  position: relative;
  display: grid;
  justify-items: center;
  min-width: 0;
  z-index: 1;
}

.tool-cell:has(.inline-action-menu) {
  z-index: 45;
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
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.tool-item.pressed {
  transform: scale(0.94);
}

.app-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 10px 26px rgba(38, 56, 88, 0.09);
}

.app-icon img {
  width: 42px;
  height: 42px;
  object-fit: contain;
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
  top: calc(100% + 8px);
  left: 50%;
  z-index: 46;
  width: 138px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 38px rgba(30, 42, 54, 0.16);
  overflow: hidden;
  transform: translateX(-50%);
}

.inline-action-menu button {
  display: block;
  width: 100%;
  height: 44px;
  border: 0;
  border-bottom: 1px solid rgba(30, 42, 54, 0.1);
  background: transparent;
  color: #17191d;
  font-size: 17px;
  font-weight: 800;
  text-align: center;
}

.inline-action-menu button:last-child {
  border-bottom: 0;
}

.home-page :deep(.edit-popup) {
  width: min(92vw, 420px);
  background: #ffffff;
}

.simple-editor {
  padding: 22px 28px 10px;
}

.simple-editor h3 {
  margin: 0 0 22px;
  color: #111318;
  font-size: 24px;
  font-weight: 900;
  text-align: center;
}

.simple-input {
  display: block;
  width: 100%;
  height: 68px;
  border: 0;
  border-bottom: 1px solid rgba(28, 31, 36, 0.16);
  border-radius: 0;
  outline: 0;
  color: #1c1f24;
  background: transparent;
  font-size: 20px;
}

.simple-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 28px -28px 0;
  border-top: 1px solid rgba(28, 31, 36, 0.16);
}

.simple-actions button {
  height: 58px;
  border: 0;
  background: transparent;
  color: #0b64e8;
  font-size: 19px;
  font-weight: 800;
}

.simple-actions button + button {
  border-left: 1px solid rgba(28, 31, 36, 0.16);
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
    gap: 22px 12px;
    padding-inline: 0;
  }

  .app-icon {
    width: 58px;
    height: 58px;
    border-radius: 16px;
  }

  .app-icon img {
    width: 38px;
    height: 38px;
  }

  .tool-name {
    max-width: 76px;
    font-size: 15px;
  }
}
</style>
