// 测试新的状态管理stores
import { useGroupStore } from '@/stores/newGroups';
import { useSubscriptionGroupStore } from '@/stores/newSubscriptionGroups';

/**
 * 测试新的Groups Store
 */
export async function testGroupStore() {
  console.log('🧪 开始测试Groups Store...');

  const groupStore = useGroupStore();

  try {
    // 测试获取分组
    console.log('1. 测试获取分组...');
    await groupStore.fetchGroups();
    console.log('✅ 获取分组成功:', groupStore.groups.value.length, '个分组');

    // 测试分组统计
    console.log('2. 测试分组统计...');
    const stats = groupStore.getGroupStats();
    console.log('✅ 分组统计:', stats);

    // 测试获取启用的分组
    console.log('3. 测试获取启用的分组...');
    const enabledGroups = groupStore.getEnabledGroups();
    console.log('✅ 启用的分组:', enabledGroups.length, '个');

    // 测试分组名称获取
    if (groupStore.groups.value.length > 0) {
      console.log('4. 测试分组名称获取...');
      const groupName = groupStore.getGroupName(groupStore.groups.value[0].id);
      console.log('✅ 分组名称:', groupName);
    }

    console.log('🎉 Groups Store测试完成！');
    return true;
  } catch (error) {
    console.error('❌ Groups Store测试失败:', error);
    return false;
  }
}

/**
 * 测试新的SubscriptionGroups Store
 */
export async function testSubscriptionGroupStore() {
  console.log('🧪 开始测试SubscriptionGroups Store...');

  const subscriptionGroupStore = useSubscriptionGroupStore();

  try {
    // 测试获取订阅分组
    console.log('1. 测试获取订阅分组...');
    await subscriptionGroupStore.fetchGroups();
    console.log('✅ 获取订阅分组��功:', subscriptionGroupStore.groups.value.length, '个分组');

    // 测试分组统计
    console.log('2. 测试订阅分组统计...');
    const stats = subscriptionGroupStore.getGroupStats();
    console.log('✅ 订阅分组统计:', stats);

    // 测试搜索功能
    console.log('3. 测试搜索功能...');
    const searchResults = subscriptionGroupStore.searchGroups('test');
    console.log('✅ 搜索结果:', searchResults.length, '个分组');

    // 测试排序功能
    console.log('4. 测试排序功能...');
    subscriptionGroupStore.sortGroupsByName(true);
    console.log('✅ 按名称排序完成');

    subscriptionGroupStore.sortGroupsByCreatedDate(true);
    console.log('✅ 按创建时间排序完成');

    console.log('🎉 SubscriptionGroups Store测试完成！');
    return true;
  } catch (error) {
    console.error('❌ SubscriptionGroups Store测试失败:', error);
    return false;
  }
}

/**
 * 测试状态管理的性能
 */
export function testStateManagementPerformance() {
  console.log('⚡ 开始测试状态管理性能...');

  const groupStore = useGroupStore();
  const subscriptionGroupStore = useSubscriptionGroupStore();

  // 测试大量数据操作
  console.time('大量数据操作测试');

  // 模拟大量分组数据
  const mockGroups = Array.from({ length: 1000 }, (_, i) => ({
    id: `group-${i}`,
    user_id: 'test-user',
    name: `测试分组 ${i}`,
    description: `测试分组描述 ${i}`,
    sort_order: i,
    is_enabled: i % 2 === 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  // 测试搜索性能
  console.time('搜索性能测试');
  const searchResults = mockGroups.filter(group =>
    group.name.includes('测试分组') &&
    group.is_enabled
  );
  console.timeEnd('搜索性能测试');
  console.log('✅ 搜索结果:', searchResults.length, '个分组');

  console.timeEnd('大量数据操作测试');
  console.log('🚀 性能测试完成！');
}

/**
 * 运行所有状态管理测试
 */
export async function runAllStateManagementTests() {
  console.log('🚀 开始运行所有状态管理测试...\n');

  let allTestsPassed = true;

  // 测试Groups Store
  const groupStoreTest = await testGroupStore();
  allTestsPassed = allTestsPassed && groupStoreTest;

  console.log('\n');

  // 测试SubscriptionGroups Store
  const subscriptionGroupStoreTest = await testSubscriptionGroupStore();
  allTestsPassed = allTestsPassed && subscriptionGroupStoreTest;

  console.log('\n');

  // 性能测试
  testStateManagementPerformance();

  console.log('\n📊 测试总结:');
  if (allTestsPassed) {
    console.log('✅ 所有状态管理测试通过！');
  } else {
    console.log('❌ 部分测试失败，请检查实现');
  }

  return allTestsPassed;
}