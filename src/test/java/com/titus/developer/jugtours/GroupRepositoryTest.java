package com.titus.developer.jugtours;

import com.titus.developer.jugtours.model.Group;
import com.titus.developer.jugtours.model.GroupRepository;
import com.titus.developer.jugtours.model.User;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Optional;

@DataJpaTest
public class GroupRepositoryTest {

    @Autowired
    private GroupRepository groupRepository;

    @Test
    public void testSaveAndFindGroup() {
        Group group = new Group("Test Group");
        groupRepository.save(group);

        Group found = groupRepository.findByName("Test Group").orElse(null);
        assertThat(found).isNotNull();
        assertThat(found.getName()).isEqualTo("Test Group");
    }

    @Test
    public void testFindAllByIdReturnsOnlyUserGroups() {
        User user1 = new User("id1", "User One", "one@example.com");
        Group group1 = new Group("JUG Alpha");
        group1.getUsers().add(user1);
        Group group2 = new Group("JUG Beta");
        group2.getUsers().add(user1);
        groupRepository.save(group1);
        groupRepository.save(group2);

        List<Group> foundGroups = groupRepository.findAllByUserId("id1");
        assertThat(foundGroups).hasSize(2);
        assertThat(foundGroups).extracting("name").contains("JUG Alpha", "JUG Beta");
    }

    @Test
    public void testFindAllMembersByGroupId() {
        User user1 = new User("id1", "User One", "one@example.com");
        User user2 = new User("id2", "User Two", "two@example.com");
        Group group1 = new Group("JUG Alpha");
        group1.getUsers().add(user1);
        group1.getUsers().add(user2);
        groupRepository.save(group1);

        List<User> foundMembers = groupRepository.findAllMembersByGroupId(group1.getId());
        assertThat(foundMembers).hasSize(2);
        assertThat(foundMembers).extracting("name").contains("User One", "User Two");
    }

    // @Test
    // public void testDeleteGroup() {
    // Group group = new Group("ToDelete");
    // groupRepository.save(group);
    // groupRepository.delete(group);
    // Optional<Group> found = groupRepository.findByName("ToDelete");
    // assertThat(found).isEmpty();
    // }
}