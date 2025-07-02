package com.titus.developer.jugtours.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import java.time.Instant;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Column;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class Event {

    @Id
    @GeneratedValue
    private Long id;
    private Instant date;
    @Column(unique = true)
    private String title;
    private String description;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @JsonBackReference
    private Group group;

    @ManyToMany
    private Set<User> attendees;
}