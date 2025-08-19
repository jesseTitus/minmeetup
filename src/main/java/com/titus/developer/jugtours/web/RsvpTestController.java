package com.titus.developer.jugtours.web;

import com.titus.developer.jugtours.messaging.RsvpMessage;
import com.titus.developer.jugtours.messaging.RsvpMessageProducer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// @RestController
@ConditionalOnProperty(name = "rabbitmq.enabled", havingValue = "true", matchIfMissing = false)
@RequestMapping("/api/test")
public class RsvpTestController {
    
    private final RsvpMessageProducer rsvpMessageProducer;
    
    public RsvpTestController(RsvpMessageProducer rsvpMessageProducer) {
        this.rsvpMessageProducer = rsvpMessageProducer;
    }
    
    @PostMapping("/rsvp/confirmed")
    public ResponseEntity<String> testRsvpConfirmed() {
        RsvpMessage message = new RsvpMessage(
            1L, 
            "test-user-123", 
            "Test User", 
            "test@example.com", 
            "CONFIRMED"
        );
        
        rsvpMessageProducer.sendRsvpConfirmed(message);
        return ResponseEntity.ok("RSVP confirmed message sent!");
    }
    
    @PostMapping("/rsvp/waitlist")
    public ResponseEntity<String> testWaitlist() {
        RsvpMessage message = new RsvpMessage(
            1L, 
            "test-user-456", 
            "Waitlist User", 
            "waitlist@example.com", 
            "WAITLIST"
        );
        
        rsvpMessageProducer.sendWaitlistAdded(message);
        return ResponseEntity.ok("Waitlist message sent!");
    }
}