import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Table,
  Card,
  CardBody,
  CardTitle,
} from "reactstrap";
import { useCookies } from "react-cookie";
import AppNavbar from "./AppNavbar";
import { Link, useNavigate } from "react-router-dom";

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

const GroupSelect = () => {
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [cookies] = useCookies(["XSRF-TOKEN"]);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);

    // Fetch user's current groups first
    fetch("/api/groups", { credentials: "include" })
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
      .then((userGroupsData) => {
        if (userGroupsData) {
          setUserGroups(userGroupsData);
        }

        // Then fetch all available groups
        return fetch("/api/groups/available", { credentials: "include" });
      })
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
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "X-XSRF-TOKEN": cookies["XSRF-TOKEN"],
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: group.name,
          address: group.address,
          city: group.city,
          stateOrProvince: group.stateOrProvince,
          country: group.country,
          postalCode: group.postalCode,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/oauth2/authorization/auth0";
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
    }
  };

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
            onClick={() =>
              isMember ? leaveGroup(group) : addGroupToTour(group)
            }
          >
            {isMember ? "Leave" : "Join"}
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
