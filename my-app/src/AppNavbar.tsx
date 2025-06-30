import React, { useState, useEffect } from "react";
import {
  Button,
  Collapse,
  Nav,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  NavItem,
  NavLink,
} from "reactstrap";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";

const AppNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cookies] = useCookies(["XSRF-TOKEN"]);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    setLoading(true);
    fetch("/api/user", { credentials: "include" })
      .then((response) => response.text())
      .then((body) => {
        if (body === "") {
          setAuthenticated(false);
        } else {
          setUser(JSON.parse(body));
          setAuthenticated(true);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
        setLoading(false);
      });
  }, [setAuthenticated, setLoading, setUser]);

  const login = () => {
    let port = window.location.port ? ":" + window.location.port : "";
    if (port === ":5173") {
      // Vite's default port
      port = ":8080";
    }
    // redirect to a protected URL to trigger authentication
    window.location.href = `//${window.location.hostname}${port}/api/private`;
  };

  const logout = () => {
    fetch("/api/logout", {
      method: "POST",
      credentials: "include",
      headers: { "X-XSRF-TOKEN": cookies["XSRF-TOKEN"] },
    })
      .then((res) => res.json())
      .then((response) => {
        window.location.href =
          `${response.logoutUrl}?id_token_hint=${response.idToken}` +
          `&post_logout_redirect_uri=${window.location.origin}`;
      })
      .catch((error) => {
        console.error("Error during logout:", error);
      });
  };

  const button = authenticated ? (
    <NavLink href="#" onClick={logout} style={{ cursor: "pointer" }}>
      Logout
    </NavLink>
  ) : (
    <Button color="primary" onClick={login}>
      Login
    </Button>
  );

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Navbar color="dark" dark expand="md">
      <NavbarBrand tag={Link} to="/">
        Home
      </NavbarBrand>
      <NavbarToggler
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      />
      <Collapse isOpen={isOpen} navbar>
        <Nav className="justify-content-end" style={{ width: "100%" }} navbar>
          <NavItem>
            <NavLink href="https://www.linkedin.com/in/jessejtitus/">
              @linkedin
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink href="https://github.com/jesseTitus">GitHub</NavLink>
          </NavItem>
          <NavItem>{button}</NavItem>
        </Nav>
      </Collapse>
    </Navbar>
  );
};

export default AppNavbar;
