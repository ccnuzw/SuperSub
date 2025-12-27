<script setup lang="ts">
import { NSwitch } from 'naive-ui'
import Card from '@/components/ui/Card.vue'

defineProps<{
    allowRegistration: boolean
    loading: boolean
}>()

const emit = defineEmits<{
    (e: 'update:allowRegistration', value: boolean): void
}>()
</script>

<template>
    <Card title="系统设置" class="mb-6">
      <div class="flex items-center gap-4">
        <label for="allow-registration-switch" class="text-slate-700 dark:text-slate-300 font-medium">允许新用户注册</label>
        <n-switch
          id="allow-registration-switch"
          :value="allowRegistration"
          :loading="loading"
          @update:value="(val) => emit('update:allowRegistration', val)"
        />
      </div>
    </Card>
</template>
