package com.titus.developer.jugtours.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(indexes = @Index(name = "idx_event_date", columnList = "date"))
public class Event {

    @Id
    @GeneratedValue
    private Long id;
    private Instant date;
    private String title;
    private String description;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @JsonBackReference
    private Group group;

    @ManyToMany
    private Set<User> attendees = new java.util.HashSet<>();

    // helper methods for managing attendees
    public void addAttendee(User user) {
        if (user != null) {
            if (this.attendees == null) {
                this.attendees = new java.util.HashSet<>();
            }
            this.attendees.add(user);
        }
    }

    public void removeAttendee(User user) {
        if (user != null && this.attendees != null)
            this.attendees.remove(user);
    }

    public boolean hasAttendee(String userId) {
        return this.attendees != null && this.attendees.stream().anyMatch(user -> user.getId().equals(userId));
    }

    public boolean hasAttendee(User user) {
        return user != null && this.attendees != null && this.attendees.contains(user);
    }
}