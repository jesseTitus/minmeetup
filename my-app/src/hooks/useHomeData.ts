import { useState, useEffect } from 'react';
import type { Group, Event } from '../types';
import { useAuth } from './useAuth';
import { usePaginatedEvents } from './useInfiniteScroll';

interface UseHomeDataReturn {
  groups: Group[];
  events: Event[];
  loading: boolean;
  allGroupEvents: Event[];
  allAvailableEvents: Event[];
  loadMoreEvents: () => void;
  hasMoreEvents: boolean;
  allEventsCount: number;
}

export const useHomeData = (selectedDate?: Date | null): UseHomeDataReturn => {
  const { user, createAuthHeaders, handleAuthError } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Use paginated events for "All Events" tab
  const { 
    events: paginatedEvents, 
    loadMore: loadMoreEvents, 
    hasMore: hasMoreEvents,
    totalCount: allEventsCount 
  } = usePaginatedEvents({ 
    createAuthHeaders, 
    handleAuthError, 
    apiUrl: '/api/events/available',
    selectedDate 
  });

  useEffect(() => {
    if (!user) return;

    const apiUrl = import.meta.env.VITE_API_URL;
    setLoading(true);

    const headers = createAuthHeaders();

    Promise.all([
      fetch(`${apiUrl}/api/groups`, { headers }),
      fetch(`${apiUrl}/api/events`, { headers }),
    ])
      .then(async ([groupsResponse, eventsResponse]) => {
        if (!groupsResponse.ok) {
          handleAuthError(groupsResponse);
          throw new Error("Failed to fetch user groups");
        }
        if (!eventsResponse.ok) {
          handleAuthError(eventsResponse);
          throw new Error("Failed to fetch events");
        }

        const [groupsData, eventsData] = await Promise.all([
          groupsResponse.json(),
          eventsResponse.json(),
        ]);

        setGroups(groupsData || []);
        setEvents(eventsData || []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, handleAuthError]);

  const allGroupEvents = groups.flatMap((group: Group) =>
    group.events
      ? group.events.map((event: Event) => ({
          ...event,
          group: {
            id: group.id,
            name: group.name,
            imageUrl: group.imageUrl,
          },
        }))
      : []
  );

  // Use paginated events as allAvailableEvents
  const allAvailableEvents = paginatedEvents;

  return {
    groups,
    events,
    loading,
    allGroupEvents,
    allAvailableEvents,
    loadMoreEvents,
    hasMoreEvents,
    allEventsCount,
  };
}; 