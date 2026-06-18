<template>
  <van-popup v-model:show="popupShow" position="bottom" destroy-on-close round>
    <div class="popup-body import-export-popup">
      <div class="popup-head">
        <div>
          <p class="section-tag">Data</p>
          <h3>导入总数据</h3>
          <p>选择导出的备份文件，会覆盖当前全部工具。</p>
        </div>
      </div>

      <div v-if="hasOverwriteData" class="import-export-card">
        <div>
          <strong>当前数据</strong>
          <span>{{ summary }}</span>
        </div>
      </div>

      <input
        ref="fileInput"
        class="file-input"
        type="file"
        accept="application/json,.json"
        @change="onFileChange"
      />

      <button class="file-upload-card" type="button" @click="selectFile">
        <span class="settings-item-icon">
          <el-icon><Upload /></el-icon>
        </span>
        <span>
          <strong>{{ fileName || "选择备份文件" }}</strong>
          <em>{{ hasFile ? "文件已读取，点击下方按钮导入" : "支持导出的 .json 备份文件" }}</em>
        </span>
      </button>

      <el-button
        type="primary"
        size="large"
        class="submit-button"
        :disabled="!hasFile"
        @click="emit('import')"
      >
        导入总数据
      </el-button>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { Upload } from "@element-plus/icons-vue";

const props = defineProps<{
  show: boolean;
  hasOverwriteData: boolean;
  summary: string;
  fileName: string;
  hasFile: boolean;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "file-loaded": [payload: { dataStr: string; fileName: string }];
  "file-error": [message: string];
  import: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

const selectFile = () => {
  fileInput.value?.click();
};

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  const isJsonFile = file.type === "application/json" || file.name.toLowerCase().endsWith(".json");
  if (!isJsonFile) {
    input.value = "";
    emit("file-error", "请选择 JSON 备份文件");
    return;
  }

  try {
    const dataStr = await file.text();
    emit("file-loaded", { dataStr, fileName: file.name });
  } catch {
    input.value = "";
    emit("file-error", "文件读取失败");
  }
};
</script>

<style lang="scss" scoped>
.section-tag {
  margin: 0 0 4px;
  color: var(--text-muted);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.file-input {
  display: none;
}

.file-upload-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 14px;
  padding: 14px;
  border: 1px dashed var(--divider);
  border-radius: 12px;
  background: var(--surface-soft);
  text-align: left;
}

.file-upload-card > span:last-child {
  min-width: 0;
}

.file-upload-card strong,
.file-upload-card em {
  display: block;
}

.file-upload-card strong {
  color: var(--text-main);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-upload-card em {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-style: normal;
  line-height: 1.35;
}

.import-export-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 14px 0 12px;
  padding: 14px;
  border-radius: 10px;
  background: var(--stat-income-bg);
  color: #ffffff;
}

.import-export-card strong,
.import-export-card span {
  display: block;
}

.import-export-card strong {
  font-size: 16px;
}

.import-export-card span {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.8;
}

</style>
