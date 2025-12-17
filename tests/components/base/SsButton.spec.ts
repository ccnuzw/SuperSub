import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { SsButton } from '@/components/base/SsButton.vue'

describe('SsButton', () => {
  it('renders button with text', () => {
    const wrapper = mount(SsButton, {
      props: {
        default: 'Click me'
      }
    })

    expect(wrapper.text()).toContain('Click me')
    expect(wrapper.find('button')).toBeDefined()
  })

  it('applies variant classes correctly', () => {
    const wrapper = mount(SsButton, {
      props: {
        variant: 'primary',
        default: 'Primary Button'
      }
    })

    const button = wrapper.find('button')
    expect(button.classes()).toContain('ss-button--primary')
  })

  it('emits click event', async () => {
    const wrapper = mount(SsButton, {
      props: {
        default: 'Click me'
      }
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
  })

  it('handles loading state', () => {
    const wrapper = mount(SsButton, {
      props: {
        loading: true,
        default: 'Loading'
      }
    })

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Loading')
  })

  it('handles disabled state', () => {
    const wrapper = mount(SsButton, {
      props: {
        disabled: true,
        default: 'Disabled'
      }
    })

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('applies size classes correctly', () => {
    const wrapper = mount(SsButton, {
      props: {
        size: 'lg',
        default: 'Large Button'
      }
    })

    const button = wrapper.find('button')
    expect(button.classes()).toContain('ss-button--lg')
  })

  it('accepts custom class', () => {
    const wrapper = mount(SsButton, {
      props: {
        class: 'custom-class',
        default: 'Custom Class'
      }
    })

    const button = wrapper.find('button')
    expect(button.classes()).toContain('custom-class')
  })
})