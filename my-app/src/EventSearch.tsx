import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Container, Row, Col } from "reactstrap";
import AppNavbar from "./AppNavbar";
import EventList from "./components/EventList";
import { useAuth } from "./hooks/useAuth";
import type { Event } from "./types";

const EventSearch = () => {
  const { user, createAuthHeaders, handleAuthError } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = searchParams.get("q") || "";

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim() || !user) return;

      setLoading(true);
      setError(null);

      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(
          `${apiUrl}/api/events/search?q=${encodeURIComponent(query.trim())}`,
          {
            headers: createAuthHeaders(),
          }
        );

        if (response.status === 401 || response.status === 403) {
          handleAuthError(response);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to search events");
        }

        const data = await response.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search events. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, user, createAuthHeaders, handleAuthError]);

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
            
            {error && <p style={{ color: "red" }}>{error}</p>}
            
            {!loading && !error && searchResults.length === 0 && query && (
              <p>No events found matching "{query}".</p>
            )}
            
            {!loading && !error && searchResults.length > 0 && (
              <div>
                <p>Found {searchResults.length} event(s):</p>
                <EventList events={searchResults} />
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EventSearch; 