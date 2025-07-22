import { useState } from "react";
import {
  Collapse,
  Nav,
  NavItem,
  NavLink,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { Link } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

const AppNavbar = () => {
  const { user, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const authenticated = !!user;

  const login = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    window.location.href = "/";
  };

  const toggleDropdown = () => setDropdownOpen((prevState) => !prevState);

  // const toggle = () => setIsOpen(!isOpen);

  const getFirstName = () => {
    if (!user?.name) return "User";
    return user.name.split(" ")[0];
  };

  const userProfileDropdown = authenticated ? (
    <UncontrolledDropdown
      nav
      inNavbar
      isOpen={dropdownOpen}
      toggle={toggleDropdown}
    >
      <DropdownToggle nav caret style={{ color: "black", cursor: "pointer" }}>
        {getFirstName()}
      </DropdownToggle>
      <DropdownMenu end>
        <DropdownItem onClick={logout}>Logout</DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  ) : (
    <NavItem>
      <NavLink onClick={login} style={{ color: "black", cursor: "pointer" }}>
        Login
      </NavLink>
    </NavItem>
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Navbar
      color="white"
      light
      expand="md"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: "#ffffff !important",
        borderBottom: "1px solid #e0e0e0",
        boxShadow: "none",
      }}
    >
      <NavbarBrand
        tag={Link}
        to={authenticated ? "/" : "/"}
        style={{
          color: "red",
          fontWeight: "bold",
          fontFamily: "Palatino, serif",
          fontSize: "24px",
        }}
      >
        <img
          src="/minmeetup-logo.png"
          alt="minmeetup"
          style={{
            height: "40px",
            width: "auto",
            backgroundColor: "transparent",
            objectFit: "contain",
            mixBlendMode: "multiply",
            margin: "0",
            padding: "0",
          }}
        />
      </NavbarBrand>
      <NavbarToggler
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      />
      <Collapse isOpen={isOpen} navbar>
        <Nav className="justify-content-end" style={{ width: "100%" }} navbar>
          <NavItem>
            <NavLink
              href="https://www.linkedin.com/in/jessejtitus/"
              style={{ color: "black" }}
            >
              @linkedin
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink
              href="https://github.com/jesseTitus/minmeetup"
              style={{ color: "black" }}
            >
              GitHub
            </NavLink>
          </NavItem>
          {userProfileDropdown}
        </Nav>
      </Collapse>
    </Navbar>
  );
};

export default AppNavbar;
