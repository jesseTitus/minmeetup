package com.titus.developer.jugtours.web;

import com.titus.developer.jugtours.model.Event;
import com.titus.developer.jugtours.model.EventRepository;
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
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api")
class EventController {

    private static final Logger log = LoggerFactory.getLogger(EventController.class);
    private EventRepository eventRepository;
    private GroupRepository groupRepository;
    private UserRepository userRepository;
    private ImageService imageService;

    public EventController(EventRepository eventRepository, GroupRepository groupRepository,
            UserRepository userRepository, ImageService imageService) {
        this.eventRepository = eventRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.imageService = imageService;
    }

    @GetMapping("/events")
    Collection<Map<String, Object>> events(Principal principal) {
        Collection<Event> userEvents = eventRepository.findAllById(principal.getName());
        return userEvents.stream().map(event -> {
            Map<String, Object> eventWithGroup = new java.util.HashMap<>();
            eventWithGroup.put("id", event.getId());
            eventWithGroup.put("date", event.getDate());
            eventWithGroup.put("title", event.getTitle());
            eventWithGroup.put("description", event.getDescription());

            if (event.getGroup() != null) {
                Map<String, Object> groupInfo = new java.util.HashMap<>();
                groupInfo.put("id", event.getGroup().getId());
                groupInfo.put("name", event.getGroup().getName());
                groupInfo.put("address", event.getGroup().getAddress());
                groupInfo.put("city", event.getGroup().getCity());
                groupInfo.put("stateOrProvince", event.getGroup().getStateOrProvince());
                groupInfo.put("country", event.getGroup().getCountry());
                groupInfo.put("postalCode", event.getGroup().getPostalCode());
                groupInfo.put("imageUrl", event.getGroup().getImageUrl());

                eventWithGroup.put("group", groupInfo);
            }

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
                eventWithGroup.put("attendees", attendees);
            }

            return eventWithGroup;
        }).collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("events/available")
    ResponseEntity<Map<String, Object>> availableEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String date) {

        long startTime = System.currentTimeMillis();
        log.info("Fetching events - Page: {}, Size: {}, Date filter: {}", page, size, date);

        Collection<Event> allEvents;
        long totalElements;

        if (date != null && !date.trim().isEmpty()) {
            // When filtering by date, get all events and filter in memory (for minimal
            // change)
            allEvents = eventRepository.findAll();
            allEvents = allEvents.stream()
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
                    .sorted((e1, e2) -> e1.getDate().compareTo(e2.getDate()))
                    .collect(Collectors.toList());
            totalElements = allEvents.size();

            // Manual pagination for filtered results
            int start = page * size;
            int end = Math.min(start + size, allEvents.size());
            allEvents = start < allEvents.size() ? ((List<Event>) allEvents).subList(start, end) : List.of();
        } else {
            // Use efficient database pagination when no date filter
            Pageable pageable = PageRequest.of(page, size, Sort.by("date").ascending());
            Page<Event> eventPage = eventRepository.findAll(pageable);
            allEvents = eventPage.getContent();
            totalElements = eventPage.getTotalElements();
        }

        long dbTime = System.currentTimeMillis();
        log.info("Database query took: {}ms, returned {} events",
                dbTime - startTime, allEvents.size());

        // Process the events (either from pagination or filtering)
        List<Map<String, Object>> eventList = allEvents.stream()
                .map(event -> {
                    Map<String, Object> eventWithGroup = new HashMap<>();
                    eventWithGroup.put("id", event.getId());
                    eventWithGroup.put("date", event.getDate());
                    eventWithGroup.put("title", event.getTitle());
                    eventWithGroup.put("description", event.getDescription());

                    if (event.getGroup() != null) {
                        Map<String, Object> groupInfo = new HashMap<>();
                        groupInfo.put("id", event.getGroup().getId());
                        groupInfo.put("name", event.getGroup().getName());
                        groupInfo.put("address", event.getGroup().getAddress());
                        groupInfo.put("city", event.getGroup().getCity());
                        groupInfo.put("stateOrProvince", event.getGroup().getStateOrProvince());
                        groupInfo.put("country", event.getGroup().getCountry());
                        groupInfo.put("postalCode", event.getGroup().getPostalCode());
                        groupInfo.put("imageUrl", event.getGroup().getImageUrl());

                        eventWithGroup.put("group", groupInfo);
                    }

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
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", eventList);
        response.put("page", page);
        response.put("size", size);
        response.put("totalElements", totalElements);
        response.put("totalPages", (int) Math.ceil((double) totalElements / size));
        response.put("hasNext", (page + 1) * size < totalElements);

        long totalTime = System.currentTimeMillis() - startTime;
        log.info("Request completed in {}ms - Sent {} events to client",
                totalTime, eventList.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("events/calendar-dates")
    ResponseEntity<Map<String, Object>> getCalendarDates() {
        Collection<Event> allEvents = eventRepository.findAll();

        // Group events by date and count them
        Map<String, Integer> dateCountMap = new HashMap<>();

        for (Event event : allEvents) {
            String dateKey = event.getDate().toString().substring(0, 10); // YYYY-MM-DD format
            dateCountMap.put(dateKey, dateCountMap.getOrDefault(dateKey, 0) + 1);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("eventDates", dateCountMap);
        response.put("totalEvents", allEvents.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/events/search")
    ResponseEntity<List<Event>> searchEvents(@RequestParam String q, Principal principal, HttpServletRequest request) {
        log.info("Request to search events with query: {}", q);

        String userId = getUserId(principal, request);
        Map<String, Object> userDetails = getUserDetails(principal, request);

        // Find or create user
        Optional<User> user = userRepository.findById(userId);
        user.orElse(new User(userId,
                userDetails.get("name").toString(), userDetails.get("email").toString()));

        // Search events by title (case-insensitive)
        List<Event> searchResults = eventRepository.findByTitleContainingIgnoreCase(q.trim());

        return ResponseEntity.ok(searchResults);
    }

    @GetMapping("/events/{id}")
    ResponseEntity<?> getEvent(@PathVariable Long id) {
        Optional<Event> eventOpt = eventRepository.findById(id);
        if (eventOpt.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Event event = eventOpt.get();
        Map<String, Object> eventWithGroup = new java.util.HashMap<>();
        eventWithGroup.put("id", event.getId());
        eventWithGroup.put("date", event.getDate());
        eventWithGroup.put("title", event.getTitle());
        eventWithGroup.put("description", event.getDescription());

        if (event.getGroup() != null) {
            Map<String, Object> groupInfo = new java.util.HashMap<>();
            groupInfo.put("id", event.getGroup().getId());
            groupInfo.put("name", event.getGroup().getName());
            groupInfo.put("address", event.getGroup().getAddress());
            groupInfo.put("city", event.getGroup().getCity());
            groupInfo.put("stateOrProvince", event.getGroup().getStateOrProvince());
            groupInfo.put("country", event.getGroup().getCountry());
            groupInfo.put("postalCode", event.getGroup().getPostalCode());
            groupInfo.put("imageUrl", event.getGroup().getImageUrl());

            eventWithGroup.put("group", groupInfo);
        }

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
            eventWithGroup.put("attendees", attendees);
        }

        return ResponseEntity.ok().body(eventWithGroup);
    }

    @PostMapping("/events")
    ResponseEntity<Event> createEvent(@Valid @RequestBody EventRequest eventRequest,
            Principal principal, HttpServletRequest request) throws URISyntaxException {
        log.info("Request to create event: {}", eventRequest);

        String userId = getUserId(principal, request);
        Map<String, Object> userDetails = getUserDetails(principal, request);

        // Find or create user
        Optional<User> user = userRepository.findById(userId);
        user.orElse(new User(userId,
                userDetails.get("name").toString(), userDetails.get("email").toString()));

        // Find the group and verify user owns it
        Optional<Group> group = groupRepository.findById(eventRequest.getGroupId());
        if (group.isEmpty() || group.get().getUsers().isEmpty() ||
                !group.get().hasUser(userId)) {
            return ResponseEntity.badRequest().build();
        }

        // Create the event
        Event event = Event.builder()
                .title(eventRequest.getTitle())
                .description(eventRequest.getDescription())
                .date(eventRequest.getDate())
                .group(group.get())
                .build();

        Event result = eventRepository.save(event);
        return ResponseEntity.created(new URI("/api/events/" + result.getId()))
                .body(result);
    }

    @PutMapping("/events/{id}")
    ResponseEntity<Event> updateEvent(@PathVariable Long id, @Valid @RequestBody EventRequest eventRequest,
            Principal principal, HttpServletRequest request) {
        log.info("Request to update event: {}", eventRequest);

        String userId = getUserId(principal, request);

        // Find the existing event
        Optional<Event> existingEventOpt = eventRepository.findById(id);
        if (existingEventOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Event existingEvent = existingEventOpt.get();

        // Verify user has permission to update this event (owns the group)
        if (existingEvent.getGroup() == null || !existingEvent.getGroup().hasUser(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Update the event fields while preserving the group association
        existingEvent.setTitle(eventRequest.getTitle());
        existingEvent.setDescription(eventRequest.getDescription());
        existingEvent.setDate(eventRequest.getDate());
        // Keep the existing group - don't change it

        Event result = eventRepository.save(existingEvent);
        return ResponseEntity.ok().body(result);
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        log.info("Request to delete event: {}", id);
        eventRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/events/{id}/attendees")
    @Transactional
    ResponseEntity<?> joinEvent(@PathVariable("id") Long eventId,
            Principal principal, HttpServletRequest request) {
        log.info("Request to attend event: {}", eventId);

        String userId = getUserId(principal, request);
        Map<String, Object> userDetails = getUserDetails(principal, request);

        log.info("User ID: {}", userId);

        // Find user
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

        // Find the event
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        if (eventOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Event event = eventOpt.get();
        log.info("Found event: {}", event.getTitle());

        // check if user is already attending
        if (event.hasAttendee(userId)) {
            log.info("User {} is already attending event {}", userId, eventId);
            return ResponseEntity.ok().body("User is already attending this event");
        }

        // add user to event
        event.addAttendee(currentUser);
        Event result = eventRepository.save(event);
        log.info("User {} successfully joined event {}", userId, eventId);

        return ResponseEntity.ok().body(result);
    }

    @DeleteMapping("/events/{id}/attendees")
    @Transactional
    ResponseEntity<?> leaveEvent(@PathVariable("id") Long eventId,
            Principal principal, HttpServletRequest request) {
        log.info("Request to leave event: {}", eventId);

        String userId = getUserId(principal, request);

        // Find the event
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        if (eventOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Event event = eventOpt.get();

        // Check if the user is actually attending this event
        if (!event.hasAttendee(userId)) {
            return ResponseEntity.badRequest().body("User is not attending this event");
        }

        // Find the user to remove
        User userToRemove = event.getAttendees().stream()
                .filter(u -> u.getId().equals(userId))
                .findFirst()
                .orElse(null);

        // Remove the user from the event
        if (userToRemove != null) {
            event.removeAttendee(userToRemove);
            eventRepository.save(event);
            log.info("User {} successfully left event {}", userId, eventId);
        }

        return ResponseEntity.ok().build();
    }
    // // Logic to remove user from event attendees
    // }

    // DTO for event creation
    public static class EventRequest {
        private String title;
        private String description;
        private java.time.Instant date;
        private Long groupId;

        // Getters and setters
        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public java.time.Instant getDate() {
            return date;
        }

        public void setDate(java.time.Instant date) {
            this.date = date;
        }

        public Long getGroupId() {
            return groupId;
        }

        public void setGroupId(Long groupId) {
            this.groupId = groupId;
        }
    }

    // Helper methods to get user ID and details from either JWT claims or OAuth2
    // principal
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