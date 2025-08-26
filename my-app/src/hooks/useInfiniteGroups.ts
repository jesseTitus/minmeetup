import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface Group {
  id: number;
  name: string;
  imageUrl?: string;
  address?: string;
  city?: string;
  stateOrProvince?: string;
  country?: string;
  postalCode?: string;
  memberCount?: number;
  eventCount?: number;
  isMember?: boolean;
}

interface PaginatedGroupsReturn {
  groups: Group[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  totalCount: number;
  updateGroupMembership: (groupId: number, isMember: boolean) => void;
}

export const useInfiniteGroups = (): PaginatedGroupsReturn => {
  const { user, createAuthHeaders, handleAuthError } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [needsLoad, setNeedsLoad] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !user) {
      return;
    }

    console.log('Loading more groups - Page:', currentPage);
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL;
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('size', '12'); // Load 12 groups at a time
    
    try {
      const response = await fetch(
        `${baseUrl}/api/groups/available/paginated?${params.toString()}`,
        { headers: createAuthHeaders() }
      );

      if (!response.ok) {
        handleAuthError(response);
        throw new Error('Failed to fetch groups');
      }

      const data = await response.json();
      
      console.log('Received groups:', data.content.length, 'Total:', data.totalElements, 'Has more:', data.hasNext);
      setGroups(prev => [...prev, ...data.content]);
      setHasMore(data.hasNext);
      setCurrentPage(prev => prev + 1);
      setTotalCount(data.totalElements);
    } catch (error) {
      console.error('Error loading more groups:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, loading, hasMore, createAuthHeaders, handleAuthError, user]);

  // Reset pagination when user changes
  useEffect(() => {
    if (user) {
      setGroups([]);
      setCurrentPage(0);
      setHasMore(true);
      setTotalCount(0);
      setNeedsLoad(true); // Trigger a load after reset
    }
  }, [user]);

  // Load data when needed
  useEffect(() => {
    if (needsLoad && !loading && user) {
      setNeedsLoad(false);
      loadMore();
    }
  }, [needsLoad, loadMore, loading, user]);

  // Load initial data on mount
  useEffect(() => {
    if (currentPage === 0 && groups.length === 0 && !needsLoad && user) {
      setNeedsLoad(true);
    }
  }, [user]); // Only depend on user to trigger initial load

  const updateGroupMembership = useCallback((groupId: number, isMember: boolean) => {
    setGroups(prevGroups =>
      prevGroups.map(group =>
        group.id === groupId ? { ...group, isMember } : group
      )
    );
  }, []);

  return {
    groups,
    loading,
    hasMore,
    loadMore,
    totalCount,
    updateGroupMembership,
  };
};