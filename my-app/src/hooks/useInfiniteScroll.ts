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
        console.log('Infinite scroll triggered');
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
  apiUrl?: string; // Make API URL configurable
  selectedDate?: Date | null; // Add date filter
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
  handleAuthError,
  apiUrl = '/api/events/available', // Default to all events
  selectedDate = null // Date filter
}: UsePaginatedEventsProps): PaginatedEventsReturn => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [needsLoad, setNeedsLoad] = useState(false);

  // Check if user has a valid token
  const hasValidToken = () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Date.now() / 1000;
      return payload.exp > now; // Check if token is not expired
    } catch {
      return false;
    }
  };

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !hasValidToken()) return;

    console.log('Loading more events - Page:', currentPage, 'Date filter:', selectedDate);
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL;
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('size', '20');
    
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      params.append('date', dateStr);
    }
    
    try {
      const response = await fetch(
        `${baseUrl}${apiUrl}?${params.toString()}`,
        { headers: createAuthHeaders() }
      );

      if (!response.ok) {
        handleAuthError(response);
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      
      console.log('Received events:', data.content.length, 'Total:', data.totalElements, 'Has more:', data.hasNext);
      setEvents(prev => [...prev, ...data.content]);
      setHasMore(data.hasNext);
      setCurrentPage(prev => prev + 1);
      setTotalCount(data.totalElements);
    } catch (error) {
      console.error('Error loading more events:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, loading, hasMore, createAuthHeaders, handleAuthError, apiUrl, selectedDate]);

  // Reset pagination when selectedDate changes
  useEffect(() => {
    console.log('Date filter changed, resetting pagination:', selectedDate);
    setEvents([]);
    setCurrentPage(0);
    setHasMore(true);
    setTotalCount(0);
    setNeedsLoad(true); // Trigger a load after reset
  }, [selectedDate]);

  // Load data when needed
  useEffect(() => {
    if (needsLoad && hasValidToken() && !loading) {
      setNeedsLoad(false);
      loadMore();
    }
  }, [needsLoad, loadMore, loading]);

  // Load initial data on mount
  useEffect(() => {
    if (currentPage === 0 && events.length === 0 && hasValidToken() && !needsLoad) {
      setNeedsLoad(true);
    }
  }, []); // Empty dependency array for initial load only

  return {
    events,
    loading,
    hasMore,
    loadMore,
    totalCount,
  };
}; 