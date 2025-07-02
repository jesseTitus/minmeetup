package com.titus.developer.jugtours.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("SELECT e FROM Event e JOIN e.attendees a WHERE a.id = :id")
    List<Event> findAllById(@Param("id") String id);

    Optional<Event> findByTitle(String string);
}