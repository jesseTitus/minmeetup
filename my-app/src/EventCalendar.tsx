import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./EventCalendar.css";

interface Event {
  id: number;
  date: string;
  title: string;
  description: string;
}

interface EventCalendarProps {
  events: Event[]; // Still used for other functionality
  calendarDates?: { [date: string]: number }; // New: all event dates with counts
  onDateSelect?: (date: Date | null) => void;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ 
  events, 
  calendarDates = {}, 
  onDateSelect 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Create a Set of dates that have events using calendarDates if available, otherwise fallback to events
  const eventDates = new Set(
    Object.keys(calendarDates).length > 0
      ? Object.keys(calendarDates).map((dateString) => {
          const date = new Date(dateString + 'T00:00:00'); // Parse YYYY-MM-DD format
          return date.toDateString();
        })
      : events.map((event) => {
          const date = new Date(event.date);
          return date.toDateString();
        })
  );

  

  // Custom tile content to show dots on days with events
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dateString = date.toDateString();
      if (eventDates.has(dateString)) {
        
        return (
          <div className="event-dot" >
            •
          </div>
        );
      }
    }
    return null;
  };

  // Custom tile class to style days with events
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dateString = date.toDateString();
      if (eventDates.has(dateString)) {
        return "has-event";
      }
    }
    return null;
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Clear filter
  const clearFilter = () => {
    setSelectedDate(null);
    if (onDateSelect) {
      onDateSelect(null);
    }
  };

  return (
    <div className="event-calendar">
      <h4>Event Calendar</h4>
      <Calendar
        tileContent={tileContent}
        tileClassName={tileClassName}
        className="custom-calendar"
        onClickDay={handleDateClick}
        value={selectedDate}
      />
      
      {/* Filter status and clear button */}
      {selectedDate && (
        <div className="calendar-filter">
          <div className="filter-info">
            Showing events from {selectedDate.toLocaleDateString()}
          </div>
          <button 
            className="clear-filter-btn"
            onClick={clearFilter}
          >
            Show All Events
          </button>
        </div>
      )}

    </div>
  );
};

export default EventCalendar; 