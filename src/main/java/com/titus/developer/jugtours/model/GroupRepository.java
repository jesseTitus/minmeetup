package com.titus.developer.jugtours.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupRepository extends JpaRepository<Group, Long> {
    Optional<Group> findByName(String name);

    @Query("SELECT g FROM Group g JOIN g.users u WHERE u.id = :userId")
    List<Group> findAllByUserId(@Param("userId") String userId);

    @Query("SELECT DISTINCT u FROM Group g JOIN g.users u WHERE g.id = :id")
    List<User> findAllMembersByGroupId(@Param("id") Long groupId);

    // Optimized query to fetch groups with their members and events (but not event attendees)
    @Query("SELECT DISTINCT g FROM Group g LEFT JOIN FETCH g.users LEFT JOIN FETCH g.events")
    List<Group> findAllWithMembersAndEvents();

    // Lightweight query for basic group info with counts
    @Query("SELECT g.id, g.name, g.imageUrl, g.address, g.city, g.stateOrProvince, g.country, g.postalCode, " +
           "COUNT(DISTINCT u.id) as memberCount, COUNT(DISTINCT e.id) as eventCount " +
           "FROM Group g " +
           "LEFT JOIN g.users u " +
           "LEFT JOIN g.events e " +
           "GROUP BY g.id, g.name, g.imageUrl, g.address, g.city, g.stateOrProvince, g.country, g.postalCode")
    List<Object[]> findAllGroupSummaries();
}