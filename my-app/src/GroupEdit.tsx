import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Container, Form, FormGroup, Input, Label } from "reactstrap";
import { useCookies } from "react-cookie";
import AppNavbar from "./AppNavbar";

interface Group {
  id?: number;
  name: string;
  address?: string;
  city?: string;
  stateOrProvince?: string;
  country?: string;
  postalCode?: string;
}

const GroupEdit = () => {
  const initialFormState: Group = {
    name: "",
    address: "",
    city: "",
    stateOrProvince: "",
    country: "",
    postalCode: "",
  };
  const [group, setGroup] = useState<Group>(initialFormState);
  const navigate = useNavigate();
  const { id } = useParams();
  const [cookies] = useCookies(["XSRF-TOKEN"]);

  useEffect(() => {
    if (id !== "new") {
      fetch(`/api/group/${id}`, { credentials: "include" })
        .then((response) => response.json())
        .then((data) => setGroup(data))
        .catch((error) => {
          console.error("Error fetching group:", error);
        });
    }
  }, [id, setGroup]);

  const remove = async (groupId: number) => {
    if (!groupId) {
      console.error("Cannot delete group without ID");
      return;
    }

    try {
      const response = await fetch(`/api/group/${groupId}`, {
        method: "DELETE",
        headers: {
          "X-XSRF-TOKEN": cookies["XSRF-TOKEN"],
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        // Navigate back to groups list after successful deletion
        navigate("/groups");
      } else {
        console.error("Failed to delete group");
        alert("Failed to delete group. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Error deleting group. Please try again.");
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setGroup({ ...group, [name]: value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    await fetch(`/api/group${group.id ? `/${group.id}` : ""}`, {
      method: group.id ? "PUT" : "POST",
      headers: {
        "X-XSRF-TOKEN": cookies["XSRF-TOKEN"],
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(group),
      credentials: "include",
    })
      .then(() => {
        setGroup(initialFormState);
        navigate("/groups");
      })
      .catch((error) => {
        console.error("Error saving group:", error);
      });
  };

  const title = <h2>{group.id ? "Edit Group" : "Create Group"}</h2>;

  return (
    <div>
      <AppNavbar />
      <Container>
        {title}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label for="name">Name</Label>
            <Input
              type="text"
              name="name"
              id="name"
              value={group.name || ""}
              onChange={handleChange}
              autoComplete="name"
            />
          </FormGroup>
          <FormGroup>
            <Label for="address">Address</Label>
            <Input
              type="text"
              name="address"
              id="address"
              value={group.address || ""}
              onChange={handleChange}
              autoComplete="address-level1"
            />
          </FormGroup>
          <FormGroup>
            <Label for="city">City</Label>
            <Input
              type="text"
              name="city"
              id="city"
              value={group.city || ""}
              onChange={handleChange}
              autoComplete="address-level1"
            />
          </FormGroup>
          <div className="row">
            <FormGroup className="col-md-4 mb-3">
              <Label for="stateOrProvince">State/Province</Label>
              <Input
                type="text"
                name="stateOrProvince"
                id="stateOrProvince"
                value={group.stateOrProvince || ""}
                onChange={handleChange}
                autoComplete="address-level1"
              />
            </FormGroup>
            <FormGroup className="col-md-5 mb-3">
              <Label for="country">Country</Label>
              <Input
                type="text"
                name="country"
                id="country"
                value={group.country || ""}
                onChange={handleChange}
                autoComplete="address-level1"
              />
            </FormGroup>
            <FormGroup className="col-md-3 mb-3">
              <Label for="postalCode">Postal Code</Label>
              <Input
                type="text"
                name="postalCode"
                id="postalCode"
                value={group.postalCode || ""}
                onChange={handleChange}
                autoComplete="address-level1"
              />
            </FormGroup>
          </div>
          <FormGroup>
            <Button color="primary" type="submit">
              Save
            </Button>{" "}
            <Button color="secondary" tag={Link} to="/groups">
              Cancel
            </Button>
            {group.id && (
              <Button
                color="danger"
                onClick={() => remove(group.id!)}
                style={{ marginLeft: "10px" }}
              >
                Delete
              </Button>
            )}
          </FormGroup>
        </Form>
      </Container>
    </div>
  );
};

export default GroupEdit;
