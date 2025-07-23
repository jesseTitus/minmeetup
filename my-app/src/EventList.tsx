import { useEffect, useState } from "react";
import { Button, Container } from "reactstrap";
import AppNavbar from "./AppNavbar";
import { Link, useParams, useNavigate } from "react-router-dom";
import EventListComponent from "./components/EventList";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import { useGroupEvents } from "./hooks/useGroupEvents";
import { useAuth } from "./hooks/useAuth";
import type { Group } from "./types";

const EventList = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const navigate = useNavigate();
  const { createAuthHeaders, handleAuthError } = useAuth();

  // Use the new group events hook for pagination
  const { 
    events, 
    loading: eventsLoading, 
    hasMore, 
    loadMore, 
    totalCount 
  } = useGroupEvents(groupId);

  // Infinite scroll for events
  const { isFetching, setIsFetching } = useInfiniteScroll(() => {
    if (hasMore) {
      loadMore();
      setIsFetching(false);
    }
  });

  // Fetch group details and membership status
  useEffect(() => {
    if (!groupId) return;

    const apiUrl = import.meta.env.VITE_API_URL;
    
    Promise.all([
      fetch(`${apiUrl}/api/groups/${groupId}`, {
        headers: createAuthHeaders(),
      }),
      fetch(`${apiUrl}/api/groups`, {
        headers: createAuthHeaders(),
      }),
    ])
      .then(async ([groupResponse, userGroupsResponse]) => {
        if (!groupResponse.ok || !userGroupsResponse.ok) {
          handleAuthError(groupResponse);
          throw new Error("Failed to fetch data");
        }

        const groupData = await groupResponse.json();
        const userGroups = await userGroupsResponse.json();

        setGroup(groupData);

        // Check if user is a member
        const userGroupIds = userGroups.map((g: Group) => g.id);
        setIsMember(userGroupIds.includes(parseInt(groupId)));
        setGroupLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching group data:", error);
        setGroupLoading(false);
      });
  }, [groupId, createAuthHeaders, handleAuthError]);

  if (groupLoading) {
    return (
      <div>
        <AppNavbar />
        <Container>
          <p>Loading...</p>
        </Container>
      </div>
    );
  }

  if (!group) {
    return (
      <div>
        <AppNavbar />
        <Container>
          <p>Group not found</p>
          <Button color="primary" onClick={() => navigate("/groups")}>
            Back to Groups
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <AppNavbar />
      <Container fluid>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0 0 5px 0" }}>{group.name} Events</h3>
              <p style={{ margin: "0", color: "#666" }}>
                {group.address} {group.city} {group.stateOrProvince}
              </p>
              {totalCount > 0 && (
                <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#888" }}>
                  {totalCount} event{totalCount !== 1 ? 's' : ''} total
                </p>
              )}
            </div>
            <div>
              <Button color="secondary" tag={Link} to="/groups">
                Back to Groups
              </Button>
              {isMember && (
                <Button
                  color="primary"
                  tag={Link}
                  to={`/groups/${groupId}/events/new`}
                  style={{ marginLeft: "10px" }}
                >
                  New Event
                </Button>
              )}
            </div>
          </div>
        </div>

        {events.length === 0 && !eventsLoading ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            backgroundColor: "white",
            borderRadius: "8px",
            border: "1px solid #ddd"
          }}>
            <h5>No Events Scheduled</h5>
            <p style={{ color: "#666" }}>There are currently no events scheduled for this group.</p>
            {isMember && (
              <Button
                color="primary"
                tag={Link}
                to={`/groups/${groupId}/events/new`}
              >
                Create First Event
              </Button>
            )}
          </div>
        ) : (
          <div style={{ marginLeft: "20px", marginRight: "10%" }}>
            <EventListComponent events={events} />
            
            {/* Loading indicator for infinite scroll */}
            {isFetching && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p>Loading more events...</p>
              </div>
            )}
            
            {/* End of events indicator */}
            {!hasMore && events.length > 0 && (
              <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                <p>You've reached the end! No more events to load.</p>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
};

export default EventList;
