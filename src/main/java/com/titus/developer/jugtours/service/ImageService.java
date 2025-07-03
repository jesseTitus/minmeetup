package com.titus.developer.jugtours.service;

import org.springframework.stereotype.Service;
import java.util.Random;

@Service
public class ImageService {
    
    private final Random random = new Random();
    
    /**
     * Generates a random image URL using Lorem Picsum
     * @param seed Optional seed for consistent images (e.g., group ID)
     * @return URL to a random image
     */
    public String generateRandomImageUrl(Long seed) {
        if (seed != null) {
            return String.format("https://picsum.photos/300/200?random=%d", seed);
        } else {
            return "https://picsum.photos/300/200?random=" + random.nextInt(1000);
        }
    }
    
    /**
     * Generates a random image URL without a specific seed
     * @return URL to a random image
     */
    public String generateRandomImageUrl() {
        return generateRandomImageUrl(null);
    }
} 