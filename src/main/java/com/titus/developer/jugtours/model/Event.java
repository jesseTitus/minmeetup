package com.titus.developer.jugtours.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import java.time.Instant;
import java.util.Set;

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
    private String title;
    private String description;
    
    @ManyToOne
    private Group group;
    
    @ManyToMany
    private Set<User> attendees;
}