import React from "react";
import { useNavigate } from "react-router-dom";
import type { Event } from "../types";

interface UserEventsListProps {
  events: Event[];
  maxDisplayed?: number;
}

const UserEventsList: React.FC<UserEventsListProps> = ({
  events,
  maxDisplayed = 3,
}) => {
  const navigate = useNavigate();

  if (events.length === 0) {
    return null;
  }

  const displayedUserEvents = events.slice(0, maxDisplayed);

  return (
    <div style={{ marginBottom: "30px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h4 style={{ margin: 0, fontSize: "20px" }}>Your Upcoming Events</h4>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {displayedUserEvents.map((event: Event) => (
          <div
            key={event.id}
            style={{
              padding: "15px",
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onClick={() => navigate(`/events/${event.id}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
              {event.title}
            </div>
            <div
              style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}
            >
              {new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(event.date))}
            </div>
            <div style={{ fontSize: "12px", color: "#888" }}>
              {event.description && event.description.length > 60
                ? `${event.description.substring(0, 60)}...`
                : event.description || ""}
            </div>
            {event.group && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#007bff",
                  marginTop: "5px",
                }}
              >
                {event.group.name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserEventsList;
