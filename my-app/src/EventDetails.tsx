import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Container, Row, Col, Card, CardBody } from "reactstrap";
import AppNavbar from "./AppNavbar";

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
}

interface User {
  id: string;
  name: string;
  email: string;
}

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Fetch the specific event
    fetch(`/api/events/${id}`, { credentials: "include" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Event not found");
        }
        return response.json();
      })
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching event:", error);
        setError("Failed to load event");
        setLoading(false);
      });

    // Fetch user's events to check if they're attending
    fetch("/api/events", { credentials: "include" })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return [];
      })
      .then((data) => {
        setUserEvents(data);
      })
      .catch((error) => {
        console.error("Error fetching user events:", error);
      });
  }, [id]);

  // Helper function to check if user is attending this event
  const isUserAttendee = (event: Event) => {
    return userEvents.some((userEvent) => userEvent.id === event.id);
  };

  // Function to join an event
  const joinEvent = async (event: Event) => {
    try {
      const response = await fetch(`/api/events/${event.id}/attend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        // Refresh the event data
        const updatedEvent = await fetch(`/api/events/${event.id}`, {
          credentials: "include",
        }).then((res) => res.json());
        setEvent(updatedEvent);

        // Refresh user events
        const updatedUserEvents = await fetch("/api/events", {
          credentials: "include",
        }).then((res) => res.json());
        setUserEvents(updatedUserEvents);
      } else {
        console.error("Failed to join event");
      }
    } catch (error) {
      console.error("Error joining event:", error);
    }
  };

  // Function to leave an event
  const leaveEvent = async (event: Event) => {
    try {
      const response = await fetch(`/api/events/${event.id}/attend`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Refresh the event data
        const updatedEvent = await fetch(`/api/events/${event.id}`, {
          credentials: "include",
        }).then((res) => res.json());
        setEvent(updatedEvent);

        // Refresh user events
        const updatedUserEvents = await fetch("/api/events", {
          credentials: "include",
        }).then((res) => res.json());
        setUserEvents(updatedUserEvents);
      } else {
        console.error("Failed to leave event");
      }
    } catch (error) {
      console.error("Error leaving event:", error);
    }
  };

  if (loading) {
    return (
      <div>
        <AppNavbar />
        <Container>
          <p>Loading...</p>
        </Container>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div>
        <AppNavbar />
        <Container>
          <p>Event not found</p>
          <Button color="primary" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </Container>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(eventDate);

  const attendeeCount = event.attendees ? event.attendees.length : 0;

  const isAttendee = isUserAttendee(event);
  return (
    <div>
      <AppNavbar />
      <Container>
        <div style={{ marginTop: "20px", marginBottom: "20px" }}>
          <Button color="secondary" onClick={() => navigate("/")}>
            ← Back to Home
          </Button>
        </div>

        <Row>
          <Col md={8}>
            <Card>
              <CardBody>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <img
                    src={
                      event.group?.imageUrl ||
                      `https://picsum.photos/100/100?random=${
                        event.group?.id || 1
                      }`
                    }
                    alt={event.group?.name || "Group"}
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      marginRight: "20px",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = `https://picsum.photos/100/100?random=${
                        event.group?.id || 1
                      }`;
                    }}
                  />
                  <div>
                    <h2 style={{ margin: 0, color: "#333" }}>{event.title}</h2>
                    <p style={{ margin: "5px 0", color: "#666" }}>
                      {event.group?.name}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <h5 style={{ color: "#8B4513", marginBottom: "10px" }}>
                    📅 {formattedDate}
                  </h5>
                  <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
                    {event.description}
                  </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <h6>Attendees</h6>
                  <p>
                    {attendeeCount} attendee{attendeeCount !== 1 ? "s" : ""}
                  </p>
                  {event.attendees && event.attendees.length > 0 && (
                    <ul>
                      {event.attendees.map((attendee) => (
                        <li key={attendee.id}>{attendee.name}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {event.group && (
                  <div style={{ marginBottom: "20px" }}>
                    <h6>Location</h6>
                    <p>
                      {event.group.address && `${event.group.address}, `}
                      {event.group.city && `${event.group.city}, `}
                      {event.group.stateOrProvince &&
                        `${event.group.stateOrProvince}, `}
                      {event.group.country && `${event.group.country}`}
                      {event.group.postalCode && ` ${event.group.postalCode}`}
                    </p>
                  </div>
                )}

                <div style={{ marginTop: "30px" }}>
                  <Button
                    size="sm"
                    color="primary"
                    onClick={() => navigate(`/events/${event.id}/edit`)}
                    style={{ marginRight: "10px" }}
                  >
                    Edit Event
                  </Button>
                  <Button
                    size="sm"
                    color="secondary"
                    onClick={() =>
                      navigate(`/groups/${event.group?.id}/events`)
                    }
                    style={{ marginRight: "10px" }}
                  >
                    View Group Events
                  </Button>
                  <Button
                    size="sm"
                    color={isAttendee ? "danger" : "success"}
                    onClick={() =>
                      isAttendee ? leaveEvent(event) : joinEvent(event)
                    }
                  >
                    {isAttendee ? "Leave" : "Join"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EventDetails;
