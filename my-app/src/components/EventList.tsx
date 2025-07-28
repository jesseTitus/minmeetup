import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Event } from "../types";

interface EventListProps {
  events: Event[];
}

// Helper function to group events by date
const groupEventsByDate = (events: Event[]) => {
  const groups: { [key: string]: Event[] } = {};

  events.forEach((event) => {
    const eventDate = new Date(event.date);
    const dateKey = eventDate.toDateString(); // e.g., "Thu Jul 24 2025"

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
  });

  // Sort groups by date
  const sortedGroups = Object.keys(groups)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map((dateKey) => ({
      dateKey,
      date: new Date(dateKey),
      events: groups[dateKey].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    }));

  return sortedGroups;
};

const EventList: React.FC<EventListProps> = ({ events }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (events.length === 0) {
    return <p>No events to display.</p>;
  }

  // Helper function to check if user is attending an event
  const isUserAttending = (event: Event) => {
    if (!user || !event.attendees) return false;
    return event.attendees.some((attendee) => attendee.id === user.id);
  };

  // Remove duplicates based on event ID to fix the key error
  const uniqueEvents = events.filter(
    (event, index, self) => index === self.findIndex((e) => e.id === event.id)
  );

  const groupedEvents = groupEventsByDate(uniqueEvents);

  return (
    <div style={{ marginTop: "10px" }}>
      {groupedEvents.map(({ dateKey, date, events: dayEvents }, groupIndex) => (
        <div key={dateKey} style={{ marginBottom: "30px" }}>
          {/* Date Header */}
          <div style={{ marginBottom: "20px" }}>
            <h3
              style={{
                textAlign: "left",
                fontSize: "20px",
                fontWeight: "bold",
                color: "#333",
                margin: "0 0 10px 0",
              }}
            >
              {(() => {
                const today = new Date();
                const isToday = date.toDateString() === today.toDateString();

                if (isToday) {
                  return "Today";
                }

                return new Intl.DateTimeFormat("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }).format(date);
              })()}
            </h3>
            <hr
              style={{
                border: "none",
                height: "2px",
                backgroundColor: "#3f3f3f",
                margin: "0 0 20px 0",
              }}
            />
          </div>

          {/* Events for this date */}
          <div>
            {dayEvents.map((event: Event, eventIndex) => (
              <div
                key={`${event.id}-${groupIndex}-${eventIndex}`} // Unique key to prevent conflicts
                style={{
                  display: "flex",
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "15px",
                  marginBottom: "15px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 8px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                }}
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "8px",
                    marginRight: "15px",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={
                      event.group?.imageUrl ||
                      `https://picsum.photos/id/${
                        ((event.group?.id || 1) % 1000) + 1
                      }/80/80`
                    }
                    alt={event.group?.name || "Group"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = `https://picsum.photos/id/${
                        ((event.group?.id || 1) % 1000) + 1
                      }/80/80`;
                    }}
                  />
                </div>

                <div style={{ flex: 1, textAlign: "left" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "5px",
                    }}
                  >
                    <div
                      style={{
                        color: "#8f725dff",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      {(() => {
                        const formatted = new Intl.DateTimeFormat("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(event.date));

                        // Split the formatted string to manipulate parts
                        // Format: "Mon, Jul 24, 7:30 AM"
                        const parts = formatted.split(", ");
                        const dayPart = parts[0].toUpperCase(); // "MON"
                        const monthDayPart = parts[1].toUpperCase(); // "JUL 24"
                        const timePart = parts[2]; // "7:30 AM"

                        return `${dayPart}, ${monthDayPart} • ${timePart} EDT`;
                      })()}
                    </div>

                    {!isUserAttending(event) && (
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: "500",
                          color: "#4c4c4c",
                        }}
                      >
                        Suggested
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: "16px",
                      marginBottom: "8px",
                    }}
                  >
                    {event.title}
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "8px",
                    }}
                  >
                    {event.description && event.description.length > 100
                      ? event.description.substring(0, 100) + "..."
                      : event.description || ""}
                  </div>

                  <div style={{ height: "8px" }}></div>

                  {event.attendees && (
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      {event.attendees.length} attendee
                      {event.attendees.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventList;
