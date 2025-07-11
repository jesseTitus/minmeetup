package com.titus.developer.jugtours;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.titus.developer.jugtours.model.Event;
import com.titus.developer.jugtours.model.EventRepository;
import com.titus.developer.jugtours.model.Group;
import com.titus.developer.jugtours.model.GroupRepository;
import com.titus.developer.jugtours.model.User;
import com.titus.developer.jugtours.model.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.context.annotation.Import;
import com.titus.developer.jugtours.TestSecurityConfig;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientAutoConfiguration"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class EventControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private GroupRepository groupRepository;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;

    private Group testGroup;
    private Event testEvent;
    private User testUser;

    @BeforeEach
    @Transactional
    void setup() {
        // Create and save a test user
        testUser = new User("test-user", "Test User", "testuser@example.com");
        testUser = userRepository.save(testUser);
        userRepository.flush();

        // Create and save a test group, add test user as member
        testGroup = new Group("Test Group");
        testGroup.addUser(testUser);
        testGroup = groupRepository.save(testGroup);
        groupRepository.flush();

        // Create and save a test event
        testEvent = Event.builder()
                .title("Test Event")
                .description("Test Event Description")
                .date(Instant.now())
                .group(testGroup)
                .build();
        testEvent = eventRepository.save(testEvent);
        eventRepository.flush();
    }

    @Test
    void testGetEvents() throws Exception {
        mockMvc.perform(get("/api/events")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void testGetAvailableEvents() throws Exception {
        mockMvc.perform(get("/api/events/available")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isNotEmpty())
                .andExpect(jsonPath("$[?(@.title == 'Test Event')]").exists())
                .andExpect(jsonPath("$[?(@.title == 'Test Event')].description").value("Test Event Description"));
    }

    @Test
    void testGetEventById() throws Exception {
        mockMvc.perform(get("/api/events/" + testEvent.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Event"));
    }

    @Test
    void testGetEventByIdNotFound() throws Exception {
        mockMvc.perform(get("/api/events/99999")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateEvent() throws Exception {
        Map<String, Object> eventRequest = new HashMap<>();
        eventRequest.put("title", "New Test Event");
        eventRequest.put("description", "New Test Event Description");
        eventRequest.put("date", Instant.now().plusSeconds(7200)); // 2 hours from now
        eventRequest.put("groupId", testGroup.getId());

        mockMvc.perform(post("/api/events")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                }))
                .content(objectMapper.writeValueAsString(eventRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("New Test Event"));
    }

    @Test
    // @WithMockUser(username = "test-user-123")
    void testCreateEventWithInvalidGroup() throws Exception {
        Map<String, Object> eventRequest = new HashMap<>();
        eventRequest.put("title", "New Test Event");
        eventRequest.put("description", "New Test Event Description");
        eventRequest.put("date", Instant.now().plusSeconds(7200));
        eventRequest.put("groupId", 99999L); // Non-existent group

        mockMvc.perform(post("/api/events")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                }))
                .content(objectMapper.writeValueAsString(eventRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testJoinEvent() throws Exception {
        mockMvc.perform(post("/api/events/" + testEvent.getId() + "/attendees")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.title").value("Test Event"));

        // Verify user was added as attendee
        Event updatedEvent = eventRepository.findById(testEvent.getId()).orElse(null);
        assert updatedEvent != null;
        assert updatedEvent.hasAttendee("test-user");
    }

    @Test
    void testJoinEventAlreadyAttending() throws Exception {
        // Add user as attendee first
        testEvent.addAttendee(testUser);
        eventRepository.save(testEvent);

        mockMvc.perform(post("/api/events/" + testEvent.getId() + "/attendees")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isOk())
                .andExpect(content().string("User is already attending this event"));
    }

    @Test
    void testJoinEventNotFound() throws Exception {
        mockMvc.perform(post("/api/events/99999/attendees")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isNotFound());
    }

    @Test
    void testLeaveEvent() throws Exception {
        // Add user as attendee first
        testEvent.addAttendee(testUser);
        eventRepository.save(testEvent);

        mockMvc.perform(delete("/api/events/" + testEvent.getId() + "/attendees")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isOk());

        // Verify user was removed as attendee
        Event updatedEvent = eventRepository.findById(testEvent.getId()).orElse(null);
        assert updatedEvent != null;
        assert !updatedEvent.hasAttendee("test-user-123");
    }

    @Test
    void testLeaveEventNotAttending() throws Exception {
        mockMvc.perform(delete("/api/events/" + testEvent.getId() + "/attendees")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("User is not attending this event"));
    }

    @Test
    void testUpdateEvent() throws Exception {
        Event updateData = Event.builder()
                .title("Updated Event Title")
                .description("Updated Event Description")
                .date(Instant.now().plusSeconds(10800)) // 3 hours from now
                .group(testGroup)
                .build();

        mockMvc.perform(put("/api/events/" + testEvent.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                }))
                .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.title").value("Updated Event Title"))
                .andExpect(jsonPath("$.description").value("Updated Event Description"));
    }

    @Test
    void testDeleteEvent() throws Exception {
        mockMvc.perform(delete("/api/events/" + testEvent.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Verify event was deleted
        assert eventRepository.findById(testEvent.getId()).isEmpty();
    }
}