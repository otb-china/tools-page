<template>
  <button class="stat-card" :class="variant" type="button" @click="$emit('click')">
    <span class="stat-title">{{ title }}</span>
    <strong>{{ value }}</strong>
    <small :class="{ 'stat-empty-footer': !footer }">{{ footer || "占位" }}</small>
  </button>
</template>

<script lang="ts" setup>
defineProps<{
  title: string;
  value: string | number;
  footer?: string;
  variant: "income" | "materials" | "goods";
}>();

defineEmits<{
  click: [];
}>();
</script>

<style lang="scss" scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
  min-height: 92px;
  padding: 10px;
  border: 0;
  border-radius: 10px;
  color: #ffffff;
  text-align: left;
  line-height: 1.2;
  -webkit-tap-highlight-color: transparent;
  transition: none;
}

.stat-card:active,
.stat-card:focus,
.stat-card:focus-visible {
  outline: none;
}

.stat-card.income {
  background: var(--stat-income-bg, linear-gradient(135deg, #0f766e 0%, #22a06b 100%));
  color: var(--stat-income-text, #ffffff);
  box-shadow: var(--stat-income-shadow, inset 0 1px 0 rgba(255, 255, 255, 0.18));
}

.stat-card.materials {
  background: var(--stat-materials-bg, linear-gradient(135deg, #eef5f4 0%, #e2eceb 100%));
  color: var(--stat-materials-text, #26535a);
  box-shadow: var(--stat-light-shadow, inset 0 1px 0 rgba(255, 255, 255, 0.78));
}

.stat-card.goods {
  background: var(--stat-goods-bg, linear-gradient(135deg, #f2f7ed 0%, #e5efd9 100%));
  color: var(--stat-goods-text, #526b1f);
  box-shadow: var(--stat-light-shadow, inset 0 1px 0 rgba(255, 255, 255, 0.72));
}

.stat-card.income:active,
.stat-card.income:focus,
.stat-card.income:focus-visible {
  background: var(--stat-income-bg, linear-gradient(135deg, #0f766e 0%, #22a06b 100%));
  color: var(--stat-income-text, #ffffff);
}

.stat-card.materials:active,
.stat-card.materials:focus,
.stat-card.materials:focus-visible {
  background: var(--stat-materials-bg, linear-gradient(135deg, #eef5f4 0%, #e2eceb 100%));
  color: var(--stat-materials-text, #26535a);
}

.stat-card.goods:active,
.stat-card.goods:focus,
.stat-card.goods:focus-visible {
  background: var(--stat-goods-bg, linear-gradient(135deg, #f2f7ed 0%, #e5efd9 100%));
  color: var(--stat-goods-text, #526b1f);
}

.stat-title,
.stat-card strong,
.stat-card small {
  display: block;
}

.stat-title {
  margin-bottom: 8px;
  font-size: 12px;
  opacity: 0.82;
}

.stat-card strong {
  margin-top: 6px;
  font-size: 24px;
  line-height: 1;
}

.stat-card small {
  margin-top: 8px;
  font-size: 12px;
  text-align: right;
  opacity: 0.82;
}

.stat-empty-footer {
  visibility: hidden;
}
</style>
