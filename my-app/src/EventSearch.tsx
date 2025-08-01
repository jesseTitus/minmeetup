import { useSearchParams } from "react-router-dom";
import { Container, Row, Col } from "reactstrap";
import AppNavbar from "./AppNavbar";
import EventList from "./components/EventList";
import { useAuth } from "./hooks/useAuth";
import {
  usePaginatedEvents,
  useInfiniteScroll,
} from "./hooks/useInfiniteScroll";

const EventSearch = () => {
  const { user, createAuthHeaders, handleAuthError } = useAuth();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  // Use paginated events with search API
  const {
    events: searchResults,
    loading,
    hasMore,
    loadMore,
    totalCount,
  } = usePaginatedEvents({
    createAuthHeaders,
    handleAuthError,
    apiUrl: `/api/events/search`,
    selectedDate: null,
    searchQuery: query.trim(), // Pass search query separately
  });

  // Infinite scroll hook
  const { isFetching, setIsFetching } = useInfiniteScroll(() => {
    if (hasMore && query.trim()) {
      loadMore();
      setIsFetching(false);
    } else {
      setIsFetching(false);
    }
  });

  if (!user) {
    return (
      <div>
        <AppNavbar />
        <Container>
          <p>Please log in to search events.</p>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <AppNavbar />
      <Container>
        <Row>
          <Col>
            <h2>Search Results</h2>
            {query && <p>Searching for: "{query}"</p>}

            {loading && <p>Searching...</p>}

            {!loading && searchResults.length === 0 && query && (
              <p>No events found matching "{query}".</p>
            )}

            {searchResults.length > 0 && (
              <div>
                <p>Found {totalCount} event(s) total:</p>
                <EventList events={searchResults} />

                {/* Loading indicator for infinite scroll */}
                {isFetching && (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <p>Loading more events...</p>
                  </div>
                )}

                {/* End of results indicator */}
                {!hasMore && searchResults.length > 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#666",
                    }}
                  >
                    <p>You've reached the end! No more events to load.</p>
                  </div>
                )}
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EventSearch;
