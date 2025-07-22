import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event } from '../types';

interface EventListProps {
  events: Event[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  const navigate = useNavigate();

  if (events.length === 0) {
    return <p>No events to display.</p>;
  }

  return (
    <div style={{ marginTop: "10px" }}>
      {events.map((event: Event) => (
        <div
          key={event.id}
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
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
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
                `https://picsum.photos/id/${(((event.group?.id || 1) % 1000) + 1)}/80/80`
              }
              alt={event.group?.name || "Group"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              onError={(e) => {
                e.currentTarget.src = `https://picsum.photos/id/${(((event.group?.id || 1) % 1000) + 1)}/80/80`;
              }}
            />
          </div>

          <div style={{ flex: 1, textAlign: "left" }}>
            <div
              style={{
                color: "#8B4513",
                fontSize: "14px",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              {new Intl.DateTimeFormat("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
                .format(new Date(event.date))
                .toUpperCase()}
            </div>

            <div
              style={{
                fontWeight: "bold",
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
  );
};

export default EventList; 