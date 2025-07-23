import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Container, Form, FormGroup, Input, Label } from "reactstrap";
import AppNavbar from "./AppNavbar";

interface Event {
  id?: number;
  title: string;
  description: string;
  date: string;
  groupId?: number;
  group?: {
    id: number;
    name: string;
    address?: string;
    city?: string;
    stateOrProvince?: string;
    country?: string;
    postalCode?: string;
    imageUrl?: string;
  };
}

interface Group {
  id: number;
  name: string;
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

const EventEdit = () => {
  const initialFormState: Event = {
    title: "",
    description: "",
    date: "",
  };
  const [event, setEvent] = useState<Event>(initialFormState);
  const [groups, setGroups] = useState<Group[]>([]);
  const navigate = useNavigate();
  const { id, groupId } = useParams();

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const token = getJwtToken();

    if (!token) {
      window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
      return;
    }

    // Fetch user's groups for the dropdown
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

    // If editing existing event, fetch event data
    if (id && id !== "new") {
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
            throw new Error("Failed to fetch event");
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            // Convert the event data to match our interface
            const eventData: Event = {
              id: data.id,
              title: data.title,
              description: data.description,
              date: data.date ? data.date.substring(0, 16) : "", // Format for datetime-local input
              groupId: data.group?.id,
              group: data.group,
            };
            setEvent(eventData);
          }
        })
        .catch((error) => {
          console.error("Error fetching event:", error);
        });
    } else {
      // If creating new event, use groupId from URL parameters
      if (groupId) {
        setEvent((prev) => ({ ...prev, groupId: parseInt(groupId) }));
      }
    }
  }, [id, groupId]);

  const handleChange = (
    eventChange: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = eventChange.target;
    setEvent({ ...event, [name]: value });
  };

  const handleSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();

    // Get the groupId - prefer from event state, fallback to URL param
    const finalGroupId =
      event.groupId || (groupId ? parseInt(groupId) : undefined);

    if (!finalGroupId) {
      alert("Group ID is missing. Please try again.");
      return;
    }

    // format the date to include seconds and timezone
    const formattedEvent = {
      title: event.title,
      description: event.description,
      date: event.date ? `${event.date}:00Z` : event.date, // add sec and UTC
      groupId: finalGroupId,
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(
        `${apiUrl}/api/events${event.id && event.id > 0 ? `/${event.id}` : ""}`,
        {
          method: event.id && event.id > 0 ? "PUT" : "POST",
          headers: createAuthHeaders(),
          body: JSON.stringify(formattedEvent),
        }
      );

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("jwt_token");
        window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
        return;
      }

      if (response.ok) {
        setEvent(initialFormState);
        navigate(`/events/${event.id}`);
      } else {
        console.error(
          "Error saving event:",
          response.status,
          response.statusText
        );
        alert("Failed to save event. Please try again.");
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error saving event. Please try again.");
    }
  };

  const title = <h2>{event.id ? "Edit Event" : "Create Event"}</h2>;

  // Helper function to get the group name to display
  const getGroupName = () => {
    // If editing an existing event, use the group from the event data
    if (event.group) {
      return event.group.name;
    }

    // If creating a new event, find the group by groupId from URL parameter
    if (groupId) {
      const foundGroup = groups.find((g) => g.id === parseInt(groupId));
      return foundGroup?.name || "Loading...";
    }

    return "Loading...";
  };

  return (
    <div>
      <AppNavbar />
      <Container>
        {title}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label for="title">Title</Label>
            <Input
              type="text"
              name="title"
              id="title"
              value={event.title || ""}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label for="description">Description</Label>
            <Input
              type="textarea"
              name="description"
              id="description"
              value={event.description || ""}
              onChange={handleChange}
              rows={3}
            />
          </FormGroup>
          <FormGroup>
            <Label for="date">Date & Time</Label>
            <Input
              type="datetime-local"
              name="date"
              id="date"
              value={event.date || ""}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <div style={{ marginBottom: "0.5rem" }}>Group</div>
            <div
              style={{
                padding: "8px 12px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                backgroundColor: "#f8f9fa",
              }}
            >
              {getGroupName()}
            </div>
          </FormGroup>
          <FormGroup>
            <Button color="primary" type="submit">
              Save
            </Button>{" "}
            <Button color="secondary" tag={Link} to={`/events/${event.id}`}>
              Cancel
            </Button>
          </FormGroup>
        </Form>
      </Container>
    </div>
  );
};

export default EventEdit;
