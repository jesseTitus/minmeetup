import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Container, Form, FormGroup, Input, Label, Alert } from "reactstrap";
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
  const [existingGroups, setExistingGroups] = useState<Group[]>([]);
  const [showDuplicateError, setShowDuplicateError] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const [cookies] = useCookies(["XSRF-TOKEN"]);

  useEffect(() => {
    // Fetch all existing groups for duplicate checking
    const apiUrl = import.meta.env.VITE_API_URL;
    fetch(`${apiUrl}/api/groups/available`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => setExistingGroups(data))
      .catch((error) => {
        console.error("Error fetching groups:", error);
      });

    if (id !== "new") {
      fetch(`${apiUrl}/api/groups/${id}`, { credentials: "include" })
        .then((response) => response.json())
        .then((data) => setGroup(data))
        .catch((error) => {
          console.error("Error fetching group:", error);
        });
    }
  }, [id, setGroup]);

  const isDuplicateName = (name: string): boolean => {
    if (!name.trim()) return false;
    
    return existingGroups.some(existingGroup => 
      existingGroup.name.toLowerCase() === name.toLowerCase() && 
      existingGroup.id !== group.id
    );
  };

  const remove = async (groupId: number) => {
    if (!groupId) {
      console.error("Cannot delete group without ID");
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/groups/${groupId}`, {
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
    
    // Hide duplicate error when user starts typing a new name
    if (name === "name" && showDuplicateError) {
      setShowDuplicateError(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setHasAttemptedSubmit(true);

    // Check for duplicate name before submitting
    if (isDuplicateName(group.name)) {
      setShowDuplicateError(true);
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    await fetch(`${apiUrl}/api/groups${group.id ? `/${group.id}` : ""}`, {
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
        
        {/* Error message for duplicate group name */}
        {showDuplicateError && hasAttemptedSubmit && (
          <Alert color="danger" style={{ backgroundColor: '#f8f9fa', borderColor: '#dc3545', color: '#dc3545' }}>
            <strong>Error:</strong> A group with this name already exists. Please choose a unique name.
          </Alert>
        )}
        
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
              invalid={showDuplicateError && hasAttemptedSubmit}
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
            <Button 
              color="primary" 
              type="submit"
              disabled={showDuplicateError && hasAttemptedSubmit}
            >
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
