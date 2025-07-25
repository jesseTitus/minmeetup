import { useEffect, useState } from "react";
import {
  Button,
  Container,
  Table,
  Card,
  CardBody,
  CardTitle,
} from "reactstrap";
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
  address?: string;
  city?: string;
  stateOrProvince?: string;
  country?: string;
  postalCode?: string;
  events?: Event[];
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

const GroupSelect = () => {
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingGroups, setProcessingGroups] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL;
    const token = getJwtToken();

    if (!token) {
      window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
      return;
    }

    // Fetch user's current groups first
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
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((userGroupsData) => {
        if (userGroupsData) {
          setUserGroups(userGroupsData);
        }

        // Then fetch all available groups
        return fetch(`${apiUrl}/api/groups/available`, {
          headers: createAuthHeaders(),
        });
      })
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("jwt_token");
          window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
          return;
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data) {
          setAvailableGroups(data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching groups:", error);
        setLoading(false);
        alert("Unable to load groups. Please try logging in again.");
      });
  }, []);

  const addGroupToTour = async (group: Group) => {
    // Prevent multiple clicks
    if (processingGroups.has(group.id)) {
      return;
    }

    setProcessingGroups(prev => new Set(prev).add(group.id));

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/groups/members/${group.id}`, {
        method: "POST",
        headers: createAuthHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("jwt_token");
        window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
        return;
      }

      if (response.ok) {
        // Refresh the page to update the button states
        window.location.reload();
      } else {
        console.error("Failed to add group to tour");
        alert("Failed to add group. Please try again.");
      }
    } catch (error) {
      console.error("Error adding group to tour:", error);
      alert("Error adding group. Please try logging in again.");
    } finally {
      setProcessingGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(group.id);
        return newSet;
      });
    }
  };

  const leaveGroup = async (group: Group) => {
    // Prevent multiple clicks
    if (processingGroups.has(group.id)) {
      return;
    }

    setProcessingGroups(prev => new Set(prev).add(group.id));

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/groups/members/${group.id}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("jwt_token");
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
    } finally {
      setProcessingGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(group.id);
        return newSet;
      });
    }
  };

  // Helper function to check if user is a member of a group
  const isUserMember = (group: Group) => {
    return userGroups.some((userGroup) => userGroup.name === group.name);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  const groupList = availableGroups.map((group) => {
    const address = `${group.address || ""} ${group.city || ""} ${
      group.stateOrProvince || ""
    }`;
    const isMember = isUserMember(group);

    return (
      <tr key={group.id}>
        <td style={{ whiteSpace: "nowrap" }}>
          <Link
            to={`/groups/${group.id}/events`}
            style={{ textDecoration: "none", color: "#007bff" }}
          >
            {group.name} {group.id}
          </Link>
        </td>
        <td>{address}</td>
        <td>
          {group.events?.map((event: Event) => {
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
          <Button
            size="sm"
            color={isMember ? "danger" : "success"}
            disabled={processingGroups.has(group.id)}
            onClick={() =>
              isMember ? leaveGroup(group) : addGroupToTour(group)
            }
          >
            {processingGroups.has(group.id) ? "Processing..." : (isMember ? "Leave" : "Join")}
          </Button>
        </td>
      </tr>
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
            <CardTitle tag="h3">Select Existing JUG Groups</CardTitle>
            <p className="text-muted">
              Choose from the available JUG groups to add to your tour. These
              groups include pre-populated events and information.
            </p>
          </CardBody>
        </Card>
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
      </Container>
    </div>
  );
};

export default GroupSelect;
