import { useState, useEffect, useCallback } from 'react';

interface UseInfiniteScrollReturn {
  isFetching: boolean;
  setIsFetching: (fetching: boolean) => void;
}

export const useInfiniteScroll = (fetchMore: () => void): UseInfiniteScrollReturn => {
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Trigger when user is within 1000px of the bottom
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 1000 && 
        !isFetching
      ) {
        setIsFetching(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFetching]);

  useEffect(() => {
    if (!isFetching) return;
    fetchMore();
  }, [isFetching, fetchMore]);

  return { isFetching, setIsFetching };
};

interface UsePaginatedEventsProps {
  createAuthHeaders: () => HeadersInit;
  handleAuthError: (response: Response) => void;
}

interface PaginatedEventsReturn {
  events: any[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  totalCount: number;
}

export const usePaginatedEvents = ({ 
  createAuthHeaders, 
  handleAuthError 
}: UsePaginatedEventsProps): PaginatedEventsReturn => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL;
    
    try {
      const response = await fetch(
        `${apiUrl}/api/events/available?page=${currentPage}&size=40`,
        { headers: createAuthHeaders() }
      );

      if (!response.ok) {
        handleAuthError(response);
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      
      setEvents(prev => [...prev, ...data.content]);
      setHasMore(data.hasNext);
      setCurrentPage(prev => prev + 1);
      setTotalCount(data.totalElements);
    } catch (error) {
      console.error('Error loading more events:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, loading, hasMore, createAuthHeaders, handleAuthError]);

  // Load initial data
  useEffect(() => {
    if (currentPage === 0 && events.length === 0) {
      loadMore();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    events,
    loading,
    hasMore,
    loadMore,
    totalCount,
  };
}; 