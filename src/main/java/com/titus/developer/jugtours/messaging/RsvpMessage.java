package com.titus.developer.jugtours.messaging;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public class RsvpMessage {
    private final Long eventId;
    private final String userId;
    private final String userName;
    private final String userEmail;
    private final String status; // CONFIRMED, WAITLIST, CANCELLED
    private final Instant timestamp;

    @JsonCreator
    public RsvpMessage(
            @JsonProperty("eventId") Long eventId,
            @JsonProperty("userId") String userId,
            @JsonProperty("userName") String userName,
            @JsonProperty("userEmail") String userEmail,
            @JsonProperty("status") String status) {
        this.eventId = eventId;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.status = status;
        this.timestamp = Instant.now();
    }

    // Getters
    public Long getEventId() { return eventId; }
    public String getUserId() { return userId; }
    public String getUserName() { return userName; }
    public String getUserEmail() { return userEmail; }
    public String getStatus() { return status; }
    public Instant getTimestamp() { return timestamp; }

    @Override
    public String toString() {
        return String.format("RsvpMessage{eventId=%d, userId='%s', status='%s', timestamp=%s}", 
                           eventId, userId, status, timestamp);
    }
}