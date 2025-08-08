package com.titus.developer.jugtours.service;

import org.springframework.stereotype.Service;
import java.util.Random;

@Service
public class ImageService {

    private final Random random = new Random();

    /**
     * Generates a random image URL using Lorem Picsum
     * 
     * @param seed Optional seed for consistent images (e.g., group ID)
     * @return URL to a random image
     */
    public String generateRandomImageUrl(Long seed) {
        if (seed != null) {
            // Use seed for consistent random parameter
            return "https://picsum.photos/300/200?random=" + (seed % 10000);
        } else {
            return "https://picsum.photos/300/200?random=" + random.nextInt(10000);
        }
    }

    /**
     * Generates a random image URL without a specific seed
     * 
     * @return URL to a random image
     */
    public String generateRandomImageUrl() {
        return generateRandomImageUrl(null);
    }

    /**
     * Generates a random profile picture URL using Lorem Picsum
     * 
     * @param seed Optional seed for consistent images (e.g., user ID)
     * @return URL to a random profile picture
     */
    public String generateRandomProfilePictureUrl(String seed) {
        if (seed != null) {
            // Use hash of seed for consistent random parameter
            int hashCode = Math.abs(seed.hashCode());
            return "https://picsum.photos/50/50?random=" + (hashCode % 10000);
        } else {
            return "https://picsum.photos/50/50?random=" + random.nextInt(10000);
        }
    }

    /**
     * Generates a random profile picture URL without a specific seed
     * 
     * @return URL to a random profile picture
     */
    public String generateRandomProfilePictureUrl() {
        return generateRandomProfilePictureUrl(null);
    }
}