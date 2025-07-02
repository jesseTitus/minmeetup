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

    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private GroupRepository groupRepository;
    @Autowired
    private UserRepository userRepository;

    @Test
    public void testSaveAndFindUserByEmail() {
        User user = new User("id1", "User One", "one@example.com");
        userRepository.save(user);
        Optional<User> found = userRepository.findByEmail("one@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("User One");
    }

    @Test
    public void testSaveAndFindUserById() {
        User user = new User("id1", "User One", "one@example.com");
        userRepository.save(user);
        Optional<User> found = userRepository.findById("id1");
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("User One");
    }

    @Test
    public void testSaveAndFindUserByName() {
        User user = new User("id1", "User One", "one@example.com");
        userRepository.save(user);
        var found = userRepository.findByName("User One");
        assertThat(found).hasSize(1);
        assertThat(found).extracting("name").contains("User One");
    }

    @Test
    public void testSaveAndFindAllUsersBySameName() {
        User user1 = new User("id1", "User One", "one@example.com");
        User user2 = new User("id2", "User One", "two@example.com");
        userRepository.save(user1);
        userRepository.save(user2);
        var found = userRepository.findByName("User One");
        assertThat(found).hasSize(2);
        assertThat(found).extracting("email").contains("one@example.com", "two@example.com");
    }

    @Test
    public void testCannotSaveTwoUsersWithSameEmail() {
        User user1 = new User("id1", "User One", "one@example.com");
        User user2 = new User("id2", "User Two", "one@example.com");
        userRepository.save(user1);
        Exception exception = null;
        try {
            userRepository.saveAndFlush(user2);
        } catch (Exception ex) {
            exception = ex;
        }
        assertThat(exception).isNotNull();
    }

    @Test
    public void testDeleteUser() {
        User user1 = new User("id1", "ToDelete", "one@example.com");
        userRepository.save(user1);
        userRepository.delete(user1);
        var found = userRepository.findByName("ToDelete");
        assertThat(found).isEmpty();
    }
}
