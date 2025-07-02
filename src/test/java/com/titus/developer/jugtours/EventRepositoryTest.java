package com.titus.developer.jugtours;

import com.titus.developer.jugtours.model.Event;
import com.titus.developer.jugtours.model.EventRepository;

import com.titus.developer.jugtours.model.Group;
import com.titus.developer.jugtours.model.GroupRepository;
import com.titus.developer.jugtours.model.User;
import com.titus.developer.jugtours.model.UserRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Set;

@DataJpaTest
public class EventRepositoryTest {

    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private GroupRepository groupRepository;
    @Autowired
    private UserRepository userRepository;

    @Test
    public void testSaveAndFindEvent() {
        Group group = new Group("Test Group");
        groupRepository.save(group);

        Event event = new Event();// null, null, "Test Event", null, group.getId(),
        // null);
        event.setTitle("Test Event");
        event.setGroup(group);
        eventRepository.save(event);

        Event found = eventRepository.findByTitle("Test Event").orElse(null);
        assertThat(found).isNotNull();
        assertThat(found.getTitle()).isEqualTo("Test Event");
    }

    @Test
    public void testFindAllEventsByUserId() {

        Group group = new Group("Test Group");
        groupRepository.save(group);

        User user1 = new User("id1", "User One", "one@example.com");
        userRepository.save(user1);
        userRepository.flush();

        Event event1 = new Event();
        event1.setTitle("Test Event 1");
        event1.setGroup(group);
        event1.setAttendees(Set.of(user1));
        eventRepository.save(event1);

        Event event2 = new Event();
        event2.setTitle("Test Event 2");
        event2.setGroup(group);
        event2.setAttendees(Set.of(user1));
        eventRepository.save(event2);

        // Use the custom findAllById method that finds events by attendee ID
        List<Event> userEvents = eventRepository.findAllById("id1");
        assertThat(userEvents).hasSize(2);

        // Check if both events are found by their titles
        assertThat(userEvents).extracting("title")
                .containsExactlyInAnyOrder("Test Event 1", "Test Event 2");
    }

    @Test
    public void testFindAllAttendeesByEventId() {
        User user1 = new User("id1", "User One", "one@example.com");
        userRepository.save(user1);
        User user2 = new User("id2", "User Two", "two@example.com");
        userRepository.save(user2);
        userRepository.flush();

        Group group = new Group("Event Group");
        groupRepository.save(group);

        Event event = new Event();
        event.setTitle("Event with Attendees");
        event.setGroup(group);
        event.setAttendees(Set.of(user1, user2)); // Add both users as attendees
        eventRepository.save(event);

        // Find the event by ID to get its attendees
        List<User> attendees = eventRepository.findAllAttendeesById(event.getId());

        // Check that both attendees are present and their names match
        assertThat(attendees).hasSize(2);
        assertThat(attendees).extracting("name")
                .containsExactlyInAnyOrder("User One", "User Two");
    }

    @Test
    public void testSaveEventWithAttendees() {
        User user = new User("id1", "User One", "one@example.com");
        userRepository.save(user);
        userRepository.flush();

        Group group = new Group("Event Group");
        groupRepository.save(group);

        Event event = new Event();
        event.setTitle("Event with Attendee");
        event.setGroup(group);
        event.setAttendees(Set.of(user));
        eventRepository.save(event);

        Event found = eventRepository.findByTitle("Event with Attendee")
                .orElse(null);
        assertThat(found).isNotNull();
        assertThat(found.getAttendees()).contains(user);
    }

    @Test
    public void testDeleteEvent() {
        Group group = new Group("Event Group");
        groupRepository.save(group);

        Event event = new Event();
        event.setTitle("ToDelete");
        event.setGroup(group);
        eventRepository.save(event);
        eventRepository.delete(event);
        var found = eventRepository.findByTitle("ToDelete");
        assertThat(found).isEmpty();
    }
}