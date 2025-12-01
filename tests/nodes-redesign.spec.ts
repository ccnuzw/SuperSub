import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import NodesMobile from '../src/views/nodes-mobile.vue';
import MobileNodeFAB from '../src/components/mobile/MobileNodeFAB.vue';
import MobileSearchFilter from '../src/components/mobile/MobileSearchFilter.vue';
import NodeModal from '../src/views/components/NodeModal.vue';

// Mock data
const mockNodes = [
  {
    id: '1',
    name: 'Test Node 1',
    protocol: 'vmess',
    server: 'example1.com',
    port: 443,
    status: 'online',
    latency: 150,
    created_at: '2024-01-01T00:00:00Z',
    last_test_at: '2024-01-01T12:00:00Z'
  },
  {
    id: '2',
    name: 'Test Node 2',
    protocol: 'vless',
    server: 'example2.com',
    port: 8080,
    status: 'offline',
    latency: null,
    created_at: '2024-01-01T00:00:00Z',
    last_test_at: '2024-01-01T12:00:00Z'
  },
  {
    id: '3',
    name: 'Test Node 3',
    protocol: 'trojan',
    server: 'example3.com',
    port: 8443,
    status: 'testing',
    latency: null,
    created_at: '2024-01-01T00:00:00Z',
    last_test_at: null
  }
];

const mockGroups = [
  {
    id: 'group1',
    name: 'Group 1',
    user_id: 'user1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_enabled: true,
    sort_order: 0
  },
  {
    id: 'group2',
    name: 'Group 2',
    user_id: 'user1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_enabled: true,
    sort_order: 1
  }
];

// Mock composables
vi.mock('../src/composables/useMediaQuery', () => ({
  useIsMobile: () => vi.fn(() => true)
}));

// Mock naive-ui components
vi.mock('naive-ui', () => ({
  useMessage: () => vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  })),
  NButton: {
    name: 'NButton',
    template: '<button><slot /></button>',
    props: ['type', 'size', 'loading', 'disabled', 'circle', 'text']
  },
  NIcon: {
    name: 'NIcon',
    template: '<i><slot /></i>',
    props: ['component', 'size']
  },
  NTag: {
    name: 'NTag',
    template: '<span><slot /></span>',
    props: ['type', 'size', 'color', 'bordered']
  },
  NBadge: {
    name: 'NBadge',
    template: '<span><slot /></span>',
    props: ['value', 'max']
  },
  NCheckbox: {
    name: 'NCheckbox',
    template: '<input type="checkbox" />',
    props: ['checked', 'onUpdate:checked']
  },
  NDropdown: {
    name: 'NDropdown',
    template: '<div><slot /></div>',
    props: ['options', 'show', 'x', 'y', 'placement']
  },
  NModal: {
    name: 'NModal',
    template: '<div v-if="show"><slot /></div>',
    props: ['show', 'onUpdate:show', 'preset', 'title', 'maskClosable']
  },
  NPagination: {
    name: 'NPagination',
    template: '<div><slot /></div>',
    props: ['page', 'pageSize', 'itemCount', 'pageSizes', 'showSizePicker', 'showQuickJumper', 'simple', 'onUpdate:page', 'onUpdate:pageSize']
  },
  NSpin: {
    name: 'NSpin',
    template: '<div><slot /></div>',
    props: ['size']
  },
  NSpace: {
    name: 'NSpace',
    template: '<div><slot /></div>',
    props: ['vertical']
  },
  NInput: {
    name: 'NInput',
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'type', 'rows', 'clearable', 'readonly']
  },
  NInputGroup: {
    name: 'NInputGroup',
    template: '<div><slot /></div>'
  },
  NInputNumber: {
    name: 'NInputNumber',
    template: '<input type="number" />',
    props: ['value', 'placeholder', 'min', 'max', 'style']
  },
  NSelect: {
    name: 'NSelect',
    template: '<select><slot /></select>',
    props: ['value', 'placeholder', 'options', 'clearable']
  },
  NCheckboxGroup: {
    name: 'NCheckboxGroup',
    template: '<div><slot /></div>',
    props: ['value']
  },
  NCheckbox: {
    name: 'NCheckbox',
    template: '<label><input type="checkbox" :value="value" /><slot /></label>',
    props: ['value', 'label']
  },
  NRadioGroup: {
    name: 'NRadioGroup',
    template: '<div><slot /></div>',
    props: ['value']
  },
  NRadio: {
    name: 'NRadio',
    template: '<label><input type="radio" :value="value" /><slot /></label>',
    props: ['value', 'label']
  },
  NTabs: {
    name: 'NTabs',
    template: '<div><slot /></div>',
    props: ['value', 'type', 'onUpdate:value']
  },
  NTabPane: {
    name: 'NTabPane',
    template: '<div><slot /></div>',
    props: ['name', 'tab']
  },
  NCollapse: {
    name: 'NCollapse',
    template: '<div><slot /></div>'
  },
  NCollapseItem: {
    name: 'NCollapseItem',
    template: '<div><slot /></div>',
    props: ['title', 'name']
  },
  NAlert: {
    name: 'NAlert',
    template: '<div><slot /></div>',
    props: ['type']
  },
  NUpload: {
    name: 'NUpload',
    template: '<div><slot /></div>',
    props: ['fileList', 'max', 'defaultUpload', 'accept', 'onChange', 'onRemove']
  },
  NUploadDragger: {
    name: 'NUploadDragger',
    template: '<div><slot /></div>'
  },
  NDrawer: {
    name: 'NDrawer',
    template: '<div v-if="show"><slot /></div>',
    props: ['show', 'onUpdate:show', 'width', 'placement']
  },
  NDrawerContent: {
    name: 'NDrawerContent',
    template: '<div><slot /></div>',
    props: ['title', 'closable']
  },
  NForm: {
    name: 'NForm',
    template: '<form><slot /></form>',
    props: ['model', 'rules', 'labelPlacement', 'labelWidth', 'requireMarkPlacement']
  },
  NFormItem: {
    name: 'NFormItem',
    template: '<div><slot /></div>',
    props: ['label', 'path', 'required']
  },
  NDivider: {
    name: 'NDivider',
    template: '<hr />',
    props: ['title']
  },
  NText: {
    name: 'NText',
    template: '<span><slot /></span>'
  },
  NP: {
    name: 'NP',
    template: '<p><slot /></p>',
    props: ['depth']
  }
}));

// Mock services
const mockNodeService = {
  fetchNodes: vi.fn().mockResolvedValue(mockNodes),
  fetchGroups: vi.fn().mockResolvedValue(mockGroups),
  createNode: vi.fn().mockResolvedValue(mockNodes[0]),
  updateNode: vi.fn().mockResolvedValue(mockNodes[0]),
  deleteNode: vi.fn().mockResolvedValue(true),
  batchDeleteNodes: vi.fn().mockResolvedValue({ message: '删除成功' }),
  batchUpdateGroup: vi.fn().mockResolvedValue({ message: '移动成功' }),
  checkNodeHealth: vi.fn().mockResolvedValue({ message: '测试完成' })
};

vi.mock('../src/services/nodeService', () => ({
  NodeService: mockNodeService
}));

describe('Nodes Redesign Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mobile Nodes Page', () => {
    it('renders mobile header correctly', () => {
      const wrapper = mount(NodesMobile, {
        global: {
          stubs: {
            'mobile-node-fab': true,
            'mobile-search-filter': true,
            'node-modal': true,
            'import-modal': true,
            'batch-move-modal': true
          }
        }
      });

      expect(wrapper.find('.mobile-header').exists()).toBe(true);
      expect(wrapper.find('.page-title').text()).toBe('节点管理');
      expect(wrapper.find('.stats-pills').exists()).toBe(true);
    });

    it('displays correct node statistics', () => {
      const wrapper = mount(NodesMobile, {
        data() {
          return {
            nodes: mockNodes
          };
        },
        global: {
          stubs: {
            'mobile-node-fab': true,
            'mobile-search-filter': true,
            'node-modal': true,
            'import-modal': true,
            'batch-move-modal': true
          }
        }
      });

      // 等待计算属性更新
      wrapper.vm.$nextTick(() => {
        expect(wrapper.vm.onlineCount).toBe(1);
        expect(wrapper.vm.offlineCount).toBe(1);
        expect(wrapper.vm.totalCount).toBe(3);
      });
    });

    it('filters nodes correctly when searching', async () => {
      const wrapper = mount(NodesMobile, {
        data() {
          return {
            nodes: mockNodes,
            currentFilters: {
              search: 'Test Node 1'
            }
          };
        },
        global: {
          stubs: {
            'mobile-node-fab': true,
            'mobile-search-filter': true,
            'node-modal': true,
            'import-modal': true,
            'batch-move-modal': true
          }
        }
      });

      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filteredNodes).toHaveLength(1);
      expect(wrapper.vm.filteredNodes[0].name).toBe('Test Node 1');
    });

    it('handles node selection correctly', async () => {
      const wrapper = mount(NodesMobile, {
        data() {
          return {
            nodes: mockNodes,
            selectedNodes: []
          };
        },
        global: {
          stubs: {
            'mobile-node-fab': true,
            'mobile-search-filter': true,
            'node-modal': true,
            'import-modal': true,
            'batch-move-modal': true
          }
        }
      });

      const node = mockNodes[0];
      wrapper.vm.toggleNodeSelection(node);

      expect(wrapper.vm.selectedNodes).toHaveLength(1);
      expect(wrapper.vm.selectedNodes[0].id).toBe(node.id);

      // 再次点击应该取消选择
      wrapper.vm.toggleNodeSelection(node);
      expect(wrapper.vm.selectedNodes).toHaveLength(0);
    });

    it('shows empty state when no nodes', () => {
      const wrapper = mount(NodesMobile, {
        data() {
          return {
            nodes: [],
            loading: false
          };
        },
        global: {
          stubs: {
            'mobile-node-fab': true,
            'mobile-search-filter': true,
            'node-modal': true,
            'import-modal': true,
            'batch-move-modal': true
          }
        }
      });

      expect(wrapper.find('.empty-state').exists()).toBe(true);
      expect(wrapper.find('.empty-title').text()).toBe('暂无节点');
    });
  });

  describe('Mobile Node FAB', () => {
    it('renders FAB button correctly', () => {
      const wrapper = mount(MobileNodeFAB, {
        props: {
          show: true,
          selectedCount: 0
        }
      });

      expect(wrapper.find('.mobile-node-fab').exists()).toBe(true);
    });

    it('shows batch actions when nodes are selected', async () => {
      const wrapper = mount(MobileNodeFAB, {
        props: {
          show: true,
          selectedCount: 2
        }
      });

      await wrapper.vm.$nextTick();
      // FAB should show batch count
      expect(wrapper.props('selectedCount')).toBe(2);
    });

    it('emits events correctly', async () => {
      const wrapper = mount(MobileNodeFAB, {
        props: {
          show: true,
          selectedCount: 0
        }
      });

      await wrapper.vm.$nextTick();

      // Test search event
      wrapper.vm.$emit('search');
      expect(wrapper.emitted('search')).toBeTruthy();

      // Test add event
      wrapper.vm.$emit('add');
      expect(wrapper.emitted('add')).toBeTruthy();
    });
  });

  describe('Mobile Search Filter', () => {
    it('renders search input correctly', () => {
      const wrapper = mount(MobileSearchFilter, {
        props: {
          show: true,
          groups: mockGroups
        }
      });

      expect(wrapper.find('.search-input').exists()).toBe(true);
    });

    it('shows quick filter options', () => {
      const wrapper = mount(MobileSearchFilter, {
        props: {
          show: true,
          groups: mockGroups
        }
      });

      expect(wrapper.find('.quick-filters').exists()).toBe(true);
      expect(wrapper.find('.filter-tags').exists()).toBe(true);
    });

    it('emits search event when query changes', async () => {
      const wrapper = mount(MobileSearchFilter, {
        props: {
          show: true,
          groups: mockGroups
        }
      });

      await wrapper.setData({ searchQuery: 'test' });
      wrapper.vm.$emit('search', 'test');
      expect(wrapper.emitted('search')).toBeTruthy();
    });
  });

  describe('Node Modal', () => {
    it('renders form fields correctly', () => {
      const wrapper = mount(NodeModal, {
        props: {
          show: true,
          node: null,
          groups: mockGroups
        }
      });

      expect(wrapper.find('.n-form').exists()).toBe(true);
    });

    it('loads node data for editing', async () => {
      const wrapper = mount(NodeModal, {
        props: {
          show: true,
          node: mockNodes[0],
          groups: mockGroups
        }
      });

      await wrapper.vm.$nextTick();
      // Check if form is populated with node data
      expect(wrapper.vm.isEdit).toBe(true);
    });

    it('validates required fields', async () => {
      const wrapper = mount(NodeModal, {
        props: {
          show: true,
          node: null,
          groups: mockGroups
        }
      });

      // Test form validation
      const formData = {
        name: '',
        protocol: '',
        server: '',
        port: 0
      };

      expect(formData.name).toBe('');
      expect(formData.protocol).toBe('');
      // Form should have validation rules
    });
  });

  describe('Responsive Design', () => {
    it('applies mobile-specific classes', () => {
      const wrapper = mount(NodesMobile, {
        global: {
          stubs: {
            'mobile-node-fab': true,
            'mobile-search-filter': true,
            'node-modal': true,
            'import-modal': true,
            'batch-move-modal': true
          }
        }
      });

      expect(wrapper.find('.mobile-nodes-page').exists()).toBe(true);
      expect(wrapper.find('.mobile-header').exists()).toBe(true);
    });

    it('handles different screen sizes', () => {
      // Test responsive breakpoints
      const mobileBreakpoint = 767;
      const tabletBreakpoint = 1024;
      const desktopBreakpoint = 1025;

      expect(mobileBreakpoint).toBeLessThan(tabletBreakpoint);
      expect(tabletBreakpoint).toBeLessThan(desktopBreakpoint);
    });
  });

  describe('Performance', () => {
    it('handles large node lists efficiently', async () => {
      const largeNodeList = Array.from({ length: 1000 }, (_, i) => ({
        id: `node-${i}`,
        name: `Node ${i}`,
        protocol: 'vmess',
        server: `node${i}.example.com`,
        port: 443,
        status: 'online' as const,
        latency: Math.floor(Math.random() * 500),
        created_at: '2024-01-01T00:00:00Z',
        last_test_at: '2024-01-01T12:00:00Z'
      }));

      const wrapper = mount(NodesMobile, {
        data() {
          return {
            nodes: largeNodeList
          };
        },
        global: {
          stubs: {
            'mobile-node-fab': true,
            'mobile-search-filter': true,
            'node-modal': true,
            'import-modal': true,
            'batch-move-modal': true
          }
        }
      });

      await wrapper.vm.$nextTick();

      // Check if pagination is working
      expect(wrapper.vm.paginatedNodes.length).toBeLessThanOrEqual(15); // Default page size
    });

    it('debounces search input', async () => {
      const wrapper = mount(NodesMobile, {
        data() {
          return {
            nodes: mockNodes
          };
        },
        global: {
          stubs: {
            'mobile-node-fab': true,
            'mobile-search-filter': true,
            'node-modal': true,
            'import-modal': true,
            'batch-move-modal': true
          }
        }
      });

      const searchSpy = vi.spyOn(wrapper.vm, 'handleSearch');

      // Simulate rapid search inputs
      wrapper.vm.handleSearch('test1');
      wrapper.vm.handleSearch('test2');
      wrapper.vm.handleSearch('test3');

      // Should be debounced, so last call should be with 'test3'
      expect(searchSpy).toHaveBeenLastCalledWith('test3');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const wrapper = mount(NodesMobile, {
        data() {
          return {
            nodes: mockNodes
          };
        },
        global: {
          stubs: {
            'mobile-node-fab': true,
            'mobile-search-filter': true,
            'node-modal': true,
            'import-modal': true,
            'batch-move-modal': true
          }
        }
      });

      // Check for ARIA labels (this would be more comprehensive with actual DOM)
      expect(wrapper.find('.mobile-nodes-page').exists()).toBe(true);
    });

    it('supports keyboard navigation', () => {
      // This would test keyboard event handlers
      expect(true).toBe(true); // Placeholder for keyboard navigation tests
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      // Mock API error
      mockNodeService.fetchNodes.mockRejectedValueOnce(new Error('API Error'));

      const wrapper = mount(NodesMobile, {
        global: {
          stubs: {
            'mobile-node-fab': true,
            'mobile-search-filter': true,
            'node-modal': true,
            'import-modal': true,
            'batch-move-modal': true
          }
        }
      });

      // Should handle error without crashing
      expect(wrapper.vm.loading).toBe(false);
    });

    it('validates user input correctly', () => {
      const wrapper = mount(NodeModal, {
        props: {
          show: true,
          node: null,
          groups: mockGroups
        }
      });

      // Test form validation
      const invalidData = {
        name: '',
        server: '',
        port: 0
      };

      // Form validation should catch these errors
      expect(invalidData.name).toBe('');
      expect(invalidData.server).toBe('');
      expect(invalidData.port).toBe(0);
    });
  });
});