import React from "react";
import { Link } from "react-router-dom";
import type { Group } from "../types";

interface GroupCardsProps {
  groups: Group[];
  maxDisplayed?: number;
}

const GroupCards: React.FC<GroupCardsProps> = ({
  groups,
  maxDisplayed = 4,
}) => {
  if (groups.length === 0) {
    return null;
  }

  const displayedGroups = groups.slice(0, maxDisplayed);

  return (
    <div style={{ marginBottom: "30px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h4 style={{ margin: 0, fontSize: "20px" }}>Your Groups</h4>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {displayedGroups.map((group: Group) => (
          <Link
            key={group.id}
            to={`/groups/${group.id}/events`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "15px",
                textAlign: "center",
                backgroundColor: "white",
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
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
                  width: "60px",
                  height: "60px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  marginRight: "15px",
                  flexShrink: 0,
                }}
              >
                <img
                  src={
                    group.imageUrl ||
                    `https://picsum.photos/id/${(group.id % 1000) + 1}/60/60`
                  }
                  alt={group.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/id/${
                      (group.id % 1000) + 1
                    }/60/60`;
                  }}
                />
              </div>

              <h6
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {group.name}
              </h6>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GroupCards;
