import { useEffect, useState } from "react";
import {
  Button,
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
} from "reactstrap";
import AppNavbar from "./AppNavbar";
import { Link, useParams, useNavigate } from "react-router-dom";

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

const EventList = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [events, setEvents] = useState<Event[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId) return;

    const apiUrl = import.meta.env.VITE_API_URL;
    const token = getJwtToken();

    if (!token) {
      window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
      return;
    }

    // Fetch group details and user's groups
    Promise.all([
      fetch(`${apiUrl}/api/groups/${groupId}`, {
        headers: createAuthHeaders(),
      }),
      fetch(`${apiUrl}/api/groups`, {
        headers: createAuthHeaders(),
      }),
    ])
      .then(async ([groupResponse, userGroupsResponse]) => {
        if (
          groupResponse.status === 401 ||
          groupResponse.status === 403 ||
          userGroupsResponse.status === 401 ||
          userGroupsResponse.status === 403
        ) {
          localStorage.removeItem("jwt_token");
          window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
          return;
        }

        if (!groupResponse.ok || !userGroupsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const groupData = await groupResponse.json();
        const userGroups = await userGroupsResponse.json();

        setGroup(groupData);
        setEvents(groupData.events || []);

        // Check if user is a member
        const userGroupIds = userGroups.map((g: Group) => g.id);
        setIsMember(userGroupIds.includes(parseInt(groupId)));
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching group data:", error);
        setLoading(false);
      });
  }, [groupId]);

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

  if (!group) {
    return (
      <div>
        <AppNavbar />
        <Container>
          <p>Group not found</p>
          <Button color="primary" onClick={() => navigate("/groups")}>
            Back to Groups
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <AppNavbar />
      <Container fluid>
        <div className="float-end">
          <Button color="secondary" tag={Link} to="/groups">
            Back to Groups
          </Button>
          {isMember && (
            <Button
              color="primary"
              tag={Link}
              to={`/groups/${groupId}/events/new`}
              style={{ marginLeft: "10px" }}
            >
              New Event
            </Button>
          )}
        </div>

        <h3>{group.name} Events</h3>
        <p>
          {group.address} {group.city} {group.stateOrProvince}
        </p>

        {events.length === 0 ? (
          <Card>
            <CardBody>
              <CardTitle tag="h5">No Events Scheduled</CardTitle>
              <p>There are currently no events scheduled for this group.</p>
              {isMember && (
                <Button
                  color="primary"
                  tag={Link}
                  to={`/groups/${groupId}/events/new`}
                >
                  Create First Event
                </Button>
              )}
            </CardBody>
          </Card>
        ) : (
          <Row>
            {events.map((event) => (
              <Col key={event.id} md={6} lg={4} className="mb-4">
                <Card
                  style={{
                    height: "100%",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
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
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <CardBody>
                    <CardTitle tag="h5">{event.title}</CardTitle>
                    <p style={{ fontSize: "14px", color: "#666" }}>
                      {new Intl.DateTimeFormat("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(event.date))}
                    </p>
                    <p>{event.description}</p>
                    {event.attendees && (
                      <p style={{ fontSize: "12px", color: "#888" }}>
                        {event.attendees.length} attendee
                        {event.attendees.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default EventList;
