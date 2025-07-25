import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface CalendarDatesReturn {
  eventDates: { [date: string]: number }; // date -> event count
  loading: boolean;
  totalEvents: number;
}

export const useCalendarDates = (): CalendarDatesReturn => {
  const { createAuthHeaders, handleAuthError, user } = useAuth();
  const [eventDates, setEventDates] = useState<{ [date: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    if (!user) {
      setEventDates({});
      setTotalEvents(0);
      return;
    }

    const fetchCalendarDates = async () => {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL;

      try {
        const response = await fetch(`${apiUrl}/api/events/calendar-dates`, {
          headers: createAuthHeaders(),
        });

        if (!response.ok) {
          handleAuthError(response);
          throw new Error('Failed to fetch calendar dates');
        }

        const data = await response.json();
        setEventDates(data.eventDates || {});
        setTotalEvents(data.totalEvents || 0);
      } catch (error) {
        console.error('Error fetching calendar dates:', error);
        setEventDates({});
        setTotalEvents(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarDates();
  }, [user, createAuthHeaders, handleAuthError]);

  return {
    eventDates,
    loading,
    totalEvents,
  };
}; 