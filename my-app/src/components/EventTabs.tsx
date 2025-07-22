import React from 'react';

interface EventTabsProps {
  activeTab: "all" | "user";
  onTabChange: (tab: "all" | "user") => void;
  allEventsCount: number;
  userEventsCount: number;
}

const EventTabs: React.FC<EventTabsProps> = ({
  activeTab,
  onTabChange,
  allEventsCount,
  userEventsCount,
}) => {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e9ecef",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => onTabChange("all")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom:
              activeTab === "all"
                ? "2px solid #007bff"
                : "2px solid transparent",
            color: activeTab === "all" ? "#007bff" : "#666",
            fontWeight: activeTab === "all" ? "bold" : "normal",
            fontSize: "16px",
          }}
        >
          All Events ({allEventsCount})
        </button>
        <button
          onClick={() => onTabChange("user")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom:
              activeTab === "user"
                ? "2px solid #007bff"
                : "2px solid transparent",
            color: activeTab === "user" ? "#007bff" : "#666",
            fontWeight: activeTab === "user" ? "bold" : "normal",
            fontSize: "16px",
          }}
        >
          Your Events ({userEventsCount})
        </button>
      </div>
    </div>
  );
};

export default EventTabs; 