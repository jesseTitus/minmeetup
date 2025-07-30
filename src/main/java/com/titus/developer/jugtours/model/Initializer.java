package com.titus.developer.jugtours.model;

import com.titus.developer.jugtours.service.ImageService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.Set;
import java.util.Arrays;
import java.util.List;

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
        // Skip initialization if data already exists
        if (repository.count() > 0) {
            System.out.println("Data already exists, skipping initialization.");
            return;
        }
        
        // List of 100 Canadian cities
        List<String> cities = Arrays.asList(
                "Toronto", "Montreal", "Calgary", "Ottawa", "Edmonton", "Winnipeg", "Mississauga", "Vancouver",
                "Brampton", "Hamilton",
                "Surrey", "Quebec City", "Halifax", "Laval", "London", "Markham", "Vaughan", "Gatineau", "Saskatoon",
                "Kitchener",
                "Longueuil", "Burnaby", "Windsor", "Regina", "Oakville", "Richmond", "Richmond Hill", "Burlington",
                "Oshawa", "Sherbrooke",
                "Greater Sudbury", "Abbotsford", "Lévis", "Coquitlam", "Barrie", "Saguenay", "Kelowna", "Guelph",
                "Trois-Rivières", "Whitby",
                "Cambridge", "St. Catharines", "Milton", "Langley", "Kingston", "Ajax", "Waterloo", "Terrebonne",
                "Saanich", "St. John's",
                "Thunder Bay", "Delta", "Brantford", "Chatham-Kent", "Clarington", "Red Deer", "Nanaimo",
                "Strathcona County", "Pickering", "Lethbridge",
                "Kamloops", "Saint-Jean-sur-Richelieu", "Niagara Falls", "Cape Breton", "Chilliwack", "Victoria",
                "Brossard", "Maple Ridge", "North Vancouver", "Newmarket",
                "Repentigny", "Peterborough", "Saint-Jérôme", "Moncton", "Drummondville", "Kawartha Lakes",
                "New Westminster", "Prince George", "Caledon");

        // Create John as the user who will attend all events
        User john = new User(
                "john-smith-123",
                "John Smith",
                "john.smith@example.com");
        john.setProfilePictureUrl(imageService.generateRandomProfilePictureUrl("john-smith-123"));
        userRepository.save(john);

        System.out.println("Creating " + cities.size() + " groups with 52 events each...");

        // Create groups for each city
        for (String cityName : cities) {
            Group group = new Group(cityName + " JUG");

            // Set location fields to "-" as requested
            group.setAddress("-");
            group.setCity("-");
            group.setStateOrProvince("-");
            group.setCountry("-");
            group.setPostalCode("-");

            group = repository.save(group); // Save to get ID
            group.setImageUrl(imageService.generateRandomImageUrl(group.getId())); // Set consistent image

            // Add John to this group
            group.addUser(john);

            // Create 52 events (weekly for a year)
            Set<Event> events = new HashSet<>();
            LocalDateTime startDate = LocalDateTime.now();

            for (int week = 0; week < 52; week++) {
                LocalDateTime eventDate = startDate.plusWeeks(week);
                Event event = Event.builder()
                        .title(cityName + " Weekly Java User Meetup")
                        .description(
                                "Join us for our weekly Java meetup in " + cityName
                                        + " where we discuss the latest in Java development, share knowledge, and network with fellow developers.")
                        .date(eventDate.toInstant(ZoneOffset.UTC))
                        .group(group)
                        .build();

                // Add John as an attendee to each event
                event.addAttendee(john);
                events.add(event);
            }

            group.setEvents(events);
            repository.save(group);

            // System.out.println("Created group: " + group.getName() + " with " +
            // events.size() + " events");
        }

        System.out.println("Initialization complete! Created " + cities.size() + " groups with " + (cities.size() * 52)
                + " total events.");
        System.out.println("John Smith is attending all events across all groups.");
    }
}