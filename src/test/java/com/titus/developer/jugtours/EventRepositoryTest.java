package com.titus.developer.jugtours;

import com.titus.developer.jugtours.model.Event;
import com.titus.developer.jugtours.model.EventRepository;

import com.titus.developer.jugtours.model.Group;
import com.titus.developer.jugtours.model.GroupRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
public class EventRepositoryTest {

    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private GroupRepository groupRepository;

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
}