package com.titus.developer.jugtours.model;

import com.titus.developer.jugtours.model.Event;
import com.titus.developer.jugtours.model.Group;
import com.titus.developer.jugtours.model.GroupRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collections;
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
        Event e = Event.builder()
                .title("Micro Frontends for Java Developers")
                .description("JHipster now has microfrontend support!")
                .date(Instant.parse("2022-09-13T17:00:00.000Z"))
                .group(djug)
                .build();
        djug.setEvents(Collections.singleton(e));
        repository.save(djug);

        repository.findAll().forEach(System.out::println);
    }
}