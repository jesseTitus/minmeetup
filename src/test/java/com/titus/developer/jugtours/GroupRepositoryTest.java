package com.titus.developer.jugtours;

import com.titus.developer.jugtours.model.Group;
import com.titus.developer.jugtours.model.GroupRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

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
}