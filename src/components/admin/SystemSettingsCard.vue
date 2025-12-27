<script setup lang="ts">
import { NCard, NFlex, NSwitch } from 'naive-ui'

defineProps<{
    allowRegistration: boolean
    loading: boolean
}>()

const emit = defineEmits<{
    (e: 'update:allowRegistration', value: boolean): void
}>()
</script>

<template>
    <n-card title="系统设置" class="mb-6">
      <n-flex align="center">
        <label for="allow-registration-switch">允许新用户注册</label>
        <n-switch
          id="allow-registration-switch"
          :value="allowRegistration"
          :loading="loading"
          @update:value="(val) => emit('update:allowRegistration', val)"
        />
      </n-flex>
    </n-card>
</template>
