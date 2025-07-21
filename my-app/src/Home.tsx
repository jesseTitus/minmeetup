import { useEffect, useState } from "react";
import "./App.css";
import AppNavbar from "./AppNavbar";
import { Link, useNavigate } from "react-router-dom";
import { Button, Container, Row, Col } from "reactstrap";
import EventCalendar from "./EventCalendar";

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

// Helper to decode JWT payload
const decodeJwtPayload = (token: string) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

const Home = () => {
  // const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "user">("all");

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const token = getJwtToken();

    if (!token) {
      return;
    }

    // Extract user info from JWT
    const payload = decodeJwtPayload(token);
    if (payload) {
      setUser({
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      });
    }

    setLoading(true);

    // Fetch user's groups
    fetch(`${apiUrl}/api/groups`, {
      headers: createAuthHeaders(),
    })
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("jwt_token");
          window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch groups");
        }
        return response.json();
      })
      .then((data) => {
        if (data) {
          setGroups(data);
        }
      })
      .catch((error) => {
        console.error("Error fetching groups:", error);
      });

    // Fetch user's events
    fetch(`${apiUrl}/api/events`, {
      headers: createAuthHeaders(),
    })
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("jwt_token");
          window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        return response.json();
      })
      .then((data) => {
        if (data) {
          setEvents(data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        setLoading(false);
      });
  }, []);

  // Get all events from groups
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

  // Choose which events to display based on active tab
  const eventsToDisplay = activeTab === "all" ? allGroupEvents : events;

  // Filter events based on selected date
  const filteredEvents = selectedDate
    ? eventsToDisplay.filter((event: Event) => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === selectedDate.toDateString();
      })
    : eventsToDisplay;

  // Get user's first name
  const getFirstName = () => {
    if (!user || !user.name) return "User";
    const nameParts = user.name.split(" ");
    return nameParts[0];
  };

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
  };

  const message = user ? (
    <h3 style={{ textAlign: "left", fontWeight: "bold" }}>
      Welcome, {getFirstName()}
    </h3>
  ) : (
    <p>Please log in to manage your JUG Tour.</p>
  );

  const button = user && (
    <div>
      <Button color="link">
        <Link to="/groups">Manage JUG Tour</Link>
      </Button>
    </div>
  );

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

  const renderGroupCards = () => {
    if (!user || groups.length === 0) {
      return null;
    }

    // Show only first 4 groups
    const displayedGroups = groups.slice(0, 4);

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
          <h4 style={{ margin: 0 }}>Your Groups</h4>
          {groups.length > 4 && (
            <Link
              to="/groups"
              style={{
                fontSize: "14px",
                color: "#007bff",
                textDecoration: "none",
              }}
            >
              See all your groups ({groups.length})
            </Link>
          )}
        </div>
        <Row>
          {displayedGroups.map((group: Group) => (
            <Col key={group.id} sm={6} md={3} className="mb-3">
              <Link
                to={`/groups/${group.id}/events`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    padding: "15px",
                    textAlign: "center",
                    backgroundColor: "white",
                    height: "120px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
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
                    e.currentTarget.style.boxShadow =
                      "0 2px 4px rgba(0,0,0,0.1)";
                  }}
                >
                  <img
                    src={
                      group.imageUrl ||
                      `https://picsum.photos/60/60?random=${group.id}`
                    }
                    alt={group.name}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      margin: "0 auto 10px",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = `https://picsum.photos/60/60?random=${group.id}`;
                    }}
                  />
                  <h6 style={{ margin: 0, fontSize: "14px" }}>{group.name}</h6>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  const renderYourEvents = () => {
    if (!user || events.length === 0) {
      return null;
    }

    // Show only first 3 events
    const displayedUserEvents = events.slice(0, 3);

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
          <h4 style={{ margin: 0 }}>Your Upcoming Events</h4>
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
              onClick={() => (window.location.href = `/events/${event.id}`)}
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

  return (
    <div>
      <AppNavbar />
      <Container fluid>
        {message}
        {!user && button}

        {user && (
          <>
            <Row>
              <Col md={3}>
                <EventCalendar
                  events={eventsToDisplay}
                  onDateSelect={handleDateSelect}
                />
                {renderGroupCards()}
                <Link
                  to="/groups"
                  style={{
                    textDecoration: "none",
                    color: "#007bff",
                    fontSize: "14px",
                    display: "block",
                    marginTop: "15px",
                  }}
                >
                  Find more groups
                </Link>
                {renderYourEvents()}
              </Col>
              <Col md={9}>
                <div style={{ marginLeft: "20px", marginRight: "10%" }}>
                  {/* Event Tabs */}
                  <div style={{ marginBottom: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        borderBottom: "2px solid #e9ecef",
                        marginBottom: "20px",
                      }}
                    >
                      <button
                        onClick={() => setActiveTab("all")}
                        style={{
                          padding: "10px 20px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          borderBottom:
                            activeTab === "all"
                              ? "2px solid #007bff"
                              : "2px solid transparent",
                          color: activeTab === "all" ? "#007bff" : "#666",
                          fontWeight: activeTab === "all" ? "bold" : "normal",
                          fontSize: "16px",
                        }}
                      >
                        All Events ({allGroupEvents.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("user")}
                        style={{
                          padding: "10px 20px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          borderBottom:
                            activeTab === "user"
                              ? "2px solid #007bff"
                              : "2px solid transparent",
                          color: activeTab === "user" ? "#007bff" : "#666",
                          fontWeight: activeTab === "user" ? "bold" : "normal",
                          fontSize: "16px",
                        }}
                      >
                        Your Events ({events.length})
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: "10px" }}>
                    {filteredEvents.length === 0 ? (
                      <p>No events to display.</p>
                    ) : (
                      <div>
                        {filteredEvents.map((event: Event) => (
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
                              transition:
                                "transform 0.2s ease, box-shadow 0.2s ease",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                              e.currentTarget.style.boxShadow =
                                "0 4px 8px rgba(0,0,0,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow =
                                "0 2px 4px rgba(0,0,0,0.1)";
                            }}
                            onClick={() =>
                              (window.location.href = `/events/${event.id}`)
                            }
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
                                  event.group?.imageUrl ||
                                  `https://picsum.photos/80/80?random=${
                                    event.group?.id || 1
                                  }`
                                }
                                alt={event.group?.name || "Group"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = `https://picsum.photos/80/80?random=${
                                    event.group?.id || 1
                                  }`;
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
                                {event.description &&
                                event.description.length > 100
                                  ? event.description.substring(0, 100) + "..."
                                  : event.description || ""}
                              </div>

                              {/* Blank line */}
                              <div style={{ height: "8px" }}></div>

                              {/* Attendee count */}
                              {event.attendees && (
                                <div
                                  style={{ fontSize: "12px", color: "#888" }}
                                >
                                  {event.attendees.length} attendee
                                  {event.attendees.length !== 1 ? "s" : ""}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default Home;
