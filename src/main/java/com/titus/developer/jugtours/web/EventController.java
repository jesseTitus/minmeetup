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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.context.annotation.Profile;

import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.Principal;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
class EventController {

    private final Logger log = LoggerFactory.getLogger(EventController.class);
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
    Collection<Map<String, Object>> availableEvents() {
        Collection<Event> allEvents = eventRepository.findAll();
        return allEvents.stream().map(event -> {
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

            return eventWithGroup;
        }).collect(java.util.stream.Collectors.toList());
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
            @AuthenticationPrincipal OAuth2User principal) throws URISyntaxException {
        log.info("Request to create event: {}", eventRequest);

        Map<String, Object> details = principal.getAttributes();
        String userId = details.get("sub").toString();

        // Find or create user
        Optional<User> user = userRepository.findById(userId);
        User currentUser = user.orElse(new User(userId,
                details.get("name").toString(), details.get("email").toString()));

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
    ResponseEntity<Event> updateEvent(@Valid @RequestBody Event event) {
        log.info("Request to update event: {}", event);
        Event result = eventRepository.save(event);
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
            @AuthenticationPrincipal OAuth2User principal) {
        log.info("Request to attend event: {}", eventId);
        Map<String, Object> details = principal.getAttributes();
        String userId = details.get("sub").toString();
        log.info("User ID: {}", userId);

        // Find user
        Optional<User> user = userRepository.findById(userId);
        User currentUser = user.orElse(new User(userId,
                details.get("name").toString(), details.get("email").toString()));

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
            @AuthenticationPrincipal OAuth2User principal) {
        log.info("Request to leave event: {}", eventId);
        Map<String, Object> details = principal.getAttributes();
        String userId = details.get("sub").toString();

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
}