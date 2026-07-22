import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { ToastContext, useToast, type ToastContextValue } from './useToast'

describe('useToast', () => {
  it('returns default no-op toast from default context', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toast).toBeInstanceOf(Function)
    expect(() => result.current.toast('test')).not.toThrow()
  })

  it('returns provided toast function from context', () => {
    const mockToast = vi.fn()
    const contextValue: ToastContextValue = { toast: mockToast }

    function wrapper({ children }: { children: React.ReactNode }) {
      return createElement(ToastContext.Provider, { value: contextValue }, children)
    }

    const { result } = renderHook(() => useToast(), { wrapper })
    result.current.toast('hello', 'success')
    expect(mockToast).toHaveBeenCalledWith('hello', 'success')
  })

  it('returns context value shape { toast: Function }', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current).toEqual({ toast: expect.any(Function) })
  })
})
