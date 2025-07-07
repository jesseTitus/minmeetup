import React, { useEffect, useState } from "react";
import "./App.css";
import AppNavbar from "./AppNavbar";
import { Link, useNavigate } from "react-router-dom";
import { Button, Container, Table, Row, Col } from "reactstrap";
import { useCookies } from "react-cookie";
import Map from "./Map";
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

interface SimpleGroup {
  id: number;
  name: string;
  imageUrl?: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [cookies] = useCookies(["XSRF-TOKEN"]);
  const [simpleGroups, setSimpleGroups] = useState<SimpleGroup[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/user", { credentials: "include" })
      .then((response) => response.text())
      .then((body) => {
        if (body === "") {
          setAuthenticated(false);
        } else {
          setUser(JSON.parse(body));
          setAuthenticated(true);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
        setLoading(false);
      });
  }, []);

  // Fetch groups when user is authenticated
  useEffect(() => {
    if (authenticated && user) {
      // Fetch full groups with events
      fetch("/api/groups", { credentials: "include" })
        .then((response) => response.json())
        .then((data) => setGroups(data))
        .catch((error) => {
          console.error("Error fetching groups:", error);
        });

      // Fetch simple groups for the cards
      fetch("/api/groups", { credentials: "include" })
        .then((response) => response.json())
        .then((data) => {
          const simple = data.map((group: Group) => ({
            id: group.id,
            name: group.name,
            imageUrl: group.imageUrl,
          }));
          setSimpleGroups(simple);
        })
        .catch((error) => {
          console.error("Error fetching simple groups:", error);
        });
    }
  }, [authenticated, user]);

  // Collect all events from all groups for the calendar
  const allEvents = groups.flatMap((group) =>
    (group.events || []).map((event) => ({
      ...event,
      group: group,
    }))
  );

  // Filter events based on selected date
  const filteredEvents = (
    selectedDate
      ? allEvents.filter((event) => {
          const eventDate = new Date(event.date);
          // Set time to start of day for comparison
          const eventDateOnly = new Date(
            eventDate.getFullYear(),
            eventDate.getMonth(),
            eventDate.getDate()
          );
          const selectedDateOnly = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
          );
          return eventDateOnly >= selectedDateOnly;
        })
      : allEvents
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get user's first name
  const getFirstName = () => {
    if (!user || !user.name) return "User";

    // Split the full name and get the first part
    const nameParts = user.name.split(" ");
    return nameParts[0];
  };

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
  };

  const login = () => {
    let port = window.location.port ? ":" + window.location.port : "";
    if (port === ":5173") {
      // Vite's default port
      port = ":8080";
    }
    // redirect to a protected URL to trigger authentication
    window.location.href = `//${window.location.hostname}${port}/api/private`;
  };

  const message = user ? (
    <h2 style={{ textAlign: "left", fontWeight: "bold" }}>
      Welcome, {getFirstName()} 👋
    </h2>
  ) : (
    <p>Please log in to manage your JUG Tour.</p>
  );

  const button = authenticated ? (
    <div>
      <Button color="link">
        <Link to="/groups">Manage JUG Tour</Link>
      </Button>
      <br />
    </div>
  ) : (
    <Button color="primary" onClick={login}>
      Login
    </Button>
  );

  // Group events by date
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const eventDate = new Date(event.date);
    const dateKey = eventDate.toDateString(); // Use date string as key

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, typeof filteredEvents>);

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

          const truncatedDescription =
            event.description.length > 32
              ? event.description.substring(0, 32) + "..."
              : event.description;

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
                    event.group?.imageUrl ||
                    `https://picsum.photos/80/80?random=${event.group?.id || 1}`
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

  const renderGroupCards = () => {
    if (!authenticated || simpleGroups.length === 0) {
      return null;
    }

    // Show only first 4 groups
    const displayedGroups = simpleGroups.slice(0, 4);

    return (
      <div style={{ marginTop: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h4 style={{ margin: 0 }}>Your Groups</h4>
          {simpleGroups.length > 4 && (
            <Link
              to="/groups"
              style={{
                textDecoration: "none",
                color: "#007bff",
                fontSize: "14px",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.textDecoration = "underline")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.textDecoration = "none")
              }
            >
              See all your groups ({simpleGroups.length})
            </Link>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {displayedGroups.map((group) => (
            <div
              key={group.id}
              style={{
                padding: "15px",
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
              onClick={() =>
                (window.location.href = `/groups/${group.id}/events`)
              }
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <img
                src={
                  group.imageUrl ||
                  `https://picsum.photos/40/40?random=${group.id}`
                }
                alt={group.name}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "4px",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  e.currentTarget.src = `https://picsum.photos/40/40?random=${group.id}`;
                }}
              />
              <span>{group.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderYourEvents = () => {
    if (!authenticated || allEvents.length === 0) {
      return null;
    }

    // Show only first 3 events
    const displayedEvents = allEvents.slice(0, 3);

    return (
      <div style={{ marginTop: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h4 style={{ margin: 0 }}>Your Events</h4>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {displayedEvents.map((event) => (
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
              onClick={() =>
                (window.location.href = `/events/${event.id}`)
              }
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
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                {new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(event.date))}
              </div>
              <div style={{ fontSize: "12px", color: "#888" }}>
                {event.description.length > 60
                  ? `${event.description.substring(0, 60)}...`
                  : event.description}
              </div>
              {event.group && (
                <div style={{ fontSize: "11px", color: "#007bff", marginTop: "5px" }}>
                  {event.group.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <AppNavbar />
      <Container fluid>
        {message}
        {!authenticated && button}

        {authenticated && (
          <>
            <Row>
              <Col md={3}>
                <EventCalendar
                  events={allEvents}
                  onDateSelect={handleDateSelect}
                />
                <Map />
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
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.textDecoration =
                      "underline")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.textDecoration = "none")
                  }
                >
                  Find more groups
                </Link>
                {renderYourEvents()}
              </Col>
              <Col md={7}>
                <div style={{ marginLeft: "20px", marginRight: "10%" }}>
                  <div style={{ marginTop: "10px" }}>{eventCards}</div>
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
