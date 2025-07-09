package com.titus.developer.jugtours;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.titus.developer.jugtours.model.Group;
import com.titus.developer.jugtours.model.GroupRepository;
import com.titus.developer.jugtours.model.User;
import com.titus.developer.jugtours.model.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
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

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
class GroupControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private User testUser;
    private Group testGroup;

    // @BeforeEach
    // void setUp() {
    // mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    // objectMapper = new ObjectMapper();

    // // Create test user
    // testUser = new User("test-user-123", "Test User", "test@example.com");
    // testUser = userRepository.save(testUser);

    // // Create test group
    // testGroup = new Group("Test Group");
    // testGroup.setAddress("123 Test St");
    // testGroup.setCity("Test City");
    // testGroup.setCountry("Test Country");
    // testGroup = groupRepository.save(testGroup);
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testGetGroups() throws Exception {
    // // Add user to group
    // testGroup.addUser(testUser);
    // groupRepository.save(testGroup);

    // mockMvc.perform(get("/api/groups")
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isOk())
    // .andExpect(content().contentType(MediaType.APPLICATION_JSON))
    // .andExpect(jsonPath("$[0].name").value("Test Group"))
    // .andExpect(jsonPath("$[0].address").value("123 Test St"));
    // }

    // @Test
    // void testGetAvailableGroups() throws Exception {
    // mockMvc.perform(get("/api/groups/available")
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isOk())
    // .andExpect(content().contentType(MediaType.APPLICATION_JSON))
    // .andExpect(jsonPath("$[0].name").value("Test Group"));
    // }

    // @Test
    // void testGetGroupById() throws Exception {
    // mockMvc.perform(get("/api/groups/" + testGroup.getId())
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isOk())
    // .andExpect(content().contentType(MediaType.APPLICATION_JSON))
    // .andExpect(jsonPath("$.id").value(testGroup.getId()))
    // .andExpect(jsonPath("$.name").value("Test Group"))
    // .andExpect(jsonPath("$.address").value("123 Test St"));
    // }

    // @Test
    // void testGetGroupByIdNotFound() throws Exception {
    // mockMvc.perform(get("/api/groups/99999")
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isNotFound());
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testCreateGroup() throws Exception {
    // Group newGroup = new Group("New Test Group");
    // newGroup.setAddress("456 New St");
    // newGroup.setCity("New City");

    // mockMvc.perform(post("/api/groups")
    // .contentType(MediaType.APPLICATION_JSON)
    // .content(objectMapper.writeValueAsString(newGroup)))
    // .andExpect(status().isOk())
    // .andExpect(content().contentType(MediaType.APPLICATION_JSON))
    // .andExpect(jsonPath("$.name").value("New Test Group"))
    // .andExpect(jsonPath("$.address").value("456 New St"));
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testJoinGroup() throws Exception {
    // mockMvc.perform(post("/api/groups/members/" + testGroup.getId())
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isOk())
    // .andExpect(content().contentType(MediaType.APPLICATION_JSON))
    // .andExpect(jsonPath("$.name").value("Test Group"));

    // // Verify user was added to group
    // Group updatedGroup =
    // groupRepository.findById(testGroup.getId()).orElse(null);
    // assert updatedGroup != null;
    // assert updatedGroup.hasUser("test-user-123");
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testJoinGroupAlreadyMember() throws Exception {
    // // Add user to group first
    // testGroup.addUser(testUser);
    // groupRepository.save(testGroup);

    // mockMvc.perform(post("/api/groups/members/" + testGroup.getId())
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isOk())
    // .andExpect(content().string("User is already a member of this group"));
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testJoinGroupNotFound() throws Exception {
    // mockMvc.perform(post("/api/groups/members/99999")
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isNotFound());
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testLeaveGroup() throws Exception {
    // // Add user to group first
    // testGroup.addUser(testUser);
    // groupRepository.save(testGroup);

    // mockMvc.perform(delete("/api/groups/members/" + testGroup.getId())
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isOk());

    // // Verify user was removed from group
    // Group updatedGroup =
    // groupRepository.findById(testGroup.getId()).orElse(null);
    // assert updatedGroup != null;
    // assert !updatedGroup.hasUser("test-user-123");
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
    // void testLeaveGroupNotMember() throws Exception {
    // mockMvc.perform(delete("/api/groups/members/" + testGroup.getId())
    // .contentType(MediaType.APPLICATION_JSON))
    // .andExpect(status().isBadRequest())
    // .andExpect(content().string("User is not a member of this group"));
    // }

    // @Test
    // @WithMockUser(username = "test-user-123")
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