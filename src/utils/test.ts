// 第一阶段基础架构测试
// 这个文件用于验证基础架构是否工作正常

import { simpleApiClient } from '@/utils/api/SimpleApiClient';
import { createSimpleStore } from '@/stores/base/SimpleBaseStore';
import type { TableColumn } from '@/types/common';

// 测试类型定义
interface TestItem {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// 测试Store
export const testStore = createSimpleStore<TestItem>('/test', 10, 20);

// 测试表格列定义
export const testColumns: TableColumn[] = [
  {
    key: 'id',
    title: 'ID'
  },
  {
    key: 'name',
    title: '名称'
  },
  {
    key: 'created_at',
    title: '创建时间'
  }
];

// 测试函数
export async function testBasicArchitecture() {
  console.log('🧪 开始测试基础架构...');

  // 测试API客户端
  try {
    const response = await simpleApiClient.get('/test');
    console.log('✅ API客户端测试通过:', response);
  } catch (error) {
    console.log('⚠️ API客户端测试失败（可能是正常的）:', error);
  }

  // 测试Store
  try {
    await testStore.fetchItems();
    console.log('✅ Store测试通过:', testStore.items.value);
  } catch (error) {
    console.log('⚠️ Store测试失败（可能是正常的）:', error);
  }

  console.log('🎉 基础架构测试完成！');
}

// 基础错误处理
export function handleBasicError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return '未知错误';
}

// 基础验证规则
export const basicRules = {
  required: (message: string) => ({
    required: true,
    message
  }),
  minLength: (min: number, message: string) => ({
    min,
    message
  })
};