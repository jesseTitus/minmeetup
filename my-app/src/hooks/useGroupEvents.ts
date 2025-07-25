import { useAuth } from './useAuth';
import { usePaginatedEvents } from './useInfiniteScroll';

export const useGroupEvents = (groupId: string | undefined) => {
  const { createAuthHeaders, handleAuthError, user } = useAuth();
  
  const apiUrl = groupId ? `/api/groups/${groupId}/events/paginated` : '';
  
  const {
    events,
    loading,
    hasMore,
    loadMore,
    totalCount
  } = usePaginatedEvents({
    createAuthHeaders,
    handleAuthError,
    apiUrl
  });

  return {
    events,
    loading,
    hasMore: hasMore && !!groupId && !!user, // Don't allow loading more if no groupId or no user
    loadMore,
    totalCount
  };
}; 