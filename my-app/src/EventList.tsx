import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Card,
  CardBody,
  CardTitle,
} from "reactstrap";
import { useCookies } from "react-cookie";
import AppNavbar from "./AppNavbar";
import { Link, useNavigate, useParams } from "react-router-dom";

interface Event {
  id: number;
  date: string;
  title: string;
  description: string;
  attendees?: User[];
  group?: Group;
}

interface Group {
  id: number;
  name: string;
  imageUrl?: string;
  address?: string;
  city?: string;
  stateOrProvince?: string;
  country?: string;
  postalCode?: string;
  events?: Event[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

const EventList = () => {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId) return;

    setLoading(true);

    fetch(`/api/groups/${groupId}`, { credentials: "include" })
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/oauth2/authorization/auth0";
          return;
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setGroup(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching group:", error);
        setLoading(false);
        alert("Unable to load group events. Please try logging in again.");
      });
  }, [groupId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!group) {
    return <p>Group not found</p>;
  }

  const address = `${group.address || ""} ${group.city || ""} ${
    group.stateOrProvince || ""
  }`.trim();

  // Sort events by date
  const sortedEvents = (group.events || []).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Group events by date
  const groupedEvents = sortedEvents.reduce((groups, event) => {
    const eventDate = new Date(event.date);
    const dateKey = eventDate.toDateString(); // Use date string as key

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, typeof sortedEvents>);

  const eventCards = Object.entries(groupedEvents).map(([dateKey, events]) => {
    const date = new Date(dateKey);
    const formattedDateHeader = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "2-digit",
    }).format(date);

    return (
      <div key={dateKey} style={{ marginBottom: "30px" }}>
        <h3
          style={{
            color: "#333",
            marginBottom: "15px",
            borderBottom: "2px solid #666",
            paddingBottom: "5px",
            textAlign: "left",
          }}
        >
          {formattedDateHeader}
        </h3>
        {events.map((event) => {
          const eventDate = new Date(event.date);
          const day = eventDate
            .toLocaleDateString("en-US", { weekday: "short" })
            .toUpperCase();
          const month = eventDate
            .toLocaleDateString("en-US", { month: "short" })
            .toUpperCase();
          const date = eventDate.getDate();
          const time = eventDate
            .toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
            .toUpperCase();
          const timezone = "EDT"; // You might want to make this dynamic based on user's timezone
          const formattedDateTime = `${day}, ${month} ${date} - ${time} ${timezone}`;

          const truncatedDescription = event.description
            ? (event.description.length > 32
                ? event.description.substring(0, 32) + "..."
                : event.description)
            : "";

          const attendeeCount = event.attendees ? event.attendees.length : 0;

          return (
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
              {/* Group image on the left */}
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
                    group.imageUrl ||
                    `https://picsum.photos/80/80?random=${group.id}`
                  }
                  alt={group.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/80/80?random=${group.id}`;
                  }}
                />
              </div>

              {/* Content on the right */}
              <div style={{ flex: 1, textAlign: "left" }}>
                {/* Time in bronze */}
                <div
                  style={{
                    color: "#8B4513",
                    fontSize: "14px",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  {formattedDateTime}
                </div>

                {/* Title bolded */}
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                    marginBottom: "8px",
                  }}
                >
                  {event.title}
                </div>

                {/* Description truncated */}
                <div
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "8px",
                  }}
                >
                  {truncatedDescription}
                </div>

                {/* Blank line */}
                <div style={{ height: "8px" }}></div>

                {/* Attendee count */}
                <div style={{ fontSize: "12px", color: "#888" }}>
                  {attendeeCount} attendee{attendeeCount !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  });

  return (
    <div>
      <AppNavbar />
      <Container fluid>
        <div className="float-end">
          <Button color="secondary" tag={Link} to="/groups">
            Back to Groups
          </Button>
        </div>
        <Card>
          <CardBody>
            <CardTitle tag="h3">{group.name} - Events</CardTitle>
            {address && <p className="text-muted">Location: {address}</p>}
            <p className="text-muted">
              {group.events?.length || 0} event(s) found
            </p>
            <Button color="success" tag={Link} to={`/groups/${groupId}/events/new`}>
              Add New Event
            </Button>
          </CardBody>
        </Card>
        
        {/* Event Cards */}
        <div style={{ marginTop: "20px" }}>
          {group.events && group.events.length > 0 ? (
            eventCards
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#666",
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "12px",
              }}
            >
              <p>No events found for this group</p>
              <Button color="primary" tag={Link} to={`/groups/${groupId}/events/new`}>
                Create First Event
              </Button>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default EventList;
