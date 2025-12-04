<template>
  <div class="subscriptions-modern-layout">
    <!-- 标题和操作按钮区域 -->
    <div class="header-main">
      <div class="header-left">
        <div class="page-info">
          <h1 class="page-title">订阅管理</h1>
          <div class="page-breadcrumb">
            <span class="breadcrumb-item">代理</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item active">订阅</span>
          </div>
        </div>
      </div>

      <div class="header-right">
        <!-- 内联统计徽章 -->
        <div class="inline-stats-inline">
          <div
            v-for="stat in subscriptionStatsCards"
            :key="stat.key"
            class="stat-badge-inline"
            :class="`stat-badge--${stat.type}`"
            @click="() => stat.onClick && stat.onClick(stat, 0)"
          >
            <n-icon :component="stat.icon" :size="14" />
            <span class="stat-badge-value">{{ stat.value }}{{ stat.unit || '' }}</span>
            <span class="stat-badge-label">{{ stat.label }}</span>
          </div>
        </div>

        <!-- 主要操作按钮 -->
        <n-space>
          <n-button type="primary" size="medium" @click="openModal()">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            新增订阅
          </n-button>

          <!-- 更多操作下拉菜单 -->
          <SmartHeaderActions
            ref="headerActionsRef"
            :items="headerSmartActions"
            @select="(key: string, item: any, event: MouseEvent) => handleHeaderAction(key)"
            placement="bottom-right"
            button-type="default"
            :ghost="false"
            size="medium"
          />
        </n-space>
      </div>
    </div>

  
    <!-- 主要内容区域 -->
    <div class="layout-content">
      <div class="content-container">
        <div class="content-main">
          <!-- 分组标签 - 紧凑型支持滚动 -->
          <div class="group-tabs-section">
            <n-tabs type="segment" class="compact-tabs" v-model:value="activeTab">
              <n-tab-pane name="all" :tab="`全部 (${stats.totalSubscriptions.value})`" />
              <n-tab-pane name="ungrouped" :tab="`未分组 (${stats.ungroupedCount.value})`" />
              <n-tab-pane
                v-for="group in subscriptionGroupStore.groups"
                :key="group.id"
                :name="group.id"
              >
                <template #tab>
                  <div class="group-tab-wrapper-compact">
                    <span class="group-name-text" :style="{ color: group.is_enabled ? '' : '#999' }">
                      {{ group.name }}
                    </span>
                    <span class="group-count-text">({{ getGroupCount(group.id) }})</span>
                    <n-dropdown
                      trigger="click"
                      placement="bottom-start"
                      :options="getDropdownOptions(group)"
                      @select="(key) => handleGroupOperation(key, group)"
                    >
                      <n-button text class="group-actions-button-compact">
                        <n-icon :component="MoreIcon" :size="12" />
                      </n-button>
                    </n-dropdown>
                  </div>
                </template>
              </n-tab-pane>
            </n-tabs>
          </div>

          <!-- 数据表格 -->
          <div class="table-section">
            <n-data-table
              :columns="columns"
              :data="filteredSubscriptions"
              :loading="loading"
              :pagination="{ pageSize: 10 }"
              :bordered="false"
              v-model:checked-row-keys="checkedRowKeys"
              :row-key="(row) => row.id"
              :scroll-x="1800"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑订阅模态框 -->
    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="dialog"
      :title="modalTitle"
      :positive-button-props="{ loading: saveLoading }"
      positive-text="保存"
      negative-text="取消"
      @positive-click="handleSave"
      @negative-click="closeModal"
    >
      <n-form>
        <n-form-item label="名称" required>
          <n-input v-model:value="formState.name" placeholder="为订阅起个名字" />
        </n-form-item>
        <n-form-item label="URL" required>
          <n-input v-model:value="formState.url" placeholder="输入订阅链接" />
        </n-form-item>
      </n-form>
    </n-modal>

  
    <!-- 订阅预览模态框 -->
    <n-modal
      v-model:show="showPreviewModal"
      :mask-closable="false"
      preset="card"
      title="订阅节点预览"
      style="width: 800px; max-height: 80vh;"
      :content-style="{ maxHeight: '60vh', overflow: 'auto' }"
    >
      <n-space v-if="currentPreviewSubscription" justify="space-between" class="mb-4" align="center">
        <n-space align="center">
          <n-switch v-model:value="applyRules" />
          <label>应用处理规则</label>
          <n-tooltip trigger="hover">
            <template #trigger>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z"/></svg>
            </template>
            启用后，将加载并应用您在此订阅上配置的所有规则（如过滤、重命名等）。
          </n-tooltip>
        </n-space>
        <n-space>
          <n-select
            v-model:value="selectedGroupId"
            placeholder="导入到分组 (可选)"
            :options="nodeGroupOptions"
            clearable
            style="width: 200px;"
          />
          <n-button
            type="primary"
            @click="handleImportNodes"
            :loading="importLoading"
            :disabled="previewLoading || !previewData?.nodes || previewData.nodes.length === 0"
          >
            导入 {{ previewData?.nodes?.length || 0 }} 个节点
          </n-button>
        </n-space>
      </n-space>

      <div v-if="previewLoading">
        <n-skeleton :repeat="5" />
      </div>
      <div v-else-if="previewData && previewData.error">
        <n-result
          status="error"
          title="预览失败"
          :description="previewData.error"
        />
        <div class="text-center mt-4">
          <n-button size="small" @click="handlePreviewNodes(currentPreviewSubscription)">重试</n-button>
        </div>
      </div>
      <div v-else-if="previewData && previewData.nodes">
        <!-- Local Mode Preview -->
        <div v-if="previewData.mode === 'local'">
          <n-data-table
            :columns="[
              { title: '名称', key: 'name', ellipsis: { tooltip: true }, fixed: 'left', width: 200 },
              {
                  title: '类型',
                  key: 'protocol',
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
              { title: '服务器', key: 'server', ellipsis: { tooltip: true }, width: 180 },
              { title: '端口', key: 'port', width: 80, align: 'center' },
              {
                  title: '操作',
                  key: 'actions',
                  width: 100,
                  align: 'center',
                  fixed: 'right',
                  render(row) {
                      return h(NButton, {
                          size: 'tiny',
                          ghost: true,
                          type: 'primary',
                          onClick: () => handleCopyNodeLink(row)
                      }, { default: () => '复制链接' });
                  }
              }
            ]"
            :data="previewData.nodes"
            :pagination="{ pageSize: 10 }"
            :bordered="false"
            :max-height="400"
            :scroll-x="660"
          />
          <n-empty v-if="previewData.nodes.length === 0" description="订阅为空或无有效节点" class="py-8" />
        </div>
      </div>
      <div v-else>
        <n-empty description="点击预览按钮获取节点信息" class="py-8" />
      </div>
    </n-modal>

    <!-- 批量导入模态框 -->
    <n-modal
      v-model:show="showImportModal"
      preset="card"
      title="批量导入订阅"
      style="width: 600px;"
      :mask-closable="false"
    >
      <n-form
        ref="importFormRef"
        :model="importForm"
        :rules="importFormRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="订阅链接" path="urls">
          <n-input
            v-model:value="importForm.urls"
            type="textarea"
            placeholder="每行一个订阅链接，支持多个链接"
            :rows="6"
            :disabled="importLoading"
          />
        </n-form-item>

        <n-form-item label="目标分组" path="groupId">
          <n-select
            v-model:value="importForm.groupId"
            :options="groupOptions"
            placeholder="选择分组（可选）"
            clearable
            :disabled="importLoading"
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="handleImportCancel" :disabled="importLoading">取消</n-button>
          <n-button type="primary" @click="handleImport" :loading="importLoading">
            导入 ({{ importUrlCount }}个)
          </n-button>
        </n-space>
      </template>
    </n-modal>

    
    <!-- 移动到分组模态框 -->
    <n-modal
      v-model:show="showMoveToGroupModal"
      preset="card"
      title="移动到分组"
      style="width: 400px;"
    >
      <n-space vertical>
        <n-form-item label="选择目标分组">
          <n-select
            v-model:value="moveToGroupId"
            :options="[
              { label: '未分组', value: '' },
              ...subscriptionGroupStore.groups.map(g => ({ label: g.name, value: g.id }))
            ]"
            placeholder="请选择分组"
          />
        </n-form-item>
        <n-text type="info">
          将选中的 {{ checkedRowKeys.length }} 个订阅移动到指定分组
        </n-text>
      </n-space>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showMoveToGroupModal = false">取消</n-button>
          <n-button type="primary" @click="handleMoveToGroup" :loading="moveToGroupLoading">确定</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 批量替换模态框 -->
    <n-modal
      v-model:show="showBatchReplaceModal"
      preset="card"
      title="批量替换订阅链接"
      style="width: 600px;"
    >
      <n-space vertical>
        <n-form-item label="查找内容">
          <n-input
            v-model:value="batchReplaceData.find"
            placeholder="输入要查找的文本或正则表达式"
          />
        </n-form-item>
        <n-form-item label="替换为">
          <n-input
            v-model:value="batchReplaceData.replace"
            placeholder="输入替换后的文本"
          />
        </n-form-item>
        <n-text type="info">
          将对分组内的 {{ batchReplaceData.count }} 个订阅进行批量替换
        </n-text>
      </n-space>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showBatchReplaceModal = false">取消</n-button>
          <n-button type="primary" @click="handleBatchReplace" :loading="batchReplaceData.loading">确定替换</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 导出订阅模态框 -->
    <n-modal
      v-model:show="showExportModal"
      preset="card"
      title="导出订阅链接"
      style="width: 600px;"
    >
      <n-space vertical>
        <n-form-item label="分组名称">
          <n-text>{{ exportData.groupName }}</n-text>
        </n-form-item>
        <n-form-item label="订阅数量">
          <n-text>{{ exportData.count }} 个</n-text>
        </n-form-item>
        <n-form-item label="订阅链接">
          <n-input
            :value="exportData.urls"
            type="textarea"
            :rows="8"
            readonly
            placeholder="暂无订阅链接"
          />
        </n-form-item>
        <n-text type="info">
          订阅链接已准备就绪，您可以选择复制到剪贴板或下载为文件
        </n-text>
      </n-space>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showExportModal = false">关闭</n-button>
          <n-button type="default" @click="handleCopyExportUrls">复制到剪贴板</n-button>
          <n-button type="primary" @click="handleDownloadExport">下载文件</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 规则管理模态框 -->
    <n-modal
      v-model:show="showRulesModal"
      preset="card"
      :title="ruleModalTitle"
      style="width: 900px;"
      :mask-closable="false"
    >
      <n-space justify="end" class="mb-4">
        <n-button type="primary" @click="openRuleFormModal(null)">添加规则</n-button>
      </n-space>
      <n-data-table
        :columns="[
          { title: '名称', key: 'name', width: 150 },
          {
            title: '类型',
            key: 'type',
            width: 180,
            render(row) {
              const option = ruleTypeOptions.find(o => o.value === row.type)
              return option ? option.label : row.type
            }
          },
          { title: '规则值', key: 'value', ellipsis: { tooltip: true } },
          {
            title: '启用',
            key: 'enabled',
            width: 80,
            align: 'center',
            render(row) {
              return h(NSwitch, {
                value: row.enabled === 1,
                onUpdateValue: async (value) => {
                  const context = unref(currentRuleContext)
                  if (!context) return
                  const { type, entity } = context
                  const baseUrl = type === 'subscription' ? '/subscriptions' : '/subscription-groups'

                  row.enabled = value ? 1 : 0
                  try {
                    if (type === 'group') {
                      // 使用 subscriptionGroups store 来处理分组规则
                      const groupStore = useSubscriptionGroupStore()
                      await groupStore.updateGroupRule(entity.id, String(row.id), { enabled: value })
                    } else {
                      // 对于订阅规则，暂时保留原来的逻辑（但需要实现订阅规则的后端API）
                      await api.put(`${baseUrl}/${entity.id}/rules/${row.id}`, { enabled: value })
                    }
                    message.success('状态更新成功')
                  } catch (e) {
                    row.enabled = !value ? 1 : 0
                    message.error('状态更新失败')
                  }
                }
              })
            }
          },
          {
            title: '操作',
            key: 'actions',
            width: 150,
            render(row) {
              return h(NSpace, null, {
                default: () => [
                  h(NButton, { size: 'small', onClick: () => openRuleFormModal(row) }, { default: () => '编辑' }),
                  h(NButton, { size: 'small', type: 'error', ghost: true, onClick: () => handleDeleteRule(row) }, { default: () => '删除' }),
                ]
              })
            }
          }
        ]"
        :data="rules"
        :loading="rulesLoading"
        :bordered="false"
      />
    </n-modal>

    <!-- 规则表单模态框 -->
    <n-modal
      v-model:show="showRuleFormModal"
      :mask-closable="false"
      preset="dialog"
      :title="ruleFormTitle"
      positive-text="保存"
      negative-text="取消"
      :positive-button-props="{ loading: ruleSaveLoading }"
      @positive-click="handleSaveRule"
    >
      <n-form ref="ruleFormRef">
        <n-form-item label="规则名称" required>
          <n-input v-model:value="ruleFormState.name" placeholder="为规则起个名字" />
        </n-form-item>
        <n-form-item label="规则类型" required>
          <n-select v-model:value="ruleFormState.type" :options="ruleTypeOptions" />
        </n-form-item>

        <!-- 关键词类型规则 -->
        <n-form-item v-if="ruleFormState.type === 'filter_by_name_keyword' || ruleFormState.type === 'exclude_by_name_keyword'" label="关键词" required>
          <n-dynamic-tags v-model:value="ruleFormState.keywords" />
          <template #feedback>
            <span v-if="ruleFormState.type === 'filter_by_name_keyword'">保留节点名包含任意一个关键词的节点。输入后按回车确认。</span>
            <span v-else>排除节点名包含任意一个关键词的节点。输入后按回车确认。</span>
          </template>

          <div class="mt-2">
            <p class="text-xs text-gray-500 mb-1">常用标签 (点击添加):</p>
            <n-space :size="'small'" style="flex-wrap: wrap;">
              <n-tag
                v-for="keyword in commonKeywords"
                :key="keyword"
                size="small"
                :bordered="false"
                type="info"
                style="cursor: pointer;"
                @click="addKeyword(keyword)"
              >
                {{ keyword }}
              </n-tag>
            </n-space>
          </div>
        </n-form-item>

        <!-- 正则重命名规则 -->
        <n-form-item v-else-if="ruleFormState.type === 'rename_by_regex'" label="重命名规则" required>
          <n-space vertical style="width: 100%;">
            <n-input v-model:value="ruleFormState.renameRegex" placeholder="匹配规则 (Regex)" />
            <div class="text-xs text-gray-400 mt-1">
              <p>示例 1: 从 "[HK] Node 01" 提取 "HK" 和 "01", 可用 `^\[(.*)\]\s.*(\\d+)$`</p>
              <p>示例 2: 提取 "HK-专线-01" 中的 "HK" 和 "专线", 可用 `(HK)-(专线)`</p>
            </div>
            <n-input v-model:value="ruleFormState.renameFormat" placeholder="重命名格式" class="mt-2" />
            <div class="text-xs text-gray-400 mt-1">
              <p>用法: `$1`, `$2` 代表上方匹配规则中的第1、2个括号捕获的内容。</p>
              <p>示例 1: `NewName-$1-$2` 会得到 "NewName-HK-01"。</p>
              <p>示例 2: `[$2] $1` 会得到 "[专线] HK"。</p>
            </div>
          </n-space>
        </n-form-item>

        <!-- 正则过滤规则 -->
        <n-form-item v-else-if="ruleFormState.type === 'filter_by_name_regex'" label="正则表达式" required>
          <n-input
            v-model:value="ruleFormState.regex"
            placeholder="输入用于过滤的正则表达式"
          />
          <template #feedback>
            <p>保留节点名匹配正则表达式的节点。</p>
            <p><b>用法示例:</b></p>
            <ul class="list-disc list-inside">
              <li>匹配多个关键词 (香港或澳门): `香港|澳门`</li>
              <li>匹配IEPL且不含广州: `IEPL.*(?!广州)`</li>
              <li>不区分大小写匹配 "iepl": `(?i)iepl`</li>
              <li>匹配包含 "VIP" 但不包含 "过期" 的节点: `^(?=.*VIP)(?!.*过期)`</li>
            </ul>
          </template>
        </n-form-item>

        <!-- 通用JSON规则 -->
        <n-form-item v-else label="规则值 (JSON)" required>
          <n-input
            v-model:value="ruleFormState.value"
            type="textarea"
            placeholder='这是一个兼容旧版或未知规则类型的输入框'
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </n-form-item>

        <n-form-item label="启用">
          <n-switch v-model:value="ruleFormState.enabled" />
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 批量更新日志模态框 -->
    <n-modal
      v-model:show="showUpdateLogModal"
      preset="card"
      title="订阅更新"
      style="width: 600px;"
      :mask-closable="false"
    >
      <!-- 配置阶段 -->
      <div v-if="updateStage === 'config'">
        <n-form label-placement="left" label-width="auto">
          <n-form-item label="待更新订阅数">
            <n-statistic :value="subsToUpdate.length" />
          </n-form-item>
          <n-form-item label="并发数">
            <n-input-number v-model:value="updateSettings.concurrency" :min="1" :max="20" />
            <template #feedback>同时执行的网络请求数量。较高的值可以加快速度，但可能导致请求失败。</template>
          </n-form-item>
          <n-form-item label="失败重试次数">
            <n-input-number v-model:value="updateSettings.retries" :min="0" :max="5" />
            <template #feedback>每个订阅在更新失败后自动重试的次数。</template>
          </n-form-item>
          <n-form-item label="请求间隔 (ms)">
            <n-input-number v-model:value="updateSettings.delay" :min="0" :step="100" />
            <template #feedback>同一批次内，每个并发请求之间的间隔。有助于错开请求峰值。</template>
          </n-form-item>
          <n-form-item label="批次间隔 (ms)">
            <n-input-number v-model:value="updateSettings.batchDelay" :min="0" :step="100" />
            <template #feedback>每完成一个并发批次后，等待一段时间再开始下一个批次。</template>
          </n-form-item>
          <n-form-item label="到期天数阈值">
            <n-input-number v-model:value="updateSettings.expiringDaysThreshold" :min="0" :step="1" />
            <template #feedback>当剩余天数小于此值时，将归类为"即将到期"。</template>
          </n-form-item>
          <n-form-item label="到期流量阈值 (GB)">
            <n-input-number v-model:value="updateSettings.expiringTrafficThresholdGB" :min="0" :step="1" />
            <template #feedback>当剩余流量小于此值 (GB) 时，将归类为"即将到期"。</template>
          </n-form-item>
        </n-form>
      </div>

      <!-- 进度阶段 -->
      <div v-else>
        <div class="text-center mb-4">
          <n-progress
            type="line"
            :percentage="updateProgress.total > 0 ? Math.floor((updateProgress.current / updateProgress.total) * 100) : 0"
            :indicator-placement="'inside'"
            :processing="updateLogLoading"
          />
          <p class="mt-2">
            <span v-if="updateLogLoading">正在更新: {{ updateProgress.current }} / {{ updateProgress.total }}</span>
            <span v-else>更新完成: {{ updateProgress.current }} / {{ updateProgress.total }}</span>
          </p>
        </div>
        <n-collapse>
          <n-collapse-item :title="`更新成功 (${updateLog.success.length})`" name="success">
            <div style="max-height: 200px; overflow-y: auto;">
              <n-tag v-for="sub in updateLog.success" :key="sub.name" type="success" class="m-1">
                {{ sub.name }}
              </n-tag>
              <n-text v-if="updateLog.success.length === 0">没有订阅成功更新。</n-text>
            </div>
          </n-collapse-item>
          <n-collapse-item :title="`即将到期 (${updateLog.expiring.length})`" name="expiring">
            <div style="max-height: 200px; overflow-y: auto;">
              <div v-if="updateLog.expiring.length > 0">
                <div v-for="sub in updateLog.expiring" :key="sub.id" class="mb-2 p-2 border rounded border-yellow-500">
                  <div class="flex justify-between items-center">
                    <n-tag type="warning">{{ sub.name }}</n-tag>
                    <n-space :size="4">
                      <n-tag v-if="sub.remaining_traffic !== null && sub.remaining_traffic !== undefined" size="small" type="warning">
                        流量: {{ formatBytes(sub.remaining_traffic) }}
                      </n-tag>
                      <n-tag v-if="sub.remaining_days !== null && sub.remaining_days !== undefined" size="small" type="warning">
                        天数: {{ sub.remaining_days }} 天
                      </n-tag>
                    </n-space>
                  </div>
                </div>
              </div>
              <n-text v-else>没有即将到期的订阅。</n-text>
            </div>
          </n-collapse-item>
          <n-collapse-item :title="`更新失败 (${updateLog.failed.length})`" name="failed">
            <div style="max-height: 200px; overflow-y: auto;">
              <div v-if="updateLog.failed.length > 0">
                <div v-for="sub in updateLog.failed" :key="sub.id" class="mb-2 p-2 border rounded">
                  <div class="flex justify-between items-center">
                    <n-tag type="error">{{ sub.name }}</n-tag>
                    <n-space :size="4">
                      <n-tag v-if="sub.remaining_traffic !== null && sub.remaining_traffic !== undefined" size="small" :type="sub.remaining_traffic === 0 ? 'error' : 'default'">
                        流量: {{ formatBytes(sub.remaining_traffic) }}
                      </n-tag>
                      <n-tag v-if="sub.remaining_days !== null && sub.remaining_days !== undefined" size="small" :type="sub.remaining_days <= 0 ? 'error' : 'default'">
                        天数: {{ sub.remaining_days }} 天
                      </n-tag>
                    </n-space>
                  </div>
                  <n-text class="text-xs text-gray-500 mt-1 block">{{ sub.error }}</n-text>
                </div>
              </div>
              <n-text v-else>没有订阅更新失败。</n-text>
            </div>
          </n-collapse-item>
        </n-collapse>
      </div>

      <template #footer>
        <n-space justify="end">
          <div v-if="updateStage === 'config'">
            <n-button @click="showUpdateLogModal = false">取消</n-button>
            <n-button type="primary" @click="executeSubscriptionUpdates">开始更新</n-button>
          </div>
          <div v-else>
            <n-button @click="handleCancelUpdate">{{ updateLogLoading ? '中止' : '关闭' }}</n-button>
            <n-button
              type="primary"
              ghost
              @click="handleRetryFailed"
              :disabled="updateLog.failed.filter(s => s.error !== '已中止').length === 0 || updateLogLoading"
            >
              重试失败项
            </n-button>
            <n-button
              type="warning"
              ghost
              @click="handleClearExpiring"
              :disabled="updateLog.expiring.length === 0 || updateLogLoading"
            >
              清除即将到期
            </n-button>
            <n-button
              type="error"
              ghost
              @click="handleClearFailed"
              :disabled="updateLog.failed.filter(s => s.error !== '已中止').length === 0 || updateLogLoading"
            >
              清除失败项
            </n-button>
          </div>
        </n-space>
      </template>
    </n-modal>

    <!-- 分组管理组件 -->
    <GroupManagement
      v-model:show-sort-modal="showSortModal"
      v-model:show-add-group-modal="showAddGroupModal"
      v-model:show-edit-group-modal="showEditGroupModal"
      v-model:show-dropdown="showDropdown"
      v-model:dropdown-x="dropdownX"
      v-model:dropdown-y="dropdownY"
      v-model:active-dropdown-group="activeDropdownGroup"
      v-model:sortable-groups="sortableGroups"
      v-model:new-group-name="newGroupName"
      v-model:new-group-description="newGroupDescription"
      v-model:editing-group-name="editingGroupName"
      v-model:editing-group-description="editingGroupDescription"
      v-model:sort-loading="sortLoading"
      v-model:add-group-loading="addGroupLoading"
      v-model:edit-group-loading="editGroupLoading"
      @save-group="handleAddGroup"
      @update-group="handleEditGroup"
      @sort-save="handleSortSave"
      @group-action="handleGroupActionForKey"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, reactive, nextTick, watch, h, type Ref, unref } from 'vue'
import { formatBytes } from '@/utils/format'
import type { FormInst } from 'naive-ui'
import {
  NPageHeader,
  NSpace,
  NButton,
  NIcon,
  NDropdown,
  NGrid,
  NGi,
  NCard,
  NStatistic,
  NProgress,
  NTag,
  NTabs,
  NTabPane,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSkeleton,
  NResult,
  NEmpty,
  NText,
  NInputNumber,
  NSelect,
  NCollapse,
  NCollapseItem,
  NList,
  NListItem,
  NSwitch,
  NTooltip,
  NDynamicTags
} from 'naive-ui'
import {
  AddOutline,
  CheckmarkCircleOutline,
  WarningOutline,
  StatsChartOutline,
  EllipsisVertical as MoreIcon,
  CreateOutline,
  EyeOutline,
  FilterOutline,
  SyncOutline,
  TrashOutline,
  ReorderFourOutline,
  Server as SubscriptionIcon,
  DocumentText as DocumentIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@vicons/ionicons5'
import draggable from 'vuedraggable'

// 使用我们创建的composables
import { useSubscriptionManagement } from '@/composables/useSubscriptionManagement'
import { useSubscriptionStats } from '@/composables/useSubscriptionStats'
import { useSubscriptionGroups } from '@/composables/useSubscriptionGroups'
import { useSubscriptionGroupStore } from '@/stores/subscriptionGroups'
import { useGroupStore as useNodeGroupStore } from '@/stores/groups'
import { useMessage, useDialog } from 'naive-ui'
import { SubscriptionService } from '@/services/subscriptionService'
import { api } from '@/utils/api'
import type { Subscription, SubscriptionGroup, SubscriptionRule } from '@/types/entities'
import type { ApiResponse } from '@/types/common'
import { regenerateLink, type ParsedNode } from '@/utils/nodeParser'
import { getNaiveTagColor } from '@/utils/colors'
import GroupManagement from '@/components/subscription/GroupManagement.vue'

// 导入现代化组件
import SmartHeaderActions from '@/components/common/SmartHeaderActions.vue'

// 组合式的使用
const {
  subscriptions,
  loading,
  showModal,
  saveLoading,
  checkedRowKeys,
  formState,
  modalTitle,
  openModal,
  closeModal,
  handleSave,
  handleDelete,
  handleUpdate,
  handleBatchDelete,
  createColumns,
  fetchSubscriptions
} = useSubscriptionManagement()

const stats = useSubscriptionStats(subscriptions as any)

// 统计卡片数据
const subscriptionStatsCards = computed(() => [
  {
    key: 'all',
    label: '全部订阅',
    value: stats.totalSubscriptions.value,
    icon: SubscriptionIcon,
    type: 'primary' as const,
    tooltip: '点击查看全部订阅',
    onClick: () => {}
  },
  {
    key: 'active',
    label: '活跃订阅',
    value: stats.activeSubscriptions.value,
    icon: CheckmarkCircleOutline,
    type: 'success' as const,
    tooltip: '点击查看活跃订阅',
    onClick: () => {}
  },
  {
    key: 'failed',
    label: '失败订阅',
    value: stats.failedSubscriptions.value,
    icon: WarningOutline,
    type: 'warning' as const,
    tooltip: '点击查看失败订阅',
    onClick: () => {}
  },
  {
    key: 'success-rate',
    label: '成功率',
    value: stats.successRate.value,
    icon: StatsChartOutline,
    type: 'info' as const,
    unit: '%',
    precision: 1,
    tooltip: `成功率为 ${stats.successRate.value}%`,
    onClick: () => {}
  }
])

// 头部操作按钮 - SmartHeaderActions格式
const headerSmartActions = computed(() => [
  {
    key: 'add-group',
    label: '新增分组',
    description: '创建新的订阅分组',
    icon: AddOutline,
    type: 'primary' as const
  },
  {
    key: 'update-all',
    label: '更新全部',
    description: '更新所有订阅',
    icon: RefreshIcon,
    type: 'success' as const
  },
  {
    key: 'import',
    label: '批量导入',
    description: '从文件或链接批量导入订阅',
    icon: DownloadIcon,
    type: 'default' as const
  },
  {
    key: 'sort',
    label: '调整顺序',
    description: '调整订阅显示顺序',
    icon: SettingsIcon,
    type: 'default' as const
  },
  {
    key: 'clear-failed',
    label: '清除失败项',
    description: '清除所有失败的订阅',
    icon: TrashOutline,
    type: 'warning' as const
  },
  {
    type: 'divider' as const,
    key: 'divider-1'
  },
  {
    key: 'clear-all',
    label: '一键清除',
    description: '清除当前分组所有订阅',
    icon: TrashOutline,
    type: 'danger' as const
  }
])

// 处理统计卡片点击
const handleStatsCardClick = (stat: any, index: number) => {
  // 根据卡片类型切换视图或执行操作
  switch (stat.key) {
    case 'all':
      activeTab.value = 'all'
      break
    case 'active':
      // 可以添加筛选逻辑
      break
    case 'failed':
      // 可以添加筛选逻辑
      break
    case 'success-rate':
      // 可以显示详细信息
      break
  }
}

const {
  showAddGroupModal,
  showEditGroupModal,
  showSortModal,
  newGroupName,
  newGroupDescription,
  addGroupLoading,
  editingGroup,
  editingGroupName,
  editingGroupDescription,
  editGroupLoading,
  sortableGroups,
  sortLoading,
  activeDropdownGroup,
  handleAddGroup,
  handleEditGroup,
  handleDeleteGroup,
  handleToggleGroup,
  openSortModal,
  handleSortSave,
  handleGroupAction,
  getDropdownOptions
} = useSubscriptionGroups()

const subscriptionGroupStore = useSubscriptionGroupStore()
const nodeGroupStore = useNodeGroupStore()
const message = useMessage()
const dialog = useDialog()
const subscriptionService = new SubscriptionService()

// SmartHeaderActions组件引用
const headerActionsRef = ref<any>(null)

// 关闭折叠菜单的函数
const closeHeaderActionsDropdown = () => {
  if (headerActionsRef.value && headerActionsRef.value.forceClose) {
    headerActionsRef.value.forceClose()
  }
}

// 生命周期
const activeTab = ref('all')

// 预览相关状态
const showPreviewModal = ref(false)
const previewData = ref<any>(null)
const previewLoading = ref(false)
const applyRules = ref(true)
const selectedGroupId = ref<string | undefined>(undefined)
const importLoading = ref(false)
const currentPreviewSubscription = ref<any>(null)

// 规则管理相关状态
const showRulesModal = ref(false)
const showRuleFormModal = ref(false)
const rulesLoading = ref(false)
const ruleSaveLoading = ref(false)
const editingRule = ref<SubscriptionRule | null>(null)
const rules = ref<SubscriptionRule[]>([])
const ruleFormRef = ref<FormInst | null>(null)
const currentRuleContext: Ref<{
  type: 'subscription' | 'group'
  entity: Subscription | SubscriptionGroup
} | null> = ref<{
  type: 'subscription' | 'group'
  entity: Subscription | SubscriptionGroup
} | null>(null)

// Computed property to safely access current context
const safeCurrentRuleContext = computed(() => currentRuleContext.value)

// 批量更新相关状态
const showUpdateLogModal = ref(false)
const updateLog = ref<{
  success: { name: string }[]
  failed: any[]
  expiring: any[]
}>({ success: [], failed: [], expiring: [] })
const updateLogLoading = ref(false)
const updateProgress = ref({ current: 0, total: 0 })
const subsToUpdate = ref<any[]>([])
const updateStage = ref<'config' | 'progress'>('config')

// 更新设置
const updateSettings = reactive({
  concurrency: 5,
  retries: 2,
  delay: 500,
  batchDelay: 1000,
  expiringDaysThreshold: 2,
  expiringTrafficThresholdGB: 1,
})

// 其他模态框状态
const showImportModal = ref(false)
const showExportModal = ref(false)

// 批量导入相关状态
const importFormRef = ref<any>(null)
const importForm = reactive({
  urls: '',
  groupId: undefined as string | undefined
})
const showMoveToGroupModal = ref(false)
const showBatchReplaceModal = ref(false)
const batchReplaceData = reactive({
  find: '',
  replace: '',
  groupId: '',
  count: 0,
  loading: false
})
const moveToGroupId = ref('')
const moveToGroupLoading = ref(false)

// 分组管理相关状态（只保留组件独有的，其他从composable获取）
const showDropdown = ref(false)
const dropdownX = ref(0)
const dropdownY = ref(0)

// 导出相关状态
const exportData = reactive({
  urls: '',
  count: 0,
  groupName: ''
})

// 规则表单状态
const ruleFormState = reactive({
  id: 0,
  name: '',
  type: 'filter_by_name_keyword' as SubscriptionRule['type'] | 'exclude_by_name_keyword' | 'filter_by_name_regex' | 'rename_by_regex',
  value: '',
  enabled: true,
  keywords: [] as string[],
  renameRegex: '',
  renameFormat: '',
  regex: '',
})

// 规则管理计算属性
const ruleModalTitle = computed(() => {
  if (!currentRuleContext.value) return '规则管理'
  const contextName = currentRuleContext.value.type === 'subscription' ? '订阅' : '分组'
  const entityName = currentRuleContext.value.entity.name
  return `${contextName}规则 - ${entityName}`
})

const ruleFormTitle = computed(() => (editingRule.value ? '编辑规则' : '新增规则'))

const ruleTypeOptions = [
  { label: '按名称关键词过滤 (保留)', value: 'filter_by_name_keyword' },
  { label: '按名称关键词排除', value: 'exclude_by_name_keyword' },
  { label: '按名称正则过滤', value: 'filter_by_name_regex' },
  { label: '按正则重命名', value: 'rename_by_regex' },
]

const commonKeywords = [
  '香港', 'HK', '🇭🇰',
  '台湾', 'TW', '🇹🇼',
  '日本', 'JP', '🇯🇵',
  '美国', 'US', '🇺🇸',
  '新加坡', 'SG', '🇸🇬',
  '韩国', 'KR', '🇰🇷',
  '英国', 'UK', '🇬🇧',
  'IEPL', 'IPLC', '专线', 'BGP',
]

// 计算属性
const ungroupedCount = computed(() => {
  return subscriptions.value.filter(s => !s.group_id).length
})

const getGroupCount = (groupId: string) => {
  return subscriptions.value.filter(s => s.group_id === groupId).length
}

// 根据当前标签过滤订阅数据
const filteredSubscriptions = computed(() => {
  if (activeTab.value === 'all') {
    return subscriptions.value
  } else if (activeTab.value === 'ungrouped') {
    return subscriptions.value.filter(s => !s.group_id)
  } else {
    return subscriptions.value.filter(s => s.group_id === activeTab.value)
  }
})

// 批量导入相关计算属性
const importUrlCount = computed(() => {
  if (!importForm.urls.trim()) return 0
  return importForm.urls
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0)
    .length
})

const groupOptions = computed(() =>
  subscriptionGroupStore.groups.map(g => ({ label: g.name, value: g.id }))
)

const nodeGroupOptions = computed(() =>
  nodeGroupStore.groups.map(g => ({ label: g.name, value: g.id }))
)

const subscriptionGroups = computed(() => subscriptionGroupStore.groups)

// 监听规则应用开关变化
watch(applyRules, () => {
  // 如果当前有预览数据，重新获取预览
  if (showPreviewModal.value && currentPreviewSubscription.value && !previewData.value?.error) {
    handlePreviewNodes(currentPreviewSubscription.value)
  }
})

// 批量导入表单验证规则
const importFormRules = {
  urls: [
    { required: true, message: '请输入至少一个订阅链接', trigger: ['input', 'blur'] },
    {
      validator: (rule: any, value: string) => {
        if (!value || !value.trim()) {
          return new Error('请输入至少一个订阅链接')
        }

        const urls = value.split('\n').map((url: string) => url.trim()).filter((url: string) => url.length > 0)
        if (urls.length === 0) {
          return new Error('请输入至少一个有效的订阅链接')
        }

        if (urls.length > 100) {
          return new Error('一次最多导入100个订阅链接')
        }

        // 简单的URL格式验证
        const invalidUrls = urls.filter((url: string): boolean => {
          try {
            new URL(url)
            return false
          } catch {
            return true
          }
        })

        if (invalidUrls.length > 0) {
          return new Error(`发现 ${invalidUrls.length} 个无效的链接格式`)
        }

        return true
      },
      trigger: ['input', 'blur']
    }
  ]
}

// 表格列定义
const columns = createColumns({
  onEdit: (row) => openModal(row),
  onUpdate: (row) => handleUpdate(row),
  onDelete: (row) => handleDelete(row),
  onPreviewNodes: (row) => handlePreviewNodes(row),
  onManageRules: (row) => handleManageRules(row as unknown as Subscription, 'subscription')
})

// 预览节点功能
const handlePreviewNodes = async (row: any) => {
  currentPreviewSubscription.value = row
  previewLoading.value = true
  showPreviewModal.value = true
  previewData.value = null

  try {
    const payload = {
      url: row.url,
      subscription_id: row.id,
      apply_rules: applyRules.value,
    }
    const response = await api.post('/subscriptions/preview', payload, { timeout: 15000 })

    if (response.data.success && response.data.data?.nodes) {
      previewData.value = {
        mode: 'local',
        nodes: response.data.data.nodes,
        analysis: response.data.data.analysis
      }
      message.success(`获取到 ${response.data.data.nodes.length} 个节点`)
    } else {
      throw new Error(response.data.message || '预览失败')
    }
  } catch (error: any) {
    message.error(error.message || '预览失败')
    previewData.value = { error: error.message }
  } finally {
    previewLoading.value = false
  }
}

// 处理导入节点功能
const handleImportNodes = async () => {
  if (!previewData.value?.nodes || previewData.value.nodes.length === 0) {
    message.warning('没有可导入的节点')
    return
  }

  importLoading.value = true
  try {
    const response = await api.post('/nodes/batch-import', {
      nodes: previewData.value.nodes,
      groupId: selectedGroupId.value,
    })
    if (response.data.success) {
      message.success(response.data.message || '节点导入成功')
    } else {
      message.error(response.data.message || '导入失败')
    }
  } catch (error) {
    message.error('导入请求失败')
  } finally {
    importLoading.value = false
  }
}

// 复制节点链接功能
const handleCopyNodeLink = (node: any) => {
  try {
    const link = regenerateLink(node as ParsedNode)
    if (link) {
      navigator.clipboard.writeText(link)
      message.success('已复制完整链接')
    } else {
      navigator.clipboard.writeText(node.raw || '')
      message.success('已复制原始链接 (回退)')
    }
  } catch (error) {
    message.error('复制失败')
  }
}

// 头部操作按钮
const handleHeaderAction = async (key: string) => {
  // 立即关闭折叠菜单，不等待模态窗口显示
  closeHeaderActionsDropdown()

  switch (key) {
    case 'add-group':
      openAddGroupModal()
      break
    case 'update-all':
      handleUpdateAll()
      break
    case 'import':
      resetImportForm() // 重置表单
      showImportModal.value = true
      break
    case 'sort':
      openSortModal()
      break
    case 'move-to-group':
      if (checkedRowKeys.value.length > 0) {
        showMoveToGroupModal.value = true
      } else {
        message.warning('请至少选择一个订阅')
      }
      break
    case 'batch-delete':
      handleBatchDelete()
      break
    case 'clear-failed':
      handleClearAllFailed()
      break
    case 'clear-all':
      handleClearCurrentGroup()
      break
  }
}

// 批量更新相关函数
const prepareAndShowUpdateModal = (subs: any[]) => {
  if (subs.length === 0) {
    message.info('没有需要更新的订阅')
    return
  }
  subsToUpdate.value = subs
  updateLog.value = { success: [], failed: [], expiring: [] }
  updateProgress.value = { current: 0, total: subs.length }
  updateStage.value = 'config'
  showUpdateLogModal.value = true
}

const handleUpdateAll = () => {
  const subs = checkedRowKeys.value.length > 0
    ? subscriptions.value.filter(s => checkedRowKeys.value.includes(s.id))
    : subscriptions.value.filter(s => s.enabled)
  prepareAndShowUpdateModal(subs)
}

const executeSubscriptionUpdates = async () => {
  if (subsToUpdate.value.length === 0) {
    message.info('没有需要更新的订阅')
    return
  }

  updateStage.value = 'progress'
  updateLogLoading.value = true
  updateLog.value = { success: [], failed: [], expiring: [] }
  updateProgress.value = { current: 0, total: subsToUpdate.value.length }
  message.info(`开始更新 ${subsToUpdate.value.length} 个订阅...`)

  const { concurrency, retries, delay, batchDelay, expiringDaysThreshold, expiringTrafficThresholdGB } = updateSettings
  const trafficThreshold = expiringTrafficThresholdGB * 1024 * 1024 * 1024

  // 模拟批量更新逻辑，更符合实际的实现
  for (let i = 0; i < subsToUpdate.value.length; i++) {
    const sub = subsToUpdate.value[i]

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await handleUpdate(sub, true)
        updateProgress.value.current++

        // 分析更新结果
        const isExpiring = (sub.remaining_days !== null && sub.remaining_days !== undefined && sub.remaining_days < expiringDaysThreshold) ||
                           (sub.remaining_traffic !== null && sub.remaining_traffic !== undefined && sub.remaining_traffic < trafficThreshold)

        if (isExpiring) {
          updateLog.value.expiring.push(sub)
        } else {
          updateLog.value.success.push({ name: sub.name })
        }

        break // 成功则跳出重试循环
      } catch (error: any) {
        if (attempt === retries) {
          // 最后一次尝试失败
          updateProgress.value.current++
          updateLog.value.failed.push({ ...sub, error: error.message })
        } else {
          // 重试前等待
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    // 批次间隔
    if (i < subsToUpdate.value.length - 1 && batchDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, batchDelay))
    }
  }

  // 更新完成后的处理
  nextTick(() => {
    message.success('订阅更新任务完成！')
    if (checkedRowKeys.value.length > 0) {
      checkedRowKeys.value = []
    }
    updateLogLoading.value = false
  })
}

const handleClearAllFailed = () => {
  const tab = activeTab.value
  const failedSubs = filteredSubscriptions.value.filter(sub => sub.error || (sub.node_count === 0))

  let groupName = ''
  if (tab === 'all') {
    groupName = '全部'
  } else if (tab === 'ungrouped') {
    groupName = '未分组'
  } else {
    const group = subscriptionGroupStore.groups.find(g => g.id === tab)
    groupName = group?.name || '当前分组'
  }

  if (failedSubs.length === 0) {
    message.info(`"${groupName}"分组内没有失败的订阅可清除。`)
    return
  }

  dialog.warning({
    title: '确认清除失败项',
    content: `即将删除"${groupName}"分组内的 ${failedSubs.length} 个失败订阅，此操作不可恢复。确定要继续吗？`,
    positiveText: '确定清除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const idsToClear = failedSubs.map(sub => sub.id)
        await subscriptionService.batchDeleteSubscriptions(idsToClear)
        message.success(`成功清除了 ${idsToClear.length} 个失败订阅`)
        await fetchSubscriptions()
      } catch (error) {
        message.error('清除失败项失败')
      }
    }
  })
}

const handleClearCurrentGroup = () => {
  const tab = activeTab.value
  let groupName = ''
  let subCount = 0

  if (tab === 'all') {
    groupName = '全部'
    subCount = subscriptions.value.length
  } else if (tab === 'ungrouped') {
    groupName = '未分组'
    subCount = subscriptions.value.filter(s => !s.group_id).length
  } else {
    groupName = subscriptionGroupStore.groups.find(g => g.id === tab)?.name || '当前分组'
    subCount = subscriptions.value.filter(s => s.group_id === tab).length
  }

  if (subCount === 0) {
    message.info('当前分组没有订阅需要清除')
    return
  }

  dialog.warning({
    title: '确认一键清除',
    content: `确定要清除 "${groupName}" 分组下的 ${subCount} 个订阅吗？此操作不可恢复！`,
    positiveText: '确定清除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await subscriptionService.clearSubscriptionsByGroup(tab === 'all' ? null : tab)
        message.success('一键清除完成')
        await fetchSubscriptions()
      } catch (error) {
        message.error('一键清除失败')
      }
    }
  })
}

// 批量导入相关函数
const handleImport = async () => {
  try {
    await importFormRef.value?.validate()

    importLoading.value = true

    const urls = importForm.urls
      .split('\n')
      .map((url: string) => url.trim())
      .filter((url: string) => url.length > 0)

    const response = await api.post('/subscriptions/batch-import', {
      subscriptions: urls.map(url => ({
        name: new URL(url).hostname || '未知订阅',
        url: url
      })),
      groupId: importForm.groupId
    })

    if (response.data.success) {
      message.success(
        response.data.data?.message ||
        `成功导入 ${response.data.data?.created || 0} 个订阅`
      )
      showImportModal.value = false
      resetImportForm()
      await fetchSubscriptions()
    } else {
      message.error(response.data.message || '导入失败')
    }
  } catch (error: any) {
    console.error('批量导入失败:', error)
    if (error.message) {
      message.error(`导入失败: ${error.message}`)
    } else {
      message.error('导入失败，请检查网络连接或联系管理员')
    }
  } finally {
    importLoading.value = false
  }
}

const handleImportCancel = () => {
  showImportModal.value = false
  resetImportForm()
}

const resetImportForm = () => {
  importForm.urls = ''
  importForm.groupId = undefined
  importFormRef.value?.restoreValidation()
}

// 其他功能函数
const handleCancelUpdate = () => {
  // TODO: 实现中止更新功能
  updateLogLoading.value = false
  showUpdateLogModal.value = false
}

const handleRetryFailed = () => {
  const failedSubsInfo = [...updateLog.value.failed].filter(s => s.error !== '已中止')
  if (failedSubsInfo.length === 0) {
    message.info('没有需要重试的失败订阅')
    return
  }
  prepareAndShowUpdateModal(failedSubsInfo)
}

const handleClearExpiring = () => {
  const expiringSubs = updateLog.value.expiring
  if (expiringSubs.length === 0) {
    message.info('没有即将到期的订阅可以清除')
    return
  }

  dialog.warning({
    title: '确认清除即将到期订阅',
    content: `即将删除 ${expiringSubs.length} 个即将到期的订阅，此操作不可恢复。确定要继续吗？`,
    positiveText: '确定清除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const idsToClear = expiringSubs.map(sub => sub.id)
        await subscriptionService.batchDeleteSubscriptions(idsToClear)
        message.success(`成功清除了 ${idsToClear.length} 个即将到期的订阅`)
        updateLog.value.expiring = updateLog.value.expiring.filter(sub => !idsToClear.includes(sub.id))
        await fetchSubscriptions()
      } catch (error) {
        message.error('清除即将到期订阅失败')
      }
    }
  })
}

const handleClearFailed = () => {
  const subsToClear = updateLog.value.failed.filter(sub => sub.error !== '已中止')
  if (subsToClear.length === 0) {
    message.info('没有更新失败的订阅可以清除')
    return
  }

  dialog.warning({
    title: '确认清除失败订阅',
    content: `即将删除 ${subsToClear.length} 个更新失败的订阅，此操作不可恢复。确定要继续吗？`,
    positiveText: '确定清除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const idsToClear = subsToClear.map(sub => sub.id)
        await subscriptionService.batchDeleteSubscriptions(idsToClear)
        message.success(`成功清除了 ${idsToClear.length} 个失败订阅`)
        updateLog.value.failed = updateLog.value.failed.filter(sub => !idsToClear.includes(sub.id))
        await fetchSubscriptions()
      } catch (error) {
        message.error('清除失败订阅失败')
      }
    }
  })
}

const openAddGroupModal = () => {
  showAddGroupModal.value = true
}

// 分组操作功能
const handleGroupOperation = (key: string, group: any) => {
  switch (key) {
    case 'update-group':
      handleUpdateGroupSubscriptions(group.id)
      break
    case 'deduplicate-group':
      handleDeduplicateGroup(group.id)
      break
    case 'export-group':
      handleExportGroup(group.id)
      break
    case 'group-rules':
      handleManageRules(group, 'group')
      break
    case 'batch-replace-group':
      openBatchReplaceModalForGroup(group.id)
      break
    case 'rename':
      // 使用composable的handleEditGroup方法，需要设置editingGroup
      editingGroup.value = group
      editingGroupName.value = group.name
      editingGroupDescription.value = group.description || ''
      showEditGroupModal.value = true
      break
    case 'toggle':
      handleToggleGroup(group.id)
      break
    case 'delete':
      confirmDeleteGroup(group)
      break
    default:
      // 其他操作由useSubscriptionGroups处理
      activeDropdownGroup.value = group
      handleGroupAction(key)
  }
}

// 处理分组标签操作（与原组件保持一致）
const handleGroupActionForKey = (key: string) => {
  if (!activeDropdownGroup.value) return

  const group = activeDropdownGroup.value

  switch (key) {
    case 'rename':
      // 使用composable的handleEditGroup方法
      editingGroup.value = group
      editingGroupName.value = group.name
      editingGroupDescription.value = group.description || ''
      showEditGroupModal.value = true
      break
    case 'delete':
      confirmDeleteGroup(group)
      break
    default:
      // 其他操作委托给原有的处理函数
      handleGroupOperation(key, group)
  }
}

// 确认删除分组（使用composable的方法）
const confirmDeleteGroup = (group: SubscriptionGroup) => {
  handleDeleteGroup(group)
}

const handleUpdateGroupSubscriptions = (groupId: string) => {
  const subs = subscriptions.value.filter(s => s.group_id === groupId && s.enabled)
  if (subs.length === 0) {
    message.warning('该分组没有启用的订阅需要更新')
    return
  }
  prepareAndShowUpdateModal(subs)
}

const handleDeduplicateGroup = (groupId: string) => {
  const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId)
  const urlMap = new Map<string, any[]>()

  subsInGroup.forEach(sub => {
    const existing = urlMap.get(sub.url)
    if (existing) {
      existing.push(sub)
    } else {
      urlMap.set(sub.url, [sub])
    }
  })

  const idsToDelete: string[] = []
  urlMap.forEach(subs => {
    if (subs.length > 1) {
      // Keep the first one, delete the rest
      subs.slice(1).forEach(sub => idsToDelete.push(sub.id))
    }
  })

  if (idsToDelete.length === 0) {
    message.info('该分组内没有发现重复的订阅链接。')
    return
  }

  const totalCount = subsInGroup.length
  const duplicatesCount = idsToDelete.length

  dialog.warning({
    title: '确认去重',
    content: `发现 ${duplicatesCount} 个重复订阅（共 ${totalCount} 个）。将保留每个链接的第一个订阅，删除其余的。确定要继续吗？`,
    positiveText: '确定去重',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await subscriptionService.batchDeleteSubscriptions(idsToDelete)
        message.success(`成功删除 ${duplicatesCount} 个重复订阅`)
        await fetchSubscriptions()
      } catch (error) {
        message.error('去重操作失败')
      }
    }
  })
}

const handleExportGroup = (groupId: string) => {
  const group = subscriptionGroupStore.groups.find(g => g.id === groupId)
  const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId)

  if (subsInGroup.length === 0) {
    message.warning('该分组下没有订阅可导出')
    return
  }

  exportData.urls = subsInGroup.map(s => s.url).join('\n')
  exportData.count = subsInGroup.length
  exportData.groupName = group?.name || '该分组'
  showExportModal.value = true
}

const handleCopyExportUrls = () => {
  if (!exportData.urls) {
    message.warning('没有内容可复制')
    return
  }
  navigator.clipboard.writeText(exportData.urls).then(() => {
    message.success('已成功复制到剪贴板！')
  }).catch(err => {
    message.error('复制失败，您的浏览器可能不支持或未授权')
    console.error('Clipboard write failed:', err)
  })
}

const handleDownloadExport = () => {
  if (!exportData.urls) {
    message.warning('没有内容可下载')
    return
  }

  // 创建下载
  const blob = new Blob([exportData.urls], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${exportData.groupName}_订阅链接_${exportData.count}个.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  message.success(`已下载 ${exportData.count} 个订阅链接`)
}

const openBatchReplaceModalForGroup = (groupId: string) => {
  const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId)
  if (subsInGroup.length === 0) {
    message.warning('该分组下没有订阅可进行批量替换。')
    return
  }

  batchReplaceData.find = ''
  batchReplaceData.replace = ''
  batchReplaceData.groupId = groupId
  batchReplaceData.count = subsInGroup.length
  batchReplaceData.loading = false
  showBatchReplaceModal.value = true
}

const handleBatchReplace = async () => {
  if (!batchReplaceData.find) {
    message.warning('"查找"内容不能为空。')
    return
  }

  batchReplaceData.loading = true
  try {
    const updates = subscriptions.value
      .filter(s => s.group_id === batchReplaceData.groupId)
      .map(s => ({
        id: s.id,
        url: s.url.replace(new RegExp(batchReplaceData.find, 'g'), batchReplaceData.replace)
      }))

    await subscriptionService.batchUpdateUrls(updates)
    message.success('批量替换完成')
    showBatchReplaceModal.value = false
    await fetchSubscriptions()
  } catch (error) {
    message.error('批量替换失败')
  } finally {
    batchReplaceData.loading = false
  }
}

const handleMoveToGroup = async () => {
  if (checkedRowKeys.value.length === 0) {
    message.warning('请至少选择一个订阅')
    return
  }

  console.log('Moving', checkedRowKeys.value.length, 'subscriptions to group:', moveToGroupId.value) // 调试信息

  moveToGroupLoading.value = true
  try {
    // 使用API而不是服务方法，保持与原组件一致
    const response = await api.post('/subscriptions/batch-update-group', {
      subscriptionIds: checkedRowKeys.value,
      groupId: moveToGroupId.value,
    })

    if (response.data.success) {
      message.success(`成功移动 ${checkedRowKeys.value.length} 个订阅到分组`)
      showMoveToGroupModal.value = false
      moveToGroupId.value = ''
      checkedRowKeys.value = []
      await fetchSubscriptions()
      console.log('Move to group completed successfully') // 调试信息
    } else {
      message.error(response.data.message || '移动到分组失败')
    }
  } catch (error: any) {
    console.error('Failed to move subscriptions to group:', error) // 调试信息
    message.error(`移动到分组失败: ${error.message}`)
  } finally {
    moveToGroupLoading.value = false
  }
}

// 规则管理相关函数
const handleManageRules = (entity: Subscription | SubscriptionGroup, type: 'subscription' | 'group') => {
  currentRuleContext.value = { type, entity }
  showRulesModal.value = true
  fetchRules()
}

const fetchRules = async () => {
  if (!currentRuleContext.value) return
  rulesLoading.value = true
  const { type, entity } = currentRuleContext.value

  try {
    let rulesData = []
    if (type === 'group') {
      // 使用 subscriptionGroups store 来获取分组规则
      const groupStore = useSubscriptionGroupStore()
      rulesData = await groupStore.fetchGroupRules(entity.id)
    } else {
      // 对于订阅规则，暂时保留原来的逻辑（但需要实现订阅规则的后端API）
      const baseUrl = type === 'subscription' ? '/subscriptions' : '/subscription-groups'
      const response = await api.get<ApiResponse<SubscriptionRule[]>>(`${baseUrl}/${entity.id}/rules`)
      if (response.data.success) {
        rulesData = response.data.data || []
      } else {
        message.error(response.data.message || '获取规则列表失败')
        rulesLoading.value = false
        return
      }
    }
    rules.value = rulesData
  } catch (e) {
    message.error('请求规则列表失败')
  } finally {
    rulesLoading.value = false
  }
}

const openRuleFormModal = (rule: SubscriptionRule | null) => {
  ruleFormState.id = 0
  ruleFormState.name = ''
  ruleFormState.type = 'filter_by_name_keyword'
  ruleFormState.value = ''
  ruleFormState.enabled = true
  ruleFormState.keywords = []
  ruleFormState.renameRegex = ''
  ruleFormState.renameFormat = ''
  ruleFormState.regex = ''
  editingRule.value = null

  if (rule) {
    editingRule.value = rule
    ruleFormState.id = rule.id
    ruleFormState.name = rule.name
    ruleFormState.type = rule.type
    ruleFormState.value = rule.value
    ruleFormState.enabled = !!rule.enabled
    try {
      const parsedValue = JSON.parse(rule.value)
      if ((rule.type === 'filter_by_name_keyword' || rule.type === 'exclude_by_name_keyword') && parsedValue.keywords) {
        ruleFormState.keywords = parsedValue.keywords
      } else if (rule.type === 'rename_by_regex' && parsedValue.regex && parsedValue.format) {
        ruleFormState.renameRegex = parsedValue.regex
        ruleFormState.renameFormat = parsedValue.format
      } else if (rule.type === 'filter_by_name_regex' && parsedValue.regex) {
        ruleFormState.regex = parsedValue.regex
      }
    } catch (e) {
      console.error("Failed to parse rule value JSON:", e)
    }
  }
  showRuleFormModal.value = true
}

const handleSaveRule = async () => {
  if (!currentRuleContext.value) return
  const { type, entity } = currentRuleContext.value

  ruleSaveLoading.value = true
  try {
    let jsonValue = {}
    if (ruleFormState.type === 'filter_by_name_keyword' || ruleFormState.type === 'exclude_by_name_keyword') {
      jsonValue = { keywords: ruleFormState.keywords }
    } else if (ruleFormState.type === 'rename_by_regex') {
      jsonValue = { regex: ruleFormState.renameRegex, format: ruleFormState.renameFormat }
    } else if (ruleFormState.type === 'filter_by_name_regex') {
      jsonValue = { regex: ruleFormState.regex }
    } else {
      try {
        jsonValue = JSON.parse(ruleFormState.value)
      } catch (e) {
        message.error('规则值格式错误，请输入有效的JSON格式')
        ruleSaveLoading.value = false
        return
      }
    }

    const payload = {
      name: ruleFormState.name,
      type: ruleFormState.type,
      value: JSON.stringify(jsonValue),
      enabled: ruleFormState.enabled,
      sort_order: rules.value.length + 1
    }

    let response
    if (type === 'group') {
      // 使用 subscriptionGroups store 来处理分组规则
      const groupStore = useSubscriptionGroupStore()

      if (editingRule.value) {
        response = await groupStore.updateGroupRule(entity.id, String(editingRule.value.id), payload)
      } else {
        response = await groupStore.addGroupRule(entity.id, payload)
      }
    } else {
      // 对于订阅规则，暂时保留原来的逻辑（但需要实现订阅规则的后端API）
      const baseUrl = type === 'subscription' ? '/subscriptions' : '/subscription-groups'
      if (editingRule.value) {
        response = await api.put(`${baseUrl}/${entity.id}/rules/${editingRule.value.id}`, payload)
      } else {
        response = await api.post(`${baseUrl}/${entity.id}/rules`, payload)
      }
    }

    if ((response as any).data?.success || (response as any).success) {
      message.success(editingRule.value ? '规则更新成功' : '规则创建成功')
      showRuleFormModal.value = false
      fetchRules()
    } else {
      message.error((response as any).data?.message || (response as any).message || '保存失败')
    }
  } catch (e) {
    message.error('保存失败，请稍后重试')
  } finally {
    ruleSaveLoading.value = false
  }
}

const handleDeleteRule = (rule: SubscriptionRule) => {
  if (!currentRuleContext.value) return
  const { type, entity } = currentRuleContext.value

  dialog.warning({
    title: '确认删除规则',
    content: `确定要删除规则 "${rule.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        let response
        if (type === 'group') {
          // 使用 subscriptionGroups store 来处理分组规则
          const groupStore = useSubscriptionGroupStore()
          response = await groupStore.deleteGroupRule(entity.id, String(rule.id))
        } else {
          // 对于订阅规则，暂时保留原来的逻辑（但需要实现订阅规则的后端API）
          const baseUrl = type === 'subscription' ? '/subscriptions' : '/subscription-groups'
          response = await api.delete(`${baseUrl}/${entity.id}/rules/${rule.id}`)
        }

        if ((response as any).data?.success || (response as any).success) {
          message.success('规则删除成功')
          fetchRules()
        } else {
          message.error((response as any).data?.message || (response as any).message || '删除失败')
        }
      } catch (err) {
        message.error('请求失败，请稍后重试')
      }
    },
  })
}

const addKeyword = (keyword: string) => {
  if (!ruleFormState.keywords.includes(keyword)) {
    ruleFormState.keywords.push(keyword)
  }
}

// 生命周期
onMounted(async () => {
  // 加载订阅数据
  await handleFetchSubscriptions()
  // 加载分组数据
  subscriptionGroupStore.fetchGroups()
  // 加载节点分组数据
  nodeGroupStore.fetchGroups()
})

// 包装fetchSubscriptions方法，因为它是从composable返回的
const handleFetchSubscriptions = async () => {
  try {
    await fetchSubscriptions()
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error)
  }
}
</script>

<style scoped>
.subscriptions-modern-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

/* 头部主区域 */
.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 24px;
}

/* 头部左侧 */
.header-left {
  flex: 1;
  min-width: 0;
}

/* 头部右侧 */
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

/* 页面信息容器 */
.page-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.page-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb-separator {
  color: rgba(255, 255, 255, 0.6);
}

.breadcrumb-item.active {
  color: white;
  font-weight: 500;
}

/* 内联统计徽章样式 */
.inline-stats-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-badge-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  white-space: nowrap;
}

.stat-badge-inline:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-badge-value {
  font-weight: 600;
  font-size: 12px;
}

.stat-badge-label {
  opacity: 0.8;
  font-size: 10px;
}

.stat-badge--primary {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.25);
}

.stat-badge--success {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.25);
}

.stat-badge--warning {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.25);
}

.stat-badge--info {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.25);
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.page-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb-separator {
  color: rgba(255, 255, 255, 0.6);
}

.breadcrumb-item.active {
  color: white;
  font-weight: 500;
}

/* 统计卡片样式已移至内联徽章 */

/* 主内容区域 */
.layout-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 0;
}

.content-container {
  width: 100%;
  min-height: 600px;
}

.content-main {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

/* 分组标签 - 紧凑型样式 */
.group-tabs-section {
  background: white;
  border-radius: 8px;
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

/* 紧凑型segmented标签样式 */
.compact-tabs :deep(.n-tabs-nav) {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: thin;
  display: flex;
  align-items: center;
  width: 100%;
}

.compact-tabs :deep(.n-tabs-nav::-webkit-scrollbar) {
  height: 3px;
}

.compact-tabs :deep(.n-tabs-nav::-webkit-scrollbar-track) {
  background: #f1f5f9;
  border-radius: 3px;
}

.compact-tabs :deep(.n-tabs-nav::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
  border-radius: 3px;
}

.compact-tabs :deep(.n-tabs-nav::-webkit-scrollbar-thumb:hover) {
  background: #94a3b8;
}

.compact-tabs :deep(.n-tabs-tab) {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin: 0;
  padding: 8px 14px;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s ease;
  background: white;
  color: #64748b;
  min-height: 36px;
  line-height: 1;
  min-width: fit-content;
  white-space: nowrap;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
}

.compact-tabs :deep(.n-tabs-tab:hover) {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #1e293b;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.compact-tabs :deep(.n-tabs-tab:hover) .group-name-text {
  color: #1e293b;
}

.compact-tabs :deep(.n-tabs-tab:hover) .group-count-text {
  color: #475569;
}

.compact-tabs :deep(.n-tabs-tab:hover) .group-actions-button-compact {
  color: #1e293b;
  opacity: 1;
}

/* 激活标签悬停时保持不变 */
.compact-tabs :deep(.n-tabs-tab--active):hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white !important;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(118, 75, 162, 0.4);
  transform: translateY(-2px);
}

.compact-tabs :deep(.n-tabs-tab--active):hover .group-name-text {
  color: white;
}

.compact-tabs :deep(.n-tabs-tab--active):hover .group-count-text {
  color: white;
}

.compact-tabs :deep(.n-tabs-tab--active):hover .group-actions-button-compact {
  color: white;
}

.compact-tabs :deep(.n-tabs-tab--active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white !important;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(118, 75, 162, 0.4);
  transform: translateY(-2px);
  font-weight: 600;
  position: relative;
}

.compact-tabs :deep(.n-tabs-tab--active)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
  border-radius: 6px;
  pointer-events: none;
}

.compact-tabs :deep(.n-tabs-tab--active) .group-name-text {
  color: white;
}

.compact-tabs :deep(.n-tabs-tab--active) .group-count-text {
  color: white;
  font-weight: 500;
}

.compact-tabs :deep(.n-tabs-tab--active) .group-actions-button-compact {
  color: white;
}

.compact-tabs :deep(.n-tabs-tab--active) .group-actions-button-compact:hover {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.group-actions-button-compact:hover {
  background: rgba(30, 41, 59, 0.1);
  border-radius: 3px;
}

/* 悬停状态下的按钮背景优化 */
.compact-tabs :deep(.n-tabs-tab:hover) .group-actions-button-compact:hover {
  background: rgba(30, 41, 59, 0.15);
}

/* 确保默认标签（全部、未分组）的激活状态文字也是白色 */
.compact-tabs :deep(.n-tabs-tab--active) span {
  color: white !important;
}

.compact-tabs :deep(.n-tabs-tab-wrapper) {
  background: transparent;
  border-radius: 6px;
  margin: 0;
  padding: 0;
  border: none;
  min-width: fit-content;
}

.compact-tabs :deep(.n-tabs-nav-scroll-wrapper) {
  padding: 0;
}

.compact-tabs :deep(.n-tabs-nav--) {
  gap: 6px;
  display: flex;
  align-items: center;
}

.compact-tabs {
  width: 100%;
  display: flex;
  align-items: center;
  flex: 1;
}

.compact-tabs :deep(.n-tabs-nav-scroll-wrapper) {
  display: flex;
  align-items: center;
}

.compact-tabs :deep(.n-tabs-nav-scroll-content) {
  display: flex;
  align-items: center;
}

/* 表格区域 */
.table-section {
  background: white;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  width: 100%;
  box-sizing: border-box;
}

/* 顶部右侧按钮样式 */
.header-right :deep(.n-button) {
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-right :deep(.n-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.header-right :deep(.n-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

/* 更多操作按钮样式 */
.header-more-btn {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  color: #64748b;
  border-radius: 12px;
  width: 44px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
  color: #475569;
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
}

/* 现代化标签页样式 - 紧凑型 */
.modern-tabs :deep(.n-tabs-nav) {
  background: transparent;
  border-bottom: 1px solid #e2e8f0;
  padding: 0;
  margin: 0;
}

.modern-tabs :deep(.n-tabs-tab) {
  border: none;
  border-radius: 4px 4px 0 0;
  margin-right: 2px;
  padding: 6px 12px;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s ease;
  background: transparent;
  color: #64748b;
  min-height: 32px;
}

.modern-tabs :deep(.n-tabs-tab:hover) {
  background: #f8fafc;
  color: #475569;
}

.modern-tabs :deep(.n-tabs-tab--active) {
  background: white;
  color: #667eea;
  border-bottom: 2px solid #667eea;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.modern-tabs :deep(.n-tabs-tab-wrapper) {
  background: transparent;
  border-radius: 4px;
  margin: 0;
  padding: 2px;
  border: none;
}

.modern-tabs :deep(.n-tabs-nav-scroll-wrapper) {
  padding: 0;
}

.modern-tabs :deep(.n-tabs-nav--) {
  gap: 0;
}

/* 紧凑型分组标签样式 */
.group-tab-wrapper-compact {
  display: flex;
  align-items: center;
  padding: 0;
  gap: 6px;
  font-size: 13px;
  min-width: fit-content;
  height: 100%;
  line-height: 1;
}

.group-name-text {
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1;
  display: flex;
  align-items: center;
}

.group-count-text {
  font-weight: 400;
  color: #94a3b8;
  font-size: 11px;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1;
  display: flex;
  align-items: center;
}

.group-actions-button-compact {
  transition: opacity 0.2s;
  padding: 2px;
  min-width: 18px;
  height: 18px;
  font-size: 11px;
  opacity: 0;
  margin-left: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compact-tabs :deep(.n-tabs-tab:hover) .group-actions-button-compact,
.compact-tabs :deep(.n-tabs-tab--active) .group-actions-button-compact {
  opacity: 1;
}

.group-actions-button-compact:hover {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .header-main {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-right {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .inline-stats-inline {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .subscriptions-modern-layout {
    padding: 12px;
  }

  .header-main {
    margin-bottom: 16px;
  }

  .content-main {
    padding: 12px;
  }

  .group-tabs-section {
    padding: 6px 8px;
    margin-bottom: 8px;
  }

  .table-section {
    padding: 8px;
  }

  .modern-tabs :deep(.n-tabs-tab) {
    padding: 4px 8px;
    font-size: 12px;
    min-height: 28px;
  }

  .compact-tabs :deep(.n-tabs-tab) {
    padding: 6px 12px;
    font-size: 12px;
    min-height: 32px;
  }

  .group-tab-wrapper-compact {
    font-size: 12px;
    gap: 4px;
  }

  .group-name-text {
    font-size: 12px;
  }

  .group-count-text {
    font-size: 10px;
  }

  .group-tabs-section {
    padding: 3px 8px;
  }

  .inline-stats-inline {
    gap: 6px;
  }

  .stat-badge-inline {
    font-size: 10px;
    padding: 2px 6px;
  }

  .stat-badge-value {
    font-size: 11px;
  }

  .stat-badge-label {
    font-size: 9px;
  }

  .header-right {
    gap: 12px;
  }
}

/* 表格现代化样式 */
.table-section :deep(.n-data-table) {
  border-radius: 8px;
  overflow: hidden;
}

.table-section :deep(.n-data-table-th) {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}

.table-section :deep(.n-data-table-td) {
  border-bottom: 1px solid #f1f5f9;
}

.table-section :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: #f8fafc;
}

/* 删除旧的统计卡片样式 */

/* 拖拽排序样式 */
.drag-handle:hover {
  color: #18a058 !important;
}
</style>