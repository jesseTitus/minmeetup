import React from 'react';
import { Link } from 'react-router-dom';
import { Row, Col } from 'reactstrap';
import type { Group } from '../types';

interface GroupCardsProps {
  groups: Group[];
  maxDisplayed?: number;
}

const GroupCards: React.FC<GroupCardsProps> = ({ groups, maxDisplayed = 4 }) => {
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
        <h4 style={{ margin: 0 }}>Your Groups</h4>
        {groups.length > maxDisplayed && (
          <Link
            to="/groups"
            style={{
              fontSize: "14px",
              color: "#007bff",
              textDecoration: "none",
            }}
          >
            See all your groups ({groups.length})
          </Link>
        )}
      </div>
      <Row>
        {displayedGroups.map((group: Group) => (
          <Col key={group.id} sm={6} md={3} className="mb-3">
            <Link
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
                  height: "120px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 8px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 4px rgba(0,0,0,0.1)";
                }}
              >
                <img
                  src={
                    group.imageUrl ||
                    `https://picsum.photos/id/${((group.id % 1000) + 1)}/60/60`
                  }
                  alt={group.name}
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    margin: "0 auto 10px",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/id/${((group.id % 1000) + 1)}/60/60`;
                  }}
                />
                <h6 style={{ margin: 0, fontSize: "14px" }}>{group.name}</h6>
              </div>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default GroupCards; 