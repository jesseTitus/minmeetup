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
            // Use the seed as the image ID directly from Picsum for consistency
            // This ensures the same ID always returns the same image
            long imageId = (seed % 200) + 1; // Ensure it's between 1-200
            return String.format("https://picsum.photos/id/%d/300/200", imageId);
        } else {
            return "https://picsum.photos/300/200?random=" + random.nextInt(200);
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
            // Use hash of seed to get consistent image ID
            int hashCode = Math.abs(seed.hashCode());
            long imageId = (hashCode % 200) + 1; // Ensure it's between 1-200
            return String.format("https://picsum.photos/id/%d/50/50", imageId);
        } else {
            return "https://picsum.photos/50/50?random=" + random.nextInt(200);
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