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
  const { id } = useParams();
  const [cookies] = useCookies(["XSRF-TOKEN"]);

  useEffect(() => {
    // Fetch user's groups for the dropdown
    fetch("/api/groups", { credentials: "include" })
      .then((response) => response.json())
      .then((data) => setGroups(data))
      .catch((error) => {
        console.error("Error fetching groups:", error);
      });

    // If editing existing event, fetch event data
    if (id !== "new") {
      fetch(`/api/event/${id}`, { credentials: "include" })
        .then((response) => response.json())
        .then((data) => setEvent(data))
        .catch((error) => {
          console.error("Error fetching event:", error);
        });
    }
  }, [id, setEvent]);

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

    await fetch(`/api/event${event.id ? `/${event.id}` : ""}`, {
      method: event.id ? "PUT" : "POST",
      headers: {
        "X-XSRF-TOKEN": cookies["XSRF-TOKEN"],
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
      credentials: "include",
    })
      .then(() => {
        setEvent(initialFormState);
        navigate(`/groups/${event.groupId}/events`);
      })
      .catch((error) => {
        console.error("Error saving event:", error);
      });
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
            <Label for="groupId">Group</Label>
            <Input
              type="select"
              name="groupId"
              id="groupId"
              value={event.groupId || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Input>
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
