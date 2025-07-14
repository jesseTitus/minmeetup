package com.titus.developer.jugtours;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.titus.developer.jugtours.model.Group;
import com.titus.developer.jugtours.model.GroupRepository;
import com.titus.developer.jugtours.model.User;
import com.titus.developer.jugtours.model.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientAutoConfiguration"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class GroupControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private WebApplicationContext webApplicationContext;
    @Autowired
    private GroupRepository groupRepository;
    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private Group testGroup;

    @BeforeEach
    void setUp() {
        // Create and save a test user
        testUser = new User("test-user", "Test User", "testuser@example.com");
        testUser = userRepository.save(testUser);
        userRepository.flush();

        // Create and save a test group
        testGroup = new Group("Test Group");
        testGroup.setAddress("123 Test St");
        testGroup.setCity("Test City");
        testGroup.setCountry("Test Country");
        testGroup = groupRepository.save(testGroup);
    }

    @Test
    void testGetGroups() throws Exception {
        // Add user to group
        testGroup.addUser(testUser);
        groupRepository.save(testGroup);

        mockMvc.perform(get("/api/groups")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].name").value("Test Group"))
                .andExpect(jsonPath("$[0].address").value("123 Test St"));
    }

    @Test
    void testGetAvailableGroups() throws Exception {
        mockMvc.perform(get("/api/groups/available")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isNotEmpty())
                .andExpect(jsonPath("$[?(@.name == 'Test Group')]").exists())
                .andExpect(jsonPath("$[?(@.name == 'Test Group')].address").value("123 Test St"));
    }

    @Test
    void testGetGroupById() throws Exception {
        mockMvc.perform(get("/api/groups/" + testGroup.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(testGroup.getId()))
                .andExpect(jsonPath("$.name").value("Test Group"))
                .andExpect(jsonPath("$.address").value("123 Test St"));
    }

    @Test
    void testGetGroupByIdNotFound() throws Exception {
        mockMvc.perform(get("/api/groups/99999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateGroup() throws Exception {
        Group newGroup = new Group("New Test Group");
        newGroup.setAddress("456 New St");
        newGroup.setCity("New City");

        mockMvc.perform(post("/api/groups")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                }))
                .content(objectMapper.writeValueAsString(newGroup)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.name").value("New Test Group"))
                .andExpect(jsonPath("$.address").value("456 New St"));
    }

    @Test
    void testJoinGroup() throws Exception {
        mockMvc.perform(post("/api/groups/members/" + testGroup.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.name").value("Test Group"));

        // Verify user was added to group
        Group updatedGroup = groupRepository.findById(testGroup.getId()).orElse(null);
        assert updatedGroup != null;
        assert updatedGroup.hasUser("test-user");
    }

    @Test
    void testJoinGroupAlreadyMember() throws Exception {
        // Add user to group first
        testGroup.addUser(testUser);
        groupRepository.save(testGroup);

        mockMvc.perform(post("/api/groups/members/" + testGroup.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isOk())
                .andExpect(content().string("User is already a member of this group"));
    }

    @Test
    void testJoinGroupNotFound() throws Exception {
        mockMvc.perform(post("/api/groups/members/99999")
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isNotFound());
    }

    @Test
    void testLeaveGroup() throws Exception {
        // Add user to group first
        testGroup.addUser(testUser);
        groupRepository.save(testGroup);

        mockMvc.perform(delete("/api/groups/members/" + testGroup.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isOk());

        // Verify user was removed from group
        Group updatedGroup = groupRepository.findById(testGroup.getId()).orElse(null);
        assert updatedGroup != null;
        assert !updatedGroup.hasUser("test-user");
    }

    @Test
    void testLeaveGroupNotMember() throws Exception {
        mockMvc.perform(delete("/api/groups/members/" + testGroup.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .with(oauth2Login().attributes(attrs -> {
                    attrs.put("sub", "test-user");
                    attrs.put("name", "Test User");
                    attrs.put("email", "testuser@example.com");
                })))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("User is not a member of this group"));
    }

    // @Test
    // void testUpdateGroup() throws Exception {
    // Group updateData = new Group("Updated Group Name");
    // updateData.setAddress("789 Updated St");
    // updateData.setCity("Updated City");

    // mockMvc.perform(put("/api/groups/" + testGroup.getId())
    // .contentType(MediaType.APPLICATION_JSON)
    // .content(objectMapper.writeValueAsString(updateData)))
    // .andExpect(status().isOk())
    // .andExpect(content().contentType(MediaType.APPLICATION_JSON))
    // .andExpect(jsonPath("$.name").value("Updated Group Name"))
    // .andExpect(jsonPath("$.address").value("789 Updated St"));
    // }

    // @Test
    // void testDeleteGroup() throws Exception {
    // mockMvc.perform(delete("/api/groups/" + testGroup.getId())
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isOk());

    // // Verify group was deleted
    // assert groupRepository.findById(testGroup.getId()).isEmpty();
    // }
}