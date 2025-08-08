package com.titus.developer.jugtours.model;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("SELECT e FROM Event e JOIN e.attendees a WHERE a.id = :id")
    List<Event> findAllById(@Param("id") String id);

    @Query("SELECT DISTINCT a FROM Event e JOIN e.attendees a WHERE e.id = :id")
    List<User> findAllAttendeesById(@Param("id") Long id);

    Optional<Event> findByTitle(String string);

    List<Event> findByTitleContainingIgnoreCase(String title);

    Page<Event> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    // get events with JPA lazy loading
    // query looks like SELECT * FROM events WHERE group_id = :groupId LIMIT :size
    // OFFSET :page
    Page<Event> findByGroupId(Long groupId, Pageable pageable);

    // Optimized query to fetch events with their groups and attendees in single query
    @Query("SELECT DISTINCT e FROM Event e LEFT JOIN FETCH e.group LEFT JOIN FETCH e.attendees ORDER BY e.date")
    Page<Event> findAllWithGroupAndAttendees(Pageable pageable);
}