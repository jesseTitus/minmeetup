import React, { useEffect, useState, useRef } from "react";
import { Card, CardBody, CardTitle, Alert, Button } from "reactstrap";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Location {
  latitude: number;
  longitude: number;
}

interface Event {
  id: number;
  date: string;
  title: string;
  description: string;
  group?: {
    id: number;
    name: string;
    address?: string;
    city?: string;
    stateOrProvince?: string;
    country?: string;
    postalCode?: string;
  };
}

// POI locations around the Grad Club at Western University
const poiLocations = [
  { name: "Grad Club", lat: 43.0096, lng: -81.2737 },
  { name: "University Hospital", lat: 43.012, lng: -81.275 },
  { name: "Alumni Hall", lat: 43.008, lng: -81.272 },
  { name: "University College", lat: 43.011, lng: -81.271 },
  { name: "Middlesex College", lat: 43.007, lng: -81.274 },
  { name: "Natural Sciences Centre", lat: 43.01, lng: -81.276 },
];

const Map: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Get user's location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Unable to get your location. Using default location.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
    }

    // Fetch events
    fetch("/api/events", { credentials: "include" })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Failed to fetch events");
      })
      .then((data) => {
        setEvents(data);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        setError("Failed to load events");
      });
  }, []);

  // Initialize map when location is available
  useEffect(() => {
    if (!location || !mapRef.current || mapInstanceRef.current) return;

    // For demo purposes, we'll use a default location if geolocation fails
    const mapCenter = location || { latitude: 43.0096, longitude: -81.2737 };

    // Initialize the map
    const map = L.map(mapRef.current).setView(
      [mapCenter.latitude, mapCenter.longitude],
      15
    );
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add user location marker with custom icon
    const userIcon = L.divIcon({
      className: "custom-user-marker",
      html: "📍",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    const userMarker = L.marker([mapCenter.latitude, mapCenter.longitude], {
      icon: userIcon,
    })
      .addTo(map)
      .bindPopup("You are here!");

    // Add POI markers with custom icons
    poiLocations.forEach((poi, index) => {
      const poiIcon = L.divIcon({
        className: "custom-poi-marker",
        html: `<div style="background: #e74c3c; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">${poi.name.charAt(
          0
        )}</div>`,
        iconSize: [25, 25],
        iconAnchor: [12, 12],
      });

      L.marker([poi.lat, poi.lng], { icon: poiIcon })
        .addTo(map)
        .bindPopup(
          `<b>${poi.name}</b><br>Lat: ${poi.lat.toFixed(
            4
          )}<br>Lng: ${poi.lng.toFixed(4)}`
        );
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location]);

  if (loading) {
    return (
      <Card>
        <CardBody>
          <CardTitle>Map</CardTitle>
          <div>Loading map...</div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <CardTitle>Map</CardTitle>
        {error && <Alert color="warning">{error}</Alert>}

        <div className="mt-3">
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "350px",
              height: "350px",
              border: "2px solid #ccc",
              borderRadius: "8px",
              overflow: "hidden",
              margin: "0 auto",
            }}
          >
            {/* Leaflet map container */}
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

            {/* Map legend */}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                fontSize: "12px",
                color: "#333",
                backgroundColor: "rgba(255,255,255,0.9)",
                padding: "8px",
                borderRadius: "4px",
                pointerEvents: "none",
                zIndex: 1000,
              }}
            >
              <div>📍 You are here</div>
              <div>🔴 Points of Interest</div>
              <div>🗺️ Pan and zoom to explore</div>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <small className="text-muted">
            Interactive map with custom markers. Click on markers for more
            information.
          </small>
        </div>
      </CardBody>
    </Card>
  );
};

export default Map;
