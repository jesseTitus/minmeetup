package com.titus.developer.jugtours.web;

import com.titus.developer.jugtours.model.Event;
import com.titus.developer.jugtours.model.Group;
import com.titus.developer.jugtours.model.GroupRepository;
import com.titus.developer.jugtours.model.User;
import com.titus.developer.jugtours.model.UserRepository;
import com.titus.developer.jugtours.service.ImageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.Principal;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
class GroupController {

    private final Logger log = LoggerFactory.getLogger(GroupController.class);
    private GroupRepository groupRepository;
    private UserRepository userRepository;
    private ImageService imageService;

    public GroupController(GroupRepository groupRepository, UserRepository userRepository, ImageService imageService) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.imageService = imageService;
    }

    @GetMapping("/groups")
    Collection<Map<String, Object>> groups(Principal principal, HttpServletRequest request) {
        long startTime = System.currentTimeMillis();
        
        String userId = getUserId(principal, request);
        List<Object[]> userGroupSummaries = groupRepository.findUserGroupSummaries(userId);

        List<Map<String, Object>> result = userGroupSummaries.stream()
            .map(row -> {
                Map<String, Object> group = new HashMap<>();
                Long groupId = (Long) row[0];
                String name = (String) row[1];
                String imageUrl = (String) row[2];
                
                // Ensure group has consistent image
                if (imageUrl == null || imageUrl.isEmpty()) {
                    imageUrl = imageService.generateRandomImageUrl(groupId);
                    
                    // Update the database with the generated image URL
                    Optional<Group> groupEntity = groupRepository.findById(groupId);
                    if (groupEntity.isPresent()) {
                        Group g = groupEntity.get();
                        g.setImageUrl(imageUrl);
                        groupRepository.save(g);
                    }
                }
                
                group.put("id", groupId);
                group.put("name", name);
                group.put("imageUrl", imageUrl);
                group.put("memberCount", row[3]);
                group.put("eventCount", row[4]);
                return group;
            })
            .collect(Collectors.toList());
            
        long endTime = System.currentTimeMillis();
        log.info("User groups fetched in {}ms - {} groups", endTime - startTime, result.size());

        return result;
    }

    @GetMapping("/groups/available")
    Collection<Group> availableGroups() {
        // log.info("=== FETCHING AVAILABLE GROUPS ===");
        Collection<Group> groups = groupRepository.findAllWithMembersAndEvents();
        // log.info("Found {} groups", groups.size());

        // Ensure all groups have consistent images
        groups.forEach(group -> {
            // log.info("Group {}: imageUrl = {}", group.getId(), group.getImageUrl());
            if (group.getImageUrl() == null || group.getImageUrl().isEmpty()) {
                String newImageUrl = imageService.generateRandomImageUrl(group.getId());
                // log.info("Setting new imageUrl for group {}: {}", group.getId(),
                // newImageUrl);
                group.setImageUrl(newImageUrl);
                groupRepository.save(group);
                // log.info("Saved group {} with imageUrl: {}", group.getId(),
                // group.getImageUrl());
            }
        });

        return groups;
    }

    @GetMapping("/groups/summary")
    Collection<Map<String, Object>> getGroupSummaries() {
        long startTime = System.currentTimeMillis();
        
        List<Object[]> summaries = groupRepository.findAllGroupSummaries();
        
        List<Map<String, Object>> result = summaries.stream()
            .map(row -> {
                Map<String, Object> group = new HashMap<>();
                group.put("id", row[0]);
                group.put("name", row[1]);
                group.put("imageUrl", row[2]);
                group.put("address", row[3]);
                group.put("city", row[4]);
                group.put("stateOrProvince", row[5]);
                group.put("country", row[6]);
                group.put("postalCode", row[7]);
                group.put("memberCount", row[8]);
                group.put("eventCount", row[9]);
                return group;
            })
            .collect(Collectors.toList());
            
        long endTime = System.currentTimeMillis();
        log.info("Group summaries fetched in {}ms - {} groups", endTime - startTime, result.size());
        
        return result;
    }

    @GetMapping("/groups/available/paginated")
    ResponseEntity<Map<String, Object>> getAvailableGroupsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Principal principal, 
            HttpServletRequest request) {
        
        long startTime = System.currentTimeMillis();
        String userId = getUserId(principal, request);
        
        // Get all group summaries
        List<Object[]> summaries = groupRepository.findAllGroupSummaries();
        
        // Convert to maps and add membership status
        List<Map<String, Object>> allGroups = summaries.stream()
            .map(row -> {
                Map<String, Object> group = new HashMap<>();
                Long groupId = (Long) row[0];
                String imageUrl = (String) row[2];
                
                // Ensure group has consistent image
                if (imageUrl == null || imageUrl.isEmpty()) {
                    imageUrl = imageService.generateRandomImageUrl(groupId);
                    
                    // Update the database with the generated image URL
                    Optional<Group> groupEntity = groupRepository.findById(groupId);
                    if (groupEntity.isPresent()) {
                        Group g = groupEntity.get();
                        g.setImageUrl(imageUrl);
                        groupRepository.save(g);
                    }
                }
                
                group.put("id", groupId);
                group.put("name", row[1]);
                group.put("imageUrl", imageUrl);
                group.put("address", row[3]);
                group.put("city", row[4]);
                group.put("stateOrProvince", row[5]);
                group.put("country", row[6]);
                group.put("postalCode", row[7]);
                group.put("memberCount", row[8]);
                group.put("eventCount", row[9]);
                
                // Check if user is a member of this group
                group.put("isMember", checkUserMembership(groupId, userId));
                
                return group;
            })
            .sorted((a, b) -> {
                // Sort by membership status first (members first), then by name
                Boolean aMember = (Boolean) a.get("isMember");
                Boolean bMember = (Boolean) b.get("isMember");
                
                if (aMember && !bMember) return -1;
                if (!aMember && bMember) return 1;
                
                return ((String) a.get("name")).compareToIgnoreCase((String) b.get("name"));
            })
            .collect(Collectors.toList());
        
        // Manual pagination
        int start = page * size;
        int end = Math.min(start + size, allGroups.size());
        List<Map<String, Object>> pageContent = start < allGroups.size() ? allGroups.subList(start, end) : List.of();
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", pageContent);
        response.put("page", page);
        response.put("size", size);
        response.put("totalElements", allGroups.size());
        response.put("totalPages", (int) Math.ceil((double) allGroups.size() / size));
        response.put("hasNext", end < allGroups.size());
        
        long endTime = System.currentTimeMillis();
        log.info("Paginated available groups fetched in {}ms - page {} of {} (total {} groups)", 
                endTime - startTime, page, response.get("totalPages"), allGroups.size());
        
        return ResponseEntity.ok(response);
    }
    
    private boolean checkUserMembership(Long groupId, String userId) {
        try {
            return groupRepository.findById(groupId)
                .map(group -> group.hasUser(userId))
                .orElse(false);
        } catch (Exception e) {
            log.warn("Error checking membership for user {} in group {}: {}", userId, groupId, e.getMessage());
            return false;
        }
    }

    @GetMapping("/groups/{id}/events/paginated")
    ResponseEntity<Map<String, Object>> getGroupEventsPaginated(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String date) {

        Optional<Group> groupOpt = groupRepository.findById(id);
        if (groupOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Group group = groupOpt.get();

        // Get events for this group and convert to list
        List<Map<String, Object>> eventList = new ArrayList<>();
        if (group.getEvents() != null) {
            Collection<Event> groupEvents = group.getEvents();

            // Filter by date if provided (events on or after the selected date)
            if (date != null && !date.trim().isEmpty()) {
                groupEvents = groupEvents.stream()
                        .filter(event -> {
                            try {
                                java.time.LocalDate filterDate = java.time.LocalDate.parse(date);
                                java.time.LocalDate eventDate = event.getDate().atZone(java.time.ZoneId.systemDefault())
                                        .toLocalDate();
                                return !eventDate.isBefore(filterDate); // On or after selected date
                            } catch (Exception e) {
                                return false; // Skip events with invalid dates
                            }
                        })
                        .collect(Collectors.toList());
            }

            eventList = groupEvents.stream()
                    .map(event -> {
                        Map<String, Object> eventWithGroup = new HashMap<>();
                        eventWithGroup.put("id", event.getId());
                        eventWithGroup.put("date", event.getDate());
                        eventWithGroup.put("title", event.getTitle());
                        eventWithGroup.put("description", event.getDescription());

                        // Add group info
                        Map<String, Object> groupInfo = new HashMap<>();
                        groupInfo.put("id", group.getId());
                        groupInfo.put("name", group.getName());
                        groupInfo.put("address", group.getAddress());
                        groupInfo.put("city", group.getCity());
                        groupInfo.put("stateOrProvince", group.getStateOrProvince());
                        groupInfo.put("country", group.getCountry());
                        groupInfo.put("postalCode", group.getPostalCode());
                        groupInfo.put("imageUrl", group.getImageUrl());
                        eventWithGroup.put("group", groupInfo);

                        // Add attendees
                        if (event.getAttendees() != null) {
                            List<Map<String, Object>> attendees = event.getAttendees().stream()
                                    .map(attendee -> {
                                        Map<String, Object> attendeeInfo = new HashMap<>();
                                        attendeeInfo.put("id", attendee.getId());
                                        attendeeInfo.put("name", attendee.getName());
                                        attendeeInfo.put("email", attendee.getEmail());
                                        attendeeInfo.put("profilePictureUrl", attendee.getProfilePictureUrl());
                                        return attendeeInfo;
                                    })
                                    .collect(Collectors.toList());
                            eventWithGroup.put("attendees", attendees);
                        }

                        return eventWithGroup;
                    })
                    .sorted((e1, e2) -> ((java.time.Instant) e1.get("date"))
                            .compareTo((java.time.Instant) e2.get("date")))
                    .collect(Collectors.toList());
        }

        // Manual pagination
        int start = page * size;
        int end = Math.min(start + size, eventList.size());
        List<Map<String, Object>> pageContent = start < eventList.size() ? eventList.subList(start, end) : List.of();

        Map<String, Object> response = new HashMap<>();
        response.put("content", pageContent);
        response.put("page", page);
        response.put("size", size);
        response.put("totalElements", eventList.size());
        response.put("totalPages", (int) Math.ceil((double) eventList.size() / size));
        response.put("hasNext", end < eventList.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/groups/{id}")
    ResponseEntity<?> getGroup(@PathVariable Long id) {
        Optional<Group> groupOpt = groupRepository.findById(id);
        if (groupOpt.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Group group = groupOpt.get();

        // Ensure group has a consistent image
        if (group.getImageUrl() == null || group.getImageUrl().isEmpty()) {
            group.setImageUrl(imageService.generateRandomImageUrl(group.getId()));
            group = groupRepository.save(group);
        }

        Map<String, Object> groupWithEvents = new java.util.HashMap<>();
        groupWithEvents.put("id", group.getId());
        groupWithEvents.put("name", group.getName());
        groupWithEvents.put("imageUrl", group.getImageUrl());
        groupWithEvents.put("address", group.getAddress());
        groupWithEvents.put("city", group.getCity());
        groupWithEvents.put("stateOrProvince", group.getStateOrProvince());
        groupWithEvents.put("country", group.getCountry());
        groupWithEvents.put("postalCode", group.getPostalCode());

        // Add events
        if (group.getEvents() != null) {
            Collection<Map<String, Object>> events = group.getEvents().stream()
                    .map(event -> {
                        Map<String, Object> eventInfo = new java.util.HashMap<>();
                        eventInfo.put("id", event.getId());
                        eventInfo.put("date", event.getDate());
                        eventInfo.put("title", event.getTitle());
                        eventInfo.put("description", event.getDescription());

                        // Add attendees
                        if (event.getAttendees() != null) {
                            Collection<Map<String, Object>> attendees = event.getAttendees().stream()
                                    .map(attendee -> {
                                        Map<String, Object> attendeeInfo = new java.util.HashMap<>();
                                        attendeeInfo.put("id", attendee.getId());
                                        attendeeInfo.put("name", attendee.getName());
                                        attendeeInfo.put("email", attendee.getEmail());
                                        attendeeInfo.put("profilePictureUrl", attendee.getProfilePictureUrl());
                                        return attendeeInfo;
                                    })
                                    .collect(java.util.stream.Collectors.toList());
                            eventInfo.put("attendees", attendees);
                        }

                        return eventInfo;
                    })
                    .collect(java.util.stream.Collectors.toList());
            groupWithEvents.put("events", events);
        }

        return ResponseEntity.ok().body(groupWithEvents);
    }

    @PostMapping("/groups")
    ResponseEntity<Group> createGroup(@Valid @RequestBody Group group,
            Principal principal, HttpServletRequest request) throws URISyntaxException {
        log.info("Request to create group: {}", group);

        String userId = getUserId(principal, request);
        Map<String, Object> userDetails = getUserDetails(principal, request);

        // check to see if user already exists
        Optional<User> user = userRepository.findById(userId);
        User currentUser = user.orElse(new User(userId,
                userDetails.get("name").toString(), userDetails.get("email").toString()));

        // Check if a group with this name already exists
        Optional<Group> existingGroup = groupRepository.findByName(group.getName());
        if (existingGroup.isPresent()) {
            // If the group already exists, associate it with the current user
            Group existing = existingGroup.get();
            if (existing.getUsers().isEmpty()) {
                // Group exists but has no users, associate it with current user
                existing.addUser(currentUser);

                // Set consistent image if not already set
                if (existing.getImageUrl() == null || existing.getImageUrl().isEmpty()) {
                    existing.setImageUrl(imageService.generateRandomImageUrl(existing.getId()));
                }

                Group result = groupRepository.save(existing);
                return ResponseEntity.ok().body(result);
            } else if (existing.hasUser(userId)) {
                // User already has this group
                return ResponseEntity.ok().body(existing);
            } else {
                // Group belongs to another user, create a new one
                group.addUser(currentUser);

                // Save first to get the generated ID
                Group savedGroup = groupRepository.save(group);

                // Now assign a consistent image using the group ID as seed
                savedGroup.setImageUrl(imageService.generateRandomImageUrl(savedGroup.getId()));

                // Save again with the image URL
                Group result = groupRepository.save(savedGroup);
                return ResponseEntity.created(new URI("/api/group/" + result.getId()))
                        .body(result);
            }
        }

        // No existing group found, create new one
        group.addUser(currentUser);

        // Save first to get the generated ID
        Group savedGroup = groupRepository.save(group);

        // Now assign a consistent image using the group ID as seed
        savedGroup.setImageUrl(imageService.generateRandomImageUrl(savedGroup.getId()));

        // Save again with the image URL
        Group result = groupRepository.save(savedGroup);
        return ResponseEntity.created(new URI("/api/group/" + result.getId()))
                .body(result);
    }

    @PostMapping("/groups/members/{id}")
    @Transactional
    ResponseEntity<?> joinGroup(@PathVariable("id") Long groupId,
            Principal principal, HttpServletRequest request) {
        log.info("Request to join group: {}", groupId);

        String userId = getUserId(principal, request);
        Map<String, Object> userDetails = getUserDetails(principal, request);

        log.info("User ID: {}", userId);

        // Find or create user
        Optional<User> user = userRepository.findById(userId);
        User currentUser = user.orElse(new User(userId,
                userDetails.get("name").toString(), userDetails.get("email").toString()));

        // Save the user if it's new
        if (user.isEmpty()) {
            // Assign a random profile picture to the new user
            currentUser.setProfilePictureUrl(imageService.generateRandomProfilePictureUrl(userId));
            currentUser = userRepository.save(currentUser);
            log.info("Created new user: {}", currentUser.getName());
        } else {
            log.info("Found existing user: {}", currentUser.getName());
        }

        // Find the group
        Optional<Group> groupOpt = groupRepository.findById(groupId);
        if (groupOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Group group = groupOpt.get();
        log.info("Found group: {}", group.getName());

        // Check if user is already a member
        if (group.hasUser(userId)) {
            log.info("User {} is already a member of group {}", userId, groupId);
            return ResponseEntity.ok().body("User is already a member of this group");
        }

        // Add user to group
        group.addUser(currentUser);
        Group result = groupRepository.save(group);
        log.info("User {} successfully joined group {}", userId, groupId);

        return ResponseEntity.ok().body(result);
    }

    @PutMapping("/groups/{id}")
    ResponseEntity<Group> updateGroup(@PathVariable Long id, @Valid @RequestBody Group groupData,
            Principal principal, HttpServletRequest request) {
        log.info("Request to update group: {}", groupData);

        // Find the existing group to preserve user associations
        Optional<Group> existingGroupOpt = groupRepository.findById(id);
        if (existingGroupOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Group existingGroup = existingGroupOpt.get();

        // Update only the basic group fields, preserve user associations
        existingGroup.setName(groupData.getName());
        existingGroup.setAddress(groupData.getAddress());
        existingGroup.setCity(groupData.getCity());
        existingGroup.setStateOrProvince(groupData.getStateOrProvince());
        existingGroup.setCountry(groupData.getCountry());
        existingGroup.setPostalCode(groupData.getPostalCode());
        existingGroup.setImageUrl(groupData.getImageUrl());

        Group result = groupRepository.save(existingGroup);
        return ResponseEntity.ok().body(result);
    }

    @DeleteMapping("/groups/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id) {
        log.info("Request to delete group: {}", id);
        groupRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/groups/members/{id}")
    @Transactional
    public ResponseEntity<?> leaveGroup(@PathVariable("id") Long id,
            Principal principal, HttpServletRequest request) {
        log.info("Request to leave group: {}", id);

        String userId = getUserId(principal, request);

        // Find the group
        Optional<Group> groupOpt = groupRepository.findById(id);
        if (groupOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Group group = groupOpt.get();

        // Check if the user is actually a member of this group
        if (!group.hasUser(userId)) {
            return ResponseEntity.badRequest().body("User is not a member of this group");
        }

        // Find the user to remove
        User userToRemove = group.getUsers().stream()
                .filter(u -> u.getId().equals(userId))
                .findFirst()
                .orElse(null);

        // Remove the user from the group
        if (userToRemove != null) {
            group.removeUser(userToRemove);
            groupRepository.save(group);
            log.info("User {} successfully left group {}", userId, id);
        }

        return ResponseEntity.ok().build();
    }

    private String getUserId(Principal principal, HttpServletRequest request) {
        // Try JWT first
        io.jsonwebtoken.Claims claims = (io.jsonwebtoken.Claims) request.getAttribute("jwtClaims");
        if (claims != null) {
            return claims.getSubject();
        }
        // Fallback to OAuth2
        return principal.getName();
    }

    private Map<String, Object> getUserDetails(Principal principal, HttpServletRequest request) {
        // Try JWT first
        io.jsonwebtoken.Claims claims = (io.jsonwebtoken.Claims) request.getAttribute("jwtClaims");
        if (claims != null) {
            Map<String, Object> details = new HashMap<>();
            details.put("sub", claims.getSubject());
            details.put("name", claims.get("name"));
            details.put("email", claims.get("email"));
            return details;
        }
        // Fallback to OAuth2
        if (principal instanceof OAuth2AuthenticationToken) {
            OAuth2AuthenticationToken oauth2Token = (OAuth2AuthenticationToken) principal;
            return oauth2Token.getPrincipal().getAttributes();
        }
        return new HashMap<>();
    }
}