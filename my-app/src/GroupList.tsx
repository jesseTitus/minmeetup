import React, { useCallback, useMemo, useState } from "react";
import { Button, Container, Row, Col, Card, CardBody } from "reactstrap";
import AppNavbar from "./AppNavbar";
import { Link } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useInfiniteGroups } from "./hooks/useInfiniteGroups";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";

interface Group {
  id: number;
  name: string;
  imageUrl?: string;
  address?: string;
  city?: string;
  stateOrProvince?: string;
  country?: string;
  postalCode?: string;
  memberCount?: number;
  eventCount?: number;
  isMember?: boolean;
}

const GroupList = () => {
  const { user, isLoading: authLoading, createAuthHeaders, handleAuthError } = useAuth();
  const { 
    groups, 
    loading: groupsLoading, 
    hasMore, 
    loadMore, 
    totalCount,
    updateGroupMembership 
  } = useInfiniteGroups();
  const [processingGroups, setProcessingGroups] = useState<Set<number>>(
    new Set()
  );
  const apiUrl = import.meta.env.VITE_API_URL;

  const loading = authLoading || groupsLoading;

  // Redirect to login if not authenticated
  
  if (!authLoading && !user) {
    window.location.href = `${apiUrl}/oauth2/authorization/auth0`;
    return <div>Redirecting to login...</div>;
  }

  // Infinite scroll for groups
  const { isFetching, setIsFetching } = useInfiniteScroll(() => {
    if (hasMore && user) {
      console.log("GroupList: Calling loadMore, hasMore:", hasMore);
      loadMore();
      setIsFetching(false);
    } else {
      console.log("GroupList: Not loading more - hasMore:", hasMore, "user:", !!user);
      setIsFetching(false);
    }
  });

  const leaveGroup = useCallback(
    async (group: Group) => {
      // Prevent multiple clicks
      if (processingGroups.has(group.id)) {
        return;
      }

      setProcessingGroups((prev) => new Set(prev).add(group.id));

      try {
        const response = await fetch(
          `${apiUrl}/api/groups/members/${group.id}`,
          {
            method: "DELETE",
            headers: createAuthHeaders(),
          }
        );

        if (response.status === 401 || response.status === 403) {
          handleAuthError(response);
          return;
        }

        if (response.ok) {
          updateGroupMembership(group.id, false);
          console.log("Successfully left group");
        } else {
          console.error("Failed to leave group");
          alert("Failed to leave group. Please try again.");
        }
      } catch (error) {
        console.error("Error leaving group:", error);
        alert("Error leaving group. Please try logging in again.");
      } finally {
        setProcessingGroups((prev) => {
          const newSet = new Set(prev);
          newSet.delete(group.id);
          return newSet;
        });
      }
    },
    [apiUrl, processingGroups]
  );

  const joinGroup = useCallback(
    async (group: Group) => {
      // Prevent multiple clicks
      if (processingGroups.has(group.id)) {
        return;
      }

      setProcessingGroups((prev) => new Set(prev).add(group.id));

      try {
        const response = await fetch(
          `${apiUrl}/api/groups/members/${group.id}`,
          {
            method: "POST",
            headers: createAuthHeaders(),
          }
        );

        if (response.status === 401 || response.status === 403) {
          handleAuthError(response);
          return;
        }

        if (response.ok) {
          updateGroupMembership(group.id, true);
          console.log("Successfully joined group");
        } else {
          console.error("Failed to join group");
          alert("Failed to join group. Please try again.");
        }
      } catch (error) {
        console.error("Error joining group:", error);
        alert("Error joining group. Please try logging in again.");
      } finally {
        setProcessingGroups((prev) => {
          const newSet = new Set(prev);
          newSet.delete(group.id);
          return newSet;
        });
      }
    },
    [apiUrl, processingGroups]
  );

  // Get user's first name
  const getFirstName = useCallback(() => {
    if (!user || !user.name) return "User";

    // Split the full name and get the first part
    const nameParts = user.name.split(" ");
    return nameParts[0];
  }, [user]);

  const groupCards = useMemo(() => {
    return groups.map((group) => {
      const address = `${group.address || ""} ${group.city || ""} ${
        group.stateOrProvince || ""
      }`.trim();

      const eventCount = group.eventCount || 0;
      const isProcessing = processingGroups.has(group.id);

      return (
        <GroupCard
          key={group.id}
          group={group}
          address={address}
          eventCount={eventCount}
          isProcessing={isProcessing}
          onJoin={joinGroup}
          onLeave={leaveGroup}
        />
      );
    });
  }, [groups, processingGroups, joinGroup, leaveGroup]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <AppNavbar />
      <Container fluid>
        <div className="float-end">
          <Button color="success" tag={Link} to="/groups/new">
            Create
          </Button>
        </div>
        <h3 style={{ textAlign: "left", fontWeight: "bold" }}>
          Welcome, {getFirstName()} 👋
        </h3>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Showing {groups.length} of {totalCount} groups
        </p>

        {groups.length === 0 && !loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#666",
            }}
          >
            <h4>No groups yet</h4>
            <p>Join some groups to get started with your JUG Tour!</p>
            <Button color="primary" tag={Link} to="/groups/select">
              Find Groups
            </Button>
          </div>
        ) : (
          <>
            <Row className="mt-4">{groupCards}</Row>
            
            {isFetching && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p>Loading more groups...</p>
              </div>
            )}
            
            {!hasMore && groups.length > 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#666",
                }}
              >
                <p>You've reached the end! No more groups to load.</p>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

// Memoized GroupCard component to prevent unnecessary re-renders
const GroupCard = React.memo(
  ({
    group,
    address,
    eventCount,
    isProcessing,
    onJoin,
    onLeave,
  }: {
    group: Group;
    address: string;
    eventCount: number;
    isProcessing: boolean;
    onJoin: (group: Group) => void;
    onLeave: (group: Group) => void;
  }) => {
    return (
      <Col key={group.id} md={4} lg={3} className="mb-4">
        <Link
          to={`/groups/${group.id}/events`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Card
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            }}
          >
            <div
              style={{
                height: "150px",
                overflow: "hidden",
                borderTopLeftRadius: "0.375rem",
                borderTopRightRadius: "0.375rem",
              }}
            >
              <img
                src={
                  group.imageUrl ||
                  `https://picsum.photos/300/200?random=${group.id}`
                }
                alt={group.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  // Only set fallback if we don't already have a backend imageUrl
                  if (!group.imageUrl) {
                    e.currentTarget.src = `https://picsum.photos/300/200?random=${Math.floor(Math.random() * 10000)}`;
                  }
                }}
              />
            </div>
            <CardBody
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              <h5
                style={{
                  marginBottom: "10px",
                  fontWeight: "bold",
                  color: "#333",
                }}
              >
                {group.name}
              </h5>

              {address && (
                <p
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "10px",
                    flex: 1,
                  }}
                >
                  {address}
                </p>
              )}

              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "15px",
                  flex: 1,
                }}
              >
                {eventCount} event{eventCount !== 1 ? "s" : ""}
              </p>

              <div style={{ marginTop: "auto" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  {group.isMember ? (
                    <>
                      <Button
                        size="sm"
                        color="primary"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/groups/${group.id}`;
                        }}
                        style={{ flex: 1 }}
                      >
                        Manage
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        disabled={isProcessing}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onLeave(group);
                        }}
                        style={{ flex: 1 }}
                      >
                        {isProcessing ? "..." : "Leave"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      color="success"
                      disabled={isProcessing}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onJoin(group);
                      }}
                      style={{ flex: 1 }}
                    >
                      {isProcessing ? "..." : "Join"}
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>
      </Col>
    );
  }
);

export default GroupList;
