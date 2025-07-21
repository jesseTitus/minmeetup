import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Alert,
} from "reactstrap";
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
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showDuplicateError, setShowDuplicateError] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const token = getJwtToken();

    if (!token) {
      window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
      return;
    }

    if (id !== "new") {
      fetch(`${apiUrl}/api/groups/${id}`, {
        headers: createAuthHeaders(),
      })
        .then((response) => {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("jwt_token");
            window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
            return;
          }
          if (!response.ok) {
            throw new Error("Failed to fetch group");
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            setGroup(data);
          }
        })
        .catch((error) => {
          console.error("Error fetching group:", error);
        });
    }

    fetch(`${apiUrl}/api/groups/available`, {
      headers: createAuthHeaders(),
    })
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("jwt_token");
          window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch all groups");
        }
        return response.json();
      })
      .then((data) => {
        if (data) {
          setAllGroups(data);
        }
      })
      .catch((error) => {
        console.error("Error fetching all groups:", error);
      });
  }, [id]);

  const isDuplicateName = (name: string): boolean => {
    return allGroups.some(
      (existingGroup) =>
        existingGroup.name.toLowerCase() === name.toLowerCase() &&
        existingGroup.id !== group.id
    );
  };

  const remove = async (groupId: number) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    await fetch(`${apiUrl}/api/groups/${groupId}`, {
      method: "DELETE",
      headers: createAuthHeaders(),
    })
      .then(() => {
        let updatedGroups = [...allGroups].filter((i) => i.id !== groupId);
        setAllGroups(updatedGroups);
        navigate("/groups");
      })
      .catch((error) => {
        console.error("Error removing group:", error);
      });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setGroup({ ...group, [name]: value });

    if (name === "name" && hasAttemptedSubmit) {
      setShowDuplicateError(isDuplicateName(value));
    } else if (name === "name") {
      setShowDuplicateError(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setHasAttemptedSubmit(true);

    if (isDuplicateName(group.name)) {
      setShowDuplicateError(true);
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    await fetch(`${apiUrl}/api/groups${group.id ? `/${group.id}` : ""}`, {
      method: group.id ? "PUT" : "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(group),
    })
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("jwt_token");
          window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to save group");
        }
        return response.json();
      })
      .then((data) => {
        if (data) {
          setGroup(initialFormState);
          navigate("/groups");
        }
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
          <Alert
            color="danger"
            style={{
              backgroundColor: "#f8f9fa",
              borderColor: "#dc3545",
              color: "#dc3545",
            }}
          >
            <strong>Error:</strong> A group with this name already exists.
            Please choose a unique name.
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
