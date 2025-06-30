package com.titus.developer.jugtours.web;

import com.titus.developer.jugtours.model.Event;
import com.titus.developer.jugtours.model.EventRepository;
import com.titus.developer.jugtours.model.Group;
import com.titus.developer.jugtours.model.GroupRepository;
import com.titus.developer.jugtours.model.User;
import com.titus.developer.jugtours.model.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

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

    public EventController(EventRepository eventRepository, GroupRepository groupRepository,
            UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/events")
    Collection<Map<String, Object>> events(Principal principal) {
        Collection<Event> userEvents = eventRepository.findAllByUserId(principal.getName());
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

                eventWithGroup.put("group", groupInfo);
            }

            return eventWithGroup;
        }).collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("events/available")
    Collection<Event> availableEvents() {
        return eventRepository.findAll();
    }

    @GetMapping("/event/{id}")
    ResponseEntity<?> getEvent(@PathVariable Long id) {
        Optional<Event> event = eventRepository.findById(id);
        return event.map(response -> ResponseEntity.ok().body(response))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping("/event")
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
        if (group.isEmpty() || group.get().getUser() == null ||
                !group.get().getUser().getId().equals(userId)) {
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
        return ResponseEntity.created(new URI("/api/event/" + result.getId()))
                .body(result);
    }

    @PutMapping("/event/{id}")
    ResponseEntity<Event> updateEvent(@Valid @RequestBody Event event) {
        log.info("Request to update event: {}", event);
        Event result = eventRepository.save(event);
        return ResponseEntity.ok().body(result);
    }

    @DeleteMapping("/event/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        log.info("Request to delete event: {}", id);
        eventRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

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