import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Container, Form, FormGroup, Input, Label } from "reactstrap";
import { useCookies } from "react-cookie";
import AppNavbar from "./AppNavbar";

interface Event {
  id?: number;
  title: string;
  description: string;
  date: string;
  groupId?: number;
}

interface Group {
  id: number;
  name: string;
}

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
  const [cookies] = useCookies(["XSRF-TOKEN"]);

  useEffect(() => {
    // Fetch user's groups for the dropdown
    const apiUrl = import.meta.env.VITE_API_URL;
    fetch(`${apiUrl}/api/groups`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => setGroups(data))
      .catch((error) => {
        console.error("Error fetching groups:", error);
      });

    // If editing existing event, fetch event data
    if (id !== "new") {
      fetch(`${apiUrl}/api/events/${id}`, { credentials: "include" })
        .then((response) => response.json())
        .then((data) => setEvent(data))
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
    const finalGroupId = event.groupId || (groupId ? parseInt(groupId) : undefined);
    
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
          headers: {
            "X-XSRF-TOKEN": cookies["XSRF-TOKEN"],
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formattedEvent),
          credentials: "include",
        }
      );

      if (response.ok) {
        setEvent(initialFormState);
        navigate(`/groups/${finalGroupId}/events`);
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
            <Label>Group</Label>
            <div
              style={{
                padding: "8px 12px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                backgroundColor: "#f8f9fa",
              }}
            >
              {groups.find((g) => g.id === parseInt(groupId || "0"))?.name ||
                "Loading..."}
            </div>
          </FormGroup>
          <FormGroup>
            <Button color="primary" type="submit">
              Save
            </Button>{" "}
            <Button color="secondary" tag={Link} to="/groups">
              Cancel
            </Button>
          </FormGroup>
        </Form>
      </Container>
    </div>
  );
};

export default EventEdit;
