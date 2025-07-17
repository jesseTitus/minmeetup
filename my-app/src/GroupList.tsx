import { useEffect, useState } from "react";
import { Button, Container, Row, Col, Card, CardBody } from "reactstrap";
import { useCookies } from "react-cookie";
import AppNavbar from "./AppNavbar";
import { Link } from "react-router-dom";

interface Event {
  id: number;
  date: string;
  title: string;
  description: string;
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
  isMember?: boolean;
}

// Custom hook to reliably get CSRF token
const useCsrfToken = () => {
  const [cookies] = useCookies(["XSRF-TOKEN"]);

  //TODO - proper fix for token undefined in this component
  const getCsrfToken = () => {
    // Try useCookies first
    if (cookies["XSRF-TOKEN"]) {
      return cookies["XSRF-TOKEN"];
    }

    // Fallback to document.cookie
    const value = `; ${document.cookie}`;
    const parts = value.split(`; XSRF-TOKEN=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }

    return null;
  };

  return getCsrfToken();
};

const GroupList = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const csrfToken = useCsrfToken();

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL;

      try {
        // 1. First, ensure we have user data AND XSRF token
        const userResponse = await fetch(`${apiUrl}/api/user`, {
          credentials: "include",
        });

        if (userResponse.ok) {
          const userText = await userResponse.text();
          if (userText) {
            setUser(JSON.parse(userText));
          }
        }

        // Small delay to ensure cookie is set
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 3. Now fetch groups data (token should be available)
        const allGroupsResponse = await fetch(
          `${apiUrl}/api/groups/available`,
          { credentials: "include" }
        );
        const userGroupsResponse = await fetch(`${apiUrl}/api/groups`, {
          credentials: "include",
        });

        if (allGroupsResponse.ok && userGroupsResponse.ok) {
          const [allGroups, userGroups] = await Promise.all([
            allGroupsResponse.json(),
            userGroupsResponse.json(),
          ]);

          // Your existing logic to merge and sort groups
          const userGroupIds = new Set(
            userGroups.map((group: Group) => group.id)
          );
          const sortedGroups = allGroups
            .map((group: Group) => ({
              ...group,
              isMember: userGroupIds.has(group.id),
            }))
            .sort((a: Group, b: Group) => {
              // Sort by membership status first (members first), then by name
              if (a.isMember && !b.isMember) return -1;
              if (!a.isMember && b.isMember) return 1;
              return a.name.localeCompare(b.name);
            });

          setGroups(sortedGroups);
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const leaveGroup = async (group: Group) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/groups/members/${group.id}`, {
        method: "DELETE",
        headers: {
          "X-XSRF-TOKEN": csrfToken,
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
        return;
      }

      if (response.ok) {
        // Refresh the page to update the button states
        window.location.reload();
      } else {
        console.error("Failed to leave group");
        alert("Failed to leave group. Please try again.");
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Error leaving group. Please try logging in again.");
    }
  };

  const joinGroup = async (group: Group) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/groups/members/${group.id}`, {
        method: "POST",
        headers: {
          "X-XSRF-TOKEN": csrfToken,
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
        return;
      }

      if (response.ok) {
        // Refresh the page to update the button states
        window.location.reload();
      } else {
        console.error("Failed to join group");
        alert("Failed to join group. Please try again.");
      }
    } catch (error) {
      console.error("Error joining group:", error);
      alert("Error joining group. Please try logging in again.");
    }
  };

  // Get user's first name
  const getFirstName = () => {
    if (!user || !user.name) return "User";

    // Split the full name and get the first part
    const nameParts = user.name.split(" ");
    return nameParts[0];
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  const groupCards = groups.map((group) => {
    const address = `${group.address || ""} ${group.city || ""} ${
      group.stateOrProvince || ""
    }`.trim();

    const eventCount = group.events ? group.events.length : 0;

    return (
      <Col key={group.id} md={4} lg={3} className="mb-4">
        <Link
          to={`/groups/${group.id}/events`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Card
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
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
          >
            <div
              style={{
                height: "150px",
                overflow: "hidden",
                borderTopLeftRadius: "0.375rem",
                borderTopRightRadius: "0.375rem",
              }}
            >
              <img
                src={
                  group.imageUrl ||
                  `https://picsum.photos/300/200?random=${group.id}`
                }
                alt={group.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  e.currentTarget.src = `https://picsum.photos/300/200?random=${group.id}`;
                }}
              />
            </div>
            <CardBody
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              <h5
                style={{
                  marginBottom: "10px",
                  fontWeight: "bold",
                  color: "#333",
                }}
              >
                {group.name}
              </h5>

              {address && (
                <p
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "10px",
                    flex: 1,
                  }}
                >
                  📍 {address}
                </p>
              )}

              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "15px",
                  flex: 1,
                }}
              >
                📅 {eventCount} event{eventCount !== 1 ? "s" : ""}
              </p>

              <div style={{ marginTop: "auto" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  {group.isMember ? (
                    <>
                      <Button
                        size="sm"
                        color="primary"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/groups/${group.id}`;
                        }}
                        style={{ flex: 1 }}
                      >
                        Manage
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          leaveGroup(group);
                        }}
                        style={{ flex: 1 }}
                      >
                        Leave
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      color="success"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        joinGroup(group);
                      }}
                      style={{ flex: 1 }}
                    >
                      Join
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>
      </Col>
    );
  });

  return (
    <div>
      <AppNavbar />
      <Container fluid>
        <div className="float-end">
          <Button color="success" tag={Link} to="/groups/new">
            Create
          </Button>
        </div>
        <h3 style={{ textAlign: "left", fontWeight: "bold" }}>
          Welcome, {getFirstName()} 👋
        </h3>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Groups you're a member of are shown first
        </p>

        {groups.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#666",
            }}
          >
            <h4>No groups yet</h4>
            <p>Join some groups to get started with your JUG Tour!</p>
            <Button color="primary" tag={Link} to="/groups/select">
              Find Groups
            </Button>
          </div>
        ) : (
          <Row className="mt-4">{groupCards}</Row>
        )}
      </Container>
    </div>
  );
};

export default GroupList;
