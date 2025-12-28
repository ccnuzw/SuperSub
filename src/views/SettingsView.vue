<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">系统设置</h1>
      <p class="text-slate-500 dark:text-slate-400 mt-1">管理您的应用程序首选项和配置。</p>
    </div>

    <Card padding="none" class="overflow-hidden">
      <n-tabs 
        type="line" 
        animated
        pane-class="p-0"
        tab-style="padding: 16px 24px;"
      >
        <n-tab-pane name="security" tab="账户安全">
          <SecuritySettings />
        </n-tab-pane>
        <n-tab-pane name="notifications" tab="消息通知">
          <NotificationSettings />
        </n-tab-pane>
        <n-tab-pane name="conversion" tab="订阅转换">
          <ConversionSettings />
        </n-tab-pane>
      </n-tabs>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { NTabs, NTabPane } from 'naive-ui';
import Card from '@/components/ui/Card.vue';
import SecuritySettings from '@/components/settings/SecuritySettings.vue';
import NotificationSettings from '@/components/settings/NotificationSettings.vue';
import ConversionSettings from '@/components/settings/ConversionSettings.vue';
</script>