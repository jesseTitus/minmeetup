package com.titus.developer.jugtours.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.ToString;
import jakarta.persistence.*;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Data
@NoArgsConstructor
@RequiredArgsConstructor
@ToString
@Entity
@Table(name = "user_group")
public class Group {

    @Id
    @GeneratedValue
    private Long id;
    @Column(unique = true)
    @NonNull
    private String name;
    private String imageUrl;
    private String address;
    private String city;
    private String stateOrProvince;
    private String country;
    private String postalCode;
    @ManyToMany(cascade = CascadeType.PERSIST)
    @JoinTable(
        name = "group_members",
        joinColumns = @JoinColumn(name = "group_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @ToString.Exclude
    private Set<User> users = new java.util.HashSet<>();

    @OneToMany(mappedBy = "group", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @EqualsAndHashCode.Exclude // Exclude from hashCode/equals
    @JsonManagedReference
    @ToString.Exclude
    private Set<Event> events;

    // Helper methods for managing users
    public void addUser(User user) {
        if (user != null) {
            this.users.add(user);
        }
    }

    public void removeUser(User user) {
        if (user != null) {
            this.users.remove(user);
        }
    }

    public boolean hasUser(String userId) {
        return this.users.stream().anyMatch(user -> user.getId().equals(userId));
    }

    public boolean hasUser(User user) {
        return user != null && this.users.contains(user);
    }
}