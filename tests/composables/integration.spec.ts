import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'

// Composables imports
import { useClipboard } from '@/composables/common/useClipboard'
import { useNotifications } from '@/composables/common/useNotifications'
import { useDateFormatting } from '@/composables/common/useDateFormatting'

// Mock dependencies
vi.mock('@/composables/common/useNotifications')

describe('Composables Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('mocked text'),
        copyText: vi.fn().mockResolvedValue(undefined)
      }
    })
  })

  describe('useClipboard', () => {
    let clipboard: ReturnType<typeof useClipboard>

    beforeEach(() => {
      clipboard = useClipboard()
    })

    it('should initialize with correct default values', () => {
      expect(clipboard.isLoading.value).toBe(false)
      expect(clipboard.lastCopied.value).toBeNull()
      expect(clipboard.error.value).toBeNull()
    })

    it('should copy text successfully', async () => {
      const result = await clipboard.copyText('test content')

      expect(result).toBe(true)
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test content')
      expect(clipboard.isLoading.value).toBe(false)
      expect(clipboard.lastCopied.value).toBe('test content')
      expect(clipboard.error.value).toBeNull()
    })

    it('should copy JSON successfully', async () => {
      const data = { test: 'data' }
      const result = await clipboard.copyJson(data)

      expect(result).toBe(true)
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(data, null, 2))
    })

    it('should handle clipboard errors', async () => {
      const error = new Error('Clipboard failed')
      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(error)

      const result = await clipboard.copyText('test content')

      expect(result).toBe(false)
      expect(clipboard.error.value).toBe('Clipboard failed')
      expect(clipboard.isLoading.value).toBe(false)
    })

    it('should fallback to execCommand when clipboard API fails', async () => {
      // Mock clipboard API to fail and execCommand to succeed
      vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Not supported'))
      const mockExecCommand = vi.fn()
      vi.stubGlobal('document', {
        execCommand: mockExecCommand
      })
      mockExecCommand.mockReturnValue(true)

      const result = await clipboard.copyText('test content')

      expect(result).toBe(true)
      expect(mockExecCommand).toHaveBeenCalledWith('copy')
    })
  })

  describe('useNotifications', () => {
    let notifications: ReturnType<typeof useNotifications>

    beforeEach(() => {
      notifications = useNotifications()
    })

    it('should provide notification methods', () => {
      expect(typeof notifications.success).toBe('function')
      expect(typeof notifications.error).toBe('function')
      expect(typeof notifications.warning).toBe('function')
      expect(typeof notifications.info).toBe('function')
    })

    it('should create custom notification', () => {
      const result = notifications.create({
        type: 'custom',
        title: 'Custom Title',
        message: 'Custom message',
        duration: 5000
      })

      expect(result).toBeDefined()
      expect(result.type).toBe('custom')
      expect(result.title).toBe('Custom Title')
    })

    it('should show confirmation dialog', async () => {
      // Mock dialog
      const mockConfirm = vi.fn().mockResolvedValue(true)
      vi.mocked(window).confirm = mockConfirm

      const result = await notifications.confirm(
        'Are you sure?',
        'This action cannot be undone.'
      )

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure?')
      expect(result).toBe(true)
    })
  })

  describe('useDateFormatting', () => {
    let dateFormatting: ReturnType<typeof useDateFormatting>

    beforeEach(() => {
      dateFormatting = useDateFormatting()
    })

    it('should format date with pattern', () => {
      const date = new Date('2024-01-15 10:30:00')
      const result = dateFormatting.formatDate(date, 'YYYY-MM-DD')

      expect(result).toBe('2024-01-15')
    })

    it('should format relative time', () => {
      const now = new Date('2024-01-15 10:30:00')
      const past = new Date('2024-01-15 09:30:00')

      vi.spyOn(Math, 'floor').mockReturnValue(-1)
      vi.setSystemTime(now.getTime())

      const result = dateFormatting.formatRelative(past)

      expect(result).toContain('小时前')
    })

    it('should format duration', () => {
      const startTime = new Date('2024-01-15 09:00:00')
      const endTime = new Date('2024-01-15 10:30:00')

      const result = dateFormatting.formatDuration(startTime, endTime)

      expect(result).toContain('1小时30分钟')
    })

    it('should handle null dates', () => {
      const result = dateFormatting.formatDate(null, 'YYYY-MM-DD')
      expect(result).toBe('未知')
    })
  })

  describe('Composables Integration', () => {
    it('should work together in a component', async () => {
      const clipboard = useClipboard()
      const notifications = useNotifications()

      // Test copying and showing notification
      const copyResult = await clipboard.copyText('integration test')
      expect(copyResult).toBe(true)

      notifications.success('复制成功！')

      expect(clipboard.lastCopied.value).toBe('integration test')
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
})