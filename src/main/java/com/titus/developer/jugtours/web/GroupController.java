package com.titus.developer.jugtours.web;

import com.titus.developer.jugtours.model.Group;
import com.titus.developer.jugtours.model.GroupRepository;
import com.titus.developer.jugtours.model.User;
import com.titus.developer.jugtours.model.UserRepository;
import com.titus.developer.jugtours.service.ImageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
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
    Collection<Group> groups(Principal principal, HttpServletRequest request) {
        String userId = getUserId(principal, request);
        return groupRepository.findAllByUserId(userId);
    }

    @GetMapping("/groups/available")
    Collection<Group> availableGroups() {
        return groupRepository.findAll();
    }

    @GetMapping("/groups/{id}")
    ResponseEntity<?> getGroup(@PathVariable Long id) {
        Optional<Group> groupOpt = groupRepository.findById(id);
        if (groupOpt.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        
        Group group = groupOpt.get();
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
            @AuthenticationPrincipal OAuth2User principal) throws URISyntaxException {
        log.info("Request to create group: {}", group);
        Map<String, Object> details = principal.getAttributes();
        String userId = details.get("sub").toString();

        // check to see if user already exists
        Optional<User> user = userRepository.findById(userId);
        User currentUser = user.orElse(new User(userId,
                details.get("name").toString(), details.get("email").toString()));

        // Check if a group with this name already exists
        Optional<Group> existingGroup = groupRepository.findByName(group.getName());
        if (existingGroup.isPresent()) {
            // If the group already exists, associate it with the current user
            Group existing = existingGroup.get();
            if (existing.getUsers().isEmpty()) {
                // Group exists but has no users, associate it with current user
                existing.addUser(currentUser);
                Group result = groupRepository.save(existing);
                return ResponseEntity.ok().body(result);
            } else if (existing.hasUser(userId)) {
                // User already has this group
                return ResponseEntity.ok().body(existing);
            } else {
                // Group belongs to another user, create a new one
                group.addUser(currentUser);
                Group result = groupRepository.save(group);
                return ResponseEntity.created(new URI("/api/group/" + result.getId()))
                        .body(result);
            }
        }

        // No existing group found, create new one
        group.addUser(currentUser);

        // Assign a random image to the group
        group.setImageUrl(imageService.generateRandomImageUrl());

        Group result = groupRepository.save(group);
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
    ResponseEntity<Group> updateGroup(@Valid @RequestBody Group group) {
        log.info("Request to update group: {}", group);
        Group result = groupRepository.save(group);
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