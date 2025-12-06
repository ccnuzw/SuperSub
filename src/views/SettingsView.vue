<template>
  <ModernPageLayout
    title="系统设置"
    subtitle="管理您的应用配置和偏好设置"
    :breadcrumb="[
      { label: 'SuperSub', href: '#' },
      { label: '设置', active: true }
    ]"
    max-width="100%"
    padding="0"
  >
    <ModernContentCard
      title="设置"
      subtitle="配置系统参数和转换规则"
      :show-top-line="true"
      variant="elevated"
      padding="lg"
    >
      <n-tabs
        type="line"
        animated
        size="large"
      >
        <n-tab-pane name="general" tab="通用设置">
          <GeneralSettings />
        </n-tab-pane>
        <n-tab-pane name="conversion" tab="订阅转换">
          <ConversionSettings />
        </n-tab-pane>
      </n-tabs>
    </ModernContentCard>
  </ModernPageLayout>
</template>

<script setup lang="ts">
import { NTabs, NTabPane } from 'naive-ui';
import ModernPageLayout from '@/components/layout/ModernPageLayout.vue';
import ModernContentCard from '@/components/layout/ModernContentCard.vue';
import GeneralSettings from '@/components/settings/GeneralSettings.vue';
import ConversionSettings from '@/components/settings/ConversionSettings.vue';
</script>

<style scoped>
/* 设置页面全屏宽度优化 */
:deep(.modern-page-content) {
  max-width: 100% !important;
  width: 100% !important;
  padding: var(--spacing-lg) !important;
}

:deep(.modern-page-main) {
  max-width: 100% !important;
  width: 100% !important;
}

/* ModernContentCard 也应该占满宽度 */
:deep(.modern-content-card) {
  max-width: none;
  width: 100%;
}
</style>