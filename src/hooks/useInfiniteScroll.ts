import { useState, useEffect, useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions<T> {
  fetchData: (page: number, limit: number) => Promise<{
    items: T[]
    total: number
    hasMore: boolean
  }>
  initialLimit?: number
}

export function useInfiniteScroll<T>({
  fetchData,
  initialLimit = 10
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [shouldRefresh, setShouldRefresh] = useState(0)
  const initializedRef = useRef(false)

  const loadMore = useCallback(async (isRefresh = false) => {
    if (loading || (!hasMore && !isRefresh)) return

    setLoading(true)
    setError(null)

    try {
      const currentPage = isRefresh ? 1 : page
      const { items: newItems, total: newTotal, hasMore: moreAvailable } = await fetchData(currentPage, initialLimit)

      if (isRefresh) {
        setItems(newItems)
        setPage(2)
      } else {
        setItems(prevItems => [...prevItems, ...newItems])
        setPage(prevPage => prevPage + 1)
      }

      setTotal(newTotal)
      setHasMore(moreAvailable)
    } catch (error) {
      console.error('Error loading data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [fetchData, initialLimit, loading, hasMore, page])

  const refresh = useCallback(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    setError(null)
    setShouldRefresh(prev => prev + 1)
  }, [])

  // Initialize on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      loadMore(true)
    }
  }, [])

  // Handle refresh trigger
  useEffect(() => {
    if (shouldRefresh > 0) {
      loadMore(true)
    }
  }, [shouldRefresh])

  // Scroll event handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 100 && // Load when 100px from bottom
        hasMore &&
        !loading
      ) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, loading, loadMore])

  return {
    items,
    loading,
    hasMore,
    total,
    error,
    loadMore,
    refresh,
    page: page - 1 // Return current page (0-indexed for display)
  }
}