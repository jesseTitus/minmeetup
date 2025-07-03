package com.titus.developer.jugtours.model;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Stream;

@Component
class Initializer implements CommandLineRunner {

    private final GroupRepository repository;

    public Initializer(GroupRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... strings) {
        Stream.of("Seattle JUG", "Denver JUG", "Dublin JUG",
                "London JUG").forEach(name -> repository.save(new Group(name)));

        Group djug = repository.findByName("Seattle JUG")
                .orElseThrow(() -> new IllegalStateException("Seattle JUG group not found after initialization!"));

        // Create 20 events, each 1 day apart starting from current date
        Set<Event> events = new HashSet<>();
        LocalDateTime startDate = LocalDateTime.now();

        for (int i = 0; i < 20; i++) {
            LocalDateTime eventDate = startDate.plusDays(i);
            Event event = Event.builder()
                    .title("Weekly Java Meetup")
                    .description(
                            "Join us for our weekly Java meetup where we discuss the latest in Java development, share knowledge, and network with fellow developers.")
                    .date(eventDate.toInstant(ZoneOffset.UTC))
                    .group(djug)
                    .build();
            events.add(event);
        }

        djug.setEvents(events);
        repository.save(djug);

        repository.findAll().forEach(System.out::println);
    }
}