/**
 * 订阅分组标签组件
 */

<template>
  <div class="subscription-group-tabs">
    <n-tabs
      :value="activeTab"
      type="line"
      :bar-width="40"
      @update:value="$emit('update:active-tab', $event)"
    >
      <n-tab-pane name="all" tab="全部订阅">
        <template #tab>
          <n-space align="center">
            <span>全部订阅</span>
            <n-tag size="small" type="info" :bordered="false">
              {{ totalCount }}
            </n-tag>
          </n-space>
        </template>
      </n-tab-pane>

      <n-tab-pane
        v-for="group in groups"
        :key="group.id"
        :name="group.id"
      >
        <template #tab>
          <div
            class="group-tab"
            @click="$emit('group-click', group, $event)"
            @contextmenu="$emit('group-context-menu', group, $event)"
          >
            <n-space align="center">
              <n-icon v-if="group.icon" :color="group.color">
                <component :is="group.icon" />
              </n-icon>
              <span>{{ group.name }}</span>
              <n-tag
                size="small"
                :type="group.subscription_count === 0 ? 'default' : 'primary'"
                :bordered="false"
              >
                {{ group.subscription_count }}
              </n-tag>
            </n-space>
          </div>
        </template>
      </n-tab-pane>

      <template #suffix>
        <n-button
          text
          size="small"
          @click="$emit('add-group')"
          :loading="loading"
        >
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          新建分组
        </n-button>
      </template>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTabs, NTabPane, NSpace, NTag, NButton, NIcon } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'

interface IProps {
  activeTab: string
  groups: Array<{
    id: string
    name: string
    subscription_count: number
    icon?: any
    color?: string
  }>
  loading?: boolean
  totalCount?: number
}

const props = withDefaults(defineProps<IProps>(), {
  groups: () => [],
  loading: false,
  totalCount: 0
})

defineEmits<{
  'update:active-tab': [tab: string]
  'group-click': [group: any, event: MouseEvent]
  'group-context-menu': [group: any, event: MouseEvent]
  'add-group': []
}>()
</script>

<style scoped>
.subscription-group-tabs {
  @apply bg-white rounded-lg shadow-sm;
}

.group-tab {
  @apply cursor-pointer px-2 py-1 rounded hover:bg-gray-50 transition-colors;
}

.group-tab:hover {
  @apply bg-gray-100;
}

/* 深色模式 */
.dark .subscription-group-tabs {
  @apply bg-gray-800;
}

.dark .group-tab:hover {
  @apply bg-gray-700;
}
</style>