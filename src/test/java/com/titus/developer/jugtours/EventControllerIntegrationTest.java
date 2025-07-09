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

@SpringBootTest(properties = { "spring.autoconfigure.exclude=" })
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

    private Group testGroup;
    private Event testEvent;

    @BeforeEach
    void setup() {
        // Create and save a test group
        testGroup = new Group("Test Group");
        testGroup = groupRepository.save(testGroup);

        // Create and save a test event
        testEvent = Event.builder()
                .title("Test Event")
                .description("Test Event Description")
                .date(Instant.now())
                .group(testGroup)
                .build();
        testEvent = eventRepository.save(testEvent);
    }

    @Test
    void testGetEvents() throws Exception {
        mockMvc.perform(get("/api/events").with(user("test-user")))
                .andExpect(status().isOk());
    }

    @Test
    void testGetAvailableEvents() throws Exception {
        mockMvc.perform(get("/api/events/available")
                .contentType(MediaType.APPLICATION_JSON)
                .with(user("test-user")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[?(@.title == 'Test Event' && @.description == 'Test Event Description')]")
                        .exists());
    }

    @Test
    void testGetEventById() throws Exception {
        mockMvc.perform(get("/api/events/" + testEvent.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .with(user("test-user")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(testEvent.getId()))
                .andExpect(jsonPath("$.title").value("Test Event"))
                .andExpect(jsonPath("$.description").value("Test Event Description"))
                .andExpect(jsonPath("$.group.name").value("Test Group"));
    }

    @Test
    void testGetEventByIdNotFound() throws Exception {
        mockMvc.perform(get("/api/events/99999")
                .contentType(MediaType.APPLICATION_JSON)
                .with(user("test-user")))
                .andExpect(status().isNotFound());
    }

    // @Test
    // void testCreateEvent() throws Exception {
    // Map<String, Object> eventRequest = new HashMap<>();
    // eventRequest.put("title", "New Test Event");
    // eventRequest.put("description", "New Test Event Description");
    // eventRequest.put("date", Instant.now().plusSeconds(7200)); // 2 hours from
    // now
    // eventRequest.put("groupId", testGroup.getId());

    // mockMvc.perform(post("/api/events")
    // .contentType(MediaType.APPLICATION_JSON)
    // .with(user("test-user"))
    // .content(objectMapper.writeValueAsString(eventRequest)))
    // .andExpect(status().isCreated())
    // .andExpect(content().contentType(MediaType.APPLICATION_JSON))
    // .andExpect(jsonPath("$.title").value("New Test Event"))
    // .andExpect(jsonPath("$.description").value("New Test Event Description"));
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testCreateEventWithInvalidGroup() throws Exception {
    // Map<String, Object> eventRequest = new HashMap<>();
    // eventRequest.put("title", "New Test Event");
    // eventRequest.put("description", "New Test Event Description");
    // eventRequest.put("date", Instant.now().plusSeconds(7200));
    // eventRequest.put("groupId", 99999L); // Non-existent group

    // mockMvc.perform(post("/api/events")
    // .contentType(MediaType.APPLICATION_JSON)
    // .content(objectMapper.writeValueAsString(eventRequest)))
    // .andExpect(status().isBadRequest());
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testJoinEvent() throws Exception {
    // mockMvc.perform(post("/api/events/" + testEvent.getId() + "/attendees")
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isOk())
    // .andExpect(content().contentType(MediaType.APPLICATION_JSON))
    // .andExpect(jsonPath("$.title").value("Test Event"));

    // // Verify user was added as attendee
    // Event updatedEvent =
    // eventRepository.findById(testEvent.getId()).orElse(null);
    // assert updatedEvent != null;
    // assert updatedEvent.hasAttendee("test-user-123");
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testJoinEventAlreadyAttending() throws Exception {
    // // Add user as attendee first
    // testEvent.addAttendee(testUser);
    // eventRepository.save(testEvent);

    // mockMvc.perform(post("/api/events/" + testEvent.getId() + "/attendees")
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isOk())
    // .andExpect(content().string("User is already attending this event"));
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testJoinEventNotFound() throws Exception {
    // mockMvc.perform(post("/api/events/99999/attendees")
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isNotFound());
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testLeaveEvent() throws Exception {
    // // Add user as attendee first
    // testEvent.addAttendee(testUser);
    // eventRepository.save(testEvent);

    // mockMvc.perform(delete("/api/events/" + testEvent.getId() + "/attendees")
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isOk());

    // // Verify user was removed as attendee
    // Event updatedEvent =
    // eventRepository.findById(testEvent.getId()).orElse(null);
    // assert updatedEvent != null;
    // assert !updatedEvent.hasAttendee("test-user-123");
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testLeaveEventNotAttending() throws Exception {
    // mockMvc.perform(delete("/api/events/" + testEvent.getId() + "/attendees")
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isBadRequest())
    // .andExpect(content().string("User is not attending this event"));
    // }

    // @Test
    // void testUpdateEvent() throws Exception {
    // Event updateData = Event.builder()
    // .title("Updated Event Title")
    // .description("Updated Event Description")
    // .date(Instant.now().plusSeconds(10800)) // 3 hours from now
    // .group(testGroup)
    // .build();

    // mockMvc.perform(put("/api/events/" + testEvent.getId())
    // .contentType(MediaType.APPLICATION_JSON)
    // .content(objectMapper.writeValueAsString(updateData)))
    // .andExpect(status().isOk())
    // .andExpect(content().contentType(MediaType.APPLICATION_JSON))
    // .andExpect(jsonPath("$.title").value("Updated Event Title"))
    // .andExpect(jsonPath("$.description").value("Updated Event Description"));
    // }

    // @Test
    // void testDeleteEvent() throws Exception {
    // mockMvc.perform(delete("/api/events/" + testEvent.getId())
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isOk());

    // // Verify event was deleted
    // assert eventRepository.findById(testEvent.getId()).isEmpty();
    // }
}