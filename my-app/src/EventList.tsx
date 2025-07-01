import React, { useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
  Container,
  Table,
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
  //   attendees: User;   // TODO ---
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

const EventList = () => {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const { groupId } = useParams<{ groupId: string }>();

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

  const eventList = group.events?.map((event) => {
    return (
      <tr key={event.id}>
        <td style={{ whiteSpace: "nowrap" }}>
          {new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(event.date))}
        </td>
        <td>{event.title}</td>
        <td>{event.description}</td>
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
            <CardTitle tag="h3">{group.name} - Events</CardTitle>
            {address && <p className="text-muted">Location: {address}</p>}
            <p className="text-muted">
              {group.events?.length || 0} event(s) found
            </p>
            <Button color="success" tag={Link} to="/events/new">
              Add New Event
            </Button>
          </CardBody>
        </Card>
        <Table className="mt-4">
          <thead>
            <tr>
              <th style={{ width: "25%" }}>Date & Time</th>
              <th style={{ width: "35%" }}>Title</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {group.events && group.events.length > 0 ? (
              eventList
            ) : (
              <tr>
                <td colSpan={3} className="text-center text-muted">
                  No events found for this group
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Container>
    </div>
  );
};

export default EventList;
