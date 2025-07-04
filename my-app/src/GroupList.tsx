import React, { useEffect, useState } from "react";
import { Button, ButtonGroup, Container, Table, Row, Col } from "reactstrap";
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
}

const GroupList = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cookies] = useCookies(["XSRF-TOKEN"]);

  useEffect(() => {
    setLoading(true);

    // Fetch user information
    fetch("/api/user", { credentials: "include" })
      .then((response) => response.text())
      .then((body) => {
        if (body !== "") {
          setUser(JSON.parse(body));
        }
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
      });

    fetch("/api/groups", { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        setGroups(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching groups:", error);
        setLoading(false);
      });
  }, []);

  const leaveGroup = async (group: Group) => {
    try {
      const response = await fetch(`/api/groups/members/${group.id}`, {
        method: "DELETE",
        headers: {
          "X-XSRF-TOKEN": cookies["XSRF-TOKEN"],
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/oauth2/authorization/auth0";
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

  const groupList = groups.map((group) => {
    const address = `${group.address || ""} ${group.city || ""} ${
      group.stateOrProvince || ""
    }`;
    return (
      <tr key={group.id}>
        <td style={{ whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={group.imageUrl || `https://picsum.photos/40/40?random=${group.id}`}
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
            <Link
              to={`/groups/${group.id}/events`}
              style={{ textDecoration: "none", color: "#007bff" }}
            >
              {group.name}
            </Link>
          </div>
        </td>
        <td>{address}</td>
        <td>
          {group.events?.map((event) => {
            return (
              <div key={event.id}>
                {new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "2-digit",
                }).format(new Date(event.date))}
                : {event.title}
              </div>
            );
          })}
        </td>
        <td>
          <ButtonGroup>
            <Button
              size="sm"
              color="primary"
              tag={Link}
              to={"/groups/" + group.id}
            >
              Manage
            </Button>
            <Button size="sm" color="danger" onClick={() => leaveGroup(group)}>
              Leave
            </Button>
          </ButtonGroup>
        </td>
      </tr>
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
          <Button color="success" tag={Link} to="/groups/select">
            Find more groups
          </Button>
        </div>
        <h3 style={{ textAlign: "left", fontWeight: "bold" }}>
          Welcome, {getFirstName()} 👋
        </h3>

        <Row>
          <Col md={12}>
            <Table className="mt-4">
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>Name</th>
                  <th style={{ width: "20%" }}>Location</th>
                  <th>Events</th>
                  <th style={{ width: "10%" }}>Actions</th>
                </tr>
              </thead>
              <tbody>{groupList}</tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default GroupList;
