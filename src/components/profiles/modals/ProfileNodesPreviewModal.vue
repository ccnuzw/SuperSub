<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { NModal, NSpin, NGrid, NGi, NCard, NButton, NIcon, NStatistic, NSpace, NTag, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { DocumentTextOutline as LogIcon } from '@vicons/ionicons5'
import type { Node, LogEntry } from '@/types'
import { getNaiveTagColor } from '@/utils/colors'
import { regenerateLink, type ParsedNode } from '@/utils/nodeParser'
import { useMessage } from 'naive-ui'

const props = defineProps<{
    show: boolean
    loading: boolean
    profileName?: string
    data: {
        nodes: Partial<Node>[];
        analysis: {
            total: number;
            protocols: Record<string, number>;
            regions: Record<string, number>;
        };
        mode: 'local' | 'remote';
        logs: LogEntry[];
    } | null
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'view-logs'): void
}>()

const message = useMessage()

const nodes = computed(() => props.data?.nodes || [])

const previewNodeColumns: DataTableColumns<Partial<Node>> = [
  { title: '节点名称', key: 'name', width: 300, ellipsis: { tooltip: true } },
  {
    title: '类型',
    key: 'type',
    width: 100,
    align: 'center',
    render(row) {
        const protocol = row.protocol || row.type || 'N/A';
        return h(NTag, {
            size: 'small',
            round: true,
            color: getNaiveTagColor(protocol, 'protocol')
        }, { default: () => protocol.toUpperCase() });
    }
  },
  { title: '服务器', key: 'server', width: 200, ellipsis: { tooltip: true } },
  { title: '端口', key: 'port', width: 80, align: 'center' },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    align: 'center',
    render(row) {
      return h(NButton, {
        size: 'tiny',
        ghost: true,
        type: 'primary',
        onClick: () => {
          // The row object from preview is a ParsedNode.
          const link = regenerateLink(row as ParsedNode);
          if (link) {
            navigator.clipboard.writeText(link);
            message.success('已复制完整链接');
          } else {
            message.error('无法生成链接');
          }
        }
      }, { default: () => '复制链接' });
    }
  }
];
</script>

<template>
    <n-modal
        :show="show"
        @update:show="(val) => emit('update:show', val)"
        preset="card"
        :title="`节点预览 - ${profileName || '未知'}`"
        :style="{ width: '1200px', maxWidth: '95vw' }"
        :mask-closable="true"
        :trap-focus="false"
    >
      <n-spin :show="loading">
        <div v-if="data">
          <n-grid :cols="1">
            <n-gi>
              <n-card title="订阅分析" :bordered="false">
                <template #header-extra>
                  <n-button v-if="data.logs && data.logs.length > 0" text @click="emit('view-logs')">
                    <template #icon>
                      <n-icon><LogIcon /></n-icon>
                    </template>
                    查看日志
                  </n-button>
                </template>
                <n-grid :cols="3" :x-gap="12">
                  <n-gi><n-statistic label="节点总数" :value="data.analysis.total" /></n-gi>
                  <n-gi>
                    <n-statistic label="协议分布">
                      <n-space>
                      <n-tag v-for="(count, protocol) in data.analysis.protocols" :key="protocol" :color="getNaiveTagColor(protocol, 'protocol')" round>{{ protocol.toUpperCase() }}: {{ count }}</n-tag>
                      </n-space>
                    </n-statistic>
                  </n-gi>
                  <n-gi>
                    <n-statistic label="地区分布">
                      <n-space :size="'small'" style="flex-wrap: wrap;">
                        <n-tag v-for="(count, region) in data.analysis.regions" :key="region" :color="getNaiveTagColor(region, 'region')" round>{{ region }}: {{ count }}</n-tag>
                      </n-space>
                    </n-statistic>
                  </n-gi>
                </n-grid>
              </n-card>
              <n-data-table :columns="previewNodeColumns" :data="nodes" :pagination="{ pageSize: 10 }" :max-height="400" class="mt-4" />
            </n-gi>
          </n-grid>
        </div>
        <div v-else-if="!loading" style="text-align: center; padding: 20px;">没有获取到节点数据。</div>
      </n-spin>
    </n-modal>
</template>
