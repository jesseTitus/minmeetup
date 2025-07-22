import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Container, Row, Col, Card, CardBody } from "reactstrap";
import AppNavbar from "./AppNavbar";
import type { Event } from "./types";

// Helper function to get the JWT from localStorage
const getJwtToken = () => {
  return localStorage.getItem("jwt_token");
};

// Helper to create authorized headers
const createAuthHeaders = () => {
  const token = getJwtToken();
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const apiUrl = import.meta.env.VITE_API_URL;
    const token = getJwtToken();

    if (!token) {
      window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
      return;
    }

    // Fetch the specific event
    fetch(`${apiUrl}/api/events/${id}`, {
      headers: createAuthHeaders(),
    })
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("jwt_token");
          window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
          return;
        }
        if (!response.ok) {
          throw new Error("Event not found");
        }
        return response.json();
      })
      .then((data) => {
        if (data) {
          setEvent(data);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error fetching event:", error);
        setError("Failed to load event");
        setLoading(false);
      });

    // Fetch user's events to check if they're attending
    fetch(`${apiUrl}/api/events`, {
      headers: createAuthHeaders(),
    })
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("jwt_token");
          window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
          return;
        }
        if (response.ok) {
          return response.json();
        }
        return [];
      })
      .then((data) => {
        if (data) {
          setUserEvents(data);
        }
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
    console.log("Joining event:", event.id);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(
        `${apiUrl}/api/events/${event.id}/attendees`,
        {
          method: "POST",
          headers: createAuthHeaders(),
        }
      );

      console.log("Join response status:", response.status);

      if (response.ok) {
        console.log("Successfully joined event");
        // Refresh the event data
        const updatedEvent = await fetch(`${apiUrl}/api/events/${event.id}`, {
          headers: createAuthHeaders(),
        }).then((res) => res.json());
        setEvent(updatedEvent);

        // Refresh user events
        const updatedUserEvents = await fetch(`${apiUrl}/api/events`, {
          headers: createAuthHeaders(),
        }).then((res) => res.json());
        setUserEvents(updatedUserEvents);
      } else {
        const errorText = await response.text();
        console.error("Failed to join event:", response.status, errorText);
        alert("Failed to join event. Please try again.");
      }
    } catch (error) {
      console.error("Error joining event:", error);
      alert("Error joining event. Please try again.");
    }
  };

  // Function to leave an event
  const leaveEvent = async (event: Event) => {
    console.log("Leaving event:", event.id);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(
        `${apiUrl}/api/events/${event.id}/attendees`,
        {
          method: "DELETE",
          headers: createAuthHeaders(),
        }
      );

      console.log("Leave response status:", response.status);

      if (response.ok) {
        console.log("Successfully left event");
        // Refresh the event data
        const updatedEvent = await fetch(`${apiUrl}/api/events/${event.id}`, {
          headers: createAuthHeaders(),
        }).then((res) => res.json());
        setEvent(updatedEvent);

        // Refresh user events
        const updatedUserEvents = await fetch(`${apiUrl}/api/events`, {
          headers: createAuthHeaders(),
        }).then((res) => res.json());
        setUserEvents(updatedUserEvents);
      } else {
        const errorText = await response.text();
        console.error("Failed to leave event:", response.status, errorText);
        alert("Failed to leave event. Please try again.");
      }
    } catch (error) {
      console.error("Error leaving event:", error);
      alert("Error leaving event. Please try again.");
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
                    {event.group && (
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#666",
                          margin: "5px 0",
                        }}
                      >
                        Group: {event.group.name}
                      </p>
                    )}
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
                  <h6>Attendees ({attendeeCount})</h6>
                  {event.attendees && event.attendees.length > 0 && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                          marginBottom: "10px",
                        }}
                      >
                        {event.attendees.slice(0, 4).map((attendee) => {
                          const nameParts = attendee.name.split(" ");
                          const firstName = nameParts[0];
                          const displayName = `${firstName}`;

                          return (
                            <div
                              key={attendee.id}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                backgroundColor: "white",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "8px",
                                minWidth: "60px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              }}
                            >
                              <img
                                src={
                                  attendee.profilePictureUrl ||
                                  `https://picsum.photos/40/40?random=${attendee.id}`
                                }
                                alt={displayName}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  marginBottom: "4px",
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = `https://picsum.photos/40/40?random=${attendee.id}`;
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "12px",
                                  textAlign: "center",
                                }}
                              >
                                {displayName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {event.attendees.length > 4 && (
                        <p
                          style={{ fontSize: "14px", color: "#666", margin: 0 }}
                        >
                          + {event.attendees.length - 4} more attendee
                          {event.attendees.length - 4 !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
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
