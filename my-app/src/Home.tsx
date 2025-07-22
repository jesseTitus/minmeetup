import { useState } from "react";
import "./App.css";
import AppNavbar from "./AppNavbar";
import { Link } from "react-router-dom";
import { Button, Container, Row, Col } from "reactstrap";
import EventCalendar from "./EventCalendar";
import GroupCards from "./components/GroupCards";
import UserEventsList from "./components/UserEventsList";
import EventTabs from "./components/EventTabs";
import EventList from "./components/EventList";
import { useAuth } from "./hooks/useAuth";
import { useHomeData } from "./hooks/useHomeData";
import type { Event } from "./types";

const Home = () => {
  const { user, isLoading: authLoading } = useAuth();
  const {
    groups,
    events,
    loading: dataLoading,
    allGroupEvents,
  } = useHomeData();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "user">("all");

  const loading = authLoading || dataLoading;

  // Choose which events to display based on active tab
  const eventsToDisplay = activeTab === "all" ? allGroupEvents : events;

  // Filter events based on selected date
  const filteredEvents = selectedDate
    ? eventsToDisplay.filter((event: Event) => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === selectedDate.toDateString();
      })
    : eventsToDisplay;

  // Get user's first name
  const getFirstName = () => {
    if (!user || !user.name) return "User";
    const nameParts = user.name.split(" ");
    return nameParts[0];
  };

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleTabChange = (tab: "all" | "user") => {
    setActiveTab(tab);
  };

  const message = user ? (
    <h3 style={{ textAlign: "left", fontWeight: "bold" }}>
      Welcome, {getFirstName()}
    </h3>
  ) : (
    <p>Please log in to manage your JUG Tour.</p>
  );

  const button = user && (
    <div>
      <Button color="link">
        <Link to="/groups">Manage JUG Tour</Link>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div>
        <AppNavbar />
        <Container>
          <p>Loading...</p>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <AppNavbar />
      <Container fluid>
        {message}
        {!user && button}

        {user && (
          <>
            <Row>
              <Col md={3}>
                <EventCalendar
                  events={eventsToDisplay}
                  onDateSelect={handleDateSelect}
                />

                <GroupCards groups={groups} />

                <Link
                  to="/groups"
                  style={{
                    textDecoration: "none",
                    color: "#007bff",
                    fontSize: "14px",
                    display: "block",
                    marginTop: "15px",
                  }}
                >
                  Find more groups
                </Link>

                <UserEventsList events={events} />
              </Col>

              <Col md={9}>
                <div style={{ marginLeft: "20px", marginRight: "10%" }}>
                  <EventTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    allEventsCount={allGroupEvents.length}
                    userEventsCount={events.length}
                  />

                  <EventList events={filteredEvents} />
                </div>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default Home;
