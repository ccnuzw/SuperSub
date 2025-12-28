import { ref, type Ref } from 'vue'

/**
 * Debounce hook - delays execution until user stops triggering for specified duration
 */
export function useDebounceFn<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
            fn(...args)
            timeoutId = null
        }, delay)
    }
}

/**
 * Throttle hook - limits execution to once per specified duration
 */
export function useThrottleFn<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    let lastExecTime = 0

    return (...args: Parameters<T>) => {
        const now = Date.now()
        if (now - lastExecTime >= delay) {
            fn(...args)
            lastExecTime = now
        }
    }
}

/**
 * Request deduplication hook - prevents duplicate concurrent requests for the same key
 */
export function useRequestLock() {
    const pendingRequests = new Map<string, Promise<any>>()

    async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
        // If same request is already in progress, return its promise
        if (pendingRequests.has(key)) {
            return pendingRequests.get(key) as Promise<T>
        }

        // Execute and track the request
        const promise = fn().finally(() => {
            pendingRequests.delete(key)
        })

        pendingRequests.set(key, promise)
        return promise
    }

    function isLocked(key: string): boolean {
        return pendingRequests.has(key)
    }

    function clear(): void {
        pendingRequests.clear()
    }

    return { withLock, isLocked, clear }
}

/**
 * Loading state manager with button disable support
 */
export function useLoadingState(initialState: boolean = false) {
    const isLoading = ref(initialState)
    const error = ref<string | null>(null)

    async function execute<T>(fn: () => Promise<T>): Promise<T | null> {
        if (isLoading.value) return null

        isLoading.value = true
        error.value = null

        try {
            return await fn()
        } catch (e: any) {
            error.value = e.message || 'Unknown error'
            throw e
        } finally {
            isLoading.value = false
        }
    }

    return { isLoading, error, execute }
}
