package com.titus.developer.jugtours.model;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    // Lightweight query for user's groups with counts
    @Query("SELECT g.id, g.name, g.imageUrl, " +
           "COUNT(DISTINCT u.id) as memberCount, COUNT(DISTINCT e.id) as eventCount " +
           "FROM Group g " +
           "JOIN g.users currentUser " +
           "LEFT JOIN g.users u " +
           "LEFT JOIN g.events e " +
           "WHERE currentUser.id = :userId " +
           "GROUP BY g.id, g.name, g.imageUrl")
    List<Object[]> findUserGroupSummaries(@Param("userId") String userId);

    // Paginated lightweight query for all groups with membership status
    @Query("SELECT g.id, g.name, g.imageUrl, g.address, g.city, g.stateOrProvince, g.country, g.postalCode, " +
           "COUNT(DISTINCT u.id) as memberCount, COUNT(DISTINCT e.id) as eventCount, " +
           "CASE WHEN currentUser.id IS NOT NULL THEN true ELSE false END as isMember " +
           "FROM Group g " +
           "LEFT JOIN g.users u " +
           "LEFT JOIN g.events e " +
           "LEFT JOIN g.users currentUser ON currentUser.id = :userId " +
           "GROUP BY g.id, g.name, g.imageUrl, g.address, g.city, g.stateOrProvince, g.country, g.postalCode, " +
           "CASE WHEN currentUser.id IS NOT NULL THEN true ELSE false END " +
           "ORDER BY CASE WHEN currentUser.id IS NOT NULL THEN 0 ELSE 1 END, g.name")
    Page<Object[]> findAllGroupSummariesPaginated(@Param("userId") String userId, Pageable pageable);
}