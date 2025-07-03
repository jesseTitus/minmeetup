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
  events: Event[];
  onDateSelect?: (date: Date | null) => void;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ events, onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Create a Set of dates that have events (for efficient lookup)
  const eventDates = new Set(
    events.map((event) => {
      const date = new Date(event.date);
      return date.toDateString(); // Use toDateString() for date-only comparison
    })
  );

  // Custom tile content to show dots on days with events
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dateString = date.toDateString();
      if (eventDates.has(dateString)) {
        return (
          <div className="event-dot" title="You have an event on this day">
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

      {events.length > 0 && (
        <div className="calendar-legend">
          <div className="legend-item">
            <span className="event-dot">•</span>
            <span>Days with events</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar; 