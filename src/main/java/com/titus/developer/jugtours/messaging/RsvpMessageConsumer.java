package com.titus.developer.jugtours.messaging;

import com.titus.developer.jugtours.config.RabbitConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

// @Component
@ConditionalOnProperty(name = "rabbitmq.enabled", havingValue = "true", matchIfMissing = false)
public class RsvpMessageConsumer {
    
    private static final Logger log = LoggerFactory.getLogger(RsvpMessageConsumer.class);
    
    @RabbitListener(queues = RabbitConfig.RSVP_CONFIRMED_QUEUE)
    public void handleRsvpConfirmed(RsvpMessage message) {
        log.info("Processing RSVP confirmed: {}", message);
        
        // TODO: Business logic for confirmed RSVP
        // - Update database
        // - Send confirmation email
        // - Update event capacity
        
        try {
            // Simulate processing time
            Thread.sleep(1000);
            log.info("RSVP confirmed processed successfully for user: {}", message.getUserId());
        } catch (Exception e) {
            log.error("Error processing RSVP confirmed: {}", e.getMessage());
            // TODO: Handle error - maybe send to dead letter queue
        }
    }
    
    @RabbitListener(queues = RabbitConfig.WAITLIST_QUEUE)
    public void handleWaitlistAdded(RsvpMessage message) {
        log.info("Processing waitlist addition: {}", message);
        
        // TODO: Business logic for waitlist
        // - Add to waitlist table
        // - Send waitlist notification email
        // - Check waitlist position
        
        try {
            Thread.sleep(500);
            log.info("Waitlist addition processed successfully for user: {}", message.getUserId());
        } catch (Exception e) {
            log.error("Error processing waitlist addition: {}", e.getMessage());
        }
    }
    
    @RabbitListener(queues = RabbitConfig.RSVP_CANCELLED_QUEUE)
    public void handleRsvpCancelled(RsvpMessage message) {
        log.info("Processing RSVP cancellation: {}", message);
        
        // TODO: Business logic for cancellation
        // - Remove from attendees/waitlist
        // - Send cancellation confirmation
        // - Check if waitlist can be promoted
        
        try {
            Thread.sleep(500);
            log.info("RSVP cancellation processed successfully for user: {}", message.getUserId());
            
            // TODO: Promote next person from waitlist if space available
            // promoteFromWaitlist(message.getEventId());
            
        } catch (Exception e) {
            log.error("Error processing RSVP cancellation: {}", e.getMessage());
        }
    }
}