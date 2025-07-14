package com.titus.developer.jugtours.model;

import com.titus.developer.jugtours.service.ImageService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Stream;

@Component
class Initializer implements CommandLineRunner {

    private final GroupRepository repository;
    private final UserRepository userRepository;
    private final ImageService imageService;

    public Initializer(GroupRepository repository, UserRepository userRepository, ImageService imageService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.imageService = imageService;
    }

    @Override
    @Transactional
    public void run(String... strings) {
        Stream.of("Seattle JUG", "Denver JUG", "Dublin JUG",
                "London JUG").forEach(name -> repository.save(new Group(name)));

        Group djug = repository.findByName("Seattle JUG")
                .orElseThrow(() -> new IllegalStateException("Seattle JUG group not found after initialization!"));

        // Set location for Weekly Java Meetup at Grad Club, UWO
        djug.setAddress("Grad Club");
        djug.setCity("London");
        djug.setStateOrProvince("ON");
        djug.setCountry("Canada");
        djug.setPostalCode("N6A 3K7");

        // Create an example user who is a member of Seattle JUG and attends all events
        User exampleUser = new User(
                "example-user-123",
                "John Smith",
                "john.smith@example.com");
        exampleUser.setProfilePictureUrl(imageService.generateRandomProfilePictureUrl("example-user-123"));
        userRepository.save(exampleUser);

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

            // Add the example user as an attendee to each event
            event.addAttendee(exampleUser);
            events.add(event);
        }

        djug.setEvents(events);

        // Add the example user to the Seattle JUG group
        djug.addUser(exampleUser);

        // Save everything in one transaction
        repository.save(djug);

        // System.out.println("Created example user: " + exampleUser.getName());
        repository.findAll().forEach(System.out::println);
    }
}