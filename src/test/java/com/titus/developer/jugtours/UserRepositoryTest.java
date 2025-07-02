package com.titus.developer.jugtours;

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
import java.util.Optional;

@DataJpaTest
public class UserRepositoryTest {

    // @Autowired
    // private EventRepository eventRepository;
    // @Autowired
    // private GroupRepository groupRepository;
    // @Autowired
    // private UserRepository userRepository;

    @Test
    public void testSaveAndFindUserByEmail() {
        // User user = new User("id1", "User One", "one@example.com");
        // userRepository.save(user);
        // Optional<User> found = userRepository.findByEmail("one@example.com");
        // assertThat(found).isPresent();
        // assertThat(found.get().getName()).isEqualTo("User One");
    }

}
